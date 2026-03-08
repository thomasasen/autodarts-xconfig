# Legacy-Paritätsmatrix

Diese Matrix ist der verbindliche Abgleich zwischen `.oldrepo` und dem aktuellen Stand.

Pflichtspalten:

- `legacy source file`
- `new counterpart`
- `migrated (yes/no/partial)`
- `remaining gap`
- `user-visible difference`

## User-facing Module aus `.oldrepo/Animation`

| legacy source file | new counterpart | migrated (yes/no/partial) | remaining gap | user-visible difference |
| --- | --- | --- | --- | --- |
| `Animation/Autodarts Animate Checkout Score Pulse.user.js` | `feature: checkout-score-pulse` | yes | kein offener Gap | keine relevante Verhaltensabweichung |
| `Animation/Autodarts Animate Checkout Board Targets.user.js` | `feature: checkout-board-targets` | yes | kein offener Gap | keine relevante Verhaltensabweichung |
| `Animation/Autodarts Animate TV Board Zoom.user.js` | `feature: tv-board-zoom` | yes | kein offener Gap | keine relevante Verhaltensabweichung |
| `Animation/Autodarts Style Checkout Suggestions.user.js` | `feature: style-checkout-suggestions` | yes | kein offener Gap | keine relevante Verhaltensabweichung |
| `Animation/Autodarts Animate Average Trend Arrow.user.js` | `feature: average-trend-arrow` | yes | kein offener Gap | keine relevante Verhaltensabweichung |
| `Animation/Autodarts Animate Turn Start Sweep.user.js` | `feature: turn-start-sweep` | yes | kein offener Gap | keine relevante Verhaltensabweichung |
| `Animation/Autodarts Animate Triple Double Bull Hits.user.js` | `feature: triple-double-bull-hits` | yes | kein offener Gap | keine relevante Verhaltensabweichung |
| `Animation/Autodarts Animate Cricket Target Highlighter.user.js` | `feature: cricket-highlighter` | yes | kein offener Gap | keine relevante Verhaltensabweichung |
| `Animation/Autodarts Animate Cricket Grid FX.user.js` | `feature: cricket-grid-fx` | yes | kein offener Gap | keine relevante Verhaltensabweichung |
| `Animation/Autodarts Animate Dart Marker Emphasis.user.js` | `feature: dart-marker-emphasis` | yes | kein offener Gap | keine relevante Verhaltensabweichung |
| `Animation/Autodarts Animate Dart Marker Darts.user.js` | `feature: dart-marker-darts` | yes | kein offener Gap | keine relevante Verhaltensabweichung |
| `Animation/Autodarts Animate Remove Darts Notification.user.js` | `feature: remove-darts-notification` | yes | kein offener Gap | keine relevante Verhaltensabweichung |
| `Animation/Autodarts Animate Single Bull Sound.user.js` | `feature: single-bull-sound` | yes | kein offener Gap | keine relevante Verhaltensabweichung |
| `Animation/Autodarts Animate Turn Points Count.user.js` | `feature: turn-points-count` | yes | kein offener Gap | keine relevante Verhaltensabweichung |
| `Animation/Autodarts Animate Winner Fireworks.user.js` | `feature: winner-fireworks` | yes | kein offener Gap | keine relevante Verhaltensabweichung |

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
| `Config/AD xConfig.user.js` | `system-ui: src/features/xconfig-ui` | partial | kein Remote-Modul-Discovery und kein GM-Admin-Flow | gleiche Kern-UX (Menü, Tabs, Toggles, Settings), aber bewusst vereinfachte Bundle-only-Verwaltung |
| `Config/AD xConfig Auto Loader.user.js` | `kein Gegenstück (Bundle-Modell)` | no | bewusst nicht Teil der neuen Architektur | Installation erfolgt direkt über `dist/autodarts-xconfig.user.js`, kein Loader-Cache |

## Shared-/Vendor-Bestand aus Legacy

| legacy source file | new counterpart | migrated (yes/no/partial) | remaining gap | user-visible difference |
| --- | --- | --- | --- | --- |
| `Template/autodarts-theme-shared.js` | `src/features/themes/shared/*` | yes | kein offener Gap | keine direkte Nutzerabweichung |
| `Animation/autodarts-animation-shared.js` | `src/core/*` + `src/shared/*` | yes | kein offener Gap | stabilere Laufzeit ohne sichtbare Funktionskürzung |
| `Animation/autodarts-game-state-shared.js` | `src/core/game-state-store.js` | yes | kein offener Gap | keine direkte Nutzerabweichung |
| `Animation/autodarts-cricket-state-shared.js` | `src/domain/cricket-rules.js` + Cricket-Features | yes | kein offener Gap | keine direkte Nutzerabweichung |
| `Animation/vendor/anime.min.js` | `src/vendors/anime.min.cjs` | yes | kein offener Gap | keine direkte Nutzerabweichung |
| `Animation/vendor/canvas-confetti.browser.js` | `src/vendors/canvas-confetti.browser.js` | yes | kein offener Gap | keine direkte Nutzerabweichung |
| `Animation/vendor/gsap.min.js` | `kein Gegenstück` | no | aktuell von keinem Modul benötigt | keine sichtbare Lücke im aktuellen Feature-Set |
| `Animation/vendor/mo.umd.min.js` | `kein Gegenstück` | no | aktuell von keinem Modul benötigt | keine sichtbare Lücke im aktuellen Feature-Set |

## Release-Freigabe 1.0.0

- Major-Paritätsgaps: **keine**.
- Bewusst nicht enthalten: Legacy-Loader/GM-Remote-Flows.
- Ergebnis: `1.0.0` ist aus Paritätssicht freigegeben.
