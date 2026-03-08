# Performance Audit

## Scope

Post-release runtime audit for the userscript with a behavior-parity constraint:

- no architecture redesign
- no public API or config-schema changes
- focus on long-session stability, observer/listener hygiene, DOM churn, and async cleanup

## Findings

1. Several features were waking twice for the same state change.
   Direct `gameState.subscribe()` callbacks and `eventBus.on("game-state:updated")` subscriptions were both scheduling the same feature work.

2. Multiple features were observing DOM subtrees they also mutated.
   Overlay insertion, transient FX nodes, animated text updates, and shell-managed DOM changes could reschedule their own features even when nothing external changed.

3. Some high-cost DOM discovery was repeated on unchanged DOM.
   Board and cricket-grid discovery scanned the full document on every scheduled update, even when only game state changed.

4. A small set of async paths could outlive feature teardown.
   Lazy vendor loading for `winner-fireworks` and `turn-points-count` could schedule late work after cleanup if not explicitly guarded.

5. Optional polling paths could still wake hidden tabs.
   This was low-frequency, but it was still unnecessary long-session work.

## Changes Applied

### Runtime and State Flow

- Removed redundant feature-side `eventBus.on("game-state:updated")` subscriptions.
- Standardized feature updates on direct `gameState.subscribe()` only.
- Added lightweight duplicate websocket-state suppression in `src/core/game-state-store.js` for identical consecutive payloads.

### Mutation Observers

- Added `src/core/dom-mutation-filter.js` as the shared helper for managed-node mutation filtering.
- Reused that helper in shell and feature observers where the feature owns inserted overlays or transient nodes.
- Tightened observer scopes so text-only decorators no longer watch unrelated attribute churn.
- Preserved attribute observation only where layout or winner/zoom state actually depends on class/style or geometry changes.

### DOM Work and Caching

- Added board/grid cache invalidation paths for:
  - `tv-board-zoom`
  - `checkout-board-targets`
  - `cricket-highlighter`
  - `cricket-grid-fx`
- Limited cache resets to external DOM mutations, resize/orientation, visibility transitions, or node disconnection.
- Removed an unnecessary overlay creation on the inactive clear path in `checkout-board-targets`.

### Timers and Async Cleanup

- Guarded late lazy-loader callbacks after cleanup in:
  - `winner-fireworks`
  - `turn-points-count`
- Kept timeout, interval, and RAF cleanup explicit in feature teardown.
- Gated optional polling work for hidden documents in:
  - `single-bull-sound`
  - `triple-double-bull-hits`

## Notable Behavior Preserved

- Feature config defaults are unchanged.
- The checked-in `dist/autodarts-xconfig.user.js` bundle remains the canonical userscript artifact.
- Runtime public API remains unchanged: `window.__adXConfig` surface and feature config keys are stable.

## Residual Accepted Risks

- The runtime still uses one observer per feature by design. This audit reduced unnecessary observer wakeups without introducing a shared observer multiplexer.
- Some decorative features still observe broad DOM regions because Autodarts markup is not stable enough to pin them to a narrow host selector safely.
- `checkout-score-pulse` keeps class-based observation because score focus can move through DOM class changes; it was left behavior-stable rather than aggressively coalesced.

## Tests Added

- duplicate websocket payload suppression
- representative managed-mutation ignore path for `checkout-board-targets`
- direct game-state-only scheduling path for `remove-darts-notification`
- late async cleanup guard for `turn-points-count`
- documentation coverage for the new runtime audit docs

## Verification

Run after the code changes:

```bash
npm install
npm run build
npm test
```

Expected commit message:

```text
perf(runtime): harden observers, listeners, and long-session stability

- document runtime entry points and audit findings
- remove duplicate game-state wakeups
- filter self-managed mutations and tighten observer scopes
- guard timers and async cleanup for long sessions
- add runtime stability regression tests
```
