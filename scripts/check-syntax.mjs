import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const utf8Decoder = new TextDecoder("utf-8", { fatal: true });

const scanRoots = ["src", "scripts", "loader", "tests", "dist"];
const skipDirectories = new Set(["node_modules", ".git", ".oldrepo", ".agents", ".beispiele"]);
const jsExtensions = new Set([".js", ".mjs", ".cjs"]);

async function collectJavaScriptFiles(rootDirectory) {
  const absoluteRoot = path.join(repoRoot, rootDirectory);
  let entries;
  try {
    entries = await readdir(absoluteRoot, { withFileTypes: true });
  } catch {
    return [];
  }

  const files = [];
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (skipDirectories.has(entry.name)) {
        continue;
      }

      const nestedDirectory = path.join(rootDirectory, entry.name);
      files.push(...(await collectJavaScriptFiles(nestedDirectory)));
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    const extension = path.extname(entry.name).toLowerCase();
    if (!jsExtensions.has(extension)) {
      continue;
    }

    files.push(path.join(rootDirectory, entry.name));
  }

  return files;
}

function assertNodeSyntax(relativeFilePath) {
  const absoluteFilePath = path.join(repoRoot, relativeFilePath);
  const result = spawnSync(process.execPath, ["--check", absoluteFilePath], {
    cwd: repoRoot,
    stdio: "pipe",
    encoding: "utf8",
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    const details = [result.stdout, result.stderr].filter(Boolean).join("\n").trim();
    const message = details || `node --check failed for ${relativeFilePath}`;
    throw new Error(message);
  }
}

async function assertUtf8(relativeFilePath) {
  const absoluteFilePath = path.join(repoRoot, relativeFilePath);
  const raw = await readFile(absoluteFilePath);
  utf8Decoder.decode(raw);
}

async function assertJsonSyntax(relativeFilePath) {
  const absoluteFilePath = path.join(repoRoot, relativeFilePath);
  const jsonRaw = await readFile(absoluteFilePath, "utf8");
  JSON.parse(jsonRaw);
}

const jsFiles = (
  await Promise.all(scanRoots.map((rootDirectory) => collectJavaScriptFiles(rootDirectory)))
)
  .flat()
  .sort((left, right) => left.localeCompare(right));

if (!jsFiles.length) {
  throw new Error("No JavaScript files found for syntax validation.");
}

const jsonFiles = ["package.json", "package-lock.json"];
const failures = [];

for (const relativeFilePath of jsFiles) {
  try {
    await assertUtf8(relativeFilePath);
    assertNodeSyntax(relativeFilePath);
  } catch (error) {
    failures.push({ file: relativeFilePath, error });
  }
}

for (const relativeFilePath of jsonFiles) {
  try {
    await assertJsonSyntax(relativeFilePath);
  } catch (error) {
    failures.push({ file: relativeFilePath, error });
  }
}

if (failures.length) {
  console.error(`Syntax check failed for ${failures.length} file(s):`);
  for (const failure of failures) {
    const message = failure.error instanceof Error ? failure.error.message : String(failure.error);
    console.error(`- ${failure.file}`);
    console.error(`  ${message}`);
  }
  process.exit(1);
}

console.log(
  `Syntax check passed: ${jsFiles.length} JavaScript file(s) + ${jsonFiles.length} JSON file(s).`
);
