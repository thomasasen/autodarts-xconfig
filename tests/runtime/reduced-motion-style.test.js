import test from "node:test";
import assert from "node:assert/strict";

import { buildStyleText as buildCheckoutBoardTargetStyleText } from "../../src/features/checkout-board-targets/style.js";
import { buildStyleText as buildCheckoutScorePulseStyleText } from "../../src/features/checkout-score-pulse/style.js";
import { buildStyleText as buildDartMarkerDartsStyleText } from "../../src/features/dart-marker-darts/style.js";
import { buildStyleText as buildX01ScoreProgressStyleText } from "../../src/features/x01-score-progress/style.js";

test("motion-heavy feature styles include reduced-motion fallbacks", () => {
  const styles = [
    buildCheckoutBoardTargetStyleText(),
    buildCheckoutScorePulseStyleText(),
    buildDartMarkerDartsStyleText(),
    buildX01ScoreProgressStyleText(),
  ];

  styles.forEach((css) => {
    assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
    assert.equal(css.includes("animation: none !important;"), true);
    assert.equal(css.includes("transition: none !important;"), true);
  });
});
