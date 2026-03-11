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
    /#grid\s+\.label-cell,[^}]*#grid\s+tr\s*>\s*td:first-child,[^}]*#grid\s+tr\s*>\s*th:first-child\s*\{[^}]*background:\s*linear-gradient\(90deg,\s*rgba\(10,\s*17,\s*30,\s*0\.88\),\s*rgba\(8,\s*14,\s*25,\s*0\.86\)\)\s*!important;/s
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
    /\.ad-ext-theme-content-slot\s*\{[^}]*grid-template-columns:\s*minmax\(18rem,\s*clamp\(22rem,\s*34vw,\s*38rem\)\)\s*minmax\(0,\s*1fr\)\s*!important;/s
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
    /\.ad-ext-theme-board-svg\[viewBox="0 0 1000 1000"\]\s*\{[^}]*width:\s*100%\s*!important;[^}]*height:\s*100%\s*!important;[^}]*max-width:\s*100%\s*!important;[^}]*max-height:\s*100%\s*!important;[^}]*aspect-ratio:\s*1 \/ 1;/s
  );
  assert.doesNotMatch(css, /width:\s*min\(100%,\s*100vh\)\s*!important;/);
  assert.doesNotMatch(css, /96cqw|96cqh/);
  assert.match(
    css,
    /#ad-ext-player-display\s*\{[^}]*display:\s*grid\s*!important;[^}]*grid-auto-flow:\s*column\s*!important;[^}]*grid-auto-columns:\s*minmax\(0,\s*1fr\)\s*!important;/s
  );
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
