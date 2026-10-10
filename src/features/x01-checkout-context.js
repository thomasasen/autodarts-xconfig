import { normalizeRoutePath } from "../shared/route-normalization.js";
import {
  collectVisibleCheckoutRouteEntries,
  resolveCheckoutSurfaceSemantics,
} from "./x01-checkout-route.js";
import {
  isMatchNodeVisible,
  readModernMatchSurface,
  readModernThrows,
} from "./shared/x01-match-surface.js";
import { collectTurnThrowRows } from "./shared/turn-surface-adapter.js";
import { isX01VariantText } from "../domain/variant-rules.js";
import { readModernCricketGrid } from "./cricket-surface/modern-grid.js";

const ACTIVE_SCORE_SELECTORS = Object.freeze([
  ".ad-ext-player.ad-ext-player-active p.ad-ext-player-score",
  ".ad-ext-player-active p.ad-ext-player-score",
  "p.ad-ext-player-score",
]);
const MATCH_ROUTE_PATTERN = /^\/matches\/([^/]+)$/i;
const truthHistoryByDocument = new WeakMap();
const readScopeOwners = new WeakMap();
const READ_CONTEXT_KEYS = [
  "documentRef", "windowRef", "gameState", "x01Rules", "domOutMode", "outMode", "dartsRemaining",
];

// Allocate locally for one synchronous read/render. Never retain this context in state.
export function createX01ReadContext(context = {}) {
  const x01ReadScope = new Map();
  readScopeOwners.set(x01ReadScope, { ...context });
  return { ...context, x01ReadScope };
}

function readScoped(context, key, read) {
  const scope = context.x01ReadScope;
  const owner = scope && readScopeOwners.get(scope);
  if (!owner || READ_CONTEXT_KEYS.some((name) => owner[name] !== context[name])) return read();
  if (!scope.has(key)) scope.set(key, read());
  return scope.get(key);
}

export function readX01MatchSurface(context = {}) {
  return readScoped(context, "modernSurface", () =>
    readModernMatchSurface(context.documentRef, context.windowRef));
}

export function readX01CricketGrid(context = {}) {
  return readScoped(context, "cricketGrid", () => readModernCricketGrid(context.documentRef));
}

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

export function readDomActiveScore(documentRef, windowRef, context = {}) {
  const modernSurface = readX01MatchSurface({ ...context, documentRef, windowRef });
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

function safeGetSnapshot(gameState) {
  if (!gameState || typeof gameState.getSnapshot !== "function") {
    return null;
  }
  try {
    const snapshot = gameState.getSnapshot();
    return snapshot && typeof snapshot === "object" ? snapshot : null;
  } catch (_) {
    return null;
  }
}

function normalizeIdentity(value) {
  const normalized = String(value ?? "").trim();
  return normalized || "";
}

function normalizeOutMode(value) {
  return String(value || "").trim();
}

function normalizeOutModeForComparison(value, x01Rules) {
  const normalizedInput = normalizeOutMode(value);
  if (!normalizedInput) {
    return "";
  }
  return String(x01Rules?.normalizeOutMode?.(normalizedInput) || normalizedInput)
    .trim()
    .toLowerCase();
}

function normalizeVariantText(value) {
  return String(value || "").replaceAll(/\s+/g, " ").trim();
}

function getActiveTurnId(turn) {
  const directId = normalizeIdentity(turn?.id);
  if (directId) {
    return directId;
  }
  const round = Number.isFinite(turn?.round) ? turn.round : -1;
  const turnNumber = Number.isFinite(turn?.turn) ? turn.turn : -1;
  const playerId = normalizeIdentity(turn?.playerId);
  return turn ? `fallback:${round}:${turnNumber}:${playerId}` : "";
}

function getSnapshotMatch(snapshot) {
  return snapshot?.match && typeof snapshot.match === "object" ? snapshot.match : null;
}

function getStateBoundaryToken(snapshot, matchId) {
  const match = getSnapshotMatch(snapshot);
  const gameToken = [
    match?.currentGameId,
    match?.gameId,
    match?.game?.id,
    match?.currentLegId,
    match?.legId,
    match?.leg?.id,
    match?.setId,
    match?.set?.id,
  ].map(normalizeIdentity).find(Boolean);
  if (gameToken) {
    return `match:${matchId || "unknown"}|game:${gameToken}`;
  }
  return matchId ? `match:${matchId}` : "";
}

function getStateActivePlayerId(snapshot, activePlayerIndex, activeTurn) {
  const turnPlayerId = normalizeIdentity(activeTurn?.playerId);
  if (turnPlayerId) {
    return turnPlayerId;
  }
  const players = getSnapshotMatch(snapshot)?.players;
  if (!Array.isArray(players) || !Number.isInteger(activePlayerIndex)) {
    return "";
  }
  return normalizeIdentity(players[activePlayerIndex]?.id);
}

function normalizeThrowSegment(throwEntry, x01Rules) {
  const candidates = [
    throwEntry?.segment?.name,
    throwEntry?.segmentName,
    throwEntry?.name,
    throwEntry?.segment,
  ];
  for (const candidate of candidates) {
    const normalized = x01Rules?.normalizeSegmentName?.(candidate) || normalizeIdentity(candidate);
    if (normalized) {
      return normalized;
    }
  }
  const numericScore = Number(throwEntry?.score);
  return Number.isFinite(numericScore) ? `score:${numericScore}` : "?";
}

function buildThrowSignature(throws, x01Rules) {
  return Array.isArray(throws)
    ? throws.map((entry) => normalizeThrowSegment(entry, x01Rules)).join(",")
    : "";
}

function getLeafTexts(node) {
  if (!node || typeof node.querySelectorAll !== "function") {
    return [];
  }
  return Array.from(node.querySelectorAll("*"))
    .filter((entry) => !entry.querySelectorAll?.("*")?.length)
    .map((entry) => String(entry.textContent || "").trim())
    .filter(Boolean);
}

function parseVisibleThrowRow(row, x01Rules) {
  const candidates = [row?.innerText, row?.textContent, ...getLeafTexts(row)]
    .map((value) => String(value || "").trim())
    .filter(Boolean);
  for (const candidate of candidates) {
    const segments = x01Rules?.parseExplicitCheckoutSegments?.(candidate) || [];
    const segmentName = normalizeIdentity(segments[0]);
    if (!segmentName) {
      continue;
    }
    const parsed = x01Rules?.parseSegment?.(segmentName);
    return {
      segment: { name: segmentName },
      score: Number.isFinite(parsed?.score) ? parsed.score : 0,
    };
  }
  return null;
}

function readDomThrows(documentRef, modernSurface, x01Rules) {
  if (modernSurface?.turnContainer) {
    const throws = readModernThrows(modernSurface, x01Rules);
    return {
      known: Array.isArray(throws),
      throws: Array.isArray(throws) ? throws : [],
      source: "modern-turn",
    };
  }
  const rows = collectTurnThrowRows(documentRef);
  if (!rows.length) {
    return { known: false, throws: [], source: "none" };
  }
  const throws = rows.map((row) => parseVisibleThrowRow(row, x01Rules));
  if (throws.some((entry) => !entry)) {
    return { known: false, throws: [], source: "legacy-turn-unparseable" };
  }
  return { known: true, throws, source: "legacy-turn" };
}

function readVisibleDomVariant(documentRef, windowRef, modernSurface, context = {}) {
  const cricketGrid = readX01CricketGrid({ ...context, documentRef, windowRef });
  if (cricketGrid) return cricketGrid.labels.length > 7 ? "Tactics" : "Cricket";
  if (modernSurface?.variantNode && modernSurface.variant) {
    return normalizeVariantText(modernSurface.variant);
  }
  const legacyNode = documentRef?.getElementById?.("ad-ext-game-variant") || null;
  if (!legacyNode || !isMatchNodeVisible(legacyNode, windowRef)) {
    return "";
  }
  return normalizeVariantText(legacyNode.textContent);
}

function readLegacyActivePlayerIndex(documentRef) {
  const playerRows = Array.from(documentRef?.querySelectorAll?.(".ad-ext-player") || [])
    .filter((row) => row?.querySelector?.("p.ad-ext-player-score"));
  const activeIndexes = playerRows
    .map((row, index) => row?.classList?.contains("ad-ext-player-active") ? index : -1)
    .filter((index) => index >= 0);
  return activeIndexes.length === 1 ? activeIndexes[0] : null;
}

function createStateCandidate(context, routeMatchId) {
  return readScoped(context, `stateCandidate:${routeMatchId}`, () => readStateCandidate(context, routeMatchId));
}

function readStateCandidate(context, routeMatchId) {
  const gameState = context.gameState;
  const snapshot = safeGetSnapshot(gameState);
  const snapshotMatchIds = collectSnapshotMatchIds(snapshot);
  const foreignMatch = Boolean(
    routeMatchId && snapshotMatchIds.length && !snapshotMatchIds.includes(routeMatchId)
  );
  const activeTurn = gameState?.getActiveTurn?.() || null;
  const activeThrowsValue = gameState?.getActiveThrows?.();
  let activeThrows = [];
  if (Array.isArray(activeThrowsValue)) {
    activeThrows = activeThrowsValue;
  } else if (Array.isArray(activeTurn?.throws)) {
    activeThrows = activeTurn.throws;
  }
  const throwsKnown = Array.isArray(activeThrowsValue) || Array.isArray(activeTurn?.throws);
  const activePlayerValue = gameState?.getActivePlayerIndex?.();
  const activePlayerIndex = Number.isInteger(activePlayerValue) ? activePlayerValue : null;
  const matchId = snapshotMatchIds.includes(routeMatchId)
    ? routeMatchId
    : snapshotMatchIds[0] || "";
  const rawVariant = normalizeVariantText(
    getSnapshotMatch(snapshot)?.variant || snapshot?.variant || gameState?.getVariant?.()
  );
  const stateScore = readGameStateActiveScore(gameState);
  const outMode = normalizeOutMode(gameState?.getOutMode?.());

  return {
    source: "game-state",
    usable: Boolean(gameState) && !foreignMatch && Number.isFinite(stateScore),
    foreignMatch,
    matchId,
    gameBoundaryToken: getStateBoundaryToken(snapshot, matchId),
    variant: rawVariant,
    activeScore: stateScore,
    outMode,
    outModeNormalized: normalizeOutModeForComparison(outMode, context.x01Rules),
    activeThrows,
    throwsKnown,
    throwCount: throwsKnown ? activeThrows.length : Number.NaN,
    dartsRemaining: throwsKnown ? normalizeDartsRemaining(3 - activeThrows.length) : Number.NaN,
    throwSignature: throwsKnown ? buildThrowSignature(activeThrows, context.x01Rules) : "",
    activeTurn,
    activeTurnId: getActiveTurnId(activeTurn),
    activePlayerIndex,
    activePlayerId: getStateActivePlayerId(snapshot, activePlayerIndex, activeTurn),
    updatedAt: Number(snapshot?.updatedAt) || 0,
    snapshot,
  };
}

function createDomCandidate(context, routeMatchId, modernSurface, domVariant) {
  return readScoped(context, `domCandidate:${routeMatchId}:${domVariant}`, () =>
    readDomCandidate(context, routeMatchId, modernSurface, domVariant));
}

function readDomCandidate(context, routeMatchId, modernSurface, domVariant) {
  const domThrowsState = readDomThrows(context.documentRef, modernSurface, context.x01Rules);
  const activeThrows = domThrowsState.throws;
  const activePlayerIndex = modernSurface?.players?.length
    ? modernSurface.players.findIndex((player) => player?.active)
    : readLegacyActivePlayerIndex(context.documentRef);
  const normalizedActivePlayerIndex = activePlayerIndex >= 0 ? activePlayerIndex : null;
  const activePlayerId = normalizeIdentity(modernSurface?.playerKey) ||
    (Number.isInteger(normalizedActivePlayerIndex) ? `index:${normalizedActivePlayerIndex}` : "");
  const activeScore = normalizeScore(readDomActiveScore(context.documentRef, context.windowRef, context));
  const outMode = normalizeOutMode(modernSurface?.outMode || context.domOutMode || context.outMode);
  const visitStartScore = Number.isFinite(activeScore) && domThrowsState.known
    ? activeScore + activeThrows.reduce((sum, entry) => sum + (Number(entry?.score) || 0), 0)
    : Number.NaN;
  const hasDomTurnIdentity = Boolean(modernSurface?.turnContainer) && domThrowsState.known;
  const visitStartToken = Number.isFinite(visitStartScore) ? visitStartScore : "unknown";
  const activeTurnId = hasDomTurnIdentity
    ? `dom:${routeMatchId || "unknown"}:${activePlayerId || "unknown"}:${
        visitStartToken
      }`
    : "";
  const activeTurn = hasDomTurnIdentity
    ? { id: activeTurnId, playerId: activePlayerId, throws: activeThrows, score: activeScore }
    : null;

  return {
    source: "dom",
    usable: Number.isFinite(activeScore),
    foreignMatch: false,
    matchId: routeMatchId,
    gameBoundaryToken: routeMatchId ? `match:${routeMatchId}` : "",
    variant: domVariant,
    activeScore,
    outMode,
    outModeNormalized: normalizeOutModeForComparison(outMode, context.x01Rules),
    activeThrows,
    throwsKnown: domThrowsState.known,
    throwCount: domThrowsState.known ? activeThrows.length : Number.NaN,
    dartsRemaining: domThrowsState.known
      ? normalizeDartsRemaining(3 - activeThrows.length)
      : normalizeDartsRemaining(context.dartsRemaining),
    throwSignature: domThrowsState.known
      ? buildThrowSignature(activeThrows, context.x01Rules)
      : "",
    activeTurn,
    activeTurnId,
    activePlayerIndex: normalizedActivePlayerIndex,
    activePlayerId,
    updatedAt: 0,
    throwsSource: domThrowsState.source,
  };
}

function comparableCandidate(candidate) {
  return {
    matchId: normalizeMatchId(candidate?.matchId),
    variant: normalizeVariantText(candidate?.variant).toLowerCase(),
    activeScore: Number.isFinite(candidate?.activeScore) ? candidate.activeScore : null,
    outMode: String(candidate?.outModeNormalized || ""),
    throwCount: Number.isFinite(candidate?.throwCount) ? candidate.throwCount : null,
    throwSignature: String(candidate?.throwSignature || ""),
    activeTurnId: String(candidate?.activeTurnId || ""),
    activePlayerId: String(candidate?.activePlayerId || ""),
    activePlayerIndex: Number.isInteger(candidate?.activePlayerIndex)
      ? candidate.activePlayerIndex
      : null,
  };
}

// A generation invalidates cached decisions, while the source baselines remain
// available to recognize messages from the preceding visit during catch-up.
export function advanceX01TurnGeneration(documentRef, generation) {
  const history = getTruthHistory(documentRef);
  if (history && history.turnGeneration !== generation) {
    history.turnGeneration = generation;
    history.observationSignature = "";
    history.decision = "";
  }
}

export function clearX01TurnHistory(documentRef) {
  if (documentRef) truthHistoryByDocument.delete(documentRef);
}

export function readTurnLifecycleCandidates(context = {}) {
  const surface = readX01MatchSurface(context);
  const matchId = extractCurrentMatchRouteId(context.windowRef, context.documentRef);
  const variant = readScoped(context, "domVariant", () =>
    readVisibleDomVariant(context.documentRef, context.windowRef, surface, context));
  return {
    state: createStateCandidate(context, matchId),
    dom: createDomCandidate(context, matchId, surface, variant),
  };
}

function buildCandidateSignature(candidate) {
  return JSON.stringify(comparableCandidate(candidate));
}

function knownValuesConflict(leftValue, rightValue, predicate = Boolean) {
  return predicate(leftValue) && predicate(rightValue) && leftValue !== rightValue;
}

function candidatesConflict(stateCandidate, domCandidate) {
  return knownValuesConflict(
    stateCandidate.activeScore,
    domCandidate.activeScore,
    Number.isFinite
  ) || knownValuesConflict(
    stateCandidate.outModeNormalized,
    domCandidate.outModeNormalized
  ) || knownValuesConflict(
    stateCandidate.throwCount,
    domCandidate.throwCount,
    Number.isFinite
  ) || knownValuesConflict(
    stateCandidate.throwSignature,
    domCandidate.throwSignature
  ) || knownValuesConflict(
    stateCandidate.activePlayerIndex,
    domCandidate.activePlayerIndex,
    Number.isInteger
  );
}

function candidatesAgree(stateCandidate, domCandidate) {
  return !candidatesConflict(stateCandidate, domCandidate);
}

function getTruthHistory(documentRef) {
  if (!documentRef || (typeof documentRef !== "object" && typeof documentRef !== "function")) {
    return null;
  }
  let history = truthHistoryByDocument.get(documentRef);
  if (!history) {
    history = {
      boundaryKey: "",
      baselineSignature: "",
      stateBaselineSignature: "",
      domBaselineSignature: "",
      observationSignature: "",
      decision: "",
      usedUnidentifiedStateFallback: false,
    };
    truthHistoryByDocument.set(documentRef, history);
  }
  return history;
}

function resetTruthHistory(history, boundaryKey) {
  if (!history) {
    return;
  }
  history.boundaryKey = boundaryKey;
  history.baselineSignature = "";
  history.stateBaselineSignature = "";
  history.domBaselineSignature = "";
  history.observationSignature = "";
  history.decision = "";
  history.usedUnidentifiedStateFallback = false;
}

function resolveDivergentCandidateDecision(context, history, stateSignature, domSignature) {
  if (context.preferStateWhenUnidentified) {
    return {
      decision: "state-preferred",
      usedUnidentifiedStateFallback: true,
    };
  }
  if (!history?.stateBaselineSignature || !history?.domBaselineSignature) {
    return { decision: "conflict", usedUnidentifiedStateFallback: false };
  }
  const stateMatchesBaseline = stateSignature === history.stateBaselineSignature;
  const domMatchesBaseline = domSignature === history.domBaselineSignature;
  if (stateMatchesBaseline === domMatchesBaseline) {
    return { decision: "conflict", usedUnidentifiedStateFallback: false };
  }
  return {
    decision: stateMatchesBaseline ? "dom-preferred" : "state-preferred",
    usedUnidentifiedStateFallback: false,
  };
}

function chooseCandidateDecision(context, history, stateCandidate, domCandidate, signatures) {
  if (stateCandidate.foreignMatch) {
    return {
      decision: domCandidate.usable ? "dom-preferred" : "pending",
      usedUnidentifiedStateFallback: false,
    };
  }
  if (stateCandidate.usable && !domCandidate.usable) {
    return { decision: "state-preferred", usedUnidentifiedStateFallback: false };
  }
  if (!stateCandidate.usable && domCandidate.usable) {
    return { decision: "dom-preferred", usedUnidentifiedStateFallback: false };
  }
  if (!stateCandidate.usable || !domCandidate.usable) {
    return { decision: "pending", usedUnidentifiedStateFallback: false };
  }
  if (candidatesAgree(stateCandidate, domCandidate)) {
    return { decision: "coherent", usedUnidentifiedStateFallback: false };
  }
  return resolveDivergentCandidateDecision(
    context,
    history,
    signatures.state,
    signatures.dom
  );
}

function resolveCandidateDecision(context, stateCandidate, domCandidate, boundaryKey) {
  const history = getTruthHistory(context.documentRef);
  if (history && history.boundaryKey !== boundaryKey) {
    resetTruthHistory(history, boundaryKey);
  }
  const stateSignature = buildCandidateSignature(stateCandidate);
  const domSignature = buildCandidateSignature(domCandidate);
  const observationSignature = [
    stateCandidate.usable ? stateSignature : "state-unusable",
    domCandidate.usable ? domSignature : "dom-unusable",
    stateCandidate.foreignMatch ? "foreign" : "current",
  ].join("||");
  if (history?.observationSignature === observationSignature && history.decision) {
    return {
      decision: history.decision,
      history,
      observationSignature,
      usedUnidentifiedStateFallback: history.usedUnidentifiedStateFallback,
    };
  }

  const { decision, usedUnidentifiedStateFallback } = chooseCandidateDecision(
    context,
    history,
    stateCandidate,
    domCandidate,
    { state: stateSignature, dom: domSignature }
  );

  if (history) {
    history.observationSignature = observationSignature;
    history.decision = decision;
    history.usedUnidentifiedStateFallback = usedUnidentifiedStateFallback;
  }
  return {
    decision,
    history,
    observationSignature,
    usedUnidentifiedStateFallback,
  };
}

function mergeSelectedCandidate(decision, stateCandidate, domCandidate) {
  if (decision === "dom-preferred") {
    const canUseStableStateMetadata = stateCandidate.usable && !stateCandidate.foreignMatch;
    return {
      ...domCandidate,
      outMode: domCandidate.outMode || (canUseStableStateMetadata ? stateCandidate.outMode : ""),
      outModeNormalized: domCandidate.outModeNormalized ||
        (canUseStableStateMetadata ? stateCandidate.outModeNormalized : ""),
      gameBoundaryToken:
        (canUseStableStateMetadata ? stateCandidate.gameBoundaryToken : "") ||
        domCandidate.gameBoundaryToken,
    };
  }
  if (decision === "state-preferred") {
    return stateCandidate;
  }
  if (decision === "coherent") {
    return {
      ...stateCandidate,
      variant: domCandidate.variant || stateCandidate.variant,
      matchId: domCandidate.matchId || stateCandidate.matchId,
      outMode: stateCandidate.outMode || domCandidate.outMode,
      outModeNormalized: stateCandidate.outModeNormalized || domCandidate.outModeNormalized,
      activeScore: Number.isFinite(stateCandidate.activeScore)
        ? stateCandidate.activeScore
        : domCandidate.activeScore,
      activePlayerIndex: Number.isInteger(stateCandidate.activePlayerIndex)
        ? stateCandidate.activePlayerIndex
        : domCandidate.activePlayerIndex,
      activePlayerId: stateCandidate.activePlayerId || domCandidate.activePlayerId,
      gameBoundaryToken: stateCandidate.gameBoundaryToken || domCandidate.gameBoundaryToken,
    };
  }
  return null;
}

function rememberSelectedCandidate(history, selectedCandidate, stateCandidate, domCandidate) {
  if (history && selectedCandidate) {
    history.baselineSignature = buildCandidateSignature(selectedCandidate);
    history.stateBaselineSignature = buildCandidateSignature(stateCandidate);
    history.domBaselineSignature = buildCandidateSignature(domCandidate);
  }
}

function buildInactiveTruth(base, diagnostics) {
  return {
    ...base,
    active: false,
    actionable: false,
    variant: diagnostics.domVariant || "",
    matchId: diagnostics.routeMatchId || "",
    gameBoundaryToken: diagnostics.routeMatchId ? `match:${diagnostics.routeMatchId}` : "",
    activeScore: Number.NaN,
    outMode: "",
    activeThrows: [],
    throwCount: Number.NaN,
    dartsRemaining: Number.NaN,
    activeTurn: null,
    activeTurnId: "",
    activePlayerIndex: null,
    activePlayerId: "",
    source: "dom-non-x01",
    coherence: "dom-preferred",
    gameStateUsable: false,
    domUsable: true,
    scoreSource: "inactive",
    scoreAgreement: "inactive",
    diagnostics,
  };
}

function buildTruthDiagnostics(routeMatchId, domVariant, stateCandidate, domCandidate = null) {
  return {
    routeMatchId,
    snapshotMatchIds: collectSnapshotMatchIds(stateCandidate.snapshot),
    domVariant,
    stateVariant: stateCandidate.variant,
    domScore: Number.isFinite(domCandidate?.activeScore) ? domCandidate.activeScore : null,
    stateScore: Number.isFinite(stateCandidate.activeScore) ? stateCandidate.activeScore : null,
    domOutMode: domCandidate?.outMode || "",
    stateOutMode: stateCandidate.outMode,
    domThrowCount: Number.isFinite(domCandidate?.throwCount) ? domCandidate.throwCount : null,
    stateThrowCount: Number.isFinite(stateCandidate.throwCount) ? stateCandidate.throwCount : null,
    domThrowSignature: domCandidate?.throwSignature || "",
    stateThrowSignature: stateCandidate.throwSignature,
    foreignMatchState: stateCandidate.foreignMatch,
    explicitVisibleNonX01: false,
    discardedSource: "",
    reason: "",
  };
}

function resolveVisibleNonX01Truth(options) {
  const {
    documentRef,
    routeMatchId,
    domVariant,
    stateCandidate,
    x01Rules,
  } = options;
  const diagnostics = buildTruthDiagnostics(
    routeMatchId,
    domVariant,
    stateCandidate
  );
  diagnostics.explicitVisibleNonX01 = true;
  diagnostics.discardedSource = "game-state";
  diagnostics.reason = "explicit-visible-non-x01";
  resetTruthHistory(
    getTruthHistory(documentRef),
    routeMatchId || `variant:${domVariant.toLowerCase()}`
  );
  const inactiveTruth = buildInactiveTruth({
    routeEntries: [],
    routeSegments: [],
    domScore: Number.NaN,
    gameStateScore: Number.NaN,
  }, diagnostics);
  inactiveTruth.checkoutSurface = resolveCheckoutSurfaceSemantics({
    routeSegments: [],
    activeScore: Number.NaN,
    outMode: "",
    dartsRemaining: 0,
    x01Rules,
  });
  return inactiveTruth;
}

function isCandidateX01Active(candidate, gameState = null) {
  const variantIsX01 = isX01VariantText(candidate?.variant, {
    allowMissing: false,
    allowEmpty: false,
    allowNumeric: true,
  });
  if (variantIsX01) {
    return true;
  }
  return gameState?.isX01Variant?.({
    allowMissing: false,
    allowEmpty: false,
    allowNumeric: true,
  }) === true;
}

function hasAtomicSemantics(selected, routeMatchId, modernSurface) {
  if (!selected || (!routeMatchId && !modernSurface?.variantNode)) {
    return true;
  }
  return Number.isFinite(selected.activeScore) &&
    Boolean(normalizeOutMode(selected.outMode)) &&
    Number.isFinite(selected.dartsRemaining);
}

function applyDecisionDiagnostics(options) {
  const {
    diagnostics,
    stateCandidate,
    selected,
    selectedHasAtomicSemantics,
    decision,
    usedUnidentifiedStateFallback,
  } = options;
  if (stateCandidate.foreignMatch) {
    diagnostics.discardedSource = "game-state";
    diagnostics.reason = "foreign-match-state";
    return;
  }
  if (!selectedHasAtomicSemantics) {
    diagnostics.discardedSource = selected?.source || "none";
    diagnostics.reason = "incomplete-atomic-semantics";
    return;
  }
  if (decision === "state-preferred") {
    diagnostics.discardedSource = "dom";
    diagnostics.reason = usedUnidentifiedStateFallback
      ? "state-fallback-on-unidentified-surface"
      : "state-progressed-from-last-coherent-truth";
    return;
  }
  if (decision === "dom-preferred") {
    diagnostics.discardedSource = "game-state";
    diagnostics.reason = "dom-progressed-from-last-coherent-truth";
    return;
  }
  if (decision === "conflict") {
    diagnostics.discardedSource = "both";
    diagnostics.reason = "ambiguous-source-freshness";
    return;
  }
  diagnostics.reason = decision === "pending"
    ? "no-usable-x01-source"
    : "sources-coherent";
}

function resolveScoreLabels(scoreValuesAgree, decision) {
  if (scoreValuesAgree) {
    return { scoreSource: "game-state+dom", scoreAgreement: "match" };
  }
  if (decision === "state-preferred") {
    return { scoreSource: "game-state-preferred", scoreAgreement: "mismatch" };
  }
  if (decision === "dom-preferred") {
    return { scoreSource: "dom-preferred", scoreAgreement: "mismatch" };
  }
  return { scoreSource: "none", scoreAgreement: decision };
}

function buildResolvedTruth(options) {
  const {
    base,
    active,
    actionable,
    selected,
    domVariant,
    stateCandidate,
    routeMatchId,
    activeScore,
    outMode,
    dartsRemaining,
    decision,
    domCandidate,
    routeUsable,
    routeEntries,
    routeSegments,
    checkoutSurface,
    diagnostics,
  } = options;
  let variant = domVariant || stateCandidate.variant;
  let matchId = routeMatchId || stateCandidate.matchId;
  let gameBoundaryToken = "";
  let activeThrows = [];
  let throwCount = Number.NaN;
  let activeTurn = null;
  let activeTurnId = "";
  let activePlayerIndex = null;
  let activePlayerId = "";
  let source = "none";
  if (actionable) {
    variant = selected.variant || "X01";
    matchId = selected.matchId;
    gameBoundaryToken = selected.gameBoundaryToken;
    activeThrows = Array.isArray(selected.activeThrows) ? selected.activeThrows : [];
    throwCount = Number.isFinite(selected.throwCount) ? selected.throwCount : Number.NaN;
    activeTurn = selected.activeTurn;
    activeTurnId = selected.activeTurnId;
    activePlayerIndex = selected.activePlayerIndex;
    activePlayerId = selected.activePlayerId;
    source = selected.source;
  }
  const scoreValuesAgree = !stateCandidate.foreignMatch &&
    Number.isFinite(stateCandidate.activeScore) &&
    Number.isFinite(domCandidate.activeScore) &&
    stateCandidate.activeScore === domCandidate.activeScore;
  const scoreLabels = resolveScoreLabels(scoreValuesAgree, decision);
  return {
    ...base,
    active,
    actionable,
    variant,
    matchId,
    gameBoundaryToken,
    activeScore,
    outMode,
    activeThrows,
    throwCount,
    dartsRemaining,
    activeTurn,
    activeTurnId,
    activePlayerIndex,
    activePlayerId,
    source,
    coherence: decision,
    gameStateUsable: stateCandidate.usable,
    domUsable: domCandidate.usable,
    ...scoreLabels,
    routeUsable,
    routeEntries,
    routeSegments,
    checkoutSurface,
    diagnostics,
  };
}

export function resolveX01CheckoutContext(context = {}) {
  const gameState = context.gameState;
  const documentRef = context.documentRef;
  const windowRef = context.windowRef;
  const x01Rules = context.x01Rules;
  const modernSurface = readX01MatchSurface(context);
  const routeMatchId = extractCurrentMatchRouteId(windowRef, documentRef);
  const domVariant = readScoped(context, "domVariant", () =>
    readVisibleDomVariant(documentRef, windowRef, modernSurface, context));
  const explicitVisibleNonX01 = Boolean(domVariant) && !isX01VariantText(domVariant, {
    allowMissing: false,
    allowEmpty: false,
    allowNumeric: true,
  });
  const stateCandidate = createStateCandidate(context, routeMatchId);

  if (explicitVisibleNonX01) {
    return resolveVisibleNonX01Truth({
      documentRef,
      routeMatchId,
      domVariant,
      stateCandidate,
      x01Rules,
    });
  }

  const routeOptions = context.x01ReadScope
    ? { modernTurnSurface: modernSurface.turnContainer ? modernSurface : null }
    : {};
  const routeEntries = collectVisibleCheckoutRouteEntries(documentRef, windowRef, x01Rules, routeOptions);
  const routeSegments = routeEntries.flatMap((entry) =>
    Array.isArray(entry?.segments) ? entry.segments : []
  );
  const domCandidate = createDomCandidate(
    context,
    routeMatchId,
    modernSurface,
    domVariant
  );
  const base = {
    routeEntries,
    routeSegments,
    domScore: domCandidate.activeScore,
    gameStateScore: stateCandidate.foreignMatch ? Number.NaN : stateCandidate.activeScore,
  };
  const diagnostics = buildTruthDiagnostics(
    routeMatchId,
    domVariant,
    stateCandidate,
    domCandidate
  );

  const boundaryKey = !stateCandidate.foreignMatch && stateCandidate.gameBoundaryToken
    ? stateCandidate.gameBoundaryToken
    : routeMatchId || stateCandidate.matchId || "x01-unidentified";
  const { decision, history, usedUnidentifiedStateFallback } = resolveCandidateDecision(
    {
      ...context,
      preferStateWhenUnidentified: !routeMatchId && !modernSurface?.variantNode,
    },
    stateCandidate,
    domCandidate,
    boundaryKey
  );
  const selected = mergeSelectedCandidate(decision, stateCandidate, domCandidate);
  const activeByDom = isCandidateX01Active({ variant: domVariant });
  const activeByState = !stateCandidate.foreignMatch &&
    isCandidateX01Active(stateCandidate, gameState);
  const active = activeByDom || activeByState;
  const selectedHasAtomicSemantics = hasAtomicSemantics(
    selected,
    routeMatchId,
    modernSurface
  );
  const actionable = active && Boolean(selected) && selectedHasAtomicSemantics &&
    decision !== "pending" && decision !== "conflict";
  applyDecisionDiagnostics({
    diagnostics,
    stateCandidate,
    selected,
    selectedHasAtomicSemantics,
    decision,
    usedUnidentifiedStateFallback,
  });

  if (actionable) {
    rememberSelectedCandidate(history, selected, stateCandidate, domCandidate);
  }
  const activeScore = actionable ? selected.activeScore : Number.NaN;
  const outMode = actionable ? normalizeOutMode(selected.outMode) : "";
  const dartsRemaining = actionable
    ? normalizeDartsRemaining(selected.dartsRemaining)
    : Number.NaN;
  const routeUsable = actionable && (
    decision !== "state-preferred" || usedUnidentifiedStateFallback
  );
  const semanticRouteSegments = routeUsable
    ? routeSegments
    : [];
  const checkoutSurface = resolveCheckoutSurfaceSemantics({
    routeSegments: semanticRouteSegments,
    activeScore,
    outMode,
    dartsRemaining,
    x01Rules,
  });
  return buildResolvedTruth({
    base,
    active,
    actionable,
    selected,
    domVariant,
    stateCandidate,
    routeMatchId,
    activeScore,
    outMode,
    dartsRemaining,
    decision,
    domCandidate,
    routeUsable,
    routeEntries,
    routeSegments,
    checkoutSurface,
    diagnostics,
  });
}
