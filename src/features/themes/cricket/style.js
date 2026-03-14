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
  grid-auto-columns: minmax(0, 1fr) !important;
  align-items: stretch !important;
  gap: 0.35rem !important;
}

#ad-ext-player-display .ad-ext-player{
  min-height: 185px !important;
}

#ad-ext-player-display .ad-ext-player > .chakra-stack{
  min-height: 185px !important;
  padding-top: 0.3rem !important;
  padding-bottom: 0.3rem !important;
}

div.css-y3hfdd{
  gap: 0 !important;
  min-height: 0 !important;
  container-type: size !important;
}

p.chakra-text.css-1j0bqop{
  font-size: 1.2rem !important;
}

div.ad-ext-player.ad-ext-player-active.css-1en42kf p.chakra-text.css-11cuipc{
  font-size: 1.8rem !important;
}

.ad-ext-player:not(.ad-ext-player-active):not(.ad-ext-player-winner) > div > p {
  font-size: clamp(1rem, 1.05vw, 1.3rem) !important;
  color: gray !important;
}

.ad-ext-player.ad-ext-player-inactive p.chakra-text.ad-ext-player-score,
.ad-ext-player.ad-ext-player-inactive .ad-ext_winner-score-wrapper > p {
  font-size: clamp(1rem, 1.05vw, 1.3rem) !important;
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

.css-tkevr6{
  height: 99%;
}

div.css-gmuwbf,
div.css-tkevr6,
div.css-nfhdnc {
  background-color: var(--theme-bg);
}

.ad-ext-player-name{
  font-size: 1rem !important;
}

#ad-ext-player-display .ad-ext-player .ad-ext-player-name {
  font-size: 1rem !important;
}

#ad-ext-player-display .ad-ext-player .ad-ext-player-score {
  color: var(--theme-text-highlight-color);
  font-size: clamp(2.4rem, min(58cqh, 8.2vw), 8.4rem) !important;
  line-height: 0.9 !important;
  align-self: stretch !important;
  height: 100% !important;
  display: flex !important;
  align-items: center !important;
  justify-content: flex-end !important;
  text-align: right !important;
  white-space: nowrap !important;
  font-variant-numeric: tabular-nums;
}

#ad-ext-player-display .ad-ext-player.ad-ext-player-active .ad-ext-player-score {
  font-size: clamp(2.8rem, min(66cqh, 8.9vw), 9.4rem) !important;
}

#ad-ext-player-display .ad-ext-player.ad-ext-player-inactive .ad-ext-player-score,
#ad-ext-player-display .ad-ext-player:not(.ad-ext-player-active):not(.ad-ext-player-winner) .ad-ext-player-score {
  font-size: clamp(2.2rem, min(52cqh, 7.2vw), 7.2rem) !important;
  color: gray !important;
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

.css-1yso2z2 {
  height: 100% !important;
}

.ad-ext-theme-content-slot {
  background:
    radial-gradient(circle at 72% 58%, rgba(0, 178, 135, 0.14), rgba(0, 0, 0, 0) 48%),
    radial-gradient(circle at 18% 32%, rgba(34, 197, 255, 0.1), rgba(0, 0, 0, 0) 42%);
}

#ad-ext-player-display .ad-ext-player > .chakra-stack {
  position: relative !important;
  overflow: hidden !important;
  background: linear-gradient(165deg, rgba(6, 15, 34, 0.96), rgba(3, 10, 24, 0.94)) !important;
  border: 1px solid var(--ad-ext-cricket-line) !important;
  border-radius: 0.6rem !important;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.03), 0 10px 26px rgba(0, 0, 0, 0.42);
  transition: border-color 180ms ease, box-shadow 180ms ease, filter 180ms ease;
}

#ad-ext-player-display .ad-ext-player > .chakra-stack::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0) 32%),
    radial-gradient(circle at 12% 20%, var(--ad-ext-cricket-card-sheen), rgba(0, 0, 0, 0) 42%);
  opacity: 0.9;
}

#ad-ext-player-display .ad-ext-player.ad-ext-player-active > .chakra-stack {
  border-color: var(--ad-ext-cricket-active-ring) !important;
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.08),
    0 0 0 1px rgba(159, 232, 112, 0.24),
    0 0 20px rgba(159, 232, 112, 0.28),
    0 12px 28px rgba(0, 0, 0, 0.44);
}

#ad-ext-player-display .ad-ext-player.ad-ext-player-active > .chakra-stack::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  border: 1px solid rgba(159, 232, 112, 0.3);
  box-shadow: inset 0 0 18px rgba(159, 232, 112, 0.08), 0 0 24px var(--ad-ext-cricket-card-glow);
}

#ad-ext-player-display .ad-ext-player:not(.ad-ext-player-active) > .chakra-stack {
  filter: saturate(0.76) brightness(0.9);
  opacity: 0.82;
}

#ad-ext-player-display .ad-ext-player:not(.ad-ext-player-active) > .chakra-stack::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(1, 6, 15, 0.18) 100%);
}

#ad-ext-player-display .ad-ext-player .ad-ext-player-name {
  letter-spacing: 0.02em;
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
}

.ad-ext-theme-board-panel {
  background: transparent !important;
  border: none !important;
  border-radius: 0 !important;
  box-shadow: none !important;
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

.ad-ext-theme-board-controls,
.ad-ext-theme-board-viewport {
  position: relative;
  z-index: 1;
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
