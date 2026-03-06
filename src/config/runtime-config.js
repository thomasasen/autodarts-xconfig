import { defaultConfig } from "./default-config.js";

const CHECKOUT_EFFECTS = new Set(["pulse", "glow", "scale", "blink"]);
const CHECKOUT_INTENSITIES = new Set(["dezent", "standard", "stark"]);
const CHECKOUT_TRIGGER_SOURCES = new Set([
  "suggestion-first",
  "score-only",
  "suggestion-only",
]);
const CHECKOUT_COLORS = new Set([
  "159, 219, 88",
  "56, 189, 248",
  "245, 158, 11",
  "248, 113, 113",
]);

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

function normalizeStringChoice(value, fallbackValue, allowedSet) {
  const normalized = String(value || "").trim().toLowerCase();
  if (allowedSet.has(normalized)) {
    return normalized;
  }
  return fallbackValue;
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

function normalizeCheckoutScorePulseConfig(rawConfig = {}) {
  return {
    enabled: normalizeBoolean(rawConfig.enabled, true),
    effect: normalizeStringChoice(rawConfig.effect, "scale", CHECKOUT_EFFECTS),
    colorTheme: CHECKOUT_COLORS.has(String(rawConfig.colorTheme || "").trim())
      ? String(rawConfig.colorTheme).trim()
      : "159, 219, 88",
    intensity: normalizeStringChoice(rawConfig.intensity, "standard", CHECKOUT_INTENSITIES),
    triggerSource: normalizeStringChoice(
      rawConfig.triggerSource,
      "suggestion-first",
      CHECKOUT_TRIGGER_SOURCES
    ),
    debug: normalizeBoolean(rawConfig.debug, false),
  };
}

export function createRuntimeConfig(overrides = {}) {
  let rawConfig = deepMerge(defaultConfig, overrides);

  function getRaw() {
    return deepClone(rawConfig);
  }

  function getFeatureConfig(featureKey) {
    if (featureKey === "checkoutScorePulse") {
      return normalizeCheckoutScorePulseConfig(rawConfig?.features?.checkoutScorePulse || {});
    }

    return deepClone(rawConfig?.features?.[featureKey] || {});
  }

  function isFeatureEnabled(featureKey) {
    const featureConfig = getFeatureConfig(featureKey);
    const toggleValue = rawConfig?.featureToggles?.[featureKey];

    if (typeof toggleValue !== "undefined") {
      return normalizeBoolean(toggleValue, featureConfig.enabled);
    }

    return normalizeBoolean(featureConfig.enabled, false);
  }

  function setFeatureEnabled(featureKey, enabled) {
    if (!rawConfig.featureToggles || typeof rawConfig.featureToggles !== "object") {
      rawConfig.featureToggles = {};
    }

    rawConfig.featureToggles[featureKey] = normalizeBoolean(enabled, false);

    if (!rawConfig.features || typeof rawConfig.features !== "object") {
      rawConfig.features = {};
    }

    if (!rawConfig.features[featureKey] || typeof rawConfig.features[featureKey] !== "object") {
      rawConfig.features[featureKey] = {};
    }

    rawConfig.features[featureKey].enabled = normalizeBoolean(enabled, false);
  }

  function update(partialConfig = {}) {
    rawConfig = deepMerge(rawConfig, partialConfig);
    return getRaw();
  }

  return {
    getRaw,
    getFeatureConfig,
    isFeatureEnabled,
    setFeatureEnabled,
    update,
  };
}