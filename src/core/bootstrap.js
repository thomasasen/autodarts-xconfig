import { createRuntimeConfig } from "../config/runtime-config.js";
import { dartRules } from "../domain/dart-rules.js";
import { mountCheckoutScorePulse } from "../features/checkout-score-pulse/index.js";
import { createRafScheduler } from "../shared/raf-scheduler.js";
import { createDomGuards } from "./dom-guards.js";
import { createEventBus } from "./event-bus.js";
import { createGameStateStore } from "./game-state-store.js";
import { createListenerRegistry } from "./listener-registry.js";
import { createObserverRegistry } from "./observer-registry.js";

const GLOBAL_NAMESPACE_KEY = "__adXConfig";
const API_VERSION = "0.1.0";

const FEATURE_DEFINITIONS = [
  {
    featureKey: "checkout-score-pulse",
    configKey: "checkoutScorePulse",
    mount: mountCheckoutScorePulse,
  },
];

function featureDefinitionByConfigKey(configKey) {
  return FEATURE_DEFINITIONS.find((feature) => feature.configKey === configKey) || null;
}

function featureDefinitionByFeatureKey(featureKey) {
  return FEATURE_DEFINITIONS.find((feature) => feature.featureKey === featureKey) || null;
}

function getAffectedFeatureDefinitions(partialConfig = {}) {
  const configKeys = new Set();

  if (partialConfig && typeof partialConfig === "object") {
    Object.keys(partialConfig.featureToggles || {}).forEach((key) => {
      configKeys.add(String(key));
    });

    Object.keys(partialConfig.features || {}).forEach((key) => {
      configKeys.add(String(key));
    });
  }

  return FEATURE_DEFINITIONS.filter((definition) => {
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

  const gameState = createGameStateStore({
    eventBus,
    windowRef,
    documentRef,
  });

  const featureCleanups = new Map();
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
    namespace.inspect = inspectRuntime;

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

    FEATURE_DEFINITIONS.forEach((definition) => {
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
      features: FEATURE_DEFINITIONS.reduce((result, definition) => {
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

    FEATURE_DEFINITIONS.forEach((definition) => {
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
    const affectedDefinitions = getAffectedFeatureDefinitions(partialConfig);
    config.update(partialConfig);
    refreshFeatures({
      remountFeatureKeys: affectedDefinitions.map((definition) => definition.featureKey),
    });
    syncGlobalNamespace();
    eventBus.emit("runtime:config-updated", getSnapshot());
    return getSnapshot();
  }

  function setFeatureEnabled(featureRef, enabled) {
    const definition =
      featureDefinitionByFeatureKey(String(featureRef || "")) ||
      featureDefinitionByConfigKey(String(featureRef || ""));

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

  const api = {
    start,
    stop,
    getSnapshot,
    updateConfig,
    setFeatureEnabled,
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
