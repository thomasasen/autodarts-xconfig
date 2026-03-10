# Cricket-Regelvalidierung

## Ziel

Dieses Dokument hält die fachliche Regelbasis für Cricket und Tactics fest und ordnet sie den Domain-Konzepten von `autodarts-xconfig` zu.

## Verwendete Quellen

- Autodarts Cricket: `https://autodarts.diy/Game-Settings/cricket/`
- DARTSLIVE Standard Cricket: `https://www.dartslive.com/enjoy/en/rule/s_cricket/`
- DARTSLIVE Cut Throat: `https://www.dartslive.com/enjoy/en/rule/cutthroat/`
- Dartbase Tactics: `https://www.dartbase.com/Sect2/Tactics.html`
- DartsOn No Score Cricket: `https://dartson.app/rules/no-score-cricket/`

## Bestätigte Regeln

### Zielmenge

- Standard-Cricket: `20` bis `15` plus `BULL`
- Tactics: `20` bis `10` plus `BULL`

### Marks

- Single = `1`
- Double = `2`
- Triple = `3`
- Single Bull = `1`
- Double Bull = `2`

### Closure und Scoring

- Ein Ziel ist bei `>= 3` Marks geschlossen.
- Zusätzliche Marks zählen nur dann als Punkte, wenn Gegner das Ziel noch offen haben.
- Ist ein Ziel für alle Spieler geschlossen, ist es `dead`.
- Bull-Overflow zählt mit `25` Punkten pro überschüssigem Mark.

### Modusfamilien

- `standard`: aktive Spieler sammeln Overflow-Punkte selbst.
- `cutthroat`: Overflow-Punkte gehen an offene Gegner.
- `neutral` / `no-score`: Marks und Closure bleiben aktiv, Punktewertung nicht.
- `strict` / `slop` (Tactics): werden kompatibel als Submodus-Tokens erkannt, ohne eigene zusätzliche Scoring-Semantik im Projekt zu erzwingen.

### Gewinnerlogik

- Standard-Cricket: alle Ziele schließen und mindestens Gleichstand/Führung bei Punkten.
- Cut-Throat: alle Ziele schließen und den niedrigsten Punktestand haben.
- No-Score: alle Ziele schließen; Punkte sind irrelevant.

## Mapping im Repository

- `closed`: aktiver Spieler hat mindestens `3` Marks.
- `allClosed`: alle Spieler haben das Ziel geschlossen.
- `dead`: `allClosed` bei mehr als einem Spieler.
- `offense`: aktiver Spieler kann auf dem Ziel scoren.
- `danger`: Gegner können auf dem Ziel gegen den aktiven Spieler scoren.
- `pressure`: verschärfter `danger`-Zustand bei höchstens einem aktiven Mark.

## Fazit

- Die Domain-Logik implementiert Mark- und Overflow-Regeln regelkonform.
- Feature-Overlays leiten nur Darstellung ab; sie entscheiden keine Fachregeln selbst.
- Die Gewinnerlogik ist nun als reine Domain-Funktion verfügbar und testbar.
