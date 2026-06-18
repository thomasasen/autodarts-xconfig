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

test("x01 bust active player highlight descriptor exposes a toggle-only animation feature", () => {
  const descriptor = xconfigDescriptors.find(
    (entry) => entry.featureKey === "x01-bust-active-player-highlight"
  );

  assert.ok(descriptor);
  assert.equal(descriptor.tab, "animations");
  assert.equal(descriptor.readmeAnchor, "animation-autodarts-x01-bust-active-player-highlight");
  assert.deepEqual(
    descriptor.fields.map((field) => field.key),
    ["debug"]
  );
});

test("triple-double-bull style options expose color and animation previews", () => {
  const descriptor = xconfigDescriptors.find(
    (entry) => entry.featureKey === "special-hit-highlights"
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
    "pop-hit",
    "side-shake",
    "glow-pop",
    "flip-spin",
    "light-sweep",
    "shockwave-ring",
    "electric-jolt",
  ]);
  optionEffects.forEach((previewEffect, value) => {
    assert.equal(previewEffect, value);
    assert.equal(xconfigShellStyleText.includes(`data-preview-effect="${previewEffect}"`), true);
  });
  [
    "ad-xconfig-hit-row-electric-jolt",
    "ad-xconfig-hit-score-electric-jolt",
    "ad-xconfig-hit-segment-electric-jolt",
    "ad-xconfig-hit-electric-jolt-frame-electric",
    "ad-xconfig-hit-electric-jolt-frame-glow",
    "ad-xconfig-hit-electric-jolt-frame-aura",
    `url(#${ELECTRIC_FILTER_SOFT_ID})`,
    `url(#${ELECTRIC_FILTER_STRONG_ID})`,
    'data-preview-effect="electric-jolt"]:hover::after',
  ].forEach((expectedSnippet) => {
    assert.equal(xconfigShellStyleText.includes(expectedSnippet), true);
  });
});

test("active-player-sweep settings expose sweep previews", () => {
  const descriptor = xconfigDescriptors.find((entry) => entry.featureKey === "active-player-sweep");
  const expectedPreviewEffects = new Map([
    [
      "durationMs",
      [
        "active-player-sweep-fast",
        "active-player-sweep-standard-speed",
        "active-player-sweep-slow",
      ],
    ],
    [
      "sweepStyle",
      [
        "active-player-sweep-subtle",
        "active-player-sweep-standard-style",
        "active-player-sweep-strong",
      ],
    ],
  ]);

  expectedPreviewEffects.forEach((expectedEffects, fieldKey) => {
    const field = descriptor?.fields?.find((entry) => entry.key === fieldKey);
    const previewEffects = (field?.options || []).map((option) =>
      String(option.previewEffect || "")
    );

    assert.deepEqual(previewEffects, expectedEffects, `unexpected previews for ${fieldKey}`);
    previewEffects.forEach((previewEffect) => {
      assert.equal(
        xconfigShellStyleText.includes(`data-preview-effect="${previewEffect}"`),
        true,
        `missing CSS preview for ${previewEffect}`
      );
    });
  });
  assert.equal(xconfigShellStyleText.includes("ad-xconfig-active-player-sweep-preview"), true);
});

test("xConfig color preset settings expose matching preview themes", () => {
  const expectedPreviewFields = new Map([
    [
      "checkout-score-highlight:colorTheme",
      [
        "checkout-score-autodarts-green",
        "checkout-score-cyan",
        "checkout-score-amber",
        "checkout-score-red",
      ],
    ],
    [
      "x01-remaining-score-bar:colorTheme",
      [
        "x01-checkout-focus",
        "x01-traffic-light",
        "x01-danger-endgame",
        "x01-gradient-by-progress",
        "x01-autodarts",
        "x01-signal-lime",
        "x01-glass-mint",
        "x01-ember-rush",
        "x01-ice-circuit",
        "x01-neon-violet",
        "x01-sunset-amber",
        "x01-monochrome-steel",
      ],
    ],
    [
      "checkout-target-highlights:colorTheme",
      [
        "checkout-board-violet",
        "checkout-board-cyan",
        "checkout-board-amber",
        "checkout-board-lime",
        "checkout-board-rose",
        "checkout-board-white",
      ],
    ],
    [
      "checkout-suggestion-styles:colorTheme",
      ["checkout-suggestion-amber", "checkout-suggestion-cyan", "checkout-suggestion-rose"],
    ],
    ["cricket-target-highlighter:colorTheme", ["cricket-standard", "cricket-high-contrast"]],
    ["cricket-grid-status-effects:colorTheme", ["cricket-standard", "cricket-high-contrast"]],
    [
      "dartboard-marker-highlight:color",
      [
        "dart-marker-blue",
        "dart-marker-green",
        "dart-marker-red",
        "dart-marker-yellow",
        "dart-marker-white",
      ],
    ],
    [
      "dartboard-marker-highlight:outline",
      [
        "dart-marker-outline-off",
        "dart-marker-outline-white",
        "dart-marker-outline-black",
      ],
    ],
    [
      "winner-celebration-effect:colorTheme",
      [
        "winner-autodarts",
        "winner-redwhite",
        "winner-ice",
        "winner-sunset",
        "winner-neon",
        "winner-gold",
      ],
    ],
  ]);

  expectedPreviewFields.forEach((expectedPreviews, fieldId) => {
    const [featureKey, fieldKey] = fieldId.split(":");
    const descriptor = xconfigDescriptors.find((entry) => entry.featureKey === featureKey);
    const field = descriptor?.fields?.find((entry) => entry.key === fieldKey);
    const previews = (field?.options || []).map((option) =>
      String(option.previewColorTheme || "")
    );

    assert.deepEqual(previews, expectedPreviews, `unexpected previews for ${fieldId}`);
    previews.forEach((previewColorTheme) => {
      assert.equal(
        xconfigShellStyleText.includes(`data-preview-color-theme="${previewColorTheme}"`),
        true,
        `missing CSS preview for ${previewColorTheme}`
      );
    });
  });
  assert.equal(
    xconfigShellStyleText.includes(
      '[data-feature-key="checkout-target-highlights"][data-setting-key="colorTheme"]'
    ),
    true,
    "missing scoped checkout-board color button CSS"
  );
});

test("theme global template preset actions expose color previews", () => {
  const descriptor = xconfigDescriptors.find(
    (entry) => entry.featureKey === "theme-global-typography"
  );
  const previewColorThemes = (descriptor?.fields || [])
    .filter((field) => field.action === "applyThemeGlobalPreset")
    .map((field) => String(field.previewColorTheme || ""));

  assert.deepEqual(previewColorThemes, [
    "template-classic",
    "template-broadcast",
    "template-british-flag",
    "template-cyberpunk",
    "template-matrix",
    "template-fire",
    "template-ice",
  ]);
  previewColorThemes.forEach((previewColorTheme) => {
    assert.equal(
      xconfigShellStyleText.includes(`data-preview-color-theme="${previewColorTheme}"`),
      true
    );
  });
});
