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

  return current === undefined ? null : current;
}

export function setNestedValue(rootValue, pathParts, value) {
  const normalizedPathParts = Array.isArray(pathParts) ? pathParts : [];
  if (!isObjectLike(rootValue) || !normalizedPathParts.length) {
    return;
  }

  let current = rootValue;
  for (let index = 0; index < normalizedPathParts.length - 1; index += 1) {
    const part = normalizedPathParts[index];
    if (!isObjectLike(current[part])) {
      current[part] = {};
    }
    current = current[part];
  }

  current[normalizedPathParts.at(-1)] = value;
}
