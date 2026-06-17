export const STYLE_ID = "ad-ext-dartboard-marker-highlight-style";
export const BASE_CLASS = "ad-ext-dart-marker";

export const EFFECT_CLASSES = Object.freeze({
  "size-pulse": "ad-ext-dart-marker--size-pulse",
  "soft-glow": "ad-ext-dart-marker--soft-glow",
});

const EFFECT_ALIASES = Object.freeze({
  pulse: "size-pulse",
  glow: "soft-glow",
});

const COLOR_PRESETS = Object.freeze({
  "rgb(49, 130, 206)": "rgb(49, 130, 206)",
  "rgb(34, 197, 94)": "rgb(34, 197, 94)",
  "rgb(248, 113, 113)": "rgb(248, 113, 113)",
  "rgb(250, 204, 21)": "rgb(250, 204, 21)",
  "rgb(255, 255, 255)": "rgb(255, 255, 255)",
});

const OUTLINE_COLORS = Object.freeze({
  aus: "",
  weiss: "rgb(255, 255, 255)",
  schwarz: "rgb(0, 0, 0)",
});

const ALLOWED_SIZES = new Set([4, 6, 9]);
const ALLOWED_OPACITY = new Set([65, 85, 100]);

function normalizeNumberChoice(value, fallbackValue, allowedSet) {
  const numeric = Number(value);
  if (Number.isFinite(numeric) && allowedSet.has(numeric)) {
    return numeric;
  }
  return fallbackValue;
}

function normalizeChoice(value, fallbackValue, allowedValues) {
  const normalized = String(value || "").trim().toLowerCase();
  return allowedValues.includes(normalized) ? normalized : fallbackValue;
}

export function resolveDartboardMarkerHighlightConfig(featureConfig = {}) {
  const markerSize = normalizeNumberChoice(featureConfig.size, 6, ALLOWED_SIZES);
  const opacityPercent = normalizeNumberChoice(featureConfig.opacityPercent, 85, ALLOWED_OPACITY);
  const normalizedEffect = normalizeChoice(featureConfig.effect, "soft-glow", [
    "soft-glow",
    "size-pulse",
    "glow",
    "pulse",
    "none",
  ]);
  const effect = EFFECT_ALIASES[normalizedEffect] || normalizedEffect;
  const outline = normalizeChoice(featureConfig.outline, "aus", ["aus", "weiss", "schwarz"]);
  const markerColorRaw = String(featureConfig.color || "").trim();
  const markerColor = COLOR_PRESETS[markerColorRaw] || "rgb(49, 130, 206)";

  return {
    markerSize,
    markerColor,
    effect,
    opacityPercent,
    opacity: opacityPercent / 100,
    outline,
    outlineColor: OUTLINE_COLORS[outline] || "",
  };
}

export function buildStyleText() {
  return `
.${BASE_CLASS} {
  transform-box: fill-box;
  transform-origin: center;
}

.${EFFECT_CLASSES["size-pulse"]} {
  animation: ad-ext-dart-marker-pulse 1600ms ease-in-out infinite;
}

.${EFFECT_CLASSES["soft-glow"]} {
  animation: ad-ext-dart-marker-glow 1800ms ease-in-out infinite;
}

@keyframes ad-ext-dart-marker-pulse {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.2); opacity: 0.85; }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes ad-ext-dart-marker-glow {
  0% { stroke-width: 2; opacity: 0.9; }
  50% { stroke-width: 5; opacity: 1; }
  100% { stroke-width: 2; opacity: 0.9; }
}
`;
}
