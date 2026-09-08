const MATCH_ROUTE_PREFIX = "/matches";
const XCONFIG_ROUTE_PATH = "/ad-xconfig";
const XCONFIG_ROUTE_HASH = "#ad-xconfig";

export function clampNumber(value, minValue, maxValue, fallbackValue) {
  const numeric = Number(value);
  const resolved = Number.isFinite(numeric) ? numeric : Number(fallbackValue);
  if (!Number.isFinite(resolved)) {
    return Number(minValue);
  }
  return Math.min(Math.max(resolved, Number(minValue)), Number(maxValue));
}

function normalizeRoutePath(pathValue) {
  let normalized = String(pathValue || "").trim().toLowerCase();
  if (!normalized) {
    return "";
  }

  if (!normalized.startsWith("/")) {
    normalized = `/${normalized}`;
  }

  const suffixIndex = normalized.search(/[?#]/);
  if (suffixIndex >= 0) {
    normalized = normalized.slice(0, suffixIndex);
  }
  while (normalized.includes("//")) {
    normalized = normalized.replaceAll("//", "/");
  }
  while (normalized.length > 1 && normalized.endsWith("/")) {
    normalized = normalized.slice(0, -1);
  }
  return normalized;
}

function resolveRoutePath(windowRef, documentRef) {
  const locationRef = windowRef?.location || documentRef?.defaultView?.location || null;
  const path = normalizeRoutePath(locationRef?.pathname || "");
  const hash = String(locationRef?.hash || "").trim().toLowerCase();

  if (path === XCONFIG_ROUTE_PATH || hash === XCONFIG_ROUTE_HASH) {
    return "";
  }

  return path;
}

export function isThemeGameContextActive(options = {}) {
  const routePath = resolveRoutePath(options.windowRef, options.documentRef);
  return routePath === MATCH_ROUTE_PREFIX || routePath.startsWith(`${MATCH_ROUTE_PREFIX}/`);
}
