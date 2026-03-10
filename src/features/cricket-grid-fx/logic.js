import {
  BADGE_BEACON_CLASS,
  BADGE_BURST_CLASS,
  BADGE_CLASS,
  BADGE_STATE_CLASS,
  CELL_CLASS,
  DEAD_CLASS,
  DELTA_CLASS,
  HIDDEN_LABEL_ATTRIBUTE,
  LABEL_CLASS,
  LABEL_STATE_CLASS,
  MARK_L1_CLASS,
  MARK_L2_CLASS,
  MARK_L3_CLASS,
  MARK_PROGRESS_CLASS,
  PRESSURE_CLASS,
  ROOT_CLASS,
  ROW_WAVE_CLASS,
  SCORE_CLASS,
  SPARK_CLASS,
  SYNTHETIC_BADGE_ATTRIBUTE,
  THREAT_CLASS,
  WIPE_CLASS,
} from "./style.js";

const GRID_ROOT_SELECTORS = Object.freeze([
  "#grid",
  ".ad-ext-cricket-grid",
  ".ad-ext-crfx-root",
  ".chakra-grid",
  "table",
  "tbody",
]);

const LABEL_NODE_SELECTORS = Object.freeze([
  "[data-row-label]",
  "[data-target-label]",
  ".label-cell",
  ".ad-ext-cricket-label",
  ".ad-ext-crfx-badge",
  ".chakra-text",
  "p",
  "th",
  "td",
  "div",
  "span",
]);

function queryAll(rootNode, selector) {
  if (!rootNode || typeof rootNode.querySelectorAll !== "function") {
    return [];
  }

  try {
    return Array.from(rootNode.querySelectorAll(selector));
  } catch (_) {
    return [];
  }
}

function normalizeLabel(cricketRules, value) {
  if (!cricketRules || typeof cricketRules.normalizeCricketLabel !== "function") {
    return "";
  }
  return cricketRules.normalizeCricketLabel(value);
}

function isVisible(node) {
  if (!node || node.isConnected === false) {
    return false;
  }
  if (typeof node.getClientRects === "function" && node.getClientRects().length === 0) {
    return false;
  }

  const ownerWindow = node.ownerDocument?.defaultView;
  if (ownerWindow && typeof ownerWindow.getComputedStyle === "function") {
    const style = ownerWindow.getComputedStyle(node);
    if (style) {
      if (style.display === "none" || style.visibility === "hidden") {
        return false;
      }
      if (String(style.opacity || "1") === "0") {
        return false;
      }
    }
  }

  return true;
}

function resolveGridRoot(documentRef, cricketRules, targetOrder) {
  if (!documentRef) {
    return null;
  }

  const targetSet = new Set(Array.isArray(targetOrder) ? targetOrder : []);
  let bestRoot = null;
  let bestScore = 0;

  GRID_ROOT_SELECTORS.forEach((selector) => {
    queryAll(documentRef, selector).forEach((candidate) => {
      if (!isVisible(candidate)) {
        return;
      }
      const labelHits = new Set();
      LABEL_NODE_SELECTORS.forEach((labelSelector) => {
        queryAll(candidate, labelSelector).forEach((node) => {
          const normalized = normalizeLabel(cricketRules, node?.getAttribute?.("data-row-label") || node?.textContent || "");
          if (normalized && targetSet.has(normalized)) {
            labelHits.add(normalized);
          }
        });
      });

      const score = labelHits.size * 100 + (candidate.tagName === "TABLE" ? 10 : 0);
      if (score > bestScore) {
        bestScore = score;
        bestRoot = candidate;
      }
    });
  });

  return bestRoot;
}

function collectLabelNodes(gridRoot, cricketRules, targetSet) {
  const seen = new Set();
  const rows = [];
  const pushRow = (node) => {
    if (!node || seen.has(node)) {
      return;
    }
    if (node.getAttribute?.(SYNTHETIC_BADGE_ATTRIBUTE) === "true") {
      return;
    }

    const explicitLabel =
      node.getAttribute?.("data-row-label") ||
      node.getAttribute?.("data-target-label") ||
      "";
    const label = normalizeLabel(cricketRules, explicitLabel || node.textContent || "");
    if (!label || !targetSet.has(label)) {
      return;
    }

    seen.add(node);
    const labelCell = resolveLabelCell(node);
    rows.push({
      label,
      labelNode: node,
      labelCell,
      badgeNode: resolveBadgeNode(node, labelCell, cricketRules, label),
    });
  };

  LABEL_NODE_SELECTORS.forEach((selector) => {
    queryAll(gridRoot, selector).forEach((node) => {
      pushRow(node);
    });
  });

  return filterAtomicRows(rows);
}

function filterAtomicRows(rows) {
  const entries = Array.isArray(rows) ? rows : [];
  if (!entries.length) {
    return [];
  }

  const filtered = entries.filter((entry) => {
    const node = entry?.labelNode;
    const label = entry?.label;
    if (!node || !label || typeof node.contains !== "function") {
      return false;
    }

    let hasSameLabelDescendant = false;
    const descendantLabels = new Set();

    entries.forEach((candidate) => {
      if (!candidate || candidate === entry || !candidate.labelNode) {
        return;
      }
      if (!node.contains(candidate.labelNode)) {
        return;
      }
      descendantLabels.add(candidate.label);
      if (candidate.label === label) {
        hasSameLabelDescendant = true;
      }
    });

    if (hasSameLabelDescendant) {
      return false;
    }
    if (descendantLabels.size > 1) {
      return false;
    }

    return true;
  });

  return filtered.length ? filtered : entries;
}

function parseMarksValue(node, cricketRules) {
  if (!node) {
    return 0;
  }

  const parseMark = (value) => {
    if (cricketRules && typeof cricketRules.parseCricketMarkValue === "function") {
      const parsed = cricketRules.parseCricketMarkValue(value);
      return Number.isFinite(parsed) ? cricketRules.clampMarks(parsed) : null;
    }
    const parsed = Number.parseInt(String(value || "").trim(), 10);
    if (!Number.isFinite(parsed)) {
      return null;
    }
    return Math.max(0, Math.min(3, parsed));
  };

  const directCandidates = [
    node.getAttribute?.("data-marks"),
    node.getAttribute?.("data-mark"),
    node.getAttribute?.("data-hits"),
    node.getAttribute?.("data-hit"),
    node.getAttribute?.("aria-label"),
    node.getAttribute?.("title"),
    node.getAttribute?.("alt"),
  ];
  for (const candidate of directCandidates) {
    const parsed = parseMark(candidate);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  const iconNode = node.querySelector?.(
    "img[alt], img[title], [data-marks], [data-mark], [data-hits], [data-hit], [aria-label], [title]"
  );
  if (iconNode) {
    const parsed = parseMark(
      iconNode.getAttribute?.("data-marks") ||
        iconNode.getAttribute?.("data-mark") ||
        iconNode.getAttribute?.("data-hits") ||
        iconNode.getAttribute?.("data-hit") ||
        iconNode.getAttribute?.("aria-label") ||
        iconNode.getAttribute?.("title") ||
        iconNode.getAttribute?.("alt") ||
        ""
    );
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  const textNumeric = parseMark(node.textContent || "");
  if (Number.isFinite(textNumeric)) {
    return textNumeric;
  }
  return 0;
}

function hasExplicitMarkHints(node) {
  if (!node || typeof node.getAttribute !== "function") {
    return false;
  }

  if (
    node.getAttribute("data-marks") !== null ||
    node.getAttribute("data-mark") !== null ||
    node.getAttribute("data-hits") !== null ||
    node.getAttribute("data-hit") !== null
  ) {
    return true;
  }

  if (typeof node.querySelector === "function") {
    if (node.querySelector("img[alt], [data-marks], [data-mark], [data-hits], [data-hit]")) {
      return true;
    }
    if (node.querySelector("svg[aria-label], svg[title], svg[alt]")) {
      return true;
    }
  }

  return false;
}

function resolveLabelCell(labelNode) {
  if (!labelNode || typeof labelNode.closest !== "function") {
    return labelNode?.parentElement || null;
  }

  return labelNode.closest("td, th, [role='cell']") || labelNode.parentElement || labelNode;
}

function getElementRect(element) {
  if (!element || typeof element.getBoundingClientRect !== "function") {
    return null;
  }
  return element.getBoundingClientRect();
}

function isDecoratableBadgeNode(badgeNode, labelCell, cricketRules, label) {
  if (!badgeNode || !labelCell || badgeNode === labelCell) {
    return false;
  }

  const normalizedLabel = normalizeLabel(cricketRules, badgeNode.textContent || "");
  if (!normalizedLabel || normalizedLabel !== label) {
    return false;
  }

  const compactText = String(badgeNode.textContent || "").trim().length <= 12;
  const directChild = badgeNode.parentElement === labelCell || labelCell.contains(badgeNode);
  if (!compactText || !directChild) {
    return false;
  }

  const badgeRect = getElementRect(badgeNode);
  const cellRect = getElementRect(labelCell);
  if (!badgeRect || !cellRect) {
    return true;
  }

  if (
    !Number.isFinite(badgeRect.width) ||
    !Number.isFinite(badgeRect.height) ||
    !Number.isFinite(cellRect.width) ||
    !Number.isFinite(cellRect.height)
  ) {
    return true;
  }

  if (
    badgeRect.width <= 0 ||
    badgeRect.height <= 0 ||
    cellRect.width <= 0 ||
    cellRect.height <= 0
  ) {
    return false;
  }

  return badgeRect.width < cellRect.width * 0.78 && badgeRect.height < cellRect.height * 0.9;
}

function resolveBadgeNode(labelNode, labelCell, cricketRules, label) {
  if (!labelCell) {
    return null;
  }

  if (
    labelNode &&
    labelNode !== labelCell &&
    normalizeLabel(cricketRules, labelNode.textContent || "") === label
  ) {
    return labelNode;
  }

  const candidates = [];

  queryAll(
    labelCell,
    ".ad-ext-crfx-badge, .chakra-text, [data-row-label], [data-target-label], p, span, strong, b"
  ).forEach((candidate) => {
    if (!candidates.includes(candidate)) {
      candidates.push(candidate);
    }
  });

  return (
    candidates.find((candidate) => {
      return isDecoratableBadgeNode(candidate, labelCell, cricketRules, label);
    }) || null
  );
}

function getDisplayLabel(label) {
  return String(label || "").toUpperCase() === "BULL" ? "Bull" : String(label || "");
}

function maybeIncludeLabelCellAsPlayerCell(playerCells, labelCell, expectedPlayerCount = 0) {
  const normalizedCells = Array.isArray(playerCells)
    ? playerCells.filter((cell) => Boolean(cell))
    : [];
  if (!labelCell || normalizedCells.includes(labelCell)) {
    return normalizedCells;
  }

  if (!hasExplicitMarkHints(labelCell)) {
    return normalizedCells;
  }

  const expectedCount = Number.isFinite(Number(expectedPlayerCount))
    ? Math.max(0, Math.round(Number(expectedPlayerCount)))
    : 0;
  const shouldInclude =
    expectedCount > 0 ? normalizedCells.length < expectedCount : normalizedCells.length === 0;
  if (!shouldInclude) {
    return normalizedCells;
  }

  return [labelCell, ...normalizedCells];
}

function collectPlayerCells(labelNode, cricketRules, targetSet, options = {}) {
  if (!labelNode) {
    return [];
  }
  const labelCell = resolveLabelCell(labelNode);

  const row = labelNode.closest?.("tr");
  if (row) {
    const cells = queryAll(row, "td, .player-cell, [data-player-index], [data-marks]").filter((node) => {
      return node !== labelNode && node !== labelCell;
    });
    return maybeIncludeLabelCellAsPlayerCell(cells, labelCell, options.expectedPlayerCount);
  }

  const parent = labelNode.parentElement;
  if (parent) {
    const fromParent = queryAll(parent, ".player-cell, [data-player-index], [data-marks]").filter((node) => {
      return node !== labelNode && node !== labelCell;
    });
    if (fromParent.length) {
      return maybeIncludeLabelCellAsPlayerCell(fromParent, labelCell, options.expectedPlayerCount);
    }
  }

  const result = [];
  let cursor = labelNode.nextElementSibling;
  while (cursor) {
    const siblingLabel = normalizeLabel(
      cricketRules,
      cursor.getAttribute?.("data-row-label") || cursor.textContent || ""
    );
    if (siblingLabel && targetSet.has(siblingLabel)) {
      break;
    }
    result.push(cursor);
    cursor = cursor.nextElementSibling;
  }

  return maybeIncludeLabelCellAsPlayerCell(
    result,
    labelCell,
    options.expectedPlayerCount
  );
}

function toggleClass(node, className, enabled) {
  if (!node || !className || !node.classList) {
    return;
  }
  node.classList.toggle(className, Boolean(enabled));
}

function clearCellClasses(node) {
  if (!node || !node.classList) {
    return;
  }
  node.classList.remove(
    CELL_CLASS,
    THREAT_CLASS,
    SCORE_CLASS,
    DEAD_CLASS,
    PRESSURE_CLASS
  );
}

function clearLabelClasses(node) {
  if (!node || !node.classList) {
    return;
  }
  node.classList.remove(
    BADGE_CLASS,
    BADGE_BURST_CLASS,
    LABEL_CLASS,
    BADGE_BEACON_CLASS,
    LABEL_STATE_CLASS.neutral,
    LABEL_STATE_CLASS.offense,
    LABEL_STATE_CLASS.danger,
    LABEL_STATE_CLASS.pressure,
    LABEL_STATE_CLASS.dead,
    BADGE_STATE_CLASS.neutral,
    BADGE_STATE_CLASS.offense,
    BADGE_STATE_CLASS.danger,
    BADGE_STATE_CLASS.pressure,
    BADGE_STATE_CLASS.dead
  );
}

function clearProgressClasses(node) {
  if (!node?.classList) {
    return;
  }
  node.classList.remove(
    MARK_PROGRESS_CLASS,
    MARK_L1_CLASS,
    MARK_L2_CLASS,
    MARK_L3_CLASS
  );
}

function appendTransientNode(state, parentNode, className, timeoutMs, options = {}) {
  if (!state || !parentNode || !className || typeof parentNode.appendChild !== "function") {
    return null;
  }

  const ownerDocument = parentNode.ownerDocument;
  if (!ownerDocument || typeof ownerDocument.createElement !== "function") {
    return null;
  }

  const node = ownerDocument.createElement("span");
  if (node.classList?.add) {
    node.classList.add(className);
  } else {
    node.className = className;
  }
  if (typeof options.textContent === "string") {
    node.textContent = options.textContent;
  }
  if (options.dataKey && typeof options.dataValue === "string") {
    node.setAttribute(options.dataKey, options.dataValue);
  }

  parentNode.appendChild(node);
  state.transientNodes.add(node);

  const timeoutRef =
    state.windowRef && typeof state.windowRef.setTimeout === "function"
      ? state.windowRef.setTimeout.bind(state.windowRef)
      : setTimeout;

  const handle = timeoutRef(() => {
    state.timeoutHandles.delete(handle);
    state.transientNodes.delete(node);
    if (node.parentNode && typeof node.parentNode.removeChild === "function") {
      node.parentNode.removeChild(node);
    }
  }, Math.max(100, Number(timeoutMs) || 600));

  state.timeoutHandles.add(handle);
  return node;
}

function removeTransientNodes(parentNode, className, state = null) {
  if (!parentNode || !className || typeof parentNode.querySelectorAll !== "function") {
    return;
  }

  queryAll(parentNode, `.${className}`).forEach((node) => {
    state?.transientNodes?.delete?.(node);
    if (node?.parentNode && typeof node.parentNode.removeChild === "function") {
      node.parentNode.removeChild(node);
    }
  });
}

function clearTransientState(state) {
  if (!state) {
    return;
  }

  const clearTimeoutRef =
    state.windowRef && typeof state.windowRef.clearTimeout === "function"
      ? state.windowRef.clearTimeout.bind(state.windowRef)
      : clearTimeout;

  state.timeoutHandles.forEach((handle) => clearTimeoutRef(handle));
  state.timeoutHandles.clear();

  state.transientNodes.forEach((node) => {
    if (node?.parentNode && typeof node.parentNode.removeChild === "function") {
      node.parentNode.removeChild(node);
    }
  });
  state.transientNodes.clear();
}

function clearPersistentState(state) {
  if (!state) {
    return;
  }

  state.trackedCells.forEach((node) => clearCellClasses(node));
  state.trackedLabels.forEach((node) => clearLabelClasses(node));
  state.trackedProgressTargets.forEach((node) => clearProgressClasses(node));

  state.syntheticBadges.forEach((node) => {
    if (node?.parentNode && typeof node.parentNode.removeChild === "function") {
      node.parentNode.removeChild(node);
    }
  });
  state.hiddenLabelNodes.forEach((node) => {
    if (typeof node?.removeAttribute === "function") {
      node.removeAttribute(HIDDEN_LABEL_ATTRIBUTE);
    }
  });

  if (state.gridRoot?.classList) {
    state.gridRoot.classList.remove(ROOT_CLASS);
  }

  state.trackedCells.clear();
  state.trackedLabels.clear();
  state.trackedProgressTargets.clear();
  state.syntheticBadges.clear();
  state.hiddenLabelNodes.clear();
  state.gridRoot = null;
}

function setLabelStateClasses(labelNode, stateToken) {
  if (!labelNode || !labelNode.classList) {
    return;
  }

  labelNode.classList.remove(
    LABEL_STATE_CLASS.neutral,
    LABEL_STATE_CLASS.offense,
    LABEL_STATE_CLASS.danger,
    LABEL_STATE_CLASS.pressure,
    LABEL_STATE_CLASS.dead
  );

  if (stateToken === "offense") {
    labelNode.classList.add(LABEL_STATE_CLASS.offense);
    return;
  }

  if (stateToken === "pressure") {
    labelNode.classList.add(LABEL_STATE_CLASS.pressure);
    return;
  }

  if (stateToken === "danger") {
    labelNode.classList.add(LABEL_STATE_CLASS.danger);
    return;
  }

  if (stateToken === "dead") {
    labelNode.classList.add(LABEL_STATE_CLASS.dead);
    return;
  }

  labelNode.classList.add(LABEL_STATE_CLASS.neutral);
}

function setBadgeStateClasses(badgeNode, stateToken) {
  if (!badgeNode || !badgeNode.classList) {
    return;
  }

  badgeNode.classList.remove(
    BADGE_STATE_CLASS.neutral,
    BADGE_STATE_CLASS.offense,
    BADGE_STATE_CLASS.danger,
    BADGE_STATE_CLASS.pressure,
    BADGE_STATE_CLASS.dead
  );

  if (stateToken === "offense") {
    badgeNode.classList.add(BADGE_STATE_CLASS.offense);
    return;
  }

  if (stateToken === "pressure") {
    badgeNode.classList.add(BADGE_STATE_CLASS.pressure);
    return;
  }

  if (stateToken === "danger") {
    badgeNode.classList.add(BADGE_STATE_CLASS.danger);
    return;
  }

  if (stateToken === "dead") {
    badgeNode.classList.add(BADGE_STATE_CLASS.dead);
    return;
  }

  badgeNode.classList.add(BADGE_STATE_CLASS.neutral);
}

function toggleTimedClass(state, node, className, timeoutMs = 700) {
  if (!state || !node?.classList || !className) {
    return;
  }

  node.classList.remove(className);
  void node.offsetWidth;
  node.classList.add(className);

  const timeoutRef =
    state.windowRef && typeof state.windowRef.setTimeout === "function"
      ? state.windowRef.setTimeout.bind(state.windowRef)
      : setTimeout;

  const handle = timeoutRef(() => {
    state.timeoutHandles.delete(handle);
    node.classList.remove(className);
  }, Math.max(120, Number(timeoutMs) || 700));

  state.timeoutHandles.add(handle);
}

function getMarkProgressTarget(cellNode) {
  if (!cellNode || typeof cellNode.querySelector !== "function") {
    return cellNode;
  }

  return (
    cellNode.querySelector(
      "img, svg, .chakra-image, [data-marks], [data-mark], [data-hits], [data-hit]"
    ) || cellNode
  );
}

function triggerMarkProgress(state, cellNode, marks, visualConfig) {
  if (!visualConfig.markProgress || !cellNode) {
    return;
  }

  const targetNode = getMarkProgressTarget(cellNode);
  if (!targetNode?.classList) {
    return;
  }

  clearProgressClasses(targetNode);
  void targetNode.offsetWidth;
  targetNode.classList.add(MARK_PROGRESS_CLASS);
  const clampedMarks = Math.max(0, Math.min(3, Number(marks) || 0));
  targetNode.classList.add(
    clampedMarks <= 1 ? MARK_L1_CLASS : clampedMarks === 2 ? MARK_L2_CLASS : MARK_L3_CLASS
  );
  state.trackedProgressTargets.add(targetNode);

  const timeoutRef =
    state.windowRef && typeof state.windowRef.setTimeout === "function"
      ? state.windowRef.setTimeout.bind(state.windowRef)
      : setTimeout;

  const handle = timeoutRef(() => {
    state.timeoutHandles.delete(handle);
    clearProgressClasses(targetNode);
  }, 520);

  state.timeoutHandles.add(handle);
}

function triggerRowWave(state, row, visualConfig) {
  if (!visualConfig.rowWave || !Array.isArray(row?.playerCells)) {
    return;
  }

  row.playerCells.forEach((cellNode) => {
    if (!cellNode) {
      return;
    }
    removeTransientNodes(cellNode, ROW_WAVE_CLASS, state);
    appendTransientNode(state, cellNode, ROW_WAVE_CLASS, 760);
  });
}

function applyRootCssVars(gridRoot, visualConfig) {
  if (!gridRoot || !gridRoot.style || !visualConfig) {
    return;
  }

  gridRoot.style.setProperty("--ad-ext-crfx-offense-rgb", visualConfig.theme.offense);
  gridRoot.style.setProperty("--ad-ext-crfx-danger-rgb", visualConfig.theme.danger);
  gridRoot.style.setProperty(
    "--ad-ext-crfx-highlight-opacity",
    String(visualConfig.intensity.highlightOpacity)
  );
  gridRoot.style.setProperty(
    "--ad-ext-crfx-stroke-boost",
    String(visualConfig.intensity.strokeBoost)
  );
}

function cloneMarksByLabel(marksByLabel) {
  const result = {};
  if (!marksByLabel || typeof marksByLabel !== "object") {
    return result;
  }

  Object.keys(marksByLabel).forEach((label) => {
    result[label] = Array.isArray(marksByLabel[label])
      ? marksByLabel[label].map((value) => Number(value) || 0)
      : [];
  });
  return result;
}

function getRowNode(labelNode) {
  return (
    labelNode?.closest?.("tr") ||
    labelNode?.parentElement ||
    labelNode ||
    null
  );
}

function applyCellPresentationClasses(cellNode, presentation, visualConfig) {
  toggleClass(cellNode, CELL_CLASS, true);
  toggleClass(
    cellNode,
    THREAT_CLASS,
    visualConfig.threatEdge && (presentation === "danger" || presentation === "pressure")
  );
  toggleClass(cellNode, SCORE_CLASS, visualConfig.scoringLane && presentation === "offense");
  toggleClass(cellNode, DEAD_CLASS, visualConfig.deadRowCollapse && presentation === "dead");
  toggleClass(
    cellNode,
    PRESSURE_CLASS,
    visualConfig.opponentPressureOverlay && presentation === "pressure"
  );
}

export function createCricketGridFxState(windowRef = null) {
  return {
    windowRef,
    gridRoot: null,
    trackedCells: new Set(),
    trackedLabels: new Set(),
    trackedProgressTargets: new Set(),
    transientNodes: new Set(),
    timeoutHandles: new Set(),
    syntheticBadges: new Set(),
    hiddenLabelNodes: new Set(),
    previousMarksByLabel: {},
    previousStateMap: new Map(),
    previousActivePlayerIndex: null,
    previousTurnToken: "",
    renderCache: {
      grid: null,
      board: null,
    },
  };
}

export function clearCricketGridFxState(state) {
  if (!state) {
    return;
  }

  clearTransientState(state);
  clearPersistentState(state);
  state.previousMarksByLabel = {};
  state.previousStateMap = new Map();
  state.previousActivePlayerIndex = null;
  state.previousTurnToken = "";
  if (state.renderCache && typeof state.renderCache === "object") {
    state.renderCache.grid = null;
    state.renderCache.board = null;
  }
}

export function updateCricketGridFx(options = {}) {
  const documentRef = options.documentRef;
  const cricketRules = options.cricketRules;
  const renderState = options.renderState;
  const state = options.state;
  const visualConfig = options.visualConfig;
  const turnToken = String(options.turnToken || "");
  const debugStats = options.debugStats && typeof options.debugStats === "object"
    ? options.debugStats
    : null;

  if (debugStats) {
    debugStats.status = "init";
    debugStats.rowCount = 0;
    debugStats.stateTargetCount = 0;
    debugStats.labelCellCount = 0;
    debugStats.badgeCount = 0;
    debugStats.offenseRowCount = 0;
    debugStats.dangerRowCount = 0;
    debugStats.pressureRowCount = 0;
    debugStats.scoreCellCount = 0;
    debugStats.rowsWithoutPlayerCells = 0;
    debugStats.activeColumnResolvedCount = 0;
    debugStats.activeColumnMissingCount = 0;
    debugStats.activeColumnMissingLabels = [];
    debugStats.rowWaveDeltaCount = 0;
    debugStats.rowWaveTacticalCount = 0;
    debugStats.badgeFallbackCount = 0;
    debugStats.turnTokenChanged = false;
  }

  if (!documentRef || !cricketRules || !renderState || !state || !visualConfig) {
    clearCricketGridFxState(state);
    if (debugStats) {
      debugStats.status = "invalid-input";
    }
    return;
  }

  const targetOrder = Array.isArray(renderState.targetOrder) ? renderState.targetOrder : [];
  const targetSet = new Set(targetOrder);
  if (!targetOrder.length || !(renderState.stateMap instanceof Map)) {
    clearCricketGridFxState(state);
    if (debugStats) {
      debugStats.status = "invalid-state";
    }
    return;
  }

  if (debugStats) {
    debugStats.stateTargetCount = renderState.stateMap.size;
  }

  const gridSnapshot = renderState.gridSnapshot && typeof renderState.gridSnapshot === "object"
    ? renderState.gridSnapshot
    : null;
  const gridRoot = gridSnapshot?.root || null;
  if (!gridRoot) {
    clearCricketGridFxState(state);
    if (debugStats) {
      debugStats.status = "missing-grid";
    }
    return;
  }

  const sourceRows = Array.isArray(gridSnapshot?.rows) ? gridSnapshot.rows : [];
  const rows = sourceRows
    .filter((row) => targetSet.has(row?.label))
    .map((row) => {
      return {
        label: row?.label || "",
        labelNode: row?.labelNode || row?.badgeNode || null,
        labelCell: row?.labelCell || null,
        badgeNode: row?.badgeNode || null,
        rowNode: row?.rowNode || getRowNode(row?.labelNode || row?.labelCell || null),
        playerCells: Array.isArray(row?.playerCells) ? row.playerCells.filter(Boolean) : [],
      };
    });
  if (!rows.length) {
    clearCricketGridFxState(state);
    if (debugStats) {
      debugStats.status = "missing-grid";
    }
    return;
  }
  if (debugStats) {
    debugStats.rowCount = rows.length;
    debugStats.labelCellCount = rows.filter((row) => Boolean(row.labelCell)).length;
    debugStats.badgeCount = rows.filter((row) => Boolean(row.badgeNode)).length;
  }

  clearPersistentState(state);

  state.gridRoot = gridRoot;
  state.gridRoot.classList.add(ROOT_CLASS);
  applyRootCssVars(state.gridRoot, visualConfig);

  const marksDiff =
    typeof cricketRules.diffMarksByLabel === "function"
      ? cricketRules.diffMarksByLabel({
          previousMarksByLabel: state.previousMarksByLabel,
          nextMarksByLabel: renderState.marksByLabel,
          targetOrder,
        })
      : new Map();

  const transitions =
    typeof cricketRules.deriveTargetTransitions === "function"
      ? cricketRules.deriveTargetTransitions({
          previousStateMap: state.previousStateMap,
          nextStateMap: renderState.stateMap,
          targetOrder,
        })
      : new Map();

  if (
    visualConfig.roundTransitionWipe &&
    state.previousTurnToken &&
    turnToken &&
    state.previousTurnToken !== turnToken
  ) {
    removeTransientNodes(state.gridRoot, WIPE_CLASS, state);
    appendTransientNode(state, state.gridRoot, WIPE_CLASS, 760);
    if (debugStats) {
      debugStats.turnTokenChanged = true;
    }
  }

  let offenseRowCount = 0;
  let dangerRowCount = 0;
  let pressureRowCount = 0;
  let scoreCellCount = 0;
  let rowsWithoutPlayerCells = 0;
  let activeColumnResolvedCount = 0;
  let activeColumnMissingCount = 0;
  let badgeCount = 0;
  let badgeFallbackCount = 0;
  let rowWaveDeltaCount = 0;
  let rowWaveTacticalCount = 0;
  const activeColumnMissingLabels = [];

  rows.forEach((row) => {
    const stateEntry = renderState.stateMap.get(row.label);
    if (!stateEntry) {
      return;
    }
    const activePlayerIndex = Number(stateEntry.activePlayerIndex);
    const hasPlayerCells = Array.isArray(row.playerCells) && row.playerCells.length > 0;
    if (!hasPlayerCells) {
      rowsWithoutPlayerCells += 1;
    }
    if (hasPlayerCells) {
      if (
        Number.isFinite(activePlayerIndex) &&
        activePlayerIndex >= 0 &&
        activePlayerIndex < row.playerCells.length
      ) {
        activeColumnResolvedCount += 1;
      } else {
        activeColumnMissingCount += 1;
        activeColumnMissingLabels.push(row.label);
      }
    }

    const presentation = String(
      stateEntry.boardPresentation || stateEntry.presentation || "open"
    ).toLowerCase();
    if (presentation === "offense") {
      offenseRowCount += 1;
    } else if (presentation === "danger") {
      dangerRowCount += 1;
    } else if (presentation === "pressure") {
      pressureRowCount += 1;
    }

    const labelCellNode = row.labelCell || row.labelNode || null;
    let badgeNode = null;
    if (
      row.badgeNode?.classList &&
      row.badgeNode !== labelCellNode &&
      row.badgeNode.isConnected !== false
    ) {
      badgeNode = row.badgeNode;
    }
    if (!badgeNode && labelCellNode?.ownerDocument?.createElement) {
      badgeNode = labelCellNode.ownerDocument.createElement("span");
      badgeNode.setAttribute(SYNTHETIC_BADGE_ATTRIBUTE, "true");
      badgeNode.textContent = getDisplayLabel(row.label);
      labelCellNode.appendChild(badgeNode);
      state.syntheticBadges.add(badgeNode);
      if (typeof labelCellNode.setAttribute === "function") {
        labelCellNode.setAttribute(HIDDEN_LABEL_ATTRIBUTE, "true");
        state.hiddenLabelNodes.add(labelCellNode);
      }
      badgeFallbackCount += 1;
    }
    if (labelCellNode?.classList) {
      labelCellNode.classList.add(LABEL_CLASS);
      setLabelStateClasses(labelCellNode, presentation);
      toggleClass(
        labelCellNode,
        BADGE_BEACON_CLASS,
        !badgeNode &&
          visualConfig.badgeBeacon &&
          (presentation === "offense" || presentation === "danger" || presentation === "pressure")
      );
      state.trackedLabels.add(labelCellNode);
    }

    if (badgeNode?.classList) {
      badgeNode.classList.add(BADGE_CLASS);
      setBadgeStateClasses(badgeNode, presentation);
      toggleClass(
        badgeNode,
        BADGE_BEACON_CLASS,
        visualConfig.badgeBeacon &&
          (presentation === "offense" || presentation === "danger" || presentation === "pressure")
      );
      state.trackedLabels.add(badgeNode);
      badgeCount += 1;
    }

    const diffEntry = marksDiff.get(row.label) || null;
    const transition = transitions.get(row.label) || null;
    const hasIncrease = Boolean(diffEntry?.hasIncrease);
    const becameTactical =
      Boolean(transition?.becameOffense) ||
      Boolean(transition?.becameDanger) ||
      Boolean(transition?.becamePressure);

    if (hasIncrease) {
      triggerRowWave(state, row, visualConfig);
      rowWaveDeltaCount += 1;
    } else if (becameTactical) {
      triggerRowWave(state, row, visualConfig);
      rowWaveTacticalCount += 1;
    }

    if (badgeNode?.classList && hasIncrease) {
      toggleTimedClass(state, badgeNode, BADGE_BURST_CLASS, 700);
    }

    row.playerCells.forEach((cellNode, index) => {
      if (!cellNode?.classList) {
        return;
      }

      const cellState = Array.isArray(stateEntry.cellStates)
        ? stateEntry.cellStates[index]
        : null;
      const cellPresentation = String(cellState?.presentation || "neutral").toLowerCase();
      const marks = Number(stateEntry.marksByPlayer?.[index] || 0);
      const scoreCell = visualConfig.scoringLane && cellPresentation === "offense";

      applyCellPresentationClasses(cellNode, cellPresentation, visualConfig);
      if (scoreCell) {
        scoreCellCount += 1;
      }

      const delta = Number(diffEntry?.playerDeltas?.[index] || 0);
      if (delta > 0 && visualConfig.deltaChips) {
        appendTransientNode(state, cellNode, DELTA_CLASS, 940, {
          textContent: `+${delta}`,
        });
      }

      if (delta > 0 && visualConfig.hitSpark) {
        removeTransientNodes(cellNode, SPARK_CLASS, state);
        appendTransientNode(state, cellNode, SPARK_CLASS, 460);
      }

       if (delta > 0) {
        triggerMarkProgress(state, cellNode, marks, visualConfig);
      }

      state.trackedCells.add(cellNode);
    });
  });

  state.previousMarksByLabel = cloneMarksByLabel(renderState.marksByLabel);
  state.previousStateMap = new Map(renderState.stateMap);
  state.previousActivePlayerIndex = Number(renderState.activePlayerIndex);
  state.previousTurnToken = turnToken;
  if (debugStats) {
    debugStats.status = "ok";
    debugStats.offenseRowCount = offenseRowCount;
    debugStats.dangerRowCount = dangerRowCount;
    debugStats.pressureRowCount = pressureRowCount;
    debugStats.scoreCellCount = scoreCellCount;
    debugStats.rowsWithoutPlayerCells = rowsWithoutPlayerCells;
    debugStats.activeColumnResolvedCount = activeColumnResolvedCount;
    debugStats.activeColumnMissingCount = activeColumnMissingCount;
    debugStats.activeColumnMissingLabels = activeColumnMissingLabels;
    debugStats.badgeCount = badgeCount;
    debugStats.badgeFallbackCount = badgeFallbackCount;
    debugStats.rowWaveDeltaCount = rowWaveDeltaCount;
    debugStats.rowWaveTacticalCount = rowWaveTacticalCount;
  }
}
