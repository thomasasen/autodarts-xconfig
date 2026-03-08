# Dart Rules Reference

## Quellenbasis

Primärquellen:

1. Autodarts X01-Dokumentation: `https://autodarts.diy/Game-Settings/x01/`
2. Autodarts Cricket-Dokumentation: `https://autodarts.diy/Game-Settings/cricket/`
3. DARTSLIVE OFFICIAL RULES / 01 Games: `https://www.dartslive.com/en/rule/the_world/`
4. DARTSLIVE Standard Cricket: `https://www.dartslive.com/en/rule/s_cricket/`
5. DARTSLIVE Cut Throat Cricket: `https://www.dartslive.com/en/rule/c_cricket/`

Sekundärquellen für Modi, die Autodarts nicht gleich detailliert beschreibt:

6. Dartbase Tactics: `https://www.dartbase.com/Sect2/Tactics.html`
7. DartsOn No Score Cricket: `https://dartson.app/rules/no-score-cricket/`

## X01

### Grundprinzip

- X01 startet mit einem festen Restwert wie `301`, `501` oder `701`.
- Jeder Wurf zieht seinen Punktewert vom Restwert ab.
- Ein Leg endet nur dann, wenn der Restwert exakt `0` erreicht wird und der letzte Dart zum aktiven `outMode` passt.

### Segmente und Punkte

- Singles: `S1..S20` zählen einfach.
- Doubles: `D1..D20` zählen doppelt.
- Triples: `T1..T20` zählen dreifach.
- Outer Bull / Single Bull: `25`
- Inner Bull / Double Bull / Bullseye: `50`

### Out-Modi

- Die offiziellen Begriffe werden im Audit als `Straight-Out`, `Double-Out` und `Master-Out` referenziert.
- `straight`: jeder gültige letzte Dart darf das Leg beenden.
- `double`: der letzte Dart muss ein Double sein; `Bull 50` zählt dabei als Double.
- `master`: der letzte Dart muss ein Double oder Triple sein; `Bull 50` bleibt gültig, weil es als Double behandelt wird.

### Bust

- Unter `0` ist immer Bust.
- Bei `double` und `master` ist ein Restwert von `1` ebenfalls Bust.
- Wenn `0` mit einem ungültigen letzten Segment erreicht wird, ist der Wurf ebenfalls Bust.

### Beispiele

- `40` mit `double` kann mit `D20` beendet werden.
- `60` ist in `double` kein One-Dart-Finish, aber ein normaler Checkout mit zwei oder drei Darts möglich.
- `60` ist in `master` ein One-Dart-Finish mit `T20`.
- `20` ist in `straight` ein One-Dart-Finish mit `S20`.

## Cricket

### Zielmenge

- Standard-Cricket nutzt `20, 19, 18, 17, 16, 15, BULL`.
- Tactics nutzt dieselbe Logik, erweitert aber die Zielmenge auf `20..10, BULL`.

### Marks

- Single = `1` Mark
- Double = `2` Marks
- Triple = `3` Marks
- Outer Bull = `1` Mark
- Inner Bull = `2` Marks

### Closure und Punkte

- Ein Ziel gilt ab `3` Marks als geschlossen.
- Zusätzliche Treffer auf einem bereits geschlossenen Ziel zählen nur dann als Punkte, wenn mindestens ein Gegner dieses Ziel noch nicht geschlossen hat.
- Sobald alle Spieler ein Ziel geschlossen haben, ist es `dead` und erzeugt keine weiteren Punkte.

### Siegbedingung

- Standard-Cricket: alle Ziele geschlossen und mindestens Gleichstand/Führung bei Punkten.
- Cut-Throat: Überschuss-Punkte gehen an offene Gegner; niedrigster Score gewinnt.

## Cut-Throat und No-Score

- Cut-Throat ändert nur die Punkteverteilung, nicht die Zielmenge oder Mark-Logik.
- No-Score / Practice behält Mark-/Closure-Logik bei, erzeugt aber keine normale Offense-/Danger-Punktewertung.

## Repo-Mapping

- `offense`: aktiver Spieler kann auf diesem Ziel aktuell scoren.
- `danger`: ein Gegner kann auf diesem Ziel aktuell gegen den aktiven Spieler scoren.
- `pressure`: UI-Unterbegriff von `danger`, wenn der aktive Spieler auf dem Ziel noch maximal ein Mark hat.
- `dead`: alle Spieler haben das Ziel geschlossen.

## Bekannte Systemgrenze

- Die aktuelle Runtime modelliert in X01 `SB=25` und `DB/BULL=50`.
- Autodarts dokumentiert zusätzlich einen `Bull mode` für X01. Dafür existiert im aktuellen Repository jedoch kein gesicherter Match-State-Zugriff. Deshalb ist diese Validierung auf die im Code tatsächlich vorhandene Split-Bull-Semantik begrenzt.
