import {
  createHardResetRuntimeConfig,
  createRuntimeConfig,
  normalizeRuntimeConfig,
} from "./runtime-config.js";
import {
  listFeatureConfigSpecs,
} from "./feature-config-spec.js";
import { setNestedValue, splitFeaturePath } from "./feature-path-utils.js";
import {
  readStorageValue,
  resolveLocalStorage,
  writeStorageValue,
} from "./storage-access.js";

export const CONFIG_STORAGE_KEY = "autodarts-xconfig:config:v1";
export const LEGACY_CONFIG_STORAGE_KEY = "ad-xconfig:config";
export const LEGACY_IMPORT_FLAG_KEY = "autodarts-xconfig:legacy-imported:v2";
export const CONFIG_WRITE_LOCK_NAME = "autodarts-xconfig:config-write:v1";

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
  const localStorageRef = resolveLocalStorage(options);
  const useGmStorage =
    typeof gmGetValue === "function" && typeof gmSetValue === "function";

  async function getValue(key, fallbackValue = null) {
    if (useGmStorage) {
      try {
        const gmValue = await toPromise(gmGetValue(key, fallbackValue));
        return gmValue === undefined || gmValue === null ? fallbackValue : gmValue;
      } catch (error) {
        throw new ConfigPersistenceError("Config could not be read from GM storage.", {
          key: String(key || ""),
          failures: [{ provider: "gm-storage", reason: toErrorMessage(error) }],
        });
      }
    }

    const { ok, value: rawValue } = readStorageValue(localStorageRef, key);
    if (!ok) {
      return fallbackValue;
    }
    if (typeof rawValue === "string") {
      const parsed = safeParseJson(rawValue);
      return parsed === null ? rawValue : parsed;
    }

    return fallbackValue;
  }

  async function setValue(key, value) {
    if (useGmStorage) {
      try {
        await toPromise(gmSetValue(key, value));
      } catch (error) {
        throw new ConfigPersistenceError("Config could not be persisted to GM storage.", {
          key: String(key || ""),
          failures: [{ provider: "gm-storage", reason: toErrorMessage(error) }],
        });
      }
      writeStorageValue(localStorageRef, key, JSON.stringify(value));
      return true;
    }

    const localWrite = writeStorageValue(localStorageRef, key, JSON.stringify(value));
    if (!localWrite.ok) {
      throw new ConfigPersistenceError("Config could not be persisted to any storage backend.", {
        key: String(key || ""),
        failures: [{ provider: "localStorage", reason: localWrite.reason }],
      });
    }

    return true;
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
  const lockManager = options.lockManager || null;
  let writeQueue = Promise.resolve();

  function runWithLock(operation) {
    if (!lockManager || typeof lockManager.request !== "function") {
      return operation();
    }
    return lockManager.request(CONFIG_WRITE_LOCK_NAME, { mode: "exclusive" }, operation);
  }

  function enqueueWrite(operation) {
    const nextWrite = writeQueue.then(
      () => runWithLock(operation),
      () => runWithLock(operation)
    );
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

  async function transact(transform) {
    return enqueueWrite(async () => {
      const currentConfig = await load();
      const outcome =
        typeof transform === "function"
          ? await transform(currentConfig)
          : null;
      if (!outcome || !isObjectLike(outcome.config)) {
        return {
          config: currentConfig,
          persisted: false,
          result: outcome?.result,
        };
      }

      const normalized = normalizeRuntimeConfig(outcome.config);
      await storage.setValue(CONFIG_STORAGE_KEY, normalized);
      return {
        config: normalized,
        persisted: true,
        result: outcome.result,
      };
    });
  }

  async function importLegacyConfigIfAvailable(options = {}) {
    return enqueueWrite(async () => {
      const currentStoredConfig = await storage.getValue(CONFIG_STORAGE_KEY, null);
      const hasStoredCurrentConfig = isObjectLike(currentStoredConfig);
      const createInitialConfig = options.createInitialConfig;

      async function initializeMissingConfig() {
        if (hasStoredCurrentConfig || typeof createInitialConfig !== "function") {
          return null;
        }

        const initialConfig = normalizeRuntimeConfig(await createInitialConfig());
        await storage.setValue(CONFIG_STORAGE_KEY, initialConfig);
        return initialConfig;
      }

      if (hasStoredCurrentConfig && !isDefaultRuntimeConfig(currentStoredConfig)) {
        const normalizedCurrentConfig = normalizeRuntimeConfig(currentStoredConfig);
        await storage.setValue(CONFIG_STORAGE_KEY, normalizedCurrentConfig);
        await storage.setValue(LEGACY_IMPORT_FLAG_KEY, true);
        return {
          imported: false,
          reason: "existing-current-config",
          config: normalizedCurrentConfig,
        };
      }

      const alreadyImported = await storage.getValue(LEGACY_IMPORT_FLAG_KEY, false);
      if (alreadyImported) {
        const initialConfig = await initializeMissingConfig();
        return {
          imported: false,
          initialized: Boolean(initialConfig),
          reason: initialConfig ? "initial-config-created" : "already-imported",
          config:
            initialConfig ||
            (hasStoredCurrentConfig
              ? normalizeRuntimeConfig(currentStoredConfig)
              : await load()),
        };
      }

      const legacyValue = await storage.getValue(LEGACY_CONFIG_STORAGE_KEY, null);
      const mappedConfig = mapLegacyConfig(legacyValue);

      if (!mappedConfig) {
        const normalizedCurrentConfig = hasStoredCurrentConfig
          ? normalizeRuntimeConfig(currentStoredConfig)
          : null;
        if (normalizedCurrentConfig) {
          await storage.setValue(CONFIG_STORAGE_KEY, normalizedCurrentConfig);
        }
        await storage.setValue(LEGACY_IMPORT_FLAG_KEY, true);
        const initialConfig = await initializeMissingConfig();
        return {
          imported: false,
          initialized: Boolean(initialConfig),
          reason: initialConfig ? "initial-config-created" : "no-compatible-legacy-config",
          config:
            initialConfig ||
            normalizedCurrentConfig ||
            await load(),
        };
      }

      await storage.setValue(CONFIG_STORAGE_KEY, mappedConfig);
      await storage.setValue(LEGACY_IMPORT_FLAG_KEY, true);

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
    transact,
    importLegacyConfigIfAvailable,
  };
}
