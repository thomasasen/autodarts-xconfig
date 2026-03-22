# AGENTS.md

## Repository rules

Use the matching skill from `.agents/skills/` when the task clearly fits one.
Global rules in this file always apply.

Canonical workflow skills:
- use `.agents/skills/changelog_maintenance/SKILL.md` for `CHANGELOG.md`, release notes, version history, or changelog consistency work
- use `.agents/skills/repo_validation/SKILL.md` to choose and report the right validation surface after changes
- use `.agents/skills/userscript_release/SKILL.md` for shipped-source packaging, version bumps, build output refresh, and release/publication truth

## Priority order

If instructions conflict, resolve them in this order:
1. truthfulness
2. correctness
3. validation
4. architecture integrity
5. release consistency
6. changelog/docs
7. commit formatting

Do not hide unmet validation, broken parity, or environment limits to satisfy a lower-priority rule.

## Definition of done

A task is done only when:
- the change lives in the correct source layer and generated output was refreshed only through the build flow when required
- tests and validation were added or updated where needed and the required checks were run
- validation results, blockers, and environment limits were reported truthfully
- release parity, version consistency, generated artifacts, and changelog updates are complete when the change affects shipped source
- the final handoff names any remaining risk, missing execution, or local-vs-remote state gap explicitly

## Architecture guardrails

- keep bootstrap, startup, update-check, cache, and version-sync logic isolated; do not scatter release/version truth across unrelated modules
- avoid unnecessary coupling between rendering/DOM effects, persistence/config storage, and remote/update logic
- prefer pure functions for normalization, mapping, state derivation, and other rule-heavy transformations
- patch the earliest correct layer instead of masking semantic bugs in UI glue or CSS
- treat startup, update-check, cache, and version-parity logic as high-risk and regression-sensitive; changes there require targeted tests

## Skills vs global rules

`AGENTS.md` defines repository-wide invariants.
Skills define specialized operational workflows.

Apply both when needed:
- use the relevant domain or feature skill for implementation work
- use `$repo_validation` for validation planning and truthful reporting
- use `$userscript_release` for shipped-source packaging and publication-state checks
- use `$changelog_maintenance` for curated changelog content and changelog consistency

Do not move repository invariants out of this file just to shorten it.

## Subagent use

- the parent agent owns final synthesis, final validation truth, release steps, and handoff clarity
- subagents should stay narrow, evidence-based, and task-specific
- review-oriented subagents should stay read-only unless the task explicitly requires writes
- no subagent may claim build, test, release, or publication success without concrete command output from this repository
- if a subagent summary conflicts with local repository truth, local repository truth wins

## Required validation after changes

After any code change, use `.agents/skills/repo_validation/SKILL.md` to classify the change and choose the right checks.

Minimum rule:
- add or update tests when logic, behavior, DOM mapping, rendering, config behavior, or shipped feature behavior changes
- run the relevant tests after the change
- do not ignore failing tests
- fix the cause or report clearly why validation could not be completed
- for userscript update/version-check behavior, add or update regression coverage for startup check and cache handling, for example `tests/runtime/update-check.test.js` and `tests/runtime/xconfig-shell.test.js`

Prefer the repository verification flow:
- `npm run verify`

If a narrower check is appropriate during iteration, use:
- `npm run check:syntax`
- `npm test`

Syntax gate requirement:
- run `npm run check:syntax` before release validation
- the check must pass for all JavaScript entry points (`src`, `scripts`, `loader`, `tests`, `dist`) and package JSON files

Changelog gate requirement:
- run `npm run check:changelog` when relevant shipped/user-visible behavior, release metadata, or repository release workflow changed
- do not treat a version bump as complete until `CHANGELOG.md` and the changelog consistency check are updated

## Required release steps for shipped source changes

If the change affects shipped behavior or modifies files under `src/`, `loader/`, `scripts/`, or bundled assets, use `.agents/skills/userscript_release/SKILL.md`.

Required release flow:
- bump the version in `package.json`
- rebuild the userscript from source
- refresh `dist/autodarts-xconfig.user.js`
- refresh `dist/autodarts-xconfig.meta.js`
- run validation before considering the task complete

Use:
- `npm run build`
- `npm test`
- `npm run verify`

A shipped source change is not complete until:
- the version is bumped
- the build succeeded
- tests were run
- generated output matches the current source state
- local version markers are aligned
- `CHANGELOG.md` reflects the released change set

## Required changelog maintenance

Maintain `CHANGELOG.md` as the canonical human-readable history for this repository.
Use `.agents/skills/changelog_maintenance/SKILL.md` for workflow detail.

Rules:
- add or update `CHANGELOG.md` for relevant shipped/user-visible changes and for meaningful release-workflow changes
- keep `## [Unreleased]` at the top
- every real changelog entry must contain both `Nutzerwirkung:` and `Technik:`
- when the version is bumped, move finalized `Unreleased` entries into a new versioned section with ISO date
- a version increase is not complete if `CHANGELOG.md` was not updated together with the release
- before final handoff, distinguish clearly between local working tree state, locally committed state, and GitHub-published state
- before final handoff, verify changelog consistency against current version, working tree, and release status

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

`dist/autodarts-xconfig.user.js` and `dist/autodarts-xconfig.meta.js` are generated build artifacts.

Rules:
- never hand-edit files in `dist/`
- always change source files first
- rebuild after source changes
- commit the refreshed generated files when shipped behavior or release metadata changed

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
- run changelog checks: `npm run check:changelog`
- run tests: `npm test`
- run full verification: `npm run verify`

## Language quality for German text

For German user-facing wording in code, config labels, xConfig copy, README, and docs:
- use proper German umlauts directly (`ä`, `ö`, `ü`, `Ä`, `Ö`, `Ü`, `ß`)
- do not transliterate as `ae`, `oe`, `ue`, or `ss` unless a technical system explicitly requires ASCII-only output
