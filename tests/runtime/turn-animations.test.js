import test from "node:test";
import assert from "node:assert/strict";

import { animateArrowNode } from "../../src/features/avg-trend-arrow/logic.js";
import { ANIMATE_CLASS } from "../../src/features/avg-trend-arrow/style.js";
import { runActivePlayerSweep } from "../../src/features/active-player-sweep/logic.js";
import { SWEEP_CLASS } from "../../src/features/active-player-sweep/style.js";
import { FakeDocument, createFakeWindow } from "./fake-dom.js";

function wait(ms = 0) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createImmediateWindow(documentRef) {
  const windowRef = createFakeWindow({ documentRef });
  const nativeSetTimeout = setTimeout;
  windowRef.setTimeout = (callback, _ms, ...args) => nativeSetTimeout(callback, 0, ...args);
  windowRef.clearTimeout = (handle) => clearTimeout(handle);
  return windowRef;
}

test("animateArrowNode retriggers the animation class on fake-dom nodes without offsetWidth", async () => {
  const documentRef = new FakeDocument();
  const arrowNode = documentRef.createElement("span");
  const timeoutByArrow = new Map();

  animateArrowNode(arrowNode, 320, timeoutByArrow);

  assert.equal(arrowNode.classList.contains(ANIMATE_CLASS), true);
  assert.equal(timeoutByArrow.has(arrowNode), true);
  clearTimeout(timeoutByArrow.get(arrowNode));
});

test("runActivePlayerSweep retriggers and clears the sweep class on fake-dom nodes without offsetWidth", async () => {
  const documentRef = new FakeDocument();
  const windowRef = createImmediateWindow(documentRef);
  const node = documentRef.createElement("div");
  const state = {
    nodes: new Set(),
    timeoutsByNode: new Map(),
  };

  runActivePlayerSweep(node, state, { durationMs: 420, sweepDelayMs: 0 }, windowRef);

  assert.equal(node.classList.contains(SWEEP_CLASS), true);
  assert.equal(state.nodes.has(node), true);
  assert.equal(state.timeoutsByNode.has(node), true);

  await wait(10);

  assert.equal(node.classList.contains(SWEEP_CLASS), false);
  assert.equal(state.nodes.has(node), false);
  assert.equal(state.timeoutsByNode.has(node), false);
});
