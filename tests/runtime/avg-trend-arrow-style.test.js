import test from "node:test";
import assert from "node:assert/strict";

import {
  ARROW_HALF_WIDTH_VAR,
  ARROW_HEIGHT_VAR,
  ARROW_MARGIN_LEFT_VAR,
  buildStyleText,
} from "../../src/features/avg-trend-arrow/style.js";

test("average trend arrow size presets define CSS variables for theme scaling", () => {
  const smallCss = buildStyleText({
    durationMs: 320,
    size: "klein",
  });

  assert.match(smallCss, new RegExp(`${ARROW_MARGIN_LEFT_VAR}: 0\\.18em;`));
  assert.match(smallCss, new RegExp(`${ARROW_HALF_WIDTH_VAR}: 0\\.25em;`));
  assert.match(smallCss, new RegExp(`${ARROW_HEIGHT_VAR}: 0\\.4em;`));
  assert.match(smallCss, new RegExp(`margin-left: var\\(${ARROW_MARGIN_LEFT_VAR}\\);`));
  assert.match(smallCss, new RegExp(`border-left: var\\(${ARROW_HALF_WIDTH_VAR}\\) solid transparent;`));
  assert.match(smallCss, new RegExp(`border-bottom: var\\(${ARROW_HEIGHT_VAR}\\) solid #9fdb58;`));

  const standardCss = buildStyleText({ durationMs: 320, size: "standard" });
  assert.match(standardCss, new RegExp(`${ARROW_MARGIN_LEFT_VAR}: 0\\.24em;`));
  assert.match(standardCss, new RegExp(`${ARROW_HALF_WIDTH_VAR}: 0\\.32em;`));
  assert.match(standardCss, new RegExp(`${ARROW_HEIGHT_VAR}: 0\\.52em;`));
  assert.match(standardCss, /vertical-align: 0\.08em;/);
  assert.match(standardCss, /pointer-events: none;/);

  const largeCss = buildStyleText({ durationMs: 320, size: "gross" });
  assert.match(largeCss, new RegExp(`${ARROW_MARGIN_LEFT_VAR}: 0\\.3em;`));
  assert.match(largeCss, new RegExp(`${ARROW_HALF_WIDTH_VAR}: 0\\.4em;`));
  assert.match(largeCss, new RegExp(`${ARROW_HEIGHT_VAR}: 0\\.66em;`));
});
