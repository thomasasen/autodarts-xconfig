import { getXConfigFeatureCopy, getXConfigFieldCopy, getXConfigFieldOptionCopy } from "./copy.js";

function checkboxField(key, label) {
  return Object.freeze({
    key,
    label,
    control: "checkbox",
  });
}

function selectField(key, label, options = []) {
  return Object.freeze({
    key,
    label,
    control: "select",
    options: Object.freeze(
      options.map((option) =>
        Object.freeze({
          value: option.value,
          label: option.label,
        })
      )
    ),
  });
}

function actionField(action, label, options = {}) {
  return Object.freeze({
    action,
    label,
    actionId: String(options.actionId || "").trim(),
    buttonLabel: String(options.buttonLabel || label).trim(),
    description: String(options.description || "").trim(),
    successMessage: String(options.successMessage || "").trim(),
    errorMessage: String(options.errorMessage || "").trim(),
    prominent: options.prominent === true,
    control: "action",
  });
}

function descriptorEntry(definition) {
  const featureKey = String(definition.featureKey || "").trim();
  const featureCopy = getXConfigFeatureCopy(featureKey);
  return Object.freeze({
    ...definition,
    description: featureCopy?.cardDescription || definition.description,
    visibleDescription: featureCopy?.visibleDescription || "",
    visualDescription: featureCopy?.visualDescription || "",
    usefulWhen: featureCopy?.usefulWhen || "",
    fields: Object.freeze(
      (definition.fields || []).map((field) => {
        const fieldKey = String(field.key || field.action || "").trim();
        const fieldCopy = getXConfigFieldCopy(featureKey, fieldKey);
        const nextOptions = Array.isArray(field.options)
          ? Object.freeze(
              field.options.map((option) => {
                const optionCopy = getXConfigFieldOptionCopy(featureKey, fieldKey, option.value);
                return Object.freeze({
                  ...option,
                  description: optionCopy?.description || "",
                  docsDescription: optionCopy?.docsDescription || "",
                  featuresDescription: optionCopy?.featuresDescription || "",
                });
              })
            )
          : field.options;
        return Object.freeze({
          ...field,
          description: fieldCopy?.description || field.description || "",
          docsDescription: fieldCopy?.docsDescription || "",
          featuresDescription: fieldCopy?.featuresDescription || "",
          options: nextOptions,
        });
      })
    ),
  });
}

const BACKGROUND_DISPLAY_OPTIONS = Object.freeze([
  { value: "fill", label: "Füllen" },
  { value: "fit", label: "Einpassen" },
  { value: "stretch", label: "Strecken" },
  { value: "center", label: "Zentriert" },
  { value: "tile", label: "Kacheln" },
]);

const BACKGROUND_OPACITY_OPTIONS = Object.freeze([
  { value: 100, label: "100 %" },
  { value: 85, label: "85 %" },
  { value: 70, label: "70 %" },
  { value: 55, label: "55 %" },
  { value: 40, label: "40 %" },
  { value: 25, label: "25 %" },
  { value: 10, label: "10 %" },
]);

const PLAYER_FIELD_TRANSPARENCY_OPTIONS = Object.freeze([
  { value: 0, label: "0 %" },
  { value: 5, label: "5 %" },
  { value: 10, label: "10 %" },
  { value: 15, label: "15 %" },
  { value: 30, label: "30 %" },
  { value: 45, label: "45 %" },
  { value: 60, label: "60 %" },
]);

export const xconfigDescriptors = Object.freeze([
  descriptorEntry({
    featureKey: "theme-x01",
    tab: "themes",
    readmeAnchor: "template-autodarts-theme-x01",
    description: "Klares X01-Layout mit optionalem AVG und eigenem Hintergrundbild.",
    fields: [
      checkboxField("showAvg", "AVG anzeigen"),
      selectField("backgroundDisplayMode", "Hintergrund-Darstellung", BACKGROUND_DISPLAY_OPTIONS),
      selectField("backgroundOpacity", "Hintergrundbild-Deckkraft", BACKGROUND_OPACITY_OPTIONS),
      selectField(
        "playerFieldTransparency",
        "Spielerfelder-Transparenz",
        PLAYER_FIELD_TRANSPARENCY_OPTIONS
      ),
      checkboxField("debug", "Debug"),
      actionField("uploadThemeBackground", "Hintergrundbild hochladen", {
        description: "Öffnet die Dateiauswahl und speichert das Bild nur für dieses Theme.",
      }),
      actionField("clearThemeBackground", "Hintergrundbild entfernen", {
        description: "Entfernt nur das gespeicherte Bild dieses Themes.",
        successMessage: "Hintergrundbild entfernt.",
      }),
    ],
  }),
  descriptorEntry({
    featureKey: "theme-shanghai",
    tab: "themes",
    readmeAnchor: "template-autodarts-theme-shanghai",
    description: "Aufgeräumtes Shanghai-Theme mit optionalem AVG und Hintergrundbild.",
    fields: [
      checkboxField("showAvg", "AVG anzeigen"),
      selectField("backgroundDisplayMode", "Hintergrund-Darstellung", BACKGROUND_DISPLAY_OPTIONS),
      selectField("backgroundOpacity", "Hintergrundbild-Deckkraft", BACKGROUND_OPACITY_OPTIONS),
      selectField(
        "playerFieldTransparency",
        "Spielerfelder-Transparenz",
        PLAYER_FIELD_TRANSPARENCY_OPTIONS
      ),
      checkboxField("debug", "Debug"),
      actionField("uploadThemeBackground", "Hintergrundbild hochladen", {
        description: "Öffnet die Dateiauswahl und speichert das Bild nur für dieses Theme.",
      }),
      actionField("clearThemeBackground", "Hintergrundbild entfernen", {
        description: "Entfernt nur das gespeicherte Bild dieses Themes.",
        successMessage: "Hintergrundbild entfernt.",
      }),
    ],
  }),
  descriptorEntry({
    featureKey: "theme-bermuda",
    tab: "themes",
    readmeAnchor: "template-autodarts-theme-bermuda",
    description: "Bermuda-Theme mit ruhigerem Layout und eigenem Hintergrundbild.",
    fields: [
      selectField("backgroundDisplayMode", "Hintergrund-Darstellung", BACKGROUND_DISPLAY_OPTIONS),
      selectField("backgroundOpacity", "Hintergrundbild-Deckkraft", BACKGROUND_OPACITY_OPTIONS),
      selectField(
        "playerFieldTransparency",
        "Spielerfelder-Transparenz",
        PLAYER_FIELD_TRANSPARENCY_OPTIONS
      ),
      checkboxField("debug", "Debug"),
      actionField("uploadThemeBackground", "Hintergrundbild hochladen", {
        description: "Öffnet die Dateiauswahl und speichert das Bild nur für dieses Theme.",
      }),
      actionField("clearThemeBackground", "Hintergrundbild entfernen", {
        description: "Entfernt nur das gespeicherte Bild dieses Themes.",
        successMessage: "Hintergrundbild entfernt.",
      }),
    ],
  }),
  descriptorEntry({
    featureKey: "theme-cricket",
    tab: "themes",
    readmeAnchor: "template-autodarts-theme-cricket",
    description: "Gemeinsames Theme für Cricket und Tactics mit optionalem AVG.",
    fields: [
      checkboxField("showAvg", "AVG anzeigen"),
      selectField("backgroundDisplayMode", "Hintergrund-Darstellung", BACKGROUND_DISPLAY_OPTIONS),
      selectField("backgroundOpacity", "Hintergrundbild-Deckkraft", BACKGROUND_OPACITY_OPTIONS),
      selectField(
        "playerFieldTransparency",
        "Spielerfelder-Transparenz",
        PLAYER_FIELD_TRANSPARENCY_OPTIONS
      ),
      checkboxField("debug", "Debug"),
      actionField("uploadThemeBackground", "Hintergrundbild hochladen", {
        description: "Öffnet die Dateiauswahl und speichert das Bild nur für dieses Theme.",
      }),
      actionField("clearThemeBackground", "Hintergrundbild entfernen", {
        description: "Entfernt nur das gespeicherte Bild dieses Themes.",
        successMessage: "Hintergrundbild entfernt.",
      }),
    ],
  }),
  descriptorEntry({
    featureKey: "theme-bull-off",
    tab: "themes",
    readmeAnchor: "template-autodarts-theme-bull-off",
    description: "Bull-off-Theme mit wählbarem Kontrast und Hintergrundbild.",
    fields: [
      selectField("contrastPreset", "Kontrast-Preset", [
        { value: "soft", label: "Sanft" },
        { value: "standard", label: "Standard" },
        { value: "high", label: "Kräftig" },
      ]),
      selectField("backgroundDisplayMode", "Hintergrund-Darstellung", BACKGROUND_DISPLAY_OPTIONS),
      selectField("backgroundOpacity", "Hintergrundbild-Deckkraft", BACKGROUND_OPACITY_OPTIONS),
      selectField(
        "playerFieldTransparency",
        "Spielerfelder-Transparenz",
        PLAYER_FIELD_TRANSPARENCY_OPTIONS
      ),
      checkboxField("debug", "Debug"),
      actionField("uploadThemeBackground", "Hintergrundbild hochladen", {
        description: "Öffnet die Dateiauswahl und speichert das Bild nur für dieses Theme.",
      }),
      actionField("clearThemeBackground", "Hintergrundbild entfernen", {
        description: "Entfernt nur das gespeicherte Bild dieses Themes.",
        successMessage: "Hintergrundbild entfernt.",
      }),
    ],
  }),
  descriptorEntry({
    featureKey: "checkout-score-pulse",
    tab: "animations",
    readmeAnchor: "animation-autodarts-animate-checkout-score-pulse",
    description: "Hebt finishfähige Restwerte in X01 sichtbar hervor.",
    fields: [
      selectField("effect", "Effekt", [
        { value: "pulse", label: "Pulse" },
        { value: "glow", label: "Glow" },
        { value: "scale", label: "Scale" },
        { value: "blink", label: "Blink" },
      ]),
      selectField("colorTheme", "Farbthema", [
        { value: "159, 219, 88", label: "Autodarts Grün" },
        { value: "56, 189, 248", label: "Cyan" },
        { value: "245, 158, 11", label: "Amber" },
        { value: "248, 113, 113", label: "Rot" },
      ]),
      selectField("intensity", "Intensität", [
        { value: "dezent", label: "Dezent" },
        { value: "standard", label: "Standard" },
        { value: "stark", label: "Stark" },
      ]),
      selectField("triggerSource", "Trigger-Quelle", [
        { value: "suggestion-first", label: "Vorschlag zuerst" },
        { value: "score-only", label: "Nur Score" },
        { value: "suggestion-only", label: "Nur Vorschlag" },
      ]),
      checkboxField("debug", "Debug"),
    ],
  }),
  descriptorEntry({
    featureKey: "checkout-board-targets",
    tab: "animations",
    readmeAnchor: "animation-autodarts-animate-checkout-board-targets",
    description: "Markiert sinnvolle Checkout-Ziele direkt am Board.",
    fields: [
      selectField("effect", "Effekt", [
        { value: "pulse", label: "Pulse" },
        { value: "blink", label: "Blink" },
        { value: "glow", label: "Glow" },
      ]),
      selectField("targetScope", "Zielumfang", [
        { value: "first", label: "Erstes Ziel" },
        { value: "all", label: "Alle Ziele" },
      ]),
      selectField("singleRing", "Single-Ring", [
        { value: "both", label: "Beide" },
        { value: "inner", label: "Innen" },
        { value: "outer", label: "Außen" },
      ]),
      selectField("colorTheme", "Farbthema", [
        { value: "violet", label: "Violett" },
        { value: "cyan", label: "Cyan" },
        { value: "amber", label: "Amber" },
      ]),
      selectField("outlineIntensity", "Kontur-Intensität", [
        { value: "dezent", label: "Dezent" },
        { value: "standard", label: "Standard" },
        { value: "stark", label: "Stark" },
      ]),
      checkboxField("debug", "Debug"),
    ],
  }),
  descriptorEntry({
    featureKey: "tv-board-zoom",
    tab: "animations",
    readmeAnchor: "animation-autodarts-animate-tv-board-zoom",
    description: "Zoomt bei klaren Checkout-Situationen TV-artig auf Zielbereiche.",
    fields: [
      selectField("zoomLevel", "Zoom-Stufe", [
        { value: 2.35, label: "2,35" },
        { value: 2.75, label: "2,75" },
        { value: 3.15, label: "3,15" },
      ]),
      selectField("zoomSpeed", "Zoom-Geschwindigkeit", [
        { value: "schnell", label: "Schnell" },
        { value: "mittel", label: "Mittel" },
        { value: "langsam", label: "Langsam" },
      ]),
      checkboxField("checkoutZoomEnabled", "Checkout-Zoom"),
      checkboxField("debug", "Debug"),
    ],
  }),
  descriptorEntry({
    featureKey: "style-checkout-suggestions",
    tab: "animations",
    readmeAnchor: "animation-autodarts-style-checkout-suggestions",
    description: "Macht Checkout-Hinweise auffälliger und besser lesbar.",
    fields: [
      selectField("style", "Stil", [
        { value: "badge", label: "Badge" },
        { value: "ribbon", label: "Ribbon" },
        { value: "stripe", label: "Stripe" },
        { value: "ticket", label: "Ticket" },
        { value: "outline", label: "Outline" },
      ]),
      selectField("labelText", "Labeltext", [
        { value: "CHECKOUT", label: "CHECKOUT" },
        { value: "FINISH", label: "FINISH" },
        { value: "", label: "Kein Label" },
      ]),
      selectField("colorTheme", "Farbthema", [
        { value: "amber", label: "Amber" },
        { value: "cyan", label: "Cyan" },
        { value: "rose", label: "Rose" },
      ]),
      checkboxField("debug", "Debug"),
    ],
  }),
  descriptorEntry({
    featureKey: "average-trend-arrow",
    tab: "animations",
    readmeAnchor: "animation-autodarts-animate-average-trend-arrow",
    description: "Zeigt die Trendrichtung des AVG mit einem Pfeil an.",
    fields: [
      selectField("durationMs", "Animationsdauer", [
        { value: 220, label: "Kurz" },
        { value: 320, label: "Standard" },
        { value: 500, label: "Lang" },
      ]),
      selectField("size", "Pfeil-Größe", [
        { value: "klein", label: "Klein" },
        { value: "standard", label: "Standard" },
        { value: "gross", label: "Groß" },
      ]),
      checkboxField("debug", "Debug"),
    ],
  }),
  descriptorEntry({
    featureKey: "turn-start-sweep",
    tab: "animations",
    readmeAnchor: "animation-autodarts-animate-turn-start-sweep",
    description: "Markiert den Spielerwechsel mit einem Sweep über die aktive Karte.",
    fields: [
      selectField("durationMs", "Sweep-Geschwindigkeit", [
        { value: 300, label: "Schnell" },
        { value: 420, label: "Standard" },
        { value: 620, label: "Langsam" },
      ]),
      selectField("sweepStyle", "Sweep-Stil", [
        { value: "subtle", label: "Dezent" },
        { value: "standard", label: "Standard" },
        { value: "strong", label: "Kräftig" },
      ]),
      checkboxField("debug", "Debug"),
    ],
  }),
  descriptorEntry({
    featureKey: "triple-double-bull-hits",
    tab: "animations",
    readmeAnchor: "animation-autodarts-animate-triple-double-bull-hits",
    description: "Hebt Triple-, Double- und Bull-Treffer in der Wurfliste hervor.",
    fields: [
      checkboxField("highlightTriple", "Triple hervorheben"),
      checkboxField("highlightDouble", "Double hervorheben"),
      checkboxField("highlightBull", "Bull hervorheben"),
      selectField("pollIntervalMs", "Aktualisierungsmodus", [
        { value: 0, label: "Nur live" },
        { value: 3000, label: "Kompatibel" },
      ]),
      checkboxField("debug", "Debug"),
    ],
  }),
  descriptorEntry({
    featureKey: "cricket-highlighter",
    tab: "animations",
    readmeAnchor: "animation-autodarts-animate-cricket-target-highlighter",
    description: "Visualisiert Ziel- und Druckzustände in Cricket und Tactics.",
    fields: [
      checkboxField("showOpenObjectives", "OPEN-Ziele anzeigen"),
      checkboxField("showDeadObjectives", "DEAD-Ziele anzeigen"),
      selectField("irrelevantBoardDimStyle", "Irrelevante Felder abdunkeln", [
        { value: "off", label: "Aus" },
        { value: "smoke", label: "Smoke" },
        { value: "hatch", label: "Hatch+" },
        { value: "mask", label: "Mask" },
      ]),
      selectField("colorTheme", "Farbthema", [
        { value: "standard", label: "Standard" },
        { value: "high-contrast", label: "High Contrast" },
      ]),
      selectField("intensity", "Intensität", [
        { value: "subtle", label: "Dezent" },
        { value: "normal", label: "Standard" },
        { value: "strong", label: "Stark" },
      ]),
      checkboxField("debug", "Debug"),
    ],
  }),
  descriptorEntry({
    featureKey: "cricket-grid-fx",
    tab: "animations",
    readmeAnchor: "animation-autodarts-animate-cricket-grid-fx",
    description: "Ergänzt die Cricket-/Tactics-Matrix um zusätzliche Live-Effekte.",
    fields: [
      checkboxField("rowWave", "Zeilen-Sweep"),
      checkboxField("badgeBeacon", "Ziel-Badge-Hinweis"),
      checkboxField("markProgress", "Mark-Fortschritt"),
      checkboxField("pressureEdge", "PRESSURE-Kante"),
      checkboxField("scoringStripe", "SCORING-Streifen"),
      checkboxField("deadRowMuted", "DEAD-Zeilen abdunkeln"),
      checkboxField("deltaChips", "Delta-Chips"),
      checkboxField("hitSpark", "Treffer-Impuls"),
      checkboxField("roundTransitionWipe", "Zugwechsel-Übergang"),
      checkboxField("pressureOverlay", "PRESSURE-Overlay"),
      selectField("colorTheme", "Farbthema", [
        { value: "standard", label: "Standard" },
        { value: "high-contrast", label: "High Contrast" },
      ]),
      selectField("intensity", "Intensität", [
        { value: "subtle", label: "Dezent" },
        { value: "normal", label: "Standard" },
        { value: "strong", label: "Stark" },
      ]),
      checkboxField("debug", "Debug"),
    ],
  }),
  descriptorEntry({
    featureKey: "dart-marker-emphasis",
    tab: "animations",
    readmeAnchor: "animation-autodarts-animate-dart-marker-emphasis",
    description: "Macht Marker auf dem virtuellen Dartboard deutlicher sichtbar.",
    fields: [
      selectField("size", "Marker-Größe", [
        { value: 4, label: "Klein" },
        { value: 6, label: "Standard" },
        { value: 9, label: "Groß" },
      ]),
      selectField("color", "Marker-Farbe", [
        { value: "rgb(49, 130, 206)", label: "Blau" },
        { value: "rgb(34, 197, 94)", label: "Grün" },
        { value: "rgb(248, 113, 113)", label: "Rot" },
        { value: "rgb(250, 204, 21)", label: "Gelb" },
        { value: "rgb(255, 255, 255)", label: "Weiß" },
      ]),
      selectField("effect", "Effekt", [
        { value: "glow", label: "Glow" },
        { value: "pulse", label: "Pulse" },
        { value: "none", label: "Kein Effekt" },
      ]),
      selectField("opacityPercent", "Marker-Sichtbarkeit", [
        { value: 65, label: "65 %" },
        { value: 85, label: "85 %" },
        { value: 100, label: "100 %" },
      ]),
      selectField("outline", "Outline-Farbe", [
        { value: "aus", label: "Aus" },
        { value: "weiss", label: "Weiß" },
        { value: "schwarz", label: "Schwarz" },
      ]),
      checkboxField("debug", "Debug"),
    ],
  }),
  descriptorEntry({
    featureKey: "dart-marker-darts",
    tab: "animations",
    readmeAnchor: "animation-autodarts-animate-dart-marker-darts",
    description: "Ersetzt Marker optional durch Dart-Bilder mit Fluganimation.",
    fields: [
      selectField("design", "Dart Design", [
        { value: "autodarts", label: "Autodarts" },
        { value: "blackblue", label: "Black Blue" },
        { value: "blackgreen", label: "Black Green" },
        { value: "blackred", label: "Black Red" },
        { value: "blue", label: "Blue" },
        { value: "camoflage", label: "Camouflage" },
        { value: "green", label: "Green" },
        { value: "pride", label: "Pride" },
        { value: "red", label: "Red" },
        { value: "white", label: "White" },
        { value: "whitetrible", label: "White Trible" },
        { value: "yellow", label: "Yellow" },
        { value: "yellowscull", label: "Yellow Scull" },
      ]),
      checkboxField("animateDarts", "Dart-Fluganimation"),
      selectField("sizePercent", "Dart-Größe", [
        { value: 90, label: "Klein" },
        { value: 100, label: "Standard" },
        { value: 115, label: "Groß" },
      ]),
      checkboxField("hideOriginalMarkers", "Original-Marker ausblenden"),
      selectField("flightSpeed", "Fluggeschwindigkeit", [
        { value: "schnell", label: "Schnell" },
        { value: "standard", label: "Standard" },
        { value: "cinematic", label: "Cinematic" },
      ]),
      checkboxField("debug", "Debug"),
    ],
  }),
  descriptorEntry({
    featureKey: "remove-darts-notification",
    tab: "animations",
    readmeAnchor: "animation-autodarts-animate-remove-darts-notification",
    description: "Macht den Hinweis zum Entfernen der Darts auffälliger.",
    fields: [
      selectField("imageSize", "Bildgröße", [
        { value: "compact", label: "Kompakt" },
        { value: "standard", label: "Standard" },
        { value: "large", label: "Groß" },
      ]),
      checkboxField("pulseAnimation", "Pulse-Animation"),
      selectField("pulseScale", "Pulse-Stärke", [
        { value: 1.02, label: "Dezent" },
        { value: 1.04, label: "Standard" },
        { value: 1.08, label: "Stark" },
      ]),
      checkboxField("debug", "Debug"),
    ],
  }),
  descriptorEntry({
    featureKey: "single-bull-sound",
    tab: "animations",
    readmeAnchor: "animation-autodarts-animate-single-bull-sound",
    description: "Spielt bei Single Bull einen kurzen Ton ab.",
    fields: [
      selectField("volume", "Lautstärke", [
        { value: 0.5, label: "Leise" },
        { value: 0.75, label: "Mittel" },
        { value: 0.9, label: "Standard" },
        { value: 1, label: "Sehr laut" },
      ]),
      selectField("cooldownMs", "Wiederholsperre", [
        { value: 400, label: "400 ms" },
        { value: 700, label: "700 ms" },
        { value: 1000, label: "1000 ms" },
      ]),
      selectField("pollIntervalMs", "Fallback-Scan", [
        { value: 0, label: "Nur live" },
        { value: 1200, label: "1200 ms" },
      ]),
      checkboxField("debug", "Debug"),
    ],
  }),
  descriptorEntry({
    featureKey: "turn-points-count",
    tab: "animations",
    readmeAnchor: "animation-autodarts-animate-turn-points-count",
    description: "Zählt Punkteänderungen sichtbar hoch oder runter.",
    fields: [
      selectField("durationMs", "Animationsdauer", [
        { value: 260, label: "Kurz" },
        { value: 416, label: "Standard" },
        { value: 650, label: "Lang" },
      ]),
      checkboxField("debug", "Debug"),
    ],
  }),
  descriptorEntry({
    featureKey: "winner-fireworks",
    tab: "animations",
    readmeAnchor: "animation-autodarts-animate-winner-fireworks",
    description: "Zeigt bei einem Sieg ein Feuerwerk in verschiedenen Stilen.",
    fields: [
      selectField("style", "Style", [
        { value: "realistic", label: "Realistic" },
        { value: "fireworks", label: "Fireworks" },
        { value: "cannon", label: "Cannon" },
        { value: "victorystorm", label: "Victory Storm" },
        { value: "stars", label: "Stars" },
        { value: "sides", label: "Sides" },
      ]),
      selectField("colorTheme", "Farbe", [
        { value: "autodarts", label: "Autodarts" },
        { value: "redwhite", label: "Rot/Weiß" },
        { value: "ice", label: "Ice" },
        { value: "sunset", label: "Sunset" },
        { value: "neon", label: "Neon" },
        { value: "gold", label: "Gold" },
      ]),
      selectField("intensity", "Intensität", [
        { value: "dezent", label: "Dezent" },
        { value: "standard", label: "Standard" },
        { value: "stark", label: "Stark" },
      ]),
      actionField("run-feature-action", "Test-Button", {
        actionId: "preview",
        buttonLabel: "Effekt jetzt testen",
        description:
          "Startet die aktuelle Einstellung sofort als Vorschau, auch im geöffneten xConfig-Fenster.",
        successMessage: "Vorschau gestartet.",
        errorMessage: "Vorschau konnte nicht gestartet werden.",
        prominent: true,
      }),
      checkboxField("includeBullOut", "Bei Bull-Out aktiv"),
      checkboxField("pointerDismiss", "Klick beendet Effekt"),
      checkboxField("debug", "Debug"),
    ],
  }),
]);

const descriptorsByFeatureKey = new Map(
  xconfigDescriptors.map((descriptor) => [descriptor.featureKey, descriptor])
);

export function getXConfigDescriptor(featureKey) {
  return descriptorsByFeatureKey.get(String(featureKey || "").trim()) || null;
}
