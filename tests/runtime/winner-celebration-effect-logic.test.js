import test from "node:test";
import assert from "node:assert/strict";

import { createDomGuards } from "../../src/core/dom-guards.js";
import {
  createWinnerCelebrationEffectState,
  getWinnerSignal,
  startWinnerCelebrationEffect,
  stopWinnerCelebrationEffect,
} from "../../src/features/winner-celebration-effect/logic.js";
import { resolveWinnerVisualConfig } from "../../src/features/winner-celebration-effect/style.js";
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

  const state = createWinnerCelebrationEffectState({
    documentRef,
    windowRef,
    domGuards,
    visualConfig: resolveWinnerVisualConfig({
      style: "sides",
      colorTheme: "autodarts",
      intensity: "standard",
      particleAmount: "voll",
    }),
    confettiFactory: confettiRunner,
  });

  try {
    startWinnerCelebrationEffect(state);

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
    stopWinnerCelebrationEffect(state);
  }
});

test("winner fireworks creates canvas confetti with worker support", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  const domGuards = createDomGuards({ documentRef });
  const createCalls = [];
  const bursts = [];
  const confettiFactory = () => {};
  const confettiRunner = (payload = {}) => {
    bursts.push(payload);
  };
  confettiRunner.reset = () => {};
  confettiFactory.create = (canvasNode, options) => {
    createCalls.push({ canvasNode, options });
    return confettiRunner;
  };

  const state = createWinnerCelebrationEffectState({
    documentRef,
    windowRef,
    domGuards,
    visualConfig: resolveWinnerVisualConfig({
      style: "sides",
      colorTheme: "autodarts",
      intensity: "standard",
      particleAmount: "voll",
    }),
    confettiFactory,
  });

  try {
    startWinnerCelebrationEffect(state);

    assert.equal(state.running, true);
    assert.equal(createCalls.length, 1);
    assert.equal(createCalls[0].canvasNode.tagName, "CANVAS");
    assert.deepEqual(createCalls[0].options, { resize: true, useWorker: true });
    assert.equal(bursts.length, 2);
  } finally {
    stopWinnerCelebrationEffect(state);
  }
});

test("winner fireworks auto-stops after configured duration and dismisses current win", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  const domGuards = createDomGuards({ documentRef });
  const intervals = [];
  const timeouts = [];
  const clearedIntervals = [];
  let resetCount = 0;

  windowRef.setInterval = (callback, delayMs) => {
    const handle = { callback, delayMs };
    intervals.push(handle);
    return handle;
  };
  windowRef.clearInterval = (handle) => {
    clearedIntervals.push(handle);
  };
  windowRef.setTimeout = (callback, delayMs) => {
    const handle = { callback, delayMs };
    timeouts.push(handle);
    return handle;
  };
  windowRef.clearTimeout = () => {};

  const confettiRunner = () => {};
  confettiRunner.reset = () => {
    resetCount += 1;
  };

  const state = createWinnerCelebrationEffectState({
    documentRef,
    windowRef,
    domGuards,
    visualConfig: resolveWinnerVisualConfig({
      style: "sides",
      colorTheme: "autodarts",
      intensity: "standard",
      durationSeconds: 1,
      particleAmount: "sparsam",
    }),
    confettiFactory: confettiRunner,
  });

  startWinnerCelebrationEffect(state);

  assert.equal(state.running, true);
  assert.equal(intervals.length, 1);
  assert.equal(timeouts.length, 1);
  assert.equal(timeouts[0].delayMs, 1000);

  timeouts[0].callback();

  assert.equal(state.running, false);
  assert.equal(state.dismissedForCurrentWin, true);
  assert.equal(state.timeoutHandles.size, 0);
  assert.equal(clearedIntervals.includes(intervals[0]), true);
  assert.equal(resetCount, 1);
  assert.equal(documentRef.getElementById("ad-ext-winner-celebration-effect"), null);
});

test("winner fireworks particle amount scales emitted particle counts", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  const domGuards = createDomGuards({ documentRef });
  const bursts = [];
  const confettiRunner = (payload = {}) => {
    bursts.push(payload);
  };
  confettiRunner.reset = () => {};

  const state = createWinnerCelebrationEffectState({
    documentRef,
    windowRef,
    domGuards,
    visualConfig: resolveWinnerVisualConfig({
      style: "sides",
      colorTheme: "autodarts",
      intensity: "standard",
      durationSeconds: 1,
      particleAmount: "optimiert",
    }),
    confettiFactory: confettiRunner,
  });

  try {
    startWinnerCelebrationEffect(state);

    assert.equal(bursts.length, 2);
    assert.equal(bursts[0].particleCount, 2);
    assert.equal(bursts[1].particleCount, 2);
  } finally {
    stopWinnerCelebrationEffect(state);
  }
});
