import test from "node:test";
import assert from "node:assert/strict";

import {
  HIT_ANIMATION_CLASS,
  HIT_ANIMATION_TRIGGER_CLASS,
  HIT_BASE_CLASS,
  HIT_KIND_CLASS,
  HIT_THEME_CLASS,
  buildStyleText,
} from "../../src/features/special-hit-highlights/style.js";

test("special-hit-highlights style defines centered text contract and strong row motion", () => {
  const css = buildStyleText();
  const baseBeforeBlock =
    css.match(
      new RegExp(
        String.raw`\.ad-ext-turn-throw\.${HIT_BASE_CLASS}::before\s*\{[^}]+\}`,
        "s"
      )
    )?.[0] || "";
  const baseAfterBlock =
    css.match(
      new RegExp(
        String.raw`\.ad-ext-turn-throw\.${HIT_BASE_CLASS}::after\s*\{[^}]+\}`,
        "s"
      )
    )?.[0] || "";
  const triggerBeforeBlock =
    css.match(
      new RegExp(
        String.raw`\.ad-ext-turn-throw\.${HIT_BASE_CLASS}\.${HIT_ANIMATION_TRIGGER_CLASS}::before\s*\{[^}]+\}`,
        "s"
      )
    )?.[0] || "";
  const triggerAfterBlock =
    css.match(
      new RegExp(
        String.raw`\.ad-ext-turn-throw\.${HIT_BASE_CLASS}\.${HIT_ANIMATION_TRIGGER_CLASS}::after\s*\{[^}]+\}`,
        "s"
      )
    )?.[0] || "";

  assert.equal(css.includes(`.ad-ext-turn-throw.${HIT_BASE_CLASS} > p,`), true);
  assert.equal(css.includes("position: absolute !important;"), true);
  assert.equal(css.includes("display: flex !important;"), true);

  assert.equal(css.includes("@keyframes ad-ext-hit-row-pop-hit"), true);
  assert.equal(css.includes("@keyframes ad-ext-hit-row-side-shake"), true);
  assert.equal(css.includes("@keyframes ad-ext-hit-row-glow-pop"), true);
  assert.equal(css.includes("@keyframes ad-ext-hit-row-flip-spin"), true);
  assert.equal(css.includes("@keyframes ad-ext-hit-row-light-sweep"), true);
  assert.equal(css.includes("ad-ext-hit-light-sweep-surface"), true);
  assert.equal(css.includes("rotateY(360deg)"), true);
  assert.equal(css.includes("@keyframes ad-ext-hit-row-electric-jolt"), true);
  assert.equal(css.includes("@keyframes ad-ext-hit-score-electric-jolt"), true);
  assert.equal(css.includes("overflow: hidden;"), true);
  assert.equal(css.includes("overflow: visible;"), true);
  assert.equal(css.includes("url(#ad-ext-electric-displace-strong)"), true);
  assert.equal(css.includes("ad-ext-hit-electric-jolt-frame-electric"), true);
  assert.equal(css.includes("ad-ext-hit-electric-jolt-frame-glow"), true);
  assert.equal(css.includes("ad-ext-hit-electric-jolt-frame-aura"), true);
  assert.equal(
    css.includes(
      `.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_ANIMATION_CLASS["electric-jolt"]}.ad-ext-hit-highlight--animate`
    ),
    true
  );

  assert.equal(css.includes(".ad-ext-hit-highlight--idle.ad-ext-hit-animation--"), false);
  assert.equal(css.includes("@keyframes ad-ext-hit-gradient-flow"), true);
  assert.equal(css.includes("--ad-ext-hit-surface-a:"), true);
  assert.equal(baseBeforeBlock.includes("animation:"), false);
  assert.equal(baseAfterBlock.includes("animation:"), false);
  assert.equal(triggerBeforeBlock.includes("ad-ext-hit-burst-surface"), true);
  assert.equal(triggerBeforeBlock.includes("ad-ext-hit-gradient-flow"), false);
  assert.equal(triggerAfterBlock.includes("ad-ext-hit-burst-border"), true);
  assert.equal(triggerAfterBlock.includes("ad-ext-hit-border-sweep"), false);

  assert.equal(
    css.includes(
      `.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_THEME_CLASS["kind-signal"]}.${HIT_KIND_CLASS.triple}`
    ),
    true
  );
  assert.equal(css.includes("--ad-ext-hit-theme-b: #7f1124;"), true);
  assert.equal(css.includes("--ad-ext-hit-theme-c: #c62828;"), true);

  assert.equal(
    css.includes(
      `.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_THEME_CLASS["kind-signal"]}.${HIT_KIND_CLASS.double}`
    ),
    true
  );
  assert.equal(css.includes("--ad-ext-hit-theme-b: #0d4f9b;"), true);
  assert.equal(css.includes("--ad-ext-hit-theme-c: #1976d2;"), true);

  assert.equal(
    css.includes(
      `.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_THEME_CLASS["kind-signal"]}.${HIT_KIND_CLASS.bullOuter}`
    ),
    true
  );
  assert.equal(
    css.includes(
      `.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_THEME_CLASS["kind-signal"]}.${HIT_KIND_CLASS.bullInner}`
    ),
    true
  );
  assert.equal(css.includes("--ad-ext-hit-theme-b: #1b7a34;"), true);
  assert.equal(css.includes("--ad-ext-hit-theme-c: #2eaf50;"), true);
});

test("special-hit-highlights keeps displacement filter scoped to electric-jolt selectors", () => {
  const css = buildStyleText();
  const pulseBlock =
    css.match(
      new RegExp(
        String.raw`\.ad-ext-turn-throw\.${HIT_BASE_CLASS}\.ad-ext-hit-animation--glow-pop\.ad-ext-hit-highlight--animate\{[^}]+\}`,
        "s"
      )
    )?.[0] || "";

  assert.equal(css.includes("url(#ad-ext-electric-displace-soft)"), true);
  assert.equal(pulseBlock.includes("filter: var(--ad-ext-hit-electric-filter"), false);
});
