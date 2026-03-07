import {
  clearNodeChildren,
  ensureOverlayGroup,
  findBoardSvgGroup,
} from "../../shared/dartboard-svg.js";
import { OVERLAY_ID, SVG_NS, TARGET_CLASS } from "./style.js";

const SEGMENT_ORDER = Object.freeze([
  20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5,
]);

const RING_RATIOS = Object.freeze({
  outerBullInner: 0.031112,
  outerBullOuter: 0.075556,
  tripleInner: 0.431112,
  tripleOuter: 0.475556,
  doubleInner: 0.711112,
  doubleOuter: 0.755556,
});

const GRID_ROOT_SELECTORS = Object.freeze([
  "#grid",
  ".ad-ext-cricket-grid",
  ".ad-ext-crfx-root",
  ".chakra-grid",
  "table",
  "tbody",
]);

const LABEL_NODE_SELECTORS = Object.freeze([
  ".label-cell",
  ".ad-ext-cricket-label",
  ".ad-ext-crfx-badge",
  "[data-row-label]",
  "[data-target-label]",
]);

const PLAYER_CELL_SELECTORS = Object.freeze([
  ".player-cell",
  "[data-player-index]",
  "[data-marks]",
  ".ad-ext-cricket-mark",
]);

const PRESENTATION_KEYS = new Set(["offense", "danger", "pressure", "closed", "dead"]);

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

function getNormalizedLabel(cricketRules, node) {
  if (!cricketRules || typeof cricketRules.normalizeCricketLabel !== "function") {
    return "";
  }
  return cricketRules.normalizeCricketLabel(node?.textContent || "");
}

function collectLabelNodes(rootNode, cricketRules, targetSet) {
  const seen = new Set();
  const labels = [];

  LABEL_NODE_SELECTORS.forEach((selector) => {
    queryAll(rootNode, selector).forEach((node) => {
      if (!node || seen.has(node)) {
        return;
      }
      const label = getNormalizedLabel(cricketRules, node);
      if (!label || !targetSet.has(label)) {
        return;
      }
      seen.add(node);
      labels.push({ node, label });
    });
  });

  if (labels.length >= 4) {
    return labels;
  }

  queryAll(rootNode, "div, td, th, span, p").forEach((node) => {
    if (!node || seen.has(node)) {
      return;
    }
    const label = getNormalizedLabel(cricketRules, node);
    if (!label || !targetSet.has(label)) {
      return;
    }
    seen.add(node);
    labels.push({ node, label });
  });

  return labels;
}

function getRootScore(rootNode, cricketRules, targetSet) {
  const labels = collectLabelNodes(rootNode, cricketRules, targetSet);
  if (!labels.length) {
    return { score: 0, labels: [] };
  }

  const uniqueLabels = new Set(labels.map((entry) => entry.label));
  const visibleBonus = isNodeVisible(rootNode) ? 10 : 0;
  const score = uniqueLabels.size * 100 + labels.length + visibleBonus;
  return { score, labels };
}

function findBestGridRoot(documentRef, cricketRules, targetOrder) {
  if (!documentRef) {
    return null;
  }
  const targetSet = new Set(Array.isArray(targetOrder) ? targetOrder : []);
  let bestRoot = null;
  let bestScore = 0;
  let bestLabels = [];

  GRID_ROOT_SELECTORS.forEach((selector) => {
    queryAll(documentRef, selector).forEach((candidate) => {
      const snapshot = getRootScore(candidate, cricketRules, targetSet);
      if (snapshot.score > bestScore) {
        bestRoot = candidate;
        bestScore = snapshot.score;
        bestLabels = snapshot.labels;
      }
    });
  });

  if (!bestRoot) {
    const fallback = documentRef.body || documentRef.documentElement || documentRef;
    const snapshot = getRootScore(fallback, cricketRules, targetSet);
    if (snapshot.score > 0) {
      bestRoot = fallback;
      bestLabels = snapshot.labels;
    }
  }

  if (!bestRoot) {
    return null;
  }

  return {
    root: bestRoot,
    labels: bestLabels,
  };
}

function hasOwnMarkValue(node) {
  if (!node) {
    return false;
  }
  if (typeof node.getAttribute === "function" && node.getAttribute("data-marks") !== null) {
    return true;
  }
  if (typeof node.querySelectorAll === "function") {
    const markImages = node.querySelectorAll("img[alt]");
    if (markImages.length > 0) {
      return true;
    }
  }
  const numeric = Number.parseInt(String(node.textContent || "").trim(), 10);
  return Number.isFinite(numeric);
}

function parseMarksValue(node) {
  if (!node) {
    return 0;
  }

  const rawDataMarks =
    typeof node.getAttribute === "function" ? node.getAttribute("data-marks") : null;
  const dataMarksValue = Number.parseInt(String(rawDataMarks || "").trim(), 10);
  if (Number.isFinite(dataMarksValue)) {
    return dataMarksValue;
  }

  if (typeof node.querySelectorAll === "function") {
    const icons = Array.from(node.querySelectorAll("img[alt]"));
    if (icons.length > 0) {
      const altValue = Number.parseInt(String(icons[0]?.getAttribute?.("alt") || "").trim(), 10);
      if (Number.isFinite(altValue)) {
        return altValue;
      }
      return icons.length;
    }
  }

  const textValue = Number.parseInt(String(node.textContent || "").trim(), 10);
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
  if (hasOwnMarkValue(node)) {
    const label = getNormalizedLabel(cricketRules, node);
    return !label || !targetSet.has(label);
  }
  return false;
}

function collectSiblingPlayerCells(labelNode, cricketRules, targetSet) {
  const result = [];
  let cursor = labelNode?.nextElementSibling || null;

  while (cursor) {
    const siblingLabel = getNormalizedLabel(cricketRules, cursor);
    if (siblingLabel && targetSet.has(siblingLabel)) {
      break;
    }
    if (isLikelyPlayerCell(cursor, cricketRules, targetSet)) {
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

  const directRow = labelNode.closest?.("tr");
  if (directRow) {
    return queryAll(directRow, "td, .player-cell, [data-player-index], [data-marks]").filter((node) => {
      return node !== labelNode;
    });
  }

  const parent = labelNode.parentElement;
  if (parent) {
    const nestedCells = PLAYER_CELL_SELECTORS.flatMap((selector) => queryAll(parent, selector)).filter((node) => {
      return node !== labelNode;
    });
    if (nestedCells.length > 0) {
      return nestedCells;
    }
  }

  return collectSiblingPlayerCells(labelNode, cricketRules, targetSet);
}

function resolveActivePlayerIndex(gameState, documentRef, playerCount) {
  const fallbackIndex = Number.isFinite(gameState?.getActivePlayerIndex?.())
    ? Number(gameState.getActivePlayerIndex())
    : 0;

  const activePlayerNodes = queryAll(documentRef, ".ad-ext-player");
  const visiblePlayerNodes = activePlayerNodes.filter((node) => isNodeVisible(node));
  const domActiveIndex = visiblePlayerNodes.findIndex((node) => {
    return Boolean(node.classList?.contains("ad-ext-player-active"));
  });

  const candidate = domActiveIndex >= 0 ? domActiveIndex : fallbackIndex;
  if (!Number.isFinite(candidate) || playerCount <= 0) {
    return 0;
  }
  return Math.max(0, Math.min(Math.round(candidate), playerCount - 1));
}

function resolveGameModeNormalized(gameState, variantRules, documentRef) {
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

  const variantText = String(documentRef?.getElementById?.("ad-ext-game-variant")?.textContent || "");
  if (variantRules && typeof variantRules.classifyCricketGameMode === "function") {
    const classifiedVariant = variantRules.classifyCricketGameMode(variantText);
    if (classifiedVariant === "cricket" || classifiedVariant === "tactics") {
      return classifiedVariant;
    }
  }

  return "cricket";
}

function buildMarksByLabelSnapshot(options = {}) {
  const documentRef = options.documentRef;
  const cricketRules = options.cricketRules;
  const gameState = options.gameState;
  const variantRules = options.variantRules;
  const visualConfig = options.visualConfig;

  if (!documentRef || !cricketRules) {
    return null;
  }

  const gameModeNormalized = resolveGameModeNormalized(gameState, variantRules, documentRef);
  const targetOrder = cricketRules.getTargetOrderByGameMode(gameModeNormalized);
  const targetSet = new Set(targetOrder);
  const grid = findBestGridRoot(documentRef, cricketRules, targetOrder);
  if (!grid) {
    return null;
  }

  const marksByLabel = cricketRules.createEmptyMarksByLabel(targetOrder, 0);
  let maxPlayerCount = 0;

  grid.labels.forEach(({ node, label }) => {
    const playerCells = collectPlayerCellsForLabel(node, cricketRules, targetSet);
    const marks = [];
    if (hasOwnMarkValue(node)) {
      marks.push(parseMarksValue(node));
    }
    playerCells.forEach((cell) => {
      marks.push(parseMarksValue(cell));
    });
    if (!marks.length) {
      return;
    }
    marksByLabel[label] = marks.map((value) => cricketRules.clampMarks(value));
    maxPlayerCount = Math.max(maxPlayerCount, marks.length);
  });

  const playerCountFromMatch = Array.isArray(gameState?.getSnapshot?.()?.match?.players)
    ? gameState.getSnapshot().match.players.length
    : 0;
  const playerCount = Math.max(maxPlayerCount, playerCountFromMatch, 1);

  targetOrder.forEach((label) => {
    if (!Array.isArray(marksByLabel[label])) {
      marksByLabel[label] = [];
    }
    while (marksByLabel[label].length < playerCount) {
      marksByLabel[label].push(0);
    }
  });

  const activePlayerIndex = resolveActivePlayerIndex(gameState, documentRef, playerCount);
  const activeThrows = Array.isArray(gameState?.getActiveThrows?.()) ? gameState.getActiveThrows() : [];
  const enrichedMarksByLabel = cricketRules.applyThrowsToMarksByLabel({
    targetOrder,
    playerIndex: activePlayerIndex,
    baseMarksByLabel: marksByLabel,
    throws: activeThrows,
  });

  const stateMap = cricketRules.computeTargetStates(enrichedMarksByLabel, {
    gameMode: gameModeNormalized,
    activePlayerIndex,
    showDeadTargets: visualConfig.showDeadTargets,
    supportsTacticalHighlights: true,
  });

  return {
    gameModeNormalized,
    targetOrder,
    activePlayerIndex,
    marksByLabel: enrichedMarksByLabel,
    stateMap,
  };
}

function polar(radius, angleDeg) {
  const radians = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: Number((radius * Math.cos(radians)).toFixed(4)),
    y: Number((radius * Math.sin(radians)).toFixed(4)),
  };
}

function wedgePath(innerRadius, outerRadius, startDeg, endDeg) {
  const p0 = polar(outerRadius, startDeg);
  const p1 = polar(outerRadius, endDeg);
  const p2 = polar(innerRadius, endDeg);
  const p3 = polar(innerRadius, startDeg);
  const largeArc = (endDeg - startDeg + 360) % 360 > 180 ? 1 : 0;
  return [
    `M ${p0.x} ${p0.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${p1.x} ${p1.y}`,
    `L ${p2.x} ${p2.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${p3.x} ${p3.y}`,
    "Z",
  ].join(" ");
}

function ringPath(innerRadius, outerRadius) {
  const outer = [
    `M 0 ${-outerRadius}`,
    `A ${outerRadius} ${outerRadius} 0 1 1 0 ${outerRadius}`,
    `A ${outerRadius} ${outerRadius} 0 1 1 0 ${-outerRadius}`,
    "Z",
  ].join(" ");
  const inner = [
    `M 0 ${-innerRadius}`,
    `A ${innerRadius} ${innerRadius} 0 1 0 0 ${innerRadius}`,
    `A ${innerRadius} ${innerRadius} 0 1 0 0 ${-innerRadius}`,
    "Z",
  ].join(" ");
  return `${outer} ${inner}`;
}

function segmentAngles(value) {
  const index = SEGMENT_ORDER.indexOf(Number(value));
  if (index < 0) {
    return null;
  }
  const center = index * 18;
  return {
    start: center - 9,
    end: center + 9,
  };
}

function createWedge(ownerDocument, radius, innerRatio, outerRatio, angles, edgePaddingPx) {
  const path = ownerDocument.createElementNS(SVG_NS, "path");
  const innerRadius = Math.max(0, radius * innerRatio);
  const outerRadius = Math.max(innerRadius + 0.5, radius * outerRatio + edgePaddingPx);
  path.setAttribute("d", wedgePath(innerRadius, outerRadius, angles.start, angles.end));
  return path;
}

function createBull(ownerDocument, radius, innerRatio, outerRatio, solid, edgePaddingPx) {
  if (solid) {
    const circle = ownerDocument.createElementNS(SVG_NS, "circle");
    circle.setAttribute("r", String(Math.max(0, radius * outerRatio + edgePaddingPx)));
    return circle;
  }

  const innerRadius = Math.max(0, radius * innerRatio);
  const outerRadius = Math.max(innerRadius + 0.5, radius * outerRatio + edgePaddingPx);
  const ring = ownerDocument.createElementNS(SVG_NS, "path");
  ring.setAttribute("d", ringPath(innerRadius, outerRadius));
  ring.setAttribute("fill-rule", "evenodd");
  return ring;
}

function buildShapesForLabel(ownerDocument, radius, targetLabel, visualConfig) {
  if (!ownerDocument || !radius) {
    return [];
  }

  if (String(targetLabel).toUpperCase() === "BULL") {
    return [
      createBull(
        ownerDocument,
        radius,
        RING_RATIOS.outerBullInner,
        RING_RATIOS.outerBullOuter,
        false,
        visualConfig.edgePaddingPx
      ),
      createBull(
        ownerDocument,
        radius,
        0,
        RING_RATIOS.outerBullInner,
        true,
        visualConfig.edgePaddingPx
      ),
    ];
  }

  const numericLabel = Number.parseInt(String(targetLabel || ""), 10);
  if (!(numericLabel >= 1 && numericLabel <= 20)) {
    return [];
  }

  const angles = segmentAngles(numericLabel);
  if (!angles) {
    return [];
  }

  return [
    createWedge(
      ownerDocument,
      radius,
      RING_RATIOS.tripleInner,
      RING_RATIOS.tripleOuter,
      angles,
      visualConfig.edgePaddingPx
    ),
    createWedge(
      ownerDocument,
      radius,
      RING_RATIOS.doubleInner,
      RING_RATIOS.doubleOuter,
      angles,
      visualConfig.edgePaddingPx
    ),
  ];
}

function applyShapeStyle(shape, presentation, visualConfig, targetLabel) {
  if (!shape || !shape.classList || !shape.style) {
    return;
  }
  const color = visualConfig.theme[presentation] || visualConfig.theme.closed;
  const strokeWidth = `${Math.max(1, visualConfig.strokeWidthRatio * 120)}px`;
  shape.classList.add(TARGET_CLASS, `is-${presentation}`);
  shape.style.fill = color;
  shape.style.stroke = visualConfig.theme.stroke;
  shape.style.strokeWidth = strokeWidth;
  shape.style.opacity = String(visualConfig.intensity.opacity);
  shape.style.setProperty("--ad-ext-cricket-opacity", String(visualConfig.intensity.opacity));
  shape.style.setProperty("--ad-ext-cricket-pulse-ms", `${visualConfig.intensity.pulseMs}ms`);
  if (shape.dataset) {
    shape.dataset.targetLabel = String(targetLabel || "");
    shape.dataset.targetPresentation = String(presentation || "");
  }
}

export function buildCricketRenderState(options = {}) {
  return buildMarksByLabelSnapshot(options);
}

export function renderCricketHighlights(options = {}) {
  const documentRef = options.documentRef;
  const visualConfig = options.visualConfig;
  const renderState = options.renderState;

  if (!documentRef || !visualConfig || !renderState || !renderState.stateMap) {
    return false;
  }

  const board = findBoardSvgGroup(documentRef);
  if (!board?.group || !board.radius) {
    return false;
  }

  const overlay = ensureOverlayGroup(board.group, OVERLAY_ID, SVG_NS);
  if (!overlay) {
    return false;
  }
  clearNodeChildren(overlay);

  renderState.stateMap.forEach((stateEntry, targetLabel) => {
    const presentation = String(
      stateEntry?.boardPresentation || stateEntry?.presentation || "open"
    ).toLowerCase();
    if (!PRESENTATION_KEYS.has(presentation)) {
      return;
    }
    if (presentation === "dead" && !visualConfig.showDeadTargets) {
      return;
    }

    const shapes = buildShapesForLabel(
      overlay.ownerDocument,
      board.radius,
      targetLabel,
      visualConfig
    );
    shapes.forEach((shape) => {
      applyShapeStyle(shape, presentation, visualConfig, targetLabel);
      overlay.appendChild(shape);
    });
  });

  return true;
}

export function clearCricketHighlights(documentRef) {
  const board = findBoardSvgGroup(documentRef);
  if (!board?.group) {
    return;
  }
  const overlay = board.group.querySelector?.(`#${OVERLAY_ID}`);
  if (overlay) {
    clearNodeChildren(overlay);
    if (overlay.parentNode && typeof overlay.parentNode.removeChild === "function") {
      overlay.parentNode.removeChild(overlay);
    }
  }
}
