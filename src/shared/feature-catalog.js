export const FEATURE_STARTUP_TIMINGS = Object.freeze({
  IMMEDIATE: "immediate",
  DEFERRED: "deferred",
});

export function normalizeFeatureStartupTiming(value) {
  return value === FEATURE_STARTUP_TIMINGS.IMMEDIATE
    ? FEATURE_STARTUP_TIMINGS.IMMEDIATE
    : FEATURE_STARTUP_TIMINGS.DEFERRED;
}

function catalogEntry(
  featureKey,
  configKey,
  title,
  variants,
  migratedFrom = "",
  legacyFeatureId = "",
  startupTiming = FEATURE_STARTUP_TIMINGS.DEFERRED
) {
  return { featureKey, configKey, title, variants, migratedFrom, legacyFeatureId, startupTiming };
}

const immediate = FEATURE_STARTUP_TIMINGS.IMMEDIATE;

const rawFeatureCatalog = [
  catalogEntry("checkout-score-highlight", "checkoutScoreHighlight", "Checkout Score Highlight", ["x01"], "Animation/Autodarts Animate Checkout Score Highlight.user.js", "a-checkout-pulse"),
  catalogEntry("checkout-target-highlights", "checkoutTargetHighlights", "Checkout Target Highlights", ["x01"], "Animation/Autodarts Animate Checkout Target Highlights.user.js", "a-checkout-board"),
  catalogEntry("tv-board-zoom", "tvBoardZoom", "TV Board Zoom", ["x01"], "Animation/Autodarts Animate TV Board Zoom.user.js", "a-tv-board-zoom"),
  catalogEntry("checkout-suggestion-styles", "checkoutSuggestionStyles", "Checkout Suggestion Styles", ["x01"], "Animation/Autodarts Checkout Suggestion Styles.user.js", "a-checkout-style", immediate),
  catalogEntry("avg-trend-arrow", "avgTrendArrow", "AVG Trend Arrow", ["all"], "Animation/Autodarts Animate AVG Trend Arrow.user.js", "a-average-arrow"),
  catalogEntry("active-player-sweep", "activePlayerSweep", "Active Player Sweep", ["all"], "Animation/Autodarts Animate Active Player Sweep.user.js", "a-turn-sweep"),
  catalogEntry("special-hit-highlights", "specialHitHighlights", "Special Hit Highlights", ["all"], "Animation/Autodarts Animate Special Hit Highlights.user.js", "a-triple-double-bull"),
  catalogEntry("cricket-target-highlighter", "cricketTargetHighlighter", "Cricket Target Highlighter", ["cricket", "tactics"], "Animation/Autodarts Animate Cricket Target Highlighter.user.js", "a-cricket-target"),
  catalogEntry("cricket-grid-status-effects", "cricketGridStatusEffects", "Cricket Grid Status Effects", ["cricket", "tactics"], "Animation/Autodarts Animate Cricket Grid Status Effects.user.js", "a-cricket-grid-status-effects"),
  catalogEntry("dartboard-marker-highlight", "dartboardMarkerHighlight", "Dartboard Marker Highlight", ["all"], "Animation/Autodarts Animate Dartboard Marker Highlight.user.js", "a-dartboard-marker-highlight"),
  catalogEntry("dart-marker-replacer", "dartMarkerReplacer", "Dart Marker Replacer", ["all"], "Animation/Autodarts Animate Dart Marker Replacer.user.js", "a-marker-darts"),
  catalogEntry("take-out-darts-alert", "takeOutDartsAlert", "Take Out Darts Alert", ["all"], "Animation/Autodarts Animate Take Out Darts Alert.user.js", "a-remove-darts"),
  catalogEntry("single-bull-hit-sound", "singleBullHitSound", "Single Bull Hit Sound", ["all"], "Animation/Autodarts Animate Single Bull Hit Sound.user.js", "a-single-bull"),
  catalogEntry("turn-score-counter", "turnScoreCounter", "Turn Score Counter", ["all"], "Animation/Autodarts Animate Turn Score Counter.user.js", "a-turn-points"),
  catalogEntry("winner-celebration-effect", "winnerCelebrationEffect", "Winner Celebration Effect", ["all"], "Animation/Autodarts Animate Winner Celebration Effect.user.js", "a-winner-celebration-effect"),
  catalogEntry("x01-remaining-score-bar", "x01RemainingScoreBar", "X01 Remaining Score Bar", ["x01"], "", "", immediate),
  catalogEntry("theme-global-typography", "themes.globalTypography", "Templates Global", ["all"], "", "", immediate),
  catalogEntry("theme-x01", "themes.x01", "Theme X01", ["x01"], "Template/Autodarts Theme X01.user.js", "theme-x01", immediate),
  catalogEntry("theme-gotcha", "themes.gotcha", "Theme Gotcha", ["gotcha"], "", "", immediate),
  catalogEntry("theme-x01-2player", "themes.x01TwoPlayer", "Theme X01 2Player (Beta)", ["x01"], "", "", immediate),
  catalogEntry("theme-shanghai", "themes.shanghai", "Theme Shanghai", ["shanghai"], "Template/Autodarts Theme Shanghai.user.js", "theme-shanghai", immediate),
  catalogEntry("theme-bermuda", "themes.bermuda", "Theme Bermuda", ["bermuda"], "Template/Autodarts Theme Bermuda.user.js", "theme-bermuda", immediate),
  catalogEntry("theme-cricket", "themes.cricket", "Theme Cricket", ["cricket", "tactics"], "Template/Autodarts Theme Cricket.user.js", "theme-cricket", immediate),
  catalogEntry("theme-bull-off", "themes.bullOff", "Theme Bull-off", ["bull-off"], "Template/Autodarts Theme Bull-off.user.js", "theme-bull-off", immediate),
];

const FEATURE_KEY_ALIASES = Object.freeze({
  "checkout-score-highlight": ["checkout-score-pulse"],
  "checkout-target-highlights": ["checkout-board-targets"],
  "checkout-suggestion-styles": ["style-checkout-suggestions"],
  "avg-trend-arrow": ["average-trend-arrow"],
  "active-player-sweep": ["turn-start-sweep"],
  "special-hit-highlights": ["triple-double-bull-hits"],
  "cricket-target-highlighter": ["cricket-highlighter"],
  "cricket-grid-status-effects": ["cricket-grid-fx"],
  "dartboard-marker-highlight": ["dart-marker-emphasis"],
  "dart-marker-replacer": ["dart-marker-darts"],
  "take-out-darts-alert": ["remove-darts-notification"],
  "single-bull-hit-sound": ["single-bull-sound"],
  "turn-score-counter": ["turn-points-count"],
  "winner-celebration-effect": ["winner-fireworks"],
  "x01-remaining-score-bar": ["x01-score-progress"],
});

const CONFIG_KEY_ALIASES = Object.freeze({
  checkoutScoreHighlight: ["checkoutScorePulse"],
  checkoutTargetHighlights: ["checkoutBoardTargets"],
  checkoutSuggestionStyles: ["styleCheckoutSuggestions"],
  avgTrendArrow: ["averageTrendArrow"],
  activePlayerSweep: ["turnStartSweep"],
  specialHitHighlights: ["tripleDoubleBullHits"],
  cricketTargetHighlighter: ["cricketHighlighter"],
  cricketGridStatusEffects: ["cricketGridFx"],
  dartboardMarkerHighlight: ["dartMarkerEmphasis"],
  dartMarkerReplacer: ["dartMarkerDarts"],
  takeOutDartsAlert: ["removeDartsNotification"],
  singleBullHitSound: ["singleBullSound"],
  turnScoreCounter: ["turnPointsCount"],
  winnerCelebrationEffect: ["winnerFireworks"],
  x01RemainingScoreBar: ["x01ScoreProgress"],
});

const LEGACY_FEATURE_IDS = Object.freeze({
  "cricket-grid-status-effects": "a-cricket-grid-fx",
  "dartboard-marker-highlight": "a-dart-marker-emphasis",
  "winner-celebration-effect": "a-winner-fireworks",
});

function normalizeAliasList(values) {
  return Object.freeze(
    (Array.isArray(values) ? values : [])
      .map((value) => String(value || "").trim())
      .filter(Boolean)
  );
}

export const featureCatalog = Object.freeze(
  rawFeatureCatalog.map((entry) =>
    Object.freeze({
      featureKey: String(entry.featureKey || "").trim(),
      configKey: String(entry.configKey || "").trim(),
      title: String(entry.title || "").trim(),
      variants: Object.freeze(
        Array.isArray(entry.variants)
          ? entry.variants.map((variant) => String(variant || "").trim()).filter(Boolean)
          : []
      ),
      startupTiming: normalizeFeatureStartupTiming(entry.startupTiming),
      migratedFrom: String(entry.migratedFrom || "").trim(),
      legacyFeatureId: String(LEGACY_FEATURE_IDS[entry.featureKey] || entry.legacyFeatureId || "").trim(),
      legacyFeatureKeys: normalizeAliasList(FEATURE_KEY_ALIASES[entry.featureKey]),
      legacyConfigKeys: normalizeAliasList(CONFIG_KEY_ALIASES[entry.configKey]),
    })
  )
);

export function getFeatureCatalogEntryByFeatureKey(featureKey) {
  const normalizedKey = String(featureKey || "").trim();
  return (
    featureCatalog.find(
      (entry) => entry.featureKey === normalizedKey || entry.legacyFeatureKeys.includes(normalizedKey)
    ) || null
  );
}

export function getFeatureCatalogEntryByConfigKey(configKey) {
  const normalizedKey = String(configKey || "").trim();
  return (
    featureCatalog.find(
      (entry) => entry.configKey === normalizedKey || entry.legacyConfigKeys.includes(normalizedKey)
    ) || null
  );
}
