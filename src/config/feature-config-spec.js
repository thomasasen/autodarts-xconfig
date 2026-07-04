import { setNestedValue, splitFeaturePath } from "./feature-path-utils.js";
import { featureCatalog } from "../shared/feature-catalog.js";
import {
  THEME_GLOBAL_TYPOGRAPHY_FONT_PRESETS,
  THEME_GLOBAL_TYPOGRAPHY_SCOPE_OPTIONS,
  getThemeGlobalTypographyScopeValues,
} from "../shared/theme-global-typography-presets.js";
import { THEME_PRESET_ASSET_KEYS } from "../shared/theme-preset-assets.manifest.js";
import { normalizeThemeBackgroundHost } from "../shared/theme-background-host-utils.js";
import { normalizeHexColor } from "../shared/hex-color-utils.js";
import { normalizeThemeKey } from "../shared/theme-key-utils.js";
import { DART_DESIGN_KEYS } from "../shared/feature-assets.manifest.js";

const CHECKOUT_EFFECT_ALIASES = Object.freeze({
  "": "grow-only",
  pulse: "grow-glow",
  "grow-glow": "grow-glow",
  glow: "glow-only",
  "glow-only": "glow-only",
  scale: "grow-only",
  "grow-only": "grow-only",
  blink: "fade-blink",
  "fade-blink": "fade-blink",
});
const CHECKOUT_INTENSITIES = new Set(["dezent", "standard", "stark"]);
const CHECKOUT_TRIGGER_SOURCES = new Set(["suggestion-first", "score-only", "suggestion-only"]);
const BOARD_TARGET_VISUAL_PRESET_ALIASES = Object.freeze({
  "": "soft-pulse",
  focus: "soft-pulse",
  "soft-pulse": "soft-pulse",
  signal: "fast-blink",
  "fast-blink": "fast-blink",
  steady: "slow-glow",
  "slow-glow": "slow-glow",
});
const BOARD_TARGET_SEGMENT_STYLES = new Set(["surface-outline", "surface-only"]);
const BOARD_TARGET_SELECTION_MODES = new Set(["next", "all", "finish"]);
const BOARD_TARGET_THEMES = new Set(["violet", "cyan", "amber", "lime", "rose", "white"]);
const TV_ZOOM_LEVELS = new Set([2.35, 2.75, 3.15]);
const TV_ZOOM_SPEEDS = new Set(["schnell", "mittel", "langsam"]);
const TV_ZOOM_TARGETS = new Set(["finish-only", "route-first"]);
const SUGGESTION_STYLES = new Set(["badge", "ribbon", "stripe", "ticket", "outline"]);
const SUGGESTION_COLOR_THEMES = new Set(["amber", "cyan", "rose"]);
const AVG_TREND_DURATIONS = new Set([220, 320, 500]);
const ACTIVE_PLAYER_SWEEP_DURATIONS = new Set([300, 420, 620]);
const ACTIVE_PLAYER_SWEEP_STYLES = new Set(["subtle", "standard", "strong"]);
const SPECIAL_HIT_COLOR_THEMES = new Set(["kind-signal", "ember-rush", "ice-circuit", "volt-lime", "crimson-steel", "arctic-mint", "champagne-night"]);
const SPECIAL_HIT_ANIMATION_STYLE_ALIASES = Object.freeze({
  "": "pop-hit",
  "impact-pop": "pop-hit",
  "charge-release": "pop-hit",
  "snap-bounce": "side-shake",
  "alternate-flick": "side-shake",
  "neon-pulse": "glow-pop",
  "sweep-shine": "light-sweep",
  "outline-trace": "light-sweep",
  "card-slam": "flip-spin",
  "flip-edge": "flip-spin",
  "signal-blink": "side-shake",
  "stagger-wave": "pop-hit",
  emphasis: "pop-hit",
  "pop-hit": "pop-hit",
  shake: "side-shake",
  "side-shake": "side-shake",
  pulse: "glow-pop",
  "glow-pop": "glow-pop",
  turn: "flip-spin",
  "flip-spin": "flip-spin",
  sheen: "light-sweep",
  "light-sweep": "light-sweep",
  "shockwave-ring": "shockwave-ring",
  shockwave: "shockwave-ring",
  "electric-jolt": "electric-jolt",
  "electric-arc": "electric-jolt",
});
const CRICKET_HIGHLIGHT_THEMES = new Set(["standard", "high-contrast"]);
const CRICKET_HIGHLIGHT_INTENSITIES = new Set(["subtle", "normal", "strong"]);
const CRICKET_HIGHLIGHT_IRRELEVANT_DIM_STYLES = new Set(["off", "smoke", "hatch", "mask"]);
const DARTBOARD_MARKER_HIGHLIGHT_SIZES = new Set([4, 6, 9]);
const DARTBOARD_MARKER_HIGHLIGHT_COLORS = new Set(["rgb(49, 130, 206)", "rgb(34, 197, 94)", "rgb(248, 113, 113)", "rgb(250, 204, 21)", "rgb(255, 255, 255)"]);
const DARTBOARD_MARKER_HIGHLIGHT_EFFECT_ALIASES = Object.freeze({
  "": "soft-glow",
  glow: "soft-glow",
  "soft-glow": "soft-glow",
  pulse: "size-pulse",
  "size-pulse": "size-pulse",
  none: "none",
});
const DARTBOARD_MARKER_HIGHLIGHT_OPACITY = new Set([65, 85, 100]);
const DARTBOARD_MARKER_HIGHLIGHT_OUTLINE = new Set(["aus", "weiss", "schwarz"]);
const DART_MARKER_DARTS_DESIGNS = new Set(DART_DESIGN_KEYS);
const DART_MARKER_DARTS_SIZE_PERCENT = new Set([108, 120, 138]);
const DART_MARKER_DARTS_LEGACY_SIZE_PERCENT = Object.freeze({
  90: 108,
  100: 120,
  115: 138,
});
const DART_MARKER_DARTS_FLIGHT_SPEED = new Set(["schnell", "standard", "cinematic"]);
const DART_MARKER_IMPACT_STYLES = new Set(["classic", "natural", "dramatic"]);
const REMOVE_DARTS_NOTIFICATION_IMAGE_SIZE = new Set(["compact", "standard", "large"]);
const REMOVE_DARTS_NOTIFICATION_PULSE_SCALE = new Set([1.02, 1.04, 1.08]);
const SINGLE_BULL_SOUND_VOLUME = new Set([0.5, 0.75, 0.9, 1]);
const SINGLE_BULL_SOUND_COOLDOWN = new Set([400, 700, 1000]);
const SINGLE_BULL_SOUND_POLL_INTERVAL = new Set([0, 1200]);
const TURN_SCORE_COUNT_DURATIONS = new Set([1000, 3000, 5000]);
const TURN_SCORE_COUNT_EFFECT_ALIASES = Object.freeze({
  "": "smooth-count",
  countup: "smooth-count",
  "smooth-count": "smooth-count",
  odometer: "rolling-digits",
  "rolling-digits": "rolling-digits",
  steps: "step-count",
  "step-count": "step-count",
});
const X01_REMAINING_SCORE_BAR_COLOR_THEMES = new Set(["checkout-focus", "traffic-light", "danger-endgame", "gradient-by-progress", "autodarts", "signal-lime", "glass-mint", "ember-rush", "ice-circuit", "neon-violet", "sunset-amber", "monochrome-steel"]);
const X01_REMAINING_SCORE_BAR_BAR_SIZES = new Set(["schmal", "standard", "breit", "extrabreit"]);
const WINNER_CELEBRATION_STYLE_ALIASES = Object.freeze({
  "": "center-side-burst",
  realistic: "center-side-burst",
  "center-side-burst": "center-side-burst",
  fireworks: "top-fireworks",
  "top-fireworks": "top-fireworks",
  cannon: "center-cannon",
  "center-cannon": "center-cannon",
  victorystorm: "triple-burst",
  "triple-burst": "triple-burst",
  stars: "star-burst",
  "star-burst": "star-burst",
  sides: "side-cannons",
  "side-cannons": "side-cannons",
});
const WINNER_FIREWORKS_COLOR_THEMES = new Set(["autodarts", "redwhite", "ice", "sunset", "neon", "gold"]);
const WINNER_FIREWORKS_INTENSITIES = new Set(["dezent", "standard", "stark"]);
const WINNER_FIREWORKS_DURATION_SECONDS = new Set([1, 2, 5]);
const WINNER_FIREWORKS_PARTICLE_AMOUNTS = new Set(["sparsam", "optimiert", "voll"]);
const THEME_BACKGROUND_DISPLAY_MODES = new Set(["fill", "fit", "stretch", "center", "tile"]);
const THEME_BACKGROUND_OPACITY = new Set([100, 85, 70, 55, 40, 25, 10]);
const THEME_PLAYER_FIELD_TRANSPARENCY = new Set([0, 5, 10, 15, 30, 45, 60]);
const THEME_ACTIVE_PLAYER_TINT_INTENSITY = new Set([0, 10, 15, 20, 25, 30]);
const THEME_GOTCHA_DELTA_PLACEMENTS = new Set(["below", "inline-divider"]);
const THEME_GOTCHA_DELTA_ALIGNMENTS = new Set(["left", "right"]);
const THEME_CONTRAST_PRESETS = new Set(["soft", "standard", "high"]);
const THEME_GLOBAL_TYPOGRAPHY_FONT_PRESET_KEYS = new Set(
  THEME_GLOBAL_TYPOGRAPHY_FONT_PRESETS.map((preset) => preset.value)
);
const THEME_PRESET_ASSET_KEY_SET = new Set(THEME_PRESET_ASSET_KEYS);
const THEME_GLOBAL_TYPOGRAPHY_SCOPE_KEYS = new Set(
  THEME_GLOBAL_TYPOGRAPHY_SCOPE_OPTIONS.map((option) => option.value)
);
const THEME_GLOBAL_TURN_DART_STYLES = new Set(["original", "solid", "gradient", "image"]);
const THEME_GLOBAL_TURN_DART_SIZE_PERCENT = new Set([100, 115, 135]);
const THEME_GLOBAL_TURN_DART_TEXT_MAX_LENGTH = 48;
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

function normalizeStringChoiceArray(value, fallbackValues, allowedSet, legacyNormalizer = null) {
  const rawValues = Array.isArray(value) ? value : [value];
  const normalizedValues = rawValues.flatMap((entry) => {
    const normalized = String(entry || "").trim().toLowerCase();
    if (!normalized) {
      return [];
    }
    if (allowedSet.has(normalized)) {
      return [normalized];
    }
    if (typeof legacyNormalizer === "function") {
      return legacyNormalizer(normalized).filter((candidate) => allowedSet.has(candidate));
    }
    return [];
  });
  const uniqueValues = Array.from(new Set(normalizedValues));
  return uniqueValues.length ? uniqueValues : [...fallbackValues];
}

function normalizeMappedStringChoice(value, fallbackValue, aliasMap) {
  if (value === undefined || value === null) {
    return fallbackValue;
  }
  const normalized = String(value || "").trim().toLowerCase();
  return Object.hasOwn(aliasMap, normalized)
    ? aliasMap[normalized]
    : fallbackValue;
}

function normalizeNumberChoice(value, fallbackValue, allowedSet) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && allowedSet.has(numeric) ? numeric : fallbackValue;
}

function normalizeLimitedText(value, maxLength = 80) {
  const normalized = String(value || "").replaceAll(/[\r\n\t]+/g, " ").trim();
  return normalized.slice(0, Math.max(0, Number(maxLength) || 0));
}

function normalizeDartMarkerReplacerSizePercent(value) {
  const numeric = Number(value);
  if (Object.hasOwn(DART_MARKER_DARTS_LEGACY_SIZE_PERCENT, numeric)) {
    return DART_MARKER_DARTS_LEGACY_SIZE_PERCENT[numeric];
  }
  return normalizeNumberChoice(value, 120, DART_MARKER_DARTS_SIZE_PERCENT);
}

function normalizeTurnScoreCounterDuration(value) {
  const numeric = Number(value);
  if (numeric === 260 || numeric === 416 || numeric === 650 || numeric === 950 || numeric === 1300) {
    return 1000;
  }
  if (numeric === 1500 || numeric === 2000) {
    return 3000;
  }
  if (numeric === 1400 || numeric === 2250) {
    return 5000;
  }
  return normalizeNumberChoice(value, 3000, TURN_SCORE_COUNT_DURATIONS);
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

function normalizeThemeBackgroundAssetKey(rawValue) {
  const normalized = String(rawValue || "").trim().toLowerCase();
  return THEME_PRESET_ASSET_KEY_SET.has(normalized) ? normalized : "";
}

function normalizeLegacyColorTheme(value, fallbackValue) {
  const rawValue = String(value || "").trim();
  if (!rawValue) {
    return fallbackValue;
  }

  const compact = rawValue.replaceAll(/\s+/g, "");
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
  if (
    explicitPreset === "soft-pulse" &&
    (legacyEffect === "blink" || legacyEffect === "glow")
  ) {
    return legacyEffect === "blink" ? "fast-blink" : "slow-glow";
  }
  if (explicitPreset && Object.hasOwn(BOARD_TARGET_VISUAL_PRESET_ALIASES, explicitPreset)) {
    if (explicitPreset !== "focus" || (legacyEffect !== "blink" && legacyEffect !== "glow")) {
      return BOARD_TARGET_VISUAL_PRESET_ALIASES[explicitPreset];
    }
  }

  if (legacyEffect === "blink") {
    return "fast-blink";
  }
  if (legacyEffect === "glow") {
    return "slow-glow";
  }
  return "soft-pulse";
}

function getLegacyFeatureSettings(legacyFeatureState) {
  if (!legacyFeatureState?.settings || typeof legacyFeatureState.settings !== "object") {
    return {};
  }

  return legacyFeatureState.settings;
}

function readLegacySetting(settings, shortKey, fallbackValue) {
  if (Object.hasOwn(settings, shortKey)) {
    return settings[shortKey];
  }

  const prefixedKey = `xConfig_${shortKey}`;
  if (Object.hasOwn(settings, prefixedKey)) {
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

const DEFAULT_THEME_GLOBAL_TURN_DART_CONFIG = Object.freeze({
  turnDartStyle: "original",
  turnDartTextTemplate: "",
  turnDartColor: "#FFFFFF",
  turnDartGradientColor: "#F97316",
  turnDartSizePercent: 115,
  turnDartImageDataUrl: "",
});

const DEFAULT_FEATURE_CONFIGS = Object.freeze({
  checkoutScoreHighlight: { enabled: true, effect: "grow-only", colorTheme: "159, 219, 88", intensity: "standard", triggerSource: "suggestion-first", debug: false },
  checkoutTargetHighlights: { enabled: false, visualPreset: "soft-pulse", segmentStyle: "surface-outline", singleRing: "both", targetSelectionMode: "next", colorTheme: "amber", debug: false },
  tvBoardZoom: { enabled: false, zoomLevel: 2.75, zoomSpeed: "mittel", checkoutZoomEnabled: true, checkoutZoomTarget: "finish-only", t20SetupZoomEnabled: true, debug: false },
  checkoutSuggestionStyles: { enabled: false, style: "ribbon", labelText: "CHECKOUT", colorTheme: "amber", debug: false },
  x01BustActivePlayerHighlight: { enabled: true, crackCount: 2, shakeEnabled: false, soundEnabled: true, debug: false },
  avgTrendArrow: { enabled: false, durationMs: 320, size: "standard", debug: false },
  activePlayerSweep: { enabled: false, durationMs: 420, sweepStyle: "standard", debug: false },
  specialHitHighlights: { enabled: false, colorTheme: "kind-signal", animationStyle: "pop-hit", debug: false },
  cricketTargetHighlighter: { enabled: false, showOpenObjectives: false, showDeadObjectives: true, irrelevantBoardDimStyle: "smoke", colorTheme: "standard", intensity: "normal", debug: false },
  cricketGridStatusEffects: { enabled: false, rowWave: true, badgeBeacon: true, markProgress: true, pressureEdge: true, scoringStripe: true, deadRowMuted: true, deltaChips: true, hitSpark: true, roundTransitionWipe: true, pressureOverlay: true, colorTheme: "standard", intensity: "normal", debug: false },
  dartboardMarkerHighlight: { enabled: false, size: 6, color: "rgb(49, 130, 206)", effect: "soft-glow", opacityPercent: 85, outline: "aus", debug: false },
  dartMarkerReplacer: { enabled: false, design: "autodarts", animateDarts: true, sizePercent: 120, hideOriginalMarkers: false, impactStyle: "classic", enableShadow: true, enableShadowBlur: true, enableWobble: true, enableFlightBlur: true, flightSpeed: "standard", debug: false },
  takeOutDartsAlert: { enabled: false, imageSize: "standard", pulseAnimation: true, pulseScale: 1.04, debug: false },
  singleBullHitSound: { enabled: false, volume: 0.9, cooldownMs: 700, pollIntervalMs: 0, debug: false },
  turnScoreCounter: { enabled: false, durationMs: 3000, countEffect: "smooth-count", flashOnChange: true, flashMode: "on-change", debug: false },
  winnerCelebrationEffect: { enabled: false, style: "center-side-burst", colorTheme: "autodarts", intensity: "standard", durationSeconds: 5, particleAmount: "optimiert", includeBullOut: true, pointerDismiss: true, debug: false },
  x01RemainingScoreBar: { enabled: false, colorTheme: "checkout-focus", barSize: "standard", effect: "bar-pulse", debug: false },
  "themes.globalTypography": {
    enabled: false,
    fontPreset: "system",
    applyTo: ["scores"],
    accentColor: "",
    scoreColor: "",
    secondaryTextColor: "",
    throwLabelColor: "",
    activePlayerTintIntensity: 15,
    backgroundDisplayMode: "fill",
    backgroundOpacity: 25,
    playerFieldTransparency: 10,
    backgroundImageDataUrl: "",
    backgroundAssetKey: "",
    ...DEFAULT_THEME_GLOBAL_TURN_DART_CONFIG,
    debug: false,
  },
  "themes.x01": { enabled: false, showAvg: true, backgroundDisplayMode: "fill", backgroundOpacity: 25, playerFieldTransparency: 10, backgroundImageDataUrl: "", debug: false },
  "themes.gotcha": {
    enabled: false,
    backgroundDisplayMode: "fill",
    backgroundOpacity: 25,
    playerFieldTransparency: 10,
    deltaPlacement: "below",
    deltaAlignment: "right",
    deltaItalic: true,
    backgroundImageDataUrl: "",
    debug: false,
  },
  "themes.x01TwoPlayer": { enabled: false, showAvg: true, backgroundDisplayMode: "fill", backgroundOpacity: 25, playerFieldTransparency: 10, backgroundImageDataUrl: "", debug: false },
  "themes.shanghai": { enabled: false, showAvg: true, backgroundDisplayMode: "fill", backgroundOpacity: 25, playerFieldTransparency: 10, backgroundImageDataUrl: "", debug: false },
  "themes.bermuda": { enabled: false, backgroundDisplayMode: "fill", backgroundOpacity: 25, playerFieldTransparency: 10, backgroundImageDataUrl: "", debug: false },
  "themes.cricket": { enabled: false, showAvg: true, backgroundDisplayMode: "fill", backgroundOpacity: 25, playerFieldTransparency: 10, backgroundImageDataUrl: "", debug: false },
  "themes.bullOff": { enabled: false, contrastPreset: "standard", backgroundDisplayMode: "fill", backgroundOpacity: 25, playerFieldTransparency: 10, backgroundImageDataUrl: "", debug: false },
});

const RECOMMENDED_FEATURE_CONFIGS = Object.freeze({
  checkoutScoreHighlight: { effect: "grow-only", colorTheme: "159, 219, 88", intensity: "standard", triggerSource: "suggestion-first" },
  checkoutTargetHighlights: { visualPreset: "fast-blink", segmentStyle: "surface-only", singleRing: "both", targetSelectionMode: "next", colorTheme: "cyan" },
  tvBoardZoom: { zoomLevel: 2.75, zoomSpeed: "mittel", checkoutZoomEnabled: true, checkoutZoomTarget: "finish-only", t20SetupZoomEnabled: true },
  checkoutSuggestionStyles: { style: "stripe", labelText: "CHECKOUT", colorTheme: "amber" },
  x01BustActivePlayerHighlight: { crackCount: 2, shakeEnabled: false, soundEnabled: true },
  avgTrendArrow: { durationMs: 320, size: "standard" },
  activePlayerSweep: { durationMs: 420, sweepStyle: "standard" },
  specialHitHighlights: { colorTheme: "kind-signal", animationStyle: "electric-jolt" },
  cricketTargetHighlighter: { showOpenObjectives: false, showDeadObjectives: true, irrelevantBoardDimStyle: "hatch", colorTheme: "standard", intensity: "normal" },
  cricketGridStatusEffects: { rowWave: true, badgeBeacon: true, markProgress: true, pressureEdge: true, scoringStripe: true, deadRowMuted: true, deltaChips: true, hitSpark: true, roundTransitionWipe: true, pressureOverlay: true, colorTheme: "standard", intensity: "normal" },
  dartboardMarkerHighlight: { size: 6, color: "rgb(49, 130, 206)", effect: "size-pulse", opacityPercent: 100, outline: "weiss" },
  dartMarkerReplacer: { design: "autodarts", animateDarts: true, sizePercent: 120, hideOriginalMarkers: true, impactStyle: "natural", enableShadow: true, enableShadowBlur: true, enableWobble: true, enableFlightBlur: true, flightSpeed: "standard" },
  takeOutDartsAlert: { imageSize: "large", pulseAnimation: true, pulseScale: 1.04 },
  singleBullHitSound: { volume: 0.9, cooldownMs: 700, pollIntervalMs: 0 },
  turnScoreCounter: { durationMs: 3000, countEffect: "smooth-count", flashOnChange: false, flashMode: "on-change" },
  winnerCelebrationEffect: { style: "top-fireworks", colorTheme: "autodarts", intensity: "standard", durationSeconds: 5, particleAmount: "optimiert", includeBullOut: true, pointerDismiss: true },
  x01RemainingScoreBar: { colorTheme: "checkout-focus", barSize: "breit", effect: "off" },
  "themes.globalTypography": {
    enabled: false,
    fontPreset: "system",
    applyTo: ["scores"],
    accentColor: "",
    scoreColor: "",
    secondaryTextColor: "",
    throwLabelColor: "",
    activePlayerTintIntensity: 15,
    backgroundDisplayMode: "fill",
    backgroundOpacity: 25,
    playerFieldTransparency: 10,
    ...DEFAULT_THEME_GLOBAL_TURN_DART_CONFIG,
  },
  "themes.x01": { showAvg: true, backgroundDisplayMode: "fill", backgroundOpacity: 25, playerFieldTransparency: 10 },
  "themes.gotcha": {
    backgroundDisplayMode: "fill",
    backgroundOpacity: 25,
    playerFieldTransparency: 10,
    deltaPlacement: "below",
    deltaAlignment: "right",
    deltaItalic: true,
  },
  "themes.x01TwoPlayer": { enabled: false, showAvg: true, backgroundDisplayMode: "fill", backgroundOpacity: 25, playerFieldTransparency: 10 },
  "themes.shanghai": { showAvg: true, backgroundDisplayMode: "fill", backgroundOpacity: 25, playerFieldTransparency: 10 },
  "themes.bermuda": { backgroundDisplayMode: "fill", backgroundOpacity: 25, playerFieldTransparency: 10 },
  "themes.cricket": { showAvg: true, backgroundDisplayMode: "fill", backgroundOpacity: 25, playerFieldTransparency: 10 },
  "themes.bullOff": { contrastPreset: "standard", backgroundDisplayMode: "fill", backgroundOpacity: 25, playerFieldTransparency: 10 },
});

const FEATURE_REMOVE_KEYS = Object.freeze({
  x01RemainingScoreBar: Object.freeze(["designPreset"]),
});

const LEGACY_IMPORTERS = Object.freeze({
  checkoutScoreHighlight(legacyFeatureState) {
    const settings = getLegacyFeatureSettings(legacyFeatureState);
    return buildFeatureImport("checkoutScoreHighlight", legacyFeatureState, {
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
  checkoutTargetHighlights(legacyFeatureState) {
    const settings = getLegacyFeatureSettings(legacyFeatureState);
    return buildFeatureImport("checkoutTargetHighlights", legacyFeatureState, {
      visualPreset: resolveLegacyBoardTargetVisualPreset({
        visualPreset: readLegacySetting(settings, "VISUAL_PRESET", ""),
        effect: readLegacySetting(settings, "EFFEKT", "pulse"),
        outlineIntensity: readLegacySetting(settings, "KONTUR_INTENSITAET", "standard"),
      }),
      segmentStyle: "surface-outline",
      singleRing: "both",
      targetSelectionMode: readLegacySetting(settings, "ZIELAUSWAHL", "next"),
      colorTheme: readLegacySetting(settings, "FARBTHEMA", "amber"),
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
  checkoutSuggestionStyles(legacyFeatureState) {
    const settings = getLegacyFeatureSettings(legacyFeatureState);
    return buildFeatureImport("checkoutSuggestionStyles", legacyFeatureState, {
      style: readLegacySetting(settings, "STIL", "ribbon"),
      labelText: readLegacySetting(settings, "LABELTEXT", "CHECKOUT"),
      colorTheme: readLegacySetting(settings, "FARBTHEMA", "amber"),
      debug: readLegacySetting(settings, "DEBUG", false),
    });
  },
  avgTrendArrow(legacyFeatureState) {
    const settings = getLegacyFeatureSettings(legacyFeatureState);
    return buildFeatureImport("avgTrendArrow", legacyFeatureState, {
      durationMs: readLegacySetting(settings, "ANIMATIONSDAUER_MS", 320),
      size: readLegacySetting(settings, "PFEIL_GROESSE", "standard"),
      debug: readLegacySetting(settings, "DEBUG", false),
    });
  },
  activePlayerSweep(legacyFeatureState) {
    const settings = getLegacyFeatureSettings(legacyFeatureState);
    return buildFeatureImport("activePlayerSweep", legacyFeatureState, {
      durationMs: readLegacySetting(settings, "SWEEP_GESCHWINDIGKEIT_MS", 420),
      sweepStyle: readLegacySetting(settings, "SWEEP_STIL", "standard"),
      debug: readLegacySetting(settings, "DEBUG", false),
    });
  },
  specialHitHighlights(legacyFeatureState) {
    const settings = getLegacyFeatureSettings(legacyFeatureState);
    return buildFeatureImport("specialHitHighlights", legacyFeatureState, {
      colorTheme: "champagne-night",
      animationStyle: "emphasis",
      debug: readLegacySetting(settings, "DEBUG", false),
    });
  },
  cricketTargetHighlighter(legacyFeatureState) {
    const settings = getLegacyFeatureSettings(legacyFeatureState);
    const legacyDimIrrelevantBoardTargets = readLegacySetting(
      settings,
      "IRRELEVANTE_FELDER_ABDUNKELN",
      true
    );
    return buildFeatureImport("cricketTargetHighlighter", legacyFeatureState, {
      showOpenObjectives: readLegacySetting(settings, "OPEN_ZIELE_ANZEIGEN", false),
      showDeadObjectives: readLegacySetting(settings, "DEAD_ZIELE_ANZEIGEN", true),
      irrelevantBoardDimStyle: legacyDimIrrelevantBoardTargets === false ? "off" : "smoke",
      dimIrrelevantBoardTargets: legacyDimIrrelevantBoardTargets !== false,
      colorTheme: readLegacySetting(settings, "FARBTHEMA", "standard"),
      intensity: readLegacySetting(settings, "INTENSITAET", "normal"),
      debug: readLegacySetting(settings, "DEBUG", false),
    });
  },
  cricketGridStatusEffects(legacyFeatureState) {
    const settings = getLegacyFeatureSettings(legacyFeatureState);
    return buildFeatureImport("cricketGridStatusEffects", legacyFeatureState, {
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
  dartboardMarkerHighlight(legacyFeatureState) {
    const settings = getLegacyFeatureSettings(legacyFeatureState);
    return buildFeatureImport("dartboardMarkerHighlight", legacyFeatureState, {
      size: readLegacySetting(settings, "MARKER_GROESSE", 6),
      color: readLegacySetting(settings, "MARKER_FARBE", "rgb(49, 130, 206)"),
      effect: readLegacySetting(settings, "EFFEKT", "glow"),
      opacityPercent: readLegacySetting(settings, "MARKER_OPAZITAET", 85),
      outline: readLegacySetting(settings, "OUTLINE", "aus"),
      debug: readLegacySetting(settings, "DEBUG", false),
    });
  },
  dartMarkerReplacer(legacyFeatureState) {
    const settings = getLegacyFeatureSettings(legacyFeatureState);
    return buildFeatureImport("dartMarkerReplacer", legacyFeatureState, {
      design: normalizeLegacyDartDesign(
        readLegacySetting(settings, "DART_DESIGN", "Dart_autodarts.png"),
        "autodarts"
      ),
      animateDarts: readLegacySetting(settings, "ANIMATE_DARTS", true),
      sizePercent: readLegacySetting(settings, "DART_GROESSE", 120),
      hideOriginalMarkers: readLegacySetting(settings, "ORIGINAL_MARKER_AUSBLENDEN", false),
      impactStyle: "classic",
      enableShadow: readLegacySetting(settings, "SCHATTEN_AKTIV", true),
      enableShadowBlur: true,
      enableWobble: readLegacySetting(settings, "WOBBLE_AKTIV", true),
      enableFlightBlur: true,
      flightSpeed: readLegacySetting(settings, "FLUGGESCHWINDIGKEIT", "standard"),
      debug: readLegacySetting(settings, "DEBUG", false),
    });
  },
  takeOutDartsAlert(legacyFeatureState) {
    const settings = getLegacyFeatureSettings(legacyFeatureState);
    return buildFeatureImport("takeOutDartsAlert", legacyFeatureState, {
      imageSize: readLegacySetting(settings, "BILDGROESSE", "standard"),
      pulseAnimation: readLegacySetting(settings, "PULSE_ANIMATION", true),
      pulseScale: readLegacySetting(settings, "PULSE_STAERKE", 1.04),
      debug: readLegacySetting(settings, "DEBUG", false),
    });
  },
  singleBullHitSound(legacyFeatureState) {
    const settings = getLegacyFeatureSettings(legacyFeatureState);
    return buildFeatureImport("singleBullHitSound", legacyFeatureState, {
      volume: readLegacySetting(settings, "LAUTSTAERKE", 0.9),
      cooldownMs: readLegacySetting(settings, "WIEDERHOLSPERRE_MS", 700),
      pollIntervalMs: readLegacySetting(settings, "FALLBACK_SCAN_MS", 0),
      debug: readLegacySetting(settings, "DEBUG", false),
    });
  },
  turnScoreCounter(legacyFeatureState) {
    const settings = getLegacyFeatureSettings(legacyFeatureState);
    return buildFeatureImport("turnScoreCounter", legacyFeatureState, {
      durationMs: readLegacySetting(settings, "ANIMATIONSDAUER_MS", 1500),
      flashOnChange: readLegacySetting(settings, "AUFBLITZEN_AKTIV", true),
      debug: readLegacySetting(settings, "DEBUG", false),
    });
  },
  winnerCelebrationEffect(legacyFeatureState) {
    const settings = getLegacyFeatureSettings(legacyFeatureState);
    return buildFeatureImport("winnerCelebrationEffect", legacyFeatureState, {
      style: readLegacySetting(settings, "STYLE", "realistic"),
      colorTheme: readLegacySetting(settings, "FARBE", "autodarts"),
      intensity: readLegacySetting(settings, "INTENSITAET", "standard"),
      durationSeconds: readLegacySetting(settings, "DAUER_SEKUNDEN", 5),
      particleAmount: readLegacySetting(settings, "PARTIKELANZAHL", "optimiert"),
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
  checkoutScoreHighlight(rawConfig = {}) {
    return { enabled: normalizeBoolean(rawConfig.enabled, true), effect: normalizeMappedStringChoice(rawConfig.effect, "grow-only", CHECKOUT_EFFECT_ALIASES), colorTheme: normalizeLegacyColorTheme(rawConfig.colorTheme, "159, 219, 88"), intensity: normalizeStringChoice(rawConfig.intensity, "standard", CHECKOUT_INTENSITIES), triggerSource: normalizeStringChoice(rawConfig.triggerSource, "suggestion-first", CHECKOUT_TRIGGER_SOURCES), debug: normalizeBoolean(rawConfig.debug, false) };
  },
  checkoutTargetHighlights(rawConfig = {}) {
    return { enabled: normalizeBoolean(rawConfig.enabled, false), visualPreset: normalizeMappedStringChoice(resolveLegacyBoardTargetVisualPreset(rawConfig), "soft-pulse", BOARD_TARGET_VISUAL_PRESET_ALIASES), segmentStyle: normalizeStringChoice(rawConfig.segmentStyle, "surface-outline", BOARD_TARGET_SEGMENT_STYLES), singleRing: "both", targetSelectionMode: normalizeStringChoice(rawConfig.targetSelectionMode, "next", BOARD_TARGET_SELECTION_MODES), colorTheme: normalizeStringChoice(rawConfig.colorTheme, "amber", BOARD_TARGET_THEMES), debug: normalizeBoolean(rawConfig.debug, false) };
  },
  tvBoardZoom(rawConfig = {}) {
    return { enabled: normalizeBoolean(rawConfig.enabled, false), zoomLevel: normalizeNumberChoice(rawConfig.zoomLevel, 2.75, TV_ZOOM_LEVELS), zoomSpeed: normalizeStringChoice(rawConfig.zoomSpeed, "mittel", TV_ZOOM_SPEEDS), checkoutZoomEnabled: normalizeBoolean(rawConfig.checkoutZoomEnabled, true), checkoutZoomTarget: normalizeStringChoice(rawConfig.checkoutZoomTarget, "finish-only", TV_ZOOM_TARGETS), t20SetupZoomEnabled: normalizeBoolean(rawConfig.t20SetupZoomEnabled, true), debug: normalizeBoolean(rawConfig.debug, false) };
  },
  checkoutSuggestionStyles(rawConfig = {}) {
    return { enabled: normalizeBoolean(rawConfig.enabled, false), style: normalizeStringChoice(rawConfig.style, "ribbon", SUGGESTION_STYLES), labelText: normalizeMappedStringChoice(rawConfig.labelText, "CHECKOUT", { "": "", checkout: "CHECKOUT", finish: "FINISH" }), colorTheme: normalizeStringChoice(rawConfig.colorTheme, "amber", SUGGESTION_COLOR_THEMES), debug: normalizeBoolean(rawConfig.debug, false) };
  },
  x01BustActivePlayerHighlight(rawConfig = {}) {
    return { enabled: normalizeBoolean(rawConfig.enabled, true), crackCount: normalizeNumberChoice(rawConfig.crackCount, 2, new Set([0, 1, 2, 3])), shakeEnabled: normalizeBoolean(rawConfig.shakeEnabled, false), soundEnabled: normalizeBoolean(rawConfig.soundEnabled, true), debug: normalizeBoolean(rawConfig.debug, false) };
  },
  avgTrendArrow(rawConfig = {}) {
    return { enabled: normalizeBoolean(rawConfig.enabled, false), durationMs: normalizeNumberChoice(rawConfig.durationMs, 320, AVG_TREND_DURATIONS), size: normalizeMappedStringChoice(rawConfig.size, "standard", { klein: "klein", small: "klein", standard: "standard", gross: "gross", ["gro" + "\u00df"]: "gross", big: "gross", large: "gross" }), debug: normalizeBoolean(rawConfig.debug, false) };
  },
  activePlayerSweep(rawConfig = {}) {
    return { enabled: normalizeBoolean(rawConfig.enabled, false), durationMs: normalizeNumberChoice(rawConfig.durationMs, 420, ACTIVE_PLAYER_SWEEP_DURATIONS), sweepStyle: normalizeStringChoice(rawConfig.sweepStyle, "standard", ACTIVE_PLAYER_SWEEP_STYLES), debug: normalizeBoolean(rawConfig.debug, false) };
  },
  specialHitHighlights(rawConfig = {}) {
    const legacyHitColorMode = String(rawConfig.hitColorMode || "").trim().toLowerCase();
    const fallbackColorTheme = legacyHitColorMode === "theme-presets" ? "champagne-night" : "kind-signal";
    return { enabled: normalizeBoolean(rawConfig.enabled, false), colorTheme: normalizeStringChoice(rawConfig.colorTheme, fallbackColorTheme, SPECIAL_HIT_COLOR_THEMES), animationStyle: normalizeMappedStringChoice(rawConfig.animationStyle, "pop-hit", SPECIAL_HIT_ANIMATION_STYLE_ALIASES), debug: normalizeBoolean(rawConfig.debug, false) };
  },
  cricketTargetHighlighter(rawConfig = {}) {
    const showOpenValue = Object.hasOwn(rawConfig, "showOpenTargets") ? rawConfig.showOpenTargets : rawConfig.showOpenObjectives;
    const showDeadValue = Object.hasOwn(rawConfig, "showDeadTargets") ? rawConfig.showDeadTargets : rawConfig.showDeadObjectives;
    const normalizedDimStyle = normalizeStringChoice(rawConfig.irrelevantBoardDimStyle, "smoke", CRICKET_HIGHLIGHT_IRRELEVANT_DIM_STYLES);
    const hasLegacyDimSetting = Object.hasOwn(rawConfig, "dimIrrelevantBoardTargets");
    let irrelevantBoardDimStyle = normalizedDimStyle;
    if (hasLegacyDimSetting && normalizedDimStyle === "smoke") {
      irrelevantBoardDimStyle = normalizeBoolean(rawConfig.dimIrrelevantBoardTargets, true)
        ? "smoke"
        : "off";
    }
    return { enabled: normalizeBoolean(rawConfig.enabled, false), showOpenObjectives: normalizeBoolean(showOpenValue, false), showDeadObjectives: normalizeBoolean(showDeadValue, true), irrelevantBoardDimStyle, dimIrrelevantBoardTargets: irrelevantBoardDimStyle !== "off", colorTheme: normalizeStringChoice(rawConfig.colorTheme, "standard", CRICKET_HIGHLIGHT_THEMES), intensity: normalizeStringChoice(rawConfig.intensity, "normal", CRICKET_HIGHLIGHT_INTENSITIES), debug: normalizeBoolean(rawConfig.debug, false) };
  },
  cricketGridStatusEffects(rawConfig = {}) {
    const pressureEdgeValue = Object.hasOwn(rawConfig, "threatEdge") ? rawConfig.threatEdge : rawConfig.pressureEdge;
    const scoringStripeValue = Object.hasOwn(rawConfig, "scoringLane") ? rawConfig.scoringLane : rawConfig.scoringStripe;
    const deadRowMutedValue = Object.hasOwn(rawConfig, "deadRowCollapse") ? rawConfig.deadRowCollapse : rawConfig.deadRowMuted;
    const pressureOverlayValue = Object.hasOwn(rawConfig, "opponentPressureOverlay") ? rawConfig.opponentPressureOverlay : rawConfig.pressureOverlay;
    return { enabled: normalizeBoolean(rawConfig.enabled, false), rowWave: normalizeBoolean(rawConfig.rowWave, true), badgeBeacon: normalizeBoolean(rawConfig.badgeBeacon, true), markProgress: normalizeBoolean(rawConfig.markProgress, true), pressureEdge: normalizeBoolean(pressureEdgeValue, true), scoringStripe: normalizeBoolean(scoringStripeValue, true), deadRowMuted: normalizeBoolean(deadRowMutedValue, true), deltaChips: normalizeBoolean(rawConfig.deltaChips, true), hitSpark: normalizeBoolean(rawConfig.hitSpark, true), roundTransitionWipe: normalizeBoolean(rawConfig.roundTransitionWipe, true), pressureOverlay: normalizeBoolean(pressureOverlayValue, true), colorTheme: normalizeStringChoice(rawConfig.colorTheme, "standard", CRICKET_HIGHLIGHT_THEMES), intensity: normalizeStringChoice(rawConfig.intensity, "normal", CRICKET_HIGHLIGHT_INTENSITIES), debug: normalizeBoolean(rawConfig.debug, false) };
  },
  dartboardMarkerHighlight(rawConfig = {}) {
    const colorThemeRaw = String(rawConfig.color || "").trim();
    return { enabled: normalizeBoolean(rawConfig.enabled, false), size: normalizeNumberChoice(rawConfig.size, 6, DARTBOARD_MARKER_HIGHLIGHT_SIZES), color: DARTBOARD_MARKER_HIGHLIGHT_COLORS.has(colorThemeRaw) ? colorThemeRaw : "rgb(49, 130, 206)", effect: normalizeMappedStringChoice(rawConfig.effect, "soft-glow", DARTBOARD_MARKER_HIGHLIGHT_EFFECT_ALIASES), opacityPercent: normalizeNumberChoice(rawConfig.opacityPercent, 85, DARTBOARD_MARKER_HIGHLIGHT_OPACITY), outline: normalizeStringChoice(rawConfig.outline, "aus", DARTBOARD_MARKER_HIGHLIGHT_OUTLINE), debug: normalizeBoolean(rawConfig.debug, false) };
  },
  dartMarkerReplacer(rawConfig = {}) {
    return { enabled: normalizeBoolean(rawConfig.enabled, false), design: normalizeStringChoice(rawConfig.design, "autodarts", DART_MARKER_DARTS_DESIGNS), animateDarts: normalizeBoolean(rawConfig.animateDarts, true), sizePercent: normalizeDartMarkerReplacerSizePercent(rawConfig.sizePercent), hideOriginalMarkers: normalizeBoolean(rawConfig.hideOriginalMarkers, false), impactStyle: normalizeStringChoice(rawConfig.impactStyle, "classic", DART_MARKER_IMPACT_STYLES), enableShadow: normalizeBoolean(rawConfig.enableShadow, true), enableShadowBlur: normalizeBoolean(rawConfig.enableShadowBlur, true), enableWobble: normalizeBoolean(rawConfig.enableWobble, true), enableFlightBlur: normalizeBoolean(rawConfig.enableFlightBlur, true), flightSpeed: normalizeStringChoice(rawConfig.flightSpeed, "standard", DART_MARKER_DARTS_FLIGHT_SPEED), debug: normalizeBoolean(rawConfig.debug, false) };
  },
  takeOutDartsAlert(rawConfig = {}) {
    return { enabled: normalizeBoolean(rawConfig.enabled, false), imageSize: normalizeStringChoice(rawConfig.imageSize, "standard", REMOVE_DARTS_NOTIFICATION_IMAGE_SIZE), pulseAnimation: normalizeBoolean(rawConfig.pulseAnimation, true), pulseScale: normalizeNumberChoice(rawConfig.pulseScale, 1.04, REMOVE_DARTS_NOTIFICATION_PULSE_SCALE), debug: normalizeBoolean(rawConfig.debug, false) };
  },
  singleBullHitSound(rawConfig = {}) {
    return { enabled: normalizeBoolean(rawConfig.enabled, false), volume: normalizeNumberChoice(rawConfig.volume, 0.9, SINGLE_BULL_SOUND_VOLUME), cooldownMs: normalizeNumberChoice(rawConfig.cooldownMs, 700, SINGLE_BULL_SOUND_COOLDOWN), pollIntervalMs: normalizeNumberChoice(rawConfig.pollIntervalMs, 0, SINGLE_BULL_SOUND_POLL_INTERVAL), debug: normalizeBoolean(rawConfig.debug, false) };
  },
  turnScoreCounter(rawConfig = {}) {
    const hasLegacyFlashPermanent = Object.hasOwn(rawConfig, "flashPermanent");
    let legacyFlashMode = "on-change";
    if (hasLegacyFlashPermanent) {
      legacyFlashMode = normalizeBoolean(rawConfig.flashPermanent, false)
        ? "permanent"
        : "on-change";
    }
    const normalizedFlashMode = normalizeMappedStringChoice(rawConfig.flashMode, legacyFlashMode, { "": "on-change", "on-change": "on-change", onchange: "on-change", appear: "on-change", burst: "on-change", "nur-bei-Ã¤nderung": "on-change", "nur-bei-aenderung": "on-change", permanent: "permanent", always: "permanent", persistent: "permanent", dauerhaft: "permanent" });
    return { enabled: normalizeBoolean(rawConfig.enabled, false), durationMs: normalizeTurnScoreCounterDuration(rawConfig.durationMs), countEffect: normalizeMappedStringChoice(rawConfig.countEffect, "smooth-count", TURN_SCORE_COUNT_EFFECT_ALIASES), flashOnChange: normalizeBoolean(rawConfig.flashOnChange, true), flashMode: hasLegacyFlashPermanent ? legacyFlashMode : normalizedFlashMode, debug: normalizeBoolean(rawConfig.debug, false) };
  },
  winnerCelebrationEffect(rawConfig = {}) {
    return { enabled: normalizeBoolean(rawConfig.enabled, false), style: normalizeMappedStringChoice(rawConfig.style, "center-side-burst", WINNER_CELEBRATION_STYLE_ALIASES), colorTheme: normalizeStringChoice(rawConfig.colorTheme, "autodarts", WINNER_FIREWORKS_COLOR_THEMES), intensity: normalizeStringChoice(rawConfig.intensity, "standard", WINNER_FIREWORKS_INTENSITIES), durationSeconds: normalizeNumberChoice(rawConfig.durationSeconds, 5, WINNER_FIREWORKS_DURATION_SECONDS), particleAmount: normalizeStringChoice(rawConfig.particleAmount, "optimiert", WINNER_FIREWORKS_PARTICLE_AMOUNTS), includeBullOut: normalizeBoolean(rawConfig.includeBullOut, true), pointerDismiss: normalizeBoolean(rawConfig.pointerDismiss, true), debug: normalizeBoolean(rawConfig.debug, false) };
  },
  x01RemainingScoreBar(rawConfig = {}) {
    const legacyThresholdColorMode = normalizeStringChoice(rawConfig.thresholdColorMode, "", X01_REMAINING_SCORE_BAR_COLOR_THEMES);
    const normalizedColorTheme = normalizeStringChoice(rawConfig.colorTheme, legacyThresholdColorMode || "checkout-focus", X01_REMAINING_SCORE_BAR_COLOR_THEMES);
    return { enabled: normalizeBoolean(rawConfig.enabled, false), colorTheme: normalizedColorTheme, barSize: normalizeStringChoice(rawConfig.barSize, "standard", X01_REMAINING_SCORE_BAR_BAR_SIZES), effect: normalizeMappedStringChoice(rawConfig.effect, "bar-pulse", { "": "bar-pulse", off: "off", "bar-pulse": "bar-pulse", "glass-light-sweep": "glass-light-sweep", "glass-charge": "glass-light-sweep", "moving-segments": "moving-segments", "previous-score-trail": "previous-score-trail", "fast-signal-sweep": "fast-signal-sweep", "electric-surge": "fast-signal-sweep", "pulse-on-change": "bar-pulse", "charge-release": "bar-pulse", "sheen-sweep": "glass-light-sweep", "checkout-glow": "glass-light-sweep", "burn-down": "moving-segments", "segment-pop": "moving-segments", "spark-trail": "previous-score-trail", "heat-edge": "fast-signal-sweep", "danger-flicker": "fast-signal-sweep", "electric-border": "fast-signal-sweep", "arc-burst": "fast-signal-sweep" }), debug: normalizeBoolean(rawConfig.debug, false) };
  },
  "themes.globalTypography"(rawConfig = {}) {
    return {
      enabled: normalizeBoolean(rawConfig.enabled, false),
      fontPreset: normalizeStringChoice(rawConfig.fontPreset, "system", THEME_GLOBAL_TYPOGRAPHY_FONT_PRESET_KEYS),
      applyTo: normalizeStringChoiceArray(
        rawConfig.applyTo,
        ["scores"],
        THEME_GLOBAL_TYPOGRAPHY_SCOPE_KEYS,
        getThemeGlobalTypographyScopeValues
      ),
      accentColor: normalizeHexColor(rawConfig.accentColor, ""),
      scoreColor: normalizeHexColor(rawConfig.scoreColor, ""),
      secondaryTextColor: normalizeHexColor(rawConfig.secondaryTextColor, ""),
      throwLabelColor: normalizeHexColor(rawConfig.throwLabelColor, ""),
      activePlayerTintIntensity: normalizeNumberChoice(
        rawConfig.activePlayerTintIntensity,
        Number(DEFAULT_FEATURE_CONFIGS["themes.globalTypography"].activePlayerTintIntensity || 0),
        THEME_ACTIVE_PLAYER_TINT_INTENSITY
      ),
      backgroundDisplayMode: normalizeStringChoice(
        rawConfig.backgroundDisplayMode,
        String(DEFAULT_FEATURE_CONFIGS["themes.globalTypography"].backgroundDisplayMode || "fill"),
        THEME_BACKGROUND_DISPLAY_MODES
      ),
      backgroundOpacity: normalizeNumberChoice(
        rawConfig.backgroundOpacity,
        Number(DEFAULT_FEATURE_CONFIGS["themes.globalTypography"].backgroundOpacity || 25),
        THEME_BACKGROUND_OPACITY
      ),
      playerFieldTransparency: normalizeNumberChoice(
        rawConfig.playerFieldTransparency,
        Number(DEFAULT_FEATURE_CONFIGS["themes.globalTypography"].playerFieldTransparency || 10),
        THEME_PLAYER_FIELD_TRANSPARENCY
      ),
      backgroundImageDataUrl: normalizeThemeBackgroundImage(
        rawConfig.backgroundImageDataUrl ||
          DEFAULT_FEATURE_CONFIGS["themes.globalTypography"].backgroundImageDataUrl ||
          ""
      ),
      backgroundAssetKey: normalizeThemeBackgroundAssetKey(
        rawConfig.backgroundAssetKey ||
          DEFAULT_FEATURE_CONFIGS["themes.globalTypography"].backgroundAssetKey ||
          ""
      ),
      turnDartStyle: normalizeStringChoice(
        rawConfig.turnDartStyle,
        DEFAULT_FEATURE_CONFIGS["themes.globalTypography"].turnDartStyle,
        THEME_GLOBAL_TURN_DART_STYLES
      ),
      turnDartColor: normalizeHexColor(
        rawConfig.turnDartColor,
        DEFAULT_FEATURE_CONFIGS["themes.globalTypography"].turnDartColor
      ),
      turnDartTextTemplate: normalizeLimitedText(
        rawConfig.turnDartTextTemplate,
        THEME_GLOBAL_TURN_DART_TEXT_MAX_LENGTH
      ),
      turnDartGradientColor: normalizeHexColor(
        rawConfig.turnDartGradientColor,
        DEFAULT_FEATURE_CONFIGS["themes.globalTypography"].turnDartGradientColor
      ),
      turnDartSizePercent: normalizeNumberChoice(
        rawConfig.turnDartSizePercent,
        DEFAULT_FEATURE_CONFIGS["themes.globalTypography"].turnDartSizePercent,
        THEME_GLOBAL_TURN_DART_SIZE_PERCENT
      ),
      turnDartImageDataUrl: normalizeThemeBackgroundImage(rawConfig.turnDartImageDataUrl),
      debug: normalizeBoolean(rawConfig.debug, false),
    };
  },
  "themes.x01"(rawConfig = {}) {
    return { ...normalizeThemeBaseConfig(rawConfig, DEFAULT_FEATURE_CONFIGS["themes.x01"]), showAvg: normalizeBoolean(rawConfig.showAvg, true) };
  },
  "themes.gotcha"(rawConfig = {}) {
    return {
      ...normalizeThemeBaseConfig(rawConfig, DEFAULT_FEATURE_CONFIGS["themes.gotcha"]),
      deltaPlacement: normalizeStringChoice(
        rawConfig.deltaPlacement,
        "below",
        THEME_GOTCHA_DELTA_PLACEMENTS
      ),
      deltaAlignment: normalizeStringChoice(
        rawConfig.deltaAlignment,
        "right",
        THEME_GOTCHA_DELTA_ALIGNMENTS
      ),
      deltaItalic: normalizeBoolean(rawConfig.deltaItalic, true),
    };
  },
  "themes.x01TwoPlayer"(rawConfig = {}) {
    return { ...normalizeThemeBaseConfig(rawConfig, DEFAULT_FEATURE_CONFIGS["themes.x01TwoPlayer"]), showAvg: normalizeBoolean(rawConfig.showAvg, true) };
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
              return createDefaultFeatureConfig(normalizedKey);
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
  const canonicalKey =
    featureCatalog.find(
      (entry) => entry.configKey === normalizedKey || entry.legacyConfigKeys?.includes?.(normalizedKey)
    )?.configKey || normalizedKey;
  return featureConfigSpecs[canonicalKey] || null;
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
    .map((entry) => normalizeThemeKey(splitFeaturePath(entry.configKey)[1]))
    .filter(Boolean);
}

export function getThemeBackgroundHostKeys() {
  return featureCatalog
    .filter((entry) => entry.configKey.startsWith("themes."))
    .map((entry) => normalizeThemeBackgroundHost(splitFeaturePath(entry.configKey)[1]))
    .filter(Boolean);
}

export function createDefaultFeatureConfig(configKey) {
  const normalizedKey =
    featureCatalog.find(
      (entry) => entry.configKey === String(configKey || "").trim() ||
        entry.legacyConfigKeys?.includes?.(String(configKey || "").trim())
    )?.configKey || String(configKey || "").trim();
  return deepClone(DEFAULT_FEATURE_CONFIGS[normalizedKey] || {});
}

export function createRecommendedFeatureConfig(configKey) {
  const normalizedKey =
    featureCatalog.find(
      (entry) => entry.configKey === String(configKey || "").trim() ||
        entry.legacyConfigKeys?.includes?.(String(configKey || "").trim())
    )?.configKey || String(configKey || "").trim();
  const defaultConfig = createDefaultFeatureConfig(normalizedKey);
  if (!normalizedKey) {
    return defaultConfig;
  }

  const recommendedConfig = {
    ...defaultConfig,
    enabled: true,
    ...(Object.hasOwn(defaultConfig, "debug") ? { debug: false } : {}),
    ...deepClone(RECOMMENDED_FEATURE_CONFIGS[normalizedKey] || {}),
  };
  return recommendedConfig;
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
