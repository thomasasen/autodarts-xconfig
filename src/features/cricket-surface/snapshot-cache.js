import { findBoardSvgGroup, isReusableBoardSnapshot } from "../../shared/dartboard-svg.js";

export function resolveGridSnapshot(documentRef, cricketRules, targetOrder, cache, findGrid) {
  const resolvedCache = cache && typeof cache === "object" ? cache : null;
  if (resolvedCache?.grid?.root && resolvedCache.grid.root.isConnected !== false) {
    return resolvedCache.grid;
  }

  const nextGrid =
    typeof findGrid === "function"
      ? findGrid({
          documentRef,
          cricketRules,
          targetOrder,
        })
      : null;
  if (resolvedCache) {
    resolvedCache.grid = nextGrid;
  }
  return nextGrid;
}

export function resolveBoardSnapshot(documentRef, cache) {
  const resolvedCache = cache && typeof cache === "object" ? cache : null;
  if (isReusableBoardSnapshot(resolvedCache?.board, documentRef)) {
    return resolvedCache.board;
  }

  const nextBoard = findBoardSvgGroup(documentRef);
  if (resolvedCache) {
    resolvedCache.board = nextBoard;
  }
  return nextBoard;
}
