const PROTECTED_CRICKET_HOST_SELECTORS = Object.freeze([
  "#ad-ext-player-display",
  ".ad-ext-player",
  "[data-ad-ext-cricket-stack]",
  "#ad-ext-turn",
  "#ad-ext-game-settings-extra",
  ".ad-ext-theme-content-board",
  ".ad-ext-theme-board-panel",
  ".ad-ext-theme-board-viewport",
  ".ad-ext-theme-board-canvas",
]);

const PROTECTED_CRICKET_GRID_ROOT_SELECTORS = Object.freeze([
  "#ad-ext-player-display",
  ".ad-ext-theme-content-board",
  ".ad-ext-theme-board-panel",
  ".ad-ext-theme-board-viewport",
  ".ad-ext-theme-board-canvas",
]);

function matchesSelector(node, selector) {
  if (!node || typeof node.matches !== "function") {
    return false;
  }
  try {
    return Boolean(node.matches(selector));
  } catch (_) {
    return false;
  }
}

function hasSelectorInSubtree(node, selector) {
  if (!node || typeof node.querySelector !== "function") {
    return false;
  }
  try {
    return Boolean(node.querySelector(selector));
  } catch (_) {
    return false;
  }
}

export function isProtectedCricketHostNode(node) {
  if (!node || typeof node !== "object") {
    return false;
  }

  const tagName = String(node.tagName || "").toUpperCase();
  if (tagName === "HTML" || tagName === "BODY" || tagName === "MAIN" || tagName === "NAV") {
    return true;
  }

  if (String(node.id || "") === "root") {
    return true;
  }

  const isInsideProtectedHost =
    typeof node.closest === "function" &&
    PROTECTED_CRICKET_HOST_SELECTORS.some((selector) => {
      try {
        return Boolean(node.closest(selector));
      } catch (_) {
        return false;
      }
    });
  if (isInsideProtectedHost) {
    return true;
  }

  const role = String(node.getAttribute?.("role") || "").trim().toLowerCase();
  return role === "main" || role === "navigation";
}

export function isProtectedCricketGridRootCandidate(node) {
  if (!node || typeof node !== "object") {
    return false;
  }

  return PROTECTED_CRICKET_GRID_ROOT_SELECTORS.some((selector) => {
    return matchesSelector(node, selector) || hasSelectorInSubtree(node, selector);
  });
}
