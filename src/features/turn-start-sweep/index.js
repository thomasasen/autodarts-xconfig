import {
  clearTurnStartSweepState,
  findActivePlayerNode,
  runTurnStartSweep,
} from "./logic.js";
import { STYLE_ID, buildStyleText, resolveTurnStartSweepConfig } from "./style.js";
import { createFeatureMountHarness } from "../shared/feature-mount-harness.js";

const FEATURE_KEY = "turn-start-sweep";
const OBSERVER_KEY = `${FEATURE_KEY}:dom-observer`;

export function initializeTurnStartSweep(context = {}) {
  const documentRef = context.documentRef || (typeof document !== "undefined" ? document : null);
  const windowRef = context.windowRef || (typeof window !== "undefined" ? window : null);
  const domGuards = context.domGuards;
  const config = context.config;

  if (!documentRef || !domGuards) {
    return () => {};
  }

  const featureConfig =
    config && typeof config.getFeatureConfig === "function"
      ? config.getFeatureConfig("turnStartSweep")
      : {
          durationMs: 420,
          sweepStyle: "standard",
        };
  const sweepConfig = resolveTurnStartSweepConfig(featureConfig);

  domGuards.ensureStyle(STYLE_ID, buildStyleText(sweepConfig));

  const state = {
    lastActiveNode: null,
    nodes: new Set(),
    timeoutsByNode: new Map(),
  };

  function update() {
    const activeNode = findActivePlayerNode(documentRef);
    if (activeNode === state.lastActiveNode) {
      return;
    }
    state.lastActiveNode = activeNode;

    if (!activeNode) {
      return;
    }

    runTurnStartSweep(activeNode, state, sweepConfig, windowRef);
  }

  const harness = createFeatureMountHarness(context, {
    isSupported: ({ documentRef: nextDocumentRef }) => Boolean(nextDocumentRef && domGuards),
    update,
  });
  if (!harness) {
    return () => {};
  }

  harness.registerObserver({
    key: OBSERVER_KEY,
    callback: (mutations = []) => {
        if (
          Array.isArray(mutations) &&
          mutations.length &&
          mutations.every((mutation) => {
            return (
              mutation?.type === "attributes" &&
              mutation?.attributeName === "class" &&
              state.nodes.has(mutation?.target || null)
            );
          })
        ) {
          return;
        }
        harness.schedule();
      },
    observeOptions: {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: false,
      attributeFilter: ["class"],
    },
  });
  harness.subscribeToGameState();
  harness.schedule();

  return harness.createCleanup(() => {
    clearTurnStartSweepState(state, windowRef);
    domGuards.removeNodeById(STYLE_ID);
  });
}

export const mountTurnStartSweep = initializeTurnStartSweep;
export const initialize = initializeTurnStartSweep;
export const mount = initializeTurnStartSweep;
