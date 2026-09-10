export const STYLE_ID = "autodarts-average-trend-style";
export const ARROW_CLASS = "ad-ext-avg-trend-arrow";
export const VISIBLE_CLASS = "ad-ext-avg-trend-visible";
export const UP_CLASS = "ad-ext-avg-trend-up";
export const DOWN_CLASS = "ad-ext-avg-trend-down";
export const ANIMATE_CLASS = "ad-ext-avg-trend-animate";
export const ARROW_MARGIN_LEFT_VAR = "--ad-ext-avg-trend-margin-left-base";
export const ARROW_HALF_WIDTH_VAR = "--ad-ext-avg-trend-arrow-half-width-base";
export const ARROW_HEIGHT_VAR = "--ad-ext-avg-trend-arrow-height-base";

const SIZE_PRESETS = Object.freeze({
  klein: {
    marginLeft: "0.18em",
    arrowHalfWidth: "0.25em",
    arrowHeight: "0.4em",
  },
  standard: {
    marginLeft: "0.24em",
    arrowHalfWidth: "0.32em",
    arrowHeight: "0.52em",
  },
  gross: {
    marginLeft: "0.3em",
    arrowHalfWidth: "0.4em",
    arrowHeight: "0.66em",
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

export function resolveAvgTrendArrowSize(size) {
  return { ...resolveSize(size) };
}

export function resolveAvgTrendArrowDuration(value) {
  return resolveDuration(value);
}

export function buildStyleText(options = {}) {
  const durationMs = resolveDuration(options.durationMs);
  const size = resolveSize(options.size);

  return `
.${ARROW_CLASS} {
  ${ARROW_MARGIN_LEFT_VAR}: ${size.marginLeft};
  ${ARROW_HALF_WIDTH_VAR}: ${size.arrowHalfWidth};
  ${ARROW_HEIGHT_VAR}: ${size.arrowHeight};
  display: inline-block;
  width: 0;
  height: 0;
  margin-left: var(${ARROW_MARGIN_LEFT_VAR});
  vertical-align: 0.08em;
  pointer-events: none;
  filter: drop-shadow(0 0 2px rgb(0 0 0 / 0.28));
  opacity: 0;
  transition: opacity 120ms ease-out;
}

.${VISIBLE_CLASS} {
  opacity: 1;
}

.${UP_CLASS} {
  border-left: var(${ARROW_HALF_WIDTH_VAR}) solid transparent;
  border-right: var(${ARROW_HALF_WIDTH_VAR}) solid transparent;
  border-bottom: var(${ARROW_HEIGHT_VAR}) solid #9fdb58;
}

.${DOWN_CLASS} {
  border-left: var(${ARROW_HALF_WIDTH_VAR}) solid transparent;
  border-right: var(${ARROW_HALF_WIDTH_VAR}) solid transparent;
  border-top: var(${ARROW_HEIGHT_VAR}) solid #f87171;
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
