import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const readmePath = path.resolve(process.cwd(), "README.md");

test("README references the canonical userscript install target", () => {
  const readme = readFileSync(readmePath, "utf8");

  assert.match(readme, /dist\/autodarts-xconfig\.user\.js/);
  assert.doesNotMatch(readme, /dist\/autodarts-xconfig-loader\.user\.js/);
});

test("README screenshot paths exist in docs/screenshots", () => {
  const readme = readFileSync(readmePath, "utf8");
  const imageMatches = Array.from(
    readme.matchAll(/!\[[^\]]*\]\((docs\/screenshots\/[^)]+)\)/g)
  );

  assert.ok(imageMatches.length >= 2);

  imageMatches.forEach((match) => {
    const screenshotPath = path.resolve(process.cwd(), match[1]);
    assert.equal(
      existsSync(screenshotPath),
      true,
      `missing screenshot: ${match[1]}`
    );
  });
});
