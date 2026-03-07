# Technische Architektur

## Struktur

Die Projektstruktur bleibt stabil:

- `src/core`: Bootstrap, Lifecycle, Event-Bus, Listener-/Observer-Registries
- `src/domain`: Regeln für X01, Varianten, Cricket/Tactics (ohne DOM)
- `src/features`: modulare Features inklusive Themes
- `src/config`: Defaults, Normalisierung, Persistenz
- `src/runtime`: Tampermonkey-Initialisierung und Public API
- `loader`: Userscript-Entry
- `dist`: gebautes Installationsartefakt
- `tests`: Domain- und Runtime-Tests

## Laufzeitmodell

1. Loader startet `initializeTampermonkeyRuntime(...)`.
2. Config wird geladen und normalisiert.
3. Feature-Registry liefert Definitionen.
4. Bootstrap mountet aktivierte Features idempotent.
5. Stop/Cleanup entfernt Styles, Listener und Observer zuverlässig.

Wichtige Eigenschaft: mehrfaches Starten erzeugt keine doppelten Instanzen.

## Feature-Architektur

Jedes Feature exportiert eine `mount...`-Funktion und liefert eine Cleanup-Funktion zurück.

Themes sind als normale Features integriert:

- `theme-x01` (`themes.x01`)
- `theme-shanghai` (`themes.shanghai`)
- `theme-bermuda` (`themes.bermuda`)
- `theme-cricket` (`themes.cricket`)
- `theme-bull-off` (`themes.bullOff`)

Gemeinsame Theme-Bausteine liegen unter `src/features/themes/shared`.

## Konfiguration

Bestehende Feature-Keys bleiben erhalten.  
Theme-Konfiguration ist strikt verschachtelt:

- `features.themes.x01`
- `features.themes.shanghai`
- `features.themes.bermuda`
- `features.themes.cricket`
- `features.themes.bullOff`

`featureToggles` nutzt weiterhin Feature-Keys (inkl. dotted keys wie `themes.x01`).

## Public API

Namespace: `window.__adXConfig`

Kernmethoden:

- `getConfig()`
- `saveConfig(partialConfig)`
- `resetConfig()`
- `setFeatureEnabled(featureRef, enabled)`
- `listFeatures()`

Theme-spezifisch:

- `setThemeBackgroundImage(themeKey, dataUrl)`
- `clearThemeBackgroundImage(themeKey)`

## Test- und Build-Workflow

```bash
npm install
npm run build
npm test
```

Optional:

```bash
npm run verify
```

Das gebaute Userscript liegt in `dist/autodarts-xconfig.user.js`.
