import test from "node:test";
import assert from "node:assert/strict";

import {
  normalizeRoutePath, normalizeHashValue,
} from "../../src/shared/route-normalization.js";
import {
  normalizeRoutePath as normalizeLayoutRoutePath, isLegacyConfigPath, isConfigHash,
} from "../../src/features/xconfig-ui/layout-utils.js";
import { extractMatchRouteId } from "../../src/features/cricket-surface/pipeline.js";

test("route normalization preserves slash, case, query and hash handling", () => {
  const cases = [
    [undefined, ""], [null, ""], ["", ""], ["   ", ""], [0, ""],
    ["/", "/"], ["////", "/"], ["?tab=board", "/"],
    ["BOARDS?tab=all", "/boards"],
    [" /MATCHES//ABC///?tab=board#detail ", "/matches/abc"],
    ["matches/ABC#detail?tab=board", "/matches/abc"],
    ["/matches/abc/", "/matches/abc"],
    ["/matches/%2FABC/", "/matches/%2fabc"],
  ];
  for (const [input, expected] of cases) {
    assert.equal(normalizeRoutePath(input), expected);
    assert.equal(normalizeRoutePath(expected), expected);
  }
});

test("hash normalization preserves empty values and adds only a missing hash prefix", () => {
  const cases = [
    [undefined, ""], [null, ""], ["", ""], ["   ", ""], [0, ""],
    ["AD-XCONFIG", "#ad-xconfig"], [" #AD-XCONFIG ", "#ad-xconfig"],
    ["#", "#"], ["##AD-XCONFIG", "##ad-xconfig"],
    ["AD-XCONFIG?tab=board", "#ad-xconfig?tab=board"],
  ];
  for (const [input, expected] of cases) {
    assert.equal(normalizeHashValue(input), expected);
    assert.equal(normalizeHashValue(expected), expected);
  }
});

test("xConfig retains its route normalization export and config route predicates", () => {
  assert.equal(normalizeLayoutRoutePath, normalizeRoutePath);
  assert.equal(isLegacyConfigPath(" AD-XCONFIG///?tab=board ", "/ad-xconfig"), true);
  assert.equal(isLegacyConfigPath("/matches/abc", "/ad-xconfig"), false);
  assert.equal(isConfigHash(" AD-XCONFIG ", "#ad-xconfig"), true);
  assert.equal(isConfigHash("#ad-xconfig-extra", "#ad-xconfig"), false);
});

test("Cricket match route extraction retains normalized IDs and document location fallback", () => {
  const location = { pathname: " MATCHES//ABC///?tab=board#detail " };
  assert.equal(extractMatchRouteId({ location }, null), "abc");
  assert.equal(extractMatchRouteId(null, { defaultView: { location } }), "abc");
  assert.equal(extractMatchRouteId({ location: { pathname: "/lobbies" } }, null), "");
  assert.equal(extractMatchRouteId(null, null), "");
});
