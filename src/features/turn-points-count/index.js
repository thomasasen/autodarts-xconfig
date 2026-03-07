import { ensureAnimeLoaded, getAnime } from "../../vendors/index.js";
import { stopAnimation, updateTurnPoints } from "./logic.js";

const FEATURE_KEY = "turn-points-count";
const OBSERVER_KEY = `${FEATURE_KEY}:dom-observer`;
const LISTENER_KEYS = Object.freeze({
  visibility: `${FEATURE_KEY}:document-visibility`,
});

export function initializeTurnPointsCount(context = {}) {
  const documentRef = context.documentRef || (typeof document !== "undefined" ? document : null);
  const windowRef = context.windowRef || (typeof window !== "undefined" ? window : null);
  const observerRegistry = context.registries?.observers;
  const listenerRegistry = context.registries?.listeners;
  const eventBus = context.eventBus;
  const gameState = context.gameState;
  const config = context.config;
  const schedulerFactory = context.helpers?.createRafScheduler;

  if (!documentRef || typeof schedulerFactory !== "function") {
    return () => {};
  }

  const featureConfig =
    config && typeof config.getFeatureConfig === "function"
      ? config.getFeatureConfig("turnPointsCount")
      : {
          durationMs: 416,
        };

  const state = {
    lastValueByNode: new Map(),
    renderedValueByNode: new Map(),
    targetValueByNode: new Map(),
    activeRafByNode: new Map(),
    activeAnimeByNode: new Map(),
  };
  let animeRef = getAnime(windowRef);

  function update() {
    updateTurnPoints({
      documentRef,
      state,
      durationMs: featureConfig.durationMs,
      animeRef,
      windowRef,
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

  const unsubscribeEventBus =
    eventBus && typeof eventBus.on === "function"
      ? eventBus.on("game-state:updated", () => scheduler.schedule())
      : () => {};
  const unsubscribeGameState =
    gameState && typeof gameState.subscribe === "function"
      ? gameState.subscribe(() => scheduler.schedule())
      : () => {};

  ensureAnimeLoaded(windowRef).then((loadedAnime) => {
    if (loadedAnime) {
      animeRef = loadedAnime;
      scheduler.schedule();
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

    updateTurnPoints({
      documentRef,
      state,
      durationMs: featureConfig.durationMs,
      animeRef: null,
      windowRef,
    });
    const scoreNodes = Array.from(documentRef.querySelectorAll?.("p.ad-ext-turn-points") || []);
    scoreNodes.forEach((node) => stopAnimation(node, state, windowRef));
  };
}

export const mountTurnPointsCount = initializeTurnPointsCount;
export const initialize = initializeTurnPointsCount;
export const mount = initializeTurnPointsCount;
