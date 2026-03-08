import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { XCONFIG_PREVIEW_SCREENSHOTS } from "../../src/shared/xconfig-preview-assets.manifest.js";

const readmePath = path.resolve(process.cwd(), "README.md");
const featuresDocPath = path.resolve(process.cwd(), "docs", "FEATURES.md");

test("README references the canonical userscript install target", () => {
  const readme = readFileSync(readmePath, "utf8");

  assert.match(readme, /dist\/autodarts-xconfig\.user\.js/);
  assert.match(
    readme,
    /https:\/\/raw\.githubusercontent\.com\/thomasasen\/autodarts-xconfig\/main\/dist\/autodarts-xconfig\.user\.js/
  );
  assert.doesNotMatch(readme, /dist\/autodarts-xconfig-loader\.user\.js/);
});

test("README screenshot paths exist in docs/screenshots", () => {
  const readme = readFileSync(readmePath, "utf8");
  const imageMatches = Array.from(readme.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g));

  assert.ok(imageMatches.length >= 8);

  imageMatches.forEach((match) => {
    if (/^(https?:|data:)/.test(match[1])) {
      return;
    }
    const screenshotPath = path.resolve(process.cwd(), match[1]);
    assert.equal(
      existsSync(screenshotPath),
      true,
      `missing screenshot: ${match[1]}`
    );
  });
});

test("README documents the AD xConfig UI screenshot", () => {
  const readme = readFileSync(readmePath, "utf8");

  assert.match(readme, /docs\/screenshots\/ad-xconfig\.png/);
});

test("README contains a visible install badge", () => {
  const readme = readFileSync(readmePath, "utf8");

  assert.match(readme, /\!\[Installieren\]\(https:\/\/img\.shields\.io\/badge\//);
});

test("FEATURES doc screenshot paths exist in docs/screenshots", () => {
  const featuresDoc = readFileSync(featuresDocPath, "utf8");
  const imageMatches = Array.from(featuresDoc.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g));

  assert.ok(imageMatches.length >= 16);

  imageMatches.forEach((match) => {
    const screenshotPath = path.resolve(process.cwd(), "docs", match[1]);
    assert.equal(
      existsSync(screenshotPath),
      true,
      `missing screenshot in FEATURES.md: ${match[1]}`
    );
  });
});

test("docs/screenshots contains no duplicate files by content hash", () => {
  const screenshotsDir = path.resolve(process.cwd(), "docs", "screenshots");
  const screenshotFiles = readdirSync(screenshotsDir, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => path.resolve(screenshotsDir, entry.name));

  const filesByHash = new Map();
  screenshotFiles.forEach((filePath) => {
    const hash = crypto
      .createHash("sha256")
      .update(readFileSync(filePath))
      .digest("hex");
    const list = filesByHash.get(hash) || [];
    list.push(path.basename(filePath));
    filesByHash.set(hash, list);
  });

  const duplicates = Array.from(filesByHash.values()).filter((group) => group.length > 1);
  assert.equal(duplicates.length, 0, `duplicate screenshots found: ${JSON.stringify(duplicates)}`);
});

test("xConfig preview screenshot manifest points only to existing canonical screenshots", () => {
  Object.entries(XCONFIG_PREVIEW_SCREENSHOTS).forEach(([featureKey, fileName]) => {
    const screenshotPath = path.resolve(process.cwd(), "docs", "screenshots", fileName);
    assert.equal(
      existsSync(screenshotPath),
      true,
      `missing preview screenshot for ${featureKey}: ${fileName}`
    );
  });
});
