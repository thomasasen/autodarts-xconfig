import { DART_DESIGN_KEYS } from "#feature-assets";

export const STYLE_ID = "ad-ext-dart-marker-darts-style";
export const OVERLAY_ID = "ad-ext-dart-image-overlay";
export const OVERLAY_SCENE_ID = "ad-ext-dart-image-overlay-scene";
export const DART_CLASS = "ad-ext-dart-image";
export const DART_NEW_CLASS = "ad-ext-dart-image--new";

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
    flightSpeed,
    flightDurationMs: flightDurationMsBySpeed[flightSpeed] || 320,
  };
}

export function buildStyleText() {
  return `
#${OVERLAY_ID} {
  position: fixed;
  overflow: visible;
  inset: 0;
  pointer-events: none;
  z-index: 5;
}

.${DART_CLASS} {
  pointer-events: none;
  user-select: none;
  transform-box: fill-box;
  transform-origin: center;
  opacity: 1;
  transition: opacity 140ms ease-out;
}

.${DART_CLASS}.${DART_NEW_CLASS} {
  animation: ad-ext-dart-image-flight var(--ad-ext-dart-flight-ms, 320ms) cubic-bezier(0.15, 0.7, 0.2, 1) 1;
}

@keyframes ad-ext-dart-image-flight {
  0% {
    transform: translate(var(--ad-ext-dart-from-x, 0px), var(--ad-ext-dart-from-y, 0px)) scale(0.94);
    opacity: 0.22;
    filter: blur(2px);
  }
  55% {
    transform: translate(calc(var(--ad-ext-dart-from-x, 0px) * 0.5), calc(var(--ad-ext-dart-from-y, 0px) * 0.5)) scale(0.97);
    opacity: 0.78;
    filter: blur(1px);
  }
  100% {
    transform: translate(0px, 0px) scale(1);
    opacity: 1;
    filter: blur(0px);
  }
}
`;
}
