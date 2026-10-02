export const STYLE_ID = "ad-ext-theme-game-layout-style";

export function buildThemeGameLayoutStyleText() {
  return `
[data-ad-ext-game-layout-root="true"]{
  --ad-game-layout-rail-width:420px;
  --ad-game-layout-board-size:0px;
  --ad-game-layout-player-height:112px;
  --ad-game-layout-player-scale:1;
  --ad-game-layout-name-height:calc(52px * var(--ad-game-layout-player-scale));
  --ad-game-layout-stat-font-size:calc(22px * var(--ad-game-layout-player-scale));
  --ad-game-layout-card-height:var(--ad-game-layout-player-height);
  --ad-game-layout-player-gap:10px;
  --ad-game-layout-turn-height:144px;
  --ad-game-layout-turn-scale:1;
  --ad-game-layout-turn-value-font-size:clamp(2.25rem,calc(var(--ad-game-layout-rail-width) * .08),calc(3.5rem * var(--ad-game-layout-turn-scale)));
  --ad-game-layout-score-span:calc(var(--ad-game-layout-player-height) * .55);
  position:relative!important;
  display:grid!important;
  height:var(--visual-viewport-height,100dvh)!important;
  min-height:0!important;
  align-self:stretch!important;
  grid-template-columns:var(--ad-game-layout-rail-width) minmax(0,1fr)!important;
  grid-template-rows:var(--ad-game-layout-turn-height) minmax(0,1fr)!important;
  column-gap:16px!important;
  row-gap:0!important;
  align-items:stretch!important;
  justify-content:stretch!important;
  overflow:hidden!important;
}
[data-ad-ext-game-layout-root="true"][data-ad-ext-game-layout-overflow="true"]::after{
  content:"";
  position:absolute;
  z-index:30;
  left:calc(16px + var(--ad-game-layout-rail-width) - 4px);
  top:calc(16px + var(--ad-game-layout-turn-height) + var(--ad-game-layout-thumb-offset));
  width:3px;
  height:var(--ad-game-layout-thumb-height);
  border-radius:999px;
  background:rgba(126,216,255,.72);
  pointer-events:none;
}
[data-ad-ext-game-layout-stage="true"],
[data-ad-ext-game-layout-player-column="true"]{display:contents!important}
[data-ad-ext-game-layout-turn-slot="true"]{
  grid-column:1!important;
  grid-row:1!important;
  width:auto!important;
  min-width:0!important;
  height:var(--ad-game-layout-turn-height)!important;
  padding:calc(32px * var(--ad-game-layout-turn-scale)) 0 0!important;
  box-sizing:border-box!important;
  overflow:hidden!important;
}
[data-ad-ext-game-layout-variant="true"]{
  left:var(--ad-game-layout-variant-left,16px)!important;
  top:16px!important;
  width:var(--ad-game-layout-variant-width,var(--ad-game-layout-rail-width))!important;
  max-width:var(--ad-game-layout-variant-width,var(--ad-game-layout-rail-width))!important;
  min-height:22px!important;
  justify-content:flex-start!important;
  overflow:hidden!important;
}
[data-ad-ext-game-layout-turn-slot="true"]>*{
  width:100%!important;
  height:100%!important;
  padding:calc(8px * var(--ad-game-layout-turn-scale)) 0!important;
}
[data-ad-ext-game-layout-turn-slot="true"] .bg-surface-surface{
  left:auto!important;
  flex:1 1 100%!important;
  width:100%!important;
  max-width:none!important;
  height:100%!important;
  transform:none!important;
}
[data-ad-ext-game-layout-turn-slot="true"] .bg-surface-surface>:first-child{
  flex:3 1 75%!important;
  width:75%!important;
  min-width:0!important;
  padding-left:calc(12px * var(--ad-game-layout-turn-scale))!important;
  gap:calc(12px * var(--ad-game-layout-turn-scale))!important;
}
[data-ad-ext-game-layout-turn-slot="true"] .bg-surface-surface>:first-child>*{
  flex:1 1 0%!important;
  width:auto!important;
  max-width:none!important;
  height:100%!important;
  padding-top:0!important;
}
[data-ad-ext-game-layout-turn-slot="true"] .bg-surface-surface>:last-child{
  flex:1 1 25%!important;
  width:25%!important;
  max-width:none!important;
  height:100%!important;
  padding-top:0!important;
}
[data-ad-ext-game-layout-root="true"] [data-ad-ext-game-layout-turn-slot="true"] .bg-surface-surface>:first-child>*:not(.text-checkout-suggestion,.text-checkout-setup)::before{
  font-size:var(--ad-game-layout-turn-value-font-size)!important;
  line-height:1!important;
}
[data-ad-ext-game-layout-root="true"] [data-ad-ext-game-layout-turn-slot="true"] .bg-surface-surface>:first-child>*[data-ad-ext-hit-kind]:not(.text-checkout-suggestion,.text-checkout-setup)::before{
  font-size:var(--ad-game-layout-turn-value-font-size)!important;
}
[data-ad-ext-game-layout-root="true"] [data-ad-ext-game-layout-turn-slot="true"] .bg-surface-surface>:last-child,
[data-ad-ext-game-layout-root="true"] [data-ad-ext-game-layout-turn-slot="true"] .bg-surface-surface>:last-child>span,
[data-ad-ext-game-layout-root="true"] [data-ad-ext-game-layout-turn-slot="true"] .bg-surface-surface>:first-child>.font-number>span:not([aria-hidden="true"]),
[data-ad-ext-game-layout-root="true"] [data-ad-ext-game-layout-turn-slot="true"] .bg-surface-surface>:first-child>.font-number>span:not([aria-hidden="true"]) *{
  font-size:var(--ad-game-layout-turn-value-font-size)!important;
}
:root:has(#ad-ext_style_enhanced-scoring-display) [data-ad-ext-game-layout-root="true"] [data-ad-ext-game-layout-turn-slot="true"] .bg-surface-surface>:first-child>.font-number.cursor-pointer>span:not([aria-hidden="true"]),
:root:has(#ad-ext_style_enhanced-scoring-display) [data-ad-ext-game-layout-root="true"] [data-ad-ext-game-layout-turn-slot="true"] .bg-surface-surface>:first-child>.font-number.cursor-pointer>span:not([aria-hidden="true"]) *{
  font-size:calc(1rem * var(--ad-game-layout-turn-scale))!important;
  line-height:1!important;
}
[data-ad-ext-game-layout-root="true"] [data-ad-ext-game-layout-turn-slot="true"] .bg-surface-surface>:first-child>*.text-checkout-suggestion{
  padding:calc(10px * var(--ad-game-layout-turn-scale)) calc(12px * var(--ad-game-layout-turn-scale))!important;
  box-sizing:border-box!important;
}
[data-ad-ext-game-layout-root="true"] [data-ad-ext-game-layout-turn-slot="true"] :is(.text-checkout-suggestion,.text-checkout-setup)[data-ad-ext-label]::before{
  top:calc(-9px * var(--ad-game-layout-turn-scale))!important;
  left:calc(9px * var(--ad-game-layout-turn-scale))!important;
  padding:calc(4.5px * var(--ad-game-layout-turn-scale)) calc(10.5px * var(--ad-game-layout-turn-scale))!important;
  font-size:calc(16.5px * var(--ad-game-layout-turn-scale))!important;
  line-height:1!important;
}
[data-ad-ext-game-layout-turn-slot="true"] .bg-surface-surface>:first-child>*:not(.ad-ext-hit-highlight){
  transform:none!important;
  transform-origin:center!important;
}
[data-ad-ext-game-layout-turn-slot="true"] .bg-surface-surface>:first-child>*>span[aria-hidden="true"]:not(.ad-ext-hit-effect-layer,.ad-ext-hit-frame-layer),
[data-ad-ext-game-layout-turn-slot="true"] .bg-surface-surface>:first-child>*>span:not([aria-hidden="true"],.ad-ext-hit-score,.ad-ext-hit-segment){
  animation:none!important;
  transition:none!important;
}
[data-ad-ext-game-layout-turn-slot="true"] .bg-surface-surface>:first-child>*:not(.text-checkout-suggestion,.text-checkout-setup):has(>span[aria-hidden="true"]:not(.opacity-0)>svg)::before,
[data-ad-ext-game-layout-turn-slot="true"] .bg-surface-surface>:first-child>*:not(.text-checkout-suggestion,.text-checkout-setup):has(>span[aria-hidden="true"]:not(.opacity-0)>svg)>span:not([aria-hidden="true"]){
  opacity:0!important;
}
[data-ad-ext-game-layout-turn-slot="true"] span[aria-hidden="true"]>svg{
  width:min(90%,calc(67px * var(--ad-game-layout-turn-scale)))!important;
  height:auto!important;
}
[data-ad-ext-game-layout-turn-slot="true"] .ad-ext-turn-dart-placeholder--modern::before{
  zoom:var(--ad-game-layout-turn-scale);
}
[data-ad-ext-game-layout-board-slot="true"]{
  grid-column:2!important;
  grid-row:1 / span 2!important;
  width:auto!important;
  min-width:0!important;
  max-width:none!important;
  height:auto!important;
  display:grid!important;
  place-items:center!important;
  container-type:size!important;
  aspect-ratio:auto!important;
  justify-self:stretch!important;
  align-self:stretch!important;
  margin-right:-16px!important;
  margin-bottom:-16px!important;
  overflow:visible!important;
}
[data-ad-ext-game-layout-board-frame="true"]{
  width:min(100cqw,100cqh)!important;
  height:min(100cqw,100cqh)!important;
  max-width:100%!important;
  max-height:100%!important;
  aspect-ratio:1!important;
  justify-self:center!important;
  align-self:center!important;
}
[data-ad-ext-game-layout-root="true"] .dart-segment-blink{
  animation:ad-ext-game-layout-hit-pulse 1.6s ease-in-out infinite!important;
}
@keyframes ad-ext-game-layout-hit-pulse{
  0%,100%{opacity:.42}
  50%{opacity:.62}
}
@media (prefers-reduced-motion:reduce){
  [data-ad-ext-game-layout-root="true"] .dart-segment-blink{
    animation:none!important;
    opacity:.52!important;
  }
}
[data-ad-ext-game-layout-controls-slot="true"]{
  grid-column:2!important;
  grid-row:1 / span 2!important;
  z-index:40!important;
  width:min(var(--ad-game-layout-board-size),calc(100% - 24px))!important;
  max-width:100%!important;
  min-width:0!important;
  height:auto!important;
  padding:0 12px 0 0!important;
  margin:0 0 12px!important;
  box-sizing:border-box!important;
  display:flex!important;
  justify-content:flex-end!important;
  justify-self:center!important;
  align-self:end!important;
  overflow:visible!important;
  pointer-events:none!important;
}
[data-ad-ext-game-layout-controls-slot="true"]>*{
  width:192px!important;
  max-width:calc(100% - 12px)!important;
  pointer-events:auto!important;
}
[data-ad-ext-game-layout-cricket-stage="true"]{position:relative!important}
[data-ad-ext-game-layout-cricket-stage="true"]>:has([role="img"][aria-label="Dartboard"]){
  flex:1 1 0%!important;
  min-height:0!important;
  min-width:0!important;
  padding:0!important;
}
[data-ad-ext-game-layout-cricket-stage="true"] [data-ad-ext-game-layout-controls-slot="true"]{
  position:absolute!important;
  right:16px!important;
  bottom:max(var(--safe-area-bottom,0px),12px)!important;
  width:192px!important;
  max-width:calc(100% - 32px)!important;
  padding:0!important;
  margin:0!important;
}
[data-ad-ext-game-layout-cricket-stage="true"] [data-ad-ext-game-layout-controls-slot="true"]>*{
  width:100%!important;
  max-width:100%!important;
}
[data-ad-ext-game-layout-control-bar="true"]{
  opacity:.05!important;
  transition:opacity .2s ease!important;
  width:100%!important;
  max-width:100%!important;
  height:52px!important;
  min-height:52px!important;
  margin:0!important;
  padding:6px 8px!important;
  display:flex!important;
  flex-direction:row!important;
  align-items:center!important;
  justify-content:flex-start!important;
  gap:6px!important;
  border-radius:14px!important;
  box-shadow:0 8px 24px rgba(0,0,0,.3)!important;
}
[data-ad-ext-game-layout-control-bar="true"][data-ad-ext-game-layout-controls-visible="true"]{opacity:1!important}
[data-ad-ext-game-layout-control-bar="true"]>*{width:auto!important;min-width:0!important}
[data-ad-ext-game-layout-control-bar="true"]>:first-child{width:40px!important;flex:0 0 40px!important}
[data-ad-ext-game-layout-control-bar="true"]>:nth-child(2){display:none!important}
[data-ad-ext-game-layout-control-bar="true"]>:last-child{width:auto!important;margin-top:0!important;flex:0 0 auto!important}
[data-ad-ext-game-layout-control-bar="true"] button{
  width:auto!important;
  min-width:40px!important;
  min-height:40px!important;
  height:40px!important;
  justify-content:center!important;
}
[data-ad-ext-game-layout-control-bar="true"] :is([class*="gap-"],[class*="flex"]):has(>button){
  flex-direction:row!important;
  align-items:center!important;
  gap:6px!important;
}
[data-ad-ext-game-layout-player-item="true"]{
  position:absolute!important;
  z-index:10!important;
  left:16px!important;
  top:var(--ad-game-layout-player-y)!important;
  width:var(--ad-game-layout-rail-width)!important;
  height:var(--ad-game-layout-card-height)!important;
  min-height:0!important;
  border:0!important;
}
[data-ad-ext-game-layout-player-item="true"][data-ad-ext-game-layout-transitioning="true"]{
  z-index:20!important;
  will-change:transform!important;
}
[data-ad-ext-game-layout-player-item="true"][data-ad-ext-game-layout-transitioning="true"][data-ad-ext-game-layout-active="true"]{
  z-index:22!important;
}
[data-ad-ext-game-layout-player-item="true"][data-ad-ext-game-layout-visible="false"]{
  visibility:hidden!important;
  pointer-events:none!important;
}
[data-ad-ext-game-layout-player-item="true"]>[class*="rounded"]{height:100%!important;border-radius:16px!important}
[data-ad-ext-game-layout-player-card="true"]{
  width:100%!important;
  height:100%!important;
  min-height:0!important;
  flex:none!important;
  border-radius:16px!important;
}
[data-ad-ext-game-layout-checkout-rail="true"]{display:none!important}
[data-ad-ext-game-layout-player-body="true"]{
  width:100%!important;
  height:100%!important;
  min-height:0!important;
  padding:calc(10px * var(--ad-game-layout-player-scale)) calc(14px * var(--ad-game-layout-player-scale))!important;
  gap:0!important;
}
[data-ad-ext-game-layout-player-content="true"]{
  width:100%!important;
  height:100%!important;
  min-height:0!important;
  display:grid!important;
  grid-template-columns:minmax(0,1fr) minmax(calc(150px * var(--ad-game-layout-player-scale)),max-content) auto!important;
  grid-template-rows:minmax(0,1fr) auto!important;
  align-items:center!important;
  column-gap:calc(10px * var(--ad-game-layout-player-scale))!important;
  row-gap:2px!important;
  flex:none!important;
}
[data-ad-ext-game-layout-player-content="true"]>*{min-width:0!important;margin:0!important}
[data-ad-ext-game-layout-name-region="true"]{
  grid-column:1!important;
  grid-row:1!important;
  justify-self:stretch!important;
  justify-content:flex-start!important;
  align-items:center!important;
  min-height:var(--ad-game-layout-name-height)!important;
  overflow:visible!important;
}
[data-ad-ext-game-layout-name-region="true"][data-ad-ext-game-layout-leg-starter="true"]::before{
  content:"START";
  flex:0 0 auto!important;
  margin-right:calc(8px * var(--ad-game-layout-player-scale))!important;
  padding:calc(3px * var(--ad-game-layout-player-scale)) calc(7px * var(--ad-game-layout-player-scale)) calc(2px * var(--ad-game-layout-player-scale))!important;
  border:1px solid rgba(245,158,11,.72)!important;
  border-radius:999px!important;
  background:rgba(245,158,11,.16)!important;
  color:#fbbf24!important;
  font-family:var(--ad-font-display,inherit)!important;
  font-size:calc(.625rem * var(--ad-game-layout-player-scale))!important;
  font-weight:800!important;
  line-height:1!important;
  letter-spacing:.08em!important;
  text-transform:uppercase!important;
  white-space:nowrap!important;
  pointer-events:none!important;
}
[data-ad-ext-game-layout-name-container="true"]{
  flex:1 1 auto!important;
  width:auto!important;
  min-width:0!important;
  max-width:100%!important;
}
[data-ad-ext-game-layout-name-container="true"]>*{
  width:100%!important;
  max-width:100%!important;
  height:var(--ad-game-layout-name-height)!important;
  min-height:0!important;
  flex:none!important;
  flex-direction:row!important;
}
[data-ad-ext-game-layout-name-container="true"]>*>:first-child:not([data-ad-ext-game-layout-name-plate]),
[data-ad-ext-game-layout-name-plate="true"]>:not(.font-display){
  zoom:var(--ad-game-layout-player-scale);
}
[data-ad-ext-game-layout-name-container="true"]>*>:first-child:not([data-ad-ext-game-layout-name-plate]){
  width:min(42px,calc(var(--ad-game-layout-name-height) / var(--ad-game-layout-player-scale)))!important;
  height:min(42px,calc(var(--ad-game-layout-name-height) / var(--ad-game-layout-player-scale)))!important;
}
[data-ad-ext-game-layout-name-container="true"]>*>:first-child:not([data-ad-ext-game-layout-name-plate])>*{
  width:100%!important;
  height:100%!important;
}
[data-ad-ext-game-layout-name-container="true"] [data-slot="nametag-shape"]{
  height:min(calc(32px * var(--ad-game-layout-player-scale)),var(--ad-game-layout-name-height))!important;
}
[data-ad-ext-game-layout-name-plate="true"]{
  flex:1 1 auto!important;
  width:auto!important;
  min-width:0!important;
  max-width:100%!important;
  height:var(--ad-game-layout-name-height)!important;
  min-height:var(--ad-game-layout-name-height)!important;
  box-sizing:border-box!important;
  align-items:center!important;
  padding-top:0!important;
  padding-bottom:0!important;
}
[data-ad-ext-game-layout-root="true"] [data-ad-ext-game-layout-player-item="true"] [data-ad-ext-game-layout-player-card="true"] [data-ad-ext-game-layout-player-content="true"] [data-ad-ext-game-layout-name-region="true"] .font-display{
  flex:1 1 auto!important;
  min-width:0!important;
  max-width:100%!important;
  height:auto!important;
  line-height:1!important;
  font-size:var(--ad-game-layout-name-font-size,clamp(2rem,calc(var(--ad-game-layout-player-height) * .225),calc(2.25rem * var(--ad-game-layout-player-scale))))!important;
  font-weight:700!important;
  text-align:left!important;
}
[data-ad-ext-game-layout-score-region="true"]{
  display:contents!important;
}
[data-ad-ext-game-layout-score-value="true"]{
  grid-column:2!important;
  grid-row:1 / span 2!important;
  align-self:end!important;
  justify-self:end!important;
  height:var(--ad-game-layout-score-span)!important;
  display:flex!important;
  align-items:flex-end!important;
  justify-content:flex-end!important;
}
[data-ad-ext-game-layout-root="true"] [data-ad-ext-game-layout-player-item="true"] [data-ad-ext-game-layout-player-card="true"] [data-ad-ext-game-layout-player-content="true"] [data-ad-ext-game-layout-score-region="true"] [data-ad-ext-game-layout-score-value="true"].font-number.overflow-hidden{
  --ad-game-layout-score-font-limit:clamp(2rem,calc(var(--ad-game-layout-score-span) / .84),calc(7rem * var(--ad-game-layout-player-scale)));
  font-size:min(var(--ad-ext-theme-remaining-score-font-size,var(--ad-game-layout-score-font-limit)),var(--ad-game-layout-score-font-limit))!important;
  line-height:.84!important;
  overflow:visible!important;
}
[data-ad-ext-game-layout-stat-region]{justify-self:stretch!important;font-size:calc(1rem * var(--ad-game-layout-player-scale))!important}
[data-ad-ext-game-layout-stat-region="0"]>*>span{
  font-size:var(--ad-game-layout-avg-font-size,var(--ad-game-layout-stat-font-size))!important;
  line-height:1!important;
}
[data-ad-ext-game-layout-stat-region="0"]>*{
  line-height:1!important;
}
[data-ad-ext-game-layout-stat-region="1"] svg{
  width:calc(24px * var(--ad-game-layout-player-scale))!important;
}
[data-ad-ext-game-layout-legs="true"]>div{
  width:calc(32px * var(--ad-game-layout-player-scale))!important;
  height:calc(32px * var(--ad-game-layout-player-scale))!important;
}
[data-ad-ext-game-layout-legs="true"] .font-number{
  font-size:calc(1.5rem * var(--ad-game-layout-player-scale))!important;
}
[data-ad-ext-game-layout-stat-region="0"]{
  grid-column:1!important;
  grid-row:2!important;
  align-self:start!important;
  justify-self:stretch!important;
  justify-content:flex-start!important;
  padding-top:min(calc(10px * var(--ad-game-layout-player-scale)),max(0px,calc(var(--ad-game-layout-card-height) - 140px)))!important;
  box-sizing:border-box!important;
}
[data-ad-ext-game-layout-stat-region="1"]{
  grid-column:3!important;
  grid-row:1!important;
  align-self:center!important;
  justify-self:center!important;
}
[data-ad-ext-game-layout-legs="true"]{
  grid-column:3!important;
  grid-row:2!important;
  align-self:end!important;
  justify-self:center!important;
}
[data-ad-ext-game-layout-player-item="true"][data-ad-ext-game-layout-active="false"] [data-ad-ext-game-layout-player-content="true"]{
  filter:grayscale(1)!important;
  opacity:.55!important;
  width:100%!important;
  height:100%!important;
  grid-template-columns:minmax(0,1fr) minmax(calc(110px * var(--ad-game-layout-player-scale)),.35fr) calc(34px * var(--ad-game-layout-player-scale))!important;
  column-gap:calc(6px * var(--ad-game-layout-player-scale))!important;
  row-gap:1px!important;
  transform:none!important;
}
[data-ad-ext-game-layout-player-item="true"][data-ad-ext-game-layout-active="false"] [data-ad-ext-game-layout-player-card="true"][data-ad-ext-x01-remaining-score-bar-stack="modern"]{
  padding-bottom:calc(6px + .45rem + 1px)!important;
}
[data-ad-ext-game-layout-player-item="true"][data-ad-ext-game-layout-active="true"] [data-ad-ext-game-layout-player-card="true"][data-ad-ext-x01-remaining-score-bar-stack="modern"]{
  padding-bottom:calc(28px + .45rem + 1px)!important;
}
[data-ad-ext-game-layout-player-item="true"][data-ad-ext-game-layout-active="false"] [data-ad-ext-game-layout-player-body="true"]{
  padding:calc(6px * var(--ad-game-layout-player-scale)) calc(10px * var(--ad-game-layout-player-scale))!important;
}
[data-ad-ext-game-layout-player-item="true"][data-ad-ext-game-layout-active="false"] [data-ad-ext-game-layout-stat-region="0"]>*{
  text-align:left!important;
}
[data-ad-ext-game-layout-player-item="true"][data-ad-ext-game-layout-active="false"] [data-ad-ext-game-layout-name-region="true"]{
  zoom:.84;
}
[data-ad-ext-game-layout-player-item="true"][data-ad-ext-game-layout-active="false"] [data-ad-ext-game-layout-stat-region="0"],
[data-ad-ext-game-layout-player-item="true"][data-ad-ext-game-layout-active="false"] [data-ad-ext-game-layout-stat-region="1"],
[data-ad-ext-game-layout-player-item="true"][data-ad-ext-game-layout-active="false"] [data-ad-ext-game-layout-legs="true"]{
  zoom:.6;
}
`;
}
