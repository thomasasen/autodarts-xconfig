import { findBoardSvgGroup } from "../../../shared/dartboard-svg.js";
import {
  isBoardInputModeControl,
} from "../../../shared/board-input-mode.js";
import {
  CRICKET_ACTIVE_PLAYER_ATTRIBUTE,
  CRICKET_IDENTITY_SHELL_ATTRIBUTE,
  CRICKET_META_ATTRIBUTE,
  CRICKET_META_SHELL_ATTRIBUTE,
  CRICKET_ROW_ATTRIBUTE,
  CRICKET_SLOT_ATTRIBUTE,
  CRICKET_STACK_ATTRIBUTE,
  THEME_CRICKET_READABILITY,
  THEME_LAYOUT_HOOK_CLASSES,
} from "./theme-layout-contract.js";
const BOARD_SIZE_CSS_VARIABLE = "--ad-ext-theme-board-size";
const CRICKET_BOARD_WIDTH_CSS_VARIABLE = "--ad-ext-theme-cricket-board-width";
const CRICKET_PLAYER_COLUMN_WIDTH_CSS_VARIABLE = "--ad-ext-theme-cricket-player-column-width";
const CRICKET_PLAYER_COLUMN_MAX_WIDTH_CSS_VARIABLE =
  "--ad-ext-theme-cricket-player-column-max-width";
const CRICKET_PLAYER_AREA_REQUIRED_WIDTH_CSS_VARIABLE =
  "--ad-ext-theme-cricket-player-area-required-width";
const CRICKET_PLAYER_COUNT_CSS_VARIABLE = "--ad-ext-theme-cricket-player-count";
const CRICKET_THEME_FEATURE_KEY = "theme-cricket";
const CRICKET_READABILITY_POLICY = Object.freeze({
  playerCardMinWidthPx: 228,
  playerCardGapPx: 0,
  playerAreaPaddingPx: 12,
  contentGapPx: 8,
  boardAutoMinWidthPx: 288,
  boardManualMinWidthPx: 160,
});
export function createCricketReadabilityState() {
  return {
    contentSlotNode: null,
    manualOverride: null,
    isConstrained: false,
    boardHidden: false,
    boardAutoHidden: false,
    boardForcedVisible: false,
    boardWidthPx: 0,
    playerColumnWidthPx: 0,
    playerAreaRequiredWidthPx: 0,
    noticeNode: null,
    noticeTextNode: null,
    toggleNode: null,
    toggleHandler: null,
  };
}

function getElementChildren(node) {
  if (!node || typeof node !== "object" || !node.children) {
    return [];
  }
  return Array.from(node.children).filter((child) => child && child.nodeType === 1);
}

function countButtons(rootNode) {
  if (!rootNode || typeof rootNode.querySelectorAll !== "function") {
    return 0;
  }
  try {
    return rootNode.querySelectorAll("button").length;
  } catch (_) {
    return 0;
  }
}

function findBoardSvg(documentRef) {
  return findBoardSvgGroup(documentRef)?.svg || null;
}

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function isInteractiveControlAncestor(node) {
  let current = node?.parentElement || node?.parentNode || null;
  let depth = 0;

  while (current && depth < 8) {
    const tagName = normalizeText(current.tagName || current.nodeName);
    const role = normalizeText(current.getAttribute?.("role"));
    const inputType = normalizeText(current.getAttribute?.("type"));
    if (
      tagName === "button" ||
      role === "button" ||
      role === "tab" ||
      role === "radio" ||
      (tagName === "input" && inputType === "radio")
    ) {
      return true;
    }
    current = current.parentElement || current.parentNode || null;
    depth += 1;
  }

  return false;
}

function hasExactBoardViewBox(node) {
  if (!node || typeof node.getAttribute !== "function") {
    return false;
  }

  const rawViewBox = String(node.getAttribute("viewBox") || "")
    .trim()
    .replaceAll(/,/g, " ")
    .replaceAll(/\s+/g, " ");
  return rawViewBox === "0 0 1000 1000";
}

function hasBoardBackdropImage(node) {
  if (!node || typeof node.querySelectorAll !== "function") {
    return false;
  }

  try {
    return Array.from(node.querySelectorAll("img")).some((candidate) => {
      if (!candidate || candidate.isConnected === false) {
        return false;
      }
      return !isInteractiveControlAncestor(candidate);
    });
  } catch (_) {
    return false;
  }
}

function getLayoutFallbackBoardSvgScore(svgNode, documentRef) {
  if (!svgNode || typeof svgNode.closest !== "function") {
    return 0;
  }

  if (svgNode.isConnected === false || isInteractiveControlAncestor(svgNode)) {
    return 0;
  }

  if (!hasExactBoardViewBox(svgNode)) {
    return 0;
  }

  const showAnimations = svgNode.closest(".showAnimations");
  if (!showAnimations) {
    return 0;
  }

  const boardPanel = resolveBoardPanel(svgNode, documentRef);
  if (!boardPanel || countButtons(boardPanel) <= 0) {
    return 0;
  }

  const mediaCandidates = [
    svgNode.parentElement || null,
    svgNode.parentElement?.parentElement || null,
    showAnimations,
  ].filter(Boolean);
  const hasBackdropImage = mediaCandidates.some((candidate) => hasBoardBackdropImage(candidate));
  if (!hasBackdropImage) {
    return 0;
  }

  const width = getElementWidth(svgNode);
  const height = getElementHeight(svgNode);
  const minDimension = Math.min(width, height);
  if (!Number.isFinite(minDimension) || minDimension < 240) {
    return 0;
  }

  return Math.floor(width * height) + minDimension;
}

function findBoardLayoutFallbackSvg(documentRef) {
  if (!documentRef || typeof documentRef.querySelectorAll !== "function") {
    return null;
  }

  const svgNodes = Array.from(documentRef.querySelectorAll("svg"));
  if (!svgNodes.length) {
    return null;
  }

  let bestNode = null;
  let bestScore = 0;

  svgNodes.forEach((svgNode) => {
    const score = getLayoutFallbackBoardSvgScore(svgNode, documentRef);
    if (score > bestScore) {
      bestScore = score;
      bestNode = svgNode;
    }
  });

  return bestNode;
}

function shouldKeepImageBackedLayoutHooks(targets) {
  if (!targets || typeof targets !== "object") {
    return false;
  }

  const connectedLayoutNodes = [
    targets.contentSlot,
    targets.contentBoard,
    targets.boardPanel,
  ].filter(Boolean);
  if (!connectedLayoutNodes.length) {
    return false;
  }
  if (connectedLayoutNodes.some((node) => node.isConnected === false)) {
    return false;
  }

  const boardSurfaceCandidates = [
    targets.boardCanvas,
    targets.boardEventShell,
    targets.boardPanel,
  ].filter(Boolean);
  return boardSurfaceCandidates.some((candidate) => {
    return candidate.isConnected !== false && hasBoardBackdropImage(candidate);
  });
}

function isLikelyBoardMediaWrapper(node, boardSvg) {
  if (!node || !boardSvg || node === boardSvg) {
    return false;
  }

  if (!elementContains(node, boardSvg)) {
    return false;
  }

  if (
    node.classList?.contains?.("showAnimations") ||
    node.classList?.contains?.(THEME_LAYOUT_HOOK_CLASSES.boardCanvas) ||
    node.classList?.contains?.(THEME_LAYOUT_HOOK_CLASSES.boardMediaRoot)
  ) {
    return true;
  }

  if (countButtons(node) > 0) {
    return false;
  }

  const children = getElementChildren(node);
  if (!children.length) {
    return false;
  }

  const boardChildCount = children.filter((child) => elementContains(child, boardSvg)).length;
  if (boardChildCount !== 1) {
    return false;
  }

  return children.length <= 2;
}

function isImageBackedBoardMediaRoot(node, boardSvg) {
  if (!node || !boardSvg || node === boardSvg) {
    return false;
  }

  if (!elementContains(node, boardSvg) || countButtons(node) > 0) {
    return false;
  }

  const children = getElementChildren(node);
  if (children.length < 2 || children.length > 3) {
    return false;
  }

  const imageChildCount = children.filter((child) => {
    const tagName = normalizeText(child.tagName || child.nodeName);
    return tagName === "img";
  }).length;
  const boardChildCount = children.filter((child) => elementContains(child, boardSvg)).length;
  return imageChildCount >= 1 && boardChildCount === 1;
}

function isImageBackedBoardLayout(boardCanvas, boardMediaRoot) {
  if (!boardCanvas || !boardMediaRoot || boardMediaRoot === boardCanvas) {
    return false;
  }

  return hasBoardBackdropImage(boardMediaRoot) || hasBoardBackdropImage(boardCanvas);
}

export function resolveThemeBoardCanvasTarget(boardSvg) {
  if (!boardSvg || typeof boardSvg.closest !== "function") {
    return null;
  }

  const stableBoardCanvas = boardSvg.closest(".ad-ext-theme-board-canvas");
  const showAnimations = boardSvg.closest(".showAnimations");
  const directParent = boardSvg.parentElement || null;
  const imageBackedMediaRoot =
    directParent && isImageBackedBoardMediaRoot(directParent, boardSvg) ? directParent : null;
  const parentWrapper = imageBackedMediaRoot?.parentElement || null;

  if (stableBoardCanvas) {
    if (imageBackedMediaRoot) {
      return stableBoardCanvas;
    }
    if (
      directParent &&
      directParent !== stableBoardCanvas &&
      !isImageBackedBoardMediaRoot(directParent, boardSvg) &&
      isLikelyBoardMediaWrapper(directParent, boardSvg)
    ) {
      return directParent;
    }
    return stableBoardCanvas;
  }

  if (showAnimations) {
    if (
      imageBackedMediaRoot &&
      parentWrapper &&
      parentWrapper !== showAnimations &&
      isLikelyBoardMediaWrapper(parentWrapper, boardSvg)
    ) {
      return parentWrapper;
    }
    if (
      directParent &&
      directParent !== showAnimations &&
      isLikelyBoardMediaWrapper(directParent, boardSvg)
    ) {
      return directParent;
    }
    return showAnimations;
  }

  if (directParent && isLikelyBoardMediaWrapper(directParent, boardSvg)) {
    return directParent;
  }

  return boardSvg;
}

export function resolveThemeBoardViewportTarget(boardCanvas, boardSvg) {
  if (boardSvg && typeof boardSvg.closest === "function") {
    const showAnimations = boardSvg.closest(".showAnimations");
    if (
      boardCanvas &&
      showAnimations &&
      boardCanvas !== showAnimations
    ) {
      return showAnimations.parentElement || boardCanvas.parentElement || null;
    }
  }

  return boardCanvas?.parentElement || boardSvg?.parentElement || null;
}

function resolveThemeBoardEventTargets(boardCanvas, boardSvg) {
  if (!boardCanvas || !boardSvg || typeof boardSvg.closest !== "function") {
    return {
      boardEventShell: null,
      boardMediaRoot: null,
    };
  }

  const showAnimations = boardSvg.closest(".showAnimations");
  if (!showAnimations || boardCanvas === showAnimations) {
    return {
      boardEventShell: null,
      boardMediaRoot: null,
    };
  }

  const directParent = boardSvg.parentElement || null;
  const imageBackedMediaRoot =
    directParent && isImageBackedBoardMediaRoot(directParent, boardSvg) ? directParent : null;

  return {
    boardEventShell: showAnimations,
    boardMediaRoot:
      imageBackedMediaRoot && imageBackedMediaRoot !== boardCanvas
        ? imageBackedMediaRoot
        : boardCanvas,
  };
}

function elementContains(rootNode, targetNode) {
  if (!rootNode || !targetNode || typeof rootNode !== "object" || typeof targetNode !== "object") {
    return false;
  }
  if (rootNode === targetNode) {
    return true;
  }
  if (typeof rootNode.contains === "function") {
    return rootNode.contains(targetNode);
  }

  let current = targetNode.parentNode || null;
  while (current) {
    if (current === rootNode) {
      return true;
    }
    current = current.parentNode || null;
  }
  return false;
}

function resolveBoardPanel(boardSvg, documentRef) {
  if (!boardSvg) {
    return null;
  }

  let current = boardSvg.parentElement || null;
  while (current && current !== documentRef?.body && current !== documentRef?.documentElement) {
    const currentTag = normalizeText(current.tagName || current.nodeName);
    if (currentTag === "main" || currentTag === "body" || currentTag === "html") {
      current = current.parentElement || null;
      continue;
    }

    const children = getElementChildren(current);
    if (children.length >= 2 && children.length <= 6) {
      const hasBoardChild = children.some((child) => elementContains(child, boardSvg));
      const hasControlsSibling = children.some((child) => {
        if (elementContains(child, boardSvg)) {
          return false;
        }
        return countButtons(child) > 0;
      });
      if (hasBoardChild && hasControlsSibling) {
        return current;
      }
    }
    current = current.parentElement || null;
  }
  return null;
}

function resolveBoardControls(panelNode, boardSvg) {
  const children = getElementChildren(panelNode);
  if (!children.length) {
    return null;
  }

  let bestNode = null;
  let bestScore = -1;
  children.forEach((child) => {
    if (elementContains(child, boardSvg)) {
      return;
    }
    const buttonCount = countButtons(child);
    if (buttonCount <= 0) {
      return;
    }
    const score = buttonCount * 100 + getElementChildren(child).length;
    if (score > bestScore) {
      bestScore = score;
      bestNode = child;
    }
  });

  return bestNode;
}

function findSharedAncestor(firstNode, secondNode, stopNode) {
  if (!firstNode || !secondNode) {
    return null;
  }

  const ancestors = new Set();
  let current = firstNode;
  while (current) {
    ancestors.add(current);
    if (current === stopNode) {
      break;
    }
    current = current.parentElement || current.parentNode || null;
  }

  current = secondNode;
  while (current) {
    if (ancestors.has(current)) {
      return current;
    }
    if (current === stopNode) {
      break;
    }
    current = current.parentElement || current.parentNode || null;
  }

  return null;
}

function findDirectChildContaining(rootNode, targetNode) {
  if (!rootNode || !targetNode || rootNode === targetNode) {
    return null;
  }

  let current = targetNode;
  let parent = current.parentElement || current.parentNode || null;
  while (current && parent && parent !== rootNode) {
    current = parent;
    parent = current.parentElement || current.parentNode || null;
  }
  return parent === rootNode ? current : null;
}

function getElementWidth(node) {
  if (!node || typeof node.getBoundingClientRect !== "function") {
    return 0;
  }

  try {
    const rect = node.getBoundingClientRect();
    const width = Number.parseFloat(rect?.width);
    return Number.isFinite(width) && width > 0 ? width : 0;
  } catch (_) {
    return 0;
  }
}

function getElementHeight(node) {
  if (!node || typeof node.getBoundingClientRect !== "function") {
    return 0;
  }

  try {
    const rect = node.getBoundingClientRect();
    const height = Number.parseFloat(rect?.height);
    return Number.isFinite(height) && height > 0 ? height : 0;
  } catch (_) {
    return 0;
  }
}

function getElementScrollWidth(node) {
  if (!node || typeof node !== "object") {
    return 0;
  }

  const width = Number.parseFloat(node.scrollWidth);
  return Number.isFinite(width) && width > 0 ? width : 0;
}

function getElementClientWidth(node) {
  if (!node || typeof node !== "object") {
    return 0;
  }

  const width = Number.parseFloat(node.clientWidth);
  return Number.isFinite(width) && width > 0 ? width : 0;
}

function getSmallestPositiveDimension(values = []) {
  const normalized = values
    .map((value) => Number.parseFloat(value))
    .filter((value) => Number.isFinite(value) && value > 0);
  if (!normalized.length) {
    return 0;
  }
  return Math.min(...normalized);
}

function clearBoardSizeVariable(node) {
  if (!node || !node.style || typeof node.style.removeProperty !== "function") {
    return;
  }
  node.style.removeProperty(BOARD_SIZE_CSS_VARIABLE);
}

function updateBoardSizeVariable(node, sizingNode = null, options = {}) {
  if (!node || !node.style || typeof node.style.setProperty !== "function") {
    return;
  }

  const measurementNode = sizingNode || node;
  const width = getElementWidth(measurementNode);
  const height = getElementHeight(measurementNode);
  const maxSizePx = getSmallestPositiveDimension([
    options.maxSizePx,
    options.maxWidthPx,
    options.maxHeightPx,
  ]);
  const boardSize = Math.floor(
    maxSizePx > 0 ? Math.min(width, height, maxSizePx) : Math.min(width, height)
  );
  if (!Number.isFinite(boardSize) || boardSize <= 0) {
    clearBoardSizeVariable(node);
    return;
  }

  node.style.setProperty(BOARD_SIZE_CSS_VARIABLE, `${boardSize}px`);
}

function clearStyleVariable(node, variableName) {
  if (
    !node ||
    !node.style ||
    typeof node.style.removeProperty !== "function" ||
    !variableName
  ) {
    return;
  }
  node.style.removeProperty(variableName);
}

function updateStyleVariable(node, variableName, value) {
  if (
    !node ||
    !node.style ||
    typeof node.style.setProperty !== "function" ||
    !variableName
  ) {
    return;
  }
  node.style.setProperty(variableName, String(value));
}

function resolveContentLayoutCandidate(contentSlot, playerDisplay, boardSvg) {
  if (!contentSlot || !playerDisplay || !boardSvg) {
    return null;
  }

  const contentLeft = findDirectChildContaining(contentSlot, playerDisplay);
  const contentBoard = findDirectChildContaining(contentSlot, boardSvg);
  if (!contentLeft || !contentBoard || contentLeft === contentBoard) {
    return null;
  }

  const slotChildren = getElementChildren(contentSlot);
  if (!slotChildren.includes(contentLeft) || !slotChildren.includes(contentBoard)) {
    return null;
  }

  return {
    contentSlot,
    contentLeft,
    contentBoard,
  };
}

export function selectWidestContentLayoutCandidate(candidates = []) {
  if (!Array.isArray(candidates) || !candidates.length) {
    return null;
  }

  let bestCandidate = null;
  let bestMeta = null;

  candidates.forEach((candidate, index) => {
    if (!candidate || !candidate.contentSlot || !candidate.contentLeft || !candidate.contentBoard) {
      return;
    }

    const meta = {
      width: Number.isFinite(candidate.width) ? candidate.width : getElementWidth(candidate.contentSlot),
      ancestorDepth: Number.isFinite(candidate.ancestorDepth) ? candidate.ancestorDepth : Number.POSITIVE_INFINITY,
      collapseDepth: Number.isFinite(candidate.collapseDepth) ? candidate.collapseDepth : Number.POSITIVE_INFINITY,
      index,
    };

    if (!bestCandidate) {
      bestCandidate = candidate;
      bestMeta = meta;
      return;
    }

    if (meta.width > bestMeta.width) {
      bestCandidate = candidate;
      bestMeta = meta;
      return;
    }

    if (meta.width < bestMeta.width) {
      return;
    }

    if (meta.ancestorDepth < bestMeta.ancestorDepth) {
      bestCandidate = candidate;
      bestMeta = meta;
      return;
    }

    if (meta.ancestorDepth > bestMeta.ancestorDepth) {
      return;
    }

    if (meta.collapseDepth < bestMeta.collapseDepth) {
      bestCandidate = candidate;
      bestMeta = meta;
      return;
    }

    if (meta.collapseDepth > bestMeta.collapseDepth) {
      return;
    }

    if (meta.index < bestMeta.index) {
      bestCandidate = candidate;
      bestMeta = meta;
    }
  });

  return bestCandidate
    ? {
        contentSlot: bestCandidate.contentSlot,
        contentLeft: bestCandidate.contentLeft,
        contentBoard: bestCandidate.contentBoard,
      }
    : null;
}

function resolveContentLayoutTargets(documentRef, boardSvg) {
  const playerDisplay = documentRef?.getElementById?.("ad-ext-player-display");
  if (!playerDisplay || !boardSvg) {
    return null;
  }

  const stopNode = documentRef?.body || null;
  const sharedAncestor = findSharedAncestor(playerDisplay, boardSvg, stopNode);
  if (
    !sharedAncestor ||
    sharedAncestor === documentRef?.body ||
    sharedAncestor === documentRef?.documentElement
  ) {
    return null;
  }

  const candidates = [];
  const seenSlots = new Set();
  let ancestor = sharedAncestor;
  for (
    let ancestorDepth = 0;
    ancestorDepth < 12 && ancestor && ancestor !== documentRef?.body && ancestor !== documentRef?.documentElement;
    ancestorDepth += 1
  ) {
    let contentSlot = ancestor;
    for (let collapseDepth = 0; collapseDepth < 12 && contentSlot; collapseDepth += 1) {
      const directCandidate = resolveContentLayoutCandidate(contentSlot, playerDisplay, boardSvg);
      if (directCandidate) {
        if (!seenSlots.has(directCandidate.contentSlot)) {
          seenSlots.add(directCandidate.contentSlot);
          candidates.push({
            ...directCandidate,
            width: getElementWidth(directCandidate.contentSlot),
            ancestorDepth,
            collapseDepth,
          });
        }
        break;
      }

      const contentLeft = findDirectChildContaining(contentSlot, playerDisplay);
      const contentBoard = findDirectChildContaining(contentSlot, boardSvg);
      if (!contentLeft || !contentBoard || contentLeft !== contentBoard) {
        break;
      }

      contentSlot = contentLeft;
    }
    ancestor = ancestor.parentElement || ancestor.parentNode || null;
  }

  return selectWidestContentLayoutCandidate(candidates);
}

function hasCompleteContentLayoutTargets(contentTargets) {
  return (
    Boolean(contentTargets?.contentSlot) &&
    Boolean(contentTargets?.contentLeft) &&
    Boolean(contentTargets?.contentBoard)
  );
}

function isBoardLayoutContextConsistent(targets) {
  if (!targets || !targets.boardSvg || !targets.boardPanel || !targets.boardViewport || !targets.boardCanvas) {
    return false;
  }

  if (targets.boardPanel === targets.boardCanvas) {
    return false;
  }

  if (!elementContains(targets.boardPanel, targets.boardCanvas)) {
    return false;
  }

  if (!elementContains(targets.boardPanel, targets.boardSvg)) {
    return false;
  }

  if (targets.boardViewport !== targets.boardPanel) {
    if (findDirectChildContaining(targets.boardPanel, targets.boardViewport) !== targets.boardViewport) {
      return false;
    }
    if (!elementContains(targets.boardPanel, targets.boardViewport)) {
      return false;
    }
  }

  if (targets.boardViewport === targets.boardCanvas) {
    return false;
  }

  if (!elementContains(targets.boardViewport, targets.boardCanvas)) {
    return false;
  }

  if (!elementContains(targets.boardViewport, targets.boardSvg)) {
    return false;
  }

  if (targets.boardControls && !elementContains(targets.boardPanel, targets.boardControls)) {
    return false;
  }

  if (
    targets.boardControls &&
    findDirectChildContaining(targets.boardPanel, targets.boardControls) !== targets.boardControls
  ) {
    return false;
  }

  const hasAnyContentTarget = Boolean(
    targets.contentSlot || targets.contentLeft || targets.contentBoard
  );
  if (!hasAnyContentTarget) {
    return true;
  }

  if (!hasCompleteContentLayoutTargets(targets)) {
    return false;
  }

  if (!elementContains(targets.contentSlot, targets.contentLeft)) {
    return false;
  }

  if (!elementContains(targets.contentSlot, targets.contentBoard)) {
    return false;
  }

  return true;
}

function resolveBoardLayoutTargets(documentRef) {
  const boardSvg = findBoardSvg(documentRef) || findBoardLayoutFallbackSvg(documentRef);
  if (!boardSvg) {
    return {
      status: "missing-board",
      targets: null,
    };
  }

  const rawContentTargets = resolveContentLayoutTargets(documentRef, boardSvg) || {};
  const hasCompleteContentTargets = hasCompleteContentLayoutTargets(rawContentTargets);
  const hasPartialContentTargets =
    Boolean(rawContentTargets.contentSlot || rawContentTargets.contentLeft || rawContentTargets.contentBoard) &&
    !hasCompleteContentTargets;
  const contentTargets = hasCompleteContentTargets ? rawContentTargets : {};
  const boardCanvas = resolveThemeBoardCanvasTarget(boardSvg);
  const boardEventTargets = resolveThemeBoardEventTargets(boardCanvas, boardSvg);
  const boardViewport = resolveThemeBoardViewportTarget(boardCanvas, boardSvg);
  const boardPanel = resolveBoardPanel(boardSvg, documentRef);
  const boardControls = boardPanel ? resolveBoardControls(boardPanel, boardSvg) : null;

  const targets = {
    ...(hasCompleteContentTargets ? contentTargets : {}),
    boardPanel,
    boardImageBackedMode: isImageBackedBoardLayout(boardCanvas, boardEventTargets.boardMediaRoot)
      ? boardPanel
      : null,
    boardControls,
    boardViewport,
    ...boardEventTargets,
    boardCanvas,
    boardSvg,
  };

  if (hasPartialContentTargets || !isBoardLayoutContextConsistent(targets)) {
    return {
      status: "invalid-context",
      targets: null,
    };
  }

  return {
    status: "valid",
    targets,
  };
}

function hasBoardInputModeMutation(mutations = []) {
  if (!Array.isArray(mutations) || !mutations.length) {
    return false;
  }

  return mutations.some((mutation) => {
    const nodes = [
      mutation?.target || null,
      ...Array.from(mutation?.addedNodes || []),
      ...Array.from(mutation?.removedNodes || []),
    ].filter(Boolean);

    return nodes.some((node) => {
      if (isBoardInputModeControl(node)) {
        return true;
      }

      if (typeof node?.querySelectorAll !== "function") {
        return false;
      }

      try {
        return Array.from(
          node.querySelectorAll(
            "button, [role='button'], [role='tab'], [role='radio'], input[type='radio']"
          )
        ).some((candidate) => isBoardInputModeControl(candidate));
      } catch (_) {
        return false;
      }
    });
  });
}

function removeClass(node, className) {
  if (!node || !className || !node.classList || typeof node.classList.remove !== "function") {
    return;
  }
  node.classList.remove(className);
}

function addClass(node, className) {
  if (!node || !className || !node.classList || typeof node.classList.add !== "function") {
    return;
  }
  node.classList.add(className);
}

function toggleClass(node, className, enabled) {
  if (!node || !className || !node.classList || typeof node.classList.toggle !== "function") {
    return;
  }
  node.classList.toggle(className, Boolean(enabled));
}

function clearBoardLayoutHooks(state) {
  const previous = state?.layoutHookTargets || {};
  clearBoardSizeVariable(previous.boardCanvas);
  if (previous.boardEventShell && previous.boardEventShell !== previous.boardCanvas) {
    clearBoardSizeVariable(previous.boardEventShell);
  }
  Object.entries(THEME_LAYOUT_HOOK_CLASSES).forEach(([key, className]) => {
    removeClass(previous[key], className);
  });
  state.layoutHookTargets = {};
}

function areLayoutHookTargetsConnected(targets) {
  if (!targets || typeof targets !== "object") {
    return false;
  }
  const relevantNodes = [
    targets.boardSvg,
    targets.boardCanvas,
    targets.boardViewport,
    targets.boardPanel,
    targets.contentSlot,
    targets.contentLeft,
    targets.contentBoard,
  ].filter(Boolean);
  if (!relevantNodes.length) {
    return false;
  }
  return relevantNodes.every((node) => node.isConnected !== false);
}

function updateBoardLayoutHooks(documentRef, state) {
  const resolution = resolveBoardLayoutTargets(documentRef);
  const nextTargets = resolution?.targets || {};
  const previous = state.layoutHookTargets || {};

  if (!resolution || resolution.status === "missing-board") {
    if (shouldKeepImageBackedLayoutHooks(previous)) {
      return;
    }
    clearBoardLayoutHooks(state);
    return;
  }

  if (resolution.status !== "valid") {
    if (!areLayoutHookTargetsConnected(previous)) {
      clearBoardLayoutHooks(state);
    }
    return;
  }

  if (previous.boardCanvas && previous.boardCanvas !== nextTargets.boardCanvas) {
    clearBoardSizeVariable(previous.boardCanvas);
  }
  if (
    previous.boardEventShell &&
    previous.boardEventShell !== nextTargets.boardEventShell &&
    previous.boardEventShell !== previous.boardCanvas
  ) {
    clearBoardSizeVariable(previous.boardEventShell);
  }

  Object.entries(THEME_LAYOUT_HOOK_CLASSES).forEach(([key, className]) => {
    if (previous[key] && previous[key] !== nextTargets[key]) {
      removeClass(previous[key], className);
    }
  });

  Object.entries(THEME_LAYOUT_HOOK_CLASSES).forEach(([key, className]) => {
    addClass(nextTargets[key], className);
  });

  updateBoardSizeVariable(
    nextTargets.boardCanvas,
    nextTargets.boardViewport || nextTargets.boardPanel || nextTargets.boardCanvas
  );
  if (
    nextTargets.boardEventShell &&
    nextTargets.boardEventShell !== nextTargets.boardCanvas
  ) {
    updateBoardSizeVariable(
      nextTargets.boardEventShell,
      nextTargets.boardViewport || nextTargets.boardPanel || nextTargets.boardCanvas
    );
  }

  state.layoutHookTargets = nextTargets;
}

function countCricketPlayerCards(playerDisplayNode) {
  if (!playerDisplayNode || typeof playerDisplayNode !== "object") {
    return 0;
  }

  const directChildren = Array.isArray(playerDisplayNode.children)
    ? playerDisplayNode.children.filter((child) => child && child.nodeType === 1)
    : [];
  const directCards = directChildren.filter((child) =>
    Boolean(child?.classList?.contains?.("ad-ext-player"))
  );
  if (directCards.length > 0) {
    return directCards.length;
  }

  if (typeof playerDisplayNode.querySelectorAll === "function") {
    try {
      return playerDisplayNode.querySelectorAll(".ad-ext-player").length;
    } catch (_) {
      return 0;
    }
  }

  return 0;
}

function collectCricketPlayerCards(documentRef) {
  const playerDisplayNode = documentRef?.getElementById?.("ad-ext-player-display") || null;
  if (!playerDisplayNode || typeof playerDisplayNode !== "object") {
    return [];
  }

  const directChildren = Array.isArray(playerDisplayNode.children)
    ? playerDisplayNode.children.filter((child) => {
        return Boolean(child?.classList?.contains?.("ad-ext-player"));
      })
    : [];
  if (directChildren.length) {
    return directChildren;
  }

  if (typeof playerDisplayNode.querySelectorAll === "function") {
    return Array.from(playerDisplayNode.querySelectorAll(".ad-ext-player"));
  }

  return [];
}

const CRICKET_PLAYER_CARD_MARKER_ATTRIBUTES = Object.freeze([
  CRICKET_STACK_ATTRIBUTE,
  CRICKET_ROW_ATTRIBUTE,
  CRICKET_SLOT_ATTRIBUTE,
  CRICKET_META_ATTRIBUTE,
  CRICKET_IDENTITY_SHELL_ATTRIBUTE,
  CRICKET_META_SHELL_ATTRIBUTE,
]);

function removeMarkerAttributes(node) {
  if (!node || typeof node.removeAttribute !== "function") {
    return;
  }
  CRICKET_PLAYER_CARD_MARKER_ATTRIBUTES.forEach((attributeName) => {
    node.removeAttribute(attributeName);
  });
}

function clearCricketPlayerCardMarkers(playerNode) {
  if (!playerNode || typeof playerNode !== "object") {
    return;
  }

  removeMarkerAttributes(playerNode);
  if (typeof playerNode.querySelectorAll !== "function") {
    return;
  }

  try {
    Array.from(playerNode.querySelectorAll("*")).forEach((node) => {
      removeMarkerAttributes(node);
    });
  } catch (_) {
    // Ignore selector failures on transient host DOM nodes.
  }
}

function setMarkerAttribute(node, attributeName, value = "true") {
  if (!node || !attributeName || typeof node.setAttribute !== "function") {
    return;
  }
  node.setAttribute(attributeName, value);
}

function findOwningChild(containerNode, targetNode) {
  if (!containerNode || !targetNode || containerNode === targetNode) {
    return null;
  }

  let current = targetNode;
  while (current && current.parentElement && current.parentElement !== containerNode) {
    current = current.parentElement;
  }

  return current?.parentElement === containerNode ? current : null;
}

function findClosestDescendant(node, selector) {
  if (!node || typeof node.querySelector !== "function" || !selector) {
    return null;
  }

  try {
    return node.querySelector(selector);
  } catch (_) {
    return null;
  }
}

function nodeContainsAnyTarget(node, targets = []) {
  if (!node) {
    return false;
  }

  return targets.some((target) => {
    if (!target) {
      return false;
    }
    return node === target || elementContains(node, target);
  });
}

function findCommonAncestorWithin(boundaryNode, targets = []) {
  const normalizedTargets = targets.filter(Boolean);
  if (!boundaryNode || !normalizedTargets.length) {
    return null;
  }

  const ancestorChain = [];
  let current = normalizedTargets[0];
  while (current) {
    ancestorChain.push(current);
    if (current === boundaryNode) {
      break;
    }
    current = current.parentElement || current.parentNode || null;
  }

  return ancestorChain.find((candidate) => {
    return normalizedTargets.every((target) => {
      return candidate === target || elementContains(candidate, target);
    });
  }) || null;
}

function getNodeText(node) {
  if (!node || typeof node !== "object") {
    return "";
  }

  const ownText = String(node.textContent || "").trim();
  if (ownText.length > 0) {
    return ownText.toLowerCase();
  }

  const childText = getElementChildren(node)
    .map((child) => getNodeText(child))
    .filter((value) => value.length > 0)
    .join(" ")
    .trim();
  return childText.toLowerCase();
}

function hasMeaningfulText(node) {
  return getNodeText(node).length > 0;
}

function getTrimmedText(node) {
  if (!node || typeof node !== "object") {
    return "";
  }
  return String(node.textContent || "").trim();
}

function getAttributeText(node, attributeName) {
  if (!node || typeof node.getAttribute !== "function" || !attributeName) {
    return "";
  }
  return String(node.getAttribute(attributeName) || "").trim();
}

function normalizeCricketNameText(value) {
  return String(value || "")
    .trim()
    .replaceAll(/\s+/g, " ");
}

function normalizeComparableCricketName(value) {
  return normalizeCricketNameText(value)
    .toLowerCase()
    .replaceAll(/[\s.]+/g, "");
}

function isLikelyTruncatedCricketName(value) {
  const normalized = normalizeCricketNameText(value);
  return /(?:\.{2,}|\u2026)$/.test(normalized) || normalized.includes("\u2026");
}

function resolveCricketNameTextNode(nameNode) {
  if (!nameNode) {
    return null;
  }

  return (
    getElementChildren(nameNode).find((child) => hasMeaningfulText(child)) ||
    findClosestDescendant(nameNode, "p") ||
    nameNode
  );
}

function resolveCricketAvatarAltText(avatarNode) {
  if (!avatarNode) {
    return "";
  }

  const avatarImage =
    (avatarNode.matches?.("img") ? avatarNode : null) ||
    findClosestDescendant(avatarNode, "img");
  return normalizeCricketNameText(getAttributeText(avatarImage, "alt"));
}

function formatResolvedCricketDisplayName(value) {
  const normalized = normalizeCricketNameText(value);
  return normalized ? normalized.toLocaleUpperCase() : "";
}

function maybeRestoreCricketDisplayName(nameNode, avatarNode) {
  if (!nameNode) {
    return;
  }

  const nameTextNode = resolveCricketNameTextNode(nameNode);
  const visibleName = normalizeCricketNameText(getTrimmedText(nameTextNode));
  if (!visibleName || !isLikelyTruncatedCricketName(visibleName)) {
    return;
  }

  const sourceCandidates = [
    getAttributeText(nameNode, "title"),
    getAttributeText(nameNode, "aria-label"),
    getAttributeText(nameTextNode, "title"),
    getAttributeText(nameTextNode, "aria-label"),
    resolveCricketAvatarAltText(avatarNode),
  ]
    .map((value) => normalizeCricketNameText(value))
    .filter(Boolean);

  const visibleComparable = normalizeComparableCricketName(visibleName);
  const resolvedSource = sourceCandidates.find((candidate) => {
    const comparableCandidate = normalizeComparableCricketName(candidate);
    return comparableCandidate.length > visibleComparable.length;
  });
  if (!resolvedSource) {
    return;
  }

  const resolvedDisplayName = formatResolvedCricketDisplayName(resolvedSource);
  if (!resolvedDisplayName) {
    return;
  }

  nameTextNode.textContent = resolvedDisplayName;
  nameNode.setAttribute("title", resolvedDisplayName);
  if (nameTextNode !== nameNode && typeof nameTextNode.setAttribute === "function") {
    nameTextNode.setAttribute("title", resolvedDisplayName);
  }
}

function resolveCricketPlayerStack(playerNode) {
  const directChildren = getElementChildren(playerNode);
  return (
    directChildren.find((child) => child?.classList?.contains?.("chakra-stack")) ||
    directChildren[0] ||
    findClosestDescendant(playerNode, ".chakra-stack") ||
    null
  );
}

function resolveCricketPlayerRowContainer(stackNode, identityTargets = []) {
  const directChildren = getElementChildren(stackNode);
  return (
    directChildren.find((child) => nodeContainsAnyTarget(child, identityTargets)) || null
  );
}

function resolveCricketStatsSlot(stackNode, rowNode, scoreNode) {
  const directChildren = getElementChildren(stackNode).filter((child) => child !== scoreNode);
  const statsCandidates = directChildren.filter((child) => child !== rowNode);
  return (
    statsCandidates.find((child) => getNodeText(child).includes("mpr")) ||
    statsCandidates.find((child) => hasMeaningfulText(child)) ||
    null
  );
}

function normalizeCricketIdentitySlot(identitySlot) {
  if (!identitySlot) {
    return;
  }

  const preferredShell =
    getElementChildren(identitySlot).find((child) => {
      return Boolean(
        findClosestDescendant(child, ".ad-ext-player-name") ||
          findClosestDescendant(child, ".chakra-badge") ||
          findClosestDescendant(child, ".chakra-avatar")
      );
    }) || identitySlot;

  if (preferredShell !== identitySlot) {
    setMarkerAttribute(preferredShell, CRICKET_IDENTITY_SHELL_ATTRIBUTE);
  }

  const effectiveShell = preferredShell;
  const nameNode = findClosestDescendant(effectiveShell, ".ad-ext-player-name");
  const badgeNode = findClosestDescendant(effectiveShell, ".chakra-badge");
  const avatarNode =
    findClosestDescendant(effectiveShell, ".chakra-avatar") ||
    findClosestDescendant(effectiveShell, ".chakra-avatar__img");

  const nameBadgeShell = findCommonAncestorWithin(effectiveShell, [nameNode, badgeNode]);
  if (
    nameBadgeShell &&
    nameBadgeShell !== effectiveShell &&
    nameBadgeShell !== nameNode &&
    nameBadgeShell !== badgeNode
  ) {
    setMarkerAttribute(nameBadgeShell, CRICKET_META_SHELL_ATTRIBUTE);
  }

  const avatarMetaNode = findOwningChild(effectiveShell, avatarNode) || avatarNode;
  if (avatarMetaNode) {
    setMarkerAttribute(avatarMetaNode, CRICKET_META_ATTRIBUTE, "avatar");
  }
  if (nameNode) {
    setMarkerAttribute(nameNode, CRICKET_META_ATTRIBUTE, "name");
    maybeRestoreCricketDisplayName(nameNode, avatarMetaNode || avatarNode);
  }
  if (badgeNode) {
    setMarkerAttribute(badgeNode, CRICKET_META_ATTRIBUTE, "wins");
  }
}

function normalizeCricketPlayerCard(playerNode) {
  clearCricketPlayerCardMarkers(playerNode);

  const stackNode = resolveCricketPlayerStack(playerNode);
  if (!stackNode) {
    return null;
  }

  setMarkerAttribute(stackNode, CRICKET_STACK_ATTRIBUTE);

  const nameNode = findClosestDescendant(stackNode, ".ad-ext-player-name");
  const badgeNode = findClosestDescendant(stackNode, ".chakra-badge");
  const avatarNode =
    findClosestDescendant(stackNode, ".chakra-avatar") ||
    findClosestDescendant(stackNode, ".chakra-avatar__img");
  const scoreNode = findClosestDescendant(stackNode, ".ad-ext-player-score");

  const rowNode = resolveCricketPlayerRowContainer(stackNode, [nameNode, badgeNode, avatarNode]);
  if (rowNode && rowNode !== stackNode) {
    setMarkerAttribute(rowNode, CRICKET_ROW_ATTRIBUTE);
  }

  const statsNode = resolveCricketStatsSlot(stackNode, rowNode, scoreNode);
  if (statsNode) {
    setMarkerAttribute(statsNode, CRICKET_SLOT_ATTRIBUTE, "stats");
  }

  let identitySlot = null;
  let marksSlot = null;
  if (rowNode) {
    const rowChildren = getElementChildren(rowNode);
    identitySlot =
      rowChildren.find((child) => nodeContainsAnyTarget(child, [nameNode, badgeNode, avatarNode])) ||
      (nodeContainsAnyTarget(rowNode, [nameNode, badgeNode, avatarNode]) ? rowNode : null);
    marksSlot =
      rowChildren.find((child) => {
        return child !== identitySlot && !nodeContainsAnyTarget(child, [scoreNode, statsNode]);
      }) || null;
  }

  if (!identitySlot) {
    const directChildren = getElementChildren(stackNode).filter((child) => child !== scoreNode);
    identitySlot =
      directChildren.find((child) => nodeContainsAnyTarget(child, [nameNode, badgeNode, avatarNode])) ||
      null;
  }

  if (marksSlot) {
    setMarkerAttribute(marksSlot, CRICKET_SLOT_ATTRIBUTE, "marks");
  }
  if (identitySlot) {
    setMarkerAttribute(identitySlot, CRICKET_SLOT_ATTRIBUTE, "identity");
    normalizeCricketIdentitySlot(identitySlot);
  }

  getElementChildren(stackNode).forEach((child) => {
    if (child === scoreNode || child === rowNode || child === statsNode) {
      return;
    }
    if (child.getAttribute?.(CRICKET_SLOT_ATTRIBUTE)) {
      return;
    }
    setMarkerAttribute(child, CRICKET_SLOT_ATTRIBUTE, "decorative");
  });

  return {
    stackNode,
    rowNode,
    identitySlot,
    marksSlot,
    statsNode,
  };
}

function normalizeCricketPlayerCards(documentRef) {
  return collectCricketPlayerCards(documentRef).map((playerNode) => {
    return normalizeCricketPlayerCard(playerNode);
  });
}

function resolveCricketThemeActivePlayerIndex(documentRef, gameState) {
  const playerNodes = collectCricketPlayerCards(documentRef);
  if (!playerNodes.length) {
    return -1;
  }

  const stateIndexRaw =
    gameState && typeof gameState.getActivePlayerIndex === "function"
      ? Number(gameState.getActivePlayerIndex())
      : Number.NaN;
  const hasStateIndex = Number.isFinite(stateIndexRaw);
  const normalizedStateIndex = hasStateIndex
    ? Math.max(0, Math.min(Math.round(stateIndexRaw), playerNodes.length - 1))
    : -1;

  const domActiveIndexes = playerNodes.reduce((indexes, node, index) => {
    if (node?.classList?.contains?.("ad-ext-player-active")) {
      indexes.push(index);
    }
    return indexes;
  }, []);

  if (domActiveIndexes.length === 1) {
    return domActiveIndexes[0];
  }

  if (domActiveIndexes.length > 1) {
    // Autodarts can briefly leave stale active classes behind during turn switches.
    // Prefer the state index when available; otherwise trust the newest visible marker.
    return hasStateIndex ? normalizedStateIndex : domActiveIndexes[domActiveIndexes.length - 1];
  }

  return hasStateIndex ? normalizedStateIndex : 0;
}

export function syncCricketActivePlayerState(documentRef, gameState) {
  const playerNodes = collectCricketPlayerCards(documentRef);
  if (!playerNodes.length) {
    return;
  }

  normalizeCricketPlayerCards(documentRef);
  const activePlayerIndex = resolveCricketThemeActivePlayerIndex(documentRef, gameState);
  playerNodes.forEach((node, index) => {
    if (!node || typeof node.setAttribute !== "function") {
      return;
    }
    node.setAttribute(
      CRICKET_ACTIVE_PLAYER_ATTRIBUTE,
      index === activePlayerIndex ? "true" : "false"
    );
  });
}

export function clearCricketActivePlayerState(documentRef) {
  collectCricketPlayerCards(documentRef).forEach((node) => {
    if (!node || typeof node.removeAttribute !== "function") {
      return;
    }
    node.removeAttribute(CRICKET_ACTIVE_PLAYER_ATTRIBUTE);
    clearCricketPlayerCardMarkers(node);
  });
}

export function syncCricketActivePlayerStateFromRenderState(
  documentRef,
  renderState,
  gameState = null
) {
  const playerNodes = collectCricketPlayerCards(documentRef);
  if (!playerNodes.length) {
    return;
  }

  normalizeCricketPlayerCards(documentRef);
  const renderStateIndex = Number(renderState?.activePlayerIndex);
  const activePlayerIndex = Number.isFinite(renderStateIndex)
    ? Math.max(0, Math.min(Math.round(renderStateIndex), playerNodes.length - 1))
    : resolveCricketThemeActivePlayerIndex(documentRef, gameState);
  playerNodes.forEach((node, index) => {
    if (!node || typeof node.setAttribute !== "function") {
      return;
    }
    node.setAttribute(
      CRICKET_ACTIVE_PLAYER_ATTRIBUTE,
      index === activePlayerIndex ? "true" : "false"
    );
  });
}

function computeCricketRequiredPlayerWidth(playerCount) {
  const normalizedPlayerCount = Number.isFinite(playerCount)
    ? Math.max(1, Math.floor(playerCount))
    : 1;
  const totalCardWidth =
    normalizedPlayerCount * CRICKET_READABILITY_POLICY.playerCardMinWidthPx;
  const totalGapWidth =
    Math.max(0, normalizedPlayerCount - 1) * CRICKET_READABILITY_POLICY.playerCardGapPx;
  return (
    totalCardWidth +
    totalGapWidth +
    CRICKET_READABILITY_POLICY.playerAreaPaddingPx
  );
}

function computeCricketPlayerColumnWidth(playerAreaWidthPx, playerCount) {
  const normalizedPlayerCount = Number.isFinite(playerCount)
    ? Math.max(1, Math.floor(playerCount))
    : 1;
  const normalizedPlayerAreaWidth = Number.isFinite(playerAreaWidthPx)
    ? Math.max(0, Math.floor(playerAreaWidthPx))
    : 0;
  const totalGapWidth =
    Math.max(0, normalizedPlayerCount - 1) * CRICKET_READABILITY_POLICY.playerCardGapPx;
  const availableCardWidth = Math.max(0, normalizedPlayerAreaWidth - totalGapWidth);
  return Math.max(0, Math.floor(availableCardWidth / normalizedPlayerCount));
}

function measureCricketLeftContentWidth(contentLeftNode, playerDisplayNode) {
  const directChildWidths = getElementChildren(contentLeftNode).map((childNode) =>
    getElementWidth(childNode)
  );
  return Math.max(
    getElementWidth(contentLeftNode),
    getElementWidth(playerDisplayNode),
    ...directChildWidths
  );
}

function restoreCricketReadabilityProbeVariables(contentSlotNode, snapshot = new Map()) {
  if (!contentSlotNode || !contentSlotNode.style || typeof contentSlotNode.style.setProperty !== "function") {
    return;
  }

  snapshot.forEach((value, variableName) => {
    if (value) {
      contentSlotNode.style.setProperty(variableName, value);
      return;
    }
    contentSlotNode.style.removeProperty(variableName);
  });
}

function measureCricketPlayerAreaProbeWidth(
  contentSlotNode,
  contentLeftNode,
  playerDisplayNode,
  playerCount,
  probePlayerAreaWidthPx
) {
  if (!contentSlotNode || !contentLeftNode || !playerDisplayNode || playerCount <= 0) {
    return 0;
  }

  const normalizedProbePlayerAreaWidth = Number.isFinite(probePlayerAreaWidthPx)
    ? Math.max(0, Math.floor(probePlayerAreaWidthPx))
    : 0;
  if (normalizedProbePlayerAreaWidth <= 0) {
    return 0;
  }

  const probePlayerColumnWidth = computeCricketPlayerColumnWidth(
    normalizedProbePlayerAreaWidth,
    playerCount
  );
  if (probePlayerColumnWidth <= 0) {
    return 0;
  }

  const directChildNodes = getElementChildren(contentLeftNode);
  const probeNodes = [contentLeftNode, playerDisplayNode, ...directChildNodes].filter(Boolean);
  const variableSnapshot = new Map([
    [
      CRICKET_PLAYER_AREA_REQUIRED_WIDTH_CSS_VARIABLE,
      contentSlotNode.style.getPropertyValue(CRICKET_PLAYER_AREA_REQUIRED_WIDTH_CSS_VARIABLE),
    ],
    [
      CRICKET_PLAYER_COLUMN_WIDTH_CSS_VARIABLE,
      contentSlotNode.style.getPropertyValue(CRICKET_PLAYER_COLUMN_WIDTH_CSS_VARIABLE),
    ],
    [
      CRICKET_PLAYER_COLUMN_MAX_WIDTH_CSS_VARIABLE,
      contentSlotNode.style.getPropertyValue(CRICKET_PLAYER_COLUMN_MAX_WIDTH_CSS_VARIABLE),
    ],
  ]);

  try {
    contentSlotNode.style.setProperty(
      CRICKET_PLAYER_AREA_REQUIRED_WIDTH_CSS_VARIABLE,
      `${normalizedProbePlayerAreaWidth}px`
    );
    contentSlotNode.style.setProperty(
      CRICKET_PLAYER_COLUMN_WIDTH_CSS_VARIABLE,
      `${probePlayerColumnWidth}px`
    );
    contentSlotNode.style.setProperty(
      CRICKET_PLAYER_COLUMN_MAX_WIDTH_CSS_VARIABLE,
      `${probePlayerColumnWidth}px`
    );

    const measuredProbeWidth = Math.max(
      normalizedProbePlayerAreaWidth,
      ...probeNodes.map((node) =>
        getElementScrollWidth(node) || getElementClientWidth(node) || getElementWidth(node)
      )
    );
    return Number.isFinite(measuredProbeWidth) && measuredProbeWidth > 0
      ? Math.floor(measuredProbeWidth)
      : 0;
  } finally {
    restoreCricketReadabilityProbeVariables(contentSlotNode, variableSnapshot);
  }
}

function measureCricketRequiredPlayerWidth(
  contentSlotNode,
  contentLeftNode,
  playerDisplayNode,
  playerCount,
  probePlayerAreaWidthPx,
  slotWidth,
  contentGapPx,
  maximumAutoBoardWidth
) {
  const minimumPlayerWidth = computeCricketRequiredPlayerWidth(playerCount);
  const measuredCurrentWidth = measureCricketLeftContentWidth(contentLeftNode, playerDisplayNode);
  const normalizedSlotWidth = Number.isFinite(slotWidth) ? Math.max(0, Math.floor(slotWidth)) : 0;
  const normalizedContentGapPx = Number.isFinite(contentGapPx)
    ? Math.max(0, Math.floor(contentGapPx))
    : 0;
  const normalizedMaximumAutoBoardWidth = Number.isFinite(maximumAutoBoardWidth)
    ? Math.max(0, Math.floor(maximumAutoBoardWidth))
    : 0;
  let nextProbeWidth = Number.isFinite(probePlayerAreaWidthPx)
    ? Math.max(minimumPlayerWidth, Math.floor(probePlayerAreaWidthPx))
    : minimumPlayerWidth;
  let smallestProbedWidth = 0;

  for (let iteration = 0; iteration < 4; iteration += 1) {
    const probedWidth = measureCricketPlayerAreaProbeWidth(
      contentSlotNode,
      contentLeftNode,
      playerDisplayNode,
      playerCount,
      nextProbeWidth
    );
    if (!(Number.isFinite(probedWidth) && probedWidth > 0)) {
      break;
    }

    if (smallestProbedWidth <= 0 || probedWidth < smallestProbedWidth) {
      smallestProbedWidth = probedWidth;
    }

    if (
      probedWidth <= nextProbeWidth ||
      normalizedSlotWidth <= 0 ||
      normalizedMaximumAutoBoardWidth <= 0
    ) {
      break;
    }

    const nextBoardWidth = Math.max(
      0,
      Math.min(
        normalizedMaximumAutoBoardWidth,
        Math.floor(normalizedSlotWidth - probedWidth - normalizedContentGapPx)
      )
    );
    const resolvedNextProbeWidth = Math.max(
      minimumPlayerWidth,
      Math.floor(Math.max(0, normalizedSlotWidth - nextBoardWidth - normalizedContentGapPx))
    );
    if (resolvedNextProbeWidth <= nextProbeWidth) {
      break;
    }
    nextProbeWidth = resolvedNextProbeWidth;
  }

  const effectiveMeasuredWidth =
    Number.isFinite(smallestProbedWidth) &&
    smallestProbedWidth > 0 &&
    smallestProbedWidth < measuredCurrentWidth
      ? smallestProbedWidth
      : measuredCurrentWidth;

  return Math.max(minimumPlayerWidth, effectiveMeasuredWidth);
}

function measureCricketPreferredBoardWidth(layoutTargets = {}, contentBoardNode = null) {
  const measuredWidth = getSmallestPositiveDimension([
    getElementWidth(layoutTargets.boardViewport),
    getElementWidth(layoutTargets.boardCanvas),
    getElementWidth(contentBoardNode),
  ]);
  if (measuredWidth <= 0) {
    return 0;
  }
  return Math.max(CRICKET_READABILITY_POLICY.boardAutoMinWidthPx, measuredWidth);
}

function resolveCricketBoardSizeCap(state) {
  const targets = state?.layoutHookTargets || {};
  const readabilityState = state?.cricketReadability || {};
  if (readabilityState.boardHidden) {
    return 0;
  }

  return getSmallestPositiveDimension([
    readabilityState.boardForcedVisible ? readabilityState.boardWidthPx : 0,
    getElementWidth(targets.contentBoard),
  ]);
}

function syncCricketBoardSize(state) {
  const targets = state?.layoutHookTargets || {};
  const measurementNode =
    targets.boardViewport || targets.boardPanel || targets.boardCanvas || null;
  const boardSizeCapPx = resolveCricketBoardSizeCap(state);
  const boardTargets = [targets.boardCanvas];

  if (targets.boardEventShell && targets.boardEventShell !== targets.boardCanvas) {
    boardTargets.push(targets.boardEventShell);
  }

  boardTargets.forEach((targetNode) => {
    if (!targetNode) {
      return;
    }

    if (state?.cricketReadability?.boardHidden) {
      clearBoardSizeVariable(targetNode);
      return;
    }

    updateBoardSizeVariable(targetNode, measurementNode, {
      maxWidthPx: boardSizeCapPx,
    });
  });
}

function removeCricketReadabilityNotice(state) {
  const readabilityState = state?.cricketReadability;
  if (!readabilityState || typeof readabilityState !== "object") {
    return;
  }

  if (
    readabilityState.toggleNode &&
    readabilityState.toggleHandler &&
    typeof readabilityState.toggleNode.removeEventListener === "function"
  ) {
    readabilityState.toggleNode.removeEventListener(
      "click",
      readabilityState.toggleHandler
    );
  }

  if (readabilityState.noticeNode && typeof readabilityState.noticeNode.remove === "function") {
    readabilityState.noticeNode.remove();
  }

  readabilityState.noticeNode = null;
  readabilityState.noticeTextNode = null;
  readabilityState.toggleNode = null;
  readabilityState.toggleHandler = null;
}

function updateCricketReadabilityClasses(state, contentSlotNode, options = {}) {
  const readabilityState = state?.cricketReadability;
  if (!readabilityState || typeof readabilityState !== "object") {
    return;
  }

  const previousContentSlot = readabilityState.contentSlotNode;
  if (previousContentSlot && previousContentSlot !== contentSlotNode) {
    removeClass(previousContentSlot, THEME_CRICKET_READABILITY.constrainedClass);
    removeClass(previousContentSlot, THEME_CRICKET_READABILITY.boardHiddenClass);
    removeClass(previousContentSlot, THEME_CRICKET_READABILITY.boardForcedVisibleClass);
    clearStyleVariable(previousContentSlot, CRICKET_BOARD_WIDTH_CSS_VARIABLE);
    clearStyleVariable(previousContentSlot, CRICKET_PLAYER_COLUMN_WIDTH_CSS_VARIABLE);
    clearStyleVariable(previousContentSlot, CRICKET_PLAYER_COLUMN_MAX_WIDTH_CSS_VARIABLE);
    clearStyleVariable(previousContentSlot, CRICKET_PLAYER_AREA_REQUIRED_WIDTH_CSS_VARIABLE);
    clearStyleVariable(previousContentSlot, CRICKET_PLAYER_COUNT_CSS_VARIABLE);
  }

  readabilityState.contentSlotNode = contentSlotNode || null;
  if (!contentSlotNode) {
    return;
  }

  const isConstrained = options.isConstrained === true;
  const boardHidden = options.boardHidden === true;
  const boardForcedVisible = options.boardForcedVisible === true;
  const boardWidthPx =
    Number.isFinite(options.boardWidthPx) && options.boardWidthPx > 0
      ? Math.floor(options.boardWidthPx)
      : 0;
  const playerColumnWidthPx =
    Number.isFinite(options.playerColumnWidthPx) && options.playerColumnWidthPx > 0
      ? Math.floor(options.playerColumnWidthPx)
      : 0;
  const playerAreaRequiredWidthPx =
    Number.isFinite(options.playerAreaRequiredWidthPx) && options.playerAreaRequiredWidthPx > 0
      ? Math.floor(options.playerAreaRequiredWidthPx)
      : 0;
  const playerCount =
    Number.isFinite(options.playerCount) && options.playerCount > 0
      ? Math.floor(options.playerCount)
      : 0;
  toggleClass(contentSlotNode, THEME_CRICKET_READABILITY.constrainedClass, isConstrained);
  toggleClass(contentSlotNode, THEME_CRICKET_READABILITY.boardHiddenClass, boardHidden);
  toggleClass(
    contentSlotNode,
    THEME_CRICKET_READABILITY.boardForcedVisibleClass,
    boardForcedVisible
  );

  if (playerColumnWidthPx > 0) {
    updateStyleVariable(
      contentSlotNode,
      CRICKET_PLAYER_COLUMN_WIDTH_CSS_VARIABLE,
      `${playerColumnWidthPx}px`
    );
    updateStyleVariable(
      contentSlotNode,
      CRICKET_PLAYER_COLUMN_MAX_WIDTH_CSS_VARIABLE,
      `${playerColumnWidthPx}px`
    );
  } else {
    clearStyleVariable(contentSlotNode, CRICKET_PLAYER_COLUMN_WIDTH_CSS_VARIABLE);
    clearStyleVariable(contentSlotNode, CRICKET_PLAYER_COLUMN_MAX_WIDTH_CSS_VARIABLE);
  }

  if (playerAreaRequiredWidthPx > 0) {
    updateStyleVariable(
      contentSlotNode,
      CRICKET_PLAYER_AREA_REQUIRED_WIDTH_CSS_VARIABLE,
      `${playerAreaRequiredWidthPx}px`
    );
  } else {
    clearStyleVariable(contentSlotNode, CRICKET_PLAYER_AREA_REQUIRED_WIDTH_CSS_VARIABLE);
  }

  if (playerCount > 0) {
    updateStyleVariable(contentSlotNode, CRICKET_PLAYER_COUNT_CSS_VARIABLE, playerCount);
  } else {
    clearStyleVariable(contentSlotNode, CRICKET_PLAYER_COUNT_CSS_VARIABLE);
  }

  if (boardWidthPx > 0) {
    updateStyleVariable(contentSlotNode, CRICKET_BOARD_WIDTH_CSS_VARIABLE, `${boardWidthPx}px`);
  } else {
    clearStyleVariable(contentSlotNode, CRICKET_BOARD_WIDTH_CSS_VARIABLE);
  }
}

function ensureCricketReadabilityNotice(documentRef, state, contentLeftNode, onToggleClick) {
  const readabilityState = state?.cricketReadability;
  if (!readabilityState || typeof readabilityState !== "object") {
    return null;
  }

  if (!documentRef || !contentLeftNode || typeof contentLeftNode.appendChild !== "function") {
    removeCricketReadabilityNotice(state);
    return null;
  }

  let noticeNode = readabilityState.noticeNode;
  let noticeTextNode = readabilityState.noticeTextNode;
  let toggleNode = readabilityState.toggleNode;
  if (!noticeNode || !noticeTextNode || !toggleNode) {
    removeCricketReadabilityNotice(state);

    noticeNode = documentRef.createElement("div");
    noticeNode.id = THEME_CRICKET_READABILITY.noticeId;
    noticeNode.classList.add(THEME_CRICKET_READABILITY.noticeClass);

    noticeTextNode = documentRef.createElement("p");
    noticeTextNode.classList.add(THEME_CRICKET_READABILITY.noticeTextClass);
    noticeNode.appendChild(noticeTextNode);

    toggleNode = documentRef.createElement("button");
    toggleNode.classList.add(THEME_CRICKET_READABILITY.toggleClass);
    toggleNode.type = "button";
    noticeNode.appendChild(toggleNode);

    const toggleHandler = (event) => {
      if (event && typeof event.preventDefault === "function") {
        event.preventDefault();
      }
      if (typeof onToggleClick === "function") {
        onToggleClick();
      }
    };
    toggleNode.addEventListener("click", toggleHandler);

    readabilityState.noticeNode = noticeNode;
    readabilityState.noticeTextNode = noticeTextNode;
    readabilityState.toggleNode = toggleNode;
    readabilityState.toggleHandler = toggleHandler;
  }

  if (noticeNode.parentNode !== contentLeftNode) {
    if (typeof contentLeftNode.insertBefore === "function") {
      contentLeftNode.insertBefore(noticeNode, contentLeftNode.firstElementChild || null);
    } else {
      contentLeftNode.appendChild(noticeNode);
    }
  }

  return noticeNode;
}

function updateCricketReadabilityNotice(state, options = {}) {
  const readabilityState = state?.cricketReadability;
  if (!readabilityState || typeof readabilityState !== "object") {
    return;
  }

  const noticeTextNode = readabilityState.noticeTextNode;
  const toggleNode = readabilityState.toggleNode;
  if (!noticeTextNode || !toggleNode) {
    return;
  }

  const boardHidden = options.boardHidden === true;
  const boardForcedVisible = options.boardForcedVisible === true;
  if (boardHidden) {
    noticeTextNode.textContent = "Board wegen Lesbarkeit ausgeblendet.";
    toggleNode.textContent = "Board anzeigen";
    return;
  }

  noticeTextNode.textContent = boardForcedVisible
    ? "Board manuell eingeblendet, Spielerinfos behalten Priorität."
    : "Wenig Platz: Spielerinfos haben Priorität.";
  toggleNode.textContent = "Board ausblenden";
}

export function clearCricketReadabilityPolicy(state) {
  if (!state || typeof state !== "object") {
    return;
  }

  const readabilityState = state.cricketReadability;
  if (!readabilityState || typeof readabilityState !== "object") {
    state.cricketReadability = createCricketReadabilityState();
    return;
  }

  clearStyleVariable(readabilityState.contentSlotNode, CRICKET_BOARD_WIDTH_CSS_VARIABLE);
  clearStyleVariable(readabilityState.contentSlotNode, CRICKET_PLAYER_COLUMN_WIDTH_CSS_VARIABLE);
  clearStyleVariable(
    readabilityState.contentSlotNode,
    CRICKET_PLAYER_COLUMN_MAX_WIDTH_CSS_VARIABLE
  );
  clearStyleVariable(
    readabilityState.contentSlotNode,
    CRICKET_PLAYER_AREA_REQUIRED_WIDTH_CSS_VARIABLE
  );
  updateCricketReadabilityClasses(state, null, {});
  removeCricketReadabilityNotice(state);
  state.cricketReadability = createCricketReadabilityState();
}

function isCricketPlayerStateNode(node) {
  if (!node || typeof node !== "object") {
    return false;
  }

  if (node.id === "ad-ext-player-display") {
    return true;
  }

  if (node?.classList?.contains?.("ad-ext-player")) {
    return true;
  }

  return Boolean(typeof node.closest === "function" && node.closest("#ad-ext-player-display"));
}

export function hasCricketPlayerStateMutation(mutations = []) {
  if (!Array.isArray(mutations) || !mutations.length) {
    return false;
  }

  return mutations.some((mutation) => {
    if (String(mutation?.type || "") === "attributes") {
      const attributeName = String(mutation?.attributeName || "").trim().toLowerCase();
      if (attributeName && attributeName !== "class") {
        return false;
      }
      return isCricketPlayerStateNode(mutation?.target || null);
    }

    return [
      ...Array.from(mutation?.addedNodes || []),
      ...Array.from(mutation?.removedNodes || []),
    ].some((node) => isCricketPlayerStateNode(node));
  });
}

export function applyCricketReadabilityPolicy(documentRef, state, scheduler) {
  if (!state || typeof state !== "object") {
    return;
  }

  if (!state.cricketReadability || typeof state.cricketReadability !== "object") {
    state.cricketReadability = createCricketReadabilityState();
  }
  const readabilityState = state.cricketReadability;
  const layoutTargets = state.layoutHookTargets || {};
  const contentSlotNode = layoutTargets.contentSlot || null;
  const contentLeftNode = layoutTargets.contentLeft || null;
  const contentBoardNode = layoutTargets.contentBoard || null;
  const playerDisplayNode = documentRef?.getElementById?.("ad-ext-player-display") || null;
  normalizeCricketPlayerCards(documentRef);

  if (!contentSlotNode || !contentLeftNode || !contentBoardNode || !playerDisplayNode) {
    updateCricketReadabilityClasses(state, contentSlotNode, { playerCount: 0 });
    removeCricketReadabilityNotice(state);
    readabilityState.isConstrained = false;
    readabilityState.boardHidden = false;
    readabilityState.boardAutoHidden = false;
    readabilityState.boardForcedVisible = false;
    readabilityState.boardWidthPx = 0;
    readabilityState.playerColumnWidthPx = 0;
    readabilityState.playerAreaRequiredWidthPx = 0;
    syncCricketBoardSize(state);
    return;
  }

  const slotWidth = getElementWidth(contentSlotNode);
  const slotHeight = getElementHeight(contentSlotNode);
  const playerCount = countCricketPlayerCards(playerDisplayNode);
  const minimumPlayerWidth = computeCricketRequiredPlayerWidth(playerCount);
  const contentGapPx = playerCount > 0 ? CRICKET_READABILITY_POLICY.contentGapPx : 0;
  const maximumAutoBoardWidth = Math.max(
    0,
    Math.floor(
      Math.min(
        slotHeight > 0 ? slotHeight : Number.POSITIVE_INFINITY,
        Math.max(0, slotWidth - minimumPlayerWidth - contentGapPx)
      )
    )
  );
  const probePlayerAreaWidth = Math.max(
    minimumPlayerWidth,
    Math.floor(Math.max(0, slotWidth - maximumAutoBoardWidth - contentGapPx))
  );
  const requiredPlayerWidth = measureCricketRequiredPlayerWidth(
    contentSlotNode,
    contentLeftNode,
    playerDisplayNode,
    playerCount,
    probePlayerAreaWidth,
    slotWidth,
    contentGapPx,
    maximumAutoBoardWidth
  );
  const boardWidthAtRequiredPlayers = Math.max(0, slotWidth - requiredPlayerWidth - contentGapPx);
  const autoVisibleBoardWidth = Math.min(maximumAutoBoardWidth, boardWidthAtRequiredPlayers);
  const preferredBoardWidth = Math.max(
    measureCricketPreferredBoardWidth(layoutTargets, contentBoardNode),
    autoVisibleBoardWidth
  );
  const availablePlayerWidthForPreferredBoard = Math.max(
    0,
    slotWidth - preferredBoardWidth - contentGapPx
  );
  const boardFitsAtPreferredWidth =
    slotWidth > 0 &&
    playerCount > 0 &&
    preferredBoardWidth > 0 &&
    availablePlayerWidthForPreferredBoard >= requiredPlayerWidth;
  const boardCanAutoShrink =
    slotWidth > 0 &&
    playerCount > 0 &&
    autoVisibleBoardWidth >= CRICKET_READABILITY_POLICY.boardAutoMinWidthPx;

  if (boardFitsAtPreferredWidth || (preferredBoardWidth <= 0 && slotWidth > 0 && playerCount > 0)) {
    const resolvedPlayerAreaWidth = Math.max(
      requiredPlayerWidth,
      availablePlayerWidthForPreferredBoard
    );
    const playerColumnWidthPx = computeCricketPlayerColumnWidth(
      resolvedPlayerAreaWidth,
      playerCount
    );
    readabilityState.manualOverride = null;
    readabilityState.isConstrained = false;
    readabilityState.boardHidden = false;
    readabilityState.boardAutoHidden = false;
    readabilityState.boardForcedVisible = false;
    readabilityState.boardWidthPx = 0;
    readabilityState.playerColumnWidthPx = playerColumnWidthPx;
    readabilityState.playerAreaRequiredWidthPx = resolvedPlayerAreaWidth;
    updateCricketReadabilityClasses(state, contentSlotNode, {
      isConstrained: false,
      boardHidden: false,
      boardForcedVisible: false,
      boardWidthPx: 0,
      playerColumnWidthPx,
      playerAreaRequiredWidthPx: resolvedPlayerAreaWidth,
      playerCount,
    });
    removeCricketReadabilityNotice(state);
    syncCricketBoardSize(state);
    return;
  }

  if (boardCanAutoShrink) {
    const playerColumnWidthPx = computeCricketPlayerColumnWidth(requiredPlayerWidth, playerCount);
    readabilityState.isConstrained = true;
    readabilityState.boardHidden = false;
    readabilityState.boardAutoHidden = false;
    readabilityState.boardForcedVisible = false;
    readabilityState.boardWidthPx = Math.floor(autoVisibleBoardWidth);
    readabilityState.playerColumnWidthPx = playerColumnWidthPx;
    readabilityState.playerAreaRequiredWidthPx = requiredPlayerWidth;
    updateCricketReadabilityClasses(state, contentSlotNode, {
      isConstrained: true,
      boardHidden: false,
      boardForcedVisible: false,
      boardWidthPx: Math.floor(autoVisibleBoardWidth),
      playerColumnWidthPx,
      playerAreaRequiredWidthPx: requiredPlayerWidth,
      playerCount,
    });
    removeCricketReadabilityNotice(state);
    syncCricketBoardSize(state);
    return;
  }

  const boardForcedVisible =
    readabilityState.manualOverride === "show" &&
    boardWidthAtRequiredPlayers >= CRICKET_READABILITY_POLICY.boardManualMinWidthPx;
  const boardHidden = !boardForcedVisible;
  const boardWidthPx = boardForcedVisible
    ? Math.max(
        CRICKET_READABILITY_POLICY.boardManualMinWidthPx,
        Math.floor(boardWidthAtRequiredPlayers)
      )
    : 0;
  const resolvedPlayerAreaWidth = boardHidden
    ? Math.max(0, Math.floor(slotWidth))
    : Math.max(0, Math.floor(slotWidth - boardWidthPx - contentGapPx));
  const playerColumnWidthPx = computeCricketPlayerColumnWidth(
    resolvedPlayerAreaWidth,
    playerCount
  );
  readabilityState.isConstrained = true;
  readabilityState.boardHidden = boardHidden;
  readabilityState.boardAutoHidden = boardHidden;
  readabilityState.boardForcedVisible = boardForcedVisible;
  readabilityState.boardWidthPx = boardWidthPx;
  readabilityState.playerColumnWidthPx = playerColumnWidthPx;
  readabilityState.playerAreaRequiredWidthPx = resolvedPlayerAreaWidth;
  updateCricketReadabilityClasses(state, contentSlotNode, {
    isConstrained: true,
    boardHidden,
    boardForcedVisible,
    boardWidthPx,
    playerColumnWidthPx,
    playerAreaRequiredWidthPx: resolvedPlayerAreaWidth,
    playerCount,
  });
  ensureCricketReadabilityNotice(documentRef, state, contentLeftNode, () => {
    readabilityState.manualOverride = readabilityState.boardHidden ? "show" : "hide";
    if (scheduler && typeof scheduler.schedule === "function") {
      scheduler.schedule();
    }
  });
  updateCricketReadabilityNotice(state, { boardHidden, boardForcedVisible });
  syncCricketBoardSize(state);
}

