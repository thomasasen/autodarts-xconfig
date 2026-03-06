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

function normalizeSegmentName(value) {
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

function parseSegment(normalizedSegmentName) {
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

export function isCheckoutPossibleFromScore(score) {
  const numeric = toNumber(score);
  if (!Number.isFinite(numeric)) {
    return false;
  }
  if (numeric <= 1 || numeric > 170) {
    return false;
  }

  return !IMPOSSIBLE_CHECKOUT_SCORES.has(numeric);
}

export function getOneDartCheckoutSegment(score) {
  const numeric = toNumber(score);
  if (!Number.isFinite(numeric)) {
    return "";
  }

  if (numeric === 50) {
    return "BULL";
  }

  if (numeric >= 2 && numeric <= 40 && numeric % 2 === 0) {
    return `D${numeric / 2}`;
  }

  return "";
}

export function isOneDartCheckoutSegment(segmentName) {
  const normalized = normalizeSegmentName(segmentName);
  return normalized === "BULL" || /^D([1-9]|1\d|20)$/.test(normalized);
}

export function isSensibleThirdT20Score(remainingScore) {
  const numeric = toNumber(remainingScore);
  if (!Number.isFinite(numeric)) {
    return true;
  }

  return numeric >= 62;
}

export function parseCheckoutSuggestionState(text) {
  const normalized = String(text || "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();

  if (!normalized) {
    return null;
  }

  if (/NO\s*(OUT|CHECKOUT|SHOT)/.test(normalized)) {
    return false;
  }

  if (/BUST/.test(normalized)) {
    return false;
  }

  if (/D\s*[-:]?\s*\d+/.test(normalized)) {
    return true;
  }

  if (/DOUBLE\s*\d+/.test(normalized)) {
    return true;
  }

  if (/DB|BULLSEYE|BULL/.test(normalized)) {
    return true;
  }

  return null;
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