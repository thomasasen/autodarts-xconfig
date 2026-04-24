---
name: feature-change
description: Implement or refactor source-layer behavior in autodarts-xconfig when no narrower domain skill fits. Use for config behavior, runtime logic, UI behavior, effects, themes, selectors, observers, mount logic, or module wiring. Do not use for docs/guidance-only, test-only, release-only, or `.oldrepo` parity work.
---

# Goal

Implement feature changes in the existing architecture without creating drift between source, config, tests, and shipped behavior.

# Guardrails

- patch the earliest correct layer
- preserve the current separation between domain logic, runtime lifecycle, feature rendering, and config definitions
- use proper German umlauts directly in user-facing wording

# Workflow

## 1. Locate the real change boundary

Before editing, identify:
- the intended user-visible behavior
- the owning module
- whether the change is domain, runtime, feature-render, or config work
- the tests that should prove it

Context budget:
- search first, then open likely owner files and nearest tests only
- avoid broad tours through `src/**`
- avoid `dist/**`
- avoid `docs/**` unless user-facing wording is in scope
- stop expanding context when the current evidence is sufficient

## 2. Keep architecture intact

Do not solve feature problems by:
- duplicating logic across modules
- hiding semantic logic in CSS
- introducing one-off hacks where a shared helper belongs

## 3. Trace dependent surfaces

Check whether the feature change also needs updates in:
- config defaults or labels
- module registry or initialization
- runtime lifecycle code
- tests
- README or other user-facing wording

## 4. Protect the behavior

- add or update the closest meaningful tests
- leave final validation selection to `$validate-repo-change`
- leave release packaging to `$package-userscript-release` when explicitly requested

# Output requirements

A valid result from this skill must:
- preserve the project architecture
- include the necessary test updates
- leave the repository ready for validation and release workflows
