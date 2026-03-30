# Changelog

Alle nennenswerten Änderungen an diesem Projekt werden in dieser Datei festgehalten.

Das Format orientiert sich an [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
und die Versionsvergabe folgt [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Solange dieses Repository noch keine Git-Tags verwendet, verweisen die Versionslinks auf
GitHub-Vergleiche zwischen Release-Commits. Der neueste lokale Release-Eintrag kann bis
zum nächsten Release-Commit vorübergehend auf `HEAD` zeigen.

Dieses Repository führt keine `Unreleased`-Sektion. Jeder dokumentierte Eintrag gehört
direkt zu einer versionierten Release-Sektion.

## [2.0.98] - 2026-03-30

### Fixed

- Nutzerwirkung: Die Cricket-/Tactics-Spielerkarten behalten jetzt ihre korrekte obere Identitätszeile mit Namen und `35+`, während der untere Kartenbereich gleichzeitig ruhiger und kompakter wirkt: aktive und inaktive Karten sind gleich hoch, `Gewonnene Runden` und `MPR` bleiben links sauber zweizeilig, die Punktezahl bleibt rechts einzeilig, und beide Inhaltsblöcke sitzen im unteren Kartenbereich nun sichtbar vertikal mittig statt zu tief oder mit unnötigem Leerraum.
  Technik: Das Cricket-Theme entfernt die erzwungene Mindesthöhe der Spielerkarten, lässt `#ad-ext-player-display` seine Kartenhöhe wieder aus dem tatsächlichen Inhalt ableiten, streckt aktive und inaktive Karten anschließend über den gemeinsamen Grid-Track auf dieselbe Außenhöhe, und verwendet für den Karten-Stack jetzt ein fünfreihiges Grid mit oberen und unteren Flex-Spacern; dadurch bleiben Name und Meta-Zeile unangetastet, während Matches-/Stats-Block links sowie der Score rechts innerhalb des unteren Kartenbereichs jeweils stabil vertikal zentriert werden. Zusätzliche Style-Regressionen sichern den neuen Fünfzeilen-Vertrag, die fehlende Legacy-Mindesthöhe und die aktualisierten Slot-Positionen ausdrücklich ab.
- Nutzerwirkung: Die Cricket-/Tactics-Spielerkarten wirken im unteren Statistikbereich jetzt ausgewogener: Die Anzeige der gewonnenen Runden ist sichtbar kleiner, `MPR` etwas größer, aktive und inaktive Karten haben nun denselben kleinen Abstand zwischen Badge und `MPR`, und die inaktiven Karten verwenden für Namen, `MPR` und die Badge-Fläche der gewonnenen Runden jetzt dieselbe helle Tonalität wie die Punkteanzeige, wodurch das Gesamtbild ruhiger und stimmiger wirkt.
  Technik: Das Cricket-Theme verkleinert die linke `matches`-Badge über neue kompaktere Badge-Variablen, hebt die `stats`-Typografie für `MPR` leicht an, ergänzt einen gezielten zusätzlichen `margin-top` nur für den aktiven `stats`-Slot, damit der bestehende Inaktiv-Abstand exakt gespiegelt wird, und führt für inaktive Karten explizite Farb-Overrides für Namen, `stats` und Badge-Hintergrund ein, während der Zifferntext in der Badge absichtlich dunkel bleibt; zusätzliche Style-Regressionen sichern die neuen Badge-Maße, die größere `MPR`-Skala, den aktiven Zusatzabstand und die inaktive Farb-Hierarchie ausdrücklich ab.

## [2.0.96] - 2026-03-30

### Fixed

- Nutzerwirkung: Im Cricket-/Tactics-Theme sind die Spielernamen jetzt nochmals spürbar größer, und die linke Kartenstatistik ist ruhiger aufgebaut: Die Anzeige der gewonnenen Runden sitzt oberhalb von `MPR`, bleibt sichtbar kleiner als zuvor und teilt sich die verfügbare Höhe jetzt sauber mit der MPR-Zeile, sodass beide zusammen praktisch exakt der Punktehöhe entsprechen.
  Technik: Das Cricket-Theme verwendet für den linken `matches`-/`stats`-Block jetzt ein explizites Dreizeilen-Grid mit `identity`, `matches` und `stats`, berechnet die `matches`-Zeilenhöhe direkt aus der aktiven bzw. inaktiven Score-Höhe minus fester Stats-Zeile, skaliert die sichtbare Badge innerhalb dieser Zeile separat herunter, hebt gleichzeitig die aktive sowie inaktive Namensskala um weitere fünfzehn Prozent an und erzwingt die Badge-Schrift jetzt auch direkt auf dem Badge-Container, damit spätere Host-/Theme-Regeln die Größe nicht wieder auf den kleinen Legacy-Wert zurückdrücken.
- Nutzerwirkung: Die Anzeige der gewonnenen Runden und `MPR` sitzt auf den Cricket-/Tactics-Spielerkarten jetzt etwas weiter vom linken Rand weg und wirkt damit ausgewogener zur Punktezahl auf der rechten Seite.
  Technik: Das Cricket-Theme verwendet für den linken `matches`-Slot und den sichtbaren `MPR`-Text jetzt einen gemeinsamen linken Innenabstand, der sich am rechten Score-Inset orientiert; zusätzliche Style-Regressionen sichern die neue symmetrischere Karten-Geometrie ausdrücklich ab.

## [2.0.94] - 2026-03-30

### Changed

- Nutzerwirkung: Die kleine linke Rundengewinn-/Match-Badge auf den Cricket-/Tactics-Spielerkarten ist jetzt deutlich präsenter und ungefähr dreimal so groß wie zuvor, ohne die Stats-Zeile aus dem Layout zu drängen; die separate obere `35+`-Meta-Badge bleibt wieder in ihrer kompakten Größe.
  Technik: Das Cricket-Theme verwendet für den linken `matches`-Slot jetzt eigene Größenvariablen für Badge-Fläche, Radius, Innenabstand und Ziffernfont, während die versehentlich vergrößerte Identity-Meta-Badge wieder auf ihren kompakten Vertrag zurückgesetzt wurde; die Style-Regression sichert beide Pfade ausdrücklich ab.

## [2.0.93] - 2026-03-30

### Changed

- Nutzerwirkung: Im Cricket-/Tactics-Theme darf das Board jetzt mehr von der verfügbaren Höhe ausnutzen, sobald die Spielertabelle dafür realistisch Breite abgeben kann; wenn die Tabelle tatsächlich mehr Raum braucht, behält sie weiterhin Priorität.
  Technik: Die Cricket-Readability misst die linke Spielertabelle nicht mehr nur in ihrer aktuellen, selbstverstärkten Breite, sondern führt zusätzlich einen kontrollierten Breiten-Probezug unter Druck aus und verwendet daraus die kleinere, tatsächlich benötigte Tabellenbreite als Auto-Readability-Basis; eine neue Runtime-Regression sichert ausdrücklich ab, dass freier Slack wieder an das Board zurückgegeben wird, ohne die Tabellen-Priorität aufzugeben.

## [2.0.92] - 2026-03-29

### Changed

- Nutzerwirkung: Das Cricket-Board erscheint im rechten Bereich jetzt wieder klar abgegrenzt und gerahmt, sodass die Dartscheibe optisch sauber vom restlichen Layout getrennt wird, ohne die bereits verbesserte Flächenausnutzung zu verlieren.
  Technik: Das Cricket-Theme rendert `.ad-ext-theme-board-panel` jetzt mit einer dunklen Verlaufsfläche, subtiler Kontur, leichter Tiefenwirkung und ausgeblendeten Überläufen statt vollständig transparent; die Style-Regression prüft den neuen Board-Panel-Vertrag ausdrücklich, und der Release-Stand wurde auf `2.0.92` angehoben.

## [2.0.91] - 2026-03-29

### Fixed

- Nutzerwirkung: Im Cricket-/Tactics-Theme erscheinen die Spielernamen jetzt etwas größer, und die linke Bull-Labelzelle der Tabelle zeigt stabil `⦿` statt `Bull`, ohne zwischen Host-Text und Glyph zu flackern oder breiter bzw. höher als die Zahlzellen `20` bis `15` zu werden.
  Technik: Die Cricket-Namensskalen wurden im Theme um rund zehn Prozent erhöht, und die Grid-FX-Logik behandelt die vordere Bull-Zelle jetzt ausdrücklich wieder als normale Label-Cell statt als separates Badge, ersetzt dort sichtbare `Bull`-Beschriftungen gezielt durch `U+29BF`, markiert Bull-Knoten zusätzlich mit einer kanonischen DOM-Labelkennung für stabile Re-Discovery und stellt den ursprünglichen Host-Text samt Attributen beim Cleanup wieder her; zusätzliche Regressionen sichern die neue Namensskala, die Bull-Frontzelle und den flackerfreien Bull-Rediscovery-Pfad ausdrücklich ab.

## [2.0.90] - 2026-03-29

### Fixed

- Nutzerwirkung: Das Cricket-/Tactics-Theme stellt die linke Spielfläche nach der `2.0.89`-Regression wieder korrekt dar, sodass Spielerkarten und Grid nicht mehr kollabieren oder nach unten wegrutschen, während die zuletzt verbesserten Namen-, Score- und Board-Anpassungen erhalten bleiben.
  Technik: Das linke Cricket-/Tactics-Layout verwendet jetzt wieder eine kollisionsfreie Flex-Spalte statt eines mit alten Shared-Grid-Regeln konkurrierenden Zweizeilen-Grids, setzt `#ad-ext-player-display` explizit von geerbten `grid-area`-/`grid-row`-Platzierungen zurück, lässt den gemeinsamen Grid-Container die Resthöhe als echter Flex-Füller belegen und ersetzt die fehlerhafte Style-Regression durch Absicherungen für den neuen Flex-Vertrag.

## [2.0.89] - 2026-03-29

### Fixed

- Nutzerwirkung: Im Cricket-/Tactics-Theme bleiben Spielernamen auf den Spielerkarten jetzt wieder sichtbar und sinnvoll lesbar, der aktive Punktestand ist klar größer als bei inaktiven Spielern, und das Board füllt den rechten Bereich deutlich besser aus statt unnötig klein zu bleiben.
  Technik: Die Cricket-Spielerkarten normalisieren hostseitig bereits gekürzte Namens-Strings jetzt gegen vollständigere Quellen wie Avatar-`alt`, spiegeln rekonstruierte Vollnamen direkt im sichtbaren Text und `title`, erzwingen die aktive/inaktive Namenshierarchie konsistent auf Wrapper und innerem Textknoten, rücken die Score-Anzeige mit einem echten End-Inset etwas vom rechten Rand weg und strecken die gemeinsame Cricket-/Tactics-Grid-Fläche über ein zweizeiliges Linkslayout mit gleichmäßig verteilten Auto-Zeilen besser auf die verfügbare Resthöhe; zusätzliche Runtime- und Style-Regressionen sichern Namens-Recovery, DOM-Drift und die neuen Höhen-/Inset-Verträge ausdrücklich ab.

## [2.0.88] - 2026-03-29

### Fixed

- Nutzerwirkung: `Checkout Board Targets` markiert im Modus `Nächstes Feld` jetzt wieder stabil das tatsächlich zuerst zu spielende Checkout-Ziel, sodass bei einer sichtbaren Route wie `25`, `D18` jetzt `Single Bull / 25` statt fälschlich `D18` aufleuchtet.
  Technik: Die X01-Zielauswahl bevorzugt in `next` jetzt das erste sichtbare Routenfeld, nutzt den direkten Score-Checkout nur noch als gezielten Stale-Route-Override bei unplausiblen Erstschritten, gleicht DOM- und Game-State-Score gegeneinander ab und bevorzugt bei Konflikten den sichtbaren DOM-Score; zusätzliche Runtime-Regressionen sichern sowohl den Live-Fall `61 -> 25, D18` als auch den alten `50 -> BULL`-Override ausdrücklich ab.
- Nutzerwirkung: Bare Checkout-Hinweise wie `25` werden in X01-Routen wieder korrekt als `Single Bull` verstanden und können dadurch zuverlässig auf dem Board hervorgehoben werden.
  Technik: Die explizite Checkout-Segment-Erkennung akzeptiert jetzt auch unpräfixte `25` sowohl in den X01-Regeln als auch im Route-Fallback, und eine zusätzliche Routen-Regression schützt die Normalisierung `25 -> S25` vor erneutem Drift.
- Nutzerwirkung: `Checkout Board Targets` hebt den `Single Bull / 25`-Ring bei sichtbaren X01-Checkouts jetzt deutlich klarer hervor, sodass der äußere Bull-Ring im Standard-`Pulse`-Modus spürbar sichtbarer leuchtet statt nur sehr dezent zu pulsieren.
  Technik: `bull`-Ziele erhalten im `pulse`-Modus jetzt ein eigenes Sichtbarkeitsprofil mit stärkerer Mindest-Opacity, größerer Puls-Skalierung, breiterer Kontur und themengefärbtem Halo; außerhalb von `pulse` bleiben `blink` und `glow` absichtlich auf dem bisherigen, effektneutralen Styling, und neue Render-Regressionen sichern beide Verträge ausdrücklich ab.
- Nutzerwirkung: Beim `X01 Score Progress` sitzt die Linie auf inaktiven Spielerkarten jetzt wieder klar unterhalb der Statistikzeile, statt in kleinen Inaktiv-Karten in die `Ø`-Anzeige hineinzurutschen.
  Technik: Der Progress-Stack erzwingt für `.ad-ext-player-inactive` jetzt eine eigene dritte `max-content`-Zeile mit `height:auto`, damit Theme-Höhenzwänge die mittlere Stats-Zeile nicht mehr auf `0px` kollabieren lassen; eine Style-Regression deckt den Inaktiv-Vertrag ausdrücklich ab.

## [2.0.86] - 2026-03-29

### Fixed

- Nutzerwirkung: `Checkout Board Targets` bleibt bei X01-Reloads und kurzzeitig fehlenden Checkout-Suggestions jetzt stabiler sichtbar, bevorzugt das aktuell echte Finish-Feld wie `D18` oder `BULL`, und äußere Double-/Triple-Ziele pulsen deutlich präsenter statt nur schwer erkennbar zu flackern.
  Technik: Die X01-Zielauswahl priorisiert jetzt scorebasierte Echtzeit-Finishes vor stale Routenschritten, hält das letzte gültige Overlay kurz durch Hydration-Lücken, rendert äußere `D`-/`T`-Segmente mit verstärktem Pulse-/Halo-Profil, lässt `SB`/`DB` bewusst auf dem Basisprofil, und neue Runtime-Regressionen decken Stale-Route-, Reload- sowie Outer-vs-Bull-Pfade ausdrücklich ab.

## [2.0.85] - 2026-03-29

### Fixed

- Nutzerwirkung: Der `Single Bull Sound` spielt bei einem einzelnen Single-Bull-Treffer jetzt stabil nur noch einmal ab, auch wenn Autodarts Score- und Segment-Text derselben Wurfzeile kurz nacheinander aktualisiert oder der erste Audioversuch durch den Browser blockiert wird.
  Technik: Die Runtime dedupliziert Single-Bull-Signale jetzt pro Turn und Wurf-Slot erst nach erfolgreichem Playback, gibt blockierte Versuche für einen sauberen Retry wieder frei, leert veraltete Node-Marker bei geleerten Throw-Zeilen sauber, und neue Regressionstests decken getrennte DOM-Updates derselben Throw-Row, den Reset zwischen zwei Turns sowie blockierte Audiostarts ausdrücklich ab.
- Nutzerwirkung: `Animate Triple, Double, Bull Hits` reagiert bei manuellen Wurfkorrekturen jetzt robuster und lässt sich nicht mehr von fremden `Cancel`-/`OK`-Buttons außerhalb der aktiven Wurfoberfläche irritieren.
  Technik: Die Pending-Korrekturerkennung ist jetzt auf den Turn-Surface um `#ad-ext-turn` begrenzt, verlangt reale `correction-bg`-Marker im aktuellen Throw-Set, und neue Regressionstests decken sowohl False Positives außerhalb des Turn-Bereichs als auch Bestätigungs- und Cleanup-Pfade ab.
- Nutzerwirkung: X01-Checkout-Hinweise ignorieren in Fallback-Situationen jetzt versteckte, veraltete Suggestion-Knoten, sodass kollabierte, aber noch stilistisch sichtbare Routen Vorrang vor stale Hidden-Hints behalten.
  Technik: Die Checkout-Route respektiert im Fallback jetzt zuerst die Style-Sichtbarkeit und fällt erst danach auf rein parsebare Texte ohne Sichtbarkeitsmerkmale zurück; neue Regressionen decken kollabierte Rects und explizit versteckte stale Suggestions gemeinsam ab.
- Nutzerwirkung: Die Spielerkarten-Zentrierung im X01- und Shanghai-Theme bleibt jetzt auch stabiler, wenn Autodarts interne Chakra-Hashklassen austauscht.
  Technik: Das gemeinsame Player-Card-Layout hängt nicht mehr an konkreten Chakra-Hashselektoren, sondern nutzt stabile xConfig-Stack-/Player-Selektoren; die Theme-Parity-Regressionen sichern den robusteren Vertrag ausdrücklich mit ab.

### Changed

- Nutzerwirkung: Die lokale Release-Historie bleibt im aktuellen Versionsblock nachvollziehbarer, weil fehlerhafte Compare-Links jetzt früher auffallen.
  Technik: `scripts/check-changelog-consistency.mjs` validiert für den aktuellen Release-Block echte GitHub-Compare-Ranges und erlaubt `HEAD` nur noch in der obersten lokalen Release-Sektion; zusätzliche Regressionstests sichern bounded Ranges und ältere `HEAD`-Fehler explizit ab.

## [2.0.84] - 2026-03-29

### Fixed

- Nutzerwirkung: Im Shanghai-Theme sind die Spielerkacheln jetzt wie im X01-Theme mittig ausgerichtet, sodass Namen, Werte und Zusatzinfos wieder ausgewogen zentriert statt sichtbar versetzt erscheinen.
  Technik: Das gemeinsame Theme-System erzeugt den zentrierten Spielerkachel-Grid-Vertrag jetzt über einen wiederverwendbaren Shared-Helper für X01 und Shanghai, und die Theme-CSS-Regression deckt die aktive Karten-Zentrierung für Shanghai ausdrücklich mit ab.

## [2.0.83] - 2026-03-29

### Fixed

- Nutzerwirkung: Die Theme-Ansichten blenden störende native Scrollbalken jetzt konsequent aus, sodass auch bei kurzfristigen Layout- oder Größenabweichungen keine sichtbaren Scrollleisten mehr im Theme auftauchen.
  Technik: Die gemeinsame Theme-CSS unterdrückt Scrollbars jetzt zentral browserübergreifend für die relevanten Theme-, Board- und Spielerflächen, ohne dafür Overflow-Inhalte abzuschneiden, und eine Bundle-Regression prüft die Firefox-, Legacy- und WebKit-Regeln im ausgelieferten Userscript mit.

## [2.0.82] - 2026-03-29

### Fixed

- Nutzerwirkung: Das Cricket-/Tactics-Layout bleibt bei wechselnden Autodarts-Wrappern jetzt stabiler. Spielernamen bleiben deutlich besser lesbar, Punkte- und Kartenbereiche verschieben sich nicht mehr so leicht, und freie Breite wird bevorzugt für die Spielerinfos genutzt, bevor das Board im engen Layout schrumpft oder ausgeblendet wird.
  Technik: Die Cricket-Spielerkarten werden jetzt zur Laufzeit auf stabile semantische Slots normalisiert, die Theme-CSS ist von fragilen Chakra-Hashklassen auf interne Datenattribute umgestellt, die Readability-Logik verteilt die verfügbare Breite aktiv zwischen Spielerbereich und Board mit klarer `Spieler zuerst`-Policy, und neue DOM-/Lifecycle-Regressionstests decken gemeldete sowie driftende Wrapper-Strukturen ab.

## [2.0.81] - 2026-03-27

### Changed

- Nutzerwirkung: Die Repository-Anweisungen unterstützen jetzt größere oder parallele Wartungsarbeiten klarer, sodass Codex bei passenden Aufgaben kontrollierter zwischen Hauptarbeit, Delegation, Integration und Validierung unterscheiden kann.
  Technik: `AGENTS.md` definiert jetzt Parallel-Work-, Worktree- und ExecPlan-Regeln, `PLANS.md` beschreibt die repo-spezifische ExecPlan-Struktur, und das Validierungs-Skill verlangt bei Multi-Agent-/Multi-Worktree-Arbeit ausdrücklich die Prüfung des integrierten Gesamtstands.
- Nutzerwirkung: Das Userscript greift über den Tampermonkey-Header nicht mehr auf `https://play.autodarts.io/boards` und `https://play.autodarts.io/boards/...`, sodass der Boards-Bereich bei Direktaufrufen und Reloads von AD xConfig ausgenommen bleibt.
  Technik: Die Userscript-Metadaten im Loader und im Build-Header wurden um passende `@exclude`-Einträge ergänzt, die Versionsmarker wurden auf `2.0.81` angehoben, und die Header-Regressionstests prüfen die ausgeschlossenen Boards-Routen jetzt explizit mit.

### Fixed

- Nutzerwirkung: Gewinner-Zeilen im X01-Layout bleiben mit aktivem Restscore-Balken jetzt wieder mittig ausgerichtet, statt nach oben zu rutschen, wenn Autodarts nur noch den Winner-Zustand markiert.
  Technik: Der X01-Score-Progress behandelt in seiner Stack-Zentrierung jetzt neben `.ad-ext-player-active` auch `.ad-ext-player-winner`, und eine Style-Regression deckt den Winner-Fall explizit mit ab.

## [2.0.80] - 2026-03-24

### Changed

- Nutzerwirkung: AD xConfig verhält sich funktional unverändert, interne Theme-, xConfig- und Konfigurationspfade wurden jedoch stabilisiert, sodass Einstellungen, Theme-Layout-Hooks und Shell-Rendering robuster bleiben und künftige Änderungen regressionsärmer umgesetzt werden können.
  Technik: Feature-Katalog und Config-Spezifikation dienen jetzt als zentrale Wahrheitsquelle für Defaults, empfohlene Profile und Normalisierung; doppelte Feature-Pfad- und Theme-Key-Helper wurden zusammengeführt, der Theme-Mount wurde in Board-/Cricket-Module zerlegt, die xConfig-Shell trennt Style und View-Komposition in eigene interne Module, und zusätzliche Charakterisierungs- sowie Paritätstests sichern Registry-, Runtime-, Theme- und Shell-Verträge ab.

## [2.0.79] - 2026-03-24

### Changed

- Nutzerwirkung: AD xConfig trennt jetzt klar zwischen einem echten `↺ Zurücksetzen` und `Empfohlene Standards`. Der Hard Reset deaktiviert alle Module, schaltet Debug aus und löscht gespeicherte Theme-Bilder; das neue Gesamtpreset aktiviert alle Themes und Animationen mit ausgewogenen Vorgaben. Theme-Bild-Uploads werden vor dem Speichern lokal optimiert, auf maximal `1920×1080` skaliert und bei `1,5 MiB` sauber begrenzt.
  Technik: Neue Preset-Fabriken erzeugen vollständige Hard-Reset- und Recommended-Konfigurationen samt öffentlicher Runtime-API `applyRecommendedDefaults()`, die xConfig-Header-Aktionen wurden auf diese APIs umgestellt, Theme-Bilder werden vor Persistenz normalisiert und begrenzt, und README/FEATURES sowie ihr Generator beziehen Reset-/Preset-/Count-/Upload-Copy jetzt aus einer gemeinsamen Quelle mit aktualisierten Regressionstests.

## [2.0.78] - 2026-03-24

### Fixed

- Nutzerwirkung: X01-Checkout-Hinweise verhalten sich jetzt stabil über
  mehrstufige Checkout-Routen hinweg. Der TV-Board-Zoom kann wahlweise auf das
  erste Routensegment oder standardmäßig nur auf das tatsächliche Finish-Ziel
  zoomen, und die Checkout-Board-Targets werden bei sichtbaren Suggestions wie
  `T16` gefolgt von `D8` wieder korrekt angezeigt statt auszufallen oder auf dem
  falschen Feld zu landen.
  Technik: Eine gemeinsame X01-Checkout-Routenauflösung liest sichtbare
  Suggestion-Felder geordnet aus dem DOM, parst explizite Segmente robust zu
  einer Route und versorgt damit sowohl TV-Board-Zoom als auch
  Checkout-Board-Targets; zusätzlich wurden neue Enum-Configs mit
  Rückwärtskompatibilität (`checkoutZoomTarget`, `targetSelectionMode`),
  xConfig-Select-Felder sowie Runtime-, Persistenz-, UI- und DOM-Regressionstests
  für Mehrfeld-Checkouts ergänzt.

## [2.0.77] - 2026-03-23

### Fixed

- Nutzerwirkung: Im Cricket-Theme sieht die Tabellen-/Grid-Spalte von Spieler 1
  bei inaktivem Zug jetzt wieder wie eine normale inaktive Spalte aus. Helle
  Sonderrahmen am Spielerkarten-Wrapper und die vollflächige Label-Zellenoptik
  lassen `Tornado Tom` nicht mehr fälschlich hervorgehoben wirken, wenn ein
  anderer Spieler aktiv ist.
  Technik: Das Theme entfernt die fragile, Chakra-klassenbasierte Wrapper-
  Umrandung (`.css-rtn29s`) vollständig, neutralisiert äußere Player-Wrapper
  generisch und reduziert im Cricket-Grid die `ad-ext-crfx-label-cell` auf die
  Badge-Darstellung statt die ganze erste gemergte Zelle hervorzuheben; neue
  Style-Regressionen sichern Wrapper-Reset, Label-Cell-Neutralisierung und das
  Ausbleiben der Hashklassen-Kopplung ab.

## [2.0.76] - 2026-03-23

### Fixed

- Nutzerwirkung: Im Cricket-Theme bleibt die helle Aktiv-Markierung jetzt stabil
  nur auf dem tatsächlich aktiven Spieler. Stale Umrandungen auf inaktiven
  Spielern wie Spieler 1 bei gleichzeitig aktivem späteren Spieler werden nicht
  mehr angezeigt.
  Technik: Das Theme synchronisiert jetzt eine kanonische
  Active-Player-Markierung pro Cricket-Spielerkarte, reagiert dafür auch auf
  Player-Class-Mutationen und rendert die aktive/inaktive Kartenoptik über
  diese xConfig-gesteuerte Zustandsquelle statt direkt über potenziell stale
  `ad-ext-player-active`-Klassen; neue Lifecycle-/Style-Regressionen decken
  doppelte Active-Klassen, Turn-Wechsel und Cleanup explizit ab.

## [2.0.75] - 2026-03-23

### Fixed

- Nutzerwirkung: Das virtuelle Cricket-/Tactics-Board bleibt jetzt rechts im
  eigenen Bereich zentriert sichtbar, statt bei breiten Matrix- oder
  Spielerlayouts in die linke Anzeige hineinzuragen; bei echtem Platzmangel
  blendet das Theme das Board weiterhin lesbarkeitsorientiert aus.
  Technik: Die Cricket-Readability berücksichtigt jetzt die tatsächlich
  gerenderte linke Layoutbreite statt nur die Spielerkarten-Heuristik,
  sichtbare Board-Slots koppeln ihre Breite an `--ad-ext-theme-board-size`,
  Theme-Layout-Hooks erkennen zusätzlich bildgestützte Live-Boards mit
  minimalem Overlay-SVG als gültigen rechten Board-Kontext und bleiben auch
  bei kurzzeitig neu aufgebauten Overlay-SVGs stabil; für diese Pfade wird
  jetzt außerdem der äußere Canvas-Wrapper statt des inneren `img + svg`-
  Knotens als Theme-Canvas verwendet, ein interner image-backed Board-Modus
  erhält die native `img + Overlay-SVG`-Stapelung ohne generischen Flex-Zwang,
  und der Cricket-Panel-Glow wird nur für diese Liveboard-Pfade neutralisiert,
  damit das Livebild sichtbar und sauber im rechten Slot bleibt. Neue
  Runtime-/Style-Regressionen sichern normale 4-Spieler-Layouts, manuell
  eingeblendete Engpass-Slots, verschachtelte `showAnimations`-Boardpfade
  sowie den `img + Overlay-SVG`-Pfad samt Rebuild-Gap ab.

## [2.0.74] - 2026-03-22

### Fixed

- Nutzerwirkung: Die Cricket-Liveansicht bleibt layout-stabil, selbst wenn
  zusätzliche dekorative SVG-Layer im DOM auftauchen; fehlerhafte Board-
  Bindungen mit verschobenem Theme-Layout oder schwarzer Kreisfläche werden
  dadurch unterbunden.
  Technik: Die Board-SVG-Erkennung arbeitet jetzt fail-closed mit
  Board-Ähnlichkeitsmerkmalen (Zahlenabdeckung, ViewBox-Form, Drawable-
  Komplexität) statt permissivem Radius-/Flächenfallback, Snapshot-Reuse prüft
  semantische Board-Gültigkeit strenger, Theme-Hooks akzeptieren nur konsistente
  Panel/Viewport-Kontexte und behalten bei ungültigen Kandidaten den letzten
  validen Hook-Satz; neue Runtime-Regressionen decken Resolver-, Theme-Lifecycle-
  und Cricket-Kompatibilitätspfade für ambige SVG-Kandidaten ab.

## [2.0.73] - 2026-03-22

### Fixed

- Nutzerwirkung: Die Cricket-/Tactics-Liveansicht bleibt auch nach Umschalten
  zwischen Segment-, Live- und Koordinatenmodus stabil, statt an einem
  veralteten oder unsichtbaren Board-Layer hängen zu bleiben und rechts nur
  noch eine leere Theme-Fläche zu zeigen.
  Technik: Die Board-Erkennung wurde in einen gemeinsamen, sichtbarkeits- und
  mode-aware Resolver gezogen, Cricket-Board-Snapshots invalidieren jetzt auch
  bei Input-Mode-Wechseln, und das Theme reagiert selbst auf reine
  `aria-pressed`-/State-Toggles der Boardmodus-Buttons; neue Runtime-
  Regressionen decken Resolver-, Cache- und Theme-Umschaltpfade ab.

## [2.0.72] - 2026-03-22

### Fixed

- Nutzerwirkung: `Dart Marker Darts` pausiert in der Liveboard-Ansicht des
  Koordinatenmodus jetzt automatisch, sodass dort keine zusätzlichen
  Dart-Overlays oder ausgeblendeten Originalmarker mehr für missverständliche
  Trefferdarstellung sorgen. AD xConfig, README und Features-Doku weisen
  außerdem klar auf dieses Verhalten hin.
  Technik: Eine neue Board-Eingabemodus-Erkennung wertet stabilere
  Zustandsmerkmale wie `aria-pressed`, `aria-selected`, `data-checked` und
  `data-state` aus; `dart-marker-darts` räumt sich im Koordinatenmodus
  vollständig ab, neue Runtime-Regressionen decken Suspend/Resume ab, und die
  kanonischen xConfig-Textquellen synchronisieren die Doku-Hinweise nach
  `README.md` und `docs/FEATURES.md`.

## [2.0.71] - 2026-03-22

### Fixed

- Nutzerwirkung: AD xConfig verliert schnelle Einstellungsänderungen nicht mehr,
  manuelle Update-Prüfungen werden nach laufenden Hintergrundchecks zuverlässig
  nachgeholt, und mehrere DOM-/Hydration-Kantenfälle bei Checkout- und
  Treffer-Overlays bleiben nach Re-Renders stabil.
  Technik: Die Config-Persistenz serialisiert jetzt konkurrierende
  Schreibvorgänge deterministisch, die xConfig-Shell verwirft geplante Syncs
  beim Teardown und merkt genau einen manuellen Folge-Check vor,
  `checkout-board-targets`, `checkout-score-pulse`,
  `triple-double-bull-hits` und `remove-darts-notification` erhielten gezielte
  Fixes, und gemeinsame Cricket-/xConfig-Helfer plus neue Runtime-Regressionen
  reduzieren Parser-/Metadaten-Drift sowie fragile Timer-/Sleep-Pfade.

## [2.0.70] - 2026-03-21

### Fixed

- Nutzerwirkung: Im X01-Theme bleiben Punktzahl und Spielername auch bei sehr
  langen Namen sauber im Container; die Punktzahl wird nicht mehr nach rechts
  aus der Karte geschoben.
  Technik: Das Player-Grid im X01-Theme nutzt jetzt `minmax(0, 1fr)` für die
  Namensspalte, ergänzt um explizite `min-width:0`-/Ellipsis-Regeln für
  Namensknoten sowie eine stabilisierte `max-content`-Score-Spalte; die
  Theme-Parity-Regression prüft den neuen Layoutvertrag.

## [2.0.69] - 2026-03-21

### Fixed

- Nutzerwirkung: Im Cricket-Theme bleibt der Spielername jetzt deutlich besser
  lesbar, weil jede Spielerkarte mehr Mindestbreite erhält und der Namensbereich
  nicht mehr so aggressiv kollabiert.
  Technik: Die Cricket-Layoutvariablen wurden auf breitere Min/Max-Spalten
  angehoben (`player-column` + `player-name-min-width`), die Readability-Policy
  in `mount-theme-feature` auf denselben Mindestkartenwert synchronisiert und
  die Runtime-Regressionen für Style-/Lifecycle-Breitenverträge entsprechend
  aktualisiert.

## [2.0.68] - 2026-03-20

### Changed

- Nutzerwirkung: Für `X01 Score Progress` wird in der Animationen-Kachel in
  AD xConfig jetzt der neue Screenshot als Hintergrundvorschau angezeigt; zudem
  ist derselbe Screenshot in README und Features-Doku direkt in der
  Feature-Sektion eingebunden.
  Technik: Die Preview-Asset-Zuordnung wurde um `x01-score-progress ->
  animation-x01-score-progress.png` erweitert (Manifest + Browser-Asset-Map),
  die Doku-Bildquelle in `xconfig-ui/copy` ergänzt und per
  `scripts/sync-xconfig-docs.mjs` nach `README.md`/`docs/FEATURES.md`
  synchronisiert; ein Runtime-Test prüft die gemappte xConfig-Kachelvorschau.

## [2.0.67] - 2026-03-20

### Fixed

- Nutzerwirkung: Der aktive X01-Restscore-Balken hat jetzt den deutlich größeren
  Abstand oberhalb des Balkens (wie gewünscht), während inaktive Spieler beim
  bisherigen Abstand bleiben.
  Technik: Das Margin-Top wurde in aktive/inaktive Variablen getrennt und nur
  für den aktiven Host auf `2em` gesetzt; Styles-Regressionen prüfen den
  Active/Inactive-Margin-Vertrag explizit.

## [2.0.66] - 2026-03-20

### Fixed

- Nutzerwirkung: Der X01-Restscore-Balken hat jetzt nur noch einen kleinen,
  sauberen Abstand oberhalb des Balkens; zusätzlich ist das sichtbare Flackern
  des `ad-ext-x01-score-progress__fill`-Elements in Chrome-DevTools deutlich
  reduziert.
  Technik: Der obere Balkenabstand wurde auf einen kleineren `clamp(...)`-Wert
  reduziert und die Effekt-Synchronisierung entkoppelt unnötige Class-/Trail-
  Resets bei unverändertem Score. Damit werden `ghost-trail`-Animationen bei
  passiven Re-Syncs nicht mehr laufend abgebrochen; neue Regressionen decken
  Margin-Vertrag und das Re-Sync-Verhalten ab.

## [2.0.65] - 2026-03-20

### Fixed

- Nutzerwirkung: Die aktive X01-Spieleranzeige bleibt wieder mittig im Container,
  während der Restscore-Balken mit kleinem Abstand direkt unter der
  Punkt-/Stats-Zeile sitzt.
  Technik: Der aktive, vom Progress-Feature markierte Player-Stack bleibt beim
  3-Zeilen-Grid (`max-content max-content auto`) nun wieder zentriert
  (`align-content:center`), wodurch der vorherige Top-Shift entfällt, ohne den
  separaten Balken-Slot oder den Anti-Overlap-Abstand zu verlieren.

## [2.0.64] - 2026-03-20

### Fixed

- Nutzerwirkung: Der X01-Restscore-Balken sitzt bei mehreren Spielern nicht mehr
  zu weit unten, sondern mit einem klaren, kurzen Abstand direkt unter der
  Score-/Stats-Zeile.
  Technik: Das erzwungene Stack-Grid für `x01-score-progress` verwendet jetzt
  kompakte Zeilen (`max-content max-content auto`) statt einer streckenden
  Mittelzeile; der Balken bleibt in seiner eigenen dritten Zeile und richtet sich
  dort am Zeilenanfang aus, wodurch Überlagerung und zu große Vertikalabstände
  gleichzeitig vermieden werden.

## [2.0.63] - 2026-03-20

### Fixed

- Nutzerwirkung: Bei mehreren X01-Spielern überlagert der Restscore-Balken die
  Score-Zeile nicht mehr, sondern bleibt stabil darunter in einer eigenen Zeile.
  Technik: `x01-score-progress` markiert den jeweiligen Player-Stack jetzt
  explizit, erzwingt dafür ein robustes 3-Zeilen-Grid mit `align-content:start`
  und räumt Stack-Markierungen beim Host-Cleanup wieder auf; Regressionen sichern
  den Stack-Markierungs- und Layoutvertrag ab.

## [2.0.62] - 2026-03-20

### Changed

- Nutzerwirkung: `Animate Triple, Double, Bull Hits` zeigt `Electric Arc` jetzt
  im selben Frame-Stil wie `Turn Points Count`, sodass der Effekt nicht mehr
  abgeschnitten im Container wirkt und visuell ruhiger bleibt.
  Technik: Die `electric-arc`-Burst-Layer wurden auf ein Turn-Points-nahes
  Border-/Aura-Setup umgebaut (inklusive kontrollierter Overflow-Freigabe nur im
  Burst-Fenster), alte Roughness-Keyframes entfernt und Timeline-Jitter in der
  Logic deutlich reduziert; Style-/Logic-Regressionen wurden entsprechend
  aktualisiert.
- Nutzerwirkung: `Animate Turn Points Count` bietet jetzt zusätzlich den
  Aufblitz-Modus `Permanent`, damit der elektrische Rahmen wahlweise dauerhaft
  sichtbar bleibt statt nur bei Zahlenänderung.
  Technik: `turnPointsCount` wurde um `flashMode` in Default-, Runtime- und
  xConfig-Flow erweitert (`on-change`/`permanent` inkl. Legacy-Fallback),
  die Flash-Lifecycle-Logik erhielt Preserve-Frame-Pfade für permanente Frames
  und neue Regressionen decken Config-Normalisierung, UI-Persistenz und
  Permanent-Rendering ab.

## [2.0.61] - 2026-03-20

### Changed

- Nutzerwirkung: `X01 Score Progress` bietet den Effekt `Electric Surge` nicht
  mehr an, weil der Stil im Matchbetrieb nicht stabil wirkte; bestehende alte
  Konfigurationen werden automatisch auf `Signal Sweep` umgeleitet.
  Technik: `electric-surge` wurde aus Style-, Logic-, Runtime- und xConfig-UI-
  Pfaden entfernt, Legacy-Aliasse (`electric-surge`, `electric-border`,
  `arc-burst`) werden zentral auf `signal-sweep` normalisiert und mit
  Regressionstests abgesichert.
- Nutzerwirkung: `Animate Triple, Double, Bull Hits` zeigt `Electric Arc`
  kontrollierter ohne hässliches Ausfransen/Stehenbleiben des Burst-Rahmens.
  Technik: Der riskante `overflow: visible`-Pfad wurde entfernt, Electric-Arc-
  Transform-/Roughness-Spitzen wurden auf die Throw-Row-Geometrie gedämpft und
  ein explizites Burst-Trigger-Timer-Cleanup ergänzt, damit die
  Animationsklasse zuverlässig endet.

## [2.0.60] - 2026-03-20

### Changed

- Nutzerwirkung: `Animate Turn Points Count` hat jetzt einen kurzen
  Nachwirk-Effekt von 0,5 Sekunden nach Abschluss der Zahlanimation, statt
  abrupt auszublenden.
  Technik: Die Flash-Steuerung nutzt ein dediziertes Afterglow-Timer-Handling
  mit robustem Cleanup (inklusive Timer-Cancel bei Re-Trigger, Stop und
  Node-Detach), ohne den bestehenden Lifecycle zu destabilisieren.
- Nutzerwirkung: `Animate Triple, Double, Bull Hits` zeigt `Electric Arc`
  nicht mehr auf den Innenbereich des Throw-Containers beschnitten.
  Technik: Der `electric-arc`-Stil erlaubt jetzt explizit sichtbaren Overflow
  auf dem betroffenen Row-Container, damit Border-/Glow-Layer vollständig
  dargestellt werden können.
- Nutzerwirkung: `X01 Score Progress` zeigt `Electric Surge` zuverlässiger und
  klarer sichtbar, auch wenn Player-Card-Nodes im DOM neu aufgebaut werden.
  Technik: Die Card-Identität für Score-Change-Erkennung wurde stabilisiert
  (slot-basiert ohne scoreabhängigen Schlüssel) und der Electric-Surge-Look
  erhielt einen permanent sichtbaren Basiseffekt plus Burst-Intensivierung.

## [2.0.59] - 2026-03-20

### Changed

- Nutzerwirkung: `Animate Triple, Double, Bull Hits` zeigt bei `Electric Arc`
  jetzt einen deutlich ZIP-näheren Randlook mit unruhiger, zackiger Kante und
  mehrlagigem Electric-Glow statt primär Text-/Row-Jitter.
  Technik: Das Feature nutzt eine gemeinsame SVG-Displacement-Engine mit
  Turbulence/Displacement-Filtern und schaltet `electric-arc` auf
  Border-Layer-first (Filter + Roughness-Keyframes) um, während Theme-Farben
  und Burst-Fenster unverändert erhalten bleiben.
- Nutzerwirkung: `Animate Turn Points Count` rahmt beim Zählen jetzt die ganze
  Punktezeile elektrisch ein und blendet den Effekt nur exakt während der
  aktiven Zahländerung ein.
  Technik: Die Flash-Logik steuert zusätzlich den Parent-Frame
  (`scoreNode.parentElement` mit Fallback), inklusive strikt symmetrischem
  Cleanup bei Stop, DOM-Detach und Feature-Teardown; die Effekt-CSS nutzt
  ebenfalls die neue gemeinsame Displacement-Engine.
- Nutzerwirkung: `X01 Score Progress` zeigt bei `Electric Surge` einen
  deutlich sichtbaren, ZIP-näheren Electric-Rand mit turbulenter Kante und
  stärkerem peripherem Glow, ohne inaktive Karten zu beeinflussen.
  Technik: Electric-Surge-Track/Fill wurden auf burst-gebundene
  Displacement-Layer umgestellt (inkl. Scan/Noise), ein zeitlich begrenztes
  Active-Burst-Class-Window an echte Score-Änderungen gekoppelt und per
  Regressionen gegen Nicht-Electric-Effekte sowie Lifecycle-Seiteneffekte
  abgesichert.

## [2.0.58] - 2026-03-20

### Changed

- Nutzerwirkung: `Animate Triple, Double, Bull Hits` zeigt den Stil
  `Electric Arc` jetzt deutlich sichtbarer mit klareren Stromimpulsen,
  stärkeren Jitter-Spitzen und auffälligerem Segment-/Score-Blitz.
  Technik: Electric-Arc erhielt verstärkte CSS-Burst-Layer
  (Surface-/Border-Arc-Keyframes) plus intensivere Timeline-Keyframes in der
  Anime-Pipeline, ohne das Scope auf andere Trefferstile auszuweiten.
- Nutzerwirkung: `Animate Turn Points Count` enthält jetzt die neue
  xConfig-Option `Aufblitz-Effekt` und zeigt den Blitz nur in der Zeit, in der
  der Turn-Wert tatsächlich animiert wird.
  Technik: `turnPointsCount` wurde um `flashOnChange` in Default-, Runtime- und
  Legacy-Config erweitert; der Flash-Selector wurde robuster auf
  `.ad-ext-turn-points` gestellt, die Flash-Klassensteuerung auf
  Laufzeit-/Animationsfenster begrenzt und mit Regressionen abgesichert.
- Nutzerwirkung: `X01 Score Progress` macht `Electric Surge` im Spiel klarer
  sichtbar, inklusive stärkerem Electric-Track und deutlich erkennbarem
  Surge-Impuls beim Scorewechsel auf aktiven Karten.
  Technik: Electric-Surge-Styles und Change-Keyframes wurden in Track-/Fill-
  Layern sowie WAAPI-Impulsdefinitionen verstärkt; Active-Only-Scoping,
  Effektzuordnung und bestehende Trigger-Regressionen bleiben erhalten.

## [2.0.57] - 2026-03-20

### Changed

- Nutzerwirkung: `Animate Triple, Double, Bull Hits` bietet jetzt zusätzlich den
  neuen Animationsstil `Electric Arc`, der Treffer mit einem kurzen,
  elektrischen Burst und klarer Zahlenbetonung inszeniert.
  Technik: Die Burst-Pipeline wurde um `electric-arc` in Style-, Timeline- und
  Runtime-Normalisierung erweitert; xConfig-Optionen, README/FEATURES-Abschnitte
  und Regressionstests wurden auf die neue Stiloption synchronisiert.
- Nutzerwirkung: `Animate Turn Points Count` zeigt beim Start einer echten
  Punktänderung jetzt ein kurzes Aufblitzen, das nur während der laufenden
  Zählanimation aktiv ist und danach sauber verschwindet.
  Technik: Das Feature erhielt einen scoped Flash-Style, gezielte
  Klassensteuerung mit Timeout-Cleanup pro Node sowie Tests für Triggergrenzen
  (nur bei Wertänderung), Lifecycle-Entfernung und Side-Effect-Isolation.
- Nutzerwirkung: `X01 Score Progress` enthält den neuen Effekt
  `Electric Surge` mit kurzem Change-Impuls und aktivem Electric-Track-Rand,
  während inaktive Karten weiterhin unverändert bleiben.
  Technik: Effekt-Normalisierung, Fill-/Track-Styles und
  Score-Change-Keyframes wurden um `electric-surge` ergänzt; zusätzliche Tests
  decken Triggerverhalten, Active-Only-Scoping und Doku-/UI-Parität ab.

## [2.0.56] - 2026-03-19

### Changed

- Nutzerwirkung: Die Designauswahl des X01-Restscore-Balkens wurde wieder
  entfernt, weil die Preset-Umschaltung im Spiel nicht zuverlässig griff. In
  xConfig gibt es dafür jetzt nur noch die funktionierenden Einstellungen für
  Farben, Balkengröße und aktive Effekte; README und Feature-Doku wurden
  entsprechend bereinigt.
  Technik: `x01-score-progress` nutzt wieder einen festen Basisstil ohne
  Preset-Logik, entfernt `designPreset` aus xConfig-Descriptoren, Copy und
  normalisierter Runtime-Config, räumt Altwerte aus der X01-Konfiguration weg
  und ergänzt Regressionen für die entfernte UI-Option sowie den festen
  Style-Vertrag.

## [2.0.55] - 2026-03-19

### Changed

- Nutzerwirkung: Der X01-Restscore-Balken bietet jetzt drei klar getrennte
  Designvarianten statt nur leicht abweichender Looks: `Plain Color` als
  flache Vollfarbe ohne eingebaute Materialeffekte, `Stripes` mit sichtbarer
  Streifenstruktur und `Liquid Glass` mit deutlich stärkerem 3D-/Glas-Look.
  Die Designs bleiben dabei mit Farben, Balkengrößen und aktiven Effekten
  kompatibel; inaktive Spieler bleiben unverändert.
  Technik: Die Preset-Architektur von `x01-score-progress` wurde auf drei
  Material-Layer umgebaut, aktive Farbvariablen für Track-/Fill-Overlays
  getrennt abstrahiert, Legacy-Preset-Namen auf das neue Set gemappt sowie
  xConfig-Texte, Doku, Tests und Build-Artefakte auf die neuen Presets
  synchronisiert.

## [2.0.54] - 2026-03-19

### Fixed

- Nutzerwirkung: Die Versionsprüfung in AD xConfig erkennt neue GitHub-Releases
  jetzt robuster und bietet im Statusbereich direkt einen gestalteten
  Changelog-Link (`Changelog` bzw. `Was ist neu?`), damit Änderungen vor der
  Installation schnell geprüft werden können.
  Technik: Der Update-Check vergleicht jetzt beide veröffentlichten GitHub-Dateien
  (`.meta.js` und `.user.js`), bevorzugt bei Abweichungen die neueste gefundene
  Version, erweitert die Runtime-Regressionen für Mehrquellen-/Cache-Verhalten
  und ergänzt Shell-/README-Abdeckung für den neuen Changelog-Zugang.

## [2.0.53] - 2026-03-19

### Changed

- Nutzerwirkung: Der X01-Restscore-Balken nutzt jetzt nur noch fünf klar
  unterscheidbare aktive Effektprofile (`Pulse Core`, `Glass Charge`,
  `Segment Drain`, `Ghost Trail`, `Signal Sweep`) plus `Aus`; die Effekte
  wurden sichtbarer abgestimmt, während inaktive Spieler bewusst unverändert
  bleiben.
  Technik: Die X01-Effektpalette, Normalisierung, xConfig-Optionen und
  Kopiertexte wurden auf das reduzierte Set umgestellt, inklusive
  Legacy-Mapping bestehender Effektwerte sowie neuer Regressionen für
  Ghost-Trail-Animation und persistente xConfig-Wiederherstellung.

## [2.0.52] - 2026-03-19

### Fixed

- Nutzerwirkung: Die Balkengrößen des X01-Restscore-Balkens unterscheiden sich
  jetzt deutlich sichtbarer zwischen `Schmal`, `Standard`, `Breit` und
  `Extrabreit`; zusätzlich zeigen die Effekt-Modi nun klarere, sofort
  erkennbare visuelle Wirkung statt kaum wahrnehmbarer Unterschiede.
  Technik: Die aktiven Höhen-Clamps wurden stärker auseinandergezogen und
  Effektklassen erhielten permanente Keyframe-Verträge pro Modus. Außerdem wurde
  die Active-Player-Erkennung robuster (DOM + `getActivePlayerIndex`-Fallback)
  und die Score-Change-Erkennung um card-basierte Historie erweitert, damit
  Effekte auch bei DOM-Rebuilds zuverlässig triggern.

## [2.0.51] - 2026-03-19

### Changed

- Nutzerwirkung: Der X01-Restscore-Balken bietet jetzt deutlich mehr Gestaltung:
  eine kombinierte Farbauswahl mit dynamischen Schwellenmodi und festen Paletten,
  vier Balkengrößen sowie zehn Effekte (inklusive `Aus`). Dadurch lassen sich
  aktive Spieler klarer, hochwertiger und je nach Spielstil auffälliger darstellen,
  während inaktive Spieler bewusst unverändert bleiben.
  Technik: `x01-score-progress` wurde um normalisierte Felder
  (`colorTheme`, `barSize`, `effect`) erweitert, inklusive Legacy-Fallback von
  `thresholdColorMode`, aktiver-only Visual-Variablen, Effektklassen und
  score-change Animationen. Dazu kamen UI-/Copy-Erweiterungen, aktualisierte
  README-/FEATURES-Synchronisation sowie Runtime-/Feature-Regressionstests.

## [2.0.50] - 2026-03-19

### Fixed

- Nutzerwirkung: Der X01-Restscore-Balken erkennt den Startwert jetzt auch dann
  zuverlässig, wenn der Matchkopf den Wert als getrennte Badges (`X01`, `501`,
  `SI-DO`) rendert; dadurch wird der Balken im Live-Match wieder angezeigt.
  Technik: `x01-score-progress` wertet zusätzliche Variant-Strip-Knoten rund um
  `#ad-ext-game-variant` als Startscore-Quelle (`dom-variant-strip`) aus und
  ergänzt Debug-Logs um eine serialisierte `payload=...`-Zeile, damit
  exportierte Console-Logs die vollständige Diagnose enthalten.

## [2.0.49] - 2026-03-19

### Changed

- Nutzerwirkung: Für die Fehlersuche am X01-Restscore-Balken liefern aktivierte
  Debug-Logs jetzt deutlich mehr Kontext zu Render-Entscheidungen und
  Kartenzuständen.
  Technik: `x01-score-progress` protokolliert im Debug-Modus dedupliziert
  Gründe/Signaturen (z. B. fehlender Startscore, fehlende Karten, gerenderte
  Hosts) inklusive strukturierter Payload zu Variant-Quelle, Startscore-Herkunft,
  Host-Zustand und Sample-Karten.

## [2.0.48] - 2026-03-19

### Fixed

- Nutzerwirkung: Der X01-Restscore-Balken bleibt jetzt auch im echten
  Spieler-Grid des X01-Themes sichtbar, statt im Kartenlayout zu verschwinden.
  Technik: Die Progress-Bar reserviert explizit eine eigene dritte Grid-Zeile
  samt Flex-Fallback im Player-Card-Host; eine Style-Regression prüft die feste
  Platzierung im Kartenlayout.

## [2.0.47] - 2026-03-19

### Added

- Nutzerwirkung: In X01 zeigt jede Spielerkarte jetzt optional einen
  Restscore-Balken direkt unter der Punktzahl, sodass der Abstand zum Startwert
  und zwischen mehreren Spielern schneller erfassbar ist.
  Technik: Mit `x01-score-progress` wurde ein neues Runtime-Feature samt
  xConfig-Descriptor, Konfig-Normalisierung, README-/FEATURES-Dokumentation und
  Regressionstests für Renderlogik sowie Lifecycle-Verhalten ergänzt.

## [2.0.46] - 2026-03-19

### Changed

- Nutzerwirkung: Der aktive Spielername im Cricket-/Tactics-Theme verwendet jetzt
  explizit `x-large` und ist damit deutlich größer sichtbar.
  Technik: Die aktive Namensregel wurde auf `font-size: x-large !important;`
  umgestellt; der zugehörige Cricket-Style-Regressionstest prüft den neuen Wert.

## [2.0.45] - 2026-03-19

### Fixed

- Nutzerwirkung: Der aktive Spielername wird nicht mehr kleiner dargestellt, sondern
  bleibt jetzt exakt so groß wie die inaktiven Spielernamen; die aktive Hervorhebung
  bleibt über die grüne Namensfarbe erhalten.
  Technik: Für aktive Namen wird die gleiche `font-size`-Clamp wie bei inaktiven Namen
  explizit erzwungen und weiterhin die aktive Score-Farbe genutzt; die
  Cricket-Style-Regression prüft den identischen Größenwert plus aktive Farbe.

## [2.0.44] - 2026-03-19

### Fixed

- Nutzerwirkung: Im Cricket-/Tactics-Theme haben aktive und inaktive Spielernamen jetzt
  dieselbe Schriftgröße; der aktive Spielername bleibt über die grüne Hervorhebung
  weiterhin klar erkennbar.
  Technik: Der aktive Namens-Override auf größere Schrift wurde entfernt und durch eine
  Farbregel auf `--ad-ext-theme-cricket-score-active-color` ersetzt; die
  Cricket-Style-Regressionen prüfen den neuen Active-Name-Vertrag.

## [2.0.43] - 2026-03-18

### Fixed

- Nutzerwirkung: Im Cricket-/Tactics-Layout bleibt die Felder-Tabelle unter den
  Spielerkarten wieder sichtbar, statt bei manchen Layoutzuständen komplett
  zu verschwinden.
  Technik: Der linke Content-Bereich (`ad-ext-theme-content-left`) streckt sich
  wieder über die volle Slot-Höhe (`height: 100%`, `align-self: stretch`,
  `min-height: 0`), sodass die von Chakra auf `calc(100% - 149px)` basierte
  Grid-Fläche (`.css-c04tlr`) eine stabile Referenzhöhe behält.
- Nutzerwirkung: Die aktive Punktezahl bleibt innerhalb der Spielerkarte besser
  lesbar und kollidiert nicht mehr so leicht mit der MPR-Zeile, auch bei
  dreistelligen Scores.
  Technik: Score-Fallbackgrößen wurden von viewport-lastigen Werten auf
  kartenverträgliche Clamp-Werte reduziert, Score-Padding/Margen für die
  rechte Kante neu austariert, die Stats-Zeile nach links verdichtet und die
  Cricket-Style-Regressionen auf die neue Layout-/Typografie-Konfiguration
  aktualisiert.

## [2.0.42] - 2026-03-18

### Fixed

- Nutzerwirkung: Im Cricket- und Tactics-Theme schließt der linke Inhaltsbereich
  (`ad-ext-theme-content-left`) jetzt rechts und unten bündig mit der Tabelle ab,
  statt bis zur Board-Höhe gestreckt zu werden.
  Technik: Das Content-Slot-Grid nutzt für die linke Spalte jetzt
  `minmax(player-area-required-width, max-content)` und der Left-Container wurde
  auf `width/height: max-content` mit `justify-self/align-self: start` gestellt;
  die Style-Regressionen decken den neuen Layout-Vertrag ab.
- Nutzerwirkung: Die aktive Punktezahl bleibt vollständig sichtbar, auch bei
  dreistelligen Werten.
  Technik: Die spezifische Score-Zellenregel verwendet kein `overflow: hidden`
  mehr, sondern sichtbaren Overflow samt rechtem Sicherheitsabstand
  (`margin-right`/`padding-right`), abgesichert durch aktualisierte
  CSS-Regressionstests.

## [2.0.41] - 2026-03-18

### Fixed

- Nutzerwirkung: Im Cricket- und Tactics-Theme sind die Breiten der unteren
  Spielerspalten jetzt exakt mit der oberen Spieler-/Punktezeile gekoppelt.
  Dadurch laufen Karten und darunterliegende Spalten wieder sauber
  pixelgenau untereinander.
  Technik: Die untere Cricket-Grid-Zeile direkt nach `#ad-ext-player-display`
  nutzt jetzt denselben Spalten-Width-Token wie die Kartenzeile
  (`--ad-ext-theme-cricket-player-column-width`) und wird per
  Laufzeitvariable `--ad-ext-theme-cricket-player-count` auf die aktive
  Spieleranzahl (z. B. 4) synchronisiert; dazu wurden Style- und
  Lifecycle-Regressionen erweitert.

## [2.0.40] - 2026-03-18

### Fixed

- Nutzerwirkung: Im Cricket- und Tactics-Theme sind Spieler-/Punktekarten jetzt
  pixelgenau an den unteren Spalten ausgerichtet. Die Namenszeile ist wirklich
  randbündig ohne Seitenspalt, aktive Scores bleiben innerhalb der Karte, und
  die letzte Spielerkarte wird bei knapper Breite nicht mehr rechts abgeschnitten.
  Technik: Die Player- und Grid-Spalten nutzen einen gemeinsamen Width-Token
  (`--ad-ext-theme-cricket-player-column-width`), Kartenabstände wurden auf `0`
  vereinheitlicht, Bleed-Hacks der Namenszeile entfernt, Score-Containment gehärtet
  sowie die Cricket-Readability-Policy auf die neue Kartengeometrie synchronisiert
  (`playerCardMinWidthPx=205`, `playerCardGapPx=0`, `playerAreaPaddingPx=12`);
  dazu wurden CSS-Regressionen und Lifecycle-Regressionen inkl. 4-Spieler-Fall erweitert.

## [2.0.39] - 2026-03-18

### Fixed

- Nutzerwirkung: Im Cricket- und Tactics-Theme haben Spielerkarten jetzt etwas mehr
  Mindestbreite, damit Name, Rundenzähler, `MPR` und Punktzahl bei 4 Spielern stabiler
  nebeneinander bleiben und nicht sichtbar ineinanderlaufen.
  Technik: Die minimale Spaltenbreite der Player-Cards wurde auf `12.6rem` angehoben,
  die Score-Mindestbreite auf `4.2ch` erweitert und der `MPR`-Offset wieder auf einen
  robusten festen Wert gesetzt; die Style-Regressionen prüfen die neuen Variablen und
  Spacing-Werte.

## [2.0.38] - 2026-03-18

### Fixed

- Nutzerwirkung: Im Cricket- und Tactics-Theme bleibt `MPR` bei dreistelligen Punkten
  wie `120` jetzt klar links neben den Runden und kollidiert nicht mehr mit der
  Score-Anzeige.
  Technik: Die Stats-Zeile behält weiterhin die Spalten `1 / 3`, nutzt jetzt aber ein
  dynamisches linkes `padding-left` via `clamp(...)`, damit sich der Abstand für
  unterschiedliche Kartenbreiten anpasst; die CSS-Regression deckt die neue Regel ab.

## [2.0.37] - 2026-03-18

### Fixed

- Nutzerwirkung: Im Cricket- und Tactics-Theme überlappt `MPR` bei dreistelligen
  Punktzahlen nicht mehr mit dem Score. Die Punkte bleiben groß, während `MPR` sichtbar
  weiter links steht.
  Technik: Die Stats-Zeile spannt jetzt über Spalte 1–2 statt nur über Spalte 2 und
  erhält ein linkes Offset für den Match-Badge, wodurch rechts dynamisch mehr Raum für
  dreistellige Scores entsteht; die Cricket-Style-Regressionen prüfen den neuen
  Grid-/Spacing-Vertrag.

## [2.0.36] - 2026-03-18

### Fixed

- Nutzerwirkung: Im Cricket- und Tactics-Theme liegt die Namensleiste jetzt wirklich
  randbündig am Spieler-/Punkte-Container ohne seitlichen Spalt. Gewonnene Runden, `MPR`
  und Punkte sind sichtbar um rund 15% größer; `MPR` sitzt dabei weiter links, und
  3-stellige Punkte bleiben sauber lesbar.
  Technik: Die Header-Leiste nutzt jetzt einen expliziten Inline-Bleed bis zur
  Kartenkante, die Stats-/Score-Spalten wurden für größere Zahlen neu austariert
  (u. a. Score-Minbreite, kompaktere Spaltengaps, linksverschobenes `MPR`), die
  Kartenhöhe wurde erhöht und die Cricket-Style-Regressionen wurden auf die neuen
  Größen-, Ausrichtungs- und Overflow-Verträge erweitert.

## [2.0.35] - 2026-03-18

### Fixed

- Nutzerwirkung: Im Cricket- und Tactics-Theme ist die Hierarchie zwischen aktivem und
  inaktivem Spieler klarer: aktive Namen und Punkte sind sichtbar größer, inaktive
  kompakter. Der Namenscontainer läuft jetzt randlos über die volle Kartenbreite,
  Profil-Averages wie `35+` stehen rechts in derselben Zeile wie der Name, lange Namen
  bleiben einzeilig mit `..`-Kürzung, und `MPR` bleibt links neben den gewonnenen Runden
  vollständig lesbar.
  Technik: Das Player-Header-Layout nutzt jetzt eine einzeilige
  `avatar | name | wins`-Leiste mit randloser Vollbreite, die Stats-Spalte wurde mit
  Mindestbreite/Linksausrichtung gegen Abschneiden gehärtet, und die Score-Skalierung
  für aktive wie inaktive Spieler wurde um rund 10% erhöht, inklusive Regressionstests
  für Grid-Vertrag, Overflow-Verhalten und Größenhierarchie.

## [2.0.34] - 2026-03-17

### Fixed

- Nutzerwirkung: Im Cricket- und Tactics-Theme steht der Spielername jetzt in der
  ersten Zeile über die volle Kartenbreite; darunter sind Match-Wins, MPR und Punkte
  als klare Dreiteilung angeordnet. Der aktive Spielername bleibt einzeilig und wird
  bewusst kleiner dargestellt, damit die Punktezahl dominant lesbar bleibt.
  Technik: Das Player-Header-Grid wurde auf `identity` über alle drei Spalten plus
  zweite Zeile `matches | stats | score` umgestellt, der `css-1cmgsw8`-Badge in die
  dedizierte Matches-Spalte gelegt, MPR in Spalte 2 zentriert und die Score-Skalierung
  für bessere Lesbarkeit angehoben; zusätzlich erzwingen neue Regeln einzeilige Namen
  ohne Umbruch und die Style-Regressionen sichern den neuen Layout-Vertrag ab.

## [2.0.33] - 2026-03-17

### Fixed

- Nutzerwirkung: Im Cricket- und Tactics-Theme steht für den Spielernamen wieder mehr
  Breite zur Verfügung; der kleine Match-/Set-Zähler sitzt jetzt kompakter neben `MPR`,
  und die Punkte bleiben rechts klar lesbar.
  Technik: Das Player-Header-Layout wurde von 3 auf 2 Spalten reduziert, der
  `css-1cmgsw8`-Badge in die Stats-Zeile verschoben und verkleinert, die MPR-Zeile
  entsprechend eingerückt und die Style-Regressionen auf den neuen Grid-Vertrag angepasst.

## [2.0.32] - 2026-03-17

### Fixed

- Nutzerwirkung: Im Cricket- und Tactics-Theme nutzen Spielername, Match-Wins und Punkte
  den vorhandenen Platz jetzt deutlich sauberer; bei schmalen Spielerkarten bleibt der
  Score dominant lesbar, während Namen und Zusatzinfos strukturierter umbrechen und
  weniger hart abgeschnitten werden.
  Technik: Die Player-Cards wurden auf eine Drei-Zonen-Kopfzeile mit separatem Zähler,
  kompaktem Identitätsblock und eigener Score-Spalte umgestellt; der Wins-Badge wurde
  unter den Namen gezogen, enge Karten erhalten Container-spezifische Avatar-/Name-
  Anpassungen, und die Cricket-Style-Regressionen sichern den neuen CSS-Vertrag ab.

## [2.0.31] - 2026-03-17

### Fixed

- Nutzerwirkung: Im Cricket- und Tactics-Theme bleiben Spielername, Matchdaten und Punkte
  jetzt auch bei langen Namen sauber getrennt; außerdem nutzen die Spielerspalten
  definierte Mindest- und Maximalbreiten, und die Punktebreite wächst wieder passend mit
  der Stellenzahl.
  Technik: Die Player-Cards wurden auf getrennte Meta-/Submeta-Zeilen mit dynamischer
  Score-Spalte umgestellt, die Cricket/Tactics-Tabellenspalten bekamen feste
  Min-/Max-Breiten per CSS-Variablen, die Style-Regressionen wurden erweitert und die
  Release-Metadaten auf 2.0.31 angehoben.

## [2.0.30] - 2026-03-17

### Fixed

- Nutzerwirkung: Im Cricket- und Tactics-Theme sind Spielername, Avatar und MPR jetzt klar
  von der Punktezahl getrennt, sodass lange Namen nicht mehr mit dem Score kollidieren.
  Technik: Die Player-Cards nutzen jetzt ein festes Zwei-Spalten-Grid mit reservierter
  Score-Spalte und separatem Meta-Bereich; neue Style-Regressionen sichern die Trennung,
  ohne die March-15-Readability- und Mehrspieler-Shrink-Logik zu verändern.

## [2.0.29] - 2026-03-17

### Fixed

- Nutzerwirkung: Im Cricket- und Tactics-Theme bleiben Event-Boards jetzt sauber im
  vorgesehenen grünen Rahmen, und die Punkte der nicht aktiven Spieler sind trotz
  abgeschwächter Karten wieder deutlich besser lesbar.
  Technik: Die Theme-Hooks markieren bei verschachtelten `.showAnimations`-Boards jetzt
  zusätzlich einen Event-Shell- und Media-Root-Layer für stabiles Inner-Fitting; außerdem
  wurde die Inaktiv-Dämpfung der Player-Cards von globaler Opacity auf Overlay-/Kontrast-
  Styling umgestellt und mit neuen Runtime-/Style-Regressionen gegen March-15-Readability,
  Board-Fit und Score-Lesbarkeit abgesichert.

## [2.0.28] - 2026-03-17

### Fixed

- Nutzerwirkung: Im Cricket- und Tactics-Theme bleibt das Liveboard mit virtuellem Zahlenring
  jetzt stabil im vorgesehenen Board-Bereich, sodass Ring-Overlays nicht mehr gemeinsam
  mit dem eigentlichen Board unerwünscht zusammenziehen.
  Technik: Die Shared-Theme-Hooks bevorzugen bei `.showAnimations` jetzt denselben inneren
  Board-Layer wie der TV-Zoom, statt pauschal den äußeren Wrapper zu skalieren; neue
  Runtime-Regressionen sichern die Layer-Priorität, die unveränderten March-15-Readability-
  Werte und die Kompatibilität mit Cricket-Highlighter/Grid-FX ab.

## [2.0.27] - 2026-03-17

### Fixed

- Nutzerwirkung: Die Remove-Darts-Hand wird jetzt als eigenes xConfig-Overlay angezeigt,
  sodass der gelbe Host-Hintergrund verschwindet, das Pulsieren ruhig bleibt und die
  Bildgröße aus xConfig wieder die sichtbare Karte steuert.
  Technik: Das Feature blendet erkannte Takeout-Hosts nur noch aus, rendert ein isoliertes
  Overlay am Dokument-Root und sichert Host-Hiding, Overlay-Cleanup, Puls-Contract und
  Größen-Presets mit neuen Runtime- und Style-Regressionen ab.

## [2.0.25] - 2026-03-16

### Fixed

- Nutzerwirkung: Beim X01-Checkout bleibt der TV-Board-Zoom bei kurzen
  Übergangsphasen zwischen Würfen stabiler, wodurch sichtbares Board-Flackern
  und kurzzeitige Scrollbalken deutlich reduziert werden.
  Technik: Der Zoom-Reset nutzt jetzt eine kurze Hysterese für transiente
  `board/target/intent`-Nullzustände und behält den sofortigen Korrektur-Reset
  über `manualPause`; zusätzlich sichern neue Runtime-Regressionen den
  Kurzunterbruch-, Persistenz- und Korrekturpfad ab.

## [2.0.24] - 2026-03-16

### Fixed

- Nutzerwirkung: Die Remove-Darts-Benachrichtigung pulsiert jetzt stabiler und zeigt die
  Hand-Grafik ohne unerwünschte Hintergrundflächen an, auch wenn die Autodarts-Oberfläche
  oder Themes eigene Bild- und Pseudo-Element-Styles mitbringen.
  Technik: Das Feature erzwingt transparente Bilddarstellung und Animationsregeln jetzt
  robuster per CSS, neutralisiert Pseudo-Elemente des Notice-Containers und erhält
  Regressionen für den Stilvertrag sowie den Alpha-Kanal des TakeOut-Assets.

## [2.0.23] - 2026-03-16

### Added

- Nutzerwirkung: Das Projekt besitzt jetzt ein gepflegtes Changelog mit verständlichem
  Änderungstext für normale Nutzer und einem separaten Technikteil für fortgeschrittene
  Leser.
  Technik: `CHANGELOG.md`, ein Konsistenzcheck unter `scripts/check-changelog-consistency.mjs`,
  das Skill `changelog_maintenance` sowie ergänzende Tests und Agent-Regeln wurden
  eingeführt und in die Verifikationskette eingebunden.

## [2.0.22] - 2026-03-15

### Fixed

- Nutzerwirkung: Der TV-Board-Zoom bleibt beim Start eines neuen Spiels nicht mehr
  fälschlich in einem alten Checkout-Zoom hängen, wenn kurzzeitig noch veraltete Scores
  sichtbar sind.
  Technik: Die Zoom-Entscheidung prüft den sichtbaren aktiven Score jetzt robuster gegen
  den Game-State und räumt Sticky-Zustände bei Spielstart gezielt auf; dafür wurde eine
  Regression in `x01-feature-logic` ergänzt.

## [2.0.21] - 2026-03-15

### Fixed

- Nutzerwirkung: Dart-Markierungen bleiben unter TV-Zoom sauber innerhalb des Boards und
  ragen nicht mehr sichtbar über den Viewport hinaus.
  Technik: Das Dart-Overlay wird an den gezoomten Board-Viewport geklammert, damit die
  Marker-Geometrie auch bei transformierten Zoom-Containern stabil begrenzt bleibt.

## [2.0.20] - 2026-03-15

### Fixed

- Nutzerwirkung: Der Single-Bull-Sound wird bei derselben Aktion nicht mehr doppelt
  ausgelöst.
  Technik: Die Wiederholungserkennung zwischen DOM-Replay und Game-State-Replay wurde
  dedupliziert, damit derselbe Treffer nur noch einmal verarbeitet wird.

## [2.0.19] - 2026-03-15

### Fixed

- Nutzerwirkung: Die Remove-Darts-Benachrichtigung greift nicht mehr in die xConfig-Oberfläche
  ein und pausiert sauber, solange die xConfig-Ansicht geöffnet ist.
  Technik: Die Erkennung schließt die xConfig-Route und deren DOM gezielt aus, damit
  Takeout-Ersatzlogik nur noch auf den vorgesehenen Spieloberflächen aktiv ist.

## [2.0.18] - 2026-03-15

### Changed

- Nutzerwirkung: Status- und Update-Erkennung reagieren robuster auf Wortlautänderungen
  und verursachen weniger unnötige Online-Abfragen.
  Technik: Gemeinsame Autodarts-Begriffe, Vertrags-/Fixture-Tests und eine widerstandsfähigere
  Update-Check-Logik mit 304-/Fehler-TTL wurden ergänzt; außerdem wurden X01- und
  Remove-Darts-Heuristiken verschärft.

## [2.0.17] - 2026-03-15

### Fixed

- Nutzerwirkung: Die Remove-Darts-Erkennung trifft Spielsituationen wieder konsistenter,
  auch wenn Board-Manager- oder Legacy-ähnliche Zustände auftreten.
  Technik: Die Erkennungslogik wurde an die ältere Zustandsauswertung und Board-Manager-Signale
  angeglichen, damit Takeout-Fälle aus unterschiedlichen Snapshot-Varianten gleich behandelt
  werden.

## [2.0.16] - 2026-03-15

### Fixed

- Nutzerwirkung: Im X01-Theme bleiben Spielerkacheln und Wurfzeile auch unter Zoom sauber
  über der Dart-Overlay-Ebene sichtbar.
  Technik: Die Layer-Reihenfolge zwischen Theme-Layout und Dart-Overlay wurde im
  Zoom-Kontext neu ausbalanciert, damit die relevanten UI-Schichten nicht verdeckt werden.

## [2.0.15] - 2026-03-15

### Fixed

- Nutzerwirkung: Der Button `Update installieren` öffnet nicht mehr versehentlich eine
  veraltete, zwischengespeicherte Userscript-Datei.
  Technik: Die Installations-URL erhält einen Cache-Busting-Parameter und die zugehörigen
  Update-Check-/Shell-Regressionen prüfen den neuen Abrufpfad mit.

## [2.0.14] - 2026-03-15

### Changed

- Nutzerwirkung: Die Farbauswahl für Triple/Double/Bull ist im xConfig-Menü einfacher,
  direkter und standardmäßig auf das gut erkennbare Rot/Blau/Grün gesetzt.
  Technik: Die separate Trefferfarben-Gruppe wurde entfernt, der Farbstil vereinfacht,
  `kind-signal` als Default verdrahtet und die Doku-, Descriptor- und Runtime-Tests
  wurden daran angepasst.

## [2.0.13] - 2026-03-15

### Added

- Nutzerwirkung: Für Triple/Double/Bull gibt es im xConfig-Menü jetzt einen expliziten
  Farbmodus, der zwischen klarer Trefferkodierung und Preset-Farbstilen unterscheidet.
  Technik: `hitColorMode` wurde in Konfiguration, Normalisierung, UI-Beschreibung, Styling
  und Regressionstests eingeführt und die generierten README-/FEATURES-Texte wurden
  entsprechend synchronisiert.

[2.0.98]: https://github.com/thomasasen/autodarts-xconfig/compare/652863c...HEAD
[2.0.96]: https://github.com/thomasasen/autodarts-xconfig/compare/bd6c654...652863c
[2.0.94]: https://github.com/thomasasen/autodarts-xconfig/compare/830ce47...bd6c654
[2.0.93]: https://github.com/thomasasen/autodarts-xconfig/compare/8355902...830ce47
[2.0.92]: https://github.com/thomasasen/autodarts-xconfig/compare/fcc069c...8355902
[2.0.91]: https://github.com/thomasasen/autodarts-xconfig/compare/2824799...fcc069c
[2.0.90]: https://github.com/thomasasen/autodarts-xconfig/compare/b0eb1cc...2824799
[2.0.89]: https://github.com/thomasasen/autodarts-xconfig/compare/9b8c3c0...b0eb1cc
[2.0.88]: https://github.com/thomasasen/autodarts-xconfig/compare/0d636b4...9b8c3c0
[2.0.86]: https://github.com/thomasasen/autodarts-xconfig/compare/0bebdfc...0d636b4
[2.0.85]: https://github.com/thomasasen/autodarts-xconfig/compare/67edda7...df12512
[2.0.84]: https://github.com/thomasasen/autodarts-xconfig/compare/67edda7...df12512
[2.0.83]: https://github.com/thomasasen/autodarts-xconfig/compare/a3b3e0d...67edda7
[2.0.82]: https://github.com/thomasasen/autodarts-xconfig/compare/ae480a9...a3b3e0d
[2.0.81]: https://github.com/thomasasen/autodarts-xconfig/compare/ae480a9...59c9b12
[2.0.80]: https://github.com/thomasasen/autodarts-xconfig/compare/ae480a9...HEAD
[2.0.79]: https://github.com/thomasasen/autodarts-xconfig/compare/ae480a9...HEAD
[2.0.78]: https://github.com/thomasasen/autodarts-xconfig/compare/6223647...ae480a9
[2.0.77]: https://github.com/thomasasen/autodarts-xconfig/compare/0e2da01...HEAD
[2.0.76]: https://github.com/thomasasen/autodarts-xconfig/compare/0e2da01...HEAD
[2.0.75]: https://github.com/thomasasen/autodarts-xconfig/compare/0e2da01...HEAD
[2.0.74]: https://github.com/thomasasen/autodarts-xconfig/compare/0e2da01...HEAD
[2.0.73]: https://github.com/thomasasen/autodarts-xconfig/compare/0e2da01...HEAD
[2.0.72]: https://github.com/thomasasen/autodarts-xconfig/compare/0e2da01...HEAD
[2.0.71]: https://github.com/thomasasen/autodarts-xconfig/compare/0e2da01...HEAD
[2.0.70]: https://github.com/thomasasen/autodarts-xconfig/compare/0e2da01...HEAD
[2.0.69]: https://github.com/thomasasen/autodarts-xconfig/compare/0e2da01...HEAD
[2.0.68]: https://github.com/thomasasen/autodarts-xconfig/compare/0e2da01...HEAD
[2.0.67]: https://github.com/thomasasen/autodarts-xconfig/compare/0e2da01...HEAD
[2.0.66]: https://github.com/thomasasen/autodarts-xconfig/compare/0e2da01...HEAD
[2.0.65]: https://github.com/thomasasen/autodarts-xconfig/compare/0e2da01...HEAD
[2.0.64]: https://github.com/thomasasen/autodarts-xconfig/compare/0e2da01...HEAD
[2.0.63]: https://github.com/thomasasen/autodarts-xconfig/compare/0e2da01...HEAD
[2.0.62]: https://github.com/thomasasen/autodarts-xconfig/compare/222042a...HEAD
[2.0.61]: https://github.com/thomasasen/autodarts-xconfig/compare/222042a...HEAD
[2.0.60]: https://github.com/thomasasen/autodarts-xconfig/compare/222042a...HEAD
[2.0.59]: https://github.com/thomasasen/autodarts-xconfig/compare/222042a...HEAD
[2.0.58]: https://github.com/thomasasen/autodarts-xconfig/compare/222042a...HEAD
[2.0.57]: https://github.com/thomasasen/autodarts-xconfig/compare/2606db6...222042a
[2.0.56]: https://github.com/thomasasen/autodarts-xconfig/compare/2606db6...HEAD
[2.0.55]: https://github.com/thomasasen/autodarts-xconfig/compare/8a156b3...2606db6
[2.0.54]: https://github.com/thomasasen/autodarts-xconfig/compare/8a31cd6...8a156b3
[2.0.53]: https://github.com/thomasasen/autodarts-xconfig/compare/fec14ae...8a31cd6
[2.0.52]: https://github.com/thomasasen/autodarts-xconfig/compare/d40e59c...fec14ae
[2.0.51]: https://github.com/thomasasen/autodarts-xconfig/compare/d40e59c...HEAD
[2.0.50]: https://github.com/thomasasen/autodarts-xconfig/compare/d40e59c...HEAD
[2.0.49]: https://github.com/thomasasen/autodarts-xconfig/compare/6362059...d40e59c
[2.0.48]: https://github.com/thomasasen/autodarts-xconfig/compare/6362059...HEAD
[2.0.47]: https://github.com/thomasasen/autodarts-xconfig/compare/c307908...HEAD
[2.0.46]: https://github.com/thomasasen/autodarts-xconfig/compare/c307908...HEAD
[2.0.45]: https://github.com/thomasasen/autodarts-xconfig/compare/c307908...HEAD
[2.0.44]: https://github.com/thomasasen/autodarts-xconfig/compare/c307908...HEAD
[2.0.43]: https://github.com/thomasasen/autodarts-xconfig/compare/c307908...HEAD
[2.0.42]: https://github.com/thomasasen/autodarts-xconfig/compare/c307908...HEAD
[2.0.41]: https://github.com/thomasasen/autodarts-xconfig/compare/c307908...HEAD
[2.0.40]: https://github.com/thomasasen/autodarts-xconfig/compare/c307908...HEAD
[2.0.39]: https://github.com/thomasasen/autodarts-xconfig/compare/c307908...HEAD
[2.0.38]: https://github.com/thomasasen/autodarts-xconfig/compare/c307908...HEAD
[2.0.37]: https://github.com/thomasasen/autodarts-xconfig/compare/c307908...HEAD
[2.0.36]: https://github.com/thomasasen/autodarts-xconfig/compare/c307908...HEAD
[2.0.35]: https://github.com/thomasasen/autodarts-xconfig/compare/c307908...HEAD
[2.0.34]: https://github.com/thomasasen/autodarts-xconfig/compare/f62c2bb...c307908
[2.0.33]: https://github.com/thomasasen/autodarts-xconfig/compare/fffb5d2...f62c2bb
[2.0.32]: https://github.com/thomasasen/autodarts-xconfig/compare/fffb5d2...HEAD
[2.0.31]: https://github.com/thomasasen/autodarts-xconfig/compare/ebfd931dc5180a2eb8cbfc8dfbf017ca4fe1f963...HEAD
[2.0.30]: https://github.com/thomasasen/autodarts-xconfig/compare/ebfd931dc5180a2eb8cbfc8dfbf017ca4fe1f963...HEAD
[2.0.29]: https://github.com/thomasasen/autodarts-xconfig/compare/ebfd931dc5180a2eb8cbfc8dfbf017ca4fe1f963...HEAD
[2.0.28]: https://github.com/thomasasen/autodarts-xconfig/compare/da6445eb2ad39d2df5c8f7781020da9b8906d787...ebfd931dc5180a2eb8cbfc8dfbf017ca4fe1f963
[2.0.27]: https://github.com/thomasasen/autodarts-xconfig/compare/a8ab099cf0bb8a43ea28ff8b44eebc2ad274d695...HEAD
[2.0.25]: https://github.com/thomasasen/autodarts-xconfig/compare/1f76798f0a8c495d13d5452a66d65e9d309fb470...a8ab099cf0bb8a43ea28ff8b44eebc2ad274d695
[2.0.24]: https://github.com/thomasasen/autodarts-xconfig/compare/94f648b2ef5772d813fb5201bbde2104cb41b933...1f76798f0a8c495d13d5452a66d65e9d309fb470
[2.0.23]: https://github.com/thomasasen/autodarts-xconfig/compare/8e9251e1141c694dc81dcd527382aa08f1def821...94f648b2ef5772d813fb5201bbde2104cb41b933
[2.0.22]: https://github.com/thomasasen/autodarts-xconfig/compare/b142ab0dace21fb76c51b440c90507c5e8a2333f...8e9251e1141c694dc81dcd527382aa08f1def821
[2.0.21]: https://github.com/thomasasen/autodarts-xconfig/compare/80ad4c176536d1ac4eec34f6732e04f357918d8b...b142ab0dace21fb76c51b440c90507c5e8a2333f
[2.0.20]: https://github.com/thomasasen/autodarts-xconfig/compare/092f567fde95d629426cdbf4cd2501271efe8096...80ad4c176536d1ac4eec34f6732e04f357918d8b
[2.0.19]: https://github.com/thomasasen/autodarts-xconfig/compare/22e095553b01a49484b7b36993eeec6f6b81aeb6...092f567fde95d629426cdbf4cd2501271efe8096
[2.0.18]: https://github.com/thomasasen/autodarts-xconfig/compare/3427a5b8d5e8650d8fd28d6395b3a56548151ed0...22e095553b01a49484b7b36993eeec6f6b81aeb6
[2.0.17]: https://github.com/thomasasen/autodarts-xconfig/compare/d2aa5c71956683d107ce9746a686738d2bf1ca7b...3427a5b8d5e8650d8fd28d6395b3a56548151ed0
[2.0.16]: https://github.com/thomasasen/autodarts-xconfig/compare/32a7a4e8d3346240f7d9cda62a9495de5836d3bf...d2aa5c71956683d107ce9746a686738d2bf1ca7b
[2.0.15]: https://github.com/thomasasen/autodarts-xconfig/compare/5928f307b41c71e21b30b6dc44fa59ced4c03fd4...32a7a4e8d3346240f7d9cda62a9495de5836d3bf
[2.0.14]: https://github.com/thomasasen/autodarts-xconfig/compare/ec5d8bf2fd77f3056949d5d2b7fc0c3975e981d1...5928f307b41c71e21b30b6dc44fa59ced4c03fd4
[2.0.13]: https://github.com/thomasasen/autodarts-xconfig/compare/974fcd97ceaaaa6e546fb53c1d16af64823624b9...ec5d8bf2fd77f3056949d5d2b7fc0c3975e981d1
