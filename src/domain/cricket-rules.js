import { classifyCricketGameMode } from "./variant-rules.js";

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

export function getTargetOrderByGameMode(gameMode) {
  const mode = classifyCricketGameMode(gameMode);
  return mode === "tactics" ? TACTICS_TARGET_ORDER : CRICKET_TARGET_ORDER;
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
  const opponentMarks = resolvedMarks.filter((_, index) => index !== resolvedIndex);
  const showDeadTargets = options.showDeadTargets !== false;
  const supportsTacticalHighlights = Boolean(options.supportsTacticalHighlights);

  const dead =
    showDeadTargets &&
    resolvedMarks.length > 1 &&
    resolvedMarks.every((mark) => mark >= 3);

  const offense =
    supportsTacticalHighlights &&
    marks >= 3 &&
    opponentMarks.some((mark) => mark < 3) &&
    !dead;

  const danger =
    supportsTacticalHighlights &&
    marks < 3 &&
    opponentMarks.some((mark) => mark >= 3) &&
    !dead;

  const pressure = danger && marks <= 1;
  const closed = marks >= 3 && !offense && !dead;

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
  };
}

export function computeTargetStates(marksByLabel, options = {}) {
  const stateMap = new Map();
  const gameMode = options.gameMode || "";
  const targetOrder = getTargetOrderByGameMode(gameMode);
  const supportsTacticalHighlights = options.supportsTacticalHighlights !== false;

  targetOrder.forEach((targetLabel) => {
    const marksByPlayer = (Array.isArray(marksByLabel?.[targetLabel])
      ? marksByLabel[targetLabel]
      : []
    ).map((value) => clampMarks(value));

    if (!marksByPlayer.length) {
      return;
    }

    const activePlayerIndex = Math.max(
      0,
      Math.min(
        Number.isFinite(options.activePlayerIndex)
          ? Number(options.activePlayerIndex)
          : 0,
        marksByPlayer.length - 1
      )
    );

    const cellStates = marksByPlayer.map((_, index) =>
      evaluatePlayerTargetState(marksByPlayer, index, {
        activePlayerIndex,
        showDeadTargets: options.showDeadTargets,
        supportsTacticalHighlights,
      })
    );

    const boardState =
      cellStates[activePlayerIndex] ||
      evaluatePlayerTargetState(marksByPlayer, activePlayerIndex, {
        activePlayerIndex,
        showDeadTargets: options.showDeadTargets,
        supportsTacticalHighlights,
      });

    const presentation = boardState.presentation || "open";

    stateMap.set(targetLabel, {
      label: targetLabel,
      modeFamily: classifyCricketGameMode(gameMode) || "cricket",
      rawMode: String(gameMode || ""),
      activePlayerIndex,
      marksByPlayer,
      activeMarks: boardState.marks,
      offense: boardState.offense,
      danger: boardState.danger,
      pressure: boardState.pressure,
      closed: boardState.closed,
      dead: boardState.dead,
      presentation,
      boardPresentation: presentation,
      boardState,
      cellStates,
    });
  });

  return stateMap;
}