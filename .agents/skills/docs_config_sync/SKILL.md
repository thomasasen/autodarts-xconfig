# .agents/skills/docs-config-sync/SKILL.md
---
name: docs-config-sync
description: Use when changing feature names, module descriptions, config labels, README anchors, or user-facing explanations in autodarts-xconfig so UI wording, README wording, and shipped behavior stay aligned. Do not use for pure internal refactors with no user-facing text impact.
---

# Goal

Keep feature behavior and user-facing wording aligned.

This repository exposes features directly to users through the in-game AD xConfig UI and README navigation. When feature names, settings, or behavior drift, the repo becomes harder to use even if the code technically works.

# Use this skill when

- a feature or module name changes
- a setting label or option meaning changes
- a README section for a module becomes outdated
- new user-facing behavior needs short, accurate explanation
- install notes, module descriptions, or anchors need updating

# Do not use this skill when

- the task is a purely internal refactor with no user-visible wording impact
- the task is only release/build/version
- the task is only deep Cricket/Tactics semantics with no user-facing text change

# Repository anchors

Inspect:
- `README.md`
- config definitions and defaults
- feature registry and user-facing labels
- any help text surfaced through the menu

The README already acts as a user manual for modules and settings, including themes, effects, in-game configuration, persistent settings, and README-linked module explanations. :contentReference[oaicite:2]{index=2}

# Workflow

## 1. Trace the user-facing name

For any changed feature, identify:
- internal module key
- visible feature name
- visible setting labels
- README section title
- any screenshots or anchors that rely on the old name

## 2. Keep terminology exact

Use one term consistently across:
- code-adjacent labels
- config text
- README headings
- changelog or release notes if present

Do not create near-duplicates for the same feature.

## 3. Document what the user can actually observe

Describe:
- what changes on screen
- when it is useful
- any major setting choices
- any caveat that changes gameplay interpretation

Do not document internals unless they matter to the user.

## 4. Update only what changed

Avoid broad README rewrites for small code changes.
Touch the smallest set of sections needed to keep docs honest.

# Output requirements

A valid result from this skill must:
- keep UI text and README text aligned
- avoid stale feature names
- explain only real shipped behavior
- leave navigation and headings coherent

# Preferred commit style

Good examples:
- `docs(readme): align cricket-grid-fx wording with active-player board behavior`
- `docs(config): rename module labels to match shipped feature names`
