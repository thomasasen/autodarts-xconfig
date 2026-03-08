# Technische Architektur

## Struktur

Die Projektstruktur bleibt für v1.0.0 unverändert:

- `src/core`: Bootstrap, Lifecycle, Listener- und Observer-Registries
- `src/domain`: Spiellogik und Regelbewertung ohne DOM-Abhängigkeit
- `src/features`: modulare Features, Themes und xConfig-UI
- `src/config`: Defaults, Normalisierung, Persistenz und Legacy-Import
- `src/runtime`: Tampermonkey-Start und Public API
- `src/vendors`: eingebundene Vendor-Bausteine
- `loader`: Userscript-Entry
- `dist`: gebautes Installationsartefakt
- `tests`: Domain- und Runtime-Tests

## Laufzeitmodell

1. Das Userscript aus `loader/autodarts-xconfig.user.js` startet die Runtime.
2. Die Konfiguration wird geladen, normalisiert und bei Bedarf aus Legacy-Daten übernommen.
3. Die Feature-Registry liefert alle Definitionsdaten für Animationen und Themes.
4. Aktivierte Module werden idempotent gemountet.
5. Die immer aktive `xconfig-ui` hängt sich an Navigation und DOM an und bleibt ebenfalls idempotent.
6. Cleanup entfernt Styles, Listener und Observer sauber.

Wichtige Eigenschaft: wiederholtes Starten oder erneutes Rendern erzeugt keine doppelten Instanzen.

## Feature- und Theme-Modell

Jedes Feature exportiert eine `mount...`-Funktion und gibt eine Cleanup-Funktion zurück.

Ausgeliefert sind:

- 15 Animationen und Komfortfunktionen
- 5 Themes

Themes sind als normale Feature-Module unter `src/features/themes/*` umgesetzt:

- `theme-x01` mit `themes.x01`
- `theme-shanghai` mit `themes.shanghai`
- `theme-bermuda` mit `themes.bermuda`
- `theme-cricket` mit `themes.cricket`
- `theme-bull-off` mit `themes.bullOff`

Gemeinsame Theme-Logik liegt in `src/features/themes/shared`.

## AD xConfig-Oberfläche

Die zentrale Oberfläche ist als eigenes Modul unter `src/features/xconfig-ui` umgesetzt und wird beim Runtime-Start immer aktiv gemountet.
Sie ist absichtlich kein normales Endnutzer-Toggle in der Feature-Registry.

Sie übernimmt:

- das einmalige Einfügen des Menüeintrags `AD xConfig`
- das routenbasierte Anzeigen des Panels unter `/ad-xconfig`
- das Rendern von Tabs für `Themen` und `Animationen`
- das Speichern von Feature- und Theme-Einstellungen über `window.__adXConfig`

Für Stabilität nutzt die Shell ausschließlich die vorhandenen Registries und DOM-Guards:

- keine direkten doppelten Listener
- keine unkontrollierten zusätzlichen MutationObserver
- idempotente DOM-Injektion

## Konfiguration

Die Feature-Konfiguration bleibt kompatibel zum bestehenden Runtime-Modell.

Wichtige Pfade:

- klassische Features unter `features.<featureKey>`
- Theme-Features unter `features.themes.<themeKey>`
- Aktivierungsstatus zusätzlich über `featureToggles`, auch für dotted keys wie `themes.x01`

Theme-Hintergründe werden pro Theme als Data-URL gespeichert.

## Asset-Strategie

PNG- und MP3-Dateien werden über einen gemeinsamen Alias aufgelöst:

- Browser-Build: `src/shared/feature-assets.browser.js`
- Node/Test-Umgebung: `src/shared/feature-assets.node.js`

Dadurch bleiben der Userscript-Build und die Runtime mit echten Assets intakt, während Tests unter Node keine Binärimporte direkt laden müssen.

## Public API

Die öffentliche Oberfläche bleibt auf `window.__adXConfig` begrenzt.

Verfügbar sind:

- `getConfig()`
- `saveConfig(partialConfig)`
- `resetConfig()`
- `setFeatureEnabled(featureRef, enabled)`
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

Das gebaute Userscript liegt in `dist/autodarts-xconfig.user.js` und enthält den vollständigen Tampermonkey-Header mit `@version 1.0.0`, `@match https://play.autodarts.io/*` und `@grant none`.
