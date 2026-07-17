import test from "node:test";
import assert from "node:assert/strict";

import { CONFIG_STORAGE_KEY } from "../../src/config/config-store.js";
import { defaultFeatureDefinitions } from "../../src/features/feature-registry.js";
import { initializeTampermonkeyRuntime } from "../../src/runtime/bootstrap-runtime.js";
import { FakeEvent, FakeStorage, FakeDocument, createFakeWindow } from "./fake-dom.js";

function wait(ms = 0) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitFor(check, { timeoutMs = 120, intervalMs = 4 } = {}) {
  const deadline = Date.now() + Math.max(0, Number(timeoutMs) || 0);
  while (Date.now() < deadline) {
    if (check()) {
      return true;
    }
    await wait(intervalMs);
  }
  return Boolean(check());
}

function getStoredFeatureConfig(storedConfig, configKey) {
  if (String(configKey || "").startsWith("themes.")) {
    const themeKey = String(configKey).split(".")[1];
    return storedConfig.features?.themes?.[themeKey] || null;
  }

  return storedConfig.features?.[configKey] || null;
}

function countWindowListeners(windowRef, type) {
  return Array.isArray(windowRef?.__eventTarget?._listeners)
    ? windowRef.__eventTarget._listeners.filter((record) => record.type === type).length
    : 0;
}

test("initializeTampermonkeyRuntime is idempotent and reuses the namespace", async () => {
  const localStorage = new FakeStorage();
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef, localStorage });

  const first = await initializeTampermonkeyRuntime({ windowRef, documentRef });
  const second = await initializeTampermonkeyRuntime({ windowRef, documentRef });

  assert.equal(first, second);
  assert.equal(typeof windowRef.__adXConfig.listFeatures, "function");
  assert.equal(windowRef.__adXConfig.inspect().observerCount >= 1, true);

  first.stop();
});

test("parallel runtime initialization shares one startup promise and one namespace", async () => {
  const localStorage = new FakeStorage();
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef, localStorage });

  const [first, second] = await Promise.all([
    initializeTampermonkeyRuntime({ windowRef, documentRef }),
    initializeTampermonkeyRuntime({ windowRef, documentRef }),
  ]);

  assert.equal(first, second);
  assert.equal(typeof windowRef.__adXConfig.start, "function");
  assert.equal(windowRef.__adXConfig.inspect().observerCount >= 1, true);

  first.stop();
});

test("runtime removes storage sync listener when stopped", async () => {
  const localStorage = new FakeStorage();
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef, localStorage });

  const initialStorageListeners = countWindowListeners(windowRef, "storage");
  const runtime = await initializeTampermonkeyRuntime({ windowRef, documentRef });

  assert.equal(countWindowListeners(windowRef, "storage"), initialStorageListeners + 1);

  runtime.stop();

  assert.equal(countWindowListeners(windowRef, "storage"), initialStorageListeners);
});

test("runtime public config API persists updates and survives feature toggles", async () => {
  const localStorage = new FakeStorage();
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "X01";
  documentRef.activeScoreElement.textContent = "40";

  const windowRef = createFakeWindow({ documentRef, localStorage });
  const originalSetTimeout = windowRef.setTimeout.bind(windowRef);
  windowRef.setTimeout = (callback, ms, ...args) => {
    return originalSetTimeout(callback, Math.min(Number(ms) || 0, 15), ...args);
  };
  windowRef.confetti = function fakeConfetti() {};
  const runtime = await initializeTampermonkeyRuntime({ windowRef, documentRef });

  await wait(5);

  let storedConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));
  assert.equal(storedConfig.features.checkoutScoreHighlight.effect, "grow-only");

  await runtime.saveConfig({
    features: {
      checkoutScoreHighlight: {
        effect: "blink",
      },
    },
  });
  await wait(5);

  storedConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));
  assert.equal(storedConfig.features.checkoutScoreHighlight.effect, "fade-blink");
  assert.equal(documentRef.activeScoreElement.classList.contains("ad-ext-checkout-possible--fade-blink"), true);

  await runtime.setFeatureEnabled("checkout-score-highlight", false);
  await wait(5);

  storedConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));
  assert.equal(storedConfig.featureToggles.checkoutScoreHighlight, false);
  assert.equal(runtime.getSnapshot().features["checkout-score-highlight"].mounted, false);

  await runtime.setFeatureEnabled("active-player-sweep", true);
  await wait(5);
  storedConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));
  assert.equal(storedConfig.featureToggles.activePlayerSweep, true);
  assert.equal(runtime.getSnapshot().features["active-player-sweep"].mounted, true);

  await runtime.setFeatureEnabled("special-hit-highlights", true);
  await wait(5);
  storedConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));
  assert.equal(storedConfig.featureToggles.specialHitHighlights, true);
  assert.equal(runtime.getSnapshot().features["special-hit-highlights"].mounted, true);

  await runtime.setFeatureEnabled("turn-score-counter", true);
  await wait(5);
  storedConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));
  assert.equal(storedConfig.featureToggles.turnScoreCounter, true);
  assert.equal(runtime.getSnapshot().features["turn-score-counter"].mounted, true);

  await runtime.setFeatureEnabled("x01-remaining-score-bar", true);
  await wait(5);
  storedConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));
  assert.equal(storedConfig.featureToggles.x01RemainingScoreBar, true);
  assert.equal(runtime.getSnapshot().features["x01-remaining-score-bar"].mounted, true);

  await runtime.setFeatureEnabled("winner-celebration-effect", true);
  await wait(5);
  storedConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));
  assert.equal(storedConfig.featureToggles.winnerCelebrationEffect, true);
  assert.equal(runtime.getSnapshot().features["winner-celebration-effect"].mounted, true);

  const previewResult = await runtime.runFeatureAction("winner-celebration-effect", "preview");
  assert.equal(previewResult.ok, true);
  assert.equal(
    await waitFor(() => Boolean(documentRef.getElementById("ad-ext-winner-celebration-effect-preview"))),
    true
  );
  assert.equal(
    await waitFor(
      () => documentRef.getElementById("ad-ext-winner-celebration-effect-preview") === null,
      { timeoutMs: 220, intervalMs: 5 }
    ),
    true
  );

  await runtime.setFeatureEnabled("theme-x01", true);
  await wait(5);
  storedConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));
  assert.equal(storedConfig.featureToggles["themes.x01"], true);
  assert.equal(storedConfig.features.themes.x01.enabled, true);
  assert.equal(runtime.getSnapshot().features["theme-x01"].mounted, true);

  await runtime.setFeatureEnabled("theme-x01-2player", true);
  await wait(5);
  storedConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));
  assert.equal(storedConfig.featureToggles["themes.x01TwoPlayer"], true);
  assert.equal(storedConfig.features.themes.x01TwoPlayer.enabled, true);
  assert.equal(runtime.getSnapshot().features["theme-x01-2player"].mounted, true);

  await runtime.setThemeBackgroundImage("x01", "data:image/png;base64,AAAA");
  await wait(5);
  storedConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));
  assert.equal(storedConfig.features.themes.x01.backgroundImageDataUrl, "data:image/png;base64,AAAA");

  await runtime.setThemeBackgroundImage("gotcha", "data:image/png;base64,CCCC");
  await wait(5);
  storedConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));
  assert.equal(storedConfig.features.themes.gotcha.backgroundImageDataUrl, "data:image/png;base64,CCCC");

  await runtime.setThemeBackgroundImage("x01", "https://example.invalid/bg.png");
  await wait(5);
  storedConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));
  assert.equal(storedConfig.features.themes.x01.backgroundImageDataUrl, "data:image/png;base64,AAAA");

  await runtime.clearThemeBackgroundImage("x01");
  await wait(5);
  storedConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));
  assert.equal(storedConfig.features.themes.x01.backgroundImageDataUrl, "");

  await runtime.clearThemeBackgroundImage("gotcha");
  await wait(5);
  storedConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));
  assert.equal(storedConfig.features.themes.gotcha.backgroundImageDataUrl, "");

  await runtime.setThemeBackgroundImage("x01TwoPlayer", "data:image/png;base64,BBBB");
  await wait(5);
  storedConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));
  assert.equal(
    storedConfig.features.themes.x01TwoPlayer.backgroundImageDataUrl,
    "data:image/png;base64,BBBB"
  );

  await runtime.clearThemeBackgroundImage("x01TwoPlayer");
  await wait(5);
  storedConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));
  assert.equal(storedConfig.features.themes.x01TwoPlayer.backgroundImageDataUrl, "");

  await runtime.setThemeBackgroundImage("globalTypography", "data:image/png;base64,GGGG");
  await wait(5);
  storedConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));
  assert.equal(
    storedConfig.features.themes.globalTypography.backgroundImageDataUrl,
    "data:image/png;base64,GGGG"
  );

  await runtime.clearThemeBackgroundImage("globalTypography");
  await wait(5);
  storedConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));
  assert.equal(storedConfig.features.themes.globalTypography.backgroundImageDataUrl, "");

  runtime.stop();
});

test("runtime syncs persisted config changes from another window via storage events", async () => {
  const localStorage = new FakeStorage();
  const firstDocument = new FakeDocument();
  const secondDocument = new FakeDocument();
  const firstWindow = createFakeWindow({ documentRef: firstDocument, localStorage });
  const secondWindow = createFakeWindow({ documentRef: secondDocument, localStorage });

  const firstRuntime = await initializeTampermonkeyRuntime({
    windowRef: firstWindow,
    documentRef: firstDocument,
  });
  const secondRuntime = await initializeTampermonkeyRuntime({
    windowRef: secondWindow,
    documentRef: secondDocument,
  });

  await firstRuntime.saveConfig({
    featureToggles: {
      checkoutTargetHighlights: true,
    },
    features: {
      checkoutTargetHighlights: {
        enabled: true,
        segmentStyle: "surface-only",
        singleRing: "both",
        targetSelectionMode: "all",
        colorTheme: "cyan",
      },
    },
  });

  const storageEvent = new FakeEvent("storage", { bubbles: false, cancelable: false });
  storageEvent.key = CONFIG_STORAGE_KEY;
  storageEvent.newValue = localStorage.getItem(CONFIG_STORAGE_KEY);
  storageEvent.storageArea = localStorage;
  secondWindow.dispatchEvent(storageEvent);

  assert.equal(
    await waitFor(() => {
      const snapshot = secondRuntime.getSnapshot();
      const feature = snapshot.features["checkout-target-highlights"];
      return (
        feature?.enabled === true &&
        feature?.config?.segmentStyle === "surface-only" &&
        feature?.config?.singleRing === "both" &&
        feature?.config?.targetSelectionMode === "all" &&
        feature?.config?.colorTheme === "cyan"
      );
    }),
    true
  );

  secondRuntime.stop();
  assert.equal(countWindowListeners(secondWindow, "storage"), 0);

  await firstRuntime.saveConfig({
    featureToggles: {
      checkoutTargetHighlights: true,
    },
    features: {
      checkoutTargetHighlights: {
        enabled: true,
        segmentStyle: "surface-outline",
        singleRing: "both",
        targetSelectionMode: "finish",
        colorTheme: "amber",
      },
    },
  });

  const stoppedStorageEvent = new FakeEvent("storage", { bubbles: false, cancelable: false });
  stoppedStorageEvent.key = CONFIG_STORAGE_KEY;
  stoppedStorageEvent.newValue = localStorage.getItem(CONFIG_STORAGE_KEY);
  stoppedStorageEvent.storageArea = localStorage;
  secondWindow.dispatchEvent(stoppedStorageEvent);
  await wait(10);

  assert.equal(
    secondRuntime.getSnapshot().features["checkout-target-highlights"]?.config?.targetSelectionMode,
    "all"
  );

  firstRuntime.stop();
});

test("runtime listFeatures exposes the full migrated feature catalog", async () => {
  const localStorage = new FakeStorage();
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef, localStorage });

  const runtime = await initializeTampermonkeyRuntime({ windowRef, documentRef });
  const listed = runtime.listFeatures();

  assert.equal(listed.some((entry) => entry.featureKey === "checkout-target-highlights"), true);
  assert.equal(listed.some((entry) => entry.featureKey === "tv-board-zoom"), true);
  assert.equal(listed.some((entry) => entry.featureKey === "checkout-suggestion-styles"), true);
  assert.equal(listed.some((entry) => entry.featureKey === "avg-trend-arrow"), true);
  assert.equal(listed.some((entry) => entry.featureKey === "active-player-sweep"), true);
  assert.equal(listed.some((entry) => entry.featureKey === "special-hit-highlights"), true);
  assert.equal(listed.some((entry) => entry.featureKey === "cricket-target-highlighter"), true);
  assert.equal(listed.some((entry) => entry.featureKey === "cricket-grid-status-effects"), true);
  assert.equal(listed.some((entry) => entry.featureKey === "dartboard-marker-highlight"), true);
  assert.equal(listed.some((entry) => entry.featureKey === "dart-marker-replacer"), true);
  assert.equal(listed.some((entry) => entry.featureKey === "take-out-darts-alert"), true);
  assert.equal(listed.some((entry) => entry.featureKey === "single-bull-hit-sound"), true);
  assert.equal(listed.some((entry) => entry.featureKey === "turn-score-counter"), true);
  assert.equal(listed.some((entry) => entry.featureKey === "x01-remaining-score-bar"), true);
  assert.equal(listed.some((entry) => entry.featureKey === "winner-celebration-effect"), true);
  assert.equal(listed.some((entry) => entry.featureKey === "bot-board-style"), true);
  assert.equal(listed.some((entry) => entry.featureKey === "theme-x01"), true);
  assert.equal(listed.some((entry) => entry.featureKey === "theme-gotcha"), true);
  assert.equal(listed.some((entry) => entry.featureKey === "theme-x01-2player"), true);
  assert.equal(listed.some((entry) => entry.featureKey === "theme-shanghai"), true);
  assert.equal(listed.some((entry) => entry.featureKey === "theme-bermuda"), true);
  assert.equal(listed.some((entry) => entry.featureKey === "theme-cricket"), true);
  assert.equal(listed.some((entry) => entry.featureKey === "theme-bull-off"), true);

  runtime.stop();
});

test("runtime applyRecommendedDefaults applies the documented recommended profile and preserves theme images", async () => {
  const localStorage = new FakeStorage({
    [CONFIG_STORAGE_KEY]: JSON.stringify({
      featureToggles: {
        checkoutScoreHighlight: false,
      },
      features: {
        themes: {
          globalTypography: {
            backgroundImageDataUrl: "data:image/png;base64,GGGG",
          },
          x01: {
            backgroundImageDataUrl: "data:image/png;base64,AAAA",
          },
          cricket: {
            backgroundImageDataUrl: "data:image/png;base64,BBBB",
          },
        },
      },
    }),
  });
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef, localStorage });
  const runtime = await initializeTampermonkeyRuntime({ windowRef, documentRef });

  const snapshot = await runtime.applyRecommendedDefaults();
  const storedConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));

  assert.equal(snapshot.features["checkout-score-highlight"].enabled, true);
  assert.equal(storedConfig.features.checkoutScoreHighlight.enabled, true);
  assert.equal(storedConfig.features.checkoutTargetHighlights.visualPreset, "fast-blink");
  assert.equal(storedConfig.features.checkoutTargetHighlights.colorTheme, "cyan");
  assert.equal(storedConfig.features.checkoutSuggestionStyles.style, "stripe");
  assert.equal(storedConfig.features.activePlayerSweep.durationMs, 420);
  assert.equal(storedConfig.features.activePlayerSweep.sweepStyle, "standard");
  assert.equal(storedConfig.features.specialHitHighlights.animationStyle, "electric-jolt");
  assert.equal(storedConfig.features.cricketTargetHighlighter.irrelevantBoardDimStyle, "hatch");
  assert.equal(storedConfig.features.cricketGridStatusEffects.intensity, "normal");
  assert.equal(storedConfig.features.cricketGridStatusEffects.pressureOverlay, true);
  assert.equal(storedConfig.features.dartboardMarkerHighlight.effect, "size-pulse");
  assert.equal(storedConfig.features.dartboardMarkerHighlight.opacityPercent, 100);
  assert.equal(storedConfig.features.dartMarkerReplacer.hideOriginalMarkers, true);
  assert.equal(storedConfig.features.dartMarkerReplacer.enableWobble, true);
  assert.equal(storedConfig.features.takeOutDartsAlert.imageSize, "large");
  assert.equal(storedConfig.features.singleBullHitSound.volume, 0.9);
  assert.equal(storedConfig.features.turnScoreCounter.flashOnChange, false);
  assert.equal(storedConfig.features.winnerCelebrationEffect.style, "top-fireworks");
  assert.equal(storedConfig.features.winnerCelebrationEffect.intensity, "standard");
  assert.equal(storedConfig.features.winnerCelebrationEffect.durationSeconds, 5);
  assert.equal(storedConfig.features.winnerCelebrationEffect.particleAmount, "optimiert");
  assert.equal(storedConfig.features.x01RemainingScoreBar.barSize, "breit");
  assert.equal(storedConfig.features.x01RemainingScoreBar.effect, "off");
  assert.equal(
    storedConfig.features.themes.globalTypography.backgroundImageDataUrl,
    "data:image/png;base64,GGGG"
  );
  assert.equal(storedConfig.features.themes.x01.backgroundImageDataUrl, "data:image/png;base64,AAAA");
  assert.equal(storedConfig.features.themes.x01TwoPlayer.backgroundImageDataUrl, "");
  assert.equal(
    storedConfig.features.themes.cricket.backgroundImageDataUrl,
    "data:image/png;base64,BBBB"
  );

  defaultFeatureDefinitions.forEach((definition) => {
    const expectedEnabled =
      definition.featureKey !== "theme-global-typography" &&
      definition.featureKey !== "theme-x01-2player";
    assert.equal(storedConfig.featureToggles[definition.configKey], expectedEnabled, definition.configKey);
    assert.equal(
      getStoredFeatureConfig(storedConfig, definition.configKey).enabled,
      expectedEnabled,
      definition.configKey
    );
  });

  runtime.stop();
});

test("runtime resetConfig performs a hard reset and clears theme images", async () => {
  const localStorage = new FakeStorage({
    [CONFIG_STORAGE_KEY]: JSON.stringify({
      featureToggles: {
        checkoutScoreHighlight: true,
      },
      features: {
        checkoutScoreHighlight: {
          enabled: true,
          effect: "blink",
        },
        themes: {
          globalTypography: {
            enabled: true,
            backgroundImageDataUrl: "data:image/png;base64,GGGG",
          },
          x01: {
            enabled: true,
            backgroundImageDataUrl: "data:image/png;base64,AAAA",
          },
        },
      },
    }),
  });
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef, localStorage });
  const runtime = await initializeTampermonkeyRuntime({ windowRef, documentRef });

  const snapshot = await runtime.resetConfig();
  const storedConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));

  assert.equal(snapshot.features["checkout-score-highlight"].enabled, false);
  assert.equal(storedConfig.featureToggles.checkoutScoreHighlight, false);
  assert.equal(storedConfig.features.checkoutScoreHighlight.enabled, false);
  assert.equal(storedConfig.features.checkoutScoreHighlight.effect, "grow-only");
  assert.equal(storedConfig.features.themes.globalTypography.enabled, false);
  assert.equal(storedConfig.features.themes.globalTypography.backgroundImageDataUrl, "");
  assert.equal(storedConfig.features.themes.x01.enabled, false);
  assert.equal(storedConfig.features.themes.x01.backgroundImageDataUrl, "");

  defaultFeatureDefinitions.forEach((definition) => {
    assert.equal(storedConfig.featureToggles[definition.configKey], false, definition.configKey);
    assert.equal(
      getStoredFeatureConfig(storedConfig, definition.configKey).enabled,
      false,
      definition.configKey
    );
  });

  runtime.stop();
});

test("runtime rejects theme background writes when persistence fails", async () => {
  const failingStorage = {
    _value: null,
    getItem() {
      return this._value;
    },
    setItem() {
      throw new Error("QuotaExceededError");
    },
  };
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef, localStorage: failingStorage });
  const runtime = await initializeTampermonkeyRuntime({ windowRef, documentRef });

  await assert.rejects(() =>
    runtime.setThemeBackgroundImage("x01", "data:image/png;base64,AAAA")
  );

  const snapshot = runtime.getSnapshot();
  assert.equal(snapshot.features["theme-x01"].config.backgroundImageDataUrl, "");

  runtime.stop();
});
