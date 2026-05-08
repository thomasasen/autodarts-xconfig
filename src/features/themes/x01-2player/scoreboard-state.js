export const X01_TWO_PLAYER_CURRENT_REMAINING_ATTRIBUTE =
  "data-ad-ext-x01-2player-current-remaining";
export const X01_TWO_PLAYER_STALE_REMAINING_ATTRIBUTE =
  "data-ad-ext-x01-2player-stale-remaining";
export const X01_TWO_PLAYER_STALE_REMAINING_CLASS =
  "ad-ext-x01-2player-stale-remaining";

function normalizeRemainingText(value) {
  return String(value || "")
    .replaceAll(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function isRemainingValueText(value) {
  const normalized = normalizeRemainingText(value);
  return /^-?\d+$/.test(normalized) || normalized === "OUT";
}

function toArray(value) {
  return Array.isArray(value) ? value : Array.from(value || []);
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

function getDirectTableCells(rowNode) {
  return toArray(rowNode?.children).filter((node) => {
    const tagName = String(node?.tagName || "").toUpperCase();
    return tagName === "TD" || tagName === "TH";
  });
}

function getRemainingCell(rowNode) {
  const cells = getDirectTableCells(rowNode);
  return cells.length >= 2 ? cells.at(-1) : null;
}

function clearRemainingCellState(cellNode) {
  cellNode?.classList?.remove?.(X01_TWO_PLAYER_STALE_REMAINING_CLASS);
  cellNode?.removeAttribute?.(X01_TWO_PLAYER_CURRENT_REMAINING_ATTRIBUTE);
  cellNode?.removeAttribute?.(X01_TWO_PLAYER_STALE_REMAINING_ATTRIBUTE);
}

function setAttributeIfChanged(node, attributeName, value) {
  if (!node || typeof node.setAttribute !== "function") {
    return;
  }

  const normalizedValue = String(value);
  if (node.getAttribute?.(attributeName) === normalizedValue) {
    return;
  }

  node.setAttribute(attributeName, normalizedValue);
}

function applyRemainingCellState(cellNode, rowState) {
  if (!cellNode || !rowState?.hasRemainingValue) {
    return;
  }

  setAttributeIfChanged(
    cellNode,
    X01_TWO_PLAYER_CURRENT_REMAINING_ATTRIBUTE,
    rowState.isCurrentRemaining ? "true" : "false"
  );
  setAttributeIfChanged(
    cellNode,
    X01_TWO_PLAYER_STALE_REMAINING_ATTRIBUTE,
    rowState.isStaleRemaining ? "true" : "false"
  );
  cellNode.classList?.toggle?.(
    X01_TWO_PLAYER_STALE_REMAINING_CLASS,
    rowState.shouldStrikeRemaining
  );
}

export function deriveX01TwoPlayerScoreboardRowState(rows = []) {
  const rowStates = toArray(rows).map((row, index) => {
    const remainingText = normalizeRemainingText(
      row?.remainingText ?? row?.remainingValue ?? row?.remaining ?? ""
    );
    const hasRemainingValue = isRemainingValueText(remainingText);

    return {
      ...row,
      index,
      hasRemainingValue,
      isCurrentRemaining: false,
      isStaleRemaining: false,
      remainingText,
      shouldStrikeRemaining: false,
    };
  });

  const currentRemainingIndex = rowStates.findLastIndex((rowState) => {
    return rowState.hasRemainingValue;
  });

  if (currentRemainingIndex < 0) {
    return rowStates;
  }

  return rowStates.map((rowState, index) => {
    const isCurrentRemaining = rowState.hasRemainingValue && index === currentRemainingIndex;
    const isStaleRemaining = rowState.hasRemainingValue && index !== currentRemainingIndex;

    return {
      ...rowState,
      isCurrentRemaining,
      isStaleRemaining,
      shouldStrikeRemaining: isStaleRemaining,
    };
  });
}

function readTableRowState(rowNode) {
  const remainingCell = getRemainingCell(rowNode);
  return {
    remainingCell,
    remainingText: remainingCell?.textContent || "",
    rowNode,
  };
}

function syncScoreboardTableState(tableNode) {
  const rows = queryAll(tableNode, "tr").map((rowNode) => readTableRowState(rowNode));
  const rowStates = deriveX01TwoPlayerScoreboardRowState(rows);

  rowStates.forEach((rowState) => {
    if (!rowState.remainingCell) {
      return;
    }

    if (rowState.hasRemainingValue) {
      applyRemainingCellState(rowState.remainingCell, rowState);
    } else {
      clearRemainingCellState(rowState.remainingCell);
    }
  });
}

export function syncX01TwoPlayerScoreboardState(playerCardNode) {
  queryAll(playerCardNode, "table").forEach((tableNode) => {
    syncScoreboardTableState(tableNode);
  });
}

export function clearX01TwoPlayerScoreboardState(rootNode) {
  queryAll(
    rootNode,
    [
      `.${X01_TWO_PLAYER_STALE_REMAINING_CLASS}`,
      `[${X01_TWO_PLAYER_CURRENT_REMAINING_ATTRIBUTE}]`,
      `[${X01_TWO_PLAYER_STALE_REMAINING_ATTRIBUTE}]`,
    ].join(",")
  ).forEach((cellNode) => {
    clearRemainingCellState(cellNode);
  });
}

export function isX01TwoPlayerScoreboardStateMutation(mutation) {
  const attributeName = String(mutation?.attributeName || "");
  if (
    attributeName === X01_TWO_PLAYER_CURRENT_REMAINING_ATTRIBUTE ||
    attributeName === X01_TWO_PLAYER_STALE_REMAINING_ATTRIBUTE
  ) {
    return true;
  }

  if (attributeName !== "class") {
    return false;
  }

  const tagName = String(mutation?.target?.tagName || "").toUpperCase();
  return tagName === "TD" || tagName === "TH";
}
