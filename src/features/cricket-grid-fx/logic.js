import {
  BADGE_BEACON_CLASS,
  CELL_CLASS,
  DEAD_CLASS,
  DELTA_CLASS,
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

    const explicitLabel =
      node.getAttribute?.("data-row-label") ||
      node.getAttribute?.("data-target-label") ||
      "";
    const label = normalizeLabel(cricketRules, explicitLabel || node.textContent || "");
    if (!label || !targetSet.has(label)) {
      return;
    }

    seen.add(node);
    rows.push({
      label,
      labelNode: node,
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

  const dataMarks = node.getAttribute?.("data-marks");
  const dataMarksNumeric = Number.parseInt(String(dataMarks || "").trim(), 10);
  if (Number.isFinite(dataMarksNumeric)) {
    return typeof cricketRules?.clampMarks === "function"
      ? cricketRules.clampMarks(dataMarksNumeric)
      : Math.max(0, Math.min(3, dataMarksNumeric));
  }

  const iconAlt = node.querySelector?.("img[alt]")?.getAttribute?.("alt");
  const iconNumeric = Number.parseInt(String(iconAlt || "").trim(), 10);
  if (Number.isFinite(iconNumeric)) {
    return typeof cricketRules?.clampMarks === "function"
      ? cricketRules.clampMarks(iconNumeric)
      : Math.max(0, Math.min(3, iconNumeric));
  }

  const textNumeric = Number.parseInt(String(node.textContent || "").trim(), 10);
  if (Number.isFinite(textNumeric)) {
    return typeof cricketRules?.clampMarks === "function"
      ? cricketRules.clampMarks(textNumeric)
      : Math.max(0, Math.min(3, textNumeric));
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
    PRESSURE_CLASS,
    MARK_PROGRESS_CLASS,
    MARK_L1_CLASS,
    MARK_L2_CLASS,
    MARK_L3_CLASS
  );
}

function clearLabelClasses(node) {
  if (!node || !node.classList) {
    return;
  }
  node.classList.remove(
    LABEL_CLASS,
    BADGE_BEACON_CLASS,
    LABEL_STATE_CLASS.neutral,
    LABEL_STATE_CLASS.offense,
    LABEL_STATE_CLASS.danger,
    LABEL_STATE_CLASS.dead
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
  node.className = className;
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

  if (state.gridRoot?.classList) {
    state.gridRoot.classList.remove(ROOT_CLASS);
  }

  state.trackedCells.clear();
  state.trackedLabels.clear();
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
    LABEL_STATE_CLASS.dead
  );

  if (stateToken === "offense") {
    labelNode.classList.add(LABEL_STATE_CLASS.offense);
    return;
  }

  if (stateToken === "danger" || stateToken === "pressure") {
    labelNode.classList.add(LABEL_STATE_CLASS.danger);
    return;
  }

  if (stateToken === "dead") {
    labelNode.classList.add(LABEL_STATE_CLASS.dead);
    return;
  }

  labelNode.classList.add(LABEL_STATE_CLASS.neutral);
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

function applyMarkProgressClasses(cellNode, marks, visualConfig) {
  if (!cellNode) {
    return;
  }

  toggleClass(cellNode, MARK_PROGRESS_CLASS, visualConfig.markProgress);
  toggleClass(cellNode, MARK_L1_CLASS, visualConfig.markProgress && marks >= 1);
  toggleClass(cellNode, MARK_L2_CLASS, visualConfig.markProgress && marks >= 2);
  toggleClass(cellNode, MARK_L3_CLASS, visualConfig.markProgress && marks >= 3);
}

export function createCricketGridFxState(windowRef = null) {
  return {
    windowRef,
    gridRoot: null,
    trackedCells: new Set(),
    trackedLabels: new Set(),
    transientNodes: new Set(),
    timeoutHandles: new Set(),
    previousMarksByLabel: {},
    previousStateMap: new Map(),
    previousActivePlayerIndex: null,
    renderCache: {
      grid: null,
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
  if (state.renderCache && typeof state.renderCache === "object") {
    state.renderCache.grid = null;
  }
}

export function updateCricketGridFx(options = {}) {
  const documentRef = options.documentRef;
  const cricketRules = options.cricketRules;
  const renderState = options.renderState;
  const state = options.state;
  const visualConfig = options.visualConfig;
  const debugStats = options.debugStats && typeof options.debugStats === "object"
    ? options.debugStats
    : null;

  if (debugStats) {
    debugStats.status = "init";
    debugStats.rowCount = 0;
    debugStats.stateTargetCount = 0;
    debugStats.offenseRowCount = 0;
    debugStats.dangerRowCount = 0;
    debugStats.pressureRowCount = 0;
    debugStats.scoreCellCount = 0;
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

  const gridRoot = resolveGridRoot(documentRef, cricketRules, targetOrder);
  if (!gridRoot) {
    clearCricketGridFxState(state);
    if (debugStats) {
      debugStats.status = "missing-grid";
    }
    return;
  }

  const rows = collectLabelNodes(gridRoot, cricketRules, targetSet).map((row) => {
    const stateEntry = renderState.stateMap.get(row.label);
    const expectedPlayerCount = Array.isArray(stateEntry?.marksByPlayer)
      ? stateEntry.marksByPlayer.length
      : 0;
    return {
      ...row,
      rowNode: getRowNode(row.labelNode),
      playerCells: collectPlayerCells(row.labelNode, cricketRules, targetSet, {
        expectedPlayerCount,
      }),
    };
  });
  if (debugStats) {
    debugStats.rowCount = rows.length;
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
    Number.isFinite(state.previousActivePlayerIndex) &&
    Number.isFinite(renderState.activePlayerIndex) &&
    state.previousActivePlayerIndex !== renderState.activePlayerIndex
  ) {
      appendTransientNode(state, state.gridRoot, WIPE_CLASS, 760);
  }

  let offenseRowCount = 0;
  let dangerRowCount = 0;
  let pressureRowCount = 0;
  let scoreCellCount = 0;

  rows.forEach((row) => {
    const stateEntry = renderState.stateMap.get(row.label);
    if (!stateEntry) {
      return;
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

    const labelNode = row.labelNode;
    if (labelNode?.classList) {
      labelNode.classList.add(LABEL_CLASS);
      setLabelStateClasses(labelNode, presentation);
      toggleClass(
        labelNode,
        BADGE_BEACON_CLASS,
        visualConfig.badgeBeacon && (presentation === "offense" || presentation === "danger" || presentation === "pressure")
      );
      state.trackedLabels.add(labelNode);
    }

    const diffEntry = marksDiff.get(row.label) || null;
    const transition = transitions.get(row.label) || null;
    const hasIncrease = Boolean(diffEntry?.hasIncrease);

    if (visualConfig.rowWave && row.rowNode && (hasIncrease || transition?.presentationChanged)) {
      appendTransientNode(state, row.rowNode, ROW_WAVE_CLASS, 760);
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
      applyMarkProgressClasses(cellNode, marks, visualConfig);
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
        appendTransientNode(state, cellNode, SPARK_CLASS, 460);
      }

      state.trackedCells.add(cellNode);
    });
  });

  state.previousMarksByLabel = cloneMarksByLabel(renderState.marksByLabel);
  state.previousStateMap = new Map(renderState.stateMap);
  state.previousActivePlayerIndex = Number(renderState.activePlayerIndex);
  if (debugStats) {
    debugStats.status = "ok";
    debugStats.offenseRowCount = offenseRowCount;
    debugStats.dangerRowCount = dangerRowCount;
    debugStats.pressureRowCount = pressureRowCount;
    debugStats.scoreCellCount = scoreCellCount;
  }
}
