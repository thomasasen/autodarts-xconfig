import {
  buildCricketRenderState,
  clearCricketHighlights,
  renderCricketHighlights,
} from "./logic.js";
import {
  OVERLAY_ID,
  STYLE_CONTRACT_VERSION,
  STYLE_ID,
  buildStyleText,
  readStyleContractStatus,
  resolveCricketVisualConfig,
} from "./style.js";
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
  ".ad-ext-crfx-root",
  ".ad-ext-crfx-cell",
  ".ad-ext-crfx-label-cell",
  ".ad-ext-crfx-badge",
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
  ".ad-ext-theme-board-svg",
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

    // React only to class flips that can change active-player perspective.
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

function formatPresentationCounts(counts) {
  const source = counts && typeof counts === "object" ? counts : {};
  return ["open", "scoring", "pressure", "dead", "inactive"]
    .map((key) => `${key}:${Number(source[key]) || 0}`)
    .join(",");
}

function buildVisualDebugContext(visualConfig, styleContractState) {
  return [
    `dim=${visualConfig?.dimIrrelevantBoardTargets !== false ? "on" : "off"}`,
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
  let repaired = false;

  if (!initialStatus.ok) {
    repaired = true;
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
    repaired,
  };
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
        dimIrrelevantBoardTargets: true,
        colorTheme: "standard",
        intensity: "normal",
      };
  const visualConfig = resolveCricketVisualConfig(featureConfig);

  let lastTransitionSignature = "";
  let lastStatusSignature = "";
  const debugState = createDebugState(featureDebug);
  const styleContractState = ensureStyleContract({ domGuards, debugState });
  const visualDebugContext = buildVisualDebugContext(visualConfig, styleContractState);
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
    lastTransitionSignature = "";
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
        `state paused route variant="${variantText || "-"}" ${visualDebugContext}`
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
        `state inactive variant="${variantText || "-"}" ${visualDebugContext}`
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
        `warn kein Grid variant="${variantText || "-"}" ${visualDebugContext}`
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
        `warn kein Board variant="${variantText || "-"}" ${visualDebugContext}`
      );
      return;
    }

    lastStatusSignature = "";
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
          targetOrder,
          styleContractState.ok ? 1 : 0,
          styleContractState.version || STYLE_CONTRACT_VERSION,
        ];
        emitDebugWarning(
          debugState,
          signatureParts.join("::"),
          `warn invariant type="${warning?.type || "unknown"}" inactiveTargets=${Number(warning?.inactiveTargetCount) || 0} presentationCounts="${presentationCounts}" targetOrder="${targetOrder || "-"}" dim=${warning?.dimIrrelevantBoardTargets === false ? "off" : "on"} showOpen=${warning?.showOpenObjectives === true ? "on" : "off"} showDead=${warning?.showDeadObjectives === false ? "off" : "on"} ${visualDebugContext}`
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
