# Dart Rule Modules

## Zweck

Diese Übersicht benennt alle Module, die Dart-Regeln implementieren, ableiten oder regelnahe Zustände für Features interpretieren.

## Modulübersicht

| Modul | Pfad | Zweck | Regeltyp |
| --- | --- | --- | --- |
| X01-Regeln | `src/domain/x01-rules.js` | Segment-Normalisierung, Bull-Aliase, Out-Modi, Checkout-/Bust-Logik und Visit-Auswertung | X01 |
| Cricket-Regeln | `src/domain/cricket-rules.js` | Zielmengen, Marks, Closure, Overflow-Scoring, Target-States und Gewinnerlogik | Cricket, Tactics |
| Variantenregeln | `src/domain/variant-rules.js` | Klassifikation von X01-, Cricket- und Tactics-Modi | Varianten |
| Dart-Regel-Aggregator | `src/domain/dart-rules.js` | Zentrale Re-Exports der Domain-Regeln | Domain-Schnittstelle |
| Game-State-Store | `src/core/game-state-store.js` | Liest Match-State aus WebSocket-Nachrichten und trennt Variant, Out-Mode und Cricket-Modi | Runtime-State-Bridge |
| Checkout Score Highlight Logic | `src/features/checkout-score-highlight/logic.js` | Konsumiert X01-Regeln für score- und out-mode-validierte Checkout-Hervorhebung | UI-Verbraucher |
| TV Board Zoom Logic | `src/features/tv-board-zoom/logic.js` | Konsumiert X01-Regeln für Checkout- und Setup-Ziele | UI-Verbraucher |
| Checkout Target Highlights Logic | `src/features/checkout-target-highlights/logic.js` | Rendert Segment- und Bull-Overlays ohne eigene Regelwahrheit | UI-Rendering |
| Cricket Target Highlighter Logic | `src/features/cricket-target-highlighter/logic.js` | Übersetzt DOM-Zustand in Eingaben für `cricket-rules` | UI-Verbraucher |
| Cricket Grid Status Effects Logic | `src/features/cricket-grid-status-effects/logic.js` | Verwendet `cricket-rules` für Grid-Zustände und Übergänge | UI-Verbraucher |
| Special Hit Highlights Logic | `src/features/special-hit-highlights/logic.js` | Nutzt zentrale Segmentklassifikation | Treffer-Interpretation |
| Single Bull Hit Sound Logic | `src/features/single-bull-hit-sound/logic.js` | Nutzt zentrale Bull-Helfer statt eigener Speziallogik | Bull-Interpretation |

## Leitplanken

- Regelwahrheit liegt ausschließlich in `src/domain`.
- `src/core` liest und normalisiert Runtime-Zustände, implementiert aber keine Fachregeln.
- `src/features` darf Regeln nur konsumieren oder DOM-Daten in domain-taugliche Eingaben übersetzen.
