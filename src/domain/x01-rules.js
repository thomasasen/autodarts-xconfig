export const IMPOSSIBLE_CHECKOUT_SCORES = new Set([
  169,
  168,
  166,
  165,
  163,
  162,
  159,
]);

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
}

const CHECKOUT_TOKEN_PATTERN =
  /\b(?:DB|BULLSEYE|BULL|SB|OB|[TDS](?:[1-9]|1\d|20|25)|(?:[1-9]|1\d|20|25))\b/g;
const EXPLICIT_SEGMENT_PATTERN =
  /\b(?:DB|BULLSEYE|BULL|SB|OB|[TDS](?:[1-9]|1\d|20|25))\b/g;

const SCORING_SEGMENTS = Object.freeze([
  ...Array.from({ length: 20 }, (_value, index) => `S${index + 1}`),
  ...Array.from({ length: 20 }, (_value, index) => `D${index + 1}`),
  ...Array.from({ length: 20 }, (_value, index) => `T${index + 1}`),
  "S25",
  "BULL",
]);

export function normalizeSegmentName(value) {
  const raw = String(value || "").trim().toUpperCase();
  if (!raw) {
    return "";
  }

  if (raw === "DB" || raw === "DBULL" || raw === "BULLSEYE" || raw === "BULL") {
    return "BULL";
  }

  if (raw === "SB" || raw === "OB" || raw === "S25") {
    return "S25";
  }

  const prefixedMatch = raw.match(/^([SDT])\s*(\d{1,2})$/);
  if (prefixedMatch) {
    return `${prefixedMatch[1]}${Number(prefixedMatch[2])}`;
  }

  if (/^\d{1,2}$/.test(raw)) {
    return `S${Number(raw)}`;
  }

  return raw;
}

function normalizeCheckoutSuggestionText(value) {
  return String(value || "")
    .toUpperCase()
    .replace(/DOUBLE\s*[-:]?\s*BULL(?:SEYE)?/g, "BULL")
    .replace(/INNER\s*BULL(?:SEYE)?/g, "BULL")
    .replace(/SINGLE\s*BULL/g, "SB")
    .replace(/OUTER\s*BULL/g, "SB")
    .replace(/BULLSEYE/g, "BULL")
    .replace(/DOUBLE\s*[-:]?\s*(\d{1,2})/g, "D$1")
    .replace(/TRIPLE\s*[-:]?\s*(\d{1,2})/g, "T$1")
    .replace(/SINGLE\s*[-:]?\s*(\d{1,2})/g, "S$1")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseSegment(normalizedSegmentName) {
  const normalized = normalizeSegmentName(normalizedSegmentName);
  if (!normalized) {
    return null;
  }

  if (normalized === "BULL") {
    return {
      normalized,
      ring: "D",
      value: 25,
      score: 50,
    };
  }

  if (normalized === "S25") {
    return {
      normalized,
      ring: "S",
      value: 25,
      score: 25,
    };
  }

  const match = normalized.match(/^([SDT])(\d{1,2})$/);
  if (!match) {
    return null;
  }

  const ring = match[1];
  const value = Number(match[2]);
  if (!(value >= 1 && value <= 20)) {
    return null;
  }

  const multiplier = ring === "D" ? 2 : ring === "T" ? 3 : 1;

  return {
    normalized,
    ring,
    value,
    score: value * multiplier,
  };
}

export function classifyThrowHitText(text) {
  const normalized = normalizeSegmentName(text);
  if (!normalized) {
    return null;
  }

  if (normalized === "BULL") {
    return {
      kind: "bull",
      normalizedSegment: "BULL",
      ring: "D",
      value: 25,
      score: 50,
    };
  }

  const parsed = parseSegment(normalized);
  if (!parsed) {
    return null;
  }

  const kind = parsed.ring === "T" ? "triple" : parsed.ring === "D" ? "double" : "single";

  return {
    kind,
    normalizedSegment: parsed.normalized,
    ring: parsed.ring,
    value: parsed.value,
    score: parsed.score,
  };
}

export function getHighlightHitKind(text) {
  const classification = classifyThrowHitText(text);
  if (!classification) {
    return null;
  }

  return classification.kind === "triple" ||
    classification.kind === "double" ||
    classification.kind === "bull"
    ? classification.kind
    : null;
}

export function isSingleBullSegment(segmentName) {
  return normalizeSegmentName(segmentName) === "S25";
}

export function isDoubleBullSegment(segmentName) {
  return normalizeSegmentName(segmentName) === "BULL";
}

export function isSingleBullHitText(text) {
  const classification = classifyThrowHitText(text);
  return Boolean(
    classification &&
      classification.kind === "single" &&
      Number(classification.value) === 25
  );
}

function getThrowSegmentName(throwEntry) {
  if (typeof throwEntry === "string") {
    return String(throwEntry).trim();
  }
  if (!throwEntry || typeof throwEntry !== "object") {
    return "";
  }

  const descriptor = throwEntry?.segment && typeof throwEntry.segment === "object"
    ? throwEntry.segment
    : throwEntry;
  const namedSegment = normalizeSegmentName(
    descriptor?.name || descriptor?.segment || descriptor?.label || ""
  );
  if (namedSegment) {
    return namedSegment;
  }

  const numericValue = Number(descriptor?.number ?? descriptor?.value ?? NaN);
  const multiplier = Number(descriptor?.multiplier ?? descriptor?.marks ?? NaN);
  const bed = String(descriptor?.bed || "").trim().toLowerCase();

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

  return String(
    throwEntry?.segment?.name ||
      throwEntry?.segment?.segment ||
      throwEntry?.segment?.label ||
      throwEntry?.segment ||
      throwEntry?.entry ||
      ""
  ).trim();
}

function getThrowPoints(throwEntry) {
  if (!throwEntry || typeof throwEntry !== "object") {
    return NaN;
  }

  const candidates = [
    throwEntry?.points,
    throwEntry?.score,
    throwEntry?.value,
    throwEntry?.segment?.points,
    throwEntry?.segment?.score,
    throwEntry?.segment?.value,
  ];

  for (const candidate of candidates) {
    const numeric = Number(candidate);
    if (Number.isFinite(numeric)) {
      return numeric;
    }
  }

  return NaN;
}

export function isSingleBullThrowEntry(throwEntry) {
  const points = getThrowPoints(throwEntry);
  if (points === 25) {
    return true;
  }
  if (points === 50) {
    return false;
  }

  const segmentName = getThrowSegmentName(throwEntry);
  if (!segmentName) {
    return false;
  }

  if (isSingleBullSegment(segmentName)) {
    return true;
  }

  if (isDoubleBullSegment(segmentName)) {
    return false;
  }

  if (normalizeSegmentName(segmentName) === "BULL") {
    const multiplier = Number(throwEntry?.segment?.multiplier || throwEntry?.multiplier);
    if (multiplier === 1) {
      return true;
    }
    if (multiplier === 2) {
      return false;
    }
  }

  return false;
}

export function normalizeOutMode(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();

  if (!normalized) {
    return "straight";
  }

  if (normalized.includes("master")) {
    return "master";
  }

  if (normalized.includes("double")) {
    return "double";
  }

  if (normalized.includes("straight") || normalized.includes("single")) {
    return "straight";
  }

  if (normalized === "mo") {
    return "master";
  }

  if (normalized === "do") {
    return "double";
  }

  return "straight";
}

function getCheckoutFinishSegments(outMode) {
  const normalizedOutMode = normalizeOutMode(outMode);

  return SCORING_SEGMENTS.map((segmentName) => parseSegment(segmentName)).filter((segment) => {
    if (!segment) {
      return false;
    }

    if (normalizedOutMode === "straight") {
      return true;
    }

    if (normalizedOutMode === "double") {
      return segment.ring === "D";
    }

    if (normalizedOutMode === "master") {
      return segment.ring === "D" || segment.ring === "T";
    }

    return true;
  });
}

function getCheckoutSetupSegments() {
  return SCORING_SEGMENTS.map((segmentName) => parseSegment(segmentName)).filter(Boolean);
}

const CHECKOUT_SETUP_SEGMENTS = Object.freeze(getCheckoutSetupSegments());
const CHECKOUT_FINISH_SEGMENTS_BY_MODE = Object.freeze({
  straight: Object.freeze(getCheckoutFinishSegments("straight")),
  double: Object.freeze(getCheckoutFinishSegments("double")),
  master: Object.freeze(getCheckoutFinishSegments("master")),
});

function getCheckoutFeasibilitySet(outMode) {
  const normalizedOutMode = normalizeOutMode(outMode);
  const finishSegments =
    CHECKOUT_FINISH_SEGMENTS_BY_MODE[normalizedOutMode] ||
    CHECKOUT_FINISH_SEGMENTS_BY_MODE.straight;
  const scores = new Set();

  finishSegments.forEach((finishSegment) => {
    scores.add(finishSegment.score);
  });

  CHECKOUT_SETUP_SEGMENTS.forEach((firstSegment) => {
    finishSegments.forEach((finishSegment) => {
      scores.add(firstSegment.score + finishSegment.score);
    });
  });

  CHECKOUT_SETUP_SEGMENTS.forEach((firstSegment) => {
    CHECKOUT_SETUP_SEGMENTS.forEach((secondSegment) => {
      finishSegments.forEach((finishSegment) => {
        scores.add(firstSegment.score + secondSegment.score + finishSegment.score);
      });
    });
  });

  return scores;
}

const CHECKOUTABLE_SCORES_BY_MODE = Object.freeze({
  straight: getCheckoutFeasibilitySet("straight"),
  double: getCheckoutFeasibilitySet("double"),
  master: getCheckoutFeasibilitySet("master"),
});

function getOneDartPreference(segment, outMode) {
  if (!segment) {
    return 99;
  }

  const normalizedOutMode = normalizeOutMode(outMode);
  if (normalizedOutMode === "straight") {
    if (segment.ring === "S") {
      return 0;
    }
    if (segment.ring === "D") {
      return 1;
    }
    return 2;
  }

  if (normalizedOutMode === "master") {
    return segment.ring === "D" ? 0 : 1;
  }

  return 0;
}

function compareOneDartSegments(left, right, outMode) {
  const leftPreference = getOneDartPreference(left, outMode);
  const rightPreference = getOneDartPreference(right, outMode);
  if (leftPreference !== rightPreference) {
    return leftPreference - rightPreference;
  }

  if (left.value !== right.value) {
    return right.value - left.value;
  }

  return String(left.normalized || "").localeCompare(String(right.normalized || ""));
}

export function getSegmentScore(segmentName) {
  const parsed = parseSegment(segmentName);
  return parsed ? parsed.score : NaN;
}

export function isDoubleSegment(segmentName) {
  const parsed = parseSegment(segmentName);
  return Boolean(parsed) && parsed.ring === "D";
}

export function isTripleSegment(segmentName) {
  const parsed = parseSegment(segmentName);
  return Boolean(parsed) && parsed.ring === "T";
}

export function isCheckoutPossibleFromScoreForOutMode(score, outMode) {
  const numeric = toNumber(score);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return false;
  }

  const normalizedOutMode = normalizeOutMode(outMode);
  const scoreSet =
    CHECKOUTABLE_SCORES_BY_MODE[normalizedOutMode] ||
    CHECKOUTABLE_SCORES_BY_MODE.straight;
  return scoreSet.has(numeric);
}

export function isCheckoutPossibleFromScore(score) {
  return isCheckoutPossibleFromScoreForOutMode(score, "double");
}

export function getOneDartCheckoutSegmentsForOutMode(score, outMode) {
  const numeric = toNumber(score);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return [];
  }

  const normalizedOutMode = normalizeOutMode(outMode);
  const finishSegments =
    CHECKOUT_FINISH_SEGMENTS_BY_MODE[normalizedOutMode] ||
    CHECKOUT_FINISH_SEGMENTS_BY_MODE.straight;

  return finishSegments
    .filter((segment) => segment.score === numeric)
    .sort((left, right) => compareOneDartSegments(left, right, normalizedOutMode))
    .map((segment) => segment.normalized);
}

export function getPreferredOneDartCheckoutSegment(score, outMode) {
  return getOneDartCheckoutSegmentsForOutMode(score, outMode)[0] || "";
}

export function getOneDartCheckoutSegment(score) {
  return getPreferredOneDartCheckoutSegment(score, "double");
}

export function isOneDartCheckoutSegmentForOutMode(segmentName, outMode) {
  const parsed = parseSegment(segmentName);
  if (!parsed) {
    return false;
  }

  const oneDartSegments = getOneDartCheckoutSegmentsForOutMode(parsed.score, outMode);
  return oneDartSegments.includes(parsed.normalized);
}

export function isOneDartCheckoutSegment(segmentName) {
  return isOneDartCheckoutSegmentForOutMode(segmentName, "double");
}

export function isSensibleThirdT20Score(remainingScore, outMode = "double") {
  const numeric = toNumber(remainingScore);
  if (!Number.isFinite(numeric)) {
    return true;
  }

  const evaluation = evaluateThrowOutcome({
    scoreBefore: numeric,
    segmentName: "T20",
    outMode,
  });

  return evaluation.isBust === false;
}

export function parseExplicitCheckoutSegments(text) {
  const raw = normalizeCheckoutSuggestionText(text);
  if (!raw) {
    return [];
  }

  const tokens = raw.match(EXPLICIT_SEGMENT_PATTERN) || [];
  return tokens
    .map((token) => {
      if (token === "DB" || token === "BULLSEYE" || token === "BULL") {
        return "BULL";
      }
      return normalizeSegmentName(token);
    })
    .filter(Boolean);
}

export function parseCheckoutTargetsFromSuggestion(text, options = {}) {
  const raw = normalizeCheckoutSuggestionText(text);
  if (!raw.trim()) {
    return [];
  }
  const includeSummaryTargets = options?.includeSummaryTargets === true;

  const tokens = raw.match(CHECKOUT_TOKEN_PATTERN) || [];
  const parsedTargets = [];
  let hasExplicitTargets = false;

  tokens.forEach((token) => {
    if (token === "DB" || token === "BULLSEYE") {
      parsedTargets.push({
        ring: "DB",
        isSummary: false,
      });
      hasExplicitTargets = true;
      return;
    }

    if (token === "BULL") {
      parsedTargets.push({
        ring: "DB",
        isSummary: false,
      });
      hasExplicitTargets = true;
      return;
    }

    if (token === "SB" || token === "OB") {
      parsedTargets.push({
        ring: "SB",
        isSummary: false,
      });
      hasExplicitTargets = true;
      return;
    }

    const prefix = token[0];
    const numericValue = Number.parseInt(
      prefix === "T" || prefix === "D" || prefix === "S" ? token.slice(1) : token,
      10
    );
    if (!Number.isFinite(numericValue)) {
      return;
    }

    if (numericValue === 25) {
      if (prefix === "D") {
        parsedTargets.push({
          ring: "DB",
          isSummary: false,
        });
        hasExplicitTargets = true;
      } else {
        const isSummary = prefix !== "S";
        parsedTargets.push({
          ring: "SB",
          isSummary,
        });
        if (!isSummary) {
          hasExplicitTargets = true;
        }
      }
      return;
    }

    if (numericValue < 1 || numericValue > 20) {
      return;
    }

    const ring = prefix === "T" || prefix === "D" || prefix === "S" ? prefix : "S";
    const isSummary = prefix !== "T" && prefix !== "D" && prefix !== "S";
    parsedTargets.push({
      ring,
      value: numericValue,
      isSummary,
    });
    if (!isSummary) {
      hasExplicitTargets = true;
    }
  });

  return (hasExplicitTargets && !includeSummaryTargets
    ? parsedTargets.filter((target) => !target.isSummary)
    : parsedTargets
  ).map(({ ring, value }) => {
    return Number.isFinite(value) ? { ring, value } : { ring };
  });
}

export function getSuggestionOneDartCheckoutSegment(text) {
  const segments = parseExplicitCheckoutSegments(text);
  if (segments.length !== 1) {
    return "";
  }

  const segment = segments[0];
  return isOneDartCheckoutSegment(segment) ? segment : "";
}

export function getSuggestionOneDartCheckoutSegmentForOutMode(text, outMode) {
  const segments = parseExplicitCheckoutSegments(text);
  if (segments.length !== 1) {
    return "";
  }

  const segment = segments[0];
  return isOneDartCheckoutSegmentForOutMode(segment, outMode) ? segment : "";
}

export function parseCheckoutSuggestionState(text, outMode = "double") {
  const normalized = normalizeCheckoutSuggestionText(text);

  if (!normalized) {
    return null;
  }

  if (/NO\s*(OUT|CHECKOUT|SHOT)/.test(normalized)) {
    return false;
  }

  if (/BUST/.test(normalized)) {
    return false;
  }

  const explicitSegments = parseExplicitCheckoutSegments(normalized);
  if (!explicitSegments.length) {
    return null;
  }

  const lastSegment = explicitSegments[explicitSegments.length - 1];
  return isOneDartCheckoutSegmentForOutMode(lastSegment, outMode);
}

export function canFinishWithSegment(remainingScore, segmentName, outMode) {
  const required = toNumber(remainingScore);
  const parsedSegment = parseSegment(segmentName);
  if (!Number.isFinite(required) || !parsedSegment || required <= 0) {
    return false;
  }

  if (parsedSegment.score !== required) {
    return false;
  }

  const normalizedOutMode = normalizeOutMode(outMode);
  if (normalizedOutMode === "straight") {
    return true;
  }

  if (normalizedOutMode === "double") {
    return parsedSegment.ring === "D";
  }

  if (normalizedOutMode === "master") {
    return parsedSegment.ring === "D" || parsedSegment.ring === "T";
  }

  return true;
}

export function evaluateThrowOutcome(options = {}) {
  const scoreBefore = toNumber(options.scoreBefore);
  const parsedSegment = parseSegment(options.segmentName);
  const normalizedOutMode = normalizeOutMode(options.outMode);

  if (!Number.isFinite(scoreBefore) || scoreBefore <= 0 || !parsedSegment) {
    return {
      scoreBefore,
      scoreAfter: scoreBefore,
      scoredPoints: 0,
      isBust: false,
      isFinish: false,
      reason: "invalid-input",
    };
  }

  const scoreAfter = scoreBefore - parsedSegment.score;
  if (scoreAfter < 0) {
    return {
      scoreBefore,
      scoreAfter: scoreBefore,
      scoredPoints: parsedSegment.score,
      isBust: true,
      isFinish: false,
      reason: "below-zero",
    };
  }

  if ((normalizedOutMode === "double" || normalizedOutMode === "master") && scoreAfter === 1) {
    return {
      scoreBefore,
      scoreAfter: scoreBefore,
      scoredPoints: parsedSegment.score,
      isBust: true,
      isFinish: false,
      reason: "left-on-one",
    };
  }

  if (scoreAfter === 0) {
    const canFinish = canFinishWithSegment(scoreBefore, parsedSegment.normalized, normalizedOutMode);
    if (!canFinish) {
      return {
        scoreBefore,
        scoreAfter: scoreBefore,
        scoredPoints: parsedSegment.score,
        isBust: true,
        isFinish: false,
        reason: "invalid-finish-segment",
      };
    }

    return {
      scoreBefore,
      scoreAfter: 0,
      scoredPoints: parsedSegment.score,
      isBust: false,
      isFinish: true,
      reason: "finished",
    };
  }

  return {
    scoreBefore,
    scoreAfter,
    scoredPoints: parsedSegment.score,
    isBust: false,
    isFinish: false,
    reason: "scored",
  };
}

export function applyX01ThrowsToState(options = {}) {
  const scoreBefore = toNumber(options.scoreBefore);
  const normalizedOutMode = normalizeOutMode(options.outMode);
  const throws = Array.isArray(options.throws) ? options.throws : [];

  if (!Number.isFinite(scoreBefore) || scoreBefore <= 0) {
    return {
      scoreBefore,
      scoreAfter: scoreBefore,
      normalizedOutMode,
      totalScoredPoints: 0,
      isBust: false,
      isFinish: false,
      stopReason: "invalid-input",
      throwResults: [],
    };
  }

  let currentScore = scoreBefore;
  let stopReason = throws.length ? "throws-exhausted" : "no-throws";
  let stoppedIndex = -1;
  let isBust = false;
  let isFinish = false;

  const throwResults = throws.map((throwEntry, index) => {
    const segmentName = normalizeSegmentName(getThrowSegmentName(throwEntry));
    if (stoppedIndex >= 0) {
      return {
        index,
        segmentName,
        ignored: true,
        reason: "turn-already-resolved",
        outcome: null,
      };
    }

    if (!segmentName) {
      return {
        index,
        segmentName: "",
        ignored: true,
        reason: "invalid-segment",
        outcome: null,
      };
    }

    const outcome = evaluateThrowOutcome({
      scoreBefore: currentScore,
      segmentName,
      outMode: normalizedOutMode,
    });

    if (outcome.isBust) {
      isBust = true;
      stopReason = "bust";
      stoppedIndex = index;
      currentScore = scoreBefore;
    } else {
      currentScore = outcome.scoreAfter;
      if (outcome.isFinish) {
        isFinish = true;
        stopReason = "finished";
        stoppedIndex = index;
      }
    }

    return {
      index,
      segmentName,
      ignored: false,
      reason: outcome.reason,
      outcome,
    };
  });

  return {
    scoreBefore,
    scoreAfter: currentScore,
    normalizedOutMode,
    totalScoredPoints: isBust ? 0 : Math.max(0, scoreBefore - currentScore),
    isBust,
    isFinish,
    stopReason,
    throwResults,
  };
}
