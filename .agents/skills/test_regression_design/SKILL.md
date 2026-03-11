# .agents/skills/test_regression_design/SKILL.md
---
name: test_regression_design
description: Use when a bug fix, feature change, or refactor in autodarts-xconfig needs tests, regression coverage, or better validation at the domain, runtime, or DOM harness level. Do not use for release-only work or README-only edits.
---

# Goal

Design tests that lock in intended behavior and prevent repeated regressions.

# Use this skill when

- a bug was fixed and should not come back
- a feature change needs new test coverage
- existing tests no longer match intended behavior
- a refactor risks breaking known behavior
- a change touches brittle areas like Cricket, runtime mapping, DOM rebuilds, or observer lifecycle

# Do not use this skill when

- the task is only to rebuild or bump the version
- the task is only documentation wording
- no behavior changed and no regression risk exists

# Core rule

Tests should describe behavior, not implementation trivia.

Good tests explain:
- what input or state exists
- what behavior should happen
- what regression is prevented

Bad tests merely mirror current code structure without protecting meaning.

# Workflow

## 1. Identify the regression class

Before writing tests, state what kind of failure this is:
- semantic/domain error
- runtime mapping or lifecycle error
- DOM shape or observer error
- config/defaults drift
- integration mismatch between modules

## 2. Pick the narrowest effective test layer

Prefer:
- domain tests for rules, normalization, ordering, ownership, perspective, scoring
- runtime tests for snapshot mapping, lifecycle, rerender rules, observer behavior
- harness tests for DOM shape, merged rows, node replacement, and mount churn

Do not push everything into the highest-level tests if a smaller layer can prove it better.

## 3. Capture the failure mode

Design at least one test that reproduces the old bug or a close equivalent.
Name the test after the contract, not the patch.

## 4. Cover edge conditions

Where useful, include:
- noisy or partial input
- repeated rerenders
- swapped ownership/order
- unchanged semantic state with replaced DOM nodes
- alternate mode variants
- fallback behavior

## 5. Keep assertions meaningful

Assert the observable contract:
- normalized labels
- correct target ordering
- consistent board/grid state
- correct owner mapping
- rerender when mount changed
- defaults reflected correctly

# Output requirements

A valid result from this skill must:
- add or update tests near the correct layer
- protect the changed behavior from regression
- use names that explain the behavioral contract
- avoid shallow tests that only restate the code

# Commit guidance

Prefer commit titles like:
- `test(cricket): add regression coverage for active-player board/grid parity`
- `test(runtime): cover rerender after DOM host replacement`
- `test(config): lock defaults for feature toggle behavior`
