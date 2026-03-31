---
name: userscript-release
description: Prepare or finalize an autodarts-xconfig release. Use only when the task explicitly includes release, finalize, ship, package, publish, a version bump, `dist/` refresh, or publication-state verification.
---

# Goal

Produce a release-ready userscript state from the current source tree without hiding version, build, or publication drift.

# Core rules

- never hand-edit files in `dist/`
- keep the old version during implementation; bump only in final release packaging
- if the version is already bumped, run `npm run build` before `npm test`
- keep `package.json`, `src/core/bootstrap.js`, `loader/autodarts-xconfig.user.js`, `dist/autodarts-xconfig.meta.js`, and `dist/autodarts-xconfig.user.js` on the same version
- use `$changelog-maintenance` for curated changelog work
- do not claim remote publication or installed-version availability unless it was actually verified

# Workflow

## 1. Confirm release packaging is actually required

Use this workflow when shipped source, bundled assets, packaging logic, or release metadata changed.

## 2. Bump the version at the final packaging step

Do not bump early during debugging.
Bump immediately before rebuild and final verification.

## 3. Rebuild generated artifacts from source

Run:
- `npm run build`

Expected outputs:
- `dist/autodarts-xconfig.user.js`
- `dist/autodarts-xconfig.meta.js`

## 4. Run release validation

Required order:
- `npm run check:syntax`
- `npm run build`
- `npm test`
- `npm run verify`

## 5. Confirm parity and publication state

Before handoff:
- confirm all local version markers match
- distinguish local working tree, local commit, GitHub-published, and installed userscript state
- if push did not happen, say that GitHub still serves the old version
- after push, verify both raw GitHub endpoints expose the same `@version` as local

# Output requirements

A valid result from this skill must:
- keep source edits out of `dist/`
- refresh generated artifacts through the build flow
- align all local version markers
- distinguish local, committed, published, and installed truth explicitly
- report validation and publication state honestly
- include a ready-to-use commit message whenever the task left commit-worthy file changes
