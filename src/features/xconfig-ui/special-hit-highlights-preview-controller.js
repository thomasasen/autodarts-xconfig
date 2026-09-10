import { ensureAnimeLoaded, getAnime } from "../../vendors/index.js";
import {
  applyHitDecoration,
  classifyThrowText,
  clearHitDecoration,
} from "../special-hit-highlights/logic.js";
import {
  SPECIAL_HIT_HIGHLIGHTS_PREVIEW_ANIMATION_STYLE_ATTRIBUTE as PREVIEW_ANIMATION_STYLE_ATTRIBUTE,
  SPECIAL_HIT_HIGHLIGHTS_PREVIEW_COLOR_THEME_ATTRIBUTE as PREVIEW_COLOR_THEME_ATTRIBUTE,
  SPECIAL_HIT_HIGHLIGHTS_PREVIEW_INTERVAL_MS as PREVIEW_INTERVAL_MS,
  SPECIAL_HIT_HIGHLIGHTS_PREVIEW_ROW_SELECTOR as PREVIEW_ROW_SELECTOR,
  SPECIAL_HIT_HIGHLIGHTS_PREVIEW_SCORE_ATTRIBUTE as PREVIEW_SCORE_ATTRIBUTE,
  SPECIAL_HIT_HIGHLIGHTS_PREVIEW_SEGMENT_SELECTOR as PREVIEW_SEGMENT_SELECTOR,
  SPECIAL_HIT_HIGHLIGHTS_PREVIEW_STEP_ATTRIBUTE as PREVIEW_STEP_ATTRIBUTE,
  SPECIAL_HIT_HIGHLIGHTS_PREVIEW_STEPS as PREVIEW_STEPS,
} from "./special-hit-highlights-preview-contract.js";

const FEATURE_KEY = "special-hit-highlights";

function resolveFeatureConfig(rowNode, getFeatures) {
  const feature = (typeof getFeatures === "function" ? getFeatures() : [])
    .find?.((entry) => entry?.featureKey === FEATURE_KEY) || null;
  return {
    colorTheme:
      rowNode?.getAttribute?.(PREVIEW_COLOR_THEME_ATTRIBUTE) ||
      feature?.config?.colorTheme ||
      "kind-signal",
    animationStyle:
      rowNode?.getAttribute?.(PREVIEW_ANIMATION_STYLE_ATTRIBUTE) ||
      feature?.config?.animationStyle ||
      "pop-hit",
  };
}

function createDecorationState() {
  return {
    signatureByRow: new Map(),
    burstKeyBySlot: new Map(),
    activeAnimeByRow: new Map(),
    roleStateByRow: new Map(),
    replayTimersByRow: new Map(),
    triggerResetTimersByRow: new Map(),
  };
}

export function createSpecialHitHighlightsPreviewController(options = {}) {
  const documentRef = options.documentRef || options.windowRef?.document || null;
  const windowRef = options.windowRef || globalThis.window || null;
  const getFeatures = options.getFeatures || (() => []);
  const applyHitDecorationRef = options.applyHitDecorationRef || applyHitDecoration;
  const classifyThrowTextRef = options.classifyThrowTextRef || classifyThrowText;
  const clearHitDecorationRef = options.clearHitDecorationRef || clearHitDecoration;
  const ensureAnimeLoadedRef = options.ensureAnimeLoadedRef || ensureAnimeLoaded;
  const getAnimeRef = options.getAnimeRef || getAnime;
  const decorationState = createDecorationState();
  let intervalHandle = null;
  let activeRow = null;
  let stepIndex = 0;
  let animeRef = getAnimeRef(windowRef);
  let loadGeneration = 0;

  function clearRow(rowNode) {
    if (!rowNode) {
      return;
    }
    clearHitDecorationRef(rowNode, decorationState.signatureByRow, {
      activeAnimeByRow: decorationState.activeAnimeByRow,
      roleStateByRow: decorationState.roleStateByRow,
      replayTimersByRow: decorationState.replayTimersByRow,
      triggerResetTimersByRow: decorationState.triggerResetTimersByRow,
      windowRef,
      animeRef,
    });
    decorationState.burstKeyBySlot.clear();
  }

  function applyStep(nextStepIndex) {
    const rowNode = documentRef?.querySelector?.(PREVIEW_ROW_SELECTOR) || null;
    if (!rowNode) {
      return false;
    }
    if (activeRow && activeRow !== rowNode) {
      clearRow(activeRow);
    }
    activeRow = rowNode;

    const step = PREVIEW_STEPS[nextStepIndex % PREVIEW_STEPS.length] || PREVIEW_STEPS[0];
    const segmentNode = rowNode.querySelector?.(PREVIEW_SEGMENT_SELECTOR) || null;
    const hitMeta = classifyThrowTextRef(step.segment);
    if (!segmentNode || !hitMeta) {
      return false;
    }

    clearRow(rowNode);
    segmentNode.textContent = step.segment;
    rowNode.setAttribute(PREVIEW_SCORE_ATTRIBUTE, step.score);
    rowNode.setAttribute(PREVIEW_STEP_ATTRIBUTE, step.segment);
    applyHitDecorationRef(rowNode, {
      hitMeta,
      featureConfig: resolveFeatureConfig(rowNode, getFeatures),
      ...decorationState,
      rowIndex: 0,
      windowRef,
      animeRef,
      rowText: step.segment,
      modernSurface: true,
    });
    return true;
  }

  function stop() {
    loadGeneration += 1;
    if (intervalHandle !== null && typeof windowRef?.clearInterval === "function") {
      windowRef.clearInterval(intervalHandle);
    }
    intervalHandle = null;
    clearRow(activeRow);
    activeRow = null;
    stepIndex = 0;
  }

  function start() {
    stop();
    if (!documentRef || typeof windowRef?.setInterval !== "function") {
      return;
    }
    if (!applyStep(0)) {
      return;
    }

    const currentGeneration = ++loadGeneration;
    Promise.resolve(ensureAnimeLoadedRef(windowRef)).then((loadedAnime) => {
      if (currentGeneration === loadGeneration && typeof loadedAnime === "function") {
        animeRef = loadedAnime;
      }
    }).catch(() => {});

    intervalHandle = windowRef.setInterval(() => {
      stepIndex = (stepIndex + 1) % PREVIEW_STEPS.length;
      if (!applyStep(stepIndex)) {
        stop();
      }
    }, PREVIEW_INTERVAL_MS);
  }

  return {
    start,
    stop,
  };
}
