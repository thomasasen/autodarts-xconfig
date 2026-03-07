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

function toSafePlayerCount(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return 0;
  }
  return Math.max(0, Math.round(numeric));
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

function normalizeSegmentName(value) {
  const raw = String(value || "").trim().toUpperCase();
  if (!raw) {
    return "";
  }

  if (raw === "BULL" || raw === "BULLSEYE" || raw === "DBULL" || raw === "DB") {
    return "BULL";
  }
  if (raw === "SBULL" || raw === "SB" || raw === "OB" || raw === "S25") {
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

export function parseCricketThrowSegment(throwEntry) {
  if (!throwEntry || typeof throwEntry !== "object") {
    return null;
  }

  const segment = throwEntry.segment && typeof throwEntry.segment === "object"
    ? throwEntry.segment
    : throwEntry;
  const normalizedName = normalizeSegmentName(
    segment.name ||
      segment.segment ||
      segment.label ||
      ""
  );
  if (!normalizedName) {
    return null;
  }

  if (normalizedName === "BULL") {
    return {
      ring: "D",
      value: 25,
      marks: 2,
      label: "BULL",
    };
  }

  if (normalizedName === "S25") {
    return {
      ring: "S",
      value: 25,
      marks: 1,
      label: "BULL",
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

  return {
    ring,
    value,
    marks: ring === "T" ? 3 : ring === "D" ? 2 : 1,
    label: String(value),
  };
}

export function applyThrowsToMarksByLabel(options = {}) {
  const targetOrder = Array.isArray(options.targetOrder) && options.targetOrder.length
    ? options.targetOrder
    : CRICKET_TARGET_ORDER;
  const playerIndex = Number.isFinite(Number(options.playerIndex))
    ? Math.max(0, Math.round(Number(options.playerIndex)))
    : 0;
  const throws = Array.isArray(options.throws) ? options.throws : [];
  const baseMarks = options.baseMarksByLabel && typeof options.baseMarksByLabel === "object"
    ? options.baseMarksByLabel
    : createEmptyMarksByLabel(targetOrder, playerIndex + 1);
  const marksByLabel = Object.keys(baseMarks).reduce((result, label) => {
    const values = Array.isArray(baseMarks[label]) ? baseMarks[label] : [];
    result[label] = values.map((value) => clampMarks(value));
    return result;
  }, {});

  targetOrder.forEach((label) => {
    if (!Array.isArray(marksByLabel[label])) {
      marksByLabel[label] = [];
    }
    while (marksByLabel[label].length <= playerIndex) {
      marksByLabel[label].push(0);
    }
  });

  throws.forEach((throwEntry) => {
    const parsed = parseCricketThrowSegment(throwEntry);
    if (!parsed || !targetOrder.includes(parsed.label)) {
      return;
    }
    const currentMarks = clampMarks(marksByLabel[parsed.label][playerIndex] || 0);
    marksByLabel[parsed.label][playerIndex] = clampMarks(currentMarks + parsed.marks);
  });

  return marksByLabel;
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
