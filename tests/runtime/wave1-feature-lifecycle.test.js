import test from "node:test";
import assert from "node:assert/strict";

import { createBootstrap } from "../../src/core/bootstrap.js";
import { FakeDocument, createFakeWindow } from "./fake-dom.js";

const FEATURE_CONFIG_KEYS = Object.freeze([
  "checkoutScoreHighlight",
  "checkoutTargetHighlights",
  "tvBoardZoom",
  "checkoutSuggestionStyles",
  "avgTrendArrow",
  "activePlayerSweep",
  "specialHitHighlights",
  "cricketTargetHighlighter",
  "cricketGridStatusEffects",
  "dartboardMarkerHighlight",
  "dartMarkerReplacer",
  "takeOutDartsAlert",
  "singleBullHitSound",
  "turnScoreCounter",
  "x01RemainingScoreBar",
  "winnerCelebrationEffect",
]);

function wait(ms = 0) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitFor(check, { timeoutMs = 160, intervalMs = 5 } = {}) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() <= deadline) {
    if (check()) {
      return;
    }
    await wait(intervalMs);
  }
  throw new Error("Condition was not met within the expected time.");
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

function createFeatureConfig(configEntries = {}) {
  const featureToggles = {};
  const features = {};

  FEATURE_CONFIG_KEYS.forEach((key) => {
    const featureConfig = configEntries[key];
    const enabled = Boolean(featureConfig);
    featureToggles[key] = enabled;
    features[key] = {
      ...featureConfig,
      enabled,
    };
  });

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

    pause() {
      return undefined;
    }
  };
}

test("checkout-target-highlights mounts idempotently and cleans up style/observer state", async () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  const runtime = createBootstrap({
    windowRef,
    documentRef,
    config: createSingleFeatureConfig("checkoutTargetHighlights"),
  });

  runtime.start();
  runtime.start();
  await wait(25);

  assert.equal(Boolean(documentRef.getElementById("ad-ext-checkout-board-style")), true);
  assert.equal(runtime.context.registries.observers.size(), 1);

  runtime.stop();
  assert.equal(Boolean(documentRef.getElementById("ad-ext-checkout-board-style")), false);
  assert.equal(runtime.context.registries.observers.size(), 0);
  assert.equal(runtime.context.registries.listeners.size(), 0);
});

test("checkout-suggestion-styles mounts idempotently and removes classes on cleanup", async () => {
  const documentRef = new FakeDocument();
  documentRef.suggestionElement.textContent = "D16";
  const windowRef = createFakeWindow({ documentRef });
  const runtime = createBootstrap({
    windowRef,
    documentRef,
    config: createSingleFeatureConfig("checkoutSuggestionStyles", {
      style: "badge",
      labelText: "CHECKOUT",
      colorTheme: "amber",
    }),
  });

  runtime.start();
  runtime.start();
  await wait(25);

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

test("avg-trend-arrow mounts idempotently and removes owned style", async () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  const runtime = createBootstrap({
    windowRef,
    documentRef,
    config: createSingleFeatureConfig("avgTrendArrow"),
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

test("active-player-sweep mounts idempotently and cleans style plus observer state", async () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  const runtime = createBootstrap({
    windowRef,
    documentRef,
    config: createSingleFeatureConfig("activePlayerSweep", {
      durationMs: 420,
      sweepStyle: "standard",
    }),
  });

  runtime.start();
  runtime.start();
  await wait(5);

  assert.equal(Boolean(documentRef.getElementById("ad-ext-active-player-sweep-style")), true);
  assert.equal(runtime.context.registries.observers.size(), 1);

  runtime.stop();
  assert.equal(Boolean(documentRef.getElementById("ad-ext-active-player-sweep-style")), false);
  assert.equal(documentRef.activePlayerRow.classList.contains("ad-ext-active-player-sweep"), false);
  assert.equal(runtime.context.registries.observers.size(), 0);
});

test("special-hit-highlights mounts idempotently and removes decorations on cleanup", async () => {
  const documentRef = new FakeDocument();
  documentRef.throwTextElement.textContent = "T20";
  const windowRef = createFakeWindow({ documentRef });
  const runtime = createBootstrap({
    windowRef,
    documentRef,
    config: createSingleFeatureConfig("specialHitHighlights", {
      colorTheme: "volt-lime",
      animationStyle: "pulse",
    }),
  });

  runtime.start();
  runtime.start();
  await wait(25);
  await waitFor(() => documentRef.throwRow.classList.contains("ad-ext-hit-highlight--triple"));

  assert.equal(Boolean(documentRef.getElementById("ad-ext-special-hit-highlights-style")), true);
  assert.equal(runtime.context.registries.observers.size(), 1);
  assert.equal(
    documentRef.throwRow.classList.contains("ad-ext-hit-highlight--triple"),
    true
  );

  runtime.stop();
  assert.equal(Boolean(documentRef.getElementById("ad-ext-special-hit-highlights-style")), false);
  assert.equal(
    documentRef.throwRow.classList.contains("ad-ext-hit-highlight--triple"),
    false
  );
  assert.equal(runtime.context.registries.observers.size(), 0);
});

test("cricket-target-highlighter mounts idempotently and releases observers/listeners", async () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "Cricket";
  const windowRef = createFakeWindow({ documentRef });
  const runtime = createBootstrap({
    windowRef,
    documentRef,
    config: createSingleFeatureConfig("cricketTargetHighlighter", {
      showDeadTargets: true,
      colorTheme: "standard",
      intensity: "normal",
    }),
  });

  runtime.start();
  runtime.start();
  await wait(5);

  assert.equal(Boolean(documentRef.getElementById("ad-ext-cricket-target-highlighter-style")), true);
  assert.equal(runtime.context.registries.observers.size(), 1);
  assert.equal(runtime.context.registries.listeners.size(), 3);

  runtime.stop();
  assert.equal(Boolean(documentRef.getElementById("ad-ext-cricket-target-highlighter-style")), false);
  assert.equal(runtime.context.registries.observers.size(), 0);
  assert.equal(runtime.context.registries.listeners.size(), 0);
});

test("cricket-grid-status-effects mounts idempotently and releases observers/listeners", async () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "Cricket";
  const windowRef = createFakeWindow({ documentRef });
  const runtime = createBootstrap({
    windowRef,
    documentRef,
    config: createSingleFeatureConfig("cricketGridStatusEffects", {
      rowWave: true,
      colorTheme: "standard",
      intensity: "normal",
    }),
  });

  runtime.start();
  runtime.start();
  await wait(5);

  assert.equal(Boolean(documentRef.getElementById("ad-ext-cricket-grid-status-effects-style")), true);
  assert.equal(runtime.context.registries.observers.size(), 1);
  assert.equal(runtime.context.registries.listeners.size(), 3);

  runtime.stop();
  assert.equal(Boolean(documentRef.getElementById("ad-ext-cricket-grid-status-effects-style")), false);
  assert.equal(runtime.context.registries.observers.size(), 0);
  assert.equal(runtime.context.registries.listeners.size(), 0);
});

test("cricket-target-highlighter and cricket-grid-status-effects share one runtime observer/listener stack", async () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "Cricket";
  const windowRef = createFakeWindow({ documentRef });
  const runtime = createBootstrap({
    windowRef,
    documentRef,
    config: createFeatureConfig({
      cricketTargetHighlighter: {
        showDeadTargets: true,
        colorTheme: "standard",
        intensity: "normal",
      },
      cricketGridStatusEffects: {
        rowWave: true,
        colorTheme: "standard",
        intensity: "normal",
      },
    }),
  });

  runtime.start();
  await wait(25);
  await waitFor(() => Boolean(documentRef.getElementById("ad-ext-cricket-grid-status-effects-style")));

  assert.equal(Boolean(documentRef.getElementById("ad-ext-cricket-target-highlighter-style")), true);
  assert.equal(Boolean(documentRef.getElementById("ad-ext-cricket-grid-status-effects-style")), true);
  assert.equal(runtime.context.registries.observers.size(), 1);
  assert.equal(runtime.context.registries.listeners.size(), 3);
  assert.ok(runtime.context.registries.observers.get("cricket-target-highlighter:dom-observer"));
  assert.ok(runtime.context.registries.observers.get("cricket-grid-status-effects:dom-observer"));

  runtime.stop();
  assert.equal(runtime.context.registries.observers.size(), 0);
  assert.equal(runtime.context.registries.listeners.size(), 0);
});

test("dartboard-marker-highlight mounts idempotently and removes style on cleanup", async () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  const runtime = createBootstrap({
    windowRef,
    documentRef,
    config: createSingleFeatureConfig("dartboardMarkerHighlight", {
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

  assert.equal(Boolean(documentRef.getElementById("ad-ext-dartboard-marker-highlight-style")), true);
  assert.equal(runtime.context.registries.observers.size(), 1);
  assert.equal(runtime.context.registries.listeners.size(), 1);

  runtime.stop();
  assert.equal(Boolean(documentRef.getElementById("ad-ext-dartboard-marker-highlight-style")), false);
  assert.equal(runtime.context.registries.observers.size(), 0);
  assert.equal(runtime.context.registries.listeners.size(), 0);
});

test("dart-marker-replacer mounts idempotently and removes style on cleanup", async () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  const runtime = createBootstrap({
    windowRef,
    documentRef,
    config: createSingleFeatureConfig("dartMarkerReplacer", {
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

  assert.equal(Boolean(documentRef.getElementById("ad-ext-dart-marker-replacer-style")), true);
  assert.equal(runtime.context.registries.observers.size(), 1);
  assert.equal(runtime.context.registries.listeners.size(), 5);

  runtime.stop();
  assert.equal(Boolean(documentRef.getElementById("ad-ext-dart-marker-replacer-style")), false);
  assert.equal(runtime.context.registries.observers.size(), 0);
  assert.equal(runtime.context.registries.listeners.size(), 0);
});

test("take-out-darts-alert mounts idempotently and removes style on cleanup", async () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  const runtime = createBootstrap({
    windowRef,
    documentRef,
    config: createSingleFeatureConfig("takeOutDartsAlert", {
      imageSize: "standard",
      pulseAnimation: true,
      pulseScale: 1.04,
    }),
  });

  runtime.start();
  runtime.start();
  await wait(5);

  assert.equal(Boolean(documentRef.getElementById("ad-ext-take-out-darts-alert-style")), true);
  assert.equal(runtime.context.registries.observers.size(), 1);

  runtime.stop();
  assert.equal(Boolean(documentRef.getElementById("ad-ext-take-out-darts-alert-style")), false);
  assert.equal(runtime.context.registries.observers.size(), 0);
  assert.equal(runtime.context.registries.listeners.size(), 0);
});

test("single-bull-hit-sound mounts idempotently and releases observers/listeners", async () => {
  const documentRef = new FakeDocument();
  documentRef.throwTextElement.textContent = "S25";
  const windowRef = createFakeWindow({ documentRef });
  runtimeBootstrapAudio(windowRef);
  const runtime = createBootstrap({
    windowRef,
    documentRef,
    config: createSingleFeatureConfig("singleBullHitSound", {
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

test("turn-score-counter mounts idempotently and keeps managed observer state", async () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  const runtime = createBootstrap({
    windowRef,
    documentRef,
    config: createSingleFeatureConfig("turnScoreCounter", {
      durationMs: 416,
    }),
  });

  runtime.start();
  runtime.start();
  await wait(5);

  assert.equal(Boolean(documentRef.getElementById("ad-ext-turn-score-counter-style")), true);
  assert.equal(runtime.context.registries.observers.size(), 1);
  assert.equal(runtime.context.registries.listeners.size(), 1);

  runtime.stop();
  assert.equal(Boolean(documentRef.getElementById("ad-ext-turn-score-counter-style")), false);
  assert.equal(runtime.context.registries.observers.size(), 0);
  assert.equal(runtime.context.registries.listeners.size(), 0);
});

test("x01-remaining-score-bar mounts idempotently and removes style on cleanup", async () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "501";
  const windowRef = createFakeWindow({ documentRef, href: "https://play.autodarts.io/matches/test" });
  const runtime = createBootstrap({
    windowRef,
    documentRef,
    config: createSingleFeatureConfig("x01RemainingScoreBar"),
  });

  runtime.start();
  runtime.start();
  await wait(5);

  assert.equal(Boolean(documentRef.getElementById("ad-ext-x01-remaining-score-bar-style")), true);
  assert.equal(runtime.context.registries.observers.size(), 1);
  assert.equal(runtime.context.registries.listeners.size(), 0);

  runtime.stop();
  assert.equal(Boolean(documentRef.getElementById("ad-ext-x01-remaining-score-bar-style")), false);
  assert.equal(runtime.context.registries.observers.size(), 0);
  assert.equal(runtime.context.registries.listeners.size(), 0);
});

test("winner-celebration-effect mounts idempotently and removes overlay/style on cleanup", async () => {
  const documentRef = new FakeDocument();
  documentRef.winnerNode.classList.add("ad-ext-player-winner");
  const windowRef = createFakeWindow({ documentRef });
  const runtime = createBootstrap({
    windowRef,
    documentRef,
    config: createSingleFeatureConfig("winnerCelebrationEffect", {
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

  assert.equal(Boolean(documentRef.getElementById("ad-ext-winner-celebration-effect-style")), true);
  assert.equal(runtime.context.registries.observers.size(), 1);
  assert.equal(runtime.context.registries.listeners.size(), 3);

  runtime.stop();
  assert.equal(Boolean(documentRef.getElementById("ad-ext-winner-celebration-effect-style")), false);
  assert.equal(Boolean(documentRef.getElementById("ad-ext-winner-celebration-effect")), false);
  assert.equal(runtime.context.registries.observers.size(), 0);
  assert.equal(runtime.context.registries.listeners.size(), 0);
});
