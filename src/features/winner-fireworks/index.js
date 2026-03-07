import { ensureConfettiLoaded, getConfetti } from "../../vendors/index.js";
import {
  createWinnerFireworksState,
  getWinnerSignal,
  startWinnerFireworks,
  stopWinnerFireworks,
  syncWinnerFireworks,
} from "./logic.js";
import { STYLE_ID, buildStyleText, resolveWinnerVisualConfig } from "./style.js";

const FEATURE_KEY = "winner-fireworks";
const OBSERVER_KEY = `${FEATURE_KEY}:dom-observer`;
const LISTENER_KEYS = Object.freeze({
  resize: `${FEATURE_KEY}:window-resize`,
  visibility: `${FEATURE_KEY}:document-visibility`,
  pointerDown: `${FEATURE_KEY}:window-pointerdown`,
});

export function initializeWinnerFireworks(context = {}) {
  const documentRef = context.documentRef || (typeof document !== "undefined" ? document : null);
  const windowRef = context.windowRef || (typeof window !== "undefined" ? window : null);
  const domGuards = context.domGuards;
  const observerRegistry = context.registries?.observers;
  const listenerRegistry = context.registries?.listeners;
  const eventBus = context.eventBus;
  const gameState = context.gameState;
  const config = context.config;
  const schedulerFactory = context.helpers?.createRafScheduler;

  if (!documentRef || !windowRef || !domGuards || typeof schedulerFactory !== "function") {
    return () => {};
  }

  const featureConfig =
    config && typeof config.getFeatureConfig === "function"
      ? config.getFeatureConfig("winnerFireworks")
      : {
          style: "realistic",
          colorTheme: "autodarts",
          intensity: "standard",
          includeBullOut: true,
          pointerDismiss: true,
        };

  const visualConfig = resolveWinnerVisualConfig(featureConfig);
  domGuards.ensureStyle(STYLE_ID, buildStyleText());

  const state = createWinnerFireworksState({
    documentRef,
    windowRef,
    domGuards,
    visualConfig,
    confettiFactory: getConfetti(windowRef),
  });

  function update() {
    const signal = getWinnerSignal({
      documentRef,
      gameState,
      visualConfig,
    });
    syncWinnerFireworks(state, signal);
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
        attributes: true,
        attributeFilter: ["class", "style"],
      },
      MutationObserverRef: windowRef?.MutationObserver,
    });
  }

  if (listenerRegistry && typeof listenerRegistry.register === "function") {
    listenerRegistry.register({
      key: LISTENER_KEYS.resize,
      target: windowRef,
      type: "resize",
      handler: () => scheduler.schedule(),
      options: { passive: true },
    });
    listenerRegistry.register({
      key: LISTENER_KEYS.visibility,
      target: documentRef,
      type: "visibilitychange",
      handler: () => scheduler.schedule(),
    });
    listenerRegistry.register({
      key: LISTENER_KEYS.pointerDown,
      target: windowRef,
      type: "pointerdown",
      handler: () => {
        if (!visualConfig.pointerDismiss || !state.running) {
          return;
        }
        state.dismissedForCurrentWin = true;
        stopWinnerFireworks(state);
      },
      options: { passive: true, capture: true },
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

  ensureConfettiLoaded(windowRef).then((confettiFactory) => {
    if (!confettiFactory) {
      return;
    }
    state.confettiFactory = confettiFactory;
    if (state.lastSignalActive && !state.running && !state.dismissedForCurrentWin) {
      startWinnerFireworks(state);
    }
  });

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

    stopWinnerFireworks(state);
    domGuards.removeNodeById(STYLE_ID);
  };
}

export const mountWinnerFireworks = initializeWinnerFireworks;
export const initialize = initializeWinnerFireworks;
export const mount = initializeWinnerFireworks;
