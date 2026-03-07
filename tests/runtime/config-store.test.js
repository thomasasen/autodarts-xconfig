import test from "node:test";
import assert from "node:assert/strict";

import {
  CONFIG_STORAGE_KEY,
  LEGACY_CONFIG_STORAGE_KEY,
  LEGACY_IMPORT_FLAG_KEY,
  createConfigStore,
} from "../../src/config/config-store.js";
import { createFakeWindow, FakeStorage } from "./fake-dom.js";

test("config store loads defaults when storage is empty", async () => {
  const windowRef = createFakeWindow({
    localStorage: new FakeStorage(),
  });
  const store = createConfigStore({ windowRef });

  const config = await store.load();

  assert.equal(config.features.checkoutScorePulse.effect, "scale");
  assert.equal(config.featureToggles.checkoutScorePulse, true);
});

test("config store saves, updates, and resets persisted config", async () => {
  const localStorage = new FakeStorage();
  const windowRef = createFakeWindow({ localStorage });
  const store = createConfigStore({ windowRef, localStorageRef: localStorage });

  await store.save({
    featureToggles: {
      checkoutScorePulse: false,
    },
  });

  let stored = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));
  assert.equal(stored.featureToggles.checkoutScorePulse, false);

  const updated = await store.update({
    features: {
      checkoutScorePulse: {
        effect: "blink",
      },
    },
  });

  assert.equal(updated.features.checkoutScorePulse.effect, "blink");
  assert.equal(updated.featureToggles.checkoutScorePulse, false);

  const reset = await store.reset();
  assert.equal(reset.features.checkoutScorePulse.effect, "scale");
  assert.equal(reset.featureToggles.checkoutScorePulse, true);
});

test("config store imports only compatible checkout pulse settings from legacy config once", async () => {
  const localStorage = new FakeStorage({
    [LEGACY_CONFIG_STORAGE_KEY]: JSON.stringify({
      features: {
        "a-checkout-pulse": {
          enabled: false,
          settings: {
            EFFEKT: "glow",
            xConfig_FARBTHEMA: "56, 189, 248",
            INTENSITAET: "stark",
            TRIGGER_QUELLE: "score-only",
            DEBUG: true,
          },
        },
      },
      ui: {
        activeTab: "animations",
      },
    }),
  });
  const windowRef = createFakeWindow({ localStorage });
  const store = createConfigStore({ windowRef, localStorageRef: localStorage });

  const result = await store.importLegacyConfigIfAvailable();
  const importedConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));

  assert.equal(result.imported, true);
  assert.equal(importedConfig.featureToggles.checkoutScorePulse, false);
  assert.equal(importedConfig.features.checkoutScorePulse.effect, "glow");
  assert.equal(importedConfig.features.checkoutScorePulse.colorTheme, "56, 189, 248");
  assert.equal(importedConfig.features.checkoutScorePulse.intensity, "stark");
  assert.equal(importedConfig.features.checkoutScorePulse.triggerSource, "score-only");
  assert.equal(importedConfig.features.checkoutScorePulse.debug, true);
  assert.equal(localStorage.getItem(LEGACY_IMPORT_FLAG_KEY), "true");

  const secondRun = await store.importLegacyConfigIfAvailable();
  assert.equal(secondRun.imported, false);
  assert.equal(secondRun.reason, "already-imported");
});

test("config store prefers GM storage when available and falls back safely", async () => {
  const gmState = new Map();
  const localStorage = new FakeStorage();
  const store = createConfigStore({
    localStorageRef: localStorage,
    gmGetValue: async (key, fallbackValue) =>
      gmState.has(key) ? gmState.get(key) : fallbackValue,
    gmSetValue: async (key, value) => {
      gmState.set(key, value);
    },
  });

  await store.save({
    featureToggles: {
      checkoutScorePulse: false,
    },
  });

  assert.equal(gmState.get(CONFIG_STORAGE_KEY).featureToggles.checkoutScorePulse, false);
  assert.equal(JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY)).featureToggles.checkoutScorePulse, false);
});
