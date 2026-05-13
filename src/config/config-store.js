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
    const importer = spec.importLegacy;
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
