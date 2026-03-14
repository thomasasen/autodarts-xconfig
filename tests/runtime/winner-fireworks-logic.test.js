import test from "node:test";
import assert from "node:assert/strict";

import { createDomGuards } from "../../src/core/dom-guards.js";
import {
  createWinnerFireworksState,
  getWinnerSignal,
  startWinnerFireworks,
  stopWinnerFireworks,
} from "../../src/features/winner-fireworks/logic.js";
import { resolveWinnerVisualConfig } from "../../src/features/winner-fireworks/style.js";
import { FakeDocument, createFakeWindow } from "./fake-dom.js";

test("winner signal ignores non-terminal numeric winner placeholders", () => {
  const documentRef = new FakeDocument();
  const signal = getWinnerSignal({
    documentRef,
    visualConfig: { includeBullOut: true },
    gameState: {
      getSnapshot: () => ({
        match: {
          winner: 0,
          players: [{ id: "player-1" }, { id: "player-2" }],
          status: "running",
        },
      }),
      getVariant: () => "Cricket",
    },
  });

  assert.equal(signal.domWinnerVisible, false);
  assert.equal(signal.stateWinnerVisible, false);
  assert.equal(signal.active, false);
});

test("winner signal activates for terminal state winners", () => {
  const documentRef = new FakeDocument();
  const signal = getWinnerSignal({
    documentRef,
    visualConfig: { includeBullOut: true },
    gameState: {
      getSnapshot: () => ({
        match: {
          winner: 0,
          players: [{ id: "player-1" }, { id: "player-2" }],
          finishedAt: "2026-03-15T00:23:48.000Z",
        },
      }),
      getVariant: () => "Cricket",
    },
  });

  assert.equal(signal.stateWinnerVisible, true);
  assert.equal(signal.active, true);
});

test("winner signal uses player-winner class but ignores legacy animation class alone", () => {
  const documentRef = new FakeDocument();
  const legacyNode = documentRef.createElement("div");
  legacyNode.classList.add("ad-ext_winner-animation");
  documentRef.main.appendChild(legacyNode);

  const legacyOnlySignal = getWinnerSignal({
    documentRef,
    visualConfig: { includeBullOut: true },
    gameState: {
      getSnapshot: () => ({ match: { players: [{ id: "player-1" }, { id: "player-2" }] } }),
      getVariant: () => "Cricket",
    },
  });

  assert.equal(legacyOnlySignal.domLegacyWinnerAnimationVisible, true);
  assert.equal(legacyOnlySignal.domWinnerVisible, false);
  assert.equal(legacyOnlySignal.active, false);

  documentRef.winnerNode.classList.add("ad-ext-player-winner");
  const playerWinnerSignal = getWinnerSignal({
    documentRef,
    visualConfig: { includeBullOut: true },
    gameState: {
      getSnapshot: () => ({ match: { players: [{ id: "player-1" }, { id: "player-2" }] } }),
      getVariant: () => "Cricket",
    },
  });

  assert.equal(playerWinnerSignal.domPlayerWinnerVisible, true);
  assert.equal(playerWinnerSignal.domWinnerVisible, true);
  assert.equal(playerWinnerSignal.active, true);
});

test("winner fireworks sides style emits inward bursts with launch velocity", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  const domGuards = createDomGuards({ documentRef });
  const bursts = [];

  const confettiRunner = (payload = {}) => {
    bursts.push(payload);
  };
  confettiRunner.reset = () => {};

  const state = createWinnerFireworksState({
    documentRef,
    windowRef,
    domGuards,
    visualConfig: resolveWinnerVisualConfig({
      style: "sides",
      colorTheme: "autodarts",
      intensity: "standard",
    }),
    confettiFactory: confettiRunner,
  });

  try {
    startWinnerFireworks(state);

    assert.equal(state.running, true);
    assert.equal(bursts.length, 2);

    const [leftBurst, rightBurst] = bursts;

    assert.equal(leftBurst.angle, 32);
    assert.equal(rightBurst.angle, 148);
    assert.equal(leftBurst.startVelocity, 46);
    assert.equal(rightBurst.startVelocity, 46);
    assert.equal(leftBurst.particleCount, 3);
    assert.equal(rightBurst.particleCount, 3);
    assert.deepEqual(leftBurst.origin, { x: 0.01, y: 0.78 });
    assert.deepEqual(rightBurst.origin, { x: 0.99, y: 0.78 });
  } finally {
    stopWinnerFireworks(state);
  }
});
