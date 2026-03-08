import test from "node:test";
import assert from "node:assert/strict";

import {
  classifyCricketGameMode,
  classifyCricketScoringMode,
  classifyVariantFamily,
  isCricketVariantText,
  isX01VariantText,
  normalizeVariant,
} from "../../src/domain/variant-rules.js";

test("normalizeVariant trims and lowercases text", () => {
  assert.equal(normalizeVariant("  X01   501  "), "x01 501");
  assert.equal(normalizeVariant(""), "");
});

test("classifyCricketGameMode handles cricket, tactics and hidden cricket", () => {
  assert.equal(classifyCricketGameMode("Cricket"), "cricket");
  assert.equal(classifyCricketGameMode("Tactics Match"), "tactics");
  assert.equal(classifyCricketGameMode("Hidden Cricket"), "hidden-cricket");
  assert.equal(classifyCricketGameMode("Shanghai"), "");
});

test("classifyCricketScoringMode separates standard, cut-throat and neutral families", () => {
  assert.equal(classifyCricketScoringMode("standard"), "standard");
  assert.equal(classifyCricketScoringMode("Cut Throat"), "cutthroat");
  assert.equal(classifyCricketScoringMode("cut-throat"), "cutthroat");
  assert.equal(classifyCricketScoringMode("practice"), "neutral");
  assert.equal(classifyCricketScoringMode("no-score"), "neutral");
  assert.equal(classifyCricketScoringMode("mystery"), "unknown");
});

test("isX01VariantText supports direct and numeric X01 modes", () => {
  assert.equal(isX01VariantText("x01"), true);
  assert.equal(isX01VariantText("501", { allowNumeric: true }), true);
  assert.equal(isX01VariantText("501", { allowNumeric: false }), false);
  assert.equal(isX01VariantText("", { allowMissing: true }), true);
});

test("isCricketVariantText excludes hidden cricket unless explicitly enabled", () => {
  assert.equal(isCricketVariantText("Cricket"), true);
  assert.equal(isCricketVariantText("Tactics"), true);
  assert.equal(isCricketVariantText("Hidden Cricket"), false);
  assert.equal(
    isCricketVariantText("Hidden Cricket", { includeHiddenCricket: true }),
    true
  );
});

test("classifyVariantFamily identifies expected high-level families", () => {
  assert.equal(classifyVariantFamily("x01"), "x01");
  assert.equal(classifyVariantFamily("Cricket"), "cricket");
  assert.equal(classifyVariantFamily("Tactics"), "tactics");
  assert.equal(classifyVariantFamily("Hidden Cricket"), "unknown");
  assert.equal(
    classifyVariantFamily("Hidden Cricket", { includeHiddenCricket: true }),
    "hidden-cricket"
  );
});
