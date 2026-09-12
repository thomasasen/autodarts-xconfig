# Autodarts DOM compatibility fixtures

These small fixtures lock the host structures that xConfig currently consumes. They intentionally do not snapshot cosmetic class ordering or the full Autodarts page.

## Provenance and redaction

- `x01-match-modern.html` was derived on 2026-09-12 from the active `play.autodarts.com` X01 match tab after Tampermonkey was disabled. It preserves the native variant badges, player-card marker/name/score structure, turn slots, checkout suggestions, and turn total. The player name was replaced with `PLAYER 1`; profile media, IDs, URLs, data attributes, and unrelated descendants were removed. No `ad-ext-*` node was present inside the captured header, player card, or turn surface.
- `dartboard-modern.html` was derived from the same extension-free X01 match surface. It preserves the native `[role="img"][aria-label="Dartboard"]` boundary, the `0 0 1000 1000` SVG, its translated board group, radius `500`, and 23 original segment paths. Embedded definitions, overlays, IDs, styles, and the remaining repeated segment paths were removed. The live source contained 129 paths; the reduced drawable set is sufficient to retain the board-selection signals used by xConfig.
- `cricket-modern.html` was derived on 2026-09-12 from the active `play.autodarts.com` Cricket match tab after Tampermonkey was disabled. The live grid had 32 direct children, three player columns, target order `20,19,18,17,16,15,B`, and exactly one local-player header. The fixture preserves the exact relevant host classes and flat-grid ordering while replacing names with `PLAYER 1` through `PLAYER 3` and removing profile media and unrelated header descendants. No `ad-ext-*` node was present inside the captured grid.
- `tactics-modern.html` was derived on 2026-09-12 from the active `play.autodarts.com` Tactics match tab after Tampermonkey was disabled. The live grid had 52 direct children, three player columns, target order `20` through `10` plus `B`, and no extension nodes. Unlike Cricket, this surface was column-major: all labels came first, followed by one header and twelve cells per player. Names and profile media were removed. This difference exposed and now guards a real host-compatibility failure in the former row-major-only parser.

The older scenario captures under `tests/fixtures/autodarts-live-dom/` remain archival input. They represent the former `play.autodarts.io` surface and are not substituted for the current `.com` contract.

## Contract and updates

The integration test treats the following as compatibility boundaries:

- X01: variant/out badges, visible player cards, exactly one active marker, one unambiguous score, three turn rows, and the turn total.
- Cricket/Tactics: visible flat row-major Cricket and column-major Tactics grids, bounded player-column width, `.font-display` headers, allowed target orders, exclusion of xConfig-owned grids, and rejection of lookalike grids.
- Dartboard: the native semantic container plus square SVG, plausible board drawables, a positive board radius, and preference over decorative SVGs without relying on one incidental CSS class.

When Autodarts changes these structures, capture the smallest relevant DOM again from a current authenticated match, remove personal and volatile data, record the exact verification date and limitations here, then update assertions only after confirming the corresponding production adapter still expresses the intended supported contract.
