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

# Context budget

- inspect changelog, version metadata, and relevant git history only
- avoid broad `src/**` review unless needed to understand a changelog entry
- avoid `dist/**` unless release packaging explicitly requires it
- stop once the entry can be written or audited from concrete evidence

# Workflow

1. Inspect repository truth: `git status --short`, `git diff --name-only HEAD`, relevant `git log --oneline`, `package.json`, and `CHANGELOG.md`.
2. Update the correct released section; this repository does not maintain an `Unreleased` staging section.
3. Update compare links when release sections change.
4. Leave `CHANGELOG.md` untouched for purely internal cleanup with no shipped or maintainer-visible effect.
5. Run `npm run check:changelog` when changelog structure, release notes, compare links, or version parity are relevant.

# Output requirements

A valid result must:
- leave `CHANGELOG.md` readable on GitHub
- keep entries curated and dual-part
- distinguish local, committed, and GitHub-published truth
- mention remaining uncertainty if history or publication state could not be verified
