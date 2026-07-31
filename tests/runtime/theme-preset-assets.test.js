import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { build } from "esbuild";

import { xconfigDescriptors } from "../../src/features/xconfig-ui/descriptors.js";
import { THEME_GLOBAL_TEMPLATE_PRESETS } from "../../src/shared/theme-global-template-presets.js";
import {
  THEME_PRESET_ASSET_FILES,
  THEME_PRESET_ASSET_KEYS,
} from "../../src/shared/theme-preset-assets.manifest.js";
import { resolveThemePresetAsset } from "../../src/shared/theme-preset-assets.node.js";
import { USERSCRIPT_ASSET_LOADERS } from "../../scripts/userscript-build-config.mjs";

const themePresetAssetDirectory = path.resolve(process.cwd(), "src", "assets", "theme-presets");
const browserAssetEntry = path.resolve(
  process.cwd(),
  "src",
  "shared",
  "theme-preset-assets.browser.js"
);
const addedWallpaperKeys = Object.freeze([
  "spider-man",
  "neon-splash",
  "john-wick",
  "solar-pulse",
  "crimson-facets",
  "aqua-flux",
  "endgame",
  "gladiator",
  "deutschland",
  "dark-side",
  "darts-arena",
  "bayern",
]);

function readUint24LE(buffer, offset) {
  return buffer[offset] | (buffer[offset + 1] << 8) | (buffer[offset + 2] << 16);
}

function readWebpDimensions(buffer) {
  assert.equal(buffer.subarray(0, 4).toString("ascii"), "RIFF");
  assert.equal(buffer.subarray(8, 12).toString("ascii"), "WEBP");
  const chunkType = buffer.subarray(12, 16).toString("ascii");
  if (chunkType === "VP8X") {
    return {
      width: readUint24LE(buffer, 24) + 1,
      height: readUint24LE(buffer, 27) + 1,
    };
  }
  if (chunkType === "VP8 ") {
    assert.equal(buffer.subarray(23, 26).toString("hex"), "9d012a");
    return {
      width: buffer.readUInt16LE(26) & 0x3fff,
      height: buffer.readUInt16LE(28) & 0x3fff,
    };
  }
  if (chunkType === "VP8L") {
    assert.equal(buffer[20], 0x2f);
    const bits = buffer.readUInt32LE(21);
    return {
      width: (bits & 0x3fff) + 1,
      height: ((bits >> 14) & 0x3fff) + 1,
    };
  }
  assert.fail(`unsupported WebP chunk ${chunkType}`);
}

test("theme preset definitions and bundled wallpaper manifest stay aligned", () => {
  const presetAssetKeys = THEME_GLOBAL_TEMPLATE_PRESETS
    .map((preset) => preset.backgroundAssetKey)
    .filter(Boolean);
  assert.deepEqual(presetAssetKeys, THEME_PRESET_ASSET_KEYS);
  addedWallpaperKeys.forEach((assetKey) => {
    assert.ok(THEME_PRESET_ASSET_KEYS.includes(assetKey), `missing ${assetKey} in manifest`);
    assert.match(
      resolveThemePresetAsset(assetKey),
      new RegExp(`theme-presets/${THEME_PRESET_ASSET_FILES[assetKey].replace(".", "\\.")}$`)
    );
  });

  const manifestFiles = Object.values(THEME_PRESET_ASSET_FILES).sort();
  const bundledFiles = readdirSync(themePresetAssetDirectory)
    .filter((fileName) => /\.(?:jpe?g|png|webp)$/i.test(fileName))
    .sort();
  assert.deepEqual(bundledFiles, manifestFiles);
});

test("theme preset values remain selectable in the Templates Global settings", () => {
  const descriptor = xconfigDescriptors.find(
    (entry) => entry.featureKey === "theme-global-typography"
  );
  const fieldsByKey = new Map(
    (descriptor?.fields || []).map((field) => [field.key, field])
  );
  const selectKeys = [
    "fontPreset",
    "activePlayerTintIntensity",
    "backgroundDisplayMode",
    "backgroundOpacity",
    "playerFieldTransparency",
  ];

  THEME_GLOBAL_TEMPLATE_PRESETS.forEach((preset) => {
    selectKeys.forEach((key) => {
      const allowedValues = (fieldsByKey.get(key)?.options || []).map((option) => option.value);
      assert.ok(
        allowedValues.includes(preset[key]),
        `${preset.key}.${key}=${preset[key]} is not selectable`
      );
    });
  });
});

test("new preset wallpapers fit the display and userscript size budgets", () => {
  let totalBytes = 0;
  addedWallpaperKeys.forEach((assetKey) => {
    const fileName = THEME_PRESET_ASSET_FILES[assetKey];
    const buffer = readFileSync(path.join(themePresetAssetDirectory, fileName));
    const dimensions = readWebpDimensions(buffer);
    totalBytes += buffer.length;
    assert.ok(dimensions.width <= 1920, `${fileName} width exceeds 1920 pixels`);
    assert.ok(dimensions.height <= 1080, `${fileName} height exceeds 1080 pixels`);
  });
  assert.ok(totalBytes <= 1.8 * 1024 * 1024, `new preset wallpapers use ${totalBytes} bytes`);
});

test("browser resolver bundles every theme preset wallpaper without writing dist", async () => {
  const result = await build({
    entryPoints: [browserAssetEntry],
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
  const bundledImageDataUrls = outputText.match(/data:image\/(?:jpeg|png|webp);base64,/g) || [];

  assert.equal(bundledImageDataUrls.length, THEME_PRESET_ASSET_KEYS.length);
});
