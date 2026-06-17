import { findBoardSvgGroup } from "../../shared/dartboard-svg.js";
import {
  buildMarkerKey,
  collectBoardMarkers,
  readMarkerPosition,
} from "../../shared/dartboard-markers.js";
import { isLiveBoardInputModeActive } from "../../shared/board-input-mode.js";
import { resolveDartDesignAsset } from "#feature-assets";
import {
  DART_IMPACT_SHADOW_OPACITY_BOOST,
  createDartImpactShadowKeyframes,
  createDartImpactShadowOptions,
  createDartImpactWobbleKeyframes,
  createDartImpactWobbleOptions,
} from "./impact.js";
import {
  DART_CLASS,
  DART_CONTAINER_CLASS,
  DART_ROTATE_CLASS,
  DART_SHADOW_CLASS,
  OVERLAY_ID,
  OVERLAY_SCENE_ID,
} from "./style.js";

const SVG_NS = "http://www.w3.org/2000/svg";
const XLINK_NS = "http://www.w3.org/1999/xlink";
const MARKER_OPACITY_DATA_KEY = "adExtOriginalOpacity";
export const DART_IMAGE_SOURCE_WIDTH = 789;
export const DART_IMAGE_SOURCE_HEIGHT = 331;
export const DART_IMAGE_TIP_Y = 212;

const DART_ASPECT_RATIO = DART_IMAGE_SOURCE_WIDTH / DART_IMAGE_SOURCE_HEIGHT;
const TIP_OFFSET_X_RATIO = 0;
const TIP_OFFSET_Y_RATIO = DART_IMAGE_TIP_Y / DART_IMAGE_SOURCE_HEIGHT;
const MAX_MARKER_RECT_SIZE = 96;
const RENDER_ERROR_WARN_PX = 10;
const MARKER_SCAN_HEARTBEAT_TICKS = 30;
const RETRY_DELAY_MS = 90;
const FLIGHT_DISTANCE_RATIO = 1.2;
const FLIGHT_ARC_HEIGHT_RATIO = 0.16;
const FLIGHT_EASING = "cubic-bezier(0.15, 0.7, 0.2, 1)";
const FLIGHT_SETTLE_BUFFER_MS = 140;
const FLIGHT_TIMEOUT_BUFFER_MS = 220;
const SHADOW_FILTER_ID = "ad-ext-dart-shadow-filter";
const DART_OPACITY = 1;
const SHADOW_OPACITY = 0.28;
const SHADOW_BLUR_PX = 2;
const SHADOW_OFFSET_X_RATIO = 0.06;
const SHADOW_OFFSET_Y_RATIO = 0.08;
const RENDER_CHECK_HEARTBEAT_TICKS = 15;

function getTimerFns(windowRef) {
  return {
    setTimeoutRef:
      windowRef && typeof windowRef.setTimeout === "function"
        ? windowRef.setTimeout.bind(windowRef)
        : setTimeout,
    clearTimeoutRef:
      windowRef && typeof windowRef.clearTimeout === "function"
        ? windowRef.clearTimeout.bind(windowRef)
        : clearTimeout,
  };
}

function nowMs(windowRef) {
  if (windowRef?.performance && typeof windowRef.performance.now === "function") {
    return windowRef.performance.now();
  }
  return Date.now();
}

function toFiniteNumber(value, fallbackValue = 0) {
  return Number.isFinite(value) ? Number(value) : Number(fallbackValue);
}

function getCurrentHref(windowRef) {
  if (!windowRef?.location) {
    return "";
  }
  return String(windowRef.location.href || "").trim();
}

function buildRectPayload(rect) {
  return {
    left: toFiniteNumber(rect?.left, 0),
    top: toFiniteNumber(rect?.top, 0),
    width: toFiniteNumber(rect?.width, 0),
    height: toFiniteNumber(rect?.height, 0),
  };
}

function normalizeRect(rect) {
  if (!rect) {
    return null;
  }

  const left = Number(rect.left);
  const top = Number(rect.top);
  const width = Number(rect.width);
  const height = Number(rect.height);

  if (
    !Number.isFinite(left) ||
    !Number.isFinite(top) ||
    !Number.isFinite(width) ||
    !Number.isFinite(height)
  ) {
    return null;
  }

  return {
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
  };
}

function getNodeRect(node) {
  if (!node || typeof node.getBoundingClientRect !== "function") {
    return null;
  }
  return normalizeRect(node.getBoundingClientRect());
}

function buildRectSignature(rect) {
  if (!rect) {
    return "none";
  }

  return [
    toFiniteNumber(rect.left).toFixed(2),
    toFiniteNumber(rect.top).toFixed(2),
    toFiniteNumber(rect.width).toFixed(2),
    toFiniteNumber(rect.height).toFixed(2),
  ].join("|");
}

function isConnectedNode(node) {
  return Boolean(node && typeof node === "object" && node.isConnected !== false);
}

function isReusableBoardSnapshot(snapshot) {
  if (!snapshot?.svg || !snapshot?.group || !snapshot?.radius) {
    return false;
  }

  if (!isConnectedNode(snapshot.svg) || !isConnectedNode(snapshot.group)) {
    return false;
  }

  if (
    snapshot.group !== snapshot.svg &&
    typeof snapshot.svg.contains === "function" &&
    !snapshot.svg.contains(snapshot.group)
  ) {
    return false;
  }

  return true;
}

function resolveBoardSnapshot(documentRef, state, shouldRescan = true) {
  if (!shouldRescan && isReusableBoardSnapshot(state?.boardSnapshot)) {
    return state.boardSnapshot;
  }

  const nextBoard = findBoardSvgGroup(documentRef);
  if (state) {
    state.boardSnapshot = nextBoard?.svg ? nextBoard : null;
  }
  return nextBoard;
}

function areReusableMarkers(markers = [], board = null) {
  if (!Array.isArray(markers) || !markers.length || !board?.svg) {
    return false;
  }

  return markers.every((marker) => {
    if (!isConnectedNode(marker)) {
      return false;
    }
    if (typeof board.svg.contains === "function" && !board.svg.contains(marker)) {
      return false;
    }
    return true;
  });
}

function resolveBoardMarkers(documentRef, state, board, shouldRescan = true) {
  if (!shouldRescan && areReusableMarkers(state?.markerNodes, board)) {
    return state.markerNodes;
  }

  const markers = collectBoardMarkers(documentRef, { board });
  if (state) {
    state.markerNodes = markers;
  }
  return markers;
}

function setStyleIfChanged(styleRef, propertyName, value) {
  if (!styleRef || !propertyName) {
    return false;
  }

  const nextValue = String(value ?? "");
  if (String(styleRef[propertyName] || "") === nextValue) {
    return false;
  }

  styleRef[propertyName] = nextValue;
  return true;
}

function setAttributeIfChanged(node, name, value) {
  if (!node || typeof node.setAttribute !== "function") {
    return false;
  }

  const nextValue = String(value ?? "");
  if (String(node.getAttribute?.(name) || "") === nextValue) {
    return false;
  }

  node.setAttribute(name, nextValue);
  return true;
}

function setAttributeNsIfChanged(node, namespaceUri, name, value) {
  if (!node || typeof node.setAttributeNS !== "function") {
    return false;
  }

  const nextValue = String(value ?? "");
  const currentValue =
    typeof node.getAttributeNS === "function"
      ? node.getAttributeNS(namespaceUri, name)
      : node.getAttribute?.(name);
  if (String(currentValue || "") === nextValue) {
    return false;
  }

  node.setAttributeNS(namespaceUri, name, nextValue);
  return true;
}

function removeAttributeIfPresent(node, name) {
  if (!node || typeof node.removeAttribute !== "function") {
    return false;
  }

  if (node.getAttribute?.(name) === null) {
    return false;
  }

  node.removeAttribute(name);
  return true;
}

function resolveClipViewportNode(boardSvg) {
  if (!boardSvg || typeof boardSvg.closest !== "function") {
    return null;
  }

  return (
    boardSvg.closest(".ad-ext-tv-board-zoom-host") ||
    boardSvg.closest(".ad-ext-theme-board-viewport") ||
    boardSvg.closest(".css-tqsk66") ||
    null
  );
}

function clearOverlayClipPath(overlay) {
  if (!overlay?.style) {
    return;
  }
  setStyleIfChanged(overlay.style, "clipPath", "");
  setStyleIfChanged(overlay.style, "webkitClipPath", "");
}

function clampToRange(value, minValue, maxValue) {
  if (!Number.isFinite(value)) {
    return minValue;
  }
  return Math.min(maxValue, Math.max(minValue, value));
}

function applyOverlayViewportClip(overlay, overlayRect, viewportRect) {
  if (!overlay?.style || !overlayRect || !viewportRect) {
    clearOverlayClipPath(overlay);
    return "";
  }

  const overlayWidth = Number(overlayRect.width);
  const overlayHeight = Number(overlayRect.height);
  if (!(overlayWidth > 0) || !(overlayHeight > 0)) {
    clearOverlayClipPath(overlay);
    return "";
  }

  const top = clampToRange(
    Number(viewportRect.top) - Number(overlayRect.top),
    0,
    overlayHeight
  );
  const right = clampToRange(
    Number(overlayRect.right) - Number(viewportRect.right),
    0,
    overlayWidth
  );
  const bottom = clampToRange(
    Number(overlayRect.bottom) - Number(viewportRect.bottom),
    0,
    overlayHeight
  );
  const left = clampToRange(
    Number(viewportRect.left) - Number(overlayRect.left),
    0,
    overlayWidth
  );

  const hasClip = top > 0.01 || right > 0.01 || bottom > 0.01 || left > 0.01;
  if (!hasClip) {
    clearOverlayClipPath(overlay);
    return "";
  }

  const clipPath = `inset(${top.toFixed(2)}px ${right.toFixed(2)}px ${bottom.toFixed(2)}px ${left.toFixed(2)}px)`;
  setStyleIfChanged(overlay.style, "clipPath", clipPath);
  setStyleIfChanged(overlay.style, "webkitClipPath", clipPath);
  return clipPath;
}

function emitDebug(state, featureDebug, eventName, payload = {}, options = {}) {
  if (!featureDebug?.enabled || !state) {
    return;
  }

  const shouldHeartbeat = Boolean(options.heartbeat);
  const signature = `${eventName}:${JSON.stringify(payload)}`;
  const lastSignature = state.debugSignatures.get(eventName) || "";

  if (lastSignature === signature) {
    if (!shouldHeartbeat || state.updateTick % MARKER_SCAN_HEARTBEAT_TICKS !== 0) {
      return;
    }
  }

  state.debugSignatures.set(eventName, signature);
  featureDebug.log(eventName, payload);
}

function emitDebugWarn(state, featureDebug, eventName, payload = {}) {
  if (!featureDebug?.enabled || !state) {
    return;
  }

  const signature = `${eventName}:${JSON.stringify(payload)}`;
  const lastSignature = state.debugWarningSignatures.get(eventName) || "";
  if (lastSignature === signature) {
    return;
  }

  state.debugWarningSignatures.set(eventName, signature);
  featureDebug.warn(eventName, payload);
}

function getSvgScale(svgNode) {
  if (!svgNode || typeof svgNode.getScreenCTM !== "function") {
    return 1;
  }

  const matrix = svgNode.getScreenCTM();
  if (!matrix) {
    return 1;
  }

  const scaleX = Math.hypot(Number(matrix.a) || 0, Number(matrix.b) || 0);
  const scaleY = Math.hypot(Number(matrix.c) || 0, Number(matrix.d) || 0);
  if (!Number.isFinite(scaleX) || !Number.isFinite(scaleY) || scaleX <= 0 || scaleY <= 0) {
    return 1;
  }

  return Math.min(scaleX, scaleY);
}

function isBoardVisible(boardSvg, boardRect) {
  if (!boardSvg || !boardRect) {
    return false;
  }
  if (!Number.isFinite(boardRect.width) || !Number.isFinite(boardRect.height)) {
    return false;
  }
  if (boardRect.width <= 1 || boardRect.height <= 1) {
    return false;
  }

  const styleRef =
    boardSvg.ownerDocument?.defaultView &&
    typeof boardSvg.ownerDocument.defaultView.getComputedStyle === "function"
      ? boardSvg.ownerDocument.defaultView.getComputedStyle(boardSvg)
      : null;
  if (!styleRef) {
    return true;
  }

  if (styleRef.display === "none") {
    return false;
  }
  if (styleRef.visibility === "hidden" || styleRef.visibility === "collapse") {
    return false;
  }

  const opacity = Number.parseFloat(styleRef.opacity);
  if (Number.isFinite(opacity) && opacity <= 0) {
    return false;
  }

  return true;
}

function ensureOverlaySvg(state, documentRef) {
  if (!state || !documentRef || typeof documentRef.createElementNS !== "function") {
    return null;
  }

  let overlay = state.overlayNode;
  if (overlay?.isConnected) {
    if (String(overlay.tagName || "").toLowerCase() === "svg") {
      return overlay;
    }
  }

  overlay = documentRef.getElementById(OVERLAY_ID);
  if (overlay && String(overlay.tagName || "").toLowerCase() !== "svg") {
    overlay.remove?.();
    overlay = null;
  }

  if (!overlay) {
    overlay = documentRef.createElementNS(SVG_NS, "svg");
    overlay.id = OVERLAY_ID;
    overlay.setAttribute("aria-hidden", "true");
    overlay.setAttribute("focusable", "false");
    (documentRef.body || documentRef.documentElement)?.appendChild?.(overlay);
  }

  state.overlayNode = overlay;
  return overlay;
}

function ensureOverlayScene(state, overlay) {
  if (!state || !overlay || typeof overlay.querySelector !== "function") {
    return null;
  }

  let scene = overlay.querySelector(`#${OVERLAY_SCENE_ID}`);
  if (scene && String(scene.tagName || "").toLowerCase() !== "g") {
    scene.remove?.();
    scene = null;
  }

  if (!scene) {
    scene = overlay.ownerDocument?.createElementNS?.(SVG_NS, "g") || null;
    if (scene) {
      scene.id = OVERLAY_SCENE_ID;
      overlay.appendChild(scene);
    }
  }

  state.overlaySceneNode = scene || null;
  return state.overlaySceneNode;
}

function ensureShadowFilter(overlay, enabled, enableShadowBlur = true) {
  if (!overlay || !enabled) {
    return null;
  }

  let defs = overlay.querySelector("defs");
  if (!defs) {
    defs = overlay.ownerDocument?.createElementNS?.(SVG_NS, "defs") || null;
    if (!defs) {
      return null;
    }
    overlay.appendChild(defs);
  }

  let filter = overlay.querySelector(`#${SHADOW_FILTER_ID}`);
  if (!filter) {
    filter = overlay.ownerDocument?.createElementNS?.(SVG_NS, "filter") || null;
    if (!filter) {
      return null;
    }
    filter.id = SHADOW_FILTER_ID;
    filter.setAttribute("x", "-50%");
    filter.setAttribute("y", "-50%");
    filter.setAttribute("width", "200%");
    filter.setAttribute("height", "200%");
    filter.setAttribute("color-interpolation-filters", "sRGB");

    const colorMatrix = overlay.ownerDocument?.createElementNS?.(SVG_NS, "feColorMatrix") || null;
    if (colorMatrix) {
      setAttributeIfChanged(colorMatrix, "type", "matrix");
      setAttributeIfChanged(colorMatrix, "in", "SourceGraphic");
      setAttributeIfChanged(colorMatrix, "result", "shadowColor");
      setAttributeIfChanged(
        colorMatrix,
        "values",
        "0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0"
      );
      filter.appendChild(colorMatrix);
    }

    defs.appendChild(filter);
  }

  let blurNode = filter.querySelector("feGaussianBlur");
  if (enableShadowBlur && !blurNode) {
    blurNode = overlay.ownerDocument?.createElementNS?.(SVG_NS, "feGaussianBlur") || null;
    if (blurNode) {
      setAttributeIfChanged(blurNode, "in", "shadowColor");
      setAttributeIfChanged(blurNode, "result", "shadowBlur");
      filter.appendChild(blurNode);
    }
  }

  if (blurNode) {
    if (enableShadowBlur) {
      setAttributeIfChanged(blurNode, "stdDeviation", String(SHADOW_BLUR_PX));
    } else {
      blurNode.remove?.();
    }
  }

  return filter;
}

function clearOverlayChildren(state) {
  if (!state?.overlaySceneNode) {
    return;
  }

  while (state.overlaySceneNode.firstChild) {
    state.overlaySceneNode.firstChild.remove();
  }
}

function removeOverlayNode(state) {
  if (!state?.overlayNode) {
    return;
  }

  state.overlayNode.remove?.();
  state.overlayNode = null;
  state.overlaySceneNode = null;
}

function getOverlayPadding(dartLength, visualConfig) {
  let padding = Math.max(16, dartLength);
  if (visualConfig?.animateDarts) {
    padding = Math.max(padding, dartLength * 1.28);
  }
  return padding;
}

function updateOverlayLayout(overlay, boardRect, paddingPx) {
  const width = Number(boardRect.width) + paddingPx * 2;
  const height = Number(boardRect.height) + paddingPx * 2;
  const left = Number(boardRect.left) - paddingPx;
  const top = Number(boardRect.top) - paddingPx;

  const leftPx = `${left}px`;
  const topPx = `${top}px`;
  const widthPx = `${width}px`;
  const heightPx = `${height}px`;
  const widthValue = String(width);
  const heightValue = String(height);
  const viewBox = `0 0 ${width} ${height}`;

  if (overlay.style.left !== leftPx) {
    overlay.style.left = leftPx;
  }
  if (overlay.style.top !== topPx) {
    overlay.style.top = topPx;
  }
  if (overlay.style.width !== widthPx) {
    overlay.style.width = widthPx;
  }
  if (overlay.style.height !== heightPx) {
    overlay.style.height = heightPx;
  }
  if (overlay.getAttribute("width") !== widthValue) {
    overlay.setAttribute("width", widthValue);
  }
  if (overlay.getAttribute("height") !== heightValue) {
    overlay.setAttribute("height", heightValue);
  }
  if (overlay.getAttribute("viewBox") !== viewBox) {
    overlay.setAttribute("viewBox", viewBox);
  }

  return {
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
  };
}

function createDartEntry(ownerDocument) {
  const container = ownerDocument.createElementNS(SVG_NS, "g");
  container.classList.add(DART_CONTAINER_CLASS);

  const rotateGroup = ownerDocument.createElementNS(SVG_NS, "g");
  rotateGroup.classList.add(DART_ROTATE_CLASS);

  const shadowNode = ownerDocument.createElementNS(SVG_NS, "image");
  shadowNode.classList.add(DART_SHADOW_CLASS);
  shadowNode.setAttribute("preserveAspectRatio", "xMidYMid meet");
  shadowNode.setAttribute("aria-hidden", "true");

  const imageNode = ownerDocument.createElementNS(SVG_NS, "image");
  imageNode.classList.add(DART_CLASS);
  imageNode.setAttribute("preserveAspectRatio", "xMidYMid meet");
  imageNode.setAttribute("aria-hidden", "true");

  rotateGroup.appendChild(shadowNode);
  rotateGroup.appendChild(imageNode);
  container.appendChild(rotateGroup);

  return {
    marker: null,
    container,
    rotateGroup,
    shadowNode,
    imageNode,
    dartLength: 0,
    dartHeight: 0,
    center: null,
    tipPointLocal: null,
    rotationDeg: 0,
    flightAnimation: null,
    wobbleAnimation: null,
    shadowImpactAnimation: null,
    flightStartedAt: 0,
    settleUntil: 0,
    lastTargetCenter: null,
    lastScreenPointSource: "",
    lastRenderCheckSignature: "",
    lastRenderedSignature: "",
    lastGeometrySignature: "",
  };
}

function setImageSource(imageNode, sourceUrl) {
  if (!imageNode) {
    return;
  }

  setAttributeIfChanged(imageNode, "href", sourceUrl);
  if (typeof imageNode.setAttributeNS === "function") {
    setAttributeNsIfChanged(imageNode, XLINK_NS, "href", sourceUrl);
  }
}

function setMarkerHidden(marker, shouldHide, state) {
  if (!marker?.style || !state) {
    return;
  }

  if (shouldHide) {
    if (!state.markerOpacityByMarker.has(marker)) {
      state.markerOpacityByMarker.set(marker, marker.style.opacity || "");
    }
    marker.dataset[MARKER_OPACITY_DATA_KEY] = marker.style.opacity || "";
    setStyleIfChanged(marker.style, "opacity", "0");
    return;
  }

  if (state.markerOpacityByMarker.has(marker)) {
    setStyleIfChanged(marker.style, "opacity", state.markerOpacityByMarker.get(marker));
    state.markerOpacityByMarker.delete(marker);
  }

  if (
    marker.dataset &&
    Object.hasOwn(marker.dataset, MARKER_OPACITY_DATA_KEY)
  ) {
    delete marker.dataset[MARKER_OPACITY_DATA_KEY];
  }
}

function restoreHiddenMarkers(state) {
  if (!state) {
    return;
  }

  state.markerOpacityByMarker.forEach((opacity, marker) => {
    if (!marker?.style) {
      return;
    }

    setStyleIfChanged(marker.style, "opacity", opacity);
    if (
      marker.dataset &&
      Object.hasOwn(marker.dataset, MARKER_OPACITY_DATA_KEY)
    ) {
      delete marker.dataset[MARKER_OPACITY_DATA_KEY];
    }
  });

  state.markerOpacityByMarker.clear();
}

function getMarkerScreenPoint(marker) {
  if (!marker) {
    return null;
  }

  if (typeof marker.getBoundingClientRect === "function") {
    const rect = normalizeRect(marker.getBoundingClientRect());
    if (
      rect &&
      rect.width > 0 &&
      rect.height > 0 &&
      rect.width <= MAX_MARKER_RECT_SIZE &&
      rect.height <= MAX_MARKER_RECT_SIZE
    ) {
      return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
        source: "rect",
      };
    }
  }

  const svg = marker.ownerSVGElement;
  if (!svg || typeof svg.createSVGPoint !== "function") {
    return null;
  }

  const markerPosition = readMarkerPosition(marker);
  let cx = markerPosition?.cx;
  let cy = markerPosition?.cy;

  if ((!Number.isFinite(cx) || !Number.isFinite(cy)) && typeof marker.getBBox === "function") {
    const bbox = marker.getBBox();
    cx = Number(bbox?.x) + Number(bbox?.width) / 2;
    cy = Number(bbox?.y) + Number(bbox?.height) / 2;
  }

  if (!Number.isFinite(cx) || !Number.isFinite(cy)) {
    return null;
  }

  const matrix = typeof marker.getScreenCTM === "function" ? marker.getScreenCTM() : null;
  if (!matrix) {
    return null;
  }

  const point = svg.createSVGPoint();
  point.x = cx;
  point.y = cy;

  const screenPoint = point.matrixTransform(matrix);
  if (!Number.isFinite(screenPoint?.x) || !Number.isFinite(screenPoint?.y)) {
    return null;
  }

  return {
    x: Number(screenPoint.x),
    y: Number(screenPoint.y),
    source: "matrix",
  };
}

function getDartOffsets(dartLength, dartHeight) {
  return {
    offsetX: dartLength * TIP_OFFSET_X_RATIO,
    offsetY: dartHeight * TIP_OFFSET_Y_RATIO,
  };
}

function getShadowSettings(dartLength, dartOpacity, visualConfig) {
  const enabled = Boolean(visualConfig?.enableShadow);
  return {
    enabled,
    blurEnabled: enabled && Boolean(visualConfig?.enableShadowBlur),
    baseOpacity: Math.min(1, Math.max(0, SHADOW_OPACITY * dartOpacity)),
    offsetX: dartLength * SHADOW_OFFSET_X_RATIO,
    offsetY: dartLength * SHADOW_OFFSET_Y_RATIO,
  };
}

function getRotationDeg(center, boardCenter) {
  const angleToCenter =
    (Math.atan2(boardCenter.y - center.y, boardCenter.x - center.x) * 180) / Math.PI;
  return angleToCenter - 180;
}

function setDartGeometry(entry, options = {}) {
  const imageNode = entry?.imageNode;
  const shadowNode = entry?.shadowNode;
  const rotateGroup = entry?.rotateGroup;
  if (!imageNode || !rotateGroup) {
    return null;
  }

  const center = options.center;
  const boardCenter = options.boardCenter;
  const dartLength = options.dartLength;
  const dartHeight = options.dartHeight;
  const sourceUrl = options.sourceUrl;
  const visualConfig = options.visualConfig || {};

  const offsets = getDartOffsets(dartLength, dartHeight);
  const x = center.x - offsets.offsetX;
  const y = center.y - offsets.offsetY;
  const rotationDeg = Number.isFinite(options.rotationDeg)
    ? Number(options.rotationDeg)
    : getRotationDeg(center, boardCenter);
  const dartOpacity = DART_OPACITY;
  const shadowSettings = getShadowSettings(dartLength, dartOpacity, visualConfig);

  if (sourceUrl) {
    setImageSource(imageNode, sourceUrl);
    if (shadowNode) {
      setImageSource(shadowNode, sourceUrl);
    }
  }

  setAttributeIfChanged(imageNode, "width", String(dartLength));
  setAttributeIfChanged(imageNode, "height", String(dartHeight));
  setAttributeIfChanged(imageNode, "x", String(x));
  setAttributeIfChanged(imageNode, "y", String(y));
  removeAttributeIfPresent(imageNode, "transform");
  setStyleIfChanged(imageNode.style, "opacity", String(dartOpacity));

  if (dartLength > 0 && dartHeight > 0) {
    const originX = Math.min(100, Math.max(0, (offsets.offsetX / dartLength) * 100));
    const originY = Math.min(100, Math.max(0, (offsets.offsetY / dartHeight) * 100));
    const origin = `${originX}% ${originY}%`;
    setStyleIfChanged(imageNode.style, "transformOrigin", origin);
    if (shadowNode) {
      setStyleIfChanged(shadowNode.style, "transformOrigin", origin);
    }
  } else {
    setStyleIfChanged(imageNode.style, "transformOrigin", "");
    if (shadowNode) {
      setStyleIfChanged(shadowNode.style, "transformOrigin", "");
    }
  }

  if (shadowNode) {
    setAttributeIfChanged(shadowNode, "width", String(dartLength));
    setAttributeIfChanged(shadowNode, "height", String(dartHeight));
    setAttributeIfChanged(shadowNode, "x", String(x));
    setAttributeIfChanged(shadowNode, "y", String(y));
    setStyleIfChanged(
      shadowNode.style,
      "opacity",
      shadowSettings.enabled ? String(shadowSettings.baseOpacity) : "0"
    );
    setStyleIfChanged(shadowNode.style, "display", shadowSettings.enabled ? "" : "none");
    setStyleIfChanged(shadowNode.style, "filter", "");
    if (shadowSettings.enabled) {
      setAttributeIfChanged(shadowNode, "filter", `url(#${SHADOW_FILTER_ID})`);
    } else {
      removeAttributeIfPresent(shadowNode, "filter");
    }

    if (shadowSettings.enabled) {
      const tipRatioX = TIP_OFFSET_X_RATIO;
      const tailLength = Math.max(1, dartLength * Math.max(0.05, Math.abs(1 - tipRatioX)));
      const theta = (rotationDeg * Math.PI) / 180;
      const localX = shadowSettings.offsetX * Math.cos(theta) + shadowSettings.offsetY * Math.sin(theta);
      const localY = -shadowSettings.offsetX * Math.sin(theta) + shadowSettings.offsetY * Math.cos(theta);
      const scaleX = Math.max(0.2, 1 + localX / tailLength);
      const skewYDeg = (Math.atan2(localY, tailLength) * 180) / Math.PI;
      setStyleIfChanged(shadowNode.style, "transform", `scale(${scaleX}, 1) skewY(${skewYDeg}deg)`);
    } else {
      setStyleIfChanged(shadowNode.style, "transform", "");
    }
  }

  setAttributeIfChanged(rotateGroup, "transform", `rotate(${rotationDeg} ${center.x} ${center.y})`);

  entry.center = center;
  entry.dartLength = dartLength;
  entry.dartHeight = dartHeight;
  entry.rotationDeg = rotationDeg;
  entry.tipPointLocal = {
    x: x + offsets.offsetX,
    y: y + offsets.offsetY,
  };

  return {
    x,
    y,
    rotationDeg,
  };
}

function cancelFlightTimeout(state, marker) {
  if (!state || !marker) {
    return;
  }

  const handle = state.flightTimeoutByMarker.get(marker);
  if (!handle) {
    return;
  }

  const { clearTimeoutRef } = getTimerFns(state.windowRef);
  clearTimeoutRef(handle);
  state.flightTimeoutByMarker.delete(marker);
}

function clearFlightTimeouts(state) {
  if (!state) {
    return;
  }

  const { clearTimeoutRef } = getTimerFns(state.windowRef);
  state.flightTimeoutByMarker.forEach((handle) => clearTimeoutRef(handle));
  state.flightTimeoutByMarker.clear();
}

function clearRetryTimer(state) {
  if (!state?.retryTimer) {
    return;
  }

  const { clearTimeoutRef } = getTimerFns(state.windowRef);
  clearTimeoutRef(state.retryTimer);
  state.retryTimer = 0;
}

function scheduleRetry(state, scheduleUpdate, delayMs) {
  if (!state || state.retryTimer || typeof scheduleUpdate !== "function") {
    return false;
  }

  const { setTimeoutRef } = getTimerFns(state.windowRef);
  state.retryTimer = setTimeoutRef(() => {
    state.retryTimer = 0;
    scheduleUpdate();
  }, Math.max(0, Number(delayMs) || RETRY_DELAY_MS));
  return true;
}

function clearFlightVisualState(entry) {
  if (!entry?.container?.style) {
    return;
  }

  entry.container.style.transform = "";
  entry.container.style.opacity = "";
  entry.container.style.filter = "";
}

function cancelEntryFlight(state, entry) {
  if (!entry) {
    return;
  }

  cancelFlightTimeout(state, entry.marker);

  if (entry.flightAnimation && typeof entry.flightAnimation.cancel === "function") {
    try {
      entry.flightAnimation.cancel();
    } catch (_) {
      // Keep cleanup fail-soft.
    }
  }

  if (entry.wobbleAnimation && typeof entry.wobbleAnimation.cancel === "function") {
    try {
      entry.wobbleAnimation.cancel();
    } catch (_) {
      // Keep cleanup fail-soft.
    }
  }

  if (entry.shadowImpactAnimation && typeof entry.shadowImpactAnimation.cancel === "function") {
    try {
      entry.shadowImpactAnimation.cancel();
    } catch (_) {
      // Keep cleanup fail-soft.
    }
  }

  entry.flightAnimation = null;
  entry.wobbleAnimation = null;
  entry.shadowImpactAnimation = null;
  entry.flightStartedAt = 0;
  clearFlightVisualState(entry);
  if (entry.imageNode?.style) {
    entry.imageNode.style.transform = "";
  }
  if (entry.shadowNode?.style) {
    entry.shadowNode.style.filter = "";
  }
}

function getFlightOffsets(center, boardCenter, dartLength) {
  let dx = center.x - boardCenter.x;
  let dy = center.y - boardCenter.y;
  let length = Math.hypot(dx, dy);

  if (!Number.isFinite(length) || length < 0.001) {
    dx = 1;
    dy = 0;
    length = 1;
  }

  const dirX = dx / length;
  const dirY = dy / length;
  const startDistance = dartLength * FLIGHT_DISTANCE_RATIO;
  const start = {
    x: dirX * startDistance,
    y: dirY * startDistance,
  };
  const mid = {
    x: start.x * 0.5,
    y: start.y * 0.5,
  };

  const arcHeight = dartLength * FLIGHT_ARC_HEIGHT_RATIO;
  if (arcHeight > 0) {
    const gravityScale = 0.35 + 0.65 * Math.abs(dirY);
    mid.y += arcHeight * gravityScale;
  }

  return { start, mid };
}

function buildGeometryPayload({
  marker,
  index,
  screenPoint,
  overlayRect,
  svgRect,
  groupRect,
  entry,
  extra = {},
}) {
  const payload = {
    markerKey: buildMarkerKey(marker),
    index,
    targetCenter: {
      x: Number(screenPoint.x.toFixed(2)),
      y: Number(screenPoint.y.toFixed(2)),
    },
    overlayRect: buildRectPayload(overlayRect),
    svgRect: buildRectPayload(svgRect),
    groupRect: buildRectPayload(groupRect),
    rotationDeg: Number(toFiniteNumber(entry?.rotationDeg, 0).toFixed(2)),
  };

  Object.keys(extra).forEach((key) => {
    if (extra[key] !== undefined) {
      payload[key] = extra[key];
    }
  });

  return payload;
}

function buildDartGeometrySignature({
  center,
  boardCenter,
  dartLength,
  dartHeight,
  sourceUrl,
  visualConfig,
  rotationDeg,
}) {
  return [
    Number(center?.x || 0).toFixed(2),
    Number(center?.y || 0).toFixed(2),
    Number(boardCenter?.x || 0).toFixed(2),
    Number(boardCenter?.y || 0).toFixed(2),
    Number(dartLength || 0).toFixed(2),
    Number(dartHeight || 0).toFixed(2),
    Number(rotationDeg || 0).toFixed(2),
    String(sourceUrl || ""),
    visualConfig?.enableShadow ? "shadow-on" : "shadow-off",
    visualConfig?.enableShadowBlur ? "shadow-blur-on" : "shadow-blur-off",
  ].join("|");
}

function buildMarkerSnapshotSignature(markers = []) {
  return markers
    .map((marker, index) => `${index}:${buildMarkerKey(marker)}`)
    .join("|");
}

function buildVisualSignature(visualConfig, sourceUrl) {
  return [
    String(sourceUrl || ""),
    Number(visualConfig?.sizeMultiplier || 0).toFixed(4),
    visualConfig?.animateDarts ? "animate-on" : "animate-off",
    visualConfig?.hideOriginalMarkers ? "hide-on" : "hide-off",
    visualConfig?.enableShadow ? "shadow-on" : "shadow-off",
    visualConfig?.enableShadowBlur ? "shadow-blur-on" : "shadow-blur-off",
    visualConfig?.enableWobble ? "wobble-on" : "wobble-off",
    visualConfig?.enableFlightBlur ? "flight-blur-on" : "flight-blur-off",
    String(visualConfig?.flightSpeed || ""),
    Number(visualConfig?.flightDurationMs || 0).toFixed(0),
  ].join("|");
}

function canSkipUnchangedReposition({
  state,
  markers,
  layoutSignature,
  markerSnapshotSignature,
  visualSignature,
}) {
  if (!state || state.retryTimer || !state.lastLayoutSignature) {
    return false;
  }

  if (
    state.lastLayoutSignature !== layoutSignature ||
    state.lastMarkerSnapshotSignature !== markerSnapshotSignature ||
    state.lastVisualSignature !== visualSignature
  ) {
    return false;
  }

  if (state.entriesByMarker.size !== markers.length) {
    return false;
  }

  return markers.every((marker) => {
    const entry = state.entriesByMarker.get(marker);
    return (
      entry &&
      marker?.isConnected !== false &&
      entry.lastTargetCenter &&
      entry.lastScreenPointSource === "rect"
    );
  });
}

function applyDartGeometryIfNeeded(entry, options = {}) {
  if (!entry) {
    return false;
  }

  const rotationDeg = getRotationDeg(options.center, options.boardCenter);
  const signature = buildDartGeometrySignature({
    ...options,
    rotationDeg,
  });

  if (entry.lastGeometrySignature === signature) {
    return false;
  }

  setDartGeometry(entry, {
    ...options,
    rotationDeg,
  });
  entry.lastGeometrySignature = signature;
  return true;
}

function triggerFlightAnimation(entry, state, visualConfig, boardCenter, featureDebug, geometryPayload) {
  if (!entry?.container || !entry.center || !visualConfig?.animateDarts) {
    return;
  }

  if (entry.flightAnimation) {
    return;
  }

  const flightGroup = entry.container;
  const offsets = getFlightOffsets(entry.center, boardCenter, entry.dartLength);
  const duration = Math.max(0, Number(visualConfig.flightDurationMs) || 0);
  const flightBlurEnabled = Boolean(visualConfig.enableFlightBlur);
  const flightKeyframes = [
    {
      transform: `translate(${offsets.start.x}px, ${offsets.start.y}px) scale(0.94)`,
      opacity: 0.22,
      ...(flightBlurEnabled ? { filter: "blur(2px)" } : {}),
    },
    {
      transform: `translate(${offsets.mid.x}px, ${offsets.mid.y}px) scale(0.97)`,
      opacity: 0.78,
      ...(flightBlurEnabled ? { filter: "blur(1px)" } : {}),
    },
    {
      transform: "translate(0px, 0px) scale(1)",
      opacity: 1,
      ...(flightBlurEnabled ? { filter: "blur(0px)" } : {}),
    },
  ];

  const startTime = nowMs(state.windowRef);
  entry.flightStartedAt = startTime;
  entry.settleUntil = Math.max(entry.settleUntil || 0, startTime + duration + FLIGHT_SETTLE_BUFFER_MS);

  emitDebug(state, featureDebug, "flight-start", {
    ...geometryPayload,
    fromX: Number(offsets.start.x.toFixed(2)),
    fromY: Number(offsets.start.y.toFixed(2)),
  });

  if (typeof flightGroup.animate !== "function") {
    return;
  }

  const flightAnimation = flightGroup.animate(flightKeyframes, {
    duration,
    easing: FLIGHT_EASING,
    fill: "both",
  });

  entry.flightAnimation = flightAnimation;

  const cleanupFlight = () => {
    if (entry.flightAnimation !== flightAnimation) {
      return;
    }

    entry.flightAnimation = null;
    entry.flightStartedAt = 0;
    cancelFlightTimeout(state, entry.marker);
    clearFlightVisualState(entry);
  };

  flightAnimation.onfinish = () => {
    emitDebug(state, featureDebug, "flight-finish", geometryPayload);
    cleanupFlight();
  };
  flightAnimation.oncancel = cleanupFlight;

  if (
    visualConfig.enableShadow &&
    entry.shadowNode &&
    typeof entry.shadowNode.animate === "function"
  ) {
    const baseOpacity = Number.parseFloat(entry.shadowNode.style.opacity || "0");
    if (baseOpacity > 0 && DART_IMPACT_SHADOW_OPACITY_BOOST > 0) {
      const maxOpacity = Math.min(1, baseOpacity + DART_IMPACT_SHADOW_OPACITY_BOOST);
      const shadowAnimation = entry.shadowNode.animate(
        createDartImpactShadowKeyframes(baseOpacity, maxOpacity),
        createDartImpactShadowOptions(duration)
      );
      entry.shadowImpactAnimation = shadowAnimation;
      const cleanupShadowImpact = () => {
        if (entry.shadowImpactAnimation === shadowAnimation) {
          entry.shadowImpactAnimation = null;
        }
      };
      shadowAnimation.onfinish = cleanupShadowImpact;
      shadowAnimation.oncancel = cleanupShadowImpact;
    }
  }

  if (
    visualConfig.enableWobble &&
    entry.imageNode &&
    typeof entry.imageNode.animate === "function"
  ) {
    const wobbleAnimation = entry.imageNode.animate(
      createDartImpactWobbleKeyframes(),
      createDartImpactWobbleOptions(duration)
    );
    entry.wobbleAnimation = wobbleAnimation;
    const cleanupWobble = () => {
      if (entry.wobbleAnimation !== wobbleAnimation) {
        return;
      }
      entry.wobbleAnimation = null;
      if (entry.imageNode?.style) {
        entry.imageNode.style.transform = "";
      }
    };
    wobbleAnimation.onfinish = cleanupWobble;
    wobbleAnimation.oncancel = cleanupWobble;
  }

  const { setTimeoutRef } = getTimerFns(state.windowRef);
  const handle = setTimeoutRef(() => {
    if (entry.flightAnimation !== flightAnimation) {
      return;
    }

    emitDebugWarn(state, featureDebug, "flight-timeout", geometryPayload);
    if (typeof flightAnimation.cancel === "function") {
      flightAnimation.cancel();
    } else {
      cleanupFlight();
    }
  }, duration + FLIGHT_TIMEOUT_BUFFER_MS);

  state.flightTimeoutByMarker.set(entry.marker, handle);
}

function removeEntry(state, marker) {
  if (!state || !marker) {
    return false;
  }

  const entry = state.entriesByMarker.get(marker);
  if (!entry) {
    return false;
  }

  cancelEntryFlight(state, entry);
  entry.container?.remove?.();
  setMarkerHidden(marker, false, state);
  state.entriesByMarker.delete(marker);
  return true;
}

function clearEntries(state) {
  if (!state) {
    return;
  }

  Array.from(state.entriesByMarker.keys()).forEach((marker) => removeEntry(state, marker));
  state.entriesByMarker.clear();
}

function reorderDarts(state, markersWithEntries = []) {
  const scene = state?.overlaySceneNode;
  if (!scene) {
    return;
  }

  const orderedItems = markersWithEntries
    .slice()
    .sort((left, right) => {
      const deltaY = Number(left.center?.y || 0) - Number(right.center?.y || 0);
      if (Math.abs(deltaY) > 0.001) {
        return deltaY;
      }
      return Number(left.index || 0) - Number(right.index || 0);
    });
  const orderSignature = orderedItems
    .map((item) => `${Number(item.index || 0)}:${Number(item.center?.y || 0).toFixed(2)}`)
    .join("|");

  if (state.lastDepthOrderSignature === orderSignature) {
    return;
  }

  state.lastDepthOrderSignature = orderSignature;
  orderedItems
    .map((item) => item.entry?.container)
    .filter(Boolean)
    .forEach((node) => scene.appendChild(node));
}

function buildBoardSignature(board, boardRect, groupRect) {
  if (!board || !boardRect) {
    return "none";
  }

  return [
    toFiniteNumber(board.radius).toFixed(2),
    toFiniteNumber(boardRect.left).toFixed(1),
    toFiniteNumber(boardRect.top).toFixed(1),
    toFiniteNumber(boardRect.width).toFixed(1),
    toFiniteNumber(boardRect.height).toFixed(1),
    toFiniteNumber(groupRect?.left).toFixed(1),
    toFiniteNumber(groupRect?.top).toFixed(1),
    toFiniteNumber(groupRect?.width).toFixed(1),
    toFiniteNumber(groupRect?.height).toFixed(1),
  ].join("|");
}

function buildOverlaySignature(overlayRect, dartLength) {
  if (!overlayRect) {
    return "none";
  }

  return [
    toFiniteNumber(overlayRect.left).toFixed(1),
    toFiniteNumber(overlayRect.top).toFixed(1),
    toFiniteNumber(overlayRect.width).toFixed(1),
    toFiniteNumber(overlayRect.height).toFixed(1),
    toFiniteNumber(dartLength).toFixed(2),
  ].join("|");
}

function maybeEmitBoardAndOverlayDebug({
  state,
  featureDebug,
  board,
  boardRect,
  groupRect,
  overlayRect,
  dartLength,
  clipPath,
}) {
  const boardSignature = buildBoardSignature(board, boardRect, groupRect);
  if (state.lastBoardSignature !== boardSignature) {
    state.lastBoardSignature = boardSignature;
    emitDebug(state, featureDebug, "board-found", {
      radius: Number(board?.radius || 0),
      svgRect: buildRectPayload(boardRect),
      groupRect: buildRectPayload(groupRect),
    });
  }

  const overlaySignature = buildOverlaySignature(overlayRect, dartLength);
  if (state.lastOverlaySignature !== overlaySignature) {
    state.lastOverlaySignature = overlaySignature;
    emitDebug(state, featureDebug, "overlay-layout", {
      ...buildRectPayload(overlayRect),
      dartLength: toFiniteNumber(dartLength, 0),
      clipPath: String(clipPath || ""),
    });
  }
}

function getRenderedTipScreenPoint(entry) {
  const overlaySvg = entry?.rotateGroup?.ownerSVGElement || entry?.imageNode?.ownerSVGElement;
  const tipPointLocal = entry?.tipPointLocal;
  if (
    overlaySvg &&
    tipPointLocal &&
    typeof overlaySvg.createSVGPoint === "function" &&
    entry?.rotateGroup &&
    typeof entry.rotateGroup.getScreenCTM === "function"
  ) {
    const matrix = entry.rotateGroup.getScreenCTM();
    if (matrix) {
      const point = overlaySvg.createSVGPoint();
      point.x = Number(tipPointLocal.x);
      point.y = Number(tipPointLocal.y);
      const screenPoint = point.matrixTransform(matrix);
      if (Number.isFinite(screenPoint?.x) && Number.isFinite(screenPoint?.y)) {
        return {
          x: Number(screenPoint.x),
          y: Number(screenPoint.y),
        };
      }
    }
  }

  return null;
}

function maybeMeasureRenderError(state, featureDebug, entry, screenPoint, geometryPayload) {
  if (!featureDebug?.enabled || !entry || entry.flightAnimation) {
    return Number.NaN;
  }

  const currentTime = nowMs(state.windowRef);
  if (currentTime < (entry.settleUntil || 0)) {
    return Number.NaN;
  }

  const renderCheckSignature = [
    Number(screenPoint.x).toFixed(2),
    Number(screenPoint.y).toFixed(2),
    Number(entry.rotationDeg || 0).toFixed(2),
  ].join("|");
  if (
    entry.lastRenderCheckSignature === renderCheckSignature &&
    state.updateTick % RENDER_CHECK_HEARTBEAT_TICKS !== 0
  ) {
    return Number.NaN;
  }
  entry.lastRenderCheckSignature = renderCheckSignature;

  const renderedTip = getRenderedTipScreenPoint(entry);
  if (!renderedTip) {
    return Number.NaN;
  }

  const renderErrorPx = Math.hypot(
    Number(renderedTip.x) - Number(screenPoint.x),
    Number(renderedTip.y) - Number(screenPoint.y)
  );

  const signature = [
    Number(screenPoint.x).toFixed(2),
    Number(screenPoint.y).toFixed(2),
    Number(renderErrorPx).toFixed(2),
    Number(entry.rotationDeg || 0).toFixed(2),
  ].join("|");

  if (entry.lastRenderedSignature === signature) {
    return renderErrorPx;
  }

  entry.lastRenderedSignature = signature;

  if (renderErrorPx > RENDER_ERROR_WARN_PX) {
    emitDebugWarn(state, featureDebug, "render-mismatch", {
      ...geometryPayload,
      renderErrorPx: Number(renderErrorPx.toFixed(2)),
    });
  }

  return renderErrorPx;
}

function isBullOffVariant(snapshot = null) {
  const variantCandidates = [
    snapshot?.variantNormalized,
    snapshot?.variant,
    snapshot?.match?.variant,
    snapshot?.match?.game?.variant,
  ];

  return variantCandidates.some((value) => {
    const normalized = String(value || "").trim().toLowerCase();
    return (
      normalized.includes("bull-off") ||
      normalized.includes("bull out") ||
      normalized.includes("bullout") ||
      normalized.includes("bull-out")
    );
  });
}

export function createDartMarkerReplacerState(windowRef = null) {
  return {
    windowRef,
    overlayNode: null,
    overlaySceneNode: null,
    gameStateSnapshot: null,
    boardSnapshot: null,
    markerNodes: [],
    pendingUpdateReasons: new Set(),
    lastGameStateSignature: "",
    entriesByMarker: new Map(),
    markerOpacityByMarker: new Map(),
    flightTimeoutByMarker: new Map(),
    retryTimer: 0,
    lastHref: getCurrentHref(windowRef),
    lastBoardSignature: "",
    lastOverlaySignature: "",
    lastLayoutSignature: "",
    lastMarkerSnapshotSignature: "",
    lastVisualSignature: "",
    lastDepthOrderSignature: "",
    debugSignatures: new Map(),
    debugWarningSignatures: new Map(),
    updateTick: 0,
  };
}

export function clearDartMarkerReplacerState(state, options = {}) {
  if (!state) {
    return;
  }

  clearRetryTimer(state);
  clearFlightTimeouts(state);
  restoreHiddenMarkers(state);
  clearEntries(state);
  clearOverlayChildren(state);
  removeOverlayNode(state);
  state.boardSnapshot = null;
  state.markerNodes = [];
  if (state.pendingUpdateReasons instanceof Set) {
    state.pendingUpdateReasons.clear();
  }
  state.lastGameStateSignature = "";
  state.entriesByMarker.clear();
  state.lastBoardSignature = "";
  state.lastOverlaySignature = "";
  state.lastLayoutSignature = "";
  state.lastMarkerSnapshotSignature = "";
  state.lastVisualSignature = "";
  state.lastDepthOrderSignature = "";

  emitDebug(state, options.featureDebug || null, "cleanup", {
    reason: String(options.reason || "clear"),
  });
}

export function updateDartMarkerReplacer(options = {}) {
  const documentRef = options.documentRef;
  const state = options.state;
  const visualConfig = options.visualConfig;
  const featureDebug = options.featureDebug || null;
  const scheduleUpdate = options.scheduleUpdate;
  const updateMode = options.updateMode || null;

  if (!documentRef || !state || !visualConfig) {
    clearDartMarkerReplacerState(state, {
      featureDebug,
      reason: "invalid-options",
    });
    return;
  }

  state.updateTick += 1;

  const requiresBoardRescan = updateMode?.requiresBoardRescan !== false;
  const requiresMarkerRescan = updateMode?.requiresMarkerRescan !== false;

  const currentHref = getCurrentHref(state.windowRef);
  if (state.lastHref && currentHref && currentHref !== state.lastHref) {
    clearDartMarkerReplacerState(state, {
      featureDebug,
      reason: "location-change",
    });
  }
  state.lastHref = currentHref || state.lastHref;

  if (isLiveBoardInputModeActive(documentRef)) {
    clearDartMarkerReplacerState(state, {
      featureDebug,
      reason: "live-mode",
    });
    return;
  }

  if (isBullOffVariant(state.gameStateSnapshot)) {
    clearDartMarkerReplacerState(state, {
      featureDebug,
      reason: "bull-off",
    });
    return;
  }

  const board = resolveBoardSnapshot(documentRef, state, requiresBoardRescan);
  if (!board?.svg || !board.radius) {
    clearDartMarkerReplacerState(state, {
      featureDebug,
      reason: "board-missing",
    });
    return;
  }

  const boardRect = getNodeRect(board.svg);
  if (!boardRect || !isBoardVisible(board.svg, boardRect)) {
    clearDartMarkerReplacerState(state, {
      featureDebug,
      reason: "board-hidden",
    });
    return;
  }

  const groupRect = getNodeRect(board.group) || boardRect;
  const markers = resolveBoardMarkers(documentRef, state, board, requiresMarkerRescan);
  if (!markers.length) {
    clearDartMarkerReplacerState(state, {
      featureDebug,
      reason: "markers-missing",
    });
    return;
  }

  const overlay = ensureOverlaySvg(state, documentRef);
  const scene = ensureOverlayScene(state, overlay);
  if (!overlay || !scene) {
    clearDartMarkerReplacerState(state, {
      featureDebug,
      reason: "overlay-missing",
    });
    return;
  }
  ensureShadowFilter(overlay, visualConfig.enableShadow, visualConfig.enableShadowBlur);

  const scale = getSvgScale(board.svg);
  const radiusPx = Math.max(1, Number(board.radius) * Math.max(1, scale));
  const dartLength = Math.max(18, radiusPx * 0.416 * visualConfig.sizeMultiplier);
  const dartHeight = dartLength / DART_ASPECT_RATIO;
  const dartImageSource = resolveDartDesignAsset(visualConfig.designKey);
  const paddingPx = getOverlayPadding(dartLength, visualConfig);
  const overlayRect = updateOverlayLayout(overlay, boardRect, paddingPx);
  const clipViewportRect = getNodeRect(resolveClipViewportNode(board.svg));
  const clipPath = applyOverlayViewportClip(overlay, overlayRect, clipViewportRect);
  const boardCenter = {
    x: boardRect.left + boardRect.width / 2 - overlayRect.left,
    y: boardRect.top + boardRect.height / 2 - overlayRect.top,
  };

  maybeEmitBoardAndOverlayDebug({
    state,
    featureDebug,
    board,
    boardRect,
    groupRect,
    overlayRect,
    dartLength,
    clipPath,
  });

  const layoutSignature = [
    buildRectSignature(boardRect),
    buildRectSignature(groupRect),
    buildRectSignature(overlayRect),
    buildRectSignature(clipViewportRect),
    String(clipPath || ""),
    Number(scale || 0).toFixed(4),
    Number(dartLength || 0).toFixed(2),
    Number(dartHeight || 0).toFixed(2),
  ].join("|");
  const markerSnapshotSignature = buildMarkerSnapshotSignature(markers);
  const visualSignature = buildVisualSignature(visualConfig, dartImageSource);

  if (
    !requiresBoardRescan &&
    !requiresMarkerRescan &&
    canSkipUnchangedReposition({
      state,
      markers,
      layoutSignature,
      markerSnapshotSignature,
      visualSignature,
    })
  ) {
    emitDebug(
      state,
      featureDebug,
      "marker-scan",
      {
        markerCount: markers.length,
        dartCount: state.entriesByMarker.size,
        added: 0,
        updated: 0,
        removed: 0,
        unresolved: 0,
        hiddenMarkerCount: visualConfig.hideOriginalMarkers ? markers.length : 0,
        retryScheduled: false,
        maxRenderErrorPx: 0,
        skipped: true,
      },
      { heartbeat: true }
    );
    return;
  }

  const markerSet = new Set(markers);
  let removed = 0;
  Array.from(state.entriesByMarker.keys()).forEach((marker) => {
    if (markerSet.has(marker) && marker.isConnected) {
      return;
    }
    if (removeEntry(state, marker)) {
      removed += 1;
      emitDebug(state, featureDebug, "dart-remove", {
        markerKey: buildMarkerKey(marker),
      });
    }
  });

  let added = 0;
  let updated = 0;
  let unresolved = 0;
  let hiddenMarkerCount = 0;
  let maxRenderErrorPx = 0;

  const markersWithEntries = [];

  markers.forEach((marker, index) => {
    const screenPoint = getMarkerScreenPoint(marker);
    if (!screenPoint) {
      unresolved += 1;
      emitDebugWarn(state, featureDebug, "marker-unresolved", {
        markerKey: buildMarkerKey(marker),
        index,
      });
      return;
    }

    const center = {
      x: Number(screenPoint.x) - Number(overlayRect.left),
      y: Number(screenPoint.y) - Number(overlayRect.top),
    };

    let entry = state.entriesByMarker.get(marker);
    const isNew = !entry;

    if (!entry) {
      entry = createDartEntry(scene.ownerDocument);
      scene.appendChild(entry.container);
      state.entriesByMarker.set(marker, entry);
      added += 1;
      emitDebug(state, featureDebug, "dart-add", {
        markerKey: buildMarkerKey(marker),
        index,
      });
    } else {
      updated += 1;
      emitDebug(state, featureDebug, "dart-update", {
        markerKey: buildMarkerKey(marker),
      });
    }

    entry.marker = marker;
    const appliedGeometry = applyDartGeometryIfNeeded(entry, {
      center,
      boardCenter,
      dartLength,
      dartHeight,
      sourceUrl: dartImageSource,
      visualConfig,
    });
    entry.lastTargetCenter = {
      x: Number(screenPoint.x),
      y: Number(screenPoint.y),
    };
    entry.lastScreenPointSource = String(screenPoint.source || "");

    const geometryPayload = buildGeometryPayload({
      marker,
      index,
      screenPoint,
      overlayRect,
      svgRect: boardRect,
      groupRect,
      entry,
    });
    if (appliedGeometry) {
      emitDebug(state, featureDebug, "geometry-apply", geometryPayload);
    }

    if (isNew) {
      triggerFlightAnimation(
        entry,
        state,
        visualConfig,
        boardCenter,
        featureDebug,
        geometryPayload
      );
    }

    const renderErrorPx = maybeMeasureRenderError(
      state,
      featureDebug,
      entry,
      screenPoint,
      geometryPayload
    );
    if (Number.isFinite(renderErrorPx)) {
      maxRenderErrorPx = Math.max(maxRenderErrorPx, renderErrorPx);
    }

    setMarkerHidden(marker, visualConfig.hideOriginalMarkers, state);
    if (visualConfig.hideOriginalMarkers) {
      hiddenMarkerCount += 1;
    }

    markersWithEntries.push({
      entry,
      center,
      index,
    });
  });

  reorderDarts(state, markersWithEntries);

  if (!visualConfig.hideOriginalMarkers) {
    markers.forEach((marker) => setMarkerHidden(marker, false, state));
  }

  let retryScheduled = false;
  if (unresolved > 0) {
    retryScheduled = scheduleRetry(state, scheduleUpdate, RETRY_DELAY_MS);
  } else {
    clearRetryTimer(state);
  }

  state.lastLayoutSignature = layoutSignature;
  state.lastMarkerSnapshotSignature = markerSnapshotSignature;
  state.lastVisualSignature = visualSignature;

  emitDebug(
    state,
    featureDebug,
    "marker-scan",
    {
      markerCount: markers.length,
      dartCount: state.entriesByMarker.size,
      added,
      updated,
      removed,
      unresolved,
      hiddenMarkerCount,
      retryScheduled,
      maxRenderErrorPx: Number(maxRenderErrorPx.toFixed(2)),
    },
    { heartbeat: true }
  );
}
