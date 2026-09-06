import test from "node:test";
import assert from "node:assert/strict";

import { buildStyleText as buildCheckoutScoreHighlightStyleText } from "../../src/features/checkout-score-highlight/style.js";
import { buildStyleText as buildDartMarkerReplacerStyleText } from "../../src/features/dart-marker-replacer/style.js";
import { buildStyleText as buildX01RemainingScoreBarStyleText } from "../../src/features/x01-remaining-score-bar/style.js";

test("automatic motion-heavy feature styles include reduced-motion fallbacks", () => {
  // Explicitly selected checkout motion is covered by runtime-performance.test.js.
  const styles = [
    buildCheckoutScoreHighlightStyleText(),
    buildDartMarkerReplacerStyleText(),
    buildX01RemainingScoreBarStyleText(),
  ];

  styles.forEach((css) => {
    assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
    assert.equal(css.includes("animation: none !important;"), true);
    assert.equal(css.includes("transition: none !important;"), true);
  });
});
