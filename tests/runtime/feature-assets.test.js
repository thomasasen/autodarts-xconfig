import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { DART_DESIGN_FILES } from "../../src/shared/feature-assets.manifest.js";

const takeOutAssetPath = path.resolve(process.cwd(), "src", "assets", "TakeOut.png");
const dartAssetsPath = path.resolve(process.cwd(), "src", "assets", "darts");

test("takeout asset stays a PNG with RGBA color type", () => {
  const png = readFileSync(takeOutAssetPath);

  assert.equal(png.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), true);
  assert.equal(png.subarray(12, 16).toString("ascii"), "IHDR");
  assert.equal(png.readUInt32BE(16), 508);
  assert.equal(png.readUInt32BE(20), 682);
  assert.equal(png.readUInt8(24), 8);
  assert.equal(png.readUInt8(25), 6);
});

test("dart design manifest references every bundled dart image", () => {
  const manifestFiles = Object.values(DART_DESIGN_FILES).sort();
  const assetFiles = readdirSync(dartAssetsPath)
    .filter((fileName) => /^Dart_.*\.png$/i.test(fileName))
    .sort();

  assert.deepEqual(manifestFiles, assetFiles);
});
