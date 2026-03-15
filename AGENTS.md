# AGENTS.md

## Repository rules

Use the matching skill from `.agents/skills/` when the task clearly fits one.
Skills add specialized workflows.
The rules in this file always apply.

## Required validation after changes

After any code change, perform appropriate validation.

Minimum rule:
- add or update tests when logic, behavior, DOM mapping, rendering, config behavior, or shipped feature behavior changes
- run the relevant tests after the change
- do not ignore failing tests
- fix the cause or report clearly why validation could not be completed
- for userscript update/version-check behavior, add or update regression coverage for startup check and cache handling (for example `tests/runtime/update-check.test.js` and `tests/runtime/xconfig-shell.test.js`)

Prefer the repository verification flow:
- `npm run verify`

If a narrower check is appropriate during iteration, use:
- `npm run check:syntax`
- `npm test`

Syntax gate requirement:
- run `npm run check:syntax` before release validation
- the check must pass for all JavaScript entry points (`src`, `scripts`, `loader`, `tests`, `dist`) and package JSON files

## Required release steps for shipped source changes

If the change affects shipped behavior or modifies files under `src/`, `loader/`, `scripts/`, or bundled assets:

- bump the version in `package.json`
- rebuild the userscript from source
- refresh `dist/autodarts-xconfig.user.js`
- run validation before considering the task complete

Use:
- `npm run build`
- `npm test`
- `npm run verify`

A shipped source change is not complete until:
- version is bumped
- build succeeded
- tests were run
- generated output matches the current source state

## Required publication check for userscript updates

When a release changes the userscript version, the handoff must clearly distinguish:
- local repository state
- GitHub published state
- installed Tampermonkey state

Mandatory before final handoff:
- confirm `package.json`, `src/core/bootstrap.js` (`API_VERSION`), `loader/autodarts-xconfig.user.js`, `dist/autodarts-xconfig.meta.js`, and `dist/autodarts-xconfig.user.js` all use the same `@version`
- if the environment cannot push to GitHub, explicitly state that the remote version is still old and xConfig will continue to show the old GitHub version until push
- after push, verify both remote endpoints expose the same `@version` as local

Suggested PowerShell check:
- `(Invoke-WebRequest -UseBasicParsing "https://raw.githubusercontent.com/thomasasen/autodarts-xconfig/main/dist/autodarts-xconfig.meta.js").Content | Select-String "@version"`
- `(Invoke-WebRequest -UseBasicParsing "https://raw.githubusercontent.com/thomasasen/autodarts-xconfig/main/dist/autodarts-xconfig.user.js").Content | Select-String "@version"`

## Generated files

`dist/autodarts-xconfig.user.js` is a generated build artifact.

Rules:
- never hand-edit files in `dist/`
- always change source files first
- rebuild after source changes
- commit the refreshed generated file when shipped behavior changed

Flow:
`src` or other shipped source changes -> version bump -> build -> test -> commit updated `dist`

## Environment truthfulness

This repository uses Node.js and npm for build and test execution.

If Node/npm is available in the current environment:
- run the required commands

If Node/npm is not available:
- do not claim that build or tests passed
- do not invent validation results
- state exactly which commands could not be executed
- perform static review where possible
- tell the developer which commands must be run locally

Windows / PowerShell note:
- if `npm` is blocked by execution policy, use `npm.cmd`

## Commit expectations

Every commit should clearly state:
- what changed
- why it changed
- how it was implemented
- how it was validated
- if a build was executed in the task, provide a ready-to-use commit message in this format before handoff

Preferred format:

`type(scope): short summary`

`why: ...`
`what: ...`
`how: ...`
`validation: ...`

Example:

`fix(cricket): stabilize tactics state derivation and board/grid parity`

`why: tactics mode could drift from cricket assumptions and produce inconsistent target-state rendering.`
`what: generalized state derivation for tactics objectives and aligned board/grid consumption with the same semantic state.`
`how: updated domain normalization, target-state derivation, and regression coverage.`
`validation: npm run verify`

## Project commands

- install dependencies: `npm install`
- build userscript: `npm run build`
- run syntax checks: `npm run check:syntax`
- run tests: `npm test`
- run full verification: `npm run verify`

## Language quality for German text

For German user-facing wording in code, config labels, xConfig copy, README, and docs:
- use proper German umlauts directly (`ä`, `ö`, `ü`, `Ä`, `Ö`, `Ü`, `ß`)
- do not transliterate as `ae`, `oe`, `ue`, or `ss` unless a technical system explicitly requires ASCII-only output

