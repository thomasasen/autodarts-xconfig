import {
  applySuggestionStyle,
  collectSuggestions,
  isX01Active,
  resetSuggestionNode,
} from "./logic.js";
import { STYLE_ID, buildStyleText } from "./style.js";
import {
  createTurnSurfaceObserveOptions,
  hasRelevantTurnSurfaceMutation,
} from "../shared/turn-surface-adapter.js";

const FEATURE_KEY = "checkout-suggestion-styles";
const OBSERVER_KEY = `${FEATURE_KEY}:dom-observer`;

export function initializeCheckoutSuggestionStyles(context = {}) {
  const documentRef = context.documentRef || (typeof document !== "undefined" ? document : null);
  const windowRef = context.windowRef || (globalThis.window !== undefined ? globalThis.window : null);
  const domGuards = context.domGuards;
  const observerRegistry = context.registries?.observers;
  const gameState = context.gameState;
  const variantRules = context.domain?.variantRules;
  const config = context.config;
  const schedulerFactory = context.helpers?.createRafScheduler;

  if (!documentRef || !domGuards || typeof schedulerFactory !== "function") {
    return () => {};
  }

  const featureConfig =
    config && typeof config.getFeatureConfig === "function"
      ? config.getFeatureConfig("checkoutSuggestionStyles")
      : {
          style: "ribbon",
          labelText: "CHECKOUT",
          colorTheme: "amber",
        };

  domGuards.ensureStyle(STYLE_ID, buildStyleText());

  function update() {
    const nodes = collectSuggestions(documentRef);
    if (!nodes.length) {
      return;
    }

    const active = isX01Active({
      gameState,
      documentRef,
      variantRules,
    });

    nodes.forEach((node) => {
      if (!active) {
        resetSuggestionNode(node);
        return;
      }
      applySuggestionStyle(node, featureConfig);
    });
  }

  const scheduler = schedulerFactory(update, { windowRef });
  const rootNode = documentRef.documentElement || documentRef.body || documentRef;
  if (observerRegistry && typeof observerRegistry.registerMutationObserver === "function") {
    observerRegistry.registerMutationObserver({
      key: OBSERVER_KEY,
      target: rootNode,
      callback: (mutations = []) => {
        if (hasRelevantTurnSurfaceMutation(mutations, {
          extraSelectors: [".suggestion", "#ad-ext-game-variant"],
        })) {
          scheduler.schedule();
        }
      },
      observeOptions: createTurnSurfaceObserveOptions(),
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
      // Fail-soft cleanup.
    }

    if (observerRegistry && typeof observerRegistry.disconnect === "function") {
      observerRegistry.disconnect(OBSERVER_KEY);
    }

    collectSuggestions(documentRef).forEach((node) => {
      resetSuggestionNode(node);
    });
    domGuards.removeNodeById(STYLE_ID);
  };
}

export const mountCheckoutSuggestionStyles = initializeCheckoutSuggestionStyles;
export const initialize = initializeCheckoutSuggestionStyles;
export const mount = initializeCheckoutSuggestionStyles;
