import {
  clearDartMarkerEmphasis,
  createDartMarkerEmphasisState,
  updateDartMarkerEmphasis,
} from "./logic.js";
import { isLikelyBoardMarker } from "../../shared/dartboard-markers.js";
import { STYLE_ID, buildStyleText, resolveDartMarkerEmphasisConfig } from "./style.js";

const FEATURE_KEY = "dart-marker-emphasis";
const OBSERVER_KEY = `${FEATURE_KEY}:dom-observer`;
const LISTENER_KEYS = Object.freeze({
  visibility: `${FEATURE_KEY}:document-visibility`,
});
const BOARD_SURFACE_SELECTOR = "svg, g, circle, .showAnimations, .ad-ext-theme-board-canvas";

function isElementNode(node) {
  return Boolean(node?.nodeType === 1);
}

function containsKnownMarkerSurface(node, state) {
  if (!isElementNode(node) || !state?.trackedMarkers?.size) {
    return false;
  }

  const tagName = String(node.tagName || "").toLowerCase();
  const canContainMarkerSurface =
    tagName === "svg" ||
    tagName === "g" ||
    Boolean(node.matches?.(".showAnimations, .ad-ext-theme-board-canvas"));

  return Array.from(state.trackedMarkers).some((marker) => {
    if (!isElementNode(marker)) {
      return false;
    }
    if (node === marker) {
      return true;
    }
    return (
      (canContainMarkerSurface && typeof node.contains === "function" && node.contains(marker)) ||
      (typeof marker.contains === "function" && marker.contains(node))
    );
  });
}

function isPotentialBoardSurfaceNode(node) {
  if (!isElementNode(node)) {
    return false;
  }

  if (isLikelyBoardMarker(node)) {
    return true;
  }

  const tagName = String(node.tagName || "").toLowerCase();
  if (tagName === "svg") {
    const viewBox = String(node.getAttribute?.("viewBox") || "").trim();
    return viewBox.length > 0 || Boolean(node.querySelector?.("circle"));
  }
  if (tagName === "g") {
    return Boolean(node.querySelector?.("circle"));
  }

  return Boolean(node.matches?.(BOARD_SURFACE_SELECTOR) && node.querySelector?.("svg, circle"));
}

function mutationContainsRelevantNode(mutation, state) {
  const nodes = [
    mutation?.target,
    ...Array.from(mutation?.addedNodes || []),
    ...Array.from(mutation?.removedNodes || []),
  ];

  return nodes.some((node) => {
    if (!isElementNode(node)) {
      return false;
    }
    return containsKnownMarkerSurface(node, state) || isPotentialBoardSurfaceNode(node);
  });
}

export function hasRelevantDartMarkerEmphasisMutation(mutations = [], state = null) {
  return Array.from(mutations || []).some((mutation) => {
    if (mutation?.type !== "childList") {
      return false;
    }
    return mutationContainsRelevantNode(mutation, state);
  });
}

export function initializeDartMarkerEmphasis(context = {}) {
  const documentRef = context.documentRef || (typeof document !== "undefined" ? document : null);
  const windowRef = context.windowRef || (globalThis.window !== undefined ? globalThis.window : null);
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
      callback: (mutations) => {
        if (hasRelevantDartMarkerEmphasisMutation(mutations, state)) {
          scheduler.schedule();
        }
      },
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
