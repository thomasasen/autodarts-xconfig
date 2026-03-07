import test from "node:test";
import assert from "node:assert/strict";

import {
  classifyThrowHitText,
  IMPOSSIBLE_CHECKOUT_SCORES,
  canFinishWithSegment,
  evaluateThrowOutcome,
  getHighlightHitKind,
  getOneDartCheckoutSegment,
  getSuggestionOneDartCheckoutSegment,
  isDoubleBullSegment,
  isCheckoutPossibleFromScore,
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
} from "../../src/domain/x01-rules.js";

test("IMPOSSIBLE_CHECKOUT_SCORES include known impossible finishes", () => {
  assert.equal(IMPOSSIBLE_CHECKOUT_SCORES.has(169), true);
  assert.equal(IMPOSSIBLE_CHECKOUT_SCORES.has(170), false);
});

test("isCheckoutPossibleFromScore mirrors old score feasibility rules", () => {
  assert.equal(isCheckoutPossibleFromScore(170), true);
  assert.equal(isCheckoutPossibleFromScore(169), false);
  assert.equal(isCheckoutPossibleFromScore(1), false);
  assert.equal(isCheckoutPossibleFromScore(171), false);
});

test("one-dart checkout helpers resolve expected segments", () => {
  assert.equal(getOneDartCheckoutSegment(50), "BULL");
  assert.equal(getOneDartCheckoutSegment(40), "D20");
  assert.equal(getOneDartCheckoutSegment(39), "");

  assert.equal(isOneDartCheckoutSegment("BULL"), true);
  assert.equal(isOneDartCheckoutSegment("D16"), true);
  assert.equal(isOneDartCheckoutSegment("S20"), false);
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
  assert.deepEqual(parseExplicitCheckoutSegments("T20 D10"), ["T20", "D10"]);
  assert.deepEqual(parseExplicitCheckoutSegments("No Checkout"), []);
});

test("suggestion one-dart parser accepts exactly one explicit one-dart segment", () => {
  assert.equal(getSuggestionOneDartCheckoutSegment("D17"), "D17");
  assert.equal(getSuggestionOneDartCheckoutSegment("Bull"), "BULL");
  assert.equal(getSuggestionOneDartCheckoutSegment("T20 D20"), "");
  assert.equal(getSuggestionOneDartCheckoutSegment("T20"), "");
});

test("checkout target parser keeps legacy summary filtering behavior", () => {
  assert.deepEqual(parseCheckoutTargetsFromSuggestion("20 D10"), [{ ring: "D", value: 10 }]);
  assert.deepEqual(parseCheckoutTargetsFromSuggestion("20 10"), [
    { ring: "S", value: 20 },
    { ring: "S", value: 10 },
  ]);
  assert.deepEqual(parseCheckoutTargetsFromSuggestion("BULL"), [{ ring: "SB" }]);
  assert.deepEqual(parseCheckoutTargetsFromSuggestion("DB"), [{ ring: "DB" }]);
  assert.deepEqual(parseCheckoutTargetsFromSuggestion("T20 D20"), [
    { ring: "T", value: 20 },
    { ring: "D", value: 20 },
  ]);
});

test("parseCheckoutSuggestionState preserves suggestion parser behavior", () => {
  assert.equal(parseCheckoutSuggestionState("No Checkout"), false);
  assert.equal(parseCheckoutSuggestionState("Bust"), false);
  assert.equal(parseCheckoutSuggestionState("D16"), true);
  assert.equal(parseCheckoutSuggestionState("Double 16"), true);
  assert.equal(parseCheckoutSuggestionState("Bull"), true);
  assert.equal(parseCheckoutSuggestionState("T20 T20"), null);
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
});
