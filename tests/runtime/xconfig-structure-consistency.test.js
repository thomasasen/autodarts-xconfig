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

function extractCssRuleBody(cssText, selectorFragment) {
  const selectorIndex = cssText.indexOf(selectorFragment);
  if (selectorIndex < 0) {
    return "";
  }

  const bodyStart = cssText.indexOf("{", selectorIndex);
  const bodyEnd = cssText.indexOf("}", bodyStart);
  if (bodyStart < 0 || bodyEnd < 0) {
    return "";
  }

  return cssText.slice(bodyStart + 1, bodyEnd);
}

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

test("triple-double-bull style options expose color and animation previews", () => {
  const descriptor = xconfigDescriptors.find(
    (entry) => entry.featureKey === "triple-double-bull-hits"
  );
  const colorField = descriptor?.fields?.find((field) => field.key === "colorTheme");
  const optionColorThemes = new Map(
    (colorField?.options || []).map((option) => [
      String(option.value),
      String(option.previewColorTheme || ""),
    ])
  );
  const animationField = descriptor?.fields?.find((field) => field.key === "animationStyle");
  const optionEffects = new Map(
    (animationField?.options || []).map((option) => [
      String(option.value),
      String(option.previewEffect || ""),
    ])
  );

  assert.deepEqual(Array.from(optionColorThemes.keys()), [
    "kind-signal",
    "ember-rush",
    "ice-circuit",
    "volt-lime",
    "crimson-steel",
    "arctic-mint",
    "champagne-night",
  ]);
  optionColorThemes.forEach((previewColorTheme, value) => {
    assert.equal(previewColorTheme, value);
    assert.equal(
      xconfigShellStyleText.includes(`data-preview-color-theme="${previewColorTheme}"`),
      true
    );
  });
  assert.equal(
    xconfigShellStyleText.includes("ad-xconfig-option-item--color-preview::before"),
    true
  );
  const colorPreviewSurface = extractCssRuleBody(
    xconfigShellStyleText,
    ".ad-xconfig-option-item--color-preview::before"
  );
  assert.notEqual(colorPreviewSurface, "");
  assert.equal(colorPreviewSurface.includes("repeating-linear-gradient"), false);

  const kindSignalPreview = extractCssRuleBody(
    xconfigShellStyleText,
    'data-preview-color-theme="kind-signal"'
  );
  assert.equal(
    kindSignalPreview.includes(
      "linear-gradient(116deg,#3b0a11 0%,#7f1124 34%,#c62828 67%,#ff8a80 100%),linear-gradient(116deg,#0a1f45 0%,#0d4f9b 34%,#1976d2 67%,#7ec8ff 100%),linear-gradient(116deg,#0c2a14 0%,#1b7a34 34%,#2eaf50 67%,#9ef57e 100%)"
    ),
    true
  );
  assert.equal(
    kindSignalPreview.includes(
      "--ad-xconfig-hit-theme-gradient-size:33.333% 100%,33.334% 100%,33.333% 100%"
    ),
    true
  );
  assert.equal(
    kindSignalPreview.includes(
      "--ad-xconfig-hit-theme-gradient-position:left center,center center,right center"
    ),
    true
  );
  [
    "#3b0a11",
    "#7f1124",
    "#c62828",
    "#ff8a80",
    "#0a1f45",
    "#0d4f9b",
    "#1976d2",
    "#7ec8ff",
    "#0c2a14",
    "#1b7a34",
    "#2eaf50",
    "#9ef57e",
  ].forEach((colorValue) => {
    assert.equal(kindSignalPreview.includes(colorValue), true);
  });

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
