import test from "node:test";
import assert from "node:assert/strict";

import { createBootstrap, initializeRuntime } from "../../src/core/bootstrap.js";
import { HIGHLIGHT_CLASS, STYLE_ID } from "../../src/features/checkout-score-highlight/style.js";
import { FakeDocument, createFakeTimerHarness, createFakeWindow } from "./fake-dom.js";

function wait(ms = 0) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitFor(check, { timeoutMs = 160, intervalMs = 5 } = {}) {
  const deadline = Date.now() + Math.max(0, Number(timeoutMs) || 0);
  while (Date.now() < deadline) {
    if (check()) {
      return true;
    }
    await wait(intervalMs);
  }
  return Boolean(check());
}

test("bootstrap start/stop are idempotent and keep a single runtime namespace", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });

  const runtime = createBootstrap({
    windowRef,
    documentRef,
    config: {
      featureToggles: { checkoutScoreHighlight: false },
      features: {
        checkoutScoreHighlight: {
          enabled: false,
        },
      },
    },
  });

  runtime.start();
  runtime.start();

  let snapshot = runtime.getSnapshot();
  assert.equal(snapshot.started, true);
  assert.equal(snapshot.features["checkout-score-highlight"].mounted, false);

  runtime.stop();
  runtime.stop();

  snapshot = runtime.getSnapshot();
  assert.equal(snapshot.started, false);

  assert.equal(typeof windowRef.__adXConfig, "object");
  assert.equal(windowRef.__adXConfig.started, false);
  assert.equal(typeof windowRef.__adXConfig.context, "undefined");
  assert.equal(typeof windowRef.__adXConfig.inspect, "function");
});

test("feature mount/unmount cycle does not leak DOM highlight artifacts", async () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "X01";
  documentRef.suggestionElement.textContent = "";
  documentRef.activeScoreElement.textContent = "40";

  const windowRef = createFakeWindow({ documentRef });

  const runtime = createBootstrap({
    windowRef,
    documentRef,
    config: {
      featureToggles: { checkoutScoreHighlight: true, x01BustActivePlayerHighlight: false },
      features: {
        checkoutScoreHighlight: {
          enabled: true,
          effect: "scale",
          triggerSource: "score-only",
          intensity: "standard",
          colorTheme: "159, 219, 88",
        },
      },
    },
  });

  runtime.start();
  assert.equal(
    await waitFor(() => documentRef.activeScoreElement.classList.contains(HIGHLIGHT_CLASS)),
    true
  );

  assert.equal(documentRef.activeScoreElement.classList.contains(HIGHLIGHT_CLASS), true);
  assert.equal(Boolean(documentRef.getElementById(STYLE_ID)), true);
  assert.equal(runtime.context.registries.observers.size(), 1);
  assert.equal(
    runtime.context.registries.observers.get("checkout-score-highlight:dom-observer:surface"),
    null
  );
  assert.deepEqual(
    runtime.context.registries.observers
      .get("checkout-score-highlight:dom-observer:lifecycle")
      .observeCalls[0].options,
    { childList: true, subtree: true }
  );

  runtime.stop();

  assert.equal(documentRef.activeScoreElement.classList.contains(HIGHLIGHT_CLASS), false);
  assert.equal(Boolean(documentRef.getElementById(STYLE_ID)), false);
  assert.equal(runtime.context.registries.observers.size(), 0);
  assert.equal(runtime.context.registries.listeners.size(), 0);
});

test("config updates remount affected mounted features without duplicating observers", async () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "X01";
  documentRef.suggestionElement.textContent = "";
  documentRef.activeScoreElement.textContent = "40";

  const windowRef = createFakeWindow({ documentRef });

  const runtime = createBootstrap({
    windowRef,
    documentRef,
    config: {
      featureToggles: { checkoutScoreHighlight: true, x01BustActivePlayerHighlight: false },
      features: {
        checkoutScoreHighlight: {
          enabled: true,
          effect: "scale",
          triggerSource: "score-only",
          intensity: "standard",
          colorTheme: "159, 219, 88",
        },
      },
    },
  });

  runtime.start();
  assert.equal(
    await waitFor(() => documentRef.activeScoreElement.classList.contains("ad-ext-checkout-possible--grow-only")),
    true
  );

  assert.equal(documentRef.activeScoreElement.classList.contains("ad-ext-checkout-possible--grow-only"), true);
  assert.equal(runtime.context.registries.observers.size(), 1);

  runtime.updateConfig({
    features: {
      checkoutScoreHighlight: {
        effect: "blink",
      },
    },
  });
  assert.equal(
    await waitFor(() => documentRef.activeScoreElement.classList.contains("ad-ext-checkout-possible--fade-blink")),
    true
  );

  assert.equal(documentRef.activeScoreElement.classList.contains("ad-ext-checkout-possible--grow-only"), false);
  assert.equal(documentRef.activeScoreElement.classList.contains("ad-ext-checkout-possible--fade-blink"), true);
  assert.equal(runtime.context.registries.observers.size(), 1);
  assert.equal(windowRef.__adXConfig.inspect().observerCount, 1);

  runtime.stop();
});

test("initializeRuntime starts an existing namespace-backed runtime", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });

  const runtime = createBootstrap({
    windowRef,
    documentRef,
  });

  assert.equal(runtime.getSnapshot().started, false);

  const initialized = initializeRuntime({ windowRef, documentRef });

  assert.equal(initialized.started, true);
  assert.equal(runtime.getSnapshot().started, true);

  initialized.stop();
});

test("bootstrap resolves feature references by config key for toggle and action APIs", async () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });

  const runtime = createBootstrap({
    windowRef,
    documentRef,
    featureDefinitions: [
      {
        featureKey: "custom-feature",
        configKey: "custom.group.flag",
        mount: () => () => {},
        runAction: ({ actionId, actionTarget }) =>
          `handled:${String(actionId || "")}:${actionTarget?.id || ""}`,
      },
    ],
  });

  runtime.start();

  const enabled = runtime.setFeatureEnabled("custom.group.flag", true);
  assert.equal(enabled, true);
  assert.equal(runtime.getSnapshot().features["custom-feature"].enabled, true);

  const actionResult = await runtime.runFeatureAction("custom.group.flag", "ping", {
    actionTarget: { id: "inline-demo" },
  });
  assert.equal(actionResult, "handled:ping:inline-demo");

  runtime.stop();
});

test("bootstrap defers non-critical startup features while mounting immediate features synchronously", () => {
  const timerHarness = createFakeTimerHarness();
  const documentRef = new FakeDocument();
  const windowRef = timerHarness.installOnWindow(createFakeWindow({ documentRef }));
  const mounts = [];

  const runtime = createBootstrap({
    windowRef,
    documentRef,
    config: {
      featureToggles: {
        immediateFeature: true,
        deferredFeature: true,
      },
      features: {
        immediateFeature: { enabled: true },
        deferredFeature: { enabled: true },
      },
    },
    featureDefinitions: [
      {
        featureKey: "immediate-feature",
        configKey: "immediateFeature",
        startupTiming: "immediate",
        mount: () => {
          mounts.push("immediate-mount");
          return () => mounts.push("immediate-unmount");
        },
      },
      {
        featureKey: "deferred-feature",
        configKey: "deferredFeature",
        startupTiming: "deferred",
        mount: () => {
          mounts.push("deferred-mount");
          return () => mounts.push("deferred-unmount");
        },
      },
    ],
  });

  runtime.start();

  assert.deepEqual(mounts, ["immediate-mount"]);
  assert.equal(runtime.getSnapshot().features["immediate-feature"].mounted, true);
  assert.equal(runtime.getSnapshot().features["deferred-feature"].mounted, false);

  timerHarness.flush();

  assert.deepEqual(mounts, ["immediate-mount", "deferred-mount"]);
  assert.equal(runtime.getSnapshot().features["deferred-feature"].mounted, true);

  runtime.stop();
});

test("bootstrap cancels deferred startup mounts when stopped before timers flush", () => {
  const timerHarness = createFakeTimerHarness();
  const documentRef = new FakeDocument();
  const windowRef = timerHarness.installOnWindow(createFakeWindow({ documentRef }));
  const mounts = [];

  const runtime = createBootstrap({
    windowRef,
    documentRef,
    config: {
      featureToggles: {
        deferredFeature: true,
      },
      features: {
        deferredFeature: { enabled: true },
      },
    },
    featureDefinitions: [
      {
        featureKey: "deferred-feature",
        configKey: "deferredFeature",
        startupTiming: "deferred",
        mount: () => {
          mounts.push("deferred-mount");
          return () => mounts.push("deferred-unmount");
        },
      },
    ],
  });

  runtime.start();
  runtime.stop();
  timerHarness.runAll();

  assert.deepEqual(mounts, []);
  assert.equal(runtime.getSnapshot().features["deferred-feature"].mounted, false);
});

test("features enabled after startup mount immediately even when marked deferred", () => {
  const timerHarness = createFakeTimerHarness();
  const documentRef = new FakeDocument();
  const windowRef = timerHarness.installOnWindow(createFakeWindow({ documentRef }));
  const mounts = [];

  const runtime = createBootstrap({
    windowRef,
    documentRef,
    config: {
      featureToggles: {
        deferredFeature: false,
      },
      features: {
        deferredFeature: { enabled: false },
      },
    },
    featureDefinitions: [
      {
        featureKey: "deferred-feature",
        configKey: "deferredFeature",
        startupTiming: "deferred",
        mount: () => {
          mounts.push("deferred-mount");
          return () => mounts.push("deferred-unmount");
        },
      },
    ],
  });

  runtime.start();
  assert.deepEqual(mounts, []);

  runtime.setFeatureEnabled("deferred-feature", true);

  assert.deepEqual(mounts, ["deferred-mount"]);
  assert.equal(runtime.getSnapshot().features["deferred-feature"].mounted, true);

  runtime.stop();
});
