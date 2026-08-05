import test from "node:test";
import assert from "node:assert/strict";

import { defaultConfig } from "../../src/config/default-config.js";
import {
  createDefaultConfigFromFeatureSpecs,
  createRecommendedFeatureConfig,
  getFeatureConfigSpec,
  listFeatureConfigSpecs,
} from "../../src/config/feature-config-spec.js";
import { defaultFeatureDefinitions } from "../../src/features/feature-registry.js";
import {
  featureCatalog,
  getFeatureCatalogEntryByConfigKey,
  getFeatureCatalogEntryByFeatureKey,
} from "../../src/shared/feature-catalog.js";

function getDefaultFeatureConfig(configKey) {
  if (String(configKey || "").startsWith("themes.")) {
    const themeKey = String(configKey).split(".")[1];
    return defaultConfig.features?.themes?.[themeKey] || null;
  }

  return defaultConfig.features?.[configKey] || null;
}

const DEFAULT_TURN_DART_CONFIG = Object.freeze({
  turnDartStyle: "original",
  turnDartAssetKey: "german-giant",
  turnDartTextTemplate: "",
  turnDartColor: "#FFFFFF",
  turnDartGradientColor: "#F97316",
  turnDartSizePercent: 115,
  turnDartShineEnabled: true,
  turnDartImageDataUrl: "",
});

const RENAMED_FEATURES = Object.freeze([
  ["checkout-score-highlight", "checkoutScoreHighlight", "checkout-score-pulse", "checkoutScorePulse"],
  ["x01-remaining-score-bar", "x01RemainingScoreBar", "x01-score-progress", "x01ScoreProgress"],
  ["checkout-target-highlights", "checkoutTargetHighlights", "checkout-board-targets", "checkoutBoardTargets"],
  ["checkout-suggestion-styles", "checkoutSuggestionStyles", "style-checkout-suggestions", "styleCheckoutSuggestions"],
  ["avg-trend-arrow", "avgTrendArrow", "average-trend-arrow", "averageTrendArrow"],
  ["active-player-sweep", "activePlayerSweep", "turn-start-sweep", "turnStartSweep"],
  ["special-hit-highlights", "specialHitHighlights", "triple-double-bull-hits", "tripleDoubleBullHits"],
  ["cricket-target-highlighter", "cricketTargetHighlighter", "cricket-highlighter", "cricketHighlighter"],
  ["cricket-grid-status-effects", "cricketGridStatusEffects", "cricket-grid-fx", "cricketGridFx"],
  ["dartboard-marker-highlight", "dartboardMarkerHighlight", "dart-marker-emphasis", "dartMarkerEmphasis"],
  ["dart-marker-replacer", "dartMarkerReplacer", "dart-marker-darts", "dartMarkerDarts"],
  ["take-out-darts-alert", "takeOutDartsAlert", "remove-darts-notification", "removeDartsNotification"],
  ["single-bull-hit-sound", "singleBullHitSound", "single-bull-sound", "singleBullSound"],
  ["turn-score-counter", "turnScoreCounter", "turn-points-count", "turnPointsCount"],
  ["winner-celebration-effect", "winnerCelebrationEffect", "winner-fireworks", "winnerFireworks"],
]);

test("feature config spec regenerates the published default config exactly", () => {
  assert.deepEqual(createDefaultConfigFromFeatureSpecs(), defaultConfig);
});

test("feature config spec stays aligned with catalog and registry order", () => {
  const specEntries = listFeatureConfigSpecs();

  assert.deepEqual(
    specEntries.map((entry) => entry.featureKey),
    featureCatalog.map((entry) => entry.featureKey)
  );
  assert.deepEqual(
    specEntries.map((entry) => entry.configKey),
    defaultFeatureDefinitions.map((entry) => entry.configKey)
  );

  specEntries.forEach((entry) => {
    const configSpec = getFeatureConfigSpec(entry.configKey);
    assert.ok(configSpec, `missing config spec for ${entry.configKey}`);
    assert.equal(typeof configSpec.normalizeConfig, "function", entry.configKey);
    assert.equal(typeof configSpec.createDefaultConfig, "function", entry.configKey);
    assert.equal(typeof configSpec.createRecommendedConfig, "function", entry.configKey);
    assert.deepEqual(configSpec.createDefaultConfig(), getDefaultFeatureConfig(entry.configKey));
  });
});

test("renamed feature catalog entries expose one canonical key with legacy aliases", () => {
  RENAMED_FEATURES.forEach(([featureKey, configKey, legacyFeatureKey, legacyConfigKey]) => {
    const canonicalEntry = getFeatureCatalogEntryByFeatureKey(featureKey);
    assert.ok(canonicalEntry, featureKey);
    assert.equal(canonicalEntry.featureKey, featureKey);
    assert.equal(canonicalEntry.configKey, configKey);
    assert.equal(getFeatureCatalogEntryByFeatureKey(legacyFeatureKey), canonicalEntry);
    assert.equal(getFeatureCatalogEntryByConfigKey(legacyConfigKey), canonicalEntry);
    assert.equal(getFeatureConfigSpec(legacyConfigKey), getFeatureConfigSpec(configKey));
  });

  RENAMED_FEATURES.forEach(([, , legacyFeatureKey]) => {
    assert.equal(
      featureCatalog.some((entry) => entry.featureKey === legacyFeatureKey),
      false,
      legacyFeatureKey
    );
  });
});

test("feature config spec carries remove-key rules for retired config fields", () => {
  assert.deepEqual(getFeatureConfigSpec("x01RemainingScoreBar")?.removeKeys, ["designPreset"]);
  assert.deepEqual(getFeatureConfigSpec("checkoutScoreHighlight")?.removeKeys, []);
});

test("dart marker replacer impact style defaults and normalization stay compatible", () => {
  const spec = getFeatureConfigSpec("dartMarkerReplacer");
  assert.equal(spec.createDefaultConfig().impactStyle, "classic");
  assert.equal(spec.normalizeConfig({ impactStyle: "natural" }).impactStyle, "natural");
  assert.equal(spec.normalizeConfig({ impactStyle: "dramatic" }).impactStyle, "dramatic");
  assert.equal(spec.normalizeConfig({ impactStyle: "invalid" }).impactStyle, "classic");
});

test("bot board style defaults and normalization stay restricted to the bundled choices", () => {
  const spec = getFeatureConfigSpec("botBoardStyle");

  assert.ok(spec);
  assert.deepEqual(spec.createDefaultConfig(), {
    enabled: false,
    design: "winmau-blade-6-tc",
    scope: "bot-turns",
    debug: false,
  });
  assert.deepEqual(
    spec.normalizeConfig({
      enabled: "aktiv",
      design: "target-tor",
      scope: "all-match-boards",
    }),
    {
      enabled: true,
      design: "target-tor",
      scope: "all-match-boards",
      debug: false,
    }
  );
  assert.deepEqual(
    spec.normalizeConfig({ enabled: true, design: "unknown", scope: "everywhere" }),
    {
      enabled: true,
      design: "winmau-blade-6-tc",
      scope: "bot-turns",
      debug: false,
    }
  );
});

test("x01 bust active player highlight defaults and normalization stay stable", () => {
  const spec = getFeatureConfigSpec("x01BustActivePlayerHighlight");

  assert.ok(spec);
  assert.deepEqual(spec.createDefaultConfig(), {
    enabled: true,
    crackCount: 2,
    shakeEnabled: false,
    soundEnabled: true,
    debug: false,
  });
  assert.deepEqual(createRecommendedFeatureConfig("x01BustActivePlayerHighlight"), {
    enabled: true,
    crackCount: 2,
    shakeEnabled: false,
    soundEnabled: true,
    debug: false,
  });
  assert.deepEqual(
    spec.normalizeConfig({
      enabled: "aktiv",
      crackCount: 2,
      shakeEnabled: "false",
      soundEnabled: "true",
      debug: "true",
    }),
    {
      enabled: true,
      crackCount: 2,
      shakeEnabled: false,
      soundEnabled: true,
      debug: true,
    }
  );
  assert.deepEqual(
    spec.normalizeConfig({
      enabled: "inaktiv",
      debug: "no",
    }),
    {
      enabled: false,
      crackCount: 2,
      shakeEnabled: false,
      soundEnabled: true,
      debug: false,
    }
  );
});

test("createRecommendedFeatureConfig returns the documented recommended defaults", () => {
  assert.deepEqual(createRecommendedFeatureConfig("themes.globalTypography"), {
    enabled: true,
    fontPreset: "aldrich",
    applyTo: ["scores", "throws", "names"],
    accentColor: "#00D9FF",
    scoreColor: "#FFFFFF",
    secondaryTextColor: "#DCE9FF",
    throwLabelColor: "#8FA9C2",
    activePlayerTintIntensity: 20,
    backgroundDisplayMode: "fill",
    backgroundOpacity: 10,
    playerFieldTransparency: 10,
    backgroundImageDataUrl: "",
    backgroundAssetKey: "",
    ...DEFAULT_TURN_DART_CONFIG,
    turnDartStyle: "image",
    turnDartGradientColor: "#00D9FF",
    turnDartSizePercent: 135,
    debug: false,
  });
  assert.deepEqual(createRecommendedFeatureConfig("themes.bullOff"), {
    enabled: true,
    contrastPreset: "standard",
    backgroundDisplayMode: "fill",
    backgroundOpacity: 25,
    playerFieldTransparency: 10,
    backgroundImageDataUrl: "",
    debug: false,
  });
  assert.deepEqual(createRecommendedFeatureConfig("themes.gotcha"), {
    enabled: true,
    backgroundDisplayMode: "fill",
    backgroundOpacity: 25,
    playerFieldTransparency: 10,
    deltaPlacement: "below",
    deltaAlignment: "right",
    deltaItalic: true,
    backgroundImageDataUrl: "",
    debug: false,
  });
  assert.deepEqual(createRecommendedFeatureConfig("checkoutTargetHighlights"), {
    enabled: true,
    visualPreset: "fast-blink",
    segmentStyle: "surface-outline",
    singleRing: "both",
    targetSelectionMode: "next",
    colorTheme: "violet",
    debug: false,
  });
  assert.deepEqual(createRecommendedFeatureConfig("specialHitHighlights"), {
    enabled: true,
    colorTheme: "kind-signal",
    animationStyle: "electric-jolt",
    debug: false,
  });
  assert.deepEqual(createRecommendedFeatureConfig("dartboardMarkerHighlight"), {
    enabled: true,
    size: 6,
    color: "rgb(49, 130, 206)",
    effect: "size-pulse",
    opacityPercent: 100,
    outline: "weiss",
    debug: false,
  });
  assert.deepEqual(createRecommendedFeatureConfig("dartMarkerReplacer"), {
    enabled: true,
    design: "germangiant",
    animateDarts: true,
    sizePercent: 120,
    hideOriginalMarkers: true,
    impactStyle: "dramatic",
    enableShadow: true,
    enableShadowBlur: true,
    enableWobble: true,
    enableFlightBlur: true,
    flightSpeed: "standard",
    debug: false,
  });
  assert.deepEqual(createRecommendedFeatureConfig("singleBullHitSound"), {
    enabled: true,
    volume: 0.9,
    cooldownMs: 700,
    pollIntervalMs: 0,
    debug: false,
  });
  assert.deepEqual(createRecommendedFeatureConfig("winnerCelebrationEffect"), {
    enabled: true,
    style: "center-cannon",
    colorTheme: "gold",
    intensity: "standard",
    durationSeconds: 5,
    particleAmount: "sparsam",
    includeBullOut: false,
    pointerDismiss: true,
    debug: false,
  });
});

test("theme global typography defaults and normalization stay stable", () => {
  assert.deepEqual(getDefaultFeatureConfig("themes.globalTypography"), {
    enabled: false,
    fontPreset: "system",
    applyTo: ["scores"],
    accentColor: "",
    scoreColor: "",
    secondaryTextColor: "",
    throwLabelColor: "",
    activePlayerTintIntensity: 15,
    backgroundDisplayMode: "fill",
    backgroundOpacity: 25,
    playerFieldTransparency: 10,
    backgroundImageDataUrl: "",
    backgroundAssetKey: "",
    ...DEFAULT_TURN_DART_CONFIG,
    debug: false,
  });

  const spec = getFeatureConfigSpec("themes.globalTypography");
  assert.ok(spec);

  assert.deepEqual(
    spec.normalizeConfig({
      enabled: "true",
      fontPreset: "fragment-mono",
      applyTo: ["scores", "names"],
      accentColor: "#9fdb58",
      scoreColor: "#123456",
      secondaryTextColor: "#abc",
      throwLabelColor: "#dEf012",
      activePlayerTintIntensity: "20",
      backgroundDisplayMode: "fit",
      backgroundOpacity: "40",
      playerFieldTransparency: "30",
      backgroundImageDataUrl: "data:image/png;base64,AAAA",
      backgroundAssetKey: "cyberpunk",
      turnDartStyle: "gradient",
      turnDartAssetKey: "german-giant",
      turnDartTextTemplate: "Wurf #",
      turnDartColor: "#f97316",
      turnDartGradientColor: "#abc",
      turnDartSizePercent: "135",
      turnDartShineEnabled: "false",
      turnDartImageDataUrl: "data:image/webp;base64,BBBB",
      debug: "true",
    }),
    {
      enabled: true,
      fontPreset: "fragment-mono",
      applyTo: ["scores", "names"],
      accentColor: "#9FDB58",
      scoreColor: "#123456",
      secondaryTextColor: "#AABBCC",
      throwLabelColor: "#DEF012",
      activePlayerTintIntensity: 20,
      backgroundDisplayMode: "fit",
      backgroundOpacity: 40,
      playerFieldTransparency: 30,
      backgroundImageDataUrl: "data:image/png;base64,AAAA",
      backgroundAssetKey: "cyberpunk",
      turnDartStyle: "gradient",
      turnDartAssetKey: "german-giant",
      turnDartTextTemplate: "Wurf #",
      turnDartColor: "#F97316",
      turnDartGradientColor: "#AABBCC",
      turnDartSizePercent: 135,
      turnDartShineEnabled: false,
      turnDartImageDataUrl: "data:image/webp;base64,BBBB",
      debug: true,
    }
  );

  assert.deepEqual(
    spec.normalizeConfig({
      enabled: "true",
      fontPreset: "fragment-mono",
      applyTo: "scores-and-names",
      accentColor: "#abc",
      scoreColor: "",
      secondaryTextColor: "#123123",
      throwLabelColor: "#456",
      activePlayerTintIntensity: "10",
      backgroundDisplayMode: "tile",
      backgroundOpacity: "70",
      playerFieldTransparency: "45",
      backgroundImageDataUrl: "invalid",
      backgroundAssetKey: "ice",
      turnDartStyle: "image",
      turnDartAssetKey: "german-giant",
      turnDartTextTemplate: "Dart #",
      turnDartColor: "#123456",
      turnDartGradientColor: "#456",
      turnDartSizePercent: "100",
      turnDartShineEnabled: "true",
      turnDartImageDataUrl: "data:image/svg+xml;base64,CCCC",
      debug: "false",
    }),
    {
      enabled: true,
      fontPreset: "fragment-mono",
      applyTo: ["scores", "names"],
      accentColor: "#AABBCC",
      scoreColor: "",
      secondaryTextColor: "#123123",
      throwLabelColor: "#445566",
      activePlayerTintIntensity: 10,
      backgroundDisplayMode: "tile",
      backgroundOpacity: 70,
      playerFieldTransparency: 45,
      backgroundImageDataUrl: "",
      backgroundAssetKey: "ice",
      turnDartStyle: "image",
      turnDartAssetKey: "german-giant",
      turnDartTextTemplate: "Dart #",
      turnDartColor: "#123456",
      turnDartGradientColor: "#445566",
      turnDartSizePercent: 100,
      turnDartShineEnabled: true,
      turnDartImageDataUrl: "data:image/svg+xml;base64,CCCC",
      debug: false,
    }
  );

  assert.deepEqual(
    spec.normalizeConfig({
      enabled: "no",
      fontPreset: "missing-font",
      applyTo: "everything",
      accentColor: "rgb(0,0,0)",
      scoreColor: "#12",
      secondaryTextColor: "blue",
      throwLabelColor: "#12345g",
      activePlayerTintIntensity: "11",
      backgroundDisplayMode: "wallpaper",
      backgroundOpacity: "12",
      playerFieldTransparency: "88",
      backgroundImageDataUrl: "https://example.invalid/bg.png",
      backgroundAssetKey: "missing-preset",
      turnDartStyle: "rainbow",
      turnDartAssetKey: "missing-dart",
      turnDartTextTemplate: ` ${"x".repeat(60)}\nignored`,
      turnDartColor: "red",
      turnDartGradientColor: "#12",
      turnDartSizePercent: "99",
      turnDartShineEnabled: "invalid",
      turnDartImageDataUrl: "https://example.invalid/dart.png",
      debug: "no",
    }),
    {
      enabled: false,
      fontPreset: "system",
      applyTo: ["scores"],
      accentColor: "",
      scoreColor: "",
      secondaryTextColor: "",
      throwLabelColor: "",
      activePlayerTintIntensity: 15,
      backgroundDisplayMode: "fill",
      backgroundOpacity: 25,
      playerFieldTransparency: 10,
      backgroundImageDataUrl: "",
      backgroundAssetKey: "",
      ...DEFAULT_TURN_DART_CONFIG,
      turnDartTextTemplate: "x".repeat(48),
      debug: false,
    }
  );
});

test("gotcha theme defaults and normalization stay stable", () => {
  assert.deepEqual(getDefaultFeatureConfig("themes.gotcha"), {
    enabled: false,
    backgroundDisplayMode: "fill",
    backgroundOpacity: 25,
    playerFieldTransparency: 10,
    deltaPlacement: "below",
    deltaAlignment: "right",
    deltaItalic: true,
    backgroundImageDataUrl: "",
    debug: false,
  });

  const spec = getFeatureConfigSpec("themes.gotcha");
  assert.ok(spec);

  assert.deepEqual(
    spec.normalizeConfig({
      enabled: "true",
      backgroundDisplayMode: "fit",
      backgroundOpacity: "40",
      playerFieldTransparency: "30",
      deltaPlacement: "INLINE-DIVIDER",
      deltaAlignment: "LEFT",
      deltaItalic: "false",
      backgroundImageDataUrl: "data:image/png;base64,AAAA",
      debug: "true",
    }),
    {
      enabled: true,
      backgroundDisplayMode: "fit",
      backgroundOpacity: 40,
      playerFieldTransparency: 30,
      deltaPlacement: "inline-divider",
      deltaAlignment: "left",
      deltaItalic: false,
      backgroundImageDataUrl: "data:image/png;base64,AAAA",
      debug: true,
    }
  );

  assert.deepEqual(
    spec.normalizeConfig({
      enabled: "no",
      backgroundDisplayMode: "wallpaper",
      backgroundOpacity: "12",
      playerFieldTransparency: "88",
      deltaPlacement: "inline",
      deltaAlignment: "center",
      deltaItalic: "invalid",
      backgroundImageDataUrl: "https://example.invalid/bg.png",
      debug: "no",
    }),
    {
      enabled: false,
      backgroundDisplayMode: "fill",
      backgroundOpacity: 25,
      playerFieldTransparency: 10,
      deltaPlacement: "below",
      deltaAlignment: "right",
      deltaItalic: true,
      backgroundImageDataUrl: "",
      debug: false,
    }
  );
});
