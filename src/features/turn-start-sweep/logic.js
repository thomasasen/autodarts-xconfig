import { SWEEP_CLASS } from "./style.js";

const ACTIVE_PLAYER_SELECTORS = Object.freeze([
  ".ad-ext-player.ad-ext-player-active",
  ".ad-ext-player-active",
]);

function findBySelectors(documentRef, selectors) {
  if (!documentRef || typeof documentRef.querySelector !== "function") {
    return null;
  }

  for (const selector of selectors) {
    const found = documentRef.querySelector(selector);
    if (found) {
      return found;
    }
  }

  return null;
}

export function findActivePlayerNode(documentRef) {
  return findBySelectors(documentRef, ACTIVE_PLAYER_SELECTORS);
}

function forceAnimationReflow(node) {
  if (!node) {
    return 0;
  }

  if (Number.isFinite(node.offsetWidth)) {
    return node.offsetWidth;
  }

  return Number(node.getBoundingClientRect?.().width || 0);
}

export function runTurnStartSweep(node, state, config = {}, windowRef = null) {
  if (!node?.classList || !state) {
    return;
  }

  const durationMs = Number(config.durationMs) || 420;
  const sweepDelayMs = Number(config.sweepDelayMs) || 0;
  const setTimeoutRef =
    (windowRef && typeof windowRef.setTimeout === "function"
      ? windowRef.setTimeout.bind(windowRef)
      : setTimeout);
  const clearTimeoutRef =
    (windowRef && typeof windowRef.clearTimeout === "function"
      ? windowRef.clearTimeout.bind(windowRef)
      : clearTimeout);

  node.classList.remove(SWEEP_CLASS);
  // Force style recalculation so class re-apply retriggers the keyframes.
  forceAnimationReflow(node);
  node.classList.add(SWEEP_CLASS);
  state.nodes.add(node);

  const previousTimeout = state.timeoutsByNode.get(node);
  if (previousTimeout) {
    clearTimeoutRef(previousTimeout);
  }

  const timeoutHandle = setTimeoutRef(() => {
    node.classList.remove(SWEEP_CLASS);
    state.timeoutsByNode.delete(node);
    state.nodes.delete(node);
  }, durationMs + sweepDelayMs + 80);
  state.timeoutsByNode.set(node, timeoutHandle);
}

export function clearTurnStartSweepState(state, windowRef = null) {
  if (!state) {
    return;
  }

  const clearTimeoutRef =
    (windowRef && typeof windowRef.clearTimeout === "function"
      ? windowRef.clearTimeout.bind(windowRef)
      : clearTimeout);

  state.timeoutsByNode.forEach((timeoutHandle, node) => {
    clearTimeoutRef(timeoutHandle);
    if (node?.classList) {
      node.classList.remove(SWEEP_CLASS);
    }
  });

  state.timeoutsByNode.clear();
  state.nodes.forEach((node) => {
    if (node?.classList) {
      node.classList.remove(SWEEP_CLASS);
    }
  });
  state.nodes.clear();
}
