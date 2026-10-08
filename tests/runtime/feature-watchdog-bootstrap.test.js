import test from "node:test";
import assert from "node:assert/strict";
import { createBootstrap } from "../../src/core/bootstrap.js";
import { defaultFeatureDefinitions } from "../../src/features/feature-registry.js";
import { createFeatureMountHarness } from "../../src/features/shared/feature-mount-harness.js";
import { createFakeTimerHarness } from "./fake-dom.js";
import { createModernX01Fixture } from "./modern-x01-fixture.js";

function fixture(initialize, definitions) {
  const f = createModernX01Fixture({ base: 301, score: 40, throws: [], route: ["D20"] });
  const timers = createFakeTimerHarness({ now: 10000 });
  timers.installOnWindow(f.windowRef);
  timers.installGlobals();
  const runtime = createBootstrap({ windowRef: f.windowRef, documentRef: f.documentRef,
    logger: { error() {} },
    featureDefinitions: definitions || [{ featureKey: "future-feature", configKey: "turnScoreCounter",
      startupTiming: "immediate", initialize }],
    config: { featureToggles: { turnScoreCounter: true } },
  });
  runtime.start();
  timers.advance(50);
  return { ...f, timers, runtime, inspect: () => f.windowRef.__adXConfig.inspect().watchdog,
    close() { runtime.stop(); timers.restoreGlobals(); } };
}

test("every registered feature is automatically listed without a watchdog feature allowlist", () => {
  const definitions = defaultFeatureDefinitions.map((definition) => ({ ...definition, initialize: () => () => {} }));
  definitions.push({ featureKey: "added-later", configKey: "turnScoreCounter", initialize: () => () => {} });
  const f = fixture(null, definitions);
  try {
    assert.deepEqual(Object.keys(f.inspect().features), definitions.map((definition) => definition.featureKey));
    assert.equal(f.inspect().features["added-later"].coverage, "mount");
    f.timers.advance(20000);
    assert.ok(Object.values(f.inspect().features).every((entry) => entry.attempts === 0));
  } finally { f.close(); }
});

test("new harness features acquire render monitoring and safe targeted restart automatically", () => {
  let mounts = 0;
  let cleanups = 0;
  const f = fixture((context) => {
    mounts++;
    const mount = mounts;
    const harness = createFeatureMountHarness(context, {
      update() { if (mount === 1) throw new Error("stuck feature"); },
      watchdogRestartSafe: true,
    });
    harness.schedule();
    return harness.createCleanup(() => cleanups++);
  });
  try {
    f.timers.advance(50000);
    assert.equal(mounts, 2);
    assert.equal(cleanups, 1);
    const state = f.inspect();
    assert.equal(state.features["future-feature"].coverage, "render");
    assert.equal(state.features["future-feature"].attempts, 2);
    assert.equal(state.features["future-feature"].checks, 1);
    assert.ok(state.log.some((entry) => entry.action === "restart"));
    assert.ok(state.log.some((entry) => entry.action === "recovered"));
    f.runtime.stop();
    assert.equal(cleanups, 2);
    assert.equal(f.timers.pendingCount, 0);
    f.runtime.start();
    f.timers.advance(50);
    assert.equal(f.inspect().features["future-feature"].checks, 1);
    assert.equal(f.inspect().features["future-feature"].attempts, 0);
  } finally { f.close(); }
});

test("failed cleanup prevents a second mount, even for an explicitly restart-safe feature", () => {
  let mounts = 0;
  const f = fixture((context) => {
    mounts++;
    const harness = createFeatureMountHarness(context, {
      update() { throw new Error("stuck feature"); }, watchdogRestartSafe: true,
    });
    harness.schedule();
    return harness.createCleanup(() => { throw new Error("cleanup failed"); });
  });
  try {
    f.timers.advance(200000);
    assert.equal(mounts, 1);
    assert.equal(f.inspect().features["future-feature"].blocked, true);
    assert.equal(f.inspect().features["future-feature"].attempts, 2);
  } finally { f.close(); }
});

test("a partly failed initialization is recorded once and never mounted repeatedly", () => {
  let mounts = 0;
  const f = fixture((context) => {
    mounts++;
    context.watchdog.register({ check: () => "broken" });
    throw new Error("partially initialized");
  });
  try {
    f.timers.advance(200000);
    assert.equal(mounts, 1);
    assert.equal(f.inspect().features["future-feature"].blocked, true);
    assert.equal(f.inspect().features["future-feature"].checks, 0);
    assert.equal(f.inspect().features["future-feature"].reason, "mount-failed");
  } finally { f.close(); }
});
