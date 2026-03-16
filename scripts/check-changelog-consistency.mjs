import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const changelogPath = path.join(repoRoot, "CHANGELOG.md");
const packageJsonPath = path.join(repoRoot, "package.json");
const repoUrl = "https://github.com/thomasasen/autodarts-xconfig";
const versionHeadingPattern =
  /^## \[(Unreleased|[0-9]+\.[0-9]+\.[0-9]+)\](?: - (\d{4}-\d{2}-\d{2}))?$/gm;
const linkReferencePattern = /^\[([^\]]+)\]:\s+(https:\/\/github\.com\/thomasasen\/autodarts-xconfig\/\S+)$/gm;
const placeholderPattern = /^_Noch keine Änderungen erfasst\._$/m;

export function compareSemver(left, right) {
  const leftParts = String(left || "")
    .split(".")
    .map((part) => Number(part));
  const rightParts = String(right || "")
    .split(".")
    .map((part) => Number(part));

  for (let index = 0; index < 3; index += 1) {
    const leftPart = Number.isFinite(leftParts[index]) ? leftParts[index] : 0;
    const rightPart = Number.isFinite(rightParts[index]) ? rightParts[index] : 0;
    if (leftPart !== rightPart) {
      return leftPart - rightPart;
    }
  }

  return 0;
}

export function parseChangelogSections(text) {
  const normalizedText = String(text || "").replace(/\r\n/g, "\n");
  const matches = Array.from(normalizedText.matchAll(versionHeadingPattern));

  return matches.map((match, index) => {
    const nextMatch = matches[index + 1];
    const heading = match[0];
    const name = match[1];
    const date = match[2] || null;
    const start = match.index + heading.length;
    const end = nextMatch ? nextMatch.index : normalizedText.length;
    const body = normalizedText.slice(start, end).trim();

    return {
      name,
      date,
      body,
    };
  });
}

export function isChangelogRelevantFile(filePath) {
  const normalizedPath = String(filePath || "").replace(/\\/g, "/");
  if (!normalizedPath) {
    return false;
  }

  if (normalizedPath === "CHANGELOG.md") {
    return false;
  }

  return (
    normalizedPath === "package.json" ||
    normalizedPath.startsWith("src/") ||
    normalizedPath.startsWith("loader/") ||
    normalizedPath.startsWith("scripts/")
  );
}

function parseLinkReferences(text) {
  const references = new Map();
  const normalizedText = String(text || "").replace(/\r\n/g, "\n");
  const matches = normalizedText.matchAll(linkReferencePattern);

  for (const match of matches) {
    references.set(match[1], match[2]);
  }

  return references;
}

function validateSectionEntries(section) {
  const errors = [];
  const lines = section.body.split("\n");
  let entryCount = 0;
  let currentEntryState = null;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line.trim()) {
      continue;
    }

    if (/^###\s+/.test(line)) {
      currentEntryState = null;
      continue;
    }

    if (/^\s{2,}\S/.test(line) && !/^\s+Technik:\s+\S/.test(line)) {
      if (!currentEntryState) {
        errors.push(
          `Abschnitt ${section.name}: Eingerückter Fließtext muss zu einem Nutzerwirkung-/Technik-Eintrag gehören.`
        );
      }
      continue;
    }

    if (/^- /.test(line) && !/^- Nutzerwirkung:\s+\S/.test(line)) {
      errors.push(
        `Abschnitt ${section.name}: Listenpunkte müssen mit "Nutzerwirkung:" beginnen.`
      );
    }

    if (/^Technik:\s+\S/.test(line)) {
      errors.push(
        `Abschnitt ${section.name}: "Technik:" muss eingerückt direkt unter "Nutzerwirkung:" stehen.`
      );
    }

    if (/^- Nutzerwirkung:\s+\S/.test(line)) {
      if (currentEntryState === "user") {
        errors.push(
          `Abschnitt ${section.name}: Ein "Nutzerwirkung:"-Eintrag wurde begonnen, aber der zugehörige "Technik:"-Teil fehlt noch.`
        );
      }
      entryCount += 1;
      currentEntryState = "user";
    }

    if (/^\s+Technik:\s+\S/.test(line)) {
      if (currentEntryState !== "user") {
        errors.push(
          `Abschnitt ${section.name}: "Technik:" darf nur direkt auf einen "Nutzerwirkung:"-Eintrag folgen.`
        );
      } else {
        currentEntryState = "tech";
      }
    }
  }

  if (currentEntryState === "user") {
    errors.push(
      `Abschnitt ${section.name}: Jeder Eintrag mit "Nutzerwirkung:" braucht direkt danach einen eingerückten "Technik:"-Teil.`
    );
  }

  if (
    section.name !== "Unreleased" &&
    entryCount === 0 &&
    section.body &&
    !placeholderPattern.test(section.body)
  ) {
    errors.push(`Abschnitt ${section.name}: Freigegebene Versionen brauchen mindestens einen Eintrag.`);
  }

  return errors;
}

export function validateChangelogDocument({
  text,
  packageVersion,
  headPackageVersion = null,
  changedFiles = [],
}) {
  const errors = [];
  const normalizedText = String(text || "").replace(/\r\n/g, "\n");

  if (!normalizedText.trim()) {
    return ["CHANGELOG.md ist leer."];
  }

  const sections = parseChangelogSections(normalizedText);
  if (!sections.length) {
    return ["CHANGELOG.md enthält keine gültigen Abschnittsüberschriften."];
  }

  if (sections[0]?.name !== "Unreleased") {
    errors.push('Der erste Changelog-Abschnitt muss "## [Unreleased]" sein.');
  }

  const releaseSections = sections.filter((section) => section.name !== "Unreleased");
  if (!releaseSections.length) {
    errors.push("CHANGELOG.md enthält keine freigegebene Versionssektion.");
  }

  const topRelease = releaseSections[0] || null;
  if (topRelease && topRelease.name !== packageVersion) {
    errors.push(
      `Die oberste freigegebene Version (${topRelease.name}) stimmt nicht mit package.json (${packageVersion}) überein.`
    );
  }

  if (headPackageVersion && headPackageVersion !== packageVersion) {
    const bumpedVersionExists = releaseSections.some((section) => section.name === packageVersion);
    if (!bumpedVersionExists) {
      errors.push(
        `package.json wurde von ${headPackageVersion} auf ${packageVersion} geändert, aber eine passende Release-Sektion fehlt.`
      );
    }
  }

  for (let index = 0; index < releaseSections.length - 1; index += 1) {
    const currentVersion = releaseSections[index].name;
    const nextVersion = releaseSections[index + 1].name;
    if (compareSemver(currentVersion, nextVersion) <= 0) {
      errors.push(
        `Die Versionsreihenfolge ist nicht absteigend: ${currentVersion} steht vor ${nextVersion}.`
      );
    }
  }

  sections.forEach((section) => {
    if (section.name !== "Unreleased" && !section.date) {
      errors.push(`Abschnitt ${section.name}: Freigegebene Versionen brauchen ein ISO-Datum.`);
    }
    errors.push(...validateSectionEntries(section));
  });

  const linkReferences = parseLinkReferences(normalizedText);
  if (!linkReferences.has("Unreleased")) {
    errors.push('Es fehlt die Link-Referenz "[Unreleased]".');
  }

  for (const section of releaseSections) {
    if (!linkReferences.has(section.name)) {
      errors.push(`Es fehlt die Link-Referenz "[${section.name}]".`);
      continue;
    }

    const link = linkReferences.get(section.name) || "";
    if (!link.startsWith(repoUrl)) {
      errors.push(`Die Link-Referenz "[${section.name}]" zeigt nicht auf ${repoUrl}.`);
    }
  }

  const unreleasedLink = linkReferences.get("Unreleased") || "";
  if (!unreleasedLink.startsWith(`${repoUrl}/compare/`)) {
    errors.push('Die Link-Referenz "[Unreleased]" muss ein GitHub-Vergleichslink sein.');
  }

  const hasRelevantChanges = changedFiles.some((filePath) => isChangelogRelevantFile(filePath));
  const changelogWasChanged = changedFiles.some(
    (filePath) => String(filePath || "").replace(/\\/g, "/") === "CHANGELOG.md"
  );
  if (hasRelevantChanges && !changelogWasChanged) {
    errors.push(
      "Es gibt relevante lokale Änderungen in src/loader/scripts/package.json, aber CHANGELOG.md wurde nicht mitgeändert."
    );
  }

  return errors;
}

function readPackageVersion(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8")).version;
}

function runGit(args) {
  return execFileSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function getHeadPackageVersion() {
  try {
    const packageText = runGit(["show", "HEAD:package.json"]);
    return JSON.parse(packageText).version || null;
  } catch {
    return null;
  }
}

function getChangedFiles() {
  const changedFiles = new Set();

  try {
    const tracked = runGit(["diff", "--name-only", "HEAD"]);
    tracked
      .split(/\r?\n/)
      .map((filePath) => filePath.trim())
      .filter(Boolean)
      .forEach((filePath) => changedFiles.add(filePath));
  } catch {
    // Fall back to no tracked diff data.
  }

  try {
    const untracked = runGit(["ls-files", "--others", "--exclude-standard"]);
    untracked
      .split(/\r?\n/)
      .map((filePath) => filePath.trim())
      .filter(Boolean)
      .forEach((filePath) => changedFiles.add(filePath));
  } catch {
    // Fall back to tracked changes only.
  }

  return Array.from(changedFiles).sort((left, right) => left.localeCompare(right));
}

export function runChangelogConsistencyCheck() {
  if (!existsSync(changelogPath)) {
    throw new Error("CHANGELOG.md fehlt im Repository-Root.");
  }

  const changelogText = readFileSync(changelogPath, "utf8");
  const packageVersion = readPackageVersion(packageJsonPath);
  const headPackageVersion = getHeadPackageVersion();
  const changedFiles = getChangedFiles();
  const errors = validateChangelogDocument({
    text: changelogText,
    packageVersion,
    headPackageVersion,
    changedFiles,
  });

  if (errors.length) {
    throw new Error(errors.join("\n"));
  }

  return {
    packageVersion,
    headPackageVersion,
    changedFiles,
  };
}

function isCliEntry() {
  return process.argv[1] && path.resolve(process.argv[1]) === __filename;
}

if (isCliEntry()) {
  try {
    const result = runChangelogConsistencyCheck();
    const changedFileCount = result.changedFiles.length;
    console.log(
      `Changelog check passed: package=${result.packageVersion}, head=${
        result.headPackageVersion || "n/a"
      }, localChangedFiles=${changedFileCount}.`
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Changelog consistency check failed:");
    console.error(message);
    process.exit(1);
  }
}
