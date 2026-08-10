# QA-Checkliste

Diese Checkliste ergänzt die automatisierten Prüfungen um den Browser-Smoke-Test. Ein Release ist erst freigabefähig, wenn die für den Release vorgesehenen Browser geprüft oder als offenes Restrisiko dokumentiert wurden.

## Temporäres Userscript erzeugen

```bash
node scripts/build-userscript-smoke.mjs
```

Das Script schreibt ausschließlich in ein neu angelegtes Verzeichnis unter dem Betriebssystem-Temp-Ordner. `dist/` bleibt unverändert. Die ausgegebene `.user.js`-Datei wird für den Test vorübergehend in Tampermonkey installiert.

## Pflichtprüfung in Chrome und Firefox

1. Autodarts öffnen und die Browser-Konsole leeren.
2. xConfig mehrfach öffnen und schließen; Menü, Modal und Hintergrund müssen jeweils vollständig verschwinden und wieder erscheinen.
3. Bot Board Style aktivieren und die Ebenenreihenfolge von Board, Markern und Overlays prüfen.
4. Sämtliche Bildauswahlen nacheinander öffnen und auf sichtbare Vorschaufehler prüfen.
5. In Templates Global prüfen, dass zunächst nur die gewählte Schrift angefordert wird und weitere Schriften erst bei Fokus oder Hover geladen werden.
6. Eine Einstellung ändern, die Seite neu laden und die gespeicherte Einstellung kontrollieren.
7. Einstellungen exportieren und wieder importieren.
8. Normale und kompakte Ansicht prüfen; Turn-Darts dürfen nicht abgeschnitten oder horizontal verkürzt erscheinen.
9. Konsole auf Fehler sowie doppelte Listener-, Style- oder Netzwerkanfragen prüfen.

## Ergebnis dokumentieren

Für jeden Browser werden Version, Tampermonkey-Version, getestetes Autodarts-Szenario, Ergebnis und offene Abweichungen festgehalten. Ein nicht verfügbarer Browser wird nicht als bestanden gewertet, sondern ausdrücklich als ungeprüft dokumentiert.
