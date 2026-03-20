# Changelog

Alle nennenswerten Änderungen an diesem Projekt werden in dieser Datei festgehalten.

Das Format orientiert sich an [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
und die Versionsvergabe folgt [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Solange dieses Repository noch keine Git-Tags verwendet, verweisen die Versionslinks auf
GitHub-Vergleiche zwischen Release-Commits. Der neueste lokale Release-Eintrag kann bis
zum nächsten Release-Commit vorübergehend auf `HEAD` zeigen.

## [Unreleased]

_Noch keine Änderungen erfasst._

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

[Unreleased]: https://github.com/thomasasen/autodarts-xconfig/compare/222042a...HEAD
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
