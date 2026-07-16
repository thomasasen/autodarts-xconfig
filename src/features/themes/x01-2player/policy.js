import {
  X01_TWO_PLAYER_ACTIVE_ATTRIBUTE,
  X01_TWO_PLAYER_CONFIG_ATTRIBUTES,
  X01_TWO_PLAYER_PLAYER_INDEX_ATTRIBUTE,
  X01_TWO_PLAYER_PLAYER_WRAPPER_ATTRIBUTE,
  X01_TWO_PLAYER_SLOTS,
  X01_TWO_PLAYER_SLOT_ATTRIBUTE,
  X01_TWO_PLAYER_STACK_ATTRIBUTE,
} from "./layout-contract.js";
import {
  clearX01TwoPlayerScoreboardState,
  isX01TwoPlayerScoreboardStateMutation,
  syncX01TwoPlayerScoreboardState,
} from "./scoreboard-state.js";
import { THEME_LAYOUT_HOOK_CLASSES } from "../shared/theme-layout-contract.js";
import {
  clearPlayerCardPartMarkers,
  markPlayerCardParts,
} from "../../shared/player-card-parts.js";

const PLAYER_DISPLAY_SELECTOR = "#ad-ext-player-display";
const PLAYER_CARD_SELECTOR = `${PLAYER_DISPLAY_SELECTOR} .ad-ext-player`;
const TURN_CONTAINER_SELECTOR = "#ad-ext-turn";
const ROOT_CONTAINER_SELECTOR = "#root";
const BOARD_CONTROLS_CLASS = THEME_LAYOUT_HOOK_CLASSES.boardControls;
const BOARD_CONTROLS_SELECTOR = `.${BOARD_CONTROLS_CLASS}`;
const BOARD_CONTROLS_PORTAL_CLASS = "ad-ext-x01-2player-board-controls-portal";
const BOARD_CONTROLS_PORTAL_ATTRIBUTE = "data-ad-ext-x01-2player-board-controls-portal";
const BOARD_CONTROLS_PORTAL_SELECTOR = `[${BOARD_CONTROLS_PORTAL_ATTRIBUTE}="true"]`;
const LIVE_TURN_HEIGHT_VARIABLE = "--ad-ext-x01-2player-live-turn-height";
const LIVE_THROW_POINTS_SIZE_VARIABLE = "--ad-ext-x01-2player-live-throw-points-size";
const SHARED_PLAYER_NAME_SIZE_VARIABLE = "--ad-ext-x01-2player-shared-name-size";
const SCORE_PROGRESS_HOST_SELECTOR = '[data-ad-ext-x01-remaining-score-bar="true"]';
const PLAYER_NAME_SELECTOR = ".ad-ext-player-name";
const PLAYER_NAME_MIN_SIZE_PX = 18;
const PLAYER_NAME_MAX_SIZE_PX = 96;
const PLAYER_NAME_WIDTH_CLEARANCE_PX = 4;
const PLAYER_NAME_FALLBACK_WIDTH_FACTOR = 0.62;
const PLAYER_NAME_TWO_LINE_SEARCH_STEPS = 12;
const HYDRATION_RECHECK_DELAYS_MS = Object.freeze([40, 160, 400]);
const X01_TWO_PLAYER_CONFIG_DEFAULTS = Object.freeze({
  visualStyle: "studio",
  colorScheme: "studio-mint",
  activePlayerEmphasis: "standard",
  informationDensity: "full",
  identityDensity: "full",
  playerNameLayout: "single-line",
});
const X01_TWO_PLAYER_CONFIG_VALUES = Object.freeze({
  visualStyle: new Set(["studio", "broadcast", "high-contrast"]),
  colorScheme: new Set(["studio-mint", "lime", "amber", "midnight-blue", "monochrome"]),
  activePlayerEmphasis: new Set(["subtle", "standard", "strong"]),
  informationDensity: new Set(["full", "tv", "compact"]),
  identityDensity: new Set(["full", "name-only"]),
  playerNameLayout: new Set(["single-line", "two-lines"]),
});
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

  let currentNode = cardNode;
  let parentNode = currentNode.parentElement || currentNode.parentNode || null;
  while (parentNode?.nodeType === 1) {
    if (typeof parentNode.matches === "function" && parentNode.matches(PLAYER_DISPLAY_SELECTOR)) {
      return currentNode;
    }
    currentNode = parentNode;
    parentNode = currentNode.parentElement || currentNode.parentNode || null;
  }

  return null;
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

function syncTurnPointsForPlayerChange(documentRef, gameState, themeState = {}) {
  const activePlayerIndex = Number(gameState?.getActivePlayerIndex?.());
  if (!Number.isFinite(activePlayerIndex)) {
    return false;
  }

  const markedPlayerIndex = getPlayerCards(documentRef).findIndex(
    (node) => node?.getAttribute?.(X01_TWO_PLAYER_ACTIVE_ATTRIBUTE) === "true"
  );
  const previousPlayerIndex = markedPlayerIndex >= 0
    ? markedPlayerIndex
    : Number(themeState.lastActivePlayerIndex);
  themeState.lastActivePlayerIndex = activePlayerIndex;
  if (!Number.isFinite(previousPlayerIndex) || previousPlayerIndex === activePlayerIndex) {
    return false;
  }

  const activeThrows = gameState?.getActiveThrows?.();
  if (!Array.isArray(activeThrows) || activeThrows.length > 0) {
    return false;
  }

  const turnPointsNode = documentRef?.querySelector?.(
    `${TURN_CONTAINER_SELECTOR} .ad-ext-turn-points`
  );
  if (!turnPointsNode || String(turnPointsNode.textContent || "").trim() === "0") {
    return false;
  }

  turnPointsNode.textContent = "0";
  return true;
}

function clearHydrationRechecks(themeState = {}) {
  const windowRef = themeState.hydrationRecheckWindowRef;
  Array.from(themeState.hydrationRecheckTimerIds || []).forEach((timerId) => {
    try {
      windowRef?.clearTimeout?.(timerId);
    } catch (_) {
      // Keep theme cleanup fail-soft.
    }
  });
  themeState.hydrationRecheckTimerIds = [];
  themeState.hydrationRecheckWindowRef = null;
}

function hasSamePlayerCardNodes(previousNodes = [], nextNodes = []) {
  return (
    previousNodes.length === nextNodes.length &&
    previousNodes.every((node, index) => node === nextNodes[index])
  );
}

function scheduleHydrationRechecks(context = {}) {
  const themeState = context.themeState || {};
  const playerCards = getPlayerCards(context.documentRef);
  if (
    themeState.hydrationRechecksInitialized === true &&
    hasSamePlayerCardNodes(themeState.hydrationPlayerCardNodes || [], playerCards)
  ) {
    return;
  }

  clearHydrationRechecks(themeState);
  themeState.hydrationRechecksInitialized = true;
  themeState.hydrationPlayerCardNodes = playerCards;
  if (typeof context.windowRef?.setTimeout !== "function") {
    return;
  }

  themeState.hydrationRecheckWindowRef = context.windowRef;
  themeState.hydrationRecheckTimerIds = HYDRATION_RECHECK_DELAYS_MS.map((delayMs) =>
    context.windowRef.setTimeout(() => context.scheduler?.schedule?.(), delayMs)
  );
}

function getRootContainer(documentRef) {
  return (
    documentRef?.querySelector?.(ROOT_CONTAINER_SELECTOR) ||
    documentRef?.body ||
    documentRef?.documentElement ||
    null
  );
}

function getRootStyleTarget(documentRef) {
  return documentRef?.documentElement?.style || documentRef?.body?.style || null;
}

function resolveX01TwoPlayerConfig(rawConfig = {}) {
  return Object.fromEntries(
    Object.entries(X01_TWO_PLAYER_CONFIG_DEFAULTS).map(([key, fallback]) => {
      const value = String(rawConfig?.[key] || "").trim().toLowerCase();
      return [key, X01_TWO_PLAYER_CONFIG_VALUES[key].has(value) ? value : fallback];
    })
  );
}

function syncThemeConfigAttributes(documentRef, featureConfig = {}) {
  const rootNode = documentRef?.documentElement;
  if (!rootNode?.setAttribute) {
    return resolveX01TwoPlayerConfig(featureConfig);
  }

  const resolved = resolveX01TwoPlayerConfig(featureConfig);
  Object.entries(X01_TWO_PLAYER_CONFIG_ATTRIBUTES).forEach(([key, attributeName]) => {
    rootNode.setAttribute(attributeName, resolved[key]);
  });
  return resolved;
}

function clearThemeConfigAttributes(documentRef) {
  const rootNode = documentRef?.documentElement;
  Object.values(X01_TWO_PLAYER_CONFIG_ATTRIBUTES).forEach((attributeName) => {
    rootNode?.removeAttribute?.(attributeName);
  });
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
  themeState.lastPlayerNameMeasureSignature = "";
}

function getNodeText(node) {
  return String(node?.textContent || "").replaceAll(/\s+/g, " ").trim();
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

function findPlayerNameFitSizePx(documentRef, themeState, windowRef, fitNode, nameTextNode) {
  const fitRect = fitNode?.getBoundingClientRect?.() || {};
  const availableWidthPx =
    Math.max(0, Number(fitRect.width) || 0) - PLAYER_NAME_WIDTH_CLEARANCE_PX;
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

function getPlayerNameMeasureEntries(documentRef, windowRef = null) {
  return getPlayerCards(documentRef)
    .map((cardNode) => {
      const stackNode = findDirectPlayerStack(cardNode);
      const nameNode = stackNode?.querySelector?.(PLAYER_NAME_SELECTOR) || null;
      const nameTextNode = resolveNameTextNode(nameNode);
      const text = getNodeText(nameTextNode);
      if (!stackNode || !nameTextNode || !text) {
        return null;
      }
      const nameRect = nameNode?.getBoundingClientRect?.() || {};
      const stackRect = stackNode.getBoundingClientRect?.() || {};
      const availableNameWidth = Math.max(0, Number(nameRect.width) || 0);
      return {
        fitNode: availableNameWidth > 0 ? nameNode : stackNode,
        nameTextNode,
        text,
        width: availableNameWidth || Math.max(0, Number(stackRect.width) || 0),
        fontFamily: getComputedFontValue(windowRef, nameTextNode, "fontFamily", "sans-serif"),
        fontWeight: getComputedFontValue(windowRef, nameTextNode, "fontWeight", "800"),
      };
    })
    .filter(Boolean);
}

function buildPlayerNameMeasureSignature(entries, resolvedConfig) {
  return JSON.stringify({
    layout: resolvedConfig.playerNameLayout,
    informationDensity: resolvedConfig.informationDensity,
    identityDensity: resolvedConfig.identityDensity,
    names: entries.map((entry) => [
      entry.text,
      entry.width.toFixed(2),
      entry.fontFamily,
      entry.fontWeight,
    ]),
  });
}

function renderedNameFitsTwoLines(windowRef, nameTextNode, candidateSizePx) {
  const computedStyle = windowRef?.getComputedStyle?.(nameTextNode) || {};
  const parsedLineHeight = Number.parseFloat(computedStyle.lineHeight);
  const lineHeightPx = Number.isFinite(parsedLineHeight) && parsedLineHeight > 0
    ? parsedLineHeight
    : candidateSizePx * 0.98;
  const scrollHeight = Number(nameTextNode?.scrollHeight) ||
    Number(nameTextNode?.getBoundingClientRect?.().height) || 0;
  const scrollWidth = Number(nameTextNode?.scrollWidth) || 0;
  const clientWidth = Number(nameTextNode?.clientWidth) ||
    Number(nameTextNode?.getBoundingClientRect?.().width) || 0;

  return (
    (!(scrollHeight > 0) || scrollHeight <= lineHeightPx * 2 + 1) &&
    (!(scrollWidth > 0 && clientWidth > 0) || scrollWidth <= clientWidth + 1)
  );
}

function findTwoLinePlayerNameFitSizePx(playerDisplayNode, entries, windowRef) {
  let minSize = PLAYER_NAME_MIN_SIZE_PX;
  let maxSize = PLAYER_NAME_MAX_SIZE_PX;
  for (let index = 0; index < PLAYER_NAME_TWO_LINE_SEARCH_STEPS; index += 1) {
    const candidateSize = (minSize + maxSize) / 2;
    playerDisplayNode.style.setProperty(
      SHARED_PLAYER_NAME_SIZE_VARIABLE,
      `${candidateSize.toFixed(2)}px`
    );
    if (entries.every((entry) => renderedNameFitsTwoLines(windowRef, entry.nameTextNode, candidateSize))) {
      minSize = candidateSize;
    } else {
      maxSize = candidateSize;
    }
  }
  return minSize;
}

function syncSharedPlayerNameSize(
  documentRef,
  themeState = {},
  windowRef = null,
  featureConfig = {}
) {
  const playerDisplayNode = getPlayerDisplayNode(documentRef);
  if (!playerDisplayNode?.style || typeof playerDisplayNode.style.setProperty !== "function") {
    clearSharedPlayerNameSize(documentRef, themeState);
    return false;
  }

  if (themeState.measuringPlayerNames) {
    return false;
  }

  const resolvedConfig = resolveX01TwoPlayerConfig(featureConfig);
  const entries = getPlayerNameMeasureEntries(documentRef, windowRef);
  const signature = buildPlayerNameMeasureSignature(entries, resolvedConfig);
  if (signature === themeState.lastPlayerNameMeasureSignature) {
    return false;
  }

  if (!entries.length) {
    clearSharedPlayerNameSize(documentRef, themeState);
    return false;
  }

  themeState.measuringPlayerNames = true;
  let nextSharedSizePx;
  try {
    if (resolvedConfig.playerNameLayout === "two-lines") {
      nextSharedSizePx = findTwoLinePlayerNameFitSizePx(playerDisplayNode, entries, windowRef);
    } else {
      const fittedNameSizes = entries.map((entry) =>
        findPlayerNameFitSizePx(
          documentRef,
          themeState,
          windowRef,
          entry.fitNode,
          entry.nameTextNode
        )
      );
      nextSharedSizePx = Math.max(
        PLAYER_NAME_MIN_SIZE_PX,
        Math.min(PLAYER_NAME_MAX_SIZE_PX, ...fittedNameSizes)
      );
    }
  } finally {
    themeState.measuringPlayerNames = false;
  }
  const nextValue = `${nextSharedSizePx.toFixed(2)}px`;
  playerDisplayNode.style.setProperty(SHARED_PLAYER_NAME_SIZE_VARIABLE, nextValue);

  const didChange = nextValue !== String(themeState.lastMeasuredSharedPlayerNameSizePx || "");
  themeState.lastMeasuredSharedPlayerNameSizePx = nextValue;
  themeState.lastPlayerNameMeasureSignature = signature;
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

function setStyleValue(node, name, value) {
  if (!node?.style || !name) {
    return;
  }

  const normalizedValue = String(value);
  node.style.setProperty?.(name, normalizedValue);
  node.style[name] = normalizedValue;
}

function getViewportWidth(documentRef, windowRef = null) {
  const width = Number(windowRef?.innerWidth);
  if (Number.isFinite(width) && width > 0) {
    return width;
  }

  const documentWidth = Number(documentRef?.documentElement?.getBoundingClientRect?.().width);
  if (Number.isFinite(documentWidth) && documentWidth > 0) {
    return documentWidth;
  }

  const bodyWidth = Number(documentRef?.body?.getBoundingClientRect?.().width);
  return Number.isFinite(bodyWidth) && bodyWidth > 0 ? bodyWidth : 0;
}

function getElementRect(node) {
  return node?.getBoundingClientRect?.() || null;
}

function getBoardControlsPortalState(themeState = {}) {
  const portalState = themeState.boardControlsPortal;
  return portalState && typeof portalState === "object" ? portalState : null;
}

function isPortalNode(node) {
  return Boolean(
    node?.closest?.(`[${BOARD_CONTROLS_PORTAL_ATTRIBUTE}="true"]`)
  );
}

function findBoardControls(documentRef) {
  return queryAll(documentRef, BOARD_CONTROLS_SELECTOR)
    .find((node) => !isPortalNode(node)) || null;
}

function createBoardControlsPortal(documentRef, rootNode) {
  const portalNode = documentRef?.createElement?.("div") || null;
  if (!portalNode || !rootNode?.appendChild) {
    return null;
  }

  portalNode.classList?.add?.(BOARD_CONTROLS_PORTAL_CLASS);
  portalNode.setAttribute?.(BOARD_CONTROLS_PORTAL_ATTRIBUTE, "true");
  rootNode.appendChild(portalNode);
  return portalNode;
}

function removeStaleBoardControlsPortals(documentRef, retainedPortalNode = null) {
  queryAll(documentRef, BOARD_CONTROLS_PORTAL_SELECTOR).forEach((node) => {
    if (node && node !== retainedPortalNode) {
      node.remove?.();
    }
  });
}

function syncBoardControlsPortalPosition(documentRef, themeState = {}, windowRef = null) {
  const portalState = getBoardControlsPortalState(themeState);
  const portalNode = portalState?.portalNode || null;
  const sourceControlsNode = portalState?.sourceControlsNode || null;
  if (!portalNode || portalNode.isConnected === false || !sourceControlsNode) {
    return false;
  }

  const controlsRect = getElementRect(sourceControlsNode);
  const viewportWidth = getViewportWidth(documentRef, windowRef);
  if (!controlsRect || !(viewportWidth > 0)) {
    return false;
  }

  const topPx = Math.max(0, Number(controlsRect.top) || 0);
  const rightPx = Math.max(0, viewportWidth - (Number(controlsRect.right) || 0));
  setStyleValue(portalNode, "top", `${topPx.toFixed(1)}px`);
  setStyleValue(portalNode, "right", `${rightPx.toFixed(1)}px`);
  return true;
}

function detachBoardControlsPortalResizeObserver(themeState = {}) {
  const portalState = getBoardControlsPortalState(themeState);
  if (!portalState?.resizeObserver) {
    return;
  }

  try {
    portalState.resizeObserver.disconnect?.();
  } catch (_) {
    // Keep portal cleanup fail-soft.
  }
  portalState.resizeObserver = null;
}

function detachBoardControlsPortalResizeListener(themeState = {}) {
  const portalState = getBoardControlsPortalState(themeState);
  if (!portalState?.windowRef || !portalState.resizeListener) {
    return;
  }

  try {
    portalState.windowRef.removeEventListener?.("resize", portalState.resizeListener);
  } catch (_) {
    // Keep portal cleanup fail-soft.
  }
  portalState.resizeListener = null;
  portalState.windowRef = null;
}

function ensureBoardControlsPortalPositionSync(context = {}) {
  const themeState = context.themeState || {};
  const portalState = getBoardControlsPortalState(themeState);
  if (!portalState) {
    return;
  }

  const syncPosition = () => {
    syncBoardControlsPortalPosition(context.documentRef, themeState, context.windowRef);
  };

  syncPosition();

  const ResizeObserverRef = context.windowRef?.ResizeObserver;
  if (typeof ResizeObserverRef === "function" && !portalState.resizeObserver) {
    portalState.resizeObserver = new ResizeObserverRef(syncPosition);
    [portalState.sourceControlsNode, portalState.mirrorControlsNode].filter(Boolean).forEach((node) => {
      try {
        portalState.resizeObserver.observe?.(node);
      } catch (_) {
        // Keep observer registration fail-soft.
      }
    });
  }

  if (
    context.windowRef &&
    typeof context.windowRef.addEventListener === "function" &&
    portalState.windowRef !== context.windowRef
  ) {
    detachBoardControlsPortalResizeListener(themeState);
    portalState.resizeListener = syncPosition;
    portalState.windowRef = context.windowRef;
    context.windowRef.addEventListener("resize", portalState.resizeListener);
  }
}

function getControlActionNodes(rootNode) {
  return queryAll(rootNode, [
    "button",
    "[role='button']",
    "input[type='button']",
    "input[type='submit']",
  ].join(","));
}

const BOARD_CONTROL_SIGNATURE_ATTRIBUTES = Object.freeze([
  "id",
  "class",
  "role",
  "type",
  "value",
  "disabled",
  "hidden",
  "aria-disabled",
  "aria-hidden",
  "aria-pressed",
  "aria-selected",
  "data-state",
  "data-status",
]);

function buildBoardControlsSignature(rootNode) {
  if (!rootNode) {
    return "";
  }

  const entries = [];
  const queue = [{ node: rootNode, depth: 0 }];
  while (queue.length) {
    const { node, depth } = queue.shift();
    if (!node || Number(node.nodeType) !== 1) {
      continue;
    }

    const attributes = BOARD_CONTROL_SIGNATURE_ATTRIBUTES.map((name) => {
      const attributeValue = node.getAttribute?.(name);
      const propertyValue = ["disabled", "hidden", "value"].includes(name)
        ? String(node?.[name] ?? "")
        : "";
      const serializedAttributeValue =
        attributeValue === null ? "0" : `1:${String(attributeValue)}`;
      return `${name}=${serializedAttributeValue}:${propertyValue}`;
    }).join(";");
    const children = Array.from(node.children || []);
    const leafText = children.length
      ? ""
      : String(node.textContent || "").replaceAll(/\s+/g, " ").trim();
    entries.push(
      `${depth}:${String(node.tagName || "").toLowerCase()}:${attributes}:text=${leafText}`
    );
    children.forEach((child) => queue.push({ node: child, depth: depth + 1 }));
  }
  return entries.join("|");
}

function clearBoardControlsMirror(themeState = {}) {
  const portalState = getBoardControlsPortalState(themeState);
  if (!portalState) {
    return;
  }

  (portalState.mirrorClickHandlers || []).forEach(({ node, handler }) => {
    try {
      node?.removeEventListener?.("click", handler);
    } catch (_) {
      // Keep mirror cleanup fail-soft.
    }
  });
  portalState.mirrorClickHandlers = [];
  try {
    portalState.resizeObserver?.unobserve?.(portalState.mirrorControlsNode);
  } catch (_) {
    // Keep mirror cleanup fail-soft.
  }
  portalState.mirrorControlsNode?.remove?.();
  portalState.mirrorControlsNode = null;
  portalState.mirrorSourceNode = null;
  portalState.mirrorSourceSignature = "";
}

function syncBoardControlsMirror(themeState = {}) {
  const portalState = getBoardControlsPortalState(themeState);
  const sourceControlsNode = portalState?.sourceControlsNode || null;
  const portalNode = portalState?.portalNode || null;
  if (!portalState || !sourceControlsNode || !portalNode) {
    return false;
  }

  const sourceSignature = buildBoardControlsSignature(sourceControlsNode);
  if (
    portalState.mirrorControlsNode?.isConnected !== false &&
    portalState.mirrorControlsNode &&
    portalState.mirrorSourceNode === sourceControlsNode &&
    portalState.mirrorSourceSignature === sourceSignature
  ) {
    return false;
  }

  clearBoardControlsMirror(themeState);

  const mirrorControlsNode = sourceControlsNode.cloneNode?.(true) || null;
  if (!mirrorControlsNode) {
    return false;
  }

  mirrorControlsNode.classList?.add?.(BOARD_CONTROLS_CLASS);
  mirrorControlsNode.setAttribute?.("aria-hidden", "true");
  portalNode.appendChild(mirrorControlsNode);

  const sourceActionNodes = getControlActionNodes(sourceControlsNode);
  const mirrorActionNodes = getControlActionNodes(mirrorControlsNode);
  const mirrorClickHandlers = mirrorActionNodes.map((node, index) => {
    const sourceNode = sourceActionNodes[index] || null;
    const handler = (event) => {
      event?.preventDefault?.();
      event?.stopPropagation?.();
      sourceNode?.click?.();
    };
    node.addEventListener?.("click", handler);
    return {
      handler,
      node,
    };
  });

  portalState.mirrorClickHandlers = mirrorClickHandlers;
  portalState.mirrorControlsNode = mirrorControlsNode;
  portalState.mirrorSourceNode = sourceControlsNode;
  portalState.mirrorSourceSignature = sourceSignature;
  try {
    portalState.resizeObserver?.observe?.(mirrorControlsNode);
  } catch (_) {
    // Keep resize synchronization fail-soft.
  }
  return true;
}

function syncBoardControlsPortal(context = {}) {
  const documentRef = context.documentRef;
  const themeState = context.themeState || {};
  if (!documentRef) {
    return false;
  }

  const existingPortalState = getBoardControlsPortalState(themeState);
  if (
    existingPortalState &&
    existingPortalState?.portalNode?.isConnected !== false &&
    existingPortalState?.sourceControlsNode?.isConnected !== false
  ) {
    removeStaleBoardControlsPortals(documentRef, existingPortalState.portalNode);
    syncBoardControlsMirror(themeState);
    ensureBoardControlsPortalPositionSync(context);
    return true;
  }

  if (existingPortalState) {
    restoreBoardControlsPortal(themeState);
  }
  removeStaleBoardControlsPortals(documentRef);

  const sourceControlsNode = findBoardControls(documentRef);
  const rootNode = getRootContainer(documentRef);
  if (!sourceControlsNode || !rootNode || rootNode.contains?.(sourceControlsNode) !== true) {
    return false;
  }

  const controlsRect = getElementRect(sourceControlsNode);
  if (!controlsRect) {
    return false;
  }

  const portalNode = createBoardControlsPortal(documentRef, rootNode);
  if (!portalNode) {
    portalNode?.remove?.();
    return false;
  }

  themeState.boardControlsPortal = {
    mirrorClickHandlers: [],
    mirrorControlsNode: null,
    mirrorSourceNode: null,
    mirrorSourceSignature: "",
    portalNode,
    resizeListener: null,
    resizeObserver: null,
    sourceControlsNode,
    windowRef: null,
  };

  syncBoardControlsMirror(themeState);
  ensureBoardControlsPortalPositionSync(context);
  return true;
}

function restoreBoardControlsPortal(themeState = {}) {
  const portalState = getBoardControlsPortalState(themeState);
  if (!portalState) {
    return false;
  }

  detachBoardControlsPortalResizeObserver(themeState);
  detachBoardControlsPortalResizeListener(themeState);
  clearBoardControlsMirror(themeState);

  portalState.portalNode?.remove?.();
  themeState.boardControlsPortal = null;
  return true;
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
  clearPlayerCardPartMarkers(documentRef);
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

      return Boolean(node.querySelector?.(".ad-ext-player-score"));
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
    markPlayerCardParts(cardNode);
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
    syncX01TwoPlayerScoreboardState(cardNode);
  });
}

export function clearX01TwoPlayerLayoutState(documentRef) {
  clearPlayerMarkers(documentRef);
  clearX01TwoPlayerScoreboardState(documentRef);
}

export function hasX01TwoPlayerPlayerStateMutation(mutations = []) {
  if (!Array.isArray(mutations) || !mutations.length) {
    return false;
  }

  if (mutations.every((mutation) => isX01TwoPlayerScoreboardStateMutation(mutation))) {
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
        lastPlayerNameMeasureSignature: "",
        measuringPlayerNames: false,
        nameMeasureContext: null,
        boardVisibilityOverride: null,
        boardControlsPortal: null,
        lastActivePlayerIndex: Number.NaN,
        hydrationPlayerCardNodes: [],
        hydrationRechecksInitialized: false,
        hydrationRecheckTimerIds: [],
        hydrationRecheckWindowRef: null,
      };
    },
    getObservedAttributeFilter() {
      return ["class"];
    },
    shouldScheduleMutation(mutations = []) {
      return hasX01TwoPlayerPlayerStateMutation(mutations);
    },
    onActivate(context = {}) {
      const resolvedConfig = syncThemeConfigAttributes(context.documentRef, context.featureConfig);
      ensureThemeBoardVisible(context.documentRef, context.themeState);
      syncTurnPointsForPlayerChange(context.documentRef, context.gameState, context.themeState);
      syncX01TwoPlayerLayoutState(context.documentRef, context.gameState);
      syncSharedPlayerNameSize(
        context.documentRef,
        context.themeState,
        context.windowRef,
        resolvedConfig
      );
      ensureTurnResizeObserver(context);
      syncBoardControlsPortal(context);
      scheduleHydrationRechecks(context);
    },
    onDeactivate(context = {}) {
      clearHydrationRechecks(context.themeState);
      restoreBoardControlsPortal(context.themeState);
      restoreThemeBoardVisibility(context.documentRef, context.themeState);
      detachTurnResizeObserver(context.themeState);
      try {
        context.themeState?.turnResizeObserver?.disconnect?.();
      } catch (_) {
        // Keep theme cleanup fail-soft.
      }
      if (context.themeState) {
        context.themeState.turnResizeObserver = null;
        context.themeState.lastActivePlayerIndex = Number.NaN;
        context.themeState.hydrationPlayerCardNodes = [];
        context.themeState.hydrationRechecksInitialized = false;
      }
      clearLiveTurnHeight(context.documentRef, context.themeState);
      clearSharedPlayerNameSize(context.documentRef, context.themeState);
      clearThemeConfigAttributes(context.documentRef);
      clearX01TwoPlayerLayoutState(context.documentRef);
    },
  });
}
