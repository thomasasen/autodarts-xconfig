# Migrationsstatus

## Ausgeliefert in v1.0.0

### Animationen und Komfort

Die 15 wichtigen Animations- und Komfortfunktionen aus dem Altprojekt sind im aktuellen System enthalten:

1. Checkout Score Pulse
2. Checkout Board Targets
3. TV Board Zoom
4. Style Checkout Suggestions
5. Average Trend Arrow
6. Turn Start Sweep
7. Triple/Double/Bull Hits
8. Cricket Highlighter
9. Cricket Grid FX
10. Dart Marker Emphasis
11. Dart Marker Darts
12. Remove Darts Notification
13. Single Bull Sound
14. Turn Points Count
15. Winner Fireworks

### Themes / Templates

Die fünf Legacy-Templates sind als modulare Theme-Features enthalten:

- Theme X01
- Theme Shanghai
- Theme Bermuda
- Theme Cricket
- Theme Bull-off

### Zentrale Oberfläche

Die zentrale Oberfläche `AD xConfig` ist wieder vorhanden und Bestandteil des aktuellen Runtime-Modells.
Sie deckt die ausgelieferten Animationen, Komfortfunktionen und Themes inklusive ihrer Einstellungen ab.

## Teilweise übernommen

- Legacy-Konfiguration aus `ad-xconfig:config` wird für die migrierten Features und Themes in das aktuelle Config-Format übernommen.
- Historische Altoptionen ohne Entsprechung im aktuellen Modulbestand werden nicht vollständig gespiegelt.

## Bewusst nicht Teil von v1.0

- alter GitHub-Sync- und Loader-Adminfluss
- historische Cache- und Remote-Ladefunktionen
- alte xConfig-Sonderbereiche, die nicht zu den ausgelieferten Features gehören
- nicht benötigte Vendor-Varianten aus dem Altbestand

## Nicht geplant

- `Deprecated/`-Artefakte ohne Ziel im neuen Runtime-Modell
- ungenutzte Legacy-Dateien ohne aktuelle Funktion
- alte Loader-Varianten, die für das neue Userscript nicht benötigt werden

## Verbleibende Lücken

- Keine bekannte Funktionslücke bei den ausgelieferten 15 Animationen und 5 Themes.
- Bewusst nicht enthaltene Altbestandteile sind dokumentiert und kein Release-Blocker für v1.0.0.
- Der scriptweise Detailabgleich steht in `docs/LEGACY-PARITY-MATRIX.md`.
