import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { spawnSync } from "node:child_process";
import {
  parseChangelogSections,
  validateChangelogDocument,
  isChangelogRelevantFile,
} from "../../scripts/check-changelog-consistency.mjs";

const scriptPath = path.resolve(
  process.cwd(),
  "scripts",
  "check-changelog-consistency.mjs"
);

function buildSampleChangelog(version = "2.0.23") {
  return `# Changelog

## [Unreleased]

_Noch keine Änderungen erfasst._

## [${version}] - 2026-03-16

### Changed

- Nutzerwirkung: Sichtbare Änderung für Nutzer.
  Technik: Technischer Hintergrund der Änderung.

[Unreleased]: https://github.com/thomasasen/autodarts-xconfig/compare/example...HEAD
[${version}]: https://github.com/thomasasen/autodarts-xconfig/compare/example...example2
`;
}

test("parseChangelogSections reads unreleased and released sections in order", () => {
  const sections = parseChangelogSections(buildSampleChangelog());

  assert.equal(sections.length, 2);
  assert.equal(sections[0].name, "Unreleased");
  assert.equal(sections[1].name, "2.0.23");
  assert.equal(sections[1].date, "2026-03-16");
});

test("validateChangelogDocument accepts the expected dual-part entry format", () => {
  const errors = validateChangelogDocument({
    text: buildSampleChangelog(),
    packageVersion: "2.0.23",
    headPackageVersion: "2.0.22",
    changedFiles: ["CHANGELOG.md", "scripts/check-changelog-consistency.mjs"],
  });

  assert.deepEqual(errors, []);
});

test("validateChangelogDocument rejects entries without a Technik line", () => {
  const invalidChangelog = `# Changelog

## [Unreleased]

## [2.0.23] - 2026-03-16

### Fixed

- Nutzerwirkung: Nur der erste Teil ist vorhanden.

[Unreleased]: https://github.com/thomasasen/autodarts-xconfig/compare/example...HEAD
[2.0.23]: https://github.com/thomasasen/autodarts-xconfig/compare/example...example2
`;

  const errors = validateChangelogDocument({
    text: invalidChangelog,
    packageVersion: "2.0.23",
    changedFiles: ["CHANGELOG.md"],
  });

  assert.match(
    errors.join("\n"),
    /braucht direkt danach einen eingerückten "Technik:"-Teil/
  );
});

test("validateChangelogDocument rejects relevant changes without a changelog update", () => {
  const errors = validateChangelogDocument({
    text: buildSampleChangelog(),
    packageVersion: "2.0.23",
    changedFiles: ["src/features/xconfig-ui/index.js"],
  });

  assert.match(errors.join("\n"), /CHANGELOG\.md wurde nicht mitgeändert/);
});

test("isChangelogRelevantFile matches shipped and release-relevant paths only", () => {
  assert.equal(isChangelogRelevantFile("src/core/bootstrap.js"), true);
  assert.equal(isChangelogRelevantFile("loader/autodarts-xconfig.user.js"), true);
  assert.equal(isChangelogRelevantFile("scripts/check-changelog-consistency.mjs"), true);
  assert.equal(isChangelogRelevantFile("tests/runtime/changelog-consistency.test.js"), false);
  assert.equal(isChangelogRelevantFile("CHANGELOG.md"), false);
});

test("CLI changelog consistency check passes for the repository state", () => {
  const result = spawnSync(process.execPath, [scriptPath], {
    cwd: process.cwd(),
    encoding: "utf8",
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /Changelog check passed:/);
});
