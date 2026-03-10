export const STYLE_ID = "ad-ext-cricket-grid-fx-style";

export const ROOT_CLASS = "ad-ext-crfx-root";
export const CELL_CLASS = "ad-ext-crfx-cell";
export const THREAT_CLASS = "ad-ext-crfx-threat";
export const SCORE_CLASS = "ad-ext-crfx-score";
export const DEAD_CLASS = "ad-ext-crfx-dead";
export const PRESSURE_CLASS = "ad-ext-crfx-pressure";
export const LABEL_CLASS = "ad-ext-crfx-label-cell";
export const BADGE_CLASS = "ad-ext-crfx-badge";
export const BADGE_BEACON_CLASS = "ad-ext-crfx-badge-beacon";
export const BADGE_BURST_CLASS = "ad-ext-crfx-badge-burst";
export const MARK_PROGRESS_CLASS = "ad-ext-crfx-mark-progress";
export const MARK_L1_CLASS = "ad-ext-crfx-mark-l1";
export const MARK_L2_CLASS = "ad-ext-crfx-mark-l2";
export const MARK_L3_CLASS = "ad-ext-crfx-mark-l3";
export const ROW_WAVE_CLASS = "ad-ext-crfx-row-wave";
export const DELTA_CLASS = "ad-ext-crfx-delta";
export const SPARK_CLASS = "ad-ext-crfx-spark";
export const WIPE_CLASS = "ad-ext-crfx-wipe";
export const SYNTHETIC_BADGE_ATTRIBUTE = "data-ad-ext-crfx-synthetic-badge";
export const HIDDEN_LABEL_ATTRIBUTE = "data-ad-ext-crfx-label-hidden";

export const LABEL_STATE_CLASS = Object.freeze({
  neutral: "ad-ext-crfx-label-state-neutral",
  scoring: "ad-ext-crfx-label-state-scoring",
  offense: "ad-ext-crfx-label-state-scoring",
  danger: "ad-ext-crfx-label-state-pressure",
  pressure: "ad-ext-crfx-label-state-pressure",
  dead: "ad-ext-crfx-label-state-dead",
});

export const BADGE_STATE_CLASS = Object.freeze({
  neutral: "ad-ext-crfx-badge-state-neutral",
  scoring: "ad-ext-crfx-badge-state-scoring",
  offense: "ad-ext-crfx-badge-state-scoring",
  danger: "ad-ext-crfx-badge-state-pressure",
  pressure: "ad-ext-crfx-badge-state-pressure",
  dead: "ad-ext-crfx-badge-state-dead",
});

const THEME_PRESETS = Object.freeze({
  standard: {
    offense: "0, 178, 135",
    danger: "239, 68, 68",
  },
  "high-contrast": {
    offense: "34, 197, 94",
    danger: "239, 68, 68",
  },
});

const INTENSITY_PRESETS = Object.freeze({
  subtle: {
    highlightOpacity: 0.32,
    strokeBoost: 0.14,
  },
  normal: {
    highlightOpacity: 0.45,
    strokeBoost: 0.2,
  },
  strong: {
    highlightOpacity: 0.62,
    strokeBoost: 0.3,
  },
});

function normalizeBoolean(value, fallbackValue) {
  if (typeof value === "boolean") {
    return value;
  }
  const normalized = String(value || "").trim().toLowerCase();
  if (["1", "true", "yes", "on", "aktiv", "active"].includes(normalized)) {
    return true;
  }
  if (["0", "false", "no", "off", "inaktiv", "inactive"].includes(normalized)) {
    return false;
  }
  return Boolean(fallbackValue);
}

function normalizeThemeKey(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return THEME_PRESETS[normalized] ? normalized : "standard";
}

function normalizeIntensityKey(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return INTENSITY_PRESETS[normalized] ? normalized : "normal";
}

export function resolveCricketGridFxConfig(featureConfig = {}) {
  const themeKey = normalizeThemeKey(featureConfig.colorTheme);
  const intensityKey = normalizeIntensityKey(featureConfig.intensity);

  return {
    rowWave: normalizeBoolean(featureConfig.rowWave, true),
    badgeBeacon: normalizeBoolean(featureConfig.badgeBeacon, true),
    markProgress: normalizeBoolean(featureConfig.markProgress, true),
    threatEdge: normalizeBoolean(featureConfig.threatEdge, true),
    scoringLane: normalizeBoolean(featureConfig.scoringLane, true),
    deadRowCollapse: normalizeBoolean(featureConfig.deadRowCollapse, true),
    deltaChips: normalizeBoolean(featureConfig.deltaChips, true),
    hitSpark: normalizeBoolean(featureConfig.hitSpark, true),
    roundTransitionWipe: normalizeBoolean(featureConfig.roundTransitionWipe, true),
    opponentPressureOverlay: normalizeBoolean(featureConfig.opponentPressureOverlay, true),
    themeKey,
    intensityKey,
    theme: THEME_PRESETS[themeKey],
    intensity: INTENSITY_PRESETS[intensityKey],
  };
}

export function buildStyleText() {
  return `
.${ROOT_CLASS} {
  position: relative;
  isolation: isolate;
  --ad-ext-crfx-offense-rgb: 0, 178, 135;
  --ad-ext-crfx-danger-rgb: 239, 68, 68;
  --ad-ext-crfx-highlight-opacity: 0.45;
  --ad-ext-crfx-stroke-boost: 0.2;
}

.${ROOT_CLASS} .${CELL_CLASS} {
  position: relative;
  overflow: visible;
  transition: filter 180ms ease, opacity 180ms ease, box-shadow 180ms ease, background 180ms ease, transform 180ms ease;
}

.${ROOT_CLASS} .${LABEL_CLASS},
.${ROOT_CLASS} .${BADGE_CLASS} {
  --ad-ext-crfx-badge-bg: rgba(6, 58, 74, 0.72);
  --ad-ext-crfx-badge-border: rgba(127, 214, 247, 0.4);
  --ad-ext-crfx-badge-text: rgba(233, 247, 255, 0.92);
  --ad-ext-crfx-badge-glow: rgba(var(--ad-ext-crfx-offense-rgb), calc(var(--ad-ext-crfx-highlight-opacity) * 0.48));
}

.${ROOT_CLASS} .${LABEL_CLASS} {
  position: relative;
  overflow: hidden;
  transition: box-shadow 180ms ease, background-color 180ms ease, color 180ms ease, filter 180ms ease, opacity 180ms ease;
}

.${ROOT_CLASS} .${LABEL_CLASS}.${LABEL_STATE_CLASS.neutral},
.${ROOT_CLASS} .${BADGE_CLASS}.${BADGE_STATE_CLASS.neutral} {
  --ad-ext-crfx-badge-bg: rgba(6, 58, 74, 0.72);
  --ad-ext-crfx-badge-border: rgba(127, 214, 247, 0.4);
  --ad-ext-crfx-badge-text: rgba(233, 247, 255, 0.92);
}

.${ROOT_CLASS} .${LABEL_CLASS}.${LABEL_STATE_CLASS.scoring},
.${ROOT_CLASS} .${BADGE_CLASS}.${BADGE_STATE_CLASS.scoring} {
  --ad-ext-crfx-badge-bg: rgba(var(--ad-ext-crfx-offense-rgb), calc(var(--ad-ext-crfx-highlight-opacity) * 0.42));
  --ad-ext-crfx-badge-border: rgba(var(--ad-ext-crfx-offense-rgb), calc(var(--ad-ext-crfx-highlight-opacity) + 0.36));
  --ad-ext-crfx-badge-text: #ffffff;
}

.${ROOT_CLASS} .${LABEL_CLASS}.${LABEL_STATE_CLASS.pressure},
.${ROOT_CLASS} .${BADGE_CLASS}.${BADGE_STATE_CLASS.pressure} {
  --ad-ext-crfx-badge-bg: rgba(var(--ad-ext-crfx-danger-rgb), calc(var(--ad-ext-crfx-highlight-opacity) * 0.52));
  --ad-ext-crfx-badge-border: rgba(var(--ad-ext-crfx-danger-rgb), calc(var(--ad-ext-crfx-highlight-opacity) + 0.44));
  --ad-ext-crfx-badge-text: #ffffff;
  --ad-ext-crfx-badge-glow: rgba(var(--ad-ext-crfx-danger-rgb), calc(var(--ad-ext-crfx-highlight-opacity) * 0.74));
}

.${ROOT_CLASS} .${LABEL_CLASS}.${LABEL_STATE_CLASS.dead},
.${ROOT_CLASS} .${BADGE_CLASS}.${BADGE_STATE_CLASS.dead} {
  --ad-ext-crfx-badge-bg: rgba(78, 85, 94, 0.48);
  --ad-ext-crfx-badge-border: rgba(195, 203, 214, 0.42);
  --ad-ext-crfx-badge-text: rgba(206, 214, 224, 0.8);
  --ad-ext-crfx-badge-glow: rgba(173, 181, 189, 0.36);
}

.${ROOT_CLASS} [${HIDDEN_LABEL_ATTRIBUTE}="true"] {
  color: transparent !important;
  text-shadow: none !important;
}

.${ROOT_CLASS} .${LABEL_CLASS}::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  box-shadow: inset 0 0 0 1px var(--ad-ext-crfx-badge-border);
  opacity: 1;
}

.${ROOT_CLASS} .${LABEL_CLASS}::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(
    90deg,
    var(--ad-ext-crfx-badge-bg) 0%,
    rgba(0, 0, 0, 0) 74%
  );
  opacity: 1;
}

.${ROOT_CLASS} .${LABEL_CLASS}.${BADGE_BEACON_CLASS},
.${ROOT_CLASS} .${BADGE_CLASS}.${BADGE_BEACON_CLASS} {
  box-shadow: 0 0 0 1px var(--ad-ext-crfx-badge-border), 0 0 14px var(--ad-ext-crfx-badge-glow);
}

.${ROOT_CLASS} .${BADGE_CLASS} {
  position: absolute !important;
  left: 8px !important;
  top: 50% !important;
  transform: translateY(-50%);
  z-index: 12;
  margin: 0 !important;
  padding: 0 !important;
  border-radius: 0 !important;
  white-space: nowrap;
  pointer-events: none;
  color: var(--ad-ext-crfx-badge-text) !important;
  background-color: var(--ad-ext-crfx-badge-bg) !important;
  border: 1px solid var(--ad-ext-crfx-badge-border);
  box-shadow: none;
  transition: color 160ms ease, background-color 160ms ease, border-color 160ms ease, box-shadow 160ms ease;
}

.${ROOT_CLASS} .${BADGE_CLASS}.${BADGE_BURST_CLASS} {
  animation: ad-ext-crfx-badge-burst 700ms ease;
}

.${ROOT_CLASS} .${CELL_CLASS}.${THREAT_CLASS} {
  box-shadow:
    inset 0 0 0 1px rgba(var(--ad-ext-crfx-danger-rgb), calc(var(--ad-ext-crfx-highlight-opacity) + var(--ad-ext-crfx-stroke-boost))),
    inset 0 0 28px rgba(var(--ad-ext-crfx-danger-rgb), calc(var(--ad-ext-crfx-highlight-opacity) * 0.3)) !important;
  background:
    linear-gradient(
      90deg,
      rgba(var(--ad-ext-crfx-danger-rgb), calc(var(--ad-ext-crfx-highlight-opacity) * 0.28)) 0%,
      rgba(var(--ad-ext-crfx-danger-rgb), calc(var(--ad-ext-crfx-highlight-opacity) * 0.12)) 100%
    ),
    repeating-linear-gradient(
      135deg,
      rgba(var(--ad-ext-crfx-danger-rgb), calc(var(--ad-ext-crfx-highlight-opacity) * 0.3)) 0px,
      rgba(var(--ad-ext-crfx-danger-rgb), calc(var(--ad-ext-crfx-highlight-opacity) * 0.3)) 8px,
      rgba(var(--ad-ext-crfx-danger-rgb), calc(var(--ad-ext-crfx-highlight-opacity) * 0.1)) 8px,
      rgba(var(--ad-ext-crfx-danger-rgb), calc(var(--ad-ext-crfx-highlight-opacity) * 0.1)) 16px
    ) !important;
}

.${ROOT_CLASS} .${CELL_CLASS}.${SCORE_CLASS} {
  box-shadow:
    inset 0 0 0 1px rgba(var(--ad-ext-crfx-offense-rgb), calc(var(--ad-ext-crfx-highlight-opacity) + var(--ad-ext-crfx-stroke-boost))),
    inset 0 0 24px rgba(var(--ad-ext-crfx-offense-rgb), calc(var(--ad-ext-crfx-highlight-opacity) * 0.24)) !important;
  background:
    linear-gradient(
      90deg,
      rgba(var(--ad-ext-crfx-offense-rgb), calc(var(--ad-ext-crfx-highlight-opacity) * 0.64)) 0%,
      rgba(var(--ad-ext-crfx-offense-rgb), calc(var(--ad-ext-crfx-highlight-opacity) * 0.26)) 100%
    ),
    repeating-linear-gradient(
      135deg,
      rgba(var(--ad-ext-crfx-offense-rgb), calc(var(--ad-ext-crfx-highlight-opacity) * 0.88)) 0px,
      rgba(var(--ad-ext-crfx-offense-rgb), calc(var(--ad-ext-crfx-highlight-opacity) * 0.88)) 8px,
      rgba(var(--ad-ext-crfx-offense-rgb), calc(var(--ad-ext-crfx-highlight-opacity) * 0.38)) 8px,
      rgba(var(--ad-ext-crfx-offense-rgb), calc(var(--ad-ext-crfx-highlight-opacity) * 0.38)) 16px
    ) !important;
}

.${ROOT_CLASS} .${CELL_CLASS}.${DEAD_CLASS} {
  filter: grayscale(0.88) saturate(0.28) brightness(0.76);
  opacity: 0.72;
}

.${ROOT_CLASS} .${CELL_CLASS}.${PRESSURE_CLASS} {
  box-shadow:
    inset 0 0 0 1px rgba(var(--ad-ext-crfx-danger-rgb), calc(var(--ad-ext-crfx-highlight-opacity) + var(--ad-ext-crfx-stroke-boost))),
    inset 0 0 28px rgba(var(--ad-ext-crfx-danger-rgb), calc(var(--ad-ext-crfx-highlight-opacity) * 0.32)) !important;
  background:
    linear-gradient(
      90deg,
      rgba(var(--ad-ext-crfx-danger-rgb), calc(var(--ad-ext-crfx-highlight-opacity) * 0.34)) 0%,
      rgba(var(--ad-ext-crfx-danger-rgb), calc(var(--ad-ext-crfx-highlight-opacity) * 0.16)) 100%
    ),
    repeating-linear-gradient(
      135deg,
      rgba(var(--ad-ext-crfx-danger-rgb), calc(var(--ad-ext-crfx-highlight-opacity) * 0.34)) 0px,
      rgba(var(--ad-ext-crfx-danger-rgb), calc(var(--ad-ext-crfx-highlight-opacity) * 0.34)) 8px,
      rgba(var(--ad-ext-crfx-danger-rgb), calc(var(--ad-ext-crfx-highlight-opacity) * 0.12)) 8px,
      rgba(var(--ad-ext-crfx-danger-rgb), calc(var(--ad-ext-crfx-highlight-opacity) * 0.12)) 16px
    ) !important;
}

.${ROOT_CLASS} .${MARK_PROGRESS_CLASS} {
  transform-origin: center;
  animation: ad-ext-crfx-mark 420ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.${ROOT_CLASS} .${MARK_PROGRESS_CLASS}.${MARK_L1_CLASS} {
  filter: drop-shadow(0 0 4px rgba(var(--ad-ext-crfx-offense-rgb), 0.62));
}

.${ROOT_CLASS} .${MARK_PROGRESS_CLASS}.${MARK_L2_CLASS} {
  filter: drop-shadow(0 0 6px rgba(var(--ad-ext-crfx-offense-rgb), 0.76));
}

.${ROOT_CLASS} .${MARK_PROGRESS_CLASS}.${MARK_L3_CLASS} {
  filter: drop-shadow(0 0 8px rgba(var(--ad-ext-crfx-offense-rgb), 0.92));
}

.${ROOT_CLASS} .${ROW_WAVE_CLASS} {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(
    100deg,
    rgba(0, 0, 0, 0) 0%,
    rgba(var(--ad-ext-crfx-offense-rgb), calc(var(--ad-ext-crfx-highlight-opacity) * 0.48)) 42%,
    rgba(var(--ad-ext-crfx-offense-rgb), calc(var(--ad-ext-crfx-highlight-opacity) * 0.82)) 52%,
    rgba(var(--ad-ext-crfx-offense-rgb), calc(var(--ad-ext-crfx-highlight-opacity) * 0.48)) 62%,
    rgba(0, 0, 0, 0) 100%
  );
  transform: translateX(-110%);
  animation: ad-ext-crfx-row-wave 760ms cubic-bezier(0.2, 0.7, 0.2, 1) forwards;
  z-index: 6;
}

.${ROOT_CLASS} .${DELTA_CLASS} {
  position: absolute;
  top: 4px;
  right: 6px;
  padding: 1px 7px;
  border-radius: 999px;
  font-size: 2.22rem;
  font-weight: 800;
  line-height: 1.3;
  letter-spacing: 0.02em;
  color: #052e16;
  background: rgba(var(--ad-ext-crfx-offense-rgb), 0.95);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.38);
  pointer-events: none;
  z-index: 10;
  animation: ad-ext-crfx-delta 920ms ease forwards;
}

.${ROOT_CLASS} .${SPARK_CLASS} {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 40px;
  height: 40px;
  border-radius: 999px;
  pointer-events: none;
  transform: translate(-50%, -50%) scale(0.2);
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.95) 0%,
    rgba(var(--ad-ext-crfx-offense-rgb), calc(var(--ad-ext-crfx-highlight-opacity) * 1.08)) 34%,
    rgba(var(--ad-ext-crfx-offense-rgb), 0) 72%
  );
  z-index: 9;
  animation: ad-ext-crfx-spark 420ms ease-out forwards;
}

.${ROOT_CLASS} .${WIPE_CLASS} {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 11;
  background: linear-gradient(
    110deg,
    rgba(0, 0, 0, 0) 0%,
    rgba(var(--ad-ext-crfx-offense-rgb), calc(var(--ad-ext-crfx-highlight-opacity) * 0.3)) 38%,
    rgba(var(--ad-ext-crfx-offense-rgb), calc(var(--ad-ext-crfx-highlight-opacity) * 0.76)) 50%,
    rgba(var(--ad-ext-crfx-offense-rgb), calc(var(--ad-ext-crfx-highlight-opacity) * 0.3)) 62%,
    rgba(0, 0, 0, 0) 100%
  );
  transform: translateX(-135%);
  animation: ad-ext-crfx-wipe 720ms cubic-bezier(0.2, 0.7, 0.2, 1) forwards;
}

@keyframes ad-ext-crfx-row-wave {
  0% { transform: translateX(-110%); opacity: 0; }
  15% { opacity: 1; }
  100% { transform: translateX(110%); opacity: 0; }
}

@keyframes ad-ext-crfx-badge-burst {
  0% { transform: translateY(-50%) scale(1); }
  24% { transform: translateY(-50%) scale(1.09); }
  100% { transform: translateY(-50%) scale(1); }
}

@keyframes ad-ext-crfx-mark {
  0% { transform: scale(0.72); opacity: 0.55; }
  45% { transform: scale(1.15); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes ad-ext-crfx-delta {
  0% { transform: translateY(10px) scale(0.86); opacity: 0; }
  15% { transform: translateY(0) scale(1); opacity: 1; }
  80% { transform: translateY(-6px) scale(1); opacity: 1; }
  100% { transform: translateY(-12px) scale(0.9); opacity: 0; }
}

@keyframes ad-ext-crfx-spark {
  0% { transform: translate(-50%, -50%) scale(0.2); opacity: 0; }
  16% { opacity: 1; }
  100% { transform: translate(-50%, -50%) scale(1.45); opacity: 0; }
}

@keyframes ad-ext-crfx-wipe {
  0% { transform: translateX(-135%); opacity: 0; }
  15% { opacity: 1; }
  100% { transform: translateX(135%); opacity: 0; }
}
`;
}
