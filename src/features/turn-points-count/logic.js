import {
  SCORE_FLASH_CLASS,
  SCORE_FLASH_SEQUENCE_ATTRIBUTE,
  SCORE_FRAME_CLASS,
  SCORE_FRAME_SEQUENCE_ATTRIBUTE,
  SCORE_SELECTOR,
} from "./style.js";

const FLASH_MODE_ON_CHANGE = "on-change";
const FLASH_MODE_PERMANENT = "permanent";
const SCORE_CLASS_NAME = SCORE_SELECTOR.startsWith(".")
  ? SCORE_SELECTOR.slice(1)
  : SCORE_SELECTOR;
const MIN_SCORE_STEP_INTERVAL_MS = 16;

function parseScore(text) {
  const match = String(text || "").match(/-?\d+/);
  if (!match) {
    return null;
  }
  const value = Number(match[0]);
  return Number.isFinite(value) ? value : null;
}

function isValidCachedScoreNode(node) {
  if (!node || node.isConnected === false) {
    return false;
  }
  if (!SCORE_CLASS_NAME) {
    return true;
  }
  return node.classList?.contains?.(SCORE_CLASS_NAME) === true;
}

export function collectScoreNodes(documentRef, state = null) {
  const cachedNodes = Array.isArray(state?.scoreNodeCache)
    ? state.scoreNodeCache
    : [];
  if (cachedNodes.length > 0 && cachedNodes.every(isValidCachedScoreNode)) {
    return cachedNodes;
  }

  if (!documentRef || typeof documentRef.querySelectorAll !== "function") {
    if (state) {
      state.scoreNodeCache = [];
    }
    return [];
  }
  const scoreNodes = Array.from(documentRef.querySelectorAll(SCORE_SELECTOR));
  if (state) {
    state.scoreNodeCache = scoreNodes;
  }
  return scoreNodes;
}

function resolveFrameNode(scoreNode) {
  if (!scoreNode) {
    return null;
  }
  return scoreNode.parentElement || scoreNode;
}

function normalizeFlashMode(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();
  if (normalized === FLASH_MODE_PERMANENT) {
    return FLASH_MODE_PERMANENT;
  }
  return FLASH_MODE_ON_CHANGE;
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

function clearFlashRaf(node, state, windowRef = null) {
  if (!node || !state) {
    return;
  }

  const cancelRaf =
    (windowRef && typeof windowRef.cancelAnimationFrame === "function"
      ? windowRef.cancelAnimationFrame.bind(windowRef)
      : cancelAnimationFrame);
  const rafHandle = state.flashRafByNode?.get?.(node);
  if (rafHandle) {
    try {
      cancelRaf(rafHandle);
    } catch (_) {
      // fail-soft
    }
  }
  state.flashRafByNode?.delete?.(node);
}

function removeFlashClasses(node, state, options = {}) {
  if (!node || !state) {
    return;
  }
  const preserveFrame = options.preserveFrame === true;
  node.classList?.remove?.(SCORE_FLASH_CLASS);
  node.removeAttribute?.(SCORE_FLASH_SEQUENCE_ATTRIBUTE);
  const frameNode = state.flashFrameByScoreNode?.get?.(node) || resolveFrameNode(node) || null;
  if (preserveFrame) {
    if (frameNode) {
      frameNode.classList?.add?.(SCORE_FRAME_CLASS);
      state.flashFrameByScoreNode?.set?.(node, frameNode);
    }
    return;
  }
  frameNode?.classList?.remove?.(SCORE_FRAME_CLASS);
  frameNode?.removeAttribute?.(SCORE_FRAME_SEQUENCE_ATTRIBUTE);
  state.flashFrameByScoreNode?.delete?.(node);
}

function clearFlashState(node, state, windowRef = null, options = {}) {
  clearFlashRaf(node, state, windowRef);
  clearFlashTimer(node, state, windowRef);
  removeFlashClasses(node, state, options);
}

function advanceSequence(node, attributeName) {
  if (!node || !attributeName || typeof node.getAttribute !== "function") {
    return "0";
  }
  const currentValue = String(node.getAttribute(attributeName) || "").trim();
  const nextValue = currentValue === "1" ? "0" : "1";
  node.setAttribute?.(attributeName, nextValue);
  return nextValue;
}

function renderScoreValue(node, state, value) {
  if (!node || !state || !Number.isFinite(value)) {
    return false;
  }
  const normalizedValue = Number(value);
  const textValue = String(normalizedValue);
  if (
    Number(state.renderedValueByNode.get(node)) === normalizedValue &&
    node.textContent === textValue
  ) {
    return false;
  }
  node.textContent = textValue;
  state.renderedValueByNode.set(node, normalizedValue);
  return true;
}

function resolveScoreStepAnimationTiming(fromValue, toValue, durationMs) {
  const normalizedFromValue = Math.round(Number(fromValue));
  const normalizedToValue = Math.round(Number(toValue));
  const requestedDurationMs = Math.max(1, Number(durationMs) || 1000);
  const totalSteps = Math.abs(normalizedToValue - normalizedFromValue);
  const effectiveDurationMs =
    totalSteps > 0
      ? Math.max(requestedDurationMs, totalSteps * MIN_SCORE_STEP_INTERVAL_MS)
      : requestedDurationMs;
  const stepIntervalMs =
    totalSteps > 0 ? effectiveDurationMs / totalSteps : effectiveDurationMs;

  return {
    normalizedFromValue,
    normalizedToValue,
    requestedDurationMs,
    effectiveDurationMs,
    stepIntervalMs,
    totalSteps,
  };
}

function completeScoreAnimation(node, state, options = {}) {
  const windowRef = options.windowRef || null;
  const flashEnabled = options.flashEnabled !== false;
  const flashMode = normalizeFlashMode(options.flashMode);
  const flashAfterglowMs = Math.max(0, Number(options.flashAfterglowMs) || 0);
  const toValue = Number(options.toValue);

  stopAnimation(node, state, windowRef, {
    flashAfterglowMs: flashEnabled ? flashAfterglowMs : 0,
    preserveFrame: flashEnabled && flashMode === FLASH_MODE_PERMANENT,
  });
  if (Number.isFinite(toValue)) {
    state.lastValueByNode.set(node, toValue);
    renderScoreValue(node, state, toValue);
  }
}

function startScoreRafAnimation(node, state, options = {}) {
  const fromValue = Number(options.fromValue);
  const toValue = Number(options.toValue);
  const durationMs = Math.max(1, Number(options.durationMs) || 1000);
  const flashEnabled = options.flashEnabled !== false;
  const flashMode = normalizeFlashMode(options.flashMode);
  const flashAfterglowMs = Math.max(0, Number(options.flashAfterglowMs) || 0);
  const windowRef = options.windowRef || null;

  if (!node || !state || !Number.isFinite(fromValue) || !Number.isFinite(toValue)) {
    return durationMs;
  }

  const timing = resolveScoreStepAnimationTiming(fromValue, toValue, durationMs);

  if (timing.totalSteps <= 0) {
    completeScoreAnimation(node, state, {
      toValue: timing.normalizedToValue,
      flashEnabled,
      flashMode,
      flashAfterglowMs,
      windowRef,
    });
    return timing.effectiveDurationMs;
  }

  const requestRaf =
    (windowRef && typeof windowRef.requestAnimationFrame === "function"
      ? windowRef.requestAnimationFrame.bind(windowRef)
      : requestAnimationFrame);
  const direction = timing.normalizedToValue > timing.normalizedFromValue ? 1 : -1;
  let renderedStep = 0;
  let startTs = null;
  const animateFrame = (frameTimestamp) => {
    const nowMs = Number.isFinite(frameTimestamp) ? frameTimestamp : Date.now();
    if (startTs === null) {
      startTs = nowMs - Math.min(MIN_SCORE_STEP_INTERVAL_MS, timing.stepIntervalMs);
    }
    const elapsed = nowMs - startTs;
    const desiredStep = Math.max(
      0,
      Math.min(timing.totalSteps, Math.round(elapsed / timing.stepIntervalMs))
    );

    if (desiredStep > renderedStep) {
      renderedStep += 1;
      renderScoreValue(node, state, timing.normalizedFromValue + direction * renderedStep);
    }

    if (renderedStep >= timing.totalSteps) {
      completeScoreAnimation(node, state, {
        toValue: timing.normalizedToValue,
        flashEnabled,
        flashMode,
        flashAfterglowMs,
        windowRef,
      });
      return;
    }

    const nextHandle = requestRaf(animateFrame);
    state.activeRafByNode.set(node, nextHandle);
  };

  const firstHandle = requestRaf(animateFrame);
  state.activeRafByNode.set(node, firstHandle);
  return timing.effectiveDurationMs;
}

function triggerScoreFlash(node, state, windowRef = null, options = {}) {
  if (!node || !state) {
    return;
  }

  const flashMode = normalizeFlashMode(options.flashMode);
  const preserveFrame = flashMode === FLASH_MODE_PERMANENT;
  const frameNode = resolveFrameNode(node);
  clearFlashState(node, state, windowRef, { preserveFrame });
  node.classList?.remove?.(SCORE_FLASH_CLASS);
  if (!preserveFrame) {
    frameNode?.classList?.remove?.(SCORE_FRAME_CLASS);
  }

  advanceSequence(node, SCORE_FLASH_SEQUENCE_ATTRIBUTE);
  if (frameNode) {
    advanceSequence(frameNode, SCORE_FRAME_SEQUENCE_ATTRIBUTE);
  }

  node.classList?.add?.(SCORE_FLASH_CLASS);
  if (frameNode) {
    frameNode.classList?.add?.(SCORE_FRAME_CLASS);
    state.flashFrameByScoreNode?.set?.(node, frameNode);
  }
}

function scheduleFlashAfterglow(node, state, windowRef = null, delayMs = 0, options = {}) {
  const normalizedDelayMs = Math.max(0, Number(delayMs) || 0);
  const preserveFrame = options.preserveFrame === true;
  if (!node || !state || normalizedDelayMs <= 0) {
    clearFlashState(node, state, windowRef, { preserveFrame });
    return;
  }

  const setTimer =
    (windowRef && typeof windowRef.setTimeout === "function"
      ? windowRef.setTimeout.bind(windowRef)
      : setTimeout);
  clearFlashTimer(node, state, windowRef);
  const timerHandle = setTimer(() => {
    state.flashTimeoutByNode?.delete?.(node);
    removeFlashClasses(node, state, { preserveFrame });
  }, normalizedDelayMs);
  state.flashTimeoutByNode?.set?.(node, timerHandle);
}

function ensurePersistentFrameClasses(scoreNodes, state) {
  if (!Array.isArray(scoreNodes) || !scoreNodes.length || !state) {
    return;
  }

  scoreNodes.forEach((node) => {
    if (!node) {
      return;
    }
    const frameNode = resolveFrameNode(node);
    if (!frameNode) {
      return;
    }
    frameNode.classList?.add?.(SCORE_FRAME_CLASS);
    state.flashFrameByScoreNode?.set?.(node, frameNode);
  });
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
  const preserveFrame = options.preserveFrame === true;
  scheduleFlashAfterglow(node, state, windowRef, flashAfterglowMs, {
    preserveFrame,
  });
}

export function animateScore(node, options = {}) {
  const state = options.state;
  const fromValue = Number(options.fromValue);
  const toValue = Number(options.toValue);
  const durationMs = Number(options.durationMs) || 1000;
  const flashEnabled = options.flashEnabled !== false;
  const flashMode = normalizeFlashMode(options.flashMode);
  const flashAfterglowMs = Math.max(0, Number(options.flashAfterglowMs) || 0);
  const animeRef = options.animeRef;
  const windowRef = options.windowRef || null;

  if (!node || !state || !Number.isFinite(fromValue) || !Number.isFinite(toValue)) {
    return;
  }

  stopAnimation(node, state, windowRef);
  renderScoreValue(node, state, fromValue);
  state.targetValueByNode.set(node, toValue);
  if (flashEnabled) {
    triggerScoreFlash(node, state, windowRef, { flashMode });
  }

  const effectiveDurationMs = startScoreRafAnimation(node, state, {
    fromValue,
    toValue,
    durationMs,
    flashEnabled,
    flashMode,
    flashAfterglowMs,
    windowRef,
  });

  if (typeof animeRef === "function") {
    let animeInstance = null;
    animeInstance = animeRef({
      targets: { value: fromValue },
      value: toValue,
      duration: effectiveDurationMs,
      easing: "linear",
      complete: () => {
        if (state.activeAnimeByNode.get(node) !== animeInstance) {
          return;
        }
        if (Number(state.renderedValueByNode.get(node)) !== Number(state.targetValueByNode.get(node))) {
          state.activeAnimeByNode.delete(node);
          return;
        }
        completeScoreAnimation(node, state, {
          toValue,
          flashEnabled,
          flashMode,
          flashAfterglowMs,
          windowRef,
        });
      },
    });
    state.activeAnimeByNode.set(node, animeInstance);
    return;
  }
}

export function updateTurnPoints(options = {}) {
  const documentRef = options.documentRef;
  const state = options.state;
  const durationMs = Number(options.durationMs) || 1000;
  const flashEnabled = options.flashEnabled !== false;
  const flashMode = normalizeFlashMode(options.flashMode);
  const flashAfterglowMs = Math.max(0, Number(options.flashAfterglowMs) || 0);
  const animeRef = options.animeRef;
  const windowRef = options.windowRef || null;

  if (!documentRef || !state) {
    return;
  }

  const scoreNodes = collectScoreNodes(documentRef, state);
  const nodeSet = new Set(scoreNodes);

  state.lastValueByNode.forEach((_value, node) => {
    if (nodeSet.has(node)) {
      return;
    }
    stopAnimation(node, state, windowRef);
    state.lastValueByNode.delete(node);
    state.renderedValueByNode.delete(node);
  });

  if (flashEnabled && flashMode === FLASH_MODE_PERMANENT) {
    ensurePersistentFrameClasses(scoreNodes, state);
  }

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
      flashMode,
      flashAfterglowMs,
      animeRef,
      windowRef,
    });
  });
}
