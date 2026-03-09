import test from "node:test";
import assert from "node:assert/strict";

import {
  PREVIEW_PLACEMENT,
  buildCricketThemeCss,
} from "../../src/features/themes/cricket/style.js";

test("cricket theme uses standard preview placement with oldrepo-aligned layout rules", () => {
  const css = buildCricketThemeCss({ showAvg: true });

  assert.equal(PREVIEW_PLACEMENT.mode, "standard");
  assert.doesNotMatch(css, /ad-ext-turn-preview-space/);
  assert.match(css, /\.css-1k7iu8k\s*\{\s*max-width:\s*96%/);
  assert.match(css, /\.css-c04tlr\s*\{\s*height:\s*calc\(92%\s*-\s*185px\)\s*!important;/);
  assert.match(css, /\.css-1f26ant\s*\{\s*height:\s*calc\(100%\s*-\s*230px\)/);
  assert.match(css, /\.css-1f26ant\s*>\s*div\s*\{\s*height:\s*80%\s*!important;/);
  assert.match(
    css,
    /grid-template-areas:\s*"header header"\s*"footer footer"\s*"players board"/
  );
  assert.match(css, /\.css-1kejrvi,\s*\.css-14xtjvc\s*\{/);
  assert.doesNotMatch(css, /\[data-ad-theme-slot=/);
  assert.doesNotMatch(css, /\[data-ad-theme-layout-root=/);
  assert.doesNotMatch(css, /:has\(/);
});

test("cricket theme keeps row labels fully visible inside viewport", () => {
  const css = buildCricketThemeCss({ showAvg: true });

  assert.match(css, /p\.chakra-text\.css-1qlemha\s*\{[^}]*left:\s*0\s*!important;/s);
  assert.doesNotMatch(css, /left:\s*calc\(var\(--chakra-space-2\)\s*\*\s*-5\)/);
});
