import {
  COLOR_THEME_ATTRIBUTE,
  EFFECT_ATTRIBUTE,
  SIZE_ATTRIBUTE,
  updateProgressHost,
} from "../x01-remaining-score-bar/logic.js";

const PREVIEW_BAR_SELECTOR = "[data-adxconfig-x01-remaining-score-bar-preview-loop]";
const PREVIEW_SCORE_SELECTOR = "[data-adxconfig-x01-remaining-score-bar-preview-score='true']";
const PREVIEW_ROUTE_SELECTOR = "[data-adxconfig-x01-remaining-score-bar-preview-route='true']";
const PREVIEW_START_SCORE = 501;
const PREVIEW_INTERVAL_MS = 2000;
const MAIN_PREVIEW_ROUTE_LABEL = "100%  75%  45%  20%";
const MAIN_PREVIEW_STEPS = Object.freeze([
  Object.freeze({ percent: 100, label: "100%", previousPercent: null, scoreChanged: false }),
  Object.freeze({ percent: 75, label: "75%", previousPercent: 100, scoreChanged: true }),
  Object.freeze({ percent: 45, label: "45%", previousPercent: 75, scoreChanged: true }),
  Object.freeze({ percent: 20, label: "20%", previousPercent: 45, scoreChanged: true }),
]);
const GHOST_TRAIL_PREVIEW_STEPS = Object.freeze([
  Object.freeze({ percent: 80, label: "80%", previousPercent: null, scoreChanged: false }),
  Object.freeze({ percent: 15, label: "15%", previousPercent: 80, scoreChanged: true }),
]);
const PREVIEW_LOOPS = Object.freeze({
  main: MAIN_PREVIEW_STEPS,
  "previous-score-trail-drop": GHOST_TRAIL_PREVIEW_STEPS,
});

function getDocumentRef(documentRef, windowRef) {
  return documentRef || windowRef?.document || null;
}

function readPreviewConfig(hostNode) {
  return {
    colorTheme: hostNode?.getAttribute?.(COLOR_THEME_ATTRIBUTE) || "checkout-focus",
    barSize: hostNode?.getAttribute?.(SIZE_ATTRIBUTE) || "standard",
    effect: hostNode?.getAttribute?.(EFFECT_ATTRIBUTE) || "bar-pulse",
  };
}

function updateText(node, value) {
  if (node && node.textContent !== value) {
    node.textContent = value;
  }
}

function getPreviewLoopName(hostNode) {
  const loopName = String(
    hostNode?.getAttribute?.("data-adxconfig-x01-remaining-score-bar-preview-loop") || ""
  ).trim();
  return Object.hasOwn(PREVIEW_LOOPS, loopName) ? loopName : "main";
}

function applyPreviewStepToHost(documentRef, hostNode, tickIndex) {
  const loopName = getPreviewLoopName(hostNode);
  const steps = PREVIEW_LOOPS[loopName] || MAIN_PREVIEW_STEPS;
  const step = steps[tickIndex % steps.length] || steps[0];
  const percent = Number.isFinite(step.percent) ? Number(step.percent) : 100;
  const previousPercent = Number.isFinite(step.previousPercent) ? Number(step.previousPercent) : null;
  const ratio = Math.max(0, Math.min(percent / 100, 1));
  const previousRatio =
    previousPercent === null ? null : Math.max(0, Math.min(previousPercent / 100, 1));
  const displayScore = Math.round(PREVIEW_START_SCORE * ratio);

  if (loopName === "main") {
    updateText(documentRef.querySelector?.(PREVIEW_SCORE_SELECTOR) || null, step.label);
    updateText(documentRef.querySelector?.(PREVIEW_ROUTE_SELECTOR) || null, MAIN_PREVIEW_ROUTE_LABEL);
  }

  const previewConfig = readPreviewConfig(hostNode);
  updateProgressHost(hostNode, {
    active: true,
    score: displayScore,
    ratio,
    previousRatio,
    scoreChanged: step.scoreChanged === true,
    colorTheme: previewConfig.colorTheme,
    barSize: previewConfig.barSize,
    effect: previewConfig.effect,
  });
}

function applyPreviewStep(documentRef, tickIndex = 0) {
  const hostNodes = Array.from(documentRef?.querySelectorAll?.(PREVIEW_BAR_SELECTOR) || []);
  if (hostNodes.length === 0) {
    return false;
  }

  hostNodes.forEach((hostNode) => applyPreviewStepToHost(documentRef, hostNode, tickIndex));
  return true;
}

export function createX01RemainingScoreBarPreviewController(options = {}) {
  const documentRef = getDocumentRef(options.documentRef, options.windowRef);
  const windowRef = options.windowRef || globalThis.window || null;
  let intervalHandle = null;
  let tickIndex = 0;

  function stop() {
    if (intervalHandle !== null && typeof windowRef?.clearInterval === "function") {
      windowRef.clearInterval(intervalHandle);
    }
    intervalHandle = null;
    tickIndex = 0;
  }

  function start() {
    stop();
    if (!documentRef || typeof windowRef?.setInterval !== "function") {
      return;
    }

    if (!applyPreviewStep(documentRef, 0)) {
      return;
    }

    intervalHandle = windowRef.setInterval(() => {
      tickIndex += 1;
      if (!applyPreviewStep(documentRef, tickIndex)) {
        stop();
      }
    }, PREVIEW_INTERVAL_MS);
  }

  return {
    start,
    stop,
  };
}
