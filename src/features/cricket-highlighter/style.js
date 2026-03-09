export const SVG_NS = "http://www.w3.org/2000/svg";
export const STYLE_ID = "ad-ext-cricket-highlighter-style";
export const OVERLAY_ID = "ad-ext-cricket-targets";
export const TARGET_CLASS = "ad-ext-cricket-target";

const THEME_PRESETS = Object.freeze({
  standard: {
    open: "rgba(148, 163, 184, 0.1)",
    offense: "rgba(0, 178, 135, 0.42)",
    danger: "rgba(239, 68, 68, 0.42)",
    pressure: "rgba(249, 115, 22, 0.44)",
    closed: "rgba(120, 120, 120, 0.28)",
    dead: "rgba(90, 90, 90, 0.2)",
    stroke: "rgba(255, 255, 255, 0.72)",
  },
  ["high-contrast"]: {
    open: "rgba(148, 163, 184, 0.14)",
    offense: "rgba(34, 197, 94, 0.5)",
    danger: "rgba(239, 68, 68, 0.5)",
    pressure: "rgba(245, 158, 11, 0.52)",
    closed: "rgba(148, 163, 184, 0.34)",
    dead: "rgba(71, 85, 105, 0.28)",
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

@keyframes ad-ext-cricket-target-pulse {
  0% { opacity: calc(var(--ad-ext-cricket-opacity, 1) * 0.62); transform: scale(0.985); }
  50% { opacity: var(--ad-ext-cricket-opacity, 1); transform: scale(1.02); }
  100% { opacity: calc(var(--ad-ext-cricket-opacity, 1) * 0.62); transform: scale(0.985); }
}
`;
}
