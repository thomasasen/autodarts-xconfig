import test from "node:test";
import assert from "node:assert/strict";

import * as cricketRules from "../../src/domain/cricket-rules.js";
import * as variantRules from "../../src/domain/variant-rules.js";
import { buildCricketRenderState } from "../../src/features/cricket-highlighter/logic.js";
import { FakeDocument } from "./fake-dom.js";

function createGrid(documentRef, labels, marksByRow) {
  const table = documentRef.createElement("table");
  table.id = "grid";

  labels.forEach((label) => {
    const row = documentRef.createElement("tr");

    const labelCell = documentRef.createElement("td");
    labelCell.classList.add("label-cell");
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
    getActiveThrows: overrides.getActiveThrows || (() => []),
    getSnapshot: overrides.getSnapshot || (() => ({ match })),
  };
}

const VISUAL_CONFIG = { showDeadTargets: true };

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

test("buildCricketRenderState uses completed match turns as stale-DOM preview", () => {
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

  assert.equal(renderState?.marksByLabel["20"].join(","), "3,0");
  assert.equal(renderState?.stateMap.get("20")?.boardPresentation, "pressure");
  assert.equal(renderState?.stateMap.get("20")?.cellStates.map((entry) => entry.presentation).join(","), "offense,pressure");
});

test("active throws merge with the active player turn baseline instead of ignoring prior turn marks", () => {
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

  assert.equal(renderState?.marksByLabel["17"].join(","), "1,3");
  assert.equal(renderState?.stateMap.get("17")?.boardPresentation, "offense");
  assert.equal(renderState?.stateMap.get("17")?.cellStates.map((entry) => entry.presentation).join(","), "pressure,offense");
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
  assert.equal(renderState?.stateMap.get("20")?.boardPresentation, "offense");
});

test("explicit neutral scoring mode remains neutral and suppresses offense", () => {
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
  assert.equal(renderState?.stateMap.get("20")?.boardPresentation, "closed");
  assert.equal(
    renderState?.stateMap.get("20")?.cellStates.map((entry) => entry.presentation).join(","),
    "closed,open"
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
  assert.equal(renderState?.stateMap.get("20")?.boardPresentation, "offense");
  assert.equal(renderState?.stateMap.get("19")?.boardPresentation, "open");
  assert.equal(renderState?.discoveredUniqueLabelCount, 7);
});
