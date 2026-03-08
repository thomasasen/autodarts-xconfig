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

const TARGET_SET = new Set(TACTICS_TARGET_ORDER);
const TACTICS_ONLY_TARGETS = new Set(["14", "13", "12", "11", "10"]);

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

  if (Array.isArray(targetOrder) && targetOrder.some((label) => TACTICS_ONLY_TARGETS.has(label))) {
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

  if (normalizedLabels.some((label) => TACTICS_ONLY_TARGETS.has(label))) {
    return "tactics";
  }

  return "cricket";
}

export function getTargetOrderByGameMode(gameMode) {
  const mode = classifyCricketGameMode(gameMode);
  return mode === "tactics" ? TACTICS_TARGET_ORDER : CRICKET_TARGET_ORDER;
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
  const closed = marks >= 3;
  const allClosed = resolvedMarks.length > 0 && resolvedMarks.every((mark) => mark >= 3);
  const dead = resolvedMarks.length > 1 && allClosed;
  const opponentMarks = resolvedMarks.filter((_, index) => index !== resolvedIndex);
  const scorableForPlayer = closed && opponentMarks.some((mark) => mark < 3) && !allClosed;
  const scorableAgainstPlayer = !closed && opponentMarks.some((mark) => mark >= 3) && !allClosed;
  const supportsTacticalHighlights = resolveSupportsTacticalHighlights(options);
  const offense = supportsTacticalHighlights && scorableForPlayer;
  const danger = supportsTacticalHighlights && scorableAgainstPlayer;
  const pressure = danger && marks <= 1;

  let presentation = "open";
  if (dead) {
    presentation = "dead";
  } else if (offense) {
    presentation = "offense";
  } else if (pressure) {
    presentation = "pressure";
  } else if (danger) {
    presentation = "danger";
  } else if (closed) {
    presentation = "closed";
  }

  return {
    index: resolvedIndex,
    marks,
    isActivePlayer: resolvedIndex === options.activePlayerIndex,
    presentation,
    offense,
    danger,
    pressure,
    closed,
    dead,
    allClosed,
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
  const supportsTacticalHighlights = resolveSupportsTacticalHighlights(options);

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
        supportsTacticalHighlights,
        scoringModeNormalized,
      })
    );

    const boardState =
      cellStates[activePlayerIndex] ||
      evaluatePlayerTargetState(marksByPlayer, activePlayerIndex, {
        activePlayerIndex,
        supportsTacticalHighlights,
        scoringModeNormalized,
      });

    const presentation = boardState.presentation || "open";

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
      offense: boardState.offense,
      danger: boardState.danger,
      pressure: boardState.pressure,
      closed: boardState.closed,
      dead: boardState.dead,
      allClosed: boardState.allClosed,
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
      becameOffense: previousPresentation !== "offense" && nextPresentation === "offense",
      becameDanger: previousPresentation !== "danger" && nextPresentation === "danger",
      becamePressure: previousPresentation !== "pressure" && nextPresentation === "pressure",
      becameClosed: previousPresentation !== "closed" && nextPresentation === "closed",
      becameDead: previousPresentation !== "dead" && nextPresentation === "dead",
    });
  });

  return transitionMap;
}
