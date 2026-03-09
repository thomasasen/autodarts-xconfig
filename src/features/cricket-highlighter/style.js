export const SVG_NS = "http://www.w3.org/2000/svg";
export const STYLE_ID = "ad-ext-cricket-highlighter-style";
export const OVERLAY_ID = "ad-ext-cricket-targets";
export const TARGET_CLASS = "ad-ext-cricket-target";
export const PRESENTATION_CLASS = Object.freeze({
  open: "is-open",
  closed: "is-closed",
  dead: "is-dead",
  inactive: "is-inactive",
  offense: "is-offense",
  danger: "is-danger",
  pressure: "is-pressure",
});

const THEME_PRESETS = Object.freeze({
  standard: {
    open: "rgba(68, 124, 146, 0.18)",
    openStroke: "rgba(154, 221, 244, 0.38)",
    closed: "rgba(92, 108, 130, 0.38)",
    closedStroke: "rgba(205, 218, 235, 0.42)",
    dead: "rgba(70, 77, 87, 0.34)",
    deadStroke: "rgba(176, 186, 198, 0.36)",
    inactive: "rgba(58, 71, 86, 0.26)",
    inactiveStroke: "rgba(150, 165, 182, 0.26)",
    offense: "rgba(0, 178, 135, 0.28)",
    offenseStroke: "rgba(94, 255, 208, 0.84)",
    danger: "rgba(239, 68, 68, 0.26)",
    dangerStroke: "rgba(255, 144, 144, 0.86)",
    pressure: "rgba(249, 115, 22, 0.28)",
    pressureStroke: "rgba(255, 201, 146, 0.84)",
    stroke: "rgba(255, 255, 255, 0.78)",
  },
  ["high-contrast"]: {
    open: "rgba(110, 128, 148, 0.22)",
    openStroke: "rgba(229, 237, 245, 0.46)",
    closed: "rgba(118, 136, 162, 0.46)",
    closedStroke: "rgba(235, 242, 251, 0.56)",
    dead: "rgba(84, 95, 112, 0.4)",
    deadStroke: "rgba(197, 208, 222, 0.48)",
    inactive: "rgba(77, 90, 109, 0.32)",
    inactiveStroke: "rgba(183, 197, 214, 0.34)",
    offense: "rgba(34, 197, 94, 0.34)",
    offenseStroke: "rgba(149, 255, 188, 0.92)",
    danger: "rgba(239, 68, 68, 0.32)",
    dangerStroke: "rgba(255, 176, 176, 0.92)",
    pressure: "rgba(245, 158, 11, 0.34)",
    pressureStroke: "rgba(255, 224, 168, 0.9)",
    stroke: "rgba(255, 255, 255, 0.9)",
  },
});

const INTENSITY_PRESETS = Object.freeze({
  subtle: {
    opacityByPresentation: {
      open: 0.42,
      closed: 0.74,
      dead: 0.7,
      inactive: 0.62,
      offense: 0.94,
      danger: 0.92,
      pressure: 0.9,
    },
    pulseMs: 1300,
  },
  normal: {
    opacityByPresentation: {
      open: 0.5,
      closed: 0.82,
      dead: 0.78,
      inactive: 0.68,
      offense: 1,
      danger: 0.98,
      pressure: 0.96,
    },
    pulseMs: 1100,
  },
  strong: {
    opacityByPresentation: {
      open: 0.58,
      closed: 0.9,
      dead: 0.86,
      inactive: 0.76,
      offense: 1,
      danger: 1,
      pressure: 1,
    },
    pulseMs: 900,
  },
});

export function resolveCricketVisualConfig(featureConfig = {}) {
  const themeKey = String(featureConfig.colorTheme || "").trim().toLowerCase();
  const intensityKey = String(featureConfig.intensity || "").trim().toLowerCase();
  const theme = THEME_PRESETS[themeKey] || THEME_PRESETS.standard;
  const intensity = INTENSITY_PRESETS[intensityKey] || INTENSITY_PRESETS.normal;

  return {
    theme,
    intensity,
    strokeWidthRatio: 0.006,
    edgePaddingPx: 0.8,
    showOpenTargets: featureConfig.showOpenTargets !== false,
    showDeadTargets: featureConfig.showDeadTargets !== false,
  };
}

export function buildStyleText() {
  return `
.${TARGET_CLASS} {
  fill: var(--ad-ext-cricket-fill, transparent);
  stroke: var(--ad-ext-cricket-stroke, transparent);
  stroke-width: var(--ad-ext-cricket-stroke-width, 1px);
  opacity: var(--ad-ext-cricket-opacity, 0.25);
  pointer-events: none;
  transform-box: fill-box;
  transform-origin: center;
  vector-effect: non-scaling-stroke;
  transition: opacity 180ms ease, filter 180ms ease;
}

.${TARGET_CLASS}.${PRESENTATION_CLASS.open} {
  --ad-ext-cricket-fill: var(--ad-ext-cricket-open-fill);
  --ad-ext-cricket-stroke: var(--ad-ext-cricket-open-stroke);
  --ad-ext-cricket-opacity: var(--ad-ext-cricket-open-opacity);
  animation: none;
  filter: saturate(0.84) brightness(0.9);
}

.${TARGET_CLASS}.${PRESENTATION_CLASS.closed} {
  --ad-ext-cricket-fill: var(--ad-ext-cricket-closed-fill);
  --ad-ext-cricket-stroke: var(--ad-ext-cricket-closed-stroke);
  --ad-ext-cricket-opacity: var(--ad-ext-cricket-closed-opacity);
  animation: none;
  filter: saturate(0.88) brightness(0.9);
}

.${TARGET_CLASS}.${PRESENTATION_CLASS.dead} {
  --ad-ext-cricket-fill: var(--ad-ext-cricket-dead-fill);
  --ad-ext-cricket-stroke: var(--ad-ext-cricket-dead-stroke);
  --ad-ext-cricket-opacity: var(--ad-ext-cricket-dead-opacity);
  animation: none;
  filter: grayscale(0.72) saturate(0.54) brightness(0.82);
}

.${TARGET_CLASS}.${PRESENTATION_CLASS.inactive} {
  --ad-ext-cricket-fill: var(--ad-ext-cricket-inactive-fill);
  --ad-ext-cricket-stroke: var(--ad-ext-cricket-inactive-stroke);
  --ad-ext-cricket-opacity: var(--ad-ext-cricket-inactive-opacity);
  animation: none;
  filter: saturate(0.7) brightness(0.84);
}

.${TARGET_CLASS}.${PRESENTATION_CLASS.offense} {
  --ad-ext-cricket-fill: var(--ad-ext-cricket-offense-fill);
  --ad-ext-cricket-stroke: var(--ad-ext-cricket-offense-stroke);
  --ad-ext-cricket-opacity: var(--ad-ext-cricket-offense-opacity);
  animation: ad-ext-cricket-target-pulse var(--ad-ext-cricket-pulse-ms, 1100ms) ease-in-out infinite;
  filter: drop-shadow(0 0 6px rgba(34, 255, 179, 0.28)) saturate(1.12);
}

.${TARGET_CLASS}.${PRESENTATION_CLASS.danger} {
  --ad-ext-cricket-fill: var(--ad-ext-cricket-danger-fill);
  --ad-ext-cricket-stroke: var(--ad-ext-cricket-danger-stroke);
  --ad-ext-cricket-opacity: var(--ad-ext-cricket-danger-opacity);
  animation: ad-ext-cricket-target-pulse calc(var(--ad-ext-cricket-pulse-ms, 1100ms) + 80ms) ease-in-out infinite;
  filter: drop-shadow(0 0 7px rgba(255, 132, 132, 0.3)) saturate(1.08);
}

.${TARGET_CLASS}.${PRESENTATION_CLASS.pressure} {
  --ad-ext-cricket-fill: var(--ad-ext-cricket-pressure-fill);
  --ad-ext-cricket-stroke: var(--ad-ext-cricket-pressure-stroke);
  --ad-ext-cricket-opacity: var(--ad-ext-cricket-pressure-opacity);
  animation: ad-ext-cricket-target-pulse calc(var(--ad-ext-cricket-pulse-ms, 1100ms) + 40ms) ease-in-out infinite;
  filter: drop-shadow(0 0 7px rgba(255, 179, 107, 0.3)) saturate(1.08);
}

@keyframes ad-ext-cricket-target-pulse {
  0% { opacity: calc(var(--ad-ext-cricket-opacity, 1) * 0.62); transform: scale(0.985); }
  50% { opacity: var(--ad-ext-cricket-opacity, 1); transform: scale(1.02); }
  100% { opacity: calc(var(--ad-ext-cricket-opacity, 1) * 0.62); transform: scale(0.985); }
}
`;
}
