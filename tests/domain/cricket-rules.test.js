import test from "node:test";
import assert from "node:assert/strict";

import {
  CRICKET_TARGET_ORDER,
  TACTICS_TARGET_ORDER,
  clampMarks,
  computeTargetStates,
  evaluatePlayerTargetState,
  getTargetOrderByGameMode,
  normalizeCricketLabel,
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