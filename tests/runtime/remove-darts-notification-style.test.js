import test from "node:test";
import assert from "node:assert/strict";

import {
  CARD_CLASS,
  IMAGE_CLASS,
  buildStyleText,
} from "../../src/features/remove-darts-notification/style.js";

test("remove-darts-notification style hardens transparent image rendering and pulse animation", () => {
  const css = buildStyleText({
    imageSizePreset: {
      imageMaxWidthRem: 30,
      imageMaxWidthVw: 90,
    },
    pulseAnimation: true,
    pulseScale: 1.08,
    pulseDurationMs: 1400,
  });

  assert.equal(css.includes(`.${CARD_CLASS}::before,`), true);
  assert.equal(css.includes(`.${CARD_CLASS}::after {`), true);
  assert.equal(css.includes("content: none !important;"), true);
  assert.equal(css.includes("background-color: transparent !important;"), true);
  assert.equal(css.includes("display: block !important;"), true);
  assert.equal(css.includes("object-fit: contain !important;"), true);
  assert.equal(css.includes("animation: ad-ext-takeout-pulse 1400ms ease-in-out infinite !important;"), true);
  assert.equal(css.includes("transform: translateZ(0);"), true);
  assert.equal(css.includes("50% { transform: scale(1.08); opacity: 0.95; }"), true);
});
