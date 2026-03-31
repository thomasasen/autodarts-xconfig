# AGENTS.md

## Repository rules

Use the matching skill from `.agents/skills/` when the task clearly fits one.
Global rules in this file always apply.

Canonical workflow skills:
- use `.agents/skills/changelog-maintenance/SKILL.md` for `CHANGELOG.md`, release notes, version history, or changelog consistency work
- use `.agents/skills/repo-validation/SKILL.md` to choose and report the right validation surface after changes
- use `.agents/skills/userscript-release/SKILL.md` for shipped-source packaging, version bumps, build output refresh, and release/publication truth

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
Skills define task-specific workflows.

Apply both when needed:
- use the relevant domain or feature skill for implementation work
- use `$repo-validation` for validation planning and truthful reporting after changes
- use `$userscript-release` for shipped-source packaging and publication-state checks
- use `$changelog-maintenance` for curated changelog content and changelog consistency

Keep durable repository policy here.
Keep operational step-by-step workflows in the matching skills.

## Subagent use

- the parent agent owns final synthesis, final validation truth, release steps, and handoff clarity
- subagents should stay narrow, evidence-based, and task-specific
- review-oriented subagents should stay read-only unless the task explicitly requires writes
- no subagent may claim build, test, release, or publication success without concrete command output from this repository
- if a subagent summary conflicts with local repository truth, local repository truth wins

## Parallel work

When the current Codex client or runtime supports subagents, background delegation, or parallel execution, use parallel agents when the task naturally splits into independent subtasks.

Rules:
- keep the parent agent responsible for planning, integration, final validation truth, release steps, and final handoff
- prefer parallel agents for bounded side work such as repository exploration, isolated bug analysis, targeted test design, or independent file groups
- only parallelize write tasks when file ownership is disjoint and merge boundaries are clear
- do not spawn extra agents for small or tightly coupled tasks where coordination cost exceeds the benefit
- after parallel work, integrate first and validate the integrated result second

## Worktree guidance

Use separate git worktrees when concurrent agent work would otherwise share one mutable checkout and create avoidable merge risk.

Rules:
- create one worktree per concurrent write stream
- give each worktree a dedicated branch with a task-specific name
- assign each worktree clear file or module ownership
- do not let multiple concurrent write agents edit the same files unless the user explicitly accepts that risk
- prune finished worktrees after integration when they are no longer needed

## ExecPlans

For complex features, significant refactors, or multi-stage work that may span multiple agents, branches, or validation steps, use `PLANS.md` as the repository guide for executable planning.

Use an ExecPlan especially when:
- the work should be split across multiple agents
- the task spans multiple modules or validation stages
- staged integration is likely
- the implementation may take more than one focused working session

## Required validation after changes

After any code change, use `.agents/skills/repo-validation/SKILL.md` to classify the change and choose the right checks.

Minimum rules:
- add or update tests when logic, behavior, DOM mapping, rendering, config behavior, or shipped feature behavior changes
- run the relevant checks after the change
- do not ignore failing tests
- fix the cause or report clearly why validation could not be completed
- for userscript update/version-check behavior, add or update regression coverage for startup check and cache handling, for example `tests/runtime/update-check.test.js` and `tests/runtime/xconfig-shell.test.js`

Validation policy:
- prefer `npm run verify` for shipped behavior changes
- use narrower iteration checks only when they match the actual change scope
- run `npm run check:syntax` before release-style validation
- run `npm run check:changelog` when shipped or user-visible behavior, release metadata, or maintainer-facing release workflow changed
- for docs-only or instruction-only changes, re-read the edited files for contradictions and verify documented commands against `package.json`

## Required release steps for shipped source changes

If the change affects shipped behavior or modifies files under `src/`, `loader/`, `scripts/`, or bundled assets, use `.agents/skills/userscript-release/SKILL.md`.

Required release outcomes:
- bump the version in `package.json`
- rebuild the userscript from source
- refresh `dist/autodarts-xconfig.user.js`
- refresh `dist/autodarts-xconfig.meta.js`
- run the required validation before considering the task complete

Core release commands:
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
Use `.agents/skills/changelog-maintenance/SKILL.md` for workflow detail.

Rules:
- add or update `CHANGELOG.md` for relevant shipped or user-visible changes and for meaningful maintainer-facing release workflow changes
- keep the newest released version section at the top
- every real changelog entry must contain both `Nutzerwirkung:` and `Technik:`
- when the version is bumped, add a new top versioned section with ISO date instead of using an `Unreleased` staging section
- a version increase is not complete if `CHANGELOG.md` was not updated together with the release
- before final handoff, distinguish clearly between local working tree state, locally committed state, and GitHub-published state

## Required publication check for userscript updates

When a release changes the userscript version, the handoff must clearly distinguish:
- local repository state
- GitHub-published state
- installed Tampermonkey state

Release checkpoint codeword:
- use `Versionsspiegel` as the shared codeword for version, build, and publication parity across local source, generated `dist`, GitHub, and installed Tampermonkey state
- if a task touches shipped source, release metadata, userscript headers, version markers, `dist/`, update checks, or anything that could make xConfig show stale installed or GitHub versions, explicitly say that `Versionsspiegel` is relevant
- when `Versionsspiegel` is relevant, pause before final release-style steps and ask a short direct question when the next step has non-obvious consequences, for example version bump, build, dist refresh, local install refresh, commit, or push
- a `Versionsspiegel` pause does not waive commit guidance; if meaningful local changes already exist, the handoff must still include a ready-to-use commit message plus a clear note about which release or publication steps remain open
- do not assume that edited source files alone change the installed or GitHub-visible version; call out the gap until build, install refresh, and push actually happened

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

## VS Code / Workspace Tooling

- workspace recommendations live in `.vscode/extensions.json`
- editor extensions are helpers only and never replace real CLI validation
- linting is only considered complete when the repo lint command was actually executed
- respect the checked-in ESLint rules and workspace settings for this repository
- reserve ESLint ignores for generated artifacts and third-party/vendor code
- keep real project sources and tests in the lint scope; use narrow file-level overrides for legacy hotspots instead of hiding files wholesale
- do not disable ESLint rules without a concrete, justified reason

## Commit expectations

Every commit should clearly state:
- what changed
- why it changed
- how it was implemented
- how it was validated
- final handoff must include a ready-to-use commit message whenever this task left meaningful local repository changes behind
- do not omit the commit message just because the user did not explicitly ask for one
- do not omit the commit message when pausing for `Versionsspiegel`, release confirmation, build, push, or other incomplete end steps; in those cases provide the best current commit message and clearly label the remaining work
- if a build was executed in the task, the commit message `validation:` line must name the real build/test/verify command outcome that was run
- if the task is intentionally incomplete or should not be committed yet, say that explicitly instead of silently omitting the commit guidance

Preferred format:

`type(scope): short summary`

`why: ...`
`what: ...`
`how: ...`
`validation: ...`

## Project commands

- install dependencies: `npm install`
- run lint: `npm run lint`
- build userscript: `npm run build`
- run syntax checks: `npm run check:syntax`
- run changelog checks: `npm run check:changelog`
- run tests: `npm test`
- run full verification: `npm run verify`

## Language quality for German text

For German user-facing wording in code, config labels, xConfig copy, README, and docs:
- use proper German umlauts directly (`ä`, `ö`, `ü`, `Ä`, `Ö`, `Ü`, `ß`)
- do not transliterate as `ae`, `oe`, `ue`, or `ss` unless a technical system explicitly requires ASCII-only output
