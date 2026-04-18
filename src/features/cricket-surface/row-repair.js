import { hasExplicitMarkHints } from "./label-layout.js";
import { normalizeCricketLabelNode } from "./label-utils.js";
import { parseMarksValue, readCellPlayerIndex } from "./mark-parser.js";

function hasTextualMarkHints(node) {
  const text = String(node?.textContent || "").trim();
  if (!text) {
    return false;
  }

  if (/[\u2A02\u2297\u29BB\u00D7\u2715\u2716\u2573Xx/|]/u.test(text)) {
    return true;
  }

  return /(^|\D)[1-3](\D|$)/.test(text);
}

function maybeIncludeLabelCellAsPlayerCell(
  playerCells,
  labelCell,
  expectedPlayerCount = 0,
  diagnostics = null
) {
  const normalizedCells = Array.isArray(playerCells)
    ? playerCells.filter(Boolean)
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
      const normalized = normalizeCricketLabelNode(cricketRules, node);
      return !normalized || normalized === label;
    }) || null
  );
}

export function buildGridRowSnapshot(options = {}) {
  const cricketRules = options.cricketRules || null;
  const targetOrder = Array.isArray(options.targetOrder) ? options.targetOrder : [];
  const targetSet =
    options.targetSet instanceof Set
      ? options.targetSet
      : new Set(Array.isArray(options.targetSet) ? options.targetSet : targetOrder);
  const gridLabels = Array.isArray(options.gridLabels) ? options.gridLabels : [];
  const expectedPlayerCount = Number.isFinite(Number(options.expectedPlayerCount))
    ? Math.max(0, Math.round(Number(options.expectedPlayerCount)))
    : 0;
  const cachedStableRows = options.cachedStableRows instanceof Map ? options.cachedStableRows : null;
  const collectPlayerCellsForLabel =
    typeof options.collectPlayerCellsForLabel === "function"
      ? options.collectPlayerCellsForLabel
      : () => [];
  const resolveLabelCell =
    typeof options.resolveLabelCell === "function" ? options.resolveLabelCell : () => null;
  const resolveBadgeNode =
    typeof options.resolveBadgeNode === "function" ? options.resolveBadgeNode : () => null;
  const getRowNode = typeof options.getRowNode === "function" ? options.getRowNode : () => null;
  const isInsideTurnPreview =
    typeof options.isInsideTurnPreview === "function" ? options.isInsideTurnPreview : () => false;

  const marksByLabel = cricketRules.createEmptyMarksByLabel(targetOrder, 0);
  let maxPlayerCount = 0;
  const rowMetaByLabel = new Map();
  const labelCellMarkSourceLabels = [];
  const labelCellMarkSourceSet = new Set();
  const shortfallRepairLabels = [];
  const shortfallRepairSet = new Set();
  const recoveredStableLabels = [];
  let hasIndexedPlayerColumns = false;

  const applyRowMetaForLabel = (label, node, fallbackRowMeta = null) => {
    if (!targetSet.has(label) || rowMetaByLabel.has(label) || !node || node.isConnected === false) {
      return;
    }
    if (isInsideTurnPreview(node)) {
      return;
    }

    const labelCell = resolveLabelCell(node, label) || fallbackRowMeta?.labelCell || null;
    const discoveredPlayerCells = collectPlayerCellsForLabel(node, label).filter(Boolean);
    const fallbackPlayerCells = Array.isArray(fallbackRowMeta?.playerCells)
      ? fallbackRowMeta.playerCells.filter((cell) => cell && cell.isConnected !== false)
      : [];
    const playerCells = discoveredPlayerCells.length > 0 ? discoveredPlayerCells : fallbackPlayerCells;
    const badgeNode =
      resolveBadgeNode(node, labelCell, label) ||
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

  gridLabels.forEach(({ node, label }) => {
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

  return {
    hasIndexedPlayerColumns,
    labelCellMarkSourceLabels,
    marksByLabel,
    maxPlayerCount,
    recoveredStableLabels,
    rowMetaByLabel,
    shortfallRepairLabels,
  };
}
