# Architecture

## Layers
- `src/core`: runtime lifecycle, event bus, observer/listener registries, DOM safety guards, websocket game-state store.
- `src/domain`: pure deterministic dart logic (`variant`, `x01`, `cricket/tactics`).
- `src/features`: UI behaviors that consume `core` + `domain` APIs.
- `src/config`: default and normalized runtime config access.
- `src/shared`: cross-cutting utilities with no domain knowledge.

## Runtime Ownership
- Single global namespace: `window.__adXConfig`.
- No other module writes globals.
- Runtime is created by `createBootstrap()` and controlled through idempotent `start()` / `stop()`.
- The global namespace exposes the public runtime API plus `inspect()`, not mutable internals.

## Lifecycle Contract
- `start()`:
  - installs websocket interception via game-state store,
  - mounts enabled features,
  - publishes the runtime API under `window.__adXConfig`.
- `stop()`:
  - unmounts all mounted features,
  - disconnects all registered observers,
  - removes all registered listeners,
  - restores game-state interception.

## Core Contracts

### Event Bus (`src/core/event-bus.js`)
- `on(eventName, handler)`
- `off(eventName, handler)`
- `emit(eventName, payload)`

### Game State Store (`src/core/game-state-store.js`)
- Public minimum:
  - `start()`
  - `stop()`
  - `subscribe(listener)`
  - `getSnapshot()`
- Additional helpers exposed for features:
  - variant helpers,
  - active player/turn/throws/score helpers,
  - out mode and cricket mode helpers.

### Feature Contract
- Every feature exports `mount(context)`.
- `mount(context)` returns `cleanup()`.
- Feature code must register all observers/listeners via registries in `context.registries`.
- Feature cleanup must remove DOM classes/nodes it owns.

## Domain Contracts
- `src/domain/dart-rules.js` exports:
  - `variantRules`
  - `x01Rules`
  - `cricketRules`
- Domain modules are pure and never read/write DOM.

## Config Contract
- `src/config/default-config.js`: baseline defaults.
- `src/config/runtime-config.js`: normalized reads and toggles.
- Features consume normalized config only through `context.config`.

## Current Migrated Feature
- `Checkout Score Pulse` moved to `src/features/checkout-score-pulse/`.
- Uses:
  - `domain/x01-rules` for checkout feasibility + suggestion parsing,
  - `core/game-state-store` for active score and X01 checks,
  - core registries for observer ownership,
  - core DOM guards for style injection and cleanup.
