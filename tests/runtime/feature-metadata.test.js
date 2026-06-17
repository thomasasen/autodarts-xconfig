import test from "node:test";
import assert from "node:assert/strict";

import {
  buildFeatureIndex,
  buildFeatureMap,
  normalizeFeatureIdentity,
  normalizeFeatureKey,
} from "../../src/features/feature-metadata.js";

test("normalizeFeatureIdentity trims feature and config keys", () => {
  assert.deepEqual(
    normalizeFeatureIdentity({
      featureKey: " theme-x01 ",
      configKey: " themes.x01 ",
    }),
    {
      featureKey: "theme-x01",
      configKey: "themes.x01",
    }
  );
});

test("feature metadata helpers keep first occurrence of normalized keys", () => {
  const entries = [
    { featureKey: " checkout-score-highlight ", value: "first" },
    { featureKey: "checkout-score-highlight", value: "second" },
    { featureKey: "", value: "ignored" },
  ];

  const index = buildFeatureIndex(entries);
  const map = buildFeatureMap(entries, (entry) => entry?.featureKey, (entry) => entry?.value);

  assert.equal(normalizeFeatureKey(" checkout-score-highlight "), "checkout-score-highlight");
  assert.equal(index.get("checkout-score-highlight"), 0);
  assert.equal(index.size, 1);
  assert.equal(map.get("checkout-score-highlight"), "first");
  assert.equal(map.size, 1);
});
