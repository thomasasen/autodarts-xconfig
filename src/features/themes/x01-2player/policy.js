import {
  X01_TWO_PLAYER_ACTIVE_ATTRIBUTE,
  X01_TWO_PLAYER_SLOTS,
  X01_TWO_PLAYER_SLOT_ATTRIBUTE,
  X01_TWO_PLAYER_STACK_ATTRIBUTE,
} from "./layout-contract.js";

const PLAYER_DISPLAY_SELECTOR = "#ad-ext-player-display";
const PLAYER_CARD_SELECTOR = `${PLAYER_DISPLAY_SELECTOR} .ad-ext-player`;
const TURN_CONTAINER_SELECTOR = "#ad-ext-turn";
const LIVE_TURN_HEIGHT_VARIABLE = "--ad-ext-x01-2player-live-turn-height";
const LIVE_THROW_POINTS_SIZE_VARIABLE = "--ad-ext-x01-2player-live-throw-points-size";
const SCORE_PROGRESS_HOST_SELECTOR = '[data-ad-ext-x01-score-progress="true"]';
const TURN_THROW_FONT_SOURCE_SELECTORS = Object.freeze([
  ".ad-ext-turn-throw .ad-ext-hit-score",
  ".ad-ext-turn-throw p.chakra-text",
  ".ad-ext-turn-throw p",
  ".ad-ext-turn-throw",
]);

function queryAll(rootNode, selector) {
  if (!rootNode || typeof rootNode.querySelectorAll !== "function") {
    return [];
  }

  try {
    return Array.from(rootNode.querySelectorAll(selector));
  } catch (_) {
    return [];
  }
}

function getPlayerCards(documentRef) {
  return queryAll(documentRef, PLAYER_CARD_SELECTOR).filter((node) => node?.isConnected !== false);
}

function getTurnContainer(documentRef) {
  if (!documentRef || typeof documentRef.querySelector !== "function") {
    return null;
  }

  try {
    return documentRef.querySelector(TURN_CONTAINER_SELECTOR) || null;
  } catch (_) {
    return null;
  }
}

function getRootStyleTarget(documentRef) {
  return documentRef?.documentElement?.style || documentRef?.body?.style || null;
}

function clearLiveTurnHeight(documentRef, themeState = {}) {
  const styleTarget = getRootStyleTarget(documentRef);
  if (styleTarget && typeof styleTarget.removeProperty === "function") {
    styleTarget.removeProperty(LIVE_TURN_HEIGHT_VARIABLE);
    styleTarget.removeProperty(LIVE_THROW_POINTS_SIZE_VARIABLE);
  }
  themeState.lastMeasuredTurnHeightPx = 0;
  themeState.lastMeasuredThrowPointsFontSize = "";
}

function findDirectThrowTextNode(throwRowNode) {
  if (!throwRowNode?.children) {
    return null;
  }

  return (
    Array.from(throwRowNode.children).find((node) => {
      return (
        node?.matches?.("p.chakra-text") ||
        node?.matches?.("p") ||
        node?.matches?.(".chakra-text")
      );
    }) || null
  );
}

function getStructuredThrowScoreNode(throwRowNode) {
  const throwTextNode = findDirectThrowTextNode(throwRowNode);
  const structuredWrapperNode = throwTextNode?.firstElementChild || null;
  if (!structuredWrapperNode?.children?.length) {
    return throwTextNode;
  }

  return (
    Array.from(structuredWrapperNode.children).find((node) => {
      return node?.classList?.contains?.("ad-ext-hit-score");
    }) ||
    structuredWrapperNode.children[0] ||
    throwTextNode
  );
}

function getFirstLiveThrowFontSource(documentRef) {
  if (!documentRef || typeof documentRef.querySelector !== "function") {
    return null;
  }

  const firstThrowRow = getTurnContainer(documentRef)?.querySelector?.(".ad-ext-turn-throw") || null;
  if (!firstThrowRow) {
    return null;
  }

  try {
    const explicitScoreNode = firstThrowRow.querySelector?.(".ad-ext-hit-score") || null;
    if (explicitScoreNode) {
      return explicitScoreNode;
    }

    return getStructuredThrowScoreNode(firstThrowRow) || firstThrowRow;
  } catch (_) {
    // fall through to simpler selector-based probes
  }

  return (
    TURN_THROW_FONT_SOURCE_SELECTORS.map((selector) => {
      try {
        return documentRef.querySelector(`${TURN_CONTAINER_SELECTOR} ${selector}`) || null;
      } catch (_) {
        return null;
      }
    }).find(Boolean) || null
  );
}

function syncLiveTurnMetrics(documentRef, themeState = {}, windowRef = null) {
  const turnNode = getTurnContainer(documentRef);
  const styleTarget = getRootStyleTarget(documentRef);
  if (!turnNode || !styleTarget || typeof styleTarget.setProperty !== "function") {
    clearLiveTurnHeight(documentRef, themeState);
    return false;
  }

  const nextHeightPx = Math.max(
    0,
    Math.round(Number(turnNode.getBoundingClientRect?.().height) || 0)
  );
  if (!(nextHeightPx > 0)) {
    clearLiveTurnHeight(documentRef, themeState);
    return false;
  }

  styleTarget.setProperty(LIVE_TURN_HEIGHT_VARIABLE, `${nextHeightPx}px`);
  const fontSourceNode = getFirstLiveThrowFontSource(documentRef);
  const computedStyle =
    fontSourceNode && typeof windowRef?.getComputedStyle === "function"
      ? windowRef.getComputedStyle(fontSourceNode)
      : null;
  const nextThrowPointsFontSize = String(computedStyle?.fontSize || "").trim();
  if (nextThrowPointsFontSize) {
    styleTarget.setProperty(LIVE_THROW_POINTS_SIZE_VARIABLE, nextThrowPointsFontSize);
  } else {
    styleTarget.removeProperty?.(LIVE_THROW_POINTS_SIZE_VARIABLE);
  }

  const didChange =
    nextHeightPx !== Number(themeState.lastMeasuredTurnHeightPx || 0) ||
    nextThrowPointsFontSize !== String(themeState.lastMeasuredThrowPointsFontSize || "");
  themeState.lastMeasuredTurnHeightPx = nextHeightPx;
  themeState.lastMeasuredThrowPointsFontSize = nextThrowPointsFontSize;
  return didChange;
}

function detachTurnResizeObserver(themeState = {}) {
  if (themeState.turnResizeObserver && themeState.turnResizeObservedNode) {
    try {
      themeState.turnResizeObserver.unobserve?.(themeState.turnResizeObservedNode);
    } catch (_) {
      // Keep theme cleanup fail-soft.
    }
  }
  themeState.turnResizeObservedNode = null;
}

function ensureTurnResizeObserver(context = {}) {
  const themeState = context.themeState || {};
  const documentRef = context.documentRef;
  const windowRef = context.windowRef;
  const scheduler = context.scheduler;
  const nextTurnNode = getTurnContainer(documentRef);

  syncLiveTurnMetrics(documentRef, themeState, windowRef);

  const ResizeObserverRef = windowRef?.ResizeObserver;
  if (typeof ResizeObserverRef !== "function") {
    return;
  }

  if (!themeState.turnResizeObserver) {
    themeState.turnResizeObserver = new ResizeObserverRef(() => {
      const didChange = syncLiveTurnMetrics(documentRef, themeState, windowRef);
      if (didChange) {
        scheduler?.schedule?.();
      }
    });
  }

  if (themeState.turnResizeObservedNode === nextTurnNode) {
    return;
  }

  detachTurnResizeObserver(themeState);
  if (nextTurnNode) {
    themeState.turnResizeObserver.observe?.(nextTurnNode);
    themeState.turnResizeObservedNode = nextTurnNode;
  }
}

function clearPlayerMarkers(documentRef) {
  queryAll(documentRef, `[${X01_TWO_PLAYER_ACTIVE_ATTRIBUTE}]`).forEach((node) => {
    node.removeAttribute?.(X01_TWO_PLAYER_ACTIVE_ATTRIBUTE);
  });
  queryAll(documentRef, `[${X01_TWO_PLAYER_STACK_ATTRIBUTE}]`).forEach((node) => {
    node.removeAttribute?.(X01_TWO_PLAYER_STACK_ATTRIBUTE);
  });
  queryAll(documentRef, `[${X01_TWO_PLAYER_SLOT_ATTRIBUTE}]`).forEach((node) => {
    node.removeAttribute?.(X01_TWO_PLAYER_SLOT_ATTRIBUTE);
  });
}

function findDirectPlayerStack(cardNode) {
  if (!cardNode?.children) {
    return null;
  }

  return (
    Array.from(cardNode.children).find((node) => {
      return node?.classList?.contains?.("chakra-stack");
    }) || null
  );
}

function findIdentitySlot(stackNode) {
  if (!stackNode?.children) {
    return null;
  }

  const stackChildren = Array.from(stackNode.children).filter((node) => node?.nodeType === 1);
  const identityCandidate = stackChildren.find((node) => {
    if (!node?.classList?.contains?.("chakra-stack")) {
      return false;
    }

    if (typeof node.matches === "function" && node.matches(SCORE_PROGRESS_HOST_SELECTOR)) {
      return false;
    }

    if (node.classList?.contains?.("ad-ext_winner-score-wrapper")) {
      return false;
    }

    return Boolean(
      node.querySelector?.(".ad-ext-player-name, .chakra-avatar, .chakra-avatar__img, img[alt]")
    );
  });
  if (identityCandidate) {
    return identityCandidate;
  }

  return (
    stackChildren.find((node) => {
      return node?.classList?.contains?.("chakra-stack") &&
        !(typeof node.matches === "function" && node.matches(SCORE_PROGRESS_HOST_SELECTOR));
    }) || null
  );
}

function findScoreSlot(stackNode) {
  if (!stackNode?.children) {
    return null;
  }

  return (
    Array.from(stackNode.children).find((node) => {
      if (node?.nodeType !== 1) {
        return false;
      }

      if (node.classList?.contains?.("ad-ext-player-score")) {
        return true;
      }

      if (node.classList?.contains?.("ad-ext_winner-score-wrapper")) {
        return Boolean(node.querySelector?.(".ad-ext-player-score, p"));
      }

      return false;
    }) || null
  );
}

function findProgressSlot(stackNode) {
  if (!stackNode?.children) {
    return null;
  }

  return (
    Array.from(stackNode.children).find((node) => {
      if (node?.nodeType !== 1) {
        return false;
      }

      return typeof node.matches === "function" && node.matches(SCORE_PROGRESS_HOST_SELECTOR);
    }) || null
  );
}

function findTableSlot(cardNode, stackNode) {
  if (!cardNode?.children) {
    return null;
  }

  return (
    Array.from(cardNode.children).find((node) => {
      if (!node || node === stackNode || node.nodeType !== 1) {
        return false;
      }

      return typeof node.querySelector === "function" && Boolean(node.querySelector("table"));
    }) || null
  );
}

function resolveFallbackActiveIndex(playerCards) {
  const classIndex = playerCards.findIndex((node) => node?.classList?.contains?.("ad-ext-player-active"));
  return Math.max(0, classIndex);
}

function resolveActivePlayerIndex(playerCards, gameState) {
  const activePlayerIndex = Number(gameState?.getActivePlayerIndex?.());
  if (Number.isFinite(activePlayerIndex) && activePlayerIndex >= 0 && activePlayerIndex < playerCards.length) {
    return activePlayerIndex;
  }

  return resolveFallbackActiveIndex(playerCards);
}

function markSlot(node, slotName) {
  if (!node || !slotName) {
    return;
  }
  node.setAttribute?.(X01_TWO_PLAYER_SLOT_ATTRIBUTE, slotName);
}

export function syncX01TwoPlayerLayoutState(documentRef, gameState) {
  const playerCards = getPlayerCards(documentRef);
  clearPlayerMarkers(documentRef);

  if (!playerCards.length) {
    return;
  }

  const activePlayerIndex = resolveActivePlayerIndex(playerCards, gameState);
  playerCards.forEach((cardNode, cardIndex) => {
    cardNode.setAttribute?.(
      X01_TWO_PLAYER_ACTIVE_ATTRIBUTE,
      cardIndex === activePlayerIndex ? "true" : "false"
    );

    const stackNode = findDirectPlayerStack(cardNode);
    if (stackNode) {
      stackNode.setAttribute?.(X01_TWO_PLAYER_STACK_ATTRIBUTE, "true");
      markSlot(findIdentitySlot(stackNode), X01_TWO_PLAYER_SLOTS.identity);
      markSlot(findProgressSlot(stackNode), X01_TWO_PLAYER_SLOTS.progress);
      markSlot(findScoreSlot(stackNode), X01_TWO_PLAYER_SLOTS.score);
    }

    markSlot(findTableSlot(cardNode, stackNode), X01_TWO_PLAYER_SLOTS.table);
  });
}

export function clearX01TwoPlayerLayoutState(documentRef) {
  clearPlayerMarkers(documentRef);
}

export function hasX01TwoPlayerPlayerStateMutation(mutations = []) {
  if (!Array.isArray(mutations) || !mutations.length) {
    return false;
  }

  return mutations.some((mutation) => {
    const touchedNodes = [
      mutation?.target || null,
      ...Array.from(mutation?.addedNodes || []),
      ...Array.from(mutation?.removedNodes || []),
    ].filter(Boolean);

    return touchedNodes.some((node) => {
      if (node?.nodeType !== 1) {
        return false;
      }

      if (typeof node.matches === "function" && node.matches(PLAYER_CARD_SELECTOR)) {
        return true;
      }

      return typeof node.closest === "function" && Boolean(node.closest(PLAYER_DISPLAY_SELECTOR));
    });
  });
}

export function createX01TwoPlayerThemePolicy() {
  return Object.freeze({
    key: "theme-x01-2player",
    createState() {
      return {
        turnResizeObserver: null,
        turnResizeObservedNode: null,
        lastMeasuredTurnHeightPx: 0,
        lastMeasuredThrowPointsFontSize: "",
      };
    },
    getObservedAttributeFilter() {
      return ["class"];
    },
    shouldScheduleMutation(mutations = []) {
      return hasX01TwoPlayerPlayerStateMutation(mutations);
    },
    onActivate(context = {}) {
      syncX01TwoPlayerLayoutState(context.documentRef, context.gameState);
      ensureTurnResizeObserver(context);
    },
    onDeactivate(context = {}) {
      detachTurnResizeObserver(context.themeState);
      try {
        context.themeState?.turnResizeObserver?.disconnect?.();
      } catch (_) {
        // Keep theme cleanup fail-soft.
      }
      if (context.themeState) {
        context.themeState.turnResizeObserver = null;
      }
      clearLiveTurnHeight(context.documentRef, context.themeState);
      clearX01TwoPlayerLayoutState(context.documentRef);
    },
  });
}
