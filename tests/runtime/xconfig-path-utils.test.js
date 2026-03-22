import test from "node:test";
import assert from "node:assert/strict";

import {
  buildFeatureSettingPatch,
  isThemeFeature,
  splitFeaturePath,
  themeKeyFromConfigKey,
} from "../../src/features/xconfig-ui/path-utils.js";

test("xconfig path utils split nested config keys and resolve theme keys", () => {
  assert.deepEqual(splitFeaturePath(" themes.x01 "), ["themes", "x01"]);
  assert.equal(themeKeyFromConfigKey("themes.x01"), "x01");
  assert.equal(themeKeyFromConfigKey("checkoutScorePulse"), "");
});

test("xconfig path utils build nested feature setting patches without changing public shape", () => {
  assert.deepEqual(buildFeatureSettingPatch("checkoutScorePulse", "effect", "scale"), {
    features: {
      checkoutScorePulse: {
        effect: "scale",
      },
    },
  });

  assert.deepEqual(buildFeatureSettingPatch("themes.x01", "showAvg", false), {
    features: {
      themes: {
        x01: {
          showAvg: false,
        },
      },
    },
  });

  assert.equal(
    isThemeFeature({
      configKey: "themes.x01",
    }),
    true
  );
});
