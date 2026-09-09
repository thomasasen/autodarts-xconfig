import { defaultConfig } from "./default-config.js";
import { featureCatalog, getFeatureCatalogEntryByConfigKey } from "../shared/feature-catalog.js";
import {
  createDefaultConfigFromFeatureSpecs,
  getFeatureConfigKeys,
  getFeatureConfigSpec,
  getThemeBackgroundHostKeys,
  listFeatureConfigSpecs,
} from "./feature-config-spec.js";
import { getNestedValue, setNestedValue, splitFeaturePath } from "./feature-path-utils.js";

function deepClone(value) {
  if (value === null || typeof value !== "object") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => deepClone(item));
  }

  return Object.keys(value).reduce((result, key) => {
    result[key] = deepClone(value[key]);
    return result;
  }, {});
}

function deepMerge(baseValue, nextValue) {
  if (nextValue === null || typeof nextValue !== "object") {
    return deepClone(nextValue);
  }

  if (Array.isArray(nextValue)) {
    return nextValue.map((item) => deepClone(item));
  }

  const base =
    baseValue && typeof baseValue === "object" && !Array.isArray(baseValue)
      ? baseValue
      : {};

  const merged = { ...base };
  Object.keys(nextValue).forEach((key) => {
    merged[key] = deepMerge(base[key], nextValue[key]);
  });
  return merged;
}

function deleteNestedValue(rootValue, pathParts = []) {
  if (!rootValue || typeof rootValue !== "object" || !Array.isArray(pathParts) || !pathParts.length) {
    return;
  }

  let current = rootValue;
  for (let index = 0; index < pathParts.length - 1; index += 1) {
    current = current?.[pathParts[index]];
    if (!current || typeof current !== "object") {
      return;
    }
  }

  delete current[pathParts.at(-1)];
}

const LEGACY_GAME_THEME_KEYS = Object.freeze([
  "x01",
  "gotcha",
  "x01TwoPlayer",
  "shanghai",
  "bermuda",
  "cricket",
  "bullOff",
]);
const LEGACY_GLOBAL_BACKGROUND_FIELDS = Object.freeze([
  "backgroundDisplayMode",
  "backgroundOpacity",
  "playerFieldTransparency",
  "backgroundImageDataUrl",
  "backgroundAssetKey",
]);
const LEGACY_TURN_DART_FIELDS = Object.freeze([
  "turnDartStyle",
  "turnDartAssetKey",
  "turnDartTextTemplate",
  "turnDartColor",
  "turnDartGradientColor",
  "turnDartSizePercent",
  "turnDartShineEnabled",
  "turnDartImageDataUrl",
]);
const REMOVED_FEATURE_CONFIG_KEYS = Object.freeze([
  "activePlayerSweep",
  "turnStartSweep",
  "winnerCelebrationEffect",
  "winnerFireworks",
]);

function isObjectLike(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function copyMissingFields(target, source, fieldKeys) {
  fieldKeys.forEach((fieldKey) => {
    if (!Object.hasOwn(target, fieldKey) && Object.hasOwn(source, fieldKey)) {
      target[fieldKey] = deepClone(source[fieldKey]);
    }
  });
}

function ensureObjectProperty(parent, key) {
  if (isObjectLike(parent[key])) {
    return parent[key];
  }
  const nextValue = {};
  parent[key] = nextValue;
  return nextValue;
}

function resolveLegacyThemeEnabled(featureToggles, typography) {
  if (Object.hasOwn(featureToggles, "themes.globalTypography")) {
    return featureToggles["themes.globalTypography"];
  }
  return typography.enabled;
}

function copyLegacyDebug(targets, typography) {
  if (!Object.hasOwn(typography, "debug")) {
    return;
  }
  targets.forEach((target) => {
    if (!Object.hasOwn(target, "debug")) {
      target.debug = typography.debug;
    }
  });
}

function copyLegacyEnabled(target, legacyEnabled) {
  if (!Object.hasOwn(target, "enabled") && legacyEnabled !== undefined) {
    target.enabled = legacyEnabled;
  }
}

function copyLegacyToggle(featureToggles, configKey, legacyEnabled) {
  if (!Object.hasOwn(featureToggles, configKey) && legacyEnabled !== undefined) {
    featureToggles[configKey] = legacyEnabled;
  }
}

function migrateLegacyGlobalThemeSettings(features, themes, featureToggles) {
  const typography = isObjectLike(themes.globalTypography)
    ? themes.globalTypography
    : null;
  if (!typography) {
    return;
  }

  const legacyEnabled = resolveLegacyThemeEnabled(featureToggles, typography);
  const globalBackground = ensureObjectProperty(themes, "globalBackground");
  const turnDartDisplay = ensureObjectProperty(features, "turnDartDisplay");

  copyMissingFields(globalBackground, typography, LEGACY_GLOBAL_BACKGROUND_FIELDS);
  copyMissingFields(turnDartDisplay, typography, LEGACY_TURN_DART_FIELDS);
  copyLegacyDebug([globalBackground, turnDartDisplay], typography);
  copyLegacyEnabled(globalBackground, legacyEnabled);
  copyLegacyEnabled(turnDartDisplay, legacyEnabled);
  copyLegacyToggle(featureToggles, "themes.globalBackground", legacyEnabled);
  copyLegacyToggle(featureToggles, "turnDartDisplay", legacyEnabled);

  new Set([...LEGACY_GLOBAL_BACKGROUND_FIELDS, ...LEGACY_TURN_DART_FIELDS])
    .forEach((fieldKey) => delete typography[fieldKey]);
}

function removeLegacyGameThemes(themes, featureToggles) {
  LEGACY_GAME_THEME_KEYS.forEach((themeKey) => {
    delete themes[themeKey];
    delete featureToggles[`themes.${themeKey}`];
  });
}

function migrateLegacyThemeStructure(configValue = {}) {
  if (!isObjectLike(configValue)) {
    return;
  }

  const featureToggles = ensureObjectProperty(configValue, "featureToggles");
  const features = ensureObjectProperty(configValue, "features");
  const themes = ensureObjectProperty(features, "themes");
  migrateLegacyGlobalThemeSettings(features, themes, featureToggles);
  removeLegacyGameThemes(themes, featureToggles);
}

function stripRemovedFeatureConfigKeys(configValue = {}) {
  if (!isObjectLike(configValue)) {
    return configValue;
  }

  REMOVED_FEATURE_CONFIG_KEYS.forEach((configKey) => {
    delete configValue.featureToggles?.[configKey];
    deleteNestedValue(configValue.features || {}, splitFeaturePath(configKey));
  });

  return configValue;
}

function canonicalConfigKey(configKey) {
  const normalizedKey = String(configKey || "").trim();
  return getFeatureCatalogEntryByConfigKey(normalizedKey)?.configKey || normalizedKey;
}

function migrateLegacyFeatureConfigKeys(configValue = {}) {
  if (!configValue || typeof configValue !== "object") {
    return configValue;
  }

  featureCatalog.forEach((entry) => {
    const canonicalKey = entry.configKey;
    const legacyConfigKeys = Array.isArray(entry.legacyConfigKeys) ? entry.legacyConfigKeys : [];
    legacyConfigKeys.forEach((legacyConfigKey) => {
      if (!legacyConfigKey || legacyConfigKey === canonicalKey) {
        return;
      }

      if (
        configValue.featureToggles &&
        typeof configValue.featureToggles === "object" &&
        Object.hasOwn(configValue.featureToggles, legacyConfigKey)
      ) {
        if (!Object.hasOwn(configValue.featureToggles, canonicalKey)) {
          configValue.featureToggles[canonicalKey] = configValue.featureToggles[legacyConfigKey];
        }
        delete configValue.featureToggles[legacyConfigKey];
      }

      const legacyPath = splitFeaturePath(legacyConfigKey);
      const canonicalPath = splitFeaturePath(canonicalKey);
      const legacyFeatureConfig = getNestedValue(configValue.features || {}, legacyPath);
      if (!legacyFeatureConfig || typeof legacyFeatureConfig !== "object" || Array.isArray(legacyFeatureConfig)) {
        deleteNestedValue(configValue.features || {}, legacyPath);
        return;
      }

      const canonicalFeatureConfig = getNestedValue(configValue.features || {}, canonicalPath);
      setNestedValue(configValue.features || {}, canonicalPath, {
        ...legacyFeatureConfig,
        ...(canonicalFeatureConfig && typeof canonicalFeatureConfig === "object"
          ? canonicalFeatureConfig
          : {}),
      });
      deleteNestedValue(configValue.features || {}, legacyPath);
    });
  });

  return configValue;
}

function normalizeBoolean(value, fallbackValue) {
  if (typeof value === "boolean") {
    return value;
  }

  const normalized = String(value || "").trim().toLowerCase();
  if (["true", "1", "yes", "on", "active", "aktiv"].includes(normalized)) {
    return true;
  }
  if (["false", "0", "no", "off", "inactive", "inaktiv"].includes(normalized)) {
    return false;
  }

  return Boolean(fallbackValue);
}

function mergeFeatureConfigWithUnknownFields(rawFeatureConfig, normalizedFeatureConfig) {
  const raw =
    rawFeatureConfig && typeof rawFeatureConfig === "object" && !Array.isArray(rawFeatureConfig)
      ? deepClone(rawFeatureConfig)
      : {};
  const normalized =
    normalizedFeatureConfig &&
    typeof normalizedFeatureConfig === "object" &&
    !Array.isArray(normalizedFeatureConfig)
      ? normalizedFeatureConfig
      : {};

  return {
    ...raw,
    ...normalized,
  };
}

function collectFeatureKeysFromObject(value, prefix = "", result = new Set()) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return result;
  }

  Object.keys(value).forEach((key) => {
    const normalizedKey = String(key || "").trim();
    if (!normalizedKey) {
      return;
    }

    const nextPrefix = prefix ? `${prefix}.${normalizedKey}` : normalizedKey;
    const entry = value[normalizedKey];
    const isObjectEntry = Boolean(entry) && typeof entry === "object" && !Array.isArray(entry);
    if (!isObjectEntry) {
      return;
    }

    if (Object.hasOwn(entry, "enabled")) {
      result.add(nextPrefix);
    }

    collectFeatureKeysFromObject(entry, nextPrefix, result);
  });

  return result;
}

function createPresetBaseConfig() {
  return deepClone(defaultConfig);
}

function applyFeatureToggleState(configValue, enabled) {
  if (!configValue || typeof configValue !== "object" || Array.isArray(configValue)) {
    return;
  }

  const normalizedEnabled = Boolean(enabled);
  getFeatureConfigKeys().forEach((featureKey) => {
    if (Object.hasOwn(configValue.featureToggles || {}, featureKey)) {
      configValue.featureToggles[featureKey] = normalizedEnabled;
    }
  });

  const featureKeys = collectFeatureKeysFromObject(configValue.features || {});
  featureKeys.forEach((featureKey) => {
    const featureConfig = getNestedValue(configValue.features || {}, splitFeaturePath(featureKey));
    if (!featureConfig || typeof featureConfig !== "object" || Array.isArray(featureConfig)) {
      return;
    }

    featureConfig.enabled = normalizedEnabled;
    if (Object.hasOwn(featureConfig, "debug")) {
      featureConfig.debug = false;
    }
  });
}

function normalizeThemeBackgroundImage(rawValue) {
  const dataUrl = String(rawValue || "").trim();
  if (!dataUrl.startsWith("data:image/")) {
    return "";
  }
  return dataUrl;
}

function applyThemeBackgroundImages(configValue, sourceConfig = null, shouldClear = false) {
  const themeConfigs = configValue?.features?.themes;
  if (!themeConfigs || typeof themeConfigs !== "object" || Array.isArray(themeConfigs)) {
    return;
  }

  getThemeBackgroundHostKeys().forEach((themeKey) => {
    const targetThemeConfig = themeConfigs[themeKey];
    if (!targetThemeConfig || typeof targetThemeConfig !== "object" || Array.isArray(targetThemeConfig)) {
      return;
    }

    if (shouldClear) {
      targetThemeConfig.backgroundImageDataUrl = "";
      return;
    }

    const sourceThemeConfig = sourceConfig?.features?.themes?.[themeKey];
    targetThemeConfig.backgroundImageDataUrl = normalizeThemeBackgroundImage(
      sourceThemeConfig?.backgroundImageDataUrl || ""
    );
  });

  const targetTurnDartConfig = configValue?.features?.turnDartDisplay;
  if (isObjectLike(targetTurnDartConfig)) {
    targetTurnDartConfig.turnDartImageDataUrl = shouldClear
      ? ""
      : normalizeThemeBackgroundImage(
          sourceConfig?.features?.turnDartDisplay?.turnDartImageDataUrl || ""
        );
  }
}

function applyRecommendedFeatureDefaults(configValue) {
  const featureRoot = configValue?.features;
  if (!featureRoot || typeof featureRoot !== "object" || Array.isArray(featureRoot)) {
    return;
  }

  listFeatureConfigSpecs().forEach((entry) => {
    const featureConfig = getNestedValue(featureRoot, splitFeaturePath(entry.configKey));
    if (!featureConfig || typeof featureConfig !== "object" || Array.isArray(featureConfig)) {
      return;
    }

    const recommendedConfig = entry.createRecommendedConfig();
    Object.assign(featureConfig, recommendedConfig);

    if (
      configValue.featureToggles &&
      typeof configValue.featureToggles === "object" &&
      Object.hasOwn(recommendedConfig, "enabled")
    ) {
      configValue.featureToggles[entry.configKey] = Boolean(recommendedConfig.enabled);
    }
  });
}

function buildHardResetRuntimeConfig() {
  const config = createPresetBaseConfig();
  applyFeatureToggleState(config, false);
  applyThemeBackgroundImages(config, null, true);
  return normalizeRuntimeConfig(config);
}

function buildRecommendedRuntimeConfig(sourceConfig = {}) {
  const config = createPresetBaseConfig();
  applyRecommendedFeatureDefaults(config);
  applyFeatureToggleState(config, false);
  applyThemeBackgroundImages(config, sourceConfig, false);
  return normalizeRuntimeConfig(config);
}

export function createRuntimeConfig(overrides = {}) {
  const migratedOverrides = deepClone(overrides);
  migrateLegacyThemeStructure(migratedOverrides);
  stripRemovedFeatureConfigKeys(migratedOverrides);
  let rawConfig = migrateLegacyFeatureConfigKeys(
    deepMerge(
      createDefaultConfigFromFeatureSpecs(),
      migrateLegacyFeatureConfigKeys(migratedOverrides)
    )
  );
  let revision = 0;

  function getRevision() {
    return revision;
  }

  function getRaw() {
    return deepClone(rawConfig);
  }

  function getRawFeatureConfig(featureKey) {
    const pathParts = splitFeaturePath(canonicalConfigKey(featureKey));
    if (!pathParts.length) {
      return {};
    }

    const resolvedValue = getNestedValue(rawConfig?.features || {}, pathParts);
    return resolvedValue === null ? {} : resolvedValue;
  }

  function getRawFeatureToggle(featureKey) {
    const normalizedKey = canonicalConfigKey(featureKey);
    if (!normalizedKey) {
      return undefined;
    }

    if (Object.hasOwn(rawConfig?.featureToggles || {}, normalizedKey)) {
      return rawConfig.featureToggles[normalizedKey];
    }

    return getNestedValue(rawConfig?.featureToggles || {}, splitFeaturePath(normalizedKey));
  }

  function getFeatureConfig(featureKey) {
    const normalizedKey = canonicalConfigKey(featureKey);
    const configSpec = getFeatureConfigSpec(normalizedKey);
    const rawFeatureConfig = getRawFeatureConfig(normalizedKey);

    if (!configSpec) {
      return deepClone(rawFeatureConfig);
    }

    const mergedFeatureConfig = mergeFeatureConfigWithUnknownFields(
      rawFeatureConfig,
      configSpec.normalizeConfig(rawFeatureConfig)
    );

    configSpec.removeKeys.forEach((removeKey) => {
      delete mergedFeatureConfig[removeKey];
    });

    return mergedFeatureConfig;
  }

  function getNormalized() {
    const featureKeysFromFeatures = collectFeatureKeysFromObject(rawConfig?.features || {});
    const featureKeys = new Set([
      ...getFeatureConfigKeys(),
      ...Object.keys(rawConfig?.featureToggles || {}),
      ...featureKeysFromFeatures,
    ]);

    const normalizedFeatureToggles = {};
    const normalizedFeatures = deepClone(rawConfig?.features || {});

    featureKeys.forEach((featureKey) => {
      const canonicalKey = canonicalConfigKey(featureKey);
      const normalizedFeatureConfig = getFeatureConfig(canonicalKey);
      setNestedValue(normalizedFeatures, splitFeaturePath(canonicalKey), normalizedFeatureConfig);

      const rawToggleValue = getRawFeatureToggle(canonicalKey);
      normalizedFeatureToggles[canonicalKey] =
        rawToggleValue !== undefined
          ? normalizeBoolean(rawToggleValue, normalizedFeatureConfig.enabled)
          : normalizeBoolean(normalizedFeatureConfig.enabled, false);
    });

    return {
      ...getRaw(),
      featureToggles: normalizedFeatureToggles,
      features: normalizedFeatures,
    };
  }

  function isFeatureEnabled(featureKey) {
    const normalizedKey = canonicalConfigKey(featureKey);
    const featureConfig = getFeatureConfig(normalizedKey);
    const toggleValue = getRawFeatureToggle(normalizedKey);

    if (toggleValue !== undefined) {
      return normalizeBoolean(toggleValue, featureConfig.enabled);
    }

    return normalizeBoolean(featureConfig.enabled, false);
  }

  function setFeatureEnabled(featureKey, enabled) {
    const normalizedKey = canonicalConfigKey(featureKey);
    if (!normalizedKey || REMOVED_FEATURE_CONFIG_KEYS.includes(normalizedKey)) {
      return;
    }

    if (!rawConfig.featureToggles || typeof rawConfig.featureToggles !== "object") {
      rawConfig.featureToggles = {};
    }

    const normalizedEnabled = normalizeBoolean(enabled, false);
    rawConfig.featureToggles[normalizedKey] = normalizedEnabled;

    if (!rawConfig.features || typeof rawConfig.features !== "object") {
      rawConfig.features = {};
    }

    const featurePath = splitFeaturePath(normalizedKey);
    const currentFeatureConfig = getRawFeatureConfig(normalizedKey);
    setNestedValue(rawConfig.features, featurePath, {
      ...(currentFeatureConfig && typeof currentFeatureConfig === "object"
        ? currentFeatureConfig
        : {}),
      enabled: normalizedEnabled,
    });
    revision += 1;
  }

  function update(partialConfig = {}) {
    const migratedPartialConfig = deepClone(partialConfig);
    migrateLegacyThemeStructure(migratedPartialConfig);
    stripRemovedFeatureConfigKeys(migratedPartialConfig);
    rawConfig = migrateLegacyFeatureConfigKeys(
      deepMerge(rawConfig, migrateLegacyFeatureConfigKeys(migratedPartialConfig))
    );
    revision += 1;
    return getRaw();
  }

  return {
    getRevision,
    getRaw,
    getNormalized,
    getFeatureConfig,
    isFeatureEnabled,
    setFeatureEnabled,
    update,
  };
}

export function normalizeRuntimeConfig(overrides = {}) {
  return createRuntimeConfig(overrides).getNormalized();
}

export function createHardResetRuntimeConfig() {
  return buildHardResetRuntimeConfig();
}

export function createRecommendedRuntimeConfig(sourceConfig = {}) {
  return buildRecommendedRuntimeConfig(sourceConfig);
}
