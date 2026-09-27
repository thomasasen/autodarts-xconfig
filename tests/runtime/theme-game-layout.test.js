import test from "node:test";
import assert from "node:assert/strict";

import { createRuntimeConfig } from "../../src/config/runtime-config.js";
import { createDomGuards } from "../../src/core/dom-guards.js";
import { createListenerRegistry } from "../../src/core/listener-registry.js";
import { createObserverRegistry } from "../../src/core/observer-registry.js";
import { mountThemeGameLayout } from "../../src/features/themes/game-layout/index.js";
import {
  GAME_LAYOUT_RAIL_MAX_WIDTH,
  calculateBoardFocusLayout,
  calculateClearRailRange,
  calculateFittedFontSize,
  moveBoardFocusWindow,
  resolveGameLayoutPlayerOrder,
  resolveLegStarterSeat,
} from "../../src/features/themes/game-layout/logic.js";
import {
  GAME_LAYOUT_PLAYER_TRANSITION_DURATION_MS,
  buildGameLayoutPlayerTransitionKeyframes,
} from "../../src/features/themes/game-layout/player-transition.js";
import { resolveModernX01GameLayoutSurface } from "../../src/features/themes/game-layout/surface.js";
import {
  STYLE_ID,
  buildThemeGameLayoutStyleText,
} from "../../src/features/themes/game-layout/style.js";
import { FakeEvent, FakeEventTarget, createFakeTimerHarness } from "./fake-dom.js";
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
  fixture.node(nameRegion, "div", "size-2 rounded-full", "");
  const nameContainer = fixture.node(nameRegion, "div", "isolate flex flex-col min-w-0");
  const nameRow = fixture.node(nameContainer, "div", "flex min-w-0 items-center");
  fixture.node(nameRow, "div", "avatar shrink-0", "");
  const namePlate = fixture.node(nameRow, "div", "flex items-center min-w-0 h-8");
  fixture.node(namePlate, "span", "font-display", `PLAYER ${index + 1}`);
  fixture.node(namePlate, "div", "flag shrink-0", "");
  fixture.node(nameRow, "svg", "name-cap shrink-0", "");
  fixture.node(nameRegion, "div", "size-2 shrink-0 invisible", "");
  const scoreRegion = fixture.node(content, "div", "flex justify-center items-center");
  const score = fixture.node(scoreRegion, "strong", "font-number overflow-hidden", String(501 - index * 40));
  const legs = fixture.node(scoreRegion, "div", "legs-won", "0");
  fixture.node(content, "div", "average", `Leg ${50 + index}.0 / Match ${49 + index}.0`);
  const lastScore = fixture.node(content, "div", "last-score", "60");
  const dartIcon = fixture.node(lastScore, "div", "rotate-45");
  fixture.node(dartIcon, "svg", "dart-icon");
  return {
    item,
    card,
    body,
    content,
    nameRegion,
    nameContainer,
    nameRow,
    namePlate,
    scoreRegion,
    score,
    legs,
    dartIcon,
    route,
  };
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

function createGameStateHarness(initialSnapshot = null) {
  let snapshot = initialSnapshot;
  const listeners = new Set();
  return {
    getSnapshot() {
      return snapshot;
    },
    setSnapshot(nextSnapshot) {
      snapshot = nextSnapshot;
      listeners.forEach((listener) => listener(snapshot));
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

function setActivePlayer(fixture, activeIndex) {
  fixture.players.forEach((player, index) => {
    player.card.classList.remove("bg-raspberry-slush-diagonal", "bg-grey-slush-diagonal", "bg-black-80");
    player.card.classList.add(index === activeIndex ? "bg-raspberry-slush-diagonal" : "bg-black-80");
  });
}

function mountContext(config, fixture, gameState = createGameStateHarness()) {
  return {
    config,
    documentRef: fixture.documentRef,
    windowRef: fixture.windowRef,
    domGuards: createDomGuards({ documentRef: fixture.documentRef }),
    gameState,
    registries: {
      observers: createObserverRegistry(),
      listeners: createListenerRegistry(),
    },
    helpers: { createRafScheduler: createImmediateSchedulerFactory() },
  };
}

test("active-first player order rotates cyclically only for one unambiguous active player", () => {
  const players = [
    { id: "A", active: false },
    { id: "B", active: true },
    { id: "C", active: false },
  ];
  assert.deepEqual(
    resolveGameLayoutPlayerOrder(players, "active-first").map((player) => player.id),
    ["B", "C", "A"]
  );
  assert.deepEqual(
    resolveGameLayoutPlayerOrder(players, "fixed").map((player) => player.id),
    ["A", "B", "C"]
  );
  assert.deepEqual(
    resolveGameLayoutPlayerOrder(
      [
        { id: "A", active: true },
        { id: "B", active: true },
        { id: "C", active: false },
      ],
      "active-first"
    ).map((player) => player.id),
    ["A", "B", "C"]
  );
  assert.deepEqual(
    resolveGameLayoutPlayerOrder(
      [
        { id: "A", active: false },
        { id: "B", active: false },
      ],
      "active-first"
    ).map((player) => player.id),
    ["A", "B"]
  );
});

test("leg starter seat resolves only from a complete plausible match snapshot", () => {
  assert.equal(
    resolveLegStarterSeat({
      match: {
        players: [
          { index: 2, name: "C" },
          { index: 0, name: "A" },
          { index: 1, name: "B" },
        ],
      },
    }, 3),
    2
  );
  assert.equal(resolveLegStarterSeat({ match: { players: [{ index: 0 }] } }, 3), null);
  assert.equal(
    resolveLegStarterSeat({
      match: {
        players: [
          { index: 4 },
          { index: 0 },
          { index: 1 },
        ],
      },
    }, 3),
    null
  );
  assert.equal(resolveLegStarterSeat(null, 3), null);
});

test("board-focus geometry maximizes the board and keeps readable player rows", () => {
  assert.match(buildThemeGameLayoutStyleText(), /--ad-game-layout-turn-height:144px/);
  assert.match(buildThemeGameLayoutStyleText(), /max-width:none!important/);
  assert.match(buildThemeGameLayoutStyleText(), /width:min\(var\(--ad-game-layout-board-size\),calc\(100% - 24px\)\)!important/);
  assert.match(buildThemeGameLayoutStyleText(), /data-ad-ext-game-layout-board-frame="true"[^}]*justify-self:center!important/);
  assert.match(buildThemeGameLayoutStyleText(), /dart-segment-blink[^}]*animation:ad-ext-game-layout-hit-pulse 1\.6s ease-in-out infinite!important/);
  assert.match(buildThemeGameLayoutStyleText(), /@keyframes ad-ext-game-layout-hit-pulse\{[\s\S]*?0%,100%\{opacity:\.42\}[\s\S]*?50%\{opacity:\.62\}/);
  assert.match(buildThemeGameLayoutStyleText(), /prefers-reduced-motion:reduce[^}]*dart-segment-blink[^}]*animation:none!important[^}]*opacity:\.52!important/);
  assert.match(buildThemeGameLayoutStyleText(), /data-ad-ext-game-layout-controls-slot="true"[^}]*justify-self:center!important/);
  assert.match(buildThemeGameLayoutStyleText(), />:nth-child\(2\)\{display:none!important\}/);
  assert.match(buildThemeGameLayoutStyleText(), /grid-template-columns:var\(--ad-game-layout-rail-width\) minmax\(0,1fr\)!important/);
  assert.match(buildThemeGameLayoutStyleText(), /grid-template-columns:minmax\(0,1fr\) minmax\(150px,max-content\) auto!important/);
  assert.match(buildThemeGameLayoutStyleText(), /grid-template-rows:52px minmax\(0,1fr\)!important/);
  assert.match(buildThemeGameLayoutStyleText(), /data-ad-ext-game-layout-name-container="true"[^}]*flex:1 1 auto!important[^}]*max-width:100%!important/);
  assert.match(buildThemeGameLayoutStyleText(), /data-ad-ext-game-layout-name-container="true"[^}]*>\*[^}]*width:100%!important/);
  assert.match(buildThemeGameLayoutStyleText(), /data-ad-ext-game-layout-name-plate="true"[^}]*flex:1 1 auto!important[^}]*min-height:52px!important/);
  assert.match(buildThemeGameLayoutStyleText(), /data-ad-ext-game-layout-stat-region="0"[^}]*padding-top:10px!important/);
  assert.match(buildThemeGameLayoutStyleText(), /data-ad-ext-game-layout-score-value="true"[^}]*align-self:end!important[^}]*height:var\(--ad-game-layout-score-span\)!important/);
  assert.match(buildThemeGameLayoutStyleText(), /left:var\(--ad-game-layout-variant-left,16px\)!important/);
  assert.match(buildThemeGameLayoutStyleText(), /height:auto!important;[^}]*line-height:1!important;[^}]*font-size:var\(--ad-game-layout-name-font-size,clamp\(2rem,calc\(var\(--ad-game-layout-player-height\) \* \.225\),2\.25rem\)\)!important/);
  assert.match(
    buildThemeGameLayoutStyleText(),
    /font-size:var\(--ad-ext-theme-remaining-score-font-size,clamp\(4rem,calc\(var\(--ad-game-layout-score-span\) \/ \.84\),7rem\)\)!important/
  );
  assert.match(buildThemeGameLayoutStyleText(), /data-ad-ext-game-layout-score-value="true"[^}]*font-number\.overflow-hidden[^}]*overflow:visible!important/);
  assert.match(buildThemeGameLayoutStyleText(), /data-ad-ext-game-layout-turn-slot="true"[^}]*bg-surface-surface>:first-child>\*[^}]*transform:none!important/);
  assert.match(buildThemeGameLayoutStyleText(), /bg-surface-surface>:first-child\{[^}]*flex:3 1 75%!important[^}]*width:75%!important/);
  assert.match(buildThemeGameLayoutStyleText(), /bg-surface-surface>:last-child\{[^}]*flex:1 1 25%!important[^}]*width:25%!important[^}]*max-width:none!important/);
  assert.match(buildThemeGameLayoutStyleText(), /bg-surface-surface\{[^}]*left:auto!important[^}]*flex:1 1 100%!important[^}]*width:100%!important[^}]*transform:none!important/);
  assert.match(buildThemeGameLayoutStyleText(), /--ad-game-layout-turn-value-font-size:clamp\(2\.25rem,3\.35vw,3\.5rem\)/);
  assert.match(buildThemeGameLayoutStyleText(), /bg-surface-surface>:first-child>\*:not\(\.text-checkout-suggestion,\.text-checkout-setup\)::before\{[^}]*font-size:var\(--ad-game-layout-turn-value-font-size\)!important/);
  assert.match(buildThemeGameLayoutStyleText(), /bg-surface-surface>:last-child>span,[^{}]*bg-surface-surface>:first-child>\.font-number>span:not\(\[aria-hidden="true"\]\) \*\{[^}]*font-size:var\(--ad-game-layout-turn-value-font-size\)!important/);
  assert.match(buildThemeGameLayoutStyleText(), /\*\.text-checkout-suggestion\{[^}]*padding:10px 12px!important[^}]*box-sizing:border-box!important/);
  assert.doesNotMatch(buildThemeGameLayoutStyleText(), /font-size:1\.6rem!important/);
  assert.doesNotMatch(buildThemeGameLayoutStyleText(), /nth-child\(3\)/);
  assert.match(buildThemeGameLayoutStyleText(), /:is\(\.text-checkout-suggestion,\.text-checkout-setup\)\[data-ad-ext-label\]::before\{[^}]*padding:4\.5px 10\.5px!important[^}]*font-size:16\.5px!important/);
  assert.match(buildThemeGameLayoutStyleText(), /data-ad-ext-game-layout-active="false"[^}]*filter:grayscale\(1\)!important[^}]*opacity:\.55!important/);
  assert.match(buildThemeGameLayoutStyleText(), /data-ad-ext-game-layout-active="false"[^}]*grid-template-columns:minmax\(0,1fr\) minmax\(110px,\.35fr\) 34px!important[^}]*transform:none!important/);
  assert.match(buildThemeGameLayoutStyleText(), /data-ad-ext-game-layout-name-region="true"[^}]*zoom:\.84/);
  assert.match(
    buildThemeGameLayoutStyleText(),
    /data-ad-ext-game-layout-leg-starter="true"[^}]*content:"START"[^}]*border-radius:999px!important/
  );
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

  const wideShort = calculateBoardFocusLayout({
    width: 1920,
    height: 808,
    playerCount: 3,
    activeIndex: 0,
  });
  assert.equal(Math.round(wideShort.railWidth), 806);
  assert.equal(Math.round(wideShort.boardSize), 792);

  const ultrawideShort = calculateBoardFocusLayout({
    width: 2560,
    height: 808,
    playerCount: 3,
    activeIndex: 0,
  });
  assert.equal(ultrawideShort.railWidth, GAME_LAYOUT_RAIL_MAX_WIDTH);
  assert.equal(Math.round(ultrawideShort.boardSize), 792);

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

test("board-focus ignores hit-effect layers when protecting native correction icons", () => {
  const styleText = buildThemeGameLayoutStyleText();

  assert.match(
    styleText,
    /game-layout-turn-slot="true"[^}]*span\[aria-hidden="true"\][^}]*animation:none!important;[^}]*transition:none!important/
  );
  assert.match(
    styleText,
    /:has\(>span\[aria-hidden="true"\]:not\(\.opacity-0\)>svg\)::before[^}]*opacity:0!important/
  );
  assert.match(
    styleText,
    /:has\(>span\[aria-hidden="true"\]:not\(\.opacity-0\)>svg\)>span:not\(\[aria-hidden="true"\]\)[^}]*opacity:0!important/
  );
  assert.doesNotMatch(
    styleText,
    /:has\(>span\[aria-hidden="true"\]:not\(\.opacity-0\)\)::before/
  );
});

test("board-focus keeps highlighted and regular throw values at the same font size", () => {
  const styleText = buildThemeGameLayoutStyleText();

  assert.match(
    styleText,
    /bg-surface-surface>:first-child>\*\[data-ad-ext-hit-kind\]:not\(\.text-checkout-suggestion,\.text-checkout-setup\)::before\{[^}]*font-size:var\(--ad-game-layout-turn-value-font-size\)!important/
  );
});

test("board-focus keeps enhanced scoring captions small in every thrown slot", () => {
  const css = buildThemeGameLayoutStyleText();
  assert.match(
    css,
    /:root:has\(#ad-ext_style_enhanced-scoring-display\)[^{}]*>\.font-number\.cursor-pointer>span:not\(\[aria-hidden="true"\]\) \*\{[^}]*font-size:1rem!important;[^}]*line-height:1!important;/
  );
  assert.doesNotMatch(css, /cursor-pointer[^{}]*nth-child/);
  assert.match(css, /font-size:var\(--ad-game-layout-turn-value-font-size\)!important/);
});

test("game-layout self-correction fits text and avoids occupied header space", () => {
  assert.equal(calculateFittedFontSize({
    preferredFontSize: 36,
    minimumFontSize: 14,
    availableWidth: 240,
    availableHeight: 24,
    contentWidth: 320,
    contentHeight: 32,
  }), 27);
  assert.equal(calculateFittedFontSize({
    preferredFontSize: 36,
    minimumFontSize: 14,
    availableWidth: 400,
    availableHeight: 40,
    contentWidth: 320,
    contentHeight: 32,
  }), 36);
  assert.deepEqual(calculateClearRailRange({
    railLeft: 16,
    railWidth: 806,
    railTop: 16,
    railBottom: 38,
    gap: 12,
    obstacles: [
      { left: 16, right: 74, top: 12, bottom: 44 },
      { left: 1800, right: 1840, top: 12, bottom: 44 },
    ],
  }), { left: 86, width: 736 });

  const fixture = createLayoutFixture({ width: 1920, height: 808, playerCount: 1 });
  const nameNode = fixture.players[0].nameRegion.querySelector(".font-display");
  let availableWidth = 320;
  let plateHeight = 52;
  Object.defineProperties(nameNode, {
    clientWidth: { get: () => availableWidth },
    scrollWidth: { get: () => 320 },
    scrollHeight: { get: () => 32 },
  });
  [
    fixture.players[0].nameRegion,
    fixture.players[0].nameContainer,
    fixture.players[0].nameRow,
    fixture.players[0].namePlate,
  ].forEach((node) => {
    Object.defineProperty(node, "clientHeight", { get: () => plateHeight });
  });
  fixture.windowRef.getComputedStyle = (node) => node === nameNode
    ? { fontSize: "36px" }
    : { paddingTop: "4px", paddingBottom: "4px" };
  fixture.header.__rect = { left: 16, top: 16, width: 806, height: 22 };
  fixture.documentRef.querySelectorAll("button").forEach((button) => {
    button.__rect = { left: 900, top: 300, width: 100, height: 40 };
  });
  const nativeHeader = fixture.documentRef.createElement("header");
  const exitButton = fixture.documentRef.createElement("button");
  exitButton.__rect = { left: 16, top: 12, width: 58, height: 32 };
  nativeHeader.appendChild(exitButton);
  fixture.documentRef.body.appendChild(nativeHeader);
  fixture.documentRef.fonts = new FakeEventTarget();
  const config = createRuntimeConfig({
    featureToggles: { "themes.gameLayout": true },
    features: { themes: { gameLayout: { enabled: true } } },
  });
  const cleanup = mountThemeGameLayout(mountContext(config, fixture));

  assert.equal(
    fixture.players[0].nameContainer.getAttribute("data-ad-ext-game-layout-name-container"),
    "true"
  );
  assert.equal(
    fixture.players[0].namePlate.getAttribute("data-ad-ext-game-layout-name-plate"),
    "true"
  );
  assert.equal(
    fixture.players[0].nameRegion.style.getPropertyValue("--ad-game-layout-name-font-size"),
    ""
  );
  assert.equal(
    fixture.header.style.getPropertyValue("--ad-game-layout-variant-left"),
    "86px"
  );
  assert.equal(
    fixture.header.style.getPropertyValue("--ad-game-layout-variant-width"),
    "736.4px"
  );

  availableWidth = 240;
  plateHeight = 32;
  fixture.documentRef.fonts.dispatchEvent(new FakeEvent("loadingdone"));
  assert.equal(
    fixture.players[0].nameRegion.style.getPropertyValue("--ad-game-layout-name-font-size"),
    "27px"
  );

  availableWidth = 320;
  plateHeight = 52;
  fixture.documentRef.fonts.dispatchEvent(new FakeEvent("loadingdone"));
  assert.equal(
    fixture.players[0].nameRegion.style.getPropertyValue("--ad-game-layout-name-font-size"),
    ""
  );

  cleanup();
  assert.equal(
    fixture.players[0].nameContainer.getAttribute("data-ad-ext-game-layout-name-container"),
    null
  );
  assert.equal(fixture.players[0].namePlate.getAttribute("data-ad-ext-game-layout-name-plate"), null);
  assert.equal(fixture.header.style.getPropertyValue("--ad-game-layout-variant-left"), "");
  assert.equal(fixture.header.style.getPropertyValue("--ad-game-layout-variant-width"), "");
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

test("board-focus keeps an active-first player pinned while scrolling inactive rows", () => {
  const metrics = calculateBoardFocusLayout({
    width: 1536,
    height: 808,
    playerCount: 24,
    activeIndex: 0,
    firstVisibleIndex: 3,
    pinActiveAtStart: true,
  });
  assert.equal(metrics.overflow, true);
  assert.equal(metrics.pinActiveAtStart, true);
  assert.equal(metrics.firstVisibleIndex, 3);
  assert.ok(metrics.visiblePlayerCount > 1);
});

test("game-layout rotates the active player to the top and keeps the leg starter badge attached to the seat", () => {
  const fixture = createLayoutFixture({ playerCount: 3, activeIndex: 1 });
  const originalParents = fixture.players.map((player) => player.item.parentElement);
  const gameState = createGameStateHarness({
    match: {
      players: [
        { index: 0, name: "PLAYER 1" },
        { index: 1, name: "PLAYER 2" },
        { index: 2, name: "PLAYER 3" },
      ],
    },
  });
  const config = createRuntimeConfig({
    featureToggles: { "themes.gameLayout": true },
    features: {
      themes: {
        gameLayout: {
          enabled: true,
          playerOrder: "active-first",
          showLegStarter: true,
        },
      },
    },
  });
  const cleanup = mountThemeGameLayout(mountContext(config, fixture, gameState));

  assert.equal(fixture.players[1].item.style.getPropertyValue("--ad-game-layout-player-y"), "176px");
  assert.equal(fixture.players[2].item.style.getPropertyValue("--ad-game-layout-player-y"), "346px");
  assert.equal(fixture.players[0].item.style.getPropertyValue("--ad-game-layout-player-y"), "452px");
  assert.equal(
    fixture.players[0].nameRegion.getAttribute("data-ad-ext-game-layout-leg-starter"),
    "true"
  );
  assert.equal(
    fixture.players[1].nameRegion.getAttribute("data-ad-ext-game-layout-leg-starter"),
    null
  );
  assert.deepEqual(fixture.players.map((player) => player.item.parentElement), originalParents);

  setActivePlayer(fixture, 2);
  fixture.windowRef.dispatchEvent(new FakeEvent("resize"));
  assert.equal(fixture.players[2].item.style.getPropertyValue("--ad-game-layout-player-y"), "176px");
  assert.equal(fixture.players[0].item.style.getPropertyValue("--ad-game-layout-player-y"), "346px");
  assert.equal(fixture.players[1].item.style.getPropertyValue("--ad-game-layout-player-y"), "452px");
  assert.equal(
    fixture.players[0].nameRegion.getAttribute("data-ad-ext-game-layout-leg-starter"),
    "true"
  );

  gameState.setSnapshot({
    match: {
      players: [
        { index: 1, name: "PLAYER 2" },
        { index: 2, name: "PLAYER 3" },
        { index: 0, name: "PLAYER 1" },
      ],
    },
  });
  assert.equal(
    fixture.players[0].nameRegion.getAttribute("data-ad-ext-game-layout-leg-starter"),
    null
  );
  assert.equal(
    fixture.players[1].nameRegion.getAttribute("data-ad-ext-game-layout-leg-starter"),
    "true"
  );

  cleanup();
  fixture.players.forEach((player) => {
    assert.equal(
      player.nameRegion.getAttribute("data-ad-ext-game-layout-leg-starter"),
      null
    );
  });
  assert.deepEqual(fixture.players.map((player) => player.item.parentElement), originalParents);
});

test("game-layout active-first overflow keeps the active player visible while inactive rows scroll", () => {
  const fixture = createLayoutFixture({ playerCount: 8, activeIndex: 7 });
  const config = createRuntimeConfig({
    featureToggles: { "themes.gameLayout": true },
    features: {
      themes: {
        gameLayout: {
          enabled: true,
          playerOrder: "active-first",
          showLegStarter: false,
        },
      },
    },
  });
  const cleanup = mountThemeGameLayout(mountContext(config, fixture));

  assert.equal(fixture.players[7].item.getAttribute("data-ad-ext-game-layout-visible"), "true");
  assert.equal(fixture.players[7].item.style.getPropertyValue("--ad-game-layout-player-y"), "176px");
  assert.equal(fixture.players[0].item.getAttribute("data-ad-ext-game-layout-visible"), "true");

  const wheel = new FakeEvent("wheel", { bubbles: false, cancelable: true });
  wheel.deltaY = 120;
  wheel.clientX = 100;
  wheel.clientY = 300;
  fixture.root.dispatchEvent(wheel);

  assert.equal(wheel.defaultPrevented, true);
  assert.equal(fixture.players[7].item.getAttribute("data-ad-ext-game-layout-visible"), "true");
  assert.equal(fixture.players[7].item.style.getPropertyValue("--ad-game-layout-player-y"), "176px");
  assert.equal(fixture.players[0].item.getAttribute("data-ad-ext-game-layout-visible"), "false");
  assert.equal(fixture.players[1].item.getAttribute("data-ad-ext-game-layout-visible"), "true");

  cleanup();
});

test("game-layout follows the visual viewport when the native height chain is stale", () => {
  const fixture = createLayoutFixture({ width: 1920, height: 804, playerCount: 1 });
  fixture.windowRef.innerHeight = 953;
  fixture.windowRef.visualViewport = new FakeEventTarget();
  fixture.windowRef.visualViewport.height = 953;
  const config = createRuntimeConfig({
    featureToggles: { "themes.gameLayout": true },
    features: { themes: { gameLayout: { enabled: true } } },
  });
  const cleanup = mountThemeGameLayout(mountContext(config, fixture));

  assert.match(
    buildThemeGameLayoutStyleText(),
    /height:var\(--visual-viewport-height,100dvh\)!important/
  );
  assert.equal(fixture.root.style.getPropertyValue("--ad-game-layout-board-size"), "937px");

  fixture.windowRef.visualViewport.height = 808;
  fixture.windowRef.visualViewport.dispatchEvent(new FakeEvent("resize"));
  assert.equal(fixture.root.style.getPropertyValue("--ad-game-layout-board-size"), "792px");

  cleanup();
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
  assert.equal(surface.players[0].nameNode, fixture.players[0].nameRegion.querySelector(".font-display"));
  assert.equal(surface.players[0].nameContainerNode, fixture.players[0].nameContainer);
  assert.equal(surface.players[0].namePlateNode, fixture.players[0].namePlate);
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
  assert.equal(fixture.root.style.getPropertyValue("--ad-game-layout-board-size"), "792px");
  assert.equal(fixture.players[0].item.getAttribute("data-ad-ext-game-layout-active"), "false");
  assert.equal(fixture.players[7].item.getAttribute("data-ad-ext-game-layout-active"), "true");
  assert.equal(fixture.players[7].score.getAttribute("data-ad-ext-game-layout-score-value"), "true");
  assert.equal(fixture.players[7].legs.getAttribute("data-ad-ext-game-layout-legs"), "true");
  assert.equal(fixture.players[0].item.style.getPropertyValue("--ad-game-layout-player-y"), "176px");
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
  assert.equal(fixture.root.style.getPropertyValue("--ad-game-layout-board-size"), "");
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

test("game-layout reveals idle controls for five seconds after the last mouse movement", () => {
  const fixture = createLayoutFixture();
  const timers = createFakeTimerHarness();
  timers.installOnWindow(fixture.windowRef);
  const config = createRuntimeConfig({
    featureToggles: { "themes.gameLayout": true },
    features: { themes: { gameLayout: { enabled: true } } },
  });
  const cleanup = mountThemeGameLayout(mountContext(config, fixture));
  const visible = () => fixture.controlBar.getAttribute("data-ad-ext-game-layout-controls-visible");
  const removedControlAttributes = [];
  const removeAttribute = fixture.controlBar.removeAttribute.bind(fixture.controlBar);
  fixture.controlBar.removeAttribute = (name) => {
    removedControlAttributes.push(name);
    removeAttribute(name);
  };
  assert.match(buildThemeGameLayoutStyleText(), /data-ad-ext-game-layout-control-bar="true"[^}]*opacity:\.05!important/);
  assert.match(buildThemeGameLayoutStyleText(), /data-ad-ext-game-layout-controls-visible="true"[^}]*opacity:1!important/);
  assert.equal(visible(), null);
  fixture.documentRef.dispatchEvent(new FakeEvent("mousemove"));
  assert.equal(visible(), "true");
  timers.advance(4000);
  fixture.documentRef.dispatchEvent(new FakeEvent("mousemove"));
  timers.advance(1000);
  assert.equal(visible(), "true");
  fixture.windowRef.dispatchEvent(new FakeEvent("resize"));
  assert.equal(visible(), "true");
  assert.deepEqual(removedControlAttributes, [], "layout updates must not interrupt the opacity transition");
  timers.advance(3999);
  assert.equal(visible(), "true");
  timers.advance(1);
  assert.equal(visible(), null);
  removedControlAttributes.length = 0;
  for (let index = 0; index < 10; index += 1) {
    fixture.windowRef.dispatchEvent(new FakeEvent("resize"));
    timers.advance(16);
  }
  assert.deepEqual(removedControlAttributes, [], "idle layout updates must preserve the dimmed control bar");
  fixture.documentRef.dispatchEvent(new FakeEvent("mousemove"));
  fixture.root.__rect.width = 1000;
  fixture.windowRef.dispatchEvent(new FakeEvent("resize"));
  assert.equal(visible(), null);
  fixture.root.__rect.width = 1536;
  fixture.windowRef.dispatchEvent(new FakeEvent("resize"));
  assert.equal(visible(), null);
  fixture.documentRef.dispatchEvent(new FakeEvent("mousemove"));
  cleanup();
  assert.equal(visible(), null);
  fixture.documentRef.dispatchEvent(new FakeEvent("mousemove"));
  timers.advance(5000);
  assert.equal(visible(), null);
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


test("leg starter rejects missing and internally inconsistent seat indices", () => {
  assert.equal(
    resolveLegStarterSeat({
      match: {
        players: [
          { index: null, name: "A" },
          { index: 1, name: "B" },
        ],
      },
    }, 2),
    null
  );
  assert.equal(
    resolveLegStarterSeat({
      match: {
        players: [
          { index: "", name: "A" },
          { index: 1, name: "B" },
        ],
      },
    }, 2),
    null
  );
  assert.equal(
    resolveLegStarterSeat({
      match: {
        players: [
          { index: 0, name: "A" },
          { index: 0, name: "B" },
        ],
      },
    }, 2),
    null
  );
});

test("leg starter rejects a stale match snapshot that does not match visible player seats", () => {
  const fixture = createLayoutFixture({ playerCount: 3, activeIndex: 0 });
  const gameState = createGameStateHarness({
    match: {
      players: [
        { index: 0, name: "OLD PLAYER A" },
        { index: 1, name: "OLD PLAYER B" },
        { index: 2, name: "OLD PLAYER C" },
      ],
    },
  });
  const config = createRuntimeConfig({
    featureToggles: { "themes.gameLayout": true },
    features: {
      themes: {
        gameLayout: {
          enabled: true,
          playerOrder: "active-first",
          showLegStarter: true,
        },
      },
    },
  });

  const cleanup = mountThemeGameLayout(mountContext(config, fixture, gameState));

  fixture.players.forEach((player) => {
    assert.equal(
      player.nameRegion.getAttribute("data-ad-ext-game-layout-leg-starter"),
      null
    );
  });

  cleanup();
});

test("ambiguous active markers use neutral geometry without overflowing the player viewport", () => {
  const fixture = createLayoutFixture({ playerCount: 8, activeIndex: 0 });
  fixture.players[1].card.classList.remove("bg-black-80");
  fixture.players[1].card.classList.add("bg-raspberry-slush-diagonal");

  const config = createRuntimeConfig({
    featureToggles: { "themes.gameLayout": true },
    features: {
      themes: {
        gameLayout: {
          enabled: true,
          playerOrder: "active-first",
          showLegStarter: false,
        },
      },
    },
  });
  const cleanup = mountThemeGameLayout(mountContext(config, fixture));

  const visible = fixture.players.filter(
    (player) => player.item.getAttribute("data-ad-ext-game-layout-visible") === "true"
  );
  const maxBottom = Math.max(...visible.map((player) => {
    const y = Number.parseFloat(player.item.style.getPropertyValue("--ad-game-layout-player-y"));
    const height = Number.parseFloat(
      player.item.style.getPropertyValue("--ad-game-layout-card-height")
    );
    return y + height;
  }));
  const playerViewportBottom = 16 + 144 + 16 + (808 - 32 - 144 - 16);

  assert.ok(maxBottom <= playerViewportBottom + 0.001);
  visible.forEach((player) => {
    assert.equal(player.item.getAttribute("data-ad-ext-game-layout-active"), "true");
  });

  cleanup();
});


test("active-first player changes use one FLIP motion for position and resize without reparenting", () => {
  const fixture = createLayoutFixture({ playerCount: 3, activeIndex: 0 });
  const gameState = createGameStateHarness({});
  const originalParents = fixture.players.map((player) => player.item.parentElement);
  const config = createRuntimeConfig({
    featureToggles: { "themes.gameLayout": true },
    features: {
      themes: {
        gameLayout: {
          enabled: true,
          playerOrder: "active-first",
          showLegStarter: false,
        },
      },
    },
  });
  const cleanup = mountThemeGameLayout(mountContext(config, fixture, gameState));

  fixture.players.forEach((player) => {
    assert.equal(player.item.__animations.length, 0, "initial mount must not animate");
  });

  setActivePlayer(fixture, 1);
  gameState.setSnapshot({ turn: 1 });

  const incoming = fixture.players[1].item.__lastAnimation;
  const outgoing = fixture.players[0].item.__lastAnimation;
  const shifted = fixture.players[2].item.__lastAnimation;
  assert.ok(incoming);
  assert.ok(outgoing);
  assert.ok(shifted);
  assert.equal(incoming.options.duration, GAME_LAYOUT_PLAYER_TRANSITION_DURATION_MS);
  assert.equal(incoming.options.easing, "cubic-bezier(0.22, 1, 0.36, 1)");
  assert.match(incoming.keyframes[0].transform, /translate3d\(/);
  assert.match(incoming.keyframes[0].transform, /scale\(/);
  assert.notEqual(incoming.keyframes[0].transform, incoming.keyframes[1].transform);
  assert.equal(incoming.keyframes[1].transform, "translate3d(0px, 0px, 0) scale(1, 1)");
  assert.deepEqual(fixture.players.map((player) => player.item.parentElement), originalParents);
  fixture.players.forEach((player) => {
    assert.equal(player.item.getAttribute("data-ad-ext-game-layout-visible"), "true");
  });

  cleanup();
  fixture.players.forEach((player) => {
    assert.equal(player.item.getAttribute("data-ad-ext-game-layout-transitioning"), null);
  });
  assert.deepEqual(fixture.players.map((player) => player.item.parentElement), originalParents);
});

test("a fast A to B to C change cancels the old FLIP and retargets without stacking animations", () => {
  const fixture = createLayoutFixture({ playerCount: 3, activeIndex: 0 });
  const gameState = createGameStateHarness({});
  const config = createRuntimeConfig({
    featureToggles: { "themes.gameLayout": true },
    features: {
      themes: {
        gameLayout: {
          enabled: true,
          playerOrder: "active-first",
          showLegStarter: false,
        },
      },
    },
  });
  const cleanup = mountThemeGameLayout(mountContext(config, fixture, gameState));

  setActivePlayer(fixture, 1);
  gameState.setSnapshot({ turn: 1 });
  const firstAnimation = fixture.players[1].item.__lastAnimation;
  assert.equal(firstAnimation.playState, "running");

  gameState.setSnapshot({ turn: 1, scoreUpdate: true });
  assert.equal(firstAnimation.playState, "running");
  assert.equal(fixture.players[1].item.__lastAnimation, firstAnimation);

  setActivePlayer(fixture, 2);
  gameState.setSnapshot({ turn: 2 });
  const retargetedAnimation = fixture.players[2].item.__lastAnimation;

  assert.equal(firstAnimation.playState, "idle");
  assert.ok(retargetedAnimation);
  assert.equal(retargetedAnimation.playState, "running");
  assert.equal(fixture.players[2].item.style.getPropertyValue("--ad-game-layout-player-y"), "176px");

  cleanup();
});

test("fixed mode and ambiguous active state do not run player FLIP animations", () => {
  const fixedFixture = createLayoutFixture({ playerCount: 3, activeIndex: 0 });
  const fixedGameState = createGameStateHarness({});
  const fixedConfig = createRuntimeConfig({
    featureToggles: { "themes.gameLayout": true },
    features: {
      themes: {
        gameLayout: {
          enabled: true,
          playerOrder: "fixed",
          playerTransitionEffect: "lane-flip",
        },
      },
    },
  });
  const fixedCleanup = mountThemeGameLayout(
    mountContext(fixedConfig, fixedFixture, fixedGameState)
  );
  setActivePlayer(fixedFixture, 1);
  fixedGameState.setSnapshot({ turn: 1 });
  fixedFixture.players.forEach((player) => assert.equal(player.item.__animations.length, 0));
  fixedCleanup();

  const ambiguousFixture = createLayoutFixture({ playerCount: 3, activeIndex: 0 });
  const ambiguousGameState = createGameStateHarness({});
  const activeConfig = createRuntimeConfig({
    featureToggles: { "themes.gameLayout": true },
    features: {
      themes: {
        gameLayout: {
          enabled: true,
          playerOrder: "active-first",
          playerTransitionEffect: "lane-flip",
        },
      },
    },
  });
  const ambiguousCleanup = mountThemeGameLayout(
    mountContext(activeConfig, ambiguousFixture, ambiguousGameState)
  );
  setActivePlayer(ambiguousFixture, -1);
  ambiguousGameState.setSnapshot({ turn: 1 });
  setActivePlayer(ambiguousFixture, 1);
  ambiguousGameState.setSnapshot({ turn: 2 });
  ambiguousFixture.players.forEach((player) => assert.equal(player.item.__animations.length, 0));
  ambiguousCleanup();

});

test("all configured player transition effects run when reduced motion is preferred", () => {
  const effects = [
    ["flip-resize", 340],
    ["smooth-flip", 460],
    ["lane-flip", 380],
  ];

  effects.forEach(([effect, expectedDuration]) => {
    const fixture = createLayoutFixture({ playerCount: 3, activeIndex: 0 });
    fixture.windowRef.matchMedia = () => ({ matches: true });
    const gameState = createGameStateHarness({});
    const config = createRuntimeConfig({
      featureToggles: { "themes.gameLayout": true },
      features: {
        themes: {
          gameLayout: {
            enabled: true,
            playerOrder: "active-first",
            playerTransitionEffect: effect,
          },
        },
      },
    });
    const cleanup = mountThemeGameLayout(mountContext(config, fixture, gameState));

    setActivePlayer(fixture, 1);
    gameState.setSnapshot({ turn: 1 });

    const animation = fixture.players[1].item.__lastAnimation;
    assert.ok(animation, `${effect} must run after an explicit selection`);
    assert.equal(animation.options.duration, expectedDuration);
    assert.equal(
      fixture.players[1].item.getAttribute("data-ad-ext-game-layout-transition-effect"),
      effect
    );

    cleanup();
  });
});

test("switching away from active-first or disabling the feature cancels an in-flight FLIP cleanly", () => {
  const fixture = createLayoutFixture({ playerCount: 3, activeIndex: 0 });
  const gameState = createGameStateHarness({});
  const config = createRuntimeConfig({
    featureToggles: { "themes.gameLayout": true },
    features: {
      themes: {
        gameLayout: { enabled: true, playerOrder: "active-first" },
      },
    },
  });
  const cleanup = mountThemeGameLayout(mountContext(config, fixture, gameState));

  setActivePlayer(fixture, 1);
  gameState.setSnapshot({ turn: 1 });
  const running = fixture.players[1].item.__lastAnimation;
  assert.equal(running.playState, "running");

  config.update({ features: { themes: { gameLayout: { playerOrder: "fixed" } } } });
  gameState.setSnapshot({ turn: 2 });
  assert.equal(running.playState, "idle");
  fixture.players.forEach((player, index) => {
    const y = Number.parseFloat(player.item.style.getPropertyValue("--ad-game-layout-player-y"));
    if (index > 0) {
      const previousY = Number.parseFloat(
        fixture.players[index - 1].item.style.getPropertyValue("--ad-game-layout-player-y")
      );
      assert.ok(y > previousY);
    }
  });

  config.update({ features: { themes: { gameLayout: { enabled: false } } } });
  gameState.setSnapshot({ turn: 3 });
  assert.equal(fixture.documentRef.getElementById(STYLE_ID), null);
  fixture.players.forEach((player) => {
    assert.equal(player.item.getAttribute("data-ad-ext-game-layout-transitioning"), null);
  });

  cleanup();
});

test("replaced player cards and overflow visibility changes fall back to a direct safe layout update", () => {
  const fixture = createLayoutFixture({ playerCount: 8, activeIndex: 0 });
  const gameState = createGameStateHarness({});
  const config = createRuntimeConfig({
    featureToggles: { "themes.gameLayout": true },
    features: {
      themes: {
        gameLayout: { enabled: true, playerOrder: "active-first" },
      },
    },
  });
  const cleanup = mountThemeGameLayout(mountContext(config, fixture, gameState));

  const replaced = fixture.players[1];
  const replacementParent = replaced.item.parentElement;
  replaced.item.remove();
  const replacement = createPlayerCard(fixture, replacementParent, 1, false);
  fixture.players[1] = replacement;
  setActivePlayer(fixture, 1);
  gameState.setSnapshot({ turn: 1 });

  assert.equal(replacement.item.__animations.length, 0);
  assert.equal(replacement.item.style.getPropertyValue("--ad-game-layout-player-y"), "176px");

  setActivePlayer(fixture, 7);
  gameState.setSnapshot({ turn: 2 });
  const visiblePlayers = fixture.players.filter(
    (player) => player.item.getAttribute("data-ad-ext-game-layout-visible") === "true"
  );
  assert.ok(visiblePlayers.length < fixture.players.length);
  assert.equal(fixture.players[7].item.style.getPropertyValue("--ad-game-layout-player-y"), "176px");

  cleanup();
});


test("a WAAPI failure falls back to the correct final player layout without leaking markers", () => {
  const fixture = createLayoutFixture({ playerCount: 3, activeIndex: 0 });
  const gameState = createGameStateHarness({});
  const config = createRuntimeConfig({
    featureToggles: { "themes.gameLayout": true },
    features: {
      themes: {
        gameLayout: { enabled: true, playerOrder: "active-first" },
      },
    },
  });
  const cleanup = mountThemeGameLayout(mountContext(config, fixture, gameState));

  fixture.players[1].item.animate = () => {
    throw new Error("simulated detached-animation failure");
  };
  setActivePlayer(fixture, 1);

  assert.doesNotThrow(() => gameState.setSnapshot({ turn: 1 }));
  assert.equal(fixture.players[1].item.style.getPropertyValue("--ad-game-layout-player-y"), "176px");
  fixture.players.forEach((player) => {
    assert.equal(player.item.getAttribute("data-ad-ext-game-layout-transitioning"), null);
  });

  cleanup();
});


test("game-layout transition profiles produce distinct motion contracts", () => {
  const common = {
    dx: 0,
    dy: -276,
    scaleX: 1,
    scaleY: 0.6,
  };
  const standard = buildGameLayoutPlayerTransitionKeyframes({
    ...common,
    effect: "flip-resize",
    movingDown: true,
  });
  const smooth = buildGameLayoutPlayerTransitionKeyframes({
    ...common,
    effect: "smooth-flip",
    movingDown: true,
  });
  const laneUp = buildGameLayoutPlayerTransitionKeyframes({
    ...common,
    effect: "lane-flip",
    movingDown: false,
  });
  const laneDown = buildGameLayoutPlayerTransitionKeyframes({
    ...common,
    effect: "lane-flip",
    movingDown: true,
  });

  assert.equal(standard.length, 2);
  assert.equal(smooth.length, 2);
  assert.deepEqual(smooth, standard, "smooth profile changes timing, not geometry");
  assert.equal(laneUp.length, 2);
  assert.equal(laneDown.length, 3);
  assert.equal(laneDown[1].offset, 0.56);
  assert.match(laneDown[1].transform, /translate3d\(-12px,/);
  assert.equal(laneDown.at(-1).transform, "translate3d(0px, 0px, 0) scale(1, 1)");
});

test("configured smooth FLIP uses its own duration and easing", () => {
  const fixture = createLayoutFixture({ playerCount: 3, activeIndex: 0 });
  const gameState = createGameStateHarness({});
  const config = createRuntimeConfig({
    featureToggles: { "themes.gameLayout": true },
    features: {
      themes: {
        gameLayout: {
          enabled: true,
          playerOrder: "active-first",
          playerTransitionEffect: "smooth-flip",
        },
      },
    },
  });
  const cleanup = mountThemeGameLayout(mountContext(config, fixture, gameState));

  setActivePlayer(fixture, 1);
  gameState.setSnapshot({ turn: 1 });

  const animation = fixture.players[1].item.__lastAnimation;
  assert.ok(animation);
  assert.equal(animation.options.duration, 460);
  assert.equal(animation.options.easing, "cubic-bezier(0.4, 0, 0.2, 1)");
  assert.equal(
    fixture.players[1].item.getAttribute("data-ad-ext-game-layout-transition-effect"),
    "smooth-flip"
  );

  cleanup();
});

test("changing transition effect during a running game cancels stale motion and uses the new profile next", () => {
  const fixture = createLayoutFixture({ playerCount: 3, activeIndex: 0 });
  const gameState = createGameStateHarness({});
  const config = createRuntimeConfig({
    featureToggles: { "themes.gameLayout": true },
    features: {
      themes: {
        gameLayout: {
          enabled: true,
          playerOrder: "active-first",
          playerTransitionEffect: "smooth-flip",
        },
      },
    },
  });
  const cleanup = mountThemeGameLayout(mountContext(config, fixture, gameState));

  setActivePlayer(fixture, 1);
  gameState.setSnapshot({ turn: 1 });
  const staleAnimation = fixture.players[1].item.__lastAnimation;
  assert.equal(staleAnimation.playState, "running");

  config.update({
    features: {
      themes: {
        gameLayout: {
          playerTransitionEffect: "lane-flip",
        },
      },
    },
  });
  gameState.setSnapshot({ turn: 1, settingsChanged: true });
  assert.equal(staleAnimation.playState, "idle");
  fixture.players.forEach((player) => {
    assert.equal(player.item.getAttribute("data-ad-ext-game-layout-transitioning"), null);
    assert.equal(player.item.getAttribute("data-ad-ext-game-layout-transition-effect"), null);
  });

  setActivePlayer(fixture, 2);
  gameState.setSnapshot({ turn: 2 });

  const incoming = fixture.players[2].item.__lastAnimation;
  const outgoing = fixture.players[1].item.__lastAnimation;
  assert.ok(incoming);
  assert.ok(outgoing);
  assert.equal(incoming.options.duration, 380);
  assert.equal(incoming.options.easing, "cubic-bezier(0.22, 1, 0.36, 1)");
  assert.equal(outgoing.keyframes.length, 3);
  assert.match(outgoing.keyframes[1].transform, /translate3d\(-12px,/);

  cleanup();
});


test("game-layout transition layer prioritizes the incoming active card at crossings", () => {
  const css = buildThemeGameLayoutStyleText();
  assert.match(
    css,
    /data-ad-ext-game-layout-transitioning="true"\]\[data-ad-ext-game-layout-active="true"\][^{]*\{[^}]*z-index:22!important/
  );
});


test("resize and React card replacement abort in-flight transitions without stale animation state", () => {
  const fixture = createLayoutFixture({ playerCount: 3, activeIndex: 0 });
  const gameState = createGameStateHarness({});
  const config = createRuntimeConfig({
    featureToggles: { "themes.gameLayout": true },
    features: {
      themes: {
        gameLayout: {
          enabled: true,
          playerOrder: "active-first",
          playerTransitionEffect: "lane-flip",
        },
      },
    },
  });
  const cleanup = mountThemeGameLayout(mountContext(config, fixture, gameState));

  setActivePlayer(fixture, 1);
  gameState.setSnapshot({ turn: 1 });
  const resizeAnimation = fixture.players[1].item.__lastAnimation;
  assert.equal(resizeAnimation.playState, "running");

  fixture.windowRef.dispatchEvent(new FakeEvent("resize"));
  assert.equal(resizeAnimation.playState, "idle");
  assert.equal(fixture.players[1].item.style.getPropertyValue("--ad-game-layout-player-y"), "176px");
  fixture.players.forEach((player) => {
    assert.equal(player.item.getAttribute("data-ad-ext-game-layout-transitioning"), null);
  });

  setActivePlayer(fixture, 2);
  gameState.setSnapshot({ turn: 2 });
  const detachedItem = fixture.players[0].item;
  const detachedAnimation = detachedItem.__lastAnimation;
  assert.equal(detachedAnimation.playState, "running");

  const replacementParent = detachedItem.parentElement;
  detachedItem.remove();
  fixture.players[0] = createPlayerCard(fixture, replacementParent, 0, false);
  gameState.setSnapshot({ turn: 2, domRebuilt: true });

  assert.equal(detachedAnimation.playState, "idle");
  assert.equal(detachedItem.getAttribute("data-ad-ext-game-layout-transitioning"), null);
  assert.equal(fixture.players[0].item.__animations.length, 0);
  assert.equal(fixture.players[2].item.style.getPropertyValue("--ad-game-layout-player-y"), "176px");

  cleanup();
});
