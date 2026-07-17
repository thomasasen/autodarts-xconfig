import {
  createDefaultConfigFromFeatureSpecs,
  createDefaultFeatureConfig,
  getFeatureConfigSpec,
  listFeatureConfigSpecs,
} from "./feature-config-spec.js";
import { getNestedValue, splitFeaturePath } from "./feature-path-utils.js";
import { normalizeRuntimeConfig } from "./runtime-config.js";
import {
  getFeatureCatalogEntryByConfigKey,
  getFeatureCatalogEntryByFeatureKey,
} from "../shared/feature-catalog.js";
import { normalizeHexColor } from "../shared/hex-color-utils.js";

export const SETTINGS_TRANSFER_FORMAT = "autodarts-xconfig-settings";
export const SETTINGS_TRANSFER_SCHEMA_VERSION = 1;
export const SETTINGS_IMPORT_MODES = Object.freeze(["merge", "replace"]);
export const SETTINGS_IMPORT_MAX_FILE_BYTES = 32 * 1024 * 1024;

const THEME_IMAGE_MAX_BYTES = Math.floor(1.5 * 1024 * 1024);
const TURN_DART_IMAGE_MAX_BYTES = 350 * 1024;
const IMAGE_DATA_URL_PATTERN = /^data:image\/(png|jpeg|webp);base64,([a-z0-9+/=\s]+)$/i;
const FORBIDDEN_KEYS = new Set(["__proto__", "prototype", "constructor"]);
const LEGACY_SETTING_ALIASES = Object.freeze({
  checkoutTargetHighlights: Object.freeze({
    effect: "visualPreset",
    outlineIntensity: "visualPreset",
  }),
  specialHitHighlights: Object.freeze({
    hitColorMode: "colorTheme",
  }),
  cricketTargetHighlighter: Object.freeze({
    showOpenTargets: "showOpenObjectives",
    showDeadTargets: "showDeadObjectives",
    dimIrrelevantBoardTargets: "irrelevantBoardDimStyle",
  }),
  cricketGridStatusEffects: Object.freeze({
    threatEdge: "pressureEdge",
    scoringLane: "scoringStripe",
    deadRowCollapse: "deadRowMuted",
    opponentPressureOverlay: "pressureOverlay",
  }),
  turnScoreCounter: Object.freeze({
    flashPermanent: "flashMode",
  }),
  x01RemainingScoreBar: Object.freeze({
    thresholdColorMode: "colorTheme",
  }),
});
const SPECIAL_TRANSFER_FIELDS = Object.freeze({
  backgroundImageDataUrl: Object.freeze({
    control: "asset",
    label: "Eigenes Hintergrundbild",
    maxBytes: THEME_IMAGE_MAX_BYTES,
  }),
  turnDartImageDataUrl: Object.freeze({
    control: "asset",
    label: "Eigenes Dart-Bild",
    maxBytes: TURN_DART_IMAGE_MAX_BYTES,
  }),
  backgroundAssetKey: Object.freeze({
    control: "normalized-string",
    label: "Preset-Wallpaper",
  }),
});

function isObjectLike(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function deepClone(value) {
  if (value === null || typeof value !== "object") {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((entry) => deepClone(entry));
  }
  return Object.keys(value).reduce((result, key) => {
    if (!FORBIDDEN_KEYS.has(key)) {
      result[key] = deepClone(value[key]);
    }
    return result;
  }, {});
}

function deepEqual(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function normalizeImportMode(mode) {
  return SETTINGS_IMPORT_MODES.includes(mode) ? mode : "merge";
}

function compareVersions(left, right) {
  const normalize = (value) => String(value || "")
    .split(/[.+-]/)
    .slice(0, 3)
    .map((entry) => Math.max(0, Number.parseInt(entry, 10) || 0));
  const leftParts = normalize(left);
  const rightParts = normalize(right);
  for (let index = 0; index < 3; index += 1) {
    const difference = (leftParts[index] || 0) - (rightParts[index] || 0);
    if (difference !== 0) {
      return Math.sign(difference);
    }
  }
  return 0;
}

function formatExportTimestamp(dateValue) {
  const date = dateValue instanceof Date ? dateValue : new Date(dateValue || Date.now());
  const validDate = Number.isNaN(date.getTime()) ? new Date() : date;
  return validDate.toISOString();
}

function buildExportFileName(exportedAt) {
  const compact = String(exportedAt || "")
    .replaceAll(/[-:]/g, "")
    .replaceAll("T", "-")
    .slice(0, 13);
  return `autodarts-xconfig-backup-${compact || "settings"}.json`;
}

function estimateBase64ByteSize(payload) {
  const normalized = String(payload || "").replaceAll(/\s+/g, "");
  if (!normalized) {
    return 0;
  }
  let padding = 0;
  if (normalized.endsWith("==")) {
    padding = 2;
  } else if (normalized.endsWith("=")) {
    padding = 1;
  }
  return Math.max(0, Math.floor((normalized.length * 3) / 4) - padding);
}

function validateImageDataUrl(value, maxBytes) {
  if (value === "") {
    return { valid: true, value: "" };
  }
  if (typeof value !== "string") {
    return { valid: false, reason: "Bilddaten müssen als Data-URL vorliegen." };
  }
  const match = IMAGE_DATA_URL_PATTERN.exec(value.trim());
  if (!match) {
    return { valid: false, reason: "Nur Base64-PNG, JPEG oder WebP werden unterstützt." };
  }
  const byteSize = estimateBase64ByteSize(match[2]);
  if (!byteSize || byteSize > maxBytes) {
    return { valid: false, reason: `Bilddaten überschreiten das Limit von ${maxBytes} Byte.` };
  }
  try {
    const decoded = globalThis.atob(String(match[2]).replaceAll(/\s+/g, ""));
    const mimeType = String(match[1] || "").toLowerCase();
    const hasExpectedSignature =
      (mimeType === "png" && decoded.startsWith("\x89PNG\r\n\x1a\n")) ||
      (mimeType === "jpeg" && decoded.codePointAt(0) === 0xff && decoded.codePointAt(1) === 0xd8) ||
      (mimeType === "webp" && decoded.startsWith("RIFF") && decoded.slice(8, 12) === "WEBP");
    if (!hasExpectedSignature) {
      return { valid: false, reason: "Bildtyp und Dateisignatur passen nicht zusammen." };
    }
  } catch (_) {
    return { valid: false, reason: "Die Base64-Bilddaten sind beschädigt." };
  }
  return { valid: true, value: value.trim() };
}

function normalizeDescriptors(descriptors = []) {
  return new Map(
    (Array.isArray(descriptors) ? descriptors : [])
      .map((descriptor) => [String(descriptor?.featureKey || "").trim(), descriptor])
      .filter(([featureKey]) => featureKey)
  );
}

export function createSettingsTransferSchema(descriptors = []) {
  const descriptorsByFeatureKey = normalizeDescriptors(descriptors);
  return new Map(
    listFeatureConfigSpecs().map((spec) => {
      const descriptor = descriptorsByFeatureKey.get(spec.featureKey);
      const defaultConfig = createDefaultFeatureConfig(spec.configKey);
      const fields = new Map();

      (descriptor?.fields || []).forEach((field) => {
        const key = String(field?.key || "").trim();
        if (!key || field.control === "action" || !Object.hasOwn(defaultConfig, key)) {
          return;
        }
        fields.set(key, Object.freeze({
          key,
          label: String(field.label || key),
          control: String(field.control || ""),
          multiple: field.multiple === true,
          maxLength: Math.max(0, Number(field.maxLength) || 0),
          options: Object.freeze(
            Array.isArray(field.options) ? field.options.map((entry) => entry.value) : []
          ),
        }));
      });

      Object.entries(SPECIAL_TRANSFER_FIELDS).forEach(([key, definition]) => {
        if (Object.hasOwn(defaultConfig, key)) {
          fields.set(key, Object.freeze({ key, ...definition }));
        }
      });

      return [spec.configKey, Object.freeze({
        configKey: spec.configKey,
        featureKey: spec.featureKey,
        title: spec.title,
        fields,
      })];
    })
  );
}

function addIssue(report, status, details = {}) {
  const issue = {
    status,
    code: String(details.code || status),
    featureKey: String(details.featureKey || ""),
    configKey: String(details.configKey || ""),
    settingKey: String(details.settingKey || ""),
    label: String(details.label || ""),
    message: String(details.message || ""),
  };
  report.issues.push(issue);
  report.counts[status] = (report.counts[status] || 0) + 1;
  return issue;
}

function resolveImportStatus(unchanged, migrated) {
  if (unchanged) {
    return "unchanged";
  }
  return migrated ? "migrated" : "applied";
}

function resolveImportDescription(unchanged, migrated) {
  if (unchanged) {
    return "unverändert";
  }
  return migrated ? "migriert" : "übernommen";
}

function createReport(source, mode) {
  return {
    status: "ready",
    source: {
      type: String(source?.type || "unknown"),
      appVersion: String(source?.appVersion || ""),
      schemaVersion: Number(source?.schemaVersion || 0),
      exportedAt: String(source?.exportedAt || ""),
      assetsIncluded: source?.assetsIncluded !== false,
    },
    mode: normalizeImportMode(mode),
    counts: {
      applied: 0,
      migrated: 0,
      skipped: 0,
      unchanged: 0,
      warning: 0,
      fatal: 0,
    },
    issues: [],
  };
}

function fatalReport(message, code = "invalid-payload", source = {}, mode = "merge") {
  const report = createReport(source, mode);
  report.status = "fatal";
  addIssue(report, "fatal", { code, message });
  return { report, config: null };
}

function resolveCanonicalConfigKey(value) {
  const normalized = String(value || "").trim();
  if (!normalized || FORBIDDEN_KEYS.has(normalized)) {
    return "";
  }
  return (
    getFeatureCatalogEntryByConfigKey(normalized)?.configKey ||
    getFeatureCatalogEntryByFeatureKey(normalized)?.configKey ||
    ""
  );
}

function collectExportFeatures(config, schema, includeAssets) {
  const result = {};
  schema.forEach((featureSchema, configKey) => {
    const featureConfig = getNestedValue(config?.features || {}, splitFeaturePath(configKey)) || {};
    const settings = {};
    featureSchema.fields.forEach((field, settingKey) => {
      if (field.control === "asset" && !includeAssets) {
        return;
      }
      if (Object.hasOwn(featureConfig, settingKey)) {
        settings[settingKey] = deepClone(featureConfig[settingKey]);
      }
    });
    result[configKey] = {
      enabled: Boolean(config?.featureToggles?.[configKey] ?? featureConfig.enabled),
      settings,
    };
  });
  return result;
}

export function createSettingsExport(rawConfig = {}, options = {}) {
  const includeAssets = options.includeAssets !== false;
  const exportedAt = formatExportTimestamp(options.exportedAt);
  const schema = createSettingsTransferSchema(options.descriptors);
  const config = normalizeRuntimeConfig(rawConfig);
  const payload = {
    format: SETTINGS_TRANSFER_FORMAT,
    schemaVersion: SETTINGS_TRANSFER_SCHEMA_VERSION,
    appVersion: String(options.appVersion || "unknown"),
    exportedAt,
    assets: {
      included: includeAssets,
    },
    features: collectExportFeatures(config, schema, includeAssets),
  };
  return {
    fileName: buildExportFileName(exportedAt),
    payload,
    summary: {
      featureCount: Object.keys(payload.features).length,
      includeAssets,
    },
  };
}

function parsePayload(payload, mode) {
  let parsed = payload;
  if (typeof payload === "string") {
    try {
      parsed = JSON.parse(payload);
    } catch (_) {
      return fatalReport("Die Datei enthält kein gültiges JSON.", "invalid-json", {}, mode);
    }
  }
  if (!isObjectLike(parsed)) {
    return fatalReport("Die Datei enthält kein gültiges Einstellungsobjekt.", "invalid-root", {}, mode);
  }
  return { parsed };
}

function convertTransferEnvelope(parsed, mode) {
  const source = {
    type: "settings-backup",
    appVersion: parsed.appVersion,
    schemaVersion: parsed.schemaVersion,
    exportedAt: parsed.exportedAt,
    assetsIncluded: parsed.assets?.included !== false,
  };
  if (!Number.isInteger(parsed.schemaVersion) || parsed.schemaVersion < 1) {
    return fatalReport("Die Schema-Version des Backups ist ungültig.", "invalid-schema-version", source, mode);
  }
  if (!isObjectLike(parsed.features)) {
    return fatalReport("Das Backup enthält keine lesbare Feature-Struktur.", "invalid-features", source, mode);
  }
  return { source, features: parsed.features };
}

function convertRawRuntimeConfig(parsed) {
  const features = {};
  listFeatureConfigSpecs().forEach((spec) => {
    const candidateKeys = [spec.configKey, ...(spec.legacyConfigKeys || [])];
    const sourceConfigKey = candidateKeys.find((key) =>
      isObjectLike(getNestedValue(parsed.features || {}, splitFeaturePath(key)))
    );
    const sourceToggleKey = candidateKeys.find((key) =>
      Object.hasOwn(parsed.featureToggles || {}, key)
    );
    const featureConfig = sourceConfigKey
      ? getNestedValue(parsed.features || {}, splitFeaturePath(sourceConfigKey))
      : null;
    const hasToggle = Boolean(sourceToggleKey);
    if (!isObjectLike(featureConfig) && !hasToggle) {
      return;
    }
    const settings = isObjectLike(featureConfig) ? deepClone(featureConfig) : {};
    delete settings.enabled;
    features[spec.configKey] = {
      enabled: hasToggle ? parsed.featureToggles[sourceToggleKey] : featureConfig?.enabled,
      settings,
      migrated:
        (Boolean(sourceConfigKey) && sourceConfigKey !== spec.configKey) ||
        (Boolean(sourceToggleKey) && sourceToggleKey !== spec.configKey),
    };
  });
  return {
    source: { type: "raw-runtime-config", assetsIncluded: true },
    features,
  };
}

function convertLegacyConfig(parsed) {
  const features = {};
  const consumedLegacyIds = new Set();
  listFeatureConfigSpecs().forEach((spec) => {
    const legacyState = parsed.features?.[spec.legacyFeatureId];
    if (!spec.legacyFeatureId || !isObjectLike(legacyState) || typeof spec.importLegacy !== "function") {
      return;
    }
    const imported = spec.importLegacy(legacyState);
    if (!imported?.configKey) {
      return;
    }
    consumedLegacyIds.add(spec.legacyFeatureId);
    const settings = deepClone(imported.config || {});
    delete settings.enabled;
    features[imported.configKey] = {
      enabled: Boolean(imported.enabled),
      settings,
      migrated: true,
    };
  });
  return {
    source: { type: "legacy-config", assetsIncluded: false },
    features,
    unknownFeatureKeys: Object.keys(parsed.features || {}).filter(
      (key) => !consumedLegacyIds.has(key)
    ),
  };
}

function detectSource(parsed, mode) {
  if (Object.hasOwn(parsed, "format")) {
    if (parsed.format !== SETTINGS_TRANSFER_FORMAT) {
      return fatalReport("Das Dateiformat wird nicht unterstützt.", "unsupported-format", {}, mode);
    }
    return convertTransferEnvelope(parsed, mode);
  }
  if (isObjectLike(parsed.featureToggles) && isObjectLike(parsed.features)) {
    return convertRawRuntimeConfig(parsed);
  }
  if (isObjectLike(parsed.features)) {
    return convertLegacyConfig(parsed);
  }
  return fatalReport("Die Einstellungsstruktur wird nicht unterstützt.", "unsupported-structure", {}, mode);
}

function normalizeSelectFieldValue(field, rawValue, spec, defaults, sourceType) {
  const options = field.options || [];
  if (field.multiple) {
    if (!Array.isArray(rawValue) || !rawValue.length) {
      return { valid: false, reason: "Es wird eine nicht leere Auswahlliste erwartet." };
    }
    const values = Array.from(new Set(rawValue));
    return values.every((entry) => options.some((option) => deepEqual(option, entry)))
      ? { valid: true, value: values }
      : { valid: false, reason: "Mindestens eine Auswahl wird nicht mehr unterstützt." };
  }
  const exactOption = options.find((option) => deepEqual(option, rawValue));
  if (exactOption !== undefined) {
    return { valid: true, value: exactOption };
  }
  const normalized = spec.normalizeConfig({ ...defaults, [field.key]: rawValue })?.[field.key];
  const normalizedOption = options.find((option) => deepEqual(option, normalized));
  const safePrimitiveAlias =
    normalizedOption !== undefined &&
    ((typeof rawValue === "string" && String(rawValue).trim().toLowerCase() === String(normalizedOption).toLowerCase()) ||
      (typeof rawValue === "string" && typeof normalizedOption === "number" && Number(rawValue) === normalizedOption));
  if (safePrimitiveAlias || (sourceType === "legacy-config" && normalizedOption !== undefined)) {
    return { valid: true, value: normalizedOption, migrated: true };
  }
  return { valid: false, reason: "Der Wert wird in dieser Version nicht unterstützt." };
}

function normalizeColorFieldValue(rawValue) {
  if (typeof rawValue !== "string") {
    return { valid: false, reason: "Es wird ein Farbwert erwartet." };
  }
  const normalized = normalizeHexColor(rawValue, "");
  return rawValue === "" || normalized
    ? { valid: true, value: normalized, migrated: normalized !== rawValue }
    : { valid: false, reason: "Der Farbwert ist ungültig." };
}

function normalizeTextFieldValue(field, rawValue, spec, defaults) {
  if (typeof rawValue !== "string") {
    return { valid: false, reason: "Es wird Text erwartet." };
  }
  if (field.maxLength > 0 && rawValue.length > field.maxLength) {
    return { valid: false, reason: `Der Text ist länger als ${field.maxLength} Zeichen.` };
  }
  const normalized = spec.normalizeConfig({ ...defaults, [field.key]: rawValue })?.[field.key];
  return { valid: true, value: normalized, migrated: normalized !== rawValue };
}

function normalizeStringFieldValue(field, rawValue, spec, defaults) {
  if (typeof rawValue !== "string") {
    return { valid: false, reason: "Es wird Text erwartet." };
  }
  const normalized = spec.normalizeConfig({ ...defaults, [field.key]: rawValue })?.[field.key];
  return normalized === rawValue
    ? { valid: true, value: normalized }
    : { valid: false, reason: "Der Wert wird in dieser Version nicht unterstützt." };
}

function normalizeFieldValue(field, rawValue, spec, defaults, sourceType) {
  if (field.control === "asset") {
    return validateImageDataUrl(rawValue, field.maxBytes);
  }
  if (field.control === "checkbox") {
    return typeof rawValue === "boolean"
      ? { valid: true, value: rawValue }
      : { valid: false, reason: "Es wird ein Wahrheitswert erwartet." };
  }
  if (field.control === "select") {
    return normalizeSelectFieldValue(field, rawValue, spec, defaults, sourceType);
  }
  if (field.control === "color") {
    return normalizeColorFieldValue(rawValue);
  }
  if (field.control === "text") {
    return normalizeTextFieldValue(field, rawValue, spec, defaults);
  }
  if (field.control === "normalized-string") {
    return normalizeStringFieldValue(field, rawValue, spec, defaults);
  }
  return { valid: false, reason: "Für diese Einstellung fehlt eine Importregel." };
}

function initializeCandidate(currentConfig, mode, assetsIncluded) {
  if (mode === "merge") {
    return deepClone(currentConfig);
  }
  const defaults = createDefaultConfigFromFeatureSpecs();
  if (!assetsIncluded) {
    listFeatureConfigSpecs().forEach((spec) => {
      const currentFeature = getNestedValue(currentConfig.features || {}, splitFeaturePath(spec.configKey));
      const defaultFeature = getNestedValue(defaults.features || {}, splitFeaturePath(spec.configKey));
      ["backgroundImageDataUrl", "turnDartImageDataUrl"].forEach((key) => {
        if (Object.hasOwn(currentFeature || {}, key) && Object.hasOwn(defaultFeature || {}, key)) {
          defaultFeature[key] = currentFeature[key];
        }
      });
    });
  }
  return defaults;
}

export function analyzeSettingsImport(payload, currentRawConfig = {}, options = {}) {
  const mode = normalizeImportMode(options.mode);
  const parsedResult = parsePayload(payload, mode);
  if (parsedResult.report) {
    return parsedResult;
  }
  const detected = detectSource(parsedResult.parsed, mode);
  if (detected.report) {
    return detected;
  }
  const report = createReport(detected.source, mode);
  if (detected.source.schemaVersion > SETTINGS_TRANSFER_SCHEMA_VERSION) {
    addIssue(report, "warning", {
      code: "newer-schema-version",
      message: "Das Backup stammt aus einer neueren Schema-Version; bekannte Einstellungen werden bestmöglich importiert.",
    });
  }
  if (
    detected.source.appVersion &&
    options.appVersion &&
    compareVersions(detected.source.appVersion, options.appVersion) > 0
  ) {
    addIssue(report, "warning", {
      code: "newer-app-version",
      message: `Das Backup stammt aus AD xConfig ${detected.source.appVersion}; bekannte Einstellungen werden bestmöglich importiert.`,
    });
  }
  (detected.unknownFeatureKeys || []).forEach((configKey) => {
    addIssue(report, "skipped", {
      code: "unknown-feature",
      configKey,
      message: `Unbekanntes Feature „${configKey}“ wurde ausgelassen.`,
    });
  });

  const schema = createSettingsTransferSchema(options.descriptors);
  const currentConfig = normalizeRuntimeConfig(currentRawConfig);
  const candidate = initializeCandidate(currentConfig, mode, detected.source.assetsIncluded);
  const seenCanonicalKeys = new Set();
  const sourceEntries = Object.entries(detected.features || {});
  sourceEntries.sort(([left], [right]) => {
    const leftCanonical = resolveCanonicalConfigKey(left);
    const rightCanonical = resolveCanonicalConfigKey(right);
    return Number(left !== leftCanonical) - Number(right !== rightCanonical);
  });

  sourceEntries.forEach(([sourceConfigKey, sourceFeature]) => {
    const configKey = resolveCanonicalConfigKey(sourceConfigKey);
    if (!configKey || !schema.has(configKey)) {
      addIssue(report, "skipped", {
        code: "unknown-feature",
        configKey: sourceConfigKey,
        message: `Unbekanntes Feature „${sourceConfigKey}“ wurde ausgelassen.`,
      });
      return;
    }
    const featureSchema = schema.get(configKey);
    if (seenCanonicalKeys.has(configKey)) {
      addIssue(report, "skipped", {
        code: "duplicate-feature-alias",
        featureKey: featureSchema.featureKey,
        configKey,
        message: `${featureSchema.title}: Ein doppelter Alias-Eintrag wurde ausgelassen.`,
      });
      return;
    }
    seenCanonicalKeys.add(configKey);
    if (!isObjectLike(sourceFeature)) {
      addIssue(report, "skipped", {
        code: "invalid-feature",
        featureKey: featureSchema.featureKey,
        configKey,
        message: `${featureSchema.title}: Die Feature-Struktur ist ungültig.`,
      });
      return;
    }

    const targetFeature = getNestedValue(candidate.features || {}, splitFeaturePath(configKey));
    const currentFeature = getNestedValue(currentConfig.features || {}, splitFeaturePath(configKey));
    const defaults = createDefaultFeatureConfig(configKey);
    const spec = getFeatureConfigSpec(configKey);
    const enabled = sourceFeature.enabled;
    if (typeof enabled === "boolean") {
      const previous = Boolean(currentConfig.featureToggles?.[configKey]);
      candidate.featureToggles[configKey] = enabled;
      targetFeature.enabled = enabled;
      addIssue(report, resolveImportStatus(previous === enabled, sourceFeature.migrated), {
        code: "feature-enabled",
        featureKey: featureSchema.featureKey,
        configKey,
        settingKey: "enabled",
        label: "Aktiv",
        message: `${featureSchema.title}: Aktivierung ${previous === enabled ? "unverändert" : "übernommen"}.`,
      });
    } else if (enabled !== undefined) {
      addIssue(report, "skipped", {
        code: "invalid-enabled",
        featureKey: featureSchema.featureKey,
        configKey,
        settingKey: "enabled",
        label: "Aktiv",
        message: `${featureSchema.title}: Der Aktivierungsstatus ist ungültig.`,
      });
    }

    const settings = isObjectLike(sourceFeature.settings) ? sourceFeature.settings : {};
    const seenSettingKeys = new Set();
    Object.entries(settings).forEach(([sourceSettingKey, rawValue]) => {
      let settingKey = sourceSettingKey;
      if (FORBIDDEN_KEYS.has(settingKey)) {
        addIssue(report, "skipped", {
          code: "forbidden-setting",
          featureKey: featureSchema.featureKey,
          configKey,
          settingKey,
          message: `${featureSchema.title}: Ein unsicherer Schlüssel wurde ausgelassen.`,
        });
        return;
      }
      let field = featureSchema.fields.get(settingKey);
      let aliasMigrated = false;
      if (!field) {
        const canonicalSettingKey = LEGACY_SETTING_ALIASES[configKey]?.[settingKey] || "";
        if (canonicalSettingKey && featureSchema.fields.has(canonicalSettingKey)) {
          if (Object.hasOwn(settings, canonicalSettingKey) || seenSettingKeys.has(canonicalSettingKey)) {
            addIssue(report, "skipped", {
              code: "duplicate-setting-alias",
              featureKey: featureSchema.featureKey,
              configKey,
              settingKey,
              label: settingKey,
              message: `${featureSchema.title} › ${settingKey}: Alias wurde wegen eines aktuellen Eintrags ausgelassen.`,
            });
            return;
          }
          settingKey = canonicalSettingKey;
          field = featureSchema.fields.get(settingKey);
          aliasMigrated = true;
        }
      }
      if (!field) {
        addIssue(report, "skipped", {
          code: "unknown-setting",
          featureKey: featureSchema.featureKey,
          configKey,
          settingKey,
          label: settingKey,
          message: `${featureSchema.title} › ${settingKey}: Einstellung wird nicht mehr unterstützt.`,
        });
        return;
      }
      seenSettingKeys.add(settingKey);
      if (field.control === "asset" && detected.source.assetsIncluded === false) {
        return;
      }
      const importValue = aliasMigrated
        ? spec.normalizeConfig({ ...defaults, ...settings })?.[settingKey]
        : rawValue;
      const validation = normalizeFieldValue(field, importValue, spec, defaults, detected.source.type);
      if (!validation.valid) {
        addIssue(report, "skipped", {
          code: "invalid-setting-value",
          featureKey: featureSchema.featureKey,
          configKey,
          settingKey,
          label: field.label,
          message: `${featureSchema.title} › ${field.label}: ${validation.reason}`,
        });
        return;
      }
      const previous = currentFeature?.[settingKey];
      targetFeature[settingKey] = deepClone(validation.value);
      const unchanged = deepEqual(previous, validation.value);
      const migrated =
        aliasMigrated ||
        validation.migrated ||
        sourceFeature.migrated ||
        sourceConfigKey !== configKey;
      addIssue(report, resolveImportStatus(unchanged, migrated), {
        code: migrated ? "migrated-setting" : "setting-value",
        featureKey: featureSchema.featureKey,
        configKey,
        settingKey,
        label: field.label,
        message: `${featureSchema.title} › ${field.label}: ${resolveImportDescription(unchanged, migrated)}.`,
      });
    });

    if (!targetFeature || !currentFeature) {
      addIssue(report, "fatal", {
        code: "missing-feature-target",
        featureKey: featureSchema.featureKey,
        configKey,
        message: `${featureSchema.title}: Zielkonfiguration konnte nicht erstellt werden.`,
      });
    }
  });

  if (report.counts.fatal > 0) {
    report.status = "fatal";
    return { report, config: null };
  }
  const applicableCount = report.counts.applied + report.counts.migrated;
  if (applicableCount === 0) {
    report.status = "empty";
  }
  return {
    report,
    config: normalizeRuntimeConfig(candidate),
  };
}

export function summarizeSettingsImport(report) {
  const counts = report?.counts || {};
  return `${Number(counts.applied || 0)} übernommen, ${Number(counts.migrated || 0)} migriert, ${Number(counts.skipped || 0)} ausgelassen.`;
}
