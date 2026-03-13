import {
  classifyCricketGameMode,
  classifyCricketScoringMode,
} from "./variant-rules.js";

export const CRICKET_TARGET_ORDER = ["20", "19", "18", "17", "16", "15", "BULL"];

export const TACTICS_TARGET_ORDER = [
  "20",
  "19",
  "18",
  "17",
  "16",
  "15",
  "14",
  "13",
  "12",
  "11",
  "10",
  "BULL",
];

export const TACTICS_EXTRA_TARGETS = ["DOUBLE", "TRIPLE"];
export const CRICKET_DISCOVERY_TARGET_ORDER = [
  ...TACTICS_TARGET_ORDER,
  ...TACTICS_EXTRA_TARGETS,
];

const TARGET_SET = new Set(CRICKET_DISCOVERY_TARGET_ORDER);
const TACTICS_ONLY_TARGETS = new Set(["14", "13", "12", "11", "10"]);
const TACTICS_EXTRA_TARGET_SET = new Set(TACTICS_EXTRA_TARGETS);
const WIN_EVALUATORS_BY_SCORING_MODE = Object.freeze({
  standard({ score, highestScore, allTargetsClosed }) {
    const leading = score === highestScore;
    return {
      leading,
      winner: allTargetsClosed && leading,
    };
  },
  cutthroat({ score, lowestScore, allTargetsClosed }) {
    const leading = score === lowestScore;
    return {
      leading,
      winner: allTargetsClosed && leading,
    };
  },
  neutral({ allTargetsClosed }) {
    return {
      leading: allTargetsClosed,
      winner: allTargetsClosed,
    };
  },
});

function resolveCricketWinFlags(scoringModeNormalized, options = {}) {
  const evaluateByMode = WIN_EVALUATORS_BY_SCORING_MODE[
    String(scoringModeNormalized || "").trim().toLowerCase()
  ];
  if (typeof evaluateByMode !== "function") {
    return {
      leading: false,
      winner: false,
    };
  }
  return evaluateByMode(options);
}

function summarizeMarksByPlayer(resolvedMarks, resolvedIndex) {
  let allClosed = resolvedMarks.length > 0;
  let openOpponentCount = 0;
  let closedOpponentCount = 0;

  resolvedMarks.forEach((mark, index) => {
    const isClosed = mark >= 3;
    if (!isClosed) {
      allClosed = false;
    }
    if (index === resolvedIndex) {
      return;
    }

    if (isClosed) {
      closedOpponentCount += 1;
    } else {
      openOpponentCount += 1;
    }
  });

  return {
    allClosed,
    openOpponentCount,
    closedOpponentCount,
    hasOpenOpponent: openOpponentCount > 0,
    hasClosedOpponent: closedOpponentCount > 0,
  };
}

function getScoreRange(scoresByPlayer) {
  if (!Array.isArray(scoresByPlayer) || !scoresByPlayer.length) {
    return {
      highestScore: 0,
      lowestScore: 0,
    };
  }

  let highestScore = scoresByPlayer[0];
  let lowestScore = scoresByPlayer[0];

  for (let index = 1; index < scoresByPlayer.length; index += 1) {
    const score = scoresByPlayer[index];
    if (score > highestScore) {
      highestScore = score;
    }
    if (score < lowestScore) {
      lowestScore = score;
    }
  }

  return {
    highestScore,
    lowestScore,
  };
}

function toSafePlayerCount(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return 0;
  }
  return Math.max(0, Math.round(numeric));
}

function resolvePlayerCount(baseMarksByLabel, targetOrder, playerIndex, requestedPlayerCount) {
  const fromBaseMarks = Object.values(baseMarksByLabel || {}).reduce((max, values) => {
    return Array.isArray(values) ? Math.max(max, values.length) : max;
  }, 0);

  return Math.max(
    toSafePlayerCount(requestedPlayerCount),
    fromBaseMarks,
    Number.isFinite(playerIndex) ? Math.max(0, playerIndex + 1) : 0
  );
}

function cloneMarksByLabel(baseMarksByLabel, targetOrder, playerCount) {
  const next = {};

  targetOrder.forEach((label) => {
    const source = Array.isArray(baseMarksByLabel?.[label]) ? baseMarksByLabel[label] : [];
    const values = source.map((value) => clampMarks(value));

    while (values.length < playerCount) {
      values.push(0);
    }

    next[label] = values;
  });

  return next;
}

function resolveScoringModeNormalized(options = {}) {
  if (typeof options.scoringModeNormalized === "string" && options.scoringModeNormalized.trim()) {
    return options.scoringModeNormalized.trim().toLowerCase();
  }

  if (Object.prototype.hasOwnProperty.call(options, "scoringMode")) {
    return classifyCricketScoringMode(options.scoringMode);
  }

  return "unknown";
}

function resolveSupportsTacticalHighlights(options = {}) {
  if (typeof options.supportsTacticalHighlights === "boolean") {
    return options.supportsTacticalHighlights;
  }

  if (
    Object.prototype.hasOwnProperty.call(options, "scoringMode") ||
    Object.prototype.hasOwnProperty.call(options, "scoringModeNormalized")
  ) {
    const scoringModeNormalized = resolveScoringModeNormalized(options);
    return scoringModeNormalized === "standard" || scoringModeNormalized === "cutthroat";
  }

  return true;
}

function normalizeSegmentName(segment) {
  const raw = String(segment || "").trim().toUpperCase();
  if (!raw) {
    return "";
  }

  if (
    raw === "BULL" ||
    raw === "BULLSEYE" ||
    raw === "DBULL" ||
    raw === "DB" ||
    raw === "D25" ||
    raw === "DOUBLE BULL"
  ) {
    return "BULL";
  }

  if (
    raw === "SBULL" ||
    raw === "SB" ||
    raw === "OB" ||
    raw === "OUTER BULL" ||
    raw === "S25" ||
    raw === "25"
  ) {
    return "S25";
  }

  const match = raw.match(/^([SDT])\s*(\d{1,2})$/);
  if (match) {
    return `${match[1]}${Number(match[2])}`;
  }

  if (/^\d{1,2}$/.test(raw)) {
    return `S${Number(raw)}`;
  }

  return raw;
}

function readSegmentDescriptor(throwEntry) {
  if (!throwEntry || typeof throwEntry !== "object") {
    return null;
  }

  return throwEntry.segment && typeof throwEntry.segment === "object"
    ? throwEntry.segment
    : throwEntry;
}

function buildSegmentNameFromDescriptor(segment) {
  const name = normalizeSegmentName(segment?.name || segment?.segment || segment?.label || "");
  if (name) {
    return name;
  }

  const numericValue = Number(segment?.number ?? segment?.value ?? NaN);
  const multiplier = Number(segment?.multiplier ?? segment?.marks ?? NaN);
  const bed = String(segment?.bed || "").trim().toLowerCase();

  if (numericValue === 25) {
    if (multiplier === 2 || bed.includes("double") || bed.includes("inner")) {
      return "BULL";
    }
    if (multiplier === 1 || bed.includes("single") || bed.includes("outer")) {
      return "S25";
    }
  }

  if (numericValue >= 1 && numericValue <= 20) {
    if (multiplier === 3 || bed.includes("triple")) {
      return `T${numericValue}`;
    }
    if (multiplier === 2 || bed.includes("double")) {
      return `D${numericValue}`;
    }
    if (multiplier === 1 || !Number.isFinite(multiplier) || bed.includes("single")) {
      return `S${numericValue}`;
    }
  }

  return "";
}

function getResolvedModeFamily(gameMode, targetOrder) {
  const normalized = classifyCricketGameMode(gameMode);
  if (normalized) {
    return normalized;
  }

  if (
    Array.isArray(targetOrder) &&
    targetOrder.some((label) => TACTICS_ONLY_TARGETS.has(label) || TACTICS_EXTRA_TARGET_SET.has(label))
  ) {
    return "tactics";
  }

  return "cricket";
}

function getOpenOpponentIndexes(marksByPlayer, playerIndex) {
  return marksByPlayer.reduce((result, mark, index) => {
    if (index !== playerIndex && clampMarks(mark) < 3) {
      result.push(index);
    }
    return result;
  }, []);
}

export function clampMarks(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 0;
  }
  return Math.max(0, Math.min(3, Math.round(numeric)));
}

export function parseCricketMarkValue(value) {
  const raw = String(value || "").trim();
  if (!raw) {
    return null;
  }

  const direct = Number.parseInt(raw, 10);
  if (Number.isFinite(direct) && direct >= 0 && direct <= 3) {
    return clampMarks(direct);
  }

  const normalized = raw
    .replace(/\s+/g, "")
    .toUpperCase();

  if (!normalized) {
    return null;
  }

  // Dedicated symbols used in legacy and current cricket scoreboards.
  if (/[\u2A02\u2297\u29BB]/u.test(normalized)) {
    return 3;
  }
  if (/[\u00D7\u2715\u2716\u2573X]/u.test(normalized)) {
    return 2;
  }
  if (normalized.includes("/") || normalized.includes("|")) {
    return 1;
  }
  // Guard against throw/score tokens like "D18", "T20", "36", "60".
  if (/^[SDT]\s*\d{1,2}$/i.test(normalized)) {
    return null;
  }

  // Accept a single standalone mark digit wrapped by non-digits.
  const digit = normalized.match(/^[^0-9]*([0-3])[^0-9]*$/);
  if (digit) {
    return clampMarks(Number.parseInt(digit[1], 10));
  }

  return null;
}

export function normalizeCricketLabel(value) {
  const text = String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();

  if (!text) {
    return "";
  }

  if (TARGET_SET.has(text)) {
    return text;
  }

  if (text === "25" || text === "BULLSEYE" || text === "BULL'S EYE") {
    return "BULL";
  }

  if (text.includes("BULL")) {
    return "BULL";
  }

  if (
    text === "DOUBLE" ||
    text === "DOUBLES" ||
    text === "DOPPEL" ||
    text === "DOPPELT" ||
    text.includes("DOUBLE") ||
    text.includes("DOPPEL")
  ) {
    return "DOUBLE";
  }

  if (
    text === "TRIPLE" ||
    text === "TRIPLES" ||
    text === "TREBLE" ||
    text === "DREIFACH" ||
    text.includes("TRIPLE") ||
    text.includes("TREBLE") ||
    text.includes("DREIFACH")
  ) {
    return "TRIPLE";
  }

  const numberMatch = text.match(
    /(?:^|[^0-9])(20|19|18|17|16|15|14|13|12|11|10)(?:[^0-9]|$)/
  );

  return numberMatch ? numberMatch[1] : "";
}

export function inferCricketGameModeByLabels(labels) {
  const normalizedLabels = Array.isArray(labels)
    ? labels.map((label) => normalizeCricketLabel(label)).filter(Boolean)
    : [];

  if (!normalizedLabels.length) {
    return "";
  }

  if (
    normalizedLabels.some(
      (label) => TACTICS_ONLY_TARGETS.has(label) || TACTICS_EXTRA_TARGET_SET.has(label)
    )
  ) {
    return "tactics";
  }

  return "cricket";
}

export function getTargetOrderByGameMode(gameMode) {
  const mode = classifyCricketGameMode(gameMode);
  return mode === "tactics" ? TACTICS_TARGET_ORDER : CRICKET_TARGET_ORDER;
}

export function resolveTargetOrderByGameModeAndLabels(gameMode, labels) {
  const mode = classifyCricketGameMode(gameMode) || inferCricketGameModeByLabels(labels);
  if (mode !== "tactics") {
    return CRICKET_TARGET_ORDER.slice();
  }

  const normalizedLabels = Array.isArray(labels)
    ? labels.map((label) => normalizeCricketLabel(label)).filter(Boolean)
    : [];
  if (!normalizedLabels.length) {
    return TACTICS_TARGET_ORDER.slice();
  }

  const labelSet = new Set(normalizedLabels);
  const numericAndBull = TACTICS_TARGET_ORDER.filter((label) => labelSet.has(label));
  const tacticalExtras = TACTICS_EXTRA_TARGETS.filter((label) => labelSet.has(label));
  const dynamicOrder = [...numericAndBull, ...tacticalExtras];
  return dynamicOrder.length ? dynamicOrder : TACTICS_TARGET_ORDER.slice();
}

export function createEmptyMarksByLabel(targetOrder, playerCount = 0) {
  const normalizedPlayerCount = toSafePlayerCount(playerCount);
  const order = Array.isArray(targetOrder) && targetOrder.length
    ? targetOrder
    : CRICKET_TARGET_ORDER;

  return order.reduce((result, label) => {
    result[label] = Array.from({ length: normalizedPlayerCount }, () => 0);
    return result;
  }, {});
}

export function getCricketTargetBaseScore(label) {
  const normalizedLabel = normalizeCricketLabel(label);
  if (!normalizedLabel) {
    return 0;
  }
  if (normalizedLabel === "BULL") {
    return 25;
  }

  const numeric = Number(normalizedLabel);
  return Number.isFinite(numeric) ? numeric : 0;
}

export function parseCricketThrowSegment(throwEntry) {
  const segment = readSegmentDescriptor(throwEntry);
  const normalizedName = buildSegmentNameFromDescriptor(segment);
  if (!normalizedName) {
    return null;
  }

  if (normalizedName === "BULL") {
    return {
      ring: "D",
      value: 25,
      marks: 2,
      label: "BULL",
      points: 50,
    };
  }

  if (normalizedName === "S25") {
    return {
      ring: "S",
      value: 25,
      marks: 1,
      label: "BULL",
      points: 25,
    };
  }

  const match = normalizedName.match(/^([SDT])(\d{1,2})$/);
  if (!match) {
    return null;
  }

  const ring = match[1];
  const value = Number(match[2]);
  if (!(value >= 1 && value <= 20)) {
    return null;
  }

  const marks = ring === "T" ? 3 : ring === "D" ? 2 : 1;
  return {
    ring,
    value,
    marks,
    label: String(value),
    points: value * marks,
  };
}

export function applyCricketThrowsToState(options = {}) {
  const explicitTargetOrder = Array.isArray(options.targetOrder) && options.targetOrder.length
    ? options.targetOrder.filter(Boolean)
    : CRICKET_TARGET_ORDER;
  const playerIndex = Number.isFinite(Number(options.playerIndex))
    ? Math.max(0, Math.round(Number(options.playerIndex)))
    : 0;
  const throws = Array.isArray(options.throws) ? options.throws : [];
  const baseMarksByLabel =
    options.baseMarksByLabel && typeof options.baseMarksByLabel === "object"
      ? options.baseMarksByLabel
      : createEmptyMarksByLabel(explicitTargetOrder, playerIndex + 1);
  const playerCount = resolvePlayerCount(
    baseMarksByLabel,
    explicitTargetOrder,
    playerIndex,
    options.playerCount
  );
  const nextMarksByLabel = cloneMarksByLabel(baseMarksByLabel, explicitTargetOrder, playerCount);
  const scoreDeltaByPlayer = Array.from({ length: playerCount }, () => 0);
  const scoringModeNormalized = resolveScoringModeNormalized(options);
  const scoringEvents = [];

  throws.forEach((throwEntry) => {
    const parsed = parseCricketThrowSegment(throwEntry);
    if (!parsed || !explicitTargetOrder.includes(parsed.label)) {
      return;
    }

    const marksByPlayer = nextMarksByLabel[parsed.label];
    const currentMarks = clampMarks(marksByPlayer[playerIndex] || 0);
    const marksToClose = Math.max(0, 3 - currentMarks);
    const appliedMarks = Math.min(parsed.marks, marksToClose);
    const overflowMarks = Math.max(0, parsed.marks - marksToClose);

    marksByPlayer[playerIndex] = clampMarks(currentMarks + appliedMarks);

    const openOpponentIndexes = getOpenOpponentIndexes(marksByPlayer, playerIndex);
    if (!(overflowMarks > 0) || !openOpponentIndexes.length) {
      return;
    }

    const baseScore = getCricketTargetBaseScore(parsed.label);
    const totalPoints = overflowMarks * baseScore;
    if (!(totalPoints > 0)) {
      return;
    }

    const recipients = [];

    if (scoringModeNormalized === "standard") {
      scoreDeltaByPlayer[playerIndex] += totalPoints;
      recipients.push({ playerIndex, delta: totalPoints });
    } else if (scoringModeNormalized === "cutthroat") {
      openOpponentIndexes.forEach((opponentIndex) => {
        scoreDeltaByPlayer[opponentIndex] += totalPoints;
        recipients.push({ playerIndex: opponentIndex, delta: totalPoints });
      });
    } else {
      return;
    }

    scoringEvents.push({
      label: parsed.label,
      ring: parsed.ring,
      marks: parsed.marks,
      appliedMarks,
      overflowMarks,
      baseScore,
      totalPoints,
      playerIndex,
      recipients,
    });
  });

  return {
    targetOrder: explicitTargetOrder,
    nextMarksByLabel,
    scoreDeltaByPlayer,
    scoringModeNormalized,
    scoringEvents,
  };
}

export function applyThrowsToMarksByLabel(options = {}) {
  return applyCricketThrowsToState(options).nextMarksByLabel;
}

export function evaluatePlayerTargetState(marksByPlayer, playerIndex, options = {}) {
  const resolvedMarks = Array.isArray(marksByPlayer)
    ? marksByPlayer.map((value) => clampMarks(value))
    : [];

  const resolvedIndex =
    resolvedMarks.length > 0
      ? Math.max(0, Math.min(Number(playerIndex) || 0, resolvedMarks.length - 1))
      : 0;

  const marks = resolvedMarks[resolvedIndex] || 0;
  const open = marks < 3;
  const closed = marks >= 3;
  const markSummary = summarizeMarksByPlayer(resolvedMarks, resolvedIndex);
  const allClosed = markSummary.allClosed;
  const dead = allClosed;
  const openOpponentCount = markSummary.openOpponentCount;
  const closedOpponentCount = markSummary.closedOpponentCount;
  const scorableForPlayer = closed && markSummary.hasOpenOpponent && !allClosed;
  const scorableAgainstPlayer = !closed && markSummary.hasClosedOpponent && !allClosed;
  const offense = scorableForPlayer;
  const danger = scorableAgainstPlayer;
  const pressure = scorableAgainstPlayer;
  const scoring = scorableForPlayer;

  let presentation = "open";
  if (dead) {
    presentation = "dead";
  } else if (scoring) {
    presentation = "scoring";
  } else if (pressure) {
    presentation = "pressure";
  }

  return {
    index: resolvedIndex,
    marks,
    open,
    isActivePlayer: resolvedIndex === options.activePlayerIndex,
    presentation,
    own: closed,
    scoring,
    offense,
    danger,
    pressure,
    closed,
    dead,
    allClosed,
    opponentsOpen: openOpponentCount > 0,
    openOpponentCount,
    closedOpponentCount,
    scorable: scorableForPlayer,
    threatenedByOpponents: scorableAgainstPlayer,
    scorableForPlayer,
    scorableAgainstPlayer,
  };
}

export function computeTargetStates(marksByLabel, options = {}) {
  const stateMap = new Map();
  const inferredMode = inferCricketGameModeByLabels(Object.keys(marksByLabel || {}));
  const modeFamily = getResolvedModeFamily(options.gameMode || inferredMode, options.targetOrder);
  const targetOrder = Array.isArray(options.targetOrder) && options.targetOrder.length
    ? options.targetOrder.filter(Boolean)
    : getTargetOrderByGameMode(modeFamily);
  const scoringModeNormalized = resolveScoringModeNormalized(options);

  targetOrder.forEach((targetLabel) => {
    const marksByPlayer = (Array.isArray(marksByLabel?.[targetLabel]) ? marksByLabel[targetLabel] : [])
      .map((value) => clampMarks(value));

    if (!marksByPlayer.length) {
      return;
    }

    const activePlayerIndex = Math.max(
      0,
      Math.min(
        Number.isFinite(options.activePlayerIndex) ? Number(options.activePlayerIndex) : 0,
        marksByPlayer.length - 1
      )
    );

    const cellStates = marksByPlayer.map((_, index) =>
      evaluatePlayerTargetState(marksByPlayer, index, {
        activePlayerIndex,
        scoringModeNormalized,
      })
    );

    const boardState = cellStates[activePlayerIndex];

    const presentation = boardState.presentation || "open";
    const openOpponentCount = Number(boardState?.openOpponentCount || 0);
    const closedOpponentCount = Number(boardState?.closedOpponentCount || 0);

    stateMap.set(targetLabel, {
      label: targetLabel,
      modeFamily,
      rawMode: String(options.gameMode || ""),
      scoringMode: Object.prototype.hasOwnProperty.call(options, "scoringMode")
        ? String(options.scoringMode || "")
        : "",
      scoringModeNormalized,
      activePlayerIndex,
      marksByPlayer,
      activeMarks: boardState.marks,
      open: boardState.open,
      scoring: boardState.scoring,
      offense: boardState.offense,
      danger: boardState.danger,
      pressure: boardState.pressure,
      own: boardState.own,
      closed: boardState.closed,
      dead: boardState.dead,
      allClosed: boardState.allClosed,
      opponentsOpen: boardState.opponentsOpen,
      openOpponentCount,
      closedOpponentCount,
      scorable: boardState.scorable,
      threatenedByOpponents: boardState.threatenedByOpponents,
      scorableForPlayer: boardState.scorableForPlayer,
      scorableAgainstPlayer: boardState.scorableAgainstPlayer,
      presentation,
      boardPresentation: presentation,
      boardState,
      cellStates,
    });
  });

  return stateMap;
}

function toTargetOrderForDiff(options = {}) {
  const explicitTargetOrder = Array.isArray(options.targetOrder)
    ? options.targetOrder.filter(Boolean)
    : [];
  if (explicitTargetOrder.length) {
    return explicitTargetOrder;
  }

  const previousLabels = Object.keys(options.previousMarksByLabel || {});
  const nextLabels = Object.keys(options.nextMarksByLabel || {});
  const combined = Array.from(new Set([...previousLabels, ...nextLabels]));
  if (combined.length) {
    return combined;
  }

  return TACTICS_TARGET_ORDER.slice();
}

function resolveTargetOrderForWinState(options = {}) {
  const explicitTargetOrder = Array.isArray(options.targetOrder)
    ? options.targetOrder.filter(Boolean)
    : [];
  if (explicitTargetOrder.length) {
    return explicitTargetOrder;
  }

  const inferredMode = inferCricketGameModeByLabels(Object.keys(options.marksByLabel || {}));
  return getTargetOrderByGameMode(options.gameMode || inferredMode);
}

function resolveCricketWinPlayerCount(marksByLabel, scoresByPlayer) {
  const scoreCount = Array.isArray(scoresByPlayer) ? scoresByPlayer.length : 0;
  const markCount = Object.values(marksByLabel || {}).reduce((max, values) => {
    return Array.isArray(values) ? Math.max(max, values.length) : max;
  }, 0);

  return Math.max(scoreCount, markCount);
}

function normalizePlayerScores(scoresByPlayer, playerCount) {
  return Array.from({ length: Math.max(0, playerCount) }, (_, index) => {
    const numeric = Number(scoresByPlayer?.[index]);
    return Number.isFinite(numeric) ? numeric : 0;
  });
}

function countClosedTargetsForPlayer(marksByLabel, targetOrder, playerIndex) {
  return targetOrder.reduce((count, label) => {
    return clampMarks(marksByLabel?.[label]?.[playerIndex]) >= 3 ? count + 1 : count;
  }, 0);
}

export function evaluateCricketWinState(options = {}) {
  const marksByLabel =
    options.marksByLabel && typeof options.marksByLabel === "object"
      ? options.marksByLabel
      : {};
  const targetOrder = resolveTargetOrderForWinState({
    targetOrder: options.targetOrder,
    marksByLabel,
    gameMode: options.gameMode,
  });
  const scoringModeNormalized = resolveScoringModeNormalized(options);
  const playerCount = resolveCricketWinPlayerCount(marksByLabel, options.scoresByPlayer);
  const scoresByPlayer = normalizePlayerScores(options.scoresByPlayer, playerCount);

  const { highestScore, lowestScore } = getScoreRange(scoresByPlayer);

  const playerStates = Array.from({ length: playerCount }, (_, playerIndex) => {
    const closedTargetCount = countClosedTargetsForPlayer(marksByLabel, targetOrder, playerIndex);
    const allTargetsClosed = targetOrder.length > 0 && closedTargetCount === targetOrder.length;
    const score = scoresByPlayer[playerIndex] || 0;

    const { leading, winner } = resolveCricketWinFlags(scoringModeNormalized, {
      score,
      highestScore,
      lowestScore,
      allTargetsClosed,
    });

    return {
      playerIndex,
      score,
      closedTargetCount,
      remainingTargets: Math.max(0, targetOrder.length - closedTargetCount),
      allTargetsClosed,
      leading,
      winner,
    };
  });

  const winnerIndexes = playerStates
    .filter((playerState) => playerState.winner)
    .map((playerState) => playerState.playerIndex);

  return {
    targetOrder,
    scoringModeNormalized,
    playerCount,
    highestScore,
    lowestScore,
    hasWinner: winnerIndexes.length > 0,
    isTie: winnerIndexes.length > 1,
    winnerIndexes,
    playerStates,
  };
}

export function diffMarksByLabel(options = {}) {
  const previousMarksByLabel =
    options.previousMarksByLabel && typeof options.previousMarksByLabel === "object"
      ? options.previousMarksByLabel
      : {};
  const nextMarksByLabel =
    options.nextMarksByLabel && typeof options.nextMarksByLabel === "object"
      ? options.nextMarksByLabel
      : {};
  const targetOrder = toTargetOrderForDiff({
    targetOrder: options.targetOrder,
    previousMarksByLabel,
    nextMarksByLabel,
  });

  const diffMap = new Map();

  targetOrder.forEach((label) => {
    const previous = Array.isArray(previousMarksByLabel[label])
      ? previousMarksByLabel[label].map((value) => clampMarks(value))
      : [];
    const next = Array.isArray(nextMarksByLabel[label])
      ? nextMarksByLabel[label].map((value) => clampMarks(value))
      : [];
    const playerCount = Math.max(previous.length, next.length);
    const playerDeltas = Array.from({ length: playerCount }, (_, index) => {
      return clampMarks(next[index] || 0) - clampMarks(previous[index] || 0);
    });
    const changed = playerDeltas.some((delta) => delta !== 0);
    const hasIncrease = playerDeltas.some((delta) => delta > 0);
    const maxIncrease = playerDeltas.reduce((max, delta) => {
      return delta > max ? delta : max;
    }, 0);

    diffMap.set(label, {
      label,
      previousMarks: previous,
      nextMarks: next,
      playerDeltas,
      changed,
      hasIncrease,
      maxIncrease,
    });
  });

  return diffMap;
}

export function deriveTargetTransitions(options = {}) {
  const previousStateMap = options.previousStateMap instanceof Map ? options.previousStateMap : new Map();
  const nextStateMap = options.nextStateMap instanceof Map ? options.nextStateMap : new Map();
  const targetOrder = Array.isArray(options.targetOrder)
    ? options.targetOrder.filter(Boolean)
    : Array.from(new Set([...previousStateMap.keys(), ...nextStateMap.keys()]));

  const transitionMap = new Map();
  targetOrder.forEach((label) => {
    const previousState = previousStateMap.get(label) || null;
    const nextState = nextStateMap.get(label) || null;
    const previousPresentation = String(
      previousState?.boardPresentation || previousState?.presentation || "open"
    ).toLowerCase();
    const nextPresentation = String(
      nextState?.boardPresentation || nextState?.presentation || "open"
    ).toLowerCase();

    transitionMap.set(label, {
      label,
      previousPresentation,
      nextPresentation,
      presentationChanged: previousPresentation !== nextPresentation,
      becameScoring: previousPresentation !== "scoring" && nextPresentation === "scoring",
      becameOffense: previousPresentation !== "scoring" && nextPresentation === "scoring",
      becameDanger: previousPresentation !== "pressure" && nextPresentation === "pressure",
      becamePressure: previousPresentation !== "pressure" && nextPresentation === "pressure",
      becameClosed: previousPresentation !== "dead" && nextPresentation === "dead",
      becameDead: previousPresentation !== "dead" && nextPresentation === "dead",
    });
  });

  return transitionMap;
}
