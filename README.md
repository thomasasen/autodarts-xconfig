# Autodarts xConfig

> Visuelle Erweiterungen für Autodarts: bessere Lesbarkeit, klare Hinweise, Themes und optionale Effekte.  
> Die Spiellogik bleibt unverändert.

[![Installieren](https://img.shields.io/badge/Installieren-autodarts--xconfig.user.js-1f6feb?style=for-the-badge)](https://raw.githubusercontent.com/thomasasen/autodarts-xconfig/main/dist/autodarts-xconfig.user.js)

## Schnellstart

1. Tampermonkey installieren: [tampermonkey.net](https://www.tampermonkey.net/)
2. Auf den Install-Button oben klicken
3. `https://play.autodarts.io/` neu laden
4. In der linken Navigation **AD xConfig** öffnen
5. Module aktivieren und Einstellungen direkt im Spiel anpassen

![AD xConfig Menü und Oberfläche](docs/screenshots/ad-xconfig.png)

Wenn Tampermonkey einen Injection-Hinweis zeigt, aktiviere die empfohlene Browser-Einstellung:

![Tampermonkey Injection-Hinweis](docs/screenshots/tempermonkey-injection.png)

## Was ist enthalten?

- 15 Animationen und Komfortfunktionen
- 5 Themes
- Zentrale Konfiguration im In-Game-Menü **AD xConfig**

## Themes

### Theme X01

![Theme X01 in AD xConfig](docs/screenshots/template-theme-x01-xConfig.png)
![Theme X01 Vorschau Standard](docs/screenshots/template-theme-x01-preview-standard-readme.png)
![Theme X01 Vorschau unter Würfen](docs/screenshots/template-theme-x01-preview-under-throws-readme.png)

### Theme Shanghai

![Theme Shanghai in AD xConfig](docs/screenshots/template-theme-shanghai-xConfig.png)

### Theme Bermuda

![Theme Bermuda in AD xConfig](docs/screenshots/template-theme-bermuda-xConfig.png)

### Theme Cricket

![Theme Cricket in AD xConfig](docs/screenshots/template-theme-cricket-xConfig.png)

### Theme Bull-off

![Theme Bull-off in AD xConfig](docs/screenshots/template-theme-bull-off-xConfig.png)

## Animationen und Komfort

### X01

![Checkout Score Pulse](docs/screenshots/animation-checkout-score-pulse.gif)
![Checkout Board Targets](docs/screenshots/animation-checkout-board-targets.gif)
![TV Board Zoom](docs/screenshots/animation-tv-board-zoom.gif)
![Style Checkout Suggestions](docs/screenshots/animation-style-checkout-suggestions.png)
![Format Badge](docs/screenshots/animation-style-checkout-suggestions-format-badge-readme.png)
![Format Stripe](docs/screenshots/animation-style-checkout-suggestions-format-stripe-readme.png)
![Format Ticket](docs/screenshots/animation-style-checkout-suggestions-format-ticket-readme.png)
![Format Outline](docs/screenshots/animation-style-checkout-suggestions-format-outline-readme.png)

### Cricket / Tactics

![Cricket Highlighter](docs/screenshots/animation-cricket-target-highlighter.png)
![Cricket Grid FX](docs/screenshots/animation-cricket-grid-fx.png)

### Alle Modi

![Average Trend Arrow](docs/screenshots/animation-average-trend-arrow.png)
![Turn Start Sweep](docs/screenshots/animation-turn-start-sweep.gif)
![Triple Double Bull Hits](docs/screenshots/animation-triple-double-bull-hits.gif)
![Dart Marker Emphasis](docs/screenshots/animation-dart-marker-emphasis.gif)
![Dart Marker Darts](docs/screenshots/animation-dart-marker-darts.png)
![Remove Darts Notification](docs/screenshots/animation-remove-darts-notification.png)
![Turn Points Count](docs/screenshots/animation-turn-points-count.gif)
![Turn Points Count Detail](docs/screenshots/animation-turn-points-count-detail-readme.gif)
![Winner Fireworks](docs/screenshots/animation-winner-fireworks.gif)
![xConfig Test-Button](docs/screenshots/xConfig-testbutton.png)

## Weitere Dokumentation

- [Feature-Übersicht](docs/FEATURES.md)
- [Technische Architektur](docs/TECHNICAL-ARCHITECTURE.md)
- [Legacy-Paritätsmatrix](docs/LEGACY-PARITY-MATRIX.md)

## Für Entwickler

```bash
npm install
npm run build
npm test
npm run verify
```
