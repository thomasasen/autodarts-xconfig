---
name: xconfig-effect-preview-contract
description: Use when adding, fixing, or reviewing xConfig administration previews for feature effects, especially hover/focus previews that must reflect the real runtime effect without leaking timers, classes, DOM state, or fake CSS-only behavior.
---

# Goal

Keep xConfig administration previews faithful to shipped runtime effects while isolating preview lifecycle from the settings UI.

# Workflow

## 1. Freeze the visible symptom

- Inspect the active xConfig tab when browser access is available.
- Record idle state, hover/focus state, cleanup state, and whether the active badge order is correct.
- Separate observed browser facts from source-code inference.

## 2. Keep the shell generic

- The shell may discover `data-preview-effect`, route events, and stop the active preview.
- The shell must not contain feature-specific animation logic.
- Map preview effect prefixes to feature-specific adapters.
- A preview run must be single-active, cancellable, and resettable.

## 3. Use real feature effects

- Do not implement fake CSS-only approximations for runtime effects.
- Reuse feature animation logic, selectors, and style contracts where practical.
- Vendor-backed effects must wait for their real loader. Do not fall back to a different effect if the requested vendor is still loading.

## 4. Protect DOM state

- Start from an explicit idle DOM state.
- Replace or fully reset nodes that vendor renderers mutate, such as Odometer.
- Stop timers, RAFs, CountUp/Odometer instances, and flash classes on pointer/focus exit, modal close, rerender, tab switch, and teardown.
- Keep flash visible only for preview fields whose purpose is flash behavior.

# Regression guidance

- Add behavior tests for single-active lifecycle, cleanup/reset, async loader cancellation, and adapter option mapping.
- Add shell structure tests only for layout and attributes; do not treat CSS selectors as proof of a real effect.
- After a build, verify a live DOM matrix: idle, hover, cleanup, async-loader-cancel, active badge order.
