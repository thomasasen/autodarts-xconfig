# Runtime Entrypoints

## Bootstrap Flow

| Entrypoint | Role | Runtime Notes |
| --- | --- | --- |
| `loader/autodarts-xconfig.user.js` | Userscript entry at `document-start` | Loads the bundled runtime into the page. |
| `src/runtime/bootstrap-runtime.js` | Tampermonkey startup coordinator | Loads persisted config, creates the feature registry, starts the runtime, and mounts the xConfig shell. |
| `src/core/bootstrap.js` | Runtime composition root | Creates the event bus, listener registry, observer registry, DOM guards, game-state store, and feature mount lifecycle. |
| `src/features/feature-registry.js` | Feature catalog | Wraps all feature mount functions and exposes runtime metadata used by the shell and bootstrap. |
| `src/features/xconfig-ui/index.js` | xConfig shell bootstrap | Injects the menu entry and panel host, patches history, observes the app root, and reacts to runtime start/stop/config events. |

## Game State

| Entrypoint | Role | Runtime Notes |
| --- | --- | --- |
| `src/core/game-state-store.js` | WebSocket-derived state store | Intercepts `MessageEvent.prototype.data` for match websocket messages, derives the current match snapshot, and notifies feature subscribers. |
| `src/core/event-bus.js` | Internal runtime event fan-out | Used for runtime lifecycle events and shell synchronization. Feature updates now use direct `gameState.subscribe()` instead of duplicating `game-state:updated` event-bus subscriptions. |

## Mutation Observers

The runtime keeps the current per-feature observer model. Each mounted feature owns at most one registry-managed observer key and disconnects it on cleanup.

| Feature | Observer Scope | Trigger Source |
| --- | --- | --- |
| `checkout-score-pulse` | root subtree, `childList`, `characterData`, class attributes | score and suggestion DOM changes |
| `checkout-board-targets` | root subtree, `childList`, `characterData` | suggestion text and board replacement |
| `tv-board-zoom` | root subtree, `childList`, `characterData`, `class/style` | board DOM changes and zoom-target layout changes |
| `style-checkout-suggestions` | root subtree, `childList`, `characterData` | suggestion text and replacement |
| `average-trend-arrow` | root subtree, `childList`, `characterData` | average text changes |
| `turn-start-sweep` | root subtree, `childList`, class attributes | active-player row changes |
| `triple-double-bull-hits` | root subtree, `childList`, `characterData` | throw row text changes |
| `cricket-highlighter` | root subtree, `childList`, `characterData` | cricket grid text and board replacement |
| `cricket-grid-fx` | root subtree, `childList`, `characterData` | cricket grid text and row replacement |
| `dart-marker-emphasis` | root subtree, `childList` | marker insertion/removal |
| `dart-marker-darts` | root subtree, `childList`, geometry attributes | marker insertion and board geometry changes |
| `remove-darts-notification` | root subtree, `childList`, `characterData` | remove-darts notice appearance and fallback text |
| `single-bull-sound` | root subtree, `childList`, `characterData` | throw text changes |
| `turn-points-count` | root subtree, `childList`, `characterData` | turn-points text changes |
| `winner-fireworks` | root subtree, `childList`, `class/style` | winner banner visibility changes |
| `theme-*` via `mount-theme-feature` | root subtree, `childList`, `characterData` | theme target layout/content changes |
| `xconfig-ui` | app root subtree, `childList` | navigation/content tree changes outside shell-managed DOM |

## Game-State Subscriptions

Each mounted feature that reacts to match progress subscribes directly to `gameState.subscribe()` and returns a cleanup function that unsubscribes during feature teardown.

Features with direct game-state subscriptions:

- `checkout-score-pulse`
- `checkout-board-targets`
- `tv-board-zoom`
- `style-checkout-suggestions`
- `average-trend-arrow`
- `turn-start-sweep`
- `triple-double-bull-hits`
- `cricket-highlighter`
- `cricket-grid-fx`
- `dart-marker-emphasis`
- `dart-marker-darts`
- `remove-darts-notification`
- `single-bull-sound`
- `turn-points-count`
- `winner-fireworks`
- `theme-*` via `mount-theme-feature`

## DOM and Window Listeners

Registry-managed listeners are concentrated in the shell, themes, and layout-sensitive features:

- `tv-board-zoom`: `resize`, `orientationchange`, `pointerdown`, `visibilitychange`, `beforeunload`
- `winner-fireworks`: `resize`, `visibilitychange`, `pointerdown`
- `cricket-highlighter`: `resize`, `orientationchange`, `visibilitychange`
- `cricket-grid-fx`: `resize`, `orientationchange`, `visibilitychange`
- `dart-marker-darts`: `resize`, `visibilitychange`
- `dart-marker-emphasis`: `visibilitychange`
- `single-bull-sound`: `pointerdown`, `keydown`, `visibilitychange`
- `turn-points-count`: `visibilitychange`
- `triple-double-bull-hits`: `visibilitychange`
- `theme-*`: `resize`, `scroll`
- `xconfig-ui`: `popstate`, delegated `click`, delegated `change`, delegated `keydown`

## Timers, RAF, and Polling

- `shared/raf-scheduler.js` is the standard feature-side scheduler used to coalesce repeated DOM and game-state triggers into one RAF callback.
- `turn-points-count` animates scoreboard text and tracks per-node RAF/anime handles.
- `average-trend-arrow`, `turn-start-sweep`, `dart-marker-darts`, `cricket-grid-fx`, and `winner-fireworks` use timeout-based cleanup for transient UI state.
- `winner-fireworks` also uses an interval while the effect is active.
- `single-bull-sound` and `triple-double-bull-hits` support optional polling intervals and now skip hidden-tab polling work.

## Cleanup Boundaries

- `src/core/bootstrap.js` unmounts every mounted feature before calling `observers.disconnectAll()`, `listeners.removeAll()`, and `gameState.stop()`.
- Every feature cleanup remains idempotent and is responsible for removing its own DOM artifacts, timers, and registry-managed observer/listener keys.
- `src/features/xconfig-ui/index.js` is outside the feature registry but exposes its own `mount`, `teardown`, and `dispose` lifecycle and cleans up its observer/listeners separately.
