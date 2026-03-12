# .agents/skills/userscript-release-build/SKILL.md
---
name: userscript-release-build
description: Use when a completed change in autodarts-xconfig needs final packaging: version bump, userscript rebuild, dist refresh, verification, and commit-ready output. Do not use for early debugging or exploratory code reading.
---

# Goal

Produce a shippable userscript update from the current source tree.

This repository ships a built Tampermonkey file and embeds the package version into the userscript header. If source behavior changed and the change is meant to be used, this finalization step is required.

# Use this skill when

- source code under `src/`, `loader/`, or build-relevant files changed and the result should be shipped
- the version needs to be bumped
- `dist/autodarts-xconfig.user.js` needs to be regenerated
- a commit-ready release validation is needed

# Do not use this skill when

- the task is still exploratory
- the task is only README wording
- the task is only domain debugging without a final packaged result
- Node/npm is unavailable and no release packaging can actually be performed

# Repository anchors

Check:
- `package.json`
- `scripts/build-userscript.mjs`
- `dist/autodarts-xconfig.user.js`
- `loader/autodarts-xconfig.user.js`

# Release rules

- Never hand-edit `dist/autodarts-xconfig.user.js`
- Keep the old version during implementation; bump version in `package.json` only in final release packaging
- If version is already bumped, run `npm run build` before any `npm test` to avoid expected userscript version-sync failures
- Ensure the generated userscript header matches the package version
- Keep build/test reporting honest. If commands cannot run, say so explicitly

# Workflow

## 1. Decide whether version bump is required

Bump the version when:
- user-visible behavior changed
- config behavior changed
- runtime/feature logic changed
- assets shipped in the bundle changed

Do not bump only for notes or comments unless the shipped artifact changed for a reason.

Timing rule:
- do not bump early during debugging/iteration
- bump immediately before rebuild + final verification

## 2. Rebuild from source

Use:
- `npm run build`

This repo builds the userscript through `scripts/build-userscript.mjs`, bundles from `loader/autodarts-xconfig.user.js`, writes to `dist/autodarts-xconfig.user.js`, and embeds `.png`, `.gif`, and `.mp3` assets into the bundle. The userscript header version is derived from `package.json`. :contentReference[oaicite:0]{index=0}

## 3. Verify

Use:
- `npm test`
- optionally `npm run verify`

This repo defines `build`, `test`, and `verify` scripts in `package.json`. :contentReference[oaicite:1]{index=1}

## 4. Final sanity checks

Confirm:
- `dist/autodarts-xconfig.user.js` changed only through the build
- the userscript header version matches `package.json`
- tests passed or failures are reported plainly
- the result is commit-ready

# If Node or npm is unavailable

Do not pretend the build or tests ran.

Instead:
- state exactly which commands could not be run
- describe what was checked statically
- tell the user which commands must be run locally

# Output requirements

A valid result from this skill must:
- include the version bump when required
- regenerate `dist/autodarts-xconfig.user.js`
- report build/test status truthfully
- leave the repository in a commit-ready state

# Preferred commit style

Good examples:
- `build(release): bump to 1.1.12 and rebuild userscript dist`
- `fix(cricket): correct active-player parity and ship 1.1.12`
