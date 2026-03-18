import { createRafScheduler } from "../../../shared/raf-scheduler.js";
import {
  PREVIEW_SPACE_CLASS,
  isPreviewPlacementEnabled,
  isThemeVariantActive,
  togglePreviewSpace,
} from "./theme-utils.js";
import { createManagedNodeMatcher, hasExternalDomMutation } from "../../../core/dom-mutation-filter.js";

export const THEME_LAYOUT_HOOK_CLASSES = Object.freeze({
  contentSlot: "ad-ext-theme-content-slot",
  contentLeft: "ad-ext-theme-content-left",
  contentBoard: "ad-ext-theme-content-board",
  boardPanel: "ad-ext-theme-board-panel",
  boardControls: "ad-ext-theme-board-controls",
  boardViewport: "ad-ext-theme-board-viewport",
  boardEventShell: "ad-ext-theme-board-event-shell",
  boardCanvas: "ad-ext-theme-board-canvas",
  boardMediaRoot: "ad-ext-theme-board-media-root",
  boardSvg: "ad-ext-theme-board-svg",
});
const BOARD_SIZE_CSS_VARIABLE = "--ad-ext-theme-board-size";
const CRICKET_BOARD_WIDTH_CSS_VARIABLE = "--ad-ext-theme-cricket-board-width";
const CRICKET_PLAYER_AREA_REQUIRED_WIDTH_CSS_VARIABLE =
  "--ad-ext-theme-cricket-player-area-required-width";
const CRICKET_THEME_FEATURE_KEY = "theme-cricket";
const CRICKET_READABILITY_POLICY = Object.freeze({
  playerCardMinWidthPx: 205,
  playerCardGapPx: 0,
  playerAreaPaddingPx: 12,
  contentGapPx: 8,
  boardAutoMinWidthPx: 288,
  boardManualMinWidthPx: 160,
});
export const THEME_CRICKET_READABILITY = Object.freeze({
  constrainedClass: "ad-ext-theme-cricket-readability-constrained",
  boardHiddenClass: "ad-ext-theme-cricket-board-hidden",
  boardForcedVisibleClass: "ad-ext-theme-cricket-board-forced-visible",
  noticeId: "ad-ext-theme-cricket-readability-notice",
  noticeClass: "ad-ext-theme-cricket-readability-notice",
  noticeTextClass: "ad-ext-theme-cricket-readability-text",
  toggleClass: "ad-ext-theme-cricket-readability-toggle",
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

function getBoardRadius(rootNode) {
  if (!rootNode || typeof rootNode.querySelectorAll !== "function") {
    return 0;
  }

  return Array.from(rootNode.querySelectorAll("circle")).reduce((max, circle) => {
    const radius = Number.parseFloat(circle?.getAttribute?.("r"));
    return Number.isFinite(radius) && radius > max ? radius : max;
  }, 0);
}

function getNumberCoverage(svgNode) {
  if (!svgNode || typeof svgNode.querySelectorAll !== "function") {
    return 0;
  }

  const labels = new Set(
    Array.from(svgNode.querySelectorAll("text"))
      .map((node) => Number.parseInt(node?.textContent || "", 10))
      .filter((value) => Number.isFinite(value) && value >= 1 && value <= 20)
  );
  return labels.size;
}

function findBoardSvg(documentRef) {
  if (!documentRef || typeof documentRef.querySelectorAll !== "function") {
    return null;
  }

  const svgNodes = Array.from(documentRef.querySelectorAll("svg"));
  if (!svgNodes.length) {
    return null;
  }

  let bestSvg = null;
  let bestScore = -1;
  svgNodes.forEach((svgNode) => {
    const score = getNumberCoverage(svgNode) * 1000 + getBoardRadius(svgNode);
    if (score > bestScore) {
      bestScore = score;
      bestSvg = svgNode;
    }
  });
  return bestScore > 0 ? bestSvg : null;
}

export function resolveThemeBoardCanvasTarget(boardSvg) {
  if (!boardSvg || typeof boardSvg.closest !== "function") {
    return null;
  }

  const stableBoardCanvas = boardSvg.closest(".ad-ext-theme-board-canvas");
  const showAnimations = boardSvg.closest(".showAnimations");
  const directParent = boardSvg.parentElement || null;

  if (
    directParent &&
    directParent !== stableBoardCanvas &&
    directParent !== showAnimations
  ) {
    return directParent;
  }

  if (stableBoardCanvas) {
    return stableBoardCanvas;
  }

  if (showAnimations) {
    return showAnimations;
  }

  return directParent || boardSvg;
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

  return {
    boardEventShell: showAnimations,
    boardMediaRoot: boardCanvas,
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
    const children = getElementChildren(current);
    if (children.length >= 2) {
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

function clearBoardSizeVariable(node) {
  if (!node || !node.style || typeof node.style.removeProperty !== "function") {
    return;
  }
  node.style.removeProperty(BOARD_SIZE_CSS_VARIABLE);
}

function updateBoardSizeVariable(node, sizingNode = null) {
  if (!node || !node.style || typeof node.style.setProperty !== "function") {
    return;
  }

  const measurementNode = sizingNode || node;
  const width = getElementWidth(measurementNode);
  const height = getElementHeight(measurementNode);
  const boardSize = Math.floor(Math.min(width, height));
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

function resolveBoardLayoutTargets(documentRef) {
  const boardSvg = findBoardSvg(documentRef);
  if (!boardSvg) {
    return null;
  }

  const contentTargets = resolveContentLayoutTargets(documentRef, boardSvg) || {};
  const hasCompleteContentTargets =
    Boolean(contentTargets.contentSlot) &&
    Boolean(contentTargets.contentLeft) &&
    Boolean(contentTargets.contentBoard);
  const boardCanvas = resolveThemeBoardCanvasTarget(boardSvg);
  const boardEventTargets = resolveThemeBoardEventTargets(boardCanvas, boardSvg);
  const boardViewport = resolveThemeBoardViewportTarget(boardCanvas, boardSvg);
  const boardPanel = resolveBoardPanel(boardSvg, documentRef);
  const boardControls = boardPanel ? resolveBoardControls(boardPanel, boardSvg) : null;

  return {
    ...(hasCompleteContentTargets ? contentTargets : {}),
    boardPanel,
    boardControls,
    boardViewport,
    ...boardEventTargets,
    boardCanvas,
    boardSvg,
  };
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

function updateBoardLayoutHooks(documentRef, state) {
  const targets = resolveBoardLayoutTargets(documentRef);
  const nextTargets = targets || {};
  const previous = state.layoutHookTargets || {};
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
    clearStyleVariable(previousContentSlot, CRICKET_PLAYER_AREA_REQUIRED_WIDTH_CSS_VARIABLE);
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
  const playerAreaRequiredWidthPx =
    Number.isFinite(options.playerAreaRequiredWidthPx) && options.playerAreaRequiredWidthPx > 0
      ? Math.floor(options.playerAreaRequiredWidthPx)
      : 0;
  toggleClass(contentSlotNode, THEME_CRICKET_READABILITY.constrainedClass, isConstrained);
  toggleClass(contentSlotNode, THEME_CRICKET_READABILITY.boardHiddenClass, boardHidden);
  toggleClass(
    contentSlotNode,
    THEME_CRICKET_READABILITY.boardForcedVisibleClass,
    boardForcedVisible
  );

  if (playerAreaRequiredWidthPx > 0) {
    updateStyleVariable(
      contentSlotNode,
      CRICKET_PLAYER_AREA_REQUIRED_WIDTH_CSS_VARIABLE,
      `${playerAreaRequiredWidthPx}px`
    );
  } else {
    clearStyleVariable(contentSlotNode, CRICKET_PLAYER_AREA_REQUIRED_WIDTH_CSS_VARIABLE);
  }

  if (boardForcedVisible && boardWidthPx > 0) {
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

function clearCricketReadabilityPolicy(state) {
  if (!state || typeof state !== "object") {
    return;
  }

  const readabilityState = state.cricketReadability;
  if (!readabilityState || typeof readabilityState !== "object") {
    state.cricketReadability = createCricketReadabilityState();
    return;
  }

  clearStyleVariable(readabilityState.contentSlotNode, CRICKET_BOARD_WIDTH_CSS_VARIABLE);
  clearStyleVariable(
    readabilityState.contentSlotNode,
    CRICKET_PLAYER_AREA_REQUIRED_WIDTH_CSS_VARIABLE
  );
  updateCricketReadabilityClasses(state, null, {});
  removeCricketReadabilityNotice(state);
  state.cricketReadability = createCricketReadabilityState();
}

function applyCricketReadabilityPolicy(documentRef, state, scheduler) {
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
  const playerDisplayNode = documentRef?.getElementById?.("ad-ext-player-display") || null;

  if (!contentSlotNode || !contentLeftNode || !playerDisplayNode) {
    updateCricketReadabilityClasses(state, contentSlotNode, {});
    removeCricketReadabilityNotice(state);
    readabilityState.isConstrained = false;
    readabilityState.boardHidden = false;
    readabilityState.boardAutoHidden = false;
    readabilityState.boardForcedVisible = false;
    readabilityState.boardWidthPx = 0;
    readabilityState.playerAreaRequiredWidthPx = 0;
    return;
  }

  const slotWidth = getElementWidth(contentSlotNode);
  const playerCount = countCricketPlayerCards(playerDisplayNode);
  const requiredPlayerWidth = computeCricketRequiredPlayerWidth(playerCount);
  const availableBoardWidth =
    slotWidth -
    requiredPlayerWidth -
    (playerCount > 0 ? CRICKET_READABILITY_POLICY.contentGapPx : 0);
  const isConstrained =
    slotWidth > 0 &&
    playerCount > 0 &&
    availableBoardWidth < CRICKET_READABILITY_POLICY.boardAutoMinWidthPx;

  if (!isConstrained) {
    readabilityState.manualOverride = null;
    readabilityState.isConstrained = false;
    readabilityState.boardHidden = false;
    readabilityState.boardAutoHidden = false;
    readabilityState.boardForcedVisible = false;
    readabilityState.boardWidthPx = 0;
    readabilityState.playerAreaRequiredWidthPx = requiredPlayerWidth;
    updateCricketReadabilityClasses(state, contentSlotNode, {
      isConstrained: false,
      boardHidden: false,
      boardForcedVisible: false,
      boardWidthPx: 0,
      playerAreaRequiredWidthPx: requiredPlayerWidth,
    });
    removeCricketReadabilityNotice(state);
    return;
  }

  const boardForcedVisible = readabilityState.manualOverride === "show";
  const boardHidden = !boardForcedVisible;
  const boardWidthPx = boardForcedVisible
    ? Math.max(CRICKET_READABILITY_POLICY.boardManualMinWidthPx, Math.floor(availableBoardWidth))
    : 0;
  readabilityState.isConstrained = true;
  readabilityState.boardHidden = boardHidden;
  readabilityState.boardAutoHidden = boardHidden;
  readabilityState.boardForcedVisible = boardForcedVisible;
  readabilityState.boardWidthPx = boardWidthPx;
  readabilityState.playerAreaRequiredWidthPx = requiredPlayerWidth;
  updateCricketReadabilityClasses(state, contentSlotNode, {
    isConstrained: true,
    boardHidden,
    boardForcedVisible,
    boardWidthPx,
    playerAreaRequiredWidthPx: requiredPlayerWidth,
  });
  ensureCricketReadabilityNotice(documentRef, state, contentLeftNode, () => {
    readabilityState.manualOverride = readabilityState.boardHidden ? "show" : "hide";
    if (scheduler && typeof scheduler.schedule === "function") {
      scheduler.schedule();
    }
  });
  updateCricketReadabilityNotice(state, { boardHidden, boardForcedVisible });
}

export function mountThemeFeature(context = {}, options = {}) {
  const documentRef = context.documentRef || (typeof document !== "undefined" ? document : null);
  const windowRef = context.windowRef || (typeof window !== "undefined" ? window : null);
  const domGuards = context.domGuards;
  const gameState = context.gameState;
  const config = context.config;
  const observerRegistry = context.registries?.observers;
  const listenerRegistry = context.registries?.listeners;

  const featureKey = String(options.featureKey || "").trim();
  const configKey = String(options.configKey || "").trim();
  const styleId = String(options.styleId || "").trim();
  const variantName = String(options.variantName || "").trim();
  const matchMode = String(options.matchMode || "equals").trim().toLowerCase();
  const previewPlacement = options.previewPlacement || {};
  const previewSpaceClass = String(
    previewPlacement.previewSpaceClass || PREVIEW_SPACE_CLASS
  ).trim();
  const buildThemeCss =
    typeof options.buildThemeCss === "function"
      ? options.buildThemeCss
      : () => "";

  if (!documentRef || !domGuards || !featureKey || !configKey || !styleId || !variantName) {
    return () => {};
  }

  const observerKey = `${featureKey}:theme-observer`;
  const resizeListenerKey = `${featureKey}:theme-resize`;
  const scrollListenerKey = `${featureKey}:theme-scroll`;
  const isCricketTheme = featureKey === CRICKET_THEME_FEATURE_KEY;
  const themeState = {
    layoutHookTargets: {},
    cricketReadability: createCricketReadabilityState(),
  };

  function evaluateThemeState() {
    const featureConfig =
      config && typeof config.getFeatureConfig === "function"
        ? config.getFeatureConfig(configKey)
        : {};

    const isActive = isThemeVariantActive({
      variantName,
      matchMode,
      gameState,
      windowRef,
      documentRef,
    });

    if (!isActive) {
      domGuards.removeNodeById(styleId);
      togglePreviewSpace(documentRef, previewPlacement, false);
      clearBoardLayoutHooks(themeState);
      if (isCricketTheme) {
        clearCricketReadabilityPolicy(themeState);
      }
      return;
    }

    const cssText = String(buildThemeCss(featureConfig) || "").trim();
    if (!cssText) {
      domGuards.removeNodeById(styleId);
      togglePreviewSpace(documentRef, previewPlacement, false);
      clearBoardLayoutHooks(themeState);
      if (isCricketTheme) {
        clearCricketReadabilityPolicy(themeState);
      }
      return;
    }

    domGuards.ensureStyle(styleId, cssText);
    const previewSpaceEnabled = isPreviewPlacementEnabled(
      documentRef,
      previewPlacement,
      windowRef
    );
    togglePreviewSpace(documentRef, previewPlacement, previewSpaceEnabled);
    updateBoardLayoutHooks(documentRef, themeState);
    if (isCricketTheme) {
      applyCricketReadabilityPolicy(documentRef, themeState, scheduler);
    }
  }

  const readabilityManagedClassNames = isCricketTheme
    ? [
        THEME_CRICKET_READABILITY.noticeClass,
        THEME_CRICKET_READABILITY.noticeTextClass,
        THEME_CRICKET_READABILITY.toggleClass,
      ]
    : [];
  const managedClassNames = Array.from(
    new Set(
      [
        previewSpaceClass,
        ...Object.values(THEME_LAYOUT_HOOK_CLASSES),
        ...readabilityManagedClassNames,
      ].filter(Boolean)
    )
  );
  const scheduler =
    context.helpers && typeof context.helpers.createRafScheduler === "function"
      ? context.helpers.createRafScheduler(evaluateThemeState)
      : createRafScheduler(evaluateThemeState, { windowRef });
  const isManagedNode = createManagedNodeMatcher({
    ids: [styleId, isCricketTheme ? THEME_CRICKET_READABILITY.noticeId : ""].filter(Boolean),
    classNames: managedClassNames,
  });

  const rootNode = documentRef.documentElement || documentRef.body || documentRef;
  if (observerRegistry && typeof observerRegistry.registerMutationObserver === "function") {
    observerRegistry.registerMutationObserver({
      key: observerKey,
      target: rootNode,
      callback: (mutations = []) => {
        if (!hasExternalDomMutation(mutations, isManagedNode)) {
          return;
        }
        scheduler.schedule();
      },
      observeOptions: {
        childList: true,
        subtree: true,
        characterData: true,
      },
      MutationObserverRef: windowRef?.MutationObserver,
    });
  }

  if (listenerRegistry && windowRef && typeof windowRef === "object") {
    listenerRegistry.register({
      key: resizeListenerKey,
      target: windowRef,
      type: "resize",
      handler: () => scheduler.schedule(),
    });

    listenerRegistry.register({
      key: scrollListenerKey,
      target: windowRef,
      type: "scroll",
      handler: () => scheduler.schedule(),
      options: true,
    });
  }

  const unsubscribeGameState =
    gameState && typeof gameState.subscribe === "function"
      ? gameState.subscribe(() => scheduler.schedule())
      : () => {};

  scheduler.schedule();

  let cleanedUp = false;
  return function cleanupThemeFeature() {
    if (cleanedUp) {
      return;
    }
    cleanedUp = true;

    scheduler.cancel();
    togglePreviewSpace(
      documentRef,
      { ...previewPlacement, previewSpaceClass },
      false
    );
    clearBoardLayoutHooks(themeState);
    if (isCricketTheme) {
      clearCricketReadabilityPolicy(themeState);
    }
    domGuards.removeNodeById(styleId);

    try {
      unsubscribeGameState();
    } catch (_) {
      // Keep cleanup fail-soft.
    }

    if (observerRegistry && typeof observerRegistry.disconnect === "function") {
      observerRegistry.disconnect(observerKey);
    }

    if (listenerRegistry && typeof listenerRegistry.remove === "function") {
      listenerRegistry.remove(resizeListenerKey);
      listenerRegistry.remove(scrollListenerKey);
    }
  };
}
