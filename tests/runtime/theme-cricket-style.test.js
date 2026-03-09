import test from "node:test";
import assert from "node:assert/strict";

import {
  PREVIEW_PLACEMENT,
  buildCricketThemeCss,
} from "../../src/features/themes/cricket/style.js";

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
    /#grid\s+\.label-cell,[^}]*#grid\s+tr\s*>\s*td:first-child,[^}]*#grid\s+tr\s*>\s*th:first-child\s*\{[^}]*background:\s*linear-gradient\(115deg,\s*rgba\(8,\s*56,\s*78,\s*0\.86\),\s*rgba\(7,\s*39,\s*58,\s*0\.88\)\)\s*!important;/s
  );
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
