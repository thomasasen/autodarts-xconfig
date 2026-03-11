# .agents/skills/feature_change/SKILL.md
---
name: feature_change
description: Use when adding, changing, or refactoring a shipped feature in autodarts-xconfig, including config behavior, runtime logic, UI behavior, effects, themes, selectors, observers, or module wiring. Do not use for release-only work, README-only edits, or legacy parity recovery from .oldrepo.
---

# Goal

Implement feature changes in the existing project architecture without creating drift between source, config, tests, and shipped behavior.

# Use this skill when

- a new feature is added
- an existing feature is changed
- runtime logic or DOM integration changes
- config options or defaults change
- UI behavior, effects, themes, or overlays change
- selectors, observers, mount logic, or feature wiring change
- a refactor changes shipped behavior or feature structure

# Do not use this skill when

- the task is only release, rebuild, version bump, or dist refresh
- the task is only documentation wording or README maintenance
- the task is mainly about recovering old behavior from `.oldrepo`
- the task is a Cricket/Tactics semantic bug where board/grid meaning may be wrong

# Repository mindset

This repository is a modular userscript project.
Work in source files, not in generated output.
Respect the current layer boundaries:
- domain logic in domain-like modules
- runtime and DOM lifecycle in runtime-like modules
- rendering/effects in feature modules
- user-facing defaults and labels in config/module definitions

# Workflow

## 1. Locate the real change boundary

Before editing, identify:
- what the user-visible behavior should be
- which module owns that behavior
- whether the change is domain, runtime, feature-render, or config work
- what tests should prove the change

Patch the earliest correct layer, not the last visible symptom.

## 2. Keep architecture intact

Do not solve feature problems by:
- hand-editing generated output
- duplicating logic across modules
- hiding logic in CSS when semantics live in code
- introducing one-off hacks when a shared helper is the right place

## 3. Trace dependent files

When a feature changes, inspect whether these also need changes:
- config definitions or defaults
- module registry or initialization
- runtime lifecycle code
- tests
- README or user-facing labels

## 4. Prefer small, explicit changes

Keep edits narrow.
Use existing naming and patterns where possible.
Do not rewrite unrelated areas unless the current structure clearly blocks correctness.

## 5. Add or update tests

Every shipped behavior change should be protected.
Choose the closest meaningful test layer:
- domain tests for semantic rules
- runtime tests for lifecycle/mapping behavior
- harness tests for DOM-driven behavior

# Output requirements

A valid result from this skill must:
- place the change in source, not generated files
- preserve the project architecture
- include the necessary test updates
- leave the repository ready for final packaging through `$release_build` when needed

# Commit guidance

Prefer commit titles like:
- `feat(feature): add configurable board overlay behavior`
- `fix(runtime): rebind observer after mount replacement`
- `refactor(config): simplify feature defaults without behavior drift`

Avoid vague titles like:
- `update`
- `fix stuff`
- `changes`
