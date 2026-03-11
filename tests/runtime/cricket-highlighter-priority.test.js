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

function ensureDomPlayerRoster(documentRef, playerCount) {
  const desired = Math.max(0, Number(playerCount) || 0);
  const playerNodes = Array.from(documentRef.querySelectorAll(".ad-ext-player"));
  let current = playerNodes.length;
  while (current < desired) {
    const node = documentRef.createElement("div");
    node.classList.add("ad-ext-player");
    documentRef.main.appendChild(node);
    current += 1;
  }
}

function setDomActivePlayer(documentRef, activeIndex, playerCount = 2) {
  ensureDomPlayerRoster(documentRef, playerCount);
  const players = Array.from(documentRef.querySelectorAll(".ad-ext-player"));
  players.forEach((node) => node.classList?.remove("ad-ext-player-active"));
  if (activeIndex >= 0 && activeIndex < players.length) {
    players[activeIndex].classList?.add("ad-ext-player-active");
  }
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

  const suggestionNode = documentRef.createElement("div");
  suggestionNode.classList.add("score");
  suggestionNode.textContent = "0";

  turnContainer.appendChild(throwNode);
  turnContainer.appendChild(suggestionNode);

  return {
    turnContainer,
    throwNode,
    scoreNode,
    hitNode,
    suggestionNode,
  };
}

test("pressure rows stay fully visible on board and are not muted to ring-only overlays", () => {
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
    shapes18.filter((shape) => shape.classList?.contains(PRESSURE_SUPPRESSED_CLASS)).length,
    0
  );
  assert.equal(
    shapes18.every((shape) => String(shape?.dataset?.targetPresentation || "") === "pressure"),
    true
  );
  assert.equal(
    shapes18.every((shape) => {
      return String(shape?.style?.fill || "").includes("ad-ext-cricket-pressure-pattern");
    }),
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

test("board ignores objective-like #ad-ext-turn preview cards and keeps 18=X vs 0 open", () => {
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
  const turnFixture = injectTurnPreviewWithCricketLikeText(documentRef);
  assert.ok(turnFixture?.turnContainer);

  const renderState = buildCricketRenderState({
    documentRef,
    cricketRules,
    variantRules,
    gameState: createGameState({
      getActivePlayerIndex: () => 0,
      getSnapshot: () => ({ match: { players: [{ id: "a" }, { id: "b" }] } }),
    }),
  });

  assert.equal(renderState?.stateMap.get("20")?.boardPresentation, "scoring");
  assert.equal(renderState?.stateMap.get("19")?.boardPresentation, "open");
  assert.equal(renderState?.stateMap.get("18")?.boardPresentation, "open");

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
  const shapes18 = Array.from(overlay.children || []).filter((node) => {
    return String(node?.dataset?.targetLabel || "") === "18";
  });
  assert.equal(shapes18.length, 4);
  assert.equal(
    shapes18.every((shape) => String(shape?.dataset?.targetPresentation || "") === "open"),
    true
  );
  assert.equal(
    shapes18.every((shape) => shape.classList?.contains(PRESENTATION_CLASS.scoring)),
    false
  );
  assert.equal(
    shapes18.every((shape) => shape.classList?.contains(PRESENTATION_CLASS.pressure)),
    false
  );
});

test("board hit progression '/' -> 'X' -> '⊗' stays neutral until close, then scoring/pressure by active player", () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "Cricket";
  createBoard(documentRef);
  createGrid(documentRef, {
    "20": [0, 0],
    "19": [0, 0],
    "18": [0, 0],
    "17": [0, 0],
    "16": [0, 0],
    "15": [0, 0],
    BULL: [0, 0],
  });

  const row18 = Array.from(documentRef.querySelectorAll("#grid tr")).find((row) => {
    const label = String(row?.querySelector?.(".label-cell")?.textContent || "");
    return cricketRules.normalizeCricketLabel(label) === "18";
  });
  const row18Cells = Array.from(row18?.querySelectorAll?.("td") || []).slice(1);
  assert.equal(row18Cells.length, 2);

  const setMarks = (symbol, marksValue) => {
    row18Cells[0].setAttribute("data-marks", String(marksValue));
    row18Cells[0].textContent = symbol;
    row18Cells[1].setAttribute("data-marks", "0");
    row18Cells[1].textContent = "";
  };

  const renderFor = (activeIndex) => {
    setDomActivePlayer(documentRef, activeIndex, 2);
    const renderState = buildCricketRenderState({
      documentRef,
      cricketRules,
      variantRules,
      gameState: createGameState({
        getActivePlayerIndex: () => activeIndex,
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
    const shapes18 = Array.from(overlay?.children || []).filter((node) => {
      return String(node?.dataset?.targetLabel || "") === "18";
    });
    assert.equal(shapes18.length, 4);
    return { renderState, shapes18 };
  };

  [
    { symbol: "/", marks: 1, expected: ["open", "open"] },
    { symbol: "X", marks: 2, expected: ["open", "open"] },
    { symbol: "⊗", marks: 3, expected: ["scoring", "pressure"] },
  ].forEach(({ symbol, marks, expected }) => {
    setMarks(symbol, marks);

    const active0 = renderFor(0);
    const active1 = renderFor(1);

    assert.equal(active0.renderState?.stateMap.get("18")?.boardPresentation, expected[0], `${symbol} board active0`);
    assert.equal(active1.renderState?.stateMap.get("18")?.boardPresentation, expected[1], `${symbol} board active1`);

    assert.equal(
      active0.shapes18.every((shape) => String(shape?.dataset?.targetPresentation || "") === expected[0]),
      true,
      `${symbol} overlay active0 presentation`
    );
    assert.equal(
      active1.shapes18.every((shape) => String(shape?.dataset?.targetPresentation || "") === expected[1]),
      true,
      `${symbol} overlay active1 presentation`
    );

    if (expected[0] === "open") {
      assert.equal(
        active0.shapes18.every((shape) => !shape.classList?.contains(PRESENTATION_CLASS.scoring)),
        true,
        `${symbol} active0 no scoring class`
      );
      assert.equal(
        active0.shapes18.every((shape) => !shape.classList?.contains(PRESENTATION_CLASS.pressure)),
        true,
        `${symbol} active0 no pressure class`
      );
    }
    if (expected[1] === "open") {
      assert.equal(
        active1.shapes18.every((shape) => !shape.classList?.contains(PRESENTATION_CLASS.scoring)),
        true,
        `${symbol} active1 no scoring class`
      );
      assert.equal(
        active1.shapes18.every((shape) => !shape.classList?.contains(PRESENTATION_CLASS.pressure)),
        true,
        `${symbol} active1 no pressure class`
      );
    }
    if (expected[0] === "scoring") {
      assert.equal(
        active0.shapes18.every((shape) => shape.classList?.contains(PRESENTATION_CLASS.scoring)),
        true,
        `${symbol} active0 scoring class`
      );
    }
    if (expected[1] === "pressure") {
      assert.equal(
        active1.shapes18.every((shape) => shape.classList?.contains(PRESENTATION_CLASS.pressure)),
        true,
        `${symbol} active1 pressure class`
      );
    }
  });

  // All players closed -> DEAD / grey regardless of active player.
  row18Cells[0].setAttribute("data-marks", "3");
  row18Cells[0].textContent = "⊗";
  row18Cells[1].setAttribute("data-marks", "3");
  row18Cells[1].textContent = "⊗";

  const dead0 = renderFor(0);
  const dead1 = renderFor(1);
  assert.equal(dead0.renderState?.stateMap.get("18")?.boardPresentation, "dead");
  assert.equal(dead1.renderState?.stateMap.get("18")?.boardPresentation, "dead");
  assert.equal(
    dead0.shapes18.every((shape) => String(shape?.dataset?.targetPresentation || "") === "dead"),
    true
  );
  assert.equal(
    dead1.shapes18.every((shape) => String(shape?.dataset?.targetPresentation || "") === "dead"),
    true
  );
  assert.equal(
    dead0.shapes18.every((shape) => shape.classList?.contains(PRESENTATION_CLASS.dead)),
    true
  );
  assert.equal(
    dead1.shapes18.every((shape) => shape.classList?.contains(PRESENTATION_CLASS.dead)),
    true
  );
});

test("board perspective remains active-player based for 3 players across cricket+tactics objectives", () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "Tactics";
  createBoard(documentRef);
  createGrid(
    documentRef,
    {
      "20": [3, 1, 3],
      "19": [1, 3, 0],
      "18": [2, 0, 1],
      "17": [3, 3, 0],
      "16": [3, 3, 3],
      "15": [0, 0, 0],
      BULL: [1, 1, 1],
      Double: [0, 3, 2],
      Triple: [3, 0, 0],
    },
    ["20", "19", "18", "17", "16", "15", "Double", "Triple", "BULL"]
  );

  const marksByLabel = {
    "20": [3, 1, 3],
    "19": [1, 3, 0],
    "18": [2, 0, 1],
    "17": [3, 3, 0],
    "16": [3, 3, 3],
    "15": [0, 0, 0],
    BULL: [1, 1, 1],
    DOUBLE: [0, 3, 2],
    TRIPLE: [3, 0, 0],
  };

  [0, 1, 2].forEach((activePlayerIndex) => {
    setDomActivePlayer(documentRef, activePlayerIndex, 3);
    const renderState = buildCricketRenderState({
      documentRef,
      cricketRules,
      variantRules,
      gameState: createGameState({
        getCricketGameModeNormalized: () => "tactics",
        getCricketGameMode: () => "Tactics",
        getActivePlayerIndex: () => activePlayerIndex,
        getSnapshot: () => ({
          match: { players: [{ id: "a" }, { id: "b" }, { id: "c" }] },
        }),
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

    Object.entries(marksByLabel).forEach(([label, marksByPlayer]) => {
      const expectedPresentation = expectedPresentationByRule(marksByPlayer, activePlayerIndex);
      const shapes = Array.from(documentRef.querySelectorAll(`#${OVERLAY_ID} [data-target-label='${label}']`));
      const fallbackShapes = Array.from(documentRef.getElementById(OVERLAY_ID)?.children || []).filter((node) => {
        return String(node?.dataset?.targetLabel || "") === label;
      });
      const targetShapes = shapes.length ? shapes : fallbackShapes;
      assert.equal(targetShapes.length > 0, true, `${label} shapes for active ${activePlayerIndex}`);
      assert.equal(
        targetShapes.every((shape) => String(shape?.dataset?.targetPresentation || "") === expectedPresentation),
        true,
        `${label} board presentation active ${activePlayerIndex}`
      );
    });
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
      return String(shape?.dataset?.patternScoring || "").startsWith("url(#ad-ext-cricket-scoring-pattern)");
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

test("board active-player switch keeps pressure sectors visible and dead sectors use grey stripe patterns", () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "Cricket";
  createBoard(documentRef);
  createGrid(documentRef, {
    "20": [3, 3],
    "19": [0, 0],
    "18": [3, 3],
    "17": [3, 0],
    "16": [0, 0],
    "15": [3, 0],
    BULL: [0, 0],
  });
  setDomActivePlayer(documentRef, 1, 2);

  const renderState = buildCricketRenderState({
    documentRef,
    cricketRules,
    variantRules,
    gameState: createGameState({
      getActivePlayerIndex: () => 1,
      getSnapshot: () => ({ match: { players: [{ id: "a" }, { id: "b" }] } }),
    }),
  });

  assert.equal(renderState?.stateMap.get("17")?.boardPresentation, "pressure");
  assert.equal(renderState?.stateMap.get("15")?.boardPresentation, "pressure");
  assert.equal(renderState?.stateMap.get("20")?.boardPresentation, "dead");
  assert.equal(renderState?.stateMap.get("18")?.boardPresentation, "dead");

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

  const pressure17 = Array.from(overlay.children || []).filter((node) => {
    return String(node?.dataset?.targetLabel || "") === "17";
  });
  const pressure15 = Array.from(overlay.children || []).filter((node) => {
    return String(node?.dataset?.targetLabel || "") === "15";
  });
  const dead20 = Array.from(overlay.children || []).filter((node) => {
    return String(node?.dataset?.targetLabel || "") === "20";
  });
  const dead18 = Array.from(overlay.children || []).filter((node) => {
    return String(node?.dataset?.targetLabel || "") === "18";
  });

  assert.equal(pressure17.length, 4);
  assert.equal(pressure15.length, 4);
  assert.equal(
    pressure17.every((shape) => String(shape?.dataset?.targetPresentation || "") === "pressure"),
    true
  );
  assert.equal(
    pressure15.every((shape) => String(shape?.dataset?.targetPresentation || "") === "pressure"),
    true
  );
  assert.equal(
    pressure17.filter((shape) => shape.classList?.contains(PRESSURE_SUPPRESSED_CLASS)).length,
    0
  );
  assert.equal(
    pressure15.filter((shape) => shape.classList?.contains(PRESSURE_SUPPRESSED_CLASS)).length,
    0
  );
  assert.equal(
    pressure17.every((shape) => String(shape?.style?.fill || "").includes("ad-ext-cricket-pressure-pattern")),
    true
  );
  assert.equal(
    pressure15.every((shape) => String(shape?.style?.fill || "").includes("ad-ext-cricket-pressure-pattern")),
    true
  );

  assert.equal(
    dead20.every((shape) => String(shape?.dataset?.targetPresentation || "") === "dead"),
    true
  );
  assert.equal(
    dead18.every((shape) => String(shape?.dataset?.targetPresentation || "") === "dead"),
    true
  );
  assert.equal(
    dead20.every((shape) => String(shape?.style?.fill || "").includes("ad-ext-cricket-dead-pattern")),
    true
  );
  assert.equal(
    dead18.every((shape) => String(shape?.style?.fill || "").includes("ad-ext-cricket-dead-pattern")),
    true
  );

  const deadPatternBaseFill = String(
    overlay
      ?.ownerSVGElement
      ?.querySelector?.("#ad-ext-cricket-dead-pattern rect")
      ?.getAttribute?.("fill") || ""
  );
  assert.equal(deadPatternBaseFill.includes("112, 118, 128"), true);
});

test("board renderer prioritizes boardPresentation over stale ui buckets", () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "Cricket";
  createBoard(documentRef);

  const overlayRendered = renderCricketHighlights({
    documentRef,
    renderState: {
      targetOrder: ["18"],
      stateMap: new Map([
        [
          "18",
          {
            label: "18",
            uiBucket: "scoring",
            boardPresentation: "open",
            presentation: "open",
            isHighlightActive: true,
          },
        ],
      ]),
    },
    visualConfig: resolveCricketVisualConfig({
      showOpenTargets: true,
      showDeadTargets: true,
      colorTheme: "standard",
      intensity: "normal",
    }),
    cache: {},
  });

  assert.equal(overlayRendered, true);
  const overlay = documentRef.getElementById(OVERLAY_ID);
  assert.ok(overlay);
  const shapes18 = Array.from(overlay.children || []).filter((node) => {
    return String(node?.dataset?.targetLabel || "") === "18";
  });
  assert.equal(shapes18.length, 4);
  assert.equal(
    shapes18.every((shape) => String(shape?.dataset?.targetPresentation || "") === "open"),
    true
  );
});
