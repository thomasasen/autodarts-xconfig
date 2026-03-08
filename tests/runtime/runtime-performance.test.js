import test from "node:test";
import assert from "node:assert/strict";

import { createDomGuards } from "../../src/core/dom-guards.js";
import { createEventBus } from "../../src/core/event-bus.js";
import { createGameStateStore } from "../../src/core/game-state-store.js";
import { createObserverRegistry } from "../../src/core/observer-registry.js";
import { initializeCheckoutBoardTargets } from "../../src/features/checkout-board-targets/index.js";
import { OVERLAY_ID } from "../../src/features/checkout-board-targets/style.js";
import { initializeRemoveDartsNotification } from "../../src/features/remove-darts-notification/index.js";
import { initializeTurnPointsCount } from "../../src/features/turn-points-count/index.js";
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
  managedOverlay.id = OVERLAY_ID;

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
