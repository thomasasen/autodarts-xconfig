import {
  buildPipelineSignature,
  buildTurnToken,
  deriveTargetStates,
  enrichStateMapForUi,
} from "./render-state.js";
import { cloneLabelDiagnostics, createLabelDiagnostics } from "./diagnostics.js";
import {
  normalizeCricketLabelNode,
} from "./label-utils.js";
import { parseTextMarkValue } from "./mark-parser.js";
import {
  resolveBoardSnapshot as resolveBoardSnapshotFromCache,
  resolveGridSnapshot as resolveGridSnapshotFromCache,
} from "./snapshot-cache.js";
import { buildGridRowSnapshot } from "./row-repair.js";
import {
  collectLabelNodes as collectLabelNodesFromDiscovery,
  collectSiblingPlayerCells as collectSiblingPlayerCellsFromDiscovery,
  collectTargetLabelsInNode as collectTargetLabelsInNodeFromDiscovery,
  filterAtomicLabelNodes as filterAtomicLabelNodesFromDiscovery,
  hasAnyTargetDescendant as hasAnyTargetDescendantFromDiscovery,
  isInsideTurnPreview as isInsideTurnPreviewFromDiscovery,
  isLikelyStructuralPlayerCell as isLikelyStructuralPlayerCellFromDiscovery,
  isNodeVisible as isNodeVisibleFromDiscovery,
  queryAll as queryAllFromDiscovery,
  resolveBadgeNode as resolveBadgeNodeFromDiscovery,
  resolveLabelCell as resolveLabelCellFromDiscovery,
} from "./grid-discovery.js";
import { isProtectedCricketGridRootCandidate } from "./protected-hosts.js";

export const CRICKET_SURFACE_STATUS = Object.freeze({
  READY: "ready",
  MISSING_GRID: "missing-grid",
  MISSING_BOARD: "missing-board",
  DEGRADED_HOST: "degraded-host",
  PAUSED_ROUTE: "paused-route",
  INACTIVE_VARIANT: "inactive-variant",
});

const PAUSED_ROUTE_PATH = "/ad-xconfig";
const PAUSED_ROUTE_HASH = "#ad-xconfig";
const MATCH_ROUTE_PATTERN = /^\/matches\/([^/]+)$/i;
const GRID_MIN_UNIQUE_LABELS = 4;
const GRID_MIN_ROWS_WITH_PLAYER_CELLS = 2;
const GRID_MIN_COVERAGE = 0;
const BASE_CRICKET_OBJECTIVE_COUNT = 7;
const GRID_MIN_GEOMETRY_LABELS = 4;
const GRID_MIN_ROW_BAND_COUNT = 2;
const GRID_ROW_BAND_RATIO = 0.5;
const GRID_ROW_BAND_TOLERANCE_PX = 8;
const GRID_COLUMN_BAND_TOLERANCE_PX = 24;
const DEGRADED_HOST_DEFAULT_GRACE_MS = 300;
const DEGRADED_HOST_MIN_LABELS = 4;
const DEGRADED_HOST_MIN_PANE_HEIGHT_RATIO = 0.55;
const DEGRADED_HOST_MIN_LEFT_PANE_WIDTH_RATIO = 0.4;
const DEGRADED_HOST_MIN_RIGHT_PANE_WIDTH_RATIO = 0.18;
const DEGRADED_HOST_MIN_PANE_SPAN_RATIO = 0.8;

const GRID_ROOT_SELECTORS = Object.freeze([
  "#grid",
  ".ad-ext-cricket-grid",
  ".ad-ext-crfx-root",
  ".chakra-stack",
  ".chakra-grid",
  ".css-rfeml4",
  "main",
  "table",
  "tbody",
]);

const LABEL_NODE_SELECTORS = Object.freeze([
  ".label-cell",
  ".ad-ext-cricket-label",
  ".ad-ext-crfx-badge",
  ".chakra-text",
  "[data-row-label]",
  "[data-target-label]",
]);

const LABEL_NODE_FALLBACK_SELECTOR = "div, td, th, span, p, strong, b";

const PLAYER_CELL_SELECTORS = Object.freeze([
  ".player-cell",
  "[data-player-index]",
  "[data-marks]",
  ".ad-ext-cricket-mark",
]);

const KNOWN_SCORING_MODES = new Set(["standard", "cutthroat", "neutral", "unknown"]);
const TURN_PREVIEW_ROOT_SELECTOR = "#ad-ext-turn";
const degradedHostDetectionByWindow = new WeakMap();

function isNodeVisible(node) {
  return isNodeVisibleFromDiscovery(node);
}

function queryAll(rootNode, selector) {
  return queryAllFromDiscovery(rootNode, selector);
}

function normalizeRoutePath(pathValue) {
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

export function extractMatchRouteId(windowRef, documentRef) {
  const locationRef = windowRef?.location || documentRef?.defaultView?.location || null;
  const routePath = normalizeRoutePath(locationRef?.pathname || "");
  const match = MATCH_ROUTE_PATTERN.exec(routePath);
  return match?.[1] || "";
}

function readVariantText(documentRef) {
  return String(documentRef?.getElementById?.("ad-ext-game-variant")?.textContent || "").trim();
}

function isXConfigRoute(windowRef, documentRef) {
  const locationRef = windowRef?.location || documentRef?.defaultView?.location || null;
  const routePath = normalizeRoutePath(
    locationRef?.pathname || ""
  );
  const routeHash = normalizeHashValue(locationRef?.hash || "");
  return routePath === PAUSED_ROUTE_PATH || routeHash === PAUSED_ROUTE_HASH;
}

function isCricketFamilyActive(gameState, documentRef, variantRules) {
  if (gameState && typeof gameState.isCricketVariant === "function") {
    return gameState.isCricketVariant({
      allowMissing: false,
      allowEmpty: false,
      includeHiddenCricket: false,
    });
  }

  const variantText = readVariantText(documentRef);
  if (!variantRules || typeof variantRules.isCricketVariantText !== "function") {
    return false;
  }
  return variantRules.isCricketVariantText(variantText, {
    allowMissing: false,
    allowEmpty: false,
    includeHiddenCricket: false,
  });
}

function collectLabelNodes(rootNode, cricketRules, targetSet, diagnostics = null) {
  return collectLabelNodesFromDiscovery(
    rootNode,
    cricketRules,
    targetSet,
    LABEL_NODE_SELECTORS,
    diagnostics,
    {
      fallbackSelector: LABEL_NODE_FALLBACK_SELECTOR,
      skipNode: isInsideTurnPreview,
    }
  );
}

function filterAtomicLabelNodes(labelEntries, diagnostics = null) {
  return filterAtomicLabelNodesFromDiscovery(labelEntries, diagnostics);
}

function isInsideXConfigPanel(node) {
  if (!node || typeof node.closest !== "function") {
    return false;
  }
  return Boolean(
    node.closest("#ad-xconfig-panel-host") ||
      node.closest("[data-adxconfig-modal='true']") ||
      node.closest(".ad-xconfig-shell")
  );
}

function isInsideTurnPreview(node) {
  return isInsideTurnPreviewFromDiscovery(node);
}

function isCandidateGridRoot(node) {
  if (!node || typeof node !== "object") {
    return false;
  }
  if (!isNodeVisible(node)) {
    return false;
  }
  if (isInsideXConfigPanel(node)) {
    return false;
  }
  if (isInsideTurnPreview(node)) {
    return false;
  }
  if (isProtectedCricketGridRootCandidate(node)) {
    return false;
  }
  return true;
}

function readNodeRect(node) {
  if (!node || typeof node.getBoundingClientRect !== "function") {
    return null;
  }

  const rect = node.getBoundingClientRect();
  const left = Number(rect?.x ?? rect?.left);
  const top = Number(rect?.y ?? rect?.top);
  const width = Number(rect?.width);
  const height = Number(rect?.height);
  if (
    !Number.isFinite(left) ||
    !Number.isFinite(top) ||
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0
  ) {
    return null;
  }

  return { left, top, width, height };
}

function readCompactNodeText(node) {
  return String(node?.textContent || "").replaceAll(/\s+/g, "").trim();
}

function containsNode(parentNode, childNode) {
  if (!parentNode || !childNode) {
    return false;
  }
  if (parentNode === childNode) {
    return true;
  }
  return typeof parentNode.contains === "function" ? parentNode.contains(childNode) : false;
}

function readVisibleChildEntries(node) {
  return Array.from(node?.children || [])
    .map((childNode) => ({
      node: childNode,
      rect: readNodeRect(childNode),
    }))
    .filter((entry) => Boolean(entry.rect) && isNodeVisible(entry.node));
}

function hasDegradedControlPaneText(node) {
  const compactText = readCompactNodeText(node);
  if (!compactText) {
    return false;
  }
  if (!/undo/i.test(compactText) || !/next/i.test(compactText)) {
    return false;
  }
  return /(20|19|18|17|16|15|bull)/i.test(compactText) || /\d{6,}/.test(compactText);
}

function selectDegradedHostPanePair(hostRect, childEntries) {
  if (!hostRect || childEntries.length < 2) {
    return null;
  }

  const dominantChildren = childEntries
    .filter((entry) => entry.rect.height >= hostRect.height * DEGRADED_HOST_MIN_PANE_HEIGHT_RATIO)
    .sort((left, right) => {
      const leftArea = left.rect.width * left.rect.height;
      const rightArea = right.rect.width * right.rect.height;
      return rightArea - leftArea;
    })
    .slice(0, 2)
    .sort((left, right) => left.rect.left - right.rect.left);

  return dominantChildren.length === 2 ? dominantChildren : null;
}

function buildDegradedHostCandidate(current, gridRoot, hostRect, panePair) {
  if (!Array.isArray(panePair) || panePair.length !== 2) {
    return null;
  }

  const [leftPane, rightPane] = panePair;
  const paneSpan = leftPane.rect.width + rightPane.rect.width;
  const leftWidthRatio = hostRect.width > 0 ? leftPane.rect.width / hostRect.width : 0;
  const rightWidthRatio = hostRect.width > 0 ? rightPane.rect.width / hostRect.width : 0;
  if (
    !containsNode(leftPane.node, gridRoot) ||
    paneSpan < hostRect.width * DEGRADED_HOST_MIN_PANE_SPAN_RATIO ||
    leftWidthRatio < DEGRADED_HOST_MIN_LEFT_PANE_WIDTH_RATIO ||
    rightWidthRatio < DEGRADED_HOST_MIN_RIGHT_PANE_WIDTH_RATIO ||
    !hasDegradedControlPaneText(rightPane.node)
  ) {
    return null;
  }

  return {
    hostNode: current,
    leftPaneNode: leftPane.node,
    rightPaneNode: rightPane.node,
    rightPaneText: readCompactNodeText(rightPane.node),
  };
}

function findDegradedHostCandidate(extracted, options = {}) {
  const gridRoot = extracted?.gridSnapshot?.root || null;
  const documentRef = options.documentRef || extracted?.documentRef || null;
  if (!gridRoot || !documentRef) {
    return null;
  }

  const uniqueLabelCount = Number(
    extracted?.discoveredUniqueLabelCount ||
      extracted?.gridSnapshot?.rowMap?.size ||
      extracted?.gridSnapshot?.labels?.length ||
      0
  );
  if (uniqueLabelCount < DEGRADED_HOST_MIN_LABELS) {
    return null;
  }

  let current = gridRoot;
  while (current && current !== documentRef.body && current !== documentRef.documentElement) {
    const hostRect = readNodeRect(current);
    const childEntries = readVisibleChildEntries(current);
    const panePair = selectDegradedHostPanePair(hostRect, childEntries);
    const candidate = buildDegradedHostCandidate(current, gridRoot, hostRect, panePair);
    if (candidate) {
      return candidate;
    }

    current = current.parentElement || null;
  }

  return null;
}

function getDegradedHostDetectionStore(windowRef, documentRef) {
  const key = windowRef || documentRef || null;
  if (!key || typeof key !== "object") {
    return null;
  }

  let store = degradedHostDetectionByWindow.get(key);
  if (!store) {
    store = new Map();
    degradedHostDetectionByWindow.set(key, store);
  }
  return store;
}

function resolveDegradedHostGate(windowRef, documentRef, matchRouteId, isCandidate, options = {}) {
  const graceMs = Math.max(
    0,
    Number.isFinite(Number(options.degradedHostGraceMs))
      ? Number(options.degradedHostGraceMs)
      : DEGRADED_HOST_DEFAULT_GRACE_MS
  );
  const detectionStore = getDegradedHostDetectionStore(windowRef, documentRef);
  if (!detectionStore || !matchRouteId) {
    return {
      eligible: Boolean(isCandidate) && graceMs <= 0,
      ageMs: 0,
      graceMs,
    };
  }

  if (!isCandidate) {
    detectionStore.delete(matchRouteId);
    return {
      eligible: false,
      ageMs: 0,
      graceMs,
    };
  }

  const nowMs = Number.isFinite(Number(options.nowMs)) ? Number(options.nowMs) : Date.now();
  const existingEntry = detectionStore.get(matchRouteId);
  if (!existingEntry) {
    detectionStore.set(matchRouteId, { firstDetectedAt: nowMs });
    return {
      eligible: graceMs <= 0,
      ageMs: 0,
      graceMs,
    };
  }

  const ageMs = Math.max(0, nowMs - Number(existingEntry.firstDetectedAt || 0));
  return {
    eligible: ageMs >= graceMs,
    ageMs,
    graceMs,
  };
}

function countCoordinateBands(values, tolerancePx) {
  const numericValues = Array.isArray(values)
    ? values
      .map(Number)
      .filter((value) => Number.isFinite(value))
      .sort((left, right) => left - right)
    : [];
  if (!numericValues.length) {
    return 0;
  }

  const tolerance = Math.max(0, Number(tolerancePx) || 0);
  let bands = 1;
  let lastAnchor = numericValues[0];
  for (let index = 1; index < numericValues.length; index += 1) {
    const value = numericValues[index];
    if (Math.abs(value - lastAnchor) > tolerance) {
      bands += 1;
      lastAnchor = value;
    }
  }
  return bands;
}

function summarizeLabelGeometry(labelEntries, cricketRules, targetSet) {
  const entries = Array.isArray(labelEntries) ? labelEntries : [];
  if (entries.length < GRID_MIN_GEOMETRY_LABELS) {
    return {
      usable: false,
      rowBandCount: 0,
      columnBandCount: 0,
    };
  }

  const rects = entries
    .map((entry) => {
      const labelCell =
        resolveLabelCell(entry?.node, cricketRules, targetSet, entry?.label || "") || entry?.node || null;
      return readNodeRect(labelCell);
    })
    .filter(Boolean);

  if (rects.length < Math.min(GRID_MIN_GEOMETRY_LABELS, entries.length)) {
    return {
      usable: false,
      rowBandCount: 0,
      columnBandCount: 0,
    };
  }

  const rowBandCount = countCoordinateBands(
    rects.map((rect) => rect.top),
    GRID_ROW_BAND_TOLERANCE_PX
  );
  const columnBandCount = countCoordinateBands(
    rects.map((rect) => rect.left),
    GRID_COLUMN_BAND_TOLERANCE_PX
  );
  const usable = rowBandCount > 1 || columnBandCount > 1;

  return {
    usable,
    rowBandCount,
    columnBandCount,
  };
}

function getRootScore(rootNode, cricketRules, targetSet, options = {}) {
  if (!isCandidateGridRoot(rootNode)) {
    return {
      score: 0,
      labels: [],
      diagnostics: createLabelDiagnostics(),
      rowsWithPlayerCells: 0,
      coverage: 0,
    };
  }

  const diagnostics = createLabelDiagnostics();
  const labels = collectLabelNodes(rootNode, cricketRules, targetSet, diagnostics);
  if (!labels.length) {
    return {
      score: 0,
      labels: [],
      diagnostics,
      rowsWithPlayerCells: 0,
      coverage: 0,
    };
  }

  const uniqueLabels = new Set(labels.map((entry) => entry.label));
  const coverage = targetSet.size > 0 ? uniqueLabels.size / targetSet.size : 0;
  const rowsWithPlayerCells = labels.reduce((count, entry) => {
    const cells = collectPlayerCellsForLabel(entry.node, cricketRules, targetSet);
    return count + (cells.length > 0 ? 1 : 0);
  }, 0);
  const labelGeometry = summarizeLabelGeometry(labels, cricketRules, targetSet);
  const allowLabelOnlyRows =
    options.allowLabelOnlyRows === true &&
    uniqueLabels.size >= BASE_CRICKET_OBJECTIVE_COUNT &&
    labelGeometry.usable;

  if (uniqueLabels.size < GRID_MIN_UNIQUE_LABELS) {
    return {
      score: 0,
      labels,
      diagnostics,
      rowsWithPlayerCells,
      coverage,
    };
  }
  if (rowsWithPlayerCells < GRID_MIN_ROWS_WITH_PLAYER_CELLS && !allowLabelOnlyRows) {
    return {
      score: 0,
      labels,
      diagnostics,
      rowsWithPlayerCells,
      coverage,
    };
  }
  if (coverage < GRID_MIN_COVERAGE) {
    return {
      score: 0,
      labels,
      diagnostics,
      rowsWithPlayerCells,
      coverage,
    };
  }

  const requiredRowBands = Math.min(
    uniqueLabels.size,
    Math.max(GRID_MIN_ROW_BAND_COUNT, Math.ceil(uniqueLabels.size * GRID_ROW_BAND_RATIO))
  );
  if (labelGeometry.usable && labelGeometry.rowBandCount < requiredRowBands) {
    return {
      score: 0,
      labels,
      diagnostics,
      rowsWithPlayerCells,
      coverage,
    };
  }

  const visibleBonus = isNodeVisible(rootNode) ? 10 : 0;
  const geometryBonus = labelGeometry.usable ? labelGeometry.rowBandCount * 8 : 0;
  const score =
    uniqueLabels.size * 100 + labels.length + visibleBonus + rowsWithPlayerCells * 6 + geometryBonus;
  return { score, labels, diagnostics, rowsWithPlayerCells, coverage };
}

function collectPreferredGridRoots(documentRef) {
  const playerDisplays = queryAll(documentRef, "#ad-ext-player-display");
  const candidates = [];
  const seen = new Set();

  playerDisplays.forEach((playerDisplay) => {
    const siblingRoot = playerDisplay?.nextElementSibling || null;
    if (!siblingRoot || seen.has(siblingRoot)) {
      return;
    }
    if (isProtectedCricketGridRootCandidate(siblingRoot)) {
      return;
    }
    seen.add(siblingRoot);
    candidates.push(siblingRoot);
  });

  return candidates;
}

export function findCricketGrid(options = {}) {
  const documentRef = options.documentRef;
  const cricketRules = options.cricketRules;
  const targetOrder = options.targetOrder;
  if (!documentRef) {
    return null;
  }
  const targetSet = new Set(Array.isArray(targetOrder) ? targetOrder : []);
  let bestRoot = null;
  let bestScore = 0;
  let bestLabels = [];
  let bestDiagnostics = createLabelDiagnostics();
  let bestRowsWithPlayerCells = 0;
  let bestCoverage = 0;

  collectPreferredGridRoots(documentRef).forEach((candidate) => {
    const snapshot = getRootScore(candidate, cricketRules, targetSet, {
      allowLabelOnlyRows: true,
    });
    if (snapshot.score > bestScore) {
      bestRoot = candidate;
      bestScore = snapshot.score;
      bestLabels = snapshot.labels;
      bestDiagnostics = cloneLabelDiagnostics(snapshot.diagnostics);
      bestRowsWithPlayerCells = Number(snapshot.rowsWithPlayerCells) || 0;
      bestCoverage = Number(snapshot.coverage) || 0;
    }
  });

  GRID_ROOT_SELECTORS.forEach((selector) => {
    queryAll(documentRef, selector).forEach((candidate) => {
      const snapshot = getRootScore(candidate, cricketRules, targetSet);
      if (snapshot.score > bestScore) {
        bestRoot = candidate;
        bestScore = snapshot.score;
        bestLabels = snapshot.labels;
        bestDiagnostics = cloneLabelDiagnostics(snapshot.diagnostics);
        bestRowsWithPlayerCells = Number(snapshot.rowsWithPlayerCells) || 0;
        bestCoverage = Number(snapshot.coverage) || 0;
      }
    });
  });

  if (!bestRoot) {
    return null;
  }

  return {
    root: bestRoot,
    labels: bestLabels,
    diagnostics: bestDiagnostics,
    rowsWithPlayerCells: bestRowsWithPlayerCells,
    coverage: bestCoverage,
  };
}

function resolveGridSnapshot(documentRef, cricketRules, targetOrder, cache = null) {
  return resolveGridSnapshotFromCache(
    documentRef,
    cricketRules,
    targetOrder,
    cache,
    findCricketGrid
  );
}

function resolveBoardSnapshot(documentRef, cache = null) {
  return resolveBoardSnapshotFromCache(documentRef, cache);
}

function hasOwnMarkValue(node, options = {}) {
  if (!node) {
    return false;
  }
  const cricketRules = options.cricketRules;
  const allowTextMarkValue = options.allowTextMarkValue !== false;
  if (Object.hasOwn(node?.dataset || {}, "marks")) {
    return true;
  }
  if (typeof node.querySelectorAll === "function") {
    const markImages = node.querySelectorAll("img[alt]");
    if (markImages.length > 0) {
      return true;
    }
  }
  if (!allowTextMarkValue) {
    return false;
  }

  return Number.isFinite(parseTextMarkValue(node.textContent, cricketRules));
}

function isLikelyPlayerCell(node, cricketRules, targetSet) {
  if (!node || !isNodeVisible(node)) {
    return false;
  }
  if (
    PLAYER_CELL_SELECTORS.some((selector) => {
      return node.matches?.(selector);
    })
  ) {
    return true;
  }
  if (hasOwnMarkValue(node, { cricketRules })) {
    const label = normalizeCricketLabelNode(cricketRules, node);
    return !label || !targetSet.has(label);
  }
  return false;
}

function hasAnyTargetDescendant(node, cricketRules, targetSet) {
  return hasAnyTargetDescendantFromDiscovery(node, cricketRules, targetSet);
}

function isLikelyStructuralPlayerCell(node, labelNode, cricketRules, targetSet) {
  if (!isLikelyStructuralPlayerCellFromDiscovery(node, labelNode, cricketRules, targetSet)) {
    return false;
  }

  const compactText = String(node?.textContent || "").trim();
  if (compactText.length > 3 && !hasOwnMarkValue(node, { cricketRules, allowTextMarkValue: false })) {
    return false;
  }

  return true;
}

function collectSiblingPlayerCells(labelNode, cricketRules, targetSet) {
  return collectSiblingPlayerCellsFromDiscovery(labelNode, cricketRules, targetSet, isLikelyPlayerCell);
}

function collectPlayerCellsForLabel(labelNode, cricketRules, targetSet) {
  if (!labelNode) {
    return [];
  }
  if (isInsideTurnPreview(labelNode)) {
    return [];
  }

  const labelCell = resolveLabelCell(labelNode, cricketRules, targetSet);
  const directRow = labelNode.closest?.("tr");
  if (directRow) {
    return queryAll(directRow, "td, .player-cell, [data-player-index], [data-marks]").filter((node) => {
      return node !== labelNode && node !== labelCell;
    });
  }

  const parent = labelNode.parentElement;
  if (parent) {
    const nestedCells = PLAYER_CELL_SELECTORS.flatMap((selector) => queryAll(parent, selector)).filter((node) => {
      return node !== labelNode && node !== labelCell;
    });
    if (nestedCells.length > 0) {
      return nestedCells;
    }
  }

  if (labelCell && labelCell !== labelNode) {
    const labelCellSiblings = collectSiblingPlayerCells(labelCell, cricketRules, targetSet);
    if (labelCellSiblings.length > 0) {
      return labelCellSiblings;
    }
  }

  return collectSiblingPlayerCells(labelNode, cricketRules, targetSet);
}

function getRowNode(labelNode) {
  return labelNode?.closest?.("tr") || labelNode?.parentElement || labelNode || null;
}

function collectTargetLabelsInNode(node, cricketRules, targetSet, fallbackLabel = "") {
  return collectTargetLabelsInNodeFromDiscovery(node, cricketRules, targetSet, fallbackLabel);
}

function resolveLabelCell(labelNode, cricketRules = null, targetSet = null, fallbackLabel = "") {
  return resolveLabelCellFromDiscovery(labelNode, cricketRules, targetSet, fallbackLabel);
}

function resolveBadgeNode(labelNode, labelCell, cricketRules, label) {
  return resolveBadgeNodeFromDiscovery(labelNode, labelCell, cricketRules, label, {
    allowLabelNodeFallback: true,
  });
}

function resolveVisiblePlayerCount(documentRef) {
  if (!documentRef) {
    return 0;
  }

  const playerNodes = [
    ...queryAll(documentRef, "#ad-ext-player-display .ad-ext-player"),
    ...queryAll(documentRef, ".ad-ext-player"),
  ].filter((node, index, nodes) => nodes.indexOf(node) === index);
  if (!playerNodes.length) {
    return 0;
  }

  const visiblePlayers = playerNodes.filter((node) => isNodeVisible(node));
  return visiblePlayers.length > 0 ? visiblePlayers.length : playerNodes.length;
}

function resolveActivePlayerIndex(gameState, documentRef, playerCount, options = {}) {
  const stateIndex = Number.isFinite(gameState?.getActivePlayerIndex?.())
    ? Number(gameState.getActivePlayerIndex())
    : 0;

  const activePlayerNodes = queryAll(documentRef, ".ad-ext-player");
  const visiblePlayerNodes = activePlayerNodes.filter((node) => isNodeVisible(node));
  const domActiveIndex = visiblePlayerNodes.findIndex((node) => {
    return Boolean(node.classList?.contains("ad-ext-player-active"));
  });

  // Board perspective should react immediately to the visible active-player switch.
  // Trust the DOM active marker only when the visible roster is complete; otherwise
  // fall back to game-state index to avoid pinning to an incomplete DOM snapshot.
  const hasCompleteVisibleRoster =
    Number.isFinite(playerCount) && playerCount > 0
      ? visiblePlayerNodes.length >= playerCount
      : visiblePlayerNodes.length > 0;
  const canTrustDomActive = domActiveIndex >= 0 && hasCompleteVisibleRoster;
  let candidate = domActiveIndex;
  if (canTrustDomActive) {
    candidate = domActiveIndex;
  } else if (Number.isFinite(stateIndex)) {
    candidate = stateIndex;
  }

  if (!Number.isFinite(candidate) || playerCount <= 0) {
    return 0;
  }
  return Math.max(0, Math.min(Math.round(candidate), playerCount - 1));
}

function resolveGameModeNormalized(gameState, variantRules, documentRef) {
  const variantText = String(documentRef?.getElementById?.("ad-ext-game-variant")?.textContent || "");
  if (variantRules && typeof variantRules.classifyCricketGameMode === "function") {
    const classifiedVariant = variantRules.classifyCricketGameMode(variantText);
    if (classifiedVariant === "cricket" || classifiedVariant === "tactics") {
      return classifiedVariant;
    }
  }

  if (typeof gameState?.getCricketGameModeNormalized === "function") {
    const normalized = String(gameState.getCricketGameModeNormalized() || "").trim().toLowerCase();
    if (normalized === "cricket" || normalized === "tactics") {
      return normalized;
    }
  }

  const rawMode = typeof gameState?.getCricketGameMode === "function"
    ? String(gameState.getCricketGameMode() || "")
    : "";
  if (variantRules && typeof variantRules.classifyCricketGameMode === "function") {
    const classified = variantRules.classifyCricketGameMode(rawMode);
    if (classified === "cricket" || classified === "tactics") {
      return classified;
    }
  }

  return "";
}

function classifyScoringMode(value, variantRules) {
  const normalized = String(value || "").trim().toLowerCase();
  if (KNOWN_SCORING_MODES.has(normalized)) {
    return normalized;
  }

  if (variantRules && typeof variantRules.classifyCricketScoringMode === "function") {
    return variantRules.classifyCricketScoringMode(value);
  }

  return normalized || "unknown";
}

function resolveScoringModeState(gameState, variantRules, gameModeNormalized) {
  const rawNormalizedInput =
    typeof gameState?.getCricketScoringModeNormalized === "function"
      ? String(gameState.getCricketScoringModeNormalized() || "").trim()
      : "";

  let rawMode = "";
  if (typeof gameState?.getCricketScoringMode === "function") {
    rawMode = String(gameState.getCricketScoringMode() || "").trim();
  } else if (typeof gameState?.getCricketMode === "function") {
    rawMode = String(gameState.getCricketMode() || "").trim();
  }

  const rawScoringMode = rawNormalizedInput || rawMode || "unknown";
  const classified = classifyScoringMode(rawScoringMode, variantRules);

  if (
    classified === "unknown" &&
    (gameModeNormalized === "cricket" || gameModeNormalized === "tactics")
  ) {
    return {
      rawScoringMode,
      normalizedScoringMode: "standard",
      scoringModeSource: "fallback-standard-for-unknown",
    };
  }

  return {
    rawScoringMode,
    normalizedScoringMode: classified || "unknown",
    scoringModeSource: rawNormalizedInput ? "game-state-normalized" : "classified",
  };
}

function resolveTacticsPrecisionMode(gameState, variantRules, documentRef) {
  if (!variantRules || typeof variantRules.classifyCricketTacticsPrecision !== "function") {
    return "unknown";
  }

  const candidates = [
    typeof gameState?.getCricketMode === "function" ? gameState.getCricketMode() : "",
    typeof gameState?.getCricketScoringMode === "function" ? gameState.getCricketScoringMode() : "",
    typeof gameState?.getCricketGameMode === "function" ? gameState.getCricketGameMode() : "",
    String(documentRef?.getElementById?.("ad-ext-game-variant")?.textContent || ""),
  ];

  for (const candidate of candidates) {
    const precision = variantRules.classifyCricketTacticsPrecision(candidate);
    if (precision === "strict" || precision === "slop") {
      return precision;
    }
  }

  return "unknown";
}

function parseTurnTimestamp(value) {
  if (!value) {
    return 0;
  }
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function selectNewestTurnCandidate(turns = []) {
  if (!Array.isArray(turns) || !turns.length) {
    return null;
  }

  return turns.reduce((best, candidate) => {
    if (!candidate || typeof candidate !== "object") {
      return best;
    }
    if (!best) {
      return candidate;
    }

    const candidateRound = Number.isFinite(candidate?.round) ? candidate.round : -1;
    const bestRound = Number.isFinite(best?.round) ? best.round : -1;
    if (candidateRound !== bestRound) {
      return candidateRound > bestRound ? candidate : best;
    }

    const candidateTurn = Number.isFinite(candidate?.turn) ? candidate.turn : -1;
    const bestTurn = Number.isFinite(best?.turn) ? best.turn : -1;
    if (candidateTurn !== bestTurn) {
      return candidateTurn > bestTurn ? candidate : best;
    }

    const candidateTs = parseTurnTimestamp(candidate?.createdAt);
    const bestTs = parseTurnTimestamp(best?.createdAt);
    return candidateTs >= bestTs ? candidate : best;
  }, null);
}

function getPlayerIdByIndex(match, playerIndex) {
  if (!match || !Array.isArray(match.players)) {
    return "";
  }
  const resolvedIndex = Number.isFinite(Number(playerIndex))
    ? Math.max(0, Math.round(Number(playerIndex)))
    : -1;
  if (!(resolvedIndex >= 0 && resolvedIndex < match.players.length)) {
    return "";
  }
  const player = match.players[resolvedIndex] || null;
  return String(player?.id || player?.userId || player?.playerId || "").trim();
}

function toThrowSignatureParts(throws, cricketRules, targetOrder) {
  if (!Array.isArray(throws) || !throws.length) {
    return [];
  }
  const targetSet = new Set(Array.isArray(targetOrder) ? targetOrder : []);
  return throws.map((throwEntry, index) => {
    const parsed = cricketRules.parseCricketThrowSegment(throwEntry);
    if (!parsed || (targetSet.size > 0 && !targetSet.has(parsed.label))) {
      return `unknown-${index}`;
    }
    return `${parsed.ring}${parsed.value}`;
  });
}

function haveEquivalentThrowSignatures(leftThrows, rightThrows, cricketRules, targetOrder) {
  const left = toThrowSignatureParts(leftThrows, cricketRules, targetOrder);
  const right = toThrowSignatureParts(rightThrows, cricketRules, targetOrder);
  if (left.length !== right.length) {
    return false;
  }
  return left.every((entry, index) => entry === right[index]);
}

function createActiveThrowPreviewDebug(activeThrows, cricketRules, targetOrder) {
  return {
    throwCount: activeThrows.length,
    applied: false,
    suppressionReason: "",
    activeTurnFinished: false,
    matchedFinishedTurn: false,
    activeThrowsSignature: toThrowSignatureParts(activeThrows, cricketRules, targetOrder).join(","),
    activeTurnSignature: "",
  };
}

function readActiveTurnPreviewState(gameState, cricketRules, targetOrder) {
  const activeTurn =
    gameState && typeof gameState.getActiveTurn === "function"
      ? gameState.getActiveTurn()
      : null;
  if (!activeTurn || typeof activeTurn !== "object") {
    return {
      finished: false,
      signature: "",
    };
  }

  return {
    finished: Boolean(String(activeTurn.finishedAt || "").trim()),
    signature: toThrowSignatureParts(
      Array.isArray(activeTurn.throws) ? activeTurn.throws : [],
      cricketRules,
      targetOrder
    ).join(","),
  };
}

function listSnapshotTurns(snapshotMatch) {
  return Array.isArray(snapshotMatch?.turns)
    ? snapshotMatch.turns.filter((turn) => turn && typeof turn === "object")
    : [];
}

function isTurnOwnedByPlayer(turn, playerId) {
  return String(turn?.playerId || "").trim() === playerId;
}

function isFinishedTurnWithThrows(turn) {
  return Boolean(String(turn?.finishedAt || "").trim()) &&
    Array.isArray(turn?.throws) &&
    turn.throws.length > 0;
}

function shouldSuppressPreviewForFinishedSnapshotTurn(
  snapshotMatch,
  activePlayerIndex,
  activeThrows,
  cricketRules,
  targetOrder
) {
  const activePlayerId = getPlayerIdByIndex(snapshotMatch, activePlayerIndex);
  if (!activePlayerId) {
    return false;
  }

  const turns = listSnapshotTurns(snapshotMatch);
  const unfinishedTurnsForActivePlayer = turns.filter((turn) => {
    return isTurnOwnedByPlayer(turn, activePlayerId) && !String(turn.finishedAt || "").trim();
  });
  if (unfinishedTurnsForActivePlayer.length > 0) {
    return false;
  }

  const newestFinishedTurn = selectNewestTurnCandidate(
    turns.filter((turn) => {
      return isTurnOwnedByPlayer(turn, activePlayerId) && isFinishedTurnWithThrows(turn);
    })
  );
  return Boolean(
    newestFinishedTurn &&
      haveEquivalentThrowSignatures(
        newestFinishedTurn.throws,
        activeThrows,
        cricketRules,
        targetOrder
      )
  );
}

function shouldApplyActiveThrowPreview(options = {}) {
  const gameState = options.gameState;
  const cricketRules = options.cricketRules;
  const targetOrder = options.targetOrder;
  const activeThrows = Array.isArray(options.activeThrows) ? options.activeThrows : [];
  const activePlayerIndex = Number.isFinite(Number(options.activePlayerIndex))
    ? Math.max(0, Math.round(Number(options.activePlayerIndex)))
    : 0;
  const snapshotMatch = options.snapshotMatch || null;

  const debug = createActiveThrowPreviewDebug(activeThrows, cricketRules, targetOrder);

  if (!activeThrows.length) {
    debug.suppressionReason = "no-active-throws";
    return debug;
  }

  const activeTurnState = readActiveTurnPreviewState(gameState, cricketRules, targetOrder);
  debug.activeTurnSignature = activeTurnState.signature;
  debug.activeTurnFinished = activeTurnState.finished;

  if (debug.activeTurnFinished) {
    debug.suppressionReason = "active-turn-finished";
    return debug;
  }

  if (
    shouldSuppressPreviewForFinishedSnapshotTurn(
      snapshotMatch,
      activePlayerIndex,
      activeThrows,
      cricketRules,
      targetOrder
    )
  ) {
    debug.matchedFinishedTurn = true;
    debug.suppressionReason = "matches-last-finished-turn";
    return debug;
  }

  debug.applied = true;
  return debug;
}

function readActiveThrowMarksByLabel(gameState, cricketRules, targetOrder, options = {}) {
  const activeThrows = Array.isArray(gameState?.getActiveThrows?.()) ? gameState.getActiveThrows() : [];
  const marksByLabel = new Map();
  const previewDecision = shouldApplyActiveThrowPreview({
    gameState,
    cricketRules,
    targetOrder,
    activeThrows,
    activePlayerIndex: options.activePlayerIndex,
    snapshotMatch: options.snapshotMatch || null,
  });

  if (!previewDecision.applied) {
    return {
      throws: activeThrows,
      marksByLabel,
      debug: previewDecision,
    };
  }

  activeThrows.forEach((throwEntry) => {
    const parsed = cricketRules.parseCricketThrowSegment(throwEntry);
    if (!parsed || !targetOrder.includes(parsed.label)) {
      return;
    }

    marksByLabel.set(
      parsed.label,
      cricketRules.clampMarks((marksByLabel.get(parsed.label) || 0) + parsed.marks)
    );
  });

  return {
    throws: activeThrows,
    marksByLabel,
    debug: previewDecision,
  };
}

function readTurnMarksByLabel(gameState, cricketRules, targetOrder, playerCount) {
  const snapshot = typeof gameState?.getSnapshot === "function" ? gameState.getSnapshot() : null;
  const match = snapshot?.match;

  if (!match || !Array.isArray(match.players) || !Array.isArray(match.turns)) {
    return null;
  }

  const resolvedPlayerCount = Math.max(playerCount, match.players.length);
  const playerIndexById = new Map();
  match.players.forEach((player, index) => {
    const playerId = player?.id || player?.userId || player?.playerId || "";
    if (playerId) {
      playerIndexById.set(String(playerId), index);
    }
  });

  if (!playerIndexById.size) {
    return null;
  }

  let marksByLabel = cricketRules.createEmptyMarksByLabel(targetOrder, resolvedPlayerCount);
  let hasAnyTurnMarks = false;

  match.turns.forEach((turn) => {
    if (!turn || typeof turn !== "object" || !Array.isArray(turn.throws) || !turn.throws.length) {
      return;
    }
    // The active unfinished turn is previewed separately via getActiveThrows().
    if (!String(turn.finishedAt || "").trim()) {
      return;
    }

    const playerIndex = playerIndexById.get(String(turn.playerId || ""));
    if (!Number.isFinite(playerIndex)) {
      return;
    }

    hasAnyTurnMarks = true;
    marksByLabel = cricketRules.applyThrowsToMarksByLabel({
      targetOrder,
      playerIndex,
      playerCount: resolvedPlayerCount,
      baseMarksByLabel: marksByLabel,
      throws: turn.throws,
    });
  });

  return hasAnyTurnMarks ? marksByLabel : null;
}

function buildMarksByLabelSnapshot(options = {}) {
  const documentRef = options.documentRef;
  const cricketRules = options.cricketRules;
  const gameState = options.gameState;
  const variantRules = options.variantRules;

  if (!documentRef || !cricketRules) {
    return null;
  }

  const explicitGameModeNormalized = resolveGameModeNormalized(gameState, variantRules, documentRef);
  const discoveryTargetOrder = Array.isArray(cricketRules.CRICKET_DISCOVERY_TARGET_ORDER)
    ? cricketRules.CRICKET_DISCOVERY_TARGET_ORDER
    : cricketRules.getTargetOrderByGameMode("tactics");
  const grid = resolveGridSnapshot(documentRef, cricketRules, discoveryTargetOrder, options.cache);
  if (!grid) {
    return null;
  }

  const discoveredLabels = grid.labels.map((entry) => entry.label);
  const inferredGameModeNormalized = explicitGameModeNormalized ||
    cricketRules.inferCricketGameModeByLabels(discoveredLabels);
  const gameModeNormalized = inferredGameModeNormalized || "cricket";
  const targetOrder =
    typeof cricketRules.resolveTargetOrderByGameModeAndLabels === "function"
      ? cricketRules.resolveTargetOrderByGameModeAndLabels(gameModeNormalized, discoveredLabels)
      : cricketRules.getTargetOrderByGameMode(gameModeNormalized);
  const targetSet = new Set(targetOrder);
  const labelDiagnostics = cloneLabelDiagnostics(grid.diagnostics);
  if (labelDiagnostics.atomicLabelCount <= 0) {
    labelDiagnostics.atomicLabelCount = grid.labels.length;
  }
  if (labelDiagnostics.atomicUniqueLabelCount <= 0) {
    labelDiagnostics.atomicUniqueLabelCount = new Set(grid.labels.map((entry) => entry.label)).size;
  }
  const snapshot = typeof gameState?.getSnapshot === "function" ? gameState.getSnapshot() : null;
  const playerCountFromMatch = Array.isArray(snapshot?.match?.players) ? snapshot.match.players.length : 0;
  const playerCountFromDom = resolveVisiblePlayerCount(documentRef);
  const expectedPlayerCount =
    playerCountFromMatch > 0 ? playerCountFromMatch : playerCountFromDom;
  const cachedStableRows =
    options.cache?.gridStableRowsByLabel instanceof Map ? options.cache.gridStableRowsByLabel : null;
  const {
    hasIndexedPlayerColumns,
    labelCellMarkSourceLabels,
    marksByLabel,
    maxPlayerCount,
    recoveredStableLabels,
    rowMetaByLabel,
    shortfallRepairLabels,
  } = buildGridRowSnapshot({
    cachedStableRows,
    collectPlayerCellsForLabel: (labelNode) =>
      collectPlayerCellsForLabel(labelNode, cricketRules, targetSet),
    cricketRules,
    expectedPlayerCount,
    getRowNode,
    gridLabels: grid.labels,
    isInsideTurnPreview,
    resolveBadgeNode: (labelNode, labelCell, label) =>
      resolveBadgeNode(labelNode, labelCell, cricketRules, label),
    resolveLabelCell: (labelNode, label) =>
      resolveLabelCell(labelNode, cricketRules, targetSet, label),
    targetOrder,
    targetSet,
  });

  const playerCount = Math.max(maxPlayerCount, expectedPlayerCount, 1);

  targetOrder.forEach((label) => {
    if (!Array.isArray(marksByLabel[label])) {
      marksByLabel[label] = [];
    }
    while (marksByLabel[label].length < playerCount) {
      marksByLabel[label].push(0);
    }
  });

  const activePlayerIndex = resolveActivePlayerIndex(gameState, documentRef, playerCount, {
    preferGameStateIndex: hasIndexedPlayerColumns,
  });
  const activeThrows = Array.isArray(gameState?.getActiveThrows?.()) ? gameState.getActiveThrows() : [];
  const activeThrowPreview = {
    marksByLabel: new Map(),
    throws: activeThrows,
    debug: {
      applied: false,
      suppressionReason: "grid-authoritative",
      throwCount: activeThrows.length,
      targetCount: targetOrder.length,
      activePlayerIndex,
    },
  };
  const marksMergeByLabelDebug = {};

  targetOrder.forEach((label) => {
    const domMarks = Array.isArray(marksByLabel[label]) ? marksByLabel[label] : [];
    const domMarksBeforeMerge = domMarks.map((value) => cricketRules.clampMarks(value || 0));

    for (let index = 0; index < playerCount; index += 1) {
      domMarks[index] = cricketRules.clampMarks(domMarks[index] || 0);
    }

    const relevantDebugEntry =
      domMarksBeforeMerge.some((value) => value > 0) ||
      domMarks.some((value) => cricketRules.clampMarks(value || 0) > 0);
    if (relevantDebugEntry) {
      marksMergeByLabelDebug[label] = {
        domBefore: domMarksBeforeMerge.join(","),
        mergeSource: "grid",
        activeThrowApplied: false,
        final: domMarks.map((value) => cricketRules.clampMarks(value || 0)).join(","),
      };
    }
  });

  const scoringModeState = resolveScoringModeState(
    gameState,
    variantRules,
    gameModeNormalized
  );
  const tacticsPrecisionMode = resolveTacticsPrecisionMode(gameState, variantRules, documentRef);
  const scoringModeNormalized = scoringModeState.normalizedScoringMode;
  const enrichedMarksByLabel = marksByLabel;

  const stateMap = cricketRules.computeTargetStates(enrichedMarksByLabel, {
    gameMode: gameModeNormalized,
    scoringModeNormalized,
    activePlayerIndex,
    targetOrder,
  });
  const marksByLabelDebug = {};
  targetOrder.forEach((label) => {
    const marks = Array.isArray(enrichedMarksByLabel?.[label]) ? enrichedMarksByLabel[label] : [];
    if (!marks.length) {
      return;
    }

    const stateEntry = stateMap.get(label);
    const presentation = String(
      stateEntry?.boardPresentation || stateEntry?.presentation || "open"
    ).toLowerCase();
    const hasMarks = marks.some((value) => cricketRules.clampMarks(value) > 0);
    const relevant = presentation !== "open" || hasMarks;
    if (!relevant) {
      return;
    }

    marksByLabelDebug[label] = marks.join(",");
  });

  const gridRows = targetOrder
    .map((label) => {
      const rowMeta = rowMetaByLabel.get(label);
      if (!rowMeta) {
        return null;
      }
      return {
        label,
        labelNode: rowMeta.labelNode || null,
        labelCell: rowMeta.labelCell || null,
        badgeNode: rowMeta.badgeNode || null,
        rowNode: rowMeta.rowNode || null,
        playerCells: Array.isArray(rowMeta.playerCells)
          ? rowMeta.playerCells.filter(Boolean)
          : [],
        playerCellsByIndex: Array.isArray(rowMeta.playerCellsByIndex)
          ? rowMeta.playerCellsByIndex.map((cell) => (cell && cell.isConnected !== false ? cell : null))
          : [],
        marksByPlayer: Array.isArray(enrichedMarksByLabel?.[label])
          ? enrichedMarksByLabel[label].map((value) => cricketRules.clampMarks(value))
          : [],
      };
    })
    .filter(Boolean);

  if (options.cache && typeof options.cache === "object") {
    const previousStableCount =
      options.cache.gridStableRowsByLabel instanceof Map ? options.cache.gridStableRowsByLabel.size : 0;
    if (gridRows.length >= previousStableCount) {
      options.cache.gridStableRowsByLabel = new Map(
        gridRows.map((row) => {
          return [row.label, row];
        })
      );
    }
  }

  const boardSnapshot = resolveBoardSnapshot(documentRef, options.cache);
  const discoveredLabelCount = Math.max(grid.labels.length, rowMetaByLabel.size);
  const discoveredUniqueLabelCount = Math.max(
    new Set(grid.labels.map((entry) => entry.label)).size,
    rowMetaByLabel.size
  );
  if (labelDiagnostics.atomicLabelCount < discoveredLabelCount) {
    labelDiagnostics.atomicLabelCount = discoveredLabelCount;
  }
  if (labelDiagnostics.atomicUniqueLabelCount < discoveredUniqueLabelCount) {
    labelDiagnostics.atomicUniqueLabelCount = discoveredUniqueLabelCount;
  }

  return {
    documentRef,
    gameState,
    gameModeNormalized,
    scoringModeRaw: scoringModeState.rawScoringMode,
    scoringModeNormalized,
    scoringModeSource: scoringModeState.scoringModeSource,
    tacticsPrecisionMode,
    targetOrder,
    activePlayerIndex,
    discoveredLabelCount,
    discoveredUniqueLabelCount,
    discoveredRawLabelCount: labelDiagnostics.rawLabelCount,
    discoveredRawUniqueLabelCount: labelDiagnostics.rawUniqueLabelCount,
    labelDiagnostics,
    recoveredStableLabelCount: recoveredStableLabels.length,
    recoveredStableLabels,
    labelCellMarkSourceCount: labelCellMarkSourceLabels.length,
    labelCellMarkSourceLabels,
    shortfallRepairCount: shortfallRepairLabels.length,
    shortfallRepairLabels,
    marksByLabelDebug,
    marksMergeByLabelDebug,
    activeThrowPreviewDebug: {
      ...activeThrowPreview?.debug,
      labels: Array.from(activeThrowPreview?.marksByLabel?.keys?.() || []),
    },
    marksByLabel: enrichedMarksByLabel,
    stateMap,
    gridSnapshot: {
      root: grid.root,
      labels: grid.labels,
      diagnostics: labelDiagnostics,
      rows: gridRows,
      rowMap: new Map(gridRows.map((row) => [row.label, row])),
      rowsWithPlayerCells: Number(grid.rowsWithPlayerCells) || 0,
      coverage: Number(grid.coverage) || 0,
    },
    boardSnapshot: boardSnapshot || null,
  };
}

export function extractScoreboardState(options = {}) {
  const documentRef = options.documentRef;
  const windowRef = options.windowRef || documentRef?.defaultView || null;
  const gameState = options.gameState;
  const variantRules = options.variantRules;
  const enforceVariantGuard = options.enforceVariantGuard === true;
  const variantText = readVariantText(documentRef);
  const matchRouteId = extractMatchRouteId(windowRef, documentRef);

  if (!documentRef || !options.cricketRules) {
    return {
      surfaceStatus: CRICKET_SURFACE_STATUS.MISSING_GRID,
      matchRouteId,
      variantText,
      pipelineSignature: `${CRICKET_SURFACE_STATUS.MISSING_GRID}::invalid-context`,
      transitionSignature: `${CRICKET_SURFACE_STATUS.MISSING_GRID}::invalid-context`,
    };
  }

  if (isXConfigRoute(windowRef, documentRef)) {
    resolveDegradedHostGate(windowRef, documentRef, matchRouteId, false, options);
    return {
      surfaceStatus: CRICKET_SURFACE_STATUS.PAUSED_ROUTE,
      matchRouteId,
      variantText,
      pipelineSignature: `${CRICKET_SURFACE_STATUS.PAUSED_ROUTE}::${variantText || "-"}`,
      transitionSignature: `${CRICKET_SURFACE_STATUS.PAUSED_ROUTE}::${variantText || "-"}`,
    };
  }

  if (enforceVariantGuard && !isCricketFamilyActive(gameState, documentRef, variantRules)) {
    resolveDegradedHostGate(windowRef, documentRef, matchRouteId, false, options);
    return {
      surfaceStatus: CRICKET_SURFACE_STATUS.INACTIVE_VARIANT,
      matchRouteId,
      variantText,
      pipelineSignature: `${CRICKET_SURFACE_STATUS.INACTIVE_VARIANT}::${variantText || "-"}`,
      transitionSignature: `${CRICKET_SURFACE_STATUS.INACTIVE_VARIANT}::${variantText || "-"}`,
    };
  }

  const extracted = buildMarksByLabelSnapshot(options);
  if (!extracted) {
    resolveDegradedHostGate(windowRef, documentRef, matchRouteId, false, options);
    return {
      surfaceStatus: CRICKET_SURFACE_STATUS.MISSING_GRID,
      matchRouteId,
      variantText,
      pipelineSignature: `${CRICKET_SURFACE_STATUS.MISSING_GRID}::${variantText || "-"}`,
      transitionSignature: `${CRICKET_SURFACE_STATUS.MISSING_GRID}::${variantText || "-"}`,
    };
  }

  const boardSnapshot = extracted.boardSnapshot;
  const hasBoard = Boolean(boardSnapshot?.group && Number(boardSnapshot?.radius) > 0);
  const degradedHostCandidate = !hasBoard && matchRouteId
    ? findDegradedHostCandidate(extracted, { documentRef })
    : null;
  const degradedHostGate = resolveDegradedHostGate(
    windowRef,
    documentRef,
    matchRouteId,
    Boolean(degradedHostCandidate),
    options
  );
  let surfaceStatus = CRICKET_SURFACE_STATUS.MISSING_BOARD;
  if (hasBoard) {
    surfaceStatus = CRICKET_SURFACE_STATUS.READY;
  } else if (degradedHostCandidate && degradedHostGate.eligible) {
    surfaceStatus = CRICKET_SURFACE_STATUS.DEGRADED_HOST;
  }

  return {
    ...extracted,
    degradedHostInfo: degradedHostCandidate
      ? {
        rightPaneText: degradedHostCandidate.rightPaneText,
        graceMs: degradedHostGate.graceMs,
        ageMs: degradedHostGate.ageMs,
        pending: !degradedHostGate.eligible,
      }
      : null,
    matchRouteId,
    surfaceStatus,
    variantText,
  };
}

export function buildCricketRenderState(input = {}, options = {}) {
  const extracted = input?.surfaceStatus
    ? input
    : extractScoreboardState({
      ...input,
      ...options,
    });

  const variantText = extracted?.variantText || readVariantText(extracted?.documentRef);

  if (!extracted || extracted.surfaceStatus !== CRICKET_SURFACE_STATUS.READY && extracted.surfaceStatus !== CRICKET_SURFACE_STATUS.MISSING_BOARD) {
    const status = extracted?.surfaceStatus || CRICKET_SURFACE_STATUS.MISSING_GRID;
    const signature = `${status}::${variantText || "-"}`;
    return {
      ...extracted,
      surfaceStatus: status,
      variantText,
      targetStates: deriveTargetStates(null),
      pipelineSignature: signature,
      transitionSignature: signature,
    };
  }

  const rawStateMap = extracted.stateMap instanceof Map
    ? extracted.stateMap
    : new Map();
  const stateMap = enrichStateMapForUi(rawStateMap);
  const pipelineSignature = buildPipelineSignature(extracted, stateMap);
  const turnToken = buildTurnToken(
    extracted.gameState || input?.gameState || options?.gameState,
    Number(extracted.activePlayerIndex) || 0
  );
  const transitionSignature = `${pipelineSignature}::${turnToken}`;
  const targetStates = deriveTargetStates({
    stateMap,
  });

  return {
    ...extracted,
    stateMap,
    targetStates,
    turnToken,
    pipelineSignature,
    transitionSignature,
  };
}

export function derivePipelineState(options = {}) {
  const extracted = extractScoreboardState(options);
  return buildCricketRenderState(extracted, options);
}
