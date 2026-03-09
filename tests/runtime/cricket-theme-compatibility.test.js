import test from "node:test";
import assert from "node:assert/strict";

import * as cricketRules from "../../src/domain/cricket-rules.js";
import * as variantRules from "../../src/domain/variant-rules.js";
import {
  buildCricketRenderState,
  clearCricketHighlights,
  renderCricketHighlights,
} from "../../src/features/cricket-highlighter/logic.js";
import { initializeCricketHighlighter } from "../../src/features/cricket-highlighter/index.js";
import {
  OVERLAY_ID as CRICKET_OVERLAY_ID,
  STYLE_ID as CRICKET_STYLE_ID,
  resolveCricketVisualConfig,
} from "../../src/features/cricket-highlighter/style.js";
import { createDomGuards } from "../../src/core/dom-guards.js";
import { createObserverRegistry } from "../../src/core/observer-registry.js";
import { createListenerRegistry } from "../../src/core/listener-registry.js";
import {
  clearCricketGridFxState,
  createCricketGridFxState,
  updateCricketGridFx,
} from "../../src/features/cricket-grid-fx/logic.js";
import {
  SCORE_CLASS,
  resolveCricketGridFxConfig,
} from "../../src/features/cricket-grid-fx/style.js";
import { FakeDocument, createFakeWindow } from "./fake-dom.js";

function createThemeLikeBoardFixture(documentRef) {
  const contentSlot = documentRef.createElement("div");
  const contentLeft = documentRef.createElement("div");
  const contentBoard = documentRef.createElement("div");
  const playerDisplay = documentRef.createElement("div");
  const boardPanel = documentRef.createElement("div");
  const boardControls = documentRef.createElement("div");
  const boardViewport = documentRef.createElement("div");
  const boardCanvas = documentRef.createElement("div");
  const boardSvg = documentRef.createElementNS("http://www.w3.org/2000/svg", "svg");

  contentSlot.classList.add("ad-ext-theme-content-slot");
  contentLeft.classList.add("ad-ext-theme-content-left");
  contentBoard.classList.add("ad-ext-theme-content-board");
  boardPanel.classList.add("ad-ext-theme-board-panel");
  boardControls.classList.add("ad-ext-theme-board-controls");
  boardViewport.classList.add("ad-ext-theme-board-viewport");
  boardCanvas.classList.add("ad-ext-theme-board-canvas", "showAnimations");
  boardSvg.classList.add("ad-ext-theme-board-svg");

  playerDisplay.id = "ad-ext-player-display";
  boardSvg.setAttribute("viewBox", "0 0 1000 1000");

  const outerRing = documentRef.createElementNS("http://www.w3.org/2000/svg", "circle");
  outerRing.setAttribute("r", "500");
  boardSvg.appendChild(outerRing);

  for (let value = 1; value <= 20; value += 1) {
    const labelNode = documentRef.createElementNS("http://www.w3.org/2000/svg", "text");
    labelNode.textContent = String(value);
    boardSvg.appendChild(labelNode);
  }

  boardCanvas.appendChild(boardSvg);
  boardViewport.appendChild(boardCanvas);
  boardPanel.appendChild(boardControls);
  boardPanel.appendChild(boardViewport);
  contentBoard.appendChild(boardPanel);
  contentLeft.appendChild(playerDisplay);
  contentSlot.appendChild(contentLeft);
  contentSlot.appendChild(contentBoard);
  documentRef.main.appendChild(contentSlot);
}

function createNumericCricketGrid(documentRef, marksByLabel) {
  const table = documentRef.createElement("table");
  table.id = "grid";
  const targetOrder = cricketRules.getTargetOrderByGameMode("cricket");
  const rowStateByLabel = new Map();

  targetOrder.forEach((label) => {
    const row = documentRef.createElement("tr");

    const labelCell = documentRef.createElement("td");
    labelCell.classList.add("label-cell");
    labelCell.textContent = label === "BULL" ? "Bull" : label;
    row.appendChild(labelCell);

    const marks = Array.isArray(marksByLabel?.[label]) ? marksByLabel[label] : [0, 0];
    const playerCells = [];
    const playerIcons = [];
    marks.forEach((value, index) => {
      const cell = documentRef.createElement("td");
      cell.classList.add("player-cell");
      cell.setAttribute("data-player-index", String(index));
      const icon = documentRef.createElement("img");
      icon.setAttribute("alt", String(value));
      cell.appendChild(icon);
      row.appendChild(cell);
      playerCells.push(cell);
      playerIcons.push(icon);
    });

    table.appendChild(row);
    rowStateByLabel.set(label, {
      row,
      labelCell,
      playerCells,
      playerIcons,
    });
  });

  documentRef.main.appendChild(table);
  return rowStateByLabel;
}

function createGameState(options = {}) {
  const scoringModeNormalized = String(options.scoringModeNormalized || "unknown");
  const scoringMode = String(options.scoringMode || "");
  return {
    getCricketGameModeNormalized: () => "cricket",
    getCricketGameMode: () => "Cricket",
    getCricketScoringModeNormalized: () => scoringModeNormalized,
    getCricketScoringMode: () => scoringMode,
    getActivePlayerIndex: () => 0,
    getActiveThrows: () => [],
    getSnapshot: () => ({ match: { players: [{ id: "player-a" }, { id: "player-b" }] } }),
  };
}

test("theme-like cricket layout keeps highlighter and grid-fx stable with numeric labels and unknown scoring fallback", () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "Cricket";

  createThemeLikeBoardFixture(documentRef);
  const rowsByLabel = createNumericCricketGrid(documentRef, {
    "20": [0, 0],
    "19": [0, 0],
    "18": [0, 0],
    "17": [0, 0],
    "16": [0, 0],
    "15": [0, 0],
    BULL: [0, 0],
  });

  const visualConfig = resolveCricketVisualConfig({
    showDeadTargets: true,
    colorTheme: "standard",
    intensity: "normal",
  });
  const gridFxVisualConfig = resolveCricketGridFxConfig({
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
  });
  const renderCache = { grid: null, board: null };
  const gridFxState = createCricketGridFxState();
  const gameState = createGameState({
    scoringModeNormalized: "unknown",
    scoringMode: "",
  });

  const initialRenderState = buildCricketRenderState({
    documentRef,
    gameState,
    cricketRules,
    variantRules,
    visualConfig,
    cache: renderCache,
  });

  assert.equal(initialRenderState?.scoringModeRaw, "unknown");
  assert.equal(initialRenderState?.scoringModeNormalized, "standard");
  assert.equal(initialRenderState?.scoringModeSource, "fallback-standard-for-unknown");
  assert.equal(initialRenderState?.marksByLabel["20"].join(","), "0,0");
  assert.equal(initialRenderState?.stateMap.get("20")?.boardPresentation, "open");

  const initialDebugStats = {};
  assert.equal(
    renderCricketHighlights({
      documentRef,
      visualConfig,
      renderState: initialRenderState,
      cache: renderCache,
      debugStats: initialDebugStats,
    }),
    true
  );

  const overlay = documentRef.getElementById("ad-ext-cricket-targets");
  assert.equal(Boolean(overlay), true);
  assert.equal(overlay?.children?.length || 0, 0);
  assert.equal(initialDebugStats.nonOpenTargetCount || 0, 0);

  const initialGridFxStats = {};
  updateCricketGridFx({
    documentRef,
    cricketRules,
    renderState: initialRenderState,
    state: gridFxState,
    visualConfig: gridFxVisualConfig,
    debugStats: initialGridFxStats,
  });
  assert.equal(initialGridFxStats.status, "ok");
  assert.equal(initialGridFxStats.offenseRowCount || 0, 0);
  assert.equal(documentRef.querySelectorAll(`.${SCORE_CLASS}`).length, 0);

  const playerCell20 = rowsByLabel.get("20")?.playerCells?.[0] || null;
  const playerIcon20 = rowsByLabel.get("20")?.playerIcons?.[0] || null;
  assert.equal(Boolean(playerCell20), true);
  assert.equal(Boolean(playerIcon20), true);
  playerIcon20.setAttribute("alt", "3");

  const markedRenderState = buildCricketRenderState({
    documentRef,
    gameState,
    cricketRules,
    variantRules,
    visualConfig,
    cache: renderCache,
  });

  assert.equal(markedRenderState?.marksByLabel["20"].join(","), "3,0");
  assert.equal(markedRenderState?.scoringModeNormalized, "standard");
  assert.equal(markedRenderState?.stateMap.get("20")?.boardPresentation, "offense");

  const markedDebugStats = {};
  renderCricketHighlights({
    documentRef,
    visualConfig,
    renderState: markedRenderState,
    cache: renderCache,
    debugStats: markedDebugStats,
  });
  assert.equal(markedDebugStats.nonOpenTargetCount || 0, 1);
  assert.equal((markedDebugStats.renderedShapeCount || 0) > 0, true);

  const hasLabel20Shape = Array.from(overlay?.children || []).some((node) => {
    return String(node?.dataset?.targetLabel || "") === "20";
  });
  assert.equal(hasLabel20Shape, true);

  const markedGridFxStats = {};
  updateCricketGridFx({
    documentRef,
    cricketRules,
    renderState: markedRenderState,
    state: gridFxState,
    visualConfig: gridFxVisualConfig,
    debugStats: markedGridFxStats,
  });

  assert.equal(markedGridFxStats.status, "ok");
  assert.equal(markedGridFxStats.offenseRowCount || 0, 1);
  assert.equal((markedGridFxStats.scoreCellCount || 0) > 0, true);
  assert.equal(playerCell20?.classList?.contains(SCORE_CLASS), true);

  clearCricketGridFxState(gridFxState);
  clearCricketHighlights(documentRef);

  assert.equal(playerCell20?.classList?.contains(SCORE_CLASS), false);
  assert.equal(Boolean(documentRef.getElementById("ad-ext-cricket-targets")), false);
});

test("theme-like cricket highlighter restores overlay after external removal and cleanup stays clean", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  documentRef.variantElement.textContent = "Cricket";

  createThemeLikeBoardFixture(documentRef);
  createNumericCricketGrid(documentRef, {
    "20": [3, 0],
    "19": [0, 0],
    "18": [0, 0],
    "17": [0, 0],
    "16": [0, 0],
    "15": [0, 0],
    BULL: [0, 0],
  });

  const observers = createObserverRegistry();
  const listeners = createListenerRegistry();
  const gameState = createGameState({
    scoringModeNormalized: "unknown",
    scoringMode: "",
  });

  const cleanupHighlighter = initializeCricketHighlighter({
    documentRef,
    windowRef,
    domGuards: createDomGuards({ documentRef }),
    registries: {
      observers,
      listeners,
    },
    gameState: {
      ...gameState,
      isCricketVariant: () => true,
      subscribe: () => () => {},
    },
    domain: {
      cricketRules,
      variantRules,
    },
    config: {
      getFeatureConfig() {
        return {
          showDeadTargets: true,
          colorTheme: "standard",
          intensity: "normal",
          debug: true,
        };
      },
    },
    helpers: {
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
    },
  });

  const initialOverlay = documentRef.getElementById(CRICKET_OVERLAY_ID);
  assert.equal(Boolean(initialOverlay), true);
  assert.equal((initialOverlay?.children?.length || 0) > 0, true);

  initialOverlay.parentNode?.removeChild(initialOverlay);

  const observer = observers.get("cricket-highlighter:dom-observer");
  assert.ok(observer);
  observer.callback([
    {
      type: "childList",
      target: documentRef.main,
      addedNodes: [documentRef.createElement("div")],
      removedNodes: [initialOverlay],
    },
  ]);

  const restoredOverlay = documentRef.getElementById(CRICKET_OVERLAY_ID);
  assert.equal(Boolean(restoredOverlay), true);
  assert.equal((restoredOverlay?.children?.length || 0) > 0, true);

  cleanupHighlighter();

  assert.equal(Boolean(documentRef.getElementById(CRICKET_OVERLAY_ID)), false);
  assert.equal(Boolean(documentRef.getElementById(CRICKET_STYLE_ID)), false);
});
