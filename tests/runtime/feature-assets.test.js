import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const takeOutAssetPath = path.resolve(process.cwd(), "src", "assets", "TakeOut.png");

test("takeout asset stays a PNG with RGBA color type", () => {
  const png = readFileSync(takeOutAssetPath);

  assert.equal(png.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), true);
  assert.equal(png.subarray(12, 16).toString("ascii"), "IHDR");
  assert.equal(png.readUInt32BE(16), 508);
  assert.equal(png.readUInt32BE(20), 682);
  assert.equal(png.readUInt8(24), 8);
  assert.equal(png.readUInt8(25), 6);
});
