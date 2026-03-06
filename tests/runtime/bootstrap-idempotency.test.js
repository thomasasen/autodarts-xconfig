import test from "node:test";
import assert from "node:assert/strict";

import { createBootstrap, initializeRuntime } from "../../src/core/bootstrap.js";
import { HIGHLIGHT_CLASS, STYLE_ID } from "../../src/features/checkout-score-pulse/style.js";
import { FakeDocument, createFakeWindow } from "./fake-dom.js";

function wait(ms = 0) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

test("bootstrap start/stop are idempotent and keep a single runtime namespace", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });

  const runtime = createBootstrap({
    windowRef,
    documentRef,
    config: {
      featureToggles: { checkoutScorePulse: false },
      features: {
        checkoutScorePulse: {
          enabled: false,
        },
      },
    },
  });

  runtime.start();
  runtime.start();

  let snapshot = runtime.getSnapshot();
  assert.equal(snapshot.started, true);
  assert.equal(snapshot.features["checkout-score-pulse"].mounted, false);

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
  documentRef.activeScoreElement.textContent = "170";

  const windowRef = createFakeWindow({ documentRef });

  const runtime = createBootstrap({
    windowRef,
    documentRef,
    config: {
      featureToggles: { checkoutScorePulse: true },
      features: {
        checkoutScorePulse: {
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
  await wait(5);

  assert.equal(documentRef.activeScoreElement.classList.contains(HIGHLIGHT_CLASS), true);
  assert.equal(Boolean(documentRef.getElementById(STYLE_ID)), true);
  assert.equal(runtime.context.registries.observers.size(), 1);
  assert.deepEqual(
    runtime.context.registries.observers
      .get("checkout-score-pulse:dom-observer")
      .observeCalls[0].options.attributeFilter,
    ["class"]
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
  documentRef.activeScoreElement.textContent = "170";

  const windowRef = createFakeWindow({ documentRef });

  const runtime = createBootstrap({
    windowRef,
    documentRef,
    config: {
      featureToggles: { checkoutScorePulse: true },
      features: {
        checkoutScorePulse: {
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
  await wait(5);

  assert.equal(documentRef.activeScoreElement.classList.contains("ad-ext-checkout-possible--scale"), true);
  assert.equal(runtime.context.registries.observers.size(), 1);

  runtime.updateConfig({
    features: {
      checkoutScorePulse: {
        effect: "blink",
      },
    },
  });
  await wait(5);

  assert.equal(documentRef.activeScoreElement.classList.contains("ad-ext-checkout-possible--scale"), false);
  assert.equal(documentRef.activeScoreElement.classList.contains("ad-ext-checkout-possible--blink"), true);
  assert.equal(runtime.context.registries.observers.size(), 1);
  assert.equal(windowRef.__adXConfig.inspect().observerCount, 1);
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
});
