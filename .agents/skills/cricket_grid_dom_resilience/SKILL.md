# .agents/skills/cricket-grid-dom-resilience/SKILL.md
---
name: cricket-grid-dom-resilience
description: Use when Cricket or Tactics visuals break because the DOM changes shape, merged rows appear, player columns shift, bull rows map incorrectly, observers miss updates, or unchanged-signature rebuilds suppress rerendering. Do not use for domain-rule bugs where the semantic state itself is wrong.
---

# Goal

Make Cricket and Tactics rendering resilient to unstable DOM structure.

This repository repeatedly hit the same class of failures:
- merged rows changing label anchors
- owner-column mapping drifting
- bull row mapping breaking
- generic row heuristics failing on degraded snapshots
- observer lifecycle or rerender logic missing DOM rebuilds
- unchanged signatures preventing a necessary repaint after node replacement

This skill is for those problems.

# Core rule

Assume Autodarts DOM is unstable.

Do not hardcode fragile assumptions if the same UI can be rebuilt, merged, reordered, or partially stale between frames.

# Use this skill when

- a Cricket/Tactics bug appears only after rerenders, navigation, turn switches, or DOM rebuilds
- merged grid rows cause wrong column ownership
- the bull row behaves differently from numeric targets
- selectors still find nodes, but the wrong cells are mapped
- the effect stops working after layout churn even though the semantic state is fine
- observer timing, mutation handling, rerender triggers, or cached signatures are suspected

# Do not use this skill when

- the wrong state is being derived semantically before rendering
- the task is just color meaning or rules correctness
- the task is release/version/build only
- the task is README only

# Repository anchors

Inspect these areas first:
- `src/runtime/`
- `src/features/`
- `tests/runtime/`
- `tests/harness/`

Cross-check with:
- any grid/highlighter feature modules
- observer setup and teardown
- render caches and snapshot signatures

# Workflow

## 1. Prove semantics are already correct

Before changing DOM glue, confirm the domain state is right.
If semantic state is questionable, stop and use `$cricket-state-parity`.

## 2. Treat mapping as row-scoped, not globally assumed

For each row:
- re-identify the label anchor
- re-identify player cells
- infer ownership from the current row shape
- do not assume all rows share the same structure
- handle bull separately if its geometry or markup differs

## 3. Be robust against contaminated snapshots

Expect:
- mixed merged rows
- missing anchors
- stale child order
- partial rebuilds
- nodes that were replaced without semantic change

Prefer local recomputation over trusting old mapping caches.

## 4. Make rerender conditions lifecycle-aware

If the DOM is rebuilt but the semantic signature is unchanged:
- still rerender if node identity changed
- still rerender if observers were detached and reattached
- still rerender if the target mount surface was replaced

A “nothing changed” optimization is invalid if the DOM host changed.

## 5. Keep observers disciplined

Verify:
- attach exactly once per lifecycle
- disconnect on teardown
- rebind after mount changes
- do not create duplicate observers that double-apply effects

## 6. Add harness/runtime tests that simulate hostile DOM conditions

Prefer tests for:
- merged row shape
- missing label anchor
- bull row exceptions
- player-column reorder
- stale snapshot replacement
- DOM rebuild with unchanged semantic state
- observer detach/reattach paths

# Output requirements

A valid fix from this skill must:
- survive merged and degraded grid shapes
- survive DOM rebuilds without relying on lucky timing
- map owner and player columns per row
- rerender when the host DOM changed even if semantic data did not
- include tests that reproduce the old failure mode

# Validation checklist

Run or instruct the following:
- `npm test`
- targeted runtime/harness checks for grid and highlighter behavior
- if shipped behavior changed, later use `$userscript-release-build`

# Preferred commit style

Good examples:
- `fix(cricket-grid-fx): rerender after DOM host replacement with unchanged semantic signature`
- `fix(cricket-grid-fx): harden row-scoped owner mapping for merged rows and bull cells`
