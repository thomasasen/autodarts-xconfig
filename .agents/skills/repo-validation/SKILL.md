---
name: repo-validation
description: Choose and report the smallest sufficient local validation for an autodarts-xconfig change. Use when the right checks are not obvious or when the handoff needs explicit validation and residual-risk reporting.
---

# Goal

Choose the minimum sufficient validation for the actual change, run what the environment allows, and report the result truthfully.

# Core rules

- classify the change before choosing commands
- combine requirements when a change spans multiple classes
- never invent build, test, parser, or changelog results
- report exactly what ran, what did not run, and what risk remains
- prefer real repo commands over invented wrappers
- treat `npm run lint` as a hygiene check for actively maintained source, tests, scripts, loader code, and lint config; do not let archive, backup, vendor, or generated trees define the default lint surface

# Change classes

## 1. Docs-only or guidance-only

Examples:
- `README.md`
- `docs/`
- `AGENTS.md`
- `.agents/skills/`
- `.codex/`

Minimum validation:
- re-read changed files for dead references, overlap, and contradictions
- confirm documented commands still exist in `package.json`
- validate changed structured config formats locally when possible

## 2. Config-only

Minimum validation:
- add or update targeted config or runtime tests
- run `npm run check:syntax`
- run `npm test`

## 3. Logic, runtime, DOM, or rendering behavior

Minimum validation:
- add or update the closest behavior-level tests
- run `npm run check:syntax`
- run `npm test`

## 4. Startup, update, version, or cache behavior

Minimum validation:
- add or update targeted regression coverage
- run `npm run check:syntax`
- run `npm test`

Regression-sensitive anchors:
- `tests/runtime/update-check.test.js`
- `tests/runtime/xconfig-shell.test.js`
- `tests/runtime/userscript-build.test.js`

## 5. Release or build workflow

Minimum validation:
- run `npm run check:syntax`
- run `npm run build`
- run `npm test`
- run `npm run check:changelog`

Preferred release validation:
- `npm run verify`

If shipped-source packaging or publication truth is in scope, also use `$userscript-release`.

# Selection rules

- if the change is docs, guidance, or repo-instruction only, do not escalate to runtime validation unless a changed file format or referenced command needs a real local check
- if the change affects behavior, config, runtime, DOM, startup, update, or cache handling, run the narrowest repo commands that prove that scope
- use `npm run lint` when a change touches linted JS/MJS source, tests, loader code, scripts, or lint configuration and the check would add signal beyond syntax/test coverage
- use release validation only when the task explicitly includes release, finalize, ship, package, publish, version bump, `dist/` refresh, or publication-state work
- if the change is startup, update, or version-sensitive, review the three regression anchors explicitly even when only one file changed
- if only docs or guidance changed, do not claim runtime validation proves the instructions are correct

# Reporting requirements

Every validation summary must state:
- the chosen change class or classes
- which commands were executed
- whether those commands passed, failed, or were not run
- which tests were added or updated, if any
- what could not be executed and why
- what residual risk remains

# Output requirements

A valid result from this skill must:
- use the real repo commands from `package.json`
- choose a validation surface that matches the actual change
- report execution truthfully
- leave no ambiguity about what remains unverified
