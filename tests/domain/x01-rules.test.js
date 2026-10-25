import test from "node:test";
import assert from "node:assert/strict";

import {
  applyX01ThrowsToState,
  classifyThrowHitText,
  IMPOSSIBLE_CHECKOUT_SCORES,
  canFinishWithSegment,
  evaluateThrowOutcome,
  getCheckoutRoutesForScore,
  getPreferredCheckoutRoute,
  getPreferredCheckoutStep,
  getOneDartCheckoutSegmentsForOutMode,
  getHighlightHitKind,
  getOneDartCheckoutSegment,
  getPreferredOneDartCheckoutSegment,
  getSuggestionOneDartCheckoutSegmentForOutMode,
  getSuggestionOneDartCheckoutSegment,
  isDoubleBullSegment,
  isCheckoutPossibleFromScoreForOutMode,
  isCheckoutPossibleFromScoreForOutModeWithDarts,
  isCheckoutPossibleFromScore,
  isOneDartCheckoutSegmentForOutMode,
  isSingleBullHitText,
  isSingleBullThrowEntry,
  isSingleBullSegment,
  isOneDartCheckoutSegment,
  isSensibleThirdT20Score,
  normalizeSegmentName,
  normalizeOutMode,
  parseCheckoutTargetsFromSuggestion,
  parseExplicitCheckoutSegments,
  parseCheckoutSuggestionState,
  parseCheckoutSuggestionStateForScore,
} from "../../src/domain/x01-rules.js";

const LEGACY_SETUP_SCORES = [
  ...Array.from({ length: 20 }, (_value, index) => index + 1),
  ...Array.from({ length: 20 }, (_value, index) => (index + 1) * 2),
  ...Array.from({ length: 20 }, (_value, index) => (index + 1) * 3),
  25,
  50,
];
const MAX_CHECKOUT_SCORE_WITH_THREE_DARTS = 180;
const LEGACY_ROUTE_SEGMENTS = [
  ...Array.from({ length: 20 }, (_value, index) => ({
    normalized: `S${index + 1}`,
    ring: "S",
    score: index + 1,
  })),
  ...Array.from({ length: 20 }, (_value, index) => ({
    normalized: `D${index + 1}`,
    ring: "D",
    score: (index + 1) * 2,
  })),
  ...Array.from({ length: 20 }, (_value, index) => ({
    normalized: `T${index + 1}`,
    ring: "T",
    score: (index + 1) * 3,
  })),
  { normalized: "S25", ring: "S", score: 25 },
  { normalized: "BULL", ring: "D", score: 50 },
];

function getLegacyFinishScores(outMode) {
  if (outMode === "double") {
    return [
      ...Array.from({ length: 20 }, (_value, index) => (index + 1) * 2),
      50,
    ];
  }
  if (outMode === "master") {
    return [
      ...Array.from({ length: 20 }, (_value, index) => (index + 1) * 2),
      ...Array.from({ length: 20 }, (_value, index) => (index + 1) * 3),
      50,
    ];
  }
  return LEGACY_SETUP_SCORES;
}

function buildLegacyCheckoutFeasibilitySet(outMode, dartsRemaining) {
  const finishScores = getLegacyFinishScores(outMode);
  const reachableScores = new Set();
  if (dartsRemaining < 1) {
    return reachableScores;
  }

  finishScores.forEach((finishScore) => reachableScores.add(finishScore));
  if (dartsRemaining < 2) {
    return reachableScores;
  }

  LEGACY_SETUP_SCORES.forEach((firstScore) => {
    finishScores.forEach((finishScore) => reachableScores.add(firstScore + finishScore));
  });
  if (dartsRemaining < 3) {
    return reachableScores;
  }

  LEGACY_SETUP_SCORES.forEach((firstScore) => {
    LEGACY_SETUP_SCORES.forEach((secondScore) => {
      finishScores.forEach((finishScore) => {
        reachableScores.add(firstScore + secondScore + finishScore);
      });
    });
  });
  return reachableScores;
}

function isLegacyFinishSegment(segment, outMode) {
  if (outMode === "straight") {
    return true;
  }
  if (outMode === "double") {
    return segment.ring === "D";
  }
  return segment.ring === "D" || segment.ring === "T";
}

function getLegacyCheckoutRoutes(score, outMode, dartsRemaining, reachabilityByDarts) {
  if (score <= 0 || dartsRemaining < 1) {
    return [];
  }

  const routes = [];
  const currentRoute = [];

  function visitRoutes(remainingScore, remainingDarts) {
    LEGACY_ROUTE_SEGMENTS.forEach((segment) => {
      const scoreAfter = remainingScore - segment.score;
      const leavesInvalidRemainder = scoreAfter === 1 && outMode !== "straight";
      const isFinish = scoreAfter === 0 && isLegacyFinishSegment(segment, outMode);
      if (scoreAfter < 0 || leavesInvalidRemainder || (scoreAfter === 0 && !isFinish)) {
        return;
      }

      currentRoute.push(segment.normalized);
      if (isFinish) {
        routes.push(currentRoute.slice());
      } else {
        const nextRemainingDarts = remainingDarts - 1;
        if (nextRemainingDarts >= 1 && reachabilityByDarts[nextRemainingDarts].has(scoreAfter)) {
          visitRoutes(scoreAfter, nextRemainingDarts);
        }
      }
      currentRoute.pop();
    });
  }

  visitRoutes(score, dartsRemaining);
  return routes;
}

test("IMPOSSIBLE_CHECKOUT_SCORES include known impossible finishes", () => {
  assert.equal(IMPOSSIBLE_CHECKOUT_SCORES.has(169), true);
  assert.equal(IMPOSSIBLE_CHECKOUT_SCORES.has(170), false);
});

test("double-out checkout feasibility preserves the classic impossible score set", () => {
  assert.equal(isCheckoutPossibleFromScore(170), true);
  assert.equal(isCheckoutPossibleFromScore(169), false);
  assert.equal(isCheckoutPossibleFromScore(1), false);
  assert.equal(isCheckoutPossibleFromScore(171), false);
});

test("out-mode-aware checkout feasibility distinguishes straight, double and master out", () => {
  assert.equal(isCheckoutPossibleFromScoreForOutMode(159, "double"), false);
  assert.equal(isCheckoutPossibleFromScoreForOutMode(159, "master"), true);
  assert.equal(isCheckoutPossibleFromScoreForOutMode(1, "straight"), true);
  assert.equal(isCheckoutPossibleFromScoreForOutMode(1, "double"), false);
  assert.equal(isCheckoutPossibleFromScoreForOutMode(180, "double"), false);
  assert.equal(isCheckoutPossibleFromScoreForOutMode(180, "straight"), true);
  assert.equal(isCheckoutPossibleFromScoreForOutModeWithDarts(40, "double", 1), true);
  assert.equal(isCheckoutPossibleFromScoreForOutModeWithDarts(80, "double", 1), false);
  assert.equal(isCheckoutPossibleFromScoreForOutModeWithDarts(80, "double", 2), true);
  assert.equal(isCheckoutPossibleFromScoreForOutModeWithDarts(121, "double", 2), false);
  assert.equal(isCheckoutPossibleFromScoreForOutModeWithDarts(121, "double", 1), false);
});

test("checkout reachability matches the legacy calculation exhaustively", () => {
  const outModes = ["straight", "double", "master"];

  outModes.forEach((outMode) => {
    for (let dartsRemaining = 0; dartsRemaining <= 3; dartsRemaining += 1) {
      const legacyReachableScores = buildLegacyCheckoutFeasibilitySet(
        outMode,
        dartsRemaining
      );
      for (let score = 0; score <= MAX_CHECKOUT_SCORE_WITH_THREE_DARTS; score += 1) {
        assert.equal(
          isCheckoutPossibleFromScoreForOutModeWithDarts(score, outMode, dartsRemaining),
          score > 0 && legacyReachableScores.has(score),
          `score=${score}, outMode=${outMode}, dartsRemaining=${dartsRemaining}`
        );
      }

      assert.equal(
        isCheckoutPossibleFromScoreForOutModeWithDarts(
          MAX_CHECKOUT_SCORE_WITH_THREE_DARTS + 1,
          outMode,
          dartsRemaining
        ),
        false
      );
    }
  });
});

test("checkout route helpers enumerate valid routes and prefer shortest high-scoring starts", () => {
  const doubleOut80Routes = getCheckoutRoutesForScore(80, "double", 2);
  assert.ok(doubleOut80Routes.some((route) => route.join(">") === "T20>D10"));
  assert.ok(doubleOut80Routes.some((route) => route.join(">") === "D20>D20"));

  assert.deepEqual(getPreferredCheckoutRoute(80, "double", 2), ["T20", "D10"]);
  assert.deepEqual(getPreferredCheckoutRoute(10, "double", 1), ["D5"]);
  assert.deepEqual(getPreferredCheckoutRoute(22, "double", 1), ["D11"]);
  assert.equal(getPreferredCheckoutStep(120, "double", 3), "T20");
  assert.deepEqual(getPreferredCheckoutRoute(50, "double", 3), ["BULL"]);
  assert.equal(getPreferredCheckoutStep(61, "double", 2), "T19");
  assert.deepEqual(getPreferredCheckoutRoute(60, "master", 1), ["T20"]);
});

test("checkout DFS preserves every legacy route and its exact order", () => {
  const outModes = ["straight", "double", "master"];

  outModes.forEach((outMode) => {
    const reachabilityByDarts = {
      1: buildLegacyCheckoutFeasibilitySet(outMode, 1),
      2: buildLegacyCheckoutFeasibilitySet(outMode, 2),
      3: buildLegacyCheckoutFeasibilitySet(outMode, 3),
    };
    for (let dartsRemaining = 0; dartsRemaining <= 3; dartsRemaining += 1) {
      for (let score = 0; score <= MAX_CHECKOUT_SCORE_WITH_THREE_DARTS; score += 1) {
        assert.deepEqual(
          getCheckoutRoutesForScore(score, outMode, dartsRemaining),
          getLegacyCheckoutRoutes(score, outMode, dartsRemaining, reachabilityByDarts),
          `score=${score}, outMode=${outMode}, dartsRemaining=${dartsRemaining}`
        );
      }
    }
  });
});

test("one-dart checkout helpers resolve expected segments per out mode", () => {
  assert.equal(getOneDartCheckoutSegment(50), "BULL");
  assert.equal(getOneDartCheckoutSegment(40), "D20");
  assert.equal(getOneDartCheckoutSegment(39), "");
  assert.equal(getPreferredOneDartCheckoutSegment(60, "master"), "T20");
  assert.equal(getPreferredOneDartCheckoutSegment(20, "straight"), "S20");
  assert.equal(getPreferredOneDartCheckoutSegment(25, "straight"), "S25");
  assert.deepEqual(getOneDartCheckoutSegmentsForOutMode(20, "straight"), ["S20", "D10"]);
  assert.deepEqual(getOneDartCheckoutSegmentsForOutMode(60, "master"), ["T20"]);
  assert.deepEqual(getOneDartCheckoutSegmentsForOutMode(50, "double"), ["BULL"]);

  assert.equal(isOneDartCheckoutSegment("BULL"), true);
  assert.equal(isOneDartCheckoutSegment("D16"), true);
  assert.equal(isOneDartCheckoutSegment("S20"), false);
  assert.equal(isOneDartCheckoutSegmentForOutMode("T20", "master"), true);
  assert.equal(isOneDartCheckoutSegmentForOutMode("T20", "double"), false);
  assert.equal(isOneDartCheckoutSegmentForOutMode("S20", "straight"), true);
});

test("normalizeSegmentName resolves common aliases and segment formats", () => {
  assert.equal(normalizeSegmentName("bullseye"), "BULL");
  assert.equal(normalizeSegmentName("db"), "BULL");
  assert.equal(normalizeSegmentName("  d 16 "), "D16");
  assert.equal(normalizeSegmentName("20"), "S20");
});

test("throw hit classification centralizes triple/double/bull interpretation", () => {
  assert.deepEqual(classifyThrowHitText("T20"), {
    kind: "triple",
    normalizedSegment: "T20",
    ring: "T",
    value: 20,
    score: 60,
  });
  assert.deepEqual(classifyThrowHitText("d16"), {
    kind: "double",
    normalizedSegment: "D16",
    ring: "D",
    value: 16,
    score: 32,
  });
  assert.deepEqual(classifyThrowHitText("bull"), {
    kind: "bull",
    normalizedSegment: "BULL",
    ring: "D",
    value: 25,
    score: 50,
  });
  assert.equal(classifyThrowHitText("S20")?.kind, "single");
  assert.equal(classifyThrowHitText("T25"), null);
});

test("highlight hit kind returns only triple/double/bull", () => {
  assert.equal(getHighlightHitKind("T20"), "triple");
  assert.equal(getHighlightHitKind("D18"), "double");
  assert.equal(getHighlightHitKind("DB"), "bull");
  assert.equal(getHighlightHitKind("bullseye"), "bull");
  assert.equal(getHighlightHitKind("S20"), null);
  assert.equal(getHighlightHitKind("SB"), null);
  assert.equal(getHighlightHitKind(""), null);
});

test("single bull helpers distinguish SB/S25 from DB/BULL", () => {
  assert.equal(isSingleBullSegment("S25"), true);
  assert.equal(isSingleBullSegment("SB"), true);
  assert.equal(isSingleBullSegment("25"), true);
  assert.equal(isSingleBullSegment("BULL"), false);

  assert.equal(isDoubleBullSegment("BULL"), true);
  assert.equal(isDoubleBullSegment("DB"), true);
  assert.equal(isDoubleBullSegment("S25"), false);

  assert.equal(isSingleBullHitText("S25"), true);
  assert.equal(isSingleBullHitText("sb"), true);
  assert.equal(isSingleBullHitText("25"), true);
  assert.equal(isSingleBullHitText("BULL"), false);
  assert.equal(isSingleBullHitText("DB"), false);
});

test("single bull throw helper classifies throw entries without DOM parsing", () => {
  assert.equal(
    isSingleBullThrowEntry({
      segment: {
        name: "S25",
      },
    }),
    true
  );
  assert.equal(
    isSingleBullThrowEntry({
      segment: {
        name: "SB",
      },
    }),
    true
  );
  assert.equal(
    isSingleBullThrowEntry({
      segment: {
        name: "BULL",
        multiplier: 2,
      },
    }),
    false
  );
  assert.equal(
    isSingleBullThrowEntry({
      points: 25,
    }),
    true
  );
  assert.equal(
    isSingleBullThrowEntry({
      points: 50,
    }),
    false
  );
});

test("explicit checkout segment parser extracts normalized explicit targets only", () => {
  assert.deepEqual(parseExplicitCheckoutSegments("D16"), ["D16"]);
  assert.deepEqual(parseExplicitCheckoutSegments("  bull "), ["BULL"]);
  assert.deepEqual(parseExplicitCheckoutSegments("50 DBULL"), ["BULL"]);
  assert.deepEqual(parseExplicitCheckoutSegments("T20 D10"), ["T20", "D10"]);
  assert.deepEqual(parseExplicitCheckoutSegments("No Checkout"), []);
});

test("suggestion one-dart parser accepts exactly one explicit one-dart segment", () => {
  assert.equal(getSuggestionOneDartCheckoutSegment("D17"), "D17");
  assert.equal(getSuggestionOneDartCheckoutSegment("Bull"), "BULL");
  assert.equal(getSuggestionOneDartCheckoutSegment("Double 16"), "D16");
  assert.equal(getSuggestionOneDartCheckoutSegment("T20 D20"), "");
  assert.equal(getSuggestionOneDartCheckoutSegment("T20"), "");
  assert.equal(getSuggestionOneDartCheckoutSegmentForOutMode("T20", "master"), "T20");
  assert.equal(getSuggestionOneDartCheckoutSegmentForOutMode("Single 20", "straight"), "S20");
});

test("checkout target parser keeps explicit-only default and maps bull semantics correctly", () => {
  assert.deepEqual(parseCheckoutTargetsFromSuggestion("20 D10"), [{ ring: "D", value: 10 }]);
  assert.deepEqual(parseCheckoutTargetsFromSuggestion("20 10"), [
    { ring: "S", value: 20 },
    { ring: "S", value: 10 },
  ]);
  assert.deepEqual(parseCheckoutTargetsFromSuggestion("BULL"), [{ ring: "DB" }]);
  assert.deepEqual(parseCheckoutTargetsFromSuggestion("DBULL"), [{ ring: "DB" }]);
  assert.deepEqual(parseCheckoutTargetsFromSuggestion("Bullseye"), [{ ring: "DB" }]);
  assert.deepEqual(parseCheckoutTargetsFromSuggestion("Single Bull"), [{ ring: "SB" }]);
  assert.deepEqual(parseCheckoutTargetsFromSuggestion("Double 16"), [{ ring: "D", value: 16 }]);
  assert.deepEqual(parseCheckoutTargetsFromSuggestion("DB"), [{ ring: "DB" }]);
  assert.deepEqual(parseCheckoutTargetsFromSuggestion("T20 D20"), [
    { ring: "T", value: 20 },
    { ring: "D", value: 20 },
  ]);
});

test("parseCheckoutSuggestionState follows explicit finish validity per out mode", () => {
  assert.equal(parseCheckoutSuggestionState("No Checkout"), false);
  assert.equal(parseCheckoutSuggestionState("Bust"), false);
  assert.equal(parseCheckoutSuggestionState("D16"), true);
  assert.equal(parseCheckoutSuggestionState("Double 16"), true);
  assert.equal(parseCheckoutSuggestionState("Bull"), true);
  assert.equal(parseCheckoutSuggestionState("T20 D20"), true);
  assert.equal(parseCheckoutSuggestionState("T20 T20"), false);
  assert.equal(parseCheckoutSuggestionState("T20", "master"), true);
  assert.equal(parseCheckoutSuggestionState("T20", "double"), false);
  assert.equal(parseCheckoutSuggestionState("Single 20", "straight"), true);
});

test("parseCheckoutSuggestionStateForScore validates explicit suggestions against score, out mode and reliable darts", () => {
  assert.equal(parseCheckoutSuggestionStateForScore("No Checkout", 40, "double"), false);
  assert.equal(parseCheckoutSuggestionStateForScore("T20 D20", 100, "double"), true);
  assert.equal(parseCheckoutSuggestionStateForScore("T20 D20", 159, "double"), null);
  assert.equal(parseCheckoutSuggestionStateForScore("T20 D20", 100, "double", 1), null);
  assert.equal(parseCheckoutSuggestionStateForScore("T20", 60, "master"), true);
  assert.equal(parseCheckoutSuggestionStateForScore("T20", 60, "double"), null);
});

test("normalizeOutMode accepts common mode labels", () => {
  assert.equal(normalizeOutMode("Double Out"), "double");
  assert.equal(normalizeOutMode("Master Out"), "master");
  assert.equal(normalizeOutMode("Straight Out"), "straight");
  assert.equal(normalizeOutMode(""), "straight");
});

test("canFinishWithSegment respects out mode constraints", () => {
  assert.equal(canFinishWithSegment(40, "D20", "double"), true);
  assert.equal(canFinishWithSegment(40, "S20", "double"), false);
  assert.equal(canFinishWithSegment(60, "T20", "master"), true);
  assert.equal(canFinishWithSegment(50, "BULL", "double"), true);
  assert.equal(canFinishWithSegment(20, "S20", "straight"), true);
  assert.equal(canFinishWithSegment(25, "S25", "straight"), true);
});

test("evaluateThrowOutcome covers bust and finish behavior across out modes", () => {
  const finishDouble = evaluateThrowOutcome({
    scoreBefore: 40,
    segmentName: "D20",
    outMode: "double",
  });
  assert.equal(finishDouble.isFinish, true);
  assert.equal(finishDouble.isBust, false);

  const scoredWithoutFinish = evaluateThrowOutcome({
    scoreBefore: 40,
    segmentName: "S20",
    outMode: "double",
  });
  assert.equal(scoredWithoutFinish.isBust, false);
  assert.equal(scoredWithoutFinish.isFinish, false);
  assert.equal(scoredWithoutFinish.scoreAfter, 20);
  assert.equal(scoredWithoutFinish.reason, "scored");

  const invalidFinishDouble = evaluateThrowOutcome({
    scoreBefore: 20,
    segmentName: "S20",
    outMode: "double",
  });
  assert.equal(invalidFinishDouble.isBust, true);
  assert.equal(invalidFinishDouble.reason, "invalid-finish-segment");

  const bustOnOne = evaluateThrowOutcome({
    scoreBefore: 61,
    segmentName: "T20",
    outMode: "double",
  });
  assert.equal(bustOnOne.isBust, true);
  assert.equal(bustOnOne.reason, "left-on-one");

  const masterFinish = evaluateThrowOutcome({
    scoreBefore: 60,
    segmentName: "T20",
    outMode: "master",
  });
  assert.equal(masterFinish.isFinish, true);

  const straightScored = evaluateThrowOutcome({
    scoreBefore: 100,
    segmentName: "T20",
    outMode: "straight",
  });
  assert.equal(straightScored.isBust, false);
  assert.equal(straightScored.scoreAfter, 40);
});

test("isSensibleThirdT20Score follows old TV zoom bust-guard threshold", () => {
  assert.equal(isSensibleThirdT20Score(62), true);
  assert.equal(isSensibleThirdT20Score(61), false);
  assert.equal(isSensibleThirdT20Score(60, "master"), true);
  assert.equal(isSensibleThirdT20Score(61, "straight"), true);
  assert.equal(isSensibleThirdT20Score(59, "straight"), false);
});

test("applyX01ThrowsToState evaluates multi-dart visits with finish and bust reset", () => {
  const finishedVisit = applyX01ThrowsToState({
    scoreBefore: 170,
    outMode: "double",
    throws: ["T20", "T20", "BULL"],
  });
  assert.equal(finishedVisit.scoreAfter, 0);
  assert.equal(finishedVisit.totalScoredPoints, 170);
  assert.equal(finishedVisit.isFinish, true);
  assert.equal(finishedVisit.isBust, false);
  assert.equal(finishedVisit.stopReason, "finished");
  assert.equal(finishedVisit.throwResults[2].outcome?.reason, "finished");

  const bustedVisit = applyX01ThrowsToState({
    scoreBefore: 100,
    outMode: "double",
    throws: [{ segment: { name: "T20" } }, { segment: { name: "T20" } }],
  });
  assert.equal(bustedVisit.scoreAfter, 100);
  assert.equal(bustedVisit.totalScoredPoints, 0);
  assert.equal(bustedVisit.isBust, true);
  assert.equal(bustedVisit.stopReason, "bust");
  assert.equal(bustedVisit.throwResults[1].outcome?.reason, "below-zero");

  const invalidFinishVisit = applyX01ThrowsToState({
    scoreBefore: 20,
    outMode: "double",
    throws: [{ segment: { number: 20, multiplier: 1 } }],
  });
  assert.equal(invalidFinishVisit.scoreAfter, 20);
  assert.equal(invalidFinishVisit.isBust, true);
  assert.equal(invalidFinishVisit.throwResults[0].segmentName, "S20");
  assert.equal(invalidFinishVisit.throwResults[0].outcome?.reason, "invalid-finish-segment");
});
