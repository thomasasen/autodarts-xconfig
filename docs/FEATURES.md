# Feature-Übersicht

## Kurzüberblick

Autodarts xConfig enthält aktuell:

- 15 Animationen und Komfortfunktionen
- 5 Themes (Templates)

Alle Features sind modular registriert. Standardmäßig ist nur `Checkout Score Pulse` aktiviert.

## Animationen und Komfort

### X01
- Checkout Score Pulse: hebt finish-fähige Restwerte hervor.
- Checkout Board Targets: markiert sinnvolle Checkout-Ziele auf dem Board.
- TV Board Zoom: zoomt in klaren Checkout-/Setup-Situationen.
- Style Checkout Suggestions: macht Checkout-Hinweise sichtbarer.

### Cricket und Tactics
- Cricket Highlighter: visualisiert Druck- und Zielzustände.
- Cricket Grid FX: zusätzliche Rastereffekte für schnelle Orientierung.

### Alle Modi
- Average Trend Arrow
- Turn Start Sweep
- Triple/Double/Bull Hits
- Dart Marker Emphasis
- Dart Marker Darts
- Remove Darts Notification
- Single Bull Sound
- Turn Points Count
- Winner Fireworks

## Themes / Templates

### Theme X01
- Für: `X01`
- Optionen: AVG anzeigen, Hintergrundmodus, Bild-Deckkraft, Spielerfeld-Transparenz, Hintergrundbild

![Theme X01](screenshots/template-theme-x01-readme.png)
![Theme X01 Preview Standard](screenshots/template-theme-x01-preview-standard-readme.png)
![Theme X01 Preview Under Throws](screenshots/template-theme-x01-preview-under-throws-readme.png)

### Theme Shanghai
- Für: `Shanghai`
- Optionen: AVG anzeigen, Hintergrundmodus, Bild-Deckkraft, Spielerfeld-Transparenz, Hintergrundbild

![Theme Shanghai](screenshots/template-theme-shanghai-readme.png)

### Theme Bermuda
- Für: `Bermuda` (inklusive Varianten mit Zusätzen)
- Optionen: Hintergrundmodus, Bild-Deckkraft, Spielerfeld-Transparenz, Hintergrundbild

![Theme Bermuda](screenshots/template-theme-bermuda-readme.png)

### Theme Cricket
- Für: `Cricket` und `Tactics`
- Optionen: AVG anzeigen, Hintergrundmodus, Bild-Deckkraft, Spielerfeld-Transparenz, Hintergrundbild

![Theme Cricket](screenshots/template-theme-cricket-readme.png)

### Theme Bull-off
- Für: `Bull-off` (inklusive Varianten mit Zusätzen)
- Optionen: Kontrast-Preset, Hintergrundmodus, Bild-Deckkraft, Spielerfeld-Transparenz, Hintergrundbild

![Theme Bull-off](screenshots/template-theme-bull-off-readme.png)

## Hinweise

- Theme-Konfiguration liegt unter `features.themes.<themeKey>`.
- Hintergrundbilder werden als Data-URL pro Theme gespeichert.
- Runtime und Feature-Registry verhindern doppelte Mounts, Listener und Observer.
