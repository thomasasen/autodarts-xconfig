const THEME_SURFACE_WATCH_SELECTORS = Object.freeze([
  "#grid",
  ".ad-ext-cricket-grid",
  ".ad-ext-crfx-root",
  ".ad-ext-theme-content-slot",
  ".ad-ext-theme-content-board",
  ".ad-ext-theme-board-panel",
  ".ad-ext-theme-board-viewport",
  ".ad-ext-theme-board-canvas",
  ".ad-ext-theme-board-svg",
]);

function isNodeLike(node) {
  return Boolean(node) && typeof node === "object";
}

function containsNode(parentNode, childNode) {
  if (!parentNode || !childNode) {
    return false;
  }
  if (parentNode === childNode) {
    return true;
  }
  return typeof parentNode.contains === "function" ? parentNode.contains(childNode) : false;
}

function toNodeArray(value) {
  if (!value || typeof value[Symbol.iterator] !== "function") {
    return [];
  }
  return Array.from(value).filter(isNodeLike);
}

function normalizeWatchNodes(nodes = []) {
  return toNodeArray(nodes).filter((node) => node.isConnected !== false);
}

function collectMutationNodes(mutation) {
  const targetNode = mutation?.target || null;
  return [
    ...(targetNode ? [targetNode] : []),
    ...toNodeArray(mutation?.addedNodes),
    ...toNodeArray(mutation?.removedNodes),
  ];
}

function watchNodeTouchesCandidate(watchNode, candidateNode) {
  if (!watchNode || !candidateNode) {
    return false;
  }
  return (
    watchNode === candidateNode ||
    containsNode(watchNode, candidateNode) ||
    containsNode(candidateNode, watchNode)
  );
}

function isAttributeOnlyMutation(mutation) {
  return (
    String(mutation?.type || "") === "attributes" &&
    toNodeArray(mutation?.addedNodes).length === 0 &&
    toNodeArray(mutation?.removedNodes).length === 0
  );
}

export function createCricketSurfaceWatchState() {
  return {
    nodes: new Set(),
  };
}

export function clearCricketSurfaceWatchState(watchState) {
  if (!(watchState?.nodes instanceof Set)) {
    return;
  }
  watchState.nodes.clear();
}

export function setCricketSurfaceWatchNodes(watchState, nodes = []) {
  if (!(watchState?.nodes instanceof Set)) {
    return [];
  }

  watchState.nodes.clear();
  const nextNodes = normalizeWatchNodes(nodes);
  nextNodes.forEach((node) => watchState.nodes.add(node));
  return nextNodes;
}

export function collectCricketSurfaceWatchNodes({ documentRef, renderState, extraNodes = [] } = {}) {
  const nodes = [];
  const gridRoot = renderState?.gridSnapshot?.root || null;
  if (gridRoot) {
    nodes.push(gridRoot);
  }

  const boardSnapshot = renderState?.boardSnapshot || null;
  if (boardSnapshot?.svg) {
    nodes.push(boardSnapshot.svg);
  }
  if (boardSnapshot?.group) {
    nodes.push(boardSnapshot.group);
  }

  if (documentRef && typeof documentRef.querySelectorAll === "function") {
    THEME_SURFACE_WATCH_SELECTORS.forEach((selector) => {
      try {
        nodes.push(...documentRef.querySelectorAll(selector));
      } catch (_) {
        // ignore selector failures and keep best-effort watch coverage
      }
    });
  }

  nodes.push(...toNodeArray(extraNodes));
  return normalizeWatchNodes(nodes);
}

export function hasTrackedCricketSurfaceMutation(mutations = [], watchState = null) {
  if (!Array.isArray(mutations) || !mutations.length || !(watchState?.nodes instanceof Set)) {
    return false;
  }

  const trackedNodes = Array.from(watchState.nodes).filter(Boolean);
  if (!trackedNodes.length) {
    return false;
  }
  const trackedNodeSet = new Set(trackedNodes);

  return mutations.some((mutation) => {
    const touchedNodes = collectMutationNodes(mutation);
    if (!touchedNodes.length) {
      return false;
    }
    const attributeOnly = isAttributeOnlyMutation(mutation);
    return touchedNodes.some((candidateNode) => {
      if (attributeOnly) {
        return trackedNodes.some((watchNode) => {
          return candidateNode !== watchNode && containsNode(candidateNode, watchNode);
        });
      }
      if (trackedNodeSet.has(candidateNode)) {
        return true;
      }
      return trackedNodes.some((watchNode) => watchNodeTouchesCandidate(watchNode, candidateNode));
    });
  });
}
