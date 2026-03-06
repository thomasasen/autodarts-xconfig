import test from "node:test";
import assert from "node:assert/strict";

import { createEventBus } from "../../src/core/event-bus.js";
import { createGameStateStore } from "../../src/core/game-state-store.js";
import {
  FakeDocument,
  FakeMessageEvent,
  FakeWebSocket,
  createFakeWindow,
} from "./fake-dom.js";

test("game state store installs and restores websocket interception across start/stop", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  const eventBus = createEventBus();
  const store = createGameStateStore({ eventBus, windowRef, documentRef });

  const originalDescriptor = Object.getOwnPropertyDescriptor(
    windowRef.MessageEvent.prototype,
    "data"
  );

  store.start();

  const runningDescriptor = Object.getOwnPropertyDescriptor(
    windowRef.MessageEvent.prototype,
    "data"
  );

  assert.notEqual(runningDescriptor.get, originalDescriptor.get);
  assert.equal(store.getSnapshot().running, true);
  assert.equal(store.getSnapshot().interceptionInstalled, true);

  store.stop();

  const restoredDescriptor = Object.getOwnPropertyDescriptor(
    windowRef.MessageEvent.prototype,
    "data"
  );

  assert.equal(restoredDescriptor.get, originalDescriptor.get);
  assert.equal(store.getSnapshot().running, false);
  assert.equal(store.getSnapshot().interceptionInstalled, false);
});

test("game state store derives a match snapshot from websocket state messages", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  const eventBus = createEventBus();
  const store = createGameStateStore({ eventBus, windowRef, documentRef });

  store.start();

  const event = new FakeMessageEvent(
    JSON.stringify({
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
    }),
    new FakeWebSocket()
  );

  assert.equal(store.getSnapshot().match, null);

  void event.data;

  const snapshot = store.getSnapshot();

  assert.equal(snapshot.source, "websocket-state-topic");
  assert.equal(snapshot.variantNormalized, "x01");
  assert.equal(snapshot.activeScore, 170);
  assert.equal(snapshot.outMode, "Double Out");

  store.stop();
});
