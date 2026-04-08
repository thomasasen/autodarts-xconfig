import {
  setNestedValue as setSharedNestedValue,
  splitFeaturePath as splitSharedFeaturePath,
} from "../../config/feature-path-utils.js";
import { normalizeThemeKey } from "../../shared/theme-key-utils.js";

export function splitFeaturePath(featureKey) {
  return splitSharedFeaturePath(featureKey);
}

export function setNestedValue(rootValue, pathParts = [], value) {
  return setSharedNestedValue(rootValue, pathParts, value);
}

export function buildFeatureSettingPatch(configKey, settingKey, value) {
  const patch = {
    features: {},
  };
  const path = splitFeaturePath(configKey);
  if (!path.length || !String(settingKey || "").trim()) {
    return patch;
  }

  const featurePatch = {
    [String(settingKey || "").trim()]: value,
  };
  setNestedValue(patch.features, path, featurePatch);
  return patch;
}

export function themeKeyFromConfigKey(configKey) {
  const path = splitFeaturePath(configKey);
  if (!path.length || path[0] !== "themes") {
    return "";
  }
  return normalizeThemeKey(path[1] || "");
}

export function isThemeFeature(feature) {
  return String(feature?.configKey || "").startsWith("themes.");
}

export function isBackgroundThemeFeature(feature) {
  return Boolean(themeKeyFromConfigKey(feature?.configKey || ""));
}
