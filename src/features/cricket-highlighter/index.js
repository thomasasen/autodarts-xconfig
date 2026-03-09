import {
  buildCricketRenderState,
  clearCricketHighlights,
  renderCricketHighlights,
} from "./logic.js";
import { OVERLAY_ID, STYLE_ID, buildStyleText, resolveCricketVisualConfig } from "./style.js";
import { createManagedNodeMatcher, hasExternalDomMutation } from "../../core/dom-mutation-filter.js";
import { findBoardSvgGroup } from "../../shared/dartboard-svg.js";

const FEATURE_KEY = "cricket-highlighter";
const OBSERVER_KEY = `${FEATURE_KEY}:dom-observer`;
const LISTENER_KEYS = Object.freeze({
  resize: `${FEATURE_KEY}:window-resize`,
  orientation: `${FEATURE_KEY}:window-orientation`,
  visibility: `${FEATURE_KEY}:document-visibility`,
});

function readVariantText(documentRef) {
  return String(documentRef?.getElementById?.("ad-ext-game-variant")?.textContent || "").trim();
}

function isCricketActive(gameState, documentRef, variantRules) {
  if (gameState && typeof gameState.isCricketVariant === "function") {
    return gameState.isCricketVariant({
      allowMissing: false,
      allowEmpty: false,
      includeHiddenCricket: false,
    });
  }

  const variantText = String(documentRef?.getElementById?.("ad-ext-game-variant")?.textContent || "");
  if (!variantRules || typeof variantRules.isCricketVariantText !== "function") {
    return false;
  }
  return variantRules.isCricketVariantText(variantText, {
    allowMissing: false,
    allowEmpty: false,
    includeHiddenCricket: false,
  });
}

function buildRenderSignature(renderState) {
  if (!renderState || !renderState.stateMap) {
    return "";
  }
  const entries = [];
  renderState.stateMap.forEach((entry, label) => {
    entries.push(
      `${label}:${entry?.boardPresentation || "open"}:${(entry?.marksByPlayer || []).join(",")}`
    );
  });
  entries.sort();
  return [
    renderState.gameModeNormalized,
    renderState.scoringModeNormalized,
    renderState.activePlayerIndex,
    entries.join("|"),
  ].join("::");
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

function formatLabelList(labels, maxEntries = 3) {
  if (!Array.isArray(labels) || labels.length === 0) {
    return "-";
  }
  const compact = labels.slice(0, Math.max(1, maxEntries)).join(",");
  return labels.length > maxEntries ? `${compact},…` : compact;
}

function formatMarksByLabelDebug(marksByLabelDebug, maxEntries = 4) {
  if (!marksByLabelDebug || typeof marksByLabelDebug !== "object") {
    return "-";
  }

  const entries = Object.entries(marksByLabelDebug)
    .filter(([label, value]) => Boolean(label) && Boolean(value))
    .sort((left, right) => left[0].localeCompare(right[0]));
  if (!entries.length) {
    return "-";
  }

  const compact = entries
    .slice(0, Math.max(1, maxEntries))
    .map(([label, value]) => `${label}=${value}`)
    .join("|");
  return entries.length > maxEntries ? `${compact}|…` : compact;
}

function resolveOverlayStructuralHealth(documentRef, cache = null) {
  const cachedBoard = cache?.board;
  const board =
    cachedBoard?.group?.isConnected !== false
      ? cachedBoard
      : findBoardSvgGroup(documentRef);
  if (cache && typeof cache === "object") {
    cache.board = board;
  }

  if (!board?.group) {
    return {
      hasBoard: false,
      overlayPresent: false,
      healthy: false,
    };
  }

  const overlay = board.group.querySelector?.(`#${OVERLAY_ID}`) || null;
  const overlayPresent = Boolean(overlay);
  const overlayConnected = Boolean(overlayPresent && overlay.isConnected !== false);

  return {
    hasBoard: true,
    overlayPresent,
    healthy: overlayConnected,
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

  if (
    !documentRef ||
    !domGuards ||
    !cricketRules ||
    typeof schedulerFactory !== "function"
  ) {
    return () => {};
  }

  const featureConfig =
    config && typeof config.getFeatureConfig === "function"
      ? config.getFeatureConfig("cricketHighlighter")
      : {
          showDeadTargets: true,
          colorTheme: "standard",
          intensity: "normal",
        };
  const visualConfig = resolveCricketVisualConfig(featureConfig);

  domGuards.ensureStyle(STYLE_ID, buildStyleText());

  let lastSignature = "";
  const debugState = createDebugState(featureDebug);
  const renderCache = {
    grid: null,
    board: null,
  };

  function invalidateRenderCache() {
    renderCache.grid = null;
    renderCache.board = null;
  }

  function update() {
    const active = isCricketActive(gameState, documentRef, variantRules);
    const variantText = readVariantText(documentRef);
    if (!active) {
      lastSignature = "";
      emitDebugLog(
        debugState,
        `inactive::${variantText}`,
        `state inactive variant="${variantText || "-"}"`
      );
      clearCricketHighlights(documentRef);
      return;
    }

    const renderState = buildCricketRenderState({
      documentRef,
      gameState,
      cricketRules,
      variantRules,
      visualConfig,
      cache: renderCache,
    });
    if (!renderState) {
      lastSignature = "";
      emitDebugWarning(
        debugState,
        `missing-grid::${variantText}`,
        `warn kein Grid variant="${variantText || "-"}"`
      );
      return;
    }

    const signature = buildRenderSignature(renderState);
    if (!signature) {
      lastSignature = "";
      return;
    }

    const signatureUnchanged = signature === lastSignature;
    let forcedStructuralRefresh = false;
    if (signatureUnchanged) {
      const structuralHealth = resolveOverlayStructuralHealth(documentRef, renderCache);
      if (structuralHealth.healthy) {
        return;
      }

      forcedStructuralRefresh = true;
      emitDebugWarning(
        debugState,
        `${signature}::overlay-missing::${structuralHealth.hasBoard ? "board" : "no-board"}`,
        `warn overlay missing -> forced re-render variant="${variantText || "-"}" gameMode="${renderState.gameModeNormalized || "-"}" board=${structuralHealth.hasBoard ? "yes" : "no"}`
      );
    }

    const multiLabelContainerDropCount = Number(
      renderState.labelDiagnostics?.multiLabelContainerDropCount
    ) || 0;
    const shortfallRepairCount = Number(renderState.shortfallRepairCount) || 0;
    if (multiLabelContainerDropCount > 0) {
      emitDebugWarning(
        debugState,
        `${signature}::multi-label-wrapper::${multiLabelContainerDropCount}`,
        `warn mehrere Labels in einem Container erkannt variant="${variantText || "-"}" count=${multiLabelContainerDropCount} raw=${Number(renderState.discoveredRawUniqueLabelCount) || 0}/${Number(renderState.discoveredRawLabelCount) || 0} atomic=${Number(renderState.discoveredUniqueLabelCount) || 0}/${Number(renderState.discoveredLabelCount) || 0}`
      );
    }
    if (shortfallRepairCount > 0) {
      emitDebugWarning(
        debugState,
        `${signature}::shortfall-repair::${shortfallRepairCount}::${formatLabelList(renderState.shortfallRepairLabels)}`,
        `warn Shortfall-Reparatur aktiv variant="${variantText || "-"}" labels=${formatLabelList(renderState.shortfallRepairLabels)} count=${shortfallRepairCount}`
      );
    }

    const debugStats = {};
    const rendered = renderCricketHighlights({
      documentRef,
      visualConfig,
      renderState,
      cache: renderCache,
      debugStats,
    });

    const debugSignature = [
      signature,
      forcedStructuralRefresh ? "forced" : "normal",
      rendered ? "rendered" : "no-board",
      debugStats.renderedShapeCount || 0,
      debugStats.nonOpenTargetCount || 0,
      renderState.discoveredRawLabelCount || 0,
      renderState.discoveredLabelCount || 0,
      renderState.labelCellMarkSourceCount || 0,
      renderState.shortfallRepairCount || 0,
    ].join("::");

    emitDebugLog(
      debugState,
      debugSignature,
      `state variant="${variantText || "-"}" gameMode="${renderState.gameModeNormalized || "-"}" scoring="${renderState.scoringModeRaw || "unknown"}->${renderState.scoringModeNormalized || "unknown"}(${renderState.scoringModeSource || "-"})" active=${Number(renderState.activePlayerIndex) || 0} labelsRaw=${Number(renderState.discoveredRawUniqueLabelCount) || 0}/${Number(renderState.discoveredRawLabelCount) || 0} labelsAtomic=${Number(renderState.discoveredUniqueLabelCount) || 0}/${Number(renderState.discoveredLabelCount) || 0} labelCellSrc=${Number(renderState.labelCellMarkSourceCount) || 0}[${formatLabelList(renderState.labelCellMarkSourceLabels)}] shortfall=${Number(renderState.shortfallRepairCount) || 0}[${formatLabelList(renderState.shortfallRepairLabels)}] marks=${formatMarksByLabelDebug(renderState.marksByLabelDebug)} shapes=${Number(debugStats.renderedShapeCount) || 0} highlighted=${Number(debugStats.highlightedTargetCount) || 0} nonOpen=${Number(debugStats.nonOpenTargetCount) || 0}`
    );

    if (!rendered) {
      lastSignature = "";
      emitDebugWarning(
        debugState,
        `${signature}::no-board`,
        `warn kein Board variant="${variantText || "-"}" gameMode="${renderState.gameModeNormalized || "-"}"`
      );
      return;
    }

    if ((Number(debugStats.nonOpenTargetCount) || 0) > 0 && (Number(debugStats.renderedShapeCount) || 0) === 0) {
      const warningPrefix = forcedStructuralRefresh
        ? "warn forced re-render: weiterhin 0 Shapes trotz non-open Targets"
        : "warn 0 Shapes trotz non-open Targets";
      emitDebugWarning(
        debugState,
        `${signature}::zero-shapes::${forcedStructuralRefresh ? "forced" : "normal"}`,
        `${warningPrefix} variant="${variantText || "-"}" gameMode="${renderState.gameModeNormalized || "-"}" scoring="${renderState.scoringModeNormalized || "unknown"}"`
      );
    }

    lastSignature = signature;
  }

  const scheduler = schedulerFactory(update, { windowRef });
  const rootNode = documentRef.documentElement || documentRef.body || documentRef;
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
