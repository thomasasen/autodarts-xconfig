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
import { featureCatalog } from "../../src/shared/feature-catalog.js";

function getDefaultFeatureConfig(configKey) {
  if (String(configKey || "").startsWith("themes.")) {
    const themeKey = String(configKey).split(".")[1];
    return defaultConfig.features?.themes?.[themeKey] || null;
  }

  return defaultConfig.features?.[configKey] || null;
}

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

test("feature config spec carries remove-key rules for retired config fields", () => {
  assert.deepEqual(getFeatureConfigSpec("x01ScoreProgress")?.removeKeys, ["designPreset"]);
  assert.deepEqual(getFeatureConfigSpec("checkoutScorePulse")?.removeKeys, []);
});

test("createRecommendedFeatureConfig returns the documented recommended defaults", () => {
  assert.deepEqual(createRecommendedFeatureConfig("themes.globalTypography"), {
    enabled: false,
    fontPreset: "system",
    applyTo: ["scores"],
    accentColor: "",
    scoreColor: "",
    secondaryTextColor: "",
    throwLabelColor: "",
    backgroundDisplayMode: "fill",
    backgroundOpacity: 25,
    playerFieldTransparency: 10,
    backgroundImageDataUrl: "",
    backgroundAssetKey: "",
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
  assert.deepEqual(createRecommendedFeatureConfig("checkoutBoardTargets"), {
    enabled: true,
    visualPreset: "signal",
    segmentStyle: "surface-only",
    singleRing: "both",
    targetSelectionMode: "next",
    colorTheme: "cyan",
    debug: false,
  });
  assert.deepEqual(createRecommendedFeatureConfig("tripleDoubleBullHits"), {
    enabled: true,
    colorTheme: "kind-signal",
    animationStyle: "electric-arc",
    debug: false,
  });
  assert.deepEqual(createRecommendedFeatureConfig("dartMarkerEmphasis"), {
    enabled: true,
    size: 6,
    color: "rgb(49, 130, 206)",
    effect: "pulse",
    opacityPercent: 100,
    outline: "weiss",
    debug: false,
  });
  assert.deepEqual(createRecommendedFeatureConfig("singleBullSound"), {
    enabled: true,
    volume: 0.9,
    cooldownMs: 700,
    pollIntervalMs: 0,
    debug: false,
  });
  assert.deepEqual(createRecommendedFeatureConfig("winnerFireworks"), {
    enabled: true,
    style: "fireworks",
    colorTheme: "autodarts",
    intensity: "standard",
    includeBullOut: true,
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
    backgroundDisplayMode: "fill",
    backgroundOpacity: 25,
    playerFieldTransparency: 10,
    backgroundImageDataUrl: "",
    backgroundAssetKey: "",
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
      backgroundDisplayMode: "fit",
      backgroundOpacity: "40",
      playerFieldTransparency: "30",
      backgroundImageDataUrl: "data:image/png;base64,AAAA",
      backgroundAssetKey: "cyberpunk",
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
      backgroundDisplayMode: "fit",
      backgroundOpacity: 40,
      playerFieldTransparency: 30,
      backgroundImageDataUrl: "data:image/png;base64,AAAA",
      backgroundAssetKey: "cyberpunk",
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
      backgroundDisplayMode: "tile",
      backgroundOpacity: "70",
      playerFieldTransparency: "45",
      backgroundImageDataUrl: "invalid",
      backgroundAssetKey: "ice",
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
      backgroundDisplayMode: "tile",
      backgroundOpacity: 70,
      playerFieldTransparency: 45,
      backgroundImageDataUrl: "",
      backgroundAssetKey: "ice",
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
      backgroundDisplayMode: "wallpaper",
      backgroundOpacity: "12",
      playerFieldTransparency: "88",
      backgroundImageDataUrl: "https://example.invalid/bg.png",
      backgroundAssetKey: "missing-preset",
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
      backgroundDisplayMode: "fill",
      backgroundOpacity: 25,
      playerFieldTransparency: 10,
      backgroundImageDataUrl: "",
      backgroundAssetKey: "",
      debug: false,
    }
  );
});
