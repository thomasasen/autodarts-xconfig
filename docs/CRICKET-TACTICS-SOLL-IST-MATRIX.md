# Cricket/Tactics Soll-Ist-Abweichungsmatrix

Stand: 2026-03-10 (nach Implementierung)

## Quellenbasis

- README-Soll:
  - [Theme Cricket](../README.md#template-autodarts-theme-cricket)
  - [Cricket Target Highlighter](../README.md#animation-autodarts-animate-cricket-target-highlighter)
  - [Cricket Grid FX](../README.md#animation-autodarts-animate-cricket-grid-fx)
- Screenshot-Soll:
  - `docs/screenshots/animation-cricket-target-highlighter.png`
  - `docs/screenshots/animation-cricket-grid-fx.png`
  - `docs/screenshots/template-theme-cricket-xConfig.png`
  - Laufzeit-Screenshot (Settings-Scroll/Jump): User-Anhang 2026-03-10
- Runtime-Ist (vor Fix):
  - `C:\Users\t.asen\Downloads\play.autodarts.io-1773147718872.log`

## Abweichungsmatrix

| ID | Soll | Ist vor Fix | Ursache | Fix | Status | Verifikation |
| --- | --- | --- | --- | --- | --- | --- |
| `CTC-LOOP-001` | Keine dauerhaften Renderzyklen ohne echte State-Änderung | Endlosschleife aus Observer → Update → eigener DOM-Mutation | Self-Mutations + Forced-Refresh-Pfad | Observer-Filter + Overlay-Removal-Only-Recovery + Signature-Gating | `resolved` | `tests/runtime/runtime-performance.test.js` (`cricket-highlighter rebuilds overlay...`) |
| `CTC-GRID-001` | GridFX erhält stabile Cricket/Tactics-Griddaten | `warn kein Grid`, `rows=0` trotz aktivem Match | Fragile Root-/Row-Erkennung | Shared Pipeline mit `findCricketGrid`, `gridSnapshot.rows`, strikter Strukturprüfung | `resolved` | `tests/runtime/cricket-render-state.test.js`, `tests/runtime/cricket-grid-fx-effects.test.js` |
| `CTC-HL-001` | Board-Hervorhebung entspricht echten Target-Zuständen | Falsche/offene vs. geschlossene Ziele, Overlay-Churn | Instabile Overlay-Lifecycle + unklare Renderquelle | Persistentes Overlay, shape-state cache, state-gesteuerte Updates | `resolved` | `tests/runtime/cricket-theme-compatibility.test.js` |
| `CTC-ACTIVE-001` | Aktiver/inaktiver Spieler farblich sofort korrekt | Perspektivwechsel nicht zuverlässig | Player-State- und Grid-Mapping nicht zentral | Zentrale Ableitung `activePlayerIndex`, `stateMap`, `targetStates` im Pipeline-State | `resolved` | `tests/runtime/cricket-render-state.test.js` (`board presentation follows active player perspective`) |
| `CTC-FX-001` | GridFX reagiert nur auf echte Transitions | Fehlendes Grid + wiederholte Warn-/Update-Versuche | Kein stabiler Snapshot als Quelle | GridFX liest nur `renderState.gridSnapshot.rows`, transition-signature-gated | `resolved` | `tests/runtime/cricket-grid-fx-effects.test.js` |
| `CTC-ROUTE-001` | Cricket-UI pausiert auf `/ad-xconfig` | Module liefen in xConfig-Kontext weiter | Fehlender harter Route-Guard | Pipeline-Status `paused-route`, Consumer respektieren Status | `resolved` | `tests/runtime/cricket-render-state.test.js` + `tests/runtime/cricket-theme-compatibility.test.js` |
| `CTC-UI-001` | Settings-Modal bleibt scrollbar ohne Jump-to-top | Scroll sprang zurück | Voll-Re-Render bei Sync/Mutation | Shell-Node persistent, Render-Signature-Gate, ScrollTop-Erhalt | `resolved` | `tests/runtime/xconfig-shell.test.js` (`preserves node identity and scroll offsets`) |
| `CTC-LOG-001` | Debug-Logs nur bei echten Änderungen | Dauerhafte Log-Spam-Flut | Logging nicht an Signaturen gekoppelt | `pipelineSignature`/Status-signature-gated Logs, one-shot Warnungen | `resolved` | Highlighter-/GridFX-Lifecycle + Performance-Tests (keine Loop-Reproduktion) |
| `CTC-ARCH-001` | Pipeline `DOM -> State -> UI`; keine doppelte UI-Regellogik | Divergierende Parserpfade in Highlighter/GridFX | Verteilte, redundante Extraktion | Neues Shared-Modul `src/features/cricket-surface/pipeline.js` | `resolved` | Modul- und Integrationstests in `tests/runtime/*cricket*` |

## Hauptursache (final)

Hauptursache war eine Kombination aus:

1. Regellogik-/State-Ableitungsstreuung in mehreren UI-Modulen,
2. Player-State-Mapping-Instabilität bei heterogenen Grid-Strukturen,
3. DOM-/Parser-Fehlern (inkl. Fallback-Root-Problemen),
4. Übergangslogik ohne harte Signatur-Gates,
5. xConfig-UI-Renderstrategie mit unnötigen Rebuilds.

## Technische Fix-Hotspots

- `src/features/cricket-surface/pipeline.js`
- `src/features/cricket-highlighter/index.js`
- `src/features/cricket-highlighter/logic.js`
- `src/features/cricket-grid-fx/index.js`
- `src/features/cricket-grid-fx/logic.js`
- `src/features/xconfig-ui/index.js`

## Offenes Restrisiko

- Sehr exotische, stark vom aktuellen DOM abweichende Scoreboard-Strukturen können weitere Grid-Selector-Härtungen erfordern. Der aktuelle Stand ist durch die Runtime- und Kompatibilitätstests abgesichert.
