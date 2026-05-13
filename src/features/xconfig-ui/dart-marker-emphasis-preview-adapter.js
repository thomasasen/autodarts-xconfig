import { applyDartMarkerEmphasisToMarker } from "../dart-marker-emphasis/logic.js";
import {
  EFFECT_CLASSES,
  resolveDartMarkerEmphasisConfig,
} from "../dart-marker-emphasis/style.js";
import {
  DART_MARKER_EMPHASIS_PREVIEW_MARKER_SELECTOR,
} from "./dart-marker-emphasis-preview-contract.js";

const PREVIEW_FIELD_KEYS = new Set(["size", "effect", "opacityPercent"]);

function normalizeSettingValue(settingKey, settingValue) {
  return settingKey === "effect" ? String(settingValue ?? "") : Number(settingValue);
}

function resolvePreviewConfig(context = {}, options = {}) {
  const settingKey = String(context.settingKey || "").trim();
  const baseConfig = { ...context.feature?.config };
  if (PREVIEW_FIELD_KEYS.has(settingKey)) {
    baseConfig[settingKey] = normalizeSettingValue(settingKey, context.settingValue);
  }
  if (options.idle) {
    baseConfig.effect = "none";
  }
  return resolveDartMarkerEmphasisConfig(baseConfig);
}

function restartMarkerEffect(marker, visualConfig) {
  if (!marker?.classList || visualConfig.effect === "none") {
    return;
  }
  const effectClass = EFFECT_CLASSES[visualConfig.effect];
  if (!effectClass) {
    return;
  }
  marker.classList.remove(effectClass);
  marker.getBoundingClientRect?.();
  marker.classList.add(effectClass);
}

function applyPreviewMarker(marker, context, options = {}) {
  const visualConfig = resolvePreviewConfig(context, options);
  applyDartMarkerEmphasisToMarker(marker, visualConfig);
  if (!options.idle) {
    restartMarkerEffect(marker, visualConfig);
  }
}

function startDartMarkerEmphasisPreview(context = {}) {
  const optionNode = context.optionNode || null;
  const marker = optionNode?.querySelector?.(DART_MARKER_EMPHASIS_PREVIEW_MARKER_SELECTOR) || null;

  if (!marker) {
    return () => {};
  }

  applyPreviewMarker(marker, context);

  return () => {
    applyPreviewMarker(marker, context, { idle: true });
  };
}

export function createDartMarkerEmphasisPreviewAdapter() {
  return {
    prefix: "dart-marker-emphasis-",
    matches: (previewEffect) => String(previewEffect || "").startsWith("dart-marker-emphasis-"),
    start: startDartMarkerEmphasisPreview,
  };
}
