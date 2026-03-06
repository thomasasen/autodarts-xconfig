# Status Report (Phase 1-4)

## Migrated Now
- New layered skeleton (`core`, `domain`, `features`, `config`, `shared`, `tests`, `docs`).
- Core runtime foundation:
  - idempotent bootstrap (`start`/`stop`),
  - event bus,
  - observer registry,
  - listener registry,
  - DOM safety guards,
  - websocket-driven game-state store.
- Domain extraction:
  - variant rules,
  - x01 rules (checkout feasibility, one-dart checkout, out-mode finish/bust evaluation, suggestion parser, T20 guard),
  - cricket/tactics target/state rules.
- First migrated feature:
  - Checkout Score Pulse (`src/features/checkout-score-pulse`).
- Tests:
  - domain unit tests,
  - runtime safety tests,
  - browser harness for checkout pulse.

## Intentionally Deferred
- AD xConfig UI and auto-loader parity.
- Heavy cricket DOM parsing/mapping (`buildGridSnapshot` complexity from old repo).
- Checkout Board Targets migration.
- TV Board Zoom migration.
- Style Checkout Suggestions migration.
- Cricket Target Highlighter migration.
- Cricket Grid FX migration.

## Remaining Risks
- Real-world websocket payload shape can drift from observed legacy assumptions.
- Out-mode normalization may need additional aliases from live matches.
- Cricket migration still requires careful parity work for DOM-heavy player/grid mapping.
- Feature interactions (once multiple migrated features coexist) still need integration-level regression checks.

## Recommended Next Migration Order
1. Checkout Board Targets
2. TV Board Zoom
3. Style Checkout Suggestions
4. Cricket Target Highlighter
5. Cricket Grid FX