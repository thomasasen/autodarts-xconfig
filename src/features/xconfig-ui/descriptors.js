import { getXConfigFeatureCopy, getXConfigFieldCopy, getXConfigFieldOptionCopy } from "./copy.js";
import { buildFeatureIndex, buildFeatureMap, normalizeFeatureKey } from "../feature-metadata.js";
import {
  THEME_GLOBAL_TYPOGRAPHY_FONT_PRESETS,
  THEME_GLOBAL_TYPOGRAPHY_SCOPE_OPTIONS,
} from "../../shared/theme-global-typography-presets.js";
import { THEME_GLOBAL_TEMPLATE_PRESETS } from "../../shared/theme-global-template-presets.js";

function checkboxField(key, label) {
  return Object.freeze({
    key,
    label,
    control: "checkbox",
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
        })
      )
    ),
  });
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
    prominent: options.prominent === true,
    control: "action",
  });
}

function descriptorEntry(definition) {
  const featureKey = normalizeFeatureKey(definition.featureKey);
  const featureCopy = getXConfigFeatureCopy(featureKey);
  return Object.freeze({
    ...definition,
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

const ACTIVE_PLAYER_TINT_INTENSITY_OPTIONS = Object.freeze([
  { value: 0, label: "Aus" },
  { value: 10, label: "10 %" },
  { value: 15, label: "15 %" },
  { value: 20, label: "20 %" },
  { value: 25, label: "25 %" },
  { value: 30, label: "30 %" },
]);

const GOTCHA_DELTA_ALIGNMENT_OPTIONS = Object.freeze([
  { value: "right", label: "Rechtsbündig" },
  { value: "left", label: "Linksbündig" },
]);

const GOTCHA_DELTA_PLACEMENT_OPTIONS = Object.freeze([
  { value: "below", label: "Unter Score" },
  { value: "inline-divider", label: "Score-Zeile |" },
]);

const TURN_DART_STYLE_OPTIONS = Object.freeze([
  { value: "original", label: "Original" },
  { value: "solid", label: "Farbe" },
  { value: "gradient", label: "Verlauf" },
  { value: "image", label: "Eigenes Bild" },
]);

const TURN_DART_SIZE_OPTIONS = Object.freeze([
  { value: 100, label: "Kompakt" },
  { value: 115, label: "Standard" },
  { value: 135, label: "Groß" },
]);

export const xconfigDescriptors = Object.freeze([
  descriptorEntry({
    featureKey: "theme-global-typography",
    tab: "themes",
    readmeAnchor: "template-global-typography",
    description: "Template-weite Typografie für stabile Score-, Wurf- und Namensbereiche.",
    fields: [
      ...THEME_GLOBAL_TEMPLATE_PRESETS.map((preset) =>
        actionField("applyThemeGlobalPreset", preset.label, {
          key: `preset-${preset.key}`,
          actionId: preset.key,
          buttonLabel: preset.label,
          section: "Presets",
        })
      ),
      selectField("fontPreset", "Schriftart", THEME_GLOBAL_TYPOGRAPHY_FONT_PRESETS, {
        section: "Schrift",
      }),
      selectField("applyTo", "Greift bei", THEME_GLOBAL_TYPOGRAPHY_SCOPE_OPTIONS, {
        multiple: true,
        section: "Schrift",
      }),
      colorField("accentColor", "Aktiv-Akzent", {
        section: "Farben",
      }),
      colorField("scoreColor", "Hauptzahlen", {
        section: "Farben",
      }),
      colorField("secondaryTextColor", "Sekundärtext", {
        section: "Farben",
      }),
      colorField("throwLabelColor", "Wurf-/Checkout-Text", {
        section: "Farben",
      }),
      selectField(
        "activePlayerTintIntensity",
        "Aktivspieler-Tönung",
        ACTIVE_PLAYER_TINT_INTENSITY_OPTIONS,
        {
          section: "Farben",
        }
      ),
      selectField("turnDartStyle", "Wurffeld-Darts", TURN_DART_STYLE_OPTIONS, {
        section: "Wurffeld-Darts",
      }),
      textField("turnDartTextTemplate", "Dart-Text", {
        section: "Wurffeld-Darts",
        placeholder: "Wurf #",
        maxLength: 48,
      }),
      colorField("turnDartColor", "Dart-Farbe", {
        section: "Wurffeld-Darts",
      }),
      colorField("turnDartGradientColor", "Verlaufsfarbe", {
        section: "Wurffeld-Darts",
      }),
      selectField("turnDartSizePercent", "Dart-Größe", TURN_DART_SIZE_OPTIONS, {
        section: "Wurffeld-Darts",
      }),
      actionField("uploadTurnDartImage", "Dart-Bild hochladen", {
        section: "Wurffeld-Darts",
        description:
          "Empfohlen: transparentes PNG, WebP oder SVG, horizontal und eng zugeschnitten, etwa 5:1 bis 6:1. Das Bild wird lokal auf maximal 960×240 optimiert und bis 350 KB gespeichert.",
      }),
      actionField("clearTurnDartImage", "Dart-Bild entfernen", {
        section: "Wurffeld-Darts",
        description: "Entfernt nur das in Templates Global gespeicherte Dart-Bild.",
        successMessage: "Dart-Bild entfernt.",
      }),
      selectField("backgroundDisplayMode", "Hintergrund-Darstellung", BACKGROUND_DISPLAY_OPTIONS, {
        section: "Hintergrund",
      }),
      selectField("backgroundOpacity", "Hintergrundbild-Deckkraft", BACKGROUND_OPACITY_OPTIONS, {
        section: "Hintergrund",
      }),
      selectField(
        "playerFieldTransparency",
        "Spielerfelder-Transparenz",
        PLAYER_FIELD_TRANSPARENCY_OPTIONS,
        {
          section: "Hintergrund",
        }
      ),
      actionField("uploadThemeBackground", "Hintergrundbild hochladen", {
        section: "Hintergrund",
        description:
          "Speichert ein globales Fallback-Hintergrundbild. Ein eigenes Bild des aktiven Themes überschreibt es vollständig.",
      }),
      actionField("clearThemeBackground", "Hintergrundbild entfernen", {
        section: "Hintergrund",
        description: "Entfernt nur das globale Fallback-Hintergrundbild aus Templates Global.",
        successMessage: "Globales Hintergrundbild entfernt.",
      }),
      checkboxField("debug", "Debug"),
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
    featureKey: "theme-gotcha",
    tab: "themes",
    readmeAnchor: "template-autodarts-theme-gotcha",
    description: "X01-nahes Gotcha-Theme mit integrierter Delta-Anzeige und eigenem Hintergrundbild.",
    fields: [
      selectField("deltaPlacement", "Delta-Position", GOTCHA_DELTA_PLACEMENT_OPTIONS),
      selectField("deltaAlignment", "Delta-Ausrichtung", GOTCHA_DELTA_ALIGNMENT_OPTIONS),
      checkboxField("deltaItalic", "Delta kursiv"),
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
    featureKey: "theme-x01-2player",
    tab: "themes",
    readmeAnchor: "template-autodarts-theme-x01-2player",
    description:
      "Eigenständiges X01-Theme für genau zwei Spieler mit zentriertem Board und eigenem Hintergrundbild.",
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
    featureKey: "x01-score-progress",
    tab: "animations",
    readmeAnchor: "animation-autodarts-x01-score-progress",
    description: "Zeigt den verbleibenden X01-Score als abnehmenden Balken pro Spielerkarte.",
    fields: [
      selectField("colorTheme", "Farben", [
        { value: "checkout-focus", label: "Checkout Focus" },
        { value: "traffic-light", label: "Traffic Light" },
        { value: "danger-endgame", label: "Danger Endgame" },
        { value: "gradient-by-progress", label: "Gradient Progress" },
        { value: "autodarts", label: "Autodarts" },
        { value: "signal-lime", label: "Signal Lime" },
        { value: "glass-mint", label: "Glass Mint" },
        { value: "ember-rush", label: "Ember Rush" },
        { value: "ice-circuit", label: "Ice Circuit" },
        { value: "neon-violet", label: "Neon Violet" },
        { value: "sunset-amber", label: "Sunset Amber" },
        { value: "monochrome-steel", label: "Monochrome Steel" },
      ]),
      selectField("barSize", "Balkengröße", [
        { value: "schmal", label: "Schmal" },
        { value: "standard", label: "Standard" },
        { value: "breit", label: "Breit" },
        { value: "extrabreit", label: "Extrabreit" },
      ]),
      selectField("effect", "Effekt", [
        { value: "pulse-core", label: "Pulse Core" },
        { value: "glass-charge", label: "Glass Charge" },
        { value: "segment-drain", label: "Segment Drain" },
        { value: "ghost-trail", label: "Ghost Trail" },
        { value: "signal-sweep", label: "Signal Sweep" },
        { value: "off", label: "Aus" },
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
      selectField("visualPreset", "Darstellung", [
        { value: "focus", label: "Focus" },
        { value: "signal", label: "Signal" },
        { value: "steady", label: "Steady" },
      ]),
      selectField("segmentStyle", "Segmentstil", [
        { value: "surface-outline", label: "Fläche + Rahmen" },
        { value: "surface-only", label: "Nur Fläche" },
      ]),
      selectField("targetSelectionMode", "Zielauswahl", [
        { value: "next", label: "Nächstes Feld" },
        { value: "all", label: "Alle Felder" },
        { value: "finish", label: "Nur Finish" },
      ]),
      selectField("colorTheme", "Farbthema", [
        { value: "violet", label: "Violett" },
        { value: "cyan", label: "Cyan" },
        { value: "amber", label: "Amber" },
      ]),
      checkboxField("debug", "Debug"),
    ],
  }),
  descriptorEntry({
    featureKey: "tv-board-zoom",
    tab: "animations",
    readmeAnchor: "animation-autodarts-animate-tv-board-zoom",
    description: "Zoomt bei klaren Checkout- und Setup-Situationen TV-artig auf Zielbereiche.",
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
      selectField("checkoutZoomTarget", "Checkout-Ziel", [
        { value: "finish-only", label: "Nur Finish-Feld" },
        { value: "route-first", label: "Erstes Routenfeld" },
      ]),
      checkboxField("t20SetupZoomEnabled", "T20-Setup-Zoom"),
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
    description: "Setzt Treffer-Highlights mit wählbarem Farbstil und starkem Burst-Animationsstil.",
    fields: [
      selectField("colorTheme", "Farbstil", [
        { value: "kind-signal", label: "Rot/Blau/Grün" },
        { value: "ember-rush", label: "Solar Flare" },
        { value: "ice-circuit", label: "Ice Reactor" },
        { value: "volt-lime", label: "Venom Lime" },
        { value: "crimson-steel", label: "Crimson Velocity" },
        { value: "arctic-mint", label: "Polar Mint" },
        { value: "champagne-night", label: "Midnight Gold" },
      ]),
      selectField("animationStyle", "Animationsstil", [
        { value: "emphasis", label: "Emphase", previewEffect: "emphasis" },
        { value: "shake", label: "Shake", previewEffect: "shake" },
        { value: "pulse", label: "Pulse", previewEffect: "pulse" },
        { value: "turn", label: "Turn", previewEffect: "turn" },
        { value: "sheen", label: "Sheen", previewEffect: "sheen" },
        { value: "shockwave", label: "Shock Ring", previewEffect: "shockwave" },
        { value: "electric-arc", label: "Electric Arc", previewEffect: "electric-arc" },
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
        { value: "aireplicant", label: "AI Replicant" },
        { value: "bullet", label: "Bullet" },
        { value: "germangiant", label: "German Giant" },
        { value: "mandalorian", label: "Mandalorian" },
        { value: "nuke", label: "Nuke" },
        { value: "philtaylor", label: "Phil Taylor" },
        { value: "snakebite", label: "Snakebite" },
        { value: "standard", label: "Standard" },
        { value: "stdyellow", label: "Standard Yellow" },
        { value: "stdyellow2", label: "Standard Yellow 2" },
        { value: "ultramarine", label: "Ultramarine" },
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
        { value: 108, label: "Klein" },
        { value: 120, label: "Standard" },
        { value: 138, label: "Groß" },
      ]),
      checkboxField("hideOriginalMarkers", "Original-Marker ausblenden"),
      checkboxField("enableShadow", "Einschlag-Schatten"),
      checkboxField("enableShadowBlur", "Schatten-Weichzeichnung"),
      checkboxField("enableWobble", "Einschlag-Wobble"),
      checkboxField("enableFlightBlur", "Flug-Blur"),
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
      selectField("countEffect", "Zählstil", [
        { value: "countup", label: "Fließend" },
        { value: "odometer", label: "Odometer" },
        { value: "steps", label: "Einzelschritte" },
      ]),
      selectField("durationMs", "Zählgeschwindigkeit", [
        { value: 1000, label: "Schnell" },
        { value: 3000, label: "Standard" },
        { value: 5000, label: "Ruhig" },
      ]),
      checkboxField("flashOnChange", "Aufblitz-Effekt"),
      selectField("flashMode", "Aufblitz-Modus", [
        { value: "on-change", label: "Nur bei Änderung" },
        { value: "permanent", label: "Permanent" },
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

export const xconfigDescriptorOrder = buildFeatureIndex(
  xconfigDescriptors,
  (descriptor) => descriptor?.featureKey
);

const descriptorsByFeatureKey = buildFeatureMap(xconfigDescriptors, (descriptor) => descriptor.featureKey);

export function getXConfigDescriptor(featureKey) {
  return descriptorsByFeatureKey.get(normalizeFeatureKey(featureKey)) || null;
}
