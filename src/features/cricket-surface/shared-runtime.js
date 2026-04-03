import { buildCricketRenderState, CRICKET_SURFACE_STATUS } from "./pipeline.js";
import {
  canDelayMissingMatchBoardGap,
  clearDegradedHostRecoveryRecord,
  DEGRADED_HOST_RECOVERY_REARM_MS,
  hasDegradedHostRecoveryRecord,
  hasPendingDegradedHostRecovery,
  maybeRecoverDegradedMatchHost,
  resolveMissingMatchBoardGapDelay,
  resolvePendingDegradedHostRecheckDelay,
} from "./degraded-host-recovery.js";
import {
  createCricketSurfaceWatchState,
  hasTrackedCricketSurfaceMutation,
  setCricketSurfaceWatchNodes,
} from "./surface-watch.js";
import { hasExternalDomMutation } from "../../core/dom-mutation-filter.js";
import {
  BOARD_INPUT_MODE_ATTRIBUTE_FILTER,
  isBoardInputModeControl,
} from "../../shared/board-input-mode.js";

const SHARED_RUNTIME_KEY = "__shared-cricket-runtime__";
const SHARED_OBSERVER_KEY = "cricket-surface:dom-observer";
const SHARED_LISTENER_KEYS = Object.freeze({
  resize: "cricket-surface:window-resize",
  orientation: "cricket-surface:window-orientation",
  visibility: "cricket-surface:document-visibility",
});
const POST_TRANSITION_SURFACE_AUDIT_MS = 420;

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
  ".ad-ext-theme-board-svg",
].join(",");

export const SHARED_CRICKET_SURFACE_ATTRIBUTE_FILTER = Object.freeze([
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

function createRuntimeAliasObserver(runtime) {
  return {
    get callback() {
      return runtime.sharedMutationCallback;
    },
    get observeCalls() {
      return runtime.sharedObserver?.observeCalls || [];
    },
    observe() {},
    disconnect() {},
  };
}

function ensureObserverAliasSupport(observerRegistry) {
  if (
    !observerRegistry ||
    typeof observerRegistry !== "object" ||
    observerRegistry.__sharedCricketAliasSupport === true
  ) {
    return;
  }

  const aliasObservers = new Map();
  const originalGet = observerRegistry.get.bind(observerRegistry);
  const originalDisconnect = observerRegistry.disconnect.bind(observerRegistry);

  observerRegistry.__sharedCricketAliasStore = aliasObservers;
  observerRegistry.__sharedCricketAliasSupport = true;
  observerRegistry.get = function getObserverWithAliases(key) {
    const normalizedKey = String(key || "");
    return aliasObservers.get(normalizedKey) || originalGet(normalizedKey);
  };
  observerRegistry.disconnect = function disconnectObserverWithAliases(key) {
    const normalizedKey = String(key || "");
    if (aliasObservers.has(normalizedKey)) {
      aliasObservers.delete(normalizedKey);
      return true;
    }
    return originalDisconnect(normalizedKey);
  };
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
  if (
    anchorNode &&
    typeof anchorNode.closest === "function" &&
    anchorNode.closest(SURFACE_SCOPE_SELECTOR)
  ) {
    return true;
  }
  if (isBoardInputModeControl(anchorNode)) {
    return true;
  }
  if (typeof node.matches === "function" && node.matches(SURFACE_SELECTOR)) {
    return true;
  }
  if (
    typeof node.closest === "function" &&
    node.closest(".ad-ext-theme-board-canvas, .ad-ext-theme-content-board")
  ) {
    return true;
  }
  if (typeof node.querySelector === "function" && node.querySelector(SURFACE_SELECTOR)) {
    return true;
  }
  return false;
}

function isRelevantAttributeMutation(mutation) {
  if (String(mutation?.type || "") !== "attributes") {
    return true;
  }

  const attributeName = String(mutation?.attributeName || "").trim().toLowerCase();
  if (!attributeName) {
    return false;
  }
  if (attributeName !== "class") {
    return SHARED_CRICKET_SURFACE_ATTRIBUTE_FILTER.includes(attributeName);
  }

  const target = mutation?.target || null;
  if (!target || typeof target.matches !== "function") {
    return false;
  }

  return target.matches(".ad-ext-player, #ad-ext-player-display, #ad-ext-game-variant");
}

function hasRelevantCricketMutation(mutations = []) {
  if (!Array.isArray(mutations) || !mutations.length) {
    return false;
  }

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

function buildStatusSignature(renderState) {
  return `${renderState?.surfaceStatus || "unknown"}::${renderState?.variantText || "-"}`;
}

function getSharedRuntimeStore(windowRef, documentRef) {
  const hostKey = windowRef || documentRef || null;
  if (!hostKey || typeof hostKey !== "object") {
    return null;
  }

  const existingRuntime = hostKey[SHARED_RUNTIME_KEY];
  if (existingRuntime && typeof existingRuntime === "object") {
    return existingRuntime;
  }

  return null;
}

function setSharedRuntimeStore(windowRef, documentRef, runtime) {
  const hostKey = windowRef || documentRef || null;
  if (!hostKey || typeof hostKey !== "object") {
    return;
  }
  hostKey[SHARED_RUNTIME_KEY] = runtime;
}

function clearSharedRuntimeStore(windowRef, documentRef, runtime) {
  const hostKey = windowRef || documentRef || null;
  if (!hostKey || typeof hostKey !== "object") {
    return;
  }
  if (hostKey[SHARED_RUNTIME_KEY] === runtime) {
    delete hostKey[SHARED_RUNTIME_KEY];
  }
}

function createSharedCricketRuntime(context = {}) {
  const documentRef = context.documentRef || (typeof document !== "undefined" ? document : null);
  const windowRef = context.windowRef || (typeof window !== "undefined" ? window : null);
  const observerRegistry = context.registries?.observers;
  const listenerRegistry = context.registries?.listeners;
  const gameState = context.gameState;
  const variantRules = context.domain?.variantRules;
  const cricketRules = context.domain?.cricketRules;
  const schedulerFactory = context.helpers?.createRafScheduler;
  const degradedHostGraceMs = context.degradedHostGraceMs;
  const degradedHostRecoveryCooldownMs = context.degradedHostRecoveryCooldownMs;
  const degradedHostRecoveryRearmMs = context.degradedHostRecoveryRearmMs;

  if (!documentRef || !windowRef || !cricketRules || typeof schedulerFactory !== "function") {
    return null;
  }

  const runtime = {
    documentRef,
    windowRef,
    observerRegistry,
    listenerRegistry,
    gameState,
    variantRules,
    cricketRules,
    degradedHostGraceMs,
    degradedHostRecoveryCooldownMs,
    degradedHostRecoveryRearmMs,
    subscribers: new Map(),
    surfaceWatchState: createCricketSurfaceWatchState(),
    renderCache: {
      grid: null,
      board: null,
      gridStableRowsByLabel: null,
    },
    lastReadyTransitionSignature: "",
    lastDegradedStatusSignature: "",
    pendingDegradedHostRecheckHandle: 0,
    pendingDegradedHostRecheckSignature: "",
    pendingRecoveryRearmHandle: 0,
    pendingRecoveryRearmSignature: "",
    pendingSurfaceAuditHandle: 0,
    pendingSurfaceAuditSignature: "",
    completedMissingBoardHoldKey: "",
    cleanupGameStateSubscription: () => {},
    cleanedUp: false,
    sharedMutationCallback: null,
    sharedObserver: null,
  };

  ensureObserverAliasSupport(runtime.observerRegistry);

  function invalidateRenderCache() {
    runtime.renderCache.grid = null;
    runtime.renderCache.board = null;
    runtime.subscribers.forEach((subscriber) => {
      try {
        subscriber.onInvalidateCache?.(runtime.renderCache);
      } catch (_) {
        // Keep the shared runtime resilient to feature-local cleanup failures.
      }
    });
  }

  function clearPendingDegradedHostRecheck() {
    if (
      runtime.pendingDegradedHostRecheckHandle &&
      typeof runtime.windowRef?.clearTimeout === "function"
    ) {
      runtime.windowRef.clearTimeout(runtime.pendingDegradedHostRecheckHandle);
    }
    runtime.pendingDegradedHostRecheckHandle = 0;
    runtime.pendingDegradedHostRecheckSignature = "";
  }

  function clearPendingRecoveryRearm() {
    if (
      runtime.pendingRecoveryRearmHandle &&
      typeof runtime.windowRef?.clearTimeout === "function"
    ) {
      runtime.windowRef.clearTimeout(runtime.pendingRecoveryRearmHandle);
    }
    runtime.pendingRecoveryRearmHandle = 0;
    runtime.pendingRecoveryRearmSignature = "";
  }

  function clearPendingSurfaceAudit() {
    if (
      runtime.pendingSurfaceAuditHandle &&
      typeof runtime.windowRef?.clearTimeout === "function"
    ) {
      runtime.windowRef.clearTimeout(runtime.pendingSurfaceAuditHandle);
    }
    runtime.pendingSurfaceAuditHandle = 0;
    runtime.pendingSurfaceAuditSignature = "";
  }

  function buildMissingBoardHoldKey(renderState) {
    if (!canDelayMissingMatchBoardGap(renderState) || !runtime.lastReadyTransitionSignature) {
      return "";
    }
    return `${renderState?.matchRouteId || "-"}::${runtime.lastReadyTransitionSignature}`;
  }

  function schedulePostTransitionSurfaceAudit(renderState, transitionSignature) {
    if (
      String(renderState?.surfaceStatus || "") !== CRICKET_SURFACE_STATUS.READY ||
      !transitionSignature ||
      typeof runtime.windowRef?.setTimeout !== "function"
    ) {
      clearPendingSurfaceAudit();
      return false;
    }

    if (
      runtime.pendingSurfaceAuditHandle &&
      runtime.pendingSurfaceAuditSignature === transitionSignature
    ) {
      return true;
    }

    clearPendingSurfaceAudit();
    runtime.pendingSurfaceAuditSignature = transitionSignature;
    runtime.pendingSurfaceAuditHandle = runtime.windowRef.setTimeout(() => {
      runtime.pendingSurfaceAuditHandle = 0;
      runtime.pendingSurfaceAuditSignature = "";
      invalidateRenderCache();
      runtime.scheduler.schedule();
    }, POST_TRANSITION_SURFACE_AUDIT_MS);
    return true;
  }

  function schedulePendingDegradedHostRecheck(renderState) {
    if (
      !canDelayMissingMatchBoardGap(renderState) ||
      typeof runtime.windowRef?.setTimeout !== "function"
    ) {
      clearPendingDegradedHostRecheck();
      return false;
    }

    const pendingDegradedHostRecovery = hasPendingDegradedHostRecovery(renderState);
    const missingBoardHoldKey = pendingDegradedHostRecovery
      ? ""
      : buildMissingBoardHoldKey(renderState);
    if (
      !pendingDegradedHostRecovery &&
      (!missingBoardHoldKey || runtime.completedMissingBoardHoldKey === missingBoardHoldKey)
    ) {
      clearPendingDegradedHostRecheck();
      return false;
    }

    const delayMs = pendingDegradedHostRecovery
      ? resolvePendingDegradedHostRecheckDelay(renderState, {
          fallbackGraceMs: runtime.degradedHostGraceMs,
        })
      : resolveMissingMatchBoardGapDelay(renderState, {
          fallbackGraceMs: runtime.degradedHostGraceMs,
        });
    if (!(delayMs > 0)) {
      clearPendingDegradedHostRecheck();
      return false;
    }

    const nextSignature = [
      pendingDegradedHostRecovery ? "degraded-host" : "missing-board-gap",
      renderState?.matchRouteId || "-",
      Number(renderState?.degradedHostInfo?.graceMs) || Number(runtime.degradedHostGraceMs) || 0,
      Math.max(0, Math.round(Number(renderState?.degradedHostInfo?.ageMs) || 0)),
      Math.max(1, Math.round(delayMs)),
      missingBoardHoldKey || "-",
    ].join("::");
    if (
      runtime.pendingDegradedHostRecheckHandle &&
      runtime.pendingDegradedHostRecheckSignature === nextSignature
    ) {
      return true;
    }

    clearPendingDegradedHostRecheck();
    runtime.pendingDegradedHostRecheckSignature = nextSignature;
    runtime.pendingDegradedHostRecheckHandle = runtime.windowRef.setTimeout(() => {
      if (!pendingDegradedHostRecovery && missingBoardHoldKey) {
        runtime.completedMissingBoardHoldKey = missingBoardHoldKey;
      }
      runtime.pendingDegradedHostRecheckHandle = 0;
      runtime.pendingDegradedHostRecheckSignature = "";
      invalidateRenderCache();
      runtime.scheduler.schedule();
    }, delayMs);
    return true;
  }

  function scheduleRecoveryRearm(renderState) {
    const matchId = String(renderState?.matchRouteId || "").trim();
    if (!matchId || !hasDegradedHostRecoveryRecord({ matchId, windowRef: runtime.windowRef })) {
      clearPendingRecoveryRearm();
      return false;
    }
    if (typeof runtime.windowRef?.setTimeout !== "function") {
      clearPendingRecoveryRearm();
      return false;
    }

    const delayMs = Math.max(
      1,
      Number.isFinite(Number(runtime.degradedHostRecoveryRearmMs))
        ? Number(runtime.degradedHostRecoveryRearmMs)
        : DEGRADED_HOST_RECOVERY_REARM_MS
    );
    const nextSignature = `${matchId}::${delayMs}`;
    if (
      runtime.pendingRecoveryRearmHandle &&
      runtime.pendingRecoveryRearmSignature === nextSignature
    ) {
      return true;
    }

    clearPendingRecoveryRearm();
    runtime.pendingRecoveryRearmSignature = nextSignature;
    runtime.pendingRecoveryRearmHandle = runtime.windowRef.setTimeout(() => {
      runtime.pendingRecoveryRearmHandle = 0;
      runtime.pendingRecoveryRearmSignature = "";
      clearDegradedHostRecoveryRecord({ matchId, windowRef: runtime.windowRef });
    }, delayMs);
    return true;
  }

  function refreshTrackedSurfaceNodes(renderState) {
    const nextWatchNodes = [];
    runtime.subscribers.forEach((subscriber) => {
      if (typeof subscriber.collectWatchNodes !== "function") {
        return;
      }
      try {
        const nodes = subscriber.collectWatchNodes({
          documentRef: runtime.documentRef,
          renderState,
          renderCache: runtime.renderCache,
        });
        if (Array.isArray(nodes) || typeof nodes?.[Symbol.iterator] === "function") {
          nextWatchNodes.push(...Array.from(nodes));
        }
      } catch (_) {
        // Feature-local watch collection should not break the shared runtime.
      }
    });
    setCricketSurfaceWatchNodes(runtime.surfaceWatchState, nextWatchNodes);
  }

  function updateSharedRuntime() {
    const renderState = buildCricketRenderState({
      documentRef: runtime.documentRef,
      windowRef: runtime.windowRef,
      gameState: runtime.gameState,
      cricketRules: runtime.cricketRules,
      variantRules: runtime.variantRules,
      enforceVariantGuard: true,
      degradedHostGraceMs: runtime.degradedHostGraceMs,
      cache: runtime.renderCache,
    });
    const surfaceStatus = renderState?.surfaceStatus || CRICKET_SURFACE_STATUS.MISSING_GRID;
    const statusSignature = buildStatusSignature(renderState);
    const transitionSignature = String(
      renderState?.transitionSignature || renderState?.pipelineSignature || ""
    );
    const pendingDegradedHostRecheck = hasPendingDegradedHostRecovery(renderState);
    const delayedMissingBoardGap =
      canDelayMissingMatchBoardGap(renderState) && Boolean(runtime.lastReadyTransitionSignature);

    if (!pendingDegradedHostRecheck && !delayedMissingBoardGap) {
      clearPendingDegradedHostRecheck();
    }
    if (surfaceStatus !== CRICKET_SURFACE_STATUS.READY) {
      clearPendingRecoveryRearm();
      clearPendingSurfaceAudit();
    }

    let recovery = null;
    if (surfaceStatus === CRICKET_SURFACE_STATUS.DEGRADED_HOST) {
      if (statusSignature !== runtime.lastDegradedStatusSignature) {
        recovery = maybeRecoverDegradedMatchHost({
          renderState,
          windowRef: runtime.windowRef,
          cooldownMs: runtime.degradedHostRecoveryCooldownMs,
        });
        runtime.lastDegradedStatusSignature = statusSignature;
      }
    } else {
      runtime.lastDegradedStatusSignature = "";
    }

    if (surfaceStatus === CRICKET_SURFACE_STATUS.MISSING_BOARD) {
      schedulePendingDegradedHostRecheck(renderState);
    }

    if (surfaceStatus === CRICKET_SURFACE_STATUS.READY) {
      runtime.completedMissingBoardHoldKey = "";
      scheduleRecoveryRearm(renderState);
      if (transitionSignature) {
        const hadPriorReadyTransition = Boolean(runtime.lastReadyTransitionSignature);
        const transitionChanged = transitionSignature !== runtime.lastReadyTransitionSignature;
        runtime.lastReadyTransitionSignature = transitionSignature;
        if (hadPriorReadyTransition && transitionChanged) {
          schedulePostTransitionSurfaceAudit(renderState, transitionSignature);
        }
      } else {
        runtime.lastReadyTransitionSignature = "";
      }
    } else if (surfaceStatus !== CRICKET_SURFACE_STATUS.MISSING_BOARD) {
      runtime.completedMissingBoardHoldKey = "";
      runtime.lastReadyTransitionSignature = "";
    }

    const lifecycle = {
      surfaceStatus,
      statusSignature,
      transitionSignature,
      pendingDegradedHostRecheck,
      delayedMissingBoardGap,
      recovery,
    };

    runtime.subscribers.forEach((subscriber) => {
      try {
        subscriber.onRenderState?.({
          documentRef: runtime.documentRef,
          windowRef: runtime.windowRef,
          renderState,
          renderCache: runtime.renderCache,
          lifecycle,
          invalidateRenderCache,
          scheduleUpdate: () => runtime.scheduler.schedule(),
        });
      } catch (_) {
        // Feature-local render failures should not stop other cricket consumers.
      }
    });

    refreshTrackedSurfaceNodes(renderState);
  }

  runtime.scheduler = schedulerFactory(updateSharedRuntime, {
    windowRef: runtime.windowRef,
  });

  runtime.sharedMutationCallback = (mutations = []) => {
    if (runtime.subscribers.size === 0) {
      return;
    }

    const isManagedNode = (node) => {
      for (const subscriber of runtime.subscribers.values()) {
        if (typeof subscriber.isManagedNode === "function" && subscriber.isManagedNode(node)) {
          return true;
        }
      }
      return false;
    };

    if (!hasExternalDomMutation(mutations, isManagedNode)) {
      return;
    }

    const interestedSubscriber = Array.from(runtime.subscribers.values()).some((subscriber) => {
      return typeof subscriber.shouldScheduleMutation === "function"
        ? subscriber.shouldScheduleMutation(mutations)
        : false;
    });
    if (
      !interestedSubscriber &&
      !hasRelevantCricketMutation(mutations) &&
      !hasTrackedCricketSurfaceMutation(mutations, runtime.surfaceWatchState)
    ) {
      return;
    }

    invalidateRenderCache();
    runtime.scheduler.schedule();
  };

  const rootNode =
    runtime.documentRef.getElementById?.("root") ||
    runtime.documentRef.body ||
    runtime.documentRef.documentElement ||
    runtime.documentRef;
  if (
    runtime.observerRegistry &&
    typeof runtime.observerRegistry.registerMutationObserver === "function"
  ) {
    runtime.sharedObserver = runtime.observerRegistry.registerMutationObserver({
      key: SHARED_OBSERVER_KEY,
      target: rootNode,
      callback: runtime.sharedMutationCallback,
      observeOptions: {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeFilter: SHARED_CRICKET_SURFACE_ATTRIBUTE_FILTER.slice(),
      },
      MutationObserverRef: runtime.windowRef?.MutationObserver,
    });
  }

  if (
    runtime.listenerRegistry &&
    typeof runtime.listenerRegistry.register === "function"
  ) {
    runtime.listenerRegistry.register({
      key: SHARED_LISTENER_KEYS.resize,
      target: runtime.windowRef,
      type: "resize",
      handler: () => {
        invalidateRenderCache();
        runtime.scheduler.schedule();
      },
      options: { passive: true },
    });
    runtime.listenerRegistry.register({
      key: SHARED_LISTENER_KEYS.orientation,
      target: runtime.windowRef,
      type: "orientationchange",
      handler: () => {
        invalidateRenderCache();
        runtime.scheduler.schedule();
      },
      options: { passive: true },
    });
    runtime.listenerRegistry.register({
      key: SHARED_LISTENER_KEYS.visibility,
      target: runtime.documentRef,
      type: "visibilitychange",
      handler: () => {
        invalidateRenderCache();
        runtime.scheduler.schedule();
      },
    });
  }

  runtime.cleanupGameStateSubscription =
    runtime.gameState && typeof runtime.gameState.subscribe === "function"
      ? runtime.gameState.subscribe(() => runtime.scheduler.schedule())
      : () => {};

  runtime.subscribe = function subscribeSharedRuntime(options = {}) {
    const featureKey = String(options.featureKey || "").trim();
    if (!featureKey) {
      return () => {};
    }

    const subscriber = {
      featureKey,
      onRenderState:
        typeof options.onRenderState === "function" ? options.onRenderState : () => {},
      onInvalidateCache:
        typeof options.onInvalidateCache === "function" ? options.onInvalidateCache : null,
      collectWatchNodes:
        typeof options.collectWatchNodes === "function" ? options.collectWatchNodes : null,
      shouldScheduleMutation:
        typeof options.shouldScheduleMutation === "function"
          ? options.shouldScheduleMutation
          : null,
      isManagedNode:
        typeof options.isManagedNode === "function" ? options.isManagedNode : null,
    };

    runtime.subscribers.set(featureKey, subscriber);
    const aliasObserverKey = String(options.observerAliasKey || "").trim();
    if (
      aliasObserverKey &&
      runtime.observerRegistry &&
      typeof runtime.observerRegistry.register === "function"
    ) {
      runtime.observerRegistry.__sharedCricketAliasStore?.set(
        aliasObserverKey,
        createRuntimeAliasObserver(runtime)
      );
    }

    runtime.scheduler.schedule();
    let removed = false;
    return () => {
      if (removed) {
        return;
      }
      removed = true;

      runtime.subscribers.delete(featureKey);
      if (
        aliasObserverKey &&
        runtime.observerRegistry &&
        typeof runtime.observerRegistry.disconnect === "function"
      ) {
        runtime.observerRegistry.disconnect(aliasObserverKey);
      }

      if (runtime.subscribers.size === 0) {
        runtime.dispose();
      }
    };
  };

  runtime.dispose = function disposeSharedRuntime() {
    if (runtime.cleanedUp) {
      return;
    }
    runtime.cleanedUp = true;

    runtime.scheduler.cancel();
    clearPendingDegradedHostRecheck();
    clearPendingRecoveryRearm();
    clearPendingSurfaceAudit();
    setCricketSurfaceWatchNodes(runtime.surfaceWatchState, []);

    try {
      runtime.cleanupGameStateSubscription();
    } catch (_) {
      // Keep cleanup fail-soft.
    }

    if (
      runtime.observerRegistry &&
      typeof runtime.observerRegistry.disconnect === "function"
    ) {
      runtime.observerRegistry.disconnect(SHARED_OBSERVER_KEY);
    }
    if (runtime.listenerRegistry && typeof runtime.listenerRegistry.remove === "function") {
      Object.values(SHARED_LISTENER_KEYS).forEach((key) => runtime.listenerRegistry.remove(key));
    }

    clearSharedRuntimeStore(runtime.windowRef, runtime.documentRef, runtime);
  };

  return runtime;
}

export function acquireSharedCricketRuntime(context = {}) {
  const documentRef = context.documentRef || (typeof document !== "undefined" ? document : null);
  const windowRef = context.windowRef || (typeof window !== "undefined" ? window : null);

  const existingRuntime = getSharedRuntimeStore(windowRef, documentRef);
  if (existingRuntime) {
    return existingRuntime;
  }

  const runtime = createSharedCricketRuntime(context);
  if (!runtime) {
    return null;
  }

  setSharedRuntimeStore(windowRef, documentRef, runtime);
  return runtime;
}
