import test from "node:test";
import assert from "node:assert/strict";

import {
  applyCricketThrowsToState,
  applyThrowsToMarksByLabel,
  CRICKET_TARGET_ORDER,
  TACTICS_TARGET_ORDER,
  clampMarks,
  computeTargetStates,
  createEmptyMarksByLabel,
  deriveTargetTransitions,
  diffMarksByLabel,
  evaluatePlayerTargetState,
  getCricketTargetBaseScore,
  getTargetOrderByGameMode,
  inferCricketGameModeByLabels,
  normalizeCricketLabel,
  parseCricketThrowSegment,
} from "../../src/domain/cricket-rules.js";

test("normalizeCricketLabel supports bull aliases and tactics labels", () => {
  assert.equal(normalizeCricketLabel("Bullseye"), "BULL");
  assert.equal(normalizeCricketLabel("25"), "BULL");
  assert.equal(normalizeCricketLabel("Target 14"), "14");
  assert.equal(normalizeCricketLabel("11 geschlossen"), "11");
  assert.equal(normalizeCricketLabel("foo"), "");
});

test("target order and mode inference separate cricket from tactics", () => {
  assert.deepEqual(getTargetOrderByGameMode("Cricket"), CRICKET_TARGET_ORDER);
  assert.deepEqual(getTargetOrderByGameMode("Tactics"), TACTICS_TARGET_ORDER);
  assert.equal(inferCricketGameModeByLabels(["20", "19", "BULL"]), "cricket");
  assert.equal(inferCricketGameModeByLabels(["20", "14", "10", "BULL"]), "tactics");
  assert.equal(inferCricketGameModeByLabels(["foo", "bar"]), "");
});

test("clampMarks normalizes values to range 0..3", () => {
  assert.equal(clampMarks(-1), 0);
  assert.equal(clampMarks(1.8), 2);
  assert.equal(clampMarks(9), 3);
});

test("parseCricketThrowSegment normalizes cricket hits, bull aliases and points", () => {
  assert.deepEqual(parseCricketThrowSegment({ segment: { name: "T20" } }), {
    ring: "T",
    value: 20,
    marks: 3,
    label: "20",
    points: 60,
  });
  assert.deepEqual(parseCricketThrowSegment({ segment: { name: "D17" } }), {
    ring: "D",
    value: 17,
    marks: 2,
    label: "17",
    points: 34,
  });
  assert.deepEqual(parseCricketThrowSegment({ segment: { name: "bull" } }), {
    ring: "D",
    value: 25,
    marks: 2,
    label: "BULL",
    points: 50,
  });
  assert.deepEqual(parseCricketThrowSegment({ segment: { name: "OB" } }), {
    ring: "S",
    value: 25,
    marks: 1,
    label: "BULL",
    points: 25,
  });
  assert.deepEqual(
    parseCricketThrowSegment({ segment: { number: 20, multiplier: 2, bed: "Double" } }),
    {
      ring: "D",
      value: 20,
      marks: 2,
      label: "20",
      points: 40,
    }
  );
  assert.equal(parseCricketThrowSegment({ segment: { name: "T25" } }), null);
});

test("base scoring values use 25 for bull overflow and face value for numbers", () => {
  assert.equal(getCricketTargetBaseScore("20"), 20);
  assert.equal(getCricketTargetBaseScore("BULL"), 25);
});

test("evaluatePlayerTargetState derives offense, pressure and dead independent of display flags", () => {
  const offenseState = evaluatePlayerTargetState([3, 0], 0, {
    activePlayerIndex: 0,
    scoringMode: "standard",
  });
  assert.equal(offenseState.presentation, "offense");
  assert.equal(offenseState.scorableForPlayer, true);

  const pressureState = evaluatePlayerTargetState([0, 3], 0, {
    activePlayerIndex: 0,
    scoringMode: "standard",
  });
  assert.equal(pressureState.presentation, "pressure");
  assert.equal(pressureState.scorableAgainstPlayer, true);

  const deadState = evaluatePlayerTargetState([3, 3], 1, {
    activePlayerIndex: 1,
    scoringMode: "standard",
    showDeadTargets: false,
  });
  assert.equal(deadState.dead, true);
  assert.equal(deadState.presentation, "dead");
});

test("solo target can be closed without becoming dead", () => {
  const soloState = evaluatePlayerTargetState([3], 0, {
    activePlayerIndex: 0,
    scoringMode: "standard",
  });

  assert.equal(soloState.closed, true);
  assert.equal(soloState.dead, false);
  assert.equal(soloState.allClosed, true);
  assert.equal(soloState.presentation, "closed");
});

test("computeTargetStates keeps board perspective and cell states aligned", () => {
  const marksByLabel = {
    "20": [3, 0],
    "19": [0, 3],
    "18": [3, 3],
    "10": [3, 0],
    BULL: [0, 0],
  };

  const states = computeTargetStates(marksByLabel, {
    gameMode: "Tactics",
    scoringMode: "standard",
    activePlayerIndex: 1,
  });

  assert.equal(states.get("20").boardPresentation, "pressure");
  assert.equal(states.get("20").cellStates[0].presentation, "offense");
  assert.equal(states.get("20").cellStates[1].presentation, "pressure");
  assert.equal(states.get("18").boardPresentation, "dead");
  assert.equal(states.has("10"), true);
});

test("neutral or unknown scoring mode suppresses tactical offense and danger signals", () => {
  const neutralStates = computeTargetStates(
    {
      "20": [3, 0],
      BULL: [3, 3],
    },
    {
      gameMode: "Cricket",
      scoringMode: "no-score",
      activePlayerIndex: 0,
    }
  );

  assert.equal(neutralStates.get("20").presentation, "closed");
  assert.equal(neutralStates.get("20").offense, false);
  assert.equal(neutralStates.get("20").danger, false);
  assert.equal(neutralStates.get("BULL").presentation, "dead");

  const unknownStates = computeTargetStates(
    {
      "20": [0, 3],
    },
    {
      gameMode: "Cricket",
      scoringMode: "mystery-mode",
      activePlayerIndex: 0,
    }
  );

  assert.equal(unknownStates.get("20").presentation, "open");
  assert.equal(unknownStates.get("20").danger, false);
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

test("standard cricket awards overflow only to the active player while opponents stay open", () => {
  const result = applyCricketThrowsToState({
    targetOrder: CRICKET_TARGET_ORDER,
    playerIndex: 0,
    playerCount: 2,
    scoringMode: "standard",
    baseMarksByLabel: {
      "20": [2, 2],
      "19": [2, 3],
      BULL: [0, 0],
      "18": [0, 0],
      "17": [0, 0],
      "16": [0, 0],
      "15": [0, 0],
    },
    throws: [{ segment: { name: "T20" } }, { segment: { name: "T19" } }],
  });

  assert.equal(result.nextMarksByLabel["20"][0], 3);
  assert.equal(result.nextMarksByLabel["19"][0], 3);
  assert.deepEqual(result.scoreDeltaByPlayer, [40, 0]);
  assert.equal(result.scoringEvents.length, 1);
  assert.deepEqual(result.scoringEvents[0].recipients, [{ playerIndex: 0, delta: 40 }]);
});

test("cut-throat awards overflow to each still-open opponent", () => {
  const result = applyCricketThrowsToState({
    targetOrder: CRICKET_TARGET_ORDER,
    playerIndex: 0,
    playerCount: 3,
    scoringMode: "cut-throat",
    baseMarksByLabel: {
      "20": [2, 0, 3],
      BULL: [0, 0, 0],
      "19": [0, 0, 0],
      "18": [0, 0, 0],
      "17": [0, 0, 0],
      "16": [0, 0, 0],
      "15": [0, 0, 0],
    },
    throws: [{ segment: { name: "T20" } }],
  });

  assert.equal(result.nextMarksByLabel["20"][0], 3);
  assert.deepEqual(result.scoreDeltaByPlayer, [0, 40, 0]);
  assert.deepEqual(result.scoringEvents[0].recipients, [{ playerIndex: 1, delta: 40 }]);
});

test("neutral mode keeps marks but never creates scoring deltas", () => {
  const result = applyCricketThrowsToState({
    targetOrder: CRICKET_TARGET_ORDER,
    playerIndex: 0,
    playerCount: 2,
    scoringMode: "no-score",
    baseMarksByLabel: {
      "20": [2, 0],
      BULL: [0, 0],
      "19": [0, 0],
      "18": [0, 0],
      "17": [0, 0],
      "16": [0, 0],
      "15": [0, 0],
    },
    throws: [{ segment: { name: "T20" } }],
  });

  assert.equal(result.nextMarksByLabel["20"][0], 3);
  assert.deepEqual(result.scoreDeltaByPlayer, [0, 0]);
  assert.equal(result.scoringEvents.length, 0);
});

test("bull overflow scores 25 per extra bull mark and stops when everyone is closed", () => {
  const scoringBull = applyCricketThrowsToState({
    targetOrder: CRICKET_TARGET_ORDER,
    playerIndex: 0,
    playerCount: 2,
    scoringMode: "standard",
    baseMarksByLabel: {
      BULL: [2, 0],
      "20": [0, 0],
      "19": [0, 0],
      "18": [0, 0],
      "17": [0, 0],
      "16": [0, 0],
      "15": [0, 0],
    },
    throws: [{ segment: { name: "DB" } }],
  });

  assert.equal(scoringBull.nextMarksByLabel.BULL[0], 3);
  assert.deepEqual(scoringBull.scoreDeltaByPlayer, [25, 0]);

  const deadBull = applyCricketThrowsToState({
    targetOrder: CRICKET_TARGET_ORDER,
    playerIndex: 0,
    playerCount: 2,
    scoringMode: "standard",
    baseMarksByLabel: {
      BULL: [2, 3],
      "20": [0, 0],
      "19": [0, 0],
      "18": [0, 0],
      "17": [0, 0],
      "16": [0, 0],
      "15": [0, 0],
    },
    throws: [{ segment: { name: "DB" } }],
  });

  assert.equal(deadBull.nextMarksByLabel.BULL[0], 3);
  assert.deepEqual(deadBull.scoreDeltaByPlayer, [0, 0]);
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
