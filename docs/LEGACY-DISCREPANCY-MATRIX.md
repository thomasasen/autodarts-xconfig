# Legacy-Diskrepanzmatrix

Diese Matrix bewertet den Stand zwischen `.oldrepo` und der neuen Architektur aus Sicht des Releases `1.1.0`.

| legacy feature | new implementation counterpart | status | explanation | user-visible impact |
| --- | --- | --- | --- | --- |
| Checkout Score Pulse | `checkout-score-pulse` | fully implemented | X01-Highlight nutzt now out-mode-aware Domain-Regeln | keine relevante Lücke |
| Checkout Board Targets | `checkout-board-targets` | fully implemented | Board-Markierung und Bull-Mapping sind vorhanden | keine relevante Lücke |
| TV Board Zoom | `tv-board-zoom` | fully implemented | Zoom-Logik nutzt X01-Regeln und T20-Bust-Guard | keine relevante Lücke |
| Style Checkout Suggestions | `style-checkout-suggestions` | fully implemented | Layout-Varianten und README-Anker vorhanden | keine relevante Lücke |
| Average Trend Arrow | `average-trend-arrow` | fully implemented | Funktionsumfang vorhanden | keine relevante Lücke |
| Turn Start Sweep | `turn-start-sweep` | fully implemented | Funktionsumfang vorhanden | keine relevante Lücke |
| Triple / Double / Bull Hits | `triple-double-bull-hits` | fully implemented | Trefferklassifikation läuft über zentrale Domain-Helfer | keine relevante Lücke |
| Cricket Target Highlighter | `cricket-highlighter` | fully implemented | Cricket-/Tactics-Zustände werden zentral abgeleitet | keine relevante Lücke |
| Cricket Grid FX | `cricket-grid-fx` | fully implemented | Grid-Effekte nutzen dieselbe Cricket-State-Basis | keine relevante Lücke |
| Dart Marker Emphasis | `dart-marker-emphasis` | fully implemented | Legacy-Verhalten ist abgedeckt | keine relevante Lücke |
| Dart Marker Darts | `dart-marker-darts` | fully implemented | Legacy-Verhalten ist abgedeckt | keine relevante Lücke |
| Remove Darts Notification | `remove-darts-notification` | fully implemented | Legacy-Verhalten ist abgedeckt | keine relevante Lücke |
| Single Bull Sound | `single-bull-sound` | fully implemented | Bull-Erkennung ist zentralisiert | keine relevante Lücke |
| Turn Points Count | `turn-points-count` | fully implemented | Punktediff-Animation ist vorhanden | keine relevante Lücke |
| Winner Fireworks | `winner-fireworks` | fully implemented | Sieger-Effekt plus xConfig-Testbutton sind vorhanden | keine relevante Lücke |
| Theme X01 | `theme-x01` | fully implemented | Theme, Bildpersistenz und Optionen vorhanden | keine relevante Lücke |
| Theme Shanghai | `theme-shanghai` | fully implemented | Theme und Optionen vorhanden | keine relevante Lücke |
| Theme Bermuda | `theme-bermuda` | fully implemented | Theme und Optionen vorhanden | keine relevante Lücke |
| Theme Cricket | `theme-cricket` | fully implemented | Theme für Cricket und Tactics vorhanden | keine relevante Lücke |
| Theme Bull-off | `theme-bull-off` | fully implemented | Theme und Kontrast-Preset vorhanden | keine relevante Lücke |
| AD xConfig | `src/features/xconfig-ui` | partially implemented | gleiche Kern-UX, aber ohne Remote-Discovery und GM-Admin-Flows | Endnutzer erhalten zentrale Konfiguration ohne Loader-Verwaltung |
| AD xConfig Auto Loader | kein Gegenstück | intentionally removed | Bundle-only ist bewusste Architekturentscheidung | Installation erfolgt direkt über das Release-Userscript |
| `autodarts-animation-shared.js` | `src/core/*` plus `src/shared/*` | fully implemented | Shared-Mechanik wurde in Registries, Guards und Helfer zerlegt | robustere Runtime, keine sichtbare Kürzung |
| `autodarts-cricket-state-shared.js` | `src/domain/cricket-rules.js` plus Cricket-Features | fully implemented | Cricket-Logik ist jetzt sauber in Domain und Features getrennt | keine relevante Lücke |
| `autodarts-game-state-shared.js` | `src/core/game-state-store.js` | fully implemented | Game-State-Logik ist zentralisiert | keine relevante Lücke |
| `autodarts-theme-shared.js` | `src/features/themes/shared/*` | fully implemented | Theme-Shared wurde modularisiert | keine relevante Lücke |
| `anime.min.js` | `src/vendors/anime.min.cjs` | fully implemented | benötigte Vendor-Funktionalität ist gebündelt | keine relevante Lücke |
| `canvas-confetti.browser.js` | `src/vendors/canvas-confetti.browser.js` | fully implemented | benötigte Vendor-Funktionalität ist gebündelt | keine relevante Lücke |
| `gsap.min.js` | kein Gegenstück | intentionally removed | im aktuellen Feature-Set ungenutzt | keine sichtbare Lücke |
| `mo.umd.min.js` | kein Gegenstück | intentionally removed | im aktuellen Feature-Set ungenutzt | keine sichtbare Lücke |

## Bewertung

- Gameplay- und UI-relevante Legacy-Funktionen sind für den Release vollständig oder bewusst bereinigt abgedeckt.
- Bewusst entfernt bleiben nur Loader-/Admin-Flows und ungenutzte Vendor-Dateien.
