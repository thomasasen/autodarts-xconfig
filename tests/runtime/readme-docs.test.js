import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { XCONFIG_PREVIEW_SCREENSHOTS } from "../../src/shared/xconfig-preview-assets.manifest.js";
import { xconfigDescriptors } from "../../src/features/xconfig-ui/descriptors.js";

const readmePath = path.resolve(process.cwd(), "README.md");
const featuresDocPath = path.resolve(process.cwd(), "docs", "FEATURES.md");
const dartRuleModulesDocPath = path.resolve(process.cwd(), "docs", "DART-RULE-MODULES.md");
const dartRulesReferenceDocPath = path.resolve(process.cwd(), "docs", "DART-RULES-REFERENCE.md");
const dartRuleAuditDocPath = path.resolve(process.cwd(), "docs", "DART-RULE-AUDIT.md");
const architectureDocPath = path.resolve(process.cwd(), "docs", "TECHNICAL-ARCHITECTURE.md");
const migrationStatusDocPath = path.resolve(process.cwd(), "docs", "MIGRATION-STATUS.md");
const releaseQaDocPath = path.resolve(process.cwd(), "docs", "RELEASE-QA-REPORT.md");

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

test("README contains stable anchors for every xConfig module entry", () => {
  const readme = readFileSync(readmePath, "utf8");

  xconfigDescriptors.forEach((descriptor) => {
    assert.match(
      readme,
      new RegExp(`<a id="${descriptor.readmeAnchor}"></a>`),
      `missing README anchor for ${descriptor.featureKey}`
    );
  });
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

test("xConfig preview manifest covers the key animation/theme cards with visual backgrounds", () => {
  const requiredPreviewFeatureKeys = [
    "theme-x01",
    "theme-shanghai",
    "theme-bermuda",
    "theme-cricket",
    "theme-bull-off",
    "checkout-score-pulse",
    "checkout-board-targets",
    "tv-board-zoom",
    "style-checkout-suggestions",
    "average-trend-arrow",
    "turn-start-sweep",
    "triple-double-bull-hits",
    "cricket-highlighter",
    "cricket-grid-fx",
    "dart-marker-emphasis",
    "dart-marker-darts",
    "remove-darts-notification",
    "turn-points-count",
    "winner-fireworks",
  ];

  requiredPreviewFeatureKeys.forEach((featureKey) => {
    assert.equal(
      Object.prototype.hasOwnProperty.call(XCONFIG_PREVIEW_SCREENSHOTS, featureKey),
      true,
      `missing preview mapping for ${featureKey}`
    );
  });
});

test("dart rule audit documents exist", () => {
  [dartRuleModulesDocPath, dartRulesReferenceDocPath, dartRuleAuditDocPath].forEach((filePath) => {
    assert.equal(existsSync(filePath), true, `missing dart rule doc: ${path.basename(filePath)}`);
  });
});

test("dart rule docs mention the audited core modules and rule topics", () => {
  const modulesDoc = readFileSync(dartRuleModulesDocPath, "utf8");
  const referenceDoc = readFileSync(dartRulesReferenceDocPath, "utf8");
  const auditDoc = readFileSync(dartRuleAuditDocPath, "utf8");

  assert.match(modulesDoc, /src\/domain\/x01-rules\.js/);
  assert.match(modulesDoc, /src\/domain\/cricket-rules\.js/);
  assert.match(referenceDoc, /Double-Out|Double Out/);
  assert.match(referenceDoc, /Cut-Throat|Cut Throat/);
  assert.match(auditDoc, /checkout-score-pulse/);
  assert.match(auditDoc, /tv-board-zoom/);
});

test("release architecture and QA docs mention public action API and release status", () => {
  const architectureDoc = readFileSync(architectureDocPath, "utf8");
  const migrationDoc = readFileSync(migrationStatusDocPath, "utf8");
  const releaseQaDoc = readFileSync(releaseQaDocPath, "utf8");

  assert.match(architectureDoc, /runFeatureAction\(featureKey, actionId\)/);
  assert.match(architectureDoc, /v1\.1\.0/);
  assert.match(migrationDoc, /v1\.1\.0/);
  assert.match(releaseQaDoc, /Winner Fireworks/);
  assert.match(releaseQaDoc, /Release-QA-Report/);
});
