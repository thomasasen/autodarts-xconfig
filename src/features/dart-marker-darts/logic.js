import { findBoardSvgGroup } from "../../shared/dartboard-svg.js";
import {
  buildMarkerKey,
  collectBoardMarkers,
  readMarkerPosition,
} from "../../shared/dartboard-markers.js";
import { resolveDartDesignAsset } from "#feature-assets";
import { DART_CLASS, DART_NEW_CLASS, OVERLAY_ID } from "./style.js";

const SVG_NS = "http://www.w3.org/2000/svg";
const XLINK_NS = "http://www.w3.org/1999/xlink";
const MARKER_OPACITY_DATA_KEY = "adExtOriginalOpacity";
const DART_ASPECT_RATIO = 472 / 198;
const TIP_OFFSET_X_RATIO = 0;
const TIP_OFFSET_Y_RATIO = 130 / 198;

function ensureOverlay(boardGroup) {
  if (!boardGroup || typeof boardGroup.querySelector !== "function") {
    return null;
  }

  let overlay = boardGroup.querySelector(`#${OVERLAY_ID}`);
  if (overlay) {
    return overlay;
  }

  const ownerDocument = boardGroup.ownerDocument;
  if (!ownerDocument || typeof ownerDocument.createElementNS !== "function") {
    return null;
  }

  overlay = ownerDocument.createElementNS(SVG_NS, "g");
  overlay.id = OVERLAY_ID;
  overlay.setAttribute("aria-hidden", "true");
  boardGroup.appendChild(overlay);
  return overlay;
}

function getBoardCenter(board) {
  const circles = Array.from(board?.group?.querySelectorAll?.("circle") || []);
  const largestCircle = circles.reduce((best, candidate) => {
    const radius = Number.parseFloat(candidate?.getAttribute?.("r"));
    if (!Number.isFinite(radius)) {
      return best;
    }
    if (!best || radius > best.radius) {
      return {
        radius,
        cx: Number.parseFloat(candidate?.getAttribute?.("cx")) || 0,
        cy: Number.parseFloat(candidate?.getAttribute?.("cy")) || 0,
      };
    }
    return best;
  }, null);

  return {
    x: largestCircle ? largestCircle.cx : 0,
    y: largestCircle ? largestCircle.cy : 0,
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
  imageNode.setAttributeNS(XLINK_NS, "href", sourceUrl);
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

  if (marker.dataset && Object.prototype.hasOwnProperty.call(marker.dataset, MARKER_OPACITY_DATA_KEY)) {
    delete marker.dataset[MARKER_OPACITY_DATA_KEY];
  }
}

function setDartGeometry(entry, options = {}) {
  const imageNode = entry?.imageNode;
  if (!imageNode) {
    return;
  }

  const markerPosition = options.markerPosition;
  const boardCenter = options.boardCenter;
  const dartLength = options.dartLength;
  const dartHeight = options.dartHeight;

  const offsetX = dartLength * TIP_OFFSET_X_RATIO;
  const offsetY = dartHeight * TIP_OFFSET_Y_RATIO;
  const x = markerPosition.cx - offsetX;
  const y = markerPosition.cy - offsetY;

  imageNode.setAttribute("width", String(dartLength));
  imageNode.setAttribute("height", String(dartHeight));
  imageNode.setAttribute("x", String(x));
  imageNode.setAttribute("y", String(y));

  const angleToCenter = (Math.atan2(boardCenter.y - markerPosition.cy, boardCenter.x - markerPosition.cx) * 180) / Math.PI;
  const rotation = angleToCenter - 180;
  imageNode.setAttribute(
    "transform",
    `rotate(${rotation} ${markerPosition.cx} ${markerPosition.cy})`
  );
}

function triggerFlightAnimation(entry, state, visualConfig, boardCenter, markerPosition) {
  if (!entry?.imageNode || !visualConfig.animateDarts) {
    return;
  }

  const imageNode = entry.imageNode;
  const clearTimeoutRef =
    state.windowRef && typeof state.windowRef.clearTimeout === "function"
      ? state.windowRef.clearTimeout.bind(state.windowRef)
      : clearTimeout;
  const setTimeoutRef =
    state.windowRef && typeof state.windowRef.setTimeout === "function"
      ? state.windowRef.setTimeout.bind(state.windowRef)
      : setTimeout;

  const existingHandle = state.flightTimeoutByKey.get(entry.markerKey);
  if (existingHandle) {
    clearTimeoutRef(existingHandle);
    state.flightTimeoutByKey.delete(entry.markerKey);
  }

  const dx = markerPosition.cx - boardCenter.x;
  const dy = markerPosition.cy - boardCenter.y;
  const distance = Math.max(1, Math.hypot(dx, dy));
  const travel = Math.max(18, (entry.dartLength || 0) * 1.2);
  const fromX = (dx / distance) * travel;
  const fromY = (dy / distance) * travel;

  imageNode.style.setProperty("--ad-ext-dart-from-x", `${fromX.toFixed(1)}px`);
  imageNode.style.setProperty("--ad-ext-dart-from-y", `${fromY.toFixed(1)}px`);
  imageNode.style.setProperty("--ad-ext-dart-flight-ms", `${visualConfig.flightDurationMs}ms`);

  imageNode.classList.remove(DART_NEW_CLASS);
  void imageNode.getAttribute("x");
  imageNode.classList.add(DART_NEW_CLASS);

  const handle = setTimeoutRef(() => {
    state.flightTimeoutByKey.delete(entry.markerKey);
    imageNode.classList.remove(DART_NEW_CLASS);
  }, visualConfig.flightDurationMs + 120);

  state.flightTimeoutByKey.set(entry.markerKey, handle);
}

export function createDartMarkerDartsState(windowRef = null) {
  return {
    windowRef,
    overlayNode: null,
    entriesByKey: new Map(),
    markerOpacityByMarker: new Map(),
    flightTimeoutByKey: new Map(),
  };
}

function clearOverlay(state) {
  if (!state?.overlayNode) {
    return;
  }
  if (state.overlayNode.parentNode && typeof state.overlayNode.parentNode.removeChild === "function") {
    state.overlayNode.parentNode.removeChild(state.overlayNode);
  }
  state.overlayNode = null;
}

function clearFlightTimeouts(state) {
  if (!state) {
    return;
  }

  const clearTimeoutRef =
    state.windowRef && typeof state.windowRef.clearTimeout === "function"
      ? state.windowRef.clearTimeout.bind(state.windowRef)
      : clearTimeout;

  state.flightTimeoutByKey.forEach((handle) => clearTimeoutRef(handle));
  state.flightTimeoutByKey.clear();
}

function restoreHiddenMarkers(state) {
  state.markerOpacityByMarker.forEach((opacity, marker) => {
    if (!marker || !marker.style) {
      return;
    }
    marker.style.opacity = opacity;
    if (marker.dataset && Object.prototype.hasOwnProperty.call(marker.dataset, MARKER_OPACITY_DATA_KEY)) {
      delete marker.dataset[MARKER_OPACITY_DATA_KEY];
    }
  });
  state.markerOpacityByMarker.clear();
}

export function clearDartMarkerDartsState(state) {
  if (!state) {
    return;
  }

  clearFlightTimeouts(state);
  restoreHiddenMarkers(state);
  clearOverlay(state);
  state.entriesByKey.clear();
}

export function updateDartMarkerDarts(options = {}) {
  const documentRef = options.documentRef;
  const state = options.state;
  const visualConfig = options.visualConfig;

  if (!documentRef || !state || !visualConfig) {
    clearDartMarkerDartsState(state);
    return;
  }

  const board = findBoardSvgGroup(documentRef);
  if (!board?.group || !board.radius) {
    clearDartMarkerDartsState(state);
    return;
  }

  const overlay = ensureOverlay(board.group);
  if (!overlay) {
    clearDartMarkerDartsState(state);
    return;
  }
  state.overlayNode = overlay;

  const markers = collectBoardMarkers(documentRef);
  if (!markers.length) {
    clearOverlay(state);
    restoreHiddenMarkers(state);
    state.entriesByKey.clear();
    return;
  }

  const boardCenter = getBoardCenter(board);
  const dartLength = Math.max(18, board.radius * 0.416 * visualConfig.sizeMultiplier);
  const dartHeight = dartLength / DART_ASPECT_RATIO;
  const dartImageSource = resolveDartDesignAsset(visualConfig.designKey);

  const markerKeySet = new Set();

  markers.forEach((marker) => {
    const markerPosition = readMarkerPosition(marker);
    if (!markerPosition) {
      return;
    }

    const markerKey = buildMarkerKey(marker);
    markerKeySet.add(markerKey);

    let entry = state.entriesByKey.get(markerKey);
    const isNew = !entry;

    if (!entry) {
      const imageNode = createDartImageNode(overlay.ownerDocument);
      overlay.appendChild(imageNode);

      entry = {
        markerKey,
        marker,
        imageNode,
        dartLength,
      };
      state.entriesByKey.set(markerKey, entry);
    }

    entry.marker = marker;
    entry.dartLength = dartLength;

    setImageSource(entry.imageNode, dartImageSource);
    setDartGeometry(entry, {
      markerPosition,
      boardCenter,
      dartLength,
      dartHeight,
    });

    if (isNew) {
      triggerFlightAnimation(entry, state, visualConfig, boardCenter, markerPosition);
    }

    setMarkerHidden(marker, visualConfig.hideOriginalMarkers, state);
  });

  state.entriesByKey.forEach((entry, markerKey) => {
    if (markerKeySet.has(markerKey)) {
      return;
    }

    if (entry?.imageNode?.parentNode && typeof entry.imageNode.parentNode.removeChild === "function") {
      entry.imageNode.parentNode.removeChild(entry.imageNode);
    }

    setMarkerHidden(entry.marker, false, state);
    state.entriesByKey.delete(markerKey);

    const timeoutHandle = state.flightTimeoutByKey.get(markerKey);
    if (timeoutHandle) {
      const clearTimeoutRef =
        state.windowRef && typeof state.windowRef.clearTimeout === "function"
          ? state.windowRef.clearTimeout.bind(state.windowRef)
          : clearTimeout;
      clearTimeoutRef(timeoutHandle);
      state.flightTimeoutByKey.delete(markerKey);
    }
  });

  if (!visualConfig.hideOriginalMarkers) {
    markers.forEach((marker) => setMarkerHidden(marker, false, state));
  }
}
