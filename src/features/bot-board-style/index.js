import { resolveBoardStyleDesignAsset } from "#feature-assets";
import {
  clearBotBoardStyle,
  createBotBoardStyleState,
  updateBotBoardStyle,
} from "./logic.js";
import { BOARD_STYLE_IMAGE_ID, STYLE_ID, buildStyleText } from "./style.js";

const FEATURE_KEY = "bot-board-style";
const OBSERVER_KEY = `${FEATURE_KEY}:dom-observer`;
const BOARD_SELECTOR = "svg[viewBox], .showAnimations, .ad-ext-theme-board-canvas";
const PLAYER_SELECTOR = ".ad-ext-player, .ad-ext-player-name";

function asElementNode(node) {
  if (node?.nodeType === 1) {
    return node;
  }
  return node?.parentElement || null;
}

function isTrackedBoardNode(node, state) {
  const element = asElementNode(node);
  const boardGroup = state?.boardGroup;
  if (!element || !boardGroup) {
    return false;
  }
  return Boolean(
    element === boardGroup ||
      element.contains?.(boardGroup) ||
      boardGroup.contains?.(element)
  );
}

function isPotentialBoardOrPlayerNode(node, state) {
  const element = asElementNode(node);
  if (!element || element.id === BOARD_STYLE_IMAGE_ID) {
    return false;
  }

  if (isTrackedBoardNode(element, state)) {
    return true;
  }

  if (element.matches?.(PLAYER_SELECTOR) || element.closest?.(".ad-ext-player")) {
    return true;
  }

  if (element.matches?.(BOARD_SELECTOR)) {
    return true;
  }

  return Boolean(element.querySelector?.(`${BOARD_SELECTOR}, ${PLAYER_SELECTOR}`));
}

export function hasRelevantBotBoardStyleMutation(mutations = [], state = null) {
  return Array.from(mutations || []).some((mutation) => {
    const nodes = [
      mutation?.target,
      ...Array.from(mutation?.addedNodes || []),
      ...Array.from(mutation?.removedNodes || []),
    ];
    return nodes.some((node) => isPotentialBoardOrPlayerNode(node, state));
  });
}

export function initializeBotBoardStyle(context = {}) {
  const documentRef = context.documentRef || (typeof document !== "undefined" ? document : null);
  const windowRef = context.windowRef || (globalThis.window !== undefined ? globalThis.window : null);
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
      ? config.getFeatureConfig("botBoardStyle")
      : {
          enabled: false,
          design: "winmau-blade-6-tc",
          scope: "bot-turns",
        };

  domGuards.ensureStyle(STYLE_ID, buildStyleText());
  const state = createBotBoardStyleState();
  const update = () => {
    updateBotBoardStyle({
      documentRef,
      state,
      gameState,
      featureConfig,
      assetResolver: resolveBoardStyleDesignAsset,
    });
  };
  const scheduler = schedulerFactory(update, { windowRef });

  if (observerRegistry && typeof observerRegistry.registerMutationObserver === "function") {
    observerRegistry.registerMutationObserver({
      key: OBSERVER_KEY,
      target: documentRef.documentElement || documentRef.body || documentRef,
      callback: (mutations) => {
        if (hasRelevantBotBoardStyleMutation(mutations, state)) {
          scheduler.schedule();
        }
      },
      observeOptions: {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeFilter: [
          "class",
          "d",
          "aria-label",
          "viewBox",
          "r",
          "data-ad-ext-theme-cricket-active",
        ],
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

  return function cleanupBotBoardStyle() {
    if (cleanedUp) {
      return;
    }
    cleanedUp = true;
    scheduler.cancel();
    try {
      unsubscribeGameState();
    } catch (_) {
      // fail-soft
    }
    observerRegistry?.disconnect?.(OBSERVER_KEY);
    clearBotBoardStyle(documentRef, state);
    domGuards.removeNodeById(STYLE_ID);
  };
}

export const mountBotBoardStyle = initializeBotBoardStyle;
export const initialize = initializeBotBoardStyle;
export const mount = initializeBotBoardStyle;
