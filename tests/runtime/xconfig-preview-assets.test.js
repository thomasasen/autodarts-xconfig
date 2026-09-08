import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import path from "node:path";
import test from "node:test";

import { checkXConfigPreviewAssets } from "../../scripts/check-xconfig-preview-assets.mjs";
import { XCONFIG_PREVIEW_SOURCE_FILES } from "../../scripts/xconfig-preview-sources.mjs";
import {
  XCONFIG_ANIMATED_PREVIEW_FEATURE_KEYS,
  XCONFIG_PREVIEW_ASSET_FILES,
} from "../../src/shared/xconfig-preview-assets.manifest.js";
import { resolveXConfigPreviewAsset } from "../../src/shared/xconfig-preview-assets.node.js";

test("xConfig runtime previews are local bounded WebPs within the bundle budget", async () => {
  const previewFeatureKeys = Object.keys(XCONFIG_PREVIEW_ASSET_FILES);
  assert.ok(previewFeatureKeys.length > 0);
  assert.deepEqual(
    previewFeatureKeys.sort(),
    Object.keys(XCONFIG_PREVIEW_SOURCE_FILES).sort()
  );

  const result = await checkXConfigPreviewAssets();
  assert.equal(result.entries.length, previewFeatureKeys.length);
  assert.ok(result.totalBytes <= 4 * 1024 * 1024);

  const animatedKeys = new Set(XCONFIG_ANIMATED_PREVIEW_FEATURE_KEYS);
  result.entries.forEach((entry) => {
    assert.equal(entry.animated, animatedKeys.has(entry.featureKey));
    assert.match(resolveXConfigPreviewAsset(entry.featureKey), /src\/assets\/xconfig-previews\/.*\.webp$/);
    assert.equal(
      existsSync(path.resolve("docs", "screenshots", XCONFIG_PREVIEW_SOURCE_FILES[entry.featureKey])),
      true
    );
  });
});
