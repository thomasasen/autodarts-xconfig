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

Prefer the repository verification flow:
- `npm run verify`

If a narrower check is appropriate during iteration, use:
- `npm test`

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
- run tests: `npm test`
- run full verification: `npm run verify`
