function normalizeVisibilityText(value) {
  return String(value || "").trim().toLowerCase();
}

function getComputedStyleRef(node) {
  const viewRef = node?.ownerDocument?.defaultView;
  if (!viewRef || typeof viewRef.getComputedStyle !== "function") {
    return null;
  }

  try {
    return viewRef.getComputedStyle(node);
  } catch (_) {
    return null;
  }
}

function hasImmediateHiddenSignal(node) {
  if (!node || typeof node !== "object") {
    return true;
  }

  if (node.hidden === true) {
    return true;
  }

  const ariaHidden = normalizeVisibilityText(node.getAttribute?.("aria-hidden"));
  if (ariaHidden === "true") {
    return true;
  }

  const hiddenAttribute =
    typeof node.getAttribute === "function" ? node.getAttribute("hidden") : null;
  if (hiddenAttribute !== null) {
    return true;
  }

  const state = normalizeVisibilityText(node.getAttribute?.("data-state"));
  if (state === "inactive" || state === "closed" || state === "hidden" || state === "off") {
    return true;
  }

  const inlineDisplay = normalizeVisibilityText(node.style?.display);
  const inlineVisibility = normalizeVisibilityText(node.style?.visibility);
  const inlineOpacity = normalizeVisibilityText(node.style?.opacity);
  return inlineDisplay === "none" || inlineVisibility === "hidden" || inlineOpacity === "0";
}

function isComputedHidden(node) {
  const computedStyle = getComputedStyleRef(node);
  if (!computedStyle) {
    return false;
  }

  const display = normalizeVisibilityText(computedStyle.display);
  const visibility = normalizeVisibilityText(computedStyle.visibility);
  const opacity = normalizeVisibilityText(computedStyle.opacity);
  return (
    display === "none" ||
    visibility === "hidden" ||
    visibility === "collapse" ||
    opacity === "0"
  );
}

function hasClientRects(node) {
  if (!node || typeof node.getClientRects !== "function") {
    return true;
  }

  try {
    return node.getClientRects().length > 0;
  } catch (_) {
    return true;
  }
}

const CLIENT_RECT_FALLBACK_TAGS = new Set([
  "a",
  "b",
  "button",
  "em",
  "i",
  "label",
  "small",
  "span",
  "strong",
  "text",
  "tspan",
]);

function shouldUseClientRectFallback(node) {
  const tagName = String(node?.tagName || node?.nodeName || "")
    .trim()
    .toLowerCase();
  if (!tagName) {
    return false;
  }
  return CLIENT_RECT_FALLBACK_TAGS.has(tagName);
}

export function getRenderableArea(node) {
  if (!node || typeof node.getBoundingClientRect !== "function") {
    return 0;
  }

  try {
    const rect = node.getBoundingClientRect();
    const width = Number.parseFloat(rect?.width);
    const height = Number.parseFloat(rect?.height);
    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
      return 0;
    }
    return Math.floor(width * height);
  } catch (_) {
    return 0;
  }
}

export function isNodeVisible(node) {
  if (!node || typeof node !== "object" || node.isConnected === false) {
    return false;
  }

  const renderableArea = getRenderableArea(node);
  const hasGeometry =
    renderableArea > 0 || (shouldUseClientRectFallback(node) && hasClientRects(node));
  let current = node;
  while (current && current !== current.ownerDocument?.documentElement?.parentNode) {
    if (hasImmediateHiddenSignal(current)) {
      return false;
    }
    current = current.parentElement || current.parentNode || null;
  }

  if (hasGeometry && !isComputedHidden(node)) {
    return true;
  }

  current = node;
  while (current && current !== current.ownerDocument?.documentElement?.parentNode) {
    if (isComputedHidden(current)) {
      return false;
    }
    current = current.parentElement || current.parentNode || null;
  }

  return hasGeometry;
}
