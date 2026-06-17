# Legacy-Diskrepanzmatrix

Diese Matrix bewertet den Stand zwischen `.oldrepo` und der neuen Architektur aus Sicht des Releases `1.1.0`.

| legacy feature | new implementation counterpart | status | explanation | user-visible impact |
| --- | --- | --- | --- | --- |
| Checkout Score Highlight | `checkout-score-highlight` | fully implemented | X01-Highlight nutzt now out-mode-aware Domain-Regeln | keine relevante LÃ¼cke |
| Checkout Target Highlights | `checkout-target-highlights` | fully implemented | Board-Markierung und Bull-Mapping sind vorhanden | keine relevante LÃ¼cke |
| TV Board Zoom | `tv-board-zoom` | fully implemented | Zoom-Logik nutzt X01-Regeln, T20-Bust-Guard, Sticky-Hold (`T20,T20,T20` bis Spielerwechsel / Checkout bis Leg-Ende) und Korrektur-Auszoom über Wurfleiste | keine relevante Lücke |
| Checkout Suggestion Styles | `checkout-suggestion-styles` | fully implemented | Layout-Varianten und README-Anker vorhanden | keine relevante LÃ¼cke |
| AVG Trend Arrow | `avg-trend-arrow` | fully implemented | Funktionsumfang vorhanden | keine relevante LÃ¼cke |
| Active Player Sweep | `active-player-sweep` | fully implemented | Funktionsumfang vorhanden | keine relevante LÃ¼cke |
| Special Hit Highlights | `special-hit-highlights` | fully implemented | Trefferklassifikation lÃ¤uft Ã¼ber zentrale Domain-Helfer | keine relevante LÃ¼cke |
| Cricket Target Highlighter | `cricket-target-highlighter` | fully implemented | Cricket-/Tactics-ZustÃ¤nde werden zentral abgeleitet | keine relevante LÃ¼cke |
| Cricket Grid Status Effects | `cricket-grid-status-effects` | fully implemented | Grid-Effekte nutzen dieselbe Cricket-State-Basis | keine relevante LÃ¼cke |
| Dartboard Marker Highlight | `dartboard-marker-highlight` | fully implemented | Legacy-Verhalten ist abgedeckt | keine relevante LÃ¼cke |
| Dart Marker Replacer | `dart-marker-replacer` | fully implemented | Legacy-Verhalten ist abgedeckt | keine relevante LÃ¼cke |
| Take Out Darts Alert | `take-out-darts-alert` | fully implemented | Legacy-Verhalten ist abgedeckt | keine relevante LÃ¼cke |
| Single Bull Hit Sound | `single-bull-hit-sound` | fully implemented | Bull-Erkennung ist zentralisiert | keine relevante LÃ¼cke |
| Turn Score Counter | `turn-score-counter` | fully implemented | Punktediff-Animation ist vorhanden | keine relevante LÃ¼cke |
| Winner Celebration Effect | `winner-celebration-effect` | fully implemented | Sieger-Effekt plus xConfig-Testbutton sind vorhanden | keine relevante LÃ¼cke |
| Theme X01 | `theme-x01` | fully implemented | Theme, Bildpersistenz und Optionen vorhanden | keine relevante LÃ¼cke |
| Theme Shanghai | `theme-shanghai` | fully implemented | Theme und Optionen vorhanden | keine relevante LÃ¼cke |
| Theme Bermuda | `theme-bermuda` | fully implemented | Theme und Optionen vorhanden | keine relevante LÃ¼cke |
| Theme Cricket | `theme-cricket` | fully implemented | Theme fÃ¼r Cricket und Tactics vorhanden | keine relevante LÃ¼cke |
| Theme Bull-off | `theme-bull-off` | fully implemented | Theme und Kontrast-Preset vorhanden | keine relevante LÃ¼cke |
| AD xConfig | `src/features/xconfig-ui` | partially implemented | gleiche Kern-UX, aber ohne Remote-Discovery und GM-Admin-Flows | Endnutzer erhalten zentrale Konfiguration ohne Loader-Verwaltung |
| AD xConfig Auto Loader | kein GegenstÃ¼ck | intentionally removed | Bundle-only ist bewusste Architekturentscheidung | Installation erfolgt direkt Ã¼ber das Release-Userscript |
| `autodarts-animation-shared.js` | `src/core/*` plus `src/shared/*` | fully implemented | Shared-Mechanik wurde in Registries, Guards und Helfer zerlegt | robustere Runtime, keine sichtbare KÃ¼rzung |
| `autodarts-cricket-state-shared.js` | `src/domain/cricket-rules.js` plus Cricket-Features | fully implemented | Cricket-Logik ist jetzt sauber in Domain und Features getrennt | keine relevante LÃ¼cke |
| `autodarts-game-state-shared.js` | `src/core/game-state-store.js` | fully implemented | Game-State-Logik ist zentralisiert | keine relevante LÃ¼cke |
| `autodarts-theme-shared.js` | `src/features/themes/shared/*` | fully implemented | Theme-Shared wurde modularisiert | keine relevante LÃ¼cke |
| `anime.min.js` | `src/vendors/anime.min.cjs` | fully implemented | benÃ¶tigte Vendor-FunktionalitÃ¤t ist gebÃ¼ndelt | keine relevante LÃ¼cke |
| `canvas-confetti.browser.js` | `src/vendors/canvas-confetti.browser.js` | fully implemented | benÃ¶tigte Vendor-FunktionalitÃ¤t ist gebÃ¼ndelt | keine relevante LÃ¼cke |
| `gsap.min.js` | kein GegenstÃ¼ck | intentionally removed | im aktuellen Feature-Set ungenutzt | keine sichtbare LÃ¼cke |
| `mo.umd.min.js` | kein GegenstÃ¼ck | intentionally removed | im aktuellen Feature-Set ungenutzt | keine sichtbare LÃ¼cke |

## Bewertung

- Gameplay- und UI-relevante Legacy-Funktionen sind fÃ¼r den Release vollstÃ¤ndig oder bewusst bereinigt abgedeckt.
- Bewusst entfernt bleiben nur Loader-/Admin-Flows und ungenutzte Vendor-Dateien.

