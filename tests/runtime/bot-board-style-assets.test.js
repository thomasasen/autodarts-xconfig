import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { build } from "esbuild";

import {
  BOARD_STYLE_DESIGN_FILES,
  BOARD_STYLE_DESIGN_KEYS,
  BOARD_STYLE_DESIGNS,
} from "../../src/shared/board-style-assets.manifest.js";
import { USERSCRIPT_ASSET_LOADERS } from "../../scripts/userscript-build-config.mjs";

const boardAssetDirectory = path.resolve(process.cwd(), "src", "assets", "board-styles");
const loaderEntry = path.resolve(process.cwd(), "loader", "autodarts-xconfig.user.js");

function readUint24LE(buffer, offset) {
  return buffer[offset] | (buffer[offset + 1] << 8) | (buffer[offset + 2] << 16);
}

function readExtendedWebpInfo(buffer) {
  assert.equal(buffer.subarray(0, 4).toString("ascii"), "RIFF");
  assert.equal(buffer.subarray(8, 12).toString("ascii"), "WEBP");
  assert.equal(buffer.subarray(12, 16).toString("ascii"), "VP8X");
  return {
    hasAlpha: (buffer[20] & 0x10) !== 0,
    width: readUint24LE(buffer, 24) + 1,
    height: readUint24LE(buffer, 27) + 1,
  };
}

test("board style manifest contains exactly the selected ten designs", () => {
  assert.equal(BOARD_STYLE_DESIGNS.length, 10);
  assert.deepEqual(BOARD_STYLE_DESIGN_KEYS, [
    "winmau-blade-6-tc",
    "winmau-blade-x",
    "winmau-blade-360-tc",
    "target-tor",
    "target-aspar",
    "unicorn-eclipse-pro-2",
    "mission-samurai-4",
    "bulls-nl-advantage-701",
    "shot-bandit",
    "one80-g4-surge",
  ]);

  const manifestFiles = Object.values(BOARD_STYLE_DESIGN_FILES).sort();
  const bundledFiles = readdirSync(boardAssetDirectory)
    .filter((fileName) => fileName.endsWith(".webp"))
    .sort();
  assert.deepEqual(bundledFiles, manifestFiles);
});

test("optimized board assets preserve alpha, fit 1000 pixels, and stay below the size budget", () => {
  let totalBytes = 0;
  Object.values(BOARD_STYLE_DESIGN_FILES).forEach((fileName) => {
    const buffer = readFileSync(path.join(boardAssetDirectory, fileName));
    const info = readExtendedWebpInfo(buffer);
    totalBytes += buffer.length;
    assert.equal(info.hasAlpha, true, `${fileName} lost alpha transparency`);
    assert.ok(info.width <= 1000, `${fileName} width exceeds 1000 pixels`);
    assert.ok(info.height <= 1000, `${fileName} height exceeds 1000 pixels`);
  });
  assert.ok(totalBytes <= 1.8 * 1024 * 1024, `board assets use ${totalBytes} bytes`);
});

test("userscript source bundles WebP board assets as data URLs without writing dist", async () => {
  const result = await build({
    entryPoints: [loaderEntry],
    bundle: true,
    format: "iife",
    platform: "browser",
    target: ["chrome100", "firefox100"],
    charset: "utf8",
    legalComments: "none",
    loader: USERSCRIPT_ASSET_LOADERS,
    write: false,
    logLevel: "silent",
  });
  const outputText = result.outputFiles.map((file) => file.text).join("\n");
  const webpDataUrls = outputText.match(/data:image\/webp;base64,/g) || [];

  assert.equal(USERSCRIPT_ASSET_LOADERS[".webp"], "dataurl");
  assert.equal(webpDataUrls.length, 10);
});
