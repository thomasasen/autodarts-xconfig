import test from "node:test";
import assert from "node:assert/strict";

import { createDomGuards } from "../../src/core/dom-guards.js";
import { createListenerRegistry } from "../../src/core/listener-registry.js";
import { createObserverRegistry } from "../../src/core/observer-registry.js";
import * as x01Rules from "../../src/domain/x01-rules.js";
import {
  initializeTvBoardZoom,
  resolveTvBoardZoomMutationReaction,
  shouldScheduleTvBoardZoomMutation,
} from "../../src/features/tv-board-zoom/index.js";
import { ZOOM_CLASS, ZOOM_HOST_CLASS } from "../../src/features/tv-board-zoom/style.js";
import { createRafScheduler } from "../../src/shared/raf-scheduler.js";
import { FakeDocument, createFakeTimerHarness, createFakeWindow } from "./fake-dom.js";
import { createModernX01Fixture } from "./modern-x01-fixture.js";

function createMutableX01GameState(initial = {}) {
  const state = {
    turnId: String(initial.turnId || "turn-1"),
    playerId: String(initial.playerId || "player-1"),
    activeScore: Number.isFinite(initial.activeScore) ? Number(initial.activeScore) : 40,
    throws: Array.isArray(initial.throws) ? initial.throws : [],
    outMode: String(initial.outMode || "Double Out"),
    snapshot: initial.snapshot || null,
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
      getSnapshot() {
        return state.snapshot;
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

function startTvBoardZoom({ documentRef, windowRef, gameState, featureConfig = {}, featureDebug = null }) {
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
          ...featureConfig,
        };
      },
    },
    featureDebug,
    helpers: { createRafScheduler },
  });
}

function startModernZoom(options = {}) {
  const fixture = createModernX01Fixture(options);
  const timers = createFakeTimerHarness();
  timers.installOnWindow(fixture.windowRef);
  timers.installGlobals();
  const events = [];
  const cleanup = startTvBoardZoom({ ...fixture,
    gameState: options.gameState || { isX01Variant: () => false },
    featureDebug: { enabled: true, log: (_summary, event) => events.push(event), warn: () => {} },
  });
  const tick = (node = fixture.total) => {
    fixture.documentRef.flushMutations([{ type: "childList", target: node, addedNodes: [], removedNodes: [] }]);
    timers.advance(25);
  };
  return { ...fixture, timers, events, tick, stop() { cleanup(); timers.restoreGlobals(); } };
}

test("native D18 zoom moves all four board layers together and restores clipping on cleanup", () => {
  const f = startModernZoom();
  try {
    f.timers.advance(25);
    assert.equal(f.documentRef.getElementById("ad-ext-turn"), null);
    assert.equal(f.events.find((event) => event.status === "apply")?.segment, "D18");
    assert.equal(f.board.classList.contains(ZOOM_CLASS), true);
    assert.equal(f.host.classList.contains(ZOOM_HOST_CLASS), true);
    assert.match(f.board.style.transform, /scale\(2\.750*\)/);
    f.layers.forEach((layer) => {
      assert.equal(layer.parentElement, f.board);
      assert.equal(layer.style.transform || "", "");
    });
    assert.equal(f.turn.style.transform || "", "");
    assert.equal(f.host.style.overflow, "hidden");
    const originalTransform = f.board.style.transform;
    f.tick();
    assert.equal(f.board.style.transform, originalTransform);
  } finally { f.stop(); }
  assert.equal(f.board.classList.contains(ZOOM_CLASS), false);
  assert.equal(f.board.style.transform || "", "");
  assert.equal(f.host.style.overflow || "", "");
});

test("native correction click pauses zoom until the next dart", () => {
  const f = startModernZoom();
  try {
    f.timers.advance(25);
    f.windowRef.dispatchEvent({ type: "pointerdown", target: f.rows[0].label });
    f.tick();
    f.timers.advance(260);
    assert.equal(f.board.classList.contains(ZOOM_CLASS), false);
    f.score.textContent = "61";
    f.setVisit(["T20"], ["25", "D18"]);
    f.tick();
    assert.equal(f.board.classList.contains(ZOOM_CLASS), false);
    f.score.textContent = "36";
    f.setVisit(["T20", "25"], ["D18"]);
    f.tick();
    assert.equal(f.board.classList.contains(ZOOM_CLASS), true);
  } finally { f.stop(); }
});

test("native Bust and leaving the match immediately remove active zoom", () => {
  for (const exit of ["bust", "variant", "leave"]) {
    const f = startModernZoom();
    try {
      f.timers.advance(25);
      if (exit === "bust") f.total.textContent = "BUST";
      if (exit === "variant") f.variant.textContent = "Bull-off";
      if (exit === "leave") {
        f.turn.remove();
        f.documentRef.flushMutations([{ type: "childList", target: f.documentRef.main,
          removedNodes: [f.turn], addedNodes: [] }]);
      } else f.tick(exit === "variant" ? f.variant : f.total);
      f.timers.advance(25);
      assert.equal(f.board.classList.contains(ZOOM_CLASS), false, exit);
      assert.equal(f.host.classList.contains(ZOOM_HOST_CLASS), false, exit);
    } finally { f.stop(); }
  }
});

test("native new player and new leg release a finished-checkout hold", () => {
  const f = startModernZoom();
  try {
    f.timers.advance(25);
    f.score.textContent = "0";
    f.setVisit(["T20", "25", "D18"], []);
    f.tick();
    assert.equal(f.board.classList.contains(ZOOM_CLASS), true);
    f.player.textContent = "Player 2";
    f.score.textContent = "301";
    f.setVisit([], []);
    f.tick();
    f.timers.advance(450);
    assert.equal(f.board.classList.contains(ZOOM_CLASS), false);
    f.score.textContent = "22";
    f.setVisit([], ["D11"]);
    f.tick();
    assert.equal(f.events.filter((event) => event.status === "apply").at(-1)?.segment, "D11");
  } finally { f.stop(); }
});

test("native board replacement rebinds the common target without touching sibling controls", () => {
  const f = startModernZoom();
  try {
    f.timers.advance(25);
    const replacement = f.board.cloneNode(true);
    replacement.classList.remove(ZOOM_CLASS);
    replacement.style.transform = "";
    replacement.__rect = { ...f.board.__rect };
    replacement.offsetWidth = replacement.offsetHeight = 549;
    replacement.offsetParent = f.host;
    f.board.remove();
    f.host.appendChild(replacement);
    f.documentRef.flushMutations([{ type: "childList", target: f.host,
      removedNodes: [f.board], addedNodes: [replacement] }]);
    f.timers.advance(25);
    assert.equal(f.board.classList.contains(ZOOM_CLASS), false);
    assert.equal(replacement.classList.contains(ZOOM_CLASS), true);
    assert.match(replacement.style.transform, /scale/);
    assert.equal(f.turn.style.transform || "", "");
  } finally { f.stop(); }
});

test("native missed third dart zoom expires without another DOM event", () => {
  const f = startModernZoom({ score: 181, throws: ["T20", "T20"], route: [] });
  try {
    f.timers.advance(25);
    assert.equal(f.events.find((event) => event.status === "apply")?.reason, "t20-setup");
    f.score.textContent = "180";
    f.setVisit(["T20", "T20", "1"], []);
    f.tick();
    assert.equal(f.board.classList.contains(ZOOM_CLASS), true);
    f.timers.advance(1800);
    assert.equal(f.board.classList.contains(ZOOM_CLASS), false);
  } finally { f.stop(); }
});

test("native late board mounting and a resize recover zoom without legacy DOM anchors", () => {
  const f = startModernZoom();
  try {
    f.host.remove();
    f.timers.advance(25);
    assert.equal(f.board.classList.contains(ZOOM_CLASS), false);
    const wrapper = f.node(f.documentRef.main, "div");
    wrapper.appendChild(f.host);
    f.documentRef.flushMutations([{ type: "childList", target: f.documentRef.main,
      addedNodes: [wrapper], removedNodes: [] }]);
    f.timers.advance(25);
    assert.equal(f.board.classList.contains(ZOOM_CLASS), true);
    const before = f.board.style.transform;
    f.host.__rect = f.board.__rect = { left: 500, top: 100, width: 400, height: 400 };
    f.layers.forEach((layer) => { layer.__rect = { ...f.board.__rect }; });
    f.board.offsetWidth = f.board.offsetHeight = 400;
    f.windowRef.dispatchEvent({ type: "resize" });
    f.timers.advance(25);
    assert.notEqual(f.board.style.transform, before);
    assert.equal(f.board.classList.contains(ZOOM_CLASS), true);
  } finally { f.stop(); }
});

test("tv-board-zoom keeps active zoom during a short missing-board gap", async () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  const timers = createFakeTimerHarness();
  timers.installOnWindow(windowRef);
  timers.installGlobals();
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
    timers.advance(25);
    assert.equal(targetNode.classList.contains(ZOOM_CLASS), true);
    assert.equal(hostNode.classList.contains(ZOOM_HOST_CLASS), true);
    assert.match(String(targetNode.style.transform || ""), /scale\(/);

    boardSvg.remove();
    documentRef.flushMutations([{ target: documentRef.main, addedNodes: [], removedNodes: [boardSvg] }]);
    gameState.notify();
    timers.advance(35);

    assert.equal(targetNode.classList.contains(ZOOM_CLASS), true);
    assert.equal(hostNode.classList.contains(ZOOM_HOST_CLASS), true);
    assert.match(String(targetNode.style.transform || ""), /scale\(/);

    targetNode.appendChild(boardSvg);
    documentRef.flushMutations([{ target: targetNode, addedNodes: [boardSvg], removedNodes: [] }]);
    gameState.notify();
    timers.advance(35);

    assert.equal(targetNode.classList.contains(ZOOM_CLASS), true);
    assert.equal(hostNode.classList.contains(ZOOM_HOST_CLASS), true);
    assert.match(String(targetNode.style.transform || ""), /scale\(/);
  } finally {
    cleanup();
    timers.restoreGlobals();
  }
});

test("tv-board-zoom applies a direct finish zoom at runtime for D5 in finish-only mode", async () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  const timers = createFakeTimerHarness();
  timers.installOnWindow(windowRef);
  timers.installGlobals();
  const logs = [];
  const gameState = createMutableX01GameState({
    activeScore: 10,
    throws: [],
  });
  const { hostNode, targetNode } = installZoomFixture(documentRef);

  const cleanup = startTvBoardZoom({
    documentRef,
    windowRef,
    gameState: gameState.api,
    featureConfig: {
      checkoutZoomTarget: "finish-only",
    },
    featureDebug: {
      enabled: true,
      log(...args) {
        logs.push(args);
      },
      warn(...args) {
        logs.push(args);
      },
    },
  });

  try {
    timers.advance(25);

    const applyEvent = logs.find((entry) => entry[1]?.status === "apply");
    assert.ok(applyEvent);
    assert.equal(applyEvent[1]?.reason, "checkout");
    assert.equal(applyEvent[1]?.segment, "D5");
    assert.equal(targetNode.classList.contains(ZOOM_CLASS), true);
    assert.equal(hostNode.classList.contains(ZOOM_HOST_CLASS), true);
    assert.match(String(targetNode.style.transform || ""), /translate\(.+scale\(/);
  } finally {
    cleanup();
    timers.restoreGlobals();
  }
});

test("tv-board-zoom applies a visible checkout after reload before game-state hydration", async () => {
  const documentRef = new FakeDocument();
  documentRef.activeScoreElement.textContent = "4";
  documentRef.suggestionElement.textContent = "D2";
  documentRef.suggestionElement.__rect = { left: 320, top: 16, width: 180, height: 48 };
  const windowRef = createFakeWindow({ documentRef });
  const timers = createFakeTimerHarness();
  timers.installOnWindow(windowRef);
  timers.installGlobals();
  const { hostNode, targetNode } = installZoomFixture(documentRef);
  const gameState = {
    isX01Variant() {
      return true;
    },
    getOutMode() {
      return "";
    },
    getActiveTurn() {
      return null;
    },
    getActiveThrows() {
      return [];
    },
    getActiveScore() {
      return null;
    },
    getSnapshot() {
      return null;
    },
    subscribe() {
      return () => {};
    },
  };

  const cleanup = startTvBoardZoom({ documentRef, windowRef, gameState });

  try {
    timers.advance(25);

    assert.equal(targetNode.classList.contains(ZOOM_CLASS), true);
    assert.equal(hostNode.classList.contains(ZOOM_HOST_CLASS), true);
    assert.match(String(targetNode.style.transform || ""), /scale\(/);
  } finally {
    cleanup();
    timers.restoreGlobals();
  }
});

test("tv-board-zoom stays inactive on Bull-off even when a stale X01 snapshot remains", async () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "Bull-off";
  const windowRef = createFakeWindow({ documentRef });
  const timers = createFakeTimerHarness();
  timers.installOnWindow(windowRef);
  timers.installGlobals();
  const gameState = createMutableX01GameState({
    activeScore: 10,
    throws: [],
  });
  const { hostNode, targetNode } = installZoomFixture(documentRef);

  const cleanup = startTvBoardZoom({
    documentRef,
    windowRef,
    gameState: gameState.api,
    featureConfig: {
      checkoutZoomTarget: "finish-only",
    },
  });

  try {
    timers.advance(25);

    assert.equal(targetNode.classList.contains(ZOOM_CLASS), false);
    assert.equal(hostNode.classList.contains(ZOOM_HOST_CLASS), false);
    assert.equal(String(targetNode.style.transform || ""), "");
  } finally {
    cleanup();
    timers.restoreGlobals();
  }
});

test("tv-board-zoom clears an active zoom when the DOM variant switches away from X01", async () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  const timers = createFakeTimerHarness();
  timers.installOnWindow(windowRef);
  timers.installGlobals();
  const gameState = createMutableX01GameState({
    activeScore: 10,
    throws: [],
  });
  const { hostNode, targetNode } = installZoomFixture(documentRef);

  const cleanup = startTvBoardZoom({
    documentRef,
    windowRef,
    gameState: gameState.api,
    featureConfig: {
      checkoutZoomTarget: "finish-only",
    },
  });

  try {
    timers.advance(25);
    assert.equal(targetNode.classList.contains(ZOOM_CLASS), true);
    assert.equal(hostNode.classList.contains(ZOOM_HOST_CLASS), true);

    documentRef.variantElement.textContent = "Bull-off";
    gameState.notify();
    timers.advance(25);

    assert.equal(targetNode.classList.contains(ZOOM_CLASS), false);
    assert.equal(hostNode.classList.contains(ZOOM_HOST_CLASS), false);
    assert.equal(String(targetNode.style.transform || ""), "");
  } finally {
    cleanup();
    timers.restoreGlobals();
  }
});

test("tv-board-zoom clears an active zoom immediately while the turn score shows BUST", async () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  const timers = createFakeTimerHarness();
  timers.installOnWindow(windowRef);
  timers.installGlobals();
  const logs = [];
  const gameState = createMutableX01GameState({
    activeScore: 10,
    throws: [],
  });
  const { hostNode, targetNode } = installZoomFixture(documentRef);

  const cleanup = startTvBoardZoom({
    documentRef,
    windowRef,
    gameState: gameState.api,
    featureConfig: {
      checkoutZoomTarget: "finish-only",
    },
    featureDebug: {
      enabled: true,
      log(...args) {
        logs.push(args);
      },
      warn(...args) {
        logs.push(args);
      },
    },
  });

  try {
    timers.advance(25);
    assert.equal(targetNode.classList.contains(ZOOM_CLASS), true);
    assert.equal(hostNode.classList.contains(ZOOM_HOST_CLASS), true);

    documentRef.turnScoreElement.textContent = "BUST";
    gameState.notify();
    timers.advance(25);

    assert.equal(targetNode.classList.contains(ZOOM_CLASS), false);
    assert.equal(hostNode.classList.contains(ZOOM_HOST_CLASS), false);
    assert.equal(String(targetNode.style.transform || ""), "");
    assert.ok(logs.some((entry) => entry[1]?.status === "reset" && entry[1]?.reason === "bust"));
  } finally {
    cleanup();
    timers.restoreGlobals();
  }
});

test("tv-board-zoom hard-resets before applying zoom in a new X01 game", async () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  const timers = createFakeTimerHarness();
  timers.installOnWindow(windowRef);
  timers.installGlobals();
  const logs = [];
  const gameState = createMutableX01GameState({
    activeScore: 10,
    throws: [],
    snapshot: {
      topic: "match-a.state",
      match: { currentGameId: "game-a", id: "match-a" },
    },
  });
  const { hostNode, targetNode } = installZoomFixture(documentRef);

  const cleanup = startTvBoardZoom({
    documentRef,
    windowRef,
    gameState: gameState.api,
    featureConfig: {
      checkoutZoomTarget: "finish-only",
    },
    featureDebug: {
      enabled: true,
      log(...args) {
        logs.push(args);
      },
      warn(...args) {
        logs.push(args);
      },
    },
  });

  try {
    timers.advance(25);
    assert.equal(targetNode.classList.contains(ZOOM_CLASS), true);

    gameState.state.snapshot = {
      topic: "match-b.state",
      match: { currentGameId: "game-b", id: "match-b" },
    };
    gameState.notify();
    timers.advance(25);

    assert.equal(targetNode.classList.contains(ZOOM_CLASS), true);
    assert.equal(hostNode.classList.contains(ZOOM_HOST_CLASS), true);
    assert.ok(logs.some((entry) => entry[1]?.status === "reset" && entry[1]?.reason === "game-boundary"));
    assert.ok(logs.some((entry) => entry[1]?.status === "apply" && entry[1]?.segment === "D5"));
  } finally {
    cleanup();
    timers.restoreGlobals();
  }
});

test("tv-board-zoom resets immediately when the active match surface is left", async () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  const timers = createFakeTimerHarness();
  timers.installOnWindow(windowRef);
  timers.installGlobals();
  const gameState = createMutableX01GameState({ activeScore: 40, throws: [] });
  const { hostNode, targetNode } = installZoomFixture(documentRef);
  const cleanup = startTvBoardZoom({ documentRef, windowRef, gameState: gameState.api });

  try {
    timers.advance(25);
    assert.equal(targetNode.classList.contains(ZOOM_CLASS), true);

    const turnContainer = documentRef.turnContainer;
    turnContainer.remove();
    documentRef.flushMutations([
      { type: "childList", target: documentRef.main, addedNodes: [], removedNodes: [turnContainer] },
    ]);
    timers.advance(25);

    assert.equal(targetNode.classList.contains(ZOOM_CLASS), false);
    assert.equal(hostNode.classList.contains(ZOOM_HOST_CLASS), false);
    assert.equal(String(targetNode.style.transform || ""), "");
  } finally {
    cleanup();
    timers.restoreGlobals();
  }
});

test("tv-board-zoom resets after board stays missing beyond transient grace", async () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  const timers = createFakeTimerHarness();
  timers.installOnWindow(windowRef);
  timers.installGlobals();
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
    timers.advance(25);
    assert.equal(targetNode.classList.contains(ZOOM_CLASS), true);

    boardSvg.remove();
    documentRef.flushMutations([{ target: documentRef.main, addedNodes: [], removedNodes: [boardSvg] }]);
    gameState.notify();
    timers.advance(0);

    timers.advance(700);
    assert.equal(String(targetNode.style.transform || ""), "");
    assert.equal(String(hostNode.style.overflow || ""), "");
    assert.equal(String(hostNode.style.overflowX || ""), "");
    assert.equal(String(hostNode.style.overflowY || ""), "");
  } finally {
    cleanup();
    timers.restoreGlobals();
  }
});

test("tv-board-zoom keeps immediate correction zoom-out behavior with manual pause", async () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  const timers = createFakeTimerHarness();
  timers.installOnWindow(windowRef);
  timers.installGlobals();
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
    timers.advance(25);
    assert.match(String(targetNode.style.transform || ""), /scale\(/);

    gameState.state.activeScore = 181;
    gameState.state.throws = [{ segment: { name: "T20" } }];
    gameState.notify();
    timers.advance(35);

    assert.equal(String(targetNode.style.transform || ""), "");
  } finally {
    cleanup();
    timers.restoreGlobals();
  }
});

test("tv-board-zoom ignores attribute churn on board descendants but still reacts to structural board changes", () => {
  const documentRef = new FakeDocument();
  const { hostNode, targetNode, boardSvg } = installZoomFixture(documentRef);
  const boardPath = documentRef.createElementNS("http://www.w3.org/2000/svg", "path");
  boardPath.setAttribute("d", "M 0 0 L 5 5");
  boardSvg.appendChild(boardPath);

  const unrelatedMutation = {
    type: "attributes",
    target: boardPath,
    attributeName: "class",
    addedNodes: [],
    removedNodes: [],
  };
  const structuralMutation = {
    type: "childList",
    target: targetNode,
    addedNodes: [],
    removedNodes: [boardSvg],
  };

  assert.equal(
    shouldScheduleTvBoardZoomMutation([unrelatedMutation], {
      boardSurface: {
        svg: boardSvg,
        zoomTarget: targetNode,
        zoomHost: hostNode,
      },
      zoomState: {
        zoomedElement: targetNode,
        zoomHost: hostNode,
      },
    }),
    false
  );
  assert.equal(
    shouldScheduleTvBoardZoomMutation([structuralMutation], {
      boardSurface: {
        svg: boardSvg,
        zoomTarget: targetNode,
        zoomHost: hostNode,
      },
      zoomState: {
        zoomedElement: targetNode,
        zoomHost: hostNode,
      },
    }),
    true
  );
});

test("tv-board-zoom schedules semantic churn without invalidating the board surface cache", () => {
  const documentRef = new FakeDocument();
  const { hostNode, targetNode, boardSvg } = installZoomFixture(documentRef);
  const suggestionNode = documentRef.createElement("div");
  suggestionNode.classList.add("suggestion");
  suggestionNode.textContent = "16 D8";
  documentRef.body.appendChild(suggestionNode);

  const semanticCharacterMutation = {
    type: "characterData",
    target: suggestionNode,
    addedNodes: [],
    removedNodes: [],
  };
  const watchedAttributeMutation = {
    type: "attributes",
    target: targetNode,
    attributeName: "class",
    addedNodes: [],
    removedNodes: [],
  };
  const structureMutation = {
    type: "childList",
    target: targetNode,
    addedNodes: [],
    removedNodes: [boardSvg],
  };

  assert.deepEqual(
    resolveTvBoardZoomMutationReaction([semanticCharacterMutation], {
      boardSurface: {
        svg: boardSvg,
        zoomTarget: targetNode,
        zoomHost: hostNode,
      },
      zoomState: {
        zoomedElement: targetNode,
        zoomHost: hostNode,
      },
    }),
    {
      shouldSchedule: true,
      shouldInvalidateBoardCache: false,
    }
  );
  assert.deepEqual(
    resolveTvBoardZoomMutationReaction([watchedAttributeMutation], {
      boardSurface: {
        svg: boardSvg,
        zoomTarget: targetNode,
        zoomHost: hostNode,
      },
      zoomState: {
        zoomedElement: targetNode,
        zoomHost: hostNode,
      },
    }),
    {
      shouldSchedule: true,
      shouldInvalidateBoardCache: false,
    }
  );
  assert.deepEqual(
    resolveTvBoardZoomMutationReaction([structureMutation], {
      boardSurface: {
        svg: boardSvg,
        zoomTarget: targetNode,
        zoomHost: hostNode,
      },
      zoomState: {
        zoomedElement: targetNode,
        zoomHost: hostNode,
      },
    }),
    {
      shouldSchedule: true,
      shouldInvalidateBoardCache: true,
    }
  );
});

test("tv-board-zoom does not reapply the zoom after unrelated board-svg attribute churn", async () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  const timers = createFakeTimerHarness();
  timers.installOnWindow(windowRef);
  timers.installGlobals();
  const gameState = createMutableX01GameState({
    activeScore: 10,
    throws: [],
  });
  const { targetNode, boardSvg } = installZoomFixture(documentRef);
  const boardPath = documentRef.createElementNS("http://www.w3.org/2000/svg", "path");
  boardPath.setAttribute("d", "M 0 0 L 4 6");
  boardSvg.appendChild(boardPath);

  const originalTargetRect = targetNode.getBoundingClientRect.bind(targetNode);
  const originalBoardRect = boardSvg.getBoundingClientRect.bind(boardSvg);
  let targetDriftPhase = 0;
  let boardDriftPhase = 0;
  targetNode.getBoundingClientRect = () => {
    const rect = originalTargetRect();
    const driftX = targetDriftPhase * 1.2;
    const driftY = targetDriftPhase * 0.8;
    return {
      ...rect,
      left: rect.left + driftX,
      top: rect.top + driftY,
      right: rect.right + driftX,
      bottom: rect.bottom + driftY,
    };
  };
  boardSvg.getBoundingClientRect = () => {
    const rect = originalBoardRect();
    const driftX = boardDriftPhase * 1.2;
    const driftY = boardDriftPhase * 0.8;
    return {
      ...rect,
      left: rect.left + driftX,
      top: rect.top + driftY,
      right: rect.right + driftX,
      bottom: rect.bottom + driftY,
    };
  };

  const cleanup = startTvBoardZoom({
    documentRef,
    windowRef,
    gameState: gameState.api,
    featureConfig: {
      checkoutZoomTarget: "finish-only",
    },
  });

  try {
    timers.advance(25);
    const firstTransform = String(targetNode.style.transform || "");
    assert.match(firstTransform, /scale\(/);

    targetDriftPhase = 1;
    boardDriftPhase = 1;
    documentRef.flushMutations([
      {
        type: "attributes",
        target: boardPath,
        attributeName: "class",
        addedNodes: [],
        removedNodes: [],
      },
    ]);
    timers.advance(35);

    assert.equal(String(targetNode.style.transform || ""), firstTransform);
  } finally {
    cleanup();
    timers.restoreGlobals();
  }
});
