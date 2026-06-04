import { collectBoardMarkers } from "../../shared/dartboard-markers.js";
import { BASE_CLASS, EFFECT_CLASSES } from "./style.js";

const HIDDEN_MARKER_DATASET_KEY = "adExtOriginalOpacity";
const HIDDEN_MARKER_ATTRIBUTE = "data-ad-ext-original-opacity";

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
  if (marker?.getAttribute?.(HIDDEN_MARKER_ATTRIBUTE) !== null) {
    return true;
  }
  return Boolean(marker?.dataset?.[HIDDEN_MARKER_DATASET_KEY] !== undefined);
}

function setAttributeIfChanged(node, name, value) {
  const nextValue = String(value ?? "");
  if (String(node.getAttribute?.(name) || "") === nextValue) {
    return false;
  }

  node.setAttribute(name, nextValue);
  return true;
}

function setStyleIfChanged(styleRef, propertyName, value) {
  const nextValue = String(value ?? "");
  if (String(styleRef?.[propertyName] || "") === nextValue) {
    return false;
  }

  styleRef[propertyName] = nextValue;
  return true;
}

function addClassIfMissing(classList, className) {
  if (!className || classList?.contains?.(className)) {
    return false;
  }

  classList.add(className);
  return true;
}

function removeClassIfPresent(classList, className) {
  if (!className || !classList?.contains?.(className)) {
    return false;
  }

  classList.remove(className);
  return true;
}

function setEffectClass(marker, effectClass = "") {
  Object.values(EFFECT_CLASSES).forEach((className) => {
    if (className === effectClass) {
      addClassIfMissing(marker.classList, className);
    } else {
      removeClassIfPresent(marker.classList, className);
    }
  });
}

function buildAppliedSignature(marker, visualConfig) {
  return [
    visualConfig.markerSize,
    visualConfig.markerColor,
    visualConfig.effect,
    visualConfig.opacity,
    visualConfig.outlineColor || "",
    isHiddenByDartOverlay(marker) ? "hidden" : "visible",
  ].join("|");
}

export function applyDartMarkerEmphasisToMarker(marker, visualConfig) {
  setAttributeIfChanged(marker, "r", String(visualConfig.markerSize));
  setStyleIfChanged(marker.style, "fill", visualConfig.markerColor);

  if (isHiddenByDartOverlay(marker)) {
    setStyleIfChanged(marker.style, "opacity", "0");
    setStyleIfChanged(marker.style, "stroke", "none");
    setStyleIfChanged(marker.style, "strokeWidth", "0");
    setEffectClass(marker);
  } else {
    setStyleIfChanged(marker.style, "opacity", String(visualConfig.opacity));
    if (visualConfig.outlineColor) {
      setStyleIfChanged(marker.style, "stroke", visualConfig.outlineColor);
      setStyleIfChanged(marker.style, "strokeWidth", "1.5");
    } else {
      setStyleIfChanged(marker.style, "stroke", "none");
      setStyleIfChanged(marker.style, "strokeWidth", "0");
    }

    setEffectClass(
      marker,
      visualConfig.effect !== "none" ? EFFECT_CLASSES[visualConfig.effect] : ""
    );
  }

  addClassIfMissing(marker.classList, BASE_CLASS);
}

export function createDartMarkerEmphasisState() {
  return {
    trackedMarkers: new Set(),
    snapshotsByMarker: new Map(),
    appliedSignaturesByMarker: new Map(),
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
  state.appliedSignaturesByMarker?.clear();
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
    state.appliedSignaturesByMarker?.delete(marker);
  });

  markers.forEach((marker) => {
    if (!state.snapshotsByMarker.has(marker)) {
      state.snapshotsByMarker.set(marker, captureSnapshot(marker));
    }
    state.trackedMarkers.add(marker);
    const nextSignature = buildAppliedSignature(marker, visualConfig);
    if (state.appliedSignaturesByMarker?.get(marker) === nextSignature) {
      return;
    }
    applyDartMarkerEmphasisToMarker(marker, visualConfig);
    state.appliedSignaturesByMarker?.set(marker, nextSignature);
  });
}
