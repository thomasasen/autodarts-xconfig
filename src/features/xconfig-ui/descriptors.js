import { getXConfigFeatureCopy, getXConfigFieldCopy, getXConfigFieldOptionCopy } from "./copy.js";
import { buildFeatureIndex, buildFeatureMap, normalizeFeatureKey } from "../feature-metadata.js";
import {
  THEME_GLOBAL_TYPOGRAPHY_FONT_PRESETS,
  THEME_GLOBAL_TYPOGRAPHY_SCOPE_OPTIONS,
} from "../../shared/theme-global-typography-presets.js";
import { THEME_GLOBAL_TEMPLATE_PRESETS } from "../../shared/theme-global-template-presets.js";
import { BOARD_STYLE_DESIGN_OPTIONS } from "../../shared/board-style-assets.manifest.js";
import { DART_DESIGN_OPTIONS } from "../../shared/feature-assets.manifest.js";
import { TURN_DART_ASSET_OPTIONS } from "../../shared/turn-dart-assets.manifest.js";

const X01_REMAINING_SCORE_BAR_COLOR_CYCLE_PREVIEW_EFFECT =
  "x01-remaining-score-bar-color-cycle";

function checkboxField(key, label, fieldOptions = {}) {
  return Object.freeze({
    key,
    label,
    control: "checkbox",
    section: String(fieldOptions.section || "").trim(),
  });
}

function selectField(key, label, options = [], fieldOptions = {}) {
  return Object.freeze({
    key,
    label,
    control: "select",
    section: String(fieldOptions.section || "").trim(),
    multiple: fieldOptions.multiple === true,
    options: Object.freeze(
      options.map((option) =>
        Object.freeze({
          value: option.value,
          label: option.label,
          previewFontFamily: String(option.previewFontFamily || "").trim(),
          previewEffect: String(option.previewEffect || "").trim(),
          previewColorTheme: String(option.previewColorTheme || "").trim(),
        })
      )
    ),
  });
}

function colorPreviewOption(value, label, previewColorTheme = value, previewEffect = "") {
  return { value, label, previewColorTheme, previewEffect };
}

function colorField(key, label, fieldOptions = {}) {
  return Object.freeze({
    key,
    label,
    control: "color",
    section: String(fieldOptions.section || "").trim(),
  });
}

function textField(key, label, fieldOptions = {}) {
  return Object.freeze({
    key,
    label,
    control: "text",
    section: String(fieldOptions.section || "").trim(),
    placeholder: String(fieldOptions.placeholder || "").trim(),
    maxLength: Math.max(0, Number(fieldOptions.maxLength) || 0),
  });
}

function actionField(action, label, options = {}) {
  return Object.freeze({
    key: String(options.key || "").trim(),
    action,
    label,
    actionId: String(options.actionId || "").trim(),
    buttonLabel: String(options.buttonLabel || label).trim(),
    section: String(options.section || "").trim(),
    description: String(options.description || "").trim(),
    successMessage: String(options.successMessage || "").trim(),
    errorMessage: String(options.errorMessage || "").trim(),
    previewColorTheme: String(options.previewColorTheme || "").trim(),
    previewTarget: String(options.previewTarget || "").trim(),
    prominent: options.prominent === true,
    control: "action",
  });
}

const README_ANCHOR_ALIASES = Object.freeze({
  "checkout-score-highlight": ["animation-autodarts-animate-checkout-score-pulse"],
  "x01-remaining-score-bar": ["animation-autodarts-x01-score-progress"],
  "checkout-target-highlights": ["animation-autodarts-animate-checkout-board-targets"],
  "checkout-suggestion-styles": ["animation-autodarts-style-checkout-suggestions"],
  "avg-trend-arrow": ["animation-autodarts-animate-average-trend-arrow"],
  "special-hit-highlights": ["animation-autodarts-animate-triple-double-bull-hits"],
  "cricket-target-highlighter": ["animation-autodarts-animate-cricket-highlighter"],
  "cricket-grid-status-effects": ["animation-autodarts-animate-cricket-grid-fx"],
  "dartboard-marker-highlight": ["animation-autodarts-animate-dart-marker-emphasis"],
  "dart-marker-replacer": ["animation-autodarts-animate-dart-marker-darts"],
  "take-out-darts-alert": ["animation-autodarts-animate-remove-darts-notification"],
  "single-bull-hit-sound": ["animation-autodarts-animate-single-bull-sound"],
  "turn-score-counter": ["animation-autodarts-animate-turn-points-count"],
});

const NEW_DESIGN_READY_FEATURE_KEYS = new Set([
  "theme-global-background",
  "theme-global-typography",
  "theme-global-presets",
  "bot-board-style",
  "turn-dart-display",
  "tv-board-zoom",
  "checkout-target-highlights",
  "checkout-suggestion-styles",
  "checkout-score-highlight",
  "avg-trend-arrow",
  "dart-marker-replacer",
  "dartboard-marker-highlight",
  "take-out-darts-alert",
  "single-bull-hit-sound",
  "special-hit-highlights",
  "turn-score-counter",
  "x01-remaining-score-bar",
  "cricket-target-highlighter",
  "cricket-grid-status-effects",
]);

function descriptorEntry(definition) {
  const featureKey = normalizeFeatureKey(definition.featureKey);
  const featureCopy = getXConfigFeatureCopy(featureKey);
  return Object.freeze({
    ...definition,
    cardType: definition.cardType === "action" ? "action" : "toggle",
    designStatus: NEW_DESIGN_READY_FEATURE_KEYS.has(featureKey) ? "ready" : "deprecated",
    readmeAnchorAliases: Object.freeze([
      ...(Array.isArray(definition.readmeAnchorAliases)
        ? definition.readmeAnchorAliases.map((entry) => String(entry || "").trim()).filter(Boolean)
        : []),
      ...(README_ANCHOR_ALIASES[featureKey] || []),
    ]),
    description: featureCopy?.cardDescription || definition.description,
    visibleDescription: featureCopy?.visibleDescription || "",
    visualDescription: featureCopy?.visualDescription || "",
    usefulWhen: featureCopy?.usefulWhen || "",
    settingsDetailHeading: featureCopy?.readmeDetailHeading || "",
    settingsDetails: Object.freeze(
      Array.isArray(featureCopy?.featuresDetails)
        ? featureCopy.featuresDetails
            .map((entry) => String(entry || "").trim())
            .filter(Boolean)
        : []
    ),
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

function animationDescriptorEntry(definition) {
  const fields = Array.isArray(definition.fields) ? definition.fields : [];
  return descriptorEntry({
    ...definition,
    fields: [...fields, DEBUG_FIELD],
  });
}

function selectValueLabelField(key, label, entries, fieldOptions = {}) {
  return selectField(
    key,
    label,
    entries.map(([value, optionLabel]) => ({ value, label: optionLabel })),
    fieldOptions
  );
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
  { value: 30, label: "30 %" },
  { value: 25, label: "25 %" },
  { value: 20, label: "20 %" },
  { value: 15, label: "15 %" },
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

const ACTIVE_PLAYER_TINT_INTENSITY_OPTIONS = Object.freeze([
  { value: 0, label: "Aus" },
  { value: 10, label: "10 %" },
  { value: 15, label: "15 %" },
  { value: 20, label: "20 %" },
  { value: 25, label: "25 %" },
  { value: 30, label: "30 %" },
]);

const TURN_DART_STYLE_OPTIONS = Object.freeze([
  { value: "original", label: "Original" },
  { value: "solid", label: "Farbe" },
  { value: "gradient", label: "Verlauf" },
  { value: "preset", label: "Dart-Bild" },
  { value: "image", label: "Eigenes Bild" },
]);

const TURN_DART_SIZE_OPTIONS = Object.freeze([
  { value: 100, label: "Kompakt" },
  { value: 115, label: "Standard" },
  { value: 135, label: "Groß" },
]);
const DEBUG_FIELD = checkboxField("debug", "Diagnose");

const THEME_GLOBAL_TEMPLATE_PRESET_SECTIONS = Object.freeze([
  Object.freeze({
    label: "Empfohlen",
    keys: Object.freeze(["classic", "broadcast", "darts-arena", "crimson-facets", "cyberpunk", "matrix"]),
  }),
  Object.freeze({
    label: "Atmosphäre",
    keys: Object.freeze(["fire", "ice", "aqua-flux", "neon-splash", "solar-pulse"]),
  }),
  Object.freeze({
    label: "Regional",
    keys: Object.freeze(["british-flag", "deutschland", "bayern"]),
  }),
  Object.freeze({
    label: "Cinematic",
    keys: Object.freeze(["spider-man", "john-wick", "endgame", "gladiator", "dark-side"]),
  }),
]);

const THEME_GLOBAL_TEMPLATE_PRESET_FIELDS = Object.freeze(
  THEME_GLOBAL_TEMPLATE_PRESET_SECTIONS.flatMap((section) =>
    section.keys.map((presetKey) => {
      const preset = THEME_GLOBAL_TEMPLATE_PRESETS.find((entry) => entry.key === presetKey);
      return actionField("applyThemeGlobalPreset", preset.label, {
        key: `preset-${preset.key}`,
        actionId: preset.key,
        buttonLabel: preset.label,
        previewTarget: "theme-global-template-preset",
        section: section.label,
      });
    })
  )
);

export const xconfigDescriptors = Object.freeze([
  descriptorEntry({
    featureKey: "theme-global-presets",
    readmeAnchor: "theme-global-presets",
    cardType: "action",
    fields: THEME_GLOBAL_TEMPLATE_PRESET_FIELDS,
  }),
  descriptorEntry({
    featureKey: "theme-global-background",
    readmeAnchor: "theme-global-background",
    fields: [
      selectField("backgroundDisplayMode", "Bildanpassung", BACKGROUND_DISPLAY_OPTIONS),
      selectField("backgroundOpacity", "Sichtbarkeit des Hintergrundbilds", BACKGROUND_OPACITY_OPTIONS),
      selectField("playerFieldTransparency", "Durchsichtigkeit der Spielerfelder", PLAYER_FIELD_TRANSPARENCY_OPTIONS),
      actionField("uploadThemeBackground", "Hintergrundbild hochladen", {
        description: "Speichert ein globales Hintergrundbild für alle Spielansichten.",
      }),
      actionField("clearThemeBackground", "Hintergrundbild entfernen", {
        description: "Entfernt das gespeicherte globale Hintergrundbild.",
        successMessage: "Globales Hintergrundbild entfernt.",
      }),
      DEBUG_FIELD,
    ],
  }),
  descriptorEntry({
    featureKey: "theme-global-typography",
    readmeAnchor: "template-global-typography",
    description: "Spielübergreifende Schrift und Farben für Scores, Würfe und Namen.",
    fields: [
      selectField("fontPreset", "Schriftart", THEME_GLOBAL_TYPOGRAPHY_FONT_PRESETS, {
        section: "Schrift",
      }),
      selectField("applyTo", "Schrift anwenden auf", THEME_GLOBAL_TYPOGRAPHY_SCOPE_OPTIONS, {
        multiple: true,
        section: "Schrift",
      }),
      colorField("accentColor", "Farbe des aktiven Spielers", {
        section: "Farben",
      }),
      colorField("scoreColor", "Score-Farbe", {
        section: "Farben",
      }),
      colorField("secondaryTextColor", "Namen und Statistiken", {
        section: "Farben",
      }),
      colorField("throwLabelColor", "Wurf- und Checkout-Hinweise", {
        section: "Farben",
      }),
      selectField(
        "activePlayerTintIntensity",
        "Hintergrund des aktiven Spielers",
        ACTIVE_PLAYER_TINT_INTENSITY_OPTIONS,
        {
          section: "Farben",
        }
      ),
      DEBUG_FIELD,
    ],
  }),
  animationDescriptorEntry({
    featureKey: "bot-board-style",
    readmeAnchor: "bot-board-style",
    fields: [
      selectField("design", "Board-Design", BOARD_STYLE_DESIGN_OPTIONS),
      selectField("scope", "Anwenden auf", [
        { value: "bot-turns", label: "Nur bei Bot-Zügen" },
        { value: "all-match-boards", label: "Alle Match-Boards" },
      ]),
    ],
  }),
  animationDescriptorEntry({
    featureKey: "turn-dart-display",
    readmeAnchor: "turn-dart-display",
    fields: [
      selectField("turnDartStyle", "Stil", TURN_DART_STYLE_OPTIONS),
      selectField("turnDartAssetKey", "Dart auswählen", TURN_DART_ASSET_OPTIONS),
      textField("turnDartTextTemplate", "Dart-Text", { placeholder: "Wurf #", maxLength: 48 }),
      colorField("turnDartColor", "Dart-Farbe"),
      colorField("turnDartGradientColor", "Verlaufsfarbe"),
      selectField("turnDartSizePercent", "Dart-Größe", TURN_DART_SIZE_OPTIONS),
      checkboxField("turnDartShineEnabled", "Leuchteffekt"),
      actionField("uploadTurnDartImage", "Dart-Bild hochladen", {
        description: "Empfohlen: transparentes PNG oder WebP, horizontal und eng zugeschnitten. Das Bild wird lokal auf maximal 960×240 optimiert und bis 350 KB gespeichert.",
      }),
      actionField("clearTurnDartImage", "Dart-Bild entfernen", {
        description: "Entfernt das gespeicherte globale Dart-Bild.",
        successMessage: "Dart-Bild entfernt.",
      }),
    ],
  }),
  animationDescriptorEntry({
    featureKey: "checkout-score-highlight",
    readmeAnchor: "animation-autodarts-animate-checkout-score-highlight",
    description: "Hebt finishfähige Restwerte in X01 sichtbar hervor.",
    fields: [
      selectValueLabelField("effect", "Animation", [
        ["grow-glow", "Vergrößern & leuchten"], ["glow-only", "Nur leuchten"],
        ["grow-only", "Nur vergrößern"], ["fade-blink", "Sanft blinken"],
      ]),
      selectField("colorTheme", "Farbe", [
        colorPreviewOption("159, 219, 88", "Autodarts Grün", "checkout-score-autodarts-green"),
        colorPreviewOption("56, 189, 248", "Cyan", "checkout-score-cyan"),
        colorPreviewOption("245, 158, 11", "Amber", "checkout-score-amber"),
        colorPreviewOption("248, 113, 113", "Rot", "checkout-score-red"),
      ]),
      selectValueLabelField("intensity", "Stärke", [
        ["dezent", "Dezent"], ["standard", "Standard"], ["stark", "Stark"],
      ]),
      selectValueLabelField("triggerSource", "Finish-Erkennung", [
        ["suggestion-first", "Vorschlag zuerst"], ["score-only", "Nur Score"],
        ["suggestion-only", "Nur Vorschlag"],
      ]),
    ],
  }),
  animationDescriptorEntry({
    featureKey: "x01-remaining-score-bar",
    readmeAnchor: "animation-autodarts-x01-remaining-score-bar",
    description: "Zeigt den verbleibenden X01-Score als abnehmenden Balken pro Spielerkarte.",
    fields: [
      selectField("colorTheme", "Farben", [
        colorPreviewOption("checkout-focus", "Checkout Focus", "x01-checkout-focus", X01_REMAINING_SCORE_BAR_COLOR_CYCLE_PREVIEW_EFFECT),
        colorPreviewOption("checkout-zone-blue", "Checkout-Zone Blau/Weiß", "x01-checkout-zone-blue", X01_REMAINING_SCORE_BAR_COLOR_CYCLE_PREVIEW_EFFECT),
        colorPreviewOption("traffic-light", "Traffic Light", "x01-traffic-light", X01_REMAINING_SCORE_BAR_COLOR_CYCLE_PREVIEW_EFFECT),
        colorPreviewOption("danger-endgame", "Danger Endgame", "x01-danger-endgame", X01_REMAINING_SCORE_BAR_COLOR_CYCLE_PREVIEW_EFFECT),
        colorPreviewOption("gradient-by-progress", "Gradient Progress", "x01-gradient-by-progress", X01_REMAINING_SCORE_BAR_COLOR_CYCLE_PREVIEW_EFFECT),
        colorPreviewOption("autodarts", "Autodarts", "x01-autodarts"),
        colorPreviewOption("signal-lime", "Signal Lime", "x01-signal-lime"),
        colorPreviewOption("glass-mint", "Glass Mint", "x01-glass-mint"),
        colorPreviewOption("ember-rush", "Ember Rush", "x01-ember-rush"),
        colorPreviewOption("ice-circuit", "Ice Circuit", "x01-ice-circuit"),
        colorPreviewOption("neon-violet", "Neon Violet", "x01-neon-violet"),
        colorPreviewOption("sunset-amber", "Sunset Amber", "x01-sunset-amber"),
        colorPreviewOption("monochrome-steel", "Monochrome Steel", "x01-monochrome-steel"),
      ]),
      selectValueLabelField("barSize", "Balkengröße", [
        ["schmal", "Schmal"], ["standard", "Standard"], ["breit", "Breit"],
        ["extrabreit", "Extrabreit"],
      ]),
      selectValueLabelField("effect", "Animation", [
        ["bar-pulse", "Balken pulsieren"], ["glass-light-sweep", "Lichtlauf"],
        ["moving-segments", "Laufende Segmente"],
        ["previous-score-trail", "Vorherigen Stand anzeigen"],
        ["fast-signal-sweep", "Schneller Lichtlauf"], ["off", "Aus"],
      ]),
    ],
  }),
  animationDescriptorEntry({
    featureKey: "checkout-target-highlights",
    readmeAnchor: "animation-autodarts-animate-checkout-target-highlights",
    description: "Markiert sinnvolle Checkout-Ziele direkt am Board.",
    fields: [
      selectValueLabelField("visualPreset", "Animation", [
        ["soft-pulse", "Sanft pulsieren"], ["fast-blink", "Schnell blinken"],
        ["slow-glow", "Langsam leuchten"],
      ]),
      selectValueLabelField("segmentStyle", "Art der Hervorhebung", [
        ["surface-outline", "Fläche + Rahmen"], ["surface-only", "Nur Fläche"],
      ]),
      selectValueLabelField("targetSelectionMode", "Zielauswahl", [
        ["next", "Nächstes Feld"], ["all", "Alle Felder"], ["finish", "Nur Finish"],
      ]),
      selectField("colorTheme", "Farbe", [
        colorPreviewOption("violet", "Violett", "checkout-board-violet"),
        colorPreviewOption("cyan", "Cyan", "checkout-board-cyan"),
        colorPreviewOption("amber", "Amber", "checkout-board-amber"),
        colorPreviewOption("lime", "Lime", "checkout-board-lime"),
        colorPreviewOption("rose", "Rose", "checkout-board-rose"),
        colorPreviewOption("white", "Weiß", "checkout-board-white"),
      ]),
    ],
  }),
  animationDescriptorEntry({
    featureKey: "tv-board-zoom",
    readmeAnchor: "animation-autodarts-animate-tv-board-zoom",
    description: "Zoomt bei klaren Checkout- und Setup-Situationen TV-artig auf Zielbereiche.",
    fields: [
      selectValueLabelField("zoomLevel", "Zoomstärke", [
        [2.35, "Leicht"], [2.75, "Mittel"], [3.15, "Stark"],
      ]),
      selectValueLabelField("zoomSpeed", "Zoom-Geschwindigkeit", [
        ["schnell", "Schnell"], ["mittel", "Mittel"], ["langsam", "Langsam"],
      ]),
      checkboxField("checkoutZoomEnabled", "Checkout-Zoom"),
      selectValueLabelField("checkoutZoomTarget", "Zoom auf", [
        ["finish-only", "Nur Finish-Feld"], ["route-first", "Erstes Routenfeld"],
      ]),
      checkboxField("t20SetupZoomEnabled", "Auch auf T20-Setup zoomen"),
    ],
  }),
  animationDescriptorEntry({
    featureKey: "checkout-suggestion-styles",
    readmeAnchor: "animation-autodarts-checkout-suggestion-styles",
    description: "Vergrößert die Turn-Felder und gestaltet Checkout-Hinweise theme-kompatibel.",
    fields: [
      selectValueLabelField("style", "Darstellung", [
        ["badge", "Plakette"], ["ribbon", "Band"], ["stripe", "Streifen"],
        ["ticket", "Ticket"], ["outline", "Rahmen"],
      ]),
      selectValueLabelField("labelText", "Beschriftung", [
        ["CHECKOUT", "CHECKOUT"], ["FINISH", "FINISH"], ["", "Kein Label"],
      ]),
      selectField("colorTheme", "Farbe", [
        colorPreviewOption("amber", "Amber", "checkout-suggestion-amber"),
        colorPreviewOption("cyan", "Cyan", "checkout-suggestion-cyan"),
        colorPreviewOption("rose", "Rose", "checkout-suggestion-rose"),
      ]),
    ],
  }),
  animationDescriptorEntry({
    featureKey: "x01-bust-active-player-highlight",
    readmeAnchor: "animation-autodarts-x01-bust-active-player-highlight",
    description: "Färbt die aktive X01-Spielerkarte bei BUST rot und schüttelt sie kurz.",
    fields: [
      actionField("run-feature-action", "Vorschau", {
        key: "preview",
        actionId: "preview",
        buttonLabel: "BUST auslösen",
        section: "Vorschau",
        description:
          "Zeigt die rote aktive Spielerkarte mit der aktuell gewählten Anzahl Glasrisse.",
        successMessage: "",
        errorMessage: "Vorschau konnte nicht gestartet werden.",
        prominent: true,
        previewTarget: "x01-bust-active-player-highlight",
      }),
      selectField(
        "crackCount",
        "Glasrisse",
        Array.from({ length: 4 }, (_, crackCount) => ({
          value: crackCount,
          label: crackCount === 0 ? "Aus" : String(crackCount),
        }))
      ),
      checkboxField("shakeEnabled", "Spielerkarte kurz schütteln"),
      checkboxField("soundEnabled", "Glasbruch-Sound"),
    ],
  }),
  animationDescriptorEntry({
    featureKey: "avg-trend-arrow",
    readmeAnchor: "animation-autodarts-animate-avg-trend-arrow",
    description: "Zeigt die Trendrichtung des AVG mit einem Pfeil an.",
    fields: [
      selectField("durationMs", "Animationsdauer", [
        { value: 220, label: "Kurz" },
        { value: 320, label: "Standard" },
        { value: 500, label: "Lang" },
      ]),
      selectField("size", "Pfeilgröße", [
        { value: "klein", label: "Klein" },
        { value: "standard", label: "Standard" },
        { value: "gross", label: "Groß" },
      ]),
    ],
  }),
  animationDescriptorEntry({
    featureKey: "special-hit-highlights",
    readmeAnchor: "animation-autodarts-animate-special-hit-highlights",
    description: "Setzt Treffer-Highlights mit wählbarem Farbstil und starkem Burst-Animationsstil.",
    fields: [
      selectField("colorTheme", "Farbstil", [
        { value: "kind-signal", label: "Rot/Blau/Grün", previewColorTheme: "kind-signal" },
        { value: "ember-rush", label: "Solar Flare", previewColorTheme: "ember-rush" },
        { value: "ice-circuit", label: "Ice Reactor", previewColorTheme: "ice-circuit" },
        { value: "volt-lime", label: "Venom Lime", previewColorTheme: "volt-lime" },
        { value: "crimson-steel", label: "Crimson Velocity", previewColorTheme: "crimson-steel" },
        { value: "arctic-mint", label: "Polar Mint", previewColorTheme: "arctic-mint" },
        { value: "champagne-night", label: "Midnight Gold", previewColorTheme: "champagne-night" },
      ]),
      selectField("animationStyle", "Animation", [
        { value: "pop-hit", label: "Aufspringen", previewEffect: "pop-hit" },
        { value: "side-shake", label: "Seitlich wackeln", previewEffect: "side-shake" },
        { value: "glow-pop", label: "Aufleuchten", previewEffect: "glow-pop" },
        { value: "flip-spin", label: "Drehen", previewEffect: "flip-spin" },
        { value: "light-sweep", label: "Lichtlauf", previewEffect: "light-sweep" },
        { value: "shockwave-ring", label: "Wellenring", previewEffect: "shockwave-ring" },
        { value: "electric-jolt", label: "Stromstoß", previewEffect: "electric-jolt" },
      ]),
    ],
  }),
  animationDescriptorEntry({
    featureKey: "cricket-target-highlighter",
    readmeAnchor: "animation-autodarts-animate-cricket-target-highlighter",
    description: "Visualisiert Ziel- und Druckzustände in Cricket und Tactics.",
    fields: [
      checkboxField("showOpenObjectives", "Offene Ziele anzeigen (OPEN)"),
      checkboxField("showDeadObjectives", "Erledigte Ziele anzeigen (DEAD)"),
      selectValueLabelField("irrelevantBoardDimStyle", "Andere Felder abdunkeln", [
        ["off", "Aus"], ["smoke", "Rauch"], ["hatch", "Schraffur"], ["mask", "Abdeckung"],
      ]),
      selectField("colorTheme", "Farben", [
        colorPreviewOption("standard", "Standard", "cricket-standard"),
        colorPreviewOption("high-contrast", "High Contrast", "cricket-high-contrast"),
      ]),
      selectValueLabelField("intensity", "Stärke", [
        ["subtle", "Dezent"], ["normal", "Standard"], ["strong", "Stark"],
      ]),
    ],
  }),
  animationDescriptorEntry({
    featureKey: "cricket-grid-status-effects",
    readmeAnchor: "animation-autodarts-animate-cricket-grid-status-effects",
    description: "Ergänzt die Cricket-/Tactics-Matrix um zusätzliche Live-Effekte.",
    fields: [
      checkboxField("rowWave", "Welle durch die Zeile"),
      checkboxField("badgeBeacon", "Zielmarke hervorheben"),
      checkboxField("markProgress", "Markierungen auffüllen"),
      checkboxField("pressureEdge", "Druck anzeigen (PRESSURE)"),
      checkboxField("scoringStripe", "Punktemöglichkeit anzeigen (SCORING)"),
      checkboxField("deadRowMuted", "Erledigte Zeilen abdunkeln (DEAD)"),
      checkboxField("deltaChips", "Änderungen anzeigen"),
      checkboxField("hitSpark", "Treffer-Impuls"),
      checkboxField("roundTransitionWipe", "Zugwechsel-Übergang"),
      checkboxField("pressureOverlay", "Druckfläche anzeigen (PRESSURE)"),
      selectField("colorTheme", "Farben", [
        colorPreviewOption("standard", "Standard", "cricket-standard"),
        colorPreviewOption("high-contrast", "High Contrast", "cricket-high-contrast"),
      ]),
      selectValueLabelField("intensity", "Stärke", [
        ["subtle", "Dezent"], ["normal", "Standard"], ["strong", "Stark"],
      ]),
    ],
  }),
  animationDescriptorEntry({
    featureKey: "dartboard-marker-highlight",
    readmeAnchor: "animation-autodarts-animate-dartboard-marker-highlight",
    description: "Macht Marker auf dem virtuellen Dartboard deutlicher sichtbar.",
    fields: [
      selectValueLabelField("size", "Größe der Treffermarkierung", [
        [4, "Klein"], [6, "Standard"], [9, "Groß"],
      ]),
      selectField("color", "Farbe der Treffermarkierung", [
        colorPreviewOption("rgb(49, 130, 206)", "Blau", "dart-marker-blue"),
        colorPreviewOption("rgb(34, 197, 94)", "Grün", "dart-marker-green"),
        colorPreviewOption("rgb(248, 113, 113)", "Rot", "dart-marker-red"),
        colorPreviewOption("rgb(250, 204, 21)", "Gelb", "dart-marker-yellow"),
        colorPreviewOption("rgb(255, 255, 255)", "Weiß", "dart-marker-white"),
      ]),
      selectValueLabelField("effect", "Animation", [
        ["soft-glow", "Sanft leuchten"], ["size-pulse", "Größe pulsieren"],
        ["none", "Kein Effekt"],
      ]),
      selectValueLabelField("opacityPercent", "Sichtbarkeit der Treffermarkierung", [
        [65, "65 %"], [85, "85 %"], [100, "100 %"],
      ]),
      selectField("outline", "Randfarbe", [
        colorPreviewOption("aus", "Aus", "dart-marker-outline-off"),
        colorPreviewOption("weiss", "Weiß", "dart-marker-outline-white"),
        colorPreviewOption("schwarz", "Schwarz", "dart-marker-outline-black"),
      ]),
    ],
  }),
  animationDescriptorEntry({
    featureKey: "dart-marker-replacer",
    readmeAnchor: "animation-autodarts-animate-dart-marker-replacer",
    description: "Ersetzt Marker optional durch Dart-Bilder mit Fluganimation.",
    fields: [
      actionField("run-feature-action", "Dart-Demo", {
        actionId: "preview",
        buttonLabel: "Virtuellen Marker werfen",
        section: "Dart-Demo",
        description:
          "Wirft das aktuell konfigurierte Dart-Design auf einen virtuellen Marker.",
        successMessage: "Dart-Demo gestartet.",
        errorMessage: "Dart-Demo konnte nicht gestartet werden.",
        prominent: true,
        previewTarget: "dart-marker-replacer",
      }),
      selectField("design", "Dart-Design", DART_DESIGN_OPTIONS),
      checkboxField("animateDarts", "Dart-Fluganimation"),
      selectValueLabelField("sizePercent", "Dart-Größe", [
        [108, "Klein"], [120, "Standard"], [138, "Groß"],
      ]),
      checkboxField("hideOriginalMarkers", "Original-Marker ausblenden"),
      selectValueLabelField("impactStyle", "Einschlagstil", [
        ["classic", "Klassisch"], ["natural", "Natürlich"], ["dramatic", "Dramatisch"],
      ]),
      checkboxField("enableShadow", "Einschlag-Schatten"),
      checkboxField("enableShadowBlur", "Schatten-Weichzeichnung"),
      checkboxField("enableWobble", "Nachwippen beim Einschlag"),
      checkboxField("enableFlightBlur", "Bewegungsunschärfe im Flug"),
      selectValueLabelField("flightSpeed", "Fluggeschwindigkeit", [
        ["schnell", "Schnell"], ["standard", "Standard"], ["cinematic", "Filmisch"],
      ]),
    ],
  }),
  animationDescriptorEntry({
    featureKey: "take-out-darts-alert",
    readmeAnchor: "animation-autodarts-animate-take-out-darts-alert",
    description: "Macht den Hinweis zum Entfernen der Darts auffälliger.",
    fields: [
      selectValueLabelField("imageSize", "Bildgröße", [
        ["compact", "Kompakt"], ["standard", "Standard"], ["large", "Groß"],
      ]),
      checkboxField("pulseAnimation", "Pulsieren"),
      selectValueLabelField("pulseScale", "Stärke des Pulsierens", [
        [1.02, "Dezent"], [1.04, "Standard"], [1.08, "Stark"],
      ]),
    ],
  }),
  animationDescriptorEntry({
    featureKey: "single-bull-hit-sound",
    readmeAnchor: "animation-autodarts-animate-single-bull-hit-sound",
    description: "Spielt bei Single Bull einen kurzen Ton ab.",
    fields: [
      actionField("run-feature-action", "Sound-Test", {
        actionId: "preview",
        buttonLabel: "Single-Bull-Ton abspielen",
        section: "Sound-Test",
        description:
          "Spielt den Single-Bull-Ton mit der aktuell gespeicherten Lautstärke.",
        successMessage: "Sound abgespielt.",
        errorMessage: "Sound konnte nicht abgespielt werden.",
        prominent: true,
      }),
      selectField("volume", "Lautstärke", [
        { value: 0.5, label: "Leise" },
        { value: 0.75, label: "Mittel" },
        { value: 0.9, label: "Standard" },
        { value: 1, label: "Sehr laut" },
      ]),
      selectField("cooldownMs", "Mindestabstand zwischen Tönen", [
        { value: 400, label: "400 ms" },
        { value: 700, label: "700 ms" },
        { value: 1000, label: "1000 ms" },
      ]),
      selectField("pollIntervalMs", "Zusätzliche Trefferprüfung", [
        { value: 0, label: "Aus" },
        { value: 1200, label: "Alle 1,2 Sekunden" },
      ]),
    ],
  }),
  animationDescriptorEntry({
    featureKey: "turn-score-counter",
    readmeAnchor: "animation-autodarts-animate-turn-score-counter",
    description: "Zählt Punkteänderungen sichtbar hoch oder runter.",
    fields: [
      selectField("countEffect", "Zählweise", [
        { value: "smooth-count", label: "Fließend zählen" },
        { value: "rolling-digits", label: "Rollende Zahlen" },
        { value: "step-count", label: "In Schritten zählen" },
      ]),
      selectField("durationMs", "Zählgeschwindigkeit", [
        { value: 1000, label: "Schnell" },
        { value: 3000, label: "Standard" },
        { value: 5000, label: "Ruhig" },
      ]),
      checkboxField("flashOnChange", "Bei Änderung aufblitzen"),
      selectField("flashMode", "Aufblitzen", [
        { value: "on-change", label: "Nur bei Änderung" },
        { value: "permanent", label: "Permanent" },
      ]),
    ],
  }),
]);

export const xconfigDescriptorOrder = buildFeatureIndex(
  xconfigDescriptors,
  (descriptor) => descriptor?.featureKey
);

const descriptorsByFeatureKey = buildFeatureMap(xconfigDescriptors, (descriptor) => descriptor.featureKey);

export function getXConfigDescriptor(featureKey) {
  return descriptorsByFeatureKey.get(normalizeFeatureKey(featureKey)) || null;
}
