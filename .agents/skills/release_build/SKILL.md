# .agents/skills/release_build/SKILL.md
---
name: release_build
description: Use when a completed change in autodarts-xconfig needs final packaging, including version bump, build, test run, dist refresh, and a commit-ready result. Do not use for early debugging or exploratory analysis.
---

# Goal

Produce a shippable repository state after source changes.

# Use this skill when

- source behavior changed and should be shipped
- the version needs to be bumped
- the userscript must be rebuilt
- generated output must be refreshed
- final verification is needed before commit

# Do not use this skill when

- the task is still exploratory
- only docs changed and no shipped artifact should change
- only analysis was requested with no packaging step

# Core rules

- never hand-edit generated output
- bump the version when shipped behavior changes
- rebuild from source
- report build and test status honestly
- if build tools are unavailable, say so plainly

# Workflow

## 1. Decide whether a version bump is required

Bump the version when:
- user-visible behavior changed
- config behavior changed
- runtime or feature logic changed
- shipped assets changed

## 2. Rebuild from source

Use the repository build flow.
Do not patch `dist` manually.

## 3. Verify

Run the available verification steps for this repository.
At minimum, use the project test flow when available.

## 4. Final sanity checks

Confirm:
- generated output came from the build
- version and shipped artifact match
- test results are reported honestly
- repository is left in a commit-ready state

# If local build tools are unavailable

Do not claim success.
Instead:
- state exactly which commands could not run
- describe what was verified statically
- state what still must be executed locally

# Output requirements

A valid result from this skill must:
- leave the repo in a releasable state
- include version bump when needed
- regenerate shipped output through the build flow
- report validation truthfully

# Commit guidance

Prefer commit titles like:
- `build(release): bump version and rebuild userscript`
- `fix(cricket): correct tactics support and ship updated dist`
- `feat(feature): add option and prepare release build`
