// Ordered precedence also applies when an option exposes multiple preview types.
const LAYOUT_FLAGS = Object.freeze([
  ["typography", "isTypographyFontField"],
  ["dart-design", "isDartDesignField"],
  ["turn-score", "hasTurnScoreCounterPreview"],
  ["avg-trend", "hasAvgTrendArrowPreview"],
  ["marker", "hasDartboardMarkerHighlightPreview"],
  ["checkout-score", "isCheckoutScoreHighlightPreviewSelectField"],
  ["checkout-targets", "isCheckoutTargetHighlightsPreviewSelectField"],
  ["remaining-score", "isX01RemainingScoreBarPreviewSelectField"],
  ["suggestion", "isCheckoutSuggestionStyleField"],
]);

export function resolveSelectOptionLayoutType(state) {
  return LAYOUT_FLAGS.find(([, flag]) => state[flag])?.[0] || "default";
}
