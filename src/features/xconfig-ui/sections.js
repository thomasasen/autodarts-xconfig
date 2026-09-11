function sectionDefinition(id, title, description, featureKeys) {
  return Object.freeze({ id, title, description, featureKeys: Object.freeze(featureKeys) });
}

export const XCONFIG_SECTION_DEFINITIONS = Object.freeze([
  sectionDefinition(
    "template",
    "Design",
    "Designvorlagen, Hintergrund, Schrift und Farben für alle Spielansichten.",
    ["theme-global-presets", "theme-global-background", "theme-global-typography"]
  ),
  sectionDefinition(
    "all-modes",
    "Alle Modi",
    "Anzeigen, Darts, Treffermarkierungen und Komfortfunktionen für alle Spielmodi.",
    [
      "turn-score-counter",
      "avg-trend-arrow",
      "special-hit-highlights",
      "bot-board-style",
      "turn-dart-display",
      "dart-marker-replacer",
      "dartboard-marker-highlight",
      "take-out-darts-alert",
      "single-bull-hit-sound",
    ]
  ),
  sectionDefinition(
    "x01",
    "X01",
    "Checkout, Restscore, BUST und Board-Zoom für X01.",
    [
      "checkout-suggestion-styles",
      "checkout-score-highlight",
      "x01-remaining-score-bar",
      "x01-bust-active-player-highlight",
      "checkout-target-highlights",
      "tv-board-zoom",
    ]
  ),
  sectionDefinition(
    "cricket-tactics",
    "Cricket / Tactics",
    "Ziel- und Matrixeffekte für Cricket und Tactics.",
    ["cricket-target-highlighter", "cricket-grid-status-effects"]
  ),
]);

const sectionFeatureOrder = new Map(
  XCONFIG_SECTION_DEFINITIONS.flatMap((section) =>
    section.featureKeys.map((featureKey, index) => [featureKey, [section.id, index]])
  )
);

export function getXConfigSectionMeta(featureKey) {
  const sectionMeta = sectionFeatureOrder.get(String(featureKey || "").trim());
  if (!sectionMeta) {
    return {
      sectionId: "other",
      featureOrder: Number.MAX_SAFE_INTEGER,
    };
  }
  const [sectionId, featureOrder] = sectionMeta;
  return {
    sectionId,
    featureOrder,
  };
}
