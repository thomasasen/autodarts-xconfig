import {
  applyZoom,
  computeZoomIntent,
  markManualZoomPause,
  resetZoom,
  resolveZoomHost,
  resolveZoomTarget,
  syncGifOverlayContainment,
} from "./logic.js";
import {
  STYLE_ID,
  ZOOM_CLASS,
  ZOOM_HOST_CLASS,
  buildStyleText,
  resolveZoomSpeedConfig,
} from "./style.js";
import { createManagedNodeMatcher, hasExternalDomMutation } from "../../core/dom-mutation-filter.js";
import { NATIVE_BOARD_SELECTOR, resolveBoardRenderSurface } from "../../shared/dartboard-svg.js";
import {
  BOARD_INPUT_MODE_ATTRIBUTE_FILTER,
  BOARD_INPUT_MODE_CONTROL_SELECTOR,
  collectBoardInputModeControls,
  getActiveBoardInputMode,
  resolveScoringBoardInputMode,
} from "../../shared/board-input-mode.js";
import {
  MODERN_MATCH_SEMANTIC_SELECTORS,
  findModernTurnSurface,
  readModernMatchSurface,
} from "../shared/x01-match-surface.js";

const FEATURE_KEY = "tv-board-zoom";
const OBSERVER_KEY = `${FEATURE_KEY}:dom-observer`;
const GIF_OBSERVER_KEY = `${FEATURE_KEY}:tools-animation-observer`;
const TOOLS_ANIMATION_HOST_SELECTOR = "autodarts-tools-animations";
const LISTENER_KEYS = Object.freeze({
  resize: `${FEATURE_KEY}:window-resize`,
  orientation: `${FEATURE_KEY}:window-orientation`,
  pointerDown: `${FEATURE_KEY}:window-pointerdown`,
  visibility: `${FEATURE_KEY}:document-visibility`,
  beforeUnload: `${FEATURE_KEY}:window-beforeunload`,
});
const TRANSIENT_RESET_GRACE_MS = 120;
const ACTIVE_ZOOM_INTEGRITY_CHECK_MS = 1000;
const VIRTUAL_BOARD_MIN_PATH_COUNT = 40;
const BOARD_MEDIA_SELECTOR = "img, video, canvas, image";
const THROW_HISTORY_CLICK_SELECTORS = Object.freeze([
  "#ad-ext-turn .ad-ext-turn-throw",
  ".ad-ext-turn-throw",
]);
const ZOOM_STRUCTURE_TARGET_SELECTORS = Object.freeze([
  NATIVE_BOARD_SELECTOR,
  "svg",
  ".showAnimations",
  ".ad-ext-theme-board-canvas",
  ".ad-ext-theme-board-viewport",
  ".ad-ext-theme-board-panel",
  ".ad-ext-theme-content-board",
]);
const ZOOM_SEMANTIC_CONTAINER_SELECTORS = Object.freeze([
  ...MODERN_MATCH_SEMANTIC_SELECTORS,
  BOARD_INPUT_MODE_CONTROL_SELECTOR,
  ".text-checkout-suggestion",
  ".suggestion",
  ".ad-ext-player-score",
  "#ad-ext-turn",
  ".ad-ext-turn-throw",
]);

function isDenseNativeVectorBoard(boardSurface) {
  const zoomTarget = boardSurface?.zoomTarget || null;
  if (!zoomTarget?.matches?.(NATIVE_BOARD_SELECTOR)) {
    return false;
  }
  if (zoomTarget.querySelector?.(BOARD_MEDIA_SELECTOR)) {
    return false;
  }

  return Array.from(zoomTarget.querySelectorAll?.("svg") || []).some(
    (svgNode) => svgNode.querySelectorAll?.("path")?.length >= VIRTUAL_BOARD_MIN_PATH_COUNT
  );
}

function hasMatchingInteractionLayout(interactionSurface, nativeBoard) {
  const interactionRect = interactionSurface?.getBoundingClientRect?.();
  const boardRect = nativeBoard?.getBoundingClientRect?.();
  const interactionWidth = Number(interactionSurface?.offsetWidth) || Number(interactionRect?.width);
  const interactionHeight = Number(interactionSurface?.offsetHeight) || Number(interactionRect?.height);
  const boardWidth = Number(nativeBoard?.offsetWidth) || Number(boardRect?.width);
  const boardHeight = Number(nativeBoard?.offsetHeight) || Number(boardRect?.height);
  const dimensions = [interactionWidth, interactionHeight, boardWidth, boardHeight];
  if (!dimensions.every((value) => Number.isFinite(value) && value > 0)) {
    return false;
  }

  const tolerancePx = Math.max(2, Math.min(boardWidth, boardHeight) * 0.01);
  return (
    Math.abs(interactionWidth - boardWidth) <= tolerancePx &&
    Math.abs(interactionHeight - boardHeight) <= tolerancePx &&
    Math.abs(Number(nativeBoard?.offsetLeft) || 0) <= tolerancePx &&
    Math.abs(Number(nativeBoard?.offsetTop) || 0) <= tolerancePx
  );
}

function resolveManualNativeBoardSurface(boardSurface) {
  const nativeBoard = boardSurface?.zoomTarget || null;
  if (!nativeBoard?.matches?.(NATIVE_BOARD_SELECTOR)) {
    return null;
  }

  const interactionSurface = nativeBoard.parentElement || null;
  if (!interactionSurface || !hasMatchingInteractionLayout(interactionSurface, nativeBoard)) {
    return null;
  }

  const zoomHost = resolveZoomHost(interactionSurface);
  if (!zoomHost || zoomHost === interactionSurface) {
    return null;
  }

  return {
    ...boardSurface,
    zoomTarget: interactionSurface,
    zoomHost,
  };
}

function resolveInputSafeBoardSurface(documentRef, gameState, boardSurface, windowRef) {
  const activeMode = getActiveBoardInputMode(documentRef);
  if (activeMode && activeMode !== "live") {
    return null;
  }

  const scoringBoardMode = resolveScoringBoardInputMode(gameState, { windowRef });
  if (scoringBoardMode === "manual") {
    return resolveManualNativeBoardSurface(boardSurface);
  }
  if (scoringBoardMode === "live" || activeMode === "live") {
    return boardSurface;
  }

  if (collectBoardInputModeControls(documentRef, { availableOnly: true }).length > 0) {
    return null;
  }

  return isDenseNativeVectorBoard(boardSurface) ? null : boardSurface;
}
const ZOOM_STRUCTURE_CHILDLIST_SELECTORS = Object.freeze([
  ...ZOOM_STRUCTURE_TARGET_SELECTORS,
  ".ad-ext-tv-board-zoom-host",
  ".ad-ext-tv-board-zoom",
]);

function isThrowHistoryClickTarget(targetNode) {
  if (!targetNode || typeof targetNode.closest !== "function") {
    return false;
  }

  if (THROW_HISTORY_CLICK_SELECTORS.some((selector) => Boolean(targetNode.closest(selector)))) {
    return true;
  }
  const surface = findModernTurnSurface(targetNode.ownerDocument);
  return Boolean(surface?.throwRows.some((row) =>
    row.classList?.contains("cursor-pointer") && row.contains(targetNode)));
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

function containsMatchingDescendant(node, selectors) {
  return selectors.some((selector) => Boolean(node?.querySelector?.(selector)));
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

function isConnectedNode(node) {
  return Boolean(node) && node.isConnected !== false;
}

function nodeContainsNode(rootNode, childNode) {
  if (!rootNode || !childNode) {
    return false;
  }
  if (rootNode === childNode) {
    return true;
  }
  return typeof rootNode.contains === "function" ? rootNode.contains(childNode) : false;
}

function shouldInvalidateBoardSurfaceForTvBoardZoomMutation(mutation, watchedNodes = []) {
  if (!mutation || typeof mutation !== "object") {
    return false;
  }

  const mutationType = resolveMutationType(mutation);
  if (mutationType !== "childList") {
    return false;
  }

  if (isDescendantWatchedNodeMutation(mutation, watchedNodes)) {
    return true;
  }

  return getTouchedMutationNodes(mutation).some((node) =>
    nodeOrAncestorMatchesAnySelector(node, ZOOM_STRUCTURE_CHILDLIST_SELECTORS) ||
    containsMatchingDescendant(node, ZOOM_STRUCTURE_CHILDLIST_SELECTORS)
  );
}

export function resolveTvBoardZoomMutationReaction(mutations = [], context = {}) {
  if (!Array.isArray(mutations) || !mutations.length) {
    return {
      shouldSchedule: false,
      shouldInvalidateBoardCache: false,
    };
  }

  const watchedNodes = [
    context.boardSurface?.svg || null,
    context.boardSurface?.group || null,
    context.boardSurface?.zoomTarget || null,
    context.boardSurface?.zoomHost || null,
    context.zoomState?.zoomedElement || null,
    context.zoomState?.zoomHost || null,
  ].filter(Boolean);
  const semanticNodes = [
    context.matchSurface?.turnContainer,
    context.matchSurface?.playerCard,
    context.matchSurface?.variantNode,
  ].filter(Boolean);

  let shouldSchedule = false;
  let shouldInvalidateBoardCache = false;

  mutations.forEach((mutation) => {
    if (shouldInvalidateBoardCache) {
      return;
    }
    if (!mutation || typeof mutation !== "object") {
      return;
    }

    const mutationType = resolveMutationType(mutation);

    if (mutationType === "attributes") {
      if (
        isDirectWatchedNodeMutation(mutation, watchedNodes) ||
        isDescendantWatchedNodeMutation(mutation, semanticNodes) ||
        nodeOrAncestorMatchesAnySelector(mutation.target, ZOOM_SEMANTIC_CONTAINER_SELECTORS)
      ) {
        shouldSchedule = true;
      }
      return;
    }

    if (mutationType === "characterData") {
      if (nodeOrAncestorMatchesAnySelector(mutation.target, ZOOM_SEMANTIC_CONTAINER_SELECTORS)) {
        shouldSchedule = true;
      }
      return;
    }

    if (mutationType === "childList") {
      const invalidatesBoardSurface = shouldInvalidateBoardSurfaceForTvBoardZoomMutation(
        mutation,
        watchedNodes
      );
      const touchesSemanticSurface = isDescendantWatchedNodeMutation(mutation, semanticNodes) ||
        getTouchedMutationNodes(mutation).some((node) =>
          nodeOrAncestorMatchesAnySelector(node, ZOOM_SEMANTIC_CONTAINER_SELECTORS)
        );
      if (touchesSemanticSurface || invalidatesBoardSurface) {
        shouldSchedule = true;
      }
      if (invalidatesBoardSurface) {
        shouldInvalidateBoardCache = true;
      }
    }
  });

  return {
    shouldSchedule,
    shouldInvalidateBoardCache,
  };
}

export function shouldScheduleTvBoardZoomMutation(mutations = [], context = {}) {
  return resolveTvBoardZoomMutationReaction(mutations, context).shouldSchedule;
}

function resolveMutationType(mutation) {
  if (mutation?.type) {
    return String(mutation.type);
  }
  if (mutation?.attributeName) {
    return "attributes";
  }
  if (mutation?.addedNodes || mutation?.removedNodes) {
    return "childList";
  }
  return "";
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

function isReusableBoardSurface(surface) {
  if (!surface?.svg || !surface?.group) {
    return false;
  }
  if (!isConnectedNode(surface.svg) || !isConnectedNode(surface.group)) {
    return false;
  }
  if (surface.zoomTarget) {
    if (!isConnectedNode(surface.zoomTarget) || !nodeContainsNode(surface.zoomTarget, surface.svg)) {
      return false;
    }
  }
  if (surface.zoomHost) {
    const containedNode = surface.zoomTarget || surface.svg;
    if (!isConnectedNode(surface.zoomHost) || !nodeContainsNode(surface.zoomHost, containedNode)) {
      return false;
    }
  }
  return true;
}

function hasActiveTurnSurface(documentRef, matchSurface) {
  const turnNode = documentRef?.getElementById?.("ad-ext-turn") || null;
  return (Boolean(turnNode) && turnNode.isConnected !== false) ||
    Boolean(matchSurface?.turnContainer && matchSurface.variant === "X01");
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

function resolveFeatureDebugLogger(featureDebug, level) {
  if (level === "warn" && typeof featureDebug?.warn === "function") {
    return featureDebug.warn.bind(featureDebug);
  }
  if (typeof featureDebug?.log === "function") {
    return featureDebug.log.bind(featureDebug);
  }
  return null;
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

  const logger = resolveFeatureDebugLogger(debugState.featureDebug, level);
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
    lastActiveScore: Number.NaN,
    lastAppliedSignature: "",
    lastAppliedIntentSignature: "",
    lastAppliedZoomTransform: null,
    releaseTimeoutId: 0,
    targetStyleSnapshot: null,
    hostStyleSnapshot: null,
    gifStyleSnapshots: [],
    gifManagedNodes: new WeakSet(),
    gifContainmentDirty: true,
    gifContainmentTarget: null,
    gifContainmentHost: null,
    gifContainmentRectSignature: "",
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
  let lastMatchSurface = null;
  const debugState = createDebugState(featureDebug);

  domGuards.ensureStyle(STYLE_ID, buildStyleText());

  function invalidateBoardCache() {
    boardCache.surface = null;
    zoomState.gifContainmentDirty = true;
  }

  function markGifContainmentDirty() {
    zoomState.gifContainmentDirty = true;
  }

  function syncGifContainmentIfNeeded(targetNode, hostNode) {
    const containmentHost = hostNode || targetNode;
    const rect = containmentHost?.getBoundingClientRect?.();
    const rectSignature = [
      Number(rect?.left) || 0,
      Number(rect?.top) || 0,
      Number(rect?.width) || Number(containmentHost?.clientWidth || containmentHost?.offsetWidth || 0),
      Number(rect?.height) || Number(containmentHost?.clientHeight || containmentHost?.offsetHeight || 0),
    ].join(":");
    const bindingsChanged =
      zoomState.gifContainmentTarget !== targetNode ||
      zoomState.gifContainmentHost !== containmentHost ||
      zoomState.gifContainmentRectSignature !== rectSignature;
    if (!zoomState.gifContainmentDirty && !bindingsChanged) {
      return false;
    }

    syncGifOverlayContainment(zoomState, targetNode, containmentHost);
    zoomState.gifContainmentDirty = false;
    zoomState.gifContainmentTarget = targetNode;
    zoomState.gifContainmentHost = containmentHost;
    zoomState.gifContainmentRectSignature = rectSignature;
    return true;
  }

  function getBoardSurface() {
    const cachedSurface = boardCache.surface;
    if (isReusableBoardSurface(cachedSurface)) {
      return cachedSurface;
    }

    const boardSurface = resolveBoardRenderSurface(documentRef);
    boardCache.surface = boardSurface;
    return boardSurface;
  }

  let scheduler = null;
  let holdTimerId = 0;
  let integrityTimerId = 0;
  let gifOverlayShadowRoot = null;
  let resizeObserver = null;
  let resizeObserverNodes = [];

  function clearHoldTimer() {
    if (holdTimerId) {
      windowRef.clearTimeout(holdTimerId);
    }
    holdTimerId = 0;
  }

  function clearIntegrityTimer() {
    if (integrityTimerId) {
      windowRef.clearTimeout(integrityTimerId);
    }
    integrityTimerId = 0;
  }

  function scheduleIntegrityCheck() {
    clearIntegrityTimer();
    if (!zoomState.zoomedElement || documentRef.hidden || documentRef.visibilityState === "hidden") {
      return;
    }

    integrityTimerId = windowRef.setTimeout(() => {
      integrityTimerId = 0;
      scheduler?.schedule?.();
    }, ACTIVE_ZOOM_INTEGRITY_CHECK_MS);
  }

  function disconnectResizeObserver() {
    resizeObserver?.disconnect?.();
    resizeObserverNodes = [];
  }

  function syncResizeObserver(nodes = []) {
    const nextNodes = [...new Set(nodes.filter((node) => node && isConnectedNode(node)))];
    if (
      nextNodes.length === resizeObserverNodes.length &&
      nextNodes.every((node, index) => node === resizeObserverNodes[index])
    ) {
      return;
    }

    disconnectResizeObserver();
    if (typeof windowRef.ResizeObserver !== "function" || !nextNodes.length) {
      return;
    }

    resizeObserver ||= new windowRef.ResizeObserver(() => {
      markGifContainmentDirty();
      scheduler?.schedule?.();
    });
    nextNodes.forEach((node) => resizeObserver.observe?.(node));
    resizeObserverNodes = nextNodes;
  }

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
      resetZoom(speedConfig, zoomState, Boolean(options.immediate), {
        preserveGifContainment: Boolean(options.preserveGifContainment),
      });
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
    resetZoom(speedConfig, zoomState, false, {
      preserveGifContainment: Boolean(options.preserveGifContainment),
    });
    emitDebugEvent(debugState, reason === "board-missing" || reason === "target-missing" ? "warn" : "log", {
      status: "reset",
      reason,
    });
  }

  function ensureGifOverlayObserver() {
    const animationHost = documentRef.querySelector?.(TOOLS_ANIMATION_HOST_SELECTOR) || null;
    const nextShadowRoot = animationHost?.shadowRoot || null;
    if (nextShadowRoot === gifOverlayShadowRoot) {
      return;
    }

    observerRegistry?.disconnect?.(GIF_OBSERVER_KEY);
    gifOverlayShadowRoot = nextShadowRoot;
    if (!nextShadowRoot || typeof observerRegistry?.registerMutationObserver !== "function") {
      return;
    }

    observerRegistry.registerMutationObserver({
      key: GIF_OBSERVER_KEY,
      target: nextShadowRoot,
      callback: () => {
        markGifContainmentDirty();
        scheduler?.schedule?.();
      },
      observeOptions: {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["class", "src", "hidden"],
      },
      MutationObserverRef: windowRef?.MutationObserver,
    });
  }

  scheduler = schedulerFactory(() => {
    clearHoldTimer();
    clearIntegrityTimer();
    ensureGifOverlayObserver();
    const matchSurface = readModernMatchSurface(documentRef, windowRef);
    lastMatchSurface = matchSurface;
    if (!hasActiveTurnSurface(documentRef, matchSurface)) {
      disconnectResizeObserver();
      invalidateBoardCache();
      markManualZoomPause(zoomState);
      zoomState.lastTurnId = "";
      zoomState.lastThrowCount = -1;
      zoomState.manualPause = false;
      requestZoomReset("match-surface-inactive", {
        force: true,
        immediate: true,
      });
      return;
    }

    const boardSurface = getBoardSurface();
    const boardSvg = boardSurface?.svg || null;
    if (!boardSvg) {
      disconnectResizeObserver();
      requestZoomReset("board-missing");
      return;
    }

    const inputSafeBoardSurface = resolveInputSafeBoardSurface(
      documentRef,
      gameState,
      boardSurface,
      windowRef
    );
    const effectiveBoardSurface = inputSafeBoardSurface || boardSurface;
    const targetNode = effectiveBoardSurface?.zoomTarget || resolveZoomTarget(boardSvg);
    if (!targetNode) {
      disconnectResizeObserver();
      requestZoomReset("target-missing");
      return;
    }

    const hostNode = effectiveBoardSurface?.zoomHost || resolveZoomHost(targetNode);
    syncResizeObserver([targetNode, hostNode, boardSvg]);
    syncGifContainmentIfNeeded(targetNode, hostNode);

    const intent = computeZoomIntent({
      gameState,
      x01Rules,
      state: zoomState,
      documentRef,
      windowRef,
      featureConfig,
      matchSurface,
    });
    if (zoomState.holdUntilTs > Date.now()) {
      holdTimerId = windowRef.setTimeout(() => {
        holdTimerId = 0;
        scheduler.schedule();
      }, zoomState.holdUntilTs - Date.now());
    }
    const lifecycleResetReason = String(zoomState.pendingLifecycleResetReason || "");
    zoomState.pendingLifecycleResetReason = "";

    if (!inputSafeBoardSurface) {
      disconnectResizeObserver();
      requestZoomReset("virtual-board-input", {
        force: true,
        immediate: true,
        preserveGifContainment: true,
      });
      return;
    }

    if (!intent) {
      requestZoomReset(lifecycleResetReason || "intent-missing", {
        force: Boolean(lifecycleResetReason),
        immediate: Boolean(lifecycleResetReason),
        preserveGifContainment: true,
      });
      return;
    }

    clearTransientResetState();
    if (lifecycleResetReason) {
      resetZoom(speedConfig, zoomState, true, {
        preserveGifContainment: true,
      });
      emitDebugEvent(debugState, "log", {
        status: "reset",
        reason: lifecycleResetReason,
      });
    }

    const zoomData = applyZoom(
      { targetNode, hostNode, boardSvg },
      zoomLevel,
      speedConfig,
      intent,
      zoomState,
      {
        x01Rules,
        windowRef,
        documentRef,
        syncGifOverlayContainment: false,
      }
    );
    if (zoomData) {
      scheduleIntegrityCheck();
    }
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
      (node) => Boolean(node && zoomState.gifManagedNodes?.has?.(node)),
    ],
  });

  const rootNode = documentRef.documentElement || documentRef.body || documentRef;
  if (observerRegistry && typeof observerRegistry.registerMutationObserver === "function") {
    observerRegistry.registerMutationObserver({
      key: OBSERVER_KEY,
      target: rootNode,
      callback: (mutations = []) => {
        // Reconsider visual writes on active zoom nodes so external overrides can
        // heal. The RAF scheduler and applied-style fast path absorb our own writes.
        const externalMutations = mutations.filter((mutation) => {
          const isManagedZoomVisualMutation =
            resolveMutationType(mutation) === "attributes" &&
            ["class", "style"].includes(mutation.attributeName) &&
            (mutation.target === zoomState.zoomedElement || mutation.target === zoomState.zoomHost);
          return isManagedZoomVisualMutation ||
            resolveMutationType(mutation) !== "attributes" ||
            !["class", "style"].includes(mutation.attributeName) ||
            hasExternalDomMutation([mutation], isManagedNode);
        });
        if (!externalMutations.length) {
          return;
        }
        const mutationReaction = resolveTvBoardZoomMutationReaction(externalMutations, {
          boardSurface: boardCache.surface,
          zoomState,
          matchSurface: lastMatchSurface,
        });
        if (!mutationReaction.shouldSchedule) {
          return;
        }
        if (mutationReaction.shouldInvalidateBoardCache) {
          invalidateBoardCache();
        }
        markGifContainmentDirty();
        scheduler.schedule();
      },
      observeOptions: {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeFilter: [
          ...new Set([
            "class",
            "style",
            "hidden",
            "aria-hidden",
            ...BOARD_INPUT_MODE_ATTRIBUTE_FILTER,
          ]),
        ],
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
        markGifContainmentDirty();
        scheduler.schedule();
      },
      options: { passive: true },
    });
    listenerRegistry.register({
      key: LISTENER_KEYS.orientation,
      target: windowRef,
      type: "orientationchange",
      handler: () => {
        markGifContainmentDirty();
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
        clearHoldTimer();
        clearIntegrityTimer();
        clearTransientResetState();
        resetZoom(speedConfig, zoomState, false, {
          preserveGifContainment: true,
        });
      },
      options: { passive: true, capture: true },
    });
    listenerRegistry.register({
      key: LISTENER_KEYS.visibility,
      target: documentRef,
      type: "visibilitychange",
      handler: () => {
        markGifContainmentDirty();
        scheduler.schedule();
      },
    });
    listenerRegistry.register({
      key: LISTENER_KEYS.beforeUnload,
      target: windowRef,
      type: "beforeunload",
      handler: () => {
        clearTransientResetState();
        clearHoldTimer();
        clearIntegrityTimer();
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
    clearHoldTimer();
    clearIntegrityTimer();
    disconnectResizeObserver();
    try {
      unsubscribeGameState();
    } catch (_) {
      // Fail-soft cleanup.
    }

    if (observerRegistry && typeof observerRegistry.disconnect === "function") {
      observerRegistry.disconnect(OBSERVER_KEY);
      observerRegistry.disconnect(GIF_OBSERVER_KEY);
    }
    gifOverlayShadowRoot = null;

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
