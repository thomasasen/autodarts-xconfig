export function normalizeFeatureKey(value) {
  return String(value || "").trim();
}

export function normalizeConfigKey(value) {
  return String(value || "").trim();
}

export function normalizeFeatureIdentity(definition) {
  return {
    featureKey: normalizeFeatureKey(definition?.featureKey),
    configKey: normalizeConfigKey(definition?.configKey),
  };
}

export function buildFeatureIndex(entries, selector = (entry) => entry?.featureKey) {
  const index = new Map();
  if (!Array.isArray(entries)) {
    return index;
  }

  entries.forEach((entry, position) => {
    const key = normalizeFeatureKey(selector(entry));
    if (!key || index.has(key)) {
      return;
    }
    index.set(key, position);
  });

  return index;
}

export function buildFeatureMap(
  entries,
  selector = (entry) => entry?.featureKey,
  valueSelector = (entry) => entry
) {
  const map = new Map();
  if (!Array.isArray(entries)) {
    return map;
  }

  entries.forEach((entry) => {
    const key = normalizeFeatureKey(selector(entry));
    if (!key || map.has(key)) {
      return;
    }
    map.set(key, valueSelector(entry));
  });

  return map;
}
