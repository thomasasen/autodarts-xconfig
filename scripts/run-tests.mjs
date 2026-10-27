import { availableParallelism } from "node:os";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const testsRoot = path.join(repoRoot, "tests");
const syntaxCheckScript = path.join(repoRoot, "scripts", "check-syntax.mjs");
const DEFAULT_MAX_CONCURRENCY = 4;
const DEFAULT_TEST_TIMEOUT_MS = 15 * 60 * 1000;
const MAX_TEST_TIMEOUT_MS = 30 * 60 * 1000;

async function collectTestFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectTestFiles(absolutePath)));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".test.js")) {
      files.push(absolutePath);
    }
  }

  return files;
}

function resolveTestConcurrency(rawValue = process.env.AD_TEST_CONCURRENCY) {
  const requested = Number.parseInt(String(rawValue || ""), 10);
  if (Number.isInteger(requested) && requested > 0) {
    return Math.min(requested, DEFAULT_MAX_CONCURRENCY);
  }

  return Math.max(1, Math.min(DEFAULT_MAX_CONCURRENCY, availableParallelism() - 1));
}

function buildNodeTestArguments(testFiles, concurrency = resolveTestConcurrency()) {
  return [
    "--test",
    `--test-concurrency=${concurrency}`,
    "--test-reporter=spec",
    ...testFiles,
  ];
}

function resolveTestTimeout(rawValue = process.env.AD_TEST_TIMEOUT_MS) {
  const requested = Number.parseInt(String(rawValue || ""), 10);
  if (Number.isInteger(requested) && requested > 0) {
    return Math.min(requested, MAX_TEST_TIMEOUT_MS);
  }
  return DEFAULT_TEST_TIMEOUT_MS;
}

function runSyntaxGate() {
  const result = spawnSync(process.execPath, [syntaxCheckScript], {
    cwd: repoRoot,
    stdio: "inherit",
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error("Syntax check failed before running tests.");
  }
}

function runNodeTests(testFiles) {
  const concurrency = resolveTestConcurrency();
  const timeout = resolveTestTimeout();
  console.log(
    `Running ${testFiles.length} test file(s) with concurrency ${concurrency} ` +
      `and a ${Math.round(timeout / 1000)}s watchdog.`
  );
  const result = spawnSync(
    process.execPath,
    buildNodeTestArguments(testFiles, concurrency),
    { cwd: repoRoot, stdio: "inherit", timeout }
  );

  if (result.error) {
    if (result.error.code === "ETIMEDOUT") {
      throw new Error(`Test runner exceeded the ${Math.round(timeout / 1000)}s watchdog.`);
    }
    throw result.error;
  }

  if (result.signal) {
    throw new Error(`Test runner terminated by signal ${result.signal}.`);
  }

  if (result.status !== 0) {
    throw new Error("One or more test files failed.");
  }
}

async function main() {
  runSyntaxGate();

  const testFiles = (await collectTestFiles(testsRoot)).sort((left, right) =>
    left.localeCompare(right)
  );
  if (!testFiles.length) {
    throw new Error("No test files found.");
  }

  runNodeTests(testFiles);
}

const isMain = process.argv[1]
  ? import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
  : false;

if (isMain) {
  await main();
}

export {
  buildNodeTestArguments,
  collectTestFiles,
  resolveTestConcurrency,
  resolveTestTimeout,
  runNodeTests,
  runSyntaxGate,
};
