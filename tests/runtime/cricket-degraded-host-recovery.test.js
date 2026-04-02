import test from "node:test";
import assert from "node:assert/strict";

import * as cricketRules from "../../src/domain/cricket-rules.js";
import * as variantRules from "../../src/domain/variant-rules.js";
import { createDomGuards } from "../../src/core/dom-guards.js";
import { createListenerRegistry } from "../../src/core/listener-registry.js";
import { createObserverRegistry } from "../../src/core/observer-registry.js";
import { initializeCricketGridFx } from "../../src/features/cricket-grid-fx/index.js";
import { ROOT_CLASS } from "../../src/features/cricket-grid-fx/style.js";
import { initializeCricketHighlighter } from "../../src/features/cricket-highlighter/index.js";
import { buildCricketRenderState } from "../../src/features/cricket-highlighter/logic.js";
import { OVERLAY_ID as CRICKET_OVERLAY_ID } from "../../src/features/cricket-highlighter/style.js";
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

function createBoardFixture(documentRef) {
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
  documentRef.main.appendChild(boardShell);
  return boardShell;
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
      if (featureKey === "cricketHighlighter") {
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

  const cleanupHighlighter = initializeCricketHighlighter({
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

  const cleanupGridFx = initializeCricketGridFx({
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
    assert.equal(windowRef.location.__replacedUrls.length, 1);
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

    const highlighterObserver = observers.get("cricket-highlighter:dom-observer");
    const gridFxObserver = observers.get("cricket-grid-fx:dom-observer");
    assert.ok(highlighterObserver);
    assert.ok(gridFxObserver);

    highlighterObserver.callback(mutation);
    gridFxObserver.callback(mutation);

    assert.equal(windowRef.location.__replacedUrls.length, 1);
    assert.equal(Boolean(documentRef.getElementById(CRICKET_OVERLAY_ID)), false);
    assert.equal(Boolean(documentRef.querySelector(`.${ROOT_CLASS}`)), false);
  } finally {
    cleanupGridFx();
    cleanupHighlighter();
  }
});
