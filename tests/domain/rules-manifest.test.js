import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  applyCricketThrowsToState,
  createEmptyMarksByLabel,
} from "../../src/domain/cricket-rules.js";
import {
  applyX01ThrowsToState,
  normalizeOutMode,
} from "../../src/domain/x01-rules.js";

const manifestUrl = new URL("../fixtures/rules/steel-dart-rules.json", import.meta.url);

test("steel-dart rules manifest keeps sources, scopes and examples machine-readable", async () => {
  const manifest = JSON.parse(await readFile(manifestUrl, "utf8"));
  const ruleIds = [];

  assert.equal(manifest.schemaVersion, 1);
  assert.match(manifest.verifiedAt, /^\d{4}-\d{2}-\d{2}$/);
  assert.deepEqual(manifest.profiles.pdcDraX01.outModes, ["double"]);
  assert.deepEqual(manifest.profiles.autodartsX01.outModes, ["straight", "double", "master"]);
  assert.equal(manifest.profiles.autodartsCricket.maxDartsPerVisit, 3);
  assert.equal(manifest.profiles.xconfigTactics.maxDartsPerVisit, 3);
  assert.equal(manifest.profiles.xconfigTactics.targets.length, 12);
  assert.deepEqual(manifest.profiles.xconfigTactics.compatibilityOnlyTargets, ["DOUBLE", "TRIPLE"]);

  Object.values(manifest.profiles).forEach((profile) => {
    profile.rules.forEach((rule) => {
      assert.equal(typeof manifest.sources[rule.source]?.scope, "string", `${rule.id}: source scope`);
      assert.ok(rule.examples.length > 0, `${rule.id}: examples`);
      assert.ok(rule.counterExamples.length > 0, `${rule.id}: counterexamples`);
      const sectionReferences = [rule.section, ...(rule.sections || [])].filter(Boolean);
      sectionReferences.forEach((section) => {
        assert.ok(
          manifest.sources[rule.source].sections?.includes(section),
          `${rule.id}: unknown source section ${section}`
        );
      });
      ruleIds.push(rule.id);
    });
  });

  assert.equal(new Set(ruleIds).size, ruleIds.length, "rule ids must be unique");
});

test("steel-dart rules manifest drives executable X01 and Cricket conformance cases", async () => {
  const manifest = JSON.parse(await readFile(manifestUrl, "utf8"));

  manifest.conformanceCases.outModes.forEach(({ input, expected }) => {
    assert.equal(normalizeOutMode(input), expected, `out mode ${input}`);
  });

  manifest.conformanceCases.x01Visits.forEach(({ id, expected, ...options }) => {
    const result = applyX01ThrowsToState(options);
    Object.entries(expected).forEach(([key, value]) => {
      assert.deepEqual(result[key], value, `${id}: ${key}`);
    });
  });

  manifest.conformanceCases.cricketVisits.forEach((ruleCase) => {
    const profile = manifest.profiles[ruleCase.profile];
    const result = applyCricketThrowsToState({
      gameMode: ruleCase.profile === "xconfigTactics" ? "Tactics" : "Cricket",
      scoringMode: "no-score",
      targetOrder: profile.targets,
      playerIndex: 0,
      playerCount: 2,
      baseMarksByLabel: createEmptyMarksByLabel(profile.targets, 2),
      throws: ruleCase.throws,
    });

    Object.entries(ruleCase.expectedMarks).forEach(([label, marks]) => {
      assert.equal(result.nextMarksByLabel[label][0], marks, `${ruleCase.id}: ${label}`);
    });
    assert.equal(result.stopReason, ruleCase.stopReason, `${ruleCase.id}: stopReason`);
  });
});
