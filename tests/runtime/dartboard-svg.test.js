import test from "node:test";
import assert from "node:assert/strict";

import {
  findCheckoutCompatibleBoardSnapshot,
  findBoardSvgRoot,
  findBoardSvgGroup,
  isReusableBoardSnapshot,
  resolveBoardRenderSurface,
} from "../../src/shared/dartboard-svg.js";
import { getActiveBoardInputMode } from "../../src/shared/board-input-mode.js";
import { resolveBoardSnapshot } from "../../src/features/cricket-surface/snapshot-cache.js";
import { FakeDocument } from "./fake-dom.js";

function createBoardModeButtons(documentRef, activeMode = "segments", options = {}) {
  const toolbar = documentRef.createElement("div");
  const buttons = {};
  const activeState = options.activeState || {
    name: "aria-pressed",
    activeValue: "true",
    inactiveValue: "false",
  };
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
    if (modeKey === activeMode) {
      button.setAttribute(activeState.name, String(activeState.activeValue ?? ""));
    } else if (activeState.inactiveValue !== null && activeState.inactiveValue !== undefined) {
      button.setAttribute(activeState.name, String(activeState.inactiveValue));
    }
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

function createSparseImageBackedBoardFixture(documentRef, options = {}) {
  const panel = documentRef.createElement("div");
  const controls = documentRef.createElement("div");
  const eventShell = documentRef.createElement("div");
  const boardBranch = documentRef.createElement("div");
  const mediaRoot = documentRef.createElement("div");
  const boardImage = documentRef.createElement("img");
  const svg = documentRef.createElementNS("http://www.w3.org/2000/svg", "svg");
  const wrapperGroup = documentRef.createElementNS("http://www.w3.org/2000/svg", "g");
  const labelsGroup = documentRef.createElementNS("http://www.w3.org/2000/svg", "g");
  const boardRadius = Number(options.boardRadius) > 0 ? Number(options.boardRadius) : 500;

  panel.__rect = { width: Number(options.width) || 720, height: Number(options.height) || 720 };
  controls.__rect = { width: 120, height: 48 };
  eventShell.__rect = { width: Number(options.width) || 720, height: Number(options.height) || 720 };
  boardBranch.__rect = { width: Number(options.width) || 720, height: Number(options.height) || 720 };
  mediaRoot.__rect = { width: Number(options.width) || 720, height: Number(options.height) || 720 };
  boardImage.__rect = { width: Number(options.width) || 720, height: Number(options.height) || 720 };
  svg.__rect = { width: Number(options.width) || 720, height: Number(options.height) || 720 };

  eventShell.classList.add("showAnimations");
  boardBranch.classList.add("css-aiihgx");
  mediaRoot.classList.add("css-79elbk");
  svg.setAttribute("viewBox", "0 0 1000 1000");

  const undoButton = documentRef.createElement("button");
  undoButton.textContent = "Undo";
  const nextButton = documentRef.createElement("button");
  nextButton.textContent = "Next";
  controls.appendChild(undoButton);
  controls.appendChild(nextButton);

  const outerRing = documentRef.createElementNS("http://www.w3.org/2000/svg", "circle");
  outerRing.setAttribute("r", String(boardRadius));
  wrapperGroup.appendChild(outerRing);
  wrapperGroup.appendChild(labelsGroup);

  for (let value = 1; value <= 20; value += 1) {
    const labelNode = documentRef.createElementNS("http://www.w3.org/2000/svg", "text");
    labelNode.textContent = String(value);
    labelsGroup.appendChild(labelNode);
  }

  svg.appendChild(wrapperGroup);
  mediaRoot.appendChild(boardImage);
  mediaRoot.appendChild(svg);
  boardBranch.appendChild(mediaRoot);
  eventShell.appendChild(boardBranch);
  panel.appendChild(controls);
  panel.appendChild(eventShell);
  documentRef.main.appendChild(panel);

  return {
    panel,
    controls,
    eventShell,
    boardBranch,
    mediaRoot,
    boardImage,
    svg,
    wrapperGroup,
    labelsGroup,
  };
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

function createXConfigCheckoutBoardPreviewFixture(documentRef) {
  const panelHost = documentRef.createElement("div");
  const svg = documentRef.createElementNS("http://www.w3.org/2000/svg", "svg");
  const group = documentRef.createElementNS("http://www.w3.org/2000/svg", "g");

  panelHost.id = "ad-xconfig-panel-host";
  panelHost.__rect = { width: 720, height: 720 };
  svg.__rect = { width: 720, height: 720 };
  svg.setAttribute("viewBox", "0 0 1000 1000");
  svg.setAttribute("data-adxconfig-checkout-board-preview-kind", "whole-board");

  const outerRing = documentRef.createElementNS("http://www.w3.org/2000/svg", "circle");
  outerRing.setAttribute("r", "500");
  group.appendChild(outerRing);
  for (let value = 1; value <= 20; value += 1) {
    const labelNode = documentRef.createElementNS("http://www.w3.org/2000/svg", "text");
    labelNode.textContent = String(value);
    group.appendChild(labelNode);
  }
  appendBoardLikeGeometry(documentRef, group, 500);

  svg.appendChild(group);
  panelHost.appendChild(svg);
  documentRef.main.appendChild(panelHost);

  return {
    panelHost,
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

test("getActiveBoardInputMode treats a present empty data-active attribute as an active host control", () => {
  const documentRef = new FakeDocument();
  createBoardModeButtons(documentRef, "coords", {
    activeState: {
      name: "data-active",
      activeValue: "",
      inactiveValue: null,
    },
  });
  createBoardFixture(documentRef, { withPanelControls: true });

  assert.equal(getActiveBoardInputMode(documentRef), "coords");
  assert.equal(findBoardSvgGroup(documentRef)?.modeKey, "coords");
});

test("findBoardSvgGroup accepts sparse image-backed live boards with a virtual number ring", () => {
  const documentRef = new FakeDocument();
  createBoardModeButtons(documentRef, "live", {
    activeState: {
      name: "data-active",
      activeValue: "",
      inactiveValue: null,
    },
  });
  const liveBoard = createSparseImageBackedBoardFixture(documentRef, {
    boardRadius: 500,
    width: 192,
    height: 192,
  });

  const boardSnapshot = findBoardSvgGroup(documentRef);

  assert.equal(boardSnapshot?.svg, liveBoard.svg);
  assert.equal(boardSnapshot?.group, liveBoard.wrapperGroup);
  assert.equal(boardSnapshot?.radius, 500);
  assert.equal(boardSnapshot?.modeKey, "live");
  assert.equal(isReusableBoardSnapshot(boardSnapshot, documentRef), true);
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

test("board lookup ignores xConfig checkout board previews as runtime board candidates", () => {
  const documentRef = new FakeDocument();
  const previewBoard = createXConfigCheckoutBoardPreviewFixture(documentRef);

  assert.equal(findBoardSvgRoot(documentRef), null);
  assert.equal(findBoardSvgGroup(documentRef), null);
  assert.equal(findCheckoutCompatibleBoardSnapshot(documentRef), null);
  assert.equal(resolveBoardRenderSurface(documentRef), null);

  const realBoard = createBoardFixture(documentRef, { boardRadius: 500, withPanelControls: true });

  assert.equal(findBoardSvgRoot(documentRef), realBoard.svg);
  assert.equal(findBoardSvgGroup(documentRef)?.svg, realBoard.svg);
  assert.equal(findCheckoutCompatibleBoardSnapshot(documentRef)?.svg, realBoard.svg);
  assert.equal(resolveBoardRenderSurface(documentRef)?.svg, realBoard.svg);
  assert.notEqual(findBoardSvgRoot(documentRef), previewBoard.svg);
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

test("findBoardSvgGroup reuses the cached X01 board snapshot without rescanning svg candidates", () => {
  const documentRef = new FakeDocument();
  createBoardModeButtons(documentRef, "segments");
  createBoardFixture(documentRef, {
    boardRadius: 500,
    width: 720,
    height: 720,
    withPanelControls: true,
  });

  const originalQuerySelectorAll = documentRef.querySelectorAll.bind(documentRef);
  let svgQueryCount = 0;
  documentRef.querySelectorAll = (selector) => {
    if (String(selector || "").includes("svg")) {
      svgQueryCount += 1;
    }
    return originalQuerySelectorAll(selector);
  };

  const firstSnapshot = findBoardSvgGroup(documentRef);
  const queryCountAfterFirstLookup = svgQueryCount;
  const secondSnapshot = findBoardSvgGroup(documentRef);

  assert.ok(firstSnapshot);
  assert.equal(secondSnapshot, firstSnapshot);
  assert.equal(queryCountAfterFirstLookup > 0, true);
  assert.equal(svgQueryCount, queryCountAfterFirstLookup);
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

test("getBoardRadius caches result per node via WeakMap", () => {
  const documentRef = new FakeDocument();

  const group = documentRef.createElementNS("http://www.w3.org/2000/svg", "g");
  const circle1 = documentRef.createElementNS("http://www.w3.org/2000/svg", "circle");
  circle1.setAttribute("r", "300");
  group.appendChild(circle1);
  const circle2 = documentRef.createElementNS("http://www.w3.org/2000/svg", "circle");
  circle2.setAttribute("r", "500");
  group.appendChild(circle2);
  const circle3 = documentRef.createElementNS("http://www.w3.org/2000/svg", "circle");
  circle3.setAttribute("r", "150");
  group.appendChild(circle3);

  documentRef.main.appendChild(group);

  // First call should compute and cache
  findBoardSvgRoot(documentRef);

  // Create a new board fixture to trigger findBoardSvgRoot which internally calls getBoardRadius
  const svg = documentRef.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 1000 1000");
  const g = documentRef.createElementNS("http://www.w3.org/2000/svg", "g");
  const outerRing = documentRef.createElementNS("http://www.w3.org/2000/svg", "circle");
  outerRing.setAttribute("r", "500");
  g.appendChild(outerRing);
  for (let v = 1; v <= 20; v += 1) {
    const t = documentRef.createElementNS("http://www.w3.org/2000/svg", "text");
    t.textContent = String(v);
    g.appendChild(t);
  }
  svg.appendChild(g);
  documentRef.main.appendChild(svg);

  // The snapshot cache should work across calls
  const snapshot1 = findBoardSvgGroup(documentRef);
  const snapshot2 = findBoardSvgGroup(documentRef);
  assert.equal(snapshot1, snapshot2, "Board snapshot should be cached");
});

test("getBoardRadius handles nodes without querySelectorAll", () => {
  // Create a board fixture for the document-level checks
  const documentRef = new FakeDocument();
  const svg = documentRef.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 1000 1000");
  const g = documentRef.createElementNS("http://www.w3.org/2000/svg", "g");
  const outerRing = documentRef.createElementNS("http://www.w3.org/2000/svg", "circle");
  outerRing.setAttribute("r", "500");
  g.appendChild(outerRing);
  for (let v = 1; v <= 20; v += 1) {
    const t = documentRef.createElementNS("http://www.w3.org/2000/svg", "text");
    t.textContent = String(v);
    g.appendChild(t);
  }
  svg.appendChild(g);
  documentRef.main.appendChild(svg);

  // Pass null - should return 0
  const nullResult = findBoardSvgRoot(null);
  assert.equal(nullResult, null);

  // Pass undefined - should return null
  const undefinedResult = findBoardSvgRoot(undefined);
  assert.equal(undefinedResult, null);
});

test("getBoardRadius cache is independent per node", () => {
  const documentRef = new FakeDocument();

  // Create two separate groups with different radii
  const group1 = documentRef.createElementNS("http://www.w3.org/2000/svg", "g");
  const c1 = documentRef.createElementNS("http://www.w3.org/2000/svg", "circle");
  c1.setAttribute("r", "300");
  group1.appendChild(c1);

  const group2 = documentRef.createElementNS("http://www.w3.org/2000/svg", "g");
  const c2 = documentRef.createElementNS("http://www.w3.org/2000/svg", "circle");
  c2.setAttribute("r", "500");
  group2.appendChild(c2);

  // Create main SVG with numbers so it wins selection
  const svg = documentRef.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 1000 1000");
  const mainGroup = documentRef.createElementNS("http://www.w3.org/2000/svg", "g");
  const outerRing = documentRef.createElementNS("http://www.w3.org/2000/svg", "circle");
  outerRing.setAttribute("r", "500");
  mainGroup.appendChild(outerRing);
  for (let v = 1; v <= 20; v += 1) {
    const t = documentRef.createElementNS("http://www.w3.org/2000/svg", "text");
    t.textContent = String(v);
    mainGroup.appendChild(t);
  }
  svg.appendChild(mainGroup);
  documentRef.main.appendChild(group1);
  documentRef.main.appendChild(group2);
  documentRef.main.appendChild(svg);

  // Both groups should be independently cacheable
  const snapshot1 = findBoardSvgGroup(documentRef);
  assert.equal(snapshot1.radius, 500);

  // Repeated calls should return cached result
  const snapshot2 = findBoardSvgGroup(documentRef);
  assert.equal(snapshot2, snapshot1);
  assert.equal(snapshot2.radius, 500);
});

test("queryCandidateSvgNodes caches result within TTL", () => {
  const documentRef = new FakeDocument();

  const svg = documentRef.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 1000 1000");
  const group = documentRef.createElementNS("http://www.w3.org/2000/svg", "g");
  const circle = documentRef.createElementNS("http://www.w3.org/2000/svg", "circle");
  circle.setAttribute("r", "500");
  group.appendChild(circle);
  for (let v = 1; v <= 20; v += 1) {
    const t = documentRef.createElementNS("http://www.w3.org/2000/svg", "text");
    t.textContent = String(v);
    group.appendChild(t);
  }
  svg.appendChild(group);
  documentRef.main.appendChild(svg);

  const snapshot1 = findBoardSvgGroup(documentRef);
  const snapshot2 = findBoardSvgGroup(documentRef);
  assert.strictEqual(snapshot1, snapshot2);
  assert.ok(snapshot1.svg);
});

test("queryCandidateSvgNodes cache expires after TTL", async () => {
  const documentRef = new FakeDocument();

  const svg = documentRef.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 1000 1000");
  const group = documentRef.createElementNS("http://www.w3.org/2000/svg", "g");
  const circle = documentRef.createElementNS("http://www.w3.org/2000/svg", "circle");
  circle.setAttribute("r", "500");
  group.appendChild(circle);
  for (let v = 1; v <= 20; v += 1) {
    const t = documentRef.createElementNS("http://www.w3.org/2000/svg", "text");
    t.textContent = String(v);
    group.appendChild(t);
  }
  svg.appendChild(group);
  documentRef.main.appendChild(svg);

  // First call - populates cache
  const snapshot1 = findBoardSvgGroup(documentRef);
  assert.ok(snapshot1.svg);

  // Wait for SVG_QUERY_CACHE_TTL_MS (300ms) to expire
  await new Promise((resolve) => setTimeout(resolve, 350));

  // Second call after TTL - cache invalidated, but result should still be valid
  const snapshot2 = findBoardSvgGroup(documentRef);
  assert.ok(snapshot2.svg);
});

test("queryCandidateSvgNodes cache is independent per document", () => {
  const doc1 = new FakeDocument();
  const doc2 = new FakeDocument();

  const svg1 = doc1.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg1.setAttribute("viewBox", "0 0 1000 1000");
  const group1 = doc1.createElementNS("http://www.w3.org/2000/svg", "g");
  const c1 = doc1.createElementNS("http://www.w3.org/2000/svg", "circle");
  c1.setAttribute("r", "500");
  group1.appendChild(c1);
  for (let v = 1; v <= 20; v += 1) {
    const t = doc1.createElementNS("http://www.w3.org/2000/svg", "text");
    t.textContent = String(v);
    group1.appendChild(t);
  }
  svg1.appendChild(group1);
  doc1.main.appendChild(svg1);

  const svg2 = doc2.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg2.setAttribute("viewBox", "0 0 1000 1000");
  const group2 = doc2.createElementNS("http://www.w3.org/2000/svg", "g");
  const c2 = doc2.createElementNS("http://www.w3.org/2000/svg", "circle");
  c2.setAttribute("r", "500");
  group2.appendChild(c2);
  for (let v = 1; v <= 20; v += 1) {
    const t = doc2.createElementNS("http://www.w3.org/2000/svg", "text");
    t.textContent = String(v);
    group2.appendChild(t);
  }
  svg2.appendChild(group2);
  doc2.main.appendChild(svg2);

  const snapshot1 = findBoardSvgGroup(doc1);
  const snapshot2 = findBoardSvgGroup(doc2);

  assert.ok(snapshot1.svg);
  assert.ok(snapshot2.svg);
  assert.notStrictEqual(snapshot1.svg, snapshot2.svg);
});
