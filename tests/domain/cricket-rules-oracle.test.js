import test from "node:test";
import assert from "node:assert/strict";

import {
  applyCricketThrowsToState,
  CRICKET_TARGET_ORDER,
  evaluateCricketWinState,
  getCricketTargetBaseScore,
  TACTICS_TARGET_ORDER,
} from "../../src/domain/cricket-rules.js";

const SCORING_MODES = Object.freeze([
  { input: "standard", normalized: "standard" },
  { input: "cut-throat", normalized: "cutthroat" },
  { input: "no-score", normalized: "neutral" },
]);
const NUMERIC_HITS = Object.freeze([
  { name: "S", ring: "S", marks: 1 },
  { name: "D", ring: "D", marks: 2 },
  { name: "T", ring: "T", marks: 3 },
]);
const BULL_HITS = Object.freeze([
  { name: "S25", ring: "S", marks: 1 },
  { name: "BULL", ring: "D", marks: 2 },
]);

function enumerateVectors(length, values) {
  const result = [];

  function visit(prefix) {
    if (prefix.length === length) {
      result.push(prefix);
      return;
    }
    values.forEach((value) => visit([...prefix, value]));
  }

  visit([]);
  return result;
}

function createMarksByLabel(targetOrder, playerCount, targetLabel = "", targetMarks = []) {
  return Object.fromEntries(
    targetOrder.map((label) => [
      label,
      label === targetLabel
        ? targetMarks.slice()
        : Array.from({ length: playerCount }, () => 0),
    ])
  );
}

function expectedCricketThrow({ marks, playerIndex, hit, baseScore, scoringMode }) {
  const currentMarks = marks[playerIndex];
  const marksToClose = Math.max(0, 3 - currentMarks);
  const appliedMarks = Math.min(hit.marks, marksToClose);
  const overflowMarks = Math.max(0, hit.marks - marksToClose);
  const nextMarks = marks.slice();
  nextMarks[playerIndex] = Math.min(3, currentMarks + appliedMarks);
  const openOpponentIndexes = marks
    .map((mark, index) => ({ mark, index }))
    .filter(({ mark, index }) => index !== playerIndex && mark < 3)
    .map(({ index }) => index);
  const scoreDeltaByPlayer = Array.from({ length: marks.length }, () => 0);
  const totalPoints = overflowMarks * baseScore;
  const recipients = [];

  if (totalPoints > 0 && openOpponentIndexes.length && scoringMode === "standard") {
    scoreDeltaByPlayer[playerIndex] = totalPoints;
    recipients.push({ playerIndex, delta: totalPoints });
  } else if (totalPoints > 0 && openOpponentIndexes.length && scoringMode === "cutthroat") {
    openOpponentIndexes.forEach((opponentIndex) => {
      scoreDeltaByPlayer[opponentIndex] = totalPoints;
      recipients.push({ playerIndex: opponentIndex, delta: totalPoints });
    });
  }

  return {
    nextMarks,
    scoreDeltaByPlayer,
    appliedMarks,
    overflowMarks,
    totalPoints,
    recipients,
    createsScoringEvent: recipients.length > 0,
  };
}

function buildExpectedScoringEvent({
  targetLabel,
  hit,
  playerIndex,
  baseScore,
  expected,
}) {
  return {
    label: targetLabel,
    ring: hit.ring,
    marks: hit.marks,
    appliedMarks: expected.appliedMarks,
    overflowMarks: expected.overflowMarks,
    baseScore,
    totalPoints: expected.totalPoints,
    playerIndex,
    recipients: expected.recipients,
  };
}

test("Cricket scoring matches an independent marks and overflow oracle", () => {
  const targetCases = [
    { label: "20", gameMode: "Cricket", targetOrder: CRICKET_TARGET_ORDER, hits: NUMERIC_HITS },
    { label: "10", gameMode: "Tactics", targetOrder: TACTICS_TARGET_ORDER, hits: NUMERIC_HITS },
    { label: "BULL", gameMode: "Cricket", targetOrder: CRICKET_TARGET_ORDER, hits: BULL_HITS },
  ];

  targetCases.forEach(({ label, gameMode, targetOrder, hits }) => {
    const baseScore = label === "BULL" ? 25 : Number(label);

    for (let playerCount = 2; playerCount <= 4; playerCount += 1) {
      const markVectors = enumerateVectors(playerCount, [0, 1, 2, 3]);

      for (let playerIndex = 0; playerIndex < playerCount; playerIndex += 1) {
        markVectors.forEach((marks) => {
          hits.forEach((hit) => {
            SCORING_MODES.forEach(({ input, normalized }) => {
              const segmentName = label === "BULL" ? hit.name : `${hit.name}${label}`;
              const expected = expectedCricketThrow({
                marks,
                playerIndex,
                hit,
                baseScore,
                scoringMode: normalized,
              });
              const result = applyCricketThrowsToState({
                gameMode,
                targetOrder,
                playerIndex,
                playerCount,
                scoringMode: input,
                baseMarksByLabel: createMarksByLabel(
                  targetOrder,
                  playerCount,
                  label,
                  marks
                ),
                throws: [{ segment: { name: segmentName } }],
              });
              const context = `${gameMode} ${label} ${segmentName}, players=${playerCount}, active=${playerIndex}, marks=${marks.join("/")}, mode=${input}`;

              assert.deepEqual(result.nextMarksByLabel[label], expected.nextMarks, `${context}: marks`);
              assert.deepEqual(
                result.scoreDeltaByPlayer,
                expected.scoreDeltaByPlayer,
                `${context}: score deltas`
              );
              assert.equal(result.scoringModeNormalized, normalized, `${context}: mode`);
              assert.deepEqual(
                result.scoringEvents,
                expected.createsScoringEvent
                  ? [
                      buildExpectedScoringEvent({
                        targetLabel: label,
                        hit,
                        playerIndex,
                        baseScore,
                        expected,
                      }),
                    ]
                  : [],
                `${context}: scoring event`
              );
            });
          });
        });
      }
    }
  });
});

test("all official Cricket and Autodarts Tactics targets use face value and Bull uses 25", () => {
  [...new Set([...CRICKET_TARGET_ORDER, ...TACTICS_TARGET_ORDER])].forEach((label) => {
    assert.equal(
      getCricketTargetBaseScore(label),
      label === "BULL" ? 25 : Number(label),
      label
    );
  });
});

function createClosureMarks(targetOrder, closedByPlayer) {
  return Object.fromEntries(
    targetOrder.map((label) => [label, closedByPlayer.map((closed) => (closed ? 3 : 2))])
  );
}

function expectedWinFlags(scoringMode, score, highestScore, lowestScore, allTargetsClosed) {
  if (scoringMode === "standard") {
    const leading = score === highestScore;
    return { leading, winner: allTargetsClosed && leading };
  }
  if (scoringMode === "cutthroat") {
    const leading = score === lowestScore;
    return { leading, winner: allTargetsClosed && leading };
  }
  return { leading: allTargetsClosed, winner: allTargetsClosed };
}

test("Cricket and Autodarts Tactics winner states match closure and score rules exhaustively", () => {
  const modeCases = [
    { input: "standard", normalized: "standard" },
    { input: "cut-throat", normalized: "cutthroat" },
    { input: "no-score", normalized: "neutral" },
  ];
  const gameCases = [
    { gameMode: "Cricket", targetOrder: CRICKET_TARGET_ORDER },
    { gameMode: "Tactics", targetOrder: TACTICS_TARGET_ORDER },
  ];

  gameCases.forEach(({ gameMode, targetOrder }) => {
    for (let playerCount = 2; playerCount <= 4; playerCount += 1) {
      const closureVectors = enumerateVectors(playerCount, [false, true]);
      const scoreVectors = enumerateVectors(playerCount, [0, 20, 40]);

      closureVectors.forEach((closedByPlayer) => {
        scoreVectors.forEach((scoresByPlayer) => {
          const highestScore = Math.max(...scoresByPlayer);
          const lowestScore = Math.min(...scoresByPlayer);

          modeCases.forEach(({ input, normalized }) => {
            const result = evaluateCricketWinState({
              gameMode,
              targetOrder,
              marksByLabel: createClosureMarks(targetOrder, closedByPlayer),
              scoresByPlayer,
              scoringMode: input,
            });
            const expectedPlayers = closedByPlayer.map((allTargetsClosed, playerIndex) => ({
              playerIndex,
              score: scoresByPlayer[playerIndex],
              closedTargetCount: allTargetsClosed ? targetOrder.length : 0,
              remainingTargets: allTargetsClosed ? 0 : targetOrder.length,
              allTargetsClosed,
              ...expectedWinFlags(
                normalized,
                scoresByPlayer[playerIndex],
                highestScore,
                lowestScore,
                allTargetsClosed
              ),
            }));
            const winnerIndexes = expectedPlayers
              .filter(({ winner }) => winner)
              .map(({ playerIndex }) => playerIndex);
            const context = `${gameMode}, players=${playerCount}, closed=${closedByPlayer.join("/")}, scores=${scoresByPlayer.join("/")}, mode=${input}`;

            assert.deepEqual(result.targetOrder, targetOrder, `${context}: targets`);
            assert.equal(result.scoringModeNormalized, normalized, `${context}: mode`);
            assert.equal(result.highestScore, highestScore, `${context}: highest`);
            assert.equal(result.lowestScore, lowestScore, `${context}: lowest`);
            assert.deepEqual(result.playerStates, expectedPlayers, `${context}: player states`);
            assert.deepEqual(result.winnerIndexes, winnerIndexes, `${context}: winners`);
            assert.equal(result.hasWinner, winnerIndexes.length > 0, `${context}: has winner`);
            assert.equal(result.isTie, winnerIndexes.length > 1, `${context}: snapshot tie`);
          });
        });
      });
    }
  });
});

function createEmptyOfficialCricketState(playerCount) {
  return {
    marksByLabel: createMarksByLabel(CRICKET_TARGET_ORDER, playerCount),
    scoresByPlayer: Array.from({ length: playerCount }, () => 0),
  };
}

function applyOfficialCricketBatch(state, playerIndex, scoringMode, throws) {
  const result = applyCricketThrowsToState({
    gameMode: "Cricket",
    targetOrder: CRICKET_TARGET_ORDER,
    playerIndex,
    playerCount: state.scoresByPlayer.length,
    scoringMode,
    baseMarksByLabel: state.marksByLabel,
    throws: throws.map((name) => ({ segment: { name } })),
  });

  return {
    marksByLabel: result.nextMarksByLabel,
    scoresByPlayer: state.scoresByPlayer.map(
      (score, index) => score + result.scoreDeltaByPlayer[index]
    ),
  };
}

function closeEveryCricketTargetForPlayer(state, playerIndex, scoringMode) {
  return CRICKET_TARGET_ORDER.reduce((currentState, label) => {
    const throws = label === "BULL" ? ["BULL", "S25"] : [`T${label}`];
    return applyOfficialCricketBatch(currentState, playerIndex, scoringMode, throws);
  }, state);
}

test("sequential standard and Cut-Throat transitions produce rule-valid winners", () => {
  [
    { scoringMode: "standard", expectedScores: [60, 0] },
    { scoringMode: "cut-throat", expectedScores: [0, 60] },
  ].forEach(({ scoringMode, expectedScores }) => {
    let state = createEmptyOfficialCricketState(2);
    state = applyOfficialCricketBatch(state, 0, scoringMode, ["T20"]);
    state = applyOfficialCricketBatch(state, 0, scoringMode, ["T20"]);
    state = CRICKET_TARGET_ORDER.slice(1).reduce((currentState, label) => {
      const throws = label === "BULL" ? ["BULL", "S25"] : [`T${label}`];
      return applyOfficialCricketBatch(currentState, 0, scoringMode, throws);
    }, state);

    assert.deepEqual(state.scoresByPlayer, expectedScores, `${scoringMode}: scores`);
    const winState = evaluateCricketWinState({
      gameMode: "Cricket",
      targetOrder: CRICKET_TARGET_ORDER,
      marksByLabel: state.marksByLabel,
      scoresByPlayer: state.scoresByPlayer,
      scoringMode,
    });
    assert.deepEqual(winState.winnerIndexes, [0], `${scoringMode}: winner`);
  });

  const neutralState = closeEveryCricketTargetForPlayer(
    createEmptyOfficialCricketState(2),
    0,
    "no-score"
  );
  const neutralWinState = evaluateCricketWinState({
    gameMode: "Cricket",
    targetOrder: CRICKET_TARGET_ORDER,
    marksByLabel: neutralState.marksByLabel,
    scoresByPlayer: [0, 999],
    scoringMode: "no-score",
  });
  assert.deepEqual(neutralWinState.winnerIndexes, [0]);
});
