import { buildCricketRenderState } from "../cricket-highlighter/logic.js";
import {
  clearCricketGridFxState,
  createCricketGridFxState,
  updateCricketGridFx,
} from "./logic.js";
import {
  DELTA_CLASS,
  ROW_WAVE_CLASS,
  SPARK_CLASS,
  STYLE_ID,
  WIPE_CLASS,
  buildStyleText,
  resolveCricketGridFxConfig,
} from "./style.js";
import { createManagedNodeMatcher, hasExternalDomMutation } from "../../core/dom-mutation-filter.js";

const FEATURE_KEY = "cricket-grid-fx";
const OBSERVER_KEY = `${FEATURE_KEY}:dom-observer`;
const LISTENER_KEYS = Object.freeze({
  resize: `${FEATURE_KEY}:window-resize`,
  orientation: `${FEATURE_KEY}:window-orientation`,
  visibility: `${FEATURE_KEY}:document-visibility`,
});

function readVariantText(documentRef) {
  return String(documentRef?.getElementById?.("ad-ext-game-variant")?.textContent || "").trim();
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
          threatEdge: true,
          scoringLane: true,
          deadRowCollapse: true,
          deltaChips: true,
          hitSpark: true,
          roundTransitionWipe: true,
          opponentPressureOverlay: true,
          colorTheme: "standard",
          intensity: "normal",
        };

  const visualConfig = resolveCricketGridFxConfig(featureConfig);
  domGuards.ensureStyle(STYLE_ID, buildStyleText());

  const state = createCricketGridFxState(windowRef);
  const debugState = createDebugState(featureDebug);
  let lastDebugRenderSignature = "";
  const invalidateRenderCache = () => {
    if (state.renderCache && typeof state.renderCache === "object") {
      state.renderCache.grid = null;
    }
  };

  function update() {
    const variantText = readVariantText(documentRef);
    if (!isCricketActive(gameState, documentRef, variantRules)) {
      emitDebugLog(
        debugState,
        `inactive::${variantText}`,
        `state inactive variant="${variantText || "-"}"`
      );
      lastDebugRenderSignature = "";
      clearCricketGridFxState(state);
      return;
    }

    const renderState = buildCricketRenderState({
      documentRef,
      gameState,
      cricketRules,
      variantRules,
      visualConfig,
      cache: state.renderCache,
    });

    if (!renderState) {
      emitDebugWarning(
        debugState,
        `missing-grid::${variantText}`,
        `warn kein Grid variant="${variantText || "-"}"`
      );
      lastDebugRenderSignature = "";
      clearCricketGridFxState(state);
      return;
    }

    const renderSignature = buildRenderSignature(renderState);
    const debugStats = {};

    const multiLabelContainerDropCount = Number(
      renderState.labelDiagnostics?.multiLabelContainerDropCount
    ) || 0;
    const shortfallRepairCount = Number(renderState.shortfallRepairCount) || 0;
    if (multiLabelContainerDropCount > 0) {
      emitDebugWarning(
        debugState,
        `${renderSignature || "no-signature"}::multi-label-wrapper::${multiLabelContainerDropCount}`,
        `warn mehrere Labels in einem Container erkannt variant="${variantText || "-"}" count=${multiLabelContainerDropCount} raw=${Number(renderState.discoveredRawUniqueLabelCount) || 0}/${Number(renderState.discoveredRawLabelCount) || 0} atomic=${Number(renderState.discoveredUniqueLabelCount) || 0}/${Number(renderState.discoveredLabelCount) || 0}`
      );
    }
    if (shortfallRepairCount > 0) {
      emitDebugWarning(
        debugState,
        `${renderSignature || "no-signature"}::shortfall-repair::${shortfallRepairCount}::${formatLabelList(renderState.shortfallRepairLabels)}`,
        `warn Shortfall-Reparatur aktiv variant="${variantText || "-"}" labels=${formatLabelList(renderState.shortfallRepairLabels)} count=${shortfallRepairCount}`
      );
    }

    updateCricketGridFx({
      documentRef,
      cricketRules,
      renderState,
      state,
      visualConfig,
      debugStats,
    });

    const debugSignature = [
      renderSignature || "no-signature",
      debugStats.status || "unknown",
      Number(debugStats.rowCount) || 0,
      Number(debugStats.scoreCellCount) || 0,
      renderState.discoveredRawLabelCount || 0,
      renderState.discoveredLabelCount || 0,
      renderState.labelCellMarkSourceCount || 0,
      renderState.shortfallRepairCount || 0,
    ].join("::");

    if (renderSignature && renderSignature !== lastDebugRenderSignature) {
      emitDebugLog(
        debugState,
        debugSignature,
        `state variant="${variantText || "-"}" gameMode="${renderState.gameModeNormalized || "-"}" scoring="${renderState.scoringModeRaw || "unknown"}->${renderState.scoringModeNormalized || "unknown"}(${renderState.scoringModeSource || "-"})" active=${Number(renderState.activePlayerIndex) || 0} labelsRaw=${Number(renderState.discoveredRawUniqueLabelCount) || 0}/${Number(renderState.discoveredRawLabelCount) || 0} labelsAtomic=${Number(renderState.discoveredUniqueLabelCount) || 0}/${Number(renderState.discoveredLabelCount) || 0} labelCellSrc=${Number(renderState.labelCellMarkSourceCount) || 0}[${formatLabelList(renderState.labelCellMarkSourceLabels)}] shortfall=${Number(renderState.shortfallRepairCount) || 0}[${formatLabelList(renderState.shortfallRepairLabels)}] marks=${formatMarksByLabelDebug(renderState.marksByLabelDebug)} rows=${Number(debugStats.rowCount) || 0} offense=${Number(debugStats.offenseRowCount) || 0} danger=${Number(debugStats.dangerRowCount) || 0} pressure=${Number(debugStats.pressureRowCount) || 0} scoreCells=${Number(debugStats.scoreCellCount) || 0}`
      );
      lastDebugRenderSignature = renderSignature;
    }

    if (debugStats.status === "missing-grid") {
      emitDebugWarning(
        debugState,
        `${renderSignature || "no-signature"}::missing-grid`,
        `warn kein Grid variant="${variantText || "-"}" gameMode="${renderState.gameModeNormalized || "-"}"`
      );
      return;
    }

    if (
      (Number(debugStats.offenseRowCount) || 0) > 0 &&
      (Number(debugStats.scoreCellCount) || 0) === 0
    ) {
      emitDebugWarning(
        debugState,
        `${renderSignature || "no-signature"}::no-score-cells`,
        `warn offense rows ohne score-cells variant="${variantText || "-"}" gameMode="${renderState.gameModeNormalized || "-"}" scoring="${renderState.scoringModeNormalized || "unknown"}"`
      );
    }
  }

  const scheduler = schedulerFactory(update, { windowRef });
  const rootNode = documentRef.documentElement || documentRef.body || documentRef;
  const isManagedNode = createManagedNodeMatcher({
    classNames: [ROW_WAVE_CLASS, DELTA_CLASS, SPARK_CLASS, WIPE_CLASS],
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

    clearCricketGridFxState(state);
    domGuards.removeNodeById(STYLE_ID);
  };
}

export const mountCricketGridFx = initializeCricketGridFx;
export const initialize = initializeCricketGridFx;
export const mount = initializeCricketGridFx;
