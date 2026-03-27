---
name: cricket-grid-dom-resilience
description: Harden Cricket or Tactics rendering against unstable Autodarts DOM structure. Use when merged rows, shifted player columns, bull-row exceptions, stale node replacement, observer lifecycle issues, or unchanged-signature rebuilds break an otherwise correct render. Do not use when the semantic state itself is wrong; use `$cricket-state-parity` for that.
---

# Goal

Make Cricket and Tactics rendering resilient to unstable DOM structure.

# Guardrails

- assume the Autodarts DOM can be rebuilt, merged, reordered, or partially stale between frames
- treat mapping as row-scoped instead of assuming one stable global table shape
- handle bull-row geometry separately when it differs from numeric targets
- do not patch DOM glue to hide semantic bugs; switch to `$cricket-state-parity` if meaning is wrong

# Workflow

## 1. Prove semantics first

Confirm the derived game state is already correct before changing selectors, mapping, observers, or rerender logic.

## 2. Recompute from the current row shape

For each row:
- identify the label anchor again
- identify the current player cells again
- infer ownership from the row that exists now
- avoid trusting stale caches after node replacement

## 3. Make rerender rules lifecycle-aware

Still rerender when:
- host nodes were replaced
- observers detached and reattached
- the semantic signature is unchanged but the mount surface changed

## 4. Add hostile-DOM regression coverage

Prefer tests for:
- merged row shape
- missing label anchor
- bull-row exceptions
- player-column reorder
- host replacement with unchanged semantic data
- observer detach and reattach

# Output requirements

A valid result from this skill must:
- survive merged and degraded grid shapes
- rerender when the host DOM changed even if semantic data did not
- map owner and player columns per row
- include tests that reproduce the old failure mode
