import test from "node:test";
import assert from "node:assert/strict";

import { createFeatureMountHarness } from "../../src/features/shared/feature-mount-harness.js";
import { FakeDocument, createFakeWindow } from "./fake-dom.js";

test("createFeatureMountHarness wires observer, listeners, scheduler, and game-state cleanup", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  const observerCalls = [];
  const disconnectedKeys = [];
  const listenerCalls = [];
  const removedKeys = [];
  let unsubscribeCalls = 0;
  let scheduleCalls = 0;
  let cancelCalls = 0;
  let finalizerCalls = 0;

  const harness = createFeatureMountHarness(
    {
      documentRef,
      windowRef,
      gameState: {
        subscribe(listener) {
          listener();
          return () => {
            unsubscribeCalls += 1;
          };
        },
      },
      registries: {
        observers: {
          registerMutationObserver(options) {
            observerCalls.push(options);
            return { disconnect() {} };
          },
          disconnect(key) {
            disconnectedKeys.push(key);
          },
        },
        listeners: {
          register(options) {
            listenerCalls.push(options);
          },
          remove(key) {
            removedKeys.push(key);
          },
        },
      },
      helpers: {
        createRafScheduler() {
          return {
            schedule() {
              scheduleCalls += 1;
            },
            cancel() {
              cancelCalls += 1;
            },
          };
        },
      },
    },
    {
      update() {},
    }
  );

  assert.ok(harness);

  harness.registerObserver({
    key: "feature:observer",
    callback: () => harness.schedule(),
    observeOptions: {
      childList: true,
    },
  });
  harness.registerListeners([
    {
      key: "feature:visibility",
      target: documentRef,
      type: "visibilitychange",
      handler: () => {},
    },
  ]);
  harness.subscribeToGameState();
  harness.schedule();

  const cleanup = harness.createCleanup(() => {
    finalizerCalls += 1;
  });

  assert.equal(observerCalls.length, 1);
  assert.equal(listenerCalls.length, 1);
  assert.equal(scheduleCalls, 2);

  cleanup();
  cleanup();

  assert.equal(cancelCalls, 1);
  assert.deepEqual(disconnectedKeys, ["feature:observer"]);
  assert.deepEqual(removedKeys, ["feature:visibility"]);
  assert.equal(unsubscribeCalls, 1);
  assert.equal(finalizerCalls, 1);
});

test("createFeatureMountHarness returns null when support check rejects the mount", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });

  const harness = createFeatureMountHarness(
    {
      documentRef,
      windowRef,
      helpers: {
        createRafScheduler() {
          return {
            schedule() {},
            cancel() {},
          };
        },
      },
    },
    {
      isSupported: () => false,
      update() {},
    }
  );

  assert.equal(harness, null);
});
