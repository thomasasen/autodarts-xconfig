import test from "node:test";
import assert from "node:assert/strict";

import { createDomGuards } from "../../src/core/dom-guards.js";
import { createListenerRegistry } from "../../src/core/listener-registry.js";
import { createObserverRegistry } from "../../src/core/observer-registry.js";
import * as x01Rules from "../../src/domain/x01-rules.js";
import { initializeTvBoardZoom } from "../../src/features/tv-board-zoom/index.js";
import { ZOOM_CLASS, ZOOM_HOST_CLASS } from "../../src/features/tv-board-zoom/style.js";
import { createRafScheduler } from "../../src/shared/raf-scheduler.js";
import { FakeDocument, createFakeWindow } from "./fake-dom.js";

function wait(ms = 0) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createMutableX01GameState(initial = {}) {
  const state = {
    turnId: String(initial.turnId || "turn-1"),
    playerId: String(initial.playerId || "player-1"),
    activeScore: Number.isFinite(initial.activeScore) ? Number(initial.activeScore) : 40,
    throws: Array.isArray(initial.throws) ? initial.throws : [],
    outMode: String(initial.outMode || "Double Out"),
  };
  const subscribers = new Set();

  return {
    state,
    api: {
      isX01Variant() {
        return true;
      },
      getOutMode() {
        return state.outMode;
      },
      getActiveTurn() {
        return {
          id: state.turnId,
          playerId: state.playerId,
          throws: state.throws,
        };
      },
      getActiveThrows() {
        return state.throws;
      },
      getActiveScore() {
        return state.activeScore;
      },
      subscribe(listener) {
        if (typeof listener !== "function") {
          return () => {};
        }
        subscribers.add(listener);
        return () => {
          subscribers.delete(listener);
        };
      },
    },
    notify() {
      subscribers.forEach((listener) => listener());
    },
  };
}

function installZoomFixture(documentRef) {
  const offsetParent = documentRef.createElement("div");
  offsetParent.__rect = { left: 0, top: 0, width: 1920, height: 1080 };
  documentRef.main.appendChild(offsetParent);

  const hostNode = documentRef.createElement("div");
  hostNode.classList.add("ad-ext-theme-board-viewport");
  hostNode.__rect = { left: 980, top: 40, width: 520, height: 900 };

  const targetNode = documentRef.createElement("div");
  targetNode.classList.add("showAnimations");
  targetNode.__rect = { left: 860, top: 10, width: 820, height: 1060 };
  targetNode.offsetLeft = 860;
  targetNode.offsetTop = 10;
  targetNode.offsetWidth = 820;
  targetNode.offsetHeight = 1060;
  targetNode.offsetParent = offsetParent;

  const boardSvg = documentRef.createElementNS("http://www.w3.org/2000/svg", "svg");
  boardSvg.setAttribute("viewBox", "0 0 1000 1000");
  boardSvg.__rect = { left: 980, top: 120, width: 520, height: 520 };

  const outerCircle = documentRef.createElementNS("http://www.w3.org/2000/svg", "circle");
  outerCircle.setAttribute("r", "380");
  boardSvg.appendChild(outerCircle);

  const numberLabel = documentRef.createElementNS("http://www.w3.org/2000/svg", "text");
  numberLabel.textContent = "20";
  boardSvg.appendChild(numberLabel);

  targetNode.appendChild(boardSvg);
  hostNode.appendChild(targetNode);
  offsetParent.appendChild(hostNode);

  return {
    hostNode,
    targetNode,
    boardSvg,
  };
}

function startTvBoardZoom({ documentRef, windowRef, gameState }) {
  return initializeTvBoardZoom({
    documentRef,
    windowRef,
    domGuards: createDomGuards({ documentRef }),
    registries: {
      observers: createObserverRegistry(),
      listeners: createListenerRegistry(),
    },
    gameState,
    domain: { x01Rules },
    config: {
      getFeatureConfig() {
        return {
          zoomLevel: 2.75,
          zoomSpeed: "schnell",
          checkoutZoomEnabled: true,
        };
      },
    },
    helpers: { createRafScheduler },
  });
}

test("tv-board-zoom keeps active zoom during a short missing-board gap", async () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  const gameState = createMutableX01GameState({
    activeScore: 40,
    throws: [],
  });
  const { hostNode, targetNode, boardSvg } = installZoomFixture(documentRef);

  const cleanup = startTvBoardZoom({
    documentRef,
    windowRef,
    gameState: gameState.api,
  });

  try {
    await wait(25);
    assert.equal(targetNode.classList.contains(ZOOM_CLASS), true);
    assert.equal(hostNode.classList.contains(ZOOM_HOST_CLASS), true);
    assert.match(String(targetNode.style.transform || ""), /scale\(/);

    boardSvg.remove();
    documentRef.flushMutations([{ target: targetNode, addedNodes: [], removedNodes: [boardSvg] }]);
    gameState.notify();
    await wait(35);

    assert.equal(targetNode.classList.contains(ZOOM_CLASS), true);
    assert.equal(hostNode.classList.contains(ZOOM_HOST_CLASS), true);
    assert.match(String(targetNode.style.transform || ""), /scale\(/);

    targetNode.appendChild(boardSvg);
    documentRef.flushMutations([{ target: targetNode, addedNodes: [boardSvg], removedNodes: [] }]);
    gameState.notify();
    await wait(35);

    assert.equal(targetNode.classList.contains(ZOOM_CLASS), true);
    assert.equal(hostNode.classList.contains(ZOOM_HOST_CLASS), true);
    assert.match(String(targetNode.style.transform || ""), /scale\(/);
  } finally {
    cleanup();
  }
});

test("tv-board-zoom resets after board stays missing beyond transient grace", async () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  const gameState = createMutableX01GameState({
    activeScore: 40,
    throws: [],
  });
  const { hostNode, targetNode, boardSvg } = installZoomFixture(documentRef);

  const cleanup = startTvBoardZoom({
    documentRef,
    windowRef,
    gameState: gameState.api,
  });

  try {
    await wait(25);
    assert.equal(targetNode.classList.contains(ZOOM_CLASS), true);

    boardSvg.remove();
    documentRef.flushMutations([{ target: targetNode, addedNodes: [], removedNodes: [boardSvg] }]);
    gameState.notify();

    await wait(700);
    assert.equal(targetNode.classList.contains(ZOOM_CLASS), false);
    assert.equal(hostNode.classList.contains(ZOOM_HOST_CLASS), false);
  } finally {
    cleanup();
  }
});

test("tv-board-zoom keeps immediate correction zoom-out behavior with manual pause", async () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  const gameState = createMutableX01GameState({
    activeScore: 121,
    throws: [{ segment: { name: "T20" } }, { segment: { name: "T20" } }],
  });
  const { targetNode } = installZoomFixture(documentRef);

  const cleanup = startTvBoardZoom({
    documentRef,
    windowRef,
    gameState: gameState.api,
  });

  try {
    await wait(25);
    assert.match(String(targetNode.style.transform || ""), /scale\(/);

    gameState.state.activeScore = 181;
    gameState.state.throws = [{ segment: { name: "T20" } }];
    gameState.notify();
    await wait(35);

    assert.equal(String(targetNode.style.transform || ""), "");
  } finally {
    cleanup();
  }
});
