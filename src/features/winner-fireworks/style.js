export const STYLE_ID = "ad-ext-winner-fireworks-style";
export const OVERLAY_ID = "ad-ext-winner-fireworks";

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

export function resolveWinnerVisualConfig(featureConfig = {}) {
  const colorTheme = String(featureConfig.colorTheme || "").trim().toLowerCase();
  const intensity = String(featureConfig.intensity || "").trim().toLowerCase();
  const style = String(featureConfig.style || "").trim().toLowerCase();

  return {
    style: ["realistic", "fireworks", "cannon", "victorystorm", "stars", "sides"].includes(style)
      ? style
      : "realistic",
    colorTheme: COLOR_THEMES[colorTheme] ? colorTheme : "autodarts",
    colors: COLOR_THEMES[colorTheme] || COLOR_THEMES.autodarts,
    intensity: INTENSITY_PRESETS[intensity] ? intensity : "standard",
    intensityPreset: INTENSITY_PRESETS[intensity] || INTENSITY_PRESETS.standard,
    includeBullOut: featureConfig.includeBullOut !== false,
    pointerDismiss: featureConfig.pointerDismiss !== false,
  };
}
