export const commonThemeCss = `
:root{
  --theme-bg: #000000;
  --theme-background: #000000;
  --theme-text-color: #000000;
  --theme-text-highlight-color: #9fdb58;
  --theme-navigation-bg: #434343;
  --theme-navigation-item-color: #666666;
  --theme-player-badge-bg: #9fdb58;
  --theme-player-name-bg: #9fdb58;
  --theme-current-bg: #0c343d;
  --theme-border-color: #434343;
  --theme-alt-bg: #274e13;
}

div.css-gmuwbf,
div.css-tkevr6,
div.css-nfhdnc {
  background-color: var(--theme-background);
}

.chakra-stack.navigation,
div.chakra-stack.navigation.css-19ml6yu,
div.chakra-stack.navigation.css-ege71s {
  background-color: var(--theme-navigation-bg);
}

span.chakra-badge.css-1g1qw76 {
  font-size: 30px;
  background-color: var(--theme-player-name-bg);
}

p.chakra-text.css-0,
div.ad-ext-player.ad-ext-player-active p.chakra-text.css-0 {
  font-size: 30px;
}

div.ad-ext-player.ad-ext-player-active p.chakra-text.ad-ext-player-score {
  font-size: 7em;
}

button.chakra-button.css-d6eevf {
  background-color: var(--theme-navigation-item-color);
}

p.chakra-text.css-1qlemha {
  background-color: var(--theme-current-bg);
  font-size: 30px;
}

span.css-bs3vp6 {
  font-size: 30px;
}

span.css-elma0c {
  background-color: var(--theme-alt-bg);
}

span.css-5nep5l {
  background-color: var(--theme-current-bg);
}

div.css-rrf7rv {
  background-color: var(--theme-alt-bg);
  border-color: var(--theme-border-color);
}

span.chakra-badge.css-1j1ty0z,
span.chakra-badge.css-1c4630i,
span.chakra-badge.css-n2903v {
  font-size: 30px;
}

.correction-bg {
  background-color: #d69d2e !important;
}

.css-rtn29s {
  border: 2px solid rgb(159 219 88);
}

p.chakra-text.ad-ext-player-score.css-18w03sn { color: #9fdb58; }
span.css-3fr5p8 { background-color: #9fdb58; color: #222; }
p.chakra-text.ad-ext-player-score.css-1r7jzhg { color: #9fdb58; }
div.suggestion.css-1dkgpmk { font-size: 6px; background-color: #222; border-color: #434343; }
div.ad-ext-player.ad-ext-player-active.css-1en42kf { border-color: #434343; border-style: solid; }
div.chakra-menu__menu-list.css-yskgbr { background-color: #434343; }
button.chakra-tabs__tab.css-1vm7g5b { color: #9fdb58; }
span.chakra-switch__track.css-v4l15v { background-color: #38761d; }
button.chakra-tabs__tab.css-1pjn7in { color: #9fdb58; }
`;

export const commonLayoutCss = `
.css-tkevr6 > .chakra-stack{
  display: grid !important;
  grid-template-columns: 1fr 1fr !important;
  grid-template-rows: max-content max-content 1fr !important;
  grid-template-areas:
    "header header"
    "footer footer"
    "players board" !important;
  max-width: 100% !important;
  min-height: 0 !important;
  height: 100% !important;
}

.css-tkevr6 > .chakra-stack > div.css-0:first-child:not(.chakra-wrap){
  position: static !important;
  grid-column-start: 1 !important;
  grid-column-end: 3 !important;
  grid-row-start: 1 !important;
  grid-row-end: 2 !important;
  grid-area: header !important;
}

.chakra-wrap.css-0,
.css-k008qs{
  grid-column-start: 1 !important;
  grid-column-end: 3 !important;
  grid-row-start: 1 !important;
  grid-row-end: 2 !important;
  grid-area: header !important;
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
  height: 20px !important;
}

.ad-ext-player.ad-ext-player-inactive.css-1en42kf{
  display: ruby-text !important;
}

.ad-ext-player-inactive .chakra-text.css-11cuipc {
  font-size: x-large !important;
}

.chakra-avatar{ --avatar-size: 2.5rem; }
.css-7lnr9n{ width: 2.5rem; height: 2.5rem; }

#ad-ext-player-display {
  display:flex;
  flex-direction: column;
  align-items: stretch;
  grid-column-start: 1 !important;
  grid-column-end: 2 !important;
  grid-row-start: 3 !important;
  grid-row-end: 4 !important;
  grid-area: players !important;
  max-height: 80vh;
}

.css-1k3nd6z{ align-self: stretch; font-size: 36px; }
.css-g0ywsj{ min-width: auto; }
.css-1k3nd6z > span{ justify-content: center; height: 100%; }
.css-3fr5p8 { background-color: var(--theme-player-badge-bg); }
.css-3fr5p8 > p{ font-size: 30px; }

.css-1j0bqop { font-size: 25px; }

#ad-ext-turn{
  grid-column-start: 1 !important;
  grid-column-end: 3 !important;
  grid-row-start: 2 !important;
  grid-row-end: 3 !important;
  grid-area: footer !important;
}

.css-17xejub{
  grid-column-start: 2 !important;
  grid-column-end: 3 !important;
  grid-row-start: 3 !important;
  grid-row-end: 4 !important;
  grid-area: board !important;
}

div.css-y3hfdd{
  display: grid !important;
  grid-template-columns: 1fr auto !important;
  grid-template-rows: 1fr !important;
}

.ad-ext_winner-score-wrapper{
  display: contents !important;
}

div.css-y3hfdd > p,
div.css-y3hfdd > .ad-ext_winner-score-wrapper > p{
  color: var(--theme-text-highlight-color);
  grid-row-start: 1 !important;
  grid-row-end: 3 !important;
  margin-bottom:0 !important;
}

.css-1r7jzhg{
  grid-column-start: 2 !important;
  grid-column-end: 3 !important;
  grid-row-start: 1 !important;
  grid-row-end: 3 !important;
}

.css-37hv0{
  grid-row-start: 1 !important;
  grid-row-end: 2 !important;
  grid-column-start: 1 !important;
  grid-column-end: 2 !important;
}

.css-37hv00{
  grid-row-start: 1 !important;
  grid-row-end: 2 !important;
  grid-column-start: 1 !important;
  grid-column-end: 2 !important;
  display: flex !important;
  flex-wrap: nowrap !important;
}

div.css-y3hfdd > .css-1igwmid{
  grid-row-start: 2 !important;
  grid-row-end: 3 !important;
  grid-column-start: 1 !important;
  grid-column-end: 2 !important;
  padding-left:55px !important;
}

.css-1kejrvi,
.css-14xtjvc{
  grid-column-start: 2 !important;
  grid-column-end: 3 !important;
  grid-row-start: 3 !important;
  grid-row-end: 4 !important;
  grid-area: board !important;
  align-self: start !important;
  height: 100% !important;
  position: relative !important;
  margin-top: 0 !important;
}

.css-tqsk66{ padding-bottom: 50px; }
.css-7bjx6y,
.css-1wegtvo{ top: inherit; bottom: 0; }
.css-1emway5 { grid-column: 1 / 3; }

/* Stable board-layout hooks (primary path, class-hash agnostic). */
.ad-ext-theme-content-slot{
  display: grid !important;
  grid-template-columns: minmax(18rem, clamp(22rem, 34vw, 38rem)) minmax(0, 1fr) !important;
  align-items: stretch !important;
  gap: 0.5rem !important;
  grid-column: 1 / -1 !important;
  grid-row: 3 !important;
  min-height: 0 !important;
  height: 100% !important;
  width: 100% !important;
}

.css-tkevr6 > .chakra-stack > .ad-ext-theme-content-slot,
.css-tkevr6 .ad-ext-theme-content-slot{
  justify-self: stretch !important;
  align-self: stretch !important;
  width: 100% !important;
  max-width: 100% !important;
  min-width: 0 !important;
}

.css-tkevr6 .ad-ext-theme-content-slot > .ad-ext-theme-content-left,
.css-tkevr6 .ad-ext-theme-content-slot > .ad-ext-theme-content-board{
  min-width: 0 !important;
}

.css-tkevr6 .ad-ext-theme-content-slot > .ad-ext-theme-content-board{
  justify-self: stretch !important;
}

.ad-ext-theme-content-left{
  grid-column: 1 !important;
  min-width: 0 !important;
  min-height: 0 !important;
}

.ad-ext-theme-content-board{
  grid-column: 2 !important;
  min-width: 0 !important;
  min-height: 0 !important;
  height: 100% !important;
  display: flex !important;
  flex-direction: column !important;
}

.ad-ext-theme-board-panel{
  display: grid !important;
  grid-template-rows: minmax(0, 1fr) !important;
  min-height: 0 !important;
  height: 100% !important;
  max-height: 100% !important;
  position: relative !important;
  overflow: hidden !important;
}

.ad-ext-theme-board-controls{
  position: absolute !important;
  top: 0.5rem !important;
  right: 0.5rem !important;
  bottom: auto !important;
  left: auto !important;
  z-index: 2 !important;
  pointer-events: auto !important;
}

.ad-ext-theme-board-viewport{
  min-height: 0 !important;
  height: 100% !important;
  max-height: 100% !important;
  padding-bottom: 0 !important;
  display: flex !important;
  flex-direction: column !important;
  overflow: hidden !important;
}

.ad-ext-theme-board-canvas{
  min-height: 0 !important;
  flex: 1 1 auto !important;
  height: 100% !important;
  max-height: 100% !important;
  width: 100% !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  container-type: size !important;
  overflow: hidden !important;
}

.ad-ext-theme-board-canvas > *{
  width: var(--ad-ext-theme-board-size, 100%) !important;
  height: var(--ad-ext-theme-board-size, 100%) !important;
  max-width: 100% !important;
  max-height: 100% !important;
  min-width: 0 !important;
  min-height: 0 !important;
  margin: 0 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  overflow: hidden !important;
}

.ad-ext-theme-board-svg[viewBox="0 0 1000 1000"]{
  width: 100% !important;
  height: 100% !important;
  min-width: 0 !important;
  min-height: 0 !important;
  max-width: 100% !important;
  max-height: 100% !important;
  display: block !important;
  aspect-ratio: 1 / 1;
}
`;
