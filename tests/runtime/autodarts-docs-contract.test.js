import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  AUTODARTS_CRICKET_GAME_MODE_TERMS,
  AUTODARTS_CRICKET_SCORING_MODE_TERMS,
  AUTODARTS_DOC_SOURCE_URLS,
  AUTODARTS_NON_TAKEOUT_NOTICE_TEXTS,
  AUTODARTS_TAKEOUT_NOTICE_TEXTS,
  AUTODARTS_X01_OUT_MODE_TERMS,
} from "../../src/shared/autodarts-doc-terms.js";
import { classifyRemoveDartsNoticeText } from "../../src/features/remove-darts-notification/logic.js";
import {
  classifyCricketGameMode,
  classifyCricketScoringMode,
  isX01VariantText,
} from "../../src/domain/variant-rules.js";
import { isCheckoutPossibleFromScoreForOutMode } from "../../src/domain/x01-rules.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");
const fixturePath = path.resolve(repoRoot, "tests", "fixtures", "autodarts-docs-terms.json");
const fixture = JSON.parse(readFileSync(fixturePath, "utf8"));

test("autodarts docs fixture stays aligned with source-term constants", () => {
  assert.deepEqual(fixture.sources, AUTODARTS_DOC_SOURCE_URLS);
  assert.deepEqual(fixture.removeDarts.positive, AUTODARTS_TAKEOUT_NOTICE_TEXTS);
  assert.deepEqual(fixture.removeDarts.negative, AUTODARTS_NON_TAKEOUT_NOTICE_TEXTS);
  assert.deepEqual(fixture.x01.outModes, AUTODARTS_X01_OUT_MODE_TERMS);
  assert.deepEqual(fixture.cricket.gameModes, AUTODARTS_CRICKET_GAME_MODE_TERMS);
  assert.deepEqual(
    fixture.cricket.scoringModes.standard.concat(fixture.cricket.scoringModes.cutthroat),
    AUTODARTS_CRICKET_SCORING_MODE_TERMS
  );
});

test("remove-darts notice classifier accepts official takeout terms and rejects throw states", () => {
  fixture.removeDarts.positive.forEach((text) => {
    assert.notEqual(classifyRemoveDartsNoticeText(text), "", `expected match for "${text}"`);
  });

  fixture.removeDarts.negative.forEach((text) => {
    assert.equal(classifyRemoveDartsNoticeText(text), "", `expected ignore for "${text}"`);
  });
});

test("x01 terms from fixture are recognized by variant/out-mode classifiers", () => {
  fixture.x01.variantExamples.forEach((variantText) => {
    assert.equal(
      isX01VariantText(variantText, { allowNumeric: true }),
      true,
      `variant should be recognized: ${variantText}`
    );
  });

  assert.equal(isCheckoutPossibleFromScoreForOutMode(1, "Straight"), true);
  assert.equal(isCheckoutPossibleFromScoreForOutMode(1, "Double"), false);
  assert.equal(isCheckoutPossibleFromScoreForOutMode(3, "Master"), true);
});

test("cricket terms from fixture are recognized by game/scoring classifiers", () => {
  const [cricketTerm, tacticsTerm] = fixture.cricket.gameModes;
  assert.equal(classifyCricketGameMode(cricketTerm), "cricket");
  assert.equal(classifyCricketGameMode(tacticsTerm), "tactics");

  fixture.cricket.scoringModes.standard.forEach((term) => {
    assert.equal(classifyCricketScoringMode(term), "standard");
  });
  fixture.cricket.scoringModes.cutthroat.forEach((term) => {
    assert.equal(classifyCricketScoringMode(term), "cutthroat");
  });
});
