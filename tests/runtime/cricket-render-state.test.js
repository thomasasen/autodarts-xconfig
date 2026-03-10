import test from "node:test";
import assert from "node:assert/strict";

import * as cricketRules from "../../src/domain/cricket-rules.js";
import * as variantRules from "../../src/domain/variant-rules.js";
import { buildCricketRenderState } from "../../src/features/cricket-highlighter/logic.js";
import { FakeDocument, createFakeWindow } from "./fake-dom.js";

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
  assert.equal(renderState?.stateMap.get("20")?.cellStates.map((entry) => entry.presentation).join(","), "scoring,pressure");
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
  assert.equal(renderState?.stateMap.get("17")?.boardPresentation, "scoring");
  assert.equal(renderState?.stateMap.get("17")?.cellStates.map((entry) => entry.presentation).join(","), "pressure,scoring");
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

test("state index wins over DOM order when cricket cells expose explicit player indexes", () => {
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

  assert.equal(renderState?.activePlayerIndex, 1);
  assert.equal(renderState?.stateMap.get("20")?.boardPresentation, "pressure");
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
