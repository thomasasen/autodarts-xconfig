import test from "node:test";
import assert from "node:assert/strict";

import * as cricketRules from "../../src/domain/cricket-rules.js";
import * as variantRules from "../../src/domain/variant-rules.js";
import {
  buildCricketRenderState,
  renderCricketHighlights,
} from "../../src/features/cricket-highlighter/logic.js";
import {
  OVERLAY_ID,
  PRESENTATION_CLASS,
  PRESSURE_SUPPRESSED_CLASS,
  resolveCricketVisualConfig,
  TARGET_SLOT_CLASS_PREFIX,
} from "../../src/features/cricket-highlighter/style.js";
import { FakeDocument } from "./fake-dom.js";

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

function createBoard(documentRef) {
  const svg = documentRef.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 1000 1000");
  const group = documentRef.createElementNS("http://www.w3.org/2000/svg", "g");
  svg.appendChild(group);

  const outerRing = documentRef.createElementNS("http://www.w3.org/2000/svg", "circle");
  outerRing.setAttribute("r", "500");
  group.appendChild(outerRing);

  for (let value = 1; value <= 20; value += 1) {
    const labelNode = documentRef.createElementNS("http://www.w3.org/2000/svg", "text");
    labelNode.textContent = String(value);
    group.appendChild(labelNode);
  }

  documentRef.main.appendChild(svg);
}

function createGrid(
  documentRef,
  marksByRow,
  labels = ["20", "19", "18", "17", "16", "15", "BULL"]
) {
  const table = documentRef.createElement("table");
  table.id = "grid";

  labels.forEach((label) => {
    const row = documentRef.createElement("tr");

    const labelCell = documentRef.createElement("td");
    labelCell.classList.add("label-cell");
    labelCell.textContent = label === "BULL" ? "Bull" : label;
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
}

function createGameState(overrides = {}) {
  const match = overrides.match || null;
  return {
    isCricketVariant: () => true,
    getCricketGameModeNormalized: overrides.getCricketGameModeNormalized || (() => "cricket"),
    getCricketGameMode: overrides.getCricketGameMode || (() => "Cricket"),
    getCricketScoringModeNormalized: overrides.getCricketScoringModeNormalized || (() => "standard"),
    getCricketScoringMode: overrides.getCricketScoringMode || (() => "standard"),
    getCricketMode: overrides.getCricketMode || (() => "standard"),
    getActivePlayerIndex: overrides.getActivePlayerIndex || (() => 0),
    getActiveThrows: overrides.getActiveThrows || (() => []),
    getSnapshot: overrides.getSnapshot || (() => ({ match })),
  };
}

test("pressure rows use subtle ring classes instead of full-lane emphasis", () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "Cricket";
  createBoard(documentRef);
  createGrid(documentRef, {
    "20": [0, 0],
    "19": [0, 0],
    "18": [2, 3],
    "17": [0, 0],
    "16": [0, 0],
    "15": [0, 0],
    BULL: [0, 0],
  });

  const renderState = buildCricketRenderState({
    documentRef,
    cricketRules,
    variantRules,
    gameState: createGameState({
      getActivePlayerIndex: () => 0,
      getSnapshot: () => ({ match: { players: [{ id: "a" }, { id: "b" }] } }),
    }),
  });

  const rendered = renderCricketHighlights({
    documentRef,
    renderState,
    visualConfig: resolveCricketVisualConfig({
      showOpenTargets: false,
      showDeadTargets: true,
      colorTheme: "standard",
      intensity: "normal",
    }),
    cache: {},
  });
  assert.equal(rendered, true);

  const overlay = documentRef.getElementById(OVERLAY_ID);
  assert.ok(overlay);
  const shapes18 = Array.from(overlay.children || []).filter((node) => {
    return String(node?.dataset?.targetLabel || "") === "18";
  });
  assert.equal(shapes18.length, 4);
  assert.equal(
    shapes18.some((shape) => shape.classList?.contains(PRESENTATION_CLASS.pressure)),
    true
  );
  assert.equal(
    shapes18.some((shape) => shape.classList?.contains(`${TARGET_SLOT_CLASS_PREFIX}double-ring`)),
    true
  );
  assert.equal(
    shapes18.some((shape) => shape.classList?.contains(`${TARGET_SLOT_CLASS_PREFIX}triple-ring`)),
    true
  );
  assert.equal(
    shapes18.filter((shape) => shape.classList?.contains(PRESSURE_SUPPRESSED_CLASS)).length >= 2,
    true
  );
});

test("dead targets stay visible when showDeadTargets is enabled", () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "Cricket";
  createBoard(documentRef);
  createGrid(documentRef, {
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
    gameState: createGameState({
      getActivePlayerIndex: () => 0,
      getSnapshot: () => ({ match: { players: [{ id: "solo" }] } }),
    }),
  });

  const rendered = renderCricketHighlights({
    documentRef,
    renderState,
    visualConfig: resolveCricketVisualConfig({
      showOpenTargets: false,
      showDeadTargets: true,
      colorTheme: "standard",
      intensity: "normal",
    }),
    cache: {},
  });
  assert.equal(rendered, true);

  const overlay = documentRef.getElementById(OVERLAY_ID);
  assert.ok(overlay);
  const shapes20 = Array.from(overlay.children || []).filter((node) => {
    return String(node?.dataset?.targetLabel || "") === "20";
  });
  assert.equal(shapes20.length, 4);
  assert.equal(
    shapes20.every((shape) => String(shape?.style?.display || "") !== "none"),
    true
  );
  assert.equal(
    shapes20.every((shape) => shape.classList?.contains(PRESENTATION_CLASS.dead)),
    true
  );
});

test("tactics DOUBLE/TRIPLE objectives use the same scoring and pressure semantics on board", () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "Tactics";
  createBoard(documentRef);
  createGrid(
    documentRef,
    {
      "20": [0, 0],
      "19": [0, 0],
      Double: [3, 0],
      Triple: [0, 3],
      BULL: [0, 0],
    },
    ["20", "19", "Double", "Triple", "BULL"]
  );

  const renderState = buildCricketRenderState({
    documentRef,
    cricketRules,
    variantRules,
    gameState: createGameState({
      getCricketGameModeNormalized: () => "tactics",
      getCricketGameMode: () => "Tactics",
      getActivePlayerIndex: () => 0,
      getSnapshot: () => ({ match: { players: [{ id: "a" }, { id: "b" }] } }),
    }),
  });

  const rendered = renderCricketHighlights({
    documentRef,
    renderState,
    visualConfig: resolveCricketVisualConfig({
      showOpenTargets: false,
      showDeadTargets: true,
      colorTheme: "standard",
      intensity: "normal",
    }),
    cache: {},
  });
  assert.equal(rendered, true);

  const overlay = documentRef.getElementById(OVERLAY_ID);
  assert.ok(overlay);
  const doubleShapes = Array.from(overlay.children || []).filter((node) => {
    return String(node?.dataset?.targetLabel || "") === "DOUBLE";
  });
  const tripleShapes = Array.from(overlay.children || []).filter((node) => {
    return String(node?.dataset?.targetLabel || "") === "TRIPLE";
  });

  assert.equal(doubleShapes.length, 20);
  assert.equal(tripleShapes.length, 20);
  assert.equal(
    doubleShapes.every((shape) => shape.classList?.contains(PRESENTATION_CLASS.scoring)),
    true
  );
  assert.equal(
    tripleShapes.every((shape) => shape.classList?.contains(PRESENTATION_CLASS.pressure)),
    true
  );
  assert.equal(
    doubleShapes.every((shape) => shape.classList?.contains(`${TARGET_SLOT_CLASS_PREFIX}double-ring`)),
    true
  );
  assert.equal(
    tripleShapes.every((shape) => shape.classList?.contains(`${TARGET_SLOT_CLASS_PREFIX}triple-ring`)),
    true
  );
});

test("board perspective keeps screenshot regression rows open until a target is actually closed", () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "Cricket";
  createBoard(documentRef);
  createGrid(documentRef, {
    "20": [3, 0],
    "19": [1, 0],
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
    gameState: createGameState({
      getActivePlayerIndex: () => 0,
      getSnapshot: () => ({ match: { players: [{ id: "a" }, { id: "b" }] } }),
    }),
  });

  const rendered = renderCricketHighlights({
    documentRef,
    renderState,
    visualConfig: resolveCricketVisualConfig({
      showOpenTargets: true,
      showDeadTargets: true,
      colorTheme: "standard",
      intensity: "normal",
    }),
    cache: {},
  });
  assert.equal(rendered, true);

  const overlay = documentRef.getElementById(OVERLAY_ID);
  assert.ok(overlay);

  [
    ["20", [3, 0]],
    ["19", [1, 0]],
    ["18", [2, 0]],
  ].forEach(([label, marksByPlayer]) => {
    const expected = expectedPresentationByRule(marksByPlayer, 0);
    const shapes = Array.from(overlay.children || []).filter((node) => {
      return String(node?.dataset?.targetLabel || "") === label;
    });
    assert.equal(shapes.length > 0, true, `${label} shapes rendered`);
    assert.equal(
      shapes.every((shape) => String(shape?.dataset?.targetPresentation || "") === expected),
      true,
      `${label} board presentation`
    );
  });
});

test("board scoring stays in the scoring bucket while open rows stay neutral", () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "Cricket";
  createBoard(documentRef);
  createGrid(documentRef, {
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
    gameState: createGameState({
      getActivePlayerIndex: () => 0,
      getSnapshot: () => ({ match: { players: [{ id: "a" }, { id: "b" }] } }),
    }),
  });

  renderCricketHighlights({
    documentRef,
    renderState,
    visualConfig: resolveCricketVisualConfig({
      showOpenTargets: true,
      showDeadTargets: true,
      colorTheme: "standard",
      intensity: "normal",
    }),
    cache: {},
  });

  const overlay = documentRef.getElementById(OVERLAY_ID);
  assert.ok(overlay);
  const scoring20Shapes = Array.from(overlay.children || []).filter((node) => {
    return String(node?.dataset?.targetLabel || "") === "20";
  });
  const open18Shapes = Array.from(overlay.children || []).filter((node) => {
    return String(node?.dataset?.targetLabel || "") === "18";
  });

  assert.equal(
    scoring20Shapes.every((shape) => String(shape?.dataset?.targetPresentation || "") === "scoring"),
    true
  );
  assert.equal(
    scoring20Shapes.every((shape) => {
      return String(shape?.dataset?.scoringPattern || "").startsWith("url(#ad-ext-cricket-scoring-pattern)");
    }),
    true
  );
  assert.equal(
    scoring20Shapes.every((shape) => {
      return String(shape?.style?.fill || "").startsWith("url(#ad-ext-cricket-scoring-pattern)");
    }),
    true
  );
  assert.equal(
    open18Shapes.every((shape) => String(shape?.dataset?.targetPresentation || "") === "open"),
    true
  );
});
