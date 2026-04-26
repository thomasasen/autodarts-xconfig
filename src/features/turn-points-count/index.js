import {
  ensureAnimeLoaded,
  ensureOdometerLoaded,
  getAnime,
  getOdometer,
} from "../../vendors/index.js";
import {
  releaseElectricFilterDefs,
  retainElectricFilterDefs,
} from "../../shared/electric-border-engine.js";
import {
  collectScoreNodes,
  isNodeWithinActiveScoreAnimation,
  stopAnimation,
  updateTurnPoints,
} from "./logic.js";
import { STYLE_ID, buildStyleText } from "./style.js";
import {
  createTurnSurfaceObserveOptions,
  findTurnContainer,
} from "../shared/turn-surface-adapter.js";

const FEATURE_KEY = "turn-points-count";
const OBSERVER_KEY = `${FEATURE_KEY}:dom-observer`;
const LISTENER_KEYS = Object.freeze({
  visibility: `${FEATURE_KEY}:document-visibility`,
});

export function initializeTurnPointsCount(context = {}) {
  const documentRef = context.documentRef || (typeof document !== "undefined" ? document : null);
  const windowRef = context.windowRef || (typeof globalThis.window !== "undefined" ? globalThis.window : null);
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
          countEffect: "countup",
          flashOnChange: true,
          flashMode: "on-change",
        };

  const state = {
    lastValueByNode: new Map(),
    renderedValueByNode: new Map(),
    targetValueByNode: new Map(),
    activeRafByNode: new Map(),
    activeAnimeByNode: new Map(),
    activeCountUpByNode: new Map(),
    flashFrameByScoreNode: new Map(),
    flashRafByNode: new Map(),
    flashTimeoutByNode: new Map(),
    scoreNodeCache: [],
  };
  let animeRef = getAnime(windowRef);
  let odometerPluginRef = getOdometer();
  let disposed = false;
  let electricDefsRetained = false;

  if (domGuards && typeof domGuards.ensureStyle === "function") {
    domGuards.ensureStyle(STYLE_ID, buildStyleText());
    retainElectricFilterDefs({ documentRef, domGuards });
    electricDefsRetained = true;
  }

  function update() {
    updateTurnPoints({
      documentRef,
      state,
      durationMs: featureConfig.durationMs,
      flashEnabled: featureConfig.flashOnChange !== false,
      flashMode: featureConfig.flashMode,
      flashAfterglowMs: featureConfig.flashOnChange !== false ? 750 : 0,
      animeRef,
      countEffect: featureConfig.countEffect,
      odometerPluginRef,
      windowRef,
    });
  }

  const scheduler = schedulerFactory(update, { windowRef });
  const initialScoreNode = collectScoreNodes(documentRef, state)[0] || null;
  const scoreContainer = initialScoreNode?.closest?.("#ad-ext-turn")
    ? initialScoreNode.parentElement || null
    : null;
  const rootNode =
    scoreContainer ||
    findTurnContainer(documentRef) ||
    documentRef.documentElement ||
    documentRef.body ||
    documentRef;
  const observerUsesScoreContainer = Boolean(scoreContainer && rootNode === scoreContainer);
  const isWithinObserverRoot = (node) => {
    if (!node) {
      return false;
    }
    if (node === rootNode) {
      return true;
    }
    return typeof rootNode.contains === "function" && rootNode.contains(node);
  };
  const isRelevantObservedNode = (node) => {
    if (!node) {
      return false;
    }
    if (observerUsesScoreContainer) {
      return isWithinObserverRoot(node);
    }
    return Boolean(node?.closest?.("#ad-ext-turn") || isWithinObserverRoot(node));
  };
  const isAnimatingScoreNode = (node) => {
    return isNodeWithinActiveScoreAnimation(node, state);
  };

  if (observerRegistry && typeof observerRegistry.registerMutationObserver === "function") {
    observerRegistry.registerMutationObserver({
      key: OBSERVER_KEY,
      target: rootNode,
      callback: (mutations = []) => {
        const hasRelevantTurnMutation =
          !Array.isArray(mutations) ||
          mutations.length === 0 ||
          mutations.some((mutation) => {
            if (mutation?.type === "characterData") {
              const targetNode = mutation?.target?.parentNode || null;
              return isRelevantObservedNode(targetNode);
            }

            if (mutation?.type === "attributes") {
              const attributeName = String(mutation?.attributeName || "").trim().toLowerCase();
              if (
                attributeName === "class" &&
                (mutation?.target?.classList?.contains?.("ad-ext-turn-points-count--flash") ||
                  mutation?.target?.classList?.contains?.("ad-ext-turn-points-count--frame"))
              ) {
                return false;
              }
              return isRelevantObservedNode(mutation?.target || null);
            }

            return [
              mutation?.target || null,
              ...Array.from(mutation?.addedNodes || []),
              ...Array.from(mutation?.removedNodes || []),
            ].some((node) => isRelevantObservedNode(node));
          });
        if (
          Array.isArray(mutations) &&
          mutations.length &&
          mutations.every((mutation) => {
            return mutation?.type === "characterData" && isAnimatingScoreNode(mutation?.target || null);
          })
        ) {
          return;
        }
        if (!hasRelevantTurnMutation) {
          return;
        }
        scheduler.schedule();
      },
      observeOptions: createTurnSurfaceObserveOptions(),
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

  if (featureConfig.countEffect === "odometer") {
    ensureOdometerLoaded(windowRef).then((loadedOdometer) => {
      if (disposed || !loadedOdometer) {
        return;
      }
      odometerPluginRef = loadedOdometer;
      scheduler.schedule();
    });
  }

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
      flashMode: featureConfig.flashMode,
      flashAfterglowMs: 0,
      animeRef: null,
      countEffect: featureConfig.countEffect,
      odometerPluginRef,
      windowRef,
    });
    const scoreNodes = collectScoreNodes(documentRef);
    scoreNodes.forEach((node) => stopAnimation(node, state, windowRef));
    if (domGuards && typeof domGuards.removeNodeById === "function") {
      domGuards.removeNodeById(STYLE_ID);
    }
    if (electricDefsRetained) {
      releaseElectricFilterDefs({ documentRef });
    }
  };
}

export const mountTurnPointsCount = initializeTurnPointsCount;
export const initialize = initializeTurnPointsCount;
export const mount = initializeTurnPointsCount;
