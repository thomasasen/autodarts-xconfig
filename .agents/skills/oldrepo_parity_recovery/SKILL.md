# .agents/skills/oldrepo-parity-recovery/SKILL.md
---
name: oldrepo-parity-recovery
description: Use when the new architecture in autodarts-xconfig diverges from known-good behavior in `.oldrepo`, especially for Cricket/Tactics, board overlays, grid FX, trigger timing, or tactical hierarchy. Do not use for greenfield features that have no oldrepo predecessor.
---

# Goal

Recover proven behavior from `.oldrepo` without blindly copying legacy structure.

This repository contains `.oldrepo` and commit history shows repeated parity work against legacy Cricket/Tactics behavior. Use this skill when the new modular architecture behaves differently from the old implementation and the old behavior is believed to be correct.

# Core rule

Migrate behavior, not mess.

Do not port legacy code wholesale.
Extract:
- the invariant
- the heuristic
- the trigger condition
- the rendering decision
Then re-express that behavior inside the current architecture.

# Use this skill when

- a feature used to work in `.oldrepo` but is wrong in the current modular code
- a regression mentions “restore oldrepo parity”
- the board/grid/highlighter/overlay behavior was previously correct in legacy code
- a heuristic in old code explains a repeated modern regression
- the problem is a migration gap, not a brand-new feature request

# Do not use this skill when

- there is no meaningful oldrepo precedent
- the requested behavior is intentionally new
- the issue is just build/version/release
- the issue is only documentation wording

# Repository anchors

Inspect:
- `.oldrepo/`
- current modules under `src/`
- related tests under `tests/`

# Workflow

## 1. Define the parity target precisely

Before editing anything, answer:
- what exact user-visible behavior existed in `.oldrepo`
- under what conditions it triggered
- what the modern code currently does instead
- whether the legacy behavior is truly desired or only accidentally tolerated

## 2. Locate the minimal transferable heuristic

Do not copy large blocks from `.oldrepo`.
Extract only the minimal useful parts:
- state interpretation rules
- owner/row heuristics
- trigger timing
- observer lifecycle assumptions
- fallback behavior for noisy snapshots

## 3. Map legacy behavior onto current architecture

Place the recovered behavior in the correct modern layer:
- domain logic stays in domain
- runtime/mount/observer logic stays in runtime
- UI rendering stays in feature/render code

Do not collapse layers just because legacy code was monolithic.

## 4. Add a parity note in code comments when needed

If the fix depends on a non-obvious legacy heuristic, add a short comment that explains:
- what legacy behavior is preserved
- why the heuristic exists
- what regression it prevents

Keep comments technical and brief.

## 5. Add regression tests that describe the legacy contract

Tests should encode the behavior, not the old implementation shape.

Good examples:
- “restores oldrepo-style tactical hierarchy”
- “preserves legacy trigger timing under rebuilt grid”
- “matches known-good owner mapping for merged rows”

# Output requirements

A valid result from this skill must:
- preserve the desired old behavior
- keep the current modular architecture intact
- add tests that lock the recovered behavior
- avoid large-scale copy-paste from `.oldrepo`

# Validation checklist

Run or instruct the following:
- `npm test`
- compare old vs new behavior in the narrow scenario being recovered
- if source changed in a shipped path, later use `$userscript-release-build`

# Preferred commit style

Good examples:
- `fix(cricket-stack): restore oldrepo tactical hierarchy in modular state pipeline`
- `fix(cricket-grid-fx): recover legacy row-anchor heuristic without reintroducing monolithic runtime`
