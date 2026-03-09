import { buildThemeCssBundle } from "../shared/theme-style-builder.js";
import { buildPreviewPlacementCss, normalizeBoolean } from "../shared/theme-utils.js";

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

const cricketThemeCss = `
:root{
  --theme-bg: #000000;
  --theme-text-highlight-color: #9fdb58;
  --theme-navigation-bg: #222222;
  --theme-navigation-item-color: #666666;
  --theme-player-badge-bg: #9fdb58;
  --theme-current-bg: #0c343d;
  --theme-border-color: #434343;
  --theme-alt-bg: #274e13;
}

#ad-ext-turn > .ad-ext-turn-throw,
#ad-ext-turn > .score,
#ad-ext-turn > .suggestion{
  height: 100px !important;
  width: 100% !important;
}

#ad-ext-player-display{
  display: grid !important;
  grid-auto-flow: column !important;
  grid-auto-columns: minmax(0, 1fr) !important;
  align-items: stretch !important;
  gap: 0.45rem !important;
}

#ad-ext-player-display .ad-ext-player{
  min-height: 172px !important;
}

#ad-ext-player-display .ad-ext-player > .chakra-stack{
  min-height: 172px !important;
  padding-top: 0.3rem !important;
  padding-bottom: 0.3rem !important;
}

div.css-y3hfdd{
  gap: 0 !important;
}

p.chakra-text.css-1j0bqop{
  font-size: 1.2rem !important;
}

div.ad-ext-player.ad-ext-player-active.css-1en42kf p.chakra-text.css-11cuipc{
  font-size: 1.8rem !important;
}

.ad-ext-player:not(.ad-ext-player-active):not(.ad-ext-player-winner) > div > p {
  font-size: 3em !important;
  color: gray !important;
}

.ad-ext-player.ad-ext-player-inactive p.chakra-text.ad-ext-player-score,
.ad-ext-player.ad-ext-player-inactive .ad-ext_winner-score-wrapper > p {
  font-size: 3em !important;
  color: gray !important;
}

.ad-ext-player-inactive .chakra-stack.css-37hv00 {
  height: auto !important;
  min-height: 2.2rem !important;
}

.ad-ext-player.ad-ext-player-inactive.css-1en42kf{
  display: block !important;
}

.ad-ext-player-inactive .chakra-text.css-11cuipc {
  font-size: x-large !important;
}

* {
  scrollbar-width: none !important;
}

div.css-gmuwbf,
div.css-tkevr6,
div.css-nfhdnc {
  background-color: var(--theme-bg);
}

.ad-ext-player-name{
  font-size: 1rem !important;
}

.css-rtn29s {
  border: 2px solid #9fdb58 !important;
}

.chakra-stack.navigation {
  background-color: var(--theme-navigation-bg);
}

p.chakra-text.css-1qlemha {
  background-color: var(--theme-current-bg);
  left: 0 !important;
  margin-left: 0 !important;
  font-size: clamp(1.6rem, 2vw, 2.2rem);
  white-space: nowrap;
  line-height: 1.1;
  padding: 0 0.5rem 0 0.45rem;
  width: max-content;
  max-width: 100%;
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

.css-y3hfdd > p,
.css-y3hfdd > .ad-ext_winner-score-wrapper > p {
  color: var(--theme-text-highlight-color);
}

p.chakra-text.ad-ext-player-score.css-1r7jzhg {
  color: var(--theme-text-highlight-color);
}

div.ad-ext-player.ad-ext-player-active.css-1en42kf {
  border-color: var(--theme-border-color);
  border-style: solid;
}

div.chakra-menu__menu-list.css-yskgbr {
  background-color: var(--theme-border-color);
}

span.chakra-switch__track.css-v4l15v {
  background-color: #38761d;
}

.css-tkevr6 > .chakra-stack{
  grid-template-columns: 0.92fr 1.08fr !important;
}

[data-ad-theme-layout-root="true"]{
  --cricket-board-safe-height: calc(100dvh - 132px);
  --cricket-board-safe-width: calc(100dvw - 72px);
}

@media (max-height: 980px){
  [data-ad-theme-layout-root="true"]{
    --cricket-board-safe-height: calc(100dvh - 150px);
  }
}

@media (max-height: 820px){
  [data-ad-theme-layout-root="true"]{
    --cricket-board-safe-height: calc(100dvh - 170px);
  }
}

[data-ad-theme-layout-root="true"] > [data-ad-theme-slot="footer"]{
  grid-column-start: 1 !important;
  grid-column-end: 3 !important;
  grid-row-start: 2 !important;
  grid-row-end: 3 !important;
  grid-area: footer !important;
}

[data-ad-theme-layout-root="true"] > [data-ad-theme-slot="players"]{
  grid-column-start: 1 !important;
  grid-column-end: 2 !important;
  grid-row-start: 3 !important;
  grid-row-end: 4 !important;
  grid-area: players !important;
  min-width: 0 !important;
}

[data-ad-theme-layout-root="true"] > [data-ad-theme-slot="board"]{
  grid-column-start: 2 !important;
  grid-column-end: 3 !important;
  grid-row-start: 3 !important;
  grid-row-end: 4 !important;
  grid-area: board !important;
  justify-self: stretch !important;
  align-self: stretch !important;
  width: 100% !important;
  height: 100% !important;
  min-width: 0 !important;
  min-height: 0 !important;
  margin: 0 !important;
}

[data-ad-theme-layout-root="true"] > [data-ad-theme-slot="board"] > *{
  width: 100% !important;
  height: 100% !important;
  min-width: 0 !important;
  min-height: 0 !important;
}

[data-ad-theme-layout-root="true"] > [data-ad-theme-slot="board"] .css-tqsk66{
  width: 100% !important;
  height: 100% !important;
  min-height: 0 !important;
  padding: 0 0 8px 0 !important;
  display: grid !important;
  grid-template-rows: minmax(0, 1fr) auto !important;
  align-items: stretch !important;
  justify-items: center !important;
  row-gap: 8px !important;
}

[data-ad-theme-layout-root="true"] > [data-ad-theme-slot="board"] .css-7bjx6y,
[data-ad-theme-layout-root="true"] > [data-ad-theme-slot="board"] .css-1wegtvo{
  top: auto;
  bottom: 0;
}

[data-ad-theme-layout-root="true"] > [data-ad-theme-slot="board"] svg,
[data-ad-theme-layout-root="true"] > [data-ad-theme-slot="board"] canvas,
[data-ad-theme-layout-root="true"] > [data-ad-theme-slot="board"] img{
  display: block;
  margin-left: auto;
  margin-right: auto;
  width: min(100%, var(--cricket-board-safe-height), var(--cricket-board-safe-width)) !important;
  height: auto !important;
  max-height: var(--cricket-board-safe-height) !important;
  max-width: var(--cricket-board-safe-width);
  object-fit: contain;
}
`;

export function buildCricketThemeCss(featureConfig = {}) {
  const resolved = resolveThemeCricketConfig(featureConfig);
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

  return buildThemeCssBundle(featureConfig, `${cricketThemeCss}${avgVisibilityCss}${previewCss}`);
}

export { PREVIEW_PLACEMENT };
