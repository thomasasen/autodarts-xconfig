import { findBoardSvgGroup } from "../../shared/dartboard-svg.js";

export function resolveGridSnapshot(documentRef, cricketRules, targetOrder, cache = null, findGrid) {
  if (cache?.grid?.root && cache.grid.root.isConnected !== false) {
    return cache.grid;
  }

  const nextGrid =
    typeof findGrid === "function"
      ? findGrid({
          documentRef,
          cricketRules,
          targetOrder,
        })
      : null;
  if (cache && typeof cache === "object") {
    cache.grid = nextGrid;
  }
  return nextGrid;
}

export function resolveBoardSnapshot(documentRef, cache = null) {
  if (cache?.board?.group && cache.board.group.isConnected !== false) {
    return cache.board;
  }

  const nextBoard = findBoardSvgGroup(documentRef);
  if (cache && typeof cache === "object") {
    cache.board = nextBoard;
  }
  return nextBoard;
}
