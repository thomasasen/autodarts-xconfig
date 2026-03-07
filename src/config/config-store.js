import { createRuntimeConfig, normalizeRuntimeConfig } from "./runtime-config.js";

export const CONFIG_STORAGE_KEY = "autodarts-xconfig:config:v1";
export const LEGACY_CONFIG_STORAGE_KEY = "ad-xconfig:config";
export const LEGACY_IMPORT_FLAG_KEY = "autodarts-xconfig:legacy-imported:v1";

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

function mapLegacyConfig(legacyConfig) {
  if (!isObjectLike(legacyConfig)) {
    return null;
  }

  const legacyFeatures = isObjectLike(legacyConfig.features) ? legacyConfig.features : {};
  const checkoutPulse = legacyFeatures["a-checkout-pulse"];
  if (!isObjectLike(checkoutPulse)) {
    return null;
  }

  const settings = getLegacyFeatureSettings(checkoutPulse);

  return normalizeRuntimeConfig({
    featureToggles: {
      checkoutScorePulse: Boolean(checkoutPulse.enabled),
    },
    features: {
      checkoutScorePulse: {
        enabled: Boolean(checkoutPulse.enabled),
        effect: readLegacySetting(settings, "EFFEKT", "scale"),
        colorTheme: readLegacySetting(settings, "FARBTHEMA", "159, 219, 88"),
        intensity: readLegacySetting(settings, "INTENSITAET", "standard"),
        triggerSource: readLegacySetting(settings, "TRIGGER_QUELLE", "suggestion-first"),
        debug: readLegacySetting(settings, "DEBUG", false),
      },
    },
  });
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
    const alreadyImported = await storage.getValue(LEGACY_IMPORT_FLAG_KEY, false);
    if (alreadyImported) {
      return {
        imported: false,
        reason: "already-imported",
        config: await load(),
      };
    }

    const legacyValue = await storage.getValue(LEGACY_CONFIG_STORAGE_KEY, null);
    const mappedConfig = mapLegacyConfig(legacyValue);

    await storage.setValue(LEGACY_IMPORT_FLAG_KEY, true);

    if (!mappedConfig) {
      return {
        imported: false,
        reason: "no-compatible-legacy-config",
        config: await load(),
      };
    }

    await storage.setValue(CONFIG_STORAGE_KEY, mappedConfig);

    return {
      imported: true,
      reason: "legacy-checkout-pulse-imported",
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
