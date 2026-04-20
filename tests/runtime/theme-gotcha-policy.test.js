import test from "node:test";
import assert from "node:assert/strict";

import { resolveGotchaDisplayText } from "../../src/features/themes/gotcha/policy.js";

test("gotcha theme converts segment labels to signed point deltas and leaves numeric deltas untouched", () => {
  assert.equal(resolveGotchaDisplayText("D20"), "+40");
  assert.equal(resolveGotchaDisplayText("T20"), "+60");
  assert.equal(resolveGotchaDisplayText("S20"), "+20");
  assert.equal(resolveGotchaDisplayText("Bull"), "+50");
  assert.equal(resolveGotchaDisplayText("DB"), "+50");
  assert.equal(resolveGotchaDisplayText("SB"), "+25");
  assert.equal(resolveGotchaDisplayText("+31"), "+31");
  assert.equal(resolveGotchaDisplayText("102"), "102");
  assert.equal(resolveGotchaDisplayText(""), "");
});
