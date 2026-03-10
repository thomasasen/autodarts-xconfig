import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const bundlePath = path.resolve(
  process.cwd(),
  "dist",
  "autodarts-xconfig.user.js"
);
const packageJsonPath = path.resolve(process.cwd(), "package.json");
const bootstrapPath = path.resolve(process.cwd(), "src", "core", "bootstrap.js");
const loaderPath = path.resolve(process.cwd(), "loader", "autodarts-xconfig.user.js");

test("checked-in userscript bundle contains metadata header and runtime bootstrap entry", () => {
  const text = readFileSync(bundlePath, "utf8");
  const packageVersion = JSON.parse(readFileSync(packageJsonPath, "utf8")).version;

  assert.match(text, /\/\/ ==UserScript==/);
  assert.match(text, new RegExp(`@version\\s+${packageVersion.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
  assert.match(text, /@match\s+https:\/\/play\.autodarts\.io\/\*/);
  assert.match(text, /@grant\s+none/);
  assert.doesNotMatch(text, /@grant\s+GM_getValue/);
  assert.match(
    text,
    /@downloadURL\s+https:\/\/raw\.githubusercontent\.com\/thomasasen\/autodarts-xconfig\/main\/dist\/autodarts-xconfig\.user\.js/
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
  assert.match(text, /height:\s*100%\s*!important;/);
  assert.doesNotMatch(text, /minmax\(20rem,\s*0\.95fr\)\s*minmax\(0,\s*1\.05fr\)/);
  assert.doesNotMatch(text, /width:\s*min\(100%,\s*100vh\)\s*!important;/);
  assert.doesNotMatch(text, /96cqw|96cqh/);
  assert.doesNotMatch(text, /BOARD_GLOW_MARGIN_RATIO/);
  assert.doesNotMatch(text, /calculateBoardCanvasSize/);
});

test("bundle, runtime API version and package version stay in sync", () => {
  const packageVersion = JSON.parse(readFileSync(packageJsonPath, "utf8")).version;
  const sourceBootstrap = readFileSync(bootstrapPath, "utf8");
  const bundle = readFileSync(bundlePath, "utf8");
  const loader = readFileSync(loaderPath, "utf8");

  const sourceApiVersion = sourceBootstrap.match(/const API_VERSION = "([^"]+)";/)?.[1] || "";
  const bundleApiVersion = bundle.match(/var API_VERSION = "([^"]+)";/)?.[1] || "";
  const metadataVersion = bundle.match(/@version\s+([0-9]+\.[0-9]+\.[0-9]+)/)?.[1] || "";
  const loaderMetadataVersion = loader.match(/@version\s+([0-9]+\.[0-9]+\.[0-9]+)/)?.[1] || "";

  assert.equal(sourceApiVersion, packageVersion);
  assert.equal(bundleApiVersion, packageVersion);
  assert.equal(metadataVersion, packageVersion);
  assert.equal(loaderMetadataVersion, packageVersion);
});
