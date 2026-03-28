export const TURN_SURFACE_SELECTOR = "#ad-ext-turn";
export const TURN_THROW_ROW_SELECTOR = ".ad-ext-turn-throw";
export const TURN_POINTS_SELECTOR = ".ad-ext-turn-points";

function normalizeText(value) {
  return String(value || "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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

export function findTurnContainer(documentRef) {
  if (!documentRef || typeof documentRef.querySelector !== "function") {
    return null;
  }

  try {
    return documentRef.querySelector(TURN_SURFACE_SELECTOR);
  } catch (_) {
    return null;
  }
}

export function collectTurnThrowRows(documentRef) {
  const turnContainer = findTurnContainer(documentRef);
  if (turnContainer) {
    const scopedRows = queryAll(turnContainer, TURN_THROW_ROW_SELECTOR).filter((rowNode) => {
      return rowNode?.isConnected !== false;
    });
    const directRows = scopedRows.filter((rowNode) => rowNode?.parentElement === turnContainer);
    return directRows.length > 0 ? directRows : scopedRows;
  }

  return queryAll(documentRef, TURN_THROW_ROW_SELECTOR).filter((rowNode) => {
    return rowNode?.isConnected !== false;
  });
}

export function readTurnPointsToken(documentRef, options = {}) {
  const normalize = typeof options.normalizeText === "function" ? options.normalizeText : normalizeText;
  const turnContainer = options.turnContainer || findTurnContainer(documentRef);
  const scopedPointsNode =
    turnContainer && typeof turnContainer.querySelector === "function"
      ? turnContainer.querySelector(TURN_POINTS_SELECTOR)
      : null;

  if (scopedPointsNode) {
    return normalize(scopedPointsNode.textContent || "");
  }

  if (!documentRef || typeof documentRef.querySelector !== "function") {
    return "";
  }

  try {
    const fallbackPointsNode = documentRef.querySelector(TURN_POINTS_SELECTOR);
    return normalize(fallbackPointsNode?.textContent || "");
  } catch (_) {
    return "";
  }
}

export function collectTurnThrowTextNodes(documentRef, selectors = []) {
  const result = [];
  const seen = new Set();

  (Array.isArray(selectors) ? selectors : []).forEach((selector) => {
    queryAll(documentRef, selector).forEach((node) => {
      if (!node || seen.has(node)) {
        return;
      }
      seen.add(node);
      result.push(node);
    });
  });

  return result;
}
