import test from "node:test";
import assert from "node:assert/strict";

import {
  PREVIEW_PLACEMENT as PREVIEW_X01,
  buildX01ThemeCss,
} from "../../src/features/themes/x01/style.js";
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
import { commonLayoutCss } from "../../src/features/themes/shared/common-css.js";

function assertNoFragileLayoutSelectors(cssText) {
  assert.doesNotMatch(cssText, /\[data-ad-theme-slot=/);
  assert.doesNotMatch(cssText, /\[data-ad-theme-layout-root=/);
  assert.doesNotMatch(cssText, /:has\(/);
}

test("x01 theme keeps oldrepo preview and stat scaling anchors", () => {
  const css = buildX01ThemeCss({ showAvg: true });

  assert.equal(PREVIEW_X01.mode, "under-throws");
  assert.match(css, /ad-ext-turn-preview-space/);
  assert.match(css, /--ad-ext-stat-scale:\s*0\.6/);
  assert.match(
    css,
    /ad-ext-avg-trend-arrow\.ad-ext-avg-trend-up\s*\{[^}]*border-bottom:\s*calc\(23px \* var\(--ad-ext-stat-scale\)\)\s*solid\s*#9fdb58;/s
  );
  assertNoFragileLayoutSelectors(css);
});

test("shanghai and bermuda stay under-throws and keep oldrepo preview behavior", () => {
  const shanghaiCss = buildShanghaiThemeCss({ showAvg: false });
  const bermudaCss = buildBermudaThemeCss({});

  assert.equal(PREVIEW_SHANGHAI.mode, "under-throws");
  assert.equal(PREVIEW_BERMUDA.mode, "under-throws");
  assert.match(shanghaiCss, /ad-ext-turn-preview-space/);
  assert.match(bermudaCss, /ad-ext-turn-preview-space/);
  assert.match(shanghaiCss, /ad-ext-avg-trend-arrow\s*\{\s*display:\s*none\s*!important;/);
  assertNoFragileLayoutSelectors(shanghaiCss);
  assertNoFragileLayoutSelectors(bermudaCss);
});

test("bull-off keeps oldrepo board-first grid and no preview spacer", () => {
  const css = buildBullOffThemeCss({ contrastPreset: "standard" });

  assert.equal(PREVIEW_BULL_OFF.mode, "standard");
  assert.doesNotMatch(css, /ad-ext-turn-preview-space/);
  assert.match(css, /grid-template-columns:\s*0\.94fr 1\.06fr\s*!important;/);
  assert.match(
    css,
    /\.css-1kejrvi,\s*\.css-14xtjvc\s*\{[^}]*grid-row-start:\s*2\s*!important;[^}]*grid-row-end:\s*4\s*!important;/s
  );
  assertNoFragileLayoutSelectors(css);
});

test("shared common layout keeps oldrepo baseline grid contract", () => {
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
    /\.ad-ext-theme-board-panel\s*\{[^}]*grid-template-rows:\s*auto minmax\(0,\s*1fr\)\s*!important;/s
  );
  assert.match(
    commonLayoutCss,
    /\.ad-ext-theme-content-slot\s*\{[^}]*grid-template-columns:\s*minmax\(20rem,\s*0\.95fr\)\s*minmax\(0,\s*1\.05fr\)\s*!important;/s
  );
  assert.match(
    commonLayoutCss,
    /\.ad-ext-theme-content-board\s*\{[^}]*grid-column:\s*2\s*!important;[^}]*display:\s*flex\s*!important;/s
  );
  assert.match(
    commonLayoutCss,
    /\.ad-ext-theme-board-svg\[viewBox="0 0 1000 1000"\]\s*\{[^}]*aspect-ratio:\s*1 \/ 1;/s
  );
  assertNoFragileLayoutSelectors(commonLayoutCss);
});
