import { createRafScheduler } from "../../shared/raf-scheduler.js";
import {
  applyHighlightState,
  clearHighlightState,
  computeShouldHighlight,
  getScoreNodes,
} from "./logic.js";
import { STYLE_ID, buildStyleText } from "./style.js";

const FEATURE_KEY = "checkout-score-pulse";
const OBSERVER_KEY = `${FEATURE_KEY}:dom-observer`;

export function mountCheckoutScorePulse(context = {}) {
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
      ? config.getFeatureConfig("checkoutScorePulse")
      : {
          effect: "scale",
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
    const scoreNodes = getScoreNodes(documentRef);
    const shouldHighlight = computeShouldHighlight({
      documentRef,
      gameState,
      variantRules: context.domain?.variantRules,
      x01Rules: context.domain?.x01Rules,
      triggerSource: featureConfig.triggerSource,
    });

    applyHighlightState(scoreNodes, {
      shouldHighlight,
      effect: featureConfig.effect,
    });
  }

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
        attributeFilter: ["class"],
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
      // Fail-soft for resilience during teardown.
    }

    if (observerRegistry && typeof observerRegistry.disconnect === "function") {
      observerRegistry.disconnect(OBSERVER_KEY);
    }

    clearHighlightState(getScoreNodes(documentRef));
    domGuards.removeNodeById(STYLE_ID);
  };
}
