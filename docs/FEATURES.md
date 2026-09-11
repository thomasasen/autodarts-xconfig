<!-- xconfig-generated:start -->
# Feature-Übersicht

`autodarts-xconfig` bündelt `20` Module in einem Userscript:

- `17` Animationen und Komfortfunktionen
- `3` Themes

Die gesamte Steuerung läuft über **AD xConfig** direkt im Spiel. Alle Kacheln stehen gemeinsam auf einer Seite in den Bereichen **Design**, **Alle Modi**, **X01** und **Cricket / Tactics**. Die schnelle Benutzer-Einführung findest du in der [README](../README.md).

![Aktuelle AD xConfig Übersicht](screenshots/ad-xconfig-overview-v3.png)

## Hinweise zur Konfiguration

- Insgesamt `20` Module: `17` Anzeigen und Komfortfunktionen sowie `3` Designmodule.
- `↺ Zurücksetzen`: Setzt alle Einstellungen vollständig auf Standard zurück, deaktiviert alle Module, schaltet die Diagnose aus und entfernt globales Hintergrundbild sowie Dart-Upload.
- `Empfohlene Standards`: Übernimmt ausgewogene Presets, schaltet alle Module aus und lässt globales Wallpaper sowie Dart-Upload unangetastet.
- `Exportieren` / `Importieren`: Sichert Einstellungen als versioniertes JSON-Backup und übernimmt auch ältere oder teilweise inkompatible Backups fehlertolerant.
- Hintergrundbild: Die Kachel `Hintergrund` verwendet ein gemeinsames Wallpaper oder das Wallpaper der zuletzt angewendeten Vorlage in allen Spielansichten.
- Bildgröße: Für das globale Wallpaper gilt ein empfohlenes Limit von `1,5 MiB`; der separate Dart-Upload wird kompakter gespeichert.

<a id="empfohlene-standards"></a>

## Empfohlene Standards

Die Aktion `Empfohlene Standards` wendet aktuell dieses Profil an:

### Design

**Hintergrund**
- `Aktiv`: Aus
- `Bildanpassung`: Füllen
- `Sichtbarkeit des Hintergrundbilds`: 10 %
- `Durchsichtigkeit der Spielerfelder`: 10 %
- `Diagnose`: Aus

**Schrift & Farben**
- `Aktiv`: Aus
- `Schriftart`: Aldrich
- `Schrift anwenden auf`: scores,throws,names
- `Hintergrund des aktiven Spielers`: 20 %
- `Diagnose`: Aus

### Weitere Module

**Für alle Module**
- `Alle eingeschaltet`: Aus
- `Diagnose`: Aus

**Punkte animiert zählen**
- `Zählweise`: Fließend zählen
- `Zählgeschwindigkeit`: Schnell
- `Bei Änderung aufblitzen`: Aus
- `Aufblitzen`: Nur bei Änderung

**AVG-Trend anzeigen**
- `Animationsdauer`: Lang
- `Pfeilgröße`: Standard

**Triple, Double & Bull hervorheben**
- `Farbstil`: Rot/Blau/Grün
- `Animation`: Stromstoß

**Dartboard-Design**
- `Board-Design`: Winmau Blade 6 TC
- `Anwenden auf`: Alle Match-Boards

**Darts in der Wurfanzeige**
- `Stil`: Eigenes Bild
- `Dart auswählen`: German Gigant
- `Text`: Leer
- `Größe`: Groß
- `Leuchteffekt`: An

**Treffermarkierungen durch Darts ersetzen**
- `Dart-Design`: German Giant
- `Dart-Fluganimation`: An
- `Dart-Größe`: Standard
- `Original-Marker ausblenden`: An
- `Einschlagstil`: Dramatisch
- `Einschlag-Schatten`: An
- `Schatten-Weichzeichnung`: An
- `Nachwippen beim Einschlag`: An
- `Bewegungsunschärfe im Flug`: An
- `Fluggeschwindigkeit`: Standard

**Treffermarkierungen hervorheben**
- `Größe der Treffermarkierung`: Standard
- `Farbe der Treffermarkierung`: Blau
- `Animation`: Größe pulsieren
- `Sichtbarkeit der Treffermarkierung`: 100 %
- `Randfarbe`: Weiß

**Hinweis: Darts entfernen**
- `Bildgröße`: Groß
- `Pulsieren`: An
- `Stärke des Pulsierens`: Standard

**Ton bei Single Bull**
- `Lautstärke`: Standard
- `Mindestabstand zwischen Tönen`: 700 ms
- `Zusätzliche Trefferprüfung`: Aus

**Checkout-Vorschlag gestalten**
- `Darstellung`: Streifen
- `Beschriftung`: CHECKOUT
- `Farbe`: Amber

**Finishbaren Restscore hervorheben**
- `Animation`: Sanft blinken
- `Farbe`: Cyan
- `Stärke`: Standard
- `Finish-Erkennung`: Vorschlag zuerst

**Restscore-Balken**
- `Farben`: Traffic Light
- `Balkengröße`: Breit
- `Animation`: Vorherigen Stand anzeigen

**Überworfen (BUST) hervorheben**

**Checkout-Ziele hervorheben**
- `Animation`: Schnell blinken
- `Art der Hervorhebung`: Fläche + Rahmen
- `Zielauswahl`: Nächstes Feld
- `Farbe`: Violett

**Automatischer Board-Zoom**
- `Zoomstärke`: Mittel
- `Zoom-Geschwindigkeit`: Mittel
- `Checkout-Zoom`: An
- `Zoom auf`: Nur Finish-Feld
- `Auch auf T20-Setup zoomen`: An

**Cricket-Ziele hervorheben**
- `Offene Ziele anzeigen (OPEN)`: Aus
- `Erledigte Ziele anzeigen (DEAD)`: An
- `Andere Felder abdunkeln`: Schraffur
- `Farben`: Standard
- `Stärke`: Standard

**Cricket-Statusanzeigen**
- `Welle durch die Zeile`: An
- `Zielmarke hervorheben`: An
- `Markierungen auffüllen`: An
- `Druck anzeigen (PRESSURE)`: An
- `Punktemöglichkeit anzeigen (SCORING)`: An
- `Erledigte Zeilen abdunkeln (DEAD)`: An
- `Änderungen anzeigen`: An
- `Treffer-Impuls`: An
- `Zugwechsel-Übergang`: An
- `Druckfläche anzeigen (PRESSURE)`: An
- `Farben`: High Contrast
- `Stärke`: Standard

## Design

<a id="theme-global-presets"></a>

### Designvorlagen

- Gilt für: `alle Modi`
- Kurz: Wendet Hintergrundbild, Schrift und Farben gemeinsam an, ohne die Darts in der Wurfanzeige zu verändern.
- Grafisch: Jede Vorschau zeigt das mitgelieferte Hintergrundbild, die zugehörige Schrift und die Farben. Die Aktion aktiviert Hintergrund sowie Schrift & Farben und ersetzt ein eigenes Hintergrundbild.
- Wann sinnvoll? Wenn du einen vollständigen Look mit einem Klick auswählen möchtest.
- `Classic`: Wendet die Vorlage Classic mit einem Klick an.
- `Broadcast`: Wendet die Vorlage Broadcast mit einem Klick an.
- `Darts Arena`: Wendet die Vorlage Darts Arena mit einem Klick an.
- `Crimson Facets`: Wendet die Vorlage Crimson Facets mit einem Klick an.
- `Cyberpunk`: Wendet die Vorlage Cyberpunk mit einem Klick an.
- `Matrix`: Wendet die Vorlage Matrix mit einem Klick an.
- `Fire`: Wendet die Vorlage Fire mit einem Klick an.
- `Ice`: Wendet die Vorlage Ice mit einem Klick an.
- `Aqua Flux`: Wendet die Vorlage Aqua Flux mit einem Klick an.
- `Neon Splash`: Wendet die Vorlage Neon Splash mit einem Klick an.
- `Solar Pulse`: Wendet die Vorlage Solar Pulse mit einem Klick an.
- `British Flag`: Wendet die Vorlage British Flag mit einem Klick an.
- `Deutschland`: Wendet die Vorlage Deutschland mit einem Klick an.
- `Bayern`: Wendet die Vorlage Bayern mit einem Klick an.
- `Spider-Man`: Wendet die Vorlage Spider-Man mit einem Klick an.
- `John Wick`: Wendet die Vorlage John Wick mit einem Klick an.
- `Avengers Endgame`: Wendet die Vorlage Avengers Endgame mit einem Klick an.
- `Gladiator`: Wendet die Vorlage Gladiator mit einem Klick an.
- `Dark Side`: Wendet die Vorlage Dark Side mit einem Klick an.

![Globale Vorlagen](screenshots/templates-global-presets.webp)

<a id="theme-global-background"></a>

### Hintergrund

- Gilt für: `alle Modi`
- Kurz: Steuert ein gemeinsames Hintergrundbild und die Transparenz der Spielerfelder unter /matches.
- Grafisch: Das Wallpaper liegt hinter dem unveränderten Autodarts-Spielaufbau. Bildanpassung, Sichtbarkeit und Durchsichtigkeit der Spielerfelder lassen sich unabhängig von Schrift, Farben und Darts in der Wurfanzeige einstellen.
- Wann sinnvoll? Wenn alle Spielvarianten denselben Hintergrund erhalten sollen.
- `Bildanpassung`: Legt fest, wie ein eigenes Hintergrundbild im Theme platziert wird.
  - `Füllen`: Das Bild wirkt wie ein vollflächiges Wallpaper hinter dem Theme. Der komplette Bereich ist gefüllt, aber Motivteile am Rand können aus dem sichtbaren Ausschnitt herausfallen.
  - `Einpassen`: Das Motiv bleibt vollständig erhalten und wird vollständig in den verfügbaren Raum eingepasst. Dadurch geht nichts vom Bild verloren, aber je nach Format bleiben seitlich oder oben und unten sichtbare Theme-Flächen frei.
  - `Strecken`: Das Motiv wird unabhängig vom Originalformat auf die komplette Theme-Fläche gezogen. So ist jeder Bereich bedeckt, aber die Bildproportionen können sichtbar auseinandergezogen oder zusammengedrückt wirken.
  - `Zentriert`: Das Motiv erscheint wie ein mittig aufgelegtes Poster ohne automatische Skalierung. Große leere Ränder des Themes bleiben stehen, wenn das Bild kleiner als der verfügbare Bereich ist.
  - `Kacheln`: Das Motiv wird wie eine Kachel über die Theme-Fläche wiederholt. Statt eines einzelnen großen Hintergrundbilds entsteht ein sich wiederholendes Muster über den gesamten Bereich.
- `Sichtbarkeit des Hintergrundbilds`: Regelt, wie stark das Hintergrundbild sichtbar bleibt.
  - `100 %`: Das Hintergrundbild wirkt nahezu ungefiltert und sehr präsent. Farben und Kanten bleiben deutlich sichtbar, sodass das Motiv den Look des Themes stark mitbestimmt.
  - `85 %`: Das Motiv bleibt klar sichtbar und prägt die Fläche stark, bekommt aber schon eine leichte dunkle Dämpfung. Dadurch bleibt der Bildcharakter erhalten, ohne ganz so hart in den Vordergrund zu drängen.
  - `70 %`: Das Hintergrundmotiv bleibt deutlich sichtbar, wirkt aber bereits eingebettet statt aufgeklebt. Farben und Formen sind noch erkennbar, während das Theme die Fläche ruhiger und geschlossener erscheinen lässt.
  - `55 %`: Das Hintergrundbild ist weiterhin erkennbar, verliert aber deutlich an Dominanz. Diese Stufe ist ein Mittelweg, bei dem Motiv und Lesbarkeit ungefähr gleich wichtig bleiben.
  - `40 %`: Das Bild ist noch klar als Motiv erkennbar, wird aber bereits deutlich von der dunklen Theme-Schicht zurückgenommen. Es wirkt mehr wie Atmosphäre im Hintergrund als wie ein aktives Titelmotiv.
  - `30 %`: Diese Stufe eignet sich für bereits dunkle, ruhige Motive: Das Wallpaper bleibt erkennbar, konkurriert aber nicht mit den Spielinformationen.
  - `25 %`: Das Motiv bleibt nur noch als ruhige Bildstimmung im Hintergrund erhalten. Farben und Strukturen tragen Atmosphäre bei, ohne Spielerfelder, Texte oder Karten optisch zu überholen.
  - `20 %`: Diese Stufe beruhigt strukturierte oder kontrastreiche Wallpaper deutlich und schützt die Lesbarkeit der darüberliegenden Spieloberfläche.
  - `15 %`: Diese Stufe ist für helle, detailreiche oder plakative Motive gedacht und macht sie zu einer sehr zurückhaltenden Kulisse.
  - `10 %`: Das Hintergrundmotiv ist fast nur noch als Schatten, Form oder grobe Farbstruktur wahrnehmbar. Diese Stufe priorisiert eine ruhige, sehr lesbare Oberfläche gegenüber sichtbaren Bilddetails.
- `Durchsichtigkeit der Spielerfelder`: Passt die Transparenz der Spielerfelder gegenüber dem Hintergrund an.
  - `0 %`: Die Spielerfelder erscheinen nahezu opak und schirmen das Hintergrundbild stark ab. Das Layout wirkt dadurch ruhig, dicht und klar vom Hintergrund getrennt.
  - `5 %`: Die Karten wirken weiterhin fast deckend, zeigen aber schon eine leichte Durchlässigkeit. Das ist für Nutzer gedacht, die kaum Transparenz möchten, aber etwas mehr Tiefe als bei komplett geschlossenen Flächen.
  - `10 %`: Die Karten behalten eine stabile Lesbarkeit, bekommen aber eine leichte Glasscheiben-Wirkung. Hintergrundfarben und Motive bleiben nur dezent hinter den Spielerflächen sichtbar.
  - `15 %`: Die Karten wirken bereits spürbar transparenter und vermitteln mehr Tiefe zwischen Oberfläche und Hintergrund. Das Motiv hinter den Spielerfeldern wird deutlicher wahrnehmbar, ohne die Lesbarkeit stark zu gefährden.
  - `30 %`: Die Spielerfelder erscheinen deutlich luftiger und geben dem Hintergrundbild sichtbar mehr Raum. Diese Stufe verschiebt das Layout klar in Richtung transparentes Overlay statt geschlossener Kartenfläche.
  - `45 %`: Die Karten verlieren einen großen Teil ihrer optischen Dichte und lassen das Motiv dahinter klar durchkommen. Das Layout wirkt dadurch offener, aber auch stärker vom Hintergrundbild beeinflusst.
  - `60 %`: Die Karten erscheinen fast wie halbtransparente Glasflächen über dem Hintergrund. Das Motiv dahinter bleibt stark sichtbar und gestaltet die Oberfläche sehr aktiv mit.
- `Hintergrundbild hochladen`: Speichert ein globales Hintergrundbild bis 1,5 MiB.
- `Hintergrundbild entfernen`: Entfernt das globale Hintergrundbild.
- `Diagnose`: Aktiviert zusätzliche Debug-Ausgaben für die Fehlersuche.

![Globaler Hintergrund](screenshots/templates-global-presets.webp)

<a id="template-global-typography"></a>

### Schrift & Farben

- Gilt für: `alle Modi`
- Kurz: Wendet Schrift und Farben auf ausgewählte Bereiche aller Spielansichten an und kann den Hintergrund des aktiven Spielers leicht einfärben.
- Grafisch: Schriftart und Textfarben ändern nur die ausgewählten stabilen Textbereiche; das Autodarts-Layout bleibt bestehen.
- Wann sinnvoll? Wenn Scores, Würfe oder Namen spielübergreifend einheitlich lesbar sein sollen.
- `Schriftart`: Wählt eine kuratierte Schrift für unterstützte Bereiche.
  - `Standard (deaktiviert)`: Belässt die unterstützten Bereiche bei einer normalen Systemschrift ohne Remote-Download.
  - `Aldrich`: Setzt die unterstützten Bereiche auf Aldrich.
  - `Allerta`: Setzt die unterstützten Bereiche auf Allerta.
  - `Alumni Sans`: Setzt die unterstützten Bereiche auf Alumni Sans.
  - `Alumni Sans Inline One`: Setzt die unterstützten Bereiche auf Alumni Sans Inline One.
  - `Anton`: Setzt die unterstützten Bereiche auf Anton.
  - `Anybody`: Setzt die unterstützten Bereiche auf Anybody.
  - `Archivo Black`: Setzt die unterstützten Bereiche auf Archivo Black.
  - `Armata`: Setzt die unterstützten Bereiche auf Armata.
  - `Audiowide`: Setzt die unterstützten Bereiche auf Audiowide.
  - `Averia Libre`: Setzt die unterstützten Bereiche auf Averia Libre.
  - `Averia Sans Libre`: Setzt die unterstützten Bereiche auf Averia Sans Libre.
  - `Bai Jamjuree`: Setzt die unterstützten Bereiche auf Bai Jamjuree.
  - `Big Shoulders Stencil`: Setzt die unterstützten Bereiche auf Big Shoulders Stencil.
  - `Black Ops One`: Setzt die unterstützten Bereiche auf Black Ops One.
  - `Bruno Ace`: Setzt die unterstützten Bereiche auf Bruno Ace.
  - `Bungee`: Setzt die unterstützten Bereiche auf Bungee.
  - `Bungee Inline`: Setzt die unterstützten Bereiche auf Bungee Inline.
  - `Bungee Shade`: Setzt die unterstützten Bereiche auf Bungee Shade.
  - `Cairo Play`: Setzt die unterstützten Bereiche auf Cairo Play.
  - `Caramel`: Setzt die unterstützten Bereiche auf Caramel.
  - `Caveat`: Setzt die unterstützten Bereiche auf Caveat.
  - `Caveat Brush`: Setzt die unterstützten Bereiche auf Caveat Brush.
  - `Chakra Petch`: Setzt die unterstützten Bereiche auf Chakra Petch.
  - `Chilanka`: Setzt die unterstützten Bereiche auf Chilanka.
  - `Courier Prime`: Setzt die unterstützten Bereiche auf Courier Prime.
  - `Cute Font`: Setzt die unterstützten Bereiche auf Cute Font.
  - `Dangrek`: Setzt die unterstützten Bereiche auf Dangrek.
  - `Days One`: Setzt die unterstützten Bereiche auf Days One.
  - `Ewert`: Setzt die unterstützten Bereiche auf Ewert.
  - `Faster One`: Setzt die unterstützten Bereiche auf Faster One.
  - `Finger Paint`: Setzt die unterstützten Bereiche auf Finger Paint.
  - `Foldit`: Setzt die unterstützten Bereiche auf Foldit.
  - `Fragment Mono`: Setzt die unterstützten Bereiche auf Fragment Mono.
  - `Fredericka the Great`: Setzt die unterstützten Bereiche auf Fredericka the Great.
  - `Frijole`: Setzt die unterstützten Bereiche auf Frijole.
  - `Fugaz One`: Setzt die unterstützten Bereiche auf Fugaz One.
  - `Goldman`: Setzt die unterstützten Bereiche auf Goldman.
  - `Inconsolata`: Setzt die unterstützten Bereiche auf Inconsolata.
  - `Indie Flower`: Setzt die unterstützten Bereiche auf Indie Flower.
  - `Inria Sans`: Setzt die unterstützten Bereiche auf Inria Sans.
  - `Jersey 15`: Setzt die unterstützten Bereiche auf Jersey 15.
  - `Keania One`: Setzt die unterstützten Bereiche auf Keania One.
  - `Permanent Marker`: Setzt die unterstützten Bereiche auf Permanent Marker.
  - `Plaster`: Setzt die unterstützten Bereiche auf Plaster.
  - `Saira Stencil One`: Setzt die unterstützten Bereiche auf Saira Stencil One.
  - `Share Tech Mono`: Setzt die unterstützten Bereiche auf Share Tech Mono.
  - `Stardos Stencil`: Setzt die unterstützten Bereiche auf Stardos Stencil.
  - `Wallpoet`: Setzt die unterstützten Bereiche auf Wallpoet.
  - `Zen Dots`: Setzt die unterstützten Bereiche auf Zen Dots.
  - `Zilla Slab Highlight`: Setzt die unterstützten Bereiche auf Zilla Slab Highlight.
- `Schrift anwenden auf`: Legt fest, welche stabilen Bereiche die Schrift übernehmen.
  - `Scores`: Gilt für stabile Score- und Punkteanzeigen.
  - `Würfe`: Greift in der Wurfanzeige und bei stabilen Turn-Karten.
  - `Namen`: Gilt für Spielernamen in den Theme-Karten.
- `Farbe des aktiven Spielers`: Setzt die Akzentfarbe für aktive oder gewinnende Spieler.
- `Score-Farbe`: Steuert normale Hauptzahlen und Turn-Punkte.
- `Namen und Statistiken`: Setzt Namen und Meta-Texte auf eine gemeinsame Sekundärfarbe.
- `Wurf- und Checkout-Hinweise`: Färbt Wurf-, Suggestion- und Checkout-Texte separat ein.
- `Hintergrund des aktiven Spielers`: Regelt, wie stark die aktive Farbe den Hintergrund der Spielerkarte einfärbt.
  - `Aus`: Die Aktivkarten-Tönung bleibt komplett deaktiviert.
  - `10 %`: Die aktive Spielerfarbe färbt die Kartenfläche leicht ein.
  - `15 %`: Die aktive Spielerfarbe schimmert sichtbar, aber weiterhin ausgewogen durch die aktive Kartenfläche.
  - `20 %`: Die Kartenfläche übernimmt die aktive Spielerfarbe bereits deutlich.
  - `25 %`: Die Aktivkarten-Tönung wird stark sichtbar und prägt den Kartenhintergrund klar.
  - `30 %`: Die Aktivkarten-Tönung wird maximal sichtbar und prägt den Kartenhintergrund stark.
- `Diagnose`: Aktiviert zusätzliche Debug-Ausgaben für die Fehlersuche.

![Globale Schrift](screenshots/template-theme-global-typography-xConfig.png)

## Alle Modi

<a id="bot-board-style"></a>

### Dartboard-Design

- Gilt für: `alle Modi`
- Kurz: Die native Board-Fläche wird durch ein ausgewähltes, lokal eingebettetes Board-Design ersetzt.
- Grafisch: Das ausgewählte Design liegt über der nativen Board-Grafik. Treffer-Marker, Checkout-Ziele und Cricket-Hervorhebungen bleiben darüber sichtbar. Im Bot-Modus erscheint das Design nur, wenn der aktive Spieler zuverlässig als Bot erkannt wird.
- Wann sinnvoll? Wenn Bot-Partien ein eigenes Board erhalten sollen oder du dasselbe Board-Design in allen unterstützten Matches verwenden möchtest.
- `Board-Design`: Wählt eines von zehn lokal eingebetteten Board-Designs.
  - `Winmau Blade 6 TC`: Verwendet Winmau Blade 6 TC als Board-Grafik.
  - `Winmau Blade X`: Verwendet Winmau Blade X als Board-Grafik.
  - `Winmau Blade 360 TC`: Verwendet Winmau Blade 360 TC als Board-Grafik.
  - `Target Tor`: Verwendet Target Tor als Board-Grafik.
  - `Target Aspar`: Verwendet Target Aspar als Board-Grafik.
  - `Unicorn Eclipse Pro 2`: Verwendet Unicorn Eclipse Pro 2 als Board-Grafik.
  - `Mission Samurai 4`: Verwendet Mission Samurai 4 als Board-Grafik.
  - `Bull’s NL Advantage 701`: Verwendet Bull’s NL Advantage 701 als Board-Grafik.
  - `Shot Bandit`: Verwendet Shot Bandit als Board-Grafik.
  - `One80 G4 Surge`: Verwendet One80 G4 Surge als Board-Grafik.
- `Anwenden auf`: Begrenzt das Design auf Bot-Züge oder aktiviert es global für Match-Boards.
  - `Nur bei Bot-Zügen`: Zeigt das Design nur bei eindeutig erkannten Bot-Zügen.
  - `Alle Match-Boards`: Verwendet das Design global auf unterstützten Match-Boards.
- `Diagnose`: Aktiviert zusätzliche Debug-Ausgaben für die Fehlersuche.

<a id="turn-dart-display"></a>

### Darts in der Wurfanzeige

- Gilt für: `alle Modi`
- Kurz: Ersetzt die Darts in der Wurfanzeige durch Farbe, Verlauf, Text, ein vorbereitetes Dart-Bild oder einen eigenen Upload.
- Grafisch: Das Modul arbeitet unabhängig von Hintergrund, Schrift und Farben und verändert keine Treffermarkierungen am Board.
- Wann sinnvoll? Wenn die Darts im Wurffeld besser zum eigenen Setup passen sollen.
- `Stil`: Ändert die Dart-Grafiken im Wurffeld.
  - `Original`: Belässt die Darts in der Wurfanzeige unverändert.
  - `Farbe`: Nutzt eine einfarbige Dart-Grafik.
  - `Verlauf`: Nutzt eine Dart-Grafik mit Verlauf.
  - `Dart-Bild`: Nutzt das ausgewählte vorbereitete Dart-Bild.
  - `Eigenes Bild`: Nutzt ein eigenes gespeichertes Dart-Bild.
- `Dart auswählen`: Wählt ein vorbereitetes Bild für die Darts in der Wurfanzeige aus.
  - `German Gigant`: Verwendet den German-Gigant-Dart als Wurffeld-Dart.
  - `Blue Lightning`: Verwendet Blue Lightning als Wurffeld-Dart.
  - `Copper Grid`: Verwendet Copper Grid als Wurffeld-Dart.
  - `Snakebite Purple`: Verwendet Snakebite Purple als Wurffeld-Dart.
  - `Iceman Blue`: Verwendet Iceman Blue als Wurffeld-Dart.
  - `Bullet Red`: Verwendet Bullet Red als Wurffeld-Dart.
  - `Carbon Gold`: Verwendet Carbon Gold als Wurffeld-Dart.
  - `Vecta Gold`: Verwendet Vecta Gold als Wurffeld-Dart.
  - `GVV Blue`: Verwendet GVV Blue als Wurffeld-Dart.
  - `Cool Hand Luke`: Verwendet Cool Hand Luke als Wurffeld-Dart.
  - `Target Neon`: Verwendet Target Neon als Wurffeld-Dart.
- `Dart-Text`: Zeigt Wurftext mit Nummernplatzhalter.
- `Dart-Farbe`: Setzt die Hauptfarbe der Darts in der Wurfanzeige.
- `Verlaufsfarbe`: Setzt die zweite Verlaufsfarbe.
- `Dart-Größe`: Regelt die Größe der Darts in der Wurfanzeige.
  - `Kompakt`: Kompakte Darts in der Wurfanzeige.
  - `Standard`: Standardgröße für die Darts in der Wurfanzeige.
  - `Groß`: Große Darts in der Wurfanzeige.
- `Leuchteffekt`: Schaltet den Leuchteffekt ein oder aus.
- `Dart-Bild hochladen`: Speichert ein eigenes Dart-Bild.
- `Dart-Bild entfernen`: Entfernt das eigene Dart-Bild.
- `Diagnose`: Aktiviert zusätzliche Debug-Ausgaben für die Fehlersuche.

![Darts in der Wurfanzeige mit Verlauf](screenshots/template-global-turn-darts-gradient.png)

<a id="animation-autodarts-animate-avg-trend-arrow"></a>
<a id="animation-autodarts-animate-average-trend-arrow"></a>

### AVG-Trend anzeigen

- Gilt für: `alle Modi`
- Kurz: Ein kleiner Pfeil direkt am AVG zeigt kurz die Trendrichtung.
- Grafisch: Bei einer AVG-Änderung erscheint neben dem Wert kurz ein grüner Aufwärtspfeil oder roter Abwärtspfeil und verschwindet nach der eingestellten Zeit wieder.
- Wann sinnvoll? Wenn du Formwechsel während eines Legs schnell am AVG erkennen möchtest.
- Trendberechnung: Vergleich von `AVG_aktuell` mit `AVG_vorher` aus der AutoDarts-Anzeige.
- Bei einer Anzeige wie `55.0 / 55.0` wird der linke Wert vor dem `/` verwendet.
- Formel: `AVG_Delta = AVG_aktuell - AVG_vorher`; `> 0` = Aufwärtspfeil, `< 0` = Abwärtspfeil, `= 0` = keine neue Pfeilrichtung.
- Beispiel: `ø 52.50 / 51.80` -> `ø 53.10 / 52.00` ergibt `+0.60`, also Pfeil nach oben.
- Einordnung: X01 nutzt den 3-Dart-Average `((Punkte / Darts) * 3)`, Cricket nutzt `MPR = Marks / Runden`.
- `Animationsdauer`: Legt fest, wie lange der Pfeil sichtbar bleibt.
  - `Kurz`: Diese Stufe hält die Bounce-Animation sehr kurz. Der Pfeil markiert die AVG-Änderung nur als schnellen Impuls und verschwindet fast sofort wieder.
  - `Standard`: Diese Stufe bietet einen guten Mittelweg: Der Pfeil ist klar wahrnehmbar, verschwindet aber noch zügig genug, um die AVG-Anzeige nicht zu blockieren.
  - `Lang`: Diese Stufe verlängert die sichtbare Bounce-Phase deutlich. Dadurch bleibt die Trendrichtung länger lesbar und ist auch in hektischeren Spielsituationen leichter wahrzunehmen.
- `Pfeilgröße`: Passt Größe und Abstand des Pfeils an.
  - `Klein`: Diese Stufe hält den Pfeil klein und schmal. Die AVG-Anzeige bleibt optisch führend, während der Trend nur als diskreter Zusatz erscheint.
  - `Standard`: Diese Größe bietet einen guten Mittelweg zwischen Lesbarkeit und Zurückhaltung. Der Trend ist gut erkennbar, ohne die AVG-Zahl optisch zu überholen.
  - `Groß`: Diese Stufe macht den Trendpfeil deutlich größer und gibt ihm etwas mehr Abstand zur AVG-Zahl. Das verbessert die Erkennbarkeit besonders auf größeren Displays oder aus größerer Distanz.
- `Diagnose`: Aktiviert zusätzliche Debug-Ausgaben für die Fehlersuche.

![AVG-Trend anzeigen](screenshots/animation-average-trend-arrow.png)

<a id="animation-autodarts-animate-special-hit-highlights"></a>
<a id="animation-autodarts-animate-triple-double-bull-hits"></a>

### Triple, Double & Bull hervorheben

- Gilt für: `alle Modi`
- Kurz: Treffer wie `T20`, `D16`, `25` und `BULL` bekommen farbige Flächen und einen deutlich sichtbaren Trefferimpuls.
- Grafisch: Die betroffenen Wurffelder erhalten dunkle, kontrastreiche Flächen mit animierten Verläufen, Pattern-Layern, leuchtenden Rändern und textbezogenen Trefferimpulsen. Einige Farbwelten gehen eher in Cyberpunk-, Hazard- oder Vintage-Richtung. `25` (Single Bull) bleibt ruhiger, `BULL` (Bullseye) erscheint heller und markanter. Nur das frisch erkannte Feld bekommt den starken einmaligen Burst.
- Wann sinnvoll? Wenn wichtige Treffer auch in schnellen Legs sofort lesbar, deutlich stylischer und visuell markanter wirken sollen, ohne weitere Einzelschalter zu pflegen.
- `Farbstil`: Wählt die Farben für Fläche, Leuchten und Rand der Treffer-Hervorhebung.
  - `Rot/Blau/Grün`: Verwendet feste Signalfarben pro Trefferart: `Triple = rot`, `Double = blau`, `Bull = grün`.
  - `Solar Flare`: Solar Flare taucht das Trefferfeld in Orange-, Rot- und Goldtöne mit sichtbaren Flame-Stripes. Rand, Verlauf und Text wirken wie aufgeheizt und präsent.
  - `Ice Reactor`: Ice Reactor baut einen kühlen Cyan-Blau-Look mit Grid-Muster und technischem Randlicht auf. Das Ergebnis wirkt präzise, futuristisch und deutlich weniger weich als warme Themes.
  - `Venom Lime`: Venom Lime mischt neonige Cyberpunk-Farben mit Hazard-Stripes und hartem Glow. Verlauf, Rand und Text springen damit am stärksten ins Auge.
  - `Crimson Velocity`: Crimson Velocity kombiniert schnelle Rottöne mit Stahlakzenten, Scanlines und scharfem Randlicht. Das Ergebnis wirkt wie ein Performance- oder Mecha-Look.
  - `Polar Mint`: Polar Mint mischt Mint, Aqua und Türkis mit leichter Stripe-Struktur zu einer frischen Trefferwelt. Der Look bleibt deutlich, aber ruhiger als die aggressiveren Varianten.
  - `Midnight Gold`: Midnight Gold legt Gold, Amber und Elfenbein über eine dunkle Vintage-Basis mit vertikalen Deco-Streifen. Das Trefferfeld wirkt dadurch hochwertig, warm und sehr gut lesbar.

**Vorschau Farbstile**

Die Farbwelten sind hier bewusst als kompakte Standbilder eingebunden, damit Kontrast, Pattern und Beschriftung schnell vergleichbar bleiben.
Der Farbstil `Rot/Blau/Grün` nutzt feste Trefferfarben und hat deshalb keine eigene Preset-Galerie.

|  |  |
| --- | --- |
| `Solar Flare` | `Ice Reactor` |
| ![Farbstil Solar Flare](screenshots/animation-triple-double-bull-hits-color-solar-flare-readme.png) | ![Farbstil Ice Reactor](screenshots/animation-triple-double-bull-hits-color-ice-reactor-readme.png) |
| `Venom Lime` | `Crimson Velocity` |
| ![Farbstil Venom Lime](screenshots/animation-triple-double-bull-hits-color-venom-lime-readme.png) | ![Farbstil Crimson Velocity](screenshots/animation-triple-double-bull-hits-color-crimson-velocity-readme.png) |
| `Polar Mint` | `Midnight Gold` |
| ![Farbstil Polar Mint](screenshots/animation-triple-double-bull-hits-color-polar-mint-readme.png) | ![Farbstil Midnight Gold](screenshots/animation-triple-double-bull-hits-color-midnight-gold-readme.png) |

- `Animation`: Wählt die kurze Animation für das frisch erkannte Trefferfeld.
  - `Aufspringen`: Kurzes Aufspringen mit starkem Zahlenfokus.
  - `Seitlich wackeln`: Kurzes seitliches Wackeln ohne Dauerbewegung.
  - `Aufleuchten`: Einmaliges Aufleuchten ohne Seitenbewegung oder Daueranimation.
  - `Drehen`: Kurze räumliche Drehung des Trefferfelds.
  - `Lichtlauf`: Ein einmaliger Lichtzug läuft über das Trefferfeld und betont den Rand ohne dauerhafte Bewegung.
  - `Wellenring`: Der Wellenring inszeniert den Treffer wie eine kurze Druckwelle mit stärkerem Ringimpuls und sichtbarem Textschub.
  - `Stromstoß`: Der Stromstoß kombiniert einen kompakten elektrischen Impuls mit leichter Seitenbewegung auf Feld, Score und Segment. Die Wirkung ist kräftig und kurz.

**Animationsstile**

`Aufspringen`, `Seitlich wackeln`, `Aufleuchten`, `Drehen`, `Lichtlauf`, `Wellenring` und `Stromstoß` werden jeweils einmal pro neuem Treffer abgespielt. Alte Presets mit ähnlicher Wirkung werden beim Laden auf diese Stile übertragen.

- `Diagnose`: Aktiviert zusätzliche Debug-Ausgaben für die Fehlersuche.

<a id="animation-autodarts-animate-dartboard-marker-highlight"></a>
<a id="animation-autodarts-animate-dart-marker-emphasis"></a>

### Treffermarkierungen hervorheben

- Gilt für: `alle Modi`
- Kurz: Treffer-Marker auf dem virtuellen Board werden deutlicher sichtbar.
- Grafisch: Die bestehenden Treffermarkierungen werden größer, farbiger und auf Wunsch mit Pulsieren, Leuchten oder einem Rand versehen. Das Modul ersetzt sie nicht, sondern betont sie.
- Wann sinnvoll? Wenn die Standardmarker zu klein oder zu unauffällig sind.
- `Größe der Treffermarkierung`: Vergrößert oder verkleinert die Marker.
  - `Klein`: Diese Stufe lässt die Marker nur leicht anwachsen und bleibt nah an der ursprünglichen Geometrie des Boards. Die Treffer werden klarer, aber nicht großflächig.
  - `Standard`: Diese Einstellung liefert den Standardwert für die Markergröße. Treffer springen besser ins Auge, ohne die Board-Geometrie optisch zu überladen.
  - `Groß`: Diese Stufe vergrößert die Marker am stärksten. Treffer dominieren dadurch den getroffenen Bereich sichtbarer und bleiben besonders auf größeren oder weiter entfernten Displays erkennbar.
- `Farbe der Treffermarkierung`: Wählt die Hauptfarbe des Markers.
  - `Blau`: Diese Variante färbt die Marker in ein kräftiges Blau und erzeugt damit eine saubere, technische Hervorhebung. Sie wirkt deutlich sichtbar, ohne die Warnwirkung von Rot oder Gelb zu nutzen.
  - `Grün`: Diese Palette färbt die Marker in ein kräftiges Grün. Dadurch wirken Treffer klar bestätigt und bleiben auf dunklen Board-Flächen sehr gut erkennbar.
  - `Rot`: Diese Farbe färbt die Treffer in ein helles Rot und erzeugt damit die auffälligste Alarmwirkung unter den Markerfarben. Das ist besonders plakativ, kann aber bewusst aggressiver wirken.
  - `Gelb`: Diese Variante färbt die Marker in ein kräftiges Gelb. Dadurch wirken Treffer sehr hell und aufmerksamkeitsstark, fast wie kleine Signalpunkte auf dem Board.
  - `Weiß`: Diese Palette setzt auf ein neutrales Weiß für die Markerbetonung. Der Effekt wirkt dadurch sehr klar und universell, ohne die Farbwirkung des restlichen Setups zu beeinflussen.
- `Animation`: Schaltet zwischen Leuchten, Pulsieren oder keiner Zusatzanimation um.
  - `Sanft leuchten`: Diese Variante verstärkt die Treffermarkierungen durch ein an- und abschwellendes Leuchten. Der Trefferpunkt bleibt stabil und wirkt über den Lichtschein präsenter.
  - `Größe pulsieren`: Diese Variante lässt die Marker zyklisch wachsen und wieder zurückfallen. Dadurch bekommen Treffer eine deutlichere Bewegungswirkung als beim reinen Leuchten.
  - `Kein Effekt`: Mit dieser Einstellung bleibt nur die statische Hervorhebung aus Farbe, Größe und optionalem Rand erhalten. Der Treffer wirkt klarer, aber ohne jede Zusatzbewegung.
- `Sichtbarkeit der Treffermarkierung`: Regelt die Deckkraft der Marker.
  - `65 %`: Diese Stufe reduziert die Deckkraft der betonten Marker spürbar. Treffer bleiben sichtbar hervorgehoben, wirken aber weniger flächig und dominierend.
  - `85 %`: Diese Einstellung liefert den Standardwert für die Marker-Deckkraft. Treffer werden deutlich betont, ohne die Boardfläche komplett zu überdecken.
  - `100 %`: Diese Stufe zeichnet die Marker mit voller Deckkraft. Dadurch springen Treffer maximal ins Auge und setzen sich am härtesten vom Board-Hintergrund ab.
- `Randfarbe`: Fügt optional einen hellen oder dunklen Rand hinzu.
  - `Aus`: Mit dieser Option bleibt die Markerbetonung auf Farbe, Größe und Animation beschränkt. Es wird keine zusätzliche Kontur zur Trennung vom Hintergrund gesetzt.
  - `Weiß`: Diese Variante ergänzt einen weißen Rand um die Treffermarkierung. Dadurch bleibt der Treffer auch auf dunklen oder farbstarken Hintergründen besser abgegrenzt.
  - `Schwarz`: Diese Option ergänzt eine schwarze Kontur und verbessert die Trennung auf helleren oder stark leuchtenden Segmentflächen. Der Marker bekommt dadurch einen härteren, grafischeren Rand.
- `Diagnose`: Aktiviert zusätzliche Debug-Ausgaben für die Fehlersuche.

![Treffermarkierungen hervorheben](screenshots/animation-dart-marker-emphasis.gif)

<a id="animation-autodarts-animate-dart-marker-replacer"></a>
<a id="animation-autodarts-animate-dart-marker-darts"></a>

### Treffermarkierungen durch Darts ersetzen

- Gilt für: `alle Modi`
- Kurz: Standardmarker können auf dem virtuellen Board durch kleine Dart-Grafiken ersetzt werden. Im Live-Modus pausiert das Modul automatisch.
- Grafisch: Statt des normalen Markers liegt ein Dart-Bild im getroffenen Segment. Auf Wunsch fliegt der Dart sichtbar ein, bevor er an seiner Zielposition landet.
- Wann sinnvoll? Wenn du Treffer auf dem virtuellen Board persönlicher oder realistischer darstellen möchtest.
- Auf dem virtuellen Board bleibt das Modul aktiv. Im Live-Modus pausiert es automatisch, damit dort keine zusätzlichen Dart-Overlays erscheinen.
- Leistungsintensive Effekte können auf schwächeren Geräten zu Rucklern oder weniger flüssigen Animationen führen.
- `Dart-Demo`: Startet eine direkte Vorschau mit dem aktuell konfigurierten Dart-Design.
- `Dart-Design`: Wählt das Bilddesign der eingeblendeten Darts.
  - `AI Replicant`: Dieses Motiv nutzt einen futuristischen Flight mit technisch anmutender Gestaltung. Der Dart wirkt dadurch moderner, kühler und stärker wie ein Sci-Fi-Design als die schlichten Farbvarianten.
  - `Bullet`: Diese Variante setzt auf einen kompakten, metallischen Look mit Bullet-Anmutung. Dadurch wirkt der Dart besonders direkt, schwerer und weniger verspielt als die farbigen Flight-Designs.
  - `German Giant`: Dieses Motiv ist an einen German-Giant-Stil angelehnt und wirkt wie ein konkretes Spielerdesign. Der Dart bleibt sportlich, präsent und stärker charakterbezogen als die neutralen Varianten.
  - `Mandalorian`: Diese Variante nutzt ein Mandalorian-inspiriertes Motiv auf dem Flight. Dadurch bekommt der Dart einen klar thematischen Sci-Fi-Charakter und fällt stärker als Designobjekt auf.
  - `Nuke`: Dieses Design setzt auf ein auffälliges Nuke-Motiv mit warnender, energiegeladener Wirkung. Der Dart wirkt dadurch besonders plakativ und deutlich aggressiver als neutrale Varianten.
  - `Phil Taylor`: Diese Variante ist an einen Phil-Taylor-Stil angelehnt und wirkt wie ein traditionelleres Spielerdesign. Der Dart bleibt sportlich, klar und weniger verspielt als die auffälligeren Motiv-Flights.
  - `Snakebite`: Dieses Motiv ist an einen Snakebite-Stil angelehnt und setzt auf eine markante, lebendige Flight-Gestaltung. Dadurch wirkt der Dart charakterstark und klar weniger neutral.
  - `Standard`: Diese Variante nutzt einen klassischen Standard-Look ohne starkes Sondermotiv. Der Dart wirkt dadurch vertraut, ruhig und als neutraler Ersatzmarker gut lesbar.
  - `Standard Yellow`: Diese Variante kombiniert den klassischen Standard-Dart mit einem gelben Flight. Dadurch bleibt das Motiv ruhig, hebt sich aber heller und wärmer vom Board ab.
  - `Standard Yellow 2`: Diese zweite gelbe Standard-Variante bleibt nahe am klassischen Dart-Look, variiert aber die gelbe Flight-Gestaltung. Sie wirkt ähnlich ruhig wie `Standard Yellow`, aber etwas eigenständiger.
  - `Ultramarine`: Diese Variante nutzt einen kräftigen Ultramarin-Ton und wirkt dadurch tiefer, kühler und markanter als die einfache blaue Variante. Der Dart bleibt klar lesbar und farblich fokussiert.
  - `Autodarts`: Dieses Motiv zeigt einen silbernen Dart mit einem weichen violett-blauen Verlaufsflight. Der Look wirkt modern, leicht futuristisch und hebt sich klar von den einfarbigen Varianten ab.
  - `Black Blue`: Dieses Motiv kombiniert einen dunklen Flight mit prägnanten blauen Linien. Dadurch wirkt der Dart besonders technisch, modern und kontrastreich.
  - `Black Green`: Dieses Motiv hält den Dart insgesamt dunkel und setzt grüne Linien oder Akzente auf dem Flight. Dadurch entsteht ein sportlicher, kontrastreicher Look mit klarem Grünfokus.
  - `Black Red`: Dieses Motiv nutzt einen sehr dunklen Flight mit roten Akzentlinien. Das erzeugt den schärfsten und offensivsten Look unter den schwarzen Designs.
  - `Blue`: Diese Variante setzt auf einen klar blau gefärbten Flight ohne Sondermuster. Der Dart wirkt dadurch ruhig, sauber und eindeutig farbcodiert.
  - `Camouflage`: Dieses Motiv setzt auf ein klassisches Tarnmuster in Grün-, Braun- und Beigetönen. Der Dart wirkt dadurch rustikaler und charaktervoller als die glatten Farbvarianten.
  - `Green`: Diese Variante zeigt einen klar grün gefärbten Flight ohne zusätzliche Muster. Der Look bleibt schlicht, sportlich und farblich sofort lesbar.
  - `Pride`: Dieses Motiv nutzt einen sichtbaren Regenbogenverlauf über den Flight-Flächen. Der Dart wirkt dadurch besonders farbig, lebendig und unverwechselbar.
  - `Red`: Diese Variante setzt auf einen klar roten Flight ohne Zusatzmuster. Der Dart wirkt dadurch sofort energisch und fällt als warmer Akzent deutlich auf.
  - `White`: Dieses Motiv nutzt einen weißen Flight ohne starke Zusatzgrafik. Der Dart wirkt dadurch besonders sauber, neutral und leicht.
  - `White Trible`: Diese Variante kombiniert einen weißen Flight mit einem sichtbaren grauen Tribal-Muster. Dadurch bleibt der Dart hell, bekommt aber deutlich mehr Charakter als die reine Weiß-Version.
  - `Yellow`: Dieses Motiv setzt auf einen klar gelben Flight ohne zusätzliches Muster. Der Dart wirkt dadurch sehr hell und bleibt auch auf dunkleren Hintergründen deutlich sichtbar.
  - `Yellow Scull`: Diese Variante nutzt einen hellgelben Flight mit großem Totenkopf-Motiv. Dadurch wirkt der Dart besonders plakativ und deutlich dekorativer als die schlichte Gelb-Version.
- `Dart-Fluganimation`: Schaltet die Fluganimation der Dart-Bilder ein oder aus. Auf schwächeren Geräten kann das die Animation weniger flüssig machen.
- `Dart-Größe`: Passt die Größe der Dart-Grafiken an.
  - `Klein`: Diese Stufe reduziert die Dart-Grafik leicht unter die Standardgröße. Das Segment bleibt besser sichtbar, während der Dart weiterhin klar als Ersatzmarker erkennbar bleibt.
  - `Standard`: Diese Einstellung verwendet die reguläre Grundgröße für den Dart-Marker. Der Dart ist klar sichtbar, ohne den Trefferbereich unnötig stark zu füllen.
  - `Groß`: Diese Stufe vergrößert die Dart-Grafik sichtbar über die Standardgröße hinaus. Treffer wirken dadurch präsenter, nehmen aber auch mehr vom Segmentbild ein.
- `Original-Marker ausblenden`: Blendet die ursprünglichen Marker zugunsten der Dart-Grafiken aus. Im Live-Modus pausiert das Modul automatisch.
- `Einschlagstil`: Regelt die stabile Variation von Dart-Winkel, Perspektive und Schatten.
  - `Klassisch`: Der Dart-Einschlag bleibt klassisch und einheitlich ausgerichtet.
  - `Natürlich`: Darts wirken natürlicher, bleiben aber kontrolliert und gut lesbar.
  - `Dramatisch`: Darts wirken markanter und stärker inszeniert.
- `Einschlag-Schatten`: Schaltet den Einschlag-Schatten der Dart-Grafik ein oder aus.
- `Schatten-Weichzeichnung`: Schaltet die Weichzeichnung des Einschlag-Schattens ein oder aus.
- `Nachwippen beim Einschlag`: Schaltet das kurze Nachwippen der Dart-Grafik beim Einschlag ein oder aus.
- `Bewegungsunschärfe im Flug`: Schaltet die Bewegungsunschärfe der Fluganimation ein oder aus.
- `Fluggeschwindigkeit`: Regelt die Dauer der Fluganimation.
  - `Schnell`: Diese Stufe verkürzt die Flugphase deutlich. Neue Darts schießen schnell ins Segment und wirken dadurch sportlicher und unmittelbarer.
  - `Standard`: Diese Einstellung hält die Fluganimation sichtbar, aber kontrolliert. Der neue Dart ist gut wahrnehmbar und landet dennoch zügig am Zielpunkt.
  - `Filmisch`: Diese Stufe verlängert die Fluganimation merklich und macht den Anflug des Darts selbst zum kleinen Effektmoment. Dadurch wirkt das Setzen des Markers cineastischer, aber weniger direkt.
- `Diagnose`: Aktiviert zusätzliche Debug-Ausgaben für die Fehlersuche.

![Treffermarkierungen durch Darts ersetzen](screenshots/animation-dart-marker-darts.png)

<a id="animation-autodarts-animate-take-out-darts-alert"></a>
<a id="animation-autodarts-animate-remove-darts-notification"></a>

### Hinweis: Darts entfernen

- Gilt für: `alle Modi`
- Kurz: Der Hinweis zum Entfernen der Darts wird als große Grafik deutlich präsenter dargestellt.
- Grafisch: Der normale Hinweis wird durch eine zentrierte Bildkarte ersetzt. Optional pulsiert die Grafik leicht, damit sie im Spielablauf nicht übersehen wird.
- Wann sinnvoll? Wenn der Standardhinweis zu leicht übersehen wird.
- `Bildgröße`: Bestimmt die Größe der Hinweisgrafik.
  - `Kompakt`: Diese Stufe begrenzt die Hinweisgrafik auf eine kompaktere Maximalgröße. Der `Take Out`-Hinweis bleibt deutlich erkennbar, wirkt aber weniger raumgreifend.
  - `Standard`: Diese Einstellung nutzt die vorgesehene Standardgröße für die Hinweisgrafik. Der Hinweis ist gut sichtbar und bleibt zugleich noch ausgewogen im Bild.
  - `Groß`: Diese Stufe vergrößert die Hinweisgrafik sichtbar und macht den `Take Out`-Hinweis zum dominanten Bildelement. Besonders in hektischen Spielsituationen ist er dadurch kaum zu übersehen.
- `Pulsieren`: Schaltet die Pulsbewegung der Hinweisgrafik ein oder aus.
- `Stärke des Pulsierens`: Regelt die Stärke der Pulsbewegung.
  - `Dezent`: Diese Stufe hält die Pulsbewegung bewusst klein. Die Grafik atmet sichtbar, ohne stark zu wachsen oder den Blick hektisch zu ziehen.
  - `Standard`: Diese Einstellung liefert den Standardwert für das Anwachsen der Grafik im Puls. Der Hinweis bleibt lebendig, ohne zu stark aufzuschaukeln.
  - `Stark`: Diese Stufe vergrößert die Grafik in der Mitte der Pulsbewegung deutlich stärker. Der `Take Out`-Hinweis bekommt dadurch einen merklich energischeren Bewegungscharakter.
- `Diagnose`: Aktiviert zusätzliche Debug-Ausgaben für die Fehlersuche.

![Hinweis: Darts entfernen](screenshots/animation-remove-darts-notification.png)

<a id="animation-autodarts-animate-single-bull-hit-sound"></a>
<a id="animation-autodarts-animate-single-bull-sound"></a>

### Ton bei Single Bull

- Gilt für: `alle Modi`
- Kurz: Bei Single Bull hörst du einen kurzen Ton; grafisch bleibt das Spiel unverändert.
- Grafisch: Es wird keine zusätzliche Grafik eingeblendet. Die Rückmeldung ist rein akustisch und reagiert auf erkannte Single-Bull-Treffer.
- Wann sinnvoll? Wenn du Single Bull akustisch schneller bestätigen möchtest, ohne auf eine zusätzliche Animation zu achten.
- `Sound-Test`: Startet einen direkten Sound-Test mit der gespeicherten Lautstärke.
- `Lautstärke`: Regelt die Lautstärke des Single-Bull-Sounds.
  - `Leise`: Diese Stufe hält den Single-Bull-Sound bewusst leise und unaufdringlich. Der Treffer wird hörbar bestätigt, ohne andere Audioquellen stark zu überdecken.
  - `Mittel`: Diese Einstellung liefert eine mittlere Lautstärke, bei der der Single-Bull-Ton klar wahrnehmbar bleibt, aber noch nicht dominant in den Vordergrund tritt.
  - `Standard`: Diese Stufe entspricht der Standardlautstärke des Moduls. Der Single-Bull-Sound bleibt deutlich präsent, ohne bereits auf Maximalpegel zu laufen.
  - `Sehr laut`: Diese Einstellung setzt den Single-Bull-Sound auf die höchste verfügbare Lautstärke. Der Treffer ist damit am klarsten hörbar, kann aber je nach Audio-Setup deutlich präsenter wirken.
- `Mindestabstand zwischen Tönen`: Legt die Sperrzeit zwischen zwei Sound-Auslösungen fest.
  - `400 ms`: Diese Stufe hält die Wiederholsperre kurz. Mehrere Single-Bull-Erkennungen können dadurch schneller nacheinander hörbar werden, was direkter, aber auch dichter klingt.
  - `700 ms`: Diese Einstellung liefert den Standardwert für die Wiederholsperre. Sie verhindert direkte Doppeltrigger, ohne die akustische Rückmeldung unnötig träge zu machen.
  - `1000 ms`: Diese Stufe verlängert die Sperrzeit auf eine volle Sekunde. Dadurch wird Mehrfachfeuern besonders zuverlässig gebremst, der Ton kann aber nach schnellen Folgeereignissen später wieder hörbar werden.
- `Zusätzliche Trefferprüfung`: Schaltet optional eine zusätzliche Trefferprüfung alle 1,2 Sekunden ein.
  - `Aus`: Mit dieser Einstellung läuft der Single-Bull-Ton ohne zusätzliche regelmäßige Prüfung.
  - `Alle 1,2 Sekunden`: Diese Option ergänzt die direkte Erkennung um eine Prüfung alle 1,2 Sekunden.
- `Diagnose`: Aktiviert zusätzliche Debug-Ausgaben für die Fehlersuche.

<a id="animation-autodarts-animate-turn-score-counter"></a>
<a id="animation-autodarts-animate-turn-points-count"></a>

### Punkte animiert zählen

- Gilt für: `alle Modi`
- Kurz: Punkteänderungen beim Turn werden sichtbar hoch- oder heruntergezählt.
- Grafisch: Statt eines harten Sprungs läuft der angezeigte Wert weich zur neuen Punktzahl. Dadurch wird die Änderung als kurze Animation nachvollziehbar.
- Wann sinnvoll? Wenn du Punktwechsel im Spielbild leichter verfolgen möchtest.
- `Zählweise`: Wählt die Zählweise der Punkte.
  - `Fließend zählen`: Fließende Zählweise.
  - `Rollende Zahlen`: Zählweise mit rollenden Ziffern.
  - `In Schritten zählen`: Zählweise mit einzelnen Zahlenschritten.
- `Zählgeschwindigkeit`: Bestimmt die Geschwindigkeit des Hoch- oder Herunterzählens.
  - `Schnell`: Schnelle Zählgeschwindigkeit.
  - `Standard`: Ausgewogene Zählgeschwindigkeit.
  - `Ruhig`: Ruhige Zählgeschwindigkeit.
- `Bei Änderung aufblitzen`: Aktiviert oder deaktiviert das Aufblitzen während laufender Punkteänderungen.
- `Aufblitzen`: Wählt, ob der Rahmen nur bei Änderungen oder dauerhaft sichtbar ist.
  - `Nur bei Änderung`: Rahmen nur während laufender Zahlenänderungen.
  - `Permanent`: Rahmen dauerhaft sichtbar, unabhängig von laufender Änderung.
- `Diagnose`: Aktiviert zusätzliche Debug-Ausgaben für die Fehlersuche.

![Punkte animiert zählen](screenshots/animation-turn-points-count.gif)
![Punkte animiert zählen – Detail](screenshots/animation-turn-points-count-detail-readme.gif)

## X01

<a id="animation-autodarts-animate-checkout-score-highlight"></a>
<a id="animation-autodarts-animate-checkout-score-pulse"></a>

### Finishbaren Restscore hervorheben

- Gilt für: `X01`
- Kurz: Direkt finishbare Restwerte werden an der aktiven Punktzahl hervorgehoben.
- Grafisch: Die aktive Restpunktzahl pulsiert, glüht, skaliert oder blinkt je nach gewähltem Effekt. Die Hervorhebung sitzt direkt am Score und verändert keine anderen UI-Bereiche.
- Wann sinnvoll? Wenn du Checkout-Momente schneller am Score erkennen möchtest.
- `Animation`: Wählt die Animationsart der hervorgehobenen Restpunktzahl.
  - `Vergrößern & leuchten`: Die Restpunktzahl bekommt einen weichen Puls aus Größenänderung, Helligkeit und Schattierung. Der Effekt wirkt organisch und wiederkehrend, ohne die Zahl hart springen zu lassen.
  - `Nur leuchten`: Der Fokus liegt auf einem an- und abschwellenden Glühen um die Zahl herum. Die Score-Anzeige selbst bleibt relativ stabil, während der Lichtschein die Aufmerksamkeit auf das Finish lenkt.
  - `Nur vergrößern`: Die Finish-Zahl wird zyklisch vergrößert und wieder auf Normalgröße zurückgeführt. Der Effekt wirkt direkter als reines Leuchten, ohne hartes Blinken zu nutzen.
  - `Sanft blinken`: Die Score-Anzeige blinkt über deutliche Helligkeitssprünge zwischen klar sichtbar und stark gedimmt. Dadurch wirkt der Effekt am alarmierendsten und fällt sofort ins Auge.
- `Farbe`: Legt die Highlight-Farbe der Restpunktzahl fest.
  - `Autodarts Grün`: Der Score-Effekt nutzt ein helles, freundliches Grün und wirkt dadurch wie eine klare Freigabe oder Bestätigung. Diese Palette fügt sich am natürlichsten in den bestehenden Autodarts-Look ein.
  - `Cyan`: Diese Variante färbt die Hervorhebung in ein kühles Cyan. Dadurch wirkt der Checkout-Effekt moderner und technischer, bleibt aber ruhiger als warme Warnfarben.
  - `Amber`: Die Hervorhebung läuft in einen warmen Amberton und erinnert optisch eher an Bühnenlicht oder Warnakzent. Dadurch wirkt der Finish-Hinweis energischer und wärmer als Grün oder Cyan.
  - `Rot`: Diese Variante färbt die Finish-Anzeige klar rot und macht sie dadurch besonders dringlich und auffällig. Sie erzeugt den stärksten Warn- oder Alarmcharakter unter den verfügbaren Farbpaletten.
- `Stärke`: Regelt die Stärke des Score-Effekts.
  - `Dezent`: Diese Stufe hält Skalierung, Glühen und Blinktiefe bewusst zurück. Der Checkout-Hinweis bleibt lesbar und präsent, wirkt aber eher wie ein feiner Hinweis als wie ein Alarm.
  - `Standard`: Diese Stufe liefert den vorgesehenen Mittelweg für Skalierung, Leuchtweite und Blinkstärke. Die Finish-Hervorhebung ist deutlich genug für schnelle Wahrnehmung, ohne zu hektisch zu werden.
  - `Stark`: Diese Stufe erhöht die Maximalwerte für Skalierung, Schimmer und Sichtbarkeitsschwankung spürbar. Der Effekt wirkt energischer, dominanter und ist auch aus größerem Abstand leichter wahrzunehmen.
- `Finish-Erkennung`: Legt fest, welche Quelle den Score-Effekt auslösen darf.
  - `Vorschlag zuerst`: Diese Einstellung koppelt die Hervorhebung zuerst an die sichtbare Checkout-Empfehlung und nutzt den Punktestand nur als Fallback. Mehrschrittige Routen lösen den Effekt noch nicht aus; entscheidend ist erst der aktuell fällige Finish-Dart.
  - `Nur Score`: Mit dieser Einstellung entscheidet allein, ob der aktuelle Score mit dem nächsten Dart direkt finishbar ist. Sichtbare Checkout-Vorschläge beeinflussen den Effekt nicht mehr.
  - `Nur Vorschlag`: Diese Einstellung bindet die Hervorhebung strikt an den sichtbaren Suggestion-Block. Selbst ein rechnerisch direkt finishbarer Wert erzeugt keinen Effekt, solange kein passender Finish-Vorschlag erkannt wird.
- `Diagnose`: Aktiviert zusätzliche Debug-Ausgaben für die Fehlersuche.

![Finishbaren Restscore hervorheben](screenshots/animation-checkout-score-pulse.gif)

<a id="animation-autodarts-x01-remaining-score-bar"></a>
<a id="animation-autodarts-x01-score-progress"></a>

### Restscore-Balken

- Gilt für: `X01`
- Kurz: Jede X01-Spielerkarte erhält einen Balken, der den verbleibenden Score relativ zum Startwert zeigt.
- Grafisch: Direkt unter der Punktzahl liegt ein horizontaler Fortschrittsbalken. Aktive Spieler erhalten eine kräftigere, präsentere Darstellung mit optionalem Effekt, inaktive Karten bleiben flacher und unverändert ruhig. Je näher der Restwert an `0` liegt, desto kürzer wird der Balken.
- Wann sinnvoll? Wenn du Reststände und den Abstand zwischen Spielern in X01 schneller auf einen Blick erfassen möchtest.
- `Farben`: Steuert statische Farbpaletten und dynamische Schwellenfarben in einer gemeinsamen Auswahl.
  - `Checkout Focus`: Dynamischer Standardmodus mit Checkout-Fokus.
  - `Checkout-Zone Blau/Weiß`: Blauer Restscore-Balken mit weißer 170-Linie und schraffierter Checkout-Zone.
  - `Traffic Light`: Stufenmodus mit klaren Rot/Amber/Grün-Prozentschwellen.
  - `Danger Endgame`: Dynamischer Endgame-Modus mit starkem Warnfokus.
  - `Gradient Progress`: Kontinuierlicher Farbverlauf entlang des Score-Fortschritts.
  - `Autodarts`: Statische Autodarts-nahe Blaupalette.
  - `Signal Lime`: Statische lime-grüne Signalpalette.
  - `Glass Mint`: Statische helle Mint-/Aqua-Palette.
  - `Ember Rush`: Statische warme Ember-Palette.
  - `Ice Circuit`: Statische kühle Cyan-/Türkis-Palette.
  - `Neon Violet`: Statische violett-blaue Neonpalette.
  - `Sunset Amber`: Statische Sunset-/Amber-Palette.
  - `Monochrome Steel`: Statische, farbreduzierte Monochrom-Palette.
- `Balkengröße`: Legt die Balkenhöhe des aktiven Spielers fest.
  - `Schmal`: Schmale Balkenhöhe für eine ruhige Darstellung.
  - `Standard`: Standardhöhe als neutraler Mittelweg.
  - `Breit`: Breitere Balkenhöhe mit stärkerer Präsenz.
  - `Extrabreit`: Maximal breite Balkenhöhe für höchste Sichtbarkeit.
- `Animation`: Wählt den Effekt des aktiven Balkens; inaktive Spieler bleiben unverändert.
  - `Balken pulsieren`: Deutlicher Kern-Puls auf dem aktiven Balken.
  - `Lichtlauf`: Gläserner Ladeeffekt mit breiter Lichtkante.
  - `Laufende Segmente`: Segmentierte Drain-Optik mit klaren Abschnitten.
  - `Vorherigen Stand anzeigen`: Nachziehender Ghost-Trail beim Scorewechsel.
  - `Schneller Lichtlauf`: Schneller Signal-Sweep mit hoher Aufmerksamkeit.
  - `Aus`: Keine Zusatzanimation; nur der statische Balken bleibt sichtbar.
- `Diagnose`: Aktiviert zusätzliche Debug-Ausgaben für die Fehlersuche.

![Restscore-Balken](screenshots/animation-x01-score-progress.png)

<a id="animation-autodarts-animate-checkout-target-highlights"></a>
<a id="animation-autodarts-animate-checkout-board-targets"></a>

### Checkout-Ziele hervorheben

- Gilt für: `X01`
- Kurz: Unter `180` wird das nächste sinnvolle Checkout-Ziel direkt am virtuellen Board markiert.
- Grafisch: Die relevanten Segmente erhalten eine ruhige farbige Füllung, optional eine Kontur und einen kontrollierten Halo. Unter `180` validiert das Modul sichtbare Vorschläge gegen Score und Out-Mode, ergänzt sinnvolle Finish-Routen scorebasiert und hält bei klaren Setup-Hinweisen das zuerst zu spielende Feld direkt am Board sichtbar. Wenn mehrere Routenschritte sichtbar sind, bleibt das zuerst zu spielende Feld klar am stärksten betont. Single-Ziele markieren standardmäßig immer beide Single-Ringe des Segments.
- Wann sinnvoll? Wenn du in der Checkout-Phase immer direkt am Board sehen willst, welches Feld als Nächstes sinnvoll ist.
- `Animation`: Wählt die visuelle Darstellung der markierten Segmente.
  - `Sanft pulsieren`: Diese Darstellung hält das nächste sinnvolle Checkout-Ziel ruhig und klar im Fokus und ergänzt Helligkeit, Halo und Kontur um eine kleine, kontrollierte Skalierung.
  - `Schnell blinken`: Diese Darstellung orientiert sich am nativen Blinkgefühl und setzt das Ziel mit klaren Helligkeitswechseln, leichtem Wachstum und sauberem Halo in Szene.
  - `Langsam leuchten`: Diese Darstellung eignet sich, wenn das Checkout-Ziel eher als konstanter Board-Hinweis mit nur minimaler Bewegung sichtbar sein soll.
- `Art der Hervorhebung`: Legt fest, ob die Ziele mit Rahmen oder nur über die farbige Fläche markiert werden.
  - `Fläche + Rahmen`: Diese Variante kombiniert die farbige Fläche mit Segmentrahmen und zusätzlicher Zielkontur und entspricht dem bisherigen Standard-Look.
  - `Nur Fläche`: Diese Variante markiert das Ziel ausschließlich über die eingefärbte Fläche und lässt den Rahmen komplett weg, während Preset und Farblogik auf der Fläche erhalten bleiben.
- `Zielauswahl`: Legt fest, welcher Teil der autoritativen Checkout-Route am Board markiert wird.
  - `Nächstes Feld`: Markiert unter `180` genau das nächste sinnvolle Feld; wenn keine Finish-Route mehr steht, bleibt ein plausibler sichtbarer Setup-Hinweis als nächstes Feld erhalten.
  - `Alle Felder`: Markiert alle Segmente der validierten beziehungsweise scorebasiert ergänzten Route gleichzeitig, mit klarem Fokus auf dem ersten Schritt.
  - `Nur Finish`: Markiert nur das aktuelle Finish-Segment; mehrstufige Setup-Routen bleiben bis zum echten Finish-Dart unmarkiert.
- `Farbe`: Passt die Farbe der Board-Markierungen an.
  - `Violett`: Diese Palette nutzt ein klares Violett für Füllung und Kontur der Checkout-Ziele. Dadurch wirkt die Markierung deutlich futuristischer und hebt sich stark von den Standardfarben des Boards ab.
  - `Cyan`: Diese Farbpalette färbt die Ziele in ein kühles Cyan und erzeugt damit einen sauberen, technischen Look. Auf dunklen Board-Bereichen wirkt die Markierung sehr klar und modern.
  - `Amber`: Die Checkout-Ziele werden in eine warme Amber- bis Goldwirkung getaucht. Dadurch wirkt das Overlay energetischer, wärmer und stärker wie ein Warn- oder Fokusakzent.
  - `Lime`: Diese Palette setzt auf ein klares Lime-Grün für maximale Sichtbarkeit. Sie ist bewusst stark von Violett, Cyan und Amber getrennt und wirkt wie ein präziser Signalmarker am Board.
  - `Rose`: Diese Palette färbt Checkout-Ziele in ein kräftiges Rose bis Pink. Dadurch entsteht ein warmer, sehr sichtbarer Gegenpol zu den kühleren und grünen Signalvarianten.
  - `Weiß`: Diese Palette nutzt ein kühles Signalweiß für Füllung und Kontur. Sie ist die neutralste Variante und bleibt trotzdem sehr präsent, ohne eine zusätzliche Farbstimmung vorzugeben.
- `Diagnose`: Aktiviert zusätzliche Debug-Ausgaben für die Fehlersuche.

![Checkout-Ziele hervorheben](screenshots/animation-checkout-board-targets.gif)

<a id="animation-autodarts-animate-tv-board-zoom"></a>

### Automatischer Board-Zoom

- Gilt für: `X01`
- Kurz: Bei klaren X01-Zielsituationen zoomt die Ansicht auf relevante Board-Bereiche und hält den Fokus in sinnvollen Finish-Momenten stabil.
- Grafisch: Das Board wird innerhalb des rechten Board-Bereichs vergrößert, damit relevante Segmente mehr Platz bekommen. Nach `T20,T20,T20` bleibt der Fokus bis zum Spielerwechsel bestehen, nach getroffenem Checkout bis zum Leg-Ende. Klicks auf die Wurfanzeigenleiste zoomen sofort aus, damit Korrekturen auf der ganzen Scheibe möglich bleiben.
- Wann sinnvoll? Wenn du bei dritten Darts und Finishes mehr Fokus auf Zielbereiche willst, aber bei Korrekturen schnell wieder die ganze Scheibe brauchst.
- `Zoomstärke`: Bestimmt die Stärke des Board-Zooms.
  - `Leicht`: Diese Stufe vergrößert das Ziel spürbar, lässt aber noch viel vom restlichen Board im Bild. Der Effekt wirkt eher wie ein sanfter Fokus als wie ein enger Ausschnitt.
  - `Mittel`: Diese Stufe liefert den vorgesehenen Mittelwert für den Board-Zoom. Das Zielsegment wird deutlich hervorgehoben, während rundherum noch genug Board sichtbar bleibt, um sich räumlich zu orientieren.
  - `Stark`: Diese Stufe zieht die Kamera am stärksten in den relevanten Bereich hinein. Das Zielsegment dominiert das Bild klarer, während das restliche Board stärker aus dem Blickfeld rückt.
- `Zoom-Geschwindigkeit`: Regelt die Geschwindigkeit des Zooms.
  - `Schnell`: Diese Stufe verkürzt Ein- und Auszoomung sichtbar und lässt den Fokus direkter anspringen. Die Bewegung bleibt weich, fühlt sich aber deutlich sportlicher und unmittelbarer an.
  - `Mittel`: Diese Stufe ist der Mittelweg zwischen schnellem Fokuswechsel und weicher Kamerafahrt. Die Bewegung bleibt klar wahrnehmbar, ohne das Geschehen unnötig zu verzögern.
  - `Langsam`: Diese Einstellung verlängert Ein- und Auszoomung spürbar. Der Fokus wirkt dadurch weicher und cineastischer, aber weniger direkt als bei `Schnell`.
- `Checkout-Zoom`: Schaltet den Checkout-Zoom für klare Ein-Dart-Finishes ein oder aus.
- `Zoom auf`: Bestimmt, welches Segment einer sichtbaren Checkout-Route als Zoomziel verwendet wird.
  - `Nur Finish-Feld`: Fokussiert bei sichtbaren Checkout-Routen nur das abschließende Finish-Feld.
  - `Erstes Routenfeld`: Fokussiert bei sichtbaren Checkout-Routen das erste Routenfeld.
- `Auch auf T20-Setup zoomen`: Schaltet den `T20`-Spezialfall nach zwei `T20` ein oder aus.
- `Diagnose`: Aktiviert zusätzliche Debug-Ausgaben für die Fehlersuche.

![Automatischer Board-Zoom](screenshots/animation-tv-board-zoom.gif)

<a id="animation-autodarts-checkout-suggestion-styles"></a>
<a id="animation-autodarts-style-checkout-suggestions"></a>

### Checkout-Vorschlag gestalten

- Gilt für: `X01`
- Kurz: Die drei Turn-Felder werden bei Aktivierung größer; sichtbare Checkout-Empfehlungen erhalten den gewählten Akzentstil.
- Grafisch: Schriftart und Textfarbe bleiben beim Theme. Badge, Ribbon, Stripe, Ticket oder Outline ergänzen Fläche, Kontur und optional ein Label im ersten Checkout-Feld.
- Wann sinnvoll? Wenn du größere Turn-Felder und klar erkennbare Checkout-Routen möchtest, ohne dein Theme zu übergehen.
- `Darstellung`: Wechselt den Akzentstil der Checkout-Felder.
  - `Plakette`: Diese Variante verbindet die vergrößerten Checkout-Felder mit einer gestrichelten Kontur und einer dezenten Akzentfläche. Schrift und Textfarbe kommen weiterhin aus dem aktiven Theme.
  - `Band`: Diese Variante inszeniert die Checkout-Felder mit einer farbigen Oberkante und einem kontrollierten Glow. Das Label bleibt gerade und die Theme-Typografie vollständig lesbar.
  - `Streifen`: Diese Variante markiert die Checkout-Felder mit einer seitlichen Akzentleiste und einem ruhigen Flächenverlauf. Dadurch bleibt die Route signalstark und zugleich gut lesbar.
  - `Ticket`: Diese Variante formt jedes Checkout-Feld mit einer gestrichelten Innenkontur wie ein Ticket. Der Segmenttext bleibt frei von überlagernden Linien oder Mustern.
  - `Rahmen`: Diese Variante hält die Fläche selbst relativ ruhig und setzt auf eine kräftige äußere Kontur. Der Vorschlag wirkt dadurch klar, präzise und eher technisch als verspielt.
- `Beschriftung`: Legt die feste Beschriftung im ersten Checkout-Feld fest oder blendet sie aus.
  - `CHECKOUT`: Diese Einstellung setzt im ersten Checkout-Feld ein festes `CHECKOUT`-Label. Dadurch wird die Route sofort als Checkout-Hinweis lesbar, auch wenn man nur kurz auf die Fläche schaut.
  - `FINISH`: Mit dieser Option trägt das erste Feld der Checkout-Route das Label `FINISH` statt `CHECKOUT`. Das wirkt sprachlich kompakter und rückt den Abschluss stärker in den Vordergrund.
  - `Kein Label`: Diese Option entfernt die kleine Label-Marke aus dem ersten Checkout-Feld vollständig. Die farbige Hülle bleibt erhalten, aber die Route wirkt minimalistischer.
- `Farbe`: Wählt die Akzentfarbe des Suggestion-Styles.
  - `Amber`: Diese Palette taucht die Hülle in warme Amber- und Goldtöne. Dadurch wirkt die Empfehlung freundlich, energisch und sehr gut vom dunklen Hintergrund abgesetzt.
  - `Cyan`: Diese Farbpalette setzt auf kühle Cyan-Töne für Rahmen, Label und Hintergrundakzent. Der Vorschlag wirkt dadurch moderner, technischer und etwas nüchterner als bei warmen Farben.
  - `Rose`: Diese Palette färbt den Suggestion-Block in rosé- bis rotlastige Akzente. Dadurch wirkt der Hinweis markanter, emotionaler und stärker wie ein bewusst gesetzter Signalblock.
- `Diagnose`: Aktiviert zusätzliche Debug-Ausgaben für die Fehlersuche.

![Checkout-Vorschlag gestalten](screenshots/animation-style-checkout-suggestions.png)
![Format Badge](screenshots/animation-style-checkout-suggestions-format-badge-readme.png)
![Format Stripe](screenshots/animation-style-checkout-suggestions-format-stripe-readme.png)
![Format Ticket](screenshots/animation-style-checkout-suggestions-format-ticket-readme.png)
![Format Outline](screenshots/animation-style-checkout-suggestions-format-outline-readme.png)

<a id="animation-autodarts-x01-bust-active-player-highlight"></a>

### Überworfen (BUST) hervorheben

- Gilt für: `X01`
- Kurz: Bei sichtbarem `BUST` übernimmt die aktive X01-Spielerkarte Hintergrund und Rahmen der roten Wurfkacheln; optional wird ein Glasbruch-Sound abgespielt.
- Grafisch: Beim Eintritt in BUST erscheinen die konfigurierten Glasrisse sofort an zufälligen Stellen. Wenn das Schütteln aktiv ist, bewegt sich die aktive Karte drei Sekunden deutlich hin und her. Wenn der Glasbruch-Sound aktiviert ist, wird er gleichzeitig gestartet. Danach bleiben Glasrisse und rote Wurfkachel-Färbung stehen, bis `BUST` verschwindet.
- Wann sinnvoll? Wenn ein Überwurf sofort am aktiven Spieler auffallen soll.
- `Vorschau`: Startet die BUST-Vorschau im Einstellungsdialog.
- `Glasrisse`: Bestimmt die Anzahl zufällig platzierter Glasrisse.
  - `Aus`: Keine Glasrisse; Rotmarkierung und Wackeln bleiben aktiv.
  - `1`: Zeigt ein zufällig platziertes Einschlagzentrum.
  - `2`: Zeigt zwei zufällig und unabhängig platzierte Einschlagzentren.
  - `3`: Zeigt drei Einschlagzentren und damit die dichteste Darstellung.
- `Spielerkarte kurz schütteln`: Schaltet das kurze Schütteln für Effekt und Vorschau ein.
- `Glasbruch-Sound`: Schaltet den Glasbruch-Sound für Effekt und Vorschau ein.
- `Diagnose`: Aktiviert zusätzliche Debug-Ausgaben für die Fehlersuche.

![Überworfen (BUST) hervorheben](screenshots/animation-x01-bust-active-player-highlight.gif)

## Cricket / Tactics

<a id="animation-autodarts-animate-cricket-target-highlighter"></a>
<a id="animation-autodarts-animate-cricket-highlighter"></a>

### Cricket-Ziele hervorheben

- Gilt für: `Cricket`, `Tactics`
- Kurz: Zielzustände und Drucksituationen werden direkt am Board sichtbar.
- Grafisch: Board-Segmente erhalten je nach Zustand farbige Overlays. Relevante Ziele leuchten grün oder rot, irrelevante Felder werden je nach Stil abgeschwächt, geschraffiert oder maskiert.
- Wann sinnvoll? Wenn du in Cricket oder Tactics schneller sehen möchtest, welche Ziele offen, scorable, unter Druck oder bereits erledigt sind.
- `Offene Ziele anzeigen (OPEN)`: Zeigt offene Ziele zusätzlich am Board an.
- `Erledigte Ziele anzeigen (DEAD)`: Zeigt erledigte Ziele weiter als `DEAD` an.
- `Andere Felder abdunkeln`: Bestimmt den Abdunkelungsstil für irrelevante Felder.
  - `Aus`: Mit dieser Option bleiben irrelevante Board-Felder optisch unangetastet. Das Board behält überall seine normale Grundwirkung, während nur die tatsächlich markierten Zustände zusätzliche Overlays bekommen.
  - `Rauch`: Diese Variante legt eine weiche, gleichmäßige Abdunkelung über irrelevante Segmente. Das Board wirkt ruhiger, ohne mit Mustern oder starker Maskierung vom aktiven Ziel abzulenken.
  - `Schraffur`: Diese Stufe kombiniert eine graue Dämpfung mit sichtbarer Schraffur. Irrelevante Felder sind dadurch klarer als passive Zone gekennzeichnet als bei `Rauch`.
  - `Abdeckung`: Diese Variante nutzt die härteste Abdunkelung und deckt irrelevante Bereiche fast wie mit einer schwarzen Maske ab. Dadurch stehen aktive, offene und druckrelevante Ziele maximal im Vordergrund.
- `Farben`: Passt die Farben für Scoring- und Druckzustände an.
  - `Standard`: Diese Palette verwendet das Standard-Grün für Scoring und das normale Rot für Druckzustände. Sie liefert die vorgesehene Grundwirkung ohne zusätzliche Kontrastschärfung.
  - `High Contrast`: Diese Palette verstärkt vor allem die grüne Scoring-Wirkung gegenüber dem Standardmodus. Dadurch heben sich offensive Ziele klarer vom Board und von anderen Zuständen ab.
- `Stärke`: Regelt Deckkraft und Sichtbarkeit der Board-Overlays.
  - `Dezent`: Diese Stufe reduziert Deckkraft und Konturwirkung der Board-Overlays. Zustände bleiben lesbar, drängen sich aber weniger stark in den Vordergrund.
  - `Standard`: Diese Einstellung liefert den Standardwert für Füllung, Kontur und Dimmwirkung. Das Board bleibt gut interpretierbar, ohne optisch zu schwer zu werden.
  - `Stark`: Diese Stufe erhöht Sichtbarkeit, Konturboost und Flächenwirkung der Overlays spürbar. Zustände springen dadurch schneller ins Auge, wirken aber deutlich dominanter auf dem Board.
- `Diagnose`: Aktiviert zusätzliche Debug-Ausgaben für die Fehlersuche.

![Cricket-Ziele hervorheben](screenshots/animation-cricket-target-highlighter.png)

<a id="animation-autodarts-animate-cricket-grid-status-effects"></a>
<a id="animation-autodarts-animate-cricket-grid-fx"></a>

### Cricket-Statusanzeigen

- Gilt für: `Cricket`, `Tactics`
- Kurz: Zusätzliche Live-Effekte direkt in der Cricket-/Tactics-Matrix.
- Grafisch: Zellen, Zeilen und Zielmarken reagieren mit grünen und roten Zuständen, kurzen Hinweisen, Kanten und Übergängen. So werden Fortschritt, Gegnerdruck und Zugwechsel in der Matrix selbst sichtbarer.
- Wann sinnvoll? Wenn du Fortschritt, Gegnerdruck und Wechsel im Grid klarer sehen willst.
- `Welle durch die Zeile`: Lässt nach Änderungen einen kurzen Lichtlauf über die Zeile laufen.
- `Zielmarke hervorheben`: Lässt relevante Zielmarken und Beschriftungen stärker leuchten.
- `Markierungen auffüllen`: Betont die Markierungsstufen in den Spielerzellen.
- `Druck anzeigen (PRESSURE)`: Zeichnet bei Gegnerdruck eine rote Warnkante.
- `Punktemöglichkeit anzeigen (SCORING)`: Hebt offensiv scorable Bereiche grün hervor.
- `Erledigte Zeilen abdunkeln (DEAD)`: Dunkelt `DEAD`-Zeilen optisch ab.
- `Änderungen anzeigen`: Zeigt kurz `+1`, `+2` oder `+3` direkt an der Matrix an.
- `Treffer-Impuls`: Erzeugt einen kurzen Trefferfunken am betroffenen Bereich.
- `Zugwechsel-Übergang`: Kennzeichnet den Zugwechsel mit einem kurzen Matrix-Übergang.
- `Druckfläche anzeigen (PRESSURE)`: Legt bei Gegnerdruck eine zusätzliche rote Druckfläche über betroffene Bereiche.
- `Farben`: Passt die Farben der Grid-Effekte an.
  - `Standard`: Diese Palette verwendet die Standardfarben für offensive und druckbezogene Grid-Effekte. Sie liefert den normalen Look für Badge-Glows, Streifen, Kanten und Zellmarkierungen.
  - `High Contrast`: Diese Palette verstärkt vor allem die grüne Offensivwirkung im Grid. Badge-Glows, Scoring-Streifen und offensive Flächen heben sich dadurch klarer von roten Druckzuständen ab.
- `Stärke`: Regelt die Gesamtstärke der Matrixeffekte.
  - `Dezent`: Diese Stufe reduziert die Opazität und den Glanz der Grid-FX-Komponenten. Zeilen, Badges und Zellzustände bleiben informativ, treten aber weniger plakativ auf.
  - `Standard`: Diese Einstellung liefert den Standardwert für Badge-Glow, Zellfüllung, Druckkante und Scoring-Streifen. Das Grid bleibt klar interpretierbar und zugleich kontrolliert.
  - `Stark`: Diese Stufe erhöht die sichtbare Stärke von Glow, Füllung und Kanten im gesamten Grid-FX-Paket. Offensiv- und Druckzustände wirken dadurch markanter und dominieren die Matrix stärker.
- `Diagnose`: Aktiviert zusätzliche Debug-Ausgaben für die Fehlersuche.

![Cricket-Statusanzeigen](screenshots/animation-cricket-grid-fx.png)
<!-- xconfig-generated:end -->
## Weitere Hinweise zur Konfiguration

- Alle Einstellungen werden lokal gespeichert.
- Globales Wallpaper und eigener Dart-Upload werden lokal als Data-URL abgelegt.
- Aktivierungen, Bild-Uploads und Feineinstellungen bleiben nach Reload erhalten.
