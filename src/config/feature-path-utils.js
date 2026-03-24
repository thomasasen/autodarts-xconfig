function isObjectLike(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function splitFeaturePath(featureKey) {
  return String(featureKey || "")
    .split(".")
    .map((part) => String(part || "").trim())
    .filter(Boolean);
}

export function getNestedValue(rootValue, pathParts = []) {
  if (!isObjectLike(rootValue) || !Array.isArray(pathParts) || !pathParts.length) {
    return null;
  }

  let current = rootValue;
  for (const part of pathParts) {
    if (!current || typeof current !== "object") {
      return null;
    }

    current = current[part];
  }

  return typeof current === "undefined" ? null : current;
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
