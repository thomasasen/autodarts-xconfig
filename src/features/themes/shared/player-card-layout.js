const STAT_AVG_FONT_SIZE_PX = 36;
const STAT_LEG_FONT_SIZE_PX = 38;
const STAT_AVG_LINE_HEIGHT = 1.15;
const STAT_AVG_ARROW_WIDTH_PX = 12;
const STAT_AVG_ARROW_HEIGHT_PX = 23;
const STAT_AVG_ARROW_MARGIN_LEFT_PX = 8;
const INACTIVE_STAT_SCALE = 0.6;

export function buildSharedPlayerDisplayCss() {
  const stackSelector = "#ad-ext-player-display .ad-ext-player > .chakra-stack";
  return `
${stackSelector}{
  display: grid !important;
  grid-template-columns: minmax(0, 1fr) max-content !important;
  gap: 0px !important;
  min-width: 0 !important;
}

${stackSelector} > .chakra-stack {
  min-width: 0 !important;
  max-width: 100% !important;
  overflow: hidden !important;
}

.ad-ext-player {
  --ad-ext-stat-scale: 1;
}

.ad-ext-player.ad-ext-player-inactive {
  --ad-ext-stat-scale: ${INACTIVE_STAT_SCALE};
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

div.ad-ext-player.ad-ext-player-active p.chakra-text.ad-ext-player-score {
  font-size: 9em;
}

div.ad-ext-player.ad-ext-player-active p.chakra-text.css-11cuipc {
  font-size: 1.5em;
}

#ad-ext-player-display .ad-ext-player.ad-ext-player-active > .chakra-stack,
#ad-ext-player-display .ad-ext-player.ad-ext-player-winner > .chakra-stack {
  grid-template-rows: max-content max-content !important;
  align-content: center !important;
}
`;
}

export const buildCenteredPlayerCardLayoutCss = buildSharedPlayerDisplayCss;
