import test from "node:test";
import assert from "node:assert/strict";

import { createListenerRegistry } from "../../src/core/listener-registry.js";
import { createObserverRegistry } from "../../src/core/observer-registry.js";
import {
  FakeEventTarget,
  FakeMutationObserver,
} from "./fake-dom.js";

test("observer registry dedupes by key and disconnects observers", () => {
  const registry = createObserverRegistry();
  const target = {};
  const callback = () => {};

  const first = registry.registerMutationObserver({
    key: "test-observer",
    target,
    callback,
    MutationObserverRef: FakeMutationObserver,
  });

  const second = registry.registerMutationObserver({
    key: "test-observer",
    target,
    callback,
    MutationObserverRef: FakeMutationObserver,
  });

  assert.equal(first, second);
  assert.equal(registry.size(), 1);
  assert.equal(first.observeCalls.length, 1);

  registry.disconnect("test-observer");
  assert.equal(first.disconnected, true);
  assert.equal(registry.size(), 0);
});

test("listener registry registers once per key and removes listeners", () => {
  const registry = createListenerRegistry();
  const target = new FakeEventTarget();

  const handler = () => {};
  registry.register({
    key: "resize-listener",
    target,
    type: "resize",
    handler,
  });

  registry.register({
    key: "resize-listener",
    target,
    type: "resize",
    handler,
  });

  assert.equal(target.listenerCount(), 1);
  assert.equal(registry.size(), 1);

  registry.removeAll();
  assert.equal(target.listenerCount(), 0);
  assert.equal(registry.size(), 0);
});