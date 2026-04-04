import { setNestedValue, splitFeaturePath } from "./feature-path-utils.js";
import { featureCatalog } from "../shared/feature-catalog.js";

const CHECKOUT_EFFECTS = new Set(["pulse", "glow", "scale", "blink"]);
const CHECKOUT_INTENSITIES = new Set(["dezent", "standard", "stark"]);
const CHECKOUT_TRIGGER_SOURCES = new Set(["suggestion-first", "score-only", "suggestion-only"]);
const CHECKOUT_COLORS = new Set(["159, 219, 88", "56, 189, 248", "245, 158, 11", "248, 113, 113"]);
const BOARD_TARGET_VISUAL_PRESETS = new Set(["focus", "signal", "steady"]);
const BOARD_TARGET_SEGMENT_STYLES = new Set(["surface-outline", "surface-only"]);
const BOARD_TARGET_SELECTION_MODES = new Set(["next", "all", "finish"]);
const BOARD_TARGET_THEMES = new Set(["violet", "cyan", "amber"]);
const TV_ZOOM_LEVELS = new Set([2.35, 2.75, 3.15]);
const TV_ZOOM_SPEEDS = new Set(["schnell", "mittel", "langsam"]);
const TV_ZOOM_TARGETS = new Set(["finish-only", "route-first"]);
const SUGGESTION_STYLES = new Set(["badge", "ribbon", "stripe", "ticket", "outline"]);
const SUGGESTION_COLOR_THEMES = new Set(["amber", "cyan", "rose"]);
const AVG_TREND_DURATIONS = new Set([220, 320, 500]);
const TURN_START_SWEEP_DURATIONS = new Set([300, 420, 620]);
const TURN_START_SWEEP_STYLES = new Set(["subtle", "standard", "strong"]);
const TRIPLE_DOUBLE_BULL_COLOR_THEMES = new Set(["kind-signal", "ember-rush", "ice-circuit", "volt-lime", "crimson-steel", "arctic-mint", "champagne-night"]);
const TRIPLE_DOUBLE_BULL_ANIMATION_STYLES = new Set(["impact-pop", "shockwave", "sweep-shine", "electric-arc", "neon-pulse", "snap-bounce", "card-slam", "signal-blink", "stagger-wave", "flip-edge", "outline-trace", "charge-release", "alternate-flick"]);
const CRICKET_HIGHLIGHT_THEMES = new Set(["standard", "high-contrast"]);
const CRICKET_HIGHLIGHT_INTENSITIES = new Set(["subtle", "normal", "strong"]);
const CRICKET_HIGHLIGHT_IRRELEVANT_DIM_STYLES = new Set(["off", "smoke", "hatch", "mask"]);
const DART_MARKER_EMPHASIS_SIZES = new Set([4, 6, 9]);
const DART_MARKER_EMPHASIS_COLORS = new Set(["rgb(49, 130, 206)", "rgb(34, 197, 94)", "rgb(248, 113, 113)", "rgb(250, 204, 21)", "rgb(255, 255, 255)"]);
const DART_MARKER_EMPHASIS_EFFECTS = new Set(["glow", "pulse", "none"]);
const DART_MARKER_EMPHASIS_OPACITY = new Set([65, 85, 100]);
const DART_MARKER_EMPHASIS_OUTLINE = new Set(["aus", "weiss", "schwarz"]);
const DART_MARKER_DARTS_DESIGNS = new Set(["autodarts", "blackblue", "blackgreen", "blackred", "blue", "camoflage", "green", "pride", "red", "white", "whitetrible", "yellow", "yellowscull"]);
const DART_MARKER_DARTS_SIZE_PERCENT = new Set([90, 100, 115]);
const DART_MARKER_DARTS_FLIGHT_SPEED = new Set(["schnell", "standard", "cinematic"]);
const REMOVE_DARTS_NOTIFICATION_IMAGE_SIZE = new Set(["compact", "standard", "large"]);
const REMOVE_DARTS_NOTIFICATION_PULSE_SCALE = new Set([1.02, 1.04, 1.08]);
const SINGLE_BULL_SOUND_VOLUME = new Set([0.5, 0.75, 0.9, 1]);
const SINGLE_BULL_SOUND_COOLDOWN = new Set([400, 700, 1000]);
const SINGLE_BULL_SOUND_POLL_INTERVAL = new Set([0, 1200]);
const TURN_POINTS_COUNT_DURATIONS = new Set([260, 416, 650]);
const X01_SCORE_PROGRESS_COLOR_THEMES = new Set(["checkout-focus", "traffic-light", "danger-endgame", "gradient-by-progress", "autodarts", "signal-lime", "glass-mint", "ember-rush", "ice-circuit", "neon-violet", "sunset-amber", "monochrome-steel"]);
const X01_SCORE_PROGRESS_BAR_SIZES = new Set(["schmal", "standard", "breit", "extrabreit"]);
const WINNER_FIREWORKS_STYLES = new Set(["realistic", "fireworks", "cannon", "victorystorm", "stars", "sides"]);
const WINNER_FIREWORKS_COLOR_THEMES = new Set(["autodarts", "redwhite", "ice", "sunset", "neon", "gold"]);
const WINNER_FIREWORKS_INTENSITIES = new Set(["dezent", "standard", "stark"]);
const THEME_BACKGROUND_DISPLAY_MODES = new Set(["fill", "fit", "stretch", "center", "tile"]);
const THEME_BACKGROUND_OPACITY = new Set([100, 85, 70, 55, 40, 25, 10]);
const THEME_PLAYER_FIELD_TRANSPARENCY = new Set([0, 5, 10, 15, 30, 45, 60]);
const THEME_CONTRAST_PRESETS = new Set(["soft", "standard", "high"]);
const LEGACY_COLOR_THEME_ALIASES = Object.freeze({
  ["159,219,88"]: "159, 219, 88",
  ["56,189,248"]: "56, 189, 248",
  ["245,158,11"]: "245, 158, 11",
  ["248,113,113"]: "248, 113, 113",
});

function deepClone(value) {
  if (value === null || typeof value !== "object") {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => deepClone(item));
  }
  return Object.keys(value).reduce((result, key) => {
    result[key] = deepClone(value[key]);
    return result;
  }, {});
}

function normalizeStringChoice(value, fallbackValue, allowedSet) {
  const normalized = String(value || "").trim().toLowerCase();
  return allowedSet.has(normalized) ? normalized : fallbackValue;
}

function normalizeMappedStringChoice(value, fallbackValue, aliasMap) {
  if (typeof value === "undefined" || value === null) {
    return fallbackValue;
  }
  const normalized = String(value || "").trim().toLowerCase();
  return Object.prototype.hasOwnProperty.call(aliasMap, normalized)
    ? aliasMap[normalized]
    : fallbackValue;
}

function normalizeNumberChoice(value, fallbackValue, allowedSet) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && allowedSet.has(numeric) ? numeric : fallbackValue;
}

function normalizeBoolean(value, fallbackValue) {
  if (typeof value === "boolean") {
    return value;
  }
  const normalized = String(value || "").trim().toLowerCase();
  if (["true", "1", "yes", "on", "active", "aktiv"].includes(normalized)) {
    return true;
  }
  if (["false", "0", "no", "off", "inactive", "inaktiv"].includes(normalized)) {
    return false;
  }
  return Boolean(fallbackValue);
}

function normalizeThemeBackgroundImage(rawValue) {
  const dataUrl = String(rawValue || "").trim();
  return dataUrl.startsWith("data:image/") ? dataUrl : "";
}

function normalizeLegacyColorTheme(value, fallbackValue) {
  const rawValue = String(value || "").trim();
  if (!rawValue) {
    return fallbackValue;
  }

  const compact = rawValue.replace(/\s+/g, "");
  return LEGACY_COLOR_THEME_ALIASES[compact] || rawValue;
}

function normalizeLegacyDartDesign(value, fallbackValue = "autodarts") {
  const rawValue = String(value || "").trim();
  if (!rawValue) {
    return fallbackValue;
  }

  const normalized = rawValue
    .replace(/^dart_/i, "")
    .replace(/\.png$/i, "")
    .trim()
    .toLowerCase();

  return normalized || fallbackValue;
}

function resolveLegacyBoardTargetVisualPreset(rawConfig = {}) {
  const explicitPreset = String(rawConfig.visualPreset || "").trim().toLowerCase();
  const legacyEffect = String(rawConfig.effect || "").trim().toLowerCase();
  if (BOARD_TARGET_VISUAL_PRESETS.has(explicitPreset)) {
    if (
      explicitPreset !== "focus" ||
      (legacyEffect !== "blink" && legacyEffect !== "glow")
    ) {
      return explicitPreset;
    }
  }

  if (legacyEffect === "blink") {
    return "signal";
  }
  if (legacyEffect === "glow") {
    return "steady";
  }
  return "focus";
}

function getLegacyFeatureSettings(legacyFeatureState) {
  if (!legacyFeatureState?.settings || typeof legacyFeatureState.settings !== "object") {
    return {};
  }

  return legacyFeatureState.settings;
}

function readLegacySetting(settings, shortKey, fallbackValue) {
  if (Object.prototype.hasOwnProperty.call(settings, shortKey)) {
    return settings[shortKey];
  }

  const prefixedKey = `xConfig_${shortKey}`;
  if (Object.prototype.hasOwnProperty.call(settings, prefixedKey)) {
    return settings[prefixedKey];
  }

  return fallbackValue;
}

function buildFeatureImport(configKey, legacyFeatureState, mappedSettings = {}) {
  const enabled = Boolean(legacyFeatureState?.enabled);
  return {
    configKey,
    enabled,
    config: {
      enabled,
      ...mappedSettings,
    },
  };
}

function normalizeThemeBaseConfig(rawConfig = {}, defaults = {}) {
  return {
    enabled: normalizeBoolean(rawConfig.enabled, false),
    backgroundDisplayMode: normalizeStringChoice(rawConfig.backgroundDisplayMode, String(defaults.backgroundDisplayMode || "fill"), THEME_BACKGROUND_DISPLAY_MODES),
    backgroundOpacity: normalizeNumberChoice(rawConfig.backgroundOpacity, Number(defaults.backgroundOpacity || 25), THEME_BACKGROUND_OPACITY),
    playerFieldTransparency: normalizeNumberChoice(rawConfig.playerFieldTransparency, Number(defaults.playerFieldTransparency || 10), THEME_PLAYER_FIELD_TRANSPARENCY),
    backgroundImageDataUrl: normalizeThemeBackgroundImage(rawConfig.backgroundImageDataUrl || defaults.backgroundImageDataUrl || ""),
    debug: normalizeBoolean(rawConfig.debug, Boolean(defaults.debug)),
  };
}

const DEFAULT_FEATURE_CONFIGS = Object.freeze({
  checkoutScorePulse: { enabled: true, effect: "scale", colorTheme: "159, 219, 88", intensity: "standard", triggerSource: "suggestion-first", debug: false },
  checkoutBoardTargets: { enabled: false, visualPreset: "focus", segmentStyle: "surface-outline", singleRing: "both", targetSelectionMode: "next", colorTheme: "amber", debug: false },
  tvBoardZoom: { enabled: false, zoomLevel: 2.75, zoomSpeed: "mittel", checkoutZoomEnabled: true, checkoutZoomTarget: "finish-only", t20SetupZoomEnabled: true, debug: false },
  styleCheckoutSuggestions: { enabled: false, style: "ribbon", labelText: "CHECKOUT", colorTheme: "amber", debug: false },
  averageTrendArrow: { enabled: false, durationMs: 320, size: "standard", debug: false },
  turnStartSweep: { enabled: false, durationMs: 420, sweepStyle: "standard", debug: false },
  tripleDoubleBullHits: { enabled: false, colorTheme: "kind-signal", animationStyle: "charge-release", debug: false },
  cricketHighlighter: { enabled: false, showOpenObjectives: false, showDeadObjectives: true, irrelevantBoardDimStyle: "smoke", colorTheme: "standard", intensity: "normal", debug: false },
  cricketGridFx: { enabled: false, rowWave: true, badgeBeacon: true, markProgress: true, pressureEdge: true, scoringStripe: true, deadRowMuted: true, deltaChips: true, hitSpark: true, roundTransitionWipe: true, pressureOverlay: true, colorTheme: "standard", intensity: "normal", debug: false },
  dartMarkerEmphasis: { enabled: false, size: 6, color: "rgb(49, 130, 206)", effect: "glow", opacityPercent: 85, outline: "aus", debug: false },
  dartMarkerDarts: { enabled: false, design: "autodarts", animateDarts: true, sizePercent: 100, hideOriginalMarkers: false, enableShadow: true, enableWobble: true, flightSpeed: "standard", debug: false },
  removeDartsNotification: { enabled: false, imageSize: "standard", pulseAnimation: true, pulseScale: 1.04, debug: false },
  singleBullSound: { enabled: false, volume: 0.9, cooldownMs: 700, pollIntervalMs: 0, debug: false },
  turnPointsCount: { enabled: false, durationMs: 416, flashOnChange: true, flashMode: "on-change", debug: false },
  winnerFireworks: { enabled: false, style: "realistic", colorTheme: "autodarts", intensity: "standard", includeBullOut: true, pointerDismiss: true, debug: false },
  x01ScoreProgress: { enabled: false, colorTheme: "checkout-focus", barSize: "standard", effect: "pulse-core", debug: false },
  "themes.x01": { enabled: false, showAvg: true, backgroundDisplayMode: "fill", backgroundOpacity: 25, playerFieldTransparency: 10, backgroundImageDataUrl: "", debug: false },
  "themes.shanghai": { enabled: false, showAvg: true, backgroundDisplayMode: "fill", backgroundOpacity: 25, playerFieldTransparency: 10, backgroundImageDataUrl: "", debug: false },
  "themes.bermuda": { enabled: false, backgroundDisplayMode: "fill", backgroundOpacity: 25, playerFieldTransparency: 10, backgroundImageDataUrl: "", debug: false },
  "themes.cricket": { enabled: false, showAvg: true, backgroundDisplayMode: "fill", backgroundOpacity: 25, playerFieldTransparency: 10, backgroundImageDataUrl: "", debug: false },
  "themes.bullOff": { enabled: false, contrastPreset: "standard", backgroundDisplayMode: "fill", backgroundOpacity: 25, playerFieldTransparency: 10, backgroundImageDataUrl: "", debug: false },
});

const RECOMMENDED_FEATURE_CONFIGS = Object.freeze({
  checkoutScorePulse: { effect: "scale", colorTheme: "159, 219, 88", intensity: "standard", triggerSource: "suggestion-first" },
  checkoutBoardTargets: { visualPreset: "focus", segmentStyle: "surface-outline", singleRing: "both", targetSelectionMode: "next", colorTheme: "amber" },
  tvBoardZoom: { zoomLevel: 2.75, zoomSpeed: "mittel", checkoutZoomEnabled: true, checkoutZoomTarget: "finish-only", t20SetupZoomEnabled: true },
  styleCheckoutSuggestions: { style: "outline", labelText: "CHECKOUT", colorTheme: "amber" },
  averageTrendArrow: { durationMs: 320, size: "standard" },
  turnStartSweep: { durationMs: 420, sweepStyle: "subtle" },
  tripleDoubleBullHits: { colorTheme: "kind-signal", animationStyle: "impact-pop" },
  cricketHighlighter: { showOpenObjectives: false, showDeadObjectives: true, irrelevantBoardDimStyle: "smoke", colorTheme: "standard", intensity: "normal" },
  cricketGridFx: { rowWave: true, badgeBeacon: true, markProgress: true, pressureEdge: true, scoringStripe: true, deadRowMuted: true, deltaChips: true, hitSpark: true, roundTransitionWipe: true, pressureOverlay: false, colorTheme: "standard", intensity: "subtle" },
  dartMarkerEmphasis: { size: 6, color: "rgb(49, 130, 206)", effect: "glow", opacityPercent: 85, outline: "aus" },
  dartMarkerDarts: { design: "autodarts", animateDarts: true, sizePercent: 100, hideOriginalMarkers: true, enableShadow: true, enableWobble: false, flightSpeed: "standard" },
  removeDartsNotification: { imageSize: "standard", pulseAnimation: true, pulseScale: 1.04 },
  singleBullSound: { volume: 0.75, cooldownMs: 700, pollIntervalMs: 0 },
  turnPointsCount: { durationMs: 416, flashOnChange: true, flashMode: "on-change" },
  winnerFireworks: { style: "realistic", colorTheme: "autodarts", intensity: "dezent", includeBullOut: true, pointerDismiss: true },
  x01ScoreProgress: { colorTheme: "checkout-focus", barSize: "standard", effect: "pulse-core" },
  "themes.x01": { showAvg: true, backgroundDisplayMode: "fill", backgroundOpacity: 25, playerFieldTransparency: 10 },
  "themes.shanghai": { showAvg: true, backgroundDisplayMode: "fill", backgroundOpacity: 25, playerFieldTransparency: 10 },
  "themes.bermuda": { backgroundDisplayMode: "fill", backgroundOpacity: 25, playerFieldTransparency: 10 },
  "themes.cricket": { showAvg: true, backgroundDisplayMode: "fill", backgroundOpacity: 25, playerFieldTransparency: 10 },
  "themes.bullOff": { contrastPreset: "standard", backgroundDisplayMode: "fill", backgroundOpacity: 25, playerFieldTransparency: 10 },
});

const FEATURE_REMOVE_KEYS = Object.freeze({
  x01ScoreProgress: Object.freeze(["designPreset"]),
});

const LEGACY_IMPORTERS = Object.freeze({
  checkoutScorePulse(legacyFeatureState) {
    const settings = getLegacyFeatureSettings(legacyFeatureState);
    return buildFeatureImport("checkoutScorePulse", legacyFeatureState, {
      effect: readLegacySetting(settings, "EFFEKT", "scale"),
      colorTheme: normalizeLegacyColorTheme(
        readLegacySetting(settings, "FARBTHEMA", "159, 219, 88"),
        "159, 219, 88"
      ),
      intensity: readLegacySetting(settings, "INTENSITAET", "standard"),
      triggerSource: readLegacySetting(settings, "TRIGGER_QUELLE", "suggestion-first"),
      debug: readLegacySetting(settings, "DEBUG", false),
    });
  },
  checkoutBoardTargets(legacyFeatureState) {
    const settings = getLegacyFeatureSettings(legacyFeatureState);
    return buildFeatureImport("checkoutBoardTargets", legacyFeatureState, {
      visualPreset: resolveLegacyBoardTargetVisualPreset({
        visualPreset: readLegacySetting(settings, "VISUAL_PRESET", ""),
        effect: readLegacySetting(settings, "EFFEKT", "pulse"),
        outlineIntensity: readLegacySetting(settings, "KONTUR_INTENSITAET", "standard"),
      }),
      segmentStyle: "surface-outline",
      singleRing: "both",
      targetSelectionMode: readLegacySetting(settings, "ZIELAUSWAHL", "next"),
      colorTheme: readLegacySetting(settings, "FARBTHEMA", "violet"),
      debug: readLegacySetting(settings, "DEBUG", false),
    });
  },
  tvBoardZoom(legacyFeatureState) {
    const settings = getLegacyFeatureSettings(legacyFeatureState);
    return buildFeatureImport("tvBoardZoom", legacyFeatureState, {
      zoomLevel: readLegacySetting(settings, "ZOOM_STUFE", 2.75),
      zoomSpeed: readLegacySetting(settings, "ZOOM_GESCHWINDIGKEIT", "mittel"),
      checkoutZoomEnabled: readLegacySetting(settings, "CHECKOUT_ZOOM", true),
      debug: readLegacySetting(settings, "DEBUG", false),
    });
  },
  styleCheckoutSuggestions(legacyFeatureState) {
    const settings = getLegacyFeatureSettings(legacyFeatureState);
    return buildFeatureImport("styleCheckoutSuggestions", legacyFeatureState, {
      style: readLegacySetting(settings, "STIL", "ribbon"),
      labelText: readLegacySetting(settings, "LABELTEXT", "CHECKOUT"),
      colorTheme: readLegacySetting(settings, "FARBTHEMA", "amber"),
      debug: readLegacySetting(settings, "DEBUG", false),
    });
  },
  averageTrendArrow(legacyFeatureState) {
    const settings = getLegacyFeatureSettings(legacyFeatureState);
    return buildFeatureImport("averageTrendArrow", legacyFeatureState, {
      durationMs: readLegacySetting(settings, "ANIMATIONSDAUER_MS", 320),
      size: readLegacySetting(settings, "PFEIL_GROESSE", "standard"),
      debug: readLegacySetting(settings, "DEBUG", false),
    });
  },
  turnStartSweep(legacyFeatureState) {
    const settings = getLegacyFeatureSettings(legacyFeatureState);
    return buildFeatureImport("turnStartSweep", legacyFeatureState, {
      durationMs: readLegacySetting(settings, "SWEEP_GESCHWINDIGKEIT_MS", 420),
      sweepStyle: readLegacySetting(settings, "SWEEP_STIL", "standard"),
      debug: readLegacySetting(settings, "DEBUG", false),
    });
  },
  tripleDoubleBullHits(legacyFeatureState) {
    const settings = getLegacyFeatureSettings(legacyFeatureState);
    return buildFeatureImport("tripleDoubleBullHits", legacyFeatureState, {
      colorTheme: "champagne-night",
      animationStyle: "charge-release",
      debug: readLegacySetting(settings, "DEBUG", false),
    });
  },
  cricketHighlighter(legacyFeatureState) {
    const settings = getLegacyFeatureSettings(legacyFeatureState);
    const legacyDimIrrelevantBoardTargets = readLegacySetting(
      settings,
      "IRRELEVANTE_FELDER_ABDUNKELN",
      true
    );
    return buildFeatureImport("cricketHighlighter", legacyFeatureState, {
      showOpenObjectives: readLegacySetting(settings, "OPEN_ZIELE_ANZEIGEN", false),
      showDeadObjectives: readLegacySetting(settings, "DEAD_ZIELE_ANZEIGEN", true),
      irrelevantBoardDimStyle: legacyDimIrrelevantBoardTargets === false ? "off" : "smoke",
      dimIrrelevantBoardTargets: legacyDimIrrelevantBoardTargets !== false,
      colorTheme: readLegacySetting(settings, "FARBTHEMA", "standard"),
      intensity: readLegacySetting(settings, "INTENSITAET", "normal"),
      debug: readLegacySetting(settings, "DEBUG", false),
    });
  },
  cricketGridFx(legacyFeatureState) {
    const settings = getLegacyFeatureSettings(legacyFeatureState);
    return buildFeatureImport("cricketGridFx", legacyFeatureState, {
      rowWave: readLegacySetting(settings, "ROW_RAIL_PULSE", true),
      badgeBeacon: readLegacySetting(settings, "BADGE_BEACON", true),
      markProgress: readLegacySetting(settings, "MARK_PROGRESS_ANIMATOR", true),
      pressureEdge: readLegacySetting(settings, "THREAT_EDGE", true),
      scoringStripe: readLegacySetting(settings, "SCORING_LANE_HIGHLIGHT", true),
      deadRowMuted: readLegacySetting(settings, "DEAD_ROW_COLLAPSE", true),
      deltaChips: readLegacySetting(settings, "DELTA_CHIPS", true),
      hitSpark: readLegacySetting(settings, "HIT_SPARK", true),
      roundTransitionWipe: readLegacySetting(settings, "ROUND_TRANSITION_WIPE", true),
      pressureOverlay: readLegacySetting(settings, "OPPONENT_PRESSURE_OVERLAY", true),
      colorTheme: readLegacySetting(settings, "FARBTHEMA", "standard"),
      intensity: readLegacySetting(settings, "INTENSITAET", "normal"),
      debug: readLegacySetting(settings, "DEBUG", false),
    });
  },
  dartMarkerEmphasis(legacyFeatureState) {
    const settings = getLegacyFeatureSettings(legacyFeatureState);
    return buildFeatureImport("dartMarkerEmphasis", legacyFeatureState, {
      size: readLegacySetting(settings, "MARKER_GROESSE", 6),
      color: readLegacySetting(settings, "MARKER_FARBE", "rgb(49, 130, 206)"),
      effect: readLegacySetting(settings, "EFFEKT", "glow"),
      opacityPercent: readLegacySetting(settings, "MARKER_OPAZITAET", 85),
      outline: readLegacySetting(settings, "OUTLINE", "aus"),
      debug: readLegacySetting(settings, "DEBUG", false),
    });
  },
  dartMarkerDarts(legacyFeatureState) {
    const settings = getLegacyFeatureSettings(legacyFeatureState);
    return buildFeatureImport("dartMarkerDarts", legacyFeatureState, {
      design: normalizeLegacyDartDesign(
        readLegacySetting(settings, "DART_DESIGN", "Dart_autodarts.png"),
        "autodarts"
      ),
      animateDarts: readLegacySetting(settings, "ANIMATE_DARTS", true),
      sizePercent: readLegacySetting(settings, "DART_GROESSE", 100),
      hideOriginalMarkers: readLegacySetting(settings, "ORIGINAL_MARKER_AUSBLENDEN", false),
      enableShadow: readLegacySetting(settings, "SCHATTEN_AKTIV", true),
      enableWobble: readLegacySetting(settings, "WOBBLE_AKTIV", true),
      flightSpeed: readLegacySetting(settings, "FLUGGESCHWINDIGKEIT", "standard"),
      debug: readLegacySetting(settings, "DEBUG", false),
    });
  },
  removeDartsNotification(legacyFeatureState) {
    const settings = getLegacyFeatureSettings(legacyFeatureState);
    return buildFeatureImport("removeDartsNotification", legacyFeatureState, {
      imageSize: readLegacySetting(settings, "BILDGROESSE", "standard"),
      pulseAnimation: readLegacySetting(settings, "PULSE_ANIMATION", true),
      pulseScale: readLegacySetting(settings, "PULSE_STAERKE", 1.04),
      debug: readLegacySetting(settings, "DEBUG", false),
    });
  },
  singleBullSound(legacyFeatureState) {
    const settings = getLegacyFeatureSettings(legacyFeatureState);
    return buildFeatureImport("singleBullSound", legacyFeatureState, {
      volume: readLegacySetting(settings, "LAUTSTAERKE", 0.9),
      cooldownMs: readLegacySetting(settings, "WIEDERHOLSPERRE_MS", 700),
      pollIntervalMs: readLegacySetting(settings, "FALLBACK_SCAN_MS", 0),
      debug: readLegacySetting(settings, "DEBUG", false),
    });
  },
  turnPointsCount(legacyFeatureState) {
    const settings = getLegacyFeatureSettings(legacyFeatureState);
    return buildFeatureImport("turnPointsCount", legacyFeatureState, {
      durationMs: readLegacySetting(settings, "ANIMATIONSDAUER_MS", 416),
      flashOnChange: readLegacySetting(settings, "AUFBLITZEN_AKTIV", true),
      debug: readLegacySetting(settings, "DEBUG", false),
    });
  },
  winnerFireworks(legacyFeatureState) {
    const settings = getLegacyFeatureSettings(legacyFeatureState);
    return buildFeatureImport("winnerFireworks", legacyFeatureState, {
      style: readLegacySetting(settings, "STYLE", "realistic"),
      colorTheme: readLegacySetting(settings, "FARBE", "autodarts"),
      intensity: readLegacySetting(settings, "INTENSITAET", "standard"),
      includeBullOut: readLegacySetting(settings, "BULLOUT_AKTIV", true),
      pointerDismiss: readLegacySetting(settings, "KLICK_ZUM_STOPPEN", true),
      debug: readLegacySetting(settings, "DEBUG", false),
    });
  },
  "themes.x01"(legacyFeatureState) {
    const settings = getLegacyFeatureSettings(legacyFeatureState);
    return buildFeatureImport("themes.x01", legacyFeatureState, {
      showAvg: readLegacySetting(settings, "AVG_ANZEIGE", true),
      backgroundDisplayMode: readLegacySetting(settings, "HINTERGRUND_DARSTELLUNG", "fill"),
      backgroundOpacity: readLegacySetting(settings, "HINTERGRUND_OPAZITAET", 25),
      playerFieldTransparency: readLegacySetting(settings, "SPIELERFELD_TRANSPARENZ", 10),
      debug: readLegacySetting(settings, "DEBUG", false),
    });
  },
  "themes.shanghai"(legacyFeatureState) {
    const settings = getLegacyFeatureSettings(legacyFeatureState);
    return buildFeatureImport("themes.shanghai", legacyFeatureState, {
      showAvg: readLegacySetting(settings, "AVG_ANZEIGE", true),
      backgroundDisplayMode: readLegacySetting(settings, "HINTERGRUND_DARSTELLUNG", "fill"),
      backgroundOpacity: readLegacySetting(settings, "HINTERGRUND_OPAZITAET", 25),
      playerFieldTransparency: readLegacySetting(settings, "SPIELERFELD_TRANSPARENZ", 10),
      debug: readLegacySetting(settings, "DEBUG", false),
    });
  },
  "themes.bermuda"(legacyFeatureState) {
    const settings = getLegacyFeatureSettings(legacyFeatureState);
    return buildFeatureImport("themes.bermuda", legacyFeatureState, {
      backgroundDisplayMode: readLegacySetting(settings, "HINTERGRUND_DARSTELLUNG", "fill"),
      backgroundOpacity: readLegacySetting(settings, "HINTERGRUND_OPAZITAET", 25),
      playerFieldTransparency: readLegacySetting(settings, "SPIELERFELD_TRANSPARENZ", 10),
      debug: readLegacySetting(settings, "DEBUG", false),
    });
  },
  "themes.cricket"(legacyFeatureState) {
    const settings = getLegacyFeatureSettings(legacyFeatureState);
    return buildFeatureImport("themes.cricket", legacyFeatureState, {
      showAvg: readLegacySetting(settings, "AVG_ANZEIGE", true),
      backgroundDisplayMode: readLegacySetting(settings, "HINTERGRUND_DARSTELLUNG", "fill"),
      backgroundOpacity: readLegacySetting(settings, "HINTERGRUND_OPAZITAET", 25),
      playerFieldTransparency: readLegacySetting(settings, "SPIELERFELD_TRANSPARENZ", 10),
      debug: readLegacySetting(settings, "DEBUG", false),
    });
  },
  "themes.bullOff"(legacyFeatureState) {
    const settings = getLegacyFeatureSettings(legacyFeatureState);
    return buildFeatureImport("themes.bullOff", legacyFeatureState, {
      contrastPreset: readLegacySetting(settings, "KONTRAST_PRESET", "standard"),
      backgroundDisplayMode: readLegacySetting(settings, "HINTERGRUND_DARSTELLUNG", "fill"),
      backgroundOpacity: readLegacySetting(settings, "HINTERGRUND_OPAZITAET", 25),
      playerFieldTransparency: readLegacySetting(settings, "SPIELERFELD_TRANSPARENZ", 10),
      debug: readLegacySetting(settings, "DEBUG", false),
    });
  },
});

const FEATURE_NORMALIZERS = Object.freeze({
  checkoutScorePulse(rawConfig = {}) {
    return { enabled: normalizeBoolean(rawConfig.enabled, true), effect: normalizeStringChoice(rawConfig.effect, "scale", CHECKOUT_EFFECTS), colorTheme: CHECKOUT_COLORS.has(String(rawConfig.colorTheme || "").trim()) ? String(rawConfig.colorTheme).trim() : "159, 219, 88", intensity: normalizeStringChoice(rawConfig.intensity, "standard", CHECKOUT_INTENSITIES), triggerSource: normalizeStringChoice(rawConfig.triggerSource, "suggestion-first", CHECKOUT_TRIGGER_SOURCES), debug: normalizeBoolean(rawConfig.debug, false) };
  },
  checkoutBoardTargets(rawConfig = {}) {
    return { enabled: normalizeBoolean(rawConfig.enabled, false), visualPreset: resolveLegacyBoardTargetVisualPreset(rawConfig), segmentStyle: normalizeStringChoice(rawConfig.segmentStyle, "surface-outline", BOARD_TARGET_SEGMENT_STYLES), singleRing: "both", targetSelectionMode: normalizeStringChoice(rawConfig.targetSelectionMode, "next", BOARD_TARGET_SELECTION_MODES), colorTheme: normalizeStringChoice(rawConfig.colorTheme, "amber", BOARD_TARGET_THEMES), debug: normalizeBoolean(rawConfig.debug, false) };
  },
  tvBoardZoom(rawConfig = {}) {
    return { enabled: normalizeBoolean(rawConfig.enabled, false), zoomLevel: normalizeNumberChoice(rawConfig.zoomLevel, 2.75, TV_ZOOM_LEVELS), zoomSpeed: normalizeStringChoice(rawConfig.zoomSpeed, "mittel", TV_ZOOM_SPEEDS), checkoutZoomEnabled: normalizeBoolean(rawConfig.checkoutZoomEnabled, true), checkoutZoomTarget: normalizeStringChoice(rawConfig.checkoutZoomTarget, "finish-only", TV_ZOOM_TARGETS), t20SetupZoomEnabled: normalizeBoolean(rawConfig.t20SetupZoomEnabled, true), debug: normalizeBoolean(rawConfig.debug, false) };
  },
  styleCheckoutSuggestions(rawConfig = {}) {
    return { enabled: normalizeBoolean(rawConfig.enabled, false), style: normalizeStringChoice(rawConfig.style, "ribbon", SUGGESTION_STYLES), labelText: normalizeMappedStringChoice(rawConfig.labelText, "CHECKOUT", { "": "", checkout: "CHECKOUT", finish: "FINISH" }), colorTheme: normalizeStringChoice(rawConfig.colorTheme, "amber", SUGGESTION_COLOR_THEMES), debug: normalizeBoolean(rawConfig.debug, false) };
  },
  averageTrendArrow(rawConfig = {}) {
    return { enabled: normalizeBoolean(rawConfig.enabled, false), durationMs: normalizeNumberChoice(rawConfig.durationMs, 320, AVG_TREND_DURATIONS), size: normalizeMappedStringChoice(rawConfig.size, "standard", { klein: "klein", small: "klein", standard: "standard", gross: "gross", ["gro" + "\u00df"]: "gross", big: "gross", large: "gross" }), debug: normalizeBoolean(rawConfig.debug, false) };
  },
  turnStartSweep(rawConfig = {}) {
    return { enabled: normalizeBoolean(rawConfig.enabled, false), durationMs: normalizeNumberChoice(rawConfig.durationMs, 420, TURN_START_SWEEP_DURATIONS), sweepStyle: normalizeStringChoice(rawConfig.sweepStyle, "standard", TURN_START_SWEEP_STYLES), debug: normalizeBoolean(rawConfig.debug, false) };
  },
  tripleDoubleBullHits(rawConfig = {}) {
    const legacyHitColorMode = String(rawConfig.hitColorMode || "").trim().toLowerCase();
    const fallbackColorTheme = legacyHitColorMode === "theme-presets" ? "champagne-night" : "kind-signal";
    return { enabled: normalizeBoolean(rawConfig.enabled, false), colorTheme: normalizeStringChoice(rawConfig.colorTheme, fallbackColorTheme, TRIPLE_DOUBLE_BULL_COLOR_THEMES), animationStyle: normalizeStringChoice(rawConfig.animationStyle, "charge-release", TRIPLE_DOUBLE_BULL_ANIMATION_STYLES), debug: normalizeBoolean(rawConfig.debug, false) };
  },
  cricketHighlighter(rawConfig = {}) {
    const showOpenValue = Object.prototype.hasOwnProperty.call(rawConfig, "showOpenTargets") ? rawConfig.showOpenTargets : rawConfig.showOpenObjectives;
    const showDeadValue = Object.prototype.hasOwnProperty.call(rawConfig, "showDeadTargets") ? rawConfig.showDeadTargets : rawConfig.showDeadObjectives;
    const normalizedDimStyle = normalizeStringChoice(rawConfig.irrelevantBoardDimStyle, "smoke", CRICKET_HIGHLIGHT_IRRELEVANT_DIM_STYLES);
    const hasLegacyDimSetting = Object.prototype.hasOwnProperty.call(rawConfig, "dimIrrelevantBoardTargets");
    const irrelevantBoardDimStyle = hasLegacyDimSetting && normalizedDimStyle === "smoke" ? normalizeBoolean(rawConfig.dimIrrelevantBoardTargets, true) ? "smoke" : "off" : normalizedDimStyle;
    return { enabled: normalizeBoolean(rawConfig.enabled, false), showOpenObjectives: normalizeBoolean(showOpenValue, false), showDeadObjectives: normalizeBoolean(showDeadValue, true), irrelevantBoardDimStyle, dimIrrelevantBoardTargets: irrelevantBoardDimStyle !== "off", colorTheme: normalizeStringChoice(rawConfig.colorTheme, "standard", CRICKET_HIGHLIGHT_THEMES), intensity: normalizeStringChoice(rawConfig.intensity, "normal", CRICKET_HIGHLIGHT_INTENSITIES), debug: normalizeBoolean(rawConfig.debug, false) };
  },
  cricketGridFx(rawConfig = {}) {
    const pressureEdgeValue = Object.prototype.hasOwnProperty.call(rawConfig, "threatEdge") ? rawConfig.threatEdge : rawConfig.pressureEdge;
    const scoringStripeValue = Object.prototype.hasOwnProperty.call(rawConfig, "scoringLane") ? rawConfig.scoringLane : rawConfig.scoringStripe;
    const deadRowMutedValue = Object.prototype.hasOwnProperty.call(rawConfig, "deadRowCollapse") ? rawConfig.deadRowCollapse : rawConfig.deadRowMuted;
    const pressureOverlayValue = Object.prototype.hasOwnProperty.call(rawConfig, "opponentPressureOverlay") ? rawConfig.opponentPressureOverlay : rawConfig.pressureOverlay;
    return { enabled: normalizeBoolean(rawConfig.enabled, false), rowWave: normalizeBoolean(rawConfig.rowWave, true), badgeBeacon: normalizeBoolean(rawConfig.badgeBeacon, true), markProgress: normalizeBoolean(rawConfig.markProgress, true), pressureEdge: normalizeBoolean(pressureEdgeValue, true), scoringStripe: normalizeBoolean(scoringStripeValue, true), deadRowMuted: normalizeBoolean(deadRowMutedValue, true), deltaChips: normalizeBoolean(rawConfig.deltaChips, true), hitSpark: normalizeBoolean(rawConfig.hitSpark, true), roundTransitionWipe: normalizeBoolean(rawConfig.roundTransitionWipe, true), pressureOverlay: normalizeBoolean(pressureOverlayValue, true), colorTheme: normalizeStringChoice(rawConfig.colorTheme, "standard", CRICKET_HIGHLIGHT_THEMES), intensity: normalizeStringChoice(rawConfig.intensity, "normal", CRICKET_HIGHLIGHT_INTENSITIES), debug: normalizeBoolean(rawConfig.debug, false) };
  },
  dartMarkerEmphasis(rawConfig = {}) {
    const colorThemeRaw = String(rawConfig.color || "").trim();
    return { enabled: normalizeBoolean(rawConfig.enabled, false), size: normalizeNumberChoice(rawConfig.size, 6, DART_MARKER_EMPHASIS_SIZES), color: DART_MARKER_EMPHASIS_COLORS.has(colorThemeRaw) ? colorThemeRaw : "rgb(49, 130, 206)", effect: normalizeStringChoice(rawConfig.effect, "glow", DART_MARKER_EMPHASIS_EFFECTS), opacityPercent: normalizeNumberChoice(rawConfig.opacityPercent, 85, DART_MARKER_EMPHASIS_OPACITY), outline: normalizeStringChoice(rawConfig.outline, "aus", DART_MARKER_EMPHASIS_OUTLINE), debug: normalizeBoolean(rawConfig.debug, false) };
  },
  dartMarkerDarts(rawConfig = {}) {
    return { enabled: normalizeBoolean(rawConfig.enabled, false), design: normalizeStringChoice(rawConfig.design, "autodarts", DART_MARKER_DARTS_DESIGNS), animateDarts: normalizeBoolean(rawConfig.animateDarts, true), sizePercent: normalizeNumberChoice(rawConfig.sizePercent, 100, DART_MARKER_DARTS_SIZE_PERCENT), hideOriginalMarkers: normalizeBoolean(rawConfig.hideOriginalMarkers, false), enableShadow: normalizeBoolean(rawConfig.enableShadow, true), enableWobble: normalizeBoolean(rawConfig.enableWobble, true), flightSpeed: normalizeStringChoice(rawConfig.flightSpeed, "standard", DART_MARKER_DARTS_FLIGHT_SPEED), debug: normalizeBoolean(rawConfig.debug, false) };
  },
  removeDartsNotification(rawConfig = {}) {
    return { enabled: normalizeBoolean(rawConfig.enabled, false), imageSize: normalizeStringChoice(rawConfig.imageSize, "standard", REMOVE_DARTS_NOTIFICATION_IMAGE_SIZE), pulseAnimation: normalizeBoolean(rawConfig.pulseAnimation, true), pulseScale: normalizeNumberChoice(rawConfig.pulseScale, 1.04, REMOVE_DARTS_NOTIFICATION_PULSE_SCALE), debug: normalizeBoolean(rawConfig.debug, false) };
  },
  singleBullSound(rawConfig = {}) {
    return { enabled: normalizeBoolean(rawConfig.enabled, false), volume: normalizeNumberChoice(rawConfig.volume, 0.9, SINGLE_BULL_SOUND_VOLUME), cooldownMs: normalizeNumberChoice(rawConfig.cooldownMs, 700, SINGLE_BULL_SOUND_COOLDOWN), pollIntervalMs: normalizeNumberChoice(rawConfig.pollIntervalMs, 0, SINGLE_BULL_SOUND_POLL_INTERVAL), debug: normalizeBoolean(rawConfig.debug, false) };
  },
  turnPointsCount(rawConfig = {}) {
    const hasLegacyFlashPermanent = Object.prototype.hasOwnProperty.call(rawConfig, "flashPermanent");
    const legacyFlashMode = hasLegacyFlashPermanent ? normalizeBoolean(rawConfig.flashPermanent, false) ? "permanent" : "on-change" : "on-change";
    const normalizedFlashMode = normalizeMappedStringChoice(rawConfig.flashMode, legacyFlashMode, { "": "on-change", "on-change": "on-change", onchange: "on-change", appear: "on-change", burst: "on-change", "nur-bei-Ã¤nderung": "on-change", "nur-bei-aenderung": "on-change", permanent: "permanent", always: "permanent", persistent: "permanent", dauerhaft: "permanent" });
    return { enabled: normalizeBoolean(rawConfig.enabled, false), durationMs: normalizeNumberChoice(rawConfig.durationMs, 416, TURN_POINTS_COUNT_DURATIONS), flashOnChange: normalizeBoolean(rawConfig.flashOnChange, true), flashMode: hasLegacyFlashPermanent ? legacyFlashMode : normalizedFlashMode, debug: normalizeBoolean(rawConfig.debug, false) };
  },
  winnerFireworks(rawConfig = {}) {
    return { enabled: normalizeBoolean(rawConfig.enabled, false), style: normalizeStringChoice(rawConfig.style, "realistic", WINNER_FIREWORKS_STYLES), colorTheme: normalizeStringChoice(rawConfig.colorTheme, "autodarts", WINNER_FIREWORKS_COLOR_THEMES), intensity: normalizeStringChoice(rawConfig.intensity, "standard", WINNER_FIREWORKS_INTENSITIES), includeBullOut: normalizeBoolean(rawConfig.includeBullOut, true), pointerDismiss: normalizeBoolean(rawConfig.pointerDismiss, true), debug: normalizeBoolean(rawConfig.debug, false) };
  },
  x01ScoreProgress(rawConfig = {}) {
    const legacyThresholdColorMode = normalizeStringChoice(rawConfig.thresholdColorMode, "", X01_SCORE_PROGRESS_COLOR_THEMES);
    const normalizedColorTheme = normalizeStringChoice(rawConfig.colorTheme, legacyThresholdColorMode || "checkout-focus", X01_SCORE_PROGRESS_COLOR_THEMES);
    return { enabled: normalizeBoolean(rawConfig.enabled, false), colorTheme: normalizedColorTheme, barSize: normalizeStringChoice(rawConfig.barSize, "standard", X01_SCORE_PROGRESS_BAR_SIZES), effect: normalizeMappedStringChoice(rawConfig.effect, "pulse-core", { "": "pulse-core", off: "off", "pulse-core": "pulse-core", "glass-charge": "glass-charge", "segment-drain": "segment-drain", "ghost-trail": "ghost-trail", "signal-sweep": "signal-sweep", "electric-surge": "signal-sweep", "pulse-on-change": "pulse-core", "charge-release": "pulse-core", "sheen-sweep": "glass-charge", "checkout-glow": "glass-charge", "burn-down": "segment-drain", "segment-pop": "segment-drain", "spark-trail": "ghost-trail", "heat-edge": "signal-sweep", "danger-flicker": "signal-sweep", "electric-border": "signal-sweep", "arc-burst": "signal-sweep" }), debug: normalizeBoolean(rawConfig.debug, false) };
  },
  "themes.x01"(rawConfig = {}) {
    return { ...normalizeThemeBaseConfig(rawConfig, DEFAULT_FEATURE_CONFIGS["themes.x01"]), showAvg: normalizeBoolean(rawConfig.showAvg, true) };
  },
  "themes.shanghai"(rawConfig = {}) {
    return { ...normalizeThemeBaseConfig(rawConfig, DEFAULT_FEATURE_CONFIGS["themes.shanghai"]), showAvg: normalizeBoolean(rawConfig.showAvg, true) };
  },
  "themes.bermuda"(rawConfig = {}) {
    return normalizeThemeBaseConfig(rawConfig, DEFAULT_FEATURE_CONFIGS["themes.bermuda"]);
  },
  "themes.cricket"(rawConfig = {}) {
    return { ...normalizeThemeBaseConfig(rawConfig, DEFAULT_FEATURE_CONFIGS["themes.cricket"]), showAvg: normalizeBoolean(rawConfig.showAvg, true) };
  },
  "themes.bullOff"(rawConfig = {}) {
    return { ...normalizeThemeBaseConfig(rawConfig, DEFAULT_FEATURE_CONFIGS["themes.bullOff"]), contrastPreset: normalizeStringChoice(rawConfig.contrastPreset, "standard", THEME_CONTRAST_PRESETS) };
  },
});

export const featureConfigSpecs = Object.freeze(
  Object.fromEntries(
    featureCatalog
      .map((entry) => {
        const normalizedKey = String(entry.configKey || "").trim();
        const normalizeConfig = FEATURE_NORMALIZERS[normalizedKey];
        if (typeof normalizeConfig !== "function") {
          return null;
        }

        return [
          normalizedKey,
          Object.freeze({
            createDefaultConfig() {
              return deepClone(DEFAULT_FEATURE_CONFIGS[normalizedKey] || {});
            },
            createRecommendedConfig() {
              return deepClone(RECOMMENDED_FEATURE_CONFIGS[normalizedKey] || {});
            },
            normalizeConfig,
            importLegacy: LEGACY_IMPORTERS[normalizedKey] || null,
            removeKeys: Object.freeze([...(FEATURE_REMOVE_KEYS[normalizedKey] || [])]),
          }),
        ];
      })
      .filter(Boolean)
  )
);

export function getFeatureConfigSpec(configKey) {
  const normalizedKey = String(configKey || "").trim();
  return featureConfigSpecs[normalizedKey] || null;
}

export function listFeatureConfigSpecs() {
  return featureCatalog.map((entry) => Object.freeze({ ...entry, ...getFeatureConfigSpec(entry.configKey) }));
}

export function getFeatureConfigKeys() {
  return featureCatalog.map((entry) => entry.configKey);
}

export function getThemeConfigKeys() {
  return featureCatalog
    .filter((entry) => entry.configKey.startsWith("themes."))
    .map((entry) => splitFeaturePath(entry.configKey)[1])
    .filter(Boolean);
}

export function createDefaultConfigFromFeatureSpecs() {
  const featureToggles = {};
  const features = {};
  listFeatureConfigSpecs().forEach((entry) => {
    const defaultFeatureConfig = entry.createDefaultConfig();
    featureToggles[entry.configKey] = Boolean(defaultFeatureConfig.enabled);
    setNestedValue(features, splitFeaturePath(entry.configKey), defaultFeatureConfig);
  });
  return { featureToggles, features };
}
