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
        "a-winner-fireworks": {
          enabled: true,
          settings: {
            STYLE: "cannon",
            FARBE: "gold",
            INTENSITAET: "stark",
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
  assert.equal(importedConfig.featureToggles.checkoutScorePulse, false);
  assert.equal(importedConfig.features.checkoutScorePulse.effect, "glow");
  assert.equal(importedConfig.features.checkoutScorePulse.colorTheme, "56, 189, 248");
  assert.equal(importedConfig.features.checkoutScorePulse.intensity, "stark");
  assert.equal(importedConfig.features.checkoutScorePulse.triggerSource, "score-only");
  assert.equal(importedConfig.features.checkoutScorePulse.debug, true);
  assert.equal(importedConfig.featureToggles.winnerFireworks, true);
  assert.equal(importedConfig.features.winnerFireworks.style, "cannon");
  assert.equal(importedConfig.features.winnerFireworks.colorTheme, "gold");
  assert.equal(importedConfig.features.winnerFireworks.intensity, "stark");
  assert.equal(importedConfig.features.winnerFireworks.includeBullOut, false);
  assert.equal(importedConfig.features.winnerFireworks.pointerDismiss, false);
  assert.equal(importedConfig.features.winnerFireworks.debug, true);
  assert.equal(importedConfig.featureToggles.cricketHighlighter, true);
  assert.equal(importedConfig.features.cricketHighlighter.enabled, true);
  assert.equal(importedConfig.features.cricketHighlighter.showOpenObjectives, false);
  assert.equal(importedConfig.features.cricketHighlighter.showDeadObjectives, true);
  assert.equal(importedConfig.features.cricketHighlighter.irrelevantBoardDimStyle, "smoke");
  assert.equal(importedConfig.features.cricketHighlighter.dimIrrelevantBoardTargets, true);
  assert.equal(importedConfig.features.cricketHighlighter.colorTheme, "high-contrast");
  assert.equal(importedConfig.features.cricketHighlighter.intensity, "strong");
  assert.equal(importedConfig.features.cricketHighlighter.debug, true);
  assert.equal(importedConfig.featureToggles.cricketGridFx, true);
  assert.equal(importedConfig.features.cricketGridFx.enabled, true);
  assert.equal(importedConfig.features.cricketGridFx.pressureEdge, false);
  assert.equal(importedConfig.features.cricketGridFx.scoringStripe, true);
  assert.equal(importedConfig.features.cricketGridFx.deadRowMuted, false);
  assert.equal(importedConfig.features.cricketGridFx.pressureOverlay, true);
  assert.equal(importedConfig.features.cricketGridFx.colorTheme, "high-contrast");
  assert.equal(importedConfig.features.cricketGridFx.intensity, "strong");
  assert.equal(importedConfig.featureToggles.tripleDoubleBullHits, true);
  assert.equal(importedConfig.features.tripleDoubleBullHits.enabled, true);
  assert.equal(importedConfig.features.tripleDoubleBullHits.colorTheme, "volt-lime");
  assert.equal(importedConfig.features.tripleDoubleBullHits.animationStyle, "neon-pulse");
  assert.equal(importedConfig.features.tripleDoubleBullHits.debug, true);
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
  assert.equal(importedConfig.features.cricketHighlighter.showOpenObjectives, false);
  assert.equal(importedConfig.features.cricketHighlighter.showDeadObjectives, true);
  assert.equal(importedConfig.features.cricketHighlighter.irrelevantBoardDimStyle, "smoke");
  assert.equal(importedConfig.features.cricketHighlighter.dimIrrelevantBoardTargets, true);
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
