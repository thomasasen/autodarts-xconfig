import test from "node:test";
import assert from "node:assert/strict";

import { createBootstrap } from "../../src/core/bootstrap.js";
import { createDomGuards } from "../../src/core/dom-guards.js";
import { createListenerRegistry } from "../../src/core/listener-registry.js";
import { createObserverRegistry } from "../../src/core/observer-registry.js";
import * as cricketRules from "../../src/domain/cricket-rules.js";
import * as variantRules from "../../src/domain/variant-rules.js";
import { initializeCricketGridFx } from "../../src/features/cricket-grid-fx/index.js";
import { ROOT_CLASS } from "../../src/features/cricket-grid-fx/style.js";
import { initializeCricketHighlighter } from "../../src/features/cricket-highlighter/index.js";
import { OVERLAY_ID as CRICKET_OVERLAY_ID } from "../../src/features/cricket-highlighter/style.js";
import { mountThemeX01 } from "../../src/features/themes/x01/index.js";
import { mountThemeGotcha } from "../../src/features/themes/gotcha/index.js";
import { mountThemeX01TwoPlayer } from "../../src/features/themes/x01-2player/index.js";
import { mountThemeCricket } from "../../src/features/themes/cricket/index.js";
import { syncCricketActivePlayerStateFromRenderState } from "../../src/features/themes/shared/cricket-readability.js";
import {
  X01_TWO_PLAYER_ACTIVE_ATTRIBUTE,
  X01_TWO_PLAYER_PLAYER_INDEX_ATTRIBUTE,
  X01_TWO_PLAYER_PLAYER_WRAPPER_ATTRIBUTE,
  X01_TWO_PLAYER_SLOTS,
  X01_TWO_PLAYER_SLOT_ATTRIBUTE,
  X01_TWO_PLAYER_STACK_ATTRIBUTE,
} from "../../src/features/themes/x01-2player/layout-contract.js";
import { FakeDocument, createFakeWindow } from "./fake-dom.js";
import {
  CRICKET_ACTIVE_PLAYER_ATTRIBUTE,
  THEME_CRICKET_READABILITY,
  THEME_LAYOUT_HOOK_CLASSES,
  resolveThemeBoardCanvasTarget,
  selectWidestContentLayoutCandidate,
} from "../../src/features/themes/shared/mount-theme-feature.js";
import {
  CRICKET_IDENTITY_SHELL_ATTRIBUTE,
  CRICKET_META_ATTRIBUTE,
  CRICKET_META_SHELL_ATTRIBUTE,
  CRICKET_ROW_ATTRIBUTE,
  CRICKET_SLOT_ATTRIBUTE,
  CRICKET_STACK_ATTRIBUTE,
  THEME_LAYOUT_RETENTION_CLASSES,
} from "../../src/features/themes/shared/theme-layout-contract.js";

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
  nodes.boardSvg.remove();
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
    boardCanvas,
    boardSvg,
    boardMediaRoot,
  };
}

function createSimpleCricketPlayerCard(documentRef, index) {
  const playerNode = documentRef.createElement("div");
  playerNode.classList.add("ad-ext-player");

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

  return playerNode;
}

function createReportedCricketPlayerCard(documentRef, index, options = {}) {
  const playerNode = documentRef.createElement("div");
  playerNode.classList.add("ad-ext-player");

  const stackNode = documentRef.createElement("div");
  stackNode.classList.add("chakra-stack", "css-y3hfdd");

  const scoreNode = documentRef.createElement("p");
  scoreNode.classList.add("chakra-text", "ad-ext-player-score", "css-18w03sn");
  scoreNode.textContent = String(index * 10);
  if (options.wrapScore === true) {
    const scoreWrapper = documentRef.createElement("div");
    scoreWrapper.classList.add("ad-ext_winner-score-wrapper");
    scoreWrapper.appendChild(scoreNode);
    stackNode.appendChild(scoreWrapper);
  } else {
    stackNode.appendChild(scoreNode);
  }

  const rowNode = documentRef.createElement("div");
  rowNode.classList.add("chakra-stack", options.altWrapper === true ? "css-alt-row" : "css-37hv00");

  const marksNode = documentRef.createElement("div");
  marksNode.classList.add(options.altWrapper === true ? "css-mark-bucket" : "css-1k3nd6z");
  const marksBadge = documentRef.createElement("span");
  marksBadge.classList.add("css-3fr5p8");
  const marksText = documentRef.createElement("p");
  marksText.classList.add("chakra-text", "css-1hcjh09");
  marksText.textContent = String(index);
  marksBadge.appendChild(marksText);
  marksNode.appendChild(marksBadge);

  const identityOuter = documentRef.createElement("div");
  identityOuter.classList.add(options.altWrapper === true ? "css-identity-shell" : "css-4rrvd0");
  const identityShell = documentRef.createElement("span");
  identityShell.classList.add(options.altWrapper === true ? "css-drift-shell" : "css-z1uxps");

  const avatarWrap = documentRef.createElement("div");
  avatarWrap.classList.add("chakra-stack", "css-1psdi5l");
  const avatarNode = documentRef.createElement("span");
  avatarNode.classList.add("chakra-avatar");
  const avatarImage = documentRef.createElement("img");
  avatarImage.setAttribute("alt", options.avatarAlt || `player-${index + 1}`);
  avatarNode.appendChild(avatarImage);
  avatarWrap.appendChild(avatarNode);

  const metaWrap = documentRef.createElement("div");
  metaWrap.classList.add("chakra-stack", options.altWrapper === true ? "css-meta-drift" : "css-1igwmid");
  const nameNode = documentRef.createElement("span");
  nameNode.classList.add("ad-ext-player-name", "css-g0ywsj");
  const nameText = documentRef.createElement("p");
  nameText.classList.add("chakra-text", "css-11cuipc");
  nameText.textContent = options.visibleName || options.longName || `TORNADO PLAYER ${index + 1}`;
  nameNode.appendChild(nameText);

  const winsNode = documentRef.createElement("span");
  winsNode.classList.add("chakra-badge", "css-n2903v");
  winsNode.textContent = `${35 + index}+`;

  metaWrap.appendChild(nameNode);
  metaWrap.appendChild(winsNode);
  identityShell.appendChild(avatarWrap);
  identityShell.appendChild(metaWrap);
  identityOuter.appendChild(identityShell);

  if (options.swapRowOrder === true) {
    rowNode.appendChild(identityOuter);
    rowNode.appendChild(marksNode);
  } else {
    rowNode.appendChild(marksNode);
    rowNode.appendChild(identityOuter);
  }
  stackNode.appendChild(rowNode);

  const statsNode = documentRef.createElement("div");
  statsNode.classList.add("chakra-stack", "css-1igwmid");
  const mprNode = documentRef.createElement("p");
  mprNode.classList.add("chakra-text", "css-1j0bqop");
  mprNode.textContent = `MPR: ${index.toFixed(1)}`;
  statsNode.appendChild(mprNode);
  statsNode.appendChild(documentRef.createElement("div"));
  statsNode.appendChild(documentRef.createElement("div"));
  stackNode.appendChild(statsNode);

  const decorativeNode = documentRef.createElement("div");
  decorativeNode.classList.add("css-17xejub");
  stackNode.appendChild(decorativeNode);

  playerNode.appendChild(stackNode);
  return playerNode;
}

function createCricketPlayerCard(documentRef, index, options = {}) {
  const variant = String(options.variant || "simple").trim().toLowerCase();
  if (variant === "reported") {
    return createReportedCricketPlayerCard(documentRef, index, {
      wrapScore: options.wrapScore,
      longName: options.longName,
      visibleName: options.visibleName,
      avatarAlt: options.avatarAlt,
    });
  }
  if (variant === "drifted") {
    return createReportedCricketPlayerCard(documentRef, index, {
      altWrapper: true,
      swapRowOrder: true,
      wrapScore: options.wrapScore,
      longName: options.longName,
      visibleName: options.visibleName,
      avatarAlt: options.avatarAlt,
    });
  }
  return createSimpleCricketPlayerCard(documentRef, index);
}

function addPlayerCards(documentRef, playerDisplayNode, count, options = {}) {
  if (!playerDisplayNode || !Number.isFinite(count) || count <= 0) {
    return;
  }

  for (let index = 0; index < count; index += 1) {
    const playerNode = createCricketPlayerCard(documentRef, index, options);
    if (index === 0) {
      playerNode.classList.add("ad-ext-player-active");
    }
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

function createCricketThemeGameState(initialActivePlayerIndex = 0) {
  let activePlayerIndex = Number(initialActivePlayerIndex) || 0;
  const listeners = new Set();

  return {
    getActivePlayerIndex() {
      return activePlayerIndex;
    },
    setActivePlayerIndex(nextIndex) {
      activePlayerIndex = Number(nextIndex) || 0;
      listeners.forEach((listener) => listener());
    },
    isCricketVariant() {
      return true;
    },
    subscribe(listener) {
      if (typeof listener === "function") {
        listeners.add(listener);
      }
      return () => listeners.delete(listener);
    },
  };
}

function createCricketSurfaceGameState(initialActivePlayerIndex = 0) {
  let activePlayerIndex = Number(initialActivePlayerIndex) || 0;
  const listeners = new Set();

  return {
    getCricketGameModeNormalized() {
      return "cricket";
    },
    getCricketGameMode() {
      return "Cricket";
    },
    getCricketScoringModeNormalized() {
      return "standard";
    },
    getCricketScoringMode() {
      return "standard";
    },
    getActivePlayerIndex() {
      return activePlayerIndex;
    },
    setActivePlayerIndex(nextIndex) {
      activePlayerIndex = Number(nextIndex) || 0;
      listeners.forEach((listener) => listener());
    },
    getActiveThrows() {
      return [];
    },
    getActiveTurn() {
      return null;
    },
    getSnapshot() {
      return {
        match: {
          players: [{ id: "player-a" }, { id: "player-b" }],
        },
      };
    },
    isCricketVariant() {
      return true;
    },
    subscribe(listener) {
      if (typeof listener === "function") {
        listeners.add(listener);
      }
      return () => listeners.delete(listener);
    },
  };
}

function createNumericCricketGrid(documentRef, marksByLabel = {}) {
  const table = documentRef.createElement("table");
  table.id = "grid";
  const targetOrder = cricketRules.getTargetOrderByGameMode("cricket");

  targetOrder.forEach((label) => {
    const row = documentRef.createElement("tr");
    const labelCell = documentRef.createElement("td");
    labelCell.classList.add("label-cell");
    labelCell.textContent = label === "BULL" ? "Bull" : label;
    row.appendChild(labelCell);

    const marks = Array.isArray(marksByLabel?.[label]) ? marksByLabel[label] : [0, 0];
    marks.forEach((value, index) => {
      const playerCell = documentRef.createElement("td");
      playerCell.classList.add("player-cell");
      playerCell.setAttribute("data-player-index", String(index));
      playerCell.setAttribute("data-marks", String(value));
      row.appendChild(playerCell);
    });

    table.appendChild(row);
  });

  documentRef.main.appendChild(table);
  return table;
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

test("theme board canvas resolver prefers the outer canvas wrapper for image-backed live boards", () => {
  const documentRef = new FakeDocument();
  const boardCanvas = documentRef.createElement("div");
  const boardMediaRoot = documentRef.createElement("div");
  const boardImage = documentRef.createElement("img");
  const boardSvg = createSparseImageBackedBoardSvg(documentRef);
  const showAnimations = documentRef.createElement("div");

  boardCanvas.classList.add("css-1nz0cmz");
  boardMediaRoot.classList.add("css-79elbk");
  showAnimations.classList.add("showAnimations");

  boardMediaRoot.appendChild(boardImage);
  boardMediaRoot.appendChild(boardSvg);
  boardCanvas.appendChild(boardMediaRoot);
  showAnimations.appendChild(boardCanvas);
  documentRef.main.appendChild(showAnimations);

  assert.equal(resolveThemeBoardCanvasTarget(boardSvg), boardCanvas);

  boardCanvas.classList.add(THEME_LAYOUT_HOOK_CLASSES.boardCanvas);
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

  boardNodes.contentSlot.remove();
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

test("theme-gotcha mounts on Gotcha matches and cleans up its style", async () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "Gotcha";
  const playerDisplayNode = documentRef.createElement("div");
  playerDisplayNode.id = "ad-ext-player-display";
  const playerNode = documentRef.createElement("div");
  playerNode.classList.add("ad-ext-player", "ad-ext-player-active");
  const gotchaHost = documentRef.createElement("autodarts-tools-gotcha");
  const shadowRoot = documentRef.createElement("div");
  const gotchaValueNode = documentRef.createElement("span");
  gotchaValueNode.classList.add("gotcha");
  gotchaValueNode.textContent = "D20";
  shadowRoot.appendChild(gotchaValueNode);
  gotchaHost.shadowRoot = shadowRoot;
  playerNode.appendChild(gotchaHost);
  playerDisplayNode.appendChild(playerNode);
  documentRef.main.appendChild(playerDisplayNode);
  const windowRef = createMatchWindow(documentRef, "theme-gotcha-idempotent");
  const runtime = createBootstrap({
    windowRef,
    documentRef,
    config: createThemeConfig("gotcha"),
    definitions: [
      {
        featureKey: "theme-gotcha",
        configKey: "themes.gotcha",
        title: "Theme Gotcha",
        initialize: mountThemeGotcha,
      },
    ],
  });

  runtime.start();
  runtime.start();
  await wait(5);

  assert.equal(Boolean(documentRef.getElementById("ad-ext-theme-gotcha-style")), true);
  assert.equal(gotchaValueNode.textContent, "+40");
  assert.equal(gotchaValueNode.style.getPropertyValue("font-style"), "italic");

  gotchaValueNode.textContent = "T20";
  documentRef.flushMutations([{ target: shadowRoot, addedNodes: [], removedNodes: [] }]);
  await wait(5);

  assert.equal(gotchaValueNode.textContent, "+60");
  assert.equal(gotchaValueNode.style.getPropertyValue("font-style"), "italic");

  runtime.stop();
  assert.equal(Boolean(documentRef.getElementById("ad-ext-theme-gotcha-style")), false);
  assert.equal(gotchaValueNode.textContent, "T20");
  assert.equal(gotchaValueNode.style.getPropertyValue("font-style"), "");
});

test("theme-gotcha can disable italic directly on the helper value node", async () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "Gotcha";
  const playerDisplayNode = documentRef.createElement("div");
  playerDisplayNode.id = "ad-ext-player-display";
  const playerNode = documentRef.createElement("div");
  playerNode.classList.add("ad-ext-player", "ad-ext-player-active");
  const gotchaHost = documentRef.createElement("autodarts-tools-gotcha");
  const shadowRoot = documentRef.createElement("div");
  const gotchaValueNode = documentRef.createElement("span");
  gotchaValueNode.classList.add("gotcha");
  gotchaValueNode.textContent = "+31";
  shadowRoot.appendChild(gotchaValueNode);
  gotchaHost.shadowRoot = shadowRoot;
  playerNode.appendChild(gotchaHost);
  playerDisplayNode.appendChild(playerNode);
  documentRef.main.appendChild(playerDisplayNode);
  const windowRef = createMatchWindow(documentRef, "theme-gotcha-font-style");
  const runtime = createBootstrap({
    windowRef,
    documentRef,
    config: createThemeConfig("gotcha", {
      deltaItalic: false,
    }),
    definitions: [
      {
        featureKey: "theme-gotcha",
        configKey: "themes.gotcha",
        title: "Theme Gotcha",
        initialize: mountThemeGotcha,
      },
    ],
  });

  runtime.start();
  await wait(5);

  assert.equal(gotchaValueNode.style.getPropertyValue("font-style"), "normal");

  runtime.stop();
  assert.equal(gotchaValueNode.style.getPropertyValue("font-style"), "");
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

test("theme-cricket canonicalizes the active player card when stale active classes remain on other players", () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "Cricket";
  createBoardFixture(documentRef, { withContentSlot: true });
  addPlayerCards(documentRef, documentRef.getElementById("ad-ext-player-display"), 4);
  const playerNodes = Array.from(documentRef.getElementById("ad-ext-player-display").children);
  playerNodes[2].classList.add("ad-ext-player-active");

  const windowRef = createMatchWindow(documentRef, "theme-cricket-active-card-sync");
  const gameState = createCricketThemeGameState(2);
  const cleanup = mountThemeCricket({
    windowRef,
    documentRef,
    domGuards: createDomGuards({ documentRef }),
    registries: {
      observers: createObserverRegistry(),
      listeners: createListenerRegistry(),
    },
    gameState,
    config: {
      getFeatureConfig() {
        return {
          showAvg: true,
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

  assert.equal(playerNodes[0].getAttribute(CRICKET_ACTIVE_PLAYER_ATTRIBUTE), "false");
  assert.equal(playerNodes[1].getAttribute(CRICKET_ACTIVE_PLAYER_ATTRIBUTE), "false");
  assert.equal(playerNodes[2].getAttribute(CRICKET_ACTIVE_PLAYER_ATTRIBUTE), "true");
  assert.equal(playerNodes[3].getAttribute(CRICKET_ACTIVE_PLAYER_ATTRIBUTE), "false");

  playerNodes.forEach((node) => node.classList.remove("ad-ext-player-active"));
  playerNodes[0].classList.add("ad-ext-player-active");
  playerNodes[1].classList.add("ad-ext-player-active");
  gameState.setActivePlayerIndex(1);
  documentRef.flushMutations([
    {
      type: "attributes",
      target: playerNodes[1],
      attributeName: "class",
      addedNodes: [],
      removedNodes: [],
    },
  ]);

  assert.equal(playerNodes[0].getAttribute(CRICKET_ACTIVE_PLAYER_ATTRIBUTE), "false");
  assert.equal(playerNodes[1].getAttribute(CRICKET_ACTIVE_PLAYER_ATTRIBUTE), "true");
  assert.equal(playerNodes[2].getAttribute(CRICKET_ACTIVE_PLAYER_ATTRIBUTE), "false");
  assert.equal(playerNodes[3].getAttribute(CRICKET_ACTIVE_PLAYER_ATTRIBUTE), "false");

  cleanup();

  playerNodes.forEach((node) => {
    assert.equal(node.getAttribute(CRICKET_ACTIVE_PLAYER_ATTRIBUTE), null);
  });
});

test("theme-cricket player marker sync is idempotent for unchanged render state", () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "Tactics";
  createBoardFixture(documentRef, { withContentSlot: true });
  addPlayerCards(documentRef, documentRef.getElementById("ad-ext-player-display"), 3, {
    variant: "reported",
  });

  const playerDisplayNode = documentRef.getElementById("ad-ext-player-display");
  const trackedAttributes = new Set([
    CRICKET_ACTIVE_PLAYER_ATTRIBUTE,
    CRICKET_STACK_ATTRIBUTE,
    CRICKET_ROW_ATTRIBUTE,
    CRICKET_SLOT_ATTRIBUTE,
    CRICKET_META_ATTRIBUTE,
    CRICKET_IDENTITY_SHELL_ATTRIBUTE,
    CRICKET_META_SHELL_ATTRIBUTE,
  ]);
  const originalSetAttributeByNode = new Map();
  const setAttributeCalls = [];

  const collectNodes = (node, nodes = []) => {
    if (!node) {
      return nodes;
    }
    nodes.push(node);
    Array.from(node.children || []).forEach((child) => collectNodes(child, nodes));
    return nodes;
  };

  collectNodes(playerDisplayNode).forEach((node) => {
    if (!node || typeof node.setAttribute !== "function") {
      return;
    }
    originalSetAttributeByNode.set(node, node.setAttribute);
    node.setAttribute = function setAttributeWithCount(name, value) {
      if (trackedAttributes.has(String(name))) {
        setAttributeCalls.push({ node, name: String(name), value: String(value) });
      }
      return originalSetAttributeByNode.get(node).call(this, name, value);
    };
  });

  try {
    syncCricketActivePlayerStateFromRenderState(
      documentRef,
      { activePlayerIndex: 1 },
      createCricketThemeGameState(1)
    );
    assert.equal(setAttributeCalls.length > 0, true);
    setAttributeCalls.length = 0;

    syncCricketActivePlayerStateFromRenderState(
      documentRef,
      { activePlayerIndex: 1 },
      createCricketThemeGameState(1)
    );
    assert.deepEqual(setAttributeCalls, []);
  } finally {
    originalSetAttributeByNode.forEach((setAttribute, node) => {
      node.setAttribute = setAttribute;
    });
  }
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
    "1600px"
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
    true
  );
  assert.equal(
    boardNodes.contentSlot.classList.contains(THEME_CRICKET_READABILITY.boardHiddenClass),
    false
  );
  assert.equal(
    boardNodes.contentSlot.style.getPropertyValue("--ad-ext-theme-cricket-board-width"),
    "332px"
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
    boardNodes.boardPanel.classList.contains(THEME_LAYOUT_HOOK_CLASSES.boardImageBackedMode),
    true
  );
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
  assert.equal(
    boardNodes.boardPanel.classList.contains(THEME_LAYOUT_HOOK_CLASSES.boardImageBackedMode),
    true
  );
  assert.equal(boardNodes.boardCanvas.classList.contains(THEME_LAYOUT_HOOK_CLASSES.boardCanvas), true);

  boardNodes.boardSvg.remove();
  documentRef.flushMutations();
  await wait(5);

  assert.equal(boardNodes.contentBoard.classList.contains(THEME_LAYOUT_HOOK_CLASSES.contentBoard), true);
  assert.equal(boardNodes.boardPanel.classList.contains(THEME_LAYOUT_HOOK_CLASSES.boardPanel), true);
  assert.equal(
    boardNodes.boardPanel.classList.contains(THEME_LAYOUT_HOOK_CLASSES.boardImageBackedMode),
    true
  );
  assert.equal(boardNodes.boardCanvas.classList.contains(THEME_LAYOUT_HOOK_CLASSES.boardCanvas), true);

  const replacementBoardSvg = createSparseImageBackedBoardSvg(documentRef);
  boardNodes.boardMediaRoot.appendChild(replacementBoardSvg);
  documentRef.flushMutations();
  await wait(40);

  assert.equal(
    replacementBoardSvg.classList.contains(THEME_LAYOUT_HOOK_CLASSES.boardSvg),
    true
  );
  assert.equal(boardNodes.contentBoard.classList.contains(THEME_LAYOUT_HOOK_CLASSES.contentBoard), true);
  assert.equal(boardNodes.boardPanel.classList.contains(THEME_LAYOUT_HOOK_CLASSES.boardPanel), true);
  assert.equal(
    boardNodes.boardPanel.classList.contains(THEME_LAYOUT_HOOK_CLASSES.boardImageBackedMode),
    true
  );

  runtime.stop();
});

test("theme-x01-2player mounts only for exact 2-player x01 matches and cleans up normally", async () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "501";
  const boardNodes = createBoardFixture(documentRef, { withContentSlot: true });
  addPlayerCards(documentRef, documentRef.getElementById("ad-ext-player-display"), 2);
  const windowRef = createMatchWindow(documentRef, "theme-x01-2player-two-players");
  const runtime = createBootstrap({
    windowRef,
    documentRef,
    config: createThemeConfig("x01TwoPlayer", {
      showAvg: true,
    }),
  });

  runtime.start();
  runtime.context.gameState.applyMatch({
    variant: "501",
    players: [{ name: "A" }, { name: "B" }],
    turns: [],
  });
  await wait(5);

  assert.equal(Boolean(documentRef.getElementById("ad-ext-theme-x01-2player-style")), true);
  assert.equal(documentRef.turnContainer.classList.contains("ad-ext-turn-preview-space"), false);
  assertThemeHookState(boardNodes, true);

  runtime.stop();
  assert.equal(Boolean(documentRef.getElementById("ad-ext-theme-x01-2player-style")), false);
  assertThemeHookState(boardNodes, false);
});

function createX01TwoPlayerTestCard(documentRef, score, name, options = {}) {
  const {
    stackClassNames = [],
    scoreClassNames = [],
    progressClassNames = [],
    identityClassNames = [],
    headerMetaClassNames = [],
    stackChildOrder = ["identity", "score", "progress"],
  } = options;
  const playerWrapperNode = documentRef.createElement("div");
  const playerNode = documentRef.createElement("div");
  playerNode.classList.add("ad-ext-player");

  const stackNode = documentRef.createElement("div");
  stackNode.classList.add("chakra-stack");
  stackClassNames.forEach((className) => stackNode.classList.add(className));

  const identityNode = documentRef.createElement("div");
  identityNode.classList.add("chakra-stack");
  identityClassNames.forEach((className) => identityNode.classList.add(className));
  identityNode.appendChild(documentRef.createElement("div"));

  const identityMetaNode = documentRef.createElement("div");
  const identityMetaSpan = documentRef.createElement("span");
  const nameNode = documentRef.createElement("p");
  nameNode.classList.add("ad-ext-player-name");
  nameNode.textContent = name;
  const statsNode = documentRef.createElement("div");
  const statsTextNode = documentRef.createElement("p");
  statsTextNode.classList.add("css-1j0bqop");
  statsTextNode.textContent = "AVG 50";
  statsNode.appendChild(statsTextNode);
  identityMetaSpan.appendChild(nameNode);
  identityMetaSpan.appendChild(statsNode);
  identityMetaNode.appendChild(identityMetaSpan);
  identityNode.appendChild(identityMetaNode);

  const scoreNode = documentRef.createElement("p");
  scoreNode.classList.add("ad-ext-player-score");
  scoreClassNames.forEach((className) => scoreNode.classList.add(className));
  scoreNode.textContent = String(score);

  const progressNode = documentRef.createElement("div");
  progressClassNames.forEach((className) => progressNode.classList.add(className));
  progressNode.setAttribute("data-ad-ext-x01-score-progress", "true");

  const headerMetaNode = documentRef.createElement("div");
  headerMetaNode.classList.add("chakra-stack");
  headerMetaClassNames.forEach((className) => headerMetaNode.classList.add(className));
  const headerMetaTextNode = documentRef.createElement("p");
  headerMetaTextNode.classList.add("chakra-text", "css-1j0bqop");
  headerMetaTextNode.textContent = "#1 | AVG 50";
  headerMetaNode.appendChild(headerMetaTextNode);

  const tableSlotNode = documentRef.createElement("div");
  const tableInnerNode = documentRef.createElement("div");
  const tableNode = documentRef.createElement("table");
  const tableRowNode = documentRef.createElement("tr");
  const tableCellNode = documentRef.createElement("td");
  tableCellNode.textContent = "140";
  tableRowNode.appendChild(tableCellNode);
  tableNode.appendChild(tableRowNode);
  tableInnerNode.appendChild(tableNode);
  tableSlotNode.appendChild(tableInnerNode);

  const stackChildren = {
    meta: headerMetaNode,
    identity: identityNode,
    score: scoreNode,
    progress: progressNode,
  };
  stackChildOrder.forEach((slotKey) => {
    const childNode = stackChildren[slotKey];
    if (childNode) {
      stackNode.appendChild(childNode);
    }
  });
  playerNode.appendChild(stackNode);
  playerNode.appendChild(tableSlotNode);
  playerWrapperNode.appendChild(playerNode);

  return {
    playerWrapperNode,
    playerNode,
    stackNode,
    identityNode,
    headerMetaNode,
    scoreNode,
    progressNode,
    tableSlotNode,
  };
}

function createX01TwoPlayerLifecycleGameState(initialActivePlayerIndex = 0) {
  let activePlayerIndex = Number(initialActivePlayerIndex) || 0;
  const listeners = new Set();

  return {
    getActivePlayerIndex() {
      return activePlayerIndex;
    },
    setActivePlayerIndex(nextIndex) {
      activePlayerIndex = Number(nextIndex) || 0;
      listeners.forEach((listener) => listener());
    },
    isX01Variant() {
      return true;
    },
    getSnapshot() {
      return {
        match: {
          players: [{ name: "A" }, { name: "B" }],
        },
      };
    },
    subscribe(listener) {
      if (typeof listener === "function") {
        listeners.add(listener);
      }
      return () => listeners.delete(listener);
    },
  };
}

function createFakeResizeObserverController() {
  const instances = [];

  class FakeResizeObserver {
    constructor(callback) {
      this.callback = callback;
      this.targets = new Set();
      instances.push(this);
    }

    observe(target) {
      if (target) {
        this.targets.add(target);
      }
    }

    unobserve(target) {
      this.targets.delete(target);
    }

    disconnect() {
      this.targets.clear();
    }
  }

  return {
    ResizeObserver: FakeResizeObserver,
    trigger(target) {
      instances.forEach((instance) => {
        if (!target || instance.targets.has(target)) {
          instance.callback([{ target }], instance);
        }
      });
    },
  };
}

test("theme-x01-2player syncs semantic slot markers and active attributes from game state", async () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "501";
  createBoardFixture(documentRef, { withContentSlot: true });
  const playerDisplayNode = documentRef.getElementById("ad-ext-player-display");
  playerDisplayNode.replaceChildren();

  const firstPlayer = createX01TwoPlayerTestCard(documentRef, 301, "A");
  const secondPlayer = createX01TwoPlayerTestCard(documentRef, 170, "B");
  firstPlayer.playerNode.classList.add("ad-ext-player-active");
  playerDisplayNode.appendChild(firstPlayer.playerWrapperNode);
  playerDisplayNode.appendChild(secondPlayer.playerWrapperNode);

  const gameState = createX01TwoPlayerLifecycleGameState(1);
  const cleanup = mountThemeX01TwoPlayer({
    windowRef: createMatchWindow(documentRef, "theme-x01-2player-semantic-markers"),
    documentRef,
    domGuards: createDomGuards({ documentRef }),
    registries: {
      observers: createObserverRegistry(),
      listeners: createListenerRegistry(),
    },
    gameState,
    config: {
      getFeatureConfig() {
        return { showAvg: true };
      },
    },
    helpers: {
      createRafScheduler(callback) {
        return {
          schedule() {
            callback();
          },
          cancel() {},
        };
      },
    },
  });

  await wait(5);

  assert.equal(firstPlayer.playerNode.getAttribute(X01_TWO_PLAYER_ACTIVE_ATTRIBUTE), "false");
  assert.equal(secondPlayer.playerNode.getAttribute(X01_TWO_PLAYER_ACTIVE_ATTRIBUTE), "true");
  assert.equal(firstPlayer.stackNode.getAttribute(X01_TWO_PLAYER_STACK_ATTRIBUTE), "true");
  assert.equal(firstPlayer.identityNode.getAttribute(X01_TWO_PLAYER_SLOT_ATTRIBUTE), X01_TWO_PLAYER_SLOTS.identity);
  assert.equal(firstPlayer.scoreNode.getAttribute(X01_TWO_PLAYER_SLOT_ATTRIBUTE), X01_TWO_PLAYER_SLOTS.score);
  assert.equal(firstPlayer.progressNode.getAttribute(X01_TWO_PLAYER_SLOT_ATTRIBUTE), X01_TWO_PLAYER_SLOTS.progress);
  assert.equal(firstPlayer.tableSlotNode.getAttribute(X01_TWO_PLAYER_SLOT_ATTRIBUTE), X01_TWO_PLAYER_SLOTS.table);

  gameState.setActivePlayerIndex(0);
  await wait(5);

  assert.equal(firstPlayer.playerNode.getAttribute(X01_TWO_PLAYER_ACTIVE_ATTRIBUTE), "true");
  assert.equal(secondPlayer.playerNode.getAttribute(X01_TWO_PLAYER_ACTIVE_ATTRIBUTE), "false");

  cleanup();

  assert.equal(firstPlayer.playerNode.getAttribute(X01_TWO_PLAYER_ACTIVE_ATTRIBUTE), null);
  assert.equal(firstPlayer.stackNode.getAttribute(X01_TWO_PLAYER_STACK_ATTRIBUTE), null);
  assert.equal(firstPlayer.identityNode.getAttribute(X01_TWO_PLAYER_SLOT_ATTRIBUTE), null);
  assert.equal(firstPlayer.scoreNode.getAttribute(X01_TWO_PLAYER_SLOT_ATTRIBUTE), null);
  assert.equal(firstPlayer.progressNode.getAttribute(X01_TWO_PLAYER_SLOT_ATTRIBUTE), null);
  assert.equal(firstPlayer.tableSlotNode.getAttribute(X01_TWO_PLAYER_SLOT_ATTRIBUTE), null);
});

test("theme-x01-2player keeps marker slots stable against shared score-progress chakra classes", async () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "501";
  createBoardFixture(documentRef, { withContentSlot: true });
  const playerDisplayNode = documentRef.getElementById("ad-ext-player-display");
  playerDisplayNode.replaceChildren();

  const firstPlayer = createX01TwoPlayerTestCard(documentRef, 501, "TEST1", {
    stackClassNames: ["css-y3hfdd"],
    scoreClassNames: ["chakra-text", "css-1r7jzhg"],
    identityClassNames: ["css-37hv00"],
    stackChildOrder: ["score", "progress", "identity"],
  });
  playerDisplayNode.appendChild(firstPlayer.playerWrapperNode);
  playerDisplayNode.appendChild(createX01TwoPlayerTestCard(documentRef, 301, "TEST2").playerWrapperNode);

  const cleanup = mountThemeX01TwoPlayer({
    windowRef: createMatchWindow(documentRef, "theme-x01-2player-legacy-stack-fence"),
    documentRef,
    domGuards: createDomGuards({ documentRef }),
    registries: {
      observers: createObserverRegistry(),
      listeners: createListenerRegistry(),
    },
    gameState: createX01TwoPlayerLifecycleGameState(0),
    config: {
      getFeatureConfig() {
        return { showAvg: true };
      },
    },
    helpers: {
      createRafScheduler(callback) {
        return {
          schedule() {
            callback();
          },
          cancel() {},
        };
      },
    },
  });

  await wait(5);

  assert.equal(firstPlayer.stackNode.getAttribute(X01_TWO_PLAYER_STACK_ATTRIBUTE), "true");
  assert.equal(firstPlayer.scoreNode.getAttribute(X01_TWO_PLAYER_SLOT_ATTRIBUTE), X01_TWO_PLAYER_SLOTS.score);
  assert.equal(firstPlayer.progressNode.getAttribute(X01_TWO_PLAYER_SLOT_ATTRIBUTE), X01_TWO_PLAYER_SLOTS.progress);
  assert.equal(firstPlayer.identityNode.getAttribute(X01_TWO_PLAYER_SLOT_ATTRIBUTE), X01_TWO_PLAYER_SLOTS.identity);
  assert.equal(firstPlayer.stackNode.children[0], firstPlayer.scoreNode);
  assert.equal(firstPlayer.stackNode.children[1], firstPlayer.progressNode);
  assert.equal(firstPlayer.stackNode.children[2], firstPlayer.identityNode);

  cleanup();
});

test("theme-x01-2player leaves header meta unmarked while separating it from the identity slot", async () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "501";
  createBoardFixture(documentRef, { withContentSlot: true });
  const playerDisplayNode = documentRef.getElementById("ad-ext-player-display");
  playerDisplayNode.replaceChildren();

  const firstPlayer = createX01TwoPlayerTestCard(documentRef, 481, "TORNADO T", {
    stackClassNames: ["css-y3hfdd"],
    scoreClassNames: ["chakra-text", "css-1r7jzhg"],
    identityClassNames: ["css-37hv00"],
    headerMetaClassNames: ["css-1igwmid"],
    stackChildOrder: ["score", "meta", "progress", "identity"],
  });
  playerDisplayNode.appendChild(firstPlayer.playerWrapperNode);
  playerDisplayNode.appendChild(createX01TwoPlayerTestCard(documentRef, 501, "TEST1").playerWrapperNode);

  const cleanup = mountThemeX01TwoPlayer({
    windowRef: createMatchWindow(documentRef, "theme-x01-2player-header-meta-row"),
    documentRef,
    domGuards: createDomGuards({ documentRef }),
    registries: {
      observers: createObserverRegistry(),
      listeners: createListenerRegistry(),
    },
    gameState: createX01TwoPlayerLifecycleGameState(0),
    config: {
      getFeatureConfig() {
        return { showAvg: true };
      },
    },
    helpers: {
      createRafScheduler(callback) {
        return {
          schedule() {
            callback();
          },
          cancel() {},
        };
      },
    },
  });

  await wait(5);

  assert.equal(firstPlayer.stackNode.getAttribute(X01_TWO_PLAYER_STACK_ATTRIBUTE), "true");
  assert.equal(firstPlayer.identityNode.getAttribute(X01_TWO_PLAYER_SLOT_ATTRIBUTE), X01_TWO_PLAYER_SLOTS.identity);
  assert.equal(firstPlayer.scoreNode.getAttribute(X01_TWO_PLAYER_SLOT_ATTRIBUTE), X01_TWO_PLAYER_SLOTS.score);
  assert.equal(firstPlayer.progressNode.getAttribute(X01_TWO_PLAYER_SLOT_ATTRIBUTE), X01_TWO_PLAYER_SLOTS.progress);
  assert.equal(firstPlayer.headerMetaNode.getAttribute(X01_TWO_PLAYER_SLOT_ATTRIBUTE), null);
  assert.equal(firstPlayer.stackNode.children[1], firstPlayer.headerMetaNode);
  assert.equal(firstPlayer.stackNode.children[3], firstPlayer.identityNode);

  cleanup();
});

test("theme-x01-2player shares responsive player name size from the tightest name fit", async () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "501";
  createBoardFixture(documentRef, { withContentSlot: true });
  const playerDisplayNode = documentRef.getElementById("ad-ext-player-display");
  playerDisplayNode.replaceChildren();

  const firstPlayer = createX01TwoPlayerTestCard(documentRef, 501, "TORNADO TOM", {
    stackClassNames: ["css-y3hfdd"],
    scoreClassNames: ["chakra-text", "css-1r7jzhg"],
    identityClassNames: ["css-37hv00"],
    headerMetaClassNames: ["css-1igwmid"],
    stackChildOrder: ["score", "meta", "identity"],
  });
  const secondPlayer = createX01TwoPlayerTestCard(documentRef, 501, "TEST", {
    stackClassNames: ["css-y3hfdd"],
    scoreClassNames: ["chakra-text", "css-1r7jzhg"],
    identityClassNames: ["css-37hv00"],
    headerMetaClassNames: ["css-1igwmid"],
    stackChildOrder: ["score", "meta", "identity"],
  });
  firstPlayer.stackNode.__rect = { width: 300, height: 220 };
  secondPlayer.stackNode.__rect = { width: 300, height: 220 };
  playerDisplayNode.appendChild(firstPlayer.playerWrapperNode);
  playerDisplayNode.appendChild(secondPlayer.playerWrapperNode);

  const cleanup = mountThemeX01TwoPlayer({
    windowRef: createMatchWindow(documentRef, "theme-x01-2player-shared-name-size"),
    documentRef,
    domGuards: createDomGuards({ documentRef }),
    registries: {
      observers: createObserverRegistry(),
      listeners: createListenerRegistry(),
    },
    gameState: createX01TwoPlayerLifecycleGameState(0),
    config: {
      getFeatureConfig() {
        return { showAvg: true };
      },
    },
    helpers: {
      createRafScheduler(callback) {
        return {
          schedule() {
            callback();
          },
          cancel() {},
        };
      },
    },
  });

  await wait(5);

  const sharedNameSize = playerDisplayNode.style.getPropertyValue(
    "--ad-ext-x01-2player-shared-name-size"
  );
  assert.match(sharedNameSize, /^\d+\.\d{2}px$/);
  assert.equal(Number.parseFloat(sharedNameSize) < 44, true);
  assert.equal(Number.parseFloat(sharedNameSize) > 43, true);

  cleanup();

  assert.equal(
    playerDisplayNode.style.getPropertyValue("--ad-ext-x01-2player-shared-name-size"),
    ""
  );
});

test("theme-x01-2player recomputes board layout after late turn-surface resizes", async () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "501";
  const boardNodes = createBoardFixture(documentRef, { withContentSlot: true });
  boardNodes.contentSlot.__rect = { width: 1440, height: 720 };
  boardNodes.contentBoard.__rect = { width: 760, height: 620 };
  boardNodes.boardViewport.__rect = { width: 620, height: 620 };
  boardNodes.boardCanvas.__rect = { width: 620, height: 620 };
  documentRef.turnContainer.__rect = { width: 920, height: 48 };
  const playerDisplayNode = documentRef.getElementById("ad-ext-player-display");
  playerDisplayNode.replaceChildren();

  const firstPlayer = createX01TwoPlayerTestCard(documentRef, 301, "A");
  const secondPlayer = createX01TwoPlayerTestCard(documentRef, 170, "B");
  playerDisplayNode.appendChild(firstPlayer.playerWrapperNode);
  playerDisplayNode.appendChild(secondPlayer.playerWrapperNode);

  const resizeController = createFakeResizeObserverController();
  const windowRef = createMatchWindow(documentRef, "theme-x01-2player-late-turn-resize");
  windowRef.ResizeObserver = resizeController.ResizeObserver;

  const cleanup = mountThemeX01TwoPlayer({
    windowRef,
    documentRef,
    domGuards: createDomGuards({ documentRef }),
    registries: {
      observers: createObserverRegistry(),
      listeners: createListenerRegistry(),
    },
    gameState: createX01TwoPlayerLifecycleGameState(0),
    config: {
      getFeatureConfig() {
        return { showAvg: true };
      },
    },
    helpers: {
      createRafScheduler(callback) {
        return {
          schedule() {
            callback();
          },
          cancel() {},
        };
      },
    },
  });

  await wait(5);

  assert.equal(
    documentRef.documentElement.style.getPropertyValue("--ad-ext-x01-2player-live-turn-height"),
    "48px"
  );
  assert.equal(
    documentRef.documentElement.style.getPropertyValue("--ad-ext-x01-2player-live-throw-points-size"),
    ""
  );
  assert.equal(
    boardNodes.boardCanvas.style.getPropertyValue("--ad-ext-theme-board-size"),
    "620px"
  );

  documentRef.turnContainer.__rect = { width: 920, height: 124 };
  boardNodes.contentBoard.__rect = { width: 760, height: 540 };
  boardNodes.boardViewport.__rect = { width: 540, height: 540 };
  boardNodes.boardCanvas.__rect = { width: 540, height: 540 };
  resizeController.trigger(documentRef.turnContainer);
  await wait(5);

  assert.equal(
    documentRef.documentElement.style.getPropertyValue("--ad-ext-x01-2player-live-turn-height"),
    "124px"
  );
  assert.equal(
    boardNodes.boardCanvas.style.getPropertyValue("--ad-ext-theme-board-size"),
    "540px"
  );

  cleanup();

  assert.equal(
    documentRef.documentElement.style.getPropertyValue("--ad-ext-x01-2player-live-turn-height"),
    ""
  );
  assert.equal(
    documentRef.documentElement.style.getPropertyValue("--ad-ext-x01-2player-live-throw-points-size"),
    ""
  );
});

test("theme-x01-2player mirrors late throw font-size changes onto the shared live size variable", async () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "501";
  createBoardFixture(documentRef, { withContentSlot: true });
  const playerDisplayNode = documentRef.getElementById("ad-ext-player-display");
  playerDisplayNode.replaceChildren();

  const firstPlayer = createX01TwoPlayerTestCard(documentRef, 301, "A");
  const secondPlayer = createX01TwoPlayerTestCard(documentRef, 170, "B");
  playerDisplayNode.appendChild(firstPlayer.playerWrapperNode);
  playerDisplayNode.appendChild(secondPlayer.playerWrapperNode);

  const resizeController = createFakeResizeObserverController();
  const windowRef = createMatchWindow(documentRef, "theme-x01-2player-live-throw-size");
  let throwFontSize = "26px";
  let throwScoreFontSize = "26px";
  const throwScoreNode = documentRef.createElement("div");
  const throwSegmentNode = documentRef.createElement("div");
  const throwWrapperNode = documentRef.createElement("div");
  documentRef.throwTextElement.replaceChildren();
  throwScoreNode.textContent = "3";
  throwSegmentNode.textContent = "S3";
  throwWrapperNode.appendChild(throwScoreNode);
  throwWrapperNode.appendChild(throwSegmentNode);
  documentRef.throwTextElement.appendChild(throwWrapperNode);
  windowRef.ResizeObserver = resizeController.ResizeObserver;
  windowRef.getComputedStyle = (node) => ({
    display: "",
    visibility: "",
    opacity: "1",
    fontSize:
      node === throwScoreNode
        ? throwScoreFontSize
        : node === documentRef.throwTextElement || node === documentRef.throwRow
          ? throwFontSize
          : "",
  });

  const cleanup = mountThemeX01TwoPlayer({
    windowRef,
    documentRef,
    domGuards: createDomGuards({ documentRef }),
    registries: {
      observers: createObserverRegistry(),
      listeners: createListenerRegistry(),
    },
    gameState: createX01TwoPlayerLifecycleGameState(0),
    config: {
      getFeatureConfig() {
        return { showAvg: true };
      },
    },
    helpers: {
      createRafScheduler(callback) {
        return {
          schedule() {
            callback();
          },
          cancel() {},
        };
      },
    },
  });

  await wait(5);

  assert.equal(
    documentRef.documentElement.style.getPropertyValue("--ad-ext-x01-2player-live-throw-points-size"),
    "26px"
  );

  throwFontSize = "18px";
  throwScoreFontSize = "34px";
  resizeController.trigger(documentRef.turnContainer);
  await wait(5);

  assert.equal(
    documentRef.documentElement.style.getPropertyValue("--ad-ext-x01-2player-live-throw-points-size"),
    "34px"
  );

  cleanup();

  assert.equal(
    documentRef.documentElement.style.getPropertyValue("--ad-ext-x01-2player-live-throw-points-size"),
    ""
  );
});

test("theme-x01-2player does not mount for 1-player or 3-player x01 matches", async () => {
  for (const [matchId, playerCount] of [
    ["theme-x01-2player-one-player", 1],
    ["theme-x01-2player-three-players", 3],
  ]) {
    const documentRef = new FakeDocument();
    documentRef.variantElement.textContent = "501";
    createBoardFixture(documentRef, { withContentSlot: true });
    addPlayerCards(documentRef, documentRef.getElementById("ad-ext-player-display"), playerCount);
    const windowRef = createMatchWindow(documentRef, matchId);
    const runtime = createBootstrap({
      windowRef,
      documentRef,
      config: createThemeConfig("x01TwoPlayer", {
        showAvg: true,
      }),
    });

    runtime.start();
    runtime.context.gameState.applyMatch({
      variant: "501",
      players: Array.from({ length: playerCount }, (_, index) => ({ name: `P${index + 1}` })),
      turns: [],
    });
    await wait(5);

    assert.equal(Boolean(documentRef.getElementById("ad-ext-theme-x01-2player-style")), false);
    assert.equal(documentRef.turnContainer.classList.contains("ad-ext-turn-preview-space"), false);

    runtime.stop();
  }
});

test("theme-x01-2player falls back to the visible player-card DOM when the snapshot player count is unavailable", async () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "501";
  const boardNodes = createBoardFixture(documentRef, { withContentSlot: true });
  const playerDisplayNode = documentRef.getElementById("ad-ext-player-display");
  addPlayerCards(documentRef, playerDisplayNode, 2);
  const variantField = documentRef.createElement("div");
  variantField.textContent = "X01";
  playerDisplayNode.appendChild(variantField);
  const windowRef = createMatchWindow(documentRef, "theme-x01-2player-dom-fallback");
  const cleanup = mountThemeX01TwoPlayer({
    windowRef,
    documentRef,
    domGuards: createDomGuards({ documentRef }),
    registries: {
      observers: createObserverRegistry(),
      listeners: createListenerRegistry(),
    },
    gameState: {
      isX01Variant() {
        return true;
      },
      subscribe() {
        return () => {};
      },
      getSnapshot() {
        return null;
      },
    },
    config: {
      getFeatureConfig() {
        return { showAvg: true };
      },
    },
    helpers: {
      createRafScheduler(callback) {
        return {
          schedule() {
            callback();
          },
          cancel() {},
        };
      },
    },
  });

  await wait(5);

  assert.equal(Boolean(documentRef.getElementById("ad-ext-theme-x01-2player-style")), true);
  assertThemeHookState(boardNodes, true);
  assert.equal(
    playerDisplayNode.querySelectorAll(`[${X01_TWO_PLAYER_PLAYER_WRAPPER_ATTRIBUTE}="true"]`).length,
    2
  );
  assert.equal(
    variantField.getAttribute?.(X01_TWO_PLAYER_PLAYER_WRAPPER_ATTRIBUTE) || null,
    null
  );
  assert.equal(
    variantField.getAttribute?.(X01_TWO_PLAYER_PLAYER_INDEX_ATTRIBUTE) || null,
    null
  );

  cleanup();
  assert.equal(Boolean(documentRef.getElementById("ad-ext-theme-x01-2player-style")), false);
});

test("theme-cricket keeps layout hooks during a short missing-board gap", async () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "Cricket";
  const boardNodes = createBoardFixture(documentRef, { withContentSlot: true });
  boardNodes.contentSlot.__rect = { width: 1660, height: 680 };
  boardNodes.contentLeft.__rect = { width: 1032, height: 680 };
  boardNodes.contentBoard.__rect = { width: 620, height: 620 };
  boardNodes.boardViewport.__rect = { width: 620, height: 620 };
  boardNodes.boardCanvas.__rect = { width: 620, height: 620 };
  addPlayerCards(documentRef, documentRef.getElementById("ad-ext-player-display"), 4);

  const windowRef = createMatchWindow(documentRef, "theme-cricket-short-board-gap");
  const runtime = createBootstrap({
    windowRef,
    documentRef,
    config: createThemeConfig("cricket", {
      showAvg: true,
    }),
  });

  runtime.start();
  await wait(5);
  assertThemeHookState(boardNodes, true);
  assert.equal(
    boardNodes.boardCanvas.style.getPropertyValue("--ad-ext-theme-board-size"),
    "620px"
  );
  assert.equal(
    boardNodes.boardPanel.classList.contains(THEME_LAYOUT_RETENTION_CLASSES.boardGapHold),
    false
  );

  boardNodes.boardSvg.remove();
  documentRef.flushMutations([
    {
      type: "childList",
      target: boardNodes.boardCanvas,
      addedNodes: [],
      removedNodes: [boardNodes.boardSvg],
    },
  ]);
  await wait(80);

  assertThemeHookState(boardNodes, true);
  assert.equal(
    boardNodes.boardCanvas.style.getPropertyValue("--ad-ext-theme-board-size"),
    "620px"
  );
  assert.equal(
    boardNodes.boardPanel.classList.contains(THEME_LAYOUT_RETENTION_CLASSES.boardGapHold),
    true
  );

  runtime.stop();
});

test("theme-cricket refreshes retained layout hooks when the board returns within grace", async () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "Cricket";
  const boardNodes = createBoardFixture(documentRef, { withContentSlot: true });
  boardNodes.contentSlot.__rect = { width: 1660, height: 680 };
  boardNodes.contentLeft.__rect = { width: 1032, height: 680 };
  boardNodes.contentBoard.__rect = { width: 620, height: 620 };
  boardNodes.boardViewport.__rect = { width: 620, height: 620 };
  boardNodes.boardCanvas.__rect = { width: 620, height: 620 };
  addPlayerCards(documentRef, documentRef.getElementById("ad-ext-player-display"), 4);

  const windowRef = createMatchWindow(documentRef, "theme-cricket-board-gap-recovers");
  const runtime = createBootstrap({
    windowRef,
    documentRef,
    config: createThemeConfig("cricket", {
      showAvg: true,
    }),
  });

  runtime.start();
  await wait(5);
  assertThemeHookState(boardNodes, true);
  assert.equal(
    boardNodes.boardCanvas.style.getPropertyValue("--ad-ext-theme-board-size"),
    "620px"
  );
  assert.equal(
    boardNodes.boardPanel.classList.contains(THEME_LAYOUT_RETENTION_CLASSES.boardGapHold),
    false
  );

  boardNodes.boardSvg.remove();
  documentRef.flushMutations([
    {
      type: "childList",
      target: boardNodes.boardCanvas,
      addedNodes: [],
      removedNodes: [boardNodes.boardSvg],
    },
  ]);
  await wait(80);
  assertThemeHookState(boardNodes, true);
  assert.equal(
    boardNodes.boardPanel.classList.contains(THEME_LAYOUT_RETENTION_CLASSES.boardGapHold),
    true
  );

  boardNodes.boardCanvas.appendChild(boardNodes.boardSvg);
  documentRef.flushMutations([
    {
      type: "childList",
      target: boardNodes.boardCanvas,
      addedNodes: [boardNodes.boardSvg],
      removedNodes: [],
    },
  ]);
  await wait(160);

  assertThemeHookState(boardNodes, true);
  assert.equal(
    boardNodes.boardCanvas.style.getPropertyValue("--ad-ext-theme-board-size"),
    "620px"
  );
  assert.equal(
    boardNodes.boardPanel.classList.contains(THEME_LAYOUT_RETENTION_CLASSES.boardGapHold),
    false
  );

  runtime.stop();
});

test("theme-cricket clears retained layout hooks after grace when the board stays missing", async () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "Cricket";
  const boardNodes = createBoardFixture(documentRef, { withContentSlot: true });
  boardNodes.contentSlot.__rect = { width: 1660, height: 680 };
  boardNodes.contentLeft.__rect = { width: 1032, height: 680 };
  boardNodes.contentBoard.__rect = { width: 620, height: 620 };
  boardNodes.boardViewport.__rect = { width: 620, height: 620 };
  boardNodes.boardCanvas.__rect = { width: 620, height: 620 };
  addPlayerCards(documentRef, documentRef.getElementById("ad-ext-player-display"), 4);

  const windowRef = createMatchWindow(documentRef, "theme-cricket-board-gap-timeout");
  const runtime = createBootstrap({
    windowRef,
    documentRef,
    config: createThemeConfig("cricket", {
      showAvg: true,
    }),
  });

  runtime.start();
  await wait(5);
  assertThemeHookState(boardNodes, true);
  assert.equal(
    boardNodes.boardCanvas.style.getPropertyValue("--ad-ext-theme-board-size"),
    "620px"
  );
  assert.equal(
    boardNodes.boardPanel.classList.contains(THEME_LAYOUT_RETENTION_CLASSES.boardGapHold),
    false
  );

  boardNodes.boardSvg.remove();
  documentRef.flushMutations([
    {
      type: "childList",
      target: boardNodes.boardCanvas,
      addedNodes: [],
      removedNodes: [boardNodes.boardSvg],
    },
  ]);
  await wait(950);

  assertThemeHookState(boardNodes, false);
  assert.equal(
    boardNodes.boardCanvas.style.getPropertyValue("--ad-ext-theme-board-size"),
    ""
  );
  assert.equal(
    boardNodes.boardPanel.classList.contains(THEME_LAYOUT_RETENTION_CLASSES.boardGapHold),
    false
  );

  runtime.stop();
});

test("theme-cricket keeps layout hooks through transient invalid-context host rebuilds when the last healthy layout is still connected", async () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "Cricket";
  const boardNodes = createBoardFixture(documentRef, { withContentSlot: true });
  addPlayerCards(documentRef, documentRef.getElementById("ad-ext-player-display"), 4);

  const windowRef = createMatchWindow(documentRef, "theme-cricket-invalid-context-gap");
  const runtime = createBootstrap({
    windowRef,
    documentRef,
    config: createThemeConfig("cricket", {
      showAvg: true,
    }),
  });

  runtime.start();
  await wait(5);
  assertThemeHookState(boardNodes, true);

  const undoButton = boardNodes.boardControls.querySelector("button");
  undoButton.remove();
  documentRef.flushMutations([
    {
      type: "childList",
      target: boardNodes.boardControls,
      addedNodes: [],
      removedNodes: [undoButton],
    },
  ]);
  await wait(80);
  assertThemeHookState(boardNodes, true);

  boardNodes.boardControls.appendChild(undoButton);
  documentRef.flushMutations([
    {
      type: "childList",
      target: boardNodes.boardControls,
      addedNodes: [undoButton],
      removedNodes: [],
    },
  ]);
  await wait(80);

  assertThemeHookState(boardNodes, true);

  runtime.stop();
});

test("theme-cricket does not retain hidden stale board hooks when the previous layout vanishes from the visible match surface", async () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "Cricket";
  const boardNodes = createBoardFixture(documentRef, { withContentSlot: true });
  boardNodes.contentSlot.__rect = { width: 1660, height: 680 };
  boardNodes.contentLeft.__rect = { width: 1032, height: 680 };
  boardNodes.contentBoard.__rect = { width: 620, height: 620 };
  boardNodes.boardViewport.__rect = { width: 620, height: 620 };
  boardNodes.boardCanvas.__rect = { width: 620, height: 620 };
  addPlayerCards(documentRef, documentRef.getElementById("ad-ext-player-display"), 2);

  const windowRef = createMatchWindow(documentRef, "theme-cricket-hidden-stale-board");
  const runtime = createBootstrap({
    windowRef,
    documentRef,
    config: createThemeConfig("cricket", {
      showAvg: true,
    }),
  });

  runtime.start();
  await wait(5);
  assertThemeHookState(boardNodes, true);

  [
    boardNodes.contentSlot,
    boardNodes.contentLeft,
    boardNodes.contentBoard,
    boardNodes.boardPanel,
    boardNodes.boardViewport,
    boardNodes.boardCanvas,
  ].forEach((node) => {
    node.style.display = "none";
  });
  documentRef.flushMutations([
    { type: "attributes", target: boardNodes.contentSlot, attributeName: "style" },
    { type: "attributes", target: boardNodes.contentBoard, attributeName: "style" },
    { type: "attributes", target: boardNodes.boardPanel, attributeName: "style" },
    { type: "attributes", target: boardNodes.boardViewport, attributeName: "style" },
    { type: "attributes", target: boardNodes.boardCanvas, attributeName: "style" },
  ]);
  await wait(80);

  assertThemeHookState(boardNodes, false);
  assert.equal(
    boardNodes.boardPanel.classList.contains(THEME_LAYOUT_RETENTION_CLASSES.boardGapHold),
    false
  );

  runtime.stop();
});

test("theme-cricket keeps theme hooks and cricket surface overlays during a short board gap", async () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "Cricket";
  const boardNodes = createBoardFixture(documentRef, { withContentSlot: true });
  addPlayerCards(documentRef, documentRef.getElementById("ad-ext-player-display"), 2);
  createNumericCricketGrid(documentRef, {
    "20": [1, 0],
  });

  const windowRef = createMatchWindow(documentRef, "theme-cricket-surface-gap");
  const domGuards = createDomGuards({ documentRef });
  const observers = createObserverRegistry();
  const listeners = createListenerRegistry();
  const gameState = createCricketSurfaceGameState(0);
  const schedulerHelpers = {
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
  };
  const config = {
    getFeatureConfig(featureKey) {
      if (featureKey === "themes.cricket") {
        return { showAvg: true };
      }
      if (featureKey === "cricketHighlighter") {
        return {
          showOpenObjectives: false,
          showDeadObjectives: true,
          colorTheme: "standard",
          intensity: "normal",
        };
      }
      return {
        rowWave: true,
        badgeBeacon: true,
        markProgress: true,
        pressureEdge: true,
        scoringStripe: true,
        deadRowMuted: true,
        deltaChips: true,
        hitSpark: true,
        roundTransitionWipe: true,
        pressureOverlay: true,
        colorTheme: "standard",
        intensity: "normal",
      };
    },
  };

  const cleanupTheme = mountThemeCricket({
    windowRef,
    documentRef,
    domGuards,
    registries: { observers, listeners },
    gameState,
    config,
    helpers: schedulerHelpers,
  });
  const cleanupHighlighter = initializeCricketHighlighter({
    windowRef,
    documentRef,
    domGuards,
    registries: { observers, listeners },
    gameState,
    domain: { cricketRules, variantRules },
    config,
    helpers: schedulerHelpers,
    degradedHostGraceMs: 300,
  });
  const cleanupGridFx = initializeCricketGridFx({
    windowRef,
    documentRef,
    domGuards,
    registries: { observers, listeners },
    gameState,
    domain: { cricketRules, variantRules },
    config,
    helpers: schedulerHelpers,
    degradedHostGraceMs: 300,
  });

  try {
    assertThemeHookState(boardNodes, true);
    assert.equal(Boolean(documentRef.getElementById(CRICKET_OVERLAY_ID)), true);
    assert.equal(Boolean(documentRef.querySelector(`.${ROOT_CLASS}`)), true);

    boardNodes.boardSvg.remove();
    documentRef.flushMutations([
      {
        type: "childList",
        target: boardNodes.boardCanvas,
        addedNodes: [],
        removedNodes: [boardNodes.boardSvg],
      },
    ]);
    await wait(80);

    assertThemeHookState(boardNodes, true);
    assert.equal(Boolean(documentRef.querySelector(`.${ROOT_CLASS}`)), true);
    assert.equal(
      boardNodes.boardPanel.classList.contains(THEME_LAYOUT_RETENTION_CLASSES.boardGapHold),
      true
    );
  } finally {
    cleanupGridFx();
    cleanupHighlighter();
    cleanupTheme();
  }
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
    "1480px"
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
    "1600px"
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

  assert.equal(boardNodes.contentSlot.classList.contains(THEME_CRICKET_READABILITY.constrainedClass), true);
  assert.equal(boardNodes.contentSlot.classList.contains(THEME_CRICKET_READABILITY.boardHiddenClass), false);
  assert.equal(
    boardNodes.contentSlot.style.getPropertyValue("--ad-ext-theme-cricket-board-width"),
    "332px"
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

test("theme-cricket normalizes the reported player-card DOM and uses free width for 3-player readability", async () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "Cricket";
  const boardNodes = createBoardFixture(documentRef, { withContentSlot: true });
  boardNodes.contentSlot.__rect = { width: 1900, height: 680 };
  boardNodes.contentLeft.__rect = { width: 1272, height: 680 };
  boardNodes.contentBoard.__rect = { width: 620, height: 620 };
  boardNodes.boardViewport.__rect = { width: 620, height: 620 };
  boardNodes.boardCanvas.__rect = { width: 620, height: 620 };
  addPlayerCards(documentRef, documentRef.getElementById("ad-ext-player-display"), 3, {
    variant: "reported",
    longName: "TORNADO TOM LONGNAME",
  });

  const windowRef = createMatchWindow(documentRef, "theme-cricket-reported-dom");
  const runtime = createBootstrap({
    windowRef,
    documentRef,
    config: createThemeConfig("cricket", {
      showAvg: true,
    }),
  });

  runtime.start();
  await wait(5);

  const playerDisplayNode = documentRef.getElementById("ad-ext-player-display");
  const firstPlayerNode = playerDisplayNode.children[0];
  assert.equal(
    boardNodes.contentSlot.style.getPropertyValue("--ad-ext-theme-cricket-player-area-required-width"),
    "1272px"
  );
  assert.equal(
    boardNodes.contentSlot.style.getPropertyValue("--ad-ext-theme-cricket-player-column-width"),
    "424px"
  );
  assert.equal(
    boardNodes.contentSlot.classList.contains(THEME_CRICKET_READABILITY.boardHiddenClass),
    false
  );
  assert.equal(
    firstPlayerNode.querySelector(`[${CRICKET_STACK_ATTRIBUTE}="true"]`) !== null,
    true
  );
  assert.equal(
    firstPlayerNode.querySelector(`[${CRICKET_ROW_ATTRIBUTE}="true"]`) !== null,
    true
  );
  assert.equal(
    firstPlayerNode.querySelector(`[${CRICKET_SLOT_ATTRIBUTE}="marks"]`) !== null,
    true
  );
  assert.equal(
    firstPlayerNode.querySelector(`[${CRICKET_SLOT_ATTRIBUTE}="identity"]`) !== null,
    true
  );
  assert.equal(
    firstPlayerNode.querySelector(`[${CRICKET_SLOT_ATTRIBUTE}="stats"]`) !== null,
    true
  );
  assert.equal(
    firstPlayerNode.querySelector(`[${CRICKET_SLOT_ATTRIBUTE}="decorative"]`) !== null,
    true
  );
  assert.equal(
    firstPlayerNode.querySelector(`[${CRICKET_IDENTITY_SHELL_ATTRIBUTE}="true"]`) !== null,
    true
  );
  assert.equal(
    firstPlayerNode.querySelector(`[${CRICKET_META_SHELL_ATTRIBUTE}="true"]`) !== null,
    true
  );
  assert.equal(
    firstPlayerNode.querySelector(`[${CRICKET_META_ATTRIBUTE}="avatar"]`) !== null,
    true
  );
  assert.equal(
    firstPlayerNode.querySelector(`[${CRICKET_META_ATTRIBUTE}="name"]`) !== null,
    true
  );
  assert.equal(
    firstPlayerNode.querySelector(`[${CRICKET_META_ATTRIBUTE}="wins"]`) !== null,
    true
  );

  runtime.stop();
});

test("theme-cricket keeps wrapped reported player scores in the score slot after card normalization", async () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "Cricket";
  const boardNodes = createBoardFixture(documentRef, { withContentSlot: true });
  boardNodes.contentSlot.__rect = { width: 1900, height: 680 };
  boardNodes.contentLeft.__rect = { width: 1272, height: 680 };
  boardNodes.contentBoard.__rect = { width: 620, height: 620 };
  boardNodes.boardViewport.__rect = { width: 620, height: 620 };
  boardNodes.boardCanvas.__rect = { width: 620, height: 620 };
  addPlayerCards(documentRef, documentRef.getElementById("ad-ext-player-display"), 3, {
    variant: "reported",
    wrapScore: true,
  });

  const windowRef = createMatchWindow(documentRef, "theme-cricket-wrapped-score");
  const runtime = createBootstrap({
    windowRef,
    documentRef,
    config: createThemeConfig("cricket", {
      showAvg: true,
    }),
  });

  runtime.start();
  await wait(5);

  const playerDisplayNode = documentRef.getElementById("ad-ext-player-display");
  const secondPlayerNode = playerDisplayNode.children[1];
  const scoreWrapper = secondPlayerNode.querySelector(".ad-ext_winner-score-wrapper");
  const scoreNode = secondPlayerNode.querySelector(".ad-ext-player-score");

  assert.equal(scoreWrapper?.getAttribute(CRICKET_SLOT_ATTRIBUTE), "score");
  assert.equal(scoreNode?.textContent || "", "10");
  assert.equal(
    secondPlayerNode.querySelector(`[${CRICKET_SLOT_ATTRIBUTE}="decorative"]`) === scoreWrapper,
    false
  );
  assert.equal(
    secondPlayerNode.querySelector(`[${CRICKET_SLOT_ATTRIBUTE}="stats"]`) !== null,
    true
  );

  runtime.stop();
});

test("theme-cricket gives the board back recovered slack when the player table needs less than its current width", async () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "Cricket";
  const boardNodes = createBoardFixture(documentRef, { withContentSlot: true });
  boardNodes.contentSlot.__rect = { width: 1888, height: 769 };
  boardNodes.contentLeft.__rect = { width: 1404, height: 769 };
  boardNodes.contentBoard.__rect = { width: 474, height: 620 };
  boardNodes.boardViewport.__rect = { width: 620, height: 620 };
  boardNodes.boardCanvas.__rect = { width: 620, height: 620 };

  const playerDisplayNode = documentRef.getElementById("ad-ext-player-display");
  addPlayerCards(documentRef, playerDisplayNode, 3, {
    variant: "reported",
    longName: "TORNADO TOM LONGNAME",
  });
  playerDisplayNode.scrollWidth = 1208;
  boardNodes.contentLeft.scrollWidth = 1208;

  const windowRef = createMatchWindow(documentRef, "theme-cricket-recovers-player-slack");
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
    boardNodes.contentSlot.style.getPropertyValue("--ad-ext-theme-cricket-player-area-required-width"),
    "1208px"
  );
  assert.equal(
    boardNodes.contentSlot.style.getPropertyValue("--ad-ext-theme-cricket-player-column-width"),
    "402px"
  );
  assert.equal(
    boardNodes.contentSlot.classList.contains(THEME_CRICKET_READABILITY.boardHiddenClass),
    false
  );

  runtime.stop();
});

test("theme-cricket restores truncated reported names from avatar metadata before css ellipsis applies", async () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "Cricket";
  const boardNodes = createBoardFixture(documentRef, { withContentSlot: true });
  boardNodes.contentSlot.__rect = { width: 1480, height: 680 };
  boardNodes.contentLeft.__rect = { width: 1260, height: 680 };
  boardNodes.contentBoard.__rect = { width: 212, height: 620 };
  boardNodes.boardViewport.__rect = { width: 620, height: 620 };
  boardNodes.boardCanvas.__rect = { width: 620, height: 620 };

  const playerDisplayNode = documentRef.getElementById("ad-ext-player-display");
  playerDisplayNode.appendChild(
    createReportedCricketPlayerCard(documentRef, 0, {
      visibleName: "TORNADO TO..",
      avatarAlt: "tornado tom",
    })
  );

  const windowRef = createMatchWindow(documentRef, "theme-cricket-restores-truncated-name");
  const runtime = createBootstrap({
    windowRef,
    documentRef,
    config: createThemeConfig("cricket", {
      showAvg: true,
    }),
  });

  runtime.start();
  await wait(5);

  const activePlayer = playerDisplayNode.children[0];
  const restoredNameNode = activePlayer.querySelector(".ad-ext-player-name");
  const restoredNameTextNode = restoredNameNode?.querySelector("p");

  assert.equal(restoredNameTextNode?.textContent || "", "TORNADO TOM");
  assert.equal(restoredNameNode?.getAttribute("title") || "", "TORNADO TOM");
  assert.equal(restoredNameTextNode?.getAttribute("title") || "", "TORNADO TOM");
  assert.equal(
    activePlayer.getAttribute(CRICKET_ACTIVE_PLAYER_ATTRIBUTE),
    "true"
  );

  runtime.stop();
});

test("theme-cricket re-normalizes replaced player-card hosts when the wrapper DOM drifts without state changes", async () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "Cricket";
  const boardNodes = createBoardFixture(documentRef, { withContentSlot: true });
  boardNodes.contentSlot.__rect = { width: 1900, height: 680 };
  boardNodes.contentLeft.__rect = { width: 1272, height: 680 };
  boardNodes.contentBoard.__rect = { width: 620, height: 620 };
  boardNodes.boardViewport.__rect = { width: 620, height: 620 };
  boardNodes.boardCanvas.__rect = { width: 620, height: 620 };
  addPlayerCards(documentRef, documentRef.getElementById("ad-ext-player-display"), 3, {
    variant: "reported",
    visibleName: "TORNADO TO..",
    avatarAlt: "tornado tom",
  });

  const windowRef = createMatchWindow(documentRef, "theme-cricket-reported-dom-replace");
  const runtime = createBootstrap({
    windowRef,
    documentRef,
    config: createThemeConfig("cricket", {
      showAvg: true,
    }),
  });

  runtime.start();
  await wait(5);

  const playerDisplayNode = documentRef.getElementById("ad-ext-player-display");
  const originalFirstPlayer = playerDisplayNode.children[0];
  const replacementPlayer = createCricketPlayerCard(documentRef, 0, {
    variant: "drifted",
    visibleName: "TORNADO TO..",
    avatarAlt: "tornado tom",
  });
  replacementPlayer.classList.add("ad-ext-player-active");

  originalFirstPlayer.before(replacementPlayer);
  originalFirstPlayer.remove();
  documentRef.flushMutations();
  await wait(5);

  assert.equal(
    replacementPlayer.getAttribute(CRICKET_ACTIVE_PLAYER_ATTRIBUTE),
    "true"
  );
  assert.equal(
    replacementPlayer.querySelector(`[${CRICKET_STACK_ATTRIBUTE}="true"]`) !== null,
    true
  );
  assert.equal(
    replacementPlayer.querySelector(`[${CRICKET_ROW_ATTRIBUTE}="true"]`) !== null,
    true
  );
  assert.equal(
    replacementPlayer.querySelector(`[${CRICKET_SLOT_ATTRIBUTE}="identity"]`) !== null,
    true
  );
  assert.equal(
    replacementPlayer.querySelector(`[${CRICKET_META_ATTRIBUTE}="name"]`) !== null,
    true
  );
  const replacementNameNode = replacementPlayer.querySelector(".ad-ext-player-name");
  const replacementNameTextNode = replacementNameNode?.querySelector("p");
  assert.equal(
    replacementNameTextNode?.textContent || "",
    "TORNADO TOM"
  );
  assert.equal(
    replacementNameNode?.getAttribute("title") || "",
    "TORNADO TOM"
  );
  assert.equal(
    boardNodes.contentSlot.style.getPropertyValue("--ad-ext-theme-cricket-player-column-width"),
    "424px"
  );
  assert.equal(
    boardNodes.contentSlot.classList.contains(THEME_CRICKET_READABILITY.boardHiddenClass),
    false
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
