# ExecPlan: Spiel-Layout – aktive Spielerrotation und Leg-Starter-Badge

## Status

- Branch: `feature/game-layout-active-player-rotation`
- Basis: `main` @ `b044b98ca661963a9e3072f914dc6c26bff16e40`
- Zielbereich: `theme-game-layout`
- Spielmodus: X01
- Implementierung: Core, Config, UI, START-Badge, Tests und generierte Doku umgesetzt
- Zwischen-QS: erfolgreich (gezielte Runtime-/Config-Tests, Syntax und ESLint)
- Finale QS: nach Red-Team-Korrekturen erneut erfolgreich
- Red-Team-Korrekturen: umgesetzt; gezielte Zwischen-QS erfolgreich
- Planstatus: implementiert, Red-Team-Befunde behoben und final revalidiert

## Umsetzungsstand

Die Umsetzung folgt dem Plan mit zwei bewusst getrennten Informationsachsen:

- Die **Display-Reihenfolge** wird ausschließlich aus den sichtbaren Player-Cards und ihrem aktiven Zustand abgeleitet. Im Modus `active-first` wird zyklisch rotiert, ohne native DOM-Knoten umzuhängen.
- Der **Leg-Starter** wird fail-safe aus `match.players[0].index` abgeleitet, nur wenn die Payload vollständig und die Sitzposition plausibel ist. Bei fehlender positiver Evidenz wird kein Badge angezeigt.
- Bei Overflow bleibt der aktive Spieler im Rotationsmodus oben sichtbar; das Scrollfenster bewegt nur die nachfolgenden inaktiven Spieler.
- Die Defaults bleiben `playerOrder: "fixed"` und `showLegStarter: false`, damit bestehende Installationen unverändert aussehen.

### Zwischen-QS – Ergebnis

Erfolgreich auf dem integrierten Core-Stand ausgeführt:

- `node --test tests/runtime/theme-game-layout.test.js`
- `node --test tests/runtime/feature-config-spec.test.js`
- `npm run check:syntax`
- gezieltes ESLint für die geänderten Runtime-, Config-, UI- und Testdateien

Alle Checks waren grün. Die Tests decken insbesondere zyklische Rotation, mehrdeutige Aktivzustände, Starter-Fallbacks, Leg-Wechsel, unveränderte DOM-Eltern, Cleanup sowie Overflow mit gepinntem aktiven Spieler ab.

### Red-Team-Nachprüfung – Befunde und Korrekturen

Eine zusätzliche adversarielle Prüfung nach der ersten finalen QS hat drei reproduzierbare Schwachstellen gefunden:

1. `null` bzw. leere `player.index`-Werte wurden durch numerische Coercion fälschlich als Sitz `0` interpretiert.
2. Ein veralteter Game-State aus einem vorherigen Match mit gleicher Spielerzahl konnte kurzzeitig einen falschen START-Badge erzeugen.
3. Zwei gleichzeitig aktive DOM-Marker konnten Layout-Metrik und tatsächliche Kartenhöhen auseinanderlaufen lassen und den Player-Viewport überfüllen.

Die Korrekturen:

- `player.index` wird nur noch akzeptiert, wenn er bereits eine echte ganzzahlige Zahl im gültigen Bereich ist; alle Sitzindizes müssen eindeutig sein.
- Der Snapshot wird zusätzlich gegen die sichtbaren Spielernamen in Sitzreihenfolge plausibilisiert. Bei Abweichung oder unvollständiger Evidenz wird kein Starter-Badge gezeigt.
- Bei keinem oder mehreren aktiven Spielern verwendet das Layout eine neutrale, konsistente Geometrie ohne Rotation und ohne Annahme eines einzelnen aktiven Spielers.
- Die drei Red-Team-Szenarien sind als dauerhafte Regressionstests in `theme-game-layout.test.js` übernommen.

Zwischen-QS nach den Korrekturen:

- `tests/runtime/theme-game-layout.test.js` – erfolgreich
- `tests/runtime/feature-config-spec.test.js` – erfolgreich
- `npm run check:syntax` – erfolgreich
- gezieltes ESLint – erfolgreich

GitHub-Actions-Lauf: `36321332759` – erfolgreich.

Finale Revalidierung nach den Red-Team-Korrekturen:

- `tests/runtime/theme-game-layout.test.js`: 20/20
- `tests/runtime/feature-config-spec.test.js`: 12/12
- `tests/runtime/xconfig-structure-consistency.test.js`: 9/9
- `tests/runtime/xconfig-shell.test.js`: 61/61
- `tests/runtime/readme-docs.test.js`: 26/26
- `npm run check:syntax`: erfolgreich (281 JavaScript- und 2 JSON-Dateien)
- gezieltes ESLint: erfolgreich
- `npm run sync:xconfig-docs` + Diff-Prüfung: synchron, kein generierter Doku-Diff

GitHub-Actions-Lauf: `36321397267` – erfolgreich.

### Finale QS – Ergebnis

Die erste finale Runde hat korrekt eine fehlende Optionsbeschreibung für `theme-game-layout.playerOrder.fixed` gefunden. Diese Doku-/UI-Konsistenzlücke wurde behoben und die generierte Dokumentation erneut synchronisiert.

Der anschließende finale Lauf war vollständig grün:

- `tests/runtime/theme-game-layout.test.js`
- `tests/runtime/feature-config-spec.test.js`
- `tests/runtime/xconfig-structure-consistency.test.js`
- `tests/runtime/xconfig-shell.test.js`
- `tests/runtime/readme-docs.test.js`
- `npm run check:syntax`
- gezieltes ESLint für alle geänderten Source-/Testdateien
- `npm run sync:xconfig-docs` mit anschließendem `git diff --exit-code -- README.md docs/FEATURES.md`

GitHub-Actions-Lauf: `36319334697` – erfolgreich.

## Ziel

Das bestehende xConfig-Feature **Spiel-Layout** wird so erweitert, dass der **aktuell werfende Spieler immer an erster Stelle der Spielerleiste** dargestellt wird.

Die übrigen Spieler rotieren **zyklisch in ihrer stabilen Sitzreihenfolge** hinter dem aktiven Spieler.

Zusätzlich kann der Spieler, der das aktuelle Leg begonnen hat, mit einem kleinen, unaufdringlichen **START-Badge** markiert werden. Der Badge bleibt beim Leg-Starter, auch wenn dieser durch die Rotation an eine andere sichtbare Position wandert.

Beispiel bei Sitzreihenfolge `A → B → C`:

```text
A aktiv:  A → B → C
B aktiv:  B → C → A
C aktiv:  C → A → B
```

Wenn A das Leg begonnen hat, bleibt der START-Badge bei A:

```text
A aktiv:
[START] A
        B
        C

B aktiv:
        B
        C
[START] A

C aktiv:
        C
[START] A
        B
```

Die sichtbare Position beantwortet damit **„Wer wirft gerade?“**, der Badge beantwortet **„Wer hat dieses Leg begonnen?“**.

## Nutzerkonfiguration

Unter **Design → Spiel-Layout** sollen zwei Einstellungen ergänzt werden.

### Spielerreihenfolge

Auswahl:

- `Fest`
- `Aktiver Spieler immer oben`

Empfohlener Default: `Fest`, damit bestehende Nutzer nach dem Update keine ungefragte Layoutänderung erhalten.

Semantik:

- `Fest`: bisherige Sitz-/DOM-Reihenfolge bleibt bestehen.
- `Aktiver Spieler immer oben`: echte zyklische Rotation ab dem aktiven Spieler.

### Leg-Starter anzeigen

Auswahl:

- `Aus`
- `An`

Default: `Aus`.

Bei `An` erhält der Spieler, der das aktuelle Leg begonnen hat, einen kleinen Badge mit der Beschriftung **START**.

Der Badge soll ruhig, kompakt und klar vom Aktiv-Status unterscheidbar sein. Keine blinkende oder alarmartige Darstellung; keine rote Warnfarbe.

## Fachliche Datenmodelle

Die Implementierung muss vier Begriffe strikt trennen:

- `seatIndex`: stabile Sitzposition des Spielers
- `active`: aktuell werfender Spieler
- `displayIndex`: aktuelle sichtbare Position im xConfig-Spiel-Layout
- `starterSeat`: Sitzposition des Spielers, der das aktuelle Leg begonnen hat

Diese Werte dürfen nicht vermischt werden.

## Relevante Autodarts-Eigenschaft

Der aktuelle Autodarts-Match-State darf **nicht** so interpretiert werden, als sei `match.players` dauerhaft in Bildschirm- oder Sitzreihenfolge.

Nach aktuellem, in Tools for Autodarts dokumentiertem Verhalten wird `match.players` pro Leg so angeordnet, dass der Spieler, der das Leg beginnt, zuerst steht.

Der Spieler-Payload enthält jedoch `player.index` als stabile Sitzposition.

Daraus folgen zwei Regeln:

1. **Rotation des sichtbaren Layouts** wird aus den tatsächlich aufgelösten Player-Cards und deren aktivem Zustand berechnet.
2. **Leg-Starter** darf aus dem Match-State abgeleitet werden, bevorzugt über `match.players[0].index`, sofern der State eindeutig und plausibel ist.

Kein `match.players[n]` darf pauschal mit Player-Card `n` gleichgesetzt werden.

## Architektur-Leitplanken

### Keine DOM-Umsortierung

Die nativen Autodarts-Karten dürfen nicht per:

- `appendChild`
- `insertBefore`
- `replaceChildren`
- oder vergleichbarer DOM-Reparenting-Logik

umgeordnet werden.

Das bestehende Spiel-Layout soll weiterhin ausschließlich xConfig-eigene Marker und visuelle Positionierung verwenden.

Die Rotation wird über die Berechnung von `--ad-game-layout-player-y` bzw. die bestehende Layout-Metrik abgebildet.

### Fail-safe

Wenn genau ein aktiver Spieler eindeutig erkannt wird:

- Rotation anwenden.

Wenn kein oder mehr als ein aktiver Spieler erkannt wird:

- keine neue Reihenfolge erraten,
- stabile bisherige Reihenfolge verwenden.

Wenn kein eindeutiger Leg-Starter aus dem Match-State bestimmt werden kann:

- keinen START-Badge anzeigen.

Ein kurzfristiger React-/DOM-Zwischenzustand darf nicht zu sichtbarem Hin-und-her-Springen oder falscher Zuordnung führen.

### Bestehendes Verhalten erhalten

Nicht verändern:

- Board-Größenberechnung
- Player-Card-Kompaktierung
- aktive/inaktive Kartenhöhe
- Schrift-Fitting
- Control-Dock
- Header-Kollisionskorrektur
- Restscore-Größe
- native Match-Logik

## Umsetzungsvorschlag

### Workstream 1 – Config und UI

Erweitere `themes.gameLayout` um semantische Config-Werte, sinngemäß:

```js
{
  enabled: false,
  playerOrder: "fixed",
  showLegStarter: false,
  debug: false
}
```

Zulässige Werte für `playerOrder`:

- `fixed`
- `active-first`

Bestehende Konfigurationen ohne neue Felder müssen sauber auf die Defaults normalisiert werden.

Betroffene Bereiche voraussichtlich:

- `src/config/feature-config-spec.js`
- `src/features/xconfig-ui/descriptors.js`
- `src/features/xconfig-ui/copy.js`
- Config-Tests

### Workstream 2 – Rotation

Eine kleine, deterministische Pure Function ergänzen, sinngemäß:

```js
rotatePlayersToActive(players)
```

Erwartete Eigenschaften:

- 0 Spieler → `[]`
- kein eindeutiger aktiver Spieler → unveränderte Reihenfolge
- A aktiv in `[A,B,C]` → `[A,B,C]`
- B aktiv → `[B,C,A]`
- C aktiv → `[C,A,B]`

Die Pure Function soll keine DOM-Operationen ausführen.

Die bestehende `markSurface(...)`-/Layout-Berechnung soll anschließend mit der **Display-Reihenfolge** arbeiten.

### Workstream 3 – Seat-Zuordnung und Starter

Für jede sichtbare Player-Card muss eine stabile Sitzposition verfügbar sein.

Bevorzugte Strategie:

- vorhandene DOM-/Surface-Reihenfolge als stabile Sitzreihenfolge behandeln,
- daraus `seatIndex` ableiten,
- Match-State nur zum Auflösen des `starterSeat` verwenden.

Der Starter kann bei plausibler Payload sinngemäß über:

```js
const starterSeat = snapshot?.match?.players?.[0]?.index;
```

aufgelöst werden.

Diese Annahme muss in Tests ausdrücklich abgesichert und als host-spezifische Integrationsannahme dokumentiert werden.

Wenn `player.index` fehlt, ungültig oder außerhalb der Player-Anzahl liegt:

- keinen Starter erraten.

### Workstream 4 – START-Badge

Keine zusätzliche React-/Framework-Struktur einführen.

Bevorzugt vorhandene Card-/Name-Region mit einem xConfig-eigenen Marker versehen, z. B.:

```text
data-ad-ext-game-layout-leg-starter="true"
```

Die sichtbare Badge-Darstellung nach Möglichkeit per CSS-Pseudo-Element erzeugen.

Vorteile:

- keine zusätzlichen DOM-Knoten nötig,
- React kann keinen xConfig-Child entfernen,
- Cleanup bleibt einfach,
- geringeres Risiko für Klick-/Layout-Nebenwirkungen.

Badge:

- Text: `START`
- klein
- Pill/Badge-Stil
- nicht rot
- nicht animiert
- darf Spielername, Avatar, Score und Statistiken nicht überdecken

Wenn Platz knapp wird, soll der Spielername weiterhin Vorrang haben.

## Mehrspieler- und Overflow-Verhalten

Bei wenigen Spielern:

- aktive Karte steht oben,
- weitere Spieler folgen zyklisch,
- bestehende Größenunterschiede aktiv/inaktiv bleiben erhalten.

Bei vielen Spielern:

- der aktive Spieler muss im Modus `active-first` immer sichtbar und oben bleiben.
- manuelles Scrollen darf den aktiven Spieler nicht dauerhaft aus der Anzeige entfernen.

Die aktuelle `firstVisibleIndex`-/Overflow-Logik muss deshalb bewusst gegen die neue Display-Reihenfolge geprüft werden.

Bevorzugtes Ziel:

- aktive Karte ist das stabile erste sichtbare Element,
- Scrollen betrifft nur den nachfolgenden Ausschnitt der inaktiven Spieler.

Falls dies für die erste sichere Implementierung unverhältnismäßig invasiv wäre, darf als Zwischenschritt die bestehende Scroll-Logik erhalten bleiben, **sofern der aktive Spieler nach jedem Runtime-Update wieder oben und sichtbar ist**. Diese Entscheidung muss im Plan dokumentiert werden.

## Zwischen-QS

Die Zwischen-QS erfolgt **nach Core-Logik + Config + Runtime-Verkabelung**, bevor Dokumentation/Feinschliff abgeschlossen werden.

Gemäß `AGENTS.md` ist für diese lokalisierte Feature-Änderung zunächst **Tier 1 – Targeted Validation** vorgesehen.

Mindestens prüfen:

### Pure Logic

Gezielte Tests für Rotation:

```text
[A,B,C] + active A -> [A,B,C]
[A,B,C] + active B -> [B,C,A]
[A,B,C] + active C -> [C,A,B]
```

Zusätzlich:

- 1 Spieler
- 2 Spieler
- 8 Spieler
- kein aktiver Spieler
- mehrdeutiger aktiver Zustand

### Config

Gezielter Config-Test:

- Default `playerOrder = fixed`
- Default `showLegStarter = false`
- gültige Werte
- ungültiger Wert → Default
- alte Config ohne neue Felder

### Runtime

Mit dem vorhandenen `theme-game-layout.test.js` mindestens:

- Wechsel A → B → C rotiert visuell korrekt
- DOM-Eltern der Player-Cards bleiben unverändert
- Aktiv/inaktiv-Styling folgt weiterhin dem tatsächlich aktiven Spieler
- Cleanup entfernt alle neuen Marker
- Feature `fixed` verhält sich wie bisher

### Starter

Mindestens:

- Leg-Starter A + aktiver B → B oben, Badge bleibt A
- neues Leg Starter B → Badge wechselt B
- rotiertes `match.players` verändert Sitzreihenfolge nicht
- fehlender/ungültiger `player.index` → kein Badge

Nach der Zwischen-QS:

- Diff auf Scope prüfen
- keine DOM-Reparenting-Operationen
- keine Änderung an `dist/**`
- gefundene Fehler zuerst beheben

Erst danach Doku und visuelles Feintuning abschließen.

## Dokumentation nach Zwischen-QS

Nach erfolgreicher Zwischen-QS:

- Source-of-Truth für Feature-Copy aktualisieren
- README/FEATURES nur über den vorhandenen Sync-Prozess aktualisieren, falls generiert
- Einstellungstexte verständlich halten
- keine Release-/Versionsänderung in diesem Branch vornehmen, sofern nicht separat beauftragt

Vorgeschlagene Nutzerbeschreibung:

> Ordnet die Spielerkarten auf Wunsch so, dass der aktuell werfende Spieler immer oben steht. Die übrigen Spieler folgen zyklisch in ihrer Sitzreihenfolge. Optional kennzeichnet ein START-Badge, wer das aktuelle Leg begonnen hat.

## Finale QS

Die finale QS findet **nach vollständiger Integration im Feature-Branch** statt.

Wegen des lokal begrenzten Feature-Scopes bleibt grundsätzlich Tier 1 bzw. bei mehreren zusammenhängenden Modulen Tier 2 angemessen. Kein unnötiger Repository-Full-Run, sofern keine Fehlereskalation oder explizite Release-Vorbereitung vorliegt.

Mindestens:

1. `tests/runtime/theme-game-layout.test.js`
2. `tests/runtime/feature-config-spec.test.js`
3. direkt betroffene UI-/Descriptor-/Docs-Consistency-Tests, sofern durch die Änderung berührt
4. file-/scope-spezifischer Lint für die geänderten Source-Dateien, falls im Repo sinnvoll verfügbar

Zusätzlich finale manuelle Code-QS:

- keine nativen Player-Cards verschoben/reparented
- `seatIndex`, `active`, `displayIndex`, `starterSeat` klar getrennt
- Rotation rein zyklisch
- START-Badge unabhängig vom aktiven Spieler
- Badge verschwindet bei unbekanntem Starter
- `fixed` entspricht dem bisherigen Verhalten
- aktive/inaktive Größen bleiben korrekt
- Overflow-Verhalten bei vielen Spielern geprüft
- Cleanup vollständig
- keine Debug-Ausgaben
- keine unbeabsichtigten Dateien
- `dist/**` unverändert

### Browser-/DOM-QS

Wenn die vorhandene Fixture/Playwright-Abdeckung den realen Player-Card-Wechsel hinreichend abbildet, einen gezielten Browser-/DOM-Contract-Test ergänzen oder ausführen.

Ein vollständiger Browser-Sweep ist nur nötig, wenn die gezielten Tests DOM-/Layout-Risiken nicht ausreichend abdecken oder ein Fehler auf breitere Regressionen hindeutet.

## Red-Team vor Abschluss

Vor Abschluss gezielt gegen folgende Fehlerbilder prüfen:

1. Autodarts rotiert `match.players` beim Leg-Wechsel.
2. DOM-Player-Cards bleiben gleichzeitig in Sitzreihenfolge.
3. Aktiver Spieler wechselt schneller als ein DOM-/State-Update.
4. Kurzzeitig ist kein aktiver Spieler markiert.
5. Zwei Spieler besitzen denselben Anzeigenamen.
6. `player.index` fehlt oder ist inkonsistent.
7. React ersetzt eine Player-Card.
8. 8+ Spieler erzeugen Overflow.
9. Nutzer schaltet während eines laufenden Legs von `fixed` auf `active-first`.
10. Nutzer schaltet den START-Badge während des laufenden Legs an/aus.
11. Cleanup / Feature-Deaktivierung stellt das bestehende Layout vollständig wieder her.
12. Ein neues Match startet und darf keinen Starter-State aus dem alten Match übernehmen.

## Akzeptanzkriterien

Die Arbeit ist erst abgeschlossen, wenn:

- `Aktiver Spieler immer oben` exakt zyklisch rotiert,
- keine DOM-Nodes umsortiert werden,
- `Fest` das bisherige Verhalten bewahrt,
- START-Badge korrekt und unabhängig vom Aktiv-Status funktioniert,
- unklare Zustände fail-safe behandelt werden,
- relevante gezielte Tests grün sind,
- Zwischen-QS und finale QS dokumentiert durchgeführt wurden,
- Doku/Config konsistent sind,
- kein Release und kein Merge ohne separate Freigabe erfolgt.

## Nicht im Scope

Nicht gleichzeitig umsetzen:

- Portrait Layout
- allgemeine Display-Profile
- Touch-Dock
- allgemeine Player-Identity-Abstraktion für alle Features
- Gameplay-/Turn-Reihenfolge verändern
- Autodarts-Match-State manipulieren
- neue Animationen
- Versionsbump / Release
- `dist/**`-Refresh

## Integration

Reihenfolge:

1. Config + Pure Rotation
2. Runtime-Verkabelung
3. START-Badge
4. **Zwischen-QS**
5. Fehlerkorrekturen
6. Doku + UI-Feinschliff
7. **Finale QS**
8. Review/PR erst nach Nutzerfreigabe
9. Merge erst nach ausdrücklicher Nutzerfreigabe

## Offene Punkte

Vor oder während der Implementierung technisch verifizieren:

- Ob `player.index` im aktuell von xConfig beobachteten X01-WebSocket-State zuverlässig vorhanden ist.
- Ob die bestehende DOM-Reihenfolge im unterstützten breiten Spiel-Layout über Leg-Wechsel hinweg tatsächlich die Sitzreihenfolge bleibt.
- Wie das manuelle Overflow-Scrolling im Modus `active-first` am sinnvollsten mit dem gepinnten aktiven Spieler harmoniert.

Bei fehlender positiver Evidenz nicht raten, sondern fail-safe auf bestehendes Verhalten zurückfallen.
