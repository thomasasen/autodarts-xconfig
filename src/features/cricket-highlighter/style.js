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

const BASE_COLOR = Object.freeze({ r: 90, g: 90, b: 90 });
const MUTED_COLOR = Object.freeze({ r: 33, g: 33, b: 33 });

const THEME_PRESETS = Object.freeze({
  standard: {
    offense: { r: 0, g: 178, b: 135 },
    danger: { r: 239, g: 68, b: 68 },
  },
  ["high-contrast"]: {
    offense: { r: 34, g: 197, b: 94 },
    danger: { r: 239, g: 68, b: 68 },
  },
});

const INTENSITY_PRESETS = Object.freeze({
  subtle: {
    open: 0.24,
    closed: 0.68,
    dead: 0.86,
    inactive: 0.66,
    highlightOpacity: 0.32,
    strokeBoost: 0.14,
  },
  normal: {
    open: 0.3,
    closed: 0.8,
    dead: 0.98,
    inactive: 0.8,
    highlightOpacity: 0.45,
    strokeBoost: 0.2,
  },
  strong: {
    open: 0.38,
    closed: 0.92,
    dead: 1,
    inactive: 0.9,
    highlightOpacity: 0.62,
    strokeBoost: 0.3,
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
    baseColor: BASE_COLOR,
    mutedColor: MUTED_COLOR,
    strokeWidthRatio: 0.006,
    edgePaddingPx: 0.8,
    showOpenTargets: featureConfig.showOpenTargets === true,
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
  vector-effect: non-scaling-stroke;
}

.${TARGET_CLASS}.${PRESENTATION_CLASS.open} {
  --ad-ext-cricket-fill: var(--ad-ext-cricket-open-fill);
  --ad-ext-cricket-stroke: var(--ad-ext-cricket-open-stroke);
  --ad-ext-cricket-opacity: var(--ad-ext-cricket-open-opacity);
}

.${TARGET_CLASS}.${PRESENTATION_CLASS.closed} {
  --ad-ext-cricket-fill: var(--ad-ext-cricket-closed-fill);
  --ad-ext-cricket-stroke: var(--ad-ext-cricket-closed-stroke);
  --ad-ext-cricket-opacity: var(--ad-ext-cricket-closed-opacity);
}

.${TARGET_CLASS}.${PRESENTATION_CLASS.dead} {
  --ad-ext-cricket-fill: var(--ad-ext-cricket-dead-fill);
  --ad-ext-cricket-stroke: var(--ad-ext-cricket-dead-stroke);
  --ad-ext-cricket-opacity: var(--ad-ext-cricket-dead-opacity);
}

.${TARGET_CLASS}.${PRESENTATION_CLASS.inactive} {
  --ad-ext-cricket-fill: var(--ad-ext-cricket-inactive-fill);
  --ad-ext-cricket-stroke: var(--ad-ext-cricket-inactive-stroke);
  --ad-ext-cricket-opacity: var(--ad-ext-cricket-inactive-opacity);
}

.${TARGET_CLASS}.${PRESENTATION_CLASS.offense} {
  --ad-ext-cricket-fill: var(--ad-ext-cricket-offense-fill);
  --ad-ext-cricket-stroke: var(--ad-ext-cricket-offense-stroke);
  --ad-ext-cricket-opacity: var(--ad-ext-cricket-offense-opacity);
}

.${TARGET_CLASS}.${PRESENTATION_CLASS.danger} {
  --ad-ext-cricket-fill: var(--ad-ext-cricket-danger-fill);
  --ad-ext-cricket-stroke: var(--ad-ext-cricket-danger-stroke);
  --ad-ext-cricket-opacity: var(--ad-ext-cricket-danger-opacity);
}

.${TARGET_CLASS}.${PRESENTATION_CLASS.pressure} {
  --ad-ext-cricket-fill: var(--ad-ext-cricket-pressure-fill);
  --ad-ext-cricket-stroke: var(--ad-ext-cricket-pressure-stroke);
  --ad-ext-cricket-opacity: var(--ad-ext-cricket-pressure-opacity);
}
`;
}
