import test from "node:test";
import assert from "node:assert/strict";

import { defaultConfig } from "../../src/config/default-config.js";
import { defaultFeatureDefinitions } from "../../src/features/feature-registry.js";
import { getXConfigDescriptor, xconfigDescriptors } from "../../src/features/xconfig-ui/descriptors.js";

test("feature catalog stays aligned across registry, defaults, and xconfig descriptors", () => {
  const featureKeys = new Set();
  const descriptorKeys = new Set(xconfigDescriptors.map((descriptor) => descriptor.featureKey));

  defaultFeatureDefinitions.forEach((definition) => {
    const featureKey = String(definition?.featureKey || "").trim();
    const configKey = String(definition?.configKey || "").trim();
    assert.ok(featureKey, "feature definition is missing featureKey");
    assert.ok(configKey, `feature definition ${featureKey} is missing configKey`);
    assert.equal(featureKeys.has(featureKey), false, `duplicate feature definition for ${featureKey}`);
    featureKeys.add(featureKey);

    assert.equal(descriptorKeys.has(featureKey), true, `missing descriptor for ${featureKey}`);
    assert.equal(getXConfigDescriptor(featureKey)?.featureKey, featureKey);
    assert.equal(
      Object.prototype.hasOwnProperty.call(defaultConfig.featureToggles, configKey),
      true,
      `missing feature toggle default for ${featureKey}`
    );

    if (configKey.startsWith("themes.")) {
      const themeKey = configKey.split(".")[1] || "";
      assert.ok(themeKey, `missing theme key for ${featureKey}`);
      assert.equal(
        typeof defaultConfig.features.themes?.[themeKey]?.enabled,
        "boolean",
        `missing theme defaults for ${featureKey}`
      );
      return;
    }

    assert.equal(
      typeof defaultConfig.features?.[configKey]?.enabled,
      "boolean",
      `missing feature defaults for ${featureKey}`
    );
  });

  xconfigDescriptors.forEach((descriptor) => {
    assert.equal(featureKeys.has(descriptor.featureKey), true, `orphan descriptor ${descriptor.featureKey}`);
  });
});
