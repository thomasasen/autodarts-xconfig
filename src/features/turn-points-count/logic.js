import { SCORE_FLASH_CLASS, SCORE_FRAME_CLASS, SCORE_SELECTOR } from "./style.js";

function easeOutCubic(value) {
  return 1 - Math.pow(1 - value, 3);
}

function parseScore(text) {
  const match = String(text || "").match(/-?\d+/);
  if (!match) {
    return null;
  }
  const value = Number(match[0]);
  return Number.isFinite(value) ? value : null;
}

export function collectScoreNodes(documentRef) {
  if (!documentRef || typeof documentRef.querySelectorAll !== "function") {
    return [];
  }
  return Array.from(documentRef.querySelectorAll(SCORE_SELECTOR));
}

function resolveFrameNode(scoreNode) {
  if (!scoreNode) {
    return null;
  }
  return scoreNode.parentElement || scoreNode;
}

function clearFlashTimer(node, state, windowRef = null) {
  if (!node || !state) {
    return;
  }

  const clearTimer =
    (windowRef && typeof windowRef.clearTimeout === "function"
      ? windowRef.clearTimeout.bind(windowRef)
      : clearTimeout);
  const timerHandle = state.flashTimeoutByNode?.get?.(node);
  if (timerHandle) {
    try {
      clearTimer(timerHandle);
    } catch (_) {
      // fail-soft
    }
  }
  state.flashTimeoutByNode?.delete?.(node);
}

function removeFlashClasses(node, state) {
  if (!node || !state) {
    return;
  }
  node.classList?.remove?.(SCORE_FLASH_CLASS);
  const frameNode = state.flashFrameByScoreNode?.get?.(node) || resolveFrameNode(node);
  frameNode?.classList?.remove?.(SCORE_FRAME_CLASS);
  state.flashFrameByScoreNode?.delete?.(node);
}

function clearFlashState(node, state, windowRef = null) {
  clearFlashTimer(node, state, windowRef);
  removeFlashClasses(node, state);
}

function triggerScoreFlash(node, state, windowRef = null) {
  if (!node || !state) {
    return;
  }

  const frameNode = resolveFrameNode(node);
  clearFlashState(node, state, windowRef);
  node.classList?.remove?.(SCORE_FLASH_CLASS);
  frameNode?.classList?.remove?.(SCORE_FRAME_CLASS);
  if (typeof node.getBoundingClientRect === "function") {
    node.getBoundingClientRect();
  }
  if (typeof frameNode?.getBoundingClientRect === "function") {
    frameNode.getBoundingClientRect();
  }
  node.classList?.add?.(SCORE_FLASH_CLASS);
  frameNode?.classList?.add?.(SCORE_FRAME_CLASS);
  state.flashFrameByScoreNode?.set?.(node, frameNode);
}

function scheduleFlashAfterglow(node, state, windowRef = null, delayMs = 0) {
  const normalizedDelayMs = Math.max(0, Number(delayMs) || 0);
  if (!node || !state || normalizedDelayMs <= 0) {
    clearFlashState(node, state, windowRef);
    return;
  }

  const setTimer =
    (windowRef && typeof windowRef.setTimeout === "function"
      ? windowRef.setTimeout.bind(windowRef)
      : setTimeout);
  clearFlashTimer(node, state, windowRef);
  const timerHandle = setTimer(() => {
    state.flashTimeoutByNode?.delete?.(node);
    removeFlashClasses(node, state);
  }, normalizedDelayMs);
  state.flashTimeoutByNode?.set?.(node, timerHandle);
}

export function stopAnimation(node, state, windowRef = null, options = {}) {
  if (!node || !state) {
    return;
  }

  const cancelRaf =
    (windowRef && typeof windowRef.cancelAnimationFrame === "function"
      ? windowRef.cancelAnimationFrame.bind(windowRef)
      : cancelAnimationFrame);

  const rafHandle = state.activeRafByNode.get(node);
  if (rafHandle) {
    cancelRaf(rafHandle);
  }
  state.activeRafByNode.delete(node);

  const animeInstance = state.activeAnimeByNode.get(node);
  if (animeInstance && typeof animeInstance.pause === "function") {
    try {
      animeInstance.pause();
    } catch (_) {
      // fail-soft
    }
  }
  state.activeAnimeByNode.delete(node);
  state.targetValueByNode.delete(node);
  const flashAfterglowMs = Math.max(0, Number(options.flashAfterglowMs) || 0);
  scheduleFlashAfterglow(node, state, windowRef, flashAfterglowMs);
}

export function animateScore(node, options = {}) {
  const state = options.state;
  const fromValue = Number(options.fromValue);
  const toValue = Number(options.toValue);
  const durationMs = Number(options.durationMs) || 416;
  const flashEnabled = options.flashEnabled !== false;
  const flashAfterglowMs = Math.max(0, Number(options.flashAfterglowMs) || 0);
  const animeRef = options.animeRef;
  const windowRef = options.windowRef || null;

  if (!node || !state || !Number.isFinite(fromValue) || !Number.isFinite(toValue)) {
    return;
  }

  stopAnimation(node, state, windowRef);
  state.targetValueByNode.set(node, toValue);
  if (flashEnabled) {
    triggerScoreFlash(node, state, windowRef);
  }

  if (typeof animeRef === "function") {
    const valueHolder = { value: fromValue };
    const animeInstance = animeRef({
      targets: valueHolder,
      value: toValue,
      round: 1,
      duration: durationMs,
      easing: "easeOutCubic",
      update: () => {
        node.textContent = String(Number(valueHolder.value));
        state.renderedValueByNode.set(node, Number(valueHolder.value));
      },
      complete: () => {
        stopAnimation(node, state, windowRef, {
          flashAfterglowMs: flashEnabled ? flashAfterglowMs : 0,
        });
        node.textContent = String(toValue);
        state.lastValueByNode.set(node, toValue);
        state.renderedValueByNode.set(node, toValue);
      },
    });
    state.activeAnimeByNode.set(node, animeInstance);
    return;
  }

  const requestRaf =
    (windowRef && typeof windowRef.requestAnimationFrame === "function"
      ? windowRef.requestAnimationFrame.bind(windowRef)
      : requestAnimationFrame);
  const startTs = Date.now();
  const animateFrame = () => {
    const elapsed = Date.now() - startTs;
    const progress = Math.max(0, Math.min(1, elapsed / durationMs));
    const eased = easeOutCubic(progress);
    const value = Math.round(fromValue + (toValue - fromValue) * eased);
    node.textContent = String(value);
    state.renderedValueByNode.set(node, value);

    if (progress >= 1) {
      stopAnimation(node, state, windowRef, {
        flashAfterglowMs: flashEnabled ? flashAfterglowMs : 0,
      });
      node.textContent = String(toValue);
      state.lastValueByNode.set(node, toValue);
      state.renderedValueByNode.set(node, toValue);
      return;
    }

    const nextHandle = requestRaf(animateFrame);
    state.activeRafByNode.set(node, nextHandle);
  };

  const firstHandle = requestRaf(animateFrame);
  state.activeRafByNode.set(node, firstHandle);
}

export function updateTurnPoints(options = {}) {
  const documentRef = options.documentRef;
  const state = options.state;
  const durationMs = Number(options.durationMs) || 416;
  const flashEnabled = options.flashEnabled !== false;
  const flashAfterglowMs = Math.max(0, Number(options.flashAfterglowMs) || 0);
  const animeRef = options.animeRef;
  const windowRef = options.windowRef || null;

  if (!documentRef || !state) {
    return;
  }

  const scoreNodes = collectScoreNodes(documentRef);
  const nodeSet = new Set(scoreNodes);

  state.lastValueByNode.forEach((_value, node) => {
    if (nodeSet.has(node)) {
      return;
    }
    stopAnimation(node, state, windowRef);
    state.lastValueByNode.delete(node);
    state.renderedValueByNode.delete(node);
  });

  scoreNodes.forEach((node) => {
    const parsedValue = parseScore(node.textContent);
    if (parsedValue === null) {
      stopAnimation(node, state, windowRef);
      return;
    }

    if (!state.lastValueByNode.has(node)) {
      state.lastValueByNode.set(node, parsedValue);
      state.renderedValueByNode.set(node, parsedValue);
      return;
    }

    const lastValue = Number(state.lastValueByNode.get(node));
    const renderedValue = Number(state.renderedValueByNode.get(node));
    const targetValue = Number(state.targetValueByNode.get(node));
    const activeAnimation = state.activeAnimeByNode.has(node) || state.activeRafByNode.has(node);

    if (
      activeAnimation &&
      (parsedValue === targetValue || parsedValue === renderedValue)
    ) {
      return;
    }

    if (parsedValue === lastValue) {
      return;
    }

    const fromValue = Number.isFinite(renderedValue) ? renderedValue : lastValue;
    animateScore(node, {
      state,
      fromValue,
      toValue: parsedValue,
      durationMs,
      flashEnabled,
      flashAfterglowMs,
      animeRef,
      windowRef,
    });
  });
}
