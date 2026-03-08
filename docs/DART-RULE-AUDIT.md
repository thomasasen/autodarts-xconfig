# Dart Rule Audit

## Ergebnis

Die Domain-Regeln sind für `v1.1.0` regelkonform dokumentiert, szenariobasiert getestet und sauber von der Feature-Schicht getrennt.

## Befunde und Korrekturen

### 1. X01-Out-Modi werden konsequent berücksichtigt

- `src/domain/x01-rules.js` bewertet Checkout-Machbarkeit, One-Dart-Finishes und Busts out-mode-aware.
- `checkout-score-pulse` und `tv-board-zoom` konsumieren diese Regeln statt eigener Annahmen.

### 2. Bull-Semantik bleibt konsistent

- `BULL`, `DB`, `Bullseye` werden als `50` interpretiert.
- `SB`, `OB`, `S25` bleiben `25`.
- Suggestion-Parsing und Board-Targets verwenden dieselbe Semantik.

### 3. X01-Visit-Auswertung ist jetzt testbar

- Neuer reiner Helfer: `applyX01ThrowsToState({ scoreBefore, outMode, throws })`
- Deckt Finish, Bust, ungültige Segmente und Bust-Reset auf Visit-Ebene ab.

### 4. Cricket trennt Zielmenge, Scoring und Gewinnerlogik

- `src/domain/cricket-rules.js` trennt `gameMode`, `scoringMode`, Target-States und Gewinnerermittlung.
- Neuer reiner Helfer: `evaluateCricketWinState({ marksByLabel, scoresByPlayer, scoringMode, targetOrder })`
- Für Cut-Throat gilt im Audit: niedrigster Punktestand gewinnt.

### 5. Feature-Regeln bleiben Verbraucher, nicht Regelquelle

- Cricket-Features konsumieren `cricket-rules`.
- X01-Features konsumieren `x01-rules`.
- Es gibt keine neue Regelduplizierung in `src/features`.

## Verbleibende Grenze

- Ein möglicher X01-`Bull mode` jenseits der aktuellen `25/50`-Semantik wird nicht spekulativ implementiert.
- Dieser Punkt bleibt dokumentiert, bis Autodarts ihn im Match-State verlässlich bereitstellt.
