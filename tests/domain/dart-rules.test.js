import test from "node:test";
import assert from "node:assert/strict";

import {
  cricketRules,
  dartRules,
  variantRules,
  x01Rules,
} from "../../src/domain/dart-rules.js";

test("dart-rules aggregator exports all domain clusters", () => {
  assert.equal(dartRules.variantRules, variantRules);
  assert.equal(dartRules.x01Rules, x01Rules);
  assert.equal(dartRules.cricketRules, cricketRules);
});