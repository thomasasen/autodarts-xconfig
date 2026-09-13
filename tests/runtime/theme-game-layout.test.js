import test from "node:test";
import assert from "node:assert/strict";

import { createRuntimeConfig } from "../../src/config/runtime-config.js";
import { createDomGuards } from "../../src/core/dom-guards.js";
import { createListenerRegistry } from "../../src/core/listener-registry.js";
import { createObserverRegistry } from "../../src/core/observer-registry.js";
import { mountThemeGameLayout } from "../../src/features/themes/game-layout/index.js";
import {
  calculateBoardFocusLayout,
  moveBoardFocusWindow,
} from "../../src/features/themes/game-layout/logic.js";
import { resolveModernX01GameLayoutSurface } from "../../src/features/themes/game-layout/surface.js";
import {
  STYLE_ID,
  buildThemeGameLayoutStyleText,
} from "../../src/features/themes/game-layout/style.js";
import { FakeEvent } from "./fake-dom.js";
import { createModernX01Fixture } from "./modern-x01-fixture.js";

function createImmediateSchedulerFactory() {
  return (callback) => ({ schedule: callback, cancel() {} });
}

function createPlayerCard(fixture, column, index, active) {
  const item = fixture.node(column, "div", "flex w-full flex-col border-black-60");
  const rounded = fixture.node(item, "div", "relative flex w-full rounded-2xl overflow-hidden");
  const card = fixture.node(
    rounded,
    "div",
    `relative isolate flex-1 flex flex-col items-center overflow-clip ${active ? "bg-raspberry-slush-diagonal" : "bg-black-80"}`
  );
  const route = fixture.node(card, "div", "absolute checkout-rail");
  fixture.node(route, "span", "text-checkout-suggestion", "D18");
  if (active) fixture.node(card, "span", "bg-mono-white rounded-full", "");
  const body = fixture.node(card, "div", "relative flex items-center justify-center w-full flex-1");
  const content = fixture.node(body, "div", "flex min-w-0 flex-col items-center justify-center flex-1");
  const nameRegion = fixture.node(content, "div", "w-full flex justify-center");
  fixture.node(nameRegion, "span", "font-display", `PLAYER ${index + 1}`);
  const scoreRegion = fixture.node(content, "div", "flex justify-center items-center");
  const score = fixture.node(scoreRegion, "strong", "font-number overflow-hidden", String(501 - index * 40));
  const legs = fixture.node(scoreRegion, "div", "legs-won", "0");
  fixture.node(content, "div", "average", `Leg ${50 + index}.0 / Match ${49 + index}.0`);
  const lastScore = fixture.node(content, "div", "last-score", "60");
  const dartIcon = fixture.node(lastScore, "div", "rotate-45");
  fixture.node(dartIcon, "svg", "dart-icon");
  return { item, card, body, content, nameRegion, scoreRegion, score, legs, dartIcon, route };
}

function createLayoutFixture(options = {}) {
  const fixture = createModernX01Fixture({ base: 501 });
  fixture.card.remove();
  const root = fixture.node(fixture.documentRef.main, "div", "relative z-10 flex-1");
  root.__rect = {
    left: 0,
    top: 0,
    width: options.width || 1536,
    height: options.height || 808,
  };
  const leftColumn = fixture.node(root, "div", "flex w-100 flex-col");
  const stage = fixture.node(root, "div", "grid h-full");
  const rightColumn = fixture.node(root, "div", "flex w-100 flex-col");
  const turnSlot = fixture.node(stage, "div", "w-0 min-w-full");
  turnSlot.appendChild(fixture.turn);
  const boardSlot = fixture.node(stage, "div", "relative aspect-square h-full");
  boardSlot.appendChild(fixture.host);
  const controlsSlot = fixture.node(stage, "div", "w-0 min-w-full");
  const controlsWrap = fixture.node(controlsSlot, "div", "flex justify-center");
  const controlBar = fixture.node(controlsWrap, "div", "relative flex bg-blue");
  fixture.node(controlBar, "button", "input-mode", "Input");
  fixture.node(controlBar, "button", "undo", "Undo");
  fixture.node(controlBar, "button", "next", "Next");
  const playerCount = options.playerCount || 3;
  const activeIndex = options.activeIndex ?? 0;
  const players = Array.from({ length: playerCount }, (_, index) =>
    createPlayerCard(fixture, index < Math.ceil(playerCount / 2) ? leftColumn : rightColumn, index, index === activeIndex)
  );
  return {
    ...fixture,
    root,
    leftColumn,
    rightColumn,
    stage,
    turnSlot,
    boardSlot,
    controlsSlot,
    controlBar,
    players,
  };
}

function mountContext(config, fixture) {
  return {
    config,
    documentRef: fixture.documentRef,
    windowRef: fixture.windowRef,
    domGuards: createDomGuards({ documentRef: fixture.documentRef }),
    gameState: { subscribe() { return () => {}; } },
    registries: {
      observers: createObserverRegistry(),
      listeners: createListenerRegistry(),
    },
    helpers: { createRafScheduler: createImmediateSchedulerFactory() },
  };
}

test("board-focus geometry maximizes the board and keeps readable player rows", () => {
  assert.match(buildThemeGameLayoutStyleText(), /--ad-game-layout-turn-height:128px/);
  assert.match(buildThemeGameLayoutStyleText(), /max-width:none!important/);
  assert.match(buildThemeGameLayoutStyleText(), /width:192px!important/);
  assert.match(buildThemeGameLayoutStyleText(), />:nth-child\(2\)\{display:none!important\}/);
  assert.match(buildThemeGameLayoutStyleText(), /grid-template-columns:var\(--ad-game-layout-rail-width\) minmax\(0,1fr\)!important/);
  assert.match(buildThemeGameLayoutStyleText(), /grid-template-columns:minmax\(0,1fr\) minmax\(150px,\.5fr\) auto!important/);
  assert.match(buildThemeGameLayoutStyleText(), /data-ad-ext-game-layout-score-value="true"[^}]*align-self:end!important[^}]*height:var\(--ad-game-layout-score-span\)!important/);
  assert.match(buildThemeGameLayoutStyleText(), /font-size:clamp\(2rem,calc\(var\(--ad-game-layout-player-height\) \* \.225\),2\.25rem\)!important/);
  assert.match(buildThemeGameLayoutStyleText(), /font-size:clamp\(4rem,calc\(var\(--ad-game-layout-score-span\) \/ \.84\),7rem\)!important/);
  assert.match(buildThemeGameLayoutStyleText(), /data-ad-ext-game-layout-active="false"[^}]*filter:grayscale\(1\)!important[^}]*opacity:\.55!important/);
  assert.match(buildThemeGameLayoutStyleText(), /data-ad-ext-game-layout-active="false"[^}]*grid-template-columns:minmax\(0,1fr\) minmax\(110px,\.35fr\) 34px!important[^}]*transform:none!important/);
  assert.match(buildThemeGameLayoutStyleText(), /data-ad-ext-game-layout-name-region="true"[^}]*zoom:\.84/);
  assert.doesNotMatch(buildThemeGameLayoutStyleText(), /player-content="true"[^}]*transform:scale/);
  const threePlayers = calculateBoardFocusLayout({
    width: 1536,
    height: 808,
    playerCount: 3,
    activeIndex: 0,
  });
  assert.equal(threePlayers.supported, true);
  assert.equal(Math.round(threePlayers.boardSize), 792);
  assert.equal(Math.round(threePlayers.railWidth), 645);
  assert.equal(threePlayers.playerHeight, 160);
  assert.equal(threePlayers.inactivePlayerHeight, 96);
  assert.equal(threePlayers.visiblePlayerCount, 3);
  assert.equal(threePlayers.overflow, false);

  const fourPlayers = calculateBoardFocusLayout({ width: 1280, height: 720, playerCount: 4 });
  assert.equal(fourPlayers.supported, true);
  assert.ok(fourPlayers.boardSize >= 640);
  assert.ok(fourPlayers.playerHeight >= 112);

  const minimum = calculateBoardFocusLayout({ width: 1180, height: 650, playerCount: 4 });
  assert.equal(minimum.supported, true);
  assert.ok(minimum.boardSize >= 580);

  [1, 2, 3, 4, 5, 6, 24].forEach((playerCount) => {
    const metrics = calculateBoardFocusLayout({ width: 1536, height: 808, playerCount });
    assert.equal(metrics.supported, true);
    assert.ok(metrics.playerHeight >= 112);
  });
});

test("board-focus geometry follows the active player and clamps manual scrolling", () => {
  const metrics = calculateBoardFocusLayout({
    width: 1536,
    height: 808,
    playerCount: 24,
    activeIndex: 23,
    firstVisibleIndex: 0,
  });
  assert.equal(metrics.overflow, true);
  assert.equal(metrics.firstVisibleIndex, metrics.maximumFirstVisible);
  assert.equal(
    moveBoardFocusWindow(metrics.firstVisibleIndex, 1, 24, metrics.visiblePlayerCount),
    metrics.maximumFirstVisible
  );
  assert.equal(moveBoardFocusWindow(0, -1, 24, metrics.visiblePlayerCount), 0);
});

test("game-layout surface resolves all native players without moving nodes", () => {
  const fixture = createLayoutFixture({ playerCount: 3, activeIndex: 1 });
  const originalParents = fixture.players.map((player) => player.item.parentElement);
  const surface = resolveModernX01GameLayoutSurface(fixture.documentRef, fixture.windowRef);

  assert.ok(surface);
  assert.equal(surface.root, fixture.root);
  assert.equal(surface.stage, fixture.stage);
  assert.equal(surface.boardFrame, fixture.host);
  assert.equal(surface.players.length, 3);
  assert.equal(surface.activeIndex, 1);
  assert.equal(surface.players[0].scoreValueNode, fixture.players[0].score);
  assert.equal(surface.players[0].legsNode, fixture.players[0].legs);
  assert.equal(surface.players[0].dartIconNode, fixture.players[0].dartIcon);
  assert.deepEqual(fixture.players.map((player) => player.item.parentElement), originalParents);
});

test("game-layout compacts inactive players, scrolls whole rows and restores native state", () => {
  const fixture = createLayoutFixture({ playerCount: 8, activeIndex: 7 });
  fixture.players[0].item.setAttribute("inert", "native");
  fixture.players[0].dartIcon.__rect = { left: 0, top: 12, width: 20, height: 20 };
  fixture.players[0].legs.__rect = { left: 0, top: 44.8, width: 32, height: 20 };
  fixture.players[7].dartIcon.__rect = { left: 0, top: 12, width: 20, height: 20 };
  fixture.players[7].legs.__rect = { left: 0, top: 68, width: 32, height: 32 };
  const config = createRuntimeConfig({
    featureToggles: { "themes.gameLayout": true },
    features: { themes: { gameLayout: { enabled: true, debug: false } } },
  });
  const cleanup = mountThemeGameLayout(mountContext(config, fixture));

  assert.ok(fixture.documentRef.getElementById(STYLE_ID));
  assert.equal(fixture.root.getAttribute("data-ad-ext-game-layout-root"), "true");
  assert.equal(fixture.root.getAttribute("data-ad-ext-game-layout-overflow"), "true");
  assert.equal(fixture.players[0].item.getAttribute("data-ad-ext-game-layout-active"), "false");
  assert.equal(fixture.players[7].item.getAttribute("data-ad-ext-game-layout-active"), "true");
  assert.equal(fixture.players[7].score.getAttribute("data-ad-ext-game-layout-score-value"), "true");
  assert.equal(fixture.players[7].legs.getAttribute("data-ad-ext-game-layout-legs"), "true");
  assert.equal(fixture.players[0].item.style.getPropertyValue("--ad-game-layout-card-height"), "67.2px");
  assert.equal(fixture.players[7].item.style.getPropertyValue("--ad-game-layout-card-height"), "112px");
  assert.ok(
    Math.abs(Number.parseFloat(
      fixture.players[0].score.style.getPropertyValue("--ad-game-layout-score-span")
    ) - 52.8) < 0.001
  );
  assert.equal(
    fixture.players[7].score.style.getPropertyValue("--ad-game-layout-score-span"),
    "88px"
  );
  assert.equal(fixture.players[0].item.getAttribute("data-ad-ext-game-layout-visible"), "false");
  assert.equal(fixture.players[7].item.getAttribute("data-ad-ext-game-layout-visible"), "true");
  assert.notEqual(fixture.players[0].item.getAttribute("inert"), null);

  const wheel = new FakeEvent("wheel", { bubbles: false, cancelable: true });
  wheel.deltaY = -120;
  wheel.clientX = 100;
  wheel.clientY = 300;
  fixture.root.dispatchEvent(wheel);
  assert.equal(wheel.defaultPrevented, true);

  const boardWheel = new FakeEvent("wheel", { bubbles: false, cancelable: true });
  boardWheel.deltaY = 120;
  boardWheel.clientX = 900;
  boardWheel.clientY = 300;
  fixture.root.dispatchEvent(boardWheel);
  assert.equal(boardWheel.defaultPrevented, false);

  cleanup();
  assert.equal(fixture.documentRef.getElementById(STYLE_ID), null);
  assert.equal(fixture.root.getAttribute("data-ad-ext-game-layout-root"), null);
  assert.equal(fixture.players[0].item.getAttribute("data-ad-ext-game-layout-active"), null);
  assert.equal(fixture.players[7].item.getAttribute("data-ad-ext-game-layout-active"), null);
  assert.equal(fixture.players[7].score.getAttribute("data-ad-ext-game-layout-score-value"), null);
  assert.equal(fixture.players[7].legs.getAttribute("data-ad-ext-game-layout-legs"), null);
  assert.equal(fixture.players[0].item.style.getPropertyValue("--ad-game-layout-card-height"), "");
  assert.equal(fixture.players[7].item.style.getPropertyValue("--ad-game-layout-card-height"), "");
  assert.equal(fixture.players[0].score.style.getPropertyValue("--ad-game-layout-score-span"), "");
  assert.equal(fixture.players[7].score.style.getPropertyValue("--ad-game-layout-score-span"), "");
  assert.equal(fixture.players[0].item.getAttribute("inert"), "native");
  assert.equal(fixture.players[7].item.getAttribute("inert"), null);
});

test("game-layout keeps every player readable when the host exposes no active player", () => {
  const fixture = createLayoutFixture({ playerCount: 3, activeIndex: -1 });
  const config = createRuntimeConfig({
    featureToggles: { "themes.gameLayout": true },
    features: { themes: { gameLayout: { enabled: true } } },
  });
  const cleanup = mountThemeGameLayout(mountContext(config, fixture));

  fixture.players.forEach((player) => {
    assert.equal(player.item.getAttribute("data-ad-ext-game-layout-active"), "true");
  });

  cleanup();
});

test("game-layout falls back completely for small and ambiguous surfaces", () => {
  const fixture = createLayoutFixture({ width: 1179, height: 650 });
  const config = createRuntimeConfig({
    featureToggles: { "themes.gameLayout": true },
    features: { themes: { gameLayout: { enabled: true } } },
  });
  const cleanup = mountThemeGameLayout(mountContext(config, fixture));
  assert.equal(fixture.documentRef.getElementById(STYLE_ID), null);
  assert.equal(fixture.root.getAttribute("data-ad-ext-game-layout-root"), null);
  cleanup();

  fixture.controlsSlot.remove();
  assert.equal(resolveModernX01GameLayoutSurface(fixture.documentRef, fixture.windowRef), null);

  const missingLegs = createLayoutFixture();
  missingLegs.players[0].legs.remove();
  assert.equal(resolveModernX01GameLayoutSurface(missingLegs.documentRef, missingLegs.windowRef), null);

  const missingDartIcon = createLayoutFixture();
  missingDartIcon.players[0].dartIcon.remove();
  assert.equal(resolveModernX01GameLayoutSurface(missingDartIcon.documentRef, missingDartIcon.windowRef), null);
});
