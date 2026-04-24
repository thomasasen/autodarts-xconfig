import {
  clearCricketHighlights,
  renderCricketHighlights,
} from "./logic.js";
import {
  OVERLAY_ID,
  PRESENTATION_PATTERN_IDS,
  STYLE_CONTRACT_VERSION,
  STYLE_ID,
  buildStyleText,
  readStyleContractStatus,
  resolveCricketVisualConfig,
} from "./style.js";
import { CRICKET_SURFACE_STATUS } from "../cricket-surface/pipeline.js";
import { acquireSharedCricketRuntime } from "../cricket-surface/shared-runtime.js";
import { collectCricketSurfaceWatchNodes } from "../cricket-surface/surface-watch.js";
import { findBoardSvgGroup, isReusableBoardSnapshot } from "../../shared/dartboard-svg.js";
import { createManagedNodeMatcher } from "../../core/dom-mutation-filter.js";

const FEATURE_KEY = "cricket-highlighter";
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

function formatPresentationCounts(counts) {
  const source = counts && typeof counts === "object" ? counts : {};
  return ["open", "scoring", "pressure", "dead", "inactive"]
    .map((key) => `${key}:${Number(source[key]) || 0}`)
    .join(",");
}

function buildVisualDebugContext(visualConfig, styleContractState) {
  return [
    `dim=${visualConfig?.dimIrrelevantBoardTargets !== false ? "on" : "off"}`,
    `dimStyle="${String(visualConfig?.irrelevantBoardDimStyle || "smoke")}"`,
    `showOpen=${visualConfig?.showOpenObjectives === true ? "on" : "off"}`,
    `showDead=${visualConfig?.showDeadObjectives !== false ? "on" : "off"}`,
    `styleContractOk=${styleContractState?.ok ? "true" : "false"}`,
    `styleContractVersion="${styleContractState?.version || STYLE_CONTRACT_VERSION}"`,
  ].join(" ");
}

function ensureStyleContract({ domGuards, debugState }) {
  const cssText = buildStyleText();
  let styleNode = domGuards.ensureStyle(STYLE_ID, cssText);
  const initialStatus = readStyleContractStatus(styleNode);
  let finalStatus = initialStatus;

  if (!initialStatus.ok) {
    domGuards.removeNodeById(STYLE_ID);
    styleNode = domGuards.ensureStyle(STYLE_ID, cssText);
    finalStatus = readStyleContractStatus(styleNode);

    const missingBefore = initialStatus.missingSelectors.join(",");
    const missingAfter = finalStatus.missingSelectors.join(",");
    emitDebugWarning(
      debugState,
      `style-contract::${STYLE_CONTRACT_VERSION}::${missingBefore || "none"}::${missingAfter || "none"}`,
      `warn style-contract version="${STYLE_CONTRACT_VERSION}" missingBefore="${missingBefore || "-"}" missingAfter="${missingAfter || "-"}" repaired="${finalStatus.ok ? "ok" : "failed"}"`
    );
  }

  return {
    ok: finalStatus.ok,
    version: finalStatus.version || STYLE_CONTRACT_VERSION,
    missingSelectors: finalStatus.missingSelectors,
  };
}

function resolveOverlayHealth(documentRef, cache = null) {
  const board = isReusableBoardSnapshot(cache?.board, documentRef)
    ? cache.board
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

function collectRuntimeWatchNodes(documentRef, renderState) {
  const overlayNode = documentRef?.getElementById?.(OVERLAY_ID) || null;
  return collectCricketSurfaceWatchNodes({
    documentRef,
    renderState,
    extraNodes: overlayNode ? [overlayNode] : [],
  });
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

function handleHighlighterSurfaceStatus(options = {}) {
  const {
    surfaceStatus,
    statusSignature,
    lastStatusSignature,
    variantText,
    lifecycle,
    renderState,
    debugState,
    visualDebugContext,
    clearAndReset,
  } = options;

  if (surfaceStatus === CRICKET_SURFACE_STATUS.PAUSED_ROUTE) {
    if (statusSignature === lastStatusSignature) {
      return { handled: true, lastStatusSignature };
    }
    clearAndReset({ clearOverlay: true });
    emitDebugLog(
      debugState,
      statusSignature,
      `state paused route variant="${variantText || "-"}" ${visualDebugContext}`
    );
    return { handled: true, lastStatusSignature: statusSignature };
  }

  if (surfaceStatus === CRICKET_SURFACE_STATUS.INACTIVE_VARIANT) {
    if (statusSignature === lastStatusSignature) {
      return { handled: true, lastStatusSignature };
    }
    clearAndReset({ clearOverlay: true });
    emitDebugLog(
      debugState,
      statusSignature,
      `state inactive variant="${variantText || "-"}" ${visualDebugContext}`
    );
    return { handled: true, lastStatusSignature: statusSignature };
  }

  if (surfaceStatus === CRICKET_SURFACE_STATUS.MISSING_GRID) {
    if (statusSignature === lastStatusSignature) {
      return { handled: true, lastStatusSignature };
    }
    clearAndReset({ clearOverlay: false });
    emitDebugWarning(
      debugState,
      statusSignature,
      `warn kein Grid variant="${variantText || "-"}" ${visualDebugContext}`
    );
    return { handled: true, lastStatusSignature: statusSignature };
  }

  if (surfaceStatus === CRICKET_SURFACE_STATUS.MISSING_BOARD) {
    if (statusSignature === lastStatusSignature) {
      return { handled: true, lastStatusSignature };
    }
    if (lifecycle?.boardGapDeferred) {
      emitDebugWarning(
        debugState,
        `${statusSignature}::pending-board-gap::${renderState?.matchRouteId || "-"}`,
        `warn kein Board variant="${variantText || "-"}" match="${renderState?.matchRouteId || "-"}" pendingRecheck="true" ${visualDebugContext}`
      );
      return { handled: true, lastStatusSignature: statusSignature };
    }
    clearAndReset({ clearOverlay: false });
    emitDebugWarning(
      debugState,
      statusSignature,
      `warn kein Board variant="${variantText || "-"}" ${visualDebugContext}`
    );
    return { handled: true, lastStatusSignature: statusSignature };
  }

  if (surfaceStatus === CRICKET_SURFACE_STATUS.DEGRADED_HOST) {
    if (statusSignature === lastStatusSignature) {
      return { handled: true, lastStatusSignature };
    }
    clearAndReset({ clearOverlay: true });
    emitDebugWarning(
      debugState,
      `${statusSignature}::${lifecycle?.recovery?.status || "blocked"}::${renderState?.matchRouteId || "-"}`,
      `warn degraded host variant="${variantText || "-"}" match="${renderState?.matchRouteId || "-"}" recovery="${lifecycle?.recovery?.status || "blocked"}" ${visualDebugContext}`
    );
    return { handled: true, lastStatusSignature: statusSignature };
  }

  return {
    handled: false,
    lastStatusSignature: "",
  };
}

export function initializeCricketHighlighter(context = {}) {
  const documentRef = context.documentRef || (typeof document !== "undefined" ? document : null);
  const domGuards = context.domGuards;
  const config = context.config;
  const featureDebug = context.featureDebug || null;

  if (!documentRef || !domGuards) {
    return () => {};
  }

  const featureConfig =
    config && typeof config.getFeatureConfig === "function"
      ? config.getFeatureConfig("cricketHighlighter")
      : {
          showOpenObjectives: false,
          showDeadObjectives: true,
          irrelevantBoardDimStyle: "smoke",
          dimIrrelevantBoardTargets: true,
          colorTheme: "standard",
          intensity: "normal",
        };
  const visualConfig = resolveCricketVisualConfig(featureConfig);
  const debugState = createDebugState(featureDebug);
  const styleContractState = ensureStyleContract({ domGuards, debugState });
  const visualDebugContext = buildVisualDebugContext(visualConfig, styleContractState);

  const runtime = acquireSharedCricketRuntime(context);
  if (!runtime) {
    return () => {};
  }

  runtime.renderCache.overlayShapeState = null;
  const managedNodeMatcher = createManagedNodeMatcher({
    ids: [OVERLAY_ID, ...Object.values(PRESENTATION_PATTERN_IDS)],
  });
  let lastTransitionSignature = "";
  let lastStatusSignature = "";

  function clearAndReset(options = {}) {
    const clearOverlay = options.clearOverlay !== false;
    lastTransitionSignature = "";
    runtime.renderCache.overlayShapeState = null;
    if (clearOverlay) {
      clearCricketHighlights(documentRef);
    }
  }

  const unsubscribeRuntime = runtime.subscribe({
    featureKey: FEATURE_KEY,
    observerAliasKey: OBSERVER_KEY,
    isManagedNode: managedNodeMatcher,
    shouldScheduleMutation: hasOverlayRemovalMutation,
    collectWatchNodes: ({ renderState }) => collectRuntimeWatchNodes(documentRef, renderState),
    onInvalidateCache: (renderCache) => {
      renderCache.overlayShapeState = null;
    },
    onRenderState: ({ renderState, renderCache, lifecycle }) => {
      const surfaceStatus = renderState?.surfaceStatus || CRICKET_SURFACE_STATUS.MISSING_GRID;
      const statusSignature = buildStatusSignature(renderState);
      const variantText = renderState?.variantText || readVariantText(documentRef);
      const surfaceStatusResult = handleHighlighterSurfaceStatus({
        surfaceStatus,
        statusSignature,
        lastStatusSignature,
        variantText,
        lifecycle,
        renderState,
        debugState,
        visualDebugContext,
        clearAndReset,
      });
      lastStatusSignature = surfaceStatusResult.lastStatusSignature;
      if (surfaceStatusResult.handled) {
        return;
      }

      const signature = String(renderState?.transitionSignature || renderState?.pipelineSignature || "");
      if (!signature) {
        clearAndReset({ clearOverlay: false });
        return;
      }

      const overlayHealthy = resolveOverlayHealth(documentRef, renderCache);
      if (signature === lastTransitionSignature && overlayHealthy) {
        return;
      }

      const debugStats = {};
      const rendered = renderCricketHighlights({
        documentRef,
        visualConfig,
        renderState,
        cache: renderCache,
        debugStats,
        onInvariantWarning: (warning) => {
          const presentationCounts = formatPresentationCounts(warning?.shapeCountByPresentation);
          const targetOrder = Array.isArray(warning?.targetOrder) ? warning.targetOrder.join(",") : "";
          const signatureParts = [
            "invariant",
            warning?.type || "unknown",
            Number(warning?.inactiveTargetCount) || 0,
            presentationCounts,
            warning?.dimIrrelevantBoardTargets === false ? 0 : 1,
            warning?.showOpenObjectives === true ? 1 : 0,
            warning?.showDeadObjectives === false ? 0 : 1,
            String(warning?.irrelevantBoardDimStyle || visualConfig?.irrelevantBoardDimStyle || "smoke"),
            targetOrder,
            styleContractState.ok ? 1 : 0,
            styleContractState.version || STYLE_CONTRACT_VERSION,
          ];
          emitDebugWarning(
            debugState,
            signatureParts.join("::"),
            `warn invariant type="${warning?.type || "unknown"}" inactiveTargets=${Number(warning?.inactiveTargetCount) || 0} presentationCounts="${presentationCounts}" targetOrder="${targetOrder || "-"}" dim=${warning?.dimIrrelevantBoardTargets === false ? "off" : "on"} dimStyle="${String(warning?.irrelevantBoardDimStyle || visualConfig?.irrelevantBoardDimStyle || "smoke")}" showOpen=${warning?.showOpenObjectives === true ? "on" : "off"} showDead=${warning?.showDeadObjectives === false ? "off" : "on"} ${visualDebugContext}`
          );
        },
      });

      if (!rendered) {
        clearAndReset({ clearOverlay: false });
        emitDebugWarning(
          debugState,
          `${signature}::render-failed`,
          `warn render fehlgeschlagen variant="${variantText || "-"}" ${visualDebugContext}`
        );
        return;
      }

      const presentationCounts = formatPresentationCounts(debugStats.shapeCountByPresentation);
      lastTransitionSignature = signature;
      const logSignature = [
        signature,
        debugStats.renderedShapeCount || 0,
        debugStats.nonOpenTargetCount || 0,
        debugStats.openTargetCount || 0,
        debugStats.renderedOpenTargetCount || 0,
        debugStats.inactiveTargetCount || 0,
        presentationCounts,
        visualConfig.dimIrrelevantBoardTargets === false ? 0 : 1,
        visualConfig.showOpenObjectives === true ? 1 : 0,
        visualConfig.showDeadObjectives === false ? 0 : 1,
        String(visualConfig.irrelevantBoardDimStyle || "smoke"),
        styleContractState.ok ? 1 : 0,
        styleContractState.version || STYLE_CONTRACT_VERSION,
        renderState?.activeThrowPreviewDebug?.applied ? 1 : 0,
        renderState?.activeThrowPreviewDebug?.suppressionReason || "none",
      ].join("::");

      emitDebugLog(
        debugState,
        logSignature,
        `state variant="${variantText || "-"}" gameMode="${renderState.gameModeNormalized || "-"}" scoring="${renderState.scoringModeNormalized || "-"}" active=${Number(renderState.activePlayerIndex) || 0} status="${surfaceStatus}" shapes=${Number(debugStats.renderedShapeCount) || 0} nonOpen=${Number(debugStats.nonOpenTargetCount) || 0} open=${Number(debugStats.openTargetCount) || 0}/${Number(debugStats.renderedOpenTargetCount) || 0} inactiveTargets=${Number(debugStats.inactiveTargetCount) || 0} presentationCounts="${presentationCounts}" activePreview=${renderState?.activeThrowPreviewDebug?.applied ? "on" : "off"} reason="${renderState?.activeThrowPreviewDebug?.suppressionReason || "none"}" labels="${(renderState?.activeThrowPreviewDebug?.labels || []).join(",")}" ${visualDebugContext}`
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
    clearCricketHighlights(documentRef);
    runtime.renderCache.overlayShapeState = null;
    domGuards.removeNodeById(STYLE_ID);
  };
}

export const mountCricketHighlighter = initializeCricketHighlighter;
export const initialize = initializeCricketHighlighter;
export const mount = initializeCricketHighlighter;
