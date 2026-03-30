export const SVG_NS = "http://www.w3.org/2000/svg";
export const STYLE_ID = "ad-ext-checkout-board-style";
export const OVERLAY_ID = "ad-ext-checkout-targets";
export const TARGET_CLASS = "ad-ext-checkout-target";
export const OUTLINE_CLASS = "ad-ext-checkout-target-outline";
export const TARGET_FAMILY_ATTRIBUTE = "data-target-family";
export const EFFECT_CLASSES = Object.freeze({
  focus: "ad-ext-checkout-target--focus",
  signal: "ad-ext-checkout-target--signal",
  steady: "ad-ext-checkout-target--steady",
});

const BOARD_THEME_PRESETS = Object.freeze({
  violet: {
    color: "rgba(168, 85, 247, 0.34)",
    strokeColor: "rgba(192, 132, 252, 0.96)",
  },
  cyan: {
    color: "rgba(56, 189, 248, 0.34)",
    strokeColor: "rgba(103, 232, 249, 0.96)",
  },
  amber: {
    color: "rgba(245, 158, 11, 0.34)",
    strokeColor: "rgba(251, 191, 36, 0.98)",
  },
});

function buildDropShadowFilter(strokeBlurPx, colorBlurPx) {
  return `drop-shadow(0 0 ${strokeBlurPx}px var(--ad-ext-target-stroke)) drop-shadow(0 0 ${colorBlurPx}px var(--ad-ext-target-color))`;
}

const VISUAL_PRESET_PROFILES = Object.freeze({
  focus: Object.freeze({
    animationMs: 1280,
    outlineIntensity: Object.freeze({
      strokeAlpha: 0.94,
      baseOpacity: 0.62,
      pulseMinOpacity: 0.46,
      pulseMaxOpacity: 0.96,
      widthDownPx: 0.28,
      widthUpPx: 1.02,
    }),
    effectProfiles: Object.freeze({
      base: Object.freeze({
        minOpacity: 0.56,
        maxOpacity: 0.94,
        minScale: 1,
        maxScale: 1,
        filter: buildDropShadowFilter(3, 9),
        filterMin: buildDropShadowFilter(2, 6),
        filterMax: buildDropShadowFilter(4, 12),
        strokeWidthBoostPx: 0.35,
        outlineWidthBoostPx: 0.8,
        outlineBaseOpacityFloor: 0.6,
        outlinePulseMinOpacityFloor: 0.44,
        outlinePulseMaxOpacityFloor: 0.92,
        outlineWidthDownPxFloor: 0.22,
        outlineWidthUpPxFloor: 0.88,
      }),
      outer: Object.freeze({
        minOpacity: 0.64,
        maxOpacity: 1,
        minScale: 1,
        maxScale: 1,
        filter: buildDropShadowFilter(4, 11),
        filterMin: buildDropShadowFilter(3, 8),
        filterMax: buildDropShadowFilter(5, 14),
        strokeWidthBoostPx: 1,
        outlineWidthBoostPx: 2,
        outlineBaseOpacityFloor: 0.68,
        outlinePulseMinOpacityFloor: 0.52,
        outlinePulseMaxOpacityFloor: 0.98,
        outlineWidthDownPxFloor: 0.28,
        outlineWidthUpPxFloor: 1.02,
      }),
      bull: Object.freeze({
        minOpacity: 0.76,
        maxOpacity: 1,
        minScale: 1,
        maxScale: 1,
        filter: buildDropShadowFilter(4, 12),
        filterMin: buildDropShadowFilter(3, 9),
        filterMax: buildDropShadowFilter(6, 15),
        strokeWidthBoostPx: 1.2,
        outlineWidthBoostPx: 2.4,
        outlineBaseOpacityFloor: 0.76,
        outlinePulseMinOpacityFloor: 0.62,
        outlinePulseMaxOpacityFloor: 1,
        outlineWidthDownPxFloor: 0.38,
        outlineWidthUpPxFloor: 1.24,
      }),
    }),
  }),
  signal: Object.freeze({
    animationMs: 920,
    outlineIntensity: Object.freeze({
      strokeAlpha: 0.98,
      baseOpacity: 0.48,
      pulseMinOpacity: 0.22,
      pulseMaxOpacity: 1,
      widthDownPx: 0.18,
      widthUpPx: 1.2,
    }),
    effectProfiles: Object.freeze({
      base: Object.freeze({
        minOpacity: 0.16,
        maxOpacity: 0.98,
        minScale: 1,
        maxScale: 1,
        filter: buildDropShadowFilter(3, 8),
        filterMin: "none",
        filterMax: buildDropShadowFilter(4, 11),
        strokeWidthBoostPx: 0.35,
        outlineWidthBoostPx: 1,
        outlineBaseOpacityFloor: 0.46,
        outlinePulseMinOpacityFloor: 0.22,
        outlinePulseMaxOpacityFloor: 0.96,
        outlineWidthDownPxFloor: 0.14,
        outlineWidthUpPxFloor: 1.02,
      }),
      outer: Object.freeze({
        minOpacity: 0.24,
        maxOpacity: 1,
        minScale: 1,
        maxScale: 1,
        filter: buildDropShadowFilter(4, 10),
        filterMin: "none",
        filterMax: buildDropShadowFilter(5, 13),
        strokeWidthBoostPx: 0.85,
        outlineWidthBoostPx: 2,
        outlineBaseOpacityFloor: 0.5,
        outlinePulseMinOpacityFloor: 0.26,
        outlinePulseMaxOpacityFloor: 1,
        outlineWidthDownPxFloor: 0.16,
        outlineWidthUpPxFloor: 1.1,
      }),
      bull: Object.freeze({
        minOpacity: 0.3,
        maxOpacity: 1,
        minScale: 1,
        maxScale: 1,
        filter: buildDropShadowFilter(4, 11),
        filterMin: "none",
        filterMax: buildDropShadowFilter(6, 15),
        strokeWidthBoostPx: 1.05,
        outlineWidthBoostPx: 2.5,
        outlineBaseOpacityFloor: 0.56,
        outlinePulseMinOpacityFloor: 0.32,
        outlinePulseMaxOpacityFloor: 1,
        outlineWidthDownPxFloor: 0.2,
        outlineWidthUpPxFloor: 1.24,
      }),
    }),
  }),
  steady: Object.freeze({
    animationMs: 1760,
    outlineIntensity: Object.freeze({
      strokeAlpha: 0.88,
      baseOpacity: 0.54,
      pulseMinOpacity: 0.48,
      pulseMaxOpacity: 0.72,
      widthDownPx: 0.1,
      widthUpPx: 0.45,
    }),
    effectProfiles: Object.freeze({
      base: Object.freeze({
        minOpacity: 0.64,
        maxOpacity: 0.82,
        minScale: 1,
        maxScale: 1,
        filter: buildDropShadowFilter(2, 7),
        filterMin: buildDropShadowFilter(2, 6),
        filterMax: buildDropShadowFilter(3, 9),
        outlineBaseOpacityFloor: 0.52,
        outlinePulseMinOpacityFloor: 0.46,
        outlinePulseMaxOpacityFloor: 0.7,
        outlineWidthDownPxFloor: 0.08,
        outlineWidthUpPxFloor: 0.4,
      }),
      outer: Object.freeze({
        minOpacity: 0.7,
        maxOpacity: 0.88,
        minScale: 1,
        maxScale: 1,
        filter: buildDropShadowFilter(3, 8),
        filterMin: buildDropShadowFilter(2, 7),
        filterMax: buildDropShadowFilter(4, 10),
        strokeWidthBoostPx: 0.35,
        outlineWidthBoostPx: 0.85,
        outlineBaseOpacityFloor: 0.56,
        outlinePulseMinOpacityFloor: 0.5,
        outlinePulseMaxOpacityFloor: 0.76,
        outlineWidthDownPxFloor: 0.08,
        outlineWidthUpPxFloor: 0.42,
      }),
      bull: Object.freeze({
        minOpacity: 0.68,
        maxOpacity: 0.86,
        minScale: 1,
        maxScale: 1,
        filter: buildDropShadowFilter(2, 7),
        filterMin: buildDropShadowFilter(2, 6),
        filterMax: buildDropShadowFilter(3, 9),
        strokeWidthBoostPx: 0.2,
        outlineWidthBoostPx: 0.55,
        outlineBaseOpacityFloor: 0.54,
        outlinePulseMinOpacityFloor: 0.48,
        outlinePulseMaxOpacityFloor: 0.74,
        outlineWidthDownPxFloor: 0.08,
        outlineWidthUpPxFloor: 0.36,
      }),
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
    opacityEmphasis: 0.66,
    motionEmphasis: 0.6,
    outlineEmphasis: 0.72,
    animationDelayMs: 120,
  }),
  Object.freeze({
    opacityEmphasis: 0.48,
    motionEmphasis: 0.52,
    outlineEmphasis: 0.58,
    animationDelayMs: 240,
  }),
]);

function resolvePreset(presets, presetKey, fallbackKey) {
  const normalized = String(presetKey || "").trim().toLowerCase();
  return presets[normalized] || presets[fallbackKey];
}

function resolveLegacyVisualPreset(featureConfig = {}) {
  const explicitPreset = String(featureConfig.visualPreset || "").trim().toLowerCase();
  if (Object.prototype.hasOwnProperty.call(EFFECT_CLASSES, explicitPreset)) {
    return explicitPreset;
  }

  const legacyEffect = String(featureConfig.effect || "").trim().toLowerCase();
  if (legacyEffect === "blink") {
    return "signal";
  }
  if (legacyEffect === "glow") {
    return "steady";
  }
  return "focus";
}

export function resolveBoardTargetVisualConfig(featureConfig = {}) {
  const visualPreset = resolveLegacyVisualPreset(featureConfig);
  const presetProfile = VISUAL_PRESET_PROFILES[visualPreset] || VISUAL_PRESET_PROFILES.focus;

  return {
    effect: visualPreset,
    visualPreset,
    singleRing: ["inner", "outer", "both"].includes(
      String(featureConfig.singleRing || "").trim().toLowerCase()
    )
      ? String(featureConfig.singleRing || "").trim().toLowerCase()
      : "inner",
    strokeWidthRatio: 0.0056,
    animationMs: presetProfile.animationMs,
    edgePaddingPx: 0.6,
    theme: resolvePreset(BOARD_THEME_PRESETS, featureConfig.colorTheme, "amber"),
    effectProfiles: {
      [visualPreset]: presetProfile.effectProfiles,
    },
    routePriorityProfiles: ROUTE_PRIORITY_PROFILES,
    outlineIntensity: presetProfile.outlineIntensity,
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
  opacity: 0.82;
  filter: var(--ad-ext-target-filter, none);
  pointer-events: none;
  will-change: opacity, filter;
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

.${EFFECT_CLASSES.focus} {
  animation: ad-ext-checkout-focus var(--ad-ext-target-duration) ease-in-out infinite;
  animation-delay: var(--ad-ext-target-animation-delay, 0ms);
  filter: var(--ad-ext-target-glow-filter-min, var(--ad-ext-target-filter, none));
}

.${EFFECT_CLASSES.signal} {
  animation: ad-ext-checkout-signal var(--ad-ext-target-duration) steps(1, end) infinite;
  animation-delay: var(--ad-ext-target-animation-delay, 0ms);
}

.${EFFECT_CLASSES.steady} {
  animation: ad-ext-checkout-steady var(--ad-ext-target-duration) ease-in-out infinite;
  animation-delay: var(--ad-ext-target-animation-delay, 0ms);
  filter: var(--ad-ext-target-glow-filter-min, var(--ad-ext-target-filter, none));
}

@keyframes ad-ext-checkout-focus {
  0%,
  100% {
    opacity: var(--ad-ext-target-pulse-min-opacity, 0.46);
    filter: var(--ad-ext-target-glow-filter-min, none);
  }
  50% {
    opacity: var(--ad-ext-target-pulse-max-opacity, 0.9);
    filter: var(--ad-ext-target-glow-filter-max, var(--ad-ext-target-filter, none));
  }
}

@keyframes ad-ext-checkout-signal {
  0%,
  18% {
    opacity: var(--ad-ext-target-pulse-min-opacity, 0.12);
    filter: var(--ad-ext-target-blink-filter-min, none);
  }
  24%,
  58% {
    opacity: var(--ad-ext-target-pulse-max-opacity, 1);
    filter: var(--ad-ext-target-blink-filter-max, none);
  }
  64%,
  100% {
    opacity: var(--ad-ext-target-pulse-min-opacity, 0.12);
    filter: var(--ad-ext-target-blink-filter-min, none);
  }
}

@keyframes ad-ext-checkout-steady {
  0%,
  100% {
    opacity: var(--ad-ext-target-pulse-min-opacity, 0.64);
    filter: var(--ad-ext-target-glow-filter-min, none);
  }
  50% {
    opacity: var(--ad-ext-target-pulse-max-opacity, 0.82);
    filter: var(--ad-ext-target-glow-filter-max, var(--ad-ext-target-filter, none));
  }
}

@keyframes ad-ext-checkout-outline-pulse {
  0%,
  100% {
    stroke-opacity: var(--ad-ext-target-outline-pulse-min-opacity);
    stroke-width: calc(var(--ad-ext-target-outline-width) - var(--ad-ext-target-outline-width-down-px));
  }
  50% {
    stroke-opacity: var(--ad-ext-target-outline-pulse-max-opacity);
    stroke-width: calc(var(--ad-ext-target-outline-width) + var(--ad-ext-target-outline-width-up-px));
  }
}
`;
}
