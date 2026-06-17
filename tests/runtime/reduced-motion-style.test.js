import test from "node:test";
import assert from "node:assert/strict";

import { buildStyleText as buildCheckoutBoardTargetStyleText } from "../../src/features/checkout-target-highlights/style.js";
import { buildStyleText as buildCheckoutScoreHighlightStyleText } from "../../src/features/checkout-score-highlight/style.js";
import { buildStyleText as buildDartMarkerReplacerStyleText } from "../../src/features/dart-marker-replacer/style.js";
import { buildStyleText as buildX01RemainingScoreBarStyleText } from "../../src/features/x01-remaining-score-bar/style.js";

test("motion-heavy feature styles include reduced-motion fallbacks", () => {
  const styles = [
    buildCheckoutBoardTargetStyleText(),
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
