import { queryAll } from "../../shared/dom-query.js";
import { ZOOM_CLASS, ZOOM_HOST_CLASS } from "./style.js";
import {
  getFirstCheckoutRouteSegment,
  resolveCheckoutSurfaceSemantics,
} from "../x01-checkout-route.js";
import { resolveX01CheckoutContext } from "../x01-checkout-context.js";
import { readModernMatchSurface } from "../shared/x01-match-surface.js";
import { isLegacyToolsAnimationMedia } from "../shared/tools-animation-layer-controller.js";
import {
  NATIVE_BOARD_SELECTOR,
  getBoardRadius,
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
const RELEASE_PADDING_MS = 40;
const CHECKOUT_DOUBLE_ZOOM_RANGE = Object.freeze({
  min: 2.35,
  max: 3.15,
});
const TRANSFORM_SIGNATURE_STEP_PX = 0.5;
const TRANSLATE_PREFIX = "translate(";
const SCALE_PREFIX = "scale(";
const TURN_POINTS_SELECTOR = ".ad-ext-turn-points";

function normalizeText(value) {
  return String(value || "")
    .replaceAll("\u00a0", " ")
    .replaceAll(/\s+/g, " ")
    .trim();
}

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

function clearManualZoomPause(state) {
  state.manualPause = false;
  state.manualPauseThrowCount = -1;
  state.manualPauseProgressSignature = "";
}

function clearZoomIntentHold(state) {
  state.holdUntilTs = 0;
  state.activeIntent = null;
  state.stickyUntilTurnChange = false;
  state.stickyUntilLegEnd = false;
}

function clearZoomScoreHistory(state) {
  state.lastActiveScore = Number.NaN;
  state.lastTurnProgressSignature = "";
}

export function markManualZoomPause(
  state,
  throwCount = Number.NaN,
  progressSignature = ""
) {
  if (!state) {
    return;
  }

  clearZoomIntentHold(state);
  state.manualPause = true;
  const baseline =
    Number.isFinite(throwCount) && throwCount >= 0
      ? throwCount
      : state.lastThrowCount;
  state.manualPauseThrowCount =
    Number.isFinite(baseline) && baseline >= 0 ? baseline : -1;
  state.manualPauseProgressSignature =
    String(progressSignature || state.lastTurnProgressSignature || "");
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

function createOwnedStyleSnapshot(styleDecl, propertyName, valueOverride = null) {
  return {
    original: {
      value: valueOverride === null ? getStyleValue(styleDecl, propertyName) : valueOverride,
      priority: valueOverride === null ? getStylePriority(styleDecl, propertyName) : "",
    },
    applied: null,
  };
}

function setOwnedStyle(snapshot, styleDecl, propertyName, value, priority = "") {
  setStyleWithPriority(styleDecl, propertyName, value, priority);
  if (snapshot) {
    snapshot.applied = {
      value: getStyleValue(styleDecl, propertyName),
      priority: getStylePriority(styleDecl, propertyName),
    };
  }
}

function isOwnedStyleApplied(styleDecl, propertyName, snapshot) {
  return Boolean(snapshot?.applied) &&
    getStyleValue(styleDecl, propertyName) === String(snapshot.applied.value || "") &&
    getStylePriority(styleDecl, propertyName) === String(snapshot.applied.priority || "");
}

function restoreOwnedStyle(styleDecl, propertyName, snapshot) {
  if (!snapshot?.applied) {
    return;
  }
  const currentValue = getStyleValue(styleDecl, propertyName);
  const currentPriority = getStylePriority(styleDecl, propertyName);
  if (
    currentValue !== String(snapshot.applied.value || "") ||
    currentPriority !== String(snapshot.applied.priority || "")
  ) {
    return;
  }
  restoreStyleWithPriority(styleDecl, propertyName, snapshot.original);
}

function adoptExternalOwnedStyle(styleDecl, propertyName, snapshot) {
  if (!snapshot?.applied) {
    return false;
  }

  const current = {
    value: getStyleValue(styleDecl, propertyName),
    priority: getStylePriority(styleDecl, propertyName),
  };
  if (
    current.value === String(snapshot.applied.value || "") &&
    current.priority === String(snapshot.applied.priority || "")
  ) {
    return false;
  }

  snapshot.original = current;
  snapshot.applied = null;
  return true;
}

function adoptExternalTargetStyleChanges(state, targetNode) {
  const snapshot = state.targetStyleSnapshot;
  if (!targetNode?.style || snapshot?.node !== targetNode) {
    return;
  }

  adoptExternalOwnedStyle(targetNode.style, "transform", snapshot.transform);
  adoptExternalOwnedStyle(targetNode.style, "transition", snapshot.transition);
  adoptExternalOwnedStyle(targetNode.style, "transform-origin", snapshot.transformOrigin);
  adoptExternalOwnedStyle(targetNode.style, "will-change", snapshot.willChange);
}

function adoptExternalHostStyleChanges(state, hostNode) {
  const snapshot = state.hostStyleSnapshot;
  if (!hostNode?.style || snapshot?.node !== hostNode) {
    return;
  }

  adoptExternalOwnedStyle(hostNode.style, "overflow", snapshot.overflow);
  adoptExternalOwnedStyle(hostNode.style, "overflow-x", snapshot.overflowX);
  adoptExternalOwnedStyle(hostNode.style, "overflow-y", snapshot.overflowY);
}

function cacheHostStyle(state, hostNode) {
  if (!hostNode?.style || state.hostStyleSnapshot?.node === hostNode) {
    return;
  }

  state.hostStyleSnapshot = {
    node: hostNode,
    overflow: createOwnedStyleSnapshot(hostNode.style, "overflow"),
    overflowX: createOwnedStyleSnapshot(hostNode.style, "overflow-x"),
    overflowY: createOwnedStyleSnapshot(hostNode.style, "overflow-y"),
  };
}

function restoreHostStyle(state, hostNode) {
  if (!hostNode?.style) {
    return;
  }

  const snapshot = state.hostStyleSnapshot;
  if (snapshot?.node === hostNode) {
    restoreOwnedStyle(hostNode.style, "overflow", snapshot.overflow);
    restoreOwnedStyle(hostNode.style, "overflow-x", snapshot.overflowX);
    restoreOwnedStyle(hostNode.style, "overflow-y", snapshot.overflowY);
  }
  hostNode.classList?.remove?.(ZOOM_HOST_CLASS);
}

function cacheTargetStyle(state, targetNode) {
  if (!targetNode?.style || state.targetStyleSnapshot?.node === targetNode) {
    return;
  }

  const currentTransform = String(targetNode.style.transform || "");
  const hasAppliedZoomTransform =
    targetNode.classList?.contains?.(ZOOM_CLASS) &&
    Boolean(parseAppliedZoomTransform(currentTransform));

  state.targetStyleSnapshot = {
    node: targetNode,
    transform: createOwnedStyleSnapshot(
      targetNode.style,
      "transform",
      hasAppliedZoomTransform ? stripAppliedZoomTransform(currentTransform) : null
    ),
    transition: createOwnedStyleSnapshot(
      targetNode.style,
      "transition",
      hasAppliedZoomTransform ? "" : null
    ),
    transformOrigin: createOwnedStyleSnapshot(
      targetNode.style,
      "transform-origin",
      hasAppliedZoomTransform ? "" : null
    ),
    willChange: createOwnedStyleSnapshot(
      targetNode.style,
      "will-change",
      hasAppliedZoomTransform ? "" : null
    ),
  };
}

function restoreTargetStyle(state, targetNode) {
  if (!targetNode?.style) {
    return;
  }

  const snapshot = state.targetStyleSnapshot;
  if (snapshot?.node === targetNode) {
    restoreOwnedStyle(targetNode.style, "transform", snapshot.transform);
    restoreOwnedStyle(targetNode.style, "transition", snapshot.transition);
    restoreOwnedStyle(targetNode.style, "transform-origin", snapshot.transformOrigin);
    restoreOwnedStyle(targetNode.style, "will-change", snapshot.willChange);
  }

  targetNode.classList?.remove?.(ZOOM_CLASS);
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

function getNodeLayoutSize(node) {
  if (!node) {
    return {
      width: Number.NaN,
      height: Number.NaN,
    };
  }

  return {
    width: Number(node.offsetWidth || node.clientWidth || 0),
    height: Number(node.offsetHeight || node.clientHeight || 0),
  };
}

function shouldNormalizeRectForActiveZoom(rect, zoomTransform, expectedNode = null) {
  const normalizedRect = normalizeRect(rect);
  const scale = Number(zoomTransform?.scale);
  const layoutSize = getNodeLayoutSize(expectedNode);
  const storedBaseWidth = Number(zoomTransform?.baseWidth);
  const storedBaseHeight = Number(zoomTransform?.baseHeight);
  const baseWidth = layoutSize.width > 0 ? layoutSize.width : storedBaseWidth;
  const baseHeight = layoutSize.height > 0 ? layoutSize.height : storedBaseHeight;
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
    shouldNormalizeRectForActiveZoom(measuredRect, activeZoomTransform, expectedNode)
  ) {
    const restoredRect = normalizeRectForActiveZoom(measuredRect, activeZoomTransform);
    if (restoredRect) {
      return restoredRect;
    }
  }

  return normalizeRect(measuredRect) || fallbackRect;
}

function parseAppliedZoomTransform(transformValue) {
  const rawTransform = String(transformValue || "").trim();
  const translateIndex = rawTransform.lastIndexOf(TRANSLATE_PREFIX);
  if (translateIndex < 0) {
    return null;
  }
  if (translateIndex > 0 && String(rawTransform[translateIndex - 1] || "").trim()) {
    return null;
  }

  const translateStart = translateIndex + TRANSLATE_PREFIX.length;
  const translateEnd = rawTransform.indexOf(")", translateStart);
  if (translateEnd < 0) {
    return null;
  }

  const afterTranslate = rawTransform.slice(translateEnd + 1).trimStart();
  if (!afterTranslate.startsWith(SCALE_PREFIX)) {
    return null;
  }

  const scaleStart = SCALE_PREFIX.length;
  const scaleEnd = afterTranslate.indexOf(")", scaleStart);
  if (scaleEnd < 0 || afterTranslate.slice(scaleEnd + 1).trim()) {
    return null;
  }

  const translateParts = rawTransform.slice(translateStart, translateEnd).split(",");
  if (translateParts.length !== 2) {
    return null;
  }

  const tx = parseCssPixelValue(translateParts[0]);
  const ty = parseCssPixelValue(translateParts[1]);
  const scale = Number(afterTranslate.slice(scaleStart, scaleEnd).trim());

  if (!(Number.isFinite(tx) && Number.isFinite(ty) && Number.isFinite(scale) && scale > 1)) {
    return null;
  }

  return {
    tx,
    ty,
    scale,
  };
}

function parseCssPixelValue(value) {
  const normalized = String(value || "").trim();
  if (!normalized.endsWith("px")) {
    return Number.NaN;
  }

  return Number(normalized.slice(0, -2).trim());
}

function stripAppliedZoomTransform(transformValue) {
  const rawTransform = String(transformValue || "").trim();
  const translateIndex = rawTransform.lastIndexOf(TRANSLATE_PREFIX);
  if (translateIndex < 0 || !parseAppliedZoomTransform(rawTransform)) {
    return rawTransform;
  }

  return rawTransform.slice(0, translateIndex).trim();
}

function resolveCurrentAppliedZoomTransform(targetNode, measuredNode) {
  if (!targetNode?.classList?.contains?.(ZOOM_CLASS)) {
    return null;
  }

  const parsedTransform = parseAppliedZoomTransform(targetNode.style?.transform || "");
  if (!parsedTransform) {
    return null;
  }

  return {
    node: measuredNode || targetNode,
    ...parsedTransform,
  };
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
  const windowRef = options.windowRef || (globalThis.window !== undefined ? globalThis.window : null);
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
  const boardRect = options.boardRectOverride || resolveStableMeasuredRect(
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

  let tx = clamp(rawTx, minTx, maxTx);
  let ty = clamp(rawTy, minTy, maxTy);
  if (targetNode.matches?.(NATIVE_BOARD_SELECTOR) &&
      segmentPoint.parsedSegment?.ring === "D" && segmentPoint.parsedSegment?.value !== 25 &&
      (intent.reason === "checkout" || intent.reason === "route-finish")) {
    // The native viewport is square and clips the shared board layer. Keep the
    // number just outside the double in view, without changing the segment point.
    const viewBox = segmentPoint.viewBox;
    const dx = segmentPoint.x - (viewBox.x + viewBox.width / 2);
    const dy = segmentPoint.y - (viewBox.y + viewBox.height / 2);
    const distance = Math.hypot(dx, dy);
    if (distance > 0) {
      const offset = getBoardRadius(boardSvg) * 0.2;
      const labelPoint = getScreenPointFromRect({
        x: segmentPoint.x + dx / distance * offset,
        y: segmentPoint.y + dy / distance * offset,
      }, viewBox, boardRect);
      const labelX = zoomLevel * (labelPoint.x - targetRect.left) / scaleX;
      const labelY = zoomLevel * (labelPoint.y - targetRect.top) / scaleY;
      const padding = 8;
      tx = clamp(tx, Math.max(minTx, viewportRect.left + padding - targetRect.left - labelX),
        Math.min(maxTx, viewportRect.right - padding - targetRect.left - labelX));
      ty = clamp(ty, Math.max(minTy, viewportRect.top + padding - targetRect.top - labelY),
        Math.min(maxTy, viewportRect.bottom - padding - targetRect.top - labelY));
    }
  }

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

export function resolveTvBoardZoomTruth(options = {}) {
  return options.x01Truth || resolveX01CheckoutContext({
    gameState: options.gameState,
    documentRef: options.documentRef,
    windowRef: options.windowRef,
    x01Rules: options.x01Rules,
    x01ReadScope: options.x01ReadScope,
  });
}

function resolveZoomGameState(options) {
  const truth = resolveTvBoardZoomTruth(options);
  if (!truth.actionable) {
    return null;
  }
  let activeTurn = truth.activeTurn;
  if (
    truth.source === "dom" &&
    activeTurn &&
    hasVisibleBustTurnScore(options.documentRef, options.matchSurface) &&
    String(options.state?.lastTurnId || "").startsWith("dom:")
  ) {
    activeTurn = { ...activeTurn, id: options.state.lastTurnId };
  }
  return {
    isX01Variant: () => truth.active,
    getOutMode: () => truth.outMode,
    getActiveTurn: () => activeTurn,
    getActiveThrows: () => truth.activeThrows,
    getActiveScore: () => truth.activeScore,
    getActivePlayerIndex: () => truth.activePlayerIndex,
    getSnapshot: () => ({
      match: { id: truth.matchId },
      activePlayerIndex: truth.activePlayerIndex,
      activeScore: truth.activeScore,
      outMode: truth.outMode,
    }),
    x01Truth: truth,
  };
}

function resolveZoomIntentSettings(options = {}) {
  const gameState = resolveZoomGameState(options);
  const x01Truth = gameState?.x01Truth || resolveTvBoardZoomTruth(options);
  const config = options.featureConfig;
  const checkoutZoomTarget =
    String(config?.checkoutZoomTarget || "").trim().toLowerCase() === "route-first"
      ? "route-first"
      : "finish-only";

  return {
    gameState,
    x01Truth,
    x01Rules: options.x01Rules,
    state: options.state,
    documentRef: options.documentRef,
    windowRef: options.windowRef,
    config,
    nowTs: Number.isFinite(options.nowTs) ? options.nowTs : Date.now(),
    outMode: String(x01Truth?.outMode || ""),
    checkoutZoomTarget,
    t20SetupZoomEnabled: config?.t20SetupZoomEnabled !== false,
    finishOnlyCheckoutZoom: Boolean(config?.checkoutZoomEnabled) && checkoutZoomTarget === "finish-only",
  };
}

function resetZoomIntentForBoundaryChange(state) {
  clearZoomIntentHold(state);
  clearManualZoomPause(state);
  state.lastTurnId = "";
  state.lastThrowCount = -1;
  clearZoomScoreHistory(state);
  state.pendingLifecycleResetReason = "game-boundary";
}

function resetZoomIntentForInactiveVariant(state) {
  clearZoomIntentHold(state);
  clearManualZoomPause(state);
  clearZoomScoreHistory(state);
  state.pendingLifecycleResetReason = "variant-inactive";
}

function resetZoomIntentForBust(state) {
  clearZoomIntentHold(state);
  clearManualZoomPause(state);
  state.lastThrowCount = -1;
  clearZoomScoreHistory(state);
  state.pendingLifecycleResetReason = "bust";
}

function hasVisibleBustTurnScore(documentRef, surface) {
  return String(surface?.turnScoreToken || "").toUpperCase() === "BUST" ||
    queryAll(documentRef, TURN_POINTS_SELECTOR).some((node) => {
      return normalizeText(node?.textContent || "").toUpperCase() === "BUST";
    });
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

function resolveHydrationCheckoutIntent({
  checkoutContext,
  state,
  config,
}) {
  if (!config?.checkoutZoomEnabled) {
    return null;
  }

  const checkoutSurface = checkoutContext.checkoutSurface;
  const visibleSegments = checkoutSurface.visibleRouteSegments;
  const finishSegment = checkoutSurface.authoritativeFinishSegment;

  if (
    checkoutSurface.selectionSource !== "validated-visible-route" ||
    visibleSegments.length !== 1 ||
    visibleSegments[0] !== finishSegment ||
    !checkoutSurface.canUseAuthoritativeFinishNow
  ) {
    return null;
  }

  return buildAndStoreIntent(state, "checkout", finishSegment);
}

function resetZoomIntentForTurnChange(state) {
  state.holdUntilTs = 0;
  if (!state.stickyUntilLegEnd) {
    state.activeIntent = null;
  }
  state.stickyUntilTurnChange = false;
  clearManualZoomPause(state);
}

function getPersistedActiveScore(state) {
  const activeScore = Number(state?.lastActiveScore);
  return Number.isFinite(activeScore) && activeScore >= 0 ? activeScore : Number.NaN;
}

function shouldTreatThrowCountDecreaseAsTurnReset(options = {}) {
  const previousThrowCount = Number(options.previousThrowCount);
  const throwCount = Number(options.throwCount);
  if (!(previousThrowCount >= 3 && throwCount === 0)) {
    return false;
  }

  const previousActiveScore = Number(options.previousActiveScore);
  const activeScore = Number(options.activeScore);
  if (!Number.isFinite(previousActiveScore) || !Number.isFinite(activeScore)) {
    return true;
  }

  return activeScore <= previousActiveScore;
}

function buildTurnProgressSignature(throws, activeScore, x01Rules) {
  const segments = Array.isArray(throws)
    ? throws.map((throwEntry) => getThrowSegmentName(throwEntry, x01Rules) || "?")
    : [];
  const numericActiveScore = Number(activeScore);
  const scoreToken = Number.isFinite(numericActiveScore) ? numericActiveScore : "?";
  return `${scoreToken}|${segments.join(",")}`;
}

function persistTurnProgress(state, turnId, throwCount, activeScore, progressSignature) {
  state.lastTurnId = turnId;
  state.lastThrowCount = throwCount;
  const numericActiveScore = Number(activeScore);
  state.lastActiveScore =
    Number.isFinite(numericActiveScore) && numericActiveScore >= 0
      ? numericActiveScore
      : Number.NaN;
  state.lastTurnProgressSignature = String(progressSignature || "");
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
  x01CheckoutContext,
  outMode,
  throwCount,
  x01Rules,
  state,
}) {
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

function isManualPauseStillActive(state, throwCount, progressSignature) {
  if (!state.manualPause) {
    return false;
  }

  const baseline =
    Number.isFinite(state.manualPauseThrowCount) && state.manualPauseThrowCount >= 0
      ? state.manualPauseThrowCount
      : -1;
  const pausedSignature = String(state.manualPauseProgressSignature || "");
  const currentSignature = String(progressSignature || "");
  const correctedSincePause =
    throwCount <= baseline &&
    Boolean(pausedSignature) &&
    Boolean(currentSignature) &&
    pausedSignature !== currentSignature;
  if (throwCount <= baseline && !correctedSincePause) {
    return true;
  }

  clearManualZoomPause(state);
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
}) {
  if (turnChanged || !state.activeIntent || previousThrowCount !== 2 || throwCount !== 3) {
    return null;
  }

  state.holdUntilTs = 0;
  state.stickyUntilTurnChange = true;
  return state.activeIntent;
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

function hasActiveX01ZoomContext({ x01Truth, x01Rules, state }) {
  if (!x01Rules || !x01Truth?.active || !x01Truth.actionable) {
    resetZoomIntentForInactiveVariant(state);
    return false;
  }
  return true;
}

function updateZoomTurnProgress(state, turnProgress, checkoutContext, x01Rules) {
  const { throws, turnId, throwCount, previousThrowCount } = turnProgress;
  let turnChanged = turnProgress.turnChanged;
  const progressSignature = buildTurnProgressSignature(
    throws,
    checkoutContext.activeScore,
    x01Rules
  );

  if (!turnChanged && previousThrowCount >= 0 && throwCount < previousThrowCount) {
    if (
      shouldTreatThrowCountDecreaseAsTurnReset({
        previousThrowCount,
        throwCount,
        previousActiveScore: getPersistedActiveScore(state),
        activeScore: checkoutContext.activeScore,
      })
    ) {
      resetZoomIntentForTurnChange(state);
      turnChanged = true;
    } else {
      // Keep the pre-undo baseline so the changed visit can release the pause
      // and resolve its current target in this same scheduler pass.
      markManualZoomPause(state, previousThrowCount);
    }
  }

  persistTurnProgress(
    state,
    turnId,
    throwCount,
    checkoutContext.activeScore,
    progressSignature
  );
  return { turnChanged, progressSignature };
}

function selectCurrentZoomIntent(options) {
  const { state, config, throwCount, checkoutContext, checkoutZoomTarget, outMode,
    x01Rules, finishOnlyCheckoutZoom, t20SetupZoomEnabled, canUseT20Setup, nowTs } = options;
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

export function computeZoomIntent(options = {}) {
  const matchSurface = options.matchSurface || readModernMatchSurface(options.documentRef, options.windowRef);
  const {
    gameState,
    x01Truth,
    x01Rules,
    state,
    documentRef,
    config,
    nowTs,
    outMode,
    checkoutZoomTarget,
    t20SetupZoomEnabled,
    finishOnlyCheckoutZoom,
  } = resolveZoomIntentSettings({ ...options, matchSurface });

  if (!hasActiveX01ZoomContext({ x01Truth, x01Rules, state })) {
    return null;
  }

  syncBoundaryTokenState(state, x01Truth.gameBoundaryToken);

  const turnProgress = resolveTurnProgressState(state, gameState);
  if (!turnProgress) {
    if (hasVisibleBustTurnScore(documentRef, matchSurface)) {
      resetZoomIntentForBust(state);
      return null;
    }
    return resolveHydrationCheckoutIntent({
      checkoutContext: x01Truth,
      state,
      config,
    });
  }

  const { throws, throwCount, previousThrowCount } = turnProgress;
  if (turnProgress.turnChanged) {
    resetZoomIntentForTurnChange(state);
  }

  const checkoutContext = resolveIntentCheckoutContext({
    x01CheckoutContext: x01Truth,
    outMode,
    throwCount,
    x01Rules,
    state,
  });
  const { turnChanged, progressSignature } = updateZoomTurnProgress(
    state, turnProgress, checkoutContext, x01Rules
  );
  clearDisabledSetupIntent(state, t20SetupZoomEnabled, finishOnlyCheckoutZoom);

  const canUseT20Setup = canUseThirdDartT20Setup(
    throws,
    throwCount,
    checkoutContext.activeScore,
    outMode,
    x01Rules
  );

  if (isManualPauseStillActive(state, throwCount, progressSignature)) {
    return null;
  }

  if (hasVisibleBustTurnScore(documentRef, matchSurface)) {
    const heldIntent = !turnChanged && state.stickyUntilTurnChange ? state.activeIntent :
      resolveThirdDartStickyIntent({ state, turnChanged, previousThrowCount, throwCount });
    if (heldIntent) {
      return heldIntent;
    }
    resetZoomIntentForBust(state);
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

  return selectCurrentZoomIntent({
    state, config, throwCount, checkoutContext, checkoutZoomTarget, outMode,
    x01Rules, finishOnlyCheckoutZoom, t20SetupZoomEnabled, canUseT20Setup, nowTs,
  });
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
  const currentTargetZoomTransform = resolveCurrentAppliedZoomTransform(targetNode, targetNode);
  const currentBoardZoomTransform = resolveCurrentAppliedZoomTransform(targetNode, boardSvg);

  return buildZoomTransform({
    targetNode,
    hostNode: hostNode || targetNode,
    boardSvg,
    zoomLevel,
    intent,
    x01Rules: options?.x01Rules || null,
    windowRef: options?.windowRef || (globalThis.window !== undefined ? globalThis.window : null),
    documentRef: options?.documentRef || (typeof document !== "undefined" ? document : null),
    baseTransform:
      state.targetStyleSnapshot?.node === targetNode
        ? String(state.targetStyleSnapshot.transform?.original?.value || "")
        : "",
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
        : currentTargetZoomTransform,
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
        : currentBoardZoomTransform,
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
    setOwnedStyle(state.hostStyleSnapshot?.overflow, hostNode.style, "overflow", "hidden", "important");
  }
  if (getStyleValue(hostNode.style, "overflow-x") !== "hidden") {
    setOwnedStyle(state.hostStyleSnapshot?.overflowX, hostNode.style, "overflow-x", "hidden", "important");
  }
  if (getStyleValue(hostNode.style, "overflow-y") !== "hidden") {
    setOwnedStyle(state.hostStyleSnapshot?.overflowY, hostNode.style, "overflow-y", "hidden", "important");
  }
}

function hasAppliedZoomHostState(state, hostNode) {
  if (!hostNode?.style) {
    return true;
  }

  const snapshot = state.hostStyleSnapshot;
  return hostNode.classList?.contains?.(ZOOM_HOST_CLASS) === true &&
    snapshot?.node === hostNode &&
    isOwnedStyleApplied(hostNode.style, "overflow", snapshot.overflow) &&
    isOwnedStyleApplied(hostNode.style, "overflow-x", snapshot.overflowX) &&
    isOwnedStyleApplied(hostNode.style, "overflow-y", snapshot.overflowY);
}

function resolveVisualLayers(targetNode, boardSvg) {
  if (!targetNode?.matches?.(`${NATIVE_BOARD_SELECTOR}, .showAnimations, .ad-ext-theme-board-canvas`)) return null;
  // Keep Tools' board-area measurement anchors stable. Never reparent native
  // nodes: the host renderer continues owning their identities and order.
  const candidates = queryAll(targetNode, "svg, img, video").filter((node) =>
    !isLegacyToolsAnimationMedia(node) && !node.closest?.(
      "autodarts-tools-animations, .ad-ext-x01-bust-active-player-cracks, #ad-ext-dart-image-overlay"));
  const layers = candidates.filter((node) => !candidates.some((parent) => parent !== node && parent.contains(node)));
  return layers.includes(boardSvg) ? layers : null;
}

export function hasHealthyZoomSurface(state) {
  if (state.visualZoomStates?.size) {
    return Array.from(state.visualZoomStates.values()).every(hasHealthyZoomSurface);
  }
  const node = state.zoomedElement;
  return Boolean(node && node.isConnected !== false && node.classList?.contains?.(ZOOM_CLASS) &&
    isOwnedStyleApplied(node.style, "transform", state.targetStyleSnapshot?.transform));
}

export function applyZoom(zoomNodes, zoomLevel, speedConfig, intent, state, options = {}) {
  const { targetNode, hostNode, boardSvg } = resolveApplyZoomNodes(zoomNodes);
  const layers = resolveVisualLayers(targetNode, boardSvg);
  if (!layers) {
    if (state.visualZoomStates) resetZoom(speedConfig, state, true);
    return applySingleZoom(zoomNodes, zoomLevel, speedConfig, intent, state, options);
  }
  clearPendingRelease(state);
  if (state.zoomedElement && state.zoomedElement !== targetNode) resetZoom(speedConfig, state, true);
  if (state.zoomHost && state.zoomHost !== hostNode) {
    restoreHostStyle(state, state.zoomHost);
    state.zoomHost = null;
    state.hostStyleSnapshot = null;
  }
  const states = state.visualZoomStates ||= new Map();
  states.forEach((layerState, node) => {
    if (!layers.includes(node)) {
      resetZoom(speedConfig, layerState, true);
      states.delete(node);
    }
  });
  const anchorRect = normalizeRect(targetNode.getBoundingClientRect?.());
  if (!anchorRect?.width || !anchorRect?.height) return null;
  // A live CSS transition reports intermediate SVG bounds. Store the layout
  // relative to the stable frame so passive updates cannot chase those bounds.
  function measureLayer(node, layerState) {
    const previous = layerState?.layoutGeometry;
    if (previous && isOwnedStyleApplied(node.style, "transform", layerState.targetStyleSnapshot?.transform)) {
      const scaleX = anchorRect.width / previous.anchor.width;
      const scaleY = anchorRect.height / previous.anchor.height;
      return normalizeRect({ left: anchorRect.left + (previous.rect.left - previous.anchor.left) * scaleX,
        top: anchorRect.top + (previous.rect.top - previous.anchor.top) * scaleY,
        width: previous.rect.width * scaleX, height: previous.rect.height * scaleY });
    }
    return normalizeRect(node.getBoundingClientRect?.());
  }
  const boardRect = measureLayer(boardSvg, states.get(boardSvg));
  const zoomData = buildZoomTransform({ ...zoomNodes, zoomLevel, intent,
    x01Rules: options.x01Rules, windowRef: options.windowRef, baseTransform: "",
    boardRectOverride: boardRect,
  });
  if (!zoomData) return null;
  // Prepare every layer before writing the first transform, otherwise the
  // later layers could measure an already zoomed primary SVG.
  const prepared = layers.map((node) => {
    const layerState = states.get(node) || {};
    states.set(node, layerState);
    const rect = measureLayer(node, layerState);
    if (!rect?.width || !rect?.height) return null;
    cacheTargetStyle(layerState, node);
    adoptExternalTargetStyleChanges(layerState, node);
    layerState.layoutGeometry = { rect, anchor: anchorRect };
    const tx = zoomData.tx + (zoomLevel - 1) * (rect.left - zoomData.targetRect.left);
    const ty = zoomData.ty + (zoomLevel - 1) * (rect.top - zoomData.targetRect.top);
    const baseTransform = String(layerState.targetStyleSnapshot.transform.original.value || "");
    return { node, layerState, data: { ...zoomData, tx, ty, baseTransform, targetRect: rect,
      transform: `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px) scale(${zoomLevel.toFixed(4)})`,
      signature: `${zoomData.signature}|${baseTransform}|${tx.toFixed(2)}|${ty.toFixed(2)}` } };
  });
  if (prepared.some((layer) => !layer)) return null;
  prepared.forEach(({ node, layerState, data }) => applySingleZoom(
    { targetNode: node, hostNode: null, boardSvg }, zoomLevel, speedConfig, intent,
    layerState, { ...options, zoomData: data }));
  cacheHostStyle(state, hostNode);
  adoptExternalHostStyleChanges(state, hostNode);
  applyZoomHostState(state, hostNode);
  targetNode.setAttribute("data-ad-ext-board-zoom-anchor", "true");
  state.zoomedElement = targetNode;
  state.zoomHost = hostNode;
  state.lastAppliedSignature = zoomData.signature;
  state.lastAppliedIntentSignature = zoomData.intentSignature;
  return zoomData;
}

function applySingleZoom(zoomNodes, zoomLevel, speedConfig, intent, state, options = {}) {
  const { targetNode, hostNode, boardSvg } = resolveApplyZoomNodes(zoomNodes);
  if (!targetNode?.style) {
    return;
  }

  clearPendingRelease(state);
  resetChangedZoomBindings(state, targetNode, hostNode);
  cacheTargetStyle(state, targetNode);
  adoptExternalTargetStyleChanges(state, targetNode);
  adoptExternalHostStyleChanges(state, hostNode);
  const zoomData = options.zoomData || buildApplyZoomData(targetNode, hostNode, boardSvg, zoomLevel, intent, state, options);

  if (!zoomData) {
    return null;
  }

  const composedTransform = zoomData.baseTransform
    ? `${zoomData.baseTransform} ${zoomData.transform}`
    : zoomData.transform;
  const normalizedHostNode = hostNode || null;
  const isSameVisualIntent =
    state.zoomedElement === targetNode &&
    state.zoomHost === normalizedHostNode &&
    state.lastAppliedIntentSignature === zoomData.intentSignature;
  const hasAppliedVisualState =
    targetNode.classList.contains(ZOOM_CLASS) &&
    Boolean(parseAppliedZoomTransform(getStyleValue(targetNode.style, "transform"))) &&
    isOwnedStyleApplied(
      targetNode.style,
      "transform",
      state.targetStyleSnapshot?.node === targetNode ? state.targetStyleSnapshot.transform : null
    ) &&
    hasAppliedZoomHostState(state, hostNode);
  if (
    state.zoomedElement === targetNode &&
    state.zoomHost === normalizedHostNode &&
    state.lastAppliedSignature === zoomData.signature &&
    hasAppliedVisualState
  ) {
    return zoomData;
  }

  applyZoomHostState(state, hostNode);

  if (!targetNode.classList.contains(ZOOM_CLASS)) {
    targetNode.classList.add(ZOOM_CLASS);
  }
  setOwnedStyle(
    state.targetStyleSnapshot?.transformOrigin,
    targetNode.style,
    "transform-origin",
    "0 0",
    "important"
  );
  setOwnedStyle(state.targetStyleSnapshot?.willChange, targetNode.style, "will-change", "transform");
  setOwnedStyle(
    state.targetStyleSnapshot?.transition,
    targetNode.style,
    "transition",
    isSameVisualIntent ? "none" : `transform ${speedConfig.zoomInMs}ms ${speedConfig.easingIn}`
  );
  setOwnedStyle(
    state.targetStyleSnapshot?.transform,
    targetNode.style,
    "transform",
    composedTransform,
    "important"
  );

  state.zoomedElement = targetNode;
  state.zoomHost = normalizedHostNode;
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
  if (state.visualZoomStates) {
    clearPendingRelease(state);
    state.visualZoomStates.forEach((layerState) => resetZoom(speedConfig, layerState, immediate));
    const targetNode = state.zoomedElement;
    const hostNode = state.zoomHost;
    const finish = () => {
      state.releaseTimeoutId = 0;
      if (state.zoomedElement !== targetNode) return;
      targetNode?.removeAttribute?.("data-ad-ext-board-zoom-anchor");
      restoreHostStyle(state, hostNode);
      state.zoomedElement = null;
      state.zoomHost = null;
      state.hostStyleSnapshot = null;
      state.lastAppliedSignature = "";
      state.lastAppliedIntentSignature = "";
      state.lastAppliedZoomTransform = null;
      state.visualZoomStates = null;
    };
    if (immediate) finish();
    else state.releaseTimeoutId = setTimeout(finish, Math.max(0, Number(speedConfig?.zoomOutMs || 0)) + RELEASE_PADDING_MS);
    return;
  }
  clearPendingRelease(state);

  const targetNode = state.zoomedElement;
  const hostNode = state.zoomHost;
  const targetSnapshot = state.targetStyleSnapshot;
  const snapshotTransform =
    targetSnapshot?.node === targetNode
      ? String(targetSnapshot.transform?.original?.value || "")
      : "";

  if (!targetNode) {
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

  setOwnedStyle(
    targetSnapshot?.transition,
    targetNode.style,
    "transition",
    `transform ${speedConfig.zoomOutMs}ms ${speedConfig.easingOut}`
  );
  setOwnedStyle(targetSnapshot?.transform, targetNode.style, "transform", snapshotTransform);

  const expectedTarget = targetNode;
  const expectedHost = hostNode;
  const releaseDelay = Math.max(0, Number(speedConfig?.zoomOutMs || 0)) + RELEASE_PADDING_MS;
  state.releaseTimeoutId = setTimeout(() => {
    state.releaseTimeoutId = 0;

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
