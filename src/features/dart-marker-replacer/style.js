import { DART_DESIGN_KEYS } from "#feature-assets";
import { normalizeDartImpactStyle } from "./pose.js";

export const STYLE_ID = "ad-ext-dart-marker-replacer-style";
export const OVERLAY_ID = "ad-ext-dart-image-overlay";
export const OVERLAY_SCENE_ID = "ad-ext-dart-image-overlay-scene";
export const DART_CONTAINER_CLASS = "ad-ext-dart-flight-group";
export const DART_ROTATE_CLASS = "ad-ext-dart-rotate-group";
export const DART_POSE_CLASS = "ad-ext-dart-pose-group";
export const DART_SHADOW_CLASS = "ad-ext-dart-shadow";
export const DART_CLASS = "ad-ext-dart-image";

const SIZE_PERCENTAGES = new Set([108, 120, 138]);
const LEGACY_SIZE_PERCENTAGES = Object.freeze({
  90: 108,
  100: 120,
  115: 138,
});
const FLIGHT_SPEED_KEYS = new Set(["schnell", "standard", "cinematic"]);

function normalizeBoolean(value, fallbackValue) {
  if (typeof value === "boolean") {
    return value;
  }
  const normalized = String(value || "").trim().toLowerCase();
  if (["1", "true", "yes", "on", "aktiv", "active"].includes(normalized)) {
    return true;
  }
  if (["0", "false", "no", "off", "inaktiv", "inactive"].includes(normalized)) {
    return false;
  }
  return Boolean(fallbackValue);
}

function normalizeSizePercent(value) {
  const numeric = Number(value);
  if (Object.hasOwn(LEGACY_SIZE_PERCENTAGES, numeric)) {
    return LEGACY_SIZE_PERCENTAGES[numeric];
  }
  return SIZE_PERCENTAGES.has(numeric) ? numeric : 120;
}

export function resolveDartMarkerReplacerConfig(featureConfig = {}) {
  const design = String(featureConfig.design || "").trim().toLowerCase();
  const designKey = DART_DESIGN_KEYS.includes(design) ? design : "autodarts";

  const sizePercent = normalizeSizePercent(featureConfig.sizePercent);

  const flightSpeedRaw = String(featureConfig.flightSpeed || "").trim().toLowerCase();
  const flightSpeed = FLIGHT_SPEED_KEYS.has(flightSpeedRaw) ? flightSpeedRaw : "standard";

  const flightDurationMsBySpeed = {
    schnell: 250,
    standard: 320,
    cinematic: 460,
  };

  return {
    designKey,
    animateDarts: normalizeBoolean(featureConfig.animateDarts, true),
    sizePercent,
    sizeMultiplier: sizePercent / 100,
    hideOriginalMarkers: normalizeBoolean(featureConfig.hideOriginalMarkers, false),
    impactStyle: normalizeDartImpactStyle(featureConfig.impactStyle),
    enableShadow: normalizeBoolean(featureConfig.enableShadow, true),
    enableShadowBlur: normalizeBoolean(featureConfig.enableShadowBlur, true),
    enableWobble: normalizeBoolean(featureConfig.enableWobble, true),
    enableFlightBlur: normalizeBoolean(featureConfig.enableFlightBlur, true),
    flightSpeed,
    flightDurationMs: flightDurationMsBySpeed[flightSpeed] || 320,
  };
}

export function buildStyleText() {
  return `
#${OVERLAY_ID} {
  position: fixed;
  overflow: visible;
  pointer-events: none;
  z-index: 50;
}

.${DART_CONTAINER_CLASS},
.${DART_ROTATE_CLASS},
.${DART_POSE_CLASS},
.${DART_SHADOW_CLASS},
.${DART_CLASS} {
  pointer-events: none;
  user-select: none;
}

.${DART_CLASS} {
  opacity: 1;
  transform-box: fill-box;
  will-change: transform;
}

.${DART_SHADOW_CLASS} {
  opacity: 0;
  transform-box: fill-box;
  will-change: transform, opacity;
}

@media (prefers-reduced-motion: reduce) {
  .${DART_CONTAINER_CLASS},
  .${DART_ROTATE_CLASS},
  .${DART_POSE_CLASS},
  .${DART_SHADOW_CLASS},
  .${DART_CLASS} {
    animation: none !important;
    transition: none !important;
  }
}
`;
}
