import test from "node:test";
import assert from "node:assert/strict";

import { defaultConfig } from "../../src/config/default-config.js";
import { defaultFeatureDefinitions } from "../../src/features/feature-registry.js";
import { xconfigDescriptorOrder, xconfigDescriptors } from "../../src/features/xconfig-ui/descriptors.js";
import { styleText as xconfigShellStyleText } from "../../src/features/xconfig-ui/shell-style.js";
import {
  ELECTRIC_FILTER_SOFT_ID,
  ELECTRIC_FILTER_STRONG_ID,
} from "../../src/shared/electric-border-engine.js";

function readNestedValue(rootValue, pathParts = []) {
  return pathParts.reduce((current, part) => {
    if (!current || typeof current !== "object") {
      return undefined;
    }
    return current[part];
  }, rootValue);
}

test("default feature definitions have matching default toggles and config branches", () => {
  defaultFeatureDefinitions.forEach((definition) => {
    const configKey = String(definition?.configKey || "").trim();
    const toggleValue = defaultConfig.featureToggles[configKey];
    const configValue = readNestedValue(defaultConfig.features, configKey.split("."));

    assert.notEqual(toggleValue, undefined, `missing default toggle for ${configKey}`);
    assert.equal(typeof configValue, "object", `missing default feature config for ${configKey}`);
  });
});

test("xConfig descriptors stay aligned with registry definitions and exported order", () => {
  const registryFeatureKeys = new Set(
    defaultFeatureDefinitions.map((definition) => String(definition?.featureKey || "").trim())
  );

  assert.equal(xconfigDescriptors.length, xconfigDescriptorOrder.size);
  xconfigDescriptors.forEach((descriptor, index) => {
    const featureKey = String(descriptor?.featureKey || "").trim();
    assert.equal(registryFeatureKeys.has(featureKey), true, `descriptor without registry feature: ${featureKey}`);
    assert.equal(xconfigDescriptorOrder.get(featureKey), index);
  });
});

test("theme global typography stays first in the themes descriptor order", () => {
  const themeDescriptors = xconfigDescriptors.filter((descriptor) => descriptor.tab === "themes");
  assert.ok(themeDescriptors.length > 0);
  assert.equal(themeDescriptors[0]?.featureKey, "theme-global-typography");
});

test("triple-double-bull animation options expose hover preview effects", () => {
  const descriptor = xconfigDescriptors.find(
    (entry) => entry.featureKey === "triple-double-bull-hits"
  );
  const animationField = descriptor?.fields?.find((field) => field.key === "animationStyle");
  const optionEffects = new Map(
    (animationField?.options || []).map((option) => [
      String(option.value),
      String(option.previewEffect || ""),
    ])
  );

  assert.deepEqual(Array.from(optionEffects.keys()), [
    "emphasis",
    "shake",
    "pulse",
    "turn",
    "sheen",
    "shockwave",
    "electric-arc",
  ]);
  optionEffects.forEach((previewEffect, value) => {
    assert.equal(previewEffect, value);
    assert.equal(xconfigShellStyleText.includes(`data-preview-effect="${previewEffect}"`), true);
  });
  [
    "ad-xconfig-hit-row-electric-arc",
    "ad-xconfig-hit-score-electric-arc",
    "ad-xconfig-hit-segment-electric-arc",
    "ad-xconfig-hit-electric-arc-frame-electric",
    "ad-xconfig-hit-electric-arc-frame-glow",
    "ad-xconfig-hit-electric-arc-frame-aura",
    `url(#${ELECTRIC_FILTER_SOFT_ID})`,
    `url(#${ELECTRIC_FILTER_STRONG_ID})`,
    'data-preview-effect="electric-arc"]:hover::after',
  ].forEach((expectedSnippet) => {
    assert.equal(xconfigShellStyleText.includes(expectedSnippet), true);
  });
});
