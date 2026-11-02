# QS: zusammengeführte Darstellungsfunktionen

Stand: 2. November 2026. Validierung: **Tier 2**, begrenzt auf die betroffenen Darstellungsfunktionen, X01-Verbraucher und xConfig-/Konfigurationsabläufe.

## Ergebnis

Der vorherige Cricket-/Tactics-Stand wurde mit `a73eaf8` (`refactor(cricket): unify table layout and status controls`) committed. Dieser Bericht dokumentiert die anschließende Tier-2-Prüfung vor der separat beauftragten Veröffentlichung als 3.7.0; deren Tier-3-Prüfung ergänzt diesen Prüfstand.

| Gemeinsame Kachel | Weiterhin unabhängig schaltbare Bereiche |
| --- | --- |
| Board-Treffermarkierungen | Native Marker hervorheben; Dart-Bilder anzeigen |
| X01-Restscore | Finishbaren Restscore hervorheben; Restscore-Balken anzeigen |
| Wurfanzeige | Dart-Symbole gestalten; Treffer hervorheben; Wurfsumme animieren |

Die vorhandene gemeinsame Cricket-/Tactics-Kachel bleibt erhalten. Insgesamt erscheinen 19 Kacheln, davon 8 allgemein, 5 für X01, 2 für Cricket/Tactics und 4 für Design. Die 24 zugrunde liegenden Feature-Deskriptoren und ihre Konfigurationsschlüssel bleiben bestehen.

Verwandte Renderer teilen einen Frame-Scheduler, eine Game-State-Subscription je Quelle und DOM-Lesungen innerhalb eines Frames. Aktivierung, DOM-Besitz, Beobachtung und Aufräumen bleiben je Renderer getrennt. Die Geometrie der Wurfanzeige liegt in einem gemeinsamen Modul. Die bestehende Aktivierung über die Checkout-Vorschlagsgestaltung bleibt erhalten. Ein Restscore unter 170 ersetzt weiterhin keine regelbasierte Checkout-Prüfung.

## Ausgeführte Prüfungen

- **573 Tests bestanden** mit `node --test` in den unten aufgeführten 34 Dateien.
- **10 Dokumentationsprüfungen bestanden**: generierte Übersicht, Kachelzahlen, stabile Links, Beschreibungen aller Felder und Auswahlwerte sowie Zeichenkodierung. Aufruf: `node --test --test-name-pattern='counts|generated|stable xConfig module anchor|field carries|select option|mojibake' tests/runtime/readme-docs.test.js`.
- **14 Chromium-Fälle bestanden**: `presentation-groups.spec.js`, `feature-combinations.spec.js`, `x01-checkout-consumers.spec.js`, `xconfig-ui-comparison.spec.js` unter `e2e/`, mit `--project=chromium --workers=1 --reporter=line`. Nach der abschließenden Feldgliederung wurden die 4 Fälle aus `presentation-groups.spec.js` und `xconfig-ui-comparison.spec.js` erneut erfolgreich ausgeführt.
- **ESLint für alle 32 geänderten JavaScript-/MJS-Dateien bestanden**.
- **`git diff --check` bestanden**. Zum Zeitpunkt dieser Tier-2-Prüfung erfolgten weder Release-Commit noch Versionswechsel, Changelog- oder `dist/`-Refresh.

Die Tests prüfen alle Aktivierungskombinationen der drei neuen Gruppen, getrenntes Abschalten, gemeinsame Aktualisierung und Subscription-Freigabe, originale Feldidentitäten einschließlich gleichnamiger Einstellungen, Import-/Export-Rundläufe sowie den Erhalt nativer Marker und Wurfsummen. Browser-Fixtures prüfen DOM-Knotenaustausch, Observer-/Listener-Abbau, Checkout-Ziele mit Zoom, native und Tools-Marker sowie Dialoge und Schalter bei 1280 und 390 Pixeln Breite. Desktop- und Mobil-Screenshots der Wurfanzeige wurden zusätzlich gesichtet.

Die 34 Dateien des Node-Testlaufs:

```text
tests/domain/x01-rules.test.js
tests/runtime/checkout-score-highlight.test.js
tests/runtime/checkout-suggestion-styles.test.js
tests/runtime/x01-remaining-score-bar.test.js
tests/runtime/dart-marker-replacer-runtime.test.js
tests/runtime/dart-marker-replacer-transition.test.js
tests/runtime/dart-marker-replacer-pose.test.js
tests/runtime/marker-ownership.test.js
tests/runtime/special-hit-highlights-logic.test.js
tests/runtime/special-hit-highlights-style.test.js
tests/runtime/turn-score-counter.test.js
tests/runtime/single-bull-hit-sound-logic.test.js
tests/runtime/modern-x01-surface.test.js
tests/runtime/x01-checkout-context.test.js
tests/runtime/x01-checkout-route.test.js
tests/runtime/tv-board-zoom-runtime.test.js
tests/runtime/tv-board-zoom-layout.test.js
tests/runtime/feature-surface-group.test.js
tests/runtime/presentation-group-runtime.test.js
tests/runtime/config-transfer.test.js
tests/runtime/feature-config-spec.test.js
tests/runtime/runtime-config.test.js
tests/runtime/bootstrap-config-reconciliation.test.js
tests/runtime/xconfig-shell.test.js
tests/runtime/xconfig-render-controller.test.js
tests/runtime/xconfig-effect-preview-controller.test.js
tests/runtime/xconfig-focus-controller.test.js
tests/runtime/xconfig-structure-consistency.test.js
tests/runtime/xconfig-preview-assets.test.js
tests/runtime/xconfig-action-controller.test.js
tests/runtime/xconfig-path-utils.test.js
tests/runtime/global-theme-modules.test.js
tests/runtime/cricket-layout.test.js
tests/runtime/modern-cricket-surface.test.js
```

## Grenzen

Die Chromium-Prüfung verwendet isolierte lokale Fixtures und im Speicher gebündelten Quellcode. Ein echtes laufendes Autodarts-Match, andere Browser und das veröffentlichte Userscript wurden dabei nicht geprüft. Zum Zeitpunkt dieser Tier-2-Prüfung wurden Vollsuite, Produktionsbuild, SonarQube und Packaging nicht ausgeführt, da zunächst eine begrenzte Quellcodeänderung ohne Release-Auftrag vorlag.

## Ergänzung zur anschließend beauftragten Version 3.7.0

Für die Veröffentlichung wurde auf **Tier 3** erweitert. `npm run verify` bestand mit Lint, Build, Syntaxprüfung, 1.515 Tests, lokalem SonarQube, Changelog- und Release-Verträgen. SonarQube meldete nach Bereinigung von sieben Wartbarkeitsbefunden ein grünes Quality Gate und keine offenen Issues. Alle 29 Chromium-Fälle bestanden erneut. Zusätzlich bestanden Agent-Anweisungen, Dart-Asset-Prüfung, Domain-Coverage und das Domain-Mutation-Gate mit 80,17 % bei geforderten 80 %. Die Sonar-Bereinigung betrifft Funktionsverschachtelung, Parameterdeklarationen und einen konsistenten Renderer-Rückgabetyp; die Domain-Regeln bleiben unverändert.

Öffentliche Assets, Tag, Release-Workflow und Raw-Brücken werden im nachfolgenden Veröffentlichungsablauf separat geprüft. Eine tatsächliche Tampermonkey-Installation und ein Live-Match bleiben außerhalb dieser lokalen Prüfung.

Commit-Vorschlag für die neuen Änderungen: `refactor(ui): combine board markers, X01 score and turn display`.
