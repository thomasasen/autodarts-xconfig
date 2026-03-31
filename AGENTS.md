# AGENTS.md

## Repository rules

Use the matching skill from `.agents/skills/` when the task clearly fits.
Keep durable repository invariants here and task-specific workflow detail in skills.

Priority order:
1. truthfulness
2. correctness
3. validation
4. architecture integrity
5. release consistency

Do not hide unmet validation, environment limits, or release drift to satisfy a lower-priority rule.

## Core defaults

- prefer minimal diffs and existing project conventions
- edit the earliest correct source layer instead of masking semantic bugs in UI glue or CSS
- keep bootstrap, startup, update-check, cache, and version-sync logic isolated; treat those areas as regression-sensitive
- never hand-edit `dist/`; change source first and refresh generated output only through the build flow when release work is explicitly in scope
- use proper German umlauts directly in user-facing German text unless a technical surface requires ASCII

## Validation

- choose validation proportional to scope and report exactly what ran, what did not run, and what risk remains
- behavior, config, DOM, runtime, startup, update, or cache changes need targeted local tests or checks
- guidance or instruction-only changes need a consistency review plus verification that referenced commands still exist in `package.json`
- use `.agents/skills/repo-validation/SKILL.md` when the right validation surface is non-obvious or needs explicit reporting

## Release-only work

Version bumps, `dist/` refresh, changelog updates, release verification, packaging, shipping, and publication checks are required only when the user explicitly asks to release, finalize, ship, package, or publish.

When release work is in scope:
- use `.agents/skills/userscript-release/SKILL.md` for packaging, version parity, generated artifacts, and publication truth
- use `.agents/skills/changelog-maintenance/SKILL.md` when `CHANGELOG.md` or release notes are part of the task

## Done

A task is done when the change lives in the correct source layer, the validation required for that scope was run or reported as blocked, and any explicitly requested release work was completed or called out as still pending.
