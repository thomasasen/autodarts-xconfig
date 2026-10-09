export function normalizeRoutePath(pathValue) {
  let normalized = String(pathValue || "").trim().toLowerCase();
  if (!normalized) {
    return "";
  }

  if (!normalized.startsWith("/")) {
    normalized = `/${normalized}`;
  }

  normalized = normalized.replace(/[?#].*$/, "").replaceAll(/\/{2,}/g, "/");
  if (normalized.length > 1) {
    normalized = normalized.replace(/\/+$/, "");
  }
  return normalized;
}

export function normalizeHashValue(hashValue) {
  const normalized = String(hashValue || "").trim().toLowerCase();
  if (!normalized) {
    return "";
  }
  return normalized.startsWith("#") ? normalized : `#${normalized}`;
}
