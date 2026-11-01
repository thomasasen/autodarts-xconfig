---
name: maintain-changelog
description: Curate, update, or audit `CHANGELOG.md` in autodarts-xconfig. Use only when changelog editing, release notes, compare-link maintenance, or changelog consistency checks are explicitly in scope.
---

# Goal

Keep `CHANGELOG.md` accurate, curated, and synchronized with repository truth.

# Core rules

- treat `CHANGELOG.md` as curated human-written history
- never dump commit logs unchanged
- keep the newest released version at the top
- use ISO dates (`YYYY-MM-DD`) for released versions
- write every real changelog entry in two parts: `Nutzerwirkung: ...` and `Technik: ...`
- keep local working tree, committed history, and GitHub-published truth separate
- point packaging, version parity, `dist/**`, and publication work to `$package-userscript-release`
- do not duplicate release workflow here
- preserve tagless historical links; do not invent retroactive tags
- from `2.9.2` onward, compare immutable release tags, except the first tagged release may compare the real `2.9.1` release commit to `v2.9.2`
- a finalized tagged release compare link must never point to `HEAD`

# Relevant context

- start with changelog, version metadata, and relevant git history
- inspect relevant source files narrowly when needed to substantiate a changelog statement

# Workflow

1. Inspect repository truth: `git status --short`, `git diff --name-only HEAD`, relevant `git log --oneline`, `package.json`, and `CHANGELOG.md`.
2. Update the correct released section; this repository does not maintain an `Unreleased` staging section.
3. Update compare links when release sections change.
   For `2.9.2`, use `<2.9.1-release-commit>...v2.9.2`; for later releases use `v<previous>...v<current>`.
4. Leave `CHANGELOG.md` untouched for purely internal cleanup with no shipped or maintainer-visible effect.
5. For Markdown-only changes, manually review entries and compare links under Tier 0 from `AGENTS.md`. Run `npm run check:changelog` only for an explicit validation request or release validation when the selected tier and task scope permit it.

# Output requirements

A valid result must:
- leave `CHANGELOG.md` readable on GitHub
- keep entries curated and dual-part
- distinguish local, committed, and GitHub-published truth
- mention remaining uncertainty if history or publication state could not be verified
