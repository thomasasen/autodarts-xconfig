# New-System-Inventur

Diese Inventur beschreibt den aktuellen Aufbau der neuen Architektur in `src/core`, `src/domain`, `src/features`, `src/config`, `src/runtime` und `src/vendors`.

## Core

| file or module | layer | purpose |
| --- | --- | --- |
| `src/core/bootstrap.js` | Core | startet Runtime, mountet Features, verwaltet öffentliche API |
| `src/core/dom-guards.js` | Core | idempotente DOM-Helfer für Styles und Nodes |
| `src/core/event-bus.js` | Core | internes Event-System |
| `src/core/game-state-store.js` | Core | WebSocket-State, Variant- und Modus-Auswertung |
| `src/core/listener-registry.js` | Core | dedupliziert Event-Listener |
| `src/core/observer-registry.js` | Core | dedupliziert MutationObserver |

## Domain

| file or module | layer | purpose |
| --- | --- | --- |
| `src/domain/x01-rules.js` | Domain | Segment-, Bull-, Checkout-, Bust- und Visit-Regeln für X01 |
| `src/domain/cricket-rules.js` | Domain | Marks, Closure, Overflow, Target-States und Gewinnerlogik für Cricket/Tactics |
| `src/domain/variant-rules.js` | Domain | Klassifikation von X01-, Cricket- und Tactics-Modi |
| `src/domain/dart-rules.js` | Domain | Aggregator der Domain-Cluster |

## Features

| file or module | layer | purpose |
| --- | --- | --- |
| `src/features/feature-registry.js` | Feature | registriert Feature-Metadaten, Mount-Funktionen und optionale Actions |
| `src/features/xconfig-ui/*` | Feature | AD-xConfig-Menü, Route, Settings-Modal, README-Links und Feature-Aktionen |
| `src/features/checkout-score-pulse/*` | Feature | Checkout-Hervorhebung für X01 |
| `src/features/checkout-board-targets/*` | Feature | Board-Targets für Checkout-Wege |
| `src/features/tv-board-zoom/*` | Feature | Checkout-/Setup-Zoom für relevante Segmente |
| `src/features/style-checkout-suggestions/*` | Feature | visuelle Formatierung der Checkout-Empfehlungen |
| `src/features/average-trend-arrow/*` | Feature | AVG-Trendanzeige |
| `src/features/turn-start-sweep/*` | Feature | Spielerwechsel-Hervorhebung |
| `src/features/triple-double-bull-hits/*` | Feature | Treffer-Hervorhebung für Triple/Double/Bull |
| `src/features/cricket-highlighter/*` | Feature | Board-Overlay für Cricket-/Tactics-Zielzustände |
| `src/features/cricket-grid-fx/*` | Feature | Matrix-Effekte für Cricket/Tactics |
| `src/features/dart-marker-emphasis/*` | Feature | Marker-Hervorhebung auf dem virtuellen Board |
| `src/features/dart-marker-darts/*` | Feature | Dart-Bilder und Fluganimationen statt Standard-Marker |
| `src/features/remove-darts-notification/*` | Feature | auffälligerer Remove-Darts-Hinweis |
| `src/features/single-bull-sound/*` | Feature | Audio-Feedback bei Single Bull |
| `src/features/turn-points-count/*` | Feature | sichtbares Hoch-/Runterzählen von Punkten |
| `src/features/winner-fireworks/*` | Feature | Sieger-Effekt, Preview-Aktion und Cleanup |
| `src/features/themes/x01/*` | Feature | X01-Theme |
| `src/features/themes/shanghai/*` | Feature | Shanghai-Theme |
| `src/features/themes/bermuda/*` | Feature | Bermuda-Theme |
| `src/features/themes/cricket/*` | Feature | Cricket-/Tactics-Theme |
| `src/features/themes/bull-off/*` | Feature | Bull-off-Theme |
| `src/features/themes/shared/*` | Feature | gemeinsamer Theme-Unterbau |

## Config

| file or module | layer | purpose |
| --- | --- | --- |
| `src/config/default-config.js` | Config | Defaultwerte aller Module |
| `src/config/runtime-config.js` | Config | Normalisierung und Feature-Access |
| `src/config/config-store.js` | Config | Persistenz und Legacy-Import |

## Runtime

| file or module | layer | purpose |
| --- | --- | --- |
| `src/runtime/bootstrap-runtime.js` | Runtime | Tampermonkey-Start, Public API und Config-Persistenz |
| `src/runtime/xconfig-descriptors.js` | Runtime | Re-Export der xConfig-Descriptoren |
| `src/runtime/xconfig-shell.js` | Runtime | Re-Export der xConfig-Shell |

## Vendors

| file or module | layer | purpose |
| --- | --- | --- |
| `src/vendors/index.js` | Vendor | Lazy-Loading und Zugriff auf Anime/Confetti |
| `src/vendors/anime.min.cjs` | Vendor | gebündelte Anime.js-Version |
| `src/vendors/canvas-confetti.browser.js` | Vendor | gebündelte Confetti-Version |

## Fazit

- Die neue Architektur trennt Core, Domain, Features, Config, Runtime und Vendors sauber.
- Fachregeln liegen ausschließlich in `src/domain`.
- AD xConfig ist kein separates Loader-System mehr, sondern eine integrierte Runtime-Oberfläche.
