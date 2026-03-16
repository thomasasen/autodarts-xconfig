# Changelog

Alle nennenswerten Änderungen an diesem Projekt werden in dieser Datei festgehalten.

Das Format orientiert sich an [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
und die Versionsvergabe folgt [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Solange dieses Repository noch keine Git-Tags verwendet, verweisen die Versionslinks auf
GitHub-Vergleiche zwischen Release-Commits. Der neueste lokale Release-Eintrag kann bis
zum nächsten Release-Commit vorübergehend auf `HEAD` zeigen.

## [Unreleased]

_Noch keine Änderungen erfasst._

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

[Unreleased]: https://github.com/thomasasen/autodarts-xconfig/compare/1f76798f0a8c495d13d5452a66d65e9d309fb470...HEAD
[2.0.25]: https://github.com/thomasasen/autodarts-xconfig/compare/1f76798f0a8c495d13d5452a66d65e9d309fb470...HEAD
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
