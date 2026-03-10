# Cricket/Tactics Soll-Ist-Abweichungsmatrix

Stand: 2026-03-10 (Baseline + Post-Fix-Verifikation)

## Methodik

- Soll-Referenz:
  - README: [Cricket Target Highlighter](../README.md#animation-autodarts-animate-cricket-target-highlighter)
  - README: [Cricket Grid FX](../README.md#animation-autodarts-animate-cricket-grid-fx)
  - README: [Theme Cricket](../README.md#template-autodarts-theme-cricket)
  - Screenshots:
    - `docs/screenshots/animation-cricket-target-highlighter.png`
    - `docs/screenshots/animation-cricket-grid-fx.png`
    - `docs/screenshots/template-theme-cricket-xConfig.png`
- Ist-Referenz:
  - Runtime-Tests (`npm.cmd test`) Baseline: grün
  - Codepfade:
    - `src/domain/cricket-rules.js`
    - `src/features/cricket-highlighter/logic.js`
    - `src/features/cricket-grid-fx/logic.js`
    - `src/features/themes/cricket/style.js`
  - reproduzierbare Node-/Harness-Repros

## Abweichungen (Vorher)

| ID | Soll (README/Screenshot) | Ist (Runtime) | Repro | Kategorie | Ursache-Hypothese | Fix-Ansatz | Post-Fix-Check | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CTC-001 | Mark-Fortschritt in Cricket/Tactics muss korrekt aus den echten Grid-Zeichen gelesen werden; Screenshots zeigen Symbolmarkierungen (`/`, `X`, `⊗`) | Symbolmarkierungen wurden als `0` gelesen, wenn keine numerischen `data-marks`/`alt`-Werte vorlagen | Node-Repro: Grid-Zelle `⊗` ergab vorher `marksByLabel['20'] = [0,0]` | Logikfehler | DOM-/Parser-Fehler in Mark-Parsing | Zentrales Mark-Parsing in Domain erweitert und in Highlighter/Grid-FX angebunden | `tests/domain/cricket-rules.test.js` (`parseCricketMarkValue...`) und `tests/runtime/cricket-render-state.test.js` (`symbolic mark glyphs...`) grün | resolved |
| CTC-002 | Aktiver vs. inaktiver Spieler muss farblich sofort korrekt sein (Board + Grid), auch bei UI-Reihenfolgewechseln | Aktiver Spielerindex wurde primär aus sichtbarer DOM-Reihenfolge aufgelöst; Konflikte konnten falsche Perspektive erzeugen | Repro-Fall DOM-Order vs. State-Index | Logikfehler | Player-State-Mapping (DOM-Reihenfolge statt stabile Zuordnung) | Active-Index-Auflösung mit Priorität auf Game-State, wenn Grid-Spalten explizit indexiert sind (`data-player-index`) | `tests/runtime/cricket-render-state.test.js` (`state index wins over DOM order...`) grün | resolved |
| CTC-003 | Grid-/Board-Zustände müssen aus derselben fachlichen Quelle stammen, ohne doppelte Parser-Semantik | Highlighter und Grid FX hatten lokale Mark-Parser-Details (Duplikatrisiko) | Codeinspektion `parseMarksValue` in beiden Features | Logikfehler | Verteilte Parserlogik | Mark-Parselogik zentral in `src/domain/cricket-rules.js` (`parseCricketMarkValue`) eingeführt und konsumiert | Domain- + Runtime-Suiten grün (`npm.cmd test`) | resolved |
| CTC-004 | Tactics darf keine neue erfundene Semantik erhalten; `strict/slop` muss mindestens kompatibel eingeordnet sein | `strict/slop` war nicht explizit als Tactics-Submodus normalisiert | Codeinspektion `variant-rules.js` | Logik-/Dokulücke | Unvollständige Variantenklassifikation | Kompatible Submodus-Klassifikation ergänzt (ohne Gameplay-Änderung) und in Render-State sichtbar gemacht | `tests/domain/variant-rules.test.js` + `tests/runtime/cricket-render-state.test.js` (`tactics precision token...`) grün | resolved |
| CTC-005 | Grid FX soll `danger` und `pressure` fachlich trennbar darstellen (README: Gegnerdruck explizit) | Label-/Badge-State behandelte `pressure` als `danger`-Alias | Codeinspektion `setLabelStateClasses`/`setBadgeStateClasses` | UI-/Stylingfehler | Fehlende dedizierte State-Klasse | Dedizierte `pressure`-State-Klassen und CSS-Kontrakt ergänzt | `tests/runtime/cricket-grid-fx-effects.test.js` (`dedicated pressure state classes...`) grün | resolved |
| CTC-006 | Zustandsmodell soll explizit und testbar sein (`open/closed/own/dead/scorable/offense/danger/pressure`) | Teile waren implizit nur über `presentation` ableitbar | Codeinspektion `computeTargetStates` | Logik-/Testbarkeitslücke | Unvollständiges State-Interface | Zustandsobjekt um explizite Felder ergänzt (`open`, `own`, `scorable`, `threatenedByOpponents`, Gegnerzählungen) | Zusatztests in `tests/domain/cricket-rules.test.js` grün | resolved |
| CTC-007 | Theme Cricket muss mit Cricket-Overlays kollisionsfrei bleiben | Theme enthielt fragile Hash-Selektoren (`.css-*`) mit Risiko bei DOM-Klassenänderungen | Codeinspektion `src/features/themes/cricket/style.js` | UI-/Stylingrisiko | Theme-/CSS-Kollisionen durch volatile Selektoren | Stabile Fallback-Selektoren auf Hook-Basis (`#ad-ext-player-display`, `#grid`, `.ad-ext-crfx-badge`) ergänzt | Theme-/Runtime-Tests grün; Rest-Risiko bleibt für externe Chakra-Klassenwechsel außerhalb der stabilen Hooks | resolved |

## Abgrenzung / Nicht-Ziel

- Keine neue Tactics-Gameplay-Semantik.
- Keine direkte Bearbeitung von `dist/`.
- Kein Entfernen funktionaler Features außerhalb Cricket/Tactics.

## Verifikation nach Implementierung

Jede ID wird auf `resolved` oder `open` gesetzt, inklusive:

- konkrete Testreferenz
- ggf. verbleibendes Restrisiko
- Ursache-Hauptklasse:
  - Regellogik
  - Player-State-Mapping
  - DOM-/Parser-Fehler
  - Übergangslogik
  - Theme-/CSS-Kollisionen
  - Kombination
