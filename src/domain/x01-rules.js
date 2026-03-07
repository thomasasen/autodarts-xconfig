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

const CHECKOUT_TOKEN_PATTERN = /DB|BULLSEYE|BULL|SB|OB|[TDS]?\d{1,2}/g;
const EXPLICIT_SEGMENT_PATTERN = /\b(?:DB|BULLSEYE|BULL|[TDS](?:[1-9]|1\d|20))\b/g;

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
  if (!throwEntry || typeof throwEntry !== "object") {
    return "";
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

export function parseExplicitCheckoutSegments(text) {
  const raw = String(text || "").toUpperCase();
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

export function parseCheckoutTargetsFromSuggestion(text) {
  const raw = String(text || "");
  if (!raw.trim()) {
    return [];
  }

  const tokens = raw.toUpperCase().match(CHECKOUT_TOKEN_PATTERN) || [];
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

    if (token === "BULL" || token === "SB" || token === "OB") {
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

  return (hasExplicitTargets
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
