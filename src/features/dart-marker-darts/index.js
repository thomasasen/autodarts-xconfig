import {
  clearDartMarkerDartsState,
  createDartMarkerDartsState,
  updateDartMarkerDarts,
} from "./logic.js";
import { STYLE_ID, buildStyleText, resolveDartMarkerDartsConfig } from "./style.js";

const FEATURE_KEY = "dart-marker-darts";
const OBSERVER_KEY = `${FEATURE_KEY}:dom-observer`;
const LISTENER_KEYS = Object.freeze({
  visibility: `${FEATURE_KEY}:document-visibility`,
  resize: `${FEATURE_KEY}:window-resize`,
});

export function initializeDartMarkerDarts(context = {}) {
  const documentRef = context.documentRef || (typeof document !== "undefined" ? document : null);
  const windowRef = context.windowRef || (typeof window !== "undefined" ? window : null);
  const domGuards = context.domGuards;
  const observerRegistry = context.registries?.observers;
  const listenerRegistry = context.registries?.listeners;
  const eventBus = context.eventBus;
  const gameState = context.gameState;
  const config = context.config;
  const schedulerFactory = context.helpers?.createRafScheduler;

  if (!documentRef || !domGuards || typeof schedulerFactory !== "function") {
    return () => {};
  }

  const featureConfig =
    config && typeof config.getFeatureConfig === "function"
      ? config.getFeatureConfig("dartMarkerDarts")
      : {
          design: "autodarts",
          animateDarts: true,
          sizePercent: 100,
          hideOriginalMarkers: false,
          flightSpeed: "standard",
        };
  const visualConfig = resolveDartMarkerDartsConfig(featureConfig);

  domGuards.ensureStyle(STYLE_ID, buildStyleText());

  const state = createDartMarkerDartsState(windowRef);

  function update() {
    updateDartMarkerDarts({
      documentRef,
      state,
      visualConfig,
    });
  }

  const scheduler = schedulerFactory(update, { windowRef });
  const rootNode = documentRef.documentElement || documentRef.body || documentRef;

  if (observerRegistry && typeof observerRegistry.registerMutationObserver === "function") {
    observerRegistry.registerMutationObserver({
      key: OBSERVER_KEY,
      target: rootNode,
      callback: () => scheduler.schedule(),
      observeOptions: {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
      },
      MutationObserverRef: windowRef?.MutationObserver,
    });
  }

  if (listenerRegistry && typeof listenerRegistry.register === "function") {
    listenerRegistry.register({
      key: LISTENER_KEYS.visibility,
      target: documentRef,
      type: "visibilitychange",
      handler: () => scheduler.schedule(),
    });
    listenerRegistry.register({
      key: LISTENER_KEYS.resize,
      target: windowRef,
      type: "resize",
      handler: () => scheduler.schedule(),
      options: { passive: true },
    });
  }

  const unsubscribeEventBus =
    eventBus && typeof eventBus.on === "function"
      ? eventBus.on("game-state:updated", () => scheduler.schedule())
      : () => {};
  const unsubscribeGameState =
    gameState && typeof gameState.subscribe === "function"
      ? gameState.subscribe(() => scheduler.schedule())
      : () => {};

  scheduler.schedule();
  let cleanedUp = false;

  return function cleanup() {
    if (cleanedUp) {
      return;
    }
    cleanedUp = true;

    scheduler.cancel();

    try {
      unsubscribeEventBus();
    } catch (_) {
      // fail-soft
    }
    try {
      unsubscribeGameState();
    } catch (_) {
      // fail-soft
    }

    if (observerRegistry && typeof observerRegistry.disconnect === "function") {
      observerRegistry.disconnect(OBSERVER_KEY);
    }
    if (listenerRegistry && typeof listenerRegistry.remove === "function") {
      Object.values(LISTENER_KEYS).forEach((key) => listenerRegistry.remove(key));
    }

    clearDartMarkerDartsState(state);
    domGuards.removeNodeById(STYLE_ID);
  };
}

export const mountDartMarkerDarts = initializeDartMarkerDarts;
export const initialize = initializeDartMarkerDarts;
export const mount = initializeDartMarkerDarts;
