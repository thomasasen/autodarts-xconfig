# .agents/skills/docs_config_sync/SKILL.md
---
name: docs_config_sync
description: Use when feature names, config labels, defaults, README sections, user-facing descriptions, or module wording in autodarts-xconfig must stay aligned with shipped behavior. Do not use for pure internal refactors with no user-facing text impact.
---

# Goal

Keep user-facing wording, config naming, and documentation aligned with actual shipped behavior.

# Use this skill when

- a feature name changes
- a module label changes
- a setting label or option meaning changes
- a default value changes in a user-visible way
- README text becomes outdated after a feature change
- menu wording and documentation drift apart

# Do not use this skill when

- the task is a pure internal refactor with no user-facing text impact
- the task is only release/build/version
- the task is only deep debugging without any text or naming changes

# Core rule

Use one term for one thing.

Do not let code-adjacent labels, menu text, README headings, and feature descriptions use near-duplicate names for the same behavior.

For xConfig settings specifically:
- verify the actual behavior in code before writing or changing explanatory text
- keep the same core statement in xConfig and docs
- keep the xConfig wording shorter than the docs wording
- describe visual effects in concrete text form when the user needs to imagine what changes on screen

# Workflow

## 1. Trace the user-facing name

For each changed feature, identify:
- internal key
- visible label
- visible option names
- README section title
- any short description or module explanation
- every setting-level explanation shown in xConfig
- the matching setting-level explanation in docs

## 2. Document observable behavior only

Explain what the user can actually notice:
- what changes on screen
- when it appears
- what the setting controls
- any relevant caveat

Do not document internal implementation unless the user needs it.

At setting level, prefer this shape:
- xConfig: one short honest sentence
- docs: same claim, but expanded with context and visual effect

## 3. Update the smallest honest surface

Do not rewrite large parts of the README for small changes.
Update only the affected sections, but make them fully accurate.

## 4. Keep labels and defaults consistent

When defaults change, confirm:
- config text still matches reality
- README examples still match reality
- feature/module naming is still coherent

# Output requirements

A valid result from this skill must:
- keep UI wording and README wording aligned
- avoid stale names or misleading option descriptions
- describe real shipped behavior, not planned behavior

# Commit guidance

Prefer commit titles like:
- `docs(readme): align tactics wording with shipped behavior`
- `docs(config): rename labels to match module behavior`
- `docs(feature): update option descriptions after default change`
