export const TURN_SURFACE_SELECTOR = "#ad-ext-turn";
export const TURN_THROW_ROW_SELECTOR = ".ad-ext-turn-throw";
export const TURN_SCORE_SELECTOR = ".ad-ext-turn-points";
export const TURN_SURFACE_MUTATION_ATTRIBUTE_FILTER = Object.freeze([
  "class",
  "style",
  "hidden",
  "aria-hidden",
  "data-state",
  "data-status",
  "aria-selected",
  "selected",
]);

export function createTurnSurfaceObserveOptions(options = {}) {
  const extraAttributeFilter = Array.isArray(options.attributeFilter)
    ? options.attributeFilter
    : [];
  const attributeFilter = Array.from(
    new Set(
      [...TURN_SURFACE_MUTATION_ATTRIBUTE_FILTER, ...extraAttributeFilter]
        .map((value) => String(value || "").trim())
        .filter(Boolean)
    )
  );

  return {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter,
  };
}

function normalizeText(value) {
  return String(value || "")
    .replaceAll("\u00a0", " ")
    .replaceAll(/\s+/g, " ")
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

function resolveRowSource(turnContainer, throwRows) {
  if (turnContainer) {
    return "turn-container";
  }
  if (throwRows.length > 0) {
    return "document-fallback";
  }
  return "none";
}

export function getTurnSurfaceSnapshot(documentRef, options = {}) {
  const turnContainer = findTurnContainer(documentRef);
  const throwRows = collectTurnThrowRows(documentRef);
  const turnScoreToken = readTurnScoreToken(documentRef, {
    turnContainer,
    normalizeText: options.normalizeText,
  });

  return {
    turnContainer,
    throwRows,
    turnScoreToken,
    rowSource: resolveRowSource(turnContainer, throwRows),
  };
}

export function readTurnScoreToken(documentRef, options = {}) {
  const normalize = typeof options.normalizeText === "function" ? options.normalizeText : normalizeText;
  const turnContainer = options.turnContainer || findTurnContainer(documentRef);
  const scopedPointsNode =
    turnContainer && typeof turnContainer.querySelector === "function"
      ? turnContainer.querySelector(TURN_SCORE_SELECTOR)
      : null;

  if (scopedPointsNode) {
    return normalize(scopedPointsNode.textContent || "");
  }

  if (!documentRef || typeof documentRef.querySelector !== "function") {
    return "";
  }

  try {
    const fallbackPointsNode = documentRef.querySelector(TURN_SCORE_SELECTOR);
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
