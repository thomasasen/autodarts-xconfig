export const STYLE_ID = "autodarts-average-trend-style";
export const ARROW_CLASS = "ad-ext-avg-trend-arrow";
export const VISIBLE_CLASS = "ad-ext-avg-trend-visible";
export const UP_CLASS = "ad-ext-avg-trend-up";
export const DOWN_CLASS = "ad-ext-avg-trend-down";
export const ANIMATE_CLASS = "ad-ext-avg-trend-animate";

const SIZE_PRESETS = Object.freeze({
  klein: {
    marginLeftPx: 4,
    arrowHalfWidthPx: 4,
    arrowHeightPx: 6,
  },
  standard: {
    marginLeftPx: 6,
    arrowHalfWidthPx: 5,
    arrowHeightPx: 8,
  },
  gross: {
    marginLeftPx: 8,
    arrowHalfWidthPx: 6,
    arrowHeightPx: 10,
  },
});

function resolveSize(size) {
  const normalized = String(size || "").trim().toLowerCase();
  return SIZE_PRESETS[normalized] || SIZE_PRESETS.standard;
}

function resolveDuration(value) {
  const numeric = Number(value);
  if ([220, 320, 500].includes(numeric)) {
    return numeric;
  }
  return 320;
}

export function buildStyleText(options = {}) {
  const durationMs = resolveDuration(options.durationMs);
  const size = resolveSize(options.size);

  return `
.${ARROW_CLASS} {
  display: inline-block;
  width: 0;
  height: 0;
  margin-left: ${size.marginLeftPx}px;
  vertical-align: middle;
  opacity: 0;
  transition: opacity 120ms ease-out;
}

.${VISIBLE_CLASS} {
  opacity: 1;
}

.${UP_CLASS} {
  border-left: ${size.arrowHalfWidthPx}px solid transparent;
  border-right: ${size.arrowHalfWidthPx}px solid transparent;
  border-bottom: ${size.arrowHeightPx}px solid #9fdb58;
}

.${DOWN_CLASS} {
  border-left: ${size.arrowHalfWidthPx}px solid transparent;
  border-right: ${size.arrowHalfWidthPx}px solid transparent;
  border-top: ${size.arrowHeightPx}px solid #f87171;
}

.${ANIMATE_CLASS} {
  animation: ad-ext-avg-bounce ${durationMs}ms ease-out 1;
}

@keyframes ad-ext-avg-bounce {
  0% { transform: scale(0.9); opacity: 0.5; }
  60% { transform: scale(1.2); opacity: 1; }
  100% { transform: scale(1); opacity: 0.95; }
}
`;
}
