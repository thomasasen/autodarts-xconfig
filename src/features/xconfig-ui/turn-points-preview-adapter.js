import {
  animateScore as animateTurnPointsScore,
  stopAnimation as stopTurnPointsAnimation,
} from "../turn-points-count/logic.js";
import { ensureOdometerLoaded, getOdometer } from "../../vendors/index.js";
import {
  TURN_POINTS_PREVIEW_SCORE_ATTRIBUTE,
  TURN_POINTS_PREVIEW_SCORE_CLASS,
  TURN_POINTS_PREVIEW_SCORE_SELECTOR,
} from "./turn-points-preview-contract.js";

const PREVIEW_FROM = 501;
const PREVIEW_TO = 441;
const DEFAULT_DURATION_MS = 1600;
const FLASH_SEGMENT_DURATION_MS = 640;
const FLASH_PAUSE_MS = 520;
const FLASH_SEGMENTS = Object.freeze([
  Object.freeze({ fromValue: 501, toValue: 481 }),
  Object.freeze({ fromValue: 481, toValue: 461 }),
  Object.freeze({ fromValue: 461, toValue: 441 }),
]);
function createPreviewAnimationState() {
  return {
    lastValueByNode: new Map(),
    renderedValueByNode: new Map(),
    targetValueByNode: new Map(),
    activeRafByNode: new Map(),
    activeAnimeByNode: new Map(),
    activeCountUpByNode: new Map(),
    flashFrameByScoreNode: new Map(),
    flashRafByNode: new Map(),
    flashTimeoutByNode: new Map(),
    scoreNodeCache: [],
  };
}

function normalizeCountEffect(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "odometer" || normalized === "steps") {
    return normalized;
  }
  return "countup";
}

function normalizeFlashMode(value) {
  return String(value || "").trim().toLowerCase() === "permanent" ? "permanent" : "on-change";
}

function resolveBaseConfig(feature) {
  const config = feature?.config || {};
  return {
    countEffect: normalizeCountEffect(config.countEffect),
    durationMs: Math.max(1, Number(config.durationMs) || DEFAULT_DURATION_MS),
    flashMode: normalizeFlashMode(config.flashMode),
  };
}

function resolvePreviewOptions(context) {
  const settingKey = String(context?.settingKey || "").trim();
  const settingValue = String(context?.settingValue || "").trim();
  const options = resolveBaseConfig(context?.feature);
  options.flashEnabled = settingKey === "flashMode";

  if (settingKey === "countEffect" && settingValue) {
    options.countEffect = normalizeCountEffect(settingValue);
  } else if (settingKey === "durationMs") {
    options.durationMs = Math.max(1, Number(settingValue) || DEFAULT_DURATION_MS);
    options.countEffect = "countup";
  } else if (settingKey === "flashMode" && settingValue) {
    options.flashMode = normalizeFlashMode(settingValue);
    options.countEffect = "countup";
  }

  return options;
}

function createIdleScoreNode(documentRef) {
  const scoreNode = documentRef.createElement("span");
  scoreNode.className = TURN_POINTS_PREVIEW_SCORE_CLASS;
  scoreNode.textContent = String(PREVIEW_FROM);
  scoreNode.setAttribute(TURN_POINTS_PREVIEW_SCORE_ATTRIBUTE, "true");
  return scoreNode;
}

function replaceNode(currentNode, nextNode) {
  if (!currentNode || !nextNode) {
    return;
  }
  if (currentNode.parentNode && typeof currentNode.parentNode.insertBefore === "function") {
    currentNode.parentNode.insertBefore(nextNode, currentNode);
    currentNode.remove?.();
    return;
  }
  currentNode.textContent = String(PREVIEW_FROM);
}

function resetPreviewScoreNode(optionNode, state, windowRef, stopAnimationRef, scoreNode = null) {
  const currentScoreNode =
    scoreNode || optionNode?.querySelector?.(TURN_POINTS_PREVIEW_SCORE_SELECTOR) || null;
  if (currentScoreNode && state) {
    stopAnimationRef(currentScoreNode, state, windowRef, {
      flashAfterglowMs: 0,
      preserveFrame: false,
    });
  }

  const documentRef = optionNode?.ownerDocument || currentScoreNode?.ownerDocument || null;
  const nextScoreNode = documentRef ? createIdleScoreNode(documentRef) : null;
  if (currentScoreNode && nextScoreNode) {
    replaceNode(currentScoreNode, nextScoreNode);
  } else if (currentScoreNode) {
    currentScoreNode.textContent = String(PREVIEW_FROM);
  }
  return nextScoreNode || currentScoreNode;
}

function scheduleTimer(windowRef, timers, callback, delayMs) {
  const setTimer =
    typeof windowRef?.setTimeout === "function"
      ? windowRef.setTimeout.bind(windowRef)
      : setTimeout;
  const handle = setTimer(() => {
    timers.delete(handle);
    callback();
  }, delayMs);
  timers.add(handle);
  return handle;
}

function clearTimers(windowRef, timers) {
  const clearTimer =
    typeof windowRef?.clearTimeout === "function"
      ? windowRef.clearTimeout.bind(windowRef)
      : clearTimeout;
  timers.forEach((handle) => clearTimer(handle));
  timers.clear();
}

function requestFrame(windowRef, callback) {
  const requestRaf =
    typeof windowRef?.requestAnimationFrame === "function"
      ? windowRef.requestAnimationFrame.bind(windowRef)
      : requestAnimationFrame;
  return requestRaf(callback);
}

function easeOutCubicProgress(progress) {
  const normalizedProgress = Math.max(0, Math.min(1, Number(progress) || 0));
  return 1 - Math.pow(1 - normalizedProgress, 3);
}

function renderOdometerValue(odometerPlugin, scoreNode, value) {
  if (odometerPlugin && scoreNode && typeof odometerPlugin.render === "function") {
    odometerPlugin.render(scoreNode, String(Math.round(Number(value) || 0)));
  }
}

function animatePreviewOdometerScore(scoreNode, state, options, windowRef, OdometerRef) {
  if (!scoreNode || !state || typeof OdometerRef !== "function") {
    return;
  }

  const durationMs = Math.max(1, Number(options.durationMs) || DEFAULT_DURATION_MS);
  const odometerPlugin = new OdometerRef({
    duration: durationMs / 1000,
    lastDigitDelay: 0,
  });
  let startTime = null;

  renderOdometerValue(odometerPlugin, scoreNode, PREVIEW_FROM);
  state.renderedValueByNode.set(scoreNode, PREVIEW_FROM);
  state.targetValueByNode.set(scoreNode, PREVIEW_TO);

  const tick = (timestamp) => {
    const now = Number.isFinite(timestamp) ? timestamp : Date.now();
    if (startTime === null) {
      startTime = now;
    }

    const progress = Math.max(0, Math.min(1, (now - startTime) / durationMs));
    const nextValue =
      PREVIEW_FROM + (PREVIEW_TO - PREVIEW_FROM) * easeOutCubicProgress(progress);
    const roundedValue = Math.round(nextValue);
    renderOdometerValue(odometerPlugin, scoreNode, roundedValue);
    state.renderedValueByNode.set(scoreNode, roundedValue);

    if (progress >= 1) {
      state.activeRafByNode.delete(scoreNode);
      state.lastValueByNode.set(scoreNode, PREVIEW_TO);
      state.renderedValueByNode.set(scoreNode, PREVIEW_TO);
      renderOdometerValue(odometerPlugin, scoreNode, PREVIEW_TO);
      return;
    }

    const handle = requestFrame(windowRef, tick);
    state.activeRafByNode.set(scoreNode, handle);
  };

  const handle = requestFrame(windowRef, tick);
  state.activeRafByNode.set(scoreNode, handle);
}

function animatePreviewScore(
  scoreNode,
  state,
  options,
  windowRef,
  odometerPluginRef,
  animateScoreRef,
) {
  animateScoreRef(scoreNode, {
    state,
    fromValue: PREVIEW_FROM,
    toValue: PREVIEW_TO,
    durationMs: options.durationMs,
    flashEnabled: false,
    flashMode: options.flashMode,
    flashAfterglowMs: 0,
    countEffect: options.countEffect,
    odometerPluginRef,
    windowRef,
  });
}

function animateFlashSegment(
  scoreNode,
  state,
  options,
  windowRef,
  segment,
  animateScoreRef,
) {
  animateScoreRef(scoreNode, {
    state,
    fromValue: segment.fromValue,
    toValue: segment.toValue,
    durationMs: FLASH_SEGMENT_DURATION_MS,
    flashEnabled: true,
    flashMode: options.flashMode,
    flashAfterglowMs: options.flashMode === "permanent" ? 0 : FLASH_PAUSE_MS / 2,
    countEffect: "countup",
    windowRef,
  });
}

export function createTurnPointsCountPreviewAdapter(options = {}) {
  const windowRef = options.windowRef || (typeof window !== "undefined" ? window : null);
  const loadOdometer =
    typeof options.ensureOdometerLoaded === "function"
      ? options.ensureOdometerLoaded
      : ensureOdometerLoaded;
  const readOdometer =
    typeof options.getOdometer === "function" ? options.getOdometer : getOdometer;
  const animateScoreRef =
    typeof options.animateScore === "function" ? options.animateScore : animateTurnPointsScore;
  const stopAnimationRef =
    typeof options.stopAnimation === "function" ? options.stopAnimation : stopTurnPointsAnimation;

  function startWithOdometer(run) {
    const loadedOdometer = readOdometer(windowRef);
    if (loadedOdometer) {
      run(loadedOdometer);
      return;
    }

    loadOdometer(windowRef).then((nextOdometer) => {
      if (nextOdometer) {
        run(nextOdometer);
      }
    });
  }

  function start(context = {}) {
    const optionNode = context.optionNode || null;
    const previewOptions = resolvePreviewOptions(context);
    const state = createPreviewAnimationState();
    const timers = new Set();
    let cancelled = false;
    const scoreNode = resetPreviewScoreNode(optionNode, state, windowRef, stopAnimationRef);

    function run(odometerPluginRef = null) {
      if (cancelled || !scoreNode || scoreNode.isConnected === false) {
        return;
      }

      if (previewOptions.flashEnabled) {
        let delayMs = 0;
        FLASH_SEGMENTS.forEach((segment) => {
          scheduleTimer(windowRef, timers, () => {
            if (!cancelled && scoreNode.isConnected !== false) {
              animateFlashSegment(
                scoreNode,
                state,
                previewOptions,
                windowRef,
                segment,
                animateScoreRef,
              );
            }
          }, delayMs);
          delayMs += FLASH_SEGMENT_DURATION_MS + FLASH_PAUSE_MS;
        });
        return;
      }

      if (previewOptions.countEffect === "odometer" && odometerPluginRef) {
        animatePreviewOdometerScore(
          scoreNode,
          state,
          previewOptions,
          windowRef,
          odometerPluginRef,
        );
        return;
      }

      animatePreviewScore(
        scoreNode,
        state,
        previewOptions,
        windowRef,
        odometerPluginRef,
        animateScoreRef,
      );
    }

    if (previewOptions.countEffect === "odometer") {
      startWithOdometer(run);
    } else {
      run(null);
    }

    return () => {
      cancelled = true;
      clearTimers(windowRef, timers);
      resetPreviewScoreNode(optionNode, state, windowRef, stopAnimationRef, scoreNode);
    };
  }

  return {
    prefix: "turn-points-count-",
    matches: (previewEffect) => String(previewEffect || "").startsWith("turn-points-count-"),
    start,
  };
}
