import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { build } from "esbuild";
import {
  buildUserscriptHeader,
  resolveUserscriptDownloadUrl,
  USERSCRIPT_ASSET_LOADERS,
  USERSCRIPT_BROWSER_TARGETS,
  USERSCRIPT_LEGACY_DOWNLOAD_URL,
  USERSCRIPT_RELEASE_DOWNLOAD_URL,
  USERSCRIPT_UPDATE_URL,
} from "../../scripts/userscript-build-config.mjs";
import { BOARD_STYLE_DESIGN_FILES } from "../../src/shared/board-style-assets.manifest.js";
import { DART_DESIGN_FILES } from "../../src/shared/feature-assets.manifest.js";
import { THEME_PRESET_ASSET_FILES } from "../../src/shared/theme-preset-assets.manifest.js";
import { TURN_DART_ASSET_FILES } from "../../src/shared/turn-dart-assets.manifest.js";
import { XCONFIG_PREVIEW_ASSET_FILES } from "../../src/shared/xconfig-preview-assets.manifest.js";

const bundlePath = path.resolve(
  process.cwd(),
  "dist",
  "autodarts-xconfig.user.js"
);
const metaPath = path.resolve(
  process.cwd(),
  "dist",
  "autodarts-xconfig.meta.js"
);
const packageJsonPath = path.resolve(process.cwd(), "package.json");
const bootstrapPath = path.resolve(process.cwd(), "src", "core", "bootstrap.js");
const loaderPath = path.resolve(process.cwd(), "loader", "autodarts-xconfig.user.js");
const SOURCE_BUNDLE_BYTE_BUDGET = 25 * 1024 * 1024;
const SUPPORTED_AUTODARTS_ORIGINS = Object.freeze([
  "https://play.autodarts.io",
  "https://play.autodarts.com",
]);
let sourceBundlePromise = null;

function buildSourceBundle() {
  if (!sourceBundlePromise) {
    sourceBundlePromise = build({
      entryPoints: [loaderPath],
      bundle: true,
      format: "iife",
      platform: "browser",
      target: USERSCRIPT_BROWSER_TARGETS,
      charset: "utf8",
      legalComments: "none",
      loader: USERSCRIPT_ASSET_LOADERS,
      write: false,
      logLevel: "silent",
    }).then((result) => result.outputFiles.map((file) => file.text).join("\n"));
  }
  return sourceBundlePromise;
}

function escapeRegExp(text) {
  return String(text || "").replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
}

function collectBundledDataUrls(text) {
  const rows = [];
  let currentSource = "";

  text.split(/\r?\n/).forEach((line) => {
    const sourceMatch = line.match(/^\s*\/\/\s+(.+)$/);
    if (sourceMatch) {
      currentSource = sourceMatch[1];
    }

    Array.from(line.matchAll(/data:(?:image|audio|application)\/[^"']+/g)).forEach((match) => {
      rows.push({
        source: currentSource,
        value: match[0],
      });
    });
  });

  return rows;
}

function buildAllowedBundledAssetSources() {
  return new Set([
    ...Object.values(DART_DESIGN_FILES).map((fileName) => `src/assets/darts/${fileName}`),
    ...Object.values(BOARD_STYLE_DESIGN_FILES).map(
      (fileName) => `src/assets/board-styles/${fileName}`
    ),
    ...Object.values(THEME_PRESET_ASSET_FILES).map(
      (fileName) => `src/assets/theme-presets/${fileName}`
    ),
    ...Object.values(TURN_DART_ASSET_FILES).map(
      (fileName) => `src/assets/turn-darts/${fileName}`
    ),
    ...Object.values(XCONFIG_PREVIEW_ASSET_FILES).map(
      (fileName) => `src/assets/xconfig-previews/${fileName}`
    ),
    "src/assets/TakeOut.png",
    "src/assets/singlebull.mp3",
    "src/assets/glasscrack.mp3",
  ]);
}

test("checked-in userscript bundle contains metadata header and runtime bootstrap entry", () => {
  const text = readFileSync(bundlePath, "utf8");
  const packageVersion = JSON.parse(readFileSync(packageJsonPath, "utf8")).version;

  assert.match(text, /\/\/ ==UserScript==/);
  assert.match(text, new RegExp(String.raw`@version\s+${escapeRegExp(packageVersion)}`));
  assert.match(text, /@match\s+https:\/\/play\.autodarts\.io\/\*/);
  assert.match(text, /@exclude\s+https:\/\/play\.autodarts\.io\/boards/);
  assert.match(text, /@exclude\s+https:\/\/play\.autodarts\.io\/boards\/\*/);
  assert.match(text, /@grant\s+GM_getValue/);
  assert.match(text, /@grant\s+GM_setValue/);
  assert.match(
    text,
    new RegExp(String.raw`@downloadURL\s+${escapeRegExp(resolveUserscriptDownloadUrl(packageVersion))}`)
  );
  assert.match(
    text,
    new RegExp(String.raw`@updateURL\s+${escapeRegExp(USERSCRIPT_UPDATE_URL)}`)
  );
  assert.match(text, /initializeTampermonkeyRuntime/);
  assert.match(text, /windowRef\.__adXConfig/);
  assert.match(text, /ad-ext-theme-content-slot/);
  assert.match(
    text,
    /grid-template-columns:\s*minmax\(18rem,\s*clamp\(22rem,\s*34vw,\s*38rem\)\)\s*minmax\(0,\s*1fr\)\s*!important;/
  );
  assert.match(text, /grid-column:\s*1 \/ -1\s*!important;/);
  assert.match(text, /grid-row:\s*3\s*!important;/);
  assert.match(text, /grid-template-rows:\s*minmax\(0,\s*1fr\)\s*!important;/);
  assert.match(text, /position:\s*absolute\s*!important;/);
  assert.match(text, /top:\s*0\.5rem\s*!important;/);
  assert.match(text, /right:\s*0\.5rem\s*!important;/);
  assert.match(text, /bottom:\s*auto\s*!important;/);
  assert.match(text, /left:\s*auto\s*!important;/);
  assert.match(
    text,
    /\.ad-ext-theme-board-panel\s*\{[^}]*overflow:\s*visible\s*!important;/s
  );
  assert.match(
    text,
    /\.ad-ext-theme-board-viewport\s*\{[^}]*overflow:\s*visible\s*!important;/s
  );
  assert.match(text, /ad-ext-theme-board-canvas\s*\{/);
  assert.match(text, /flex:\s*0\s+0\s+auto\s*!important;/);
  assert.match(text, /--ad-ext-theme-board-size,\s*100%/);
  assert.match(
    text,
    /\.ad-ext-theme-board-canvas\s*\{[^}]*overflow:\s*visible\s*!important;/s
  );
  assert.match(text, /ad-ext-theme-board-canvas\s*>\s*\*/);
  assert.match(
    text,
    /\.ad-ext-theme-board-canvas\s*>\s*\*\s*\{[^}]*overflow:\s*visible\s*!important;/s
  );
  assert.match(
    text,
    /-ms-overflow-style:\s*none\s*!important;/
  );
  assert.match(
    text,
    /scrollbar-width:\s*none\s*!important;/
  );
  assert.match(
    text,
    /::-webkit-scrollbar\s*\{[^}]*width:\s*0\s*!important;[^}]*height:\s*0\s*!important;[^}]*display:\s*none\s*!important;/s
  );
  assert.match(text, /height:\s*100%\s*!important;/);
  assert.doesNotMatch(text, /minmax\(20rem,\s*0\.95fr\)\s*minmax\(0,\s*1\.05fr\)/);
  assert.doesNotMatch(text, /width:\s*min\(100%,\s*100vh\)\s*!important;/);
  assert.doesNotMatch(text, /96cqw|96cqh/);
  assert.doesNotMatch(text, /BOARD_GLOW_MARGIN_RATIO/);
  assert.doesNotMatch(text, /calculateBoardCanvasSize/);
});

test("checked-in userscript metadata file stays lightweight and version-aligned", () => {
  const text = readFileSync(metaPath, "utf8");
  const packageVersion = JSON.parse(readFileSync(packageJsonPath, "utf8")).version;

  assert.match(text, /\/\/ ==UserScript==/);
  assert.match(text, new RegExp(String.raw`@version\s+${escapeRegExp(packageVersion)}`));
  assert.match(text, /@exclude\s+https:\/\/play\.autodarts\.io\/boards/);
  assert.match(text, /@exclude\s+https:\/\/play\.autodarts\.io\/boards\/\*/);
  assert.match(
    text,
    new RegExp(String.raw`@downloadURL\s+${escapeRegExp(resolveUserscriptDownloadUrl(packageVersion))}`)
  );
  assert.match(
    text,
    new RegExp(String.raw`@updateURL\s+${escapeRegExp(USERSCRIPT_UPDATE_URL)}`)
  );
  assert.doesNotMatch(text, /initializeTampermonkeyRuntime/);
});

test("source userscript metadata supports old and new Autodarts domains", () => {
  const packageVersion = JSON.parse(readFileSync(packageJsonPath, "utf8")).version;
  const generatedHeader = buildUserscriptHeader(packageVersion);
  const loader = readFileSync(loaderPath, "utf8");

  for (const origin of SUPPORTED_AUTODARTS_ORIGINS) {
    const escapedOrigin = escapeRegExp(origin);
    for (const metadata of [generatedHeader, loader]) {
      assert.match(metadata, new RegExp(String.raw`@match\s+${escapedOrigin}/\*`));
      assert.match(metadata, new RegExp(String.raw`@exclude\s+${escapedOrigin}/boards(?:\s|$)`));
      assert.match(metadata, new RegExp(String.raw`@exclude\s+${escapedOrigin}/boards/\*`));
    }
  }
});

test("userscript metadata switches payload delivery at 2.9.2 while retaining the Raw manifest", () => {
  const legacyHeader = buildUserscriptHeader("2.9.1");
  const migratedHeader = buildUserscriptHeader("2.9.2");
  const futureHeader = buildUserscriptHeader("3.4.2");

  assert.equal(resolveUserscriptDownloadUrl("2.9.1"), USERSCRIPT_LEGACY_DOWNLOAD_URL);
  assert.equal(resolveUserscriptDownloadUrl("2.9.2"), USERSCRIPT_RELEASE_DOWNLOAD_URL);
  assert.equal(resolveUserscriptDownloadUrl("3.4.2"), USERSCRIPT_RELEASE_DOWNLOAD_URL);
  assert.match(
    legacyHeader,
    new RegExp(String.raw`@downloadURL\s+${escapeRegExp(USERSCRIPT_LEGACY_DOWNLOAD_URL)}`)
  );
  for (const header of [migratedHeader, futureHeader]) {
    assert.match(
      header,
      new RegExp(String.raw`@downloadURL\s+${escapeRegExp(USERSCRIPT_RELEASE_DOWNLOAD_URL)}`)
    );
    assert.match(
      header,
      new RegExp(String.raw`@updateURL\s+${escapeRegExp(USERSCRIPT_UPDATE_URL)}`)
    );
  }
});

test("source userscript bundle embeds only approved runtime assets", async () => {
  const text = await buildSourceBundle();
  const allowedSources = buildAllowedBundledAssetSources();
  const bundledAssetSources = collectBundledDataUrls(text)
    .map((entry) => entry.source)
    .filter((source) => /\.(?:png|jpe?g|gif|webp|mp3)$/i.test(source));
  const uniqueBundledAssetSources = [...new Set(bundledAssetSources)].sort();
  const unexpectedAssetSources = uniqueBundledAssetSources.filter(
    (source) => !allowedSources.has(source)
  );
  const missingAssetSources = [...allowedSources]
    .filter((source) => !uniqueBundledAssetSources.includes(source))
    .sort();
  const readmeOnlyAssetSources = uniqueBundledAssetSources.filter((source) =>
    /(?:^|[-_.])readme\.(?:png|jpe?g|gif)$/i.test(source)
  );

  assert.deepEqual(unexpectedAssetSources, []);
  assert.deepEqual(missingAssetSources, []);
  assert.deepEqual(readmeOnlyAssetSources, []);
});

test("source userscript bundle stays within the 25 MiB budget", async () => {
  const text = await buildSourceBundle();
  const byteSize = Buffer.byteLength(text, "utf8");
  assert.ok(
    byteSize <= SOURCE_BUNDLE_BYTE_BUDGET,
    `source userscript bundle uses ${byteSize} bytes; budget is ${SOURCE_BUNDLE_BYTE_BUDGET}`
  );
});

test("bundle, runtime API version and package version stay in sync", () => {
  const packageVersion = JSON.parse(readFileSync(packageJsonPath, "utf8")).version;
  const sourceBootstrap = readFileSync(bootstrapPath, "utf8");
  const bundle = readFileSync(bundlePath, "utf8");
  const meta = readFileSync(metaPath, "utf8");
  const loader = readFileSync(loaderPath, "utf8");

  const sourceApiVersion = sourceBootstrap.match(/const API_VERSION = "([^"]+)";/)?.[1] || "";
  const bundleApiVersion = bundle.match(/var API_VERSION = "([^"]+)";/)?.[1] || "";
  const metadataVersion = bundle.match(/@version\s+([0-9]+\.[0-9]+\.[0-9]+)/)?.[1] || "";
  const metaMetadataVersion = meta.match(/@version\s+([0-9]+\.[0-9]+\.[0-9]+)/)?.[1] || "";
  const loaderMetadataVersion = loader.match(/@version\s+([0-9]+\.[0-9]+\.[0-9]+)/)?.[1] || "";

  assert.equal(sourceApiVersion, packageVersion);
  assert.equal(bundleApiVersion, packageVersion);
  assert.equal(metadataVersion, packageVersion);
  assert.equal(metaMetadataVersion, packageVersion);
  assert.equal(loaderMetadataVersion, packageVersion);
});
