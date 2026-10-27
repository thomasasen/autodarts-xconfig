import { availableParallelism } from "node:os";

const MAX_MUTATION_CONCURRENCY = 4;
const mutationConcurrency = Math.max(
  1,
  Math.min(MAX_MUTATION_CONCURRENCY, availableParallelism() - 2)
);

export default {
  $schema: "./node_modules/@stryker-mutator/core/schema/stryker-schema.json",
  mutate: [
    // Mutate complete functions touched by the rule-hardening work. Keeping the
    // ranges explicit prevents unrelated legacy helpers from diluting this gate.
    "src/domain/cricket-rules.js:23-25",
    "src/domain/cricket-rules.js:213-234",
    "src/domain/cricket-rules.js:321-358",
    "src/domain/cricket-rules.js:533-661",
    "src/domain/cricket-rules.js:813-923",
    "src/domain/x01-rules.js:27-90",
    "src/domain/x01-rules.js:311-335",
    "src/domain/x01-rules.js:570-745",
    "src/domain/x01-rules.js:872-935",
    "src/domain/x01-rules.js:977-1203",
  ],
  testRunner: "command",
  commandRunner: {
    command: [
      "node --test --test-concurrency=2",
      "--test-skip-pattern=\"X01 checkout reachability|preferred X01 routes\"",
      "tests/domain/x01-rules.test.js",
      "tests/domain/x01-rules-oracle.test.js",
      "tests/domain/cricket-rules.test.js",
      "tests/domain/cricket-rules-oracle.test.js",
    ].join(" "),
  },
  coverageAnalysis: "off",
  concurrency: mutationConcurrency,
  timeoutMS: 30_000,
  dryRunTimeoutMinutes: 2,
  cleanTempDir: "always",
  reporters: ["clear-text", "json", "html"],
  thresholds: {
    high: 90,
    low: 80,
    break: 80,
  },
  ignorePatterns: [
    "dist",
    "docs",
    "e2e",
    "reports",
    "tests/fixtures/autodarts",
    "tests/fixtures/autodarts-live-dom",
    "src/assets",
  ],
};
