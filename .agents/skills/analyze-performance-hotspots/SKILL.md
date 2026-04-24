---
name: analyze-performance-hotspots
description: Use for CPU/GPU efficiency, observers, render loops, scheduled rendering, DOM query reduction, cache behavior, and performance-oriented refactors.
---

# Goal

Improve performance only where evidence points to a real hotspot, without changing behavior by accident.

# Core rules

- prefer measurement and a narrow hypothesis over broad rewrites
- identify hot paths before changing code
- avoid semantic changes during performance cleanup unless explicitly requested
- be careful with observers, polling, animation frames, timers, and render scheduling
- keep visual behavior unchanged unless the task explicitly requests a behavior change
- require before/after reasoning and validation appropriate to the touched scope
- do not hand-edit `dist/**`

# Context budget

- search first, then open likely hot-path files and nearest tests
- avoid broad tours through `src/**`
- avoid `docs/**` unless task-relevant
- stop expanding context when the performance hypothesis is sufficiently grounded

# Output requirements

A valid result must state the suspected hotspot, the behavior-preservation strategy, and the validation used to compare before and after.
