import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const agentsPath = path.join(root, 'AGENTS.md');
const skillsRoot = path.join(root, '.agents', 'skills');
const packagePath = path.join(root, 'package.json');
const errors = [];

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

  const normalized = text.replace(/\r\n/g, '\n');
  const end = normalized.indexOf('\n---\n', 4);
  if (end === -1) {
    fail(`${label}: unterminated YAML frontmatter`);
    return {};
  }

  const fields = {};
  for (const line of normalized.slice(4, end).split('\n')) {
    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (match) {
      fields[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, '');
    }
  }
  return fields;
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
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
