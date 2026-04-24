---
name: clean-sonar-findings
description: Use for explicit SonarQube issue cleanup, Sonar code smells, low-risk static-analysis fixes, and touched-scope Sonar remediation. Do not use for normal validation unless cleanup is explicitly requested.
---

# Goal

Resolve low-risk SonarQube findings without mixing static-analysis cleanup with behavior changes.

# Good candidates

- unused imports
- clearly dead commented-out code
- safe `String.raw` replacements for regex or path backslash readability
- small mechanical boolean or operator simplifications when behavior is obvious

# Avoid

- broad style rewrites
- condition inversion churn without a real readability win
- mixed behavior and Sonar cleanup in one patch unless explicitly requested
- claiming Sonar server results unless actually verified
- hand-editing `dist/**`

# Context budget

- start from the explicit Sonar finding or touched scope
- search first, then open only the finding location and nearest tests
- avoid broad tours through `src/**`
- avoid `docs/**` unless task-relevant
- stop expanding context when the mechanical fix is clear

# Validation

- validate with `npm run lint` and relevant tests
- use `$validate-repo-change` for final validation reporting
- if SonarQube is unavailable, report the concrete blocker instead of implying cleanup was server-verified
