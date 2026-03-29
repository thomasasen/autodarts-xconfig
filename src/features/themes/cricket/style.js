import { buildThemeCssBundle } from "../shared/theme-style-builder.js";
import { buildPreviewPlacementCss, normalizeBoolean } from "../shared/theme-utils.js";
import {
  CRICKET_ACTIVE_PLAYER_ATTRIBUTE,
  CRICKET_IDENTITY_SHELL_ATTRIBUTE,
  CRICKET_META_ATTRIBUTE,
  CRICKET_META_SHELL_ATTRIBUTE,
  CRICKET_ROW_ATTRIBUTE,
  CRICKET_SLOT_ATTRIBUTE,
  CRICKET_STACK_ATTRIBUTE,
} from "../shared/theme-layout-contract.js";

export const STYLE_ID = "ad-ext-theme-cricket-style";

const PREVIEW_PLACEMENT = Object.freeze({
  mode: "standard",
  previewHeightPx: 128,
  previewGapPx: 8,
});

function resolveThemeCricketConfig(rawConfig = {}) {
  return {
    showAvg: normalizeBoolean(rawConfig.showAvg, true),
  };
}

const STACK_SELECTOR = `[${CRICKET_STACK_ATTRIBUTE}="true"]`;
const ROW_SELECTOR = `[${CRICKET_ROW_ATTRIBUTE}="true"]`;
const SLOT_MARKS_SELECTOR = `[${CRICKET_SLOT_ATTRIBUTE}="marks"]`;
const SLOT_IDENTITY_SELECTOR = `[${CRICKET_SLOT_ATTRIBUTE}="identity"]`;
const SLOT_STATS_SELECTOR = `[${CRICKET_SLOT_ATTRIBUTE}="stats"]`;
const SLOT_DECORATIVE_SELECTOR = `[${CRICKET_SLOT_ATTRIBUTE}="decorative"]`;
const META_AVATAR_SELECTOR = `[${CRICKET_META_ATTRIBUTE}="avatar"]`;
const META_NAME_SELECTOR = `[${CRICKET_META_ATTRIBUTE}="name"]`;
const META_WINS_SELECTOR = `[${CRICKET_META_ATTRIBUTE}="wins"]`;
const IDENTITY_SHELL_SELECTOR = `[${CRICKET_IDENTITY_SHELL_ATTRIBUTE}="true"]`;
const META_SHELL_SELECTOR = `[${CRICKET_META_SHELL_ATTRIBUTE}="true"]`;

const cricketThemeCss = `
:root{
  --theme-bg: #000000;
  --theme-text-highlight-color: #9fe870;
  --theme-navigation-bg: #111726;
  --theme-navigation-item-color: #79829a;
  --theme-player-badge-bg: #9fe870;
  --theme-current-bg: #0d3f56;
  --theme-border-color: #2f415c;
  --theme-alt-bg: #1a3c2f;
  --ad-ext-cricket-surface: rgba(8, 16, 30, 0.9);
  --ad-ext-cricket-surface-strong: rgba(10, 22, 44, 0.96);
  --ad-ext-cricket-line: rgba(148, 181, 220, 0.24);
  --ad-ext-cricket-offense-glow: rgba(0, 178, 135, 0.36);
  --ad-ext-cricket-danger-glow: rgba(239, 68, 68, 0.34);
  --ad-ext-cricket-active-ring: rgba(159, 232, 112, 0.9);
  --ad-ext-cricket-card-glow: rgba(159, 232, 112, 0.22);
  --ad-ext-cricket-card-sheen: rgba(127, 214, 247, 0.12);
  --ad-ext-cricket-board-shell: rgba(6, 12, 22, 0.92);
  --ad-ext-cricket-board-rail: rgba(91, 133, 170, 0.3);
  --ad-ext-theme-cricket-player-column-min-width: 14.25rem;
  --ad-ext-theme-cricket-player-column-max-width: 15.5rem;
  --ad-ext-theme-cricket-player-column-width: clamp(
    var(--ad-ext-theme-cricket-player-column-min-width),
    15vw,
    var(--ad-ext-theme-cricket-player-column-max-width)
  );
  --ad-ext-theme-cricket-player-card-min-width: var(--ad-ext-theme-cricket-player-column-min-width);
  --ad-ext-theme-cricket-card-inline-bleed: 0rem;
  --ad-ext-theme-cricket-player-name-min-width: 4.8ch;
  --ad-ext-theme-cricket-score-min-width: 4.8ch;
  --ad-ext-theme-cricket-stats-min-width: 5.4ch;
  --ad-ext-theme-cricket-player-avatar-size: 2.2rem;
  --ad-ext-theme-cricket-name-size-active: clamp(0.98rem, 1.08vw, 1.16rem);
  --ad-ext-theme-cricket-name-size-inactive: clamp(0.78rem, 0.84vw, 0.9rem);
  --ad-ext-theme-cricket-score-active-color: var(--theme-text-highlight-color);
  --ad-ext-theme-cricket-score-inactive-color: rgba(214, 229, 245, 0.84);
  --ad-ext-theme-cricket-score-size-active: clamp(3.35rem, 4.08vw, 4.48rem);
  --ad-ext-theme-cricket-score-size-inactive: clamp(2.26rem, 2.72vw, 3.08rem);
  --ad-ext-theme-cricket-score-shadow:
    0 1px 0 rgba(4, 10, 20, 0.92),
    0 0 16px rgba(4, 10, 20, 0.46);
  --ad-ext-theme-cricket-score-end-inset: 0.38rem;
  --ad-ext-theme-cricket-player-gap: 0rem;
  --ad-ext-theme-cricket-content-gap: 0.5rem;
  --ad-ext-theme-cricket-player-grid-gap: 0.35rem;
  --ad-ext-theme-cricket-left-padding-width: 1.25rem;
  --ad-ext-theme-cricket-left-min-width: calc(
    var(--ad-ext-theme-cricket-player-card-min-width) + var(--ad-ext-theme-cricket-left-padding-width)
  );
  --ad-ext-theme-cricket-player-area-required-width: var(--ad-ext-theme-cricket-left-min-width);
  --ad-ext-theme-cricket-board-min-width-auto: 18rem;
  --ad-ext-theme-cricket-board-min-width-manual: 10rem;
  --ad-ext-theme-cricket-board-width: auto;
  --ad-ext-theme-cricket-player-count: 4;
}

.css-1k7iu8k {
  max-width: 96%;
}

#ad-ext-turn > .ad-ext-turn-throw,
#ad-ext-turn > .score,
#ad-ext-turn > .suggestion{
  height: 100px !important;
}

#ad-ext-player-display{
  display: grid !important;
  grid-auto-flow: column !important;
  grid-auto-columns: var(--ad-ext-theme-cricket-player-column-width) !important;
  align-items: stretch !important;
  gap: var(--ad-ext-theme-cricket-player-gap) !important;
  min-width: max-content !important;
  width: 100% !important;
}

#ad-ext-player-display > * {
  margin: 0 !important;
  min-width: var(--ad-ext-theme-cricket-player-column-width) !important;
  max-width: var(--ad-ext-theme-cricket-player-column-max-width) !important;
  width: var(--ad-ext-theme-cricket-player-column-width) !important;
  border: 0 !important;
  box-shadow: none !important;
  background: transparent !important;
  outline: none !important;
}

#ad-ext-player-display .ad-ext-player{
  min-height: 206px !important;
  min-width: 0 !important;
  width: 100% !important;
  --ad-ext-theme-cricket-name-size: var(--ad-ext-theme-cricket-name-size-inactive);
  --ad-ext-theme-cricket-score-size: var(--ad-ext-theme-cricket-score-size-inactive);
  --ad-ext-theme-cricket-score-color: var(--ad-ext-theme-cricket-score-inactive-color);
  --ad-ext-theme-cricket-wins-scale: 1;
}

#ad-ext-player-display .ad-ext-player.ad-ext-player-active,
#ad-ext-player-display .ad-ext-player[${CRICKET_ACTIVE_PLAYER_ATTRIBUTE}="true"]{
  --ad-ext-theme-cricket-name-size: var(--ad-ext-theme-cricket-name-size-active);
  --ad-ext-theme-cricket-score-size: var(--ad-ext-theme-cricket-score-size-active);
  --ad-ext-theme-cricket-score-color: var(--ad-ext-theme-cricket-score-active-color);
  --ad-ext-theme-cricket-wins-scale: 0.92;
}

#ad-ext-player-display .ad-ext-player > ${STACK_SELECTOR}{
  display: grid !important;
  grid-template-columns:
    max-content
    minmax(var(--ad-ext-theme-cricket-stats-min-width), 1fr)
    minmax(var(--ad-ext-theme-cricket-score-min-width), max-content) !important;
  grid-template-areas:
    "identity identity identity"
    "matches stats score" !important;
  align-items: start !important;
  column-gap: 0.3rem !important;
  row-gap: 0.26rem !important;
  min-height: 206px !important;
  min-width: 0 !important;
  padding-inline: 0 !important;
  padding-top: 0.3rem !important;
  padding-bottom: 0.3rem !important;
}

#ad-ext-player-display .ad-ext-player > ${STACK_SELECTOR} {
  container-type: inline-size !important;
}

#ad-ext-player-display .ad-ext-player > ${STACK_SELECTOR} > ${ROW_SELECTOR} {
  display: contents !important;
}

#ad-ext-player-display .ad-ext-player > ${STACK_SELECTOR} > ${ROW_SELECTOR} > ${SLOT_MARKS_SELECTOR} {
  grid-area: matches !important;
  grid-column: 1 !important;
  justify-self: start !important;
  align-self: center !important;
  z-index: 2 !important;
  min-width: 0 !important;
  max-width: 100% !important;
}

#ad-ext-player-display .ad-ext-player > ${STACK_SELECTOR} > ${ROW_SELECTOR} > ${SLOT_MARKS_SELECTOR} .css-3fr5p8 {
  min-height: 1.18rem !important;
  min-width: 1.31rem !important;
  padding-inline: 0.35rem !important;
  border-radius: 0.34rem !important;
}

#ad-ext-player-display .ad-ext-player > ${STACK_SELECTOR} > ${ROW_SELECTOR} > ${SLOT_MARKS_SELECTOR} .css-1hcjh09 {
  font-size: clamp(0.83rem, 0.92vw, 0.99rem) !important;
  line-height: 1 !important;
}

#ad-ext-player-display .ad-ext-player > ${STACK_SELECTOR} > ${ROW_SELECTOR} > ${SLOT_IDENTITY_SELECTOR} {
  grid-area: identity !important;
  grid-column: 1 / -1 !important;
  margin-inline: 0 !important;
  min-width: 0 !important;
  max-width: 100% !important;
  width: 100% !important;
  overflow: visible !important;
}

#ad-ext-player-display .ad-ext-player > ${STACK_SELECTOR} > ${ROW_SELECTOR} > ${SLOT_IDENTITY_SELECTOR},
#ad-ext-player-display .ad-ext-player > ${STACK_SELECTOR} > ${ROW_SELECTOR} > ${SLOT_IDENTITY_SELECTOR} * {
  min-width: 0 !important;
  max-width: 100% !important;
}

#ad-ext-player-display .ad-ext-player > ${STACK_SELECTOR} > ${ROW_SELECTOR} > ${SLOT_IDENTITY_SELECTOR} > ${IDENTITY_SHELL_SELECTOR},
#ad-ext-player-display .ad-ext-player > ${STACK_SELECTOR} > ${ROW_SELECTOR} > ${SLOT_IDENTITY_SELECTOR}:not(:has(> ${IDENTITY_SHELL_SELECTOR})) {
  display: grid !important;
  grid-template-columns: var(--ad-ext-theme-cricket-player-avatar-size) minmax(0, 1fr) auto !important;
  grid-template-areas:
    "avatar name wins" !important;
  align-items: center !important;
  column-gap: 0.45rem !important;
  row-gap: 0 !important;
  width: 100% !important;
  max-width: 100% !important;
  min-width: 0 !important;
  justify-self: stretch !important;
  border: none !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  padding: 0.15rem 0 0.2rem !important;
  background: linear-gradient(90deg, rgba(86, 97, 116, 0.34), rgba(68, 80, 99, 0.18)) !important;
}

#ad-ext-player-display .ad-ext-player > ${STACK_SELECTOR} > ${ROW_SELECTOR} > ${SLOT_IDENTITY_SELECTOR} > ${IDENTITY_SHELL_SELECTOR} {
  grid-column: 1 / -1 !important;
}

#ad-ext-player-display .ad-ext-player > ${STACK_SELECTOR} > ${ROW_SELECTOR} > ${SLOT_IDENTITY_SELECTOR} ${META_SHELL_SELECTOR} {
  display: grid !important;
  grid-template-columns: minmax(0, 1fr) auto !important;
  grid-template-areas: "name wins" !important;
  align-items: center !important;
  column-gap: 0.28rem !important;
  min-width: 0 !important;
  width: 100% !important;
  max-width: 100% !important;
  justify-self: stretch !important;
}

#ad-ext-player-display .ad-ext-player > ${STACK_SELECTOR} > ${ROW_SELECTOR} > ${SLOT_IDENTITY_SELECTOR} > ${IDENTITY_SHELL_SELECTOR} > :not(${META_AVATAR_SELECTOR}):not(${META_WINS_SELECTOR}),
#ad-ext-player-display .ad-ext-player > ${STACK_SELECTOR} > ${ROW_SELECTOR} > ${SLOT_IDENTITY_SELECTOR}:not(:has(> ${IDENTITY_SHELL_SELECTOR})) > :not(${META_AVATAR_SELECTOR}):not(${META_WINS_SELECTOR}) {
  min-width: 0 !important;
  width: 100% !important;
  max-width: 100% !important;
  justify-self: stretch !important;
}

#ad-ext-player-display .ad-ext-player > ${STACK_SELECTOR} > ${ROW_SELECTOR} > ${SLOT_IDENTITY_SELECTOR} ${META_AVATAR_SELECTOR} {
  grid-area: avatar !important;
  align-items: center !important;
  gap: 0 !important;
  min-width: 0 !important;
  max-width: 100% !important;
}

#ad-ext-player-display .ad-ext-player > ${STACK_SELECTOR} > ${ROW_SELECTOR} > ${SLOT_IDENTITY_SELECTOR} ${META_AVATAR_SELECTOR} > .chakra-avatar {
  --avatar-size: var(--ad-ext-theme-cricket-player-avatar-size) !important;
}

#ad-ext-player-display .ad-ext-player > ${STACK_SELECTOR} > ${ROW_SELECTOR} > ${SLOT_IDENTITY_SELECTOR} ${META_NAME_SELECTOR} {
  grid-area: name !important;
  min-width: 0 !important;
  width: 100% !important;
  max-width: 100% !important;
  justify-self: stretch !important;
  align-self: center !important;
}

#ad-ext-player-display .ad-ext-player > ${STACK_SELECTOR} > ${ROW_SELECTOR} > ${SLOT_IDENTITY_SELECTOR} ${META_WINS_SELECTOR} {
  grid-area: wins !important;
  justify-self: end !important;
  align-self: center !important;
  min-width: 0 !important;
  min-height: 1.05rem !important;
  padding-inline: 0.3rem !important;
  font-size: clamp(0.62rem, 0.72vw, 0.76rem) !important;
  line-height: 1.05 !important;
  border-radius: 999px !important;
  transform: scale(var(--ad-ext-theme-cricket-wins-scale)) !important;
  transform-origin: right center !important;
}

#ad-ext-player-display .ad-ext-player > ${STACK_SELECTOR} > ${SLOT_STATS_SELECTOR} {
  grid-area: stats !important;
  grid-column: 1 / 3 !important;
  justify-self: stretch !important;
  align-self: center !important;
  min-width: var(--ad-ext-theme-cricket-stats-min-width) !important;
  max-width: 100% !important;
  overflow: visible !important;
  display: flex !important;
  align-items: center !important;
  justify-content: flex-start !important;
  gap: 0.2rem !important;
  padding-left: 1.38rem !important;
  white-space: nowrap !important;
}

#ad-ext-player-display .ad-ext-player > ${STACK_SELECTOR} > ${SLOT_STATS_SELECTOR} > p {
  overflow: visible !important;
  text-overflow: clip !important;
  white-space: nowrap !important;
  min-width: max-content !important;
}

#ad-ext-player-display .ad-ext-player > ${STACK_SELECTOR} > ${SLOT_DECORATIVE_SELECTOR} {
  display: none !important;
}

#ad-ext-player-display .ad-ext-player > ${STACK_SELECTOR} > .ad-ext-player-score {
  grid-area: score !important;
  grid-column: 3 !important;
  grid-row: 2 !important;
  justify-self: end !important;
  align-self: center !important;
  margin-left: 0 !important;
  margin-right: 0 !important;
  margin-inline-end: var(--ad-ext-theme-cricket-score-end-inset) !important;
  padding-left: 0.2rem !important;
  padding-right: 0.12rem !important;
  max-inline-size: none !important;
  overflow: visible !important;
  text-overflow: initial !important;
  z-index: 3 !important;
}

#ad-ext-player-display .ad-ext-player > ${STACK_SELECTOR} > ${SLOT_STATS_SELECTOR} > p {
  font-size: clamp(0.92rem, 1.04vw, 1.1rem) !important;
  line-height: 1.15 !important;
}

* {
  scrollbar-width: none !important;
}

.css-tkevr6{
  height: 99%;
}

div.css-gmuwbf,
div.css-tkevr6,
div.css-nfhdnc {
  background-color: var(--theme-bg);
}

.ad-ext-player-name{
  display: block !important;
  font-size: var(--ad-ext-theme-cricket-name-size) !important;
  inline-size: 100% !important;
  min-inline-size: 0 !important;
  max-inline-size: 100% !important;
  overflow: hidden !important;
  text-overflow: ".." !important;
  text-overflow: ellipsis !important;
  white-space: nowrap !important;
}

#ad-ext-player-display .ad-ext-player .ad-ext-player-name {
  display: block !important;
  font-size: var(--ad-ext-theme-cricket-name-size) !important;
  width: 100% !important;
  min-inline-size: 0 !important;
  max-inline-size: 100% !important;
  line-height: 1.08 !important;
  justify-self: stretch !important;
}

#ad-ext-player-display .ad-ext-player .ad-ext-player-name > p {
  font-size: var(--ad-ext-theme-cricket-name-size) !important;
  width: 100% !important;
  min-width: 0 !important;
  line-height: 1.08 !important;
  white-space: nowrap !important;
  overflow: hidden !important;
  text-overflow: ".." !important;
  text-overflow: ellipsis !important;
}

#ad-ext-player-display .ad-ext-player.ad-ext-player-active .ad-ext-player-name,
#ad-ext-player-display .ad-ext-player.ad-ext-player-active .ad-ext-player-name > p {
  color: var(--ad-ext-theme-cricket-score-active-color) !important;
}

#ad-ext-player-display .ad-ext-player .ad-ext-player-score {
  color: var(--ad-ext-theme-cricket-score-color) !important;
  font-size: var(--ad-ext-theme-cricket-score-size) !important;
  line-height: 0.9 !important;
  font-weight: 800 !important;
  text-align: right !important;
  white-space: nowrap !important;
  inline-size: max-content !important;
  max-inline-size: none !important;
  overflow: visible !important;
  text-overflow: initial !important;
  letter-spacing: -0.02em !important;
  margin-inline-end: var(--ad-ext-theme-cricket-score-end-inset) !important;
  min-inline-size: var(--ad-ext-theme-cricket-score-min-width) !important;
  font-variant-numeric: tabular-nums;
  text-shadow: var(--ad-ext-theme-cricket-score-shadow) !important;
}

#ad-ext-player-display .ad-ext-player.ad-ext-player-active .ad-ext-player-score {
  color: var(--ad-ext-theme-cricket-score-active-color) !important;
}

#ad-ext-player-display .ad-ext-player.ad-ext-player-inactive .ad-ext-player-score,
#ad-ext-player-display .ad-ext-player:not(.ad-ext-player-active):not(.ad-ext-player-winner) .ad-ext-player-score {
  color: var(--ad-ext-theme-cricket-score-inactive-color) !important;
}

@supports (font-size: 1cqi) {
  #ad-ext-player-display .ad-ext-player{
    --ad-ext-theme-cricket-score-size: clamp(2.18rem, 18.8cqi, 4.72rem);
  }

  #ad-ext-player-display .ad-ext-player.ad-ext-player-active,
  #ad-ext-player-display .ad-ext-player[${CRICKET_ACTIVE_PLAYER_ATTRIBUTE}="true"]{
    --ad-ext-theme-cricket-score-size: clamp(3rem, 23.2cqi, 5.88rem);
  }

  #ad-ext-player-display .ad-ext-player.ad-ext-player-inactive,
  #ad-ext-player-display .ad-ext-player[${CRICKET_ACTIVE_PLAYER_ATTRIBUTE}="false"]{
    --ad-ext-theme-cricket-score-size: clamp(2.18rem, 18.8cqi, 4.72rem);
  }
}

@container (max-width: 13.75rem) {
  #ad-ext-player-display .ad-ext-player > ${STACK_SELECTOR} {
    column-gap: 0.42rem !important;
  }

  #ad-ext-player-display .ad-ext-player > ${STACK_SELECTOR} > ${ROW_SELECTOR} > ${SLOT_IDENTITY_SELECTOR} > ${IDENTITY_SHELL_SELECTOR},
  #ad-ext-player-display .ad-ext-player > ${STACK_SELECTOR} > ${ROW_SELECTOR} > ${SLOT_IDENTITY_SELECTOR}:not(:has(> ${IDENTITY_SHELL_SELECTOR})) {
    grid-template-columns: 1.9rem minmax(0, 1fr) auto !important;
    column-gap: 0.32rem !important;
  }

  #ad-ext-player-display .ad-ext-player > ${STACK_SELECTOR} > ${ROW_SELECTOR} > ${SLOT_IDENTITY_SELECTOR} ${META_AVATAR_SELECTOR} > .chakra-avatar {
    --avatar-size: 1.9rem !important;
  }

  #ad-ext-player-display .ad-ext-player > ${STACK_SELECTOR} > ${ROW_SELECTOR} > ${SLOT_MARKS_SELECTOR} .css-1hcjh09 {
    font-size: 0.78rem !important;
  }

  #ad-ext-player-display .ad-ext-player > ${STACK_SELECTOR} > ${SLOT_STATS_SELECTOR} {
    justify-content: flex-start !important;
  }

  #ad-ext-player-display .ad-ext-player > ${STACK_SELECTOR} > ${ROW_SELECTOR} > ${SLOT_IDENTITY_SELECTOR} ${META_WINS_SELECTOR} {
    font-size: 0.62rem !important;
  }

  #ad-ext-player-display .ad-ext-player > ${STACK_SELECTOR} > ${SLOT_STATS_SELECTOR} > p {
    font-size: 0.92rem !important;
  }
}

.chakra-stack.navigation {
  background-color: var(--theme-navigation-bg);
}

p.chakra-text.css-1qlemha {
  background-color: var(--theme-current-bg);
  left: 0 !important;
  margin-left: 0 !important;
  font-size: 36px;
  white-space: nowrap;
  line-height: 1.1;
  padding: 0 0.5rem;
  width: fit-content;
}

span.css-elma0c {
  background-color: var(--theme-alt-bg);
}

div.css-rrf7rv {
  background-color: var(--theme-alt-bg);
  border-color: var(--theme-border-color);
}

.css-3fr5p8 {
  background-color: var(--theme-player-badge-bg);
  color: #222222;
}

.ad-ext_winner-score-wrapper {
  display: contents !important;
}

div.chakra-menu__menu-list.css-yskgbr {
  background-color: var(--theme-border-color);
}

span.chakra-switch__track.css-v4l15v {
  background-color: #38761d;
}

.css-1yso2z2 {
  height: 100% !important;
}

.ad-ext-theme-content-slot {
  background:
    radial-gradient(circle at 72% 58%, rgba(0, 178, 135, 0.14), rgba(0, 0, 0, 0) 48%),
    radial-gradient(circle at 18% 32%, rgba(34, 197, 255, 0.1), rgba(0, 0, 0, 0) 42%);
  grid-template-columns:
    minmax(var(--ad-ext-theme-cricket-player-area-required-width), max-content)
    minmax(var(--ad-ext-theme-cricket-board-min-width-auto), 1fr) !important;
  gap: var(--ad-ext-theme-cricket-content-gap) !important;
}

.ad-ext-theme-content-slot.ad-ext-theme-cricket-readability-constrained:not(.ad-ext-theme-cricket-board-hidden) {
  grid-template-columns:
    minmax(var(--ad-ext-theme-cricket-player-area-required-width), max-content)
    minmax(0, var(--ad-ext-theme-cricket-board-width, var(--ad-ext-theme-cricket-board-min-width-auto))) !important;
}

.ad-ext-theme-content-slot > .ad-ext-theme-content-left {
  display: grid !important;
  grid-template-rows: auto minmax(0, 1fr) !important;
  row-gap: var(--ad-ext-theme-cricket-player-grid-gap) !important;
  align-content: stretch !important;
  min-width: 0 !important;
  min-height: 0 !important;
  width: max-content !important;
  height: 100% !important;
  max-width: 100% !important;
  justify-self: start !important;
  align-self: stretch !important;
}

.ad-ext-theme-content-slot.ad-ext-theme-cricket-board-forced-visible {
  grid-template-columns:
    minmax(var(--ad-ext-theme-cricket-player-area-required-width), max-content)
    minmax(0, var(--ad-ext-theme-cricket-board-width, var(--ad-ext-theme-cricket-board-min-width-manual))) !important;
}

.ad-ext-theme-content-slot.ad-ext-theme-cricket-board-hidden {
  grid-template-columns:
    minmax(var(--ad-ext-theme-cricket-player-area-required-width), max-content) !important;
  gap: 0 !important;
}

.ad-ext-theme-content-slot.ad-ext-theme-cricket-board-hidden > .ad-ext-theme-content-left {
  grid-column: 1 / -1 !important;
}

.ad-ext-theme-content-slot.ad-ext-theme-cricket-board-hidden > .ad-ext-theme-content-board {
  display: none !important;
}

.ad-ext-theme-cricket-readability-notice {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  gap: 0.5rem !important;
  margin: 0 0 0.4rem !important;
  padding: 0.35rem 0.55rem !important;
  border-radius: 0.42rem !important;
  border: 1px solid rgba(127, 214, 247, 0.36) !important;
  background: rgba(8, 24, 40, 0.84) !important;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.04) !important;
}

.ad-ext-theme-cricket-readability-text {
  margin: 0 !important;
  color: rgba(223, 242, 255, 0.92) !important;
  font-size: 0.76rem !important;
  line-height: 1.25 !important;
  letter-spacing: 0.01em !important;
}

.ad-ext-theme-cricket-readability-toggle {
  appearance: none !important;
  border: 1px solid rgba(159, 232, 112, 0.54) !important;
  border-radius: 0.32rem !important;
  background: rgba(15, 40, 54, 0.84) !important;
  color: rgba(229, 250, 210, 0.95) !important;
  padding: 0.2rem 0.48rem !important;
  font-size: 0.7rem !important;
  font-weight: 600 !important;
  line-height: 1.2 !important;
  cursor: pointer !important;
  white-space: nowrap !important;
}

.ad-ext-theme-cricket-readability-toggle:hover {
  background: rgba(20, 52, 70, 0.9) !important;
}

.ad-ext-theme-cricket-readability-toggle:focus-visible {
  outline: 2px solid rgba(159, 232, 112, 0.82) !important;
  outline-offset: 1px !important;
}

.ad-ext-theme-content-slot.ad-ext-theme-cricket-board-forced-visible .ad-ext-theme-cricket-readability-notice {
  border-color: rgba(159, 232, 112, 0.4) !important;
}

#ad-ext-player-display .ad-ext-player > ${STACK_SELECTOR} {
  position: relative !important;
  overflow: hidden !important;
  background: linear-gradient(165deg, rgba(6, 15, 34, 0.96), rgba(3, 10, 24, 0.94)) !important;
  border: 1px solid var(--ad-ext-cricket-line) !important;
  border-radius: 0 !important;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.03), 0 10px 26px rgba(0, 0, 0, 0.42);
  transition: border-color 180ms ease, box-shadow 180ms ease, filter 180ms ease;
}

#ad-ext-player-display .ad-ext-player > ${STACK_SELECTOR}::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0) 32%),
    radial-gradient(circle at 12% 20%, var(--ad-ext-cricket-card-sheen), rgba(0, 0, 0, 0) 42%);
  opacity: 0.9;
}

#ad-ext-player-display .ad-ext-player.ad-ext-player-active > ${STACK_SELECTOR} {
  border-color: var(--ad-ext-cricket-active-ring) !important;
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.08),
    0 0 0 1px rgba(159, 232, 112, 0.24),
    0 0 20px rgba(159, 232, 112, 0.28),
    0 12px 28px rgba(0, 0, 0, 0.44);
}

#ad-ext-player-display .ad-ext-player.ad-ext-player-active > ${STACK_SELECTOR}::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  border: 1px solid rgba(159, 232, 112, 0.3);
  box-shadow: inset 0 0 18px rgba(159, 232, 112, 0.08), 0 0 24px var(--ad-ext-cricket-card-glow);
}

#ad-ext-player-display .ad-ext-player:not(.ad-ext-player-active) > ${STACK_SELECTOR} {
  filter: saturate(0.76) brightness(0.9);
}

#ad-ext-player-display .ad-ext-player:not(.ad-ext-player-active) > ${STACK_SELECTOR}::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(1, 6, 15, 0.18) 100%);
}

#ad-ext-player-display .ad-ext-player[${CRICKET_ACTIVE_PLAYER_ATTRIBUTE}="true"] > ${STACK_SELECTOR} {
  border-color: var(--ad-ext-cricket-active-ring) !important;
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.08),
    0 0 0 1px rgba(159, 232, 112, 0.24),
    0 0 20px rgba(159, 232, 112, 0.28),
    0 12px 28px rgba(0, 0, 0, 0.44) !important;
  filter: none !important;
}

#ad-ext-player-display .ad-ext-player[${CRICKET_ACTIVE_PLAYER_ATTRIBUTE}="true"] > ${STACK_SELECTOR}::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  border: 1px solid rgba(159, 232, 112, 0.3);
  box-shadow: inset 0 0 18px rgba(159, 232, 112, 0.08), 0 0 24px var(--ad-ext-cricket-card-glow);
}

#ad-ext-player-display .ad-ext-player[${CRICKET_ACTIVE_PLAYER_ATTRIBUTE}="false"] > ${STACK_SELECTOR} {
  border-color: var(--ad-ext-cricket-line) !important;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.03), 0 10px 26px rgba(0, 0, 0, 0.42) !important;
  filter: saturate(0.76) brightness(0.9) !important;
}

#ad-ext-player-display .ad-ext-player[${CRICKET_ACTIVE_PLAYER_ATTRIBUTE}="false"] > ${STACK_SELECTOR}::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  border: none !important;
  box-shadow: none !important;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(1, 6, 15, 0.18) 100%) !important;
}

#ad-ext-player-display .ad-ext-player[${CRICKET_ACTIVE_PLAYER_ATTRIBUTE}="true"] .ad-ext-player-name,
#ad-ext-player-display .ad-ext-player[${CRICKET_ACTIVE_PLAYER_ATTRIBUTE}="true"] .ad-ext-player-name > p {
  color: var(--ad-ext-theme-cricket-score-active-color) !important;
}

#ad-ext-player-display .ad-ext-player[${CRICKET_ACTIVE_PLAYER_ATTRIBUTE}="false"] .ad-ext-player-name,
#ad-ext-player-display .ad-ext-player[${CRICKET_ACTIVE_PLAYER_ATTRIBUTE}="false"] .ad-ext-player-name > p {
  color: inherit !important;
}

#ad-ext-player-display .ad-ext-player[${CRICKET_ACTIVE_PLAYER_ATTRIBUTE}="true"] .ad-ext-player-score {
  color: var(--ad-ext-theme-cricket-score-active-color) !important;
}

#ad-ext-player-display .ad-ext-player[${CRICKET_ACTIVE_PLAYER_ATTRIBUTE}="false"] .ad-ext-player-score {
  color: var(--ad-ext-theme-cricket-score-inactive-color) !important;
}

#ad-ext-player-display .ad-ext-player[${CRICKET_ACTIVE_PLAYER_ATTRIBUTE}="true"] {
  border-color: var(--theme-border-color) !important;
  border-style: solid !important;
}

#ad-ext-player-display .ad-ext-player[${CRICKET_ACTIVE_PLAYER_ATTRIBUTE}="false"] {
  border-color: transparent !important;
  border-style: none !important;
}

#ad-ext-player-display .ad-ext-player .ad-ext-player-name {
  letter-spacing: 0.02em;
}

#ad-ext-player-display + div,
.ad-ext-theme-content-left > #ad-ext-player-display + div {
  display: grid !important;
  grid-auto-flow: row !important;
  grid-template-columns:
    repeat(
      var(--ad-ext-theme-cricket-player-count),
      var(--ad-ext-theme-cricket-player-column-width)
    ) !important;
  grid-auto-rows: minmax(0, 1fr) !important;
  column-gap: 0 !important;
  row-gap: 1.6px !important;
  margin-top: 0 !important;
  width: max-content !important;
  min-width: max-content !important;
  min-height: 0 !important;
  height: 100% !important;
  align-content: stretch !important;
  align-self: stretch !important;
  justify-content: start !important;
}

#ad-ext-player-display + div > .ad-ext-crfx-cell,
.ad-ext-theme-content-left > #ad-ext-player-display + div > .ad-ext-crfx-cell {
  min-width: var(--ad-ext-theme-cricket-player-column-width) !important;
  max-width: var(--ad-ext-theme-cricket-player-column-max-width) !important;
  width: var(--ad-ext-theme-cricket-player-column-width) !important;
}

.ad-ext-crfx-root .ad-ext-crfx-label-cell {
  box-shadow:
    inset 0 0 0 1px rgba(110, 138, 154, 0.26),
    inset 0 0 10px rgba(3, 16, 24, 0.2) !important;
  background:
    linear-gradient(
      90deg,
      rgba(9, 26, 38, 0.28) 0%,
      rgba(9, 26, 38, 0.1) 100%
    ) !important;
}

.ad-ext-crfx-root .ad-ext-crfx-label-cell::before,
.ad-ext-crfx-root .ad-ext-crfx-label-cell::after {
  content: none !important;
}

p.chakra-text.css-1qlemha {
  color: rgba(236, 248, 255, 0.96);
  background: linear-gradient(115deg, rgba(6, 58, 74, 0.84), rgba(8, 45, 62, 0.9));
  border: 1px solid rgba(127, 214, 247, 0.34);
  border-radius: 0.28rem;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.02), 0 8px 18px rgba(0, 0, 0, 0.18);
  letter-spacing: 0.02em;
}

#grid .label-cell,
#grid [data-row-label],
#grid [data-target-label],
.ad-ext-crfx-badge {
  color: rgba(236, 248, 255, 0.96);
  letter-spacing: 0.02em;
}

#grid tr td,
#grid tr th {
  border-color: rgba(56, 74, 102, 0.78) !important;
  position: relative;
}

#grid tr > td:not(:first-child),
#grid tr > th:not(:first-child) {
  min-width: var(--ad-ext-theme-cricket-player-column-width) !important;
  max-width: var(--ad-ext-theme-cricket-player-column-max-width) !important;
  width: var(--ad-ext-theme-cricket-player-column-width) !important;
}

#grid tr:nth-child(odd) td {
  background: linear-gradient(90deg, rgba(12, 20, 34, 0.88), rgba(10, 17, 30, 0.86));
}

#grid tr:nth-child(even) td {
  background: linear-gradient(90deg, rgba(8, 14, 25, 0.86), rgba(6, 12, 22, 0.84));
}

#grid .label-cell,
#grid tr > td:first-child,
#grid tr > th:first-child {
  background: linear-gradient(90deg, rgba(10, 17, 30, 0.88), rgba(8, 14, 25, 0.86)) !important;
  border-right-color: rgba(56, 74, 102, 0.78) !important;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.03);
}

.css-rfeml4 > div {
  position: relative;
  border: 1px solid rgba(54, 72, 98, 0.78) !important;
}

.css-rfeml4 > div:nth-child(odd) {
  background: linear-gradient(120deg, rgba(10, 18, 32, 0.88), rgba(8, 15, 28, 0.9)) !important;
}

.css-rfeml4 > div:nth-child(even) {
  background: linear-gradient(120deg, rgba(11, 18, 32, 0.88), rgba(8, 15, 28, 0.9)) !important;
}

.ad-ext-theme-content-board {
  position: relative;
  min-width: 0 !important;
  width: 100% !important;
  max-width: 100% !important;
  display: flex !important;
  justify-content: center !important;
  justify-self: stretch !important;
  align-self: stretch !important;
  overflow: visible !important;
}

.ad-ext-theme-content-slot.ad-ext-theme-cricket-board-forced-visible > .ad-ext-theme-content-board {
  width: var(--ad-ext-theme-cricket-board-width, var(--ad-ext-theme-cricket-board-min-width-manual)) !important;
  max-width: var(--ad-ext-theme-cricket-board-width, var(--ad-ext-theme-cricket-board-min-width-manual)) !important;
}

.ad-ext-theme-board-panel {
  background: transparent !important;
  border: none !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  width: 100% !important;
  max-width: 100% !important;
  min-width: 0 !important;
}

.ad-ext-theme-board-panel::after {
  content: "";
  position: absolute;
  inset: 16% 14% 6%;
  pointer-events: none;
  background: radial-gradient(circle, rgba(197, 31, 31, 0.34), rgba(197, 31, 31, 0) 68%);
  filter: blur(26px);
  opacity: 0.78;
}

.ad-ext-theme-board-panel.ad-ext-theme-board-image-backed::after {
  content: none;
}

.ad-ext-theme-board-controls,
.ad-ext-theme-board-viewport {
  position: relative;
  z-index: 1;
}

.ad-ext-theme-board-viewport {
  width: 100% !important;
  max-width: 100% !important;
  min-width: 0 !important;
  justify-content: center !important;
  align-items: center !important;
}

.ad-ext-theme-board-canvas {
  min-width: 0 !important;
  max-width: 100% !important;
  max-height: 100% !important;
}

.ad-ext-theme-board-event-shell,
.ad-ext-theme-board-media-root {
  max-width: 100% !important;
  max-height: 100% !important;
}

.ad-ext-theme-board-event-shell {
  padding: 0 !important;
}

.ad-ext-theme-board-event-shell > .ad-ext-theme-board-canvas,
.ad-ext-theme-board-event-shell > .ad-ext-theme-board-media-root,
.ad-ext-theme-board-panel.ad-ext-theme-board-image-backed .ad-ext-theme-board-media-root {
  width: 100% !important;
  height: 100% !important;
}
`;

export function buildCricketThemeCss(featureConfig = {}) {
  const resolved = resolveThemeCricketConfig(featureConfig);
  const previewCss = buildPreviewPlacementCss(PREVIEW_PLACEMENT);
  const avgVisibilityCss = resolved.showAvg
    ? ""
    : `
#ad-ext-player-display .ad-ext-player > ${STACK_SELECTOR} > ${SLOT_STATS_SELECTOR} > p{
  display: none !important;
}

.ad-ext-avg-trend-arrow{
  display: none !important;
}
`;

  return buildThemeCssBundle(featureConfig, `${cricketThemeCss}${avgVisibilityCss}${previewCss}`);
}

export { PREVIEW_PLACEMENT };
