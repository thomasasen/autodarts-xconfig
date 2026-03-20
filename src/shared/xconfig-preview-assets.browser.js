import themeX01Png from "../../docs/screenshots/template-theme-x01-xConfig.png";
import themeShanghaiPng from "../../docs/screenshots/template-theme-shanghai-xConfig.png";
import themeBermudaPng from "../../docs/screenshots/template-theme-bermuda-xConfig.png";
import themeCricketPng from "../../docs/screenshots/template-theme-cricket-xConfig.png";
import themeBullOffPng from "../../docs/screenshots/template-theme-bull-off-xConfig.png";
import checkoutScorePulseGif from "../../docs/screenshots/animation-checkout-score-pulse.gif";
import x01ScoreProgressPng from "../../docs/screenshots/animation-x01-score-progress.png";
import checkoutBoardTargetsGif from "../../docs/screenshots/animation-checkout-board-targets.gif";
import tvBoardZoomGif from "../../docs/screenshots/animation-tv-board-zoom.gif";
import styleCheckoutSuggestionsPng from "../../docs/screenshots/animation-style-checkout-suggestions.png";
import cricketHighlighterPng from "../../docs/screenshots/animation-cricket-target-highlighter.png";
import cricketGridFxPng from "../../docs/screenshots/animation-cricket-grid-fx.png";
import averageTrendArrowPng from "../../docs/screenshots/animation-average-trend-arrow.png";
import turnStartSweepGif from "../../docs/screenshots/animation-turn-start-sweep.gif";
import tripleDoubleBullHitsGif from "../../docs/screenshots/animation-triple-double-bull-hits.gif";
import dartMarkerEmphasisGif from "../../docs/screenshots/animation-dart-marker-emphasis.gif";
import dartMarkerDartsPng from "../../docs/screenshots/animation-dart-marker-darts.png";
import removeDartsNotificationPng from "../../docs/screenshots/animation-remove-darts-notification.png";
import singleBullSoundGif from "../../docs/screenshots/animation-single-bull-sound.gif";
import turnPointsCountGif from "../../docs/screenshots/animation-turn-points-count.gif";
import winnerFireworksGif from "../../docs/screenshots/animation-winner-fireworks.gif";

export const XCONFIG_PREVIEW_ASSETS = Object.freeze({
  "theme-x01": themeX01Png,
  "theme-shanghai": themeShanghaiPng,
  "theme-bermuda": themeBermudaPng,
  "theme-cricket": themeCricketPng,
  "theme-bull-off": themeBullOffPng,
  "checkout-score-pulse": checkoutScorePulseGif,
  "x01-score-progress": x01ScoreProgressPng,
  "checkout-board-targets": checkoutBoardTargetsGif,
  "tv-board-zoom": tvBoardZoomGif,
  "style-checkout-suggestions": styleCheckoutSuggestionsPng,
  "cricket-highlighter": cricketHighlighterPng,
  "cricket-grid-fx": cricketGridFxPng,
  "average-trend-arrow": averageTrendArrowPng,
  "turn-start-sweep": turnStartSweepGif,
  "triple-double-bull-hits": tripleDoubleBullHitsGif,
  "dart-marker-emphasis": dartMarkerEmphasisGif,
  "dart-marker-darts": dartMarkerDartsPng,
  "remove-darts-notification": removeDartsNotificationPng,
  "single-bull-sound": singleBullSoundGif,
  "turn-points-count": turnPointsCountGif,
  "winner-fireworks": winnerFireworksGif,
});

export function resolveXConfigPreviewAsset(featureKey) {
  const key = String(featureKey || "").trim();
  return XCONFIG_PREVIEW_ASSETS[key] || "";
}
