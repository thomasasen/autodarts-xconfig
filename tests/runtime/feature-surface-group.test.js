import test from "node:test";
import assert from "node:assert/strict";
import { mountFeatureSurfaceGroup } from "../../src/features/shared/feature-surface-group.js";

function fixture() {
  let pending = null;
  let factories = 0;
  let subscriptions = 0;
  const handlers = new Set();
  const context = {
    documentRef: {}, windowRef: {},
    helpers: { createRafScheduler(callback) {
      factories += 1;
      return { schedule() { pending = callback; }, cancel() { pending = null; } };
    } },
    gameState: { subscribe(callback) {
      subscriptions += 1; handlers.add(callback);
      return () => { subscriptions -= 1; handlers.delete(callback); };
    } },
  };
  return { context, get factories() { return factories; }, get subscriptions() { return subscriptions; },
    flush() { const callback = pending; pending = null; callback?.(); },
    emit(value) { handlers.forEach((handler) => handler(value)); } };
}

test("related renderers share a consistent snapshot and one frame while the next frame reads fresh state", () => {
  const f = fixture();
  const renders = [];
  const schedules = [];
  let value = 10;
  let reads = 0;
  const mount = (name, priority) => mountFeatureSurfaceGroup(f.context, "score", priority, (context) => {
    const scheduler = context.helpers.createRafScheduler(() => {
      const snapshot = context.readSurfaceState("score", () => { reads += 1; return value; });
      renders.push([name, snapshot]);
      value += 1;
    });
    schedules.push(scheduler.schedule);
    context.gameState.subscribe(scheduler.schedule);
    scheduler.schedule();
    return scheduler.cancel;
  });
  const cleanups = [mount("bar", 1), mount("number", 0)];
  try {
    assert.equal(f.factories, 1);
    assert.equal(f.subscriptions, 1);
    f.flush();
    assert.deepEqual(renders, [["number", 10], ["bar", 10]]);
    assert.equal(reads, 1);
    f.emit({});
    f.flush();
    assert.deepEqual(renders.slice(2), [["number", 12], ["bar", 12]]);
    assert.equal(reads, 2);
  } finally { cleanups.forEach((cleanup) => cleanup()); }
  assert.equal(f.subscriptions, 0);
  schedules.forEach((schedule) => schedule());
  f.flush();
  assert.equal(renders.length, 4);
});

test("disabling one renderer cancels only its queued work and keeps the other subscription active", () => {
  const f = fixture();
  const renders = [];
  const mount = (name) => mountFeatureSurfaceGroup(f.context, "markers", 0, (context) => {
    const scheduler = context.helpers.createRafScheduler(() => renders.push(name));
    const unsubscribe = context.gameState.subscribe(scheduler.schedule);
    scheduler.schedule();
    return () => { scheduler.cancel(); unsubscribe(); };
  });
  const first = mount("native");
  const second = mount("darts");
  first();
  f.flush();
  assert.deepEqual(renders, ["darts"]);
  assert.equal(f.subscriptions, 1);
  f.emit({}); f.flush();
  assert.deepEqual(renders, ["darts", "darts"]);
  second(); second();
  assert.equal(f.subscriptions, 0);
  const third = mount("native");
  f.flush();
  assert.equal(f.factories, 2);
  third();
});

test("a failed initialization releases subscriptions and queued callbacks without leaking into a later mount", () => {
  const f = fixture();
  let renders = 0;
  assert.throws(() => mountFeatureSurfaceGroup(f.context, "turn", 0, (context) => {
    const scheduler = context.helpers.createRafScheduler(() => { renders += 1; });
    context.gameState.subscribe(scheduler.schedule);
    scheduler.schedule();
    throw new Error("partial mount");
  }), /partial mount/);
  assert.equal(f.subscriptions, 0);
  f.flush();
  assert.equal(renders, 0);
  const cleanup = mountFeatureSurfaceGroup(f.context, "turn", 0, () => () => {});
  assert.equal(f.factories, 2);
  cleanup();
});

test("render failures are isolated and read scopes never outlive their synchronous frame", () => {
  const f = fixture();
  let renders = 0;
  let contextRef;
  const first = mountFeatureSurfaceGroup(f.context, "turn", 0, (context) => {
    contextRef = context;
    const scheduler = context.helpers.createRafScheduler(() => { throw new Error("bad effect"); });
    scheduler.schedule(); return scheduler.cancel;
  });
  const second = mountFeatureSurfaceGroup(f.context, "turn", 1, (context) => {
    const scheduler = context.helpers.createRafScheduler(() => { renders += 1; });
    scheduler.schedule(); return scheduler.cancel;
  });
  try {
    assert.throws(() => f.flush(), /bad effect/);
    assert.equal(renders, 1);
    let reads = 0;
    assert.equal(contextRef.readSurfaceState("outside", () => ++reads), 1);
    assert.equal(contextRef.readSurfaceState("outside", () => ++reads), 2);
  } finally { first(); second(); }
});
