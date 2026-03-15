import {
  applyZoom,
  computeZoomIntent,
  findBoardSvg,
  markManualZoomPause,
  resetZoom,
  resolveZoomHost,
  resolveZoomTarget,
} from "./logic.js";
import {
  STYLE_ID,
  ZOOM_CLASS,
  ZOOM_HOST_CLASS,
  buildStyleText,
  resolveZoomSpeedConfig,
} from "./style.js";
import { createManagedNodeMatcher, hasExternalDomMutation } from "../../core/dom-mutation-filter.js";

const FEATURE_KEY = "tv-board-zoom";
const OBSERVER_KEY = `${FEATURE_KEY}:dom-observer`;
const LISTENER_KEYS = Object.freeze({
  resize: `${FEATURE_KEY}:window-resize`,
  orientation: `${FEATURE_KEY}:window-orientation`,
  pointerDown: `${FEATURE_KEY}:window-pointerdown`,
  visibility: `${FEATURE_KEY}:document-visibility`,
  beforeUnload: `${FEATURE_KEY}:window-beforeunload`,
});
const THROW_HISTORY_CLICK_SELECTORS = Object.freeze([
  "#ad-ext-turn .ad-ext-turn-throw",
  ".ad-ext-turn-throw",
]);

function isThrowHistoryClickTarget(targetNode) {
  if (!targetNode || typeof targetNode.closest !== "function") {
    return false;
  }

  return THROW_HISTORY_CLICK_SELECTORS.some((selector) => Boolean(targetNode.closest(selector)));
}

function resolveZoomLevel(zoomLevel) {
  const numeric = Number(zoomLevel);
  if ([2.35, 2.75, 3.15].includes(numeric)) {
    return numeric;
  }
  return 2.75;
}

export function initializeTvBoardZoom(context = {}) {
  const documentRef = context.documentRef || (typeof document !== "undefined" ? document : null);
  const windowRef = context.windowRef || (typeof window !== "undefined" ? window : null);
  const domGuards = context.domGuards;
  const observerRegistry = context.registries?.observers;
  const listenerRegistry = context.registries?.listeners;
  const gameState = context.gameState;
  const x01Rules = context.domain?.x01Rules;
  const config = context.config;
  const schedulerFactory = context.helpers?.createRafScheduler;

  if (!documentRef || !windowRef || !domGuards || !schedulerFactory || !x01Rules) {
    return () => {};
  }

  const featureConfig =
    config && typeof config.getFeatureConfig === "function"
      ? config.getFeatureConfig("tvBoardZoom")
      : {
          zoomLevel: 2.75,
          zoomSpeed: "mittel",
          checkoutZoomEnabled: true,
        };

  const speedConfig = resolveZoomSpeedConfig(featureConfig.zoomSpeed);
  const zoomLevel = resolveZoomLevel(featureConfig.zoomLevel);
  const zoomState = {
    zoomedElement: null,
    zoomHost: null,
    activeIntent: null,
    holdUntilTs: 0,
    lastTurnId: "",
    lastThrowCount: -1,
    lastAppliedSignature: "",
    releaseTimeoutId: 0,
    targetStyleSnapshot: null,
    hostStyleSnapshot: null,
    gifStyleSnapshots: [],
    stickyUntilTurnChange: false,
    stickyUntilLegEnd: false,
    manualPause: false,
    manualPauseThrowCount: -1,
  };
  const boardCache = {
    svg: null,
  };

  domGuards.ensureStyle(STYLE_ID, buildStyleText());

  function invalidateBoardCache() {
    boardCache.svg = null;
  }

  function getBoardSvg() {
    if (boardCache.svg && boardCache.svg.isConnected !== false) {
      return boardCache.svg;
    }

    const boardSvg = findBoardSvg(documentRef);
    boardCache.svg = boardSvg;
    return boardSvg;
  }

  const scheduler = schedulerFactory(() => {
    const boardSvg = getBoardSvg();
    if (!boardSvg) {
      resetZoom(speedConfig, zoomState);
      return;
    }

    const targetNode = resolveZoomTarget(boardSvg);
    if (!targetNode) {
      resetZoom(speedConfig, zoomState);
      return;
    }

    const intent = computeZoomIntent({
      gameState,
      x01Rules,
      state: zoomState,
      documentRef,
      windowRef,
      featureConfig,
    });

    if (!intent) {
      resetZoom(speedConfig, zoomState);
      return;
    }

    const hostNode = resolveZoomHost(targetNode);
    applyZoom(targetNode, hostNode, boardSvg, zoomLevel, speedConfig, intent, zoomState, {
      x01Rules,
      windowRef,
      documentRef,
    });
  }, { windowRef });
  const isManagedNode = createManagedNodeMatcher({
    classNames: [ZOOM_CLASS, ZOOM_HOST_CLASS],
    predicates: [
      (node) => node === zoomState.zoomedElement,
      (node) => node === zoomState.zoomHost,
    ],
  });

  const rootNode = documentRef.documentElement || documentRef.body || documentRef;
  if (observerRegistry && typeof observerRegistry.registerMutationObserver === "function") {
    observerRegistry.registerMutationObserver({
      key: OBSERVER_KEY,
      target: rootNode,
      callback: (mutations = []) => {
        if (!hasExternalDomMutation(mutations, isManagedNode)) {
          return;
        }
        invalidateBoardCache();
        scheduler.schedule();
      },
      observeOptions: {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeFilter: ["class", "style"],
      },
      MutationObserverRef: windowRef?.MutationObserver,
    });
  }

  const unsubscribeGameState =
    gameState && typeof gameState.subscribe === "function"
      ? gameState.subscribe(() => scheduler.schedule())
      : () => {};

  if (listenerRegistry && typeof listenerRegistry.register === "function") {
    listenerRegistry.register({
      key: LISTENER_KEYS.resize,
      target: windowRef,
      type: "resize",
      handler: () => {
        invalidateBoardCache();
        scheduler.schedule();
      },
      options: { passive: true },
    });
    listenerRegistry.register({
      key: LISTENER_KEYS.orientation,
      target: windowRef,
      type: "orientationchange",
      handler: () => {
        invalidateBoardCache();
        scheduler.schedule();
      },
      options: { passive: true },
    });
    listenerRegistry.register({
      key: LISTENER_KEYS.pointerDown,
      target: windowRef,
      type: "pointerdown",
      handler: (event) => {
        if (event && typeof event.button === "number" && event.button !== 0) {
          return;
        }
        if (!isThrowHistoryClickTarget(event?.target)) {
          return;
        }
        markManualZoomPause(zoomState);
        resetZoom(speedConfig, zoomState);
      },
      options: { passive: true, capture: true },
    });
    listenerRegistry.register({
      key: LISTENER_KEYS.visibility,
      target: documentRef,
      type: "visibilitychange",
      handler: () => {
        invalidateBoardCache();
        scheduler.schedule();
      },
    });
    listenerRegistry.register({
      key: LISTENER_KEYS.beforeUnload,
      target: windowRef,
      type: "beforeunload",
      handler: () => {
        zoomState.holdUntilTs = 0;
        zoomState.activeIntent = null;
        resetZoom(speedConfig, zoomState, true);
      },
    });
  }

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
      // Fail-soft cleanup.
    }

    if (observerRegistry && typeof observerRegistry.disconnect === "function") {
      observerRegistry.disconnect(OBSERVER_KEY);
    }

    if (listenerRegistry && typeof listenerRegistry.remove === "function") {
      Object.values(LISTENER_KEYS).forEach((key) => {
        listenerRegistry.remove(key);
      });
    }

    resetZoom(speedConfig, zoomState, true);
    invalidateBoardCache();
    domGuards.removeNodeById(STYLE_ID);
  };
}

export const mountTvBoardZoom = initializeTvBoardZoom;
export const initialize = initializeTvBoardZoom;
export const mount = initializeTvBoardZoom;
