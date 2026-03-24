import {
  clearOverlay,
  findBoard,
  renderCheckoutTargets,
} from "./logic.js";
import { OVERLAY_ID, STYLE_ID, buildStyleText, resolveBoardTargetVisualConfig } from "./style.js";
import { createManagedNodeMatcher, hasExternalDomMutation } from "../../core/dom-mutation-filter.js";
import {
  collectVisibleCheckoutRoute,
  getCheckoutFinishSegmentFromRoute,
  mapRouteSegmentsToBoardTargets,
} from "../x01-checkout-route.js";

const FEATURE_KEY = "checkout-board-targets";
const OBSERVER_KEY = `${FEATURE_KEY}:dom-observer`;

function isX01Active({ gameState, documentRef, variantRules }) {
  if (gameState && typeof gameState.isX01Variant === "function") {
    return gameState.isX01Variant({
      allowMissing: false,
      allowEmpty: false,
      allowNumeric: true,
    });
  }

  if (!documentRef || typeof documentRef.getElementById !== "function") {
    return false;
  }
  if (!variantRules || typeof variantRules.isX01VariantText !== "function") {
    return false;
  }

  const variantNode = documentRef.getElementById("ad-ext-game-variant");
  return variantRules.isX01VariantText(variantNode?.textContent || "", {
    allowMissing: false,
    allowEmpty: false,
    allowNumeric: true,
  });
}

export function initializeCheckoutBoardTargets(context = {}) {
  const documentRef = context.documentRef || (typeof document !== "undefined" ? document : null);
  const windowRef = context.windowRef || (typeof window !== "undefined" ? window : null);
  const domGuards = context.domGuards;
  const observerRegistry = context.registries?.observers;
  const gameState = context.gameState;
  const variantRules = context.domain?.variantRules;
  const x01Rules = context.domain?.x01Rules;
  const config = context.config;
  const schedulerFactory = context.helpers?.createRafScheduler;

  if (
    !documentRef ||
    !domGuards ||
    !schedulerFactory ||
    !x01Rules
  ) {
    return () => {};
  }

  const featureConfig =
    config && typeof config.getFeatureConfig === "function"
      ? config.getFeatureConfig("checkoutBoardTargets")
      : {
          effect: "pulse",
          singleRing: "both",
          targetSelectionMode: "next",
          colorTheme: "violet",
          outlineIntensity: "standard",
        };
  const visualConfig = resolveBoardTargetVisualConfig(featureConfig);
  const targetSelectionMode =
    String(featureConfig.targetSelectionMode || "").trim().toLowerCase() === "all"
      ? "all"
      : String(featureConfig.targetSelectionMode || "").trim().toLowerCase() === "finish"
        ? "finish"
        : "next";

  domGuards.ensureStyle(STYLE_ID, buildStyleText());

  let lastRenderSignature = "";
  const boardCache = {
    value: null,
  };

  function invalidateBoardCache() {
    boardCache.value = null;
    lastRenderSignature = "";
  }

  function getBoard() {
    const cachedBoard = boardCache.value;
    if (
      cachedBoard &&
      cachedBoard.group?.isConnected !== false &&
      cachedBoard.svg?.isConnected !== false
    ) {
      return cachedBoard;
    }

    const nextBoard = findBoard(documentRef);
    boardCache.value = nextBoard;
    return nextBoard;
  }

  function clearCurrentOverlay() {
    const board = getBoard();
    if (!board?.group) {
      return;
    }
    const overlay = board.group.querySelector?.(`#${OVERLAY_ID}`) || null;
    if (overlay) {
      clearOverlay(overlay);
    }
  }

  function selectRouteSegments(routeSegments = []) {
    if (!Array.isArray(routeSegments) || !routeSegments.length) {
      return [];
    }

    if (targetSelectionMode === "all") {
      return routeSegments.slice();
    }

    if (targetSelectionMode === "finish") {
      const outMode =
        gameState && typeof gameState.getOutMode === "function"
          ? String(gameState.getOutMode() || "")
          : "";
      const finishSegment = getCheckoutFinishSegmentFromRoute(routeSegments, outMode, x01Rules);
      return finishSegment ? [finishSegment] : [];
    }

    return [routeSegments[0]];
  }

  function update() {
    const active = isX01Active({
      gameState,
      documentRef,
      variantRules,
    });
    const routeSegments = collectVisibleCheckoutRoute(documentRef, windowRef, x01Rules);
    const signature = `${active ? "x01" : "other"}|${routeSegments.join(">")}`;

    if (signature === lastRenderSignature) {
      return;
    }
    lastRenderSignature = signature;

    if (!active) {
      clearCurrentOverlay();
      return;
    }

    const targets = mapRouteSegmentsToBoardTargets(selectRouteSegments(routeSegments), x01Rules);
    const board = getBoard();
    if (!board) {
      return;
    }

    renderCheckoutTargets({
      board,
      checkoutTargets: targets,
      visualConfig,
    });
  }

  const scheduler = schedulerFactory(update, { windowRef });
  const rootNode = documentRef.documentElement || documentRef.body || documentRef;
  const isManagedNode = createManagedNodeMatcher({
    ids: [OVERLAY_ID],
  });
  if (observerRegistry && typeof observerRegistry.registerMutationObserver === "function") {
    observerRegistry.registerMutationObserver({
      key: OBSERVER_KEY,
      target: rootNode,
      callback: (mutations = []) => {
        if (!hasExternalDomMutation(mutations, isManagedNode)) {
          return;
        }
        invalidateBoardCache();
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

    clearCurrentOverlay();
    invalidateBoardCache();
    domGuards.removeNodeById(STYLE_ID);
    domGuards.removeNodeById(OVERLAY_ID);
  };
}

export const mountCheckoutBoardTargets = initializeCheckoutBoardTargets;
export const initialize = initializeCheckoutBoardTargets;
export const mount = initializeCheckoutBoardTargets;
