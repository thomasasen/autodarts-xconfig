# xConfig Branding

## Sichtbare Marke

- Produktname: **xConfig**
- Descriptor: **für Autodarts**
- Vollständige sichtbare Bezeichnung: **xConfig für Autodarts**
- xConfig ist eine **inoffizielle Erweiterung für Autodarts**.

Der technische Projektname `autodarts-xconfig`, Repository-Name, Userscript-Dateinamen, Update-URLs, Storage-Keys und interne `ad-xconfig-*`-IDs bleiben unverändert.

## Kanonische Assets

Die SVG-Dateien in diesem Ordner stammen direkt aus dem freigegebenen Vektorlogo-Satz und sind die visuelle Source of Truth. Sie dürfen nicht frei nachgezeichnet oder durch ähnlich aussehende Geometrie ersetzt werden.

- `xconfig-logo.svg`: horizontaler Lockup für dunkle Hintergründe.
- `xconfig-logo-on-light.svg`: horizontaler Lockup für helle Hintergründe.
- `xconfig-mark.svg`: App-/Repo-Mark für dunkle Hintergründe.
- `xconfig-mark-on-light.svg`: App-/Repo-Mark für helle Hintergründe.
- `xconfig-menu-16.svg`: monochrome 16px-Menümarke für dunkle Hintergründe.
- `xconfig-menu-16-on-light.svg`: monochrome 16px-Menümarke für helle Hintergründe.

Die README wählt den passenden horizontalen Lockup abhängig vom Farbschema. Das Autodarts-Menü verwendet exakt die Geometrie von `xconfig-menu-16.svg`; nur die Ausgabefarbe wird zur Laufzeit über `currentColor` an den Host angepasst.

## Farben

- Cyan: `#00F8F8`
- Schwarz: `#000000`
- Weiß: `#FFFFFF`

## Laufzeit-Regel

Die Menü-Glyph bleibt inline in `src/features/xconfig-ui/render-controller.js`, damit kein externer Request und keine zusätzliche Asset-Ladeabhängigkeit entsteht. Ihre Ring-, X-, Bullseye- und Maskengeometrie muss mit dem gelieferten 16px-SVG übereinstimmen.
