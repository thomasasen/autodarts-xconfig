import { ZOOM_CLASS, ZOOM_HOST_CLASS } from "./style.js";
import {
  getFirstCheckoutRouteSegment,
  resolveCheckoutSurfaceSemantics,
} from "../x01-checkout-route.js";
import { resolveX01CheckoutContext } from "../x01-checkout-context.js";
import {
  resolveBoardZoomHostNode,
  resolveBoardZoomTargetNode,
} from "../../shared/dartboard-svg.js";

const SEGMENT_ORDER = Object.freeze([
  20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5,
]);
const RING_RATIOS = Object.freeze({
  outerBullInner: 0.031112,
  outerBullOuter: 0.075556,
  tripleInner: 0.431112,
  tripleOuter: 0.475556,
  doubleInner: 0.711112,
  doubleOuter: 0.755556,
});
const SINGLE_RING_RATIO = (RING_RATIOS.tripleOuter + RING_RATIOS.doubleInner) / 2;
const HOLD_AFTER_THIRD_MS = 1300;
const RELEASE_PADDING_MS = 40;
const CHECKOUT_DOUBLE_ZOOM_RANGE = Object.freeze({
  min: 2.35,
  max: 3.15,
});
const TRANSFORM_SIGNATURE_STEP_PX = 0.5;

function parseViewBox(svgNode) {
  if (!svgNode || typeof svgNode.getAttribute !== "function") {
    return {
      x: 0,
      y: 0,
      width: 1000,
      height: 1000,
    };
  }

  const baseVal = svgNode.viewBox?.baseVal;
  if (baseVal && Number.isFinite(baseVal.width) && baseVal.width > 0) {
    return {
      x: Number(baseVal.x),
      y: Number(baseVal.y),
      width: Number(baseVal.width),
      height: Number(baseVal.height),
    };
  }

  const raw = String(svgNode.getAttribute("viewBox") || "").trim();
  const parts = raw.split(/[,\s]+/).map(Number);
  if (parts.length === 4 && parts.every(Number.isFinite) && parts[2] > 0 && parts[3] > 0) {
    return {
      x: parts[0],
      y: parts[1],
      width: parts[2],
      height: parts[3],
    };
  }

  return {
    x: 0,
    y: 0,
    width: 1000,
    height: 1000,
  };
}

function clamp(value, minValue, maxValue) {
  if (!Number.isFinite(value)) {
    return minValue;
  }
  if (!Number.isFinite(minValue) || !Number.isFinite(maxValue)) {
    return value;
  }
  if (minValue > maxValue) {
    return (minValue + maxValue) / 2;
  }
  return Math.min(maxValue, Math.max(minValue, value));
}

function quantizeForSignature(value, step = TRANSFORM_SIGNATURE_STEP_PX) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  const numericStep = Number(step);
  if (!Number.isFinite(numericStep) || numericStep <= 0) {
    return value;
  }

  return Math.round(value / numericStep) * numericStep;
}

function parseSegmentWithFallback(segmentName, x01Rules) {
  if (x01Rules && typeof x01Rules.parseSegment === "function") {
    const parsed = x01Rules.parseSegment(segmentName);
    if (parsed) {
      return parsed;
    }
  }

  const normalized =
    x01Rules && typeof x01Rules.normalizeSegmentName === "function"
      ? x01Rules.normalizeSegmentName(segmentName)
      : String(segmentName || "").trim().toUpperCase();

  if (!normalized) {
    return null;
  }

  if (normalized === "BULL") {
    return {
      normalized: "BULL",
      ring: "D",
      value: 25,
      score: 50,
    };
  }

  if (normalized === "S25" || normalized === "SB" || normalized === "OB") {
    return {
      normalized: "S25",
      ring: "S",
      value: 25,
      score: 25,
    };
  }

  const match = normalized.match(/^([SDT])(\d{1,2})$/);
  if (!match) {
    return null;
  }

  const value = Number(match[2]);
  if (!(value >= 1 && value <= 20)) {
    return null;
  }

  const ring = match[1];
  let multiplier = 1;
  if (ring === "D") {
    multiplier = 2;
  } else if (ring === "T") {
    multiplier = 3;
  }
  return {
    normalized: `${ring}${value}`,
    ring,
    value,
    score: value * multiplier,
  };
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

function segmentAngles(value) {
  const index = SEGMENT_ORDER.indexOf(Number(value));
  if (index < 0) {
    return null;
  }

  const center = index * 18;
  return {
    start: center - 9,
    end: center + 9,
    center,
  };
}

export function resolveSegmentPoint(segmentName, boardSvg, x01Rules) {
  const parsedSegment = parseSegmentWithFallback(segmentName, x01Rules);
  if (!parsedSegment || !boardSvg) {
    return null;
  }

  const viewBox = parseViewBox(boardSvg);
  const boardRadius = getBoardRadius(boardSvg);
  const radius =
    Number.isFinite(boardRadius) && boardRadius > 0
      ? boardRadius
      : Math.min(viewBox.width, viewBox.height) / 2;
  const center = {
    x: viewBox.x + viewBox.width / 2,
    y: viewBox.y + viewBox.height / 2,
  };

  if (parsedSegment.normalized === "BULL" || (parsedSegment.value === 25 && parsedSegment.ring === "D")) {
    return {
      x: center.x,
      y: center.y,
      parsedSegment,
      viewBox,
    };
  }

  if (parsedSegment.value === 25 && parsedSegment.ring === "S") {
    const ratio = (RING_RATIOS.outerBullInner + RING_RATIOS.outerBullOuter) / 2;
    return {
      x: center.x,
      y: center.y - radius * ratio,
      parsedSegment,
      viewBox,
    };
  }

  const angles = segmentAngles(parsedSegment.value);
  if (!angles) {
    return null;
  }

  let ratio = SINGLE_RING_RATIO;
  if (parsedSegment.ring === "T") {
    ratio = (RING_RATIOS.tripleInner + RING_RATIOS.tripleOuter) / 2;
  } else if (parsedSegment.ring === "D") {
    ratio = (RING_RATIOS.doubleInner + RING_RATIOS.doubleOuter) / 2;
  }

  const radians = ((angles.center - 90) * Math.PI) / 180;
  return {
    x: center.x + radius * ratio * Math.cos(radians),
    y: center.y + radius * ratio * Math.sin(radians),
    parsedSegment,
    viewBox,
  };
}

export function resolveZoomTarget(boardSvg) {
  return resolveBoardZoomTargetNode(boardSvg);
}

export function resolveZoomHost(zoomTarget) {
  return resolveBoardZoomHostNode(zoomTarget);
}

export function getThrowSegmentName(throwEntry, x01Rules) {
  if (!x01Rules || typeof x01Rules.normalizeSegmentName !== "function") {
    return "";
  }

  const segmentName = throwEntry?.segment?.name || throwEntry?.entry || "";
  return x01Rules.normalizeSegmentName(segmentName);
}

function isOneDartCheckoutSegmentForMode(segmentName, outMode, x01Rules) {
  if (!segmentName || !x01Rules) {
    return false;
  }

  if (typeof x01Rules.isOneDartCheckoutSegmentForOutMode === "function") {
    return x01Rules.isOneDartCheckoutSegmentForOutMode(segmentName, outMode);
  }

  if (typeof x01Rules.isOneDartCheckoutSegment === "function") {
    return x01Rules.isOneDartCheckoutSegment(segmentName);
  }

  return false;
}

function getScoreCheckoutSegment(activeScore, outMode, x01Rules) {
  if (!x01Rules || !Number.isFinite(activeScore)) {
    return "";
  }

  const segment =
    x01Rules.getPreferredOneDartCheckoutSegment?.(activeScore, outMode) ||
    x01Rules.getOneDartCheckoutSegment?.(activeScore) ||
    "";

  return isOneDartCheckoutSegmentForMode(segment, outMode, x01Rules) ? segment : "";
}

function canFinishWithSegment(activeScore, segmentName, outMode, x01Rules) {
  if (!x01Rules || !Number.isFinite(activeScore) || !segmentName) {
    return false;
  }

  if (typeof x01Rules.canFinishWithSegment === "function") {
    return x01Rules.canFinishWithSegment(activeScore, segmentName, outMode);
  }

  const parsed = parseSegmentWithFallback(segmentName, x01Rules);
  if (!parsed || parsed.score !== activeScore) {
    return false;
  }

  return isOneDartCheckoutSegmentForMode(segmentName, outMode, x01Rules);
}

function canUseThirdDartT20Setup(throws, throwCount, activeScore, outMode, x01Rules) {
  if (!x01Rules || throwCount !== 2) {
    return false;
  }

  const firstSegment = getThrowSegmentName(throws[0], x01Rules);
  const secondSegment = getThrowSegmentName(throws[1], x01Rules);
  if (firstSegment !== "T20" || secondSegment !== "T20") {
    return false;
  }

  if (typeof x01Rules.isSensibleThirdT20Score === "function") {
    return Boolean(x01Rules.isSensibleThirdT20Score(activeScore, outMode));
  }

  return true;
}

function buildCheckoutRouteIntent(segmentName, routeSegments, options = {}) {
  const segment = String(segmentName || "");
  if (!segment) {
    return null;
  }

  const routeLength = Array.isArray(routeSegments) ? routeSegments.length : 0;
  const isSingleRoute = routeLength === 1;
  const activeScore = Number(options.activeScore);
  const outMode = String(options.outMode || "");
  const x01Rules = options.x01Rules;
  const routeReason = String(options.routeReason || "route-finish");
  const matchesSingleCheckoutScore =
    isSingleRoute &&
    (!Number.isFinite(activeScore) ||
      canFinishWithSegment(activeScore, segment, outMode, x01Rules));
  const matchesCurrentCheckoutScore =
    !isSingleRoute &&
    Number.isFinite(activeScore) &&
    canFinishWithSegment(activeScore, segment, outMode, x01Rules);

  if (matchesCurrentCheckoutScore) {
    return {
      reason: "checkout",
      segment,
    };
  }

  if (isSingleRoute && matchesSingleCheckoutScore) {
    return {
      reason: "checkout",
      segment,
    };
  }

  if (routeReason === "route-first" && !isSingleRoute) {
    return {
      reason: routeReason,
      segment,
    };
  }

  return null;
}

export function getTurnId(turn) {
  const directId = String(turn?.id || "").trim();
  if (directId) {
    return directId;
  }

  const round = Number.isFinite(turn?.round) ? turn.round : -1;
  const turnNumber = Number.isFinite(turn?.turn) ? turn.turn : -1;
  const playerId = String(turn?.playerId || "").trim();
  return `fallback:${round}:${turnNumber}:${playerId}`;
}

function normalizeBoundaryTokenValue(value) {
  const normalized = String(value || "").trim();
  return normalized || "";
}

function resolveGameBoundaryToken(gameState) {
  if (!gameState || typeof gameState.getSnapshot !== "function") {
    return "";
  }

  const snapshot = gameState.getSnapshot();
  if (!snapshot || typeof snapshot !== "object") {
    return "";
  }

  const match = snapshot.match && typeof snapshot.match === "object" ? snapshot.match : null;
  const gameScopeCandidates = [
    match?.currentGameId,
    match?.gameId,
    match?.game?.id,
    match?.currentLegId,
    match?.legId,
    match?.leg?.id,
    match?.setId,
    match?.set?.id,
  ];

  for (const candidate of gameScopeCandidates) {
    const token = normalizeBoundaryTokenValue(candidate);
    if (token) {
      return `game:${token}`;
    }
  }

  const matchScopeCandidates = [
    match?.id,
    match?._id,
    match?.matchId,
    snapshot.topic,
  ];
  for (const candidate of matchScopeCandidates) {
    const token = normalizeBoundaryTokenValue(candidate);
    if (token) {
      return `match:${token}`;
    }
  }

  return "";
}

export function markManualZoomPause(state, throwCount = Number.NaN) {
  if (!state) {
    return;
  }

  state.holdUntilTs = 0;
  state.activeIntent = null;
  state.stickyUntilTurnChange = false;
  state.stickyUntilLegEnd = false;
  state.manualPause = true;
  const baseline =
    Number.isFinite(throwCount) && throwCount >= 0
      ? throwCount
      : state.lastThrowCount;
  state.manualPauseThrowCount =
    Number.isFinite(baseline) && baseline >= 0 ? baseline : -1;
}

function resolveZoomAnchor(intent, parsedSegment, segmentPoint = null) {
  const reason = String(intent?.reason || "");
  const segment = String(parsedSegment?.normalized || intent?.segment || "");
  const numericZoomLevel = Number(intent?.zoomLevel);

  if (segment === "BULL") {
    return { x: 0.5, y: 0.5 };
  }

  if ((reason === "checkout" || reason === "route-finish") && parsedSegment?.ring === "D") {
    const viewBox = segmentPoint?.viewBox;
    const pointX = Number(segmentPoint?.x);
    const pointY = Number(segmentPoint?.y);
    if (
      viewBox &&
      Number.isFinite(viewBox.width) &&
      viewBox.width > 0 &&
      Number.isFinite(viewBox.height) &&
      viewBox.height > 0 &&
      Number.isFinite(pointX) &&
      Number.isFinite(pointY)
    ) {
      const centerX = viewBox.x + viewBox.width / 2;
      const centerY = viewBox.y + viewBox.height / 2;
      const dx = pointX - centerX;
      const dy = pointY - centerY;
      const distance = Math.hypot(dx, dy);
      if (distance > 0) {
        const vectorX = dx / distance;
        const vectorY = dy / distance;
        const maxAxis = Math.max(Math.abs(vectorX), Math.abs(vectorY));
        const cornerFactor = Math.abs(vectorX * vectorY);
        const zoomProgress = clamp(
          (numericZoomLevel - CHECKOUT_DOUBLE_ZOOM_RANGE.min) /
            (CHECKOUT_DOUBLE_ZOOM_RANGE.max - CHECKOUT_DOUBLE_ZOOM_RANGE.min),
          0,
          1
        );
        const radialStrength = clamp(
          0.235 + 0.045 * maxAxis + 0.04 * cornerFactor - 0.045 * zoomProgress,
          0.18,
          0.3
        );
        const xEdgeGuard = 0.22 + 0.03 * zoomProgress;
        const yEdgeGuard = 0.25 + 0.06 * zoomProgress;
        return {
          x: clamp(0.5 + vectorX * radialStrength, xEdgeGuard, 1 - xEdgeGuard),
          y: clamp(0.54 + vectorY * radialStrength, yEdgeGuard, 1 - yEdgeGuard),
        };
      }
    }
    return { x: 0.5, y: 0.54 };
  }

  if (reason === "t20-setup") {
    return { x: 0.5, y: 0.36 };
  }

  if (reason === "smart-setup" && segment === "T20") {
    return { x: 0.5, y: 0.4 };
  }

  return { x: 0.5, y: 0.56 };
}

function getStyleValue(styleDecl, propertyName) {
  if (!styleDecl) {
    return "";
  }

  if (typeof styleDecl.getPropertyValue === "function") {
    return String(styleDecl.getPropertyValue(propertyName) || "");
  }

  return String(styleDecl[propertyName] || "");
}

function getStylePriority(styleDecl, propertyName) {
  if (!styleDecl || typeof styleDecl.getPropertyPriority !== "function") {
    return "";
  }
  return String(styleDecl.getPropertyPriority(propertyName) || "");
}

function setStyleWithPriority(styleDecl, propertyName, value, priority = "") {
  if (!styleDecl || typeof styleDecl.setProperty !== "function") {
    return;
  }
  styleDecl.setProperty(propertyName, value, priority);
}

function restoreStyleWithPriority(styleDecl, propertyName, snapshot) {
  if (!styleDecl) {
    return;
  }

  const value = String(snapshot?.value || "");
  const priority = String(snapshot?.priority || "");
  if (!value) {
    if (typeof styleDecl.removeProperty === "function") {
      styleDecl.removeProperty(propertyName);
    }
    return;
  }

  if (typeof styleDecl.setProperty === "function") {
    styleDecl.setProperty(propertyName, value, priority);
  }
}

function cacheHostStyle(state, hostNode) {
  if (!hostNode?.style || state.hostStyleSnapshot?.node === hostNode) {
    return;
  }

  state.hostStyleSnapshot = {
    node: hostNode,
    overflow: {
      value: getStyleValue(hostNode.style, "overflow"),
      priority: getStylePriority(hostNode.style, "overflow"),
    },
    overflowX: {
      value: getStyleValue(hostNode.style, "overflow-x"),
      priority: getStylePriority(hostNode.style, "overflow-x"),
    },
    overflowY: {
      value: getStyleValue(hostNode.style, "overflow-y"),
      priority: getStylePriority(hostNode.style, "overflow-y"),
    },
  };
}

function restoreHostStyle(state, hostNode) {
  if (!hostNode?.style) {
    return;
  }

  const snapshot = state.hostStyleSnapshot;
  if (snapshot?.node === hostNode) {
    restoreStyleWithPriority(hostNode.style, "overflow", snapshot.overflow);
    restoreStyleWithPriority(hostNode.style, "overflow-x", snapshot.overflowX);
    restoreStyleWithPriority(hostNode.style, "overflow-y", snapshot.overflowY);
  } else {
    hostNode.style.removeProperty("overflow");
    hostNode.style.removeProperty("overflow-x");
    hostNode.style.removeProperty("overflow-y");
  }
  hostNode.classList?.remove?.(ZOOM_HOST_CLASS);
}

function cacheTargetStyle(state, targetNode) {
  if (!targetNode?.style || state.targetStyleSnapshot?.node === targetNode) {
    return;
  }

  state.targetStyleSnapshot = {
    node: targetNode,
    transform: String(targetNode.style.transform || ""),
    transition: String(targetNode.style.transition || ""),
    transformOrigin: String(targetNode.style.transformOrigin || ""),
    willChange: String(targetNode.style.willChange || ""),
  };
}

function restoreTargetStyle(state, targetNode) {
  if (!targetNode?.style) {
    return;
  }

  const snapshot = state.targetStyleSnapshot;
  if (snapshot?.node === targetNode) {
    targetNode.style.transform = snapshot.transform;
    targetNode.style.transition = snapshot.transition;
    targetNode.style.transformOrigin = snapshot.transformOrigin;
    targetNode.style.willChange = snapshot.willChange;
  } else {
    targetNode.style.removeProperty("transform");
    targetNode.style.removeProperty("transition");
    targetNode.style.removeProperty("transform-origin");
    targetNode.style.removeProperty("will-change");
  }

  targetNode.classList?.remove?.(ZOOM_CLASS);
}

function isLikelyGifOverlayNode(node) {
  if (!node) {
    return false;
  }

  const idToken = String(node.id || "").toLowerCase();
  const classToken = String(node.classList?.toString?.() || "").toLowerCase();
  const srcToken = String(
    node.currentSrc || node.src || node.getAttribute?.("src") || ""
  ).toLowerCase();

  return (
    idToken.includes("gif") ||
    classToken.includes("gif") ||
    srcToken.includes(".gif") ||
    srcToken.includes("giphy") ||
    srcToken.includes("tenor")
  );
}

function collectGifOverlayNodes(targetNode, hostNode) {
  const roots = [];
  const showAnimationsRoot = targetNode?.closest?.(".showAnimations") || null;
  if (showAnimationsRoot) {
    roots.push(showAnimationsRoot);
  }
  if (hostNode && !roots.includes(hostNode)) {
    roots.push(hostNode);
  }

  const seen = new Set();
  const overlays = [];
  roots.forEach((rootNode) => {
    if (!rootNode || typeof rootNode.querySelectorAll !== "function") {
      return;
    }

    const candidates = [
      ...Array.from(rootNode.querySelectorAll("img,video")),
      ...Array.from(rootNode.querySelectorAll("#gif-animation,.gif-animation")),
    ];

    if (isLikelyGifOverlayNode(rootNode)) {
      candidates.push(rootNode);
    }

    candidates.forEach((node) => {
      if (!node || seen.has(node) || !isLikelyGifOverlayNode(node)) {
        return;
      }
      seen.add(node);
      overlays.push(node);
    });
  });

  return overlays;
}

function restoreGifOverlayStyles(state) {
  const snapshots = Array.isArray(state?.gifStyleSnapshots) ? state.gifStyleSnapshots : [];
  snapshots.forEach((snapshot) => {
    const node = snapshot?.node;
    if (!node?.style) {
      return;
    }

    node.style.width = String(snapshot.width || "");
    node.style.height = String(snapshot.height || "");
    node.style.maxWidth = String(snapshot.maxWidth || "");
    node.style.maxHeight = String(snapshot.maxHeight || "");
    node.style.objectFit = String(snapshot.objectFit || "");
  });

  if (state) {
    state.gifStyleSnapshots = [];
  }
}

function applyGifOverlayContainment(state, targetNode, hostNode) {
  restoreGifOverlayStyles(state);

  if (!hostNode) {
    return;
  }

  const hostRect = hostNode.getBoundingClientRect?.();
  const hostWidth = Number(hostRect?.width) > 0
    ? Number(hostRect.width)
    : Number(hostNode.clientWidth || hostNode.offsetWidth || 0);
  const hostHeight = Number(hostRect?.height) > 0
    ? Number(hostRect.height)
    : Number(hostNode.clientHeight || hostNode.offsetHeight || 0);
  if (!(hostWidth > 0 && hostHeight > 0)) {
    return;
  }

  const overlays = collectGifOverlayNodes(targetNode, hostNode);
  if (!overlays.length) {
    return;
  }

  const maxWidthPx = `${hostWidth.toFixed(2)}px`;
  const maxHeightPx = `${hostHeight.toFixed(2)}px`;
  const snapshots = [];

  overlays.forEach((node) => {
    if (!node?.style) {
      return;
    }

    snapshots.push({
      node,
      width: String(node.style.width || ""),
      height: String(node.style.height || ""),
      maxWidth: String(node.style.maxWidth || ""),
      maxHeight: String(node.style.maxHeight || ""),
      objectFit: String(node.style.objectFit || ""),
    });

    node.style.width = "auto";
    node.style.height = "auto";
    node.style.maxWidth = maxWidthPx;
    node.style.maxHeight = maxHeightPx;
    node.style.objectFit = "contain";
  });

  state.gifStyleSnapshots = snapshots;
}

function clearPendingRelease(state) {
  if (!state?.releaseTimeoutId) {
    return;
  }

  clearTimeout(state.releaseTimeoutId);
  state.releaseTimeoutId = 0;
}

function normalizeRect(rect) {
  if (!(rect?.width > 0 && rect?.height > 0)) {
    return null;
  }

  return {
    left: Number(rect.left),
    top: Number(rect.top),
    width: Number(rect.width),
    height: Number(rect.height),
    right: Number(rect.right),
    bottom: Number(rect.bottom),
  };
}

function normalizeRectForActiveZoom(rect, zoomTransform) {
  const normalizedRect = normalizeRect(rect);
  const scale = Number(zoomTransform?.scale);
  const tx = Number(zoomTransform?.tx);
  const ty = Number(zoomTransform?.ty);
  if (!normalizedRect || !(Number.isFinite(scale) && scale > 0)) {
    return normalizedRect;
  }

  const left = normalizedRect.left - (Number.isFinite(tx) ? tx : 0);
  const top = normalizedRect.top - (Number.isFinite(ty) ? ty : 0);
  const width = normalizedRect.width / scale;
  const height = normalizedRect.height / scale;
  return {
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
  };
}

function shouldNormalizeRectForActiveZoom(rect, zoomTransform) {
  const normalizedRect = normalizeRect(rect);
  const scale = Number(zoomTransform?.scale);
  const baseWidth = Number(zoomTransform?.baseWidth);
  const baseHeight = Number(zoomTransform?.baseHeight);
  if (
    !normalizedRect ||
    !(Number.isFinite(scale) && scale > 1) ||
    !(Number.isFinite(baseWidth) && baseWidth > 0) ||
    !(Number.isFinite(baseHeight) && baseHeight > 0)
  ) {
    return false;
  }

  const expectedZoomedWidth = baseWidth * scale;
  const expectedZoomedHeight = baseHeight * scale;
  const widthTolerance = Math.max(1.5, expectedZoomedWidth * 0.02);
  const heightTolerance = Math.max(1.5, expectedZoomedHeight * 0.02);
  const widthDiffToZoomed = Math.abs(normalizedRect.width - expectedZoomedWidth);
  const heightDiffToZoomed = Math.abs(normalizedRect.height - expectedZoomedHeight);
  const widthDiffToBase = Math.abs(normalizedRect.width - baseWidth);
  const heightDiffToBase = Math.abs(normalizedRect.height - baseHeight);

  return (
    widthDiffToZoomed <= widthTolerance &&
    heightDiffToZoomed <= heightTolerance &&
    widthDiffToZoomed + 0.5 < widthDiffToBase &&
    heightDiffToZoomed + 0.5 < heightDiffToBase
  );
}

function resolveStableMeasuredRect(measuredRect, activeZoomTransform, expectedNode, fallbackRect = null) {
  if (
    activeZoomTransform &&
    activeZoomTransform.node === expectedNode &&
    shouldNormalizeRectForActiveZoom(measuredRect, activeZoomTransform)
  ) {
    const restoredRect = normalizeRectForActiveZoom(measuredRect, activeZoomTransform);
    if (restoredRect) {
      return restoredRect;
    }
  }

  return normalizeRect(measuredRect) || fallbackRect;
}

function getScreenPointFromRect(point, viewBox, rect) {
  if (!(rect?.width > 0 && rect?.height > 0)) {
    return null;
  }

  const normalizedX = (point.x - viewBox.x) / viewBox.width;
  const normalizedY = (point.y - viewBox.y) / viewBox.height;
  return {
    x: rect.left + normalizedX * rect.width,
    y: rect.top + normalizedY * rect.height,
  };
}

export function buildZoomTransform(options = {}) {
  const targetNode = options.targetNode;
  const hostNode = options.hostNode || targetNode;
  const boardSvg = options.boardSvg;
  const zoomLevel = Number(options.zoomLevel);
  const intent = options.intent || null;
  const x01Rules = options.x01Rules || null;
  const windowRef = options.windowRef || (typeof globalThis.window !== "undefined" ? globalThis.window : null);
  const providedBaseTransform =
    typeof options.baseTransform === "string" ? options.baseTransform : null;
  const activeTargetZoomTransform = options.activeTargetZoomTransform || null;
  const activeBoardZoomTransform = options.activeBoardZoomTransform || null;

  if (!targetNode || !boardSvg || !hostNode || !Number.isFinite(zoomLevel) || zoomLevel <= 0 || !intent) {
    return null;
  }

  const segmentPoint = resolveSegmentPoint(intent.segment, boardSvg, x01Rules);
  if (!segmentPoint) {
    return null;
  }

  const targetRect = resolveStableMeasuredRect(
    targetNode.getBoundingClientRect?.(),
    activeTargetZoomTransform,
    targetNode
  );
  const boardRect = resolveStableMeasuredRect(
    boardSvg.getBoundingClientRect?.(),
    activeBoardZoomTransform,
    boardSvg
  );
  const viewportRect = normalizeRect(hostNode.getBoundingClientRect?.());
  if (!(targetRect?.width > 0 && targetRect?.height > 0 && viewportRect?.width > 0 && viewportRect?.height > 0)) {
    return null;
  }

  const layoutWidth = Number(targetNode.offsetWidth || targetNode.clientWidth || targetRect.width || 0);
  const layoutHeight = Number(targetNode.offsetHeight || targetNode.clientHeight || targetRect.height || 0);
  if (!(layoutWidth > 0 && layoutHeight > 0)) {
    return null;
  }

  const scaleX = targetRect.width / layoutWidth;
  const scaleY = targetRect.height / layoutHeight;
  if (!(Number.isFinite(scaleX) && scaleX > 0 && Number.isFinite(scaleY) && scaleY > 0)) {
    return null;
  }

  const screenPoint = getScreenPointFromRect(segmentPoint, segmentPoint.viewBox, boardRect);
  if (!screenPoint) {
    return null;
  }

  const targetLocal = {
    x: (screenPoint.x - targetRect.left) / scaleX,
    y: (screenPoint.y - targetRect.top) / scaleY,
  };
  if (!(Number.isFinite(targetLocal.x) && Number.isFinite(targetLocal.y))) {
    return null;
  }

  const anchor = resolveZoomAnchor(
    { ...intent, zoomLevel },
    segmentPoint.parsedSegment,
    segmentPoint
  );
  const anchorXInViewport = viewportRect.left + viewportRect.width * anchor.x;
  const anchorYInViewport = viewportRect.top + viewportRect.height * anchor.y;

  const rawTx = anchorXInViewport - targetRect.left - zoomLevel * targetLocal.x;
  const rawTy = anchorYInViewport - targetRect.top - zoomLevel * targetLocal.y;

  const minTx = viewportRect.right - targetRect.left - zoomLevel * layoutWidth;
  const maxTx = viewportRect.left - targetRect.left;
  const minTy = viewportRect.bottom - targetRect.top - zoomLevel * layoutHeight;
  const maxTy = viewportRect.top - targetRect.top;

  const tx = clamp(rawTx, minTx, maxTx);
  const ty = clamp(rawTy, minTy, maxTy);

  let baseTransform = providedBaseTransform;
  if (baseTransform === null) {
    try {
      baseTransform = String(windowRef?.getComputedStyle?.(targetNode)?.transform || "");
    } catch (_) {
      baseTransform = "";
    }
  }
  if (baseTransform === "none") {
    baseTransform = "";
  }

  const transform = `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px) scale(${zoomLevel.toFixed(4)})`;
  const intentSignature = [
    String(segmentPoint.parsedSegment?.normalized || intent.segment || ""),
    String(intent.reason || ""),
    zoomLevel.toFixed(4),
  ].join("|");
  const signature = [
    baseTransform || "none",
    quantizeForSignature(tx).toFixed(2),
    quantizeForSignature(ty).toFixed(2),
    intentSignature,
  ].join("|");

  return {
    transform,
    baseTransform,
    intentSignature,
    signature,
    anchor,
    tx,
    ty,
    targetRect: {
      left: Number(targetRect.left),
      top: Number(targetRect.top),
      width: Number(targetRect.width),
      height: Number(targetRect.height),
      right: Number(targetRect.right),
      bottom: Number(targetRect.bottom),
    },
    viewportRect: {
      left: Number(viewportRect.left),
      top: Number(viewportRect.top),
      width: Number(viewportRect.width),
      height: Number(viewportRect.height),
      right: Number(viewportRect.right),
      bottom: Number(viewportRect.bottom),
    },
    boardRect: {
      left: Number(boardRect.left),
      top: Number(boardRect.top),
      width: Number(boardRect.width),
      height: Number(boardRect.height),
      right: Number(boardRect.right),
      bottom: Number(boardRect.bottom),
    },
  };
}

function resolveZoomIntentSettings(options = {}) {
  const gameState = options.gameState;
  const config = options.featureConfig;
  const checkoutZoomTarget =
    String(config?.checkoutZoomTarget || "").trim().toLowerCase() === "route-first"
      ? "route-first"
      : "finish-only";

  return {
    gameState,
    x01Rules: options.x01Rules,
    state: options.state,
    documentRef: options.documentRef,
    windowRef: options.windowRef,
    config,
    nowTs: Number.isFinite(options.nowTs) ? options.nowTs : Date.now(),
    outMode:
      gameState && typeof gameState.getOutMode === "function"
        ? String(gameState.getOutMode() || "")
        : "",
    checkoutZoomTarget,
    t20SetupZoomEnabled: config?.t20SetupZoomEnabled !== false,
    finishOnlyCheckoutZoom: Boolean(config?.checkoutZoomEnabled) && checkoutZoomTarget === "finish-only",
  };
}

function resetZoomIntentForBoundaryChange(state) {
  state.holdUntilTs = 0;
  state.activeIntent = null;
  state.stickyUntilTurnChange = false;
  state.stickyUntilLegEnd = false;
  state.manualPause = false;
  state.manualPauseThrowCount = -1;
  state.lastTurnId = "";
  state.lastThrowCount = -1;
}

function syncBoundaryTokenState(state, boundaryToken) {
  const lastBoundaryToken = String(state.matchBoundaryToken || "");
  if (boundaryToken && lastBoundaryToken && boundaryToken !== lastBoundaryToken) {
    resetZoomIntentForBoundaryChange(state);
  }
  if (boundaryToken) {
    state.matchBoundaryToken = boundaryToken;
  }
}

function resolveTurnProgressState(state, gameState) {
  const turn = typeof gameState.getActiveTurn === "function" ? gameState.getActiveTurn() : null;
  const throws = Array.isArray(gameState.getActiveThrows?.()) ? gameState.getActiveThrows() : [];
  if (!turn) {
    return null;
  }

  const turnId = getTurnId(turn);
  const throwCount = throws.length;
  return {
    throws,
    turnId,
    throwCount,
    previousThrowCount:
      Number.isFinite(state.lastThrowCount) && state.lastThrowCount >= 0 ? state.lastThrowCount : -1,
    turnChanged: turnId !== state.lastTurnId,
  };
}

function resetZoomIntentForTurnChange(state) {
  state.holdUntilTs = 0;
  if (!state.stickyUntilLegEnd) {
    state.activeIntent = null;
  }
  state.stickyUntilTurnChange = false;
  state.manualPause = false;
  state.manualPauseThrowCount = -1;
}

function persistTurnProgress(state, turnId, throwCount) {
  state.lastTurnId = turnId;
  state.lastThrowCount = throwCount;
}

function clearDisabledSetupIntent(state, t20SetupZoomEnabled, finishOnlyCheckoutZoom) {
  if (!t20SetupZoomEnabled && state.activeIntent?.reason === "t20-setup") {
    state.holdUntilTs = 0;
    state.activeIntent = null;
    state.stickyUntilTurnChange = false;
  }
  if (finishOnlyCheckoutZoom && state.activeIntent?.reason === "smart-setup") {
    state.holdUntilTs = 0;
    state.activeIntent = null;
  }
}

function resolveIntentCheckoutContext({
  gameState,
  documentRef,
  windowRef,
  outMode,
  throwCount,
  x01Rules,
  state,
}) {
  const x01CheckoutContext = resolveX01CheckoutContext({
    gameState,
    documentRef,
    windowRef,
    outMode,
    dartsRemaining: Math.max(0, 3 - throwCount),
    x01Rules,
  });
  let activeScore = x01CheckoutContext.activeScore;
  let checkoutSurface = x01CheckoutContext.checkoutSurface;

  if (
    state.stickyUntilLegEnd &&
    x01CheckoutContext.gameStateScore === 0 &&
    throwCount === 0 &&
    Number.isFinite(x01CheckoutContext.domScore) &&
    x01CheckoutContext.domScore > 0
  ) {
    activeScore = x01CheckoutContext.domScore;
    checkoutSurface = resolveCheckoutSurfaceSemantics({
      routeSegments: x01CheckoutContext.routeSegments,
      activeScore,
      outMode,
      dartsRemaining: Math.max(0, 3 - throwCount),
      x01Rules,
    });
  }

  const authoritativeRouteSegments = checkoutSurface.authoritativeRouteSegments;
  const suggestionSegment = checkoutSurface.singleVisibleSegment;
  return {
    activeScore,
    checkoutSurface,
    authoritativeRouteSegments,
    firstRouteSegment: getFirstCheckoutRouteSegment(authoritativeRouteSegments),
    finishRouteSegment: checkoutSurface.authoritativeFinishSegment,
    suggestionSegment,
    suggestionIsCheckout: isOneDartCheckoutSegmentForMode(suggestionSegment, outMode, x01Rules),
    scoreCheckoutSegment: getScoreCheckoutSegment(activeScore, outMode, x01Rules),
  };
}

function isManualPauseStillActive(state, throwCount) {
  if (!state.manualPause) {
    return false;
  }

  const baseline =
    Number.isFinite(state.manualPauseThrowCount) && state.manualPauseThrowCount >= 0
      ? state.manualPauseThrowCount
      : -1;
  if (throwCount <= baseline) {
    return true;
  }

  state.manualPause = false;
  state.manualPauseThrowCount = -1;
  return false;
}

function resolveStickyIntent(state, activeScore) {
  if (state.stickyUntilLegEnd && state.activeIntent) {
    if (Number.isFinite(activeScore) && activeScore === 0) {
      return state.activeIntent;
    }
    state.stickyUntilLegEnd = false;
    state.activeIntent = null;
  }

  if (state.stickyUntilTurnChange && state.activeIntent) {
    return state.activeIntent;
  }

  return null;
}

function resolveThirdDartStickyIntent({
  state,
  turnChanged,
  previousThrowCount,
  throwCount,
  throws,
  x01Rules,
  activeScore,
  nowTs,
}) {
  if (turnChanged || !state.activeIntent || previousThrowCount !== 2 || throwCount !== 3) {
    return null;
  }

  const thirdSegment = getThrowSegmentName(throws[2], x01Rules);
  if (state.activeIntent.reason === "t20-setup" && thirdSegment === "T20") {
    state.holdUntilTs = 0;
    state.stickyUntilTurnChange = true;
    return state.activeIntent;
  }

  if (state.activeIntent.reason === "checkout" && Number.isFinite(activeScore) && activeScore === 0) {
    state.holdUntilTs = 0;
    state.stickyUntilLegEnd = true;
    return state.activeIntent;
  }

  state.holdUntilTs = nowTs + HOLD_AFTER_THIRD_MS;
  return null;
}

function resolveFinishedCheckoutStickyIntent(state, activeScore) {
  if (state.activeIntent?.reason === "checkout" && Number.isFinite(activeScore) && activeScore === 0) {
    state.holdUntilTs = 0;
    state.stickyUntilLegEnd = true;
    return state.activeIntent;
  }
  return null;
}

function buildAndStoreIntent(state, reason, segment) {
  const intent = { reason, segment };
  state.activeIntent = intent;
  return intent;
}

function resolveCheckoutZoomIntent({
  state,
  config,
  throwCount,
  checkoutSurface,
  checkoutZoomTarget,
  firstRouteSegment,
  authoritativeRouteSegments,
  activeScore,
  outMode,
  x01Rules,
  finishRouteSegment,
  scoreCheckoutSegment,
}) {
  if (!config.checkoutZoomEnabled || throwCount > 2) {
    return null;
  }

  const canUseCheckoutSurfaceForIntent =
    checkoutSurface.surfaceKind === "visible-explicit-checkout" ||
    checkoutSurface.surfaceKind === "score-route";
  const hasValidatedVisibleCheckoutRoute =
    checkoutSurface.selectionSource === "validated-visible-route";

  if (canUseCheckoutSurfaceForIntent && checkoutZoomTarget === "route-first") {
    const intent = buildCheckoutRouteIntent(firstRouteSegment, authoritativeRouteSegments, {
      activeScore,
      outMode,
      x01Rules,
      routeReason: "route-first",
    });
    if (intent) {
      state.activeIntent = intent;
      return intent;
    }
  }

  if (
    canUseCheckoutSurfaceForIntent &&
    checkoutSurface.canUseAuthoritativeFinishNow &&
    finishRouteSegment
  ) {
    return buildAndStoreIntent(state, "checkout", finishRouteSegment);
  }

  if (scoreCheckoutSegment && !hasValidatedVisibleCheckoutRoute) {
    return buildAndStoreIntent(state, "checkout", scoreCheckoutSegment);
  }

  return null;
}

function resolveSetupZoomIntent({
  state,
  throwCount,
  finishOnlyCheckoutZoom,
  suggestionSegment,
  suggestionIsCheckout,
  config,
  t20SetupZoomEnabled,
  canUseT20Setup,
}) {
  if (throwCount > 2) {
    return null;
  }

  const canUseSuggestionForSetup =
    !finishOnlyCheckoutZoom &&
    Boolean(suggestionSegment) &&
    (config.checkoutZoomEnabled || !suggestionIsCheckout);
  const canUseSuggestionSegment =
    canUseSuggestionForSetup &&
    (suggestionSegment !== "T20" || (t20SetupZoomEnabled && canUseT20Setup));

  if (!canUseSuggestionSegment) {
    return null;
  }

  return buildAndStoreIntent(
    state,
    suggestionSegment === "T20" ? "t20-setup" : "smart-setup",
    suggestionSegment
  );
}

function resolveFallbackT20SetupIntent(state, t20SetupZoomEnabled, canUseT20Setup) {
  if (!t20SetupZoomEnabled || !canUseT20Setup) {
    return null;
  }

  return buildAndStoreIntent(state, "t20-setup", "T20");
}

export function computeZoomIntent(options = {}) {
  const {
    gameState,
    x01Rules,
    state,
    documentRef,
    windowRef,
    config,
    nowTs,
    outMode,
    checkoutZoomTarget,
    t20SetupZoomEnabled,
    finishOnlyCheckoutZoom,
  } = resolveZoomIntentSettings(options);

  if (!gameState || typeof gameState.isX01Variant !== "function") {
    return null;
  }
  if (!x01Rules) {
    return null;
  }

  const active = gameState.isX01Variant({
    allowMissing: false,
    allowEmpty: false,
    allowNumeric: true,
  });
  if (!active) {
    state.holdUntilTs = 0;
    state.activeIntent = null;
    return null;
  }

  syncBoundaryTokenState(state, resolveGameBoundaryToken(gameState));

  const turnProgress = resolveTurnProgressState(state, gameState);
  if (!turnProgress) {
    return null;
  }

  const { throws, turnId, throwCount, previousThrowCount, turnChanged } = turnProgress;
  if (turnChanged) {
    resetZoomIntentForTurnChange(state);
  }

  if (!turnChanged && previousThrowCount >= 0 && throwCount < previousThrowCount) {
    markManualZoomPause(state, throwCount);
    persistTurnProgress(state, turnId, throwCount);
    return null;
  }

  persistTurnProgress(state, turnId, throwCount);
  clearDisabledSetupIntent(state, t20SetupZoomEnabled, finishOnlyCheckoutZoom);

  const checkoutContext = resolveIntentCheckoutContext({
    gameState,
    documentRef,
    windowRef,
    outMode,
    throwCount,
    x01Rules,
    state,
  });
  const canUseT20Setup = canUseThirdDartT20Setup(
    throws,
    throwCount,
    checkoutContext.activeScore,
    outMode,
    x01Rules
  );

  if (isManualPauseStillActive(state, throwCount)) {
    return null;
  }

  const stickyIntent = resolveStickyIntent(state, checkoutContext.activeScore);
  if (stickyIntent) {
    return stickyIntent;
  }

  const thirdDartStickyIntent = resolveThirdDartStickyIntent({
    state,
    turnChanged,
    previousThrowCount,
    throwCount,
    throws,
    x01Rules,
    activeScore: checkoutContext.activeScore,
    nowTs,
  });
  if (thirdDartStickyIntent) {
    return thirdDartStickyIntent;
  }

  const finishedCheckoutStickyIntent = resolveFinishedCheckoutStickyIntent(
    state,
    checkoutContext.activeScore
  );
  if (finishedCheckoutStickyIntent) {
    return finishedCheckoutStickyIntent;
  }

  const checkoutIntent = resolveCheckoutZoomIntent({
    state,
    config,
    throwCount,
    checkoutSurface: checkoutContext.checkoutSurface,
    checkoutZoomTarget,
    firstRouteSegment: checkoutContext.firstRouteSegment,
    authoritativeRouteSegments: checkoutContext.authoritativeRouteSegments,
    activeScore: checkoutContext.activeScore,
    outMode,
    x01Rules,
    finishRouteSegment: checkoutContext.finishRouteSegment,
    scoreCheckoutSegment: checkoutContext.scoreCheckoutSegment,
  });
  if (checkoutIntent) {
    return checkoutIntent;
  }

  const setupIntent = resolveSetupZoomIntent({
    state,
    throwCount,
    finishOnlyCheckoutZoom,
    suggestionSegment: checkoutContext.suggestionSegment,
    suggestionIsCheckout: checkoutContext.suggestionIsCheckout,
    config,
    t20SetupZoomEnabled,
    canUseT20Setup,
  });
  if (setupIntent) {
    return setupIntent;
  }

  const fallbackT20Intent = resolveFallbackT20SetupIntent(state, t20SetupZoomEnabled, canUseT20Setup);
  if (fallbackT20Intent) {
    return fallbackT20Intent;
  }

  if (state.holdUntilTs > nowTs && state.activeIntent) {
    return state.activeIntent;
  }

  state.activeIntent = null;
  return null;
}

function resolveApplyZoomNodes(zoomNodes) {
  const normalizedZoomNodes = zoomNodes && typeof zoomNodes === "object" ? zoomNodes : {};
  return {
    targetNode: normalizedZoomNodes.targetNode || null,
    hostNode: normalizedZoomNodes.hostNode || null,
    boardSvg: normalizedZoomNodes.boardSvg || null,
  };
}

function resetChangedZoomBindings(state, targetNode, hostNode) {
  if (state.zoomedElement && state.zoomedElement !== targetNode) {
    restoreTargetStyle(state, state.zoomedElement);
    state.zoomedElement = null;
    state.lastAppliedSignature = "";
    state.lastAppliedIntentSignature = "";
  }
  if (state.zoomHost && state.zoomHost !== hostNode) {
    restoreHostStyle(state, state.zoomHost);
    state.zoomHost = null;
  }
}

function buildApplyZoomData(targetNode, hostNode, boardSvg, zoomLevel, intent, state, options = {}) {
  return buildZoomTransform({
    targetNode,
    hostNode: hostNode || targetNode,
    boardSvg,
    zoomLevel,
    intent,
    x01Rules: options?.x01Rules || null,
    windowRef: options?.windowRef || (typeof globalThis.window !== "undefined" ? globalThis.window : null),
    documentRef: options?.documentRef || (typeof document !== "undefined" ? document : null),
    baseTransform:
      state.targetStyleSnapshot?.node === targetNode ? String(state.targetStyleSnapshot.transform || "") : "",
    activeTargetZoomTransform:
      state.zoomedElement === targetNode && state.lastAppliedZoomTransform?.targetNode === targetNode
        ? {
            node: targetNode,
            scale: state.lastAppliedZoomTransform.scale,
            tx: state.lastAppliedZoomTransform.tx,
            ty: state.lastAppliedZoomTransform.ty,
            baseWidth: state.lastAppliedZoomTransform.targetBaseWidth,
            baseHeight: state.lastAppliedZoomTransform.targetBaseHeight,
          }
        : null,
    activeBoardZoomTransform:
      state.zoomedElement === targetNode && state.lastAppliedZoomTransform?.boardSvg === boardSvg
        ? {
            node: boardSvg,
            scale: state.lastAppliedZoomTransform.scale,
            tx: state.lastAppliedZoomTransform.tx,
            ty: state.lastAppliedZoomTransform.ty,
            baseWidth: state.lastAppliedZoomTransform.boardBaseWidth,
            baseHeight: state.lastAppliedZoomTransform.boardBaseHeight,
          }
        : null,
  });
}

function applyZoomHostState(state, hostNode) {
  if (!hostNode?.classList) {
    return;
  }

  cacheHostStyle(state, hostNode);
  if (!hostNode.classList.contains(ZOOM_HOST_CLASS)) {
    hostNode.classList.add(ZOOM_HOST_CLASS);
  }
  if (getStyleValue(hostNode.style, "overflow") !== "hidden") {
    setStyleWithPriority(hostNode.style, "overflow", "hidden", "important");
  }
  if (getStyleValue(hostNode.style, "overflow-x") !== "hidden") {
    setStyleWithPriority(hostNode.style, "overflow-x", "hidden", "important");
  }
  if (getStyleValue(hostNode.style, "overflow-y") !== "hidden") {
    setStyleWithPriority(hostNode.style, "overflow-y", "hidden", "important");
  }
}

export function applyZoom(zoomNodes, zoomLevel, speedConfig, intent, state, options = {}) {
  const { targetNode, hostNode, boardSvg } = resolveApplyZoomNodes(zoomNodes);
  if (!targetNode?.style) {
    return;
  }

  clearPendingRelease(state);
  resetChangedZoomBindings(state, targetNode, hostNode);
  cacheTargetStyle(state, targetNode);
  const zoomData = buildApplyZoomData(targetNode, hostNode, boardSvg, zoomLevel, intent, state, options);

  if (!zoomData) {
    return null;
  }
  applyZoomHostState(state, hostNode);
  applyGifOverlayContainment(state, targetNode, hostNode || targetNode);

  const composedTransform = zoomData.baseTransform
    ? `${zoomData.baseTransform} ${zoomData.transform}`
    : zoomData.transform;
  const isSameVisualIntent =
    state.zoomedElement === targetNode &&
    state.zoomHost === (hostNode || null) &&
    state.lastAppliedIntentSignature === zoomData.intentSignature;
  if (state.zoomedElement === targetNode && state.lastAppliedSignature === zoomData.signature) {
    state.zoomHost = hostNode || null;
    return zoomData;
  }

  if (!targetNode.classList.contains(ZOOM_CLASS)) {
    targetNode.classList.add(ZOOM_CLASS);
  }
  targetNode.style.transformOrigin = "0 0";
  targetNode.style.willChange = "transform";
  targetNode.style.transition = isSameVisualIntent
    ? "none"
    : `transform ${speedConfig.zoomInMs}ms ${speedConfig.easingIn}`;
  targetNode.style.transform = composedTransform;

  state.zoomedElement = targetNode;
  state.zoomHost = hostNode || null;
  state.lastAppliedSignature = zoomData.signature;
  state.lastAppliedIntentSignature = zoomData.intentSignature;
  state.lastAppliedZoomTransform = {
    targetNode,
    boardSvg,
    hostNode: hostNode || null,
    tx: zoomData.tx,
    ty: zoomData.ty,
    scale: zoomLevel,
    targetBaseWidth: zoomData.targetRect.width,
    targetBaseHeight: zoomData.targetRect.height,
    boardBaseWidth: zoomData.boardRect.width,
    boardBaseHeight: zoomData.boardRect.height,
  };
  return zoomData;
}

export function resetZoom(speedConfig, state, immediate = false) {
  clearPendingRelease(state);

  const targetNode = state.zoomedElement;
  const hostNode = state.zoomHost;
  const targetSnapshot = state.targetStyleSnapshot;
  const snapshotTransform =
    targetSnapshot?.node === targetNode ? targetSnapshot.transform : "";

  if (!targetNode) {
    restoreGifOverlayStyles(state);
    if (hostNode) {
      restoreHostStyle(state, hostNode);
    }
    state.zoomHost = null;
    state.hostStyleSnapshot = null;
    state.lastAppliedSignature = "";
    state.lastAppliedIntentSignature = "";
    state.lastAppliedZoomTransform = null;
    return;
  }

  if (immediate) {
    restoreTargetStyle(state, targetNode);
    restoreGifOverlayStyles(state);
    if (hostNode) {
      restoreHostStyle(state, hostNode);
    }

    state.zoomedElement = null;
    state.zoomHost = null;
    state.targetStyleSnapshot = null;
    state.hostStyleSnapshot = null;
    state.lastAppliedSignature = "";
    state.lastAppliedIntentSignature = "";
    state.lastAppliedZoomTransform = null;
    return;
  }

  targetNode.style.transition = `transform ${speedConfig.zoomOutMs}ms ${speedConfig.easingOut}`;
  targetNode.style.transform = snapshotTransform;

  const expectedTarget = targetNode;
  const expectedHost = hostNode;
  const releaseDelay = Math.max(0, Number(speedConfig?.zoomOutMs || 0)) + RELEASE_PADDING_MS;
  state.releaseTimeoutId = setTimeout(() => {
    state.releaseTimeoutId = 0;
    restoreGifOverlayStyles(state);

    if (state.zoomedElement === expectedTarget) {
      restoreTargetStyle(state, expectedTarget);
      state.zoomedElement = null;
      state.targetStyleSnapshot = null;
    }

    if (state.zoomHost === expectedHost && expectedHost) {
      restoreHostStyle(state, expectedHost);
      state.zoomHost = null;
      state.hostStyleSnapshot = null;
    }

    state.lastAppliedSignature = "";
    state.lastAppliedIntentSignature = "";
    state.lastAppliedZoomTransform = null;
  }, releaseDelay);
}
