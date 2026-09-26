# xConfig Branding

## Sichtbare Marke

- Produktname: **xConfig**
- Descriptor: **für Autodarts**
- Vollständige sichtbare Bezeichnung: **xConfig für Autodarts**
- xConfig ist eine **inoffizielle Erweiterung für Autodarts**. Die Gestaltung darf keine offizielle Zugehörigkeit zu Autodarts suggerieren.

Der technische Projektname `autodarts-xconfig`, Repository-Name, Userscript-Dateinamen, Update-URLs, Storage-Keys und interne `ad-xconfig-*`-IDs bleiben unverändert.

## Kanonische Assets

- `xconfig-logo.svg`: horizontaler Marken-Lockup für README und Dokumentation.
- `xconfig-mark.svg`: quadratische Vollfarb-Marke ohne Wortmarke.

Die SVGs sind die kanonischen Quellen. Rasterdateien werden nur erzeugt, wenn eine konkrete Zielplattform sie benötigt.

## Farben

- Cyan: `#20dfe7`
- Hintergrund: `#0d1117`
- Primärtext / Target-Ring: `#f0f6fc`
- Sekundärtext: `#b8c1cc`

Alle vier Arme des X verwenden in der Vollfarb-Marke dasselbe Cyan. Die Arme sind eigenständige breite Geometrien und keine einfachen diagonalen Linien; ihre Proportionen folgen dem ausgewählten Bullseye-X-Entwurf.

## Menü-Glyph

Das Symbol im Autodarts-Menü ist absichtlich stärker reduziert als die Vollfarb-Marke:

- monochrom über `currentColor`
- kein Glow, keine Verläufe, keine Schatten
- kompaktes X mit zentralem Bullseye und vier reduzierten Target-Segmenten
- keine Abhängigkeit von externen Bilddateien

Die Micro-Glyph wird direkt in `src/features/xconfig-ui/render-controller.js` erzeugt, damit sie Host-Farben, Hover- und Active-Zustände automatisch übernimmt.
