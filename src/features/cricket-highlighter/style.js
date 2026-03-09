export const SVG_NS = "http://www.w3.org/2000/svg";
export const STYLE_ID = "ad-ext-cricket-highlighter-style";
export const OVERLAY_ID = "ad-ext-cricket-targets";
export const TARGET_CLASS = "ad-ext-cricket-target";

const THEME_PRESETS = Object.freeze({
  standard: {
    open: "rgba(124, 208, 242, 0.08)",
    openStroke: "rgba(164, 221, 247, 0.22)",
    offense: "rgba(0, 178, 135, 0.46)",
    offenseStroke: "rgba(82, 255, 203, 0.68)",
    danger: "rgba(239, 68, 68, 0.44)",
    dangerStroke: "rgba(255, 130, 130, 0.7)",
    pressure: "rgba(249, 115, 22, 0.46)",
    pressureStroke: "rgba(255, 190, 138, 0.68)",
    closed: "rgba(125, 143, 168, 0.24)",
    closedStroke: "rgba(202, 216, 236, 0.3)",
    dead: "rgba(90, 98, 110, 0.2)",
    deadStroke: "rgba(166, 178, 194, 0.26)",
    stroke: "rgba(255, 255, 255, 0.72)",
  },
  ["high-contrast"]: {
    open: "rgba(148, 163, 184, 0.14)",
    openStroke: "rgba(207, 223, 245, 0.32)",
    offense: "rgba(34, 197, 94, 0.56)",
    offenseStroke: "rgba(118, 255, 164, 0.8)",
    danger: "rgba(239, 68, 68, 0.54)",
    dangerStroke: "rgba(255, 154, 154, 0.8)",
    pressure: "rgba(245, 158, 11, 0.56)",
    pressureStroke: "rgba(255, 213, 150, 0.78)",
    closed: "rgba(148, 163, 184, 0.34)",
    closedStroke: "rgba(221, 231, 245, 0.42)",
    dead: "rgba(71, 85, 105, 0.28)",
    deadStroke: "rgba(168, 181, 201, 0.4)",
    stroke: "rgba(255, 255, 255, 0.86)",
  },
});

const INTENSITY_PRESETS = Object.freeze({
  subtle: {
    opacity: 0.82,
    pulseMs: 1300,
  },
  normal: {
    opacity: 0.95,
    pulseMs: 1100,
  },
  strong: {
    opacity: 1,
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
  pointer-events: none;
  transform-box: fill-box;
  transform-origin: center;
  animation: ad-ext-cricket-target-pulse var(--ad-ext-cricket-pulse-ms, 1100ms) ease-in-out infinite;
}

.${TARGET_CLASS}.is-dead,
.${TARGET_CLASS}.is-closed,
.${TARGET_CLASS}.is-open {
  animation: none;
}

.${TARGET_CLASS}.is-open {
  filter: saturate(0.92) brightness(0.94);
}

.${TARGET_CLASS}.is-offense {
  filter: drop-shadow(0 0 4px rgba(34, 255, 179, 0.28));
}

.${TARGET_CLASS}.is-danger,
.${TARGET_CLASS}.is-pressure {
  filter: drop-shadow(0 0 4px rgba(255, 132, 132, 0.24));
}

@keyframes ad-ext-cricket-target-pulse {
  0% { opacity: calc(var(--ad-ext-cricket-opacity, 1) * 0.62); transform: scale(0.985); }
  50% { opacity: var(--ad-ext-cricket-opacity, 1); transform: scale(1.02); }
  100% { opacity: calc(var(--ad-ext-cricket-opacity, 1) * 0.62); transform: scale(0.985); }
}
`;
}
