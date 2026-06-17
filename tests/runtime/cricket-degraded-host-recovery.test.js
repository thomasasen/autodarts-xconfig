import test from "node:test";
import assert from "node:assert/strict";

import * as cricketRules from "../../src/domain/cricket-rules.js";
import * as variantRules from "../../src/domain/variant-rules.js";
import { createDomGuards } from "../../src/core/dom-guards.js";
import { createListenerRegistry } from "../../src/core/listener-registry.js";
import { createObserverRegistry } from "../../src/core/observer-registry.js";
import { initializeCricketGridStatusEffects } from "../../src/features/cricket-grid-status-effects/index.js";
import { ROOT_CLASS } from "../../src/features/cricket-grid-status-effects/style.js";
import { initializeCricketTargetHighlighter } from "../../src/features/cricket-target-highlighter/index.js";
import { buildCricketRenderState } from "../../src/features/cricket-target-highlighter/logic.js";
import { OVERLAY_ID as CRICKET_OVERLAY_ID } from "../../src/features/cricket-target-highlighter/style.js";
import { acquireSharedCricketRuntime } from "../../src/features/cricket-surface/shared-runtime.js";
import {
  canDelayMissingMatchBoardGap,
  resolveMissingMatchBoardGapDelay,
} from "../../src/features/cricket-surface/degraded-host-recovery.js";
import {
  FakeDocument,
  createFakeTimerHarness,
  createFakeWindow,
} from "./fake-dom.js";

function createNumericCricketGrid(documentRef) {
  const table = documentRef.createElement("table");
  table.id = "grid";
  const targetOrder = cricketRules.getTargetOrderByGameMode("cricket");

  targetOrder.forEach((label) => {
    const row = documentRef.createElement("tr");
    const labelCell = documentRef.createElement("td");
    labelCell.classList.add("label-cell");
    labelCell.textContent = label === "BULL" ? "Bull" : label;
    row.appendChild(labelCell);

    for (let playerIndex = 0; playerIndex < 2; playerIndex += 1) {
      const playerCell = documentRef.createElement("td");
      playerCell.classList.add("player-cell");
      playerCell.setAttribute("data-player-index", String(playerIndex));
      playerCell.setAttribute("data-marks", "0");
      row.appendChild(playerCell);
    }

    table.appendChild(row);
  });

  documentRef.main.appendChild(table);
  return table;
}

function createBoardFixture(documentRef, options = {}) {
  const parentNode = options.parentNode || documentRef.main;
  const boardShell = documentRef.createElement("div");
  const boardControls = documentRef.createElement("div");
  const undoButton = documentRef.createElement("button");
  const boardSvg = documentRef.createElementNS("http://www.w3.org/2000/svg", "svg");

  boardShell.__rect = { left: 820, top: 150, width: 520, height: 520 };
  boardControls.__rect = { left: 820, top: 150, width: 120, height: 40 };
  boardSvg.__rect = { left: 820, top: 200, width: 464, height: 464 };
  boardSvg.setAttribute("viewBox", "0 0 1000 1000");

  undoButton.textContent = "Undo";
  boardControls.appendChild(undoButton);
  boardShell.appendChild(boardControls);

  const boardGroup = documentRef.createElementNS("http://www.w3.org/2000/svg", "g");
  const outerRing = documentRef.createElementNS("http://www.w3.org/2000/svg", "circle");
  outerRing.setAttribute("r", "500");
  boardGroup.appendChild(outerRing);

  for (let value = 1; value <= 20; value += 1) {
    const labelNode = documentRef.createElementNS("http://www.w3.org/2000/svg", "text");
    labelNode.textContent = String(value);
    boardGroup.appendChild(labelNode);
  }

  for (let index = 0; index < 40; index += 1) {
    const path = documentRef.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", `M ${index} 0 L ${index + 1} 4 L ${index + 2} 0 Z`);
    boardGroup.appendChild(path);
  }

  boardSvg.appendChild(boardGroup);
  boardShell.appendChild(boardSvg);
  parentNode.appendChild(boardShell);
  return { boardShell, boardControls, boardSvg };
}

function createDegradedMatchHostFixture(documentRef) {
  const host = documentRef.createElement("div");
  host.className = "css-u5v8bq";
  host.__rect = { left: 216, top: 184, width: 644, height: 500 };

  const leftPane = documentRef.createElement("div");
  leftPane.className = "css-rc3vw3";
  leftPane.__rect = { left: 216, top: 184, width: 383, height: 500 };

  const roster = documentRef.createElement("div");
  roster.textContent = "TORNADO TOM TEST MPR:0.0";
  roster.__rect = { left: 216, top: 184, width: 383, height: 88 };
  leftPane.appendChild(roster);

  const grid = documentRef.createElement("table");
  grid.id = "grid";
  grid.__rect = { left: 216, top: 284, width: 383, height: 189 };

  cricketRules.getTargetOrderByGameMode("cricket").forEach((label) => {
    const row = documentRef.createElement("tr");
    const labelCell = documentRef.createElement("td");
    labelCell.classList.add("label-cell");
    labelCell.textContent = label === "BULL" ? "Bull" : label;
    row.appendChild(labelCell);

    for (let playerIndex = 0; playerIndex < 2; playerIndex += 1) {
      const playerCell = documentRef.createElement("td");
      playerCell.classList.add("player-cell");
      playerCell.setAttribute("data-player-index", String(playerIndex));
      playerCell.textContent = "";
      row.appendChild(playerCell);
    }

    grid.appendChild(row);
  });

  leftPane.appendChild(grid);

  const rightPane = documentRef.createElement("div");
  rightPane.className = "css-vo3506";
  rightPane.__rect = { left: 607, top: 184, width: 253, height: 500 };
  rightPane.textContent = "UndoNext2011841361015217319";

  host.appendChild(leftPane);
  host.appendChild(rightPane);
  documentRef.main.appendChild(host);

  return { host, leftPane, rightPane, grid };
}

function createHealthyMatchHostFixture(documentRef) {
  const host = documentRef.createElement("div");
  host.className = "css-u5v8bq";
  host.__rect = { left: 216, top: 184, width: 1108, height: 500 };

  const leftPane = documentRef.createElement("div");
  leftPane.className = "css-rc3vw3";
  leftPane.__rect = { left: 216, top: 184, width: 644, height: 500 };

  const roster = documentRef.createElement("div");
  roster.textContent = "TEST2 TEST MPR:0.0";
  roster.__rect = { left: 216, top: 184, width: 644, height: 88 };
  leftPane.appendChild(roster);

  const grid = createNumericCricketGrid(documentRef);
  grid.__rect = { left: 216, top: 284, width: 644, height: 224 };
  leftPane.appendChild(grid);

  const rightPane = documentRef.createElement("div");
  rightPane.className = "css-vo3506";
  rightPane.__rect = { left: 860, top: 184, width: 464, height: 500 };

  const boardFixture = createBoardFixture(documentRef, { parentNode: rightPane });
  boardFixture.boardShell.__rect = { left: 860, top: 184, width: 464, height: 500 };
  boardFixture.boardControls.__rect = { left: 860, top: 184, width: 180, height: 40 };
  boardFixture.boardSvg.__rect = { left: 860, top: 220, width: 464, height: 464 };

  host.appendChild(leftPane);
  host.appendChild(rightPane);
  documentRef.main.appendChild(host);

  return {
    host,
    leftPane,
    rightPane,
    grid,
    boardShell: boardFixture.boardShell,
    boardControls: boardFixture.boardControls,
    boardSvg: boardFixture.boardSvg,
  };
}

function createGameState() {
  return {
    getCricketGameModeNormalized: () => "cricket",
    getCricketGameMode: () => "Cricket",
    getCricketScoringModeNormalized: () => "standard",
    getCricketScoringMode: () => "standard",
    getActivePlayerIndex: () => 0,
    getActiveThrows: () => [],
    getActiveTurn: () => null,
    getSnapshot: () => ({
      match: {
        players: [{ id: "player-a" }, { id: "player-b" }],
      },
    }),
    isCricketVariant: () => true,
    subscribe: () => () => {},
  };
}

function createImmediateScheduler() {
  return {
    createRafScheduler(callback) {
      return {
        schedule() {
          callback();
        },
        cancel() {},
        isScheduled() {
          return false;
        },
      };
    },
  };
}

function createFeatureConfig() {
  return {
    getFeatureConfig(featureKey) {
      if (featureKey === "cricketTargetHighlighter") {
        return {
          showOpenTargets: true,
          showDeadTargets: true,
          colorTheme: "standard",
          intensity: "normal",
        };
      }

      return {
        rowWave: true,
        badgeBeacon: true,
        markProgress: true,
        threatEdge: true,
        scoringLane: true,
        deadRowCollapse: true,
        deltaChips: true,
        hitSpark: true,
        roundTransitionWipe: true,
        opponentPressureOverlay: true,
        colorTheme: "standard",
        intensity: "normal",
      };
    },
  };
}

function countRecoveryNavigations(windowRef) {
  return Number(windowRef?.location?.__reloadCount || 0) + Number(windowRef?.location?.__replacedUrls?.length || 0);
}

function clearChildren(node) {
  const target = node && typeof node === "object" ? node : null;
  if (!target || !Array.isArray(target.children)) {
    return;
  }

  while (target.children.length) {
    target.children[0].remove();
  }
}

test("buildCricketRenderState upgrades persistent degraded match host from missing-board to degraded-host after grace", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({
    documentRef,
    href: "https://play.autodarts.io/matches/test-match",
  });
  const timerHarness = createFakeTimerHarness({ now: 1_000 });
  timerHarness.installGlobals();
  timerHarness.installOnWindow(windowRef);

  try {
    documentRef.variantElement.textContent = "Cricket";
    createDegradedMatchHostFixture(documentRef);
    const gameState = createGameState();

    const firstRenderState = buildCricketRenderState({
      documentRef,
      windowRef,
      gameState,
      cricketRules,
      variantRules,
      cache: { grid: null, board: null },
    });

    assert.equal(firstRenderState?.surfaceStatus, "missing-board");
    assert.equal(firstRenderState?.matchRouteId, "test-match");

    timerHarness.advance(301);

    const secondRenderState = buildCricketRenderState({
      documentRef,
      windowRef,
      gameState,
      cricketRules,
      variantRules,
      cache: { grid: null, board: null },
    });

    assert.equal(secondRenderState?.surfaceStatus, "degraded-host");
    assert.equal(secondRenderState?.matchRouteId, "test-match");
    assert.match(String(secondRenderState?.degradedHostInfo?.rightPaneText || ""), /UndoNext/i);
  } finally {
    timerHarness.restoreGlobals();
  }
});

test("buildCricketRenderState still detects degraded match hosts when a smaller sibling pane is present", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({
    documentRef,
    href: "https://play.autodarts.io/matches/with-banner",
  });
  const timerHarness = createFakeTimerHarness({ now: 1_500 });
  timerHarness.installGlobals();
  timerHarness.installOnWindow(windowRef);

  try {
    documentRef.variantElement.textContent = "Cricket";
    const degradedFixture = createDegradedMatchHostFixture(documentRef);
    const banner = documentRef.createElement("div");
    banner.className = "css-mini-banner";
    banner.textContent = "Round 3";
    banner.__rect = { left: 216, top: 150, width: 140, height: 32 };
    degradedFixture.host.appendChild(banner);

    const firstRenderState = buildCricketRenderState({
      documentRef,
      windowRef,
      gameState: createGameState(),
      cricketRules,
      variantRules,
      cache: { grid: null, board: null },
    });
    assert.equal(firstRenderState?.surfaceStatus, "missing-board");

    timerHarness.advance(301);

    const secondRenderState = buildCricketRenderState({
      documentRef,
      windowRef,
      gameState: createGameState(),
      cricketRules,
      variantRules,
      cache: { grid: null, board: null },
    });

    assert.equal(secondRenderState?.surfaceStatus, "degraded-host");
    assert.equal(secondRenderState?.matchRouteId, "with-banner");
    assert.match(String(secondRenderState?.degradedHostInfo?.rightPaneText || ""), /UndoNext/i);
  } finally {
    timerHarness.restoreGlobals();
  }
});

test("buildCricketRenderState keeps healthy direct board loads ready", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({
    documentRef,
    href: "https://play.autodarts.io/matches/direct-load",
  });
  documentRef.variantElement.textContent = "Cricket";

  createNumericCricketGrid(documentRef);
  createBoardFixture(documentRef);

  const renderState = buildCricketRenderState({
    documentRef,
    windowRef,
    gameState: createGameState(),
    cricketRules,
    variantRules,
    cache: { grid: null, board: null },
  });

  assert.equal(renderState?.surfaceStatus, "ready");
  assert.equal(renderState?.matchRouteId, "direct-load");
});

test("buildCricketRenderState does not misclassify plain missing-board or lobby hosts as degraded", () => {
  const matchDocumentRef = new FakeDocument();
  const matchWindowRef = createFakeWindow({
    documentRef: matchDocumentRef,
    href: "https://play.autodarts.io/matches/no-board",
  });
  matchDocumentRef.variantElement.textContent = "Cricket";
  createNumericCricketGrid(matchDocumentRef);

  const matchRenderState = buildCricketRenderState({
    documentRef: matchDocumentRef,
    windowRef: matchWindowRef,
    gameState: createGameState(),
    cricketRules,
    variantRules,
    degradedHostGraceMs: 0,
    cache: { grid: null, board: null },
  });

  assert.equal(matchRenderState?.surfaceStatus, "missing-board");

  const lobbyDocumentRef = new FakeDocument();
  const lobbyWindowRef = createFakeWindow({
    documentRef: lobbyDocumentRef,
    href: "https://play.autodarts.io/lobbies",
  });
  lobbyDocumentRef.variantElement.textContent = "Cricket";
  createDegradedMatchHostFixture(lobbyDocumentRef);

  const lobbyRenderState = buildCricketRenderState({
    documentRef: lobbyDocumentRef,
    windowRef: lobbyWindowRef,
    gameState: createGameState(),
    cricketRules,
    variantRules,
    degradedHostGraceMs: 0,
    cache: { grid: null, board: null },
  });

  assert.equal(lobbyRenderState?.surfaceStatus, "missing-board");
  assert.equal(lobbyRenderState?.matchRouteId, "");
});

test("cricket highlighter and grid fx reload degraded match hosts once and stay passive", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({
    documentRef,
    href: "https://play.autodarts.io/matches/recover-once",
  });
  documentRef.variantElement.textContent = "Cricket";
  createDegradedMatchHostFixture(documentRef);

  const observers = createObserverRegistry();
  const listeners = createListenerRegistry();
  const domGuards = createDomGuards({ documentRef });
  const domain = { cricketRules, variantRules };
  const gameState = createGameState();
  const helperScheduler = createImmediateScheduler();
  const config = createFeatureConfig();

  const cleanupHighlighter = initializeCricketTargetHighlighter({
    documentRef,
    windowRef,
    domGuards,
    registries: { observers, listeners },
    gameState,
    domain,
    config,
    helpers: helperScheduler,
    degradedHostGraceMs: 0,
  });

  const cleanupGridFx = initializeCricketGridStatusEffects({
    documentRef,
    windowRef,
    domGuards,
    registries: { observers, listeners },
    gameState,
    domain,
    config,
    helpers: helperScheduler,
    degradedHostGraceMs: 0,
  });

  try {
    assert.equal(countRecoveryNavigations(windowRef), 1);
    assert.equal(Boolean(documentRef.getElementById(CRICKET_OVERLAY_ID)), false);
    assert.equal(Boolean(documentRef.querySelector(`.${ROOT_CLASS}`)), false);

    const mutation = [
      {
        type: "childList",
        target: documentRef.main,
        addedNodes: [documentRef.createElement("div")],
        removedNodes: [],
      },
    ];

    const highlighterObserver = observers.get("cricket-target-highlighter:dom-observer");
    const gridFxObserver = observers.get("cricket-grid-status-effects:dom-observer");
    assert.ok(highlighterObserver);
    assert.ok(gridFxObserver);

    highlighterObserver.callback(mutation);
    gridFxObserver.callback(mutation);

    assert.equal(countRecoveryNavigations(windowRef), 1);
    assert.equal(Boolean(documentRef.getElementById(CRICKET_OVERLAY_ID)), false);
    assert.equal(Boolean(documentRef.querySelector(`.${ROOT_CLASS}`)), false);
  } finally {
    cleanupGridFx();
    cleanupHighlighter();
  }
});

test("cricket highlighter and grid fx recheck pending degraded hosts after grace without extra DOM mutations", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({
    documentRef,
    href: "https://play.autodarts.io/matches/recover-after-grace",
  });
  const timerHarness = createFakeTimerHarness({ now: 2_000 });
  timerHarness.installGlobals();
  timerHarness.installOnWindow(windowRef);
  documentRef.variantElement.textContent = "Cricket";
  createDegradedMatchHostFixture(documentRef);

  const observers = createObserverRegistry();
  const listeners = createListenerRegistry();
  const domGuards = createDomGuards({ documentRef });
  const domain = { cricketRules, variantRules };
  const gameState = createGameState();
  const helperScheduler = createImmediateScheduler();
  const config = createFeatureConfig();

  const cleanupHighlighter = initializeCricketTargetHighlighter({
    documentRef,
    windowRef,
    domGuards,
    registries: { observers, listeners },
    gameState,
    domain,
    config,
    helpers: helperScheduler,
    degradedHostGraceMs: 300,
  });

  const cleanupGridFx = initializeCricketGridStatusEffects({
    documentRef,
    windowRef,
    domGuards,
    registries: { observers, listeners },
    gameState,
    domain,
    config,
    helpers: helperScheduler,
    degradedHostGraceMs: 300,
  });

  try {
    assert.equal(countRecoveryNavigations(windowRef), 0);

    timerHarness.advance(299);
    assert.equal(countRecoveryNavigations(windowRef), 0);

    timerHarness.advance(17);
    assert.equal(countRecoveryNavigations(windowRef), 1);
    assert.equal(Boolean(documentRef.getElementById(CRICKET_OVERLAY_ID)), false);
    assert.equal(Boolean(documentRef.querySelector(`.${ROOT_CLASS}`)), false);
    assert.notEqual(
      windowRef.sessionStorage.getItem("adx:cricket-host-recovery:recover-after-grace"),
      null
    );
  } finally {
    cleanupGridFx();
    cleanupHighlighter();
    timerHarness.restoreGlobals();
  }
});

test("cricket highlighter and grid fx watch last healthy surface nodes when degraded host churn only flips an ancestor class", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({
    documentRef,
    href: "https://play.autodarts.io/matches/watch-surface-nodes",
  });
  const timerHarness = createFakeTimerHarness({ now: 3_000 });
  timerHarness.installGlobals();
  timerHarness.installOnWindow(windowRef);
  documentRef.variantElement.textContent = "Cricket";

  const healthyFixture = createHealthyMatchHostFixture(documentRef);
  const observers = createObserverRegistry();
  const listeners = createListenerRegistry();
  const domGuards = createDomGuards({ documentRef });
  const domain = { cricketRules, variantRules };
  const gameState = createGameState();
  const helperScheduler = createImmediateScheduler();
  const config = createFeatureConfig();

  const cleanupHighlighter = initializeCricketTargetHighlighter({
    documentRef,
    windowRef,
    domGuards,
    registries: { observers, listeners },
    gameState,
    domain,
    config,
    helpers: helperScheduler,
    degradedHostGraceMs: 300,
  });

  const cleanupGridFx = initializeCricketGridStatusEffects({
    documentRef,
    windowRef,
    domGuards,
    registries: { observers, listeners },
    gameState,
    domain,
    config,
    helpers: helperScheduler,
    degradedHostGraceMs: 300,
  });

  try {
    assert.equal(countRecoveryNavigations(windowRef), 0);

    healthyFixture.boardShell.remove();
    healthyFixture.rightPane.textContent = "UndoNext2011841361015217319";
    healthyFixture.host.classList.add("css-host-degraded");

    const mutation = [
      {
        type: "attributes",
        attributeName: "class",
        target: healthyFixture.host,
        addedNodes: [],
        removedNodes: [],
      },
    ];

    observers.get("cricket-target-highlighter:dom-observer")?.callback(mutation);
    observers.get("cricket-grid-status-effects:dom-observer")?.callback(mutation);

    assert.equal(countRecoveryNavigations(windowRef), 0);

    timerHarness.advance(317);

    assert.equal(countRecoveryNavigations(windowRef), 1);
    assert.notEqual(
      windowRef.sessionStorage.getItem("adx:cricket-host-recovery:watch-surface-nodes"),
      null
    );
  } finally {
    cleanupGridFx();
    cleanupHighlighter();
    timerHarness.restoreGlobals();
  }
});

test("shared cricket runtime marks ready-to-missing-board gaps as boardGapDeferred", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({
    documentRef,
    href: "https://play.autodarts.io/matches/board-gap-deferred",
  });
  documentRef.variantElement.textContent = "Cricket";

  const healthyFixture = createHealthyMatchHostFixture(documentRef);
  const observers = createObserverRegistry();
  const listenerRegistry = createListenerRegistry();
  const lifecycleEvents = [];
  const sharedRuntime = acquireSharedCricketRuntime({
    documentRef,
    windowRef,
    registries: { observers, listeners: listenerRegistry },
    gameState: createGameState(),
    domain: { cricketRules, variantRules },
    helpers: createImmediateScheduler(),
    degradedHostGraceMs: 300,
  });

  assert.ok(sharedRuntime);
  const unsubscribe = sharedRuntime.subscribe({
    featureKey: "test-board-gap-deferred",
    onRenderState: ({ lifecycle }) => {
      lifecycleEvents.push({
        surfaceStatus: lifecycle.surfaceStatus,
        boardGapDeferred: lifecycle.boardGapDeferred,
        pendingDegradedHostRecheck: lifecycle.pendingDegradedHostRecheck,
        delayedMissingBoardGap: lifecycle.delayedMissingBoardGap,
      });
    },
  });

  try {
    const readyLifecycle = lifecycleEvents.at(-1) || null;
    assert.equal(readyLifecycle?.surfaceStatus, "ready");
    assert.equal(readyLifecycle?.boardGapDeferred, false);

    healthyFixture.boardShell.remove();
    sharedRuntime.scheduler.schedule();

    const deferredLifecycle = lifecycleEvents.at(-1) || null;
    assert.equal(deferredLifecycle?.surfaceStatus, "missing-board");
    assert.equal(deferredLifecycle?.boardGapDeferred, true);
    assert.equal(deferredLifecycle?.pendingDegradedHostRecheck, false);
    assert.equal(deferredLifecycle?.delayedMissingBoardGap, true);
  } finally {
    unsubscribe();
  }
});

test("shared cricket runtime keeps cached grid snapshot for player-state mutations", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({
    documentRef,
    href: "https://play.autodarts.io/matches/preserve-grid-player-state",
  });
  documentRef.variantElement.textContent = "Cricket";

  createHealthyMatchHostFixture(documentRef);
  const observers = createObserverRegistry();
  const listenerRegistry = createListenerRegistry();
  const renderStates = [];
  const sharedRuntime = acquireSharedCricketRuntime({
    documentRef,
    windowRef,
    registries: { observers, listeners: listenerRegistry },
    gameState: createGameState(),
    domain: { cricketRules, variantRules },
    helpers: createImmediateScheduler(),
    degradedHostGraceMs: 300,
  });

  assert.ok(sharedRuntime);
  const unsubscribe = sharedRuntime.subscribe({
    featureKey: "test-preserve-grid-player-state",
    onRenderState: ({ renderState }) => {
      renderStates.push(renderState);
    },
  });

  try {
    const initialGridSnapshot = sharedRuntime.renderCache.grid;
    assert.ok(initialGridSnapshot?.root);
    assert.equal(renderStates.at(-1)?.activePlayerIndex, 0);

    documentRef.activePlayerRow.classList.remove("ad-ext-player-active");
    documentRef.winnerNode.classList.add("ad-ext-player-active");

    const observer = observers.get("cricket-surface:dom-observer");
    assert.ok(observer);
    observer.callback([
      {
        type: "attributes",
        target: documentRef.winnerNode,
        attributeName: "class",
        addedNodes: [],
        removedNodes: [],
      },
    ]);

    assert.equal(sharedRuntime.renderCache.grid, initialGridSnapshot);
    assert.equal(renderStates.at(-1)?.activePlayerIndex, 1);
  } finally {
    unsubscribe();
  }
});

test("shared cricket runtime rediscovers grid snapshot for grid mark mutations", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({
    documentRef,
    href: "https://play.autodarts.io/matches/rediscover-grid-mark",
  });
  documentRef.variantElement.textContent = "Cricket";

  const healthyFixture = createHealthyMatchHostFixture(documentRef);
  const observers = createObserverRegistry();
  const listenerRegistry = createListenerRegistry();
  const sharedRuntime = acquireSharedCricketRuntime({
    documentRef,
    windowRef,
    registries: { observers, listeners: listenerRegistry },
    gameState: createGameState(),
    domain: { cricketRules, variantRules },
    helpers: createImmediateScheduler(),
    degradedHostGraceMs: 300,
  });

  assert.ok(sharedRuntime);
  const unsubscribe = sharedRuntime.subscribe({
    featureKey: "test-rediscover-grid-mark",
    onRenderState: () => {},
  });

  try {
    const initialGridSnapshot = sharedRuntime.renderCache.grid;
    assert.ok(initialGridSnapshot?.root);

    const labelCell = healthyFixture.grid.querySelector(".label-cell");
    const markIcon = documentRef.createElement("img");
    markIcon.setAttribute("alt", "1");
    labelCell.appendChild(markIcon);

    const observer = observers.get("cricket-surface:dom-observer");
    assert.ok(observer);
    observer.callback([
      {
        type: "childList",
        target: labelCell,
        addedNodes: [markIcon],
        removedNodes: [],
      },
    ]);

    assert.notEqual(sharedRuntime.renderCache.grid, initialGridSnapshot);
    assert.equal(sharedRuntime.renderCache.grid?.root, initialGridSnapshot.root);
  } finally {
    unsubscribe();
  }
});

test("cricket highlighter and grid fx audit the surface after throw transitions even without host mutations", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({
    documentRef,
    href: "https://play.autodarts.io/matches/post-throw-audit",
  });
  const timerHarness = createFakeTimerHarness({ now: 4_000 });
  timerHarness.installGlobals();
  timerHarness.installOnWindow(windowRef);
  documentRef.variantElement.textContent = "Cricket";

  const listeners = [];
  const activeThrows = [];
  const gameState = {
    getCricketGameModeNormalized: () => "cricket",
    getCricketGameMode: () => "Cricket",
    getCricketScoringModeNormalized: () => "standard",
    getCricketScoringMode: () => "standard",
    getActivePlayerIndex: () => 0,
    getActiveThrows: () => activeThrows.slice(),
    getActiveTurn: () => null,
    getSnapshot: () => ({
      match: {
        players: [{ id: "player-a" }, { id: "player-b" }],
      },
    }),
    isCricketVariant: () => true,
    subscribe(callback) {
      listeners.push(callback);
      return () => {};
    },
  };

  createHealthyMatchHostFixture(documentRef);
  const observers = createObserverRegistry();
  const listenerRegistry = createListenerRegistry();
  const domGuards = createDomGuards({ documentRef });
  const domain = { cricketRules, variantRules };
  const helperScheduler = createImmediateScheduler();
  const config = createFeatureConfig();

  const cleanupHighlighter = initializeCricketTargetHighlighter({
    documentRef,
    windowRef,
    domGuards,
    registries: { observers, listeners: listenerRegistry },
    gameState,
    domain,
    config,
    helpers: helperScheduler,
    degradedHostGraceMs: 300,
  });

  const cleanupGridFx = initializeCricketGridStatusEffects({
    documentRef,
    windowRef,
    domGuards,
    registries: { observers, listeners: listenerRegistry },
    gameState,
    domain,
    config,
    helpers: helperScheduler,
    degradedHostGraceMs: 300,
  });

  try {
    activeThrows.push({
      value: 20,
      segment: "S20",
      label: "S20",
    });
    listeners.forEach((callback) => callback());

    clearChildren(documentRef.main);
    createDegradedMatchHostFixture(documentRef);

    timerHarness.advance(419);
    assert.equal(countRecoveryNavigations(windowRef), 0);

    timerHarness.advance(318);
    assert.equal(countRecoveryNavigations(windowRef), 1);
    assert.notEqual(
      windowRef.sessionStorage.getItem("adx:cricket-host-recovery:post-throw-audit"),
      null
    );
  } finally {
    cleanupGridFx();
    cleanupHighlighter();
    timerHarness.restoreGlobals();
  }
});

test("cricket highlighter and grid fx re-arm degraded-host recovery after a stable ready phase", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({
    documentRef,
    href: "https://play.autodarts.io/matches/rearm-after-ready",
  });
  const timerHarness = createFakeTimerHarness({ now: 5_000 });
  timerHarness.installGlobals();
  timerHarness.installOnWindow(windowRef);
  documentRef.variantElement.textContent = "Cricket";

  const degradedFixture = createDegradedMatchHostFixture(documentRef);
  const observers = createObserverRegistry();
  const listeners = createListenerRegistry();
  const domGuards = createDomGuards({ documentRef });
  const domain = { cricketRules, variantRules };
  const gameState = createGameState();
  const helperScheduler = createImmediateScheduler();
  const config = createFeatureConfig();

  const cleanupHighlighter = initializeCricketTargetHighlighter({
    documentRef,
    windowRef,
    domGuards,
    registries: { observers, listeners },
    gameState,
    domain,
    config,
    helpers: helperScheduler,
    degradedHostGraceMs: 0,
    degradedHostRecoveryRearmMs: 1_000,
  });

  const cleanupGridFx = initializeCricketGridStatusEffects({
    documentRef,
    windowRef,
    domGuards,
    registries: { observers, listeners },
    gameState,
    domain,
    config,
    helpers: helperScheduler,
    degradedHostGraceMs: 0,
    degradedHostRecoveryRearmMs: 1_000,
  });

  try {
    assert.equal(countRecoveryNavigations(windowRef), 1);
    assert.notEqual(
      windowRef.sessionStorage.getItem("adx:cricket-host-recovery:rearm-after-ready"),
      null
    );

    clearChildren(documentRef.main);
    const healthyFixture = createHealthyMatchHostFixture(documentRef);
    const lifecycleMutation = [
      {
        type: "childList",
        target: documentRef.main,
        addedNodes: [healthyFixture.host],
        removedNodes: [degradedFixture.host],
      },
    ];
    observers.get("cricket-target-highlighter:dom-observer")?.callback(lifecycleMutation);
    observers.get("cricket-grid-status-effects:dom-observer")?.callback(lifecycleMutation);

    timerHarness.advance(999);
    assert.notEqual(
      windowRef.sessionStorage.getItem("adx:cricket-host-recovery:rearm-after-ready"),
      null
    );

    timerHarness.advance(1);
    assert.equal(
      windowRef.sessionStorage.getItem("adx:cricket-host-recovery:rearm-after-ready"),
      null
    );

    clearChildren(documentRef.main);
    const degradedAgainFixture = createDegradedMatchHostFixture(documentRef);
    const degradeAgainMutation = [
      {
        type: "childList",
        target: documentRef.main,
        addedNodes: [degradedAgainFixture.host],
        removedNodes: [healthyFixture.host],
      },
    ];
    observers.get("cricket-target-highlighter:dom-observer")?.callback(degradeAgainMutation);
    observers.get("cricket-grid-status-effects:dom-observer")?.callback(degradeAgainMutation);

    assert.equal(countRecoveryNavigations(windowRef), 2);
  } finally {
    cleanupGridFx();
    cleanupHighlighter();
    timerHarness.restoreGlobals();
  }
});

test("missing-board match gaps use the fallback grace delay even before degraded-host is confirmed", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({
    documentRef,
    href: "https://play.autodarts.io/matches/fallback-gap",
  });
  documentRef.variantElement.textContent = "Cricket";
  const fixture = createHealthyMatchHostFixture(documentRef);

  const readyRenderState = buildCricketRenderState({
    documentRef,
    windowRef,
    gameState: createGameState(),
    cricketRules,
    variantRules,
    cache: { grid: null, board: null },
  });
  assert.equal(readyRenderState?.surfaceStatus, "ready");

  fixture.boardShell.remove();

  const missingBoardRenderState = buildCricketRenderState({
    documentRef,
    windowRef,
    gameState: createGameState(),
    cricketRules,
    variantRules,
    degradedHostGraceMs: 300,
    cache: { grid: null, board: null },
  });

  assert.equal(missingBoardRenderState?.surfaceStatus, "missing-board");
  assert.equal(canDelayMissingMatchBoardGap(missingBoardRenderState), true);
  assert.equal(resolveMissingMatchBoardGapDelay(missingBoardRenderState, { fallbackGraceMs: 300 }), 316);
});
