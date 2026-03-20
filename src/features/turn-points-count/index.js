import { ensureAnimeLoaded, getAnime } from "../../vendors/index.js";
import { collectScoreNodes, stopAnimation, updateTurnPoints } from "./logic.js";
import { STYLE_ID, buildStyleText } from "./style.js";

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
  const domGuards = context.domGuards;
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
          flashOnChange: true,
        };

  const state = {
    lastValueByNode: new Map(),
    renderedValueByNode: new Map(),
    targetValueByNode: new Map(),
    activeRafByNode: new Map(),
    activeAnimeByNode: new Map(),
  };
  let animeRef = getAnime(windowRef);
  let disposed = false;

  if (domGuards && typeof domGuards.ensureStyle === "function") {
    domGuards.ensureStyle(STYLE_ID, buildStyleText());
  }

  function update() {
    updateTurnPoints({
      documentRef,
      state,
      durationMs: featureConfig.durationMs,
      flashEnabled: featureConfig.flashOnChange !== false,
      animeRef,
      windowRef,
    });
  }

  const scheduler = schedulerFactory(update, { windowRef });
  const rootNode = documentRef.documentElement || documentRef.body || documentRef;
  const isAnimatingScoreNode = (node) => {
    const candidate = node?.nodeType === 3 ? node.parentNode || null : node;
    return (
      state.activeAnimeByNode.has(candidate) ||
      state.activeRafByNode.has(candidate)
    );
  };

  if (observerRegistry && typeof observerRegistry.registerMutationObserver === "function") {
    observerRegistry.registerMutationObserver({
      key: OBSERVER_KEY,
      target: rootNode,
      callback: (mutations = []) => {
        if (
          Array.isArray(mutations) &&
          mutations.length &&
          mutations.every((mutation) => {
            return mutation?.type === "characterData" && isAnimatingScoreNode(mutation?.target || null);
          })
        ) {
          return;
        }
        scheduler.schedule();
      },
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

  const unsubscribeGameState =
    gameState && typeof gameState.subscribe === "function"
      ? gameState.subscribe(() => scheduler.schedule())
      : () => {};

  ensureAnimeLoaded(windowRef).then((loadedAnime) => {
    if (disposed || !loadedAnime) {
      return;
    }
    animeRef = loadedAnime;
    scheduler.schedule();
  });

  scheduler.schedule();
  let cleanedUp = false;

  return function cleanup() {
    if (cleanedUp) {
      return;
    }
    cleanedUp = true;
    disposed = true;
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

    updateTurnPoints({
      documentRef,
      state,
      durationMs: featureConfig.durationMs,
      flashEnabled: featureConfig.flashOnChange !== false,
      animeRef: null,
      windowRef,
    });
    const scoreNodes = collectScoreNodes(documentRef);
    scoreNodes.forEach((node) => stopAnimation(node, state, windowRef));
    if (domGuards && typeof domGuards.removeNodeById === "function") {
      domGuards.removeNodeById(STYLE_ID);
    }
  };
}

export const mountTurnPointsCount = initializeTurnPointsCount;
export const initialize = initializeTurnPointsCount;
export const mount = initializeTurnPointsCount;
