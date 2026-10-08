import test from "node:test";
import assert from "node:assert/strict";
import { createFeatureWatchdog } from "../../src/core/feature-watchdog.js";
import { createTurnScopedScheduler } from "../../src/features/shared/turn-lifecycle.js";
import { createFakeTimerHarness, createFakeWindow } from "./fake-dom.js";

function fixture() {
  const windowRef = createFakeWindow();
  const timers = createFakeTimerHarness({ now: 10000 });
  timers.installOnWindow(windowRef);
  timers.installGlobals();
  const snapshot = { phase: "ready", generation: 1 };
  const hooks = new Set();
  const turnLifecycle = {
    refresh: () => snapshot,
    ensureCurrent: () => snapshot,
    register(entry) { hooks.add(entry); return () => hooks.delete(entry); },
  };
  const watchdog = createFeatureWatchdog({ windowRef, documentRef: windowRef.document, turnLifecycle });
  function register(key, check = () => true, repair = () => {}, extra = {}) {
    const status = { enabled: true, mounted: true, scheduled: false };
    watchdog.registerFeature(key, { readStatus: () => status, restart: repair });
    const scope = watchdog.forFeature(key);
    scope.register({ check, repair, ...extra });
    return { status, scope };
  }
  watchdog.start();
  return { windowRef, timers, snapshot, hooks, turnLifecycle, watchdog, register,
    close() { watchdog.stop(); timers.restoreGlobals(); } };
}

test("1000 healthy turns keep one watchdog timer and never repair or log", () => {
  const f = fixture();
  try {
    let repairs = 0;
    f.register("future-feature", () => true, () => repairs++);
    for (let visit = 1; visit <= 1000; visit++) {
      f.snapshot.generation = visit;
      f.watchdog.requestCheck();
      f.watchdog.requestCheck();
      f.timers.advance(5000);
      assert.equal(f.timers.pendingCount, 1);
    }
    assert.equal(repairs, 0);
    assert.equal(f.watchdog.inspect().log.length, 0);
    f.watchdog.stop();
    assert.equal(f.timers.pendingCount, 0);
  } finally { f.close(); }
});

test("persistent failures stop after three attempts despite 1000 further turns", () => {
  const f = fixture();
  try {
    let repairs = 0;
    f.register("broken", () => "missing-overlay", () => {
      repairs++;
      f.watchdog.check(); // Reentrant checks cannot recurse into repairs.
      for (let i = 0; i < 100; i++) f.watchdog.requestCheck();
    });
    f.timers.advance(120000);
    for (let i = 0; i < 1000; i++) {
      f.snapshot.generation++;
      f.watchdog.check();
    }
    const state = f.watchdog.inspect();
    assert.equal(repairs, 3);
    assert.equal(state.features.broken.blocked, true);
    assert.equal(f.timers.pendingCount, 1);
    assert.ok(state.log.some((entry) => entry.action === "blocked"));
  } finally { f.close(); }
});

test("healthy intervals and new generations do not replenish repair budgets", () => {
  const f = fixture();
  try {
    let broken = true;
    let repairs = 0;
    f.register("flapping", () => broken ? "lost-node" : true,
      () => { repairs++; broken = false; }, { restartSafe: true });
    for (let i = 0; i < 6; i++) {
      broken = true;
      f.snapshot.generation++;
      f.timers.advance(40000);
    }
    assert.equal(repairs, 3);
    assert.equal(f.watchdog.inspect().features.flapping.blocked, true);
    assert.ok(f.watchdog.inspect().log.every((entry) => entry.action !== "restart"),
      "a separately recovered incident must start with correction again");
  } finally { f.close(); }
});

test("global repair rate and local diagnostic log remain bounded", () => {
  const f = fixture();
  try {
    let repairs = 0;
    for (let i = 0; i < 40; i++) f.register(`feature-${i}`, () => "broken", () => repairs++);
    f.timers.advance(30000);
    assert.equal(repairs, 6);
    f.timers.advance(60000);
    assert.equal(repairs, 12);
    f.timers.advance(1500000);
    assert.ok(f.watchdog.inspect().log.length <= 100);
    for (const state of Object.values(f.watchdog.inspect().features)) assert.ok(state.attempts <= 3);
    const copy = f.watchdog.inspect();
    copy.log[0].action = "tampered";
    assert.notEqual(f.watchdog.inspect().log[0].action, "tampered");
  } finally { f.close(); }
});

test("pending, inactive and hidden matches never guess a player or repair", () => {
  const f = fixture();
  try {
    let checks = 0;
    f.register("test", () => { checks++; return "broken"; });
    f.snapshot.phase = "pending";
    f.timers.advance(60000);
    assert.equal(checks, 0);
    assert.equal(f.watchdog.inspect().log.filter((entry) => entry.action === "waiting").length, 1);
    f.snapshot.phase = "idle";
    f.timers.advance(60000);
    f.snapshot.phase = "ready";
    f.windowRef.document.hidden = true;
    f.timers.advance(60000);
    assert.equal(checks, 0);
    f.windowRef.document.hidden = false;
    f.timers.advance(5000);
    assert.equal(checks, 1);
  } finally { f.close(); }
});

test("check and repair exceptions isolate features and prohibit unsafe restart loops", () => {
  const f = fixture();
  try {
    let successfulRepairs = 0;
    f.register("check-throws", () => { throw new Error("check"); });
    f.register("repair-throws", () => "broken", () => { throw new Error("cleanup"); });
    let healthy = false;
    f.register("recoverable", () => healthy || "broken", () => { successfulRepairs++; healthy = true; });
    f.timers.advance(120000);
    const state = f.watchdog.inspect();
    assert.equal(state.features["check-throws"].attempts, 0);
    assert.equal(state.features["check-throws"].blocked, true);
    assert.equal(state.features["repair-throws"].attempts, 1);
    assert.equal(state.features["repair-throws"].blocked, true);
    assert.equal(successfulRepairs, 1);
    assert.ok(state.log.some((entry) => entry.feature === "recoverable" && entry.action === "recovered"));
  } finally { f.close(); }
});

test("disabled and deferred features are skipped, cleanup failures block restart", () => {
  const f = fixture();
  try {
    let restarts = 0;
    const { status } = f.register("new-feature", () => true, () => restarts++);
    status.enabled = false;
    status.mounted = false;
    f.timers.advance(10000);
    status.enabled = true;
    status.scheduled = true;
    f.timers.advance(10000);
    assert.equal(restarts, 0);
    status.scheduled = false;
    status.failure = { phase: "cleanup", message: "failed" };
    f.timers.advance(60000);
    assert.equal(restarts, 0);
    assert.equal(f.watchdog.inspect().features["new-feature"].blocked, true);
  } finally { f.close(); }
});

test("accidentally async hooks are blocked without unhandled rejections or repeated repairs", async () => {
  const f = fixture();
  try {
    f.register("async-check", async () => { throw new Error("async check"); });
    let repairs = 0;
    f.register("async-repair", () => "broken", async () => { repairs++; throw new Error("async repair"); });
    f.timers.advance(120000);
    await Promise.resolve();
    const state = f.watchdog.inspect();
    assert.equal(state.features["async-check"].blocked, true);
    assert.equal(state.features["async-repair"].blocked, true);
    assert.equal(repairs, 1);
  } finally { f.close(); }
});

test("scheduler recovers a dropped RAF and hydrates silently without another generation", () => {
  const f = fixture();
  try {
    f.watchdog.registerFeature("scheduled", { readStatus: () => ({ enabled: true, mounted: true }) });
    let lost = true;
    const raf = f.windowRef.requestAnimationFrame;
    f.windowRef.requestAnimationFrame = (callback) => lost ? 999 : raf(callback);
    const renders = [];
    const scheduler = createTurnScopedScheduler({ windowRef: f.windowRef,
      turnLifecycle: f.turnLifecycle, watchdog: f.watchdog.forFeature("scheduled") },
    (state) => renders.push(state), { windowRef: f.windowRef, resetTurn() { lost = false; } });
    scheduler.schedule();
    f.timers.advance(15000);
    assert.equal(renders.length, 1);
    assert.deepEqual(renders[0], { rehydrating: true, generation: 1 });
    assert.equal(f.snapshot.generation, 1);
    assert.equal(f.watchdog.inspect().features.scheduled.attempts, 1);
    scheduler.cancel();
    assert.equal(f.watchdog.inspect().features.scheduled.checks, 0);
    assert.equal(f.hooks.size, 0);
  } finally { f.close(); }
});

test("a thrown render is contained and corrected by a silent rebuild", () => {
  const f = fixture();
  try {
    f.watchdog.registerFeature("scheduled", { readStatus: () => ({ enabled: true, mounted: true }) });
    let broken = true;
    const renders = [];
    const scheduler = createTurnScopedScheduler({ windowRef: f.windowRef,
      turnLifecycle: f.turnLifecycle, watchdog: f.watchdog.forFeature("scheduled") },
    (state) => { if (broken) throw new Error("render"); renders.push(state); },
    { windowRef: f.windowRef, resetTurn() { broken = false; } });
    scheduler.schedule();
    f.timers.advance(15000);
    assert.equal(renders.length, 1);
    assert.equal(renders[0].rehydrating, true);
    scheduler.cancel();
  } finally { f.close(); }
});

test("stopping cancels checks; explicit restart resets the circuit", () => {
  const f = fixture();
  try {
    f.register("broken", () => "broken");
    f.timers.advance(120000);
    assert.equal(f.watchdog.inspect().features.broken.blocked, true);
    f.watchdog.stop();
    f.watchdog.requestCheck();
    assert.equal(f.timers.pendingCount, 0);
    assert.equal(f.watchdog.inspect().features.broken.attempts, 0);
    f.watchdog.start();
    assert.equal(f.timers.pendingCount, 1);
  } finally { f.close(); }
});
