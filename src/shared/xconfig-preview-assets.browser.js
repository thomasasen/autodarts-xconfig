import themeX01Png from "../../docs/screenshots/template-theme-x01-xConfig.png";
import themeShanghaiPng from "../../docs/screenshots/template-theme-shanghai-xConfig.png";
import themeBermudaPng from "../../docs/screenshots/template-theme-bermuda-xConfig.png";
import themeCricketPng from "../../docs/screenshots/template-theme-cricket-xConfig.png";
import themeBullOffPng from "../../docs/screenshots/template-theme-bull-off-xConfig.png";
import styleCheckoutSuggestionsPng from "../../docs/screenshots/animation-style-checkout-suggestions.png";
import cricketHighlighterPng from "../../docs/screenshots/animation-cricket-target-highlighter.png";
import averageTrendArrowPng from "../../docs/screenshots/animation-average-trend-arrow.png";
import dartMarkerDartsPng from "../../docs/screenshots/animation-dart-marker-darts.png";
import removeDartsNotificationPng from "../../docs/screenshots/animation-remove-darts-notification.png";

export const XCONFIG_PREVIEW_ASSETS = Object.freeze({
  "theme-x01": themeX01Png,
  "theme-shanghai": themeShanghaiPng,
  "theme-bermuda": themeBermudaPng,
  "theme-cricket": themeCricketPng,
  "theme-bull-off": themeBullOffPng,
  "style-checkout-suggestions": styleCheckoutSuggestionsPng,
  "cricket-highlighter": cricketHighlighterPng,
  "average-trend-arrow": averageTrendArrowPng,
  "dart-marker-darts": dartMarkerDartsPng,
  "remove-darts-notification": removeDartsNotificationPng,
});

export function resolveXConfigPreviewAsset(featureKey) {
  const key = String(featureKey || "").trim();
  return XCONFIG_PREVIEW_ASSETS[key] || "";
}
