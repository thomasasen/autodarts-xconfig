# OLDREPO-Inventur

Diese Inventur basiert auf einem vollständigen Dateiscan von `.oldrepo` und erfasst die relevanten Module, Helfer und Asset-Gruppen des Legacy-Bestands.

## Animationen und Shared-Module

| file name | feature description | rule relevance | UI relevance |
| --- | --- | --- | --- |
| `Animation/Autodarts Animate Average Trend Arrow.user.js` | Trendpfeil am AVG | keine eigene Regelwahrheit | hoch |
| `Animation/Autodarts Animate Checkout Board Targets.user.js` | markiert Checkout-Ziele am Board | X01-Checkout-Ziele, Bull-Mapping | hoch |
| `Animation/Autodarts Animate Checkout Score Pulse.user.js` | hebt checkoutfähige Restwerte hervor | X01-Checkout-/Out-Mode-Relevanz | hoch |
| `Animation/Autodarts Animate Cricket Grid FX.user.js` | animiert Cricket-/Tactics-Matrix | Cricket-Zielzustände und Übergänge | hoch |
| `Animation/Autodarts Animate Cricket Target Highlighter.user.js` | markiert Cricket-Ziele am Board | Cricket/Tactics-Target-Logik | hoch |
| `Animation/Autodarts Animate Dart Marker Darts.user.js` | ersetzt Marker durch Dart-Bilder | keine eigene Regelwahrheit | mittel |
| `Animation/Autodarts Animate Dart Marker Emphasis.user.js` | verstärkt Board-Marker | keine eigene Regelwahrheit | mittel |
| `Animation/Autodarts Animate Remove Darts Notification.user.js` | betont Entfernen-der-Darts-Hinweis | keine eigene Regelwahrheit | mittel |
| `Animation/Autodarts Animate Single Bull Sound.user.js` | spielt Sound bei Single Bull | Bull-Erkennung | mittel |
| `Animation/Autodarts Animate Triple Double Bull Hits.user.js` | hebt Triple-, Double- und Bull-Treffer hervor | Trefferklassifikation | hoch |
| `Animation/Autodarts Animate Turn Points Count.user.js` | zählt Punkteänderungen sichtbar | Game-State-Diff | mittel |
| `Animation/Autodarts Animate Turn Start Sweep.user.js` | markiert Spielerwechsel | keine eigene Regelwahrheit | mittel |
| `Animation/Autodarts Animate TV Board Zoom.user.js` | zoomt auf relevante Board-Bereiche | X01-Bust-/Checkout-Regeln | hoch |
| `Animation/Autodarts Animate Winner Fireworks.user.js` | Sieger-Overlay mit Test-Button | Siegererkennung, Bull-off-Ausnahme | hoch |
| `Animation/Autodarts Style Checkout Suggestions.user.js` | formatiert Checkout-Empfehlungen | X01-Suggestion-Parsing | hoch |
| `Animation/autodarts-animation-shared.js` | gemeinsamer Animations-Unterbau | indirekt regelrelevant über Trigger und Watcher | hoch |
| `Animation/autodarts-cricket-state-shared.js` | gemeinsamer Cricket-/Tactics-State | Cricket-Mark-, Ziel- und Moduslogik | hoch |
| `Animation/autodarts-game-state-shared.js` | gemeinsamer Match-/Turn-State | indirekt regelrelevant | hoch |

## Themes und Theme-Shared

| file name | feature description | rule relevance | UI relevance |
| --- | --- | --- | --- |
| `Template/Autodarts Theme X01.user.js` | X01-Theme mit Hintergrundbild und AVG-Option | keine | hoch |
| `Template/Autodarts Theme Shanghai.user.js` | Shanghai-Theme | keine | hoch |
| `Template/Autodarts Theme Bermuda.user.js` | Bermuda-Theme | keine | hoch |
| `Template/Autodarts Theme Cricket.user.js` | gemeinsames Cricket-/Tactics-Theme | keine | hoch |
| `Template/Autodarts Theme Bull-off.user.js` | Bull-off-Theme | keine | hoch |
| `Template/autodarts-theme-shared.js` | gemeinsamer Theme-Unterbau | keine | hoch |

## Konfiguration und Loader

| file name | feature description | rule relevance | UI relevance |
| --- | --- | --- | --- |
| `Config/AD xConfig.user.js` | zentrale Legacy-Konfigurationsoberfläche | keine direkte Regelwahrheit | sehr hoch |
| `Config/AD xConfig Auto Loader.user.js` | Loader-, Cache- und Remote-Installationsfluss | keine | hoch |

## Vendor-Bestand

| file name | feature description | rule relevance | UI relevance |
| --- | --- | --- | --- |
| `Animation/vendor/anime.min.js` | Animationsbibliothek | keine | mittel |
| `Animation/vendor/canvas-confetti.browser.js` | Konfetti-Bibliothek | keine | mittel |
| `Animation/vendor/gsap.min.js` | zusätzliche Animationsbibliothek | keine | niedrig |
| `Animation/vendor/mo.umd.min.js` | zusätzliche Motion-Bibliothek | keine | niedrig |

## Assets, Dokumentation und Harnesses

| file name | feature description | rule relevance | UI relevance |
| --- | --- | --- | --- |
| `assets/template-theme-*.png` | Theme-Screenshots für README und xConfig | keine | hoch |
| `assets/animation-*.gif` | animierte Preview-Assets für README/xConfig | indirekt für Nutzererwartung | hoch |
| `assets/animation-*.png` | statische Preview-Assets für README/xConfig | indirekt für Nutzererwartung | hoch |
| `assets/Dart_*.png` | Dart-Designs für `Dart Marker Darts` | keine | mittel |
| `assets/TakeOut.png` | Grafik für `Remove Darts Notification` | keine | mittel |
| `assets/singlebull.mp3` | Audio-Asset für `Single Bull Sound` | Bull-Feedback | mittel |
| `assets/AD-xConfig.png` | Screenshot der Legacy-Konfigurationsoberfläche | keine | hoch |
| `assets/xConfig-testbutton.png` | Screenshot des Winner-Fireworks-Testbuttons | keine | hoch |
| `assets/tempermonkey-injection.png` | Installationshinweis für README | keine | mittel |
| `docs/TECHNIK-REFERENZ.md` | technische Legacy-Referenz | indirekt | mittel |
| `docs/TACTICS-CRICKET-ABGLEICH.md` | fachlicher Cricket-/Tactics-Abgleich | Cricket/Tactics | mittel |
| `tests/cricket-state-harness.html` | Legacy-Harness für Cricket-State | Cricket-Zustände | mittel |
| `tests/cricket-target-highlighter-harness.html` | Legacy-Harness für Board-Overlay | Cricket-Zielzustände | mittel |

## Fazit

- Der Legacy-Bestand deckt Animationen, Themes, eine zentrale UI, Shared-State-Logik, Vendor-Libs und Asset-Pakete ab.
- Fachlich kritisch sind vor allem die X01-/Cricket-Shared-State-Helfer sowie die Checkout- und Cricket-Features.
- Loader-, Remote-Cache- und Admin-Flows sind architektonisch getrennt von den eigentlichen Endnutzerfunktionen.
