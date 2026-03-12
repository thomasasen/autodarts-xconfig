# Feature-Übersicht

`autodarts-xconfig` bündelt 20 Module in einem Userscript:

- 15 Animationen und Komfortfunktionen
- 5 Themes

Die gesamte Steuerung läuft über **AD xConfig** direkt im Spiel.

![AD xConfig](screenshots/ad-xconfig.png)

## Themes

### Theme X01

- Gilt für: `X01`
- Kurz: Ein ruhiges X01-Layout mit eigener Bildfläche und optionaler AVG-Zeile.
- Grafisch: Farben, Flächen und Karten werden neu gestaltet; ein eigenes Hintergrundbild liegt hinter dem Spielbereich, während die Grundstruktur des X01-Layouts erhalten bleibt.
- `AVG anzeigen`: Blendet die AVG-Anzeige im X01-Theme ein oder aus.
- `Hintergrund-Darstellung`: Legt fest, wie ein eigenes Hintergrundbild im Theme platziert wird.
- `Hintergrundbild-Deckkraft`: Regelt, wie stark das Hintergrundbild sichtbar bleibt.
- `Spielerfelder-Transparenz`: Passt die Transparenz der Spielerfelder gegenüber dem Hintergrund an.
- `Debug`: Aktiviert zusätzliche Debug-Ausgaben für die Fehlersuche.
- `Hintergrundbild hochladen`: Speichert ein eigenes Bild nur für dieses Theme.
- `Hintergrundbild entfernen`: Entfernt nur das für dieses Theme gespeicherte Hintergrundbild.

![Theme X01 in AD xConfig](screenshots/template-theme-x01-xConfig.png)
![Theme X01 Vorschau Standard](screenshots/template-theme-x01-preview-standard-readme.png)
![Theme X01 Vorschau unter Würfen](screenshots/template-theme-x01-preview-under-throws-readme.png)

### Theme Shanghai

- Gilt für: `Shanghai`
- Kurz: Ein aufgeräumtes Shanghai-Layout mit optionaler AVG-Zeile und ruhigerem Kontrast.
- Grafisch: Das Theme ordnet Flächen und Farben neu, ohne den Spielaufbau zu verändern. Ein eigenes Hintergrundbild liegt hinter der Oberfläche und kann die Wirkung zusätzlich prägen.
- `AVG anzeigen`: Blendet die AVG-Anzeige im Shanghai-Theme ein oder aus.
- `Hintergrund-Darstellung`: Legt fest, wie ein eigenes Hintergrundbild im Theme platziert wird.
- `Hintergrundbild-Deckkraft`: Regelt, wie stark das Hintergrundbild sichtbar bleibt.
- `Spielerfelder-Transparenz`: Passt die Transparenz der Spielerfelder gegenüber dem Hintergrund an.
- `Debug`: Aktiviert zusätzliche Debug-Ausgaben für die Fehlersuche.
- `Hintergrundbild hochladen`: Speichert ein eigenes Bild nur für dieses Theme.
- `Hintergrundbild entfernen`: Entfernt nur das für dieses Theme gespeicherte Hintergrundbild.

![Theme Shanghai in AD xConfig](screenshots/template-theme-shanghai-xConfig.png)

### Theme Bermuda

- Gilt für: `Bermuda`
- Kurz: Ein ruhigeres Bermuda-Layout mit eigener Bildfläche im Hintergrund.
- Grafisch: Das Theme passt Farben und Flächen für Bermuda an; ein gespeichertes Hintergrundbild liegt hinter dem Spielbereich, während die Bermuda-Anordnung selbst erhalten bleibt.
- `Hintergrund-Darstellung`: Legt fest, wie ein eigenes Hintergrundbild im Theme platziert wird.
- `Hintergrundbild-Deckkraft`: Regelt, wie stark das Hintergrundbild sichtbar bleibt.
- `Spielerfelder-Transparenz`: Passt die Transparenz der Spielerfelder gegenüber dem Hintergrund an.
- `Debug`: Aktiviert zusätzliche Debug-Ausgaben für die Fehlersuche.
- `Hintergrundbild hochladen`: Speichert ein eigenes Bild nur für dieses Theme.
- `Hintergrundbild entfernen`: Entfernt nur das für dieses Theme gespeicherte Hintergrundbild.

![Theme Bermuda in AD xConfig](screenshots/template-theme-bermuda-xConfig.png)

### Theme Cricket

- Gilt für: `Cricket`, `Tactics`
- Kurz: Ein gemeinsames Theme für Cricket und Tactics mit ruhigerer Grundoptik und optionaler AVG-Zeile.
- Grafisch: Farben, Karten und Hintergründe werden auf eine gemeinsame Cricket-/Tactics-Optik gezogen. Ein eigenes Bild kann hinter dem Spielbereich liegen, ohne die Board- oder Grid-Logik zu verändern.
- `AVG anzeigen`: Blendet die AVG-Anzeige im Cricket-/Tactics-Theme ein oder aus.
- `Hintergrund-Darstellung`: Legt fest, wie ein eigenes Hintergrundbild im Theme platziert wird.
- `Hintergrundbild-Deckkraft`: Regelt, wie stark das Hintergrundbild sichtbar bleibt.
- `Spielerfelder-Transparenz`: Passt die Transparenz der Spielerfelder gegenüber dem Hintergrund an.
- `Debug`: Aktiviert zusätzliche Debug-Ausgaben für die Fehlersuche.
- `Hintergrundbild hochladen`: Speichert ein eigenes Bild nur für dieses Theme.
- `Hintergrundbild entfernen`: Entfernt nur das für dieses Theme gespeicherte Hintergrundbild.

![Theme Cricket in AD xConfig](screenshots/template-theme-cricket-xConfig.png)

### Theme Bull-off

- Gilt für: `Bull-off`
- Kurz: Ein kontrastbetontes Bull-off-Layout mit wählbarer Stärke und eigener Bildfläche.
- Grafisch: Das Theme verändert Farben, Kontrast und Flächen speziell für Bull-off. Ein optionales Hintergrundbild liegt dahinter, während der Spielaufbau gleich bleibt.
- `Kontrast-Preset`: Schaltet die Kontrastwirkung des Bull-off-Themes um.
- `Hintergrund-Darstellung`: Legt fest, wie ein eigenes Hintergrundbild im Theme platziert wird.
- `Hintergrundbild-Deckkraft`: Regelt, wie stark das Hintergrundbild sichtbar bleibt.
- `Spielerfelder-Transparenz`: Passt die Transparenz der Spielerfelder gegenüber dem Hintergrund an.
- `Debug`: Aktiviert zusätzliche Debug-Ausgaben für die Fehlersuche.
- `Hintergrundbild hochladen`: Speichert ein eigenes Bild nur für dieses Theme.
- `Hintergrundbild entfernen`: Entfernt nur das für dieses Theme gespeicherte Hintergrundbild.

![Theme Bull-off in AD xConfig](screenshots/template-theme-bull-off-xConfig.png)

## Animationen für X01

### Checkout Score Pulse

- Gilt für: `X01`
- Kurz: Finishfähige Restwerte werden direkt an der aktiven Punktzahl hervorgehoben.
- Grafisch: Die aktive Restpunktzahl pulsiert, glüht, skaliert oder blinkt je nach gewähltem Effekt. Die Hervorhebung sitzt direkt am Score und verändert keine anderen UI-Bereiche.
- `Effekt`: Wählt die Animationsart der hervorgehobenen Restpunktzahl.
- `Farbthema`: Legt die Highlight-Farbe der Restpunktzahl fest.
- `Intensität`: Regelt die Stärke des Score-Effekts.
- `Trigger-Quelle`: Legt fest, welche Quelle den Score-Effekt auslösen darf.
- `Debug`: Aktiviert zusätzliche Debug-Ausgaben für die Fehlersuche.

![Checkout Score Pulse](screenshots/animation-checkout-score-pulse.gif)

### Checkout Board Targets

- Gilt für: `X01`
- Kurz: Mögliche Checkout-Ziele werden direkt am virtuellen Board markiert.
- Grafisch: Die relevanten Segmente erhalten eine farbige Füllung, Kontur und Animation. So siehst du am Board selbst, welches Ziel aktuell für den Checkout relevant ist.
- `Effekt`: Legt die Animationsart der markierten Segmente fest.
- `Zielumfang`: Legt fest, ob nur das erste oder alle aktuellen Ziele markiert werden.
- `Single-Ring`: Bestimmt, welche Single-Ringe bei Single-Zielen markiert werden.
- `Farbthema`: Passt die Farbe der Board-Markierungen an.
- `Kontur-Intensität`: Regelt Stärke und Puls der Zielkontur.
- `Debug`: Aktiviert zusätzliche Debug-Ausgaben für die Fehlersuche.

![Checkout Board Targets](screenshots/animation-checkout-board-targets.gif)

### TV Board Zoom

- Gilt für: `X01`
- Kurz: Bei klaren X01-Zielsituationen zoomt die Ansicht kurz auf relevante Board-Bereiche.
- Grafisch: Das Board wird temporär vergrößert, damit relevante Segmente mehr Platz bekommen. Die Kamera springt nicht hart, sondern fährt mit einer kurzen Ein- und Ausblendung hinein und zurück.
- `Zoom-Stufe`: Bestimmt die Stärke des Board-Zooms.
- `Zoom-Geschwindigkeit`: Regelt die Geschwindigkeit des Zooms.
- `Checkout-Zoom`: Schaltet den Checkout-Zoom für klare Ein-Dart-Finishes ein oder aus.
- `Debug`: Aktiviert zusätzliche Debug-Ausgaben für die Fehlersuche.

![TV Board Zoom](screenshots/animation-tv-board-zoom.gif)

### Style Checkout Suggestions

- Gilt für: `X01`
- Kurz: Checkout-Empfehlungen werden auffälliger, strukturierter und besser lesbar gestaltet.
- Grafisch: Der sichtbare Vorschlagsblock erhält je nach Stil eine Badge-, Ribbon-, Stripe-, Ticket- oder Outline-Optik. Optional sitzt darüber ein eigenes Label wie `CHECKOUT` oder `FINISH`.
- `Stil`: Wechselt die Hülle des Checkout-Vorschlags.
- `Labeltext`: Legt den festen Labeltext über dem Vorschlag fest oder blendet ihn aus.
- `Farbthema`: Wählt die Akzentfarbe des Suggestion-Styles.
- `Debug`: Aktiviert zusätzliche Debug-Ausgaben für die Fehlersuche.

![Style Checkout Suggestions](screenshots/animation-style-checkout-suggestions.png)
![Format Badge](screenshots/animation-style-checkout-suggestions-format-badge-readme.png)
![Format Stripe](screenshots/animation-style-checkout-suggestions-format-stripe-readme.png)
![Format Ticket](screenshots/animation-style-checkout-suggestions-format-ticket-readme.png)
![Format Outline](screenshots/animation-style-checkout-suggestions-format-outline-readme.png)

## Animationen für Cricket und Tactics

### Cricket Highlighter

- Gilt für: `Cricket`, `Tactics`
- Kurz: Zielzustände und Drucksituationen werden direkt am Board sichtbar.
- Grafisch: Board-Segmente erhalten je nach Zustand farbige Overlays. Relevante Ziele leuchten grün oder rot, irrelevante Felder werden je nach Stil abgeschwächt, geschraffiert oder maskiert.
- `OPEN-Ziele anzeigen`: Zeigt offene Ziele zusätzlich am Board an.
- `DEAD-Ziele anzeigen`: Zeigt erledigte Ziele weiter als `DEAD` an.
- `Irrelevante Felder abdunkeln`: Bestimmt den Abdunkelungsstil für irrelevante Felder.
- `Farbthema`: Passt die Farben für Scoring- und Druckzustände an.
- `Intensität`: Regelt Deckkraft und Sichtbarkeit der Board-Overlays.
- `Debug`: Aktiviert zusätzliche Debug-Ausgaben für die Fehlersuche.

![Cricket Target Highlighter](screenshots/animation-cricket-target-highlighter.png)

### Cricket Grid FX

- Gilt für: `Cricket`, `Tactics`
- Kurz: Zusätzliche Live-Effekte direkt in der Cricket-/Tactics-Matrix.
- Grafisch: Zellen, Zeilen, Labels und Badges reagieren mit grünen und roten Zuständen, kurzen Chips, Kanten und Übergängen. So werden Fortschritt, Gegnerdruck und Zugwechsel in der Matrix selbst sichtbarer.
- `Zeilen-Sweep`: Lässt nach Änderungen einen kurzen Lichtlauf über die Zeile laufen.
- `Ziel-Badge-Hinweis`: Verstärkt Ziel-Badges und Labelzellen mit zusätzlichem Glow.
- `Mark-Fortschritt`: Betont die Mark-Stufen in den Spielerzellen.
- `PRESSURE-Kante`: Zeichnet bei Gegnerdruck eine rote Warnkante.
- `SCORING-Streifen`: Hebt offensiv scorable Bereiche grün hervor.
- `DEAD-Zeilen abdunkeln`: Dunkelt `DEAD`-Zeilen optisch ab.
- `Delta-Chips`: Zeigt kurz `+1`, `+2` oder `+3` direkt an der Matrix an.
- `Treffer-Impuls`: Erzeugt einen kurzen Trefferfunken am betroffenen Bereich.
- `Zugwechsel-Übergang`: Kennzeichnet den Zugwechsel mit einem kurzen Matrix-Übergang.
- `PRESSURE-Overlay`: Legt bei Gegnerdruck eine zusätzliche rote Druckfläche über betroffene Bereiche.
- `Farbthema`: Passt die Farben der Grid-Effekte an.
- `Intensität`: Regelt die Gesamtstärke der Grid-Effekte.
- `Debug`: Aktiviert zusätzliche Debug-Ausgaben für die Fehlersuche.

![Cricket Grid FX](screenshots/animation-cricket-grid-fx.png)

## Animationen für alle Modi

### Average Trend Arrow

- Gilt für: `alle Modi`
- Kurz: Ein kleiner Pfeil direkt am AVG zeigt kurz die Trendrichtung.
- Grafisch: Bei einer AVG-Änderung erscheint neben dem Wert kurz ein grüner Aufwärtspfeil oder roter Abwärtspfeil und verschwindet nach der eingestellten Zeit wieder.
- `Animationsdauer`: Legt fest, wie lange der Pfeil sichtbar bleibt.
- `Pfeil-Größe`: Passt Größe und Abstand des Pfeils an.
- `Debug`: Aktiviert zusätzliche Debug-Ausgaben für die Fehlersuche.

![Average Trend Arrow](screenshots/animation-average-trend-arrow.png)

### Turn Start Sweep

- Gilt für: `alle Modi`
- Kurz: Beim Spielerwechsel läuft ein kurzer Sweep über die aktive Karte.
- Grafisch: Eine helle, halbtransparente Bahn zieht einmal quer über die aktive Karte. So springt der neue Zugwechsel schneller ins Auge.
- `Sweep-Geschwindigkeit`: Bestimmt das Tempo des Sweeps.
- `Sweep-Stil`: Regelt Breite und Helligkeit des Sweeps.
- `Debug`: Aktiviert zusätzliche Debug-Ausgaben für die Fehlersuche.

![Turn Start Sweep](screenshots/animation-turn-start-sweep.gif)

### Triple/Double/Bull Hits

- Gilt für: `alle Modi`
- Kurz: Treffer wie `T20`, `D16` oder `BULL` springen in der Wurfliste schneller ins Auge.
- Grafisch: Die betroffenen Einträge in der Wurfliste erhalten eine zusätzliche Hervorhebung, sobald das Modul sie erkennt. So lassen sich starke Treffer in schnellen Legs leichter nachverfolgen.
- `Triple hervorheben`: Schaltet die Hervorhebung für Triple-Treffer ein oder aus.
- `Double hervorheben`: Schaltet die Hervorhebung für Double-Treffer ein oder aus.
- `Bull hervorheben`: Schaltet die Hervorhebung für Bull-Treffer ein oder aus.
- `Aktualisierungsmodus`: Wechselt zwischen reiner Live-Reaktion und zusätzlichem 3-Sekunden-Fallback.
- `Debug`: Aktiviert zusätzliche Debug-Ausgaben für die Fehlersuche.

![Triple Double Bull Hits](screenshots/animation-triple-double-bull-hits.gif)

### Dart Marker Emphasis

- Gilt für: `alle Modi`
- Kurz: Treffer-Marker auf dem virtuellen Board werden deutlicher sichtbar.
- Grafisch: Die bestehenden Marker werden größer, farbiger und auf Wunsch mit Pulse, Glow oder Outline versehen. Das Modul ersetzt die Marker nicht, sondern betont sie.
- `Marker-Größe`: Vergrößert oder verkleinert die Marker.
- `Marker-Farbe`: Wählt die Hauptfarbe des Markers.
- `Effekt`: Schaltet zwischen Glow, Pulse oder keiner Zusatzanimation um.
- `Marker-Sichtbarkeit`: Regelt die Deckkraft der Marker.
- `Outline-Farbe`: Fügt optional eine helle oder dunkle Outline hinzu.
- `Debug`: Aktiviert zusätzliche Debug-Ausgaben für die Fehlersuche.

![Dart Marker Emphasis](screenshots/animation-dart-marker-emphasis.gif)

### Dart Marker Darts

- Gilt für: `alle Modi`
- Kurz: Standardmarker können durch kleine Dart-Grafiken ersetzt werden.
- Grafisch: Statt des normalen Markers liegt ein Dart-Bild im getroffenen Segment. Auf Wunsch fliegt der Dart sichtbar ein, bevor er an seiner Zielposition landet.
- `Dart Design`: Wählt das Bilddesign der eingeblendeten Darts.
- `Dart-Fluganimation`: Schaltet die Fluganimation der Dart-Bilder ein oder aus.
- `Dart-Größe`: Passt die Größe der Dart-Grafiken an.
- `Original-Marker ausblenden`: Blendet die ursprünglichen Marker zugunsten der Dart-Grafiken aus.
- `Fluggeschwindigkeit`: Regelt die Dauer der Fluganimation.
- `Debug`: Aktiviert zusätzliche Debug-Ausgaben für die Fehlersuche.

![Dart Marker Darts](screenshots/animation-dart-marker-darts.png)

### Remove Darts Notification

- Gilt für: `alle Modi`
- Kurz: Der Hinweis zum Entfernen der Darts wird als große Grafik deutlich präsenter dargestellt.
- Grafisch: Der normale Hinweis wird durch eine zentrierte Bildkarte ersetzt. Optional pulsiert die Grafik leicht, damit sie im Spielablauf nicht übersehen wird.
- `Bildgröße`: Bestimmt die Größe der Hinweisgrafik.
- `Pulse-Animation`: Schaltet die Pulsbewegung der Hinweisgrafik ein oder aus.
- `Pulse-Stärke`: Regelt die Stärke der Pulsbewegung.
- `Debug`: Aktiviert zusätzliche Debug-Ausgaben für die Fehlersuche.

![Remove Darts Notification](screenshots/animation-remove-darts-notification.png)

### Single Bull Sound

- Gilt für: `alle Modi`
- Kurz: Bei Single Bull hörst du einen kurzen Ton; grafisch bleibt das Spiel unverändert.
- Grafisch: Es wird keine zusätzliche Grafik eingeblendet. Die Rückmeldung ist rein akustisch und reagiert auf erkannte Single-Bull-Treffer.
- `Lautstärke`: Regelt die Lautstärke des Single-Bull-Sounds.
- `Wiederholsperre`: Legt die Sperrzeit zwischen zwei Sound-Auslösungen fest.
- `Fallback-Scan`: Schaltet optional einen zusätzlichen 1200-ms-Fallback-Scan ein.
- `Debug`: Aktiviert zusätzliche Debug-Ausgaben für die Fehlersuche.

### Turn Points Count

- Gilt für: `alle Modi`
- Kurz: Punkteänderungen beim Turn werden sichtbar hoch- oder heruntergezählt.
- Grafisch: Statt eines harten Sprungs läuft der angezeigte Wert weich zur neuen Punktzahl. Dadurch wird die Änderung als kurze Animation nachvollziehbar.
- `Animationsdauer`: Bestimmt die Dauer des Hoch- oder Herunterzählens.
- `Debug`: Aktiviert zusätzliche Debug-Ausgaben für die Fehlersuche.

![Turn Points Count](screenshots/animation-turn-points-count.gif)
![Turn Points Count Detail](screenshots/animation-turn-points-count-detail-readme.gif)

### Winner Fireworks

- Gilt für: `alle Modi`
- Kurz: Bei einem Sieg erscheint ein Vollbild-Effekt im gewählten Feuerwerksstil.
- Grafisch: Je nach Stil starten Konfetti- oder Feuerwerksmuster über den gesamten Bildschirm. Farben, Dichte und Geschwindigkeit folgen dem gewählten Stil und der Intensität.
- `Style`: Wählt das Bewegungsmuster des Siegereffekts.
- `Farbe`: Wählt die Farbpalette des Siegereffekts.
- `Intensität`: Regelt Dichte und Energie des Siegereffekts.
- `Test-Button`: Startet die aktuelle Konfiguration sofort als Vorschau.
- `Bei Bull-Out aktiv`: Legt fest, ob der Effekt auch bei Bull-Out aktiv ist.
- `Klick beendet Effekt`: Erlaubt das Beenden des Effekts per Klick.
- `Debug`: Aktiviert zusätzliche Debug-Ausgaben für die Fehlersuche.

![Winner Fireworks](screenshots/animation-winner-fireworks.gif)
![xConfig Test-Button](screenshots/xConfig-testbutton.png)

## Hinweise zur Konfiguration

- Alle Einstellungen werden lokal gespeichert.
- Theme-Hintergründe werden pro Theme als Data-URL abgelegt.
- Aktivierungen, Theme-Bilder und Feineinstellungen bleiben nach Reload erhalten.
- `Winner Fireworks` besitzt wieder einen integrierten Test-Button in AD xConfig.
