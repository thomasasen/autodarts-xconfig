import test from "node:test";
import assert from "node:assert/strict";

import { normalizeThemeKey, VALID_THEME_KEYS } from "../../src/shared/theme-key-utils.js";

test("theme key utils normalize aliases used across runtime and theme modules", () => {
  assert.equal(normalizeThemeKey("x01"), "x01");
  assert.equal(normalizeThemeKey(" tactics "), "cricket");
  assert.equal(normalizeThemeKey("bull-off"), "bullOff");
  assert.equal(normalizeThemeKey("bull_off"), "bullOff");
  assert.equal(normalizeThemeKey("bull off"), "bullOff");
  assert.equal(normalizeThemeKey("unknown"), "");
  assert.deepEqual(VALID_THEME_KEYS, ["x01", "shanghai", "bermuda", "cricket", "bullOff"]);
});
