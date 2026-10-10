import { normalizeRoutePath } from "../../../shared/route-normalization.js";

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
