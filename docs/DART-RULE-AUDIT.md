# Dart Rule Audit

## Ergebnis

Die Domain-Regeln sind gegen den DRA Rulebook 2026 und die getrennten
Autodarts-/Projektprofile abgegrenzt. Die Testorakel verwenden eine unabhängige,
maschinenlesbare Quellen- und Beispielbasis; eine reale installierte Match-Sitzung
bleibt eine separate Abnahmegrenze.

## Befunde und Korrekturen

### 1. X01-Out-Modi werden konsequent berücksichtigt

- `src/domain/x01-rules.js` bewertet Checkout-Machbarkeit, One-Dart-Finishes und Busts out-mode-aware.
- `checkout-score-highlight` validiert explizite Suggestions zusätzlich gegen echten Score, Out-Modus und vorhandene verlässliche Darts-im-Visit-Informationen.
- `tv-board-zoom` konsumiert dieselben X01-Regeln statt eigener Annahmen.

### 2. Bull-Semantik bleibt konsistent

- `BULL`, `DB`, `Bullseye` werden als `50` interpretiert.
- `SB`, `OB`, `S25` bleiben `25`.
- Suggestion-Parsing und Board-Targets verwenden dieselbe Semantik.

### 3. X01-Visit-Auswertung ist jetzt testbar

- Neuer reiner Helfer: `applyX01ThrowsToState({ scoreBefore, outMode, throws })`
- Deckt Finish, Bust, Bust-Reset, das Drei-Dart-Limit und `MISS` als verbrauchten
  Nullwurf ohne Re-throw ab.
- Unbekannte oder leere Out-Modi liefern keine Checkout-Freigabe und keinen
  stillschweigenden Straight-Out-Fallback.

### 4. Cricket trennt Zielmenge, Scoring und Gewinnerlogik

- `src/domain/cricket-rules.js` trennt `gameMode`, `scoringMode`, Target-States und Gewinnerermittlung.
- Neuer reiner Helfer: `evaluateCricketWinState({ marksByLabel, scoresByPlayer, scoringMode, targetOrder })`
- Für Cut-Throat gilt im Audit: niedrigster Punktestand gewinnt.
- Für das xConfig-Tactics-Profil bleibt die Projekt-Zielmenge `20..10 + BULL`;
  `DOUBLE` und `TRIPLE` bleiben nur kompatible Host-/DOM-Artefakte und gehen
  nicht in Zielreihenfolge oder Gewinnerlogik ein.
- Die Gewinnerermittlung prüft immer die vollständige Zielmenge; partielle
  DOM-Snapshots können keinen vorzeitigen Sieg erzeugen.
- Chronologisch unentscheidbare Mehrfach-Abschlüsse werden als mehrdeutiger
  Terminalzustand statt als regelkonformes Unentschieden gekennzeichnet.

### 5. Feature-Regeln bleiben Verbraucher, nicht Regelquelle

- Cricket-Features konsumieren `cricket-rules`.
- X01-Features konsumieren `x01-rules`.
- Es gibt keine neue Regelduplizierung in `src/features`.

## Verbleibende Grenze

- Ein möglicher X01-`Bull mode` jenseits der aktuellen `25/50`-Semantik wird nicht spekulativ implementiert.
- Dieser Punkt bleibt dokumentiert, bis Autodarts ihn im Match-State verlässlich bereitstellt.
- DRA/PDC deckt Cricket/Tactics nicht ab. Deren Aussagen bleiben explizit den
  Autodarts-Quellen beziehungsweise dem xConfig-Tactics-Profil zugeordnet.
