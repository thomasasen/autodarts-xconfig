import { getActiveBoardInputMode } from "./board-input-mode.js";

function getBoardRadius(rootNode) {
  if (!rootNode || typeof rootNode.querySelectorAll !== "function") {
    return 0;
  }

  return Array.from(rootNode.querySelectorAll("circle")).reduce((max, circle) => {
    const radius = Number.parseFloat(circle?.getAttribute?.("r"));
    return Number.isFinite(radius) && radius > max ? radius : max;
  }, 0);
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

function getRenderableArea(node) {
  if (!node || typeof node.getBoundingClientRect !== "function") {
    return 0;
  }

  try {
    const rect = node.getBoundingClientRect();
    const width = Number.parseFloat(rect?.width);
    const height = Number.parseFloat(rect?.height);
    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
      return 0;
    }
    return Math.floor(width * height);
  } catch (_) {
    return 0;
  }
}

function hasClientRects(node) {
  if (!node || typeof node.getClientRects !== "function") {
    return true;
  }

  try {
    return node.getClientRects().length > 0;
  } catch (_) {
    return true;
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

  const state = normalizeText(node.getAttribute?.("data-state"));
  if (state === "inactive" || state === "closed" || state === "hidden" || state === "off") {
    return true;
  }

  const inlineDisplay = normalizeText(node.style?.display);
  const inlineVisibility = normalizeText(node.style?.visibility);
  const inlineOpacity = normalizeText(node.style?.opacity);
  if (
    inlineDisplay === "none" ||
    inlineVisibility === "hidden" ||
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

function selectHigherRadiusGroup(left, right) {
  if (!left) {
    return right;
  }
  if (!right) {
    return left;
  }
  return right.radius > left.radius ? right : left;
}

function resolveBestBoardGroup(svgNode) {
  if (!svgNode || typeof svgNode.querySelectorAll !== "function") {
    return {
      group: null,
      radius: 0,
    };
  }

  let bestVisibleGroup = null;
  let bestAnyGroup = null;

  Array.from(svgNode.querySelectorAll("g")).forEach((group) => {
    if (isManagedOverlayGroup(group)) {
      return;
    }

    const radius = getBoardRadius(group);
    if (radius <= 0) {
      return;
    }

    const candidate = {
      group,
      radius,
    };

    bestAnyGroup = selectHigherRadiusGroup(bestAnyGroup, candidate);
    if (isNodeVisible(group)) {
      bestVisibleGroup = selectHigherRadiusGroup(bestVisibleGroup, candidate);
    }
  });

  return bestVisibleGroup || bestAnyGroup || { group: null, radius: 0 };
}

function resolveBestBoardSvg(svgNodes = []) {
  let bestPreferred = null;
  let bestPreferredScore = -1;
  let bestFallback = null;
  let bestFallbackScore = -1;

  svgNodes.forEach((svgNode) => {
    const candidate = getBoardCandidateScore(svgNode);
    if (candidate.radius <= 0 || !candidate.visible) {
      return;
    }

    if (candidate.numberCount > 0 && candidate.score > bestPreferredScore) {
      bestPreferred = {
        svg: svgNode,
        meta: candidate,
      };
      bestPreferredScore = candidate.score;
    }

    const fallbackScore = Math.min(candidate.area, 999_999) + candidate.radius;
    if (fallbackScore > bestFallbackScore) {
      bestFallback = {
        svg: svgNode,
        meta: candidate,
      };
      bestFallbackScore = fallbackScore;
    }
  });

  return bestPreferred || bestFallback || null;
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

function isSnapshotModeReusable(snapshot, documentRef) {
  const currentModeKey = getActiveBoardInputMode(documentRef);
  if (Object.prototype.hasOwnProperty.call(snapshot, "modeKey") && snapshot.modeKey !== currentModeKey) {
    return false;
  }
  return true;
}

function isNodeVisible(node) {
  if (!node || typeof node !== "object" || node.isConnected === false) {
    return false;
  }

  let current = node;
  while (current && current !== current.ownerDocument?.documentElement?.parentNode) {
    if (isNodeExplicitlyHidden(current)) {
      return false;
    }
    current = current.parentElement || current.parentNode || null;
  }

  return hasClientRects(node) || getRenderableArea(node) > 0;
}

function getBoardCandidateScore(svgNode) {
  const numberCount = new Set(
    Array.from(svgNode.querySelectorAll("text"))
      .map((node) => Number.parseInt(node?.textContent || "", 10))
      .filter((value) => Number.isFinite(value) && value >= 1 && value <= 20)
  ).size;
  const radius = getBoardRadius(svgNode);
  const visible = isNodeVisible(svgNode);
  const area = getRenderableArea(svgNode);

  return {
    numberCount,
    radius,
    visible,
    area,
    score:
      (visible ? 10_000_000 : 0) +
      numberCount * 1_000 +
      Math.min(area, 999_999) +
      radius,
  };
}

export function isReusableBoardSnapshot(snapshot, documentRef) {
  if (!isSnapshotGroupReusable(snapshot)) {
    return false;
  }
  if (!hasReusableRadius(snapshot)) {
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

  const svgNodes = Array.from(documentRef.querySelectorAll("svg"));
  if (!svgNodes.length) {
    return null;
  }

  const bestBoard = resolveBestBoardSvg(svgNodes);
  if (!bestBoard?.svg || !bestBoard?.meta) {
    return null;
  }

  const bestSvg = bestBoard.svg;
  const bestGroupCandidate = resolveBestBoardGroup(bestSvg);
  const radius = bestGroupCandidate.radius || getBoardRadius(bestSvg);
  if (!radius) {
    return null;
  }

  return {
    svg: bestSvg,
    group: bestGroupCandidate.group || bestSvg,
    radius,
    modeKey: getActiveBoardInputMode(documentRef),
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
  if (!node || typeof node.firstChild === "undefined") {
    return;
  }

  while (node.firstChild) {
    node.removeChild(node.firstChild);
  }
}
