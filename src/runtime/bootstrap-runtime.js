import {
  CONFIG_STORAGE_KEY,
  ConfigPersistenceError,
  createConfigStore,
} from "../config/config-store.js";
import {
  analyzeSettingsImport,
  createSettingsExport as createSettingsExportPayload,
} from "../config/config-transfer.js";
import { setNestedValue, splitFeaturePath } from "../config/feature-path-utils.js";
import { API_VERSION, createBootstrap } from "../core/bootstrap.js";
import { createRecommendedRuntimeConfig } from "../config/runtime-config.js";
import { createFeatureRegistry } from "../features/feature-registry.js";
import { ensureXConfigUi } from "../features/xconfig-ui/index.js";
import { xconfigDescriptors } from "../features/xconfig-ui/descriptors.js";
import {
  normalizeThemeBackgroundHost,
  VALID_THEME_BACKGROUND_HOSTS,
} from "../shared/theme-background-host-utils.js";

const GLOBAL_NAMESPACE_KEY = "__adXConfig";
const RUNTIME_INIT_PROMISE_KEY = "__runtimeInitPromise";
const VALID_THEME_BACKGROUND_HOST_SET = new Set(VALID_THEME_BACKGROUND_HOSTS);

function buildFeatureEnabledPatch(configKey, enabled) {
  const normalizedKey = String(configKey || "").trim();
  if (!normalizedKey) {
    return {};
  }

  const patch = {
    featureToggles: {
      [normalizedKey]: Boolean(enabled),
    },
    features: {},
  };

  const pathParts = splitFeaturePath(normalizedKey);
  if (pathParts.length === 1) {
    patch.features[pathParts[0]] = { enabled: Boolean(enabled) };
    return patch;
  }

  setNestedValue(patch.features, pathParts, { enabled: Boolean(enabled) });
  return patch;
}

function getGlobalNamespace(windowRef) {
  return windowRef && typeof windowRef === "object"
    ? windowRef[GLOBAL_NAMESPACE_KEY] || null
    : null;
}

export async function initializeTampermonkeyRuntime(options = {}) {
  const windowRef =
    options.windowRef || (globalThis.window !== undefined ? globalThis.window : null);
  const documentRef =
    options.documentRef ||
    (windowRef?.document || null);
  const existingNamespace = getGlobalNamespace(windowRef);

  if (
    existingNamespace?.[RUNTIME_INIT_PROMISE_KEY] &&
    typeof existingNamespace[RUNTIME_INIT_PROMISE_KEY].then === "function"
  ) {
    return existingNamespace[RUNTIME_INIT_PROMISE_KEY];
  }

  if (existingNamespace && typeof existingNamespace.start === "function") {
    existingNamespace.start();
    return existingNamespace;
  }

  const runtimePromise = (async function initializeRuntimeInternal() {
    const localStorageRef =
      options.localStorageRef ||
      windowRef?.localStorage ||
      (typeof localStorage !== "undefined" ? localStorage : null);
    const configStore = createConfigStore({
      windowRef,
      localStorageRef,
      gmGetValue:
        options.gmGetValue ||
        (typeof GM_getValue === "function" ? GM_getValue : null),
      gmSetValue:
        options.gmSetValue ||
        (typeof GM_setValue === "function" ? GM_setValue : null),
    });

    let initialConfig = await configStore.load();
    try {
      const importResult = await configStore.importLegacyConfigIfAvailable({
        createInitialConfig: () => createRecommendedRuntimeConfig(),
      });
      initialConfig = importResult?.config || initialConfig;
      await configStore.save(initialConfig);
    } catch (error) {
      if (!(error instanceof ConfigPersistenceError)) {
        throw error;
      }
      initialConfig = await configStore.load();
      console.warn(
        "[autodarts-xconfig] config storage unavailable, running with non-persistent defaults",
        error
      );
    }
    const featureRegistry = createFeatureRegistry({
      debug: Boolean(options.debug),
      definitions: options.featureDefinitions,
    });

    const runtime = createBootstrap({
      windowRef,
      documentRef,
      config: initialConfig,
      featureDefinitions: featureRegistry.getDefinitions(),
    });
    let lastConfigStorageValue =
      localStorageRef && typeof localStorageRef.getItem === "function"
        ? localStorageRef.getItem(CONFIG_STORAGE_KEY)
        : null;
    let storageSyncAttached = false;

    function rememberStoredConfigSnapshot() {
      if (!localStorageRef || typeof localStorageRef.getItem !== "function") {
        lastConfigStorageValue = null;
        return;
      }
      lastConfigStorageValue = localStorageRef.getItem(CONFIG_STORAGE_KEY);
    }

    async function syncRuntimeFromStoredConfig() {
      if (!localStorageRef || typeof localStorageRef.getItem !== "function") {
        return runtime.getSnapshot();
      }

      const nextStoredValue = localStorageRef.getItem(CONFIG_STORAGE_KEY);
      if (nextStoredValue === lastConfigStorageValue) {
        return runtime.getSnapshot();
      }

      lastConfigStorageValue = nextStoredValue;
      const nextConfig = await configStore.load();
      runtime.updateConfig(nextConfig);
      return runtime.getSnapshot();
    }

    function onStorageSync(event) {
      const changedKey =
        typeof event?.key === "string" || event?.key === null ? event.key : "";
      if (changedKey && changedKey !== CONFIG_STORAGE_KEY) {
        return;
      }
      if (
        event?.storageArea &&
        localStorageRef &&
        event.storageArea !== localStorageRef
      ) {
        return;
      }

      Promise.resolve(syncRuntimeFromStoredConfig()).catch(() => {
        // Fail-soft on cross-tab sync; the next manual interaction will still reload config.
      });
    }

    function attachStorageSync() {
      if (
        storageSyncAttached ||
        !windowRef ||
        typeof windowRef.addEventListener !== "function"
      ) {
        return;
      }

      windowRef.addEventListener("storage", onStorageSync);
      storageSyncAttached = true;
    }

    function detachStorageSync() {
      if (
        !storageSyncAttached ||
        !windowRef ||
        typeof windowRef.removeEventListener !== "function"
      ) {
        storageSyncAttached = false;
        return;
      }

      windowRef.removeEventListener("storage", onStorageSync);
      storageSyncAttached = false;
    }

    const runtimeStart = runtime.start.bind(runtime);
    const runtimeStop = runtime.stop.bind(runtime);

    function startRuntimeWithStorageSync() {
      const result = runtimeStart();
      attachStorageSync();
      return result;
    }

    function stopRuntimeWithStorageSync() {
      detachStorageSync();
      return runtimeStop();
    }

    runtime.start = startRuntimeWithStorageSync;
    runtime.stop = stopRuntimeWithStorageSync;

    async function getConfig() {
      return configStore.load();
    }

    async function saveConfig(partialConfig = {}) {
      const nextConfig = await configStore.update(partialConfig);
      rememberStoredConfigSnapshot();
      runtime.updateConfig(nextConfig);
      return runtime.getSnapshot();
    }

    async function resetConfig() {
      const nextConfig = await configStore.reset();
      rememberStoredConfigSnapshot();
      runtime.updateConfig(nextConfig);
      return runtime.getSnapshot();
    }

    async function applyRecommendedDefaults() {
      const currentConfig = await configStore.load();
      const nextConfig = createRecommendedRuntimeConfig(currentConfig);
      await configStore.save(nextConfig);
      rememberStoredConfigSnapshot();
      runtime.updateConfig(nextConfig);
      return runtime.getSnapshot();
    }

    async function createSettingsExport(options = {}) {
      const currentConfig = await configStore.load();
      return createSettingsExportPayload(currentConfig, {
        ...options,
        appVersion: API_VERSION,
        descriptors: xconfigDescriptors,
      });
    }

    async function previewSettingsImport(payload, options = {}) {
      const currentConfig = await configStore.load();
      const analysis = analyzeSettingsImport(payload, currentConfig, {
        ...options,
        appVersion: API_VERSION,
        descriptors: xconfigDescriptors,
      });
      return analysis.report;
    }

    async function importSettings(payload, options = {}) {
      const transaction = await configStore.transact((currentConfig) => {
        const analysis = analyzeSettingsImport(payload, currentConfig, {
          ...options,
          appVersion: API_VERSION,
          descriptors: xconfigDescriptors,
        });
        return {
          config: analysis.report.status === "ready" ? analysis.config : null,
          result: analysis.report,
        };
      });

      if (transaction.persisted) {
        rememberStoredConfigSnapshot();
        runtime.updateConfig(transaction.config);
      }
      return {
        report: transaction.result,
        snapshot: runtime.getSnapshot(),
      };
    }

    async function persistentSetFeatureEnabled(featureRef, enabled) {
      const normalizedFeatureRef = String(featureRef || "");
      const snapshot = runtime.getSnapshot();
      const featureState =
        snapshot.features[normalizedFeatureRef] ||
        Object.values(snapshot.features).find(
          (feature) => feature?.configKey === normalizedFeatureRef
        ) ||
        null;
      const configKey = featureState?.configKey || normalizedFeatureRef;

      const nextConfig = await configStore.update(buildFeatureEnabledPatch(configKey, enabled));
      rememberStoredConfigSnapshot();
      runtime.updateConfig(nextConfig);
      return runtime.getSnapshot();
    }

    async function setThemeBackgroundImage(themeKey, dataUrl) {
      const normalizedThemeKey = normalizeThemeBackgroundHost(themeKey);
      const normalizedDataUrl = String(dataUrl || "").trim();

      if (!VALID_THEME_BACKGROUND_HOST_SET.has(normalizedThemeKey)) {
        return runtime.getSnapshot();
      }
      if (!normalizedDataUrl.startsWith("data:image/")) {
        return runtime.getSnapshot();
      }

      const nextConfig = await configStore.update({
        features: {
          themes: {
            [normalizedThemeKey]: {
              backgroundImageDataUrl: normalizedDataUrl,
            },
          },
        },
      });

      rememberStoredConfigSnapshot();
      runtime.updateConfig(nextConfig);
      return runtime.getSnapshot();
    }

    async function clearThemeBackgroundImage(themeKey) {
      const normalizedThemeKey = normalizeThemeBackgroundHost(themeKey);
      if (!VALID_THEME_BACKGROUND_HOST_SET.has(normalizedThemeKey)) {
        return runtime.getSnapshot();
      }

      const nextConfig = await configStore.update({
        features: {
          themes: {
            [normalizedThemeKey]: {
              backgroundImageDataUrl: "",
            },
          },
        },
      });

      rememberStoredConfigSnapshot();
      runtime.updateConfig(nextConfig);
      return runtime.getSnapshot();
    }

    function listFeatures() {
      return featureRegistry.listFeatures(runtime.getSnapshot());
    }

    runtime.attachPublicApi({
      start: startRuntimeWithStorageSync,
      stop: stopRuntimeWithStorageSync,
      getConfig,
      saveConfig,
      resetConfig,
      applyRecommendedDefaults,
      createSettingsExport,
      previewSettingsImport,
      importSettings,
      setFeatureEnabled: persistentSetFeatureEnabled,
      runFeatureAction: (featureRef, actionId, options) =>
        runtime.runFeatureAction(featureRef, actionId, options),
      setThemeBackgroundImage,
      clearThemeBackgroundImage,
      listFeatures,
    });

    runtime.start();

    const namespace = getGlobalNamespace(windowRef);
    ensureXConfigUi({
      windowRef,
      documentRef,
      runtime,
      runtimeApi: namespace || runtime,
    });
    if (namespace && typeof namespace === "object") {
      Object.defineProperty(namespace, "featureRegistry", {
        value: featureRegistry,
        configurable: true,
        enumerable: false,
        writable: false,
      });
      Object.defineProperty(namespace, "configStore", {
        value: configStore,
        configurable: true,
        enumerable: false,
        writable: false,
      });
      return namespace;
    }

    return Object.assign(runtime, {
      start: startRuntimeWithStorageSync,
      stop: stopRuntimeWithStorageSync,
      getConfig,
      saveConfig,
      resetConfig,
      applyRecommendedDefaults,
      createSettingsExport,
      previewSettingsImport,
      importSettings,
      setFeatureEnabled: persistentSetFeatureEnabled,
      runFeatureAction: (featureRef, actionId, options) =>
        runtime.runFeatureAction(featureRef, actionId, options),
      setThemeBackgroundImage,
      clearThemeBackgroundImage,
      listFeatures,
      featureRegistry,
      configStore,
    });
  })();

  if (windowRef && typeof windowRef === "object") {
    const namespace =
      windowRef[GLOBAL_NAMESPACE_KEY] && typeof windowRef[GLOBAL_NAMESPACE_KEY] === "object"
        ? windowRef[GLOBAL_NAMESPACE_KEY]
        : {};
    Object.defineProperty(namespace, RUNTIME_INIT_PROMISE_KEY, {
      value: runtimePromise,
      configurable: true,
      enumerable: false,
      writable: true,
    });
    windowRef[GLOBAL_NAMESPACE_KEY] = namespace;
  }

  try {
    return await runtimePromise;
  } finally {
    const namespace = getGlobalNamespace(windowRef);
    if (namespace && Object.hasOwn(namespace, RUNTIME_INIT_PROMISE_KEY)) {
      try {
        delete namespace[RUNTIME_INIT_PROMISE_KEY];
      } catch (_) {
        namespace[RUNTIME_INIT_PROMISE_KEY] = null;
      }
    }
  }
}
