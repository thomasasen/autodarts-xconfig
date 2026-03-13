export const SVG_NS = "http://www.w3.org/2000/svg";
export const STYLE_ID = "ad-ext-checkout-board-style";
export const OVERLAY_ID = "ad-ext-checkout-targets";
export const TARGET_CLASS = "ad-ext-checkout-target";
export const OUTLINE_CLASS = "ad-ext-checkout-target-outline";
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
  pointer-events: none;
}

.${OUTLINE_CLASS} {
  fill: none;
  stroke: rgba(255, 255, 255, var(--ad-ext-target-outline-stroke-alpha));
  stroke-width: var(--ad-ext-target-outline-width);
  opacity: var(--ad-ext-target-outline-base-opacity);
  pointer-events: none;
  animation: ad-ext-checkout-outline-pulse var(--ad-ext-target-duration) ease-in-out infinite;
}

.${EFFECT_CLASSES.pulse} {
  animation:
    ad-ext-checkout-pulse var(--ad-ext-target-duration) ease-in-out infinite,
    ad-ext-checkout-outline-pulse var(--ad-ext-target-duration) ease-in-out infinite;
}

.${EFFECT_CLASSES.blink} {
  animation:
    ad-ext-checkout-blink var(--ad-ext-target-duration) steps(2, end) infinite,
    ad-ext-checkout-outline-pulse var(--ad-ext-target-duration) ease-in-out infinite;
}

.${EFFECT_CLASSES.glow} {
  animation:
    ad-ext-checkout-glow var(--ad-ext-target-duration) ease-in-out infinite,
    ad-ext-checkout-outline-pulse var(--ad-ext-target-duration) ease-in-out infinite;
  filter: drop-shadow(0 0 12px var(--ad-ext-target-color));
}

@keyframes ad-ext-checkout-pulse {
  0% { opacity: 0.25; transform: scale(0.98); }
  50% { opacity: 1; transform: scale(1.02); }
  100% { opacity: 0.25; transform: scale(0.98); }
}

@keyframes ad-ext-checkout-blink {
  0% { opacity: 0.1; }
  50% { opacity: 1; }
  100% { opacity: 0.1; }
}

@keyframes ad-ext-checkout-glow {
  0% { opacity: 0.5; }
  50% { opacity: 1; }
  100% { opacity: 0.5; }
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
