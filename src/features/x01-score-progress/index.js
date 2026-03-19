import { createRafScheduler } from "../../shared/raf-scheduler.js";
import {
  clearAllScoreProgress,
  createScoreProgressState,
  syncScoreProgress,
} from "./logic.js";
import { buildStyleText, STYLE_ID } from "./style.js";

const FEATURE_KEY = "x01-score-progress";
const OBSERVER_KEY = `${FEATURE_KEY}:dom-observer`;

export function mountX01ScoreProgress(context = {}) {
  const documentRef = context.documentRef || (typeof document !== "undefined" ? document : null);
  const windowRef = context.windowRef || (typeof window !== "undefined" ? window : null);
  const domGuards = context.domGuards;
  const observerRegistry = context.registries?.observers;
  const gameState = context.gameState;
  const config = context.config;

  if (!documentRef || !domGuards) {
    return () => {};
  }

  const featureConfig =
    config && typeof config.getFeatureConfig === "function"
      ? config.getFeatureConfig("x01ScoreProgress")
      : {
          designPreset: "signal",
          debug: false,
        };

  domGuards.ensureStyle(STYLE_ID, buildStyleText());

  const featureState = createScoreProgressState();
  const update = () => {
    syncScoreProgress(
      {
        ...context,
        featureConfig,
      },
      featureState
    );
  };

  const scheduler = createRafScheduler(update, { windowRef });
  const rootNode = documentRef.documentElement || documentRef.body || documentRef;

  if (observerRegistry && typeof observerRegistry.registerMutationObserver === "function") {
    observerRegistry.registerMutationObserver({
      key: OBSERVER_KEY,
      target: rootNode,
      callback: () => scheduler.schedule(),
      observeOptions: {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeFilter: [
          "class",
          "selected",
          "aria-selected",
          "data-selected",
          "data-checked",
          "aria-pressed",
          "value",
        ],
      },
      MutationObserverRef: windowRef?.MutationObserver,
    });
  }

  const unsubscribeGameState =
    gameState && typeof gameState.subscribe === "function"
      ? gameState.subscribe(() => scheduler.schedule())
      : () => {};

  scheduler.schedule();

  let cleanedUp = false;

  return function cleanup() {
    if (cleanedUp) {
      return;
    }
    cleanedUp = true;

    scheduler.cancel();

    try {
      unsubscribeGameState();
    } catch (_) {
      // Fail-soft for resilient teardown.
    }

    if (observerRegistry && typeof observerRegistry.disconnect === "function") {
      observerRegistry.disconnect(OBSERVER_KEY);
    }

    clearAllScoreProgress(documentRef);
    domGuards.removeNodeById(STYLE_ID);
  };
}

export const initializeX01ScoreProgress = mountX01ScoreProgress;
export const initialize = mountX01ScoreProgress;
export const mount = mountX01ScoreProgress;
