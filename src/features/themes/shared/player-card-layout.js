const STAT_AVG_LINE_HEIGHT = 1.15;
const INACTIVE_STAT_SCALE = 1.2;
const ACTIVE_STAT_SCALE = 1.6;
const ACTIVE_PLAYER_FLEX = 1.333333;
const DEFAULT_PLAYER_FLEX = 1;
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
  --ad-ext-player-score-size:clamp(4rem,min(20vw,45vh),var(--ad-ext-player-responsive-score-max));
  --ad-ext-player-name-size:clamp(1.28rem,min(3vw,5.8vh),var(--ad-ext-player-responsive-name-max));
  --ad-ext-player-meta-size:clamp(1rem,min(2.3vw,4.2vh),var(--ad-ext-player-responsive-meta-max));
  --ad-ext-player-badge-size:clamp(1.16rem,min(2.6vw,4.8vh),var(--ad-ext-player-responsive-badge-max));
  --ad-ext-player-avatar-size:clamp(2.5rem,min(5vw,8vh),var(--ad-ext-player-responsive-avatar-max));
  --ad-ext-player-flag-size:clamp(.75rem,min(1.6vw,2.5vh),var(--ad-ext-player-responsive-flag-max));
  --ad-ext-player-score-column-gap:clamp(1rem,3cqi,2rem);
  --ad-ext-player-name-line-block:calc(var(--ad-ext-player-name-size) * 1.05);
  --ad-ext-player-badge-line-block:36px;
  --ad-ext-player-score-name-align-block:var(--ad-ext-player-name-line-block);
  --ad-ext-player-score-name-align-anchor:min(var(--ad-ext-player-avatar-size), calc(var(--ad-ext-player-name-line-block) + .65rem));
  --ad-ext-player-score-name-align-offset:max(0px, calc((var(--ad-ext-player-score-name-align-anchor) - var(--ad-ext-player-score-name-align-block)) / 2));
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
  --ad-ext-player-score-size:clamp(5.333rem,min(27vw,52vh),var(--ad-ext-player-responsive-score-active-max));
  --ad-ext-player-name-size:clamp(1.707rem,min(4vw,7.4vh),var(--ad-ext-player-responsive-name-active-max));
  --ad-ext-player-meta-size:clamp(1.333rem,min(3vw,5.4vh),var(--ad-ext-player-responsive-meta-active-max));
  --ad-ext-player-badge-size:clamp(1.547rem,min(3.4vw,6.2vh),var(--ad-ext-player-responsive-badge-active-max));
  --ad-ext-player-avatar-size:clamp(3rem,min(6vw,10vh),var(--ad-ext-player-responsive-avatar-active-max));
  --ad-ext-player-flag-size:clamp(.9rem,min(2vw,3.3vh),var(--ad-ext-player-responsive-flag-active-max));
  --ad-ext-player-score-name-align-block:max(var(--ad-ext-player-name-line-block), var(--ad-ext-player-badge-line-block));
  --ad-ext-player-score-name-align-anchor:max(var(--ad-ext-player-avatar-size), 3.5rem);
  min-height:clamp(${ACTIVE_PLAYER_MIN_HEIGHT_REM}rem,42cqb,24rem) !important;
}

${inactivePlayerSelector}{
  --ad-ext-stat-scale:${INACTIVE_STAT_SCALE};
  --ad-ext-player-score-size:clamp(4rem,min(20vw,45vh),var(--ad-ext-player-responsive-score-max));
  --ad-ext-player-name-size:clamp(1.28rem,min(3vw,5.8vh),var(--ad-ext-player-responsive-name-max));
  --ad-ext-player-meta-size:clamp(1rem,min(2.3vw,4.2vh),var(--ad-ext-player-responsive-meta-max));
  --ad-ext-player-badge-size:clamp(1.16rem,min(2.6vw,4.8vh),var(--ad-ext-player-responsive-badge-max));
  --ad-ext-player-avatar-size:clamp(2.5rem,min(5vw,8vh),var(--ad-ext-player-responsive-avatar-max));
  --ad-ext-player-flag-size:clamp(.75rem,min(1.6vw,2.5vh),var(--ad-ext-player-responsive-flag-max));
}

@supports (font-size: 1cqi) {
  ${activePlayerSelector}{
    --ad-ext-player-score-size:clamp(5.333rem,min(27cqi,52cqb),var(--ad-ext-player-responsive-score-active-max));
    --ad-ext-player-name-size:clamp(1.707rem,min(9cqi,14cqb),var(--ad-ext-player-responsive-name-active-max));
    --ad-ext-player-meta-size:clamp(1.333rem,min(6.8cqi,10.2cqb),var(--ad-ext-player-responsive-meta-active-max));
    --ad-ext-player-badge-size:clamp(1.547rem,min(8.2cqi,12.2cqb),var(--ad-ext-player-responsive-badge-active-max));
    --ad-ext-player-avatar-size:clamp(3rem,min(13cqi,18cqb),var(--ad-ext-player-responsive-avatar-active-max));
    --ad-ext-player-flag-size:clamp(.9rem,min(3.2cqi,4.8cqb),var(--ad-ext-player-responsive-flag-active-max));
  }

  ${inactivePlayerSelector}{
    --ad-ext-player-score-size:clamp(4rem,min(20cqi,45cqb),var(--ad-ext-player-responsive-score-max));
    --ad-ext-player-name-size:clamp(1.28rem,min(6.8cqi,10.8cqb),var(--ad-ext-player-responsive-name-max));
    --ad-ext-player-meta-size:clamp(1rem,min(5.2cqi,8.2cqb),var(--ad-ext-player-responsive-meta-max));
    --ad-ext-player-badge-size:clamp(1.16rem,min(6.1cqi,9.4cqb),var(--ad-ext-player-responsive-badge-max));
    --ad-ext-player-avatar-size:clamp(2.5rem,min(10cqi,15cqb),var(--ad-ext-player-responsive-avatar-max));
    --ad-ext-player-flag-size:clamp(.75rem,min(2.4cqi,3.8cqb),var(--ad-ext-player-responsive-flag-max));
  }
}

${stackSelector}{
  flex:1 1 auto !important;
  display: grid !important;
  grid-template-columns: minmax(0, 1fr) max-content !important;
  grid-template-rows: max-content max-content !important;
  align-content: center !important;
  align-items: start !important;
  column-gap: var(--ad-ext-player-score-column-gap) !important;
  row-gap: 0px !important;
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
  width: 100% !important;
  box-sizing: border-box !important;
  overflow: hidden !important;
}

${stackSelector} > .css-37hv00:not([data-ad-ext-cricket-row="true"]) {
  grid-column: 1 !important;
  grid-row: 1 / 2 !important;
  align-self: start !important;
}

${stackSelector} > .css-1igwmid:not([data-ad-ext-player-card-part="score"]) {
  grid-column: 1 / 3 !important;
  grid-row: 2 / 3 !important;
  align-self: start !important;
}

${stackSelector} > [data-ad-ext-player-card-part="score"],
${stackSelector} > .css-xsngok {
  grid-column: 2 !important;
  grid-row: 1 / 2 !important;
  align-self: start !important;
  justify-self: end !important;
  min-width: max-content !important;
  max-width: 100% !important;
  box-sizing: border-box !important;
  overflow: visible !important;
  margin: 0 !important;
  padding: var(--ad-ext-player-score-name-align-offset) 0 0 0 !important;
}

#ad-ext-player-display .ad-ext-player .css-37hv00:not([data-ad-ext-cricket-row="true"]) > .css-4rrvd0,
#ad-ext-player-display .ad-ext-player .css-37hv00:not([data-ad-ext-cricket-row="true"]) > .css-4rrvd0 > .css-z1uxps,
#ad-ext-player-display .ad-ext-player .css-37hv00:not([data-ad-ext-cricket-row="true"]) .css-1igwmid {
  min-width: 0 !important;
  max-width: 100% !important;
  width: 100% !important;
  box-sizing: border-box !important;
  overflow: hidden !important;
}

#ad-ext-player-display .ad-ext-player .css-37hv00:not([data-ad-ext-cricket-row="true"]) .ad-ext-player-name {
  flex: 1 1 auto !important;
}

#ad-ext-player-display .ad-ext-player .css-37hv00:not([data-ad-ext-cricket-row="true"]) .chakra-badge,
#ad-ext-player-display .ad-ext-player .css-37hv00:not([data-ad-ext-cricket-row="true"]) [data-ad-ext-player-card-part="profile-badge"] {
  flex: 0 0 auto !important;
}

#ad-ext-player-display .ad-ext-player .ad-ext-player-name,
#ad-ext-player-display .ad-ext-player .ad-ext-player-name > p {
  font-size: var(--ad-ext-player-name-size) !important;
  color: var(--ad-ext-theme-name-color) !important;
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
  color: var(--ad-ext-theme-score-color) !important;
  line-height: 1 !important;
  justify-self: end !important;
  min-width: max-content !important;
  max-width: 100% !important;
  overflow: visible !important;
  white-space: nowrap !important;
  margin: 0 !important;
  padding: 0 !important;
}

p.chakra-text.css-1j0bqop {
  font-size: var(--ad-ext-player-meta-size) !important;
  color: var(--ad-ext-theme-meta-color) !important;
  line-height: ${STAT_AVG_LINE_HEIGHT};
}

#ad-ext-player-display .ad-ext-player.ad-ext-player-active .ad-ext-player-score,
#ad-ext-player-display .ad-ext-player.ad-ext-player-active .ad-ext_winner-score-wrapper > p {
  color: var(--ad-ext-theme-score-active-color) !important;
}

#ad-ext-player-display .ad-ext-player.ad-ext-player-winner .ad-ext-player-score,
#ad-ext-player-display .ad-ext-player.ad-ext-player-winner .ad-ext_winner-score-wrapper > p {
  color: var(--ad-ext-theme-score-winner-color) !important;
}

#ad-ext-player-display .ad-ext-player.ad-ext-player-active .ad-ext-player-name,
#ad-ext-player-display .ad-ext-player.ad-ext-player-active .ad-ext-player-name > p {
  color: var(--ad-ext-theme-name-active-color) !important;
}

#ad-ext-player-display .ad-ext-player.ad-ext-player-winner .ad-ext-player-name,
#ad-ext-player-display .ad-ext-player.ad-ext-player-winner .ad-ext-player-name > p {
  color: var(--ad-ext-theme-name-winner-color) !important;
}

#ad-ext-player-display .ad-ext-player.ad-ext-player-inactive .ad-ext-player-name,
#ad-ext-player-display .ad-ext-player.ad-ext-player-inactive .ad-ext-player-name > p,
#ad-ext-player-display .ad-ext-player:not(.ad-ext-player-active):not(.ad-ext-player-winner) .ad-ext-player-name,
#ad-ext-player-display .ad-ext-player:not(.ad-ext-player-active):not(.ad-ext-player-winner) .ad-ext-player-name > p {
  color: var(--ad-ext-theme-name-inactive-color) !important;
}

#ad-ext-player-display .ad-ext-player.ad-ext-player-active .css-1j0bqop {
  color: var(--ad-ext-theme-meta-active-color) !important;
}

#ad-ext-player-display .ad-ext-player.ad-ext-player-winner .css-1j0bqop {
  color: var(--ad-ext-theme-meta-winner-color) !important;
}

#ad-ext-player-display .ad-ext-player.ad-ext-player-inactive .css-1j0bqop,
#ad-ext-player-display .ad-ext-player:not(.ad-ext-player-active):not(.ad-ext-player-winner) .css-1j0bqop {
  color: var(--ad-ext-theme-meta-inactive-color) !important;
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

.ad-ext-player .chakra-avatar,
.ad-ext-player .chakra-avatar__img,
.ad-ext-player .chakra-avatar__initials{
  --avatar-size: var(--ad-ext-player-avatar-size) !important;
  width: var(--ad-ext-player-avatar-size) !important;
  height: var(--ad-ext-player-avatar-size) !important;
}

#ad-ext-player-display .ad-ext-player [data-ad-ext-player-card-part="flag"],
#ad-ext-player-display .ad-ext-player .chakra-image.css-6t0bzd{
  width: var(--ad-ext-player-flag-size) !important;
  min-width: var(--ad-ext-player-flag-size) !important;
  height: auto !important;
}

.ad-ext-avg-trend-arrow {
  margin-left: calc(var(--ad-ext-avg-trend-margin-left-base, 8px) * var(--ad-ext-stat-scale));
}

.ad-ext-avg-trend-arrow.ad-ext-avg-trend-up {
  border-left: calc(var(--ad-ext-avg-trend-arrow-half-width-base, 12px) * var(--ad-ext-stat-scale)) solid transparent;
  border-right: calc(var(--ad-ext-avg-trend-arrow-half-width-base, 12px) * var(--ad-ext-stat-scale)) solid transparent;
  border-bottom: calc(var(--ad-ext-avg-trend-arrow-height-base, 23px) * var(--ad-ext-stat-scale)) solid #9fdb58;
}

.ad-ext-avg-trend-arrow.ad-ext-avg-trend-down {
  border-left: calc(var(--ad-ext-avg-trend-arrow-half-width-base, 12px) * var(--ad-ext-stat-scale)) solid transparent;
  border-right: calc(var(--ad-ext-avg-trend-arrow-half-width-base, 12px) * var(--ad-ext-stat-scale)) solid transparent;
  border-top: calc(var(--ad-ext-avg-trend-arrow-height-base, 23px) * var(--ad-ext-stat-scale)) solid #f87171;
}

#ad-ext-turn .ad-ext-turn-points,
#ad-ext-turn .ad-ext-hit-score {
  color: var(--ad-ext-theme-turn-points-color) !important;
}

#ad-ext-turn > .ad-ext-turn-throw,
#ad-ext-turn > .suggestion,
#ad-ext-turn > .suggestion *,
.ad-ext-checkout-suggestion,
.ad-ext-checkout-suggestion * {
  color: var(--ad-ext-theme-throw-label-color) !important;
}

#ad-ext-player-display .ad-ext-player.ad-ext-player-active > .chakra-stack,
#ad-ext-player-display .ad-ext-player.ad-ext-player-winner > .chakra-stack {
  grid-template-rows: max-content max-content !important;
  align-content: center !important;
}
`;
}

export const buildCenteredPlayerCardLayoutCss = buildSharedPlayerDisplayCss;
