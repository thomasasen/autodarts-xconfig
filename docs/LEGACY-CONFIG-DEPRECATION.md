# Legacy-Konfigurationspfade und Deprecation-Plan

## Zweck

Diese Datei dokumentiert Legacy-Konfigurationspfade, die weiterhin akzeptiert oder importiert werden. Sie ist ein Deprecation-Plan; in diesem Auftrag wurde keine Legacy-Kompatibilität entfernt.

## Aktueller Stand

Die aktuelle Konfiguration liegt unter `autodarts-xconfig:config:v1`. Beim Laden normalisiert `src/config/runtime-config.js` Werte in `normalizeRuntimeConfig()`. Beim Speichern schreibt `src/config/config-store.js` bereits normalisierte Werte zurück.

Einmalige Altbestand-Übernahme erfolgt über `createConfigStore().importLegacyConfigIfAvailable()`: gelesen wird `ad-xconfig:config`, gesteuert durch `autodarts-xconfig:legacy-imported:v2`, gemappt durch `mapLegacyConfig()`, und bei Erfolg in den aktuellen Storage-Key geschrieben.

## Inventar

| ID | Bereich | Legacy-Wert oder Legacy-Key | Kanonischer Wert | Datei und Funktion | Persistentes Writeback? | Aktuell noch erforderlich? | Entfernung frühestens | Voraussetzungen für Entfernung |
|---|---|---|---|---|---|---|---|---|
| LC-001 | Storage | `ad-xconfig:config` | `autodarts-xconfig:config:v1` | `src/config/config-store.js` `importLegacyConfigIfAvailable()` | Ja, importierte Werte werden in den aktuellen Key geschrieben | Ja, für Nutzer mit altem Userscript-Storage | Nach einer Version mit angekündigter Deprecation, nicht vor `2.4.0` ableitbar | Telemetrie/Support-Feedback oder klare Release-Notiz, Tests für Import-Blockierung und aktuellen Storage |
| LC-002 | Storage | fehlende oder alte Importmarkierung | `autodarts-xconfig:legacy-imported:v2` | `src/config/config-store.js` `importLegacyConfigIfAvailable()` | Ja, Flag wird gesetzt | Ja, verhindert wiederholte Altimporte | Nicht vor `2.4.0` ableitbar | Tests für `already-imported`, `existing-current-config`, `no-compatible-legacy-config` |
| LC-003 | Feature-Import | Legacy `features[legacyFeatureId]` | aktueller `configKey` je Feature | `src/config/config-store.js` `mapLegacyConfig()` und `src/config/feature-config-spec.js` `LEGACY_IMPORTERS` | Ja, gemappte Config wird gespeichert | Ja, solange LC-001 aktiv bleibt | Gemeinsam mit LC-001 | Importtests pro unterstütztem Legacy-Modul |
| LC-004 | Legacy-Settings | Kurzkeys wie `EFFEKT` | aktueller Feldname wie `effect` | `src/config/feature-config-spec.js` `readLegacySetting()` | Ja, über Import | Ja, solange Legacy-Import aktiv bleibt | Gemeinsam mit LC-001 | Fixture mit unpräfigierten Legacy-Settings |
| LC-005 | Legacy-Settings | Präfixkeys wie `xConfig_EFFEKT` | aktueller Feldname wie `effect` | `src/config/feature-config-spec.js` `readLegacySetting()` | Ja, über Import | Ja, solange Legacy-Import aktiv bleibt | Gemeinsam mit LC-001 | Fixture mit präfigierten Legacy-Settings |
| LC-006 | Boolean-Werte | `true`, `1`, `yes`, `on`, `active`, `aktiv` | `true` | `src/config/feature-config-spec.js` und `src/config/runtime-config.js` `normalizeBoolean()` | Ja, bei Save/Update/Import | Ja, auch für robuste Config-Eingaben | Nicht empfohlen ohne Schema-Version | Tests für String-Boolean-Normalisierung |
| LC-007 | Boolean-Werte | `false`, `0`, `no`, `off`, `inactive`, `inaktiv` | `false` | `src/config/feature-config-spec.js` und `src/config/runtime-config.js` `normalizeBoolean()` | Ja, bei Save/Update/Import | Ja, auch für robuste Config-Eingaben | Nicht empfohlen ohne Schema-Version | Tests für String-Boolean-Normalisierung |
| LC-008 | Checkout Score Pulse | RGB ohne Leerzeichen, z. B. `159,219,88` | RGB mit Leerzeichen, z. B. `159, 219, 88` | `src/config/feature-config-spec.js` `normalizeLegacyColorTheme()` | Ja | Ja, Import und rohe gespeicherte Config | Nicht vor `2.4.0` ableitbar | Tests für alle `LEGACY_COLOR_THEME_ALIASES` |
| LC-009 | Checkout Board Targets | `effect: blink` | `visualPreset: signal` | `src/config/feature-config-spec.js` `resolveLegacyBoardTargetVisualPreset()` | Ja | Ja, alter Effektname wird noch normalisiert | Nicht vor `2.4.0` ableitbar | Tests für `blink` ohne expliziten kompatiblen Preset |
| LC-010 | Checkout Board Targets | `effect: glow` | `visualPreset: steady` | `src/config/feature-config-spec.js` `resolveLegacyBoardTargetVisualPreset()` | Ja | Ja, alter Effektname wird noch normalisiert | Nicht vor `2.4.0` ableitbar | Tests für `glow` ohne expliziten kompatiblen Preset |
| LC-011 | Dart Marker Darts | `Dart_*.png` oder Dateiname in `DART_DESIGN` | Design-Key ohne Prefix/Suffix | `src/config/feature-config-spec.js` `normalizeLegacyDartDesign()` | Ja, über Import | Ja, für alte Dart-Design-Settings | Nicht vor `2.4.0` ableitbar | Importtests für Dateinamen und kanonische Keys |
| LC-012 | Dart Marker Darts | Größe `90` | `108` | `src/config/feature-config-spec.js` `normalizeDartMarkerDartsSizePercent()` | Ja | Ja, rohe Config kann alte Größe enthalten | Nicht vor `2.4.0` ableitbar | Tests für alte Dartgrößen |
| LC-013 | Dart Marker Darts | Größe `100` | `120` | `src/config/feature-config-spec.js` `normalizeDartMarkerDartsSizePercent()` | Ja | Ja, rohe Config kann alte Größe enthalten | Nicht vor `2.4.0` ableitbar | Tests für alte Dartgrößen |
| LC-014 | Dart Marker Darts | Größe `115` | `138` | `src/config/feature-config-spec.js` `normalizeDartMarkerDartsSizePercent()` | Ja | Ja, rohe Config kann alte Größe enthalten | Nicht vor `2.4.0` ableitbar | Tests für alte Dartgrößen |
| LC-015 | Turn Points Count | Dauer `260`, `416`, `650`, `950`, `1300` | `1000` | `src/config/feature-config-spec.js` `normalizeTurnPointsCountDuration()` | Ja | Ja, alte Speed-Presets bleiben lesbar | Nicht vor `2.4.0` ableitbar | Tests für kurze Legacy-Dauern |
| LC-016 | Turn Points Count | Dauer `1500`, `2000` | `3000` | `src/config/feature-config-spec.js` `normalizeTurnPointsCountDuration()` | Ja | Ja, alte Speed-Presets bleiben lesbar | Nicht vor `2.4.0` ableitbar | Tests für mittlere Legacy-Dauern |
| LC-017 | Turn Points Count | Dauer `1400`, `2250` | `5000` | `src/config/feature-config-spec.js` `normalizeTurnPointsCountDuration()` | Ja | Ja, alte Speed-Presets bleiben lesbar | Nicht vor `2.4.0` ableitbar | Tests für ruhige Legacy-Dauern |
| LC-018 | Turn Points Count | `flashPermanent: true` | `flashMode: permanent` | `src/config/feature-config-spec.js` `FEATURE_NORMALIZERS.turnPointsCount()` | Ja | Ja, alter Boolean steuert weiterhin Modus | Nicht vor `2.4.0` ableitbar | Tests für `flashPermanent` vor `flashMode` |
| LC-019 | Turn Points Count | `flashPermanent: false` | `flashMode: on-change` | `src/config/feature-config-spec.js` `FEATURE_NORMALIZERS.turnPointsCount()` | Ja | Ja, alter Boolean steuert weiterhin Modus | Nicht vor `2.4.0` ableitbar | Tests für `flashPermanent` vor `flashMode` |
| LC-020 | Turn Points Count | `appear`, `burst`, `nur-bei-änderung`, `nur-bei-aenderung` | `on-change` | `src/config/feature-config-spec.js` `FEATURE_NORMALIZERS.turnPointsCount()` | Ja | Ja, rohe Config kann alte Labels enthalten | Nicht vor `2.4.0` ableitbar | Tests für `flashMode`-Aliase |
| LC-021 | Turn Points Count | `always`, `persistent`, `dauerhaft` | `permanent` | `src/config/feature-config-spec.js` `FEATURE_NORMALIZERS.turnPointsCount()` | Ja | Ja, rohe Config kann alte Labels enthalten | Nicht vor `2.4.0` ableitbar | Tests für permanente `flashMode`-Aliase |
| LC-022 | Triple/Double/Bull Hits | alte `animationStyle`-Aliases wie `impact-pop`, `charge-release`, `snap-bounce`, `neon-pulse`, `sweep-shine`, `card-slam`, `flip-edge`, `signal-blink`, `stagger-wave` | reduzierte Stilwerte `emphasis`, `shake`, `pulse`, `sheen`, `turn` | `src/config/feature-config-spec.js` `TRIPLE_DOUBLE_BULL_ANIMATION_STYLE_ALIASES` | Ja | Ja, gespeicherte alte Effektbezeichnungen bleiben kompatibel | Nicht vor `2.4.0` ableitbar | Tests je Aliasgruppe |
| LC-023 | Triple/Double/Bull Hits | `hitColorMode: theme-presets` ohne `colorTheme` | `colorTheme: champagne-night` | `src/config/feature-config-spec.js` `FEATURE_NORMALIZERS.tripleDoubleBullHits()` | Ja | Ja, alte Farbauswahl bleibt semantisch erhalten | Nicht vor `2.4.0` ableitbar | Test für Fallback-Farbe bei altem Modus |
| LC-024 | Cricket Highlighter | `showOpenTargets` | `showOpenObjectives` | `src/config/feature-config-spec.js` `FEATURE_NORMALIZERS.cricketHighlighter()` | Ja | Ja, alte Zielbezeichnung bleibt lesbar | Nicht vor `2.4.0` ableitbar | Tests für alte und neue Keys |
| LC-025 | Cricket Highlighter | `showDeadTargets` | `showDeadObjectives` | `src/config/feature-config-spec.js` `FEATURE_NORMALIZERS.cricketHighlighter()` | Ja | Ja, alte Zielbezeichnung bleibt lesbar | Nicht vor `2.4.0` ableitbar | Tests für alte und neue Keys |
| LC-026 | Cricket Highlighter | `dimIrrelevantBoardTargets: false` | `irrelevantBoardDimStyle: off` | `src/config/feature-config-spec.js` `FEATURE_NORMALIZERS.cricketHighlighter()` | Ja | Ja, alte Boolean-Option bleibt kompatibel | Nicht vor `2.4.0` ableitbar | Tests für Boolean-zu-Enum-Mapping |
| LC-027 | Cricket Highlighter | `dimIrrelevantBoardTargets: true` | `irrelevantBoardDimStyle: smoke` | `src/config/feature-config-spec.js` `FEATURE_NORMALIZERS.cricketHighlighter()` | Ja | Ja, alte Boolean-Option bleibt kompatibel | Nicht vor `2.4.0` ableitbar | Tests für Boolean-zu-Enum-Mapping |
| LC-028 | Cricket Grid FX | `threatEdge` | `pressureEdge` | `src/config/feature-config-spec.js` `FEATURE_NORMALIZERS.cricketGridFx()` | Ja | Ja, alte Effektbezeichnung bleibt lesbar | Nicht vor `2.4.0` ableitbar | Tests für alte Grid-FX-Keys |
| LC-029 | Cricket Grid FX | `scoringLane` | `scoringStripe` | `src/config/feature-config-spec.js` `FEATURE_NORMALIZERS.cricketGridFx()` | Ja | Ja, alte Effektbezeichnung bleibt lesbar | Nicht vor `2.4.0` ableitbar | Tests für alte Grid-FX-Keys |
| LC-030 | Cricket Grid FX | `deadRowCollapse` | `deadRowMuted` | `src/config/feature-config-spec.js` `FEATURE_NORMALIZERS.cricketGridFx()` | Ja | Ja, alte Effektbezeichnung bleibt lesbar | Nicht vor `2.4.0` ableitbar | Tests für alte Grid-FX-Keys |
| LC-031 | Cricket Grid FX | `opponentPressureOverlay` | `pressureOverlay` | `src/config/feature-config-spec.js` `FEATURE_NORMALIZERS.cricketGridFx()` | Ja | Ja, alte Effektbezeichnung bleibt lesbar | Nicht vor `2.4.0` ableitbar | Tests für alte Grid-FX-Keys |
| LC-032 | X01 Score Progress | `thresholdColorMode` | `colorTheme` | `src/config/feature-config-spec.js` `FEATURE_NORMALIZERS.x01ScoreProgress()` | Ja | Ja, alte Farbquelle bleibt lesbar | Nicht vor `2.4.0` ableitbar | Tests für Fallback auf `thresholdColorMode` |
| LC-033 | X01 Score Progress | alte Effekte wie `electric-surge`, `pulse-on-change`, `charge-release`, `sheen-sweep`, `checkout-glow`, `burn-down`, `segment-pop`, `spark-trail`, `heat-edge`, `danger-flicker`, `electric-border`, `arc-burst` | reduzierte Effektwerte `signal-sweep`, `pulse-core`, `glass-charge`, `segment-drain`, `ghost-trail` | `src/config/feature-config-spec.js` `FEATURE_NORMALIZERS.x01ScoreProgress()` | Ja | Ja, alte Effektbezeichnungen bleiben lesbar | Nicht vor `2.4.0` ableitbar | Tests je Aliasgruppe |
| LC-034 | X01 Score Progress | `designPreset` | kein aktueller Wert; wird entfernt | `src/config/feature-config-spec.js` `FEATURE_REMOVE_KEYS` und `src/config/runtime-config.js` `getFeatureConfig()` | Ja, normalisierte Config enthält den Key nicht | Ja, verhindert Persistenz pensionierter Felder | Nicht relevant als Kompatibilitätsentfernung | Tests, dass `designPreset` weiterhin aus normalisierter Config entfernt wird |
| LC-035 | Theme-Key | `x01-2player`, `x01 two player`, `x01_two_player`, `x01-two-player` | `x01TwoPlayer` | `src/shared/theme-key-utils.js` `normalizeThemeKey()` | Nein, Normalisierungshilfe | Ja, wird modulübergreifend zur robusten Theme-Erkennung genutzt | Nicht empfohlen ohne Pfadaudit | Tests für Theme-Aliase |
| LC-036 | Theme-Key | `tactics` | `cricket` | `src/shared/theme-key-utils.js` `normalizeThemeKey()` | Nein, Normalisierungshilfe | Ja, Tactics wird als Cricket-nahe Theme-Variante behandelt | Nicht empfohlen ohne Modus-Audit | Tests für Tactics-Theme-Normalisierung |
| LC-037 | Theme-Key | `bull-off`, `bull_off`, `bull off` | `bullOff` | `src/shared/theme-key-utils.js` `normalizeThemeKey()` | Nein, Normalisierungshilfe | Ja, alte Schreibweisen bleiben robust | Nicht empfohlen ohne Pfadaudit | Tests für Bull-off-Aliase |
| LC-038 | Feature-Toggle-Pfade | verschachtelte Toggle-Pfade in `featureToggles` | flache `featureToggles[configKey]` plus `features`-Pfad | `src/config/runtime-config.js` `getRawFeatureToggle()` | Ja, normalisierte Config schreibt flache Keys | Ja, robuste Kompatibilität für alte/verschachtelte Shapes | Nicht vor `2.4.0` ableitbar | Tests für verschachtelte Toggle-Pfade |
| LC-039 | Unbekannte Felder | nicht mehr bekannte Feature-Felder | bleiben erhalten außer explizite `removeKeys` | `src/config/runtime-config.js` `mergeFeatureConfigWithUnknownFields()` | Ja, unbekannte Felder bleiben erhalten | Ja, vermeidet Datenverlust bei Schema-Drift | Nicht empfohlen ohne Schema-Version | Tests für unbekannte Felder und explizite Remove-Keys |
| LC-040 | Theme-Bilder | ungültige Bildwerte | leere Zeichenfolge; nur `data:image/` bleibt | `src/config/feature-config-spec.js` und `src/config/runtime-config.js` `normalizeThemeBackgroundImage()` | Ja | Ja, robuste Migration gespeicherter Bildfelder | Nicht empfohlen | Tests für gültige/ungültige Data-URLs |
| LC-041 | Theme-Presets | ungültiger `backgroundAssetKey` | leere Zeichenfolge; gültige Preset-Keys bleiben | `src/config/feature-config-spec.js` `normalizeThemeBackgroundAssetKey()` | Ja | Ja, robust gegen entfernte oder alte Preset-Keys | Nicht empfohlen ohne Preset-Migration | Tests für Preset-Key-Set |
| LC-042 | Templates Global | `scores-only` | `["scores"]` | `src/shared/theme-global-typography-presets.js` `getThemeGlobalTypographyScopeValues()` | Ja, wenn über Config-Normalisierung gespeichert | Ja, alte Scope-Presets bleiben lesbar | Nicht vor `2.4.0` ableitbar | Tests für Scope-Aliaswerte |
| LC-043 | Templates Global | `scores-and-throws` | `["scores", "throws"]` | `src/shared/theme-global-typography-presets.js` `getThemeGlobalTypographyScopeValues()` | Ja, wenn über Config-Normalisierung gespeichert | Ja, alte Scope-Presets bleiben lesbar | Nicht vor `2.4.0` ableitbar | Tests für Scope-Aliaswerte |
| LC-044 | Templates Global | `scores-and-names` | `["scores", "names"]` | `src/shared/theme-global-typography-presets.js` `getThemeGlobalTypographyScopeValues()` | Ja, wenn über Config-Normalisierung gespeichert | Ja, alte Scope-Presets bleiben lesbar | Nicht vor `2.4.0` ableitbar | Tests für Scope-Aliaswerte |
| LC-045 | UI-Route | Pfad `/ad-xconfig` | Hash-Route für das xConfig-Menü | `src/features/xconfig-ui/layout-utils.js` `isLegacyConfigPath()` und `src/features/xconfig-ui/route-controller.js` | Nein, URL wird zur Laufzeit normalisiert | Ja, schützt alte Direktlinks vor Reload-404 | Nicht empfohlen ohne Navigation-Audit | Tests für Legacy-Pfad-Normalisierung |
| LC-046 | Dart Marker Darts Runtime | Größen `90`, `100`, `115` | `108`, `120`, `138` | `src/features/dart-marker-darts/style.js` `resolveDartMarkerDartsConfig()` | Nein, Runtime-Auflösung | Ja, schützt direkte Runtime-Config-Inputs | Gemeinsam mit LC-012 bis LC-014 | Runtime-Style-Tests nach Entfernung der Config-Aliase |
| LC-047 | Triple/Double/Bull Hits Runtime | alte `animationStyle`-Aliases | reduzierte Stilwerte | `src/features/triple-double-bull-hits/logic.js` `normalizeAnimationStyle()` | Nein, Runtime-Auflösung | Ja, schützt direkte Runtime-Config-Inputs | Gemeinsam mit LC-022 | Runtime-Tests für Aliasentfernung |
| LC-048 | Winner Fireworks DOM | `.ad-ext_winner-animation` | `.ad-ext-player-winner` plus Match-State | `src/features/winner-fireworks/logic.js` `getWinnerSignal()` | Nein | Ja, Legacy-DOM-Signal wird nur zusammen mit State-Gewinner akzeptiert | Nicht empfohlen ohne Live-DOM-Audit | DOM-Tests für Winner-Erkennung ohne altes Signal |
| LC-049 | X01 Score Progress DOM | Klasse `ad-ext-x01-score-progress__fill--effect-electric-surge` | aktueller Effektklassen-Satz | `src/features/x01-score-progress/logic.js` `clearFillEffectClasses()` und `syncFillEffectClass()` | Nein | Ja, entfernt alte Klasse bei Effektwechsel | Nicht empfohlen ohne Style-Cleanup-Test | Tests, dass alte Klassen entfernt werden |

## Sichere Beibehaltung

Die Boolean-Normalisierung, Theme-Key-Aliase, unbekannte Feld-Erhaltung, Data-URL-Filter, Legacy-Route-Normalisierung und Runtime-Cleanup-Aliase sind nicht nur Legacy-Importe, sondern allgemeine Robustheitsmechanismen. Sie sollten nur mit einer neuen Config-Schema-Version und gezielten Migrationstests entfernt werden.

## Kandidaten für spätere Entfernung

Kandidaten sind vor allem abgeschlossene Importpfade: `ad-xconfig:config`, `LEGACY_IMPORTERS`, alte Setting-Kurzkeys, alte Dartgrößen, alte Effekt-Aliase, alte Scope-Presets und alte Cricket-Grid-Keynamen. Eine Entfernung sollte nur nach Release-Notiz, Support-Fenster und Regressionstests erfolgen.

## Noch unklare Fälle

Unklar bleibt, ob aktive Nutzer noch alte Storage-Werte besitzen. Ebenfalls statisch nicht vollständig beweisbar ist, ob externe Konfigurationsimporte bewusst alte Aliaswerte schreiben.

## Erforderliche Regressionstests vor einer Entfernung

- Import mit unpräfigierten und `xConfig_`-präfigierten Legacy-Settings.
- Import je Legacy-Feature-ID aus `featureCatalog`.
- Normalisierung alter Effekt-, Farb-, Theme-, Dartgrößen- und Boolean-Werte.
- Persistenztests, die bestätigen, ob Werte nach `save()` und `update()` weiterhin kanonisch geschrieben werden.
- Negativtests für entfernte Pfade, sobald eine neue Schema-Version alte Werte nicht mehr akzeptieren soll.

## Empfohlenes Vorgehen für spätere Versionen

1. In einer Release-Notiz ankündigen, welche Legacy-Pfade entfallen sollen.
2. Für mindestens eine Version weiter importieren und bei Bedarf Debug-Hinweise sammeln.
3. Tests für aktuelle Config ohne Legacy-Pfade stärken.
4. Danach Legacy-Importe in kleinen Gruppen entfernen, beginnend mit reinen Aliaswerten.
5. Storage-Key-Migration erst zuletzt entfernen.
