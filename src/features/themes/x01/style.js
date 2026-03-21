import { buildThemeCssBundle } from "../shared/theme-style-builder.js";
import { buildPreviewPlacementCss, normalizeBoolean } from "../shared/theme-utils.js";

export const STYLE_ID = "ad-ext-theme-x01-style";

const PREVIEW_PLACEMENT = Object.freeze({
  mode: "under-throws",
  activationMode: "autodarts-tools-zoom",
  previewHeightPx: 128,
  previewGapPx: 8,
});

const STAT_AVG_FONT_SIZE_PX = 36;
const STAT_LEG_FONT_SIZE_PX = 38;
const STAT_AVG_LINE_HEIGHT = 1.15;
const STAT_AVG_ARROW_WIDTH_PX = 12;
const STAT_AVG_ARROW_HEIGHT_PX = 23;
const STAT_AVG_ARROW_MARGIN_LEFT_PX = 8;
const INACTIVE_STAT_SCALE = 0.6;

function resolveThemeX01Config(rawConfig = {}) {
  return {
    showAvg: normalizeBoolean(rawConfig.showAvg, true),
  };
}

export function buildX01ThemeCss(featureConfig = {}) {
  const resolved = resolveThemeX01Config(featureConfig);
  const previewCss = buildPreviewPlacementCss(PREVIEW_PLACEMENT);
  const avgVisibilityCss = resolved.showAvg
    ? ""
    : `
p.chakra-text.css-1j0bqop{
  display: none !important;
}

.ad-ext-avg-trend-arrow{
  display: none !important;
}
`;

const x01LayoutOverrides = `
.css-hjw8x4{
  max-height: 12%;
}

div.ad-ext-player.ad-ext-player-active p.chakra-text.ad-ext-player-score {
  font-size: 9em;
}

div.ad-ext-player.ad-ext-player-active p.chakra-text.css-11cuipc {
  font-size: 1.5em;
}

div.css-y3hfdd{
  grid-template-columns: minmax(0, 1fr) max-content !important;
  gap: 0px !important;
}

#ad-ext-player-display .ad-ext-player > .chakra-stack.css-y3hfdd {
  min-width: 0 !important;
}

#ad-ext-player-display .ad-ext-player > .chakra-stack.css-y3hfdd > .chakra-stack.css-37hv00 {
  min-width: 0 !important;
  max-width: 100% !important;
  overflow: hidden !important;
}

#ad-ext-player-display .ad-ext-player .ad-ext-player-name,
#ad-ext-player-display .ad-ext-player .ad-ext-player-name > p {
  min-width: 0 !important;
  max-width: 100% !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  white-space: nowrap !important;
}

#ad-ext-player-display .ad-ext-player .ad-ext-player-score {
  justify-self: end !important;
  min-width: max-content !important;
  white-space: nowrap !important;
}

div.ad-ext-player.ad-ext-player-active div.css-y3hfdd {
  grid-template-rows: max-content max-content !important;
  align-content: center !important;
}
`;

  const navigationOverride = `
div.chakra-stack.navigation.css-19ml6yu,
div.chakra-stack.navigation.css-ege71s,
.chakra-stack.navigation {
  background-color: #434343;
}
`;

  const statsSizingCss = `
.ad-ext-player {
  --ad-ext-stat-scale: 1;
}

.ad-ext-player.ad-ext-player-inactive {
  --ad-ext-stat-scale: ${INACTIVE_STAT_SCALE};
}

p.chakra-text.css-1j0bqop {
  font-size: calc(${STAT_AVG_FONT_SIZE_PX}px * var(--ad-ext-stat-scale));
  line-height: ${STAT_AVG_LINE_HEIGHT};
}

span.css-3fr5p8 > p,
span.chakra-badge.css-n2903v,
span.chakra-badge.css-1j1ty0z,
span.chakra-badge.css-1c4630i {
  font-size: calc(${STAT_LEG_FONT_SIZE_PX}px * var(--ad-ext-stat-scale));
}

.ad-ext-player.ad-ext-player-inactive span.css-3fr5p8 > p {
  font-size: calc(${STAT_LEG_FONT_SIZE_PX}px * var(--ad-ext-stat-scale)) !important;
}

.ad-ext-avg-trend-arrow {
  margin-left: calc(${STAT_AVG_ARROW_MARGIN_LEFT_PX}px * var(--ad-ext-stat-scale));
}

.ad-ext-avg-trend-arrow.ad-ext-avg-trend-up {
  border-left: calc(${STAT_AVG_ARROW_WIDTH_PX}px * var(--ad-ext-stat-scale)) solid transparent;
  border-right: calc(${STAT_AVG_ARROW_WIDTH_PX}px * var(--ad-ext-stat-scale)) solid transparent;
  border-bottom: calc(${STAT_AVG_ARROW_HEIGHT_PX}px * var(--ad-ext-stat-scale)) solid #9fdb58;
}

.ad-ext-avg-trend-arrow.ad-ext-avg-trend-down {
  border-left: calc(${STAT_AVG_ARROW_WIDTH_PX}px * var(--ad-ext-stat-scale)) solid transparent;
  border-right: calc(${STAT_AVG_ARROW_WIDTH_PX}px * var(--ad-ext-stat-scale)) solid transparent;
  border-top: calc(${STAT_AVG_ARROW_HEIGHT_PX}px * var(--ad-ext-stat-scale)) solid #f87171;
}
`;

  const overlayPriorityCss = `
#ad-ext-player-display,
#ad-ext-turn {
  position: relative !important;
  z-index: 7 !important;
}
`;

  return buildThemeCssBundle(
    featureConfig,
    `${navigationOverride}${previewCss}${avgVisibilityCss}${statsSizingCss}${overlayPriorityCss}${x01LayoutOverrides}`
  );
}

export { PREVIEW_PLACEMENT };
