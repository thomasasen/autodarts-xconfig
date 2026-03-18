import test from "node:test";
import assert from "node:assert/strict";

import {
  PREVIEW_PLACEMENT,
  buildCricketThemeCss,
} from "../../src/features/themes/cricket/style.js";
import { buildStyleText as buildCricketHighlighterStyleText } from "../../src/features/cricket-highlighter/style.js";
import { buildStyleText as buildCricketGridFxStyleText } from "../../src/features/cricket-grid-fx/style.js";

test("cricket theme keeps standard preview placement and uses stable board layout hooks", () => {
  const css = buildCricketThemeCss({ showAvg: true });

  assert.equal(PREVIEW_PLACEMENT.mode, "standard");
  assert.doesNotMatch(css, /ad-ext-turn-preview-space/);
  assert.match(css, /\.css-1k7iu8k\s*\{\s*max-width:\s*96%/);
  assert.match(css, /--ad-ext-cricket-surface:\s*rgba\(8,\s*16,\s*30,\s*0\.9\)/);
  assert.match(css, /--ad-ext-theme-cricket-player-column-min-width:\s*12\.6rem;/);
  assert.match(css, /--ad-ext-theme-cricket-player-column-max-width:\s*14rem;/);
  assert.match(css, /--ad-ext-theme-cricket-player-card-min-width:\s*var\(--ad-ext-theme-cricket-player-column-min-width\);/);
  assert.match(css, /--ad-ext-theme-cricket-player-name-min-width:\s*4ch;/);
  assert.match(css, /--ad-ext-theme-cricket-score-min-width:\s*4\.2ch;/);
  assert.match(css, /--ad-ext-theme-cricket-stats-min-width:\s*5\.4ch;/);
  assert.match(css, /--ad-ext-theme-cricket-card-inline-bleed:\s*0\.34rem;/);
  assert.match(css, /--ad-ext-theme-cricket-player-avatar-size:\s*2\.2rem;/);
  assert.match(css, /--ad-ext-theme-cricket-score-active-color:\s*var\(--theme-text-highlight-color\);/);
  assert.match(css, /--ad-ext-theme-cricket-score-inactive-color:\s*rgba\(214,\s*229,\s*245,\s*0\.84\);/);
  assert.match(css, /--ad-ext-theme-cricket-score-shadow:\s*0 1px 0 rgba\(4,\s*10,\s*20,\s*0\.92\),/);
  assert.match(css, /--ad-ext-theme-cricket-board-min-width-auto:\s*18rem;/);
  assert.match(css, /--ad-ext-theme-cricket-board-min-width-manual:\s*10rem;/);
  assert.match(css, /--ad-ext-theme-cricket-board-width:\s*auto;/);
  assert.match(
    css,
    /#ad-ext-player-display\s+\.ad-ext-player\s*>\s*\.chakra-stack\s*\{[^}]*background:\s*linear-gradient\(165deg,\s*rgba\(6,\s*15,\s*34,\s*0\.96\),\s*rgba\(3,\s*10,\s*24,\s*0\.94\)\)\s*!important;/s
  );
  assert.match(
    css,
    /#ad-ext-player-display\s+\.ad-ext-player\.ad-ext-player-active\s*>\s*\.chakra-stack\s*\{[^}]*border-color:\s*var\(--ad-ext-cricket-active-ring\)\s*!important;/s
  );
  assert.match(
    css,
    /#ad-ext-player-display\s+\.ad-ext-player\s+\.ad-ext-player-score\s*\{[^}]*color:\s*var\(--ad-ext-theme-cricket-score-active-color\);[^}]*font-size:\s*clamp\(2\.85rem,\s*5\.31vw,\s*6\.58rem\)\s*!important;[^}]*line-height:\s*0\.9\s*!important;[^}]*font-weight:\s*800\s*!important;[^}]*text-align:\s*right\s*!important;[^}]*text-shadow:\s*var\(--ad-ext-theme-cricket-score-shadow\)\s*!important;/s
  );
  assert.match(
    css,
    /#ad-ext-player-display\s+\.ad-ext-player\.ad-ext-player-active\s+\.ad-ext-player-score\s*\{[^}]*font-size:\s*clamp\(3\.16rem,\s*5\.95vw,\s*7\.08rem\)\s*!important;/s
  );
  assert.match(
    css,
    /#ad-ext-player-display\s+\.ad-ext-player\.ad-ext-player-inactive\s+\.ad-ext-player-score,\s*#ad-ext-player-display\s+\.ad-ext-player:not\(\.ad-ext-player-active\):not\(\.ad-ext-player-winner\)\s+\.ad-ext-player-score\s*\{[^}]*font-size:\s*clamp\(2\.28rem,\s*4\.43vw,\s*5\.31rem\)\s*!important;[^}]*color:\s*var\(--ad-ext-theme-cricket-score-inactive-color\)\s*!important;/s
  );
  assert.match(
    css,
    /@supports\s*\(font-size:\s*1cqi\)\s*\{[^}]*#ad-ext-player-display\s+\.ad-ext-player\s+\.ad-ext-player-score\s*\{[^}]*font-size:\s*clamp\(2\.85rem,\s*25\.3cqi,\s*6\.58rem\)\s*!important;/s
  );
  assert.match(
    css,
    /@supports\s*\(font-size:\s*1cqi\)\s*\{[\s\S]*?#ad-ext-player-display\s+\.ad-ext-player\.ad-ext-player-active\s+\.ad-ext-player-score\s*\{[^}]*font-size:\s*clamp\(3\.16rem,\s*27\.8cqi,\s*7\.08rem\)\s*!important;/s
  );
  assert.match(
    css,
    /@supports\s*\(font-size:\s*1cqi\)\s*\{[\s\S]*?#ad-ext-player-display\s+\.ad-ext-player\.ad-ext-player-inactive\s+\.ad-ext-player-score,\s*#ad-ext-player-display\s+\.ad-ext-player:not\(\.ad-ext-player-active\):not\(\.ad-ext-player-winner\)\s+\.ad-ext-player-score\s*\{[^}]*font-size:\s*clamp\(2\.28rem,\s*21\.5cqi,\s*5\.31rem\)\s*!important;/s
  );
  assert.match(
    css,
    /div\.css-y3hfdd\s*\{[^}]*grid-template-columns:\s*max-content\s*minmax\(var\(--ad-ext-theme-cricket-stats-min-width\),\s*1fr\)\s*minmax\(var\(--ad-ext-theme-cricket-score-min-width\),\s*max-content\)\s*!important;[^}]*grid-template-areas:\s*"identity identity identity"\s*"matches stats score"\s*!important;[^}]*column-gap:\s*0\.3rem\s*!important;[^}]*container-type:\s*inline-size\s*!important;/s
  );
  assert.match(
    css,
    /#ad-ext-player-display\s+\.ad-ext-player\s*\{[^}]*min-width:\s*var\(--ad-ext-theme-cricket-player-card-min-width\)\s*!important;/s
  );
  assert.match(
    css,
    /#ad-ext-player-display\s+\.ad-ext-player\s*>\s*\.chakra-stack\s*\{[^}]*display:\s*grid\s*!important;[^}]*grid-template-columns:\s*max-content\s*minmax\(var\(--ad-ext-theme-cricket-stats-min-width\),\s*1fr\)\s*minmax\(var\(--ad-ext-theme-cricket-score-min-width\),\s*max-content\)\s*!important;[^}]*grid-template-areas:\s*"identity identity identity"\s*"matches stats score"\s*!important;[^}]*column-gap:\s*0\.3rem\s*!important;/s
  );
  assert.match(
    css,
    /\.ad-ext-player-name\s*\{[^}]*min-inline-size:\s*var\(--ad-ext-theme-cricket-player-name-min-width\)\s*!important;[^}]*text-overflow:\s*ellipsis\s*!important;/s
  );
  assert.match(
    css,
    /#ad-ext-player-display\s+\.ad-ext-player\s*>\s*\.chakra-stack\.css-y3hfdd\s*>\s*\.chakra-stack\.css-37hv00\s*\{[^}]*display:\s*contents\s*!important;/s
  );
  assert.match(
    css,
    /#ad-ext-player-display\s+\.ad-ext-player\s*>\s*\.chakra-stack\.css-y3hfdd\s*>\s*\.chakra-stack\.css-1igwmid\s*\{[^}]*grid-area:\s*stats\s*!important;[^}]*grid-column:\s*1\s*\/\s*3\s*!important;[^}]*justify-self:\s*stretch\s*!important;[^}]*min-width:\s*var\(--ad-ext-theme-cricket-stats-min-width\)\s*!important;[^}]*display:\s*flex\s*!important;[^}]*justify-content:\s*flex-start\s*!important;[^}]*padding-left:\s*1\.92rem\s*!important;/s
  );
  assert.match(
    css,
    /#ad-ext-player-display\s+\.ad-ext-player\s*>\s*\.chakra-stack\.css-y3hfdd\s*>\s*\.css-17xejub\s*\{[^}]*display:\s*none\s*!important;/s
  );
  assert.match(
    css,
    /#ad-ext-player-display\s+\.ad-ext-player\s*>\s*\.chakra-stack\.css-y3hfdd\s*>\s*\.chakra-stack\.css-37hv00\s*>\s*\.css-1cmgsw8\s*\{[^}]*grid-area:\s*matches\s*!important;[^}]*grid-column:\s*1\s*!important;[^}]*justify-self:\s*start\s*!important;[^}]*align-self:\s*center\s*!important;/s
  );
  assert.match(
    css,
    /#ad-ext-player-display\s+\.ad-ext-player\s*>\s*\.chakra-stack\.css-y3hfdd\s*>\s*\.chakra-stack\.css-37hv00\s*>\s*\.css-1cmgsw8\s+\.css-3fr5p8\s*\{[^}]*min-height:\s*1\.18rem\s*!important;[^}]*min-width:\s*1\.31rem\s*!important;[^}]*padding-inline:\s*0\.35rem\s*!important;/s
  );
  assert.match(
    css,
    /#ad-ext-player-display\s+\.ad-ext-player\s*>\s*\.chakra-stack\.css-y3hfdd\s*>\s*\.chakra-stack\.css-37hv00\s*>\s*\.css-1cmgsw8\s+\.css-1hcjh09\s*\{[^}]*font-size:\s*clamp\(0\.83rem,\s*0\.92vw,\s*0\.99rem\)\s*!important;/s
  );
  assert.match(
    css,
    /p\.chakra-text\.css-1j0bqop\s*\{[^}]*font-size:\s*clamp\(0\.92rem,\s*1\.04vw,\s*1\.1rem\)\s*!important;/s
  );
  assert.match(
    css,
    /#ad-ext-player-display\s+\.ad-ext-player\s*>\s*\.chakra-stack\.css-y3hfdd\s*>\s*\.chakra-stack\.css-37hv00\s*>\s*\.css-aa7b80\s*>\s*span\s*\{[^}]*display:\s*grid\s*!important;[^}]*grid-template-columns:\s*var\(--ad-ext-theme-cricket-player-avatar-size\)\s*minmax\(0,\s*1fr\)\s*auto\s*!important;[^}]*grid-template-areas:\s*"avatar name wins"\s*!important;[^}]*border:\s*none\s*!important;[^}]*padding:\s*0\.15rem var\(--ad-ext-theme-cricket-card-inline-bleed\) 0\.2rem\s*!important;/s
  );
  assert.match(
    css,
    /#ad-ext-player-display\s+\.ad-ext-player\s*>\s*\.chakra-stack\.css-y3hfdd\s*>\s*\.chakra-stack\.css-37hv00\s*>\s*\.css-aa7b80\s*\{[^}]*margin-inline:\s*calc\(-1 \* var\(--ad-ext-theme-cricket-card-inline-bleed\)\)\s*!important;[^}]*width:\s*calc\(100% \+ \(2 \* var\(--ad-ext-theme-cricket-card-inline-bleed\)\)\)\s*!important;/s
  );
  assert.match(
    css,
    /#ad-ext-player-display\s+\.ad-ext-player\s*>\s*\.chakra-stack\.css-y3hfdd\s*>\s*\.chakra-stack\.css-37hv00\s*\.css-aa7b80\s*>\s*span\s*>\s*\.css-1igwmid\s*>\s*\.chakra-badge\s*\{[^}]*grid-area:\s*wins\s*!important;[^}]*justify-self:\s*end\s*!important;[^}]*font-size:\s*clamp\(0\.62rem,\s*0\.72vw,\s*0\.76rem\)\s*!important;/s
  );
  assert.match(
    css,
    /#ad-ext-player-display\s+\.ad-ext-player\s*>\s*\.chakra-stack\.css-y3hfdd\s*>\s*\.chakra-stack\.css-1igwmid\s*>\s*p\s*\{[^}]*overflow:\s*visible\s*!important;[^}]*text-overflow:\s*clip\s*!important;[^}]*white-space:\s*nowrap\s*!important;/s
  );
  assert.match(
    css,
    /#ad-ext-player-display\s+\.ad-ext-player\s+\.ad-ext-player-score\s*\{[^}]*min-inline-size:\s*var\(--ad-ext-theme-cricket-score-min-width\)\s*!important;/s
  );
  assert.match(
    css,
    /#ad-ext-player-display\s+\.ad-ext-player\s*>\s*\.chakra-stack\s*>\s*\.ad-ext-player-score\s*\{[^}]*grid-area:\s*score\s*!important;[^}]*grid-column:\s*3\s*!important;[^}]*grid-row:\s*2\s*!important;[^}]*justify-self:\s*end\s*!important;[^}]*align-self:\s*center\s*!important;[^}]*padding-left:\s*0\.28rem\s*!important;/s
  );
  assert.match(
    css,
    /#ad-ext-player-display\s+\.ad-ext-player\.ad-ext-player-active\s+\.ad-ext-player-name,\s*#ad-ext-player-display\s+\.ad-ext-player\.ad-ext-player-active\s+\.ad-ext-player-name\s*>\s*p\s*\{[^}]*font-size:\s*clamp\(0\.82rem,\s*0\.94vw,\s*0\.98rem\)\s*!important;/s
  );
  assert.match(
    css,
    /#ad-ext-player-display\s+\.ad-ext-player\s+\.ad-ext-player-name\s*>\s*p\s*\{[^}]*white-space:\s*nowrap\s*!important;[^}]*overflow:\s*hidden\s*!important;[^}]*text-overflow:\s*ellipsis\s*!important;/s
  );
  assert.doesNotMatch(css, /white-space:\s*normal\s*!important;/);
  assert.doesNotMatch(css, /-webkit-line-clamp:\s*2\s*!important;/);
  assert.doesNotMatch(css, /color:\s*gray\s*!important;/);
  assert.doesNotMatch(
    css,
    /#ad-ext-player-display\s+\.ad-ext-player\s+\.ad-ext-player-score\s*\{[^}]*display:\s*flex\s*!important;/s
  );
  assert.match(
    css,
    /#ad-ext-player-display\s+\.ad-ext-player\s+\.ad-ext-player-score\s*\{[^}]*inline-size:\s*max-content\s*!important;[^}]*max-inline-size:\s*none\s*!important;[^}]*overflow:\s*visible\s*!important;[^}]*text-overflow:\s*initial\s*!important;/s
  );
  assert.doesNotMatch(
    css,
    /#ad-ext-player-display\s+\.ad-ext-player\.ad-ext-player-inactive\s+\.ad-ext-player-score,\s*#ad-ext-player-display\s+\.ad-ext-player:not\(\.ad-ext-player-active\):not\(\.ad-ext-player-winner\)\s+\.ad-ext-player-score\s*\{[^}]*font-size:\s*3em\s*!important;/s
  );
  assert.match(
    css,
    /#grid\s+\.label-cell,[^}]*#grid\s+tr\s*>\s*td:first-child,[^}]*#grid\s+tr\s*>\s*th:first-child\s*\{[^}]*background:\s*linear-gradient\(90deg,\s*rgba\(10,\s*17,\s*30,\s*0\.88\),\s*rgba\(8,\s*14,\s*25,\s*0\.86\)\)\s*!important;/s
  );
  assert.match(
    css,
    /#grid\s+tr\s*>\s*td:not\(:first-child\),\s*#grid\s+tr\s*>\s*th:not\(:first-child\)\s*\{[^}]*min-width:\s*var\(--ad-ext-theme-cricket-player-column-min-width\)\s*!important;[^}]*max-width:\s*var\(--ad-ext-theme-cricket-player-column-max-width\)\s*!important;[^}]*width:\s*clamp\(\s*var\(--ad-ext-theme-cricket-player-column-min-width\),\s*14vw,\s*var\(--ad-ext-theme-cricket-player-column-max-width\)\s*\)\s*!important;/s
  );
  assert.match(
    css,
    /\.css-rfeml4\s*>\s*div:nth-child\(odd\)\s*\{[^}]*background:\s*linear-gradient\(120deg,\s*rgba\(10,\s*18,\s*32,\s*0\.88\),\s*rgba\(8,\s*15,\s*28,\s*0\.9\)\)\s*!important;/s
  );
  assert.doesNotMatch(css, /rgba\(8,\s*56,\s*78,\s*0\.86\)/);
  assert.match(
    css,
    /\.ad-ext-theme-board-panel\s*\{[^}]*grid-template-rows:\s*minmax\(0,\s*1fr\)\s*!important;[^}]*position:\s*relative\s*!important;[^}]*overflow:\s*visible\s*!important;/s
  );
  assert.match(
    css,
    /\.ad-ext-theme-content-slot\s*\{[^}]*grid-template-columns:\s*minmax\(var\(--ad-ext-theme-cricket-player-area-required-width\),\s*1fr\)\s*minmax\(var\(--ad-ext-theme-cricket-board-min-width-auto\),\s*auto\)\s*!important;/s
  );
  assert.match(
    css,
    /\.ad-ext-theme-content-slot\.ad-ext-theme-cricket-board-forced-visible\s*\{[^}]*grid-template-columns:\s*minmax\(var\(--ad-ext-theme-cricket-player-area-required-width\),\s*1fr\)\s*minmax\(0,\s*var\(--ad-ext-theme-cricket-board-width,\s*var\(--ad-ext-theme-cricket-board-min-width-manual\)\)\)\s*!important;/s
  );
  assert.match(
    css,
    /\.ad-ext-theme-content-slot\.ad-ext-theme-cricket-board-hidden\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s*!important;/s
  );
  assert.match(
    css,
    /\.ad-ext-theme-content-slot\.ad-ext-theme-cricket-board-hidden\s*>\s*\.ad-ext-theme-content-board\s*\{[^}]*display:\s*none\s*!important;/s
  );
  assert.match(
    css,
    /\.ad-ext-theme-cricket-readability-notice\s*\{[^}]*display:\s*flex\s*!important;[^}]*justify-content:\s*space-between\s*!important;/s
  );
  assert.match(
    css,
    /\.ad-ext-theme-cricket-readability-toggle\s*\{[^}]*cursor:\s*pointer\s*!important;/s
  );
  assert.match(
    css,
    /\.ad-ext-theme-content-slot\s*\{[^}]*grid-column:\s*1\s*\/\s*-1\s*!important;[^}]*grid-row:\s*3\s*!important;/s
  );
  assert.match(
    css,
    /\.css-tkevr6\s*>\s*\.chakra-stack\s*>\s*\.ad-ext-theme-content-slot,\s*\.css-tkevr6\s+\.ad-ext-theme-content-slot\s*\{[^}]*justify-self:\s*stretch\s*!important;[^}]*max-width:\s*100%\s*!important;/s
  );
  assert.match(
    css,
    /\.ad-ext-theme-content-board\s*\{[^}]*grid-column:\s*2\s*!important;[^}]*display:\s*flex\s*!important;/s
  );
  assert.match(
    css,
    /\.ad-ext-theme-board-viewport\s*\{[^}]*padding-bottom:\s*0\s*!important;[^}]*display:\s*flex\s*!important;[^}]*overflow:\s*visible\s*!important;/s
  );
  assert.match(
    css,
    /\.ad-ext-theme-board-controls\s*\{[^}]*position:\s*absolute\s*!important;[^}]*top:\s*0\.5rem\s*!important;[^}]*right:\s*0\.5rem\s*!important;[^}]*bottom:\s*auto\s*!important;[^}]*left:\s*auto\s*!important;/s
  );
  assert.match(
    css,
    /\.ad-ext-theme-board-canvas\s*\{[^}]*flex:\s*0\s+0\s+auto\s*!important;[^}]*height:\s*var\(--ad-ext-theme-board-size,\s*100%\)\s*!important;[^}]*width:\s*var\(--ad-ext-theme-board-size,\s*100%\)\s*!important;[^}]*aspect-ratio:\s*1 \/ 1;[^}]*overflow:\s*visible\s*!important;/s
  );
  assert.match(
    css,
    /\.ad-ext-theme-board-canvas\s*>\s*\*\s*\{[^}]*width:\s*100%\s*!important;[^}]*height:\s*100%\s*!important;[^}]*max-width:\s*100%\s*!important;[^}]*max-height:\s*100%\s*!important;[^}]*display:\s*flex\s*!important;[^}]*justify-content:\s*center\s*!important;[^}]*overflow:\s*visible\s*!important;/s
  );
  assert.match(
    css,
    /\.ad-ext-theme-board-event-shell\s*\{[^}]*width:\s*var\(--ad-ext-theme-board-size,\s*100%\)\s*!important;[^}]*height:\s*var\(--ad-ext-theme-board-size,\s*100%\)\s*!important;[^}]*display:\s*grid\s*!important;[^}]*place-items:\s*center\s*!important;[^}]*position:\s*relative\s*!important;/s
  );
  assert.match(
    css,
    /\.ad-ext-theme-board-media-root\s*\{[^}]*width:\s*100%\s*!important;[^}]*height:\s*100%\s*!important;[^}]*display:\s*flex\s*!important;[^}]*justify-content:\s*center\s*!important;/s
  );
  assert.match(
    css,
    /\.ad-ext-theme-board-svg\[viewBox="0 0 1000 1000"\]\s*\{[^}]*width:\s*100%\s*!important;[^}]*height:\s*100%\s*!important;[^}]*max-width:\s*100%\s*!important;[^}]*max-height:\s*100%\s*!important;[^}]*aspect-ratio:\s*1 \/ 1;/s
  );
  assert.doesNotMatch(css, /width:\s*min\(100%,\s*100vh\)\s*!important;/);
  assert.doesNotMatch(css, /96cqw|96cqh/);
  assert.match(
    css,
    /#ad-ext-player-display\s*\{[^}]*display:\s*grid\s*!important;[^}]*grid-auto-flow:\s*column\s*!important;[^}]*grid-auto-columns:\s*minmax\(var\(--ad-ext-theme-cricket-player-card-min-width\),\s*1fr\)\s*!important;[^}]*min-width:\s*max-content\s*!important;/s
  );
  assert.match(
    css,
    /\.ad-ext-theme-content-slot\.ad-ext-theme-cricket-board-forced-visible\s*>\s*\.ad-ext-theme-content-board\s*\{[^}]*max-width:\s*var\(--ad-ext-theme-cricket-board-width,\s*var\(--ad-ext-theme-cricket-board-min-width-manual\)\)\s*!important;/s
  );
  assert.match(
    css,
    /\.ad-ext-theme-board-viewport\s*\{[^}]*width:\s*100%\s*!important;[^}]*min-width:\s*0\s*!important;[^}]*justify-content:\s*center\s*!important;[^}]*align-items:\s*center\s*!important;/s
  );
  assert.doesNotMatch(css, /div\.css-y3hfdd\s*\{[^}]*container-type:\s*size\s*!important;/s);
  assert.match(
    css,
    /grid-template-areas:\s*"header header"\s*"footer footer"\s*"players board"/
  );
  assert.doesNotMatch(css, /\.css-c04tlr\s*\{/);
  assert.doesNotMatch(css, /\.css-1f26ant\s*\{/);
  assert.doesNotMatch(css, /\[data-ad-theme-slot=/);
  assert.doesNotMatch(css, /\[data-ad-theme-layout-root=/);
  assert.doesNotMatch(css, /:has\(/);
});

test("cricket theme keeps row labels fully visible inside viewport", () => {
  const css = buildCricketThemeCss({ showAvg: true });

  assert.match(css, /p\.chakra-text\.css-1qlemha\s*\{[^}]*left:\s*0\s*!important;/s);
  assert.doesNotMatch(css, /left:\s*calc\(var\(--chakra-space-2\)\s*\*\s*-5\)/);
});

test("cricket theme strengthens tactical hierarchy without leaving stable hooks", () => {
  const css = buildCricketThemeCss({ showAvg: true });

  assert.match(css, /--ad-ext-cricket-card-glow:\s*rgba\(159,\s*232,\s*112,\s*0\.22\)/);
  assert.match(
    css,
    /#ad-ext-player-display\s+\.ad-ext-player\s*>\s*\.chakra-stack::before\s*\{[^}]*background:\s*linear-gradient\(135deg,\s*rgba\(255,\s*255,\s*255,\s*0\.06\),\s*rgba\(255,\s*255,\s*255,\s*0\)\s*32%\),/s
  );
  assert.match(
    css,
    /#ad-ext-player-display\s+\.ad-ext-player\.ad-ext-player-active\s*>\s*\.chakra-stack::after\s*\{[^}]*box-shadow:\s*inset 0 0 18px rgba\(159,\s*232,\s*112,\s*0\.08\),\s*0 0 24px var\(--ad-ext-cricket-card-glow\);/s
  );
  assert.match(
    css,
    /#ad-ext-player-display\s+\.ad-ext-player:not\(\.ad-ext-player-active\)\s*>\s*\.chakra-stack\s*\{[^}]*filter:\s*saturate\(0\.76\)\s*brightness\(0\.9\);/s
  );
  assert.doesNotMatch(
    css,
    /#ad-ext-player-display\s+\.ad-ext-player:not\(\.ad-ext-player-active\)\s*>\s*\.chakra-stack\s*\{[^}]*opacity:\s*0\.82;/s
  );
  assert.match(
    css,
    /\.ad-ext-theme-board-panel\s*\{[^}]*background:\s*transparent\s*!important;[^}]*border:\s*none\s*!important;[^}]*box-shadow:\s*none\s*!important;/s
  );
});

test("cricket highlighter style exposes full presentation contract", () => {
  const css = buildCricketHighlighterStyleText();

  assert.match(css, /\.ad-ext-cricket-target\s*\{[^}]*fill:\s*var\(--ad-ext-cricket-fill,\s*transparent\);/s);
  assert.match(css, /\.ad-ext-cricket-target\.is-open\s*\{[^}]*--ad-ext-cricket-fill:\s*var\(--ad-ext-cricket-open-fill\);/s);
  assert.match(css, /\.ad-ext-cricket-target\.is-dead\s*\{[^}]*--ad-ext-cricket-fill:\s*var\(--ad-ext-cricket-dead-fill\);/s);
  assert.match(css, /\.ad-ext-cricket-target\.is-inactive\s*\{[^}]*--ad-ext-cricket-fill:\s*var\(--ad-ext-cricket-inactive-fill\);/s);
  assert.match(css, /\.ad-ext-cricket-target\.is-scoring\s*\{[^}]*--ad-ext-cricket-fill:\s*var\(--ad-ext-cricket-scoring-fill\);/s);
  assert.match(css, /\.ad-ext-cricket-target\.is-pressure\s*\{[^}]*--ad-ext-cricket-fill:\s*var\(--ad-ext-cricket-pressure-fill\);/s);
  assert.doesNotMatch(css, /ad-ext-cricket-target-pulse/);
});

test("cricket grid fx style exposes badge and state hierarchy", () => {
  const css = buildCricketGridFxStyleText();

  assert.match(css, /\.ad-ext-crfx-root\s+\.ad-ext-crfx-label-cell,\s*\.ad-ext-crfx-root\s+\.ad-ext-crfx-badge\s*\{/s);
  assert.match(css, /\.ad-ext-crfx-root\s+\.ad-ext-crfx-badge\s*\{[^}]*position:\s*absolute\s*!important;[^}]*left:\s*8px\s*!important;/s);
  assert.match(css, /\[data-ad-ext-crfx-label-hidden="true"\]\s*\{[^}]*color:\s*transparent\s*!important;/s);
  assert.match(css, /\.ad-ext-crfx-root\s+\.ad-ext-crfx-badge\.ad-ext-crfx-badge-burst\s*\{[^}]*animation:\s*ad-ext-crfx-badge-burst 700ms ease;/s);
  assert.match(css, /\.ad-ext-crfx-root\s+\.ad-ext-crfx-cell\.ad-ext-crfx-score\s*\{[^}]*repeating-linear-gradient\(/s);
  assert.match(css, /\.ad-ext-crfx-root\s+\.ad-ext-crfx-cell\.ad-ext-crfx-pressure\s*\{[^}]*repeating-linear-gradient\(/s);
  assert.match(css, /\.ad-ext-crfx-root\s+\.ad-ext-crfx-cell\.ad-ext-crfx-open\s*\{[^}]*linear-gradient\(/s);
  assert.match(css, /\.ad-ext-crfx-root\s+\.ad-ext-crfx-cell\.ad-ext-crfx-open-inactive\s*\{[^}]*linear-gradient\(/s);
  assert.match(css, /\.ad-ext-crfx-root\s+\.ad-ext-crfx-cell\.ad-ext-crfx-active-column\s*\{[^}]*linear-gradient\(/s);
  assert.match(css, /\.ad-ext-crfx-root\s+\.ad-ext-crfx-cell\.ad-ext-crfx-open-active\s*\{[^}]*linear-gradient\(/s);
  assert.match(css, /\.ad-ext-crfx-root\s+\.ad-ext-crfx-mark-progress\s*\{[^}]*animation:\s*ad-ext-crfx-mark 420ms cubic-bezier\(0\.2,\s*0\.8,\s*0\.2,\s*1\);/s);
  assert.match(css, /\.ad-ext-crfx-root\s+\.ad-ext-crfx-delta\s*\{[^}]*font-size:\s*2\.22rem;/s);
  assert.doesNotMatch(css, /ad-ext-crfx-cell-active/);
  assert.doesNotMatch(css, /ad-ext-crfx-cell-inactive/);
});

test("cricket grid fx player-cell states override theme row backgrounds", () => {
  const css = buildCricketGridFxStyleText();

  assert.match(
    css,
    /\.ad-ext-crfx-root\s+\.ad-ext-crfx-cell\.ad-ext-crfx-score\s*\{[^}]*background:\s*linear-gradient\([^}]*\)\s*!important;/s
  );
  assert.match(
    css,
    /\.ad-ext-crfx-root\s+\.ad-ext-crfx-cell\.ad-ext-crfx-threat\s*\{[^}]*background:\s*linear-gradient\([^}]*repeating-linear-gradient\([^}]*\)\s*!important;/s
  );
  assert.match(
    css,
    /\.ad-ext-crfx-root\s+\.ad-ext-crfx-cell\.ad-ext-crfx-pressure\s*\{[^}]*background:\s*linear-gradient\([^}]*repeating-linear-gradient\([^}]*\)\s*!important;/s
  );
});
