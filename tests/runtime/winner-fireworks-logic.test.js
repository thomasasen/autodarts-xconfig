import test from "node:test";
import assert from "node:assert/strict";

import { createDomGuards } from "../../src/core/dom-guards.js";
import {
  createWinnerFireworksState,
  startWinnerFireworks,
  stopWinnerFireworks,
} from "../../src/features/winner-fireworks/logic.js";
import { resolveWinnerVisualConfig } from "../../src/features/winner-fireworks/style.js";
import { FakeDocument, createFakeWindow } from "./fake-dom.js";

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
