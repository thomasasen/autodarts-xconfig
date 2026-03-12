import test from "node:test";
import assert from "node:assert/strict";

import {
  HIT_ANIMATION_CLASS,
  HIT_BASE_CLASS,
  HIT_IDLE_LOOP_CLASS,
  buildStyleText,
} from "../../src/features/triple-double-bull-hits/style.js";

test("triple-double-bull-hits style defines centered text contract and strong row motion", () => {
  const css = buildStyleText();

  assert.equal(css.includes(`.ad-ext-turn-throw.${HIT_BASE_CLASS} > p,`), true);
  assert.equal(css.includes("position: absolute !important;"), true);
  assert.equal(css.includes("display: flex !important;"), true);

  assert.equal(css.includes("@keyframes ad-ext-hit-row-card-slam"), true);
  assert.equal(css.includes("rotateX(-360deg)"), true);
  assert.equal(css.includes("@keyframes ad-ext-hit-row-flip-edge"), true);
  assert.equal(css.includes("rotateY(360deg)"), true);

  assert.equal(
    css.includes(`.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_IDLE_LOOP_CLASS}.${HIT_ANIMATION_CLASS["neon-pulse"]}`),
    true
  );
  assert.equal(
    css.includes(`.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_IDLE_LOOP_CLASS}.${HIT_ANIMATION_CLASS["outline-trace"]}`),
    true
  );
  assert.equal(css.includes("@keyframes ad-ext-hit-gradient-flow"), true);
  assert.equal(css.includes("--ad-ext-hit-surface-a:"), true);
});
