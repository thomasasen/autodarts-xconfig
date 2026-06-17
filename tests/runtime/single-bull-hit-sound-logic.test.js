import test from "node:test";
import assert from "node:assert/strict";

import {
  playSingleBullHitSoundPreview,
  updateSingleBullHitSound,
} from "../../src/features/single-bull-hit-sound/logic.js";
import * as x01Rules from "../../src/domain/x01-rules.js";
import { FakeDocument } from "./fake-dom.js";

function createAudioState(playCalls, audioOverrides = {}) {
  const audio = {
    volume: 1,
    currentTime: 0,
    play() {
      playCalls.push(Date.now());
      return Promise.resolve();
    },
    pause() {},
    ...audioOverrides,
  };

  return {
    windowRef: null,
    audio,
    audioUnlocked: true,
    lastProcessedTurnId: "",
    lastSignalPlayedAt: 0,
    lastTextByNode: new Map(),
    lastPlayedAtByNode: new Map(),
    processedThrowKeys: new Set(),
    pollIntervalHandle: 0,
  };
}

function flushMicrotasks() {
  return Promise.resolve();
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

function appendExternalThrowPlaceholder(documentRef, parentId = "", text = "") {
  const parent = documentRef.createElement("div");
  if (parentId) {
    parent.id = parentId;
  }

  const row = documentRef.createElement("div");
  row.classList.add("ad-ext-turn-throw");
  const textNode = documentRef.createElement("p");
  textNode.classList.add("chakra-text");
  textNode.textContent = String(text || "");
  row.appendChild(textNode);
  parent.appendChild(row);
  documentRef.main.appendChild(parent);

  return {
    parent,
    row,
    textNode,
  };
}

test("single-bull-hit-sound preview plays the sound asset at the configured volume", async () => {
  const audioInstances = [];
  const windowRef = {
    Audio: class FakePreviewAudio {
      constructor(src) {
        this.src = src;
        this.volume = 0;
        this.currentTime = -1;
        this.playCalls = 0;
        audioInstances.push(this);
      }

      play() {
        this.playCalls += 1;
        return Promise.resolve();
      }
    },
  };

  const result = await playSingleBullHitSoundPreview({
    windowRef,
    config: {
      volume: 0.75,
    },
  });

  assert.equal(result.ok, true);
  assert.equal(result.volume, 0.75);
  assert.equal(audioInstances.length, 1);
  assert.match(audioInstances[0].src, /singlebull\.mp3$/);
  assert.equal(audioInstances[0].volume, 0.75);
  assert.equal(audioInstances[0].currentTime, 0);
  assert.equal(audioInstances[0].playCalls, 1);
});

function appendSplitThrowRow(documentRef, scoreText = "", segmentText = "") {
  const row = documentRef.createElement("div");
  row.classList.add("ad-ext-turn-throw");

  const scoreNode = documentRef.createElement("p");
  scoreNode.classList.add("chakra-text");
  scoreNode.textContent = String(scoreText || "");

  const segmentNode = documentRef.createElement("p");
  segmentNode.classList.add("chakra-text");
  segmentNode.textContent = String(segmentText || "");

  row.appendChild(scoreNode);
  row.appendChild(segmentNode);
  documentRef.turnContainer.appendChild(row);

  return {
    row,
    scoreNode,
    segmentNode,
  };
}

test("single-bull-hit-sound does not replay the same hit when DOM and gameState report it in separate updates", () => {
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
    updateSingleBullHitSound({
      documentRef,
      gameState: createGameState(activeTurn, []),
      x01Rules,
      state,
      config,
    });
    assert.equal(playCalls.length, 1);

    fakeNow = 1_400;
    updateSingleBullHitSound({
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

test("single-bull-hit-sound does not replay when score and segment nodes of the same throw update separately", () => {
  const documentRef = new FakeDocument();
  documentRef.throwRow.remove();

  const splitRow = appendSplitThrowRow(documentRef, "25", "");

  const playCalls = [];
  const state = createAudioState(playCalls);
  const config = {
    volume: 0.9,
    cooldownMs: 700,
  };
  const activeTurn = {
    id: "turn-split-dom",
    round: 4,
    turn: 1,
    playerId: "player-1",
  };

  const originalDateNow = Date.now;
  let fakeNow = 4_000;
  Date.now = () => fakeNow;

  try {
    updateSingleBullHitSound({
      documentRef,
      gameState: createGameState(activeTurn, []),
      x01Rules,
      state,
      config,
    });
    assert.equal(playCalls.length, 1);

    splitRow.segmentNode.textContent = "S25";
    fakeNow = 4_350;
    updateSingleBullHitSound({
      documentRef,
      gameState: createGameState(activeTurn, []),
      x01Rules,
      state,
      config,
    });
    assert.equal(playCalls.length, 1);
  } finally {
    Date.now = originalDateNow;
  }
});

test("single-bull-hit-sound still plays for the next throw index in the same turn", () => {
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
    updateSingleBullHitSound({
      documentRef,
      gameState: createGameState(activeTurn, []),
      x01Rules,
      state,
      config,
    });
    assert.equal(playCalls.length, 1);

    appendThrowRow(documentRef, "S25");
    fakeNow = 2_900;
    updateSingleBullHitSound({
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

test("single-bull-hit-sound ignores empty center zoom placeholder rows outside #ad-ext-turn", async () => {
  const documentRef = new FakeDocument();
  documentRef.throwTextElement.textContent = "S25";

  appendExternalThrowPlaceholder(documentRef, "autodarts-tools-zoom-center");
  appendExternalThrowPlaceholder(documentRef, "autodarts-tools-zoom-center");
  appendExternalThrowPlaceholder(documentRef, "autodarts-tools-zoom-center");

  const playCalls = [];
  const state = createAudioState(playCalls);
  const config = {
    volume: 0.9,
    cooldownMs: 700,
  };
  const activeTurn = {
    id: "turn-center-placeholders",
    round: 2,
    turn: 1,
    playerId: "player-1",
  };

  const originalDateNow = Date.now;
  let fakeNow = 5_000;
  Date.now = () => fakeNow;

  try {
    updateSingleBullHitSound({
      documentRef,
      gameState: createGameState(activeTurn, []),
      x01Rules,
      state,
      config,
    });
    await flushMicrotasks();
    assert.equal(playCalls.length, 1);

    fakeNow = 5_350;
    updateSingleBullHitSound({
      documentRef,
      gameState: createGameState(activeTurn, []),
      x01Rules,
      state,
      config,
    });
    await flushMicrotasks();
    assert.equal(playCalls.length, 1);
  } finally {
    Date.now = originalDateNow;
  }
});

test("single-bull-hit-sound plays again for the same slot after the next turn resets the row text", () => {
  const documentRef = new FakeDocument();
  documentRef.throwTextElement.textContent = "S25";

  const playCalls = [];
  const state = createAudioState(playCalls);
  const config = {
    volume: 0.9,
    cooldownMs: 700,
  };
  const firstTurn = {
    id: "turn-reset-1",
    round: 5,
    turn: 1,
    playerId: "player-1",
  };
  const secondTurn = {
    id: "turn-reset-2",
    round: 5,
    turn: 2,
    playerId: "player-1",
  };

  const originalDateNow = Date.now;
  let fakeNow = 5_000;
  Date.now = () => fakeNow;

  try {
    updateSingleBullHitSound({
      documentRef,
      gameState: createGameState(firstTurn, []),
      x01Rules,
      state,
      config,
    });
    assert.equal(playCalls.length, 1);

    documentRef.throwTextElement.textContent = "";
    fakeNow = 5_900;
    updateSingleBullHitSound({
      documentRef,
      gameState: createGameState(secondTurn, []),
      x01Rules,
      state,
      config,
    });

    documentRef.throwTextElement.textContent = "S25";
    fakeNow = 6_800;
    updateSingleBullHitSound({
      documentRef,
      gameState: createGameState(secondTurn, []),
      x01Rules,
      state,
      config,
    });
    assert.equal(playCalls.length, 2);
  } finally {
    Date.now = originalDateNow;
  }
});

test("single-bull-hit-sound retries the same DOM row after autoplay blocked the first attempt", async () => {
  const documentRef = new FakeDocument();
  documentRef.throwTextElement.textContent = "S25";

  const playCalls = [];
  let blockedOnce = true;
  const state = createAudioState(playCalls, {
    play() {
      playCalls.push(Date.now());
      if (blockedOnce) {
        blockedOnce = false;
        return Promise.reject(new Error("autoplay blocked"));
      }
      return Promise.resolve();
    },
  });
  const config = {
    volume: 0.9,
    cooldownMs: 700,
  };
  const activeTurn = {
    id: "turn-autoplay-retry",
    round: 6,
    turn: 1,
    playerId: "player-1",
  };

  const originalDateNow = Date.now;
  let fakeNow = 7_000;
  Date.now = () => fakeNow;

  try {
    updateSingleBullHitSound({
      documentRef,
      gameState: createGameState(activeTurn, []),
      x01Rules,
      state,
      config,
    });
    assert.equal(playCalls.length, 1);

    await flushMicrotasks();
    assert.equal(state.processedThrowKeys.size, 0);

    fakeNow = 7_500;
    updateSingleBullHitSound({
      documentRef,
      gameState: createGameState(activeTurn, []),
      x01Rules,
      state,
      config,
    });
    assert.equal(playCalls.length, 2);
    assert.equal(state.processedThrowKeys.size, 1);
  } finally {
    Date.now = originalDateNow;
  }
});

test("single-bull-hit-sound plays from gameState when no DOM single-bull text is present", () => {
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
    updateSingleBullHitSound({
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
