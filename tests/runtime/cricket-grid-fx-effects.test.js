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
  DEAD_CLASS,
  DELTA_CLASS,
  HIDDEN_LABEL_ATTRIBUTE,
  LABEL_CLASS,
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

function expectedPresentationByRule(marksByPlayer, playerIndex) {
  const normalized = Array.isArray(marksByPlayer)
    ? marksByPlayer.map((value) => cricketRules.clampMarks(value))
    : [];
  const ownMarks = normalized[playerIndex] || 0;
  const opponents = normalized.filter((_, index) => index !== playerIndex);
  const allClosed = normalized.length > 0 && normalized.every((value) => value >= 3);

  if (allClosed) {
    return "dead";
  }
  if (ownMarks >= 3 && opponents.some((value) => value < 3)) {
    return "scoring";
  }
  if (ownMarks < 3 && opponents.some((value) => value >= 3)) {
    return "pressure";
  }
  return "open";
}

function assertGridCellPresentation(cellNode, expectedPresentation, messagePrefix) {
  const hasScoring = Boolean(cellNode?.classList?.contains(SCORE_CLASS));
  const hasThreat = Boolean(cellNode?.classList?.contains(THREAT_CLASS));
  const hasPressure = Boolean(cellNode?.classList?.contains(PRESSURE_CLASS));
  const hasDead = Boolean(cellNode?.classList?.contains(DEAD_CLASS));

  if (expectedPresentation === "scoring") {
    assert.equal(hasScoring, true, `${messagePrefix} scoring class`);
    assert.equal(hasThreat, false, `${messagePrefix} no threat class`);
    assert.equal(hasPressure, false, `${messagePrefix} no pressure class`);
    assert.equal(hasDead, false, `${messagePrefix} no dead class`);
    return;
  }

  if (expectedPresentation === "pressure") {
    assert.equal(hasScoring, false, `${messagePrefix} no scoring class`);
    assert.equal(hasThreat, true, `${messagePrefix} threat class`);
    assert.equal(hasPressure, true, `${messagePrefix} pressure class`);
    assert.equal(hasDead, false, `${messagePrefix} no dead class`);
    return;
  }

  if (expectedPresentation === "dead") {
    assert.equal(hasScoring, false, `${messagePrefix} no scoring class`);
    assert.equal(hasThreat, false, `${messagePrefix} no threat class`);
    assert.equal(hasPressure, false, `${messagePrefix} no pressure class`);
    assert.equal(hasDead, true, `${messagePrefix} dead class`);
    return;
  }

  assert.equal(hasScoring, false, `${messagePrefix} no scoring class`);
  assert.equal(hasThreat, false, `${messagePrefix} no threat class`);
  assert.equal(hasPressure, false, `${messagePrefix} no pressure class`);
  assert.equal(hasDead, false, `${messagePrefix} no dead class`);
}

function installTransientLabelDiscoveryFilter(gridRoot, suppressedLabels) {
  const originalQuerySelectorAll = gridRoot.querySelectorAll.bind(gridRoot);

  gridRoot.querySelectorAll = (selector) => {
    const results = Array.from(originalQuerySelectorAll(selector));
    if (!(suppressedLabels instanceof Set) || suppressedLabels.size === 0) {
      return results;
    }

    const selectorText = String(selector || "");
    const mayContainLabels = [
      ".label-cell",
      ".chakra-text",
      "[data-row-label]",
      "[data-target-label]",
      "p",
      "div",
      "td",
      "th",
      "span",
      "strong",
      "b",
    ].some((token) => selectorText.includes(token));
    if (!mayContainLabels) {
      return results;
    }

    return results.filter((node) => {
      const normalized = cricketRules.normalizeCricketLabel(
        node?.getAttribute?.("data-row-label") ||
          node?.getAttribute?.("data-target-label") ||
          node?.textContent ||
          ""
      );
      return !suppressedLabels.has(normalized);
    });
  };

  return () => {
    gridRoot.querySelectorAll = originalQuerySelectorAll;
  };
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

function createObjectiveGrid(documentRef, labels, marksByLabel) {
  const table = documentRef.createElement("table");
  table.id = "grid";
  const rowStateByLabel = new Map();

  labels.forEach((rawLabel) => {
    const label = String(rawLabel || "").toUpperCase();
    const row = documentRef.createElement("tr");

    const labelCell = documentRef.createElement("td");
    labelCell.classList.add("label-cell");
    labelCell.textContent = label === "BULL" ? "Bull" : label;
    row.appendChild(labelCell);

    const marks = Array.isArray(marksByLabel?.[label]) ? marksByLabel[label] : [0, 0];
    const playerCells = [];
    marks.forEach((value, index) => {
      const cell = documentRef.createElement("td");
      cell.classList.add("player-cell");
      cell.setAttribute("data-player-index", String(index));
      const icon = documentRef.createElement("img");
      icon.setAttribute("alt", String(value));
      cell.appendChild(icon);
      row.appendChild(cell);
      playerCells.push(cell);
    });

    table.appendChild(row);
    rowStateByLabel.set(label, {
      row,
      labelCell,
      playerCells,
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

function injectTurnPreviewWithCricketLikeText(documentRef) {
  const turnContainer = documentRef.getElementById("ad-ext-turn") || documentRef.turnContainer || null;
  if (!turnContainer) {
    return null;
  }

  turnContainer.replaceChildren();

  const throwNode = documentRef.createElement("div");
  throwNode.classList.add("ad-ext-turn-throw");

  const scoreNode = documentRef.createElement("p");
  scoreNode.classList.add("chakra-text");
  scoreNode.textContent = "36";
  throwNode.appendChild(scoreNode);

  const hitNode = documentRef.createElement("p");
  hitNode.classList.add("chakra-text");
  hitNode.textContent = "D18";
  throwNode.appendChild(hitNode);

  const pressureNode = documentRef.createElement("div");
  pressureNode.classList.add("score");
  pressureNode.textContent = "0";

  turnContainer.appendChild(throwNode);
  turnContainer.appendChild(pressureNode);

  return {
    turnContainer,
    throwNode,
    scoreNode,
    hitNode,
    pressureNode,
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
  const resolveEffectiveBadge = () => {
    const syntheticBadge =
      labelCell20?.querySelector?.(`[${SYNTHETIC_BADGE_ATTRIBUTE}="true"]`) || null;
    return syntheticBadge || labelCell20;
  };
  assert.equal(Boolean(labelCell20), true);
  assert.equal(Boolean(playerCell20), true);
  assert.equal(Boolean(playerIcon20), true);

  const syntheticBadge = labelCell20?.querySelector?.(`[${SYNTHETIC_BADGE_ATTRIBUTE}="true"]`) || null;
  const effectiveBadge = resolveEffectiveBadge();
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
  assert.equal(resolveEffectiveBadge()?.classList?.contains(BADGE_BURST_CLASS), true);

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

test("cricket grid fx backfills missing snapshot rows from grid root in merged discovery layouts", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  documentRef.variantElement.textContent = "Cricket";

  const rowsByLabel = createNumericCricketGrid(documentRef, {
    "20": [3, 0],
    "19": [0, 3],
    "18": [3, 0],
    "17": [0, 3],
    "16": [0, 0],
    "15": [3, 3],
    BULL: [0, 0],
  });

  const visualConfig = resolveCricketGridFxConfig({
    rowWave: false,
    badgeBeacon: true,
    markProgress: false,
    threatEdge: true,
    scoringLane: true,
    deadRowCollapse: true,
    deltaChips: false,
    hitSpark: false,
    roundTransitionWipe: false,
    opponentPressureOverlay: true,
    colorTheme: "standard",
    intensity: "normal",
  });

  const renderState = buildCricketRenderState({
    documentRef,
    gameState: createGameState(0),
    cricketRules,
    variantRules,
    visualConfig,
    cache: { grid: null, board: null },
  });

  const truncatedRows = (renderState?.gridSnapshot?.rows || []).filter((row) => {
    return ["20", "19", "18", "17"].includes(String(row?.label || ""));
  });
  const truncatedRenderState = {
    ...renderState,
    gridSnapshot: {
      ...(renderState?.gridSnapshot || {}),
      rows: truncatedRows,
    },
  };

  const state = createCricketGridFxState(windowRef);
  const debugStats = {};
  updateCricketGridFx({
    documentRef,
    cricketRules,
    renderState: truncatedRenderState,
    state,
    visualConfig,
    turnToken: "fallback:0:0",
    debugStats,
  });

  const opponent20 = rowsByLabel.get("20")?.playerCells?.[1] || null;
  const opponent19 = rowsByLabel.get("19")?.playerCells?.[1] || null;
  const opponent15 = rowsByLabel.get("15")?.playerCells?.[1] || null;
  assert.equal(debugStats.status, "ok");
  assert.equal(debugStats.rowCount, 7);
  assert.equal(Boolean(opponent20?.classList?.contains(THREAT_CLASS)), true);
  assert.equal(Boolean(opponent20?.classList?.contains(PRESSURE_CLASS)), true);
  assert.equal(Boolean(opponent19?.classList?.contains(SCORE_CLASS)), true);
  assert.equal(Boolean(opponent15?.classList?.contains(DEAD_CLASS)), true);

  clearCricketGridFxState(state);
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
  const closedEntry = closedStateMap.get("20");
  closedStateMap.set("20", {
    ...closedEntry,
    boardPresentation: "dead",
    presentation: "dead",
    cellStates: Array.isArray(closedEntry?.cellStates)
      ? closedEntry.cellStates.map((entry) => ({ ...entry, presentation: "dead", dead: true }))
      : closedEntry?.cellStates,
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
  const tacticalEntry = tacticalStateMap.get("20");
  tacticalStateMap.set("20", {
    ...tacticalEntry,
    boardPresentation: "scoring",
    presentation: "scoring",
    cellStates: Array.isArray(tacticalEntry?.cellStates)
      ? tacticalEntry.cellStates.map((entry, index) => ({
          ...entry,
          presentation: index === 0 ? "scoring" : "pressure",
          dead: false,
        }))
      : tacticalEntry?.cellStates,
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

test("cricket grid fx applies scoring-priority state classes on label and badge", () => {
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
  const labelOrBadgeScoring = Boolean(
    labelCell20?.classList?.contains(LABEL_STATE_CLASS.scoring) ||
      labelCell20?.classList?.contains(BADGE_STATE_CLASS.scoring)
  );
  assert.equal(labelOrBadgeScoring, true);
  if (syntheticBadge) {
    assert.equal(syntheticBadge.classList.contains(BADGE_STATE_CLASS.scoring), true);
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

test("cricket grid fx keeps open rows neutral for single and double marks until a close exists", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  documentRef.variantElement.textContent = "Cricket";

  const rowsByLabel = createNumericCricketGrid(documentRef, {
    "20": [3, 0],
    "19": [1, 0],
    "18": [2, 0],
    "17": [0, 0],
    "16": [0, 0],
    "15": [0, 0],
    BULL: [0, 0],
  });

  const visualConfig = resolveCricketGridFxConfig({
    rowWave: false,
    badgeBeacon: true,
    markProgress: false,
    threatEdge: true,
    scoringLane: true,
    deadRowCollapse: true,
    deltaChips: false,
    hitSpark: false,
    roundTransitionWipe: false,
    opponentPressureOverlay: true,
    colorTheme: "standard",
    intensity: "normal",
  });

  const state = createCricketGridFxState(windowRef);
  const renderState = buildCricketRenderState({
    documentRef,
    gameState: createGameState(0, 2, {
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

  [
    ["20", [3, 0]],
    ["19", [1, 0]],
    ["18", [2, 0]],
  ].forEach(([label, marksByPlayer]) => {
    const row = rowsByLabel.get(label);
    assertGridCellPresentation(
      row?.playerCells?.[0] || null,
      expectedPresentationByRule(marksByPlayer, 0),
      `${label} player 0`
    );
    assertGridCellPresentation(
      row?.playerCells?.[1] || null,
      expectedPresentationByRule(marksByPlayer, 1),
      `${label} player 1`
    );
  });

  clearCricketGridFxState(state);
});

test("cricket grid fx never decorates #ad-ext-turn preview cards and keeps 18=X vs 0 neutral", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  documentRef.variantElement.textContent = "Cricket";

  const rowsByLabel = createNumericCricketGrid(documentRef, {
    "20": [3, 0],
    "19": [1, 0],
    "18": [2, 0],
    "17": [0, 0],
    "16": [0, 0],
    "15": [0, 0],
    BULL: [0, 0],
  });

  const turnFixture = injectTurnPreviewWithCricketLikeText(documentRef);
  assert.ok(turnFixture?.turnContainer);

  const visualConfig = resolveCricketGridFxConfig({
    rowWave: false,
    badgeBeacon: true,
    markProgress: false,
    threatEdge: true,
    scoringLane: true,
    deadRowCollapse: true,
    deltaChips: false,
    hitSpark: false,
    roundTransitionWipe: false,
    opponentPressureOverlay: true,
    colorTheme: "standard",
    intensity: "normal",
  });

  const state = createCricketGridFxState(windowRef);
  const renderState = buildCricketRenderState({
    documentRef,
    gameState: createGameState(0, 2, {
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

  assertGridCellPresentation(rowsByLabel.get("20")?.playerCells?.[0] || null, "scoring", "20 player 0");
  assertGridCellPresentation(rowsByLabel.get("20")?.playerCells?.[1] || null, "pressure", "20 player 1");
  assertGridCellPresentation(rowsByLabel.get("19")?.playerCells?.[0] || null, "open", "19 player 0");
  assertGridCellPresentation(rowsByLabel.get("19")?.playerCells?.[1] || null, "open", "19 player 1");
  assertGridCellPresentation(rowsByLabel.get("18")?.playerCells?.[0] || null, "open", "18 player 0");
  assertGridCellPresentation(rowsByLabel.get("18")?.playerCells?.[1] || null, "open", "18 player 1");

  assert.equal(turnFixture.throwNode.classList.contains(LABEL_CLASS), false);
  assert.equal(turnFixture.throwNode.classList.contains(LABEL_STATE_CLASS.scoring), false);
  assert.equal(turnFixture.throwNode.classList.contains(LABEL_STATE_CLASS.pressure), false);
  assert.equal(turnFixture.throwNode.classList.contains(LABEL_STATE_CLASS.dead), false);
  assert.equal(turnFixture.hitNode.classList.contains(BADGE_CLASS), false);
  assert.equal(turnFixture.hitNode.classList.contains(BADGE_STATE_CLASS.scoring), false);
  assert.equal(turnFixture.hitNode.classList.contains(BADGE_STATE_CLASS.pressure), false);
  assert.equal(turnFixture.pressureNode.classList.contains(SCORE_CLASS), false);
  assert.equal(turnFixture.pressureNode.classList.contains(PRESSURE_CLASS), false);
  assert.equal(turnFixture.pressureNode.classList.contains(THREAT_CLASS), false);

  clearCricketGridFxState(state);
});

test("cricket grid fx keeps all rows and owner-perspective classes stable across invalidated partial-discovery updates", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  documentRef.variantElement.textContent = "Cricket";

  const rowsByLabel = createNumericCricketGrid(documentRef, {
    "20": [3, 0],
    "19": [1, 0],
    "18": [2, 0],
    "17": [0, 0],
    "16": [0, 0],
    "15": [0, 0],
    BULL: [0, 0],
  });

  const gridRoot = documentRef.getElementById("grid");
  const suppressedLabels = new Set();
  const restoreDiscovery = installTransientLabelDiscoveryFilter(gridRoot, suppressedLabels);
  const visualConfig = resolveCricketGridFxConfig({
    rowWave: false,
    badgeBeacon: true,
    markProgress: false,
    threatEdge: true,
    scoringLane: true,
    deadRowCollapse: true,
    deltaChips: false,
    hitSpark: false,
    roundTransitionWipe: false,
    opponentPressureOverlay: true,
    colorTheme: "standard",
    intensity: "normal",
  });

  const state = createCricketGridFxState(windowRef);

  [
    [],
    ["19"],
    ["19", "18"],
  ].forEach((labelsToSuppress, index) => {
    suppressedLabels.clear();
    labelsToSuppress.forEach((label) => suppressedLabels.add(label));
    state.renderCache.grid = null;

    const renderState = buildCricketRenderState({
      documentRef,
      gameState: createGameState(0, 2, {
        scoringModeNormalized: "standard",
        scoringMode: "standard",
      }),
      cricketRules,
      variantRules,
      visualConfig,
      cache: state.renderCache,
    });

    const debugStats = {};
    updateCricketGridFx({
      documentRef,
      cricketRules,
      renderState,
      state,
      visualConfig,
      turnToken: `fallback:0:${index}`,
      debugStats,
    });

    assert.equal(debugStats.status, "ok", `stage ${index} status`);
    assert.equal(debugStats.rowCount, 7, `stage ${index} row count`);
    assertGridCellPresentation(
      rowsByLabel.get("20")?.playerCells?.[0] || null,
      "scoring",
      `stage ${index} 20 player 0`
    );
    assertGridCellPresentation(
      rowsByLabel.get("20")?.playerCells?.[1] || null,
      "pressure",
      `stage ${index} 20 player 1`
    );
    assertGridCellPresentation(
      rowsByLabel.get("19")?.playerCells?.[0] || null,
      "open",
      `stage ${index} 19 player 0`
    );
    assertGridCellPresentation(
      rowsByLabel.get("19")?.playerCells?.[1] || null,
      "open",
      `stage ${index} 19 player 1`
    );
    assertGridCellPresentation(
      rowsByLabel.get("18")?.playerCells?.[0] || null,
      "open",
      `stage ${index} 18 player 0`
    );
    assertGridCellPresentation(
      rowsByLabel.get("18")?.playerCells?.[1] || null,
      "open",
      `stage ${index} 18 player 1`
    );
  });

  restoreDiscovery();
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

test("cricket grid fx cell semantics stay stable when active player changes", () => {
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
  const renderStateActive0 = buildCricketRenderState({
    documentRef,
    gameState: createGameState(0, 2, {
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
    renderState: renderStateActive0,
    state,
    visualConfig,
    turnToken: "fallback:0:0",
  });

  const row20 = rowsByLabel.get("20");
  const ownerIsScoringBefore = row20?.playerCells?.[0]?.classList?.contains(SCORE_CLASS);
  const opponentIsPressureBefore = row20?.playerCells?.[1]?.classList?.contains(PRESSURE_CLASS);

  const renderStateActive1 = buildCricketRenderState({
    documentRef,
    gameState: createGameState(1, 2, {
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
    renderState: renderStateActive1,
    state,
    visualConfig,
    turnToken: "fallback:1:0",
  });

  const ownerIsScoringAfter = row20?.playerCells?.[0]?.classList?.contains(SCORE_CLASS);
  const opponentIsPressureAfter = row20?.playerCells?.[1]?.classList?.contains(PRESSURE_CLASS);

  assert.equal(ownerIsScoringBefore, true);
  assert.equal(opponentIsPressureBefore, true);
  assert.equal(ownerIsScoringAfter, true);
  assert.equal(opponentIsPressureAfter, true);

  clearCricketGridFxState(state);
});

test("cricket grid fx uses the same owner-perspective states for tactics objectives", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  documentRef.variantElement.textContent = "Tactics";

  const rowsByLabel = createObjectiveGrid(
    documentRef,
    ["20", "19", "DOUBLE", "TRIPLE", "BULL"],
    {
      "20": [3, 0],
      "19": [0, 3],
      DOUBLE: [3, 0],
      TRIPLE: [0, 3],
      BULL: [3, 3],
    }
  );

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
    gameState: {
      getCricketGameModeNormalized: () => "tactics",
      getCricketGameMode: () => "Tactics",
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
    },
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

  const rowDouble = rowsByLabel.get("DOUBLE");
  const rowTriple = rowsByLabel.get("TRIPLE");
  const rowBull = rowsByLabel.get("BULL");
  assert.equal(rowDouble?.playerCells?.[0]?.classList?.contains(SCORE_CLASS), true);
  assert.equal(rowDouble?.playerCells?.[1]?.classList?.contains(PRESSURE_CLASS), true);
  assert.equal(rowTriple?.playerCells?.[0]?.classList?.contains(PRESSURE_CLASS), true);
  assert.equal(rowTriple?.playerCells?.[1]?.classList?.contains(SCORE_CLASS), true);
  assert.equal(rowBull?.playerCells?.[0]?.classList?.contains(DEAD_CLASS), true);
  assert.equal(rowBull?.playerCells?.[1]?.classList?.contains(DEAD_CLASS), true);

  clearCricketGridFxState(state);
});

test("cricket grid fx keeps 3-player owner colors stable across active-player switches for cricket+tactics rows", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  documentRef.variantElement.textContent = "Tactics";

  const labels = ["20", "19", "18", "DOUBLE", "TRIPLE", "BULL"];
  const marksByLabel = {
    "20": [3, 1, 3],
    "19": [1, 3, 0],
    "18": [2, 0, 1],
    DOUBLE: [0, 3, 2],
    TRIPLE: [3, 0, 0],
    BULL: [3, 3, 3],
  };

  const rowsByLabel = createObjectiveGrid(documentRef, labels, marksByLabel);

  const visualConfig = resolveCricketGridFxConfig({
    rowWave: false,
    badgeBeacon: true,
    markProgress: false,
    threatEdge: true,
    scoringLane: true,
    deadRowCollapse: true,
    deltaChips: false,
    hitSpark: false,
    roundTransitionWipe: false,
    opponentPressureOverlay: true,
    colorTheme: "standard",
    intensity: "normal",
  });

  const createTacticsGameState = (activePlayerIndex) => ({
    getCricketGameModeNormalized: () => "tactics",
    getCricketGameMode: () => "Tactics",
    getCricketScoringModeNormalized: () => "standard",
    getCricketScoringMode: () => "standard",
    getActivePlayerIndex: () => activePlayerIndex,
    getActiveThrows: () => [],
    getActiveTurn: () => null,
    getSnapshot: () => ({
      match: {
        players: [{ id: "player-a" }, { id: "player-b" }, { id: "player-c" }],
      },
    }),
  });

  const state = createCricketGridFxState(windowRef);
  const validateRows = (messageSuffix) => {
    labels.forEach((label) => {
      const marks = marksByLabel[label];
      const row = rowsByLabel.get(label);
      marks.forEach((_, playerIndex) => {
        assertGridCellPresentation(
          row?.playerCells?.[playerIndex] || null,
          expectedPresentationByRule(marks, playerIndex),
          `${label} p${playerIndex} ${messageSuffix}`
        );
      });
    });
  };

  const renderStateActive0 = buildCricketRenderState({
    documentRef,
    gameState: createTacticsGameState(0),
    cricketRules,
    variantRules,
    visualConfig,
    cache: { grid: null, board: null },
  });
  updateCricketGridFx({
    documentRef,
    cricketRules,
    renderState: renderStateActive0,
    state,
    visualConfig,
    turnToken: "fallback:0:0",
  });
  validateRows("active0");

  const renderStateActive2 = buildCricketRenderState({
    documentRef,
    gameState: createTacticsGameState(2),
    cricketRules,
    variantRules,
    visualConfig,
    cache: { grid: null, board: null },
  });
  updateCricketGridFx({
    documentRef,
    cricketRules,
    renderState: renderStateActive2,
    state,
    visualConfig,
    turnToken: "fallback:2:0",
  });
  validateRows("active2");

  clearCricketGridFxState(state);
});

test("cricket grid fx multi-round color scenarios keep owner perspective, including DEAD when all players close", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  documentRef.variantElement.textContent = "Cricket";

  const marksByLabel = {
    "20": [0, 0],
    "19": [0, 0],
    "18": [0, 0],
    "17": [0, 0],
    "16": [0, 0],
    "15": [0, 0],
    BULL: [0, 0],
  };
  const rowsByLabel = createNumericCricketGrid(documentRef, marksByLabel);

  const visualConfig = resolveCricketGridFxConfig({
    rowWave: false,
    badgeBeacon: false,
    markProgress: true,
    threatEdge: true,
    scoringLane: true,
    deadRowCollapse: true,
    deltaChips: false,
    hitSpark: false,
    roundTransitionWipe: false,
    opponentPressureOverlay: true,
    colorTheme: "standard",
    intensity: "normal",
  });

  const setRowMarks = (label, marks) => {
    const row = rowsByLabel.get(label);
    (marks || []).forEach((mark, playerIndex) => {
      const normalized = cricketRules.clampMarks(mark);
      row?.playerIcons?.[playerIndex]?.setAttribute("alt", String(normalized));
    });
  };

  const state = createCricketGridFxState(windowRef);
  const rounds = [
    { name: "r1-open", marks: { "20": [0, 0], "19": [0, 0] } },
    { name: "r2-slash-open", marks: { "20": [1, 0], "19": [0, 0] } },
    { name: "r3-x-open", marks: { "20": [2, 0], "19": [0, 0] } },
    { name: "r4-scoring-pressure", marks: { "20": [3, 0], "19": [0, 0] } },
    { name: "r5-dead", marks: { "20": [3, 3], "19": [0, 0] } },
  ];

  rounds.forEach((round, roundIndex) => {
    Object.entries(round.marks).forEach(([label, marks]) => {
      marksByLabel[label] = marks.slice();
      setRowMarks(label, marks);
    });

    [0, 1].forEach((activePlayerIndex) => {
      const renderState = buildCricketRenderState({
        documentRef,
        gameState: createGameState(activePlayerIndex, 2, {
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
        turnToken: `round:${roundIndex}:active:${activePlayerIndex}`,
      });

      ["20", "19"].forEach((label) => {
        const row = rowsByLabel.get(label);
        const marks = marksByLabel[label];
        marks.forEach((_, playerIndex) => {
          assertGridCellPresentation(
            row?.playerCells?.[playerIndex] || null,
            expectedPresentationByRule(marks, playerIndex),
            `${round.name} ${label} p${playerIndex} active${activePlayerIndex}`
          );
        });
      });
    });
  });

  clearCricketGridFxState(state);
});
