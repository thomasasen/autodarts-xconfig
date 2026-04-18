import {
  createHardResetRuntimeConfig,
  createRuntimeConfig,
  normalizeRuntimeConfig,
} from "./runtime-config.js";
import {
  listFeatureConfigSpecs,
} from "./feature-config-spec.js";
import { setNestedValue, splitFeaturePath } from "./feature-path-utils.js";

export const CONFIG_STORAGE_KEY = "autodarts-xconfig:config:v1";
export const LEGACY_CONFIG_STORAGE_KEY = "ad-xconfig:config";
export const LEGACY_IMPORT_FLAG_KEY = "autodarts-xconfig:legacy-imported:v2";

export class ConfigPersistenceError extends Error {
  constructor(message, details = {}) {
    super(String(message || "Failed to persist config state."));
    this.name = "ConfigPersistenceError";
    this.code = "CONFIG_PERSISTENCE_FAILED";
    this.details = details && typeof details === "object" ? details : {};
  }
}

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

function toErrorMessage(error) {
  if (error instanceof Error && typeof error.message === "string" && error.message.trim()) {
    return error.message.trim();
  }

  const fallback = String(error || "").trim();
  return fallback || "unknown error";
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
        if (gmValue !== undefined && gmValue !== null) {
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
    const failures = [];

    try {
      if (typeof gmSetValue === "function") {
        await toPromise(gmSetValue(key, value));
        wroteValue = true;
      } else {
        failures.push({
          provider: "gm-storage",
          reason: "unavailable",
        });
      }
    } catch (error) {
      failures.push({
        provider: "gm-storage",
        reason: toErrorMessage(error),
      });
    }

    try {
      const setItem = localStorageRef?.setItem;
      if (typeof setItem === "function") {
        setItem.call(localStorageRef, key, JSON.stringify(value));
        wroteValue = true;
      } else {
        failures.push({
          provider: "localStorage",
          reason: "unavailable",
        });
      }
    } catch (error) {
      failures.push({
        provider: "localStorage",
        reason: toErrorMessage(error),
      });
    }

    if (!wroteValue) {
      throw new ConfigPersistenceError("Config could not be persisted to any storage backend.", {
        key: String(key || ""),
        failures,
      });
    }

    return wroteValue;
  }

  return {
    getValue,
    setValue,
  };
}

const LEGACY_COLOR_THEME_ALIASES = Object.freeze({
  ["159,219,88"]: "159, 219, 88",
  ["56,189,248"]: "56, 189, 248",
  ["245,158,11"]: "245, 158, 11",
  ["248,113,113"]: "248, 113, 113",
});

function getLegacyFeatureSettings(legacyFeatureState) {
  if (!isObjectLike(legacyFeatureState?.settings)) {
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

function normalizeLegacyColorTheme(value, fallbackValue) {
  const rawValue = String(value || "").trim();
  if (!rawValue) {
    return fallbackValue;
  }

  const compact = rawValue.replaceAll(/\s+/g, "");
  return LEGACY_COLOR_THEME_ALIASES[compact] || rawValue;
}

function normalizeLegacyBoardTargetVisualPreset(visualPresetValue, legacyEffectValue) {
  const explicitPreset = String(visualPresetValue || "").trim().toLowerCase();
  if (explicitPreset === "focus" || explicitPreset === "signal" || explicitPreset === "steady") {
    return explicitPreset;
  }

  const legacyEffect = String(legacyEffectValue || "").trim().toLowerCase();
  if (legacyEffect === "blink") {
    return "signal";
  }
  if (legacyEffect === "glow") {
    return "steady";
  }
  return "focus";
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

const LEGACY_IMPORTERS_BY_CONFIG_KEY = Object.freeze({
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
      visualPreset: normalizeLegacyBoardTargetVisualPreset(
        readLegacySetting(settings, "VISUAL_PRESET", ""),
        readLegacySetting(settings, "EFFEKT", "pulse")
      ),
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

function mapLegacyConfig(legacyConfig) {
  if (!isObjectLike(legacyConfig)) {
    return null;
  }

  const legacyFeatures = isObjectLike(legacyConfig.features) ? legacyConfig.features : {};
  const featureToggles = {};
  const featureConfig = {};
  let importedFeatureCount = 0;

  listFeatureConfigSpecs().forEach((spec) => {
    if (!spec.legacyFeatureId) {
      return;
    }

    const legacyFeatureState = legacyFeatures[spec.legacyFeatureId];
    const importer = LEGACY_IMPORTERS_BY_CONFIG_KEY[spec.configKey];
    if (!isObjectLike(legacyFeatureState) || typeof importer !== "function") {
      return;
    }

    const importedFeature = importer(legacyFeatureState);
    if (!importedFeature?.configKey) {
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
  let writeQueue = Promise.resolve();

  function enqueueWrite(operation) {
    const nextWrite = writeQueue.then(() => operation(), () => operation());
    writeQueue = nextWrite.then(
      () => undefined,
      () => undefined
    );
    return nextWrite;
  }

  async function load() {
    const storedValue = await storage.getValue(CONFIG_STORAGE_KEY, null);
    if (!isObjectLike(storedValue)) {
      return normalizeRuntimeConfig();
    }

    return normalizeRuntimeConfig(storedValue);
  }

  async function save(rawConfig = {}) {
    return enqueueWrite(async () => {
      const normalized = normalizeRuntimeConfig(rawConfig);
      await storage.setValue(CONFIG_STORAGE_KEY, normalized);
      return normalized;
    });
  }

  async function update(partialConfig = {}) {
    return enqueueWrite(async () => {
      const runtimeConfig = createRuntimeConfig(await load());
      runtimeConfig.update(partialConfig);
      const next =
        typeof runtimeConfig.getNormalized === "function"
          ? runtimeConfig.getNormalized()
          : runtimeConfig.getRaw();
      await storage.setValue(CONFIG_STORAGE_KEY, next);
      return next;
    });
  }

  async function reset() {
    return enqueueWrite(async () => {
      const normalized = createHardResetRuntimeConfig();
      await storage.setValue(CONFIG_STORAGE_KEY, normalized);
      return normalized;
    });
  }

  async function importLegacyConfigIfAvailable() {
    return enqueueWrite(async () => {
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
    });
  }

  return {
    load,
    save,
    update,
    reset,
    importLegacyConfigIfAvailable,
  };
}
