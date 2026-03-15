# .agents/skills/release_build/SKILL.md
---
name: release_build
description: Use when a completed change in autodarts-xconfig needs final packaging, including version bump, build, test run, dist refresh, and a commit-ready result. Do not use for early debugging or exploratory analysis.
---

# Goal

Produce a shippable repository state after source changes.

# Use this skill when

- source behavior changed and should be shipped
- the version needs to be bumped
- the userscript must be rebuilt
- generated output must be refreshed
- final verification is needed before commit

# Do not use this skill when

- the task is still exploratory
- only docs changed and no shipped artifact should change
- only analysis was requested with no packaging step

# Core rules

- never hand-edit generated output
- bump the version when shipped behavior changes
- keep the old version during implementation; bump only in the final release-packaging step
- rebuild from source
- report build and test status honestly
- if build tools are unavailable, say so plainly
- if version was already bumped, run `npm run build` before any `npm test` to avoid expected userscript version-sync failures
- keep version markers synchronized across `package.json`, runtime API constant, loader header, and dist/meta headers

# Workflow

## 1. Decide whether a version bump is required

Bump the version when:
- user-visible behavior changed
- config behavior changed
- runtime or feature logic changed
- shipped assets changed

Timing rule:
- do not bump early during debugging/iteration
- bump immediately before rebuild + final verification

## 2. Rebuild from source

Use the repository build flow.
Do not patch `dist` manually.

## 3. Verify

Run the available verification steps for this repository.
At minimum, use the project test flow when available.

Syntax gate order:
- run `npm run check:syntax` before build/test verification
- if syntax check fails, do not continue to release packaging

### Handling hanging test runs (required)

If `npm test` hangs or runs far beyond normal repo duration, treat this as an execution failure.

Required handling:
- do not start additional parallel test runs
- identify stale test processes (`npm`, `run-tests.mjs`, `node --test`)
- terminate only the matching stale processes
- rerun validation from a clean process state
- state clearly in reporting that a timeout/hang happened and how it was resolved

## 4. Final sanity checks

Confirm:
- generated output came from the build
- version and shipped artifact match
- all local version markers are aligned (`package.json`, runtime API, loader, dist/meta)
- test results are reported honestly
- repository is left in a commit-ready state

## 5. Publish-state checks (required)

For userscript releases, also confirm and report:
- local release version
- remote GitHub version after push (or explicitly: not pushed / not verifiable)
- implication for xConfig update panel when remote is not yet updated

# If local build tools are unavailable

Do not claim success.
Instead:
- state exactly which commands could not run
- describe what was verified statically
- state what still must be executed locally

# Output requirements

A valid result from this skill must:
- leave the repo in a releasable state
- include version bump when needed
- regenerate shipped output through the build flow
- pass `npm run check:syntax` before final test reporting
- report validation truthfully
- report local-vs-remote publish state for versioned userscript releases
- include a ready-to-use commit message in the required repository format whenever a build was run

# Commit guidance

Prefer commit titles like:
- `build(release): bump version and rebuild userscript`
- `fix(cricket): correct tactics support and ship updated dist`
- `feat(feature): add option and prepare release build`

Use this commit message structure (required by repository convention):
- `type(scope): short summary`
- `why: ...`
- `what: ...`
- `how: ...`
- `validation: ...`

Example:
- `build(release): bump to 1.1.55 and rebuild userscript dist`
- `why: shipped cricket-highlighter behavior changed and required a synchronized release artifact.`
- `what: updated version metadata and regenerated dist userscript output from source.`
- `how: bumped package version, synced loader/runtime version markers, and rebuilt through npm scripts.`
- `validation: npm run build && npm test && npm run verify`
