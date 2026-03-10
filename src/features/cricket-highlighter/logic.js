import {
  clearNodeChildren,
  ensureOverlayGroup,
  findBoardSvgGroup,
} from "../../shared/dartboard-svg.js";
import {
  OVERLAY_ID,
  PRESENTATION_CLASS,
  PRESSURE_SUPPRESSED_CLASS,
  SVG_NS,
  TARGET_CLASS,
  TARGET_SLOT_CLASS_PREFIX,
} from "./style.js";
import { buildCricketRenderState as buildCricketRenderStateFromPipeline } from "../cricket-surface/pipeline.js";

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

const PRESENTATION_KEYS = new Set(["open", "scoring", "pressure", "dead"]);
const KNOWN_SCORING_MODES = new Set(["standard", "cutthroat", "neutral", "unknown"]);
const BASE_BOARD_TARGETS = Object.freeze([
  ...Array.from({ length: 20 }, (_value, index) => String(index + 1)),
  "BULL",
]);
const SPECIAL_OBJECTIVE_TARGETS = Object.freeze(["DOUBLE", "TRIPLE"]);
const PRESSURE_VISIBLE_SLOTS = new Set([
  "double-ring",
  "triple-ring",
  "bull-outer-ring",
]);

function resolvePresentationToken(value) {
  const token = String(value || "").trim().toLowerCase();
  if (token === "offense" || token === "scorable") {
    return "scoring";
  }
  if (token === "danger") {
    return "pressure";
  }
  if (token === "closed") {
    return "dead";
  }
  if (PRESENTATION_KEYS.has(token)) {
    return token;
  }
  return "open";
}

function resolveBoardTargets(renderState) {
  const targets = BASE_BOARD_TARGETS.slice();
  const labelSet = new Set(
    Array.isArray(renderState?.targetOrder)
      ? renderState.targetOrder.map((entry) => String(entry || "").trim().toUpperCase())
      : []
  );

  SPECIAL_OBJECTIVE_TARGETS.forEach((label) => {
    if (labelSet.has(label)) {
      targets.push(label);
    }
  });

  return targets;
}

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

function parseTextMarkValue(value, cricketRules) {
  if (cricketRules && typeof cricketRules.parseCricketMarkValue === "function") {
    const parsed = cricketRules.parseCricketMarkValue(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  const normalized = String(value || "").trim();
  const numeric = Number.parseInt(normalized, 10);
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
    const label = getNormalizedLabel(cricketRules, node);
    if (!label || !targetSet.has(label)) {
      return;
    }
    seen.add(node);
    labels.push({ node, label });
  };

  LABEL_NODE_SELECTORS.forEach((selector) => {
    queryAll(rootNode, selector).forEach((node) => {
      pushLabelNode(node);
    });
  });

  if (diagnostics && typeof diagnostics === "object") {
    diagnostics.rawLabelCount = labels.length;
    diagnostics.rawUniqueLabelCount = new Set(labels.map((entry) => entry.label)).size;
  }

  if (labels.length >= 4) {
    return filterAtomicLabelNodes(labels, diagnostics);
  }

  queryAll(rootNode, "div, td, th, span, p").forEach((node) => {
    pushLabelNode(node);
  });

  if (diagnostics && typeof diagnostics === "object") {
    diagnostics.rawLabelCount = labels.length;
    diagnostics.rawUniqueLabelCount = new Set(labels.map((entry) => entry.label)).size;
  }

  return filterAtomicLabelNodes(labels, diagnostics);
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

function getRootScore(rootNode, cricketRules, targetSet) {
  const diagnostics = createLabelDiagnostics();
  const labels = collectLabelNodes(rootNode, cricketRules, targetSet, diagnostics);
  if (!labels.length) {
    return {
      score: 0,
      labels: [],
      diagnostics,
    };
  }

  const uniqueLabels = new Set(labels.map((entry) => entry.label));
  const visibleBonus = isNodeVisible(rootNode) ? 10 : 0;
  const score = uniqueLabels.size * 100 + labels.length + visibleBonus;
  return { score, labels, diagnostics };
}

function findBestGridRoot(documentRef, cricketRules, targetOrder) {
  if (!documentRef) {
    return null;
  }
  const targetSet = new Set(Array.isArray(targetOrder) ? targetOrder : []);
  let bestRoot = null;
  let bestScore = 0;
  let bestLabels = [];
  let bestDiagnostics = createLabelDiagnostics();

  GRID_ROOT_SELECTORS.forEach((selector) => {
    queryAll(documentRef, selector).forEach((candidate) => {
      const snapshot = getRootScore(candidate, cricketRules, targetSet);
      if (snapshot.score > bestScore) {
        bestRoot = candidate;
        bestScore = snapshot.score;
        bestLabels = snapshot.labels;
        bestDiagnostics = cloneLabelDiagnostics(snapshot.diagnostics);
      }
    });
  });

  if (!bestRoot) {
    const fallback = documentRef.body || documentRef.documentElement || documentRef;
    const snapshot = getRootScore(fallback, cricketRules, targetSet);
    if (snapshot.score > 0) {
      bestRoot = fallback;
      bestLabels = snapshot.labels;
      bestDiagnostics = cloneLabelDiagnostics(snapshot.diagnostics);
    }
  }

  if (!bestRoot) {
    return null;
  }

  return {
    root: bestRoot,
    labels: bestLabels,
    diagnostics: bestDiagnostics,
  };
}

function resolveGridSnapshot(documentRef, cricketRules, targetOrder, cache = null) {
  if (cache?.grid?.root && cache.grid.root.isConnected !== false) {
    return cache.grid;
  }

  const nextGrid = findBestGridRoot(documentRef, cricketRules, targetOrder);
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
      return icons.length;
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

  const labelCell = resolveLabelCell(labelNode);
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

  return collectSiblingPlayerCells(labelNode, cricketRules, targetSet);
}

function resolveLabelCell(labelNode) {
  if (!labelNode || typeof labelNode.closest !== "function") {
    return labelNode?.parentElement || null;
  }

  const tableCell = labelNode.closest("td, th, [role='cell']");
  if (tableCell) {
    return tableCell;
  }

  return labelNode.parentElement || labelNode;
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

  const hasHints = hasExplicitMarkHints(labelCell);
  if (diagnostics && typeof diagnostics === "object") {
    diagnostics.labelCellHasExplicitMarkHints = hasHints;
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

function resolveActivePlayerIndex(gameState, documentRef, playerCount, options = {}) {
  const stateIndex = Number.isFinite(gameState?.getActivePlayerIndex?.())
    ? Number(gameState.getActivePlayerIndex())
    : 0;

  const activePlayerNodes = queryAll(documentRef, ".ad-ext-player");
  const visiblePlayerNodes = activePlayerNodes.filter((node) => isNodeVisible(node));
  const domActiveIndex = visiblePlayerNodes.findIndex((node) => {
    return Boolean(node.classList?.contains("ad-ext-player-active"));
  });

  const preferGameStateIndex = options.preferGameStateIndex === true;
  const candidate = preferGameStateIndex && Number.isFinite(stateIndex)
    ? stateIndex
    : domActiveIndex >= 0
      ? domActiveIndex
      : stateIndex;

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

function readActiveThrowMarksByLabel(gameState, cricketRules, targetOrder) {
  const activeThrows = Array.isArray(gameState?.getActiveThrows?.()) ? gameState.getActiveThrows() : [];
  const marksByLabel = new Map();

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
  const visualConfig = options.visualConfig;

  if (!documentRef || !cricketRules) {
    return null;
  }

  const explicitGameModeNormalized = resolveGameModeNormalized(gameState, variantRules, documentRef);
  const discoveryTargetOrder = explicitGameModeNormalized
    ? cricketRules.getTargetOrderByGameMode(explicitGameModeNormalized)
    : cricketRules.getTargetOrderByGameMode("tactics");
  const grid = resolveGridSnapshot(documentRef, cricketRules, discoveryTargetOrder, options.cache);
  if (!grid) {
    return null;
  }

  const inferredGameModeNormalized = explicitGameModeNormalized ||
    cricketRules.inferCricketGameModeByLabels(grid.labels.map((entry) => entry.label));
  const gameModeNormalized = inferredGameModeNormalized || "cricket";
  const targetOrder = cricketRules.getTargetOrderByGameMode(gameModeNormalized);
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
  const labelCellMarkSourceLabels = [];
  const labelCellMarkSourceSet = new Set();
  const shortfallRepairLabels = [];
  const shortfallRepairSet = new Set();
  let hasIndexedPlayerColumns = false;

  grid.labels.forEach(({ node, label }) => {
    if (!targetSet.has(label)) {
      return;
    }

    const playerCells = collectPlayerCellsForLabel(node, cricketRules, targetSet);
    const labelCell = resolveLabelCell(node);
    const markSourceMeta = {};
    const markSourceCells = maybeIncludeLabelCellAsPlayerCell(
      playerCells,
      labelCell,
      playerCountFromMatch,
      markSourceMeta
    );
    if (markSourceMeta.labelCellIncluded && !labelCellMarkSourceSet.has(label)) {
      labelCellMarkSourceSet.add(label);
      labelCellMarkSourceLabels.push(label);
    }
    if (markSourceMeta.shortfallRepairApplied && !shortfallRepairSet.has(label)) {
      shortfallRepairSet.add(label);
      shortfallRepairLabels.push(label);
    }
    const sequentialMarks = [];
    const indexedMarks = [];
    markSourceCells.forEach((cell) => {
      const marks = cricketRules.clampMarks(parseMarksValue(cell, cricketRules));
      const playerIndex = readCellPlayerIndex(cell);
      if (Number.isFinite(playerIndex)) {
        indexedMarks.push({ playerIndex, marks });
      } else {
        sequentialMarks.push(marks);
      }
    });
    if (!sequentialMarks.length && !indexedMarks.length) {
      return;
    }

    if (indexedMarks.length > 0) {
      hasIndexedPlayerColumns = true;
      const maxIndexedColumn = indexedMarks.reduce((max, entry) => {
        return entry.playerIndex > max ? entry.playerIndex : max;
      }, -1);
      const rowLength = Math.max(
        playerCountFromMatch,
        maxIndexedColumn + 1,
        sequentialMarks.length + indexedMarks.length
      );
      const marksByPlayer = Array.from({ length: rowLength }, () => 0);
      const occupiedColumns = new Set();
      indexedMarks.forEach((entry) => {
        if (entry.playerIndex < rowLength) {
          marksByPlayer[entry.playerIndex] = cricketRules.clampMarks(entry.marks);
          occupiedColumns.add(entry.playerIndex);
        }
      });

      let cursor = 0;
      sequentialMarks.forEach((marks) => {
        while (occupiedColumns.has(cursor) && cursor < marksByPlayer.length) {
          cursor += 1;
        }
        if (cursor >= marksByPlayer.length) {
          marksByPlayer.push(cricketRules.clampMarks(marks));
          cursor = marksByPlayer.length;
          return;
        }
        marksByPlayer[cursor] = cricketRules.clampMarks(marks);
        occupiedColumns.add(cursor);
        cursor += 1;
      });

      marksByLabel[label] = marksByPlayer;
      maxPlayerCount = Math.max(maxPlayerCount, marksByPlayer.length);
      return;
    }

    marksByLabel[label] = sequentialMarks.map((value) => cricketRules.clampMarks(value));
    maxPlayerCount = Math.max(maxPlayerCount, sequentialMarks.length);
  });

  const playerCount = Math.max(maxPlayerCount, playerCountFromMatch, 1);

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
  const turnMarksByLabel = readTurnMarksByLabel(gameState, cricketRules, targetOrder, playerCount);
  const activeThrowPreview = readActiveThrowMarksByLabel(gameState, cricketRules, targetOrder);

  targetOrder.forEach((label) => {
    const domMarks = Array.isArray(marksByLabel[label]) ? marksByLabel[label] : [];
    const turnMarks = Array.isArray(turnMarksByLabel?.[label]) ? turnMarksByLabel[label] : [];
    const activeThrowMarks = activeThrowPreview.marksByLabel.get(label) || 0;

    for (let index = 0; index < playerCount; index += 1) {
      domMarks[index] = Math.max(
        cricketRules.clampMarks(domMarks[index] || 0),
        cricketRules.clampMarks(turnMarks[index] || 0)
      );
    }

    if (activeThrowMarks > 0) {
      const historicalActiveMarks = cricketRules.clampMarks(turnMarks[activePlayerIndex] || 0);
      const projectedActiveMarks = cricketRules.clampMarks(
        historicalActiveMarks + activeThrowMarks
      );
      domMarks[activePlayerIndex] = Math.max(
        cricketRules.clampMarks(domMarks[activePlayerIndex] || 0),
        projectedActiveMarks
      );
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

  return {
    gameModeNormalized,
    scoringModeRaw: scoringModeState.rawScoringMode,
    scoringModeNormalized,
    scoringModeSource: scoringModeState.scoringModeSource,
    tacticsPrecisionMode,
    targetOrder,
    activePlayerIndex,
    discoveredLabelCount: grid.labels.length,
    discoveredUniqueLabelCount: new Set(grid.labels.map((entry) => entry.label)).size,
    discoveredRawLabelCount: labelDiagnostics.rawLabelCount,
    discoveredRawUniqueLabelCount: labelDiagnostics.rawUniqueLabelCount,
    labelDiagnostics,
    labelCellMarkSourceCount: labelCellMarkSourceLabels.length,
    labelCellMarkSourceLabels,
    shortfallRepairCount: shortfallRepairLabels.length,
    shortfallRepairLabels,
    marksByLabelDebug,
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

  const normalizedLabel = String(targetLabel || "").trim().toUpperCase();

  if (normalizedLabel === "BULL") {
    const outerBullRing = createBull(
      ownerDocument,
      radius,
      RING_RATIOS.outerBullInner,
      RING_RATIOS.outerBullOuter,
      false,
      visualConfig.edgePaddingPx
    );
    outerBullRing.dataset.targetSlot = "bull-outer-ring";

    const innerBullCore = createBull(
      ownerDocument,
      radius,
      0,
      RING_RATIOS.outerBullInner,
      true,
      visualConfig.edgePaddingPx
    );
    innerBullCore.dataset.targetSlot = "bull-core";

    return [outerBullRing, innerBullCore];
  }

  if (normalizedLabel === "DOUBLE" || normalizedLabel === "TRIPLE") {
    const innerRatio =
      normalizedLabel === "DOUBLE" ? RING_RATIOS.doubleInner : RING_RATIOS.tripleInner;
    const outerRatio =
      normalizedLabel === "DOUBLE" ? RING_RATIOS.doubleOuter : RING_RATIOS.tripleOuter;
    const slotName = normalizedLabel === "DOUBLE" ? "double-ring" : "triple-ring";
    const rings = [];

    SEGMENT_ORDER.forEach((segmentValue) => {
      const angles = segmentAngles(segmentValue);
      if (!angles) {
        return;
      }
      const ring = createWedge(
        ownerDocument,
        radius,
        innerRatio,
        outerRatio,
        angles,
        visualConfig.edgePaddingPx
      );
      ring.dataset.targetSlot = slotName;
      rings.push(ring);
    });

    return rings;
  }

  const numericLabel = Number.parseInt(normalizedLabel, 10);
  if (!(numericLabel >= 1 && numericLabel <= 20)) {
    return [];
  }

  const angles = segmentAngles(numericLabel);
  if (!angles) {
    return [];
  }

  const singleInner = createWedge(
    ownerDocument,
    radius,
    RING_RATIOS.outerBullOuter,
    RING_RATIOS.tripleInner,
    angles,
    visualConfig.edgePaddingPx
  );
  singleInner.dataset.targetSlot = "single-inner";

  const tripleRing = createWedge(
    ownerDocument,
    radius,
    RING_RATIOS.tripleInner,
    RING_RATIOS.tripleOuter,
    angles,
    visualConfig.edgePaddingPx
  );
  tripleRing.dataset.targetSlot = "triple-ring";

  const singleOuter = createWedge(
    ownerDocument,
    radius,
    RING_RATIOS.tripleOuter,
    RING_RATIOS.doubleInner,
    angles,
    visualConfig.edgePaddingPx
  );
  singleOuter.dataset.targetSlot = "single-outer";

  const doubleRing = createWedge(
    ownerDocument,
    radius,
    RING_RATIOS.doubleInner,
    RING_RATIOS.doubleOuter,
    angles,
    visualConfig.edgePaddingPx
  );
  doubleRing.dataset.targetSlot = "double-ring";

  return [singleInner, tripleRing, singleOuter, doubleRing];
}

function setStyleVar(node, name, value) {
  if (!node?.style || typeof node.style.setProperty !== "function") {
    return;
  }
  node.style.setProperty(name, String(value ?? ""));
}

function clampAlpha(value, fallback = 0) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return Math.max(0, Math.min(1, Number(fallback) || 0));
  }
  return Math.max(0, Math.min(1, numeric));
}

function rgbaColor(color, alpha) {
  const r = Number.isFinite(color?.r) ? Math.round(color.r) : 0;
  const g = Number.isFinite(color?.g) ? Math.round(color.g) : 0;
  const b = Number.isFinite(color?.b) ? Math.round(color.b) : 0;
  return `rgba(${r}, ${g}, ${b}, ${clampAlpha(alpha)})`;
}

function applyOverlayStyleVars(overlay, visualConfig, radius) {
  if (!overlay || !visualConfig) {
    return;
  }

  const theme = visualConfig.theme || {};
  const intensity = visualConfig.intensity || {};
  const baseColor = visualConfig.baseColor || { r: 90, g: 90, b: 90 };
  const mutedColor = visualConfig.mutedColor || { r: 33, g: 33, b: 33 };
  const showOpenTargets = visualConfig.showOpenTargets === true;
  const highlightOpacity = clampAlpha(intensity.highlightOpacity, 0.45);
  const strokeBoost = clampAlpha(intensity.strokeBoost, 0.2);
  const openOpacity = showOpenTargets ? clampAlpha(intensity.open, 0.3) : 0;

  setStyleVar(overlay, "--ad-ext-cricket-open-fill", rgbaColor(baseColor, openOpacity));
  setStyleVar(overlay, "--ad-ext-cricket-open-stroke", rgbaColor(baseColor, showOpenTargets ? Math.min(1, openOpacity + 0.12) : 0));
  setStyleVar(overlay, "--ad-ext-cricket-open-opacity", showOpenTargets ? "1" : "0");

  setStyleVar(overlay, "--ad-ext-cricket-dead-fill", rgbaColor(mutedColor, clampAlpha(intensity.dead, 0.98)));
  setStyleVar(overlay, "--ad-ext-cricket-dead-stroke", rgbaColor(mutedColor, 0));
  setStyleVar(overlay, "--ad-ext-cricket-dead-opacity", "1");

  setStyleVar(
    overlay,
    "--ad-ext-cricket-inactive-fill",
    rgbaColor(mutedColor, clampAlpha(intensity.inactive, 0.8))
  );
  setStyleVar(overlay, "--ad-ext-cricket-inactive-stroke", rgbaColor(mutedColor, 0));
  setStyleVar(overlay, "--ad-ext-cricket-inactive-opacity", "1");

  setStyleVar(overlay, "--ad-ext-cricket-scoring-fill", rgbaColor(theme.offense, highlightOpacity));
  setStyleVar(
    overlay,
    "--ad-ext-cricket-scoring-stroke",
    rgbaColor(theme.offense, Math.min(1, highlightOpacity + strokeBoost))
  );
  setStyleVar(overlay, "--ad-ext-cricket-scoring-opacity", "1");

  const subtlePressureFill = Math.max(0.04, highlightOpacity * 0.14);
  const subtlePressureStroke = Math.max(0.24, Math.min(1, highlightOpacity + strokeBoost * 0.48));

  setStyleVar(overlay, "--ad-ext-cricket-pressure-fill", rgbaColor(theme.danger, subtlePressureFill));
  setStyleVar(
    overlay,
    "--ad-ext-cricket-pressure-stroke",
    rgbaColor(theme.danger, subtlePressureStroke)
  );
  setStyleVar(overlay, "--ad-ext-cricket-pressure-opacity", "1");

  const strokeWidth = `${Math.max(1, Number(radius) * Number(visualConfig.strokeWidthRatio || 0.006))}px`;
  setStyleVar(overlay, "--ad-ext-cricket-stroke-width", strokeWidth);
}

function ensureScoringPattern(overlay, visualConfig) {
  const ownerDocument = overlay?.ownerDocument;
  const svgRoot = overlay?.ownerSVGElement;
  if (!ownerDocument || !svgRoot) {
    return "";
  }

  let defs = svgRoot.querySelector("defs");
  if (!defs) {
    defs = ownerDocument.createElementNS(SVG_NS, "defs");
    svgRoot.insertBefore(defs, svgRoot.firstChild || null);
  }

  const patternId = "ad-ext-cricket-scoring-pattern";
  let pattern = defs.querySelector(`#${patternId}`);
  if (!pattern) {
    pattern = ownerDocument.createElementNS(SVG_NS, "pattern");
    pattern.setAttribute("id", patternId);
    pattern.setAttribute("patternUnits", "userSpaceOnUse");
    pattern.setAttribute("width", "8");
    pattern.setAttribute("height", "8");
    pattern.setAttribute("patternTransform", "rotate(135)");
    defs.appendChild(pattern);
  }

  while (pattern.firstChild) {
    pattern.removeChild(pattern.firstChild);
  }

  const offense = visualConfig?.theme?.offense || { r: 0, g: 178, b: 135 };
  const baseRect = ownerDocument.createElementNS(SVG_NS, "rect");
  baseRect.setAttribute("width", "8");
  baseRect.setAttribute("height", "8");
  baseRect.setAttribute("fill", rgbaColor(offense, 0.72));
  pattern.appendChild(baseRect);

  const stripe = ownerDocument.createElementNS(SVG_NS, "path");
  stripe.setAttribute("d", "M0 0 H8 V4 H0 Z");
  stripe.setAttribute("fill", rgbaColor(offense, 0.32));
  pattern.appendChild(stripe);

  return `url(#${patternId})`;
}

function applyShapeStyle(shape, presentation, visualConfig, targetLabel) {
  if (!shape || !shape.classList || !shape.style) {
    return;
  }
  const normalizedPresentation = resolvePresentationToken(presentation);
  const presentationClass = PRESENTATION_CLASS[normalizedPresentation] || PRESENTATION_CLASS.open;
  Object.values(PRESENTATION_CLASS).forEach((className) => {
    shape.classList.remove(className);
  });
  shape.classList.remove(PRESSURE_SUPPRESSED_CLASS);
  shape.classList.add(TARGET_CLASS, presentationClass);
  const targetSlot = String(shape?.dataset?.targetSlot || "").trim().toLowerCase();
  if (targetSlot) {
    shape.classList.add(`${TARGET_SLOT_CLASS_PREFIX}${targetSlot}`);
    if (normalizedPresentation === "pressure" && !PRESSURE_VISIBLE_SLOTS.has(targetSlot)) {
      shape.classList.add(PRESSURE_SUPPRESSED_CLASS);
    }
  }
  if (normalizedPresentation === "scoring" && String(shape.dataset?.scoringPattern || "")) {
    shape.style.fill = String(shape.dataset.scoringPattern);
  } else {
    shape.style.removeProperty("fill");
  }
  if (shape.dataset) {
    shape.dataset.targetLabel = String(targetLabel || "");
    shape.dataset.targetPresentation = normalizedPresentation;
  }
}

function resolvePresentationForStateEntry(stateEntry, isRelevantTarget) {
  if (!isRelevantTarget) {
    return "inactive";
  }

  const uiBucket = String(stateEntry?.uiBucket || "").trim().toLowerCase();
  if (uiBucket === "scoring" || uiBucket === "scorable" || uiBucket === "offense") {
    return "scoring";
  }
  if (uiBucket === "pressure") {
    return "pressure";
  }
  if (uiBucket === "dead") {
    return "dead";
  }
  if (uiBucket === "open") {
    return "open";
  }

  const fallbackPresentation = resolvePresentationToken(
    stateEntry?.boardPresentation || stateEntry?.presentation || "open"
  );
  return PRESENTATION_KEYS.has(fallbackPresentation) ? fallbackPresentation : "open";
}

function ensureOverlayShapeCache(overlay, board, visualConfig, boardTargets, cache = null) {
  if (!overlay || !board?.radius) {
    return null;
  }

  const geometryKey = [
    Number(board.radius).toFixed(2),
    Number(visualConfig?.edgePaddingPx || 0).toFixed(2),
    Array.isArray(boardTargets) ? boardTargets.join(",") : "",
  ].join("|");

  const cacheContainer = cache && typeof cache === "object" ? cache : null;
  const cachedShapeState = cacheContainer?.overlayShapeState || null;
  const canReuse =
    cachedShapeState &&
    cachedShapeState.overlay === overlay &&
    cachedShapeState.geometryKey === geometryKey;
  if (canReuse) {
    return cachedShapeState;
  }

  clearNodeChildren(overlay);
  const shapesByTarget = new Map();
  (Array.isArray(boardTargets) ? boardTargets : BASE_BOARD_TARGETS).forEach((targetLabel) => {
    const shapes = buildShapesForLabel(overlay.ownerDocument, board.radius, targetLabel, visualConfig);
    shapes.forEach((shape) => overlay.appendChild(shape));
    shapesByTarget.set(targetLabel, shapes);
  });

  const nextState = {
    overlay,
    geometryKey,
    shapesByTarget,
  };

  if (cacheContainer) {
    cacheContainer.overlayShapeState = nextState;
  }
  return nextState;
}

export function buildCricketRenderState(options = {}) {
  return buildCricketRenderStateFromPipeline(options);
}

export function renderCricketHighlights(options = {}) {
  const documentRef = options.documentRef;
  const visualConfig = options.visualConfig;
  const renderState = options.renderState;

  if (!documentRef || !visualConfig || !renderState || !renderState.stateMap) {
    return false;
  }

  const debugStats = options.debugStats && typeof options.debugStats === "object"
    ? options.debugStats
    : null;

  const board = resolveBoardSnapshot(documentRef, options.cache);
  if (!board?.group || !board.radius) {
    if (debugStats) {
      debugStats.renderedShapeCount = 0;
      debugStats.highlightedTargetCount = 0;
      debugStats.nonOpenTargetCount = 0;
      debugStats.openTargetCount = 0;
      debugStats.renderedOpenTargetCount = 0;
      debugStats.shapeCountByTarget = {};
      debugStats.shapeCountByPresentation = {};
    }
    return false;
  }

  const overlay = ensureOverlayGroup(board.group, OVERLAY_ID, SVG_NS);
  if (!overlay) {
    return false;
  }
  applyOverlayStyleVars(overlay, visualConfig, board.radius);
  const boardTargets = resolveBoardTargets(renderState);
  const scoringPattern = ensureScoringPattern(overlay, visualConfig);
  const overlayShapeState = ensureOverlayShapeCache(
    overlay,
    board,
    visualConfig,
    boardTargets,
    options.cache
  );
  if (!overlayShapeState?.shapesByTarget) {
    return false;
  }
  let renderedShapeCount = 0;
  let highlightedTargetCount = 0;
  let nonOpenTargetCount = 0;
  let openTargetCount = 0;
  let renderedOpenTargetCount = 0;
  let inactiveTargetCount = 0;
  const shapeCountByTarget = {};
  const shapeCountByPresentation = {};

  const activeTargetSet = new Set(
    Array.isArray(renderState.targetOrder) && renderState.targetOrder.length
      ? renderState.targetOrder
      : Array.from(renderState.stateMap.keys())
  );

  boardTargets.forEach((targetLabel) => {
    const isRelevantTarget = activeTargetSet.has(targetLabel);
    const stateEntry = renderState.stateMap.get(targetLabel) || null;
    const presentation = resolvePresentationForStateEntry(stateEntry, isRelevantTarget);
    if (!PRESENTATION_KEYS.has(presentation) && presentation !== "inactive") {
      return;
    }

    if (!isRelevantTarget) {
      inactiveTargetCount += 1;
    } else if (presentation !== "open") {
      nonOpenTargetCount += 1;
    } else {
      openTargetCount += 1;
    }

    const highlightActive = Boolean(stateEntry?.isHighlightActive);
    const shouldRenderTarget = !(
      (isRelevantTarget && presentation === "open" && visualConfig.showOpenTargets === false) ||
      (isRelevantTarget && presentation === "dead" && !visualConfig.showDeadTargets) ||
      (isRelevantTarget && presentation !== "dead" && !highlightActive)
    );
    const shapes = overlayShapeState.shapesByTarget.get(targetLabel) || [];

    shapeCountByTarget[targetLabel] = (shapeCountByTarget[targetLabel] || 0) + shapes.length;
    if (shouldRenderTarget) {
      shapeCountByPresentation[presentation] =
        (shapeCountByPresentation[presentation] || 0) + shapes.length;
    }

    shapes.forEach((shape) => {
      if (shape?.dataset) {
        shape.dataset.scoringPattern = scoringPattern;
      }
      applyShapeStyle(shape, presentation, visualConfig, targetLabel);
      shape.style.display = shouldRenderTarget ? "" : "none";
      if (shouldRenderTarget) {
        renderedShapeCount += 1;
      }
    });

    if (shouldRenderTarget && shapes.length > 0) {
      highlightedTargetCount += 1;
      if (isRelevantTarget && presentation === "open") {
        renderedOpenTargetCount += 1;
      }
    }
  });

  if (debugStats) {
    debugStats.renderedShapeCount = renderedShapeCount;
    debugStats.highlightedTargetCount = highlightedTargetCount;
    debugStats.nonOpenTargetCount = nonOpenTargetCount;
    debugStats.openTargetCount = openTargetCount;
    debugStats.renderedOpenTargetCount = renderedOpenTargetCount;
    debugStats.inactiveTargetCount = inactiveTargetCount;
    debugStats.shapeCountByTarget = shapeCountByTarget;
    debugStats.shapeCountByPresentation = shapeCountByPresentation;
  }

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
