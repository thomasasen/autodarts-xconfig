import { findBoardSvgGroup } from "../../shared/dartboard-svg.js";
import {
  buildMarkerKey,
  collectBoardMarkers,
  readMarkerPosition,
} from "../../shared/dartboard-markers.js";
import { resolveDartDesignAsset } from "#feature-assets";
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
const DART_ASPECT_RATIO = 472 / 198;
const TIP_OFFSET_X_RATIO = 0;
const TIP_OFFSET_Y_RATIO = 130 / 198;
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
const SHADOW_IMPACT_OPACITY_BOOST = 0.12;
const SHADOW_IMPACT_DURATION_MS = 160;
const WOBBLE_DURATION_MS = 280;
const WOBBLE_ANGLE_DEG = 4;
const IMPACT_EASING = "cubic-bezier(0.2, 0.6, 0.2, 1)";

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
  if (!windowRef || !windowRef.location) {
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
  if (overlay && overlay.isConnected) {
    if (String(overlay.tagName || "").toLowerCase() === "svg") {
      return overlay;
    }
    overlay = null;
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

function ensureShadowFilter(overlay, enabled) {
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
      colorMatrix.setAttribute("type", "matrix");
      colorMatrix.setAttribute("in", "SourceGraphic");
      colorMatrix.setAttribute("result", "shadowColor");
      colorMatrix.setAttribute(
        "values",
        "0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0"
      );
      filter.appendChild(colorMatrix);
    }

    const blur = overlay.ownerDocument?.createElementNS?.(SVG_NS, "feGaussianBlur") || null;
    if (blur) {
      blur.setAttribute("in", "shadowColor");
      blur.setAttribute("result", "shadowBlur");
      blur.setAttribute("stdDeviation", String(SHADOW_BLUR_PX));
      filter.appendChild(blur);
    }

    defs.appendChild(filter);
  }

  const blurNode = filter.querySelector("feGaussianBlur");
  if (blurNode) {
    blurNode.setAttribute("stdDeviation", String(SHADOW_BLUR_PX));
  }

  return filter;
}

function clearOverlayChildren(state) {
  if (!state?.overlaySceneNode) {
    return;
  }

  while (state.overlaySceneNode.firstChild) {
    state.overlaySceneNode.removeChild(state.overlaySceneNode.firstChild);
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

  overlay.style.left = `${left}px`;
  overlay.style.top = `${top}px`;
  overlay.style.width = `${width}px`;
  overlay.style.height = `${height}px`;
  overlay.setAttribute("width", String(width));
  overlay.setAttribute("height", String(height));
  overlay.setAttribute("viewBox", `0 0 ${width} ${height}`);

  return (
    normalizeRect(overlay.getBoundingClientRect?.()) || {
      left,
      top,
      width,
      height,
      right: left + width,
      bottom: top + height,
    }
  );
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
    lastRenderedSignature: "",
  };
}

function setImageSource(imageNode, sourceUrl) {
  imageNode.setAttribute("href", sourceUrl);
  if (typeof imageNode.setAttributeNS === "function") {
    imageNode.setAttributeNS(XLINK_NS, "href", sourceUrl);
  }
}

function setMarkerHidden(marker, shouldHide, state) {
  if (!marker || !marker.style || !state) {
    return;
  }

  if (shouldHide) {
    if (!state.markerOpacityByMarker.has(marker)) {
      state.markerOpacityByMarker.set(marker, marker.style.opacity || "");
    }
    marker.dataset[MARKER_OPACITY_DATA_KEY] = marker.style.opacity || "";
    marker.style.opacity = "0";
    return;
  }

  if (state.markerOpacityByMarker.has(marker)) {
    marker.style.opacity = state.markerOpacityByMarker.get(marker);
    state.markerOpacityByMarker.delete(marker);
  }

  if (
    marker.dataset &&
    Object.prototype.hasOwnProperty.call(marker.dataset, MARKER_OPACITY_DATA_KEY)
  ) {
    delete marker.dataset[MARKER_OPACITY_DATA_KEY];
  }
}

function restoreHiddenMarkers(state) {
  if (!state) {
    return;
  }

  state.markerOpacityByMarker.forEach((opacity, marker) => {
    if (!marker || !marker.style) {
      return;
    }

    marker.style.opacity = opacity;
    if (
      marker.dataset &&
      Object.prototype.hasOwnProperty.call(marker.dataset, MARKER_OPACITY_DATA_KEY)
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
  const rotationDeg = getRotationDeg(center, boardCenter);
  const dartOpacity = DART_OPACITY;
  const shadowSettings = getShadowSettings(dartLength, dartOpacity, visualConfig);

  if (sourceUrl) {
    setImageSource(imageNode, sourceUrl);
    if (shadowNode) {
      setImageSource(shadowNode, sourceUrl);
    }
  }

  imageNode.setAttribute("width", String(dartLength));
  imageNode.setAttribute("height", String(dartHeight));
  imageNode.setAttribute("x", String(x));
  imageNode.setAttribute("y", String(y));
  imageNode.removeAttribute("transform");
  imageNode.style.opacity = String(dartOpacity);

  if (dartLength > 0 && dartHeight > 0) {
    const originX = Math.min(100, Math.max(0, (offsets.offsetX / dartLength) * 100));
    const originY = Math.min(100, Math.max(0, (offsets.offsetY / dartHeight) * 100));
    const origin = `${originX}% ${originY}%`;
    imageNode.style.transformOrigin = origin;
    if (shadowNode) {
      shadowNode.style.transformOrigin = origin;
    }
  } else {
    imageNode.style.transformOrigin = "";
    if (shadowNode) {
      shadowNode.style.transformOrigin = "";
    }
  }

  if (shadowNode) {
    shadowNode.setAttribute("width", String(dartLength));
    shadowNode.setAttribute("height", String(dartHeight));
    shadowNode.setAttribute("x", String(x));
    shadowNode.setAttribute("y", String(y));
    shadowNode.style.opacity = shadowSettings.enabled ? String(shadowSettings.baseOpacity) : "0";
    shadowNode.style.display = shadowSettings.enabled ? "" : "none";
    shadowNode.style.filter = "";
    shadowNode.setAttribute("filter", shadowSettings.enabled ? `url(#${SHADOW_FILTER_ID})` : "");

    if (shadowSettings.enabled) {
      const tipRatioX = TIP_OFFSET_X_RATIO;
      const tailLength = Math.max(1, dartLength * Math.max(0.05, Math.abs(1 - tipRatioX)));
      const theta = (rotationDeg * Math.PI) / 180;
      const localX = shadowSettings.offsetX * Math.cos(theta) + shadowSettings.offsetY * Math.sin(theta);
      const localY = -shadowSettings.offsetX * Math.sin(theta) + shadowSettings.offsetY * Math.cos(theta);
      const scaleX = Math.max(0.2, 1 + localX / tailLength);
      const skewYDeg = (Math.atan2(localY, tailLength) * 180) / Math.PI;
      shadowNode.style.transform = `scale(${scaleX}, 1) skewY(${skewYDeg}deg)`;
    } else {
      shadowNode.style.transform = "";
    }
  }

  rotateGroup.setAttribute("transform", `rotate(${rotationDeg} ${center.x} ${center.y})`);

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

function buildGeometryPayload(marker, index, screenPoint, overlayRect, svgRect, groupRect, entry, extra = {}) {
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
  const flightKeyframes = [
    {
      transform: `translate(${offsets.start.x}px, ${offsets.start.y}px) scale(0.94)`,
      opacity: 0.22,
      filter: "blur(2px)",
    },
    {
      transform: `translate(${offsets.mid.x}px, ${offsets.mid.y}px) scale(0.97)`,
      opacity: 0.78,
      filter: "blur(1px)",
    },
    {
      transform: "translate(0px, 0px) scale(1)",
      opacity: 1,
      filter: "blur(0px)",
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
    if (baseOpacity > 0 && SHADOW_IMPACT_DURATION_MS > 0 && SHADOW_IMPACT_OPACITY_BOOST > 0) {
      const maxOpacity = Math.min(1, baseOpacity + SHADOW_IMPACT_OPACITY_BOOST);
      const shadowAnimation = entry.shadowNode.animate(
        [{ opacity: baseOpacity }, { opacity: maxOpacity }, { opacity: baseOpacity }],
        {
          duration: SHADOW_IMPACT_DURATION_MS,
          delay: duration,
          easing: IMPACT_EASING,
        }
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
    typeof entry.imageNode.animate === "function" &&
    WOBBLE_DURATION_MS > 0 &&
    WOBBLE_ANGLE_DEG > 0
  ) {
    const wobbleAnimation = entry.imageNode.animate(
      [
        { transform: "rotate(0deg)" },
        { transform: `rotate(${-WOBBLE_ANGLE_DEG}deg)` },
        { transform: `rotate(${WOBBLE_ANGLE_DEG * 0.6}deg)` },
        { transform: `rotate(${-WOBBLE_ANGLE_DEG * 0.35}deg)` },
        { transform: "rotate(0deg)" },
      ],
      {
        duration: WOBBLE_DURATION_MS,
        delay: duration,
        easing: IMPACT_EASING,
        fill: "both",
      }
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

function collectDartNodesByDepth(markersWithEntries = []) {
  return markersWithEntries
    .slice()
    .sort((left, right) => {
      const deltaY = Number(left.center?.y || 0) - Number(right.center?.y || 0);
      if (Math.abs(deltaY) > 0.001) {
        return deltaY;
      }
      return Number(left.index || 0) - Number(right.index || 0);
    })
    .map((item) => item.entry?.container)
    .filter(Boolean);
}

function reorderDarts(state, markersWithEntries = []) {
  const scene = state?.overlaySceneNode;
  if (!scene) {
    return;
  }

  collectDartNodesByDepth(markersWithEntries).forEach((node) => scene.appendChild(node));
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

function maybeEmitBoardAndOverlayDebug(
  state,
  featureDebug,
  board,
  boardRect,
  groupRect,
  overlayRect,
  dartLength
) {
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
  if (!entry || entry.flightAnimation) {
    return Number.NaN;
  }

  const currentTime = nowMs(state.windowRef);
  if (currentTime < (entry.settleUntil || 0)) {
    return Number.NaN;
  }

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

export function createDartMarkerDartsState(windowRef = null) {
  return {
    windowRef,
    overlayNode: null,
    overlaySceneNode: null,
    entriesByMarker: new Map(),
    markerOpacityByMarker: new Map(),
    flightTimeoutByMarker: new Map(),
    retryTimer: 0,
    lastHref: getCurrentHref(windowRef),
    lastBoardSignature: "",
    lastOverlaySignature: "",
    debugSignatures: new Map(),
    debugWarningSignatures: new Map(),
    updateTick: 0,
  };
}

export function clearDartMarkerDartsState(state, options = {}) {
  if (!state) {
    return;
  }

  clearRetryTimer(state);
  clearFlightTimeouts(state);
  restoreHiddenMarkers(state);
  clearEntries(state);
  clearOverlayChildren(state);
  removeOverlayNode(state);
  state.entriesByMarker.clear();
  state.lastBoardSignature = "";
  state.lastOverlaySignature = "";

  emitDebug(state, options.featureDebug || null, "cleanup", {
    reason: String(options.reason || "clear"),
  });
}

export function updateDartMarkerDarts(options = {}) {
  const documentRef = options.documentRef;
  const state = options.state;
  const visualConfig = options.visualConfig;
  const featureDebug = options.featureDebug || null;
  const scheduleUpdate = options.scheduleUpdate;

  if (!documentRef || !state || !visualConfig) {
    clearDartMarkerDartsState(state, {
      featureDebug,
      reason: "invalid-options",
    });
    return;
  }

  state.updateTick += 1;

  const currentHref = getCurrentHref(state.windowRef);
  if (state.lastHref && currentHref && currentHref !== state.lastHref) {
    clearDartMarkerDartsState(state, {
      featureDebug,
      reason: "location-change",
    });
  }
  state.lastHref = currentHref || state.lastHref;

  const board = findBoardSvgGroup(documentRef);
  if (!board?.svg || !board.radius) {
    clearDartMarkerDartsState(state, {
      featureDebug,
      reason: "board-missing",
    });
    return;
  }

  const boardRect = getNodeRect(board.svg);
  if (!boardRect || !isBoardVisible(board.svg, boardRect)) {
    clearDartMarkerDartsState(state, {
      featureDebug,
      reason: "board-hidden",
    });
    return;
  }

  const groupRect = getNodeRect(board.group) || boardRect;
  const markers = collectBoardMarkers(documentRef, { board });
  if (!markers.length) {
    clearDartMarkerDartsState(state, {
      featureDebug,
      reason: "markers-missing",
    });
    return;
  }

  const overlay = ensureOverlaySvg(state, documentRef);
  const scene = ensureOverlayScene(state, overlay);
  if (!overlay || !scene) {
    clearDartMarkerDartsState(state, {
      featureDebug,
      reason: "overlay-missing",
    });
    return;
  }
  ensureShadowFilter(overlay, visualConfig.enableShadow);

  const scale = getSvgScale(board.svg);
  const radiusPx = Math.max(1, Number(board.radius) * Math.max(1, scale));
  const dartLength = Math.max(18, radiusPx * 0.416 * visualConfig.sizeMultiplier);
  const dartHeight = dartLength / DART_ASPECT_RATIO;
  const dartImageSource = resolveDartDesignAsset(visualConfig.designKey);
  const paddingPx = getOverlayPadding(dartLength, visualConfig);
  const overlayRect = updateOverlayLayout(overlay, boardRect, paddingPx);
  const boardCenter = {
    x: boardRect.left + boardRect.width / 2 - overlayRect.left,
    y: boardRect.top + boardRect.height / 2 - overlayRect.top,
  };

  maybeEmitBoardAndOverlayDebug(
    state,
    featureDebug,
    board,
    boardRect,
    groupRect,
    overlayRect,
    dartLength
  );

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
    entry.lastTargetCenter = {
      x: Number(screenPoint.x),
      y: Number(screenPoint.y),
    };

    setDartGeometry(entry, {
      center,
      boardCenter,
      dartLength,
      dartHeight,
      sourceUrl: dartImageSource,
      visualConfig,
    });

    const geometryPayload = buildGeometryPayload(
      marker,
      index,
      screenPoint,
      overlayRect,
      boardRect,
      groupRect,
      entry
    );
    emitDebug(state, featureDebug, "geometry-apply", geometryPayload);

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
