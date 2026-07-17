import test from "node:test";
import assert from "node:assert/strict";

import {
  SETTINGS_TRANSFER_FORMAT,
  SETTINGS_TRANSFER_SCHEMA_VERSION,
  analyzeSettingsImport,
  createSettingsExport,
  createSettingsTransferSchema,
} from "../../src/config/config-transfer.js";
import { createDefaultFeatureConfig } from "../../src/config/feature-config-spec.js";
import { normalizeRuntimeConfig } from "../../src/config/runtime-config.js";
import { xconfigDescriptors } from "../../src/features/xconfig-ui/descriptors.js";
import { getFeatureCatalogEntryByFeatureKey } from "../../src/shared/feature-catalog.js";

const SMALL_PNG = "data:image/png;base64,iVBORw0KGgo=";

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
    featureToggles: { "themes.x01": true },
    features: {
      themes: {
        x01: {
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
  assert.equal(complete.payload.features["themes.x01"].enabled, true);
  assert.equal(complete.payload.features["themes.x01"].settings.backgroundImageDataUrl, SMALL_PNG);

  const compact = createSettingsExport(config, {
    includeAssets: false,
    descriptors: xconfigDescriptors,
    exportedAt: "2026-07-17T12:34:00.000Z",
  });
  assert.equal(compact.payload.assets.included, false);
  assert.equal(
    Object.hasOwn(compact.payload.features["themes.x01"].settings, "backgroundImageDataUrl"),
    false
  );
  assert.equal(compact.payload.features["themes.x01"].settings.backgroundDisplayMode, "fit");
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
      themes: { x01: { backgroundImageDataUrl: SMALL_PNG } },
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
  assert.equal(replaced.config.features.themes.x01.backgroundImageDataUrl, SMALL_PNG);
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

test("future backups import known fields with a warning and invalid assets stay untouched", () => {
  const current = normalizeRuntimeConfig({
    features: { themes: { x01: { backgroundImageDataUrl: SMALL_PNG } } },
  });
  const analysis = analyzeSettingsImport(
    createEnvelope({
      "themes.x01": {
        enabled: true,
        settings: {
          showAvg: false,
          backgroundImageDataUrl: "data:image/svg+xml;base64,PHN2Zz4=",
        },
      },
    }, { schemaVersion: 9, appVersion: "9.0.0" }),
    current,
    { descriptors: xconfigDescriptors, appVersion: "2.4.17" }
  );

  assert.equal(analysis.report.status, "ready");
  assert.equal(analysis.config.features.themes.x01.showAvg, false);
  assert.equal(analysis.config.features.themes.x01.backgroundImageDataUrl, SMALL_PNG);
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
