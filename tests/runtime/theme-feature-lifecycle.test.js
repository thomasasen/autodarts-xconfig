import test from "node:test";
import assert from "node:assert/strict";

import { createBootstrap } from "../../src/core/bootstrap.js";
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
  boardNodes.contentSlot.__rect = { width: 1400, height: 680 };
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
    "1242px"
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
    "160px"
  );
  assert.equal(
    boardNodes.contentSlot.style.getPropertyValue("--ad-ext-theme-cricket-player-area-required-width"),
    "1242px"
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

  boardNodes.contentSlot.__rect = { width: 1600, height: 680 };
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

test("theme-cricket keeps 4-player readability width stable on narrow slots without right-side clipping pressure", async () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "Tactics";
  const boardNodes = createBoardFixture(documentRef, { withContentSlot: true });
  boardNodes.contentSlot.__rect = { width: 1020, height: 680 };
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
    "832px"
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
    "832px"
  );
  assert.equal(
    boardNodes.contentSlot.style.getPropertyValue("--ad-ext-theme-cricket-player-count"),
    "4"
  );
  assert.equal(
    boardNodes.contentSlot.style.getPropertyValue("--ad-ext-theme-cricket-board-width"),
    "180px"
  );

  runtime.stop();
});

test("theme-cricket keeps March 15 readability semantics with nested showAnimations board layers", async () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "Tactics";
  const boardNodes = createNestedShowAnimationsBoardFixture(documentRef, { withContentSlot: true });
  boardNodes.contentSlot.__rect = { width: 1400, height: 680 };
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
    "620px"
  );
  assert.equal(
    boardNodes.innerBoardLayer.style.getPropertyValue("--ad-ext-theme-board-size"),
    "620px"
  );
  assert.equal(
    boardNodes.contentSlot.style.getPropertyValue("--ad-ext-theme-cricket-player-area-required-width"),
    "1242px"
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
    "160px"
  );
  assert.equal(
    boardNodes.contentSlot.style.getPropertyValue("--ad-ext-theme-cricket-player-area-required-width"),
    "1242px"
  );
  assert.equal(
    noticeTextNode?.textContent || "",
    "Board manuell eingeblendet, Spielerinfos behalten Priorität."
  );

  boardNodes.contentSlot.__rect = { width: 1600, height: 680 };
  windowRef.dispatchEvent(new windowRef.Event("resize"));
  await wait(5);

  assert.equal(boardNodes.contentSlot.classList.contains(THEME_CRICKET_READABILITY.constrainedClass), false);
  assert.equal(boardNodes.contentSlot.classList.contains(THEME_CRICKET_READABILITY.boardHiddenClass), false);
  assert.equal(
    boardNodes.contentSlot.style.getPropertyValue("--ad-ext-theme-cricket-board-width"),
    ""
  );
  assert.equal(Boolean(documentRef.getElementById(THEME_CRICKET_READABILITY.noticeId)), false);

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
