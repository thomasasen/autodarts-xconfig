# Autodarts xConfig

> Visuelle Erweiterungen für Autodarts: bessere Lesbarkeit, klarere Hinweise, Themes und optionale Effekte.  
> Die Spiellogik bleibt unverändert.

[![Installieren](https://img.shields.io/badge/Installieren-autodarts--xconfig.user.js-1f6feb?style=for-the-badge)](https://raw.githubusercontent.com/thomasasen/autodarts-xconfig/main/dist/autodarts-xconfig.user.js)

## Für wen ist das gedacht?

`autodarts-xconfig` richtet sich an Spieler, die in Autodarts schneller erkennen wollen, was gerade wichtig ist: Checkouts, Spielerwechsel, Trends, Zielzustände oder einfach ein ruhigeres Theme.

Die Module lassen sich direkt im Spiel über **AD xConfig** aktivieren, kombinieren und anpassen. In jeder Modul-Karte findest du:

- `⚙ Einstellungen` für die sofort wirksame Konfiguration
- `📖 README` für die passende Erklärung in dieser Datei

## Schnellstart

1. Tampermonkey installieren: [tampermonkey.net](https://www.tampermonkey.net/)
2. Auf den Install-Button oben klicken
3. `https://play.autodarts.io/` neu laden
4. In der linken Navigation **AD xConfig** öffnen
5. Module aktivieren und Einstellungen direkt im Spiel anpassen

![AD xConfig Menü und Oberfläche](docs/screenshots/ad-xconfig.png)

Wenn Tampermonkey einen Injection-Hinweis zeigt, aktiviere die empfohlene Browser-Einstellung:

![Tampermonkey Injection-Hinweis](docs/screenshots/tempermonkey-injection.png)

## Was ist enthalten?

- 5 Themes
- 15 Animationen und Komfortfunktionen
- Zentrale In-Game-Konfiguration im Menü **AD xConfig**
- Persistente Speicherung der Einstellungen inklusive Theme-Hintergründen
- Direkte README-Verlinkung aus der xConfig-Oberfläche

Hinweis: Die Option `Debug` ist in allen Modulen nur für Fehlersuche gedacht. Im normalen Spielbetrieb sollte sie deaktiviert bleiben.

## Schnellnavigation

### Themen

- [Theme X01](#template-autodarts-theme-x01)
- [Theme Shanghai](#template-autodarts-theme-shanghai)
- [Theme Bermuda](#template-autodarts-theme-bermuda)
- [Theme Cricket](#template-autodarts-theme-cricket)
- [Theme Bull-off](#template-autodarts-theme-bull-off)

### Animationen und Komfort

- [Checkout Score Pulse](#animation-autodarts-animate-checkout-score-pulse)
- [Checkout Board Targets](#animation-autodarts-animate-checkout-board-targets)
- [TV Board Zoom](#animation-autodarts-animate-tv-board-zoom)
- [Style Checkout Suggestions](#animation-autodarts-style-checkout-suggestions)
- [Average Trend Arrow](#animation-autodarts-animate-average-trend-arrow)
- [Turn Start Sweep](#animation-autodarts-animate-turn-start-sweep)
- [Triple/Double/Bull Hits](#animation-autodarts-animate-triple-double-bull-hits)
- [Cricket Highlighter](#animation-autodarts-animate-cricket-target-highlighter)
- [Cricket Grid FX](#animation-autodarts-animate-cricket-grid-fx)
- [Dart Marker Emphasis](#animation-autodarts-animate-dart-marker-emphasis)
- [Dart Marker Darts](#animation-autodarts-animate-dart-marker-darts)
- [Remove Darts Notification](#animation-autodarts-animate-remove-darts-notification)
- [Single Bull Sound](#animation-autodarts-animate-single-bull-sound)
- [Turn Points Count](#animation-autodarts-animate-turn-points-count)
- [Winner Fireworks](#animation-autodarts-animate-winner-fireworks)

## Themen

<a id="template-autodarts-theme-x01"></a>

### Theme X01

- Gilt für: `X01`
- Was macht es sichtbar? Ein ruhiges X01-Layout mit eigener Bildfläche und optionaler AVG-Zeile.
- Grafisch: Farben, Flächen und Karten werden neu gestaltet; ein eigenes Hintergrundbild liegt hinter dem Spielbereich, während die Grundstruktur des X01-Layouts erhalten bleibt.
- Wann sinnvoll? Wenn dir das Standardlayout zu unruhig ist oder du X01 optisch personalisieren möchtest.

**Einstellungen einfach erklärt**

- `AVG anzeigen`: Schaltet die AVG-Anzeige im X01-Theme sichtbar an oder aus. Grafisch bleibt das Layout gleich, nur der AVG-Bereich erscheint oder verschwindet.
- `Hintergrund-Darstellung`: Bestimmt, ob ein eigenes Theme-Bild den Bereich füllt, eingepasst wird, gestreckt erscheint, mittig ohne Skalierung liegt oder gekachelt wiederholt wird. Grafisch ändert sich die Bildplatzierung, nicht die Struktur des Themes.
- `Hintergrundbild-Deckkraft`: Steuert, wie stark das gespeicherte Hintergrundbild durch die dunkle Theme-Überlagerung durchscheint. Hohe Werte zeigen das Bild klarer, niedrige Werte dämpfen es stärker zugunsten der Lesbarkeit.
- `Spielerfelder-Transparenz`: Passt die Transparenz der Spielerflächen an. Hohe Werte lassen mehr vom Hintergrund durch, niedrige Werte machen die Flächen geschlossener und ruhiger.
- `Debug`: Aktiviert zusätzliche Debug-Ausgaben und Diagnosehinweise. Für den normalen Spielbetrieb ist die Option nicht gedacht und sollte in der Regel ausgeschaltet bleiben.
- `Hintergrundbild hochladen`: Öffnet die Dateiauswahl und speichert das gewählte Bild ausschließlich für dieses Theme. Das Bild wird lokal gesichert und nach Reloads wieder für genau dieses Theme verwendet.
- `Hintergrundbild entfernen`: Löscht nur den lokalen Bild-Override dieses Themes. Das Theme bleibt aktiv, verwendet danach aber wieder kein eigenes gespeichertes Hintergrundbild.

![Theme X01 in AD xConfig](docs/screenshots/template-theme-x01-xConfig.png)
![Theme X01 Vorschau Standard](docs/screenshots/template-theme-x01-preview-standard-readme.png)
![Theme X01 Vorschau unter Würfen](docs/screenshots/template-theme-x01-preview-under-throws-readme.png)

<a id="template-autodarts-theme-shanghai"></a>

### Theme Shanghai

- Gilt für: `Shanghai`
- Was macht es sichtbar? Ein aufgeräumtes Shanghai-Layout mit optionaler AVG-Zeile und ruhigerem Kontrast.
- Grafisch: Das Theme ordnet Flächen und Farben neu, ohne den Spielaufbau zu verändern. Ein eigenes Hintergrundbild liegt hinter der Oberfläche und kann die Wirkung zusätzlich prägen.
- Wann sinnvoll? Wenn du in Shanghai mehr Struktur und weniger visuelle Unruhe möchtest.

**Einstellungen einfach erklärt**

- `AVG anzeigen`: Schaltet die AVG-Anzeige im Shanghai-Theme sichtbar an oder aus. Das restliche Theme bleibt unverändert; nur der AVG-Bereich wird ein- oder ausgeblendet.
- `Hintergrund-Darstellung`: Bestimmt, ob ein eigenes Theme-Bild den Bereich füllt, eingepasst wird, gestreckt erscheint, mittig ohne Skalierung liegt oder gekachelt wiederholt wird. Grafisch ändert sich die Bildplatzierung, nicht die Struktur des Themes.
- `Hintergrundbild-Deckkraft`: Steuert, wie stark das gespeicherte Hintergrundbild durch die dunkle Theme-Überlagerung durchscheint. Hohe Werte zeigen das Bild klarer, niedrige Werte dämpfen es stärker zugunsten der Lesbarkeit.
- `Spielerfelder-Transparenz`: Passt die Transparenz der Spielerflächen an. Hohe Werte lassen mehr vom Hintergrund durch, niedrige Werte machen die Flächen geschlossener und ruhiger.
- `Debug`: Aktiviert zusätzliche Debug-Ausgaben und Diagnosehinweise. Für den normalen Spielbetrieb ist die Option nicht gedacht und sollte in der Regel ausgeschaltet bleiben.
- `Hintergrundbild hochladen`: Öffnet die Dateiauswahl und speichert das gewählte Bild ausschließlich für dieses Theme. Das Bild wird lokal gesichert und nach Reloads wieder für genau dieses Theme verwendet.
- `Hintergrundbild entfernen`: Löscht nur den lokalen Bild-Override dieses Themes. Das Theme bleibt aktiv, verwendet danach aber wieder kein eigenes gespeichertes Hintergrundbild.

![Theme Shanghai in AD xConfig](docs/screenshots/template-theme-shanghai-xConfig.png)

<a id="template-autodarts-theme-bermuda"></a>

### Theme Bermuda

- Gilt für: `Bermuda`
- Was macht es sichtbar? Ein ruhigeres Bermuda-Layout mit eigener Bildfläche im Hintergrund.
- Grafisch: Das Theme passt Farben und Flächen für Bermuda an; ein gespeichertes Hintergrundbild liegt hinter dem Spielbereich, während die Bermuda-Anordnung selbst erhalten bleibt.
- Wann sinnvoll? Wenn Bermuda besser lesbar sein soll, ohne viele Zusatzschalter zu benötigen.

**Einstellungen einfach erklärt**

- `Hintergrund-Darstellung`: Bestimmt, ob ein eigenes Theme-Bild den Bereich füllt, eingepasst wird, gestreckt erscheint, mittig ohne Skalierung liegt oder gekachelt wiederholt wird. Grafisch ändert sich die Bildplatzierung, nicht die Struktur des Themes.
- `Hintergrundbild-Deckkraft`: Steuert, wie stark das gespeicherte Hintergrundbild durch die dunkle Theme-Überlagerung durchscheint. Hohe Werte zeigen das Bild klarer, niedrige Werte dämpfen es stärker zugunsten der Lesbarkeit.
- `Spielerfelder-Transparenz`: Passt die Transparenz der Spielerflächen an. Hohe Werte lassen mehr vom Hintergrund durch, niedrige Werte machen die Flächen geschlossener und ruhiger.
- `Debug`: Aktiviert zusätzliche Debug-Ausgaben und Diagnosehinweise. Für den normalen Spielbetrieb ist die Option nicht gedacht und sollte in der Regel ausgeschaltet bleiben.
- `Hintergrundbild hochladen`: Öffnet die Dateiauswahl und speichert das gewählte Bild ausschließlich für dieses Theme. Das Bild wird lokal gesichert und nach Reloads wieder für genau dieses Theme verwendet.
- `Hintergrundbild entfernen`: Löscht nur den lokalen Bild-Override dieses Themes. Das Theme bleibt aktiv, verwendet danach aber wieder kein eigenes gespeichertes Hintergrundbild.

![Theme Bermuda in AD xConfig](docs/screenshots/template-theme-bermuda-xConfig.png)

<a id="template-autodarts-theme-cricket"></a>

### Theme Cricket

- Gilt für: `Cricket`, `Tactics`
- Was macht es sichtbar? Ein gemeinsames Theme für Cricket und Tactics mit ruhigerer Grundoptik und optionaler AVG-Zeile.
- Grafisch: Farben, Karten und Hintergründe werden auf eine gemeinsame Cricket-/Tactics-Optik gezogen. Ein eigenes Bild kann hinter dem Spielbereich liegen, ohne die Board- oder Grid-Logik zu verändern.
- Wann sinnvoll? Wenn du für Cricket und Tactics eine einheitliche visuelle Basis möchtest, besonders zusammen mit den Cricket-Effekten.

**Einstellungen einfach erklärt**

- `AVG anzeigen`: Schaltet die AVG-Anzeige im Cricket-/Tactics-Theme an oder aus. Grafisch bleibt das Theme gleich; nur der AVG-Bereich erscheint oder verschwindet.
- `Hintergrund-Darstellung`: Bestimmt, ob ein eigenes Theme-Bild den Bereich füllt, eingepasst wird, gestreckt erscheint, mittig ohne Skalierung liegt oder gekachelt wiederholt wird. Grafisch ändert sich die Bildplatzierung, nicht die Struktur des Themes.
- `Hintergrundbild-Deckkraft`: Steuert, wie stark das gespeicherte Hintergrundbild durch die dunkle Theme-Überlagerung durchscheint. Hohe Werte zeigen das Bild klarer, niedrige Werte dämpfen es stärker zugunsten der Lesbarkeit.
- `Spielerfelder-Transparenz`: Passt die Transparenz der Spielerflächen an. Hohe Werte lassen mehr vom Hintergrund durch, niedrige Werte machen die Flächen geschlossener und ruhiger.
- `Debug`: Aktiviert zusätzliche Debug-Ausgaben und Diagnosehinweise. Für den normalen Spielbetrieb ist die Option nicht gedacht und sollte in der Regel ausgeschaltet bleiben.
- `Hintergrundbild hochladen`: Öffnet die Dateiauswahl und speichert das gewählte Bild ausschließlich für dieses Theme. Das Bild wird lokal gesichert und nach Reloads wieder für genau dieses Theme verwendet.
- `Hintergrundbild entfernen`: Löscht nur den lokalen Bild-Override dieses Themes. Das Theme bleibt aktiv, verwendet danach aber wieder kein eigenes gespeichertes Hintergrundbild.

![Theme Cricket in AD xConfig](docs/screenshots/template-theme-cricket-xConfig.png)

<a id="template-autodarts-theme-bull-off"></a>

### Theme Bull-off

- Gilt für: `Bull-off`
- Was macht es sichtbar? Ein kontrastbetontes Bull-off-Layout mit wählbarer Stärke und eigener Bildfläche.
- Grafisch: Das Theme verändert Farben, Kontrast und Flächen speziell für Bull-off. Ein optionales Hintergrundbild liegt dahinter, während der Spielaufbau gleich bleibt.
- Wann sinnvoll? Wenn Bull-off auf helleren Displays oder aus der Distanz klarer lesbar sein soll.

**Einstellungen einfach erklärt**

- `Kontrast-Preset`: Wählt, wie stark Texte, Flächen und Hervorhebungen im Bull-off-Theme voneinander abgesetzt werden. Grafisch wirkt `Sanft` zurückhaltender, `Kräftig` zeichnet Kanten und Kontraste deutlich härter.
- `Hintergrund-Darstellung`: Bestimmt, ob ein eigenes Theme-Bild den Bereich füllt, eingepasst wird, gestreckt erscheint, mittig ohne Skalierung liegt oder gekachelt wiederholt wird. Grafisch ändert sich die Bildplatzierung, nicht die Struktur des Themes.
- `Hintergrundbild-Deckkraft`: Steuert, wie stark das gespeicherte Hintergrundbild durch die dunkle Theme-Überlagerung durchscheint. Hohe Werte zeigen das Bild klarer, niedrige Werte dämpfen es stärker zugunsten der Lesbarkeit.
- `Spielerfelder-Transparenz`: Passt die Transparenz der Spielerflächen an. Hohe Werte lassen mehr vom Hintergrund durch, niedrige Werte machen die Flächen geschlossener und ruhiger.
- `Debug`: Aktiviert zusätzliche Debug-Ausgaben und Diagnosehinweise. Für den normalen Spielbetrieb ist die Option nicht gedacht und sollte in der Regel ausgeschaltet bleiben.
- `Hintergrundbild hochladen`: Öffnet die Dateiauswahl und speichert das gewählte Bild ausschließlich für dieses Theme. Das Bild wird lokal gesichert und nach Reloads wieder für genau dieses Theme verwendet.
- `Hintergrundbild entfernen`: Löscht nur den lokalen Bild-Override dieses Themes. Das Theme bleibt aktiv, verwendet danach aber wieder kein eigenes gespeichertes Hintergrundbild.

![Theme Bull-off in AD xConfig](docs/screenshots/template-theme-bull-off-xConfig.png)

## Animationen und Komfort

<a id="animation-autodarts-animate-checkout-score-pulse"></a>

### Checkout Score Pulse

- Gilt für: `X01`
- Was macht es sichtbar? Finishfähige Restwerte werden direkt an der aktiven Punktzahl hervorgehoben.
- Grafisch: Die aktive Restpunktzahl pulsiert, glüht, skaliert oder blinkt je nach gewähltem Effekt. Die Hervorhebung sitzt direkt am Score und verändert keine anderen UI-Bereiche.
- Wann sinnvoll? Wenn du Checkout-Momente schneller am Score erkennen möchtest.

**Einstellungen einfach erklärt**

- `Effekt`: Legt fest, wie die aktive Restpunktzahl hervorgehoben wird, sobald das Modul ein Checkout erkennt. Grafisch ändert sich nur die Animationsart des Score-Elements.
- `Farbthema`: Bestimmt die Farbe, mit der die aktive Restpunktzahl hervorgehoben wird. Die gewählte Farbe steuert Glanz, Schatten und das visuelle Gewicht des Effekts.
- `Intensität`: Steuert Skalierung, Leuchtstärke und Sichtbarkeit des Checkout-Score-Effekts. `Dezent` bleibt zurückhaltend, `Stark` wirkt deutlich auffälliger.
- `Trigger-Quelle`: Bestimmt, woran das Modul das Checkout erkennt. `Vorschlag zuerst` nutzt den sichtbaren Checkout-Vorschlag bevorzugt und fällt nur ohne Vorschlag auf die reine Score-Prüfung zurück; die anderen Modi erzwingen ausschließlich Score- oder Vorschlagslogik.
- `Debug`: Aktiviert zusätzliche Debug-Ausgaben und Diagnosehinweise. Für den normalen Spielbetrieb ist die Option nicht gedacht und sollte in der Regel ausgeschaltet bleiben.

![Checkout Score Pulse](docs/screenshots/animation-checkout-score-pulse.gif)

<a id="animation-autodarts-animate-checkout-board-targets"></a>

### Checkout Board Targets

- Gilt für: `X01`
- Was macht es sichtbar? Mögliche Checkout-Ziele werden direkt am virtuellen Board markiert.
- Grafisch: Die relevanten Segmente erhalten eine farbige Füllung, Kontur und Animation. So siehst du am Board selbst, welches Ziel aktuell für den Checkout relevant ist.
- Wann sinnvoll? Wenn du Finish-Wege nicht nur lesen, sondern direkt am Board sehen willst.

**Einstellungen einfach erklärt**

- `Effekt`: Wählt die Animationsart der markierten Board-Segmente. Die Segmentauswahl bleibt gleich; nur die Bewegung und Leuchtwirkung ändern sich.
- `Zielumfang`: Bestimmt, wie viele Board-Ziele gleichzeitig hervorgehoben werden. `Erstes Ziel` fokussiert den nächsten Wurf, `Alle Ziele` zeigt die komplette aktuell sinnvolle Checkout-Kette, soweit das Modul sie am Board abbildet.
- `Single-Ring`: Wirkt nur dann, wenn ein Checkout-Segment ein Single-Feld ist. Grafisch kann die Markierung auf den inneren Single-Ring, den äußeren Ring oder beide gelegt werden.
- `Farbthema`: Wählt das Farbschema für Füllung, Kontur und Leuchteffekt der Checkout-Ziele. Die Segmentlogik bleibt unverändert; nur die visuelle Farbwirkung wechselt.
- `Kontur-Intensität`: Steuert Deckkraft, Breite und Animation der weißen Umrandung. Hohe Stufen zeichnen die Zielkontur sichtbarer und mit kräftigerem Puls.
- `Debug`: Aktiviert zusätzliche Debug-Ausgaben und Diagnosehinweise. Für den normalen Spielbetrieb ist die Option nicht gedacht und sollte in der Regel ausgeschaltet bleiben.

![Checkout Board Targets](docs/screenshots/animation-checkout-board-targets.gif)

<a id="animation-autodarts-animate-tv-board-zoom"></a>

### TV Board Zoom

- Gilt für: `X01`
- Was macht es sichtbar? Bei klaren X01-Zielsituationen zoomt die Ansicht kurz auf relevante Board-Bereiche.
- Grafisch: Das Board wird temporär vergrößert, damit relevante Segmente mehr Platz bekommen. Die Kamera springt nicht hart, sondern fährt mit einer kurzen Ein- und Ausblendung hinein und zurück.
- Wann sinnvoll? Wenn du beim dritten Dart oder bei klaren Finishes mehr Fokus auf den Zielbereich möchtest.

**Einstellungen einfach erklärt**

- `Zoom-Stufe`: Legt fest, wie weit das Modul in den relevanten Board-Bereich hineinzoomt. Hohe Stufen zeigen weniger Umgebung und mehr Zielsegment.
- `Zoom-Geschwindigkeit`: Wählt die Geschwindigkeits- und Easing-Vorgabe für Ein- und Auszoomung. `Schnell` wirkt direkter, `Langsam` fährt sichtbar weicher ein und aus.
- `Checkout-Zoom`: Aktiviert oder deaktiviert den Zoom auf eindeutige Ein-Dart-Checkout-Situationen in den ersten beiden Würfen. Andere Zoom-Fälle, etwa der spezielle `T20`-Setup-Fokus nach zwei `T20`, werden dadurch nicht grundsätzlich abgeschaltet.
- `Debug`: Aktiviert zusätzliche Debug-Ausgaben und Diagnosehinweise. Für den normalen Spielbetrieb ist die Option nicht gedacht und sollte in der Regel ausgeschaltet bleiben.

![TV Board Zoom](docs/screenshots/animation-tv-board-zoom.gif)

<a id="animation-autodarts-style-checkout-suggestions"></a>

### Style Checkout Suggestions

- Gilt für: `X01`
- Was macht es sichtbar? Checkout-Empfehlungen werden auffälliger, strukturierter und besser lesbar gestaltet.
- Grafisch: Der sichtbare Vorschlagsblock erhält je nach Stil eine Badge-, Ribbon-, Stripe-, Ticket- oder Outline-Optik. Optional sitzt darüber ein eigenes Label wie `CHECKOUT` oder `FINISH`.
- Wann sinnvoll? Wenn du Suggestionen schneller scannen möchtest oder der Standard-Look zu unauffällig ist.

**Einstellungen einfach erklärt**

- `Stil`: Legt die Grundform des Suggestions-Containers fest. Grafisch ändert sich die Hülle des vorhandenen Vorschlags, nicht sein Inhalt.
- `Labeltext`: Bestimmt, welcher feste Labeltext über dem gestylten Checkout-Vorschlag erscheint. `Kein Label` blendet diese Zusatzmarke vollständig aus.
- `Farbthema`: Steuert Akzentfarbe, Hintergründe und Leuchteffekte des Suggestion-Styles. Die inhaltliche Checkout-Empfehlung bleibt unverändert.
- `Debug`: Aktiviert zusätzliche Debug-Ausgaben und Diagnosehinweise. Für den normalen Spielbetrieb ist die Option nicht gedacht und sollte in der Regel ausgeschaltet bleiben.

![Style Checkout Suggestions](docs/screenshots/animation-style-checkout-suggestions.png)
![Format Badge](docs/screenshots/animation-style-checkout-suggestions-format-badge-readme.png)
![Format Stripe](docs/screenshots/animation-style-checkout-suggestions-format-stripe-readme.png)
![Format Ticket](docs/screenshots/animation-style-checkout-suggestions-format-ticket-readme.png)
![Format Outline](docs/screenshots/animation-style-checkout-suggestions-format-outline-readme.png)

<a id="animation-autodarts-animate-average-trend-arrow"></a>

### Average Trend Arrow

- Gilt für: `alle Modi`
- Was macht es sichtbar? Ein kleiner Pfeil direkt am AVG zeigt kurz die Trendrichtung.
- Grafisch: Bei einer AVG-Änderung erscheint neben dem Wert kurz ein grüner Aufwärtspfeil oder roter Abwärtspfeil und verschwindet nach der eingestellten Zeit wieder.
- Wann sinnvoll? Wenn du Formwechsel während eines Legs schnell am AVG erkennen möchtest.

**Einstellungen einfach erklärt**

- `Animationsdauer`: Bestimmt die Laufzeit der einmaligen Pfeil-Animation nach einer AVG-Änderung. Längere Stufen lassen den Richtungsimpuls spürbar länger stehen.
- `Pfeil-Größe`: Steuert Breite, Höhe und Abstand des Pfeils direkt neben der AVG-Anzeige. Größere Stufen sind aus mehr Abstand leichter erkennbar.
- `Debug`: Aktiviert zusätzliche Debug-Ausgaben und Diagnosehinweise. Für den normalen Spielbetrieb ist die Option nicht gedacht und sollte in der Regel ausgeschaltet bleiben.

![Average Trend Arrow](docs/screenshots/animation-average-trend-arrow.png)

<a id="animation-autodarts-animate-turn-start-sweep"></a>

### Turn Start Sweep

- Gilt für: `alle Modi`
- Was macht es sichtbar? Beim Spielerwechsel läuft ein kurzer Sweep über die aktive Karte.
- Grafisch: Eine helle, halbtransparente Bahn zieht einmal quer über die aktive Karte. So springt der neue Zugwechsel schneller ins Auge.
- Wann sinnvoll? Wenn du in schnellen Matches einen klareren Wechsel zwischen den Spielern sehen willst.

**Einstellungen einfach erklärt**

- `Sweep-Geschwindigkeit`: Legt die Gesamtdauer des Lichtlaufs fest. Kürzere Stufen wirken direkter, längere Stufen betonen den Wechsel stärker.
- `Sweep-Stil`: Wählt die optische Stärke des Sweeps. `Dezent` nutzt eine schmalere und schwächere Lichtbahn, `Kräftig` zeichnet sie breiter und heller.
- `Debug`: Aktiviert zusätzliche Debug-Ausgaben und Diagnosehinweise. Für den normalen Spielbetrieb ist die Option nicht gedacht und sollte in der Regel ausgeschaltet bleiben.

![Turn Start Sweep](docs/screenshots/animation-turn-start-sweep.gif)

<a id="animation-autodarts-animate-triple-double-bull-hits"></a>

### Triple/Double/Bull Hits

- Gilt für: `alle Modi`
- Was macht es sichtbar? Treffer wie `T20`, `D16` oder `BULL` springen in der Wurfliste schneller ins Auge.
- Grafisch: Die betroffenen Einträge in der Wurfliste erhalten eine zusätzliche Hervorhebung, sobald das Modul sie erkennt. So lassen sich starke Treffer in schnellen Legs leichter nachverfolgen.
- Wann sinnvoll? Für Training, Checkout-Fokus und mehr Lesbarkeit in schnellen Legs.

**Einstellungen einfach erklärt**

- `Triple hervorheben`: Bestimmt, ob Einträge wie `T20` oder andere Triple-Treffer in der Wurfliste gesondert hervorgehoben werden.
- `Double hervorheben`: Bestimmt, ob Double-Einträge wie `D16` oder `D20` in der Wurfliste gesondert hervorgehoben werden.
- `Bull hervorheben`: Bestimmt, ob `BULL`-Treffer in der Wurfliste zusätzlich markiert werden.
- `Aktualisierungsmodus`: `Nur live` reagiert ausschließlich auf erkannte DOM- und State-Updates. `Kompatibel` ergänzt dazu einen Polling-Fallback alle 3000 ms, falls der Live-Trigger in bestimmten Umgebungen nicht zuverlässig genug feuert.
- `Debug`: Aktiviert zusätzliche Debug-Ausgaben und Diagnosehinweise. Für den normalen Spielbetrieb ist die Option nicht gedacht und sollte in der Regel ausgeschaltet bleiben.

![Triple Double Bull Hits](docs/screenshots/animation-triple-double-bull-hits.gif)

<a id="animation-autodarts-animate-cricket-target-highlighter"></a>

### Cricket Highlighter

- Gilt für: `Cricket`, `Tactics`
- Was macht es sichtbar? Zielzustände und Drucksituationen werden direkt am Board sichtbar.
- Grafisch: Board-Segmente erhalten je nach Zustand farbige Overlays. Relevante Ziele leuchten grün oder rot, irrelevante Felder werden je nach Stil abgeschwächt, geschraffiert oder maskiert.
- Wann sinnvoll? Wenn du in Cricket oder Tactics schneller sehen möchtest, welche Ziele offen, scorable, unter Druck oder bereits erledigt sind.

**Einstellungen einfach erklärt**

- `OPEN-Ziele anzeigen`: Aktiviert sichtbare Open-Overlays für Ziele, die noch nicht geschlossen sind. Ohne diese Option konzentriert sich das Board stärker auf scorable, Druck- und Dead-Zustände.
- `DEAD-Ziele anzeigen`: Bestimmt, ob bereits erledigte Ziele weiterhin als tote Segmente sichtbar bleiben. Ist die Option aus, verschwinden diese Hinweise vom Board.
- `Irrelevante Felder abdunkeln`: Wählt den Stil für Felder, die im aktuellen Cricket-/Tactics-Zustand keine aktive Rolle spielen. `Aus` blendet die Abdunkelung ab, `Smoke` dämpft neutral, `Hatch+` ergänzt Schraffur und `Mask` legt eine besonders harte dunkle Maske darüber.
- `Farbthema`: Wechselt zwischen dem normalen Farbschema und einer kontraststärkeren Variante. Die Zustände bleiben gleich, nur Grün- und Rotwirkung werden optisch kräftiger.
- `Intensität`: Steuert Füllung, Kontur und Opazität der Zustands-Overlays. Hohe Stufen zeichnen offene, tote und druckrelevante Ziele sichtbarer.
- `Debug`: Aktiviert zusätzliche Debug-Ausgaben und Diagnosehinweise. Für den normalen Spielbetrieb ist die Option nicht gedacht und sollte in der Regel ausgeschaltet bleiben.

![Cricket Target Highlighter](docs/screenshots/animation-cricket-target-highlighter.png)

<a id="animation-autodarts-animate-cricket-grid-fx"></a>

### Cricket Grid FX

- Gilt für: `Cricket`, `Tactics`
- Was macht es sichtbar? Zusätzliche Live-Effekte direkt in der Cricket-/Tactics-Matrix.
- Grafisch: Zellen, Zeilen, Labels und Badges reagieren mit grünen und roten Zuständen, kurzen Chips, Kanten und Übergängen. So werden Fortschritt, Gegnerdruck und Zugwechsel in der Matrix selbst sichtbarer.
- Wann sinnvoll? Wenn du Fortschritt, Gegnerdruck und Wechsel im Grid klarer sehen willst.

**Einstellungen einfach erklärt**

- `Zeilen-Sweep`: Startet nach einer relevanten Zustandsänderung einen kurzen Zeilen-Sweep. Grafisch zieht eine helle Welle einmal über die betroffene Matrixzeile.
- `Ziel-Badge-Hinweis`: Verstärkt den Glow und die Sichtbarkeit der Ziel-Badges beziehungsweise Labelzellen, wenn sie für Scoring oder Druck relevant sind.
- `Mark-Fortschritt`: Hebt neue oder relevante Mark-Stufen in Spielerzellen sichtbar hervor. Grafisch werden die Mark-Level deutlicher ausgemalt und leichter voneinander unterscheidbar.
- `PRESSURE-Kante`: Ergänzt eine deutliche Druckkante, wenn eine Zeile oder Zelle unter relevantem Gegnerdruck steht. Die Kante dient als schneller Warnhinweis, ohne die komplette Zelle umzufärben.
- `SCORING-Streifen`: Zeichnet offensiv sinnvolle Scoring-Zeilen oder Zellen mit einer gut sichtbaren grünen Akzentfläche nach. So springen potenzielle Punkteziele schneller ins Auge.
- `DEAD-Zeilen abdunkeln`: Nimmt Zeilen, die im aktuellen Zustand als `DEAD` gelten, sichtbar zurück. Grafisch werden diese Bereiche matter und konkurrieren weniger mit aktiven Zielen.
- `Delta-Chips`: Blendet nach einer relevanten Änderung kurze Delta-Chips direkt an der Matrix ein. So ist sofort erkennbar, wie viele Marks gerade dazugekommen sind.
- `Treffer-Impuls`: Setzt auf der gerade betroffenen Zelle einen kleinen optischen Trefferfunken. Das ist ein punktueller Impuls und keine dauerhafte Färbung.
- `Zugwechsel-Übergang`: Legt beim Wechsel auf den nächsten Spieler einen sichtbaren Wipe über den betroffenen Matrixbereich. So wird der Turn-Übergang schneller lesbar.
- `PRESSURE-Overlay`: Ergänzt bei relevantem Gegnerdruck ein sichtbares Overlay zusätzlich zur Kante. So springt defensiver Druck auch dann ins Auge, wenn man nicht auf jede Zellfarbe achtet.
- `Farbthema`: Wechselt zwischen Standard und kontraststärkerer Farbpalette für offensive und druckbezogene Grid-Effekte. Die Zustandslogik selbst bleibt identisch.
- `Intensität`: Steuert Opazität, Leuchtkraft und Sichtbarkeit des gesamten Grid-FX-Pakets. Höhere Stufen lassen grüne und rote Zustände markanter erscheinen.
- `Debug`: Aktiviert zusätzliche Debug-Ausgaben und Diagnosehinweise. Für den normalen Spielbetrieb ist die Option nicht gedacht und sollte in der Regel ausgeschaltet bleiben.

![Cricket Grid FX](docs/screenshots/animation-cricket-grid-fx.png)

<a id="animation-autodarts-animate-dart-marker-emphasis"></a>

### Dart Marker Emphasis

- Gilt für: `alle Modi`
- Was macht es sichtbar? Treffer-Marker auf dem virtuellen Board werden deutlicher sichtbar.
- Grafisch: Die bestehenden Marker werden größer, farbiger und auf Wunsch mit Pulse, Glow oder Outline versehen. Das Modul ersetzt die Marker nicht, sondern betont sie.
- Wann sinnvoll? Wenn die Standardmarker zu klein oder zu unauffällig sind.

**Einstellungen einfach erklärt**

- `Marker-Größe`: Steuert die Grundgröße der bestehenden Board-Marker. Hohe Stufen machen Treffer aus mehr Abstand leichter erkennbar.
- `Marker-Farbe`: Legt die Farbwirkung der Marker-Betonung fest. Die gewählte Farbe wird für Füllung beziehungsweise visuelle Hervorhebung der Marker genutzt.
- `Effekt`: Legt fest, ob die Marker weich glühen, leicht pulsieren oder ohne Zusatzanimation ruhig sichtbar bleiben.
- `Marker-Sichtbarkeit`: Bestimmt, wie kräftig die Marker gezeichnet werden. Höhere Werte machen die Treffer präsenter, niedrigere wirken unaufdringlicher.
- `Outline-Farbe`: Legt fest, ob die Marker zusätzlich mit einer hellen oder dunklen Outline gezeichnet werden. Das verbessert die Abgrenzung je nach Board- und Hintergrundfarbe.
- `Debug`: Aktiviert zusätzliche Debug-Ausgaben und Diagnosehinweise. Für den normalen Spielbetrieb ist die Option nicht gedacht und sollte in der Regel ausgeschaltet bleiben.

![Dart Marker Emphasis](docs/screenshots/animation-dart-marker-emphasis.gif)

<a id="animation-autodarts-animate-dart-marker-darts"></a>

### Dart Marker Darts

- Gilt für: `alle Modi`
- Was macht es sichtbar? Standardmarker können durch kleine Dart-Grafiken ersetzt werden.
- Grafisch: Statt des normalen Markers liegt ein Dart-Bild im getroffenen Segment. Auf Wunsch fliegt der Dart sichtbar ein, bevor er an seiner Zielposition landet.
- Wann sinnvoll? Wenn du Treffer auf dem virtuellen Board persönlicher oder realistischer darstellen möchtest.

**Einstellungen einfach erklärt**

- `Dart Design`: Legt fest, welches Dart-Motiv anstelle des Standardmarkers verwendet wird. Die Trefferposition bleibt gleich, nur die Grafik ändert sich.
- `Dart-Fluganimation`: Bestimmt, ob neu gesetzte Dart-Bilder mit einer kurzen Flugbewegung ins Segment einlaufen oder sofort an ihrer Endposition erscheinen.
- `Dart-Größe`: Skaliert die eingeblendeten Dart-Bilder relativ zur Standardgröße. Große Stufen füllen das Segment stärker aus.
- `Original-Marker ausblenden`: Verhindert Doppelanzeigen, indem der originale Marker unsichtbar gemacht wird, solange die Dart-Grafik aktiv ist.
- `Fluggeschwindigkeit`: Wählt die Dauer der Einfluganimation neuer Dart-Bilder. `Schnell` landet zügig, `Cinematic` hält die Flugphase sichtbar länger.
- `Debug`: Aktiviert zusätzliche Debug-Ausgaben und Diagnosehinweise. Für den normalen Spielbetrieb ist die Option nicht gedacht und sollte in der Regel ausgeschaltet bleiben.

![Dart Marker Darts](docs/screenshots/animation-dart-marker-darts.png)

<a id="animation-autodarts-animate-remove-darts-notification"></a>

### Remove Darts Notification

- Gilt für: `alle Modi`
- Was macht es sichtbar? Der Hinweis zum Entfernen der Darts wird als große Grafik deutlich präsenter dargestellt.
- Grafisch: Der normale Hinweis wird durch eine zentrierte Bildkarte ersetzt. Optional pulsiert die Grafik leicht, damit sie im Spielablauf nicht übersehen wird.
- Wann sinnvoll? Wenn der Standardhinweis zu leicht übersehen wird.

**Einstellungen einfach erklärt**

- `Bildgröße`: Legt fest, wie groß die Hinweisgrafik auf dem Bildschirm erscheinen darf. Hohe Stufen nutzen mehr Platz und ziehen den Blick stärker an.
- `Pulse-Animation`: Bestimmt, ob die Hinweisgrafik mit einer ruhigen Ein- und Ausbewegung pulsiert oder statisch bleibt.
- `Pulse-Stärke`: Steuert die Stärke der Pulsbewegung. Höhere Stufen vergrößern die Grafik in der Mitte der Animation deutlicher.
- `Debug`: Aktiviert zusätzliche Debug-Ausgaben und Diagnosehinweise. Für den normalen Spielbetrieb ist die Option nicht gedacht und sollte in der Regel ausgeschaltet bleiben.

![Remove Darts Notification](docs/screenshots/animation-remove-darts-notification.png)

<a id="animation-autodarts-animate-single-bull-sound"></a>

### Single Bull Sound

- Gilt für: `alle Modi`
- Was macht es sichtbar? Bei Single Bull hörst du einen kurzen Ton; grafisch bleibt das Spiel unverändert.
- Grafisch: Es wird keine zusätzliche Grafik eingeblendet. Die Rückmeldung ist rein akustisch und reagiert auf erkannte Single-Bull-Treffer.
- Wann sinnvoll? Wenn du Single Bull akustisch schneller bestätigen möchtest, ohne auf eine zusätzliche Animation zu achten.

**Einstellungen einfach erklärt**

- `Lautstärke`: Bestimmt die Wiedergabelautstärke des Single-Bull-Sounds. An der Treffererkennung ändert sich dadurch nichts.
- `Wiederholsperre`: Legt die Sperrzeit zwischen zwei Sound-Auslösungen fest. So wird verhindert, dass derselbe Single-Bull mehrfach zu dicht nacheinander hörbar wird.
- `Fallback-Scan`: `Nur live` verlässt sich ausschließlich auf erkannte DOM- und State-Änderungen. `1200 ms` ergänzt einen regelmäßigen Fallback-Scan, falls Treffer in bestimmten Setups nicht zuverlässig sofort erkannt werden.
- `Debug`: Aktiviert zusätzliche Debug-Ausgaben und Diagnosehinweise. Für den normalen Spielbetrieb ist die Option nicht gedacht und sollte in der Regel ausgeschaltet bleiben.

<a id="animation-autodarts-animate-turn-points-count"></a>

### Turn Points Count

- Gilt für: `alle Modi`
- Was macht es sichtbar? Punkteänderungen beim Turn werden sichtbar hoch- oder heruntergezählt.
- Grafisch: Statt eines harten Sprungs läuft der angezeigte Wert weich zur neuen Punktzahl. Dadurch wird die Änderung als kurze Animation nachvollziehbar.
- Wann sinnvoll? Wenn du Punktwechsel im Spielbild leichter verfolgen möchtest.

**Einstellungen einfach erklärt**

- `Animationsdauer`: Legt die Dauer der Zählanimation fest. Kurze Stufen springen schneller zum Zielwert, längere machen den Zwischenverlauf deutlicher sichtbar.
- `Debug`: Aktiviert zusätzliche Debug-Ausgaben und Diagnosehinweise. Für den normalen Spielbetrieb ist die Option nicht gedacht und sollte in der Regel ausgeschaltet bleiben.

![Turn Points Count](docs/screenshots/animation-turn-points-count.gif)
![Turn Points Count Detail](docs/screenshots/animation-turn-points-count-detail-readme.gif)

<a id="animation-autodarts-animate-winner-fireworks"></a>

### Winner Fireworks

- Gilt für: `alle Modi`
- Was macht es sichtbar? Bei einem Sieg erscheint ein Vollbild-Effekt im gewählten Feuerwerksstil.
- Grafisch: Je nach Stil starten Konfetti- oder Feuerwerksmuster über den gesamten Bildschirm. Farben, Dichte und Geschwindigkeit folgen dem gewählten Stil und der Intensität.
- Wann sinnvoll? Wenn Siege deutlich gefeiert werden sollen oder du verschiedene Effektstile testen möchtest.

**Einstellungen einfach erklärt**

- `Style`: Legt fest, ob der Siegereffekt eher wie klassisches Feuerwerk, Kanonenschuss, Sternenregen, Seitenbeschuss oder eine andere Variante wirkt. Die Farbpalette bleibt davon unabhängig.
- `Farbe`: Bestimmt, aus welchen Farben der Effekt zusammengesetzt ist. Die Partikelmuster bleiben gleich, nur die Palette wird gewechselt.
- `Intensität`: Steuert über Voreinstellungen, wie viele Partikel entstehen, wie häufig Schüsse ausgelöst werden und wie energisch sich der Effekt bewegt. `Stark` wirkt dichter und lebhafter, `Dezent` ruhiger.
- `Test-Button`: Löst den aktuell konfigurierten Winner-Fireworks-Effekt direkt als Vorschau aus, ohne auf einen echten Sieg warten zu müssen. Das ist nur ein Testlauf und ändert keine gespeicherten Werte.
- `Bei Bull-Out aktiv`: Bestimmt, ob der Siegereffekt auch dann startet, wenn der erkannte Spielmodus eine Bull-Out-Variante ist. Ist die Option aus, bleiben diese Varianten stumm.
- `Klick beendet Effekt`: Bestimmt, ob ein linker Mausklick den aktuell laufenden Winner-Fireworks-Effekt vorzeitig schließen darf.
- `Debug`: Aktiviert zusätzliche Debug-Ausgaben und Diagnosehinweise. Für den normalen Spielbetrieb ist die Option nicht gedacht und sollte in der Regel ausgeschaltet bleiben.

![Winner Fireworks](docs/screenshots/animation-winner-fireworks.gif)
![xConfig Test-Button](docs/screenshots/xConfig-testbutton.png)

## Weitere Dokumentation

- [Feature-Übersicht](docs/FEATURES.md)
- [Technische Architektur](docs/TECHNICAL-ARCHITECTURE.md)
- [Migrationsstatus](docs/MIGRATION-STATUS.md)
- [Legacy-Paritätsmatrix](docs/LEGACY-PARITY-MATRIX.md)
- [Legacy-Diskrepanzmatrix](docs/LEGACY-DISCREPANCY-MATRIX.md)
- [Legacy-Inventur](docs/OLDREPO-INVENTORY.md)
- [Neue System-Inventur](docs/NEW-SYSTEM-INVENTORY.md)
- [Release-QA-Report](docs/RELEASE-QA-REPORT.md)
- [UI-/UX-Finalisierung](docs/UI-UX-FINALIZATION.md)

## Für Entwickler

```bash
npm install
npm run build
npm test
npm run verify
```
