---
name: overlay-animation-debugging
description: Diagnose Autodarts overlay, board, and animation bugs that may stem from DOM churn, node replacement, observer rerenders, or weak CSS motion. Use when a blink, pulse, glow, or board overlay looks stuck, barely visible, twitchy, or inconsistent between targets, themes, or cards, especially when MCP browser evidence is needed.
---

# Goal

Find whether the real fault is:
- semantic target logic
- render lifecycle or observer churn
- node identity loss
- animation design that is technically running but visually too weak

# Workflow

## 1. Freeze the repro first

- Record the exact theme, route, target, and visible symptom.
- Find one good reference effect and one failing effect on the same page if possible.
- Prefer concrete comparisons such as `S19 blinks cleanly, T20 only twitches`.

## 2. Separate logic from rendering

- Confirm the intended target or state is actually selected in source and in the live DOM.
- If the wrong target is chosen, fix logic first.
- If the right target is chosen but the effect looks wrong, inspect rendering and animation next.

## 3. Measure node stability in MCP

- Check whether the same DOM or SVG node survives across passive rerenders.
- Sample the target node over multiple frames and record:
  - node identity
  - opacity
  - transform
  - filter
  - class list
- Add a mutation observer on the overlay host when churn is suspected.

Strong reset signal:
- unchanged semantic state
- repeated add/remove activity
- sampled node identity changes
- sampled styles stay near the animation start state

## 4. Compare against the reference path

- Inspect the stable reference effect with the same measurements.
- Note whether the difference is:
  - different renderer path
  - different class or keyframes
  - stable node versus recreated node
  - stronger motion values versus barely visible values

## 5. Fix the earliest correct layer

- Fix semantic route or state derivation if the wrong target is chosen.
- Fix render reconciliation if identical nodes are recreated.
- Fix keyframes only after confirming node stability.
- Do not switch animation libraries just because CSS looks suspect; recreated nodes will also restart JS-driven animations.

# Regression guidance

Prefer narrow runtime tests that lock in the behavior contract:
- unchanged semantic state keeps the same overlay or host children
- structural self-heal rebuilds only when the subtree is actually damaged
- passive resync does not restart a running effect
- route fallback keeps a visible target when no finish remains

# Output requirements

A valid result from this skill must:
- name the real failing layer
- include MCP evidence, not only source guesses
- distinguish stable reference behavior from failing behavior
- add or update at least one regression test when code changes follow
