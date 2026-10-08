import { createTurnScopedScheduler } from "../shared/turn-lifecycle.js";
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
  releaseManagedScoreNodes,
  stopAnimation,
  updateTurnScore,
} from "./logic.js";
import { STYLE_ID, buildStyleText } from "./style.js";
import {
  createTurnSurfaceObserveOptions,
  findTurnContainer,
} from "../shared/turn-surface-adapter.js";
import {
  MODERN_TURN_SELECTOR,
  findModernTurnSurface,
} from "../shared/x01-match-surface.js";

const FEATURE_KEY = "turn-score-counter";
const OBSERVER_KEYS = Object.freeze({
  lifecycle: `${FEATURE_KEY}:dom-observer:lifecycle`,
  surface: `${FEATURE_KEY}:dom-observer:surface`,
});
const LISTENER_KEYS = Object.freeze({
  visibility: `${FEATURE_KEY}:document-visibility`,
});

export function initializeTurnScoreCounter(context = {}) {
  const documentRef = context.documentRef || (typeof document !== "undefined" ? document : null);
  const windowRef = context.windowRef || (globalThis.window !== undefined ? globalThis.window : null);
  const observerRegistry = context.registries?.observers;
  const listenerRegistry = context.registries?.listeners;
  const domGuards = context.domGuards;
  const gameState = context.gameState;
  const config = context.config;
  const featureDebug = context.featureDebug || null;
  const schedulerFactory = context.helpers?.createRafScheduler;

  if (!documentRef || typeof schedulerFactory !== "function") {
    return () => {};
  }

  const featureConfig =
    config && typeof config.getFeatureConfig === "function"
      ? config.getFeatureConfig("turnScoreCounter")
      : {
          durationMs: 416,
          countEffect: "smooth-count",
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
    modernScoreNode: null,
  };
  let animeRef = getAnime(windowRef);
  let odometerPluginRef = getOdometer();
  let disposed = false;
  let electricDefsRetained = false;
  let observedModernTurn = null;
  let currentObserverRoot = null;
  let observerUsesScoreContainer = false;
  let observerUsesModernRoot = false;
  let lastDebugSignature = "";

  if (domGuards && typeof domGuards.ensureStyle === "function") {
    domGuards.ensureStyle(STYLE_ID, buildStyleText());
    retainElectricFilterDefs({ documentRef, domGuards });
    electricDefsRetained = true;
  }

  function update() {
    bindSurfaceObserver();
    updateTurnScore({
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

    if (featureDebug?.enabled && typeof featureDebug.log === "function") {
      let source = "none";
      if (observedModernTurn) {
        source = "modern";
      } else if (findTurnContainer(documentRef)) {
        source = "legacy";
      }
      const values = state.scoreNodeCache
        .map((node) => String(node?.textContent || "").trim())
        .join("|");
      const signature = `${source}:${state.scoreNodeCache.length}:${values}`;
      if (signature !== lastDebugSignature) {
        lastDebugSignature = signature;
        featureDebug.log(
          `state surface="${source}" scores=${state.scoreNodeCache.length} value="${values || "-"}"`
        );
      }
    }
  }

  const scheduler = createTurnScopedScheduler(context, update, { windowRef, resetTurn() {
    const nodes = new Set([
      ...state.scoreNodeCache, ...state.lastValueByNode.keys(),
      ...state.activeRafByNode.keys(), ...state.activeAnimeByNode.keys(),
      ...state.activeCountUpByNode.keys(), ...state.flashTimeoutByNode.keys(),
    ]);
    nodes.forEach((node) => stopAnimation(node, state, windowRef));
    releaseManagedScoreNodes(state);
    Object.values(state).forEach((value) => { if (value instanceof Map) value.clear(); });
    observedModernTurn = null;
  } }, schedulerFactory);

  function resolveObserverSurface() {
    const modernTurn = findModernTurnSurface(documentRef, windowRef)?.turnContainer || null;
    const initialScoreNode = collectScoreNodes(documentRef, state, { windowRef })[0] || null;
    const scoreContainer = initialScoreNode?.closest?.("#ad-ext-turn")
      ? initialScoreNode.parentElement || null
      : null;
    const rootNode =
      scoreContainer ||
      modernTurn?.closest?.("main") ||
      findTurnContainer(documentRef) ||
      documentRef.documentElement ||
      documentRef.body ||
      documentRef;
    return {
      modernTurn,
      rootNode,
      usesModernRoot: Boolean(modernTurn && !scoreContainer),
      usesScoreContainer: Boolean(scoreContainer && rootNode === scoreContainer),
    };
  }

  const isWithinObserverRoot = (node) => {
    if (!node) {
      return false;
    }
    if (node === currentObserverRoot) {
      return true;
    }
    return typeof currentObserverRoot?.contains === "function" && currentObserverRoot.contains(node);
  };
  const isRelevantObservedNode = (node) => {
    if (!node) {
      return false;
    }
    if (observerUsesScoreContainer) {
      return isWithinObserverRoot(node);
    }
    const elementNode = Number(node?.nodeType) === 3 ? node?.parentNode || null : node;
    if (observedModernTurn && elementNode) {
      if (
        elementNode === observedModernTurn ||
        observedModernTurn.contains?.(elementNode) ||
        elementNode.contains?.(observedModernTurn)
      ) {
        return true;
      }
    }
    if (
      elementNode?.matches?.(MODERN_TURN_SELECTOR) ||
      elementNode?.closest?.(MODERN_TURN_SELECTOR) ||
      elementNode?.querySelector?.(MODERN_TURN_SELECTOR)
    ) {
      return true;
    }
    if (observerUsesModernRoot) {
      return false;
    }
    return Boolean(node?.closest?.("#ad-ext-turn") || isWithinObserverRoot(node));
  };
  const isAnimatingScoreNode = (node) => {
    return isNodeWithinActiveScoreAnimation(node, state);
  };

  function handleSurfaceMutations(mutations = []) {
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
            (mutation?.target?.classList?.contains?.("ad-ext-turn-score-counter--flash") ||
              mutation?.target?.classList?.contains?.("ad-ext-turn-score-counter--frame"))
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
    if (hasRelevantTurnMutation) {
      scheduler.schedule();
    }
  }

  function bindSurfaceObserver() {
    const nextSurface = resolveObserverSurface();
    observedModernTurn = nextSurface.modernTurn;
    observerUsesScoreContainer = nextSurface.usesScoreContainer;
    observerUsesModernRoot = nextSurface.usesModernRoot;
    if (currentObserverRoot === nextSurface.rootNode) {
      return false;
    }

    if (currentObserverRoot && typeof observerRegistry?.disconnect === "function") {
      observerRegistry.disconnect(OBSERVER_KEYS.surface);
    }
    currentObserverRoot = nextSurface.rootNode;
    if (!currentObserverRoot || typeof observerRegistry?.registerMutationObserver !== "function") {
      return true;
    }
    observerRegistry.registerMutationObserver({
      key: OBSERVER_KEYS.surface,
      target: currentObserverRoot,
      callback: handleSurfaceMutations,
      observeOptions: createTurnSurfaceObserveOptions(),
      MutationObserverRef: windowRef?.MutationObserver,
    });
    return true;
  }

  if (observerRegistry && typeof observerRegistry.registerMutationObserver === "function") {
    const lifecycleRoot = documentRef.documentElement || documentRef.body || documentRef;
    observerRegistry.registerMutationObserver({
      key: OBSERVER_KEYS.lifecycle,
      target: lifecycleRoot,
      callback: (mutations = []) => {
        const hasChildListMutation =
          !Array.isArray(mutations) ||
          mutations.length === 0 ||
          mutations.some((mutation) => mutation?.type === "childList");
        if (hasChildListMutation && bindSurfaceObserver()) {
          scheduler.schedule();
        }
      },
      observeOptions: { childList: true, subtree: true },
      MutationObserverRef: windowRef?.MutationObserver,
    });
  }
  bindSurfaceObserver();

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

  if (featureConfig.countEffect === "rolling-digits") {
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
      observerRegistry.disconnect(OBSERVER_KEYS.lifecycle);
      observerRegistry.disconnect(OBSERVER_KEYS.surface);
    }
    if (listenerRegistry && typeof listenerRegistry.remove === "function") {
      Object.values(LISTENER_KEYS).forEach((key) => listenerRegistry.remove(key));
    }

    updateTurnScore({
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
    const scoreNodes = collectScoreNodes(documentRef, state, { windowRef });
    scoreNodes.forEach((node) => stopAnimation(node, state, windowRef));
    releaseManagedScoreNodes(state);
    if (domGuards && typeof domGuards.removeNodeById === "function") {
      domGuards.removeNodeById(STYLE_ID);
    }
    if (electricDefsRetained) {
      releaseElectricFilterDefs({ documentRef });
    }
  };
}

export const initializeTurnScoreCount = initializeTurnScoreCounter;
export const mountTurnScoreCounter = initializeTurnScoreCounter;
export const initialize = initializeTurnScoreCounter;
export const mount = initializeTurnScoreCounter;
