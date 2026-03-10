# Dart Rules Reference

## Quellenbasis

Primärquellen:

1. Autodarts X01: `https://autodarts.diy/Game-Settings/X01/`
2. Autodarts Cricket: `https://autodarts.diy/Game-Settings/cricket/`
3. DARTSLIVE 01 Games: `https://www.dartslive.com/enjoy/en/rule/01games/`
4. DARTSLIVE Standard Cricket: `https://www.dartslive.com/enjoy/en/rule/s_cricket/`
5. DARTSLIVE Cut Throat: `https://www.dartslive.com/enjoy/en/rule/cutthroat/`

Sekundärquellen für Randfälle:

6. Dartbase Tactics: `https://www.dartbase.com/Sect2/Tactics.html`
7. DartsOn No Score Cricket: `https://dartson.app/rules/no-score-cricket/`

## X01

### Grundprinzip

- X01 startet mit einem festen Restwert wie `301`, `501` oder `701`.
- Jeder Dart zieht seinen Punktewert vom Restwert ab.
- Das Leg endet nur dann, wenn exakt `0` erreicht wird und der letzte Dart zum aktiven Out-Modus passt.

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

### Bust

- Unter `0` ist immer Bust.
- Bei `double` und `master` ist ein Restwert von `1` Bust.
- Wird `0` mit einem unzulässigen letzten Segment erreicht, ist der Wurf ebenfalls Bust.
- Bei Bust wird der komplette Visit verworfen; der Restwert springt auf den Visit-Start zurück.

## Cricket und Tactics

### Zielmenge

- Standard-Cricket nutzt `20`, `19`, `18`, `17`, `16`, `15`, `BULL`.
- Tactics nutzt dieselbe Mark-Logik, erweitert die Zielmenge aber auf `20..10` plus `BULL`.
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

## Bekannte Systemgrenze

- Autodarts dokumentiert für X01 zusätzlich einen `Bull mode`.
- Solange der Runtime-Match-State diese Information nicht verlässlich liefert, bleibt `autodarts-xconfig` bewusst bei gesicherter Split-Bull-Semantik `25/50`.
