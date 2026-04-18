import {
  CRICKET_UI_BUCKET,
  normalizeCricketPresentationToken,
  resolveCricketHighlightActive,
  resolveCricketUiBucket,
} from "./presentation.js";

const UI_BUCKET = CRICKET_UI_BUCKET;

const UI_PRIORITY_BY_BUCKET = Object.freeze({
  [UI_BUCKET.SCORING]: 1,
  [UI_BUCKET.PRESSURE]: 2,
  [UI_BUCKET.OPEN]: 4,
  [UI_BUCKET.DEAD]: 5,
});

export function buildPipelineSignature(extracted, stateMap) {
  const baseParts = [
    extracted?.surfaceStatus || "",
    extracted?.gameModeNormalized || "",
    extracted?.scoringModeNormalized || "",
    Number(extracted?.activePlayerIndex) || 0,
  ];
  if (!(stateMap instanceof Map) || stateMap.size === 0) {
    return baseParts.join("::");
  }

  const entries = [];
  stateMap.forEach((entry, label) => {
    entries.push(
      `${label}:${entry?.boardPresentation || entry?.presentation || "open"}:${entry?.uiBucket || ""}:${entry?.isHighlightActive ? "1" : "0"}:${(entry?.marksByPlayer || []).join(",")}`
    );
  });
  entries.sort((left, right) => left.localeCompare(right));
  return [...baseParts, entries.join("|")].join("::");
}

export function buildTurnToken(gameState, activePlayerIndex = 0) {
  const throws =
    gameState && typeof gameState.getActiveThrows === "function"
      ? gameState.getActiveThrows()
      : [];
  const throwCount = Array.isArray(throws) ? throws.length : 0;

  const turn =
    gameState && typeof gameState.getActiveTurn === "function"
      ? gameState.getActiveTurn()
      : null;

  if (turn && typeof turn === "object") {
    const round = Number.isFinite(turn.round) ? turn.round : "";
    const part = Number.isFinite(turn.turn) ? turn.turn : "";
    return `${turn.id || ""}|${turn.playerId || ""}|${round}|${part}|${turn.createdAt || ""}|${throwCount}`;
  }

  return `fallback:${Number.isFinite(activePlayerIndex) ? activePlayerIndex : 0}:${throwCount}`;
}

export function enrichStateMapForUi(stateMap) {
  if (!(stateMap instanceof Map) || stateMap.size === 0) {
    return new Map();
  }

  const enriched = new Map();
  stateMap.forEach((entry, label) => {
    const uiBucket = resolveCricketUiBucket(entry);
    const uiPriority = Number(UI_PRIORITY_BY_BUCKET[uiBucket] || UI_PRIORITY_BY_BUCKET.open || 4);
    const closedByPlayer = Boolean(entry?.closed || entry?.own);
    const openByOpponent = Number(entry?.openOpponentCount || 0) > 0;
    const dead = Boolean(entry?.dead);
    const scorable = Boolean(entry?.scorable || entry?.scorableForPlayer);
    const isHighlightActive = resolveCricketHighlightActive(uiBucket);

    enriched.set(label, {
      ...entry,
      closedByPlayer,
      openByOpponent,
      scorable,
      dead,
      pressureLevel: uiBucket === UI_BUCKET.PRESSURE ? "pressure" : "none",
      uiBucket,
      uiPriority,
      isHighlightActive,
    });
  });

  return enriched;
}

export function deriveTargetStates(renderState = null) {
  const sourceStateMap = renderState?.stateMap instanceof Map ? renderState.stateMap : new Map();
  const derived = {
    stateMap: sourceStateMap,
    openTargets: [],
    deadTargets: [],
    scoringTargets: [],
    scorableTargets: [],
    offenseTargets: [],
    pressureTargets: [],
    scoringBucketTargets: [],
    scorableBucketTargets: [],
    offenseBucketTargets: [],
    pressureBucketTargets: [],
    openBucketTargets: [],
    deadBucketTargets: [],
    activeHighlightTargets: [],
  };

  sourceStateMap.forEach((entry, label) => {
    const presentation = normalizeCricketPresentationToken(
      entry?.boardPresentation || entry?.presentation || "open"
    );

    if (presentation === "open") {
      derived.openTargets.push(label);
    }
    if (presentation === "dead") {
      derived.deadTargets.push(label);
    }
    if (presentation === "scoring" || presentation === "offense" || entry?.scoring) {
      derived.scoringTargets.push(label);
    }
    if (entry?.scorable) {
      derived.scorableTargets.push(label);
    }
    if (presentation === "scoring" || presentation === "offense" || entry?.offense) {
      derived.offenseTargets.push(label);
    }
    if (presentation === "pressure" || entry?.pressure) {
      derived.pressureTargets.push(label);
    }

    const uiBucket = String(entry?.uiBucket || "").toLowerCase();
    if (uiBucket === UI_BUCKET.SCORING) {
      derived.scoringBucketTargets.push(label);
      derived.scorableBucketTargets.push(label);
      derived.offenseBucketTargets.push(label);
    } else if (uiBucket === UI_BUCKET.PRESSURE) {
      derived.pressureBucketTargets.push(label);
    } else if (uiBucket === UI_BUCKET.OPEN) {
      derived.openBucketTargets.push(label);
    } else if (uiBucket === UI_BUCKET.DEAD) {
      derived.deadBucketTargets.push(label);
    }

    if (entry?.isHighlightActive) {
      derived.activeHighlightTargets.push(label);
    }
  });

  return derived;
}
