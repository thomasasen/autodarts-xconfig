import { getMarkerOriginalOpacity, isMarkerHiddenByOverlay, setMarkerHighlightOpacity,
  releaseMarkerHighlightOpacity } from "../../shared/marker-opacity.js";
import { collectBoardMarkers } from "../../shared/dartboard-markers.js";
import { BASE_CLASS, EFFECT_CLASSES } from "./style.js";

const APPEARANCE_STYLE_KEYS = ["fill", "stroke", "strokeWidth"];
const APPEARANCE_CLASSES = {
  hadBaseClass: BASE_CLASS, hadPulseClass: EFFECT_CLASSES["size-pulse"], hadGlowClass: EFFECT_CLASSES["soft-glow"],
};

function captureSnapshot(marker) {
  return {
    radius: marker.getAttribute?.("r") ?? null,
    fill: marker.style?.fill || "",
    opacity: marker.style?.opacity || "",
    stroke: marker.style?.stroke || "",
    strokeWidth: marker.style?.strokeWidth || "",
    hadBaseClass: marker.classList?.contains(BASE_CLASS) || false,
    hadPulseClass: marker.classList?.contains(EFFECT_CLASSES["size-pulse"]) || false,
    hadGlowClass: marker.classList?.contains(EFFECT_CLASSES["soft-glow"]) || false,
  };
}

function restoreSnapshot(marker, snapshot) {
  if (!marker || !snapshot?.applied) return;
  if (marker.getAttribute("r") === snapshot.applied.radius) marker.setAttribute("r", snapshot.radius);
  APPEARANCE_STYLE_KEYS.forEach((key) => {
    if (marker.style[key] === snapshot.applied[key]) marker.style[key] = snapshot[key];
  });
  Object.entries(APPEARANCE_CLASSES).forEach(([key, className]) => {
    if (marker.classList.contains(className) === snapshot.applied[key]) marker.classList.toggle(className, snapshot[key]);
  });
  releaseMarkerHighlightOpacity(marker);
}

function refreshAppearance(marker, visualConfig, snapshot, preserveForeign = false) {
  const previous = preserveForeign ? snapshot.applied : null;
  const current = previous ? captureSnapshot(marker) : null;
  applyDartboardMarkerHighlightToMarker(marker, visualConfig);
  snapshot.applied = captureSnapshot(marker);
  if (!previous) return;
  // A visibility change may refresh our effect, but does not reclaim foreign edits.
  if (current.radius !== previous.radius) {
    if (current.radius === null) marker.removeAttribute("r");
    else marker.setAttribute("r", current.radius);
  }
  APPEARANCE_STYLE_KEYS.forEach((key) => {
    if (current[key] !== previous[key]) marker.style[key] = current[key];
  });
  Object.entries(APPEARANCE_CLASSES).forEach(([key, className]) => {
    if (current[key] !== previous[key]) marker.classList.toggle(className, current[key]);
  });
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
    isMarkerHiddenByOverlay(marker) ? "hidden" : "visible",
  ].join("|");
}

export function applyDartboardMarkerHighlightToMarker(marker, visualConfig) {
  setAttributeIfChanged(marker, "r", String(visualConfig.markerSize));
  setStyleIfChanged(marker.style, "fill", visualConfig.markerColor);

  if (isMarkerHiddenByOverlay(marker)) {
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

export function createDartboardMarkerHighlightState() {
  return {
    trackedMarkers: new Set(),
    snapshotsByMarker: new Map(),
    appliedSignaturesByMarker: new Map(),
  };
}

export function clearDartboardMarkerHighlight(state) {
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

export function updateDartboardMarkerHighlight(options = {}) {
  const documentRef = options.documentRef;
  const state = options.state;
  const visualConfig = options.visualConfig;

  if (!documentRef || !state || !visualConfig) {
    clearDartboardMarkerHighlight(state);
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
      state.snapshotsByMarker.set(marker, { ...captureSnapshot(marker), opacity: getMarkerOriginalOpacity(marker) });
    }
    state.trackedMarkers.add(marker);
    const nextSignature = buildAppliedSignature(marker, visualConfig);
    if (state.appliedSignaturesByMarker?.get(marker) === nextSignature) {
      return;
    }
    setMarkerHighlightOpacity(marker, visualConfig.opacity, (preserveForeign) =>
      refreshAppearance(marker, visualConfig, state.snapshotsByMarker.get(marker), preserveForeign));
    state.appliedSignaturesByMarker?.set(marker, nextSignature);
  });
}
