export const STYLE_ID = "ad-ext-winner-celebration-effect-style";
export const OVERLAY_ID = "ad-ext-winner-celebration-effect";

const Z_INDEX = 2147483646;

export function buildStyleText(options = {}) {
  const overlayId = String(options.overlayId || OVERLAY_ID).trim() || OVERLAY_ID;
  return `
#${overlayId} {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  z-index: ${Z_INDEX};
}

#${overlayId} canvas {
  width: 100%;
  height: 100%;
  display: block;
  pointer-events: none;
}
`;
}

export const COLOR_THEMES = Object.freeze({
  autodarts: ["#0c5b9c", "#1267ad", "#1c6fb8", "#374091", "#ffffff"],
  redwhite: ["#ffffff", "#fca5a5", "#ef4444", "#dc2626", "#991b1b"],
  ice: ["#ffffff", "#bae6fd", "#38bdf8", "#0284c7", "#1d4ed8"],
  sunset: ["#ffffff", "#fdba74", "#f97316", "#f43f5e", "#a855f7"],
  neon: ["#ffffff", "#bef264", "#22d3ee", "#f472b6", "#84cc16"],
  gold: ["#ffffff", "#fde68a", "#fbbf24", "#f59e0b", "#b45309"],
});

export const INTENSITY_PRESETS = Object.freeze({
  dezent: {
    particleScale: 0.78,
    intervalScale: 1.18,
    velocityScale: 0.92,
  },
  standard: {
    particleScale: 1,
    intervalScale: 1,
    velocityScale: 1,
  },
  stark: {
    particleScale: 1.24,
    intervalScale: 0.84,
    velocityScale: 1.08,
  },
});

export const PARTICLE_AMOUNT_PRESETS = Object.freeze({
  sparsam: {
    particleScale: 0.35,
  },
  optimiert: {
    particleScale: 0.6,
  },
  voll: {
    particleScale: 1,
  },
});

const STYLE_ALIASES = Object.freeze({
  realistic: "center-side-burst",
  fireworks: "top-fireworks",
  cannon: "center-cannon",
  stars: "star-burst",
  sides: "side-cannons",
});
const STYLE_OPTIONS = Object.freeze([
  "center-side-burst",
  "top-fireworks",
  "center-cannon",
  "triple-burst",
  "star-burst",
  "side-cannons",
]);

function normalizeWinnerStyle(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (STYLE_OPTIONS.includes(normalized)) {
    return normalized;
  }
  return STYLE_ALIASES[normalized] || "center-side-burst";
}

export function resolveWinnerVisualConfig(featureConfig = {}) {
  const colorTheme = String(featureConfig.colorTheme || "").trim().toLowerCase();
  const intensity = String(featureConfig.intensity || "").trim().toLowerCase();
  const particleAmount = String(featureConfig.particleAmount || "").trim().toLowerCase();
  const style = normalizeWinnerStyle(featureConfig.style);
  const durationSeconds = Number(featureConfig.durationSeconds);

  return {
    style,
    colorTheme: COLOR_THEMES[colorTheme] ? colorTheme : "autodarts",
    colors: COLOR_THEMES[colorTheme] || COLOR_THEMES.autodarts,
    intensity: INTENSITY_PRESETS[intensity] ? intensity : "standard",
    intensityPreset: INTENSITY_PRESETS[intensity] || INTENSITY_PRESETS.standard,
    durationSeconds: [1, 2, 5].includes(durationSeconds) ? durationSeconds : 5,
    particleAmount: PARTICLE_AMOUNT_PRESETS[particleAmount] ? particleAmount : "optimiert",
    particleAmountPreset: PARTICLE_AMOUNT_PRESETS[particleAmount] || PARTICLE_AMOUNT_PRESETS.optimiert,
    includeBullOut: featureConfig.includeBullOut !== false,
    pointerDismiss: featureConfig.pointerDismiss !== false,
  };
}
