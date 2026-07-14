import { getActiveBoardInputMode } from "./board-input-mode.js";
import { getRenderableArea, isNodeVisible } from "./dom-visibility.js";

const BOARD_DRAWABLE_SELECTOR = "path, circle, line, polygon, polyline, text";
const BOARD_EXACT_VIEWBOX = Object.freeze({
  x: 0,
  y: 0,
  width: 1000,
  height: 1000,
});
const PREFERRED_BOARD_SVG_SELECTORS = Object.freeze([
  "svg.ad-ext-theme-board-svg",
  ".ad-ext-theme-board-viewport svg",
  ".ad-ext-theme-board-canvas svg",
  ".ad-ext-tv-board-zoom-host svg",
  ".showAnimations svg",
  ".css-aiihgx svg",
  ".css-79elbk svg",
]);
const IGNORED_BOARD_SVG_ANCESTOR_SELECTOR = [
  "#ad-xconfig-panel-host",
  "[data-adxconfig-checkout-board-preview-kind]",
].join(",");
const BOARD_SNAPSHOT_CACHE = new WeakMap();

function getBoardRadius(rootNode) {
  if (!rootNode || typeof rootNode.querySelectorAll !== "function") {
    return 0;
  }

  return Array.from(rootNode.querySelectorAll("circle")).reduce((max, circle) => {
    const radius = Number.parseFloat(circle?.getAttribute?.("r"));
    return Number.isFinite(radius) && radius > max ? radius : max;
  }, 0);
}

export function findBoardSvgRoot(documentRef) {
  if (!documentRef || typeof documentRef.querySelectorAll !== "function") {
    return null;
  }

  const cachedSnapshot = getCachedBoardSnapshot(documentRef);
  if (cachedSnapshot?.svg) {
    return cachedSnapshot.svg;
  }

  const svgNodes = queryCandidateSvgNodes(documentRef);
  if (!svgNodes.length) {
    return null;
  }

  let bestSvg = null;
  let bestScore = -1;

  svgNodes.forEach((svgNode) => {
    const numberCount = readNumberCoverage(svgNode);
    const radius = getBoardRadius(svgNode);
    const score = numberCount * 1000 + radius;
    if (score > bestScore) {
      bestSvg = svgNode;
      bestScore = score;
    }
  });

  return bestSvg;
}

function findLegacyBoardSvgGroupSnapshot(documentRef) {
  const bestSvg = findBoardSvgRoot(documentRef);
  if (!bestSvg) {
    return null;
  }

  let bestGroup = null;
  let bestRadius = 0;
  Array.from(bestSvg.querySelectorAll("g")).forEach((group) => {
    const groupRadius = getBoardRadius(group);
    if (groupRadius > bestRadius) {
      bestRadius = groupRadius;
      bestGroup = group;
    }
  });

  const radius = bestRadius || getBoardRadius(bestSvg);
  if (!radius) {
    return null;
  }

  return {
    svg: bestSvg,
    group: bestGroup || bestSvg,
    radius,
  };
}

function isManagedOverlayGroup(groupNode) {
  if (!groupNode || typeof groupNode.getAttribute !== "function") {
    return false;
  }

  const id = String(groupNode.getAttribute("id") || "").trim().toLowerCase();
  if (!id) {
    return false;
  }

  return id.startsWith("ad-ext-");
}

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function getElementChildren(node) {
  if (!node) {
    return [];
  }
  if (Array.isArray(node.children)) {
    return node.children.filter((child) => child?.nodeType === 1);
  }
  const rawChildren = Array.from(node.children || []);
  if (!rawChildren.length) {
    return [];
  }
  return rawChildren.filter((child) => child?.nodeType === 1);
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

  let current = targetNode.parentElement || targetNode.parentNode || null;
  while (current) {
    if (current === rootNode) {
      return true;
    }
    current = current.parentElement || current.parentNode || null;
  }
  return false;
}

function isIgnoredBoardSvgCandidate(svgNode) {
  if (!svgNode || typeof svgNode.closest !== "function") {
    return false;
  }

  return Boolean(svgNode.closest(IGNORED_BOARD_SVG_ANCESTOR_SELECTOR));
}

function isInteractiveControlNode(node) {
  if (!node || typeof node !== "object") {
    return false;
  }
  const tagName = normalizeText(node.tagName || node.nodeName);
  if (tagName === "button") {
    return true;
  }
  const role = normalizeText(node.getAttribute?.("role"));
  if (role === "button" || role === "tab" || role === "radio") {
    return true;
  }
  if (tagName === "input") {
    const type = normalizeText(node.getAttribute?.("type"));
    return type === "radio";
  }
  return false;
}

function countInteractiveControls(rootNode) {
  if (!rootNode || typeof rootNode !== "object") {
    return 0;
  }
  const directChildren = getElementChildren(rootNode);
  if (!directChildren.length) {
    return 0;
  }
  let count = 0;
  directChildren.forEach((child) => {
    if (isInteractiveControlNode(child)) {
      count += 1;
    }
    getElementChildren(child).forEach((grandChild) => {
      if (isInteractiveControlNode(grandChild)) {
        count += 1;
      }
    });
  });
  return count;
}

function hasBoardControlSiblingContext(svgNode) {
  if (!svgNode || typeof svgNode !== "object") {
    return false;
  }

  let current = svgNode.parentElement || svgNode.parentNode || null;
  let depth = 0;
  while (current && depth < 8) {
    const currentTag = normalizeText(current.tagName || current.nodeName);
    if (currentTag === "main" || currentTag === "body" || currentTag === "html") {
      current = current.parentElement || current.parentNode || null;
      depth += 1;
      continue;
    }

    const children = getElementChildren(current);
    if (children.length >= 2 && children.length <= 6) {
      const hasBoardChild = children.some((child) => elementContains(child, svgNode));
      const hasControlSibling = children.some((child) => {
        if (elementContains(child, svgNode)) {
          return false;
        }
        return countInteractiveControls(child) > 0;
      });
      if (hasBoardChild && hasControlSibling) {
        return true;
      }
    }
    current = current.parentElement || current.parentNode || null;
    depth += 1;
  }
  return false;
}

function getNodeDepthWithin(node, ancestorNode) {
  if (!node || !ancestorNode) {
    return 0;
  }

  let current = node;
  let depth = 0;
  while (current && current !== ancestorNode) {
    current = current.parentElement || current.parentNode || null;
    depth += 1;
  }
  return current === ancestorNode ? depth : 0;
}


function readNumberCoverage(rootNode) {
  if (!rootNode || typeof rootNode.querySelectorAll !== "function") {
    return 0;
  }

  return new Set(
    Array.from(rootNode.querySelectorAll("text"))
      .map((node) => Number.parseInt(node?.textContent || "", 10))
      .filter((value) => Number.isFinite(value) && value >= 1 && value <= 20)
  ).size;
}

function readDrawableMetrics(rootNode) {
  if (!rootNode || typeof rootNode.querySelectorAll !== "function") {
    return {
      pathCount: 0,
      circleCount: 0,
      positiveCircleCount: 0,
      uniquePositiveCircleCount: 0,
      lineCount: 0,
      polygonCount: 0,
      polylineCount: 0,
      textCount: 0,
      drawableCount: 0,
    };
  }

  const drawables = Array.from(rootNode.querySelectorAll(BOARD_DRAWABLE_SELECTOR));
  let pathCount = 0;
  let circleCount = 0;
  let lineCount = 0;
  let polygonCount = 0;
  let polylineCount = 0;
  let textCount = 0;
  const positiveCircleRadii = [];

  for (let i = 0; i < drawables.length; i++) {
    const tag = drawables[i].tagName.toLowerCase();
    switch (tag) {
      case "path":
        pathCount++;
        break;
      case "circle": {
        circleCount++;
        const r = Number.parseFloat(drawables[i]?.getAttribute?.("r"));
        if (Number.isFinite(r) && r > 0) {
          positiveCircleRadii.push(Number(r.toFixed(4)));
        }
        break;
      }
      case "line":
        lineCount++;
        break;
      case "polygon":
        polygonCount++;
        break;
      case "polyline":
        polylineCount++;
        break;
      case "text":
        textCount++;
        break;
    }
  }

  return {
    pathCount,
    circleCount,
    positiveCircleCount: positiveCircleRadii.length,
    uniquePositiveCircleCount: new Set(positiveCircleRadii).size,
    lineCount,
    polygonCount,
    polylineCount,
    textCount,
    drawableCount: drawables.length,
  };
}

function nearlyEqual(left, right, tolerance = 0.001) {
  if (!Number.isFinite(left) || !Number.isFinite(right)) {
    return false;
  }
  return Math.abs(left - right) <= tolerance;
}

function parseViewBoxMetrics(node) {
  if (!node || typeof node.getAttribute !== "function") {
    return {
      hasSquareViewBox: false,
      hasExactBoardViewBox: false,
    };
  }

  const rawViewBox = String(node.getAttribute("viewBox") || "")
    .trim()
    .replaceAll(",", " ")
    .replaceAll(/\s+/g, " ");
  if (!rawViewBox) {
    return {
      hasSquareViewBox: false,
      hasExactBoardViewBox: false,
    };
  }

  const parts = rawViewBox
    .split(" ")
    .map((entry) => Number.parseFloat(entry))
    .filter((value) => Number.isFinite(value));
  if (parts.length !== 4) {
    return {
      hasSquareViewBox: false,
      hasExactBoardViewBox: false,
    };
  }

  const [x, y, width, height] = parts;
  if (!(width > 0) || !(height > 0)) {
    return {
      hasSquareViewBox: false,
      hasExactBoardViewBox: false,
    };
  }

  const hasSquareViewBox = nearlyEqual(width / height, 1, 0.02);
  const hasExactBoardViewBox =
    nearlyEqual(x, BOARD_EXACT_VIEWBOX.x) &&
    nearlyEqual(y, BOARD_EXACT_VIEWBOX.y) &&
    nearlyEqual(width, BOARD_EXACT_VIEWBOX.width) &&
    nearlyEqual(height, BOARD_EXACT_VIEWBOX.height);

  return {
    hasSquareViewBox,
    hasExactBoardViewBox,
  };
}

function isSparseAmbiguousCandidate(meta) {
  return (
    meta.numberCount === 0 &&
    meta.positiveCircleCount <= 1 &&
    meta.drawableCount <= 3 &&
    meta.pathCount <= 2
  );
}

function isBoardLikeCandidate(meta, options = {}) {
  if (!meta || !Number.isFinite(meta.radius) || meta.radius <= 0 || !meta.visible) {
    return false;
  }

  if (meta.numberCount >= 18 && meta.radius >= 250) {
    return true;
  }

  if (
    meta.numberCount >= 5 &&
    (meta.pathCount >= 10 || meta.positiveCircleCount >= 3 || meta.drawableCount >= 20)
  ) {
    return true;
  }

  if (meta.pathCount >= 40) {
    return true;
  }

  if (meta.pathCount >= 20 && meta.drawableCount >= 24) {
    return true;
  }

  if (
    meta.positiveCircleCount >= 4 &&
    meta.uniquePositiveCircleCount >= 3 &&
    meta.drawableCount >= 24
  ) {
    return true;
  }

  if (
    options.isSvgCandidate === true &&
    (meta.hasSquareViewBox || meta.hasExactBoardViewBox) &&
    ((meta.pathCount >= 16 && meta.drawableCount >= 24) ||
      (meta.positiveCircleCount >= 4 && meta.drawableCount >= 20))
  ) {
    return true;
  }

  return false;
}

function getBoardCandidateScore(candidateNode, options = {}) {
  const numberCount = readNumberCoverage(candidateNode);
  const radius = getBoardRadius(candidateNode);
  const visible = isNodeVisible(candidateNode);
  const area = getRenderableArea(candidateNode);
  const drawableMetrics = readDrawableMetrics(candidateNode);
  const viewBoxMetrics = options.isSvgCandidate ? parseViewBoxMetrics(candidateNode) : {};
  const hasBoardControlContext = options.isSvgCandidate ? hasBoardControlSiblingContext(candidateNode) : false;

  const candidate = {
    numberCount,
    radius,
    visible,
    area,
    ...drawableMetrics,
    hasSquareViewBox: Boolean(viewBoxMetrics.hasSquareViewBox),
    hasExactBoardViewBox: Boolean(viewBoxMetrics.hasExactBoardViewBox),
    hasBoardControlContext,
  };
  candidate.isSparseAmbiguous = isSparseAmbiguousCandidate(candidate);
  candidate.isBoardLike = isBoardLikeCandidate(candidate, options);
  candidate.score = candidate.isBoardLike
    ? (
        Number(candidate.hasExactBoardViewBox) * 500_000 +
        Number(candidate.hasSquareViewBox) * 300_000 +
        Number(candidate.hasBoardControlContext) * 1_500_000 +
        candidate.numberCount * 200_000 +
        candidate.pathCount * 2_500 +
        candidate.drawableCount * 350 +
        candidate.uniquePositiveCircleCount * 6_000 +
        Math.min(candidate.area, 999_999) +
        candidate.radius * 50
      )
    : -1;
  return candidate;
}

function selectHigherScoreCandidate(left, right) {
  if (!left) {
    return right;
  }
  if (!right) {
    return left;
  }
  if (right.score === left.score) {
    return right.meta.radius > left.meta.radius ? right : left;
  }
  return right.score > left.score ? right : left;
}

function resolveBestBoardGroup(svgNode) {
  if (!svgNode || typeof svgNode.querySelectorAll !== "function") {
    return {
      group: null,
      radius: 0,
    };
  }

  let bestVisibleGroup = null;

  Array.from(svgNode.querySelectorAll("g")).forEach((group) => {
    if (isManagedOverlayGroup(group)) {
      return;
    }

    const meta = getBoardCandidateScore(group, { isSvgCandidate: false });
    if (!meta.visible || meta.radius <= 0 || !meta.isBoardLike) {
      return;
    }

    const candidate = {
      group,
      radius: meta.radius,
      meta: {
        ...meta,
        groupDepth: getNodeDepthWithin(group, svgNode),
      },
      score: meta.score,
    };

    bestVisibleGroup = selectHigherSpecificBoardGroup(bestVisibleGroup, candidate);
  });

  return bestVisibleGroup || { group: null, radius: 0 };
}

function selectHigherSpecificBoardGroup(left, right) {
  if (!left) {
    return right;
  }
  if (!right) {
    return left;
  }

  const containmentWinner = selectContainedBoardGroup(left, right);
  if (containmentWinner) {
    return containmentWinner;
  }

  if (right.score === left.score) {
    return selectScoreTiedBoardGroup(left, right);
  }
  return right.score > left.score ? right : left;
}

function selectContainedBoardGroup(left, right) {
  const leftContainsRight = elementContains(left.group, right.group) && left.group !== right.group;
  const rightContainsLeft = elementContains(right.group, left.group) && right.group !== left.group;
  if (leftContainsRight && !rightContainsLeft) {
    return right;
  }
  if (rightContainsLeft && !leftContainsRight) {
    return left;
  }
  return null;
}

function selectScoreTiedBoardGroup(left, right) {
  if (right.meta.groupDepth !== left.meta.groupDepth) {
    return right.meta.groupDepth > left.meta.groupDepth ? right : left;
  }
  return right.meta.radius > left.meta.radius ? right : left;
}

function resolveBestBoardSvg(svgNodes = []) {
  let bestCandidate = null;

  svgNodes.forEach((svgNode) => {
    const meta = getBoardCandidateScore(svgNode, { isSvgCandidate: true });
    if (!meta.visible || meta.radius <= 0 || !meta.isBoardLike) {
      return;
    }

    bestCandidate = selectHigherScoreCandidate(bestCandidate, {
      svg: svgNode,
      meta,
      score: meta.score,
    });
  });

  return bestCandidate || null;
}

function isSnapshotGroupReusable(snapshot) {
  if (!snapshot?.group) {
    return false;
  }
  if (snapshot.group.isConnected === false) {
    return false;
  }

  if (!snapshot?.svg || snapshot.svg.isConnected === false) {
    return false;
  }

  if (snapshot.group === snapshot.svg) {
    return true;
  }

  if (typeof snapshot.svg.contains === "function" && !snapshot.svg.contains(snapshot.group)) {
    return false;
  }

  return isNodeVisible(snapshot.group);
}

function hasReusableRadius(snapshot) {
  return Number.isFinite(snapshot?.radius) && Number(snapshot.radius) > 0;
}

function isSnapshotSemanticallyReusable(snapshot) {
  const svgNode = snapshot?.svg || null;
  if (!svgNode) {
    return false;
  }

  const svgMeta = getBoardCandidateScore(svgNode, { isSvgCandidate: true });
  if (!svgMeta.visible || svgMeta.radius <= 0 || !svgMeta.isBoardLike) {
    return false;
  }

  if (!snapshot?.group || snapshot.group === svgNode) {
    return true;
  }

  if (isManagedOverlayGroup(snapshot.group)) {
    return false;
  }

  const groupMeta = getBoardCandidateScore(snapshot.group, { isSvgCandidate: false });
  return groupMeta.visible && groupMeta.radius > 0 && groupMeta.isBoardLike;
}

function isSnapshotModeReusable(snapshot, documentRef) {
  const currentModeKey = getActiveBoardInputMode(documentRef);
  return !Object.hasOwn(snapshot, "modeKey") || snapshot.modeKey === currentModeKey;
}


function queryCandidateSvgNodes(documentRef) {
  if (!documentRef || typeof documentRef.querySelectorAll !== "function") {
    return [];
  }

  const seen = new Set();
  const preferred = [];

  PREFERRED_BOARD_SVG_SELECTORS.forEach((selector) => {
    Array.from(documentRef.querySelectorAll(selector)).forEach((node) => {
      if (!node || seen.has(node) || isIgnoredBoardSvgCandidate(node)) {
        return;
      }
      seen.add(node);
      preferred.push(node);
    });
  });

  Array.from(documentRef.querySelectorAll("svg")).forEach((node) => {
    if (!node || seen.has(node) || isIgnoredBoardSvgCandidate(node)) {
      return;
    }
    seen.add(node);
    preferred.push(node);
  });

  return preferred;
}

function getCachedBoardSnapshot(documentRef) {
  const snapshot = BOARD_SNAPSHOT_CACHE.get(documentRef) || null;
  if (!snapshot) {
    return null;
  }

  if (isIgnoredBoardSvgCandidate(snapshot.svg)) {
    BOARD_SNAPSHOT_CACHE.delete(documentRef);
    return null;
  }

  if (!isSnapshotGroupReusable(snapshot) || !hasReusableRadius(snapshot)) {
    BOARD_SNAPSHOT_CACHE.delete(documentRef);
    return null;
  }

  if (!isSnapshotModeReusable(snapshot, documentRef) || !isNodeVisible(snapshot.svg)) {
    BOARD_SNAPSHOT_CACHE.delete(documentRef);
    return null;
  }

  return snapshot;
}

function cacheBoardSnapshot(documentRef, snapshot) {
  if (!documentRef) {
    return snapshot || null;
  }

  if (snapshot) {
    BOARD_SNAPSHOT_CACHE.set(documentRef, snapshot);
  } else {
    BOARD_SNAPSHOT_CACHE.delete(documentRef);
  }
  return snapshot || null;
}

function getNodeRect(node) {
  if (!node || typeof node.getBoundingClientRect !== "function") {
    return null;
  }

  try {
    const rect = node.getBoundingClientRect();
    if (Number(rect?.width) <= 0 || Number(rect?.height) <= 0) {
      return null;
    }
    return rect;
  } catch (_) {
    return null;
  }
}

function rectContainsRect(outerRect, innerRect, tolerancePx = 0) {
  if (!outerRect || !innerRect) {
    return false;
  }

  return (
    innerRect.left >= outerRect.left - tolerancePx &&
    innerRect.top >= outerRect.top - tolerancePx &&
    innerRect.right <= outerRect.right + tolerancePx &&
    innerRect.bottom <= outerRect.bottom + tolerancePx
  );
}

function rectsOverlap(leftRect, rightRect, tolerancePx = 0) {
  if (!leftRect || !rightRect) {
    return false;
  }

  return !(
    leftRect.right < rightRect.left - tolerancePx ||
    leftRect.left > rightRect.right + tolerancePx ||
    leftRect.bottom < rightRect.top - tolerancePx ||
    leftRect.top > rightRect.bottom + tolerancePx
  );
}

function isUsableBoardSnapshot(snapshot, documentRef) {
  return Boolean(snapshot) && isReusableBoardSnapshot(snapshot, documentRef);
}

function resolvePreferredBoardSnapshot(documentRef) {
  const canonicalSnapshot = findBoardSvgGroup(documentRef);
  if (isUsableBoardSnapshot(canonicalSnapshot, documentRef)) {
    return canonicalSnapshot;
  }

  const legacySnapshot = findLegacyBoardSvgGroupSnapshot(documentRef);
  if (isUsableBoardSnapshot(legacySnapshot, documentRef)) {
    return legacySnapshot;
  }

  return canonicalSnapshot || legacySnapshot || null;
}

function isValidZoomTargetCandidate(candidateNode, boardSvg) {
  if (!candidateNode || !boardSvg) {
    return false;
  }
  if (!elementContains(candidateNode, boardSvg) || !isNodeVisible(candidateNode)) {
    return false;
  }

  const candidateRect = getNodeRect(candidateNode);
  const boardRect = getNodeRect(boardSvg);
  if (!candidateRect || !boardRect) {
    return false;
  }

  if (candidateRect.width + 2 < boardRect.width || candidateRect.height + 2 < boardRect.height) {
    return false;
  }

  const tolerancePx = Math.max(6, Math.min(boardRect.width, boardRect.height) * 0.08);
  return rectContainsRect(candidateRect, boardRect, tolerancePx);
}

function isValidZoomHostCandidate(candidateNode, zoomTarget) {
  if (!candidateNode || !zoomTarget) {
    return false;
  }
  if (!elementContains(candidateNode, zoomTarget) || !isNodeVisible(candidateNode)) {
    return false;
  }

  const candidateRect = getNodeRect(candidateNode);
  const targetRect = getNodeRect(zoomTarget);
  if (!candidateRect || !targetRect) {
    return false;
  }

  const tolerancePx = Math.max(6, Math.min(targetRect.width, targetRect.height) * 0.08);
  return rectsOverlap(candidateRect, targetRect, tolerancePx);
}

export function isReusableBoardSnapshot(snapshot, documentRef) {
  if (!isSnapshotGroupReusable(snapshot)) {
    return false;
  }
  if (!hasReusableRadius(snapshot)) {
    return false;
  }
  if (!isSnapshotSemanticallyReusable(snapshot)) {
    return false;
  }
  if (!isSnapshotModeReusable(snapshot, documentRef)) {
    return false;
  }
  return isNodeVisible(snapshot.svg);
}

export function findBoardSvgGroup(documentRef) {
  if (!documentRef || typeof documentRef.querySelectorAll !== "function") {
    return null;
  }

  const cachedSnapshot = getCachedBoardSnapshot(documentRef);
  if (cachedSnapshot) {
    return cachedSnapshot;
  }

  const svgNodes = queryCandidateSvgNodes(documentRef);
  if (!svgNodes.length) {
    return cacheBoardSnapshot(documentRef, null);
  }

  const bestBoard = resolveBestBoardSvg(svgNodes);
  if (!bestBoard?.svg || !bestBoard?.meta) {
    return cacheBoardSnapshot(documentRef, null);
  }

  const bestSvg = bestBoard.svg;
  const bestGroupCandidate = resolveBestBoardGroup(bestSvg);
  const radius = bestGroupCandidate.radius || bestBoard.meta.radius || getBoardRadius(bestSvg);
  if (!radius) {
    return cacheBoardSnapshot(documentRef, null);
  }

  return cacheBoardSnapshot(documentRef, {
    svg: bestSvg,
    group: bestGroupCandidate.group || bestSvg,
    radius,
    modeKey: getActiveBoardInputMode(documentRef),
  });
}

function areBoardSnapshotsEquivalent(left, right) {
  if (!left || !right) {
    return left === right;
  }

  return (
    left.svg === right.svg &&
    left.group === right.group &&
    nearlyEqual(left.radius, right.radius)
  );
}

export function findCheckoutCompatibleBoardSnapshot(documentRef) {
  const preferredSnapshot = resolvePreferredBoardSnapshot(documentRef);
  if (preferredSnapshot) {
    return preferredSnapshot;
  }

  const legacySnapshot = findLegacyBoardSvgGroupSnapshot(documentRef);
  const canonicalSnapshot = findBoardSvgGroup(documentRef);
  if (areBoardSnapshotsEquivalent(legacySnapshot, canonicalSnapshot)) {
    return canonicalSnapshot;
  }

  return canonicalSnapshot || legacySnapshot || null;
}

export function resolveBoardZoomTargetNode(boardSvg) {
  if (!boardSvg || typeof boardSvg.closest !== "function") {
    return null;
  }

  const stableBoardCanvas = boardSvg.closest(".ad-ext-theme-board-canvas");
  const showAnimations = boardSvg.closest(".showAnimations");
  const directParent = boardSvg.parentElement || null;
  const candidateOrder = [];

  if (
    directParent &&
    directParent !== stableBoardCanvas &&
    directParent !== showAnimations
  ) {
    candidateOrder.push(directParent);
  }
  if (stableBoardCanvas) {
    candidateOrder.push(stableBoardCanvas);
  }
  if (showAnimations) {
    candidateOrder.push(showAnimations);
  }
  if (directParent) {
    candidateOrder.push(directParent);
  }
  candidateOrder.push(boardSvg);

  const seen = new Set();
  for (const candidateNode of candidateOrder) {
    if (!candidateNode || seen.has(candidateNode)) {
      continue;
    }
    seen.add(candidateNode);
    if (isValidZoomTargetCandidate(candidateNode, boardSvg)) {
      return candidateNode;
    }
  }

  return directParent || stableBoardCanvas || showAnimations || boardSvg;
}

export function resolveBoardZoomHostNode(zoomTarget) {
  if (!zoomTarget || typeof zoomTarget.closest !== "function") {
    return null;
  }

  const candidateOrder = [
    zoomTarget.closest(".ad-ext-theme-board-viewport"),
    zoomTarget.closest(".css-tqsk66"),
    zoomTarget.parentElement || null,
    zoomTarget.closest(".showAnimations"),
  ];

  const seen = new Set();
  for (const candidateNode of candidateOrder) {
    if (!candidateNode || seen.has(candidateNode)) {
      continue;
    }
    seen.add(candidateNode);
    if (isValidZoomHostCandidate(candidateNode, zoomTarget)) {
      return candidateNode;
    }
  }

  return zoomTarget.parentElement || zoomTarget.closest(".showAnimations") || null;
}

export function resolveBoardRenderSurface(documentRef) {
  const snapshot = findCheckoutCompatibleBoardSnapshot(documentRef);
  if (!snapshot?.svg || !snapshot?.group || !snapshot?.radius) {
    return null;
  }

  const zoomTarget = resolveBoardZoomTargetNode(snapshot.svg);
  const zoomHost = resolveBoardZoomHostNode(zoomTarget);

  return {
    ...snapshot,
    zoomTarget,
    zoomHost,
  };
}

export function ensureOverlayGroup(boardGroup, overlayId, svgNs = "http://www.w3.org/2000/svg") {
  if (!boardGroup || typeof boardGroup.querySelector !== "function") {
    return null;
  }

  let overlay = boardGroup.querySelector(`#${overlayId}`);
  if (overlay) {
    return overlay;
  }

  const ownerDocument = boardGroup.ownerDocument;
  if (!ownerDocument || typeof ownerDocument.createElementNS !== "function") {
    return null;
  }

  overlay = ownerDocument.createElementNS(svgNs, "g");
  overlay.id = overlayId;
  if (typeof boardGroup.appendChild === "function") {
    boardGroup.appendChild(overlay);
  }
  return overlay;
}

export function clearNodeChildren(node) {
  if (node?.firstChild === undefined) {
    return;
  }

  while (node.firstChild) {
    node.firstChild.remove();
  }
}
