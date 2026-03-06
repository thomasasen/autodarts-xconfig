# Migration Plan

## Goal
Build `autodarts-xconfig` as a clean successor of the old repository with explicit runtime ownership, centralized dart rules, and lower side-effect risk between modules.

## Legacy Audit Inventory

### Core / Runtime (legacy behavior references)
- `Animation/autodarts-animation-shared.js`
- `Animation/autodarts-game-state-shared.js`
- `Config/AD xConfig.user.js`
- `Config/AD xConfig Auto Loader.user.js`

### Domain Logic (extractable rules)
- `Animation/autodarts-game-state-shared.js` (variant detection, active score/turn helpers)
- `Animation/autodarts-cricket-state-shared.js` (cricket/tactics label and target-state logic)
- `Animation/Autodarts Animate Checkout Score Pulse.user.js` (checkout score feasibility + suggestion parser)
- `Animation/Autodarts Animate TV Board Zoom.user.js` (one-dart checkout segment + T20 bust guard)

### Feature Modules (migration candidates)
- `Animation/Autodarts Animate Checkout Score Pulse.user.js`
- `Animation/Autodarts Animate Checkout Board Targets.user.js`
- `Animation/Autodarts Style Checkout Suggestions.user.js`
- `Animation/Autodarts Animate TV Board Zoom.user.js`
- `Animation/Autodarts Animate Cricket Target Highlighter.user.js`
- `Animation/Autodarts Animate Cricket Grid FX.user.js`

### Config / UI references
- `Config/AD xConfig.user.js`

### Tests / Docs references
- `tests/cricket-state-harness.html`
- `tests/cricket-target-highlighter-harness.html`
- `docs/TECHNIK-REFERENZ.md`
- `docs/TACTICS-CRICKET-ABGLEICH.md`

## Source-of-Truth Mapping Used in This Migration
- `Animation/autodarts-game-state-shared.js`
- `Animation/autodarts-cricket-state-shared.js`
- `Animation/Autodarts Animate Checkout Score Pulse.user.js`
- `Animation/Autodarts Animate TV Board Zoom.user.js`
- `Animation/Autodarts Animate Checkout Board Targets.user.js`
- `docs/TECHNIK-REFERENZ.md`
- `docs/TACTICS-CRICKET-ABGLEICH.md`
- `tests/cricket-state-harness.html`
- `tests/cricket-target-highlighter-harness.html`

## Side-Effect Risks to Eliminate
- Duplicate `MutationObserver` instances for the same behavior.
- Duplicate event listeners without cleanup ownership.
- Multiple feature instances writing to the same DOM classes/overlay IDs.
- Inline rule duplication inside UI scripts (checkout/cricket logic embedded in feature modules).
- Global namespace sprawl (`window.*`) outside a single project namespace.

## Ordered Backlog (Stability + Dependency Driven)
1. Foundation runtime and registries (idempotent start/stop, observer/listener ownership).
2. Pure domain rule extraction (`variant`, `x01`, `cricket/tactics`).
3. First low-risk feature migration: Checkout Score Pulse.
4. Checkout visual family migration:
   - Checkout Board Targets
   - TV Board Zoom
   - Style Checkout Suggestions
5. Cricket visual family migration:
   - Cricket Target Highlighter
   - Cricket Grid FX
6. AD xConfig UI/loader parity and advanced runtime controls.