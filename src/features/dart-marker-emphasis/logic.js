import { collectBoardMarkers } from "../../shared/dartboard-markers.js";
import { BASE_CLASS, EFFECT_CLASSES } from "./style.js";

const HIDDEN_MARKER_DATASET_KEY = "adExtOriginalOpacity";

function captureSnapshot(marker) {
  return {
    radius: marker.getAttribute?.("r") || "",
    fill: marker.style?.fill || "",
    opacity: marker.style?.opacity || "",
    stroke: marker.style?.stroke || "",
    strokeWidth: marker.style?.strokeWidth || "",
    hadBaseClass: marker.classList?.contains(BASE_CLASS) || false,
    hadPulseClass: marker.classList?.contains(EFFECT_CLASSES.pulse) || false,
    hadGlowClass: marker.classList?.contains(EFFECT_CLASSES.glow) || false,
  };
}

function restoreSnapshot(marker, snapshot) {
  if (!marker || !snapshot) {
    return;
  }

  if (snapshot.radius) {
    marker.setAttribute("r", snapshot.radius);
  }

  marker.style.fill = snapshot.fill;
  marker.style.opacity = snapshot.opacity;
  marker.style.stroke = snapshot.stroke;
  marker.style.strokeWidth = snapshot.strokeWidth;

  marker.classList.remove(BASE_CLASS, EFFECT_CLASSES.pulse, EFFECT_CLASSES.glow);
  if (snapshot.hadBaseClass) {
    marker.classList.add(BASE_CLASS);
  }
  if (snapshot.hadPulseClass) {
    marker.classList.add(EFFECT_CLASSES.pulse);
  }
  if (snapshot.hadGlowClass) {
    marker.classList.add(EFFECT_CLASSES.glow);
  }
}

function isHiddenByDartOverlay(marker) {
  if (!marker || !marker.dataset) {
    return false;
  }
  return Object.prototype.hasOwnProperty.call(marker.dataset, HIDDEN_MARKER_DATASET_KEY);
}

function applyMarker(marker, visualConfig) {
  marker.setAttribute("r", String(visualConfig.markerSize));
  marker.style.fill = visualConfig.markerColor;

  if (isHiddenByDartOverlay(marker)) {
    marker.style.opacity = "0";
    marker.style.stroke = "none";
    marker.style.strokeWidth = "0";
    marker.classList.remove(EFFECT_CLASSES.pulse, EFFECT_CLASSES.glow);
  } else {
    marker.style.opacity = String(visualConfig.opacity);
    if (visualConfig.outlineColor) {
      marker.style.stroke = visualConfig.outlineColor;
      marker.style.strokeWidth = "1.5";
    } else {
      marker.style.stroke = "none";
      marker.style.strokeWidth = "0";
    }

    marker.classList.remove(EFFECT_CLASSES.pulse, EFFECT_CLASSES.glow);
    if (visualConfig.effect !== "none" && EFFECT_CLASSES[visualConfig.effect]) {
      marker.classList.add(EFFECT_CLASSES[visualConfig.effect]);
    }
  }

  marker.classList.add(BASE_CLASS);
}

export function createDartMarkerEmphasisState() {
  return {
    trackedMarkers: new Set(),
    snapshotsByMarker: new Map(),
  };
}

export function clearDartMarkerEmphasis(state) {
  if (!state) {
    return;
  }

  state.trackedMarkers.forEach((marker) => {
    restoreSnapshot(marker, state.snapshotsByMarker.get(marker));
  });

  state.trackedMarkers.clear();
  state.snapshotsByMarker.clear();
}

export function updateDartMarkerEmphasis(options = {}) {
  const documentRef = options.documentRef;
  const state = options.state;
  const visualConfig = options.visualConfig;

  if (!documentRef || !state || !visualConfig) {
    clearDartMarkerEmphasis(state);
    return;
  }

  const markers = collectBoardMarkers(documentRef);
  const markerSet = new Set(markers);

  state.trackedMarkers.forEach((marker) => {
    if (markerSet.has(marker)) {
      return;
    }
    restoreSnapshot(marker, state.snapshotsByMarker.get(marker));
    state.trackedMarkers.delete(marker);
    state.snapshotsByMarker.delete(marker);
  });

  markers.forEach((marker) => {
    if (!state.snapshotsByMarker.has(marker)) {
      state.snapshotsByMarker.set(marker, captureSnapshot(marker));
    }
    state.trackedMarkers.add(marker);
    applyMarker(marker, visualConfig);
  });
}
