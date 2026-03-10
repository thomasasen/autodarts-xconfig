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
import { initializeCricketGridFx } from "../../src/features/cricket-grid-fx/index.js";
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
  BADGE_CLASS,
  BADGE_STATE_CLASS,
  DEAD_CLASS,
  DELTA_CLASS,
  HIDDEN_LABEL_ATTRIBUTE,
  LABEL_CLASS,
  LABEL_STATE_CLASS,
  MARK_PROGRESS_CLASS,
  PRESSURE_CLASS,
  ROOT_CLASS,
  ROW_WAVE_CLASS,
  SCORE_CLASS,
  SPARK_CLASS,
  SYNTHETIC_BADGE_ATTRIBUTE,
  THREAT_CLASS,
  WIPE_CLASS,
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

function createMergedLabelMarkCricketGrid(documentRef, marksByLabel) {
  const wrapper = documentRef.createElement("div");
  wrapper.classList.add("chakra-stack");
  const grid = documentRef.createElement("div");
  grid.classList.add("chakra-grid", "css-rfeml4");
  const targetOrder = cricketRules.getTargetOrderByGameMode("cricket");
  const rowStateByLabel = new Map();

  targetOrder.forEach((label, index) => {
    const className = index % 2 === 0 ? "css-1yso2z2" : "css-jpb1ox";
    const labelCell = documentRef.createElement("div");
    labelCell.classList.add(className);
    labelCell.textContent = label === "BULL" ? "Bull" : label;

    const labelText = documentRef.createElement("p");
    labelText.classList.add("chakra-text", "css-1qlemha");
    labelText.textContent = label === "BULL" ? "Bull" : label;
    labelCell.appendChild(labelText);

    const marks = Array.isArray(marksByLabel?.[label]) ? marksByLabel[label] : [0, 0];
    const firstMarks = Number(marks[0] || 0);
    if (firstMarks > 0) {
      const icon = documentRef.createElement("img");
      icon.setAttribute("alt", String(firstMarks));
      labelCell.appendChild(icon);
    }

    const secondCell = documentRef.createElement("div");
    secondCell.classList.add(className);
    const secondMarks = Number(marks[1] || 0);
    if (secondMarks > 0) {
      const icon = documentRef.createElement("img");
      icon.setAttribute("alt", String(secondMarks));
      secondCell.appendChild(icon);
    }

    grid.appendChild(labelCell);
    grid.appendChild(secondCell);
    rowStateByLabel.set(label, {
      labelCell,
      labelText,
      playerCells: [secondCell],
    });
  });

  wrapper.appendChild(grid);
  documentRef.main.appendChild(wrapper);
  return rowStateByLabel;
}

function createGameState(options = {}) {
  const scoringModeNormalized = String(options.scoringModeNormalized || "unknown");
  const scoringMode = String(options.scoringMode || "");
  const activePlayerIndex = Number.isFinite(Number(options.activePlayerIndex))
    ? Number(options.activePlayerIndex)
    : 0;
  const activeThrows = Array.isArray(options.activeThrows) ? options.activeThrows : [];
  const activeTurn = options.activeTurn || null;
  const match = options.match || {
    players: [{ id: "player-a" }, { id: "player-b" }],
  };
  return {
    getCricketGameModeNormalized: () => "cricket",
    getCricketGameMode: () => "Cricket",
    getCricketScoringModeNormalized: () => scoringModeNormalized,
    getCricketScoringMode: () => scoringMode,
    getActivePlayerIndex: () => activePlayerIndex,
    getActiveThrows: () => activeThrows,
    getActiveTurn: () => activeTurn,
    getSnapshot: () => ({ match }),
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
  assert.equal(initialRenderState?.labelCellMarkSourceCount || 0, 0);
  assert.equal(initialRenderState?.shortfallRepairCount || 0, 0);
  assert.equal(visualConfig.showOpenTargets, false);

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
  assert.equal((overlay?.children?.length || 0) > 0, true);
  assert.equal(initialDebugStats.nonOpenTargetCount || 0, 0);
  assert.equal((initialDebugStats.openTargetCount || 0) > 0, true);
  assert.equal(initialDebugStats.renderedOpenTargetCount || 0, 0);
  assert.equal(initialDebugStats.inactiveTargetCount || 0, 14);
  assert.equal(initialDebugStats.shapeCountByPresentation?.inactive || 0, 56);
  assert.equal(initialDebugStats.shapeCountByPresentation?.open || 0, 0);

  const visibleOpenVisualConfig = resolveCricketVisualConfig({
    showOpenTargets: true,
    showDeadTargets: true,
    colorTheme: "standard",
    intensity: "normal",
  });
  const visibleOpenDebugStats = {};
  renderCricketHighlights({
    documentRef,
    visualConfig: visibleOpenVisualConfig,
    renderState: initialRenderState,
    cache: renderCache,
    debugStats: visibleOpenDebugStats,
  });
  assert.equal(visibleOpenDebugStats.openTargetCount || 0, 7);
  assert.equal(visibleOpenDebugStats.renderedOpenTargetCount || 0, 7);
  assert.equal(visibleOpenDebugStats.shapeCountByPresentation?.inactive || 0, 56);
  assert.equal(visibleOpenDebugStats.shapeCountByPresentation?.open || 0, 26);
  assert.equal(overlay?.children?.length || 0, 82);

  const initialGridFxStats = {};
  updateCricketGridFx({
    documentRef,
    cricketRules,
    renderState: initialRenderState,
    state: gridFxState,
    visualConfig: gridFxVisualConfig,
    turnToken: "fallback:0:0",
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
  assert.equal(markedRenderState?.stateMap.get("20")?.boardPresentation, "scoring");
  assert.equal(markedRenderState?.labelCellMarkSourceCount || 0, 0);
  assert.equal(markedRenderState?.shortfallRepairCount || 0, 0);

  const markedDebugStats = {};
  renderCricketHighlights({
    documentRef,
    visualConfig,
    renderState: markedRenderState,
    cache: renderCache,
    debugStats: markedDebugStats,
  });
  assert.equal(markedDebugStats.nonOpenTargetCount || 0, 1);
  assert.equal(markedDebugStats.shapeCountByPresentation?.inactive || 0, 56);
  assert.equal(markedDebugStats.shapeCountByPresentation?.scoring || 0, 4);
  assert.equal(markedDebugStats.renderedShapeCount || 0, 60);

  const hasLabel20Shape = Array.from(overlay?.children || []).some((node) => {
    return String(node?.dataset?.targetLabel || "") === "20";
  });
  assert.equal(hasLabel20Shape, true);
  assert.equal(
    Array.from(overlay?.children || []).filter((node) => {
      return String(node?.dataset?.targetLabel || "") === "20";
    }).every((node) => {
      return node?.classList?.contains("is-scoring") && String(node?.dataset?.targetPresentation || "") === "scoring";
    }),
    true
  );

  const markedGridFxStats = {};
  updateCricketGridFx({
    documentRef,
    cricketRules,
    renderState: markedRenderState,
    state: gridFxState,
    visualConfig: gridFxVisualConfig,
    turnToken: "fallback:0:1",
    debugStats: markedGridFxStats,
  });

  assert.equal(markedGridFxStats.status, "ok");
  assert.equal(markedGridFxStats.offenseRowCount || 0, 1);
  assert.equal((markedGridFxStats.scoreCellCount || 0) > 0, true);
  assert.equal(markedGridFxStats.rowWaveDeltaCount || 0, 1);
  assert.equal((markedGridFxStats.badgeCount || 0) > 0, true);
  assert.equal(playerCell20?.classList?.contains(SCORE_CLASS), true);
  const opponentCell20 = rowsByLabel.get("20")?.playerCells?.[1] || null;
  assert.equal(Boolean(opponentCell20), true);
  assert.equal(documentRef.querySelectorAll(`.${ROW_WAVE_CLASS}`).length, 2);
  assert.equal(Boolean(playerCell20?.querySelector?.(`.${DELTA_CLASS}`)), true);
  assert.equal(Boolean(playerCell20?.querySelector?.(`.${SPARK_CLASS}`)), true);
  assert.equal(playerIcon20?.classList?.contains(MARK_PROGRESS_CLASS), true);

  clearCricketGridFxState(gridFxState);
  clearCricketHighlights(documentRef);

  assert.equal(playerCell20?.classList?.contains(SCORE_CLASS), false);
  assert.equal(Boolean(documentRef.getElementById("ad-ext-cricket-targets")), false);
});

test("theme-like cricket layout does not turn reflected two-hit rows into scoring", () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "Cricket";

  createThemeLikeBoardFixture(documentRef);
  createNumericCricketGrid(documentRef, {
    "20": [0, 0],
    "19": [0, 0],
    "18": [2, 0],
    "17": [0, 0],
    "16": [0, 0],
    "15": [0, 0],
    BULL: [0, 0],
  });

  const visualConfig = resolveCricketVisualConfig({
    showOpenTargets: false,
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
  const gameState = {
    getCricketGameModeNormalized: () => "cricket",
    getCricketGameMode: () => "Cricket",
    getCricketScoringModeNormalized: () => "standard",
    getCricketScoringMode: () => "standard",
    getActivePlayerIndex: () => 0,
    getActiveThrows: () => [
      { segment: { name: "S18" } },
      { segment: { name: "S18" } },
    ],
    getSnapshot: () => ({
      match: {
        players: [{ id: "player-a" }, { id: "player-b" }],
        turns: [
          {
            playerId: "player-a",
            throws: [
              { segment: { name: "S18" } },
              { segment: { name: "S18" } },
            ],
          },
        ],
      },
    }),
  };

  const renderState = buildCricketRenderState({
    documentRef,
    gameState,
    cricketRules,
    variantRules,
    visualConfig,
    cache: renderCache,
  });

  assert.equal(renderState?.marksByLabel["18"].join(","), "2,0");
  assert.equal(renderState?.stateMap.get("18")?.boardPresentation, "open");

  const highlightStats = {};
  renderCricketHighlights({
    documentRef,
    visualConfig,
    renderState,
    cache: renderCache,
    debugStats: highlightStats,
  });
  assert.equal(highlightStats.shapeCountByPresentation?.scoring || 0, 0);

  const gridFxStats = {};
  updateCricketGridFx({
    documentRef,
    cricketRules,
    renderState,
    state: gridFxState,
    visualConfig: gridFxVisualConfig,
    turnToken: "fallback:0:2",
    debugStats: gridFxStats,
  });
  assert.equal(gridFxStats.offenseRowCount || 0, 0);

  clearCricketGridFxState(gridFxState);
  clearCricketHighlights(documentRef);
});

test("cricket highlighter renders full lane geometry for numeric targets and bull geometry", () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "Cricket";

  createThemeLikeBoardFixture(documentRef);
  const rowsByLabel = createNumericCricketGrid(documentRef, {
    "20": [3, 0],
    "19": [0, 0],
    "18": [0, 0],
    "17": [0, 0],
    "16": [0, 0],
    "15": [0, 0],
    BULL: [0, 0],
  });

  const visualConfig = resolveCricketVisualConfig({
    showOpenTargets: false,
    showDeadTargets: true,
    colorTheme: "standard",
    intensity: "normal",
  });
  const renderCache = { grid: null, board: null };
  const gameState = createGameState({
    scoringModeNormalized: "unknown",
    scoringMode: "",
  });

  const laneRenderState = buildCricketRenderState({
    documentRef,
    gameState,
    cricketRules,
    variantRules,
    visualConfig,
    cache: renderCache,
  });

  const laneStats = {};
  renderCricketHighlights({
    documentRef,
    visualConfig,
    renderState: laneRenderState,
    cache: renderCache,
    debugStats: laneStats,
  });

  const overlay = documentRef.getElementById(CRICKET_OVERLAY_ID);
  assert.equal(Boolean(overlay), true);
  assert.equal(laneRenderState?.stateMap.get("20")?.boardPresentation, "scoring");
  const pooledShapeCount = overlay?.children?.length || 0;
  assert.equal(laneStats.renderedShapeCount || 0, 60);
  assert.equal(pooledShapeCount >= (laneStats.renderedShapeCount || 0), true);
  assert.equal(laneStats.shapeCountByTarget?.["20"] || 0, 4);
  assert.equal(laneStats.shapeCountByPresentation?.inactive || 0, 56);
  assert.equal(laneStats.shapeCountByPresentation?.scoring || 0, 4);
  assert.equal(
    Array.from(overlay?.children || [])
      .filter((node) => String(node?.dataset?.targetLabel || "") === "20")
      .every((node) => String(node?.dataset?.targetPresentation || "") === "scoring"),
    true
  );

  const playerIcon20 = rowsByLabel.get("20")?.playerIcons?.[0] || null;
  const playerIconBull = rowsByLabel.get("BULL")?.playerIcons?.[0] || null;
  assert.equal(Boolean(playerIcon20), true);
  assert.equal(Boolean(playerIconBull), true);
  playerIcon20.setAttribute("alt", "0");
  playerIconBull.setAttribute("alt", "3");

  const bullRenderState = buildCricketRenderState({
    documentRef,
    gameState,
    cricketRules,
    variantRules,
    visualConfig,
    cache: renderCache,
  });

  const bullStats = {};
  renderCricketHighlights({
    documentRef,
    visualConfig,
    renderState: bullRenderState,
    cache: renderCache,
    debugStats: bullStats,
  });
  assert.equal(bullRenderState?.stateMap.get("BULL")?.boardPresentation, "scoring");
  assert.equal(bullStats.renderedShapeCount || 0, 58);
  assert.equal(overlay?.children?.length || 0, pooledShapeCount);
  assert.equal(bullStats.shapeCountByTarget?.BULL || 0, 2);
  assert.equal(bullStats.shapeCountByPresentation?.inactive || 0, 56);
  assert.equal(bullStats.shapeCountByPresentation?.scoring || 0, 2);
  assert.equal(
    Array.from(overlay?.children || [])
      .filter((node) => String(node?.dataset?.targetLabel || "") === "BULL")
      .every((node) => String(node?.dataset?.targetPresentation || "") === "scoring"),
    true
  );
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

test("merged label+mark theme layout keeps scoring highlights and grid-fx mapping stable", () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "Cricket";

  createThemeLikeBoardFixture(documentRef);
  const rowsByLabel = createMergedLabelMarkCricketGrid(documentRef, {
    "20": [3, 0],
    "19": [0, 3],
    "18": [3, 0],
    "17": [0, 3],
    "16": [0, 0],
    "15": [3, 3],
    BULL: [0, 0],
  });

  // Simulate layouts that expose only row-relative index tokens on the visible opponent cell.
  Array.from(rowsByLabel.values()).forEach((rowState) => {
    const rowCell = rowState?.playerCells?.[0];
    if (rowCell) {
      rowCell.setAttribute("data-player-index", "0");
    }
  });

  // Simulate a real-world row where the owner mark icon exists but carries no readable alt/token.
  const row18LabelCell = rowsByLabel.get("18")?.labelCell || null;
  const row18LabelIcon = row18LabelCell?.querySelector?.("img") || null;
  row18LabelIcon?.removeAttribute?.("alt");

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
    match: {
      players: [{ id: "player-a" }, { id: "player-b" }],
      turns: [
        {
          playerId: "player-a",
          finishedAt: "2026-03-10T19:00:00.000Z",
          throws: [{ segment: { name: "T18" } }],
        },
      ],
    },
  });

  const renderState = buildCricketRenderState({
    documentRef,
    gameState,
    cricketRules,
    variantRules,
    visualConfig,
    cache: renderCache,
  });

  assert.equal(renderState?.marksByLabel["20"].join(","), "3,0");
  assert.equal(renderState?.stateMap.get("20")?.boardPresentation, "scoring");
  assert.equal(renderState?.stateMap.get("19")?.boardPresentation, "pressure");
  assert.equal(renderState?.stateMap.get("18")?.boardPresentation, "scoring");
  assert.equal(renderState?.stateMap.get("17")?.boardPresentation, "pressure");
  assert.equal(renderState?.stateMap.get("15")?.boardPresentation, "dead");
  assert.equal(Number.isFinite(renderState?.labelDiagnostics?.multiLabelContainerDropCount), true);
  assert.equal((renderState?.labelCellMarkSourceCount || 0) >= 1, true);
  assert.equal(
    Array.isArray(renderState?.labelCellMarkSourceLabels) &&
      renderState.labelCellMarkSourceLabels.includes("20"),
    true
  );
  assert.equal((renderState?.shortfallRepairCount || 0) >= 1, true);
  assert.equal(
    Array.isArray(renderState?.shortfallRepairLabels) &&
      renderState.shortfallRepairLabels.includes("20"),
    true
  );

  const debugStats = {};
  renderCricketHighlights({
    documentRef,
    visualConfig,
    renderState,
    cache: renderCache,
    debugStats,
  });

  const overlay = documentRef.getElementById(CRICKET_OVERLAY_ID);
  assert.equal(Boolean(overlay), true);
  assert.equal(debugStats.nonOpenTargetCount || 0, 5);
  assert.equal((debugStats.renderedShapeCount || 0) > 0, true);

  const has20Shape = Array.from(overlay?.children || []).some((node) => {
    return String(node?.dataset?.targetLabel || "") === "20";
  });
  assert.equal(has20Shape, true);

  const gridFxStats = {};
  updateCricketGridFx({
    documentRef,
    cricketRules,
    renderState,
    state: gridFxState,
    visualConfig: gridFxVisualConfig,
    turnToken: "fallback:0:1",
    debugStats: gridFxStats,
  });

  assert.equal(gridFxStats.status, "ok");
  assert.equal(gridFxStats.offenseRowCount || 0, 4);
  assert.equal(gridFxStats.badgeCount || 0, 7);
  const labelCell20 = rowsByLabel.get("20")?.labelCell || null;
  const labelText20 = rowsByLabel.get("20")?.labelText || null;
  const opponentCell20 = rowsByLabel.get("20")?.playerCells?.[0] || null;
  const opponentCell19 = rowsByLabel.get("19")?.playerCells?.[0] || null;
  const opponentCell18 = rowsByLabel.get("18")?.playerCells?.[0] || null;
  const opponentCell17 = rowsByLabel.get("17")?.playerCells?.[0] || null;
  const opponentCell16 = rowsByLabel.get("16")?.playerCells?.[0] || null;
  const opponentCell15 = rowsByLabel.get("15")?.playerCells?.[0] || null;
  const opponentCellBull = rowsByLabel.get("BULL")?.playerCells?.[0] || null;
  assert.equal(Boolean(labelCell20), true);
  assert.equal(Boolean(labelText20), true);
  assert.equal(Boolean(opponentCell20), true);
  assert.equal(Boolean(opponentCell19), true);
  assert.equal(Boolean(opponentCell18), true);
  assert.equal(Boolean(opponentCell17), true);
  assert.equal(Boolean(opponentCell16), true);
  assert.equal(Boolean(opponentCell15), true);
  assert.equal(Boolean(opponentCellBull), true);
  assert.equal(labelCell20?.classList?.contains(LABEL_CLASS), true);
  assert.equal(labelCell20?.classList?.contains(LABEL_STATE_CLASS.scoring), true);
  assert.equal(labelText20?.classList?.contains(BADGE_CLASS), true);
  assert.equal(labelText20?.classList?.contains(BADGE_STATE_CLASS.scoring), true);
  assert.equal(opponentCell20?.classList?.contains(SCORE_CLASS), false);
  assert.equal(opponentCell20?.classList?.contains(THREAT_CLASS), true);
  assert.equal(opponentCell20?.classList?.contains(PRESSURE_CLASS), true);
  assert.equal(opponentCell19?.classList?.contains(SCORE_CLASS), true);
  assert.equal(opponentCell19?.classList?.contains(THREAT_CLASS), false);
  assert.equal(opponentCell19?.classList?.contains(PRESSURE_CLASS), false);
  assert.equal(opponentCell18?.classList?.contains(SCORE_CLASS), false);
  assert.equal(opponentCell18?.classList?.contains(THREAT_CLASS), true);
  assert.equal(opponentCell18?.classList?.contains(PRESSURE_CLASS), true);
  assert.equal(opponentCell17?.classList?.contains(SCORE_CLASS), true);
  assert.equal(opponentCell17?.classList?.contains(THREAT_CLASS), false);
  assert.equal(opponentCell17?.classList?.contains(PRESSURE_CLASS), false);
  assert.equal(opponentCell16?.classList?.contains(SCORE_CLASS), false);
  assert.equal(opponentCell16?.classList?.contains(THREAT_CLASS), false);
  assert.equal(opponentCell16?.classList?.contains(PRESSURE_CLASS), false);
  assert.equal(opponentCell15?.classList?.contains(SCORE_CLASS), false);
  assert.equal(opponentCell15?.classList?.contains(THREAT_CLASS), false);
  assert.equal(opponentCell15?.classList?.contains(PRESSURE_CLASS), false);
  assert.equal(opponentCell15?.classList?.contains(DEAD_CLASS), true);
  assert.equal(opponentCellBull?.classList?.contains(SCORE_CLASS), false);
  assert.equal(opponentCellBull?.classList?.contains(THREAT_CLASS), false);
  assert.equal(opponentCellBull?.classList?.contains(PRESSURE_CLASS), false);
  assert.equal(opponentCellBull?.classList?.contains(DEAD_CLASS), false);

  clearCricketGridFxState(gridFxState);
  clearCricketHighlights(documentRef);
  assert.equal(labelText20?.classList?.contains(BADGE_CLASS), false);
  assert.equal(labelCell20?.classList?.contains(LABEL_CLASS), false);
});

test("cricket grid fx runs in cricket/tactics without requiring theme-cricket hooks", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  documentRef.variantElement.textContent = "Cricket";

  const rowsByLabel = createNumericCricketGrid(documentRef, {
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
    scoringModeNormalized: "standard",
    scoringMode: "standard",
    activeTurn: {
      id: "turn-a",
      playerId: "player-a",
      round: 1,
      turn: 1,
      createdAt: "2026-03-10T20:00:00.000Z",
    },
  });

  const cleanupGridFx = initializeCricketGridFx({
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

  assert.equal(Boolean(documentRef.querySelector(`.${ROOT_CLASS}`)), true);
  const initialLabelCell20 = rowsByLabel.get("20")?.labelCell || null;
  assert.equal(
    Boolean(
      initialLabelCell20?.classList?.contains(BADGE_CLASS) ||
        initialLabelCell20?.querySelector?.(`.${BADGE_CLASS}`)
    ),
    true
  );

  createThemeLikeBoardFixture(documentRef);
  const observer = observers.get("cricket-grid-fx:dom-observer");
  assert.ok(observer);
  observer.callback([
    {
      type: "childList",
      target: documentRef.main,
      addedNodes: [documentRef.querySelector(".ad-ext-theme-content-slot")],
      removedNodes: [],
    },
  ]);

  assert.equal(Boolean(documentRef.querySelector(`.${ROOT_CLASS}`)), true);
  const labelCell20 = rowsByLabel.get("20")?.labelCell || null;
  assert.equal(
    Boolean(
      labelCell20?.classList?.contains(BADGE_CLASS) ||
        labelCell20?.querySelector?.(`.${BADGE_CLASS}`)
    ),
    true
  );

  cleanupGridFx();
  assert.equal(Boolean(documentRef.querySelector(`.${ROOT_CLASS}`)), false);
});

test("cricket highlighter and grid fx pause on /ad-xconfig and resume on match routes", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  documentRef.variantElement.textContent = "Cricket";
  windowRef.history.pushState({}, "", "/ad-xconfig");

  createThemeLikeBoardFixture(documentRef);
  const rowsByLabel = createNumericCricketGrid(documentRef, {
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
    scoringModeNormalized: "standard",
    scoringMode: "standard",
    activeTurn: {
      id: "turn-a",
      playerId: "player-a",
      round: 1,
      turn: 1,
      createdAt: "2026-03-10T20:30:00.000Z",
    },
  });

  const helperScheduler = {
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

  const cleanupHighlighter = initializeCricketHighlighter({
    documentRef,
    windowRef,
    domGuards: createDomGuards({ documentRef }),
    registries: { observers, listeners },
    gameState: {
      ...gameState,
      isCricketVariant: () => true,
      subscribe: () => () => {},
    },
    domain: { cricketRules, variantRules },
    config: {
      getFeatureConfig() {
        return {
          showDeadTargets: true,
          colorTheme: "standard",
          intensity: "normal",
        };
      },
    },
    helpers: helperScheduler,
  });

  const cleanupGridFx = initializeCricketGridFx({
    documentRef,
    windowRef,
    domGuards: createDomGuards({ documentRef }),
    registries: { observers, listeners },
    gameState: {
      ...gameState,
      isCricketVariant: () => true,
      subscribe: () => () => {},
    },
    domain: { cricketRules, variantRules },
    config: {
      getFeatureConfig() {
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
    },
    helpers: helperScheduler,
  });

  assert.equal(Boolean(documentRef.getElementById(CRICKET_OVERLAY_ID)), false);
  assert.equal(Boolean(documentRef.querySelector(`.${ROOT_CLASS}`)), false);
  assert.equal(rowsByLabel.get("20")?.labelCell?.classList?.contains(LABEL_CLASS), false);

  windowRef.history.pushState({}, "", "/lobbies");
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

  assert.equal(Boolean(documentRef.getElementById(CRICKET_OVERLAY_ID)), true);
  assert.equal(Boolean(documentRef.querySelector(`.${ROOT_CLASS}`)), true);

  cleanupGridFx();
  cleanupHighlighter();
});
