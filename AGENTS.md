# AGENTS.md

Diese Regeln gelten fuer alle Codex-Aenderungen in diesem Repository.

## 1) Pflicht: Pruefung und Qualitaetssicherung

- Nach jeder Aenderung muss eine fachliche und technische Pruefung erfolgen.
- Wenn Logik, Layout oder Verhalten geaendert wird, muessen passende Tests erstellt oder bestehende Tests erweitert werden.
- Danach muessen die relevanten Tests erneut ausgefuehrt werden (mindestens betroffene Testbereiche, bevorzugt kompletter Lauf).
- Fehlerhafte Tests duerfen nicht ignoriert werden: Ursache beheben und erneut pruefen.
- Korrekte Verwendung von Umlauten (z.B. öäü, statt oe ae ue)

## 2) Pflicht: Neuer Build + Versionsanhebung

- Wenn Dateien unter `src/` oder Verhalten im Userscript geaendert wurden, ist ein neuer Build verpflichtend.
- Die Version muss dabei angehoben werden (SemVer, standardmaessig Patch), inklusive Userscript-Metadaten.
- Die Datei `dist/autodarts-xconfig.user.js` muss nach dem Build den aktuellen Stand enthalten und mit committed werden.

Empfohlener Ablauf:

1. Version anheben.
2. Build ausfuehren (`npm run build`).
3. Tests ausfuehren (`npm test` bzw. `node ./scripts/run-tests.mjs`).
4. Ergebnis pruefen und erst dann committen.

## 3) Pflicht: Commit-Message mit Was/Warum/Wie

- Jede Commit-Message muss klar erklaeren:
- Was wurde geaendert?
- Warum war die Aenderung notwendig?
- Wie wurde es umgesetzt (kurz, technisch praezise)?

Empfohlenes Format:

`<type>(<scope>): kurze zusammenfassung`

`why: ...`
`what: ...`
`how: ...`
`validation: ...`

Beispiel:

`fix(theme-cricket): stabilize board fill and content-slot placement`

`why: board sizing relied on volatile css hash classes and failed on live DOM changes.`
`what: added structural board/content hooks and shared css rules, removed fragile primary anchors.`
`how: updated shared mount + common css, extended lifecycle/parity/theme tests.`
`validation: npm test`
