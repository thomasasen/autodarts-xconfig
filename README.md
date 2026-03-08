# Autodarts xConfig

> Visuelle Erweiterungen für Autodarts: bessere Lesbarkeit, klare Hinweise, Themes und optionale Effekte.  
> Die Spiellogik bleibt unverändert.

Für bestehende Nutzer fühlt sich alles vertraut an: Menüpunkt **AD xConfig**, Feature-Toggles, Theme-Einstellungen und lokale Speicherung.

[![Installieren](https://img.shields.io/badge/Installieren-autodarts--xconfig.user.js-1f6feb?style=for-the-badge)](https://raw.githubusercontent.com/thomasasen/autodarts-xconfig/main/dist/autodarts-xconfig.user.js)

## Für wen ist das?

Autodarts xConfig ist für Spieler gedacht, die in Matches schneller sehen wollen:

- ist ein Checkout möglich?
- welches Ziel ist gerade sinnvoll?
- wo ist sofortiger Druck in Cricket/Tactics?
- welche Informationen sollen klarer hervorgehoben werden?

Alles wird zentral im Spiel über **AD xConfig** ein- und ausgeschaltet.

![AD xConfig Menü und Oberfläche](docs/screenshots/ad-xconfig.png)

## Schnellstart

1. Tampermonkey installieren: [tampermonkey.net](https://www.tampermonkey.net/)
2. Auf den Install-Button oben klicken
3. `https://play.autodarts.io/` neu laden
4. In der linken Navigation **AD xConfig** öffnen
5. Gewünschte Module aktivieren und Einstellungen anpassen

Wenn Tampermonkey einen Injection-Hinweis zeigt, aktiviere die empfohlene Browser-Einstellung:

![Tampermonkey Injection-Hinweis](docs/screenshots/tempermonkey-injection.png)

## Was ist enthalten?

Aktuell sind 20 Module enthalten:

- 15 Animationen und Komfortfunktionen
- 5 Themes (Templates)

Standardmäßig ist `Checkout Score Pulse` aktiv, der Rest ist bewusst opt-in.

## Templates / Themes

### Theme X01

- Für: `X01`
- Fokus: klare Score- und Player-Bereiche
- Optionen: AVG, Hintergrundbild, Darstellung, Deckkraft, Spielerfeld-Transparenz

![Theme X01](docs/screenshots/template-theme-x01-readme.png)
![Theme X01 in AD xConfig](docs/screenshots/template-theme-x01-xConfig.png)
![Theme X01 Vorschau Standard](docs/screenshots/template-theme-x01-preview-standard-readme.png)
![Theme X01 Vorschau unter Würfen](docs/screenshots/template-theme-x01-preview-under-throws-readme.png)

### Theme Shanghai

- Für: `Shanghai`
- Fokus: aufgeräumter Lesefluss

![Theme Shanghai](docs/screenshots/template-theme-shanghai-readme.png)
![Theme Shanghai in AD xConfig](docs/screenshots/template-theme-shanghai-xConfig.png)

### Theme Bermuda

- Für: `Bermuda` (inklusive Varianten mit Namenszusatz)
- Fokus: klare Trennung wichtiger UI-Bereiche

![Theme Bermuda](docs/screenshots/template-theme-bermuda-readme.png)
![Theme Bermuda in AD xConfig](docs/screenshots/template-theme-bermuda-xConfig.png)

### Theme Cricket

- Für: `Cricket` und `Tactics`
- Fokus: ruhiges Layout mit gutem Kontrast

![Theme Cricket](docs/screenshots/template-theme-cricket-readme.png)
![Theme Cricket in AD xConfig](docs/screenshots/template-theme-cricket-xConfig.png)

### Theme Bull-off

- Für: `Bull-off` (inklusive Varianten mit Namenszusatz)
- Fokus: kontraststarke Score-Darstellung
- Zusatz: Kontrast-Preset (`Sanft`, `Standard`, `Kräftig`)

![Theme Bull-off](docs/screenshots/template-theme-bull-off-readme.png)
![Theme Bull-off in AD xConfig](docs/screenshots/template-theme-bull-off-xConfig.png)

## Animationen und Komfort

### X01-Funktionen

- `Checkout Score Pulse`
- `Checkout Board Targets`
- `TV Board Zoom`
- `Style Checkout Suggestions`

![Checkout Score Pulse](docs/screenshots/animation-checkout-score-pulse.gif)
![Checkout Board Targets](docs/screenshots/animation-checkout-board-targets.gif)
![TV Board Zoom](docs/screenshots/animation-tv-board-zoom.gif)
![Style Checkout Suggestions in AD xConfig](docs/screenshots/animation-style-checkout-suggestions-xConfig.png)

Formatvarianten für Checkout Suggestions:

![Format Badge](docs/screenshots/animation-style-checkout-suggestions-format-badge-readme.png)
![Format Ribbon](docs/screenshots/animation-style-checkout-suggestions-format-ribbon-readme.png)
![Format Stripe](docs/screenshots/animation-style-checkout-suggestions-format-stripe-readme.png)
![Format Ticket](docs/screenshots/animation-style-checkout-suggestions-format-ticket-readme.png)
![Format Outline](docs/screenshots/animation-style-checkout-suggestions-format-outline-readme.png)

### Cricket / Tactics

- `Cricket Highlighter`
- `Cricket Grid FX`

![Cricket Highlighter](docs/screenshots/animation-cricket-target-highlighter.png)
![Cricket Highlighter in AD xConfig](docs/screenshots/animation-cricket-target-highlighter-xConfig.png)
![Cricket Grid FX](docs/screenshots/animation-cricket-grid-fx.png)

### Funktionen für alle Modi

- `Average Trend Arrow`
- `Turn Start Sweep`
- `Triple/Double/Bull Hits`
- `Dart Marker Emphasis`
- `Dart Marker Darts`
- `Remove Darts Notification`
- `Single Bull Sound`
- `Turn Points Count`
- `Winner Fireworks`

![Average Trend Arrow](docs/screenshots/animation-average-trend-arrow.png)
![Average Trend Arrow in AD xConfig](docs/screenshots/animation-average-trend-arrow-xConfig.png)
![Turn Start Sweep](docs/screenshots/animation-turn-start-sweep.gif)
![Turn Start Sweep in AD xConfig](docs/screenshots/animation-turn-start-sweep-xConfig.gif)
![Triple/Double/Bull Hits](docs/screenshots/animation-triple-double-bull-hits.gif)
![Dart Marker Emphasis](docs/screenshots/animation-dart-marker-emphasis.gif)
![Dart Marker Emphasis in AD xConfig](docs/screenshots/animation-dart-marker-emphasis-xConfig.gif)
![Dart Marker Darts](docs/screenshots/animation-dart-marker-darts.png)
![Dart Marker Darts in AD xConfig](docs/screenshots/animation-dart-marker-darts-xConfig.png)
![Remove Darts Notification](docs/screenshots/animation-remove-darts-notification.png)
![Remove Darts Notification in AD xConfig](docs/screenshots/animation-remove-darts-notification-xConfig.png)
![Turn Points Count](docs/screenshots/animation-turn-points-count.gif)
![Turn Points Count in AD xConfig](docs/screenshots/animation-turn-points-count-xConfig.gif)
![Turn Points Count Detail](docs/screenshots/animation-turn-points-count-detail-readme.gif)
![Winner Fireworks](docs/screenshots/animation-winner-fireworks.gif)
![xConfig Test-Button](docs/screenshots/xConfig-testbutton.png)

## Konfiguration in AD xConfig

Im Panel gibt es zwei Tabs:

- `Themen`: Theme-spezifische Optionen und Hintergrundbild-Verwaltung
- `Animationen`: alle Animations- und Komfortmodule mit ihren Einstellungen

Die Einstellungen werden lokal gespeichert und nach einem Reload automatisch wiederhergestellt.

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
