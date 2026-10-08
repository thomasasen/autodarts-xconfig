import { createRafScheduler } from "../../shared/raf-scheduler.js";
import { readModernCricketGrid } from "../cricket-surface/modern-grid.js";
import {
  advanceX01TurnGeneration,
  clearX01TurnHistory,
  readTurnLifecycleCandidates,
  resolveX01CheckoutContext,
} from "../x01-checkout-context.js";

function variantKey(value) {
  const text = String(value || "").trim().toLowerCase();
  return /^(?:x01|121|170|\d+01)$/.test(text) ? "x01" : text;
}

function hasIdentity(candidate) {
  return candidate && !candidate.foreignMatch && (
    Number.isInteger(candidate.activePlayerIndex) || candidate.activePlayerId
  );
}

function samePlayer(left, right) {
  if (Number.isInteger(left?.activePlayerIndex) && Number.isInteger(right?.activePlayerIndex)) {
    return left.activePlayerIndex === right.activePlayerIndex;
  }
  return Boolean(left?.activePlayerId) && left.activePlayerId === right?.activePlayerId;
}

function sameSurface(left, right) {
  return (!left?.matchId || !right?.matchId || left.matchId === right.matchId) &&
    (!left?.variant || !right?.variant || variantKey(left.variant) === variantKey(right.variant));
}

// One controller per runtime. All resets finish before any feature is scheduled.
export function createTurnLifecycle(context = {}, options = {}) {
  const entries = new Set();
  const read = options.readCandidates || (() => {
    const candidates = readTurnLifecycleCandidates(context);
    const grid = readModernCricketGrid(context.documentRef);
    if (grid) {
      const stateVariant = String(candidates.state.variant || "");
      candidates.dom = {
        ...candidates.dom,
        variant: /cricket|tactics/i.test(stateVariant) ? stateVariant : "Cricket",
        activePlayerIndex: grid.activePlayerIndex,
        activePlayerId: Number.isInteger(grid.activePlayerIndex) ? `index:${grid.activePlayerIndex}` : "",
      };
    }
    return candidates;
  });
  const resolveTruth = options.resolveTruth || (() => resolveX01CheckoutContext(context));
  let snapshot = Object.freeze({ generation: 0, phase: "idle" });
  let accepted = null;
  let previousVisit = null;
  let previous = null;
  let waitingFor = "";
  let refreshing = false;
  let started = false;
  let dirty = true;
  let unsubscribe = () => {};

  function invoke(entry, key) {
    try {
      entry[key]?.(snapshot);
    } catch (error) {
      context.logger?.error?.(`[autodarts-xconfig:turn-lifecycle] ${key} failed`, error);
    }
  }

  function refresh() {
    if (refreshing) return snapshot;
    refreshing = true;
    dirty = false;
    try {
      const candidates = read();
      let state = hasIdentity(candidates.state) ? candidates.state : null;
      const dom = hasIdentity(candidates.dom) ? candidates.dom : null;
      if (dom?.variant && state?.variant && !sameSurface(state, dom)) state = null;
      const agree = state && dom && sameSurface(state, dom) && samePlayer(state, dom);
      const truth = variantKey(dom?.variant || state?.variant) === "x01"
        ? resolveTruth() : { active: false, actionable: false };
      let selected = null;
      if (agree) {
        selected = state;
        waitingFor = "";
      } else if (waitingFor === "dom" && state && accepted && sameSurface(state, accepted)) {
        selected = state;
      } else if (waitingFor === "state" && dom && accepted && sameSurface(dom, accepted)) {
        selected = dom;
      } else if (state && !dom) {
        selected = state;
      } else if (dom && !state) {
        selected = dom;
      } else if (truth.actionable) {
        selected = truth.source === "dom" ? dom : state;
      } else if (previous) {
        const stateChanged = state && identityKey(state) !== identityKey(previous.state);
        const domChanged = dom && identityKey(dom) !== identityKey(previous.dom);
        if (Boolean(stateChanged) !== Boolean(domChanged)) selected = stateChanged ? state : dom;
      }
      previous = candidates;
      // A lone return to the preceding identity could be either delayed data
      // or Undo. Wait for the other source rather than reversing the visit.
      if (!agree && selected && previousVisit && sameSurface(selected, previousVisit) &&
          samePlayer(selected, previousVisit) &&
          (selected === dom || (selected.activeTurnId && selected.activeTurnId === previousVisit.stateTurnId))) {
        selected = null;
      }
      if (!selected) {
        const phase = state || dom ? "pending" : "idle";
        const suspend = snapshot.phase !== phase;
        snapshot = Object.freeze({ ...snapshot, phase });
        if (suspend) entries.forEach((entry) => invoke(entry, "suspend"));
        return snapshot;
      }
      const sourceIsState = selected === state;
      const stateTurnId = sourceIsState && !String(selected.activeTurn?.finishedAt || "").trim()
        ? selected.activeTurnId || "" : "";
      const boundary = sourceIsState ? selected.gameBoundaryToken || selected.matchId :
        (accepted && sameSurface(selected, accepted) ? accepted.gameBoundaryToken : selected.matchId);
      const changed = !accepted || !sameSurface(selected, accepted) || !samePlayer(selected, accepted) ||
        (sourceIsState && accepted.stateBoundaryKnown && boundary && accepted.gameBoundaryToken &&
          boundary !== accepted.gameBoundaryToken) ||
        (stateTurnId && accepted.stateTurnId && stateTurnId !== accepted.stateTurnId);
      if (!agree && state && dom) waitingFor = sourceIsState ? "dom" : "state";
      if (changed && accepted) previousVisit = accepted;
      accepted = {
        matchId: selected.matchId || "",
        variant: variantKey(selected.variant),
        gameBoundaryToken: boundary || "",
        stateBoundaryKnown: sourceIsState || (!changed && accepted?.stateBoundaryKnown === true),
        activePlayerIndex: selected.activePlayerIndex,
        activePlayerId: selected.activePlayerId,
        // Adopt the real turn ID when state catches up with a DOM-first switch.
        stateTurnId: stateTurnId || (!changed ? accepted?.stateTurnId || "" : ""),
      };
      const previousPhase = snapshot.phase;
      snapshot = Object.freeze({
        ...accepted,
        generation: snapshot.generation + (changed ? 1 : 0),
        phase: (state && dom && !agree) || (truth.active && !truth.actionable) ? "pending" : "ready",
      });
      if (changed) {
        advanceX01TurnGeneration(context.documentRef, snapshot.generation);
        entries.forEach((entry) => invoke(entry, "reset"));
      } else if (previousPhase !== "pending" && snapshot.phase === "pending") {
        entries.forEach((entry) => invoke(entry, "suspend"));
      }
      if (changed || (previousPhase !== "ready" && snapshot.phase === "ready")) {
        entries.forEach((entry) => invoke(entry, "schedule"));
      }
      return snapshot;
    } finally {
      refreshing = false;
    }
  }

  function start() {
    if (started) return;
    started = true;
    unsubscribe = context.gameState?.subscribe?.(invalidate) || (() => {});
    context.registries?.observers?.registerMutationObserver?.({
      key: "turn-lifecycle:dom-observer",
      target: context.documentRef?.documentElement || context.documentRef?.body,
      MutationObserverRef: context.windowRef?.MutationObserver,
      callback: invalidate,
      observeOptions: {
        subtree: true, childList: true, characterData: true, attributes: true,
        attributeFilter: ["class", "hidden", "aria-hidden", "data-state", "aria-selected"],
      },
    });
    scheduler.schedule();
  }

  function stop() {
    started = false;
    unsubscribe();
    scheduler.cancel();
    context.registries?.observers?.disconnect?.("turn-lifecycle:dom-observer");
    entries.clear();
    accepted = null;
    previousVisit = null;
    previous = null;
    waitingFor = "";
    dirty = true;
    clearX01TurnHistory(context.documentRef);
    snapshot = Object.freeze({ generation: 0, phase: "idle" });
  }

  const scheduler = createRafScheduler(() => {
    if (entries.size && dirty) refresh();
  }, { windowRef: context.windowRef });
  function invalidate() {
    dirty = true;
    scheduler.schedule();
  }
  return {
    start, stop, refresh,
    ensureCurrent: () => dirty || !started ? refresh() : snapshot,
    getSnapshot: () => snapshot,
    register(entry) {
      entries.add(entry);
      return () => entries.delete(entry);
    },
  };
}

function identityKey(candidate) {
  return candidate ? JSON.stringify([
    candidate.matchId, variantKey(candidate.variant), candidate.gameBoundaryToken,
    candidate.activePlayerIndex, candidate.activePlayerId,
    candidate.source === "dom" ? "" : candidate.activeTurnId,
  ]) : "";
}

// Standalone mounts and previews retain their existing scheduler behavior.
export function createTurnScopedScheduler(context, callback, options = {}, factory = createRafScheduler) {
  const lifecycle = context.turnLifecycle;
  if (!lifecycle) return factory(callback, options);
  let disposed = false;
  let rehydrating = true;
  let renderedGeneration = -1;
  let pendingSince = null;
  let renderError = "";
  function schedule() {
    if (disposed) return;
    if (pendingSince === null) pendingSince = Date.now();
    scheduler.schedule();
  }
  function reset(snapshot, suspended = false) {
    rehydrating = true;
    renderError = "";
    try {
      (suspended ? options.suspendTurn || options.resetTurn : options.resetTurn)?.(snapshot);
    } catch (error) {
      renderError = `reset-failed: ${error?.message || error}`;
      throw error;
    }
  }
  const scheduler = factory(() => {
    if (disposed) return;
    const snapshot = lifecycle.ensureCurrent();
    if (snapshot.phase !== "pending") {
      const hydrate = rehydrating;
      rehydrating = false;
      try {
        callback({ rehydrating: hydrate, generation: snapshot.generation });
        renderedGeneration = snapshot.generation;
        pendingSince = null;
        renderError = "";
      } catch (error) {
        renderError = `render-failed: ${error?.message || error}`;
        if (!context.watchdog && !options.containRenderErrors) throw error;
      }
    } else {
      pendingSince = null;
    }
  }, options);
  const health = {
    coverage: options.checkHealth ? "display" : "render",
    check(snapshot) {
      if (pendingSince !== null && Date.now() - pendingSince < 1500) return true;
      if (renderError) return renderError;
      if (renderedGeneration !== snapshot.generation) return "generation-not-rendered";
      if (pendingSince !== null && Date.now() - pendingSince >= 1500) return "render-stalled";
      return options.checkHealth?.(snapshot) ?? true;
    },
    repair(snapshot) {
      scheduler.cancel();
      if (options.repairHealth) {
        rehydrating = true;
        options.repairHealth(snapshot);
      } else {
        reset(snapshot, true);
      }
      schedule();
    },
    restartSafe: options.watchdogRestartSafe === true,
  };
  const unregisterHealth = context.watchdog?.register(health) || (() => {});
  const unregister = lifecycle.register({
    reset: (snapshot) => reset(snapshot),
    suspend: (snapshot) => reset(snapshot, true),
    schedule,
  });
  return {
    ...scheduler,
    health,
    schedule,
    cancel() {
      disposed = true;
      unregister();
      unregisterHealth();
      scheduler.cancel();
    },
  };
}
