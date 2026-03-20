import { defaultConfig } from "./default-config.js";

const CHECKOUT_EFFECTS = new Set(["pulse", "glow", "scale", "blink"]);
const CHECKOUT_INTENSITIES = new Set(["dezent", "standard", "stark"]);
const CHECKOUT_TRIGGER_SOURCES = new Set([
  "suggestion-first",
  "score-only",
  "suggestion-only",
]);
const CHECKOUT_COLORS = new Set([
  "159, 219, 88",
  "56, 189, 248",
  "245, 158, 11",
  "248, 113, 113",
]);
const BOARD_TARGET_EFFECTS = new Set(["pulse", "blink", "glow"]);
const BOARD_TARGET_SINGLE_RING = new Set(["both", "inner", "outer"]);
const BOARD_TARGET_THEMES = new Set(["violet", "cyan", "amber"]);
const BOARD_TARGET_OUTLINE_INTENSITY = new Set(["dezent", "standard", "stark"]);
const TV_ZOOM_LEVELS = new Set([2.35, 2.75, 3.15]);
const TV_ZOOM_SPEEDS = new Set(["schnell", "mittel", "langsam"]);
const SUGGESTION_STYLES = new Set(["badge", "ribbon", "stripe", "ticket", "outline"]);
const SUGGESTION_COLOR_THEMES = new Set(["amber", "cyan", "rose"]);
const AVG_TREND_DURATIONS = new Set([220, 320, 500]);
const TURN_START_SWEEP_DURATIONS = new Set([300, 420, 620]);
const TURN_START_SWEEP_STYLES = new Set(["subtle", "standard", "strong"]);
const TRIPLE_DOUBLE_BULL_COLOR_THEMES = new Set([
  "kind-signal",
  "ember-rush",
  "ice-circuit",
  "volt-lime",
  "crimson-steel",
  "arctic-mint",
  "champagne-night",
]);
const TRIPLE_DOUBLE_BULL_ANIMATION_STYLES = new Set([
  "impact-pop",
  "shockwave",
  "sweep-shine",
  "electric-arc",
  "neon-pulse",
  "snap-bounce",
  "card-slam",
  "signal-blink",
  "stagger-wave",
  "flip-edge",
  "outline-trace",
  "charge-release",
  "alternate-flick",
]);
const CRICKET_HIGHLIGHT_THEMES = new Set(["standard", "high-contrast"]);
const CRICKET_HIGHLIGHT_INTENSITIES = new Set(["subtle", "normal", "strong"]);
const CRICKET_HIGHLIGHT_IRRELEVANT_DIM_STYLES = new Set(["off", "smoke", "hatch", "mask"]);
const DART_MARKER_EMPHASIS_SIZES = new Set([4, 6, 9]);
const DART_MARKER_EMPHASIS_COLORS = new Set([
  "rgb(49, 130, 206)",
  "rgb(34, 197, 94)",
  "rgb(248, 113, 113)",
  "rgb(250, 204, 21)",
  "rgb(255, 255, 255)",
]);
const DART_MARKER_EMPHASIS_EFFECTS = new Set(["glow", "pulse", "none"]);
const DART_MARKER_EMPHASIS_OPACITY = new Set([65, 85, 100]);
const DART_MARKER_EMPHASIS_OUTLINE = new Set(["aus", "weiss", "schwarz"]);
const DART_MARKER_DARTS_DESIGNS = new Set([
  "autodarts",
  "blackblue",
  "blackgreen",
  "blackred",
  "blue",
  "camoflage",
  "green",
  "pride",
  "red",
  "white",
  "whitetrible",
  "yellow",
  "yellowscull",
]);
const DART_MARKER_DARTS_SIZE_PERCENT = new Set([90, 100, 115]);
const DART_MARKER_DARTS_FLIGHT_SPEED = new Set(["schnell", "standard", "cinematic"]);
const REMOVE_DARTS_NOTIFICATION_IMAGE_SIZE = new Set(["compact", "standard", "large"]);
const REMOVE_DARTS_NOTIFICATION_PULSE_SCALE = new Set([1.02, 1.04, 1.08]);
const SINGLE_BULL_SOUND_VOLUME = new Set([0.5, 0.75, 0.9, 1]);
const SINGLE_BULL_SOUND_COOLDOWN = new Set([400, 700, 1000]);
const SINGLE_BULL_SOUND_POLL_INTERVAL = new Set([0, 1200]);
const TURN_POINTS_COUNT_DURATIONS = new Set([260, 416, 650]);
const X01_SCORE_PROGRESS_COLOR_THEMES = new Set([
  "checkout-focus",
  "traffic-light",
  "danger-endgame",
  "gradient-by-progress",
  "autodarts",
  "signal-lime",
  "glass-mint",
  "ember-rush",
  "ice-circuit",
  "neon-violet",
  "sunset-amber",
  "monochrome-steel",
]);
const X01_SCORE_PROGRESS_BAR_SIZES = new Set(["schmal", "standard", "breit", "extrabreit"]);
const X01_SCORE_PROGRESS_EFFECTS = new Set([
  "pulse-core",
  "glass-charge",
  "segment-drain",
  "ghost-trail",
  "signal-sweep",
  "off",
]);
const WINNER_FIREWORKS_STYLES = new Set([
  "realistic",
  "fireworks",
  "cannon",
  "victorystorm",
  "stars",
  "sides",
]);
const WINNER_FIREWORKS_COLOR_THEMES = new Set([
  "autodarts",
  "redwhite",
  "ice",
  "sunset",
  "neon",
  "gold",
]);
const WINNER_FIREWORKS_INTENSITIES = new Set(["dezent", "standard", "stark"]);
const THEME_BACKGROUND_DISPLAY_MODES = new Set(["fill", "fit", "stretch", "center", "tile"]);
const THEME_BACKGROUND_OPACITY = new Set([100, 85, 70, 55, 40, 25, 10]);
const THEME_PLAYER_FIELD_TRANSPARENCY = new Set([0, 5, 10, 15, 30, 45, 60]);
const THEME_CONTRAST_PRESETS = new Set(["soft", "standard", "high"]);

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

function deepMerge(baseValue, nextValue) {
  if (nextValue === null || typeof nextValue !== "object") {
    return deepClone(nextValue);
  }

  if (Array.isArray(nextValue)) {
    return nextValue.map((item) => deepClone(item));
  }

  const base =
    baseValue && typeof baseValue === "object" && !Array.isArray(baseValue)
      ? baseValue
      : {};

  const merged = { ...base };
  Object.keys(nextValue).forEach((key) => {
    merged[key] = deepMerge(base[key], nextValue[key]);
  });
  return merged;
}

function splitFeaturePath(featureKey) {
  return String(featureKey || "")
    .split(".")
    .map((part) => String(part || "").trim())
    .filter(Boolean);
}

function getNestedValue(rootValue, pathParts = []) {
  if (!rootValue || typeof rootValue !== "object" || !Array.isArray(pathParts) || !pathParts.length) {
    return null;
  }

  let current = rootValue;
  for (const part of pathParts) {
    if (!current || typeof current !== "object") {
      return null;
    }
    current = current[part];
  }

  return typeof current === "undefined" ? null : current;
}

function setNestedValue(rootValue, pathParts = [], value) {
  if (!rootValue || typeof rootValue !== "object" || !Array.isArray(pathParts) || !pathParts.length) {
    return;
  }

  let current = rootValue;
  for (let index = 0; index < pathParts.length - 1; index += 1) {
    const part = pathParts[index];
    if (!current[part] || typeof current[part] !== "object" || Array.isArray(current[part])) {
      current[part] = {};
    }
    current = current[part];
  }

  current[pathParts[pathParts.length - 1]] = value;
}

function collectFeatureKeysFromObject(value, prefix = "", result = new Set()) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return result;
  }

  Object.keys(value).forEach((key) => {
    const normalizedKey = String(key || "").trim();
    if (!normalizedKey) {
      return;
    }
    const nextPrefix = prefix ? `${prefix}.${normalizedKey}` : normalizedKey;
    const entry = value[normalizedKey];
    const isObjectEntry = Boolean(entry) && typeof entry === "object" && !Array.isArray(entry);

    if (!isObjectEntry) {
      return;
    }

    if (Object.prototype.hasOwnProperty.call(entry, "enabled")) {
      result.add(nextPrefix);
    }

    if (isObjectEntry) {
      collectFeatureKeysFromObject(entry, nextPrefix, result);
    }
  });

  return result;
}

function normalizeStringChoice(value, fallbackValue, allowedSet) {
  const normalized = String(value || "").trim().toLowerCase();
  if (allowedSet.has(normalized)) {
    return normalized;
  }
  return fallbackValue;
}

function normalizeMappedStringChoice(value, fallbackValue, aliasMap) {
  if (typeof value === "undefined" || value === null) {
    return fallbackValue;
  }
  const normalized = String(value || "").trim().toLowerCase();
  if (Object.prototype.hasOwnProperty.call(aliasMap, normalized)) {
    return aliasMap[normalized];
  }
  return fallbackValue;
}

function normalizeNumberChoice(value, fallbackValue, allowedSet) {
  const numeric = Number(value);
  if (Number.isFinite(numeric) && allowedSet.has(numeric)) {
    return numeric;
  }
  return fallbackValue;
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

function mergeFeatureConfigWithUnknownFields(rawFeatureConfig, normalizedFeatureConfig) {
  const raw =
    rawFeatureConfig && typeof rawFeatureConfig === "object" && !Array.isArray(rawFeatureConfig)
      ? deepClone(rawFeatureConfig)
      : {};
  const normalized =
    normalizedFeatureConfig &&
    typeof normalizedFeatureConfig === "object" &&
    !Array.isArray(normalizedFeatureConfig)
      ? normalizedFeatureConfig
      : {};

  return {
    ...raw,
    ...normalized,
  };
}

function normalizeCheckoutScorePulseConfig(rawConfig = {}) {
  return {
    enabled: normalizeBoolean(rawConfig.enabled, true),
    effect: normalizeStringChoice(rawConfig.effect, "scale", CHECKOUT_EFFECTS),
    colorTheme: CHECKOUT_COLORS.has(String(rawConfig.colorTheme || "").trim())
      ? String(rawConfig.colorTheme).trim()
      : "159, 219, 88",
    intensity: normalizeStringChoice(rawConfig.intensity, "standard", CHECKOUT_INTENSITIES),
    triggerSource: normalizeStringChoice(
      rawConfig.triggerSource,
      "suggestion-first",
      CHECKOUT_TRIGGER_SOURCES
    ),
    debug: normalizeBoolean(rawConfig.debug, false),
  };
}

function normalizeCheckoutBoardTargetsConfig(rawConfig = {}) {
  return {
    enabled: normalizeBoolean(rawConfig.enabled, false),
    effect: normalizeStringChoice(rawConfig.effect, "pulse", BOARD_TARGET_EFFECTS),
    singleRing: normalizeStringChoice(rawConfig.singleRing, "both", BOARD_TARGET_SINGLE_RING),
    colorTheme: normalizeStringChoice(rawConfig.colorTheme, "violet", BOARD_TARGET_THEMES),
    outlineIntensity: normalizeStringChoice(
      rawConfig.outlineIntensity,
      "standard",
      BOARD_TARGET_OUTLINE_INTENSITY
    ),
    debug: normalizeBoolean(rawConfig.debug, false),
  };
}

function normalizeTvBoardZoomConfig(rawConfig = {}) {
  return {
    enabled: normalizeBoolean(rawConfig.enabled, false),
    zoomLevel: normalizeNumberChoice(rawConfig.zoomLevel, 2.75, TV_ZOOM_LEVELS),
    zoomSpeed: normalizeStringChoice(rawConfig.zoomSpeed, "mittel", TV_ZOOM_SPEEDS),
    checkoutZoomEnabled: normalizeBoolean(rawConfig.checkoutZoomEnabled, true),
    debug: normalizeBoolean(rawConfig.debug, false),
  };
}

function normalizeStyleCheckoutSuggestionsConfig(rawConfig = {}) {
  return {
    enabled: normalizeBoolean(rawConfig.enabled, false),
    style: normalizeStringChoice(rawConfig.style, "ribbon", SUGGESTION_STYLES),
    labelText: normalizeMappedStringChoice(rawConfig.labelText, "CHECKOUT", {
      "": "",
      checkout: "CHECKOUT",
      finish: "FINISH",
    }),
    colorTheme: normalizeStringChoice(rawConfig.colorTheme, "amber", SUGGESTION_COLOR_THEMES),
    debug: normalizeBoolean(rawConfig.debug, false),
  };
}

function normalizeAverageTrendArrowConfig(rawConfig = {}) {
  return {
    enabled: normalizeBoolean(rawConfig.enabled, false),
    durationMs: normalizeNumberChoice(rawConfig.durationMs, 320, AVG_TREND_DURATIONS),
    size: normalizeMappedStringChoice(rawConfig.size, "standard", {
      klein: "klein",
      small: "klein",
      standard: "standard",
      gross: "gross",
      ["gro" + "\u00df"]: "gross",
      big: "gross",
      large: "gross",
    }),
    debug: normalizeBoolean(rawConfig.debug, false),
  };
}

function normalizeTurnStartSweepConfig(rawConfig = {}) {
  return {
    enabled: normalizeBoolean(rawConfig.enabled, false),
    durationMs: normalizeNumberChoice(rawConfig.durationMs, 420, TURN_START_SWEEP_DURATIONS),
    sweepStyle: normalizeStringChoice(rawConfig.sweepStyle, "standard", TURN_START_SWEEP_STYLES),
    debug: normalizeBoolean(rawConfig.debug, false),
  };
}

function normalizeTripleDoubleBullHitsConfig(rawConfig = {}) {
  const legacyHitColorMode = String(rawConfig.hitColorMode || "").trim().toLowerCase();
  const fallbackColorTheme = legacyHitColorMode === "theme-presets" ? "champagne-night" : "kind-signal";
  return {
    enabled: normalizeBoolean(rawConfig.enabled, false),
    colorTheme: normalizeStringChoice(
      rawConfig.colorTheme,
      fallbackColorTheme,
      TRIPLE_DOUBLE_BULL_COLOR_THEMES
    ),
    animationStyle: normalizeStringChoice(
      rawConfig.animationStyle,
      "charge-release",
      TRIPLE_DOUBLE_BULL_ANIMATION_STYLES
    ),
    debug: normalizeBoolean(rawConfig.debug, false),
  };
}

function normalizeCricketHighlighterConfig(rawConfig = {}) {
  const showOpenValue = Object.prototype.hasOwnProperty.call(rawConfig, "showOpenTargets")
    ? rawConfig.showOpenTargets
    : rawConfig.showOpenObjectives;
  const showDeadValue = Object.prototype.hasOwnProperty.call(rawConfig, "showDeadTargets")
    ? rawConfig.showDeadTargets
    : rawConfig.showDeadObjectives;
  const normalizedDimStyle = normalizeStringChoice(
    rawConfig.irrelevantBoardDimStyle,
    "smoke",
    CRICKET_HIGHLIGHT_IRRELEVANT_DIM_STYLES
  );
  const hasLegacyDimSetting = Object.prototype.hasOwnProperty.call(
    rawConfig,
    "dimIrrelevantBoardTargets"
  );
  const irrelevantBoardDimStyle =
    hasLegacyDimSetting && normalizedDimStyle === "smoke"
      ? normalizeBoolean(rawConfig.dimIrrelevantBoardTargets, true)
        ? "smoke"
        : "off"
      : normalizedDimStyle;
  return {
    enabled: normalizeBoolean(rawConfig.enabled, false),
    showOpenObjectives: normalizeBoolean(showOpenValue, false),
    showDeadObjectives: normalizeBoolean(showDeadValue, true),
    irrelevantBoardDimStyle,
    dimIrrelevantBoardTargets: irrelevantBoardDimStyle !== "off",
    colorTheme: normalizeStringChoice(rawConfig.colorTheme, "standard", CRICKET_HIGHLIGHT_THEMES),
    intensity: normalizeStringChoice(rawConfig.intensity, "normal", CRICKET_HIGHLIGHT_INTENSITIES),
    debug: normalizeBoolean(rawConfig.debug, false),
  };
}

function normalizeCricketGridFxConfig(rawConfig = {}) {
  const pressureEdgeValue = Object.prototype.hasOwnProperty.call(rawConfig, "threatEdge")
    ? rawConfig.threatEdge
    : rawConfig.pressureEdge;
  const scoringStripeValue = Object.prototype.hasOwnProperty.call(rawConfig, "scoringLane")
    ? rawConfig.scoringLane
    : rawConfig.scoringStripe;
  const deadRowMutedValue = Object.prototype.hasOwnProperty.call(rawConfig, "deadRowCollapse")
    ? rawConfig.deadRowCollapse
    : rawConfig.deadRowMuted;
  const pressureOverlayValue = Object.prototype.hasOwnProperty.call(rawConfig, "opponentPressureOverlay")
    ? rawConfig.opponentPressureOverlay
    : rawConfig.pressureOverlay;
  return {
    enabled: normalizeBoolean(rawConfig.enabled, false),
    rowWave: normalizeBoolean(rawConfig.rowWave, true),
    badgeBeacon: normalizeBoolean(rawConfig.badgeBeacon, true),
    markProgress: normalizeBoolean(rawConfig.markProgress, true),
    pressureEdge: normalizeBoolean(pressureEdgeValue, true),
    scoringStripe: normalizeBoolean(scoringStripeValue, true),
    deadRowMuted: normalizeBoolean(deadRowMutedValue, true),
    deltaChips: normalizeBoolean(rawConfig.deltaChips, true),
    hitSpark: normalizeBoolean(rawConfig.hitSpark, true),
    roundTransitionWipe: normalizeBoolean(rawConfig.roundTransitionWipe, true),
    pressureOverlay: normalizeBoolean(pressureOverlayValue, true),
    colorTheme: normalizeStringChoice(rawConfig.colorTheme, "standard", CRICKET_HIGHLIGHT_THEMES),
    intensity: normalizeStringChoice(rawConfig.intensity, "normal", CRICKET_HIGHLIGHT_INTENSITIES),
    debug: normalizeBoolean(rawConfig.debug, false),
  };
}

function normalizeDartMarkerEmphasisConfig(rawConfig = {}) {
  const colorThemeRaw = String(rawConfig.color || "").trim();
  return {
    enabled: normalizeBoolean(rawConfig.enabled, false),
    size: normalizeNumberChoice(rawConfig.size, 6, DART_MARKER_EMPHASIS_SIZES),
    color: DART_MARKER_EMPHASIS_COLORS.has(colorThemeRaw)
      ? colorThemeRaw
      : "rgb(49, 130, 206)",
    effect: normalizeStringChoice(rawConfig.effect, "glow", DART_MARKER_EMPHASIS_EFFECTS),
    opacityPercent: normalizeNumberChoice(
      rawConfig.opacityPercent,
      85,
      DART_MARKER_EMPHASIS_OPACITY
    ),
    outline: normalizeStringChoice(rawConfig.outline, "aus", DART_MARKER_EMPHASIS_OUTLINE),
    debug: normalizeBoolean(rawConfig.debug, false),
  };
}

function normalizeDartMarkerDartsConfig(rawConfig = {}) {
  return {
    enabled: normalizeBoolean(rawConfig.enabled, false),
    design: normalizeStringChoice(rawConfig.design, "autodarts", DART_MARKER_DARTS_DESIGNS),
    animateDarts: normalizeBoolean(rawConfig.animateDarts, true),
    sizePercent: normalizeNumberChoice(rawConfig.sizePercent, 100, DART_MARKER_DARTS_SIZE_PERCENT),
    hideOriginalMarkers: normalizeBoolean(rawConfig.hideOriginalMarkers, false),
    enableShadow: normalizeBoolean(rawConfig.enableShadow, true),
    enableWobble: normalizeBoolean(rawConfig.enableWobble, true),
    flightSpeed: normalizeStringChoice(
      rawConfig.flightSpeed,
      "standard",
      DART_MARKER_DARTS_FLIGHT_SPEED
    ),
    debug: normalizeBoolean(rawConfig.debug, false),
  };
}

function normalizeRemoveDartsNotificationConfig(rawConfig = {}) {
  return {
    enabled: normalizeBoolean(rawConfig.enabled, false),
    imageSize: normalizeStringChoice(
      rawConfig.imageSize,
      "standard",
      REMOVE_DARTS_NOTIFICATION_IMAGE_SIZE
    ),
    pulseAnimation: normalizeBoolean(rawConfig.pulseAnimation, true),
    pulseScale: normalizeNumberChoice(
      rawConfig.pulseScale,
      1.04,
      REMOVE_DARTS_NOTIFICATION_PULSE_SCALE
    ),
    debug: normalizeBoolean(rawConfig.debug, false),
  };
}

function normalizeSingleBullSoundConfig(rawConfig = {}) {
  return {
    enabled: normalizeBoolean(rawConfig.enabled, false),
    volume: normalizeNumberChoice(rawConfig.volume, 0.9, SINGLE_BULL_SOUND_VOLUME),
    cooldownMs: normalizeNumberChoice(rawConfig.cooldownMs, 700, SINGLE_BULL_SOUND_COOLDOWN),
    pollIntervalMs: normalizeNumberChoice(
      rawConfig.pollIntervalMs,
      0,
      SINGLE_BULL_SOUND_POLL_INTERVAL
    ),
    debug: normalizeBoolean(rawConfig.debug, false),
  };
}

function normalizeTurnPointsCountConfig(rawConfig = {}) {
  const hasLegacyFlashPermanent = Object.prototype.hasOwnProperty.call(rawConfig, "flashPermanent");
  const legacyFlashMode = hasLegacyFlashPermanent
    ? normalizeBoolean(rawConfig.flashPermanent, false)
      ? "permanent"
      : "on-change"
    : "on-change";
  const normalizedFlashMode = normalizeMappedStringChoice(rawConfig.flashMode, legacyFlashMode, {
    "": "on-change",
    "on-change": "on-change",
    onchange: "on-change",
    appear: "on-change",
    burst: "on-change",
    "nur-bei-änderung": "on-change",
    "nur-bei-aenderung": "on-change",
    permanent: "permanent",
    always: "permanent",
    persistent: "permanent",
    dauerhaft: "permanent",
  });
  return {
    enabled: normalizeBoolean(rawConfig.enabled, false),
    durationMs: normalizeNumberChoice(rawConfig.durationMs, 416, TURN_POINTS_COUNT_DURATIONS),
    flashOnChange: normalizeBoolean(rawConfig.flashOnChange, true),
    flashMode: hasLegacyFlashPermanent ? legacyFlashMode : normalizedFlashMode,
    debug: normalizeBoolean(rawConfig.debug, false),
  };
}

function normalizeX01ScoreProgressConfig(rawConfig = {}) {
  const legacyThresholdColorMode = normalizeStringChoice(
    rawConfig.thresholdColorMode,
    "",
    X01_SCORE_PROGRESS_COLOR_THEMES
  );
  const normalizedColorTheme = normalizeStringChoice(
    rawConfig.colorTheme,
    legacyThresholdColorMode || "checkout-focus",
    X01_SCORE_PROGRESS_COLOR_THEMES
  );
  return {
    enabled: normalizeBoolean(rawConfig.enabled, false),
    colorTheme: normalizedColorTheme,
    barSize: normalizeStringChoice(rawConfig.barSize, "standard", X01_SCORE_PROGRESS_BAR_SIZES),
    effect: normalizeMappedStringChoice(rawConfig.effect, "pulse-core", {
      "": "pulse-core",
      off: "off",
      "pulse-core": "pulse-core",
      "glass-charge": "glass-charge",
      "segment-drain": "segment-drain",
      "ghost-trail": "ghost-trail",
      "signal-sweep": "signal-sweep",
      "electric-surge": "signal-sweep",
      "pulse-on-change": "pulse-core",
      "charge-release": "pulse-core",
      "sheen-sweep": "glass-charge",
      "checkout-glow": "glass-charge",
      "burn-down": "segment-drain",
      "segment-pop": "segment-drain",
      "spark-trail": "ghost-trail",
      "heat-edge": "signal-sweep",
      "danger-flicker": "signal-sweep",
      "electric-border": "signal-sweep",
      "arc-burst": "signal-sweep",
    }),
    debug: normalizeBoolean(rawConfig.debug, false),
  };
}

function normalizeWinnerFireworksConfig(rawConfig = {}) {
  return {
    enabled: normalizeBoolean(rawConfig.enabled, false),
    style: normalizeStringChoice(rawConfig.style, "realistic", WINNER_FIREWORKS_STYLES),
    colorTheme: normalizeStringChoice(
      rawConfig.colorTheme,
      "autodarts",
      WINNER_FIREWORKS_COLOR_THEMES
    ),
    intensity: normalizeStringChoice(
      rawConfig.intensity,
      "standard",
      WINNER_FIREWORKS_INTENSITIES
    ),
    includeBullOut: normalizeBoolean(rawConfig.includeBullOut, true),
    pointerDismiss: normalizeBoolean(rawConfig.pointerDismiss, true),
    debug: normalizeBoolean(rawConfig.debug, false),
  };
}

function normalizeThemeBackgroundImage(rawValue) {
  const dataUrl = String(rawValue || "").trim();
  if (!dataUrl.startsWith("data:image/")) {
    return "";
  }
  return dataUrl;
}

function normalizeThemeBaseConfig(rawConfig = {}, defaults = {}) {
  return {
    enabled: normalizeBoolean(rawConfig.enabled, false),
    backgroundDisplayMode: normalizeStringChoice(
      rawConfig.backgroundDisplayMode,
      String(defaults.backgroundDisplayMode || "fill"),
      THEME_BACKGROUND_DISPLAY_MODES
    ),
    backgroundOpacity: normalizeNumberChoice(
      rawConfig.backgroundOpacity,
      Number(defaults.backgroundOpacity || 25),
      THEME_BACKGROUND_OPACITY
    ),
    playerFieldTransparency: normalizeNumberChoice(
      rawConfig.playerFieldTransparency,
      Number(defaults.playerFieldTransparency || 10),
      THEME_PLAYER_FIELD_TRANSPARENCY
    ),
    backgroundImageDataUrl: normalizeThemeBackgroundImage(
      rawConfig.backgroundImageDataUrl || defaults.backgroundImageDataUrl || ""
    ),
    debug: normalizeBoolean(rawConfig.debug, Boolean(defaults.debug)),
  };
}

function normalizeThemeX01Config(rawConfig = {}) {
  return {
    ...normalizeThemeBaseConfig(rawConfig, {
      backgroundDisplayMode: "fill",
      backgroundOpacity: 25,
      playerFieldTransparency: 10,
      backgroundImageDataUrl: "",
      debug: false,
    }),
    showAvg: normalizeBoolean(rawConfig.showAvg, true),
  };
}

function normalizeThemeShanghaiConfig(rawConfig = {}) {
  return {
    ...normalizeThemeBaseConfig(rawConfig, {
      backgroundDisplayMode: "fill",
      backgroundOpacity: 25,
      playerFieldTransparency: 10,
      backgroundImageDataUrl: "",
      debug: false,
    }),
    showAvg: normalizeBoolean(rawConfig.showAvg, true),
  };
}

function normalizeThemeBermudaConfig(rawConfig = {}) {
  return normalizeThemeBaseConfig(rawConfig, {
    backgroundDisplayMode: "fill",
    backgroundOpacity: 25,
    playerFieldTransparency: 10,
    backgroundImageDataUrl: "",
    debug: false,
  });
}

function normalizeThemeCricketConfig(rawConfig = {}) {
  return {
    ...normalizeThemeBaseConfig(rawConfig, {
      backgroundDisplayMode: "fill",
      backgroundOpacity: 25,
      playerFieldTransparency: 10,
      backgroundImageDataUrl: "",
      debug: false,
    }),
    showAvg: normalizeBoolean(rawConfig.showAvg, true),
  };
}

function normalizeThemeBullOffConfig(rawConfig = {}) {
  return {
    ...normalizeThemeBaseConfig(rawConfig, {
      backgroundDisplayMode: "fill",
      backgroundOpacity: 25,
      playerFieldTransparency: 10,
      backgroundImageDataUrl: "",
      debug: false,
    }),
    contrastPreset: normalizeStringChoice(
      rawConfig.contrastPreset,
      "standard",
      THEME_CONTRAST_PRESETS
    ),
  };
}

const FEATURE_NORMALIZERS = Object.freeze({
  checkoutScorePulse: normalizeCheckoutScorePulseConfig,
  checkoutBoardTargets: normalizeCheckoutBoardTargetsConfig,
  tvBoardZoom: normalizeTvBoardZoomConfig,
  styleCheckoutSuggestions: normalizeStyleCheckoutSuggestionsConfig,
  averageTrendArrow: normalizeAverageTrendArrowConfig,
  turnStartSweep: normalizeTurnStartSweepConfig,
  tripleDoubleBullHits: normalizeTripleDoubleBullHitsConfig,
  cricketHighlighter: normalizeCricketHighlighterConfig,
  cricketGridFx: normalizeCricketGridFxConfig,
  dartMarkerEmphasis: normalizeDartMarkerEmphasisConfig,
  dartMarkerDarts: normalizeDartMarkerDartsConfig,
  removeDartsNotification: normalizeRemoveDartsNotificationConfig,
  singleBullSound: normalizeSingleBullSoundConfig,
  turnPointsCount: normalizeTurnPointsCountConfig,
  x01ScoreProgress: normalizeX01ScoreProgressConfig,
  winnerFireworks: normalizeWinnerFireworksConfig,
  "themes.x01": normalizeThemeX01Config,
  "themes.shanghai": normalizeThemeShanghaiConfig,
  "themes.bermuda": normalizeThemeBermudaConfig,
  "themes.cricket": normalizeThemeCricketConfig,
  "themes.bullOff": normalizeThemeBullOffConfig,
});

export function createRuntimeConfig(overrides = {}) {
  let rawConfig = deepMerge(defaultConfig, overrides);

  function getRaw() {
    return deepClone(rawConfig);
  }

  function getRawFeatureConfig(featureKey) {
    const pathParts = splitFeaturePath(featureKey);
    if (!pathParts.length) {
      return {};
    }

    const resolvedValue = getNestedValue(rawConfig?.features || {}, pathParts);
    return resolvedValue === null ? {} : resolvedValue;
  }

  function getRawFeatureToggle(featureKey) {
    const normalizedKey = String(featureKey || "").trim();
    if (!normalizedKey) {
      return undefined;
    }

    if (Object.prototype.hasOwnProperty.call(rawConfig?.featureToggles || {}, normalizedKey)) {
      return rawConfig.featureToggles[normalizedKey];
    }

    return getNestedValue(rawConfig?.featureToggles || {}, splitFeaturePath(normalizedKey));
  }

  function getFeatureConfig(featureKey) {
    const normalizedKey = String(featureKey || "").trim();
    const normalizer = FEATURE_NORMALIZERS[normalizedKey];
    const rawFeatureConfig = getRawFeatureConfig(normalizedKey);

    if (typeof normalizer === "function") {
      const mergedFeatureConfig = mergeFeatureConfigWithUnknownFields(
        rawFeatureConfig,
        normalizer(rawFeatureConfig)
      );
      if (normalizedKey === "x01ScoreProgress") {
        delete mergedFeatureConfig.designPreset;
      }
      return mergedFeatureConfig;
    }

    return deepClone(rawFeatureConfig);
  }

  function getNormalized() {
    const featureKeysFromFeatures = collectFeatureKeysFromObject(rawConfig?.features || {});
    const featureKeys = new Set([
      ...Object.keys(FEATURE_NORMALIZERS),
      ...Object.keys(rawConfig?.featureToggles || {}),
      ...featureKeysFromFeatures,
    ]);

    const normalizedFeatureToggles = {};
    const normalizedFeatures = deepClone(rawConfig?.features || {});

    featureKeys.forEach((featureKey) => {
      const normalizedFeatureConfig = getFeatureConfig(featureKey);
      setNestedValue(normalizedFeatures, splitFeaturePath(featureKey), normalizedFeatureConfig);

      const rawToggleValue = getRawFeatureToggle(featureKey);
      if (typeof rawToggleValue !== "undefined") {
        normalizedFeatureToggles[featureKey] = normalizeBoolean(
          rawToggleValue,
          normalizedFeatureConfig.enabled
        );
        return;
      }

      normalizedFeatureToggles[featureKey] = normalizeBoolean(
        normalizedFeatureConfig.enabled,
        false
      );
    });

    return {
      ...getRaw(),
      featureToggles: normalizedFeatureToggles,
      features: normalizedFeatures,
    };
  }

  function isFeatureEnabled(featureKey) {
    const normalizedKey = String(featureKey || "").trim();
    const featureConfig = getFeatureConfig(normalizedKey);
    const toggleValue = getRawFeatureToggle(normalizedKey);

    if (typeof toggleValue !== "undefined") {
      return normalizeBoolean(toggleValue, featureConfig.enabled);
    }

    return normalizeBoolean(featureConfig.enabled, false);
  }

  function setFeatureEnabled(featureKey, enabled) {
    const normalizedKey = String(featureKey || "").trim();
    if (!normalizedKey) {
      return;
    }

    if (!rawConfig.featureToggles || typeof rawConfig.featureToggles !== "object") {
      rawConfig.featureToggles = {};
    }

    const normalizedEnabled = normalizeBoolean(enabled, false);
    rawConfig.featureToggles[normalizedKey] = normalizedEnabled;

    if (!rawConfig.features || typeof rawConfig.features !== "object") {
      rawConfig.features = {};
    }

    const featurePath = splitFeaturePath(normalizedKey);
    const currentFeatureConfig = getRawFeatureConfig(normalizedKey);
    setNestedValue(rawConfig.features, featurePath, {
      ...(currentFeatureConfig && typeof currentFeatureConfig === "object" ? currentFeatureConfig : {}),
      enabled: normalizedEnabled,
    });
  }

  function update(partialConfig = {}) {
    rawConfig = deepMerge(rawConfig, partialConfig);
    return getRaw();
  }

  return {
    getRaw,
    getNormalized,
    getFeatureConfig,
    isFeatureEnabled,
    setFeatureEnabled,
    update,
  };
}

export function normalizeRuntimeConfig(overrides = {}) {
  return createRuntimeConfig(overrides).getNormalized();
}
