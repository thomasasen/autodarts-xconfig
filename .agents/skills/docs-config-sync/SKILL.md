---
name: docs-config-sync
description: Keep user-facing wording aligned with shipped behavior in autodarts-xconfig. Use when feature names, config labels, defaults, README sections, menu descriptions, or module wording need to stay in sync. Do not use for pure internal refactors with no user-facing text impact.
---

# Goal

Keep user-facing wording, config naming, and documentation aligned with actual shipped behavior.

# Guardrails

- use one term for one thing
- verify real behavior in code before changing explanatory text
- keep xConfig wording shorter than the matching docs wording
- use proper German umlauts directly in user-facing text

# Workflow

## 1. Trace every visible name

For each changed feature, identify:
- internal key
- visible label
- option names
- README section title
- in-app explanation
- docs explanation

## 2. Document observable behavior only

Describe:
- what changes on screen
- when it appears
- what the setting controls
- any caveat the user can actually notice

## 3. Update the smallest honest surface

- change only the affected sections
- keep labels, defaults, examples, and docs aligned
- do not describe planned behavior as shipped behavior

# Output requirements

A valid result from this skill must:
- keep UI wording and README wording aligned
- avoid stale names or misleading option descriptions
- describe real shipped behavior, not implementation plans
