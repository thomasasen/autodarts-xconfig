---
name: changelog_maintenance
description: Use when `CHANGELOG.md`, release notes, version history, or version-bump documentation in autodarts-xconfig must be created, updated, or checked for consistency. Also use when shipped or user-visible changes require curated changelog entries instead of raw commit-log text.
---

# Goal

Keep `CHANGELOG.md` accurate, curated, and synchronized with repository truth.

# Core rules

- treat `CHANGELOG.md` as the canonical human-written history
- curate entries; never dump commit logs unchanged
- keep `## [Unreleased]` at the top
- use ISO dates (`YYYY-MM-DD`) for released versions
- write every real changelog entry in two parts:
  - `Nutzerwirkung: ...`
  - `Technik: ...`
- keep `CHANGELOG.md` in UTF-8 and preserve German umlauts directly (`ä`, `ö`, `ü`, `Ä`, `Ö`, `Ü`, `ß`)
- never ship mojibake sequences such as `Ãƒ`, `Ã‚`, `Ã¢â‚¬â€œ`, or `�`
- separate working-tree truth, committed-history truth, and GitHub-published truth
- do not document pure internal cleanup unless it changes shipped behavior, maintainer workflow, release workflow, or user-visible expectations

# Workflow modes

## 1. Edit or update

Use this mode when current work needs a curated changelog entry.

- inspect repository truth first:
  - `git status --short`
  - `git diff --name-only HEAD`
  - `git log --oneline`
  - `package.json`
  - `CHANGELOG.md`
- for in-progress work, add or revise entries only under `## [Unreleased]`
- document:
  - shipped behavior changes
  - user-visible config/default meaning changes
  - release metadata changes
  - release-workflow changes that matter to maintainers
- do not add noise for test-only cleanup, refactors with no external effect, or temporary debugging steps

## 2. Release preparation

Use this mode when changelog work overlaps with a version bump or release packaging.

- this skill owns changelog structure, entry curation, release sections, and compare links
- `$userscript_release` owns version bump timing, build output refresh, local version parity, and publication-state checks
- when versioning a release:
  - move finalized `Unreleased` entries into a new released section
  - add the release date
  - keep a fresh `## [Unreleased]` section above it
  - update bottom compare links
- if no tags exist yet:
  - use GitHub compare links based on release commits
  - if the newest local release is not committed yet, a temporary `...HEAD` compare link is acceptable

## 3. Audit or consistency check

Use this mode before handoff or when changelog drift is suspected.

- verify the top released version matches `package.json`
- verify every real entry contains both required parts
- verify relevant local changes do not leave `CHANGELOG.md` untouched
- verify local working tree, committed history, and GitHub-published state are described separately
- scan for mojibake before handoff
  - suggested check: `rg -n "Ãƒ|Ã‚|Ã¢â‚¬â€œ|Ã¢â‚¬â€|Ã¢â‚¬Å¾|Ã¢â‚¬Å“|Ã¢â‚¬â„¢|Ã¢â‚¬|�" CHANGELOG.md`
- run `npm run check:changelog` when Node/npm is available

This check is structural and drift-oriented. It improves confidence, but it does not prove perfect semantic completeness.

## 4. Historical backfill

Use this mode when older history must be reconstructed.

- curate from git history instead of copying commit subjects
- preserve uncertainty when history is noisy or incomplete
- favor accurate summaries over exhaustive low-value detail
- do not invent release dates, scope, or user impact that the history cannot support

# Relevance filter

Update `CHANGELOG.md` when:
- shipped behavior changed
- user-visible behavior changed
- config defaults or meanings changed
- release/version metadata changed
- repository release workflow changed in a way that matters for maintainers

Usually leave `CHANGELOG.md` unchanged when:
- only tests changed with no user-visible or maintainer-visible effect
- internal refactors preserve behavior and release workflow
- exploratory debugging produced no shipped outcome

# Output requirements

A valid result from this skill must:
- leave `CHANGELOG.md` readable on GitHub
- keep entries curated and dual-part
- distinguish local working tree, committed history, and GitHub-published state
- reject raw commit-log dumps as release notes
- point version/build/parity/publication work to `$userscript_release` instead of absorbing that workflow
- mention any remaining uncertainty if history or publication state could not be verified cleanly
