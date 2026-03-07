# Autodarts xConfig

Autodarts xConfig ist ein Tampermonkey-Skript für `play.autodarts.io`.
Es erweitert Autodarts um besser sichtbare Hinweise, optionale Animationen und spielmodusbezogene Themes, ohne die Spiellogik zu verändern.

Die Steuerung läuft zentral über den Menüpunkt `AD xConfig` direkt in Autodarts.

![AD xConfig Menü und Oberfläche](docs/screenshots/ad-xconfig.png)

## Installation

1. Tampermonkey installieren: [www.tampermonkey.net](https://www.tampermonkey.net/)
2. Das Userscript öffnen und installieren: [`dist/autodarts-xconfig.user.js`](https://raw.githubusercontent.com/thomasasen/autodarts-xconfig/main/dist/autodarts-xconfig.user.js)
3. `https://play.autodarts.io/` neu laden
4. In der linken Navigation `AD xConfig` öffnen
5. Gewünschte Features und Themes aktivieren

Wenn Tampermonkey einen Hinweis zur Injection anzeigt, aktiviere die empfohlene Browser-Einstellung:

![Tampermonkey Hinweis](docs/screenshots/tempermonkey-injection.png)

## Funktionsüberblick

Autodarts xConfig enthält aktuell 20 Module:

- 15 Animationen und Komfortfunktionen
- 5 Themes für verschiedene Spielmodi

Standardmäßig ist nur `Checkout Score Pulse` aktiviert. Alles andere lässt sich in `AD xConfig` gezielt ein- oder ausschalten.

### X01

- `Checkout Score Pulse`: hebt finishfähige Restwerte sichtbar hervor
- `Checkout Board Targets`: markiert sinnvolle Ziele direkt auf dem Board
- `TV Board Zoom`: zoomt in klaren Checkout-Situationen näher ans Board
- `Style Checkout Suggestions`: macht Checkout-Empfehlungen besser lesbar

### Cricket und Tactics

- `Cricket Highlighter`: zeigt Druck- und Zielzustände deutlicher
- `Cricket Grid FX`: ergänzt die Cricket-Matrix um zusätzliche Live-Effekte

### In allen Modi

- `Average Trend Arrow`
- `Turn Start Sweep`
- `Triple/Double/Bull Hits`
- `Dart Marker Emphasis`
- `Dart Marker Darts`
- `Remove Darts Notification`
- `Single Bull Sound`
- `Turn Points Count`
- `Winner Fireworks`

![Checkout Score Pulse](docs/screenshots/animation-checkout-score-pulse.gif)
![Checkout Board Targets](docs/screenshots/animation-checkout-board-targets.gif)
![Winner Fireworks](docs/screenshots/animation-winner-fireworks.gif)

## Themes / Templates

Für die wichtigsten Spielmodi sind fünf Themes enthalten. Jedes Theme ist ein eigenes Modul und wird nur aktiviert, wenn du es in `AD xConfig` einschaltest.

- `Theme X01`
- `Theme Shanghai`
- `Theme Bermuda`
- `Theme Cricket`
- `Theme Bull-off`

Die Themes unterstützen je nach Modus unter anderem:

- AVG ein- oder ausblenden
- eigenes Hintergrundbild hochladen
- Hintergrund-Darstellung wählen
- Bild-Deckkraft anpassen
- Transparenz der Spielerfelder anpassen
- beim Bull-off-Theme ein Kontrast-Preset wählen

![Theme X01](docs/screenshots/template-theme-x01-readme.png)
![Theme X01 Vorschau unter den Würfen](docs/screenshots/template-theme-x01-preview-under-throws-readme.png)
![Theme Shanghai](docs/screenshots/template-theme-shanghai-readme.png)
![Theme Bermuda](docs/screenshots/template-theme-bermuda-readme.png)
![Theme Cricket](docs/screenshots/template-theme-cricket-readme.png)
![Theme Bull-off](docs/screenshots/template-theme-bull-off-readme.png)

## Konfiguration

Die komplette Bedienung erfolgt über `AD xConfig` direkt in Autodarts:

- Tab `Themen`: alle fünf Themes mit ihren Theme-Einstellungen
- Tab `Animationen`: alle Animationen und Komfortfunktionen mit ihren Optionen
- Schalter pro Modul: jedes Feature kann einzeln aktiviert oder deaktiviert werden
- Theme-Hintergründe: werden pro Theme gespeichert und bleiben nach einem Neuladen erhalten

Die Einstellungen werden lokal im Browser gespeichert. Es ist keine zusätzliche Server- oder GitHub-Konfiguration nötig.

## Screenshots

Weitere Beispiele findest du in der Dokumentation:

- [Feature-Übersicht](docs/FEATURES.md)
- [Technische Architektur](docs/TECHNICAL-ARCHITECTURE.md)
- [Migrationsstatus](docs/MIGRATION-STATUS.md)

## Für Entwickler

```bash
npm install
npm run build
npm test
```

Optional:

```bash
npm run verify
```
