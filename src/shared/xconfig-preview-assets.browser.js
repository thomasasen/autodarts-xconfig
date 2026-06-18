import themeGlobalTypographyPng from "../../docs/screenshots/template-theme-global-typography-xConfig.png";
import themeX01Png from "../../docs/screenshots/template-theme-x01-xConfig.png";
import themeGotchaPng from "../../docs/screenshots/template-theme-gotcha-xConfig.png";
import themeX01TwoPlayerJpg from "../../docs/screenshots/template-theme-x01-2player-xConfig.jpg";
import themeShanghaiPng from "../../docs/screenshots/template-theme-shanghai-xConfig.png";
import themeBermudaPng from "../../docs/screenshots/template-theme-bermuda-xConfig.png";
import themeCricketPng from "../../docs/screenshots/template-theme-cricket-xConfig.png";
import themeBullOffPng from "../../docs/screenshots/template-theme-bull-off-xConfig.png";
import checkoutScoreHighlightGif from "../../docs/screenshots/animation-checkout-score-pulse.gif";
import x01RemainingScoreBarPng from "../../docs/screenshots/animation-x01-score-progress.png";
import x01BustActivePlayerHighlightGif from "../../docs/screenshots/animation-x01-bust-active-player-highlight.gif";
import checkoutTargetHighlightsGif from "../../docs/screenshots/animation-checkout-board-targets.gif";
import tvBoardZoomGif from "../../docs/screenshots/animation-tv-board-zoom.gif";
import checkoutSuggestionStylesPng from "../../docs/screenshots/animation-style-checkout-suggestions.png";
import cricketTargetHighlighterPng from "../../docs/screenshots/animation-cricket-target-highlighter.png";
import cricketGridStatusEffectsPng from "../../docs/screenshots/animation-cricket-grid-fx.png";
import avgTrendArrowPng from "../../docs/screenshots/animation-average-trend-arrow.png";
import activePlayerSweepGif from "../../docs/screenshots/animation-turn-start-sweep.gif";
import specialHitHighlightsGif from "../../docs/screenshots/animation-triple-double-bull-hits.gif";
import dartboardMarkerHighlightGif from "../../docs/screenshots/animation-dart-marker-emphasis.gif";
import dartMarkerReplacerPng from "../../docs/screenshots/animation-dart-marker-darts.png";
import takeOutDartsAlertPng from "../../docs/screenshots/animation-remove-darts-notification.png";
import singleBullHitSoundGif from "../../docs/screenshots/animation-single-bull-sound.gif";
import turnScoreCounterGif from "../../docs/screenshots/animation-turn-points-count.gif";
import winnerCelebrationEffectGif from "../../docs/screenshots/animation-winner-fireworks.gif";

export const XCONFIG_PREVIEW_ASSETS = Object.freeze({
  "theme-global-typography": themeGlobalTypographyPng,
  "theme-x01": themeX01Png,
  "theme-gotcha": themeGotchaPng,
  "theme-x01-2player": themeX01TwoPlayerJpg,
  "theme-shanghai": themeShanghaiPng,
  "theme-bermuda": themeBermudaPng,
  "theme-cricket": themeCricketPng,
  "theme-bull-off": themeBullOffPng,
  "checkout-score-highlight": checkoutScoreHighlightGif,
  "x01-remaining-score-bar": x01RemainingScoreBarPng,
  "x01-bust-active-player-highlight": x01BustActivePlayerHighlightGif,
  "checkout-target-highlights": checkoutTargetHighlightsGif,
  "tv-board-zoom": tvBoardZoomGif,
  "checkout-suggestion-styles": checkoutSuggestionStylesPng,
  "cricket-target-highlighter": cricketTargetHighlighterPng,
  "cricket-grid-status-effects": cricketGridStatusEffectsPng,
  "avg-trend-arrow": avgTrendArrowPng,
  "active-player-sweep": activePlayerSweepGif,
  "special-hit-highlights": specialHitHighlightsGif,
  "dartboard-marker-highlight": dartboardMarkerHighlightGif,
  "dart-marker-replacer": dartMarkerReplacerPng,
  "take-out-darts-alert": takeOutDartsAlertPng,
  "single-bull-hit-sound": singleBullHitSoundGif,
  "turn-score-counter": turnScoreCounterGif,
  "winner-celebration-effect": winnerCelebrationEffectGif,
});

export function resolveXConfigPreviewAsset(featureKey) {
  const key = String(featureKey || "").trim();
  return XCONFIG_PREVIEW_ASSETS[key] || "";
}
