
import { findBoardSvgGroup } from "../../shared/dartboard-svg.js";
import { buildMarkerKey, collectBoardMarkers, readMarkerPosition } from "../../shared/dartboard-markers.js";
import { resolveDartDesignAsset } from "#feature-assets";
import { DART_CLASS, DART_NEW_CLASS, OVERLAY_ID, OVERLAY_SCENE_ID } from "./style.js";

const SVG_NS = "http://www.w3.org/2000/svg";
const XLINK_NS = "http://www.w3.org/1999/xlink";
const MARKER_OPACITY_DATA_KEY = "adExtOriginalOpacity";
const DART_ASPECT_RATIO = 472 / 198;
const TIP_OFFSET_X_RATIO = 0;
const TIP_OFFSET_Y_RATIO = 130 / 198;
const MAX_MARKER_RECT_SIZE = 96;
const TIP_ERROR_WARN_PX = 8;
const MARKER_SCAN_HEARTBEAT_TICKS = 30;
const RETRY_DELAY_MS = 90;

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

function toFiniteNumber(value, fallbackValue = 0) {
  return Number.isFinite(value) ? Number(value) : Number(fallbackValue);
}

function getCurrentHref(windowRef) {
  if (!windowRef || !windowRef.location) {
    return "";
  }
  return String(windowRef.location.href || "").trim();
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
    boardSvg.ownerDocument?.defaultView && typeof boardSvg.ownerDocument.defaultView.getComputedStyle === "function"
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

  return {
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
  };
}

function createDartImageNode(ownerDocument) {
  const imageNode = ownerDocument.createElementNS(SVG_NS, "image");
  imageNode.classList.add(DART_CLASS);
  imageNode.setAttribute("preserveAspectRatio", "xMidYMid meet");
  imageNode.setAttribute("aria-hidden", "true");
  return imageNode;
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
    const rect = marker.getBoundingClientRect();
    if (
      Number.isFinite(rect?.width) &&
      Number.isFinite(rect?.height) &&
      Number.isFinite(rect?.left) &&
      Number.isFinite(rect?.top) &&
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

function setDartGeometry(entry, options = {}) {
  const imageNode = entry?.imageNode;
  if (!imageNode) {
    return;
  }

  const center = options.center;
  const boardCenter = options.boardCenter;
  const dartLength = options.dartLength;
  const dartHeight = options.dartHeight;

  const offsetX = dartLength * TIP_OFFSET_X_RATIO;
  const offsetY = dartHeight * TIP_OFFSET_Y_RATIO;
  const x = center.x - offsetX;
  const y = center.y - offsetY;

  imageNode.setAttribute("width", String(dartLength));
  imageNode.setAttribute("height", String(dartHeight));
  imageNode.setAttribute("x", String(x));
  imageNode.setAttribute("y", String(y));

  const angleToCenter =
    (Math.atan2(boardCenter.y - center.y, boardCenter.x - center.x) * 180) / Math.PI;
  const rotation = angleToCenter - 180;
  imageNode.setAttribute("transform", `rotate(${rotation} ${center.x} ${center.y})`);

  entry.center = center;
  entry.tipPoint = {
    x: x + offsetX,
    y: y + offsetY,
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

function triggerFlightAnimation(entry, state, visualConfig, boardCenter) {
  if (!entry?.imageNode || !entry.center || !visualConfig?.animateDarts) {
    return;
  }

  const imageNode = entry.imageNode;
  cancelFlightTimeout(state, entry.marker);

  const dx = entry.center.x - boardCenter.x;
  const dy = entry.center.y - boardCenter.y;
  const distance = Math.max(1, Math.hypot(dx, dy));
  const travel = Math.max(18, (entry.dartLength || 0) * 1.2);
  const fromX = (dx / distance) * travel;
  const fromY = (dy / distance) * travel;

  imageNode.style.setProperty("--ad-ext-dart-from-x", `${fromX.toFixed(1)}px`);
  imageNode.style.setProperty("--ad-ext-dart-from-y", `${fromY.toFixed(1)}px`);
  imageNode.style.setProperty(
    "--ad-ext-dart-flight-ms",
    `${visualConfig.flightDurationMs}ms`
  );

  imageNode.classList.remove(DART_NEW_CLASS);
  void imageNode.getAttribute("x");
  imageNode.classList.add(DART_NEW_CLASS);

  const { setTimeoutRef } = getTimerFns(state.windowRef);
  const handle = setTimeoutRef(() => {
    state.flightTimeoutByMarker.delete(entry.marker);
    imageNode.classList.remove(DART_NEW_CLASS);
  }, visualConfig.flightDurationMs + 120);

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

  cancelFlightTimeout(state, marker);
  entry.imageNode?.remove?.();
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
    .map((item) => item.entry?.imageNode)
    .filter(Boolean);
}

function reorderDarts(state, markersWithEntries = []) {
  const scene = state?.overlaySceneNode;
  if (!scene) {
    return;
  }
  collectDartNodesByDepth(markersWithEntries).forEach((node) => scene.appendChild(node));
}

function buildBoardSignature(board, boardRect) {
  if (!board || !boardRect) {
    return "none";
  }
  return [
    toFiniteNumber(board.radius).toFixed(2),
    toFiniteNumber(boardRect.left).toFixed(1),
    toFiniteNumber(boardRect.top).toFixed(1),
    toFiniteNumber(boardRect.width).toFixed(1),
    toFiniteNumber(boardRect.height).toFixed(1),
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

function maybeEmitBoardAndOverlayDebug(state, featureDebug, board, boardRect, overlayRect, dartLength) {
  const boardSignature = buildBoardSignature(board, boardRect);
  if (state.lastBoardSignature !== boardSignature) {
    state.lastBoardSignature = boardSignature;
    emitDebug(state, featureDebug, "board-found", {
      radius: Number(board?.radius || 0),
      rect: {
        left: toFiniteNumber(boardRect?.left, 0),
        top: toFiniteNumber(boardRect?.top, 0),
        width: toFiniteNumber(boardRect?.width, 0),
        height: toFiniteNumber(boardRect?.height, 0),
      },
    });
  }

  const overlaySignature = buildOverlaySignature(overlayRect, dartLength);
  if (state.lastOverlaySignature !== overlaySignature) {
    state.lastOverlaySignature = overlaySignature;
    emitDebug(state, featureDebug, "overlay-layout", {
      left: toFiniteNumber(overlayRect?.left, 0),
      top: toFiniteNumber(overlayRect?.top, 0),
      width: toFiniteNumber(overlayRect?.width, 0),
      height: toFiniteNumber(overlayRect?.height, 0),
      dartLength: toFiniteNumber(dartLength, 0),
    });
  }
}

function getTipErrorPx(entry, center) {
  if (!entry || !center || !entry.tipPoint) {
    return Number.NaN;
  }
  const dx = Number(entry.tipPoint.x) - Number(center.x);
  const dy = Number(entry.tipPoint.y) - Number(center.y);
  return Math.hypot(dx, dy);
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

  const boardRect = board.svg.getBoundingClientRect();
  if (!isBoardVisible(board.svg, boardRect)) {
    clearDartMarkerDartsState(state, {
      featureDebug,
      reason: "board-hidden",
    });
    return;
  }

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

  const scale = getSvgScale(board.svg);
  const radiusPx = Math.max(1, Number(board.radius) * Math.max(1, scale));
  const dartLength = Math.max(18, radiusPx * 0.416 * visualConfig.sizeMultiplier);
  const dartHeight = dartLength / DART_ASPECT_RATIO;
  const dartImageSource = resolveDartDesignAsset(visualConfig.designKey);
  const paddingPx = getOverlayPadding(dartLength, visualConfig);
  const overlayRect = updateOverlayLayout(overlay, boardRect, paddingPx);
  const boardCenter = {
    x: Number(boardRect.width) / 2 + paddingPx,
    y: Number(boardRect.height) / 2 + paddingPx,
  };

  maybeEmitBoardAndOverlayDebug(
    state,
    featureDebug,
    board,
    boardRect,
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
  let maxTipErrorPx = 0;

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
      const imageNode = createDartImageNode(scene.ownerDocument);
      scene.appendChild(imageNode);
      entry = {
        marker,
        imageNode,
        dartLength,
        center,
        tipPoint: null,
      };
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
    entry.dartLength = dartLength;

    setImageSource(entry.imageNode, dartImageSource);
    setDartGeometry(entry, {
      center,
      boardCenter,
      dartLength,
      dartHeight,
    });

    const tipErrorPx = getTipErrorPx(entry, center);
    if (Number.isFinite(tipErrorPx)) {
      maxTipErrorPx = Math.max(maxTipErrorPx, tipErrorPx);
      if (tipErrorPx > TIP_ERROR_WARN_PX) {
        emitDebugWarn(state, featureDebug, "tip-error", {
          markerKey: buildMarkerKey(marker),
          tipErrorPx: Number(tipErrorPx.toFixed(2)),
        });
      }
    }

    if (isNew) {
      triggerFlightAnimation(entry, state, visualConfig, boardCenter);
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
      maxTipErrorPx: Number(maxTipErrorPx.toFixed(2)),
    },
    { heartbeat: true }
  );
}
