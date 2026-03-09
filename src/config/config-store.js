import { createRuntimeConfig, normalizeRuntimeConfig } from "./runtime-config.js";

export const CONFIG_STORAGE_KEY = "autodarts-xconfig:config:v1";
export const LEGACY_CONFIG_STORAGE_KEY = "ad-xconfig:config";
export const LEGACY_IMPORT_FLAG_KEY = "autodarts-xconfig:legacy-imported:v2";

const LEGACY_COLOR_THEME_ALIASES = Object.freeze({
  ["159,219,88"]: "159, 219, 88",
  ["56,189,248"]: "56, 189, 248",
  ["245,158,11"]: "245, 158, 11",
  ["248,113,113"]: "248, 113, 113",
});

function toPromise(value) {
  return value && typeof value.then === "function" ? value : Promise.resolve(value);
}

function isObjectLike(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function safeParseJson(value) {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch (_) {
    return null;
  }
}

function splitFeaturePath(featureKey) {
  return String(featureKey || "")
    .split(".")
    .map((part) => String(part || "").trim())
    .filter(Boolean);
}

function setNestedValue(rootValue, pathParts = [], value) {
  if (!isObjectLike(rootValue) || !Array.isArray(pathParts) || !pathParts.length) {
    return;
  }

  let current = rootValue;
  for (let index = 0; index < pathParts.length - 1; index += 1) {
    const part = pathParts[index];
    if (!isObjectLike(current[part])) {
      current[part] = {};
    }
    current = current[part];
  }

  current[pathParts[pathParts.length - 1]] = value;
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

function createStorageAdapter(options = {}) {
  const gmGetValue = options.gmGetValue;
  const gmSetValue = options.gmSetValue;
  const localStorageRef =
    options.localStorageRef ||
    options.windowRef?.localStorage ||
    (typeof localStorage !== "undefined" ? localStorage : null);

  async function getValue(key, fallbackValue = null) {
    try {
      if (typeof gmGetValue === "function") {
        const gmValue = await toPromise(gmGetValue(key, fallbackValue));
        if (typeof gmValue !== "undefined" && gmValue !== null) {
          return gmValue;
        }
      }
    } catch (_) {
      // Fall through to localStorage.
    }

    try {
      const rawValue = localStorageRef?.getItem?.(key);
      if (typeof rawValue === "string") {
        const parsed = safeParseJson(rawValue);
        return parsed === null ? rawValue : parsed;
      }
    } catch (_) {
      // Ignore local storage failures.
    }

    return fallbackValue;
  }

  async function setValue(key, value) {
    let wroteValue = false;

    try {
      if (typeof gmSetValue === "function") {
        await toPromise(gmSetValue(key, value));
        wroteValue = true;
      }
    } catch (_) {
      // Fall through to localStorage.
    }

    try {
      localStorageRef?.setItem?.(key, JSON.stringify(value));
      wroteValue = true;
    } catch (_) {
      // Ignore local storage failures.
    }

    return wroteValue;
  }

  return {
    getValue,
    setValue,
  };
}

function getLegacyFeatureSettings(legacyFeatureState) {
  if (!isObjectLike(legacyFeatureState?.settings)) {
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

function importCheckoutScorePulse(legacyFeatureState) {
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
}

function importCheckoutBoardTargets(legacyFeatureState) {
  const settings = getLegacyFeatureSettings(legacyFeatureState);
  return buildFeatureImport("checkoutBoardTargets", legacyFeatureState, {
    effect: readLegacySetting(settings, "EFFEKT", "pulse"),
    targetScope: readLegacySetting(settings, "ZIELUMFANG", "first"),
    singleRing: readLegacySetting(settings, "SINGLE_RING", "both"),
    colorTheme: readLegacySetting(settings, "FARBTHEMA", "violet"),
    outlineIntensity: readLegacySetting(settings, "KONTUR_INTENSITAET", "standard"),
    debug: readLegacySetting(settings, "DEBUG", false),
  });
}

function importTvBoardZoom(legacyFeatureState) {
  const settings = getLegacyFeatureSettings(legacyFeatureState);
  return buildFeatureImport("tvBoardZoom", legacyFeatureState, {
    zoomLevel: readLegacySetting(settings, "ZOOM_STUFE", 2.75),
    zoomSpeed: readLegacySetting(settings, "ZOOM_GESCHWINDIGKEIT", "mittel"),
    checkoutZoomEnabled: readLegacySetting(settings, "CHECKOUT_ZOOM", true),
    debug: readLegacySetting(settings, "DEBUG", false),
  });
}

function importStyleCheckoutSuggestions(legacyFeatureState) {
  const settings = getLegacyFeatureSettings(legacyFeatureState);
  return buildFeatureImport("styleCheckoutSuggestions", legacyFeatureState, {
    style: readLegacySetting(settings, "STIL", "ribbon"),
    labelText: readLegacySetting(settings, "LABELTEXT", "CHECKOUT"),
    colorTheme: readLegacySetting(settings, "FARBTHEMA", "amber"),
    debug: readLegacySetting(settings, "DEBUG", false),
  });
}

function importAverageTrendArrow(legacyFeatureState) {
  const settings = getLegacyFeatureSettings(legacyFeatureState);
  return buildFeatureImport("averageTrendArrow", legacyFeatureState, {
    durationMs: readLegacySetting(settings, "ANIMATIONSDAUER_MS", 320),
    size: readLegacySetting(settings, "PFEIL_GROESSE", "standard"),
    debug: readLegacySetting(settings, "DEBUG", false),
  });
}

function importTurnStartSweep(legacyFeatureState) {
  const settings = getLegacyFeatureSettings(legacyFeatureState);
  return buildFeatureImport("turnStartSweep", legacyFeatureState, {
    durationMs: readLegacySetting(settings, "SWEEP_GESCHWINDIGKEIT_MS", 420),
    sweepStyle: readLegacySetting(settings, "SWEEP_STIL", "standard"),
    debug: readLegacySetting(settings, "DEBUG", false),
  });
}

function importTripleDoubleBullHits(legacyFeatureState) {
  const settings = getLegacyFeatureSettings(legacyFeatureState);
  return buildFeatureImport("tripleDoubleBullHits", legacyFeatureState, {
    highlightTriple: readLegacySetting(settings, "TRIPLE_HERVORHEBEN", true),
    highlightDouble: readLegacySetting(settings, "DOUBLE_HERVORHEBEN", true),
    highlightBull: readLegacySetting(settings, "BULL_HERVORHEBEN", true),
    pollIntervalMs: readLegacySetting(settings, "AKTUALISIERUNGSMODUS", 3000),
    debug: readLegacySetting(settings, "DEBUG", false),
  });
}

function importCricketHighlighter(legacyFeatureState) {
  const settings = getLegacyFeatureSettings(legacyFeatureState);
  return buildFeatureImport("cricketHighlighter", legacyFeatureState, {
    showOpenTargets: readLegacySetting(settings, "OPEN_ZIELE_ANZEIGEN", false),
    showDeadTargets: readLegacySetting(settings, "DEAD_ZIELE_ANZEIGEN", true),
    colorTheme: readLegacySetting(settings, "FARBTHEMA", "standard"),
    intensity: readLegacySetting(settings, "INTENSITAET", "normal"),
    debug: readLegacySetting(settings, "DEBUG", false),
  });
}

function importCricketGridFx(legacyFeatureState) {
  const settings = getLegacyFeatureSettings(legacyFeatureState);
  return buildFeatureImport("cricketGridFx", legacyFeatureState, {
    rowWave: readLegacySetting(settings, "ROW_RAIL_PULSE", true),
    badgeBeacon: readLegacySetting(settings, "BADGE_BEACON", true),
    markProgress: readLegacySetting(settings, "MARK_PROGRESS_ANIMATOR", true),
    threatEdge: readLegacySetting(settings, "THREAT_EDGE", true),
    scoringLane: readLegacySetting(settings, "SCORING_LANE_HIGHLIGHT", true),
    deadRowCollapse: readLegacySetting(settings, "DEAD_ROW_COLLAPSE", true),
    deltaChips: readLegacySetting(settings, "DELTA_CHIPS", true),
    hitSpark: readLegacySetting(settings, "HIT_SPARK", true),
    roundTransitionWipe: readLegacySetting(settings, "ROUND_TRANSITION_WIPE", true),
    opponentPressureOverlay: readLegacySetting(settings, "OPPONENT_PRESSURE_OVERLAY", true),
    colorTheme: readLegacySetting(settings, "FARBTHEMA", "standard"),
    intensity: readLegacySetting(settings, "INTENSITAET", "normal"),
    debug: readLegacySetting(settings, "DEBUG", false),
  });
}

function importDartMarkerEmphasis(legacyFeatureState) {
  const settings = getLegacyFeatureSettings(legacyFeatureState);
  return buildFeatureImport("dartMarkerEmphasis", legacyFeatureState, {
    size: readLegacySetting(settings, "MARKER_GROESSE", 6),
    color: readLegacySetting(settings, "MARKER_FARBE", "rgb(49, 130, 206)"),
    effect: readLegacySetting(settings, "EFFEKT", "glow"),
    opacityPercent: readLegacySetting(settings, "MARKER_OPAZITAET", 85),
    outline: readLegacySetting(settings, "OUTLINE", "aus"),
    debug: readLegacySetting(settings, "DEBUG", false),
  });
}

function importDartMarkerDarts(legacyFeatureState) {
  const settings = getLegacyFeatureSettings(legacyFeatureState);
  return buildFeatureImport("dartMarkerDarts", legacyFeatureState, {
    design: normalizeLegacyDartDesign(
      readLegacySetting(settings, "DART_DESIGN", "Dart_autodarts.png"),
      "autodarts"
    ),
    animateDarts: readLegacySetting(settings, "ANIMATE_DARTS", true),
    sizePercent: readLegacySetting(settings, "DART_GROESSE", 100),
    hideOriginalMarkers: readLegacySetting(settings, "ORIGINAL_MARKER_AUSBLENDEN", false),
    flightSpeed: readLegacySetting(settings, "FLUGGESCHWINDIGKEIT", "standard"),
    debug: readLegacySetting(settings, "DEBUG", false),
  });
}

function importRemoveDartsNotification(legacyFeatureState) {
  const settings = getLegacyFeatureSettings(legacyFeatureState);
  return buildFeatureImport("removeDartsNotification", legacyFeatureState, {
    imageSize: readLegacySetting(settings, "BILDGROESSE", "standard"),
    pulseAnimation: readLegacySetting(settings, "PULSE_ANIMATION", true),
    pulseScale: readLegacySetting(settings, "PULSE_STAERKE", 1.04),
    debug: readLegacySetting(settings, "DEBUG", false),
  });
}

function importSingleBullSound(legacyFeatureState) {
  const settings = getLegacyFeatureSettings(legacyFeatureState);
  return buildFeatureImport("singleBullSound", legacyFeatureState, {
    volume: readLegacySetting(settings, "LAUTSTAERKE", 0.9),
    cooldownMs: readLegacySetting(settings, "WIEDERHOLSPERRE_MS", 700),
    pollIntervalMs: readLegacySetting(settings, "FALLBACK_SCAN_MS", 0),
    debug: readLegacySetting(settings, "DEBUG", false),
  });
}

function importTurnPointsCount(legacyFeatureState) {
  const settings = getLegacyFeatureSettings(legacyFeatureState);
  return buildFeatureImport("turnPointsCount", legacyFeatureState, {
    durationMs: readLegacySetting(settings, "ANIMATIONSDAUER_MS", 416),
    debug: readLegacySetting(settings, "DEBUG", false),
  });
}

function importWinnerFireworks(legacyFeatureState) {
  const settings = getLegacyFeatureSettings(legacyFeatureState);
  return buildFeatureImport("winnerFireworks", legacyFeatureState, {
    style: readLegacySetting(settings, "STYLE", "realistic"),
    colorTheme: readLegacySetting(settings, "FARBE", "autodarts"),
    intensity: readLegacySetting(settings, "INTENSITAET", "standard"),
    includeBullOut: readLegacySetting(settings, "BULLOUT_AKTIV", true),
    pointerDismiss: readLegacySetting(settings, "KLICK_ZUM_STOPPEN", true),
    debug: readLegacySetting(settings, "DEBUG", false),
  });
}

function importThemeX01(legacyFeatureState) {
  const settings = getLegacyFeatureSettings(legacyFeatureState);
  return buildFeatureImport("themes.x01", legacyFeatureState, {
    showAvg: readLegacySetting(settings, "AVG_ANZEIGE", true),
    backgroundDisplayMode: readLegacySetting(settings, "HINTERGRUND_DARSTELLUNG", "fill"),
    backgroundOpacity: readLegacySetting(settings, "HINTERGRUND_OPAZITAET", 25),
    playerFieldTransparency: readLegacySetting(settings, "SPIELERFELD_TRANSPARENZ", 10),
    debug: readLegacySetting(settings, "DEBUG", false),
  });
}

function importThemeShanghai(legacyFeatureState) {
  const settings = getLegacyFeatureSettings(legacyFeatureState);
  return buildFeatureImport("themes.shanghai", legacyFeatureState, {
    showAvg: readLegacySetting(settings, "AVG_ANZEIGE", true),
    backgroundDisplayMode: readLegacySetting(settings, "HINTERGRUND_DARSTELLUNG", "fill"),
    backgroundOpacity: readLegacySetting(settings, "HINTERGRUND_OPAZITAET", 25),
    playerFieldTransparency: readLegacySetting(settings, "SPIELERFELD_TRANSPARENZ", 10),
    debug: readLegacySetting(settings, "DEBUG", false),
  });
}

function importThemeBermuda(legacyFeatureState) {
  const settings = getLegacyFeatureSettings(legacyFeatureState);
  return buildFeatureImport("themes.bermuda", legacyFeatureState, {
    backgroundDisplayMode: readLegacySetting(settings, "HINTERGRUND_DARSTELLUNG", "fill"),
    backgroundOpacity: readLegacySetting(settings, "HINTERGRUND_OPAZITAET", 25),
    playerFieldTransparency: readLegacySetting(settings, "SPIELERFELD_TRANSPARENZ", 10),
    debug: readLegacySetting(settings, "DEBUG", false),
  });
}

function importThemeCricket(legacyFeatureState) {
  const settings = getLegacyFeatureSettings(legacyFeatureState);
  return buildFeatureImport("themes.cricket", legacyFeatureState, {
    showAvg: readLegacySetting(settings, "AVG_ANZEIGE", true),
    backgroundDisplayMode: readLegacySetting(settings, "HINTERGRUND_DARSTELLUNG", "fill"),
    backgroundOpacity: readLegacySetting(settings, "HINTERGRUND_OPAZITAET", 25),
    playerFieldTransparency: readLegacySetting(settings, "SPIELERFELD_TRANSPARENZ", 10),
    debug: readLegacySetting(settings, "DEBUG", false),
  });
}

function importThemeBullOff(legacyFeatureState) {
  const settings = getLegacyFeatureSettings(legacyFeatureState);
  return buildFeatureImport("themes.bullOff", legacyFeatureState, {
    contrastPreset: readLegacySetting(settings, "KONTRAST_PRESET", "standard"),
    backgroundDisplayMode: readLegacySetting(settings, "HINTERGRUND_DARSTELLUNG", "fill"),
    backgroundOpacity: readLegacySetting(settings, "HINTERGRUND_OPAZITAET", 25),
    playerFieldTransparency: readLegacySetting(settings, "SPIELERFELD_TRANSPARENZ", 10),
    debug: readLegacySetting(settings, "DEBUG", false),
  });
}

const LEGACY_FEATURE_IMPORTERS = Object.freeze([
  ["a-checkout-pulse", importCheckoutScorePulse],
  ["a-checkout-board", importCheckoutBoardTargets],
  ["a-tv-board-zoom", importTvBoardZoom],
  ["a-checkout-style", importStyleCheckoutSuggestions],
  ["a-average-arrow", importAverageTrendArrow],
  ["a-turn-sweep", importTurnStartSweep],
  ["a-triple-double-bull", importTripleDoubleBullHits],
  ["a-cricket-target", importCricketHighlighter],
  ["a-cricket-grid-fx", importCricketGridFx],
  ["a-dart-marker-emphasis", importDartMarkerEmphasis],
  ["a-marker-darts", importDartMarkerDarts],
  ["a-remove-darts", importRemoveDartsNotification],
  ["a-single-bull", importSingleBullSound],
  ["a-turn-points", importTurnPointsCount],
  ["a-winner-fireworks", importWinnerFireworks],
  ["theme-x01", importThemeX01],
  ["theme-shanghai", importThemeShanghai],
  ["theme-bermuda", importThemeBermuda],
  ["theme-cricket", importThemeCricket],
  ["theme-bull-off", importThemeBullOff],
]);

function mapLegacyConfig(legacyConfig) {
  if (!isObjectLike(legacyConfig)) {
    return null;
  }

  const legacyFeatures = isObjectLike(legacyConfig.features) ? legacyConfig.features : {};
  const featureToggles = {};
  const featureConfig = {};
  let importedFeatureCount = 0;

  LEGACY_FEATURE_IMPORTERS.forEach(([legacyFeatureId, importer]) => {
    const legacyFeatureState = legacyFeatures[legacyFeatureId];
    if (!isObjectLike(legacyFeatureState) || typeof importer !== "function") {
      return;
    }

    const importedFeature = importer(legacyFeatureState);
    if (!importedFeature || !importedFeature.configKey) {
      return;
    }

    importedFeatureCount += 1;
    featureToggles[importedFeature.configKey] = importedFeature.enabled;
    setNestedValue(featureConfig, splitFeaturePath(importedFeature.configKey), importedFeature.config);
  });

  if (!importedFeatureCount) {
    return null;
  }

  return normalizeRuntimeConfig({
    featureToggles,
    features: featureConfig,
  });
}

function isDefaultRuntimeConfig(rawConfig) {
  return JSON.stringify(normalizeRuntimeConfig(rawConfig || {})) === JSON.stringify(normalizeRuntimeConfig());
}

export function createConfigStore(options = {}) {
  const storage = createStorageAdapter(options);

  async function load() {
    const storedValue = await storage.getValue(CONFIG_STORAGE_KEY, null);
    if (!isObjectLike(storedValue)) {
      return normalizeRuntimeConfig();
    }

    return normalizeRuntimeConfig(storedValue);
  }

  async function save(rawConfig = {}) {
    const normalized = normalizeRuntimeConfig(rawConfig);
    await storage.setValue(CONFIG_STORAGE_KEY, normalized);
    return normalized;
  }

  async function update(partialConfig = {}) {
    const runtimeConfig = createRuntimeConfig(await load());
    runtimeConfig.update(partialConfig);
    const next =
      typeof runtimeConfig.getNormalized === "function"
        ? runtimeConfig.getNormalized()
        : runtimeConfig.getRaw();
    await storage.setValue(CONFIG_STORAGE_KEY, next);
    return next;
  }

  async function reset() {
    const normalized = normalizeRuntimeConfig();
    await storage.setValue(CONFIG_STORAGE_KEY, normalized);
    return normalized;
  }

  async function importLegacyConfigIfAvailable() {
    const currentStoredConfig = await storage.getValue(CONFIG_STORAGE_KEY, null);
    const hasStoredCurrentConfig = isObjectLike(currentStoredConfig);

    if (hasStoredCurrentConfig && !isDefaultRuntimeConfig(currentStoredConfig)) {
      await storage.setValue(LEGACY_IMPORT_FLAG_KEY, true);
      return {
        imported: false,
        reason: "existing-current-config",
        config: normalizeRuntimeConfig(currentStoredConfig),
      };
    }

    const alreadyImported = await storage.getValue(LEGACY_IMPORT_FLAG_KEY, false);
    if (alreadyImported) {
      return {
        imported: false,
        reason: "already-imported",
        config: hasStoredCurrentConfig
          ? normalizeRuntimeConfig(currentStoredConfig)
          : await load(),
      };
    }

    const legacyValue = await storage.getValue(LEGACY_CONFIG_STORAGE_KEY, null);
    const mappedConfig = mapLegacyConfig(legacyValue);

    await storage.setValue(LEGACY_IMPORT_FLAG_KEY, true);

    if (!mappedConfig) {
      return {
        imported: false,
        reason: "no-compatible-legacy-config",
        config: hasStoredCurrentConfig
          ? normalizeRuntimeConfig(currentStoredConfig)
          : await load(),
      };
    }

    await storage.setValue(CONFIG_STORAGE_KEY, mappedConfig);

    return {
      imported: true,
      reason: "legacy-config-imported",
      config: mappedConfig,
    };
  }

  return {
    load,
    save,
    update,
    reset,
    importLegacyConfigIfAvailable,
  };
}
