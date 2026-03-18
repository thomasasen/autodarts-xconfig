---
name: changelog_maintenance
description: Use when `CHANGELOG.md`, release notes, version history, or version-bump documentation in autodarts-xconfig must be created, updated, or checked for consistency. Also use when shipped or user-visible changes require curated changelog entries instead of raw commit-log text.
---

# Goal

Keep `CHANGELOG.md` accurate, understandable, and synchronized with the repository state.

# Use this skill when

- a changelog must be created or extended
- a version bump needs release notes
- user-visible or shipped changes need a curated changelog entry
- release history should be backfilled from git history
- changelog consistency must be checked before handoff

# Do not use this skill when

- the task is only code implementation with no changelog impact
- the task is only exploratory debugging with no user-visible outcome yet
- the request is to dump commit messages unchanged into release notes

# Core rules

- treat `CHANGELOG.md` as the canonical, human-written history
- never copy commit logs into the changelog without curation
- keep `Unreleased` at the top
- use ISO dates (`YYYY-MM-DD`) for released versions
- write every real changelog entry in two parts:
  - `Nutzerwirkung: ...`
  - `Technik: ...`
- keep `CHANGELOG.md` in UTF-8 and preserve German umlauts directly (`ä`, `ö`, `ü`, `Ä`, `Ö`, `Ü`, `ß`)
- never ship mojibake sequences (for example `Ã`, `Â`, `â€“`, `�`) in changelog text
- separate working-tree truth from commit-history truth
- always check whether local changes exist that are not committed yet
- state clearly when local state, committed state, and GitHub-published state differ

# Workflow

## 1. Inspect repository truth first

Before editing, inspect:

- `git status --short`
- `git diff --name-only HEAD`
- `git log --oneline`
- `package.json`
- `CHANGELOG.md`

Do not assume Codex-made edits were committed.
Treat the working tree and the commit graph as separate sources of truth.

## 2. Decide whether the changelog must change

Update `CHANGELOG.md` when:

- user-visible behavior changed
- shipped behavior changed
- config defaults or meanings changed
- release/version metadata changed
- repository workflows changed in a way that matters for maintainers and releases

Pure internal cleanup with no meaningful external effect may stay out of the changelog.

## 3. Maintain the right section

For normal in-progress work:

- append or revise entries only under `## [Unreleased]`

For version bumps:

- move the finalized `Unreleased` entries into a new released section
- add the release date
- keep a fresh empty `Unreleased` section above it
- update link references at the bottom

If no tags exist yet:

- use GitHub compare links based on release commits
- if the newest local release is not committed yet, a temporary `...HEAD` link is acceptable

## 4. Curate, do not transcribe

For each entry:

- `Nutzerwirkung` explains what changed on screen or in workflow
- `Technik` explains the implementation or validation angle for technical readers

Avoid:

- raw commit noise
- internal-only jargon in the user-facing sentence
- one-line release sections with no concrete outcome

## 5. Run consistency checks

Before handoff:

- verify that `CHANGELOG.md` structure is valid
- verify that the top released version matches `package.json`
- verify that every entry has both required parts
- verify whether relevant local changes exist without changelog updates
- scan `CHANGELOG.md` for mojibake markers and fix before handoff
  - suggested check: `rg -n "Ã|Â|â€“|â€”|â€ž|â€œ|â€™|â€|�" CHANGELOG.md`
- run `npm run check:changelog` when Node/npm is available

Be explicit that this check is heuristic for semantic completeness. It can detect drift signals,
not prove that every meaningful change was documented perfectly.

# Output requirements

A valid result from this skill must:

- leave `CHANGELOG.md` readable on GitHub
- distinguish local working tree, committed history, and GitHub-published state
- include curated dual-part entries
- reject unfiltered commit-log dumps as changelog content
- mention any remaining uncertainty if git history is incomplete or noisy
