import {
  collectVisibleCheckoutRouteEntries,
  resolveCheckoutSurfaceSemantics,
} from "./x01-checkout-route.js";
import { readModernMatchSurface } from "./shared/x01-match-surface.js";

const ACTIVE_SCORE_SELECTORS = Object.freeze([
  ".ad-ext-player.ad-ext-player-active p.ad-ext-player-score",
  ".ad-ext-player-active p.ad-ext-player-score",
  "p.ad-ext-player-score",
]);
const MATCH_ROUTE_PATTERN = /^\/matches\/([^/]+)$/i;

export function parseScore(text) {
  const match = /-?\d+/.exec(String(text || ""));
  if (!match) {
    return Number.NaN;
  }

  const numeric = Number(match[0]);
  return Number.isFinite(numeric) ? numeric : Number.NaN;
}

function normalizeScore(value) {
  if (value === null || value === undefined) {
    return Number.NaN;
  }

  if (typeof value === "string" && !value.trim()) {
    return Number.NaN;
  }

  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric >= 0 ? numeric : Number.NaN;
}

function normalizeRoutePath(pathValue) {
  let normalized = String(pathValue || "").trim().toLowerCase();
  if (!normalized) {
    return "";
  }
  if (!normalized.startsWith("/")) {
    normalized = `/${normalized}`;
  }
  normalized = collapseRepeatedSlashes(stripRouteSuffix(normalized));
  if (normalized.length > 1) {
    normalized = trimTrailingSlashes(normalized);
  }
  return normalized;
}

function stripRouteSuffix(pathValue) {
  const queryIndex = pathValue.indexOf("?");
  const hashIndex = pathValue.indexOf("#");
  const suffixIndexes = [queryIndex, hashIndex].filter((index) => index >= 0);
  if (!suffixIndexes.length) {
    return pathValue;
  }

  return pathValue.slice(0, Math.min(...suffixIndexes));
}

function collapseRepeatedSlashes(pathValue) {
  let collapsed = "";
  let previousWasSlash = false;

  for (const char of pathValue) {
    if (char === "/") {
      if (!previousWasSlash) {
        collapsed += char;
      }
      previousWasSlash = true;
      continue;
    }

    collapsed += char;
    previousWasSlash = false;
  }

  return collapsed;
}

function trimTrailingSlashes(pathValue) {
  let endIndex = pathValue.length;
  while (endIndex > 1 && pathValue[endIndex - 1] === "/") {
    endIndex -= 1;
  }

  return pathValue.slice(0, endIndex);
}

function normalizeMatchId(value) {
  return String(value || "").trim().toLowerCase();
}

function extractCurrentMatchRouteId(windowRef, documentRef) {
  const locationRef = windowRef?.location || documentRef?.defaultView?.location || null;
  const routePath = normalizeRoutePath(locationRef?.pathname || "");
  const match = MATCH_ROUTE_PATTERN.exec(routePath);
  return normalizeMatchId(match?.[1] || "");
}

function extractTopicMatchId(topicValue) {
  const topic = String(topicValue || "").trim();
  if (!topic) {
    return "";
  }

  const explicitMatch = /(?:^|[./:])matches?[./:]([^./:\s]+)/i.exec(topic);
  if (explicitMatch?.[1]) {
    return normalizeMatchId(explicitMatch[1]);
  }

  const stateTopicMatch = /^([^.\s]+)\.state$/i.exec(topic);
  return normalizeMatchId(stateTopicMatch?.[1] || "");
}

function collectSnapshotMatchIds(snapshot) {
  if (!snapshot || typeof snapshot !== "object") {
    return [];
  }

  const match = snapshot.match && typeof snapshot.match === "object" ? snapshot.match : null;
  return [
    match?.id,
    match?._id,
    match?.matchId,
    snapshot.matchId,
    extractTopicMatchId(snapshot.topic),
  ]
    .map(normalizeMatchId)
    .filter(Boolean);
}

export function isGameStateStaleForCurrentMatchRoute(gameState, windowRef, documentRef) {
  if (!gameState || typeof gameState.getSnapshot !== "function") {
    return false;
  }

  const routeMatchId = extractCurrentMatchRouteId(windowRef, documentRef);
  if (!routeMatchId) {
    return false;
  }

  const snapshotMatchIds = collectSnapshotMatchIds(gameState.getSnapshot());
  if (!snapshotMatchIds.length) {
    return false;
  }

  return !snapshotMatchIds.includes(routeMatchId);
}

function analyzeScoreCandidateNode(node, windowRef) {
  if (!node) {
    return {
      visible: false,
      styleVisible: false,
      weight: 0,
    };
  }

  let styleVisible = true;
  let fontSize = 0;
  try {
    const style = windowRef?.getComputedStyle?.(node);
    if (style) {
      styleVisible = !(
        style.display === "none" ||
        style.visibility === "hidden" ||
        style.opacity === "0"
      );
      fontSize = Number.parseFloat(style.fontSize) || 0;
    }
  } catch (_) {
    styleVisible = true;
  }

  if (typeof node.getBoundingClientRect !== "function") {
    return {
      visible: false,
      styleVisible,
      weight: 0,
    };
  }

  try {
    const rect = node.getBoundingClientRect();
    const width = Number.isFinite(rect?.width) ? rect.width : 0;
    const height = Number.isFinite(rect?.height) ? rect.height : 0;
    return {
      visible: width > 0 && height > 0 && styleVisible,
      styleVisible,
      weight: fontSize * 10000 + width * height,
    };
  } catch (_) {
    return {
      visible: false,
      styleVisible,
      weight: 0,
    };
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
      if (existing && existing.selectorRank <= selectorRank) {
        return;
      }

      const candidateAnalysis = analyzeScoreCandidateNode(node, windowRef);
      const nextCandidate = {
        node,
        value,
        selectorRank,
        weight: candidateAnalysis.weight,
        visible: candidateAnalysis.visible,
        styleVisible: candidateAnalysis.styleVisible,
      };

      if (!existing || compareScoreCandidates(nextCandidate, existing) < 0) {
        candidateMap.set(node, nextCandidate);
      }
    });
  });

  return Array.from(candidateMap.values()).sort(compareScoreCandidates);
}

export function readDomActiveScore(documentRef, windowRef) {
  const modernSurface = readModernMatchSurface(documentRef, windowRef);
  if (modernSurface.turnContainer) {
    return modernSurface.activeScore;
  }
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
  const gameStateScore = isGameStateStaleForCurrentMatchRoute(
    context.gameState,
    context.windowRef,
    context.documentRef
  )
    ? Number.NaN
    : readGameStateActiveScore(context.gameState);
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
    String(gameState?.getOutMode?.() || context.outMode ||
      readModernMatchSurface(documentRef, windowRef).outMode || "");
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
