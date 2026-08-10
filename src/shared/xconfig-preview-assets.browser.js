import themeGlobalTypographyWebp from "../assets/xconfig-previews/theme-global-typography.webp";
import themeX01Webp from "../assets/xconfig-previews/theme-x01.webp";
import themeGotchaWebp from "../assets/xconfig-previews/theme-gotcha.webp";
import themeX01TwoPlayerWebp from "../assets/xconfig-previews/theme-x01-2player.webp";
import themeShanghaiWebp from "../assets/xconfig-previews/theme-shanghai.webp";
import themeBermudaWebp from "../assets/xconfig-previews/theme-bermuda.webp";
import themeCricketWebp from "../assets/xconfig-previews/theme-cricket.webp";
import themeBullOffWebp from "../assets/xconfig-previews/theme-bull-off.webp";
import checkoutScoreHighlightWebp from "../assets/xconfig-previews/checkout-score-highlight.webp";
import x01RemainingScoreBarWebp from "../assets/xconfig-previews/x01-remaining-score-bar.webp";
import x01BustActivePlayerHighlightWebp from "../assets/xconfig-previews/x01-bust-active-player-highlight.webp";
import checkoutTargetHighlightsWebp from "../assets/xconfig-previews/checkout-target-highlights.webp";
import tvBoardZoomWebp from "../assets/xconfig-previews/tv-board-zoom.webp";
import checkoutSuggestionStylesWebp from "../assets/xconfig-previews/checkout-suggestion-styles.webp";
import cricketTargetHighlighterWebp from "../assets/xconfig-previews/cricket-target-highlighter.webp";
import cricketGridStatusEffectsWebp from "../assets/xconfig-previews/cricket-grid-status-effects.webp";
import avgTrendArrowWebp from "../assets/xconfig-previews/avg-trend-arrow.webp";
import activePlayerSweepWebp from "../assets/xconfig-previews/active-player-sweep.webp";
import specialHitHighlightsWebp from "../assets/xconfig-previews/special-hit-highlights.webp";
import dartboardMarkerHighlightWebp from "../assets/xconfig-previews/dartboard-marker-highlight.webp";
import dartMarkerReplacerWebp from "../assets/xconfig-previews/dart-marker-replacer.webp";
import takeOutDartsAlertWebp from "../assets/xconfig-previews/take-out-darts-alert.webp";
import singleBullHitSoundWebp from "../assets/xconfig-previews/single-bull-hit-sound.webp";
import turnScoreCounterWebp from "../assets/xconfig-previews/turn-score-counter.webp";
import winnerCelebrationEffectWebp from "../assets/xconfig-previews/winner-celebration-effect.webp";

export const XCONFIG_PREVIEW_ASSETS = Object.freeze({
  "theme-global-typography": themeGlobalTypographyWebp,
  "theme-x01": themeX01Webp,
  "theme-gotcha": themeGotchaWebp,
  "theme-x01-2player": themeX01TwoPlayerWebp,
  "theme-shanghai": themeShanghaiWebp,
  "theme-bermuda": themeBermudaWebp,
  "theme-cricket": themeCricketWebp,
  "theme-bull-off": themeBullOffWebp,
  "checkout-score-highlight": checkoutScoreHighlightWebp,
  "x01-remaining-score-bar": x01RemainingScoreBarWebp,
  "x01-bust-active-player-highlight": x01BustActivePlayerHighlightWebp,
  "checkout-target-highlights": checkoutTargetHighlightsWebp,
  "tv-board-zoom": tvBoardZoomWebp,
  "checkout-suggestion-styles": checkoutSuggestionStylesWebp,
  "cricket-target-highlighter": cricketTargetHighlighterWebp,
  "cricket-grid-status-effects": cricketGridStatusEffectsWebp,
  "avg-trend-arrow": avgTrendArrowWebp,
  "active-player-sweep": activePlayerSweepWebp,
  "special-hit-highlights": specialHitHighlightsWebp,
  "dartboard-marker-highlight": dartboardMarkerHighlightWebp,
  "dart-marker-replacer": dartMarkerReplacerWebp,
  "take-out-darts-alert": takeOutDartsAlertWebp,
  "single-bull-hit-sound": singleBullHitSoundWebp,
  "turn-score-counter": turnScoreCounterWebp,
  "winner-celebration-effect": winnerCelebrationEffectWebp,
});

export function resolveXConfigPreviewAsset(featureKey) {
  const key = String(featureKey || "").trim();
  return XCONFIG_PREVIEW_ASSETS[key] || "";
}
