# .agents/skills/oldrepo_parity_recovery/SKILL.md
---
name: oldrepo_parity_recovery
description: Use when the current modular implementation in autodarts-xconfig diverges from known-good behavior in .oldrepo and the task is to recover that behavior without reintroducing monolithic structure. Do not use for greenfield features with no legacy predecessor.
---

# Goal

Recover proven legacy behavior from `.oldrepo` while preserving the current modular architecture.

# Core rule

Migrate behavior, not mess.

Do not copy large legacy blocks blindly.
Extract the invariant, heuristic, trigger, or fallback that made the old behavior correct, then re-express it in the current structure.

# Use this skill when

- the current implementation regressed from `.oldrepo`
- the prompt explicitly mentions `.oldrepo`
- a legacy heuristic explains a repeated regression
- the desired behavior is known from the old implementation
- a migration gap exists between old and new architecture

# Do not use this skill when

- the feature is genuinely new
- there is no useful legacy precedent
- the task is only release/build/version
- the task is only docs or naming

# Workflow

## 1. Define the parity target precisely

Before editing, state:
- what the old implementation did
- under which conditions it did it
- what the new code does instead
- whether the legacy behavior is actually desired

## 2. Extract the minimum transferable behavior

Look for:
- state interpretation rules
- mapping heuristics
- trigger timing
- lifecycle or fallback behavior
- degraded-input handling

Extract the smallest correct idea, not the whole old design.

## 3. Reapply it in the right layer

Keep layer boundaries intact:
- semantics in domain-like modules
- lifecycle and mapping in runtime-like modules
- visuals in feature/render code

## 4. Add a regression test for the recovered contract

The test should describe the preserved behavior, not the old code shape.

## 5. Comment only when the heuristic is non-obvious

If needed, add a short comment explaining:
- what legacy behavior is preserved
- why this heuristic exists
- what regression it prevents

# Output requirements

A valid result from this skill must:
- restore the intended legacy behavior
- preserve the modular architecture
- add regression coverage
- avoid large-scale copy-paste from `.oldrepo`

# Commit guidance

Prefer commit titles like:
- `fix(runtime): restore oldrepo parity for rebuilt grid mapping`
- `fix(cricket): recover legacy target-state behavior in modular pipeline`
- `test(parity): lock oldrepo-equivalent behavior for owner mapping`
