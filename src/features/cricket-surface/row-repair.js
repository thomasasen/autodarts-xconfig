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

function createRowRepairContext(options = {}) {
  const targetOrder = Array.isArray(options.targetOrder) ? options.targetOrder : [];
  const targetSet = resolveContextTargetSet(options.targetSet, targetOrder);

  return {
    cricketRules: options.cricketRules || null,
    targetOrder,
    targetSet,
    gridLabels: Array.isArray(options.gridLabels) ? options.gridLabels : [],
    expectedPlayerCount: resolveExpectedPlayerCount(options.expectedPlayerCount),
    cachedStableRows: options.cachedStableRows instanceof Map ? options.cachedStableRows : null,
    collectPlayerCellsForLabel: resolveOptionalCallback(options.collectPlayerCellsForLabel, () => []),
    resolveLabelCell: resolveOptionalCallback(options.resolveLabelCell, () => null),
    resolveBadgeNode: resolveOptionalCallback(options.resolveBadgeNode, () => null),
    getRowNode: resolveOptionalCallback(options.getRowNode, () => null),
    isInsideTurnPreview: resolveOptionalCallback(options.isInsideTurnPreview, () => false),
    marksByLabel: options.cricketRules.createEmptyMarksByLabel(targetOrder, 0),
    maxPlayerCount: 0,
    rowMetaByLabel: new Map(),
    labelCellMarkSourceLabels: [],
    labelCellMarkSourceSet: new Set(),
    shortfallRepairLabels: [],
    shortfallRepairSet: new Set(),
    recoveredStableLabels: [],
    hasIndexedPlayerColumns: false,
  };
}

function resolveContextTargetSet(targetSet, targetOrder) {
  if (targetSet instanceof Set) {
    return targetSet;
  }
  if (Array.isArray(targetSet)) {
    return new Set(targetSet);
  }
  return new Set(targetOrder);
}

function resolveExpectedPlayerCount(expectedPlayerCount) {
  const numeric = Number(expectedPlayerCount);
  if (!Number.isFinite(numeric)) {
    return 0;
  }
  return Math.max(0, Math.round(numeric));
}

function resolveOptionalCallback(candidate, fallback) {
  return typeof candidate === "function" ? candidate : fallback;
}

function addUniqueLabel(targetList, targetSet, label) {
  if (targetSet.has(label)) {
    return;
  }
  targetSet.add(label);
  targetList.push(label);
}

function recordMarkSourceLabels(context, label, markSourceMeta) {
  const hasConcreteLabelMarkHints =
    Boolean(markSourceMeta.labelCellHasExplicitMarkHints) ||
    Boolean(markSourceMeta.labelCellHasTextMarkHints);
  if (!hasConcreteLabelMarkHints) {
    return;
  }

  if (markSourceMeta.labelCellIncluded) {
    addUniqueLabel(context.labelCellMarkSourceLabels, context.labelCellMarkSourceSet, label);
  }
  if (markSourceMeta.shortfallRepairApplied) {
    addUniqueLabel(context.shortfallRepairLabels, context.shortfallRepairSet, label);
  }
}

function resolvePlayerCellsForRow(context, label, node, fallbackRowMeta) {
  const discoveredPlayerCells = context.collectPlayerCellsForLabel(node, label).filter(Boolean);
  if (discoveredPlayerCells.length > 0) {
    return discoveredPlayerCells;
  }
  return Array.isArray(fallbackRowMeta?.playerCells)
    ? fallbackRowMeta.playerCells.filter((cell) => cell && cell.isConnected !== false)
    : [];
}

function parseRowCells(cells, cricketRules) {
  return cells.map((cell) => {
    const explicitPlayerIndex = readCellPlayerIndex(cell);
    return {
      cellNode: cell,
      marks: cricketRules.clampMarks(parseMarksValue(cell, cricketRules)),
      explicitPlayerIndex: Number.isFinite(explicitPlayerIndex) ? Math.round(explicitPlayerIndex) : null,
    };
  });
}

function resolveExplicitColumnPlan(parsedCells, expectedPlayerCount) {
  const expectedRowLength = Math.max(expectedPlayerCount, parsedCells.length);
  const shortfallOffset = Math.max(0, expectedRowLength - parsedCells.length);
  const explicitPlayerIndexes = parsedCells
    .map((entry) => entry.explicitPlayerIndex)
    .filter((value) => Number.isFinite(value));
  const hasCompleteExplicitIndexes =
    explicitPlayerIndexes.length === parsedCells.length &&
    parsedCells.length > 0 &&
    new Set(explicitPlayerIndexes).size === explicitPlayerIndexes.length &&
    explicitPlayerIndexes.every((value) => value >= 0 && value < expectedRowLength);
  const explicitIndexesRespectShortfall =
    parsedCells.length >= expectedRowLength ||
    explicitPlayerIndexes.every((value) => value >= shortfallOffset);
  const useExplicitPlayerIndexes = hasCompleteExplicitIndexes && explicitIndexesRespectShortfall;
  const maxExplicitColumn = useExplicitPlayerIndexes ? Math.max(-1, ...explicitPlayerIndexes) : -1;

  return {
    expectedRowLength,
    maxExplicitColumn,
    shortfallOffset,
    useExplicitPlayerIndexes,
  };
}

function assignParsedCellsToColumns(parsedCells, cricketRules, columnPlan) {
  const marksByPlayer = Array.from(
    { length: Math.max(columnPlan.expectedRowLength, columnPlan.maxExplicitColumn + 1, 1) },
    () => 0
  );
  const playerCellsByIndex = Array.from({ length: marksByPlayer.length }, () => null);
  const occupiedColumns = new Set();
  let cursor = columnPlan.shortfallOffset;

  parsedCells.forEach((entry) => {
    let targetIndex = columnPlan.useExplicitPlayerIndexes && Number.isFinite(entry.explicitPlayerIndex)
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

  return { marksByPlayer, playerCellsByIndex };
}

function createEmptyRowMeta(label, node, labelCell, badgeNode, rowNode, playerCells) {
  return {
    label,
    labelNode: node,
    labelCell,
    badgeNode,
    rowNode,
    playerCells,
    playerCellsByIndex: [],
  };
}

function applyRowMetaForLabel(context, label, node, fallbackRowMeta = null) {
  if (!context.targetSet.has(label) || context.rowMetaByLabel.has(label) || !node || node.isConnected === false) {
    return;
  }
  if (context.isInsideTurnPreview(node)) {
    return;
  }

  const labelCell = context.resolveLabelCell(node, label) || fallbackRowMeta?.labelCell || null;
  const playerCells = resolvePlayerCellsForRow(context, label, node, fallbackRowMeta);
  const badgeNode =
    context.resolveBadgeNode(node, labelCell, label) ||
    (fallbackRowMeta?.badgeNode?.isConnected === false ? null : fallbackRowMeta?.badgeNode || null);
  const markSourceMeta = {};
  const markSourceCells = maybeIncludeLabelCellAsPlayerCell(
    playerCells,
    labelCell,
    context.expectedPlayerCount,
    markSourceMeta
  );
  recordMarkSourceLabels(context, label, markSourceMeta);

  const parsedCells = parseRowCells(markSourceCells, context.cricketRules);
  const rowNode = context.getRowNode(node) || fallbackRowMeta?.rowNode || null;
  if (!parsedCells.length) {
    context.rowMetaByLabel.set(
      label,
      createEmptyRowMeta(label, node, labelCell, badgeNode, rowNode, playerCells)
    );
    return;
  }

  const columnPlan = resolveExplicitColumnPlan(parsedCells, context.expectedPlayerCount);
  const rowAssignments = assignParsedCellsToColumns(parsedCells, context.cricketRules, columnPlan);
  if (columnPlan.useExplicitPlayerIndexes) {
    context.hasIndexedPlayerColumns = true;
  }

  context.rowMetaByLabel.set(label, {
    label,
    labelNode: node,
    labelCell,
    badgeNode,
    rowNode,
    playerCells,
    playerCellsByIndex: rowAssignments.playerCellsByIndex,
  });
  context.marksByLabel[label] = rowAssignments.marksByPlayer.map((value) => {
    return context.cricketRules.clampMarks(value);
  });
  context.maxPlayerCount = Math.max(context.maxPlayerCount, context.marksByLabel[label].length);
}

export function buildGridRowSnapshot(options = {}) {
  const context = createRowRepairContext(options);

  context.gridLabels.forEach(({ node, label }) => {
    applyRowMetaForLabel(context, label, node);
  });

  if (context.cachedStableRows) {
    context.targetOrder.forEach((label) => {
      if (context.rowMetaByLabel.has(label)) {
        return;
      }
      const fallbackRowMeta = context.cachedStableRows.get(label);
      const stableLabelNode = resolveStableRowLabelNode(fallbackRowMeta, context.cricketRules, label);
      if (!stableLabelNode) {
        return;
      }
      applyRowMetaForLabel(context, label, stableLabelNode, fallbackRowMeta);
      if (context.rowMetaByLabel.has(label)) {
        context.recoveredStableLabels.push(label);
      }
    });
  }

  return {
    hasIndexedPlayerColumns: context.hasIndexedPlayerColumns,
    labelCellMarkSourceLabels: context.labelCellMarkSourceLabels,
    marksByLabel: context.marksByLabel,
    maxPlayerCount: context.maxPlayerCount,
    recoveredStableLabels: context.recoveredStableLabels,
    rowMetaByLabel: context.rowMetaByLabel,
    shortfallRepairLabels: context.shortfallRepairLabels,
  };
}
