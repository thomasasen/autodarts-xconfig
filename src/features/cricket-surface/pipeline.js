import { findBoardSvgGroup } from "../../shared/dartboard-svg.js";
import {
  CRICKET_UI_BUCKET,
  normalizeCricketPresentationToken,
  resolveCricketHighlightActive,
  resolveCricketUiBucket,
} from "./presentation.js";

export const CRICKET_SURFACE_STATUS = Object.freeze({
  READY: "ready",
  MISSING_GRID: "missing-grid",
  MISSING_BOARD: "missing-board",
  PAUSED_ROUTE: "paused-route",
  INACTIVE_VARIANT: "inactive-variant",
});

const UI_BUCKET = CRICKET_UI_BUCKET;

const UI_PRIORITY_BY_BUCKET = Object.freeze({
  [UI_BUCKET.SCORING]: 1,
  [UI_BUCKET.PRESSURE]: 2,
  [UI_BUCKET.OPEN]: 4,
  [UI_BUCKET.DEAD]: 5,
});

const PAUSED_ROUTE_PATH = "/ad-xconfig";
const GRID_MIN_UNIQUE_LABELS = 4;
const GRID_MIN_ROWS_WITH_PLAYER_CELLS = 2;
const GRID_MIN_COVERAGE = 0;
const BASE_CRICKET_OBJECTIVE_COUNT = 7;

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

function isNodeVisible(node) {
  if (!node || typeof node !== "object") {
    return false;
  }
  if (node.isConnected === false) {
    return false;
  }

  if (typeof node.getClientRects === "function" && node.getClientRects().length === 0) {
    return false;
  }

  const ownerWindow = node.ownerDocument?.defaultView;
  if (ownerWindow && typeof ownerWindow.getComputedStyle === "function") {
    const style = ownerWindow.getComputedStyle(node);
    if (!style) {
      return false;
    }
    if (
      style.display === "none" ||
      style.visibility === "hidden" ||
      String(style.opacity || "1") === "0"
    ) {
      return false;
    }
  }

  return true;
}

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

function normalizeRoutePath(pathValue) {
  let normalized = String(pathValue || "").trim().toLowerCase();
  if (!normalized) {
    return "";
  }
  if (!normalized.startsWith("/")) {
    normalized = `/${normalized}`;
  }
  normalized = normalized.replace(/[?#].*$/, "").replace(/\/{2,}/g, "/");
  if (normalized.length > 1) {
    normalized = normalized.replace(/\/+$/, "");
  }
  return normalized;
}

function readVariantText(documentRef) {
  return String(documentRef?.getElementById?.("ad-ext-game-variant")?.textContent || "").trim();
}

function isXConfigRoute(windowRef, documentRef) {
  const routePath = normalizeRoutePath(
    windowRef?.location?.pathname ||
      documentRef?.defaultView?.location?.pathname ||
      ""
  );
  return routePath === PAUSED_ROUTE_PATH;
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

function parseTextMarkValue(value, cricketRules) {
  const rawValue = String(value || "").trim();
  if (!rawValue) {
    return null;
  }

  const hasExplicitMarkToken = (() => {
    if (/[/Xx\u2A02\u2297\u29BB|\u2715\u2716\u2573]/u.test(rawValue)) {
      return true;
    }
    if (/^(?:0|1|2|3)$/.test(rawValue)) {
      return true;
    }
    return /(^|[^0-9])(?:0|1|2|3)([^0-9]|$)/.test(rawValue);
  })();
  if (!hasExplicitMarkToken) {
    return null;
  }

  if (cricketRules && typeof cricketRules.parseCricketMarkValue === "function") {
    const parsed = cricketRules.parseCricketMarkValue(rawValue);
    return Number.isFinite(parsed) ? parsed : null;
  }

  const numeric = Number.parseInt(rawValue, 10);
  if (!Number.isFinite(numeric)) {
    return null;
  }
  return Math.max(0, Math.min(3, numeric));
}

function getNormalizedLabel(cricketRules, node) {
  if (!cricketRules || typeof cricketRules.normalizeCricketLabel !== "function") {
    return "";
  }
  return cricketRules.normalizeCricketLabel(node?.textContent || "");
}

function createLabelDiagnostics() {
  return {
    rawLabelCount: 0,
    rawUniqueLabelCount: 0,
    atomicLabelCount: 0,
    atomicUniqueLabelCount: 0,
    nestedLabelDropCount: 0,
    multiLabelContainerDropCount: 0,
  };
}

function cloneLabelDiagnostics(diagnostics) {
  const next = createLabelDiagnostics();
  if (!diagnostics || typeof diagnostics !== "object") {
    return next;
  }

  Object.keys(next).forEach((key) => {
    const value = Number(diagnostics[key]);
    next[key] = Number.isFinite(value) ? value : next[key];
  });

  return next;
}

function collectLabelNodes(rootNode, cricketRules, targetSet, diagnostics = null) {
  const seen = new Set();
  const labels = [];
  const pushLabelNode = (node) => {
    if (!node || seen.has(node)) {
      return;
    }
    if (isInsideTurnPreview(node)) {
      return;
    }
    const label = getNormalizedLabel(cricketRules, node);
    if (!label || !targetSet.has(label)) {
      return;
    }
    seen.add(node);
    labels.push({ node, label });
  };

  const scanSelectors = (selectors) => {
    selectors.forEach((selector) => {
      queryAll(rootNode, selector).forEach((node) => {
        pushLabelNode(node);
      });
    });
  };

  scanSelectors(LABEL_NODE_SELECTORS);

  if (diagnostics && typeof diagnostics === "object") {
    diagnostics.rawLabelCount = labels.length;
    diagnostics.rawUniqueLabelCount = new Set(labels.map((entry) => entry.label)).size;
  }

  let scopedLabels = labels;
  const uniqueLabelCount = new Set(labels.map((entry) => entry.label)).size;
  if (uniqueLabelCount >= BASE_CRICKET_OBJECTIVE_COUNT) {
    return filterAtomicLabelNodes(scopedLabels, diagnostics);
  }

  // Fallback scan is only needed when the fast selectors yield an incomplete set.
  queryAll(rootNode, LABEL_NODE_FALLBACK_SELECTOR).forEach((node) => {
    pushLabelNode(node);
  });

  if (diagnostics && typeof diagnostics === "object") {
    diagnostics.rawLabelCount = labels.length;
    diagnostics.rawUniqueLabelCount = new Set(labels.map((entry) => entry.label)).size;
  }

  scopedLabels = labels;
  return filterAtomicLabelNodes(scopedLabels, diagnostics);
}

function filterAtomicLabelNodes(labelEntries, diagnostics = null) {
  const entries = Array.isArray(labelEntries) ? labelEntries : [];
  if (!entries.length) {
    if (diagnostics && typeof diagnostics === "object") {
      diagnostics.atomicLabelCount = 0;
      diagnostics.atomicUniqueLabelCount = 0;
      diagnostics.nestedLabelDropCount = 0;
      diagnostics.multiLabelContainerDropCount = 0;
    }
    return [];
  }

  let nestedLabelDropCount = 0;
  let multiLabelContainerDropCount = 0;

  const filtered = entries.filter((entry) => {
    const node = entry?.node;
    const label = entry?.label;
    if (!node || !label || typeof node.contains !== "function") {
      return false;
    }

    let hasSameLabelDescendant = false;
    const descendantLabels = new Set();

    entries.forEach((candidate) => {
      if (!candidate || candidate === entry || !candidate.node) {
        return;
      }
      if (!node.contains(candidate.node)) {
        return;
      }
      descendantLabels.add(candidate.label);
      if (candidate.label === label) {
        hasSameLabelDescendant = true;
      }
    });

    if (hasSameLabelDescendant) {
      nestedLabelDropCount += 1;
      return false;
    }

    // Prevent large wrapper containers from being interpreted as a row label.
    if (descendantLabels.size > 1) {
      multiLabelContainerDropCount += 1;
      return false;
    }

    return true;
  });

  const resolved = filtered.length ? filtered : entries;
  if (diagnostics && typeof diagnostics === "object") {
    diagnostics.atomicLabelCount = resolved.length;
    diagnostics.atomicUniqueLabelCount = new Set(resolved.map((entry) => entry.label)).size;
    diagnostics.nestedLabelDropCount = nestedLabelDropCount;
    diagnostics.multiLabelContainerDropCount = multiLabelContainerDropCount;
  }

  return resolved;
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

function hasTextualMarkHints(node) {
  const text = String(node?.textContent || "").trim();
  if (!text) {
    return false;
  }

  // Support textual cricket marks rendered directly in the merged label cell.
  if (/[\u2A02\u2297\u29BB\u00D7\u2715\u2716\u2573Xx/|]/u.test(text)) {
    return true;
  }

  // Numeric mark tokens (1..3) must be standalone, not part of target labels like 13/20.
  return /(^|[^0-9])[1-3]([^0-9]|$)/.test(text);
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
  if (!node || typeof node.closest !== "function") {
    return false;
  }
  return Boolean(node.closest(TURN_PREVIEW_ROOT_SELECTOR));
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
  return true;
}

function getRootScore(rootNode, cricketRules, targetSet) {
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

  if (uniqueLabels.size < GRID_MIN_UNIQUE_LABELS) {
    return {
      score: 0,
      labels,
      diagnostics,
      rowsWithPlayerCells,
      coverage,
    };
  }
  if (rowsWithPlayerCells < GRID_MIN_ROWS_WITH_PLAYER_CELLS) {
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

  const visibleBonus = isNodeVisible(rootNode) ? 10 : 0;
  const score = uniqueLabels.size * 100 + labels.length + visibleBonus + rowsWithPlayerCells * 6;
  return { score, labels, diagnostics, rowsWithPlayerCells, coverage };
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
  if (cache?.grid?.root && cache.grid.root.isConnected !== false) {
    return cache.grid;
  }

  const nextGrid = findCricketGrid({
    documentRef,
    cricketRules,
    targetOrder,
  });
  if (cache && typeof cache === "object") {
    cache.grid = nextGrid;
  }
  return nextGrid;
}

function resolveBoardSnapshot(documentRef, cache = null) {
  if (cache?.board?.group && cache.board.group.isConnected !== false) {
    return cache.board;
  }

  const nextBoard = findBoardSvgGroup(documentRef);
  if (cache && typeof cache === "object") {
    cache.board = nextBoard;
  }
  return nextBoard;
}

function hasOwnMarkValue(node, options = {}) {
  if (!node) {
    return false;
  }
  const cricketRules = options.cricketRules;
  const allowTextMarkValue = options.allowTextMarkValue !== false;
  if (typeof node.getAttribute === "function" && node.getAttribute("data-marks") !== null) {
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

function parseMarksValue(node, cricketRules) {
  if (!node) {
    return 0;
  }

  const readMark = (value) => {
    const parsed = parseTextMarkValue(value, cricketRules);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const dataCandidates = [];
  if (typeof node.getAttribute === "function") {
    dataCandidates.push(
      node.getAttribute("data-marks"),
      node.getAttribute("data-mark"),
      node.getAttribute("data-hits"),
      node.getAttribute("data-hit"),
      node.getAttribute("aria-label"),
      node.getAttribute("title"),
      node.getAttribute("alt")
    );
  }
  for (const candidate of dataCandidates) {
    const parsed = readMark(candidate);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  if (typeof node.querySelectorAll === "function") {
    const icons = Array.from(
      node.querySelectorAll("img[alt], img[title], [data-marks], [data-mark], [aria-label], [title]")
    );
    if (icons.length > 0) {
      const best = icons
        .map((icon) => {
          return readMark(
            icon?.getAttribute?.("data-marks") ||
              icon?.getAttribute?.("data-mark") ||
              icon?.getAttribute?.("aria-label") ||
              icon?.getAttribute?.("title") ||
              icon?.getAttribute?.("alt") ||
              ""
          );
        })
        .find((value) => Number.isFinite(value));
      if (Number.isFinite(best)) {
        return best;
      }
      if (icons.length > 1) {
        return cricketRules?.clampMarks?.(icons.length) ?? Math.max(0, Math.min(3, icons.length));
      }
    }
  }

  const textValue = parseTextMarkValue(node.textContent, cricketRules);
  return Number.isFinite(textValue) ? textValue : 0;
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
    const label = getNormalizedLabel(cricketRules, node);
    return !label || !targetSet.has(label);
  }
  return false;
}

function getClassTokens(node) {
  if (!node || typeof node !== "object") {
    return [];
  }

  const listTokens =
    typeof node.classList?.toArray === "function"
      ? node.classList.toArray()
      : Array.isArray(node.classList)
        ? node.classList
        : null;
  if (Array.isArray(listTokens) && listTokens.length > 0) {
    return listTokens.filter(Boolean).map((entry) => String(entry).trim()).filter(Boolean);
  }

  const className = String(node.className || node.getAttribute?.("class") || "").trim();
  if (!className) {
    return [];
  }
  return className.split(/\s+/).filter(Boolean);
}

function hasPeerLikeSibling(node) {
  if (!node || typeof node !== "object") {
    return false;
  }

  const nodeTag = String(node.tagName || "").toUpperCase();
  const nodeClassTokens = new Set(getClassTokens(node));
  const siblings = [node.previousElementSibling, node.nextElementSibling].filter(Boolean);
  if (!siblings.length) {
    return false;
  }

  return siblings.some((sibling) => {
    if (!sibling) {
      return false;
    }
    const siblingTag = String(sibling.tagName || "").toUpperCase();
    if (nodeTag && siblingTag && siblingTag === nodeTag) {
      return true;
    }
    const siblingClassTokens = getClassTokens(sibling);
    if (!nodeClassTokens.size || !siblingClassTokens.length) {
      return false;
    }
    return siblingClassTokens.some((token) => nodeClassTokens.has(token));
  });
}

function hasAnyTargetDescendant(node, cricketRules, targetSet) {
  if (!node || typeof node.querySelectorAll !== "function") {
    return false;
  }

  const descendants = queryAll(node, "p, span, strong, b, td, th, [data-row-label], [data-target-label]");
  return descendants.some((candidate) => {
    const label = getNormalizedLabel(cricketRules, candidate);
    return Boolean(label && targetSet.has(label));
  });
}

function isLikelyStructuralPlayerCell(node, labelNode, cricketRules, targetSet) {
  if (!node || !labelNode || node === labelNode) {
    return false;
  }
  if (!isNodeVisible(node)) {
    return false;
  }
  if (node.parentElement !== labelNode.parentElement) {
    return false;
  }
  if (labelNode.tagName && node.tagName && labelNode.tagName !== node.tagName) {
    return false;
  }

  const siblingLabel = getNormalizedLabel(cricketRules, node);
  if (siblingLabel && targetSet.has(siblingLabel)) {
    return false;
  }
  if (hasAnyTargetDescendant(node, cricketRules, targetSet)) {
    return false;
  }

  const labelClasses = new Set(getClassTokens(labelNode));
  const nodeClasses = getClassTokens(node);
  const hasSharedClass = nodeClasses.some((entry) => labelClasses.has(entry));
  const hasGeneratedCssToken = nodeClasses.some((entry) => /^css-[a-z0-9_-]+$/i.test(entry));
  if (!hasSharedClass && !hasGeneratedCssToken) {
    return false;
  }

  const compactText = String(node.textContent || "").trim();
  if (compactText.length > 3 && !hasOwnMarkValue(node, { cricketRules, allowTextMarkValue: false })) {
    return false;
  }

  return true;
}

function collectSiblingPlayerCells(labelNode, cricketRules, targetSet) {
  const result = [];
  let cursor = labelNode?.nextElementSibling || null;

  while (cursor) {
    const siblingLabel = getNormalizedLabel(cricketRules, cursor);
    if (
      (siblingLabel && targetSet.has(siblingLabel)) ||
      (!siblingLabel && hasAnyTargetDescendant(cursor, cricketRules, targetSet))
    ) {
      break;
    }
    if (
      isLikelyPlayerCell(cursor, cricketRules, targetSet) ||
      isLikelyStructuralPlayerCell(cursor, labelNode, cricketRules, targetSet)
    ) {
      result.push(cursor);
    }
    cursor = cursor.nextElementSibling;
  }

  return result;
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
  const labels = new Set();
  if (!node || !cricketRules || typeof cricketRules.normalizeCricketLabel !== "function") {
    return labels;
  }

  const candidates = [node];
  queryAll(
    node,
    "[data-row-label], [data-target-label], .label-cell, .ad-ext-crfx-badge, .chakra-text, p, span, strong, b"
  ).forEach((candidate) => {
    if (!candidates.includes(candidate)) {
      candidates.push(candidate);
    }
  });

  candidates.forEach((candidate) => {
    const normalized = getNormalizedLabel(cricketRules, candidate);
    if (!normalized) {
      return;
    }
    if (targetSet instanceof Set && targetSet.size > 0 && !targetSet.has(normalized)) {
      return;
    }
    labels.add(normalized);
  });

  const normalizedFallback = cricketRules.normalizeCricketLabel(fallbackLabel || "");
  if (normalizedFallback) {
    labels.add(normalizedFallback);
  }
  return labels;
}

function resolveLabelCell(labelNode, cricketRules = null, targetSet = null, fallbackLabel = "") {
  if (!labelNode || typeof labelNode.closest !== "function") {
    return labelNode?.parentElement || null;
  }

  const tableCell = labelNode.closest("td, th, [role='cell']");
  if (tableCell) {
    return tableCell;
  }

  const normalizedLabel = cricketRules?.normalizeCricketLabel?.(
    fallbackLabel || labelNode?.getAttribute?.("data-row-label") || labelNode?.textContent || ""
  );

  let cursor = labelNode?.parentElement || null;
  let fallback = labelNode?.parentElement || labelNode;
  let depth = 0;

  while (cursor && depth < 8) {
    fallback = cursor;
    if (!isInsideTurnPreview(cursor)) {
      const parent = cursor.parentElement || null;
      const hasSiblings = Boolean(parent && parent.children && parent.children.length > 1);
      if (hasSiblings) {
        const hasCellPeer = hasPeerLikeSibling(cursor);
        if (!hasCellPeer && !hasExplicitMarkHints(cursor)) {
          cursor = cursor.parentElement;
          depth += 1;
          continue;
        }
        const labels = collectTargetLabelsInNode(
          cursor,
          cricketRules,
          targetSet,
          normalizedLabel
        );
        const containsOnlyOwnLabel =
          labels.size <= 1 ||
          (labels.size === 2 &&
            normalizedLabel &&
            labels.has(normalizedLabel));
        if (containsOnlyOwnLabel) {
          return cursor;
        }
      }
    }
    cursor = cursor.parentElement;
    depth += 1;
  }

  return fallback || labelNode;
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

  const normalizedLabel = getNormalizedLabel(cricketRules, badgeNode);
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
    getNormalizedLabel(cricketRules, labelNode) === label
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

function maybeIncludeLabelCellAsPlayerCell(
  playerCells,
  labelCell,
  expectedPlayerCount = 0,
  diagnostics = null
) {
  const normalizedCells = Array.isArray(playerCells)
    ? playerCells.filter((cell) => Boolean(cell))
    : [];
  const expectedCount = Number.isFinite(Number(expectedPlayerCount))
    ? Math.max(0, Math.round(Number(expectedPlayerCount)))
    : 0;
  const shortfallLikely = expectedCount > 0 && normalizedCells.length < expectedCount;
  const shortfallGap = expectedCount > 0 ? Math.max(0, expectedCount - normalizedCells.length) : 0;

  if (diagnostics && typeof diagnostics === "object") {
    diagnostics.playerCellCountBefore = normalizedCells.length;
    diagnostics.expectedPlayerCount = expectedCount;
    diagnostics.shortfallLikely = shortfallLikely;
    diagnostics.labelCellIncluded = false;
    diagnostics.shortfallRepairApplied = false;
    diagnostics.labelCellHasExplicitMarkHints = false;
  }

  if (!labelCell || normalizedCells.includes(labelCell)) {
    return normalizedCells;
  }

  const hasExplicitHints = hasExplicitMarkHints(labelCell);
  const hasTextHints = hasTextualMarkHints(labelCell);
  const labelParent = labelCell?.parentElement || null;
  const mergedShortfallOwnerFallback =
    shortfallGap === 1 &&
    normalizedCells.length > 0 &&
    Boolean(labelParent) &&
    typeof labelCell?.closest === "function" &&
    !labelCell.closest("tr") &&
    normalizedCells.every((cellNode) => cellNode?.parentElement === labelParent);
  const hasHints = hasExplicitHints || hasTextHints || mergedShortfallOwnerFallback;
  if (diagnostics && typeof diagnostics === "object") {
    diagnostics.labelCellHasExplicitMarkHints = hasExplicitHints;
    diagnostics.labelCellHasTextMarkHints = hasTextHints;
    diagnostics.labelCellMergedShortfallFallback = mergedShortfallOwnerFallback;
  }
  if (!hasHints) {
    return normalizedCells;
  }

  const shouldInclude =
    expectedCount > 0 ? normalizedCells.length < expectedCount : normalizedCells.length === 0;
  if (!shouldInclude) {
    return normalizedCells;
  }

  if (diagnostics && typeof diagnostics === "object") {
    diagnostics.labelCellIncluded = true;
    diagnostics.shortfallRepairApplied = shortfallLikely;
  }

  return [labelCell, ...normalizedCells];
}

function readCellPlayerIndex(cellNode) {
  if (!cellNode || typeof cellNode.getAttribute !== "function") {
    return null;
  }

  const candidates = [
    cellNode.getAttribute("data-player-index"),
    cellNode.getAttribute("data-column-index"),
    cellNode.getAttribute("data-player"),
  ];

  for (const candidate of candidates) {
    const numeric = Number.parseInt(String(candidate || "").trim(), 10);
    if (Number.isFinite(numeric) && numeric >= 0) {
      return numeric;
    }
  }

  return null;
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

function resolveStableRowLabelNode(rowMeta, cricketRules, label) {
  const candidates = [
    rowMeta?.labelNode || null,
    rowMeta?.badgeNode || null,
    rowMeta?.labelCell || null,
  ];

  return (
    candidates.find((node) => {
      if (!node || node.isConnected === false) {
        return false;
      }
      const normalized = getNormalizedLabel(cricketRules, node);
      return !normalized || normalized === label;
    }) || null
  );
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
  const candidate = canTrustDomActive
    ? domActiveIndex
    : Number.isFinite(stateIndex)
      ? stateIndex
      : domActiveIndex;

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

  const rawMode =
    typeof gameState?.getCricketScoringMode === "function"
      ? String(gameState.getCricketScoringMode() || "").trim()
      : typeof gameState?.getCricketMode === "function"
        ? String(gameState.getCricketMode() || "").trim()
        : "";

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

function shouldApplyActiveThrowPreview(options = {}) {
  const gameState = options.gameState;
  const cricketRules = options.cricketRules;
  const targetOrder = options.targetOrder;
  const activeThrows = Array.isArray(options.activeThrows) ? options.activeThrows : [];
  const activePlayerIndex = Number.isFinite(Number(options.activePlayerIndex))
    ? Math.max(0, Math.round(Number(options.activePlayerIndex)))
    : 0;
  const snapshotMatch = options.snapshotMatch || null;

  const debug = {
    throwCount: activeThrows.length,
    applied: false,
    suppressionReason: "",
    activeTurnFinished: false,
    matchedFinishedTurn: false,
    activeThrowsSignature: toThrowSignatureParts(activeThrows, cricketRules, targetOrder).join(","),
    activeTurnSignature: "",
  };

  if (!activeThrows.length) {
    debug.suppressionReason = "no-active-throws";
    return debug;
  }

  const activeTurn =
    gameState && typeof gameState.getActiveTurn === "function"
      ? gameState.getActiveTurn()
      : null;

  if (activeTurn && typeof activeTurn === "object") {
    debug.activeTurnSignature = toThrowSignatureParts(
      Array.isArray(activeTurn.throws) ? activeTurn.throws : [],
      cricketRules,
      targetOrder
    ).join(",");
    debug.activeTurnFinished = Boolean(String(activeTurn.finishedAt || "").trim());
  }

  if (debug.activeTurnFinished) {
    debug.suppressionReason = "active-turn-finished";
    return debug;
  }

  if (snapshotMatch && Array.isArray(snapshotMatch.turns)) {
    const activePlayerId = getPlayerIdByIndex(snapshotMatch, activePlayerIndex);
    const turns = snapshotMatch.turns.filter((turn) => turn && typeof turn === "object");
    const unfinishedTurnsForActivePlayer = turns.filter((turn) => {
      return (
        String(turn.playerId || "").trim() === activePlayerId &&
        !String(turn.finishedAt || "").trim()
      );
    });

    if (activePlayerId && unfinishedTurnsForActivePlayer.length === 0) {
      const finishedTurnsForActivePlayer = turns.filter((turn) => {
        return (
          String(turn.playerId || "").trim() === activePlayerId &&
          String(turn.finishedAt || "").trim() &&
          Array.isArray(turn.throws) &&
          turn.throws.length > 0
        );
      });

      const newestFinishedTurn = selectNewestTurnCandidate(finishedTurnsForActivePlayer);
      if (
        newestFinishedTurn &&
        haveEquivalentThrowSignatures(
          newestFinishedTurn.throws,
          activeThrows,
          cricketRules,
          targetOrder
        )
      ) {
        debug.matchedFinishedTurn = true;
        debug.suppressionReason = "matches-last-finished-turn";
        return debug;
      }
    }
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
  if (!(labelDiagnostics.atomicLabelCount > 0)) {
    labelDiagnostics.atomicLabelCount = grid.labels.length;
  }
  if (!(labelDiagnostics.atomicUniqueLabelCount > 0)) {
    labelDiagnostics.atomicUniqueLabelCount = new Set(grid.labels.map((entry) => entry.label)).size;
  }
  const marksByLabel = cricketRules.createEmptyMarksByLabel(targetOrder, 0);
  let maxPlayerCount = 0;
  const snapshot = typeof gameState?.getSnapshot === "function" ? gameState.getSnapshot() : null;
  const playerCountFromMatch = Array.isArray(snapshot?.match?.players) ? snapshot.match.players.length : 0;
  const playerCountFromDom = resolveVisiblePlayerCount(documentRef);
  const expectedPlayerCount =
    playerCountFromMatch > 0 ? playerCountFromMatch : playerCountFromDom;
  const cachedStableRows =
    options.cache?.gridStableRowsByLabel instanceof Map ? options.cache.gridStableRowsByLabel : null;
  const rowMetaByLabel = new Map();
  const labelCellMarkSourceLabels = [];
  const labelCellMarkSourceSet = new Set();
  const shortfallRepairLabels = [];
  const shortfallRepairSet = new Set();
  let hasIndexedPlayerColumns = false;
  const recoveredStableLabels = [];

  const applyRowMetaForLabel = (label, node, fallbackRowMeta = null) => {
    if (!targetSet.has(label) || rowMetaByLabel.has(label) || !node || node.isConnected === false) {
      return;
    }
    if (isInsideTurnPreview(node)) {
      return;
    }

    const labelCell = resolveLabelCell(node, cricketRules, targetSet, label) || fallbackRowMeta?.labelCell || null;
    const discoveredPlayerCells = collectPlayerCellsForLabel(node, cricketRules, targetSet).filter(Boolean);
    const fallbackPlayerCells = Array.isArray(fallbackRowMeta?.playerCells)
      ? fallbackRowMeta.playerCells.filter((cell) => cell && cell.isConnected !== false)
      : [];
    const playerCells = discoveredPlayerCells.length > 0 ? discoveredPlayerCells : fallbackPlayerCells;
    const badgeNode =
      resolveBadgeNode(node, labelCell, cricketRules, label) ||
      (fallbackRowMeta?.badgeNode?.isConnected === false ? null : fallbackRowMeta?.badgeNode || null);

    const markSourceMeta = {};
    const markSourceCells = maybeIncludeLabelCellAsPlayerCell(
      playerCells,
      labelCell,
      expectedPlayerCount,
      markSourceMeta
    );
    const hasConcreteLabelMarkHints =
      Boolean(markSourceMeta.labelCellHasExplicitMarkHints) ||
      Boolean(markSourceMeta.labelCellHasTextMarkHints);
    if (
      markSourceMeta.labelCellIncluded &&
      hasConcreteLabelMarkHints &&
      !labelCellMarkSourceSet.has(label)
    ) {
      labelCellMarkSourceSet.add(label);
      labelCellMarkSourceLabels.push(label);
    }
    if (
      markSourceMeta.shortfallRepairApplied &&
      hasConcreteLabelMarkHints &&
      !shortfallRepairSet.has(label)
    ) {
      shortfallRepairSet.add(label);
      shortfallRepairLabels.push(label);
    }

    const parsedCells = markSourceCells.map((cell) => {
      const marks = cricketRules.clampMarks(parseMarksValue(cell, cricketRules));
      const explicitPlayerIndex = readCellPlayerIndex(cell);
      return {
        cellNode: cell,
        marks,
        explicitPlayerIndex: Number.isFinite(explicitPlayerIndex)
          ? Math.round(explicitPlayerIndex)
          : null,
      };
    });
    const rowNode = getRowNode(node) || fallbackRowMeta?.rowNode || null;
    if (!parsedCells.length) {
      rowMetaByLabel.set(label, {
        label,
        labelNode: node,
        labelCell,
        badgeNode,
        rowNode,
        playerCells,
        playerCellsByIndex: [],
      });
      return;
    }

    const expectedRowLength = Math.max(expectedPlayerCount, parsedCells.length);
    const shortfallOffset =
      parsedCells.length < expectedRowLength
        ? Math.max(0, expectedRowLength - parsedCells.length)
        : 0;
    const explicitPlayerIndexes = parsedCells
      .map((entry) => entry.explicitPlayerIndex)
      .filter((value) => Number.isFinite(value));
    const explicitCoverageComplete =
      explicitPlayerIndexes.length === parsedCells.length && parsedCells.length > 0;
    const explicitUnique = new Set(explicitPlayerIndexes).size === explicitPlayerIndexes.length;
    const explicitInBounds = explicitPlayerIndexes.every((value) => {
      return value >= 0 && value < expectedRowLength;
    });
    const explicitRespectsShortfall =
      parsedCells.length >= expectedRowLength ||
      explicitPlayerIndexes.every((value) => value >= shortfallOffset);
    const useExplicitPlayerIndexes =
      explicitCoverageComplete &&
      explicitUnique &&
      explicitInBounds &&
      explicitRespectsShortfall;

    if (useExplicitPlayerIndexes) {
      hasIndexedPlayerColumns = true;
    }

    const maxExplicitColumn = useExplicitPlayerIndexes
      ? explicitPlayerIndexes.reduce((max, value) => {
        return value > max ? value : max;
      }, -1)
      : -1;
    const marksByPlayer = Array.from(
      {
        length: Math.max(expectedRowLength, maxExplicitColumn + 1, 1),
      },
      () => 0
    );
    const playerCellsByIndex = Array.from({ length: marksByPlayer.length }, () => null);
    const occupiedColumns = new Set();
    let cursor = shortfallOffset;

    parsedCells.forEach((entry) => {
      let targetIndex =
        useExplicitPlayerIndexes && Number.isFinite(entry.explicitPlayerIndex)
          ? entry.explicitPlayerIndex
          : null;

      if (!Number.isFinite(targetIndex)) {
        while (occupiedColumns.has(cursor) && cursor < marksByPlayer.length) {
          cursor += 1;
        }
        if (cursor >= marksByPlayer.length) {
          marksByPlayer.push(0);
        }
        targetIndex = Math.max(0, Math.min(cursor, marksByPlayer.length - 1));
        cursor = targetIndex + 1;
      } else if (targetIndex >= marksByPlayer.length) {
        while (marksByPlayer.length <= targetIndex) {
          marksByPlayer.push(0);
        }
      }

      marksByPlayer[targetIndex] = cricketRules.clampMarks(entry.marks);
      if (entry.cellNode && entry.cellNode.isConnected !== false) {
        playerCellsByIndex[targetIndex] = entry.cellNode;
      }
      occupiedColumns.add(targetIndex);
    });

    rowMetaByLabel.set(label, {
      label,
      labelNode: node,
      labelCell,
      badgeNode,
      rowNode,
      playerCells,
      playerCellsByIndex,
    });

    marksByLabel[label] = marksByPlayer.map((value) => cricketRules.clampMarks(value));
    maxPlayerCount = Math.max(maxPlayerCount, marksByLabel[label].length);
  };

  grid.labels.forEach(({ node, label }) => {
    applyRowMetaForLabel(label, node);
  });

  if (cachedStableRows) {
    targetOrder.forEach((label) => {
      if (rowMetaByLabel.has(label)) {
        return;
      }
      const fallbackRowMeta = cachedStableRows.get(label);
      const stableLabelNode = resolveStableRowLabelNode(fallbackRowMeta, cricketRules, label);
      if (!stableLabelNode) {
        return;
      }
      applyRowMetaForLabel(label, stableLabelNode, fallbackRowMeta);
      if (rowMetaByLabel.has(label)) {
        recoveredStableLabels.push(label);
      }
    });
  }

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
      ...(activeThrowPreview?.debug || {}),
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

function buildPipelineSignature(extracted, stateMap) {
  const baseParts = [
    extracted?.surfaceStatus || "",
    extracted?.gameModeNormalized || "",
    extracted?.scoringModeNormalized || "",
    Number(extracted?.activePlayerIndex) || 0,
  ];
  if (!(stateMap instanceof Map) || stateMap.size === 0) {
    return baseParts.join("::");
  }

  const entries = [];
  stateMap.forEach((entry, label) => {
    entries.push(
      `${label}:${entry?.boardPresentation || entry?.presentation || "open"}:${entry?.uiBucket || ""}:${entry?.isHighlightActive ? "1" : "0"}:${(entry?.marksByPlayer || []).join(",")}`
    );
  });
  entries.sort();
  return [...baseParts, entries.join("|")].join("::");
}

function buildTurnToken(gameState, activePlayerIndex = 0) {
  const throws =
    gameState && typeof gameState.getActiveThrows === "function"
      ? gameState.getActiveThrows()
      : [];
  const throwCount = Array.isArray(throws) ? throws.length : 0;

  const turn =
    gameState && typeof gameState.getActiveTurn === "function"
      ? gameState.getActiveTurn()
      : null;

  if (turn && typeof turn === "object") {
    const round = Number.isFinite(turn.round) ? turn.round : "";
    const part = Number.isFinite(turn.turn) ? turn.turn : "";
    return `${turn.id || ""}|${turn.playerId || ""}|${round}|${part}|${turn.createdAt || ""}|${throwCount}`;
  }

  return `fallback:${Number.isFinite(activePlayerIndex) ? activePlayerIndex : 0}:${throwCount}`;
}

function enrichStateMapForUi(stateMap) {
  if (!(stateMap instanceof Map) || stateMap.size === 0) {
    return new Map();
  }

  const enriched = new Map();
  stateMap.forEach((entry, label) => {
    const uiBucket = resolveCricketUiBucket(entry);
    const uiPriority = Number(UI_PRIORITY_BY_BUCKET[uiBucket] || UI_PRIORITY_BY_BUCKET.open || 4);
    const closedByPlayer = Boolean(entry?.closed || entry?.own);
    const openByOpponent = Number(entry?.openOpponentCount || 0) > 0;
    const dead = Boolean(entry?.dead);
    const scorable = Boolean(entry?.scorable || entry?.scorableForPlayer);
    const isHighlightActive = resolveCricketHighlightActive(uiBucket);

    enriched.set(label, {
      ...entry,
      closedByPlayer,
      openByOpponent,
      scorable,
      dead,
      pressureLevel: uiBucket === UI_BUCKET.PRESSURE ? "pressure" : "none",
      uiBucket,
      uiPriority,
      isHighlightActive,
    });
  });

  return enriched;
}

export function deriveTargetStates(renderState = null) {
  const sourceStateMap = renderState?.stateMap instanceof Map ? renderState.stateMap : new Map();
  const derived = {
    stateMap: sourceStateMap,
    openTargets: [],
    deadTargets: [],
    scoringTargets: [],
    scorableTargets: [],
    offenseTargets: [],
    pressureTargets: [],
    scoringBucketTargets: [],
    scorableBucketTargets: [],
    offenseBucketTargets: [],
    pressureBucketTargets: [],
    openBucketTargets: [],
    deadBucketTargets: [],
    activeHighlightTargets: [],
  };

  sourceStateMap.forEach((entry, label) => {
    const presentation = normalizeCricketPresentationToken(
      entry?.boardPresentation || entry?.presentation || "open"
    );

    if (presentation === "open") {
      derived.openTargets.push(label);
    }
    if (presentation === "dead") {
      derived.deadTargets.push(label);
    }
    if (presentation === "scoring" || presentation === "offense" || entry?.scoring) {
      derived.scoringTargets.push(label);
    }
    if (entry?.scorable) {
      derived.scorableTargets.push(label);
    }
    if (presentation === "scoring" || presentation === "offense" || entry?.offense) {
      derived.offenseTargets.push(label);
    }
    if (presentation === "pressure" || entry?.pressure) {
      derived.pressureTargets.push(label);
    }

    const uiBucket = String(entry?.uiBucket || "").toLowerCase();
    if (uiBucket === UI_BUCKET.SCORING) {
      derived.scoringBucketTargets.push(label);
      derived.scorableBucketTargets.push(label);
      derived.offenseBucketTargets.push(label);
    } else if (uiBucket === UI_BUCKET.PRESSURE) {
      derived.pressureBucketTargets.push(label);
    } else if (uiBucket === UI_BUCKET.OPEN) {
      derived.openBucketTargets.push(label);
    } else if (uiBucket === UI_BUCKET.DEAD) {
      derived.deadBucketTargets.push(label);
    }

    if (entry?.isHighlightActive) {
      derived.activeHighlightTargets.push(label);
    }
  });

  return derived;
}

export function extractScoreboardState(options = {}) {
  const documentRef = options.documentRef;
  const windowRef = options.windowRef || documentRef?.defaultView || null;
  const gameState = options.gameState;
  const variantRules = options.variantRules;
  const enforceVariantGuard = options.enforceVariantGuard === true;
  const variantText = readVariantText(documentRef);

  if (!documentRef || !options.cricketRules) {
    return {
      surfaceStatus: CRICKET_SURFACE_STATUS.MISSING_GRID,
      variantText,
      pipelineSignature: `${CRICKET_SURFACE_STATUS.MISSING_GRID}::invalid-context`,
      transitionSignature: `${CRICKET_SURFACE_STATUS.MISSING_GRID}::invalid-context`,
    };
  }

  if (isXConfigRoute(windowRef, documentRef)) {
    return {
      surfaceStatus: CRICKET_SURFACE_STATUS.PAUSED_ROUTE,
      variantText,
      pipelineSignature: `${CRICKET_SURFACE_STATUS.PAUSED_ROUTE}::${variantText || "-"}`,
      transitionSignature: `${CRICKET_SURFACE_STATUS.PAUSED_ROUTE}::${variantText || "-"}`,
    };
  }

  if (enforceVariantGuard && !isCricketFamilyActive(gameState, documentRef, variantRules)) {
    return {
      surfaceStatus: CRICKET_SURFACE_STATUS.INACTIVE_VARIANT,
      variantText,
      pipelineSignature: `${CRICKET_SURFACE_STATUS.INACTIVE_VARIANT}::${variantText || "-"}`,
      transitionSignature: `${CRICKET_SURFACE_STATUS.INACTIVE_VARIANT}::${variantText || "-"}`,
    };
  }

  const extracted = buildMarksByLabelSnapshot(options);
  if (!extracted) {
    return {
      surfaceStatus: CRICKET_SURFACE_STATUS.MISSING_GRID,
      variantText,
      pipelineSignature: `${CRICKET_SURFACE_STATUS.MISSING_GRID}::${variantText || "-"}`,
      transitionSignature: `${CRICKET_SURFACE_STATUS.MISSING_GRID}::${variantText || "-"}`,
    };
  }

  const boardSnapshot = extracted.boardSnapshot;
  const hasBoard = Boolean(boardSnapshot?.group && Number(boardSnapshot?.radius) > 0);
  const surfaceStatus = hasBoard
    ? CRICKET_SURFACE_STATUS.READY
    : CRICKET_SURFACE_STATUS.MISSING_BOARD;

  return {
    ...extracted,
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
