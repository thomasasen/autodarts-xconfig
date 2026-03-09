import test from "node:test";
import assert from "node:assert/strict";

import { createBootstrap } from "../../src/core/bootstrap.js";
import { FakeDocument, createFakeWindow } from "./fake-dom.js";
import {
  THEME_LAYOUT_HOOK_CLASSES,
  selectWidestContentLayoutCandidate,
} from "../../src/features/themes/shared/mount-theme-feature.js";

function wait(ms = 0) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createThemeConfig(themeConfigKey, themeFeatureConfig = {}) {
  const themeName = String(themeConfigKey || "").trim();
  return {
    featureToggles: {
      checkoutScorePulse: false,
      [`themes.${themeName}`]: true,
    },
    features: {
      checkoutScorePulse: {
        enabled: false,
      },
      themes: {
        [themeName]: {
          enabled: true,
          ...themeFeatureConfig,
        },
      },
    },
  };
}

function createBoardFixture(documentRef, options = {}) {
  const withContentSlot = options.withContentSlot === true;
  const boardPanel = documentRef.createElement("div");
  const boardControls = documentRef.createElement("div");
  const boardViewport = documentRef.createElement("div");
  const boardCanvas = documentRef.createElement("div");
  const boardSvg = documentRef.createElementNS("http://www.w3.org/2000/svg", "svg");
  const contentSlot = withContentSlot ? documentRef.createElement("div") : null;
  const contentLeft = withContentSlot ? documentRef.createElement("div") : null;
  const contentBoard = withContentSlot ? documentRef.createElement("div") : null;
  const playerDisplay = withContentSlot ? documentRef.createElement("div") : null;

  boardControls.classList.add("chakra-stack");
  const undoButton = documentRef.createElement("button");
  undoButton.textContent = "Undo";
  boardControls.appendChild(undoButton);

  boardCanvas.classList.add("showAnimations");
  boardViewport.__rect = { width: 780, height: 620 };
  boardCanvas.__rect = { width: 780, height: 620 };
  boardSvg.setAttribute("viewBox", "0 0 1000 1000");

  const outerRing = documentRef.createElementNS("http://www.w3.org/2000/svg", "circle");
  outerRing.setAttribute("r", "500");
  boardSvg.appendChild(outerRing);

  for (let value = 1; value <= 20; value += 1) {
    const labelNode = documentRef.createElementNS("http://www.w3.org/2000/svg", "text");
    labelNode.textContent = String(value);
    boardSvg.appendChild(labelNode);
  }

  boardCanvas.appendChild(boardSvg);
  boardViewport.appendChild(boardCanvas);
  boardPanel.appendChild(boardControls);
  boardPanel.appendChild(boardViewport);

  if (withContentSlot) {
    playerDisplay.id = "ad-ext-player-display";
    contentLeft.appendChild(playerDisplay);
    contentBoard.appendChild(boardPanel);
    contentSlot.appendChild(contentLeft);
    contentSlot.appendChild(contentBoard);
    documentRef.main.appendChild(contentSlot);
  } else {
    documentRef.main.appendChild(boardPanel);
  }

  return {
    contentSlot,
    contentLeft,
    contentBoard,
    boardPanel,
    boardControls,
    boardViewport,
    boardCanvas,
    boardSvg,
  };
}

function createInfoStyleBoardFixture(documentRef) {
  const contentSlot = documentRef.createElement("div");
  const contentLeft = documentRef.createElement("div");
  const contentBoard = documentRef.createElement("div");
  const playerDisplay = documentRef.createElement("div");
  const boardShell = documentRef.createElement("div");
  const boardStack = documentRef.createElement("div");
  const boardPanel = documentRef.createElement("div");
  const boardControls = documentRef.createElement("div");
  const boardViewport = documentRef.createElement("div");
  const boardCanvas = documentRef.createElement("div");
  const boardSvg = documentRef.createElementNS("http://www.w3.org/2000/svg", "svg");

  contentSlot.classList.add("css-u5v8bq");
  contentLeft.classList.add("css-rc3vw3");
  contentBoard.classList.add("css-vo3506");
  boardShell.classList.add("css-tkevr6");
  boardStack.classList.add("css-7ls08l");
  boardPanel.classList.add("css-jbngkd");
  boardControls.classList.add("chakra-stack", "css-7bjx6y");
  boardViewport.classList.add("css-tqsk66");
  boardCanvas.classList.add("showAnimations", "css-1cdcn26");
  playerDisplay.id = "ad-ext-player-display";

  contentSlot.__rect = { width: 1320, height: 680 };
  contentLeft.__rect = { width: 420, height: 680 };
  contentBoard.__rect = { width: 900, height: 680 };
  boardViewport.__rect = { width: 900, height: 680 };
  boardCanvas.__rect = { width: 900, height: 680 };

  const undoButton = documentRef.createElement("button");
  undoButton.textContent = "Undo";
  boardControls.appendChild(undoButton);

  boardSvg.setAttribute("viewBox", "0 0 1000 1000");
  const outerRing = documentRef.createElementNS("http://www.w3.org/2000/svg", "circle");
  outerRing.setAttribute("r", "500");
  boardSvg.appendChild(outerRing);
  for (let value = 1; value <= 20; value += 1) {
    const labelNode = documentRef.createElementNS("http://www.w3.org/2000/svg", "text");
    labelNode.textContent = String(value);
    boardSvg.appendChild(labelNode);
  }

  boardCanvas.appendChild(boardSvg);
  boardViewport.appendChild(boardCanvas);
  boardPanel.appendChild(boardControls);
  boardPanel.appendChild(boardViewport);
  boardStack.appendChild(boardPanel);
  boardShell.appendChild(boardStack);
  contentBoard.appendChild(boardShell);
  contentLeft.appendChild(playerDisplay);
  contentSlot.appendChild(contentLeft);
  contentSlot.appendChild(contentBoard);
  documentRef.main.appendChild(contentSlot);

  return {
    contentSlot,
    contentLeft,
    contentBoard,
    boardPanel,
    boardControls,
    boardViewport,
    boardCanvas,
    boardSvg,
  };
}

function assertThemeHookState(nodes, expectedActive) {
  const expectations = [
    [nodes.contentSlot, THEME_LAYOUT_HOOK_CLASSES.contentSlot],
    [nodes.contentLeft, THEME_LAYOUT_HOOK_CLASSES.contentLeft],
    [nodes.contentBoard, THEME_LAYOUT_HOOK_CLASSES.contentBoard],
    [nodes.boardPanel, THEME_LAYOUT_HOOK_CLASSES.boardPanel],
    [nodes.boardControls, THEME_LAYOUT_HOOK_CLASSES.boardControls],
    [nodes.boardViewport, THEME_LAYOUT_HOOK_CLASSES.boardViewport],
    [nodes.boardCanvas, THEME_LAYOUT_HOOK_CLASSES.boardCanvas],
    [nodes.boardSvg, THEME_LAYOUT_HOOK_CLASSES.boardSvg],
  ];

  expectations.forEach(([node, className]) => {
    if (!node) {
      return;
    }
    assert.equal(node.classList.contains(className), expectedActive);
  });
}

test("selectWidestContentLayoutCandidate prefers widest slot and keeps deterministic tie-breaking", () => {
  const makeCandidate = (width, ancestorDepth, collapseDepth) => ({
    contentSlot: { getBoundingClientRect: () => ({ width }) },
    contentLeft: {},
    contentBoard: {},
    width,
    ancestorDepth,
    collapseDepth,
  });

  const narrow = makeCandidate(900, 0, 0);
  const wide = makeCandidate(1280, 3, 4);
  const tieA = makeCandidate(1280, 2, 2);
  const tieB = makeCandidate(1280, 2, 3);

  assert.equal(
    selectWidestContentLayoutCandidate([narrow, wide])?.contentSlot,
    wide.contentSlot
  );

  assert.equal(
    selectWidestContentLayoutCandidate([tieB, tieA])?.contentSlot,
    tieA.contentSlot
  );

  assert.equal(selectWidestContentLayoutCandidate([]), null);
});

test("theme-x01 mounts idempotently and cleans up style plus preview spacing", async () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "501";
  const windowRef = createFakeWindow({ documentRef });
  const runtime = createBootstrap({
    windowRef,
    documentRef,
    config: createThemeConfig("x01", {
      showAvg: true,
    }),
  });

  runtime.start();
  runtime.start();
  await wait(5);

  assert.equal(Boolean(documentRef.getElementById("ad-ext-theme-x01-style")), true);
  assert.equal(documentRef.turnContainer.classList.contains("ad-ext-turn-preview-space"), true);
  assert.equal(documentRef.querySelectorAll(".ad-ext-theme-board-panel").length, 0);
  assert.equal(documentRef.querySelectorAll(".ad-ext-theme-content-slot").length, 0);

  runtime.stop();
  assert.equal(Boolean(documentRef.getElementById("ad-ext-theme-x01-style")), false);
  assert.equal(documentRef.turnContainer.classList.contains("ad-ext-turn-preview-space"), false);
});

test("theme-x01 applies board layout hooks when board exists and removes them on cleanup", async () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "501";
  const boardNodes = createBoardFixture(documentRef, { withContentSlot: true });
  const windowRef = createFakeWindow({ documentRef });
  const runtime = createBootstrap({
    windowRef,
    documentRef,
    config: createThemeConfig("x01", {
      showAvg: true,
    }),
  });

  runtime.start();
  runtime.start();
  await wait(5);

  assertThemeHookState(boardNodes, true);
  assert.equal(
    boardNodes.boardCanvas.style.getPropertyValue("--ad-ext-theme-board-size"),
    "620px"
  );

  documentRef.flushMutations();
  await wait(5);
  assertThemeHookState(boardNodes, true);

  const hookCounts = [
    [boardNodes.contentSlot, THEME_LAYOUT_HOOK_CLASSES.contentSlot],
    [boardNodes.contentLeft, THEME_LAYOUT_HOOK_CLASSES.contentLeft],
    [boardNodes.contentBoard, THEME_LAYOUT_HOOK_CLASSES.contentBoard],
    [boardNodes.boardPanel, THEME_LAYOUT_HOOK_CLASSES.boardPanel],
    [boardNodes.boardControls, THEME_LAYOUT_HOOK_CLASSES.boardControls],
    [boardNodes.boardViewport, THEME_LAYOUT_HOOK_CLASSES.boardViewport],
    [boardNodes.boardCanvas, THEME_LAYOUT_HOOK_CLASSES.boardCanvas],
    [boardNodes.boardSvg, THEME_LAYOUT_HOOK_CLASSES.boardSvg],
  ];
  hookCounts.forEach(([node, className]) => {
    if (!node) {
      return;
    }
    const count = node.classList
      .toArray()
      .filter((value) => value === className).length;
    assert.equal(count, 1);
  });

  runtime.stop();
  assertThemeHookState(boardNodes, false);
  assert.equal(
    boardNodes.boardCanvas.style.getPropertyValue("--ad-ext-theme-board-size"),
    ""
  );
});

test("theme-x01 keeps info-style content slot layout hooks stable across mutations", async () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "501";
  const boardNodes = createInfoStyleBoardFixture(documentRef);
  const windowRef = createFakeWindow({ documentRef });
  const runtime = createBootstrap({
    windowRef,
    documentRef,
    config: createThemeConfig("x01", {
      showAvg: true,
    }),
  });

  runtime.start();
  await wait(5);

  assertThemeHookState(boardNodes, true);
  assert.equal(
    boardNodes.boardCanvas.style.getPropertyValue("--ad-ext-theme-board-size"),
    "680px"
  );
  assert.equal(
    documentRef.querySelectorAll(".ad-ext-theme-content-slot").length,
    1
  );

  documentRef.flushMutations();
  await wait(5);
  assertThemeHookState(boardNodes, true);

  runtime.stop();
  assertThemeHookState(boardNodes, false);
  assert.equal(
    boardNodes.boardCanvas.style.getPropertyValue("--ad-ext-theme-board-size"),
    ""
  );
});

test("theme-shanghai mounts idempotently and cleans up style", async () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "Shanghai";
  const windowRef = createFakeWindow({ documentRef });
  const runtime = createBootstrap({
    windowRef,
    documentRef,
    config: createThemeConfig("shanghai", {
      showAvg: false,
    }),
  });

  runtime.start();
  runtime.start();
  await wait(5);

  assert.equal(Boolean(documentRef.getElementById("ad-ext-theme-shanghai-style")), true);
  assert.equal(documentRef.turnContainer.classList.contains("ad-ext-turn-preview-space"), true);

  runtime.stop();
  assert.equal(Boolean(documentRef.getElementById("ad-ext-theme-shanghai-style")), false);
  assert.equal(documentRef.turnContainer.classList.contains("ad-ext-turn-preview-space"), false);
});

test("theme-bermuda applies includes matching and cleans up on stop", async () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "Bermuda 701";
  const windowRef = createFakeWindow({ documentRef });
  const runtime = createBootstrap({
    windowRef,
    documentRef,
    config: createThemeConfig("bermuda"),
  });

  runtime.start();
  runtime.start();
  await wait(5);

  assert.equal(Boolean(documentRef.getElementById("ad-ext-theme-bermuda-style")), true);
  assert.equal(documentRef.turnContainer.classList.contains("ad-ext-turn-preview-space"), true);

  runtime.stop();
  assert.equal(Boolean(documentRef.getElementById("ad-ext-theme-bermuda-style")), false);
  assert.equal(documentRef.turnContainer.classList.contains("ad-ext-turn-preview-space"), false);
});

test("theme-cricket activates for tactics and cleans style on cleanup", async () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "Tactics";
  const windowRef = createFakeWindow({ documentRef });
  const runtime = createBootstrap({
    windowRef,
    documentRef,
    config: createThemeConfig("cricket", {
      showAvg: true,
    }),
  });

  runtime.start();
  runtime.start();
  await wait(5);

  assert.equal(Boolean(documentRef.getElementById("ad-ext-theme-cricket-style")), true);
  assert.equal(documentRef.turnContainer.classList.contains("ad-ext-turn-preview-space"), false);

  runtime.stop();
  assert.equal(Boolean(documentRef.getElementById("ad-ext-theme-cricket-style")), false);
  assert.equal(documentRef.turnContainer.classList.contains("ad-ext-turn-preview-space"), false);
});

test("theme-bull-off applies includes matching without preview-space class", async () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "Bull-off Finals";
  const windowRef = createFakeWindow({ documentRef });
  const runtime = createBootstrap({
    windowRef,
    documentRef,
    config: createThemeConfig("bullOff", {
      contrastPreset: "high",
    }),
  });

  runtime.start();
  runtime.start();
  await wait(5);

  assert.equal(Boolean(documentRef.getElementById("ad-ext-theme-bull-off-style")), true);
  assert.equal(documentRef.turnContainer.classList.contains("ad-ext-turn-preview-space"), false);

  runtime.stop();
  assert.equal(Boolean(documentRef.getElementById("ad-ext-theme-bull-off-style")), false);
});
