import {
  applyZoom,
  computeZoomIntent,
  findBoardSvg,
  resetZoom,
  resolveZoomHost,
  resolveZoomTarget,
} from "./logic.js";
import { STYLE_ID, buildStyleText, resolveZoomSpeedConfig } from "./style.js";

const FEATURE_KEY = "tv-board-zoom";
const OBSERVER_KEY = `${FEATURE_KEY}:dom-observer`;
const LISTENER_KEYS = Object.freeze({
  resize: `${FEATURE_KEY}:window-resize`,
  orientation: `${FEATURE_KEY}:window-orientation`,
  pointerDown: `${FEATURE_KEY}:window-pointerdown`,
  visibility: `${FEATURE_KEY}:document-visibility`,
  beforeUnload: `${FEATURE_KEY}:window-beforeunload`,
});

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
  };

  domGuards.ensureStyle(STYLE_ID, buildStyleText());

  const scheduler = schedulerFactory(() => {
    const boardSvg = findBoardSvg(documentRef);
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
    applyZoom(targetNode, hostNode, zoomLevel, speedConfig, intent, zoomState);
  }, { windowRef });

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

  const unsubscribeGameState =
    gameState && typeof gameState.subscribe === "function"
      ? gameState.subscribe(() => scheduler.schedule())
      : () => {};

  if (listenerRegistry && typeof listenerRegistry.register === "function") {
    listenerRegistry.register({
      key: LISTENER_KEYS.resize,
      target: windowRef,
      type: "resize",
      handler: () => scheduler.schedule(),
      options: { passive: true },
    });
    listenerRegistry.register({
      key: LISTENER_KEYS.orientation,
      target: windowRef,
      type: "orientationchange",
      handler: () => scheduler.schedule(),
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
        zoomState.holdUntilTs = 0;
        zoomState.activeIntent = null;
        resetZoom(speedConfig, zoomState);
      },
      options: { passive: true, capture: true },
    });
    listenerRegistry.register({
      key: LISTENER_KEYS.visibility,
      target: documentRef,
      type: "visibilitychange",
      handler: () => scheduler.schedule(),
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
    domGuards.removeNodeById(STYLE_ID);
  };
}

export const mountTvBoardZoom = initializeTvBoardZoom;
export const initialize = initializeTvBoardZoom;
export const mount = initializeTvBoardZoom;
