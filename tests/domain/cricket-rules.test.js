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
  evaluateCricketWinState,
  evaluatePlayerTargetState,
  getCricketTargetBaseScore,
  getTargetOrderByGameMode,
  inferCricketGameModeByLabels,
  normalizeCricketLabel,
  parseCricketMarkValue,
  parseCricketThrowSegment,
  resolveTargetOrderByGameModeAndLabels,
} from "../../src/domain/cricket-rules.js";

const MARK_VALUES = [0, 1, 2, 3];
const SCORING_MODES = ["standard", "cutthroat", "neutral"];

function expectedPresentationByRule(marksByPlayer, playerIndex) {
  const normalized = Array.isArray(marksByPlayer) ? marksByPlayer.map((value) => clampMarks(value)) : [];
  const ownMarks = normalized[playerIndex] || 0;
  const opponents = normalized.filter((_, index) => index !== playerIndex);
  const allClosed = normalized.length > 0 && normalized.every((value) => value >= 3);
  const hasOpenOpponent = opponents.some((value) => value < 3);
  const hasClosedOpponent = opponents.some((value) => value >= 3);

  if (allClosed) {
    return "dead";
  }
  if (ownMarks >= 3 && hasOpenOpponent) {
    return "scoring";
  }
  if (ownMarks < 3 && hasClosedOpponent) {
    return "pressure";
  }
  return "open";
}

function expectedFlagsByRule(marksByPlayer, playerIndex) {
  const presentation = expectedPresentationByRule(marksByPlayer, playerIndex);
  return {
    presentation,
    open: presentation === "open",
    pressure: presentation === "pressure",
    scoring: presentation === "scoring",
    dead: presentation === "dead",
  };
}

test("normalizeCricketLabel supports bull aliases and tactics labels", () => {
  assert.equal(normalizeCricketLabel("Bullseye"), "BULL");
  assert.equal(normalizeCricketLabel("25"), "BULL");
  assert.equal(normalizeCricketLabel("Target 14"), "14");
  assert.equal(normalizeCricketLabel("11 geschlossen"), "11");
  assert.equal(normalizeCricketLabel("Double"), "DOUBLE");
  assert.equal(normalizeCricketLabel("Triple"), "TRIPLE");
  assert.equal(normalizeCricketLabel("foo"), "");
});

test("target order and mode inference separate cricket from tactics", () => {
  assert.deepEqual(getTargetOrderByGameMode("Cricket"), CRICKET_TARGET_ORDER);
  assert.deepEqual(getTargetOrderByGameMode("Tactics"), TACTICS_TARGET_ORDER);
  assert.equal(inferCricketGameModeByLabels(["20", "19", "BULL"]), "cricket");
  assert.equal(inferCricketGameModeByLabels(["20", "14", "10", "BULL"]), "tactics");
  assert.equal(inferCricketGameModeByLabels(["20", "Double", "Bull"]), "tactics");
  assert.equal(inferCricketGameModeByLabels(["foo", "bar"]), "");
});

test("resolveTargetOrderByGameModeAndLabels keeps dynamic tactics extras from visible labels", () => {
  assert.deepEqual(
    resolveTargetOrderByGameModeAndLabels("tactics", ["20", "19", "Double", "Triple", "Bull"]),
    ["20", "19", "BULL", "DOUBLE", "TRIPLE"]
  );
  assert.deepEqual(
    resolveTargetOrderByGameModeAndLabels("cricket", ["20", "19", "Double", "Triple", "Bull"]),
    CRICKET_TARGET_ORDER
  );
});

test("clampMarks normalizes values to range 0..3", () => {
  assert.equal(clampMarks(-1), 0);
  assert.equal(clampMarks(1.8), 2);
  assert.equal(clampMarks(9), 3);
});

test("parseCricketMarkValue supports numeric and symbolic cricket mark notations", () => {
  assert.equal(parseCricketMarkValue("0"), 0);
  assert.equal(parseCricketMarkValue("2"), 2);
  assert.equal(parseCricketMarkValue("3"), 3);
  assert.equal(parseCricketMarkValue("/"), 1);
  assert.equal(parseCricketMarkValue("|"), 1);
  assert.equal(parseCricketMarkValue("X"), 2);
  assert.equal(parseCricketMarkValue("✕"), 2);
  assert.equal(parseCricketMarkValue("⊗"), 3);
  assert.equal(parseCricketMarkValue(""), null);
  assert.equal(parseCricketMarkValue("foo"), null);
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
  assert.equal(offenseState.presentation, "scoring");
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

test("evaluatePlayerTargetState exposes explicit own/open/scorable helper fields", () => {
  const state = evaluatePlayerTargetState([3, 1], 0, {
    activePlayerIndex: 0,
    scoringMode: "standard",
  });

  assert.equal(state.open, false);
  assert.equal(state.own, true);
  assert.equal(state.opponentsOpen, true);
  assert.equal(state.scorable, true);
  assert.equal(state.threatenedByOpponents, false);
  assert.equal(state.openOpponentCount, 1);
  assert.equal(state.closedOpponentCount, 0);
});

test("solo target follows dead-state when all players are closed", () => {
  const soloState = evaluatePlayerTargetState([3], 0, {
    activePlayerIndex: 0,
    scoringMode: "standard",
  });

  assert.equal(soloState.closed, true);
  assert.equal(soloState.dead, true);
  assert.equal(soloState.allClosed, true);
  assert.equal(soloState.presentation, "dead");
});

test("evaluatePlayerTargetState keeps marks=2 under opponent close in pressure", () => {
  const pressureState = evaluatePlayerTargetState([2, 3, 0], 0, {
    activePlayerIndex: 0,
    scoringMode: "standard",
  });

  assert.equal(pressureState.open, true);
  assert.equal(pressureState.closed, false);
  assert.equal(pressureState.presentation, "pressure");
  assert.equal(pressureState.pressure, true);
  assert.equal(pressureState.scorableAgainstPlayer, true);
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
  assert.equal(states.get("20").cellStates[0].presentation, "scoring");
  assert.equal(states.get("20").cellStates[1].presentation, "pressure");
  assert.equal(states.get("20").scorable, false);
  assert.equal(states.get("20").threatenedByOpponents, true);
  assert.equal(states.get("20").open, true);
  assert.equal(states.get("20").own, false);
  assert.equal(states.get("18").boardPresentation, "dead");
  assert.equal(states.has("10"), true);
});

test("neutral or unknown scoring mode follows the same tactical state machine", () => {
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

  assert.equal(neutralStates.get("20").presentation, "scoring");
  assert.equal(neutralStates.get("20").offense, true);
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

  assert.equal(unknownStates.get("20").presentation, "pressure");
  assert.equal(unknownStates.get("20").danger, true);
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
    ["19", { boardPresentation: "open" }],
    ["BULL", { boardPresentation: "open" }],
  ]);
  const nextStates = new Map([
    ["20", { boardPresentation: "scoring" }],
    ["19", { boardPresentation: "pressure" }],
    ["BULL", { boardPresentation: "dead" }],
  ]);

  const transitions = deriveTargetTransitions({
    targetOrder: ["20", "19", "BULL"],
    previousStateMap: previousStates,
    nextStateMap: nextStates,
  });

  assert.equal(transitions.get("20")?.presentationChanged, true);
  assert.equal(transitions.get("20")?.becameScoring, true);
  assert.equal(transitions.get("19")?.becamePressure, true);
  assert.equal(transitions.get("BULL")?.becameDead, true);
  assert.equal(transitions.get("BULL")?.becameClosed, true);
});

test("computeTargetStates follows 4-state formula for multi-player scenarios", () => {
  const states = computeTargetStates(
    {
      "20": [3, 2, 3],
      "19": [3, 3, 3],
      "18": [2, 1, 0],
    },
    {
      gameMode: "Cricket",
      scoringMode: "standard",
      activePlayerIndex: 1,
      targetOrder: ["20", "19", "18"],
    }
  );

  assert.equal(states.get("20")?.cellStates?.[0]?.presentation, "scoring");
  assert.equal(states.get("20")?.cellStates?.[1]?.presentation, "pressure");
  assert.equal(states.get("20")?.cellStates?.[2]?.presentation, "scoring");
  assert.equal(states.get("19")?.boardPresentation, "dead");
  assert.equal(states.get("18")?.boardPresentation, "open");
});

test("tactics DOUBLE and TRIPLE use the same four-state semantics as numeric targets", () => {
  const states = computeTargetStates(
    {
      DOUBLE: [3, 0],
      TRIPLE: [0, 3],
    },
    {
      gameMode: "Tactics",
      scoringMode: "standard",
      activePlayerIndex: 0,
      targetOrder: ["DOUBLE", "TRIPLE"],
    }
  );

  assert.equal(states.get("DOUBLE")?.boardPresentation, "scoring");
  assert.equal(states.get("DOUBLE")?.cellStates?.[0]?.presentation, "scoring");
  assert.equal(states.get("DOUBLE")?.cellStates?.[1]?.presentation, "pressure");
  assert.equal(states.get("TRIPLE")?.boardPresentation, "pressure");
  assert.equal(states.get("TRIPLE")?.cellStates?.[0]?.presentation, "pressure");
  assert.equal(states.get("TRIPLE")?.cellStates?.[1]?.presentation, "scoring");
});

test("cricket and tactics state engine matches the independent 4-state oracle across objective families", () => {
  const objectiveCases = [
    {
      label: "20",
      gameMode: "Cricket",
      targetOrder: ["20"],
    },
    {
      label: "BULL",
      gameMode: "Cricket",
      targetOrder: ["BULL"],
    },
    {
      label: "DOUBLE",
      gameMode: "Tactics",
      targetOrder: ["DOUBLE"],
    },
    {
      label: "TRIPLE",
      gameMode: "Tactics",
      targetOrder: ["TRIPLE"],
    },
  ];

  objectiveCases.forEach(({ label, gameMode, targetOrder }) => {
    SCORING_MODES.forEach((scoringModeNormalized) => {
      MARK_VALUES.forEach((leftMarks) => {
        MARK_VALUES.forEach((rightMarks) => {
          const marksByPlayer = [leftMarks, rightMarks];

          marksByPlayer.forEach((_, playerIndex) => {
            const expected = expectedFlagsByRule(marksByPlayer, playerIndex);
            const actual = evaluatePlayerTargetState(marksByPlayer, playerIndex, {
              activePlayerIndex: playerIndex,
              scoringModeNormalized,
            });

            assert.equal(
              actual.presentation,
              expected.presentation,
              `${label} ${scoringModeNormalized} 2p ${marksByPlayer.join(",")} player ${playerIndex}`
            );
            assert.equal(actual.pressure, expected.pressure, `${label} ${scoringModeNormalized} 2p pressure ${marksByPlayer.join(",")} player ${playerIndex}`);
            assert.equal(actual.scoring, expected.scoring, `${label} ${scoringModeNormalized} 2p scoring ${marksByPlayer.join(",")} player ${playerIndex}`);
            assert.equal(actual.dead, expected.dead, `${label} ${scoringModeNormalized} 2p dead ${marksByPlayer.join(",")} player ${playerIndex}`);
          });

          const stateMap = computeTargetStates(
            {
              [label]: marksByPlayer,
            },
            {
              gameMode,
              targetOrder,
              scoringModeNormalized,
              activePlayerIndex: 0,
            }
          );
          const stateEntry = stateMap.get(label);
          assert.ok(stateEntry, `${label} state entry missing for ${scoringModeNormalized} 2p ${marksByPlayer.join(",")}`);
          marksByPlayer.forEach((_, playerIndex) => {
            assert.equal(
              stateEntry?.cellStates?.[playerIndex]?.presentation,
              expectedPresentationByRule(marksByPlayer, playerIndex),
              `${label} ${scoringModeNormalized} 2p cellStates ${marksByPlayer.join(",")} player ${playerIndex}`
            );
          });
          assert.equal(
            stateEntry?.boardPresentation,
            expectedPresentationByRule(marksByPlayer, 0),
            `${label} ${scoringModeNormalized} 2p board ${marksByPlayer.join(",")} active 0`
          );
        });
      });
    });
  });
});

test("cricket and tactics 3-player state engine matches the independent 4-state oracle", () => {
  const objectiveCases = [
    {
      label: "20",
      gameMode: "Cricket",
      targetOrder: ["20"],
    },
    {
      label: "BULL",
      gameMode: "Cricket",
      targetOrder: ["BULL"],
    },
    {
      label: "DOUBLE",
      gameMode: "Tactics",
      targetOrder: ["DOUBLE"],
    },
    {
      label: "TRIPLE",
      gameMode: "Tactics",
      targetOrder: ["TRIPLE"],
    },
  ];

  objectiveCases.forEach(({ label, gameMode, targetOrder }) => {
    SCORING_MODES.forEach((scoringModeNormalized) => {
      MARK_VALUES.forEach((firstMarks) => {
        MARK_VALUES.forEach((secondMarks) => {
          MARK_VALUES.forEach((thirdMarks) => {
            const marksByPlayer = [firstMarks, secondMarks, thirdMarks];
            const stateMap = computeTargetStates(
              {
                [label]: marksByPlayer,
              },
              {
                gameMode,
                targetOrder,
                scoringModeNormalized,
                activePlayerIndex: 1,
              }
            );
            const stateEntry = stateMap.get(label);
            assert.ok(stateEntry, `${label} state entry missing for ${scoringModeNormalized} 3p ${marksByPlayer.join(",")}`);

            marksByPlayer.forEach((_, playerIndex) => {
              assert.equal(
                stateEntry?.cellStates?.[playerIndex]?.presentation,
                expectedPresentationByRule(marksByPlayer, playerIndex),
                `${label} ${scoringModeNormalized} 3p cellStates ${marksByPlayer.join(",")} player ${playerIndex}`
              );
            });

            assert.equal(
              stateEntry?.boardPresentation,
              expectedPresentationByRule(marksByPlayer, 1),
              `${label} ${scoringModeNormalized} 3p board ${marksByPlayer.join(",")} active 1`
            );
          });
        });
      });
    });
  });
});

test("evaluateCricketWinState resolves standard, cut-throat and neutral winners", () => {
  const standardWin = evaluateCricketWinState({
    targetOrder: CRICKET_TARGET_ORDER,
    scoringMode: "standard",
    scoresByPlayer: [45, 30],
    marksByLabel: {
      "20": [3, 3],
      "19": [3, 3],
      "18": [3, 3],
      "17": [3, 3],
      "16": [3, 3],
      "15": [3, 0],
      BULL: [3, 3],
    },
  });
  assert.equal(standardWin.hasWinner, true);
  assert.deepEqual(standardWin.winnerIndexes, [0]);
  assert.equal(standardWin.playerStates[0].allTargetsClosed, true);
  assert.equal(standardWin.playerStates[1].allTargetsClosed, false);

  const cutThroatWin = evaluateCricketWinState({
    targetOrder: CRICKET_TARGET_ORDER,
    scoringMode: "cut-throat",
    scoresByPlayer: [75, 25],
    marksByLabel: {
      "20": [3, 3],
      "19": [3, 3],
      "18": [3, 3],
      "17": [3, 3],
      "16": [3, 3],
      "15": [3, 3],
      BULL: [3, 3],
    },
  });
  assert.equal(cutThroatWin.hasWinner, true);
  assert.deepEqual(cutThroatWin.winnerIndexes, [1]);
  assert.equal(cutThroatWin.playerStates[1].leading, true);

  const neutralTie = evaluateCricketWinState({
    targetOrder: CRICKET_TARGET_ORDER,
    scoringMode: "no-score",
    scoresByPlayer: [100, 10],
    marksByLabel: {
      "20": [3, 3],
      "19": [3, 3],
      "18": [3, 3],
      "17": [3, 3],
      "16": [3, 3],
      "15": [3, 3],
      BULL: [3, 3],
    },
  });
  assert.equal(neutralTie.hasWinner, true);
  assert.equal(neutralTie.isTie, true);
  assert.deepEqual(neutralTie.winnerIndexes, [0, 1]);
});
