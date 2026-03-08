import {
  clearTurnStartSweepState,
  findActivePlayerNode,
  runTurnStartSweep,
} from "./logic.js";
import { STYLE_ID, buildStyleText, resolveTurnStartSweepConfig } from "./style.js";

const FEATURE_KEY = "turn-start-sweep";
const OBSERVER_KEY = `${FEATURE_KEY}:dom-observer`;

export function initializeTurnStartSweep(context = {}) {
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

  const scheduler = schedulerFactory(update, { windowRef });
  const rootNode = documentRef.documentElement || documentRef.body || documentRef;
  if (observerRegistry && typeof observerRegistry.registerMutationObserver === "function") {
    observerRegistry.registerMutationObserver({
      key: OBSERVER_KEY,
      target: rootNode,
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
        scheduler.schedule();
      },
      observeOptions: {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: false,
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
      // Keep cleanup resilient.
    }

    if (observerRegistry && typeof observerRegistry.disconnect === "function") {
      observerRegistry.disconnect(OBSERVER_KEY);
    }

    clearTurnStartSweepState(state, windowRef);
    domGuards.removeNodeById(STYLE_ID);
  };
}

export const mountTurnStartSweep = initializeTurnStartSweep;
export const initialize = initializeTurnStartSweep;
export const mount = initializeTurnStartSweep;
