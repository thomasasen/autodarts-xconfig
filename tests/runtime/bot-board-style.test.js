import test from "node:test";
import assert from "node:assert/strict";

import { createDomGuards } from "../../src/core/dom-guards.js";
import { createObserverRegistry } from "../../src/core/observer-registry.js";
import {
  initializeBotBoardStyle,
  hasRelevantBotBoardStyleMutation,
} from "../../src/features/bot-board-style/index.js";
import {
  createBotBoardStyleState,
  isBotTurn,
  updateBotBoardStyle,
} from "../../src/features/bot-board-style/logic.js";
import {
  BOARD_STYLE_IMAGE_ID,
  STYLE_ID,
} from "../../src/features/bot-board-style/style.js";
import { FakeDocument, createFakeWindow } from "./fake-dom.js";

const SVG_NS = "http://www.w3.org/2000/svg";

function createBoardFixture(documentRef) {
  const boardShell = documentRef.createElement("div");
  const boardControls = documentRef.createElement("div");
  const undoButton = documentRef.createElement("button");
  const boardSvg = documentRef.createElementNS(SVG_NS, "svg");
  const boardGroup = documentRef.createElementNS(SVG_NS, "g");

  boardShell.classList.add("showAnimations");
  boardShell.__rect = { left: 820, top: 150, width: 520, height: 520 };
  boardControls.__rect = { left: 820, top: 150, width: 120, height: 40 };
  boardSvg.__rect = { left: 820, top: 200, width: 464, height: 464 };
  boardSvg.setAttribute("viewBox", "0 0 1000 1000");
  boardGroup.setAttribute("transform", "translate(500 500)");

  undoButton.textContent = "Undo";
  boardControls.appendChild(undoButton);
  boardShell.appendChild(boardControls);

  const outerRing = documentRef.createElementNS(SVG_NS, "circle");
  outerRing.setAttribute("r", "500");
  boardGroup.appendChild(outerRing);

  for (let value = 1; value <= 20; value += 1) {
    const labelNode = documentRef.createElementNS(SVG_NS, "text");
    labelNode.textContent = String(value);
    boardGroup.appendChild(labelNode);
  }

  let lastNativePath = null;
  for (let index = 0; index < 40; index += 1) {
    const path = documentRef.createElementNS(SVG_NS, "path");
    path.setAttribute("d", `M ${index} 0 L ${index + 1} 4 L ${index + 2} 0 Z`);
    boardGroup.appendChild(path);
    lastNativePath = path;
  }

  const marker = documentRef.createElementNS(SVG_NS, "circle");
  marker.classList.add("dart-marker");
  marker.setAttribute("cx", "40");
  marker.setAttribute("cy", "50");
  marker.setAttribute("r", "6");
  marker.setAttribute("filter", "url(#shadow-2dp)");
  boardGroup.appendChild(marker);

  const checkoutOverlay = documentRef.createElementNS(SVG_NS, "g");
  checkoutOverlay.id = "ad-ext-checkout-targets";
  boardGroup.appendChild(checkoutOverlay);

  boardSvg.appendChild(boardGroup);
  boardShell.appendChild(boardSvg);
  documentRef.main.appendChild(boardShell);

  return {
    boardShell,
    boardSvg,
    boardGroup,
    lastNativePath,
    marker,
    checkoutOverlay,
  };
}

function addPlayerName(documentRef, text) {
  const nameNode = documentRef.createElement("div");
  nameNode.classList.add("ad-ext-player-name");
  nameNode.textContent = text;
  documentRef.activePlayerRow.appendChild(nameNode);
  return nameNode;
}

function createImmediateScheduler(callback) {
  return {
    schedule() {
      callback();
    },
    cancel() {},
  };
}

function createGameState(options = {}) {
  const listeners = new Set();
  const state = {
    activePlayerIndex: Number(options.activePlayerIndex) || 0,
    players: Array.isArray(options.players) ? options.players : [{ id: "player-1" }],
  };

  return {
    getActivePlayerIndex() {
      return state.activePlayerIndex;
    },
    getSnapshot() {
      return {
        activePlayerIndex: state.activePlayerIndex,
        match: {
          player: state.activePlayerIndex,
          players: state.players,
        },
      };
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    setPlayers(players) {
      state.players = players;
      listeners.forEach((listener) => listener(this.getSnapshot()));
    },
  };
}

test("bot board style places the embedded board above native geometry and below markers", () => {
  const documentRef = new FakeDocument();
  const fixture = createBoardFixture(documentRef);
  const state = createBotBoardStyleState();

  const imageNode = updateBotBoardStyle({
    documentRef,
    state,
    featureConfig: {
      enabled: true,
      design: "target-tor",
      scope: "all-match-boards",
    },
    assetResolver: (design) => `data:image/webp;base64,${design}`,
  });

  assert.ok(imageNode);
  assert.equal(imageNode.id, BOARD_STYLE_IMAGE_ID);
  assert.equal(imageNode.getAttribute("href"), "data:image/webp;base64,target-tor");
  assert.equal(imageNode.getAttribute("x"), "-500");
  assert.equal(imageNode.getAttribute("y"), "-500");
  assert.equal(imageNode.getAttribute("width"), "1000");
  assert.equal(imageNode.getAttribute("height"), "1000");
  assert.equal(imageNode.getAttribute("pointer-events"), "none");

  const children = fixture.boardGroup.children;
  assert.ok(children.indexOf(imageNode) > children.indexOf(fixture.lastNativePath));
  assert.ok(children.indexOf(imageNode) < children.indexOf(fixture.marker));
  assert.ok(children.indexOf(imageNode) < children.indexOf(fixture.checkoutOverlay));
});

test("bot board style lifts an existing overlay above the board image without replacing it", () => {
  const documentRef = new FakeDocument();
  const fixture = createBoardFixture(documentRef);
  const state = createBotBoardStyleState();
  const overlayShape = documentRef.createElementNS(SVG_NS, "path");
  fixture.checkoutOverlay.appendChild(overlayShape);
  fixture.boardGroup.insertBefore(
    fixture.checkoutOverlay,
    fixture.boardGroup.firstElementChild
  );

  const imageNode = updateBotBoardStyle({
    documentRef,
    state,
    featureConfig: {
      enabled: true,
      design: "target-tor",
      scope: "all-match-boards",
    },
    assetResolver: (design) => `data:image/webp;base64,${design}`,
  });

  const children = fixture.boardGroup.children;
  assert.ok(children.indexOf(imageNode) > children.indexOf(fixture.lastNativePath));
  assert.ok(children.indexOf(fixture.checkoutOverlay) > children.indexOf(imageNode));
  assert.equal(fixture.checkoutOverlay.children[0], overlayShape);

  const stableOrder = Array.from(children);
  updateBotBoardStyle({
    documentRef,
    state,
    featureConfig: {
      enabled: true,
      design: "target-tor",
      scope: "all-match-boards",
    },
    assetResolver: (design) => `data:image/webp;base64,${design}`,
  });
  assert.deepEqual(Array.from(fixture.boardGroup.children), stableOrder);
});

test("bot board style keeps the native hit highlight above the board image", () => {
  const documentRef = new FakeDocument();
  const fixture = createBoardFixture(documentRef);
  const state = createBotBoardStyleState();
  const nativeHitHighlight = documentRef.createElementNS(SVG_NS, "path");
  nativeHitHighlight.classList.add("_Highlight_7z2b9_13");
  nativeHitHighlight.setAttribute("d", "M 0 -378 L 20 -352 L -20 -352 Z");
  fixture.boardGroup.insertBefore(
    nativeHitHighlight,
    fixture.boardGroup.firstElementChild
  );

  const imageNode = updateBotBoardStyle({
    documentRef,
    state,
    featureConfig: {
      enabled: true,
      design: "target-tor",
      scope: "all-match-boards",
    },
    assetResolver: (design) => `data:image/webp;base64,${design}`,
  });

  const children = fixture.boardGroup.children;
  assert.ok(children.indexOf(imageNode) > children.indexOf(fixture.lastNativePath));
  assert.ok(children.indexOf(nativeHitHighlight) > children.indexOf(imageNode));

  const stableOrder = Array.from(children);
  updateBotBoardStyle({
    documentRef,
    state,
    featureConfig: {
      enabled: true,
      design: "target-tor",
      scope: "all-match-boards",
    },
    assetResolver: (design) => `data:image/webp;base64,${design}`,
  });
  assert.deepEqual(Array.from(fixture.boardGroup.children), stableOrder);
  assert.equal(nativeHitHighlight.isConnected, true);
});

test("bot-only scope fails closed for humans and recognizes bot state, icon, and name", () => {
  const documentRef = new FakeDocument();
  createBoardFixture(documentRef);
  const state = createBotBoardStyleState();
  const nameNode = addPlayerName(documentRef, "Human Player");
  const featureConfig = {
    enabled: true,
    design: "winmau-blade-6-tc",
    scope: "bot-turns",
  };
  const assetResolver = () => "data:image/webp;base64,board";
  const humanGameState = createGameState({ players: [{ id: "human" }] });

  assert.equal(isBotTurn(documentRef, humanGameState), false);
  assert.equal(
    updateBotBoardStyle({ documentRef, state, gameState: humanGameState, featureConfig, assetResolver }),
    null
  );

  nameNode.textContent = "BOT LEVEL 5";
  assert.equal(isBotTurn(documentRef, humanGameState), true);
  assert.ok(
    updateBotBoardStyle({ documentRef, state, gameState: humanGameState, featureConfig, assetResolver })
  );

  nameNode.textContent = "Human Player";
  const iconSvg = documentRef.createElementNS(SVG_NS, "svg");
  const iconPath = documentRef.createElementNS(SVG_NS, "path");
  iconPath.setAttribute("d", "M20 9V7 extra");
  iconSvg.appendChild(iconPath);
  documentRef.activePlayerRow.appendChild(iconSvg);
  assert.equal(isBotTurn(documentRef, humanGameState), true);

  iconSvg.remove();
  const payloadGameState = createGameState({ players: [{ id: "bot", isBot: true }] });
  assert.equal(isBotTurn(documentRef, payloadGameState), true);
});

test("bot board style rehydrates once after the host replaces the board and cleans up fully", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  const firstFixture = createBoardFixture(documentRef);
  const observers = createObserverRegistry();
  const gameState = createGameState();

  const cleanup = initializeBotBoardStyle({
    documentRef,
    windowRef,
    domGuards: createDomGuards({ documentRef }),
    registries: { observers },
    gameState,
    config: {
      getFeatureConfig() {
        return {
          enabled: true,
          design: "shot-bandit",
          scope: "all-match-boards",
        };
      },
    },
    helpers: {
      createRafScheduler: createImmediateScheduler,
    },
  });

  const firstImage = firstFixture.boardGroup.querySelector(`#${BOARD_STYLE_IMAGE_ID}`);
  assert.ok(firstImage);
  assert.ok(documentRef.getElementById(STYLE_ID));
  assert.equal(observers.size(), 1);

  firstFixture.boardShell.remove();
  const secondFixture = createBoardFixture(documentRef);
  documentRef.flushMutations([
    {
      type: "childList",
      target: documentRef.main,
      addedNodes: [secondFixture.boardShell],
      removedNodes: [firstFixture.boardShell],
    },
  ]);

  const secondImages = secondFixture.boardGroup.querySelectorAll(`#${BOARD_STYLE_IMAGE_ID}`);
  assert.equal(secondImages.length, 1);
  assert.notEqual(secondImages[0], firstImage);
  assert.equal(firstImage.isConnected, false);

  cleanup();
  cleanup();
  assert.equal(observers.size(), 0);
  assert.equal(documentRef.getElementById(STYLE_ID), null);
  assert.equal(documentRef.getElementById(BOARD_STYLE_IMAGE_ID), null);
});

test("bot board style mutation filter ignores unrelated page updates", () => {
  const documentRef = new FakeDocument();
  const fixture = createBoardFixture(documentRef);
  const state = createBotBoardStyleState();
  state.boardGroup = fixture.boardGroup;

  const unrelated = documentRef.createElement("div");
  unrelated.classList.add("unrelated-card");
  documentRef.sidebar.appendChild(unrelated);

  assert.equal(
    hasRelevantBotBoardStyleMutation(
      [{ type: "childList", target: unrelated, addedNodes: [], removedNodes: [] }],
      state
    ),
    false
  );
  assert.equal(
    hasRelevantBotBoardStyleMutation(
      [{ type: "attributes", target: documentRef.activePlayerRow, addedNodes: [], removedNodes: [] }],
      state
    ),
    true
  );
});
