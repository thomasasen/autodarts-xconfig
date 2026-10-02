export const STYLE_ID = "ad-ext-cricket-layout-style";

export function buildCricketLayoutStyleText() {
  return `
[data-ad-cricket-layout-stage="true"]{display:grid!important;grid-template-columns:minmax(0,var(--ad-cricket-table-share)) minmax(0,1fr)!important;min-height:0!important;min-width:0!important}
[data-ad-cricket-layout-panel]{min-width:0!important;min-height:0!important}
[data-ad-cricket-layout-panel="table"]{grid-column:1!important}
[data-ad-cricket-layout-panel="board"]{grid-column:2!important}
main .grid[data-ad-cricket-layout="true"]{grid-template-columns:var(--ad-cricket-label-width) repeat(var(--ad-cricket-players),minmax(0,1fr))!important;grid-template-rows:var(--ad-cricket-header-height) repeat(var(--ad-cricket-targets),minmax(0,1fr))!important;gap:var(--ad-cricket-gap)!important;min-height:0!important;min-width:0!important}
main .grid[data-ad-cricket-layout="true"]>[data-ad-cricket-layout-node]{grid-row:var(--ad-cricket-row)!important;grid-column:var(--ad-cricket-column)!important;min-height:0!important;min-width:0!important}
main .grid[data-ad-cricket-layout="true"]>[data-ad-cricket-layout-node="label"]{font-size:var(--ad-cricket-target-size)!important;line-height:1!important;padding:0!important}
main .grid[data-ad-cricket-layout="true"]>[data-ad-cricket-layout-node="cell"]{padding:0!important;position:relative}
main .grid[data-ad-cricket-layout="true"]>[data-ad-cricket-layout-node="cell"]>:is(img,svg,.size-8){max-width:100%!important;max-height:100%!important;object-fit:contain}
main .grid[data-ad-cricket-layout="true"][data-ad-cricket-mark-size]:not([data-ad-cricket-mark-size="original"])>[data-ad-cricket-layout-node="cell"]:is(div,section)>:is(img,svg,.size-8){width:var(--ad-cricket-mark-size)!important;height:var(--ad-cricket-mark-size)!important;max-width:100%!important;max-height:100%!important;object-fit:contain}
main .grid[data-ad-cricket-layout="true"]>[data-ad-cricket-layout-node="header"]{gap:4px!important;padding:4px!important;justify-content:center!important}
main .grid[data-ad-cricket-layout="true"] [data-ad-cricket-name="true"]{font-size:var(--ad-cricket-name-size)!important;line-height:1.15!important;max-width:100%!important;min-height:calc(var(--ad-cricket-name-size) * var(--ad-cricket-name-lines) * 1.15);overflow:hidden!important;overflow-wrap:anywhere}
main .grid[data-ad-cricket-layout="true"] [data-ad-cricket-nameplate="true"],
main .grid[data-ad-cricket-layout="true"] [data-ad-cricket-nameplate-shape="true"]{height:var(--ad-cricket-nameplate-height)!important;min-height:var(--ad-cricket-nameplate-height)!important}
main .grid[data-ad-cricket-layout="true"][data-ad-cricket-names="single"] [data-ad-cricket-name="true"]{white-space:nowrap!important;text-overflow:ellipsis}
main .grid[data-ad-cricket-layout="true"][data-ad-cricket-names="two-lines"] [data-ad-cricket-name="true"]{white-space:normal!important;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2}
main .grid[data-ad-cricket-layout="true"] [data-ad-cricket-score="true"]{font-size:var(--ad-cricket-score-size)!important;line-height:1!important}
main .grid[data-ad-cricket-layout="true"][data-ad-cricket-mpr="subtle"] [data-ad-cricket-mpr-value="true"]{opacity:.75;font-size:.8em}
main .grid[data-ad-cricket-layout="true"][data-ad-cricket-mpr="off"] [data-ad-cricket-mpr-value="true"]{display:none!important}
main .grid[data-ad-cricket-layout="true"]>[data-ad-cricket-layout-node="header"][data-ad-cricket-active="true"]{outline:2px solid var(--ad-ext-theme-accent-color,#f5f5f5);outline-offset:-2px}
main .grid[data-ad-cricket-layout="true"][data-ad-cricket-indicator="line"]>[data-ad-cricket-layout-node="cell"][data-ad-cricket-active="true"]{border-inline-start:2px solid var(--ad-ext-theme-accent-color,#f5f5f5)!important}
main .grid[data-ad-cricket-layout="true"][data-ad-cricket-indicator="tint"]>[data-ad-cricket-layout-node="cell"][data-ad-cricket-active="true"]{background-image:linear-gradient(rgba(255,255,255,.055),rgba(255,255,255,.055))}
`;
}
