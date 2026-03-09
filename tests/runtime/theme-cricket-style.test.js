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
  assert.match(
    css,
    /\.ad-ext-theme-board-panel\s*\{[^}]*grid-template-rows:\s*auto minmax\(0,\s*1fr\)\s*!important;/s
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
    /\.ad-ext-theme-board-viewport\s*\{[^}]*padding-bottom:\s*0\s*!important;[^}]*display:\s*flex\s*!important;/s
  );
  assert.match(
    css,
    /\.ad-ext-theme-board-svg\[viewBox="0 0 1000 1000"\]\s*\{[^}]*aspect-ratio:\s*1 \/ 1;/s
  );
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
