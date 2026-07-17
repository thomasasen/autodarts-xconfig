# Changelog

Alle nennenswerten Änderungen an diesem Projekt werden in dieser Datei festgehalten.

Das Format orientiert sich an [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
und die Versionsvergabe folgt [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Solange dieses Repository noch keine Git-Tags verwendet, verweisen die Versionslinks auf
GitHub-Vergleiche zwischen Release-Commits. Der neueste lokale Release-Eintrag kann bis
zum nächsten Release-Commit vorübergehend auf `HEAD` zeigen.

Dieses Repository führt keine `Unreleased`-Sektion. Jeder dokumentierte Eintrag gehört
direkt zu einer versionierten Release-Sektion.

## [2.4.16] - 2026-07-17

### Added

- Nutzerwirkung: Das Dartboard kann mit zehn eingebetteten Designs dargestellt werden; wahlweise nur während Bot-Zügen oder auf allen Match-Boards.
  Technik: Ein neues konfigurierbares Board-Style-Feature bindet optimierte WebP-Assets in die erkannte SVG-Board-Fläche ein und synchronisiert Auswahl, Spielzustand, DOM-Ersatz sowie vollständiges Cleanup über den bestehenden Feature-Lifecycle.

### Fixed

- Nutzerwirkung: Live-, Virtual- und weitere verfügbare Board-Eingabemodi bleiben in allen aktiven Themes sichtbar, per Maus und Tastatur erreichbar und werden nur angeboten, wenn Autodarts eine funktionierende Host-Aktion bereitstellt.
  Technik: Gemeinsame semantische Control-Erkennung, plurale Layout-Gruppen und ein zustandsgepatchtes Theme-Portal ersetzen das X01-Zweispieler-Index-Mirroring und sichern Tabs, Radios, Switches, Checkboxen, React-Neurendering sowie vollständiges Cleanup ab.

## [2.4.15] - 2026-07-17

### Changed

- Nutzerwirkung: Laufende Partien reagieren bei vielen gleichzeitigen DOM-Änderungen flüssiger; Themes, X01-Spieler-Effekte, Checkout-Anzeigen, Treffer-Effekte und Bull-Sound verursachen weniger unnötige Hintergrundarbeit, ohne Funktionen oder Darstellung einzuschränken.
  Technik: Revisionsbasierte Game-State- und Theme-Caches, eng begrenzte Spieler- und Turn-Surface-Observer sowie ein signaturbasierter X01-Zweispieler-Control-Mirror reduzieren Clones, CSS-Erzeugung, DOM-Scans, Scheduler-Aufrufe und Mirror-Neuaufbauten; zählerbasierte Regressionstests sichern die Hotpaths ab.

## [2.4.14] - 2026-07-16

### Fixed

- Nutzerwirkung: Die Dartboard-Erkennung bleibt auch bei verzögert aufgebauten oder nachträglich aktualisierten SVG-Boards zuverlässig.
  Technik: Der dauerhafte Radius-Cache wurde entfernt, Radius-, SVG-Query- und Agent-Checker-Regressionen direkt abgesichert sowie Release-Metadaten und Agent-Anweisungen bereinigt.

## [2.4.13] - 2026-07-15

### Changed

- Nutzerwirkung: Keine sichtbaren Änderungen für Endnutzer.
  Technik: Version-Bump auf 2.4.13 inkl. Bereinigung ungetrackter Artefakte im Working Tree.

## [2.4.12] - 2026-07-14

### Changed

- Nutzerwirkung: Keine sichtbaren Änderungen für Endnutzer.
  Technik: `getBoardRadius()` und `readDrawableMetrics()` verwenden `for..of` statt `for..i`-Loops für klareren Code in `tv-board-zoom/logic.js` und `shared/dartboard-svg.js`. Test- und Skill-Dokumentation wurden an die Signaturanpassungen angeglichen.

## [2.4.11] - 2026-07-14

### Fixed

- Nutzerwirkung: Das X01-Zweispieler-Template zeigt das Layout korrekt an; überlagerte Elemente und verschobene Positionen wurden behoben.
  Technik: Zielgerichtete Korrekturen am Zwei-Spieler-Grid-Layout und an den zugehörigen CSS-Regeln stabilisieren die Kartenanordnung.

## [2.4.10] - 2026-07-14

### Added

- Nutzerwirkung: Das X01-Zweispieler-Theme bietet konfigurierbare Darstellungsstile, Farbschemata, Informationsdichten, Aktivspieler-Hervorhebungen und ein- oder zweizeilige Spielernamen; die Spielerinformationen lassen sich vollständig oder ausschließlich als Name darstellen.
  Technik: Kanonisch normalisierte Presets, Root-Attribute, getrennte Stil- und Farbtokens sowie DOM-basierte Zweizeilenmessung erweitern Theme, xConfig und Regressionstests ohne Migration bestehender Konfigurationen.

### Fixed

- Nutzerwirkung: Lange Spielernamen, Rundenzähler und Statistiken überlagern sich nicht mehr; gewonnene Runden stehen links oben, Statistiken rechts oben und der Name erhält einen dezenten Abstand zur Kopfzeile.
  Technik: Ein spezifischer finaler Grid-Guard hält Karten, Score und Fortschritt über die volle Breite stabil, entfernt die Aktivspieler-Skalierung und schützt die Anordnung gegen konkurrierende X01-Theme-Regeln.

## [2.4.9] - 2026-07-10

### Changed

- Nutzerwirkung: Im Cricket-Theme wirken Spielerpunkte und Wurfkacheln luftiger; die Punktezahl nutzt den rechten Kartenbereich besser aus und `60`/`T20` sitzt in höheren, responsiven Wurfkacheln mit mehr Abstand zum Rand.
  Technik: Cricket-spezifische Score- und Turn-Tile-Variablen steuern Schriftgröße, vertikalen Offset, Kachelhöhe, Innenabstand und Segmentzeile über responsive `clamp()`-Werte.

## [2.4.8] - 2026-07-04

### Added

- Nutzerwirkung: `Dart Marker Replacer` bietet mit `Natürlich` und `Dramatisch` zwei stabile Einschlagstile, die Dart-Winkel, Perspektive und Schatten sichtbar variieren, während `Klassisch` den bisherigen Look beibehält und die Spitze exakt am Trefferpunkt bleibt.
  Technik: Eine gemeinsame deterministische Pose-Matrix steuert Runtime und Vorschau, erweitert die SVG-Struktur tip-verankert und hält das Overlay auch bei `TV Board Zoom` während Mutation, Transition und Reset synchron.

## [2.4.7] - 2026-06-25

### Fixed

- Nutzerwirkung: `X01 Bust Active Player Highlight` behält beim Überwurf das rote `60 T20`-Hitkachel-Design auf der aktiven Spielerkarte, auch wenn spätere Trefferanimationen andere Farben verwenden.
  Technik: Das Bust-Modul verwendet eine feste Kopie der roten Hitkachel-Visuals statt aktueller Throw-Tile-Styles und schützt den Pfad mit einer Regression gegen anders eingefärbte Trefferflächen.

## [2.4.6] - 2026-06-25

### Added

- Nutzerwirkung: `X01 Bust Active Player Highlight` kann beim Überwurf zusätzlich einen Glass-Crack-Sound abspielen und die Vorschau zeigt den Effekt direkter im Einstellungsdialog.
  Technik: Das Bust-Modul bündelt Crack-Overlay, Audio-Asset, Config-Normalisierung und Preview-/Descriptor-Wiring mit zusätzlichen Runtime- und Struktur-Regressionen.

### Fixed

- Nutzerwirkung: `TV Board Zoom` behandelt einen sichtbaren `BUST`-Zustand stabiler und zoomt nicht weiter auf überholte Checkout-Ziele.
  Technik: Die Zoom-Logik erkennt Bust-Zustände als eigenen Spielzustand, räumt aktive Zieltransforms kontrolliert ab und deckt den Pfad mit fokussierten Runtime-Tests ab.

## [2.4.5] - 2026-06-24

### Fixed

- Nutzerwirkung: Kleine `Special Hit Highlights`-GIFs werden im Boardbereich proportional vergrößert und bleiben vollständig sichtbar, statt klein oder abgeschnitten über der Dartscheibe zu erscheinen.
  Technik: Theme-Mounts synchronisieren Autodarts-Tools-Animations-GIFs in Shadow-Roots auf den erkannten Board-Viewport und verwenden `object-fit: contain`; der TV-Board-Zoom-Fallback behandelt dieselbe GIF-Struktur ohne die Medienebene mitzuzoomen.

## [2.4.4] - 2026-06-19

### Fixed

- Nutzerwirkung: `TV Board Zoom` stellt einen sichtbaren direkten Checkout nach einem Seiten-Reload wieder her, auch wenn der interne Match-Turn noch nicht vollständig geladen ist.
  Technik: Ein eng begrenzter Hydration-Fallback akzeptiert ausschließlich eine sichtbare, gegen den aktiven Score validierte Ein-Dart-Finish-Suggestion und übergibt danach wieder an den regulären Game-State-Pfad.
- Nutzerwirkung: Der Board-Zoom flackert bei responsiven Größenänderungen nicht mehr, besonders bei Checkout-Zielen im unteren Board-Bereich.
  Technik: Die Transform-Normalisierung priorisiert aktuelle untransformierte Layoutmaße, konvergiert nach Board-Resizes auf einen stabilen Transform und ist gegen wiederholte Reapply-Aufrufe abgesichert.

## [2.4.3] - 2026-06-19

### Added

- Nutzerwirkung: `X01 Bust Active Player Highlight` kann beim Überwurf sofort bis zu drei zufällig platzierte Glasrisse auf der aktiven Spielerkarte anzeigen; die Anzahl ist in xConfig von `Aus` bis `3` wählbar.
  Technik: Der Bust-Flankenwechsel erzeugt ein größenabhängiges SVG-Overlay mit den Geometrie-, Reflexions-, Fraktur-, Mainline- und Noise-Parametern der Glass-Crack-Canvas-Demo, begrenzt die Konfiguration auf `0–3` und räumt alle Effektknoten beim Bust-Ende oder Unmount auf.

## [2.4.2] - 2026-06-18

### Added

- Nutzerwirkung: X01-Überwürfe fallen direkt auf der aktiven Spielerkarte auf: Bei sichtbarem `BUST` übernimmt die Karte die rote Wurfkachel-Optik, wackelt kurz im Earthquake-Stil und bleibt rot markiert, bis `BUST` verschwindet.
  Technik: Das neue X01-Modul erkennt den sichtbaren Turn-Score, übernimmt die Throw-Tile-Farbwerte zur Laufzeit, kapselt den Shake-Effekt und ist in Registry, xConfig, Preview-Asset-Manifest, README, Feature-Doku und Regressionen verdrahtet.

### Changed

- Nutzerwirkung: `X01 Bust Active Player Highlight` ist bei neuen Installationen standardmäßig eingeschaltet.
  Technik: Default-Konfiguration und Normalizer-Fallback aktivieren das Feature ohne gespeicherten Override, während Debug ausgeschaltet bleibt.

## [2.4.1] - 2026-06-17

### Changed

- Nutzerwirkung: X01-artige Themes, Bermuda, Gotcha, Cricket/Tactics und X01 2Player nutzen große Bildschirme besser aus; aktive Spieler bleiben sichtbar größer, während inaktive Spieler kompakter bleiben.
  Technik: Die Theme-CSS-Verträge verwenden gemeinsame responsive Player-Größenvariablen, Cricket- und X01-2Player-spezifische Skalen sowie aktualisierte Template-Regressionen.
- Nutzerwirkung: Profil-Badges wie `40+` wirken in den Spieleranzeigen konsistenter und entsprechen auch in Cricket/Tactics und X01 2Player stärker der X01-Darstellung.
  Technik: Gemeinsame Badge-Styles, Cricket-Wins-Badges und X01-2Player-Profil-Badges wurden vereinheitlicht und über CSS-Vertragstests abgesichert.

### Fixed

- Nutzerwirkung: Spieler-Namen nutzen im Mehrspielermodus den vorhandenen Platz besser aus und werden nicht schon von Autodarts vorzeitig als `..`-Text übernommen, wenn vollständige Avatar-Metadaten verfügbar sind.
  Technik: Die gemeinsame Player-Card-Part-Erkennung stellt gekürzte Namen aus `title`, `aria-label` oder Avatar-`alt` wieder her, bevor CSS-Ellipsis angewendet wird.
- Nutzerwirkung: Die Punkteanzeige ist bündig zur Namens-/Badge-Zeile ausgerichtet und wird unten nicht mehr abgeschnitten.
  Technik: Der Score-Wrapper wird im Shared-Player-Grid semantisch positioniert; Line-Height, Overflow und Alignment-Anker wurden für aktive und inaktive Karten getrennt stabilisiert.

## [2.4.0] - 2026-06-17

### Changed

- Nutzerwirkung: Die Animationsmodule heißen jetzt eindeutiger nach ihrer sichtbaren Wirkung, zum Beispiel `Checkout Score Highlight`, `Checkout Target Highlights`, `Special Hit Highlights`, `Dart Marker Replacer`, `Take Out Darts Alert` und `Winner Celebration Effect`; AD xConfig, README, Feature-Übersicht und die alten README-Anker bleiben dabei konsistent erreichbar.
  Technik: Feature-Ordner, Registry, Katalog, xConfig-Descriptoren, Preview-Adapter, Screenshot-Manifeste, Tests und generierte Doku wurden auf kanonische Feature- und Config-Keys migriert; alte Feature-Keys, Config-Keys, Action-Refs und README-Anker werden über explizite Alias- und Kompatibilitätsschichten weiter aufgelöst.
- Nutzerwirkung: Effekt-Auswahlen verwenden klarere englische Werte wie `grow-glow`, `fast-blink`, `electric-jolt`, `size-pulse`, `rolling-digits` und `top-fireworks`, ohne vorhandene gespeicherte Einstellungen zu verlieren.
  Technik: Defaults, Recommended Defaults, Config-Store-Migration, Runtime-Normalizer, CSS-Klassen, Preview-Datenattribute und Regressionen wurden auf die neuen Optionswerte umgestellt; Legacy-Werte werden normalisiert und bei Konflikten gewinnt der kanonische neue Wert.

### Fixed

- Nutzerwirkung: Die xConfig-Vorschauen, Reset-/Recommended-Defaults-Aktionen und Runtime-Toggles bleiben nach der großen Umbenennung funktionsfähig und akzeptieren weiterhin alte öffentliche Referenzen.
  Technik: Runtime-Bootstrap, Feature-Registry, Config-Snapshots, xConfig-Shell-Tests, Katalogtests, Migrationsregressionen und Sonar-relevante Strukturduplizierung wurden bereinigt; `npm run verify` deckt Build, lokale Tests, SonarQube Quality Gate und Changelog-Konsistenz ab.

## [2.3.21] - 2026-06-17

### Added

- Nutzerwirkung: `Checkout Board Targets` bietet mit `Lime`, `Rose` und `Weiß` drei zusätzliche, deutlich unterscheidbare Signal-Farben; die Farbbuttons zeigen nur noch die Farbe im Button und keine Board-Miniatur mehr.
  Technik: Config-Normalisierung, Runtime-Farbpresets, xConfig-Descriptoren, Button-CSS und Struktur-Regressionen wurden um die neuen Checkout-Board-Farbthemes erweitert.

### Fixed

- Nutzerwirkung: Die Live-Vorschau von `Checkout Board Targets` bleibt nach einem Farbwechsel im geöffneten Einstellungsdialog sichtbar und muss nicht mehr durch Schließen und erneutes Öffnen des Dialogs aktualisiert werden.
  Technik: Die Shell synchronisiert Checkout-Board-Preview-Änderungen direkt nach Select-Aktionen, ersetzt dynamische Preview-Flächen stabil und schließt xConfig-Preview-SVGs aus der globalen Runtime-Board-Erkennung aus.

## [2.3.20] - 2026-06-16

### Changed

- Nutzerwirkung: `X01 Score Progress`-Effekte sind in der Konfiguration leichter vergleichbar: Die Effekt-Buttons zeigen längere Balken, `Ghost Trail` demonstriert eine echte Abnahme von `80 %` auf `15 %`, und die Hauptvorschau läuft als Prozentsequenz.
  Technik: Die xConfig-Shell nutzt einen eigenen X01-Score-Progress-Preview-Controller mit loopbaren Runtime-Hosts, hält Render-Hooks stabil und deckt Button- sowie Hauptvorschau mit Shell-Regressionen ab.
- Nutzerwirkung: `Pulse Core`, `Glass Charge` und `Ghost Trail` wirken klarer und stärker unterscheidbar; besonders Trails, Ladeglanz und Pulse-Peak sind besser wahrnehmbar.
  Technik: Runtime-Keyframes, CSS-Animationen, Glow-/Sweep-Layer und Effekt-Dauern wurden gezielt nachgeschärft; Runtime-Regressionen sichern die neuen Effektverträge und den stabilen Ghost-Trail-Cleanup ab.

## [2.3.19] - 2026-06-05

### Added

- Nutzerwirkung: `Winner Fireworks` kann die Dauer des Siegereffekts und die Partikelanzahl jetzt getrennt konfigurieren, sodass der Effekt kürzer, sparsamer oder voller laufen kann.
  Technik: Feature-Konfiguration, Runtime-Resolver, xConfig-Copy, Descriptoren und Regressionen wurden um `durationSeconds` und `particleAmount` erweitert; README und Feature-Doku beschreiben die neuen Optionen.

### Changed

- Nutzerwirkung: Checkout-Vorschläge, `X01 Score Progress`, `Dart Marker Emphasis`, Dart-Marker-Effekte und xConfig-Dialoge reagieren bei wiederholten Updates ruhiger und verursachen weniger unnötige Layout- und DOM-Arbeit.
  Technik: Checkout-Kontext und Routing verwenden wiederverwendete Snapshots, X01-Progress und Dart-Marker-Module cachen relevante DOM-/Messwerte stärker, und Mutation-/Theme-/Action-Controller filtern eigene oder irrelevante Änderungen gezielter.
- Nutzerwirkung: Bewegungsreduzierte Systeme bekommen konsistentere, weniger belastende Darstellungen für mehrere visuelle Effekte.
  Technik: Reduced-Motion-Styles wurden für Checkout-Targets, Checkout-Score-Pulse, Dart-Marker-Darts und X01-Score-Progress ergänzt und mit Regressionen abgesichert.

### Fixed

- Nutzerwirkung: Dart-Marker-Darts bleiben nach Storage-Syncs und Turn-Wechseln stabiler der richtigen Dart-Position zugeordnet.
  Technik: Runtime-Bootstrap und Dart-Marker-Darts-Synchronisierung wurden aufgeräumt und durch zusätzliche Turn-/Storage-Regressionen abgesichert.
- Nutzerwirkung: Update-Hinweise und xConfig-Dialogzustände bleiben bei Shell-Aktionen, Theme-Hintergründen und Update-Prüfungen zuverlässiger erhalten.
  Technik: Update-Check, Update-Controller, Action-Controller, Lifecycle-Controller und Theme-Background-Erkennung erhielten robustere Zustands- und Mutationstests.

## [2.3.18] - 2026-05-26

### Fixed

- Nutzerwirkung: `Theme X01 2Player (Beta)` zeigt Online-Spieler wieder vollständig an: Avatar, Länderflagge und Profil-/Average-Badge bleiben sichtbar, und Scores sowie `X01 Score Progress` werden bei verschachteltem Online-Markup stabil gerendert.
  Technik: Eine gemeinsame Player-Card-Part-Erkennung markiert Score-Wrapper, Identity-Media, Profil- und Round-Badges semantisch; X01-2Player-Policy, Theme-CSS und Score-Progress-Host-Insertion nutzen diese Marker statt fragile Chakra-Hash-Annahmen.
- Nutzerwirkung: Online-Profil-Badges wie `35+` bleiben in den Themes lesbar und kollidieren nicht mehr mit grünen Round-/Wins-Badges.
  Technik: Globale Badge-Overrides wurden auf echte Player-Display-Rollen begrenzt, X01/Cricket/Bull-Off-Regeln trennen Profil- und Round-Badges, und anonymisierte Live-DOM-Fixtures sichern Online-Spieler-Markup ab.

## [2.3.17] - 2026-05-13

### Added

- Nutzerwirkung: `Checkout Board Targets` zeigt im xConfig-Dialog jetzt Board- und Segment-Vorschauen für Darstellung, Segmentstil, Zielauswahl und Farbthema, sodass Zielmarkierungen vor dem Spiel direkt vergleichbar sind.
  Technik: Die Shell rendert Runtime-nahe Checkout-Target-SVGs mit echten Target-Styles, farbabhängigen Option-Samples und Regressionen für Board-Geometrie, Finish-Ziele und gespeicherte Select-Werte.
- Nutzerwirkung: `Checkout Score Pulse` zeigt im Dialog eine Live-Vorschau für Effekt, Farbthema, Intensität und Trigger-Quelle; Score-Mathe und Vorschlagslogik sind dadurch ohne echten Checkout sichtbar.
  Technik: Die xConfig-Preview nutzt dieselben Score-Pulse-Klassen, Style-Variablen und Effekt-Resolver wie die Runtime und deckt Effekt-, Farb- und Triggerwechsel mit Shell-Regressionen ab.

### Fixed

- Nutzerwirkung: Live-Vorschauen in geöffneten xConfig-Einstellungsdialogen aktualisieren sich nach Optionswechseln zuverlässiger, ohne den Dialog, Scrollpositionen oder Upload-Feedback zu verlieren.
  Technik: Der Shell-Renderer hält Modal-Container stabil, aktualisiert aber gezielt die dynamischen Preview-Flächen; die betroffenen Async-Render-Tests warten nun auf den tatsächlichen DOM-Refresh.
- Nutzerwirkung: README und Feature-Übersicht beschreiben die aktuellen xConfig-Optionen wieder vollständig, inklusive Demo-Aktionen für `Dart Marker Darts` und `Single Bull Sound`.
  Technik: Fehlende Descriptor-Copy für Preview-Aktionen wurde ergänzt, die generierten README-/FEATURES-Abschnitte wurden synchronisiert und SonarQube-Findings sowie CPD-Duplizierung im berührten xConfig-Scope wurden bereinigt.

## [2.3.16] - 2026-05-13

### Added

- Nutzerwirkung: Die xConfig-Einstellungsdialoge zeigen deutlich aussagekräftigere Live-Vorschauen für Animations- und Darstellungsoptionen, darunter `Turn Points Count`, `Average Trend Arrow`, `Dart Marker Emphasis`, `Dart Marker Darts`, `Single Bull Sound`, `Style Checkout Suggestions` und `X01 Score Progress`.
  Technik: Die Admin-Shell nutzt feature-spezifische Preview-Adapter, gemeinsame Preview-Verträge und Runtime-nahe DOM-Strukturen statt isolierter CSS-Dummies; neue Regressionen sichern Preview-Struktur, Lifecycle-Cleanup und Optionszuordnung ab.
- Nutzerwirkung: `Turn Points Count` zeigt in der Konfiguration echte Zähleffekte inklusive Odometer-DOM, Einzelschritten, Geschwindigkeitsvorschau und sauber getrennten Flash-Modi.
  Technik: Die Vorschau verwendet die reale CountUp-/Odometer-Adapter-Schicht, ersetzt mutierte Preview-Knoten kontrolliert und stoppt Timer, Instanzen und Flash-Klassen bei Hover-Ende, Fokuswechsel, Rerender oder Modal-Close.
- Nutzerwirkung: `Dart Marker Darts` kann seine Dart-Designs direkt im xConfig-Dialog mit einem virtuellen Marker demonstrieren; der Demo-Dart fliegt passend zur gewählten Konfiguration von rechts in das Zielsegment.
  Technik: Die Dart-Marker-Darts-Runtime stellt einen wiederverwendbaren Preview-Renderer bereit, registriert ihn in der Feature-Definition und nutzt die echten Dart-Asset- und Geometriepfade auch für die Admin-Demo.

### Changed

- Nutzerwirkung: `Average Trend Arrow` wirkt in den Größen `Standard` und `Groß` präsenter und die Konfigurationsoptionen zeigen den Pfeil jetzt direkt als Beispiel.
  Technik: Die Größenauflösung wurde für Runtime und xConfig vereinheitlicht, und die Preview nutzt dieselben Pfeilvariablen, Klassen und Richtungszustände wie die echte Oberfläche.
- Nutzerwirkung: `Style Checkout Suggestions` und `X01 Score Progress` zeigen im Dialog nicht nur Textoptionen, sondern auch Stil-, Effekt-, Größen- und Farbwirkung anhand sichtbarer Beispiele.
  Technik: Die Shell rendert Checkout-Suggestion-Beispiele sowie X01-Score-Progress-Balken mit Runtime-Klassen, Effekt-Fill-Klassen und den echten Farbvariablen aus der Feature-Logik.
- Nutzerwirkung: Die allgemeinen Farb- und Effektoptionen in xConfig sind leichter einschätzbar, weil Auswahlkarten mehr visuelles Feedback zu Paletten, Verläufen und Treffer-/Animationseffekten enthalten.
  Technik: Descriptoren, Shell-Styles und Runtime-Preview-Tests wurden um Farbpaletten, Gradient-Previews und effektbezogene Datenattribute erweitert.
- Nutzerwirkung: Keine direkte sichtbare Änderung im Userscript; die neuen Preview- und Konfigurationspfade sind wartbarer und weniger anfällig für statische Analyseprobleme.
  Technik: SonarQube-Findings im berührten Source-/Test-Scope wurden bereinigt, gemeinsame Helper wurden konsistenter verwendet und Regressionen für die betroffenen xConfig-Pfade ergänzt.

## [2.3.15] - 2026-05-11

### Fixed

- Nutzerwirkung: `X01 2 Player` hält die beiden Spieler-Spalten stabil links und rechts vom Board, auch wenn Autodarts zusätzliche Wrapper um die Spieler-Karten rendert.
  Technik: Die Theme-Policy markiert immer das direkte Kind von `#ad-ext-player-display` als Grid-Wrapper und eine Runtime-Regression bildet verschachtelte Player-Card-DOMs ab.
- Nutzerwirkung: `X01 2 Player` greift nicht mehr während eines vorgeschalteten Bull-off ein; in dieser Phase bleibt das Bull-off-Layout zuständig.
  Technik: Die gemeinsame Theme-Variantenerkennung priorisiert die sichtbare DOM-Phase vor dem Match-Snapshot und eine Runtime-Regression deckt `Bull-off` mit gleichzeitigem `501`-Snapshot ab.

## [2.3.14] - 2026-05-10

### Changed

- Nutzerwirkung: Die xConfig-Oberfläche bleibt bei Navigations- und Layoutwechseln zuverlässiger am richtigen Inhaltsbereich angedockt und synchronisiert ihren Menüeintrag stabiler mit Autodarts.
  Technik: Die Shell bewertet Navigation, Content-Flächen und Shell-Mutationen über gemeinsame Layout-Utilities, ignoriert eigene Panel-Knoten bei der Relevanzprüfung und deckt die Routing-/Mutationserkennung mit Runtime-Regressionen ab.

### Fixed

- Nutzerwirkung: `TV Board Zoom` hält aktive Zoom-Transformationen stabiler, auch wenn Board- oder Zielknoten erneut ausgewertet werden; vorhandene wichtige Inline-Styles werden beim Ein- und Auszoomen sauberer erhalten.
  Technik: Die Zoom-Logik erkennt bereits angewendete Transform-Signaturen, speichert Style-Werte inklusive Priorität und erweitert den Fake-DOM sowie Layout-Regressionen für Transform-/Priority-Verhalten.
- Nutzerwirkung: Eigene `Templates Global`-Dart-Stile greifen nur noch auf echte Turn-Darts im Wurffeld und verfälschen keine Checkout-Vorschlagskarten mehr.
  Technik: Die Global-Typography-Selektoren sind auf direkte `#ad-ext-turn > .suggestion`-Dartbilder begrenzt und Regressionen prüfen die Abgrenzung zu `Style Checkout Suggestions`.
- Nutzerwirkung: `X01 2 Player` gibt Score-, Turn- und Header-Flächen etwas mehr Luft, sodass Werte in dichten Layouts weniger gedrängt wirken.
  Technik: Theme-Policy und CSS erweitern die Breathing-Room-Regeln für Spielerflächen, initiale Turn-Summen und Throw-Werte; Template-/Policy-Regressionen sichern die neuen Größen- und Layoutverträge ab.

## [2.3.13] - 2026-05-09

### Fixed

- Nutzerwirkung: `X01 2 Player` bleibt in engeren Layouts und bei wechselnden Spieler-/Turn-Flächen lesbarer: Spielernamen, Kopfzeilen, Tabellen, Turn-Punkte und veraltete Reststände passen sich stabiler an, und die Board-Steuerung bleibt oberhalb des Dart-Overlays sichtbar und klickbar.
  Technik: Das Theme normalisiert gemeinsame Spielernamen- und Scoreboard-Zustände mit zusätzlichen CSS-Variablen, markiert alte Reststände semantisch, hält die Autodarts-Board-Fläche sichtbar und spiegelt die Board-Controls in ein positioniertes Portal; Runtime-, Template- und Build-Regressionen sichern Layout-, Portal- und Versionsverträge ab.

## [2.3.12] - 2026-05-05

### Changed

- Nutzerwirkung: `X01 Score Progress` reagiert weiterhin auf Score-, Player- und Turn-Änderungen, bleibt bei fremden Menü- oder UI-Änderungen außerhalb des X01-Matchbereichs aber ruhiger.
  Technik: Die lokale Mutation-Relevanzprüfung normalisiert Textknoten auf ihren Element-Kontext und wertet generische `button`-, `span`- und `p`-Targets nur noch innerhalb von `#ad-ext-player-display` oder `#ad-ext-turn` als relevant; eine fokussierte Runtime-Regression deckt externe generische Targets, Score-/Turn-Textknoten und relevante Subtrees ab.

## [2.3.11] - 2026-05-03

### Added

- Nutzerwirkung: `Templates Global` kann die drei Darts im Wurffeld jetzt durch ein eigenes Bild, farbige oder verlaufende Dart-Grafiken oder nummerierten Text wie `Wurf 1`, `Wurf 2` und `Wurf 3` ersetzen. Hochgeladene Dart-Bilder werden in der Konfiguration als Vorschau angezeigt und verschwinden dort wieder, wenn sie entfernt werden.
  Technik: Die globale Typography-Konfiguration erhält `turnDart*`-Felder für Stil, Texttemplate, Farben, Größe und Upload-Data-URL; die xConfig-UI rendert Upload-, Clear-, Status- und Textfeld-Steuerung, während Runtime-Styles die Priorität Bild vor Text vor Farbe/Verlauf per CSS-Content, Background-Rendering und Counter-Text abbilden.

### Changed

- Nutzerwirkung: Transparente oder quadratische Dart-Bilder wirken im Wurffeld deutlich größer und die Größenstufe `Groß` ist zusätzlich um 25 Prozent präsenter.
  Technik: Dart-Uploads nutzen die gemeinsame Bildnormalisierung mit transparentem Trimming, hochgeladene Bilder werden als zentrierte Backgrounds dargestellt, und die große Wurffeld-Dart-Renderstufe skaliert den bisherigen `135`-Wert mit einem zusätzlichen `1.25`-Faktor.

## [2.3.10] - 2026-05-01

### Added

- Nutzerwirkung: Neue und geänderte Dart-Bilder können künftig reproduzierbar auf denselben Spitzenpunkt gebracht werden, statt die Treffpunkt-Ausrichtung per Hand prüfen zu müssen.
  Technik: `npm run check:darts` und `npm run normalize:darts` prüfen und normalisieren `src/assets/darts/Dart_*.png` über den Alpha-Kanal, ein neuer Repo-Skill `dart-asset-normalization` beschreibt den Wartungsablauf, und `docs/DART-ASSET-NORMALIZATION.md` dokumentiert Hotspot-Vertrag, Script-Verhalten und Prüfschritte.

### Changed

- Nutzerwirkung: `Dart Marker Darts` zeigt alle Größenstufen um 20 Prozent größer an; `Klein`, `Standard` und `Groß` verwenden jetzt intern `108`, `120` und `138`, wodurch die Dart-Grafiken auf dem Board präsenter wirken.
  Technik: Config-Spec, Runtime-Resolver und xConfig-Deskriptoren verwenden die neuen Presets, alte gespeicherte Werte `90`, `100` und `115` migrieren proportional auf `108`, `120` und `138`, und Runtime-/Config-/Shell-Regressionen sichern Defaults, Legacy-Import und UI-Optionen ab.

### Fixed

- Nutzerwirkung: Die Spitzen aller gebündelten Dart-Motive landen jetzt konsistent auf dem Markerzentrum, unabhängig davon, welches Dart-Design ausgewählt ist.
  Technik: Alle Dart-PNGs wurden auf eine gemeinsame `789x331`-Canvas mit Hotspot `x=0`, `y=212` normalisiert, die Runtime-Geometrie nutzt diese Quelle als gemeinsamen Anker, und Asset-/Overlay-Tests sichern Bildmaße, Hotspot-Konstanten und Render-Mapping ab.

## [2.3.9] - 2026-05-01

### Added

- Nutzerwirkung: `Dart Marker Darts` bietet elf zusätzliche Dart-Designs und zeigt sie in der xConfig-Auswahl ganz oben an, darunter `AI Replicant`, `Bullet`, `German Giant`, `Mandalorian`, `Nuke`, `Phil Taylor`, `Snakebite`, `Standard`, `Standard Yellow`, `Standard Yellow 2` und `Ultramarine`.
  Technik: Die neuen PNG-Assets sind im zentralen Dart-Manifest und Browser-Asset-Bundle registriert, die Config-Normalisierung verwendet die Manifest-Keys als gültige Designliste, und README-/Feature-Doku sowie Runtime-Regressionen decken Manifest-Vollständigkeit und UI-Reihenfolge ab.

## [2.3.8] - 2026-04-30

### Fixed

- Nutzerwirkung: `TV Board Zoom` fokussiert bei Single-Player-X01 nach einem komplett verfehlten Checkout-Besuch wieder automatisch das gleiche Checkout-Doppel, statt nach dem kurzen Auszoomen dauerhaft ausgezoomt zu bleiben.
  Technik: Die TV-Zoom-Intent-Logik speichert den zuletzt gesehenen aktiven X01-Score und unterscheidet einen Throwcount-Reset nach einem vollständigen Besuch von echten manuellen Wurfkorrekturen; eine neue Runtime-Regression sichert den `D7`-Miss-Fall mit instabiler Single-Player-Turn-ID ab.

## [2.3.7] - 2026-04-30

### Changed

- Nutzerwirkung: Cricket- und Tactics-Overlays reagieren bei Spielerwechseln und Turn-Aktualisierungen unverändert, vermeiden dabei aber unnötige Grid-Neusuchen und sollten auf realen Autodarts-DOM-Zuständen ruhiger laufen.
  Technik: Die gemeinsame Cricket-Surface-Runtime erhält den gecachten Grid-Snapshot bei nicht-gridbezogenen Player-/Turn-Mutationen, invalidiert ihn weiterhin bei Grid-, Ziel-, Mark- oder Variant-Änderungen, und neue Runtime-Regressionen sichern Cache-Reuse sowie Grid-Mark-Rediscovery ab.

## [2.3.6] - 2026-04-29

### Fixed

- Nutzerwirkung: `Checkout Board Targets` hebt bei X01-Checkout-Routen mit `DBULL` wieder das nächste sichtbare Bullseye-Ziel hervor, statt nach einem bereits angezeigten Folgeschritt wie `D16` auf den falschen Restscore umzuschalten.
  Technik: Die X01-Checkout-Parser erkennen `DBULL` jetzt als Bullseye-Segment, die gemeinsame Checkout-Route bevorzugt vorhandene `CHECKOUT`-markierte Vorschlagskarten gegenüber früheren Wurf-Suggestions, und neue Domain-/Runtime-Regressionen sichern `DBULL -> D16` inklusive nachlaufendem Game-State ab.

- Nutzerwirkung: Keine sichtbare Änderung im Userscript; lokale Validierung nutzt SonarQube jetzt verlässlicher über den konfigurierten Server, statt den Server fälschlich als nicht verfügbar zu melden, wenn nur Shell-Variablen fehlen.
  Technik: `npm run sonar` lädt `SONARQUBE_URL` und `SONARQUBE_TOKEN` aus der Umgebung oder aus `~/.codex/config.toml`, führt die bestehende Server-Konfiguration aus und startet die Analyse über `sonar-scanner`, Docker oder `npx sonarqube-scanner`; `npm test` hängt SonarQube jetzt an die lokalen Tests an, während `npm run test:local` nur für ausdrücklich Sonar-irrelevante lokale Checks bleibt.

## [2.3.5] - 2026-04-27

### Fixed

- Nutzerwirkung: `Turn Points Count` zählt Turn-Punkte jetzt deutlich gleichmäßiger wie eine Anzeigetafel hoch oder herunter; ein T20-Treffer kann per `Fließend`, `Odometer` oder `Einzelschritte` animiert werden, und die xConfig-Geschwindigkeiten laufen für `Schnell`, `Standard` und `Ruhig` über `1`, `3` und `5` Sekunden.
  Technik: `CountUp.js` und das optionale `odometer_countup`-Plugin werden als vendored Browser-Skripte eingebunden, Odometer wird nur bei gewähltem Stil lazy geladen, die Legacy-Dauerwerte migrieren auf `1000`, `3000` und `5000` ms, und Runtime-/Config-/Shell-Regressionen sichern CountUp-Easing, Plugin-Verdrahtung, Fallback-Schrittzählung, Migration und xConfig-Persistenz ab.

## [2.3.3] - 2026-04-25

### Fixed

- Nutzerwirkung: Im Cricket-Template bleibt die Punkteanzeige pro Spieler stabiler sichtbar, auch wenn Autodarts einzelne Spielerkarten oder Score-Wrapper waehrend des Spiels neu aufbaut; besonders Karten ab der zweiten Spalte verlieren den Score dadurch nicht mehr bis zum naechsten Reload.
  Technik: Die Cricket-Readability-Normalisierung markiert direkte Score-Knoten und gewrappte Score-Container als eigenen `score`-Slot, das Cricket-Theme richtet diesen Slot unabhaengig von der aktuellen Host-DOM-Form im Spieler-Grid aus, und neue Runtime-Regressionen sichern gewrappte Reported-Player-Scores sowie den CSS-Slot-Vertrag ab.

## [2.3.2] - 2026-04-24

### Changed

- Nutzerwirkung: `Templates Global` wirkt im Themes-Tab jetzt ruhiger und verständlicher; die kleine Detailbox mit Schrift, Geltungsbereich, Priorität und Rolle entfällt, der Beschreibungstext erklärt die gemeinsame Basis für unterstützte Themes klarer, und die Bereichsauswahl zwischen `Themen` und `Animationen` ist mit sichtbarer Überschrift, klarerer Tab-Hervorhebung und standardnaher Tab-Semantik leichter zu erkennen.
  Technik: Die xConfig-Shell entfernt die spezielle Summary-Grid-Logik samt Override-Badge für `theme-global-typography`, zieht die Kartenbeschreibung in präzisere Copy um, rendert die Hauptnavigation als `tablist` mit `tab`/`tabpanel`-Semantik inklusive `aria-selected` und Intro-Text, und erweitert die Runtime-Regressionen gezielt für Badge-/Copy-, Tab- und A11y-Verträge.

- Nutzerwirkung: Keine sichtbare Funktionsänderung; die xConfig-Shell verhält sich weiter wie in `2.3.2`, trägt ihre gemeinsamen Shell-Styles intern aber nicht mehr doppelt.
  Technik: `shell-view` entfernt den versehentlich duplizierten Inline-CSS-Block und die dazugehörigen ungenutzten Konstanten, sodass die gemeinsame Shell-Optik nur noch aus `shell-style.js` stammt und SonarQube keine neue Duplikation mehr auf diesem Pfad meldet.

## [2.3.1] - 2026-04-24

### Changed

- Nutzerwirkung: `Checkout Score Pulse` bleibt bei X01-Themes jetzt auch dann zuverlässig am richtigen Spieler-Score, wenn Autodarts Spielerflächen oder Score-Knoten während des Turns austauscht; `Turn Points Count` beobachtet nur noch die relevante Turn-Fläche und verursacht dadurch weniger unnötige DOM-Arbeit.
  Technik: Ein geteilter `x01-player-surface-adapter` normalisiert Spielerflächen, Score-Knoten und Mutation-Signaturen für X01-Features; `checkout-score-pulse` nutzt diese Oberfläche für remount-stabile Score-Pulse, `turn-points-count` scoped seinen Observer auf die Turn-Surface, und neue Runtime-Regressionen sichern Surface-Austausch, Score-Mutation und Observer-Scope ab.

- Nutzerwirkung: Keine sichtbare Änderung im Userscript; die Agent-/Skill-Anweisungen für Wartung und Release sind klarer getrennt und werden beim lokalen Check robuster validiert.
  Technik: Deprecated Skill-Dateien wurden durch fokussierte Analyse-, Changelog-, Release- und Validierungs-Skills ersetzt; `scripts/check-agent-instructions.mjs` prüft referenzierte Skill-Dateien mit, und `check:agents` ist als npm-Script verdrahtet.

- Nutzerwirkung: Keine sichtbare Änderung; die SonarQube-Nachprüfung für die 2.3.1-Änderungen ist jetzt ohne neue Reliability-Issues und ohne neue unreviewed Security Hotspots sauber.
  Technik: `x01-player-surface-adapter` vermeidet den direkten `.map(...)`-Callback auf `toPlayerEntry`, und `check-agent-instructions` ersetzt die beanstandeten Regex-/Replace-Pfade durch stringbasierte Normalisierung, Quote-Trimming und deterministisches Regex-Escaping ohne globalen Hotspot-Parser.

## [2.3.0] - 2026-04-21

### Changed

- Nutzerwirkung: `Templates Global` hebt sich im Themes-Tab jetzt klarer von den eigentlichen Theme-Kacheln ab und erscheint als breite, globale Steuerzentrale mit kompaktem Überblick zu Schrift, Geltungsbereich, Priorität und Rolle der Vorlagenlogik.
  Technik: `theme-global-typography` rendert in der xConfig-Shell jetzt als eigene Hero-Kachel mit `Global`-/Override-Badges, responsivem Summary-Grid und synchronisierten Statuswerten nach Preset- und Select-Änderungen; dazu wurden Shell-View, Shell-Styles, Controller-Pfade und die Shell-Regressionen gezielt erweitert.

## [2.2.0] - 2026-04-20

### Added

- Nutzerwirkung: Im Themes-Tab steht jetzt `Theme Gotcha` als eigene, an `Theme X01` orientierte Variante bereit; die Spieler-Karten übernehmen den X01-Look und blenden zusätzlich die Gotcha-Differenz aus dem aktivierten `Gotcha Helper` der `Tools für Autodarts` ein. Für die Hilfszeile lassen sich Platzierung unter dem Score oder in der Score-Zeile, Ausrichtung links/rechts sowie Kursivstil konfigurieren, und Segmentangaben wie `D20`, `T20`, `S20` oder `Bull` werden direkt als signierte Punktewerte wie `+40`, `+60`, `+20` oder `+50` dargestellt.
  Technik: `theme-gotcha` wurde als neues Theme-Feature mit eigener Registry-, Theme-Key-, Background-, Preview- und xConfig-Verdrahtung auf Basis der X01-Shared-Player-Cards integriert; eine Runtime-Policy normalisiert die Shadow-DOM-Ausgabe von `autodarts-tools-gotcha`, hält Hilfstext und Italic-Styling auch bei Host-Rerenders stabil und ergänzt dafür neue Lifecycle-, Policy-, Config-, CSS- und Doku-Regressionen.

### Fixed

- Nutzerwirkung: Die Inline-Darstellung der Gotcha-Differenz bleibt in der Score-Zeile jetzt sauber an der Punkteanzeige ausgerichtet und wirkt etwas zurückhaltender; je nach Ausrichtung erscheint sie als `Differenz | Score` oder `Score | Differenz`, ohne an Badge- oder Namensblöcke anzudocken.
  Technik: Das Inline-Layout des neuen Themes nutzt feste Grid-Slots für Identität, Meta, Score-Zone und X01-Progress statt impliziter Auto-Placement-Reihenfolge, die Delta-Zeile arbeitet mit angepasster Opacity und eigener Trenner-Logik, und die Theme-Parity- sowie Lifecycle-Regressionen sichern Reihenfolge, Slot-Aufteilung und Stilwerte gegen Drift ab.

- Nutzerwirkung: `Average Trend Arrow` respektiert die konfigurierte Pfeilgröße im normalen Shared-Player-Card-Layout jetzt wieder sichtbar, statt durch das Theme immer auf eine feste Basisgröße gezogen zu werden.
  Technik: Das Feature exportiert seine Preset-Größen jetzt als CSS-Variablen direkt am Pfeil, und das Shared-Player-Card-Layout skaliert diese Basiswerte nur noch weiter über `--ad-ext-stat-scale`, statt Margin- und Border-Geometrie mit eigenen festen Pixelwerten zu überschreiben; neue Runtime-Regressionen sichern Variablenübergabe und Theme-Skalierung gegen Drift ab.

## [2.1.31] - 2026-04-20

### Added

- Nutzerwirkung: `Templates Global` bietet jetzt sieben Preset-Aktionen (`Classic`, `Broadcast`, `British Flag`, `Cyberpunk`, `Matrix`, `Fire`, `Ice`), die Schrift, Farbrollen und den globalen Hintergrund mit einem Klick setzen; Themes ohne eigenes Bild nutzen dabei direkt das jeweilige Preset-Wallpaper als sichtbares Fallback und Vorschau.
  Technik: Neue Preset-Definitionen samt Asset-Manifest und Browser-/Node-Auflösung verdrahten `backgroundAssetKey` als normalisierte `themes.globalTypography`-Konfiguration; xConfig rendert dafür einen eigenen Presets-Bereich mit Bestätigungsdialog, Status-/Kartenvorschau und Runtime-Speicherung, und neue Runtime-, Shell- und Theme-Regressionen sichern Upload-vs.-Preset-Priorität, Reset-Verhalten sowie Asset-Fallbacks gegen Drift.

### Fixed

- Nutzerwirkung: In `Theme X01 2Player` blockieren zusätzliche Host-Blöcke oder leere Overlay-Flächen die Standardbuttons am Board nicht mehr; Schaltflächen wie `Stoppen`, `Zurücksetzen`, `Menü`, `Einstellungen` und das Zahnrad bleiben dadurch wieder klickbar.
  Technik: Das Theme markiert und layoutet im `#ad-ext-player-display` nur noch echte Spieler-Wrapper mit expliziten Wrapper-/Index-Attributen, statt pauschal alle direkten Kindknoten zu behandeln; zusätzlich zählt der DOM-Fallback für die 2-Spieler-Aktivierung nur noch sichtbare Player-Container. Die zentrale Board-Spalte (`.ad-ext-theme-content-board`) und `#ad-ext-turn` wurden außerhalb ihrer echten Inhalte klickdurchlässig gemacht, damit weder Host-DOM-Drift noch leere Overlay-Zonen Header-Buttons abfangen; neue X01-2Player-Style- und Lifecycle-Regressionen sichern diese Pfade gegen Drift ab.

- Nutzerwirkung: Keine beabsichtigte sichtbare Verhaltensänderung; der geteilte Electric-Border-Defs-Cleanup bleibt kompatibel zu bestehenden Runtime- und Testumgebungen, räumt den letzten verbleibenden Sonar-Restpunkt jetzt aber ohne den alten `removeChild(...)`-Pfad auf.
  Technik: `electric-border-engine` entfernt das gemeinsame SVG-Defs-Node beim letzten Release-Schritt jetzt bevorzugt über `remove()` und fällt bei überschatteten Instanzmethoden auf den prototypbasierten `remove`-Aufruf zurück, statt einen separaten `parentNode.removeChild(...)`-Zweig zu halten; die vorhandenen Runtime-Regressionen sichern Refcount-, Cleanup- und Defs-Parität dabei weiter gegen Drift ab.

- Nutzerwirkung: Keine beabsichtigte sichtbare Verhaltensänderung; `cricket-grid-fx` und `triple-double-bull-hits` laufen in dieser Sonar-Welle weiter auf denselben Grid-, Delta-, Badge-, Burst- und Hit-Dekorationspfaden, drücken ihre großen internen Auswahlschleifen und Animations-Dispatcher aber klarer getrennt aus.
  Technik: `cricket-grid-fx/logic` zieht Zell-Descriptor-Selektion, Badge-/Label-Bindung sowie Row-Anwendung in explizite Helper, ohne Grid-Discovery-, Stable-Row-, Delta-, Wave- oder Merged-Owner-Semantik zu ändern; `triple-double-bull-hits/logic` ersetzt den großen Burst-Timeline-Switch durch stylebasierte Step-Builder und bereinigt rein mechanische Guard-Pfade per Optional-Chaining, sodass Throw-Klassifikation, Burst-Animationen und Dataset-/Role-Verträge fachlich unverändert bleiben. Die bestehenden Cricket- und Hit-Regressionen bleiben dabei der Schutz gegen Drift.

- Nutzerwirkung: Keine beabsichtigte sichtbare Verhaltensänderung; xConfig-Shell und TV-Board-Zoom laufen in dieser Sonar-Welle weiter auf denselben fachlichen Verträgen, trennen interne Options-, Lifecycle- und Intent-Pfade aber klarer.
  Technik: `xconfig-ui/action-controller`, `lifecycle-controller` und `render-controller` ziehen ihre lange Options-Normalisierung in kleine Context-Builder, und `tv-board-zoom/computeZoomIntent(...)` zerlegt Boundary-/Turn-Reset, Checkout-Kontext, Sticky-/Manual-Pause-Logik sowie Intent-Auswahl in explizite Helfer, ohne die öffentlichen Controller-APIs oder die Checkout-/Setup-/Hold-Semantik umzubauen; die bestehenden Shell-, Action- und TV-Zoom-Regressionen bleiben dabei der fachliche Schutz gegen Drift.

- Nutzerwirkung: Keine beabsichtigte sichtbare Verhaltensänderung; xConfig-Themenaktionen, Cricket-Highlighting und Dart-Marker-Darts laufen fachlich weiter auf denselben Pfaden, drücken in dieser Sonar-Welle aber einige kleine Guard- und Debug-Signaturen direkter aus.
  Technik: `xconfig-ui/shell-view` ersetzt den letzten verschachtelten Hintergrundbild-Hinweis durch einen kleinen Action-Text-Helper, `cricket-highlighter` bereinigt einen lokalen Shape-Guard per Optional-Chaining, und `dart-marker-darts` bündelt zwei rein interne Debug-/Geometrie-Signaturen auf kleine Objektparameter statt 8-Parameter-Helfer; die bestehenden Shell-, Cricket- und Dart-Marker-Regressionen bleiben dabei der fachliche Schutz gegen Drift.

- Nutzerwirkung: Keine beabsichtigte sichtbare Verhaltensänderung; die xConfig-Shell reagiert weiterhin gleich auf Menü-, Settings-, Update- und Lifecycle-Aktionen, drückt die internen Controller-Pfade in dieser Sonar-Welle aber klarer getrennt aus.
  Technik: `xconfig-ui/action-controller`, `render-controller` und `lifecycle-controller` ziehen ihre lokalen Action-, Render- und Lifecycle-Helfer in äußere Hilfsfunktionen, bereinigen dabei einen verschachtelten Select-Ternary und lassen die öffentliche Controller-API sowie das bestehende Event-, Queue-, Modal- und Teardown-Verhalten unverändert; die vorhandenen Action- und Shell-Regressionen bleiben dabei der Schutz gegen Drift.

- Nutzerwirkung: Keine beabsichtigte sichtbare Verhaltensänderung; die geteilten Theme-Layout- und Cricket-Readability-Pfade verhalten sich weiter wie bisher, drücken kleine DOM- und Mess-Guards intern aber direkter aus.
  Technik: `board-layout-resolver` und `cricket-readability` bereinigen in dieser Sonar-Welle nur lokale `S6582`-Treffer per Optional-Chaining und bündeln die interne Messsignatur von `measureCricketRequiredPlayerWidth(...)` in `cricket-readability` auf ein kleines Optionsobjekt, ohne die Layout-Auflösung, Board-Hide-Policy oder die Readability-Messschleife fachlich umzubauen; die bestehenden Theme-Lifecycle- und Cricket-Readability-Regressionen bleiben dabei der Schutz gegen Drift.

- Nutzerwirkung: Keine beabsichtigte sichtbare Verhaltensänderung; eine breitere Low-Risk-Sonar-Welle hält Checkout-Board, Cricket-Surface, Theme-/Runtime-Helfer und xConfig-Randpfade auf denselben fachlichen Verträgen, drückt kleine Guard-, Logger- und Auswahlzweige intern aber direkter aus.
  Technik: `checkout-board-targets`, `turn-surface-adapter`, `cricket-surface/*`, `cricket-highlighter/style`, `dart-marker-emphasis`, `theme-utils`, `bootstrap-runtime`, `checkout-score-pulse`, `layout-utils` und `render-controller` bereinigen nur lokale `S3358`- und `S6582`-Treffer durch kleine Helper und Optional-Chaining-Guards, ohne Observer-, Render-, Overlay-, Route- oder Runtime-Semantik umzubauen; die bestehenden Runtime-, Cricket-, Checkout- und Shell-Regressionen bleiben dabei der fachliche Schutz gegen Drift.

- Nutzerwirkung: Keine beabsichtigte sichtbare Verhaltensänderung; TV-Board-Zoom und die Browser-Asset-Auflösung bleiben fachlich unverändert, drücken interne Übergabe- und Reexport-Pfade in dieser Sonar-Welle aber direkter aus.
  Technik: `tv-board-zoom/applyZoom(...)` bündelt die drei internen Knotenparameter jetzt in ein kleines Objekt statt über eine 8-Parameter-Signatur, alle direkten Layout-Regressionen wurden auf dieselbe interne Form umgestellt, und `feature-assets.browser` exportiert die zwei Asset-Bindings nun direkt per `export ... from` ohne zusätzlichen Alias-Zwischenschritt; Zoom-Transform-, Host-Overflow- und Asset-Konsumentenpfade bleiben dabei unverändert der fachliche Vertrag.

- Nutzerwirkung: Keine beabsichtigte sichtbare Verhaltensänderung; eine weitere kleine Sonar-Welle hält Update-Status, Winner-Animation, TV-Zoom, Cricket-Snapshot-Cache sowie ausgewählte xConfig-Helfer auf denselben fachlichen Pfaden, drückt einige Status- und Auswahlzweige intern aber direkter aus.
  Technik: `update-check`, `winner-fireworks`, `tv-board-zoom`, `cricket-surface/snapshot-cache`, `x01-2player/policy`, `xconfig-ui/path-utils` und `shell-view` bereinigen nur lokale `S3358`-, `S1788`- und `S7766`-Treffer durch kleine Helper und unveränderte Fallback-Pfade; Observer-, Snapshot-, Select- und Update-Semantik bleiben dabei gleich, und die bestehenden Runtime-, Domain- und Changelog-Regressionen bleiben der fachliche Schutz gegen Drift.

- Nutzerwirkung: Keine beabsichtigte sichtbare Verhaltensänderung; Theme-Mounting, Checkout-Board-Ziele sowie die Cricket-Wrapper für Highlighting und Grid-FX laufen auf denselben fachlichen Pfaden weiter, sind intern aber in dieser Sonar-Welle klarer in Status- und Aktivierungsblöcke getrennt.
  Technik: `mount-theme-feature`, `checkout-board-targets`, `cricket-highlighter` und `cricket-grid-fx` ziehen kleine Aktivierungs-, Renderstatus- und Nicht-Ready-Statuspfade jetzt in lokale Helper; `mount-theme-feature` kapselt zusätzlich Theme-Evaluator und Mutation-Callback in eigene lokale Fabriken, ohne öffentliche Signaturen oder die beobachtbare Overlay-/Lifecycle-Semantik zu ändern. Die bestehenden Theme-, Lifecycle-, Runtime-Performance- und Degraded-Host-Regressionen sichern diese Wrapper-Refactors gegen Drift ab.

- Nutzerwirkung: Keine beabsichtigte sichtbare Verhaltensänderung; ausgewählte Board-, Sweep- und Trend-Animationen sowie der interne Changelog-Check laufen auf denselben fachlichen Pfaden weiter, sind aber in dieser Sonar-Welle klarer und direkter ausgedrückt.
  Technik: Die vier `void`-basierten Reflow-Trigger in `average-trend-arrow`, `turn-start-sweep` und `cricket-grid-fx` verwenden jetzt explizite lokale Reflow-Helfer statt des `void`-Operators, das kleine `S3776` in `scripts/check-changelog-consistency.mjs` wurde nur durch lokale Helper-Aufteilung reduziert, und neue direkte Runtime-Tests sichern die Re-Trigger-/Cleanup-Verträge der Sweep- und Trend-Animationen auf dem Fake-DOM gegen Drift ab.

- Nutzerwirkung: Keine beabsichtigte sichtbare Verhaltensänderung; die Board-SVG-Erkennung verarbeitet `viewBox`-Werte weiterhin identisch, drückt eine rein mechanische String-Normalisierung aber direkter aus.
  Technik: In `dartboard-svg` wurde ein einzelner Sonar-Reliability-Treffer (`S7781`) mit dem kleinstmöglichen Diff bereinigt, indem die feste Komma-Ersetzung von einer Regex-Variante auf `replaceAll(\",\", \" \")` umgestellt wurde; die bestehende Runtime-Abdeckung für ViewBox-Parsing und Board-Erkennung bleibt dabei unverändert der fachliche Schutz.

- Nutzerwirkung: Keine beabsichtigte sichtbare Verhaltensänderung; die nächste sichere Sonar-Welle hält `Triple/Double/Bull Hits` bei denselben Throw-, Burst- und Korrekturpfaden, räumt interne Dekorations-Metadaten aber konsequent auf moderneren DOM-Zugriff um.
  Technik: In `triple-double-bull-hits/logic` wurden die verbliebenen mechanischen `dataset`- und Optional-Chaining-Treffer lokal ersetzt, ohne Signaturen oder Ablaufsteuerung zu ändern; die bestehenden Runtime-Regressionen prüfen jetzt zusätzlich, dass Theme-/Burst-Metadaten beim Setzen und Löschen der Hit-Dekoration weiterhin korrekt über `dataset` und Attributspiegelung synchron bleiben.

- Nutzerwirkung: Keine beabsichtigte sichtbare Verhaltensänderung; eine weitere Low-Risk-Welle strafft ausgewählte Utility-, Theme- und Runtime-Helfer, ohne Board-Erkennung, Remove-Darts-Overlay, Turn-Sweep, X01-2Player oder Event-/Bootstrap-Verhalten fachlich umzubauen.
  Technik: Kleine `S6582`-Bereinigungen in `dartboard-svg`, `dartboard-markers`, `remove-darts-notification`, `average-trend-arrow`, `turn-start-sweep`, `x01-2player`, `layout-utils`, `dart-marker-darts` sowie einzelnen Core-/Runtime-Helfern ersetzen nur triviale Guard-Muster durch äquivalentes Optional Chaining; die bestehenden Runtime-, Theme-, Utility- und Lifecycle-Regressionen sichern diese Pfade weiter gegen Drift ab.

- Nutzerwirkung: Keine beabsichtigte sichtbare Verhaltensänderung; eine weitere sichere Sonar-Welle modernisiert ausgewählte X01-, TV-Zoom- und xConfig-UI-Helfer, ohne Checkout-Logik, Score-Progress, Shell-Verhalten oder Theme-Uploads fachlich umzubauen.
  Technik: In `x01-score-progress`, `x01-checkout-context`, `x01-checkout-route`, `tv-board-zoom`, `render-controller`, `action-controller`, `style-checkout-suggestions` und `theme-background` wurden nur mechanische `dataset`-, `after(...)`- und Optional-Chaining-Bereinigungen aus der Low-Risk-Gruppe umgesetzt; die bestehenden Runtime-, Shell-, TV-Zoom- und X01-Regressionen sichern diese Pfade weiter gegen Drift ab.

- Nutzerwirkung: Keine beabsichtigte sichtbare Verhaltensänderung; Loader-Start, X01-/Cricket-Helfer, Theme-Bildstatus und kleinere xConfig-Textbausteine laufen in dieser Sonar-Welle auf denselben fachlichen Pfaden weiter, sind intern aber direkter und wartbarer ausgedrückt.
  Technik: `loader/autodarts-xconfig.user.js`, `game-state-store`, `feature-path-utils`, `x01-rules`, `cricket-rules`, `x01-checkout-route`, `theme-background`, `xconfig-ui/copy`, `xconfig-ui/index`, `dartboard-svg`, `electric-border-engine` und `scripts/check-changelog-consistency.mjs` bereinigen nur kleine `S6582`-, `S3358`-, `S1788`-, `S7766`-, `S1126`-, `S4138`-, `S4144`-, `S4624`-, `S7762`- und `S7784`-Treffer, ohne öffentliche Signaturen, DOM-/Observer-Abläufe oder die fachliche X01-/Cricket-Semantik umzubauen; die bestehenden Domain-, Runtime- und Changelog-Regressionen bleiben dabei der fachliche Schutz gegen Drift.

- Nutzerwirkung: Keine beabsichtigte sichtbare Verhaltensänderung; eine weitere kleine Sonar-Welle hält Cricket-Label-Erkennung, Checkout-Hinweise und Theme-Bildstatus auf denselben fachlichen Pfaden, liest interne Datenattribute aber direkter und konsistenter aus.
  Technik: `label-layout`, `style-checkout-suggestions` und `theme-background` verwenden ausgewählte `data-*`-Felder jetzt über `dataset` statt über manuelle Attribut-Lese-/Schreibzugriffe; neue gezielte Runtime-Regressionen sichern explizite Cricket-Mark-Hints, Checkout-Label-Reset und die Theme-Bildstatus-Metadaten gegen Drift ab.

- Nutzerwirkung: Keine beabsichtigte sichtbare Verhaltensänderung; eine weitere Low-Risk-Sonar-Welle modernisiert interne Datenattribut-, Menü- und Overlay-Helfer, ohne Cricket-, X01-, xConfig- oder Theme-Abläufe fachlich umzubauen.
  Technik: Mehrere Runtime- und UI-Pfade lesen und schreiben `data-*`-Felder jetzt konsistent über `dataset`, kleine Klarheitsrefactors glätten optionale Config-/Legacy-Zweige sowie einzelne DOM-Einfügepfade, `electric-border-engine` nutzt im Fallback wieder korrekt `parentNode.removeChild(...)`, und der Fake-DOM plus gezielte Runtime-Regressionen sichern `dataset`-/`before`-/`after`-Semantik sowie den Defs-Cleanup gegen Drift ab.

- Nutzerwirkung: Keine beabsichtigte sichtbare Verhaltensänderung; mehrere kleine Sonar-getriebene Bereinigungen halten Runtime-, xConfig-, Theme- und Testpfade auf moderneren Standard-APIs, ohne die Fachlogik der Module sichtbar umzubauen.
  Technik: Niedrigrisiko-Refactorings vereinheitlichen `Object.hasOwn(...)`, `globalThis.window`, `Number.NaN`, `replaceAll(...)`, `String.raw`, `.at(...)` und einzelne Re-exports/Import-Aufräumer; dazu wurden nur eng begrenzte Test- und Helper-Anpassungen ergänzt, damit Sortierungen, Regex-Helfer, DOM-Klassenlisten und Changelog-/Build-Checks weiter stabil gegen Drift abgesichert bleiben.

- Nutzerwirkung: Keine beabsichtigte sichtbare Verhaltensänderung; eine weitere kleine Sonar-Bereinigungswelle räumt verbleibende mechanische Modernisierungen in Runtime-, Test- und Script-Pfaden auf, ohne xConfig-Verhalten, Host-Integrationen oder Theme-/Cricket-Abläufe fachlich umzubauen.
  Technik: Harmlose Objekt-Spreads verzichten jetzt auf leere Fallback-Objekte, zwei lokal deklarierte `undefined`-Vergleiche prüfen direkt statt per `typeof`, und der Changelog-Konsistenzcheck ersetzt globale Regex-Ersetzungen durch stringbasierte `replaceAll(...)`-Aufrufe; die betroffenen Cricket-/Lifecycle-Tests und Debug-Helfer behalten dabei ihre bisherige Semantik.

- Nutzerwirkung: Keine beabsichtigte sichtbare Verhaltensänderung; die nächste Sonar-Welle modernisiert weitere ungefährliche DOM- und Text-Helfer, sodass Runtime-, Theme- und Testpfade dieselben Entfernungs- und String-Normalisierungen mit direkteren Standard-APIs ausdrücken, ohne Host-Verhalten oder Cricket-/X01-Logik fachlich zu ändern.
  Technik: Verbleibende `removeChild(...)`-Aufrufe aus der ausgewählten Low-Risk-Gruppe verwenden jetzt `remove()` auf den betroffenen Knoten, der Fake-DOM spiegelt dieses Verhalten intern konsistent nach, und einige einfache globale Regex-Ersetzungen für feste Literale wechseln auf stringbasierte `replaceAll(...)`-Aufrufe in Domain-, Theme-, Runtime- und Test-Utilities.

- Nutzerwirkung: Keine beabsichtigte sichtbare Verhaltensänderung; eine weitere sehr kleine Sonar-Bereinigung hält Cricket-Markenerkennung und Label-Helfer semantisch unverändert, drückt einfache Ziffer-/Nichtziffer-Prüfungen aber kompakter aus.
  Technik: In `parseCricketMarkValue(...)`, `normalizeCricketLabel(...)`, `hasTextualMarkHints(...)` und `parseTextMarkValue(...)` wurden nur `javascript:S6353`-Treffer aus der ausgewählten Low-Risk-Gruppe von `[0-9]`/`[^0-9]` auf die äquivalenten Regex-Kurzformen `\d`/`\D` umgestellt; bestehende Cricket-Domain-, Mark-Parser- und Row-Repair-Regressionen sichern dabei die unveränderte Parser-Semantik ab.

- Nutzerwirkung: Keine beabsichtigte sichtbare Verhaltensänderung; die Cricket-Surface bleibt bei gemergten Reihen, Label-Markern und aktiver Spielerperspektive fachlich gleich, ist intern aber robuster gegen Sonar-bedingte Parser- und Row-Recovery-Bereinigungen abgesichert.
  Technik: `mark-parser`, `row-repair` und angrenzende `pipeline`-Helfer wurden lokal in kleinere Hilfsfunktionen zerlegt, nutzen `dataset` für Mark-/Spielerindex-Felder, entfernen einen fehlerhaften Extra-Argument-Aufruf im Grid-Row-Building und glätten einige eng benachbarte Pipeline-Klarheitsstellen; zusätzliche Parser-, Row-Repair- und Cricket-Render-State-Regressionen sichern Mark-Parsing, Shortfall-Recovery, explizite Spielerindizes und die Cricket-Board-Perspektive gegen Drift ab.

- Nutzerwirkung: Keine beabsichtigte sichtbare Verhaltensänderung; die Cricket-Surface behandelt Match-Routen, degradierte Host-Erkennung und Row-Recovery weiterhin fachlich gleich, ist in diesen Pfaden aber enger gegen Sonar-bedingte Strukturbereinigungen und benachbarte DOM-Sonderfälle abgesichert.
  Technik: `pipeline` und `row-repair` wurden in kleine Helper für Match-Route-Normalisierung, Degraded-Host-Pane-Auswahl, Active-Throw-Suppression und explizite Spaltenplanung zerlegt; ergänzende Runtime-Regressionen sichern dabei Query-/Hash-bereinigte Match-IDs, degradierte Hosts mit zusätzlichem Nebenknoten und Shortfall-ausgerichtete Cricket-Reihen ohne riskanten Snapshot-Breitumbau gegen Drift ab.

## [2.1.28] - 2026-04-18

### Added

- Nutzerwirkung: Im Themes-Tab steht jetzt `Theme X01 2Player (Beta)` als eigenständige X01-Variante bereit; das Layout richtet sich gezielt an Matches mit genau zwei Spielern, betont das Board mittig zwischen zwei großen Spieler-Karten und bringt dafür ein eigenes Hintergrundbild-Setup samt separater xConfig-Vorschau mit. Die Variante ist bewusst als Beta-Version gekennzeichnet und wird weiter ausgebaut sowie stabilisiert; zusätzliche xConfig-Optionen wie Farben und weitere Feineinstellungen sind für kommende Ausbaustufen vorgesehen.
  Technik: `theme-x01-2player` wurde als neues Theme-Feature mit eigener `themes.x01TwoPlayer`-Konfiguration, stabilem 2-Spieler-Guard über Match-Snapshot plus DOM-Fallback, eigener Preview-Asset-/Theme-Key-Verdrahtung, aktualisierten xConfig-Deskriptoren/Docs und neuen Runtime-/CSS-Regressionsprüfungen in Registry, Theme-Lifecycle, Config-Normalisierung und README/FEATURES integriert; die empfohlenen Defaults halten die neue Alternative standardmäßig ausgeschaltet, damit sie nicht ungefragt parallel zur bestehenden X01-Variante aktiviert wird, und die Beta-Kennzeichnung ist jetzt über xConfig, README und Feature-Doku hinweg synchronisiert.

- Nutzerwirkung: `Templates Global` bietet im Themes-Tab jetzt zusätzlich vier feste globale Schriftfarb-Rollen mit Farbwähler, Hex-Eingabe und Einzel-Reset: `Aktiv-Akzent`, `Hauptzahlen`, `Sekundärtext` sowie `Wurf-/Checkout-Text`; damit lassen sich aktive Rahmen/Hauptzahlen, normale Scores/Turn-Punkte, Namen/Meta und Hilfstexte kompakt anpassen, ohne separate Aktiv-/Inaktiv-Farbpaare verstehen zu müssen.
  Technik: `themes.globalTypography` wurde um vier hex-normalisierte Farbwerte erweitert, die xConfig-Shell rendert dafür einen neuen `color`-Control-Typ mit nativer Picker-/Hex-/Reset-Kombination samt Inline-Validierung, `buildThemeGlobalTypographyStyleText(...)` mappt die Werte auf die zuvor eingeführten semantischen Theme-Variablen, und neue Config-, Shell-, README-/FEATURES- sowie Runtime-Regressionen sichern Normalisierung, UI-Verhalten und CSS-Rollen-Mapping gegen Drift ab.

- Nutzerwirkung: `Templates Global` zeigt in xConfig, README und `FEATURES.md` jetzt eine echte Match-Vorschau mit lila Aktiv-Akzent, damit sich der Nutzen der globalen Schrift- und Farbrollen direkt an einem realen X01-Setup nachvollziehen lässt.
  Technik: Ein neuer Preview-Screenshot aus dem aktiven Match-Tab ist als kanonisches Asset in die Feature-Copy, die xConfig-Preview-Manifest-/Browser-Verdrahtung und die generierten README-/FEATURES-Abschnitte aufgenommen; die Doku-Regressionen sichern die neue Vorschau-Datei und das Mapping gegen Drift ab.

- Nutzerwirkung: `Templates Global` bietet jetzt zusätzlich denselben Hintergrundblock wie die Einzel-Themes und kann damit ein globales Fallback-Hintergrundbild für unterstützte xConfig-Themes bereitstellen; solange das aktive Theme kein eigenes Bild gespeichert hat, greifen Darstellung, Bild-Deckkraft und Spielerfelder-Transparenz aus `Templates Global`, während ein gespeichertes Theme-Bild weiterhin den kompletten globalen Background-Block vollständig überschreibt.
  Technik: `themes.globalTypography` wurde um den vollständigen Background-Block inklusive persistiertem Bildfeld erweitert, die bestehende Runtime-/xConfig-Bildinfrastruktur akzeptiert dafür jetzt einen separaten `globalTypography`-Background-Host ohne die Match-Theme-Logik umzubiegen, die Shared-Theme-Schicht löst Theme-gegen-Global-Priorität zentral auf, und neue Config-, Runtime-, Theme- und Shell-Regressionen sichern Bild-Persistenz, Reset-/Recommended-Verhalten, CSS-Fallback-Auflösung sowie Upload-/Clear-Status für `Templates Global` ab.

### Fixed

- Nutzerwirkung: `Dart Marker Darts` bleibt auf dem virtuellen Board jetzt aktiv und ersetzt dort sichtbare Treffer-Marker wieder durch Dart-Grafiken; im `Live-Modus` pausiert das Modul stattdessen automatisch, damit die Live-Ansicht ohne zusätzliche Dart-Overlays bleibt.
  Technik: Die Modus-Guard für `dart-marker-darts` schaltet von `Koordinatenmodus` auf `Live-Modus` um, ein neuer `isLiveBoardInputModeActive(...)`-Helper kapselt die Erkennung zentral, Runtime-Regressionen sichern die neue Aktiv-/Pause-Grenze ab, und die generierten README-/Feature-Texte wurden auf den geänderten Board-Modus-Vertrag synchronisiert.

- Nutzerwirkung: Die Spieler- und Wurfbereiche in `Theme X01 2Player`, `Theme Cricket`, `Theme Bull-off` und den gemeinsamen Karten-Layouts verhalten sich bei aktivem, inaktivem und Sieger-Zustand jetzt farblich konsistenter; aktive Rahmen bleiben klar am selben Akzent orientiert, Sieger folgen derselben Hervorhebungslogik, und zentrale Textbereiche wie Score, Name, Meta sowie Turn-Punkte greifen nachvollziehbarer ineinander.
  Technik: Die Shared-Theme-Schicht nutzt jetzt einen internen semantischen Farbvertrag für `accent`, primäre und sekundäre Textrollen sowie abgeleitete `active`-/`inactive`-/`winner`-Zustände; gemeinsame Karten- und Turn-Styles wurden auf diese Variablen umgestellt, Bull-off/Cricket/X01-2Player überschreiben nur noch gezielt kontrastkritische Ableitungen, und neue Theme-Regressionsprüfungen sichern Rahmen-, Score-, Name-, Meta- und Turn-Farbpfade gegen Drift ab.

- Nutzerwirkung: Der globale `Aktiv-Akzent` aus `Templates Global` bleibt im Browser jetzt auch dann sichtbar, wenn das aktive Theme seine eigenen CSS-Variablen nachlädt; aktive Rahmen und die aktive Hauptzahl folgen damit wieder zuverlässig der gewählten Akzentfarbe.
  Technik: Die Style-Node von `theme-global-typography` wird nach Updates bewusst erneut ans Ende des `<head>` gehängt, damit ihre semantischen Farb-Overrides autoritativ hinter den Theme-Styles stehen; eine Runtime-Regression prüft die Style-Reihenfolge und verhindert erneute Farbverluste durch spätere Theme-Injektionen.

## [2.1.26] - 2026-04-09

### Fixed

- Nutzerwirkung: Keine beabsichtigte sichtbare Verhaltensänderung; die Runtime- und Release-Absicherung bildet jetzt mehrere echte Autodarts-Matchoberflächen robuster nach, sodass DOM-nahe Tests class-basierte Selektoren, Turn-Previews und Board-Zweige für Cricket, Tactics, Shanghai und Bull-off näher an den beobachteten Host-Oberflächen prüfen.
  Technik: `tests/runtime/fake-dom.js` synchronisiert `className` jetzt mit `classList`, und neue schmale Contract-Tests sichern die gemeinsam beobachteten Host-Pfade über `#ad-ext-game-variant`, `#ad-ext-player-display`, `#ad-ext-turn`, `.score`/`.ad-ext-turn-throw` sowie `.showAnimations`-Boardzweige einschließlich image-backed Bull-off-Media-Root explizit gegen künftige Drift ab.

## [2.1.25] - 2026-04-09

### Fixed

- Nutzerwirkung: Keine beabsichtigte sichtbare Verhaltensänderung; kleine Sonar-bedingte Bereinigungen halten Checkout-Hinweise, Board-Erkennung und den Single-Bull-Sound auf ihrem bisherigen Verhalten, reduzieren aber unnötigen Wartungsballast in diesen Pfaden.
  Technik: Unbenutzte Imports und auskommentierter Altcode wurden in mehreren Quellmodulen entfernt, `syncProcessedThrowScope(...)` gibt im Single-Bull-Sound keinen ungenutzten konstanten Wert mehr zurück, und zwei eng begrenzte Helper-Zuschnitte reduzieren die Cognitive Complexity in `selectHigherSpecificBoardGroup(...)` sowie `resolveCheckoutSuggestionSignal(...)`, ohne deren Heuristiken oder Highlight-/Fallback-Semantik zu ändern.

- Nutzerwirkung: Keine beabsichtigte sichtbare Verhaltensänderung; einige niedrig riskante Sonar-Bereinigungen machen interne DOM- und Testpfade lesbarer, ohne Checkout-Overlays, Turn-Points-Frames oder Board-Rechtecke fachlich anders zu behandeln.
  Technik: Kleinere Vergleiche und Attributzugriffe wurden auf direktere moderne APIs umgestellt, Test-Assertions und der Fake-DOM erhielten die dazu passende minimale Modernisierung, und `getNodeRect(...)` prüft positive Rechteckgrößen jetzt äquivalent mit direkteren Gegenoperatoren statt negierter Vergleiche.

## [2.1.24] - 2026-04-08

### Added

- Nutzerwirkung: Im Themes-Tab gibt es jetzt das neue Modul `Templates Global`, mit dem sich eine kuratierte Remote-Schrift gezielt für stabile Score-, Wurf- oder Namensbereiche aktiver xConfig-Themes auswählen lässt; im Font-Picker werden die Schriftoptionen dabei nur noch über ihren eigenen Namen in der jeweiligen Schrift gezeigt, ohne zusätzliche Muster- oder Beschreibungstexte.
  Technik: `themes.globalTypography` wurde als themes-nahes Runtime-Feature mit eigener Style-Node, lokaler Aktivitätsprüfung und exakt auf stabile `.ad-ext-*`-Selektoren begrenzten Wirkbereichen eingeführt; Bunny-Font-Presets und xConfig-only Preview-Imports wurden sauber integriert, `Empfohlene Standards` respektiert für dieses Modul jetzt explizit `enabled: false`, und Config-, UI-, Runtime- sowie Doku-Regressionen sichern Presets, Scopes, Preview-Verhalten und Release-Doku ab.

## [2.1.23] - 2026-04-06

### Fixed

- Nutzerwirkung: Die Spieleranzeige in `Theme X01`, `Theme Shanghai` und `Theme Bull-off` hält die größeren Score-Fontgrößen jetzt auch in der finalen Kartenhöhe sauber aus; inaktive Karten bekommen genug Platz für Namen, Meta und Score ohne gequetschten oder abgeschnittenen Inhalt, und die aktive Karte zeigt wieder einen sichtbaren grün hervorgehobenen Rahmen mit denselben abgerundeten Ecken wie die obere Trefferanzeige.
  Technik: Die Shared-Player-Card-Logik berücksichtigt jetzt die echte verschachtelte DOM-Struktur unter `#ad-ext-player-display`, zieht Zwischen-Wrapper bei Unterstützung per `display: contents` aus dem Layout, gibt aktiven und inaktiven Karten dynamische Mindesthöhen passend zum neuen Score-Fokus-Profil, entfernt die alte starre `12%`-Begrenzung aus `Theme X01`, und der gemeinsame Aktiv-Rahmen wird wieder als echter grüner `2px`-Border mit `12px` Radius am Shared-Theme-CSS gesetzt; die Theme-Parity-Regressionen decken Größenanker, Mindesthöhen und den abgerundeten Aktiv-Rahmen explizit ab.

## [2.1.22] - 2026-04-06

### Fixed

- Nutzerwirkung: `TV Board Zoom`, `Checkout Board Targets` und `Checkout Score Pulse` folgen in X01 jetzt derselben sichtbaren Checkout-Wahrheit, sodass stale Score-Mismatches zwischen DOM und internem Match-State keine widersprüchigen Zooms, Board-Ziele oder Score-Pulse mehr auslösen; zugleich bleibt der Board-Zoom bei aktiven Checkout-Situationen stabiler und nachvollziehbarer bis zum Leg-Ende stehen.
  Technik: Eine gemeinsame X01-Checkout-Context-Schicht zentralisiert aktive Score-Auflösung, sichtbare Route und Checkout-Surface für die betroffenen X01-Features; `tv-board-zoom`, `checkout-board-targets` und `checkout-score-pulse` konsumieren jetzt denselben Shared-Snapshot statt eigener Score-Arbitration, der Zoom nutzt nur noch den gemeinsamen Board-Surface-Resolver, und neue Runtime-Regressionen sichern DOM-vs-Game-State-Mismatch, Sticky-Leg-Ende-Verhalten und Zoom-Stabilität ausdrücklich ab.

- Nutzerwirkung: Die Spieleranzeige in `Theme X01`, `Theme Shanghai` und `Theme Bull-off` skaliert aktive und inaktive Spielerkarten jetzt sauberer mit dem verfügbaren Platz; der gemeinsame Karten-Look wurde zusätzlich auf ein ausgewogeneres Score-Fokus-Profil nachgeschärft, sodass Punkte in allen drei Themes klar im Vordergrund stehen, Namen und Meta aber lesbar bleiben, inaktive Karten nicht größer als die aktive Karte werden und der aktive Rahmen in X01/Shanghai weiter dem gleichen Grün wie der Punkte-Text folgt.
  Technik: Die Shared-Player-Card-CSS nutzt jetzt gemeinsame responsive Größenvariablen mit einem abgestimmten Score-Fokus-Basisprofil für `x01`, `Shanghai` und `Bull-Off`; aktive Karten behalten explizit das 4:3-Größen- und Flex-Verhältnis über dieselben Shared-Variablen, konkurrierende Fallback-Fontgrößen im gemeinsamen Theme-CSS wurden auf dasselbe Profil gezogen, die verbliebenen Bull-Off-Score-Max-Overrides für schmale Breakpoints wurden entfernt, und die Theme-Parity-Regressionen sichern gemeinsame Größenanker, aktives 4:3-Verhältnis, fehlende Bull-Off-Sondergrößen und den grünen Aktiv-Rahmen explizit ab.

## [2.1.18] - 2026-04-05

### Changed

- Nutzerwirkung: `Theme Bull-off` und `Theme Shanghai` verwenden in der Spieleranzeige jetzt denselben Kartenaufbau wie `Theme X01`, sodass Namen, Zusatzinfos und Scores über alle drei Modi sichtbar konsistenter und ruhiger wirken.
  Technik: Die X01-Spieleranzeige wurde als gemeinsamer Shared-Player-Display-Baustein zentralisiert, `Bull-Off` und `Shanghai` binden jetzt dieselben Layout-, Typografie- und Stat-Scaling-Regeln ein, abweichende Bull-Off-Karten-Overrides im Spielerbereich wurden zurückgebaut, und die CSS-Parity-Regressionen prüfen die gemeinsame Kartenlogik ausdrücklich mit ab.

## [2.1.17] - 2026-04-05

### Fixed

- Nutzerwirkung: `Theme Bull-off` richtet aktive und Sieger-Spielerkarten jetzt wieder sichtbar zentriert im Karten-Container aus, sodass Namen, Metadaten und Score näher am X01-/Shanghai-Look stehen, ohne dass sich das übrige Bull-Off-Layout oder die Board-Gewichtung verändert.
  Technik: Bull-Off nutzt für das Spieler-Kartenraster jetzt denselben bestehenden Shared-Layout-Baustein wie die anderen zentrierten Score-Themes statt eine Theme-zu-Theme-Abhängigkeit aufzubauen; zusätzliche CSS-Parity-Regressionen sichern Grid-, Overflow- und Zentrierungsanker für Bull-Off explizit gegen künftige Layout-Drifts ab.

## [2.1.16] - 2026-04-04

### Fixed

- Nutzerwirkung: `Checkout Board Targets` und `TV Board Zoom` folgen auf verschachtelten oder stale Board-DOMs jetzt wieder der sichtbaren Live-Scheibe; direkte Finishes wie `10 / D5` und `22 / D11` bleiben dadurch am Board markiert und zoomen wieder zuverlässig ein, während mehrstufige Fälle wie `50` mit `S10 -> D20` nicht mehr auf einen falschen mittigen Ausschnitt driften.
  Technik: Die gemeinsame Board-Surface-Wahrheit bevorzugt fuer Checkout-/Zoom-Features jetzt den kanonischen sichtbaren Board-Snapshot statt versteckter Legacy-Wrapper, `tv-board-zoom` berechnet Translation und Clamping vollständig im Viewport-Koordinatensystem statt `getBoundingClientRect()` mit `offsetLeft/Top` zu mischen, beide Features konsumieren denselben Shared-Board-Resolver, und neue Runtime-/Layout-Regressionen sichern direkte Double-Finishes, `50` mit `S10 -> D20` sowie verschachtelte Board-Gruppen explizit ab.

### Changed

- Nutzerwirkung: `Empfohlene Standards` setzt jetzt repoweit das neue empfohlene Gesamtprofil mit aktivierten Themes und Animationen, klar definierten Modul-Defaults wie `Stripe`, `Electric Arc`, `Signal`, `Fireworks` und dem breiteren, statischen `X01 Score Progress`; dieselbe Profilbelegung ist außerdem in README und `FEATURES.md` jetzt direkt nachvollziehbar dokumentiert.
  Technik: Die empfohlenen Runtime-Defaults in `feature-config-spec` wurden auf das neue Preset umgestellt, die Doku erhält die Profilübersicht jetzt aus einer gemeinsamen abgeleiteten Quelle in `xconfig-ui/copy`, der Doc-Sync schreibt diese Sektion nach README und `docs/FEATURES.md`, der Sync wurde zusätzlich auf stabile Marker statt fragile Heading-Grenzen gehärtet, `package.json` führt dafür jetzt einen offiziellen `sync:xconfig-docs`-Einstieg, und direkte Config-/Runtime-/Doku-Regressionen sichern sowohl die Preset-Belegung als auch die zugehörige Dokumentation ab.

## [2.1.14] - 2026-04-04

### Fixed

- Nutzerwirkung: `style-checkout-suggestions` zeigt im `Outline`-Stil keinen zusätzlichen Punkt oben rechts mehr; die Hervorhebung bleibt sonst unverändert beim klaren Rahmen-Look.
  Technik: Der `Outline`-Stil rendert im Source-CSS kein zusätzliches kreisförmiges `::after`-Dekoelement mehr, und die betroffenen UI- und Doku-Beschreibungen wurden auf den jetzt reinen Rahmen-Look synchronisiert.

- Nutzerwirkung: `Checkout Board Targets` zeigt in den Einstellungen keine Option `Single-Ring` mehr an; bei Single-Zielen werden stattdessen standardmäßig immer beide Single-Ringe markiert.
  Technik: Die xConfig-Descriptor- und Copy-Definitionen führen das Feld `singleRing` nicht mehr, während Config-Normalisierung, Legacy-Import und Visual-Config bestehende oder ältere Werte konsequent auf `both` festziehen und die betroffenen Runtime-, Config- und Doku-Regressionen darauf angepasst wurden.

## [2.1.12] - 2026-04-04

### Fixed

- Nutzerwirkung: `checkout-board-targets` markiert im Modus `Nur Finish` das Finish-Feld jetzt erst dann, wenn dieser Dart im aktuellen Wurf wirklich dran ist; bei sichtbaren Mehrschritt-Routen wie `T20` plus `D18` bleibt das Board vor dem ersten Dart deshalb zunächst unmarkiert, und `tv-board-zoom` sowie Board-Targets folgen dabei wieder derselben Finish-Freigabe-Regel.
  Technik: `checkout-board-targets` prüft die Finish-Auswahl in `targetSelectionMode: "finish"` jetzt zusätzlich gegen den aktuellen Score, statt das letzte Segment einer autoritativen Route immer sofort zu übernehmen; zusätzlich liefert die gemeinsame X01-Semantik in `x01-checkout-route` die zentralisierte Finish-Freigabe (`authoritativeFinishSegment` plus `canUseAuthoritativeFinishNow`), die jetzt sowohl von `checkout-board-targets` als auch von `tv-board-zoom` genutzt wird, während feature-spezifische Zoom-, Hold- und Render-Logik lokal bleibt; neue Runtime-Regressionen decken Mehrschritt-Routen, stale sichtbare Routen und die gemeinsame Semantik direkt ab, und die Nutzertexte wurden daran synchronisiert.

- Nutzerwirkung: `tv-board-zoom` zoomt im Modus `Nur Finish-Feld` bei sichtbaren Mehrschritt-Checkout-Routen nicht mehr verfrüht auf das Finish, wenn der interne Match-State kurz einen veralteten Score liefert, im Player-Panel aber bereits der aktuelle Score steht; bei `121` mit sichtbarer Route `T20`, `25`, `D18` bleibt der Zoom dadurch jetzt wieder aus, bis der Finish-Dart wirklich dran ist.
  Technik: `tv-board-zoom` gleicht bei Score-Mismatch zwischen `gameState` und sichtbarem DOM-Score die mehrstufige Checkout-Surface jetzt gezielt gegen beide Score-Kandidaten ab und bevorzugt den DOM-Score nur dann, wenn die sichtbare Route damit plausibel bleibt, der stale `gameState` aber fälschlich schon einen direkten Finish-Zoom erzeugen würde; eine neue X01-Regression deckt diesen DOM-vs-Game-State-Fall ausdrücklich ab.

## [2.1.9] - 2026-04-03

### Fixed

- Nutzerwirkung: `checkout-score-pulse` und `tv-board-zoom` reagieren bei sichtbaren Mehrschritt-Checkout-Routen jetzt erst dann auf das Finish-Feld, wenn dieser Dart wirklich aktuell dran ist; bei `121` mit sichtbarer Route `T20`, `25`, `D18` wird `D18` also nicht mehr vorzeitig als direkter Finish-Hinweis gepulst oder im Modus `Nur Finish-Feld` gezoomt.
  Technik: `checkout-score-pulse` wertet sichtbare Checkout-Routen jetzt über die gemeinsame X01-Surface-Semantik gegen echten Score, Out-Mode und Restdarts aus und fällt bei stale sichtbaren Routen gezielt auf den direkten Score-Checkout zurück; `tv-board-zoom` begrenzt `finish-only` auf echte aktuelle Ein-Dart-Finishes, behält `route-first` bewusst unverändert bei und sichert beide Pfade mit erweiterten X01-, Runtime- und Doku-Regressionen ab.

### Changed

- Nutzerwirkung: Repository-Arbeit folgt jetzt einem klareren ESLint-Ablauf; `npm run verify` startet immer mit dem Lint-Lauf, und Maintainer-Hinweise machen deutlicher, dass ein fehlgeschlagener oder ausgelassener Lint-Check die Arbeit nicht als abgeschlossen gelten lässt.
  Technik: `package.json` verdrahtet `verify` jetzt mit `npm run lint` als erstem Schritt, und `AGENTS.md` verlangt fuer lint-relevante Aenderungen einen explizit berichteten erfolgreichen Lint-Lauf, bevor ein Task als done deklariert werden darf.

## [2.1.8] - 2026-04-03

### Fixed

- Nutzerwirkung: X01-Checkout-Hinweise, X01-Score-Progress und Tactics-Zielauswertung bleiben jetzt fachlich enger am dokumentierten Regelwerk; stale Checkout-Suggestions erzwingen keine falschen Highlights mehr, gültige X01-Bases wie `121` und `170` bleiben erhalten, und Tactics behandelt `DOUBLE`/`TRIPLE` nicht länger als offizielle Pflichtziele.
  Technik: `x01-rules` validiert explizite Checkout-Suggestions jetzt gegen echten Score und Out-Mode, `x01-score-progress` liest Base-Scores nur noch aus streng gebundenen Quellen statt aus freiem Score-/Checkout-Text, und `cricket-rules` sanitisiert die offizielle Tactics-Zielmenge zentral auf `20..10 + BULL`, während `DOUBLE`/`TRIPLE` nur noch als kompatible Host-/DOM-Artefakte toleriert werden; dazu wurden gezielte Domain-, Runtime- und Regeldoku-Regressionen ergänzt.

## [2.1.7] - 2026-04-03

### Fixed

- Nutzerwirkung: Das Userscript-Verhalten bleibt unverändert; eine ungenutzte interne Asset-Wrapper-Datei entfällt aus dem Quellbaum, sodass die Source-Struktur etwas schlanker und eindeutiger wird.
  Technik: `src/shared/feature-assets.js` wurde entfernt, weil der aktive Code durchgehend den `#feature-assets`-Importpfad aus `package.json` nutzt und es im Repository keine verbleibenden Aufrufer für den dünnen Re-Export gab.

- Nutzerwirkung: Das Userscript-Verhalten bleibt unverändert; der veraltete Cricket-Backup-Bestand liegt nicht mehr im aktiven `src`-Baum und kann dadurch nicht mehr mit gepflegtem Quellcode verwechselt werden.
  Technik: Der archivierte Ordner `src/legacy-backups/cricket-rebuild-2026-04-03` wurde entfernt, nachdem im Repository keine Laufzeit-, Build-, Test- oder Doku-Abhängigkeiten dafür verblieben waren; übrig blieb nur noch der breite ESLint-Ignore für Backup-Pfade.

- Nutzerwirkung: `checkout-board-targets` bleibt bei Board-Wechseln, verschachtelten Board-Gruppen und kurzzeitig abweichenden Shared-Board-Kandidaten beim bisherigen sichtbaren Verhalten, driftet dabei aber seltener von der gemeinsamen Board-Wahrheit im Shared-Layer weg.
  Technik: `dartboard-svg` liefert mit `findCheckoutCompatibleBoardSnapshot()` jetzt einen kleinen Checkout-Kompatibilitäts-Adapter zwischen der bisherigen `findBoardSvgRoot()`-Auswahl und dem stärkeren kanonischen `findBoardSvgGroup()`-Snapshot; `checkout-board-targets` nutzt diesen Shared-Entry-Point statt seine Board-Suche lokal noch einmal nachzubauen, abgesichert durch neue Regressionen für Gleichstand, versteckte größere Gruppen und Wrapper-vs-Child-Gruppen.

## [2.1.6] - 2026-04-03

### Fixed

- Nutzerwirkung: `checkout-board-targets` und `tv-board-zoom` hängen sich jetzt stabiler an dieselbe Board-SVG-Wurzel, sodass Board-Markierung und Zoom bei ausgetauschten oder kurzzeitig stale Boards seltener auf unterschiedliche SVG-Roots driften, ohne das sichtbare Verhalten der Features zu ändern.
  Technik: `dartboard-svg` exportiert mit `findBoardSvgRoot()` jetzt die bisher doppelt gepflegte SVG-Root-Auswahl auf Basis von Zahlenring-Abdeckung und Kreisradius; `checkout-board-targets` und `tv-board-zoom` delegieren diese Entscheidung dorthin, und `checkout-board-targets` nutzt zusätzlich die bestehenden Shared-Overlay-Helfer statt lokaler Duplikate.

## [2.1.5] - 2026-04-03

### Fixed

- Nutzerwirkung: `triple-double-bull-hits` stützt sich bei Throw-Rows, Turn-Points und Turn-Surface-Fallbacks jetzt auf einen konsistenteren gemeinsamen Turn-Surface-Blick, ohne dass sich Hit-Erkennung, Korrekturverhalten oder die sichtbaren Animationen ändern.
  Technik: `turn-surface-adapter` liefert mit `getTurnSurfaceSnapshot()` jetzt ein kleines gemeinsames Snapshot für `turnContainer`, `throwRows`, `turnPointsToken` und `rowSource`; `triple-double-bull-hits` liest diese Turn-Surface-Fakten darüber statt sie lokal aus mehreren Adapter-Aufrufen und eigener Fallback-Ableitung erneut zusammenzusetzen, abgesichert durch eine neue Adapter-Regression.

## [2.1.4] - 2026-04-03

### Fixed

- Nutzerwirkung: Die X01-Checkout-Helfer für `checkout-board-targets` und `tv-board-zoom` reagieren jetzt konsistenter auf dieselbe volatile Checkout-Oberfläche; gültige sichtbare Checkout-Routen bleiben bevorzugt, während irreführende Multi-Step-Routen im `route-first`-Zoom unterhalb von `180` nicht mehr lokal anders interpretiert werden als die Board-Ziele.
  Technik: Die gemeinsame X01-Checkout-Domänenschicht liefert mit `resolveCheckoutSurfaceSemantics()` jetzt ein kleines semantisches Snapshot für sichtbare Route, autoritative Route, Fallback-Bedeutung und Setup-only-Fälle; `checkout-board-targets` liest daraus dieselbe autoritative Route wie `tv-board-zoom`, während Retention, transienter Reset-Grace, Manual-Pause und Rendering bewusst feature-lokal bleiben, abgesichert durch neue Runtime-Regressions für Surface-Semantik und Zoom-Entscheidungen.

## [2.1.3] - 2026-04-03

### Fixed

- Nutzerwirkung: Die gemeinsame Cricket-Surface bleibt bei transienten Board-Gaps, degradierten Match-Hosts und nachfolgenden Erholungen stabiler und leichter vorhersagbar; `cricket-grid-fx`, Board-Overlay und Theme behalten dabei ihr bisheriges Verhalten, reagieren aber robuster auf den Pfad `ready -> missing-board -> ready/degraded-host`.
  Technik: Die Shared-Cricket-Runtime trennt Timer-Slots, degraded-host Recovery-Gating, missing-board Deferral und READY-Lifecycle jetzt in klarere interne Helfer, liefert fuer Subscriber das abgeleitete Lifecycle-Signal `boardGapDeferred`, entkoppelt `cricket-grid-fx` und `cricket-highlighter` damit von doppelten Runtime-Details und fasst die Delay-Normalisierung fuer degraded-host Rechecks in einer gemeinsamen Helper-Schicht zusammen; zusaetzlich sichert eine neue Runtime-Regression den deferred Board-Gap-Pfad direkt am Shared-Runtime-Vertrag ab.

## [2.1.2] - 2026-04-03

### Fixed

- Nutzerwirkung: Im Live-Cricket-Layout mit Theme-Objective-Strip werden Board-Overlay und `cricket-grid-fx` jetzt wieder aus dem echten Zielstreifen statt aus dem kompletten Match-Wrapper abgeleitet; dadurch bleibt `20` bei drei eigenen Marks am Board sichtbar als Scoring-Ziel, während Player-Display und Board-Host nicht mehr versehentlich als Cricket-Grid mitverarbeitet werden.
  Technik: Die Cricket-Surface blockiert Grid-Root-Kandidaten jetzt früh, sobald sie Theme-Board-Hosts oder `#ad-ext-player-display` enthalten, und `cricket-grid-fx` nutzt dieselbe geschützte Host-Definition; neue Runtime- und Theme-Regressions decken den Live-Fall mit Theme-Objective-Strip, gemeinsamem Wrapper und Board-Overlay ausdrücklich ab.

## [2.1.1] - 2026-04-03

### Fixed

- Nutzerwirkung: Cricket-Punktestände im Player-Display bleiben jetzt auch dann sichtbar, wenn ein aktiver Spieler bereits `20`, `19` oder einen anderen Cricket-Zielwert als Score erreicht hat; die Anzeige verschwindet nicht mehr, nur weil der Scoretext wie ein Grid-Label aussieht.
  Technik: `cricket-grid-fx` behandelt Nodes aus `#ad-ext-player-display` und normalisierten Cricket-Player-Cards jetzt ausdrücklich als geschützte Hosts und schließt sie bereits bei Label-Discovery, Grid-Root-Scoring und Player-Cell-Ermittlung aus; eine neue Theme-Kompatibilitäts-Regression sichert zusätzlich ab, dass echte Grid-Zellen weiter markiert werden, Player-Card-Scores aber keine `ad-ext-crfx-*`-Klassen mehr erhalten.

## [2.1.0] - 2026-04-03

### Fixed

- Nutzerwirkung: Wenn ein Cricket-Match nach einer bereits erfolgreichen Stabilisierung später bei einem Wurf erneut in den rohen Hostzustand kippt, kann xConfig jetzt nochmals eingreifen, statt am alten sessiongebundenen Recovery-Marker hängen zu bleiben und den Screen nach `S20`-Treffern wieder kollabieren zu lassen.
  Technik: Der degradierte Match-Host bleibt weiter gegen Reload-Loops abgesichert, aber `cricket-grid-fx` und `cricket-highlighter` schalten den sessiongebundenen Recovery-Key nach einer stabil gesunden `ready`-Surface automatisch wieder scharf; dadurch kann derselbe Match-Tab nach einer echten Erholung erneut genau einen Recovery-Reload auslösen, und eine neue Lifecycle-Regression deckt den Pfad `degraded -> healthy -> degraded` ausdrücklich ab.
- Nutzerwirkung: Cricket-Grid, Board-Overlay und Theme reagieren jetzt deutlich ruhiger und konsistenter auf dieselben Live-Änderungen, statt sich bei Host-Wechseln, Attribut-Hydrationen oder parallelen Rebuilds gegenseitig mit eigenen Observer-/Render-Pfaden zu überholen.
  Technik: `cricket-grid-fx` und `cricket-highlighter` teilen sich jetzt eine gemeinsame Cricket-Surface-Runtime mit einem koordinierten Observer-/Listener-/Game-State-Pfad, gemeinsamer Render-State-Ermittlung, featurelokalen Renderern und aliasfähigen Debug-Observern; zusätzlich synchronisiert das Cricket-Theme den aktiven Spieler jetzt aus derselben Surface-Semantik, und eine neue Lifecycle-Regression sichert ausdrücklich ab, dass Grid-FX und Highlighter zusammen nur noch einen echten Runtime-Observer-Stack verwenden.

## [2.0.112] - 2026-04-02

### Fixed

- Nutzerwirkung: Wenn ein Cricket-Match erst sauber steht und dann nach einem Wurf oder Polling-Update ohne Board in das rohe `UndoNext...`-Hostlayout kippt, reagiert xConfig jetzt auch ohne weitere DOM-Bewegung zuverlässig und lässt die Oberfläche nicht dauerhaft im halb kaputten Zwischenzustand hängen.
  Technik: Die degradierte Cricket-Surface bleibt während der Grace-Phase nicht mehr auf nachfolgende Fremdmutationen angewiesen, sondern plant in `cricket-grid-fx` und `cricket-highlighter` einen getakteten Recheck nach Ablauf der Host-Stabilisierungsfrist; dadurch eskaliert `missing-board + pending degraded-host` deterministisch zu `degraded-host`, der bestehende One-Shot-Recovery-Pfad feuert auch bei stillstehendem DOM, und eine neue Lifecycle-Regression deckt genau diesen No-Mutation-Fall ausdrücklich ab.

## [2.0.111] - 2026-04-02

### Fixed

- Nutzerwirkung: Beim Wechsel von der Startseite in ein bereits laufendes Cricket-Match stabilisiert xConfig degradierte Autodarts-SPA-Einstiege jetzt automatisch, statt den Screen im halb aufgebauten `UndoNext...`-Layout ohne Board stehen zu lassen; bleibt der Host trotzdem kaputt, greifen Cricket-Features fail-safe nicht mehr in die Oberfläche ein.
  Technik: Die gemeinsame Cricket-Surface klassifiziert fehlendes Board plus degradierte Zwei-Pane-Matchstruktur jetzt als `degraded-host`, wartet kurz auf stabile DOM-Erholung, löst pro Match-ID höchstens einen sessiongebundenen Hard-Reload aus und hält `cricket-grid-fx` sowie `cricket-highlighter` bis zur gesunden Surface strikt passiv; neue Runtime- und Lifecycle-Regressionen sichern Grace-Phase, Fehlalarm-Schutz und den One-Shot-Recovery-Pfad ausdrücklich ab.

## [2.0.110] - 2026-04-02

### Fixed

- Nutzerwirkung: Cricket-Layouts mit nur kollabierten Zielstreifen werden jetzt lieber unangetastet gelassen, statt die Match-Ansicht fälschlich als vollwertiges Cricket-Grid zu dekorieren und damit das sichtbare Layout in einen unbrauchbaren Horizontalstreifen zu drücken.
  Technik: Die Grid-Erkennung verlangt bei belastbarer DOM-Geometrie jetzt zusätzlich mehrere vertikale Label-Bänder, sodass rein horizontale Objective-Strips trotz gültiger Labels und Sibling-Zellen nicht mehr als Cricket-Grid durchrutschen; eine neue Runtime-Regression bildet genau diesen Live-Match-Fall mit verstecktem `TextDummy`-Container und kollabiertem Zielstreifen nach.

## [2.0.109] - 2026-04-02

### Fixed

- Nutzerwirkung: Cricket-Matches bleiben jetzt auch beim Wechsel innerhalb der laufenden Play-Applikation stabil sichtbar, statt sich kurz korrekt aufzubauen und danach in einen einzelnen Textblock zu kollabieren.
  Technik: `cricket-grid-fx` schützt App-Shell-Knoten wie `#root`, `body` und `main` jetzt explizit davor, als Cricket-Label-, Badge- oder Zellziel dekoriert oder beim Cleanup per `textContent` zurückgeschrieben zu werden; eine zusätzliche Runtime-Regression deckt genau den transienten SPA-Fehlpfad mit fälschlich als Row eingebrachtem App-Root ausdrücklich ab.

## [2.0.108] - 2026-04-01

### Fixed

- Nutzerwirkung: `TV Board Zoom` respektiert bei `Nur Finish-Feld` jetzt den aktiven Out-Mode sauber und zoomt außerhalb des optionalen `T20`-Sonderfalls nur noch auf echte Ein-Dart-Finishes; irreführende Setup-Ziele wie `S14` nach `121 -> S7 -> T20` bleiben damit ungezoomt. Zusätzlich lässt sich der spezielle `T20`-Setup-Zoom nach zwei `T20` jetzt direkt in xConfig ein- oder ausschalten.
  Technik: `tv-board-zoom` unterdrückt im Modus `finish-only` generische `smart-setup`-Fallbacks, behält die Out-Mode-aware Checkout-Auswahl für `Straight Out`, `Double Out` und `Master Out` bei, ergänzt das neue Config-Flag `t20SetupZoomEnabled` samt xConfig-Descriptoren und Nutzertexten und sichert das Verhalten über Runtime-, Config- und xConfig-Shell-Regressionen ab.
- Nutzerwirkung: Cricket-/Tactics-Ansichten greifen bei kollabierten oder fremd gestörten Match-Containern nicht mehr versehentlich generische Seitenblöcke als Cricket-Grid auf; dadurch wird die Oberfläche in solchen Drift-Fällen nicht zusätzlich von AD xConfig als scheinbare Grid-Zelle dekoriert.
  Technik: Die Cricket-Label-Erkennung akzeptiert DOM-Text ohne explizite `data-row-label`-/`data-target-label`-Kennung jetzt nur noch für kurze, atomare Knoten statt für lange Sammel-Container, und zusätzliche Runtime-Regressionen sichern sowohl den Utility-Pfad als auch den zusammengefallenen Mixed-Content-Container auf Render-State-Ebene ausdrücklich ab.

## [2.0.107] - 2026-03-31

### Fixed

- Nutzerwirkung: Throw-basierte Anzeigen wie `Triple / Double / Bull Hits`, `Turn Points Count`, `Single Bull Sound` und auch `Checkout Board Targets` reagieren jetzt zuverlässiger auf nachgeladene oder umgeschaltete Wurffelder, statt vereinzelt erst mit Verzögerung nach einem späteren DOM-Update sichtbar nachzuziehen.
  Technik: Die Turn-Surface-Features teilen sich jetzt eine gemeinsame Observer-Konfiguration, die neben Knoten- und Textänderungen auch relevante Attributwechsel wie `class`, `style` oder `aria-hidden` an den Wurffeldern beobachtet; zusätzliche Runtime-Regressionen sichern die gemeinsame Filterkonfiguration sowie Reaktionen von `checkout-board-targets` und `triple-double-bull-hits` auf Attributmutationen ausdrücklich ab.

## [2.0.106] - 2026-03-31

### Fixed

- Nutzerwirkung: `Checkout Board Targets` liest sichtbar formatierte Checkout-Karten wie `60 / T20` und `14 / S14` jetzt wieder stabil korrekt aus, sodass bei `Alle Felder` im laufenden Match die echten Routenfelder am Board markiert bleiben statt fälschlich auf eine scorebasierte Ersatzroute wie `T20` plus `T18` umzuschalten.
  Technik: Die X01-Route-Erkennung bevorzugt für `.suggestion`-Karten jetzt robustere Textquellen wie `innerText` und notfalls einzelne Leaf-Texte statt nur des verketteten Wrapper-`textContent`; zusätzliche Runtime-Regressionen sichern sowohl den Live-Fall mit kollabiertem `60T20`/`14S14` als auch den Fallback über verschachtelte Textknoten ausdrücklich ab.

## [2.0.105] - 2026-03-31

### Fixed

- Nutzerwirkung: `Checkout Board Targets` übernimmt geänderte Einstellungen wie `Single-Ring: Beide` und `Nur Fläche` jetzt auch in bereits geöffneten Match-Tabs zuverlässig, sodass die Board-Markierung nicht erst nach einem manuellen Reload korrekt auf beide Single-Ringe umspringt.
  Technik: Der Tampermonkey-Runtime hört jetzt auf `storage`-Änderungen des persistierten xConfig-Status, lädt die aktuelle Konfiguration tabübergreifend nach und remountet betroffene Features auf Basis des gespeicherten Zustands; zusätzliche Runtime-Regressionen sichern sowohl den Cross-Tab-Sync als auch die Render-Kombinationen `singleRing` x `segmentStyle` für Single-Ziele ausdrücklich ab.

### Changed

- Nutzerwirkung: Repository-Arbeit in VS Code erkennt ESLint jetzt direkt im Workspace, und der Lint-Lauf ist mit `npm run lint` reproduzierbar verfügbar, ohne zusätzlich Prettier oder weitere Stil-Plugins einzuführen.
  Technik: Das Repository nutzt jetzt eine schlanke Flat-Config über `eslint.config.js`, ergänzt `package.json` um `lint`-Skripte und die nötigen ESLint-Abhängigkeiten, empfiehlt die passenden VS-Code-Erweiterungen per `.vscode/extensions.json`, setzt konservative Workspace-Settings für die ESLint-Erkennung und hält die Maintainer-Hinweise in `README.md` sowie `AGENTS.md` dazu synchron.
- Nutzerwirkung: ESLint deckt jetzt wieder fachlich wichtige Repo-Dateien in `src/`, `tests/` und `scripts/` ab, statt sie pauschal aus dem Diagnose-Scope auszublenden; nur echte Vendor- oder generierte Dateien bleiben global außen vor.
  Technik: Die Flat-Config trennt jetzt strikt zwischen generierten bzw. fremden Dateien und echten Projektquellen, entfernt die breiten File-Ignores für Source- und Testdateien, behebt die kleinen Einzelverstöße direkt im Code und begrenzt die vorläufige Legacy-Sonderbehandlung auf wenige klar benannte Datei-Overrides nur für `no-unused-vars`.

## [2.0.104] - 2026-03-31

### Fixed

- Nutzerwirkung: `Checkout Board Targets` pulsiert auf dem X01-Board jetzt auch bei `T20` und ähnlichen Zielsegmenten wieder sauber und kontinuierlich, statt nur kurz zu zucken, wenn das gleiche Ziel mehrfach hintereinander neu gerendert wird.
  Technik: Das Board-Overlay verwendet bei identischer Zielgeometrie bestehende SVG-Knoten weiter, synchronisiert deren Attribute, Klassen und Inline-Styles statt sie jedes Mal neu zu erzeugen und verhindert so den permanenten Animations-Reset des Signal-Pulses; eine zusätzliche Runtime-Regression sichert die Knoten-Wiederverwendung ausdrücklich ab.
- Nutzerwirkung: `Checkout Board Targets` kann Ziele jetzt optional nur über die farbige Fläche ohne zusätzlichen Rahmen markieren, sodass zum Beispiel `S20` mit demselben Preset-Verhalten, Glow und Farbthema flächig hervorgehoben wird, ohne Segmentkontur oder weiße Zielkontur einzublenden.
  Technik: `checkout-board-targets` normalisiert dafür den neuen Modus `surface-only`, lässt im Renderpfad sowohl den farbigen Shape-`stroke` als auch den Outline-Klon gezielt weg, hält Preset-Animationen weiterhin auf der Fläche aktiv und ergänzt Runtime- sowie xConfig-Regressionen für Renderverhalten, Config-Normalisierung und Persistenz.

## [2.0.102] - 2026-03-31

### Fixed

- Nutzerwirkung: `Checkout Board Targets` hält unter `theme-x01` das nächste sinnvolle Feld jetzt auch dann direkt am Board sichtbar, wenn nach einem Setup-Dart keine vollständige Finish-Route mehr übrig bleibt; zugleich wirken `Focus`, `Signal` und `Steady` wieder klar unterscheidbar und sichtbar lebendig statt nahezu statisch.
  Technik: Die X01-Route-Auflösung behält bei fehlender Finish-Route gezielt das erste plausible sichtbare Setup-Segment als `visible-setup-segment`, die Board-Keyframes nutzen wieder echte Scale-Bewegung für alle drei Presets, und `signal` folgt nun einem ruhigeren Blinkpuls näher am nativen Board-Hinweis; zusätzliche Runtime-Regressionen sichern Setup-Fallback, CSS-Verträge und x01-Verhalten ausdrücklich ab.

## [2.0.101] - 2026-03-30

### Fixed

- Nutzerwirkung: Die Presets `Focus` und `Signal` im `Checkout Board Targets`-Overlay bleiben auf Single-, Triple-, Double- und Bull-Feldern jetzt deutlich zuverlässiger erkennbar; gerade Singles und der kleine Bull gehen im ruhigen Fokus oder im Blink-Off-Zustand nicht mehr so leicht unter.
  Technik: Die im MCP direkt auf echten Board-Geometrien verglichenen Effektprofile heben in `focus` die Single-/Outer-/Bull-Mindestopazität, Konturbreite und Outline-Floors ausgewogen an und geben `signal` eine tragfähigere Off-Phase samt stärkerer Single-/Bull-Kontur; zusätzliche Runtime-Regressionen sichern die konkreten Single-/Outer-/Bull-Verträge für `focus` und `signal` ausdrücklich ab.

## [2.0.100] - 2026-03-30

### Fixed

- Nutzerwirkung: Das `Single Bull / 25`-Ziel im `Checkout Board Targets`-Overlay bleibt jetzt auch im kleinen Bull-Bereich deutlich besser erkennbar, weil Fokus- und Signal-Darstellung dort sichtbar kräftiger ausfallen statt gegen das Board fast wegzufallen.
  Technik: Die bull-spezifischen Effektprofile verstärken in `focus` und `signal` gezielt Mindest-Opacity, Halo, Konturbreite und Outline-Puls nur für `SB`/Bull-Geometrien; zusätzliche Runtime-Regressionen sichern den stärkeren Sichtbarkeitsvertrag für Bull-Targets und den Signal-Pfad ausdrücklich ab.
- Nutzerwirkung: `Checkout Board Targets` zeigt in X01 unter `180` jetzt standardmäßig immer genau das nächste sinnvolle Feld statt bloß den ersten sichtbaren Suggestion-Schritt, bleibt dabei optisch ruhiger und näher am sauberen nativen Blink-/Fokusgefühl, und die xConfig-Oberfläche wurde auf die klareren Presets `Focus`, `Signal` und `Steady` umgestellt.
  Technik: Eine neue autoritative Checkout-Resolver-Schicht validiert sichtbare Routen gegen Score, Out-Mode und verbleibende Darts, verwirft unplausible DOM-Vorschläge, ergänzt gültige Präfixe notfalls scorebasiert und nutzt neue Domain-Helper für bevorzugte Checkout-Routen; parallel wurden Config- und Legacy-Importpfade auf `visualPreset` migriert, die Board-Styles auf ruhigere Halo-/Opacity-Profile ohne Geometrie-Skalierung umgebaut und zusätzliche Domain-, Runtime-, Config- und xConfig-Regressionen für Smart-Next, Preset-Migration und Retention ergänzt.

## [2.0.99] - 2026-03-30

### Fixed

- Nutzerwirkung: `Checkout Board Targets` trennt Füllung und weiße Zielkontur jetzt sauberer, wodurch Pulse-, Glow- und Blink-Markierungen klarer und hochwertiger wirken; bei `Alle Felder` bleibt das zuerst zu spielende Segment sichtbar am stärksten betont, während Folgeziele ruhiger und versetzt mitlaufen.
  Technik: Die Overlay-Outline klont keine Shape-Klassen oder Inline-Styles mehr mit, `checkout-board-targets` priorisiert Mehrziel-Routen jetzt nur noch im echten All-Route-Fall mit gestaffelten Delays und reduzierter Folgeintensität, verfeinert `glow` und `blink` über eigene Filter-/Timing-Profile, synchronisiert die Nutzertexte auf README-, Docs- und xConfig-Ebene und erweitert die Runtime-Regressionen gezielt für Outline-Isolation, Mehrziel-Hierarchie und Nicht-Pulse-Effektverträge.

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

[2.4.16]: https://github.com/thomasasen/autodarts-xconfig/compare/74b026d...HEAD
[2.4.15]: https://github.com/thomasasen/autodarts-xconfig/compare/99baa67...74b026d
[2.4.14]: https://github.com/thomasasen/autodarts-xconfig/compare/4511528...99baa67
[2.4.13]: https://github.com/thomasasen/autodarts-xconfig/compare/7983e07...4511528
[2.4.12]: https://github.com/thomasasen/autodarts-xconfig/compare/f555f53...7983e07
[2.4.11]: https://github.com/thomasasen/autodarts-xconfig/compare/f1d3f7e...f555f53
[2.4.10]: https://github.com/thomasasen/autodarts-xconfig/compare/185451c...f1d3f7e
[2.4.9]: https://github.com/thomasasen/autodarts-xconfig/compare/68e9ac5...185451c
[2.4.8]: https://github.com/thomasasen/autodarts-xconfig/compare/848458d...68e9ac5
[2.4.7]: https://github.com/thomasasen/autodarts-xconfig/compare/369c519...848458d
[2.4.6]: https://github.com/thomasasen/autodarts-xconfig/compare/4da06d6...369c519
[2.4.5]: https://github.com/thomasasen/autodarts-xconfig/compare/106b63c...4da06d6
[2.4.4]: https://github.com/thomasasen/autodarts-xconfig/compare/e93e11d...106b63c
[2.4.3]: https://github.com/thomasasen/autodarts-xconfig/compare/73900ce...e93e11d
[2.4.2]: https://github.com/thomasasen/autodarts-xconfig/compare/24f6686...73900ce
[2.4.1]: https://github.com/thomasasen/autodarts-xconfig/compare/3803021...24f6686
[2.4.0]: https://github.com/thomasasen/autodarts-xconfig/compare/55a936b...3803021
[2.3.21]: https://github.com/thomasasen/autodarts-xconfig/compare/09ae6b2...55a936b
[2.3.20]: https://github.com/thomasasen/autodarts-xconfig/compare/09ae6b2...d86349d
[2.3.19]: https://github.com/thomasasen/autodarts-xconfig/compare/d48730f...09ae6b2
[2.3.18]: https://github.com/thomasasen/autodarts-xconfig/compare/0c88218...d48730f
[2.3.17]: https://github.com/thomasasen/autodarts-xconfig/compare/3cbf7b3...0c88218
[2.3.16]: https://github.com/thomasasen/autodarts-xconfig/compare/53e5d17...3cbf7b3
[2.3.15]: https://github.com/thomasasen/autodarts-xconfig/compare/aae1311...53e5d17
[2.3.14]: https://github.com/thomasasen/autodarts-xconfig/compare/1ecafb3...aae1311
[2.3.13]: https://github.com/thomasasen/autodarts-xconfig/compare/9d54362...1ecafb3
[2.3.12]: https://github.com/thomasasen/autodarts-xconfig/compare/4e53c2e...9d54362
[2.3.11]: https://github.com/thomasasen/autodarts-xconfig/compare/367c667...4e53c2e
[2.3.10]: https://github.com/thomasasen/autodarts-xconfig/compare/f192692...367c667
[2.3.9]: https://github.com/thomasasen/autodarts-xconfig/compare/d2d1473...f192692
[2.3.8]: https://github.com/thomasasen/autodarts-xconfig/compare/9254b25...d2d1473
[2.3.7]: https://github.com/thomasasen/autodarts-xconfig/compare/22ec8e9...9254b25
[2.3.6]: https://github.com/thomasasen/autodarts-xconfig/compare/9833a5f...22ec8e9
[2.3.5]: https://github.com/thomasasen/autodarts-xconfig/compare/d44c45a...9833a5f
[2.3.3]: https://github.com/thomasasen/autodarts-xconfig/compare/b420891...d44c45a
[2.3.2]: https://github.com/thomasasen/autodarts-xconfig/compare/7b4351b...b420891
[2.3.1]: https://github.com/thomasasen/autodarts-xconfig/compare/d17c15d...7b4351b
[2.3.0]: https://github.com/thomasasen/autodarts-xconfig/compare/da0d5b1...d17c15d
[2.2.0]: https://github.com/thomasasen/autodarts-xconfig/compare/6398977...da0d5b1
[2.1.31]: https://github.com/thomasasen/autodarts-xconfig/compare/4e52392...6398977
[2.1.30]: https://github.com/thomasasen/autodarts-xconfig/compare/982f5f1...4e52392
[2.1.28]: https://github.com/thomasasen/autodarts-xconfig/compare/2f3e796...982f5f1
[2.1.27]: https://github.com/thomasasen/autodarts-xconfig/compare/95e8963...2f3e796
[2.1.26]: https://github.com/thomasasen/autodarts-xconfig/compare/325e508...95e8963
[2.1.25]: https://github.com/thomasasen/autodarts-xconfig/compare/8d47a9c...325e508
[2.1.24]: https://github.com/thomasasen/autodarts-xconfig/compare/17ef31c...8d47a9c
[2.1.23]: https://github.com/thomasasen/autodarts-xconfig/compare/b7334c0...17ef31c
[2.1.22]: https://github.com/thomasasen/autodarts-xconfig/compare/ea036d3...b7334c0
[2.1.18]: https://github.com/thomasasen/autodarts-xconfig/compare/c7223d6...ea036d3
[2.1.17]: https://github.com/thomasasen/autodarts-xconfig/compare/ff5d323...c7223d6
[2.1.16]: https://github.com/thomasasen/autodarts-xconfig/compare/2a4d191...ff5d323
[2.1.14]: https://github.com/thomasasen/autodarts-xconfig/compare/ba09193...2a4d191
[2.1.12]: https://github.com/thomasasen/autodarts-xconfig/compare/1b33189...ba09193
[2.1.9]: https://github.com/thomasasen/autodarts-xconfig/compare/35bc075...1b33189
[2.1.8]: https://github.com/thomasasen/autodarts-xconfig/compare/5d99934...35bc075
[2.1.7]: https://github.com/thomasasen/autodarts-xconfig/compare/4d2f8fd...5d99934
[2.1.6]: https://github.com/thomasasen/autodarts-xconfig/compare/59708e4...4d2f8fd
[2.1.5]: https://github.com/thomasasen/autodarts-xconfig/compare/ba5e325...59708e4
[2.1.4]: https://github.com/thomasasen/autodarts-xconfig/compare/ba5e325...fa4ca1f
[2.1.3]: https://github.com/thomasasen/autodarts-xconfig/compare/ba5e325...1329886
[2.1.2]: https://github.com/thomasasen/autodarts-xconfig/compare/c9b25d4...ba5e325
[2.1.1]: https://github.com/thomasasen/autodarts-xconfig/compare/f0cc281...c9b25d4
[2.1.0]: https://github.com/thomasasen/autodarts-xconfig/compare/340e7b4...f0cc281
[2.0.113]: https://github.com/thomasasen/autodarts-xconfig/compare/340e7b4...ca465fc
[2.0.112]: https://github.com/thomasasen/autodarts-xconfig/compare/2e404db...340e7b4
[2.0.111]: https://github.com/thomasasen/autodarts-xconfig/compare/bb5158a...2e404db
[2.0.110]: https://github.com/thomasasen/autodarts-xconfig/compare/3f4c391...bb5158a
[2.0.109]: https://github.com/thomasasen/autodarts-xconfig/compare/84362ea...3f4c391
[2.0.108]: https://github.com/thomasasen/autodarts-xconfig/compare/382e093...84362ea
[2.0.107]: https://github.com/thomasasen/autodarts-xconfig/compare/eeea914...382e093
[2.0.106]: https://github.com/thomasasen/autodarts-xconfig/compare/d632f40...eeea914
[2.0.105]: https://github.com/thomasasen/autodarts-xconfig/compare/1a0bb49...d632f40
[2.0.104]: https://github.com/thomasasen/autodarts-xconfig/compare/aa62402...1a0bb49
[2.0.103]: https://github.com/thomasasen/autodarts-xconfig/compare/aa62402...1a0bb49
[2.0.102]: https://github.com/thomasasen/autodarts-xconfig/compare/5bccf6d...aa62402
[2.0.101]: https://github.com/thomasasen/autodarts-xconfig/compare/93aa69d...5bccf6d
[2.0.100]: https://github.com/thomasasen/autodarts-xconfig/compare/a9fa2bb...93aa69d
[2.0.99]: https://github.com/thomasasen/autodarts-xconfig/compare/4b18f03...a9fa2bb
[2.0.98]: https://github.com/thomasasen/autodarts-xconfig/compare/bd6c654...652863c
[2.0.96]: https://github.com/thomasasen/autodarts-xconfig/compare/830ce47...bd6c654
[2.0.94]: https://github.com/thomasasen/autodarts-xconfig/compare/8355902...830ce47
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
