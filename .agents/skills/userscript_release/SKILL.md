---
name: userscript_release
description: Use when autodarts-xconfig needs shipped-source release packaging: version bump timing, userscript rebuild, generated artifact refresh, version-parity checks, changelog/release coordination, and clear separation of local, committed, published, and installed userscript state.
---

# Goal

Produce a release-ready userscript state from the current source tree without hiding version, build, or publication drift.

# Use this skill when

- shipped behavior changed and should be packaged
- files under `src/`, `loader/`, `scripts/`, or bundled assets changed and the result is meant to ship
- the version must be bumped
- `dist/autodarts-xconfig.user.js` and `dist/autodarts-xconfig.meta.js` must be refreshed from source
- final handoff must distinguish local, committed, published, and installed version truth

# Do not use this skill when

- the task is still exploratory
- only docs, instructions, or repo guidance changed
- no shipped source or release metadata changed

# Shipped-source change definition

Treat a change as shipped-source when it changes:
- runtime or feature behavior
- userscript metadata or versioned release behavior
- bundled assets
- build or packaging logic that affects generated release output

Pure docs-only or instruction-only work does not trigger this workflow.

# Core rules

- never hand-edit files in `dist/`
- keep the old version during implementation; bump the version only in final release packaging
- if the version is already bumped, run `npm run build` before `npm test` to avoid expected version-parity failures
- keep `package.json`, `src/core/bootstrap.js`, `loader/autodarts-xconfig.user.js`, `dist/autodarts-xconfig.meta.js`, and `dist/autodarts-xconfig.user.js` on the same version
- use `$changelog_maintenance` for curated changelog work; this skill does not replace changelog authoring
- do not claim remote publication or installed-version availability unless it was actually verified

# Workflow

## 1. Decide whether release packaging is required

Require this workflow when shipped source or release metadata changed.

Usually do not use it when:
- only docs changed
- only internal instructions changed
- no versioned output should change

## 2. Bump the version at the final packaging step

Version bump triggers:
- user-visible behavior changed
- config behavior changed
- runtime or feature logic changed
- bundled assets changed
- release metadata changed

Timing rule:
- do not bump early during debugging
- bump immediately before rebuild and final verification

## 3. Rebuild generated artifacts from source

Use:
- `npm run build`

Expected generated outputs:
- `dist/autodarts-xconfig.user.js`
- `dist/autodarts-xconfig.meta.js`

## 4. Run release validation

Required order:
- `npm run check:syntax`
- `npm run build`
- `npm test`
- `npm run verify`

If a narrower iteration pass was used earlier, the final release handoff still requires the full release validation surface.

## 5. Confirm local version parity

Before handoff, confirm matching `@version` or version constants across:
- `package.json`
- `src/core/bootstrap.js` (`API_VERSION`)
- `loader/autodarts-xconfig.user.js`
- `dist/autodarts-xconfig.meta.js`
- `dist/autodarts-xconfig.user.js`

## 6. Separate state surfaces clearly

Report these as different truths:
- local working tree state
- locally committed state
- GitHub-published state
- installed userscript state

Do not collapse them into one "current version" statement.

## 7. Check publication state when relevant

If the release changed the userscript version:
- if push was not performed here, state plainly that GitHub still serves the old version and xConfig will continue to show the old remote version until push
- after push, verify both raw GitHub endpoints expose the same `@version` as local

Suggested PowerShell checks:
- `(Invoke-WebRequest -UseBasicParsing "https://raw.githubusercontent.com/thomasasen/autodarts-xconfig/main/dist/autodarts-xconfig.meta.js").Content | Select-String "@version"`
- `(Invoke-WebRequest -UseBasicParsing "https://raw.githubusercontent.com/thomasasen/autodarts-xconfig/main/dist/autodarts-xconfig.user.js").Content | Select-String "@version"`

# Handoff requirements

Every release-related handoff must state:
- whether the change counted as shipped-source
- whether the version was bumped
- which build and validation commands ran
- whether local version markers are aligned
- whether local working tree and local commit state differ
- whether GitHub-published state was verified or is still old
- what installed Tampermonkey users should expect right now

Every release-related handoff must also end with a ready-to-use commit message in the repository's required format whenever the task changed files.
- do not omit the commit message just because the user did not explicitly ask for one
- if a build was executed, the `validation:` line must name the real command outcome that ran, for example `npm run verify`
- if the task is intentionally not ready to commit, state that explicitly instead of silently skipping the commit guidance

# Environment limits

If Node/npm is unavailable or blocked:
- do not claim the build or tests passed
- state the exact commands that could not run
- report the static checks that were still performed
- say which commands must still be executed locally

# Output requirements

A valid result from this skill must:
- keep source edits out of `dist/`
- refresh generated artifacts through the build flow
- align all local version markers
- coordinate with `$changelog_maintenance` when a version bump or release entry is required
- distinguish local, committed, published, and installed truth explicitly
- report validation and publication state honestly
- include a ready-to-use commit message whenever the task left commit-worthy file changes
