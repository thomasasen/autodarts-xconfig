import test from "node:test";
import assert from "node:assert/strict";
import { initializeBotBoardStyle } from "../../src/features/bot-board-style/index.js";
import { initializeDartboardMarkerHighlight } from "../../src/features/dartboard-marker-highlight/index.js";
import { initializeCheckoutSuggestionStyles } from "../../src/features/checkout-suggestion-styles/index.js";
import { createDomGuards } from "../../src/core/dom-guards.js";
import { createObserverRegistry } from "../../src/core/observer-registry.js";
import { createListenerRegistry } from "../../src/core/listener-registry.js";
import { createRafScheduler } from "../../src/shared/raf-scheduler.js";
import { FakeDocument, createFakeWindow, createFakeTimerHarness } from "./fake-dom.js";

for (const [name, initialize] of [
  ["board design", initializeBotBoardStyle],
  ["marker highlight", initializeDartboardMarkerHighlight],
  ["checkout suggestion styles", initializeCheckoutSuggestionStyles],
]) {
  test(`${name} releases all resources through 20 mount/update/cleanup cycles`, () => {
    const documentRef = new FakeDocument();
    const timers = createFakeTimerHarness();
    const windowRef = timers.installOnWindow(createFakeWindow({ documentRef }));
    const observers = createObserverRegistry();
    const listeners = createListenerRegistry();
    const subscriptions = new Set();
    const context = { documentRef, windowRef, domGuards: createDomGuards({ documentRef }),
      registries: { observers, listeners },
      gameState: { subscribe(handler) { subscriptions.add(handler); return () => subscriptions.delete(handler); } },
      helpers: { createRafScheduler: (update) => createRafScheduler(update, { windowRef }) },
    };
    for (let cycle = 0; cycle < 20; cycle++) {
      const cleanup = initialize(context);
      assert.equal(observers.size(), 1);
      assert.equal(subscriptions.size, 1);
      subscriptions.forEach((update) => update());
      timers.advance(25);
      cleanup();
      cleanup();
      timers.advance(25);
      assert.equal(observers.size(), 0);
      assert.equal(listeners.size(), 0);
      assert.equal(subscriptions.size, 0);
      assert.equal(timers.pendingCount, 0);
      assert.equal(documentRef.head.querySelectorAll("style").length, 0);
    }
  });
}
