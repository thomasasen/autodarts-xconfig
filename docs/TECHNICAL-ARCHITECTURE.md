# Technische Architektur

## Struktur

Die Release-Struktur für `v1.1.0` ist bewusst klar getrennt:

- `src/core`: Bootstrap, DOM-Guards, Event-Bus, Listener- und Observer-Registries
- `src/domain`: Dart-Regeln und regelnahe Auswertung ohne DOM-Abhängigkeit
- `src/features`: UI-Features, Animationen, Themes und die xConfig-Oberfläche
- `src/config`: Defaults, Normalisierung, Persistenz und Legacy-Import
- `src/runtime`: Tampermonkey-Start und öffentliche Runtime-API
- `src/vendors`: gebündelte Third-Party-Bausteine
- `loader`: Userscript-Entry
- `dist`: gebautes Installationsartefakt
- `tests`: Domain-, Runtime- und Dokumentationstests

## Laufzeitmodell

1. Das Userscript aus `loader/autodarts-xconfig.user.js` startet die Runtime.
2. Die Konfiguration wird geladen, normalisiert und bei Bedarf einmalig aus `ad-xconfig:config` migriert.
3. Die Feature-Registry liefert definierte Feature-Metadaten, Mount-Funktionen und optionale Feature-Aktionen.
4. Aktivierte Module werden idempotent gemountet.
5. `xconfig-ui` wird immer aktiv gemountet und steuert Menülayout, Route, Settings-Modal und Feature-Aktionen.
6. Cleanup entfernt Styles, Overlay-Nodes, Listener und Observer sauber.

Wichtig: Wiederholtes Initialisieren bleibt idempotent.

## Domain-Schicht

Die Regelwahrheit liegt ausschließlich in `src/domain`:

- `x01-rules.js`: Segment-Normalisierung, Out-Modi, Checkout-, Bust- und Visit-Auswertung
- `cricket-rules.js`: Zielmengen, Marks, Overflow-Scoring, Target-States und Gewinnerlogik
- `variant-rules.js`: Klassifikation von X01-, Cricket- und Tactics-Varianten
- `dart-rules.js`: Re-Export der Domain-Cluster

Neue reine Helfer in `v1.1.0`:

- `applyX01ThrowsToState({ scoreBefore, outMode, throws })`
- `evaluateCricketWinState({ marksByLabel, scoresByPlayer, scoringMode, targetOrder })`

## Gemeinsame X01-Matchwahrheit

`src/features/x01-checkout-context.js` löst den aktuellen X01-Zustand atomar aus
Game-State und sichtbarer Match-Oberfläche auf. Match, Variante, Out-Modus, Score,
aktiver Spieler, Turn und Wurffortschritt werden immer als zusammengehöriger
Kandidat bewertet; ein als fremd erkannter Snapshot liefert keine einzelnen
Ersatzwerte für das aktuelle Match.

Eindeutig sichtbare Non-X01-Varianten deaktivieren X01-Verbraucher sofort. Bei
abweichenden aktuellen Quellen entscheidet die letzte kohärente State- und
DOM-Signatur über die Fortschrittsrichtung. Nicht auflösbare Erstkonflikte bleiben
`pending` beziehungsweise `conflict` und lösen keine automatische Darstellung aus.

Diese Wahrheit verwenden gemeinsam:

- `checkout-score-highlight`
- `checkout-target-highlights`
- `tv-board-zoom`

Checkout-Target-Retention ist zusätzlich an Match-/Game- und Turn-Grenzen gebunden.
Damit können weder gehaltene Ziele noch Zoom- oder Score-Zustände eine eindeutige
Match- oder Variantengrenze überschreiten.

## Feature-Modell

Jedes Feature exportiert mindestens eine Mount-Funktion und optional eine Action-Funktion.

- Animationen und Themes werden über die Feature-Registry verwaltet.
- Themes sind normale Feature-Module unter `src/features/themes/*`.
- Einzelne Features können zusätzlich `runFeatureAction(featureKey, actionId)` für direkte xConfig-Aktionen nutzen.

## Öffentliche Runtime-API

Die öffentliche Oberfläche bleibt auf `window.__adXConfig` begrenzt.

Verfügbar sind:

- `getConfig()`
- `saveConfig(partialConfig)`
- `resetConfig()`
- `applyRecommendedDefaults()`
- `setFeatureEnabled(featureRef, enabled)`
- `runFeatureAction(featureKey, actionId)`
- `listFeatures()`
- `setThemeBackgroundImage(themeKey, dataUrl)`
- `clearThemeBackgroundImage(themeKey)`

## Build und Tests

Kanonischer Ablauf:

```bash
npm install
npm run build
npm test
```

Optional:

```bash
npm run verify
```

Das gebaute Userscript liegt in `dist/autodarts-xconfig.user.js` und verwendet den Versionsstand aus `package.json`.
