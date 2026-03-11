# .agents/skills/cricket-state-parity/SKILL.md
---
name: cricket-state-parity
description: Use when changing or debugging Cricket or Tactics rules, target-state derivation, mark normalization, scoring-pressure states, active-player perspective, or board/grid color parity in autodarts-xconfig. Do not use for pure DOM selector breakage, observer timing issues, README-only edits, or release-only work.
---

# Goal

Make Cricket and Tactics behavior correct at the domain/state level before touching UI cosmetics.

This repository repeatedly regressed in the same places:
- board and grid showing different meanings
- active-player perspective being wrong
- offense, pressure, dead, inactive, and scoring states drifting apart
- merged-row snapshots causing wrong owner/scoring interpretation
- fixes landing in rendering code while the real bug lived in state derivation

When this skill is used, solve the semantic problem first and only then adjust rendering.

# Required mindset

Treat the board and the grid as two views of the same domain state.

Never invent state in CSS or DOM glue code.
Never “fix” a parity bug by patching one surface only.
If board and grid disagree, assume the domain mapping is wrong until proven otherwise.

# Use this skill when

- the issue mentions Cricket or Tactics rules
- grid colors are wrong but the underlying semantic state is suspicious
- the board does not reflect the active player's view
- owner, opponent, scoring, pressure, or dead/inactive labels are inconsistent
- tests around target state, mark parsing, target order, transition derivation, or board perspective need to be added or repaired

# Do not use this skill when

- the problem is only that DOM nodes are recreated and effects do not reattach
- the bug is purely selector or observer lifecycle related
- the task is only to rebuild `dist/` or bump the version
- the task is only README wording or screenshots

# Repository anchors

Inspect these areas first:
- `src/domain/`
- `tests/domain/`
- `tests/runtime/` when parity leaks into rendering
- `src/runtime/` only after the domain state is proven correct

Pay special attention to exports around:
- dart rules
- cricket/tactics normalization
- target states
- board perspective
- transition derivation

# Workflow

## 1. Reconstruct the domain truth

Before editing code, write down:
- whose perspective the board should show
- whose perspective the grid should show
- what each color/state means
- how “open”, “closed”, “pressure”, “scoring”, “dead”, and “inactive” should behave

If the task involves Tactics, verify that label aliases and tactic objectives normalize into the same state system used by Cricket.

## 2. Find the state boundary

Locate the exact point where raw runtime input becomes semantic state.

Typical sequence:
- raw DOM / snapshot / throw data
- normalization
- marks by label
- target state derivation
- board/grid rendering

Patch the earliest wrong stage, not the latest visible symptom.

## 3. Preserve single-source semantics

Both surfaces must be driven from the same derived state.

Bad:
- board decides colors from one heuristic
- grid decides colors from another

Good:
- one semantic derivation
- two renderers consuming the same result

## 4. Protect active-player perspective

Always verify:
- current player vs opponent
- owner vs viewer
- scoring rights vs pressure state
- merged-row cases where visible order differs from semantic owner

If the board is supposed to mirror the active player, enforce that consistently even when snapshots are noisy.

## 5. Add or repair tests first-class

At minimum, cover the changed behavior with domain-level tests.

Prefer tests like:
- label normalization
- target ordering
- mark clamping
- player-specific target state
- board-perspective derivation
- transitions between prior and current states
- merged-row owner mapping semantics

Runtime tests are supplementary. Domain tests are mandatory for semantic fixes.

# Output requirements

When you finish, ensure all of the following are true:
- board and grid mean the same thing
- active-player perspective is explicit and tested
- no color/state meaning exists only in CSS
- the change is covered by tests close to the domain
- comments and naming use the same vocabulary everywhere

# Validation checklist

Run or instruct the following:
- `npm test`
- targeted inspection of Cricket and Tactics state-related tests
- if source changed in a shipped feature path, later use `$userscript-release-build`

# Preferred commit style

Use a commit title that says exactly what semantic class was fixed.

Good examples:
- `fix(cricket): unify board/grid target-state semantics for active-player perspective`
- `fix(tactics): correct owner scoring-pressure derivation in merged rows`

Bad examples:
- `fix`
- `UI cleanup`
- `adjust colors`
