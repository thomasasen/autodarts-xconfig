import { findBoardSvgGroup } from "../../../shared/dartboard-svg.js";
import {
  isBoardInputModeControl,
} from "../../../shared/board-input-mode.js";
import {
  THEME_LAYOUT_HOOK_CLASSES,
  THEME_LAYOUT_RETENTION_CLASSES,
} from "./theme-layout-contract.js";

const BOARD_SIZE_CSS_VARIABLE = "--ad-ext-theme-board-size";
const CRICKET_BOARD_WIDTH_CSS_VARIABLE = "--ad-ext-theme-cricket-board-width";
const CRICKET_PLAYER_AREA_REQUIRED_WIDTH_CSS_VARIABLE =
  "--ad-ext-theme-cricket-player-area-required-width";
const CRICKET_PLAYER_COUNT_CSS_VARIABLE = "--ad-ext-theme-cricket-player-count";
const CRICKET_THEME_FEATURE_KEY = "theme-cricket";
export const CRICKET_THEME_TRANSIENT_BOARD_GAP_GRACE_MS = 700;
export const CRICKET_THEME_TRANSIENT_BOARD_GAP_RECHECK_BUFFER_MS = 16;
const CRICKET_READABILITY_POLICY = Object.freeze({
  playerCardMinWidthPx: 228,
  playerCardGapPx: 0,
  playerAreaPaddingPx: 12,
  contentGapPx: 8,
  boardAutoMinWidthPx: 288,
  boardManualMinWidthPx: 160,
});
function createCricketReadabilityState() {
  return {
    contentSlotNode: null,
    manualOverride: null,
    isConstrained: false,
    boardHidden: false,
    boardAutoHidden: false,
    boardForcedVisible: false,
    boardWidthPx: 0,
    playerAreaRequiredWidthPx: 0,
    noticeNode: null,
    noticeTextNode: null,
    toggleNode: null,
    toggleHandler: null,
  };
}

export function createLayoutHookRetentionState(options = {}) {
  return {
    enabled: options.enabled === true,
    graceMs: Math.max(
      0,
      Number.isFinite(Number(options.graceMs))
        ? Number(options.graceMs)
        : CRICKET_THEME_TRANSIENT_BOARD_GAP_GRACE_MS
    ),
    recheckBufferMs: Math.max(
      0,
      Number.isFinite(Number(options.recheckBufferMs))
        ? Number(options.recheckBufferMs)
        : CRICKET_THEME_TRANSIENT_BOARD_GAP_RECHECK_BUFFER_MS
    ),
    lastHealthyAtMs: 0,
    retainedStatus: "",
    boardGapHoldActive: false,
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

function getComputedStyleRef(node) {
  const viewRef = node?.ownerDocument?.defaultView;
  if (!viewRef || typeof viewRef.getComputedStyle !== "function") {
    return null;
  }

  try {
    return viewRef.getComputedStyle(node);
  } catch (_) {
    return null;
  }
}

function isNodeExplicitlyHidden(node) {
  if (!node || typeof node !== "object") {
    return true;
  }

  if (node.hidden === true) {
    return true;
  }

  const ariaHidden = normalizeText(node.getAttribute?.("aria-hidden"));
  if (ariaHidden === "true") {
    return true;
  }

  const hiddenAttribute =
    typeof node.getAttribute === "function" ? node.getAttribute("hidden") : null;
  if (hiddenAttribute !== null) {
    return true;
  }

  const inlineDisplay = normalizeText(node.style?.display);
  const inlineVisibility = normalizeText(node.style?.visibility);
  const inlineOpacity = normalizeText(node.style?.opacity);
  if (
    inlineDisplay === "none" ||
    inlineVisibility === "hidden" ||
    inlineVisibility === "collapse" ||
    inlineOpacity === "0"
  ) {
    return true;
  }

  const computedStyle = getComputedStyleRef(node);
  if (!computedStyle) {
    return false;
  }

  const display = normalizeText(computedStyle.display);
  const visibility = normalizeText(computedStyle.visibility);
  const opacity = normalizeText(computedStyle.opacity);
  return display === "none" || visibility === "hidden" || visibility === "collapse" || opacity === "0";
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

function isRenderableLayoutNode(node, options = {}) {
  if (!node || typeof node !== "object") {
    return false;
  }

  if (node.isConnected === false || isNodeExplicitlyHidden(node)) {
    return false;
  }

  const minWidth = Math.max(0, Number(options.minWidth) || 0);
  const minHeight = Math.max(0, Number(options.minHeight) || 0);
  const minArea = Math.max(0, Number(options.minArea) || 0);
  const width = getElementWidth(node);
  const height = getElementHeight(node);
  if (minWidth > 0 && width < minWidth) {
    return false;
  }
  if (minHeight > 0 && height < minHeight) {
    return false;
  }
  if (minArea > 0 && width * height < minArea) {
    return false;
  }

  return width > 0 && height > 0;
}

function hasRenderableContentLayoutTargets(targets) {
  if (!targets || typeof targets !== "object") {
    return false;
  }

  const contentNodes = [targets.contentSlot, targets.contentLeft, targets.contentBoard].filter(Boolean);
  if (!contentNodes.length) {
    return false;
  }

  return contentNodes.every((node) =>
    isRenderableLayoutNode(node, {
      minWidth: 24,
      minHeight: 24,
      minArea: 576,
    })
  );
}

function hasRenderableBoardLayoutTargets(targets) {
  if (!targets || typeof targets !== "object") {
    return false;
  }

  const boardViewport = targets.boardViewport || null;
  const boardCanvas = targets.boardCanvas || null;
  const boardPanel = targets.boardPanel || null;
  if (!boardViewport || !boardCanvas) {
    return false;
  }

  const boardViewportIsPanel = boardViewport === boardPanel;
  const viewportRenderable = boardViewportIsPanel
    ? isRenderableLayoutNode(boardViewport, {
        minWidth: 120,
        minHeight: 24,
        minArea: 2880,
      })
    : isRenderableLayoutNode(boardViewport, {
        minWidth: 120,
        minHeight: 120,
        minArea: 14400,
      });
  if (
    !viewportRenderable ||
    !isRenderableLayoutNode(boardCanvas, {
      minWidth: 120,
      minHeight: 120,
      minArea: 14400,
    })
  ) {
    return false;
  }

  if (!boardPanel) {
    return true;
  }

  return isRenderableLayoutNode(boardPanel, {
    minWidth: 120,
    minHeight: 24,
    minArea: 2880,
  });
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

  const renderableCandidates = candidates.filter((candidate) =>
    hasRenderableContentLayoutTargets(candidate)
  );
  const comparableCandidates = renderableCandidates.length ? renderableCandidates : candidates;

  let bestCandidate = null;
  let bestMeta = null;

  comparableCandidates.forEach((candidate, index) => {
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

  if (!hasRenderableBoardLayoutTargets(targets)) {
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

  if (!hasRenderableContentLayoutTargets(targets)) {
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
  const hasRenderableContentTargets =
    hasCompleteContentTargets && hasRenderableContentLayoutTargets(rawContentTargets);
  const hasPartialContentTargets =
    Boolean(rawContentTargets.contentSlot || rawContentTargets.contentLeft || rawContentTargets.contentBoard) &&
    !hasCompleteContentTargets;
  const contentTargets = hasRenderableContentTargets ? rawContentTargets : {};
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

export function hasBoardInputModeMutation(mutations = []) {
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

export function clearBoardLayoutHooks(state) {
  const previous = state?.layoutHookTargets || {};
  removeBoardGapHold(previous);
  clearBoardSizeVariable(previous.boardCanvas);
  if (previous.boardEventShell && previous.boardEventShell !== previous.boardCanvas) {
    clearBoardSizeVariable(previous.boardEventShell);
  }
  Object.entries(THEME_LAYOUT_HOOK_CLASSES).forEach(([key, className]) => {
    removeClass(previous[key], className);
  });
  state.layoutHookTargets = {};
}

function resolveLayoutHookRetention(state) {
  const retention = state?.layoutHookRetention;
  return retention && typeof retention === "object" ? retention : null;
}

function clearRetainedLayoutStatus(state) {
  const retention = resolveLayoutHookRetention(state);
  if (!retention) {
    return;
  }
  retention.retainedStatus = "";
  retention.boardGapHoldActive = false;
}

function markHealthyLayoutRetention(state, nowMs) {
  const retention = resolveLayoutHookRetention(state);
  if (!retention) {
    return;
  }
  retention.lastHealthyAtMs = Math.max(0, Number(nowMs) || 0);
  retention.retainedStatus = "";
  retention.boardGapHoldActive = false;
}

function resolveRetainedLayoutRecheckDelay(state, nowMs) {
  const retention = resolveLayoutHookRetention(state);
  if (!retention?.enabled) {
    return -1;
  }

  const graceMs = Math.max(0, Number(retention.graceMs) || 0);
  const bufferMs = Math.max(0, Number(retention.recheckBufferMs) || 0);
  const lastHealthyAtMs = Math.max(0, Number(retention.lastHealthyAtMs) || 0);
  if (graceMs <= 0 || lastHealthyAtMs <= 0) {
    return -1;
  }

  const ageMs = Math.max(0, Math.round(Math.max(0, Number(nowMs) || 0) - lastHealthyAtMs));
  if (ageMs >= graceMs) {
    return -1;
  }

  return Math.max(1, graceMs - ageMs + bufferMs);
}

function maybeRetainLayoutHooks(state, status, previous, nowMs) {
  if (!previous || !areRetainableLayoutHookTargetsConnected(previous)) {
    removeBoardGapHold(previous);
    clearRetainedLayoutStatus(state);
    return {
      status,
      retained: false,
      recheckDelayMs: -1,
    };
  }

  const recheckDelayMs = resolveRetainedLayoutRecheckDelay(state, nowMs);
  if (recheckDelayMs <= 0) {
    removeBoardGapHold(previous);
    clearRetainedLayoutStatus(state);
    return {
      status,
      retained: false,
      recheckDelayMs: -1,
    };
  }

  const retention = resolveLayoutHookRetention(state);
  if (retention) {
    retention.retainedStatus = String(status || "");
    retention.boardGapHoldActive = true;
  }
  applyBoardGapHold(previous);

  return {
    status,
    retained: true,
    recheckDelayMs,
  };
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

function areRetainableLayoutHookTargetsConnected(targets) {
  if (!targets || typeof targets !== "object") {
    return false;
  }
  const connectedNodes = [
    targets.contentSlot,
    targets.contentLeft,
    targets.contentBoard,
    targets.boardPanel,
    targets.boardControls,
    targets.boardViewport,
    targets.boardEventShell,
    targets.boardCanvas,
    targets.boardMediaRoot,
  ].filter(Boolean);
  if (!connectedNodes.length) {
    return false;
  }
  if (connectedNodes.some((node) => node.isConnected === false)) {
    return false;
  }

  if (
    targets.contentSlot &&
    targets.contentLeft &&
    targets.contentBoard &&
    !hasRenderableContentLayoutTargets(targets)
  ) {
    return false;
  }

  return hasRenderableBoardLayoutTargets(targets);
}

function collectLayoutHookMutationNodes(mutation) {
  return [
    mutation?.target || null,
    ...Array.from(mutation?.addedNodes || []),
    ...Array.from(mutation?.removedNodes || []),
  ].filter(Boolean);
}

function layoutHookTargetTouchesNode(targetNode, candidateNode) {
  if (!targetNode || !candidateNode) {
    return false;
  }

  return (
    targetNode === candidateNode ||
    elementContains(targetNode, candidateNode) ||
    elementContains(candidateNode, targetNode)
  );
}

function applyBoardGapHold(targets) {
  const holdClass = THEME_LAYOUT_RETENTION_CLASSES.boardGapHold;
  [
    targets?.boardPanel,
    targets?.boardViewport,
    targets?.boardEventShell,
    targets?.boardCanvas,
    targets?.boardMediaRoot,
  ].filter(Boolean).forEach((node) => addClass(node, holdClass));
}

function removeBoardGapHold(targets) {
  const holdClass = THEME_LAYOUT_RETENTION_CLASSES.boardGapHold;
  [
    targets?.boardPanel,
    targets?.boardViewport,
    targets?.boardEventShell,
    targets?.boardCanvas,
    targets?.boardMediaRoot,
  ].filter(Boolean).forEach((node) => removeClass(node, holdClass));
}

export function hasBoardLayoutHookMutation(mutations = [], state = {}) {
  if (!Array.isArray(mutations) || !mutations.length) {
    return false;
  }

  const targets = state?.layoutHookTargets || {};
  const trackedNodes = [
    targets.contentBoard,
    targets.boardPanel,
    targets.boardControls,
    targets.boardViewport,
    targets.boardEventShell,
    targets.boardCanvas,
    targets.boardMediaRoot,
    targets.boardSvg,
  ].filter(Boolean);
  if (!trackedNodes.length) {
    return false;
  }

  return mutations.some((mutation) => {
    const touchedNodes = collectLayoutHookMutationNodes(mutation);
    if (!touchedNodes.length) {
      return false;
    }

    return touchedNodes.some((candidateNode) => {
      return trackedNodes.some((targetNode) =>
        layoutHookTargetTouchesNode(targetNode, candidateNode)
      );
    });
  });
}

export function updateBoardLayoutHooks(documentRef, state, options = {}) {
  const nowMs = Number.isFinite(Number(options.nowMs)) ? Number(options.nowMs) : Date.now();
  const resolution = resolveBoardLayoutTargets(documentRef);
  const nextTargets = resolution?.targets || {};
  const previous = state.layoutHookTargets || {};

  if (!resolution || resolution.status === "missing-board") {
    const retainedLayout = maybeRetainLayoutHooks(state, "missing-board", previous, nowMs);
    if (retainedLayout.retained) {
      return retainedLayout;
    }
    clearBoardLayoutHooks(state);
    clearRetainedLayoutStatus(state);
    return {
      status: "missing-board",
      retained: false,
      recheckDelayMs: -1,
    };
  }

  if (resolution.status !== "valid") {
    const retainedLayout = maybeRetainLayoutHooks(state, resolution.status, previous, nowMs);
    if (retainedLayout.retained) {
      return retainedLayout;
    }
    clearBoardLayoutHooks(state);
    clearRetainedLayoutStatus(state);
    return {
      status: resolution.status,
      retained: false,
      recheckDelayMs: -1,
    };
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
  removeBoardGapHold(previous);

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
  markHealthyLayoutRetention(state, nowMs);
  return {
    status: "valid",
    retained: false,
    recheckDelayMs: -1,
  };
}
