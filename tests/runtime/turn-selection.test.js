import test from "node:test";
import assert from "node:assert/strict";

import { selectNewestTurn } from "../../src/shared/turn-selection.js";

test("newest turn selection returns null for missing or empty candidate lists", () => {
  for (const input of [undefined, null, [], {}, "turn"]) {
    assert.equal(selectNewestTurn(input), null);
  }
});

test("newest turn selection prioritizes round over turn and timestamp without mutating candidates", () => {
  const nextRound = Object.freeze({ round: 2, turn: 1, createdAt: "2020-01-01" });
  const previousRound = Object.freeze({ round: 1, turn: 99, createdAt: "2025-01-01" });
  const candidates = Object.freeze([nextRound, previousRound]);
  assert.equal(selectNewestTurn(candidates), nextRound);
  assert.deepEqual(candidates, [nextRound, previousRound]);
  assert.equal(selectNewestTurn([previousRound, nextRound]), nextRound);
});

test("newest turn selection prioritizes turn number within the same round", () => {
  const newer = { round: 1, turn: 2, createdAt: "2020-01-01" };
  const older = { round: 1, turn: 1, createdAt: "2025-01-01" };
  assert.equal(selectNewestTurn([newer, older]), newer);
  assert.equal(selectNewestTurn([older, newer]), newer);
});

test("newest turn selection compares timestamps only after round and turn agree", () => {
  const older = { round: 1, turn: 1, createdAt: "2025-01-01T00:00:00Z" };
  const newer = { round: 1, turn: 1, createdAt: "2025-01-02T00:00:00Z" };
  assert.equal(selectNewestTurn([newer, older]), newer);
  assert.equal(selectNewestTurn([older, newer]), newer);
});

test("newest turn selection retains finite-number semantics without coercing round or turn", () => {
  const validRound = { round: 0, turn: 0 };
  assert.equal(selectNewestTurn([validRound, { round: "99", turn: 99 }]), validRound);
  assert.equal(selectNewestTurn([validRound, { round: Infinity, turn: 99 }]), validRound);
  assert.equal(selectNewestTurn([{ round: 0, turn: "99" }, validRound]), validRound);
  assert.equal(selectNewestTurn([{ round: NaN }, validRound]), validRound);
});

test("newest turn selection treats missing and invalid timestamps as epoch zero", () => {
  const beforeEpoch = { createdAt: "1960-01-01T00:00:00Z" };
  const invalid = { createdAt: "not-a-date" };
  const missing = {};
  assert.equal(selectNewestTurn([beforeEpoch, invalid]), invalid);
  assert.equal(selectNewestTurn([invalid, missing]), missing);
  assert.equal(selectNewestTurn([missing, invalid]), invalid);
});

test("newest turn selection retains the later candidate on a complete tie", () => {
  const first = { round: 1, turn: 2, createdAt: "2025-01-01T00:00:00Z" };
  const last = { ...first };
  assert.equal(selectNewestTurn([first, last]), last);
  assert.equal(selectNewestTurn([last, first]), first);
  // Unlike the Cricket-specific selector, this selector does not filter invalid entries.
  assert.equal(selectNewestTurn([{}, null]), null);
  assert.equal(selectNewestTurn([null, undefined]), undefined);
});
