export const STYLE_ID = "autodarts-animate-checkout-style";
export const HIGHLIGHT_CLASS = "ad-ext-checkout-possible";

export const EFFECT_CLASSES = {
  pulse: "ad-ext-checkout-possible--pulse",
  glow: "ad-ext-checkout-possible--glow",
  scale: "ad-ext-checkout-possible--scale",
  blink: "ad-ext-checkout-possible--blink",
};

const INTENSITY_PRESETS = {
  dezent: {
    pulseScale: 1.06,
    pulseMidOpacity: 0.96,
    pulseShadowMaxAlpha: 0.55,
    glowMinAlpha: 0.26,
    glowMaxAlpha: 0.72,
    glowMaxBlurPx: 11,
    scaleMax: 1.04,
    blinkMinOpacity: 0.55,
  },
  standard: {
    pulseScale: 1.1,
    pulseMidOpacity: 0.92,
    pulseShadowMaxAlpha: 0.8,
    glowMinAlpha: 0.35,
    glowMaxAlpha: 0.9,
    glowMaxBlurPx: 16,
    scaleMax: 1.08,
    blinkMinOpacity: 0.3,
  },
  stark: {
    pulseScale: 1.14,
    pulseMidOpacity: 0.88,
    pulseShadowMaxAlpha: 1,
    glowMinAlpha: 0.45,
    glowMaxAlpha: 1,
    glowMaxBlurPx: 22,
    scaleMax: 1.12,
    blinkMinOpacity: 0.18,
  },
};

function sanitizeColorTheme(value) {
  const raw = String(value || "").trim();
  return /^\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}$/.test(raw)
    ? raw
    : "159, 219, 88";
}

function resolveIntensityPreset(intensity) {
  const normalized = String(intensity || "").trim().toLowerCase();
  return INTENSITY_PRESETS[normalized] || INTENSITY_PRESETS.standard;
}

export function buildStyleText(options = {}) {
  const pulseColor = sanitizeColorTheme(options.colorTheme);
  const intensity = resolveIntensityPreset(options.intensity);

  return `
@keyframes ad-ext-checkout-pulse {
  0% {
    transform: scale(1);
    opacity: 1;
    text-shadow: 0 0 2px rgba(${pulseColor}, 0.2);
  }
  50% {
    transform: scale(${intensity.pulseScale});
    opacity: ${intensity.pulseMidOpacity};
    text-shadow: 0 0 ${intensity.glowMaxBlurPx}px rgba(${pulseColor}, ${intensity.pulseShadowMaxAlpha});
  }
  100% {
    transform: scale(1);
    opacity: 1;
    text-shadow: 0 0 2px rgba(${pulseColor}, 0.2);
  }
}

.${HIGHLIGHT_CLASS} {
  display: inline-block;
  transform-origin: center;
}

.${EFFECT_CLASSES.pulse} {
  animation: ad-ext-checkout-pulse 1.4s ease-in-out infinite;
}

.${EFFECT_CLASSES.glow} {
  animation: ad-ext-checkout-glow 1.8s ease-in-out infinite;
}

.${EFFECT_CLASSES.scale} {
  animation: ad-ext-checkout-scale 1.2s ease-in-out infinite;
}

.${EFFECT_CLASSES.blink} {
  animation: ad-ext-checkout-blink 0.9s ease-in-out infinite;
}

@keyframes ad-ext-checkout-glow {
  0% {
    text-shadow: 0 0 4px rgba(${pulseColor}, ${intensity.glowMinAlpha});
  }
  50% {
    text-shadow: 0 0 ${intensity.glowMaxBlurPx}px rgba(${pulseColor}, ${intensity.glowMaxAlpha});
  }
  100% {
    text-shadow: 0 0 4px rgba(${pulseColor}, ${intensity.glowMinAlpha});
  }
}

@keyframes ad-ext-checkout-scale {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(${intensity.scaleMax});
  }
  100% {
    transform: scale(1);
  }
}

@keyframes ad-ext-checkout-blink {
  0% {
    opacity: 1;
  }
  50% {
    opacity: ${intensity.blinkMinOpacity};
  }
  100% {
    opacity: 1;
  }
}
`;
}

export function getEffectClass(effect) {
  const normalized = String(effect || "").trim().toLowerCase();
  return EFFECT_CLASSES[normalized] || EFFECT_CLASSES.pulse;
}

export function getEffectClassList() {
  return Object.values(EFFECT_CLASSES);
}