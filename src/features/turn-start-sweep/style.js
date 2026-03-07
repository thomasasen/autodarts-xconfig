export const STYLE_ID = "ad-ext-turn-start-sweep-style";
export const SWEEP_CLASS = "ad-ext-turn-start-sweep";

const SWEEP_STYLE_PRESETS = Object.freeze({
  subtle: {
    sweepWidth: "36%",
    sweepColor: "rgba(255, 255, 255, 0.24)",
  },
  standard: {
    sweepWidth: "45%",
    sweepColor: "rgba(255, 255, 255, 0.35)",
  },
  strong: {
    sweepWidth: "58%",
    sweepColor: "rgba(255, 255, 255, 0.48)",
  },
});

const ALLOWED_DURATIONS = new Set([300, 420, 620]);

export function resolveTurnStartSweepConfig(featureConfig = {}) {
  const numericDuration = Number(featureConfig.durationMs);
  const durationMs = ALLOWED_DURATIONS.has(numericDuration) ? numericDuration : 420;
  const styleKey = String(featureConfig.sweepStyle || "").trim().toLowerCase();
  const stylePreset = SWEEP_STYLE_PRESETS[styleKey] || SWEEP_STYLE_PRESETS.standard;

  return {
    durationMs,
    sweepWidth: stylePreset.sweepWidth,
    sweepColor: stylePreset.sweepColor,
    sweepDelayMs: 0,
  };
}

export function buildStyleText(config = {}) {
  const durationMs = Number(config.durationMs) || 420;
  const sweepDelayMs = Number(config.sweepDelayMs) || 0;
  const sweepWidth = String(config.sweepWidth || "45%");
  const sweepColor = String(config.sweepColor || "rgba(255, 255, 255, 0.35)");

  return `
.${SWEEP_CLASS} {
  position: relative;
  overflow: hidden;
}

.${SWEEP_CLASS}::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: ${sweepWidth};
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0) 0%,
    ${sweepColor} 50%,
    rgba(255, 255, 255, 0) 100%
  );
  transform: translateX(-140%);
  animation: ad-ext-turn-start-sweep ${durationMs}ms ease-out ${sweepDelayMs}ms 1;
  pointer-events: none;
}

@keyframes ad-ext-turn-start-sweep {
  0% { transform: translateX(-140%); opacity: 0; }
  15% { opacity: 1; }
  100% { transform: translateX(240%); opacity: 0; }
}
`;
}
