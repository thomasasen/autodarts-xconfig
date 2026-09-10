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
  const featureDebug = context.featureDebug || null;

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

  let lastDebugSignature = "";

  function emitDebugState(playerSurfaceSnapshot, allScoreNodes, scoreNodes, shouldHighlight) {
    if (!featureDebug?.enabled || typeof featureDebug.log !== "function") {
      return;
    }

    const scoreText = scoreNodes
      .map((node) => String(node?.textContent || "").trim())
      .join("|");
    const signature = [
      playerSurfaceSnapshot?.source || "none",
      allScoreNodes.length,
      scoreText,
      shouldHighlight ? 1 : 0,
      featureConfig.triggerSource,
    ].join("::");
    if (signature === lastDebugSignature) {
      return;
    }

    lastDebugSignature = signature;
    featureDebug.log(
      `state surface="${playerSurfaceSnapshot?.source || "none"}" scores=${allScoreNodes.length} activeScore="${scoreText || "-"}" highlight=${shouldHighlight ? "yes" : "no"} trigger="${featureConfig.triggerSource}"`
    );
  }

  function update() {
    const playerSurfaceSnapshot = getX01PlayerSurfaceSnapshot(documentRef, {
      includeModern: true,
      windowRef,
    });
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

    emitDebugState(playerSurfaceSnapshot, allScoreNodes, scoreNodes, shouldHighlight);

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
    includeModern: true,
    windowRef,
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

    const playerSurfaceSnapshot = getX01PlayerSurfaceSnapshot(documentRef, {
      includeModern: true,
      windowRef,
    });
    clearHighlightState(getAllScoreNodes(documentRef, { playerSurfaceSnapshot }));
    domGuards.removeNodeById(STYLE_ID);
  };
}

export const initializeCheckoutScoreHighlight = mountCheckoutScoreHighlight;
export const initialize = mountCheckoutScoreHighlight;
export const mount = mountCheckoutScoreHighlight;
