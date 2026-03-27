---
name: repo_validation
description: Use when autodarts-xconfig changes need the right validation scope, command selection, regression coverage, and truthful reporting after code, config, DOM, update-check, build, release, or repository-guidance work.
---

# Goal

Choose the minimum sufficient validation for the actual change, run what the environment allows, and report the result truthfully.

# Core rules

- classify the change before choosing commands
- combine requirements when a change spans multiple classes
- never invent build, test, or parser results
- report exactly what ran, what did not run, and what risk remains
- prefer the repository's real commands over invented wrappers

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
- confirm any documented commands still exist in `package.json`
- validate changed structured config formats locally when possible, for example TOML files under `.codex/`

## 2. Config-only

Examples:
- `src/config/`
- feature defaults
- config persistence behavior
- config labels or shape changes

Minimum validation:
- add or update targeted config/runtime tests
- run `npm run check:syntax`
- run `npm test`

Targeted anchors:
- `tests/runtime/config-store.test.js`
- `tests/runtime/runtime-config.test.js`

## 3. Logic or runtime behavior

Examples:
- domain rules
- runtime lifecycle
- feature logic
- state derivation
- observer behavior

Minimum validation:
- add or update the closest behavior-level tests
- run `npm run check:syntax`
- run `npm test`

## 4. DOM or rendering behavior

Examples:
- selectors
- overlays
- style contracts
- mount/remount behavior
- DOM mapping

Minimum validation:
- add or update runtime/DOM regression coverage
- run `npm run check:syntax`
- run `npm test`

## 5. Startup, update, version, or cache behavior

Examples:
- bootstrap flow
- xConfig startup checks
- remote version lookup
- cache-busting
- version synchronization
- userscript header/parity logic

Minimum validation:
- add or update targeted regression coverage
- run `npm run check:syntax`
- run `npm test`

Regression-sensitive anchors:
- `tests/runtime/update-check.test.js`
- `tests/runtime/xconfig-shell.test.js`
- `tests/runtime/userscript-build.test.js`

Do not treat this class as complete if those paths were touched conceptually but the regression surface was not reviewed.

## 6. Release or build workflow

Examples:
- `package.json` release metadata
- build scripts
- userscript packaging flow
- changelog consistency script
- generated artifact expectations

Minimum validation:
- run `npm run check:syntax`
- run `npm run build`
- run `npm test`
- run `npm run check:changelog`

Preferred release validation:
- `npm run verify`

If shipped-source packaging or publication truth is in scope, also use `$userscript_release`.

# Selection rules

- if the change affects shipped behavior, default to `npm run verify`
- if the change affects `src/`, `loader/`, `scripts/`, or bundled assets, assume release-sensitive validation until proven otherwise
- if the change is startup/update/version-sensitive, review the three regression anchors explicitly even when only one file changed
- if only docs/guidance/config files changed, do not claim runtime validation proves the documentation is correct; still review the instructions themselves

# Reporting requirements

Every validation summary must state:
- the chosen change class or classes
- which commands were executed
- whether those commands passed, failed, or were not run
- which tests were added or updated, if any
- what could not be executed and why
- what residual risk remains
- whether the task left local file changes that need a commit message in the final handoff

Examples of acceptable phrasing:
- `Executed: npm.cmd run check:syntax, npm.cmd test`
- `Not executed: npm.cmd run build; no shipped-source files changed`
- `Residual risk: instruction-only change; runtime behavior was not modified, so validation is limited to static review and TOML parsing`

# Environment limits

If Node/npm is unavailable or blocked:
- do not claim success
- state the exact commands that could not run
- perform the static review that is still possible
- tell the user which commands still need to be run locally

# Output requirements

A valid result from this skill must:
- use the real repo commands from `package.json`
- choose a validation surface that matches the actual change
- call out regression-sensitive startup/update/version work explicitly
- report execution truthfully
- leave no ambiguity about what remains unverified
- remind the final handoff to include a ready-to-use commit message whenever the task changed files
