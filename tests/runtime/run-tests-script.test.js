import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const runTestsScriptPath = path.resolve(process.cwd(), "scripts", "run-tests.mjs");
const packageJsonPath = path.resolve(process.cwd(), "package.json");
const releaseWorkflowPath = path.resolve(process.cwd(), ".github", "workflows", "release.yml");

test("run-tests script executes a syntax gate before test files", () => {
  const scriptText = readFileSync(runTestsScriptPath, "utf8");

  assert.match(scriptText, /check-syntax\.mjs/);
  assert.match(scriptText, /function runSyntaxGate\(\)/);
  assert.match(scriptText, /runSyntaxGate\(\);/);
  const gateCallIndex = scriptText.indexOf("runSyntaxGate();");
  const loopIndex = scriptText.indexOf("for (const testFile of testFiles)");
  assert.ok(gateCallIndex >= 0, "syntax gate call missing");
  assert.ok(loopIndex >= 0, "test loop missing");
  assert.ok(gateCallIndex < loopIndex, "syntax gate must run before test execution");
});

test("test entry points delegate syntax validation to run-tests", () => {
  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
  const releaseWorkflow = readFileSync(releaseWorkflowPath, "utf8");

  assert.equal(packageJson.scripts["test:local"], "node ./scripts/run-tests.mjs");
  assert.doesNotMatch(releaseWorkflow, /run:\s+npm run check:syntax/);
  assert.match(releaseWorkflow, /run:\s+npm run test:local/);
});
