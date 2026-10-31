import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { createModernX01Fixture } from "./modern-x01-fixture.js";
import { createDomGuards } from "../../src/core/dom-guards.js";
import { createListenerRegistry } from "../../src/core/listener-registry.js";
import { createObserverRegistry } from "../../src/core/observer-registry.js";
import { createRuntimeConfig } from "../../src/config/runtime-config.js";
import { getFeatureConfigSpec } from "../../src/config/feature-config-spec.js";
import { COMMUNITY_PRESETS, COMMUNITY_SURROUNDS, COMMUNITY_ASSET_FILES } from "../../src/shared/community-designs.js";
import { resolveThemePresetAsset } from "../../src/shared/theme-preset-assets.node.js";
import { createThemeGlobalTemplatePresetPatch } from "../../src/shared/theme-global-template-presets.js";
import { resolveScreenProfile } from "../../src/shared/presentation-config.js";
import { findBoardPresentationSurface } from "../../src/shared/board-presentation-surface.js";
import { buildLiveBoardFilter, createLiveBoardFilterDefinition } from "../../src/features/live-board-enhancement/logic.js";
import { mountLiveBoardEnhancement } from "../../src/features/live-board-enhancement/index.js";
import { mountBoardSurround, SURROUND_ID } from "../../src/features/board-surround/index.js";
import { buildPlayerGlowStyle, createPlayerGlowController } from "../../src/features/themes/global-typography/player-glow.js";
import { resolveBoardRenderSurface } from "../../src/shared/dartboard-svg.js";
import { buildFeatureSettingPatch } from "../../src/features/xconfig-ui/path-utils.js";
import { buildThemeVisualSettingsCss } from "../../src/features/themes/shared/theme-visuals.js";

function context(fixture, configurations) {
  const listeners = new Set();
  const ctx = { ...fixture, config: { getFeatureConfig: (key) => configurations[key] },
    domGuards: createDomGuards({ documentRef: fixture.documentRef }),
    registries: { observers: createObserverRegistry(), listeners: createListenerRegistry() },
    gameState: { getSnapshot: () => ({}), subscribe: (fn) => { listeners.add(fn); return () => listeners.delete(fn); } },
    helpers: { createRafScheduler: (fn) => ({ schedule: fn, cancel() {} }) },
  };
  ctx.refresh = () => listeners.forEach((listener) => listener());
  return ctx;
}

test("old configurations retain legacy layout and new effects remain opt-in", () => {
  const config = createRuntimeConfig({});
  assert.equal(config.getFeatureConfig("themes.gameLayout").screenProfile, "legacy");
  assert.equal(config.getFeatureConfig("liveBoardEnhancement").enabled, false);
  assert.equal(config.getFeatureConfig("boardSurround").enabled, false);
  assert.equal(config.getFeatureConfig("themes.globalTypography").glowMode, "off");
  const normalized = getFeatureConfigSpec("themes.gameLayout").normalizeConfig({ boardShare: 1000, textScale: "bad" });
  assert.equal(normalized.boardShare, 75);
  assert.equal(normalized.textScale, 100);
  assert.equal(resolveScreenProfile("auto", 899, 600), "portrait");
  assert.equal(resolveScreenProfile("auto", 900, 600), "desktop");
  assert.equal(resolveScreenProfile("auto", 1080, 1920), "portrait");
});

test("community catalogue contains only public modern designs and complete local image data", () => {
  assert.equal(COMMUNITY_PRESETS.length, 78);
  assert.equal(COMMUNITY_SURROUNDS.length, 34);
  assert.equal(new Set(COMMUNITY_PRESETS.map((entry) => entry.key)).size, 78);
  for (const preset of COMMUNITY_PRESETS) {
    assert.doesNotMatch(preset.sourceFile, /X_old|\$\$customer/);
    assert.ok(preset.author);
    for (const key of [preset.backgroundAssetKey, preset.previewAssetKey, ...Object.values(preset.backgroundAssets)].filter(Boolean)) assert.ok(COMMUNITY_ASSET_FILES[key], key);
  }
  for (const surround of COMMUNITY_SURROUNDS) assert.ok(COMMUNITY_ASSET_FILES[surround.assetKey]);
  for (const [key, file] of Object.entries(COMMUNITY_ASSET_FILES)) {
    const bytes = readFileSync(fileURLToPath(resolveThemePresetAsset(key)));
    const hash = createHash("sha256").update(bytes).digest("hex");
    assert.ok(file.includes(hash), `content hash mismatch: ${file}`);
    assert.equal(bytes.toString("ascii", 8, 12), "WEBP");
  }
});

test("community presets keep gameplay and optional effects out of their default patch", () => {
  const preset = COMMUNITY_PRESETS.find((entry) => entry.surroundAssetKey);
  const patch = createThemeGlobalTemplatePresetPatch(preset.key);
  assert.equal(patch.features.themes.globalBackground.communityPresetKey, preset.key);
  assert.equal(patch.features.themes.gameLayout, undefined);
  assert.equal(patch.features.boardSurround, undefined);
  assert.equal(patch.features.liveBoardEnhancement, undefined);
  assert.equal(patch.features.themes.globalTypography.glowMode, undefined);
  const extras = createThemeGlobalTemplatePresetPatch(preset.key, { includeSurround: true, includeGlow: true });
  assert.equal(extras.features.boardSurround.assetKey, preset.surroundAssetKey);
  assert.equal(extras.features.themes.globalTypography.glowMode, "pulse");
  const manual = buildFeatureSettingPatch("boardSurround", "design", COMMUNITY_SURROUNDS[1].key);
  assert.equal(manual.features.boardSurround.assetKey, "");
});

test("backgrounds choose local Cricket and portrait variants while uploads take precedence", () => {
  const preset = COMMUNITY_PRESETS.find((entry) => entry.backgroundAssets.portrait && entry.backgroundAssets.cricket);
  const css = buildThemeVisualSettingsCss({ communityPresetKey: preset.key, backgroundAssetKey: preset.backgroundAssetKey, backgroundContext: "cricket" });
  assert.ok(css.includes(resolveThemePresetAsset(preset.backgroundAssets.cricket)));
  assert.ok(css.includes(resolveThemePresetAsset(preset.backgroundAssets.portrait)));
  const uploaded = buildThemeVisualSettingsCss({ communityPresetKey: preset.key, backgroundImageDataUrl: "data:image/png;base64,AAAA" });
  assert.ok(uploaded.includes("data:image/png;base64,AAAA"));
  assert.ok(!uploaded.includes(resolveThemePresetAsset(preset.backgroundAssetKey)));
});

test("live sharpening preserves brightness and shares its definition with previews", () => {
  for (const intensity of [0, 30, 60, 100]) {
    const filter = buildLiveBoardFilter(intensity);
    const sum = filter.kernel.split(" ").map(Number).reduce((a, b) => a + b, 0);
    assert.ok(Math.abs(sum - 1) < 1e-9);
  }
  const f = createModernX01Fixture();
  const definition = createLiveBoardFilterDefinition(f.documentRef, "preview-filter", 60);
  assert.equal(definition.querySelector("feConvolveMatrix").getAttribute("kernelMatrix"), buildLiveBoardFilter(60).kernel);
});

test("live image replacement and teardown restore original filters without touching the SVG board", () => {
  const f = createModernX01Fixture();
  const image = f.node(f.board, "img");
  image.style.setProperty("filter", "brightness(0.8)", "important");
  const settings = { liveBoardEnhancement: { enabled: true, intensity: 60 } };
  const ctx = context(f, settings);
  const stop = mountLiveBoardEnhancement(ctx);
  assert.match(image.style.getPropertyValue("filter"), /brightness\(0.8\).*ad-xconfig-live-image-filter/);
  const replacement = f.documentRef.createElement("img");
  image.remove();
  f.board.appendChild(replacement);
  ctx.refresh();
  assert.equal(image.style.getPropertyValue("filter"), "brightness(0.8)");
  assert.match(replacement.style.getPropertyValue("filter"), /ad-xconfig-live-image-filter/);
  assert.equal(f.layers[0].style.getPropertyValue("filter"), "");
  stop(); stop();
  assert.equal(replacement.style.getPropertyValue("filter"), "");
  assert.equal(f.documentRef.getElementById("ad-xconfig-live-image-filter"), null);
});

test("surround remains outside zoom target, repairs a removed layer and restores its frame", () => {
  const f = createModernX01Fixture();
  const decorationFrame = f.node(f.documentRef.main, "div");
  decorationFrame.appendChild(f.host);
  f.board.offsetWidth = 400; f.board.offsetHeight = 400;
  const ctx = context(f, { boardSurround: { enabled: true, design: COMMUNITY_SURROUNDS[0].key, sizePercent: 143 } });
  const before = resolveBoardRenderSurface(f.documentRef);
  const interaction = findBoardPresentationSurface(f.documentRef).frame;
  const frame = interaction.parentElement;
  const padding = frame.style.getPropertyValue("padding");
  const stop = mountBoardSurround(ctx);
  let layer = f.documentRef.getElementById(SURROUND_ID);
  assert.ok(layer);
  assert.equal(layer.parentElement, frame);
  assert.equal(f.board.contains(layer), false);
  assert.equal(layer.getAttribute("data-adx-decoration"), "surround");
  const after = resolveBoardRenderSurface(f.documentRef);
  assert.equal(after.svg, before.svg);
  assert.equal(after.group, before.group);
  assert.equal(after.radius, before.radius);
  assert.equal(after.zoomTarget, before.zoomTarget);
  assert.equal(interaction.style.getPropertyValue("padding"), "");
  layer.remove(); ctx.refresh();
  layer = f.documentRef.getElementById(SURROUND_ID);
  assert.ok(layer);
  f.board.remove();
  const liveHost = f.node(interaction, "div");
  liveHost.setAttribute("role", "img");
  liveHost.setAttribute("aria-label", "Dartboard");
  liveHost.offsetWidth = 300; liveHost.offsetHeight = 300;
  f.node(liveHost, "img");
  ctx.refresh();
  const replaced = f.documentRef.getElementById(SURROUND_ID);
  assert.ok(replaced);
  assert.notEqual(replaced, layer);
  assert.equal(replaced.style.width, "429px");
  stop();
  assert.equal(f.documentRef.getElementById(SURROUND_ID), null);
  assert.equal(frame.style.getPropertyValue("padding"), padding);
});

test("glow owns its layer, repairs missing output and yields to BUST without changing host animation", () => {
  const f = createModernX01Fixture();
  f.card.style.setProperty("animation", "native-player 1s");
  const glow = createPlayerGlowController(f.documentRef);
  glow.update(true);
  const layer = f.documentRef.querySelector(".ad-xconfig-player-glow");
  assert.ok(layer);
  layer.remove();
  assert.equal(glow.checkHealth(), false);
  glow.update(true);
  assert.equal(glow.checkHealth(), true);
  f.card.classList.add("ad-ext-x01-bust-active-player-highlight");
  glow.update(true);
  assert.equal(f.card.querySelector(".ad-xconfig-player-glow"), null);
  assert.equal(f.card.style.getPropertyValue("animation"), "native-player 1s");
  glow.clear();
  assert.equal(glow.checkHealth(), true);
});

test("live image watchdog repairs filter loss and unregisters its health hook on teardown", () => {
  const f = createModernX01Fixture();
  const image = f.node(f.board, "img");
  const ctx = context(f, { liveBoardEnhancement: { enabled: true, intensity: 30 } });
  let health = null;
  const snapshot = { phase: "ready", generation: 1 };
  ctx.turnLifecycle = { refresh: () => snapshot, ensureCurrent: () => snapshot, register: () => () => {} };
  ctx.watchdog = { register: (entry) => { health = entry; return () => { health = null; }; } };
  const stop = mountLiveBoardEnhancement(ctx);
  image.style.removeProperty("filter");
  health.repair({ generation: 0 });
  assert.match(image.style.getPropertyValue("filter"), /ad-xconfig-live-image-filter/);
  stop();
  assert.equal(health, null);
});

test("surround watchdog repairs hidden or cleared persistent output without replaying game effects", () => {
  const f = createModernX01Fixture();
  const outer = f.node(f.documentRef.main, "div");
  outer.appendChild(f.host);
  f.board.offsetWidth = 400; f.board.offsetHeight = 400;
  const ctx = context(f, { boardSurround: { enabled: true, design: COMMUNITY_SURROUNDS[0].key, sizePercent: 143 } });
  const snapshot = { phase: "ready", generation: 1 };
  ctx.turnLifecycle = { refresh: () => snapshot, ensureCurrent: () => snapshot, register: () => () => {} };
  let health;
  ctx.watchdog = { register(entry) { health = entry; return () => {}; } };
  const stop = mountBoardSurround(ctx);
  const layer = f.documentRef.getElementById(SURROUND_ID);
  assert.equal(health.check(snapshot), true);
  layer.style.setProperty("display", "none", "important");
  layer.removeAttribute("src");
  assert.equal(health.check(snapshot), false);
  health.repair(snapshot);
  assert.equal(health.check(snapshot), true);
  assert.equal(layer.style.getPropertyValue("display"), "block");
  assert.equal(layer.style.getPropertyPriority("display"), "");
  assert.ok(layer.getAttribute("src"));
  outer.style.removeProperty("padding");
  assert.equal(health.check(snapshot), false);
  health.repair(snapshot);
  assert.equal(health.check(snapshot), true);
  stop();
});

test("glow leaves card animations and shadows intact and supports reduced motion", () => {
  assert.equal(buildPlayerGlowStyle({ glowMode: "off" }), "");
  const css = buildPlayerGlowStyle({ glowMode: "pulse", glowIntensity: 40 });
  assert.match(css, />\.ad-xconfig-player-glow/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /not\(\.ad-ext-x01-bust-active-player-highlight\)/);
  assert.match(css, /data-ad-cricket-layout-node="header"/);
  assert.doesNotMatch(css, /animation:.*!important/);
});
