import { applyDartboardMarkerHighlightToMarker } from "../dartboard-marker-highlight/logic.js";
import {
  EFFECT_CLASSES,
  resolveDartboardMarkerHighlightConfig,
} from "../dartboard-marker-highlight/style.js";
import {
  DARTBOARD_MARKER_HIGHLIGHT_PREVIEW_MARKER_SELECTOR,
} from "./dartboard-marker-highlight-preview-contract.js";

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
  return resolveDartboardMarkerHighlightConfig(baseConfig);
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
  applyDartboardMarkerHighlightToMarker(marker, visualConfig);
  if (!options.idle) {
    restartMarkerEffect(marker, visualConfig);
  }
}

function startDartboardMarkerHighlightPreview(context = {}) {
  const optionNode = context.optionNode || null;
  const marker = optionNode?.querySelector?.(DARTBOARD_MARKER_HIGHLIGHT_PREVIEW_MARKER_SELECTOR) || null;

  if (!marker) {
    return () => {};
  }

  applyPreviewMarker(marker, context);

  return () => {
    applyPreviewMarker(marker, context, { idle: true });
  };
}

export function createDartboardMarkerHighlightPreviewAdapter() {
  return {
    prefix: "dartboard-marker-highlight-",
    matches: (previewEffect) => String(previewEffect || "").startsWith("dartboard-marker-highlight-"),
    start: startDartboardMarkerHighlightPreview,
  };
}
