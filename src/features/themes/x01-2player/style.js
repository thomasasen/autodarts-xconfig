import { buildThemeCssBundle } from "../shared/theme-style-builder.js";
import { buildPreviewPlacementCss } from "../shared/theme-utils.js";
import {
  PLAYER_CARD_PART_ATTRIBUTE,
  PLAYER_CARD_PARTS,
} from "../../shared/player-card-parts.js";
import {
  X01_TWO_PLAYER_ACTIVE_ATTRIBUTE,
  X01_TWO_PLAYER_ACTIVE_EMPHASIS_ATTRIBUTE,
  X01_TWO_PLAYER_COLOR_SCHEME_ATTRIBUTE,
  X01_TWO_PLAYER_IDENTITY_DENSITY_ATTRIBUTE,
  X01_TWO_PLAYER_INFORMATION_DENSITY_ATTRIBUTE,
  X01_TWO_PLAYER_NAME_LAYOUT_ATTRIBUTE,
  X01_TWO_PLAYER_PLAYER_INDEX_ATTRIBUTE,
  X01_TWO_PLAYER_PLAYER_WRAPPER_ATTRIBUTE,
  X01_TWO_PLAYER_SLOT_ATTRIBUTE,
  X01_TWO_PLAYER_STACK_ATTRIBUTE,
  X01_TWO_PLAYER_VISUAL_STYLE_ATTRIBUTE,
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
const LEGACY_PROGRESS_STACK_SELECTOR = `.chakra-stack[data-ad-ext-x01-remaining-score-bar-stack="true"]:not(${STACK_SELECTOR})`;
const IDENTITY_MEDIA_SELECTOR = `[${PLAYER_CARD_PART_ATTRIBUTE}="${PLAYER_CARD_PARTS.identityMedia}"]`;
const AVATAR_SELECTOR = `[${PLAYER_CARD_PART_ATTRIBUTE}="${PLAYER_CARD_PARTS.avatar}"]`;
const FLAG_SELECTOR = `[${PLAYER_CARD_PART_ATTRIBUTE}="${PLAYER_CARD_PARTS.flag}"]`;
const ROUND_BADGE_SELECTOR = `[${PLAYER_CARD_PART_ATTRIBUTE}="${PLAYER_CARD_PARTS.roundBadge}"]`;
const PROFILE_BADGE_SELECTOR = `[${PLAYER_CARD_PART_ATTRIBUTE}="${PLAYER_CARD_PARTS.profileBadge}"]`;

export function buildX01TwoPlayerThemeCss(featureConfig = {}, options = {}) {
  const visualConfig = options.visualConfig || featureConfig;
  const previewCss = buildPreviewPlacementCss(PREVIEW_PLACEMENT);
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
  --ad-ext-theme-score-inactive-color:var(--ad-ext-theme-meta-inactive-color);
  --ad-ext-theme-meta-color:rgba(219, 230, 223, 0.9);
  --ad-ext-theme-meta-active-color:var(--ad-ext-theme-meta-color);
  --ad-ext-theme-meta-inactive-color:var(--ad-ext-theme-meta-color);
  --ad-ext-theme-turn-points-color:#f4f8f6;
  --ad-ext-theme-throw-label-color:rgba(244, 248, 246, 0.72);
  --ad-ext-x01-2player-accent-rgb:143, 226, 141;
  --ad-ext-x01-2player-card-surface-top:rgba(20, 24, 28, 0.94);
  --ad-ext-x01-2player-card-surface-mid:rgba(14, 18, 21, 0.92);
  --ad-ext-x01-2player-card-surface-bottom:rgba(8, 11, 13, 0.92);
  --ad-ext-x01-2player-card-radius:1.2rem;
  --ad-ext-x01-2player-card-border-width:1px;
  --ad-ext-x01-2player-card-shadow:inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 24px 60px rgba(0, 0, 0, 0.32);
  --ad-ext-x01-2player-inner-outline-width:1px;
  --ad-ext-x01-2player-inner-outline-alpha:0.24;
  --ad-ext-x01-2player-active-header-alpha:0.05;
  --ad-ext-x01-2player-header-current-alpha:0;
  --ad-ext-x01-2player-active-name-weight:850;
  --ad-ext-x01-2player-board-glow-alpha:0.46;
  --ad-ext-x01-2player-board-glow-blur:18px;
  --ad-ext-x01-2player-density-score-scale:1;
  --ad-ext-x01-2player-density-name-scale:1;
  --ad-ext-x01-2player-density-meta-scale:1;
  --ad-ext-x01-2player-density-min-height:clamp(18rem, 58vh, 34rem);
  --ad-ext-x01-2player-identity-scale:1;
  --ad-ext-x01-2player-active-outline-color:rgba(var(--ad-ext-x01-2player-accent-rgb), var(--ad-ext-x01-2player-inner-outline-alpha));
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
  --ad-ext-x01-2player-throw-text-size:var(--chakra-fontSizes-2xl, 1.5rem);
  --ad-ext-x01-2player-live-throw-points-size:calc(var(--ad-ext-x01-2player-throw-text-size) * 1.7);
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

:root[${X01_TWO_PLAYER_VISUAL_STYLE_ATTRIBUTE}="broadcast"]{
  --ad-ext-x01-2player-card-radius:0.55rem;
  --ad-ext-x01-2player-card-shadow:inset 0 1px 0 rgba(255, 255, 255, 0.035), 0 8px 20px rgba(0, 0, 0, 0.22);
  --ad-ext-x01-2player-active-header-alpha:0.035;
  --ad-ext-x01-2player-board-glow-alpha:0.2;
  --ad-ext-x01-2player-board-glow-blur:8px;
}

:root[${X01_TWO_PLAYER_VISUAL_STYLE_ATTRIBUTE}="high-contrast"]{
  --ad-ext-x01-2player-card-radius:0.7rem;
  --ad-ext-x01-2player-card-border-width:2px;
  --ad-ext-x01-2player-card-shadow:0 0 0 rgba(0, 0, 0, 0);
  --ad-ext-x01-2player-inner-outline-width:2px;
  --ad-ext-x01-2player-active-header-alpha:0.1;
  --ad-ext-x01-2player-board-glow-alpha:0.16;
  --ad-ext-x01-2player-board-glow-blur:6px;
}

:root[${X01_TWO_PLAYER_COLOR_SCHEME_ATTRIBUTE}="lime"]{
  --theme-bg:#080b05;
  --theme-background:#080b05;
  --theme-text-highlight-color:#b7f34a;
  --theme-navigation-bg:#11170a;
  --theme-navigation-item-color:#1d2910;
  --theme-text-color:#f8ffe8;
  --ad-ext-x01-2player-accent-rgb:183, 243, 74;
  --ad-ext-theme-text-primary-color:#f8ffe8;
  --ad-ext-theme-text-secondary-color:#dbe8bd;
  --ad-ext-theme-meta-color:rgba(219, 232, 189, 0.92);
  --ad-ext-theme-card-inactive-border-color:rgba(219, 232, 189, 0.22);
  --ad-ext-x01-2player-card-surface-top:rgba(17, 23, 10, 0.95);
  --ad-ext-x01-2player-card-surface-mid:rgba(12, 17, 7, 0.94);
  --ad-ext-x01-2player-card-surface-bottom:rgba(8, 11, 5, 0.94);
}

:root[${X01_TWO_PLAYER_COLOR_SCHEME_ATTRIBUTE}="amber"]{
  --theme-bg:#0d0904;
  --theme-background:#0d0904;
  --theme-text-highlight-color:#f6b84a;
  --theme-navigation-bg:#181208;
  --theme-navigation-item-color:#291d0b;
  --theme-text-color:#fff8e8;
  --ad-ext-x01-2player-accent-rgb:246, 184, 74;
  --ad-ext-theme-text-primary-color:#fff8e8;
  --ad-ext-theme-text-secondary-color:#ead9b8;
  --ad-ext-theme-meta-color:rgba(234, 217, 184, 0.92);
  --ad-ext-theme-card-inactive-border-color:rgba(234, 217, 184, 0.22);
  --ad-ext-x01-2player-card-surface-top:rgba(24, 18, 8, 0.95);
  --ad-ext-x01-2player-card-surface-mid:rgba(17, 12, 5, 0.94);
  --ad-ext-x01-2player-card-surface-bottom:rgba(13, 9, 4, 0.94);
}

:root[${X01_TWO_PLAYER_COLOR_SCHEME_ATTRIBUTE}="midnight-blue"]{
  --theme-bg:#050914;
  --theme-background:#050914;
  --theme-text-highlight-color:#68a8ff;
  --theme-navigation-bg:#0a1226;
  --theme-navigation-item-color:#101d3b;
  --theme-text-color:#f2f7ff;
  --ad-ext-x01-2player-accent-rgb:104, 168, 255;
  --ad-ext-theme-text-primary-color:#f2f7ff;
  --ad-ext-theme-text-secondary-color:#c5d4eb;
  --ad-ext-theme-meta-color:rgba(197, 212, 235, 0.92);
  --ad-ext-theme-card-inactive-border-color:rgba(197, 212, 235, 0.24);
  --ad-ext-x01-2player-card-surface-top:rgba(10, 18, 38, 0.95);
  --ad-ext-x01-2player-card-surface-mid:rgba(7, 13, 29, 0.94);
  --ad-ext-x01-2player-card-surface-bottom:rgba(5, 9, 20, 0.94);
}

:root[${X01_TWO_PLAYER_COLOR_SCHEME_ATTRIBUTE}="monochrome"]{
  --theme-bg:#080808;
  --theme-background:#080808;
  --theme-text-highlight-color:#f4f4f5;
  --theme-navigation-bg:#171717;
  --theme-navigation-item-color:#262626;
  --theme-text-color:#ffffff;
  --ad-ext-x01-2player-accent-rgb:244, 244, 245;
  --ad-ext-theme-text-primary-color:#ffffff;
  --ad-ext-theme-text-secondary-color:#d4d4d8;
  --ad-ext-theme-meta-color:rgba(212, 212, 216, 0.94);
  --ad-ext-theme-card-inactive-border-color:rgba(212, 212, 216, 0.28);
  --ad-ext-x01-2player-card-surface-top:rgba(23, 23, 23, 0.96);
  --ad-ext-x01-2player-card-surface-mid:rgba(15, 15, 15, 0.95);
  --ad-ext-x01-2player-card-surface-bottom:rgba(8, 8, 8, 0.95);
}

:root[${X01_TWO_PLAYER_ACTIVE_EMPHASIS_ATTRIBUTE}="subtle"]{
  --ad-ext-x01-2player-inner-outline-alpha:0.12;
  --ad-ext-x01-2player-active-header-alpha:0.025;
  --ad-ext-x01-2player-active-name-weight:800;
}

:root[${X01_TWO_PLAYER_ACTIVE_EMPHASIS_ATTRIBUTE}="strong"]{
  --ad-ext-x01-2player-inner-outline-alpha:0.48;
  --ad-ext-x01-2player-active-header-alpha:0.14;
  --ad-ext-x01-2player-active-name-weight:900;
}

:root[${X01_TWO_PLAYER_INFORMATION_DENSITY_ATTRIBUTE}="tv"]{
  --ad-ext-x01-2player-density-score-scale:1.12;
  --ad-ext-x01-2player-density-name-scale:1.06;
  --ad-ext-x01-2player-density-meta-scale:0.9;
  --ad-ext-x01-2player-card-padding:clamp(0.72rem, 1.05vw, 0.9rem);
  --ad-ext-x01-2player-stack-gap:clamp(0.16rem, 0.36vh, 0.3rem);
}

:root[${X01_TWO_PLAYER_INFORMATION_DENSITY_ATTRIBUTE}="compact"]{
  --ad-ext-x01-2player-density-score-scale:0.96;
  --ad-ext-x01-2player-density-name-scale:0.94;
  --ad-ext-x01-2player-density-meta-scale:0.86;
  --ad-ext-x01-2player-density-min-height:clamp(15rem, 48vh, 28rem);
  --ad-ext-x01-2player-card-padding:clamp(0.55rem, 0.85vw, 0.75rem);
  --ad-ext-x01-2player-stack-gap:clamp(0.1rem, 0.28vh, 0.22rem);
}

@media screen and (min-width: 48em){
  :root{
    --ad-ext-x01-2player-throw-text-size:var(--chakra-fontSizes-5xl, 3rem);
  }
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
  grid-template-columns:clamp(5.75rem, 7vw, 8rem) repeat(3, minmax(9.5rem, 1fr)) !important;
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
  font-size:var(--ad-ext-x01-2player-live-throw-points-size) !important;
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
  display:block !important;
  box-sizing:border-box !important;
  min-width:0 !important;
  width:100% !important;
  max-width:100% !important;
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

.css-tkevr6 .ad-ext-theme-content-slot > .ad-ext-theme-content-left,
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
  --ad-ext-x01-2player-state-scale:1;
  --ad-ext-x01-2player-score-size:clamp(5.6rem, min(43cqi, 17cqb, 14.2vh), 11.6rem);
  --ad-ext-x01-2player-score-scale:var(--ad-ext-x01-2player-density-score-scale);
  --ad-ext-x01-2player-table-font-size:clamp(0.92rem, min(3.8cqi, 1.72cqb, 1.85vh), calc(1.16rem * var(--ad-ext-x01-2player-state-scale)));
  --ad-ext-x01-2player-table-cell-font-size:clamp(1.85rem, min(10.8cqi, 8.2cqb, 5.4vh), calc(2.52rem * var(--ad-ext-x01-2player-state-scale)));
  --ad-ext-x01-2player-table-cell-min-height:clamp(2.25rem, min(7.2cqi, 7.8cqb, 4.8vh), calc(3.68rem * var(--ad-ext-x01-2player-state-scale)));
  --ad-ext-x01-2player-progress-gap:clamp(0.03rem, 0.12vh, 0.1rem);
  --ad-ext-x01-2player-stack-gap:clamp(0.22rem, 0.48vh, 0.4rem);
  --ad-ext-x01-2player-round-size:clamp(2.85rem, 14.7cqi, calc(4.68rem * var(--ad-ext-x01-2player-state-scale)));
  --ad-ext-x01-2player-round-font-size:min(calc(var(--ad-ext-x01-2player-round-size) * 0.72), 2.325rem);
  --ad-ext-x01-2player-header-meta-font-size:clamp(2.205rem, min(10.8cqi, 4.6125cqb), calc(2.925rem * var(--ad-ext-x01-2player-state-scale)));
  --ad-ext-x01-2player-avatar-size:calc(clamp(2.6rem, 16cqi, 3.75rem) * var(--ad-ext-x01-2player-identity-scale));
  --ad-ext-x01-2player-flag-size:calc(clamp(0.8rem, 4cqi, 1.16rem) * var(--ad-ext-x01-2player-identity-scale));
  --ad-ext-x01-2player-player-name-font-size:var(
    --ad-ext-x01-2player-shared-name-size,
    clamp(1.55rem, min(12cqi, 4.6cqb), calc(3.2rem * var(--ad-ext-x01-2player-state-scale)))
  );
  --ad-ext-x01-2player-header-meta-pad-block-end:clamp(0.08rem, 0.22vh, 0.16rem);
  --ad-ext-x01-2player-identity-pad-block-end:clamp(0.08rem, 0.24vh, 0.18rem);
  --ad-ext-x01-2player-score-pad-block:clamp(0.34rem, 0.72vh, 0.58rem);
  --ad-ext-x01-2player-score-min-block-size:calc(var(--ad-ext-x01-2player-score-size) * var(--ad-ext-x01-2player-score-scale) * 0.94);
  --ad-ext-x01-2player-progress-pad-block-start:clamp(0.08rem, 0.24vh, 0.18rem);
  --ad-ext-x01-2player-progress-min-block-size:calc(clamp(1.08rem, 1.9vw, 1.4rem) + var(--ad-ext-x01-2player-progress-pad-block-start));
  min-width:0 !important;
  min-height:var(--ad-ext-x01-2player-density-min-height) !important;
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
  border:var(--ad-ext-x01-2player-card-border-width) solid var(--ad-ext-theme-card-inactive-border-color) !important;
  border-radius:var(--ad-ext-x01-2player-card-radius) !important;
  background:
    linear-gradient(
      180deg,
      var(--ad-ext-theme-card-tint-top-current),
      var(--ad-ext-theme-card-tint-bottom-current)
    ),
    linear-gradient(180deg, var(--ad-ext-x01-2player-card-surface-top) 0%, var(--ad-ext-x01-2player-card-surface-mid) 48%, var(--ad-ext-x01-2player-card-surface-bottom) 100%) !important;
  box-shadow:var(--ad-ext-x01-2player-card-shadow) !important;
  overflow:hidden !important;
  position:relative !important;
}

#ad-ext-player-display .ad-ext-player::before{
  content:"" !important;
  position:absolute !important;
  inset:0 !important;
  background:
    linear-gradient(180deg, rgba(var(--ad-ext-x01-2player-accent-rgb), var(--ad-ext-x01-2player-header-current-alpha)), rgba(255, 255, 255, 0) 32%),
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
  --ad-ext-x01-2player-state-scale:1;
  --ad-ext-x01-2player-score-scale:var(--ad-ext-x01-2player-density-score-scale);
  --ad-ext-theme-card-tint-top-current: var(--ad-ext-theme-active-card-tint-top);
  --ad-ext-theme-card-tint-bottom-current: var(--ad-ext-theme-active-card-tint-bottom);
  --ad-ext-x01-2player-header-current-alpha:var(--ad-ext-x01-2player-active-header-alpha);
  border:var(--ad-ext-x01-2player-card-border-width) solid var(--ad-ext-theme-card-active-border-color) !important;
  box-shadow:
    inset 0 0 0 var(--ad-ext-x01-2player-inner-outline-width) var(--ad-ext-x01-2player-active-outline-color),
    var(--ad-ext-x01-2player-card-shadow) !important;
}

#ad-ext-player-display .ad-ext-player.ad-ext-player-active{
  border-color:var(--ad-ext-theme-card-active-border-color) !important;
}

#ad-ext-player-display .ad-ext-player.ad-ext-player-inactive,
#ad-ext-player-display .ad-ext-player:not(.ad-ext-player-active):not(.ad-ext-player-winner){
  --ad-ext-x01-2player-state-scale:1;
  --ad-ext-x01-2player-score-scale:var(--ad-ext-x01-2player-density-score-scale);
  border:var(--ad-ext-x01-2player-card-border-width) solid var(--ad-ext-theme-card-inactive-border-color) !important;
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

#ad-ext-player-display .ad-ext-player > .chakra-stack > .chakra-stack:first-of-type:not([${X01_TWO_PLAYER_SLOT_ATTRIBUTE}]){
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

#ad-ext-player-display .ad-ext-player > .chakra-stack > .chakra-stack:first-of-type:not([${X01_TWO_PLAYER_SLOT_ATTRIBUTE}]) > :first-child{
  flex:0 0 auto !important;
}

#ad-ext-player-display .ad-ext-player > .chakra-stack > .chakra-stack:first-of-type:not([${X01_TWO_PLAYER_SLOT_ATTRIBUTE}]) > :last-child{
  min-width:0 !important;
  width:100% !important;
}

#ad-ext-player-display .ad-ext-player > .chakra-stack > .chakra-stack:first-of-type:not([${X01_TWO_PLAYER_SLOT_ATTRIBUTE}]) > :last-child > span{
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

#ad-ext-player-display .ad-ext-player > .chakra-stack > .chakra-stack:first-of-type:not([${X01_TWO_PLAYER_SLOT_ATTRIBUTE}]) > :last-child > span > :first-child{
  display:flex !important;
  align-items:center !important;
  gap:clamp(0.4rem, 2.35cqi, 0.72rem) !important;
  flex:0 0 auto !important;
}

#ad-ext-player-display .ad-ext-player > .chakra-stack > .chakra-stack:first-of-type:not([${X01_TWO_PLAYER_SLOT_ATTRIBUTE}]) > :last-child > span > :last-child{
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
#ad-ext-player-display .ad-ext-player > .chakra-stack > .chakra-stack:first-of-type:not([${X01_TWO_PLAYER_SLOT_ATTRIBUTE}]),
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
  font-size:calc(var(--ad-ext-x01-2player-player-name-font-size) * var(--ad-ext-x01-2player-density-name-scale)) !important;
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

:root[${X01_TWO_PLAYER_NAME_LAYOUT_ATTRIBUTE}="two-lines"] #ad-ext-player-display .ad-ext-player .ad-ext-player-name,
:root[${X01_TWO_PLAYER_NAME_LAYOUT_ATTRIBUTE}="two-lines"] #ad-ext-player-display .ad-ext-player .ad-ext-player-name > p{
  display:-webkit-box !important;
  width:100% !important;
  max-width:100% !important;
  min-height:1.9em !important;
  max-height:1.9em !important;
  white-space:normal !important;
  overflow:hidden !important;
  overflow-wrap:anywhere !important;
  word-break:normal !important;
  -webkit-box-orient:vertical !important;
  -webkit-line-clamp:2 !important;
  line-clamp:2 !important;
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
  line-height:0.9 !important;
  font-weight:800 !important;
  color:var(--ad-ext-theme-meta-inactive-color) !important;
  text-shadow:0 0 26px rgba(255, 255, 255, 0.08) !important;
  text-align:center !important;
  margin:0 !important;
  overflow:visible !important;
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
  line-height:0.9 !important;
}

#ad-ext-player-display .ad-ext-player.ad-ext-player-active > ${LEGACY_PROGRESS_STACK_SELECTOR} > .ad-ext-player-score,
#ad-ext-player-display .ad-ext-player.ad-ext-player-active > ${LEGACY_PROGRESS_STACK_SELECTOR} > p.chakra-text.ad-ext-player-score,
#ad-ext-player-display .ad-ext-player.ad-ext-player-winner > ${LEGACY_PROGRESS_STACK_SELECTOR} > .ad-ext-player-score,
#ad-ext-player-display .ad-ext-player.ad-ext-player-winner > ${LEGACY_PROGRESS_STACK_SELECTOR} > p.chakra-text.ad-ext-player-score,
#ad-ext-player-display .ad-ext-player.ad-ext-player-active > ${LEGACY_PROGRESS_STACK_SELECTOR} > .ad-ext_winner-score-wrapper > p,
#ad-ext-player-display .ad-ext-player.ad-ext-player-winner > ${LEGACY_PROGRESS_STACK_SELECTOR} > .ad-ext_winner-score-wrapper > p{
  color:var(--ad-ext-theme-score-active-color) !important;
}

#ad-ext-player-display .ad-ext-player > ${LEGACY_PROGRESS_STACK_SELECTOR} > [data-ad-ext-x01-remaining-score-bar="true"]{
  --ad-ext-x01-remaining-score-bar-margin-top-active:var(--ad-ext-x01-2player-progress-gap) !important;
  --ad-ext-x01-remaining-score-bar-margin-top-inactive:var(--ad-ext-x01-2player-progress-gap) !important;
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
  font-size:calc(var(--ad-ext-x01-2player-header-meta-font-size) * var(--ad-ext-x01-2player-density-meta-scale)) !important;
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
#ad-ext-player-display .ad-ext-player .css-1k3nd6z > .css-3fr5p8,
#ad-ext-player-display .ad-ext-player .css-1cmgsw8 > span.css-3fr5p8,
#ad-ext-player-display .ad-ext-player .css-1cmgsw8 > .css-3fr5p8,
#ad-ext-player-display .ad-ext-player ${ROUND_BADGE_SELECTOR}{
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
  width:var(--ad-ext-x01-2player-avatar-size) !important;
  height:var(--ad-ext-x01-2player-avatar-size) !important;
}

#ad-ext-player-display .ad-ext-player ${FLAG_SELECTOR},
#ad-ext-player-display .ad-ext-player .chakra-image.css-6t0bzd{
  display:block !important;
  width:var(--ad-ext-x01-2player-flag-size) !important;
  height:auto !important;
  min-width:var(--ad-ext-x01-2player-flag-size) !important;
}

:root[${X01_TWO_PLAYER_IDENTITY_DENSITY_ATTRIBUTE}="name-only"] #ad-ext-player-display .ad-ext-player ${IDENTITY_MEDIA_SELECTOR},
:root[${X01_TWO_PLAYER_IDENTITY_DENSITY_ATTRIBUTE}="name-only"] #ad-ext-player-display .ad-ext-player ${FLAG_SELECTOR},
:root[${X01_TWO_PLAYER_IDENTITY_DENSITY_ATTRIBUTE}="name-only"] #ad-ext-player-display .ad-ext-player ${AVATAR_SELECTOR}{
  display:none !important;
}

:root[${X01_TWO_PLAYER_IDENTITY_DENSITY_ATTRIBUTE}="name-only"] #ad-ext-player-display .ad-ext-player > ${STACK_SELECTOR} > ${IDENTITY_SLOT_SELECTOR}{
  grid-template-columns:minmax(0, 1fr) !important;
}

#ad-ext-player-display .ad-ext-player .css-1k3nd6z > .css-3fr5p8,
#ad-ext-player-display .ad-ext-player .css-1cmgsw8 > .css-3fr5p8,
#ad-ext-player-display .ad-ext-player ${ROUND_BADGE_SELECTOR}{
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

#ad-ext-player-display .ad-ext-player .chakra-badge,
#ad-ext-player-display .ad-ext-player ${PROFILE_BADGE_SELECTOR}{
  background:var(--ad-ext-theme-profile-badge-bg, rgba(226, 232, 240, 0.18)) !important;
  color:var(--ad-ext-theme-profile-badge-color, #f8fafc) !important;
  border-radius:2px !important;
  box-shadow:inset 0 0 0 1px var(--ad-ext-theme-profile-badge-border, rgba(248, 250, 252, 0.22)) !important;
}

#ad-ext-player-display .ad-ext-player .chakra-badge,
#ad-ext-player-display .ad-ext-player ${PROFILE_BADGE_SELECTOR}{
  font-size:30px !important;
  font-weight:700 !important;
  line-height:1.2 !important;
}

#ad-ext-player-display .ad-ext-player .css-1k3nd6z > .css-3fr5p8 > p,
#ad-ext-player-display .ad-ext-player .css-1cmgsw8 > .css-3fr5p8 > p,
#ad-ext-player-display .ad-ext-player ${ROUND_BADGE_SELECTOR} > p{
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
  grid-column:1 !important;
  grid-row:1 !important;
  display:flex !important;
  align-items:center !important;
  justify-content:flex-end !important;
  justify-items:end !important;
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
  overflow:visible !important;
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
  overflow:visible !important;
}

#ad-ext-player-display .ad-ext-player > ${STACK_SELECTOR} > ${IDENTITY_SLOT_SELECTOR} > :first-child{
  position:absolute !important;
  top:0 !important;
  right:auto !important;
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
  display:grid !important;
  grid-template-columns:max-content minmax(0, 1fr) !important;
  align-items:center !important;
  column-gap:clamp(0.38rem, 1.5cqi, 0.62rem) !important;
  min-width:0 !important;
  width:100% !important;
}

#ad-ext-player-display .ad-ext-player > ${STACK_SELECTOR} > ${IDENTITY_SLOT_SELECTOR} > :last-child > span > :first-child:not(:last-child),
#ad-ext-player-display .ad-ext-player > ${STACK_SELECTOR} > ${IDENTITY_SLOT_SELECTOR} > :last-child > span > ${IDENTITY_MEDIA_SELECTOR}{
  grid-column:1 !important;
  display:inline-flex !important;
  align-items:center !important;
  justify-content:center !important;
  gap:clamp(0.18rem, 0.75cqi, 0.32rem) !important;
  width:max-content !important;
  min-width:0 !important;
  max-width:100% !important;
  margin:0 !important;
  overflow:visible !important;
}

#ad-ext-player-display .ad-ext-player > ${STACK_SELECTOR} > ${IDENTITY_SLOT_SELECTOR} > :last-child > span > :last-child{
  grid-column:2 !important;
  min-width:0 !important;
  display:grid !important;
  width:100% !important;
  grid-template-columns:minmax(0, 1fr) max-content !important;
  grid-auto-rows:max-content !important;
  align-items:center !important;
  align-content:center !important;
  column-gap:clamp(0.32rem, 1.2cqi, 0.52rem) !important;
  row-gap:0 !important;
}

#ad-ext-player-display .ad-ext-player > ${STACK_SELECTOR} > ${IDENTITY_SLOT_SELECTOR} > :last-child > span > :only-child{
  grid-column:1 / -1 !important;
}

#ad-ext-player-display .ad-ext-player > ${STACK_SELECTOR} > ${IDENTITY_SLOT_SELECTOR} > :last-child > span > :last-child > .ad-ext-player-name,
#ad-ext-player-display .ad-ext-player > ${STACK_SELECTOR} > ${IDENTITY_SLOT_SELECTOR} > :last-child > span > :last-child > .css-g0ywsj{
  grid-column:1 !important;
  min-width:0 !important;
  max-width:100% !important;
  justify-self:stretch !important;
  overflow:hidden !important;
}

#ad-ext-player-display .ad-ext-player > ${STACK_SELECTOR} > ${IDENTITY_SLOT_SELECTOR} > :last-child > span > :last-child > .chakra-badge,
#ad-ext-player-display .ad-ext-player > ${STACK_SELECTOR} > ${IDENTITY_SLOT_SELECTOR} > :last-child > span > :last-child > .css-n2903v,
#ad-ext-player-display .ad-ext-player > ${STACK_SELECTOR} > ${IDENTITY_SLOT_SELECTOR} > :last-child > span > :last-child > ${PROFILE_BADGE_SELECTOR}{
  grid-column:2 !important;
  display:inline-grid !important;
  place-items:center !important;
  align-self:center !important;
  justify-self:center !important;
  width:auto !important;
  min-width:0 !important;
  max-width:100% !important;
  margin:0 !important;
  padding:0.08em 0.38em !important;
  font-size:clamp(0.72rem, 3.6cqi, 1rem) !important;
  line-height:1.15 !important;
}

:root[${X01_TWO_PLAYER_IDENTITY_DENSITY_ATTRIBUTE}="name-only"] #ad-ext-player-display .ad-ext-player > ${STACK_SELECTOR} > ${IDENTITY_SLOT_SELECTOR} > :last-child > span{
  grid-template-columns:minmax(0, 1fr) !important;
}

:root[${X01_TWO_PLAYER_IDENTITY_DENSITY_ATTRIBUTE}="name-only"] #ad-ext-player-display .ad-ext-player > ${STACK_SELECTOR} > ${IDENTITY_SLOT_SELECTOR} > :last-child > span > :first-child:not(:last-child),
:root[${X01_TWO_PLAYER_IDENTITY_DENSITY_ATTRIBUTE}="name-only"] #ad-ext-player-display .ad-ext-player > ${STACK_SELECTOR} > ${IDENTITY_SLOT_SELECTOR} > :last-child > span > ${IDENTITY_MEDIA_SELECTOR},
:root[${X01_TWO_PLAYER_IDENTITY_DENSITY_ATTRIBUTE}="name-only"] #ad-ext-player-display .ad-ext-player > ${STACK_SELECTOR} > ${IDENTITY_SLOT_SELECTOR} > :last-child > span > :last-child > .chakra-badge,
:root[${X01_TWO_PLAYER_IDENTITY_DENSITY_ATTRIBUTE}="name-only"] #ad-ext-player-display .ad-ext-player > ${STACK_SELECTOR} > ${IDENTITY_SLOT_SELECTOR} > :last-child > span > :last-child > .css-n2903v,
:root[${X01_TWO_PLAYER_IDENTITY_DENSITY_ATTRIBUTE}="name-only"] #ad-ext-player-display .ad-ext-player > ${STACK_SELECTOR} > ${IDENTITY_SLOT_SELECTOR} > :last-child > span > :last-child > ${PROFILE_BADGE_SELECTOR}{
  display:none !important;
}

:root[${X01_TWO_PLAYER_IDENTITY_DENSITY_ATTRIBUTE}="name-only"] #ad-ext-player-display .ad-ext-player > ${STACK_SELECTOR} > ${IDENTITY_SLOT_SELECTOR} > :last-child > span > :last-child{
  grid-column:1 / -1 !important;
  grid-template-columns:minmax(0, 1fr) !important;
}

#ad-ext-player-display .ad-ext-player > ${STACK_SELECTOR} > ${IDENTITY_SLOT_SELECTOR} > :last-child > span > :last-child > ${ROUND_BADGE_SELECTOR}{
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
  line-height:0.9 !important;
  font-weight:800 !important;
  text-align:center !important;
  color:var(--ad-ext-theme-meta-inactive-color) !important;
  background:transparent !important;
  background-color:transparent !important;
  box-shadow:none !important;
  overflow:visible !important;
}

/* Keep both player scores on the same responsive scale after Autodarts swaps
   active/inactive stack classes during hydration or a player change. */
#ad-ext-player-display .ad-ext-player > .chakra-stack${STACK_SELECTOR} > ${SCORE_SLOT_SELECTOR}.ad-ext-player-score,
#ad-ext-player-display .ad-ext-player > .chakra-stack${STACK_SELECTOR} > ${SCORE_SLOT_SELECTOR} > .ad-ext-player-score,
#ad-ext-player-display .ad-ext-player > .chakra-stack${STACK_SELECTOR} > ${SCORE_SLOT_SELECTOR} > p{
  font-size:calc(var(--ad-ext-x01-2player-score-size) * var(--ad-ext-x01-2player-score-scale)) !important;
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
  border:var(--ad-ext-x01-2player-card-border-width) solid var(--ad-ext-theme-card-active-border-color) !important;
}

${INACTIVE_CARD_SELECTOR},
${INACTIVE_CARD_SELECTOR}.ad-ext-player-active{
  border:var(--ad-ext-x01-2player-card-border-width) solid var(--ad-ext-theme-card-inactive-border-color) !important;
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
  color:var(--ad-ext-theme-meta-inactive-color) !important;
}

${ACTIVE_CARD_SELECTOR} .ad-ext-player-name,
${ACTIVE_CARD_SELECTOR} .ad-ext-player-name > p,
#ad-ext-player-display .ad-ext-player.ad-ext-player-winner .ad-ext-player-name,
#ad-ext-player-display .ad-ext-player.ad-ext-player-winner .ad-ext-player-name > p{
  color:var(--ad-ext-theme-score-active-color) !important;
  font-weight:var(--ad-ext-x01-2player-active-name-weight) !important;
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
#ad-ext-player-display .ad-ext-player > .chakra-stack${STACK_SELECTOR}{
  display:grid !important;
  grid-template-columns:minmax(0, 1fr) !important;
  grid-template-rows:minmax(var(--ad-ext-x01-2player-round-size), max-content) max-content minmax(var(--ad-ext-x01-2player-score-min-block-size), max-content) max-content !important;
  grid-template-areas:
    "meta"
    "identity"
    "score"
    "progress" !important;
  column-gap:0 !important;
  row-gap:var(--ad-ext-x01-2player-stack-gap) !important;
  padding:0 !important;
}

#ad-ext-player-display .ad-ext-player > .chakra-stack${STACK_SELECTOR} > ${STACK_HEADER_META_SELECTOR}{
  grid-area:meta !important;
  grid-column:1 !important;
  grid-row:1 !important;
  display:flex !important;
  align-items:center !important;
  justify-content:flex-end !important;
  min-height:var(--ad-ext-x01-2player-round-size) !important;
  padding:0 0 0 calc(var(--ad-ext-x01-2player-round-size) + clamp(0.42rem, 1.6cqi, 0.68rem)) !important;
  z-index:3 !important;
}

#ad-ext-player-display .ad-ext-player > .chakra-stack${STACK_SELECTOR} > ${IDENTITY_SLOT_SELECTOR}{
  grid-area:identity !important;
  grid-column:1 / -1 !important;
  grid-row:2 !important;
  padding-block-start:clamp(0.16rem, 0.4vh, 0.3rem) !important;
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

#ad-ext-player-display .ad-ext-player > ${STACK_SELECTOR} > ${SCORE_SLOT_SELECTOR}{
  overflow:visible !important;
}

#ad-ext-player-display .ad-ext-player > ${STACK_SELECTOR} > ${SCORE_SLOT_SELECTOR}.ad-ext-player-score,
#ad-ext-player-display .ad-ext-player > ${STACK_SELECTOR} > ${SCORE_SLOT_SELECTOR} > .ad-ext-player-score,
#ad-ext-player-display .ad-ext-player > ${STACK_SELECTOR} > ${SCORE_SLOT_SELECTOR} > p{
  width:max-content !important;
  min-width:max-content !important;
  max-width:none !important;
  max-inline-size:none !important;
  white-space:nowrap !important;
  overflow:visible !important;
  justify-self:center !important;
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

#ad-ext-player-display .ad-ext-player > ${STACK_SELECTOR} > ${PROGRESS_SLOT_SELECTOR}[data-ad-ext-x01-remaining-score-bar-size="schmal"]{
  --ad-ext-x01-2player-progress-min-block-size:calc(clamp(.3rem, .62vw, .46rem) + var(--ad-ext-x01-2player-progress-pad-block-start));
}

#ad-ext-player-display .ad-ext-player > ${STACK_SELECTOR} > ${PROGRESS_SLOT_SELECTOR}[data-ad-ext-x01-remaining-score-bar-size="standard"]{
  --ad-ext-x01-2player-progress-min-block-size:calc(clamp(.72rem, 1.35vw, 1.02rem) + var(--ad-ext-x01-2player-progress-pad-block-start));
}

#ad-ext-player-display .ad-ext-player > ${STACK_SELECTOR} > ${PROGRESS_SLOT_SELECTOR}[data-ad-ext-x01-remaining-score-bar-size="breit"]{
  --ad-ext-x01-2player-progress-min-block-size:calc(clamp(1.08rem, 1.9vw, 1.4rem) + var(--ad-ext-x01-2player-progress-pad-block-start));
}

#ad-ext-player-display .ad-ext-player > ${STACK_SELECTOR} > ${PROGRESS_SLOT_SELECTOR}[data-ad-ext-x01-remaining-score-bar-size="extrabreit"]{
  --ad-ext-x01-2player-progress-min-block-size:calc(clamp(1.48rem, 2.52vw, 1.92rem) + var(--ad-ext-x01-2player-progress-pad-block-start));
}

#ad-ext-player-display .ad-ext-player.ad-ext-player-inactive > .chakra-stack[data-ad-ext-x01-remaining-score-bar-stack="true"]${STACK_SELECTOR},
#ad-ext-player-display .ad-ext-player:not(.ad-ext-player-active):not(.ad-ext-player-winner) > .chakra-stack[data-ad-ext-x01-remaining-score-bar-stack="true"]${STACK_SELECTOR}{
  min-height:max-content !important;
  height:auto !important;
  padding:0 !important;
}

#ad-ext-player-display .ad-ext-player.ad-ext-player-inactive > .chakra-stack[data-ad-ext-x01-remaining-score-bar-stack="true"]${STACK_SELECTOR} > ${SCORE_SLOT_SELECTOR},
#ad-ext-player-display .ad-ext-player.ad-ext-player-inactive > .chakra-stack[data-ad-ext-x01-remaining-score-bar-stack="true"]${STACK_SELECTOR} > ${SCORE_SLOT_SELECTOR} > p,
#ad-ext-player-display .ad-ext-player:not(.ad-ext-player-active):not(.ad-ext-player-winner) > .chakra-stack[data-ad-ext-x01-remaining-score-bar-stack="true"]${STACK_SELECTOR} > ${SCORE_SLOT_SELECTOR},
#ad-ext-player-display .ad-ext-player:not(.ad-ext-player-active):not(.ad-ext-player-winner) > .chakra-stack[data-ad-ext-x01-remaining-score-bar-stack="true"]${STACK_SELECTOR} > ${SCORE_SLOT_SELECTOR} > p{
  line-height:0.9 !important;
  align-self:stretch !important;
  overflow:visible !important;
  color:var(--ad-ext-theme-meta-inactive-color) !important;
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
    radial-gradient(circle, rgba(var(--ad-ext-x01-2player-accent-rgb), var(--ad-ext-x01-2player-board-glow-alpha)) 0, rgba(var(--ad-ext-x01-2player-accent-rgb), 0.2) 29%, rgba(var(--ad-ext-x01-2player-accent-rgb), 0.08) 46%, rgba(var(--ad-ext-x01-2player-accent-rgb), 0) 70%) !important;
  filter:blur(var(--ad-ext-x01-2player-board-glow-blur)) !important;
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
    --ad-ext-x01-2player-score-size:clamp(6.048rem, min(24vw, 14.4vh), 9.7rem);
    --ad-ext-x01-2player-score-scale:var(--ad-ext-x01-2player-density-score-scale);
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
    --ad-ext-x01-2player-score-size:clamp(5.616rem, min(22vw, 12vh), 8.75rem);
    --ad-ext-x01-2player-score-scale:var(--ad-ext-x01-2player-density-score-scale);
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
    --ad-ext-x01-2player-score-size:clamp(5.76rem, min(23.5cqi, 12.8vh), 9.25rem);
    --ad-ext-x01-2player-score-scale:var(--ad-ext-x01-2player-density-score-scale);
    --ad-ext-x01-2player-table-font-size:clamp(0.84rem, min(3.5cqi, 1.58vh), 0.98rem);
    --ad-ext-x01-2player-table-cell-font-size:clamp(1.85rem, min(10.8cqi, 8.2cqb, 5.4vh), 2.25rem);
    --ad-ext-x01-2player-table-cell-min-height:clamp(1.95rem, min(6.4cqi, 3.2vh), 2.6rem);
    min-height:clamp(16rem, 46vh, 27rem) !important;
  }
}
`;

  return buildThemeCssBundle(featureConfig, `${previewCss}${themeCss}`, visualConfig);
}
