import { CRICKET_SURFACE_STATUS } from "../cricket-surface/pipeline.js";
import { acquireSharedCricketRuntime } from "../cricket-surface/shared-runtime.js";
import { collectCricketSurfaceWatchNodes } from "../cricket-surface/surface-watch.js";
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
import { createManagedNodeMatcher } from "../../core/dom-mutation-filter.js";

const FEATURE_KEY = "cricket-grid-fx";
const OBSERVER_KEY = `${FEATURE_KEY}:dom-observer`;

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

function collectRuntimeWatchNodes(state, renderState, documentRef) {
  const extraNodes = [
    ...(state.trackedCells instanceof Set ? Array.from(state.trackedCells) : []),
    ...(state.trackedLabels instanceof Set ? Array.from(state.trackedLabels) : []),
  ];

  return collectCricketSurfaceWatchNodes({
    documentRef,
    renderState,
    extraNodes,
  });
}

export function initializeCricketGridFx(context = {}) {
  const documentRef = context.documentRef || (typeof document !== "undefined" ? document : null);
  const windowRef = context.windowRef || (typeof window !== "undefined" ? window : null);
  const domGuards = context.domGuards;
  const cricketRules = context.domain?.cricketRules;
  const config = context.config;
  const featureDebug = context.featureDebug || null;

  if (!documentRef || !domGuards || !cricketRules) {
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

  const runtime = acquireSharedCricketRuntime(context);
  if (!runtime) {
    return () => {};
  }

  const state = createCricketGridFxState(windowRef);
  state.renderCache = runtime.renderCache;
  const debugState = createDebugState(featureDebug);
  const managedNodeMatcher = createManagedNodeMatcher({
    classNames: [BADGE_CLASS, ROW_WAVE_CLASS, DELTA_CLASS, SPARK_CLASS, WIPE_CLASS],
  });
  let lastTransitionSignature = "";
  let lastStatusSignature = "";

  function clearAndReset() {
    lastTransitionSignature = "";
    clearCricketGridFxState(state);
    state.renderCache = runtime.renderCache;
  }

  const unsubscribeRuntime = runtime.subscribe({
    featureKey: FEATURE_KEY,
    observerAliasKey: OBSERVER_KEY,
    isManagedNode: managedNodeMatcher,
    collectWatchNodes: ({ renderState }) => collectRuntimeWatchNodes(state, renderState, documentRef),
    onRenderState: ({ renderState, lifecycle }) => {
      const surfaceStatus = renderState?.surfaceStatus || CRICKET_SURFACE_STATUS.MISSING_GRID;
      const statusSignature = buildStatusSignature(renderState);
      const variantText = renderState?.variantText || readVariantText(documentRef);

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
        if (lifecycle.pendingDegradedHostRecheck || lifecycle.delayedMissingBoardGap) {
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
        emitDebugWarning(
          debugState,
          `${statusSignature}::${lifecycle.recovery?.status || "blocked"}::${renderState?.matchRouteId || "-"}`,
          `warn degraded host variant="${variantText || "-"}" match="${renderState?.matchRouteId || "-"}" recovery="${lifecycle.recovery?.status || "blocked"}"`
        );
        return;
      }

      lastStatusSignature = "";
      const transitionSignature = String(renderState?.transitionSignature || "");
      if (!transitionSignature) {
        clearAndReset();
        return;
      }

      const renderContractLive = hasLiveGridRenderContract(state, renderState);
      if (transitionSignature === lastTransitionSignature && renderContractLive) {
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

      lastTransitionSignature = transitionSignature;
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
    },
  });

  let cleanedUp = false;
  return function cleanup() {
    if (cleanedUp) {
      return;
    }
    cleanedUp = true;

    unsubscribeRuntime();
    clearCricketGridFxState(state);
    domGuards.removeNodeById(STYLE_ID);
  };
}

export const mountCricketGridFx = initializeCricketGridFx;
export const initialize = initializeCricketGridFx;
export const mount = initializeCricketGridFx;
