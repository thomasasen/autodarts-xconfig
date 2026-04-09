const ACTIVE_ATTRIBUTE_RULES = Object.freeze([
  Object.freeze({ name: "aria-pressed", values: ["true"] }),
  Object.freeze({ name: "aria-selected", values: ["true"] }),
  Object.freeze({ name: "aria-checked", values: ["true"] }),
  Object.freeze({ name: "data-active", values: ["true"], allowPresentEmptyValue: true }),
  Object.freeze({ name: "data-selected", values: ["true"] }),
  Object.freeze({ name: "data-checked", values: ["true"] }),
  Object.freeze({ name: "data-pressed", values: ["true"] }),
  Object.freeze({ name: "data-state", values: ["active", "checked", "selected", "on"] }),
]);

export const BOARD_INPUT_MODE_ATTRIBUTE_FILTER = Object.freeze([
  ...new Set([
    ...ACTIVE_ATTRIBUTE_RULES.map((rule) => rule.name),
    "checked",
    "aria-label",
    "title",
    "aria-description",
  ]),
]);

const MODE_DEFINITIONS = Object.freeze([
  Object.freeze({
    key: "segments",
    labels: ["segmentmodus", "segment mode"],
  }),
  Object.freeze({
    key: "coords",
    labels: ["koordinatenmodus", "coordinate mode", "coordinates mode", "coords mode"],
  }),
  Object.freeze({
    key: "live",
    labels: ["live-modus", "live mode"],
  }),
]);

function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
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

function getRenderableArea(node) {
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

function isNodeExplicitlyHidden(node) {
  if (!node || typeof node !== "object") {
    return true;
  }

  if (node.hidden === true) {
    return true;
  }

  const hiddenAttribute =
    typeof node.getAttribute === "function" ? node.getAttribute("hidden") : null;
  if (hiddenAttribute !== null) {
    return true;
  }

  const ariaHidden = normalizeText(node.getAttribute?.("aria-hidden"));
  if (ariaHidden === "true") {
    return true;
  }

  const state = normalizeText(node.getAttribute?.("data-state"));
  if (state === "inactive" || state === "closed" || state === "hidden" || state === "off") {
    return true;
  }

  const inlineDisplay = normalizeText(node.style?.display);
  const inlineVisibility = normalizeText(node.style?.visibility);
  const inlineOpacity = normalizeText(node.style?.opacity);
  if (inlineDisplay === "none" || inlineVisibility === "hidden" || inlineOpacity === "0") {
    return true;
  }

  const computedStyle = getComputedStyleRef(node);
  if (!computedStyle) {
    return false;
  }

  const display = normalizeText(computedStyle.display);
  const visibility = normalizeText(computedStyle.visibility);
  const opacity = normalizeText(computedStyle.opacity);
  return display === "none" || visibility === "hidden" || visibility === "collapse" || opacity === "0";
}

function isNodeVisible(node) {
  if (!node || typeof node !== "object" || node.isConnected === false) {
    return false;
  }

  let current = node;
  while (current && current !== current.ownerDocument?.documentElement?.parentNode) {
    if (isNodeExplicitlyHidden(current)) {
      return false;
    }
    current = current.parentElement || current.parentNode || null;
  }

  return hasClientRects(node) || getRenderableArea(node) > 0;
}

function getNodeLabelCandidates(node) {
  if (!node || typeof node !== "object") {
    return [];
  }

  const values = [
    node.getAttribute?.("aria-label"),
    node.getAttribute?.("title"),
    node.getAttribute?.("aria-description"),
    node.dataset?.tooltip,
    node.dataset?.label,
    node.value,
    node.textContent,
  ];

  return values.map((value) => normalizeText(value)).filter(Boolean);
}

function nodeMatchesMode(node, modeDefinition) {
  if (!node || !modeDefinition) {
    return false;
  }

  const labelCandidates = getNodeLabelCandidates(node);
  if (!labelCandidates.length) {
    return false;
  }

  return labelCandidates.some((candidate) => {
    return modeDefinition.labels.some((label) => candidate === label || candidate.includes(label));
  });
}

export function isBoardInputModeControl(node) {
  if (!node) {
    return false;
  }

  return MODE_DEFINITIONS.some((modeDefinition) => nodeMatchesMode(node, modeDefinition));
}

function isNodeActive(node) {
  return getNodeActiveStrength(node) > 0;
}

function getNodeActiveStrength(node) {
  if (!node || typeof node !== "object") {
    return 0;
  }

  let strength = 0;
  if (node.checked === true) {
    strength += 2;
  }

  ACTIVE_ATTRIBUTE_RULES.forEach((rule) => {
    const rawValue = node.getAttribute?.(rule.name);
    const value = normalizeText(node.getAttribute?.(rule.name));
    if (
      (Boolean(value) && rule.values.includes(value)) ||
      (rule.allowPresentEmptyValue === true && rawValue === "")
    ) {
      strength += 1;
    }
  });

  return strength;
}

function collectModeNodes(documentRef) {
  if (!documentRef || typeof documentRef.querySelectorAll !== "function") {
    return [];
  }

  const selectors = [
    "button",
    "[role='button']",
    "[role='tab']",
    "[role='radio']",
    "input[type='radio']",
    "[aria-label]",
    "[title]",
  ];
  const seen = new Set();
  const nodes = [];

  selectors.forEach((selector) => {
    Array.from(documentRef.querySelectorAll(selector)).forEach((node) => {
      if (!node || seen.has(node)) {
        return;
      }
      seen.add(node);
      nodes.push(node);
    });
  });

  return nodes;
}

export function getActiveBoardInputMode(documentRef) {
  const nodes = collectModeNodes(documentRef);
  if (!nodes.length) {
    return "";
  }

  let bestCandidate = null;
  let bestScore = -1;

  nodes.forEach((node, index) => {
    const modeDefinition = MODE_DEFINITIONS.find((definition) => nodeMatchesMode(node, definition));
    if (!modeDefinition || !isNodeActive(node)) {
      return;
    }

    const activeStrength = getNodeActiveStrength(node);
    const visible = isNodeVisible(node);
    const area = getRenderableArea(node);
    const score =
      (visible ? 10_000_000 : 0) +
      activeStrength * 100_000 +
      Math.min(area, 99_999) +
      index;

    if (score > bestScore) {
      bestScore = score;
      bestCandidate = modeDefinition.key;
    }
  });

  if (bestCandidate) {
    return bestCandidate;
  }

  return "";
}

export function isCoordinateBoardInputModeActive(documentRef) {
  return getActiveBoardInputMode(documentRef) === "coords";
}

export function isLiveBoardInputModeActive(documentRef) {
  return getActiveBoardInputMode(documentRef) === "live";
}
