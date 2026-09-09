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

function normalizeComparableColor(value) {
  return String(value || "").trim().toUpperCase();
}

function matchesPresetTypography(config = {}, preset = {}) {
  const configuredScopes = Array.isArray(config.applyTo) ? config.applyTo : [];
  return (
    String(config.fontPreset || "").trim() === preset.fontPreset &&
    configuredScopes.length === preset.applyTo.length &&
    preset.applyTo.every((scope, index) => configuredScopes[index] === scope) &&
    normalizeComparableColor(config.accentColor) === normalizeComparableColor(preset.accentColor) &&
    normalizeComparableColor(config.scoreColor) === normalizeComparableColor(preset.scoreColor) &&
    normalizeComparableColor(config.secondaryTextColor) === normalizeComparableColor(preset.secondaryTextColor) &&
    normalizeComparableColor(config.throwLabelColor) === normalizeComparableColor(preset.throwLabelColor) &&
    Number(config.activePlayerTintIntensity) === Number(preset.activePlayerTintIntensity)
  );
}

function matchesPresetBackground(config = {}, preset = {}) {
  return (
    !String(config.backgroundImageDataUrl || "").trim() &&
    String(config.backgroundAssetKey || "").trim() === preset.backgroundAssetKey &&
    String(config.backgroundDisplayMode || "").trim() === preset.backgroundDisplayMode &&
    Number(config.backgroundOpacity) === Number(preset.backgroundOpacity) &&
    Number(config.playerFieldTransparency) === Number(preset.playerFieldTransparency)
  );
}

function isFeatureEnabled(feature) {
  if (typeof feature?.enabled === "boolean") {
    return feature.enabled;
  }
  return feature?.config?.enabled === true;
}

export function resolveThemeGlobalPresetState(features, preset) {
  if (!preset) {
    return "";
  }
  const backgroundFeature = findFeature(features, "theme-global-background");
  const typographyFeature = findFeature(features, "theme-global-typography");
  const backgroundConfig = backgroundFeature?.config || {};
  const typographyConfig = typographyFeature?.config || {};
  if (String(backgroundConfig.backgroundImageDataUrl || "").trim()) {
    return "";
  }

  const backgroundAssetKey = String(backgroundConfig.backgroundAssetKey || "").trim();
  const hasMatchingIdentity = preset.backgroundAssetKey
    ? backgroundAssetKey === preset.backgroundAssetKey
    : !backgroundAssetKey && String(typographyConfig.fontPreset || "").trim() === preset.fontPreset;
  if (!hasMatchingIdentity) {
    return "";
  }

  const bothEnabled = isFeatureEnabled(backgroundFeature) && isFeatureEnabled(typographyFeature);
  if (!bothEnabled) {
    return "disabled";
  }
  return matchesPresetBackground(backgroundConfig, preset) && matchesPresetTypography(typographyConfig, preset)
    ? "active"
    : "customized";
}

function resolveThemeGlobalPresetMatch(features) {
  for (const state of ["active", "customized", "disabled"]) {
    const preset = THEME_GLOBAL_TEMPLATE_PRESETS.find(
      (candidate) => resolveThemeGlobalPresetState(features, candidate) === state
    );
    if (preset) {
      return { preset, state };
    }
  }
  return { preset: null, state: "" };
}

function resolveRepresentativeThemeGlobalPreset() {
  return THEME_GLOBAL_TEMPLATE_PRESETS.find(
    (preset) => Boolean(resolveThemePresetAsset(preset.backgroundAssetKey))
  ) || THEME_GLOBAL_TEMPLATE_PRESETS[0] || null;
}

function resolveThemeGlobalPresetsPreview(features) {
  const match = resolveThemeGlobalPresetMatch(features);
  const preset = match.preset || resolveRepresentativeThemeGlobalPreset();
  return {
    kind: "theme-global-presets",
    url:
      resolveThemePresetAsset(preset?.backgroundAssetKey) ||
      resolveXConfigPreviewAsset("theme-global-presets"),
    preset,
    state: match.state,
    active: match.state === "active",
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
