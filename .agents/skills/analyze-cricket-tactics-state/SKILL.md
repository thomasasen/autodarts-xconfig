---
name: analyze-cricket-tactics-state
description: Use for Cricket/Tactics target state, grid coloring, board coloring, active-player perspective, DOM parsing, and target-set rules.
---

# Goal

Keep Cricket and Tactics state derivation consistent between domain rules, grid coloring, board coloring, and host DOM parsing.

# Core rules

- for Tactics, DOUBLE and TRIPLE are not part of the official domain target set
- DOUBLE and TRIPLE may appear in DOM or host compatibility handling, but must not become domain targets unless explicitly required for compatibility
- keep grid coloring as domain state
- keep board coloring as active-player perspective
- avoid duplicated or drifting DOM parsing between feature modules
- prefer a shared source of truth when touching parsing or state derivation
- require behavior-level tests for rule changes
- do not hand-edit `dist/**`

# Context budget

- search first, then open likely state, parsing, coloring, and nearest test files
- avoid broad tours through `src/**`
- avoid `docs/**` unless wording is in scope
- stop expanding context when target-state ownership is clear

# Target Rules

Consult `references/target-state-rules.md` before changing Tactics target sets, Cricket marks, or active-player board coloring.

# Output requirements

A valid result must state whether domain state, DOM compatibility, grid coloring, or active-player board perspective changed.
