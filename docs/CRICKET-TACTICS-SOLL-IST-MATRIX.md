# Cricket/Tactics Soll-Ist-Abweichungsmatrix

Stand: 2026-03-10 (nach Final-Stabilisierung)

## Quellenbasis

- README-Soll:
  - [Theme Cricket](../README.md#template-autodarts-theme-cricket)
  - [Cricket Target Highlighter](../README.md#animation-autodarts-animate-cricket-target-highlighter)
  - [Cricket Grid FX](../README.md#animation-autodarts-animate-cricket-grid-fx)
- Screenshot-Soll:
  - `docs/screenshots/animation-cricket-target-highlighter.png`
  - `docs/screenshots/animation-cricket-grid-fx.png`
  - User-Screenshots vom 2026-03-10 (Board-Logik, Pressure-Darstellung, Settings-Scroll)
- Runtime-Ist (vor Fix):
  - `C:\Users\t.asen\Downloads\play.autodarts.io-1773147718872.log`

## Abweichungsmatrix (re-opened und verifiziert)

| ID | Soll (README/Screenshot) | Ist vor Fix (Runtime) | Runtime Evidence | Kategorie | Erwarteter Zustand | Fix-Ansatz | Post-Fix-Assertion | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `CTC-LOOP-001` | Keine Endlosschleifen ohne echte State-Änderung | Observer → Update → eigene DOM-Mutation erzeugt Dauerloop | Log-Spam mit `requestAnimationFrame`/`schedule`, wiederholte `overlay missing` | Logik + Lifecycle | Identischer Surface-Status darf keine erneute Schleife erzeugen | Status-Signatur-Gate + Self-Mutation-Filter + kein interner Overlay-Removal-Reschedule | `tests/runtime/runtime-performance.test.js` (`missing-grid warning only once...`) | `resolved` |
| `CTC-GRID-001` | GridFX muss echte Cricket/Tactics-Matrix nutzen | `warn kein Grid`, `rows=0` trotz aktiver Matrix | Log enthält wiederholt `rows=0`, `labelCells=0`, `warn kein Grid` | DOM/Parser + Übergangslogik | GridFX nur aus validiertem `gridSnapshot.rows`; ohne Grid: fail-soft ohne Churn | Shared Pipeline bleibt einzige Quelle; GridFX konsumiert nur `renderState` | `tests/runtime/cricket-grid-fx-effects.test.js`, `tests/runtime/cricket-render-state.test.js` | `resolved` |
| `CTC-HL-001` | Board-Highlights müssen Cricket-Regeln korrekt folgen | Geschlossene Ziele wirkten wie offene/aktive Ziele | User-Screenshots + Runtime-State-Mismatch | Regellogik + Player-State-Mapping | Highlights nur aus zentralem Statusmodell; closed non-scorable nie aktiv | UI-Buckets/Priorität im Render-State (`scorable/offense/pressure/open/dead/closed`) | `tests/runtime/cricket-render-state.test.js`, `tests/runtime/cricket-highlighter-priority.test.js` | `resolved` |
| `CTC-HL-002` | Gegnerdruck subtil, nicht als Vollsektor | Pressure/Danger visuell zu aggressiv (vollflächig) | User-Screenshot mit rotem Vollsektor | UI/Styling | Pressure/Danger als subtile Ring-/Border-Hinweise | Slot-basierte Shape-Klassen + suppresste Single-Lanes bei Pressure/Danger | `tests/runtime/cricket-highlighter-priority.test.js` (`pressure rows use subtle ring classes...`) | `resolved` |
| `CTC-OVERLAY-001` | Overlay nach Reload sofort aus Scoreboard rekonstruieren | Overlay erschien erst nach weiterem Event/Wurf | User-Beschreibung + Log mit wiederholten Overlay-Warnungen | Übergangslogik + Lifecycle | Initial-Update muss Scoreboard-Snapshot rendern, ohne Throw-Event | Persistenter Overlay-Lifecycle, kein Forced-Rerender-Pfad | `tests/runtime/runtime-performance.test.js` (`rebuilds overlay after external removal...`) | `resolved` |
| `CTC-UI-001` | Settings-Panel muss stabil scrollbar bleiben | Scroll springt auf Anfang zurück | User-Screenshot und Live-Verhalten | UI/Renderstrategie | Modal-/Body-Container-Identität bleibt erhalten, Scroll-Offsets bleiben erhalten | In-place-Patching der Modal-Struktur statt Container-Austausch | `tests/runtime/xconfig-shell.test.js` (`keeps container identity while applying setting updates`) | `resolved` |
| `CTC-LOG-001` | Debug nur bei echten Änderungen | Warn-/State-Spam trotz unverändertem Zustand | Log enthält identische Warnungen in hoher Frequenz | Logging + Lifecycle | Ein identischer Status wird nur einmal gewarnt/logged bis Recovery | Status/Pipeline-Signature-Gating im Highlighter/GridFX | `tests/runtime/runtime-performance.test.js` + bestehende Lifecycle-Tests | `resolved` |
| `CTC-ARCH-001` | Pipeline `DOM -> State -> deriveTargetStates -> UI` ohne UI-Eigenlogik | Verteilte Heuristiken führten zu Inkonsistenz | Kombination aus Log, Screenshot-Abweichung, Churn | Architektur | Ein einheitlicher Render-State mit expliziten UI-Feldern | Pipeline ergänzt um `pressureLevel`, `uiBucket`, `uiPriority`, `isHighlightActive`, `closedByPlayer`, `openByOpponent` | `tests/runtime/cricket-render-state.test.js` (neue UI-Feld-Tests) | `resolved` |

## Hauptursache (final klassifiziert)

Hauptursache war eine Kombination aus:

1. **Regellogik/State-Ableitung**: fehlende explizite UI-Priorisierung im zentralen Cricket-State.
2. **Player-State-Mapping**: Perspektivfehler bei aktiver/inaktiver Bewertung in Folgemodulen.
3. **DOM/Parser-Verhalten**: instabile Reaktion auf temporär fehlende Surfaces.
4. **Übergangslogik**: fehlende Status-Gates für identische Nicht-Ready-Zustände.
5. **Theme/CSS-Darstellung**: Pressure/Danger visuell zu stark und fachlich irreführend.

## Technische Fix-Hotspots

- `src/features/cricket-surface/pipeline.js`
- `src/features/cricket-highlighter/index.js`
- `src/features/cricket-highlighter/logic.js`
- `src/features/cricket-highlighter/style.js`
- `src/features/cricket-grid-fx/index.js`
- `src/features/cricket-grid-fx/logic.js`
- `src/features/xconfig-ui/index.js`

## Restrisiko

- Sehr exotische DOM-Layouts außerhalb der aktuell abgedeckten Scoreboard-Strukturen können weitere Selektor-Härtungen erfordern.
- Das Risiko ist durch die Runtime-Tests und Matrix-basierte Repro/Assertion deutlich reduziert.
