import test from "node:test";
import assert from "node:assert/strict";

import {
  PREVIEW_PLACEMENT,
  buildCricketThemeCss,
} from "../../src/features/themes/cricket/style.js";

test("cricket theme uses standard preview placement and board-first layout rules", () => {
  const css = buildCricketThemeCss({ showAvg: true });

  assert.equal(PREVIEW_PLACEMENT.mode, "standard");
  assert.doesNotMatch(css, /ad-ext-turn-preview-space/);
  assert.match(css, /grid-template-columns:\s*0\.92fr 1\.08fr\s*!important;/);
  assert.match(css, /width:\s*min\(100%,\s*86vh\)\s*!important;/);
  assert.doesNotMatch(
    css,
    /grid-template-areas:\s*"header header"\s*"footer board"\s*"players board"/
  );
});

test("cricket theme css no longer contains fragile legacy layout hardcodes", () => {
  const css = buildCricketThemeCss({ showAvg: true });

  assert.doesNotMatch(css, /calc\(92%\s*-\s*185px\)/);
  assert.doesNotMatch(css, /calc\(100%\s*-\s*230px\)/);
  assert.doesNotMatch(css, /height:\s*80%\s*!important/);
  assert.doesNotMatch(css, /left:\s*calc\(var\(--chakra-space-2\)\s*\*\s*-5\)/);
});
