import { updateAverageTrendArrows } from "./logic.js";
import { ARROW_CLASS, STYLE_ID, buildStyleText } from "./style.js";
import { createManagedNodeMatcher, hasExternalDomMutation } from "../../core/dom-mutation-filter.js";

const FEATURE_KEY = "average-trend-arrow";
const OBSERVER_KEY = `${FEATURE_KEY}:dom-observer`;

export function initializeAverageTrendArrow(context = {}) {
  const documentRef = context.documentRef || (typeof document !== "undefined" ? document : null);
  const windowRef = context.windowRef || (typeof window !== "undefined" ? window : null);
  const domGuards = context.domGuards;
  const observerRegistry = context.registries?.observers;
  const gameState = context.gameState;
  const config = context.config;
  const schedulerFactory = context.helpers?.createRafScheduler;

  if (!documentRef || !domGuards || typeof schedulerFactory !== "function") {
    return () => {};
  }

  const featureConfig =
    config && typeof config.getFeatureConfig === "function"
      ? config.getFeatureConfig("averageTrendArrow")
      : {
          durationMs: 320,
          size: "standard",
        };

  const lastValueByNode = new WeakMap();
  const arrowByAverageNode = new WeakMap();
  const timeoutByArrow = new WeakMap();
  const arrowNodes = new Set();

  domGuards.ensureStyle(
    STYLE_ID,
    buildStyleText({
      durationMs: featureConfig.durationMs,
      size: featureConfig.size,
    })
  );

  const scheduler = schedulerFactory(() => {
    updateAverageTrendArrows({
      documentRef,
      lastValueByNode,
      arrowByAverageNode,
      timeoutByArrow,
      arrowNodes,
      durationMs: featureConfig.durationMs,
    });
  }, { windowRef });
  const isManagedNode = createManagedNodeMatcher({
    classNames: [ARROW_CLASS],
  });

  const rootNode = documentRef.documentElement || documentRef.body || documentRef;
  if (observerRegistry && typeof observerRegistry.registerMutationObserver === "function") {
    observerRegistry.registerMutationObserver({
      key: OBSERVER_KEY,
      target: rootNode,
      callback: (mutations = []) => {
        if (!hasExternalDomMutation(mutations, isManagedNode)) {
          return;
        }
        scheduler.schedule();
      },
      observeOptions: {
        childList: true,
        subtree: true,
        characterData: true,
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
      // Fail-soft cleanup.
    }

    if (observerRegistry && typeof observerRegistry.disconnect === "function") {
      observerRegistry.disconnect(OBSERVER_KEY);
    }

    const clearTimeoutRef =
      windowRef && typeof windowRef.clearTimeout === "function"
        ? windowRef.clearTimeout.bind(windowRef)
        : clearTimeout;
    arrowNodes.forEach((arrowNode) => {
      const timeout = timeoutByArrow.get(arrowNode);
      if (timeout) {
        clearTimeoutRef(timeout);
      }
      if (arrowNode && arrowNode.parentNode && typeof arrowNode.parentNode.removeChild === "function") {
        arrowNode.parentNode.removeChild(arrowNode);
      }
    });
    arrowNodes.clear();

    domGuards.removeNodeById(STYLE_ID);
  };
}

export const mountAverageTrendArrow = initializeAverageTrendArrow;
export const initialize = initializeAverageTrendArrow;
export const mount = initializeAverageTrendArrow;
