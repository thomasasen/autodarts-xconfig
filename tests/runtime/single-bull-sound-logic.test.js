import test from "node:test";
import assert from "node:assert/strict";

import { updateSingleBullSound } from "../../src/features/single-bull-sound/logic.js";
import * as x01Rules from "../../src/domain/x01-rules.js";
import { FakeDocument } from "./fake-dom.js";

function createAudioState(playCalls) {
  return {
    windowRef: null,
    audio: {
      volume: 1,
      currentTime: 0,
      play() {
        playCalls.push(Date.now());
        return Promise.resolve();
      },
      pause() {},
    },
    audioUnlocked: true,
    lastSignalPlayedAt: 0,
    lastTextByNode: new Map(),
    lastPlayedAtByNode: new Map(),
    processedThrowKeys: new Set(),
    pollIntervalHandle: 0,
  };
}

function createGameState(activeTurn, activeThrows) {
  return {
    getActiveTurn() {
      return activeTurn;
    },
    getActiveThrows() {
      return activeThrows;
    },
  };
}

function appendThrowRow(documentRef, text = "") {
  const row = documentRef.createElement("div");
  row.classList.add("ad-ext-turn-throw");
  const textNode = documentRef.createElement("p");
  textNode.classList.add("chakra-text");
  textNode.textContent = String(text || "");
  row.appendChild(textNode);
  documentRef.turnContainer.appendChild(row);
  return {
    row,
    textNode,
  };
}

test("single-bull-sound does not replay the same hit when DOM and gameState report it in separate updates", () => {
  const documentRef = new FakeDocument();
  documentRef.throwTextElement.textContent = "S25";

  const playCalls = [];
  const state = createAudioState(playCalls);
  const config = {
    volume: 0.9,
    cooldownMs: 700,
  };
  const activeTurn = {
    id: "turn-1",
    round: 1,
    turn: 1,
    playerId: "player-1",
  };

  const originalDateNow = Date.now;
  let fakeNow = 1_000;
  Date.now = () => fakeNow;

  try {
    updateSingleBullSound({
      documentRef,
      gameState: createGameState(activeTurn, []),
      x01Rules,
      state,
      config,
    });
    assert.equal(playCalls.length, 1);

    fakeNow = 1_400;
    updateSingleBullSound({
      documentRef,
      gameState: createGameState(activeTurn, [
        {
          id: "throw-1",
          segment: {
            name: "S25",
          },
          points: 25,
        },
      ]),
      x01Rules,
      state,
      config,
    });
    assert.equal(playCalls.length, 1);
  } finally {
    Date.now = originalDateNow;
  }
});

test("single-bull-sound still plays for the next throw index in the same turn", () => {
  const documentRef = new FakeDocument();
  documentRef.throwTextElement.textContent = "S25";

  const playCalls = [];
  const state = createAudioState(playCalls);
  const config = {
    volume: 0.9,
    cooldownMs: 700,
  };
  const activeTurn = {
    id: "turn-2",
    round: 1,
    turn: 2,
    playerId: "player-1",
  };

  const originalDateNow = Date.now;
  let fakeNow = 2_000;
  Date.now = () => fakeNow;

  try {
    updateSingleBullSound({
      documentRef,
      gameState: createGameState(activeTurn, []),
      x01Rules,
      state,
      config,
    });
    assert.equal(playCalls.length, 1);

    appendThrowRow(documentRef, "S25");
    fakeNow = 2_900;
    updateSingleBullSound({
      documentRef,
      gameState: createGameState(activeTurn, [
        {
          id: "throw-1",
          segment: {
            name: "S25",
          },
          points: 25,
        },
        {
          id: "throw-2",
          segment: {
            name: "S25",
          },
          points: 25,
        },
      ]),
      x01Rules,
      state,
      config,
    });
    assert.equal(playCalls.length, 2);
  } finally {
    Date.now = originalDateNow;
  }
});

test("single-bull-sound plays from gameState when no DOM single-bull text is present", () => {
  const documentRef = new FakeDocument();
  documentRef.throwTextElement.textContent = "T20";

  const playCalls = [];
  const state = createAudioState(playCalls);
  const config = {
    volume: 0.9,
    cooldownMs: 700,
  };
  const activeTurn = {
    id: "turn-3",
    round: 1,
    turn: 3,
    playerId: "player-1",
  };

  const originalDateNow = Date.now;
  Date.now = () => 3_000;

  try {
    updateSingleBullSound({
      documentRef,
      gameState: createGameState(activeTurn, [
        {
          id: "throw-1",
          segment: {
            name: "S25",
          },
          points: 25,
        },
      ]),
      x01Rules,
      state,
      config,
    });
    assert.equal(playCalls.length, 1);
  } finally {
    Date.now = originalDateNow;
  }
});
