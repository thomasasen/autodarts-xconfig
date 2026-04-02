import { buildCricketRenderState, CRICKET_SURFACE_STATUS } from "../cricket-surface/pipeline.js";
import {
  canDelayMissingMatchBoardGap,
  clearDegradedHostRecoveryRecord,
  DEGRADED_HOST_RECOVERY_STATUS,
  DEGRADED_HOST_RECOVERY_REARM_MS,
  hasPendingDegradedHostRecovery,
  hasDegradedHostRecoveryRecord,
  maybeRecoverDegradedMatchHost,
  resolveMissingMatchBoardGapDelay,
  resolvePendingDegradedHostRecheckDelay,
} from "../cricket-surface/degraded-host-recovery.js";
import {
  collectCricketSurfaceWatchNodes,
  hasTrackedCricketSurfaceMutation,
  setCricketSurfaceWatchNodes,
} from "../cricket-surface/surface-watch.js";
import {
  clearCricketGridFxState,
  createCricketGridFxState,
  updateCricketGridFx,
} from "./logic.js";
import {
  BADGE_CLASS,
  CELL_CLASS,
  DELTA_CLASS,
  ROW_WAVE_CLASS,
  SPARK_CLASS,
  STYLE_ID,
  WIPE_CLASS,
  buildStyleText,
  resolveCricketGridFxConfig,
} from "./style.js";
import { createManagedNodeMatcher, hasExternalDomMutation } from "../../core/dom-mutation-filter.js";
import {
  BOARD_INPUT_MODE_ATTRIBUTE_FILTER,
  isBoardInputModeControl,
} from "../../shared/board-input-mode.js";

const FEATURE_KEY = "cricket-grid-fx";
const OBSERVER_KEY = `${FEATURE_KEY}:dom-observer`;
const POST_TRANSITION_SURFACE_AUDIT_MS = 420;
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
  ".ad-ext-theme-content-board",
  ".ad-ext-theme-board-panel",
  ".ad-ext-theme-board-viewport",
  ".ad-ext-theme-board-canvas",
  ".ad-ext-theme-board-svg",
].join(",");

const SURFACE_SCOPE_SELECTOR = [
  "#grid",
  ".ad-ext-cricket-grid",
  ".ad-ext-crfx-root",
  ".chakra-grid",
  "#ad-ext-player-display",
  "#ad-ext-game-variant",
  ".ad-ext-theme-content-board",
  ".ad-ext-theme-board-panel",
  ".ad-ext-theme-board-viewport",
  ".ad-ext-theme-board-canvas",
].join(",");

const SURFACE_ATTRIBUTE_FILTER = Object.freeze([
  "class",
  "alt",
  "title",
  "aria-label",
  "data-marks",
  "data-mark",
  "data-hits",
  "data-hit",
  "data-player-index",
  "data-player",
  "data-column-index",
  "data-row-label",
  "data-target-label",
  ...BOARD_INPUT_MODE_ATTRIBUTE_FILTER,
]);

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
  const anchorNode =
    typeof node.closest === "function"
      ? node
      : node.parentElement || node.parentNode || null;
  if (anchorNode && typeof anchorNode.closest === "function" && anchorNode.closest(SURFACE_SCOPE_SELECTOR)) {
    return true;
  }
  if (isBoardInputModeControl(anchorNode)) {
    return true;
  }
  if (typeof node.matches === "function" && node.matches(SURFACE_SELECTOR)) {
    return true;
  }
  if (typeof node.querySelector === "function" && node.querySelector(SURFACE_SELECTOR)) {
    return true;
  }
  return false;
}

function hasRelevantCricketMutation(mutations = []) {
  if (!Array.isArray(mutations) || !mutations.length) {
    return false;
  }

  const isRelevantAttributeMutation = (mutation) => {
    if (String(mutation?.type || "") !== "attributes") {
      return true;
    }

    const attributeName = String(mutation?.attributeName || "").trim().toLowerCase();
    if (!attributeName) {
      return false;
    }

    if (attributeName !== "class") {
      return SURFACE_ATTRIBUTE_FILTER.includes(attributeName);
    }

    const target = mutation?.target || null;
    if (!target || typeof target.matches !== "function") {
      return false;
    }

    // Avoid feedback loops from our own class toggles on grid cells.
    return target.matches(".ad-ext-player, #ad-ext-player-display, #ad-ext-game-variant");
  };

  return mutations.some((mutation) => {
    if (!isRelevantAttributeMutation(mutation)) {
      return false;
    }

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

function refreshSurfaceWatchNodes(state, renderState, documentRef) {
  if (!state?.surfaceWatchState) {
    return;
  }

  const extraNodes = [
    ...(state.trackedCells instanceof Set ? Array.from(state.trackedCells) : []),
    ...(state.trackedLabels instanceof Set ? Array.from(state.trackedLabels) : []),
  ];

  setCricketSurfaceWatchNodes(state.surfaceWatchState, collectCricketSurfaceWatchNodes({
    documentRef,
    renderState,
    extraNodes,
  }));
}

function buildStatusSignature(renderState) {
  return `${renderState?.surfaceStatus || "unknown"}::${renderState?.variantText || "-"}`;
}

function hasLiveGridRenderContract(state, renderState) {
  if (!state || typeof state !== "object") {
    return false;
  }

  const currentRoot = state.gridRoot || null;
  const expectedRoot = renderState?.gridSnapshot?.root || null;
  if (!currentRoot || currentRoot.isConnected === false) {
    return false;
  }
  if (expectedRoot && currentRoot !== expectedRoot) {
    return false;
  }

  const trackedCells = state.trackedCells instanceof Set ? Array.from(state.trackedCells) : [];
  const trackedLabels = state.trackedLabels instanceof Set ? Array.from(state.trackedLabels) : [];
  if (!trackedCells.length && !trackedLabels.length) {
    return false;
  }

  const allNodesConnected = [...trackedCells, ...trackedLabels].every((node) => {
    return Boolean(node) && node.isConnected !== false;
  });
  if (!allNodesConnected) {
    return false;
  }

  return trackedCells.length > 0
    ? trackedCells.some((node) => node?.classList?.contains(CELL_CLASS))
    : true;
}

export function initializeCricketGridFx(context = {}) {
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
  const degradedHostGraceMs = context.degradedHostGraceMs;
  const degradedHostRecoveryCooldownMs = context.degradedHostRecoveryCooldownMs;
  const degradedHostRecoveryRearmMs = context.degradedHostRecoveryRearmMs;

  if (!documentRef || !domGuards || !cricketRules || typeof schedulerFactory !== "function") {
    return () => {};
  }

  const featureConfig =
    config && typeof config.getFeatureConfig === "function"
      ? config.getFeatureConfig("cricketGridFx")
      : {
        rowWave: true,
        badgeBeacon: true,
        markProgress: true,
        pressureEdge: true,
        scoringStripe: true,
        deadRowMuted: true,
        deltaChips: true,
        hitSpark: true,
        roundTransitionWipe: true,
        pressureOverlay: true,
        colorTheme: "standard",
        intensity: "normal",
      };

  const visualConfig = resolveCricketGridFxConfig(featureConfig);
  domGuards.ensureStyle(STYLE_ID, buildStyleText());

  const state = createCricketGridFxState(windowRef);
  const debugState = createDebugState(featureDebug);
  let lastTransitionSignature = "";
  let lastStatusSignature = "";
  let pendingDegradedHostRecheckHandle = 0;
  let pendingDegradedHostRecheckSignature = "";
  let pendingRecoveryRearmHandle = 0;
  let pendingRecoveryRearmSignature = "";
  let pendingSurfaceAuditHandle = 0;
  let pendingSurfaceAuditSignature = "";
  let completedMissingBoardHoldKey = "";

  const invalidateRenderCache = () => {
    if (state.renderCache && typeof state.renderCache === "object") {
      state.renderCache.grid = null;
      state.renderCache.board = null;
    }
  };

  function clearPendingDegradedHostRecheck() {
    if (pendingDegradedHostRecheckHandle && typeof windowRef?.clearTimeout === "function") {
      windowRef.clearTimeout(pendingDegradedHostRecheckHandle);
    }
    pendingDegradedHostRecheckHandle = 0;
    pendingDegradedHostRecheckSignature = "";
  }

  function clearPendingRecoveryRearm() {
    if (pendingRecoveryRearmHandle && typeof windowRef?.clearTimeout === "function") {
      windowRef.clearTimeout(pendingRecoveryRearmHandle);
    }
    pendingRecoveryRearmHandle = 0;
    pendingRecoveryRearmSignature = "";
  }

  function clearPendingSurfaceAudit() {
    if (pendingSurfaceAuditHandle && typeof windowRef?.clearTimeout === "function") {
      windowRef.clearTimeout(pendingSurfaceAuditHandle);
    }
    pendingSurfaceAuditHandle = 0;
    pendingSurfaceAuditSignature = "";
  }

  function buildMissingBoardHoldKey(renderState) {
    if (!canDelayMissingMatchBoardGap(renderState) || !lastTransitionSignature) {
      return "";
    }
    return `${renderState?.matchRouteId || "-"}::${lastTransitionSignature}`;
  }

  function schedulePostTransitionSurfaceAudit(renderState, transitionSignature) {
    if (
      String(renderState?.surfaceStatus || "") !== CRICKET_SURFACE_STATUS.READY ||
      !transitionSignature ||
      typeof windowRef?.setTimeout !== "function"
    ) {
      clearPendingSurfaceAudit();
      return false;
    }

    if (pendingSurfaceAuditHandle && pendingSurfaceAuditSignature === transitionSignature) {
      return true;
    }

    clearPendingSurfaceAudit();
    pendingSurfaceAuditSignature = transitionSignature;
    pendingSurfaceAuditHandle = windowRef.setTimeout(() => {
      pendingSurfaceAuditHandle = 0;
      pendingSurfaceAuditSignature = "";
      invalidateRenderCache();
      update();
    }, POST_TRANSITION_SURFACE_AUDIT_MS);
    return true;
  }

  function schedulePendingDegradedHostRecheck(renderState) {
    if (!canDelayMissingMatchBoardGap(renderState) || typeof windowRef?.setTimeout !== "function") {
      clearPendingDegradedHostRecheck();
      return false;
    }

    const pendingDegradedHostRecovery = hasPendingDegradedHostRecovery(renderState);
    const missingBoardHoldKey = pendingDegradedHostRecovery ? "" : buildMissingBoardHoldKey(renderState);
    if (!pendingDegradedHostRecovery && (!missingBoardHoldKey || completedMissingBoardHoldKey === missingBoardHoldKey)) {
      clearPendingDegradedHostRecheck();
      return false;
    }

    const delayMs = pendingDegradedHostRecovery
      ? resolvePendingDegradedHostRecheckDelay(renderState, {
        fallbackGraceMs: degradedHostGraceMs,
      })
      : resolveMissingMatchBoardGapDelay(renderState, {
      fallbackGraceMs: degradedHostGraceMs,
    });
    if (!(delayMs > 0)) {
      clearPendingDegradedHostRecheck();
      return false;
    }

    const nextSignature = [
      pendingDegradedHostRecovery ? "degraded-host" : "missing-board-gap",
      renderState?.matchRouteId || "-",
      Number(renderState?.degradedHostInfo?.graceMs) || Number(degradedHostGraceMs) || 0,
      Math.max(0, Math.round(Number(renderState?.degradedHostInfo?.ageMs) || 0)),
      Math.max(1, Math.round(delayMs)),
      missingBoardHoldKey || "-",
    ].join("::");
    if (pendingDegradedHostRecheckHandle && pendingDegradedHostRecheckSignature === nextSignature) {
      return true;
    }

    clearPendingDegradedHostRecheck();
    pendingDegradedHostRecheckSignature = nextSignature;
    pendingDegradedHostRecheckHandle = windowRef.setTimeout(() => {
      if (!pendingDegradedHostRecovery && missingBoardHoldKey) {
        completedMissingBoardHoldKey = missingBoardHoldKey;
      }
      pendingDegradedHostRecheckHandle = 0;
      pendingDegradedHostRecheckSignature = "";
      invalidateRenderCache();
      update();
    }, delayMs);
    return true;
  }

  function scheduleRecoveryRearm(renderState) {
    const matchId = String(renderState?.matchRouteId || "").trim();
    if (!matchId || !hasDegradedHostRecoveryRecord({ matchId, windowRef })) {
      clearPendingRecoveryRearm();
      return false;
    }
    if (typeof windowRef?.setTimeout !== "function") {
      clearPendingRecoveryRearm();
      return false;
    }

    const delayMs = Math.max(
      1,
      Number.isFinite(Number(degradedHostRecoveryRearmMs))
        ? Number(degradedHostRecoveryRearmMs)
        : DEGRADED_HOST_RECOVERY_REARM_MS
    );
    const nextSignature = `${matchId}::${delayMs}`;
    if (pendingRecoveryRearmHandle && pendingRecoveryRearmSignature === nextSignature) {
      return true;
    }

    clearPendingRecoveryRearm();
    pendingRecoveryRearmSignature = nextSignature;
    pendingRecoveryRearmHandle = windowRef.setTimeout(() => {
      pendingRecoveryRearmHandle = 0;
      pendingRecoveryRearmSignature = "";
      clearDegradedHostRecoveryRecord({ matchId, windowRef });
    }, delayMs);
    return true;
  }

  function clearAndReset() {
    lastTransitionSignature = "";
    clearCricketGridFxState(state);
  }

  function update() {
    const renderState = buildCricketRenderState({
      documentRef,
      windowRef,
      gameState,
      cricketRules,
      variantRules,
      enforceVariantGuard: true,
      degradedHostGraceMs,
      visualConfig,
      cache: state.renderCache,
    });
    const surfaceStatus = renderState?.surfaceStatus || CRICKET_SURFACE_STATUS.MISSING_GRID;
    const statusSignature = buildStatusSignature(renderState);
    const variantText = renderState?.variantText || readVariantText(documentRef);
    const pendingDegradedHostRecheck = hasPendingDegradedHostRecovery(renderState);
    const delayedMissingBoardGap = canDelayMissingMatchBoardGap(renderState) && Boolean(lastTransitionSignature);

    if (!pendingDegradedHostRecheck && !delayedMissingBoardGap) {
      clearPendingDegradedHostRecheck();
    }
    if (surfaceStatus !== CRICKET_SURFACE_STATUS.READY) {
      clearPendingRecoveryRearm();
      clearPendingSurfaceAudit();
    }

    if (surfaceStatus === CRICKET_SURFACE_STATUS.PAUSED_ROUTE) {
      if (statusSignature === lastStatusSignature) {
        return;
      }
      lastStatusSignature = statusSignature;
      clearAndReset();
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
      clearAndReset();
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
      clearAndReset();
      emitDebugWarning(
        debugState,
        statusSignature,
        `warn kein Grid variant="${variantText || "-"}"`
      );
      return;
    }

    if (surfaceStatus === CRICKET_SURFACE_STATUS.MISSING_BOARD) {
      const scheduledRecheck = schedulePendingDegradedHostRecheck(renderState);
      if (scheduledRecheck) {
        if (statusSignature === lastStatusSignature) {
          return;
        }
        lastStatusSignature = statusSignature;
        emitDebugWarning(
          debugState,
          `${statusSignature}::pending-board-gap::${renderState?.matchRouteId || "-"}`,
          `warn kein Board variant="${variantText || "-"}" match="${renderState?.matchRouteId || "-"}" pendingRecheck="true"`
        );
        return;
      }
      if (statusSignature === lastStatusSignature) {
        return;
      }
      lastStatusSignature = statusSignature;
      clearAndReset();
      emitDebugWarning(
        debugState,
        statusSignature,
        `warn kein Board variant="${variantText || "-"}"`
      );
      return;
    }

    if (surfaceStatus === CRICKET_SURFACE_STATUS.DEGRADED_HOST) {
      if (statusSignature === lastStatusSignature) {
        return;
      }
      lastStatusSignature = statusSignature;
      clearAndReset();
      const recovery = maybeRecoverDegradedMatchHost({
        renderState,
        windowRef,
        cooldownMs: degradedHostRecoveryCooldownMs,
      });
      const recoveryStatus =
        recovery?.status || DEGRADED_HOST_RECOVERY_STATUS.BLOCKED;
      emitDebugWarning(
        debugState,
        `${statusSignature}::${recoveryStatus}::${renderState?.matchRouteId || "-"}`,
        `warn degraded host variant="${variantText || "-"}" match="${renderState?.matchRouteId || "-"}" recovery="${recoveryStatus}"`
      );
      return;
    }

    completedMissingBoardHoldKey = "";
    scheduleRecoveryRearm(renderState);
    lastStatusSignature = "";
    const transitionSignature = String(renderState?.transitionSignature || "");
    if (!transitionSignature) {
      clearAndReset();
      return;
    }
    const renderContractLive = hasLiveGridRenderContract(state, renderState);
    if (transitionSignature === lastTransitionSignature && renderContractLive) {
      refreshSurfaceWatchNodes(state, renderState, documentRef);
      return;
    }

    const debugStats = {};
    updateCricketGridFx({
      documentRef,
      cricketRules,
      renderState,
      state,
      visualConfig,
      turnToken: renderState.turnToken || "",
      debugStats,
    });

    if (debugStats.status === "missing-grid") {
      clearAndReset();
      emitDebugWarning(
        debugState,
        `${transitionSignature}::missing-grid`,
        `warn kein Grid variant="${variantText || "-"}" gameMode="${renderState.gameModeNormalized || "-"}"`
      );
      return;
    }

    const hadPriorReadyTransition = Boolean(lastTransitionSignature);
    const transitionChanged = transitionSignature !== lastTransitionSignature;
    lastTransitionSignature = transitionSignature;
    refreshSurfaceWatchNodes(state, renderState, documentRef);
    if (hadPriorReadyTransition && transitionChanged) {
      schedulePostTransitionSurfaceAudit(renderState, transitionSignature);
    }
    const logSignature = [
      transitionSignature,
      debugStats.status || "unknown",
      Number(debugStats.rowCount) || 0,
      Number(debugStats.scoreCellCount) || 0,
      Number(debugStats.rowWaveDeltaCount) || 0,
      Number(debugStats.rowWaveTacticalCount) || 0,
      debugStats.turnTokenChanged ? 1 : 0,
      renderState?.activeThrowPreviewDebug?.applied ? 1 : 0,
      renderState?.activeThrowPreviewDebug?.suppressionReason || "none",
    ].join("::");

    emitDebugLog(
      debugState,
      logSignature,
      `state variant="${variantText || "-"}" gameMode="${renderState.gameModeNormalized || "-"}" scoring="${renderState.scoringModeNormalized || "-"}" active=${Number(renderState.activePlayerIndex) || 0} status="${surfaceStatus}" rows=${Number(debugStats.rowCount) || 0} scoringRows=${Number(debugStats.scoringRowCount) || 0} pressureRows=${Number(debugStats.pressureRowCount) || 0} scoreCells=${Number(debugStats.scoreCellCount) || 0} waveDelta=${Number(debugStats.rowWaveDeltaCount) || 0} waveTransition=${Number(debugStats.rowWaveTacticalCount) || 0} wipe=${debugStats.turnTokenChanged ? "1" : "0"} activePreview=${renderState?.activeThrowPreviewDebug?.applied ? "on" : "off"} reason="${renderState?.activeThrowPreviewDebug?.suppressionReason || "none"}" labels="${(renderState?.activeThrowPreviewDebug?.labels || []).join(",")}"`
    );
  }

  const scheduler = schedulerFactory(update, { windowRef });
  const rootNode = documentRef.getElementById?.("root") || documentRef.body || documentRef.documentElement || documentRef;
  const isManagedNode = createManagedNodeMatcher({
    classNames: [BADGE_CLASS, ROW_WAVE_CLASS, DELTA_CLASS, SPARK_CLASS, WIPE_CLASS],
  });

  if (observerRegistry && typeof observerRegistry.registerMutationObserver === "function") {
    observerRegistry.registerMutationObserver({
      key: OBSERVER_KEY,
      target: rootNode,
      callback: (mutations = []) => {
        if (!hasExternalDomMutation(mutations, isManagedNode)) {
          return;
        }
        if (
          !hasRelevantCricketMutation(mutations) &&
          !hasTrackedCricketSurfaceMutation(mutations, state.surfaceWatchState)
        ) {
          return;
        }
        invalidateRenderCache();
        scheduler.schedule();
      },
      observeOptions: {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeFilter: SURFACE_ATTRIBUTE_FILTER.slice(),
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
    clearPendingDegradedHostRecheck();
    clearPendingRecoveryRearm();
    clearPendingSurfaceAudit();

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

    clearCricketGridFxState(state);
    domGuards.removeNodeById(STYLE_ID);
  };
}

export const mountCricketGridFx = initializeCricketGridFx;
export const initialize = initializeCricketGridFx;
export const mount = initializeCricketGridFx;
