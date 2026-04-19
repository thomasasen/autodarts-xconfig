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

function normalizeHashValue(hashValue) {
  const normalized = String(hashValue || "").trim().toLowerCase();
  if (!normalized) {
    return "";
  }
  return normalized.startsWith("#") ? normalized : `#${normalized}`;
}

function normalizeSidebarRouteHints(values) {
  if (values instanceof Set) {
    return values;
  }
  return new Set(Array.isArray(values) ? values : []);
}

export function toRoutePathname(windowRef, hrefValue) {
  const href = String(hrefValue || "").trim();
  if (!href || href.startsWith("#") || href.startsWith("javascript:")) {
    return "";
  }

  try {
    const parsed = new URL(href, windowRef?.location?.origin || "https://play.autodarts.io");
    return normalizeRoutePath(parsed.pathname);
  } catch (_) {
    return normalizeRoutePath(href);
  }
}

export function currentRoute(windowRef) {
  const locationRef = windowRef?.location;
  return `${locationRef?.pathname || ""}${locationRef?.search || ""}${locationRef?.hash || ""}`;
}

export function isLegacyConfigPath(pathValue, configPath) {
  return normalizeRoutePath(pathValue) === normalizeRoutePath(configPath);
}

export function isConfigHash(hashValue, configHash) {
  return normalizeHashValue(hashValue) === normalizeHashValue(configHash);
}

function scoreSidebarCandidate(windowRef, candidate, options = {}) {
  if (!candidate || typeof candidate.querySelectorAll !== "function") {
    return -1;
  }

  const panelHostId = String(options.panelHostId || "").trim();
  if (panelHostId && candidate.closest?.(`#${panelHostId}`)) {
    return -1;
  }

  const sidebarRouteHints = normalizeSidebarRouteHints(options.sidebarRouteHints);
  const anchors = Array.from(candidate.querySelectorAll("a[href]"));
  const routeMatches = anchors.reduce((count, anchor) => {
    return count + (sidebarRouteHints.has(toRoutePathname(windowRef, anchor.getAttribute("href"))) ? 1 : 0);
  }, 0);
  if (routeMatches <= 0) {
    return -1;
  }

  let score = routeMatches * 20 + Math.min(anchors.length, 8);
  if (candidate.classList?.contains("navigation")) {
    score += 10;
  }
  if (candidate.matches?.("nav") || candidate.getAttribute?.("role") === "navigation") {
    score += 12;
  }

  const width = Number(candidate.getBoundingClientRect?.().width || 0);
  if (width > 0 && width < 520) {
    score += 6;
  }

  return score;
}

export function getSidebarElement(windowRef, documentRef, options = {}) {
  const root = documentRef?.getElementById?.("root");
  if (!root) {
    return null;
  }

  const candidates = [
    root.querySelector?.(".navigation"),
    root.querySelector?.("nav"),
    root.querySelector?.("[role='navigation']"),
    ...Array.from(root.querySelectorAll?.(".navigation") || []),
    ...Array.from(root.querySelectorAll?.("nav") || []),
    ...Array.from(root.querySelectorAll?.("[role='navigation']") || []),
  ].filter(Boolean);

  let best = null;
  let bestScore = -1;
  candidates.forEach((candidate) => {
    const score = scoreSidebarCandidate(windowRef, candidate, options);
    if (score > bestScore) {
      best = candidate;
      bestScore = score;
    }
  });

  return bestScore >= 12 ? best : null;
}

export function isNavigationElement(node) {
  if (!node) {
    return false;
  }

  if (node.classList?.contains("navigation")) {
    return true;
  }

  if (node.matches?.("nav") || node.getAttribute?.("role") === "navigation") {
    return true;
  }

  return false;
}

function isPanelHostElement(node, panelHostId) {
  return Boolean(node) && String(node.id || "") === String(panelHostId || "");
}

function isVisibleElement(node) {
  if (!node?.style) {
    return true;
  }
  return String(node.style.display || "").toLowerCase() !== "none";
}

function scoreContentCandidate(node, options = {}) {
  if (!node || isNavigationElement(node) || isPanelHostElement(node, options.panelHostId)) {
    return Number.NEGATIVE_INFINITY;
  }

  let score = 0;
  if (node.matches?.("main")) {
    score += 100;
  }
  if (isVisibleElement(node)) {
    score += 20;
  }

  const rect = node.getBoundingClientRect?.();
  const width = Number(rect?.width || 0);
  const height = Number(rect?.height || 0);
  score += Math.min(width, 2000) / 10;
  score += Math.min(height, 2000) / 20;

  return score;
}

function findBestContentCandidate(candidates = [], options = {}) {
  let best = null;
  let bestScore = Number.NEGATIVE_INFINITY;

  candidates.forEach((candidate) => {
    const score = scoreContentCandidate(candidate, options);
    if (score > bestScore) {
      best = candidate;
      bestScore = score;
    }
  });

  return best;
}

export function getContentElement(windowRef, documentRef, sidebarElement, options = {}) {
  const root = documentRef?.getElementById?.("root");
  if (!root) {
    return null;
  }

  const main = root.querySelector?.("main");
  if (main) {
    return main;
  }

  const sidebar = sidebarElement || getSidebarElement(windowRef, documentRef, options);
  const siblingCandidates = Array.from(sidebar?.parentNode?.children || []).filter((child) => child !== sidebar);
  const contentSibling = findBestContentCandidate(siblingCandidates, options);
  if (contentSibling) {
    return contentSibling;
  }

  const directChildren = Array.from(root.children || []);
  return findBestContentCandidate(directChildren, options);
}

export function removeNodeById(documentRef, nodeId) {
  const node = documentRef?.getElementById?.(nodeId);
  if (typeof node?.remove === "function") {
    node.remove();
  }
}
