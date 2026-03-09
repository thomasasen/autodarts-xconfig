import { createRafScheduler } from "../../../shared/raf-scheduler.js";
import {
  PREVIEW_SPACE_CLASS,
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
  boardCanvas: "ad-ext-theme-board-canvas",
  boardSvg: "ad-ext-theme-board-svg",
});
const BOARD_SIZE_CSS_VARIABLE = "--ad-ext-theme-board-size";

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

function updateBoardSizeVariable(node) {
  if (!node || !node.style || typeof node.style.setProperty !== "function") {
    return;
  }

  const width = getElementWidth(node);
  const height = getElementHeight(node);
  const boardSize = Math.floor(Math.min(width, height));
  if (!Number.isFinite(boardSize) || boardSize <= 0) {
    clearBoardSizeVariable(node);
    return;
  }

  node.style.setProperty(BOARD_SIZE_CSS_VARIABLE, `${boardSize}px`);
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
  const boardCanvas = boardSvg.closest?.(".showAnimations") || boardSvg.parentElement || null;
  const boardViewport = boardCanvas?.parentElement || boardSvg.parentElement || null;
  const boardPanel = resolveBoardPanel(boardSvg, documentRef);
  const boardControls = boardPanel ? resolveBoardControls(boardPanel, boardSvg) : null;

  return {
    ...(hasCompleteContentTargets ? contentTargets : {}),
    boardPanel,
    boardControls,
    boardViewport,
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

function clearBoardLayoutHooks(state) {
  const previous = state?.layoutHookTargets || {};
  clearBoardSizeVariable(previous.boardCanvas);
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

  Object.entries(THEME_LAYOUT_HOOK_CLASSES).forEach(([key, className]) => {
    if (previous[key] && previous[key] !== nextTargets[key]) {
      removeClass(previous[key], className);
    }
  });

  Object.entries(THEME_LAYOUT_HOOK_CLASSES).forEach(([key, className]) => {
    addClass(nextTargets[key], className);
  });

  updateBoardSizeVariable(nextTargets.boardCanvas);

  state.layoutHookTargets = nextTargets;
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
  const themeState = { layoutHookTargets: {} };

  function evaluateThemeState() {
    const featureConfig =
      config && typeof config.getFeatureConfig === "function"
        ? config.getFeatureConfig(configKey)
        : {};

    const isActive = isThemeVariantActive({
      variantName,
      matchMode,
      gameState,
      documentRef,
    });

    if (!isActive) {
      domGuards.removeNodeById(styleId);
      togglePreviewSpace(documentRef, previewPlacement, false);
      clearBoardLayoutHooks(themeState);
      return;
    }

    const cssText = String(buildThemeCss(featureConfig) || "").trim();
    if (!cssText) {
      domGuards.removeNodeById(styleId);
      togglePreviewSpace(documentRef, previewPlacement, false);
      clearBoardLayoutHooks(themeState);
      return;
    }

    domGuards.ensureStyle(styleId, cssText);
    togglePreviewSpace(documentRef, previewPlacement, true);
    updateBoardLayoutHooks(documentRef, themeState);
  }

  const managedClassNames = Array.from(
    new Set([previewSpaceClass, ...Object.values(THEME_LAYOUT_HOOK_CLASSES)].filter(Boolean))
  );
  const scheduler =
    context.helpers && typeof context.helpers.createRafScheduler === "function"
      ? context.helpers.createRafScheduler(evaluateThemeState)
      : createRafScheduler(evaluateThemeState, { windowRef });
  const isManagedNode = createManagedNodeMatcher({
    ids: [styleId],
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
