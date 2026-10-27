import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(__filename), "..");

const coverageGates = [
  {
    name: "X01 rules",
    source: "src/domain/x01-rules.js",
    tests: [
      "tests/domain/x01-rules.test.js",
      "tests/domain/x01-rules-oracle.test.js",
    ],
    thresholds: { lines: 87, branches: 82, functions: 93 },
  },
  {
    name: "Cricket and Tactics rules",
    source: "src/domain/cricket-rules.js",
    tests: [
      "tests/domain/cricket-rules.test.js",
      "tests/domain/cricket-rules-oracle.test.js",
    ],
    thresholds: { lines: 93, branches: 75, functions: 100 },
  },
];

const failures = [];

for (const gate of coverageGates) {
  console.log(`\nCoverage gate: ${gate.name}`);
  const result = spawnSync(
    process.execPath,
    [
      "--test",
      "--test-concurrency=2",
      "--experimental-test-coverage",
      `--test-coverage-include=${gate.source}`,
      `--test-coverage-lines=${gate.thresholds.lines}`,
      `--test-coverage-branches=${gate.thresholds.branches}`,
      `--test-coverage-functions=${gate.thresholds.functions}`,
      ...gate.tests,
    ],
    { cwd: repoRoot, stdio: "inherit" }
  );

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    failures.push(gate.name);
  }
}

if (failures.length) {
  throw new Error(`Domain coverage gate failed: ${failures.join(", ")}`);
}
