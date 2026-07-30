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
      if (Object.hasOwn(targetThemeConfig, "turnDartImageDataUrl")) {
        targetThemeConfig.turnDartImageDataUrl = "";
      }
      return;
    }

    const sourceThemeConfig = sourceConfig?.features?.themes?.[themeKey];
    targetThemeConfig.backgroundImageDataUrl = normalizeThemeBackgroundImage(
      sourceThemeConfig?.backgroundImageDataUrl || ""
    );
    if (Object.hasOwn(targetThemeConfig, "turnDartImageDataUrl")) {
      targetThemeConfig.turnDartImageDataUrl = normalizeThemeBackgroundImage(
        sourceThemeConfig?.turnDartImageDataUrl || ""
      );
    }
  });
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
  applyFeatureToggleState(config, true);
  applyRecommendedFeatureDefaults(config);
  applyThemeBackgroundImages(config, sourceConfig, false);
  return normalizeRuntimeConfig(config);
}

export function createRuntimeConfig(overrides = {}) {
  let rawConfig = migrateLegacyFeatureConfigKeys(
    deepMerge(createDefaultConfigFromFeatureSpecs(), migrateLegacyFeatureConfigKeys(deepClone(overrides)))
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
    if (!normalizedKey) {
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
    rawConfig = migrateLegacyFeatureConfigKeys(
      deepMerge(rawConfig, migrateLegacyFeatureConfigKeys(deepClone(partialConfig)))
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
