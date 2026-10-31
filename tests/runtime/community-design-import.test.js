import test from "node:test";
import assert from "node:assert/strict";
import { parseCommunityDesignCss } from "../../scripts/import-community-designs.mjs";
import { COMMUNITY_PRESETS, COMMUNITY_SURROUNDS, COMMUNITY_ASSET_FILES } from "../../src/shared/community-designs.js";
import { createCommunityDesignData } from "../../scripts/write-community-designs.mjs";
import { expandCommunityDesignEntries } from "../../src/shared/community-design-data.js";

test("factored metadata round-trips every public design, surround and asset without losing values", () => {
  const data = JSON.parse(JSON.stringify(createCommunityDesignData({
    presets: COMMUNITY_PRESETS, surrounds: COMMUNITY_SURROUNDS, assets: COMMUNITY_ASSET_FILES,
  })));
  assert.deepEqual(expandCommunityDesignEntries(data.presets, data.presetDefaults), COMMUNITY_PRESETS);
  assert.deepEqual(expandCommunityDesignEntries(data.surrounds, data.surroundDefaults), COMMUNITY_SURROUNDS);
  assert.deepEqual(data.assets, COMMUNITY_ASSET_FILES);
  assert.equal(data.presetDefaults.source, COMMUNITY_PRESETS[0].source);
  assert.deepEqual(data.presetDefaults.applyTo, ["scores", "throws", "names"]);
  assert.equal(data.presets.some((entry) => Object.hasOwn(entry, "source") || Object.hasOwn(entry, "applyTo")), false);
});

test("metadata factoring preserves missing, empty and different nested values and isolates shared arrays", () => {
  const presets = [
    { key: "first", applyTo: ["scores"], optional: "", custom: { color: "red" }, intensity: 0 },
    { key: "second", applyTo: ["scores"], custom: { color: "blue" }, intensity: 10 },
  ];
  const data = JSON.parse(JSON.stringify(createCommunityDesignData({ presets, surrounds: [], assets: {} })));
  const expanded = expandCommunityDesignEntries(data.presets, data.presetDefaults);
  assert.deepEqual(expanded, presets);
  expanded[0].applyTo.push("names");
  assert.deepEqual(expanded[1].applyTo, ["scores"]);
  assert.deepEqual(data.presetDefaults.applyTo, ["scores"]);
  assert.ok(Object.isFrozen(expanded));
  assert.deepEqual(expandCommunityDesignEntries(data.surrounds, data.surroundDefaults), []);
});

// Declaration excerpts from the pinned theme.zip, theme/AD_Board_Advantage.css.
// Preserve the documented example before the real value: it caused the lost image.
const boardAdvantageCss = `
:root {
  --theme-accent-color: 100, 100, 100;
  /* HOCHFORMAT BACKGROUND
     Für eigenes Bild z.B.:
     --background-portrait: url("");
  */
  --background-portrait: url("https://tobyleif.com/images/Boardgrafikbullsvertneu.jpg");
  --surface-player: linear-gradient(90deg, rgba(80, 80, 80, 0.9) 0%, rgba(0, 0, 0, 0.7) 100%) !important;
}
/* Spielerscore und Würfe X01 */
div.font-number.font-bold {
  color: rgba(255, 170, 10, 1);
  font-family: Helvetica, sans-serif;
}
/* Spieler */
span.font-display { color: rgba(255, 255, 255, 1); }
/* Checkout Suggestion */
div.relative.flex.justify-center.items-center.min-w-0.font-number.font-bold.leading-none.text-checkout-suggestion {
  -webkit-text-fill-color: rgba(255, 170, 10, 1) !important;
}
`;

test("import ignores commented portrait examples and preserves actual source colors", () => {
  const parsed = parseCommunityDesignCss(boardAdvantageCss);
  assert.equal(parsed.backgroundUrls.portrait, "https://tobyleif.com/images/Boardgrafikbullsvertneu.jpg");
  assert.equal(parsed.scoreColor, "#ffaa0a");
  assert.equal(parsed.secondaryTextColor, "#ffffff");
  assert.equal(parsed.throwLabelColor, "#ffaa0a");
  assert.equal(parsed.accentColor, "#646464");
  assert.equal(parsed.fontFamily, "Helvetica, sans-serif");
  assert.match(parsed.surfaceStyle.player, /^linear-gradient\(/);
  assert.doesNotMatch(parsed.surfaceStyle.player, /!important/);
});

test("import resolves native custom properties and safely falls back for absent rules", () => {
  const parsed = parseCommunityDesignCss(`:root {
    --theme-accent-color: 12, 34, 56;
    --text-score: rgb(var(--theme-accent-color));
    --theme-border-color: 30, 40, 50;
    --border-inactive-player: 1px solid rgba(var(--theme-border-color), 0.8);
    --surface-player: var(--cycle);
    --cycle: var(--surface-player);
    --background-game: url("https://example.com/game.png");
  }`);
  assert.equal(parsed.scoreColor, "#0c2238");
  assert.equal(parsed.secondaryTextColor, "#eeeeee");
  assert.equal(parsed.surfaceStyle.border, "1px solid rgba(30, 40, 50, 0.8)");
  assert.equal(parsed.surfaceStyle.player, "");
  assert.equal(parsed.backgroundUrls.game, "https://example.com/game.png");
  assert.equal(parsed.backgroundUrls.portrait, "");
});

test("generated public presets retain representative portrait assets and distinct source scores", () => {
  const preset = (key) => COMMUNITY_PRESETS.find((entry) => entry.key === key);
  for (const key of ["community-ad-board-advantage", "community-ad-green-forest", "community-ad-wood-mid", "community-ad-winmau-blade6"]) {
    assert.ok(COMMUNITY_ASSET_FILES[preset(key).backgroundAssets.portrait], key);
  }
  assert.equal(preset("community-ad-board-advantage").scoreColor, "#ffaa0a");
  assert.equal(preset("community-ad-board-advantage").throwLabelColor, "#ffaa0a");
  assert.equal(preset("community-ad-clean-green").scoreColor, "#00ff00");
  assert.equal(preset("community-ad-clean-red").scoreColor, "#ff0000");
  assert.equal(preset("community-ad-clean-lemon").scoreColor, "#ffff00");
});
