import test from "node:test";
import assert from "node:assert/strict";

import { createBootstrap } from "../../src/core/bootstrap.js";
import { FakeDocument, createFakeWindow } from "./fake-dom.js";

function wait(ms = 0) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createThemeConfig(themeConfigKey, themeFeatureConfig = {}) {
  const themeName = String(themeConfigKey || "").trim();
  return {
    featureToggles: {
      checkoutScorePulse: false,
      [`themes.${themeName}`]: true,
    },
    features: {
      checkoutScorePulse: {
        enabled: false,
      },
      themes: {
        [themeName]: {
          enabled: true,
          ...themeFeatureConfig,
        },
      },
    },
  };
}

test("theme-x01 mounts idempotently and cleans up style plus preview spacing", async () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "501";
  const windowRef = createFakeWindow({ documentRef });
  const runtime = createBootstrap({
    windowRef,
    documentRef,
    config: createThemeConfig("x01", {
      showAvg: true,
    }),
  });

  runtime.start();
  runtime.start();
  await wait(5);

  assert.equal(Boolean(documentRef.getElementById("ad-ext-theme-x01-style")), true);
  assert.equal(documentRef.turnContainer.classList.contains("ad-ext-turn-preview-space"), true);

  runtime.stop();
  assert.equal(Boolean(documentRef.getElementById("ad-ext-theme-x01-style")), false);
  assert.equal(documentRef.turnContainer.classList.contains("ad-ext-turn-preview-space"), false);
});

test("theme-shanghai mounts idempotently and cleans up style", async () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "Shanghai";
  const windowRef = createFakeWindow({ documentRef });
  const runtime = createBootstrap({
    windowRef,
    documentRef,
    config: createThemeConfig("shanghai", {
      showAvg: false,
    }),
  });

  runtime.start();
  runtime.start();
  await wait(5);

  assert.equal(Boolean(documentRef.getElementById("ad-ext-theme-shanghai-style")), true);
  assert.equal(documentRef.turnContainer.classList.contains("ad-ext-turn-preview-space"), true);

  runtime.stop();
  assert.equal(Boolean(documentRef.getElementById("ad-ext-theme-shanghai-style")), false);
  assert.equal(documentRef.turnContainer.classList.contains("ad-ext-turn-preview-space"), false);
});

test("theme-bermuda applies includes matching and cleans up on stop", async () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "Bermuda 701";
  const windowRef = createFakeWindow({ documentRef });
  const runtime = createBootstrap({
    windowRef,
    documentRef,
    config: createThemeConfig("bermuda"),
  });

  runtime.start();
  runtime.start();
  await wait(5);

  assert.equal(Boolean(documentRef.getElementById("ad-ext-theme-bermuda-style")), true);
  assert.equal(documentRef.turnContainer.classList.contains("ad-ext-turn-preview-space"), true);

  runtime.stop();
  assert.equal(Boolean(documentRef.getElementById("ad-ext-theme-bermuda-style")), false);
  assert.equal(documentRef.turnContainer.classList.contains("ad-ext-turn-preview-space"), false);
});

test("theme-cricket activates for tactics and cleans style on cleanup", async () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "Tactics";
  const windowRef = createFakeWindow({ documentRef });
  const runtime = createBootstrap({
    windowRef,
    documentRef,
    config: createThemeConfig("cricket", {
      showAvg: true,
    }),
  });

  runtime.start();
  runtime.start();
  await wait(5);

  assert.equal(Boolean(documentRef.getElementById("ad-ext-theme-cricket-style")), true);

  runtime.stop();
  assert.equal(Boolean(documentRef.getElementById("ad-ext-theme-cricket-style")), false);
});

test("theme-bull-off applies includes matching without preview-space class", async () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "Bull-off Finals";
  const windowRef = createFakeWindow({ documentRef });
  const runtime = createBootstrap({
    windowRef,
    documentRef,
    config: createThemeConfig("bullOff", {
      contrastPreset: "high",
    }),
  });

  runtime.start();
  runtime.start();
  await wait(5);

  assert.equal(Boolean(documentRef.getElementById("ad-ext-theme-bull-off-style")), true);
  assert.equal(documentRef.turnContainer.classList.contains("ad-ext-turn-preview-space"), false);

  runtime.stop();
  assert.equal(Boolean(documentRef.getElementById("ad-ext-theme-bull-off-style")), false);
});
