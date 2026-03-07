import { readdir } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const testsRoot = path.join(repoRoot, "tests");

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

function runNodeTest(testFile) {
  const result = spawnSync(process.execPath, ["--test", testFile], {
    cwd: repoRoot,
    stdio: "inherit",
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(`Test failed: ${path.relative(repoRoot, testFile)}`);
  }
}

const testFiles = (await collectTestFiles(testsRoot)).sort((left, right) =>
  left.localeCompare(right)
);

for (const testFile of testFiles) {
  runNodeTest(testFile);
}
