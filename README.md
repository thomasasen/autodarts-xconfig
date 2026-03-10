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
- [Triple / Double / Bull Hits](#animation-autodarts-animate-triple-double-bull-hits)
- [Cricket Target Highlighter](#animation-autodarts-animate-cricket-target-highlighter)
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
- Was macht es sichtbar? Ein ruhiges, klar gegliedertes X01-Layout mit optionaler AVG-Anzeige.
- Wann sinnvoll? Wenn dir das Standardlayout zu unruhig ist oder du ein eigenes Hintergrundbild nutzen möchtest.

**Einstellungen einfach erklärt**

- `AVG anzeigen`: Blendet die AVG-Anzeige ein oder aus.
- `Hintergrund-Darstellung`: Legt fest, ob dein Bild gefüllt, eingepasst, gestreckt, zentriert oder gekachelt wird.
- `Hintergrundbild-Deckkraft`: Steuert, wie stark das Bild durchscheint.
- `Spielerfelder-Transparenz`: Macht die Spielerkarten transparenter, ohne den Text unlesbar zu machen.
- `Debug`: Nur für Fehlersuche.
- `Hintergrundbild hochladen`: Speichert ein eigenes Bild direkt für dieses Theme.
- `Hintergrundbild entfernen`: Löscht nur das gespeicherte Bild dieses Themes.

**Vorschau**

![Theme X01 in AD xConfig](docs/screenshots/template-theme-x01-xConfig.png)
![Theme X01 Vorschau Standard](docs/screenshots/template-theme-x01-preview-standard-readme.png)
![Theme X01 Vorschau unter Würfen](docs/screenshots/template-theme-x01-preview-under-throws-readme.png)

<a id="template-autodarts-theme-shanghai"></a>

### Theme Shanghai

- Gilt für: `Shanghai`
- Was macht es sichtbar? Ein aufgeräumtes Shanghai-Theme mit klarerem Lesefluss.
- Wann sinnvoll? Wenn du in Shanghai mehr Struktur und weniger visuelle Unruhe möchtest.

**Einstellungen einfach erklärt**

- `AVG anzeigen`: Zeigt den Schnitt an oder blendet ihn bewusst aus.
- `Hintergrund-Darstellung`: Definiert das Verhalten deines Hintergrundbilds.
- `Hintergrundbild-Deckkraft`: Reduziert die Bildintensität für bessere Lesbarkeit.
- `Spielerfelder-Transparenz`: Öffnet die Flächen optisch etwas stärker.
- `Debug`: Nur für Fehlersuche.
- `Hintergrundbild hochladen`: Speichert ein eigenes Bild für Shanghai.
- `Hintergrundbild entfernen`: Stellt den Theme-Standard wieder her.

![Theme Shanghai in AD xConfig](docs/screenshots/template-theme-shanghai-xConfig.png)

<a id="template-autodarts-theme-bermuda"></a>

### Theme Bermuda

- Gilt für: `Bermuda`
- Was macht es sichtbar? Ruhigere Flächen, klarere Trennung wichtiger Bereiche und optional eigenes Hintergrundbild.
- Wann sinnvoll? Wenn Bermuda besser lesbar sein soll, ohne viele Zusatzoptionen zu benötigen.

**Einstellungen einfach erklärt**

- `Hintergrund-Darstellung`: Bestimmt die Platzierung des Hintergrundbilds.
- `Hintergrundbild-Deckkraft`: Regelt, wie präsent das Bild im Hintergrund bleibt.
- `Spielerfelder-Transparenz`: Mischt die Karten stärker mit dem Hintergrund.
- `Debug`: Nur für Fehlersuche.
- `Hintergrundbild hochladen`: Speichert ein eigenes Bermuda-Hintergrundbild.
- `Hintergrundbild entfernen`: Löscht das gespeicherte Bild wieder.

![Theme Bermuda in AD xConfig](docs/screenshots/template-theme-bermuda-xConfig.png)

<a id="template-autodarts-theme-cricket"></a>

### Theme Cricket

- Gilt für: `Cricket`, `Tactics`
- Was macht es sichtbar? Ein gemeinsames Theme für Cricket und Tactics mit ruhigerer Grundoptik.
- Wann sinnvoll? Als visuelle Basis für Cricket-/Tactics-Matches, besonders zusammen mit den Cricket-Effekten.

**Einstellungen einfach erklärt**

- `AVG anzeigen`: Aktiviert oder deaktiviert die AVG-Anzeige.
- `Hintergrund-Darstellung`: Legt die Darstellungsart des Hintergrundbilds fest.
- `Hintergrundbild-Deckkraft`: Reduziert die Bildstärke zugunsten der Lesbarkeit.
- `Spielerfelder-Transparenz`: Öffnet die Karten optisch etwas mehr.
- `Debug`: Nur für Fehlersuche.
- `Hintergrundbild hochladen`: Speichert ein eigenes Bild für Cricket und Tactics.
- `Hintergrundbild entfernen`: Löscht das gespeicherte Bild wieder.

![Theme Cricket in AD xConfig](docs/screenshots/template-theme-cricket-xConfig.png)

<a id="template-autodarts-theme-bull-off"></a>

### Theme Bull-off

- Gilt für: `Bull-off`
- Was macht es sichtbar? Ein kontraststärkeres Layout für Bull-off mit eigenem Hintergrundbild.
- Wann sinnvoll? Wenn Bull-off aus der Distanz oder auf helleren Displays besser lesbar sein soll.

**Einstellungen einfach erklärt**

- `Kontrast-Preset`: Schaltet zwischen sanfter, normaler und kräftiger Darstellung um.
- `Hintergrund-Darstellung`: Bestimmt, wie das Hintergrundbild eingefügt wird.
- `Hintergrundbild-Deckkraft`: Legt die Stärke des Bildes fest.
- `Spielerfelder-Transparenz`: Macht die Flächen leichter oder dichter.
- `Debug`: Nur für Fehlersuche.
- `Hintergrundbild hochladen`: Speichert ein eigenes Bull-off-Bild.
- `Hintergrundbild entfernen`: Entfernt das gespeicherte Bild wieder.

![Theme Bull-off in AD xConfig](docs/screenshots/template-theme-bull-off-xConfig.png)

## Animationen und Komfort

<a id="animation-autodarts-animate-checkout-score-pulse"></a>

### Checkout Score Pulse

- Gilt für: `X01`
- Was macht es sichtbar? Finishfähige Restwerte werden deutlich hervorgehoben.
- Wann sinnvoll? Wenn du Checkout-Momente schneller erkennen möchtest.

**Einstellungen einfach erklärt**

- `Effekt`: Wählt, ob die Hervorhebung pulsiert, glüht, skaliert oder blinkt.
- `Farbthema`: Legt die Highlight-Farbe fest.
- `Intensität`: Regelt, wie dezent oder stark der Effekt wirkt.
- `Trigger-Quelle`: Steuert, ob Vorschlag, Score oder nur eine Quelle den Effekt auslöst.
- `Debug`: Nur für Fehlersuche.

![Checkout Score Pulse](docs/screenshots/animation-checkout-score-pulse.gif)

<a id="animation-autodarts-animate-checkout-board-targets"></a>

### Checkout Board Targets

- Gilt für: `X01`
- Was macht es sichtbar? Mögliche Checkout-Ziele werden direkt am virtuellen Board markiert.
- Wann sinnvoll? Wenn du Finish-Wege nicht nur lesen, sondern direkt am Board sehen willst.

**Einstellungen einfach erklärt**

- `Effekt`: Legt fest, wie die Ziele markiert werden.
- `Zielumfang`: Zeigt nur das erste Ziel oder alle sinnvollen Ziele an.
- `Single-Ring`: Bestimmt, welcher Single-Ring markiert wird.
- `Farbthema`: Passt die Markierung an Theme und Geschmack an.
- `Kontur-Intensität`: Regelt die Stärke der Umrandung.
- `Debug`: Nur für Fehlersuche.

![Checkout Board Targets](docs/screenshots/animation-checkout-board-targets.gif)

<a id="animation-autodarts-animate-tv-board-zoom"></a>

### TV Board Zoom

- Gilt für: `X01`
- Was macht es sichtbar? Bei klaren Checkout-Situationen zoomt die Ansicht TV-artig auf relevante Bereiche.
- Wann sinnvoll? Wenn du beim dritten Dart mehr Fokus auf Zielbereiche willst.

**Einstellungen einfach erklärt**

- `Zoom-Stufe`: Bestimmt, wie weit in das Board gezoomt wird.
- `Zoom-Geschwindigkeit`: Regelt, wie schnell der Zoom ein- und ausläuft.
- `Checkout-Zoom`: Aktiviert den Effekt gezielt für klare Finish-Situationen.
- `Debug`: Nur für Fehlersuche.

![TV Board Zoom](docs/screenshots/animation-tv-board-zoom.gif)

<a id="animation-autodarts-style-checkout-suggestions"></a>

### Style Checkout Suggestions

- Gilt für: `X01`
- Was macht es sichtbar? Checkout-Empfehlungen werden auffälliger, strukturierter und besser lesbar.
- Wann sinnvoll? Wenn du Suggestionen schneller scannen möchtest.

**Einstellungen einfach erklärt**

- `Stil`: Wechselt zwischen Badge-, Ribbon-, Stripe-, Ticket- und Outline-Look.
- `Labeltext`: Setzt den Text oberhalb der Empfehlung oder blendet ihn aus.
- `Farbthema`: Passt Farbe und Kontrast an.
- `Debug`: Nur für Fehlersuche.

![Style Checkout Suggestions](docs/screenshots/animation-style-checkout-suggestions.png)
![Format Badge](docs/screenshots/animation-style-checkout-suggestions-format-badge-readme.png)
![Format Stripe](docs/screenshots/animation-style-checkout-suggestions-format-stripe-readme.png)
![Format Ticket](docs/screenshots/animation-style-checkout-suggestions-format-ticket-readme.png)
![Format Outline](docs/screenshots/animation-style-checkout-suggestions-format-outline-readme.png)

<a id="animation-autodarts-animate-average-trend-arrow"></a>

### Average Trend Arrow

- Gilt für: `alle Modi`
- Was macht es sichtbar? Ein Pfeil direkt am AVG zeigt kurz die Trendrichtung.
- Wann sinnvoll? Wenn du Formwechsel schnell erfassen möchtest.

**Einstellungen einfach erklärt**

- `Animationsdauer`: Legt fest, wie lange der Pfeil sichtbar bleibt.
- `Pfeil-Größe`: Passt den Pfeil an Monitorgröße und Abstand an.
- `Debug`: Nur für Fehlersuche.

![Average Trend Arrow](docs/screenshots/animation-average-trend-arrow.png)

<a id="animation-autodarts-animate-turn-start-sweep"></a>

### Turn Start Sweep

- Gilt für: `alle Modi`
- Was macht es sichtbar? Beim Spielerwechsel läuft ein kurzer Sweep über die aktive Karte.
- Wann sinnvoll? Wenn du in schnellen Matches einen klareren Zugwechsel sehen willst.

**Einstellungen einfach erklärt**

- `Sweep-Geschwindigkeit`: Bestimmt das Tempo des Sweeps.
- `Sweep-Stil`: Schaltet zwischen dezentem, normalem und kräftigem Effekt um.
- `Debug`: Nur für Fehlersuche.

![Turn Start Sweep](docs/screenshots/animation-turn-start-sweep.gif)

<a id="animation-autodarts-animate-triple-double-bull-hits"></a>

### Triple / Double / Bull Hits

- Gilt für: `alle Modi`
- Was macht es sichtbar? Treffer wie `T20`, `D16` oder `BULL` springen in der Wurfliste sofort ins Auge.
- Wann sinnvoll? Für Training, Checkout-Fokus und mehr Lesbarkeit in schnellen Legs.

**Einstellungen einfach erklärt**

- `Triple hervorheben`: Markiert Triple-Treffer besonders stark.
- `Double hervorheben`: Betont Doubles in der Wurfliste.
- `Bull hervorheben`: Hebt Bull-Treffer gesondert hervor.
- `Aktualisierungsmodus`: Wechselt zwischen direkter Live-Reaktion und robusterem Fallback.
- `Debug`: Nur für Fehlersuche.

![Triple Double Bull Hits](docs/screenshots/animation-triple-double-bull-hits.gif)

<a id="animation-autodarts-animate-cricket-target-highlighter"></a>

### Cricket Target Highlighter

- Gilt für: `Cricket`, `Tactics`
- Was macht es sichtbar? Zielzustände und Drucksituationen werden direkt am Board sichtbar.
- Wann sinnvoll? Wenn du in Cricket oder Tactics schneller sehen möchtest, welche Ziele offen, gefährlich oder bereits tot sind.

**Einstellungen einfach erklärt**

- `Dead-Ziele anzeigen`: Zeigt auch vollständig erledigte Ziele weiter an.
- `State-Priorität`: Scorable-Ziele haben Vorrang, danach Offense, Pressure, offene und dead Ziele.
- `Geschlossene Ziele`: Scorable geschlossene Ziele bleiben sichtbar; nicht-scorable geschlossene Ziele erscheinen nicht als aktive Highlights.
- `Pressure/Danger`: Gegnerdruck wird bewusst subtil als Ring-/Randhinweis dargestellt, nicht als Vollsektor.
- `Farbthema`: Passt das Farbschema an Helligkeit und Kontrast deines Setups an.
- `Intensität`: Regelt die Sichtbarkeit der Overlays.
- `Debug`: Nur für Fehlersuche.

![Cricket Target Highlighter](docs/screenshots/animation-cricket-target-highlighter.png)

<a id="animation-autodarts-animate-cricket-grid-fx"></a>

### Cricket Grid FX

- Gilt für: `Cricket`, `Tactics`
- Was macht es sichtbar? Zusätzliche Live-Effekte direkt in der Cricket-/Tactics-Matrix.
- Wann sinnvoll? Wenn du Fortschritt, Gegnerdruck und Wechsel im Grid klarer sehen willst.

**Einstellungen einfach erklärt**

- `Gemeinsamer Render-State`: Grid FX verwendet denselben Cricket-/Tactics-Render-State wie der Board-Highlighter.
- `Spielerzellen-Farben`: Aktive Scoring-Zellen leuchten grün, offene Gegnerzellen rot. Hat ein anderer Spieler das Ziel ebenfalls geschlossen, bleibt seine Zelle aus dem roten Druckzustand heraus.
- `Zeilen-Sweep`: Kurzer Lichtlauf über geänderte Zeilen.
- `Ziel-Badge-Hinweis`: Macht wichtige Ziel-Badges auffälliger.
- `Mark-Fortschritt`: Verdeutlicht neue Treffer in der Matrix.
- `Gefahrenkante`: Warnt bei relevanten Drucksituationen.
- `Offensiv-Lane`: Hebt offensiv sinnvolle Zeilen hervor.
- `Geschlossene Zeilen abdunkeln`: Nimmt irrelevante Ziele optisch zurück.
- `Delta-Chips`: Zeigt kurze `+1`, `+2` oder `+3`-Hinweise an.
- `Treffer-Impuls`: Ergänzt einen punktuellen Treffer-Effekt.
- `Zugwechsel-Übergang`: Kennzeichnet den Wechsel zwischen Spielern.
- `Gegnerdruck-Overlay`: Macht defensiven Druck schneller sichtbar.
- `Farbthema`: Wechselt zwischen Standard und kontraststärkerer Optik.
- `Intensität`: Regelt die Stärke des Gesamtpakets.
- `Debug`: Nur für Fehlersuche.

![Cricket Grid FX](docs/screenshots/animation-cricket-grid-fx.png)

<a id="animation-autodarts-animate-dart-marker-emphasis"></a>

### Dart Marker Emphasis

- Gilt für: `alle Modi`
- Was macht es sichtbar? Treffer-Marker auf dem virtuellen Board werden deutlich kräftiger dargestellt.
- Wann sinnvoll? Wenn die Marker im Standardzustand zu klein oder zu unauffällig sind.

**Einstellungen einfach erklärt**

- `Marker-Größe`: Vergrößert oder verkleinert die Marker.
- `Marker-Farbe`: Wählt die Hauptfarbe des Markers.
- `Effekt`: Ergänzt Glow, Pulse oder eine ruhige Darstellung ohne Effekt.
- `Marker-Sichtbarkeit`: Regelt die Deckkraft der Marker.
- `Outline-Farbe`: Fügt einen weißen oder schwarzen Rand hinzu.
- `Debug`: Nur für Fehlersuche.

![Dart Marker Emphasis](docs/screenshots/animation-dart-marker-emphasis.gif)

<a id="animation-autodarts-animate-dart-marker-darts"></a>

### Dart Marker Darts

- Gilt für: `alle Modi`
- Was macht es sichtbar? Standardmarker können durch kleine Dart-Grafiken ersetzt werden.
- Wann sinnvoll? Wenn du Treffer auf dem virtuellen Board persönlicher oder realistischer darstellen möchtest.

**Einstellungen einfach erklärt**

- `Dart Design`: Wählt das Dart-Motiv.
- `Dart Fluganimation`: Schaltet eine zusätzliche Fluganimation ein oder aus.
- `Dart-Größe`: Passt die Größe der Dart-Grafik an.
- `Original-Marker ausblenden`: Verhindert Doppelanzeigen.
- `Fluggeschwindigkeit`: Regelt das Tempo der Fluganimation.
- `Debug`: Nur für Fehlersuche.

![Dart Marker Darts](docs/screenshots/animation-dart-marker-darts.png)

<a id="animation-autodarts-animate-remove-darts-notification"></a>

### Remove Darts Notification

- Gilt für: `alle Modi`
- Was macht es sichtbar? Der Hinweis zum Entfernen der Darts wird deutlich präsenter dargestellt.
- Wann sinnvoll? Wenn der Standardhinweis zu leicht übersehen wird.

**Einstellungen einfach erklärt**

- `Bildgröße`: Passt die Größe der Grafik an.
- `Pulse-Animation`: Aktiviert eine zusätzliche Bewegungsbetonung.
- `Pulse-Stärke`: Regelt die Stärke des Pulses.
- `Debug`: Nur für Fehlersuche.

![Remove Darts Notification](docs/screenshots/animation-remove-darts-notification.png)

<a id="animation-autodarts-animate-single-bull-sound"></a>

### Single Bull Sound

- Gilt für: `alle Modi`
- Was macht es sichtbar? Kein visueller Effekt, sondern ein kurzes Audio-Feedback bei Single Bull.
- Wann sinnvoll? Wenn du zusätzlich zum Bild ein akustisches Signal möchtest.

**Einstellungen einfach erklärt**

- `Lautstärke`: Stellt die Stärke des Tons ein.
- `Wiederholsperre`: Verhindert zu schnelle Mehrfachauslösung.
- `Fallback-Scan`: Nutzt bei Bedarf einen zusätzlichen Scan statt nur Live-Events.
- `Debug`: Nur für Fehlersuche.

<a id="animation-autodarts-animate-turn-points-count"></a>

### Turn Points Count

- Gilt für: `alle Modi`
- Was macht es sichtbar? Punkteänderungen zählen sichtbar hoch oder runter, statt hart zu springen.
- Wann sinnvoll? Wenn du Punktedifferenzen während des Zuges besser nachvollziehen willst.

**Einstellungen einfach erklärt**

- `Animationsdauer`: Bestimmt, wie schnell die Punkte hoch- oder herunterzählen.
- `Debug`: Nur für Fehlersuche.

![Turn Points Count](docs/screenshots/animation-turn-points-count.gif)
![Turn Points Count Detail](docs/screenshots/animation-turn-points-count-detail-readme.gif)

<a id="animation-autodarts-animate-winner-fireworks"></a>

### Winner Fireworks

- Gilt für: `alle Modi`
- Was macht es sichtbar? Ein Sieger-Effekt mit verschiedenen Stilen, Farben und Intensitäten.
- Wann sinnvoll? Wenn Leg- oder Match-Siege einen klaren Abschlussmoment bekommen sollen.

**Einstellungen einfach erklärt**

- `Style`: Wählt die Art des Feuerwerks.
- `Farbe`: Legt die Farbpalette fest.
- `Intensität`: Regelt, wie dicht und präsent der Effekt wirkt.
- `Bei Bull-Out aktiv`: Aktiviert den Effekt auch in Bull-off-Situationen.
- `Klick beendet Effekt`: Erlaubt das sofortige Beenden per Klick oder Tap.
- `Debug`: Nur für Fehlersuche.

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
