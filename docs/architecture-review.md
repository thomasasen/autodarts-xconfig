# Architecture Review

## Scope

This review audits the current `autodarts-xconfig` implementation against the stated migration goals:

- coherent layered architecture
- low side-effect runtime behavior
- controlled listener and observer registration
- pure domain logic
- readiness for incremental migration of additional old scripts

The review focused on the current foundation, domain modules, bootstrap/runtime lifecycle, and the first migrated feature (`checkout-score-pulse`).

## Current Strengths

- The repository already has a useful separation between `core`, `domain`, `features`, `config`, `tests`, and `docs`.
- Domain modules are currently pure and do not reach into the DOM.
- Observer and listener registration are centralized in registries instead of being scattered across features.
- Runtime bootstrap is already idempotent on repeated `start()` / `stop()` calls.
- The first migrated feature consumes domain/core APIs instead of embedding checkout rules inline.

## Findings

### High: mounted features did not react to runtime config updates

`checkout-score-pulse` reads normalized config once at mount time. Before this review, `bootstrap.updateConfig()` updated the config store but did not remount mounted features, so runtime state and actual feature behavior could drift apart.

Impact:

- config changes appeared accepted in snapshots but were not applied by mounted features
- future migrated features would likely repeat the same stale-config pattern
- debugging would become misleading because reported config and active behavior diverged

Applied fix:

- `bootstrap.updateConfig()` now remounts only the affected mounted features
- this keeps churn low while restoring a reliable lifecycle contract

### Medium: the global namespace exposed mutable runtime internals

The runtime namespace exposed `context` directly on `window.__adXConfig`. That created an avoidable side-effect surface because any external code could mutate registries, config objects, or runtime services outside the intended lifecycle.

Impact:

- hidden coupling between future userscripts and internals
- higher risk of duplicate observers/listeners caused by external mutation
- weaker migration boundary between old and new scripts

Applied fix:

- the namespace now exposes the public runtime API plus `inspect()`
- mutable internals stay on the local runtime object returned by `createBootstrap()`, not on the global namespace

### Medium: the feature observer was broader than necessary

`checkout-score-pulse` observed the full document subtree with generic attribute watching. That is workable for one feature, but it is too permissive as a migration pattern.

Impact:

- more observer churn than needed
- harder attribution when future features also observe the document root

Applied fix:

- the observer now restricts attribute watching to `class` changes, which is the only attribute needed for active-player state transitions in the current feature

### Medium: websocket interception remains the single largest side-effect boundary

`game-state-store` still uses `MessageEvent.prototype.data` interception to capture websocket state, following the old repo strategy. This is acceptable as a transitional foundation because the interception is centralized and reversible, but it remains the most invasive runtime behavior in the project.

Assessment:

- acceptable for now because the patch is installed once, removed on `stop()`, and no feature duplicates it
- not something additional migrated features should replicate
- future work should keep all websocket interpretation inside `game-state-store`

Applied hardening:

- added tests for interception install/restore lifecycle
- exposed interception state in snapshots for diagnostics

### Medium: event bus lifecycle is not yet fully documented for future feature authors

The event bus is deduped per handler identity and works correctly, but there is still a contract decision to keep explicit: runtime stop currently does not clear arbitrary event bus subscribers.

Assessment:

- not a bug in the current implementation
- still a migration risk if future features subscribe to the bus and forget to unsubscribe in cleanup

Recommendation:

- treat bus subscriptions as feature-owned resources and always clean them up in feature teardown
- keep using registries for DOM listeners/observers; do not add a second feature-local registration pattern

## Domain Logic Review

The domain layer is in a good state for continued migration:

- `variant-rules.js` is pure and reusable
- `x01-rules.js` centralizes checkout/bust/suggestion parsing concerns
- `cricket-rules.js` is pure and detached from DOM parsing

This is the right direction. Additional features should continue importing rule helpers instead of embedding checkout or cricket logic in DOM scripts.

## Migration Readiness

The project is ready for further incremental migration, with two practical constraints:

1. New features should mount through `bootstrap` and use the existing registries. Do not allow old scripts to install their own unmanaged observers or websocket hooks.
2. Shared DOM selectors and page-anchor lookup patterns are still feature-local. Before migrating several more DOM-heavy scripts, add a small shared selector/anchor layer so those scripts do not duplicate fragile page knowledge.

Recommended next migrations remain:

1. Checkout Board Targets
2. TV Board Zoom
3. Style Checkout Suggestions
4. Cricket Target Highlighter
5. Cricket Grid FX

## Test Coverage Review

Coverage is now better around the highest-risk runtime paths:

- bootstrap idempotency
- feature mount/unmount cleanup
- config update remount behavior
- observer option narrowing for the migrated feature
- websocket interception install/restore lifecycle
- websocket state parsing into game state snapshots

Still missing:

- multi-feature runtime tests once a second feature is migrated
- DOM harness coverage for repeated active-player switching
- cricket-domain edge cases derived from old harness fixtures
- tests around event bus subscription cleanup once a feature starts using bus events directly

## Practical Recommendations

These are the next refactors worth doing without changing the architecture:

1. Add a small `src/shared/dom-selectors.js` or equivalent once the next DOM-heavy feature is migrated.
2. Keep websocket parsing centralized in `game-state-store`; do not let migrated features inspect raw websocket payloads.
3. Define a short feature author contract in docs:
   - mount returns cleanup
   - all subscriptions must be torn down in cleanup
   - no unmanaged globals
   - no inline dart rules
4. When the second feature is added, introduce one integration test that validates two mounted features do not duplicate root observers or styles.

## Changes Applied During Review

- fixed feature remounting on runtime config updates
- removed mutable global exposure of runtime internals
- narrowed mutation observer attribute scope for `checkout-score-pulse`
- aligned `initializeRuntime()` with the idempotent start contract when a namespace-backed runtime already exists
- added runtime tests for websocket interception lifecycle and config-update remount behavior
