const STAT_AVG_FONT_SIZE_PX = 36;
const STAT_LEG_FONT_SIZE_PX = 38;
const STAT_AVG_LINE_HEIGHT = 1.15;
const STAT_AVG_ARROW_WIDTH_PX = 12;
const STAT_AVG_ARROW_HEIGHT_PX = 23;
const STAT_AVG_ARROW_MARGIN_LEFT_PX = 8;
const INACTIVE_STAT_SCALE = 0.84;
const ACTIVE_PLAYER_FLEX = 1.12;
const DEFAULT_PLAYER_FLEX = 1;

export function buildSharedPlayerDisplayCss() {
  const stackSelector = "#ad-ext-player-display .ad-ext-player > .chakra-stack";
  return `
#ad-ext-player-display{
  container-type:size !important;
  min-height:0 !important;
  overflow:hidden !important;
  gap:clamp(.3rem,.72vh,.58rem) !important;
}

#ad-ext-player-display > .ad-ext-player{
  --ad-ext-player-flex:${DEFAULT_PLAYER_FLEX};
  --ad-ext-stat-scale:1;
  --ad-ext-player-score-max:8.85rem;
  --ad-ext-player-name-max:2.5rem;
  --ad-ext-player-meta-max:1.42rem;
  --ad-ext-player-badge-max:1.68rem;
  --ad-ext-player-score-size:clamp(2.7rem,5.7vw,var(--ad-ext-player-score-max));
  --ad-ext-player-name-size:clamp(1.08rem,2.25vw,var(--ad-ext-player-name-max));
  --ad-ext-player-meta-size:clamp(.92rem,1.45vw,var(--ad-ext-player-meta-max));
  --ad-ext-player-badge-size:clamp(.96rem,1.7vw,var(--ad-ext-player-badge-max));
  flex:var(--ad-ext-player-flex) 1 0 !important;
  min-height:0 !important;
  min-width:0 !important;
  max-height:100% !important;
  display:flex !important;
  align-items:stretch !important;
  overflow:hidden !important;
  container-type:size !important;
  container-name:ad-ext-player-card !important;
}

#ad-ext-player-display > .ad-ext-player.ad-ext-player-active,
#ad-ext-player-display > .ad-ext-player.ad-ext-player-winner{
  --ad-ext-player-flex:${ACTIVE_PLAYER_FLEX};
  --ad-ext-player-score-size:clamp(3.15rem,6.6vw,var(--ad-ext-player-score-max));
  --ad-ext-player-name-size:clamp(1.18rem,2.5vw,var(--ad-ext-player-name-max));
  --ad-ext-player-meta-size:clamp(.96rem,1.55vw,var(--ad-ext-player-meta-max));
  --ad-ext-player-badge-size:clamp(1rem,1.8vw,var(--ad-ext-player-badge-max));
}

#ad-ext-player-display > .ad-ext-player.ad-ext-player-inactive,
#ad-ext-player-display > .ad-ext-player:not(.ad-ext-player-active):not(.ad-ext-player-winner){
  --ad-ext-stat-scale:${INACTIVE_STAT_SCALE};
  --ad-ext-player-score-size:clamp(2.5rem,5vw,var(--ad-ext-player-score-max));
  --ad-ext-player-name-size:clamp(1.02rem,2.05vw,var(--ad-ext-player-name-max));
  --ad-ext-player-meta-size:clamp(.88rem,1.3vw,var(--ad-ext-player-meta-max));
  --ad-ext-player-badge-size:clamp(.92rem,1.48vw,var(--ad-ext-player-badge-max));
}

@supports (font-size: 1cqi) {
  #ad-ext-player-display > .ad-ext-player.ad-ext-player-active,
  #ad-ext-player-display > .ad-ext-player.ad-ext-player-winner{
    --ad-ext-player-score-size:clamp(3.15rem,min(20cqi,35cqb),var(--ad-ext-player-score-max));
    --ad-ext-player-name-size:clamp(1.18rem,min(8.8cqi,12.8cqb),var(--ad-ext-player-name-max));
    --ad-ext-player-meta-size:clamp(.96rem,min(5.2cqi,7.4cqb),var(--ad-ext-player-meta-max));
    --ad-ext-player-badge-size:clamp(1rem,min(5.6cqi,8cqb),var(--ad-ext-player-badge-max));
  }

  #ad-ext-player-display > .ad-ext-player.ad-ext-player-inactive,
  #ad-ext-player-display > .ad-ext-player:not(.ad-ext-player-active):not(.ad-ext-player-winner){
    --ad-ext-player-score-size:clamp(2.5rem,min(16.8cqi,28.6cqb),var(--ad-ext-player-score-max));
    --ad-ext-player-name-size:clamp(1.02rem,min(7.4cqi,10.4cqb),var(--ad-ext-player-name-max));
    --ad-ext-player-meta-size:clamp(.88rem,min(4.6cqi,6.2cqb),var(--ad-ext-player-meta-max));
    --ad-ext-player-badge-size:clamp(.92rem,min(4.9cqi,6.8cqb),var(--ad-ext-player-badge-max));
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
  font-size: clamp(.92rem, calc(${STAT_AVG_FONT_SIZE_PX}px * var(--ad-ext-stat-scale)), var(--ad-ext-player-meta-size)) !important;
  line-height: ${STAT_AVG_LINE_HEIGHT};
}

span.css-3fr5p8 > p,
span.chakra-badge.css-n2903v,
span.chakra-badge.css-1j1ty0z,
span.chakra-badge.css-1c4630i {
  font-size: clamp(.92rem, calc(${STAT_LEG_FONT_SIZE_PX}px * var(--ad-ext-stat-scale)), var(--ad-ext-player-badge-size)) !important;
}

.ad-ext-player.ad-ext-player-inactive span.css-3fr5p8 > p {
  font-size: clamp(.92rem, calc(${STAT_LEG_FONT_SIZE_PX}px * var(--ad-ext-stat-scale)), var(--ad-ext-player-badge-size)) !important;
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
