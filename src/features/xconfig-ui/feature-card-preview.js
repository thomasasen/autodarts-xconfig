import {
  resolveBoardStyleDesignAsset,
  resolveDartDesignAsset,
} from "#feature-assets";
import { resolveXConfigPreviewAsset } from "#xconfig-preview-assets";
import { resolveThemeBackgroundPreviewUrl } from "./theme-background.js";

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
});

export function resolveFeatureCardPreview(feature) {
  const featureKey = String(feature?.featureKey || "").trim();
  const featurePreview = FEATURE_PREVIEW_RESOLVERS[featureKey]?.(feature);
  if (featurePreview?.url) {
    return featurePreview;
  }

  const themePreviewUrl = resolveThemeBackgroundPreviewUrl(feature);
  return {
    kind: "background",
    url: themePreviewUrl || resolveXConfigPreviewAsset(featureKey),
  };
}
