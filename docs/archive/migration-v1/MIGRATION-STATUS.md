# Migrationsstatus

## Ausgeliefert in v1.1.0

### Funktionale Parität

- Alle 15 relevanten Legacy-Animationen und Komfortfunktionen sind im Bundle enthalten.
- Alle 5 Legacy-Themes sind als modulare Theme-Features enthalten.
- Die zentrale Oberfläche `AD xConfig` ist Teil der Runtime und steuert alle ausgelieferten Module.
- Der Legacy-Testbutton für `Winner Fireworks` ist als saubere Bundle-UX wieder vorhanden.

### Regelstand

- X01-Regeln sind für `straight`, `double` und `master` sauber modelliert.
- Cricket/Tactics trennen Zielmenge, Marks, Overflow-Scoring und Gewinnerlogik.
- Für Cut-Throat gilt im Audit und in der Domain-Logik: niedrigster Punktestand gewinnt.

### Technischer Stand

- Feature-Logik bleibt strikt von Domain-Regeln getrennt.
- xConfig speichert Toggles, Einstellungen und Theme-Hintergründe persistent.
- Das Bundle ist idempotent: wiederholtes Starten oder Re-Rendern erzeugt keine doppelten Instanzen.

## Bewusst nicht übernommen

- `AD xConfig Auto Loader.user.js`
- Remote-Cache-, GitHub-Sync- und Admin-Flows aus dem Legacy-Config-Bestand
- ungenutzte Vendor-Dateien ohne aktuelles Feature (`gsap`, `mo.js`)
- veraltete Skripte aus `.oldrepo/Deprecated`

## Bekannte Grenzen

- Autodarts dokumentiert für X01 zusätzlich einen `Bull mode`; dieser ist im aktuellen Match-State nicht verlässlich verfügbar.
- Deshalb bleibt die Runtime bei gesicherter Split-Bull-Semantik: `SB = 25`, `DB/BULL = 50`.

## Weiterführende Dokumente

- [Legacy-Inventur](OLDREPO-INVENTORY.md)
- [Neue System-Inventur](NEW-SYSTEM-INVENTORY.md)
- [Legacy-Diskrepanzmatrix](LEGACY-DISCREPANCY-MATRIX.md)
- [Release-QA-Report](RELEASE-QA-REPORT.md)
