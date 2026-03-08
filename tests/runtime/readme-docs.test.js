import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

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
  const imageMatches = Array.from(
    readme.matchAll(/!\[[^\]]*\]\((docs\/screenshots\/[^)]+)\)/g)
  );

  assert.ok(imageMatches.length >= 10);

  imageMatches.forEach((match) => {
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
  const imageMatches = Array.from(
    featuresDoc.matchAll(/!\[[^\]]*\]\((screenshots\/[^)]+)\)/g)
  );

  assert.ok(imageMatches.length >= 20);

  imageMatches.forEach((match) => {
    const screenshotPath = path.resolve(process.cwd(), "docs", match[1]);
    assert.equal(
      existsSync(screenshotPath),
      true,
      `missing screenshot in FEATURES.md: ${match[1]}`
    );
  });
});
