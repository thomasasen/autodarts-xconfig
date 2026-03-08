import test from "node:test";
import assert from "node:assert/strict";

import { CONFIG_STORAGE_KEY } from "../../src/config/config-store.js";
import { initializeTampermonkeyRuntime } from "../../src/runtime/bootstrap-runtime.js";
import { FakeStorage, FakeDocument, createFakeWindow } from "./fake-dom.js";

function wait(ms = 0) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

test("runtime public config API persists updates and survives feature toggles", async () => {
  const localStorage = new FakeStorage();
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "X01";
  documentRef.activeScoreElement.textContent = "170";

  const windowRef = createFakeWindow({ documentRef, localStorage });
  const originalSetTimeout = windowRef.setTimeout.bind(windowRef);
  windowRef.setTimeout = (callback, ms, ...args) => {
    return originalSetTimeout(callback, Math.min(Number(ms) || 0, 15), ...args);
  };
  windowRef.confetti = function fakeConfetti() {};
  const runtime = await initializeTampermonkeyRuntime({ windowRef, documentRef });

  await wait(5);

  let storedConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));
  assert.equal(storedConfig.features.checkoutScorePulse.effect, "scale");

  await runtime.saveConfig({
    features: {
      checkoutScorePulse: {
        effect: "blink",
      },
    },
  });
  await wait(5);

  storedConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));
  assert.equal(storedConfig.features.checkoutScorePulse.effect, "blink");
  assert.equal(documentRef.activeScoreElement.classList.contains("ad-ext-checkout-possible--blink"), true);

  await runtime.setFeatureEnabled("checkout-score-pulse", false);
  await wait(5);

  storedConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));
  assert.equal(storedConfig.featureToggles.checkoutScorePulse, false);
  assert.equal(runtime.getSnapshot().features["checkout-score-pulse"].mounted, false);

  await runtime.setFeatureEnabled("turn-start-sweep", true);
  await wait(5);
  storedConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));
  assert.equal(storedConfig.featureToggles.turnStartSweep, true);
  assert.equal(runtime.getSnapshot().features["turn-start-sweep"].mounted, true);

  await runtime.setFeatureEnabled("triple-double-bull-hits", true);
  await wait(5);
  storedConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));
  assert.equal(storedConfig.featureToggles.tripleDoubleBullHits, true);
  assert.equal(runtime.getSnapshot().features["triple-double-bull-hits"].mounted, true);

  await runtime.setFeatureEnabled("turn-points-count", true);
  await wait(5);
  storedConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));
  assert.equal(storedConfig.featureToggles.turnPointsCount, true);
  assert.equal(runtime.getSnapshot().features["turn-points-count"].mounted, true);

  await runtime.setFeatureEnabled("winner-fireworks", true);
  await wait(5);
  storedConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));
  assert.equal(storedConfig.featureToggles.winnerFireworks, true);
  assert.equal(runtime.getSnapshot().features["winner-fireworks"].mounted, true);

  const previewResult = await runtime.runFeatureAction("winner-fireworks", "preview");
  assert.equal(previewResult.ok, true);
  await wait(5);
  assert.equal(Boolean(documentRef.getElementById("ad-ext-winner-fireworks-preview")), true);
  await wait(30);
  assert.equal(Boolean(documentRef.getElementById("ad-ext-winner-fireworks-preview")), false);

  await runtime.setFeatureEnabled("theme-x01", true);
  await wait(5);
  storedConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));
  assert.equal(storedConfig.featureToggles["themes.x01"], true);
  assert.equal(storedConfig.features.themes.x01.enabled, true);
  assert.equal(runtime.getSnapshot().features["theme-x01"].mounted, true);

  await runtime.setThemeBackgroundImage("x01", "data:image/png;base64,AAAA");
  await wait(5);
  storedConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));
  assert.equal(storedConfig.features.themes.x01.backgroundImageDataUrl, "data:image/png;base64,AAAA");

  await runtime.setThemeBackgroundImage("x01", "https://example.invalid/bg.png");
  await wait(5);
  storedConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));
  assert.equal(storedConfig.features.themes.x01.backgroundImageDataUrl, "data:image/png;base64,AAAA");

  await runtime.clearThemeBackgroundImage("x01");
  await wait(5);
  storedConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));
  assert.equal(storedConfig.features.themes.x01.backgroundImageDataUrl, "");

  runtime.stop();
});

test("runtime listFeatures exposes the full migrated feature catalog", async () => {
  const localStorage = new FakeStorage();
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef, localStorage });

  const runtime = await initializeTampermonkeyRuntime({ windowRef, documentRef });
  const listed = runtime.listFeatures();

  assert.equal(listed.some((entry) => entry.featureKey === "checkout-board-targets"), true);
  assert.equal(listed.some((entry) => entry.featureKey === "tv-board-zoom"), true);
  assert.equal(listed.some((entry) => entry.featureKey === "style-checkout-suggestions"), true);
  assert.equal(listed.some((entry) => entry.featureKey === "average-trend-arrow"), true);
  assert.equal(listed.some((entry) => entry.featureKey === "turn-start-sweep"), true);
  assert.equal(listed.some((entry) => entry.featureKey === "triple-double-bull-hits"), true);
  assert.equal(listed.some((entry) => entry.featureKey === "cricket-highlighter"), true);
  assert.equal(listed.some((entry) => entry.featureKey === "cricket-grid-fx"), true);
  assert.equal(listed.some((entry) => entry.featureKey === "dart-marker-emphasis"), true);
  assert.equal(listed.some((entry) => entry.featureKey === "dart-marker-darts"), true);
  assert.equal(listed.some((entry) => entry.featureKey === "remove-darts-notification"), true);
  assert.equal(listed.some((entry) => entry.featureKey === "single-bull-sound"), true);
  assert.equal(listed.some((entry) => entry.featureKey === "turn-points-count"), true);
  assert.equal(listed.some((entry) => entry.featureKey === "winner-fireworks"), true);
  assert.equal(listed.some((entry) => entry.featureKey === "theme-x01"), true);
  assert.equal(listed.some((entry) => entry.featureKey === "theme-shanghai"), true);
  assert.equal(listed.some((entry) => entry.featureKey === "theme-bermuda"), true);
  assert.equal(listed.some((entry) => entry.featureKey === "theme-cricket"), true);
  assert.equal(listed.some((entry) => entry.featureKey === "theme-bull-off"), true);

  runtime.stop();
});
