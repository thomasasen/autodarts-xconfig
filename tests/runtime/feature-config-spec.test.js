import test from "node:test";
import assert from "node:assert/strict";

import { defaultConfig } from "../../src/config/default-config.js";
import {
  createDefaultConfigFromFeatureSpecs,
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
