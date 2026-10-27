# Dart Rules Reference

## Quellenbasis

Primärquellen:

1. DRA Rulebook 2026, gültig seit 31. März 2026: `https://www.thedra.co.uk/dra-rulebook`
   - Throw/Visit: 6.2.6
   - Bounce-/Fall-out ohne Re-throw: 6.2.7
   - 501, Bull, Bust und Game Shot: 6.3.1 bis 6.3.3 sowie 6.3.10 und 6.3.11
2. Autodarts X01: `https://autodarts.diy/Game-Settings/X01/`
3. Autodarts Cricket: `https://autodarts.diy/Game-Settings/cricket/`
4. DARTSLIVE Standard Cricket: `https://www.dartslive.com/enjoy/en/rule/s_cricket/`
5. DARTSLIVE Cut Throat: `https://www.dartslive.com/enjoy/en/rule/cutthroat/`

Sekundärquellen für Randfälle:

6. DARTSLIVE 01 Games: `https://www.dartslive.com/enjoy/en/rule/01games/`
7. Dartbase Tactics: `https://www.dartbase.com/Sect2/Tactics.html`
8. DartsOn No Score Cricket: `https://dartson.app/rules/no-score-cricket/`

Die DRA/PDC-Regeln sind die maßgebliche Quelle für Steel-Dart-Throw- und
Standard-X01-Regeln. Autodarts dokumentiert zusätzliche X01-Varianten und
Cricket. Cricket/Tactics wird nicht als PDC-Regel ausgegeben. Die maschinenlesbare,
versionierte Testbasis liegt in `tests/fixtures/rules/steel-dart-rules.json`.

## X01

### Grundprinzip

- X01 startet mit einem festen Restwert; im Repository werden mindestens `121`, `170`, `301`, `501`, `701` und `901` als gültige Base-Scores behandelt.
- Jeder Dart zieht seinen Punktewert vom Restwert ab.
- Das Leg endet nur dann, wenn exakt `0` erreicht wird und der letzte Dart zum aktiven Out-Modus passt.
- Ein Visit enthält höchstens drei Darts und endet vorher bei Game Shot oder Bust.
- `MISS`/Bounce-out erzielt `0`, verbraucht aber einen Dart; es gibt keinen Re-throw.

### Segmente und Punkte

- `S1..S20` zählen einfach.
- `D1..D20` zählen doppelt.
- `T1..T20` zählen dreifach.
- Single Bull / Outer Bull zählt `25`.
- Double Bull / Bullseye zählt `50`.

### Out-Modi

- Die klassischen Begriffe `Straight-Out`, `Double-Out` und `Master-Out` werden im Repository als `straight`, `double` und `master` normalisiert.
- `straight`: jedes gültige Segment darf finishen.
- `double`: nur ein Double darf finishen; `BULL = 50` gilt dabei als Double.
- `master`: Double oder Triple dürfen finishen; `BULL = 50` bleibt gültig.
- Fehlende oder unbekannte Out-Modi werden nicht geraten: Checkout-Auswertung und
  Feature-Aktionen bleiben bis zu einem bekannten Modus inaktiv.

### Bust

- Unter `0` ist immer Bust.
- Bei `double` und `master` ist ein Restwert von `1` Bust.
- Wird `0` mit einem unzulässigen letzten Segment erreicht, ist der Wurf ebenfalls Bust.
- Bei Bust wird der komplette Visit verworfen; der Restwert springt auf den Visit-Start zurück.

## Cricket und Tactics

### Zielmenge

- Standard-Cricket nutzt `20`, `19`, `18`, `17`, `16`, `15`, `BULL`.
- Das Autodarts-xConfig-Tactics-Profil nutzt dieselbe Mark-Logik und die
  Projekt-Zielmenge `20..10` plus `BULL`; dies ist kein PDC/DRA-Regelprofil.
- `DOUBLE` und `TRIPLE` dürfen als Host-/DOM-Kompatibilitätslabels erkannt werden, gehören aber nicht zur Domain-Zielmenge des xConfig-Tactics-Profils.
- Tactics-Token wie `strict` und `slop` werden als kompatible Submodus-Hinweise eingeordnet; ohne belegte Autodarts-Abweichung wird keine zusätzliche Projekt-Semantik erzwungen.

### Marks

- Single = `1` Mark
- Double = `2` Marks
- Triple = `3` Marks
- Single Bull = `1` Mark
- Double Bull = `2` Marks

### Closure und Overflow

- Ein Ziel ist bei `>= 3` Marks geschlossen.
- Zusätzliche Marks auf einem bereits geschlossenen Ziel zählen nur dann als Punkte, wenn mindestens ein Gegner dieses Ziel noch nicht geschlossen hat.
- Sobald alle Spieler ein Ziel geschlossen haben, ist es `dead`.
- Bull-Overflow zählt mark-basiert mit `25` Punkten pro überschüssigem Bull-Mark.

### Gewinnerlogik

- Standard-Cricket: alle Ziele schließen und mindestens gleichauf oder vorne liegen.
- Cut-Throat: Überschusspunkte gehen an offene Gegner; niedrigster Punktestand gewinnt.
- No-Score / Practice: Punkte sind irrelevant, nur das Schließen aller Ziele zählt.
- Ein statischer Snapshot mit mehreren vollständig geschlossenen Spielern ist ohne
  Abschlussreihenfolge mehrdeutig und wird nicht als regelkonformes Unentschieden gewertet.

## Bekannte Systemgrenze

- Autodarts dokumentiert für X01 zusätzlich einen `Bull mode`.
- Solange der Runtime-Match-State diese Information nicht verlässlich liefert, bleibt `autodarts-xconfig` bewusst bei gesicherter Split-Bull-Semantik `25/50`.
