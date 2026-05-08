import {
  X01_TWO_PLAYER_ACTIVE_ATTRIBUTE,
  X01_TWO_PLAYER_PLAYER_INDEX_ATTRIBUTE,
  X01_TWO_PLAYER_PLAYER_WRAPPER_ATTRIBUTE,
  X01_TWO_PLAYER_SLOTS,
  X01_TWO_PLAYER_SLOT_ATTRIBUTE,
  X01_TWO_PLAYER_STACK_ATTRIBUTE,
} from "./layout-contract.js";

const PLAYER_DISPLAY_SELECTOR = "#ad-ext-player-display";
const PLAYER_CARD_SELECTOR = `${PLAYER_DISPLAY_SELECTOR} .ad-ext-player`;
const TURN_CONTAINER_SELECTOR = "#ad-ext-turn";
const LIVE_TURN_HEIGHT_VARIABLE = "--ad-ext-x01-2player-live-turn-height";
const LIVE_THROW_POINTS_SIZE_VARIABLE = "--ad-ext-x01-2player-live-throw-points-size";
const SHARED_PLAYER_NAME_SIZE_VARIABLE = "--ad-ext-x01-2player-shared-name-size";
const SCORE_PROGRESS_HOST_SELECTOR = '[data-ad-ext-x01-score-progress="true"]';
const PLAYER_NAME_SELECTOR = ".ad-ext-player-name";
const PLAYER_NAME_MIN_SIZE_PX = 18;
const PLAYER_NAME_MAX_SIZE_PX = 96;
const PLAYER_NAME_WIDTH_CLEARANCE_PX = 4;
const PLAYER_NAME_FALLBACK_WIDTH_FACTOR = 0.62;
const BOARD_VISIBILITY_CONTROL_SELECTOR = [
  "button",
  "[role='button']",
  "[role='menuitemcheckbox']",
  "[role='switch']",
  "[role='checkbox']",
  "input[type='checkbox']",
  "[aria-label]",
  "[title]",
].join(",");
const BOARD_VISIBILITY_SHOW_LABELS = Object.freeze([
  "tafel anzeigen",
  "board anzeigen",
  "show board",
  "display board",
]);
const BOARD_VISIBILITY_HIDE_LABELS = Object.freeze([
  "tafel ausblenden",
  "board ausblenden",
  "hide board",
]);
const TURN_THROW_FONT_SOURCE_SELECTORS = Object.freeze([
  ".ad-ext-turn-throw .ad-ext-hit-score",
  ".ad-ext-turn-throw p.chakra-text",
  ".ad-ext-turn-throw p",
  ".ad-ext-turn-throw",
]);

function normalizeBoardVisibilityText(value) {
  return String(value || "")
    .replaceAll(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

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

function getBoardVisibilityLabelCandidates(node) {
  if (!node || typeof node !== "object") {
    return [];
  }

  const labelNode = node.closest?.("label") || null;
  return [
    node.getAttribute?.("aria-label"),
    node.getAttribute?.("title"),
    node.getAttribute?.("aria-description"),
    node.dataset?.label,
    node.dataset?.tooltip,
    node.value,
    node.textContent,
    labelNode && labelNode !== node ? labelNode.textContent : "",
  ].map((value) => normalizeBoardVisibilityText(value)).filter(Boolean);
}

function labelMatchesAny(candidate, labels) {
  return labels.some((label) => candidate === label || candidate.includes(label));
}

function resolveBoardVisibilityControlIntent(node) {
  const labelCandidates = getBoardVisibilityLabelCandidates(node);
  if (!labelCandidates.length) {
    return "";
  }

  if (labelCandidates.some((candidate) => labelMatchesAny(candidate, BOARD_VISIBILITY_HIDE_LABELS))) {
    return "hide";
  }

  if (labelCandidates.some((candidate) => labelMatchesAny(candidate, BOARD_VISIBILITY_SHOW_LABELS))) {
    return "show";
  }

  return "";
}

function getBooleanAttributeState(node, attributeName) {
  const rawValue = node?.getAttribute?.(attributeName);
  const value = normalizeBoardVisibilityText(rawValue);
  if (value === "true" || value === "checked" || value === "selected" || value === "on") {
    return true;
  }
  if (value === "false" || value === "unchecked" || value === "off") {
    return false;
  }
  return rawValue === "" && attributeName === "data-active";
}

function isBoardVisibilityControlActive(node) {
  if (!node || typeof node !== "object") {
    return false;
  }

  return (
    node.checked === true ||
    getBooleanAttributeState(node, "aria-checked") ||
    getBooleanAttributeState(node, "aria-pressed") ||
    getBooleanAttributeState(node, "data-checked") ||
    getBooleanAttributeState(node, "data-selected") ||
    getBooleanAttributeState(node, "data-active") ||
    getBooleanAttributeState(node, "data-state")
  );
}

function isBoardVisibilityControlDisabled(node) {
  return (
    node?.disabled === true ||
    normalizeBoardVisibilityText(node?.getAttribute?.("aria-disabled")) === "true"
  );
}

function resolveBoardVisibilityControlState(node) {
  if (!node || isBoardVisibilityControlDisabled(node)) {
    return null;
  }

  const intent = resolveBoardVisibilityControlIntent(node);
  if (!intent) {
    return null;
  }

  return {
    node,
    visible: intent === "hide" || isBoardVisibilityControlActive(node),
  };
}

function findBoardVisibilityControlState(documentRef) {
  return queryAll(documentRef, BOARD_VISIBILITY_CONTROL_SELECTOR)
    .map((node) => resolveBoardVisibilityControlState(node))
    .find(Boolean) || null;
}

function clickBoardVisibilityControl(node) {
  if (!node || isBoardVisibilityControlDisabled(node)) {
    return false;
  }

  if (typeof node.click === "function") {
    node.click();
    return true;
  }

  return false;
}

function ensureThemeBoardVisible(documentRef, themeState = {}) {
  const controlState = findBoardVisibilityControlState(documentRef);
  if (!controlState) {
    return false;
  }

  if (controlState.visible) {
    return false;
  }

  const didClick = clickBoardVisibilityControl(controlState.node);
  if (didClick) {
    themeState.boardVisibilityOverride = {
      applied: true,
    };
  }
  return didClick;
}

function restoreThemeBoardVisibility(documentRef, themeState = {}) {
  if (themeState.boardVisibilityOverride?.applied !== true) {
    themeState.boardVisibilityOverride = null;
    return false;
  }

  const controlState = findBoardVisibilityControlState(documentRef);
  if (!controlState) {
    return false;
  }
  if (controlState.visible !== true) {
    themeState.boardVisibilityOverride = null;
    return false;
  }

  const didRestore = clickBoardVisibilityControl(controlState.node);
  if (didRestore) {
    themeState.boardVisibilityOverride = null;
  }
  return Boolean(didRestore);
}

function findDirectPlayerWrapper(cardNode) {
  if (cardNode?.nodeType !== 1) {
    return null;
  }

  const parentNode = cardNode.parentElement || cardNode.parentNode || null;
  if (
    parentNode?.nodeType === 1 &&
    typeof parentNode.matches === "function" &&
    parentNode.matches(PLAYER_DISPLAY_SELECTOR)
  ) {
    return cardNode;
  }

  if (parentNode?.nodeType !== 1) {
    return null;
  }

  return parentNode.closest?.(PLAYER_DISPLAY_SELECTOR) ? parentNode : null;
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

function getPlayerDisplayNode(documentRef) {
  if (!documentRef || typeof documentRef.querySelector !== "function") {
    return null;
  }

  try {
    return documentRef.querySelector(PLAYER_DISPLAY_SELECTOR) || null;
  } catch (_) {
    return null;
  }
}

function clearSharedPlayerNameSize(documentRef, themeState = {}) {
  const playerDisplayNode = getPlayerDisplayNode(documentRef);
  playerDisplayNode?.style?.removeProperty?.(SHARED_PLAYER_NAME_SIZE_VARIABLE);
  themeState.lastMeasuredSharedPlayerNameSizePx = 0;
}

function getNodeText(node) {
  return String(node?.textContent || "").replace(/\s+/g, " ").trim();
}

function resolveNameTextNode(nameNode) {
  if (!nameNode || typeof nameNode.querySelector !== "function") {
    return nameNode || null;
  }

  return nameNode.querySelector("p") || nameNode;
}

function getComputedFontValue(windowRef, node, propertyName, fallbackValue) {
  if (!node || typeof windowRef?.getComputedStyle !== "function") {
    return fallbackValue;
  }

  try {
    return String(windowRef.getComputedStyle(node)?.[propertyName] || "").trim() || fallbackValue;
  } catch (_) {
    return fallbackValue;
  }
}

function getNameMeasureContext(documentRef, themeState = {}) {
  if (themeState.nameMeasureContext) {
    return themeState.nameMeasureContext;
  }

  const canvas =
    documentRef && typeof documentRef.createElement === "function"
      ? documentRef.createElement("canvas")
      : null;
  const context =
    canvas && typeof canvas.getContext === "function" ? canvas.getContext("2d") : null;
  themeState.nameMeasureContext = context || null;
  return themeState.nameMeasureContext;
}

function measurePlayerNameWidthPx(documentRef, themeState, windowRef, nameTextNode, fontSizePx) {
  const text = getNodeText(nameTextNode);
  if (!text) {
    return 0;
  }

  const measureContext = getNameMeasureContext(documentRef, themeState);
  if (measureContext && typeof measureContext.measureText === "function") {
    const fontWeight = getComputedFontValue(windowRef, nameTextNode, "fontWeight", "800");
    const fontFamily = getComputedFontValue(windowRef, nameTextNode, "fontFamily", "sans-serif");
    measureContext.font = `${fontWeight} ${fontSizePx}px ${fontFamily}`;
    const measuredWidth = Number(measureContext.measureText(text)?.width) || 0;
    if (measuredWidth > 0) {
      return measuredWidth;
    }
  }

  return text.length * fontSizePx * PLAYER_NAME_FALLBACK_WIDTH_FACTOR;
}

function findPlayerNameFitSizePx(documentRef, themeState, windowRef, stackNode, nameTextNode) {
  const stackRect = stackNode?.getBoundingClientRect?.() || {};
  const availableWidthPx =
    Math.max(0, Number(stackRect.width) || 0) - PLAYER_NAME_WIDTH_CLEARANCE_PX;
  if (!(availableWidthPx > 0) || !nameTextNode) {
    return PLAYER_NAME_MIN_SIZE_PX;
  }

  let minSize = PLAYER_NAME_MIN_SIZE_PX;
  let maxSize = PLAYER_NAME_MAX_SIZE_PX;
  for (let index = 0; index < 16; index += 1) {
    const candidateSize = (minSize + maxSize) / 2;
    const measuredWidth = measurePlayerNameWidthPx(
      documentRef,
      themeState,
      windowRef,
      nameTextNode,
      candidateSize
    );
    if (measuredWidth <= availableWidthPx) {
      minSize = candidateSize;
    } else {
      maxSize = candidateSize;
    }
  }

  return minSize;
}

function syncSharedPlayerNameSize(documentRef, themeState = {}, windowRef = null) {
  const playerDisplayNode = getPlayerDisplayNode(documentRef);
  if (!playerDisplayNode?.style || typeof playerDisplayNode.style.setProperty !== "function") {
    clearSharedPlayerNameSize(documentRef, themeState);
    return false;
  }

  const playerCards = getPlayerCards(documentRef);
  const fittedNameSizes = playerCards
    .map((cardNode) => {
      const stackNode = findDirectPlayerStack(cardNode);
      const nameNode = stackNode?.querySelector?.(PLAYER_NAME_SELECTOR) || null;
      const nameTextNode = resolveNameTextNode(nameNode);
      if (!stackNode || !getNodeText(nameTextNode)) {
        return null;
      }

      return findPlayerNameFitSizePx(documentRef, themeState, windowRef, stackNode, nameTextNode);
    })
    .filter((sizePx) => Number.isFinite(sizePx) && sizePx > 0);

  if (!fittedNameSizes.length) {
    clearSharedPlayerNameSize(documentRef, themeState);
    return false;
  }

  const nextSharedSizePx = Math.max(
    PLAYER_NAME_MIN_SIZE_PX,
    Math.min(PLAYER_NAME_MAX_SIZE_PX, ...fittedNameSizes)
  );
  const nextValue = `${nextSharedSizePx.toFixed(2)}px`;
  playerDisplayNode.style.setProperty(SHARED_PLAYER_NAME_SIZE_VARIABLE, nextValue);

  const didChange = nextValue !== String(themeState.lastMeasuredSharedPlayerNameSizePx || "");
  themeState.lastMeasuredSharedPlayerNameSizePx = nextValue;
  return didChange;
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
  queryAll(documentRef, `[${X01_TWO_PLAYER_PLAYER_INDEX_ATTRIBUTE}]`).forEach((node) => {
    node.removeAttribute?.(X01_TWO_PLAYER_PLAYER_INDEX_ATTRIBUTE);
  });
  queryAll(documentRef, `[${X01_TWO_PLAYER_PLAYER_WRAPPER_ATTRIBUTE}]`).forEach((node) => {
    node.removeAttribute?.(X01_TWO_PLAYER_PLAYER_WRAPPER_ATTRIBUTE);
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
    const wrapperNode = findDirectPlayerWrapper(cardNode);
    wrapperNode?.setAttribute?.(X01_TWO_PLAYER_PLAYER_WRAPPER_ATTRIBUTE, "true");
    wrapperNode?.setAttribute?.(X01_TWO_PLAYER_PLAYER_INDEX_ATTRIBUTE, String(cardIndex));
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
        lastMeasuredSharedPlayerNameSizePx: "",
        nameMeasureContext: null,
        boardVisibilityOverride: null,
      };
    },
    getObservedAttributeFilter() {
      return ["class"];
    },
    shouldScheduleMutation(mutations = []) {
      return hasX01TwoPlayerPlayerStateMutation(mutations);
    },
    onActivate(context = {}) {
      ensureThemeBoardVisible(context.documentRef, context.themeState);
      syncX01TwoPlayerLayoutState(context.documentRef, context.gameState);
      syncSharedPlayerNameSize(context.documentRef, context.themeState, context.windowRef);
      ensureTurnResizeObserver(context);
    },
    onDeactivate(context = {}) {
      restoreThemeBoardVisibility(context.documentRef, context.themeState);
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
      clearSharedPlayerNameSize(context.documentRef, context.themeState);
      clearX01TwoPlayerLayoutState(context.documentRef);
    },
  });
}
