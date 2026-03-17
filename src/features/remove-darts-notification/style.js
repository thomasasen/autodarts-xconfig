export const STYLE_ID = "ad-ext-remove-darts-notification-style";
export const CARD_CLASS = "ad-ext-takeout-card";
export const OVERLAY_ROOT_ID = "ad-ext-takeout-overlay-root";
export const OVERLAY_ROOT_CLASS = "ad-ext-takeout-overlay";
export const IMAGE_CLASS = "ad-ext-takeout-image";
export const HIDDEN_NOTICE_CLASS = "ad-ext-takeout-host-hidden";

const IMAGE_SIZE_PRESETS = Object.freeze({
  compact: {
    imageMaxWidthRem: 24,
    imageMaxWidthVw: 72,
  },
  standard: {
    imageMaxWidthRem: 30,
    imageMaxWidthVw: 90,
  },
  large: {
    imageMaxWidthRem: 36,
    imageMaxWidthVw: 96,
  },
});

const ALLOWED_PULSE_SCALE = new Set([1.02, 1.04, 1.08]);

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

export function resolveRemoveDartsNotificationConfig(featureConfig = {}) {
  const imageSizeRaw = String(featureConfig.imageSize || "").trim().toLowerCase();
  const imageSize = IMAGE_SIZE_PRESETS[imageSizeRaw] ? imageSizeRaw : "standard";
  const pulseScaleRaw = Number(featureConfig.pulseScale);
  const pulseScale = ALLOWED_PULSE_SCALE.has(pulseScaleRaw) ? pulseScaleRaw : 1.04;

  return {
    imageSize,
    imageSizePreset: IMAGE_SIZE_PRESETS[imageSize],
    pulseAnimation: normalizeBoolean(featureConfig.pulseAnimation, true),
    pulseScale,
    pulseDurationMs: 1400,
  };
}

export function buildStyleText(visualConfig = {}) {
  const imageMaxWidthRem = Number(visualConfig.imageSizePreset?.imageMaxWidthRem) || 30;
  const imageMaxWidthVw = Number(visualConfig.imageSizePreset?.imageMaxWidthVw) || 90;
  const pulseScale = Number(visualConfig.pulseScale) || 1.04;
  const pulseDurationMs = Number(visualConfig.pulseDurationMs) || 1400;
  const pulseAnimation = visualConfig.pulseAnimation !== false;
  const pulseAnimationRule = pulseAnimation
    ? `ad-ext-takeout-pulse ${pulseDurationMs}ms ease-in-out infinite !important`
    : "none !important";

  return `
.${HIDDEN_NOTICE_CLASS} {
  display: none !important;
  visibility: hidden !important;
}

.${HIDDEN_NOTICE_CLASS}::before,
.${HIDDEN_NOTICE_CLASS}::after {
  content: none !important;
  display: none !important;
  animation: none !important;
}

#${OVERLAY_ROOT_ID},
.${OVERLAY_ROOT_CLASS} {
  position: fixed !important;
  inset: 0 !important;
  display: flex !important;
  align-items: center;
  justify-content: center;
  pointer-events: none !important;
  z-index: 1700 !important;
  isolation: isolate !important;
}

.${CARD_CLASS} {
  display: flex !important;
  align-items: center;
  justify-content: center;
  pointer-events: none !important;
  transform: translateZ(0);
  transform-origin: center center !important;
  animation: ${pulseAnimationRule};
  will-change: transform, opacity;
}

.${IMAGE_CLASS} {
  display: block !important;
  width: min(${imageMaxWidthRem}rem, ${imageMaxWidthVw}vw) !important;
  max-width: min(${imageMaxWidthRem}rem, ${imageMaxWidthVw}vw) !important;
  height: auto !important;
  background: transparent !important;
  background-color: transparent !important;
  background-image: none !important;
  border: 0 !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  filter: none !important;
  object-fit: contain !important;
  opacity: 1 !important;
  pointer-events: none !important;
}

@keyframes ad-ext-takeout-pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(${pulseScale}); opacity: 0.95; }
}

@media (prefers-reduced-motion: reduce) {
  .${CARD_CLASS} {
    animation: none !important;
  }
}
`;
}
