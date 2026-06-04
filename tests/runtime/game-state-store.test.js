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
        variant: "Cricket",
        player: 0,
        players: [{ id: "player-1" }, { id: "player-2" }],
        gameScores: [170, 301],
        settings: {
          gameMode: "Tactics",
          mode: "Cut-Throat",
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
  assert.equal(snapshot.variantNormalized, "cricket");
  assert.equal(snapshot.activeScore, 170);
  assert.equal(snapshot.outMode, "Double Out");
  assert.equal(snapshot.cricketGameMode, "Tactics");
  assert.equal(snapshot.cricketGameModeNormalized, "tactics");
  assert.equal(snapshot.cricketMode, "Cut-Throat");
  assert.equal(snapshot.cricketScoringMode, "Cut-Throat");
  assert.equal(snapshot.cricketScoringModeNormalized, "cutthroat");

  store.stop();
});

test("game state store clones match snapshots and suppresses duplicate subscriber work", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  const eventBus = createEventBus();
  const store = createGameStateStore({ eventBus, windowRef, documentRef });
  const payload = {
    variant: "X01",
    player: 0,
    players: Array.from({ length: 24 }, (_entry, index) => ({
      id: `player-${index + 1}`,
      name: `Player ${index + 1}`,
    })),
    gameScores: Array.from({ length: 24 }, (_entry, index) => 501 - index),
    settings: {
      outMode: "Double Out",
    },
    turns: Array.from({ length: 80 }, (_entry, index) => ({
      round: Math.floor(index / 2) + 1,
      turn: index + 1,
      playerId: `player-${(index % 24) + 1}`,
      score: 501 - index,
      throws: [{ segment: "T20", score: 60 }],
    })),
  };
  const rawPayload = JSON.stringify({
    channel: "autodarts.matches",
    topic: "match-123.state",
    data: payload,
  });
  let subscriberCalls = 0;

  store.subscribe(() => {
    subscriberCalls += 1;
  });
  store.start();

  void new FakeMessageEvent(rawPayload, new FakeWebSocket()).data;
  const snapshot = store.getSnapshot();
  snapshot.match.players[0].name = "mutated";
  void new FakeMessageEvent(rawPayload, new FakeWebSocket()).data;

  assert.equal(subscriberCalls, 1);
  assert.equal(store.getSnapshot().match.players[0].name, "Player 1");

  store.stop();
});
