# Legacy-Paritätsmatrix

Diese Matrix bleibt der stabile Kompatibilitätsanker für den Abgleich zwischen `.oldrepo` und dem aktuellen Stand.

Pflichtspalten:

- `legacy source file`
- `new counterpart`
- `migrated (yes/no/partial)`
- `remaining gap`
- `user-visible difference`

Details zur Release-Bewertung stehen zusätzlich in [LEGACY-DISCREPANCY-MATRIX.md](LEGACY-DISCREPANCY-MATRIX.md).

## User-facing Module aus `.oldrepo/Animation`

| legacy source file | new counterpart | migrated (yes/no/partial) | remaining gap | user-visible difference |
| --- | --- | --- | --- | --- |
| `Animation/Autodarts Animate Checkout Score Highlight.user.js` | `feature: checkout-score-highlight` | yes | kein offener Gap | keine relevante Verhaltensabweichung |
| `Animation/Autodarts Animate Checkout Target Highlights.user.js` | `feature: checkout-target-highlights` | yes | kein offener Gap | keine relevante Verhaltensabweichung |
| `Animation/Autodarts Animate TV Board Zoom.user.js` | `feature: tv-board-zoom` | yes | kein offener Gap | keine relevante Verhaltensabweichung |
| `Animation/Autodarts Checkout Suggestion Styles.user.js` | `feature: checkout-suggestion-styles` | yes | kein offener Gap | keine relevante Verhaltensabweichung |
| `Animation/Autodarts Animate AVG Trend Arrow.user.js` | `feature: avg-trend-arrow` | yes | kein offener Gap | keine relevante Verhaltensabweichung |
| `Animation/Autodarts Animate Active Player Sweep.user.js` | `feature: active-player-sweep` | yes | kein offener Gap | keine relevante Verhaltensabweichung |
| `Animation/Autodarts Animate Special Hit Highlights.user.js` | `feature: special-hit-highlights` | yes | kein offener Gap | keine relevante Verhaltensabweichung |
| `Animation/Autodarts Animate Cricket Target Highlighter.user.js` | `feature: cricket-target-highlighter` | yes | kein offener Gap | keine relevante Verhaltensabweichung |
| `Animation/Autodarts Animate Cricket Grid Status Effects.user.js` | `feature: cricket-grid-status-effects` | yes | kein offener Gap | keine relevante Verhaltensabweichung |
| `Animation/Autodarts Animate Dartboard Marker Highlight.user.js` | `feature: dartboard-marker-highlight` | yes | kein offener Gap | keine relevante Verhaltensabweichung |
| `Animation/Autodarts Animate Dart Marker Replacer.user.js` | `feature: dart-marker-replacer` | yes | kein offener Gap | keine relevante Verhaltensabweichung |
| `Animation/Autodarts Animate Take Out Darts Alert.user.js` | `feature: take-out-darts-alert` | yes | kein offener Gap | keine relevante Verhaltensabweichung |
| `Animation/Autodarts Animate Single Bull Hit Sound.user.js` | `feature: single-bull-hit-sound` | yes | kein offener Gap | keine relevante Verhaltensabweichung |
| `Animation/Autodarts Animate Turn Score Counter.user.js` | `feature: turn-score-counter` | yes | kein offener Gap | keine relevante Verhaltensabweichung |
| `Animation/Autodarts Animate Winner Celebration Effect.user.js` | `feature: winner-celebration-effect` | yes | kein offener Gap | keine relevante Verhaltensabweichung; Test-Button ist in AD xConfig wieder verfügbar |

## User-facing Module aus `.oldrepo/Template`

| legacy source file | new counterpart | migrated (yes/no/partial) | remaining gap | user-visible difference |
| --- | --- | --- | --- | --- |
| `Template/Autodarts Theme X01.user.js` | `feature: theme-x01` | yes | kein offener Gap | keine relevante Verhaltensabweichung |
| `Template/Autodarts Theme Shanghai.user.js` | `feature: theme-shanghai` | yes | kein offener Gap | keine relevante Verhaltensabweichung |
| `Template/Autodarts Theme Bermuda.user.js` | `feature: theme-bermuda` | yes | kein offener Gap | keine relevante Verhaltensabweichung |
| `Template/Autodarts Theme Cricket.user.js` | `feature: theme-cricket` | yes | kein offener Gap | keine relevante Verhaltensabweichung |
| `Template/Autodarts Theme Bull-off.user.js` | `feature: theme-bull-off` | yes | kein offener Gap | keine relevante Verhaltensabweichung |

## User-facing Module aus `.oldrepo/Config`

| legacy source file | new counterpart | migrated (yes/no/partial) | remaining gap | user-visible difference |
| --- | --- | --- | --- | --- |
| `Config/AD xConfig.user.js` | `system-ui: src/features/xconfig-ui` | partial | kein Remote-Modul-Discovery, kein GM-Admin-Flow | gleiche Kern-UX mit Menü, Tabs, Settings, Theme-Bildern und Winner-Celebration-Effect-Vorschau, aber bewusst ohne Loader-Verwaltung |
| `Config/AD xConfig Auto Loader.user.js` | `kein Gegenstück (Bundle-Modell)` | no | bewusst nicht Teil der neuen Architektur | Installation erfolgt direkt über `dist/autodarts-xconfig.user.js`, kein Loader-Cache |

## Shared- und Vendor-Bestand aus Legacy

| legacy source file | new counterpart | migrated (yes/no/partial) | remaining gap | user-visible difference |
| --- | --- | --- | --- | --- |
| `Template/autodarts-theme-shared.js` | `src/features/themes/shared/*` | yes | kein offener Gap | keine direkte Nutzerabweichung |
| `Animation/autodarts-animation-shared.js` | `src/core/*` und `src/shared/*` | yes | kein offener Gap | stabilere Laufzeit ohne sichtbare Funktionskürzung |
| `Animation/autodarts-game-state-shared.js` | `src/core/game-state-store.js` | yes | kein offener Gap | keine direkte Nutzerabweichung |
| `Animation/autodarts-cricket-state-shared.js` | `src/domain/cricket-rules.js` plus Cricket-Features | yes | kein offener Gap | keine direkte Nutzerabweichung |
| `Animation/vendor/anime.min.js` | `src/vendors/anime.min.cjs` | yes | kein offener Gap | keine direkte Nutzerabweichung |
| `Animation/vendor/canvas-confetti.browser.js` | `src/vendors/canvas-confetti.browser.js` | yes | kein offener Gap | keine direkte Nutzerabweichung |
| `Animation/vendor/gsap.min.js` | `kein Gegenstück` | no | aktuell von keinem Modul benötigt | keine sichtbare Lücke im Release-Umfang |
| `Animation/vendor/mo.umd.min.js` | `kein Gegenstück` | no | aktuell von keinem Modul benötigt | keine sichtbare Lücke im Release-Umfang |

## Release-Freigabe 1.1.0

- Major-Paritätsgaps: **keine**.
- Bundle-only bleibt eine bewusste Produktentscheidung.
- Ergebnis: `1.1.0` ist aus Paritätssicht freigegeben.
