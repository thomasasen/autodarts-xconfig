import test from "node:test";
import assert from "node:assert/strict";

import {
  applyX01ThrowsToState,
  evaluateThrowOutcome,
  getCheckoutRoutesForScore,
  getPreferredCheckoutRoute,
  isCheckoutPossibleFromScoreForOutModeWithDarts,
} from "../../src/domain/x01-rules.js";

const OUT_MODES = ["straight", "double", "master"];
const MAX_THREE_DART_SCORE = 180;
const NUMBER_SEGMENTS = Array.from({ length: 20 }, (_value, index) => index + 1);
const OFFICIAL_SEGMENTS = Object.freeze([
  ...NUMBER_SEGMENTS.map((value) => ({ name: `S${value}`, ring: "S", score: value })),
  ...NUMBER_SEGMENTS.map((value) => ({ name: `D${value}`, ring: "D", score: value * 2 })),
  ...NUMBER_SEGMENTS.map((value) => ({ name: `T${value}`, ring: "T", score: value * 3 })),
  { name: "S25", ring: "S", score: 25 },
  { name: "BULL", ring: "D", score: 50 },
]);

function isOfficialFinishSegment(segment, outMode) {
  if (outMode === "straight") {
    return true;
  }
  if (outMode === "double") {
    return segment.ring === "D";
  }
  return segment.ring === "D" || segment.ring === "T";
}

function buildOfficialRoutesByLength(outMode) {
  const finishSegments = OFFICIAL_SEGMENTS.filter((segment) =>
    isOfficialFinishSegment(segment, outMode)
  );
  const routesByLength = new Map([
    [1, new Map()],
    [2, new Map()],
    [3, new Map()],
  ]);

  function recordRoutes(prefix, prefixScore, length) {
    if (prefix.length === length - 1) {
      finishSegments.forEach((finishSegment) => {
        const score = prefixScore + finishSegment.score;
        if (score > MAX_THREE_DART_SCORE) {
          return;
        }
        const routesByScore = routesByLength.get(length);
        const routeSet = routesByScore.get(score) || new Set();
        routeSet.add([...prefix, finishSegment.name].join(">"));
        routesByScore.set(score, routeSet);
      });
      return;
    }

    OFFICIAL_SEGMENTS.forEach((segment) => {
      const nextScore = prefixScore + segment.score;
      if (nextScore < MAX_THREE_DART_SCORE) {
        recordRoutes([...prefix, segment.name], nextScore, length);
      }
    });
  }

  for (let length = 1; length <= 3; length += 1) {
    recordRoutes([], 0, length);
  }
  return routesByLength;
}

function getOfficialRouteSet(routesByLength, score, dartsRemaining) {
  const result = new Set();
  for (let length = 1; length <= dartsRemaining; length += 1) {
    routesByLength.get(length)?.get(score)?.forEach((route) => result.add(route));
  }
  return result;
}

function expectedThrowOutcome(scoreBefore, segment, outMode) {
  const scoreAfter = scoreBefore - segment.score;
  let reason = "scored";

  if (scoreAfter < 0) {
    reason = "below-zero";
  } else if (outMode !== "straight" && scoreAfter === 1) {
    reason = "left-on-one";
  } else if (scoreAfter === 0 && !isOfficialFinishSegment(segment, outMode)) {
    reason = "invalid-finish-segment";
  } else if (scoreAfter === 0) {
    reason = "finished";
  }

  const isBust = ["below-zero", "left-on-one", "invalid-finish-segment"].includes(reason);
  return {
    scoreBefore,
    scoreAfter: isBust ? scoreBefore : scoreAfter,
    scoredPoints: segment.score,
    isBust,
    isFinish: reason === "finished",
    consumesDart: true,
    reason,
  };
}

test("X01 checkout reachability and route sets match an independent board-rule oracle", () => {
  OUT_MODES.forEach((outMode) => {
    const routesByLength = buildOfficialRoutesByLength(outMode);

    for (let dartsRemaining = 1; dartsRemaining <= 3; dartsRemaining += 1) {
      for (let score = 1; score <= MAX_THREE_DART_SCORE; score += 1) {
        const expectedRoutes = getOfficialRouteSet(routesByLength, score, dartsRemaining);
        const actualRoutes = getCheckoutRoutesForScore(score, outMode, dartsRemaining);

        assert.equal(
          actualRoutes.length,
          expectedRoutes.size,
          `route count: score=${score}, mode=${outMode}, darts=${dartsRemaining}`
        );
        actualRoutes.forEach((route) => {
          assert.equal(
            expectedRoutes.delete(route.join(">")),
            true,
            `illegal route ${route.join(">")}: score=${score}, mode=${outMode}, darts=${dartsRemaining}`
          );
        });
        assert.equal(
          expectedRoutes.size,
          0,
          `missing official routes: score=${score}, mode=${outMode}, darts=${dartsRemaining}`
        );
        assert.equal(
          isCheckoutPossibleFromScoreForOutModeWithDarts(score, outMode, dartsRemaining),
          actualRoutes.length > 0,
          `reachability: score=${score}, mode=${outMode}, darts=${dartsRemaining}`
        );
      }
    }
  });
});

test("preferred X01 routes are legal, shortest, deterministic and cache-safe", () => {
  OUT_MODES.forEach((outMode) => {
    for (let dartsRemaining = 1; dartsRemaining <= 3; dartsRemaining += 1) {
      for (let score = 1; score <= MAX_THREE_DART_SCORE; score += 1) {
        const routes = getCheckoutRoutesForScore(score, outMode, dartsRemaining);
        const preferred = getPreferredCheckoutRoute(score, outMode, dartsRemaining);
        const routeKeys = new Set(routes.map((route) => route.join(">")));

        if (!routes.length) {
          assert.deepEqual(preferred, []);
          continue;
        }

        assert.equal(
          routeKeys.has(preferred.join(">")),
          true,
          `preferred route must be legal: score=${score}, mode=${outMode}, darts=${dartsRemaining}`
        );
        assert.equal(
          preferred.length,
          Math.min(...routes.map((route) => route.length)),
          `preferred route must use the fewest darts: score=${score}, mode=${outMode}, darts=${dartsRemaining}`
        );
        assert.deepEqual(
          getPreferredCheckoutRoute(score, outMode, dartsRemaining),
          preferred,
          `preferred route must be deterministic: score=${score}, mode=${outMode}, darts=${dartsRemaining}`
        );
      }
    }
  });

  const mutableRoute = getPreferredCheckoutRoute(170, "double", 3);
  mutableRoute[0] = "S1";
  assert.deepEqual(getPreferredCheckoutRoute(170, "double", 3), ["T20", "T20", "BULL"]);

  const mutableRoutes = getCheckoutRoutesForScore(10, "double", 1);
  mutableRoutes[0][0] = "S10";
  assert.deepEqual(getCheckoutRoutesForScore(10, "double", 1), [["D5"]]);
});

test("official X01 boundary checkouts remain explicit rule examples", () => {
  const examples = [
    { score: 170, mode: "double", darts: 3, route: "T20>T20>BULL", possible: true },
    { score: 171, mode: "double", darts: 3, route: "", possible: false },
    { score: 110, mode: "double", darts: 2, route: "T20>BULL", possible: true },
    { score: 111, mode: "double", darts: 2, route: "", possible: false },
    { score: 121, mode: "double", darts: 2, route: "", possible: false },
    { score: 120, mode: "master", darts: 2, route: "T20>T20", possible: true },
    { score: 120, mode: "straight", darts: 2, route: "T20>T20", possible: true },
    { score: 180, mode: "master", darts: 3, route: "T20>T20>T20", possible: true },
    { score: 180, mode: "straight", darts: 3, route: "T20>T20>T20", possible: true },
    { score: 180, mode: "double", darts: 3, route: "", possible: false },
    { score: 1, mode: "straight", darts: 1, route: "S1", possible: true },
    { score: 1, mode: "double", darts: 1, route: "", possible: false },
    { score: 1, mode: "master", darts: 1, route: "", possible: false },
    { score: 10, mode: "double", darts: 1, route: "D5", possible: true },
    { score: 22, mode: "double", darts: 1, route: "D11", possible: true },
    { score: 50, mode: "double", darts: 1, route: "BULL", possible: true },
    { score: 60, mode: "master", darts: 1, route: "T20", possible: true },
  ];

  examples.forEach(({ score, mode, darts, route, possible }) => {
    const routes = getCheckoutRoutesForScore(score, mode, darts).map((value) => value.join(">"));
    assert.equal(
      isCheckoutPossibleFromScoreForOutModeWithDarts(score, mode, darts),
      possible,
      `${score} ${mode} with ${darts} dart(s)`
    );
    if (route) {
      assert.equal(routes.includes(route), true, `${route} must be an available route`);
    }
  });

  [159, 162, 163, 165, 166, 168, 169].forEach((score) => {
    assert.equal(
      isCheckoutPossibleFromScoreForOutModeWithDarts(score, "double", 3),
      false,
      `${score} is a three-dart Double-Out bogey number`
    );
  });
});

test("every physical segment follows the official X01 throw outcome matrix", () => {
  OUT_MODES.forEach((outMode) => {
    for (let scoreBefore = 1; scoreBefore <= MAX_THREE_DART_SCORE; scoreBefore += 1) {
      OFFICIAL_SEGMENTS.forEach((segment) => {
        assert.deepEqual(
          evaluateThrowOutcome({ scoreBefore, segmentName: segment.name, outMode }),
          expectedThrowOutcome(scoreBefore, segment, outMode),
          `score=${scoreBefore}, segment=${segment.name}, mode=${outMode}`
        );
      });
    }
  });
});

test("X01 visits stop on game shot or bust and restore the visit-start score on bust", () => {
  const cases = [
    {
      label: "finish on dart one",
      scoreBefore: 40,
      outMode: "double",
      throws: ["D20", "T20", "T20", "S1"],
      expected: { scoreAfter: 0, total: 40, bust: false, finish: true, stop: "finished", ignored: [1, 2, 3] },
    },
    {
      label: "finish on dart two",
      scoreBefore: 100,
      outMode: "double",
      throws: ["T20", "D20", "S1"],
      expected: { scoreAfter: 0, total: 100, bust: false, finish: true, stop: "finished", ignored: [2] },
    },
    {
      label: "invalid double finish on dart one",
      scoreBefore: 20,
      outMode: "double",
      throws: ["S20", "D10"],
      expected: { scoreAfter: 20, total: 0, bust: true, finish: false, stop: "bust", ignored: [1] },
    },
    {
      label: "below zero on dart two",
      scoreBefore: 100,
      outMode: "double",
      throws: ["T20", "T20", "D20"],
      expected: { scoreAfter: 100, total: 0, bust: true, finish: false, stop: "bust", ignored: [2] },
    },
    {
      label: "leave one on dart three",
      scoreBefore: 100,
      outMode: "double",
      throws: ["S20", "S19", "T20"],
      expected: { scoreAfter: 100, total: 0, bust: true, finish: false, stop: "bust", ignored: [] },
    },
    {
      label: "master out triple finish",
      scoreBefore: 60,
      outMode: "master",
      throws: ["T20", "D20"],
      expected: { scoreAfter: 0, total: 60, bust: false, finish: true, stop: "finished", ignored: [1] },
    },
    {
      label: "straight out single finish",
      scoreBefore: 20,
      outMode: "straight",
      throws: ["S20", "D20"],
      expected: { scoreAfter: 0, total: 20, bust: false, finish: true, stop: "finished", ignored: [1] },
    },
    {
      label: "complete scoring visit",
      scoreBefore: 301,
      outMode: "double",
      throws: ["T20", "T20", "T20"],
      expected: { scoreAfter: 121, total: 180, bust: false, finish: false, stop: "throws-exhausted", ignored: [] },
    },
    {
      label: "miss consumes dart one before checkout",
      scoreBefore: 100,
      outMode: "double",
      throws: ["MISS", "T20", "D20"],
      expected: { scoreAfter: 0, total: 100, bust: false, finish: true, stop: "finished", ignored: [] },
    },
    {
      label: "three misses do not grant a fourth dart",
      scoreBefore: 40,
      outMode: "double",
      throws: ["MISS", "MISS", "MISS", "D20"],
      expected: { scoreAfter: 40, total: 0, bust: false, finish: false, stop: "visit-dart-limit", ignored: [3] },
      limitIndex: 3,
    },
    {
      label: "fourth dart cannot score in one visit",
      scoreBefore: 181,
      outMode: "straight",
      throws: ["T20", "T20", "T20", "S1"],
      expected: { scoreAfter: 1, total: 180, bust: false, finish: false, stop: "visit-dart-limit", ignored: [3] },
      limitIndex: 3,
    },
  ];

  cases.forEach(({ label, scoreBefore, outMode, throws, expected, limitIndex }) => {
    const result = applyX01ThrowsToState({ scoreBefore, outMode, throws });
    assert.equal(result.scoreAfter, expected.scoreAfter, `${label}: score`);
    assert.equal(result.totalScoredPoints, expected.total, `${label}: total`);
    assert.equal(result.isBust, expected.bust, `${label}: bust`);
    assert.equal(result.isFinish, expected.finish, `${label}: finish`);
    assert.equal(result.stopReason, expected.stop, `${label}: stop reason`);
    assert.deepEqual(
      result.throwResults.filter((throwResult) => throwResult.ignored).map(({ index }) => index),
      expected.ignored,
      `${label}: ignored darts`
    );
    if (Number.isInteger(limitIndex)) {
      assert.equal(result.throwResults[limitIndex].reason, "visit-dart-limit", `${label}: limit`);
    }
  });
});
