import { updateAverageTrendArrows } from "./logic.js";
import { ARROW_CLASS, STYLE_ID, buildStyleText } from "./style.js";
import { createManagedNodeMatcher, hasExternalDomMutation } from "../../core/dom-mutation-filter.js";
import { createFeatureMountHarness } from "../shared/feature-mount-harness.js";

const FEATURE_KEY = "average-trend-arrow";
const OBSERVER_KEY = `${FEATURE_KEY}:dom-observer`;

export function initializeAverageTrendArrow(context = {}) {
  const documentRef = context.documentRef || (typeof document !== "undefined" ? document : null);
  const windowRef = context.windowRef || (globalThis.window !== undefined ? globalThis.window : null);
  const domGuards = context.domGuards;
  const config = context.config;

  if (!documentRef || !domGuards) {
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

  const harness = createFeatureMountHarness(context, {
    isSupported: ({ documentRef: nextDocumentRef }) => Boolean(nextDocumentRef && domGuards),
    update: () => {
      updateAverageTrendArrows({
        documentRef,
        lastValueByNode,
        arrowByAverageNode,
        timeoutByArrow,
        arrowNodes,
        durationMs: featureConfig.durationMs,
      });
    },
  });
  if (!harness) {
    return () => {};
  }

  const isManagedNode = createManagedNodeMatcher({
    classNames: [ARROW_CLASS],
  });

  harness.registerObserver({
    key: OBSERVER_KEY,
    callback: (mutations = []) => {
      if (!hasExternalDomMutation(mutations, isManagedNode)) {
        return;
      }
      harness.schedule();
    },
    observeOptions: {
      childList: true,
      subtree: true,
      characterData: true,
    },
  });
  harness.subscribeToGameState();
  harness.schedule();

  return harness.createCleanup(() => {
    const clearTimeoutRef =
      windowRef && typeof windowRef.clearTimeout === "function"
        ? windowRef.clearTimeout.bind(windowRef)
        : clearTimeout;
    arrowNodes.forEach((arrowNode) => {
      const timeout = timeoutByArrow.get(arrowNode);
      if (timeout) {
        clearTimeoutRef(timeout);
      }
      if (arrowNode && typeof arrowNode.remove === "function") {
        arrowNode.remove();
      }
    });
    arrowNodes.clear();

    domGuards.removeNodeById(STYLE_ID);
  });
}

export const mountAverageTrendArrow = initializeAverageTrendArrow;
export const initialize = initializeAverageTrendArrow;
export const mount = initializeAverageTrendArrow;
