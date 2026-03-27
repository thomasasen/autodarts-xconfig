---
name: test-regression-design
description: Design or update regression coverage for autodarts-xconfig. Use when a bug fix, feature change, or refactor needs tests at the domain, runtime, config, or DOM harness layer. Do not use for release-only work or README-only edits.
---

# Goal

Design tests that lock in intended behavior and prevent repeated regressions.

# Guardrails

- tests should describe behavior, not implementation trivia
- choose the narrowest effective layer that proves the contract
- include at least one test that reproduces the old bug or a close equivalent

# Workflow

## 1. Identify the regression class

Classify the failure as:
- semantic or domain error
- runtime mapping or lifecycle error
- DOM shape or observer error
- config or defaults drift
- integration mismatch between modules

## 2. Pick the narrowest effective test layer

Prefer:
- domain tests for rules, normalization, ordering, ownership, perspective, and scoring
- runtime tests for snapshot mapping, lifecycle, rerender rules, and observer behavior
- harness tests for DOM shape, merged rows, node replacement, and mount churn

## 3. Capture the failure mode and edge conditions

Where useful, cover:
- noisy or partial input
- repeated rerenders
- swapped ownership or order
- unchanged semantic state with replaced DOM nodes
- alternate mode variants
- fallback behavior

# Output requirements

A valid result from this skill must:
- add or update tests near the correct layer
- protect the changed behavior from regression
- use names that explain the behavioral contract
- avoid shallow tests that only restate the code
