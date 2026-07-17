import { getRenderableArea, isNodeVisible } from "./dom-visibility.js";

export const BOARD_INPUT_MODE_CONTROL_SELECTOR = Object.freeze([
  "button",
  "[role='button']",
  "[role='tab']",
  "[role='radio']",
  "[role='switch']",
  "[role='checkbox']",
  "input[type='button']",
  "input[type='submit']",
  "input[type='radio']",
  "input[type='checkbox']",
].join(","));
export const BOARD_CONTROLS_SOURCE_MIRRORED_ATTRIBUTE =
  "data-ad-ext-board-controls-source-mirrored";

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
    "selected",
    "hidden",
    "disabled",
    "aria-label",
    "aria-labelledby",
    "title",
    "aria-description",
    "aria-hidden",
    "aria-disabled",
    "data-disabled",
    "data-hidden",
    "data-label",
    "data-status",
    "data-tooltip",
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
    labels: ["live-modus", "live mode", "live board", "live-board", "liveboard"],
  }),
  Object.freeze({
    key: "virtual",
    labels: ["virtual board", "virtual-board", "virtuelles board", "virtuelle tafel"],
  }),
]);

function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replaceAll(/\s+/g, " ");
}

function getLabelledByText(node) {
  const documentRef = node?.ownerDocument || null;
  const labelledBy = String(node?.getAttribute?.("aria-labelledby") || "").trim();
  if (!documentRef || !labelledBy || typeof documentRef.getElementById !== "function") {
    return "";
  }

  return labelledBy
    .split(/\s+/)
    .map((id) => documentRef.getElementById(id)?.textContent || "")
    .filter(Boolean)
    .join(" ");
}

export function getBoardInputModeLabelCandidates(node) {
  if (!node || typeof node !== "object") {
    return [];
  }

  const values = [
    node.getAttribute?.("aria-label"),
    getLabelledByText(node),
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

  const labelCandidates = getBoardInputModeLabelCandidates(node);
  if (!labelCandidates.length) {
    return false;
  }

  return labelCandidates.some((candidate) => {
    return modeDefinition.labels.some((label) => candidate === label || candidate.includes(label));
  });
}

export function isBoardInputModeInteractiveControl(node) {
  if (!node || typeof node.matches !== "function") {
    return false;
  }

  try {
    return node.matches(BOARD_INPUT_MODE_CONTROL_SELECTOR);
  } catch (_) {
    return false;
  }
}

export function getBoardInputModeKey(node) {
  if (!node) {
    return "";
  }

  return MODE_DEFINITIONS.find((modeDefinition) => nodeMatchesMode(node, modeDefinition))?.key || "";
}

export function isBoardInputModeControl(node) {
  return isBoardInputModeInteractiveControl(node) && Boolean(getBoardInputModeKey(node));
}

function hasUnavailableDataState(node) {
  const dataFlagEnabled = (name) => {
    const rawValue = node?.getAttribute?.(name);
    if (rawValue === null || rawValue === undefined) {
      return false;
    }
    return !["false", "0", "off", "no"].includes(normalizeText(rawValue));
  };
  const stateValues = [
    node?.getAttribute?.("data-state"),
    node?.getAttribute?.("data-status"),
  ].map(normalizeText);
  return (
    dataFlagEnabled("data-disabled") ||
    dataFlagEnabled("data-hidden") ||
    stateValues.some((value) => ["disabled", "hidden", "unavailable"].includes(value))
  );
}

export function isBoardInputControlAvailable(node) {
  const mirroredSource = node?.closest?.(
    `[${BOARD_CONTROLS_SOURCE_MIRRORED_ATTRIBUTE}="true"]`
  );
  if (
    !isBoardInputModeInteractiveControl(node) ||
    node.isConnected === false ||
    (!mirroredSource && !isNodeVisible(node))
  ) {
    return false;
  }

  return !(
    node.hidden === true ||
    node.disabled === true ||
    node.getAttribute?.("hidden") !== null ||
    (!mirroredSource && normalizeText(node.getAttribute?.("aria-hidden")) === "true") ||
    normalizeText(node.getAttribute?.("aria-disabled")) === "true" ||
    hasUnavailableDataState(node)
  );
}

export function isBoardInputModeControlAvailable(node) {
  return isBoardInputModeControl(node) && isBoardInputControlAvailable(node);
}

export function collectBoardInputModeControls(rootNode, options = {}) {
  if (!rootNode || typeof rootNode.querySelectorAll !== "function") {
    return [];
  }

  const candidates = [];
  if (isBoardInputModeControl(rootNode)) {
    candidates.push(rootNode);
  }

  try {
    candidates.push(...Array.from(rootNode.querySelectorAll(BOARD_INPUT_MODE_CONTROL_SELECTOR)));
  } catch (_) {
    return candidates;
  }

  return [...new Set(candidates)].filter((node) => {
    return options.availableOnly === true
      ? isBoardInputModeControlAvailable(node)
      : isBoardInputModeControl(node);
  });
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

  return collectBoardInputModeControls(documentRef);
}

export function getActiveBoardInputMode(documentRef) {
  const nodes = collectModeNodes(documentRef);
  if (!nodes.length) {
    return "";
  }

  let bestCandidate = null;
  let bestScore = -1;

  nodes.forEach((node, index) => {
    const modeKey = getBoardInputModeKey(node);
    if (!modeKey || !isNodeActive(node) || !isNodeVisible(node)) {
      return;
    }

    const activeStrength = getNodeActiveStrength(node);
    const area = getRenderableArea(node);
    const score =
      activeStrength * 100_000 +
      Math.min(area, 99_999) +
      index;

    if (score > bestScore) {
      bestScore = score;
      bestCandidate = modeKey;
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
