import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";

const scriptPath = path.resolve(
  process.cwd(),
  "scripts",
  "check-agent-instructions.mjs"
);
const conflictStart = "<".repeat(7);
const conflictSeparator = "=".repeat(7);
const conflictEnd = ">".repeat(7);
const patchAndEditMarkers = [
  ["***", "Begin", "Patch"].join(" "),
  ["***", "End", "Patch"].join(" "),
  ["BEGIN", "EDITED"].join(" "),
  ["END", "EDITED"].join(" "),
];

function runAgentChecker(skillBody) {
  const repositoryRoot = mkdtempSync(path.join(os.tmpdir(), "adx-agent-check-"));
  const skillDirectory = path.join(repositoryRoot, ".agents", "skills", "sample");
  mkdirSync(skillDirectory, { recursive: true });
  writeFileSync(path.join(repositoryRoot, "package.json"), '{"scripts":{}}\n', "utf8");
  writeFileSync(path.join(repositoryRoot, "AGENTS.md"), "# Repository instructions\n", "utf8");
  writeFileSync(
    path.join(skillDirectory, "SKILL.md"),
    `---\nname: sample\ndescription: Test fixture.\n---\n\n${skillBody}\n`,
    "utf8"
  );

  try {
    return spawnSync(process.execPath, [scriptPath], {
      cwd: repositoryRoot,
      encoding: "utf8",
    });
  } finally {
    rmSync(repositoryRoot, { recursive: true, force: true });
  }
}

test("agent checker rejects a complete conflict block", () => {
  const result = runAgentChecker(
    `${conflictStart} HEAD\nleft\n${conflictSeparator}\nright\n${conflictEnd} branch`
  );

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /conflict marker/i);
});

test("agent checker rejects a conflict end marker appended to content", () => {
  const result = runAgentChecker(`Instruction text.${conflictEnd} REPLACE`);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /conflict marker/i);
});

test("agent checker rejects patch and edited-content markers", () => {
  for (const marker of patchAndEditMarkers) {
    const result = runAgentChecker(marker);
    assert.notEqual(result.status, 0, marker);
    assert.match(result.stderr, /patch or edit marker/i, marker);
  }
});

test("agent checker accepts a Markdown Setext heading separator", () => {
  const result = runAgentChecker(`Heading\n${conflictSeparator}`);

  assert.equal(result.status, 0, result.stderr || result.stdout);
});
