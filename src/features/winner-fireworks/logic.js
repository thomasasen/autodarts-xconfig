import { OVERLAY_ID } from "./style.js";

const PLAYER_WINNER_SELECTOR = ".ad-ext-player-winner, .ad-ext-player.ad-ext-player-winner";
const LEGACY_WINNER_ANIMATION_SELECTOR = ".ad-ext_winner-animation";
const TERMINAL_STATUS_TOKENS = new Set([
  "finished",
  "finish",
  "completed",
  "complete",
  "done",
  "ended",
  "end",
  "closed",
  "over",
  "game-over",
  "match-over",
  "won",
]);

function randomInRange(min, max) {
  return Math.random() * (max - min) + min;
}

function isBullOutVariant(variantText) {
  const variant = String(variantText || "").trim().toLowerCase();
  return (
    variant.includes("bull-off") ||
    variant.includes("bull out") ||
    variant.includes("bullout") ||
    variant.includes("bull-out")
  );
}

function scaledCount(baseValue, intensityPreset) {
  return Math.max(1, Math.round(Number(baseValue || 0) * Number(intensityPreset?.particleScale || 1)));
}

function scaledVelocity(baseValue, intensityPreset) {
  return Math.max(0, Number(baseValue || 0) * Number(intensityPreset?.velocityScale || 1));
}

function scaledInterval(baseValue, intensityPreset) {
  return Math.max(16, Math.round(Number(baseValue || 16) * Number(intensityPreset?.intervalScale || 1)));
}

function parseWinnerIndex(value, playerCount) {
  if (value === null || typeof value === "undefined" || typeof value === "boolean") {
    return null;
  }

  if (typeof value === "string" && !value.trim()) {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    return null;
  }

  if (Number.isFinite(playerCount) && playerCount > 0 && parsed >= playerCount) {
    return null;
  }

  return parsed;
}

function normalizeStatusToken(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-");
}

function hasTerminalStatus(match) {
  const statusKeys = [
    "status",
    "state",
    "phase",
    "matchStatus",
    "gameStatus",
    "lifecycle",
  ];

  return statusKeys.some((key) =>
    TERMINAL_STATUS_TOKENS.has(normalizeStatusToken(match?.[key]))
  );
}

function hasTerminalTimestamp(match) {
  const timestampKeys = [
    "finishedAt",
    "endedAt",
    "completedAt",
    "closedAt",
    "gameFinishedAt",
    "matchFinishedAt",
  ];

  return timestampKeys.some((key) => String(match?.[key] || "").trim().length > 0);
}

function hasTerminalFlag(match) {
  const flagKeys = [
    "finished",
    "isFinished",
    "ended",
    "isEnded",
    "completed",
    "isCompleted",
    "closed",
    "isClosed",
    "gameFinished",
    "isGameFinished",
    "matchFinished",
    "isMatchFinished",
  ];

  return flagKeys.some((key) => match?.[key] === true);
}

function hasStateWinner(match) {
  if (!match || typeof match !== "object") {
    return false;
  }

  const playerCount = Array.isArray(match.players) ? match.players.length : NaN;
  const winnerIndex = parseWinnerIndex(match.winner, playerCount);
  const gameWinnerIndex = parseWinnerIndex(match.gameWinner, playerCount);

  if (winnerIndex === null && gameWinnerIndex === null) {
    return false;
  }

  return hasTerminalTimestamp(match) || hasTerminalFlag(match) || hasTerminalStatus(match);
}

export function getWinnerSignal(options = {}) {
  const documentRef = options.documentRef;
  const gameState = options.gameState;
  const visualConfig = options.visualConfig;

  const domPlayerWinnerVisible = Boolean(
    documentRef?.querySelector?.(PLAYER_WINNER_SELECTOR)
  );
  const domLegacyWinnerAnimationVisible = Boolean(
    documentRef?.querySelector?.(LEGACY_WINNER_ANIMATION_SELECTOR)
  );
  const match = gameState?.getSnapshot?.()?.match || null;
  const stateWinnerVisible = hasStateWinner(match);
  const domWinnerVisible =
    domPlayerWinnerVisible || (domLegacyWinnerAnimationVisible && stateWinnerVisible);
  const variantText = String(
    gameState?.getVariant?.() ||
      documentRef?.getElementById?.("ad-ext-game-variant")?.textContent ||
      ""
  );
  const variantAllowed = visualConfig.includeBullOut || !isBullOutVariant(variantText);

  return {
    active: variantAllowed && (domWinnerVisible || stateWinnerVisible),
    domWinnerVisible,
    domPlayerWinnerVisible,
    domLegacyWinnerAnimationVisible,
    stateWinnerVisible,
    variantText,
    variantAllowed,
  };
}

function emit(confettiRunner, visualConfig, payload = {}) {
  if (!confettiRunner) {
    return;
  }
  confettiRunner({
    disableForReducedMotion: true,
    zIndex: 2147483646,
    colors: visualConfig.colors,
    ...payload,
    particleCount: scaledCount(payload.particleCount, visualConfig.intensityPreset),
    startVelocity: scaledVelocity(payload.startVelocity, visualConfig.intensityPreset),
  });
}

function runStyleBurst(state) {
  const confettiRunner = state.confettiRunner;
  const visualConfig = state.visualConfig;
  if (!confettiRunner || !visualConfig) {
    return;
  }

  const style = visualConfig.style;

  if (style === "sides") {
    emit(confettiRunner, visualConfig, {
      particleCount: 3,
      angle: 32,
      spread: 40,
      startVelocity: 46,
      decay: 0.91,
      origin: { x: 0.01, y: 0.78 },
    });
    emit(confettiRunner, visualConfig, {
      particleCount: 3,
      angle: 148,
      spread: 40,
      startVelocity: 46,
      decay: 0.91,
      origin: { x: 0.99, y: 0.78 },
    });
    return;
  }

  if (style === "fireworks") {
    emit(confettiRunner, visualConfig, {
      particleCount: randomInRange(22, 48),
      spread: 320,
      startVelocity: 44,
      origin: { x: randomInRange(0.08, 0.92), y: randomInRange(0.03, 0.3) },
    });
    return;
  }

  if (style === "cannon") {
    emit(confettiRunner, visualConfig, {
      particleCount: 108,
      spread: 68,
      startVelocity: 58,
      decay: 0.9,
      origin: { x: 0.5, y: 0.65 },
    });
    return;
  }

  if (style === "victorystorm") {
    emit(confettiRunner, visualConfig, {
      particleCount: 72,
      angle: 90,
      spread: 82,
      startVelocity: 54,
      origin: { x: randomInRange(0.42, 0.58), y: 0.74 },
    });
    emit(confettiRunner, visualConfig, {
      particleCount: 38,
      angle: 60,
      spread: 58,
      startVelocity: 42,
      origin: { x: 0.1, y: 0.74 },
    });
    emit(confettiRunner, visualConfig, {
      particleCount: 38,
      angle: 120,
      spread: 58,
      startVelocity: 42,
      origin: { x: 0.9, y: 0.74 },
    });
    return;
  }

  if (style === "stars") {
    emit(confettiRunner, visualConfig, {
      particleCount: 66,
      spread: 360,
      startVelocity: 38,
      gravity: 0.12,
      decay: 0.93,
      shapes: ["star"],
      origin: { x: 0.5, y: 0.62 },
    });
    return;
  }

  // realistic (default)
  emit(confettiRunner, visualConfig, {
    particleCount: 64,
    spread: 74,
    startVelocity: 48,
    origin: { x: 0.5, y: 0.7 },
  });
  emit(confettiRunner, visualConfig, {
    particleCount: 26,
    angle: 60,
    spread: 54,
    startVelocity: 38,
    origin: { x: 0.02, y: 0.72 },
  });
  emit(confettiRunner, visualConfig, {
    particleCount: 26,
    angle: 120,
    spread: 54,
    startVelocity: 38,
    origin: { x: 0.98, y: 0.72 },
  });
}

function getStyleIntervalMs(style, intensityPreset) {
  const base = style === "sides"
    ? 16
    : style === "fireworks"
      ? 250
      : style === "victorystorm"
        ? 620
        : style === "stars"
          ? 980
          : 920;
  return scaledInterval(base, intensityPreset);
}

function clearStateTimers(state, windowRef) {
  const clearTimeoutRef =
    (windowRef && typeof windowRef.clearTimeout === "function"
      ? windowRef.clearTimeout.bind(windowRef)
      : clearTimeout);
  const clearIntervalRef =
    (windowRef && typeof windowRef.clearInterval === "function"
      ? windowRef.clearInterval.bind(windowRef)
      : clearInterval);

  if (state.intervalHandle) {
    clearIntervalRef(state.intervalHandle);
  }
  state.intervalHandle = 0;

  state.timeoutHandles.forEach((handle) => clearTimeoutRef(handle));
  state.timeoutHandles.clear();
}

export function createWinnerFireworksState(options = {}) {
  return {
    documentRef: options.documentRef || null,
    windowRef: options.windowRef || null,
    domGuards: options.domGuards || null,
    visualConfig: options.visualConfig || null,
    overlayId: String(options.overlayId || OVERLAY_ID).trim() || OVERLAY_ID,
    confettiFactory: options.confettiFactory || null,
    confettiRunner: null,
    overlayNode: null,
    canvasNode: null,
    running: false,
    dismissedForCurrentWin: false,
    lastSignalActive: false,
    intervalHandle: 0,
    timeoutHandles: new Set(),
  };
}

function ensureOverlay(state) {
  const documentRef = state.documentRef;
  if (!documentRef || !state.domGuards) {
    return null;
  }
  const overlayId = String(state.overlayId || OVERLAY_ID).trim() || OVERLAY_ID;

  const existing = documentRef.getElementById?.(overlayId);
  if (existing) {
    state.overlayNode = existing;
    state.canvasNode = existing.querySelector?.("canvas") || null;
  }

  if (state.overlayNode && state.canvasNode && state.confettiRunner) {
    return state.overlayNode;
  }

  if (!state.overlayNode) {
    const overlay = state.domGuards.ensureSingleNode({
      id: overlayId,
      selector: `#${overlayId}`,
      parent: documentRef.body || documentRef.documentElement || null,
      create: (doc) => doc.createElement("div"),
    });
    if (!overlay) {
      return null;
    }
    state.overlayNode = overlay;
  }

  if (!state.canvasNode) {
    const canvas = state.documentRef.createElement("canvas");
    state.overlayNode.appendChild(canvas);
    state.canvasNode = canvas;
  }

  if (!state.confettiRunner && typeof state.confettiFactory === "function") {
    if (typeof state.confettiFactory.create === "function") {
      state.confettiRunner = state.confettiFactory.create(state.canvasNode, {
        resize: true,
        useWorker: false,
      });
    } else {
      state.confettiRunner = state.confettiFactory;
    }
  }

  return state.overlayNode;
}

export function stopWinnerFireworks(state) {
  if (!state) {
    return;
  }
  clearStateTimers(state, state.windowRef);
  if (state.confettiRunner && typeof state.confettiRunner.reset === "function") {
    try {
      state.confettiRunner.reset();
    } catch (_) {
      // fail-soft
    }
  }
  state.confettiRunner = null;
  state.running = false;

  if (state.overlayNode?.parentNode && typeof state.overlayNode.parentNode.removeChild === "function") {
    state.overlayNode.parentNode.removeChild(state.overlayNode);
  }
  state.overlayNode = null;
  state.canvasNode = null;
}

export function startWinnerFireworks(state) {
  if (!state || state.running || state.dismissedForCurrentWin) {
    return;
  }
  if (!ensureOverlay(state) || !state.confettiRunner) {
    return;
  }

  const setIntervalRef =
    (state.windowRef && typeof state.windowRef.setInterval === "function"
      ? state.windowRef.setInterval.bind(state.windowRef)
      : setInterval);

  state.running = true;
  runStyleBurst(state);
  const intervalMs = getStyleIntervalMs(
    state.visualConfig.style,
    state.visualConfig.intensityPreset
  );
  state.intervalHandle = setIntervalRef(() => {
    if (!state.running) {
      return;
    }
    runStyleBurst(state);
  }, intervalMs);
}

export function syncWinnerFireworks(state, winnerSignal) {
  if (!state || !winnerSignal) {
    return;
  }

  if (winnerSignal.active && !state.lastSignalActive) {
    state.dismissedForCurrentWin = false;
  }

  if (!winnerSignal.active && state.lastSignalActive) {
    state.dismissedForCurrentWin = false;
    stopWinnerFireworks(state);
  } else if (winnerSignal.active && !state.running) {
    startWinnerFireworks(state);
  }

  state.lastSignalActive = Boolean(winnerSignal.active);
}
