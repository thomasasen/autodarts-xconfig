import { createRafScheduler } from "../../shared/raf-scheduler.js";
import {
  createX01PlayerSurfaceObserverController,
  getX01PlayerSurfaceSnapshot,
} from "../shared/x01-player-surface-adapter.js";
import {
  applyHighlightState,
  clearHighlightState,
  computeShouldHighlight,
  getAllScoreNodes,
  getScoreNodes,
} from "./logic.js";
import { STYLE_ID, buildStyleText } from "./style.js";

const FEATURE_KEY = "checkout-score-highlight";
const OBSERVER_KEY = `${FEATURE_KEY}:dom-observer`;

export function mountCheckoutScoreHighlight(context = {}) {
  const documentRef = context.documentRef || (typeof document !== "undefined" ? document : null);
  const windowRef = context.windowRef || (globalThis.window !== undefined ? globalThis.window : null);
  const domGuards = context.domGuards;
  const observerRegistry = context.registries?.observers;
  const gameState = context.gameState;
  const config = context.config;

  if (!documentRef || !domGuards) {
    return () => {};
  }

  const featureConfig =
    config && typeof config.getFeatureConfig === "function"
      ? config.getFeatureConfig("checkoutScoreHighlight")
      : {
          effect: "grow-only",
          colorTheme: "159, 219, 88",
          intensity: "standard",
          triggerSource: "suggestion-first",
        };

  domGuards.ensureStyle(
    STYLE_ID,
    buildStyleText({
      colorTheme: featureConfig.colorTheme,
      intensity: featureConfig.intensity,
    })
  );

  function update() {
    const playerSurfaceSnapshot = getX01PlayerSurfaceSnapshot(documentRef);
    const allScoreNodes = getAllScoreNodes(documentRef, { playerSurfaceSnapshot });
    const scoreNodes = getScoreNodes(documentRef, gameState, { playerSurfaceSnapshot });
    const shouldHighlight = computeShouldHighlight({
      documentRef,
      windowRef,
      gameState,
      variantRules: context.domain?.variantRules,
      x01Rules: context.domain?.x01Rules,
      triggerSource: featureConfig.triggerSource,
    });

    if (!shouldHighlight) {
      clearHighlightState(allScoreNodes);
      return;
    }

    clearHighlightState(allScoreNodes.filter((node) => !scoreNodes.includes(node)));
    applyHighlightState(scoreNodes, {
      shouldHighlight: true,
      effect: featureConfig.effect,
    });
  }

  const scheduler = createRafScheduler(update, { windowRef });

  const cleanupSurfaceObserver = createX01PlayerSurfaceObserverController({
    documentRef,
    observerRegistry,
    MutationObserverRef: windowRef?.MutationObserver,
    keyPrefix: OBSERVER_KEY,
    onSurfaceMutation: () => scheduler.schedule(),
    onSurfaceChange: () => scheduler.schedule(),
  });

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
      // Fail-soft for resilience during teardown.
    }

    cleanupSurfaceObserver();

    clearHighlightState(getAllScoreNodes(documentRef));
    domGuards.removeNodeById(STYLE_ID);
  };
}

export const initializeCheckoutScoreHighlight = mountCheckoutScoreHighlight;
export const initialize = mountCheckoutScoreHighlight;
export const mount = mountCheckoutScoreHighlight;
