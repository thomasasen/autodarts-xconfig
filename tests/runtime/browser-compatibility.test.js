import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { USERSCRIPT_BROWSER_TARGETS } from "../../scripts/userscript-build-config.mjs";

const repositoryRoot = process.cwd();
const runtimeRoots = [path.join(repositoryRoot, "src"), path.join(repositoryRoot, "loader")];
const unsupportedArrayMethods = Object.freeze([
  "findLast",
  "findLastIndex",
  "toReversed",
  "toSorted",
  "toSpliced",
  "with",
]);

function collectJavaScriptFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      return collectJavaScriptFiles(filePath);
    }
    return entry.isFile() && entry.name.endsWith(".js") ? [filePath] : [];
  });
}

test("runtime source avoids array methods unavailable in Chrome and Firefox 100", () => {
  assert.deepEqual(USERSCRIPT_BROWSER_TARGETS, ["chrome100", "firefox100"]);
  const violations = [];
  runtimeRoots.flatMap(collectJavaScriptFiles).forEach((filePath) => {
    const source = readFileSync(filePath, "utf8");
    unsupportedArrayMethods.forEach((methodName) => {
      const pattern = new RegExp(`\\.${methodName}\\s*\\(`, "g");
      if (pattern.test(source)) {
        violations.push(`${path.relative(repositoryRoot, filePath)}: ${methodName}`);
      }
    });
  });

  assert.deepEqual(violations, []);
});
