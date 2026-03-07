import { updateHitDecorations, clearHitDecoration } from "./logic.js";
import { STYLE_ID, buildStyleText } from "./style.js";

const FEATURE_KEY = "triple-double-bull-hits";
const OBSERVER_KEY = `${FEATURE_KEY}:dom-observer`;

function resolvePollIntervalMs(value) {
  const numeric = Number(value);
  return numeric === 3000 ? 3000 : 0;
}

export function initializeTripleDoubleBullHits(context = {}) {
  const documentRef = context.documentRef || (typeof document !== "undefined" ? document : null);
  const windowRef = context.windowRef || (typeof window !== "undefined" ? window : null);
  const domGuards = context.domGuards;
  const observerRegistry = context.registries?.observers;
  const gameState = context.gameState;
  const x01Rules = context.domain?.x01Rules;
  const config = context.config;
  const schedulerFactory = context.helpers?.createRafScheduler;

  if (!documentRef || !domGuards || !x01Rules || typeof schedulerFactory !== "function") {
    return () => {};
  }

  const featureConfig =
    config && typeof config.getFeatureConfig === "function"
      ? config.getFeatureConfig("tripleDoubleBullHits")
      : {
          highlightTriple: true,
          highlightDouble: true,
          highlightBull: true,
          pollIntervalMs: 3000,
        };
  const pollIntervalMs = resolvePollIntervalMs(featureConfig.pollIntervalMs);
  const trackedNodes = new Set();

  domGuards.ensureStyle(STYLE_ID, buildStyleText());

  const scheduler = schedulerFactory(() => {
    updateHitDecorations({
      documentRef,
      x01Rules,
      featureConfig,
      trackedNodes,
    });
  }, { windowRef });

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
      },
      MutationObserverRef: windowRef?.MutationObserver,
    });
  }

  const unsubscribeGameState =
    gameState && typeof gameState.subscribe === "function"
      ? gameState.subscribe(() => scheduler.schedule())
      : () => {};

  const setIntervalRef =
    (windowRef && typeof windowRef.setInterval === "function"
      ? windowRef.setInterval.bind(windowRef)
      : setInterval);
  const clearIntervalRef =
    (windowRef && typeof windowRef.clearInterval === "function"
      ? windowRef.clearInterval.bind(windowRef)
      : clearInterval);
  const pollHandle =
    pollIntervalMs > 0 ? setIntervalRef(() => scheduler.schedule(), pollIntervalMs) : null;

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

    if (pollHandle) {
      clearIntervalRef(pollHandle);
    }

    trackedNodes.forEach((node) => {
      clearHitDecoration(node);
    });
    trackedNodes.clear();

    domGuards.removeNodeById(STYLE_ID);
  };
}

export const mountTripleDoubleBullHits = initializeTripleDoubleBullHits;
export const initialize = initializeTripleDoubleBullHits;
export const mount = initializeTripleDoubleBullHits;
