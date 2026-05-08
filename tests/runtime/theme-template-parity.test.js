import test from "node:test";
import assert from "node:assert/strict";

import {
  PREVIEW_PLACEMENT as PREVIEW_X01,
  buildX01ThemeCss,
} from "../../src/features/themes/x01/style.js";
import {
  PREVIEW_PLACEMENT as PREVIEW_GOTCHA,
  buildGotchaThemeCss,
} from "../../src/features/themes/gotcha/style.js";
import {
  PREVIEW_PLACEMENT as PREVIEW_X01_TWO_PLAYER,
  buildX01TwoPlayerThemeCss,
} from "../../src/features/themes/x01-2player/style.js";
import {
  PREVIEW_PLACEMENT as PREVIEW_SHANGHAI,
  buildShanghaiThemeCss,
} from "../../src/features/themes/shanghai/style.js";
import {
  PREVIEW_PLACEMENT as PREVIEW_BERMUDA,
  buildBermudaThemeCss,
} from "../../src/features/themes/bermuda/style.js";
import {
  PREVIEW_PLACEMENT as PREVIEW_BULL_OFF,
  buildBullOffThemeCss,
} from "../../src/features/themes/bull-off/style.js";
import { commonLayoutCss, commonThemeCss } from "../../src/features/themes/shared/common-css.js";
import { buildSharedPlayerDisplayCss } from "../../src/features/themes/shared/player-card-layout.js";
import {
  buildThemeVisualSettingsCss,
  resolveThemeVisualSettingsConfig,
} from "../../src/features/themes/shared/theme-visuals.js";

function assertNoFragileLayoutSelectors(cssText) {
  assert.doesNotMatch(cssText, /\[data-ad-theme-slot=/);
  assert.doesNotMatch(cssText, /\[data-ad-theme-layout-root=/);
  assert.doesNotMatch(cssText, /:has\(/);
}

test("x01 theme keeps oldrepo preview and stat scaling anchors", () => {
  const css = buildX01ThemeCss({ showAvg: true });

  assert.equal(PREVIEW_X01.mode, "under-throws");
  assert.equal(PREVIEW_X01.activationMode, "autodarts-tools-zoom");
  assert.match(css, /ad-ext-turn-preview-space/);
  assert.match(css, /--ad-ext-stat-scale:\s*1\.2/);
  assert.match(
    css,
    /#ad-ext-player-display\s*>\s*\*\s*\{[^}]*flex:\s*1\s+1\s+0\s*!important;[^}]*display:\s*flex\s*!important;[^}]*align-items:\s*stretch\s*!important;/s
  );
  assert.match(
    css,
    /@supports\s*\(display:\s*contents\)\s*\{[^}]*#ad-ext-player-display\s*>\s*\*\s*\{[^}]*display:\s*contents\s*!important;/s
  );
  assert.match(
    css,
    /#ad-ext-player-display\s+\.ad-ext-player\s*\{[^}]*--ad-ext-player-score-max:\s*4\.8rem;[^}]*--ad-ext-player-score-size:\s*clamp\(4rem,\s*8vw,\s*var\(--ad-ext-player-score-max\)\);[^}]*flex:\s*var\(--ad-ext-player-flex\)\s+1\s+0\s*!important;[^}]*min-height:\s*clamp\(7\.25rem,\s*20cqb,\s*11rem\)\s*!important;[^}]*container-type:\s*size\s*!important;[^}]*container-name:\s*ad-ext-player-card\s*!important;/s
  );
  assert.match(
    css,
    /@supports\s*\(font-size:\s*1cqi\)\s*\{[^}]*#ad-ext-player-display\s+\.ad-ext-player\.ad-ext-player-active,\s*#ad-ext-player-display\s+\.ad-ext-player\.ad-ext-player-winner\{[^}]*min\(25\.6cqi,\s*44\.8cqb\)/s
  );
  assert.match(
    css,
    /#ad-ext-player-display\s+\.ad-ext-player\.ad-ext-player-active,\s*#ad-ext-player-display\s+\.ad-ext-player\.ad-ext-player-winner\{[^}]*min-height:\s*clamp\(12rem,\s*42cqb,\s*24rem\)\s*!important;/s
  );
  assert.match(
    css,
    /ad-ext-avg-trend-arrow\.ad-ext-avg-trend-up\s*\{[^}]*border-bottom:\s*calc\(var\(--ad-ext-avg-trend-arrow-height-base,\s*23px\)\s*\*\s*var\(--ad-ext-stat-scale\)\)\s*solid\s*#9fdb58;/s
  );
  assert.match(
    css,
    /#ad-ext-player-display\s+\.ad-ext-player\.ad-ext-player-active\s*>\s*\.chakra-stack,\s*#ad-ext-player-display\s+\.ad-ext-player\.ad-ext-player-winner\s*>\s*\.chakra-stack\s*\{[^}]*grid-template-rows:\s*max-content max-content\s*!important;[^}]*align-content:\s*center\s*!important;/s
  );
  assert.match(
    css,
    /#ad-ext-player-display\s+\.ad-ext-player\s*>\s*\.chakra-stack\s*\{[^}]*display:\s*grid\s*!important;[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s*max-content\s*!important;[^}]*gap:\s*0px\s*!important;[^}]*min-width:\s*0\s*!important;/s
  );
  assert.match(
    css,
    /#ad-ext-player-display\s+\.ad-ext-player\s*>\s*\.chakra-stack\s*>\s*\.chakra-stack\s*\{[^}]*min-width:\s*0\s*!important;[^}]*max-width:\s*100%\s*!important;[^}]*overflow:\s*hidden\s*!important;/s
  );
  assert.match(
    css,
    /#ad-ext-player-display\s+\.ad-ext-player\s+\.ad-ext-player-name,\s*#ad-ext-player-display\s+\.ad-ext-player\s+\.ad-ext-player-name\s*>\s*p\s*\{[^}]*min-width:\s*0\s*!important;[^}]*overflow:\s*hidden\s*!important;[^}]*text-overflow:\s*ellipsis\s*!important;[^}]*white-space:\s*nowrap\s*!important;/s
  );
  assert.match(
    css,
    /#ad-ext-player-display\s+\.ad-ext-player\s+\.ad-ext-player-score\s*\{[^}]*justify-self:\s*end\s*!important;[^}]*min-width:\s*max-content\s*!important;[^}]*white-space:\s*nowrap\s*!important;/s
  );
  assert.match(
    css,
    /#ad-ext-player-display,\s*#ad-ext-turn\s*\{[^}]*position:\s*relative\s*!important;[^}]*z-index:\s*7\s*!important;/s
  );
  assert.match(
    css,
    /#ad-ext-turn\s*\{[^}]*pointer-events:\s*none\s*!important;/s
  );
  assert.match(
    css,
    /#ad-ext-turn\s*>\s*\*\s*\{[^}]*pointer-events:\s*auto\s*!important;/s
  );
  assert.match(
    css,
    /#ad-ext-player-display\s+\.ad-ext-player\.ad-ext-player-active,\s*#ad-ext-player-display\s+\.ad-ext-player\.ad-ext-player-winner\s*\{[^}]*border:\s*2px\s+solid\s+var\(--ad-ext-theme-card-active-border-color\)\s*!important;[^}]*border-radius:\s*12px\s*!important;[^}]*box-shadow:\s*0\s+0\s+0\s+1px\s+var\(--ad-ext-theme-card-active-outline-color\)\s*!important;/s
  );
  assert.doesNotMatch(css, /\.css-hjw8x4\s*\{[^}]*max-height:\s*12%/s);
  assert.doesNotMatch(css, /css-y3hfdd\s*\{[^}]*height:\s*25%/s);
  assertNoFragileLayoutSelectors(css);
});

test("gotcha theme keeps x01 preview contracts and styles the live delta host semantically", () => {
  const css = buildGotchaThemeCss({});
  const leftAlignedCss = buildGotchaThemeCss({
    deltaAlignment: "left",
    deltaItalic: false,
  });
  const inlineCss = buildGotchaThemeCss({
    deltaPlacement: "inline-divider",
  });
  const inlineLeftCss = buildGotchaThemeCss({
    deltaPlacement: "inline-divider",
    deltaAlignment: "left",
  });

  assert.equal(PREVIEW_GOTCHA.mode, PREVIEW_X01.mode);
  assert.equal(PREVIEW_GOTCHA.activationMode, PREVIEW_X01.activationMode);
  assert.match(css, /autodarts-tools-gotcha\{[^}]*grid-column:2\s*!important;[^}]*grid-row:2\s*!important;[^}]*justify-self:end\s*!important;[^}]*font-style:italic\s*!important;[^}]*opacity:0\.65\s*!important;[^}]*font-variant-numeric:tabular-nums\s*!important;[^}]*white-space:nowrap\s*!important;/s);
  assert.match(css, /#ad-ext-player-display\s+\.ad-ext-player\s+\.ad-ext-player-score\{[^}]*grid-column:2\s*!important;[^}]*grid-row:1 \/ 2\s*!important;/s);
  assert.match(css, /#ad-ext-player-display\s+\.ad-ext-player\s*>\s*\.chakra-stack\{[^}]*grid-template-rows:max-content max-content\s*!important;/s);
  assert.match(css, /ad-ext-player-active\s+autodarts-tools-gotcha,\s*#ad-ext-player-display\s+\.ad-ext-player\.ad-ext-player-winner\s+autodarts-tools-gotcha\{[^}]*--chakra-colors-chakra-body-text:var\(--ad-ext-theme-score-active-color\);/s);
  assert.match(leftAlignedCss, /autodarts-tools-gotcha\{[^}]*justify-self:start\s*!important;[^}]*font-style:normal\s*!important;[^}]*text-align:left\s*!important;/s);
  assert.match(inlineCss, /autodarts-tools-gotcha\{[^}]*display:inline-flex\s*!important;[^}]*grid-column:3\s*!important;[^}]*grid-row:1\s*!important;[^}]*justify-self:start\s*!important;[^}]*align-self:center\s*!important;[^}]*font-size:clamp\(1rem,2\.25vw,1\.24rem\)\s*!important;[^}]*line-height:0\.94\s*!important;[^}]*opacity:0\.70\s*!important;[^}]*white-space:nowrap\s*!important;[^}]*align-items:center\s*!important;/s);
  assert.match(inlineCss, /#ad-ext-player-display\s+\.ad-ext-player\s+\.ad-ext-player-score\{[^}]*grid-column:2\s*!important;[^}]*grid-row:1 \/ 2\s*!important;[^}]*align-self:end\s*!important;[^}]*white-space:nowrap\s*!important;/s);
  assert.match(inlineCss, /#ad-ext-player-display\s+\.ad-ext-player\s*>\s*\.chakra-stack\{[^}]*grid-template-columns:minmax\(0,\s*1fr\)\s*max-content\s*max-content\s*!important;[^}]*grid-template-rows:max-content max-content max-content\s*!important;[^}]*align-items:start\s*!important;[^}]*align-content:center\s*!important;[^}]*column-gap:clamp\(0\.36rem,0\.8vw,0\.6rem\)\s*!important;[^}]*row-gap:clamp\(0\.08rem,0\.18vh,0\.16rem\)\s*!important;/s);
  assert.match(inlineCss, /#ad-ext-player-display\s+\.ad-ext-player\s*>\s*\.chakra-stack\s*>\s*\.css-37hv00\{[^}]*grid-column:1 \/ 2\s*!important;[^}]*grid-row:1 \/ 2\s*!important;[^}]*align-self:end\s*!important;[^}]*min-width:0\s*!important;/s);
  assert.match(inlineCss, /#ad-ext-player-display\s+\.ad-ext-player\s*>\s*\.chakra-stack\s*>\s*\.css-1igwmid\{[^}]*grid-column:1 \/ 2\s*!important;[^}]*grid-row:2 \/ 3\s*!important;[^}]*align-self:start\s*!important;[^}]*min-width:0\s*!important;[^}]*padding-left:0\s*!important;[^}]*margin-top:0\s*!important;/s);
  assert.match(inlineCss, /#ad-ext-player-display\s+\.ad-ext-player\s*>\s*\.chakra-stack\s*>\s*\[data-ad-ext-x01-score-progress='true'\],\s*#ad-ext-player-display\s+\.ad-ext-player\s*>\s*\.chakra-stack\s*>\s*\.ad-ext-x01-score-progress--active,\s*#ad-ext-player-display\s+\.ad-ext-player\s*>\s*\.chakra-stack\s*>\s*\.ad-ext-x01-score-progress--inactive\{[^}]*grid-column:1 \/ -1\s*!important;[^}]*grid-row:3 \/ 4\s*!important;[^}]*align-self:start\s*!important;/s);
  assert.match(inlineCss, /autodarts-tools-gotcha::before\{[^}]*content:"\|"\s*!important;[^}]*opacity:0\.56\s*!important;/s);
  assert.match(inlineLeftCss, /autodarts-tools-gotcha\{[^}]*grid-column:2\s*!important;[^}]*grid-row:1\s*!important;[^}]*text-align:right\s*!important;/s);
  assert.match(inlineLeftCss, /#ad-ext-player-display\s+\.ad-ext-player\s+\.ad-ext-player-score\{[^}]*grid-column:3\s*!important;[^}]*grid-row:1 \/ 2\s*!important;/s);
  assert.match(inlineLeftCss, /autodarts-tools-gotcha::after\{[^}]*content:"\|"\s*!important;[^}]*opacity:0\.56\s*!important;/s);
  assertNoFragileLayoutSelectors(css);
});

test("x01 2player theme keeps stable board-first contracts without fragile layout selectors", () => {
  const css = buildX01TwoPlayerThemeCss({ showAvg: true });

  assert.equal(PREVIEW_X01_TWO_PLAYER.mode, "under-throws");
  assert.equal(PREVIEW_X01_TWO_PLAYER.activationMode, "autodarts-tools-zoom");
  assert.match(css, /ad-ext-turn-preview-space/);
  assert.match(
    css,
    /--ad-ext-x01-2player-column-gap:clamp\(0\.9rem,\s*1\.6vw,\s*1\.4rem\);[^}]*--ad-ext-x01-2player-center-min-width:48rem;[^}]*--ad-ext-x01-2player-side-width:clamp\(\s*17rem,\s*22vw,\s*min\(\s*23\.5rem,\s*calc\(\s*\(100vw - var\(--ad-ext-x01-2player-center-min-width\) - \(2 \* var\(--ad-ext-x01-2player-column-gap\)\)\)\s*\/ 2\s*\)\s*\)\s*\);[^}]*--ad-ext-x01-2player-live-turn-height:var\(--ad-ext-x01-2player-turn-height\);[^}]*--ad-ext-x01-2player-throw-points-size:clamp\(1\.2rem,\s*1\.8vw,\s*1\.65rem\);[^}]*--ad-ext-x01-2player-live-throw-points-size:var\(--ad-ext-x01-2player-throw-points-size\);[^}]*--ad-ext-x01-2player-turn-clearance:clamp\(0\.85rem,\s*1\.25vh,\s*1\.15rem\);[^}]*--ad-ext-x01-2player-controls-height:clamp\(1\.95rem,\s*3\.2vh,\s*2\.3rem\);[^}]*--ad-ext-x01-2player-board-gap:clamp\(0\.32rem,\s*0\.6vh,\s*0\.52rem\);[^}]*--ad-ext-x01-2player-board-top-pad:calc\(\s*var\(--ad-ext-x01-2player-live-turn-height\)\s*\+\s*var\(--ad-ext-x01-2player-turn-clearance\)\s*\+\s*var\(--ad-ext-x01-2player-controls-height\)\s*\+\s*var\(--ad-ext-x01-2player-board-gap\)\s*\);/s
  );
  assert.match(css, /--theme-player-badge-bg:transparent;[^}]*--theme-player-name-bg:transparent;[^}]*--theme-current-bg:transparent;/s);
  assert.match(
    css,
    /#ad-ext-player-display\s+\.ad-ext-player\s*\{[^}]*--ad-ext-x01-2player-score-size:clamp\(5\.6rem,\s*min\(43cqi,\s*17cqb,\s*14\.2vh\),\s*10\.4rem\);[^}]*--ad-ext-x01-2player-score-scale:1;[^}]*--ad-ext-x01-2player-table-font-size:clamp\(0\.92rem,\s*min\(3\.8cqi,\s*1\.72cqb,\s*1\.85vh\),\s*1\.08rem\);[^}]*--ad-ext-x01-2player-table-cell-font-size:clamp\(2rem,\s*min\(8\.4cqi,\s*5\.2cqb,\s*5\.4vh\),\s*2\.75rem\);[^}]*--ad-ext-x01-2player-stack-gap:clamp\(0\.22rem,\s*0\.48vh,\s*0\.4rem\);[^}]*--ad-ext-x01-2player-round-font-size:min\(calc\(var\(--ad-ext-x01-2player-round-size\) \* 0\.72\),\s*1\.55rem\);[^}]*--ad-ext-x01-2player-header-meta-pad-block-end:clamp\(0\.08rem,\s*0\.22vh,\s*0\.16rem\);[^}]*--ad-ext-x01-2player-score-min-block-size:calc\(var\(--ad-ext-x01-2player-score-size\)\s*\*\s*var\(--ad-ext-x01-2player-score-scale\)\s*\*\s*0\.76\);[^}]*--ad-ext-x01-2player-progress-min-block-size:calc\(clamp\(1\.08rem,\s*1\.9vw,\s*1\.4rem\) \+ var\(--ad-ext-x01-2player-progress-pad-block-start\)\);/s
  );
  assert.match(
    css,
    /#ad-ext-player-display\s*>\s*\[data-ad-ext-x01-2player-player-wrapper="true"\]\s*\{[^}]*display:flex\s*!important;[^}]*pointer-events:auto\s*!important;/s
  );
  assert.match(
    css,
    /#ad-ext-player-display\s*>\s*\[data-ad-ext-x01-2player-player-index="0"\]\s*\{[^}]*grid-column:1\s*!important;/s
  );
  assert.match(
    css,
    /#ad-ext-player-display\s*>\s*\[data-ad-ext-x01-2player-player-index="1"\]\s*\{[^}]*grid-column:3\s*!important;/s
  );
  assert.match(
    css,
    /\.ad-ext-theme-content-board\{[^}]*grid-column:2\s*!important;[^}]*grid-row:1 \/ -1\s*!important;[^}]*pointer-events:none\s*!important;/s
  );
  assert.match(
    css,
    /\.ad-ext-theme-content-board\s*>\s*\*\{[^}]*pointer-events:auto\s*!important;/s
  );
  assert.match(
    css,
    /\[data-ad-ext-x01-2player-stack="true"\]\{[^}]*grid-template-columns:var\(--ad-ext-x01-2player-round-size\) minmax\(0,\s*1fr\)\s*!important;[^}]*grid-template-rows:minmax\(var\(--ad-ext-x01-2player-round-size\),\s*max-content\) max-content minmax\(var\(--ad-ext-x01-2player-score-min-block-size\),\s*max-content\) max-content\s*!important;[^}]*column-gap:clamp\(0\.5rem,\s*2\.4cqi,\s*0\.75rem\)\s*!important;[^}]*isolation:isolate\s*!important;/s
  );
  assert.match(
    css,
    /Final slot-order guard:[\s\S]*?grid-template-rows:minmax\(var\(--ad-ext-x01-2player-round-size\),\s*max-content\) max-content minmax\(var\(--ad-ext-x01-2player-score-min-block-size\),\s*max-content\) max-content\s*!important;[\s\S]*?grid-template-areas:\s*"rounds meta"\s*"identity identity"\s*"score score"\s*"progress progress"\s*!important;/s
  );
  assert.match(
    css,
    /\[data-ad-ext-x01-2player-stack="true"\]\s*>\s*\.css-1igwmid:not\(\[data-ad-ext-x01-2player-slot\]\)\{[^}]*grid-column:2\s*!important;[^}]*grid-row:1\s*!important;[^}]*display:flex\s*!important;[^}]*justify-content:flex-end\s*!important;[^}]*text-align:right\s*!important;[^}]*min-height:var\(--ad-ext-x01-2player-round-size\)\s*!important;[^}]*background:transparent\s*!important;/s
  );
  assert.match(
    css,
    /\[data-ad-ext-x01-2player-slot="identity"\]\{[^}]*grid-column:1 \/ -1\s*!important;[^}]*grid-row:2\s*!important;[^}]*display:block\s*!important;[^}]*padding:0\s*!important;[^}]*overflow:visible\s*!important;[^}]*background:transparent\s*!important;/s
  );
  assert.match(
    css,
    /#ad-ext-player-display\s+\.ad-ext-player\s+\.ad-ext-player-name,\s*#ad-ext-player-display\s+\.ad-ext-player\s+\.ad-ext-player-name\s*>\s*p\{[^}]*display:block\s*!important;[^}]*font-size:var\(--ad-ext-x01-2player-player-name-font-size\)\s*!important;[^}]*line-height:0\.95\s*!important;[^}]*font-weight:800\s*!important;[^}]*letter-spacing:0\s*!important;[^}]*text-align:center\s*!important;/s
  );
  assert.match(
    css,
    /#ad-ext-player-display\s+\.ad-ext-player\s+\.ad-ext-player-name\s*>\s*p,\s*#ad-ext-player-display\s+\.ad-ext-player\s+\.chakra-text\.css-11cuipc\{[^}]*display:inline-block\s*!important;[^}]*width:auto\s*!important;[^}]*white-space:nowrap\s*!important;[^}]*overflow:visible\s*!important;[^}]*text-overflow:clip\s*!important;/s
  );
  assert.match(
    css,
    /#ad-ext-player-display\s+\.ad-ext-player\s+\.css-g0ywsj,\s*#ad-ext-player-display\s+\.ad-ext-player\s+\.css-g0ywsj\s*>\s*p\{[^}]*display:block\s*!important;[^}]*min-width:0\s*!important;[^}]*width:100%\s*!important;[^}]*align-self:center\s*!important;/s
  );
  assert.match(
    css,
    /#ad-ext-player-display\s+\.ad-ext-player\s+\.chakra-text\.css-11cuipc\{[^}]*font-size:inherit\s*!important;[^}]*line-height:inherit\s*!important;[^}]*text-transform:inherit\s*!important;[^}]*text-align:inherit\s*!important;/s
  );
  assert.match(
    css,
    /#ad-ext-player-display\s+\.ad-ext-player\s+\.css-1k3nd6z\s*>\s*span\.css-3fr5p8,\s*#ad-ext-player-display\s+\.ad-ext-player\s+\.css-1k3nd6z\s*>\s*\.css-3fr5p8\{[^}]*display:flex\s*!important;[^}]*justify-content:center\s*!important;[^}]*width:var\(--ad-ext-x01-2player-round-size\)\s*!important;[^}]*height:var\(--ad-ext-x01-2player-round-size\)\s*!important;[^}]*background:#8fe28d\s*!important;[^}]*background-image:linear-gradient\(180deg,\s*#a8ef7d 0%,\s*#87dc62 100%\)\s*!important;[^}]*visibility:visible\s*!important;/s
  );
  assert.match(
    css,
    /#ad-ext-player-display\s+\.ad-ext-player\s+\.css-3fr5p8\{[^}]*display:inline-grid\s*!important;[^}]*inline-size:var\(--ad-ext-x01-2player-round-size\)\s*!important;[^}]*block-size:var\(--ad-ext-x01-2player-round-size\)\s*!important;[^}]*aspect-ratio:1 \/ 1\s*!important;[^}]*background:linear-gradient\(180deg,\s*#a8ef7d 0%,\s*#87dc62 100%\)\s*!important;[^}]*background-color:#8fe28d\s*!important;[^}]*color:#142112\s*!important;/s
  );
  assert.match(
    css,
    /#ad-ext-player-display\s+\.ad-ext-player\s+\.css-3fr5p8\s*>\s*p\{[^}]*font-size:var\(--ad-ext-x01-2player-round-font-size\)\s*!important;[^}]*line-height:1\s*!important;[^}]*font-weight:800\s*!important;[^}]*color:inherit\s*!important;/s
  );
  assert.match(
    css,
    /\[data-ad-ext-x01-2player-slot="identity"\]\s*>\s*:last-child\s*>\s*span\s*>\s*:first-child\{[^}]*display:none\s*!important;/s
  );
  assert.match(
    css,
    /\[data-ad-ext-x01-2player-slot="identity"\]\s*>\s*:last-child\s*>\s*span\s*>\s*:last-child\{[^}]*display:block\s*!important;[^}]*width:100%\s*!important;[^}]*row-gap:0\s*!important;/s
  );
  assert.match(
    css,
    /\[data-ad-ext-x01-2player-slot="identity"\]\s*>\s*:last-child\s*>\s*span\s*>\s*:last-child\s*>\s*\.ad-ext-player-name,\s*#ad-ext-player-display\s+\.ad-ext-player\s*>\s*\[data-ad-ext-x01-2player-stack="true"\]\s*>\s*\[data-ad-ext-x01-2player-slot="identity"\]\s*>\s*:last-child\s*>\s*span\s*>\s*:last-child\s*>\s*\.css-g0ywsj\{[^}]*grid-column:1\s*!important;[^}]*justify-self:stretch\s*!important;/s
  );
  assert.match(
    css,
    /\[data-ad-ext-x01-2player-slot="identity"\]\s*>\s*:last-child\s*>\s*span\s*>\s*:last-child\s*>\s*\.chakra-badge,\s*#ad-ext-player-display\s+\.ad-ext-player\s*>\s*\[data-ad-ext-x01-2player-stack="true"\]\s*>\s*\[data-ad-ext-x01-2player-slot="identity"\]\s*>\s*:last-child\s*>\s*span\s*>\s*:last-child\s*>\s*\.css-n2903v,\s*#ad-ext-player-display\s+\.ad-ext-player\s*>\s*\[data-ad-ext-x01-2player-stack="true"\]\s*>\s*\[data-ad-ext-x01-2player-slot="identity"\]\s*>\s*:last-child\s*>\s*span\s*>\s*:last-child\s*>\s*\.css-3fr5p8\{[^}]*display:none\s*!important;/s
  );
  assert.match(
    css,
    /\[data-ad-ext-x01-2player-slot="score"\],\s*#ad-ext-player-display\s+\.ad-ext-player\s*>\s*\[data-ad-ext-x01-2player-stack="true"\]\s*>\s*\[data-ad-ext-x01-2player-slot="score"\]\s*>\s*p\{[^}]*grid-row:3\s*!important;[^}]*display:grid\s*!important;[^}]*min-block-size:var\(--ad-ext-x01-2player-score-min-block-size\)\s*!important;[^}]*padding-block:var\(--ad-ext-x01-2player-score-pad-block\)\s*!important;[^}]*font-size:calc\(var\(--ad-ext-x01-2player-score-size\)\s*\*\s*var\(--ad-ext-x01-2player-score-scale\)\)\s*!important;[^}]*text-align:center\s*!important;/s
  );
  assert.match(
    css,
    /\[data-ad-ext-x01-2player-slot="progress"\]\{[^}]*grid-row:4\s*!important;[^}]*min-block-size:var\(--ad-ext-x01-2player-progress-min-block-size\)\s*!important;[^}]*padding-block-start:var\(--ad-ext-x01-2player-progress-pad-block-start\)\s*!important;[^}]*margin-top:var\(--ad-ext-x01-2player-progress-gap\)\s*!important;/s
  );
  assert.match(
    css,
    /\[data-ad-ext-x01-2player-slot="progress"\]\[data-ad-ext-x01-score-progress-size="breit"\]\{[^}]*--ad-ext-x01-2player-progress-min-block-size:calc\(clamp\(1\.08rem,\s*1\.9vw,\s*1\.4rem\) \+ var\(--ad-ext-x01-2player-progress-pad-block-start\)\);/s
  );
  assert.match(
    css,
    /\.ad-ext-player\.ad-ext-player-inactive\s*>\s*\.chakra-stack\[data-ad-ext-x01-score-progress-stack="true"\]\[data-ad-ext-x01-2player-stack="true"\],[^}]*\.ad-ext-player:not\(\.ad-ext-player-active\):not\(\.ad-ext-player-winner\)\s*>\s*\.chakra-stack\[data-ad-ext-x01-score-progress-stack="true"\]\[data-ad-ext-x01-2player-stack="true"\]\{[^}]*min-height:max-content\s*!important;[^}]*height:auto\s*!important;[^}]*padding:0\s*!important;/s
  );
  assert.match(
    css,
    /\.ad-ext-player\.ad-ext-player-inactive\s*>\s*\.chakra-stack\[data-ad-ext-x01-score-progress-stack="true"\]\[data-ad-ext-x01-2player-stack="true"\]\s*>\s*\[data-ad-ext-x01-2player-slot="score"\],[^}]*line-height:0\.74\s*!important;[^}]*align-self:stretch\s*!important;/s
  );
  assert.match(
    css,
    /\[data-ad-ext-theme-x01-2player-active="true"\],\s*#ad-ext-player-display\s+\.ad-ext-player\.ad-ext-player-winner\{[^}]*border:1px solid var\(--ad-ext-theme-card-active-border-color\)\s*!important;/s
  );
  assert.match(
    css,
    /#ad-ext-player-display\s+\.ad-ext-player\[data-ad-ext-theme-x01-2player-active="true"\]\s*>\s*\[data-ad-ext-x01-2player-stack="true"\]\s*>\s*\[data-ad-ext-x01-2player-slot="score"\][^}]*color:var\(--ad-ext-theme-score-active-color\)\s*!important;/s
  );
  assert.match(
    css,
    /#ad-ext-player-display\s+\.ad-ext-player\.ad-ext-player-winner\s*>\s*\[data-ad-ext-x01-2player-stack="true"\]\s*>\s*\[data-ad-ext-x01-2player-slot="score"\][^}]*color:var\(--ad-ext-theme-score-active-color\)\s*!important;/s
  );
  assert.match(
    css,
    /#ad-ext-player-display\s+\.ad-ext-player\[data-ad-ext-theme-x01-2player-active="false"\],\s*#ad-ext-player-display\s+\.ad-ext-player\[data-ad-ext-theme-x01-2player-active="false"\]\.ad-ext-player-active\{[^}]*border:1px solid var\(--ad-ext-theme-card-inactive-border-color\)\s*!important;/s
  );
  assert.match(
    css,
    /#ad-ext-turn\s+\.ad-ext-turn-points\{[^}]*min-width:3\.3ch\s*!important;[^}]*font-size:var\(--ad-ext-x01-2player-live-throw-points-size\)\s*!important;[^}]*font-weight:800\s*!important;[^}]*line-height:1\s*!important;/s
  );
  assert.match(
    css,
    /#ad-ext-turn\s*\{[^}]*pointer-events:none\s*!important;/s
  );
  assert.match(
    css,
    /#ad-ext-turn\s*>\s*\*\s*\{[^}]*pointer-events:auto\s*!important;/s
  );
  assert.match(
    css,
    /#ad-ext-turn\s*>\s*\.ad-ext-turn-throw\{[^}]*display:flex\s*!important;[^}]*font-size:var\(--ad-ext-x01-2player-throw-points-size\)\s*!important;[^}]*line-height:1\s*!important;/s
  );
  assert.match(
    css,
    /\.chakra-stack\[data-ad-ext-x01-score-progress-stack="true"\]:not\(\[data-ad-ext-x01-2player-stack="true"\]\)/s
  );
  assert.match(
    css,
    /\[data-ad-ext-x01-2player-stack="true"\]\.css-y3hfdd\{[^}]*padding-left:0\s*!important;[^}]*background:transparent\s*!important;/s
  );
  assert.match(
    css,
    /\[data-ad-ext-x01-2player-slot="score"\]\.css-1r7jzhg,\s*#ad-ext-player-display\s+\.ad-ext-player\s*>\s*\[data-ad-ext-x01-2player-stack="true"\]\.css-y3hfdd\s*>\s*\.css-1r7jzhg\{[^}]*grid-column-start:1\s*!important;[^}]*grid-column-end:-1\s*!important;[^}]*grid-row-start:3\s*!important;[^}]*grid-row-end:4\s*!important;/s
  );
  assert.match(
    css,
    /\[data-ad-ext-x01-2player-slot="identity"\]\.css-37hv00,\s*#ad-ext-player-display\s+\.ad-ext-player\s*>\s*\[data-ad-ext-x01-2player-stack="true"\]\.css-y3hfdd\s*>\s*\.css-37hv00\{[^}]*display:block\s*!important;[^}]*grid-column-start:1\s*!important;[^}]*grid-column-end:-1\s*!important;[^}]*grid-row-start:2\s*!important;[^}]*grid-row-end:3\s*!important;[^}]*padding-left:0\s*!important;/s
  );
  assert.match(
    css,
    /\[data-ad-ext-x01-2player-stack="true"\]\s*>\s*\.css-1igwmid:not\(\[data-ad-ext-x01-2player-slot\]\),\s*#ad-ext-player-display\s+\.ad-ext-player\s*>\s*\[data-ad-ext-x01-2player-stack="true"\]\.css-y3hfdd\s*>\s*\.css-1igwmid:not\(\[data-ad-ext-x01-2player-slot\]\)\{[^}]*display:flex\s*!important;[^}]*grid-column-start:2\s*!important;[^}]*grid-column-end:3\s*!important;[^}]*grid-row-start:1\s*!important;[^}]*grid-row-end:2\s*!important;[^}]*padding-left:0\s*!important;/s
  );
  assert.match(
    css,
    /\[data-ad-ext-x01-2player-slot="identity"\],\s*#ad-ext-player-display\s+\.ad-ext-player\s*>\s*\[data-ad-ext-x01-2player-stack="true"\]\s*>\s*\[data-ad-ext-x01-2player-slot="identity"\]\s*>\s*\*,\s*#ad-ext-player-display\s+\.ad-ext-player\s*>\s*\[data-ad-ext-x01-2player-stack="true"\]\s*>\s*\[data-ad-ext-x01-2player-slot="identity"\]\s*>\s*\*\s*>\s*\*,\s*#ad-ext-player-display\s+\.ad-ext-player\s*>\s*\[data-ad-ext-x01-2player-stack="true"\]\s*>\s*\[data-ad-ext-x01-2player-slot="identity"\]\s*>\s*\*\s*>\s*\*\s*>\s*\*\{[^}]*background:transparent\s*!important;[^}]*background-color:transparent\s*!important;/s
  );
  assert.match(
    css,
    /#ad-ext-player-display\s+\.ad-ext-player\s+table\s+td,\s*#ad-ext-player-display\s+\.ad-ext-player\s+table\s+th\{[^}]*font-size:var\(--ad-ext-x01-2player-table-cell-font-size\)\s*!important;[^}]*text-align:center\s*!important;/s
  );
  assert.match(
    css,
    /\.ad-ext-theme-board-controls\s*\{[^}]*top:calc\(var\(--ad-ext-x01-2player-turn-clearance\) \+ 0\.25rem\)\s*!important;[^}]*min-height:var\(--ad-ext-x01-2player-controls-height\)\s*!important;[^}]*gap:0\.28rem\s*!important;[^}]*padding:0\.12rem\s*!important;[^}]*border-radius:0\s*!important;[^}]*background:transparent\s*!important;[^}]*background-color:transparent\s*!important;[^}]*box-shadow:none\s*!important;[^}]*backdrop-filter:none\s*!important;/s
  );
  assert.match(
    css,
    /\.ad-ext-theme-board-controls\s*>\s*\*,\s*\.ad-ext-theme-board-controls\s+button\{[^}]*min-height:calc\(var\(--ad-ext-x01-2player-controls-height\) - 0\.24rem\)\s*!important;/s
  );
  assert.match(
    css,
    /\.ad-ext-theme-content-board\.ad-ext-theme-board-panel\s*>\s*\.ad-ext-theme-board-controls,[\s\S]*?\.css-1kejrvi\.ad-ext-theme-board-panel\s*>\s*\.ad-ext-theme-board-controls,[\s\S]*?\.css-14xtjvc\.ad-ext-theme-board-panel\s*>\s*\.ad-ext-theme-board-controls\{[^}]*top:calc\(var\(--ad-ext-x01-2player-live-turn-height\) \+ var\(--ad-ext-x01-2player-turn-clearance\)\)\s*!important;/s
  );
  assert.match(
    css,
    /\.ad-ext-theme-board-viewport\{[^}]*width:100%\s*!important;[^}]*height:100%\s*!important;[^}]*justify-self:stretch\s*!important;/s
  );
  assert.match(
    css,
    /\.ad-ext-theme-board-canvas\{[^}]*max-width:100%\s*!important;[^}]*max-height:100%\s*!important;/s
  );
  assert.match(
    css,
    /@media \(max-width: 1180px\)\{[\s\S]*?--ad-ext-x01-2player-score-size:clamp\(6\.048rem,\s*min\(24vw,\s*14\.4vh\),\s*9\.25rem\);[\s\S]*?--ad-ext-x01-2player-score-scale:1\.14;[\s\S]*?--ad-ext-x01-2player-table-cell-font-size:clamp\(1\.8rem,\s*min\(6\.7vw,\s*4\.5vh\),\s*2\.35rem\);/s
  );
  assert.match(
    css,
    /@media \(max-width: 820px\)\{[\s\S]*?--ad-ext-x01-2player-score-size:clamp\(5\.616rem,\s*min\(22vw,\s*12vh\),\s*8\.3rem\);[\s\S]*?--ad-ext-x01-2player-score-scale:1\.08;[\s\S]*?--ad-ext-x01-2player-table-cell-font-size:clamp\(1\.6rem,\s*min\(5\.8vw,\s*3\.9vh\),\s*2\.05rem\);/s
  );
  assert.match(
    css,
    /@media \(max-height: 860px\)\{[\s\S]*?--ad-ext-x01-2player-score-size:clamp\(5\.76rem,\s*min\(23\.5cqi,\s*12\.8vh\),\s*8\.8rem\);[\s\S]*?--ad-ext-x01-2player-score-scale:1\.06;[\s\S]*?--ad-ext-x01-2player-table-cell-font-size:clamp\(1\.55rem,\s*min\(5\.4cqi,\s*3\.7vh\),\s*2rem\);/s
  );
  assert.doesNotMatch(css, /font-size:\s*2em\s*!important/);
  assert.doesNotMatch(css, /--ad-ext-theme-board-size:min\(/);
  assert.doesNotMatch(css, /\[data-ad-ext-turn-points-node=/);
  assert.doesNotMatch(css, /#ad-ext-player-display\s*>\s*\*(?!\s*>)/);
  assert.doesNotMatch(css, /(^|,)\s*svg\[viewBox="0 0 1000 1000"\]/m);
  assert.doesNotMatch(css, /\.css-hjw8x4/);
  assert.doesNotMatch(css, /#ad-ext-player-display\s+\.ad-ext-player\s+\.ad-ext-player-name[^}]*text-transform:uppercase/s);
  assert.doesNotMatch(css, /#ad-ext-player-display\s+\.ad-ext-player\s+\.ad-ext-player-name[^}]*-webkit-line-clamp/s);
  assertNoFragileLayoutSelectors(css);
});

test("shanghai and bermuda stay under-throws and keep oldrepo preview behavior", () => {
  const shanghaiCss = buildShanghaiThemeCss({ showAvg: false });
  const bermudaCss = buildBermudaThemeCss({});

  assert.equal(PREVIEW_SHANGHAI.mode, "under-throws");
  assert.equal(PREVIEW_BERMUDA.mode, "under-throws");
  assert.equal(PREVIEW_SHANGHAI.activationMode, "autodarts-tools-zoom");
  assert.equal(PREVIEW_BERMUDA.activationMode, "autodarts-tools-zoom");
  assert.match(shanghaiCss, /ad-ext-turn-preview-space/);
  assert.match(bermudaCss, /ad-ext-turn-preview-space/);
  assert.match(shanghaiCss, /ad-ext-avg-trend-arrow\s*\{\s*display:\s*none\s*!important;/);
  assert.match(
    shanghaiCss,
    /#ad-ext-player-display\s+\.ad-ext-player\.ad-ext-player-active\s*>\s*\.chakra-stack,\s*#ad-ext-player-display\s+\.ad-ext-player\.ad-ext-player-winner\s*>\s*\.chakra-stack\s*\{[^}]*grid-template-rows:\s*max-content max-content\s*!important;[^}]*align-content:\s*center\s*!important;/s
  );
  assert.match(
    shanghaiCss,
    /#ad-ext-player-display\s+\.ad-ext-player\s*>\s*\.chakra-stack\s*\{[^}]*display:\s*grid\s*!important;[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s*max-content\s*!important;[^}]*grid-template-rows:\s*max-content max-content\s*!important;[^}]*gap:\s*0px\s*!important;[^}]*min-width:\s*0\s*!important;/s
  );
  assert.match(
    shanghaiCss,
    /#ad-ext-player-display\s+\.ad-ext-player\s*>\s*\.chakra-stack\s*>\s*\.chakra-stack\s*\{[^}]*min-width:\s*0\s*!important;[^}]*max-width:\s*100%\s*!important;[^}]*overflow:\s*hidden\s*!important;/s
  );
  assert.match(
    shanghaiCss,
    /#ad-ext-player-display\s+\.ad-ext-player\s+\.ad-ext-player-name,\s*#ad-ext-player-display\s+\.ad-ext-player\s+\.ad-ext-player-name\s*>\s*p\s*\{[^}]*min-width:\s*0\s*!important;[^}]*overflow:\s*hidden\s*!important;[^}]*text-overflow:\s*ellipsis\s*!important;[^}]*white-space:\s*nowrap\s*!important;/s
  );
  assert.match(
    shanghaiCss,
    /#ad-ext-player-display\s+\.ad-ext-player\s+\.ad-ext-player-score\s*\{[^}]*justify-self:\s*end\s*!important;[^}]*min-width:\s*max-content\s*!important;[^}]*white-space:\s*nowrap\s*!important;/s
  );
  assert.match(shanghaiCss, /--ad-ext-stat-scale:\s*1\.2/);
  assert.match(
    shanghaiCss,
    /#ad-ext-player-display\s+\.ad-ext-player\.ad-ext-player-active,\s*#ad-ext-player-display\s+\.ad-ext-player\.ad-ext-player-winner\{[^}]*--ad-ext-player-flex:\s*1\.333333;[^}]*--ad-ext-player-score-size:\s*clamp\(5\.333rem,\s*10\.667vw,\s*calc\(var\(--ad-ext-player-score-max\)\s\*\s1\.333333\)\);/s
  );
  assert.match(
    shanghaiCss,
    /#ad-ext-player-display\s+\.ad-ext-player\.ad-ext-player-active,\s*#ad-ext-player-display\s+\.ad-ext-player\.ad-ext-player-winner\{[^}]*min-height:\s*clamp\(12rem,\s*42cqb,\s*24rem\)\s*!important;/s
  );
  assert.match(
    shanghaiCss,
    /#ad-ext-player-display\s+\.ad-ext-player\.ad-ext-player-active,\s*#ad-ext-player-display\s+\.ad-ext-player\.ad-ext-player-winner\s*\{[^}]*border:\s*2px\s+solid\s+var\(--ad-ext-theme-card-active-border-color\)\s*!important;[^}]*border-radius:\s*12px\s*!important;[^}]*box-shadow:\s*0\s+0\s+0\s+1px\s+var\(--ad-ext-theme-card-active-outline-color\)\s*!important;/s
  );
  assertNoFragileLayoutSelectors(shanghaiCss);
  assertNoFragileLayoutSelectors(bermudaCss);
});

test("bull-off keeps oldrepo board-first grid and no preview spacer", () => {
  const css = buildBullOffThemeCss({ contrastPreset: "standard" });

  assert.equal(PREVIEW_BULL_OFF.mode, "standard");
  assert.doesNotMatch(css, /ad-ext-turn-preview-space/);
  assert.match(css, /--ad-ext-stat-scale:\s*1\.2/);
  assert.match(
    css,
    /#ad-ext-player-display\s+\.ad-ext-player\.ad-ext-player-active\s*>\s*\.chakra-stack,\s*#ad-ext-player-display\s+\.ad-ext-player\.ad-ext-player-winner\s*>\s*\.chakra-stack\s*\{[^}]*grid-template-rows:\s*max-content max-content\s*!important;[^}]*align-content:\s*center\s*!important;/s
  );
  assert.match(
    css,
    /#ad-ext-player-display\s+\.ad-ext-player\s*>\s*\.chakra-stack\s*\{[^}]*display:\s*grid\s*!important;[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s*max-content\s*!important;[^}]*gap:\s*0px\s*!important;[^}]*min-width:\s*0\s*!important;/s
  );
  assert.match(
    css,
    /#ad-ext-player-display\s+\.ad-ext-player\s+\.ad-ext-player-score\s*\{[^}]*justify-self:\s*end\s*!important;[^}]*min-width:\s*max-content\s*!important;[^}]*white-space:\s*nowrap\s*!important;/s
  );
  assert.match(
    css,
    /#ad-ext-player-display\s+\.ad-ext-player\.ad-ext-player-active,\s*#ad-ext-player-display\s+\.ad-ext-player\.ad-ext-player-winner\{[^}]*--ad-ext-player-flex:\s*1\.333333;[^}]*--ad-ext-player-score-size:\s*clamp\(5\.333rem,\s*10\.667vw,\s*calc\(var\(--ad-ext-player-score-max\)\s\*\s1\.333333\)\);/s
  );
  assert.match(
    css,
    /#ad-ext-player-display\s+\.ad-ext-player\s*\{[^}]*min-height:\s*clamp\(7\.25rem,\s*20cqb,\s*11rem\)\s*!important;/s
  );
  assert.doesNotMatch(css, /font-size:\s*7\.2em\s*!important;/s);
  assert.doesNotMatch(css, /--ad-ext-player-score-max:\s*6\.2rem;/s);
  assert.doesNotMatch(css, /--ad-ext-player-score-max:\s*5\.2rem;/s);
  assert.match(
    css,
    /#ad-ext-player-display\s+\.ad-ext-player\.ad-ext-player-active,\s*#ad-ext-player-display\s+\.ad-ext-player\.ad-ext-player-winner\{[^}]*border:\s*2px\s+solid\s+var\(--ad-ext-theme-card-active-border-color\)\s*!important;/s
  );
  assert.match(css, /grid-template-columns:\s*0\.94fr 1\.06fr\s*!important;/);
  assert.match(
    css,
    /\.css-1kejrvi,\s*\.css-14xtjvc\s*\{[^}]*grid-row-start:\s*2\s*!important;[^}]*grid-row-end:\s*4\s*!important;/s
  );
  assertNoFragileLayoutSelectors(css);
});

test("shared common layout keeps oldrepo baseline grid contract", () => {
  const sharedPlayerDisplayCss = buildSharedPlayerDisplayCss();

  assert.match(
    commonThemeCss,
    /--ad-ext-theme-accent-color:\s*var\(--theme-text-highlight-color\);[^}]*--ad-ext-theme-text-primary-color:\s*rgba\(214,\s*229,\s*245,\s*0\.84\);[^}]*--ad-ext-theme-text-secondary-color:\s*rgba\(226,\s*232,\s*240,\s*0\.92\);/s
  );
  assert.match(
    commonThemeCss,
    /--ad-ext-theme-score-active-color:\s*var\(--ad-ext-theme-score-color\);[^}]*--ad-ext-theme-score-inactive-color:\s*var\(--ad-ext-theme-text-primary-color\);[^}]*--ad-ext-theme-name-color:\s*var\(--ad-ext-theme-text-secondary-color\);[^}]*--ad-ext-theme-meta-color:\s*var\(--ad-ext-theme-text-secondary-color\);[^}]*--ad-ext-theme-active-card-tint-top:\s*transparent;[^}]*--ad-ext-theme-card-tint-top-current:\s*transparent;/s
  );
  assert.match(
    commonLayoutCss,
    /grid-template-areas:\s*"header header"\s*"footer footer"\s*"players board"/
  );
  assert.match(
    commonLayoutCss,
    /#ad-ext-player-display\s*\{[^}]*display:flex;[^}]*flex-direction:\s*column;[^}]*grid-area:\s*players\s*!important;/s
  );
  assert.match(
    commonLayoutCss,
    /div\.css-y3hfdd:not\(\[data-ad-ext-cricket-stack="true"\]\)\s*\{[^}]*grid-template-columns:\s*1fr auto\s*!important;[^}]*grid-template-rows:\s*max-content minmax\(0,\s*1fr\)\s*!important;[^}]*align-content:\s*start\s*!important;/s
  );
  assert.match(
    commonLayoutCss,
    /div\.css-y3hfdd:not\(\[data-ad-ext-cricket-stack="true"\]\)\s*>\s*\.css-1igwmid\s*\{[^}]*grid-row-start:\s*2\s*!important;[^}]*padding-left:\s*55px\s*!important;[^}]*align-self:\s*start\s*!important;[^}]*margin-top:\s*0\s*!important;/s
  );
  assert.match(
    commonLayoutCss,
    /\.ad-ext-theme-board-panel\s*\{[^}]*grid-template-rows:\s*minmax\(0,\s*1fr\)\s*!important;[^}]*position:\s*relative\s*!important;[^}]*overflow:\s*visible\s*!important;/s
  );
  assert.match(
    commonLayoutCss,
    /\.ad-ext-theme-content-slot\s*\{[^}]*grid-template-columns:\s*minmax\(18rem,\s*clamp\(22rem,\s*34vw,\s*38rem\)\)\s*minmax\(0,\s*1fr\)\s*!important;/s
  );
  assert.match(
    commonLayoutCss,
    /\.ad-ext-theme-content-slot\s*\{[^}]*grid-column:\s*1\s*\/\s*-1\s*!important;[^}]*grid-row:\s*3\s*!important;/s
  );
  assert.match(
    commonLayoutCss,
    /\.css-tkevr6\s*>\s*\.chakra-stack\s*>\s*\.ad-ext-theme-content-slot,\s*\.css-tkevr6\s+\.ad-ext-theme-content-slot\s*\{[^}]*justify-self:\s*stretch\s*!important;[^}]*max-width:\s*100%\s*!important;/s
  );
  assert.match(
    commonLayoutCss,
    /\.ad-ext-theme-content-board\s*\{[^}]*grid-column:\s*2\s*!important;[^}]*display:\s*flex\s*!important;/s
  );
  assert.match(
    commonLayoutCss,
    /\.ad-ext-theme-board-controls\s*\{[^}]*position:\s*absolute\s*!important;[^}]*top:\s*0\.5rem\s*!important;[^}]*right:\s*0\.5rem\s*!important;[^}]*bottom:\s*auto\s*!important;[^}]*left:\s*auto\s*!important;/s
  );
  assert.match(
    commonLayoutCss,
    /\.ad-ext-theme-board-viewport\s*\{[^}]*display:\s*flex\s*!important;[^}]*overflow:\s*visible\s*!important;/s
  );
  assert.match(
    commonLayoutCss,
    /\.ad-ext-theme-board-canvas\s*\{[^}]*flex:\s*0\s+0\s+auto\s*!important;[^}]*height:\s*var\(--ad-ext-theme-board-size,\s*100%\)\s*!important;[^}]*width:\s*var\(--ad-ext-theme-board-size,\s*100%\)\s*!important;[^}]*aspect-ratio:\s*1 \/ 1;[^}]*overflow:\s*visible\s*!important;/s
  );
  assert.match(
    commonLayoutCss,
    /\.ad-ext-theme-board-canvas\s*>\s*\*\s*\{[^}]*width:\s*100%\s*!important;[^}]*height:\s*100%\s*!important;[^}]*max-width:\s*100%\s*!important;[^}]*max-height:\s*100%\s*!important;[^}]*display:\s*flex\s*!important;[^}]*justify-content:\s*center\s*!important;[^}]*overflow:\s*visible\s*!important;/s
  );
  assert.match(
    commonLayoutCss,
    /\.ad-ext-theme-board-svg\[viewBox="0 0 1000 1000"\]\s*\{[^}]*width:\s*100%\s*!important;[^}]*height:\s*100%\s*!important;[^}]*max-width:\s*100%\s*!important;[^}]*max-height:\s*100%\s*!important;[^}]*aspect-ratio:\s*1 \/ 1;/s
  );
  assert.match(
    sharedPlayerDisplayCss,
    /#ad-ext-player-display\s+\.ad-ext-player\s+\.ad-ext-player-name,\s*#ad-ext-player-display\s+\.ad-ext-player\s+\.ad-ext-player-name\s*>\s*p\s*\{[^}]*color:\s*var\(--ad-ext-theme-name-color\)\s*!important;/s
  );
  assert.match(
    sharedPlayerDisplayCss,
    /#ad-ext-player-display\s+\.ad-ext-player\s+\.ad-ext-player-score\s*\{[^}]*color:\s*var\(--ad-ext-theme-score-color\)\s*!important;/s
  );
  assert.match(
    sharedPlayerDisplayCss,
    /#ad-ext-player-display\s+\.ad-ext-player\s*>\s*\.chakra-stack\s*\{[^}]*grid-template-rows:\s*max-content max-content\s*!important;[^}]*align-content:\s*center\s*!important;/s
  );
  assert.match(
    sharedPlayerDisplayCss,
    /p\.chakra-text\.css-1j0bqop\s*\{[^}]*color:\s*var\(--ad-ext-theme-meta-color\)\s*!important;/s
  );
  assert.match(
    sharedPlayerDisplayCss,
    /#ad-ext-turn\s+\.ad-ext-turn-points,\s*#ad-ext-turn\s+\.ad-ext-hit-score\s*\{[^}]*color:\s*var\(--ad-ext-theme-turn-points-color\)\s*!important;/s
  );
  assert.doesNotMatch(commonLayoutCss, /width:\s*min\(100%,\s*100vh\)\s*!important;/);
  assert.doesNotMatch(commonLayoutCss, /96cqw|96cqh/);
  assertNoFragileLayoutSelectors(commonLayoutCss);
});

test("shared theme visual settings keep player cards shrinkable while preserving full-height stacks", () => {
  const visualCss = buildThemeVisualSettingsCss({
    playerFieldTransparency: 10,
  });

  assert.match(
    visualCss,
    /#ad-ext-player-display\s+\.ad-ext-player\s*\{[^}]*min-height:\s*0\s*!important;[^}]*height:\s*auto\s*!important;/s
  );
  assert.match(
    visualCss,
    /#ad-ext-player-display\s+\.ad-ext-player\s*>\s*\.chakra-stack\s*\{[^}]*min-height:\s*0\s*!important;[^}]*height:\s*100%\s*!important;[^}]*linear-gradient\(\s*180deg,\s*var\(--ad-ext-theme-card-tint-top-current\),\s*var\(--ad-ext-theme-card-tint-bottom-current\)\s*\),/s
  );
});

test("shared theme visual settings stretch uploaded backgrounds across the full viewport shells", () => {
  const visualCss = buildThemeVisualSettingsCss({
    backgroundDisplayMode: "stretch",
    backgroundOpacity: 30,
    backgroundImageDataUrl: "data:image/png;base64,AAAA",
  });

  assert.match(
    visualCss,
    /html,\s*body,\s*div\.css-gmuwbf,\s*div\.css-tkevr6,\s*div\.css-nfhdnc\s*\{[^}]*background-size:\s*100% 100%\s*!important;[^}]*background-position:\s*center center\s*!important;[^}]*background-repeat:\s*no-repeat\s*!important;/s
  );
});

test("shared theme visual settings prefer the theme image and otherwise fall back to Templates Global", () => {
  const globalTypographyConfig = {
    enabled: true,
    backgroundDisplayMode: "tile",
    backgroundOpacity: 70,
    playerFieldTransparency: 45,
    backgroundImageDataUrl: "data:image/png;base64,GGGG",
  };
  const themeWithoutImage = {
    backgroundDisplayMode: "fill",
    backgroundOpacity: 25,
    playerFieldTransparency: 10,
    backgroundImageDataUrl: "",
  };
  const themeWithImage = {
    backgroundDisplayMode: "fit",
    backgroundOpacity: 40,
    playerFieldTransparency: 30,
    backgroundImageDataUrl: "data:image/png;base64,AAAA",
  };

  assert.equal(
    resolveThemeVisualSettingsConfig(themeWithoutImage, globalTypographyConfig),
    globalTypographyConfig
  );
  assert.equal(
    resolveThemeVisualSettingsConfig(themeWithImage, globalTypographyConfig),
    themeWithImage
  );
  assert.equal(
    resolveThemeVisualSettingsConfig(themeWithoutImage, {
      ...globalTypographyConfig,
      enabled: false,
    }),
    themeWithoutImage
  );
});

test("shared theme visual settings fall back to preset wallpaper assets after uploaded images", () => {
  const globalTypographyConfig = {
    enabled: true,
    backgroundDisplayMode: "fill",
    backgroundOpacity: 40,
    playerFieldTransparency: 15,
    backgroundImageDataUrl: "",
    backgroundAssetKey: "ice",
  };
  const themeWithoutImage = {
    backgroundDisplayMode: "fill",
    backgroundOpacity: 25,
    playerFieldTransparency: 10,
    backgroundImageDataUrl: "",
  };
  const themeWithImage = {
    backgroundDisplayMode: "fit",
    backgroundOpacity: 40,
    playerFieldTransparency: 30,
    backgroundImageDataUrl: "data:image/png;base64,AAAA",
  };

  assert.equal(
    resolveThemeVisualSettingsConfig(themeWithoutImage, globalTypographyConfig),
    globalTypographyConfig
  );
  assert.equal(
    resolveThemeVisualSettingsConfig(themeWithImage, globalTypographyConfig),
    themeWithImage
  );
  assert.match(buildThemeVisualSettingsCss(globalTypographyConfig), /theme-presets\/ice\.jpg/);
});
