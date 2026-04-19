import {
  collectVisibleCheckoutRouteEntries,
  resolveCheckoutSurfaceSemantics,
} from "./x01-checkout-route.js";

const ACTIVE_SCORE_SELECTORS = Object.freeze([
  ".ad-ext-player.ad-ext-player-active p.ad-ext-player-score",
  ".ad-ext-player-active p.ad-ext-player-score",
  "p.ad-ext-player-score",
]);

export function parseScore(text) {
  const match = String(text || "").match(/-?\d+/);
  if (!match) {
    return Number.NaN;
  }

  const numeric = Number(match[0]);
  return Number.isFinite(numeric) ? numeric : Number.NaN;
}

function normalizeScore(value) {
  if (value === null || typeof value === "undefined") {
    return Number.NaN;
  }

  if (typeof value === "string" && !value.trim()) {
    return Number.NaN;
  }

  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric >= 0 ? numeric : Number.NaN;
}

function isElementStyleVisible(element, windowRef) {
  try {
    const style = windowRef?.getComputedStyle?.(element);
    if (!style) {
      return true;
    }
    return !(
      style.display === "none" ||
      style.visibility === "hidden" ||
      style.opacity === "0"
    );
  } catch (_) {
    return true;
  }
}

function isElementVisible(element, windowRef) {
  if (!element || typeof element.getBoundingClientRect !== "function") {
    return false;
  }

  const rect = element.getBoundingClientRect();
  if (!(rect.width > 0 && rect.height > 0)) {
    return false;
  }

  return isElementStyleVisible(element, windowRef);
}

function getNodeVisualWeight(node, windowRef) {
  if (!node || typeof node.getBoundingClientRect !== "function") {
    return 0;
  }

  try {
    const rect = node.getBoundingClientRect();
    const fontSize = Number.parseFloat(windowRef?.getComputedStyle?.(node)?.fontSize) || 0;
    const area =
      Number.isFinite(rect?.width) && Number.isFinite(rect?.height)
        ? rect.width * rect.height
        : 0;
    return fontSize * 10000 + area;
  } catch (_) {
    return 0;
  }
}

function compareScoreCandidates(left, right) {
  const leftRank = Number.isFinite(left?.selectorRank) ? left.selectorRank : Number.MAX_SAFE_INTEGER;
  const rightRank = Number.isFinite(right?.selectorRank) ? right.selectorRank : Number.MAX_SAFE_INTEGER;
  if (leftRank !== rightRank) {
    return leftRank - rightRank;
  }

  const leftWeight = Number.isFinite(left?.weight) ? left.weight : 0;
  const rightWeight = Number.isFinite(right?.weight) ? right.weight : 0;
  if (leftWeight !== rightWeight) {
    return rightWeight - leftWeight;
  }

  return 0;
}

function collectScoreCandidates(documentRef, windowRef) {
  if (!documentRef || typeof documentRef.querySelectorAll !== "function") {
    return [];
  }

  const candidateMap = new Map();
  ACTIVE_SCORE_SELECTORS.forEach((selector, selectorRank) => {
    Array.from(documentRef.querySelectorAll(selector)).forEach((node) => {
      const value = normalizeScore(parseScore(node?.textContent || ""));
      if (!Number.isFinite(value)) {
        return;
      }

      const existing = candidateMap.get(node);
      const nextCandidate = {
        node,
        value,
        selectorRank,
        weight: getNodeVisualWeight(node, windowRef),
        visible: isElementVisible(node, windowRef),
        styleVisible: isElementStyleVisible(node, windowRef),
      };

      if (!existing || compareScoreCandidates(nextCandidate, existing) < 0) {
        candidateMap.set(node, nextCandidate);
      }
    });
  });

  return Array.from(candidateMap.values()).sort(compareScoreCandidates);
}

export function readDomActiveScore(documentRef, windowRef) {
  const candidates = collectScoreCandidates(documentRef, windowRef);
  if (!candidates.length) {
    return Number.NaN;
  }

  const visibleCandidate = candidates.find((candidate) => candidate.visible);
  if (visibleCandidate) {
    return visibleCandidate.value;
  }

  const styleVisibleCandidate = candidates.find((candidate) => candidate.styleVisible);
  if (styleVisibleCandidate) {
    return styleVisibleCandidate.value;
  }

  return candidates[0].value;
}

function readGameStateActiveScore(gameState) {
  if (!gameState || typeof gameState.getActiveScore !== "function") {
    return Number.NaN;
  }
  return normalizeScore(gameState.getActiveScore());
}

function normalizeDartsRemaining(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return Number.NaN;
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

function resolveDartsRemaining(gameState, explicitValue) {
  const explicit = normalizeDartsRemaining(explicitValue);
  if (Number.isFinite(explicit)) {
    return explicit;
  }

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

  return Number.NaN;
}

export function resolveX01ActiveScoreState(context = {}) {
  const gameStateScore = readGameStateActiveScore(context.gameState);
  const domScore = readDomActiveScore(context.documentRef, context.windowRef);

  if (Number.isFinite(domScore) && Number.isFinite(gameStateScore)) {
    if (domScore === gameStateScore) {
      return {
        activeScore: domScore,
        domScore,
        gameStateScore,
        scoreSource: "game-state+dom",
        scoreAgreement: "match",
      };
    }

    return {
      activeScore: gameStateScore,
      domScore,
      gameStateScore,
      scoreSource: "game-state-preferred",
      scoreAgreement: "mismatch",
    };
  }

  if (Number.isFinite(domScore)) {
    return {
      activeScore: domScore,
      domScore,
      gameStateScore,
      scoreSource: "dom",
      scoreAgreement: "dom-only",
    };
  }

  if (Number.isFinite(gameStateScore)) {
    return {
      activeScore: gameStateScore,
      domScore,
      gameStateScore,
      scoreSource: "game-state",
      scoreAgreement: "game-state-only",
    };
  }

  return {
    activeScore: Number.NaN,
    domScore,
    gameStateScore,
    scoreSource: "none",
    scoreAgreement: "none",
  };
}

function resolveCheckoutScoreState(activeScoreState, routeSegments, outMode, dartsRemaining, x01Rules) {
  if (activeScoreState?.scoreAgreement !== "mismatch") {
    return activeScoreState;
  }

  const gameStateScore = activeScoreState.gameStateScore;
  const domScore = activeScoreState.domScore;
  if (!Number.isFinite(gameStateScore) || !Number.isFinite(domScore)) {
    return activeScoreState;
  }

  if (!Array.isArray(routeSegments) || routeSegments.length <= 1) {
    return activeScoreState;
  }

  const gameStateSurface = resolveCheckoutSurfaceSemantics({
    routeSegments,
    activeScore: gameStateScore,
    outMode,
    dartsRemaining,
    x01Rules,
  });
  const domSurface = resolveCheckoutSurfaceSemantics({
    routeSegments,
    activeScore: domScore,
    outMode,
    dartsRemaining,
    x01Rules,
  });
  const gameStateLooksLikeDirectFinish =
    gameStateSurface.selectionSource === "score-route" &&
    gameStateSurface.canUseAuthoritativeFinishNow;
  const domLooksLikeVisibleMultiStepRoute =
    String(domSurface.selectionSource || "").startsWith("validated-visible-route") &&
    !domSurface.canUseAuthoritativeFinishNow;

  if (!gameStateLooksLikeDirectFinish || !domLooksLikeVisibleMultiStepRoute) {
    return activeScoreState;
  }

  return {
    ...activeScoreState,
    activeScore: domScore,
    scoreSource: "dom-preferred",
  };
}

export function resolveX01CheckoutContext(context = {}) {
  const gameState = context.gameState;
  const documentRef = context.documentRef;
  const windowRef = context.windowRef;
  const x01Rules = context.x01Rules;
  const routeEntries = collectVisibleCheckoutRouteEntries(documentRef, windowRef, x01Rules);
  const routeSegments = routeEntries.flatMap((entry) =>
    Array.isArray(entry?.segments) ? entry.segments : []
  );
  const outMode =
    gameState && typeof gameState.getOutMode === "function"
      ? String(gameState.getOutMode() || "")
      : String(context.outMode || "");
  const dartsRemaining = resolveDartsRemaining(gameState, context.dartsRemaining);
  const activeScoreState = resolveX01ActiveScoreState({
    gameState,
    documentRef,
    windowRef,
  });
  const checkoutScoreState = resolveCheckoutScoreState(
    activeScoreState,
    routeSegments,
    outMode,
    dartsRemaining,
    x01Rules
  );
  const checkoutSurface = resolveCheckoutSurfaceSemantics({
    routeSegments,
    activeScore: checkoutScoreState.activeScore,
    outMode,
    dartsRemaining,
    x01Rules,
  });

  return {
    ...checkoutScoreState,
    outMode,
    dartsRemaining,
    routeEntries,
    routeSegments,
    checkoutSurface,
  };
}
