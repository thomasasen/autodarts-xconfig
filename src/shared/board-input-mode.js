const ACTIVE_ATTRIBUTE_RULES = Object.freeze([
  Object.freeze({ name: "aria-pressed", values: ["true"] }),
  Object.freeze({ name: "aria-selected", values: ["true"] }),
  Object.freeze({ name: "aria-checked", values: ["true"] }),
  Object.freeze({ name: "data-active", values: ["true"] }),
  Object.freeze({ name: "data-selected", values: ["true"] }),
  Object.freeze({ name: "data-checked", values: ["true"] }),
  Object.freeze({ name: "data-pressed", values: ["true"] }),
  Object.freeze({ name: "data-state", values: ["active", "checked", "selected", "on"] }),
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

  return labelCandidates.some((candidate) => modeDefinition.labels.includes(candidate));
}

function isNodeActive(node) {
  if (!node || typeof node !== "object") {
    return false;
  }

  if (node.checked === true) {
    return true;
  }

  return ACTIVE_ATTRIBUTE_RULES.some((rule) => {
    const value = normalizeText(node.getAttribute?.(rule.name));
    return Boolean(value) && rule.values.includes(value);
  });
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

  for (const modeDefinition of MODE_DEFINITIONS) {
    const activeNode = nodes.find((node) => {
      return nodeMatchesMode(node, modeDefinition) && isNodeActive(node);
    });
    if (activeNode) {
      return modeDefinition.key;
    }
  }

  return "";
}

export function isCoordinateBoardInputModeActive(documentRef) {
  return getActiveBoardInputMode(documentRef) === "coords";
}
