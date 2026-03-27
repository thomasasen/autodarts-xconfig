---
name: oldrepo-parity-recovery
description: Recover known-good behavior from `.oldrepo` without reintroducing the old structure. Use when the current modular implementation diverges from proven legacy behavior and the task is to recover that behavior in the right modern layer. Do not use for greenfield features with no legacy predecessor.
---

# Goal

Recover proven legacy behavior from `.oldrepo` while preserving the modular architecture.

# Guardrails

- migrate behavior, not mess
- extract the invariant, heuristic, trigger, or fallback that made the old code correct
- avoid large copy-paste imports from `.oldrepo`

# Workflow

## 1. Define the parity target precisely

State:
- what the old implementation did
- under which conditions it did it
- what the new code does instead
- why the legacy behavior is still desired

## 2. Extract the minimum transferable idea

Look for:
- state interpretation rules
- mapping heuristics
- trigger timing
- lifecycle fallbacks
- degraded-input handling

## 3. Reapply it in the right layer

- semantics belong in domain-like modules
- lifecycle and mapping belong in runtime-like modules
- visuals belong in feature or render code

## 4. Lock it with a regression test

The test should describe the preserved behavior, not the old code shape.

# Output requirements

A valid result from this skill must:
- restore the intended legacy behavior
- preserve the modular architecture
- add regression coverage
- avoid large-scale copy-paste from `.oldrepo`
