import test from "node:test";
import assert from "node:assert/strict";

import * as cricketRules from "../../src/domain/cricket-rules.js";
import * as variantRules from "../../src/domain/variant-rules.js";
import { buildCricketRenderState } from "../../src/features/cricket-highlighter/logic.js";
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

const HIT_SYMBOL_TO_MARKS = Object.freeze({
  "/": 1,
  X: 2,
  "⊗": 3,
});

function presentationToColorName(presentation) {
  if (presentation === "scoring") {
    return "green-striped";
  }
  if (presentation === "pressure") {
    return "red";
  }
  if (presentation === "dead") {
    return "grey";
  }
  return "neutral";
}

function createGrid(documentRef, labels, marksByRow) {
  const table = documentRef.createElement("table");
  table.id = "grid";

  labels.forEach((label) => {
    const row = documentRef.createElement("tr");

    const labelCell = documentRef.createElement("td");
    labelCell.classList.add("label-cell");
    labelCell.setAttribute("data-row-label", label === "BULL" ? "Bull" : String(label));
    labelCell.textContent = label === "BULL" ? "Bull" : `Ziel ${label}`;
    row.appendChild(labelCell);

    const marks = Array.isArray(marksByRow[label]) ? marksByRow[label] : [];
    marks.forEach((value, index) => {
      const cell = documentRef.createElement("td");
      cell.classList.add("player-cell");
      cell.setAttribute("data-player-index", String(index));
      cell.setAttribute("data-marks", String(value));
      cell.textContent = String(value);
      row.appendChild(cell);
    });

    table.appendChild(row);
  });

  documentRef.main.appendChild(table);
  return table;
}

function createMergedLabelCellGrid(documentRef, labels, marksByRow) {
  const wrapper = documentRef.createElement("div");
  wrapper.className = "chakra-stack";
  const grid = documentRef.createElement("div");
  grid.className = "css-rfeml4";

  labels.forEach((label, index) => {
    const className = index % 2 === 0 ? "css-1yso2z2" : "css-jpb1ox";
    const labelCell = documentRef.createElement("div");
    labelCell.className = className;
    const labelText = documentRef.createElement("p");
    labelText.className = "chakra-text css-1qlemha";
    labelText.textContent = label === "BULL" ? "Bull" : label;
    labelCell.appendChild(labelText);

    const marks = Array.isArray(marksByRow[label]) ? marksByRow[label] : [];
    const labelCellMarks = Number(marks[0] || 0);
    if (labelCellMarks > 0) {
      const icon = documentRef.createElement("img");
      icon.setAttribute("alt", String(labelCellMarks));
      labelCell.appendChild(icon);
    }

    const playerCell = documentRef.createElement("div");
    playerCell.className = className;
    const secondMarks = Number(marks[1] || 0);
    if (secondMarks > 0) {
      const icon = documentRef.createElement("img");
      icon.setAttribute("alt", String(secondMarks));
      playerCell.appendChild(icon);
    }

    grid.appendChild(labelCell);
    grid.appendChild(playerCell);
  });

  wrapper.appendChild(grid);
  documentRef.main.appendChild(wrapper);
  return grid;
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

function setDomActivePlayer(documentRef, activeIndex) {
  documentRef.activePlayerRow.classList.remove("ad-ext-player-active");
  documentRef.winnerNode.classList.remove("ad-ext-player-active");

  if (activeIndex === 0) {
    documentRef.activePlayerRow.classList.add("ad-ext-player-active");
  } else if (activeIndex === 1) {
    documentRef.winnerNode.classList.add("ad-ext-player-active");
  }
}

function createGameState(overrides = {}) {
  const match = overrides.match || null;

  return {
    getCricketGameModeNormalized: overrides.getCricketGameModeNormalized,
    getCricketGameMode: overrides.getCricketGameMode,
    getCricketScoringModeNormalized: overrides.getCricketScoringModeNormalized,
    getCricketScoringMode: overrides.getCricketScoringMode,
    getCricketMode: overrides.getCricketMode,
    getActivePlayerIndex: overrides.getActivePlayerIndex || (() => 0),
    getActiveTurn: overrides.getActiveTurn || (() => null),
    getActiveThrows: overrides.getActiveThrows || (() => []),
    getSnapshot: overrides.getSnapshot || (() => ({ match })),
  };
}

function injectTurnPreviewWithCricketLikeText(documentRef) {
  const turnContainer = documentRef.getElementById("ad-ext-turn") || documentRef.turnContainer || null;
  if (!turnContainer) {
    return null;
  }

  turnContainer.replaceChildren();

  const buildThrow = (valueText, hitText) => {
    const throwNode = documentRef.createElement("div");
    throwNode.classList.add("ad-ext-turn-throw");

    const valueNode = documentRef.createElement("p");
    valueNode.classList.add("chakra-text");
    valueNode.textContent = String(valueText || "");
    throwNode.appendChild(valueNode);

    const hitNode = documentRef.createElement("p");
    hitNode.classList.add("chakra-text");
    hitNode.textContent = String(hitText || "");
    throwNode.appendChild(hitNode);

    return { throwNode, valueNode, hitNode };
  };

  const first = buildThrow("60", "T20");
  const second = buildThrow("36", "D18");
  const third = documentRef.createElement("div");
  third.classList.add("score");
  third.textContent = "0";

  turnContainer.appendChild(first.throwNode);
  turnContainer.appendChild(second.throwNode);
  turnContainer.appendChild(third);

  return {
    turnContainer,
    first,
    second,
    third,
  };
}

const VISUAL_CONFIG = { showDeadTargets: true };

test("buildCricketRenderState pauses cricket surfaces on /ad-xconfig route", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  windowRef.history.pushState({}, "", "/ad-xconfig");
  documentRef.variantElement.textContent = "Cricket";

  createGrid(documentRef, ["20", "19", "18", "17", "16", "15", "BULL"], {
    "20": [3, 0],
    "19": [0, 0],
    "18": [0, 0],
    "17": [0, 0],
    "16": [0, 0],
    "15": [0, 0],
    BULL: [0, 0],
  });

  const renderState = buildCricketRenderState({
    documentRef,
    windowRef,
    cricketRules,
    variantRules,
    visualConfig: VISUAL_CONFIG,
    gameState: createGameState({
      getCricketGameModeNormalized: () => "cricket",
      getCricketGameMode: () => "Cricket",
      getCricketScoringModeNormalized: () => "standard",
    }),
  });

  assert.equal(renderState?.surfaceStatus, "paused-route");
  assert.equal(String(renderState?.pipelineSignature || "").includes("paused-route"), true);
  assert.equal(renderState?.stateMap instanceof Map, false);
});

test("buildCricketRenderState infers tactics from 10..14 when no explicit mode exists", () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "";

  createGrid(documentRef, ["20", "14", "10", "BULL"], {
    "20": [3, 0],
    "14": [3, 0],
    "10": [3, 0],
    BULL: [0, 0],
  });

  const renderState = buildCricketRenderState({
    documentRef,
    cricketRules,
    variantRules,
    visualConfig: VISUAL_CONFIG,
    gameState: createGameState({
      getCricketGameModeNormalized: () => "",
      getCricketGameMode: () => "",
      getCricketScoringModeNormalized: () => "standard",
    }),
  });

  assert.equal(renderState?.gameModeNormalized, "tactics");
  assert.equal(renderState?.stateMap.has("14"), true);
  assert.equal(renderState?.stateMap.has("10"), true);
});

test("buildCricketRenderState keeps dynamic tactics objectives from visible grid labels", () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "Tactics";

  createGrid(documentRef, ["20", "19", "Double", "Triple", "BULL"], {
    "20": [3, 0],
    "19": [0, 0],
    Double: [0, 3],
    Triple: [3, 0],
    BULL: [0, 0],
  });

  const renderState = buildCricketRenderState({
    documentRef,
    cricketRules,
    variantRules,
    visualConfig: VISUAL_CONFIG,
    gameState: createGameState({
      getCricketGameModeNormalized: () => "tactics",
      getCricketGameMode: () => "Tactics",
      getCricketScoringModeNormalized: () => "standard",
      getActivePlayerIndex: () => 0,
      getSnapshot: () => ({ match: { players: [{ id: "a" }, { id: "b" }] } }),
    }),
  });

  assert.equal(renderState?.targetOrder.includes("DOUBLE"), true);
  assert.equal(renderState?.targetOrder.includes("TRIPLE"), true);
  assert.equal(renderState?.stateMap.get("DOUBLE")?.boardPresentation, "pressure");
  assert.equal(renderState?.stateMap.get("TRIPLE")?.boardPresentation, "scoring");
});

test("buildCricketRenderState exposes tactics precision token without changing scoring semantics", () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "Tactics";

  createGrid(documentRef, ["20", "14", "10", "BULL"], {
    "20": [0, 0],
    "14": [0, 0],
    "10": [0, 0],
    BULL: [0, 0],
  });

  const renderState = buildCricketRenderState({
    documentRef,
    cricketRules,
    variantRules,
    visualConfig: VISUAL_CONFIG,
    gameState: createGameState({
      getCricketGameModeNormalized: () => "tactics",
      getCricketGameMode: () => "Tactics",
      getCricketMode: () => "strict",
      getCricketScoringModeNormalized: () => "standard",
    }),
  });

  assert.equal(renderState?.tacticsPrecisionMode, "strict");
  assert.equal(renderState?.scoringModeNormalized, "standard");
});

test("explicit cricket mode filters tactics-only targets from the grid", () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "";

  createGrid(documentRef, ["20", "14", "10", "BULL"], {
    "20": [3, 0],
    "14": [3, 0],
    "10": [3, 0],
    BULL: [0, 0],
  });

  const renderState = buildCricketRenderState({
    documentRef,
    cricketRules,
    variantRules,
    visualConfig: VISUAL_CONFIG,
    gameState: createGameState({
      getCricketGameModeNormalized: () => "cricket",
      getCricketGameMode: () => "Cricket",
      getCricketScoringModeNormalized: () => "standard",
    }),
  });

  assert.equal(renderState?.gameModeNormalized, "cricket");
  assert.equal(renderState?.stateMap.has("14"), false);
  assert.equal(renderState?.stateMap.has("10"), false);
  assert.equal(renderState?.stateMap.has("20"), true);
});

test("buildCricketRenderState keeps grid marks authoritative even when completed turns exist", () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "Tactics";
  setDomActivePlayer(documentRef, 1);

  createGrid(documentRef, ["20", "19", "18", "17", "BULL"], {
    "20": [0, 0],
    "19": [0, 0],
    "18": [0, 0],
    "17": [0, 0],
    BULL: [0, 0],
  });

  const renderState = buildCricketRenderState({
    documentRef,
    cricketRules,
    variantRules,
    visualConfig: VISUAL_CONFIG,
    gameState: createGameState({
      getCricketGameModeNormalized: () => "tactics",
      getCricketGameMode: () => "Tactics",
      getCricketScoringModeNormalized: () => "standard",
      getActivePlayerIndex: () => 1,
      match: {
        players: [{ id: "player-1" }, { id: "player-2" }],
        turns: [
          {
            playerId: "player-1",
            finishedAt: "2026-03-04T15:00:00.000Z",
            throws: [{ segment: { name: "T20" } }],
          },
        ],
      },
    }),
  });

  assert.equal(renderState?.marksByLabel["20"].join(","), "0,0");
  assert.equal(renderState?.stateMap.get("20")?.boardPresentation, "open");
  assert.equal(renderState?.stateMap.get("20")?.cellStates.map((entry) => entry.presentation).join(","), "open,open");
  assert.equal(renderState?.activeThrowPreviewDebug?.applied, false);
  assert.equal(renderState?.activeThrowPreviewDebug?.suppressionReason, "grid-authoritative");
});

test("active throws never override grid marks in render-state derivation", () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "Tactics";
  setDomActivePlayer(documentRef, 1);

  createGrid(documentRef, ["20", "19", "18", "17", "BULL"], {
    "20": [0, 0],
    "19": [0, 0],
    "18": [0, 0],
    "17": [1, 0],
    BULL: [0, 0],
  });

  const renderState = buildCricketRenderState({
    documentRef,
    cricketRules,
    variantRules,
    visualConfig: VISUAL_CONFIG,
    gameState: createGameState({
      getCricketGameModeNormalized: () => "tactics",
      getCricketGameMode: () => "Tactics",
      getCricketScoringModeNormalized: () => "standard",
      getActivePlayerIndex: () => 1,
      getActiveThrows: () => [{ segment: { name: "D17" } }],
      match: {
        players: [{ id: "player-1" }, { id: "player-2" }],
        turns: [
          {
            playerId: "player-2",
            finishedAt: "2026-03-04T15:02:30.000Z",
            throws: [{ segment: { name: "S17" } }],
          },
        ],
      },
    }),
  });

  assert.equal(renderState?.marksByLabel["17"].join(","), "1,0");
  assert.equal(renderState?.stateMap.get("17")?.boardPresentation, "open");
  assert.equal(renderState?.stateMap.get("17")?.cellStates.map((entry) => entry.presentation).join(","), "open,open");
  assert.equal(renderState?.activeThrowPreviewDebug?.applied, false);
  assert.equal(renderState?.activeThrowPreviewDebug?.suppressionReason, "grid-authoritative");
});

test("board presentation follows the active player perspective for the same cricket row", () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "Cricket";

  createGrid(documentRef, ["20", "19", "18", "17", "16", "15", "BULL"], {
    "20": [3, 0],
    "19": [0, 0],
    "18": [0, 0],
    "17": [0, 0],
    "16": [0, 0],
    "15": [0, 0],
    BULL: [0, 0],
  });

  const offensiveState = buildCricketRenderState({
    documentRef,
    cricketRules,
    variantRules,
    visualConfig: VISUAL_CONFIG,
    gameState: createGameState({
      getCricketGameModeNormalized: () => "cricket",
      getCricketGameMode: () => "Cricket",
      getCricketScoringModeNormalized: () => "standard",
      getActivePlayerIndex: () => 0,
    }),
  });

  setDomActivePlayer(documentRef, 1);
  const defensiveState = buildCricketRenderState({
    documentRef,
    cricketRules,
    variantRules,
    visualConfig: VISUAL_CONFIG,
    gameState: createGameState({
      getCricketGameModeNormalized: () => "cricket",
      getCricketGameMode: () => "Cricket",
      getCricketScoringModeNormalized: () => "standard",
      getActivePlayerIndex: () => 1,
    }),
  });

  assert.equal(offensiveState?.stateMap.get("20")?.boardPresentation, "scoring");
  assert.equal(defensiveState?.stateMap.get("20")?.boardPresentation, "pressure");
  assert.equal(offensiveState?.stateMap.get("20")?.cellStates.map((entry) => entry.presentation).join(","), "scoring,pressure");
  assert.equal(defensiveState?.stateMap.get("20")?.cellStates.map((entry) => entry.presentation).join(","), "scoring,pressure");
});

test("board perspective follows DOM active player switch even when game-state index lags", () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "Cricket";

  createGrid(documentRef, ["20", "19", "18", "17", "16", "15", "BULL"], {
    "20": [3, 0],
    "19": [1, 0],
    "18": [2, 0],
    "17": [0, 0],
    "16": [0, 0],
    "15": [0, 0],
    BULL: [0, 0],
  });

  const staleStateGameState = createGameState({
    getCricketGameModeNormalized: () => "cricket",
    getCricketGameMode: () => "Cricket",
    getCricketScoringModeNormalized: () => "standard",
    getActivePlayerIndex: () => 0,
    getSnapshot: () => ({ match: { players: [{ id: "a" }, { id: "b" }] } }),
  });

  setDomActivePlayer(documentRef, 0);
  const active0State = buildCricketRenderState({
    documentRef,
    cricketRules,
    variantRules,
    visualConfig: VISUAL_CONFIG,
    gameState: staleStateGameState,
  });
  assert.equal(active0State?.activePlayerIndex, 0);
  assert.equal(active0State?.stateMap.get("20")?.boardPresentation, "scoring");
  assert.equal(active0State?.stateMap.get("18")?.boardPresentation, "open");

  setDomActivePlayer(documentRef, 1);
  const active1State = buildCricketRenderState({
    documentRef,
    cricketRules,
    variantRules,
    visualConfig: VISUAL_CONFIG,
    gameState: staleStateGameState,
  });
  assert.equal(active1State?.activePlayerIndex, 1);
  assert.equal(active1State?.stateMap.get("20")?.boardPresentation, "pressure");
  assert.equal(active1State?.stateMap.get("18")?.boardPresentation, "open");
});

test("unknown scoring mode falls back to standard for cricket overlays", () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "Cricket";

  createGrid(documentRef, ["20", "19", "18", "17", "16", "15", "BULL"], {
    "20": [3, 0],
    "19": [0, 0],
    "18": [0, 0],
    "17": [0, 0],
    "16": [0, 0],
    "15": [0, 0],
    BULL: [0, 0],
  });

  const renderState = buildCricketRenderState({
    documentRef,
    cricketRules,
    variantRules,
    visualConfig: VISUAL_CONFIG,
    gameState: createGameState({
      getCricketGameModeNormalized: () => "cricket",
      getCricketGameMode: () => "Cricket",
      getCricketScoringModeNormalized: () => "unknown",
      getCricketScoringMode: () => "",
    }),
  });

  assert.equal(renderState?.scoringModeRaw, "unknown");
  assert.equal(renderState?.scoringModeNormalized, "standard");
  assert.equal(renderState?.scoringModeSource, "fallback-standard-for-unknown");
  assert.equal(renderState?.stateMap.get("20")?.boardPresentation, "scoring");
});

test("explicit neutral scoring mode keeps the same tactical state semantics", () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "Cricket";

  createGrid(documentRef, ["20", "19", "18", "17", "16", "15", "BULL"], {
    "20": [3, 0],
    "19": [0, 0],
    "18": [0, 0],
    "17": [0, 0],
    "16": [0, 0],
    "15": [0, 0],
    BULL: [0, 0],
  });

  const renderState = buildCricketRenderState({
    documentRef,
    cricketRules,
    variantRules,
    visualConfig: VISUAL_CONFIG,
    gameState: createGameState({
      getCricketGameModeNormalized: () => "cricket",
      getCricketGameMode: () => "Cricket",
      getCricketScoringModeNormalized: () => "neutral",
      getCricketScoringMode: () => "neutral",
    }),
  });

  assert.equal(renderState?.scoringModeNormalized, "neutral");
  assert.equal(renderState?.stateMap.get("20")?.boardPresentation, "scoring");
  assert.equal(
    renderState?.stateMap.get("20")?.cellStates.map((entry) => entry.presentation).join(","),
    "scoring,pressure"
  );
});

test("numeric cricket row labels are not interpreted as player marks", () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "Cricket";

  createGrid(documentRef, ["20", "19", "18", "17", "16", "15", "BULL"], {
    "20": [0, 0],
    "19": [0, 0],
    "18": [0, 0],
    "17": [0, 0],
    "16": [0, 0],
    "15": [0, 0],
    BULL: [0, 0],
  });

  const table = documentRef.getElementById("grid");
  Array.from(table?.querySelectorAll?.("tr") || []).forEach((row) => {
    const cells = Array.from(row?.querySelectorAll?.("td") || []);
    const labelCell = cells[0];
    if (!labelCell) {
      return;
    }
    labelCell.textContent = String(labelCell.textContent || "").replace(/^Ziel\s*/i, "");
  });

  const renderState = buildCricketRenderState({
    documentRef,
    cricketRules,
    variantRules,
    visualConfig: VISUAL_CONFIG,
    gameState: createGameState({
      getCricketGameModeNormalized: () => "cricket",
      getCricketGameMode: () => "Cricket",
      getCricketScoringModeNormalized: () => "standard",
      getSnapshot: () => ({ match: { players: [{ id: "a" }, { id: "b" }] } }),
    }),
  });

  assert.equal(renderState?.marksByLabel["20"].join(","), "0,0");
  assert.equal(renderState?.stateMap.get("20")?.boardPresentation, "open");
  assert.equal(renderState?.labelCellMarkSourceCount || 0, 0);
  assert.equal(renderState?.shortfallRepairCount || 0, 0);
});

test("merged label+mark cells keep explicit marks and ignore wrapper label noise", () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "Cricket";

  createMergedLabelCellGrid(
    documentRef,
    ["20", "19", "18", "17", "16", "15", "BULL"],
    {
      "20": [3, 0],
      "19": [0, 0],
      "18": [0, 0],
      "17": [0, 0],
      "16": [0, 0],
      "15": [0, 0],
      BULL: [0, 0],
    }
  );

  const renderState = buildCricketRenderState({
    documentRef,
    cricketRules,
    variantRules,
    visualConfig: VISUAL_CONFIG,
    gameState: createGameState({
      getCricketGameModeNormalized: () => "cricket",
      getCricketGameMode: () => "Cricket",
      getCricketScoringModeNormalized: () => "unknown",
      getSnapshot: () => ({ match: { players: [{ id: "a" }, { id: "b" }] } }),
    }),
  });

  assert.equal(renderState?.marksByLabel["20"].join(","), "3,0");
  assert.equal(renderState?.stateMap.get("20")?.boardPresentation, "scoring");
  assert.equal(renderState?.stateMap.get("19")?.boardPresentation, "open");
  assert.equal(renderState?.discoveredUniqueLabelCount, 7);
  assert.equal((renderState?.discoveredRawUniqueLabelCount || 0) >= (renderState?.discoveredUniqueLabelCount || 0), true);
  assert.equal(Number.isFinite(renderState?.labelDiagnostics?.multiLabelContainerDropCount), true);
  assert.equal(renderState?.labelCellMarkSourceCount, 1);
  assert.deepEqual(renderState?.labelCellMarkSourceLabels, ["20"]);
  assert.equal(renderState?.shortfallRepairCount, 1);
  assert.deepEqual(renderState?.shortfallRepairLabels, ["20"]);
  assert.equal(renderState?.marksByLabelDebug?.["20"], "3,0");
});

test("merged shortfall rows ignore row-relative player indexes across all cricket objectives", () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "Cricket";

  const grid = createMergedLabelCellGrid(
    documentRef,
    ["20", "19", "18", "17", "16", "15", "BULL"],
    {
      "20": [3, 0],
      "19": [0, 3],
      "18": [3, 0],
      "17": [0, 3],
      "16": [0, 0],
      "15": [3, 3],
      BULL: [0, 0],
    }
  );

  Array.from(grid?.children || [])
    .filter((_, index) => index % 2 === 1)
    .forEach((node) => {
      node?.setAttribute?.("data-player-index", "0");
    });

  const renderState = buildCricketRenderState({
    documentRef,
    cricketRules,
    variantRules,
    visualConfig: VISUAL_CONFIG,
    gameState: createGameState({
      getCricketGameModeNormalized: () => "cricket",
      getCricketGameMode: () => "Cricket",
      getCricketScoringModeNormalized: () => "standard",
      getActivePlayerIndex: () => 0,
      getSnapshot: () => ({ match: { players: [{ id: "a" }, { id: "b" }] } }),
    }),
  });

  assert.equal(renderState?.marksByLabel["20"].join(","), "3,0");
  assert.equal(renderState?.marksByLabel["19"].join(","), "0,3");
  assert.equal(renderState?.marksByLabel["18"].join(","), "3,0");
  assert.equal(renderState?.marksByLabel["17"].join(","), "0,3");
  assert.equal(renderState?.marksByLabel["16"].join(","), "0,0");
  assert.equal(renderState?.marksByLabel["15"].join(","), "3,3");
  assert.equal(renderState?.marksByLabel.BULL.join(","), "0,0");
  assert.equal(renderState?.stateMap.get("20")?.boardPresentation, "scoring");
  assert.equal(renderState?.stateMap.get("19")?.boardPresentation, "pressure");
  assert.equal(renderState?.stateMap.get("18")?.boardPresentation, "scoring");
  assert.equal(renderState?.stateMap.get("17")?.boardPresentation, "pressure");
  assert.equal(renderState?.stateMap.get("15")?.boardPresentation, "dead");
  assert.equal(
    renderState?.stateMap.get("19")?.cellStates.map((entry) => entry.presentation).join(","),
    "pressure,scoring"
  );
  assert.equal(renderState?.labelCellMarkSourceCount >= 3, true);
});

test("mixed badge and plain label cells keep complete objective discovery across repeated snapshots", () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "Cricket";

  const grid = createMergedLabelCellGrid(
    documentRef,
    ["20", "19", "18", "17", "16", "15", "BULL"],
    {
      "20": [3, 0],
      "19": [0, 0],
      "18": [2, 0],
      "17": [0, 0],
      "16": [0, 0],
      "15": [3, 0],
      BULL: [0, 0],
    }
  );

  Array.from(grid?.children || [])
    .filter((_, index) => index % 2 === 0)
    .slice(0, 4)
    .forEach((labelCell) => {
      const labelTextNode = labelCell?.querySelector?.(".chakra-text");
      labelTextNode?.classList?.add("ad-ext-crfx-badge");
    });

  const cache = { grid: null, board: null };
  const gameState = createGameState({
    getCricketGameModeNormalized: () => "cricket",
    getCricketGameMode: () => "Cricket",
    getCricketScoringModeNormalized: () => "standard",
    getActivePlayerIndex: () => 0,
    getSnapshot: () => ({ match: { players: [{ id: "a" }, { id: "b" }] } }),
  });

  for (let iteration = 0; iteration < 3; iteration += 1) {
    const renderState = buildCricketRenderState({
      documentRef,
      cricketRules,
      variantRules,
      visualConfig: VISUAL_CONFIG,
      gameState,
      cache,
    });

    assert.equal(renderState?.discoveredUniqueLabelCount, 7);
    assert.equal(renderState?.gridSnapshot?.rows?.length, 7);
    assert.equal(renderState?.marksByLabel["20"]?.join(","), "3,0");
    assert.equal(renderState?.marksByLabel["18"]?.join(","), "2,0");
    assert.equal(renderState?.marksByLabel["15"]?.join(","), "3,0");
    assert.equal(renderState?.stateMap.get("20")?.boardPresentation, "scoring");
    assert.equal(renderState?.stateMap.get("18")?.boardPresentation, "open");
    assert.equal(renderState?.stateMap.get("15")?.boardPresentation, "scoring");
  }
});

test("render state keeps all cricket rows stable across invalidated partial-discovery update sequences", () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "Cricket";

  const grid = createMergedLabelCellGrid(
    documentRef,
    ["20", "19", "18", "17", "16", "15", "BULL"],
    {
      "20": [3, 0],
      "19": [1, 0],
      "18": [2, 0],
      "17": [0, 0],
      "16": [0, 0],
      "15": [0, 0],
      BULL: [0, 0],
    }
  );

  Array.from(grid?.children || [])
    .filter((_, index) => index % 2 === 0)
    .slice(0, 4)
    .forEach((labelCell) => {
      const labelTextNode = labelCell?.querySelector?.(".chakra-text");
      labelTextNode?.classList?.add("ad-ext-crfx-badge");
    });

  const suppressedLabels = new Set();
  const restoreDiscovery = installTransientLabelDiscoveryFilter(grid, suppressedLabels);
  const cache = { grid: null, board: null };
  const gameState = createGameState({
    getCricketGameModeNormalized: () => "cricket",
    getCricketGameMode: () => "Cricket",
    getCricketScoringModeNormalized: () => "standard",
    getActivePlayerIndex: () => 0,
    getSnapshot: () => ({ match: { players: [{ id: "a" }, { id: "b" }] } }),
  });

  [
    [],
    ["19"],
    ["19", "18"],
  ].forEach((labelsToSuppress, index) => {
    suppressedLabels.clear();
    labelsToSuppress.forEach((label) => suppressedLabels.add(label));
    cache.grid = null;

    const renderState = buildCricketRenderState({
      documentRef,
      cricketRules,
      variantRules,
      visualConfig: VISUAL_CONFIG,
      gameState,
      cache,
    });

    assert.equal(renderState?.discoveredUniqueLabelCount, 7, `stage ${index} unique coverage`);
    assert.equal(renderState?.gridSnapshot?.rows?.length, 7, `stage ${index} row coverage`);
    assert.equal(renderState?.marksByLabel["20"]?.join(","), "3,0", `stage ${index} marks 20`);
    assert.equal(renderState?.marksByLabel["19"]?.join(","), "1,0", `stage ${index} marks 19`);
    assert.equal(renderState?.marksByLabel["18"]?.join(","), "2,0", `stage ${index} marks 18`);
    assert.equal(renderState?.stateMap.get("20")?.boardPresentation, "scoring", `stage ${index} board 20`);
    assert.equal(renderState?.stateMap.get("19")?.boardPresentation, "open", `stage ${index} board 19`);
    assert.equal(renderState?.stateMap.get("18")?.boardPresentation, "open", `stage ${index} board 18`);
  });

  restoreDiscovery();
});

test("render state keeps cricket screenshot regression rows in the correct open/pressure/scoring buckets", () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "Cricket";

  const marksByRow = {
    "20": [3, 0],
    "19": [1, 0],
    "18": [2, 0],
    "17": [0, 0],
    "16": [0, 0],
    "15": [0, 0],
    BULL: [0, 0],
  };

  createGrid(documentRef, ["20", "19", "18", "17", "16", "15", "BULL"], marksByRow);

  const active0State = buildCricketRenderState({
    documentRef,
    cricketRules,
    variantRules,
    visualConfig: VISUAL_CONFIG,
    gameState: createGameState({
      getCricketGameModeNormalized: () => "cricket",
      getCricketGameMode: () => "Cricket",
      getCricketScoringModeNormalized: () => "standard",
      getActivePlayerIndex: () => 0,
      getSnapshot: () => ({ match: { players: [{ id: "a" }, { id: "b" }] } }),
    }),
  });

  setDomActivePlayer(documentRef, 1);
  const active1State = buildCricketRenderState({
    documentRef,
    cricketRules,
    variantRules,
    visualConfig: VISUAL_CONFIG,
    gameState: createGameState({
      getCricketGameModeNormalized: () => "cricket",
      getCricketGameMode: () => "Cricket",
      getCricketScoringModeNormalized: () => "standard",
      getActivePlayerIndex: () => 1,
      getSnapshot: () => ({ match: { players: [{ id: "a" }, { id: "b" }] } }),
    }),
  });

  ["20", "19", "18", "17", "16", "15", "BULL"].forEach((label) => {
    const marksByPlayer = marksByRow[label];
    assert.equal(
      active0State?.stateMap.get(label)?.cellStates?.[0]?.presentation,
      expectedPresentationByRule(marksByPlayer, 0),
      `${label} active0 owner state`
    );
    assert.equal(
      active0State?.stateMap.get(label)?.cellStates?.[1]?.presentation,
      expectedPresentationByRule(marksByPlayer, 1),
      `${label} active0 opponent state`
    );
    assert.equal(
      active1State?.stateMap.get(label)?.cellStates?.[0]?.presentation,
      expectedPresentationByRule(marksByPlayer, 0),
      `${label} active1 owner state remains factual`
    );
    assert.equal(
      active1State?.stateMap.get(label)?.cellStates?.[1]?.presentation,
      expectedPresentationByRule(marksByPlayer, 1),
      `${label} active1 opponent state remains factual`
    );
    assert.equal(
      active0State?.stateMap.get(label)?.boardPresentation,
      expectedPresentationByRule(marksByPlayer, 0),
      `${label} board active0`
    );
    assert.equal(
      active1State?.stateMap.get(label)?.boardPresentation,
      expectedPresentationByRule(marksByPlayer, 1),
      `${label} board active1`
    );
  });
});

test("render state keeps 19=[1,3] as pressure/scoring and board follows active player", () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "Cricket";

  const marksByRow = {
    "20": [3, 0],
    "19": [1, 3],
    "18": [2, 3],
    "17": [1, 0],
    "16": [0, 0],
    "15": [0, 0],
    BULL: [0, 0],
  };
  createGrid(documentRef, ["20", "19", "18", "17", "16", "15", "BULL"], marksByRow);

  const buildForActive = (activeIndex) => {
    setDomActivePlayer(documentRef, activeIndex);
    return buildCricketRenderState({
      documentRef,
      cricketRules,
      variantRules,
      visualConfig: VISUAL_CONFIG,
      gameState: createGameState({
        getCricketGameModeNormalized: () => "cricket",
        getCricketGameMode: () => "Cricket",
        getCricketScoringModeNormalized: () => "standard",
        getActivePlayerIndex: () => activeIndex,
        getSnapshot: () => ({ match: { players: [{ id: "a" }, { id: "b" }] } }),
      }),
    });
  };

  const active0 = buildForActive(0);
  const active1 = buildForActive(1);

  const state19Active0 = active0?.stateMap.get("19");
  const state19Active1 = active1?.stateMap.get("19");
  assert.equal(state19Active0?.cellStates?.[0]?.presentation, "pressure");
  assert.equal(state19Active0?.cellStates?.[1]?.presentation, "scoring");
  assert.equal(state19Active1?.cellStates?.[0]?.presentation, "pressure");
  assert.equal(state19Active1?.cellStates?.[1]?.presentation, "scoring");
  assert.equal(state19Active0?.boardPresentation, "pressure");
  assert.equal(state19Active1?.boardPresentation, "scoring");

  const state18Active0 = active0?.stateMap.get("18");
  const state18Active1 = active1?.stateMap.get("18");
  assert.equal(state18Active0?.cellStates?.[0]?.presentation, "pressure");
  assert.equal(state18Active0?.cellStates?.[1]?.presentation, "scoring");
  assert.equal(state18Active1?.boardPresentation, "scoring");
});

test("hit progression '/' -> 'X' -> '⊗' keeps grid and board colors rule-correct after each hit", () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "Cricket";

  const labels = ["20", "19", "18", "17", "16", "15", "BULL"];
  const marksByRow = {
    "20": [0, 0],
    "19": [0, 0],
    "18": [0, 0],
    "17": [0, 0],
    "16": [0, 0],
    "15": [0, 0],
    BULL: [0, 0],
  };
  createGrid(documentRef, labels, marksByRow);

  const row18 = Array.from(documentRef.querySelectorAll("#grid tr")).find((row) => {
    const label = row?.querySelector?.(".label-cell")?.textContent || "";
    return cricketRules.normalizeCricketLabel(label) === "18";
  });
  const row18Cells = Array.from(row18?.querySelectorAll?.("td") || []).slice(1);
  assert.equal(row18Cells.length, 2);

  const setRow18BySymbol = (symbol) => {
    const marks = Number(HIT_SYMBOL_TO_MARKS[symbol] || 0);
    marksByRow["18"] = [marks, 0];
    row18Cells[0].setAttribute("data-marks", String(marks));
    row18Cells[0].textContent = symbol;
    row18Cells[1].setAttribute("data-marks", "0");
    row18Cells[1].textContent = "";
  };

  const buildForActive = (activeIndex) => {
    setDomActivePlayer(documentRef, activeIndex);
    return buildCricketRenderState({
      documentRef,
      cricketRules,
      variantRules,
      visualConfig: VISUAL_CONFIG,
      gameState: createGameState({
        getCricketGameModeNormalized: () => "cricket",
        getCricketGameMode: () => "Cricket",
        getCricketScoringModeNormalized: () => "standard",
        getActivePlayerIndex: () => activeIndex,
        getSnapshot: () => ({ match: { players: [{ id: "a" }, { id: "b" }] } }),
      }),
    });
  };

  [
    { symbol: "/", expected: ["open", "open"] },
    { symbol: "X", expected: ["open", "open"] },
    { symbol: "⊗", expected: ["scoring", "pressure"] },
  ].forEach(({ symbol, expected }) => {
    setRow18BySymbol(symbol);
    const active0 = buildForActive(0);
    const active1 = buildForActive(1);

    const active0CellStates = active0?.stateMap.get("18")?.cellStates || [];
    const active1CellStates = active1?.stateMap.get("18")?.cellStates || [];

    assert.equal(active0CellStates[0]?.presentation, expected[0], `symbol ${symbol} player0 state`);
    assert.equal(active0CellStates[1]?.presentation, expected[1], `symbol ${symbol} player1 state`);
    assert.equal(active1CellStates[0]?.presentation, expected[0], `symbol ${symbol} player0 state stable`);
    assert.equal(active1CellStates[1]?.presentation, expected[1], `symbol ${symbol} player1 state stable`);

    assert.equal(
      presentationToColorName(active0?.stateMap.get("18")?.boardPresentation),
      presentationToColorName(expected[0]),
      `symbol ${symbol} board active0 color`
    );
    assert.equal(
      presentationToColorName(active1?.stateMap.get("18")?.boardPresentation),
      presentationToColorName(expected[1]),
      `symbol ${symbol} board active1 color`
    );
    assert.equal(
      presentationToColorName(active0CellStates[0]?.presentation),
      presentationToColorName(expected[0]),
      `symbol ${symbol} grid player0 color`
    );
    assert.equal(
      presentationToColorName(active0CellStates[1]?.presentation),
      presentationToColorName(expected[1]),
      `symbol ${symbol} grid player1 color`
    );
  });

  // All players closed -> DEAD (grey) for grid and board regardless of active player.
  marksByRow["18"] = [3, 3];
  row18Cells[0].setAttribute("data-marks", "3");
  row18Cells[0].textContent = "⊗";
  row18Cells[1].setAttribute("data-marks", "3");
  row18Cells[1].textContent = "⊗";

  const deadActive0 = buildForActive(0);
  const deadActive1 = buildForActive(1);
  const deadActive0Cells = deadActive0?.stateMap.get("18")?.cellStates || [];
  const deadActive1Cells = deadActive1?.stateMap.get("18")?.cellStates || [];

  assert.equal(deadActive0Cells[0]?.presentation, "dead");
  assert.equal(deadActive0Cells[1]?.presentation, "dead");
  assert.equal(deadActive1Cells[0]?.presentation, "dead");
  assert.equal(deadActive1Cells[1]?.presentation, "dead");
  assert.equal(presentationToColorName(deadActive0?.stateMap.get("18")?.boardPresentation), "grey");
  assert.equal(presentationToColorName(deadActive1?.stateMap.get("18")?.boardPresentation), "grey");
});

test("render state ignores objective-like labels inside #ad-ext-turn preview cards", () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "Cricket";

  createGrid(documentRef, ["20", "19", "18", "17", "16", "15", "BULL"], {
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

  const renderState = buildCricketRenderState({
    documentRef,
    cricketRules,
    variantRules,
    visualConfig: VISUAL_CONFIG,
    gameState: createGameState({
      getCricketGameModeNormalized: () => "cricket",
      getCricketGameMode: () => "Cricket",
      getCricketScoringModeNormalized: () => "standard",
      getActivePlayerIndex: () => 0,
      getSnapshot: () => ({ match: { players: [{ id: "a" }, { id: "b" }] } }),
    }),
  });

  assert.equal(renderState?.discoveredUniqueLabelCount, 7);
  assert.equal(renderState?.gridSnapshot?.rows?.length, 7);
  assert.equal(renderState?.marksByLabel["20"]?.join(","), "3,0");
  assert.equal(renderState?.marksByLabel["19"]?.join(","), "1,0");
  assert.equal(renderState?.marksByLabel["18"]?.join(","), "2,0");
  assert.equal(renderState?.stateMap.get("20")?.boardPresentation, "scoring");
  assert.equal(renderState?.stateMap.get("19")?.boardPresentation, "open");
  assert.equal(renderState?.stateMap.get("18")?.boardPresentation, "open");
  assert.equal(
    renderState?.gridSnapshot?.rows?.some((row) => row?.labelNode?.closest?.("#ad-ext-turn")),
    false
  );
  assert.equal(
    renderState?.gridSnapshot?.rows?.some((row) => row?.labelCell?.closest?.("#ad-ext-turn")),
    false
  );
});

test("render state keeps tactics numeric, bull and special objectives on the same 4-state model", () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "Tactics";

  const labels = ["20", "19", "18", "17", "16", "15", "Double", "Triple", "BULL"];
  const marksByRow = {
    "20": [3, 0],
    "19": [1, 0],
    "18": [2, 0],
    "17": [0, 3],
    "16": [3, 3],
    "15": [0, 0],
    Double: [3, 0],
    Triple: [0, 3],
    BULL: [3, 3],
  };

  createGrid(documentRef, labels, marksByRow);

  const renderState = buildCricketRenderState({
    documentRef,
    cricketRules,
    variantRules,
    visualConfig: VISUAL_CONFIG,
    gameState: createGameState({
      getCricketGameModeNormalized: () => "tactics",
      getCricketGameMode: () => "Tactics",
      getCricketScoringModeNormalized: () => "standard",
      getActivePlayerIndex: () => 0,
      getSnapshot: () => ({ match: { players: [{ id: "a" }, { id: "b" }] } }),
    }),
  });

  [
    ["20", [3, 0]],
    ["19", [1, 0]],
    ["18", [2, 0]],
    ["17", [0, 3]],
    ["16", [3, 3]],
    ["15", [0, 0]],
    ["DOUBLE", [3, 0]],
    ["TRIPLE", [0, 3]],
    ["BULL", [3, 3]],
  ].forEach(([label, marksByPlayer]) => {
    assert.equal(
      renderState?.stateMap.get(label)?.cellStates?.[0]?.presentation,
      expectedPresentationByRule(marksByPlayer, 0),
      `${label} tactics owner`
    );
    assert.equal(
      renderState?.stateMap.get(label)?.cellStates?.[1]?.presentation,
      expectedPresentationByRule(marksByPlayer, 1),
      `${label} tactics opponent`
    );
    assert.equal(
      renderState?.stateMap.get(label)?.boardPresentation,
      expectedPresentationByRule(marksByPlayer, 0),
      `${label} tactics board`
    );
  });
});

test("active throws do not double-count rows that the DOM already reflects", () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "Cricket";

  createGrid(documentRef, ["20", "19", "18", "17", "16", "15", "BULL"], {
    "20": [0, 0],
    "19": [0, 0],
    "18": [2, 0],
    "17": [0, 0],
    "16": [0, 0],
    "15": [0, 0],
    BULL: [0, 0],
  });

  const renderState = buildCricketRenderState({
    documentRef,
    cricketRules,
    variantRules,
    visualConfig: VISUAL_CONFIG,
    gameState: createGameState({
      getCricketGameModeNormalized: () => "cricket",
      getCricketGameMode: () => "Cricket",
      getCricketScoringModeNormalized: () => "standard",
      getActivePlayerIndex: () => 0,
      getActiveThrows: () => [
        { segment: { name: "S18" } },
        { segment: { name: "S18" } },
      ],
      getSnapshot: () => ({
        match: {
          players: [{ id: "a" }, { id: "b" }],
          turns: [
            {
              playerId: "a",
              throws: [
                { segment: { name: "S18" } },
                { segment: { name: "S18" } },
              ],
            },
          ],
        },
      }),
    }),
  });

  assert.equal(renderState?.marksByLabel["18"].join(","), "2,0");
  assert.equal(renderState?.stateMap.get("18")?.boardPresentation, "open");
  assert.equal(
    renderState?.stateMap.get("18")?.cellStates.map((entry) => entry.presentation).join(","),
    "open,open"
  );
  assert.equal(renderState?.activeThrowPreviewDebug?.applied, false);
  assert.equal(renderState?.activeThrowPreviewDebug?.suppressionReason || "", "grid-authoritative");
  assert.equal(renderState?.marksMergeByLabelDebug?.["18"]?.activeThrowApplied, false);
});

test("transition signature changes on each throw even when active turn id and board state stay the same", () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "Cricket";

  createGrid(documentRef, ["20", "19", "18", "17", "16", "15", "BULL"], {
    "20": [3, 0],
    "19": [0, 0],
    "18": [2, 0],
    "17": [0, 0],
    "16": [0, 0],
    "15": [0, 0],
    BULL: [0, 0],
  });

  const fixedTurn = {
    id: "turn-fixed",
    playerId: "a",
    round: 3,
    turn: 1,
    createdAt: "2026-03-11T20:30:00.000Z",
    finishedAt: "2026-03-11T20:30:30.000Z",
    throws: [{ segment: { name: "S20" } }],
  };

  const baseOverrides = {
    getCricketGameModeNormalized: () => "cricket",
    getCricketGameMode: () => "Cricket",
    getCricketScoringModeNormalized: () => "standard",
    getActivePlayerIndex: () => 0,
    getActiveTurn: () => fixedTurn,
    getSnapshot: () => ({
      match: {
        players: [{ id: "a" }, { id: "b" }],
        turns: [fixedTurn],
      },
    }),
  };

  const stateThrow0 = buildCricketRenderState({
    documentRef,
    cricketRules,
    variantRules,
    visualConfig: VISUAL_CONFIG,
    gameState: createGameState({
      ...baseOverrides,
      getActiveThrows: () => [],
    }),
  });

  const stateThrow1 = buildCricketRenderState({
    documentRef,
    cricketRules,
    variantRules,
    visualConfig: VISUAL_CONFIG,
    gameState: createGameState({
      ...baseOverrides,
      getActiveThrows: () => [{ segment: { name: "S5" } }],
    }),
  });

  assert.equal(stateThrow0?.pipelineSignature, stateThrow1?.pipelineSignature);
  assert.notEqual(stateThrow0?.transitionSignature, stateThrow1?.transitionSignature);
  assert.equal(stateThrow0?.stateMap.get("20")?.boardPresentation, "scoring");
  assert.equal(stateThrow1?.stateMap.get("20")?.boardPresentation, "scoring");
});

test("active throw debug stays grid-authoritative when active turn is finished", () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "Cricket";

  createGrid(documentRef, ["20", "19", "18", "17", "16", "15", "BULL"], {
    "20": [3, 0],
    "19": [0, 0],
    "18": [2, 0],
    "17": [0, 0],
    "16": [0, 0],
    "15": [0, 0],
    BULL: [0, 0],
  });

  const finishedTurn = {
    playerId: "a",
    finishedAt: "2026-03-11T18:12:00.000Z",
    throws: [{ segment: { name: "D18" } }],
  };

  const renderState = buildCricketRenderState({
    documentRef,
    cricketRules,
    variantRules,
    visualConfig: VISUAL_CONFIG,
    gameState: createGameState({
      getCricketGameModeNormalized: () => "cricket",
      getCricketGameMode: () => "Cricket",
      getCricketScoringModeNormalized: () => "standard",
      getActivePlayerIndex: () => 0,
      getActiveTurn: () => finishedTurn,
      getActiveThrows: () => [{ segment: { name: "D18" } }],
      getSnapshot: () => ({
        match: {
          players: [{ id: "a" }, { id: "b" }],
          turns: [finishedTurn],
        },
      }),
    }),
  });

  assert.equal(renderState?.marksByLabel["18"].join(","), "2,0");
  assert.equal(renderState?.stateMap.get("18")?.boardPresentation, "open");
  assert.equal(renderState?.activeThrowPreviewDebug?.applied, false);
  assert.equal(renderState?.activeThrowPreviewDebug?.suppressionReason, "grid-authoritative");
  assert.equal(renderState?.marksMergeByLabelDebug?.["18"]?.activeThrowApplied, false);
});

test("active throw debug stays grid-authoritative when preview matches latest finished turn", () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "Cricket";

  createGrid(documentRef, ["20", "19", "18", "17", "16", "15", "BULL"], {
    "20": [3, 0],
    "19": [0, 0],
    "18": [2, 0],
    "17": [0, 0],
    "16": [0, 0],
    "15": [0, 0],
    BULL: [0, 0],
  });

  const renderState = buildCricketRenderState({
    documentRef,
    cricketRules,
    variantRules,
    visualConfig: VISUAL_CONFIG,
    gameState: createGameState({
      getCricketGameModeNormalized: () => "cricket",
      getCricketGameMode: () => "Cricket",
      getCricketScoringModeNormalized: () => "standard",
      getActivePlayerIndex: () => 0,
      getActiveThrows: () => [{ segment: { name: "D18" } }],
      getSnapshot: () => ({
        match: {
          players: [{ id: "a" }, { id: "b" }],
          turns: [
            {
              playerId: "a",
              finishedAt: "2026-03-11T18:12:00.000Z",
              throws: [{ segment: { name: "D18" } }],
            },
          ],
        },
      }),
    }),
  });

  assert.equal(renderState?.marksByLabel["18"].join(","), "2,0");
  assert.equal(renderState?.stateMap.get("18")?.boardPresentation, "open");
  assert.equal(renderState?.activeThrowPreviewDebug?.applied, false);
  assert.equal(
    renderState?.activeThrowPreviewDebug?.suppressionReason,
    "grid-authoritative"
  );
  assert.equal(renderState?.activeThrowPreviewDebug?.matchedFinishedTurn || false, false);
  assert.equal(renderState?.marksMergeByLabelDebug?.["18"]?.activeThrowApplied, false);
});

test("symbolic mark glyphs are parsed for cricket rows", () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "Cricket";

  createGrid(documentRef, ["20", "19", "18", "17", "16", "15", "BULL"], {
    "20": [0, 0],
    "19": [0, 0],
    "18": [0, 0],
    "17": [0, 0],
    "16": [0, 0],
    "15": [0, 0],
    BULL: [0, 0],
  });

  const row20 = Array.from(documentRef.querySelectorAll("#grid tr")).find((row) => {
    const label = row?.querySelector?.(".label-cell")?.textContent || "";
    return String(label).toUpperCase().includes("20");
  });
  const playerCell = row20?.querySelectorAll?.("td")?.[1] || null;
  playerCell?.removeAttribute?.("data-marks");
  if (playerCell) {
    playerCell.textContent = "⊗";
  }

  const renderState = buildCricketRenderState({
    documentRef,
    cricketRules,
    variantRules,
    visualConfig: VISUAL_CONFIG,
    gameState: createGameState({
      getCricketGameModeNormalized: () => "cricket",
      getCricketGameMode: () => "Cricket",
      getCricketScoringModeNormalized: () => "standard",
      getSnapshot: () => ({ match: { players: [{ id: "a" }, { id: "b" }] } }),
    }),
  });

  assert.equal(renderState?.marksByLabel["20"].join(","), "3,0");
  assert.equal(renderState?.stateMap.get("20")?.boardPresentation, "scoring");
});

test("DOM active marker wins over state index when cricket player roster is fully visible", () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "Cricket";

  createGrid(documentRef, ["20", "19", "18", "17", "16", "15", "BULL"], {
    "20": [3, 0],
    "19": [0, 0],
    "18": [0, 0],
    "17": [0, 0],
    "16": [0, 0],
    "15": [0, 0],
    BULL: [0, 0],
  });

  // FakeDocument starts with DOM-active player index 0 by class.
  const renderState = buildCricketRenderState({
    documentRef,
    cricketRules,
    variantRules,
    visualConfig: VISUAL_CONFIG,
    gameState: createGameState({
      getCricketGameModeNormalized: () => "cricket",
      getCricketGameMode: () => "Cricket",
      getCricketScoringModeNormalized: () => "standard",
      getActivePlayerIndex: () => 1,
      getSnapshot: () => ({ match: { players: [{ id: "a" }, { id: "b" }] } }),
    }),
  });

  assert.equal(renderState?.activePlayerIndex, 0);
  assert.equal(renderState?.stateMap.get("20")?.boardPresentation, "scoring");
});

test("state index is used when visible DOM player roster is incomplete", () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "Tactics";

  createGrid(documentRef, ["20", "18", "Double", "Triple", "BULL"], {
    "20": [3, 0, 3],
    "18": [2, 0, 1],
    Double: [0, 3, 2],
    Triple: [3, 0, 0],
    BULL: [3, 3, 3],
  });

  // FakeDocument exposes only two .ad-ext-player nodes by default.
  // With three logical players, state index must remain authoritative.
  const renderState = buildCricketRenderState({
    documentRef,
    cricketRules,
    variantRules,
    visualConfig: VISUAL_CONFIG,
    gameState: createGameState({
      getCricketGameModeNormalized: () => "tactics",
      getCricketGameMode: () => "Tactics",
      getCricketScoringModeNormalized: () => "standard",
      getActivePlayerIndex: () => 2,
      getSnapshot: () => ({ match: { players: [{ id: "a" }, { id: "b" }, { id: "c" }] } }),
    }),
  });

  assert.equal(renderState?.activePlayerIndex, 2);
  assert.equal(renderState?.stateMap.get("20")?.boardPresentation, "scoring");
  assert.equal(renderState?.stateMap.get("DOUBLE")?.boardPresentation, "pressure");
});

test("virtual 3-player cricket+tactics match keeps grid owner states stable and board perspective dynamic", () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "Tactics";

  const uiLabels = ["20", "19", "18", "17", "16", "15", "Double", "Triple", "BULL"];
  const normalizedTargets = cricketRules.resolveTargetOrderByGameModeAndLabels("tactics", uiLabels);
  const marksByLabel = normalizedTargets.reduce((acc, label) => {
    acc[label] = [0, 0, 0];
    return acc;
  }, {});

  createGrid(
    documentRef,
    uiLabels,
    uiLabels.reduce((acc, label) => {
      acc[label] = [0, 0, 0];
      return acc;
    }, {})
  );

  const rowsByLabel = new Map();
  Array.from(documentRef.querySelectorAll("#grid tr")).forEach((row) => {
    const labelText = String(row?.querySelector?.(".label-cell")?.textContent || "");
    const normalized = cricketRules.normalizeCricketLabel(labelText);
    if (normalized) {
      rowsByLabel.set(normalized, row);
    }
  });

  const writeDomMarks = (label) => {
    const row = rowsByLabel.get(label);
    const marks = Array.isArray(marksByLabel[label]) ? marksByLabel[label] : [];
    const cells = Array.from(row?.querySelectorAll?.("td") || []).slice(1);
    cells.forEach((cell, index) => {
      const value = cricketRules.clampMarks(marks[index] || 0);
      cell.setAttribute("data-marks", String(value));
      cell.textContent = String(value);
    });
  };

  const writeAllDomMarks = () => {
    normalizedTargets.forEach((label) => writeDomMarks(label));
  };

  const applyVisit = (playerIndex, throws) => {
    const result = cricketRules.applyCricketThrowsToState({
      targetOrder: normalizedTargets,
      baseMarksByLabel: marksByLabel,
      playerIndex,
      playerCount: 3,
      throws,
      scoringModeNormalized: "standard",
    });
    Object.entries(result.nextMarksByLabel || {}).forEach(([label, marks]) => {
      marksByLabel[label] = Array.isArray(marks) ? marks.map((value) => cricketRules.clampMarks(value)) : [0, 0, 0];
    });
    writeAllDomMarks();
  };

  const setMarksDirect = (label, marks) => {
    marksByLabel[label] = marks.map((value) => cricketRules.clampMarks(value));
    writeDomMarks(label);
  };

  const buildState = (activePlayerIndex) => {
    return buildCricketRenderState({
      documentRef,
      cricketRules,
      variantRules,
      visualConfig: VISUAL_CONFIG,
      gameState: createGameState({
        getCricketGameModeNormalized: () => "tactics",
        getCricketGameMode: () => "Tactics",
        getCricketScoringModeNormalized: () => "standard",
        getActivePlayerIndex: () => activePlayerIndex,
        getSnapshot: () => ({ match: { players: [{ id: "a" }, { id: "b" }, { id: "c" }] } }),
      }),
    });
  };

  const assertLabel = (renderState, label, activePlayerIndex) => {
    const marks = marksByLabel[label] || [0, 0, 0];
    marks.forEach((_, playerIndex) => {
      assert.equal(
        renderState?.stateMap.get(label)?.cellStates?.[playerIndex]?.presentation,
        expectedPresentationByRule(marks, playerIndex),
        `${label} player ${playerIndex}`
      );
    });
    assert.equal(
      renderState?.stateMap.get(label)?.boardPresentation,
      expectedPresentationByRule(marks, activePlayerIndex),
      `${label} board active ${activePlayerIndex}`
    );
  };

  // Start: all open.
  let state = buildState(0);
  assertLabel(state, "20", 0);
  assertLabel(state, "18", 0);

  // P0 hits T20 => 20 closes for P0 only.
  applyVisit(0, [{ segment: { name: "T20" } }]);
  state = buildState(0);
  assertLabel(state, "20", 0); // scoring / pressure / pressure

  // Active switches to P1 without new marks: board flips, grid stays factual.
  const switchedState = buildState(1);
  assertLabel(switchedState, "20", 1); // board pressure for P1
  assert.equal(
    switchedState?.stateMap.get("20")?.cellStates.map((entry) => entry.presentation).join(","),
    state?.stateMap.get("20")?.cellStates.map((entry) => entry.presentation).join(","),
    "grid owner-perspective is unchanged by active-player switch"
  );

  // P1 hits D18 => 18 is still open for everyone (X vs 0/0).
  applyVisit(1, [{ segment: { name: "D18" } }]);
  state = buildState(1);
  assertLabel(state, "18", 1);

  // P2 hits T20 => two scorers, one pressure.
  applyVisit(2, [{ segment: { name: "T20" } }]);
  state = buildState(2);
  assertLabel(state, "20", 2); // scoring / pressure / scoring

  // P1 closes 20 => all closed -> dead.
  applyVisit(1, [{ segment: { name: "T20" } }]);
  state = buildState(1);
  assertLabel(state, "20", 1); // dead / dead / dead

  // Tactics extras follow the same 4-state semantics.
  setMarksDirect("DOUBLE", [0, 3, 2]);
  setMarksDirect("TRIPLE", [3, 0, 0]);
  state = buildState(1);
  assertLabel(state, "DOUBLE", 1); // pressure / scoring / pressure
  assertLabel(state, "TRIPLE", 1); // scoring / pressure / pressure
});

test("multi-round 3-player cricket+tactics color scenarios stay rule-correct across active-player switches", () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "Tactics";

  const labels = ["20", "19", "18", "17", "16", "15", "Double", "Triple", "BULL"];
  const marksByRow = labels.reduce((acc, label) => {
    acc[label] = [0, 0, 0];
    return acc;
  }, {});
  createGrid(documentRef, labels, marksByRow);

  const rowMap = new Map();
  Array.from(documentRef.querySelectorAll("#grid tr")).forEach((row) => {
    const labelText = String(row?.querySelector?.(".label-cell")?.textContent || "");
    const normalized = cricketRules.normalizeCricketLabel(labelText);
    if (normalized) {
      rowMap.set(normalized, row);
    }
  });

  const setRowMarks = (label, marks) => {
    const row = rowMap.get(label);
    const cells = Array.from(row?.querySelectorAll?.("td") || []).slice(1);
    marks.forEach((mark, index) => {
      const normalized = cricketRules.clampMarks(mark);
      cells[index]?.setAttribute("data-marks", String(normalized));
      cells[index].textContent = String(normalized);
    });
  };

  const applyRoundMarks = (roundMarks) => {
    Object.entries(roundMarks || {}).forEach(([label, marks]) => {
      setRowMarks(label, marks);
      marksByRow[label] = Array.isArray(marks) ? marks.map((value) => cricketRules.clampMarks(value)) : [0, 0, 0];
    });
  };

  const buildState = (activePlayerIndex) => {
    setDomActivePlayer(documentRef, activePlayerIndex);
    return buildCricketRenderState({
      documentRef,
      cricketRules,
      variantRules,
      visualConfig: VISUAL_CONFIG,
      gameState: createGameState({
        getCricketGameModeNormalized: () => "tactics",
        getCricketGameMode: () => "Tactics",
        getCricketScoringModeNormalized: () => "standard",
        getActivePlayerIndex: () => activePlayerIndex,
        getSnapshot: () => ({ match: { players: [{ id: "a" }, { id: "b" }, { id: "c" }] } }),
      }),
    });
  };

  const assertLabels = (renderState, activePlayerIndex, labelSet) => {
    labelSet.forEach((label) => {
      const marks = marksByRow[label] || [0, 0, 0];
      marks.forEach((_, playerIndex) => {
        const expected = expectedPresentationByRule(marks, playerIndex);
        assert.equal(
          renderState?.stateMap.get(label)?.cellStates?.[playerIndex]?.presentation,
          expected,
          `round label=${label} player=${playerIndex} active=${activePlayerIndex}`
        );
      });
      assert.equal(
        renderState?.stateMap.get(label)?.boardPresentation,
        expectedPresentationByRule(marks, activePlayerIndex),
        `round label=${label} board active=${activePlayerIndex}`
      );
    });
  };

  const rounds = [
    {
      name: "r1-all-open-active-p1",
      active: 0,
      marks: {
        "20": [0, 0, 0],
        "19": [0, 0, 0],
        "18": [0, 0, 0],
        "17": [0, 0, 0],
        "DOUBLE": [0, 0, 0],
        "TRIPLE": [0, 0, 0],
        BULL: [0, 0, 0],
      },
      labels: ["20", "19", "18", "17", "DOUBLE", "TRIPLE", "BULL"],
    },
    {
      name: "r2-single-hit-stays-open-active-p2",
      active: 1,
      marks: {
        "20": [1, 0, 0],
        "19": [0, 0, 0],
        "18": [0, 0, 0],
        "17": [0, 0, 0],
      },
      labels: ["20", "19", "18", "17"],
    },
    {
      name: "r3-double-hit-stays-open-active-p3",
      active: 2,
      marks: {
        "20": [2, 0, 0],
        "19": [0, 0, 0],
        "18": [0, 0, 0],
        "17": [0, 0, 0],
      },
      labels: ["20", "19", "18", "17"],
    },
    {
      name: "r4-scoring-pressure-and-dead-mix-active-p1",
      active: 0,
      marks: {
        "20": [3, 0, 0],
        "19": [3, 3, 0],
        "18": [2, 0, 0],
        "17": [3, 3, 3],
        BULL: [3, 3, 3],
      },
      labels: ["20", "19", "18", "17", "BULL"],
    },
    {
      name: "r5-same-marks-player-switch-active-p2",
      active: 1,
      marks: {},
      labels: ["20", "19", "18", "17", "BULL"],
    },
    {
      name: "r6-all-closed-on-20-active-p3",
      active: 2,
      marks: {
        "20": [3, 3, 3],
      },
      labels: ["20", "19", "17"],
    },
    {
      name: "r7-tactics-mixed-states-active-p2",
      active: 1,
      marks: {
        "DOUBLE": [0, 3, 2],
        "TRIPLE": [3, 0, 0],
      },
      labels: ["DOUBLE", "TRIPLE", "20", "19"],
    },
    {
      name: "r8-tactics-dead-active-p1",
      active: 0,
      marks: {
        "DOUBLE": [3, 3, 3],
      },
      labels: ["DOUBLE", "TRIPLE", "20"],
    },
  ];

  rounds.forEach((round) => {
    applyRoundMarks(round.marks);
    const renderState = buildState(round.active);
    assertLabels(renderState, round.active, round.labels);
  });
});

test("render state keeps full cricket objective coverage rule-correct for 3 players", () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "Cricket";

  const labels = ["20", "19", "18", "17", "16", "15", "BULL"];
  const marksByRow = {
    "20": [3, 0, 0],
    "19": [0, 3, 0],
    "18": [2, 0, 0],
    "17": [3, 3, 0],
    "16": [3, 3, 3],
    "15": [0, 0, 0],
    BULL: [1, 1, 1],
  };
  createGrid(documentRef, labels, marksByRow);

  const expectedByLabel = {
    "20": [3, 0, 0],
    "19": [0, 3, 0],
    "18": [2, 0, 0],
    "17": [3, 3, 0],
    "16": [3, 3, 3],
    "15": [0, 0, 0],
    BULL: [1, 1, 1],
  };

  [0, 1, 2].forEach((activePlayerIndex) => {
    const renderState = buildCricketRenderState({
      documentRef,
      cricketRules,
      variantRules,
      visualConfig: VISUAL_CONFIG,
      gameState: createGameState({
        getCricketGameModeNormalized: () => "tactics",
        getCricketGameMode: () => "Cricket",
        getCricketScoringModeNormalized: () => "standard",
        getActivePlayerIndex: () => activePlayerIndex,
        getSnapshot: () => ({ match: { players: [{ id: "a" }, { id: "b" }, { id: "c" }] } }),
      }),
    });

    assert.equal(renderState?.targetOrder?.length, 7);
    assert.equal(renderState?.discoveredUniqueLabelCount, 7);

    Object.entries(expectedByLabel).forEach(([label, marksByPlayer]) => {
      marksByPlayer.forEach((_, playerIndex) => {
        const expectedPresentation = expectedPresentationByRule(marksByPlayer, playerIndex);
        const expectedColor = presentationToColorName(expectedPresentation);
        const actualPresentation = String(
          renderState?.stateMap.get(label)?.cellStates?.[playerIndex]?.presentation || "open"
        );
        const actualColor = presentationToColorName(actualPresentation);

        assert.equal(
          actualPresentation,
          expectedPresentation,
          `${label} cell presentation player=${playerIndex} active=${activePlayerIndex}`
        );
        assert.equal(
          actualColor,
          expectedColor,
          `${label} cell color player=${playerIndex} active=${activePlayerIndex}`
        );
      });

      const expectedBoardPresentation = expectedPresentationByRule(marksByPlayer, activePlayerIndex);
      const expectedBoardColor = presentationToColorName(expectedBoardPresentation);
      const actualBoardPresentation = String(renderState?.stateMap.get(label)?.boardPresentation || "open");
      const actualBoardColor = presentationToColorName(actualBoardPresentation);

      assert.equal(
        actualBoardPresentation,
        expectedBoardPresentation,
        `${label} board presentation active=${activePlayerIndex}`
      );
      assert.equal(
        actualBoardColor,
        expectedBoardColor,
        `${label} board color active=${activePlayerIndex}`
      );
    });
  });
});

test("render state exposes deterministic ui buckets and highlight activity flags", () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "Cricket";

  createGrid(documentRef, ["20", "19", "18", "17", "16", "15", "BULL"], {
    "20": [3, 0],
    "19": [0, 0],
    "18": [2, 3],
    "17": [0, 0],
    "16": [3, 3],
    "15": [1, 0],
    BULL: [0, 0],
  });

  const renderState = buildCricketRenderState({
    documentRef,
    cricketRules,
    variantRules,
    visualConfig: VISUAL_CONFIG,
    gameState: createGameState({
      getCricketGameModeNormalized: () => "cricket",
      getCricketGameMode: () => "Cricket",
      getCricketScoringModeNormalized: () => "standard",
      getActivePlayerIndex: () => 0,
      getSnapshot: () => ({ match: { players: [{ id: "a" }, { id: "b" }] } }),
    }),
  });

  const twentyState = renderState?.stateMap.get("20");
  const eighteenState = renderState?.stateMap.get("18");
  const sixteenState = renderState?.stateMap.get("16");
  const fifteenState = renderState?.stateMap.get("15");
  const nineteenState = renderState?.stateMap.get("19");

  assert.equal(twentyState?.closedByPlayer, true);
  assert.equal(twentyState?.openByOpponent, true);
  assert.equal(twentyState?.scorable, true);
  assert.equal(twentyState?.uiBucket, "scoring");
  assert.equal(twentyState?.uiPriority, 1);
  assert.equal(twentyState?.isHighlightActive, true);

  assert.equal(eighteenState?.pressureLevel, "pressure");
  assert.equal(eighteenState?.uiBucket, "pressure");
  assert.equal(eighteenState?.uiPriority, 2);
  assert.equal(eighteenState?.isHighlightActive, true);

  assert.equal(nineteenState?.uiBucket, "open");
  assert.equal(nineteenState?.uiPriority, 4);
  assert.equal(nineteenState?.isHighlightActive, true);

  assert.equal(sixteenState?.dead, true);
  assert.equal(sixteenState?.uiBucket, "dead");
  assert.equal(sixteenState?.uiPriority, 5);
  assert.equal(sixteenState?.isHighlightActive, false);

  assert.equal(fifteenState?.uiBucket, "open");
  assert.equal(fifteenState?.isHighlightActive, true);
});

test("single-player fully closed rows are dead and not active highlights", () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "Cricket";

  createGrid(documentRef, ["20", "19", "18", "17", "16", "15", "BULL"], {
    "20": [3],
    "19": [0],
    "18": [0],
    "17": [0],
    "16": [0],
    "15": [0],
    BULL: [0],
  });

  const renderState = buildCricketRenderState({
    documentRef,
    cricketRules,
    variantRules,
    visualConfig: VISUAL_CONFIG,
    gameState: createGameState({
      getCricketGameModeNormalized: () => "cricket",
      getCricketGameMode: () => "Cricket",
      getCricketScoringModeNormalized: () => "standard",
      getActivePlayerIndex: () => 0,
      getSnapshot: () => ({ match: { players: [{ id: "solo" }] } }),
    }),
  });

  const state20 = renderState?.stateMap.get("20");
  assert.equal(state20?.closedByPlayer, true);
  assert.equal(state20?.openByOpponent, false);
  assert.equal(state20?.uiBucket, "dead");
  assert.equal(state20?.uiPriority, 5);
  assert.equal(state20?.isHighlightActive, false);
});
