import {
  clearDartMarkerEmphasis,
  createDartMarkerEmphasisState,
  updateDartMarkerEmphasis,
} from "./logic.js";
import { STYLE_ID, buildStyleText, resolveDartMarkerEmphasisConfig } from "./style.js";

const FEATURE_KEY = "dart-marker-emphasis";
const OBSERVER_KEY = `${FEATURE_KEY}:dom-observer`;
const LISTENER_KEYS = Object.freeze({
  visibility: `${FEATURE_KEY}:document-visibility`,
});

export function initializeDartMarkerEmphasis(context = {}) {
  const documentRef = context.documentRef || (typeof document !== "undefined" ? document : null);
  const windowRef = context.windowRef || (typeof window !== "undefined" ? window : null);
  const domGuards = context.domGuards;
  const observerRegistry = context.registries?.observers;
  const listenerRegistry = context.registries?.listeners;
  const gameState = context.gameState;
  const config = context.config;
  const schedulerFactory = context.helpers?.createRafScheduler;

  if (!documentRef || !domGuards || typeof schedulerFactory !== "function") {
    return () => {};
  }

  const featureConfig =
    config && typeof config.getFeatureConfig === "function"
      ? config.getFeatureConfig("dartMarkerEmphasis")
      : {
          size: 6,
          color: "rgb(49, 130, 206)",
          effect: "glow",
          opacityPercent: 85,
          outline: "aus",
        };
  const visualConfig = resolveDartMarkerEmphasisConfig(featureConfig);

  domGuards.ensureStyle(STYLE_ID, buildStyleText());

  const state = createDartMarkerEmphasisState();

  function update() {
    updateDartMarkerEmphasis({
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
  }

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

    clearDartMarkerEmphasis(state);
    domGuards.removeNodeById(STYLE_ID);
  };
}

export const mountDartMarkerEmphasis = initializeDartMarkerEmphasis;
export const initialize = initializeDartMarkerEmphasis;
export const mount = initializeDartMarkerEmphasis;
