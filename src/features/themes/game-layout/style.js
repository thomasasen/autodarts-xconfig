export const STYLE_ID = "ad-ext-theme-game-layout-style";

export function buildThemeGameLayoutStyleText() {
  return `
[data-ad-ext-game-layout-root="true"]{
  --ad-game-layout-rail-width:420px;
  --ad-game-layout-player-height:112px;
  --ad-game-layout-card-height:var(--ad-game-layout-player-height);
  --ad-game-layout-player-gap:10px;
  --ad-game-layout-turn-height:128px;
  --ad-game-layout-score-span:calc(var(--ad-game-layout-player-height) * .55);
  position:relative!important;
  display:grid!important;
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
  padding:32px 0 0!important;
  box-sizing:border-box!important;
  overflow:hidden!important;
}
[data-ad-ext-game-layout-variant="true"]{
  left:16px!important;
  top:16px!important;
  width:var(--ad-game-layout-rail-width)!important;
  max-width:var(--ad-game-layout-rail-width)!important;
  min-height:22px!important;
  justify-content:flex-start!important;
  overflow:hidden!important;
}
[data-ad-ext-game-layout-turn-slot="true"]>*{
  width:100%!important;
  height:100%!important;
  padding:8px 0!important;
}
[data-ad-ext-game-layout-turn-slot="true"] .bg-surface-surface{
  width:100%!important;
  height:100%!important;
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
  justify-self:end!important;
  align-self:center!important;
}
[data-ad-ext-game-layout-controls-slot="true"]{
  grid-column:2!important;
  grid-row:1 / span 2!important;
  z-index:40!important;
  width:192px!important;
  max-width:calc(100% - 24px)!important;
  min-width:0!important;
  height:auto!important;
  padding:0!important;
  margin:0 12px 12px 0!important;
  display:block!important;
  justify-self:end!important;
  align-self:end!important;
  overflow:visible!important;
  pointer-events:none!important;
}
[data-ad-ext-game-layout-controls-slot="true"]>*{
  width:100%!important;
  max-width:100%!important;
  pointer-events:auto!important;
}
[data-ad-ext-game-layout-control-bar="true"]{
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
  padding:10px 14px!important;
  gap:0!important;
}
[data-ad-ext-game-layout-player-content="true"]{
  width:100%!important;
  height:100%!important;
  min-height:0!important;
  display:grid!important;
  grid-template-columns:minmax(0,1fr) minmax(150px,.5fr) auto!important;
  grid-template-rows:auto 1fr!important;
  align-items:center!important;
  column-gap:10px!important;
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
}
[data-ad-ext-game-layout-root="true"] [data-ad-ext-game-layout-player-item="true"] [data-ad-ext-game-layout-player-card="true"] [data-ad-ext-game-layout-player-content="true"] [data-ad-ext-game-layout-name-region="true"] .font-display{
  max-width:100%!important;
  font-size:clamp(2rem,calc(var(--ad-game-layout-player-height) * .225),2.25rem)!important;
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
  font-size:clamp(4rem,calc(var(--ad-game-layout-score-span) / .84),7rem)!important;
  line-height:.84!important;
}
[data-ad-ext-game-layout-stat-region]{justify-self:stretch!important;font-size:clamp(.78rem,3.1cqw,1rem)!important}
[data-ad-ext-game-layout-stat-region="0"]{
  grid-column:1!important;
  grid-row:2!important;
  align-self:start!important;
  justify-self:stretch!important;
  justify-content:flex-start!important;
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
  grid-template-columns:minmax(0,1fr) minmax(110px,.35fr) 34px!important;
  column-gap:6px!important;
  row-gap:1px!important;
  transform:none!important;
}
[data-ad-ext-game-layout-player-item="true"][data-ad-ext-game-layout-active="false"] [data-ad-ext-game-layout-player-card="true"][data-ad-ext-x01-remaining-score-bar-stack="modern"]{
  padding-bottom:calc(16.8px + .6rem)!important;
}
[data-ad-ext-game-layout-player-item="true"][data-ad-ext-game-layout-active="false"] [data-ad-ext-game-layout-player-body="true"]{
  padding:6px 10px!important;
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
