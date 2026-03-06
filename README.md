# autodarts-xconfig

Clean successor repository for `autodarts-tampermonkey-themes`, rebuilt with layered architecture and explicit runtime ownership.

## Current State
- Phase 1-4 foundation implemented.
- First migrated feature: `Checkout Score Pulse`.
- Legacy repository is used only as behavior/reference source (`.oldrepo`).

## Project Structure
- `src/core` runtime/bootstrap/event infrastructure
- `src/domain` pure dart rules
- `src/features` feature modules mounted via bootstrap
- `src/config` default + normalized runtime config
- `tests` domain/runtime tests and browser harnesses
- `docs` architecture, migration plan, and status

## Run Tests
```bash
npm test
```

## Harness
Open in browser:
- `tests/harness/checkout-score-pulse-harness.html`