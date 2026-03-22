import test from "node:test";
import assert from "node:assert/strict";

import {
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

function createBoardFixture(documentRef, options = {}) {
  const shell = documentRef.createElement("div");
  const svg = documentRef.createElementNS("http://www.w3.org/2000/svg", "svg");
  const group = documentRef.createElementNS("http://www.w3.org/2000/svg", "g");
  const boardRadius = Number(options.boardRadius) > 0 ? Number(options.boardRadius) : 500;

  shell.__rect = { width: 720, height: 720 };
  svg.__rect = { width: 720, height: 720 };
  svg.setAttribute("viewBox", "0 0 1000 1000");

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

  svg.appendChild(group);
  shell.appendChild(svg);
  documentRef.main.appendChild(shell);

  return {
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

test("findBoardSvgGroup falls back to visible radius-based board detection when number labels are missing", () => {
  const documentRef = new FakeDocument();
  const board = createBoardFixture(documentRef, { includeLabels: false });

  const boardSnapshot = findBoardSvgGroup(documentRef);
  assert.equal(boardSnapshot?.svg, board.svg);
  assert.equal(boardSnapshot?.group, board.group);
  assert.equal(isReusableBoardSnapshot(boardSnapshot, documentRef), true);
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
