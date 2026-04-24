---
name: analyze-board-svg-surface
description: Use for dartboard SVG selection, surface snapshots, overlay root detection, board group heuristics, radius/group semantics, and shared board truth.
---

# Goal

Keep board SVG detection and overlay surface truth stable across host DOM churn, reloads, and feature overlays.

# Core rules

- preserve existing group and radius semantics unless the task explicitly asks to change them
- prefer central helpers such as `findBoardSvgRoot(documentRef)` or equivalent existing shared helpers
- avoid duplicated overlay or board root detection
- keep overlay hydration and board selection concerns separate unless the task explicitly combines them
- treat reload/F5 overlay mismatch as regression-sensitive
- require targeted tests or explicit manual/browser verification for DOM-sensitive changes
- do not hand-edit `dist/**`

# Context budget

- search first, then open likely board-surface helpers, overlay mounting code, and nearest tests
- avoid broad tours through `src/**`
- avoid `docs/**` unless wording is in scope
- stop expanding context when board-root ownership is clear

# Invariants

Consult `references/board-selection-invariants.md` before changing board root detection, surface snapshots, or overlay root heuristics.

# Output requirements

A valid result must state whether board selection, overlay hydration, or surface snapshot semantics changed and how reload/F5 risk was checked.
