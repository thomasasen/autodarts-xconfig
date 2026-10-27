import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  buildNodeTestArguments,
  resolveTestConcurrency,
  resolveTestTimeout,
} from "../../scripts/run-tests.mjs";

const runTestsScriptPath = path.resolve(process.cwd(), "scripts", "run-tests.mjs");
const packageJsonPath = path.resolve(process.cwd(), "package.json");
const releaseWorkflowPath = path.resolve(process.cwd(), ".github", "workflows", "release.yml");
const mutationConfigPath = path.resolve(process.cwd(), "stryker.config.mjs");

test("run-tests script executes a syntax gate before test files", () => {
  const scriptText = readFileSync(runTestsScriptPath, "utf8");

  assert.match(scriptText, /check-syntax\.mjs/);
  assert.match(scriptText, /function runSyntaxGate\(\)/);
  assert.match(scriptText, /runSyntaxGate\(\);[\s\S]*runNodeTests\(testFiles\);/);
});

test("run-tests script aggregates files in one bounded parallel Node invocation", () => {
  assert.equal(resolveTestConcurrency("2"), 2);
  assert.equal(resolveTestConcurrency("999"), 4);
  assert.ok(resolveTestConcurrency("invalid") >= 1);
  assert.equal(resolveTestTimeout("120000"), 120000);
  assert.equal(resolveTestTimeout("999999999"), 30 * 60 * 1000);
  assert.equal(resolveTestTimeout("invalid"), 15 * 60 * 1000);

  const args = buildNodeTestArguments(["first.test.js", "second.test.js"], 3);
  assert.deepEqual(args, [
    "--test",
    "--test-concurrency=3",
    "--test-reporter=spec",
    "first.test.js",
    "second.test.js",
  ]);
});

test("test entry points delegate syntax validation to run-tests", () => {
  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
  const releaseWorkflow = readFileSync(releaseWorkflowPath, "utf8");

  assert.equal(packageJson.scripts["test:local"], "node ./scripts/run-tests.mjs");
  assert.equal(
    packageJson.scripts["test:coverage:domain"],
    "node ./scripts/check-domain-coverage.mjs"
  );
  assert.equal(packageJson.scripts["test:mutation:domain"], "stryker run");
  assert.match(readFileSync(mutationConfigPath, "utf8"), /src\/domain\/x01-rules\.js/);
  assert.match(readFileSync(mutationConfigPath, "utf8"), /src\/domain\/cricket-rules\.js/);
  assert.doesNotMatch(releaseWorkflow, /run:\s+npm run check:syntax/);
  assert.match(releaseWorkflow, /run:\s+npm run test:local/);
});
