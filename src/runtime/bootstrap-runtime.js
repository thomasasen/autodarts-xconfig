import { ConfigPersistenceError, createConfigStore } from "../config/config-store.js";
import { createBootstrap } from "../core/bootstrap.js";
import { createFeatureRegistry } from "../features/feature-registry.js";
import { ensureXConfigUi } from "../features/xconfig-ui/index.js";

const GLOBAL_NAMESPACE_KEY = "__adXConfig";
const RUNTIME_INIT_PROMISE_KEY = "__runtimeInitPromise";
const VALID_THEME_KEYS = new Set(["x01", "shanghai", "bermuda", "cricket", "bullOff"]);

function splitFeaturePath(featureKey) {
  return String(featureKey || "")
    .split(".")
    .map((part) => String(part || "").trim())
    .filter(Boolean);
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

function normalizeThemeKey(themeKey) {
  const normalized = String(themeKey || "").trim().toLowerCase();
  if (!normalized) {
    return "";
  }

  const aliases = {
    x01: "x01",
    shanghai: "shanghai",
    bermuda: "bermuda",
    cricket: "cricket",
    tactics: "cricket",
    "bull-off": "bullOff",
    bull_off: "bullOff",
    bulloff: "bullOff",
  };

  if (Object.prototype.hasOwnProperty.call(aliases, normalized)) {
    return aliases[normalized];
  }

  if (normalized === "bull off") {
    return "bullOff";
  }

  return "";
}

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
    options.windowRef || (typeof window !== "undefined" ? window : null);
  const documentRef =
    options.documentRef ||
    (windowRef && windowRef.document ? windowRef.document : null);
  const existingNamespace = getGlobalNamespace(windowRef);

  if (
    existingNamespace &&
    existingNamespace[RUNTIME_INIT_PROMISE_KEY] &&
    typeof existingNamespace[RUNTIME_INIT_PROMISE_KEY].then === "function"
  ) {
    return existingNamespace[RUNTIME_INIT_PROMISE_KEY];
  }

  if (existingNamespace && typeof existingNamespace.start === "function") {
    existingNamespace.start();
    return existingNamespace;
  }

  const runtimePromise = (async function initializeRuntimeInternal() {
    const configStore = createConfigStore({
      windowRef,
      localStorageRef:
        options.localStorageRef ||
        windowRef?.localStorage ||
        (typeof localStorage !== "undefined" ? localStorage : null),
      gmGetValue:
        options.gmGetValue ||
        (typeof GM_getValue === "function" ? GM_getValue : null),
      gmSetValue:
        options.gmSetValue ||
        (typeof GM_setValue === "function" ? GM_setValue : null),
    });

    let initialConfig = await configStore.load();
    try {
      const importResult = await configStore.importLegacyConfigIfAvailable();
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

    async function getConfig() {
      return configStore.load();
    }

    async function saveConfig(partialConfig = {}) {
      const nextConfig = await configStore.update(partialConfig);
      runtime.updateConfig(nextConfig);
      return runtime.getSnapshot();
    }

    async function resetConfig() {
      const nextConfig = await configStore.reset();
      runtime.updateConfig(nextConfig);
      return runtime.getSnapshot();
    }

    async function persistentSetFeatureEnabled(featureRef, enabled) {
      const normalizedFeatureRef = String(featureRef || "");
      const snapshot = runtime.getSnapshot();
      const featureState =
        snapshot.features[normalizedFeatureRef] ||
        Object.values(snapshot.features).find(
          (feature) => feature && feature.configKey === normalizedFeatureRef
        ) ||
        null;
      const configKey = featureState?.configKey || normalizedFeatureRef;

      const nextConfig = await configStore.update(buildFeatureEnabledPatch(configKey, enabled));

      runtime.updateConfig(nextConfig);
      return runtime.getSnapshot();
    }

    async function setThemeBackgroundImage(themeKey, dataUrl) {
      const normalizedThemeKey = normalizeThemeKey(themeKey);
      const normalizedDataUrl = String(dataUrl || "").trim();

      if (!VALID_THEME_KEYS.has(normalizedThemeKey)) {
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

      runtime.updateConfig(nextConfig);
      return runtime.getSnapshot();
    }

    async function clearThemeBackgroundImage(themeKey) {
      const normalizedThemeKey = normalizeThemeKey(themeKey);
      if (!VALID_THEME_KEYS.has(normalizedThemeKey)) {
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

      runtime.updateConfig(nextConfig);
      return runtime.getSnapshot();
    }

    function listFeatures() {
      return featureRegistry.listFeatures(runtime.getSnapshot());
    }

    runtime.attachPublicApi({
      getConfig,
      saveConfig,
      resetConfig,
      setFeatureEnabled: persistentSetFeatureEnabled,
      runFeatureAction: (featureRef, actionId) => runtime.runFeatureAction(featureRef, actionId),
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
      getConfig,
      saveConfig,
      resetConfig,
      setFeatureEnabled: persistentSetFeatureEnabled,
      runFeatureAction: (featureRef, actionId) => runtime.runFeatureAction(featureRef, actionId),
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
    if (namespace && Object.prototype.hasOwnProperty.call(namespace, RUNTIME_INIT_PROMISE_KEY)) {
      try {
        delete namespace[RUNTIME_INIT_PROMISE_KEY];
      } catch (_) {
        namespace[RUNTIME_INIT_PROMISE_KEY] = null;
      }
    }
  }
}
