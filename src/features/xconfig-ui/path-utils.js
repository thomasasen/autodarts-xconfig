import {
  setNestedValue as setSharedNestedValue,
  splitFeaturePath as splitSharedFeaturePath,
} from "../../config/feature-path-utils.js";
import { normalizeThemeBackgroundHost } from "../../shared/theme-background-host-utils.js";
import { buildCricketLayoutSettingValues } from "../../shared/cricket-layout-config.js";
import { buildCricketDisplaySettingValues } from "../../shared/cricket-display-config.js";

export function splitFeaturePath(featureKey) {
  return splitSharedFeaturePath(featureKey);
}

export function setNestedValue(rootValue, pathParts, value) {
  const normalizedPathParts = Array.isArray(pathParts) ? pathParts : [];
  return setSharedNestedValue(rootValue, normalizedPathParts, value);
}

export function buildFeatureSettingPatch(configKey, settingKey, value) {
  const patch = {
    features: {},
  };
  const path = splitFeaturePath(configKey);
  if (!path.length || !String(settingKey || "").trim()) {
    return patch;
  }

  const key = String(settingKey || "").trim();
  let featurePatch = { [key]: value };
  if (configKey === "cricketLayout") {
    featurePatch = buildCricketLayoutSettingValues(key, value);
  } else if (["cricketGridStatusEffects", "cricketTargetHighlighter"].includes(configKey)) {
    featurePatch = buildCricketDisplaySettingValues(configKey, key, value);
  }
  setNestedValue(patch.features, path, featurePatch);
  return patch;
}

export function themeKeyFromConfigKey(configKey) {
  const path = splitFeaturePath(configKey);
  if (!path.length || path[0] !== "themes") {
    return "";
  }
  return normalizeThemeBackgroundHost(path[1] || "");
}

export function isThemeFeature(feature) {
  return String(feature?.configKey || "").startsWith("themes.");
}

export function isBackgroundThemeFeature(feature) {
  return Boolean(themeKeyFromConfigKey(feature?.configKey || ""));
}
