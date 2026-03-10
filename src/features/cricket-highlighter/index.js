import {
  buildCricketRenderState,
  clearCricketHighlights,
  renderCricketHighlights,
} from "./logic.js";
import { OVERLAY_ID, STYLE_ID, buildStyleText, resolveCricketVisualConfig } from "./style.js";
import { CRICKET_SURFACE_STATUS } from "../cricket-surface/pipeline.js";
import { createManagedNodeMatcher, hasExternalDomMutation } from "../../core/dom-mutation-filter.js";
import { findBoardSvgGroup } from "../../shared/dartboard-svg.js";

const FEATURE_KEY = "cricket-highlighter";
const OBSERVER_KEY = `${FEATURE_KEY}:dom-observer`;
const LISTENER_KEYS = Object.freeze({
  resize: `${FEATURE_KEY}:window-resize`,
  orientation: `${FEATURE_KEY}:window-orientation`,
  visibility: `${FEATURE_KEY}:document-visibility`,
});

const SURFACE_SELECTOR = [
  "#grid",
  ".ad-ext-cricket-grid",
  ".chakra-grid",
  ".label-cell",
  ".player-cell",
  "[data-row-label]",
  "[data-target-label]",
  "#ad-ext-game-variant",
  "#ad-ext-player-display",
  ".ad-ext-player",
  ".ad-ext-theme-content-slot",
  ".ad-ext-theme-content-board",
  ".ad-ext-theme-board-panel",
  ".ad-ext-theme-board-viewport",
  ".ad-ext-theme-board-svg",
].join(",");

function readVariantText(documentRef) {
  return String(documentRef?.getElementById?.("ad-ext-game-variant")?.textContent || "").trim();
}

function createDebugState(featureDebug) {
  return {
    featureDebug,
    lastLogSignature: "",
    lastWarningSignature: "",
  };
}

function emitDebugLog(debugState, signature, message) {
  if (!debugState?.featureDebug?.enabled || !signature) {
    return;
  }
  if (debugState.lastLogSignature === signature) {
    return;
  }
  debugState.lastLogSignature = signature;
  debugState.featureDebug.log(message);
}

function emitDebugWarning(debugState, signature, message) {
  if (!debugState?.featureDebug?.enabled || !signature) {
    return;
  }
  if (debugState.lastWarningSignature === signature) {
    return;
  }
  debugState.lastWarningSignature = signature;
  debugState.featureDebug.warn(message);
}

function isSurfaceMutationNode(node) {
  if (!node || typeof node !== "object") {
    return false;
  }
  if (typeof node.closest === "function" && node.closest("#ad-xconfig-panel-host")) {
    return false;
  }
  if (typeof node.matches === "function" && node.matches(SURFACE_SELECTOR)) {
    return true;
  }
  if (typeof node.closest === "function" && node.closest(".ad-ext-theme-board-canvas, .ad-ext-theme-content-board")) {
    return true;
  }
  if (typeof node.querySelector === "function" && node.querySelector(SURFACE_SELECTOR)) {
    return true;
  }
  return false;
}

function hasOverlayRemovalMutation(mutations = []) {
  if (!Array.isArray(mutations) || !mutations.length) {
    return false;
  }
  return mutations.some((mutation) => {
    const removedNodes = Array.from(mutation?.removedNodes || []);
    return removedNodes.some((node) => String(node?.id || "") === OVERLAY_ID);
  });
}

function hasRelevantCricketMutation(mutations = []) {
  if (!Array.isArray(mutations) || !mutations.length) {
    return false;
  }

  return mutations.some((mutation) => {
    const target = mutation?.target || null;
    if (isSurfaceMutationNode(target)) {
      return true;
    }
    const touchedNodes = [
      ...Array.from(mutation?.addedNodes || []),
      ...Array.from(mutation?.removedNodes || []),
    ];
    return touchedNodes.some((node) => isSurfaceMutationNode(node));
  });
}

function resolveOverlayHealth(documentRef, cache = null) {
  const cachedBoard = cache?.board;
  const board =
    cachedBoard?.group?.isConnected !== false
      ? cachedBoard
      : findBoardSvgGroup(documentRef);
  if (cache && typeof cache === "object") {
    cache.board = board;
  }
  if (!board?.group) {
    return false;
  }

  const overlay = board.group.querySelector?.(`#${OVERLAY_ID}`) || null;
  return Boolean(overlay && overlay.isConnected !== false);
}

function buildStatusSignature(renderState) {
  return `${renderState?.surfaceStatus || "unknown"}::${renderState?.variantText || "-"}`;
}

export function initializeCricketHighlighter(context = {}) {
  const documentRef = context.documentRef || (typeof document !== "undefined" ? document : null);
  const windowRef = context.windowRef || (typeof window !== "undefined" ? window : null);
  const domGuards = context.domGuards;
  const observerRegistry = context.registries?.observers;
  const listenerRegistry = context.registries?.listeners;
  const gameState = context.gameState;
  const variantRules = context.domain?.variantRules;
  const cricketRules = context.domain?.cricketRules;
  const config = context.config;
  const featureDebug = context.featureDebug || null;
  const schedulerFactory = context.helpers?.createRafScheduler;

  if (!documentRef || !domGuards || !cricketRules || typeof schedulerFactory !== "function") {
    return () => {};
  }

  const featureConfig =
    config && typeof config.getFeatureConfig === "function"
      ? config.getFeatureConfig("cricketHighlighter")
      : {
        showOpenObjectives: false,
        showDeadObjectives: true,
        colorTheme: "standard",
        intensity: "normal",
      };
  const visualConfig = resolveCricketVisualConfig(featureConfig);

  domGuards.ensureStyle(STYLE_ID, buildStyleText());

  let lastPipelineSignature = "";
  let lastStatusSignature = "";
  const debugState = createDebugState(featureDebug);
  const renderCache = {
    grid: null,
    board: null,
    gridStableRowsByLabel: null,
    overlayShapeState: null,
  };

  function invalidateRenderCache() {
    renderCache.grid = null;
    renderCache.board = null;
    renderCache.overlayShapeState = null;
  }

  function clearAndReset(options = {}) {
    const clearOverlay = options.clearOverlay !== false;
    lastPipelineSignature = "";
    renderCache.overlayShapeState = null;
    if (clearOverlay) {
      clearCricketHighlights(documentRef);
    }
  }

  function update() {
    const renderState = buildCricketRenderState({
      documentRef,
      windowRef,
      gameState,
      cricketRules,
      variantRules,
      enforceVariantGuard: true,
      visualConfig,
      cache: renderCache,
    });
    const surfaceStatus = renderState?.surfaceStatus || CRICKET_SURFACE_STATUS.MISSING_GRID;
    const statusSignature = buildStatusSignature(renderState);
    const variantText = renderState?.variantText || readVariantText(documentRef);

    if (surfaceStatus === CRICKET_SURFACE_STATUS.PAUSED_ROUTE) {
      if (statusSignature === lastStatusSignature) {
        return;
      }
      lastStatusSignature = statusSignature;
      clearAndReset({ clearOverlay: true });
      emitDebugLog(
        debugState,
        statusSignature,
        `state paused route variant="${variantText || "-"}"`
      );
      return;
    }

    if (surfaceStatus === CRICKET_SURFACE_STATUS.INACTIVE_VARIANT) {
      if (statusSignature === lastStatusSignature) {
        return;
      }
      lastStatusSignature = statusSignature;
      clearAndReset({ clearOverlay: true });
      emitDebugLog(
        debugState,
        statusSignature,
        `state inactive variant="${variantText || "-"}"`
      );
      return;
    }

    if (surfaceStatus === CRICKET_SURFACE_STATUS.MISSING_GRID) {
      if (statusSignature === lastStatusSignature) {
        return;
      }
      lastStatusSignature = statusSignature;
      clearAndReset({ clearOverlay: false });
      emitDebugWarning(
        debugState,
        statusSignature,
        `warn kein Grid variant="${variantText || "-"}"`
      );
      return;
    }

    if (surfaceStatus === CRICKET_SURFACE_STATUS.MISSING_BOARD) {
      if (statusSignature === lastStatusSignature) {
        return;
      }
      lastStatusSignature = statusSignature;
      clearAndReset({ clearOverlay: false });
      emitDebugWarning(
        debugState,
        statusSignature,
        `warn kein Board variant="${variantText || "-"}"`
      );
      return;
    }

    lastStatusSignature = "";
    const signature = String(renderState?.pipelineSignature || "");
    if (!signature) {
      clearAndReset({ clearOverlay: false });
      return;
    }

    const overlayHealthy = resolveOverlayHealth(documentRef, renderCache);
    if (signature === lastPipelineSignature && overlayHealthy) {
      return;
    }

    const debugStats = {};
    const rendered = renderCricketHighlights({
      documentRef,
      visualConfig,
      renderState,
      cache: renderCache,
      debugStats,
    });

    if (!rendered) {
      clearAndReset({ clearOverlay: false });
      emitDebugWarning(
        debugState,
        `${signature}::render-failed`,
        `warn render fehlgeschlagen variant="${variantText || "-"}"`
      );
      return;
    }

    lastPipelineSignature = signature;
    const logSignature = [
      signature,
      debugStats.renderedShapeCount || 0,
      debugStats.nonOpenTargetCount || 0,
      debugStats.openTargetCount || 0,
      debugStats.renderedOpenTargetCount || 0,
    ].join("::");

    emitDebugLog(
      debugState,
      logSignature,
      `state variant="${variantText || "-"}" gameMode="${renderState.gameModeNormalized || "-"}" scoring="${renderState.scoringModeNormalized || "-"}" active=${Number(renderState.activePlayerIndex) || 0} status="${surfaceStatus}" shapes=${Number(debugStats.renderedShapeCount) || 0} nonOpen=${Number(debugStats.nonOpenTargetCount) || 0} open=${Number(debugStats.openTargetCount) || 0}/${Number(debugStats.renderedOpenTargetCount) || 0}`
    );
  }

  const scheduler = schedulerFactory(update, { windowRef });
  const rootNode = documentRef.getElementById?.("root") || documentRef.body || documentRef.documentElement || documentRef;
  const isManagedNode = createManagedNodeMatcher({
    ids: [OVERLAY_ID],
  });

  if (observerRegistry && typeof observerRegistry.registerMutationObserver === "function") {
    observerRegistry.registerMutationObserver({
      key: OBSERVER_KEY,
      target: rootNode,
      callback: (mutations = []) => {
        if (!hasExternalDomMutation(mutations, isManagedNode)) {
          return;
        }
        if (hasOverlayRemovalMutation(mutations)) {
          invalidateRenderCache();
          scheduler.schedule();
          return;
        }
        if (!hasRelevantCricketMutation(mutations)) {
          return;
        }
        invalidateRenderCache();
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
      key: LISTENER_KEYS.resize,
      target: windowRef,
      type: "resize",
      handler: () => {
        invalidateRenderCache();
        scheduler.schedule();
      },
      options: { passive: true },
    });
    listenerRegistry.register({
      key: LISTENER_KEYS.orientation,
      target: windowRef,
      type: "orientationchange",
      handler: () => {
        invalidateRenderCache();
        scheduler.schedule();
      },
      options: { passive: true },
    });
    listenerRegistry.register({
      key: LISTENER_KEYS.visibility,
      target: documentRef,
      type: "visibilitychange",
      handler: () => {
        invalidateRenderCache();
        scheduler.schedule();
      },
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
      // keep cleanup fail-soft
    }

    if (observerRegistry && typeof observerRegistry.disconnect === "function") {
      observerRegistry.disconnect(OBSERVER_KEY);
    }
    if (listenerRegistry && typeof listenerRegistry.remove === "function") {
      Object.values(LISTENER_KEYS).forEach((key) => listenerRegistry.remove(key));
    }

    clearCricketHighlights(documentRef);
    invalidateRenderCache();
    domGuards.removeNodeById(STYLE_ID);
  };
}

export const mountCricketHighlighter = initializeCricketHighlighter;
export const initialize = initializeCricketHighlighter;
export const mount = initializeCricketHighlighter;
