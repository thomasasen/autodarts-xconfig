# Autodarts xConfig

Autodarts xConfig ist ein Tampermonkey-Skript für `play.autodarts.io`, das dir Themes, Animationen und bessere Lesbarkeit direkt im Match bringt.  
Die Spiellogik bleibt unverändert. Es werden nur Darstellung und Hinweise verbessert.

## Installation

1. Tampermonkey installieren: https://www.tampermonkey.net/
2. Script installieren: `https://raw.githubusercontent.com/thomasasen/autodarts-xconfig/main/dist/autodarts-xconfig.user.js`
3. Autodarts neu laden: `https://play.autodarts.io/`

Wenn Tampermonkey einen Injection-Hinweis zeigt, aktiviere die empfohlene Einstellung:

![Tampermonkey Injection Hinweis](docs/screenshots/tempermonkey-injection.png)

## Funktionen

### X01
- Checkout Score Pulse
- Checkout Board Targets
- TV Board Zoom
- Style Checkout Suggestions

### Cricket und Tactics
- Cricket Highlighter
- Cricket Grid FX

### Allgemeine Effekte
- Average Trend Arrow
- Turn Start Sweep
- Triple/Double/Bull Hits
- Dart Marker Emphasis
- Dart Marker Darts
- Remove Darts Notification
- Single Bull Sound
- Turn Points Count
- Winner Fireworks

![Checkout Score Pulse](docs/screenshots/animation-checkout-score-pulse.gif)
![Dart Marker Darts](docs/screenshots/animation-dart-marker-darts.png)
![Winner Fireworks](docs/screenshots/animation-winner-fireworks.gif)

## Themes / Templates

Zusätzlich zu den Animationen gibt es fünf spielmodusbezogene Themes:

- Theme X01
- Theme Shanghai
- Theme Bermuda
- Theme Cricket (für Cricket und Tactics)
- Theme Bull-off

Jedes Theme ist als eigenes Feature integriert, idempotent initialisiert und über die zentrale Konfiguration schaltbar.

![Theme X01](docs/screenshots/template-theme-x01-readme.png)
![Theme X01 Preview](docs/screenshots/template-theme-x01-preview-under-throws-readme.png)
![Theme Shanghai](docs/screenshots/template-theme-shanghai-readme.png)
![Theme Bermuda](docs/screenshots/template-theme-bermuda-readme.png)
![Theme Cricket](docs/screenshots/template-theme-cricket-readme.png)
![Theme Bull-off](docs/screenshots/template-theme-bull-off-readme.png)

## Hinweise

- Standardmäßig ist nur `Checkout Score Pulse` aktiv, alles andere ist zunächst deaktiviert.
- Theme-Hintergrundbilder werden pro Theme in der Konfiguration gespeichert.
- Installationsziel ist das gebaute Userscript: `dist/autodarts-xconfig.user.js`

## Dokumentation

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
