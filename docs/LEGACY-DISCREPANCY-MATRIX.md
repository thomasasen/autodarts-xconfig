# Legacy-Diskrepanzmatrix

Diese Matrix bewertet den Stand zwischen `.oldrepo` und der neuen Architektur aus Sicht des Releases `1.1.0`.

| legacy feature | new implementation counterpart | status | explanation | user-visible impact |
| --- | --- | --- | --- | --- |
| Checkout Score Pulse | `checkout-score-pulse` | fully implemented | X01-Highlight nutzt now out-mode-aware Domain-Regeln | keine relevante LÃ¼cke |
| Checkout Board Targets | `checkout-board-targets` | fully implemented | Board-Markierung und Bull-Mapping sind vorhanden | keine relevante LÃ¼cke |
| TV Board Zoom | `tv-board-zoom` | fully implemented | Zoom-Logik nutzt X01-Regeln, T20-Bust-Guard, Sticky-Hold (`T20,T20,T20` bis Spielerwechsel / Checkout bis Leg-Ende) und Korrektur-Auszoom über Wurfleiste | keine relevante Lücke |
| Style Checkout Suggestions | `style-checkout-suggestions` | fully implemented | Layout-Varianten und README-Anker vorhanden | keine relevante LÃ¼cke |
| Average Trend Arrow | `average-trend-arrow` | fully implemented | Funktionsumfang vorhanden | keine relevante LÃ¼cke |
| Turn Start Sweep | `turn-start-sweep` | fully implemented | Funktionsumfang vorhanden | keine relevante LÃ¼cke |
| Triple / Double / Bull Hits | `triple-double-bull-hits` | fully implemented | Trefferklassifikation lÃ¤uft Ã¼ber zentrale Domain-Helfer | keine relevante LÃ¼cke |
| Cricket Target Highlighter | `cricket-highlighter` | fully implemented | Cricket-/Tactics-ZustÃ¤nde werden zentral abgeleitet | keine relevante LÃ¼cke |
| Cricket Grid FX | `cricket-grid-fx` | fully implemented | Grid-Effekte nutzen dieselbe Cricket-State-Basis | keine relevante LÃ¼cke |
| Dart Marker Emphasis | `dart-marker-emphasis` | fully implemented | Legacy-Verhalten ist abgedeckt | keine relevante LÃ¼cke |
| Dart Marker Darts | `dart-marker-darts` | fully implemented | Legacy-Verhalten ist abgedeckt | keine relevante LÃ¼cke |
| Remove Darts Notification | `remove-darts-notification` | fully implemented | Legacy-Verhalten ist abgedeckt | keine relevante LÃ¼cke |
| Single Bull Sound | `single-bull-sound` | fully implemented | Bull-Erkennung ist zentralisiert | keine relevante LÃ¼cke |
| Turn Points Count | `turn-points-count` | fully implemented | Punktediff-Animation ist vorhanden | keine relevante LÃ¼cke |
| Winner Fireworks | `winner-fireworks` | fully implemented | Sieger-Effekt plus xConfig-Testbutton sind vorhanden | keine relevante LÃ¼cke |
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

