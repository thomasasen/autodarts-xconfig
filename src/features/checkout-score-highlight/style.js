export const STYLE_ID = "autodarts-animate-checkout-style";
export const HIGHLIGHT_CLASS = "ad-ext-checkout-possible";

export const EFFECT_CLASSES = {
  "grow-glow": "ad-ext-checkout-possible--grow-glow",
  "glow-only": "ad-ext-checkout-possible--glow-only",
  "grow-only": "ad-ext-checkout-possible--grow-only",
  "fade-blink": "ad-ext-checkout-possible--fade-blink",
};

const EFFECT_ALIASES = Object.freeze({
  pulse: "grow-glow",
  glow: "glow-only",
  scale: "grow-only",
  blink: "fade-blink",
});

export const STYLE_VARIABLES = Object.freeze({
  color: "--ad-ext-checkout-pulse-color",
  pulseScale: "--ad-ext-checkout-pulse-scale",
  pulseMidOpacity: "--ad-ext-checkout-pulse-mid-opacity",
  pulseShadowMaxAlpha: "--ad-ext-checkout-pulse-shadow-max-alpha",
  glowMinAlpha: "--ad-ext-checkout-glow-min-alpha",
  glowMaxAlpha: "--ad-ext-checkout-glow-max-alpha",
  glowMaxBlur: "--ad-ext-checkout-glow-max-blur",
  scaleMax: "--ad-ext-checkout-scale-max",
  blinkMinOpacity: "--ad-ext-checkout-blink-min-opacity",
});

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

function scopedClassSelector(selectorPrefix, className) {
  const prefix = String(selectorPrefix || "").trim();
  return prefix ? `${prefix} .${className}` : `.${className}`;
}

export function resolveCheckoutScoreHighlightStyleVariables(options = {}) {
  const pulseColor = sanitizeColorTheme(options.colorTheme);
  const intensity = resolveIntensityPreset(options.intensity);

  return {
    [STYLE_VARIABLES.color]: pulseColor,
    [STYLE_VARIABLES.pulseScale]: String(intensity.pulseScale),
    [STYLE_VARIABLES.pulseMidOpacity]: String(intensity.pulseMidOpacity),
    [STYLE_VARIABLES.pulseShadowMaxAlpha]: String(intensity.pulseShadowMaxAlpha),
    [STYLE_VARIABLES.glowMinAlpha]: String(intensity.glowMinAlpha),
    [STYLE_VARIABLES.glowMaxAlpha]: String(intensity.glowMaxAlpha),
    [STYLE_VARIABLES.glowMaxBlur]: `${intensity.glowMaxBlurPx}px`,
    [STYLE_VARIABLES.scaleMax]: String(intensity.scaleMax),
    [STYLE_VARIABLES.blinkMinOpacity]: String(intensity.blinkMinOpacity),
  };
}

export function applyCheckoutScoreHighlightStyleVariables(node, options = {}) {
  if (!node?.style || typeof node.style.setProperty !== "function") {
    return;
  }

  Object.entries(resolveCheckoutScoreHighlightStyleVariables(options)).forEach(
    ([propertyName, value]) => {
      node.style.setProperty(propertyName, value);
    }
  );
}

export function buildStyleText(options = {}) {
  const variables = resolveCheckoutScoreHighlightStyleVariables(options);
  const selectorPrefix = options.selectorPrefix || "";

  return `
@keyframes ad-ext-checkout-pulse {
  0% {
    transform: scale(1);
    opacity: 1;
    text-shadow: 0 0 2px rgba(var(${STYLE_VARIABLES.color}), 0.2);
  }
  50% {
    transform: scale(var(${STYLE_VARIABLES.pulseScale}));
    opacity: var(${STYLE_VARIABLES.pulseMidOpacity});
    text-shadow: 0 0 var(${STYLE_VARIABLES.glowMaxBlur}) rgba(var(${STYLE_VARIABLES.color}), var(${STYLE_VARIABLES.pulseShadowMaxAlpha}));
  }
  100% {
    transform: scale(1);
    opacity: 1;
    text-shadow: 0 0 2px rgba(var(${STYLE_VARIABLES.color}), 0.2);
  }
}

${scopedClassSelector(selectorPrefix, HIGHLIGHT_CLASS)} {
  ${STYLE_VARIABLES.color}: ${variables[STYLE_VARIABLES.color]};
  ${STYLE_VARIABLES.pulseScale}: ${variables[STYLE_VARIABLES.pulseScale]};
  ${STYLE_VARIABLES.pulseMidOpacity}: ${variables[STYLE_VARIABLES.pulseMidOpacity]};
  ${STYLE_VARIABLES.pulseShadowMaxAlpha}: ${variables[STYLE_VARIABLES.pulseShadowMaxAlpha]};
  ${STYLE_VARIABLES.glowMinAlpha}: ${variables[STYLE_VARIABLES.glowMinAlpha]};
  ${STYLE_VARIABLES.glowMaxAlpha}: ${variables[STYLE_VARIABLES.glowMaxAlpha]};
  ${STYLE_VARIABLES.glowMaxBlur}: ${variables[STYLE_VARIABLES.glowMaxBlur]};
  ${STYLE_VARIABLES.scaleMax}: ${variables[STYLE_VARIABLES.scaleMax]};
  ${STYLE_VARIABLES.blinkMinOpacity}: ${variables[STYLE_VARIABLES.blinkMinOpacity]};
  display: inline-block;
  transform-origin: center;
}

${scopedClassSelector(selectorPrefix, EFFECT_CLASSES["grow-glow"])} {
  animation: ad-ext-checkout-pulse 1.4s ease-in-out infinite;
}

${scopedClassSelector(selectorPrefix, EFFECT_CLASSES["glow-only"])} {
  animation: ad-ext-checkout-glow 1.8s ease-in-out infinite;
}

${scopedClassSelector(selectorPrefix, EFFECT_CLASSES["grow-only"])} {
  animation: ad-ext-checkout-scale 1.2s ease-in-out infinite;
}

${scopedClassSelector(selectorPrefix, EFFECT_CLASSES["fade-blink"])} {
  animation: ad-ext-checkout-blink 0.9s ease-in-out infinite;
}

@keyframes ad-ext-checkout-glow {
  0% {
    text-shadow: 0 0 4px rgba(var(${STYLE_VARIABLES.color}), var(${STYLE_VARIABLES.glowMinAlpha}));
  }
  50% {
    text-shadow: 0 0 var(${STYLE_VARIABLES.glowMaxBlur}) rgba(var(${STYLE_VARIABLES.color}), var(${STYLE_VARIABLES.glowMaxAlpha}));
  }
  100% {
    text-shadow: 0 0 4px rgba(var(${STYLE_VARIABLES.color}), var(${STYLE_VARIABLES.glowMinAlpha}));
  }
}

@keyframes ad-ext-checkout-scale {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(var(${STYLE_VARIABLES.scaleMax}));
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
    opacity: var(${STYLE_VARIABLES.blinkMinOpacity});
  }
  100% {
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  ${scopedClassSelector(selectorPrefix, HIGHLIGHT_CLASS)} {
    animation: none !important;
    transition: none !important;
    transform: none !important;
  }
}
`;
}

export function getEffectClass(effect) {
  const normalized = String(effect || "").trim().toLowerCase();
  const canonical = EFFECT_ALIASES[normalized] || normalized;
  return EFFECT_CLASSES[canonical] || EFFECT_CLASSES["grow-only"];
}

export function getEffectClassList() {
  return Object.values(EFFECT_CLASSES);
}
