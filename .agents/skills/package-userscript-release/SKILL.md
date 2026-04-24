---
name: package-userscript-release
description: Package or verify an autodarts-xconfig userscript release. Use only for explicit release, finalize, package, ship, publish, version bump, `dist/` refresh, or publication-state verification work. Do not use for ordinary code changes.
---

# Goal

Produce a release-ready userscript state from the current source tree without hiding version, build, artifact, or publication drift.

# Strict trigger

Use this skill only when the user explicitly asks for release, finalize, package, ship, publish, version bump, `dist/` refresh, or publication-state verification.

Do not use it for ordinary implementation, cleanup, validation, or docs work.

# Core rules

- do not bump versions early; bump only at the final packaging step
- do not touch `dist/**` by hand
- refresh generated artifacts only through `npm run build`
- keep `package.json`, `src/core/bootstrap.js`, `loader/autodarts-xconfig.user.js`, `dist/autodarts-xconfig.meta.js`, and `dist/autodarts-xconfig.user.js` on the same version
- keep local working tree, local commit, GitHub-published, and installed-userscript truth separate
- use `$maintain-changelog` for changelog curation; do not duplicate changelog policy here
- do not claim remote publication or installed-version availability unless actually verified

# Context budget

- inspect only release-relevant source, metadata, changelog, and generated artifact paths needed for parity
- avoid broad source tours unless release verification exposes a mismatch
- avoid `docs/**` unless release notes or explicitly cited documentation are in scope

# Workflow

1. Confirm release packaging is explicitly required.
2. Keep implementation on the old version until final packaging.
3. Bump version markers at the final packaging step.
4. Run `npm run build` to refresh generated artifacts.
5. Run release validation from `$validate-repo-change`.
6. Confirm local version parity across source and generated userscript files.
7. If publication is in scope, verify GitHub raw endpoints separately from local files.
8. If installed userscript state is in scope, verify it separately from GitHub publication.

# Output requirements

A valid result must:
- keep source edits out of `dist/**`
- refresh generated artifacts only through the build flow
- align all local version markers
- distinguish local, committed, GitHub-published, and installed truth
- report validation and publication state honestly
