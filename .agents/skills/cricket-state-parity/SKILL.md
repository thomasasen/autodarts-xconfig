---
name: cricket-state-parity
description: Keep Cricket or Tactics semantics correct across board and grid. Use when rules, target-state derivation, mark normalization, scoring pressure, active-player perspective, or board/grid meaning may be wrong. Do not use for pure DOM selector breakage, observer timing issues, or release-only work.
---

# Goal

Keep Cricket and Tactics semantically correct before touching rendering details.

# Guardrails

- treat board and grid as two views of the same derived state
- patch the earliest wrong stage instead of masking a semantic mismatch in DOM glue or CSS
- treat Tactics as a Cricket-related ruleset, not a cosmetic mode

# Workflow

## 1. Reconstruct semantic truth

Write down:
- whose perspective the board should show
- whose perspective the grid should show
- what each state and color means
- how open, closed, pressure, scoring, dead, inactive, and objective completion should behave

## 2. Find the earliest wrong stage

Walk the path:
- raw input or snapshot
- normalization
- marks by label
- target-state derivation
- board or grid rendering

## 3. Keep one semantic source

- both surfaces must consume the same derived state
- active-player perspective must stay explicit
- Tactics-specific objectives must be normalized into the same state model

## 4. Add domain-first regression coverage

At minimum, cover:
- label normalization
- target ordering
- mark clamping
- player-specific target state
- board/grid parity
- Tactics-specific objective handling where applicable

# Output requirements

A valid result from this skill must:
- keep board and grid semantically aligned
- make active-player perspective explicit
- protect behavior with domain-level tests
- avoid cosmetic-only fixes for semantic bugs
