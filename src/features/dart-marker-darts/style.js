import { DART_DESIGN_KEYS } from "#feature-assets";

export const STYLE_ID = "ad-ext-dart-marker-darts-style";
export const OVERLAY_ID = "ad-ext-dart-image-overlay";
export const OVERLAY_SCENE_ID = "ad-ext-dart-image-overlay-scene";
export const DART_CONTAINER_CLASS = "ad-ext-dart-flight-group";
export const DART_ROTATE_CLASS = "ad-ext-dart-rotate-group";
export const DART_SHADOW_CLASS = "ad-ext-dart-shadow";
export const DART_CLASS = "ad-ext-dart-image";

const SIZE_PERCENTAGES = new Set([90, 100, 115]);
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

export function resolveDartMarkerDartsConfig(featureConfig = {}) {
  const design = String(featureConfig.design || "").trim().toLowerCase();
  const designKey = DART_DESIGN_KEYS.includes(design) ? design : "autodarts";

  const sizePercentRaw = Number(featureConfig.sizePercent);
  const sizePercent = SIZE_PERCENTAGES.has(sizePercentRaw) ? sizePercentRaw : 100;

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
    enableShadow: normalizeBoolean(featureConfig.enableShadow, true),
    enableWobble: normalizeBoolean(featureConfig.enableWobble, true),
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
  z-index: 5;
}

.${DART_CONTAINER_CLASS},
.${DART_ROTATE_CLASS},
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
`;
}
