---
name: validate-repo-change
description: Choose and report the smallest sufficient local validation for an autodarts-xconfig change. Use after meaningful source changes, when validation scope is unclear, or when final reporting must include residual risk. Do not use for Tier 0-only edits unless needed to document skipped validation.
---

# Goal

Choose the minimum sufficient validation for the actual change, run what the environment allows, and report the result truthfully.

`AGENTS.md` is the sole definition of validation tiers and escalation criteria.
Select the tier there before using the command hints below.

# Core rules

- classify the change before choosing commands
- combine requirements when a change spans classes
- map the change to Tier 0/1/2/3 from `AGENTS.md` before selecting commands
- use real repo commands from `package.json`; never invent results
- stop after the smallest sufficient tier passes
- every command hint below is conditional on the selected tier and actual task scope
- follow `AGENTS.md` restrictions for SonarQube, browser validation, packaging, builds, and repository-wide checks

# Change classes and command hints

## 1. Docs, guidance, or instruction-only

Examples: `README.md`, `docs/`, `AGENTS.md`, `.agents/skills/`, `.codex/`.

Validation:
- re-read changed files for dead references, overlap, and contradictions
- confirm documented commands exist in `package.json`
- run `npm run check:agents` only when a selected non-Tier-0 validation scope
  or an explicit user request requires instruction validation
- review structured instruction formats manually; their format alone does not justify automated validation or escalation

## 2. Config-only

Validation hints:
- add or update targeted config/runtime tests when behavior can change
- run the closest targeted test or `npm run check:syntax` when parsing is the
  relevant risk

## 3. Logic, runtime, DOM, or rendering behavior

Validation hints:
- add or update closest behavior-level tests
- run the directly affected test file or test case first
- use a file- or package-specific lint/type/syntax check when no focused test
  exists

## 4. Startup, update, version, or cache behavior

Validation hints:
- add or update targeted regression coverage
- review `tests/runtime/update-check.test.js`, `tests/runtime/xconfig-shell.test.js`, and `tests/runtime/userscript-build.test.js`
- run the nearest affected test or focused syntax/build check

## 5. Release or build workflow

For build-only changes, choose the closest syntax check or focused build allowed
by `AGENTS.md`; build work alone does not require release validation.

Release validation hints, only when the selected tier and task scope permit them:
- run `npm run check:syntax`
- run `npm run build`
- run `npm test`
- run `npm run check:changelog`

Preferred release validation:
- run `npm run verify`
- run `npm run check:release` before the tag and again against the final tag version
- use `$package-userscript-release` when packaging, `dist/`, version parity, or publication truth is in scope

# Command selection

- `npm run lint` is appropriate when the selected tier allows linting and changes touch linted JS/MJS source, tests, loader code, scripts, or lint configuration
- `npm run check:syntax` is appropriate for JS/MJS source, tests, loader code, scripts, generated-source inputs, and config that affects parsing
- `npm run test:local` is the package-level runtime test command when Tier 2 allows subsystem validation
- `npm test` is Tier 3 because it includes SonarQube
- `npm run build` is appropriate for build workflow, packaging, generated userscript output, version parity, and release preparation
- `npm run sonar` is a Tier 3 standalone SonarQube recheck after local tests
- `npm run verify` is Tier 3 for explicit release/package validation or broad pre-ship validation because it runs `npm test`
- `npm run check:changelog` is appropriate for an explicit validation request or release validation involving changelog structure, release notes, version parity, or compare links; Markdown-only edits remain manual under Tier 0
- a referenced command or structured file format alone does not escalate docs, guidance, or repo-instruction changes beyond the tier selected from `AGENTS.md`

# SonarQube

- use SonarQube validation only when allowed by the selected tier and task scope in `AGENTS.md`
- use `npm run sonar`; it must use `SONARQUBE_URL`/`SONARQUBE_TOKEN` from the environment or fall back to `~/.codex/config.toml` `[mcp_servers.sonarqube].env`
- never report SonarQube as unavailable before trying `npm run sonar`
- never print, quote, commit, or otherwise expose the SonarQube token
- prefer configured local SonarQube settings over hardcoded scanner parameters
- after analysis, query or inspect SonarQube issues for the touched scope when access allows it; fix actionable open issues, then re-run SonarQube until no actionable touched-scope issues remain or a concrete blocker is reached
- for releases, SonarQube is a mandatory local pre-tag gate; a green GitHub Actions run is not a substitute
- when the user explicitly asks for Sonar cleanup, resolve all actionable open project issues that are low-risk and in editable source/test scope, not only the findings that affect the Quality Gate
- report whether SonarQube ran, whether the server processed it, Quality Gate status, and whether relevant open issues remain
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
