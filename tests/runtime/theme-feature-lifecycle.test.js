import test from "node:test";
import assert from "node:assert/strict";

import { createBootstrap } from "../../src/core/bootstrap.js";
import { createDomGuards } from "../../src/core/dom-guards.js";
import { createListenerRegistry } from "../../src/core/listener-registry.js";
import { createObserverRegistry } from "../../src/core/observer-registry.js";
import { mountThemeX01 } from "../../src/features/themes/x01/index.js";
import { FakeDocument, createFakeWindow } from "./fake-dom.js";
import {
  THEME_CRICKET_READABILITY,
  THEME_LAYOUT_HOOK_CLASSES,
  resolveThemeBoardCanvasTarget,
  selectWidestContentLayoutCandidate,
} from "../../src/features/themes/shared/mount-theme-feature.js";

function wait(ms = 0) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createMatchWindow(documentRef, matchId = "test-match") {
  return createFakeWindow({
    documentRef,
    href: `https://play.autodarts.io/matches/${matchId}`,
  });
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

function createBoardModeButtons(documentRef, activeMode = "segments") {
  const toolbar = documentRef.createElement("div");
  const buttons = {};

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

function createDartsZoomPreviewFixture(documentRef) {
  const zoomHost = documentRef.createElement("autodarts-tools-zoom");
  const shadowRoot = documentRef.createElement("div");
  const previewWrapper = documentRef.createElement("div");
  const previewImage = documentRef.createElement("img");

  previewImage.setAttribute("src", "https://play.autodarts.io/images/board.png");
  previewWrapper.appendChild(previewImage);
  shadowRoot.appendChild(previewWrapper);
  zoomHost.shadowRoot = shadowRoot;
  documentRef.main.appendChild(zoomHost);

  return {
    zoomHost,
    shadowRoot,
    previewImage,
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

function createPanelViewportBoardFixture(documentRef, options = {}) {
  const withContentSlot = options.withContentSlot === true;
  const boardPanel = documentRef.createElement("div");
  const boardControls = documentRef.createElement("div");
  const boardCanvas = documentRef.createElement("div");
  const boardSvg = documentRef.createElementNS("http://www.w3.org/2000/svg", "svg");
  const contentSlot = withContentSlot ? documentRef.createElement("div") : null;
  const contentLeft = withContentSlot ? documentRef.createElement("div") : null;
  const contentBoard = withContentSlot ? documentRef.createElement("div") : null;
  const playerDisplay = withContentSlot ? documentRef.createElement("div") : null;

  boardControls.classList.add("chakra-stack");
  boardCanvas.classList.add("showAnimations");
  boardCanvas.__rect = { width: 780, height: 620 };
  boardSvg.setAttribute("viewBox", "0 0 1000 1000");

  const undoButton = documentRef.createElement("button");
  undoButton.textContent = "Undo";
  boardControls.appendChild(undoButton);

  const outerRing = documentRef.createElementNS("http://www.w3.org/2000/svg", "circle");
  outerRing.setAttribute("r", "500");
  boardSvg.appendChild(outerRing);
  for (let value = 1; value <= 20; value += 1) {
    const labelNode = documentRef.createElementNS("http://www.w3.org/2000/svg", "text");
    labelNode.textContent = String(value);
    boardSvg.appendChild(labelNode);
  }

  boardCanvas.appendChild(boardSvg);
  boardPanel.appendChild(boardControls);
  boardPanel.appendChild(boardCanvas);

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
    boardViewport: boardPanel,
    boardCanvas,
    boardSvg,
  };
}

function createDecorativeBoardLikeSvgFixture(documentRef, options = {}) {
  const shell = documentRef.createElement("div");
  const svg = documentRef.createElementNS("http://www.w3.org/2000/svg", "svg");
  const group = documentRef.createElementNS("http://www.w3.org/2000/svg", "g");
  const radius = Number(options.radius) > 0 ? Number(options.radius) : 680;

  shell.__rect = { width: Number(options.width) || 980, height: Number(options.height) || 980 };
  svg.__rect = { width: Number(options.width) || 980, height: Number(options.height) || 980 };
  svg.setAttribute("viewBox", "0 0 1000 1000");

  const outerRing = documentRef.createElementNS("http://www.w3.org/2000/svg", "circle");
  outerRing.setAttribute("r", String(radius));
  group.appendChild(outerRing);

  for (let value = 1; value <= 20; value += 1) {
    const labelNode = documentRef.createElementNS("http://www.w3.org/2000/svg", "text");
    labelNode.textContent = String(value);
    group.appendChild(labelNode);
  }

  for (let index = 0; index < 42; index += 1) {
    const pathNode = documentRef.createElementNS("http://www.w3.org/2000/svg", "path");
    pathNode.setAttribute("d", `M ${index} 0 L ${index + 1} 1 L ${index + 2} 0 Z`);
    group.appendChild(pathNode);
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

function createNestedShowAnimationsBoardFixture(documentRef, options = {}) {
  const nodes = createBoardFixture(documentRef, options);
  const innerBoardLayer = documentRef.createElement("div");
  const eventOverlay = documentRef.createElement("div");
  innerBoardLayer.classList.add("css-13u3cwk");
  eventOverlay.classList.add("css-event-overlay");
  nodes.boardCanvas.removeChild(nodes.boardSvg);
  innerBoardLayer.appendChild(nodes.boardSvg);
  nodes.boardCanvas.appendChild(eventOverlay);
  nodes.boardCanvas.appendChild(innerBoardLayer);
  return {
    ...nodes,
    eventOverlay,
    innerBoardLayer,
  };
}

function createSparseImageBackedBoardSvg(documentRef, size = 620) {
  const boardSvg = documentRef.createElementNS("http://www.w3.org/2000/svg", "svg");
  const defs = documentRef.createElementNS("http://www.w3.org/2000/svg", "defs");
  const overlayGroup = documentRef.createElementNS("http://www.w3.org/2000/svg", "g");
  const overlayRect = documentRef.createElementNS("http://www.w3.org/2000/svg", "rect");

  boardSvg.__rect = { width: size, height: size };
  boardSvg.setAttribute("viewBox", "0 0 1000 1000");
  overlayGroup.setAttribute("transform", "translate(500, 500)");
  overlayRect.setAttribute("opacity", "0");
  overlayRect.setAttribute("x", "-500");
  overlayRect.setAttribute("y", "-500");
  overlayRect.setAttribute("width", "1000");
  overlayRect.setAttribute("height", "1000");
  overlayGroup.appendChild(overlayRect);
  boardSvg.appendChild(defs);
  boardSvg.appendChild(overlayGroup);

  return boardSvg;
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

function createImageBackedInfoStyleBoardFixture(documentRef) {
  const contentSlot = documentRef.createElement("div");
  const contentLeft = documentRef.createElement("div");
  const contentBoard = documentRef.createElement("div");
  const playerDisplay = documentRef.createElement("div");
  const boardShell = documentRef.createElement("div");
  const boardStack = documentRef.createElement("div");
  const boardPanel = documentRef.createElement("div");
  const boardToolbar = documentRef.createElement("div");
  const boardToolbarInner = documentRef.createElement("div");
  const boardControls = documentRef.createElement("div");
  const boardEventShell = documentRef.createElement("div");
  const boardCanvas = documentRef.createElement("div");
  const boardMediaRoot = documentRef.createElement("div");
  const boardImage = documentRef.createElement("img");
  const boardSvg = createSparseImageBackedBoardSvg(documentRef);

  contentSlot.classList.add("css-u5v8bq");
  contentLeft.classList.add("css-rc3vw3");
  contentBoard.classList.add("css-vo3506");
  boardShell.classList.add("css-tkevr6");
  boardStack.classList.add("css-7ls08l");
  boardPanel.classList.add("css-jbngkd");
  boardToolbar.classList.add("chakra-stack", "css-vw7qil");
  boardToolbarInner.classList.add("chakra-stack", "css-1igwmid");
  boardControls.classList.add("chakra-stack", "css-7bjx6y");
  boardEventShell.classList.add("showAnimations", "css-1cdcn26");
  boardCanvas.classList.add("css-1nz0cmz");
  boardMediaRoot.classList.add("css-79elbk");
  boardImage.classList.add("chakra-image", "css-11cxvkr");
  boardImage.setAttribute("src", "blob:https://play.autodarts.io/test-virtual-board");
  playerDisplay.id = "ad-ext-player-display";

  contentSlot.__rect = { width: 1660, height: 680 };
  contentLeft.__rect = { width: 1032, height: 680 };
  contentBoard.__rect = { width: 620, height: 680 };
  boardPanel.__rect = { width: 620, height: 680 };
  boardEventShell.__rect = { width: 620, height: 620 };
  boardCanvas.__rect = { width: 620, height: 620 };
  boardMediaRoot.__rect = { width: 620, height: 620 };
  boardImage.__rect = { width: 620, height: 620 };

  const ringButton = documentRef.createElement("button");
  ringButton.type = "button";
  ringButton.setAttribute("aria-label", "Show virtual number ring");
  const legOneButton = documentRef.createElement("button");
  legOneButton.type = "button";
  legOneButton.setAttribute("data-active", "true");
  legOneButton.textContent = "1";
  const legTwoButton = documentRef.createElement("button");
  legTwoButton.type = "button";
  legTwoButton.textContent = "2";
  const legThreeButton = documentRef.createElement("button");
  legThreeButton.type = "button";
  legThreeButton.textContent = "3";
  boardToolbarInner.appendChild(ringButton);
  boardToolbarInner.appendChild(legOneButton);
  boardToolbarInner.appendChild(legTwoButton);
  boardToolbarInner.appendChild(legThreeButton);
  boardToolbar.appendChild(boardToolbarInner);

  const controlsSpacer = documentRef.createElement("div");
  const undoButton = documentRef.createElement("button");
  undoButton.type = "button";
  undoButton.textContent = "Undo";
  const nextButton = documentRef.createElement("button");
  nextButton.type = "button";
  nextButton.textContent = "Next";
  boardControls.appendChild(controlsSpacer);
  boardControls.appendChild(undoButton);
  boardControls.appendChild(nextButton);

  boardMediaRoot.appendChild(boardImage);
  boardMediaRoot.appendChild(boardSvg);
  boardCanvas.appendChild(boardMediaRoot);
  boardEventShell.appendChild(boardCanvas);
  boardPanel.appendChild(boardToolbar);
  boardPanel.appendChild(boardControls);
  boardPanel.appendChild(boardEventShell);
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
    boardToolbar,
    boardControls,
    boardViewport: boardPanel,
    boardEventShell,
    boardCanvas: boardMediaRoot,
    boardSvg,
    boardMediaRoot,
  };
}

function addPlayerCards(documentRef, playerDisplayNode, count) {
  if (!playerDisplayNode || !Number.isFinite(count) || count <= 0) {
    return;
  }

  for (let index = 0; index < count; index += 1) {
    const playerNode = documentRef.createElement("div");
    playerNode.classList.add("ad-ext-player");
    if (index === 0) {
      playerNode.classList.add("ad-ext-player-active");
    }

    const stackNode = documentRef.createElement("div");
    stackNode.classList.add("chakra-stack");
    const nameNode = documentRef.createElement("p");
    nameNode.classList.add("ad-ext-player-name");
    nameNode.textContent = `PLAYER-${index + 1}`;
    const scoreNode = documentRef.createElement("p");
    scoreNode.classList.add("ad-ext-player-score");
    scoreNode.textContent = String(index * 10);
    stackNode.appendChild(nameNode);
    stackNode.appendChild(scoreNode);
    playerNode.appendChild(stackNode);
    playerDisplayNode.appendChild(playerNode);
  }
}

function assertThemeHookState(nodes, expectedActive) {
  const expectations = [
    [nodes.contentSlot, THEME_LAYOUT_HOOK_CLASSES.contentSlot],
    [nodes.contentLeft, THEME_LAYOUT_HOOK_CLASSES.contentLeft],
    [nodes.contentBoard, THEME_LAYOUT_HOOK_CLASSES.contentBoard],
    [nodes.boardPanel, THEME_LAYOUT_HOOK_CLASSES.boardPanel],
    [nodes.boardControls, THEME_LAYOUT_HOOK_CLASSES.boardControls],
    [nodes.boardViewport, THEME_LAYOUT_HOOK_CLASSES.boardViewport],
    [nodes.boardEventShell, THEME_LAYOUT_HOOK_CLASSES.boardEventShell],
    [nodes.boardCanvas, THEME_LAYOUT_HOOK_CLASSES.boardCanvas],
    [nodes.boardMediaRoot, THEME_LAYOUT_HOOK_CLASSES.boardMediaRoot],
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

test("theme board canvas resolver prefers inner board layer over outer .showAnimations", () => {
  const documentRef = new FakeDocument();
  const boardCanvas = documentRef.createElement("div");
  const innerBoardLayer = documentRef.createElement("div");
  const boardSvg = documentRef.createElementNS("http://www.w3.org/2000/svg", "svg");

  boardCanvas.classList.add("showAnimations", "ad-ext-theme-board-canvas");
  innerBoardLayer.classList.add("css-13u3cwk");
  innerBoardLayer.appendChild(boardSvg);
  boardCanvas.appendChild(innerBoardLayer);
  documentRef.main.appendChild(boardCanvas);

  assert.equal(resolveThemeBoardCanvasTarget(boardSvg), innerBoardLayer);
});

test("theme board canvas resolver keeps outer .showAnimations fallback when no inner layer exists", () => {
  const documentRef = new FakeDocument();
  const boardCanvas = documentRef.createElement("div");
  const boardSvg = documentRef.createElementNS("http://www.w3.org/2000/svg", "svg");

  boardCanvas.classList.add("showAnimations", "ad-ext-theme-board-canvas");
  boardCanvas.appendChild(boardSvg);
  documentRef.main.appendChild(boardCanvas);

  assert.equal(resolveThemeBoardCanvasTarget(boardSvg), boardCanvas);
});

test("theme re-resolves the visible board when board-input mode toggles only via aria-pressed state", async () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "501";
  const modeButtons = createBoardModeButtons(documentRef, "segments");
  const hiddenBoard = createBoardFixture(documentRef, { withContentSlot: true });
  const visibleBoard = createBoardFixture(documentRef, { withContentSlot: true });
  hiddenBoard.contentSlot.setAttribute("aria-hidden", "true");
  const windowRef = createMatchWindow(documentRef, "theme-x01-board-mode-toggle");
  const observers = createObserverRegistry();
  const listeners = createListenerRegistry();
  const cleanup = mountThemeX01({
    windowRef,
    documentRef,
    domGuards: createDomGuards({ documentRef }),
    registries: {
      observers,
      listeners,
    },
    config: {
      getFeatureConfig() {
        return {
          contrastPreset: "high",
        };
      },
    },
    helpers: {
      createRafScheduler(callback) {
        return {
          schedule() {
            callback();
          },
          cancel() {},
          isScheduled() {
            return false;
          },
        };
      },
    },
  });

  assert.equal(hiddenBoard.boardSvg.classList.contains(THEME_LAYOUT_HOOK_CLASSES.boardSvg), false);
  assert.equal(visibleBoard.boardSvg.classList.contains(THEME_LAYOUT_HOOK_CLASSES.boardSvg), true);

  hiddenBoard.contentSlot.removeAttribute("aria-hidden");
  visibleBoard.contentSlot.setAttribute("aria-hidden", "true");
  modeButtons.segments.setAttribute("aria-pressed", "false");
  modeButtons.live.setAttribute("aria-pressed", "true");
  const observer = observers.get("theme-x01:theme-observer");
  assert.ok(observer);
  const observeOptions = observer.observeCalls?.[0]?.options || {};
  assert.equal(observeOptions.attributes, true);
  assert.equal(Array.isArray(observeOptions.attributeFilter), true);
  assert.equal(observeOptions.attributeFilter.includes("aria-pressed"), true);
  assert.equal(observeOptions.attributeFilter.includes("checked"), true);
  observer.callback([
    {
      type: "attributes",
      target: modeButtons.live,
      attributeName: "aria-pressed",
      addedNodes: [],
      removedNodes: [],
    },
  ]);

  assert.equal(hiddenBoard.boardSvg.classList.contains(THEME_LAYOUT_HOOK_CLASSES.boardSvg), true);
  assert.equal(visibleBoard.boardSvg.classList.contains(THEME_LAYOUT_HOOK_CLASSES.boardSvg), false);

  cleanup();
});

test("theme accepts panel-as-viewport board layouts without invalidating layout hooks", async () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "501";
  const boardNodes = createPanelViewportBoardFixture(documentRef, { withContentSlot: true });
  const windowRef = createMatchWindow(documentRef, "theme-x01-panel-viewport-layout");
  const runtime = createBootstrap({
    windowRef,
    documentRef,
    config: createThemeConfig("x01", {
      showAvg: true,
    }),
  });

  runtime.start();
  await wait(5);

  assert.equal(boardNodes.boardPanel.classList.contains(THEME_LAYOUT_HOOK_CLASSES.boardPanel), true);
  assert.equal(boardNodes.boardCanvas.classList.contains(THEME_LAYOUT_HOOK_CLASSES.boardCanvas), true);
  assert.equal(boardNodes.boardSvg.classList.contains(THEME_LAYOUT_HOOK_CLASSES.boardSvg), true);
  assert.equal(boardNodes.contentSlot.classList.contains(THEME_LAYOUT_HOOK_CLASSES.contentSlot), true);

  runtime.stop();
});

test("theme keeps existing layout hooks when a board-like decorative svg appears outside panel context", async () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "501";
  const boardNodes = createBoardFixture(documentRef, { withContentSlot: true });
  const windowRef = createMatchWindow(documentRef, "theme-x01-ignore-decorative-boardlike-svg");
  const runtime = createBootstrap({
    windowRef,
    documentRef,
    config: createThemeConfig("x01", {
      showAvg: true,
    }),
  });

  runtime.start();
  await wait(5);

  assert.equal(boardNodes.boardSvg.classList.contains(THEME_LAYOUT_HOOK_CLASSES.boardSvg), true);
  assert.equal(boardNodes.contentSlot.classList.contains(THEME_LAYOUT_HOOK_CLASSES.contentSlot), true);

  const decorative = createDecorativeBoardLikeSvgFixture(documentRef, {
    width: 1120,
    height: 1120,
    radius: 720,
  });
  documentRef.flushMutations();
  await wait(5);

  assert.equal(boardNodes.boardSvg.classList.contains(THEME_LAYOUT_HOOK_CLASSES.boardSvg), true);
  assert.equal(boardNodes.contentSlot.classList.contains(THEME_LAYOUT_HOOK_CLASSES.contentSlot), true);
  assert.equal(decorative.svg.classList.contains(THEME_LAYOUT_HOOK_CLASSES.boardSvg), false);
  assert.equal(
    documentRef.querySelectorAll(`.${THEME_LAYOUT_HOOK_CLASSES.contentSlot}`).length,
    1
  );
  assert.equal(
    documentRef.querySelector(`.${THEME_LAYOUT_HOOK_CLASSES.contentSlot}`),
    boardNodes.contentSlot
  );

  runtime.stop();
});

test("theme clears stale hooks when previous valid board subtree is removed and only invalid context remains", async () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "501";
  const boardNodes = createBoardFixture(documentRef, { withContentSlot: true });
  const windowRef = createMatchWindow(documentRef, "theme-x01-clear-stale-invalid-context");
  const runtime = createBootstrap({
    windowRef,
    documentRef,
    config: createThemeConfig("x01", {
      showAvg: true,
    }),
  });

  runtime.start();
  await wait(5);

  assert.equal(boardNodes.boardSvg.classList.contains(THEME_LAYOUT_HOOK_CLASSES.boardSvg), true);
  assert.equal(boardNodes.contentSlot.classList.contains(THEME_LAYOUT_HOOK_CLASSES.contentSlot), true);

  documentRef.main.removeChild(boardNodes.contentSlot);
  createDecorativeBoardLikeSvgFixture(documentRef, {
    width: 1120,
    height: 1120,
    radius: 720,
  });
  documentRef.flushMutations();
  await wait(5);

  assert.equal(boardNodes.boardSvg.classList.contains(THEME_LAYOUT_HOOK_CLASSES.boardSvg), false);
  assert.equal(boardNodes.contentSlot.classList.contains(THEME_LAYOUT_HOOK_CLASSES.contentSlot), false);

  runtime.stop();
});

test("theme-x01 mounts idempotently and cleans up style plus preview spacing", async () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "501";
  const windowRef = createMatchWindow(documentRef, "theme-x01-idempotent");
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
  assert.equal(documentRef.turnContainer.classList.contains("ad-ext-turn-preview-space"), false);
  assert.equal(documentRef.querySelectorAll(".ad-ext-theme-board-panel").length, 0);
  assert.equal(documentRef.querySelectorAll(".ad-ext-theme-content-slot").length, 0);

  runtime.stop();
  assert.equal(Boolean(documentRef.getElementById("ad-ext-theme-x01-style")), false);
  assert.equal(documentRef.turnContainer.classList.contains("ad-ext-turn-preview-space"), false);
});

test("theme-x01 removes style when route leaves matches even if variant state is stale", async () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "501";
  const windowRef = createMatchWindow(documentRef, "theme-x01-route-switch");
  const runtime = createBootstrap({
    windowRef,
    documentRef,
    config: createThemeConfig("x01", {
      showAvg: true,
    }),
  });

  runtime.start();
  await wait(5);
  assert.equal(Boolean(documentRef.getElementById("ad-ext-theme-x01-style")), true);

  runtime.context.gameState.applyMatch({
    variant: "501",
    players: [],
    turns: [],
  });
  windowRef.history.pushState({}, "", "/lobbies/route-switch");
  documentRef.flushMutations();
  await wait(5);

  assert.equal(Boolean(documentRef.getElementById("ad-ext-theme-x01-style")), false);
  runtime.stop();
});

test("theme-x01 removes style when xConfig hash route is active on a match path", async () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "501";
  const windowRef = createMatchWindow(documentRef, "theme-x01-xconfig-route");
  const runtime = createBootstrap({
    windowRef,
    documentRef,
    config: createThemeConfig("x01", {
      showAvg: true,
    }),
  });

  runtime.start();
  await wait(5);
  assert.equal(Boolean(documentRef.getElementById("ad-ext-theme-x01-style")), true);

  windowRef.history.pushState({}, "", "/matches/theme-x01-xconfig-route#ad-xconfig");
  documentRef.flushMutations();
  await wait(5);

  assert.equal(Boolean(documentRef.getElementById("ad-ext-theme-x01-style")), false);
  runtime.stop();
});

test("theme-x01 applies board layout hooks when board exists and removes them on cleanup", async () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "501";
  const boardNodes = createBoardFixture(documentRef, { withContentSlot: true });
  const windowRef = createMatchWindow(documentRef, "theme-x01-board-hooks");
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
  assert.equal(
    boardNodes.boardCanvas.classList.contains(THEME_LAYOUT_HOOK_CLASSES.boardEventShell),
    false
  );
  assert.equal(
    boardNodes.boardCanvas.classList.contains(THEME_LAYOUT_HOOK_CLASSES.boardMediaRoot),
    false
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
  const windowRef = createMatchWindow(documentRef, "theme-x01-info-layout");
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
  const windowRef = createMatchWindow(documentRef, "theme-shanghai-idempotent");
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
  assert.equal(documentRef.turnContainer.classList.contains("ad-ext-turn-preview-space"), false);

  runtime.stop();
  assert.equal(Boolean(documentRef.getElementById("ad-ext-theme-shanghai-style")), false);
  assert.equal(documentRef.turnContainer.classList.contains("ad-ext-turn-preview-space"), false);
});

test("theme-bermuda applies includes matching and cleans up on stop", async () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "Bermuda 701";
  const windowRef = createMatchWindow(documentRef, "theme-bermuda-includes");
  const runtime = createBootstrap({
    windowRef,
    documentRef,
    config: createThemeConfig("bermuda"),
  });

  runtime.start();
  runtime.start();
  await wait(5);

  assert.equal(Boolean(documentRef.getElementById("ad-ext-theme-bermuda-style")), true);
  assert.equal(documentRef.turnContainer.classList.contains("ad-ext-turn-preview-space"), false);

  runtime.stop();
  assert.equal(Boolean(documentRef.getElementById("ad-ext-theme-bermuda-style")), false);
  assert.equal(documentRef.turnContainer.classList.contains("ad-ext-turn-preview-space"), false);
});

test("under-throws themes enable preview spacing when visible darts-zoom previews exist", async () => {
  const cases = [
    { configKey: "x01", variant: "501", featureConfig: { showAvg: true } },
    { configKey: "shanghai", variant: "Shanghai", featureConfig: { showAvg: false } },
    { configKey: "bermuda", variant: "Bermuda 701", featureConfig: {} },
  ];

  for (const entry of cases) {
    const documentRef = new FakeDocument();
    documentRef.variantElement.textContent = entry.variant;
    createDartsZoomPreviewFixture(documentRef);
    const windowRef = createMatchWindow(documentRef, `theme-under-throws-${entry.configKey}`);
    const runtime = createBootstrap({
      windowRef,
      documentRef,
      config: createThemeConfig(entry.configKey, entry.featureConfig),
    });

    runtime.start();
    await wait(5);

    assert.equal(documentRef.turnContainer.classList.contains("ad-ext-turn-preview-space"), true);

    runtime.stop();
    assert.equal(documentRef.turnContainer.classList.contains("ad-ext-turn-preview-space"), false);
  }
});

test("theme-cricket activates for tactics and cleans style on cleanup", async () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "Tactics";
  const windowRef = createMatchWindow(documentRef, "theme-cricket-tactics");
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

test("theme-cricket auto-hides board for readability and keeps player width when manually showing a narrow board", async () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "Tactics";
  const boardNodes = createBoardFixture(documentRef, { withContentSlot: true });
  boardNodes.contentSlot.__rect = { width: 1600, height: 680 };
  boardNodes.contentBoard.__rect = { width: 212, height: 620 };
  boardNodes.boardViewport.__rect = { width: 620, height: 620 };
  boardNodes.boardCanvas.__rect = { width: 620, height: 620 };
  addPlayerCards(documentRef, documentRef.getElementById("ad-ext-player-display"), 6);

  const windowRef = createMatchWindow(documentRef, "theme-cricket-readability");
  const runtime = createBootstrap({
    windowRef,
    documentRef,
    config: createThemeConfig("cricket", {
      showAvg: true,
    }),
  });

  runtime.start();
  await wait(5);

  const noticeNode = documentRef.getElementById(THEME_CRICKET_READABILITY.noticeId);
  assert.equal(
    boardNodes.contentSlot.classList.contains(THEME_CRICKET_READABILITY.constrainedClass),
    true
  );
  assert.equal(
    boardNodes.contentSlot.classList.contains(THEME_CRICKET_READABILITY.boardHiddenClass),
    true
  );
  assert.equal(
    boardNodes.contentSlot.style.getPropertyValue("--ad-ext-theme-cricket-player-area-required-width"),
    "1380px"
  );
  assert.equal(
    boardNodes.contentSlot.style.getPropertyValue("--ad-ext-theme-cricket-player-count"),
    "6"
  );
  assert.equal(Boolean(noticeNode), true);
  const noticeTextNode = noticeNode?.querySelector?.(`.${THEME_CRICKET_READABILITY.noticeTextClass}`);
  assert.equal(noticeTextNode?.textContent || "", "Board wegen Lesbarkeit ausgeblendet.");
  const toggleNode = noticeNode?.querySelector?.(`.${THEME_CRICKET_READABILITY.toggleClass}`);
  assert.equal(Boolean(toggleNode), true);
  assert.equal(toggleNode?.textContent || "", "Board anzeigen");
  assert.equal(
    boardNodes.contentSlot.style.getPropertyValue("--ad-ext-theme-cricket-board-width"),
    ""
  );
  assert.equal(
    boardNodes.boardCanvas.style.getPropertyValue("--ad-ext-theme-board-size"),
    ""
  );

  toggleNode.click();
  await wait(5);
  assert.equal(
    boardNodes.contentSlot.classList.contains(THEME_CRICKET_READABILITY.boardHiddenClass),
    false
  );
  assert.equal(
    boardNodes.contentSlot.classList.contains(THEME_CRICKET_READABILITY.boardForcedVisibleClass),
    true
  );
  assert.equal(
    boardNodes.contentSlot.style.getPropertyValue("--ad-ext-theme-cricket-board-width"),
    "212px"
  );
  assert.equal(
    boardNodes.contentSlot.style.getPropertyValue("--ad-ext-theme-cricket-player-area-required-width"),
    "1380px"
  );
  assert.equal(
    boardNodes.contentSlot.style.getPropertyValue("--ad-ext-theme-cricket-player-count"),
    "6"
  );
  assert.equal(
    noticeTextNode?.textContent || "",
    "Board manuell eingeblendet, Spielerinfos behalten Priorität."
  );
  assert.equal(toggleNode?.textContent || "", "Board ausblenden");
  assert.equal(
    boardNodes.boardCanvas.style.getPropertyValue("--ad-ext-theme-board-size"),
    "212px"
  );

  toggleNode.click();
  await wait(5);
  assert.equal(
    boardNodes.contentSlot.classList.contains(THEME_CRICKET_READABILITY.boardHiddenClass),
    true
  );
  assert.equal(
    boardNodes.contentSlot.style.getPropertyValue("--ad-ext-theme-cricket-board-width"),
    ""
  );
  assert.equal(toggleNode?.textContent || "", "Board anzeigen");
  assert.equal(
    boardNodes.boardCanvas.style.getPropertyValue("--ad-ext-theme-board-size"),
    ""
  );

  boardNodes.contentSlot.__rect = { width: 1720, height: 680 };
  boardNodes.contentBoard.__rect = { width: 620, height: 620 };
  boardNodes.boardViewport.__rect = { width: 620, height: 620 };
  boardNodes.boardCanvas.__rect = { width: 620, height: 620 };
  windowRef.dispatchEvent(new windowRef.Event("resize"));
  await wait(5);

  assert.equal(
    boardNodes.contentSlot.classList.contains(THEME_CRICKET_READABILITY.constrainedClass),
    false
  );
  assert.equal(
    boardNodes.contentSlot.classList.contains(THEME_CRICKET_READABILITY.boardHiddenClass),
    false
  );
  assert.equal(
    boardNodes.contentSlot.style.getPropertyValue("--ad-ext-theme-cricket-board-width"),
    ""
  );
  assert.equal(Boolean(documentRef.getElementById(THEME_CRICKET_READABILITY.noticeId)), false);
  assert.equal(
    boardNodes.boardCanvas.style.getPropertyValue("--ad-ext-theme-board-size"),
    "620px"
  );

  runtime.stop();
  assert.equal(Boolean(documentRef.getElementById(THEME_CRICKET_READABILITY.noticeId)), false);
  assert.equal(
    boardNodes.contentSlot.classList.contains(THEME_CRICKET_READABILITY.constrainedClass),
    false
  );
  assert.equal(
    boardNodes.contentSlot.style.getPropertyValue("--ad-ext-theme-cricket-player-area-required-width"),
    ""
  );
  assert.equal(
    boardNodes.contentSlot.style.getPropertyValue("--ad-ext-theme-cricket-player-count"),
    ""
  );
});

test("theme-cricket keeps the normal 4-player board visible in a dedicated right slot when space is sufficient", async () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "Tactics";
  const boardNodes = createBoardFixture(documentRef, { withContentSlot: true });
  boardNodes.contentSlot.__rect = { width: 1660, height: 680 };
  boardNodes.contentLeft.__rect = { width: 1032, height: 680 };
  boardNodes.contentBoard.__rect = { width: 620, height: 620 };
  boardNodes.boardViewport.__rect = { width: 620, height: 620 };
  boardNodes.boardCanvas.__rect = { width: 620, height: 620 };
  addPlayerCards(documentRef, documentRef.getElementById("ad-ext-player-display"), 4);

  const windowRef = createMatchWindow(documentRef, "theme-cricket-visible-four-players");
  const runtime = createBootstrap({
    windowRef,
    documentRef,
    config: createThemeConfig("cricket", {
      showAvg: true,
    }),
  });

  runtime.start();
  await wait(5);

  assert.equal(
    boardNodes.contentSlot.classList.contains(THEME_CRICKET_READABILITY.constrainedClass),
    false
  );
  assert.equal(
    boardNodes.contentSlot.classList.contains(THEME_CRICKET_READABILITY.boardHiddenClass),
    false
  );
  assert.equal(
    boardNodes.contentSlot.style.getPropertyValue("--ad-ext-theme-cricket-player-area-required-width"),
    "1032px"
  );
  assert.equal(
    boardNodes.contentSlot.style.getPropertyValue("--ad-ext-theme-cricket-board-width"),
    ""
  );
  assert.equal(
    boardNodes.boardCanvas.style.getPropertyValue("--ad-ext-theme-board-size"),
    "620px"
  );
  assert.equal(Boolean(documentRef.getElementById(THEME_CRICKET_READABILITY.noticeId)), false);

  runtime.stop();
});

test("theme-cricket keeps image-backed live board layouts inside the right theme slot", async () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "Tactics";
  const boardNodes = createImageBackedInfoStyleBoardFixture(documentRef);
  addPlayerCards(documentRef, documentRef.getElementById("ad-ext-player-display"), 4);

  const windowRef = createMatchWindow(documentRef, "theme-cricket-image-backed-live-board");
  const runtime = createBootstrap({
    windowRef,
    documentRef,
    config: createThemeConfig("cricket", {
      showAvg: true,
    }),
  });

  runtime.start();
  await wait(5);

  assert.equal(boardNodes.contentSlot.classList.contains(THEME_LAYOUT_HOOK_CLASSES.contentSlot), true);
  assert.equal(boardNodes.contentBoard.classList.contains(THEME_LAYOUT_HOOK_CLASSES.contentBoard), true);
  assert.equal(boardNodes.boardPanel.classList.contains(THEME_LAYOUT_HOOK_CLASSES.boardPanel), true);
  assert.equal(
    boardNodes.boardEventShell.classList.contains(THEME_LAYOUT_HOOK_CLASSES.boardEventShell),
    true
  );
  assert.equal(boardNodes.boardCanvas.classList.contains(THEME_LAYOUT_HOOK_CLASSES.boardCanvas), true);
  assert.equal(
    boardNodes.boardMediaRoot.classList.contains(THEME_LAYOUT_HOOK_CLASSES.boardMediaRoot),
    true
  );
  assert.equal(boardNodes.boardSvg.classList.contains(THEME_LAYOUT_HOOK_CLASSES.boardSvg), true);
  assert.equal(
    boardNodes.contentSlot.classList.contains(THEME_CRICKET_READABILITY.boardHiddenClass),
    false
  );
  assert.equal(
    boardNodes.boardCanvas.style.getPropertyValue("--ad-ext-theme-board-size"),
    "620px"
  );
  assert.equal(Boolean(documentRef.getElementById(THEME_CRICKET_READABILITY.noticeId)), false);

  runtime.stop();
});

test("theme-cricket keeps image-backed board hooks stable while the overlay svg is rebuilt", async () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "Tactics";
  const boardNodes = createImageBackedInfoStyleBoardFixture(documentRef);
  addPlayerCards(documentRef, documentRef.getElementById("ad-ext-player-display"), 4);

  const windowRef = createMatchWindow(documentRef, "theme-cricket-image-backed-gap");
  const runtime = createBootstrap({
    windowRef,
    documentRef,
    config: createThemeConfig("cricket", {
      showAvg: true,
    }),
  });

  runtime.start();
  await wait(5);

  assert.equal(boardNodes.contentBoard.classList.contains(THEME_LAYOUT_HOOK_CLASSES.contentBoard), true);
  assert.equal(boardNodes.boardPanel.classList.contains(THEME_LAYOUT_HOOK_CLASSES.boardPanel), true);
  assert.equal(boardNodes.boardCanvas.classList.contains(THEME_LAYOUT_HOOK_CLASSES.boardCanvas), true);

  boardNodes.boardMediaRoot.removeChild(boardNodes.boardSvg);
  documentRef.flushMutations();
  await wait(5);

  assert.equal(boardNodes.contentBoard.classList.contains(THEME_LAYOUT_HOOK_CLASSES.contentBoard), true);
  assert.equal(boardNodes.boardPanel.classList.contains(THEME_LAYOUT_HOOK_CLASSES.boardPanel), true);
  assert.equal(boardNodes.boardCanvas.classList.contains(THEME_LAYOUT_HOOK_CLASSES.boardCanvas), true);

  const replacementBoardSvg = createSparseImageBackedBoardSvg(documentRef);
  boardNodes.boardMediaRoot.appendChild(replacementBoardSvg);
  documentRef.flushMutations();
  await wait(5);

  assert.equal(
    replacementBoardSvg.classList.contains(THEME_LAYOUT_HOOK_CLASSES.boardSvg),
    true
  );
  assert.equal(boardNodes.contentBoard.classList.contains(THEME_LAYOUT_HOOK_CLASSES.contentBoard), true);
  assert.equal(boardNodes.boardPanel.classList.contains(THEME_LAYOUT_HOOK_CLASSES.boardPanel), true);

  runtime.stop();
});

test("theme-cricket measures the rendered 4-player left layout before forcing the board visible", async () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "Tactics";
  const boardNodes = createBoardFixture(documentRef, { withContentSlot: true });
  boardNodes.contentSlot.__rect = { width: 1480, height: 680 };
  boardNodes.contentLeft.__rect = { width: 1240, height: 680 };
  boardNodes.contentBoard.__rect = { width: 232, height: 620 };
  boardNodes.boardViewport.__rect = { width: 620, height: 620 };
  boardNodes.boardCanvas.__rect = { width: 620, height: 620 };
  addPlayerCards(documentRef, documentRef.getElementById("ad-ext-player-display"), 4);

  const windowRef = createMatchWindow(documentRef, "theme-cricket-readability-four-players");
  const runtime = createBootstrap({
    windowRef,
    documentRef,
    config: createThemeConfig("cricket", {
      showAvg: true,
    }),
  });

  runtime.start();
  await wait(5);

  const noticeNode = documentRef.getElementById(THEME_CRICKET_READABILITY.noticeId);
  const noticeTextNode = noticeNode?.querySelector?.(`.${THEME_CRICKET_READABILITY.noticeTextClass}`);
  const toggleNode = noticeNode?.querySelector?.(`.${THEME_CRICKET_READABILITY.toggleClass}`);

  assert.equal(
    boardNodes.contentSlot.style.getPropertyValue("--ad-ext-theme-cricket-player-area-required-width"),
    "1240px"
  );
  assert.equal(
    boardNodes.contentSlot.style.getPropertyValue("--ad-ext-theme-cricket-player-count"),
    "4"
  );
  assert.equal(
    boardNodes.contentSlot.classList.contains(THEME_CRICKET_READABILITY.boardHiddenClass),
    true
  );
  assert.equal(noticeTextNode?.textContent || "", "Board wegen Lesbarkeit ausgeblendet.");
  assert.equal(toggleNode?.textContent || "", "Board anzeigen");
  assert.equal(
    boardNodes.contentSlot.style.getPropertyValue("--ad-ext-theme-cricket-board-width"),
    ""
  );
  assert.equal(
    boardNodes.boardCanvas.style.getPropertyValue("--ad-ext-theme-board-size"),
    ""
  );

  toggleNode.click();
  await wait(5);

  assert.equal(
    boardNodes.contentSlot.classList.contains(THEME_CRICKET_READABILITY.boardHiddenClass),
    false
  );
  assert.equal(
    boardNodes.contentSlot.classList.contains(THEME_CRICKET_READABILITY.boardForcedVisibleClass),
    true
  );
  assert.equal(
    boardNodes.contentSlot.style.getPropertyValue("--ad-ext-theme-cricket-player-area-required-width"),
    "1240px"
  );
  assert.equal(
    boardNodes.contentSlot.style.getPropertyValue("--ad-ext-theme-cricket-player-count"),
    "4"
  );
  assert.equal(
    boardNodes.contentSlot.style.getPropertyValue("--ad-ext-theme-cricket-board-width"),
    "232px"
  );
  assert.equal(
    boardNodes.boardCanvas.style.getPropertyValue("--ad-ext-theme-board-size"),
    "232px"
  );

  runtime.stop();
});

test("theme-cricket keeps March 15 readability semantics with nested showAnimations board layers", async () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "Tactics";
  const boardNodes = createNestedShowAnimationsBoardFixture(documentRef, { withContentSlot: true });
  boardNodes.contentSlot.__rect = { width: 1600, height: 680 };
  boardNodes.contentBoard.__rect = { width: 212, height: 620 };
  boardNodes.boardViewport.__rect = { width: 620, height: 620 };
  boardNodes.boardCanvas.__rect = { width: 620, height: 620 };
  boardNodes.innerBoardLayer.__rect = { width: 620, height: 620 };
  addPlayerCards(documentRef, documentRef.getElementById("ad-ext-player-display"), 6);

  const windowRef = createMatchWindow(documentRef, "theme-cricket-readability-nested-board");
  const runtime = createBootstrap({
    windowRef,
    documentRef,
    config: createThemeConfig("cricket", {
      showAvg: true,
    }),
  });

  runtime.start();
  await wait(5);

  const noticeNode = documentRef.getElementById(THEME_CRICKET_READABILITY.noticeId);
  assert.equal(boardNodes.innerBoardLayer.classList.contains(THEME_LAYOUT_HOOK_CLASSES.boardCanvas), true);
  assert.equal(boardNodes.boardCanvas.classList.contains(THEME_LAYOUT_HOOK_CLASSES.boardCanvas), false);
  assert.equal(
    boardNodes.boardCanvas.classList.contains(THEME_LAYOUT_HOOK_CLASSES.boardEventShell),
    true
  );
  assert.equal(
    boardNodes.innerBoardLayer.classList.contains(THEME_LAYOUT_HOOK_CLASSES.boardMediaRoot),
    true
  );
  assert.equal(
    boardNodes.boardCanvas.style.getPropertyValue("--ad-ext-theme-board-size"),
    ""
  );
  assert.equal(
    boardNodes.innerBoardLayer.style.getPropertyValue("--ad-ext-theme-board-size"),
    ""
  );
  assert.equal(
    boardNodes.contentSlot.style.getPropertyValue("--ad-ext-theme-cricket-player-area-required-width"),
    "1380px"
  );
  assert.equal(
    boardNodes.contentSlot.style.getPropertyValue("--ad-ext-theme-cricket-player-count"),
    "6"
  );
  assert.equal(boardNodes.contentSlot.classList.contains(THEME_CRICKET_READABILITY.boardHiddenClass), true);
  assert.equal(Boolean(noticeNode), true);

  const noticeTextNode = noticeNode?.querySelector?.(`.${THEME_CRICKET_READABILITY.noticeTextClass}`);
  const toggleNode = noticeNode?.querySelector?.(`.${THEME_CRICKET_READABILITY.toggleClass}`);
  assert.equal(noticeTextNode?.textContent || "", "Board wegen Lesbarkeit ausgeblendet.");
  assert.equal(toggleNode?.textContent || "", "Board anzeigen");
  assert.equal(
    boardNodes.contentSlot.style.getPropertyValue("--ad-ext-theme-cricket-board-width"),
    ""
  );

  toggleNode.click();
  await wait(5);

  assert.equal(boardNodes.contentSlot.classList.contains(THEME_CRICKET_READABILITY.boardForcedVisibleClass), true);
  assert.equal(
    boardNodes.contentSlot.style.getPropertyValue("--ad-ext-theme-cricket-board-width"),
    "212px"
  );
  assert.equal(
    boardNodes.contentSlot.style.getPropertyValue("--ad-ext-theme-cricket-player-area-required-width"),
    "1380px"
  );
  assert.equal(
    noticeTextNode?.textContent || "",
    "Board manuell eingeblendet, Spielerinfos behalten Priorität."
  );

  assert.equal(
    boardNodes.boardCanvas.style.getPropertyValue("--ad-ext-theme-board-size"),
    "212px"
  );
  assert.equal(
    boardNodes.innerBoardLayer.style.getPropertyValue("--ad-ext-theme-board-size"),
    "212px"
  );

  boardNodes.contentSlot.__rect = { width: 1720, height: 680 };
  boardNodes.contentBoard.__rect = { width: 620, height: 620 };
  boardNodes.boardViewport.__rect = { width: 620, height: 620 };
  boardNodes.boardCanvas.__rect = { width: 620, height: 620 };
  boardNodes.innerBoardLayer.__rect = { width: 620, height: 620 };
  windowRef.dispatchEvent(new windowRef.Event("resize"));
  await wait(5);

  assert.equal(boardNodes.contentSlot.classList.contains(THEME_CRICKET_READABILITY.constrainedClass), false);
  assert.equal(boardNodes.contentSlot.classList.contains(THEME_CRICKET_READABILITY.boardHiddenClass), false);
  assert.equal(
    boardNodes.contentSlot.style.getPropertyValue("--ad-ext-theme-cricket-board-width"),
    ""
  );
  assert.equal(Boolean(documentRef.getElementById(THEME_CRICKET_READABILITY.noticeId)), false);
  assert.equal(
    boardNodes.boardCanvas.style.getPropertyValue("--ad-ext-theme-board-size"),
    "620px"
  );
  assert.equal(
    boardNodes.innerBoardLayer.style.getPropertyValue("--ad-ext-theme-board-size"),
    "620px"
  );

  runtime.stop();
});

test("theme-bull-off applies includes matching without preview-space class", async () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "Bull-off Finals";
  const windowRef = createMatchWindow(documentRef, "theme-bull-off-includes");
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
