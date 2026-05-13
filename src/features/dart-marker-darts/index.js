import {
  clearDartMarkerDartsState,
  createDartMarkerDartsState,
  updateDartMarkerDarts,
} from "./logic.js";
import {
  DART_CLASS,
  OVERLAY_ID,
  STYLE_ID,
  buildStyleText,
  resolveDartMarkerDartsConfig,
} from "./style.js";
import { runDartMarkerDartsPreview } from "./preview.js";
import { createManagedNodeMatcher, hasExternalDomMutation } from "../../core/dom-mutation-filter.js";

const FEATURE_KEY = "dart-marker-darts";
const OBSERVER_KEY = `${FEATURE_KEY}:dom-observer`;
const UPDATE_REASON = Object.freeze({
  full: "full",
  reposition: "reposition",
  rescan: "rescan",
});
const LISTENER_KEYS = Object.freeze({
  visibility: `${FEATURE_KEY}:document-visibility`,
  resize: `${FEATURE_KEY}:window-resize`,
  scroll: `${FEATURE_KEY}:window-scroll`,
  popstate: `${FEATURE_KEY}:window-popstate`,
  hashchange: `${FEATURE_KEY}:window-hashchange`,
  navigationCurrentEntry: `${FEATURE_KEY}:navigation-currententrychange`,
});

function getCurrentHref(windowRef) {
  if (!windowRef?.location) {
    return "";
  }
  return String(windowRef.location.href || "").trim();
}

function isBoardMutationNode(node) {
  if (!node || typeof node !== "object") {
    return false;
  }

  const tagName = String(node.tagName || node.nodeName || "").trim().toLowerCase();
  if (tagName === "svg" || tagName === "g" || tagName === "circle" || tagName === "path" || tagName === "text") {
    return true;
  }

  if (String(node.id || "").trim() === "ad-ext-turn") {
    return true;
  }

  if (node.classList?.contains?.("ad-ext-theme-board-svg")) {
    return true;
  }

  if (typeof node.closest === "function") {
    return Boolean(
      node.closest(
        ".ad-ext-theme-board-viewport, .ad-ext-theme-board-canvas, .ad-ext-tv-board-zoom-host, .showAnimations, #ad-ext-turn"
      )
    );
  }

  return false;
}

function nodeContainsRelevantBoardMutation(node) {
  if (isBoardMutationNode(node)) {
    return true;
  }

  if (!node || typeof node.querySelector !== "function") {
    return false;
  }

  return Boolean(
    node.querySelector(
      "svg, circle, g, path, text, .ad-ext-theme-board-svg, .ad-ext-theme-board-viewport, .ad-ext-theme-board-canvas, .ad-ext-tv-board-zoom-host, .showAnimations, #ad-ext-turn"
    )
  );
}

function hasRelevantBoardMutation(mutations = [], isManagedNode = null) {
  if (!hasExternalDomMutation(mutations, isManagedNode)) {
    return false;
  }

  if (!Array.isArray(mutations) || mutations.length === 0) {
    return true;
  }

  return mutations.some((mutation) => {
    if (mutation?.type === "attributes") {
      return isBoardMutationNode(mutation?.target || null);
    }

    if (isBoardMutationNode(mutation?.target || null)) {
      return true;
    }

    const touchedNodes = [
      ...Array.from(mutation?.addedNodes || []),
      ...Array.from(mutation?.removedNodes || []),
    ];
    return touchedNodes.some((node) => nodeContainsRelevantBoardMutation(node));
  });
}

function ensurePendingUpdateReasons(state) {
  if (!state) {
    return new Set([UPDATE_REASON.full]);
  }

  if (!(state.pendingUpdateReasons instanceof Set)) {
    state.pendingUpdateReasons = new Set([UPDATE_REASON.full]);
  }

  return state.pendingUpdateReasons;
}

function scheduleStateUpdate(state, reason = UPDATE_REASON.full) {
  ensurePendingUpdateReasons(state).add(
    Object.values(UPDATE_REASON).includes(reason) ? reason : UPDATE_REASON.full
  );
}

function consumeUpdateMode(state) {
  const reasons = ensurePendingUpdateReasons(state);
  const activeReasons = reasons.size ? Array.from(reasons) : [UPDATE_REASON.full];
  reasons.clear();

  const requiresRescan =
    activeReasons.includes(UPDATE_REASON.full) || activeReasons.includes(UPDATE_REASON.rescan);

  return {
    reasons: activeReasons,
    requiresBoardRescan: requiresRescan,
    requiresMarkerRescan: requiresRescan,
  };
}

function buildGameStateSignature(snapshot = null) {
  const activeTurn = snapshot?.match?.turns?.find?.(
    (turn) => String(turn?.playerId || "") === String(snapshot?.match?.players?.[snapshot?.activePlayerIndex]?.id || "")
  );
  const activeThrows = Array.isArray(activeTurn?.throws) ? activeTurn.throws : [];

  return [
    String(snapshot?.variantNormalized || ""),
    String(snapshot?.outMode || ""),
    Number.isFinite(snapshot?.activePlayerIndex) ? String(snapshot.activePlayerIndex) : "",
    Number.isFinite(snapshot?.activeScore) ? String(snapshot.activeScore) : "",
    Array.isArray(snapshot?.match?.players) ? String(snapshot.match.players.length) : "",
    Array.isArray(snapshot?.match?.turns) ? String(snapshot.match.turns.length) : "",
    activeThrows
      .map((throwEntry) =>
        [
          Number.isFinite(throwEntry?.round) ? throwEntry.round : "",
          Number.isFinite(throwEntry?.turn) ? throwEntry.turn : "",
          Number.isFinite(throwEntry?.points) ? throwEntry.points : "",
          String(throwEntry?.segment || ""),
        ].join(":")
      )
      .join("|"),
  ].join("::");
}

export function initializeDartMarkerDarts(context = {}) {
  const documentRef = context.documentRef || (typeof document !== "undefined" ? document : null);
  const windowRef = context.windowRef || (typeof globalThis.window !== "undefined" ? globalThis.window : null);
  const domGuards = context.domGuards;
  const observerRegistry = context.registries?.observers;
  const listenerRegistry = context.registries?.listeners;
  const gameState = context.gameState;
  const config = context.config;
  const schedulerFactory = context.helpers?.createRafScheduler;
  const featureDebug = context.featureDebug || null;

  if (!documentRef || !domGuards || typeof schedulerFactory !== "function") {
    return () => {};
  }

  const featureConfig =
    config && typeof config.getFeatureConfig === "function"
      ? config.getFeatureConfig("dartMarkerDarts")
        : {
            design: "autodarts",
            animateDarts: true,
            sizePercent: 120,
            hideOriginalMarkers: false,
            enableShadow: true,
            enableShadowBlur: true,
            enableWobble: true,
            enableFlightBlur: true,
            flightSpeed: "standard",
          };
  const visualConfig = resolveDartMarkerDartsConfig(featureConfig);

  if (featureDebug?.enabled) {
    featureDebug.log("init-config", {
      designKey: visualConfig.designKey,
      animateDarts: visualConfig.animateDarts,
      sizePercent: visualConfig.sizePercent,
      hideOriginalMarkers: visualConfig.hideOriginalMarkers,
      enableShadow: visualConfig.enableShadow,
      enableShadowBlur: visualConfig.enableShadowBlur,
      enableWobble: visualConfig.enableWobble,
      enableFlightBlur: visualConfig.enableFlightBlur,
      flightSpeed: visualConfig.flightSpeed,
      flightDurationMs: visualConfig.flightDurationMs,
    });
  }

  domGuards.ensureStyle(STYLE_ID, buildStyleText());

  const state = createDartMarkerDartsState(windowRef);
  state.lastHref = getCurrentHref(windowRef);
  state.gameStateSnapshot =
    gameState && typeof gameState.getSnapshot === "function" ? gameState.getSnapshot() : null;
  ensurePendingUpdateReasons(state);

  let scheduler = null;
  function scheduleUpdate(reason = UPDATE_REASON.full) {
    scheduleStateUpdate(state, reason);
    scheduler?.schedule?.();
  }

  function update() {
    updateDartMarkerDarts({
      documentRef,
      state,
      visualConfig,
      featureDebug,
      scheduleUpdate,
      updateMode: consumeUpdateMode(state),
    });
  }

  scheduler = schedulerFactory(update, { windowRef });
  const rootNode = documentRef.documentElement || documentRef.body || documentRef;
  const isManagedNode = createManagedNodeMatcher({
    ids: [OVERLAY_ID],
    classNames: [DART_CLASS],
  });

  if (observerRegistry && typeof observerRegistry.registerMutationObserver === "function") {
    observerRegistry.registerMutationObserver({
      key: OBSERVER_KEY,
      target: rootNode,
      callback: (mutations = []) => {
        if (!hasRelevantBoardMutation(mutations, isManagedNode)) {
          return;
        }
        scheduleUpdate(UPDATE_REASON.rescan);
      },
      observeOptions: {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["cx", "cy", "d", "points", "transform"],
      },
      MutationObserverRef: windowRef?.MutationObserver,
    });
  }

  if (listenerRegistry && typeof listenerRegistry.register === "function") {
    listenerRegistry.register({
      key: LISTENER_KEYS.visibility,
      target: documentRef,
      type: "visibilitychange",
      handler: () => scheduleUpdate(UPDATE_REASON.reposition),
    });
    listenerRegistry.register({
      key: LISTENER_KEYS.resize,
      target: windowRef,
      type: "resize",
      handler: () => scheduleUpdate(UPDATE_REASON.reposition),
      options: { passive: true },
    });
    listenerRegistry.register({
      key: LISTENER_KEYS.scroll,
      target: windowRef,
      type: "scroll",
      handler: () => scheduleUpdate(UPDATE_REASON.reposition),
      options: { passive: true, capture: true },
    });
    listenerRegistry.register({
      key: LISTENER_KEYS.popstate,
      target: windowRef,
      type: "popstate",
      handler: () => scheduleUpdate(UPDATE_REASON.full),
    });
    listenerRegistry.register({
      key: LISTENER_KEYS.hashchange,
      target: windowRef,
      type: "hashchange",
      handler: () => scheduleUpdate(UPDATE_REASON.full),
    });

    const navigationApi =
      windowRef && typeof windowRef.navigation === "object" ? windowRef.navigation : null;
    if (
      navigationApi &&
      typeof navigationApi.addEventListener === "function" &&
      typeof navigationApi.removeEventListener === "function"
    ) {
      listenerRegistry.register({
        key: LISTENER_KEYS.navigationCurrentEntry,
        target: navigationApi,
        type: "currententrychange",
        handler: () => scheduleUpdate(UPDATE_REASON.full),
      });
    }
  }

  const unsubscribeGameState =
    gameState && typeof gameState.subscribe === "function"
      ? gameState.subscribe((snapshot) => {
          state.gameStateSnapshot = snapshot || null;
          const signature = buildGameStateSignature(snapshot);
          if (signature && signature === state.lastGameStateSignature) {
            return;
          }
          state.lastGameStateSignature = signature;
          scheduleUpdate(UPDATE_REASON.rescan);
        })
      : () => {};

  scheduleUpdate(UPDATE_REASON.full);
  let cleanedUp = false;

  return function cleanup() {
    if (cleanedUp) {
      return;
    }
    cleanedUp = true;

    scheduler?.cancel?.();

    try {
      unsubscribeGameState();
    } catch (_) {
      // fail-soft
    }

    if (observerRegistry && typeof observerRegistry.disconnect === "function") {
      observerRegistry.disconnect(OBSERVER_KEY);
    }
    if (listenerRegistry && typeof listenerRegistry.remove === "function") {
      Object.values(LISTENER_KEYS).forEach((key) => listenerRegistry.remove(key));
    }

    clearDartMarkerDartsState(state, {
      featureDebug,
      reason: "feature-unmount",
    });
    domGuards.removeNodeById(STYLE_ID);
  };
}

export async function runDartMarkerDartsAction(actionContext = {}) {
  const actionId = String(actionContext.actionId || "").trim().toLowerCase();
  if (actionId !== "preview") {
    throw new Error(`Unsupported Dart Marker Darts action: ${actionId || "unknown"}`);
  }

  return runDartMarkerDartsPreview({
    documentRef: actionContext.context?.documentRef || null,
    windowRef: actionContext.context?.windowRef || null,
    targetNode: actionContext.actionTarget || null,
    featureConfig: actionContext.featureConfig || {},
  });
}

export const mountDartMarkerDarts = initializeDartMarkerDarts;
export const initialize = initializeDartMarkerDarts;
export const mount = initializeDartMarkerDarts;
