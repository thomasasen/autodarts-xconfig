# Cricket-/Tactics-Layout: Umsetzung und QS

Stand: 2. Oktober 2026. Die erste QS prüfte den lokalen Quellcode. Die ergänzende Browserprüfung und ihre Grenzen stehen unten. Durch den Agenten wurde kein Build, keine Installation und keine Veröffentlichung ausgeführt.

## Umgesetzte Konfiguration

| Bereich | Optionen und Verhalten |
| --- | --- |
| Neue Layout-Karte | Ausgewogen, Fernansicht, Mehrspieler; automatische oder betonte Tabelle/Board-Aufteilung; Mark- und Zielgrößen; Namen-/Punkteschrift; normale oder kompakte Abstände. |
| Spieleranzeige | Native Anzeige, Kopfmarkierung, zusätzliche Spaltenlinie oder dezente Spaltenfläche; ein- oder zweizeilige Namen; native Nebenstatistiken normal, dezent oder aus. |
| Tactics | Erbt Cricket-Einstellungen oder verwendet separat gespeicherte Layoutwerte. Ausgeschaltete Tactics-Sonderwerte bleiben gespeichert. |
| Tabellenstatus | Ruhig oder Belebt; Farbe oder Farbe mit Muster; Punktemöglichkeiten und Gegnerdruck aus, als Rand oder mit Fläche; für alle geschlossene Ziele zurücknehmen; Trefferfeedback aus, Impuls oder Impuls mit Änderungsanzeige. |
| Board | Ruhig oder Lernen; offene und für alle geschlossene Ziele; bisherige Abdunklungsarten; Farbe oder Muster; Intensität. |
| Kompatibilität | Bestehende Einzeloptionen und Farbpaletten bleiben erhalten; Blau/Orange kommt hinzu. Profile ändern ausschließlich ihre eigene Karte und erhalten die Farbpalette. Einzeländerungen ergeben das berechnete Profil Benutzerdefiniert. |

Frische Konfigurationen verwenden die ruhigen Empfehlungen für Board und Tabellenstatus. Die Module sind weiterhin abschaltbar; das neue Layout ist zunächst ausgeschaltet. Bestehende gespeicherte Einstellungen behalten ihre bisherigen Werte und den bisherigen Darstellungsstil.

Die native Zielreihenfolge, Spielerzuordnung, Marks und Board-Knoten bleiben erhalten. Das Layout setzt eigene Attribute und CSS-Variablen. Beim Abschalten werden diese entfernt beziehungsweise wiederhergestellt. Die Platzverteilung zwischen Tabelle und Board wird nur bei eindeutig erkannter gemeinsamer Anordnung angepasst.

## Zwischen-QS

1. Layout und native Struktur: 30 fokussierte Tests bestanden. Geprüft wurden unter anderem Cricket/Tactics, unterschiedliche native Tabellenanordnungen, Spielerwechsel, Größenberechnung, DOM-Ersatz und Cleanup. Eine widersprüchliche native Beschriftungsfarbe im bisherigen Effektstil wurde dabei entfernt.
2. Konfiguration und xConfig: Profilwechsel, getrennte Tactics-Werte, bedingte Felder, atomisches Speichern, bestehende Werte und stabile Dialogcontainer geprüft. Benutzerdefiniert ist eine Zustandsanzeige und kein auswählbares Preset.
3. Schlussprüfung der Optionen: Erweiterte Einzeloptionen können nach einer übergeordneten Aus-Einstellung wieder aktivieren. Ihre Änderung übernimmt den bisherigen Darstellungsstil des jeweiligen Effekts. Ein Regressionstest prüft Punktefläche, Druckkante und Druckfläche.

## Schluss-QS

**Tier 2: Cricket/Tactics und betroffene Konfigurations-/UI-Schnittstellen.** 369 Tests in 22 ausgewählten Testdateien bestanden; keine Fehler, ausgelassenen oder abgebrochenen Tests.

| Prüfbereich | Abdeckung |
| --- | --- |
| Regeln und Zustand | Cricket-Regeln, Mark-Parser, Render-State, Zielprioritäten, Cricket/Tactics-Status und Musterwinkel. |
| Layout und DOM | 1–6 Spieler, 7/12 Ziele, Größenanpassung, Zeilen-/Spaltenanordnung, aktive Zuordnung, uneindeutiger Aktivstatus, Grid-Ersatz, verschachtelte MPR-Anzeige, native Board-Geometrie und Cleanup. |
| Einstellungen | Normalisierung, Empfehlungen bei frischer Konfiguration, bestehende Konfigurationen, Alt-Aliase, Profiländerungen, Tactics-Vererbung und Export/Import. |
| xConfig und Integration | Registrierung, Gruppierung, bedingte Felder, Dialogaktualisierung, Aktionen, Preview-Zuordnung und Zusammenspiel mit vorhandenen Layout-/Theme-Modulen. |

Ausgeführter Testumfang:

```powershell
node --test `
  tests/domain/cricket-rules.test.js `
  tests/runtime/cricket-layout.test.js `
  tests/runtime/modern-cricket-surface.test.js `
  tests/runtime/cricket-render-state.test.js `
  tests/runtime/cricket-row-repair.test.js `
  tests/runtime/cricket-degraded-host-recovery.test.js `
  tests/runtime/cricket-grid-status-effects.test.js `
  tests/runtime/cricket-target-highlighter-priority.test.js `
  tests/runtime/cricket-mark-parser.test.js `
  tests/runtime/feature-config-spec.test.js `
  tests/runtime/feature-registry.test.js `
  tests/runtime/runtime-config.test.js `
  tests/runtime/config-store.test.js `
  tests/runtime/config-transfer.test.js `
  tests/runtime/xconfig-shell.test.js `
  tests/runtime/xconfig-action-controller.test.js `
  tests/runtime/xconfig-structure-consistency.test.js `
  tests/runtime/xconfig-ui-helpers.test.js `
  tests/runtime/xconfig-path-utils.test.js `
  tests/runtime/xconfig-preview-assets.test.js `
  tests/runtime/theme-game-layout.test.js `
  tests/runtime/global-theme-modules.test.js
```

Zusätzlich bestanden: ESLint für sämtliche geänderten JavaScript-/MJS-Quell- und Testdateien sowie Diff-Whitespace-Prüfung. README und Funktionsdokumentation wurden mit `npm run sync:xconfig-docs` aus den Deskriptoren erzeugt. Die neue schematische Vorschaukachel wurde mit dem Generator erzeugt und visuell geprüft.

## Ergänzende Browserprüfung und Nachbesserung

Im vorhandenen Chrome-Tab lief die installierte Version 3.2.2 bereits mit der neuen Layout-Karte. Geprüft wurden ein Tactics-Match mit zwei Spielern und zwölf Zielen bei 1536 × 808 Pixeln sowie der Layout-Dialog. Ausgangswerte waren ein benutzerdefiniertes Layout mit Board-Betonung, großen Texten, sehr großen Marks und einzeiligen Namen. Der Wechsel auf Ausgewogen wurde gespeichert und im Match sichtbar: Die Tabelle erhielt 53 Prozent der gemeinsamen Fläche; Namen wurden mit 20 Pixeln und zwei reservierten Zeilen dargestellt. Native Marks, Zielreihenfolge und Spielerpositionen blieben sichtbar erhalten.

Die Browserprüfung belegte drei Schwächen:

1. Die aktuelle native Anzeige enthält eine große Punktzahl und eine kleinere, unbeschriftete Statistikplakette. Beide Zahlen wurden als Punktzahl vergrößert; die bisherige MPR-Erkennung erfasste diese Plakette nicht.
2. Zweizeilige Namen wurden höher als die native Namensplakette. Der Text lag dadurch teilweise außerhalb ihrer Hintergrundfläche.
3. Der Layout-Dialog enthielt rund 2361 Pixel Inhalt bei 712 Pixel Dialoghöhe. Detailoptionen dominierten die Bedienung.

Im Quellcode korrigiert:

- Nur eine eindeutig erkannte Hauptpunktzahl wird vergrößert. Beschriftete MPR-Werte und die erkannten nativen Statistikplaketten sind unabhängig als Nebenstatistiken einstellbar. Der gespeicherte Schlüssel `mpr` bleibt kompatibel.
- Namensplakette und zugehörige SVG-Form erhalten dieselbe, zur Zeilenzahl passende Höhe.
- Layoutprofil und Platzverteilung bleiben direkt sichtbar; Größen, Namen, Nebenstatistiken, Aktivmarkierung und Diagnose sind unter Erweitert gebündelt.
- Die separate Tactics-Abstandsauswahl entfällt, weil die Geometrie dort ohnehin kompakte Abstände verwendet. Alte Werte bleiben im Backup-Schema erhalten, damit Import und Export die gespeicherten Profile nicht verändern.

Zwei neue Regressionstests reproduzierten die Headerfehler zunächst mit Fehlern und bestanden nach der Korrektur. Die ergänzende Schluss-QS auf Tier 2 bestand anschließend mit **151/151 Tests in acht Dateien**: `cricket-layout`, `modern-cricket-surface`, `xconfig-shell`, `xconfig-structure-consistency`, `config-transfer`, `feature-config-spec`, `runtime-config` und `xconfig-path-utils` unter `tests/runtime/`. ESLint für die in dieser Nachbesserung geänderten JavaScript-Dateien bestanden. README und Funktionsdokumentation wurden erneut generiert.

Die Teständerungen an der Browser-Konfiguration wurden auf die erfassten Ausgangswerte zurückgestellt. Der Wechsel zwischen Match und xConfig sowie die Wiederverwendung der Browser-Bindings wurden auf ausdrücklichen Benutzerwunsch als Arbeitsablauf gespeichert.

Eine direkte JavaScript-Konfigurationsänderung war über die Browser-Verbindung nicht möglich: Sie erlaubte nur lesende JavaScript-Auswertungen und stellte `window.__adXConfig` nicht bereit. Größen und sichtbare Zustände wurden per JavaScript gelesen; Einstellungen wurden über die Oberfläche geändert.

## Verbleibende Prüfgrenzen

- Das ursprüngliche Tactics-Match zeigte während der Prüfung einen Autodarts-Fehler und war anschließend nicht mehr verfügbar. Weitere Profilvergleiche, ein Cricket-Match, mehrere Spieler und andere Bildschirmformate wurden deshalb nicht live geprüft.
- Die Nachbesserungen an Headern und Dialog wurden noch nicht neu gebaut oder installiert und damit noch nicht im echten Browser überprüft. Die Browserbeobachtungen beziehen sich auf den davor installierten Stand.
- Lesbarkeit aus Wurfentfernung, tatsächliche Kontraste und Platzverteilung auf unterschiedlichen Bildschirmformaten benötigen eine Prüfung am installierten System.
- Native Board-Knoten und SVG-Geometrie wurden im Harness erhalten; manuelle Treffer-Eingabe und Korrekturen wurden nicht live bedient.
- Die Vorschau ist ein illustriertes Beispiel und kein Screenshot eines installierten Matches.

Breitere Repository-Prüfungen, SonarQube, vollständiger Build und Release-Prüfungen wurden gemäß AGENTS.md nicht ausgeführt: Die Änderung betrifft das Cricket/Tactics-Subsystem und seine bestehenden Konfigurations-/UI-Schnittstellen; eine Veröffentlichung ist nicht Teil des Auftrags. Eine zwischenzeitlich extern vorgenommene Änderung in `dist/` wurde durch den Agenten nicht bearbeitet.

Commit-Entwurf für die Nachbesserung: `fix(cricket): fit native player headers and simplify layout settings`
