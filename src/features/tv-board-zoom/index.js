import {
  applyZoom,
  computeZoomIntent,
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
import { resolveBoardRenderSurface } from "../../shared/dartboard-svg.js";

const FEATURE_KEY = "tv-board-zoom";
const OBSERVER_KEY = `${FEATURE_KEY}:dom-observer`;
const LISTENER_KEYS = Object.freeze({
  resize: `${FEATURE_KEY}:window-resize`,
  orientation: `${FEATURE_KEY}:window-orientation`,
  pointerDown: `${FEATURE_KEY}:window-pointerdown`,
  visibility: `${FEATURE_KEY}:document-visibility`,
  beforeUnload: `${FEATURE_KEY}:window-beforeunload`,
});
const TRANSIENT_RESET_GRACE_MS = 120;
const THROW_HISTORY_CLICK_SELECTORS = Object.freeze([
  "#ad-ext-turn .ad-ext-turn-throw",
  ".ad-ext-turn-throw",
]);
const ZOOM_STRUCTURE_TARGET_SELECTORS = Object.freeze([
  "svg",
  ".showAnimations",
  ".ad-ext-theme-board-canvas",
  ".ad-ext-theme-board-viewport",
  ".ad-ext-theme-board-panel",
  ".ad-ext-theme-content-board",
]);
const ZOOM_SEMANTIC_CONTAINER_SELECTORS = Object.freeze([
  ".suggestion",
  ".ad-ext-player-score",
  "#ad-ext-turn",
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

function toElementNode(node = null) {
  let current = node;
  while (current && current.nodeType !== 1) {
    current = current.parentNode || null;
  }
  return current || null;
}

function elementMatchesAnySelector(node, selectors = []) {
  const elementNode = toElementNode(node);
  if (!elementNode || typeof elementNode.matches !== "function") {
    return false;
  }

  return selectors.some((selector) => {
    try {
      return elementNode.matches(selector);
    } catch (_) {
      return false;
    }
  });
}

function nodeOrAncestorMatchesAnySelector(node, selectors = []) {
  const elementNode = toElementNode(node);
  if (!elementNode || typeof elementNode.closest !== "function") {
    return false;
  }

  return selectors.some((selector) => {
    try {
      return Boolean(elementNode.closest(selector));
    } catch (_) {
      return false;
    }
  });
}

function getTouchedMutationNodes(mutation) {
  const nodes = [];
  const pushNode = (node) => {
    if (node) {
      nodes.push(node);
    }
  };

  pushNode(mutation?.target || null);
  Array.from(mutation?.addedNodes || []).forEach(pushNode);
  Array.from(mutation?.removedNodes || []).forEach(pushNode);
  return nodes;
}

function isDirectWatchedNodeMutation(mutation, watchedNodes = []) {
  if (!Array.isArray(watchedNodes) || !watchedNodes.length) {
    return false;
  }

  return getTouchedMutationNodes(mutation).some((node) => watchedNodes.includes(node));
}

function isDescendantWatchedNodeMutation(mutation, watchedNodes = []) {
  if (!Array.isArray(watchedNodes) || !watchedNodes.length) {
    return false;
  }

  return getTouchedMutationNodes(mutation).some((touchedNode) => {
    return watchedNodes.some((watchedNode) => {
      if (!watchedNode || touchedNode === watchedNode) {
        return touchedNode === watchedNode;
      }

      if (typeof touchedNode?.contains === "function" && touchedNode.contains(watchedNode)) {
        return true;
      }
      if (typeof watchedNode?.contains === "function" && watchedNode.contains(touchedNode)) {
        return true;
      }
      return false;
    });
  });
}

export function shouldScheduleTvBoardZoomMutation(mutations = [], context = {}) {
  if (!Array.isArray(mutations) || !mutations.length) {
    return false;
  }

  const watchedNodes = [
    context.boardSurface?.svg || null,
    context.boardSurface?.group || null,
    context.boardSurface?.zoomTarget || null,
    context.boardSurface?.zoomHost || null,
    context.zoomState?.zoomedElement || null,
    context.zoomState?.zoomHost || null,
  ].filter(Boolean);

  return mutations.some((mutation) => {
    if (!mutation || typeof mutation !== "object") {
      return false;
    }

    const mutationType = String(
      mutation.type ||
        (mutation.attributeName
          ? "attributes"
          : mutation.addedNodes || mutation.removedNodes
            ? "childList"
            : "")
    );

    if (mutationType === "attributes") {
      return (
        isDirectWatchedNodeMutation(mutation, watchedNodes) ||
        elementMatchesAnySelector(mutation.target, ZOOM_STRUCTURE_TARGET_SELECTORS)
      );
    }

    if (mutationType === "characterData") {
      return nodeOrAncestorMatchesAnySelector(mutation.target, ZOOM_SEMANTIC_CONTAINER_SELECTORS);
    }

    if (mutationType === "childList") {
      return (
        isDescendantWatchedNodeMutation(mutation, watchedNodes) ||
        getTouchedMutationNodes(mutation).some((node) =>
          nodeOrAncestorMatchesAnySelector(node, [
            ...ZOOM_STRUCTURE_TARGET_SELECTORS,
            ...ZOOM_SEMANTIC_CONTAINER_SELECTORS,
          ])
        )
      );
    }

    return false;
  });
}

function getNodeClassName(node) {
  if (!node || typeof node.getAttribute !== "function") {
    return "";
  }
  return String(node.getAttribute("class") || "").trim();
}

function mapRect(rect) {
  if (!rect) {
    return null;
  }
  return {
    left: Number.isFinite(rect.left) ? Number(rect.left) : null,
    top: Number.isFinite(rect.top) ? Number(rect.top) : null,
    width: Number.isFinite(rect.width) ? Number(rect.width) : null,
    height: Number.isFinite(rect.height) ? Number(rect.height) : null,
    right: Number.isFinite(rect.right) ? Number(rect.right) : null,
    bottom: Number.isFinite(rect.bottom) ? Number(rect.bottom) : null,
  };
}

function createDebugState(featureDebug) {
  return {
    featureDebug,
    lastSignature: "",
  };
}

function buildDebugSignature(payload = {}) {
  return [
    payload.status || "unknown",
    payload.reason || "",
    payload.segment || "",
    payload.targetClassName || "",
    payload.hostClassName || "",
    payload.tx ?? "null",
    payload.ty ?? "null",
    payload.anchorX ?? "null",
    payload.anchorY ?? "null",
    payload.targetRect?.left ?? "null",
    payload.targetRect?.top ?? "null",
    payload.viewportRect?.left ?? "null",
    payload.viewportRect?.top ?? "null",
  ].join("|");
}

function buildDebugSummary(payload = {}) {
  return `status="${payload.status || "unknown"}" reason="${payload.reason || "-"}" segment="${
    payload.segment || "-"
  }" target="${payload.targetClassName || "-"}" host="${payload.hostClassName || "-"}" tx="${
    payload.tx ?? "-"
  }" ty="${payload.ty ?? "-"}" anchor="${payload.anchorX ?? "-"},${payload.anchorY ?? "-"}"`;
}

function emitDebugEvent(debugState, level, payload = {}) {
  if (!debugState?.featureDebug?.enabled) {
    return;
  }

  const signature = buildDebugSignature(payload);
  if (debugState.lastSignature === signature) {
    return;
  }
  debugState.lastSignature = signature;

  const logger =
    level === "warn" && typeof debugState.featureDebug.warn === "function"
      ? debugState.featureDebug.warn.bind(debugState.featureDebug)
      : typeof debugState.featureDebug.log === "function"
        ? debugState.featureDebug.log.bind(debugState.featureDebug)
        : null;
  if (!logger) {
    return;
  }

  logger(buildDebugSummary(payload), payload);
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
  const featureDebug = context.featureDebug || null;

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
          checkoutZoomTarget: "finish-only",
          t20SetupZoomEnabled: true,
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
    lastAppliedIntentSignature: "",
    lastAppliedZoomTransform: null,
    releaseTimeoutId: 0,
    targetStyleSnapshot: null,
    hostStyleSnapshot: null,
    gifStyleSnapshots: [],
    stickyUntilTurnChange: false,
    stickyUntilLegEnd: false,
    manualPause: false,
    manualPauseThrowCount: -1,
    transientResetReason: "",
    transientResetUntilTs: 0,
    transientResetTimerId: 0,
  };
  const boardCache = {
    surface: null,
  };
  const debugState = createDebugState(featureDebug);

  domGuards.ensureStyle(STYLE_ID, buildStyleText());

  function invalidateBoardCache() {
    boardCache.surface = null;
  }

  function getBoardSurface() {
    const cachedSurface = boardCache.surface;
    if (
      cachedSurface?.svg &&
      cachedSurface.svg.isConnected !== false &&
      cachedSurface.group?.isConnected !== false
    ) {
      return cachedSurface;
    }

    const boardSurface = resolveBoardRenderSurface(documentRef);
    boardCache.surface = boardSurface;
    return boardSurface;
  }

  let scheduler = null;

  function clearTransientResetTimer() {
    if (!zoomState.transientResetTimerId) {
      return;
    }

    if (typeof windowRef.clearTimeout === "function") {
      windowRef.clearTimeout(zoomState.transientResetTimerId);
    } else {
      clearTimeout(zoomState.transientResetTimerId);
    }
    zoomState.transientResetTimerId = 0;
  }

  function clearTransientResetState() {
    clearTransientResetTimer();
    zoomState.transientResetReason = "";
    zoomState.transientResetUntilTs = 0;
  }

  function scheduleTransientResetCheck() {
    clearTransientResetTimer();

    const setTimeoutRef =
      typeof windowRef.setTimeout === "function" ? windowRef.setTimeout.bind(windowRef) : setTimeout;
    zoomState.transientResetTimerId = setTimeoutRef(() => {
      zoomState.transientResetTimerId = 0;
      scheduler?.schedule?.();
    }, TRANSIENT_RESET_GRACE_MS);
  }

  function requestZoomReset(reason, options = {}) {
    let forceReset = Boolean(options.force);
    if (!forceReset && reason === "intent-missing" && zoomState.manualPause) {
      forceReset = true;
    }

    const hasActiveZoom = Boolean(zoomState.zoomedElement);
    if (forceReset || !hasActiveZoom) {
      clearTransientResetState();
      resetZoom(speedConfig, zoomState);
      emitDebugEvent(debugState, reason === "board-missing" || reason === "target-missing" ? "warn" : "log", {
        status: "reset",
        reason,
      });
      return;
    }

    const nowTs = Date.now();
    if (zoomState.transientResetReason !== reason) {
      zoomState.transientResetReason = reason;
      zoomState.transientResetUntilTs = nowTs + TRANSIENT_RESET_GRACE_MS;
      scheduleTransientResetCheck();
      return;
    }

    if (nowTs < zoomState.transientResetUntilTs) {
      scheduleTransientResetCheck();
      return;
    }

    clearTransientResetState();
    resetZoom(speedConfig, zoomState);
    emitDebugEvent(debugState, reason === "board-missing" || reason === "target-missing" ? "warn" : "log", {
      status: "reset",
      reason,
    });
  }

  scheduler = schedulerFactory(() => {
    const boardSurface = getBoardSurface();
    const boardSvg = boardSurface?.svg || null;
    if (!boardSvg) {
      requestZoomReset("board-missing");
      return;
    }

    const targetNode = boardSurface?.zoomTarget || resolveZoomTarget(boardSvg);
    if (!targetNode) {
      requestZoomReset("target-missing");
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
      requestZoomReset("intent-missing");
      return;
    }

    clearTransientResetState();
    const hostNode = boardSurface?.zoomHost || resolveZoomHost(targetNode);
    const zoomData = applyZoom(targetNode, hostNode, boardSvg, zoomLevel, speedConfig, intent, zoomState, {
      x01Rules,
      windowRef,
      documentRef,
    });
    emitDebugEvent(debugState, "log", {
      status: zoomData ? "apply" : "apply-missing-transform",
      reason: String(intent?.reason || ""),
      segment: String(intent?.segment || ""),
      targetClassName: getNodeClassName(targetNode),
      hostClassName: getNodeClassName(hostNode),
      tx: Number.isFinite(zoomData?.tx) ? Number(zoomData.tx.toFixed(2)) : null,
      ty: Number.isFinite(zoomData?.ty) ? Number(zoomData.ty.toFixed(2)) : null,
      anchorX: Number.isFinite(zoomData?.anchor?.x) ? Number(zoomData.anchor.x.toFixed(4)) : null,
      anchorY: Number.isFinite(zoomData?.anchor?.y) ? Number(zoomData.anchor.y.toFixed(4)) : null,
      targetRect: mapRect(zoomData?.targetRect || targetNode.getBoundingClientRect?.()),
      viewportRect: mapRect(zoomData?.viewportRect || hostNode?.getBoundingClientRect?.()),
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
        if (!shouldScheduleTvBoardZoomMutation(mutations, { boardSurface: boardCache.surface, zoomState })) {
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
        clearTransientResetState();
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
        clearTransientResetState();
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

    clearTransientResetState();
    resetZoom(speedConfig, zoomState, true);
    invalidateBoardCache();
    domGuards.removeNodeById(STYLE_ID);
  };
}

export const mountTvBoardZoom = initializeTvBoardZoom;
export const initialize = initializeTvBoardZoom;
export const mount = initializeTvBoardZoom;
