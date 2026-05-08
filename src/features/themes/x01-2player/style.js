import { buildThemeCssBundle } from "../shared/theme-style-builder.js";
import { buildPreviewPlacementCss, normalizeBoolean } from "../shared/theme-utils.js";
import {
  X01_TWO_PLAYER_ACTIVE_ATTRIBUTE,
  X01_TWO_PLAYER_PLAYER_INDEX_ATTRIBUTE,
  X01_TWO_PLAYER_PLAYER_WRAPPER_ATTRIBUTE,
  X01_TWO_PLAYER_SLOT_ATTRIBUTE,
  X01_TWO_PLAYER_STACK_ATTRIBUTE,
} from "./layout-contract.js";
import { X01_TWO_PLAYER_STALE_REMAINING_CLASS } from "./scoreboard-state.js";

export const STYLE_ID = "ad-ext-theme-x01-2player-style";

export const PREVIEW_PLACEMENT = Object.freeze({
  mode: "under-throws",
  activationMode: "autodarts-tools-zoom",
  previewHeightPx: 128,
  previewGapPx: 8,
});

const ACTIVE_CARD_SELECTOR = `#ad-ext-player-display .ad-ext-player[${X01_TWO_PLAYER_ACTIVE_ATTRIBUTE}="true"]`;
const INACTIVE_CARD_SELECTOR = `#ad-ext-player-display .ad-ext-player[${X01_TWO_PLAYER_ACTIVE_ATTRIBUTE}="false"]`;
const PLAYER_WRAPPER_SELECTOR = `[${X01_TWO_PLAYER_PLAYER_WRAPPER_ATTRIBUTE}="true"]`;
const DIRECT_PLAYER_WRAPPER_SELECTOR = `#ad-ext-player-display > ${PLAYER_WRAPPER_SELECTOR}`;
const FIRST_PLAYER_WRAPPER_SELECTOR =
  `#ad-ext-player-display > [${X01_TWO_PLAYER_PLAYER_INDEX_ATTRIBUTE}="0"]`;
const SECOND_PLAYER_WRAPPER_SELECTOR =
  `#ad-ext-player-display > [${X01_TWO_PLAYER_PLAYER_INDEX_ATTRIBUTE}="1"]`;
const STACK_SELECTOR = `[${X01_TWO_PLAYER_STACK_ATTRIBUTE}="true"]`;
const IDENTITY_SLOT_SELECTOR = `[${X01_TWO_PLAYER_SLOT_ATTRIBUTE}="identity"]`;
const PROGRESS_SLOT_SELECTOR = `[${X01_TWO_PLAYER_SLOT_ATTRIBUTE}="progress"]`;
const SCORE_SLOT_SELECTOR = `[${X01_TWO_PLAYER_SLOT_ATTRIBUTE}="score"]`;
const TABLE_SLOT_SELECTOR = `[${X01_TWO_PLAYER_SLOT_ATTRIBUTE}="table"]`;
const STACK_HEADER_META_SELECTOR = `.css-1igwmid:not([${X01_TWO_PLAYER_SLOT_ATTRIBUTE}])`;
const LEGACY_PROGRESS_STACK_SELECTOR = `.chakra-stack[data-ad-ext-x01-score-progress-stack="true"]:not(${STACK_SELECTOR})`;

function resolveThemeX01TwoPlayerConfig(rawConfig = {}) {
  return {
    showAvg: normalizeBoolean(rawConfig.showAvg, true),
  };
}

export function buildX01TwoPlayerThemeCss(featureConfig = {}, options = {}) {
  const resolved = resolveThemeX01TwoPlayerConfig(featureConfig);
  const visualConfig = options.visualConfig || featureConfig;
  const previewCss = buildPreviewPlacementCss(PREVIEW_PLACEMENT);
  const avgVisibilityCss = resolved.showAvg
    ? ""
    : `
p.chakra-text.css-1j0bqop{
  display:none !important;
}

.ad-ext-avg-trend-arrow{
  display:none !important;
}
`;

  const themeCss = `
:root{
  --theme-bg:#040709;
  --theme-background:#040709;
  --theme-text-color:#eff7f2;
  --theme-text-highlight-color:#8fe28d;
  --theme-navigation-bg:#0f161a;
  --theme-navigation-item-color:#182229;
  --theme-player-badge-bg:transparent;
  --theme-player-name-bg:transparent;
  --theme-current-bg:transparent;
  --theme-border-color:#2a353d;
  --theme-alt-bg:#163128;
  --ad-ext-theme-accent-color:var(--theme-text-highlight-color);
  --ad-ext-theme-text-primary-color:#f6fbf7;
  --ad-ext-theme-text-secondary-color:#f0f8f3;
  --ad-ext-theme-card-active-border-color:var(--theme-text-highlight-color);
  --ad-ext-theme-card-active-outline-color:rgba(143, 226, 141, 0.24);
  --ad-ext-theme-card-inactive-border-color:rgba(236, 247, 240, 0.16);
  --ad-ext-theme-score-active-color:var(--ad-ext-theme-accent-color);
  --ad-ext-theme-score-inactive-color:#f6fbf7;
  --ad-ext-theme-meta-color:rgba(219, 230, 223, 0.9);
  --ad-ext-theme-meta-active-color:var(--ad-ext-theme-meta-color);
  --ad-ext-theme-meta-inactive-color:var(--ad-ext-theme-meta-color);
  --ad-ext-theme-turn-points-color:#f4f8f6;
  --ad-ext-theme-throw-label-color:rgba(244, 248, 246, 0.72);
  --ad-ext-x01-2player-column-gap:clamp(0.9rem, 1.6vw, 1.4rem);
  --ad-ext-x01-2player-center-min-width:48rem;
  --ad-ext-x01-2player-side-width:clamp(
    17rem,
    22vw,
    min(
      23.5rem,
      calc(
        (100vw - var(--ad-ext-x01-2player-center-min-width) - (2 * var(--ad-ext-x01-2player-column-gap)))
        / 2
      )
    )
  );
  --ad-ext-x01-2player-row-gap:clamp(0.6rem, 1.1vw, 0.95rem);
  --ad-ext-x01-2player-turn-height:clamp(4.1rem, 5.6vw, 4.9rem);
  --ad-ext-x01-2player-live-turn-height:var(--ad-ext-x01-2player-turn-height);
  --ad-ext-x01-2player-throw-points-size:clamp(1.2rem, 1.8vw, 1.65rem);
  --ad-ext-x01-2player-live-throw-points-size:var(--ad-ext-x01-2player-throw-points-size);
  --ad-ext-x01-2player-turn-clearance:clamp(0.85rem, 1.25vh, 1.15rem);
  --ad-ext-x01-2player-controls-height:clamp(1.95rem, 3.2vh, 2.3rem);
  --ad-ext-x01-2player-board-gap:clamp(0.32rem, 0.6vh, 0.52rem);
  --ad-ext-x01-2player-board-top-pad:calc(
    var(--ad-ext-x01-2player-live-turn-height)
    + var(--ad-ext-x01-2player-turn-clearance)
    + var(--ad-ext-x01-2player-controls-height)
    + var(--ad-ext-x01-2player-board-gap)
  );
  --ad-ext-x01-2player-card-padding:clamp(0.8rem, 1.25vw, 1rem);
}

div.css-gmuwbf,
div.css-tkevr6,
div.css-nfhdnc{
  background:
    radial-gradient(circle at 50% 48%, rgba(102, 240, 174, 0.16) 0, rgba(102, 240, 174, 0.06) 18%, rgba(4, 7, 9, 0) 38%),
    linear-gradient(180deg, #091015 0%, #05080b 54%, #020405 100%) !important;
  background-color:#040709 !important;
}

.chakra-stack.navigation,
div.chakra-stack.navigation.css-19ml6yu,
div.chakra-stack.navigation.css-ege71s{
  background:
    linear-gradient(180deg, rgba(18, 24, 29, 0.98), rgba(10, 15, 19, 0.98)) !important;
  border-bottom:1px solid rgba(125, 216, 156, 0.12) !important;
}

#ad-ext-player-display,
#ad-ext-turn{
  position:relative !important;
  z-index:7 !important;
}

#ad-ext-turn{
  pointer-events:none !important;
}

.css-tkevr6 > .chakra-stack{
  grid-template-columns:
    var(--ad-ext-x01-2player-side-width)
    minmax(0, 1fr)
    var(--ad-ext-x01-2player-side-width) !important;
  grid-template-rows:max-content max-content minmax(0, 1fr) !important;
  column-gap:var(--ad-ext-x01-2player-column-gap) !important;
  row-gap:var(--ad-ext-x01-2player-row-gap) !important;
}

.css-tkevr6 > .chakra-stack > div.css-0:first-child:not(.chakra-wrap){
  justify-self:start !important;
  width:max-content !important;
  max-width:100% !important;
}

.ad-ext-theme-content-slot > .chakra-wrap.css-0,
.ad-ext-theme-content-slot > .css-k008qs{
  grid-column:1 / -1 !important;
  grid-row:1 !important;
  justify-self:stretch !important;
  align-self:start !important;
  width:auto !important;
  min-width:0 !important;
  max-width:none !important;
  margin:0 1rem !important;
  display:block !important;
}

.ad-ext-theme-content-slot > .chakra-wrap.css-0 > .chakra-wrap__list,
.ad-ext-theme-content-slot > .css-k008qs > .chakra-wrap__list{
  display:flex !important;
  width:100% !important;
  max-width:none !important;
  justify-content:space-between !important;
  align-items:flex-start !important;
}

#ad-ext-turn{
  grid-column:2 !important;
  grid-row:2 !important;
  display:grid !important;
  grid-template-columns:max-content repeat(3, minmax(9.5rem, 1fr)) !important;
  gap:0.8rem !important;
  align-items:stretch !important;
  width:100% !important;
  max-width:min(100%, 62rem) !important;
  justify-self:center !important;
  min-width:0 !important;
  padding:0.1rem 0 0 !important;
}

#ad-ext-turn > *{
  min-width:0 !important;
  pointer-events:auto !important;
}

#ad-ext-turn > :first-child{
  box-sizing:border-box !important;
  padding-inline:0 !important;
  overflow:visible !important;
}

#ad-ext-turn > .score,
#ad-ext-turn > .ad-ext-turn-throw{
  min-height:var(--ad-ext-x01-2player-turn-height) !important;
  padding-inline:clamp(0.35rem, 0.8vw, 0.75rem) !important;
  border:1px solid rgba(226, 241, 232, 0.14) !important;
  border-radius:1rem !important;
  background:
    linear-gradient(180deg, rgba(14, 18, 21, 0.94), rgba(6, 10, 12, 0.94)) !important;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    0 14px 30px rgba(0, 0, 0, 0.28) !important;
}

#ad-ext-turn > .score{
  display:grid !important;
  place-items:center !important;
  font-size:clamp(2.7rem, 4.6vw, 3.7rem) !important;
  font-weight:800 !important;
  color:var(--ad-ext-theme-turn-points-color) !important;
}

#ad-ext-turn > .ad-ext-turn-throw{
  display:flex !important;
  align-items:center !important;
  justify-content:center !important;
  font-size:var(--ad-ext-x01-2player-throw-points-size) !important;
  line-height:1 !important;
}

#ad-ext-turn .ad-ext-turn-points{
  display:inline-block !important;
  box-sizing:border-box !important;
  min-width:0 !important;
  width:max-content !important;
  max-width:none !important;
  padding-inline:clamp(0.24rem, 0.48vw, 0.42rem) !important;
  text-align:center !important;
  font-size:var(--ad-ext-x01-2player-live-throw-points-size) !important;
  font-weight:800 !important;
  line-height:1 !important;
  letter-spacing:0.02em !important;
}

#ad-ext-turn > .ad-ext-turn-throw img,
#ad-ext-turn > .ad-ext-turn-throw svg{
  max-width:68% !important;
  max-height:68% !important;
  filter:drop-shadow(0 0 14px rgba(255, 255, 255, 0.08)) !important;
}

.ad-ext-theme-content-slot{
  grid-column:1 / -1 !important;
  grid-row:2 / 4 !important;
  grid-template-columns:
    var(--ad-ext-x01-2player-side-width)
    minmax(0, 1fr)
    var(--ad-ext-x01-2player-side-width) !important;
  grid-template-rows:max-content max-content minmax(0, 1fr) !important;
  min-height:clamp(30rem, 76vh, 52rem) !important;
  gap:var(--ad-ext-x01-2player-column-gap) !important;
  align-content:stretch !important;
  align-items:stretch !important;
  overflow:visible !important;
}

.ad-ext-theme-content-slot > .ad-ext-theme-content-left,
.ad-ext-theme-content-left{
  grid-area:auto !important;
  grid-column:1 / -1 !important;
  grid-row:1 / -1 !important;
  min-width:0 !important;
  min-height:0 !important;
  height:100% !important;
  align-self:stretch !important;
  justify-self:stretch !important;
  position:relative !important;
  z-index:1 !important;
  pointer-events:none !important;
}

.ad-ext-theme-content-left > #ad-ext-player-display{
  pointer-events:auto !important;
}

.ad-ext-theme-content-slot > .ad-ext-theme-content-board,
.ad-ext-theme-content-board{
  grid-area:auto !important;
  grid-column:2 !important;
  grid-row:1 / -1 !important;
  min-width:0 !important;
  min-height:0 !important;
  height:100% !important;
  align-self:stretch !important;
  justify-self:stretch !important;
  padding-top:var(--ad-ext-x01-2player-board-top-pad) !important;
  position:relative !important;
  z-index:2 !important;
  pointer-events:none !important;
}

.ad-ext-theme-content-slot > .ad-ext-theme-content-board > *,
.ad-ext-theme-content-board > *{
  pointer-events:auto !important;
}

#ad-ext-player-display{
  grid-column:1 / -1 !important;
  grid-row:2 / -1 !important;
  display:grid !important;
  grid-template-columns:
    var(--ad-ext-x01-2player-side-width)
    minmax(0, 1fr)
    var(--ad-ext-x01-2player-side-width) !important;
  gap:var(--ad-ext-x01-2player-column-gap) !important;
  align-items:stretch !important;
  min-height:0 !important;
  height:100% !important;
  max-height:none !important;
  overflow:visible !important;
  pointer-events:none !important;
}

${DIRECT_PLAYER_WRAPPER_SELECTOR}{
  min-width:0 !important;
  min-height:0 !important;
  height:100% !important;
  max-height:100% !important;
  display:flex !important;
  align-items:stretch !important;
  justify-content:stretch !important;
  overflow:visible !important;
  pointer-events:auto !important;
}

${FIRST_PLAYER_WRAPPER_SELECTOR}{
  grid-column:1 !important;
}

${SECOND_PLAYER_WRAPPER_SELECTOR}{
  grid-column:3 !important;
}

${DIRECT_PLAYER_WRAPPER_SELECTOR},
${DIRECT_PLAYER_WRAPPER_SELECTOR} > .ad-ext-player{
  width:100% !important;
}

${DIRECT_PLAYER_WRAPPER_SELECTOR} > .ad-ext-player{
  height:100% !important;
  max-height:100% !important;
}

#ad-ext-player-display .ad-ext-player{
  --ad-ext-x01-2player-score-size:clamp(5.6rem, min(43cqi, 17cqb, 14.2vh), 10.4rem);
  --ad-ext-x01-2player-score-scale:1;
  --ad-ext-x01-2player-table-font-size:clamp(0.92rem, min(3.8cqi, 1.72cqb, 1.85vh), 1.08rem);
  --ad-ext-x01-2player-table-cell-font-size:clamp(1.85rem, min(10.8cqi, 8.2cqb, 5.4vh), 2.35rem);
  --ad-ext-x01-2player-table-cell-min-height:clamp(2.25rem, min(7.2cqi, 7.8cqb, 4.8vh), 3.45rem);
  --ad-ext-x01-2player-progress-gap:clamp(0.03rem, 0.12vh, 0.1rem);
  --ad-ext-x01-2player-stack-gap:clamp(0.22rem, 0.48vh, 0.4rem);
  --ad-ext-x01-2player-round-size:clamp(1.9rem, 9.8cqi, 2.85rem);
  --ad-ext-x01-2player-round-font-size:min(calc(var(--ad-ext-x01-2player-round-size) * 0.72), 1.55rem);
  --ad-ext-x01-2player-header-meta-font-size:clamp(1.47rem, min(7.2cqi, 3.075cqb), 1.8rem);
  --ad-ext-x01-2player-player-name-font-size:var(
    --ad-ext-x01-2player-shared-name-size,
    clamp(1.55rem, min(12cqi, 4.6cqb), 3rem)
  );
  --ad-ext-x01-2player-header-meta-pad-block-end:clamp(0.08rem, 0.22vh, 0.16rem);
  --ad-ext-x01-2player-identity-pad-block-end:clamp(0.08rem, 0.24vh, 0.18rem);
  --ad-ext-x01-2player-score-pad-block:clamp(0.16rem, 0.38vh, 0.3rem);
  --ad-ext-x01-2player-score-min-block-size:calc(var(--ad-ext-x01-2player-score-size) * var(--ad-ext-x01-2player-score-scale) * 0.76);
  --ad-ext-x01-2player-progress-pad-block-start:clamp(0.08rem, 0.24vh, 0.18rem);
  --ad-ext-x01-2player-progress-min-block-size:calc(clamp(1.08rem, 1.9vw, 1.4rem) + var(--ad-ext-x01-2player-progress-pad-block-start));
  min-width:0 !important;
  min-height:clamp(18rem, 58vh, 34rem) !important;
  height:auto !important;
  container-type:size !important;
  display:grid !important;
  grid-template-columns:minmax(0, 1fr) !important;
  grid-template-rows:max-content minmax(0, 1fr) !important;
  justify-items:stretch !important;
  row-gap:clamp(0.28rem, 0.65vh, 0.48rem) !important;
  align-content:stretch !important;
  align-items:stretch !important;
  padding:var(--ad-ext-x01-2player-card-padding) !important;
  border:1px solid rgba(236, 247, 240, 0.16) !important;
  border-radius:1.2rem !important;
  background:
    linear-gradient(
      180deg,
      var(--ad-ext-theme-card-tint-top-current),
      var(--ad-ext-theme-card-tint-bottom-current)
    ),
    linear-gradient(180deg, rgba(20, 24, 28, 0.94) 0%, rgba(14, 18, 21, 0.92) 48%, rgba(8, 11, 13, 0.92) 100%) !important;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.05),
    0 24px 60px rgba(0, 0, 0, 0.32) !important;
  overflow:hidden !important;
  position:relative !important;
}

#ad-ext-player-display .ad-ext-player::before{
  content:"" !important;
  position:absolute !important;
  inset:0 !important;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0) 32%),
    linear-gradient(90deg, rgba(255, 255, 255, 0.02) 0, rgba(255, 255, 255, 0) 28%, rgba(255, 255, 255, 0.04) 100%) !important;
  pointer-events:none !important;
}

#ad-ext-player-display .ad-ext-player > .chakra-stack{
  position:relative !important;
  display:grid !important;
  grid-template-columns:minmax(0, 1fr) !important;
  grid-template-rows:max-content max-content max-content max-content !important;
  align-content:start !important;
  align-items:start !important;
  justify-items:stretch !important;
  justify-self:stretch !important;
  gap:clamp(0.08rem, 0.22vh, 0.2rem) !important;
  width:100% !important;
  min-height:max-content !important;
  height:auto !important;
  padding:0 !important;
  border:0 !important;
  border-radius:0 !important;
  outline:0 !important;
  background:transparent !important;
  box-shadow:none !important;
  overflow:visible !important;
}

#ad-ext-player-display .ad-ext-player > ${LEGACY_PROGRESS_STACK_SELECTOR}{
  grid-template-columns:minmax(0, 1fr) !important;
  grid-template-rows:max-content max-content max-content max-content !important;
  align-content:start !important;
  align-items:start !important;
  justify-items:stretch !important;
  min-height:max-content !important;
  height:auto !important;
  padding:0 !important;
}

#ad-ext-player-display .ad-ext-player > .chakra-stack::before{
  content:none !important;
}

#ad-ext-player-display .ad-ext-player.ad-ext-player-active,
#ad-ext-player-display .ad-ext-player.ad-ext-player-winner{
  --ad-ext-theme-card-tint-top-current: var(--ad-ext-theme-active-card-tint-top);
  --ad-ext-theme-card-tint-bottom-current: var(--ad-ext-theme-active-card-tint-bottom);
  border:1px solid rgba(236, 247, 240, 0.16) !important;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.05),
    0 24px 60px rgba(0, 0, 0, 0.32) !important;
}

#ad-ext-player-display .ad-ext-player.ad-ext-player-active{
  border:1px solid var(--theme-text-highlight-color) !important;
}

#ad-ext-player-display .ad-ext-player.ad-ext-player-inactive,
#ad-ext-player-display .ad-ext-player:not(.ad-ext-player-active):not(.ad-ext-player-winner){
  border:1px solid rgba(236, 247, 240, 0.16) !important;
  opacity:1 !important;
}

#ad-ext-player-display .ad-ext-player.ad-ext-player-active > .chakra-stack,
#ad-ext-player-display .ad-ext-player.ad-ext-player-winner > .chakra-stack{
  grid-template-columns:minmax(0, 1fr) !important;
  grid-template-rows:max-content max-content max-content max-content !important;
  align-content:start !important;
  align-items:start !important;
  justify-items:stretch !important;
  padding:0 !important;
  background:transparent !important;
  background-color:transparent !important;
  border:0 !important;
  box-shadow:none !important;
}

#ad-ext-player-display .ad-ext-player.ad-ext-player-active > ${LEGACY_PROGRESS_STACK_SELECTOR},
#ad-ext-player-display .ad-ext-player.ad-ext-player-winner > ${LEGACY_PROGRESS_STACK_SELECTOR},
#ad-ext-player-display .ad-ext-player.ad-ext-player-inactive > ${LEGACY_PROGRESS_STACK_SELECTOR},
#ad-ext-player-display .ad-ext-player:not(.ad-ext-player-active):not(.ad-ext-player-winner) > ${LEGACY_PROGRESS_STACK_SELECTOR}{
  grid-template-columns:minmax(0, 1fr) !important;
  grid-template-rows:max-content max-content max-content max-content !important;
  align-content:start !important;
  align-items:start !important;
  justify-items:stretch !important;
  min-height:max-content !important;
  height:auto !important;
  padding:0 !important;
  background:transparent !important;
  background-color:transparent !important;
  border:0 !important;
}

#ad-ext-player-display .ad-ext-player > .chakra-stack > .chakra-stack:first-of-type{
  grid-column:1 !important;
  grid-row:1 !important;
  display:grid !important;
  grid-template-columns:max-content minmax(0, 1fr) !important;
  align-items:center !important;
  column-gap:clamp(0.75rem, 4.4cqi, 1.25rem) !important;
  min-width:0 !important;
  width:100% !important;
  max-width:100% !important;
  align-self:start !important;
  justify-self:stretch !important;
  margin:0 auto !important;
  border:0 !important;
  border-radius:0 !important;
  outline:0 !important;
  background:transparent !important;
  box-shadow:none !important;
  overflow:hidden !important;
}

#ad-ext-player-display .ad-ext-player > .chakra-stack > .chakra-stack:first-of-type > :first-child{
  flex:0 0 auto !important;
}

#ad-ext-player-display .ad-ext-player > .chakra-stack > .chakra-stack:first-of-type > :last-child{
  min-width:0 !important;
  width:100% !important;
}

#ad-ext-player-display .ad-ext-player > .chakra-stack > .chakra-stack:first-of-type > :last-child > span{
  display:grid !important;
  grid-template-columns:max-content minmax(0, 1fr) !important;
  align-items:center !important;
  column-gap:clamp(0.55rem, 3.4cqi, 0.95rem) !important;
  min-width:0 !important;
}

#ad-ext-player-display .ad-ext-player > ${LEGACY_PROGRESS_STACK_SELECTOR} > :nth-child(3) > :first-child{
  display:flex !important;
  align-items:center !important;
  justify-content:center !important;
  align-self:center !important;
  flex:0 0 2.325rem !important;
  width:2.325rem !important;
  min-width:2.325rem !important;
  max-width:2.325rem !important;
  height:2.325rem !important;
  min-height:2.325rem !important;
  max-height:2.325rem !important;
}

#ad-ext-player-display .ad-ext-player > ${LEGACY_PROGRESS_STACK_SELECTOR} > :nth-child(3) > :first-child > span{
  display:flex !important;
  align-items:center !important;
  justify-content:center !important;
  width:2.325rem !important;
  min-width:2.325rem !important;
  max-width:2.325rem !important;
  height:2.325rem !important;
  min-height:2.325rem !important;
  max-height:2.325rem !important;
  padding:0 !important;
  border-radius:999px !important;
  aspect-ratio:1 / 1 !important;
  line-height:1 !important;
}

${SECOND_PLAYER_WRAPPER_SELECTOR} .ad-ext-player > ${LEGACY_PROGRESS_STACK_SELECTOR} > :nth-child(3) > :last-child{
  flex:1 1 auto !important;
  width:auto !important;
  max-width:none !important;
  min-width:0 !important;
}

${SECOND_PLAYER_WRAPPER_SELECTOR} .ad-ext-player > ${LEGACY_PROGRESS_STACK_SELECTOR} > :nth-child(3) > :last-child > span{
  display:grid !important;
  grid-template-columns:max-content minmax(0, 1fr) !important;
  align-items:center !important;
  width:100% !important;
  max-width:100% !important;
  min-width:0 !important;
}

${SECOND_PLAYER_WRAPPER_SELECTOR} .ad-ext-player > ${LEGACY_PROGRESS_STACK_SELECTOR} > :nth-child(3) > :last-child > span > :last-child{
  width:100% !important;
  max-width:100% !important;
  min-width:0 !important;
}

#ad-ext-player-display .ad-ext-player > ${LEGACY_PROGRESS_STACK_SELECTOR} > :nth-child(3) > :last-child > span > :last-child{
  min-height:1.73rem !important;
  display:flex !important;
  align-items:center !important;
  gap:clamp(0.45rem, 2.8cqi, 0.9rem) !important;
}

#ad-ext-player-display .ad-ext-player > .chakra-stack > .chakra-stack:first-of-type > :last-child > span > :first-child{
  display:flex !important;
  align-items:center !important;
  gap:clamp(0.4rem, 2.35cqi, 0.72rem) !important;
  flex:0 0 auto !important;
}

#ad-ext-player-display .ad-ext-player > .chakra-stack > .chakra-stack:first-of-type > :last-child > span > :last-child{
  min-width:0 !important;
  display:grid !important;
  grid-template-columns:minmax(0, 1fr) max-content !important;
  align-items:center !important;
  column-gap:clamp(0.45rem, 2.8cqi, 0.9rem) !important;
}

#ad-ext-player-display .ad-ext-player > .chakra-stack > .chakra-stack:last-of-type{
  grid-column:1 !important;
  grid-row:2 !important;
  min-width:0 !important;
  width:100% !important;
  max-width:100% !important;
  min-height:0 !important;
  align-self:start !important;
  justify-self:stretch !important;
  margin-top:0 !important;
  padding-left:0 !important;
  border:0 !important;
  border-radius:0 !important;
  outline:0 !important;
  background:transparent !important;
  box-shadow:none !important;
  overflow:hidden !important;
}

#ad-ext-player-display .ad-ext-player > .chakra-stack,
#ad-ext-player-display .ad-ext-player > .chakra-stack::before,
#ad-ext-player-display .ad-ext-player > .chakra-stack::after,
#ad-ext-player-display .ad-ext-player > .chakra-stack > .chakra-stack:first-of-type,
#ad-ext-player-display .ad-ext-player > .chakra-stack > .chakra-stack:last-of-type{
  border-color:transparent !important;
}

#ad-ext-player-display .ad-ext-player > div:not(.chakra-stack):empty{
  display:none !important;
}

#ad-ext-player-display .ad-ext-player > div:last-child{
  grid-row:2 !important;
  position:relative !important;
  display:grid !important;
  grid-template-rows:minmax(0, 1fr) !important;
  align-self:stretch !important;
  justify-self:stretch !important;
  align-content:end !important;
  justify-items:center !important;
  width:100% !important;
  min-width:0 !important;
  min-height:0 !important;
  height:100% !important;
  padding-top:clamp(0.14rem, 0.32vh, 0.28rem) !important;
  margin-top:0 !important;
}

#ad-ext-player-display .ad-ext-player > div:last-child::before{
  content:"" !important;
  position:absolute !important;
  top:0 !important;
  left:0 !important;
  right:0 !important;
  height:1px !important;
  background:
    linear-gradient(90deg, rgba(236, 247, 240, 0) 0%, rgba(236, 247, 240, 0.18) 16%, rgba(236, 247, 240, 0.18) 84%, rgba(236, 247, 240, 0) 100%) !important;
  pointer-events:none !important;
}

#ad-ext-player-display .ad-ext-player > div:last-child,
#ad-ext-player-display .ad-ext-player > div:last-child > *,
#ad-ext-player-display .ad-ext-player > div:last-child > * > *{
  max-width:100% !important;
}

#ad-ext-player-display .ad-ext-player > div:last-child > *{
  width:100% !important;
}

#ad-ext-player-display .ad-ext-player .ad-ext-player-name,
#ad-ext-player-display .ad-ext-player .ad-ext-player-name > p{
  display:block !important;
  min-width:0 !important;
  width:100% !important;
  max-width:100% !important;
  max-inline-size:100% !important;
  font-size:var(--ad-ext-x01-2player-player-name-font-size) !important;
  line-height:0.95 !important;
  font-weight:800 !important;
  letter-spacing:0 !important;
  color:var(--ad-ext-theme-name-color) !important;
  text-transform:none !important;
  text-align:center !important;
}

#ad-ext-player-display .ad-ext-player .ad-ext-player-name > p,
#ad-ext-player-display .ad-ext-player .chakra-text.css-11cuipc{
  display:inline-block !important;
  width:auto !important;
  max-width:none !important;
  white-space:nowrap !important;
  overflow:visible !important;
  overflow-wrap:normal !important;
  word-break:normal !important;
  hyphens:none !important;
  text-overflow:clip !important;
}

${SECOND_PLAYER_WRAPPER_SELECTOR} .ad-ext-player .ad-ext-player-name,
${SECOND_PLAYER_WRAPPER_SELECTOR} .ad-ext-player .ad-ext-player-name > p{
  width:100% !important;
  max-width:100% !important;
  max-inline-size:100% !important;
}

#ad-ext-player-display .ad-ext-player .css-g0ywsj,
#ad-ext-player-display .ad-ext-player .css-g0ywsj > p{
  display:block !important;
  min-width:0 !important;
  width:100% !important;
  max-width:100% !important;
  align-self:center !important;
}

#ad-ext-player-display .ad-ext-player .chakra-text.css-11cuipc{
  font-size:inherit !important;
  line-height:inherit !important;
  font-weight:inherit !important;
  letter-spacing:inherit !important;
  color:inherit !important;
  text-transform:inherit !important;
  text-align:inherit !important;
}

#ad-ext-player-display .ad-ext-player > .chakra-stack:not(${STACK_SELECTOR}) > p.chakra-text.ad-ext-player-score,
#ad-ext-player-display .ad-ext-player > .chakra-stack:not(${STACK_SELECTOR}) > .ad-ext-player-score,
#ad-ext-player-display .ad-ext-player > .chakra-stack:not(${STACK_SELECTOR}) > .ad-ext_winner-score-wrapper > p,
#ad-ext-player-display .ad-ext-player > ${LEGACY_PROGRESS_STACK_SELECTOR} > p.chakra-text.ad-ext-player-score,
#ad-ext-player-display .ad-ext-player > ${LEGACY_PROGRESS_STACK_SELECTOR} > .ad-ext-player-score,
#ad-ext-player-display .ad-ext-player > ${LEGACY_PROGRESS_STACK_SELECTOR} > .ad-ext_winner-score-wrapper > p{
  grid-column:1 !important;
  grid-row:3 !important;
  display:block !important;
  align-self:start !important;
  justify-self:stretch !important;
  width:100% !important;
  min-width:0 !important;
  max-width:100% !important;
  max-inline-size:100% !important;
  padding:0 !important;
  font-size:calc(var(--ad-ext-x01-2player-score-size) * var(--ad-ext-x01-2player-score-scale)) !important;
  line-height:0.78 !important;
  font-weight:800 !important;
  color:var(--ad-ext-theme-score-inactive-color) !important;
  text-shadow:0 0 26px rgba(255, 255, 255, 0.08) !important;
  text-align:center !important;
  margin:0 !important;
}

#ad-ext-player-display .ad-ext-player.ad-ext-player-active > ${LEGACY_PROGRESS_STACK_SELECTOR} > .ad-ext-player-score,
#ad-ext-player-display .ad-ext-player.ad-ext-player-active > ${LEGACY_PROGRESS_STACK_SELECTOR} > p.chakra-text.ad-ext-player-score,
#ad-ext-player-display .ad-ext-player.ad-ext-player-winner > ${LEGACY_PROGRESS_STACK_SELECTOR} > .ad-ext-player-score,
#ad-ext-player-display .ad-ext-player.ad-ext-player-winner > ${LEGACY_PROGRESS_STACK_SELECTOR} > p.chakra-text.ad-ext-player-score,
#ad-ext-player-display .ad-ext-player.ad-ext-player-inactive > ${LEGACY_PROGRESS_STACK_SELECTOR} > .ad-ext-player-score,
#ad-ext-player-display .ad-ext-player.ad-ext-player-inactive > ${LEGACY_PROGRESS_STACK_SELECTOR} > p.chakra-text.ad-ext-player-score,
#ad-ext-player-display .ad-ext-player:not(.ad-ext-player-active):not(.ad-ext-player-winner) > ${LEGACY_PROGRESS_STACK_SELECTOR} > .ad-ext-player-score,
#ad-ext-player-display .ad-ext-player:not(.ad-ext-player-active):not(.ad-ext-player-winner) > ${LEGACY_PROGRESS_STACK_SELECTOR} > p.chakra-text.ad-ext-player-score,
#ad-ext-player-display .ad-ext-player.ad-ext-player-active > ${LEGACY_PROGRESS_STACK_SELECTOR} > .ad-ext_winner-score-wrapper > p,
#ad-ext-player-display .ad-ext-player.ad-ext-player-winner > ${LEGACY_PROGRESS_STACK_SELECTOR} > .ad-ext_winner-score-wrapper > p,
#ad-ext-player-display .ad-ext-player.ad-ext-player-inactive > ${LEGACY_PROGRESS_STACK_SELECTOR} > .ad-ext_winner-score-wrapper > p,
#ad-ext-player-display .ad-ext-player:not(.ad-ext-player-active):not(.ad-ext-player-winner) > ${LEGACY_PROGRESS_STACK_SELECTOR} > .ad-ext_winner-score-wrapper > p{
  align-self:start !important;
  justify-self:stretch !important;
  line-height:0.78 !important;
}

#ad-ext-player-display .ad-ext-player.ad-ext-player-active > ${LEGACY_PROGRESS_STACK_SELECTOR} > .ad-ext-player-score,
#ad-ext-player-display .ad-ext-player.ad-ext-player-active > ${LEGACY_PROGRESS_STACK_SELECTOR} > p.chakra-text.ad-ext-player-score,
#ad-ext-player-display .ad-ext-player.ad-ext-player-winner > ${LEGACY_PROGRESS_STACK_SELECTOR} > .ad-ext-player-score,
#ad-ext-player-display .ad-ext-player.ad-ext-player-winner > ${LEGACY_PROGRESS_STACK_SELECTOR} > p.chakra-text.ad-ext-player-score,
#ad-ext-player-display .ad-ext-player.ad-ext-player-active > ${LEGACY_PROGRESS_STACK_SELECTOR} > .ad-ext_winner-score-wrapper > p,
#ad-ext-player-display .ad-ext-player.ad-ext-player-winner > ${LEGACY_PROGRESS_STACK_SELECTOR} > .ad-ext_winner-score-wrapper > p{
  color:var(--ad-ext-theme-score-active-color) !important;
}

#ad-ext-player-display .ad-ext-player > ${LEGACY_PROGRESS_STACK_SELECTOR} > [data-ad-ext-x01-score-progress="true"]{
  --ad-ext-x01-score-progress-margin-top-active:var(--ad-ext-x01-2player-progress-gap) !important;
  --ad-ext-x01-score-progress-margin-top-inactive:var(--ad-ext-x01-2player-progress-gap) !important;
  grid-column:1 / -1 !important;
  grid-row:4 !important;
  margin-top:var(--ad-ext-x01-2player-progress-gap) !important;
  align-self:start !important;
}

#ad-ext-player-display .ad-ext-player .css-1j0bqop{
  padding-left:0 !important;
  min-width:0 !important;
  width:100% !important;
  max-width:100% !important;
  font-size:clamp(0.98rem, min(4.8cqi, 2.05cqb), 1.2rem) !important;
  line-height:1 !important;
  white-space:nowrap !important;
  overflow:hidden !important;
  text-overflow:ellipsis !important;
  color:var(--ad-ext-theme-meta-color) !important;
}

#ad-ext-player-display .ad-ext-player > ${STACK_SELECTOR} > ${STACK_HEADER_META_SELECTOR} .css-1j0bqop{
  font-size:var(--ad-ext-x01-2player-header-meta-font-size) !important;
  line-height:1.05 !important;
  text-align:right !important;
}

#ad-ext-player-display .ad-ext-player .css-1k3nd6z{
  display:grid !important;
  place-items:start center !important;
  align-self:start !important;
  min-width:var(--ad-ext-x01-2player-round-size) !important;
}

#ad-ext-player-display .ad-ext-player .css-1k3nd6z > span.css-3fr5p8,
#ad-ext-player-display .ad-ext-player .css-1k3nd6z > .css-3fr5p8{
  display:flex !important;
  align-items:center !important;
  justify-content:center !important;
  width:var(--ad-ext-x01-2player-round-size) !important;
  min-width:var(--ad-ext-x01-2player-round-size) !important;
  max-width:var(--ad-ext-x01-2player-round-size) !important;
  height:var(--ad-ext-x01-2player-round-size) !important;
  min-height:var(--ad-ext-x01-2player-round-size) !important;
  max-height:var(--ad-ext-x01-2player-round-size) !important;
  padding:0 !important;
  flex:0 0 auto !important;
  border-radius:999px !important;
  aspect-ratio:1 / 1 !important;
  background:#8fe28d !important;
  background-image:linear-gradient(180deg, #a8ef7d 0%, #87dc62 100%) !important;
  color:#142112 !important;
  opacity:1 !important;
  visibility:visible !important;
  box-shadow:
    0 0 0 1px rgba(164, 240, 124, 0.2),
    0 0.22rem 0.5rem rgba(97, 170, 75, 0.18) !important;
}

#ad-ext-player-display .ad-ext-player .chakra-avatar,
#ad-ext-player-display .ad-ext-player .chakra-avatar__img,
#ad-ext-player-display .ad-ext-player .chakra-avatar__initials{
  width:clamp(2.6rem, 16cqi, 3.5rem) !important;
  height:clamp(2.6rem, 16cqi, 3.5rem) !important;
}

#ad-ext-player-display .ad-ext-player .css-3fr5p8{
  display:inline-grid !important;
  place-items:center !important;
  inline-size:var(--ad-ext-x01-2player-round-size) !important;
  block-size:var(--ad-ext-x01-2player-round-size) !important;
  width:var(--ad-ext-x01-2player-round-size) !important;
  height:var(--ad-ext-x01-2player-round-size) !important;
  min-width:var(--ad-ext-x01-2player-round-size) !important;
  min-height:var(--ad-ext-x01-2player-round-size) !important;
  padding:0 !important;
  flex:0 0 auto !important;
  aspect-ratio:1 / 1 !important;
  border-radius:999px !important;
  background:linear-gradient(180deg, #a8ef7d 0%, #87dc62 100%) !important;
  background-color:#8fe28d !important;
  color:#142112 !important;
  box-shadow:
    0 0 0 1px rgba(164, 240, 124, 0.2),
    0 0.22rem 0.5rem rgba(97, 170, 75, 0.18) !important;
}

#ad-ext-player-display .ad-ext-player .chakra-badge{
  background:transparent !important;
  color:#d7e6db !important;
  border-radius:999px !important;
  box-shadow:none !important;
}

#ad-ext-player-display .ad-ext-player .chakra-badge{
  font-size:clamp(0.94rem, min(4.6cqi, 1.92cqb), 1.16rem) !important;
}

#ad-ext-player-display .ad-ext-player .css-3fr5p8 > p{
  font-size:var(--ad-ext-x01-2player-round-font-size) !important;
  line-height:1 !important;
  font-weight:800 !important;
  color:inherit !important;
}

#ad-ext-player-display .ad-ext-player .ad-ext-avg-trend-arrow{
  margin-left:clamp(0.22rem, 1.2cqi, 0.42rem) !important;
}

#ad-ext-player-display .ad-ext-player .ad-ext-avg-trend-arrow.ad-ext-avg-trend-up{
  border-left:clamp(0.24rem, 1.05cqi, 0.38rem) solid transparent !important;
  border-right:clamp(0.24rem, 1.05cqi, 0.38rem) solid transparent !important;
  border-bottom:clamp(0.42rem, 1.75cqi, 0.7rem) solid #9fdb58 !important;
}

#ad-ext-player-display .ad-ext-player .ad-ext-avg-trend-arrow.ad-ext-avg-trend-down{
  border-left:clamp(0.24rem, 1.05cqi, 0.38rem) solid transparent !important;
  border-right:clamp(0.24rem, 1.05cqi, 0.38rem) solid transparent !important;
  border-top:clamp(0.42rem, 1.75cqi, 0.7rem) solid #f87171 !important;
}

#ad-ext-player-display .ad-ext-player > ${STACK_SELECTOR}{
  grid-template-columns:var(--ad-ext-x01-2player-round-size) minmax(0, 1fr) !important;
  grid-template-rows:minmax(var(--ad-ext-x01-2player-round-size), max-content) max-content minmax(var(--ad-ext-x01-2player-score-min-block-size), max-content) max-content !important;
  column-gap:clamp(0.5rem, 2.4cqi, 0.75rem) !important;
  row-gap:var(--ad-ext-x01-2player-stack-gap) !important;
  min-height:max-content !important;
  height:auto !important;
  justify-items:stretch !important;
  align-content:start !important;
  isolation:isolate !important;
}

#ad-ext-player-display .ad-ext-player > ${STACK_SELECTOR},
#ad-ext-player-display .ad-ext-player > ${STACK_SELECTOR} > *,
#ad-ext-player-display .ad-ext-player > ${STACK_SELECTOR} > * > *{
  min-width:0 !important;
  max-width:100% !important;
}

#ad-ext-player-display .ad-ext-player > ${STACK_SELECTOR} > ${STACK_HEADER_META_SELECTOR}{
  grid-column:2 !important;
  grid-row:1 !important;
  display:flex !important;
  align-items:center !important;
  justify-content:flex-end !important;
  justify-items:start !important;
  align-content:start !important;
  text-align:right !important;
  min-height:var(--ad-ext-x01-2player-round-size) !important;
  row-gap:clamp(0.08rem, 0.2vh, 0.16rem) !important;
  width:100% !important;
  min-width:0 !important;
  max-width:100% !important;
  padding:0 !important;
  padding-block-end:var(--ad-ext-x01-2player-header-meta-pad-block-end) !important;
  margin:0 !important;
  background:transparent !important;
  background-color:transparent !important;
  box-shadow:none !important;
}

#ad-ext-player-display .ad-ext-player > ${STACK_SELECTOR} > ${IDENTITY_SLOT_SELECTOR}{
  grid-column:1 / -1 !important;
  grid-row:2 !important;
  display:block !important;
  width:100% !important;
  min-width:0 !important;
  max-width:100% !important;
  align-self:start !important;
  padding:0 !important;
  overflow:visible !important;
  background:transparent !important;
  background-color:transparent !important;
  box-shadow:none !important;
}

#ad-ext-player-display .ad-ext-player > ${STACK_SELECTOR} > ${IDENTITY_SLOT_SELECTOR} > :first-child{
  position:absolute !important;
  top:0 !important;
  left:0 !important;
  z-index:3 !important;
  display:grid !important;
  place-items:center !important;
  width:var(--ad-ext-x01-2player-round-size) !important;
  height:var(--ad-ext-x01-2player-round-size) !important;
  min-width:var(--ad-ext-x01-2player-round-size) !important;
  min-height:var(--ad-ext-x01-2player-round-size) !important;
  margin:0 !important;
  padding:0 !important;
}

#ad-ext-player-display .ad-ext-player > ${STACK_SELECTOR} > ${IDENTITY_SLOT_SELECTOR} > :last-child{
  min-width:0 !important;
  width:100% !important;
}

#ad-ext-player-display .ad-ext-player > ${STACK_SELECTOR} > ${IDENTITY_SLOT_SELECTOR} > :last-child > span{
  display:block !important;
  min-width:0 !important;
  width:100% !important;
}

#ad-ext-player-display .ad-ext-player > ${STACK_SELECTOR} > ${IDENTITY_SLOT_SELECTOR} > :last-child > span > :first-child{
  display:none !important;
}

#ad-ext-player-display .ad-ext-player > ${STACK_SELECTOR} > ${IDENTITY_SLOT_SELECTOR} > :last-child > span > :last-child{
  min-width:0 !important;
  display:block !important;
  width:100% !important;
  grid-template-columns:minmax(0, 1fr) !important;
  grid-auto-rows:max-content !important;
  align-items:start !important;
  align-content:center !important;
  row-gap:0 !important;
}

#ad-ext-player-display .ad-ext-player > ${STACK_SELECTOR} > ${IDENTITY_SLOT_SELECTOR} > :last-child > span > :last-child > .ad-ext-player-name,
#ad-ext-player-display .ad-ext-player > ${STACK_SELECTOR} > ${IDENTITY_SLOT_SELECTOR} > :last-child > span > :last-child > .css-g0ywsj{
  grid-column:1 !important;
  justify-self:stretch !important;
}

#ad-ext-player-display .ad-ext-player > ${STACK_SELECTOR} > ${IDENTITY_SLOT_SELECTOR} > :last-child > span > :last-child > .chakra-badge,
#ad-ext-player-display .ad-ext-player > ${STACK_SELECTOR} > ${IDENTITY_SLOT_SELECTOR} > :last-child > span > :last-child > .css-n2903v,
#ad-ext-player-display .ad-ext-player > ${STACK_SELECTOR} > ${IDENTITY_SLOT_SELECTOR} > :last-child > span > :last-child > .css-3fr5p8{
  display:none !important;
}

#ad-ext-player-display .ad-ext-player > ${STACK_SELECTOR} > ${SCORE_SLOT_SELECTOR},
#ad-ext-player-display .ad-ext-player > ${STACK_SELECTOR} > ${SCORE_SLOT_SELECTOR} > p{
  grid-column:1 !important;
  grid-row:3 !important;
  display:grid !important;
  place-items:center !important;
  width:100% !important;
  min-width:0 !important;
  max-width:100% !important;
  max-inline-size:100% !important;
  min-block-size:var(--ad-ext-x01-2player-score-min-block-size) !important;
  margin:0 !important;
  padding:0 !important;
  padding-block:var(--ad-ext-x01-2player-score-pad-block) !important;
  font-size:calc(var(--ad-ext-x01-2player-score-size) * var(--ad-ext-x01-2player-score-scale)) !important;
  line-height:0.74 !important;
  font-weight:800 !important;
  text-align:center !important;
  color:var(--ad-ext-theme-score-inactive-color) !important;
  background:transparent !important;
  background-color:transparent !important;
  box-shadow:none !important;
}

#ad-ext-player-display .ad-ext-player > ${STACK_SELECTOR} > ${PROGRESS_SLOT_SELECTOR}{
  grid-column:1 / -1 !important;
  grid-row:4 !important;
  display:block !important;
  min-block-size:var(--ad-ext-x01-2player-progress-min-block-size) !important;
  padding-block-start:var(--ad-ext-x01-2player-progress-pad-block-start) !important;
  margin-top:var(--ad-ext-x01-2player-progress-gap) !important;
  align-self:start !important;
  background:transparent !important;
  background-color:transparent !important;
  box-shadow:none !important;
}

#ad-ext-player-display .ad-ext-player > ${STACK_SELECTOR}.css-y3hfdd{
  padding-left:0 !important;
  background:transparent !important;
  background-color:transparent !important;
}

#ad-ext-player-display .ad-ext-player > ${STACK_SELECTOR} > ${SCORE_SLOT_SELECTOR}.css-1r7jzhg,
#ad-ext-player-display .ad-ext-player > ${STACK_SELECTOR}.css-y3hfdd > .css-1r7jzhg{
  grid-column-start:1 !important;
  grid-column-end:-1 !important;
  grid-row-start:3 !important;
  grid-row-end:4 !important;
}

#ad-ext-player-display .ad-ext-player > ${STACK_SELECTOR} > ${IDENTITY_SLOT_SELECTOR}.css-37hv00,
#ad-ext-player-display .ad-ext-player > ${STACK_SELECTOR}.css-y3hfdd > .css-37hv00{
  display:block !important;
  grid-column-start:1 !important;
  grid-column-end:-1 !important;
  grid-row-start:2 !important;
  grid-row-end:3 !important;
  padding-left:0 !important;
  margin-top:0 !important;
  align-self:start !important;
}

#ad-ext-player-display .ad-ext-player > ${STACK_SELECTOR} > ${STACK_HEADER_META_SELECTOR},
#ad-ext-player-display .ad-ext-player > ${STACK_SELECTOR}.css-y3hfdd > ${STACK_HEADER_META_SELECTOR}{
  display:flex !important;
  grid-column-start:2 !important;
  grid-column-end:3 !important;
  grid-row-start:1 !important;
  grid-row-end:2 !important;
  padding-left:0 !important;
  margin-top:0 !important;
  align-self:start !important;
}

#ad-ext-player-display .ad-ext-player > ${STACK_SELECTOR} > ${IDENTITY_SLOT_SELECTOR},
#ad-ext-player-display .ad-ext-player > ${STACK_SELECTOR} > ${IDENTITY_SLOT_SELECTOR} > *,
#ad-ext-player-display .ad-ext-player > ${STACK_SELECTOR} > ${IDENTITY_SLOT_SELECTOR} > * > *,
#ad-ext-player-display .ad-ext-player > ${STACK_SELECTOR} > ${IDENTITY_SLOT_SELECTOR} > * > * > *{
  background:transparent !important;
  background-color:transparent !important;
  box-shadow:none !important;
}

${ACTIVE_CARD_SELECTOR},
#ad-ext-player-display .ad-ext-player.ad-ext-player-winner{
  --ad-ext-theme-card-tint-top-current: var(--ad-ext-theme-active-card-tint-top);
  --ad-ext-theme-card-tint-bottom-current: var(--ad-ext-theme-active-card-tint-bottom);
  border:1px solid var(--ad-ext-theme-card-active-border-color) !important;
}

${INACTIVE_CARD_SELECTOR},
${INACTIVE_CARD_SELECTOR}.ad-ext-player-active{
  border:1px solid var(--ad-ext-theme-card-inactive-border-color) !important;
}

${ACTIVE_CARD_SELECTOR} > ${STACK_SELECTOR} > ${SCORE_SLOT_SELECTOR},
${ACTIVE_CARD_SELECTOR} > ${STACK_SELECTOR} > ${SCORE_SLOT_SELECTOR} > p,
#ad-ext-player-display .ad-ext-player.ad-ext-player-winner > ${STACK_SELECTOR} > ${SCORE_SLOT_SELECTOR},
#ad-ext-player-display .ad-ext-player.ad-ext-player-winner > ${STACK_SELECTOR} > ${SCORE_SLOT_SELECTOR} > p{
  color:var(--ad-ext-theme-score-active-color) !important;
}

${INACTIVE_CARD_SELECTOR} > ${STACK_SELECTOR} > ${SCORE_SLOT_SELECTOR},
${INACTIVE_CARD_SELECTOR} > ${STACK_SELECTOR} > ${SCORE_SLOT_SELECTOR} > p,
${INACTIVE_CARD_SELECTOR}.ad-ext-player-active > ${STACK_SELECTOR} > ${SCORE_SLOT_SELECTOR},
${INACTIVE_CARD_SELECTOR}.ad-ext-player-active > ${STACK_SELECTOR} > ${SCORE_SLOT_SELECTOR} > p{
  color:var(--ad-ext-theme-score-inactive-color) !important;
}

#ad-ext-player-display .ad-ext-player > ${TABLE_SLOT_SELECTOR}{
  grid-row:2 !important;
  position:relative !important;
  display:grid !important;
  grid-template-rows:minmax(0, 1fr) !important;
  align-self:stretch !important;
  justify-self:stretch !important;
  align-content:stretch !important;
  justify-items:stretch !important;
  width:100% !important;
  min-width:0 !important;
  min-height:0 !important;
  height:100% !important;
  padding-top:clamp(0.1rem, 0.24vh, 0.22rem) !important;
  margin-top:0 !important;
}

#ad-ext-player-display .ad-ext-player > ${TABLE_SLOT_SELECTOR}::before{
  content:"" !important;
  position:absolute !important;
  top:0 !important;
  left:0 !important;
  right:0 !important;
  height:1px !important;
  background:
    linear-gradient(90deg, rgba(236, 247, 240, 0) 0%, rgba(236, 247, 240, 0.18) 16%, rgba(236, 247, 240, 0.18) 84%, rgba(236, 247, 240, 0) 100%) !important;
  pointer-events:none !important;
}

#ad-ext-player-display .ad-ext-player > ${TABLE_SLOT_SELECTOR},
#ad-ext-player-display .ad-ext-player > ${TABLE_SLOT_SELECTOR} > *,
#ad-ext-player-display .ad-ext-player > ${TABLE_SLOT_SELECTOR} > * > *{
  max-width:100% !important;
}

#ad-ext-player-display .ad-ext-player > ${TABLE_SLOT_SELECTOR} > *{
  width:100% !important;
}

/* Final slot-order guard:
   keep the 2player score stack deterministic even when legacy theme rules
   and shared score-progress stack defaults both match the same DOM. */
#ad-ext-player-display .ad-ext-player > ${STACK_SELECTOR}{
  display:grid !important;
  grid-template-columns:var(--ad-ext-x01-2player-round-size) minmax(0, 1fr) !important;
  grid-template-rows:minmax(var(--ad-ext-x01-2player-round-size), max-content) max-content minmax(var(--ad-ext-x01-2player-score-min-block-size), max-content) max-content !important;
  grid-template-areas:
    "rounds meta"
    "identity identity"
    "score score"
    "progress progress" !important;
  column-gap:clamp(0.5rem, 2.4cqi, 0.75rem) !important;
  row-gap:var(--ad-ext-x01-2player-stack-gap) !important;
  padding:0 !important;
}

#ad-ext-player-display .ad-ext-player > ${STACK_SELECTOR} > ${STACK_HEADER_META_SELECTOR}{
  grid-area:meta !important;
  grid-column:2 !important;
  grid-row:1 !important;
  z-index:3 !important;
}

#ad-ext-player-display .ad-ext-player > ${STACK_SELECTOR} > ${IDENTITY_SLOT_SELECTOR}{
  grid-area:identity !important;
  grid-column:1 / -1 !important;
  grid-row:2 !important;
}

#ad-ext-player-display .ad-ext-player > ${STACK_SELECTOR} > ${SCORE_SLOT_SELECTOR},
#ad-ext-player-display .ad-ext-player > ${STACK_SELECTOR} > ${SCORE_SLOT_SELECTOR}.ad-ext-player-score,
#ad-ext-player-display .ad-ext-player > ${STACK_SELECTOR} > ${SCORE_SLOT_SELECTOR}.ad-ext_winner-score-wrapper,
#ad-ext-player-display .ad-ext-player > ${STACK_SELECTOR} > ${SCORE_SLOT_SELECTOR} > p,
#ad-ext-player-display .ad-ext-player > ${STACK_SELECTOR} > ${SCORE_SLOT_SELECTOR}.ad-ext_winner-score-wrapper > p{
  grid-area:score !important;
  grid-column:1 / -1 !important;
  grid-row:3 !important;
  align-self:stretch !important;
  justify-self:stretch !important;
  z-index:2 !important;
}

#ad-ext-player-display .ad-ext-player > ${STACK_SELECTOR} > ${PROGRESS_SLOT_SELECTOR}{
  grid-area:progress !important;
  grid-column:1 / -1 !important;
  grid-row:4 !important;
  align-self:start !important;
  justify-self:stretch !important;
  margin-top:var(--ad-ext-x01-2player-progress-gap) !important;
  z-index:1 !important;
}

#ad-ext-player-display .ad-ext-player > ${STACK_SELECTOR} > ${PROGRESS_SLOT_SELECTOR}[data-ad-ext-x01-score-progress-size="schmal"]{
  --ad-ext-x01-2player-progress-min-block-size:calc(clamp(.3rem, .62vw, .46rem) + var(--ad-ext-x01-2player-progress-pad-block-start));
}

#ad-ext-player-display .ad-ext-player > ${STACK_SELECTOR} > ${PROGRESS_SLOT_SELECTOR}[data-ad-ext-x01-score-progress-size="standard"]{
  --ad-ext-x01-2player-progress-min-block-size:calc(clamp(.72rem, 1.35vw, 1.02rem) + var(--ad-ext-x01-2player-progress-pad-block-start));
}

#ad-ext-player-display .ad-ext-player > ${STACK_SELECTOR} > ${PROGRESS_SLOT_SELECTOR}[data-ad-ext-x01-score-progress-size="breit"]{
  --ad-ext-x01-2player-progress-min-block-size:calc(clamp(1.08rem, 1.9vw, 1.4rem) + var(--ad-ext-x01-2player-progress-pad-block-start));
}

#ad-ext-player-display .ad-ext-player > ${STACK_SELECTOR} > ${PROGRESS_SLOT_SELECTOR}[data-ad-ext-x01-score-progress-size="extrabreit"]{
  --ad-ext-x01-2player-progress-min-block-size:calc(clamp(1.48rem, 2.52vw, 1.92rem) + var(--ad-ext-x01-2player-progress-pad-block-start));
}

#ad-ext-player-display .ad-ext-player.ad-ext-player-inactive > .chakra-stack[data-ad-ext-x01-score-progress-stack="true"]${STACK_SELECTOR},
#ad-ext-player-display .ad-ext-player:not(.ad-ext-player-active):not(.ad-ext-player-winner) > .chakra-stack[data-ad-ext-x01-score-progress-stack="true"]${STACK_SELECTOR}{
  min-height:max-content !important;
  height:auto !important;
  padding:0 !important;
}

#ad-ext-player-display .ad-ext-player.ad-ext-player-inactive > .chakra-stack[data-ad-ext-x01-score-progress-stack="true"]${STACK_SELECTOR} > ${SCORE_SLOT_SELECTOR},
#ad-ext-player-display .ad-ext-player.ad-ext-player-inactive > .chakra-stack[data-ad-ext-x01-score-progress-stack="true"]${STACK_SELECTOR} > ${SCORE_SLOT_SELECTOR} > p,
#ad-ext-player-display .ad-ext-player:not(.ad-ext-player-active):not(.ad-ext-player-winner) > .chakra-stack[data-ad-ext-x01-score-progress-stack="true"]${STACK_SELECTOR} > ${SCORE_SLOT_SELECTOR},
#ad-ext-player-display .ad-ext-player:not(.ad-ext-player-active):not(.ad-ext-player-winner) > .chakra-stack[data-ad-ext-x01-score-progress-stack="true"]${STACK_SELECTOR} > ${SCORE_SLOT_SELECTOR} > p{
  line-height:0.74 !important;
  align-self:stretch !important;
}

#ad-ext-player-display .ad-ext-player table{
  width:100% !important;
  min-height:0 !important;
  height:100% !important;
  table-layout:fixed !important;
  border-collapse:collapse !important;
  border:1px solid rgba(236, 247, 240, 0.16) !important;
  border-radius:1rem !important;
  overflow:hidden !important;
  font-size:var(--ad-ext-x01-2player-table-font-size) !important;
  line-height:1 !important;
  font-variant-numeric:tabular-nums !important;
  background:
    linear-gradient(180deg, rgba(4, 7, 9, 0.34), rgba(255, 255, 255, 0.02)) !important;
}

#ad-ext-player-display .ad-ext-player table td,
#ad-ext-player-display .ad-ext-player table th{
  border:1px solid rgba(236, 247, 240, 0.12) !important;
  padding:clamp(0.2rem, 0.62cqb, 0.48rem) clamp(0.3rem, 1.15cqi, 0.58rem) !important;
  color:#eff7f2 !important;
  background:transparent !important;
  font-size:var(--ad-ext-x01-2player-table-cell-font-size) !important;
  line-height:1 !important;
  text-align:center !important;
  white-space:nowrap !important;
  overflow:hidden !important;
  text-overflow:clip !important;
}

#ad-ext-player-display .ad-ext-player table td{
  min-height:var(--ad-ext-x01-2player-table-cell-min-height) !important;
}

#ad-ext-player-display .ad-ext-player table td.${X01_TWO_PLAYER_STALE_REMAINING_CLASS}{
  position:relative !important;
  opacity:0.74 !important;
}

#ad-ext-player-display .ad-ext-player table td.${X01_TWO_PLAYER_STALE_REMAINING_CLASS}::after{
  content:"" !important;
  position:absolute !important;
  inset:0.14em 0.22em !important;
  pointer-events:none !important;
  background:linear-gradient(
    to bottom right,
    transparent calc(50% - 0.045em),
    rgba(239, 247, 242, 0.78) calc(50% - 0.045em),
    rgba(239, 247, 242, 0.78) calc(50% + 0.045em),
    transparent calc(50% + 0.045em)
  ) !important;
}

.ad-ext-theme-board-panel{
  min-height:0 !important;
  height:100% !important;
  align-self:stretch !important;
  container-type:size !important;
  padding:0 !important;
  border:0 !important;
  border-radius:0 !important;
  background:transparent !important;
  box-shadow:none !important;
  display:grid !important;
  place-items:center !important;
  overflow:visible !important;
}

.css-1kejrvi,
.css-14xtjvc{
  grid-column:2 !important;
  grid-row:3 !important;
  align-self:stretch !important;
  height:100% !important;
  margin-top:0 !important;
  padding-top:var(--ad-ext-x01-2player-board-top-pad) !important;
}

.ad-ext-theme-board-controls{
  top:calc(var(--ad-ext-x01-2player-turn-clearance) + 0.25rem) !important;
  right:0.55rem !important;
  z-index:10 !important;
  min-height:var(--ad-ext-x01-2player-controls-height) !important;
  display:flex !important;
  align-items:center !important;
  gap:0.28rem !important;
  padding:0.12rem !important;
  border-radius:0 !important;
  background:transparent !important;
  background-color:transparent !important;
  box-shadow:none !important;
  backdrop-filter:none !important;
}

.ad-ext-theme-board-controls > *,
.ad-ext-theme-board-controls button{
  min-height:calc(var(--ad-ext-x01-2player-controls-height) - 0.24rem) !important;
}

.ad-ext-x01-2player-board-controls-portal{
  position:fixed !important;
  z-index:2147483000 !important;
  pointer-events:none !important;
}

.ad-ext-x01-2player-board-controls-portal > .ad-ext-theme-board-controls{
  position:relative !important;
  top:auto !important;
  right:auto !important;
  z-index:2147483000 !important;
  isolation:isolate !important;
  pointer-events:auto !important;
}

.ad-ext-x01-2player-board-controls-portal .ad-ext-theme-board-controls button{
  position:relative !important;
  z-index:1 !important;
}

.ad-ext-theme-content-board.ad-ext-theme-board-panel > .ad-ext-theme-board-controls,
.css-1kejrvi.ad-ext-theme-board-panel > .ad-ext-theme-board-controls,
.css-14xtjvc.ad-ext-theme-board-panel > .ad-ext-theme-board-controls{
  top:calc(var(--ad-ext-x01-2player-live-turn-height) + var(--ad-ext-x01-2player-turn-clearance)) !important;
}

.ad-ext-theme-board-viewport{
  min-height:0 !important;
  width:100% !important;
  height:100% !important;
  align-self:stretch !important;
  justify-self:stretch !important;
  display:grid !important;
  place-items:center center !important;
  padding-bottom:0.15rem !important;
  overflow:visible !important;
}

.css-tqsk66{
  padding-bottom:0 !important;
}

.ad-ext-theme-board-canvas{
  position:relative !important;
  isolation:isolate !important;
  transform:translateY(0) !important;
  transform-origin:center center !important;
  max-width:100% !important;
  max-height:100% !important;
}

.ad-ext-theme-board-canvas::before{
  content:"" !important;
  position:absolute !important;
  inset:-14% !important;
  border-radius:50% !important;
  background:
    radial-gradient(circle, rgba(90, 244, 163, 0.46) 0, rgba(90, 244, 163, 0.2) 29%, rgba(90, 244, 163, 0.08) 46%, rgba(90, 244, 163, 0) 70%) !important;
  filter:blur(18px) !important;
  z-index:-1 !important;
  pointer-events:none !important;
}

.ad-ext-theme-board-panel .ad-ext-theme-board-svg[viewBox="0 0 1000 1000"],
.ad-ext-theme-board-panel svg[viewBox="0 0 1000 1000"]{
  filter:drop-shadow(0 16px 28px rgba(0, 0, 0, 0.42)) !important;
}

@media (max-width: 1180px){
  .css-tkevr6 > .chakra-stack{
    grid-template-columns:minmax(0, 1fr) !important;
  }

  .ad-ext-theme-content-slot{
    grid-template-columns:minmax(0, 1fr) !important;
    min-height:auto !important;
    grid-row:3 !important;
  }

  .ad-ext-theme-content-left,
  .ad-ext-theme-content-board{
    grid-column:1 !important;
  }

  #ad-ext-turn{
    grid-column:1 !important;
  }

  #ad-ext-player-display{
    grid-template-columns:repeat(2, minmax(0, 1fr)) !important;
    height:auto !important;
    grid-row:3 !important;
    pointer-events:auto !important;
  }

  ${FIRST_PLAYER_WRAPPER_SELECTOR},
  ${SECOND_PLAYER_WRAPPER_SELECTOR}{
    grid-column:auto !important;
  }

  #ad-ext-player-display .ad-ext-player{
    --ad-ext-x01-2player-score-size:clamp(6.048rem, min(24vw, 14.4vh), 9.25rem);
    --ad-ext-x01-2player-score-scale:1.14;
    --ad-ext-x01-2player-table-font-size:clamp(0.88rem, min(3.2vw, 1.75vh), 1rem);
    --ad-ext-x01-2player-table-cell-font-size:clamp(1.6rem, min(7.4vw, 8cqb, 5vh), 2.15rem);
    --ad-ext-x01-2player-table-cell-min-height:clamp(2.1rem, min(5.8vw, 3.8vh), 2.85rem);
    min-height:clamp(17rem, 50vh, 29rem) !important;
  }

  #ad-ext-player-display .ad-ext-player .ad-ext-player-score,
  #ad-ext-player-display .ad-ext-player .ad-ext_winner-score-wrapper > p{
    font-size:calc(var(--ad-ext-x01-2player-score-size) * var(--ad-ext-x01-2player-score-scale)) !important;
  }

  .ad-ext-theme-content-board,
  .css-1kejrvi,
  .css-14xtjvc{
    padding-top:calc(
      var(--ad-ext-x01-2player-turn-height)
      + var(--ad-ext-x01-2player-turn-clearance)
      + var(--ad-ext-x01-2player-controls-height)
      + clamp(0.55rem, 1vh, 0.8rem)
    ) !important;
  }
}

@media (max-width: 820px){
  #ad-ext-turn{
    grid-template-columns:repeat(3, minmax(0, 1fr)) !important;
    gap:0.55rem !important;
  }

  #ad-ext-turn > .score{
    grid-column:1 / -1 !important;
  }

  #ad-ext-player-display{
    grid-template-columns:minmax(0, 1fr) !important;
    height:auto !important;
  }

  #ad-ext-player-display .ad-ext-player{
    --ad-ext-x01-2player-score-size:clamp(5.616rem, min(22vw, 12vh), 8.3rem);
    --ad-ext-x01-2player-score-scale:1.08;
    --ad-ext-x01-2player-table-font-size:clamp(0.84rem, min(3.8vw, 1.7vh), 0.96rem);
    --ad-ext-x01-2player-table-cell-font-size:clamp(1.42rem, min(6.4vw, 7cqb, 4.3vh), 1.95rem);
    --ad-ext-x01-2player-table-cell-min-height:clamp(1.95rem, min(6.2vw, 3.5vh), 2.55rem);
    min-height:clamp(16rem, 44vh, 25rem) !important;
  }

  #ad-ext-player-display .ad-ext-player .ad-ext-player-score,
  #ad-ext-player-display .ad-ext-player .ad-ext_winner-score-wrapper > p{
    font-size:calc(var(--ad-ext-x01-2player-score-size) * var(--ad-ext-x01-2player-score-scale)) !important;
  }

  #ad-ext-player-display .ad-ext-player table{
    font-size:var(--ad-ext-x01-2player-table-font-size) !important;
  }

  .ad-ext-theme-content-board{
    padding-top:calc(
      var(--ad-ext-x01-2player-turn-height)
      + var(--ad-ext-x01-2player-turn-clearance)
      + var(--ad-ext-x01-2player-controls-height)
      + 0.45rem
    ) !important;
  }
}

@media (max-height: 860px){
  #ad-ext-player-display .ad-ext-player{
    --ad-ext-x01-2player-score-size:clamp(5.76rem, min(23.5cqi, 12.8vh), 8.8rem);
    --ad-ext-x01-2player-score-scale:1.06;
    --ad-ext-x01-2player-table-font-size:clamp(0.84rem, min(3.5cqi, 1.58vh), 0.98rem);
    --ad-ext-x01-2player-table-cell-font-size:clamp(1.85rem, min(10.8cqi, 8.2cqb, 5.4vh), 2.25rem);
    --ad-ext-x01-2player-table-cell-min-height:clamp(1.95rem, min(6.4cqi, 3.2vh), 2.6rem);
    min-height:clamp(16rem, 46vh, 27rem) !important;
  }
}
`;

  return buildThemeCssBundle(
    featureConfig,
    `${previewCss}${avgVisibilityCss}${themeCss}`,
    visualConfig
  );
}
