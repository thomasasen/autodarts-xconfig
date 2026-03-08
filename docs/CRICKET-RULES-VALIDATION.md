# Cricket-Regelvalidierung

## Ziel

Dieses Dokument hält die recherchierte Regelbasis für Cricket/Tactics fest und ordnet sie den Konzepten in `autodarts-xconfig` zu. Es dient als fachliche Referenz für Domain-Logik, Target-State-Ableitung und die Cricket-bezogenen UI-Features.

## Verwendete Quellen

Primärquellen:

1. Autodarts Cricket-Dokumentation  
   https://autodarts.diy/Game-Settings/cricket/
2. DARTSLIVE Standard Cricket  
   https://www.dartslive.com/enjoy/en/rule/s_cricket/
3. DARTSLIVE offizielles Regelbuch / Cricket General Rules  
   https://www.dartslive.com/superdarts/roadto/en/rules/official.html

Sekundärquellen für Varianten, die in den Primärquellen nicht vollständig ausdefiniert sind:

4. DartsOn Standard Cricket  
   https://dartson.app/rules/standard-cricket/
5. DartsOn Cut Throat Cricket  
   https://dartson.app/de/rules/cut-throat-cricket/
6. DartsOn No Score Cricket  
   https://dartson.app/rules/no-score-cricket/
7. Dartbase Tactics  
   https://www.dartbase.com/Sect2/Tactics.html

## Recherchierte Regelbasis

### 1. Zielmenge

- Standard Cricket verwendet genau diese Ziele: `20`, `19`, `18`, `17`, `16`, `15`, `BULL`.
- Tactics verwendet dieselbe Cricket-Mechanik, aber die erweiterte Zielmenge `20..10` plus `BULL`.

### 2. Marks

- Single zählt als `1` Mark.
- Double zählt als `2` Marks.
- Triple zählt als `3` Marks.
- Single Bull zählt als `1` Mark.
- Double Bull zählt als `2` Marks.

### 3. Öffnen, Schließen, weitere Treffer

- Ein Ziel ist für einen Spieler bei `>= 3` Marks geschlossen.
- Zusätzliche Treffer auf einem bereits geschlossenen Ziel zählen nur dann als Punkte, wenn mindestens ein Gegner dieses Ziel noch nicht geschlossen hat.
- Sobald alle Spieler ein Ziel geschlossen haben, ist dieses Ziel nicht mehr scorable.

### 4. Punktewertung

- Standard Cricket: Überschuss-Marks werden dem aktiven Spieler als Punkte gutgeschrieben.
- Cut-Throat: Überschuss-Marks werden jedem noch offenen Gegner als Punkte zugeschrieben.
- No-Score / Practice: dieselbe Mark-/Schließlogik, aber keine Punktewertung.

Wichtig für die Domain-Implementierung:

- Die Repo-Logik bewertet Überschuss punktgenau über `overflowMarks * targetBaseValue`.
- Das ist für mark-basierte Cricket-Logik fachlich sinnvoller als pauschal den gesamten Dartwert zu werten, wenn ein Treffer nur teilweise Überschuss ist.
- Beispiel: Ein Spieler hat auf Bull bereits `2` Marks und trifft `Double Bull`. Dann schließt der erste Mark das Ziel, aber nur `1` Mark ist Überschuss. Bei `25/50` ergibt das `25` Punkte, nicht `50`.

### 5. Bull-Behandlung

- Split-Bull-Regel: Outer/Single Bull = `25`, Inner/Double Bull = `50`.
- Für Cricket-Marks gilt dabei:
  - Single Bull = `1` Mark
  - Double Bull = `2` Marks
- Für Overflow-Scoring ist die Basiseinheit beim Bull `25` pro Überschuss-Mark.

### 6. Gewinnen

- Standard Cricket: Alle Ziele schließen und punktgleich vorne oder in Führung liegen.
- No-Score: Alle Ziele schließen, Punkte sind irrelevant.
- Cut-Throat:
  - Fachlich verbreitet und in DartsOn dokumentiert: niedrigster Punktestand gewinnt.
  - Die aktuelle Autodarts-Dokumentation beschreibt zwar korrekt die Punktrichtung zu offenen Gegnern, nennt aber anschließend „highest total points wins“.

Für dieses Repository ist diese Diskrepanz derzeit nicht entscheidungsrelevant, weil die Cricket-Features keine Gewinnerermittlung vornehmen. Relevant für Highlighting und Target-Zustände ist nur die korrekte Scoring-Richtung: Overflow geht im Cut-Throat an offene Gegner.

## Mapping auf die Repository-Konzepte

### Domain

Dateien:

- `src/domain/variant-rules.js`
- `src/domain/cricket-rules.js`

Abbildung:

- `gameMode` beschreibt die Zielmenge: `cricket`, `tactics`, `hidden-cricket`
- `scoringMode` beschreibt die Wertungsfamilie: `standard`, `cutthroat`, `neutral`, `unknown`
- `closed` = aktiver Spieler hat mindestens `3` Marks
- `allClosed` = alle Spieler haben mindestens `3` Marks
- `dead` = `allClosed` bei mehr als einem Spieler
- `scorableForPlayer` = aktiver Spieler hat geschlossen, mindestens ein Gegner noch offen
- `scorableAgainstPlayer` = aktiver Spieler noch offen, mindestens ein Gegner bereits geschlossen
- `offense` = UI-Begriff für `scorableForPlayer`
- `danger` = UI-Begriff für `scorableAgainstPlayer`
- `pressure` = Repo-spezifische Unterstufe von `danger` bei `activeMarks <= 1`

### Runtime / Game State

Datei:

- `src/core/game-state-store.js`

Abbildung:

- sichtbarer Spielmodus und Scoring-Modus werden getrennt gelesen
- vorhandene Legacy-/Autodarts-Praxis:
  - `settings.gameMode` bzw. `match.gameMode` beschreiben primär die sichtbare Variante (`Cricket`, `Tactics`)
  - `settings.mode` trägt den Scoring-Modus (`standard`, `cut-throat`, `no-score`, ...)
- deshalb bevorzugt die neue Runtime für `getCricketScoringMode()` zuerst `settings.mode` und fällt erst danach auf `settings.gameMode` / `match.gameMode` zurück

### Feature-Schicht

Dateien:

- `src/features/cricket-highlighter/logic.js`
- `src/features/cricket-grid-fx/logic.js`

Abbildung:

- Features interpretieren nur Domain-Zustände.
- `showDeadTargets` ist reine Anzeigeoption und ändert keine Domain-Wahrheit.
- `neutral` und `unknown` unterdrücken taktische Angriffs-/Gefahrenfarben.
- Wenn kein expliziter Game-Mode vorliegt, wird `tactics` aus vorhandenen Zeilen `10..14` inferiert.
- `match.turns` dient als Stale-DOM-Fallback für bereits abgeschlossene Würfe.
- `activeThrows` werden zusätzlich auf die aktuelle Zielmatrix projiziert.

## Gegenprüfung gegen `.oldrepo`

Die Legacy-Implementierung in `.oldrepo/Animation/autodarts-cricket-state-shared.js` war für drei Punkte fachlich nützlich und wurde als Referenz genutzt:

1. Trennung von sichtbarem Game-Mode und Scoring-Mode
2. Tactics-Inferenz über vorhandene `10..14`-Zeilen
3. Merge aus `match.turns` und `activeThrows`, um einen verzögerten DOM-Stand zu stabilisieren

Nicht blind übernommen:

- Legacy koppelte `showDeadTargets` noch an die Zustandswahrheit.
- Legacy modellierte Cut-Throat/Neutral bereits, aber die neue Runtime hatte diese Trennung noch nicht vollständig nachgezogen.
- Legacy-Verhalten wurde nur dort übernommen, wo es mit der recherchierten Regelbasis vereinbar ist.

## Im Audit korrigierte Inkonsistenzen

1. Scoring-Modus und Zielmengen-Modus sind jetzt getrennte Konzepte.
2. `showDeadTargets` beeinflusst keine Domain-Zustände mehr.
3. Tactics-Inferenz aus `10..14` ist wieder vorhanden.
4. Cricket-Features nutzen neben `activeThrows` wieder `match.turns` als vorsichtige Vorschau.
5. Neutral-/Unknown-Modi erzeugen keine irreführenden `offense`-/`danger`-Signale.
6. Bull-Overflow folgt jetzt explizit der mark-basierten `25/50`-Logik.

## Verbleibende Grenze

Die Features ermitteln keine Gewinnerlogik für Cut-Throat oder Standard Cricket. Sie leiten ausschließlich Ziel- und Gefahrenzustände ab. Das ist bewusst so gehalten, weil Gewinnerermittlung nicht in die Präsentationsschicht gehört und aktuell von den Cricket-Overlays nicht benötigt wird.
