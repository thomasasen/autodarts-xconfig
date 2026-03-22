function isObjectLike(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function splitFeaturePath(featureKey) {
  return String(featureKey || "")
    .split(".")
    .map((part) => String(part || "").trim())
    .filter(Boolean);
}

export function setNestedValue(rootValue, pathParts = [], value) {
  if (!isObjectLike(rootValue) || !Array.isArray(pathParts) || !pathParts.length) {
    return;
  }

  let current = rootValue;
  for (let index = 0; index < pathParts.length - 1; index += 1) {
    const part = pathParts[index];
    if (!isObjectLike(current[part])) {
      current[part] = {};
    }
    current = current[part];
  }

  current[pathParts[pathParts.length - 1]] = value;
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
  return path[1] || "";
}

export function isThemeFeature(feature) {
  return String(feature?.configKey || "").startsWith("themes.");
}
