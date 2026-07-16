import test from "node:test";
import assert from "node:assert/strict";

import { createDomGuards } from "../../src/core/dom-guards.js";
import { createObserverRegistry } from "../../src/core/observer-registry.js";
import { mountCheckoutScoreHighlight } from "../../src/features/checkout-score-highlight/index.js";
import {
  applyHighlightState,
  clearHighlightState,
  getAllScoreNodes,
  getScoreNodes,
} from "../../src/features/checkout-score-highlight/logic.js";
import { HIGHLIGHT_CLASS } from "../../src/features/checkout-score-highlight/style.js";
import {
  createX01PlayerSurfaceObserveOptions,
  getX01PlayerSurfaceSnapshot,
} from "../../src/features/shared/x01-player-surface-adapter.js";
import { FakeDocument, createFakeWindow } from "./fake-dom.js";

function appendPlayerRow(documentRef, scoreText, { active = false } = {}) {
  const row = documentRef.createElement("div");
  row.classList.add("ad-ext-player");
  if (active) {
    row.classList.add("ad-ext-player-active");
  }

  const scoreNode = documentRef.createElement("p");
  scoreNode.classList.add("ad-ext-player-score");
  scoreNode.textContent = String(scoreText || "");
  row.appendChild(scoreNode);
  documentRef.main.appendChild(row);

  return { row, scoreNode };
}

function appendPlayerSurfaceRoot(documentRef) {
  const root = documentRef.createElement("div");
  root.id = "ad-ext-player-display";
  documentRef.main.appendChild(root);
  return root;
}

function appendSurfacePlayer(documentRef, root, scoreText, { active = false } = {}) {
  const row = documentRef.createElement("div");
  row.classList.add("ad-ext-player");
  if (active) {
    row.classList.add("ad-ext-player-active");
  }

  const scoreNode = documentRef.createElement("p");
  scoreNode.classList.add("ad-ext-player-score");
  scoreNode.textContent = String(scoreText || "");
  row.appendChild(scoreNode);
  root.appendChild(row);

  return { row, scoreNode };
}

function mountPulseWithCountingRaf(documentRef) {
  const windowRef = createFakeWindow({ documentRef });
  const domGuards = createDomGuards({ documentRef });
  const observers = createObserverRegistry();
  let rafCount = 0;

  windowRef.requestAnimationFrame = (callback) => {
    rafCount += 1;
    callback();
    return rafCount;
  };
  windowRef.cancelAnimationFrame = () => {};

  const cleanup = mountCheckoutScoreHighlight({
    documentRef,
    windowRef,
    domGuards,
    registries: { observers },
    gameState: {
      isX01Variant: () => false,
      subscribe() {
        return () => {};
      },
    },
  });

  return {
    cleanup,
    observers,
    getRafCount: () => rafCount,
  };
}

test("checkout-score-highlight scopes score lookup to the player surface when it exists", () => {
  const documentRef = new FakeDocument();
  const root = appendPlayerSurfaceRoot(documentRef);
  const first = appendSurfacePlayer(documentRef, root, "170");
  const second = appendSurfacePlayer(documentRef, root, "40", { active: true });
  const snapshot = getX01PlayerSurfaceSnapshot(documentRef);

  const documentQueries = [];
  const querySelectorAll = documentRef.querySelectorAll.bind(documentRef);
  documentRef.querySelectorAll = (selector) => {
    documentQueries.push(selector);
    return querySelectorAll(selector);
  };

  const allScoreNodes = getAllScoreNodes(documentRef, { playerSurfaceSnapshot: snapshot });
  const scoreNodes = getScoreNodes(
    documentRef,
    {
      getActivePlayerIndex: () => 0,
    },
    { playerSurfaceSnapshot: snapshot }
  );

  assert.deepEqual(allScoreNodes, [first.scoreNode, second.scoreNode]);
  assert.deepEqual(scoreNodes, [second.scoreNode]);
  assert.deepEqual(documentQueries, []);
});

test("checkout-score-highlight observes player surface mutations without scheduling unrelated document churn", () => {
  const documentRef = new FakeDocument();
  const root = appendPlayerSurfaceRoot(documentRef);
  appendSurfacePlayer(documentRef, root, "170", { active: true });

  const mounted = mountPulseWithCountingRaf(documentRef);
  assert.equal(mounted.getRafCount(), 1);

  const lifecycleObserver = mounted.observers.get(
    "checkout-score-highlight:dom-observer:lifecycle"
  );
  const surfaceObserver = mounted.observers.get(
    "checkout-score-highlight:dom-observer:surface"
  );
  assert.ok(lifecycleObserver);
  assert.ok(surfaceObserver);
  assert.equal(lifecycleObserver.observeCalls[0].target, documentRef.documentElement);
  assert.deepEqual(lifecycleObserver.observeCalls[0].options, {
    childList: true,
    subtree: true,
  });
  assert.equal(surfaceObserver.observeCalls[0].target, root);
  assert.deepEqual(surfaceObserver.observeCalls[0].options, createX01PlayerSurfaceObserveOptions());

  const unrelatedNode = documentRef.createElement("div");
  documentRef.sidebar.appendChild(unrelatedNode);
  surfaceObserver.callback([
    {
      target: documentRef.sidebar,
      addedNodes: [unrelatedNode],
      removedNodes: [],
    },
  ]);
  assert.equal(mounted.getRafCount(), 1);

  surfaceObserver.callback([
    {
      target: root,
      addedNodes: [],
      removedNodes: [],
    },
  ]);
  assert.equal(mounted.getRafCount(), 2);

  mounted.cleanup();
});

test("checkout-score-highlight uses a narrow lifecycle observer until the player surface appears", () => {
  const documentRef = new FakeDocument();
  const mounted = mountPulseWithCountingRaf(documentRef);
  assert.equal(mounted.getRafCount(), 1);

  const lifecycleObserver = mounted.observers.get(
    "checkout-score-highlight:dom-observer:lifecycle"
  );
  assert.ok(lifecycleObserver);
  assert.equal(lifecycleObserver.observeCalls[0].target, documentRef.documentElement);
  assert.equal(
    mounted.observers.get("checkout-score-highlight:dom-observer:surface"),
    null
  );

  lifecycleObserver.callback([
    {
      target: documentRef.sidebar,
      addedNodes: [],
      removedNodes: [],
    },
  ]);
  assert.equal(mounted.getRafCount(), 1);

  const root = appendPlayerSurfaceRoot(documentRef);
  appendSurfacePlayer(documentRef, root, "170", { active: true });
  lifecycleObserver.callback([
    {
      target: documentRef.main,
      addedNodes: [root],
      removedNodes: [],
    },
  ]);
  assert.equal(mounted.getRafCount(), 2);
  assert.equal(
    mounted.observers.get("checkout-score-highlight:dom-observer:surface")?.observeCalls[0].target,
    root
  );

  mounted.cleanup();
});

test("checkout-score-highlight rebinds only when the player surface root is replaced", () => {
  const documentRef = new FakeDocument();
  const firstRoot = appendPlayerSurfaceRoot(documentRef);
  appendSurfacePlayer(documentRef, firstRoot, "170", { active: true });
  const mounted = mountPulseWithCountingRaf(documentRef);
  const lifecycleObserver = mounted.observers.get(
    "checkout-score-highlight:dom-observer:lifecycle"
  );
  const firstSurfaceObserver = mounted.observers.get(
    "checkout-score-highlight:dom-observer:surface"
  );

  const unrelatedNode = documentRef.createElement("div");
  documentRef.sidebar.appendChild(unrelatedNode);
  lifecycleObserver.callback([
    {
      target: documentRef.sidebar,
      addedNodes: [unrelatedNode],
      removedNodes: [],
    },
  ]);
  assert.equal(mounted.getRafCount(), 1);
  assert.equal(
    mounted.observers.get("checkout-score-highlight:dom-observer:surface"),
    firstSurfaceObserver
  );

  firstRoot.remove();
  const secondRoot = appendPlayerSurfaceRoot(documentRef);
  appendSurfacePlayer(documentRef, secondRoot, "40", { active: true });
  lifecycleObserver.callback([
    {
      target: documentRef.main,
      addedNodes: [secondRoot],
      removedNodes: [firstRoot],
    },
  ]);

  const secondSurfaceObserver = mounted.observers.get(
    "checkout-score-highlight:dom-observer:surface"
  );
  assert.equal(mounted.getRafCount(), 2);
  assert.equal(firstSurfaceObserver.disconnected, true);
  assert.notEqual(secondSurfaceObserver, firstSurfaceObserver);
  assert.equal(secondSurfaceObserver.observeCalls[0].target, secondRoot);

  mounted.cleanup();
});

test("checkout-score-highlight clears all score nodes in the scoped player surface", () => {
  const documentRef = new FakeDocument();
  const root = appendPlayerSurfaceRoot(documentRef);
  const first = appendSurfacePlayer(documentRef, root, "170", { active: true });
  const second = appendSurfacePlayer(documentRef, root, "40");
  const snapshot = getX01PlayerSurfaceSnapshot(documentRef);

  applyHighlightState([first.scoreNode, second.scoreNode], {
    shouldHighlight: true,
    effect: "pulse",
  });

  clearHighlightState(getAllScoreNodes(documentRef, { playerSurfaceSnapshot: snapshot }));

  assert.equal(first.scoreNode.classList.contains(HIGHLIGHT_CLASS), false);
  assert.equal(second.scoreNode.classList.contains(HIGHLIGHT_CLASS), false);
});

test("checkout-score-highlight resolves hydration gaps to the active player index", () => {
  const documentRef = new FakeDocument();
  documentRef.activePlayerRow.classList.remove("ad-ext-player-active");
  documentRef.activePlayerRow.remove();

  const first = appendPlayerRow(documentRef, "170");
  const second = appendPlayerRow(documentRef, "40");
  const third = appendPlayerRow(documentRef, "32");

  const resolved = getScoreNodes(documentRef, {
    getActivePlayerIndex: () => 1,
  });

  assert.equal(resolved.length, 1);
  assert.equal(resolved[0], second.scoreNode);

  const allScoreNodes = getAllScoreNodes(documentRef);
  assert.equal(allScoreNodes.length, 3);
  assert.equal(allScoreNodes[0], first.scoreNode);
  assert.equal(allScoreNodes[1], second.scoreNode);
  assert.equal(allScoreNodes[2], third.scoreNode);
});

test("checkout-score-highlight returns no score nodes when a hydration gap cannot be mapped safely", () => {
  const documentRef = new FakeDocument();
  documentRef.activePlayerRow.classList.remove("ad-ext-player-active");
  documentRef.activePlayerRow.remove();

  const first = appendPlayerRow(documentRef, "170");
  const second = appendPlayerRow(documentRef, "40");

  applyHighlightState([first.scoreNode], {
    shouldHighlight: true,
    effect: "pulse",
  });

  const resolved = getScoreNodes(documentRef, {
    getActivePlayerIndex: () => 5,
  });

  assert.equal(resolved.length, 0);
  clearHighlightState(getAllScoreNodes(documentRef));
  assert.equal(first.scoreNode.classList.contains(HIGHLIGHT_CLASS), false);
  assert.equal(second.scoreNode.classList.contains(HIGHLIGHT_CLASS), false);
});

test("checkout-score-highlight keeps the single-score fallback when only one score node exists", () => {
  const documentRef = new FakeDocument();

  const onlyScoreNodes = getAllScoreNodes(documentRef);
  assert.equal(onlyScoreNodes.length, 1);

  documentRef.activePlayerRow.classList.remove("ad-ext-player-active");
  const resolved = getScoreNodes(documentRef, {
    getActivePlayerIndex: () => null,
  });

  assert.equal(resolved.length, 1);
  assert.equal(resolved[0], documentRef.activeScoreElement);
});
