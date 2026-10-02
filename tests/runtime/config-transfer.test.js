import test from "node:test";
import assert from "node:assert/strict";

import {
  SETTINGS_TRANSFER_FORMAT,
  SETTINGS_TRANSFER_SCHEMA_VERSION,
  analyzeSettingsImport,
  createSettingsExport,
  createSettingsTransferSchema,
} from "../../src/config/config-transfer.js";
import { createDefaultFeatureConfig, getFeatureConfigSpec } from "../../src/config/feature-config-spec.js";
import { normalizeRuntimeConfig } from "../../src/config/runtime-config.js";
import { xconfigDescriptors } from "../../src/features/xconfig-ui/descriptors.js";
import { getFeatureCatalogEntryByFeatureKey } from "../../src/shared/feature-catalog.js";
import { buildFeatureSettingPatch } from "../../src/features/xconfig-ui/path-utils.js";

const SMALL_PNG = "data:image/png;base64,iVBORw0KGgo=";
const TURN_DART_DESIGNER_CONFIG = Object.freeze({
  version: 1,
  parts: Object.freeze({
    flightShape: Object.freeze({ tabIndex: 0, tabLabel: "Flight-Form", optionIndex: 0, optionLabel: "Standard" }),
    flight: Object.freeze({ tabIndex: 1, tabLabel: "Flight", optionIndex: 8, optionLabel: "Red" }),
    shaft: Object.freeze({ tabIndex: 2, tabLabel: "Schaft", optionIndex: 1, optionLabel: "Blue" }),
    barrel: Object.freeze({ tabIndex: 3, tabLabel: "Barrel", optionIndex: 10, optionLabel: "Silver 2" }),
    point: Object.freeze({ tabIndex: 4, tabLabel: "Spitze", optionIndex: 1, optionLabel: "Gold" }),
  }),
});

function createEnvelope(features, options = {}) {
  return {
    format: SETTINGS_TRANSFER_FORMAT,
    schemaVersion: options.schemaVersion || SETTINGS_TRANSFER_SCHEMA_VERSION,
    appVersion: options.appVersion || "2.4.17",
    exportedAt: "2026-07-17T12:34:00.000Z",
    assets: { included: options.assetsIncluded !== false },
    features,
  };
}

test("Cricket and Tactics profiles survive export/import with separate layout settings and palettes", () => {
  const values = (feature, field, value) => Object.values(buildFeatureSettingPatch(feature, field, value).features)[0];
  const configured = normalizeRuntimeConfig({
    featureToggles: { cricketLayout: true, cricketGridStatusEffects: true, cricketTargetHighlighter: true },
    features: {
      cricketLayout: { enabled: true, ...values("cricketLayout", "profile", "distance"), tacticsOverrides: true, ...values("cricketLayout", "tacticsProfile", "multiplayer") },
      cricketGridStatusEffects: { enabled: true, ...values("cricketGridStatusEffects", "displayProfile", "calm"), colorTheme: "blue-orange" },
      cricketTargetHighlighter: { enabled: true, ...values("cricketTargetHighlighter", "displayProfile", "learning"), colorTheme: "blue-orange" },
    },
  });
  const exported = createSettingsExport(configured, { descriptors: xconfigDescriptors });
  const roundTrip = analyzeSettingsImport(exported.payload, normalizeRuntimeConfig(), { descriptors: xconfigDescriptors, mode: "replace" });
  for (const key of ["cricketLayout", "cricketGridStatusEffects", "cricketTargetHighlighter"]) {
    // Backups use canonical settings; retired aliases need not be exported twice.
    const spec = getFeatureConfigSpec(key);
    assert.deepEqual(spec.normalizeConfig(roundTrip.config.features[key]), spec.normalizeConfig(configured.features[key]));
    assert.equal(roundTrip.config.featureToggles[key], true);
  }
});

test("settings transfer schema covers every visible stored field", () => {
  const schema = createSettingsTransferSchema(xconfigDescriptors);

  xconfigDescriptors.forEach((descriptor) => {
    const catalogEntry = getFeatureCatalogEntryByFeatureKey(descriptor.featureKey);
    const featureSchema = schema.get(catalogEntry.configKey);
    const defaults = createDefaultFeatureConfig(catalogEntry.configKey);
    assert.ok(featureSchema, descriptor.featureKey);
    descriptor.fields
      .filter((field) => field.control !== "action" && field.key)
      .forEach((field) => {
        assert.ok(Object.hasOwn(defaults, field.key), `${catalogEntry.configKey}.${field.key}`);
        assert.ok(featureSchema.fields.has(field.key), `${catalogEntry.configKey}.${field.key}`);
      });
  });
});

test("settings export creates a stable versioned backup and optionally omits local images", () => {
  const config = normalizeRuntimeConfig({
    featureToggles: { "themes.globalBackground": true },
    features: {
      themes: {
        globalBackground: {
          enabled: true,
          backgroundImageDataUrl: SMALL_PNG,
          backgroundDisplayMode: "fit",
        },
      },
    },
  });

  const complete = createSettingsExport(config, {
    appVersion: "2.4.17",
    descriptors: xconfigDescriptors,
    exportedAt: "2026-07-17T12:34:00.000Z",
  });
  assert.equal(complete.fileName, "autodarts-xconfig-backup-20260717-1234.json");
  assert.equal(complete.payload.format, SETTINGS_TRANSFER_FORMAT);
  assert.equal(complete.payload.schemaVersion, 1);
  assert.equal(complete.payload.features["themes.globalBackground"].enabled, true);
  assert.equal(complete.payload.features["themes.globalBackground"].settings.backgroundImageDataUrl, SMALL_PNG);
  assert.equal(complete.payload.features["themes.x01"], undefined);

  const compact = createSettingsExport(config, {
    includeAssets: false,
    descriptors: xconfigDescriptors,
    exportedAt: "2026-07-17T12:34:00.000Z",
  });
  assert.equal(compact.payload.assets.included, false);
  assert.equal(
    Object.hasOwn(compact.payload.features["themes.globalBackground"].settings, "backgroundImageDataUrl"),
    false
  );
  assert.equal(compact.payload.features["themes.globalBackground"].settings.backgroundDisplayMode, "fit");
});

test("remaining score size survives export/import and old or invalid backups stay safe", () => {
  const configured = normalizeRuntimeConfig({
    featureToggles: { "themes.globalTypography": true },
    features: {
      themes: {
        globalTypography: {
          enabled: true,
          remainingScoreSize: "very-large",
        },
      },
    },
  });
  const exported = createSettingsExport(configured, {
    appVersion: "3.1.6",
    descriptors: xconfigDescriptors,
    exportedAt: "2026-09-27T12:34:00.000Z",
  });
  assert.equal(
    exported.payload.features["themes.globalTypography"].settings.remainingScoreSize,
    "very-large"
  );

  const roundTrip = analyzeSettingsImport(exported.payload, normalizeRuntimeConfig(), {
    descriptors: xconfigDescriptors,
    mode: "replace",
  });
  assert.equal(
    roundTrip.config.features.themes.globalTypography.remainingScoreSize,
    "very-large"
  );

  const oldBackup = analyzeSettingsImport(createEnvelope({
    "themes.globalTypography": {
      enabled: true,
      settings: { fontPreset: "aldrich" },
    },
  }), configured, { descriptors: xconfigDescriptors, mode: "replace" });
  assert.equal(oldBackup.config.features.themes.globalTypography.remainingScoreSize, "auto");

  const invalidBackup = analyzeSettingsImport(createEnvelope({
    "themes.globalTypography": {
      enabled: true,
      settings: { remainingScoreSize: "gigantic" },
    },
  }), configured, { descriptors: xconfigDescriptors, mode: "merge" });
  assert.equal(
    invalidBackup.config.features.themes.globalTypography.remainingScoreSize,
    "very-large"
  );
  assert.ok(
    invalidBackup.report.issues.some((issue) => issue.settingKey === "remainingScoreSize")
  );
});

test("Autodarts dart designer image and part selection survive settings transfer", () => {
  const configured = normalizeRuntimeConfig({
    features: {
      turnDartDisplay: {
        turnDartStyle: "designer",
        turnDartDesignerImageDataUrl: SMALL_PNG,
        turnDartDesignerConfig: TURN_DART_DESIGNER_CONFIG,
      },
    },
  });
  const exported = createSettingsExport(configured, {
    descriptors: xconfigDescriptors,
    exportedAt: "2026-10-01T12:34:00.000Z",
  });
  const settings = exported.payload.features.turnDartDisplay.settings;
  assert.equal(settings.turnDartDesignerImageDataUrl, SMALL_PNG);
  assert.deepEqual(settings.turnDartDesignerConfig, TURN_DART_DESIGNER_CONFIG);

  const roundTrip = analyzeSettingsImport(exported.payload, normalizeRuntimeConfig(), {
    descriptors: xconfigDescriptors,
    mode: "replace",
  });
  assert.equal(roundTrip.config.features.turnDartDisplay.turnDartStyle, "designer");
  assert.equal(roundTrip.config.features.turnDartDisplay.turnDartDesignerImageDataUrl, SMALL_PNG);
  assert.deepEqual(
    roundTrip.config.features.turnDartDisplay.turnDartDesignerConfig,
    TURN_DART_DESIGNER_CONFIG
  );

  const compact = createSettingsExport(configured, {
    includeAssets: false,
    descriptors: xconfigDescriptors,
    exportedAt: "2026-10-01T12:34:00.000Z",
  });
  assert.equal(
    Object.hasOwn(
      compact.payload.features.turnDartDisplay.settings,
      "turnDartDesignerImageDataUrl"
    ),
    false
  );
  assert.deepEqual(
    compact.payload.features.turnDartDisplay.settings.turnDartDesignerConfig,
    TURN_DART_DESIGNER_CONFIG
  );
});

test("settings import applies valid values and skips incompatible fields without aborting", () => {
  const current = normalizeRuntimeConfig({
    features: {
      tvBoardZoom: { zoomLevel: 2.35, zoomSpeed: "langsam" },
    },
  });
  const analysis = analyzeSettingsImport(
    createEnvelope({
      tvBoardZoom: {
        enabled: true,
        settings: {
          zoomLevel: 3.15,
          zoomSpeed: "warp",
          removedSetting: true,
        },
      },
      removedFeature: {
        enabled: true,
        settings: { value: 1 },
      },
    }),
    current,
    { descriptors: xconfigDescriptors, mode: "merge" }
  );

  assert.equal(analysis.report.status, "ready");
  assert.equal(analysis.config.featureToggles.tvBoardZoom, true);
  assert.equal(analysis.config.features.tvBoardZoom.zoomLevel, 3.15);
  assert.equal(analysis.config.features.tvBoardZoom.zoomSpeed, "langsam");
  assert.ok(analysis.report.counts.applied >= 2);
  assert.ok(analysis.report.counts.skipped >= 3);
  assert.match(
    analysis.report.issues.find((issue) => issue.settingKey === "zoomSpeed").message,
    /nicht unterstützt/
  );
});

test("merge preserves missing values while replace starts from current defaults", () => {
  const current = normalizeRuntimeConfig({
    featureToggles: { tvBoardZoom: true },
    features: {
      tvBoardZoom: { enabled: true, zoomSpeed: "langsam" },
      themes: { globalBackground: { backgroundImageDataUrl: SMALL_PNG } },
    },
  });
  const payload = createEnvelope({
    tvBoardZoom: {
      enabled: false,
      settings: { zoomLevel: 3.15 },
    },
  }, { assetsIncluded: false });

  const merged = analyzeSettingsImport(payload, current, {
    descriptors: xconfigDescriptors,
    mode: "merge",
  });
  assert.equal(merged.config.features.tvBoardZoom.zoomSpeed, "langsam");

  const replaced = analyzeSettingsImport(payload, current, {
    descriptors: xconfigDescriptors,
    mode: "replace",
  });
  assert.equal(replaced.config.features.tvBoardZoom.zoomSpeed, "mittel");
  assert.equal(replaced.config.features.themes.globalBackground.backgroundImageDataUrl, SMALL_PNG);
});

test("settings import migrates known feature and field aliases", () => {
  const analysis = analyzeSettingsImport(
    createEnvelope({
      checkoutBoardTargets: {
        enabled: true,
        settings: {
          effect: "blink",
          targetSelectionMode: "all",
        },
      },
      cricketGridStatusEffects: {
        enabled: true,
        settings: {
          threatEdge: false,
        },
      },
    }),
    normalizeRuntimeConfig(),
    { descriptors: xconfigDescriptors, appVersion: "2.4.17" }
  );

  assert.equal(analysis.config.features.checkoutTargetHighlights.visualPreset, "fast-blink");
  assert.equal(analysis.config.features.checkoutTargetHighlights.targetSelectionMode, "all");
  assert.equal(analysis.config.features.cricketGridStatusEffects.pressureEdge, false);
  assert.ok(analysis.report.counts.migrated >= 3);
});

test("settings import accepts raw runtime and known legacy config structures", () => {
  const raw = analyzeSettingsImport({
    featureToggles: { checkoutScorePulse: false },
    features: {
      checkoutScorePulse: { effect: "glow-only" },
    },
  }, normalizeRuntimeConfig(), { descriptors: xconfigDescriptors });
  assert.equal(raw.config.features.checkoutScoreHighlight.effect, "glow-only");
  assert.equal(raw.config.featureToggles.checkoutScoreHighlight, false);

  const legacy = analyzeSettingsImport({
    features: {
      "a-tv-board-zoom": {
        enabled: true,
        settings: {
          ZOOM_STUFE: 3.15,
          ZOOM_GESCHWINDIGKEIT: "schnell",
        },
      },
    },
  }, normalizeRuntimeConfig(), { descriptors: xconfigDescriptors });
  assert.equal(legacy.config.featureToggles.tvBoardZoom, true);
  assert.equal(legacy.config.features.tvBoardZoom.zoomLevel, 3.15);
  assert.ok(legacy.report.counts.migrated > 0);
});

test("legacy Templates Global values split once while existing new values win", () => {
  const legacyPayload = createEnvelope({
    "themes.globalTypography": {
      enabled: true,
      settings: {
        fontPreset: "aldrich",
        backgroundDisplayMode: "fit",
        backgroundOpacity: 40,
        backgroundImageDataUrl: SMALL_PNG,
        turnDartStyle: "gradient",
        turnDartColor: "#22c55e",
      },
    },
    "themes.globalBackground": {
      enabled: false,
      settings: { backgroundOpacity: 70 },
    },
  });
  const first = analyzeSettingsImport(legacyPayload, normalizeRuntimeConfig(), {
    descriptors: xconfigDescriptors,
  });

  assert.equal(first.config.features.themes.globalTypography.fontPreset, "aldrich");
  assert.equal(first.config.features.themes.globalTypography.backgroundOpacity, undefined);
  assert.equal(first.config.features.themes.globalBackground.backgroundDisplayMode, "fit");
  assert.equal(first.config.features.themes.globalBackground.backgroundOpacity, 70);
  assert.equal(first.config.features.themes.globalBackground.backgroundImageDataUrl, SMALL_PNG);
  assert.equal(first.config.features.turnDartDisplay.turnDartStyle, "gradient");
  assert.equal(first.config.features.turnDartDisplay.turnDartColor, "#22C55E");
  assert.equal(first.config.featureToggles["themes.globalBackground"], false);
  assert.equal(first.config.featureToggles.turnDartDisplay, true);

  const normalizedAgain = normalizeRuntimeConfig(first.config);
  assert.deepEqual(normalizedAgain, first.config);
});

test("future backups import known fields with a warning and invalid assets stay untouched", () => {
  const current = normalizeRuntimeConfig({
    features: { themes: { globalBackground: { backgroundImageDataUrl: SMALL_PNG } } },
  });
  const analysis = analyzeSettingsImport(
    createEnvelope({
      "themes.globalBackground": {
        enabled: true,
        settings: {
          backgroundOpacity: 40,
          backgroundImageDataUrl: "data:image/svg+xml;base64,PHN2Zz4=",
        },
      },
    }, { schemaVersion: 9, appVersion: "9.0.0" }),
    current,
    { descriptors: xconfigDescriptors, appVersion: "2.4.17" }
  );

  assert.equal(analysis.report.status, "ready");
  assert.equal(analysis.report.status, "ready");
  assert.equal(analysis.config.features.themes.globalBackground.backgroundOpacity, 40);
  assert.equal(analysis.config.features.themes.globalBackground.backgroundImageDataUrl, SMALL_PNG);
  assert.ok(analysis.report.issues.some((issue) => issue.code === "newer-schema-version"));
  assert.ok(analysis.report.issues.some((issue) => issue.code === "newer-app-version"));
  assert.ok(analysis.report.issues.some((issue) => issue.settingKey === "backgroundImageDataUrl"));
});

test("malformed files and unsafe keys never produce an import candidate", () => {
  const invalidJson = analyzeSettingsImport("{", normalizeRuntimeConfig(), {
    descriptors: xconfigDescriptors,
  });
  assert.equal(invalidJson.report.status, "fatal");
  assert.equal(invalidJson.config, null);

  const unsafePayload = JSON.parse(`{
    "format":"${SETTINGS_TRANSFER_FORMAT}",
    "schemaVersion":1,
    "features":{
      "tvBoardZoom":{
        "enabled":true,
        "settings":{"__proto__":{"polluted":true},"zoomLevel":3.15}
      }
    }
  }`);
  const analysis = analyzeSettingsImport(unsafePayload, normalizeRuntimeConfig(), {
    descriptors: xconfigDescriptors,
  });
  assert.equal(analysis.config.features.tvBoardZoom.zoomLevel, 3.15);
  assert.equal({}.polluted, undefined);
  assert.ok(analysis.report.issues.some((issue) => issue.code === "forbidden-setting"));
});
