import { updateHitDecorations, clearHitDecoration } from "./logic.js";
import { STYLE_ID, buildStyleText } from "./style.js";

const FEATURE_KEY = "triple-double-bull-hits";
const OBSERVER_KEY = `${FEATURE_KEY}:dom-observer`;
const LISTENER_KEYS = Object.freeze({
  visibility: `${FEATURE_KEY}:document-visibility`,
});

function createDebugState(featureDebug) {
  return {
    featureDebug,
    lastLogSignature: "",
    lastWarningSignature: "",
    runtimeLogged: false,
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

function formatKindCounts(kindCounts = {}) {
  const triple = Number(kindCounts.triple) || 0;
  const double = Number(kindCounts.double) || 0;
  const bullInner = Number(kindCounts.bullInner) || 0;
  const bullOuter = Number(kindCounts.bullOuter) || 0;
  return `T:${triple}|D:${double}|BI:${bullInner}|BO:${bullOuter}`;
}

function formatRowDebug(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return "-";
  }

  return rows
    .map((entry) => {
      const index = Number(entry?.index) || 0;
      const hit = String(entry?.hit || "none");
      const replayed = entry?.replayed ? "r1" : "r0";
      const text = String(entry?.text || "-");
      return `#${index}:${hit}:${replayed}:${text}`;
    })
    .join(" || ");
}

export function initializeTripleDoubleBullHits(context = {}) {
  const documentRef = context.documentRef || (typeof document !== "undefined" ? document : null);
  const windowRef = context.windowRef || (typeof window !== "undefined" ? window : null);
  const featureDebug = context.featureDebug || null;
  const domGuards = context.domGuards;
  const observerRegistry = context.registries?.observers;
  const listenerRegistry = context.registries?.listeners;
  const gameState = context.gameState;
  const config = context.config;
  const schedulerFactory = context.helpers?.createRafScheduler;

  if (!documentRef || !domGuards || typeof schedulerFactory !== "function") {
    return () => {};
  }

  const featureConfig =
    config && typeof config.getFeatureConfig === "function"
      ? config.getFeatureConfig("tripleDoubleBullHits")
      : {
          colorTheme: "volt-lime",
          animationStyle: "neon-pulse",
          debug: false,
        };
  const debugState = createDebugState(featureDebug);
  const trackedRows = new Set();
  const signatureByRow = new Map();

  domGuards.ensureStyle(STYLE_ID, buildStyleText());

  const scheduler = schedulerFactory(() => {
    const stats = updateHitDecorations({
      documentRef,
      featureConfig,
      trackedRows,
      signatureByRow,
      debugRows: Boolean(featureDebug?.enabled),
    });

    if (!featureDebug?.enabled || !stats) {
      return;
    }

    const runtimeApiVersion = String(windowRef?.__adXConfig?.apiVersion || "unknown");
    if (!debugState.runtimeLogged) {
      debugState.runtimeLogged = true;
      const animeGlobal = typeof windowRef?.anime === "function" ? "available" : "not-present";
      featureDebug.log(
        `runtime apiVersion="${runtimeApiVersion}" animeGlobal="${animeGlobal}" renderer="css-keyframes"`
      );
    }

    const kindSummary = formatKindCounts(stats.kindCounts);
    const rowDebug = formatRowDebug(stats.rows);
    const stateSignature = [
      runtimeApiVersion,
      featureConfig.colorTheme,
      featureConfig.animationStyle,
      stats.rowSource,
      stats.turnContainerFound ? 1 : 0,
      Number(stats.rowCount) || 0,
      Number(stats.decoratedCount) || 0,
      Number(stats.replayedCount) || 0,
      Number(stats.removedCount) || 0,
      String(stats.turnPointsToken || ""),
      kindSummary,
      rowDebug,
    ].join("|");

    emitDebugLog(
      debugState,
      stateSignature,
      `state apiVersion="${runtimeApiVersion}" rowSource="${stats.rowSource}" turnContainer=${
        stats.turnContainerFound ? "ok" : "missing"
      } rows=${Number(stats.rowCount) || 0} decorated=${Number(stats.decoratedCount) || 0} replayed=${
        Number(stats.replayedCount) || 0
      } removed=${Number(stats.removedCount) || 0} turnPoints="${stats.turnPointsToken || "-"}" kinds="${kindSummary}" theme="${featureConfig.colorTheme}" animation="${featureConfig.animationStyle}" rowsDebug="${rowDebug}"`
    );

    if (!stats.turnContainerFound) {
      emitDebugWarning(
        debugState,
        `warn:missing-turn-container|${stats.rowSource}|${Number(stats.rowCount) || 0}`,
        `warn turn container "${FEATURE_KEY}" nicht gefunden; fallback="${stats.rowSource}" rows=${
          Number(stats.rowCount) || 0
        }`
      );
    } else if ((Number(stats.rowCount) || 0) === 0) {
      emitDebugWarning(
        debugState,
        `warn:no-rows|${stats.rowSource}`,
        `warn keine Throw-Rows gefunden; fallback="${stats.rowSource}"`
      );
    }
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
      },
      MutationObserverRef: windowRef?.MutationObserver,
    });
  }

  if (listenerRegistry && typeof listenerRegistry.register === "function") {
    listenerRegistry.register({
      key: LISTENER_KEYS.visibility,
      target: documentRef,
      type: "visibilitychange",
      handler: () => scheduler.schedule(),
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
      // Keep cleanup resilient.
    }

    if (observerRegistry && typeof observerRegistry.disconnect === "function") {
      observerRegistry.disconnect(OBSERVER_KEY);
    }
    if (listenerRegistry && typeof listenerRegistry.remove === "function") {
      Object.values(LISTENER_KEYS).forEach((key) => listenerRegistry.remove(key));
    }

    trackedRows.forEach((rowNode) => {
      clearHitDecoration(rowNode, signatureByRow);
    });
    trackedRows.clear();
    signatureByRow.clear();

    domGuards.removeNodeById(STYLE_ID);
  };
}

export const mountTripleDoubleBullHits = initializeTripleDoubleBullHits;
export const initialize = initializeTripleDoubleBullHits;
export const mount = initializeTripleDoubleBullHits;
