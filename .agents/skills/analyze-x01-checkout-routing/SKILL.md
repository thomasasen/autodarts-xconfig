---
name: analyze-x01-checkout-routing
description: Use for X01 checkout route logic, finish suggestions, checkout targets, score pulse, TV Board Zoom checkout interactions, bull semantics, and route/target regression analysis.
---

# Goal

Keep X01 checkout routing, finish visibility, and target semantics correct without mixing route rules with rendering concerns.

# Core rules

- preserve X01 base scores 121 and 170 as valid
- preserve Bull semantics
- treat route visibility and board zoom as separate concerns unless the task explicitly combines them
- avoid changing checkout rules without tests
- prefer shared helpers for route and surface semantics instead of duplicated feature-local parsing
- do not hand-edit `dist/**`

# Context budget

- search first, then open likely route, target, board-zoom, and nearest test files
- avoid broad tours through `src/**`
- avoid `docs/**` unless wording is in scope
- stop expanding context when route and target ownership is clear

# Regression Cases

Consult `references/checkout-regression-cases.md` before changing checkout rules or target selection.

Require focused regression coverage for cases such as:
- `10 -> D5`
- `22 -> D11`
- `50` where route `S10 -> D20` is visible and finish-only zoom must not incorrectly prefer BULL

# Output requirements

A valid result must state whether route rules, target selection, board zoom, or score pulse behavior changed, and which focused regression cases cover it.
