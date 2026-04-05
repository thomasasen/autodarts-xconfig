const STAT_AVG_LINE_HEIGHT = 1.15;
const STAT_AVG_ARROW_WIDTH_PX = 12;
const STAT_AVG_ARROW_HEIGHT_PX = 23;
const STAT_AVG_ARROW_MARGIN_LEFT_PX = 8;
const INACTIVE_STAT_SCALE = 1.2;
const ACTIVE_STAT_SCALE = 1.6;
const ACTIVE_PLAYER_RATIO = 1.333333;
const ACTIVE_PLAYER_FLEX = 1.333333;
const DEFAULT_PLAYER_FLEX = 1;
const INACTIVE_PLAYER_SCORE_MAX_REM = 4.8;
const INACTIVE_PLAYER_NAME_MAX_REM = 1.5625;
const INACTIVE_PLAYER_META_MAX_REM = 1.1875;
const INACTIVE_PLAYER_BADGE_MAX_REM = 1.4375;
const INACTIVE_PLAYER_MIN_HEIGHT_REM = 7.25;
const ACTIVE_PLAYER_MIN_HEIGHT_REM = 12;

export function buildSharedPlayerDisplayCss() {
  const playerShellSelector = "#ad-ext-player-display > *";
  const playerSelector = "#ad-ext-player-display .ad-ext-player";
  const activePlayerSelector = `${playerSelector}.ad-ext-player-active,\n${playerSelector}.ad-ext-player-winner`;
  const inactivePlayerSelector = `${playerSelector}.ad-ext-player-inactive,\n${playerSelector}:not(.ad-ext-player-active):not(.ad-ext-player-winner)`;
  const stackSelector = "#ad-ext-player-display .ad-ext-player > .chakra-stack";
  return `
#ad-ext-player-display{
  container-type:size !important;
  min-height:0 !important;
  overflow:hidden !important;
  gap:clamp(.3rem,.72vh,.58rem) !important;
}

${playerShellSelector}{
  flex:1 1 0 !important;
  min-height:0 !important;
  min-width:0 !important;
  display:flex !important;
  align-items:stretch !important;
  overflow:hidden !important;
}

@supports (display: contents) {
  ${playerShellSelector}{
    display:contents !important;
  }
}

${playerSelector}{
  --ad-ext-player-flex:${DEFAULT_PLAYER_FLEX};
  --ad-ext-stat-scale:${INACTIVE_STAT_SCALE};
  --ad-ext-player-score-max:${INACTIVE_PLAYER_SCORE_MAX_REM}rem;
  --ad-ext-player-name-max:${INACTIVE_PLAYER_NAME_MAX_REM}rem;
  --ad-ext-player-meta-max:${INACTIVE_PLAYER_META_MAX_REM}rem;
  --ad-ext-player-badge-max:${INACTIVE_PLAYER_BADGE_MAX_REM}rem;
  --ad-ext-player-score-size:clamp(4rem,8vw,var(--ad-ext-player-score-max));
  --ad-ext-player-name-size:clamp(1.28rem,2.6vw,var(--ad-ext-player-name-max));
  --ad-ext-player-meta-size:clamp(1rem,2vw,var(--ad-ext-player-meta-max));
  --ad-ext-player-badge-size:clamp(1.16rem,2.3vw,var(--ad-ext-player-badge-max));
  flex:var(--ad-ext-player-flex) 1 0 !important;
  min-height:clamp(${INACTIVE_PLAYER_MIN_HEIGHT_REM}rem,20cqb,11rem) !important;
  min-width:0 !important;
  max-height:100% !important;
  display:flex !important;
  align-items:stretch !important;
  overflow:hidden !important;
  container-type:size !important;
  container-name:ad-ext-player-card !important;
}

${activePlayerSelector}{
  --ad-ext-player-flex:${ACTIVE_PLAYER_FLEX};
  --ad-ext-stat-scale:${ACTIVE_STAT_SCALE};
  --ad-ext-player-score-size:clamp(5.333rem,10.667vw,calc(var(--ad-ext-player-score-max) * ${ACTIVE_PLAYER_RATIO}));
  --ad-ext-player-name-size:clamp(1.707rem,3.467vw,calc(var(--ad-ext-player-name-max) * ${ACTIVE_PLAYER_RATIO}));
  --ad-ext-player-meta-size:clamp(1.333rem,2.667vw,calc(var(--ad-ext-player-meta-max) * ${ACTIVE_PLAYER_RATIO}));
  --ad-ext-player-badge-size:clamp(1.547rem,3.067vw,calc(var(--ad-ext-player-badge-max) * ${ACTIVE_PLAYER_RATIO}));
  min-height:clamp(${ACTIVE_PLAYER_MIN_HEIGHT_REM}rem,42cqb,24rem) !important;
}

${inactivePlayerSelector}{
  --ad-ext-stat-scale:${INACTIVE_STAT_SCALE};
  --ad-ext-player-score-size:clamp(4rem,8vw,var(--ad-ext-player-score-max));
  --ad-ext-player-name-size:clamp(1.28rem,2.6vw,var(--ad-ext-player-name-max));
  --ad-ext-player-meta-size:clamp(1rem,2vw,var(--ad-ext-player-meta-max));
  --ad-ext-player-badge-size:clamp(1.16rem,2.3vw,var(--ad-ext-player-badge-max));
}

@supports (font-size: 1cqi) {
  ${activePlayerSelector}{
    --ad-ext-player-score-size:clamp(5.333rem,min(25.6cqi,44.8cqb),calc(var(--ad-ext-player-score-max) * ${ACTIVE_PLAYER_RATIO}));
    --ad-ext-player-name-size:clamp(1.707rem,min(8.363cqi,13.056cqb),calc(var(--ad-ext-player-name-max) * ${ACTIVE_PLAYER_RATIO}));
    --ad-ext-player-meta-size:clamp(1.333rem,min(6.336cqi,9.36cqb),calc(var(--ad-ext-player-meta-max) * ${ACTIVE_PLAYER_RATIO}));
    --ad-ext-player-badge-size:clamp(1.547rem,min(7.666cqi,11.458cqb),calc(var(--ad-ext-player-badge-max) * ${ACTIVE_PLAYER_RATIO}));
  }

  ${inactivePlayerSelector}{
    --ad-ext-player-score-size:clamp(4rem,min(19.2cqi,33.6cqb),var(--ad-ext-player-score-max));
    --ad-ext-player-name-size:clamp(1.28rem,min(6.275cqi,9.792cqb),var(--ad-ext-player-name-max));
    --ad-ext-player-meta-size:clamp(1rem,min(4.752cqi,7.02cqb),var(--ad-ext-player-meta-max));
    --ad-ext-player-badge-size:clamp(1.16rem,min(5.75cqi,8.594cqb),var(--ad-ext-player-badge-max));
  }
}

${stackSelector}{
  flex:1 1 auto !important;
  display: grid !important;
  grid-template-columns: minmax(0, 1fr) max-content !important;
  align-content: center !important;
  gap: 0px !important;
  min-height: 0 !important;
  min-width: 0 !important;
  max-height: 100% !important;
  height: 100% !important;
  width: 100% !important;
}

${stackSelector} > .chakra-stack {
  align-self: center !important;
  min-width: 0 !important;
  max-width: 100% !important;
  overflow: hidden !important;
}

#ad-ext-player-display .ad-ext-player .ad-ext-player-name,
#ad-ext-player-display .ad-ext-player .ad-ext-player-name > p {
  font-size: var(--ad-ext-player-name-size) !important;
  line-height: 1.05 !important;
  min-width: 0 !important;
  max-width: 100% !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  white-space: nowrap !important;
}

#ad-ext-player-display .ad-ext-player .chakra-text.css-11cuipc {
  font-size: var(--ad-ext-player-name-size) !important;
}

#ad-ext-player-display .ad-ext-player .ad-ext-player-score {
  font-size: var(--ad-ext-player-score-size) !important;
  line-height: .88 !important;
  justify-self: end !important;
  min-width: max-content !important;
  max-width: 100% !important;
  overflow: hidden !important;
  white-space: nowrap !important;
}

p.chakra-text.css-1j0bqop {
  font-size: var(--ad-ext-player-meta-size) !important;
  line-height: ${STAT_AVG_LINE_HEIGHT};
}

span.css-3fr5p8 > p,
span.chakra-badge.css-n2903v,
span.chakra-badge.css-1j1ty0z,
span.chakra-badge.css-1c4630i {
  font-size: var(--ad-ext-player-badge-size) !important;
}

.ad-ext-player.ad-ext-player-inactive span.css-3fr5p8 > p {
  font-size: var(--ad-ext-player-badge-size) !important;
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

#ad-ext-player-display .ad-ext-player.ad-ext-player-active > .chakra-stack,
#ad-ext-player-display .ad-ext-player.ad-ext-player-winner > .chakra-stack {
  grid-template-rows: max-content max-content !important;
  align-content: center !important;
}
`;
}

export const buildCenteredPlayerCardLayoutCss = buildSharedPlayerDisplayCss;
