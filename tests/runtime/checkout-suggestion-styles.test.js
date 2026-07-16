import test from "node:test";
import assert from "node:assert/strict";

import {
  applySuggestionStyle,
  resetSuggestionNode,
} from "../../src/features/checkout-suggestion-styles/logic.js";
import { initializeCheckoutSuggestionStyles } from "../../src/features/checkout-suggestion-styles/index.js";
import { createDomGuards } from "../../src/core/dom-guards.js";
import { createObserverRegistry } from "../../src/core/observer-registry.js";
import { FakeDocument, createFakeWindow } from "./fake-dom.js";

test("checkout-suggestion-styles writes and clears the checkout label through dataset-backed attributes", () => {
  const documentRef = new FakeDocument();
  const node = documentRef.createElement("div");

  applySuggestionStyle(node, {
    style: "badge",
    labelText: "CHECKOUT",
    colorTheme: "amber",
  });

  assert.equal(node.dataset.adExtLabel, "CHECKOUT");
  assert.equal(node.getAttribute("data-ad-ext-label"), "CHECKOUT");

  resetSuggestionNode(node);

  assert.equal(node.dataset.adExtLabel, undefined);
  assert.equal(node.getAttribute("data-ad-ext-label"), null);
});

test("checkout-suggestion-styles schedules only suggestion, turn, variant, and game-state changes", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  const observers = createObserverRegistry();
  let scheduleCount = 0;
  let gameStateSubscriber = null;
  const cleanup = initializeCheckoutSuggestionStyles({
    documentRef,
    windowRef,
    domGuards: createDomGuards({ documentRef }),
    registries: { observers },
    helpers: {
      createRafScheduler() {
        return {
          schedule() {
            scheduleCount += 1;
          },
          cancel() {},
        };
      },
    },
    gameState: {
      subscribe(subscriber) {
        gameStateSubscriber = subscriber;
        return () => {};
      },
    },
  });
  const observer = observers.get("checkout-suggestion-styles:dom-observer");
  const unrelatedNode = documentRef.createElement("div");
  documentRef.sidebar.appendChild(unrelatedNode);

  assert.equal(scheduleCount, 1);
  observer.callback([{ target: documentRef.sidebar, addedNodes: [unrelatedNode] }]);
  assert.equal(scheduleCount, 1);

  observer.callback([{ target: documentRef.turnScoreElement }]);
  observer.callback([{ target: documentRef.suggestionElement }]);
  observer.callback([{ target: documentRef.variantElement }]);
  gameStateSubscriber();
  assert.equal(scheduleCount, 5);

  cleanup();
});
