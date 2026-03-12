export const SVG_NS = "http://www.w3.org/2000/svg";
export const STYLE_ID = "ad-ext-cricket-highlighter-style";
export const OVERLAY_ID = "ad-ext-cricket-targets";
export const TARGET_CLASS = "ad-ext-cricket-target";
export const TARGET_SLOT_CLASS_PREFIX = "ad-ext-cricket-slot-";
export const PRESSURE_SUPPRESSED_CLASS = "ad-ext-cricket-pressure-muted";
export const STYLE_CONTRACT_VERSION = "cricket-highlighter-style/v1";
export const PRESENTATION_CLASS = Object.freeze({
  open: "is-open",
  closed: "is-dead",
  dead: "is-dead",
  inactive: "is-inactive",
  scoring: "is-scoring",
  offense: "is-scoring",
  danger: "is-pressure",
  pressure: "is-pressure",
});
const STYLE_CONTRACT_SELECTORS = Object.freeze([
  `.${TARGET_CLASS}.${PRESENTATION_CLASS.open}`,
  `.${TARGET_CLASS}.${PRESENTATION_CLASS.dead}`,
  `.${TARGET_CLASS}.${PRESENTATION_CLASS.inactive}`,
  `.${TARGET_CLASS}.${PRESENTATION_CLASS.scoring}`,
  `.${TARGET_CLASS}.${PRESENTATION_CLASS.pressure}`,
]);

const BASE_COLOR = Object.freeze({ r: 90, g: 90, b: 90 });
const MUTED_COLOR = Object.freeze({ r: 33, g: 33, b: 33 });
const DEAD_COLOR = Object.freeze({ r: 112, g: 118, b: 128 });

const THEME_PRESETS = Object.freeze({
  standard: {
    scoring: { r: 0, g: 178, b: 135 },
    pressure: { r: 239, g: 68, b: 68 },
  },
  ["high-contrast"]: {
    scoring: { r: 34, g: 197, b: 94 },
    pressure: { r: 239, g: 68, b: 68 },
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
  const showOpenObjectives =
    featureConfig.showOpenObjectives === true ||
    featureConfig.showOpenTargets === true;
  const showDeadObjectives =
    featureConfig.showDeadObjectives !== false &&
    featureConfig.showDeadTargets !== false;
  const dimIrrelevantBoardTargets = featureConfig.dimIrrelevantBoardTargets !== false;

  return {
    theme,
    intensity,
    baseColor: BASE_COLOR,
    mutedColor: MUTED_COLOR,
    deadColor: DEAD_COLOR,
    strokeWidthRatio: 0.006,
    edgePaddingPx: 0.8,
    showOpenObjectives,
    showDeadObjectives,
    dimIrrelevantBoardTargets,
    // Runtime aliases for compatibility with legacy callsites/tests.
    showOpenTargets: showOpenObjectives,
    showDeadTargets: showDeadObjectives,
  };
}

export function readStyleContractStatus(styleNodeOrCssText) {
  const cssText =
    typeof styleNodeOrCssText === "string"
      ? styleNodeOrCssText
      : String(styleNodeOrCssText?.textContent || "");
  const missingSelectors = STYLE_CONTRACT_SELECTORS.filter((selector) => !cssText.includes(selector));
  return {
    ok: missingSelectors.length === 0,
    missingSelectors,
    version: STYLE_CONTRACT_VERSION,
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

.${TARGET_CLASS}.${PRESENTATION_CLASS.scoring} {
  --ad-ext-cricket-fill: var(--ad-ext-cricket-scoring-fill);
  --ad-ext-cricket-stroke: var(--ad-ext-cricket-scoring-stroke);
  --ad-ext-cricket-opacity: var(--ad-ext-cricket-scoring-opacity);
}

.${TARGET_CLASS}.${PRESENTATION_CLASS.pressure} {
  --ad-ext-cricket-fill: var(--ad-ext-cricket-pressure-fill);
  --ad-ext-cricket-stroke: var(--ad-ext-cricket-pressure-stroke);
  --ad-ext-cricket-opacity: var(--ad-ext-cricket-pressure-opacity);
}

.${TARGET_CLASS}.${PRESENTATION_CLASS.pressure}.${PRESSURE_SUPPRESSED_CLASS} {
  --ad-ext-cricket-fill: transparent;
  --ad-ext-cricket-stroke: transparent;
  --ad-ext-cricket-opacity: 0;
}
`;
}
