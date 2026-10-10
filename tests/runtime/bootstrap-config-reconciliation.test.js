import test from "node:test";
import assert from "node:assert/strict";
import { createBootstrap } from "../../src/core/bootstrap.js";
import { FakeDocument, createFakeWindow } from "./fake-dom.js";

function fixture({ cleanupFails = false, mountFails = false } = {}) {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  const calls = [];
  const runtime = createBootstrap({
    documentRef, windowRef, logger: { error() {} },
    config: {
      featureToggles: { first: true, second: true },
      features: { first: { enabled: true, nested: { a: 1, b: 2 }, ordered: [1, 2] }, second: { enabled: true } },
    },
    featureDefinitions: ["first", "second"].map((key) => ({
      featureKey: key, configKey: key, startupTiming: "immediate",
      mount() {
        calls.push(`mount:${key}`);
        if (mountFails && key === "first") throw new Error("partial mount");
        return () => {
          calls.push(`cleanup:${key}`);
          if (cleanupFails && key === "first") throw new Error("uncertain cleanup");
        };
      },
    })),
  });
  runtime.start();
  calls.length = 0;
  return { runtime, calls };
}

test("identical and reordered full snapshots preserve every mounted feature", () => {
  const { runtime, calls } = fixture();
  try {
    const next = runtime.context.config.getNormalized();
    next.features.first.nested = { b: 2, a: 1 };
    runtime.updateConfig(next);
    runtime.updateConfig({ features: { first: { nested: { a: 1 } } } });
    assert.deepEqual(calls, []);
    assert.equal(runtime.getSnapshot().features.first.status, "mounted");
  } finally { runtime.stop(); }
});

test("full snapshots restart only changed active features, including unknown nested fields and ordered arrays", () => {
  const { runtime, calls } = fixture();
  try {
    const next = runtime.context.config.getNormalized();
    next.features.second.color = "cyan";
    runtime.updateConfig(next);
    assert.deepEqual(calls, ["cleanup:second", "mount:second"]);
    calls.length = 0;
    runtime.updateConfig({ features: { first: { ordered: [2, 1], nested: { b: 3 } } } });
    assert.deepEqual(calls, ["cleanup:first", "mount:first"]);
    calls.length = 0;
    runtime.updateConfig({ featureToggles: { first: false } });
    runtime.updateConfig({ features: { first: { nested: { a: 9 } } } });
    assert.deepEqual(calls, ["cleanup:first"]);
    runtime.updateConfig({ featureToggles: { first: true } });
    assert.deepEqual(calls, ["cleanup:first", "mount:first"]);
  } finally { runtime.stop(); }
});

test("cleanup errors block normal remounts and later updates without hiding the error", () => {
  const { runtime, calls } = fixture({ cleanupFails: true });
  try {
    runtime.updateConfig({ features: { first: { color: "cyan" } } });
    runtime.updateConfig({ features: { first: { color: "red" } } });
    runtime.setFeatureEnabled("first", false);
    runtime.setFeatureEnabled("first", true);
    runtime.start();
    assert.deepEqual(calls, ["cleanup:first"]);
    assert.equal(runtime.getSnapshot().features.first.status, "cleanup-error");
    assert.equal(runtime.getSnapshot().features.first.mounted, false);
    assert.equal(runtime.getSnapshot().features.second.mounted, true);
  } finally { runtime.stop(); }
});

test("partly failed mounts are never repeated by config refresh or idempotent start", () => {
  const { runtime, calls } = fixture({ mountFails: true });
  try {
    runtime.start();
    runtime.updateConfig(runtime.context.config.getNormalized());
    runtime.updateConfig({ features: { second: { color: "cyan" } } });
    assert.deepEqual(calls, ["cleanup:second", "mount:second"]);
    assert.equal(runtime.getSnapshot().features.first.status, "mount-error");
  } finally { runtime.stop(); }
});

test("legacy patches compare normalized values and preserve config revision, events and API snapshots", () => {
  const documentRef = new FakeDocument();
  const calls = [];
  const runtime = createBootstrap({ documentRef, windowRef: createFakeWindow({ documentRef }),
    config: { featureToggles: { checkoutScoreHighlight: true }, features: { checkoutScoreHighlight: { effect: "pulse" } } },
    featureDefinitions: [{ featureKey: "checkout-score-highlight", configKey: "checkoutScoreHighlight", startupTiming: "immediate",
      legacyFeatureKeys: ["checkout-score-pulse"], legacyConfigKeys: ["checkoutScorePulse"],
      mount() { calls.push("mount"); return () => calls.push("cleanup"); } }],
  });
  runtime.start();
  calls.length = 0;
  let events = 0;
  runtime.context.eventBus.on("runtime:config-updated", () => events++);
  const revision = runtime.context.config.getRevision();
  try {
    const snapshot = runtime.updateConfig({ features: { checkoutScorePulse: { effect: "grow-glow" } } });
    assert.deepEqual(calls, []);
    assert.deepEqual(snapshot, runtime.getSnapshot());
    assert.equal(events, 1);
    assert.equal(runtime.context.config.getRevision(), revision + 1);
    runtime.updateConfig({ features: { checkoutScorePulse: { effect: "blink" } } });
    assert.deepEqual(calls, ["cleanup", "mount"]);
    assert.equal(runtime.getSnapshot().features["checkout-score-highlight"].config.effect, "fade-blink");
  } finally { runtime.stop(); }
});
