import test from "node:test";
import assert from "node:assert/strict";

import {
  PREVIEW_PLACEMENT as PREVIEW_X01,
  buildX01ThemeCss,
} from "../../src/features/themes/x01/style.js";
import {
  PREVIEW_PLACEMENT as PREVIEW_GOTCHA,
  buildGotchaThemeCss,
} from "../../src/features/themes/gotcha/style.js";
import {
  PREVIEW_PLACEMENT as PREVIEW_X01_TWO_PLAYER,
  buildX01TwoPlayerThemeCss,
} from "../../src/features/themes/x01-2player/style.js";
import { X01_TWO_PLAYER_STALE_REMAINING_CLASS } from "../../src/features/themes/x01-2player/scoreboard-state.js";
import {
  PREVIEW_PLACEMENT as PREVIEW_SHANGHAI,
  buildShanghaiThemeCss,
} from "../../src/features/themes/shanghai/style.js";
import {
  PREVIEW_PLACEMENT as PREVIEW_BERMUDA,
  buildBermudaThemeCss,
} from "../../src/features/themes/bermuda/style.js";
import {
  PREVIEW_PLACEMENT as PREVIEW_BULL_OFF,
  buildBullOffThemeCss,
} from "../../src/features/themes/bull-off/style.js";
import { buildCricketThemeCss } from "../../src/features/themes/cricket/style.js";
import { commonLayoutCss, commonThemeCss } from "../../src/features/themes/shared/common-css.js";
import { buildSharedPlayerDisplayCss } from "../../src/features/themes/shared/player-card-layout.js";
import {
  PLAYER_CARD_PART_ATTRIBUTE,
  PLAYER_CARD_PARTS,
} from "../../src/features/shared/player-card-parts.js";
import {
  buildThemeVisualSettingsCss,
  resolveThemeVisualSettingsConfig,
} from "../../src/features/themes/shared/theme-visuals.js";

function assertNoFragileLayoutSelectors(cssText) {
  assert.doesNotMatch(cssText, /\[data-ad-theme-slot=/);
  assert.doesNotMatch(cssText, /\[data-ad-theme-layout-root=/);
  assert.doesNotMatch(cssText, /:has\(/);
}

test("x01 two-player keeps turn totals stable and enlarges round information", () => {
  const css = buildX01TwoPlayerThemeCss({ showAvg: true });

  assert.match(
    css,
    /#ad-ext-turn\{[^}]*grid-template-columns:clamp\(5\.75rem,\s*7vw,\s*8rem\) repeat\(3,\s*minmax\(9\.5rem,\s*1fr\)\)/s
  );
  assert.match(
    css,
    /#ad-ext-turn\s+\.ad-ext-turn-points\{[^}]*display:block\s*!important;[^}]*width:100%\s*!important;[^}]*max-width:100%\s*!important;/s
  );
  assert.match(css, /--ad-ext-x01-2player-round-size:clamp\(2\.85rem,\s*14\.7cqi,/);
  assert.match(css, /--ad-ext-x01-2player-round-font-size:min\([^;]+2\.325rem\);/);
  assert.match(css, /--ad-ext-x01-2player-header-meta-font-size:clamp\(2\.205rem,/);
  assert.match(
    css,
    /\.chakra-stack\[data-ad-ext-x01-2player-stack="true"\][^{]*\[data-ad-ext-x01-2player-slot="score"\][^{]*\{[^}]*font-size:calc\(var\(--ad-ext-x01-2player-score-size\) \* var\(--ad-ext-x01-2player-score-scale\)\)\s*!important;/s
  );
});

test("x01 two-player spans the player display across all columns when it is the content-left hook", () => {
  const css = buildX01TwoPlayerThemeCss({ showAvg: true });

  assert.match(
    css,
    /\.css-tkevr6\s+\.ad-ext-theme-content-slot\s*>\s*\.ad-ext-theme-content-left,[^{]*\{[^}]*grid-column:1\s*\/\s*-1\s*!important;[^}]*grid-row:1\s*\/\s*-1\s*!important;[^}]*justify-self:stretch\s*!important;/s
  );
});

test("x01 theme keeps oldrepo preview and stat scaling anchors", () => {
  const css = buildX01ThemeCss({ showAvg: true });

  assert.equal(PREVIEW_X01.mode, "under-throws");
  assert.equal(PREVIEW_X01.activationMode, "autodarts-tools-zoom");
  assert.match(css, /ad-ext-turn-preview-space/);
  assert.match(css, /--ad-ext-stat-scale:\s*1\.2/);
  assert.match(
    css,
    /#ad-ext-player-display\s*>\s*\*\s*\{[^}]*flex:\s*1\s+1\s+0\s*!important;[^}]*display:\s*flex\s*!important;[^}]*align-items:\s*stretch\s*!important;/s
  );
  assert.match(
    css,
    /@supports\s*\(display:\s*contents\)\s*\{[^}]*#ad-ext-player-display\s*>\s*\*\s*\{[^}]*display:\s*contents\s*!important;/s
  );
  assert.match(
    css,
    /#ad-ext-player-display\s+\.ad-ext-player\s*\{[^}]*--ad-ext-player-score-size:\s*clamp\(4rem,\s*min\(20vw,\s*45vh\),\s*var\(--ad-ext-player-responsive-score-max\)\);[^}]*--ad-ext-player-avatar-size:\s*clamp\(2\.5rem,\s*min\(5vw,\s*8vh\),\s*var\(--ad-ext-player-responsive-avatar-max\)\);[^}]*--ad-ext-player-flag-size:\s*clamp\(\.75rem,\s*min\(1\.6vw,\s*2\.5vh\),\s*var\(--ad-ext-player-responsive-flag-max\)\);[^}]*--ad-ext-player-badge-line-block:\s*36px;[^}]*--ad-ext-player-score-name-align-block:\s*var\(--ad-ext-player-name-line-block\);[^}]*--ad-ext-player-score-name-align-anchor:\s*min\(var\(--ad-ext-player-avatar-size\),\s*calc\(var\(--ad-ext-player-name-line-block\)\s*\+\s*\.65rem\)\);[^}]*--ad-ext-player-score-name-align-offset:\s*max\(0px,\s*calc\(\(var\(--ad-ext-player-score-name-align-anchor\)\s*-\s*var\(--ad-ext-player-score-name-align-block\)\)\s*\/\s*2\)\);[^}]*flex:\s*var\(--ad-ext-player-flex\)\s+1\s+0\s*!important;[^}]*min-height:\s*clamp\(7\.25rem,\s*20cqb,\s*11rem\)\s*!important;[^}]*container-type:\s*size\s*!important;[^}]*container-name:\s*ad-ext-player-card\s*!important;/s
  );
  assert.match(
    css,
    /@supports\s*\(font-size:\s*1cqi\)\s*\{[^}]*#ad-ext-player-display\s+\.ad-ext-player\.ad-ext-player-active,\s*#ad-ext-player-display\s+\.ad-ext-player\.ad-ext-player-winner\{[^}]*min\(27cqi,\s*52cqb\)[^}]*--ad-ext-player-avatar-size:\s*clamp\(3rem,\s*min\(13cqi,\s*18cqb\),\s*var\(--ad-ext-player-responsive-avatar-active-max\)\);/s
  );
  assert.match(
    css,
    /#ad-ext-player-display\s+\.ad-ext-player\.ad-ext-player-active,\s*#ad-ext-player-display\s+\.ad-ext-player\.ad-ext-player-winner\{[^}]*min-height:\s*clamp\(12rem,\s*42cqb,\s*24rem\)\s*!important;/s
  );
  assert.match(
    css,
    /#ad-ext-player-display\s+\.ad-ext-player\.ad-ext-player-active,\s*#ad-ext-player-display\s+\.ad-ext-player\.ad-ext-player-winner\{[^}]*--ad-ext-player-score-name-align-block:\s*max\(var\(--ad-ext-player-name-line-block\),\s*var\(--ad-ext-player-badge-line-block\)\);/s
  );
  assert.match(
    css,
    /#ad-ext-player-display\s+\.ad-ext-player\.ad-ext-player-active,\s*#ad-ext-player-display\s+\.ad-ext-player\.ad-ext-player-winner\{[^}]*--ad-ext-player-score-name-align-anchor:\s*max\(var\(--ad-ext-player-avatar-size\),\s*3\.5rem\);/s
  );
  assert.match(
    css,
    /ad-ext-avg-trend-arrow\.ad-ext-avg-trend-up\s*\{[^}]*border-bottom:\s*calc\(var\(--ad-ext-avg-trend-arrow-height-base,\s*23px\)\s*\*\s*var\(--ad-ext-stat-scale\)\)\s*solid\s*#9fdb58;/s
  );
  assert.match(
    css,
    /#ad-ext-player-display\s+\.ad-ext-player\.ad-ext-player-active\s*>\s*\.chakra-stack,\s*#ad-ext-player-display\s+\.ad-ext-player\.ad-ext-player-winner\s*>\s*\.chakra-stack\s*\{[^}]*grid-template-rows:\s*max-content max-content\s*!important;[^}]*align-content:\s*center\s*!important;/s
  );
  assert.match(
    css,
    /#ad-ext-player-display\s+\.ad-ext-player\s*>\s*\.chakra-stack\s*\{[^}]*display:\s*grid\s*!important;[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s*max-content\s*!important;[^}]*align-items:\s*start\s*!important;[^}]*column-gap:\s*var\(--ad-ext-player-score-column-gap\)\s*!important;[^}]*row-gap:\s*0px\s*!important;[^}]*min-width:\s*0\s*!important;/s
  );
  assert.match(
    css,
    /#ad-ext-player-display\s+\.ad-ext-player\s*>\s*\.chakra-stack\s*>\s*\.chakra-stack\s*\{[^}]*min-width:\s*0\s*!important;[^}]*max-width:\s*100%\s*!important;[^}]*width:\s*100%\s*!important;[^}]*box-sizing:\s*border-box\s*!important;[^}]*overflow:\s*hidden\s*!important;/s
  );
  assert.match(
    css,
    /#ad-ext-player-display\s+\.ad-ext-player\s*>\s*\.chakra-stack\s*>\s*\.css-37hv00:not\(\[data-ad-ext-cricket-row="true"\]\)\s*\{[^}]*grid-column:\s*1\s*!important;[^}]*grid-row:\s*1\s*\/\s*2\s*!important;[^}]*align-self:\s*start\s*!important;/s
  );
  assert.match(
    css,
    /#ad-ext-player-display\s+\.ad-ext-player\s*>\s*\.chakra-stack\s*>\s*\[data-ad-ext-player-card-part="score"\],\s*#ad-ext-player-display\s+\.ad-ext-player\s*>\s*\.chakra-stack\s*>\s*\.css-xsngok\s*\{[^}]*grid-column:\s*2\s*!important;[^}]*grid-row:\s*1\s*\/\s*2\s*!important;[^}]*align-self:\s*start\s*!important;[^}]*overflow:\s*visible\s*!important;[^}]*padding:\s*var\(--ad-ext-player-score-name-align-offset\)\s*0\s*0\s*0\s*!important;/s
  );
  assert.match(
    css,
    /#ad-ext-player-display\s+\.ad-ext-player\s+\.css-37hv00:not\(\[data-ad-ext-cricket-row="true"\]\)\s*>\s*\.css-4rrvd0,\s*#ad-ext-player-display\s+\.ad-ext-player\s+\.css-37hv00:not\(\[data-ad-ext-cricket-row="true"\]\)\s*>\s*\.css-4rrvd0\s*>\s*\.css-z1uxps,\s*#ad-ext-player-display\s+\.ad-ext-player\s+\.css-37hv00:not\(\[data-ad-ext-cricket-row="true"\]\)\s+\.css-1igwmid\s*\{[^}]*min-width:\s*0\s*!important;[^}]*max-width:\s*100%\s*!important;[^}]*width:\s*100%\s*!important;[^}]*box-sizing:\s*border-box\s*!important;[^}]*overflow:\s*hidden\s*!important;/s
  );
  assert.match(
    css,
    /#ad-ext-player-display\s+\.ad-ext-player\s+\.ad-ext-player-name,\s*#ad-ext-player-display\s+\.ad-ext-player\s+\.ad-ext-player-name\s*>\s*p\s*\{[^}]*min-width:\s*0\s*!important;[^}]*overflow:\s*hidden\s*!important;[^}]*text-overflow:\s*ellipsis\s*!important;[^}]*white-space:\s*nowrap\s*!important;/s
  );
  assert.match(
    css,
    /#ad-ext-player-display\s+\.ad-ext-player\s+\.ad-ext-player-score\s*\{[^}]*line-height:\s*1\s*!important;[^}]*justify-self:\s*end\s*!important;[^}]*min-width:\s*max-content\s*!important;[^}]*overflow:\s*visible\s*!important;[^}]*white-space:\s*nowrap\s*!important;[^}]*margin:\s*0\s*!important;[^}]*padding:\s*0\s*!important;/s
  );
  assert.match(
    css,
    /#ad-ext-player-display,\s*#ad-ext-turn\s*\{[^}]*position:\s*relative\s*!important;[^}]*z-index:\s*7\s*!important;/s
  );
  assert.match(
    css,
    /#ad-ext-turn\s*\{[^}]*pointer-events:\s*none\s*!important;/s
  );
  assert.match(
    css,
    /#ad-ext-turn\s*>\s*\*\s*\{[^}]*pointer-events:\s*auto\s*!important;/s
  );
  assert.match(
    css,
    /#ad-ext-player-display\s+\.ad-ext-player\.ad-ext-player-active,\s*#ad-ext-player-display\s+\.ad-ext-player\.ad-ext-player-winner\s*\{[^}]*border:\s*2px\s+solid\s+var\(--ad-ext-theme-card-active-border-color\)\s*!important;[^}]*border-radius:\s*12px\s*!important;[^}]*box-shadow:\s*0\s+0\s+0\s+1px\s+var\(--ad-ext-theme-card-active-outline-color\)\s*!important;/s
  );
  assert.doesNotMatch(css, /\.css-hjw8x4\s*\{[^}]*max-height:\s*12%/s);
  assert.doesNotMatch(css, /css-y3hfdd\s*\{[^}]*height:\s*25%/s);
  assertNoFragileLayoutSelectors(css);
});

test("gotcha theme keeps x01 preview contracts and styles the live delta host semantically", () => {
  const css = buildGotchaThemeCss({});
  const leftAlignedCss = buildGotchaThemeCss({
    deltaAlignment: "left",
    deltaItalic: false,
  });
  const inlineCss = buildGotchaThemeCss({
    deltaPlacement: "inline-divider",
  });
  const inlineLeftCss = buildGotchaThemeCss({
    deltaPlacement: "inline-divider",
    deltaAlignment: "left",
  });

  assert.equal(PREVIEW_GOTCHA.mode, PREVIEW_X01.mode);
  assert.equal(PREVIEW_GOTCHA.activationMode, PREVIEW_X01.activationMode);
  assert.match(css, /autodarts-tools-gotcha\{[^}]*grid-column:2\s*!important;[^}]*grid-row:2\s*!important;[^}]*justify-self:end\s*!important;[^}]*font-style:italic\s*!important;[^}]*opacity:0\.65\s*!important;[^}]*font-variant-numeric:tabular-nums\s*!important;[^}]*white-space:nowrap\s*!important;/s);
  assert.match(css, /#ad-ext-player-display\s+\.ad-ext-player\s+\.ad-ext-player-score\{[^}]*grid-column:2\s*!important;[^}]*grid-row:1 \/ 2\s*!important;/s);
  assert.match(css, /#ad-ext-player-display\s+\.ad-ext-player\s*>\s*\.chakra-stack\{[^}]*grid-template-rows:max-content max-content\s*!important;/s);
  assert.match(css, /ad-ext-player-active\s+autodarts-tools-gotcha,\s*#ad-ext-player-display\s+\.ad-ext-player\.ad-ext-player-winner\s+autodarts-tools-gotcha\{[^}]*--chakra-colors-chakra-body-text:var\(--ad-ext-theme-score-active-color\);/s);
  assert.match(leftAlignedCss, /autodarts-tools-gotcha\{[^}]*justify-self:start\s*!important;[^}]*font-style:normal\s*!important;[^}]*text-align:left\s*!important;/s);
  assert.match(css, /autodarts-tools-gotcha\{[^}]*font-size:clamp\(0\.9rem,min\(2\.1vw,4\.2cqi,4\.8cqb\),1\.3rem\)\s*!important;/s);
  assert.match(inlineCss, /autodarts-tools-gotcha\{[^}]*display:inline-flex\s*!important;[^}]*grid-column:3\s*!important;[^}]*grid-row:1\s*!important;[^}]*justify-self:start\s*!important;[^}]*align-self:center\s*!important;[^}]*font-size:clamp\(1rem,min\(2\.25vw,4\.8cqi,5\.4cqb\),1\.42rem\)\s*!important;[^}]*line-height:0\.94\s*!important;[^}]*opacity:0\.70\s*!important;[^}]*white-space:nowrap\s*!important;[^}]*align-items:center\s*!important;/s);
  assert.match(inlineCss, /#ad-ext-player-display\s+\.ad-ext-player\s+\.ad-ext-player-score\{[^}]*grid-column:2\s*!important;[^}]*grid-row:1 \/ 2\s*!important;[^}]*align-self:end\s*!important;[^}]*white-space:nowrap\s*!important;/s);
  assert.match(inlineCss, /#ad-ext-player-display\s+\.ad-ext-player\s*>\s*\.chakra-stack\{[^}]*grid-template-columns:minmax\(0,\s*1fr\)\s*max-content\s*max-content\s*!important;[^}]*grid-template-rows:max-content max-content max-content\s*!important;[^}]*align-items:start\s*!important;[^}]*align-content:center\s*!important;[^}]*column-gap:clamp\(0\.36rem,0\.8vw,0\.6rem\)\s*!important;[^}]*row-gap:clamp\(0\.08rem,0\.18vh,0\.16rem\)\s*!important;/s);
  assert.match(inlineCss, /#ad-ext-player-display\s+\.ad-ext-player\s*>\s*\.chakra-stack\s*>\s*\.css-37hv00\{[^}]*grid-column:1 \/ 2\s*!important;[^}]*grid-row:1 \/ 2\s*!important;[^}]*align-self:end\s*!important;[^}]*min-width:0\s*!important;/s);
  assert.match(inlineCss, /#ad-ext-player-display\s+\.ad-ext-player\s*>\s*\.chakra-stack\s*>\s*\.css-1igwmid\{[^}]*grid-column:1 \/ 2\s*!important;[^}]*grid-row:2 \/ 3\s*!important;[^}]*align-self:start\s*!important;[^}]*min-width:0\s*!important;[^}]*padding-left:0\s*!important;[^}]*margin-top:0\s*!important;/s);
  assert.match(inlineCss, /#ad-ext-player-display\s+\.ad-ext-player\s*>\s*\.chakra-stack\s*>\s*\[data-ad-ext-x01-remaining-score-bar='true'\],\s*#ad-ext-player-display\s+\.ad-ext-player\s*>\s*\.chakra-stack\s*>\s*\.ad-ext-x01-remaining-score-bar--active,\s*#ad-ext-player-display\s+\.ad-ext-player\s*>\s*\.chakra-stack\s*>\s*\.ad-ext-x01-remaining-score-bar--inactive\{[^}]*grid-column:1 \/ -1\s*!important;[^}]*grid-row:3 \/ 4\s*!important;[^}]*align-self:start\s*!important;/s);
  assert.match(inlineCss, /autodarts-tools-gotcha::before\{[^}]*content:"\|"\s*!important;[^}]*opacity:0\.56\s*!important;/s);
  assert.match(inlineLeftCss, /autodarts-tools-gotcha\{[^}]*grid-column:2\s*!important;[^}]*grid-row:1\s*!important;[^}]*text-align:right\s*!important;/s);
  assert.match(inlineLeftCss, /#ad-ext-player-display\s+\.ad-ext-player\s+\.ad-ext-player-score\{[^}]*grid-column:3\s*!important;[^}]*grid-row:1 \/ 2\s*!important;/s);
  assert.match(inlineLeftCss, /autodarts-tools-gotcha::after\{[^}]*content:"\|"\s*!important;[^}]*opacity:0\.56\s*!important;/s);
  assertNoFragileLayoutSelectors(css);
});

test("x01 2player theme keeps stable board-first contracts without fragile layout selectors", () => {
  const css = buildX01TwoPlayerThemeCss({ showAvg: true });
  const cssWithLegacyHiddenAvg = buildX01TwoPlayerThemeCss({ showAvg: false });

  assert.equal(PREVIEW_X01_TWO_PLAYER.mode, "under-throws");
  assert.equal(PREVIEW_X01_TWO_PLAYER.activationMode, "autodarts-tools-zoom");
  assert.match(css, /ad-ext-turn-preview-space/);
  assert.match(
    css,
    /--ad-ext-x01-2player-column-gap:clamp\(0\.9rem,\s*1\.6vw,\s*1\.4rem\);[^}]*--ad-ext-x01-2player-center-min-width:48rem;[^}]*--ad-ext-x01-2player-side-width:clamp\(\s*17rem,\s*22vw,\s*min\(\s*23\.5rem,\s*calc\(\s*\(100vw - var\(--ad-ext-x01-2player-center-min-width\) - \(2 \* var\(--ad-ext-x01-2player-column-gap\)\)\)\s*\/ 2\s*\)\s*\)\s*\);[^}]*--ad-ext-x01-2player-live-turn-height:var\(--ad-ext-x01-2player-turn-height\);[^}]*--ad-ext-x01-2player-throw-points-size:clamp\(1\.2rem,\s*1\.8vw,\s*1\.65rem\);[^}]*--ad-ext-x01-2player-throw-text-size:var\(--chakra-fontSizes-2xl,\s*1\.5rem\);[^}]*--ad-ext-x01-2player-live-throw-points-size:calc\(var\(--ad-ext-x01-2player-throw-text-size\) \* 1\.7\);[^}]*--ad-ext-x01-2player-turn-clearance:clamp\(0\.85rem,\s*1\.25vh,\s*1\.15rem\);[^}]*--ad-ext-x01-2player-controls-height:clamp\(1\.95rem,\s*3\.2vh,\s*2\.3rem\);[^}]*--ad-ext-x01-2player-board-gap:clamp\(0\.32rem,\s*0\.6vh,\s*0\.52rem\);[^}]*--ad-ext-x01-2player-board-top-pad:calc\(\s*var\(--ad-ext-x01-2player-live-turn-height\)\s*\+\s*var\(--ad-ext-x01-2player-turn-clearance\)\s*\+\s*var\(--ad-ext-x01-2player-controls-height\)\s*\+\s*var\(--ad-ext-x01-2player-board-gap\)\s*\);/s
  );
  assert.match(
    css,
    /@media screen and \(min-width: 48em\)\{\s*:root\{[^}]*--ad-ext-x01-2player-throw-text-size:var\(--chakra-fontSizes-5xl,\s*3rem\);/s
  );
  assert.match(css, /--theme-player-badge-bg:transparent;[^}]*--theme-player-name-bg:transparent;[^}]*--theme-current-bg:transparent;/s);
  assert.match(
    css,
    /--ad-ext-theme-score-inactive-color:var\(--ad-ext-theme-meta-inactive-color\);/
  );
  assert.match(
    css,
    /#ad-ext-player-display\s+\.ad-ext-player\s*\{[^}]*--ad-ext-x01-2player-state-scale:1;[^}]*--ad-ext-x01-2player-score-scale:var\(--ad-ext-x01-2player-density-score-scale\);[^}]*--ad-ext-x01-2player-avatar-size:calc\(clamp\(2\.6rem,\s*16cqi,\s*3\.75rem\) \* var\(--ad-ext-x01-2player-identity-scale\)\);[^}]*min-height:var\(--ad-ext-x01-2player-density-min-height\)\s*!important;/s
  );
  assert.match(
    css,
    /#ad-ext-player-display\s+\.ad-ext-player\.ad-ext-player-active,\s*#ad-ext-player-display\s+\.ad-ext-player\.ad-ext-player-winner\{[^}]*--ad-ext-x01-2player-state-scale:1;[^}]*--ad-ext-x01-2player-score-scale:var\(--ad-ext-x01-2player-density-score-scale\);[^}]*box-shadow:\s*inset 0 0 0 var\(--ad-ext-x01-2player-inner-outline-width\)/s
  );
  assert.match(
    css,
    /#ad-ext-player-display\s+\.ad-ext-player\.ad-ext-player-inactive,\s*#ad-ext-player-display\s+\.ad-ext-player:not\(\.ad-ext-player-active\):not\(\.ad-ext-player-winner\)\{[^}]*--ad-ext-x01-2player-state-scale:1;[^}]*--ad-ext-x01-2player-score-scale:var\(--ad-ext-x01-2player-density-score-scale\);/s
  );
  assert.match(
    css,
    /#ad-ext-player-display\s*>\s*\[data-ad-ext-x01-2player-player-wrapper="true"\]\s*\{[^}]*display:flex\s*!important;[^}]*pointer-events:auto\s*!important;/s
  );
  assert.match(
    css,
    /#ad-ext-player-display\s*>\s*\[data-ad-ext-x01-2player-player-index="0"\]\s*\{[^}]*grid-column:1\s*!important;/s
  );
  assert.match(
    css,
    /#ad-ext-player-display\s*>\s*\[data-ad-ext-x01-2player-player-index="1"\]\s*\{[^}]*grid-column:3\s*!important;/s
  );
  assert.match(
    css,
    /\.ad-ext-theme-content-board\{[^}]*grid-column:2\s*!important;[^}]*grid-row:1 \/ -1\s*!important;[^}]*pointer-events:none\s*!important;/s
  );
  assert.match(
    css,
    /\.ad-ext-theme-content-slot\{[^}]*grid-template-rows:max-content max-content minmax\(0,\s*1fr\)\s*!important;[^}]*align-content:stretch\s*!important;/s
  );
  assert.match(
    css,
    /#ad-ext-player-display\{[^}]*grid-row:2 \/ -1\s*!important;[^}]*height:100%\s*!important;[^}]*max-height:none\s*!important;/s
  );
  assert.match(
    css,
    /#ad-ext-player-display\s*>\s*\[data-ad-ext-x01-2player-player-wrapper="true"\]\{[^}]*min-height:0\s*!important;[^}]*height:100%\s*!important;[^}]*max-height:100%\s*!important;[^}]*display:flex\s*!important;/s
  );
  assert.match(
    css,
    /\.ad-ext-theme-content-board\s*>\s*\*\{[^}]*pointer-events:auto\s*!important;/s
  );
  assert.match(
    css,
    /\[data-ad-ext-x01-2player-stack="true"\]\{[^}]*grid-template-columns:var\(--ad-ext-x01-2player-round-size\) minmax\(0,\s*1fr\)\s*!important;[^}]*grid-template-rows:minmax\(var\(--ad-ext-x01-2player-round-size\),\s*max-content\) max-content minmax\(var\(--ad-ext-x01-2player-score-min-block-size\),\s*max-content\) max-content\s*!important;[^}]*column-gap:clamp\(0\.5rem,\s*2\.4cqi,\s*0\.75rem\)\s*!important;[^}]*isolation:isolate\s*!important;/s
  );
  assert.match(
    css,
    /Final slot-order guard:[\s\S]*?#ad-ext-player-display\s+\.ad-ext-player\s*>\s*\.chakra-stack\[data-ad-ext-x01-2player-stack="true"\]\{[\s\S]*?grid-template-columns:minmax\(0,\s*1fr\)\s*!important;[\s\S]*?grid-template-rows:minmax\(var\(--ad-ext-x01-2player-round-size\),\s*max-content\) max-content minmax\(var\(--ad-ext-x01-2player-score-min-block-size\),\s*max-content\) max-content\s*!important;[\s\S]*?grid-template-areas:\s*"meta"\s*"identity"\s*"score"\s*"progress"\s*!important;/s
  );
  assert.match(
    css,
    /\.chakra-stack\[data-ad-ext-x01-2player-stack="true"\]\s*>\s*\.css-1igwmid:not\(\[data-ad-ext-x01-2player-slot\]\)\{[^}]*grid-column:1\s*!important;[^}]*grid-row:1\s*!important;[^}]*display:flex\s*!important;[^}]*justify-content:flex-end\s*!important;[^}]*min-height:var\(--ad-ext-x01-2player-round-size\)\s*!important;[^}]*padding:0 0 0 calc\(var\(--ad-ext-x01-2player-round-size\) \+ clamp\(0\.42rem,\s*1\.6cqi,\s*0\.68rem\)\)\s*!important;/s
  );
  assert.match(
    css,
    /\.chakra-stack\[data-ad-ext-x01-2player-stack="true"\]\s*>\s*\[data-ad-ext-x01-2player-slot="identity"\]\{[^}]*grid-area:identity\s*!important;[^}]*grid-row:2\s*!important;[^}]*padding-block-start:clamp\(0\.16rem,\s*0\.4vh,\s*0\.3rem\)\s*!important;/s
  );
  assert.match(
    css,
    /\[data-ad-ext-x01-2player-slot="identity"\]\{[^}]*grid-column:1 \/ -1\s*!important;[^}]*grid-row:2\s*!important;[^}]*display:block\s*!important;[^}]*padding:0\s*!important;[^}]*overflow:visible\s*!important;[^}]*background:transparent\s*!important;/s
  );
  assert.match(
    css,
    /\[data-ad-ext-x01-2player-slot="identity"\]\s*>\s*:first-child\{[^}]*position:absolute\s*!important;[^}]*top:0\s*!important;[^}]*right:auto\s*!important;[^}]*left:0\s*!important;/s
  );
  assert.match(
    css,
    /#ad-ext-player-display\s+\.ad-ext-player\s+\.ad-ext-player-name,\s*#ad-ext-player-display\s+\.ad-ext-player\s+\.ad-ext-player-name\s*>\s*p\{[^}]*display:block\s*!important;[^}]*font-size:calc\(var\(--ad-ext-x01-2player-player-name-font-size\) \* var\(--ad-ext-x01-2player-density-name-scale\)\)\s*!important;[^}]*line-height:0\.95\s*!important;[^}]*font-weight:800\s*!important;[^}]*text-align:center\s*!important;/s
  );
  assert.match(
    css,
    /#ad-ext-player-display\s+\.ad-ext-player\s+\.ad-ext-player-name\s*>\s*p,\s*#ad-ext-player-display\s+\.ad-ext-player\s+\.chakra-text\.css-11cuipc\{[^}]*display:inline-block\s*!important;[^}]*width:auto\s*!important;[^}]*white-space:nowrap\s*!important;[^}]*overflow:visible\s*!important;[^}]*text-overflow:clip\s*!important;/s
  );
  assert.match(
    css,
    /#ad-ext-player-display\s+\.ad-ext-player\s+\.css-g0ywsj,\s*#ad-ext-player-display\s+\.ad-ext-player\s+\.css-g0ywsj\s*>\s*p\{[^}]*display:block\s*!important;[^}]*min-width:0\s*!important;[^}]*width:100%\s*!important;[^}]*align-self:center\s*!important;/s
  );
  assert.match(
    css,
    /#ad-ext-player-display\s+\.ad-ext-player\s+\.chakra-text\.css-11cuipc\{[^}]*font-size:inherit\s*!important;[^}]*line-height:inherit\s*!important;[^}]*text-transform:inherit\s*!important;[^}]*text-align:inherit\s*!important;/s
  );
  assert.match(
    css,
    /#ad-ext-player-display\s+\.ad-ext-player\s+\.css-1k3nd6z\s*>\s*span\.css-3fr5p8,\s*#ad-ext-player-display\s+\.ad-ext-player\s+\.css-1k3nd6z\s*>\s*\.css-3fr5p8,[^{]*\[data-ad-ext-player-card-part="round-badge"\]\{[^}]*display:flex\s*!important;[^}]*justify-content:center\s*!important;[^}]*width:var\(--ad-ext-x01-2player-round-size\)\s*!important;[^}]*height:var\(--ad-ext-x01-2player-round-size\)\s*!important;[^}]*background:#8fe28d\s*!important;[^}]*background-image:linear-gradient\(180deg,\s*#a8ef7d 0%,\s*#87dc62 100%\)\s*!important;[^}]*visibility:visible\s*!important;/s
  );
  assert.match(
    css,
    /#ad-ext-player-display\s+\.ad-ext-player\s+\.css-1k3nd6z\s*>\s*\.css-3fr5p8,\s*#ad-ext-player-display\s+\.ad-ext-player\s+\.css-1cmgsw8\s*>\s*\.css-3fr5p8,\s*#ad-ext-player-display\s+\.ad-ext-player\s+\[data-ad-ext-player-card-part="round-badge"\]\{[^}]*display:inline-grid\s*!important;[^}]*inline-size:var\(--ad-ext-x01-2player-round-size\)\s*!important;[^}]*block-size:var\(--ad-ext-x01-2player-round-size\)\s*!important;[^}]*aspect-ratio:1 \/ 1\s*!important;[^}]*background:linear-gradient\(180deg,\s*#a8ef7d 0%,\s*#87dc62 100%\)\s*!important;[^}]*background-color:#8fe28d\s*!important;[^}]*color:#142112\s*!important;/s
  );
  assert.match(
    css,
    /#ad-ext-player-display\s+\.ad-ext-player\s+\.css-1k3nd6z\s*>\s*\.css-3fr5p8\s*>\s*p,\s*#ad-ext-player-display\s+\.ad-ext-player\s+\.css-1cmgsw8\s*>\s*\.css-3fr5p8\s*>\s*p,\s*#ad-ext-player-display\s+\.ad-ext-player\s+\[data-ad-ext-player-card-part="round-badge"\]\s*>\s*p\{[^}]*font-size:var\(--ad-ext-x01-2player-round-font-size\)\s*!important;[^}]*line-height:1\s*!important;[^}]*font-weight:800\s*!important;[^}]*color:inherit\s*!important;/s
  );
  assert.match(
    css,
    /\[data-ad-ext-x01-2player-slot="identity"\]\s*>\s*:last-child\s*>\s*span\{[^}]*display:grid\s*!important;[^}]*grid-template-columns:max-content minmax\(0,\s*1fr\)\s*!important;[^}]*align-items:center\s*!important;/s
  );
  assert.match(
    css,
    new RegExp(
      `\\[data-ad-ext-x01-2player-slot="identity"\\]\\s*>\\s*:last-child\\s*>\\s*span\\s*>\\s*\\[data-ad-ext-player-card-part="${PLAYER_CARD_PARTS.identityMedia}"\\]\\{[^}]*display:inline-flex\\s*!important;[^}]*width:max-content\\s*!important;[^}]*overflow:visible\\s*!important;`,
      "s"
    )
  );
  assert.match(
    css,
    new RegExp(
      `#ad-ext-player-display\\s+\\.ad-ext-player\\s+\\[data-ad-ext-player-card-part="${PLAYER_CARD_PARTS.flag}"\\],\\s*#ad-ext-player-display\\s+\\.ad-ext-player\\s+\\.chakra-image\\.css-6t0bzd\\{[^}]*display:block\\s*!important;[^}]*width:var\\(--ad-ext-x01-2player-flag-size\\)\\s*!important;`,
      "s"
    )
  );
  assert.match(
    css,
    /\[data-ad-ext-x01-2player-slot="identity"\]\s*>\s*:last-child\s*>\s*span\s*>\s*:last-child\{[^}]*grid-column:2\s*!important;[^}]*display:grid\s*!important;[^}]*width:100%\s*!important;[^}]*grid-template-columns:minmax\(0,\s*1fr\) max-content\s*!important;[^}]*align-items:center\s*!important;/s
  );
  assert.match(
    css,
    /\[data-ad-ext-x01-2player-slot="identity"\]\s*>\s*:last-child\s*>\s*span\s*>\s*:last-child\s*>\s*\.ad-ext-player-name,\s*#ad-ext-player-display\s+\.ad-ext-player\s*>\s*\[data-ad-ext-x01-2player-stack="true"\]\s*>\s*\[data-ad-ext-x01-2player-slot="identity"\]\s*>\s*:last-child\s*>\s*span\s*>\s*:last-child\s*>\s*\.css-g0ywsj\{[^}]*grid-column:1\s*!important;[^}]*justify-self:stretch\s*!important;[^}]*overflow:hidden\s*!important;/s
  );
  assert.match(
    css,
    /\[data-ad-ext-x01-2player-slot="identity"\]\s*>\s*:last-child\s*>\s*span\s*>\s*:last-child\s*>\s*\.chakra-badge,\s*#ad-ext-player-display\s+\.ad-ext-player\s*>\s*\[data-ad-ext-x01-2player-stack="true"\]\s*>\s*\[data-ad-ext-x01-2player-slot="identity"\]\s*>\s*:last-child\s*>\s*span\s*>\s*:last-child\s*>\s*\.css-n2903v,\s*#ad-ext-player-display\s+\.ad-ext-player\s*>\s*\[data-ad-ext-x01-2player-stack="true"\]\s*>\s*\[data-ad-ext-x01-2player-slot="identity"\]\s*>\s*:last-child\s*>\s*span\s*>\s*:last-child\s*>\s*\[data-ad-ext-player-card-part="profile-badge"\]\{[^}]*grid-column:2\s*!important;[^}]*display:inline-grid\s*!important;[^}]*width:auto\s*!important;[^}]*font-size:clamp\(0\.72rem,\s*3\.6cqi,\s*1rem\)\s*!important;/s
  );
  assert.match(
    css,
    /#ad-ext-player-display\s+\.ad-ext-player\s+\.chakra-badge,\s*#ad-ext-player-display\s+\.ad-ext-player\s+\[data-ad-ext-player-card-part="profile-badge"\]\{[^}]*background:var\(--ad-ext-theme-profile-badge-bg,\s*rgba\(226,\s*232,\s*240,\s*0\.18\)\)\s*!important;[^}]*color:var\(--ad-ext-theme-profile-badge-color,\s*#f8fafc\)\s*!important;[^}]*border-radius:2px\s*!important;/s
  );
  assert.match(
    css,
    /#ad-ext-player-display\s+\.ad-ext-player\s+\.chakra-badge,\s*#ad-ext-player-display\s+\.ad-ext-player\s+\[data-ad-ext-player-card-part="profile-badge"\]\{[^}]*font-size:30px\s*!important;[^}]*font-weight:700\s*!important;[^}]*line-height:1\.2\s*!important;/s
  );
  assert.match(
    css,
    /\[data-ad-ext-x01-2player-slot="score"\],\s*#ad-ext-player-display\s+\.ad-ext-player\s*>\s*\[data-ad-ext-x01-2player-stack="true"\]\s*>\s*\[data-ad-ext-x01-2player-slot="score"\]\s*>\s*p\{[^}]*grid-row:3\s*!important;[^}]*display:grid\s*!important;[^}]*min-block-size:var\(--ad-ext-x01-2player-score-min-block-size\)\s*!important;[^}]*padding-block:var\(--ad-ext-x01-2player-score-pad-block\)\s*!important;[^}]*font-size:calc\(var\(--ad-ext-x01-2player-score-size\)\s*\*\s*var\(--ad-ext-x01-2player-score-scale\)\)\s*!important;[^}]*line-height:0\.9\s*!important;[^}]*text-align:center\s*!important;[^}]*color:var\(--ad-ext-theme-meta-inactive-color\)\s*!important;[^}]*overflow:visible\s*!important;/s
  );
  assert.match(
    css,
    /\[data-ad-ext-x01-2player-slot="score"\]\.ad-ext-player-score,\s*#ad-ext-player-display\s+\.ad-ext-player\s*>\s*\[data-ad-ext-x01-2player-stack="true"\]\s*>\s*\[data-ad-ext-x01-2player-slot="score"\]\s*>\s*\.ad-ext-player-score,\s*#ad-ext-player-display\s+\.ad-ext-player\s*>\s*\[data-ad-ext-x01-2player-stack="true"\]\s*>\s*\[data-ad-ext-x01-2player-slot="score"\]\s*>\s*p\{[^}]*width:max-content\s*!important;[^}]*min-width:max-content\s*!important;[^}]*max-width:none\s*!important;[^}]*white-space:nowrap\s*!important;[^}]*overflow:visible\s*!important;/s
  );
  assert.match(
    css,
    /\[data-ad-ext-x01-2player-slot="progress"\]\{[^}]*grid-row:4\s*!important;[^}]*min-block-size:var\(--ad-ext-x01-2player-progress-min-block-size\)\s*!important;[^}]*padding-block-start:var\(--ad-ext-x01-2player-progress-pad-block-start\)\s*!important;[^}]*margin-top:var\(--ad-ext-x01-2player-progress-gap\)\s*!important;/s
  );
  assert.match(
    css,
    /\[data-ad-ext-x01-2player-slot="progress"\]\[data-ad-ext-x01-remaining-score-bar-size="breit"\]\{[^}]*--ad-ext-x01-2player-progress-min-block-size:calc\(clamp\(1\.08rem,\s*1\.9vw,\s*1\.4rem\) \+ var\(--ad-ext-x01-2player-progress-pad-block-start\)\);/s
  );
  assert.match(
    css,
    /\.ad-ext-player\.ad-ext-player-inactive\s*>\s*\.chakra-stack\[data-ad-ext-x01-remaining-score-bar-stack="true"\]\[data-ad-ext-x01-2player-stack="true"\],[^}]*\.ad-ext-player:not\(\.ad-ext-player-active\):not\(\.ad-ext-player-winner\)\s*>\s*\.chakra-stack\[data-ad-ext-x01-remaining-score-bar-stack="true"\]\[data-ad-ext-x01-2player-stack="true"\]\{[^}]*min-height:max-content\s*!important;[^}]*height:auto\s*!important;[^}]*padding:0\s*!important;/s
  );
  assert.match(
    css,
    /\.ad-ext-player\.ad-ext-player-inactive\s*>\s*\.chakra-stack\[data-ad-ext-x01-remaining-score-bar-stack="true"\]\[data-ad-ext-x01-2player-stack="true"\]\s*>\s*\[data-ad-ext-x01-2player-slot="score"\],[^}]*line-height:0\.9\s*!important;[^}]*align-self:stretch\s*!important;[^}]*overflow:visible\s*!important;[^}]*color:var\(--ad-ext-theme-meta-inactive-color\)\s*!important;/s
  );
  assert.match(
    css,
    /\[data-ad-ext-theme-x01-2player-active="true"\],\s*#ad-ext-player-display\s+\.ad-ext-player\.ad-ext-player-winner\{[^}]*border:var\(--ad-ext-x01-2player-card-border-width\) solid var\(--ad-ext-theme-card-active-border-color\)\s*!important;/s
  );
  assert.match(
    css,
    /#ad-ext-player-display\s+\.ad-ext-player\[data-ad-ext-theme-x01-2player-active="true"\]\s*>\s*\[data-ad-ext-x01-2player-stack="true"\]\s*>\s*\[data-ad-ext-x01-2player-slot="score"\][^}]*color:var\(--ad-ext-theme-score-active-color\)\s*!important;/s
  );
  assert.match(
    css,
    /#ad-ext-player-display\s+\.ad-ext-player\.ad-ext-player-winner\s*>\s*\[data-ad-ext-x01-2player-stack="true"\]\s*>\s*\[data-ad-ext-x01-2player-slot="score"\][^}]*color:var\(--ad-ext-theme-score-active-color\)\s*!important;/s
  );
  assert.match(
    css,
    /#ad-ext-player-display\s+\.ad-ext-player\[data-ad-ext-theme-x01-2player-active="false"\],\s*#ad-ext-player-display\s+\.ad-ext-player\[data-ad-ext-theme-x01-2player-active="false"\]\.ad-ext-player-active\{[^}]*border:var\(--ad-ext-x01-2player-card-border-width\) solid var\(--ad-ext-theme-card-inactive-border-color\)\s*!important;/s
  );
  assert.match(css, /data-ad-ext-x01-2player-visual-style="broadcast"/);
  assert.match(css, /data-ad-ext-x01-2player-color-scheme="midnight-blue"/);
  assert.match(css, /data-ad-ext-x01-2player-information-density="tv"/);
  assert.match(css, /data-ad-ext-x01-2player-identity-density="name-only"/);
  assert.match(
    css,
    /data-ad-ext-x01-2player-identity-density="name-only"[^{}]*:first-child:not\(:last-child\)[^{}]*,.*data-ad-ext-player-card-part="identity-media"[^{}]*,.*\.chakra-badge[^{}]*,.*data-ad-ext-player-card-part="profile-badge"[^{}]*\{[^}]*display:none\s*!important;/s
  );
  assert.doesNotMatch(css, /data-ad-ext-x01-2player-identity-density="compact"/);
  assert.doesNotMatch(
    cssWithLegacyHiddenAvg,
    /p\.chakra-text\.css-1j0bqop\s*\{[^}]*display:none\s*!important;/s
  );
  assert.match(
    cssWithLegacyHiddenAvg,
    /\[data-ad-ext-x01-2player-stack="true"\]\s*>\s*\.css-1igwmid:not\(\[data-ad-ext-x01-2player-slot\]\)\{[^}]*display:flex\s*!important;/s
  );
  assert.match(
    css,
    /data-ad-ext-x01-2player-name-layout="two-lines"[^}]*-webkit-line-clamp:2\s*!important;[^}]*line-clamp:2\s*!important;/s
  );
  assert.match(css, /overflow-wrap:anywhere\s*!important;/);
  assert.doesNotMatch(css, /@import\s+url|url\(\s*["']?https?:/i);
  assert.doesNotMatch(css, /transform:\s*scale\(/i);
  assert.match(
    css,
    /#ad-ext-turn\s*\{[^}]*grid-template-columns:clamp\(5\.75rem,\s*7vw,\s*8rem\) repeat\(3,\s*minmax\(9\.5rem,\s*1fr\)\)\s*!important;/s
  );
  assert.match(
    css,
    /#ad-ext-turn\s*>\s*:first-child\{[^}]*padding-inline:0\s*!important;[^}]*overflow:visible\s*!important;/s
  );
  assert.match(
    css,
    /#ad-ext-turn\s*>\s*\.score\{[^}]*font-size:var\(--ad-ext-x01-2player-live-throw-points-size\)\s*!important;/s
  );
  assert.match(
    css,
    /#ad-ext-turn\s+\.ad-ext-turn-points\{[^}]*min-width:0\s*!important;[^}]*width:100%\s*!important;[^}]*max-width:100%\s*!important;[^}]*padding-inline:clamp\(0\.24rem,\s*0\.48vw,\s*0\.42rem\)\s*!important;[^}]*font-size:var\(--ad-ext-x01-2player-live-throw-points-size\)\s*!important;[^}]*font-weight:800\s*!important;[^}]*line-height:1\s*!important;/s
  );
  assert.match(
    css,
    /#ad-ext-turn\s*\{[^}]*pointer-events:none\s*!important;/s
  );
  assert.match(
    css,
    /#ad-ext-turn\s*>\s*\*\s*\{[^}]*pointer-events:auto\s*!important;/s
  );
  assert.match(
    css,
    /#ad-ext-turn\s*>\s*\.ad-ext-turn-throw\{[^}]*display:flex\s*!important;[^}]*font-size:var\(--ad-ext-x01-2player-throw-points-size\)\s*!important;[^}]*line-height:1\s*!important;/s
  );
  assert.match(
    css,
    /\.chakra-stack\[data-ad-ext-x01-remaining-score-bar-stack="true"\]:not\(\[data-ad-ext-x01-2player-stack="true"\]\)/s
  );
  assert.match(
    css,
    /\[data-ad-ext-x01-2player-stack="true"\]\.css-y3hfdd\{[^}]*padding-left:0\s*!important;[^}]*background:transparent\s*!important;/s
  );
  assert.match(
    css,
    /\[data-ad-ext-x01-2player-slot="score"\]\.css-1r7jzhg,\s*#ad-ext-player-display\s+\.ad-ext-player\s*>\s*\[data-ad-ext-x01-2player-stack="true"\]\.css-y3hfdd\s*>\s*\.css-1r7jzhg\{[^}]*grid-column-start:1\s*!important;[^}]*grid-column-end:-1\s*!important;[^}]*grid-row-start:3\s*!important;[^}]*grid-row-end:4\s*!important;/s
  );
  assert.match(
    css,
    /\[data-ad-ext-x01-2player-slot="identity"\]\.css-37hv00,\s*#ad-ext-player-display\s+\.ad-ext-player\s*>\s*\[data-ad-ext-x01-2player-stack="true"\]\.css-y3hfdd\s*>\s*\.css-37hv00\{[^}]*display:block\s*!important;[^}]*grid-column-start:1\s*!important;[^}]*grid-column-end:-1\s*!important;[^}]*grid-row-start:2\s*!important;[^}]*grid-row-end:3\s*!important;[^}]*padding-left:0\s*!important;/s
  );
  assert.match(
    css,
    /\[data-ad-ext-x01-2player-stack="true"\]\s*>\s*\.css-1igwmid:not\(\[data-ad-ext-x01-2player-slot\]\),\s*#ad-ext-player-display\s+\.ad-ext-player\s*>\s*\[data-ad-ext-x01-2player-stack="true"\]\.css-y3hfdd\s*>\s*\.css-1igwmid:not\(\[data-ad-ext-x01-2player-slot\]\)\{[^}]*display:flex\s*!important;[^}]*grid-column-start:2\s*!important;[^}]*grid-column-end:3\s*!important;[^}]*grid-row-start:1\s*!important;[^}]*grid-row-end:2\s*!important;[^}]*padding-left:0\s*!important;/s
  );
  assert.match(
    css,
    /\[data-ad-ext-x01-2player-slot="identity"\],\s*#ad-ext-player-display\s+\.ad-ext-player\s*>\s*\[data-ad-ext-x01-2player-stack="true"\]\s*>\s*\[data-ad-ext-x01-2player-slot="identity"\]\s*>\s*\*,\s*#ad-ext-player-display\s+\.ad-ext-player\s*>\s*\[data-ad-ext-x01-2player-stack="true"\]\s*>\s*\[data-ad-ext-x01-2player-slot="identity"\]\s*>\s*\*\s*>\s*\*,\s*#ad-ext-player-display\s+\.ad-ext-player\s*>\s*\[data-ad-ext-x01-2player-stack="true"\]\s*>\s*\[data-ad-ext-x01-2player-slot="identity"\]\s*>\s*\*\s*>\s*\*\s*>\s*\*\{[^}]*background:transparent\s*!important;[^}]*background-color:transparent\s*!important;/s
  );
  assert.match(
    css,
    /#ad-ext-player-display\s+\.ad-ext-player\s+table\s+td,\s*#ad-ext-player-display\s+\.ad-ext-player\s+table\s+th\{[^}]*padding:clamp\(0\.2rem,\s*0\.62cqb,\s*0\.48rem\) clamp\(0\.3rem,\s*1\.15cqi,\s*0\.58rem\)\s*!important;[^}]*font-size:var\(--ad-ext-x01-2player-table-cell-font-size\)\s*!important;[^}]*line-height:1\s*!important;[^}]*text-align:center\s*!important;[^}]*white-space:nowrap\s*!important;[^}]*overflow:hidden\s*!important;[^}]*text-overflow:clip\s*!important;/s
  );
  assert.match(
    css,
    new RegExp(
      `#ad-ext-player-display\\s+\\.ad-ext-player\\s+table\\s+td\\.${X01_TWO_PLAYER_STALE_REMAINING_CLASS}\\{[^}]*position:relative\\s*!important;[^}]*opacity:0\\.74\\s*!important;[^}]*\\}\\s*#ad-ext-player-display\\s+\\.ad-ext-player\\s+table\\s+td\\.${X01_TWO_PLAYER_STALE_REMAINING_CLASS}::after\\{[^}]*background:linear-gradient\\(\\s*to bottom right,`,
      "s"
    )
  );
  assert.match(
    css,
    /\.ad-ext-theme-board-controls\s*\{[^}]*top:calc\(var\(--ad-ext-x01-2player-turn-clearance\) \+ 0\.25rem\)\s*!important;[^}]*min-height:var\(--ad-ext-x01-2player-controls-height\)\s*!important;[^}]*gap:0\.28rem\s*!important;[^}]*padding:0\.12rem\s*!important;[^}]*border-radius:0\s*!important;[^}]*background:transparent\s*!important;[^}]*background-color:transparent\s*!important;[^}]*box-shadow:none\s*!important;[^}]*backdrop-filter:none\s*!important;/s
  );
  assert.match(
    css,
    /\.ad-ext-theme-board-controls\s*>\s*\*,\s*\.ad-ext-theme-board-controls\s+button\{[^}]*min-height:calc\(var\(--ad-ext-x01-2player-controls-height\) - 0\.24rem\)\s*!important;/s
  );
  assert.match(
    css,
    /\.ad-ext-theme-board-controls-portal\{[^}]*position:\s*fixed\s*!important;[^}]*inset:\s*0\s*!important;[^}]*z-index:\s*2147483000\s*!important;[^}]*pointer-events:\s*none\s*!important;/s
  );
  assert.match(
    css,
    /\.ad-ext-theme-board-controls-mirror-group\{[^}]*position:\s*fixed\s*!important;[^}]*max-width:\s*calc\(100vw - 0\.5rem\)\s*!important;[^}]*z-index:\s*2147483000\s*!important;[^}]*pointer-events:\s*auto\s*!important;/s
  );
  assert.match(
    css,
    /\[data-ad-ext-board-controls-source-mirrored="true"\]\{[^}]*visibility:\s*hidden\s*!important;[^}]*pointer-events:\s*none\s*!important;/s
  );
  assert.match(
    css,
    /\.ad-ext-theme-board-controls-mirror-group\[data-ad-ext-board-controls-kind="primary"\]\s*>\s*\.ad-ext-theme-board-controls\{[^}]*flex-wrap:\s*nowrap\s*!important;/s
  );
  assert.doesNotMatch(
    css,
    /\.ad-ext-x01-2player-board-controls-portal/s
  );
  assert.match(
    css,
    /\.ad-ext-theme-content-board\.ad-ext-theme-board-panel\s*>\s*\.ad-ext-theme-board-controls,[\s\S]*?\.css-1kejrvi\.ad-ext-theme-board-panel\s*>\s*\.ad-ext-theme-board-controls,[\s\S]*?\.css-14xtjvc\.ad-ext-theme-board-panel\s*>\s*\.ad-ext-theme-board-controls\{[^}]*top:calc\(var\(--ad-ext-x01-2player-live-turn-height\) \+ var\(--ad-ext-x01-2player-turn-clearance\)\)\s*!important;/s
  );
  assert.match(
    css,
    /\.ad-ext-theme-board-viewport\{[^}]*width:100%\s*!important;[^}]*height:100%\s*!important;[^}]*justify-self:stretch\s*!important;/s
  );
  assert.match(
    css,
    /\.ad-ext-theme-board-canvas\{[^}]*max-width:100%\s*!important;[^}]*max-height:100%\s*!important;/s
  );
  assert.match(
    css,
    /@media \(max-width: 1180px\)\{[\s\S]*?--ad-ext-x01-2player-score-size:clamp\(6\.048rem,\s*min\(24vw,\s*14\.4vh\),\s*9\.7rem\);[\s\S]*?--ad-ext-x01-2player-score-scale:var\(--ad-ext-x01-2player-density-score-scale\);[\s\S]*?--ad-ext-x01-2player-table-cell-font-size:clamp\(1\.6rem,\s*min\(7\.4vw,\s*8cqb,\s*5vh\),\s*2\.15rem\);/s
  );
  assert.match(
    css,
    /@media \(max-width: 820px\)\{[\s\S]*?--ad-ext-x01-2player-score-size:clamp\(5\.616rem,\s*min\(22vw,\s*12vh\),\s*8\.75rem\);[\s\S]*?--ad-ext-x01-2player-score-scale:var\(--ad-ext-x01-2player-density-score-scale\);[\s\S]*?--ad-ext-x01-2player-table-cell-font-size:clamp\(1\.42rem,\s*min\(6\.4vw,\s*7cqb,\s*4\.3vh\),\s*1\.95rem\);/s
  );
  assert.match(
    css,
    /@media \(max-height: 860px\)\{[\s\S]*?--ad-ext-x01-2player-score-size:clamp\(5\.76rem,\s*min\(23\.5cqi,\s*12\.8vh\),\s*9\.25rem\);[\s\S]*?--ad-ext-x01-2player-score-scale:var\(--ad-ext-x01-2player-density-score-scale\);[\s\S]*?--ad-ext-x01-2player-table-cell-font-size:clamp\(1\.85rem,\s*min\(10\.8cqi,\s*8\.2cqb,\s*5\.4vh\),\s*2\.25rem\);/s
  );
  assert.doesNotMatch(css, /font-size:\s*2em\s*!important/);
  assert.doesNotMatch(css, /--ad-ext-theme-board-size:min\(/);
  assert.doesNotMatch(css, /\[data-ad-ext-turn-points-node=/);
  assert.doesNotMatch(css, /#ad-ext-player-display\s*>\s*\*(?!\s*>)/);
  assert.doesNotMatch(css, /(^|,)\s*svg\[viewBox="0 0 1000 1000"\]/m);
  assert.doesNotMatch(css, /\.css-hjw8x4/);
  assert.doesNotMatch(css, /#ad-ext-player-display\s+\.ad-ext-player\s+\.ad-ext-player-name[^}]*text-transform:uppercase/s);
  assertNoFragileLayoutSelectors(css);
});

test("shanghai and bermuda stay under-throws and keep oldrepo preview behavior", () => {
  const shanghaiCss = buildShanghaiThemeCss({ showAvg: false });
  const bermudaCss = buildBermudaThemeCss({});

  assert.equal(PREVIEW_SHANGHAI.mode, "under-throws");
  assert.equal(PREVIEW_BERMUDA.mode, "under-throws");
  assert.equal(PREVIEW_SHANGHAI.activationMode, "autodarts-tools-zoom");
  assert.equal(PREVIEW_BERMUDA.activationMode, "autodarts-tools-zoom");
  assert.match(shanghaiCss, /ad-ext-turn-preview-space/);
  assert.match(bermudaCss, /ad-ext-turn-preview-space/);
  assert.match(shanghaiCss, /ad-ext-avg-trend-arrow\s*\{\s*display:\s*none\s*!important;/);
  assert.match(
    shanghaiCss,
    /#ad-ext-player-display\s+\.ad-ext-player\.ad-ext-player-active\s*>\s*\.chakra-stack,\s*#ad-ext-player-display\s+\.ad-ext-player\.ad-ext-player-winner\s*>\s*\.chakra-stack\s*\{[^}]*grid-template-rows:\s*max-content max-content\s*!important;[^}]*align-content:\s*center\s*!important;/s
  );
  assert.match(
    shanghaiCss,
    /#ad-ext-player-display\s+\.ad-ext-player\s*>\s*\.chakra-stack\s*\{[^}]*display:\s*grid\s*!important;[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s*max-content\s*!important;[^}]*grid-template-rows:\s*max-content max-content\s*!important;[^}]*column-gap:\s*var\(--ad-ext-player-score-column-gap\)\s*!important;[^}]*row-gap:\s*0px\s*!important;[^}]*min-width:\s*0\s*!important;/s
  );
  assert.match(
    shanghaiCss,
    /#ad-ext-player-display\s+\.ad-ext-player\s*>\s*\.chakra-stack\s*>\s*\.chakra-stack\s*\{[^}]*min-width:\s*0\s*!important;[^}]*max-width:\s*100%\s*!important;[^}]*width:\s*100%\s*!important;[^}]*box-sizing:\s*border-box\s*!important;[^}]*overflow:\s*hidden\s*!important;/s
  );
  assert.match(
    shanghaiCss,
    /#ad-ext-player-display\s+\.ad-ext-player\s+\.css-37hv00:not\(\[data-ad-ext-cricket-row="true"\]\)\s*>\s*\.css-4rrvd0,\s*#ad-ext-player-display\s+\.ad-ext-player\s+\.css-37hv00:not\(\[data-ad-ext-cricket-row="true"\]\)\s*>\s*\.css-4rrvd0\s*>\s*\.css-z1uxps,\s*#ad-ext-player-display\s+\.ad-ext-player\s+\.css-37hv00:not\(\[data-ad-ext-cricket-row="true"\]\)\s+\.css-1igwmid\s*\{[^}]*min-width:\s*0\s*!important;[^}]*max-width:\s*100%\s*!important;[^}]*width:\s*100%\s*!important;[^}]*box-sizing:\s*border-box\s*!important;[^}]*overflow:\s*hidden\s*!important;/s
  );
  assert.match(
    shanghaiCss,
    /#ad-ext-player-display\s+\.ad-ext-player\s+\.ad-ext-player-name,\s*#ad-ext-player-display\s+\.ad-ext-player\s+\.ad-ext-player-name\s*>\s*p\s*\{[^}]*min-width:\s*0\s*!important;[^}]*overflow:\s*hidden\s*!important;[^}]*text-overflow:\s*ellipsis\s*!important;[^}]*white-space:\s*nowrap\s*!important;/s
  );
  assert.match(
    shanghaiCss,
    /#ad-ext-player-display\s+\.ad-ext-player\s+\.ad-ext-player-score\s*\{[^}]*justify-self:\s*end\s*!important;[^}]*min-width:\s*max-content\s*!important;[^}]*white-space:\s*nowrap\s*!important;/s
  );
  assert.match(shanghaiCss, /--ad-ext-stat-scale:\s*1\.2/);
  assert.match(
    shanghaiCss,
    /#ad-ext-player-display\s+\.ad-ext-player\.ad-ext-player-active,\s*#ad-ext-player-display\s+\.ad-ext-player\.ad-ext-player-winner\{[^}]*--ad-ext-player-flex:\s*1\.333333;[^}]*--ad-ext-player-score-size:\s*clamp\(5\.333rem,\s*min\(27vw,\s*52vh\),\s*var\(--ad-ext-player-responsive-score-active-max\)\);/s
  );
  assert.match(
    bermudaCss,
    /#ad-ext-player-display\s+\.ad-ext-player\s*\{[^}]*--ad-ext-player-score-size:\s*clamp\(4rem,\s*min\(20vw,\s*45vh\),\s*var\(--ad-ext-player-responsive-score-max\)\);[^}]*container-name:\s*ad-ext-player-card\s*!important;/s
  );
  assert.match(
    shanghaiCss,
    /#ad-ext-player-display\s+\.ad-ext-player\.ad-ext-player-active,\s*#ad-ext-player-display\s+\.ad-ext-player\.ad-ext-player-winner\{[^}]*min-height:\s*clamp\(12rem,\s*42cqb,\s*24rem\)\s*!important;/s
  );
  assert.match(
    shanghaiCss,
    /#ad-ext-player-display\s+\.ad-ext-player\.ad-ext-player-active,\s*#ad-ext-player-display\s+\.ad-ext-player\.ad-ext-player-winner\s*\{[^}]*border:\s*2px\s+solid\s+var\(--ad-ext-theme-card-active-border-color\)\s*!important;[^}]*border-radius:\s*12px\s*!important;[^}]*box-shadow:\s*0\s+0\s+0\s+1px\s+var\(--ad-ext-theme-card-active-outline-color\)\s*!important;/s
  );
  assertNoFragileLayoutSelectors(shanghaiCss);
  assertNoFragileLayoutSelectors(bermudaCss);
});

test("bull-off keeps oldrepo board-first grid and no preview spacer", () => {
  const css = buildBullOffThemeCss({ contrastPreset: "standard" });

  assert.equal(PREVIEW_BULL_OFF.mode, "standard");
  assert.doesNotMatch(css, /ad-ext-turn-preview-space/);
  assert.match(css, /--ad-ext-stat-scale:\s*1\.2/);
  assert.match(
    css,
    /#ad-ext-player-display\s+\.ad-ext-player\.ad-ext-player-active\s*>\s*\.chakra-stack,\s*#ad-ext-player-display\s+\.ad-ext-player\.ad-ext-player-winner\s*>\s*\.chakra-stack\s*\{[^}]*grid-template-rows:\s*max-content max-content\s*!important;[^}]*align-content:\s*center\s*!important;/s
  );
  assert.match(
    css,
    /#ad-ext-player-display\s+\.ad-ext-player\s*>\s*\.chakra-stack\s*\{[^}]*display:\s*grid\s*!important;[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s*max-content\s*!important;[^}]*column-gap:\s*var\(--ad-ext-player-score-column-gap\)\s*!important;[^}]*row-gap:\s*0px\s*!important;[^}]*min-width:\s*0\s*!important;/s
  );
  assert.match(
    css,
    /#ad-ext-player-display\s+\.ad-ext-player\s+\.ad-ext-player-score\s*\{[^}]*justify-self:\s*end\s*!important;[^}]*min-width:\s*max-content\s*!important;[^}]*white-space:\s*nowrap\s*!important;/s
  );
  assert.match(
    css,
    /#ad-ext-player-display\s+\.ad-ext-player\.ad-ext-player-active,\s*#ad-ext-player-display\s+\.ad-ext-player\.ad-ext-player-winner\{[^}]*--ad-ext-player-flex:\s*1\.333333;[^}]*--ad-ext-player-score-size:\s*clamp\(5\.333rem,\s*min\(27vw,\s*52vh\),\s*var\(--ad-ext-player-responsive-score-active-max\)\);/s
  );
  assert.match(
    css,
    /#ad-ext-player-display\s+\.ad-ext-player\s*\{[^}]*min-height:\s*clamp\(7\.25rem,\s*20cqb,\s*11rem\)\s*!important;/s
  );
  assert.doesNotMatch(css, /font-size:\s*7\.2em\s*!important;/s);
  assert.doesNotMatch(css, /--ad-ext-player-score-max:/s);
  assert.match(
    css,
    /#ad-ext-player-display\s+\.ad-ext-player\.ad-ext-player-active,\s*#ad-ext-player-display\s+\.ad-ext-player\.ad-ext-player-winner\{[^}]*border:\s*2px\s+solid\s+var\(--ad-ext-theme-card-active-border-color\)\s*!important;/s
  );
  assert.match(css, /grid-template-columns:\s*0\.94fr 1\.06fr\s*!important;/);
  assert.match(
    css,
    /\.css-1kejrvi,\s*\.css-14xtjvc\s*\{[^}]*grid-row-start:\s*2\s*!important;[^}]*grid-row-end:\s*4\s*!important;/s
  );
  assertNoFragileLayoutSelectors(css);
});

test("cricket theme scales player columns and active player parts responsively", () => {
  const css = buildCricketThemeCss({ showAvg: true });

  assert.match(
    css,
    /--ad-ext-theme-cricket-player-column-max-width:\s*18\.5rem;[^}]*--ad-ext-theme-cricket-player-avatar-size-active:\s*clamp\(2\.32rem,\s*2\.6vw,\s*3rem\);[^}]*--ad-ext-theme-cricket-name-size-active:\s*clamp\(1\.488rem,\s*min\(1\.95vw,\s*8cqi\),\s*2\.05rem\);[^}]*--ad-ext-theme-cricket-score-size-active:\s*clamp\(3\.55rem,\s*min\(5vw,\s*27cqi\),\s*5\.85rem\);/s
  );
  assert.match(
    css,
    /--ad-ext-theme-cricket-turn-tile-height:\s*clamp\(6\.8rem,\s*min\(13\.5vh,\s*12cqi\),\s*8\.6rem\);[^}]*--ad-ext-theme-cricket-turn-score-size:\s*clamp\(2\.65rem,\s*min\(15cqi,\s*38cqb\),\s*4\.25rem\);[^}]*--ad-ext-theme-cricket-turn-segment-size:\s*clamp\(1\.05rem,\s*min\(5\.8cqi,\s*16cqb\),\s*1\.65rem\);/s
  );
  assert.match(
    css,
    /--ad-ext-theme-cricket-wins-font-size-active:\s*30px;[^}]*--ad-ext-theme-cricket-wins-font-size-inactive:\s*30px;/s
  );
  assert.match(
    css,
    /#ad-ext-player-display\s+\.ad-ext-player\{[^}]*--ad-ext-theme-cricket-name-size:\s*var\(--ad-ext-theme-cricket-name-size-inactive\);[^}]*--ad-ext-theme-cricket-score-size:\s*var\(--ad-ext-theme-cricket-score-size-inactive\);[^}]*--ad-ext-theme-cricket-score-vertical-offset:\s*var\(--ad-ext-theme-cricket-score-vertical-offset-inactive\);[^}]*--ad-ext-theme-cricket-player-avatar-size:\s*var\(--ad-ext-theme-cricket-player-avatar-size-inactive\);[^}]*--ad-ext-theme-cricket-wins-font-size:\s*var\(--ad-ext-theme-cricket-wins-font-size-inactive\);[^}]*--ad-ext-theme-cricket-wins-scale:\s*1;/s
  );
  assert.match(
    css,
    /#ad-ext-player-display\s+\.ad-ext-player\.ad-ext-player-active,\s*#ad-ext-player-display\s+\.ad-ext-player\[data-ad-ext-theme-cricket-active="true"\]\{[^}]*--ad-ext-theme-cricket-name-size:\s*var\(--ad-ext-theme-cricket-name-size-active\);[^}]*--ad-ext-theme-cricket-score-size:\s*var\(--ad-ext-theme-cricket-score-size-active\);[^}]*--ad-ext-theme-cricket-score-vertical-offset:\s*var\(--ad-ext-theme-cricket-score-vertical-offset-active\);[^}]*--ad-ext-theme-cricket-player-avatar-size:\s*var\(--ad-ext-theme-cricket-player-avatar-size-active\);[^}]*--ad-ext-theme-cricket-wins-font-size:\s*var\(--ad-ext-theme-cricket-wins-font-size-active\);/s
  );
  assert.match(
    css,
    /#ad-ext-player-display\s+\.ad-ext-player\.ad-ext-player-active,\s*#ad-ext-player-display\s+\.ad-ext-player\.ad-ext-player-winner,\s*#ad-ext-player-display\s+\.ad-ext-player\[data-ad-ext-theme-cricket-active="true"\]\{[^}]*--ad-ext-theme-cricket-score-size:\s*clamp\(3\.55rem,\s*min\(27cqi,\s*43cqb\),\s*5\.85rem\);[^}]*--ad-ext-theme-cricket-player-avatar-size:\s*clamp\(2\.32rem,\s*min\(12cqi,\s*18cqb\),\s*3rem\);/s
  );
  assert.match(
    css,
    /#ad-ext-player-display\s+\.ad-ext-player\s*>\s*\[data-ad-ext-cricket-stack="true"\]\s*>\s*\[data-ad-ext-cricket-row="true"\]\s*>\s*\[data-ad-ext-cricket-slot="identity"\]\s+\[data-ad-ext-cricket-meta="wins"\]\s*\{[^}]*padding:\s*0 4px\s*!important;[^}]*font-size:\s*var\(--ad-ext-theme-cricket-wins-font-size\)\s*!important;[^}]*line-height:\s*1\.2\s*!important;[^}]*border-radius:\s*2px\s*!important;/s
  );
});

test("shared common layout keeps oldrepo baseline grid contract", () => {
  const sharedPlayerDisplayCss = buildSharedPlayerDisplayCss();

  assert.match(
    commonThemeCss,
    /--ad-ext-theme-accent-color:\s*var\(--theme-text-highlight-color\);[^}]*--ad-ext-theme-text-primary-color:\s*rgba\(214,\s*229,\s*245,\s*0\.84\);[^}]*--ad-ext-theme-text-secondary-color:\s*rgba\(226,\s*232,\s*240,\s*0\.92\);/s
  );
  assert.match(
    commonThemeCss,
    /--ad-ext-theme-score-active-color:\s*var\(--ad-ext-theme-score-color\);[^}]*--ad-ext-theme-score-inactive-color:\s*var\(--ad-ext-theme-text-primary-color\);[^}]*--ad-ext-theme-name-color:\s*var\(--ad-ext-theme-text-secondary-color\);[^}]*--ad-ext-theme-meta-color:\s*var\(--ad-ext-theme-text-secondary-color\);[^}]*--ad-ext-theme-active-card-tint-top:\s*transparent;[^}]*--ad-ext-theme-card-tint-top-current:\s*transparent;/s
  );
  assert.match(
    commonThemeCss,
    /--ad-ext-player-responsive-active-ratio:\s*1\.333333;[^}]*--ad-ext-player-responsive-score-max:\s*6rem;[^}]*--ad-ext-player-responsive-score-active-max:\s*8rem;[^}]*--ad-ext-player-responsive-avatar-active-max:\s*4rem;[^}]*--ad-ext-player-responsive-flag-active-max:\s*1\.4rem;/s
  );
  assert.match(
    commonThemeCss,
    new RegExp(
      `#ad-ext-player-display \\[${PLAYER_CARD_PART_ATTRIBUTE}="${PLAYER_CARD_PARTS.roundBadge}"\\][^}]*background-color:\\s*#9fdb58`,
      "s"
    )
  );
  assert.match(
    commonThemeCss,
    new RegExp(
      `#ad-ext-player-display \\[${PLAYER_CARD_PART_ATTRIBUTE}="${PLAYER_CARD_PARTS.profileBadge}"\\][^}]*padding:\\s*0 4px\\s*!important;[^}]*border-radius:\\s*2px\\s*!important;[^}]*font-size:\\s*30px\\s*!important;[^}]*background-color:\\s*var\\(--ad-ext-theme-profile-badge-bg`,
      "s"
    )
  );
  assert.doesNotMatch(commonThemeCss, /^span\.css-3fr5p8\s*\{/m);
  assert.doesNotMatch(commonLayoutCss, /^\.css-3fr5p8\s*\{/m);
  assert.match(
    commonLayoutCss,
    /grid-template-areas:\s*"header header"\s*"footer footer"\s*"players board"/
  );
  assert.match(
    commonLayoutCss,
    /#ad-ext-player-display\s*\{[^}]*display:flex;[^}]*flex-direction:\s*column;[^}]*grid-area:\s*players\s*!important;/s
  );
  assert.match(
    commonLayoutCss,
    /div\.css-y3hfdd:not\(\[data-ad-ext-cricket-stack="true"\]\)\s*\{[^}]*grid-template-columns:\s*1fr auto\s*!important;[^}]*grid-template-rows:\s*max-content minmax\(0,\s*1fr\)\s*!important;[^}]*align-content:\s*start\s*!important;/s
  );
  assert.match(
    commonLayoutCss,
    /div\.css-y3hfdd:not\(\[data-ad-ext-cricket-stack="true"\]\)\s*>\s*\.css-1igwmid\s*\{[^}]*grid-row-start:\s*2\s*!important;[^}]*padding-left:\s*55px\s*!important;[^}]*align-self:\s*start\s*!important;[^}]*margin-top:\s*0\s*!important;/s
  );
  assert.match(
    commonLayoutCss,
    /\.ad-ext-theme-board-panel\s*\{[^}]*grid-template-rows:\s*minmax\(0,\s*1fr\)\s*!important;[^}]*position:\s*relative\s*!important;[^}]*overflow:\s*visible\s*!important;/s
  );
  assert.match(
    commonLayoutCss,
    /\.ad-ext-theme-content-slot\s*\{[^}]*grid-template-columns:\s*minmax\(18rem,\s*clamp\(22rem,\s*34vw,\s*38rem\)\)\s*minmax\(0,\s*1fr\)\s*!important;/s
  );
  assert.match(
    commonLayoutCss,
    /\.ad-ext-theme-content-slot\s*\{[^}]*grid-column:\s*1\s*\/\s*-1\s*!important;[^}]*grid-row:\s*3\s*!important;/s
  );
  assert.match(
    commonLayoutCss,
    /\.css-tkevr6\s*>\s*\.chakra-stack\s*>\s*\.ad-ext-theme-content-slot,\s*\.css-tkevr6\s+\.ad-ext-theme-content-slot\s*\{[^}]*justify-self:\s*stretch\s*!important;[^}]*max-width:\s*100%\s*!important;/s
  );
  assert.match(
    commonLayoutCss,
    /\.ad-ext-theme-content-board\s*\{[^}]*grid-column:\s*2\s*!important;[^}]*display:\s*flex\s*!important;/s
  );
  assert.match(
    commonLayoutCss,
    /\.ad-ext-theme-board-controls\s*\{[^}]*position:\s*absolute\s*!important;[^}]*top:\s*0\.5rem\s*!important;[^}]*right:\s*0\.5rem\s*!important;[^}]*bottom:\s*auto\s*!important;[^}]*left:\s*auto\s*!important;/s
  );
  assert.match(
    commonLayoutCss,
    /\.ad-ext-theme-board-viewport\s*\{[^}]*display:\s*flex\s*!important;[^}]*overflow:\s*visible\s*!important;/s
  );
  assert.match(
    commonLayoutCss,
    /\.ad-ext-theme-board-canvas\s*\{[^}]*flex:\s*0\s+0\s+auto\s*!important;[^}]*height:\s*var\(--ad-ext-theme-board-size,\s*100%\)\s*!important;[^}]*width:\s*var\(--ad-ext-theme-board-size,\s*100%\)\s*!important;[^}]*aspect-ratio:\s*1 \/ 1;[^}]*overflow:\s*visible\s*!important;/s
  );
  assert.match(
    commonLayoutCss,
    /\.ad-ext-theme-board-canvas\s*>\s*\*\s*\{[^}]*width:\s*100%\s*!important;[^}]*height:\s*100%\s*!important;[^}]*max-width:\s*100%\s*!important;[^}]*max-height:\s*100%\s*!important;[^}]*display:\s*flex\s*!important;[^}]*justify-content:\s*center\s*!important;[^}]*overflow:\s*visible\s*!important;/s
  );
  assert.match(
    commonLayoutCss,
    /\.ad-ext-theme-board-svg\[viewBox="0 0 1000 1000"\]\s*\{[^}]*width:\s*100%\s*!important;[^}]*height:\s*100%\s*!important;[^}]*max-width:\s*100%\s*!important;[^}]*max-height:\s*100%\s*!important;[^}]*aspect-ratio:\s*1 \/ 1;/s
  );
  assert.match(
    sharedPlayerDisplayCss,
    /#ad-ext-player-display\s+\.ad-ext-player\s+\.ad-ext-player-name,\s*#ad-ext-player-display\s+\.ad-ext-player\s+\.ad-ext-player-name\s*>\s*p\s*\{[^}]*color:\s*var\(--ad-ext-theme-name-color\)\s*!important;/s
  );
  assert.match(
    sharedPlayerDisplayCss,
    /#ad-ext-player-display\s+\.ad-ext-player\s+\.ad-ext-player-score\s*\{[^}]*color:\s*var\(--ad-ext-theme-score-color\)\s*!important;/s
  );
  assert.match(
    sharedPlayerDisplayCss,
    /\.ad-ext-player\s+\.chakra-avatar,\s*\.ad-ext-player\s+\.chakra-avatar__img,\s*\.ad-ext-player\s+\.chakra-avatar__initials\{[^}]*--avatar-size:\s*var\(--ad-ext-player-avatar-size\)\s*!important;[^}]*width:\s*var\(--ad-ext-player-avatar-size\)\s*!important;[^}]*height:\s*var\(--ad-ext-player-avatar-size\)\s*!important;/s
  );
  assert.match(
    sharedPlayerDisplayCss,
    /#ad-ext-player-display\s+\.ad-ext-player\s*>\s*\.chakra-stack\s*\{[^}]*grid-template-rows:\s*max-content max-content\s*!important;[^}]*align-content:\s*center\s*!important;/s
  );
  assert.match(
    sharedPlayerDisplayCss,
    /p\.chakra-text\.css-1j0bqop\s*\{[^}]*color:\s*var\(--ad-ext-theme-meta-color\)\s*!important;/s
  );
  assert.match(
    sharedPlayerDisplayCss,
    /#ad-ext-turn\s+\.ad-ext-turn-points,\s*#ad-ext-turn\s+\.ad-ext-hit-score\s*\{[^}]*color:\s*var\(--ad-ext-theme-turn-points-color\)\s*!important;/s
  );
  assert.doesNotMatch(commonLayoutCss, /width:\s*min\(100%,\s*100vh\)\s*!important;/);
  assert.doesNotMatch(commonLayoutCss, /96cqw|96cqh/);
  assertNoFragileLayoutSelectors(commonLayoutCss);
});

test("shared theme visual settings keep player cards shrinkable while preserving full-height stacks", () => {
  const visualCss = buildThemeVisualSettingsCss({
    playerFieldTransparency: 10,
  });

  assert.match(
    visualCss,
    /#ad-ext-player-display\s+\.ad-ext-player\s*\{[^}]*min-height:\s*0\s*!important;[^}]*height:\s*auto\s*!important;/s
  );
  assert.match(
    visualCss,
    /#ad-ext-player-display\s+\.ad-ext-player\s*>\s*\.chakra-stack\s*\{[^}]*min-height:\s*0\s*!important;[^}]*height:\s*100%\s*!important;[^}]*linear-gradient\(\s*180deg,\s*var\(--ad-ext-theme-card-tint-top-current\),\s*var\(--ad-ext-theme-card-tint-bottom-current\)\s*\),/s
  );
});

test("shared theme visual settings stretch uploaded backgrounds across the full viewport shells", () => {
  const visualCss = buildThemeVisualSettingsCss({
    backgroundDisplayMode: "stretch",
    backgroundOpacity: 30,
    backgroundImageDataUrl: "data:image/png;base64,AAAA",
  });

  assert.match(
    visualCss,
    /html,\s*body,\s*div\.css-gmuwbf,\s*div\.css-tkevr6,\s*div\.css-nfhdnc\s*\{[^}]*background-size:\s*100% 100%\s*!important;[^}]*background-position:\s*center center\s*!important;[^}]*background-repeat:\s*no-repeat\s*!important;/s
  );
});

test("shared theme visual settings prefer the theme image and otherwise fall back to Templates Global", () => {
  const globalTypographyConfig = {
    enabled: true,
    backgroundDisplayMode: "tile",
    backgroundOpacity: 70,
    playerFieldTransparency: 45,
    backgroundImageDataUrl: "data:image/png;base64,GGGG",
  };
  const themeWithoutImage = {
    backgroundDisplayMode: "fill",
    backgroundOpacity: 25,
    playerFieldTransparency: 10,
    backgroundImageDataUrl: "",
  };
  const themeWithImage = {
    backgroundDisplayMode: "fit",
    backgroundOpacity: 40,
    playerFieldTransparency: 30,
    backgroundImageDataUrl: "data:image/png;base64,AAAA",
  };

  assert.equal(
    resolveThemeVisualSettingsConfig(themeWithoutImage, globalTypographyConfig),
    globalTypographyConfig
  );
  assert.equal(
    resolveThemeVisualSettingsConfig(themeWithImage, globalTypographyConfig),
    themeWithImage
  );
  assert.equal(
    resolveThemeVisualSettingsConfig(themeWithoutImage, {
      ...globalTypographyConfig,
      enabled: false,
    }),
    themeWithoutImage
  );
});

test("shared theme visual settings fall back to preset wallpaper assets after uploaded images", () => {
  const globalTypographyConfig = {
    enabled: true,
    backgroundDisplayMode: "fill",
    backgroundOpacity: 40,
    playerFieldTransparency: 15,
    backgroundImageDataUrl: "",
    backgroundAssetKey: "ice",
  };
  const themeWithoutImage = {
    backgroundDisplayMode: "fill",
    backgroundOpacity: 25,
    playerFieldTransparency: 10,
    backgroundImageDataUrl: "",
  };
  const themeWithImage = {
    backgroundDisplayMode: "fit",
    backgroundOpacity: 40,
    playerFieldTransparency: 30,
    backgroundImageDataUrl: "data:image/png;base64,AAAA",
  };

  assert.equal(
    resolveThemeVisualSettingsConfig(themeWithoutImage, globalTypographyConfig),
    globalTypographyConfig
  );
  assert.equal(
    resolveThemeVisualSettingsConfig(themeWithImage, globalTypographyConfig),
    themeWithImage
  );
  assert.match(buildThemeVisualSettingsCss(globalTypographyConfig), /theme-presets\/ice\.jpg/);
});
