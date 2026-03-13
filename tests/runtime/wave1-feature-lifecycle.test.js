import test from "node:test";
import assert from "node:assert/strict";

import { createBootstrap } from "../../src/core/bootstrap.js";
import { FakeDocument, createFakeWindow } from "./fake-dom.js";

const FEATURE_CONFIG_KEYS = Object.freeze([
  "checkoutScorePulse",
  "checkoutBoardTargets",
  "tvBoardZoom",
  "styleCheckoutSuggestions",
  "averageTrendArrow",
  "turnStartSweep",
  "tripleDoubleBullHits",
  "cricketHighlighter",
  "cricketGridFx",
  "dartMarkerEmphasis",
  "dartMarkerDarts",
  "removeDartsNotification",
  "singleBullSound",
  "turnPointsCount",
  "winnerFireworks",
]);

function wait(ms = 0) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createSingleFeatureConfig(configKey, featureConfig = {}) {
  const featureToggles = {};
  const features = {};

  FEATURE_CONFIG_KEYS.forEach((key) => {
    const enabled = key === configKey;
    featureToggles[key] = enabled;
    features[key] = { enabled };
  });

  features[configKey] = {
    ...features[configKey],
    ...featureConfig,
    enabled: true,
  };

  return {
    featureToggles,
    features,
  };
}

function runtimeBootstrapAudio(windowRef) {
  if (!windowRef || typeof windowRef !== "object") {
    return;
  }

  if (typeof windowRef.Audio === "function") {
    return;
  }

  windowRef.Audio = class FakeAudio {
    constructor(src = "") {
      this.src = src;
      this.preload = "auto";
      this.volume = 1;
      this.currentTime = 0;
    }

    play() {
      return Promise.resolve();
    }

    pause() {}
  };
}

test("checkout-board-targets mounts idempotently and cleans up style/observer state", async () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  const runtime = createBootstrap({
    windowRef,
    documentRef,
    config: createSingleFeatureConfig("checkoutBoardTargets"),
  });

  runtime.start();
  runtime.start();
  await wait(5);

  assert.equal(Boolean(documentRef.getElementById("ad-ext-checkout-board-style")), true);
  assert.equal(runtime.context.registries.observers.size(), 1);

  runtime.stop();
  assert.equal(Boolean(documentRef.getElementById("ad-ext-checkout-board-style")), false);
  assert.equal(runtime.context.registries.observers.size(), 0);
  assert.equal(runtime.context.registries.listeners.size(), 0);
});

test("style-checkout-suggestions mounts idempotently and removes classes on cleanup", async () => {
  const documentRef = new FakeDocument();
  documentRef.suggestionElement.textContent = "D16";
  const windowRef = createFakeWindow({ documentRef });
  const runtime = createBootstrap({
    windowRef,
    documentRef,
    config: createSingleFeatureConfig("styleCheckoutSuggestions", {
      style: "badge",
      labelText: "CHECKOUT",
      colorTheme: "amber",
    }),
  });

  runtime.start();
  runtime.start();
  await wait(5);

  assert.equal(
    documentRef.suggestionElement.classList.contains("ad-ext-checkout-suggestion"),
    true
  );
  assert.equal(runtime.context.registries.observers.size(), 1);

  runtime.stop();
  assert.equal(
    documentRef.suggestionElement.classList.contains("ad-ext-checkout-suggestion"),
    false
  );
  assert.equal(runtime.context.registries.observers.size(), 0);
});

test("tv-board-zoom registers managed listeners and releases them on cleanup", async () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  const runtime = createBootstrap({
    windowRef,
    documentRef,
    config: createSingleFeatureConfig("tvBoardZoom", {
      zoomLevel: 2.75,
      zoomSpeed: "mittel",
      checkoutZoomEnabled: true,
    }),
  });

  runtime.start();
  runtime.start();
  await wait(5);

  assert.equal(Boolean(documentRef.getElementById("ad-ext-tv-board-zoom-style")), true);
  assert.equal(runtime.context.registries.observers.size(), 1);
  assert.equal(runtime.context.registries.listeners.size(), 5);

  runtime.stop();
  assert.equal(Boolean(documentRef.getElementById("ad-ext-tv-board-zoom-style")), false);
  assert.equal(runtime.context.registries.observers.size(), 0);
  assert.equal(runtime.context.registries.listeners.size(), 0);
});

test("average-trend-arrow mounts idempotently and removes owned style", async () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  const runtime = createBootstrap({
    windowRef,
    documentRef,
    config: createSingleFeatureConfig("averageTrendArrow"),
  });

  runtime.start();
  runtime.start();
  await wait(5);

  assert.equal(Boolean(documentRef.getElementById("autodarts-average-trend-style")), true);
  assert.equal(runtime.context.registries.observers.size(), 1);

  runtime.stop();
  assert.equal(Boolean(documentRef.getElementById("autodarts-average-trend-style")), false);
  assert.equal(runtime.context.registries.observers.size(), 0);
});

test("turn-start-sweep mounts idempotently and cleans style plus observer state", async () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  const runtime = createBootstrap({
    windowRef,
    documentRef,
    config: createSingleFeatureConfig("turnStartSweep", {
      durationMs: 420,
      sweepStyle: "standard",
    }),
  });

  runtime.start();
  runtime.start();
  await wait(5);

  assert.equal(Boolean(documentRef.getElementById("ad-ext-turn-start-sweep-style")), true);
  assert.equal(runtime.context.registries.observers.size(), 1);

  runtime.stop();
  assert.equal(Boolean(documentRef.getElementById("ad-ext-turn-start-sweep-style")), false);
  assert.equal(documentRef.activePlayerRow.classList.contains("ad-ext-turn-start-sweep"), false);
  assert.equal(runtime.context.registries.observers.size(), 0);
});

test("triple-double-bull-hits mounts idempotently and removes decorations on cleanup", async () => {
  const documentRef = new FakeDocument();
  documentRef.throwTextElement.textContent = "T20";
  const windowRef = createFakeWindow({ documentRef });
  const runtime = createBootstrap({
    windowRef,
    documentRef,
    config: createSingleFeatureConfig("tripleDoubleBullHits", {
      colorTheme: "volt-lime",
      animationStyle: "neon-pulse",
    }),
  });

  runtime.start();
  runtime.start();
  await wait(5);

  assert.equal(Boolean(documentRef.getElementById("ad-ext-triple-double-bull-hits-style")), true);
  assert.equal(runtime.context.registries.observers.size(), 1);
  assert.equal(
    documentRef.throwRow.classList.contains("ad-ext-hit-highlight--triple"),
    true
  );

  runtime.stop();
  assert.equal(Boolean(documentRef.getElementById("ad-ext-triple-double-bull-hits-style")), false);
  assert.equal(
    documentRef.throwRow.classList.contains("ad-ext-hit-highlight--triple"),
    false
  );
  assert.equal(runtime.context.registries.observers.size(), 0);
});

test("cricket-highlighter mounts idempotently and releases observers/listeners", async () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "Cricket";
  const windowRef = createFakeWindow({ documentRef });
  const runtime = createBootstrap({
    windowRef,
    documentRef,
    config: createSingleFeatureConfig("cricketHighlighter", {
      showDeadTargets: true,
      colorTheme: "standard",
      intensity: "normal",
    }),
  });

  runtime.start();
  runtime.start();
  await wait(5);

  assert.equal(Boolean(documentRef.getElementById("ad-ext-cricket-highlighter-style")), true);
  assert.equal(runtime.context.registries.observers.size(), 1);
  assert.equal(runtime.context.registries.listeners.size(), 3);

  runtime.stop();
  assert.equal(Boolean(documentRef.getElementById("ad-ext-cricket-highlighter-style")), false);
  assert.equal(runtime.context.registries.observers.size(), 0);
  assert.equal(runtime.context.registries.listeners.size(), 0);
});

test("cricket-grid-fx mounts idempotently and releases observers/listeners", async () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "Cricket";
  const windowRef = createFakeWindow({ documentRef });
  const runtime = createBootstrap({
    windowRef,
    documentRef,
    config: createSingleFeatureConfig("cricketGridFx", {
      rowWave: true,
      colorTheme: "standard",
      intensity: "normal",
    }),
  });

  runtime.start();
  runtime.start();
  await wait(5);

  assert.equal(Boolean(documentRef.getElementById("ad-ext-cricket-grid-fx-style")), true);
  assert.equal(runtime.context.registries.observers.size(), 1);
  assert.equal(runtime.context.registries.listeners.size(), 3);

  runtime.stop();
  assert.equal(Boolean(documentRef.getElementById("ad-ext-cricket-grid-fx-style")), false);
  assert.equal(runtime.context.registries.observers.size(), 0);
  assert.equal(runtime.context.registries.listeners.size(), 0);
});

test("dart-marker-emphasis mounts idempotently and removes style on cleanup", async () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  const runtime = createBootstrap({
    windowRef,
    documentRef,
    config: createSingleFeatureConfig("dartMarkerEmphasis", {
      size: 6,
      color: "rgb(49, 130, 206)",
      effect: "glow",
      opacityPercent: 85,
      outline: "aus",
    }),
  });

  runtime.start();
  runtime.start();
  await wait(5);

  assert.equal(Boolean(documentRef.getElementById("ad-ext-dart-marker-emphasis-style")), true);
  assert.equal(runtime.context.registries.observers.size(), 1);
  assert.equal(runtime.context.registries.listeners.size(), 1);

  runtime.stop();
  assert.equal(Boolean(documentRef.getElementById("ad-ext-dart-marker-emphasis-style")), false);
  assert.equal(runtime.context.registries.observers.size(), 0);
  assert.equal(runtime.context.registries.listeners.size(), 0);
});

test("dart-marker-darts mounts idempotently and removes style on cleanup", async () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  const runtime = createBootstrap({
    windowRef,
    documentRef,
    config: createSingleFeatureConfig("dartMarkerDarts", {
      design: "autodarts",
      animateDarts: true,
      sizePercent: 100,
      hideOriginalMarkers: false,
      flightSpeed: "standard",
    }),
  });

  runtime.start();
  runtime.start();
  await wait(5);

  assert.equal(Boolean(documentRef.getElementById("ad-ext-dart-marker-darts-style")), true);
  assert.equal(runtime.context.registries.observers.size(), 1);
  assert.equal(runtime.context.registries.listeners.size(), 5);

  runtime.stop();
  assert.equal(Boolean(documentRef.getElementById("ad-ext-dart-marker-darts-style")), false);
  assert.equal(runtime.context.registries.observers.size(), 0);
  assert.equal(runtime.context.registries.listeners.size(), 0);
});

test("remove-darts-notification mounts idempotently and removes style on cleanup", async () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  const runtime = createBootstrap({
    windowRef,
    documentRef,
    config: createSingleFeatureConfig("removeDartsNotification", {
      imageSize: "standard",
      pulseAnimation: true,
      pulseScale: 1.04,
    }),
  });

  runtime.start();
  runtime.start();
  await wait(5);

  assert.equal(Boolean(documentRef.getElementById("ad-ext-remove-darts-notification-style")), true);
  assert.equal(runtime.context.registries.observers.size(), 1);

  runtime.stop();
  assert.equal(Boolean(documentRef.getElementById("ad-ext-remove-darts-notification-style")), false);
  assert.equal(runtime.context.registries.observers.size(), 0);
  assert.equal(runtime.context.registries.listeners.size(), 0);
});

test("single-bull-sound mounts idempotently and releases observers/listeners", async () => {
  const documentRef = new FakeDocument();
  documentRef.throwTextElement.textContent = "S25";
  const windowRef = createFakeWindow({ documentRef });
  runtimeBootstrapAudio(windowRef);
  const runtime = createBootstrap({
    windowRef,
    documentRef,
    config: createSingleFeatureConfig("singleBullSound", {
      volume: 0.9,
      cooldownMs: 700,
      pollIntervalMs: 0,
    }),
  });

  runtime.start();
  runtime.start();
  await wait(5);

  assert.equal(runtime.context.registries.observers.size(), 1);
  assert.equal(runtime.context.registries.listeners.size(), 3);

  runtime.stop();
  assert.equal(runtime.context.registries.observers.size(), 0);
  assert.equal(runtime.context.registries.listeners.size(), 0);
});

test("turn-points-count mounts idempotently and keeps managed observer state", async () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  const runtime = createBootstrap({
    windowRef,
    documentRef,
    config: createSingleFeatureConfig("turnPointsCount", {
      durationMs: 416,
    }),
  });

  runtime.start();
  runtime.start();
  await wait(5);

  assert.equal(runtime.context.registries.observers.size(), 1);
  assert.equal(runtime.context.registries.listeners.size(), 1);

  runtime.stop();
  assert.equal(runtime.context.registries.observers.size(), 0);
  assert.equal(runtime.context.registries.listeners.size(), 0);
});

test("winner-fireworks mounts idempotently and removes overlay/style on cleanup", async () => {
  const documentRef = new FakeDocument();
  documentRef.winnerNode.classList.add("ad-ext-player-winner");
  const windowRef = createFakeWindow({ documentRef });
  const runtime = createBootstrap({
    windowRef,
    documentRef,
    config: createSingleFeatureConfig("winnerFireworks", {
      style: "realistic",
      colorTheme: "autodarts",
      intensity: "standard",
      includeBullOut: true,
      pointerDismiss: true,
    }),
  });

  runtime.start();
  runtime.start();
  await wait(5);

  assert.equal(Boolean(documentRef.getElementById("ad-ext-winner-fireworks-style")), true);
  assert.equal(runtime.context.registries.observers.size(), 1);
  assert.equal(runtime.context.registries.listeners.size(), 3);

  runtime.stop();
  assert.equal(Boolean(documentRef.getElementById("ad-ext-winner-fireworks-style")), false);
  assert.equal(Boolean(documentRef.getElementById("ad-ext-winner-fireworks")), false);
  assert.equal(runtime.context.registries.observers.size(), 0);
  assert.equal(runtime.context.registries.listeners.size(), 0);
});
