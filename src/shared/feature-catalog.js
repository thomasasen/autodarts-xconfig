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
  catalogEntry("checkout-score-highlight", "checkoutScoreHighlight", "Finishbaren Restscore hervorheben", ["x01"], "Animation/Autodarts Animate Checkout Score Highlight.user.js", "a-checkout-pulse"),
  catalogEntry("checkout-target-highlights", "checkoutTargetHighlights", "Checkout-Ziele hervorheben", ["x01"], "Animation/Autodarts Animate Checkout Target Highlights.user.js", "a-checkout-board"),
  catalogEntry("tv-board-zoom", "tvBoardZoom", "Automatischer Board-Zoom", ["x01"], "Animation/Autodarts Animate TV Board Zoom.user.js", "a-tv-board-zoom"),
  catalogEntry("checkout-suggestion-styles", "checkoutSuggestionStyles", "Checkout-Vorschlag gestalten", ["x01"], "Animation/Autodarts Checkout Suggestion Styles.user.js", "a-checkout-style", immediate),
  catalogEntry("x01-bust-active-player-highlight", "x01BustActivePlayerHighlight", "Überworfen (BUST) hervorheben", ["x01"], "", "", immediate),
  catalogEntry("avg-trend-arrow", "avgTrendArrow", "AVG-Trend anzeigen", ["all"], "Animation/Autodarts Animate AVG Trend Arrow.user.js", "a-average-arrow"),
  catalogEntry("special-hit-highlights", "specialHitHighlights", "Triple, Double & Bull hervorheben", ["all"], "Animation/Autodarts Animate Special Hit Highlights.user.js", "a-triple-double-bull"),
  catalogEntry("cricket-target-highlighter", "cricketTargetHighlighter", "Cricket-Ziele hervorheben", ["cricket", "tactics"], "Animation/Autodarts Animate Cricket Target Highlighter.user.js", "a-cricket-target"),
  catalogEntry("cricket-grid-status-effects", "cricketGridStatusEffects", "Cricket-Statusanzeigen", ["cricket", "tactics"], "Animation/Autodarts Animate Cricket Grid Status Effects.user.js", "a-cricket-grid-status-effects"),
  catalogEntry("dartboard-marker-highlight", "dartboardMarkerHighlight", "Treffermarkierungen hervorheben", ["all"], "Animation/Autodarts Animate Dartboard Marker Highlight.user.js", "a-dartboard-marker-highlight"),
  catalogEntry("dart-marker-replacer", "dartMarkerReplacer", "Treffermarkierungen durch Darts ersetzen", ["all"], "Animation/Autodarts Animate Dart Marker Replacer.user.js", "a-marker-darts"),
  catalogEntry("take-out-darts-alert", "takeOutDartsAlert", "Hinweis: Darts entfernen", ["all"], "Animation/Autodarts Animate Take Out Darts Alert.user.js", "a-remove-darts"),
  catalogEntry("single-bull-hit-sound", "singleBullHitSound", "Ton bei Single Bull", ["all"], "Animation/Autodarts Animate Single Bull Hit Sound.user.js", "a-single-bull"),
  catalogEntry("turn-score-counter", "turnScoreCounter", "Punkte animiert zählen", ["all"], "Animation/Autodarts Animate Turn Score Counter.user.js", "a-turn-points"),
  catalogEntry("x01-remaining-score-bar", "x01RemainingScoreBar", "Restscore-Balken", ["x01"], "", "", immediate),
  catalogEntry("theme-global-background", "themes.globalBackground", "Hintergrund", ["all"], "", "", immediate),
  catalogEntry("theme-global-typography", "themes.globalTypography", "Schrift & Farben", ["all"], "", "", immediate),
  catalogEntry("theme-global-presets", "themes.globalPresets", "Designvorlagen", ["all"], "", "", immediate),
  catalogEntry("bot-board-style", "botBoardStyle", "Dartboard-Design", ["all"]),
  catalogEntry("turn-dart-display", "turnDartDisplay", "Darts in der Wurfanzeige", ["all"], "", "", immediate),
];

const FEATURE_KEY_ALIASES = Object.freeze({
  "checkout-score-highlight": ["checkout-score-pulse"],
  "checkout-target-highlights": ["checkout-board-targets"],
  "checkout-suggestion-styles": ["style-checkout-suggestions"],
  "avg-trend-arrow": ["average-trend-arrow"],
  "special-hit-highlights": ["triple-double-bull-hits"],
  "cricket-target-highlighter": ["cricket-highlighter"],
  "cricket-grid-status-effects": ["cricket-grid-fx"],
  "dartboard-marker-highlight": ["dart-marker-emphasis"],
  "dart-marker-replacer": ["dart-marker-darts"],
  "take-out-darts-alert": ["remove-darts-notification"],
  "single-bull-hit-sound": ["single-bull-sound"],
  "turn-score-counter": ["turn-points-count"],
  "x01-remaining-score-bar": ["x01-score-progress"],
});

const CONFIG_KEY_ALIASES = Object.freeze({
  checkoutScoreHighlight: ["checkoutScorePulse"],
  checkoutTargetHighlights: ["checkoutBoardTargets"],
  checkoutSuggestionStyles: ["styleCheckoutSuggestions"],
  avgTrendArrow: ["averageTrendArrow"],
  specialHitHighlights: ["tripleDoubleBullHits"],
  cricketTargetHighlighter: ["cricketHighlighter"],
  cricketGridStatusEffects: ["cricketGridFx"],
  dartboardMarkerHighlight: ["dartMarkerEmphasis"],
  dartMarkerReplacer: ["dartMarkerDarts"],
  takeOutDartsAlert: ["removeDartsNotification"],
  singleBullHitSound: ["singleBullSound"],
  turnScoreCounter: ["turnPointsCount"],
  x01RemainingScoreBar: ["x01ScoreProgress"],
});

const LEGACY_FEATURE_IDS = Object.freeze({
  "cricket-grid-status-effects": "a-cricket-grid-fx",
  "dartboard-marker-highlight": "a-dart-marker-emphasis",
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
