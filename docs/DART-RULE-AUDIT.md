# Dart Rule Audit

## Ergebnis

Die Domain-Regeln sind jetzt für X01 und Cricket fachlich konsistenter dokumentiert und testseitig abgesichert. Die wichtigsten Korrekturen betreffen X01-Out-Modi und Bull-Semantik in regelabhängigen Verbrauchern.

## Befunde und Korrekturen

### 1. Double-Out-Annahmen in X01-Checkout-Helfern

- Regelreferenz: X01 unterscheidet `straight`, `double` und `master`.
- Implementierung: `src/domain/x01-rules.js`
- Problem: `isCheckoutPossibleFromScore()` und `getOneDartCheckoutSegment()` modellierten faktisch nur Double-Out.
- Korrektur: additive out-mode-aware Helfer eingeführt:
  - `isCheckoutPossibleFromScoreForOutMode()`
  - `getOneDartCheckoutSegmentsForOutMode()`
  - `getPreferredOneDartCheckoutSegment()`
  - `isOneDartCheckoutSegmentForOutMode()`
- Ergebnis: Double-Out bleibt als Legacy-Wrapper stabil, Verbraucher können aber jetzt regelrichtig nach aktivem `outMode` arbeiten.

### 2. Checkout Score Pulse ignorierte `outMode`

- Regelreferenz: Checkout-Machbarkeit hängt vom Out-Modus ab.
- Implementierung: `src/features/checkout-score-pulse/logic.js`
- Problem: Das Feature nutzte bisher nur Double-Out-artige Score-Mathematik.
- Korrektur: `computeShouldHighlight()` liest jetzt `gameState.getOutMode()` und nutzt out-mode-aware Domain-Helfer.
- Ergebnis: `159` ist z. B. in Double-Out weiter kein Checkout, in Master-Out aber korrekt ein Checkout.

### 3. TV Board Zoom nutzte One-Dart-Finishes ohne `outMode`

- Regelreferenz: Ein One-Dart-Finish hängt vom zulässigen letzten Segment ab.
- Implementierung: `src/features/tv-board-zoom/logic.js`
- Problem: Checkout-Zoom und T20-Guard behandelten mehrere Fälle stillschweigend wie Double-Out.
- Korrektur:
  - Checkout-Ziele werden jetzt über `getPreferredOneDartCheckoutSegment(score, outMode)` gewählt.
  - Die T20-Bust-Guard-Logik nutzt jetzt `evaluateThrowOutcome()` indirekt über `isSensibleThirdT20Score(score, outMode)`.
- Ergebnis: `60` wird in Master-Out korrekt als `T20` erkannt, in Double-Out aber nicht als One-Dart-Ziel.

### 4. Bull in Checkout-Suggestionen war für Board-Targets semantisch zu grob

- Regelreferenz: `Bull`/`Bullseye` meint in Checkout-Kontext `50`, nicht Outer Bull `25`.
- Implementierung: `src/domain/x01-rules.js`, Verbraucher `checkout-board-targets`
- Problem: `parseCheckoutTargetsFromSuggestion("BULL")` lieferte bisher `SB`.
- Korrektur: `BULL` und `BULLSEYE` werden jetzt als `DB` interpretiert; `SB`/`OB` bleiben Single-Bull.
- Ergebnis: Board-Overlays und Suggestion-Parsing stimmen mit der Finish-Semantik überein.

### 5. Suggestion-Parsing war auf Double-/Bull-Finishmuster verengt

- Regelreferenz: Eine gültige Checkout-Suggestion kann auch mit Triple oder Single enden, abhängig vom Out-Modus.
- Implementierung: `src/domain/x01-rules.js`
- Problem: `parseCheckoutSuggestionState()` erkannte praktisch nur `Dxx` oder `Bull`.
- Korrektur:
  - natürlichsprachige Tokens wie `Double 16`, `Single 20`, `Single Bull` werden normalisiert
  - die Auswertung prüft jetzt das letzte explizite Segment gegen den aktiven Out-Modus
- Ergebnis: `T20` ist in Master-Out korrekt ein Checkout-Hinweis, in Double-Out nicht.

## Prüfpunkte ohne fachliche Korrektur

### Cricket Domain

- `src/domain/cricket-rules.js` wurde gegen Zielmenge, Marks, Overflow, `dead`, `pressure`, `offense` und `cutthroat` geprüft.
- Ergebnis: keine neue fachliche Korrektur erforderlich; die bereits vorhandene Trennung zwischen Scoring-Modus und Zielmenge bleibt konsistent.

### Triple/Double/Bull Hits und Single Bull Sound

- `src/features/triple-double-bull-hits/logic.js`
- `src/features/single-bull-sound/logic.js`
- Ergebnis: beide Features konsumieren bereits zentrale Domain-Helfer und duplizieren keine eigene Bull-Regellogik.

## Verbleibende Grenze

- Ein möglicher X01-`Bull mode` jenseits der aktuell modellierten `25/50`-Semantik ist im Repository derzeit nicht als gesicherte Runtime-Information verfügbar.
- Dieser Punkt wurde dokumentiert, aber nicht spekulativ implementiert.
