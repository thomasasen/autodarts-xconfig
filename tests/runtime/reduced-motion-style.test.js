import test from "node:test";
import assert from "node:assert/strict";

import {
  EFFECT_CLASSES as CHECKOUT_SCORE_EFFECT_CLASSES,
  buildStyleText as buildCheckoutScoreHighlightStyleText,
} from "../../src/features/checkout-score-highlight/style.js";
import { buildStyleText as buildDartMarkerReplacerStyleText } from "../../src/features/dart-marker-replacer/style.js";
import { buildStyleText as buildX01RemainingScoreBarStyleText } from "../../src/features/x01-remaining-score-bar/style.js";

test("automatic motion-heavy feature styles include reduced-motion fallbacks", () => {
  // Explicitly selected checkout motion is validated separately below.
  const styles = [
    buildDartMarkerReplacerStyleText(),
    buildX01RemainingScoreBarStyleText(),
  ];

  styles.forEach((css) => {
    assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
    assert.equal(css.includes("animation: none !important;"), true);
    assert.equal(css.includes("transition: none !important;"), true);
  });
});

test("explicitly selected checkout score effects keep their animation and override theme colors", () => {
  const css = buildCheckoutScoreHighlightStyleText();

  assert.equal(css.includes("prefers-reduced-motion"), false);
  assert.match(css, /color: rgb\(var\(--ad-ext-checkout-pulse-color\)\) !important;/);
  assert.match(
    css,
    /main \.overflow-clip \.font-number\.overflow-hidden\.ad-ext-checkout-possible,\s*main \.bg-surface-surface > \.font-number\.ad-ext-checkout-possible \{[^}]*color: rgb\(var\(--ad-ext-checkout-pulse-color\)\) !important;/s
  );

  const expectedAnimations = {
    "grow-glow": "ad-ext-checkout-pulse 1.4s ease-in-out infinite",
    "glow-only": "ad-ext-checkout-glow 1.8s ease-in-out infinite",
    "grow-only": "ad-ext-checkout-scale 1.2s ease-in-out infinite",
    "fade-blink": "ad-ext-checkout-blink 0.9s ease-in-out infinite",
  };

  Object.entries(expectedAnimations).forEach(([effect, animation]) => {
    const effectClass = CHECKOUT_SCORE_EFFECT_CLASSES[effect];
    assert.match(css, new RegExp(`\\.${effectClass}\\s*\\{[^}]*animation: ${animation};`, "s"));
  });
});
