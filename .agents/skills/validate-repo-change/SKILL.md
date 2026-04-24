---
name: validate-repo-change
description: Choose and report the smallest sufficient local validation for an autodarts-xconfig change. Use after repo changes, when validation scope is unclear, or when final reporting must include residual risk.
---

# Goal

Choose the minimum sufficient validation for the actual change, run what the environment allows, and report the result truthfully.

# Core rules

- classify the change before choosing commands
- combine requirements when a change spans classes
- use real repo commands from `package.json`; never invent results
- SonarQube complements lint/tests and never replaces repo checks
- use SonarQube only when the touched scope makes it relevant and server/auth access is available
- if SonarQube is relevant but blocked, report the concrete blocker
- if SonarQube reports fixable findings in the touched scope, fix and recheck until clean or concretely blocked

# Context budget

- search first, then open only the smallest relevant files
- avoid broad tours through `src/**`
- avoid `dist/**`
- avoid `docs/**` unless task-relevant
- for code tasks, start with likely owner files and nearest tests
- stop expanding context when current evidence is sufficient

# Change classes

## 1. Docs, guidance, or instruction-only

Examples: `README.md`, `docs/`, `AGENTS.md`, `.agents/skills/`, `.codex/`.

Minimum validation:
- re-read changed files for dead references, overlap, and contradictions
- confirm documented commands exist in `package.json`
- run `npm run check:agents` when instruction files or skill references changed
- validate changed structured config formats locally when possible

## 2. Config-only

Minimum validation:
- add or update targeted config/runtime tests when behavior can change
- run `npm run check:syntax`
- run `npm test`

## 3. Logic, runtime, DOM, or rendering behavior

Minimum validation:
- add or update closest behavior-level tests
- run `npm run check:syntax`
- run `npm test`

## 4. Startup, update, version, or cache behavior

Minimum validation:
- add or update targeted regression coverage
- review `tests/runtime/update-check.test.js`, `tests/runtime/xconfig-shell.test.js`, and `tests/runtime/userscript-build.test.js`
- run `npm run check:syntax`
- run `npm test`

## 5. Release or build workflow

Minimum validation:
- run `npm run check:syntax`
- run `npm run build`
- run `npm test`
- run `npm run check:changelog`

Preferred release validation:
- run `npm run verify`
- use `$package-userscript-release` when packaging, `dist/`, version parity, or publication truth is in scope

# Command selection

- `npm run lint` is required when changes touch linted JS/MJS source, tests, loader code, scripts, or lint configuration
- `npm run check:syntax` is appropriate for JS/MJS source, tests, loader code, scripts, generated-source inputs, and config that affects parsing
- `npm test` is appropriate for behavior, runtime, config, DOM, startup, update, cache, and regression-sensitive changes
- `npm run build` is appropriate for build workflow, packaging, generated userscript output, version parity, and release preparation
- `npm run verify` is appropriate for explicit release/package validation or broad pre-ship validation
- `npm run check:changelog` is appropriate when `CHANGELOG.md`, release notes, version parity, or compare links are in scope
- do not escalate docs, guidance, or repo-instruction changes to runtime validation unless a referenced command or changed file format needs a real local check

# SonarQube

- use SonarQube validation when changes affect Sonar-scanned `src/**`, `loader/**`, `scripts/**`, `tests/**`, `sonar-project.properties`, or Sonar-specific repo guidance and server/auth access is available
- prefer configured local SonarQube settings over hardcoded scanner parameters
- report whether SonarQube ran, whether the server processed it, and whether touched-scope findings remain
- if blocked, name the blocker: unavailable MCP, missing auth, unreachable server, scanner failure, or project visibility

# Final Report Template

Changed:
- ...

Validated:
- ...

Not verified:
- ...

Residual risk:
- ...

Draft commit message:
```text
type(optional-scope): concise summary

- optional concrete bullet
```
