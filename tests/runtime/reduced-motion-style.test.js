import test from "node:test";
import assert from "node:assert/strict";

import {
  EFFECT_CLASSES as CHECKOUT_SCORE_EFFECT_CLASSES,
  buildStyleText as buildCheckoutScoreHighlightStyleText,
} from "../../src/features/checkout-score-highlight/style.js";
import { buildStyleText as buildDartMarkerReplacerStyleText } from "../../src/features/dart-marker-replacer/style.js";
import { buildStyleText as buildSpecialHitHighlightsStyleText } from "../../src/features/special-hit-highlights/style.js";
import { buildStyleText as buildTakeOutDartsAlertStyleText } from "../../src/features/take-out-darts-alert/style.js";
import { buildStyleText as buildX01RemainingScoreBarStyleText } from "../../src/features/x01-remaining-score-bar/style.js";
import { styleText as xConfigShellStyleText } from "../../src/features/xconfig-ui/shell-style.js";

test("automatic motion-heavy feature styles include reduced-motion fallbacks", () => {
  // Explicitly selected motion is validated separately below.
  const styles = [buildDartMarkerReplacerStyleText()];

  styles.forEach((css) => {
    assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
    assert.equal(css.includes("animation: none !important;"), true);
    assert.equal(css.includes("transition: none !important;"), true);
  });
});

test("explicitly selected remaining score bar effects keep their animations", () => {
  const css = buildX01RemainingScoreBarStyleText();

  assert.equal(css.includes("prefers-reduced-motion"), false);

  const expectedAnimations = {
    "bar-pulse": "ad-ext-x01-remaining-score-bar-bar-pulse 1.22s cubic-bezier(.16,.9,.2,1) infinite",
    "glass-light-sweep":
      "ad-ext-x01-remaining-score-bar-glass-light-sweep-core 2.2s cubic-bezier(.18,.82,.18,1) infinite",
    "moving-segments": "ad-ext-x01-remaining-score-bar-moving-segments 1.08s steps(4,end) infinite",
    "fast-signal-sweep":
      "ad-ext-x01-remaining-score-bar-fast-signal-sweep-core 1.04s ease-in-out infinite",
  };

  Object.entries(expectedAnimations).forEach(([effect, animation]) => {
    const selector = `.ad-ext-x01-remaining-score-bar__fill--effect-${effect}{`;
    const ruleStartIndex = css.indexOf(selector);
    const ruleEndIndex = css.indexOf("}", ruleStartIndex);
    const rule = css.slice(ruleStartIndex, ruleEndIndex + 1);

    assert.notEqual(ruleStartIndex, -1);
    assert.equal(rule.includes(`animation:${animation};`), true);
  });
});

test("explicitly selected hit and take-out effects ignore reduced-motion preferences", () => {
  const hitCss = buildSpecialHitHighlightsStyleText();
  const takeOutCss = buildTakeOutDartsAlertStyleText({
    pulseAnimation: true,
    pulseScale: 1.08,
    pulseDurationMs: 1400,
  });

  assert.equal(hitCss.includes("prefers-reduced-motion"), false);
  assert.equal(takeOutCss.includes("prefers-reduced-motion"), false);
  assert.equal(
    takeOutCss.includes("animation: ad-ext-takeout-pulse 1400ms ease-in-out infinite !important;"),
    true
  );
  assert.doesNotMatch(
    xConfigShellStyleText,
    /@media\(prefers-reduced-motion:reduce\)\{[^}]*\.ad-xconfig-option-item--effect-preview[^}]*animation:none!important/
  );
  assert.match(
    xConfigShellStyleText,
    /\.ad-xconfig-option-item\[data-preview-effect="pop-hit"\]:hover[^}]*animation:ad-xconfig-effect-preview-emphasis/
  );
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
