import test from "node:test";
import assert from "node:assert/strict";

import { getThemeGlobalTemplatePreset } from "../../src/shared/theme-global-template-presets.js";
import { resolveThemeGlobalPresetState } from "../../src/features/xconfig-ui/feature-card-preview.js";

function buildFeatures(preset, { backgroundEnabled = true, typographyEnabled = true } = {}) {
  return [
    {
      featureKey: "theme-global-background",
      enabled: backgroundEnabled,
      config: {
        enabled: backgroundEnabled,
        backgroundDisplayMode: preset.backgroundDisplayMode,
        backgroundOpacity: preset.backgroundOpacity,
        playerFieldTransparency: preset.playerFieldTransparency,
        backgroundImageDataUrl: "",
        backgroundAssetKey: preset.backgroundAssetKey,
      },
    },
    {
      featureKey: "theme-global-typography",
      enabled: typographyEnabled,
      config: {
        enabled: typographyEnabled,
        fontPreset: preset.fontPreset,
        applyTo: [...preset.applyTo],
        accentColor: preset.accentColor,
        scoreColor: preset.scoreColor,
        secondaryTextColor: preset.secondaryTextColor,
        throwLabelColor: preset.throwLabelColor,
        activePlayerTintIntensity: preset.activePlayerTintIntensity,
      },
    },
  ];
}

test("global preset state requires the complete enabled preset fingerprint", () => {
  const preset = getThemeGlobalTemplatePreset("cyberpunk");
  const features = buildFeatures(preset);
  assert.equal(resolveThemeGlobalPresetState(features, preset), "active");

  features[1].config.scoreColor = "#FFFFFF";
  assert.equal(resolveThemeGlobalPresetState(features, preset), "customized");

  features[0].enabled = false;
  features[0].config.enabled = false;
  assert.equal(resolveThemeGlobalPresetState(features, preset), "disabled");

  features[0].config.backgroundImageDataUrl = "data:image/png;base64,AAAA";
  assert.equal(resolveThemeGlobalPresetState(features, preset), "");
});
