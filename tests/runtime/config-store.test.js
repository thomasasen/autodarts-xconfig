import test from "node:test";
import assert from "node:assert/strict";

import {
  CONFIG_STORAGE_KEY,
  LEGACY_CONFIG_STORAGE_KEY,
  LEGACY_IMPORT_FLAG_KEY,
  createConfigStore,
} from "../../src/config/config-store.js";
import {
  createRecommendedRuntimeConfig,
  normalizeRuntimeConfig,
} from "../../src/config/runtime-config.js";
import { defaultFeatureDefinitions } from "../../src/features/feature-registry.js";
import { createFakeWindow, FakeStorage } from "./fake-dom.js";

function createDeferred() {
  let resolve = null;
  let reject = null;
  const promise = new Promise((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });

  return {
    promise,
    resolve,
    reject,
  };
}

function getStoredFeatureConfig(storedConfig, configKey) {
  if (String(configKey || "").startsWith("themes.")) {
    const themeKey = String(configKey).split(".")[1];
    return storedConfig.features?.themes?.[themeKey] || null;
  }

  return storedConfig.features?.[configKey] || null;
}

test("config store loads defaults when storage is empty", async () => {
  const windowRef = createFakeWindow({
    localStorage: new FakeStorage(),
  });
  const store = createConfigStore({ windowRef });

  const config = await store.load();

  assert.equal(config.features.checkoutScoreHighlight.effect, "grow-only");
  assert.equal(config.featureToggles.checkoutScoreHighlight, false);
  assert.equal(config.features.checkoutTargetHighlights.visualPreset, "soft-pulse");
  assert.equal(config.features.checkoutTargetHighlights.targetSelectionMode, "next");
  assert.equal(config.features.tvBoardZoom.checkoutZoomTarget, "finish-only");
  assert.equal(config.features.tvBoardZoom.t20SetupZoomEnabled, true);
});

test("config store creates the recommended profile only when no current or legacy config exists", async () => {
  const localStorage = new FakeStorage();
  const store = createConfigStore({ localStorageRef: localStorage });
  let createCalls = 0;

  const result = await store.importLegacyConfigIfAvailable({
    createInitialConfig: () => {
      createCalls += 1;
      return createRecommendedRuntimeConfig();
    },
  });
  const storedConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));

  assert.equal(result.imported, false);
  assert.equal(result.initialized, true);
  assert.equal(result.reason, "initial-config-created");
  assert.equal(createCalls, 1);
  assert.equal(storedConfig.features.checkoutScoreHighlight.effect, "fade-blink");
  assert.equal(storedConfig.features.activePlayerSweep.durationMs, 620);
  assert.equal(storedConfig.features.themes.globalTypography.enabled, false);
  assert.equal(localStorage.getItem(LEGACY_IMPORT_FLAG_KEY), "true");
});

test("config store never creates the recommended profile over an existing config", async () => {
  const localStorage = new FakeStorage({
    [CONFIG_STORAGE_KEY]: JSON.stringify({
      featureToggles: {
        checkoutScoreHighlight: false,
      },
      features: {
        checkoutScoreHighlight: {
          enabled: false,
          effect: "glow-only",
        },
      },
    }),
  });
  const store = createConfigStore({ localStorageRef: localStorage });
  let createCalls = 0;

  const result = await store.importLegacyConfigIfAvailable({
    createInitialConfig: () => {
      createCalls += 1;
      return createRecommendedRuntimeConfig();
    },
  });
  const storedConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));

  assert.equal(result.imported, false);
  assert.equal(result.reason, "existing-current-config");
  assert.equal(createCalls, 0);
  assert.equal(storedConfig.featureToggles.checkoutScoreHighlight, false);
  assert.equal(storedConfig.features.checkoutScoreHighlight.effect, "glow-only");
});

test("config store treats a stored default-shaped config as an existing installation", async () => {
  const localStorage = new FakeStorage({
    [CONFIG_STORAGE_KEY]: JSON.stringify(normalizeRuntimeConfig()),
  });
  const store = createConfigStore({ localStorageRef: localStorage });
  let createCalls = 0;

  const result = await store.importLegacyConfigIfAvailable({
    createInitialConfig: () => {
      createCalls += 1;
      return createRecommendedRuntimeConfig();
    },
  });
  const storedConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));

  assert.equal(result.imported, false);
  assert.equal(result.reason, "no-compatible-legacy-config");
  assert.equal(createCalls, 0);
  assert.equal(storedConfig.features.checkoutScoreHighlight.effect, "grow-only");
  assert.equal(storedConfig.features.themes.globalTypography.enabled, false);
});

test("config store saves, updates, and resets persisted config", async () => {
  const localStorage = new FakeStorage();
  const windowRef = createFakeWindow({ localStorage });
  const store = createConfigStore({ windowRef, localStorageRef: localStorage });

  await store.save({
    featureToggles: {
      checkoutScoreHighlight: false,
    },
    features: {
      checkoutTargetHighlights: {
        targetSelectionMode: "all",
      },
      tvBoardZoom: {
        checkoutZoomTarget: "route-first",
        t20SetupZoomEnabled: false,
      },
    },
  });

  let stored = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));
  assert.equal(stored.featureToggles.checkoutScoreHighlight, false);
  assert.equal(stored.features.checkoutTargetHighlights.targetSelectionMode, "all");
  assert.equal(stored.features.tvBoardZoom.checkoutZoomTarget, "route-first");
  assert.equal(stored.features.tvBoardZoom.t20SetupZoomEnabled, false);

  const updated = await store.update({
    features: {
      checkoutScoreHighlight: {
        effect: "blink",
      },
    },
  });

  assert.equal(updated.features.checkoutScoreHighlight.effect, "fade-blink");
  assert.equal(updated.featureToggles.checkoutScoreHighlight, false);
  assert.equal(updated.features.checkoutTargetHighlights.targetSelectionMode, "all");
  assert.equal(updated.features.tvBoardZoom.checkoutZoomTarget, "route-first");
  assert.equal(updated.features.tvBoardZoom.t20SetupZoomEnabled, false);

  const reset = await store.reset();
  assert.equal(reset.features.checkoutScoreHighlight.effect, "grow-only");
  assert.equal(reset.featureToggles.checkoutScoreHighlight, false);
  assert.equal(reset.features.checkoutTargetHighlights.targetSelectionMode, "next");
  assert.equal(reset.features.tvBoardZoom.checkoutZoomTarget, "finish-only");
  assert.equal(reset.features.tvBoardZoom.t20SetupZoomEnabled, true);
  assert.equal(reset.features.checkoutScoreHighlight.enabled, false);
  assert.equal(reset.features.themes.x01.enabled, false);
  assert.equal(reset.features.themes.x01.backgroundImageDataUrl, "");
  defaultFeatureDefinitions.forEach((definition) => {
    assert.equal(reset.featureToggles[definition.configKey], false, definition.configKey);
    const featureConfig = getStoredFeatureConfig(reset, definition.configKey);
    assert.ok(featureConfig, `missing reset config for ${definition.configKey}`);
    assert.equal(featureConfig.enabled, false, definition.configKey);
  });
});

test("config store serializes overlapping updates without losing patches", async () => {
  const localStorage = new FakeStorage();
  const loadGate = createDeferred();
  let loadCalls = 0;
  const store = createConfigStore({
    localStorageRef: localStorage,
    gmGetValue: async (key, fallbackValue) => {
      if (key === CONFIG_STORAGE_KEY) {
        loadCalls += 1;
      }
      await loadGate.promise;
      return fallbackValue;
    },
  });

  const firstUpdate = store.update({
    features: {
      checkoutScoreHighlight: {
        effect: "blink",
      },
    },
  });
  const secondUpdate = store.update({
    featureToggles: {
      checkoutScoreHighlight: false,
    },
  });

  await Promise.resolve();
  assert.equal(loadCalls, 1);

  loadGate.resolve();
  await Promise.all([firstUpdate, secondUpdate]);

  const storedConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));
  assert.equal(storedConfig.features.checkoutScoreHighlight.effect, "fade-blink");
  assert.equal(storedConfig.featureToggles.checkoutScoreHighlight, false);
});

test("config store transactions analyze and replace the latest queued config atomically", async () => {
  const localStorage = new FakeStorage();
  const store = createConfigStore({ localStorageRef: localStorage });

  const update = store.update({
    features: { tvBoardZoom: { zoomSpeed: "langsam" } },
  });
  const transaction = store.transact((currentConfig) => ({
    config: {
      ...currentConfig,
      features: {
        ...currentConfig.features,
        tvBoardZoom: {
          ...currentConfig.features.tvBoardZoom,
          zoomLevel: 3.15,
        },
      },
    },
    result: "imported",
  }));

  await update;
  const outcome = await transaction;
  assert.equal(outcome.persisted, true);
  assert.equal(outcome.result, "imported");
  assert.equal(outcome.config.features.tvBoardZoom.zoomSpeed, "langsam");
  assert.equal(outcome.config.features.tvBoardZoom.zoomLevel, 3.15);
});

test("config store imports migrated legacy feature and theme settings once without overwriting later config", async () => {
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
        "a-checkout-board": {
          enabled: true,
          settings: {
            EFFEKT: "blink",
            SINGLE_RING: "outer",
            ZIELAUSWAHL: "all",
            FARBTHEMA: "cyan",
            DEBUG: true,
          },
        },
        "a-winner-fireworks": {
          enabled: true,
          settings: {
            STYLE: "cannon",
            FARBE: "gold",
            INTENSITAET: "stark",
            DAUER_SEKUNDEN: 2,
            PARTIKELANZAHL: "voll",
            BULLOUT_AKTIV: false,
            KLICK_ZUM_STOPPEN: false,
            DEBUG: true,
          },
        },
        "a-cricket-target": {
          enabled: true,
          settings: {
            OPEN_ZIELE_ANZEIGEN: false,
            DEAD_ZIELE_ANZEIGEN: true,
            FARBTHEMA: "high-contrast",
            INTENSITAET: "strong",
            DEBUG: true,
          },
        },
        "a-cricket-grid-fx": {
          enabled: true,
          settings: {
            THREAT_EDGE: false,
            SCORING_LANE_HIGHLIGHT: true,
            DEAD_ROW_COLLAPSE: false,
            OPPONENT_PRESSURE_OVERLAY: true,
            FARBTHEMA: "high-contrast",
            INTENSITAET: "strong",
          },
        },
        "a-triple-double-bull": {
          enabled: true,
          settings: {
            TRIPLE_HERVORHEBEN: false,
            DOUBLE_HERVORHEBEN: false,
            BULL_HERVORHEBEN: false,
            AKTUALISIERUNGSMODUS: 0,
            DEBUG: true,
          },
        },
        "a-marker-darts": {
          enabled: true,
          settings: {
            DART_DESIGN: "Dart_red.png",
            ANIMATE_DARTS: true,
            DART_GROESSE: 115,
            ORIGINAL_MARKER_AUSBLENDEN: true,
            SCHATTEN_AKTIV: false,
            WOBBLE_AKTIV: false,
            FLUGGESCHWINDIGKEIT: "cinematic",
            DEBUG: true,
          },
        },
        "theme-x01": {
          enabled: true,
          settings: {
            AVG_ANZEIGE: false,
            HINTERGRUND_DARSTELLUNG: "fit",
            HINTERGRUND_OPAZITAET: 40,
            SPIELERFELD_TRANSPARENZ: 30,
            DEBUG: true,
          },
        },
      },
    }),
  });
  const windowRef = createFakeWindow({ localStorage });
  const store = createConfigStore({ windowRef, localStorageRef: localStorage });

  const result = await store.importLegacyConfigIfAvailable();
  const importedConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));

  assert.equal(result.imported, true);
  assert.equal(importedConfig.featureToggles.checkoutScoreHighlight, false);
  assert.equal(importedConfig.features.checkoutScoreHighlight.effect, "glow-only");
  assert.equal(importedConfig.features.checkoutScoreHighlight.colorTheme, "56, 189, 248");
  assert.equal(importedConfig.features.checkoutScoreHighlight.intensity, "stark");
  assert.equal(importedConfig.features.checkoutScoreHighlight.triggerSource, "score-only");
  assert.equal(importedConfig.features.checkoutScoreHighlight.debug, true);
  assert.equal(importedConfig.featureToggles.checkoutTargetHighlights, true);
  assert.equal(importedConfig.features.checkoutTargetHighlights.visualPreset, "fast-blink");
  assert.equal(importedConfig.features.checkoutTargetHighlights.singleRing, "both");
  assert.equal(importedConfig.features.checkoutTargetHighlights.targetSelectionMode, "all");
  assert.equal(importedConfig.features.checkoutTargetHighlights.colorTheme, "cyan");
  assert.equal(importedConfig.features.checkoutTargetHighlights.debug, true);
  assert.equal(importedConfig.featureToggles.winnerCelebrationEffect, true);
  assert.equal(importedConfig.features.winnerCelebrationEffect.style, "center-cannon");
  assert.equal(importedConfig.features.winnerCelebrationEffect.colorTheme, "gold");
  assert.equal(importedConfig.features.winnerCelebrationEffect.intensity, "stark");
  assert.equal(importedConfig.features.winnerCelebrationEffect.durationSeconds, 2);
  assert.equal(importedConfig.features.winnerCelebrationEffect.particleAmount, "voll");
  assert.equal(importedConfig.features.winnerCelebrationEffect.includeBullOut, false);
  assert.equal(importedConfig.features.winnerCelebrationEffect.pointerDismiss, false);
  assert.equal(importedConfig.features.winnerCelebrationEffect.debug, true);
  assert.equal(importedConfig.featureToggles.cricketTargetHighlighter, true);
  assert.equal(importedConfig.features.cricketTargetHighlighter.enabled, true);
  assert.equal(importedConfig.features.cricketTargetHighlighter.showOpenObjectives, false);
  assert.equal(importedConfig.features.cricketTargetHighlighter.showDeadObjectives, true);
  assert.equal(importedConfig.features.cricketTargetHighlighter.irrelevantBoardDimStyle, "smoke");
  assert.equal(importedConfig.features.cricketTargetHighlighter.dimIrrelevantBoardTargets, true);
  assert.equal(importedConfig.features.cricketTargetHighlighter.colorTheme, "high-contrast");
  assert.equal(importedConfig.features.cricketTargetHighlighter.intensity, "strong");
  assert.equal(importedConfig.features.cricketTargetHighlighter.debug, true);
  assert.equal(importedConfig.featureToggles.cricketGridStatusEffects, true);
  assert.equal(importedConfig.features.cricketGridStatusEffects.enabled, true);
  assert.equal(importedConfig.features.cricketGridStatusEffects.pressureEdge, false);
  assert.equal(importedConfig.features.cricketGridStatusEffects.scoringStripe, true);
  assert.equal(importedConfig.features.cricketGridStatusEffects.deadRowMuted, false);
  assert.equal(importedConfig.features.cricketGridStatusEffects.pressureOverlay, true);
  assert.equal(importedConfig.features.cricketGridStatusEffects.colorTheme, "high-contrast");
  assert.equal(importedConfig.features.cricketGridStatusEffects.intensity, "strong");
  assert.equal(importedConfig.featureToggles.specialHitHighlights, true);
  assert.equal(importedConfig.features.specialHitHighlights.enabled, true);
  assert.equal(importedConfig.features.specialHitHighlights.colorTheme, "champagne-night");
  assert.equal(importedConfig.features.specialHitHighlights.animationStyle, "pop-hit");
  assert.equal(importedConfig.features.specialHitHighlights.debug, true);
  assert.equal(importedConfig.featureToggles.dartMarkerReplacer, true);
  assert.equal(importedConfig.features.dartMarkerReplacer.enabled, true);
  assert.equal(importedConfig.features.dartMarkerReplacer.design, "red");
  assert.equal(importedConfig.features.dartMarkerReplacer.animateDarts, true);
  assert.equal(importedConfig.features.dartMarkerReplacer.sizePercent, 138);
  assert.equal(importedConfig.features.dartMarkerReplacer.hideOriginalMarkers, true);
  assert.equal(importedConfig.features.dartMarkerReplacer.enableShadow, false);
  assert.equal(importedConfig.features.dartMarkerReplacer.enableWobble, false);
  assert.equal(importedConfig.features.dartMarkerReplacer.flightSpeed, "cinematic");
  assert.equal(importedConfig.features.dartMarkerReplacer.debug, true);
  assert.equal(importedConfig.featureToggles["themes.x01"], true);
  assert.equal(importedConfig.features.themes.x01.enabled, true);
  assert.equal(importedConfig.features.themes.x01.showAvg, false);
  assert.equal(importedConfig.features.themes.x01.backgroundDisplayMode, "fit");
  assert.equal(importedConfig.features.themes.x01.backgroundOpacity, 40);
  assert.equal(importedConfig.features.themes.x01.playerFieldTransparency, 30);
  assert.equal(importedConfig.features.themes.x01.debug, true);
  assert.equal(localStorage.getItem(LEGACY_IMPORT_FLAG_KEY), "true");

  const secondRun = await store.importLegacyConfigIfAvailable();
  assert.equal(secondRun.imported, false);
  assert.equal(secondRun.reason, "existing-current-config");
});

test("config store falls back to hidden open-target overlays for legacy cricket imports without explicit setting", async () => {
  const localStorage = new FakeStorage({
    [LEGACY_CONFIG_STORAGE_KEY]: JSON.stringify({
      features: {
        "a-cricket-target": {
          enabled: true,
          settings: {
            DEAD_ZIELE_ANZEIGEN: true,
            FARBTHEMA: "standard",
            INTENSITAET: "normal",
          },
        },
      },
    }),
  });
  const windowRef = createFakeWindow({ localStorage });
  const store = createConfigStore({ windowRef, localStorageRef: localStorage });

  const result = await store.importLegacyConfigIfAvailable();
  const importedConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));

  assert.equal(result.imported, true);
  assert.equal(importedConfig.features.cricketTargetHighlighter.showOpenObjectives, false);
  assert.equal(importedConfig.features.cricketTargetHighlighter.showDeadObjectives, true);
  assert.equal(importedConfig.features.cricketTargetHighlighter.irrelevantBoardDimStyle, "smoke");
  assert.equal(importedConfig.features.cricketTargetHighlighter.dimIrrelevantBoardTargets, true);
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
      checkoutScoreHighlight: false,
    },
  });

  assert.equal(gmState.get(CONFIG_STORAGE_KEY).featureToggles.checkoutScoreHighlight, false);
  assert.equal(JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY)).featureToggles.checkoutScoreHighlight, false);
});

test("config store fails loudly when no storage backend can persist writes", async () => {
  const failingStorage = {
    getItem() {
      return null;
    },
    setItem() {
      throw new Error("QuotaExceededError");
    },
  };
  const store = createConfigStore({
    localStorageRef: failingStorage,
  });

  await assert.rejects(() =>
    store.save({
      featureToggles: {
        checkoutScoreHighlight: false,
      },
    })
  );
});

test("config store keeps unknown feature fields during updates", async () => {
  const localStorage = new FakeStorage({
    [CONFIG_STORAGE_KEY]: JSON.stringify({
      featureToggles: {
        "themes.x01": true,
      },
      features: {
        themes: {
          x01: {
            enabled: true,
            showAvg: true,
            retiredBackgroundFlag: "keep-me",
          },
        },
      },
    }),
  });
  const store = createConfigStore({
    localStorageRef: localStorage,
  });

  const nextConfig = await store.update({
    features: {
      themes: {
        x01: {
          showAvg: false,
        },
      },
    },
  });

  assert.equal(nextConfig.features.themes.x01.showAvg, false);
  assert.equal(nextConfig.features.themes.x01.retiredBackgroundFlag, "keep-me");

  const storedConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));
  assert.equal(storedConfig.features.themes.x01.retiredBackgroundFlag, "keep-me");
});
