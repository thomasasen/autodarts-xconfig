import test from "node:test";
import assert from "node:assert/strict";

import {
  findCheckoutCompatibleBoardSnapshot,
  findBoardSvgRoot,
  findBoardSvgGroup,
  isReusableBoardSnapshot,
} from "../../src/shared/dartboard-svg.js";
import { getActiveBoardInputMode } from "../../src/shared/board-input-mode.js";
import { resolveBoardSnapshot } from "../../src/features/cricket-surface/snapshot-cache.js";
import { FakeDocument } from "./fake-dom.js";

function createBoardModeButtons(documentRef, activeMode = "segments", options = {}) {
  const toolbar = documentRef.createElement("div");
  const buttons = {};
  if (options.hidden === true) {
    toolbar.setAttribute("aria-hidden", "true");
  }

  [
    ["segments", "Segmentmodus"],
    ["coords", "Koordinatenmodus"],
    ["live", "Live-Modus"],
  ].forEach(([modeKey, label]) => {
    const button = documentRef.createElement("button");
    button.type = "button";
    button.setAttribute("aria-label", label);
    button.setAttribute("aria-pressed", modeKey === activeMode ? "true" : "false");
    toolbar.appendChild(button);
    buttons[modeKey] = button;
  });

  documentRef.main.appendChild(toolbar);
  return buttons;
}

function appendBoardLikeGeometry(documentRef, groupNode, boardRadius) {
  const ringRatios = [0.75, 0.52, 0.14];
  ringRatios.forEach((ratio) => {
    const circle = documentRef.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("r", String(Math.max(1, Math.floor(boardRadius * ratio))));
    groupNode.appendChild(circle);
  });

  for (let index = 0; index < 46; index += 1) {
    const path = documentRef.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute(
      "d",
      `M ${index} 0 L ${index + 1} ${Math.max(1, index % 8)} L ${index + 2} 0 Z`
    );
    groupNode.appendChild(path);
  }
}

function createBoardFixture(documentRef, options = {}) {
  const shell = documentRef.createElement("div");
  const svg = documentRef.createElementNS("http://www.w3.org/2000/svg", "svg");
  const group = documentRef.createElementNS("http://www.w3.org/2000/svg", "g");
  const boardPanel = options.withPanelControls === true ? documentRef.createElement("div") : null;
  const boardControls = options.withPanelControls === true ? documentRef.createElement("div") : null;
  const boardViewport = options.withPanelControls === true ? documentRef.createElement("div") : null;
  const boardRadius = Number(options.boardRadius) > 0 ? Number(options.boardRadius) : 500;

  shell.__rect = { width: Number(options.width) || 720, height: Number(options.height) || 720 };
  svg.__rect = { width: Number(options.width) || 720, height: Number(options.height) || 720 };
  svg.setAttribute("viewBox", String(options.viewBox || "0 0 1000 1000"));

  if (options.hidden === true) {
    shell.setAttribute("aria-hidden", "true");
  }

  if (options.groupHidden === true) {
    group.setAttribute("aria-hidden", "true");
  }

  const outerRing = documentRef.createElementNS("http://www.w3.org/2000/svg", "circle");
  outerRing.setAttribute("r", String(boardRadius));
  group.appendChild(outerRing);

  if (options.includeLabels !== false) {
    for (let value = 1; value <= 20; value += 1) {
      const labelNode = documentRef.createElementNS("http://www.w3.org/2000/svg", "text");
      labelNode.textContent = String(value);
      group.appendChild(labelNode);
    }
  }

  if (options.addBoardLikeGeometry === true) {
    appendBoardLikeGeometry(documentRef, group, boardRadius);
  }

  svg.appendChild(group);
  shell.appendChild(svg);
  if (boardPanel && boardControls && boardViewport) {
    const undoButton = documentRef.createElement("button");
    undoButton.textContent = "Undo";
    boardControls.appendChild(undoButton);
    boardViewport.appendChild(shell);
    boardPanel.appendChild(boardControls);
    boardPanel.appendChild(boardViewport);
    documentRef.main.appendChild(boardPanel);
  } else {
    documentRef.main.appendChild(shell);
  }

  return {
    boardPanel,
    boardControls,
    boardViewport,
    shell,
    svg,
    group,
  };
}

test("getActiveBoardInputMode ignores hidden stale controls and picks the visible active mode", () => {
  const documentRef = new FakeDocument();
  createBoardModeButtons(documentRef, "segments", { hidden: true });
  createBoardModeButtons(documentRef, "live");

  assert.equal(getActiveBoardInputMode(documentRef), "live");
});

test("findBoardSvgGroup prefers the visible board over a hidden stale board layer", () => {
  const documentRef = new FakeDocument();
  createBoardModeButtons(documentRef, "segments");

  const staleBoard = createBoardFixture(documentRef, { hidden: true });
  const liveBoard = createBoardFixture(documentRef);

  const boardSnapshot = findBoardSvgGroup(documentRef);

  assert.equal(boardSnapshot?.svg, liveBoard.svg);
  assert.equal(boardSnapshot?.group, liveBoard.group);
  assert.equal(boardSnapshot?.modeKey, "segments");
  assert.equal(isReusableBoardSnapshot(boardSnapshot, documentRef), true);
  assert.equal(isReusableBoardSnapshot({ ...boardSnapshot, svg: staleBoard.svg }, documentRef), false);
});

test("findBoardSvgRoot keeps the shared svg-root selector aligned for stale and live board candidates", () => {
  const documentRef = new FakeDocument();
  createBoardFixture(documentRef, { hidden: true, boardRadius: 480 });
  const liveBoard = createBoardFixture(documentRef, { boardRadius: 500 });

  assert.equal(findBoardSvgRoot(documentRef), liveBoard.svg);
});

test("findCheckoutCompatibleBoardSnapshot returns the canonical snapshot when legacy and canonical board truth match", () => {
  const documentRef = new FakeDocument();
  createBoardModeButtons(documentRef, "live");
  const liveBoard = createBoardFixture(documentRef, {
    boardRadius: 500,
    withPanelControls: true,
  });

  const boardSnapshot = findCheckoutCompatibleBoardSnapshot(documentRef);

  assert.equal(boardSnapshot?.svg, liveBoard.svg);
  assert.equal(boardSnapshot?.group, liveBoard.group);
  assert.equal(boardSnapshot?.radius, 500);
  assert.equal(boardSnapshot?.modeKey, "live");
});

test("findBoardSvgGroup prefers visible board groups within the same svg over hidden stale groups", () => {
  const documentRef = new FakeDocument();
  const shell = documentRef.createElement("div");
  const svg = documentRef.createElementNS("http://www.w3.org/2000/svg", "svg");
  const hiddenGroup = documentRef.createElementNS("http://www.w3.org/2000/svg", "g");
  const visibleGroup = documentRef.createElementNS("http://www.w3.org/2000/svg", "g");

  svg.__rect = { width: 720, height: 720 };
  svg.setAttribute("viewBox", "0 0 1000 1000");
  hiddenGroup.setAttribute("aria-hidden", "true");

  const hiddenCircle = documentRef.createElementNS("http://www.w3.org/2000/svg", "circle");
  hiddenCircle.setAttribute("r", "640");
  hiddenGroup.appendChild(hiddenCircle);

  const visibleCircle = documentRef.createElementNS("http://www.w3.org/2000/svg", "circle");
  visibleCircle.setAttribute("r", "500");
  visibleGroup.appendChild(visibleCircle);
  for (let value = 1; value <= 20; value += 1) {
    const labelNode = documentRef.createElementNS("http://www.w3.org/2000/svg", "text");
    labelNode.textContent = String(value);
    visibleGroup.appendChild(labelNode);
  }

  svg.appendChild(hiddenGroup);
  svg.appendChild(visibleGroup);
  shell.appendChild(svg);
  documentRef.main.appendChild(shell);

  const boardSnapshot = findBoardSvgGroup(documentRef);
  assert.equal(boardSnapshot?.svg, svg);
  assert.equal(boardSnapshot?.group, visibleGroup);
  assert.equal(isReusableBoardSnapshot(boardSnapshot, documentRef), true);
});

test("findCheckoutCompatibleBoardSnapshot prefers the visible canonical board group over a hidden larger legacy group", () => {
  const documentRef = new FakeDocument();
  const shell = documentRef.createElement("div");
  const svg = documentRef.createElementNS("http://www.w3.org/2000/svg", "svg");
  const hiddenGroup = documentRef.createElementNS("http://www.w3.org/2000/svg", "g");
  const visibleGroup = documentRef.createElementNS("http://www.w3.org/2000/svg", "g");

  svg.__rect = { width: 720, height: 720 };
  svg.setAttribute("viewBox", "0 0 1000 1000");
  hiddenGroup.setAttribute("aria-hidden", "true");

  const hiddenCircle = documentRef.createElementNS("http://www.w3.org/2000/svg", "circle");
  hiddenCircle.setAttribute("r", "640");
  hiddenGroup.appendChild(hiddenCircle);

  const visibleCircle = documentRef.createElementNS("http://www.w3.org/2000/svg", "circle");
  visibleCircle.setAttribute("r", "500");
  visibleGroup.appendChild(visibleCircle);
  for (let value = 1; value <= 20; value += 1) {
    const labelNode = documentRef.createElementNS("http://www.w3.org/2000/svg", "text");
    labelNode.textContent = String(value);
    visibleGroup.appendChild(labelNode);
  }

  svg.appendChild(hiddenGroup);
  svg.appendChild(visibleGroup);
  shell.appendChild(svg);
  documentRef.main.appendChild(shell);

  const boardSnapshot = findCheckoutCompatibleBoardSnapshot(documentRef);

  assert.equal(boardSnapshot?.svg, svg);
  assert.equal(boardSnapshot?.group, visibleGroup);
  assert.equal(boardSnapshot?.radius, 500);
  assert.equal(isReusableBoardSnapshot(boardSnapshot, documentRef), true);
});

test("findBoardSvgGroup prefers unlabeled board-like geometry over decorative single-circle svg", () => {
  const documentRef = new FakeDocument();
  createBoardFixture(documentRef, {
    includeLabels: false,
    addBoardLikeGeometry: false,
    boardRadius: 670,
    width: 980,
    height: 980,
  });
  const boardLike = createBoardFixture(documentRef, {
    includeLabels: false,
    addBoardLikeGeometry: true,
    boardRadius: 500,
    width: 720,
    height: 720,
  });

  const boardSnapshot = findBoardSvgGroup(documentRef);
  assert.equal(boardSnapshot?.svg, boardLike.svg);
  assert.equal(boardSnapshot?.group, boardLike.group);
  assert.equal(isReusableBoardSnapshot(boardSnapshot, documentRef), true);
});

test("findBoardSvgGroup ignores sparse decorative svg with partial numeric labels 10..20", () => {
  const documentRef = new FakeDocument();
  const decorative = createBoardFixture(documentRef, {
    includeLabels: false,
    addBoardLikeGeometry: false,
    boardRadius: 700,
    width: 1040,
    height: 1040,
  });
  for (let value = 10; value <= 20; value += 1) {
    const labelNode = documentRef.createElementNS("http://www.w3.org/2000/svg", "text");
    labelNode.textContent = String(value);
    decorative.group.appendChild(labelNode);
  }

  const boardLike = createBoardFixture(documentRef, {
    includeLabels: false,
    addBoardLikeGeometry: true,
    boardRadius: 500,
    width: 720,
    height: 720,
  });

  const boardSnapshot = findBoardSvgGroup(documentRef);
  assert.equal(boardSnapshot?.svg, boardLike.svg);
  assert.equal(boardSnapshot?.group, boardLike.group);
});

test("findBoardSvgGroup ignores decorative larger groups and picks board-like unlabeled group in the same svg", () => {
  const documentRef = new FakeDocument();
  const shell = documentRef.createElement("div");
  const svg = documentRef.createElementNS("http://www.w3.org/2000/svg", "svg");
  const decorativeGroup = documentRef.createElementNS("http://www.w3.org/2000/svg", "g");
  const boardLikeGroup = documentRef.createElementNS("http://www.w3.org/2000/svg", "g");

  shell.__rect = { width: 920, height: 920 };
  svg.__rect = { width: 920, height: 920 };
  svg.setAttribute("viewBox", "0 0 1000 1000");

  const decorativeCircle = documentRef.createElementNS("http://www.w3.org/2000/svg", "circle");
  decorativeCircle.setAttribute("r", "690");
  decorativeGroup.appendChild(decorativeCircle);

  const boardCircle = documentRef.createElementNS("http://www.w3.org/2000/svg", "circle");
  boardCircle.setAttribute("r", "500");
  boardLikeGroup.appendChild(boardCircle);
  appendBoardLikeGeometry(documentRef, boardLikeGroup, 500);

  svg.appendChild(decorativeGroup);
  svg.appendChild(boardLikeGroup);
  shell.appendChild(svg);
  documentRef.main.appendChild(shell);

  const boardSnapshot = findBoardSvgGroup(documentRef);
  assert.equal(boardSnapshot?.svg, svg);
  assert.equal(boardSnapshot?.group, boardLikeGroup);
  assert.equal(isReusableBoardSnapshot(boardSnapshot, documentRef), true);
});

test("findBoardSvgGroup prefers the specific board child group over a larger wrapper group", () => {
  const documentRef = new FakeDocument();
  const shell = documentRef.createElement("div");
  const svg = documentRef.createElementNS("http://www.w3.org/2000/svg", "svg");
  const wrapperGroup = documentRef.createElementNS("http://www.w3.org/2000/svg", "g");
  const boardGroup = documentRef.createElementNS("http://www.w3.org/2000/svg", "g");

  shell.__rect = { width: 920, height: 920 };
  svg.__rect = { width: 920, height: 920 };
  svg.setAttribute("viewBox", "0 0 1000 1000");

  const wrapperCircle = documentRef.createElementNS("http://www.w3.org/2000/svg", "circle");
  wrapperCircle.setAttribute("r", "690");
  wrapperGroup.appendChild(wrapperCircle);

  const boardCircle = documentRef.createElementNS("http://www.w3.org/2000/svg", "circle");
  boardCircle.setAttribute("r", "500");
  boardGroup.appendChild(boardCircle);
  for (let value = 1; value <= 20; value += 1) {
    const labelNode = documentRef.createElementNS("http://www.w3.org/2000/svg", "text");
    labelNode.textContent = String(value);
    boardGroup.appendChild(labelNode);
  }
  appendBoardLikeGeometry(documentRef, boardGroup, 500);

  wrapperGroup.appendChild(boardGroup);
  svg.appendChild(wrapperGroup);
  shell.appendChild(svg);
  documentRef.main.appendChild(shell);

  const boardSnapshot = findBoardSvgGroup(documentRef);
  assert.equal(boardSnapshot?.svg, svg);
  assert.equal(boardSnapshot?.group, boardGroup);
  assert.equal(isReusableBoardSnapshot(boardSnapshot, documentRef), true);
});

test("findCheckoutCompatibleBoardSnapshot prefers the nested visible board group over a larger wrapper group", () => {
  const documentRef = new FakeDocument();
  const shell = documentRef.createElement("div");
  const svg = documentRef.createElementNS("http://www.w3.org/2000/svg", "svg");
  const wrapperGroup = documentRef.createElementNS("http://www.w3.org/2000/svg", "g");
  const boardGroup = documentRef.createElementNS("http://www.w3.org/2000/svg", "g");

  shell.__rect = { width: 920, height: 920 };
  svg.__rect = { width: 920, height: 920 };
  svg.setAttribute("viewBox", "0 0 1000 1000");

  const wrapperCircle = documentRef.createElementNS("http://www.w3.org/2000/svg", "circle");
  wrapperCircle.setAttribute("r", "690");
  wrapperGroup.appendChild(wrapperCircle);

  const boardCircle = documentRef.createElementNS("http://www.w3.org/2000/svg", "circle");
  boardCircle.setAttribute("r", "500");
  boardGroup.appendChild(boardCircle);
  for (let value = 1; value <= 20; value += 1) {
    const labelNode = documentRef.createElementNS("http://www.w3.org/2000/svg", "text");
    labelNode.textContent = String(value);
    boardGroup.appendChild(labelNode);
  }
  appendBoardLikeGeometry(documentRef, boardGroup, 500);

  wrapperGroup.appendChild(boardGroup);
  svg.appendChild(wrapperGroup);
  shell.appendChild(svg);
  documentRef.main.appendChild(shell);

  const boardSnapshot = findCheckoutCompatibleBoardSnapshot(documentRef);

  assert.equal(boardSnapshot?.svg, svg);
  assert.equal(boardSnapshot?.group, boardGroup);
  assert.equal(boardSnapshot?.radius, 500);
  assert.equal(isReusableBoardSnapshot(boardSnapshot, documentRef), true);
});

test("findBoardSvgGroup prefers board candidates with panel control context over decorative board-like svg", () => {
  const documentRef = new FakeDocument();
  const realBoard = createBoardFixture(documentRef, {
    boardRadius: 500,
    width: 720,
    height: 720,
    withPanelControls: true,
  });
  createBoardFixture(documentRef, {
    includeLabels: true,
    addBoardLikeGeometry: true,
    boardRadius: 740,
    width: 1120,
    height: 1120,
  });

  const boardSnapshot = findBoardSvgGroup(documentRef);
  assert.equal(boardSnapshot?.svg, realBoard.svg);
  assert.equal(boardSnapshot?.group, realBoard.group);
  assert.equal(isReusableBoardSnapshot(boardSnapshot, documentRef), true);
});

test("findBoardSvgGroup returns null for ambiguous unlabeled single-circle-only candidates", () => {
  const documentRef = new FakeDocument();
  createBoardFixture(documentRef, {
    includeLabels: false,
    addBoardLikeGeometry: false,
    boardRadius: 640,
    width: 980,
    height: 980,
  });
  createBoardFixture(documentRef, {
    includeLabels: false,
    addBoardLikeGeometry: false,
    boardRadius: 620,
    width: 920,
    height: 920,
  });

  const boardSnapshot = findBoardSvgGroup(documentRef);
  assert.equal(boardSnapshot, null);
});

test("cricket board snapshot cache invalidates across board-input mode switches when the visible board layer changes", () => {
  const documentRef = new FakeDocument();
  const modeButtons = createBoardModeButtons(documentRef, "segments");

  const segmentsBoard = createBoardFixture(documentRef);
  const liveBoard = createBoardFixture(documentRef, { hidden: true });
  const cache = { board: null };

  const initialSnapshot = resolveBoardSnapshot(documentRef, cache);
  assert.equal(initialSnapshot?.svg, segmentsBoard.svg);
  assert.equal(initialSnapshot?.modeKey, "segments");
  assert.equal(isReusableBoardSnapshot(initialSnapshot, documentRef), true);

  modeButtons.segments.setAttribute("aria-pressed", "false");
  modeButtons.live.setAttribute("aria-pressed", "true");
  segmentsBoard.shell.setAttribute("aria-hidden", "true");
  liveBoard.shell.removeAttribute("aria-hidden");

  const refreshedSnapshot = resolveBoardSnapshot(documentRef, cache);
  assert.equal(refreshedSnapshot?.svg, liveBoard.svg);
  assert.equal(refreshedSnapshot?.group, liveBoard.group);
  assert.equal(refreshedSnapshot?.modeKey, "live");
  assert.equal(isReusableBoardSnapshot(refreshedSnapshot, documentRef), true);
});
