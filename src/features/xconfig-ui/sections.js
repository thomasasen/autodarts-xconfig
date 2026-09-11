export const XCONFIG_SECTION_DEFINITIONS = Object.freeze([
  Object.freeze({
    id: "template",
    title: "Design",
    description: "Designvorlagen, Hintergrund, Schrift und Farben für alle Spielansichten.",
    featureKeys: Object.freeze([
      "theme-global-presets",
      "theme-global-background",
      "theme-global-typography",
    ]),
  }),
  Object.freeze({
    id: "all-modes",
    title: "Alle Modi",
    description: "Anzeigen, Darts, Treffermarkierungen und Komfortfunktionen für alle Spielmodi.",
    featureKeys: Object.freeze([
      "turn-score-counter",
      "avg-trend-arrow",
      "special-hit-highlights",
      "bot-board-style",
      "turn-dart-display",
      "dart-marker-replacer",
      "dartboard-marker-highlight",
      "take-out-darts-alert",
      "single-bull-hit-sound",
    ]),
  }),
  Object.freeze({
    id: "x01",
    title: "X01",
    description: "Checkout, Restscore, BUST und Board-Zoom für X01.",
    featureKeys: Object.freeze([
      "checkout-suggestion-styles",
      "checkout-score-highlight",
      "x01-remaining-score-bar",
      "x01-bust-active-player-highlight",
      "checkout-target-highlights",
      "tv-board-zoom",
    ]),
  }),
  Object.freeze({
    id: "cricket-tactics",
    title: "Cricket / Tactics",
    description: "Ziel- und Matrixeffekte für Cricket und Tactics.",
    featureKeys: Object.freeze([
      "cricket-target-highlighter",
      "cricket-grid-status-effects",
    ]),
  }),
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
