# Community-Designs aus Autodarts Layouts

Quelle: [Autodarts-Webinterface-Installation/latest/theme.zip](https://github.com/jumbo1250/Autodarts-Webinterface-Installation/blob/main/latest/theme.zip), Blob `1f816310302980702bec3edcbfa5bce1b4b0304d`.

Übernommen wurden die 78 aktuellen öffentlichen Designs und 34 Surround-Einträge dieses Paketstands. Private beziehungsweise passwortgeschützte Designs, `X_old.*` und `$$customer.css` werden nicht übernommen. Original-CSS wird weder ausgeführt noch als Stylesheet injiziert. Gestaltungseigenschaften werden in die nativen xConfig-Module übersetzt; es handelt sich um angepasste Vorlagen, keine pixelidentischen Kopien.

Die Autorenfreigabe zur Übernahme und Weitergabe wurde vom Auftraggeber in diesem Auftrag ausdrücklich bestätigt. Diese Bestätigung ist keine unabhängig geprüfte Lizenzurkunde und begründet keine darüber hinausgehende Unterlizenz. Urheber- und Markenrechte verbleiben bei den jeweiligen Rechteinhabern. Die MIT-Lizenz des xConfig-Quellcodes stellt keine zusätzliche Lizenz für diese fremden Bildmotive dar.

Jede Vorlage behält ihren ursprünglichen Autor und Quelldateinamen in `src/shared/community-designs.data.json`. Gemeinsame Standardwerte werden dort einmal gespeichert; `community-designs.js` stellt weiterhin die vollständigen nativen Vorlagen bereit. Import und Bildoptimierung erzeugen beide Dateien über `scripts/write-community-designs.mjs`. Die Bilder werden in `provenance.json` mit Quell-URL, Originalprüfsumme, optimierter Prüfsumme und Verarbeitungsschritten dokumentiert. Ein fehlerhafter Adrian-Lewis-Cricket-Verweis wurde auf die vorhandene Datei mit abweichender Großschreibung korrigiert.

## Reproduzierbarer Import

1. Das ZIP des angegebenen Paketstands herunterladen.
2. `node scripts/import-community-designs.mjs <Pfad-zum-theme.zip>` ausführen. Eine andere ZIP-Prüfsumme wird abgelehnt. Downloadfehler werden einzeln protokolliert und führen zu einem Fehlerstatus.
3. Mit Pillow **13.0.0** `python scripts/optimize-community-images.py` ausführen. Seitenverhältnis und Transparenz bleiben erhalten; Hintergründe werden auf höchstens 1920 Pixel Kantenlänge, Surrounds auf 1024 und reine Vorschauen auf 480 begrenzt.
4. `python scripts/generate-theme-library.py` erzeugt daraus die tatsächlich eingebetteten Vorschauen (maximal 256 Pixel) und den Prüfsummenkatalog für Originaldateien. Auch die bisherigen xConfig-Wallpaper werden berücksichtigt.

Die Skripte erzeugen die Community-Definitionen, Browser-Vorschauen und den Bildkatalog. Diese generierten Dateien nicht von Hand bearbeiten. Die vollständigen Dateien bleiben im Repository und werden bei Bedarf aus dessen festem, zur Programmversion gehörendem Release-Tag geladen. Nach Prüfung ihrer SHA-256 und bestätigter Speicherung im Tampermonkey-Speicher werden sie verwendet. Cache-Schlüssel enthalten die Bild-Prüfsumme und sind unabhängig von der Programmversion. Die ursprünglichen Quellserver werden zur Laufzeit nicht benötigt. Vor Veröffentlichung muss der neue Release-Tag sämtliche katalogisierten Dateien bereitstellen; ein älterer Tag enthält neu hinzugefügte Motive noch nicht.
