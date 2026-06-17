import test from "node:test";
import assert from "node:assert/strict";

import {
  ARROW_HALF_WIDTH_VAR,
  ARROW_HEIGHT_VAR,
  ARROW_MARGIN_LEFT_VAR,
  buildStyleText,
} from "../../src/features/avg-trend-arrow/style.js";
import { buildSharedPlayerDisplayCss } from "../../src/features/themes/shared/player-card-layout.js";

test("average trend arrow size presets define CSS variables for theme scaling", () => {
  const smallCss = buildStyleText({
    durationMs: 320,
    size: "klein",
  });

  assert.match(smallCss, new RegExp(`${ARROW_MARGIN_LEFT_VAR}: 4px;`));
  assert.match(smallCss, new RegExp(`${ARROW_HALF_WIDTH_VAR}: 4px;`));
  assert.match(smallCss, new RegExp(`${ARROW_HEIGHT_VAR}: 6px;`));
  assert.match(smallCss, new RegExp(`margin-left: var\\(${ARROW_MARGIN_LEFT_VAR}\\);`));
  assert.match(smallCss, new RegExp(`border-left: var\\(${ARROW_HALF_WIDTH_VAR}\\) solid transparent;`));
  assert.match(smallCss, new RegExp(`border-bottom: var\\(${ARROW_HEIGHT_VAR}\\) solid #9fdb58;`));

  const standardCss = buildStyleText({ durationMs: 320, size: "standard" });
  assert.match(standardCss, new RegExp(`${ARROW_HALF_WIDTH_VAR}: 5\\.5px;`));
  assert.match(standardCss, new RegExp(`${ARROW_HEIGHT_VAR}: 8\\.8px;`));

  const largeCss = buildStyleText({ durationMs: 320, size: "gross" });
  assert.match(largeCss, new RegExp(`${ARROW_HALF_WIDTH_VAR}: 6\\.6px;`));
  assert.match(largeCss, new RegExp(`${ARROW_HEIGHT_VAR}: 11px;`));
});

test("shared player card layout scales average trend arrow from feature-defined base variables", () => {
  const css = buildSharedPlayerDisplayCss();

  assert.match(
    css,
    /margin-left:\s*calc\(var\(--ad-ext-avg-trend-margin-left-base,\s*8px\)\s*\*\s*var\(--ad-ext-stat-scale\)\);/s
  );
  assert.match(
    css,
    /border-left:\s*calc\(var\(--ad-ext-avg-trend-arrow-half-width-base,\s*12px\)\s*\*\s*var\(--ad-ext-stat-scale\)\)\s*solid\s*transparent;/s
  );
  assert.match(
    css,
    /border-bottom:\s*calc\(var\(--ad-ext-avg-trend-arrow-height-base,\s*23px\)\s*\*\s*var\(--ad-ext-stat-scale\)\)\s*solid\s*#9fdb58;/s
  );
});
