import {
  COLOR_THEME_ATTRIBUTE,
  EFFECT_ATTRIBUTE,
  SIZE_ATTRIBUTE,
  WIDTH_PROPERTY,
  updateProgressHost,
} from "../x01-remaining-score-bar/logic.js";

const PREVIEW_EFFECT = "x01-remaining-score-bar-color-cycle";
const PREVIEW_BAR_SELECTOR = "[data-adxconfig-x01-remaining-score-bar-preview-bar='true']";
const PREVIEW_STATE_ATTRIBUTE = "data-adxconfig-x01-remaining-score-bar-preview-score-state";
const PREVIEW_START_SCORE = 501;
const PREVIEW_INTERVAL_MS = 1200;
const PREVIEW_SCORES = Object.freeze([501, 251, 170, 60, 40]);

function readPreviewConfig(hostNode) {
  return {
    colorTheme: hostNode?.getAttribute?.(COLOR_THEME_ATTRIBUTE) || "checkout-focus",
    barSize: hostNode?.getAttribute?.(SIZE_ATTRIBUTE) || "breit",
    effect: hostNode?.getAttribute?.(EFFECT_ATTRIBUTE) || "off",
  };
}

function applyPreviewScore(hostNode, previewConfig, score) {
  const ratio = Math.max(0, Math.min(Number(score) / PREVIEW_START_SCORE, 1));
  updateProgressHost(hostNode, {
    active: true,
    score,
    startScore: PREVIEW_START_SCORE,
    ratio,
    previousRatio: null,
    scoreChanged: false,
    colorTheme: previewConfig.colorTheme,
    barSize: previewConfig.barSize,
    effect: previewConfig.effect,
  });
  hostNode?.style?.setProperty?.(WIDTH_PROPERTY, "100%");
  hostNode?.setAttribute?.(PREVIEW_STATE_ATTRIBUTE, String(score));
}

export function createX01RemainingScoreBarColorPreviewAdapter(options = {}) {
  const windowRef = options.windowRef || globalThis.window || null;

  return {
    matches: (previewEffect) => String(previewEffect || "").trim() === PREVIEW_EFFECT,
    start(context = {}) {
      const hostNode = context.optionNode?.querySelector?.(PREVIEW_BAR_SELECTOR) || null;
      if (!hostNode) {
        return () => {};
      }

      const previewConfig = readPreviewConfig(hostNode);
      let stepIndex = 0;
      let intervalHandle = null;
      applyPreviewScore(hostNode, previewConfig, PREVIEW_SCORES[stepIndex]);

      if (typeof windowRef?.setInterval === "function") {
        intervalHandle = windowRef.setInterval(() => {
          stepIndex = (stepIndex + 1) % PREVIEW_SCORES.length;
          applyPreviewScore(hostNode, previewConfig, PREVIEW_SCORES[stepIndex]);
        }, PREVIEW_INTERVAL_MS);
      }

      return () => {
        if (intervalHandle !== null && typeof windowRef?.clearInterval === "function") {
          windowRef.clearInterval(intervalHandle);
        }
        applyPreviewScore(hostNode, previewConfig, PREVIEW_START_SCORE);
      };
    },
  };
}
