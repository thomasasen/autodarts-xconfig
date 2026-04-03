import {
  HIGHLIGHT_CLASS,
  getEffectClass,
  getEffectClassList,
} from "./style.js";

export const SCORE_SELECTOR = "p.ad-ext-player-score";
export const ACTIVE_SCORE_SELECTOR =
  ".ad-ext-player.ad-ext-player-active p.ad-ext-player-score, .ad-ext-player-active p.ad-ext-player-score";
export const SUGGESTION_SELECTOR = ".suggestion";
export const VARIANT_ELEMENT_ID = "ad-ext-game-variant";

export function parseScore(text) {
  const match = String(text || "").match(/\d+/);
  if (!match) {
    return null;
  }

  const value = Number(match[0]);
  return Number.isFinite(value) ? value : null;
}

export function getActiveScoreValue(context = {}) {
  const gameState = context.gameState;
  const documentRef = context.documentRef;

  if (gameState && typeof gameState.getActiveScore === "function") {
    const score = gameState.getActiveScore();
    if (Number.isFinite(score)) {
      return score;
    }
  }

  if (!documentRef || typeof documentRef.querySelector !== "function") {
    return null;
  }

  const node =
    documentRef.querySelector(ACTIVE_SCORE_SELECTOR) ||
    documentRef.querySelector(SCORE_SELECTOR);

  return parseScore(node?.textContent || "");
}

export function getCheckoutSuggestionState(context = {}) {
  const documentRef = context.documentRef;
  const x01Rules = context.x01Rules;
  const outMode = String(context.outMode || "");
  const activeScore = context.activeScore;
  const dartsRemaining = context.dartsRemaining;

  if (!documentRef || typeof documentRef.querySelector !== "function") {
    return null;
  }

  const suggestionNode = documentRef.querySelector(SUGGESTION_SELECTOR);
  if (!suggestionNode) {
    return null;
  }

  if (!x01Rules || typeof x01Rules.parseCheckoutSuggestionState !== "function") {
    return null;
  }

  const suggestionText = suggestionNode.textContent || "";

  if (typeof x01Rules.parseCheckoutSuggestionStateForScore === "function") {
    return x01Rules.parseCheckoutSuggestionStateForScore(
      suggestionText,
      activeScore,
      outMode,
      dartsRemaining
    );
  }

  return x01Rules.parseCheckoutSuggestionState(suggestionText, outMode);
}

function normalizeDartsRemaining(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return null;
  }

  const normalized = Math.trunc(numeric);
  if (normalized < 0) {
    return 0;
  }
  if (normalized > 3) {
    return 3;
  }
  return normalized;
}

export function getReliableDartsRemaining(context = {}) {
  const explicit = normalizeDartsRemaining(context.dartsRemaining);
  if (Number.isFinite(explicit)) {
    return explicit;
  }

  const gameState = context.gameState;
  const activeThrows =
    gameState && typeof gameState.getActiveThrows === "function" ? gameState.getActiveThrows() : null;
  if (Array.isArray(activeThrows)) {
    return normalizeDartsRemaining(3 - activeThrows.length);
  }

  const activeTurn =
    gameState && typeof gameState.getActiveTurn === "function" ? gameState.getActiveTurn() : null;
  if (Array.isArray(activeTurn?.throws)) {
    return normalizeDartsRemaining(3 - activeTurn.throws.length);
  }

  return null;
}

export function getAllScoreNodes(documentRef) {
  if (!documentRef || typeof documentRef.querySelectorAll !== "function") {
    return [];
  }

  return Array.from(documentRef.querySelectorAll(SCORE_SELECTOR));
}

export function getScoreNodes(documentRef, gameState = null) {
  if (!documentRef || typeof documentRef.querySelectorAll !== "function") {
    return [];
  }

  const activeScores = Array.from(documentRef.querySelectorAll(ACTIVE_SCORE_SELECTOR));
  if (activeScores.length) {
    return activeScores;
  }

  const allScores = getAllScoreNodes(documentRef);
  const activePlayerIndex =
    gameState && typeof gameState.getActivePlayerIndex === "function"
      ? Number(gameState.getActivePlayerIndex())
      : NaN;
  if (Number.isFinite(activePlayerIndex) && activePlayerIndex >= 0) {
    const playerRows = Array.from(documentRef.querySelectorAll(".ad-ext-player")).filter((rowNode) => {
      return Boolean(rowNode?.querySelector?.(SCORE_SELECTOR));
    });
    const activeRow = playerRows[activePlayerIndex] || null;
    const activeRowScores = activeRow
      ? Array.from(activeRow.querySelectorAll?.(SCORE_SELECTOR) || [])
      : [];
    return activeRowScores.length === 1 ? activeRowScores : [];
  }

  return allScores.length === 1 ? allScores : [];
}

export function isX01Active(context = {}) {
  const gameState = context.gameState;
  const documentRef = context.documentRef;
  const variantRules = context.variantRules;

  if (gameState && typeof gameState.isX01Variant === "function") {
    return gameState.isX01Variant({
      allowMissing: false,
      allowEmpty: false,
      allowNumeric: true,
    });
  }

  if (!documentRef || !variantRules || typeof variantRules.isX01VariantText !== "function") {
    return false;
  }

  const variantElement =
    typeof documentRef.getElementById === "function"
      ? documentRef.getElementById(VARIANT_ELEMENT_ID)
      : null;

  const variantText = String(variantElement?.textContent || "");
  return variantRules.isX01VariantText(variantText, {
    allowMissing: false,
    allowEmpty: false,
    allowNumeric: true,
  });
}

export function computeShouldHighlight(context = {}) {
  const triggerSource = String(context.triggerSource || "suggestion-first");
  const x01Rules = context.x01Rules;
  const outMode =
    context.gameState && typeof context.gameState.getOutMode === "function"
      ? String(context.gameState.getOutMode() || "")
      : String(context.outMode || "");

  if (!isX01Active(context)) {
    return false;
  }

  const activeScore = getActiveScoreValue(context);
  const dartsRemaining = getReliableDartsRemaining(context);
  const suggestionState = getCheckoutSuggestionState({
    ...context,
    outMode,
    activeScore,
    dartsRemaining,
  });
  const scoreCheckoutPossible =
    x01Rules && typeof x01Rules.isCheckoutPossibleFromScoreForOutModeWithDarts === "function"
      ? x01Rules.isCheckoutPossibleFromScoreForOutModeWithDarts(
          activeScore,
          outMode,
          Number.isFinite(dartsRemaining) ? dartsRemaining : 3
        )
      : x01Rules && typeof x01Rules.isCheckoutPossibleFromScoreForOutMode === "function"
        ? x01Rules.isCheckoutPossibleFromScoreForOutMode(activeScore, outMode)
      : x01Rules && typeof x01Rules.isCheckoutPossibleFromScore === "function"
        ? x01Rules.isCheckoutPossibleFromScore(activeScore)
      : false;

  if (triggerSource === "score-only") {
    return scoreCheckoutPossible;
  }

  if (triggerSource === "suggestion-only") {
    return suggestionState === true;
  }

  return suggestionState !== null ? suggestionState : scoreCheckoutPossible;
}

export function applyHighlightState(nodes, options = {}) {
  const shouldHighlight = Boolean(options.shouldHighlight);
  const effectClass = getEffectClass(options.effect);
  const effectClassList = getEffectClassList();

  nodes.forEach((node) => {
    if (!node || !node.classList) {
      return;
    }

    if (shouldHighlight) {
      node.classList.add(HIGHLIGHT_CLASS);
      effectClassList.forEach((className) => {
        node.classList.toggle(className, className === effectClass);
      });
      return;
    }

    node.classList.remove(HIGHLIGHT_CLASS);
    effectClassList.forEach((className) => {
      node.classList.remove(className);
    });
  });
}

export function clearHighlightState(nodes) {
  applyHighlightState(nodes, {
    shouldHighlight: false,
    effect: "pulse",
  });
}
