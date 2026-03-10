import test from "node:test";
import assert from "node:assert/strict";

import * as cricketRules from "../../src/domain/cricket-rules.js";
import * as variantRules from "../../src/domain/variant-rules.js";
import { buildCricketRenderState } from "../../src/features/cricket-highlighter/logic.js";
import {
  clearCricketGridFxState,
  createCricketGridFxState,
  updateCricketGridFx,
} from "../../src/features/cricket-grid-fx/logic.js";
import {
  BADGE_BURST_CLASS,
  BADGE_CLASS,
  BADGE_STATE_CLASS,
  DELTA_CLASS,
  HIDDEN_LABEL_ATTRIBUTE,
  LABEL_STATE_CLASS,
  MARK_L2_CLASS,
  MARK_PROGRESS_CLASS,
  PRESSURE_CLASS,
  ROW_WAVE_CLASS,
  SCORE_CLASS,
  SPARK_CLASS,
  SYNTHETIC_BADGE_ATTRIBUTE,
  THREAT_CLASS,
  WIPE_CLASS,
  resolveCricketGridFxConfig,
} from "../../src/features/cricket-grid-fx/style.js";
import { FakeDocument, createFakeWindow } from "./fake-dom.js";

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

function createGameState(activePlayerIndex = 0, playerCount = 2, options = {}) {
  const scoringModeNormalized = String(options.scoringModeNormalized || "unknown");
  const scoringMode = String(options.scoringMode || "");
  return {
    getCricketGameModeNormalized: () => "cricket",
    getCricketGameMode: () => "Cricket",
    getCricketScoringModeNormalized: () => scoringModeNormalized,
    getCricketScoringMode: () => scoringMode,
    getActivePlayerIndex: () => activePlayerIndex,
    getActiveThrows: () => [],
    getActiveTurn: () => null,
    getSnapshot: () => ({
      match: {
        players: Array.from({ length: Math.max(1, Number(playerCount) || 0) }, (_, index) => ({
          id: `player-${index + 1}`,
        })),
      },
    }),
  };
}

test("cricket grid fx restores legacy badge and transient feedback effects on plain label cells", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  documentRef.variantElement.textContent = "Cricket";

  const rowsByLabel = createNumericCricketGrid(documentRef, {
    "20": [0, 0],
    "19": [0, 0],
    "18": [0, 0],
    "17": [0, 0],
    "16": [0, 0],
    "15": [0, 0],
    BULL: [0, 0],
  });

  const visualConfig = resolveCricketGridFxConfig({
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

  const state = createCricketGridFxState(windowRef);
  const renderCache = { grid: null, board: null };

  const initialRenderState = buildCricketRenderState({
    documentRef,
    gameState: createGameState(0),
    cricketRules,
    variantRules,
    visualConfig,
    cache: renderCache,
  });

  updateCricketGridFx({
    documentRef,
    cricketRules,
    renderState: initialRenderState,
    state,
    visualConfig,
    turnToken: "fallback:0:0",
  });

  const labelCell20 = rowsByLabel.get("20")?.labelCell || null;
  const playerCell20 = rowsByLabel.get("20")?.playerCells?.[0] || null;
  const playerIcon20 = rowsByLabel.get("20")?.playerIcons?.[0] || null;
  assert.equal(Boolean(labelCell20), true);
  assert.equal(Boolean(playerCell20), true);
  assert.equal(Boolean(playerIcon20), true);

  const syntheticBadge = labelCell20?.querySelector?.(`[${SYNTHETIC_BADGE_ATTRIBUTE}="true"]`) || null;
  const effectiveBadge = syntheticBadge || labelCell20;
  assert.equal(Boolean(effectiveBadge), true);
  assert.equal(effectiveBadge?.classList?.contains(BADGE_CLASS), true);
  if (syntheticBadge) {
    assert.equal(labelCell20?.getAttribute?.(HIDDEN_LABEL_ATTRIBUTE), "true");
  }

  playerIcon20.setAttribute("alt", "2");
  const increasedRenderState = buildCricketRenderState({
    documentRef,
    gameState: createGameState(0),
    cricketRules,
    variantRules,
    visualConfig,
    cache: renderCache,
  });

  updateCricketGridFx({
    documentRef,
    cricketRules,
    renderState: increasedRenderState,
    state,
    visualConfig,
    turnToken: "fallback:0:2",
  });

  const deltaChip = playerCell20?.querySelector?.(`.${DELTA_CLASS}`) || null;
  assert.equal(Boolean(deltaChip), true);
  assert.equal(deltaChip?.textContent, "+2");
  assert.equal(Boolean(playerCell20?.querySelector?.(`.${SPARK_CLASS}`)), true);
  assert.equal(documentRef.querySelectorAll(`.${ROW_WAVE_CLASS}`).length, 2);
  assert.equal(playerIcon20?.classList?.contains(MARK_PROGRESS_CLASS), true);
  assert.equal(playerIcon20?.classList?.contains(MARK_L2_CLASS), true);
  assert.equal(effectiveBadge?.classList?.contains(BADGE_BURST_CLASS), true);

  updateCricketGridFx({
    documentRef,
    cricketRules,
    renderState: increasedRenderState,
    state,
    visualConfig,
    turnToken: "fallback:0:0",
  });

  assert.equal(Boolean(documentRef.querySelector(`.${WIPE_CLASS}`)), true);

  clearCricketGridFxState(state);

  if (syntheticBadge) {
    assert.equal(Boolean(labelCell20?.querySelector?.(`[${SYNTHETIC_BADGE_ATTRIBUTE}="true"]`)), false);
    assert.equal(labelCell20?.getAttribute?.(HIDDEN_LABEL_ATTRIBUTE), null);
  }
  assert.equal(Boolean(documentRef.querySelector(`.${DELTA_CLASS}`)), false);
  assert.equal(Boolean(documentRef.querySelector(`.${SPARK_CLASS}`)), false);
  assert.equal(Boolean(documentRef.querySelector(`.${ROW_WAVE_CLASS}`)), false);
  assert.equal(Boolean(documentRef.querySelector(`.${WIPE_CLASS}`)), false);
  assert.equal(playerIcon20?.classList?.contains(MARK_PROGRESS_CLASS), false);
});

test("cricket grid fx pulses rows only for mark increases or tactical transitions", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  documentRef.variantElement.textContent = "Cricket";

  createNumericCricketGrid(documentRef, {
    "20": [0, 0],
    "19": [0, 0],
    "18": [0, 0],
    "17": [0, 0],
    "16": [0, 0],
    "15": [0, 0],
    BULL: [0, 0],
  });

  const visualConfig = resolveCricketGridFxConfig({
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

  const state = createCricketGridFxState(windowRef);
  const renderCache = { grid: null, board: null };
  const baseRenderState = buildCricketRenderState({
    documentRef,
    gameState: createGameState(0),
    cricketRules,
    variantRules,
    visualConfig,
    cache: renderCache,
  });

  updateCricketGridFx({
    documentRef,
    cricketRules,
    renderState: baseRenderState,
    state,
    visualConfig,
    turnToken: "fallback:0:0",
  });

  const closedStateMap = new Map(baseRenderState.stateMap);
  closedStateMap.set("20", {
    ...closedStateMap.get("20"),
    boardPresentation: "closed",
    presentation: "closed",
  });

  updateCricketGridFx({
    documentRef,
    cricketRules,
    renderState: {
      ...baseRenderState,
      stateMap: closedStateMap,
    },
    state,
    visualConfig,
    turnToken: "fallback:0:0",
  });

  assert.equal(documentRef.querySelectorAll(`.${ROW_WAVE_CLASS}`).length, 0);

  const tacticalStateMap = new Map(closedStateMap);
  tacticalStateMap.set("20", {
    ...tacticalStateMap.get("20"),
    boardPresentation: "danger",
    presentation: "danger",
  });

  updateCricketGridFx({
    documentRef,
    cricketRules,
    renderState: {
      ...baseRenderState,
      stateMap: tacticalStateMap,
    },
    state,
    visualConfig,
    turnToken: "fallback:0:0",
  });

  assert.equal(documentRef.querySelectorAll(`.${ROW_WAVE_CLASS}`).length, 2);
  assert.equal(Boolean(documentRef.querySelector(`.${DELTA_CLASS}`)), false);
  assert.equal(Boolean(documentRef.querySelector(`.${BADGE_BURST_CLASS}`)), false);

  clearCricketGridFxState(state);
});

test("cricket grid fx applies dedicated pressure state classes on label and badge", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  documentRef.variantElement.textContent = "Cricket";

  const rowsByLabel = createNumericCricketGrid(documentRef, {
    "20": [0, 3],
    "19": [0, 0],
    "18": [0, 0],
    "17": [0, 0],
    "16": [0, 0],
    "15": [0, 0],
    BULL: [0, 0],
  });

  const visualConfig = resolveCricketGridFxConfig({
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

  const state = createCricketGridFxState(windowRef);
  const renderState = buildCricketRenderState({
    documentRef,
    gameState: createGameState(0),
    cricketRules,
    variantRules,
    visualConfig,
    cache: { grid: null, board: null },
  });

  updateCricketGridFx({
    documentRef,
    cricketRules,
    renderState,
    state,
    visualConfig,
    turnToken: "fallback:0:0",
  });

  const labelCell20 = rowsByLabel.get("20")?.labelCell || null;
  const syntheticBadge =
    labelCell20?.querySelector?.(`[${SYNTHETIC_BADGE_ATTRIBUTE}="true"]`) || null;
  const labelOrBadgePressure = Boolean(
    labelCell20?.classList?.contains(LABEL_STATE_CLASS.pressure) ||
      labelCell20?.classList?.contains(BADGE_STATE_CLASS.pressure)
  );
  assert.equal(labelOrBadgePressure, true);
  if (syntheticBadge) {
    assert.equal(syntheticBadge.classList.contains(BADGE_STATE_CLASS.pressure), true);
  }

  clearCricketGridFxState(state);
});

test("cricket grid fx colors scoring owner green and open opponents red", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  documentRef.variantElement.textContent = "Cricket";

  const rowsByLabel = createNumericCricketGrid(documentRef, {
    "20": [3, 0, 0],
    "19": [0, 0, 0],
    "18": [0, 0, 0],
    "17": [0, 0, 0],
    "16": [0, 0, 0],
    "15": [0, 0, 0],
    BULL: [0, 0, 0],
  });

  const visualConfig = resolveCricketGridFxConfig({
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

  const state = createCricketGridFxState(windowRef);
  const renderState = buildCricketRenderState({
    documentRef,
    gameState: createGameState(0, 3, {
      scoringModeNormalized: "standard",
      scoringMode: "standard",
    }),
    cricketRules,
    variantRules,
    visualConfig,
    cache: { grid: null, board: null },
  });

  updateCricketGridFx({
    documentRef,
    cricketRules,
    renderState,
    state,
    visualConfig,
    turnToken: "fallback:0:0",
  });

  const row20 = rowsByLabel.get("20");
  assert.equal(row20?.playerCells?.[0]?.classList?.contains(SCORE_CLASS), true);
  assert.equal(row20?.playerCells?.[0]?.classList?.contains(THREAT_CLASS), false);
  assert.equal(row20?.playerCells?.[1]?.classList?.contains(SCORE_CLASS), false);
  assert.equal(row20?.playerCells?.[1]?.classList?.contains(THREAT_CLASS), true);
  assert.equal(row20?.playerCells?.[1]?.classList?.contains(PRESSURE_CLASS), true);
  assert.equal(row20?.playerCells?.[2]?.classList?.contains(SCORE_CLASS), false);
  assert.equal(row20?.playerCells?.[2]?.classList?.contains(THREAT_CLASS), true);
  assert.equal(row20?.playerCells?.[2]?.classList?.contains(PRESSURE_CLASS), true);

  clearCricketGridFxState(state);
});

test("cricket grid fx keeps additionally closed opponents out of the red threat state", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  documentRef.variantElement.textContent = "Cricket";

  const rowsByLabel = createNumericCricketGrid(documentRef, {
    "20": [3, 3, 0],
    "19": [0, 0, 0],
    "18": [0, 0, 0],
    "17": [0, 0, 0],
    "16": [0, 0, 0],
    "15": [0, 0, 0],
    BULL: [0, 0, 0],
  });

  const visualConfig = resolveCricketGridFxConfig({
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

  const state = createCricketGridFxState(windowRef);
  const renderState = buildCricketRenderState({
    documentRef,
    gameState: createGameState(0, 3, {
      scoringModeNormalized: "standard",
      scoringMode: "standard",
    }),
    cricketRules,
    variantRules,
    visualConfig,
    cache: { grid: null, board: null },
  });

  updateCricketGridFx({
    documentRef,
    cricketRules,
    renderState,
    state,
    visualConfig,
    turnToken: "fallback:0:0",
  });

  const row20 = rowsByLabel.get("20");
  assert.equal(row20?.playerCells?.[0]?.classList?.contains(SCORE_CLASS), true);
  assert.equal(row20?.playerCells?.[1]?.classList?.contains(SCORE_CLASS), true);
  assert.equal(row20?.playerCells?.[1]?.classList?.contains(THREAT_CLASS), false);
  assert.equal(row20?.playerCells?.[1]?.classList?.contains(PRESSURE_CLASS), false);
  assert.equal(row20?.playerCells?.[2]?.classList?.contains(THREAT_CLASS), true);
  assert.equal(row20?.playerCells?.[2]?.classList?.contains(PRESSURE_CLASS), true);

  clearCricketGridFxState(state);
});
