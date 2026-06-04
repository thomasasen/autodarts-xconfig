# Release-QA-Report

## Zusammenfassung

`autodarts-xconfig` ist für `v1.1.0` auf einen stabilen Release-Stand gebracht:

- Legacy-Bestand gegen `.oldrepo` geprüft
- Regelmodule für X01, Cricket und Tactics fachlich validiert
- xConfig auf klickbare, persistente Endnutzer-Konfiguration geprüft
- Userscript-Build und Test-Suite erfolgreich ausführbar

## Paritätsaudit

- 15 Legacy-Animationen und Komfortfunktionen sind im Bundle enthalten.
- 5 Legacy-Themes sind im Bundle enthalten.
- `AD xConfig` ist funktional wieder vorhanden.
- Der frühere `Winner Fireworks`-Testbutton wurde als Feature-Action über `runFeatureAction(featureKey, actionId)` wiederhergestellt.
- Bundle-only bleibt bewusst: Loader-, Remote-Cache- und Admin-Flows wurden nicht zurückgebracht.

## Regelvalidierung

- X01:
  - Checkout-, Bust- und Finish-Regeln für `straight`, `double` und `master` verifiziert
  - Bull als `25/50` konsistent modelliert
  - Visit-Auswertung mit Bust-Reset testbar gemacht
- Cricket/Tactics:
  - Zielmenge `15..20 + Bull` bzw. `10..20 + Bull` verifiziert
  - Marks, Closure und Overflow-Scoring validiert
  - Cut-Throat auf niedrigsten Punktestand als Sieger ausgerichtet
  - Gewinnerlogik als reine Domain-Funktion ergänzt

## Feature-Vollständigkeit

- Konfiguration im Spiel ohne Code-Edit möglich
- Theme-Auswahl, Toggles, Settings und Bildpersistenz funktionieren
- README- und Screenshot-Referenzen sind konsistent
- Dist-Userscript ist das kanonische Installationsartefakt

## Verbleibende Grenzen

- Kein Remote-Loader- oder GitHub-Sync-Flow mehr; das ist eine bewusste Produktentscheidung.
- Der X01-`Bull mode` wird erst modelliert, wenn Autodarts ihn verlässlich im Match-State liefert.

## Manual QA Check: Cricket Template Layout

- Viewports: `1366x768`, `1920x1080`, `2560x1440`
- Modes: `Cricket` and `Tactics`
- Player counts: `2`, `3`, `4`
- Acceptance:
  - no large vertical gap between throw row and player/grid area
  - row labels (`20...Bull`) stay fully visible in viewport
  - board uses the available right-side area significantly better
  - no overlap with `Undo`/`Next`
- Smoke:
  - `AVG anzeigen` on/off
  - theme background image on/off
  - no layout regressions during these toggles
