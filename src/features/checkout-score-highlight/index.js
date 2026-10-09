import { createTurnScopedScheduler } from "../shared/turn-lifecycle.js";
import { createX01ReadContext, readX01MatchSurface } from "../x01-checkout-context.js";
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
  resolveCheckoutScoreTruth,
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

  function emitDebugState(
    playerSurfaceSnapshot,
    allScoreNodes,
    scoreNodes,
    shouldHighlight,
    x01Truth
  ) {
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
      x01Truth?.coherence || "none",
      x01Truth?.matchId || "none",
      x01Truth?.diagnostics?.reason || "none",
    ].join("::");
    if (signature === lastDebugSignature) {
      return;
    }

    lastDebugSignature = signature;
    featureDebug.log(
      `state surface="${playerSurfaceSnapshot?.source || "none"}" scores=${allScoreNodes.length} activeScore="${scoreText || "-"}" highlight=${shouldHighlight ? "yes" : "no"} trigger="${featureConfig.triggerSource}" coherence="${x01Truth?.coherence || "none"}" match="${x01Truth?.matchId || "-"}" routeMatch="${x01Truth?.diagnostics?.routeMatchId || "-"}" snapshotMatch="${x01Truth?.diagnostics?.snapshotMatchIds?.join(",") || "-"}" domScore="${x01Truth?.diagnostics?.domScore ?? "-"}" stateScore="${x01Truth?.diagnostics?.stateScore ?? "-"}" domOut="${x01Truth?.diagnostics?.domOutMode || "-"}" stateOut="${x01Truth?.diagnostics?.stateOutMode || "-"}" throws="${x01Truth?.diagnostics?.domThrowCount ?? "-"}/${x01Truth?.diagnostics?.stateThrowCount ?? "-"}" source="${x01Truth?.source || "none"}" arbitration="${x01Truth?.diagnostics?.reason || "-"}"`
    );
  }

  function update() {
    const readContext = createX01ReadContext({
      documentRef,
      windowRef,
      gameState,
      variantRules: context.domain?.variantRules,
      x01Rules: context.domain?.x01Rules,
    });
    const x01Truth = resolveCheckoutScoreTruth(readContext);
    const playerSurfaceSnapshot = getX01PlayerSurfaceSnapshot(documentRef, {
      includeModern: true,
      windowRef,
      modernPlayers: readX01MatchSurface(readContext).players,
    });
    const allScoreNodes = getAllScoreNodes(documentRef, { playerSurfaceSnapshot });
    const scoreNodes = getScoreNodes(documentRef, gameState, {
      playerSurfaceSnapshot,
      activePlayerIndex: x01Truth.activePlayerIndex,
    });
    const shouldHighlight = computeShouldHighlight({
      documentRef,
      windowRef,
      gameState,
      variantRules: context.domain?.variantRules,
      x01Rules: context.domain?.x01Rules,
      x01Truth,
      triggerSource: featureConfig.triggerSource,
    });

    emitDebugState(
      playerSurfaceSnapshot,
      allScoreNodes,
      scoreNodes,
      shouldHighlight,
      x01Truth
    );

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

  const scheduler = createTurnScopedScheduler(context, update, { windowRef, resetTurn() {
    const surface = getX01PlayerSurfaceSnapshot(documentRef, { includeModern: true, windowRef });
    clearHighlightState(getAllScoreNodes(documentRef, { playerSurfaceSnapshot: surface }));
    lastDebugSignature = "";
  } });

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
