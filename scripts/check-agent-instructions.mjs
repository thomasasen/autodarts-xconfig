import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const agentsPath = path.join(root, 'AGENTS.md');
const skillsRoot = path.join(root, '.agents', 'skills');
const packagePath = path.join(root, 'package.json');
const errors = [];
const patchAndEditMarkers = new Set([
  ['***', 'Begin', 'Patch'].join(' '),
  ['***', 'End', 'Patch'].join(' '),
  ['BEGIN', 'EDITED'].join(' '),
  ['END', 'EDITED'].join(' '),
]);
const conflictSeparatorPattern = /^={7,}$/;

function fail(message) {
  errors.push(message);
}

function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function exists(filePath) {
  return fs.existsSync(filePath);
}

function parseFrontmatter(text, label) {
  if (!text.startsWith('---\n') && !text.startsWith('---\r\n')) {
    fail(`${label}: missing YAML frontmatter`);
    return {};
  }

  const normalized = text.replaceAll('\r\n', '\n');
  const end = normalized.indexOf('\n---\n', 4);
  if (end === -1) {
    fail(`${label}: unterminated YAML frontmatter`);
    return {};
  }

  const fields = {};
  for (const line of normalized.slice(4, end).split('\n')) {
    const separatorIndex = line.indexOf(':');
    if (separatorIndex > 0) {
      const key = line.slice(0, separatorIndex).trim();
      if (!/^[A-Za-z0-9_-]+$/.test(key)) {
        continue;
      }
      fields[key] = stripWrappingQuotes(line.slice(separatorIndex + 1).trim());
    }
  }
  return fields;
}

function stripWrappingQuotes(value) {
  if (value.length < 2) {
    return value;
  }

  const first = value.at(0);
  const last = value.at(-1);
  return (first === '"' && last === '"') || (first === "'" && last === "'")
    ? value.slice(1, -1)
    : value;
}

function collectInstructionFiles(skillDirs) {
  const files = [agentsPath];
  for (const dir of skillDirs) {
    files.push(path.join(skillsRoot, dir, 'SKILL.md'));
  }
  return files;
}

function reportMatches(text, regex) {
  return Array.from(text.matchAll(regex), (match) => match);
}

function escapeRegExp(value) {
  const specialCharacters = new Set(['.', '*', '+', '?', '^', '$', '{', '}', '(', ')', '|', '[', ']', '\\']);
  return Array.from(value, (character) =>
    specialCharacters.has(character) ? `\\${character}` : character
  ).join('');
}

function hasConflictMarkerRun(line, marker) {
  let runLength = 0;

  for (const character of line) {
    if (character === marker) {
      runLength += 1;
      continue;
    }

    if (runLength >= 7 && character.trim() === '') {
      return true;
    }
    runLength = 0;
  }

  return runLength >= 7;
}

function validateInstructionMarkers(text, label) {
  const lines = String(text || '').replaceAll('\r\n', '\n').split('\n');
  let conflictBlockOpen = false;

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    const lineNumber = index + 1;
    const hasConflictStart = hasConflictMarkerRun(line, '<');
    const hasConflictEnd = hasConflictMarkerRun(line, '>');

    if (hasConflictStart) {
      conflictBlockOpen = true;
      fail(`${label}:${lineNumber}: conflict marker found`);
    }

    if (conflictBlockOpen && conflictSeparatorPattern.test(trimmedLine)) {
      fail(`${label}:${lineNumber}: conflict marker found`);
    }

    if (hasConflictEnd) {
      fail(`${label}:${lineNumber}: conflict marker found`);
      conflictBlockOpen = false;
    }

    if (patchAndEditMarkers.has(trimmedLine)) {
      fail(`${label}:${lineNumber}: patch or edit marker found`);
    }
  });
}

if (!exists(agentsPath)) {
  fail('AGENTS.md is missing');
}

if (!exists(skillsRoot)) {
  fail('.agents/skills/ is missing');
}

let packageJson = {};
if (!exists(packagePath)) {
  fail('package.json is missing');
} else {
  try {
    packageJson = JSON.parse(readText(packagePath));
  } catch (error) {
    fail(`package.json is not valid JSON: ${error.message}`);
  }
}

const packageScripts = new Set(Object.keys(packageJson.scripts ?? {}));
const skillDirs = exists(skillsRoot)
  ? fs.readdirSync(skillsRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort()
  : [];
const skillSet = new Set(skillDirs);

for (const dir of skillDirs) {
  const skillPath = path.join(skillsRoot, dir, 'SKILL.md');
  if (!exists(skillPath)) {
    fail(`.agents/skills/${dir}/SKILL.md is missing`);
    continue;
  }

  const fields = parseFrontmatter(readText(skillPath), `.agents/skills/${dir}/SKILL.md`);
  if (!fields.name) {
    fail(`.agents/skills/${dir}/SKILL.md: frontmatter name is missing`);
  } else if (fields.name !== dir) {
    fail(`.agents/skills/${dir}/SKILL.md: frontmatter name '${fields.name}' does not match directory '${dir}'`);
  }
  if (!fields.description) {
    fail(`.agents/skills/${dir}/SKILL.md: frontmatter description is missing`);
  }
}

const oldSkillNames = [
  ['repo', 'validation'].join('-'),
  ['userscript', 'release'].join('-'),
  ['changelog', 'maintenance'].join('-'),
];

for (const filePath of collectInstructionFiles(skillDirs)) {
  if (!exists(filePath)) {
    continue;
  }

  const rel = path.relative(root, filePath).replaceAll(path.sep, '/');
  const text = readText(filePath);
  validateInstructionMarkers(text, rel);

  for (const match of reportMatches(text, /\$([A-Za-z0-9][A-Za-z0-9_-]*)/g)) {
    const skillName = match[1];
    if (!skillSet.has(skillName)) {
      fail(`${rel}: $${skillName} does not point to an existing skill directory`);
    }
  }

  for (const match of reportMatches(text, /\.agents\/skills\/([A-Za-z0-9_-]+)\/SKILL\.md/g)) {
    const skillPath = path.join(skillsRoot, match[1], 'SKILL.md');
    if (!exists(skillPath)) {
      fail(`${rel}: ${match[0]} does not point to an existing SKILL.md`);
    }
  }

  if (path.basename(filePath) === 'SKILL.md' && path.dirname(filePath).startsWith(skillsRoot)) {
    for (const match of reportMatches(text, /references\/[A-Za-z0-9._-]+\.md/g)) {
      const referencePath = path.join(path.dirname(filePath), match[0]);
      if (!exists(referencePath)) {
        fail(`${rel}: ${match[0]} does not point to an existing reference file`);
      }
    }
  }

  for (const match of reportMatches(text, /`npm run ([A-Za-z0-9:_-]+)`/g)) {
    const scriptName = match[1];
    if (!packageScripts.has(scriptName)) {
      fail(`${rel}: npm script '${scriptName}' does not exist in package.json`);
    }
  }

  for (const oldName of oldSkillNames) {
    const exactOldName = new RegExp(`(^|[^A-Za-z0-9_-])${escapeRegExp(oldName)}([^A-Za-z0-9_-]|$)`);
    if (exactOldName.test(text)) {
      fail(`${rel}: references old skill name '${oldName}'`);
    }
    const oldPath = `.agents/skills/${oldName}/SKILL.md`;
    if (text.includes(oldPath)) {
      fail(`${rel}: references old skill path '${oldPath}'`);
    }
  }
}

if (errors.length > 0) {
  console.error('Agent instruction validation failed:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(`Agent instruction validation passed (${skillDirs.length} skills checked).`);
