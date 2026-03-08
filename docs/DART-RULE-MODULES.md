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
| Checkout Score Pulse Logic | `src/features/checkout-score-pulse/logic.js` | Konsumiert X01-Regeln für Checkout-Hervorhebung | UI-Verbraucher |
| TV Board Zoom Logic | `src/features/tv-board-zoom/logic.js` | Konsumiert X01-Regeln für Checkout- und Setup-Ziele | UI-Verbraucher |
| Checkout Board Targets Logic | `src/features/checkout-board-targets/logic.js` | Rendert Segment- und Bull-Overlays ohne eigene Regelwahrheit | UI-Rendering |
| Cricket Highlighter Logic | `src/features/cricket-highlighter/logic.js` | Übersetzt DOM-Zustand in Eingaben für `cricket-rules` | UI-Verbraucher |
| Cricket Grid FX Logic | `src/features/cricket-grid-fx/logic.js` | Verwendet `cricket-rules` für Grid-Zustände und Übergänge | UI-Verbraucher |
| Triple/Double/Bull Hits Logic | `src/features/triple-double-bull-hits/logic.js` | Nutzt zentrale Segmentklassifikation | Treffer-Interpretation |
| Single Bull Sound Logic | `src/features/single-bull-sound/logic.js` | Nutzt zentrale Bull-Helfer statt eigener Speziallogik | Bull-Interpretation |

## Leitplanken

- Regelwahrheit liegt ausschließlich in `src/domain`.
- `src/core` liest und normalisiert Runtime-Zustände, implementiert aber keine Fachregeln.
- `src/features` darf Regeln nur konsumieren oder DOM-Daten in domain-taugliche Eingaben übersetzen.
