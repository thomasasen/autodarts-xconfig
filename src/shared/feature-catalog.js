const rawFeatureCatalog = [
  {
    featureKey: "checkout-score-pulse",
    configKey: "checkoutScorePulse",
    title: "Checkout Score Pulse",
    variants: ["x01"],
    migratedFrom: "Animation/Autodarts Animate Checkout Score Pulse.user.js",
    legacyFeatureId: "a-checkout-pulse",
  },
  {
    featureKey: "checkout-board-targets",
    configKey: "checkoutBoardTargets",
    title: "Checkout Board Targets",
    variants: ["x01"],
    migratedFrom: "Animation/Autodarts Animate Checkout Board Targets.user.js",
    legacyFeatureId: "a-checkout-board",
  },
  {
    featureKey: "tv-board-zoom",
    configKey: "tvBoardZoom",
    title: "TV Board Zoom",
    variants: ["x01"],
    migratedFrom: "Animation/Autodarts Animate TV Board Zoom.user.js",
    legacyFeatureId: "a-tv-board-zoom",
  },
  {
    featureKey: "style-checkout-suggestions",
    configKey: "styleCheckoutSuggestions",
    title: "Style Checkout Suggestions",
    variants: ["x01"],
    migratedFrom: "Animation/Autodarts Style Checkout Suggestions.user.js",
    legacyFeatureId: "a-checkout-style",
  },
  {
    featureKey: "average-trend-arrow",
    configKey: "averageTrendArrow",
    title: "Average Trend Arrow",
    variants: ["all"],
    migratedFrom: "Animation/Autodarts Animate Average Trend Arrow.user.js",
    legacyFeatureId: "a-average-arrow",
  },
  {
    featureKey: "turn-start-sweep",
    configKey: "turnStartSweep",
    title: "Turn Start Sweep",
    variants: ["all"],
    migratedFrom: "Animation/Autodarts Animate Turn Start Sweep.user.js",
    legacyFeatureId: "a-turn-sweep",
  },
  {
    featureKey: "triple-double-bull-hits",
    configKey: "tripleDoubleBullHits",
    title: "Triple/Double/Bull Hits",
    variants: ["all"],
    migratedFrom: "Animation/Autodarts Animate Triple Double Bull Hits.user.js",
    legacyFeatureId: "a-triple-double-bull",
  },
  {
    featureKey: "cricket-highlighter",
    configKey: "cricketHighlighter",
    title: "Cricket Highlighter",
    variants: ["cricket", "tactics"],
    migratedFrom: "Animation/Autodarts Animate Cricket Target Highlighter.user.js",
    legacyFeatureId: "a-cricket-target",
  },
  {
    featureKey: "cricket-grid-fx",
    configKey: "cricketGridFx",
    title: "Cricket Grid FX",
    variants: ["cricket", "tactics"],
    migratedFrom: "Animation/Autodarts Animate Cricket Grid FX.user.js",
    legacyFeatureId: "a-cricket-grid-fx",
  },
  {
    featureKey: "dart-marker-emphasis",
    configKey: "dartMarkerEmphasis",
    title: "Dart Marker Emphasis",
    variants: ["all"],
    migratedFrom: "Animation/Autodarts Animate Dart Marker Emphasis.user.js",
    legacyFeatureId: "a-dart-marker-emphasis",
  },
  {
    featureKey: "dart-marker-darts",
    configKey: "dartMarkerDarts",
    title: "Dart Marker Darts",
    variants: ["all"],
    migratedFrom: "Animation/Autodarts Animate Dart Marker Darts.user.js",
    legacyFeatureId: "a-marker-darts",
  },
  {
    featureKey: "remove-darts-notification",
    configKey: "removeDartsNotification",
    title: "Remove Darts Notification",
    variants: ["all"],
    migratedFrom: "Animation/Autodarts Animate Remove Darts Notification.user.js",
    legacyFeatureId: "a-remove-darts",
  },
  {
    featureKey: "single-bull-sound",
    configKey: "singleBullSound",
    title: "Single Bull Sound",
    variants: ["all"],
    migratedFrom: "Animation/Autodarts Animate Single Bull Sound.user.js",
    legacyFeatureId: "a-single-bull",
  },
  {
    featureKey: "turn-points-count",
    configKey: "turnPointsCount",
    title: "Turn Points Count",
    variants: ["all"],
    migratedFrom: "Animation/Autodarts Animate Turn Points Count.user.js",
    legacyFeatureId: "a-turn-points",
  },
  {
    featureKey: "winner-fireworks",
    configKey: "winnerFireworks",
    title: "Winner Fireworks",
    variants: ["all"],
    migratedFrom: "Animation/Autodarts Animate Winner Fireworks.user.js",
    legacyFeatureId: "a-winner-fireworks",
  },
  {
    featureKey: "x01-score-progress",
    configKey: "x01ScoreProgress",
    title: "X01 Score Progress",
    variants: ["x01"],
    migratedFrom: "",
    legacyFeatureId: "",
  },
  {
    featureKey: "theme-global-typography",
    configKey: "themes.globalTypography",
    title: "Templates Global",
    variants: ["all"],
    migratedFrom: "",
    legacyFeatureId: "",
  },
  {
    featureKey: "theme-x01",
    configKey: "themes.x01",
    title: "Theme X01",
    variants: ["x01"],
    migratedFrom: "Template/Autodarts Theme X01.user.js",
    legacyFeatureId: "theme-x01",
  },
  {
    featureKey: "theme-x01-2player",
    configKey: "themes.x01TwoPlayer",
    title: "Theme X01 2Player (Beta)",
    variants: ["x01"],
    migratedFrom: "",
    legacyFeatureId: "",
  },
  {
    featureKey: "theme-shanghai",
    configKey: "themes.shanghai",
    title: "Theme Shanghai",
    variants: ["shanghai"],
    migratedFrom: "Template/Autodarts Theme Shanghai.user.js",
    legacyFeatureId: "theme-shanghai",
  },
  {
    featureKey: "theme-bermuda",
    configKey: "themes.bermuda",
    title: "Theme Bermuda",
    variants: ["bermuda"],
    migratedFrom: "Template/Autodarts Theme Bermuda.user.js",
    legacyFeatureId: "theme-bermuda",
  },
  {
    featureKey: "theme-cricket",
    configKey: "themes.cricket",
    title: "Theme Cricket",
    variants: ["cricket", "tactics"],
    migratedFrom: "Template/Autodarts Theme Cricket.user.js",
    legacyFeatureId: "theme-cricket",
  },
  {
    featureKey: "theme-bull-off",
    configKey: "themes.bullOff",
    title: "Theme Bull-off",
    variants: ["bull-off"],
    migratedFrom: "Template/Autodarts Theme Bull-off.user.js",
    legacyFeatureId: "theme-bull-off",
  },
];

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
      migratedFrom: String(entry.migratedFrom || "").trim(),
      legacyFeatureId: String(entry.legacyFeatureId || "").trim(),
    })
  )
);

export function getFeatureCatalogEntryByFeatureKey(featureKey) {
  const normalizedKey = String(featureKey || "").trim();
  return featureCatalog.find((entry) => entry.featureKey === normalizedKey) || null;
}

export function getFeatureCatalogEntryByConfigKey(configKey) {
  const normalizedKey = String(configKey || "").trim();
  return featureCatalog.find((entry) => entry.configKey === normalizedKey) || null;
}
