import test from "node:test";
import assert from "node:assert/strict";

import {
  applyThrowsToMarksByLabel,
  CRICKET_TARGET_ORDER,
  TACTICS_TARGET_ORDER,
  clampMarks,
  computeTargetStates,
  createEmptyMarksByLabel,
  deriveTargetTransitions,
  diffMarksByLabel,
  evaluatePlayerTargetState,
  getTargetOrderByGameMode,
  normalizeCricketLabel,
  parseCricketThrowSegment,
} from "../../src/domain/cricket-rules.js";

test("normalizeCricketLabel supports bull aliases and tactic labels", () => {
  assert.equal(normalizeCricketLabel("Bullseye"), "BULL");
  assert.equal(normalizeCricketLabel(" 14 "), "14");
  assert.equal(normalizeCricketLabel("25"), "BULL");
  assert.equal(normalizeCricketLabel("foo"), "");
});

test("target order switches between cricket and tactics", () => {
  assert.deepEqual(getTargetOrderByGameMode("Cricket"), CRICKET_TARGET_ORDER);
  assert.deepEqual(getTargetOrderByGameMode("Tactics"), TACTICS_TARGET_ORDER);
});

test("clampMarks normalizes values to range 0..3", () => {
  assert.equal(clampMarks(-1), 0);
  assert.equal(clampMarks(1.8), 2);
  assert.equal(clampMarks(9), 3);
});

test("evaluatePlayerTargetState returns offense and pressure states", () => {
  const offenseState = evaluatePlayerTargetState([3, 0], 0, {
    activePlayerIndex: 0,
    supportsTacticalHighlights: true,
  });
  assert.equal(offenseState.presentation, "offense");

  const pressureState = evaluatePlayerTargetState([0, 3], 0, {
    activePlayerIndex: 0,
    supportsTacticalHighlights: true,
  });
  assert.equal(pressureState.presentation, "pressure");

  const deadState = evaluatePlayerTargetState([3, 3], 1, {
    activePlayerIndex: 1,
    supportsTacticalHighlights: true,
    showDeadTargets: true,
  });
  assert.equal(deadState.presentation, "dead");
});

test("computeTargetStates keeps per-player state while deriving board perspective", () => {
  const marksByLabel = {
    "20": [3, 0],
    "19": [0, 3],
    "18": [3, 3],
    "10": [3, 0],
    BULL: [0, 0],
  };

  const states = computeTargetStates(marksByLabel, {
    gameMode: "Tactics",
    activePlayerIndex: 1,
    supportsTacticalHighlights: true,
    showDeadTargets: true,
  });

  assert.equal(states.get("20").boardPresentation, "pressure");
  assert.equal(states.get("20").cellStates[0].presentation, "offense");
  assert.equal(states.get("20").cellStates[1].presentation, "pressure");
  assert.equal(states.get("18").boardPresentation, "dead");
  assert.equal(states.has("10"), true);
});

test("parseCricketThrowSegment normalizes cricket and tactics hits", () => {
  assert.deepEqual(parseCricketThrowSegment({ segment: { name: "T20" } }), {
    ring: "T",
    value: 20,
    marks: 3,
    label: "20",
  });
  assert.deepEqual(parseCricketThrowSegment({ segment: { name: "D17" } }), {
    ring: "D",
    value: 17,
    marks: 2,
    label: "17",
  });
  assert.deepEqual(parseCricketThrowSegment({ segment: { name: "bull" } }), {
    ring: "D",
    value: 25,
    marks: 2,
    label: "BULL",
  });
  assert.equal(parseCricketThrowSegment({ segment: { name: "T9" } })?.label, "9");
  assert.equal(parseCricketThrowSegment({ segment: { name: "T25" } }), null);
});

test("applyThrowsToMarksByLabel applies capped marks per player", () => {
  const baseMarks = createEmptyMarksByLabel(TACTICS_TARGET_ORDER, 2);
  const next = applyThrowsToMarksByLabel({
    targetOrder: TACTICS_TARGET_ORDER,
    playerIndex: 1,
    baseMarksByLabel: baseMarks,
    throws: [
      { segment: { name: "T20" } },
      { segment: { name: "D17" } },
      { segment: { name: "S17" } },
      { segment: { name: "BULL" } },
    ],
  });

  assert.equal(next["20"][1], 3);
  assert.equal(next["17"][1], 3);
  assert.equal(next.BULL[1], 2);
  assert.equal(next["20"][0], 0);
});

test("diffMarksByLabel reports deltas and increases per target", () => {
  const diff = diffMarksByLabel({
    targetOrder: ["20", "19", "BULL"],
    previousMarksByLabel: {
      "20": [1, 0],
      "19": [0, 2],
      BULL: [0, 0],
    },
    nextMarksByLabel: {
      "20": [3, 0],
      "19": [0, 3],
      BULL: [2, 0],
    },
  });

  assert.deepEqual(diff.get("20")?.playerDeltas, [2, 0]);
  assert.equal(diff.get("20")?.hasIncrease, true);
  assert.equal(diff.get("20")?.maxIncrease, 2);
  assert.deepEqual(diff.get("19")?.playerDeltas, [0, 1]);
  assert.equal(diff.get("19")?.changed, true);
  assert.deepEqual(diff.get("BULL")?.playerDeltas, [2, 0]);
});

test("deriveTargetTransitions exposes board presentation changes", () => {
  const previousStates = new Map([
    ["20", { boardPresentation: "open" }],
    ["19", { boardPresentation: "danger" }],
    ["BULL", { boardPresentation: "closed" }],
  ]);
  const nextStates = new Map([
    ["20", { boardPresentation: "offense" }],
    ["19", { boardPresentation: "pressure" }],
    ["BULL", { boardPresentation: "dead" }],
  ]);

  const transitions = deriveTargetTransitions({
    targetOrder: ["20", "19", "BULL"],
    previousStateMap: previousStates,
    nextStateMap: nextStates,
  });

  assert.equal(transitions.get("20")?.presentationChanged, true);
  assert.equal(transitions.get("20")?.becameOffense, true);
  assert.equal(transitions.get("19")?.becamePressure, true);
  assert.equal(transitions.get("BULL")?.becameDead, true);
  assert.equal(transitions.get("BULL")?.becameClosed, false);
});
