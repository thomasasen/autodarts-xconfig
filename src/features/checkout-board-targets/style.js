export const SVG_NS = "http://www.w3.org/2000/svg";
export const STYLE_ID = "ad-ext-checkout-board-style";
export const OVERLAY_ID = "ad-ext-checkout-targets";
export const TARGET_CLASS = "ad-ext-checkout-target";
export const OUTLINE_CLASS = "ad-ext-checkout-target-outline";
export const TARGET_FAMILY_ATTRIBUTE = "data-target-family";
export const EFFECT_CLASSES = Object.freeze({
  pulse: "ad-ext-checkout-target--pulse",
  blink: "ad-ext-checkout-target--blink",
  glow: "ad-ext-checkout-target--glow",
});

const BOARD_THEME_PRESETS = Object.freeze({
  violet: {
    color: "rgba(168, 85, 247, 0.85)",
    strokeColor: "rgba(168, 85, 247, 0.95)",
  },
  cyan: {
    color: "rgba(56, 189, 248, 0.85)",
    strokeColor: "rgba(34, 211, 238, 0.95)",
  },
  amber: {
    color: "rgba(245, 158, 11, 0.85)",
    strokeColor: "rgba(251, 191, 36, 0.95)",
  },
});

const OUTLINE_INTENSITY_PRESETS = Object.freeze({
  dezent: {
    strokeAlpha: 0.68,
    baseOpacity: 0.45,
    pulseMinOpacity: 0.22,
    pulseMaxOpacity: 0.8,
    widthDownPx: 0.8,
    widthUpPx: 0.8,
  },
  standard: {
    strokeAlpha: 0.9,
    baseOpacity: 0.6,
    pulseMinOpacity: 0.35,
    pulseMaxOpacity: 1,
    widthDownPx: 0.5,
    widthUpPx: 1.5,
  },
  stark: {
    strokeAlpha: 1,
    baseOpacity: 0.8,
    pulseMinOpacity: 0.45,
    pulseMaxOpacity: 1,
    widthDownPx: 0.35,
    widthUpPx: 2.2,
  },
});

function buildDropShadowFilter(strokeBlurPx, colorBlurPx) {
  return `drop-shadow(0 0 ${strokeBlurPx}px var(--ad-ext-target-stroke)) drop-shadow(0 0 ${colorBlurPx}px var(--ad-ext-target-color))`;
}

const EFFECT_STYLE_PROFILES = Object.freeze({
  pulse: Object.freeze({
    base: Object.freeze({
      minOpacity: 0.25,
      maxOpacity: 1,
      minScale: 0.98,
      maxScale: 1.02,
      filter: "none",
    }),
    outer: Object.freeze({
      minOpacity: 0.62,
      maxOpacity: 1,
      minScale: 1.03,
      maxScale: 1.11,
      filter: buildDropShadowFilter(8, 16),
      strokeWidthBoostPx: 2,
      outlineWidthBoostPx: 5.5,
      outlineBaseOpacityFloor: 0.7,
      outlinePulseMinOpacityFloor: 0.7,
      outlinePulseMaxOpacityFloor: 1,
      outlineWidthDownPxFloor: 2,
      outlineWidthUpPxFloor: 2,
    }),
    bull: Object.freeze({
      minOpacity: 0.52,
      maxOpacity: 1,
      minScale: 1.02,
      maxScale: 1.08,
      filter: buildDropShadowFilter(6, 14),
      strokeWidthBoostPx: 1.5,
      outlineWidthBoostPx: 2.5,
      outlineBaseOpacityFloor: 0.72,
      outlinePulseMinOpacityFloor: 0.72,
      outlinePulseMaxOpacityFloor: 1,
      outlineWidthDownPxFloor: 1.2,
      outlineWidthUpPxFloor: 1.8,
    }),
  }),
  glow: Object.freeze({
    base: Object.freeze({
      minOpacity: 0.66,
      maxOpacity: 0.96,
      minScale: 1,
      maxScale: 1,
      filter: buildDropShadowFilter(7, 18),
      filterMin: buildDropShadowFilter(5, 12),
      filterMax: buildDropShadowFilter(10, 22),
      outlineBaseOpacityFloor: 0.54,
      outlinePulseMinOpacityFloor: 0.32,
      outlinePulseMaxOpacityFloor: 0.88,
      outlineWidthDownPxFloor: 0.9,
      outlineWidthUpPxFloor: 1.6,
    }),
    outer: Object.freeze({
      minOpacity: 0.74,
      maxOpacity: 1,
      minScale: 1,
      maxScale: 1,
      filter: buildDropShadowFilter(9, 22),
      filterMin: buildDropShadowFilter(6, 14),
      filterMax: buildDropShadowFilter(12, 28),
      strokeWidthBoostPx: 1.2,
      outlineWidthBoostPx: 3.2,
      outlineBaseOpacityFloor: 0.66,
      outlinePulseMinOpacityFloor: 0.48,
      outlinePulseMaxOpacityFloor: 0.96,
      outlineWidthDownPxFloor: 1.1,
      outlineWidthUpPxFloor: 2,
    }),
    bull: Object.freeze({
      minOpacity: 0.7,
      maxOpacity: 0.98,
      minScale: 1,
      maxScale: 1,
      filter: buildDropShadowFilter(8, 18),
      filterMin: buildDropShadowFilter(5, 12),
      filterMax: buildDropShadowFilter(10, 24),
      strokeWidthBoostPx: 1,
      outlineWidthBoostPx: 2.2,
      outlineBaseOpacityFloor: 0.64,
      outlinePulseMinOpacityFloor: 0.44,
      outlinePulseMaxOpacityFloor: 0.94,
      outlineWidthDownPxFloor: 0.95,
      outlineWidthUpPxFloor: 1.7,
    }),
  }),
  blink: Object.freeze({
    base: Object.freeze({
      minOpacity: 0.22,
      maxOpacity: 0.96,
      minScale: 1,
      maxScale: 1,
      filter: buildDropShadowFilter(4, 10),
      filterMin: "none",
      filterMax: buildDropShadowFilter(5, 12),
      outlineBaseOpacityFloor: 0.48,
      outlinePulseMinOpacityFloor: 0.26,
      outlinePulseMaxOpacityFloor: 0.82,
      outlineWidthDownPxFloor: 0.8,
      outlineWidthUpPxFloor: 1.4,
    }),
    outer: Object.freeze({
      minOpacity: 0.28,
      maxOpacity: 1,
      minScale: 1,
      maxScale: 1,
      filter: buildDropShadowFilter(6, 14),
      filterMin: "none",
      filterMax: buildDropShadowFilter(7, 16),
      strokeWidthBoostPx: 0.9,
      outlineWidthBoostPx: 2.4,
      outlineBaseOpacityFloor: 0.56,
      outlinePulseMinOpacityFloor: 0.34,
      outlinePulseMaxOpacityFloor: 0.92,
      outlineWidthDownPxFloor: 0.95,
      outlineWidthUpPxFloor: 1.75,
    }),
    bull: Object.freeze({
      minOpacity: 0.26,
      maxOpacity: 0.98,
      minScale: 1,
      maxScale: 1,
      filter: buildDropShadowFilter(5, 12),
      filterMin: "none",
      filterMax: buildDropShadowFilter(6, 14),
      strokeWidthBoostPx: 0.7,
      outlineWidthBoostPx: 1.8,
      outlineBaseOpacityFloor: 0.54,
      outlinePulseMinOpacityFloor: 0.32,
      outlinePulseMaxOpacityFloor: 0.88,
      outlineWidthDownPxFloor: 0.9,
      outlineWidthUpPxFloor: 1.5,
    }),
  }),
});

const ROUTE_PRIORITY_PROFILES = Object.freeze([
  Object.freeze({
    opacityEmphasis: 1,
    motionEmphasis: 1,
    outlineEmphasis: 1,
    animationDelayMs: 0,
  }),
  Object.freeze({
    opacityEmphasis: 0.8,
    motionEmphasis: 0.62,
    outlineEmphasis: 0.78,
    animationDelayMs: -140,
  }),
  Object.freeze({
    opacityEmphasis: 0.64,
    motionEmphasis: 0.42,
    outlineEmphasis: 0.62,
    animationDelayMs: -280,
  }),
]);

function resolvePreset(presets, presetKey, fallbackKey) {
  const normalized = String(presetKey || "").trim().toLowerCase();
  return presets[normalized] || presets[fallbackKey];
}

export function resolveBoardTargetVisualConfig(featureConfig = {}) {
  const effect = String(featureConfig.effect || "").trim().toLowerCase();
  const resolvedEffect = Object.prototype.hasOwnProperty.call(EFFECT_CLASSES, effect)
    ? effect
    : "pulse";

  return {
    effect: resolvedEffect,
    singleRing: ["inner", "outer", "both"].includes(
      String(featureConfig.singleRing || "").trim().toLowerCase()
    )
      ? String(featureConfig.singleRing || "").trim().toLowerCase()
      : "both",
    strokeWidthRatio: 0.008,
    animationMs: 1000,
    edgePaddingPx: 1,
    theme: resolvePreset(BOARD_THEME_PRESETS, featureConfig.colorTheme, "violet"),
    effectProfiles: EFFECT_STYLE_PROFILES,
    routePriorityProfiles: ROUTE_PRIORITY_PROFILES,
    outlineIntensity: resolvePreset(
      OUTLINE_INTENSITY_PRESETS,
      featureConfig.outlineIntensity,
      "standard"
    ),
  };
}

export function buildStyleText() {
  return `
.${TARGET_CLASS} {
  fill: var(--ad-ext-target-color);
  stroke: var(--ad-ext-target-stroke);
  stroke-width: var(--ad-ext-target-stroke-width);
  transform-box: fill-box;
  transform-origin: center;
  opacity: 0.9;
  filter: var(--ad-ext-target-filter, none);
  pointer-events: none;
  will-change: opacity, transform, filter;
}

.${OUTLINE_CLASS} {
  fill: none;
  stroke: rgba(255, 255, 255, var(--ad-ext-target-outline-stroke-alpha));
  stroke-width: var(--ad-ext-target-outline-width);
  opacity: var(--ad-ext-target-outline-base-opacity);
  pointer-events: none;
  animation: ad-ext-checkout-outline-pulse var(--ad-ext-target-duration) ease-in-out infinite;
  animation-delay: var(--ad-ext-target-animation-delay, 0ms);
  will-change: stroke-width, stroke-opacity;
}

.${EFFECT_CLASSES.pulse} {
  animation: ad-ext-checkout-pulse var(--ad-ext-target-duration) cubic-bezier(0.42, 0, 0.22, 1) infinite;
  animation-delay: var(--ad-ext-target-animation-delay, 0ms);
}

.${EFFECT_CLASSES.blink} {
  animation: ad-ext-checkout-blink var(--ad-ext-target-duration) linear infinite;
  animation-delay: var(--ad-ext-target-animation-delay, 0ms);
}

.${EFFECT_CLASSES.glow} {
  animation: ad-ext-checkout-glow var(--ad-ext-target-duration) ease-in-out infinite;
  animation-delay: var(--ad-ext-target-animation-delay, 0ms);
  filter: var(--ad-ext-target-glow-filter-min, var(--ad-ext-target-filter, none));
}

@keyframes ad-ext-checkout-pulse {
  0% {
    opacity: var(--ad-ext-target-pulse-min-opacity, 0.25);
    transform: scale(var(--ad-ext-target-pulse-min-scale, 0.98));
  }
  50% {
    opacity: var(--ad-ext-target-pulse-max-opacity, 1);
    transform: scale(var(--ad-ext-target-pulse-max-scale, 1.02));
  }
  100% {
    opacity: var(--ad-ext-target-pulse-min-opacity, 0.25);
    transform: scale(var(--ad-ext-target-pulse-min-scale, 0.98));
  }
}

@keyframes ad-ext-checkout-blink {
  0%,
  16% {
    opacity: var(--ad-ext-target-pulse-min-opacity, 0.22);
    filter: var(--ad-ext-target-blink-filter-min, none);
  }
  30%,
  54% {
    opacity: var(--ad-ext-target-pulse-max-opacity, 1);
    filter: var(--ad-ext-target-blink-filter-max, none);
  }
  62% {
    opacity: calc(
      (var(--ad-ext-target-pulse-min-opacity, 0.22) + var(--ad-ext-target-pulse-max-opacity, 1)) / 2
    );
    filter: var(--ad-ext-target-blink-filter-min, none);
  }
  72%,
  100% {
    opacity: var(--ad-ext-target-pulse-min-opacity, 0.22);
    filter: var(--ad-ext-target-blink-filter-min, none);
  }
}

@keyframes ad-ext-checkout-glow {
  0%,
  100% {
    opacity: var(--ad-ext-target-pulse-min-opacity, 0.66);
    filter: var(--ad-ext-target-glow-filter-min, none);
  }
  50% {
    opacity: var(--ad-ext-target-pulse-max-opacity, 1);
    filter: var(--ad-ext-target-glow-filter-max, var(--ad-ext-target-filter, none));
  }
}

@keyframes ad-ext-checkout-outline-pulse {
  0% {
    stroke-opacity: var(--ad-ext-target-outline-pulse-min-opacity);
    stroke-width: calc(var(--ad-ext-target-outline-width) - var(--ad-ext-target-outline-width-down-px));
  }
  50% {
    stroke-opacity: var(--ad-ext-target-outline-pulse-max-opacity);
    stroke-width: calc(var(--ad-ext-target-outline-width) + var(--ad-ext-target-outline-width-up-px));
  }
  100% {
    stroke-opacity: var(--ad-ext-target-outline-pulse-min-opacity);
    stroke-width: calc(var(--ad-ext-target-outline-width) - var(--ad-ext-target-outline-width-down-px));
  }
}
`;
}
