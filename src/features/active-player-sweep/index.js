import {
  clearActivePlayerSweepState,
  findActivePlayerNode,
  runActivePlayerSweep,
} from "./logic.js";
import { STYLE_ID, buildStyleText, resolveActivePlayerSweepConfig } from "./style.js";
import { createFeatureMountHarness } from "../shared/feature-mount-harness.js";
import { createX01PlayerSurfaceObserverController } from "../shared/x01-player-surface-adapter.js";

const FEATURE_KEY = "active-player-sweep";
const OBSERVER_KEY = `${FEATURE_KEY}:dom-observer`;

export function initializeActivePlayerSweep(context = {}) {
  const documentRef = context.documentRef || (typeof document !== "undefined" ? document : null);
  const windowRef = context.windowRef || (globalThis.window !== undefined ? globalThis.window : null);
  const domGuards = context.domGuards;
  const config = context.config;

  if (!documentRef || !domGuards) {
    return () => {};
  }

  const featureConfig =
    config && typeof config.getFeatureConfig === "function"
      ? config.getFeatureConfig("activePlayerSweep")
      : {
          durationMs: 420,
          sweepStyle: "standard",
        };
  const sweepConfig = resolveActivePlayerSweepConfig(featureConfig);

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

    runActivePlayerSweep(activeNode, state, sweepConfig, windowRef);
  }

  const harness = createFeatureMountHarness(context, {
    isSupported: ({ documentRef: nextDocumentRef }) => Boolean(nextDocumentRef && domGuards),
    update,
  });
  if (!harness) {
    return () => {};
  }

  harness.addCleanup(createX01PlayerSurfaceObserverController({
    documentRef,
    observerRegistry: context.registries?.observers,
    MutationObserverRef: windowRef?.MutationObserver,
    keyPrefix: OBSERVER_KEY,
    onSurfaceMutation: (mutations = []) => {
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
    onSurfaceChange: () => harness.schedule(),
  }));
  harness.subscribeToGameState();
  harness.schedule();

  return harness.createCleanup(() => {
    clearActivePlayerSweepState(state, windowRef);
    domGuards.removeNodeById(STYLE_ID);
  });
}

export const mountActivePlayerSweep = initializeActivePlayerSweep;
export const initialize = initializeActivePlayerSweep;
export const mount = initializeActivePlayerSweep;
