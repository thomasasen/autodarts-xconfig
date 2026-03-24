import test from "node:test";
import assert from "node:assert/strict";

import {
  getNestedValue,
  setNestedValue,
  splitFeaturePath,
} from "../../src/config/feature-path-utils.js";

test("feature path utils preserve nested-path trimming and lookup semantics", () => {
  assert.deepEqual(splitFeaturePath(" themes.x01 "), ["themes", "x01"]);
  assert.deepEqual(splitFeaturePath(" checkoutScorePulse "), ["checkoutScorePulse"]);
  assert.deepEqual(splitFeaturePath(" . themes . x01 . "), ["themes", "x01"]);

  const config = {
    features: {
      themes: {
        x01: {
          enabled: true,
        },
      },
    },
  };

  assert.deepEqual(getNestedValue(config, ["features", "themes", "x01"]), {
    enabled: true,
  });
  assert.equal(getNestedValue(config, ["features", "themes", "bullOff"]), null);
  assert.equal(getNestedValue(null, ["features"]), null);
});

test("feature path utils create nested objects without changing public shape", () => {
  const target = { features: {} };
  setNestedValue(target.features, ["themes", "cricket"], {
    showAvg: false,
  });

  assert.deepEqual(target, {
    features: {
      themes: {
        cricket: {
          showAvg: false,
        },
      },
    },
  });
});
