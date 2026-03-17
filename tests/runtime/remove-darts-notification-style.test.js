import test from "node:test";
import assert from "node:assert/strict";

import {
  CARD_CLASS,
  HIDDEN_NOTICE_CLASS,
  IMAGE_CLASS,
  OVERLAY_ROOT_CLASS,
  OVERLAY_ROOT_ID,
  buildStyleText,
} from "../../src/features/remove-darts-notification/style.js";

test("remove-darts-notification style isolates the overlay, hides the host, and pulses only the card", () => {
  const css = buildStyleText({
    imageSizePreset: {
      imageMaxWidthRem: 30,
      imageMaxWidthVw: 90,
    },
    pulseAnimation: true,
    pulseScale: 1.08,
    pulseDurationMs: 1400,
  });

  assert.equal(css.includes(`.${HIDDEN_NOTICE_CLASS} {`), true);
  assert.equal(css.includes(`.${HIDDEN_NOTICE_CLASS}::before,`), true);
  assert.equal(css.includes(`.${HIDDEN_NOTICE_CLASS}::after {`), true);
  assert.equal(css.includes(`#${OVERLAY_ROOT_ID},`), true);
  assert.equal(css.includes(`.${OVERLAY_ROOT_CLASS} {`), true);
  assert.equal(css.includes("position: fixed !important;"), true);
  assert.equal(css.includes("display: none !important;"), true);
  assert.equal(css.includes("content: none !important;"), true);
  assert.equal(css.includes("animation: none !important;"), true);
  assert.equal(css.includes(`.${CARD_CLASS} {`), true);
  assert.equal(css.includes(`.${IMAGE_CLASS} {`), true);
  assert.equal(css.includes("display: block !important;"), true);
  assert.equal(css.includes("object-fit: contain !important;"), true);
  assert.equal(css.includes("animation: ad-ext-takeout-pulse 1400ms ease-in-out infinite !important;"), true);
  assert.equal(css.includes("transform: translateZ(0);"), true);
  assert.equal(css.includes("50% { transform: scale(1.08); opacity: 0.95; }"), true);
  assert.equal(css.includes(`.${CARD_CLASS} .${IMAGE_CLASS}`), false);
});

test("remove-darts-notification style maps image size presets onto the visible overlay image", () => {
  const compactCss = buildStyleText({
    imageSizePreset: {
      imageMaxWidthRem: 24,
      imageMaxWidthVw: 72,
    },
    pulseAnimation: true,
    pulseScale: 1.04,
    pulseDurationMs: 1400,
  });
  const largeCss = buildStyleText({
    imageSizePreset: {
      imageMaxWidthRem: 36,
      imageMaxWidthVw: 96,
    },
    pulseAnimation: true,
    pulseScale: 1.04,
    pulseDurationMs: 1400,
  });

  assert.equal(compactCss.includes("width: min(24rem, 72vw) !important;"), true);
  assert.equal(largeCss.includes("width: min(36rem, 96vw) !important;"), true);
  assert.equal(compactCss.includes("max-width: min(24rem, 72vw) !important;"), true);
  assert.equal(largeCss.includes("max-width: min(36rem, 96vw) !important;"), true);
});
