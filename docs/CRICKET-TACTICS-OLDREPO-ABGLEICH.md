# Cricket/Tactics `.oldrepo` Abgleich

Stand: 2026-03-10

## Ziel

Relevante Altlogik aus `.oldrepo` wurde gegen die neue Runtime-Architektur geprüft. Übernommen wurde nur, was fachlich korrekt, testbar und architektonisch kompatibel ist.

## Quellen in `.oldrepo`

- `.oldrepo/Animation/autodarts-cricket-state-shared.js`
- `.oldrepo/Animation/Autodarts Animate Cricket Target Highlighter.user.js`
- `.oldrepo/Animation/Autodarts Animate Cricket Grid FX.user.js`
- `.oldrepo/tests/cricket-state-harness.html`
- `.oldrepo/tests/cricket-target-highlighter-harness.html`

## Diskrepanzen und Entscheidungen

| Bereich | `.oldrepo` | Neuer Stand | Entscheidung |
| --- | --- | --- | --- |
| Shared Cricket-State | Ein großes shared Script mit Grid/Player/State-Logik | Neues dediziertes Pipeline-Modul (`src/features/cricket-surface/pipeline.js`) | **Übernommen (konzeptionell)**: Single-Source-State, aber modularisiert statt monolithisch |
| Player-Mapping-Robustheit | Starke DOM-/Identity-Heuristiken (Player-Slots, visible ordering, turn preview) | Selektiv übernommen: stabile Active-Player-Ableitung, Turn-/Throw-Merge, label-cell shortfall repair | **Übernommen (selektiv)** |
| Grid-Erkennung | Sehr breite Root-Heuristiken inkl. Fallbacks | Strikte Root-/Row-Validierung, xConfig-Panel-Exclusion, kein Body-Fallback | **Nicht 1:1 übernommen** (zu fehleranfällig), **neu gehärtet** |
| Highlighter-Lifecycle | Vollständige Rebuild-Pfade im Legacy-Umfeld | Persistentes Overlay + Shape-Pooling + signature-gated Re-Render | **Neu umgesetzt** |
| GridFX-Themekopplung | Legacy koppelte GridFX an Theme-Cricket-Präsenz | GridFX läuft in Cricket/Tactics mit gültigem Grid, unabhängig vom Theme | **Bewusst abweichend** (gemäß aktuellem Plan/README-Ziel) |
| Observer-Strategie | Teilweise breite Observer + Legacy-Fallbacks | Scoped Observer, Self-Mutation-Filter, Route-Guard, RAF-Gate | **Neu umgesetzt** |
| xConfig Rendering | Legacy-Kontext mit häufigen Neuaufbauten | Persistenter Shell-Container, Signature-Gating, Scroll-Erhalt | **Neu umgesetzt** |

## Konkret übernommene, sinnvolle Muster

- Stabile Trennung zwischen Grid-Snapshot und Zustandsableitung.
- Defensive Behandlung unvollständiger DOM-Zellen (Shortfall-Repair).
- Turn-/Throw-Preview-Merge für bessere Live-Konsistenz.
- Explizite Zustandsklassen für offense/pressure/danger/dead statt UI-Heuristiken.

## Nicht übernommene Teile (bewusst)

- Monolithische Altstruktur mit stark gekoppelten Pfaden.
- Zu breite Root-Fallbacks (Body-/Wrapper-Risiko).
- Theme-gebundene Aktivierung von GridFX.
- Redundante oder doppelte Regeldefinitionen außerhalb eines zentralen State-Modells.

## Ergebnis

Der neue Stand ist fachlich auf Cricket/Tactics-Regeln und Runtime-Stabilität ausgerichtet, ohne Legacy-Altlasten 1:1 zu portieren. Übernommen wurden nur robuste, kompatible Bausteine.
