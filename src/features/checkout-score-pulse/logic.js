import {
  HIGHLIGHT_CLASS,
  getEffectClass,
  getEffectClassList,
} from "./style.js";
import { collectVisibleCheckoutRoute, resolveCheckoutSurfaceSemantics } from "../x01-checkout-route.js";
import { resolveX01CheckoutContext } from "../x01-checkout-context.js";

export const SCORE_SELECTOR = "p.ad-ext-player-score";
export const ACTIVE_SCORE_SELECTOR =
  ".ad-ext-player.ad-ext-player-active p.ad-ext-player-score, .ad-ext-player-active p.ad-ext-player-score";
export const SUGGESTION_SELECTOR = ".suggestion";
export const VARIANT_ELEMENT_ID = "ad-ext-game-variant";

export function getCheckoutSuggestionState(context = {}) {
  const checkoutContext = resolveX01CheckoutContext({
    ...context,
    x01Rules: context.x01Rules,
  });
  const outMode =
    context.gameState && typeof context.gameState.getOutMode === "function"
      ? String(context.gameState.getOutMode() || "")
      : String(context.outMode || "");
  const dartsRemaining = getReliableDartsRemaining(context);
  const suggestionSignal = resolveCheckoutSuggestionSignal({
    ...context,
    outMode,
    activeScore: checkoutContext.activeScore,
    dartsRemaining,
  });
  if (!suggestionSignal) {
    return null;
  }

  return suggestionSignal.shouldHighlight === true && Number.isFinite(checkoutContext.activeScore);
}

function isDirectCheckoutPossible(activeScore, outMode, dartsRemaining, x01Rules) {
  if (!Number.isFinite(activeScore) || !x01Rules || dartsRemaining < 1) {
    return false;
  }

  if (typeof x01Rules.getPreferredOneDartCheckoutSegment === "function") {
    return Boolean(x01Rules.getPreferredOneDartCheckoutSegment(activeScore, outMode));
  }

  if (typeof x01Rules.isCheckoutPossibleFromScoreForOutModeWithDarts === "function") {
    return x01Rules.isCheckoutPossibleFromScoreForOutModeWithDarts(activeScore, outMode, 1);
  }

  return false;
}

function canFinishWithSegment(activeScore, segmentName, outMode, x01Rules) {
  if (!segmentName || !Number.isFinite(activeScore) || !x01Rules) {
    return false;
  }

  if (typeof x01Rules.canFinishWithSegment === "function") {
    return x01Rules.canFinishWithSegment(activeScore, segmentName, outMode);
  }

  return false;
}

function resolveExplicitCheckoutSuggestionState(x01Rules, suggestionText, activeScore, outMode, dartsRemaining) {
  if (typeof x01Rules?.parseCheckoutSuggestionStateForScore !== "function") {
    return null;
  }
  return x01Rules.parseCheckoutSuggestionStateForScore(
    suggestionText,
    activeScore,
    outMode,
    dartsRemaining
  );
}

function resolveRouteLessCheckoutSuggestionSignal(x01Rules, suggestionText, outMode) {
  const fallbackSuggestionState =
    typeof x01Rules.parseCheckoutSuggestionState === "function"
      ? x01Rules.parseCheckoutSuggestionState(suggestionText, outMode)
      : null;
  if (fallbackSuggestionState === false) {
    return {
      shouldHighlight: false,
      shouldFallbackToScore: false,
    };
  }
  return null;
}

function resolveCheckoutSuggestionSignal(context = {}) {
  const documentRef = context.documentRef;
  const x01Rules = context.x01Rules;
  const windowRef = context.windowRef;
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
  const routeSegments = collectVisibleCheckoutRoute(documentRef, windowRef, x01Rules);

  const explicitSuggestionState = resolveExplicitCheckoutSuggestionState(
    x01Rules,
    suggestionText,
    activeScore,
    outMode,
    dartsRemaining
  );
  if (explicitSuggestionState === false) {
    return {
      shouldHighlight: false,
      shouldFallbackToScore: false,
    };
  }

  if (!routeSegments.length) {
    return resolveRouteLessCheckoutSuggestionSignal(x01Rules, suggestionText, outMode);
  }

  const checkoutSurface = resolveCheckoutSurfaceSemantics({
    routeSegments,
    activeScore,
    outMode,
    dartsRemaining,
    x01Rules,
  });
  const selectionSource = String(checkoutSurface?.selectionSource || "none");
  const nextSegment =
    Array.isArray(checkoutSurface?.authoritativeRouteSegments) &&
    checkoutSurface.authoritativeRouteSegments.length
      ? String(checkoutSurface.authoritativeRouteSegments[0] || "")
      : "";
  const routeAccepted =
    selectionSource !== "score-route" &&
    selectionSource !== "invalid-visible-route" &&
    selectionSource !== "none";

  return {
    shouldHighlight:
      routeAccepted &&
      (!Number.isFinite(dartsRemaining) || dartsRemaining >= 1) &&
      canFinishWithSegment(activeScore, nextSegment, outMode, x01Rules),
    shouldFallbackToScore: selectionSource === "score-route" || selectionSource === "invalid-visible-route",
  };
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

function queryAll(rootNode, selector) {
  if (!rootNode || typeof rootNode.querySelectorAll !== "function") {
    return [];
  }

  return Array.from(rootNode.querySelectorAll(selector));
}

function resolveScoreLookupSurface(documentRef, options = {}) {
  const playerSurfaceSnapshot = options.playerSurfaceSnapshot || null;
  const rootNode =
    options.rootNode || playerSurfaceSnapshot?.playerDisplayRoot || documentRef;
  return { playerSurfaceSnapshot, rootNode };
}

export function getAllScoreNodes(documentRef, options = {}) {
  const { rootNode } = resolveScoreLookupSurface(documentRef, options);
  return queryAll(rootNode, SCORE_SELECTOR);
}

export function getScoreNodes(documentRef, gameState = null, options = {}) {
  const { playerSurfaceSnapshot, rootNode } = resolveScoreLookupSurface(documentRef, options);
  if (!rootNode || typeof rootNode.querySelectorAll !== "function") {
    return [];
  }

  const activeScores = queryAll(rootNode, ACTIVE_SCORE_SELECTOR);
  if (activeScores.length) {
    return activeScores;
  }

  const allScores = getAllScoreNodes(documentRef, { playerSurfaceSnapshot });
  const activePlayerIndex =
    gameState && typeof gameState.getActivePlayerIndex === "function"
      ? Number(gameState.getActivePlayerIndex())
      : Number.NaN;
  if (Number.isFinite(activePlayerIndex) && activePlayerIndex >= 0) {
    const playerRows = playerSurfaceSnapshot?.playerDisplayRoot
      ? playerSurfaceSnapshot.playerCards.filter((rowNode) =>
          Boolean(rowNode?.querySelector?.(SCORE_SELECTOR))
        )
      : queryAll(rootNode, ".ad-ext-player").filter((rowNode) => {
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

  const activeScore = resolveX01CheckoutContext({
    ...context,
    outMode,
    dartsRemaining: getReliableDartsRemaining(context),
    x01Rules,
  }).activeScore;
  const dartsRemaining = getReliableDartsRemaining(context);
  const suggestionSignal = resolveCheckoutSuggestionSignal({
    ...context,
    outMode,
    activeScore,
    dartsRemaining,
  });
  const scoreCheckoutPossible = isDirectCheckoutPossible(
    activeScore,
    outMode,
    Number.isFinite(dartsRemaining) ? dartsRemaining : 3,
    x01Rules
  );

  if (triggerSource === "score-only") {
    return scoreCheckoutPossible;
  }

  if (triggerSource === "suggestion-only") {
    return suggestionSignal?.shouldHighlight === true;
  }

  if (!suggestionSignal) {
    return scoreCheckoutPossible;
  }

  if (suggestionSignal.shouldFallbackToScore) {
    return scoreCheckoutPossible;
  }

  return suggestionSignal.shouldHighlight === true;
}

export function applyHighlightState(nodes, options = {}) {
  const shouldHighlight = Boolean(options.shouldHighlight);
  const effectClass = getEffectClass(options.effect);
  const effectClassList = getEffectClassList();

  nodes.forEach((node) => {
    if (!node?.classList) {
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
