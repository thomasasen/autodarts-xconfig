# Dart Rule Modules

## Zweck

Diese Übersicht benennt alle Module, die Dart-Regeln implementieren, ableiten oder regelnahe Zustände für Features interpretieren.

## Modulübersicht

| Modul | Pfad | Zweck | Regeltyp |
| --- | --- | --- | --- |
| X01-Regeln | `src/domain/x01-rules.js` | Segment-Normalisierung, Bull-Aliase, Out-Modi, Checkout-/Bust-Logik, Suggestion-Parsing | X01, Segment-/Bull-Parsing, Out-Mode |
| Cricket-Regeln | `src/domain/cricket-rules.js` | Cricket-/Tactics-Ziele, Marks, Closure, Overflow-Scoring, Board-/Player-State | Cricket, Tactics, Target-State |
| Variantenregeln | `src/domain/variant-rules.js` | Variant-Familien, Cricket-Spielmodus, Cricket-Scoring-Modus | Variant-/Mode-Klassifikation |
| Dart-Regel-Aggregator | `src/domain/dart-rules.js` | Zentrale Re-Exports der Domain-Regeln | Domain-Schnittstelle |
| Game-State-Store | `src/core/game-state-store.js` | Liest Match-State aus WebSocket-Nachrichten und trennt Variant, Out-Mode und Cricket-Modi | Runtime-State-Bridge |
| Cricket Highlighter Logic | `src/features/cricket-highlighter/logic.js` | Extrahiert Grid-/Board-Daten aus dem DOM und konsumiert `cricket-rules` für Board-Highlights | UI-Interpretation, Cricket |
| Cricket Highlighter Mount | `src/features/cricket-highlighter/index.js` | Mount-/Observer-Logik für Cricket-Highlights | UI-Orchestrierung |
| Cricket Grid FX Logic | `src/features/cricket-grid-fx/logic.js` | Leitet Grid-Zellen und Übergänge aus `cricket-rules` für visuelle Effekte ab | UI-Interpretation, Cricket |
| Checkout Score Pulse Logic | `src/features/checkout-score-pulse/logic.js` | Entscheidet, wann ein X01-Checkout-Highlight aktiv ist | UI-Interpretation, X01 |
| TV Board Zoom Logic | `src/features/tv-board-zoom/logic.js` | Wählt X01-Zielsegmente für Checkout-/Setup-Zooms | UI-Interpretation, X01 |
| Checkout Board Targets Mount | `src/features/checkout-board-targets/index.js` | Liest Checkout-Suggestionen und übergibt Zielsegmente an das Overlay | UI-Interpretation, X01 |
| Checkout Board Targets Render | `src/features/checkout-board-targets/logic.js` | Rendert Segment-/Bull-Overlays auf dem Board | Board-Geometrie, UI |
| Style Checkout Suggestions Logic | `src/features/style-checkout-suggestions/logic.js` | Stilisierung der Suggestion-Anzeige ohne eigene Regelableitung | UI-Verbraucher |
| Triple/Double/Bull Hits Logic | `src/features/triple-double-bull-hits/logic.js` | Klassifiziert Throw-Text über Domain-Helfer | Hit-Interpretation |
| Single Bull Sound Logic | `src/features/single-bull-sound/logic.js` | Erkannt Single-Bull-Treffer über Domain-Helfer und Game-State | Bull-Interpretation |

## Einordnung

- Echte Regelwahrheit liegt in `src/domain`.
- `src/core/game-state-store.js` liefert die nötigen Match-/Mode-Daten an Features.
- `src/features` darf Regeln nur konsumieren oder DOM-Daten in domain-taugliche Eingaben übersetzen.
- Dieses Audit behandelt bewusst nur Dart-Regeln, nicht visuelle Themen oder xConfig-UI-Details.
