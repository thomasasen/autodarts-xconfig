import { createRuntimeConfig } from "../config/runtime-config.js";
import { dartRules } from "../domain/dart-rules.js";
import { defaultFeatureDefinitions } from "../features/feature-registry.js";
import { createRafScheduler } from "../shared/raf-scheduler.js";
import { createDomGuards } from "./dom-guards.js";
import { createEventBus } from "./event-bus.js";
import { createGameStateStore } from "./game-state-store.js";
import { createListenerRegistry } from "./listener-registry.js";
import { createObserverRegistry } from "./observer-registry.js";

const GLOBAL_NAMESPACE_KEY = "__adXConfig";
const API_VERSION = "2.0.29";

function normalizeFeatureDefinitions(definitions) {
  if (!Array.isArray(definitions) || !definitions.length) {
    return [];
  }

  const seenFeatureKeys = new Set();

  return definitions.reduce((result, definition) => {
    if (!definition || typeof definition !== "object") {
      return result;
    }

    const featureKey = String(definition.featureKey || "").trim();
    const configKey = String(definition.configKey || "").trim();
    const initialize = definition.initialize || definition.mount;

    if (!featureKey || !configKey || typeof initialize !== "function") {
      return result;
    }

    if (seenFeatureKeys.has(featureKey)) {
      return result;
    }

    seenFeatureKeys.add(featureKey);
    result.push({
      ...definition,
      featureKey,
      configKey,
      mount: initialize,
      initialize,
    });
    return result;
  }, []);
}

function createFeatureDefinitionIndex(featureDefinitions) {
  const byFeatureKey = new Map();
  const byConfigKey = new Map();

  featureDefinitions.forEach((definition) => {
    if (!definition || typeof definition !== "object") {
      return;
    }
    if (!byFeatureKey.has(definition.featureKey)) {
      byFeatureKey.set(definition.featureKey, definition);
    }
    if (!byConfigKey.has(definition.configKey)) {
      byConfigKey.set(definition.configKey, definition);
    }
  });

  return {
    byFeatureKey,
    byConfigKey,
  };
}

function resolveFeatureDefinitionByRef(featureDefinitionIndex, featureRef) {
  const normalizedRef = String(featureRef || "").trim();
  if (!normalizedRef) {
    return null;
  }

  return (
    featureDefinitionIndex.byFeatureKey.get(normalizedRef) ||
    featureDefinitionIndex.byConfigKey.get(normalizedRef) ||
    null
  );
}

function getAffectedFeatureDefinitions(featureDefinitions, partialConfig = {}) {
  const configKeys = new Set();

  function collectNestedConfigKeys(value, prefix = "") {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return;
    }

    Object.keys(value).forEach((rawKey) => {
      const key = String(rawKey || "").trim();
      if (!key) {
        return;
      }

      const nextPrefix = prefix ? `${prefix}.${key}` : key;
      const entry = value[key];
      const isObjectEntry =
        Boolean(entry) && typeof entry === "object" && !Array.isArray(entry);

      configKeys.add(nextPrefix);

      if (isObjectEntry) {
        collectNestedConfigKeys(entry, nextPrefix);
      }
    });
  }

  if (partialConfig && typeof partialConfig === "object") {
    collectNestedConfigKeys(partialConfig.featureToggles || {});
    collectNestedConfigKeys(partialConfig.features || {});
  }

  return featureDefinitions.filter((definition) => {
    return configKeys.has(definition.configKey);
  });
}

export function createBootstrap(options = {}) {
  const windowRef =
    options.windowRef || (typeof window !== "undefined" ? window : null);
  const documentRef =
    options.documentRef ||
    (windowRef && windowRef.document ? windowRef.document : null);

  const eventBus = createEventBus();
  const observers = createObserverRegistry();
  const listeners = createListenerRegistry();
  const domGuards = createDomGuards({ documentRef });
  const config = createRuntimeConfig(options.config || {});
  const featureDefinitions = normalizeFeatureDefinitions(
    options.featureDefinitions || defaultFeatureDefinitions
  );
  const featureDefinitionIndex = createFeatureDefinitionIndex(featureDefinitions);

  const gameState = createGameStateStore({
    eventBus,
    windowRef,
    documentRef,
  });

  const featureCleanups = new Map();
  const extraPublicApi = {};
  let started = false;

  const context = {
    eventBus,
    gameState,
    domain: dartRules,
    config,
    domGuards,
    registries: {
      observers,
      listeners,
    },
    helpers: {
      createRafScheduler: (callback) => createRafScheduler(callback, { windowRef }),
    },
    windowRef,
    documentRef,
  };

  function syncGlobalNamespace() {
    if (!windowRef) {
      return;
    }

    const existing = windowRef[GLOBAL_NAMESPACE_KEY];
    const namespace =
      existing && typeof existing === "object" ? existing : {};

    namespace.apiVersion = API_VERSION;
    namespace.started = started;
    namespace.start = start;
    namespace.stop = stop;
    namespace.getSnapshot = getSnapshot;
    namespace.updateConfig = updateConfig;
    namespace.setFeatureEnabled = setFeatureEnabled;
    namespace.runFeatureAction = runFeatureAction;
    namespace.inspect = inspectRuntime;
    Object.assign(namespace, extraPublicApi);

    windowRef[GLOBAL_NAMESPACE_KEY] = namespace;
  }

  function mountFeature(definition) {
    if (!definition || featureCleanups.has(definition.featureKey)) {
      return;
    }

    const cleanup = definition.mount(context);
    featureCleanups.set(
      definition.featureKey,
      typeof cleanup === "function" ? cleanup : () => {}
    );
  }

  function unmountFeature(featureKey) {
    const cleanup = featureCleanups.get(featureKey);
    if (!cleanup) {
      return;
    }

    try {
      cleanup();
    } catch (_) {
      // Keep teardown robust even if a feature cleanup fails.
    }

    featureCleanups.delete(featureKey);
  }

  function remountFeature(definition) {
    if (!definition) {
      return;
    }

    unmountFeature(definition.featureKey);
    mountFeature(definition);
  }

  function refreshFeatures(options = {}) {
    const remountFeatureKeys = new Set(
      Array.isArray(options.remountFeatureKeys) ? options.remountFeatureKeys : []
    );

    featureDefinitions.forEach((definition) => {
      const enabled = config.isFeatureEnabled(definition.configKey);
      if (!started || !enabled) {
        unmountFeature(definition.featureKey);
        return;
      }

      if (remountFeatureKeys.has(definition.featureKey) && featureCleanups.has(definition.featureKey)) {
        remountFeature(definition);
        return;
      }

      mountFeature(definition);
    });
  }

  function getSnapshot() {
    return {
      started,
      gameState: gameState.getSnapshot(),
      features: featureDefinitions.reduce((result, definition) => {
        result[definition.featureKey] = {
          configKey: definition.configKey,
          enabled: config.isFeatureEnabled(definition.configKey),
          mounted: featureCleanups.has(definition.featureKey),
          config: config.getFeatureConfig(definition.configKey),
        };
        return result;
      }, {}),
    };
  }

  function inspectRuntime() {
    return {
      ...getSnapshot(),
      observerCount: observers.size(),
      listenerCount: listeners.size(),
    };
  }

  function start() {
    if (started) {
      syncGlobalNamespace();
      return api;
    }

    started = true;
    gameState.start();
    refreshFeatures();
    eventBus.emit("runtime:started", getSnapshot());
    syncGlobalNamespace();

    return api;
  }

  function stop() {
    if (!started) {
      syncGlobalNamespace();
      return api;
    }

    featureDefinitions.forEach((definition) => {
      unmountFeature(definition.featureKey);
    });

    observers.disconnectAll();
    listeners.removeAll();
    gameState.stop();

    started = false;
    eventBus.emit("runtime:stopped", getSnapshot());
    syncGlobalNamespace();

    return api;
  }

  function updateConfig(partialConfig = {}) {
    const affectedDefinitions = getAffectedFeatureDefinitions(
      featureDefinitions,
      partialConfig
    );
    config.update(partialConfig);
    refreshFeatures({
      remountFeatureKeys: affectedDefinitions.map((definition) => definition.featureKey),
    });
    syncGlobalNamespace();
    eventBus.emit("runtime:config-updated", getSnapshot());
    return getSnapshot();
  }

  function setFeatureEnabled(featureRef, enabled) {
    const definition = resolveFeatureDefinitionByRef(featureDefinitionIndex, featureRef);

    const configKey = definition ? definition.configKey : String(featureRef || "");
    config.setFeatureEnabled(configKey, enabled);

    refreshFeatures();
    syncGlobalNamespace();
    eventBus.emit("runtime:feature-toggled", {
      feature: configKey,
      enabled: config.isFeatureEnabled(configKey),
    });

    return config.isFeatureEnabled(configKey);
  }

  function runFeatureAction(featureRef, actionId) {
    const definition = resolveFeatureDefinitionByRef(featureDefinitionIndex, featureRef);

    if (!definition || typeof definition.runAction !== "function") {
      return Promise.reject(new Error("Unsupported feature action."));
    }

    try {
      return Promise.resolve(
        definition.runAction({
          actionId: String(actionId || "").trim(),
          featureKey: definition.featureKey,
          configKey: definition.configKey,
          featureConfig: config.getFeatureConfig(definition.configKey),
          context,
        })
      );
    } catch (error) {
      return Promise.reject(error);
    }
  }

  function attachPublicApi(entries = {}) {
    if (!entries || typeof entries !== "object") {
      return api;
    }

    Object.keys(entries).forEach((key) => {
      const normalizedKey = String(key || "").trim();
      if (!normalizedKey) {
        return;
      }
      extraPublicApi[normalizedKey] = entries[normalizedKey];
    });

    syncGlobalNamespace();
    return api;
  }

  const api = {
    start,
    stop,
    getSnapshot,
    updateConfig,
    setFeatureEnabled,
    runFeatureAction,
    attachPublicApi,
    context,
  };

  syncGlobalNamespace();
  return api;
}

export function initializeRuntime(options = {}) {
  const windowRef =
    options.windowRef || (typeof window !== "undefined" ? window : null);

  if (
    windowRef &&
    typeof windowRef[GLOBAL_NAMESPACE_KEY]?.start === "function" &&
    typeof windowRef[GLOBAL_NAMESPACE_KEY]?.stop === "function"
  ) {
    windowRef[GLOBAL_NAMESPACE_KEY].start();
    return windowRef[GLOBAL_NAMESPACE_KEY];
  }

  const runtime = createBootstrap(options);
  runtime.start();
  return runtime;
}


