import {
  CONFIG_STORAGE_KEY,
  ConfigPersistenceError,
  createConfigStore,
} from "../config/config-store.js";
import { readStorageValue, resolveLocalStorage } from "../config/storage-access.js";
import {
  analyzeSettingsImport,
  createSettingsExport as createSettingsExportPayload,
} from "../config/config-transfer.js";
import { setNestedValue, splitFeaturePath } from "../config/feature-path-utils.js";
import { API_VERSION, createBootstrap } from "../core/bootstrap.js";
import {
  createRecommendedRuntimeConfig,
  createRuntimeConfig,
  normalizeRuntimeConfig,
} from "../config/runtime-config.js";
import { createFeatureRegistry } from "../features/feature-registry.js";
import { ensureXConfigUi } from "../features/xconfig-ui/index.js";
import { xconfigDescriptors } from "../features/xconfig-ui/descriptors.js";
import { configureThemePresetAssets, ensureThemePresetAsset, hydrateThemePresetAssets, resolveThemePresetAsset } from "#theme-preset-assets";
import { readThemeAssetView, requiredThemeAssetKeys } from "../shared/theme-asset-selection.js";
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

function resolveLockManager(options, windowRef) {
  if (options.lockManager !== undefined) {
    return options.lockManager;
  }
  try {
    return windowRef?.navigator?.locks || null;
  } catch (_) {
    return null;
  }
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
    const localStorageRef = resolveLocalStorage({
      localStorageRef: options.localStorageRef,
      windowRef,
    });
    const modernStorage = typeof GM === "undefined" ? null : GM;
    const gmGetValue = options.gmGetValue || modernStorage?.getValue?.bind(modernStorage) || (typeof GM_getValue === "function" ? GM_getValue : null);
    const gmSetValue = options.gmSetValue || modernStorage?.setValue?.bind(modernStorage) || (typeof GM_setValue === "function" ? GM_setValue : null);
    const configStore = createConfigStore({
      windowRef,
      localStorageRef,
      gmGetValue,
      gmSetValue,
      lockManager: resolveLockManager(options, windowRef),
    });

    configureThemePresetAssets({
      gmGetValue,
      gmSetValue,
      gmRequest: options.gmRequest || (typeof GM_xmlhttpRequest === "function" ? GM_xmlhttpRequest : null),
    });
    let runtime = null;
    let failedAssetOperation = null;
    const assetView = () => readThemeAssetView(windowRef, documentRef, runtime?.getSnapshot?.().gameState || {});
    async function withAssetRetry(operation) {
      try {
        const result = await operation();
        failedAssetOperation = null;
        return result;
      } catch (error) {
        if (error?.code === "THEME_ASSET_FAILED") failedAssetOperation = () => withAssetRetry(operation);
        throw error;
      }
    }
    function changedAssetSelection(current, next) {
      const backgroundKey = "themes.globalBackground";
      const backgroundChanged = current.featureToggles?.[backgroundKey] !== next.featureToggles?.[backgroundKey] ||
        JSON.stringify(current.features?.themes?.globalBackground) !== JSON.stringify(next.features?.themes?.globalBackground);
      const surroundChanged = current.featureToggles?.boardSurround !== next.featureToggles?.boardSurround ||
        JSON.stringify(current.features?.boardSurround) !== JSON.stringify(next.features?.boardSurround);
      return { ...next, featureToggles: { ...next.featureToggles,
        [backgroundKey]: backgroundChanged && Boolean(next.featureToggles?.[backgroundKey] ?? next.features?.themes?.globalBackground?.enabled),
        boardSurround: surroundChanged && Boolean(next.featureToggles?.boardSurround ?? next.features?.boardSurround?.enabled),
      } };
    }
    async function prepareVisibleAssets(candidate) {
      for (let attempt = 0; attempt < 6; attempt++) {
        const required = requiredThemeAssetKeys(candidate, { ...assetView(), activating: true });
        await Promise.all(required.map(ensureThemePresetAsset));
        const latest = requiredThemeAssetKeys(candidate, { ...assetView(), activating: true });
        if (latest.every((key) => Boolean(resolveThemePresetAsset(key)))) return;
      }
      const error = new Error("Die Ansicht hat während des Ladens mehrfach gewechselt. Bitte erneut versuchen.");
      error.code = "THEME_ASSET_FAILED";
      throw error;
    }
    let initialConfig = null;
    try {
      initialConfig = await configStore.load();
      const importResult = await configStore.importLegacyConfigIfAvailable({
        createInitialConfig: () => createRecommendedRuntimeConfig(),
      });
      initialConfig = importResult?.config || initialConfig;
    } catch (error) {
      if (!(error instanceof ConfigPersistenceError)) {
        throw error;
      }
      initialConfig = initialConfig || normalizeRuntimeConfig();
      console.warn(
        "[autodarts-xconfig] config storage unavailable, running with non-persistent defaults",
        error
      );
    }
    // Only read already stored images at startup. Downloads happen after the UI mounts.
    await hydrateThemePresetAssets(requiredThemeAssetKeys(initialConfig, assetView())).catch(() => {});
    const featureRegistry = createFeatureRegistry({
      debug: Boolean(options.debug),
      definitions: options.featureDefinitions,
    });

    runtime = createBootstrap({
      windowRef,
      documentRef,
      config: initialConfig,
      featureDefinitions: featureRegistry.getDefinitions(),
    });
    let lastConfigStorageValue = readStorageValue(localStorageRef, CONFIG_STORAGE_KEY).value;
    let storageSyncAttached = false;

    function rememberStoredConfigSnapshot() {
      const storedValue = readStorageValue(localStorageRef, CONFIG_STORAGE_KEY);
      if (!storedValue.ok) {
        lastConfigStorageValue = null;
        return;
      }
      lastConfigStorageValue = storedValue.value;
    }

    async function syncRuntimeFromStoredConfig() {
      const storedValue = readStorageValue(localStorageRef, CONFIG_STORAGE_KEY);
      if (!storedValue.ok) {
        return runtime.getSnapshot();
      }

      const nextStoredValue = storedValue.value;
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

    async function persistConfigPatch(patch) {
      const transaction = await configStore.transact(async (currentConfig) => {
        const candidate = createRuntimeConfig(currentConfig);
        candidate.update(patch);
        const next = candidate.getNormalized();
        await prepareVisibleAssets(changedAssetSelection(currentConfig, next));
        return { config: next };
      });
      const nextConfig = transaction.config;
      rememberStoredConfigSnapshot();
      runtime.updateConfig(nextConfig);
      return runtime.getSnapshot();
    }

    async function saveConfig(partialConfig = {}) {
      const patch = structuredClone(partialConfig);
      return withAssetRetry(() => persistConfigPatch(patch));
    }

    async function resetConfig() {
      const nextConfig = await configStore.reset();
      rememberStoredConfigSnapshot();
      runtime.updateConfig(nextConfig);
      return runtime.getSnapshot();
    }

    async function applyRecommendedDefaults() {
      const transaction = await configStore.transact((currentConfig) => ({
        config: createRecommendedRuntimeConfig(currentConfig),
      }));
      const nextConfig = transaction.config;
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

    async function persistSettingsImport(payload, options) {
      const transaction = await configStore.transact(async (currentConfig) => {
        const analysis = analyzeSettingsImport(payload, currentConfig, {
          ...options,
          appVersion: API_VERSION,
          descriptors: xconfigDescriptors,
        });
        if (analysis.report.status === "ready") {
          await prepareVisibleAssets(analysis.config);
        }
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

    async function importSettings(payload, options = {}) {
      return withAssetRetry(() => persistSettingsImport(payload, options));
    }

    async function retryThemeAssets() {
      if (failedAssetOperation) return failedAssetOperation();
      return Promise.all(requiredThemeAssetKeys(await configStore.load(), { ...assetView(), activating: true }).map(ensureThemePresetAsset));
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

      return saveConfig(buildFeatureEnabledPatch(configKey, enabled));
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

      return saveConfig({
        features: {
          themes: {
            [normalizedThemeKey]: {
              backgroundImageDataUrl: normalizedDataUrl,
            },
          },
        },
      });

    }

    async function clearThemeBackgroundImage(themeKey) {
      const normalizedThemeKey = normalizeThemeBackgroundHost(themeKey);
      if (!VALID_THEME_BACKGROUND_HOST_SET.has(normalizedThemeKey)) {
        return runtime.getSnapshot();
      }

      return saveConfig({
        features: {
          themes: {
            [normalizedThemeKey]: {
              backgroundImageDataUrl: "",
            },
          },
        },
      });

    }

    function listFeatures() {
      return featureRegistry.listFeatures(runtime.getSnapshot());
    }

    runtime.attachPublicApi({
      start: startRuntimeWithStorageSync,
      stop: stopRuntimeWithStorageSync,
      getConfig,
      saveConfig,
      retryThemeAssets,
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
      retryThemeAssets,
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
