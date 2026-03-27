---
name: changelog-maintenance
description: Curate, update, or audit `CHANGELOG.md` in autodarts-xconfig. Use when changelog entries, release sections, versioned history, compare links, or changelog consistency need work, especially alongside shipped or maintainer-visible release workflow changes. Do not use for pure code changes with no changelog impact.
---

# Goal

Keep `CHANGELOG.md` accurate, curated, and synchronized with repository truth.

# Core rules

- treat `CHANGELOG.md` as the canonical human-written history
- curate entries; never dump commit logs unchanged
- keep the newest released version section at the top
- use ISO dates (`YYYY-MM-DD`) for released versions
- write every real changelog entry in two parts:
  - `Nutzerwirkung: ...`
  - `Technik: ...`
- keep local working tree truth, committed history truth, and GitHub-published truth separate
- point version, build, parity, and publication work to `$userscript-release`

# Workflow

## 1. Inspect repository truth first

Check:
- `git status --short`
- `git diff --name-only HEAD`
- `git log --oneline`
- `package.json`
- `CHANGELOG.md`

## 2. Update the correct changelog surface

- for release preparation, add or revise the top released section with the release date
- do not maintain an `Unreleased` staging section in this repository
- update compare links when release sections change
- leave the changelog untouched for purely internal cleanup with no shipped or maintainer-visible effect

## 3. Audit for consistency before handoff

Verify:
- the top released version matches `package.json` when a release is in scope
- every real entry contains both required parts
- relevant local changes do not leave `CHANGELOG.md` stale
- mojibake is absent
- `npm run check:changelog` ran when Node/npm is available and the task made it relevant

# Output requirements

A valid result from this skill must:
- leave `CHANGELOG.md` readable on GitHub
- keep entries curated and dual-part
- distinguish local working tree, committed history, and GitHub-published state
- mention any remaining uncertainty if history or publication state could not be verified cleanly
