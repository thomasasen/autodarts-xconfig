import { createRafScheduler } from "../../shared/raf-scheduler.js";
import {
  createX01PlayerSurfaceObserveOptions,
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
const FALLBACK_OBSERVE_OPTIONS = {
  childList: true,
  subtree: true,
  characterData: true,
  attributes: true,
  attributeFilter: ["class"],
};

function containsNode(rootNode, node) {
  return Boolean(rootNode && node && (rootNode === node || rootNode.contains?.(node)));
}

function mutationRecordsTouchRoot(records, rootNode) {
  if (!Array.isArray(records) || records.length === 0) {
    return true;
  }

  return records.some((record) => {
    return (
      containsNode(rootNode, record?.target) ||
      Array.from(record?.addedNodes || []).some((node) => containsNode(rootNode, node)) ||
      Array.from(record?.removedNodes || []).some((node) => containsNode(rootNode, node))
    );
  });
}

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

  const observerPlayerSurfaceSnapshot = getX01PlayerSurfaceSnapshot(documentRef);
  const playerSurfaceRoot = observerPlayerSurfaceSnapshot.playerDisplayRoot;
  const rootNode = playerSurfaceRoot || documentRef.documentElement || documentRef.body || documentRef;
  if (observerRegistry && typeof observerRegistry.registerMutationObserver === "function") {
    observerRegistry.registerMutationObserver({
      key: OBSERVER_KEY,
      target: rootNode,
      callback: (records) => {
        if (playerSurfaceRoot && !mutationRecordsTouchRoot(records, playerSurfaceRoot)) {
          return;
        }
        scheduler.schedule();
      },
      observeOptions: playerSurfaceRoot
        ? createX01PlayerSurfaceObserveOptions()
        : FALLBACK_OBSERVE_OPTIONS,
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

    clearHighlightState(getAllScoreNodes(documentRef));
    domGuards.removeNodeById(STYLE_ID);
  };
}

export const initializeCheckoutScoreHighlight = mountCheckoutScoreHighlight;
export const initialize = mountCheckoutScoreHighlight;
export const mount = mountCheckoutScoreHighlight;
