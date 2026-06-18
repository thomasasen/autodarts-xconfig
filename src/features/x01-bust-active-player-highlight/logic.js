import {
  BUST_ACTIVE_CLASS,
  BUST_CARD_STYLE_PROPERTIES,
  BUST_SHAKE_CLASS,
  FALLBACK_BUST_CARD_VISUALS,
} from "./style.js";
import { getX01PlayerSurfaceSnapshot } from "../shared/x01-player-surface-adapter.js";
import { isX01VariantText } from "../../domain/variant-rules.js";

export const TURN_POINTS_SELECTOR = ".ad-ext-turn-points";
export const TURN_THROW_SELECTOR = "#ad-ext-turn .ad-ext-turn-throw, .ad-ext-turn-throw";
export const ACTIVE_PLAYER_SELECTOR =
  "#ad-ext-player-display .ad-ext-player.ad-ext-player-active, #ad-ext-player-display .ad-ext-player-active, .ad-ext-player.ad-ext-player-active, .ad-ext-player-active";
export const SHAKE_DURATION_MS = 3000;
const BUST_INLINE_STYLE_PROPERTIES = Object.freeze([
  "background",
  "background-color",
  "border",
  "border-color",
  "border-style",
  "border-width",
  "box-shadow",
]);

function normalizeText(value) {
  return String(value || "")
    .replaceAll("\u00a0", " ")
    .replaceAll(/\s+/g, " ")
    .trim();
}

function queryOne(rootNode, selector) {
  if (!rootNode || typeof rootNode.querySelector !== "function") {
    return null;
  }

  try {
    return rootNode.querySelector(selector);
  } catch (_) {
    return null;
  }
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

function readVariantText(documentRef) {
  const variantElement =
    documentRef && typeof documentRef.getElementById === "function"
      ? documentRef.getElementById("ad-ext-game-variant")
      : null;
  return normalizeText(variantElement?.textContent || "");
}

export function isX01BustFeatureActive(context = {}) {
  const gameState = context.gameState || null;
  if (gameState && typeof gameState.isX01Variant === "function") {
    return gameState.isX01Variant({
      allowMissing: false,
      allowEmpty: false,
      allowNumeric: true,
    });
  }

  return isX01VariantText(readVariantText(context.documentRef), {
    allowMissing: false,
    allowEmpty: false,
    allowNumeric: true,
  });
}

export function hasVisibleBustTurnScore(documentRef) {
  return queryAll(documentRef, TURN_POINTS_SELECTOR).some((node) => {
    return normalizeText(node?.textContent || "").toUpperCase() === "BUST";
  });
}

export function findActiveX01PlayerCard(documentRef) {
  const snapshot = getX01PlayerSurfaceSnapshot(documentRef);
  const activePlayer = Array.isArray(snapshot.players)
    ? snapshot.players.find((player) => player?.isActive === true)
    : null;
  if (activePlayer?.node) {
    return activePlayer.node;
  }

  return queryOne(documentRef, ACTIVE_PLAYER_SELECTOR);
}

function readComputedValue(style, propertyName, fallbackValue) {
  const value = String(style?.[propertyName] || "").trim();
  return value || fallbackValue;
}

export function resolveBustCardVisuals(documentRef, windowRef = null) {
  const throwNode = queryOne(documentRef, TURN_THROW_SELECTOR);
  const getComputedStyleRef =
    windowRef && typeof windowRef.getComputedStyle === "function"
      ? windowRef.getComputedStyle.bind(windowRef)
      : null;
  const style = throwNode && getComputedStyleRef ? getComputedStyleRef(throwNode) : null;

  return {
    background: readComputedValue(style, "background", FALLBACK_BUST_CARD_VISUALS.background),
    backgroundColor: readComputedValue(
      style,
      "backgroundColor",
      FALLBACK_BUST_CARD_VISUALS.backgroundColor
    ),
    border: readComputedValue(style, "border", FALLBACK_BUST_CARD_VISUALS.border),
    borderColor: readComputedValue(style, "borderColor", "rgb(207, 52, 52)"),
    borderStyle: readComputedValue(style, "borderStyle", "solid"),
    borderWidth: readComputedValue(style, "borderWidth", "0.8px"),
    boxShadow: readComputedValue(style, "boxShadow", FALLBACK_BUST_CARD_VISUALS.boxShadow),
  };
}

function setStylePropertyIfChanged(node, propertyName, value) {
  const normalizedValue = String(value || "").trim();
  if (!node?.style || !propertyName || !normalizedValue) {
    return;
  }
  if (node.style.getPropertyValue?.(propertyName) !== normalizedValue) {
    node.style.setProperty(propertyName, normalizedValue);
  }
}

function setImportantStyleProperty(node, propertyName, value) {
  const normalizedValue = String(value || "").trim();
  if (!node?.style || !propertyName || !normalizedValue) {
    return;
  }
  if (
    node.style.getPropertyValue?.(propertyName) !== normalizedValue ||
    node.style.getPropertyPriority?.(propertyName) !== "important"
  ) {
    node.style.setProperty(propertyName, normalizedValue, "important");
  }
}

function applyBustInlineVisuals(node, visuals = {}) {
  setImportantStyleProperty(node, "border", visuals.border || FALLBACK_BUST_CARD_VISUALS.border);
  setImportantStyleProperty(node, "border-color", visuals.borderColor || "rgb(207, 52, 52)");
  setImportantStyleProperty(node, "border-style", visuals.borderStyle || "solid");
  setImportantStyleProperty(node, "border-width", visuals.borderWidth || "0.8px");
  setImportantStyleProperty(
    node,
    "box-shadow",
    visuals.boxShadow || FALLBACK_BUST_CARD_VISUALS.boxShadow
  );
}

function findBustFillNode(node) {
  return node?.querySelector?.(":scope > .chakra-stack") || node;
}

function clearBustInlineVisuals(node) {
  if (!node?.style) {
    return;
  }
  BUST_INLINE_STYLE_PROPERTIES.forEach((propertyName) => {
    if (node.style.getPropertyValue?.(propertyName)) {
      node.style.removeProperty(propertyName);
    }
  });
}

function applyBustFillVisuals(node, visuals = {}) {
  const fillNode = findBustFillNode(node);
  if (fillNode !== node) {
    ["background", "background-color"].forEach((propertyName) => {
      if (node?.style?.getPropertyValue?.(propertyName)) {
        node.style.removeProperty(propertyName);
      }
    });
  }
  setImportantStyleProperty(
    fillNode,
    "background",
    visuals.background || FALLBACK_BUST_CARD_VISUALS.background
  );
  setImportantStyleProperty(
    fillNode,
    "background-color",
    visuals.backgroundColor || FALLBACK_BUST_CARD_VISUALS.backgroundColor
  );
}

function applyBustCardVisuals(node, visuals = {}) {
  setStylePropertyIfChanged(
    node,
    "--ad-ext-x01-bust-active-player-background",
    visuals.background || FALLBACK_BUST_CARD_VISUALS.background
  );
  setStylePropertyIfChanged(
    node,
    "--ad-ext-x01-bust-active-player-background-color",
    visuals.backgroundColor || FALLBACK_BUST_CARD_VISUALS.backgroundColor
  );
  setStylePropertyIfChanged(
    node,
    "--ad-ext-x01-bust-active-player-border",
    visuals.border || FALLBACK_BUST_CARD_VISUALS.border
  );
  setStylePropertyIfChanged(
    node,
    "--ad-ext-x01-bust-active-player-box-shadow",
    visuals.boxShadow || FALLBACK_BUST_CARD_VISUALS.boxShadow
  );
  applyBustInlineVisuals(node, visuals);
  applyBustFillVisuals(node, visuals);
}

function clearBustCardVisuals(node) {
  if (!node?.style) {
    return;
  }
  BUST_CARD_STYLE_PROPERTIES.forEach((propertyName) => {
    if (node.style.getPropertyValue?.(propertyName)) {
      node.style.removeProperty(propertyName);
    }
  });
  clearBustInlineVisuals(node);
  const fillNode = findBustFillNode(node);
  if (fillNode !== node) {
    clearBustInlineVisuals(fillNode);
  }
}

function getTimerApi(windowRef = null) {
  return {
    setTimeout:
      windowRef && typeof windowRef.setTimeout === "function"
        ? windowRef.setTimeout.bind(windowRef)
        : setTimeout,
    clearTimeout:
      windowRef && typeof windowRef.clearTimeout === "function"
        ? windowRef.clearTimeout.bind(windowRef)
        : clearTimeout,
  };
}

function clearShakeTimeout(state, windowRef = null) {
  if (!state?.shakeTimeoutHandle) {
    return;
  }

  getTimerApi(windowRef).clearTimeout(state.shakeTimeoutHandle);
  state.shakeTimeoutHandle = null;
}

function clearNodeState(node) {
  if (!node?.classList) {
    return;
  }
  node.classList.remove(BUST_SHAKE_CLASS);
  node.classList.remove(BUST_ACTIVE_CLASS);
  clearBustCardVisuals(node);
}

export function createBustActivePlayerHighlightState() {
  return {
    wasBust: false,
    activeNode: null,
    shakeNode: null,
    shakeTimeoutHandle: null,
  };
}

export function triggerBustShake(node, state, windowRef = null) {
  if (!node?.classList || !state) {
    return;
  }

  clearShakeTimeout(state, windowRef);
  if (state.shakeNode && state.shakeNode !== node) {
    state.shakeNode.classList?.remove?.(BUST_SHAKE_CLASS);
  }

  node.classList.remove(BUST_SHAKE_CLASS);
  Number(node.offsetWidth || node.getBoundingClientRect?.().width || 0);
  node.classList.add(BUST_SHAKE_CLASS);
  state.shakeNode = node;

  const { setTimeout: setTimeoutRef } = getTimerApi(windowRef);
  state.shakeTimeoutHandle = setTimeoutRef(() => {
    node.classList?.remove?.(BUST_SHAKE_CLASS);
    if (state.shakeNode === node) {
      state.shakeNode = null;
    }
    state.shakeTimeoutHandle = null;
  }, SHAKE_DURATION_MS);
}

export function clearBustActivePlayerHighlightState(state, windowRef = null) {
  if (!state) {
    return;
  }

  clearShakeTimeout(state, windowRef);
  if (state.shakeNode) {
    state.shakeNode.classList?.remove?.(BUST_SHAKE_CLASS);
  }
  if (state.activeNode) {
    clearNodeState(state.activeNode);
  }
  state.wasBust = false;
  state.activeNode = null;
  state.shakeNode = null;
}

export function syncBustActivePlayerHighlight(context = {}, state = createBustActivePlayerHighlightState()) {
  const documentRef = context.documentRef;
  const windowRef = context.windowRef || null;
  const isSupported = documentRef && isX01BustFeatureActive(context);
  const isBust = Boolean(isSupported && hasVisibleBustTurnScore(documentRef));

  if (!isBust) {
    clearBustActivePlayerHighlightState(state, windowRef);
    return {
      isBust: false,
      activeNode: null,
      shook: false,
    };
  }

  const activeNode = findActiveX01PlayerCard(documentRef);
  if (!activeNode?.classList) {
    clearBustActivePlayerHighlightState(state, windowRef);
    state.wasBust = true;
    return {
      isBust: true,
      activeNode: null,
      shook: false,
    };
  }

  if (state.activeNode && state.activeNode !== activeNode) {
    clearNodeState(state.activeNode);
  }

  const enteredBust = state.wasBust !== true;
  const visuals = resolveBustCardVisuals(documentRef, windowRef);
  activeNode.classList.add(BUST_ACTIVE_CLASS);
  applyBustCardVisuals(activeNode, visuals);
  state.activeNode = activeNode;
  state.wasBust = true;

  if (enteredBust) {
    triggerBustShake(activeNode, state, windowRef);
  }

  return {
    isBust: true,
    activeNode,
    shook: enteredBust,
  };
}
