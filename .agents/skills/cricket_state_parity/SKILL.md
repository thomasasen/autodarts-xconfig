# .agents/skills/cricket_state_parity/SKILL.md
---
name: cricket_state_parity
description: Use when changing or debugging Cricket or Tactics rules, target-state derivation, mark normalization, scoring-pressure states, active-player perspective, or board/grid meaning in autodarts-xconfig. Do not use for pure DOM selector breakage, observer timing issues, README-only edits, or release-only work.
---

# Goal

Keep Cricket and Tactics semantically correct before touching rendering details.

# Core rule

Treat board and grid as two views of the same derived state.

Do not fix a semantic mismatch by patching only one surface.
Do not hide a rules bug in CSS or DOM glue code.

# Use this skill when

- Cricket or Tactics logic is being added or changed
- board and grid disagree in meaning
- active-player perspective is wrong
- marks, ownership, pressure, scoring, open/closed, dead/inactive, or completion logic is inconsistent
- Cricket behavior must also support Tactics
- doubles/triples or alternate objective handling must be normalized into the state system

# Do not use this skill when

- the state is already correct and only DOM mapping is broken
- the bug is about observer lifecycle or host-node replacement
- the task is only release/build/version
- the task is only docs or wording

# Tactics rule mindset

Treat Tactics as a Cricket-related ruleset, not a cosmetic mode.

Before changing code, verify:
- which objectives exist in the selected mode
- whether doubles and triples are independent objectives
- how objective progress and scoring interact
- whether mode-specific assumptions are hardcoded as Cricket-only logic

# Workflow

## 1. Reconstruct semantic truth

Write down:
- whose perspective the board should show
- whose perspective the grid should show
- what each state/color actually means
- how open, closed, pressure, scoring, dead, inactive, and objective completion should behave

## 2. Find the earliest wrong stage

Typical path:
- raw input or snapshot
- normalization
- marks by label
- target-state derivation
- board/grid rendering

Patch the earliest wrong stage.

## 3. Keep a single semantic source

Both surfaces must consume the same derived state.
Do not maintain separate parallel meaning systems.

## 4. Protect active-player perspective

Verify current player, owner, opponent, scoring rights, and any merged or reordered state source carefully.

## 5. Add domain-first tests

At minimum, add or update tests for:
- label normalization
- target ordering
- mark clamping
- player-specific target state
- board/grid parity
- transitions between previous and current state
- Tactics-specific objective handling where applicable

# Output requirements

A valid result from this skill must:
- keep board and grid semantically aligned
- make active-player perspective explicit
- protect behavior with domain-level tests
- avoid cosmetic-only fixes for semantic bugs

# Commit guidance

Prefer commit titles like:
- `fix(cricket): unify board/grid semantics for active-player perspective`
- `feat(tactics): add target normalization for doubles and triples`
- `test(tactics): cover objective-state derivation and parity`
