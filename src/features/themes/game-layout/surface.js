import {
  readModernMatchSurface,
} from "../../shared/x01-match-surface.js";
import { NATIVE_BOARD_SELECTOR, findBoardSvgRoot } from "../../../shared/dartboard-svg.js";

function directChildContaining(parentNode, descendantNode) {
  if (!parentNode || !descendantNode || parentNode === descendantNode) return null;
  let current = descendantNode;
  while (current?.parentElement && current.parentElement !== parentNode) {
    current = current.parentElement;
  }
  return current?.parentElement === parentNode ? current : null;
}

function findStage(turnContainer, nativeBoard) {
  for (let node = turnContainer?.parentElement; node; node = node.parentElement) {
    const turnSlot = directChildContaining(node, turnContainer);
    const boardSlot = directChildContaining(node, nativeBoard);
    if (turnSlot && boardSlot && turnSlot !== boardSlot) {
      const remainingSlots = Array.from(node.children || []).filter(
        (child) => child !== turnSlot && child !== boardSlot
      );
      if (remainingSlots.length === 1 && remainingSlots[0].querySelector?.("button")) {
        return { stage: node, turnSlot, boardSlot, controlsSlot: remainingSlots[0] };
      }
    }
  }
  return null;
}

function findCardBody(cardNode, scoreNode) {
  return Array.from(cardNode?.children || []).find((child) => child.contains?.(scoreNode)) || null;
}

function findDirectDescendant(parentNode, descendantNode) {
  if (!parentNode || !descendantNode) return null;
  if (parentNode === descendantNode) return parentNode;
  return directChildContaining(parentNode, descendantNode);
}

function findScoreParts(scoreRegion, scoreNode) {
  const scoreValueNode = findDirectDescendant(scoreRegion, scoreNode);
  const legCandidates = Array.from(scoreRegion?.children || []).filter((child) =>
    child !== scoreValueNode && /^\d+$/.test(String(child.textContent || "").trim())
  );
  return {
    scoreValueNode,
    legsNode: legCandidates.length === 1 ? legCandidates[0] : null,
  };
}

function findPlayerStatusParts(content, nameRegion, scoreRegion) {
  const statRegions = Array.from(content?.children || []).filter(
    (child) => child !== nameRegion && child !== scoreRegion
  );
  const dartIndicatorNode = statRegions.length === 2 ? statRegions[1] : null;
  const dartIconCandidates = Array.from(dartIndicatorNode?.children || []).filter(
    (child) => child.matches?.("svg") || child.querySelector?.("svg")
  );
  return {
    statRegions,
    dartIndicatorNode,
    dartIconNode: dartIconCandidates.length === 1 ? dartIconCandidates[0] : null,
  };
}

function findControlBar(controlsSlot) {
  let current = controlsSlot;
  while (current && Array.from(current.children || []).length === 1) {
    current = current.children[0];
  }
  return current && current !== controlsSlot ? current : controlsSlot;
}

export function resolveModernX01GameLayoutSurface(documentRef, windowRef = documentRef?.defaultView) {
  const matchSurface = readModernMatchSurface(documentRef, windowRef);
  if (matchSurface.variant !== "X01" || !matchSurface.turnContainer || !matchSurface.variantNode) return null;

  const boardSvg = findBoardSvgRoot(documentRef);
  const nativeBoard = boardSvg?.closest?.(NATIVE_BOARD_SELECTOR) || null;
  if (!boardSvg || !nativeBoard) return null;

  const stageSurface = findStage(matchSurface.turnContainer, nativeBoard);
  const root = stageSurface?.stage?.parentElement || null;
  if (!stageSurface || !root) return null;

  const rootChildren = Array.from(root.children || []);
  const playerColumns = rootChildren.filter((child) => child !== stageSurface.stage);
  if (!playerColumns.length || playerColumns.length !== rootChildren.length - 1) return null;

  const players = matchSurface.players.map((player) => {
    const column = playerColumns.find((candidate) => candidate.contains?.(player.cardNode)) || null;
    const item = directChildContaining(column, player.cardNode);
    const body = findCardBody(player.cardNode, player.scoreNode);
    const content = findDirectDescendant(body, player.scoreNode?.parentElement) || null;
    const nameNode = player.cardNode.querySelector?.(".font-display") ||
      player.cardNode.querySelector?.('[role="button"]') || null;
    const nameRegion = findDirectDescendant(content, nameNode);
    const scoreRegion = findDirectDescendant(content, player.scoreNode);
    const { scoreValueNode, legsNode } = findScoreParts(scoreRegion, player.scoreNode);
    const { statRegions, dartIndicatorNode, dartIconNode } = findPlayerStatusParts(
      content,
      nameRegion,
      scoreRegion
    );
    const checkoutRail = Array.from(player.cardNode.children || []).find(
      (child) => child !== body && child.querySelector?.(".text-checkout-suggestion")
    ) || null;
    return {
      ...player,
      column,
      item,
      body,
      content,
      nameRegion,
      scoreRegion,
      scoreValueNode,
      legsNode,
      statRegions,
      dartIndicatorNode,
      dartIconNode,
      checkoutRail,
    };
  });

  if (
    !players.length ||
    players.some((player) =>
      !player.column || !player.item || !player.body || !player.content ||
      !player.nameRegion || !player.scoreRegion || !player.scoreValueNode || !player.legsNode ||
      player.statRegions.length !== 2 || !player.dartIndicatorNode || !player.dartIconNode
    ) ||
    new Set(players.map((player) => player.item)).size !== players.length
  ) {
    return null;
  }

  const boardFrame = directChildContaining(stageSurface.boardSlot, nativeBoard);
  const controlBar = findControlBar(stageSurface.controlsSlot);
  if (!boardFrame || !controlBar?.querySelector?.("button")) return null;

  return {
    ...stageSurface,
    root,
    variantNode: matchSurface.variantNode,
    boardSvg,
    nativeBoard,
    boardFrame,
    controlBar,
    playerColumns,
    players,
    activeIndex: players.findIndex((player) => player.active),
  };
}

export { MODERN_PLAYER_SELECTOR } from "../../shared/x01-match-surface.js";
