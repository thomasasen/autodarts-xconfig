import {
  resolveBoardStyleDesignAsset,
  resolveDartDesignAsset,
} from "#feature-assets";
import { resolveThemePresetAsset } from "#theme-preset-assets";
import { resolveXConfigPreviewAsset } from "#xconfig-preview-assets";
import { THEME_GLOBAL_TEMPLATE_PRESETS } from "../../shared/theme-global-template-presets.js";
import { resolveThemeBackgroundPreviewUrl } from "./theme-background.js";

function findFeature(features, featureKey) {
  return (Array.isArray(features) ? features : []).find(
    (feature) => String(feature?.featureKey || "").trim() === featureKey
  ) || null;
}

function matchesPresetTypography(config = {}, preset = {}) {
  return (
    String(config.fontPreset || "").trim() === preset.fontPreset &&
    String(config.accentColor || "").trim().toUpperCase() === String(preset.accentColor || "").toUpperCase() &&
    String(config.scoreColor || "").trim().toUpperCase() === String(preset.scoreColor || "").toUpperCase() &&
    String(config.secondaryTextColor || "").trim().toUpperCase() === String(preset.secondaryTextColor || "").toUpperCase() &&
    String(config.throwLabelColor || "").trim().toUpperCase() === String(preset.throwLabelColor || "").toUpperCase()
  );
}

function resolveActiveThemeGlobalPreset(features) {
  const backgroundConfig = findFeature(features, "theme-global-background")?.config || {};
  if (String(backgroundConfig.backgroundImageDataUrl || "").trim()) {
    return null;
  }

  const backgroundAssetKey = String(backgroundConfig.backgroundAssetKey || "").trim();
  if (backgroundAssetKey) {
    return THEME_GLOBAL_TEMPLATE_PRESETS.find(
      (preset) => preset.backgroundAssetKey === backgroundAssetKey
    ) || null;
  }

  const typographyConfig = findFeature(features, "theme-global-typography")?.config || {};
  return THEME_GLOBAL_TEMPLATE_PRESETS.find(
    (preset) => !preset.backgroundAssetKey && matchesPresetTypography(typographyConfig, preset)
  ) || null;
}

function resolveRepresentativeThemeGlobalPreset() {
  return THEME_GLOBAL_TEMPLATE_PRESETS.find(
    (preset) => Boolean(resolveThemePresetAsset(preset.backgroundAssetKey))
  ) || THEME_GLOBAL_TEMPLATE_PRESETS[0] || null;
}

function resolveThemeGlobalPresetsPreview(features) {
  const activePreset = resolveActiveThemeGlobalPreset(features);
  const preset = activePreset || resolveRepresentativeThemeGlobalPreset();
  return {
    kind: "theme-global-presets",
    url:
      resolveThemePresetAsset(preset?.backgroundAssetKey) ||
      resolveXConfigPreviewAsset("theme-global-presets"),
    preset,
    active: Boolean(activePreset),
    displayMode: preset?.backgroundDisplayMode || "fill",
  };
}

function resolveThemeGlobalTypographyPreview(feature, features) {
  const backgroundFeature = findFeature(features, "theme-global-background");
  return {
    kind: "theme-global-typography",
    url:
      resolveThemeBackgroundPreviewUrl(backgroundFeature) ||
      resolveXConfigPreviewAsset(feature?.featureKey),
    displayMode: backgroundFeature?.config?.backgroundDisplayMode || "fill",
  };
}

const FEATURE_PREVIEW_RESOLVERS = Object.freeze({
  "avg-trend-arrow": () => ({
    kind: "avg-trend-arrow",
    url: resolveXConfigPreviewAsset("avg-trend-arrow"),
  }),
  "checkout-target-highlights": () => ({
    kind: "checkout-target-highlights",
    url: resolveXConfigPreviewAsset("checkout-target-highlights"),
  }),
  "checkout-suggestion-styles": () => ({
    kind: "checkout-suggestion-style",
    url: resolveXConfigPreviewAsset("checkout-suggestion-styles"),
  }),
  "bot-board-style": (feature) => ({
    kind: "board",
    url: resolveBoardStyleDesignAsset(feature?.config?.design),
  }),
  "dart-marker-replacer": (feature) => ({
    kind: "dart-marker",
    url: resolveDartDesignAsset(feature?.config?.design),
  }),
  "take-out-darts-alert": () => ({
    kind: "take-out-darts-alert",
    url: resolveXConfigPreviewAsset("take-out-darts-alert"),
  }),
  "turn-score-counter": () => ({
    kind: "turn-score-counter",
    url: resolveXConfigPreviewAsset("turn-score-counter"),
  }),
  "theme-global-background": (feature) => ({
    kind: "theme-global-background",
    url:
      resolveThemeBackgroundPreviewUrl(feature) ||
      resolveXConfigPreviewAsset("theme-global-background"),
    displayMode: feature?.config?.backgroundDisplayMode || "fill",
  }),
  "theme-global-typography": resolveThemeGlobalTypographyPreview,
  "theme-global-presets": (_feature, features) => resolveThemeGlobalPresetsPreview(features),
});

export function resolveFeatureCardPreview(feature, features = []) {
  const featureKey = String(feature?.featureKey || "").trim();
  const featurePreview = FEATURE_PREVIEW_RESOLVERS[featureKey]?.(feature, features);
  if (featurePreview?.url) {
    return featurePreview;
  }

  const themePreviewUrl = resolveThemeBackgroundPreviewUrl(feature);
  return {
    kind: "background",
    url: themePreviewUrl || resolveXConfigPreviewAsset(featureKey),
  };
}
