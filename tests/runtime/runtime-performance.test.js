import test from "node:test";
import assert from "node:assert/strict";

import { createDomGuards } from "../../src/core/dom-guards.js";
import { createEventBus } from "../../src/core/event-bus.js";
import { createGameStateStore } from "../../src/core/game-state-store.js";
import { createObserverRegistry } from "../../src/core/observer-registry.js";
import { createListenerRegistry } from "../../src/core/listener-registry.js";
import { initializeCheckoutBoardTargets } from "../../src/features/checkout-board-targets/index.js";
import { initializeCricketHighlighter } from "../../src/features/cricket-highlighter/index.js";
import { OVERLAY_ID as CHECKOUT_OVERLAY_ID } from "../../src/features/checkout-board-targets/style.js";
import { OVERLAY_ID as CRICKET_OVERLAY_ID } from "../../src/features/cricket-highlighter/style.js";
import { initializeRemoveDartsNotification } from "../../src/features/remove-darts-notification/index.js";
import { initializeTurnPointsCount } from "../../src/features/turn-points-count/index.js";
import * as cricketRules from "../../src/domain/cricket-rules.js";
import * as variantRules from "../../src/domain/variant-rules.js";
import {
  FakeDocument,
  FakeMessageEvent,
  FakeWebSocket,
  createFakeWindow,
} from "./fake-dom.js";

function wait(ms = 0) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createCountingSchedulerFactory(counterRef) {
  return () => ({
    schedule() {
      counterRef.count += 1;
    },
    cancel() {},
    isScheduled() {
      return false;
    },
  });
}

test("checkout-board-targets ignores self-managed overlay mutations", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  const domGuards = createDomGuards({ documentRef });
  const observerRegistry = createObserverRegistry();
  const scheduleCounter = { count: 0 };

  const cleanup = initializeCheckoutBoardTargets({
    documentRef,
    windowRef,
    domGuards,
    registries: {
      observers: observerRegistry,
    },
    gameState: {
      isX01Variant: () => true,
      subscribe() {
        return () => {};
      },
    },
    domain: {
      x01Rules: {
        parseCheckoutTargetsFromSuggestion: () => [],
      },
      variantRules: {
        isX01VariantText: () => true,
      },
    },
    config: {
      getFeatureConfig() {
        return {
          effect: "pulse",
          targetScope: "first",
          singleRing: "both",
          colorTheme: "violet",
          outlineIntensity: "standard",
        };
      },
    },
    helpers: {
      createRafScheduler: createCountingSchedulerFactory(scheduleCounter),
    },
  });

  assert.equal(scheduleCounter.count, 1);

  const observer = observerRegistry.get("checkout-board-targets:dom-observer");
  assert.ok(observer);

  const managedOverlay = documentRef.createElement("div");
  managedOverlay.id = CHECKOUT_OVERLAY_ID;

  observer.callback([
    {
      type: "childList",
      target: documentRef.main,
      addedNodes: [managedOverlay],
      removedNodes: [],
    },
  ]);
  assert.equal(scheduleCounter.count, 1);

  observer.callback([
    {
      type: "childList",
      target: documentRef.main,
      addedNodes: [documentRef.createElement("div")],
      removedNodes: [],
    },
  ]);
  assert.equal(scheduleCounter.count, 2);

  cleanup();
});

test("cricket-highlighter rebuilds overlay after external overlay removal with unchanged state", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  documentRef.variantElement.textContent = "Cricket";

  const svg = documentRef.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 1000 1000");
  const group = documentRef.createElementNS("http://www.w3.org/2000/svg", "g");
  svg.appendChild(group);

  const outerRing = documentRef.createElementNS("http://www.w3.org/2000/svg", "circle");
  outerRing.setAttribute("r", "500");
  group.appendChild(outerRing);

  for (let value = 1; value <= 20; value += 1) {
    const labelNode = documentRef.createElementNS("http://www.w3.org/2000/svg", "text");
    labelNode.textContent = String(value);
    group.appendChild(labelNode);
  }

  documentRef.main.appendChild(svg);

  const table = documentRef.createElement("table");
  table.id = "grid";
  ["20", "19", "18", "17", "16", "15", "BULL"].forEach((label) => {
    const row = documentRef.createElement("tr");

    const labelCell = documentRef.createElement("td");
    labelCell.classList.add("label-cell");
    labelCell.textContent = label === "BULL" ? "Bull" : label;
    row.appendChild(labelCell);

    for (let index = 0; index < 2; index += 1) {
      const cell = documentRef.createElement("td");
      cell.classList.add("player-cell");
      cell.setAttribute("data-player-index", String(index));
      cell.setAttribute("data-marks", label === "20" && index === 0 ? "3" : "0");
      cell.textContent = label === "20" && index === 0 ? "3" : "0";
      row.appendChild(cell);
    }

    table.appendChild(row);
  });
  documentRef.main.appendChild(table);

  const observers = createObserverRegistry();
  const listeners = createListenerRegistry();
  const scheduleCounter = { count: 0 };

  const cleanup = initializeCricketHighlighter({
    documentRef,
    windowRef,
    domGuards: createDomGuards({ documentRef }),
    registries: {
      observers,
      listeners,
    },
    gameState: {
      isCricketVariant: () => true,
      getCricketGameModeNormalized: () => "cricket",
      getCricketGameMode: () => "Cricket",
      getCricketScoringModeNormalized: () => "standard",
      getCricketScoringMode: () => "standard",
      getActivePlayerIndex: () => 0,
      getActiveThrows: () => [],
      getSnapshot: () => ({ match: { players: [{ id: "a" }, { id: "b" }] } }),
      subscribe: () => () => {},
    },
    domain: {
      cricketRules,
      variantRules,
    },
    config: {
      getFeatureConfig() {
        return {
          showDeadTargets: true,
          colorTheme: "standard",
          intensity: "normal",
        };
      },
    },
    helpers: {
      createRafScheduler(callback) {
        return {
          schedule() {
            scheduleCounter.count += 1;
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

  const initialOverlay = documentRef.getElementById(CRICKET_OVERLAY_ID);
  assert.equal(Boolean(initialOverlay), true);
  assert.equal((initialOverlay?.children?.length || 0) > 0, true);

  initialOverlay.parentNode?.removeChild(initialOverlay);

  const observer = observers.get("cricket-highlighter:dom-observer");
  assert.ok(observer);
  observer.callback([
    {
      type: "childList",
      target: group,
      addedNodes: [documentRef.createElement("div")],
      removedNodes: [initialOverlay],
    },
  ]);

  const restoredOverlay = documentRef.getElementById(CRICKET_OVERLAY_ID);
  assert.equal(Boolean(restoredOverlay), true);
  assert.equal((restoredOverlay?.children?.length || 0) > 0, true);
  assert.equal(scheduleCounter.count >= 2, true);

  cleanup();
});

test("cricket-highlighter rerenders on throw updates even when board state stays the same", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  documentRef.variantElement.textContent = "Cricket";

  const svg = documentRef.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 1000 1000");
  const group = documentRef.createElementNS("http://www.w3.org/2000/svg", "g");
  svg.appendChild(group);
  const outerRing = documentRef.createElementNS("http://www.w3.org/2000/svg", "circle");
  outerRing.setAttribute("r", "500");
  group.appendChild(outerRing);
  for (let value = 1; value <= 20; value += 1) {
    const labelNode = documentRef.createElementNS("http://www.w3.org/2000/svg", "text");
    labelNode.textContent = String(value);
    group.appendChild(labelNode);
  }
  documentRef.main.appendChild(svg);

  const table = documentRef.createElement("table");
  table.id = "grid";
  ["20", "19", "18", "17", "16", "15", "BULL"].forEach((label) => {
    const row = documentRef.createElement("tr");
    const labelCell = documentRef.createElement("td");
    labelCell.classList.add("label-cell");
    labelCell.textContent = label === "BULL" ? "Bull" : label;
    row.appendChild(labelCell);
    for (let index = 0; index < 2; index += 1) {
      const cell = documentRef.createElement("td");
      cell.classList.add("player-cell");
      cell.setAttribute("data-player-index", String(index));
      const marks = label === "20" && index === 0 ? "3" : "0";
      cell.setAttribute("data-marks", marks);
      cell.textContent = marks;
      row.appendChild(cell);
    }
    table.appendChild(row);
  });
  documentRef.main.appendChild(table);

  let activePlayerIndex = 0;
  let activeThrows = [];
  let onStateChange = () => {};
  const fixedTurn = {
    id: "turn-live",
    playerId: "a",
    round: 1,
    turn: 1,
    createdAt: "2026-03-11T21:00:00.000Z",
  };
  const logs = [];

  const setDomActivePlayer = (index) => {
    documentRef.activePlayerRow.classList.remove("ad-ext-player-active");
    documentRef.winnerNode.classList.remove("ad-ext-player-active");
    if (index === 0) {
      documentRef.activePlayerRow.classList.add("ad-ext-player-active");
    } else {
      documentRef.winnerNode.classList.add("ad-ext-player-active");
    }
  };

  const cleanup = initializeCricketHighlighter({
    documentRef,
    windowRef,
    domGuards: createDomGuards({ documentRef }),
    registries: {
      observers: createObserverRegistry(),
      listeners: createListenerRegistry(),
    },
    gameState: {
      isCricketVariant: () => true,
      getCricketGameModeNormalized: () => "cricket",
      getCricketGameMode: () => "Cricket",
      getCricketScoringModeNormalized: () => "standard",
      getCricketScoringMode: () => "standard",
      getActivePlayerIndex: () => activePlayerIndex,
      getActiveThrows: () => activeThrows,
      getActiveTurn: () => fixedTurn,
      getSnapshot: () => ({ match: { players: [{ id: "a" }, { id: "b" }] } }),
      subscribe(handler) {
        onStateChange = typeof handler === "function" ? handler : () => {};
        return () => {
          onStateChange = () => {};
        };
      },
    },
    domain: {
      cricketRules,
      variantRules,
    },
    config: {
      getFeatureConfig() {
        return {
          showOpenTargets: true,
          showDeadTargets: true,
          colorTheme: "standard",
          intensity: "normal",
        };
      },
    },
    featureDebug: {
      enabled: true,
      log(message) {
        logs.push(String(message || ""));
      },
      warn() {},
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

  const readPresentation = (label) => {
    const overlay = documentRef.getElementById(CRICKET_OVERLAY_ID);
    const shapes = Array.from(overlay?.children || []).filter((node) => {
      return String(node?.dataset?.targetLabel || "") === label;
    });
    return String(shapes[0]?.dataset?.targetPresentation || "");
  };

  assert.equal(readPresentation("20"), "scoring");
  const logsAfterInit = logs.length;

  activePlayerIndex = 1;
  setDomActivePlayer(1);
  onStateChange();
  assert.equal(readPresentation("20"), "pressure");
  const logsAfterPlayerSwitch = logs.length;
  assert.equal(logsAfterPlayerSwitch > logsAfterInit, true);

  // S5 changes active throw count but not any cricket objective state.
  activeThrows = [{ segment: { name: "S5" } }];
  onStateChange();
  assert.equal(readPresentation("20"), "pressure");
  assert.equal(logs.length > logsAfterPlayerSwitch, true);

  cleanup();
});

test("cricket-highlighter emits missing-grid warning only once for unchanged status", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  documentRef.variantElement.textContent = "Cricket";

  const observers = createObserverRegistry();
  const warnings = [];
  const scheduleCounter = { count: 0 };

  const cleanup = initializeCricketHighlighter({
    documentRef,
    windowRef,
    domGuards: createDomGuards({ documentRef }),
    registries: {
      observers,
      listeners: createListenerRegistry(),
    },
    gameState: {
      isCricketVariant: () => true,
      getCricketGameModeNormalized: () => "cricket",
      getCricketGameMode: () => "Cricket",
      getCricketScoringModeNormalized: () => "standard",
      getCricketScoringMode: () => "standard",
      getActivePlayerIndex: () => 0,
      getActiveThrows: () => [],
      getSnapshot: () => ({ match: { players: [{ id: "a" }, { id: "b" }] } }),
      subscribe: () => () => {},
    },
    domain: {
      cricketRules,
      variantRules,
    },
    config: {
      getFeatureConfig() {
        return {
          showDeadTargets: true,
          colorTheme: "standard",
          intensity: "normal",
        };
      },
    },
    featureDebug: {
      enabled: true,
      log() {},
      warn(message) {
        warnings.push(String(message || ""));
      },
    },
    helpers: {
      createRafScheduler(callback) {
        return {
          schedule() {
            scheduleCounter.count += 1;
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

  const observer = observers.get("cricket-highlighter:dom-observer");
  assert.ok(observer);
  observer.callback([
    {
      type: "childList",
      target: documentRef.main,
      addedNodes: [documentRef.createElement("div")],
      removedNodes: [],
    },
  ]);
  observer.callback([
    {
      type: "childList",
      target: documentRef.main,
      addedNodes: [documentRef.createElement("div")],
      removedNodes: [],
    },
  ]);

  assert.equal(scheduleCounter.count >= 3, true);
  assert.equal(warnings.filter((entry) => entry.includes("warn kein Grid")).length, 1);

  cleanup();
});

test("remove-darts-notification uses only the direct game-state subscription", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  const domGuards = createDomGuards({ documentRef });
  const scheduleCounter = { count: 0 };
  let eventBusRegistrations = 0;
  let gameStateListener = () => {};

  const cleanup = initializeRemoveDartsNotification({
    documentRef,
    windowRef,
    domGuards,
    registries: {
      observers: createObserverRegistry(),
    },
    eventBus: {
      on() {
        eventBusRegistrations += 1;
        return () => {};
      },
    },
    gameState: {
      subscribe(listener) {
        gameStateListener = listener;
        return () => {};
      },
    },
    config: {
      getFeatureConfig() {
        return {
          imageSize: "standard",
          pulseAnimation: true,
          pulseScale: 1.04,
        };
      },
    },
    helpers: {
      createRafScheduler: createCountingSchedulerFactory(scheduleCounter),
    },
  });

  assert.equal(scheduleCounter.count, 1);
  assert.equal(eventBusRegistrations, 0);

  gameStateListener();
  assert.equal(scheduleCounter.count, 2);

  cleanup();
});

test("turn-points-count ignores late anime loader resolution after cleanup", async () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  windowRef.anime = () => ({ pause() {} });

  const scheduleCounter = { count: 0 };

  const cleanup = initializeTurnPointsCount({
    documentRef,
    windowRef,
    gameState: {
      subscribe() {
        return () => {};
      },
    },
    config: {
      getFeatureConfig() {
        return {
          durationMs: 416,
        };
      },
    },
    helpers: {
      createRafScheduler: createCountingSchedulerFactory(scheduleCounter),
    },
  });

  assert.equal(scheduleCounter.count, 1);

  cleanup();
  await wait(5);

  assert.equal(scheduleCounter.count, 1);
});

test("game state store suppresses identical consecutive websocket state payloads", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  const eventBus = createEventBus();
  const store = createGameStateStore({ eventBus, windowRef, documentRef });

  let subscriberCalls = 0;
  let eventBusCalls = 0;

  store.subscribe(() => {
    subscriberCalls += 1;
  });
  eventBus.on("game-state:updated", () => {
    eventBusCalls += 1;
  });

  store.start();

  const payload = JSON.stringify({
    channel: "autodarts.matches",
    topic: "match-123.state",
    data: {
      variant: "X01",
      player: 0,
      players: [{ id: "player-1" }, { id: "player-2" }],
      gameScores: [170, 301],
      settings: {
        outMode: "Double Out",
      },
      turns: [],
    },
  });

  void new FakeMessageEvent(payload, new FakeWebSocket()).data;
  void new FakeMessageEvent(payload, new FakeWebSocket()).data;

  assert.equal(subscriberCalls, 1);
  assert.equal(eventBusCalls, 1);

  store.stop();
});
