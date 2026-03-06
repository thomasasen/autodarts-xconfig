import test from "node:test";
import assert from "node:assert/strict";

import {
  IMPOSSIBLE_CHECKOUT_SCORES,
  canFinishWithSegment,
  evaluateThrowOutcome,
  getOneDartCheckoutSegment,
  isCheckoutPossibleFromScore,
  isOneDartCheckoutSegment,
  isSensibleThirdT20Score,
  normalizeOutMode,
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

  const invalidFinishDouble = evaluateThrowOutcome({
    scoreBefore: 40,
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