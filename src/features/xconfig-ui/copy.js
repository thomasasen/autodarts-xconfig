function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }

  Object.getOwnPropertyNames(value).forEach((key) => {
    deepFreeze(value[key]);
  });

  return Object.freeze(value);
}

function buildCopyEntry(description, docsDescription, featuresDescription = "") {
  return {
    description: String(description || "").trim(),
    docsDescription: String(docsDescription || "").trim(),
    featuresDescription: String(featuresDescription || docsDescription || "").trim(),
  };
}

function fieldCopy(description, docsDescription, featuresDescription = "") {
  return deepFreeze(buildCopyEntry(description, docsDescription, featuresDescription));
}

function optionCopy(description, docsDescription, featuresDescription = "") {
  return deepFreeze(buildCopyEntry(description, docsDescription, featuresDescription));
}

function image(alt, fileName) {
  return deepFreeze({
    alt: String(alt || "").trim(),
    fileName: String(fileName || "").trim(),
  });
}

function featureCopy(copy) {
  return deepFreeze(copy);
}

function appendRawLines(lines, entries = []) {
  if (!Array.isArray(entries) || !entries.length) {
    return;
  }

  entries.forEach((entry) => {
    lines.push(String(entry ?? ""));
  });
}

function getFieldAppendixLines(copy, fieldKey, variant) {
  if (!copy || !fieldKey) {
    return [];
  }

  const propertyName =
    variant === "features" ? "featuresFieldAppendix" : "readmeFieldAppendix";
  const blocks = copy[propertyName];
  if (!blocks || typeof blocks !== "object") {
    return [];
  }

  const entries = blocks[fieldKey];
  return Array.isArray(entries)
    ? entries.map((entry) => String(entry ?? ""))
    : [];
}

const DEBUG_FIELD = fieldCopy(
  "Schaltet zusätzliche Diagnoseausgaben für die Fehlersuche ein.",
  "Aktiviert zusätzliche Debug-Ausgaben und Diagnosehinweise. Für den normalen Spielbetrieb ist die Option nicht gedacht und sollte in der Regel ausgeschaltet bleiben.",
  "Aktiviert zusätzliche Debug-Ausgaben für die Fehlersuche."
);

const THEME_BACKGROUND_DISPLAY_FIELD = fieldCopy(
  "Legt fest, wie ein eigenes Hintergrundbild im Spielbereich platziert wird.",
  "Bestimmt, ob ein eigenes Theme-Bild den Bereich füllt, eingepasst wird, gestreckt erscheint, mittig ohne Skalierung liegt oder gekachelt wiederholt wird. Grafisch ändert sich die Bildplatzierung, nicht die Struktur des Themes.",
  "Legt fest, wie ein eigenes Hintergrundbild im Theme platziert wird."
);

const THEME_BACKGROUND_OPACITY_FIELD = fieldCopy(
  "Regelt, wie deutlich dein Hintergrundbild hinter der dunklen Überlagerung sichtbar bleibt.",
  "Steuert, wie stark das gespeicherte Hintergrundbild durch die dunkle Theme-Überlagerung durchscheint. Hohe Werte zeigen das Bild klarer, niedrige Werte dämpfen es stärker zugunsten der Lesbarkeit.",
  "Regelt, wie stark das Hintergrundbild sichtbar bleibt."
);

const THEME_PLAYER_TRANSPARENCY_FIELD = fieldCopy(
  "Macht die Spielerfelder dichter oder transparenter gegenüber dem Hintergrund.",
  "Passt die Transparenz der Spielerflächen an. Hohe Werte lassen mehr vom Hintergrund durch, niedrige Werte machen die Flächen geschlossener und ruhiger.",
  "Passt die Transparenz der Spielerfelder gegenüber dem Hintergrund an."
);

const THEME_GLOBAL_TYPOGRAPHY_FONT_FIELD = fieldCopy(
  "Wählt eine kuratierte Schrift für stabile Bereiche wie Scores, Würfe oder Namen.",
  "Wählt eine kuratierte Remote-Schrift für die globale Typografie. Die Schrift wirkt in den ausgewählten Bereichen aller Spielansichten und verwendet bei Ladeproblemen automatisch einen lokalen Fallback-Stack.",
  "Wählt eine kuratierte Schrift für unterstützte Bereiche."
);

const THEME_GLOBAL_TYPOGRAPHY_SCOPE_FIELD = fieldCopy(
  "Legt per Mehrfachauswahl fest, ob Scores, Würfe und/oder Namen die gewählte Schrift erhalten.",
  "Bestimmt per Mehrfachauswahl, welche stabilen Textbereiche aller Spielansichten die gewählte Schrift übernehmen. Die Auswahl beschränkt sich bewusst auf Scores, Würfe und Spielernamen.",
  "Legt fest, welche stabilen Bereiche die Schrift übernehmen."
);

const THEME_GLOBAL_TYPOGRAPHY_ACCENT_COLOR_FIELD = fieldCopy(
  "Setzt die Farbe für aktive oder gewinnende Spieler inklusive Rahmen und aktiver Hauptzahl.",
  "Legt die semantische Akzentfarbe für aktive und gewinnende Spieler fest. Die Farbe wirkt im aktiven xConfig-Theme auf Rahmen, Outline/Glow und die aktive Hauptzahl, ohne zusätzliche Zustandsfarben einzeln freizuschalten.",
  "Setzt die Akzentfarbe für aktive oder gewinnende Spieler."
);

const THEME_GLOBAL_TYPOGRAPHY_SCORE_COLOR_FIELD = fieldCopy(
  "Steuert normale große Scores und große Turn-Punkte außerhalb der aktiven Hervorhebung.",
  "Legt die Farbe für normale beziehungsweise inaktive Hauptzahlen sowie große Turn-Punkte fest. Die aktive Hauptzahl bleibt bewusst weiter an die Farbe des aktiven Spielers gebunden.",
  "Steuert normale Hauptzahlen und Turn-Punkte."
);

const THEME_GLOBAL_TYPOGRAPHY_SECONDARY_COLOR_FIELD = fieldCopy(
  "Setzt Namen und Meta-Texte wie AVG oder MPR in allen Zuständen auf eine gemeinsame Sekundärfarbe.",
  "Legt eine gemeinsame Farbe für Namen und Meta-Texte fest. Dadurch bleiben diese Bereiche ruhig und konsistent, während Scores und aktive Spieler separat hervorgehoben werden.",
  "Setzt Namen und Meta-Texte auf eine gemeinsame Sekundärfarbe."
);

const THEME_GLOBAL_TYPOGRAPHY_THROW_LABEL_COLOR_FIELD = fieldCopy(
  "Färbt Wurf-, Suggestion- und Checkout-Texte separat von den großen Zahlen ein.",
  "Legt die Farbe für Wurf-Labels, Suggestion-Texte und Checkout-Hinweise fest, ohne die großen Turn-Punkte mitzunehmen. So lassen sich Hilfstexte ruhiger oder klarer vom Hauptscore trennen.",
  "Färbt Wurf-, Suggestion- und Checkout-Texte separat ein."
);

const THEME_GLOBAL_TYPOGRAPHY_ACTIVE_PLAYER_TINT_FIELD = fieldCopy(
  "Mischt die Farbe des aktiven Spielers leicht in den Hintergrund seiner Spielerkarte.",
  "Regelt, wie stark die Farbe des aktiven Rahmens zusätzlich in den Kartenhintergrund aktiver oder gewinnender Spieler einfließt. `Aus` deaktiviert die Tönung vollständig; höhere Werte lassen die aktive Farbe deutlicher durch die Kartenfläche schimmern.",
  "Regelt, wie stark die aktive Farbe den Hintergrund der Spielerkarte einfärbt."
);

const THEME_GLOBAL_TURN_DART_STYLE_FIELD = fieldCopy(
  "Ändert die Dart-Grafiken im Wurffeld oben im Spiel.",
  "Legt fest, ob die Darts in der Wurfanzeige original bleiben, einfarbig, mit Verlauf, als vorbereitetes Dart-Bild oder mit einem eigenen hochgeladenen Bild erscheinen. Die Einstellung betrifft nur die drei Darts in der Wurfanzeige, nicht die Treffermarkierungen am Board.",
  "Ändert die Dart-Grafiken im Wurffeld."
);

const THEME_GLOBAL_TURN_DART_ASSET_FIELD = fieldCopy(
  "Wählt ein speziell für die Wurffelder vorbereitetes Dart-Bild aus.",
  "Zeigt passende, freigestellte Dart-Bilder für die drei Wurffelder. Die Auswahl aktiviert automatisch den Modus `Dart-Bild`, behält ein eventuell hochgeladenes eigenes Bild und verändert die Treffermarkierungen am Board nicht.",
  "Wählt ein vorbereitetes Bild für die Darts in der Wurfanzeige aus."
);

const THEME_GLOBAL_TURN_DART_COLOR_FIELD = fieldCopy(
  "Setzt die Hauptfarbe für einfarbige Darts und Darts mit Verlauf.",
  "Bestimmt die Hauptfarbe der erzeugten Darts in der Wurfanzeige. Im Verlaufsmodus bildet sie die Mitte des Verlaufs, im Farbmodus füllt sie den Dart vollständig.",
  "Setzt die Hauptfarbe der Darts in der Wurfanzeige."
);

const THEME_GLOBAL_TURN_DART_GRADIENT_FIELD = fieldCopy(
  "Setzt die Startfarbe für den Verlauf der Darts in der Wurfanzeige.",
  "Bestimmt die zweite Farbe im Verlaufsmodus. Zusammen mit der Hauptfarbe entsteht eine horizontale Dart-Grafik mit leichter heller Spitze.",
  "Setzt die zweite Verlaufsfarbe."
);

const THEME_GLOBAL_TURN_DART_SIZE_FIELD = fieldCopy(
  "Vergrößert oder verkleinert die Darts in der Wurfanzeige.",
  "Regelt die dargestellte Größe der ersetzten Darts im Wurffeld. Die feste Höhe hält die Score-Leiste stabil, auch wenn ein eigenes Bild verwendet wird.",
  "Regelt die Größe der Darts in der Wurfanzeige."
);

const THEME_GLOBAL_TYPOGRAPHY_SCOPE_OPTION_COPY = deepFreeze({
  scores: optionCopy(
    "Gilt für stabile Score- und Punkteanzeigen.",
    "Wendet die Schrift auf stabile Score- und Punkteanzeigen an.",
    "Gilt für stabile Score- und Punkteanzeigen."
  ),
  throws: optionCopy(
    "Greift in der Wurfanzeige und bei stabilen Turn-Karten.",
    "Wendet die Schrift auf die Wurfanzeige im Turn-Bereich und auf stabile nachgeladene Turn-Karten an.",
    "Greift in der Wurfanzeige und bei stabilen Turn-Karten."
  ),
  names: optionCopy(
    "Gilt für Spielernamen in den Theme-Karten.",
    "Wendet die Schrift auf Spielernamen in den unterstützten Theme-Karten an.",
    "Gilt für Spielernamen in den Theme-Karten."
  ),
});

function buildThemeGlobalTypographyFontOptionCopy() {
  return deepFreeze(
    Object.fromEntries(
      THEME_GLOBAL_TYPOGRAPHY_FONT_PRESETS.map((preset) => [
        preset.value,
        preset.value === "system"
          ? optionCopy(
            "Belässt die unterstützten Bereiche bei einer normalen Systemschrift ohne Remote-Download.",
            "Belässt die unterstützten Bereiche bei einer normalen Systemschrift. Es wird keine externe Schrift geladen.",
            "Belässt die unterstützten Bereiche bei einer normalen Systemschrift ohne Remote-Download."
          )
          : optionCopy(
            `Setzt die unterstützten Bereiche auf ${preset.label}.`,
            `Lädt ${preset.label} als kuratierte Online-Schrift für die unterstützten Bereiche und verwendet bei Bedarf automatisch eine lokale Ersatzschrift.`,
            `Setzt die unterstützten Bereiche auf ${preset.label}.`
          ),
      ])
    )
  );
}

const THEME_GLOBAL_TYPOGRAPHY_FONT_OPTION_COPY = buildThemeGlobalTypographyFontOptionCopy();
const THEME_GLOBAL_TEMPLATE_PRESET_FIELD_COPY = deepFreeze(
  Object.fromEntries(
    THEME_GLOBAL_TEMPLATE_PRESETS.map((preset) => [
      `preset-${preset.key}`,
      fieldCopy(
        `Wendet die Vorlage ${preset.label} sofort an.`,
        `Aktiviert Hintergrund sowie Schrift & Farben und setzt deren Werte direkt auf ${preset.label}. Dabei wird auch ein bereits gespeichertes Hintergrundbild überschrieben; die Darts in der Wurfanzeige bleiben unverändert.`,
        `Wendet die Vorlage ${preset.label} mit einem Klick an.`
      ),
    ])
  )
);

export const xconfigFeatureCopy = deepFreeze({
  "theme-global-background": featureCopy({
    cardDescription: "Globales Wallpaper und transparente Spielerfelder für alle Spielansichten.",
    visibleDescription: "Steuert ein gemeinsames Hintergrundbild und die Transparenz der Spielerfelder unter /matches.",
    visualDescription: "Das Wallpaper liegt hinter dem unveränderten Autodarts-Spielaufbau. Bildanpassung, Sichtbarkeit und Durchsichtigkeit der Spielerfelder lassen sich unabhängig von Schrift, Farben und Darts in der Wurfanzeige einstellen.",
    usefulWhen: "Wenn alle Spielvarianten denselben Hintergrund erhalten sollen.",
    images: [image("Globaler Hintergrund", "templates-global-presets.webp")],
    fields: {
      backgroundDisplayMode: THEME_BACKGROUND_DISPLAY_FIELD,
      backgroundOpacity: THEME_BACKGROUND_OPACITY_FIELD,
      playerFieldTransparency: THEME_PLAYER_TRANSPARENCY_FIELD,
      uploadThemeBackground: fieldCopy(
        "Speichert ein globales Hintergrundbild bis 1,5 MiB.",
        "Öffnet die Dateiauswahl, optimiert das Bild lokal auf maximal 1920×1080 und verwendet es in allen Spielansichten.",
        "Speichert ein globales Hintergrundbild bis 1,5 MiB."
      ),
      clearThemeBackground: fieldCopy(
        "Entfernt das gespeicherte globale Hintergrundbild.",
        "Löscht den lokalen Wallpaper-Upload. Ein gewähltes Preset-Wallpaper bleibt davon unabhängig verfügbar.",
        "Entfernt das globale Hintergrundbild."
      ),
      debug: DEBUG_FIELD,
    },
  }),
  "theme-global-typography": featureCopy({
    cardDescription: "Globale Schrift- und Textfarben für Scores, Würfe und Spielernamen.",
    visibleDescription: "Wendet Schrift und Farben auf ausgewählte Bereiche aller Spielansichten an und kann den Hintergrund des aktiven Spielers leicht einfärben.",
    visualDescription: "Schriftart und Textfarben ändern nur die ausgewählten stabilen Textbereiche; das Autodarts-Layout bleibt bestehen.",
    usefulWhen: "Wenn Scores, Würfe oder Namen spielübergreifend einheitlich lesbar sein sollen.",
    images: [image("Globale Schrift", "template-theme-global-typography-xConfig.png")],
    fields: {
      fontPreset: THEME_GLOBAL_TYPOGRAPHY_FONT_FIELD,
      applyTo: THEME_GLOBAL_TYPOGRAPHY_SCOPE_FIELD,
      accentColor: THEME_GLOBAL_TYPOGRAPHY_ACCENT_COLOR_FIELD,
      scoreColor: THEME_GLOBAL_TYPOGRAPHY_SCORE_COLOR_FIELD,
      secondaryTextColor: THEME_GLOBAL_TYPOGRAPHY_SECONDARY_COLOR_FIELD,
      throwLabelColor: THEME_GLOBAL_TYPOGRAPHY_THROW_LABEL_COLOR_FIELD,
      activePlayerTintIntensity: THEME_GLOBAL_TYPOGRAPHY_ACTIVE_PLAYER_TINT_FIELD,
      debug: DEBUG_FIELD,
    },
  }),
  "theme-global-presets": featureCopy({
    cardDescription: "Fertige Vorlagen für globalen Hintergrund und globale Schrift.",
    visibleDescription: "Wendet Hintergrundbild, Schrift und Farben gemeinsam an, ohne die Darts in der Wurfanzeige zu verändern.",
    visualDescription: "Jede Vorschau zeigt das mitgelieferte Hintergrundbild, die zugehörige Schrift und die Farben. Die Aktion aktiviert Hintergrund sowie Schrift & Farben und ersetzt ein eigenes Hintergrundbild.",
    usefulWhen: "Wenn du einen vollständigen Look mit einem Klick auswählen möchtest.",
    images: [image("Globale Vorlagen", "templates-global-presets.webp")],
    fields: THEME_GLOBAL_TEMPLATE_PRESET_FIELD_COPY,
  }),
  "turn-dart-display": featureCopy({
    cardDescription: "Globale Darstellung der drei Darts im Wurffeld.",
    visibleDescription: "Ersetzt die Darts in der Wurfanzeige durch Farbe, Verlauf, Text, ein vorbereitetes Dart-Bild oder einen eigenen Upload.",
    visualDescription: "Das Modul arbeitet unabhängig von Hintergrund, Schrift und Farben und verändert keine Treffermarkierungen am Board.",
    usefulWhen: "Wenn die Darts im Wurffeld besser zum eigenen Setup passen sollen.",
    images: [image("Darts in der Wurfanzeige mit Verlauf", "template-global-turn-darts-gradient.png")],
    fields: {
      turnDartStyle: THEME_GLOBAL_TURN_DART_STYLE_FIELD,
      turnDartAssetKey: THEME_GLOBAL_TURN_DART_ASSET_FIELD,
      turnDartTextTemplate: fieldCopy("Zeigt Text pro Wurf an.", "Das Zeichen `#` wird durch die Wurfnummer ersetzt.", "Zeigt Wurftext mit Nummernplatzhalter."),
      turnDartColor: THEME_GLOBAL_TURN_DART_COLOR_FIELD,
      turnDartGradientColor: THEME_GLOBAL_TURN_DART_GRADIENT_FIELD,
      turnDartSizePercent: THEME_GLOBAL_TURN_DART_SIZE_FIELD,
      turnDartShineEnabled: fieldCopy("Schaltet den Leuchteffekt ein oder aus.", "Steuert den hellen Schatten der ersetzten Darts.", "Schaltet den Leuchteffekt ein oder aus."),
      uploadTurnDartImage: fieldCopy("Speichert ein eigenes Wurffeld-Dart-Bild.", "Optimiert und speichert ein eigenes Bild bis 350 KB.", "Speichert ein eigenes Dart-Bild."),
      clearTurnDartImage: fieldCopy("Entfernt das gespeicherte Dart-Bild.", "Löscht ausschließlich den globalen Dart-Upload.", "Entfernt das eigene Dart-Bild."),
      debug: DEBUG_FIELD,
    },
  }),
  "checkout-score-highlight": featureCopy({
    cardDescription:
      "Hebt direkt finishbare Restwerte in X01 mit einem gut sichtbaren Score-Effekt hervor.",
    visibleDescription:
      "Direkt finishbare Restwerte werden an der aktiven Punktzahl hervorgehoben.",
    visualDescription:
      "Die aktive Restpunktzahl pulsiert, glüht, skaliert oder blinkt je nach gewähltem Effekt. Die Hervorhebung sitzt direkt am Score und verändert keine anderen UI-Bereiche.",
    usefulWhen: "Wenn du Checkout-Momente schneller am Score erkennen möchtest.",
    images: [image("Finishbaren Restscore hervorheben", "animation-checkout-score-pulse.gif")],
    fields: {
      effect: fieldCopy(
        "Wählt, ob die Restpunktzahl pulsiert, glüht, skaliert oder blinkt.",
        "Legt fest, wie die aktive Restpunktzahl hervorgehoben wird, sobald das Modul einen direkten Finish-Dart erkennt. Grafisch ändert sich nur die Animationsart des Score-Elements.",
        "Wählt die Animationsart der hervorgehobenen Restpunktzahl."
      ),
      colorTheme: fieldCopy(
        "Legt die Highlight-Farbe des Score-Effekts fest.",
        "Bestimmt die Farbe, mit der die aktive Restpunktzahl hervorgehoben wird. Die gewählte Farbe steuert Glanz, Schatten und das visuelle Gewicht des Effekts.",
        "Legt die Highlight-Farbe der Restpunktzahl fest."
      ),
      intensity: fieldCopy(
        "Regelt, wie dezent oder kräftig der Score-Effekt erscheint.",
        "Steuert Skalierung, Leuchtstärke und Sichtbarkeit des Checkout-Score-Effekts. `Dezent` bleibt zurückhaltend, `Stark` wirkt deutlich auffälliger.",
        "Regelt die Stärke des Score-Effekts."
      ),
      triggerSource: fieldCopy(
        "Legt fest, ob Vorschlag, Score oder nur eine der beiden Quellen den Effekt auslöst.",
        "Bestimmt, woran das Modul den direkten Finish-Dart erkennt. `Vorschlag zuerst` prüft zuerst den sichtbaren Checkout-Vorschlag und fällt bei unpassender oder fehlender Route auf die reine Score-Prüfung zurück; die anderen Modi erzwingen ausschließlich Score- oder Vorschlagslogik.",
        "Legt fest, welche Quelle den Score-Effekt auslösen darf."
      ),
      debug: DEBUG_FIELD,
    },
  }),
  "x01-remaining-score-bar": featureCopy({
    cardDescription:
      "Zeigt den verbleibenden X01-Score als Balken direkt unter jeder Spielerpunktzahl.",
    visibleDescription:
      "Jede X01-Spielerkarte erhält einen Balken, der den verbleibenden Score relativ zum Startwert zeigt.",
    visualDescription:
      "Direkt unter der Punktzahl liegt ein horizontaler Fortschrittsbalken. Aktive Spieler erhalten eine kräftigere, präsentere Darstellung mit optionalem Effekt, inaktive Karten bleiben flacher und unverändert ruhig. Je näher der Restwert an `0` liegt, desto kürzer wird der Balken.",
    usefulWhen:
      "Wenn du Reststände und den Abstand zwischen Spielern in X01 schneller auf einen Blick erfassen möchtest.",
    images: [image("Restscore-Balken", "animation-x01-score-progress.png")],
    fields: {
      colorTheme: fieldCopy(
        "Steuert Farblogik und Farbpalette in einer gemeinsamen Auswahl.",
        "Enthält sowohl feste Farbpaletten als auch dynamische Schwellenmodi. So kannst du den Balken statisch einfärben oder die Farbe abhängig von Score/Prozent wechseln.",
        "Steuert statische Farbpaletten und dynamische Schwellenfarben in einer gemeinsamen Auswahl."
      ),
      barSize: fieldCopy(
        "Legt die sichtbare Balkenhöhe des aktiven Spielers fest.",
        "Vergrößert oder verkleinert die Balkenhöhe für aktive Spieler zwischen `Schmal` und `Extrabreit`. Inaktive Spieler bleiben bewusst unverändert.",
        "Legt die Balkenhöhe des aktiven Spielers fest."
      ),
      effect: fieldCopy(
        "Wählt den sichtbaren Effekt des aktiven Balkens oder schaltet ihn aus.",
        "Bestimmt, ob und wie stark der aktive Balken zusätzlich animiert wird. Inaktive Spieler bleiben vom gewählten Effekt unberührt und behalten ihre ruhige Standarddarstellung.",
        "Wählt den Effekt des aktiven Balkens; inaktive Spieler bleiben unverändert."
      ),
      debug: DEBUG_FIELD,
    },
  }),
  "x01-bust-active-player-highlight": featureCopy({
    cardDescription:
      "Markiert die aktive X01-Spielerkarte bei BUST mit roter Wurfkachel-Optik und Glasrissen.",
    visibleDescription:
      "Bei sichtbarem `BUST` übernimmt die aktive X01-Spielerkarte Hintergrund und Rahmen der roten Wurfkacheln; optional wird ein Glasbruch-Sound abgespielt.",
    visualDescription:
      "Beim Eintritt in BUST erscheinen die konfigurierten Glasrisse sofort an zufälligen Stellen. Wenn das Schütteln aktiv ist, bewegt sich die aktive Karte drei Sekunden deutlich hin und her. Wenn der Glasbruch-Sound aktiviert ist, wird er gleichzeitig gestartet. Danach bleiben Glasrisse und rote Wurfkachel-Färbung stehen, bis `BUST` verschwindet.",
    usefulWhen:
      "Wenn ein Überwurf sofort am aktiven Spieler auffallen soll.",
    images: [
      image("Überworfen (BUST) hervorheben", "animation-x01-bust-active-player-highlight.gif"),
    ],
    fields: {
      preview: fieldCopy(
        "Startet eine sofortige BUST-Vorschau auf der Beispielkarte.",
        "Löst die BUST-Vorschau mit roter aktiver Spielerkarte, aktueller Glasriss-Anzahl und optionalem Sound direkt im Einstellungsdialog aus.",
        "Startet die BUST-Vorschau im Einstellungsdialog."
      ),
      crackCount: fieldCopy(
        "Legt fest, wie viele Glasrisse beim BUST erscheinen; `Aus` deaktiviert nur die Glasrisse.",
        "Erzeugt beim Eintritt in BUST die gewählte Anzahl Glasrisse an zufälligen Positionen innerhalb der aktiven Spielerkarte. `Aus` lässt Markierung und Schütteln aktiv.",
        "Bestimmt die Anzahl zufällig platzierter Glasrisse."
      ),
      shakeEnabled: fieldCopy(
        "Schaltet das dreisekündige Wackeln beim Eintritt in BUST ein oder aus.",
        "Steuert nur die kurze Earthquake-Bewegung der aktiven Spielerkarte. Rote Markierung, Glasrisse und optionaler Sound bleiben von dieser Einstellung unberührt.",
        "Schaltet das kurze Schütteln für Effekt und Vorschau ein."
      ),
      soundEnabled: fieldCopy(
        "Spielt beim Eintritt in BUST und in der Vorschau einen Glasbruch-Sound ab.",
        "Aktiviert den zusätzlichen Glasbruch-Sound parallel zu roter Markierung, Glasrissen und optionalem Wackeln. Bei blockierter Browser-Audiowiedergabe bleibt der visuelle Effekt unverändert.",
        "Schaltet den Glasbruch-Sound für Effekt und Vorschau ein."
      ),
      debug: DEBUG_FIELD,
    },
  }),
  "checkout-target-highlights": featureCopy({
    cardDescription:
      "Markiert Checkout-Ziele direkt am Board, statt sie nur im Text zu zeigen.",
    visibleDescription:
      "Unter `180` wird das nächste sinnvolle Checkout-Ziel direkt am virtuellen Board markiert.",
    visualDescription:
      "Die relevanten Segmente erhalten eine ruhige farbige Füllung, optional eine Kontur und einen kontrollierten Halo. Unter `180` validiert das Modul sichtbare Vorschläge gegen Score und Out-Mode, ergänzt sinnvolle Finish-Routen scorebasiert und hält bei klaren Setup-Hinweisen das zuerst zu spielende Feld direkt am Board sichtbar. Wenn mehrere Routenschritte sichtbar sind, bleibt das zuerst zu spielende Feld klar am stärksten betont. Single-Ziele markieren standardmäßig immer beide Single-Ringe des Segments.",
    usefulWhen:
      "Wenn du in der Checkout-Phase immer direkt am Board sehen willst, welches Feld als Nächstes sinnvoll ist.",
    images: [image("Checkout-Ziele hervorheben", "animation-checkout-board-targets.gif")],
    fields: {
      visualPreset: fieldCopy(
        "Wählt zwischen fokussierter Standarddarstellung, klarem Blinksignal und ruhigem Dauer-Glow.",
        "Legt fest, wie die markierten Board-Segmente visuell wirken. Die Segmentauswahl bleibt gleich; nur Signalcharakter, Leuchtverhalten und Bewegungsruhe ändern sich.",
        "Wählt die visuelle Darstellung der markierten Segmente."
      ),
      segmentStyle: fieldCopy(
        "Legt fest, ob die Ziele als farbige Fläche mit Rahmen oder nur als farbige Fläche erscheinen.",
        "Bestimmt, ob die Checkout-Markierung zusätzlich eine farbige Segmentkontur und die weiße Zielkontur verwendet oder ob nur die farbige Fläche selbst sichtbar bleibt. Farben, Presets, Glow und Bewegungsverhalten laufen in beiden Modi weiter auf der Fläche.",
        "Legt fest, ob die Ziele mit Rahmen oder nur über die farbige Fläche markiert werden."
      ),
      targetSelectionMode: fieldCopy(
        "Legt fest, ob das nächste sinnvolle Feld, die ganze Route oder nur das Finish-Feld markiert werden.",
        "Steuert, wie viele Segmente aus der autoritativen Checkout-Route am Board hervorgehoben werden. `Nächstes Feld` markiert unter `180` immer genau den nächsten sinnvollen Schritt; wenn keine Finish-Route mehr steht, bleibt ein plausibler sichtbarer Setup-Hinweis als nächstes Feld erhalten. `Alle Felder` zeigt die gesamte validierte Route und `Nur Finish` hebt das Finish-Segment erst dann hervor, wenn es tatsächlich der aktuelle Ein-Dart-Checkout ist.",
        "Legt fest, welcher Teil der autoritativen Checkout-Route am Board markiert wird."
      ),
      colorTheme: fieldCopy(
        "Passt die Farbe der Board-Markierungen an dein Setup an.",
        "Wählt das Farbschema für Füllung, optionale Kontur und Leuchteffekt der Checkout-Ziele. Die Segmentlogik bleibt unverändert; nur die visuelle Farbwirkung wechselt.",
        "Passt die Farbe der Board-Markierungen an."
      ),
      debug: DEBUG_FIELD,
    },
  }),
  "tv-board-zoom": featureCopy({
    cardDescription:
      "Zoomt in X01 bei Checkout- und sinnvollen Setup-Zielen TV-artig auf das Board.",
    visibleDescription:
      "Bei klaren X01-Zielsituationen zoomt die Ansicht auf relevante Board-Bereiche und hält den Fokus in sinnvollen Finish-Momenten stabil.",
    visualDescription:
      "Das Board wird innerhalb des rechten Board-Bereichs vergrößert, damit relevante Segmente mehr Platz bekommen. Nach `T20,T20,T20` bleibt der Fokus bis zum Spielerwechsel bestehen, nach getroffenem Checkout bis zum Leg-Ende. Klicks auf die Wurfanzeigenleiste zoomen sofort aus, damit Korrekturen auf der ganzen Scheibe möglich bleiben.",
    usefulWhen:
      "Wenn du bei dritten Darts und Finishes mehr Fokus auf Zielbereiche willst, aber bei Korrekturen schnell wieder die ganze Scheibe brauchst.",
    images: [image("Automatischer Board-Zoom", "animation-tv-board-zoom.gif")],
    fields: {
      zoomLevel: fieldCopy(
        "Bestimmt, wie stark das Board vergrößert wird.",
        "Legt fest, wie weit das Modul in den relevanten Board-Bereich hineinzoomt. Hohe Stufen zeigen weniger Umgebung und mehr Zielsegment.",
        "Bestimmt die Stärke des Board-Zooms."
      ),
      zoomSpeed: fieldCopy(
        "Regelt, wie schnell der Zoom ein- und ausläuft.",
        "Wählt die Geschwindigkeits- und Easing-Vorgabe für Ein- und Auszoomung. `Schnell` wirkt direkter, `Langsam` fährt sichtbar weicher ein und aus.",
        "Regelt die Geschwindigkeit des Zooms."
      ),
      checkoutZoomEnabled: fieldCopy(
        "Schaltet den speziellen Zoom für klare Ein-Dart-Checkouts ein oder aus.",
        "Aktiviert oder deaktiviert den Zoom auf eindeutige Ein-Dart-Checkout-Situationen in den ersten beiden Würfen. Bei aktivem Checkout-Zoom bleibt der Fokus nach einem getroffenen Checkout bis zum Leg-Ende bestehen. Andere Zoom-Fälle, etwa der spezielle `T20`-Setup-Fokus nach zwei `T20` inklusive Hold nach `T20,T20,T20` bis zum Spielerwechsel, werden dadurch nicht grundsätzlich abgeschaltet.",
        "Schaltet den Checkout-Zoom für klare Ein-Dart-Finishes ein oder aus."
      ),
      checkoutZoomTarget: fieldCopy(
        "Bestimmt, ob der Zoom bei Checkout-Routen auf das Finish-Feld oder auf das erste sichtbare Routenfeld geht.",
        "Steuert, welches Segment aus einer sichtbaren Checkout-Route für den Zoom verwendet wird. `Nur Finish-Feld` fokussiert nur echte Ein-Dart-Finishes gemäß aktivem Out-Mode und unterdrückt normale Setup-Zooms; der optionale `T20`-Spezialfall nach zwei `T20` bleibt davon getrennt. `Erstes Routenfeld` verhält sich wie der frühere Routenfokus auf den ersten Schritt und lässt auch normale Setup-Ziele weiter zu.",
        "Bestimmt, welches Segment einer sichtbaren Checkout-Route als Zoomziel verwendet wird."
      ),
      t20SetupZoomEnabled: fieldCopy(
        "Schaltet den speziellen `T20`-Setup-Zoom nach zwei `T20` ein oder aus.",
        "Aktiviert oder deaktiviert den Sonderfall, bei dem nach zwei `T20` ein weiterer `T20` als sinnvoller dritter Dart gezoomt wird. Ist die Option aus, bleiben nur echte Checkout-Zooms gemäß Out-Mode und der Auswahl unter `Zoom auf` aktiv.",
        "Schaltet den `T20`-Spezialfall nach zwei `T20` ein oder aus."
      ),
      debug: DEBUG_FIELD,
    },
  }),
  "checkout-suggestion-styles": featureCopy({
    cardDescription:
      "Vergrößert die Turn-Felder sofort und hebt Checkout-Hinweise theme-kompatibel hervor.",
    visibleDescription:
      "Die drei Turn-Felder werden bei Aktivierung größer; sichtbare Checkout-Empfehlungen erhalten den gewählten Akzentstil.",
    visualDescription:
      "Schriftart und Textfarbe bleiben beim Theme. Badge, Ribbon, Stripe, Ticket oder Outline ergänzen Fläche, Kontur und optional ein Label im ersten Checkout-Feld.",
    usefulWhen:
      "Wenn du größere Turn-Felder und klar erkennbare Checkout-Routen möchtest, ohne dein Theme zu übergehen.",
    images: [
      image("Checkout-Vorschlag gestalten", "animation-style-checkout-suggestions.png"),
      image(
        "Format Badge",
        "animation-style-checkout-suggestions-format-badge-readme.png"
      ),
      image(
        "Format Stripe",
        "animation-style-checkout-suggestions-format-stripe-readme.png"
      ),
      image(
        "Format Ticket",
        "animation-style-checkout-suggestions-format-ticket-readme.png"
      ),
      image(
        "Format Outline",
        "animation-style-checkout-suggestions-format-outline-readme.png"
      ),
    ],
    fields: {
      style: fieldCopy(
        "Wechselt zwischen mehreren Akzentstilen für die sichtbaren Checkout-Felder.",
        "Legt Kontur, Akzentkante und Flächenwirkung der Checkout-Felder fest. Schriftart und Textfarbe bleiben beim aktiven Theme.",
        "Wechselt den Akzentstil der Checkout-Felder."
      ),
      labelText: fieldCopy(
        "Setzt den Text des kleinen Labels im ersten Checkout-Feld oder blendet ihn aus.",
        "Bestimmt, welche feste Beschriftung im ersten Feld der Checkout-Route erscheint. `Kein Label` blendet diese Zusatzmarke vollständig aus.",
        "Legt die feste Beschriftung im ersten Checkout-Feld fest oder blendet sie aus."
      ),
      colorTheme: fieldCopy(
        "Wählt die Akzentfarbe des gestylten Vorschlags.",
        "Steuert Akzentfarbe, Hintergründe und Leuchteffekte des Suggestion-Styles. Die inhaltliche Checkout-Empfehlung bleibt unverändert.",
        "Wählt die Akzentfarbe des Suggestion-Styles."
      ),
      debug: DEBUG_FIELD,
    },
  }),
  "avg-trend-arrow": featureCopy({
    cardDescription:
      "Zeigt die AVG-Richtung mit einem kurzen Pfeil direkt an der Anzeige.",
    visibleDescription: "Ein kleiner Pfeil direkt am AVG zeigt kurz die Trendrichtung.",
    visualDescription:
      "Bei einer AVG-Änderung erscheint neben dem Wert kurz ein grüner Aufwärtspfeil oder roter Abwärtspfeil und verschwindet nach der eingestellten Zeit wieder.",
    usefulWhen:
      "Wenn du Formwechsel während eines Legs schnell am AVG erkennen möchtest.",
    readmeDetailHeading: "Wie der Trend berechnet wird",
    readmeDetails: [
      "Der Pfeil vergleicht den zuletzt gelesenen mit dem aktuell gelesenen AutoDarts-AVG-Wert. xConfig berechnet den AVG nicht selbst neu.",
      "Falls AutoDarts den AVG als Paar zeigt (z. B. `55.0 / 55.0`), nutzt das Modul den linken Wert vor dem `/`.",
      "Formel: `AVG_Delta = AVG_aktuell - AVG_vorher`.",
      "Interpretation: `AVG_Delta > 0` zeigt einen grünen Pfeil nach oben, `AVG_Delta < 0` einen roten Pfeil nach unten, `AVG_Delta = 0` keine neue Pfeilrichtung.",
      "Beispiel: `ø 52.50 / 51.80` -> `ø 53.10 / 52.00` ergibt `+0.60`, also einen Aufwärtspfeil.",
      "Einordnung des angezeigten Werts: X01 nutzt `3-Dart-Average = (geworfene Punkte / geworfene Darts) * 3` (gleichwertig zu `PPD * 3`), Cricket nutzt `MPR = Marks / Runden`.",
      "Der Trendpfeil folgt immer genau dem von AutoDarts angezeigten Wert.",
    ],
    featuresDetails: [
      "Trendberechnung: Vergleich von `AVG_aktuell` mit `AVG_vorher` aus der AutoDarts-Anzeige.",
      "Bei einer Anzeige wie `55.0 / 55.0` wird der linke Wert vor dem `/` verwendet.",
      "Formel: `AVG_Delta = AVG_aktuell - AVG_vorher`; `> 0` = Aufwärtspfeil, `< 0` = Abwärtspfeil, `= 0` = keine neue Pfeilrichtung.",
      "Beispiel: `ø 52.50 / 51.80` -> `ø 53.10 / 52.00` ergibt `+0.60`, also Pfeil nach oben.",
      "Einordnung: X01 nutzt den 3-Dart-Average `((Punkte / Darts) * 3)`, Cricket nutzt `MPR = Marks / Runden`.",
    ],
    images: [image("AVG-Trend anzeigen", "animation-average-trend-arrow.png")],
    fields: {
      durationMs: fieldCopy(
        "Legt fest, wie lange der Pfeil sichtbar animiert bleibt.",
        "Bestimmt die Laufzeit der einmaligen Pfeil-Animation nach einer AVG-Änderung. Längere Stufen lassen den Richtungsimpuls spürbar länger stehen.",
        "Legt fest, wie lange der Pfeil sichtbar bleibt."
      ),
      size: fieldCopy(
        "Passt Größe und Abstand des Pfeils an.",
        "Steuert Breite, Höhe und Abstand des Pfeils direkt neben der AVG-Anzeige. Größere Stufen sind aus mehr Abstand leichter erkennbar.",
        "Passt Größe und Abstand des Pfeils an."
      ),
      debug: DEBUG_FIELD,
    },
  }),
  "special-hit-highlights": featureCopy({
    cardDescription:
      "Hebt Triple-, Double- und Bull-Treffer mit Farben, Licht und kurzen Bewegungen hervor.",
    visibleDescription:
      "Treffer wie `T20`, `D16`, `25` und `BULL` bekommen farbige Flächen und einen deutlich sichtbaren Trefferimpuls.",
    visualDescription:
      "Die betroffenen Wurffelder erhalten dunkle, kontrastreiche Flächen mit animierten Verläufen, Pattern-Layern, leuchtenden Rändern und textbezogenen Trefferimpulsen. Einige Farbwelten gehen eher in Cyberpunk-, Hazard- oder Vintage-Richtung. `25` (Single Bull) bleibt ruhiger, `BULL` (Bullseye) erscheint heller und markanter. Nur das frisch erkannte Feld bekommt den starken einmaligen Burst.",
    usefulWhen:
      "Wenn wichtige Treffer auch in schnellen Legs sofort lesbar, deutlich stylischer und visuell markanter wirken sollen, ohne weitere Einzelschalter zu pflegen.",
    images: [],
    readmeFieldAppendix: {
      colorTheme: [
        "",
        "**Vorschau Farbstile**",
        "",
        "Die Farbwelten sind hier bewusst als kompakte Standbilder eingebunden, damit Kontrast, Pattern und Beschriftung schnell vergleichbar bleiben.",
        "Der Farbstil `Rot/Blau/Grün` nutzt feste Trefferfarben und hat deshalb keine eigene Preset-Galerie.",
        "",
        "|  |  |",
        "| --- | --- |",
        "| `Solar Flare` | `Ice Reactor` |",
        "| ![Farbstil Solar Flare](docs/screenshots/animation-triple-double-bull-hits-color-solar-flare-readme.png) | ![Farbstil Ice Reactor](docs/screenshots/animation-triple-double-bull-hits-color-ice-reactor-readme.png) |",
        "| `Venom Lime` | `Crimson Velocity` |",
        "| ![Farbstil Venom Lime](docs/screenshots/animation-triple-double-bull-hits-color-venom-lime-readme.png) | ![Farbstil Crimson Velocity](docs/screenshots/animation-triple-double-bull-hits-color-crimson-velocity-readme.png) |",
        "| `Polar Mint` | `Midnight Gold` |",
        "| ![Farbstil Polar Mint](docs/screenshots/animation-triple-double-bull-hits-color-polar-mint-readme.png) | ![Farbstil Midnight Gold](docs/screenshots/animation-triple-double-bull-hits-color-midnight-gold-readme.png) |",
        "",
      ],
      animationStyle: [
        "",
        "**Animationsstile**",
        "",
        "`Aufspringen`, `Seitlich wackeln`, `Aufleuchten`, `Drehen`, `Lichtlauf`, `Wellenring` und `Stromstoß` werden jeweils einmal pro neuem Treffer abgespielt. Alte Presets mit ähnlicher Wirkung werden beim Laden auf diese Stile übertragen.",
        "",
      ],
    },
    featuresFieldAppendix: {
      colorTheme: [
        "",
        "**Vorschau Farbstile**",
        "",
        "Die Farbwelten sind hier bewusst als kompakte Standbilder eingebunden, damit Kontrast, Pattern und Beschriftung schnell vergleichbar bleiben.",
        "Der Farbstil `Rot/Blau/Grün` nutzt feste Trefferfarben und hat deshalb keine eigene Preset-Galerie.",
        "",
        "|  |  |",
        "| --- | --- |",
        "| `Solar Flare` | `Ice Reactor` |",
        "| ![Farbstil Solar Flare](screenshots/animation-triple-double-bull-hits-color-solar-flare-readme.png) | ![Farbstil Ice Reactor](screenshots/animation-triple-double-bull-hits-color-ice-reactor-readme.png) |",
        "| `Venom Lime` | `Crimson Velocity` |",
        "| ![Farbstil Venom Lime](screenshots/animation-triple-double-bull-hits-color-venom-lime-readme.png) | ![Farbstil Crimson Velocity](screenshots/animation-triple-double-bull-hits-color-crimson-velocity-readme.png) |",
        "| `Polar Mint` | `Midnight Gold` |",
        "| ![Farbstil Polar Mint](screenshots/animation-triple-double-bull-hits-color-polar-mint-readme.png) | ![Farbstil Midnight Gold](screenshots/animation-triple-double-bull-hits-color-midnight-gold-readme.png) |",
        "",
      ],
      animationStyle: [
        "",
        "**Animationsstile**",
        "",
        "`Aufspringen`, `Seitlich wackeln`, `Aufleuchten`, `Drehen`, `Lichtlauf`, `Wellenring` und `Stromstoß` werden jeweils einmal pro neuem Treffer abgespielt. Alte Presets mit ähnlicher Wirkung werden beim Laden auf diese Stile übertragen.",
        "",
      ],
    },
    fields: {
      colorTheme: fieldCopy(
        "Wählt die Farben für Fläche, Leuchten und Rand des Trefferfelds.",
        "Legt fest, wie Triple-, Double- und Bull-Treffer eingefärbt werden. `Rot/Blau/Grün` erzwingt eine klare Signalzuordnung pro Trefferart (`Triple = rot`, `Double = blau`, `Bull = grün`); die anderen Einträge sind die bisherigen Preset-Farbstile.",
        "Wählt die Farben für Fläche, Leuchten und Rand der Treffer-Hervorhebung."
      ),
      animationStyle: fieldCopy(
        "Wählt die kurze Animation für das frisch erkannte Trefferfeld.",
        "Bestimmt, wie sich das frisch erkannte Trefferfeld und sein Text bewegen. Jede Animation wird einmal abgespielt und läuft nicht dauerhaft weiter.",
        "Wählt die kurze Animation für das frisch erkannte Trefferfeld."
      ),
      debug: DEBUG_FIELD,
    },
  }),
  "cricket-target-highlighter": featureCopy({
    cardDescription:
      "Zeigt Cricket- und Tactics-Zustände direkt auf dem Board statt nur in der Matrix.",
    visibleDescription:
      "Zielzustände und Drucksituationen werden direkt am Board sichtbar.",
    visualDescription:
      "Board-Segmente erhalten je nach Zustand farbige Overlays. Relevante Ziele leuchten grün oder rot, irrelevante Felder werden je nach Stil abgeschwächt, geschraffiert oder maskiert.",
    usefulWhen:
      "Wenn du in Cricket oder Tactics schneller sehen möchtest, welche Ziele offen, scorable, unter Druck oder bereits erledigt sind.",
    images: [
      image("Cricket-Ziele hervorheben", "animation-cricket-target-highlighter.png"),
    ],
    fields: {
      showOpenObjectives: fieldCopy(
        "Zeigt offene Ziele zusätzlich als eigene Board-Hinweise an.",
        "Aktiviert sichtbare Open-Overlays für Ziele, die noch nicht geschlossen sind. Ohne diese Option konzentriert sich das Board stärker auf scorable, Druck- und Dead-Zustände.",
        "Zeigt offene Ziele zusätzlich am Board an."
      ),
      showDeadObjectives: fieldCopy(
        "Zeigt vollständig erledigte Ziele weiter als `DEAD` an.",
        "Bestimmt, ob bereits erledigte Ziele weiterhin als tote Segmente sichtbar bleiben. Ist die Option aus, verschwinden diese Hinweise vom Board.",
        "Zeigt erledigte Ziele weiter als `DEAD` an."
      ),
      irrelevantBoardDimStyle: fieldCopy(
        "Bestimmt, wie stark irrelevante Board-Felder optisch zurückgenommen werden.",
        "Wählt den Stil für Felder, die im aktuellen Cricket-/Tactics-Zustand keine aktive Rolle spielen. `Aus` blendet die Abdunkelung ab, `Rauch` dämpft neutral, `Schraffur` ergänzt ein Muster und `Abdeckung` legt eine besonders harte dunkle Fläche darüber.",
        "Bestimmt den Abdunkelungsstil für irrelevante Felder."
      ),
      colorTheme: fieldCopy(
        "Passt die Farben für Scoring- und Druckzustände an.",
        "Wechselt zwischen dem normalen Farbschema und einer kontraststärkeren Variante. Die Zustände bleiben gleich, nur Grün- und Rotwirkung werden optisch kräftiger.",
        "Passt die Farben für Scoring- und Druckzustände an."
      ),
      intensity: fieldCopy(
        "Regelt Deckkraft und Sichtbarkeit der Board-Overlays.",
        "Steuert Füllung, Kontur und Opazität der Zustands-Overlays. Hohe Stufen zeichnen offene, tote und druckrelevante Ziele sichtbarer.",
        "Regelt Deckkraft und Sichtbarkeit der Board-Overlays."
      ),
      debug: DEBUG_FIELD,
    },
  }),
  "cricket-grid-status-effects": featureCopy({
    cardDescription:
      "Ergänzt die Cricket-/Tactics-Matrix um Live-Effekte für Fortschritt, Druck und Wechsel.",
    visibleDescription:
      "Zusätzliche Live-Effekte direkt in der Cricket-/Tactics-Matrix.",
    visualDescription:
      "Zellen, Zeilen und Zielmarken reagieren mit grünen und roten Zuständen, kurzen Hinweisen, Kanten und Übergängen. So werden Fortschritt, Gegnerdruck und Zugwechsel in der Matrix selbst sichtbarer.",
    usefulWhen:
      "Wenn du Fortschritt, Gegnerdruck und Wechsel im Grid klarer sehen willst.",
    images: [image("Cricket-Statusanzeigen", "animation-cricket-grid-fx.png")],
    fields: {
      rowWave: fieldCopy(
        "Lässt bei Änderungen einen kurzen Lichtlauf über die betroffene Zeile laufen.",
        "Startet nach einer relevanten Zustandsänderung einen kurzen Lichtlauf. Grafisch zieht eine helle Welle einmal über die betroffene Matrixzeile.",
        "Lässt nach Änderungen einen kurzen Lichtlauf über die Zeile laufen."
      ),
      badgeBeacon: fieldCopy(
        "Lässt relevante Zielmarken und Beschriftungen stärker leuchten.",
        "Verstärkt das Leuchten und die Sichtbarkeit der Zielmarken beziehungsweise Beschriftungen, wenn sie für Punkte oder Druck relevant sind.",
        "Lässt relevante Zielmarken und Beschriftungen stärker leuchten."
      ),
      markProgress: fieldCopy(
        "Betont den Fortschritt von einer, zwei oder drei Markierungen in den Spielerzellen.",
        "Hebt neue oder relevante Markierungsstufen in Spielerzellen sichtbar hervor. Die Stufen werden deutlicher ausgemalt und sind leichter voneinander zu unterscheiden.",
        "Betont die Markierungsstufen in den Spielerzellen."
      ),
      pressureEdge: fieldCopy(
        "Zeichnet bei Gegnerdruck eine rote Kante am betroffenen Bereich.",
        "Ergänzt eine deutliche Druckkante, wenn eine Zeile oder Zelle unter relevantem Gegnerdruck steht. Die Kante dient als schneller Warnhinweis, ohne die komplette Zelle umzufärben.",
        "Zeichnet bei Gegnerdruck eine rote Warnkante."
      ),
      scoringStripe: fieldCopy(
        "Hebt Bereiche, auf denen noch gepunktet werden kann, mit einer grünen Bahn hervor.",
        "Zeichnet offensiv sinnvolle Scoring-Zeilen oder Zellen mit einer gut sichtbaren grünen Akzentfläche nach. So springen potenzielle Punkteziele schneller ins Auge.",
        "Hebt offensiv scorable Bereiche grün hervor."
      ),
      deadRowMuted: fieldCopy(
        "Dunkelt vollständig irrelevante `DEAD`-Zeilen optisch ab.",
        "Nimmt Zeilen, die im aktuellen Zustand als `DEAD` gelten, sichtbar zurück. Grafisch werden diese Bereiche matter und konkurrieren weniger mit aktiven Zielen.",
        "Dunkelt `DEAD`-Zeilen optisch ab."
      ),
      deltaChips: fieldCopy(
        "Zeigt nach Treffern kurz kleine `+1`, `+2` oder `+3`-Hinweise an.",
        "Blendet nach einer relevanten Änderung kurze Zahlenhinweise direkt an der Matrix ein. So ist sofort erkennbar, wie viele Markierungen gerade dazugekommen sind.",
        "Zeigt kurz `+1`, `+2` oder `+3` direkt an der Matrix an."
      ),
      hitSpark: fieldCopy(
        "Erzeugt am frisch getroffenen Bereich einen kurzen Treffer-Impuls.",
        "Setzt auf der gerade betroffenen Zelle einen kleinen optischen Trefferfunken. Das ist ein punktueller Impuls und keine dauerhafte Färbung.",
        "Erzeugt einen kurzen Trefferfunken am betroffenen Bereich."
      ),
      roundTransitionWipe: fieldCopy(
        "Kennzeichnet den Zugwechsel mit einem kurzen Übergang in der Matrix.",
        "Legt beim Wechsel auf den nächsten Spieler einen kurzen Übergang über den betroffenen Matrixbereich. So wird der Zugwechsel schneller lesbar.",
        "Kennzeichnet den Zugwechsel mit einem kurzen Matrix-Übergang."
      ),
      pressureOverlay: fieldCopy(
        "Legt bei Gegnerdruck eine zusätzliche rote Druckfläche über betroffene Bereiche.",
        "Ergänzt bei relevantem Gegnerdruck eine sichtbare rote Fläche zusätzlich zur Kante. So springt defensiver Druck auch dann ins Auge, wenn man nicht auf jede Zellfarbe achtet.",
        "Legt bei Gegnerdruck eine zusätzliche rote Druckfläche über betroffene Bereiche."
      ),
      colorTheme: fieldCopy(
        "Passt die Grün-/Rot-Wirkung der Grid-Effekte an.",
        "Wechselt zwischen Standard und kontraststärkerer Farbpalette für offensive und druckbezogene Grid-Effekte. Die Zustandslogik selbst bleibt identisch.",
        "Passt die Farben der Grid-Effekte an."
      ),
      intensity: fieldCopy(
        "Regelt die Gesamtstärke von Leuchten, Flächen und Kanten.",
        "Steuert Deckkraft, Leuchtkraft und Sichtbarkeit aller Matrixeffekte. Höhere Stufen lassen grüne und rote Zustände markanter erscheinen.",
        "Regelt die Gesamtstärke der Matrixeffekte."
      ),
      debug: DEBUG_FIELD,
    },
  }),
  "bot-board-style": featureCopy({
    cardDescription:
      "Zeigt eines von zehn bekannten Board-Designs entweder nur während Bot-Zügen oder auf allen unterstützten Match-Boards.",
    visibleDescription:
      "Die native Board-Fläche wird durch ein ausgewähltes, lokal eingebettetes Board-Design ersetzt.",
    visualDescription:
      "Das ausgewählte Design liegt über der nativen Board-Grafik. Treffer-Marker, Checkout-Ziele und Cricket-Hervorhebungen bleiben darüber sichtbar. Im Bot-Modus erscheint das Design nur, wenn der aktive Spieler zuverlässig als Bot erkannt wird.",
    usefulWhen:
      "Wenn Bot-Partien ein eigenes Board erhalten sollen oder du dasselbe Board-Design in allen unterstützten Matches verwenden möchtest.",
    fields: {
      design: fieldCopy(
        "Wählt eines der zehn eingebetteten Board-Designs aus.",
        "Legt fest, welche optimierte Board-Grafik über der nativen Autodarts-Boardfläche dargestellt wird. Das Deaktivieren des Moduls stellt das native Board wieder her.",
        "Wählt eines von zehn lokal eingebetteten Board-Designs."
      ),
      scope: fieldCopy(
        "Bestimmt, ob das Design nur bei Bot-Zügen oder auf jedem Match-Board erscheint.",
        "Mit `Nur bei Bot-Zügen` wird das Design bei einem zuverlässig erkannten aktiven Bot eingeblendet. `Alle Match-Boards` verwendet es unabhängig vom aktiven Spieler und Spielmodus auf jedem unterstützten sichtbaren Board.",
        "Begrenzt das Design auf Bot-Züge oder aktiviert es global für Match-Boards."
      ),
      debug: DEBUG_FIELD,
    },
  }),
  "dartboard-marker-highlight": featureCopy({
    cardDescription:
      "Macht vorhandene Marker auf dem virtuellen Board klarer und auffälliger.",
    visibleDescription:
      "Treffer-Marker auf dem virtuellen Board werden deutlicher sichtbar.",
    visualDescription:
      "Die bestehenden Treffermarkierungen werden größer, farbiger und auf Wunsch mit Pulsieren, Leuchten oder einem Rand versehen. Das Modul ersetzt sie nicht, sondern betont sie.",
    usefulWhen:
      "Wenn die Standardmarker zu klein oder zu unauffällig sind.",
    images: [image("Treffermarkierungen hervorheben", "animation-dart-marker-emphasis.gif")],
    fields: {
      size: fieldCopy(
        "Vergrößert oder verkleinert die vorhandenen Marker.",
        "Steuert die Grundgröße der bestehenden Board-Marker. Hohe Stufen machen Treffer aus mehr Abstand leichter erkennbar.",
        "Vergrößert oder verkleinert die Marker."
      ),
      color: fieldCopy(
        "Wählt die Hauptfarbe des betonten Markers.",
        "Legt die Farbwirkung der Marker-Betonung fest. Die gewählte Farbe wird für Füllung beziehungsweise visuelle Hervorhebung der Marker genutzt.",
        "Wählt die Hauptfarbe des Markers."
      ),
      effect: fieldCopy(
        "Schaltet zwischen Leuchten, Pulsieren oder einer ruhigen Darstellung ohne Animation um.",
        "Legt fest, ob die Marker weich glühen, leicht pulsieren oder ohne Zusatzanimation ruhig sichtbar bleiben.",
        "Schaltet zwischen Leuchten, Pulsieren oder keiner Zusatzanimation um."
      ),
      opacityPercent: fieldCopy(
        "Regelt die Sichtbarkeit der Marker über die Deckkraft.",
        "Bestimmt, wie kräftig die Marker gezeichnet werden. Höhere Werte machen die Treffer präsenter, niedrigere wirken unaufdringlicher.",
        "Regelt die Deckkraft der Marker."
      ),
      outline: fieldCopy(
        "Fügt optional einen weißen oder schwarzen Rand hinzu.",
        "Legt fest, ob die Treffermarkierungen zusätzlich mit einem hellen oder dunklen Rand gezeichnet werden. Das verbessert die Abgrenzung je nach Board- und Hintergrundfarbe.",
        "Fügt optional einen hellen oder dunklen Rand hinzu."
      ),
      debug: DEBUG_FIELD,
    },
  }),
  "dart-marker-replacer": featureCopy({
    cardDescription:
      "Ersetzt Marker optional durch kleine Dart-Grafiken mit Fluganimation und pausiert im Live-Modus automatisch.",
    visibleDescription:
      "Standardmarker können auf dem virtuellen Board durch kleine Dart-Grafiken ersetzt werden. Im Live-Modus pausiert das Modul automatisch.",
    visualDescription:
      "Statt des normalen Markers liegt ein Dart-Bild im getroffenen Segment. Auf Wunsch fliegt der Dart sichtbar ein, bevor er an seiner Zielposition landet.",
    usefulWhen:
      "Wenn du Treffer auf dem virtuellen Board persönlicher oder realistischer darstellen möchtest.",
    readmeDetailHeading: "Wichtiger Hinweis",
    readmeDetails: [
      "Auf dem virtuellen Board bleibt `Treffermarkierungen durch Darts ersetzen` aktiv und ersetzt sichtbare Treffermarkierungen durch Dart-Grafiken. Im Live-Modus pausiert das Modul automatisch, damit dort keine zusätzlichen Darts erscheinen.",
      "Leistungsintensive Effekte können auf schwächeren Geräten zu Rucklern, verzögerter Darstellung oder weniger flüssigen Animationen führen.",
    ],
    featuresDetails: [
      "Auf dem virtuellen Board bleibt das Modul aktiv. Im Live-Modus pausiert es automatisch, damit dort keine zusätzlichen Dart-Overlays erscheinen.",
      "Leistungsintensive Effekte können auf schwächeren Geräten zu Rucklern oder weniger flüssigen Animationen führen.",
    ],
    images: [image("Treffermarkierungen durch Darts ersetzen", "animation-dart-marker-darts.png")],
    fields: {
      "run-feature-action": fieldCopy(
        "Wirft das aktuell konfigurierte Dart-Design auf einen virtuellen Marker.",
        "Startet eine direkte Vorschau mit dem aktuell gewählten Dart-Design, der Größe und den aktivierten Flug- beziehungsweise Einschlagseffekten. Das ändert keine gespeicherten Werte.",
        "Startet eine direkte Vorschau mit dem aktuell konfigurierten Dart-Design."
      ),
      design: fieldCopy(
        "Wählt das Bilddesign der eingeblendeten Darts.",
        "Legt fest, welches Dart-Motiv anstelle des Standardmarkers verwendet wird. Die Trefferposition bleibt gleich, nur die Grafik ändert sich.",
        "Wählt das Bilddesign der eingeblendeten Darts."
      ),
      animateDarts: fieldCopy(
        "Schaltet die sichtbare Fluganimation der Dart-Bilder ein oder aus. Leistungsintensive Effekte können auf schwächeren Geräten zu Rucklern oder weniger flüssigen Animationen führen.",
        "Bestimmt, ob neu gesetzte Dart-Bilder mit einer kurzen Flugbewegung ins Segment einlaufen oder sofort an ihrer Endposition erscheinen. Die aktivierte Fluganimation erhöht je nach Szene die CPU- und GPU-Last und kann auf schwächeren Geräten zu Rucklern oder weniger flüssigen Animationen führen.",
        "Schaltet die Fluganimation der Dart-Bilder ein oder aus. Auf schwächeren Geräten kann das die Animation weniger flüssig machen."
      ),
      sizePercent: fieldCopy(
        "Passt die Größe der Dart-Grafiken an.",
        "Skaliert die eingeblendeten Dart-Bilder relativ zur Standardgröße. Große Stufen füllen das Segment stärker aus.",
        "Passt die Größe der Dart-Grafiken an."
      ),
      hideOriginalMarkers: fieldCopy(
        "Blendet die ursprünglichen Marker aus, damit auf dem virtuellen Board nur die Dart-Grafiken sichtbar bleiben. Im Live-Modus pausiert das Modul trotzdem automatisch.",
        "Verhindert Doppelanzeigen, indem die ursprüngliche Treffermarkierung unsichtbar gemacht wird, solange die Dart-Grafik aktiv ist. Auf dem virtuellen Board bleibt das Modul dabei aktiv, im Live-Modus pausiert es jedoch vollständig automatisch.",
        "Blendet die ursprünglichen Marker zugunsten der Dart-Grafiken aus. Im Live-Modus pausiert das Modul automatisch."
      ),
      impactStyle: fieldCopy(
        "Bestimmt, wie stark sich Winkel, Perspektive und Schatten der Darts unterscheiden. Natürlich ist sichtbar, aber dezent; Dramatisch wirkt kräftiger.",
        "Klassisch erhält die bisherige einheitliche Ausrichtung. Natürlich gibt jedem Dart eine stabile, realistische Variation bei Winkel, Perspektive und Schatten. Dramatisch verstärkt diese Unterschiede für einen deutlicheren Demo- und TV-Look, ohne die Spitze vom Trefferpunkt zu verschieben.",
        "Regelt die stabile Variation von Dart-Winkel, Perspektive und Schatten."
      ),
      enableShadow: fieldCopy(
        "Schaltet den Einschlag-Schatten unter dem Dart ein oder aus. Zusätzliche Effekte können auf schwächeren Geräten zu Rucklern oder weniger flüssigen Animationen führen.",
        "Aktiviert einen leichten Schlagschatten unter dem Dart-Bild. Das gibt mehr räumlichen Eindruck rund um den Einschlagpunkt, erhöht aber je nach Szene auch die Grafiklast.",
        "Schaltet den Einschlag-Schatten der Dart-Grafik ein oder aus."
      ),
      enableShadowBlur: fieldCopy(
        "Schaltet die weiche Schattenzeichnung unter dem Dart ein oder aus. Auf schwächeren Geräten kann das zu Rucklern oder weniger flüssigen Animationen führen.",
        "Bestimmt, ob der Einschlag-Schatten weichgezeichnet dargestellt wird oder als klarere, schärfere Schattenform erscheint. Die Weichzeichnung erzeugt den realistischeren Eindruck, benötigt aber mehr GPU-Leistung.",
        "Schaltet die Weichzeichnung des Einschlag-Schattens ein oder aus."
      ),
      enableWobble: fieldCopy(
        "Schaltet das kurze Nachwippen beim Einschlag ein oder aus. Zusätzliche Effekte können auf schwächeren Geräten zu Rucklern oder weniger flüssigen Animationen führen.",
        "Aktiviert eine kurze Wackelbewegung des Dart-Bildes direkt nach der Landung. Das verstärkt den Einschlag-Effekt visuell und erhöht je nach Szene die Animationslast leicht.",
        "Schaltet das kurze Nachwippen der Dart-Grafik beim Einschlag ein oder aus."
      ),
      enableFlightBlur: fieldCopy(
        "Schaltet die Bewegungsunschärfe während der Fluganimation ein oder aus. Auf schwächeren Geräten kann das zu Rucklern oder weniger flüssigen Animationen führen.",
        "Bestimmt, ob der einfliegende Dart während der Flugphase leicht weichgezeichnet wird. Das wirkt dynamischer, benötigt aber zusätzliche GPU-Leistung.",
        "Schaltet die Bewegungsunschärfe der Fluganimation ein oder aus."
      ),
      flightSpeed: fieldCopy(
        "Regelt die Dauer der Fluganimation der Darts. Längere, sichtbare Animationen können auf schwächeren Geräten zu weniger flüssigen Bewegungen führen.",
        "Wählt die Dauer der Einfluganimation neuer Dart-Bilder. `Schnell` landet zügig, `Filmisch` hält die Flugphase sichtbar länger und lässt zusätzliche Effekte entsprechend länger sichtbar laufen.",
        "Regelt die Dauer der Fluganimation."
      ),
      debug: DEBUG_FIELD,
    },
  }),
  "take-out-darts-alert": featureCopy({
    cardDescription:
      "Macht den Hinweis zum Entfernen der Darts mit einer großen Grafik auffälliger.",
    visibleDescription:
      "Der Hinweis zum Entfernen der Darts wird als große Grafik deutlich präsenter dargestellt.",
    visualDescription:
      "Der normale Hinweis wird durch eine zentrierte Bildkarte ersetzt. Optional pulsiert die Grafik leicht, damit sie im Spielablauf nicht übersehen wird.",
    usefulWhen: "Wenn der Standardhinweis zu leicht übersehen wird.",
    images: [image("Hinweis: Darts entfernen", "animation-remove-darts-notification.png")],
    fields: {
      imageSize: fieldCopy(
        "Bestimmt die maximale Größe der eingeblendeten Grafik.",
        "Legt fest, wie groß die Hinweisgrafik auf dem Bildschirm erscheinen darf. Hohe Stufen nutzen mehr Platz und ziehen den Blick stärker an.",
        "Bestimmt die Größe der Hinweisgrafik."
      ),
      pulseAnimation: fieldCopy(
        "Schaltet die leichte Pulsbewegung der Grafik ein oder aus.",
        "Bestimmt, ob die Hinweisgrafik mit einer ruhigen Ein- und Ausbewegung pulsiert oder statisch bleibt.",
        "Schaltet die Pulsbewegung der Hinweisgrafik ein oder aus."
      ),
      pulseScale: fieldCopy(
        "Regelt, wie weit die Grafik im Puls maximal anwächst.",
        "Steuert die Stärke der Pulsbewegung. Höhere Stufen vergrößern die Grafik in der Mitte der Animation deutlicher.",
        "Regelt die Stärke der Pulsbewegung."
      ),
      debug: DEBUG_FIELD,
    },
  }),
  "single-bull-hit-sound": featureCopy({
    cardDescription:
      "Spielt bei Single Bull einen kurzen Ton zur akustischen Rückmeldung ab.",
    visibleDescription:
      "Bei Single Bull hörst du einen kurzen Ton; grafisch bleibt das Spiel unverändert.",
    visualDescription:
      "Es wird keine zusätzliche Grafik eingeblendet. Die Rückmeldung ist rein akustisch und reagiert auf erkannte Single-Bull-Treffer.",
    usefulWhen:
      "Wenn du Single Bull akustisch schneller bestätigen möchtest, ohne auf eine zusätzliche Animation zu achten.",
    images: [],
    fields: {
      "run-feature-action": fieldCopy(
        "Spielt den Single-Bull-Ton mit der aktuell gespeicherten Lautstärke.",
        "Startet einen direkten Sound-Test mit der gespeicherten Lautstärke, ohne auf einen echten Single-Bull-Treffer warten zu müssen. Der Testlauf ändert keine gespeicherten Werte.",
        "Startet einen direkten Sound-Test mit der gespeicherten Lautstärke."
      ),
      volume: fieldCopy(
        "Regelt die Lautstärke des abgespielten Tons.",
        "Bestimmt die Wiedergabelautstärke des Single-Bull-Sounds. An der Treffererkennung ändert sich dadurch nichts.",
        "Regelt die Lautstärke des Single-Bull-Sounds."
      ),
      cooldownMs: fieldCopy(
        "Verhindert, dass derselbe Ton zu schnell hintereinander erneut abgespielt wird.",
        "Legt die Sperrzeit zwischen zwei Sound-Auslösungen fest. So wird verhindert, dass derselbe Single-Bull mehrfach zu dicht nacheinander hörbar wird.",
        "Legt die Sperrzeit zwischen zwei Sound-Auslösungen fest."
      ),
      pollIntervalMs: fieldCopy(
        "Schaltet eine zusätzliche regelmäßige Trefferprüfung ein, wenn die direkte Erkennung nicht ausreicht.",
        "`Aus` verlässt sich ausschließlich auf direkt erkannte Änderungen. `Alle 1,2 Sekunden` ergänzt eine regelmäßige Prüfung, falls Treffer in bestimmten Setups nicht zuverlässig sofort erkannt werden.",
        "Schaltet optional eine zusätzliche Trefferprüfung alle 1,2 Sekunden ein."
      ),
      debug: DEBUG_FIELD,
    },
  }),
  "turn-score-counter": featureCopy({
    cardDescription:
      "Zählt Punkteänderungen beim Turn sichtbar hoch oder herunter.",
    visibleDescription:
      "Punkteänderungen beim Turn werden sichtbar hoch- oder heruntergezählt.",
    visualDescription:
      "Statt eines harten Sprungs läuft der angezeigte Wert weich zur neuen Punktzahl. Dadurch wird die Änderung als kurze Animation nachvollziehbar.",
    usefulWhen: "Wenn du Punktwechsel im Spielbild leichter verfolgen möchtest.",
    images: [
      image("Punkte animiert zählen", "animation-turn-points-count.gif"),
      image("Punkte animiert zählen – Detail", "animation-turn-points-count-detail-readme.gif"),
    ],
    fields: {
      countEffect: fieldCopy(
        "Wählt, wie die Zahl sichtbar zum neuen Wert läuft.",
        "`Fließend zählen` bewegt den Wert weich zum Ziel, `Rollende Zahlen` nutzt einen Anzeigetafel-Effekt und `In Schritten zählen` zeigt ganze Zwischenwerte nacheinander.",
        "Wählt die Zählweise der Punkte."
      ),
      durationMs: fieldCopy(
        "Bestimmt, wie schnell die Turn-Punkte wie auf einer Anzeigetafel zum Endwert laufen.",
        "Legt die Geschwindigkeit der Zählanimation fest. Schnell zählt 0 bis 60 in 1 Sekunde, Standard in 3 Sekunden, Ruhig in 5 Sekunden.",
        "Bestimmt die Geschwindigkeit des Hoch- oder Herunterzählens."
      ),
      flashOnChange: fieldCopy(
        "Schaltet das kurze Aufblitzen während einer echten Zahlenänderung ein oder aus.",
        "Wenn aktiv, blitzt der Turn-Wert nur in dem Zeitraum auf, in dem die Zahl wirklich animiert wird. Bei deaktivierter Option bleibt ausschließlich die Zählbewegung ohne zusätzlichen Lichtimpuls.",
        "Aktiviert oder deaktiviert das Aufblitzen während laufender Punkteänderungen."
      ),
      flashMode: fieldCopy(
        "Bestimmt, ob der elektrische Rahmen nur bei Änderungen erscheint oder dauerhaft sichtbar bleibt.",
        "Legt fest, wie der elektrische Rahmen dargestellt wird: `Nur bei Änderung` zeigt den Effekt nur während laufender Zähländerungen, `Permanent` hält den Rahmen dauerhaft sichtbar, solange das Feature aktiv ist.",
        "Wählt, ob der Rahmen nur bei Änderungen oder dauerhaft sichtbar ist."
      ),
      debug: DEBUG_FIELD,
    },
  }),
});

const THEME_BACKGROUND_DISPLAY_OPTION_COPY = deepFreeze({
  fill: optionCopy(
    "Füllt die Fläche komplett; Randbereiche des Bildes können abgeschnitten werden.",
    "Das Bild legt sich wie ein Vollflächen-Hintergrund über den gesamten Spielbereich. Leere Ränder entstehen nicht, dafür können Randbereiche abgeschnitten werden.",
    "Das Bild wirkt wie ein vollflächiges Wallpaper hinter dem Theme. Der komplette Bereich ist gefüllt, aber Motivteile am Rand können aus dem sichtbaren Ausschnitt herausfallen."
  ),
  fit: optionCopy(
    "Zeigt das ganze Bild vollständig; freie Ränder sind möglich.",
    "Das komplette Bild bleibt sichtbar und wird in die verfügbare Fläche eingepasst. Wenn das Seitenverhältnis nicht passt, bleiben am Rand freie Bereiche des Themes sichtbar.",
    "Das Motiv bleibt vollständig erhalten und wird vollständig in den verfügbaren Raum eingepasst. Dadurch geht nichts vom Bild verloren, aber je nach Format bleiben seitlich oder oben und unten sichtbare Theme-Flächen frei."
  ),
  stretch: optionCopy(
    "Zieht das Bild auf die komplette Fläche; Proportionen können verzerren.",
    "Das Bild wird auf Breite und Höhe des Bereichs gestreckt. Dadurch wird alles ausgefüllt, aber Kreise, Personen oder Logos können sichtbar verzerrt wirken.",
    "Das Motiv wird unabhängig vom Originalformat auf die komplette Theme-Fläche gezogen. So ist jeder Bereich bedeckt, aber die Bildproportionen können sichtbar auseinandergezogen oder zusammengedrückt wirken."
  ),
  center: optionCopy(
    "Zeigt das Bild mittig in Originalgröße; außen bleibt Theme-Hintergrund sichtbar.",
    "Das Bild sitzt mittig und bleibt in seiner natürlichen Größe. Ist es kleiner als der Bereich, bleibt rundherum der normale Theme-Hintergrund sichtbar.",
    "Das Motiv erscheint wie ein mittig aufgelegtes Poster ohne automatische Skalierung. Große leere Ränder des Themes bleiben stehen, wenn das Bild kleiner als der verfügbare Bereich ist."
  ),
  tile: optionCopy(
    "Wiederholt das Bild gekachelt wie ein Muster.",
    "Das Bild wird nicht skaliert, sondern links oben gestartet und über die Fläche wiederholt. Dadurch entsteht eher ein Musterteppich als ein einzelnes zentriertes Motiv.",
    "Das Motiv wird wie eine Kachel über die Theme-Fläche wiederholt. Statt eines einzelnen großen Hintergrundbilds entsteht ein sich wiederholendes Muster über den gesamten Bereich."
  ),
});

const THEME_BACKGROUND_OPACITY_OPTION_COPY = deepFreeze({
  "100": optionCopy(
    "Zeigt das Bild fast unverdeckt.",
    "Das Hintergrundbild bleibt fast ohne dunkle Dämpfung sichtbar. Farben, Kontraste und Details treten sehr klar hervor.",
    "Das Hintergrundbild wirkt nahezu ungefiltert und sehr präsent. Farben und Kanten bleiben deutlich sichtbar, sodass das Motiv den Look des Themes stark mitbestimmt."
  ),
  "85": optionCopy(
    "Zeigt das Bild sehr deutlich, aber schon leicht beruhigt.",
    "Das Bild bleibt sehr präsent, wird aber leicht durch die dunkle Theme-Schicht beruhigt. Details bleiben klar lesbar, ohne ganz so dominant wie bei 100 % zu wirken.",
    "Das Motiv bleibt klar sichtbar und prägt die Fläche stark, bekommt aber schon eine leichte dunkle Dämpfung. Dadurch bleibt der Bildcharakter erhalten, ohne ganz so hart in den Vordergrund zu drängen."
  ),
  "70": optionCopy(
    "Hält Bildwirkung und Theme-Dunkelung sichtbar im Gleichgewicht.",
    "Das Bild bleibt gut erkennbar, während die dunkle Überlagerung bereits spürbar für Ruhe sorgt. Motive und Farben sind noch klar da, aber weniger dominant.",
    "Das Hintergrundmotiv bleibt deutlich sichtbar, wirkt aber bereits eingebettet statt aufgeklebt. Farben und Formen sind noch erkennbar, während das Theme die Fläche ruhiger und geschlossener erscheinen lässt."
  ),
  "55": optionCopy(
    "Zeigt das Bild noch klar, aber merklich gedämpft.",
    "Das Bild bleibt sichtbar, wird aber schon spürbar abgedunkelt. Dadurch wirkt die Fläche ruhiger und konkurriert weniger mit Texten und Karten.",
    "Das Hintergrundbild ist weiterhin erkennbar, verliert aber deutlich an Dominanz. Diese Stufe ist ein Mittelweg, bei dem Motiv und Lesbarkeit ungefähr gleich wichtig bleiben."
  ),
  "40": optionCopy(
    "Lässt das Bild eher als ruhigen Hintergrund wirken.",
    "Das Motiv bleibt sichtbar, rückt aber klar in den Hintergrund. Farbflächen und Konturen wirken gedämpfter und dienen mehr als Stimmung als als Hauptmotiv.",
    "Das Bild ist noch klar als Motiv erkennbar, wird aber bereits deutlich von der dunklen Theme-Schicht zurückgenommen. Es wirkt mehr wie Atmosphäre im Hintergrund als wie ein aktives Titelmotiv."
  ),
  "30": optionCopy(
    "Hält dunkle Motive erkennbar und klar hinter den Spielinformationen.",
    "Das Hintergrundbild bleibt als Atmosphäre erkennbar, während Karten und Spieltexte sichtbar den Vorrang behalten.",
    "Diese Stufe eignet sich für bereits dunkle, ruhige Motive: Das Wallpaper bleibt erkennbar, konkurriert aber nicht mit den Spielinformationen."
  ),
  "25": optionCopy(
    "Zeigt das Bild nur noch als dezente Hintergrundstimmung.",
    "Das Bild schimmert eher subtil durch die dunkle Fläche. Einzelne Formen und Farben bleiben sichtbar, ohne die Lesbarkeit des Layouts zu stören.",
    "Das Motiv bleibt nur noch als ruhige Bildstimmung im Hintergrund erhalten. Farben und Strukturen tragen Atmosphäre bei, ohne Spielerfelder, Texte oder Karten optisch zu überholen."
  ),
  "20": optionCopy(
    "Dämpft strukturierte Motive deutlich zugunsten der Lesbarkeit.",
    "Das Bild bleibt als Farb- und Formstimmung sichtbar, tritt gegenüber Scores, Namen und Wurfinformationen aber klar zurück.",
    "Diese Stufe beruhigt strukturierte oder kontrastreiche Wallpaper deutlich und schützt die Lesbarkeit der darüberliegenden Spieloberfläche."
  ),
  "15": optionCopy(
    "Reduziert helle oder detailreiche Motive auf eine dezente Kulisse.",
    "Nur die wichtigsten Farben und Konturen bleiben sichtbar; helle Bildbereiche werden stark zurückgenommen.",
    "Diese Stufe ist für helle, detailreiche oder plakative Motive gedacht und macht sie zu einer sehr zurückhaltenden Kulisse."
  ),
  "10": optionCopy(
    "Lässt das Bild fast nur noch als dunkle Struktur durchscheinen.",
    "Das Bild wird sehr stark gedämpft. Erkennbar bleiben meist nur grobe Formen, helle Bereiche oder größere Farbflächen.",
    "Das Hintergrundmotiv ist fast nur noch als Schatten, Form oder grobe Farbstruktur wahrnehmbar. Diese Stufe priorisiert eine ruhige, sehr lesbare Oberfläche gegenüber sichtbaren Bilddetails."
  ),
});

const THEME_PLAYER_TRANSPARENCY_OPTION_COPY = deepFreeze({
  "0": optionCopy(
    "Lässt die Spielerfelder nahezu deckend wirken.",
    "Die Spielerfelder bleiben fast vollständig geschlossen. Der Hintergrund tritt kaum durch und die Karten wirken sehr kompakt.",
    "Die Spielerfelder erscheinen nahezu opak und schirmen das Hintergrundbild stark ab. Das Layout wirkt dadurch ruhig, dicht und klar vom Hintergrund getrennt."
  ),
  "5": optionCopy(
    "Lässt nur eine sehr leichte Durchsicht zu.",
    "Die Spielerfelder bleiben überwiegend geschlossen, lassen aber minimal mehr Hintergrund durch als 0 %. Der Unterschied ist dezent, aber sichtbar ruhiger als höhere Stufen.",
    "Die Karten wirken weiterhin fast deckend, zeigen aber schon eine leichte Durchlässigkeit. Das ist für Nutzer gedacht, die kaum Transparenz möchten, aber etwas mehr Tiefe als bei komplett geschlossenen Flächen."
  ),
  "10": optionCopy(
    "Lässt den Hintergrund leicht durch die Spielerfelder scheinen.",
    "Die Spielerfelder bleiben klar lesbar, wirken aber nicht mehr komplett geschlossen. Das Hintergrundbild schimmert leicht durch die Flächen.",
    "Die Karten behalten eine stabile Lesbarkeit, bekommen aber eine leichte Glasscheiben-Wirkung. Hintergrundfarben und Motive bleiben nur dezent hinter den Spielerflächen sichtbar."
  ),
  "15": optionCopy(
    "Zeigt eine spürbare, aber noch ruhige Transparenz.",
    "Die Spielerfelder wirken bereits lockerer und lassen das Hintergrundbild sichtbar mitspielen. Texte und Werte bleiben dabei weiter klar getrennt.",
    "Die Karten wirken bereits spürbar transparenter und vermitteln mehr Tiefe zwischen Oberfläche und Hintergrund. Das Motiv hinter den Spielerfeldern wird deutlicher wahrnehmbar, ohne die Lesbarkeit stark zu gefährden."
  ),
  "30": optionCopy(
    "Macht die Spielerfelder deutlich transparenter.",
    "Der Hintergrund tritt nun klar hinter den Spielerfeldern hervor. Die Karten wirken leichter und weniger massiv als bei den niedrigen Stufen.",
    "Die Spielerfelder erscheinen deutlich luftiger und geben dem Hintergrundbild sichtbar mehr Raum. Diese Stufe verschiebt das Layout klar in Richtung transparentes Overlay statt geschlossener Kartenfläche."
  ),
  "45": optionCopy(
    "Lässt viel Hintergrund durch die Spielerfelder hindurchscheinen.",
    "Die Spielerfelder wirken sichtbar glasiger. Das Hintergrundmotiv bleibt unter den Flächen deutlich erkennbar und prägt den Gesamteindruck stärker.",
    "Die Karten verlieren einen großen Teil ihrer optischen Dichte und lassen das Motiv dahinter klar durchkommen. Das Layout wirkt dadurch offener, aber auch stärker vom Hintergrundbild beeinflusst."
  ),
  "60": optionCopy(
    "Macht die Spielerfelder sehr transparent und leicht.",
    "Die Spielerfelder lassen den Hintergrund sehr deutlich sichtbar werden. Diese Stufe wirkt am luftigsten, kann aber je nach Bild die Ruhe der Oberfläche reduzieren.",
    "Die Karten erscheinen fast wie halbtransparente Glasflächen über dem Hintergrund. Das Motiv dahinter bleibt stark sichtbar und gestaltet die Oberfläche sehr aktiv mit."
  ),
});

const THEME_ACTIVE_PLAYER_TINT_INTENSITY_OPTION_COPY = deepFreeze({
  "0": optionCopy(
    "Schaltet die Aktivkarten-Tönung vollständig aus.",
    "Es wird keine zusätzliche Hintergrundtönung für aktive oder gewinnende Spielerfelder gesetzt. Die Karten bleiben bei ihrer normalen Theme-Fläche.",
    "Die Aktivkarten-Tönung bleibt komplett deaktiviert."
  ),
  "10": optionCopy(
    "Lässt die aktive Spielerfarbe leicht in die Karte einfließen.",
    "Der Rahmenfarbton schimmert leicht in den Hintergrund aktiver Spielerkarten hinein. Die Wirkung bleibt dezent und ergänzt den Grundlook nur vorsichtig.",
    "Die aktive Spielerfarbe färbt die Kartenfläche leicht ein."
  ),
  "15": optionCopy(
    "Setzt eine ausgewogene Standard-Tönung für aktive Karten.",
    "Die aktive Spielerfarbe ist als leichte Hintergrundfärbung klar wahrnehmbar, ohne die Lesbarkeit oder die Theme-Fläche zu dominieren. Diese Stufe entspricht dem vorgesehenen Standard.",
    "Die aktive Spielerfarbe schimmert sichtbar, aber weiterhin ausgewogen durch die aktive Kartenfläche."
  ),
  "20": optionCopy(
    "Lässt die aktive Spielerfarbe deutlich stärker durch die Kartenfläche scheinen.",
    "Die aktive Karte wirkt klarer eingefärbt und übernimmt mehr von der Rahmenfarbe. Der Effekt bleibt noch kontrolliert, tritt aber sichtbar präsenter hervor als bei 15 %.",
    "Die Kartenfläche übernimmt die aktive Spielerfarbe bereits deutlich."
  ),
  "25": optionCopy(
    "Macht die Aktivkarten-Tönung sehr präsent.",
    "Die Rahmenfarbe prägt den Hintergrund aktiver oder gewinnender Spielerkarten deutlich und verändert den Kartencharakter spürbar. Diese Stufe ist markant, bleibt aber noch gut kontrollierbar.",
    "Die Aktivkarten-Tönung wird stark sichtbar und prägt den Kartenhintergrund klar."
  ),
  "30": optionCopy(
    "Macht die Aktivkarten-Tönung am stärksten sichtbar.",
    "Die Rahmenfarbe prägt den Hintergrund aktiver oder gewinnender Spielerkarten sehr deutlich. Diese Stufe ist die markanteste Variante und verändert den Kartencharakter am stärksten.",
    "Die Aktivkarten-Tönung wird maximal sichtbar und prägt den Kartenhintergrund stark."
  ),
});

const THEME_GLOBAL_TURN_DART_STYLE_OPTION_COPY = deepFreeze({
  original: optionCopy(
    "Belässt die Autodarts-Darts unverändert.",
    "Die drei Dart-Grafiken im Wurffeld bleiben im Originalzustand von Autodarts.",
    "Belässt die Darts in der Wurfanzeige unverändert."
  ),
  solid: optionCopy(
    "Ersetzt die Darts in der Wurfanzeige durch eine einfarbige Grafik.",
    "Die drei Dart-Grafiken im Wurffeld werden durch eine generierte SVG-Grafik in der gewählten Dart-Farbe ersetzt.",
    "Nutzt eine einfarbige Dart-Grafik."
  ),
  gradient: optionCopy(
    "Ersetzt die Darts in der Wurfanzeige durch eine Grafik mit Farbverlauf.",
    "Die drei Dart-Grafiken im Wurffeld werden durch eine generierte SVG-Grafik mit Verlauf aus Verlaufsfarbe, Dart-Farbe und heller Spitze ersetzt.",
    "Nutzt eine Dart-Grafik mit Verlauf."
  ),
  preset: optionCopy(
    "Nutzt das ausgewählte Dart-Bild in der Wurfanzeige.",
    "Die drei Dart-Grafiken in der Wurfanzeige verwenden das unter `Dart auswählen` gewählte, lokal gebündelte Dart-Bild. Das Design von `Treffermarkierungen durch Darts ersetzen` bleibt dabei unverändert.",
    "Nutzt das ausgewählte vorbereitete Dart-Bild."
  ),
  image: optionCopy(
    "Nutzt das hochgeladene Bild in der Wurfanzeige.",
    "Die drei Darts in der Wurfanzeige verwenden das im Modul gespeicherte eigene Bild. Ohne gespeichertes Bild bleibt die Anzeige unverändert.",
    "Nutzt ein eigenes gespeichertes Dart-Bild."
  ),
});

const THEME_GLOBAL_TURN_DART_SIZE_OPTION_COPY = deepFreeze({
  "100": optionCopy(
    "Hält die Darts nah an der Autodarts-Größe.",
    "Die ersetzten Darts in der Wurfanzeige bleiben kompakt und verändern die Leiste nur minimal.",
    "Kompakte Darts in der Wurfanzeige."
  ),
  "115": optionCopy(
    "Verwendet die empfohlene Standardgröße.",
    "Die Darts in der Wurfanzeige werden etwas präsenter, bleiben aber innerhalb der üblichen Leistenhöhe.",
    "Standardgröße für die Darts in der Wurfanzeige."
  ),
  "135": optionCopy(
    "Macht die Darts in der Wurfanzeige deutlich präsenter.",
    "Die Darts in der Wurfanzeige werden größer angezeigt. Das passt besonders für reduzierte oder transparente eigene Bilder.",
    "Große Darts in der Wurfanzeige."
  ),
});

const CHECKOUT_SCORE_EFFECT_OPTION_COPY = deepFreeze({
  "grow-glow": optionCopy(
    "Lässt die Punktzahl weich ein- und ausatmen.",
    "Die Zahl wächst und leuchtet rhythmisch leicht an und fällt wieder auf ihre Ausgangsform zurück. Das wirkt wie ein ruhiger Herzschlag direkt auf dem Score.",
    "Die Restpunktzahl bekommt einen weichen Puls aus Größenänderung, Helligkeit und Schattierung. Der Effekt wirkt organisch und wiederkehrend, ohne die Zahl hart springen zu lassen."
  ),
  "glow-only": optionCopy(
    "Lässt die Punktzahl vor allem über einen Lichtschein auffallen.",
    "Die Zahl bleibt weitgehend ruhig an Ort und Größe, bekommt aber einen sichtbar stärker werdenden Leuchtkranz. Das eignet sich für Nutzer, die eher Licht als Bewegung wollen.",
    "Der Fokus liegt auf einem an- und abschwellenden Glühen um die Zahl herum. Die Score-Anzeige selbst bleibt relativ stabil, während der Lichtschein die Aufmerksamkeit auf das Finish lenkt."
  ),
  "grow-only": optionCopy(
    "Lässt die Punktzahl sichtbar größer und kleiner werden.",
    "Die Zahl springt nicht hart, sondern wächst kurz auf und fällt wieder zurück. Hier steht die Größenänderung stärker im Vordergrund als der Lichtschein.",
    "Die Finish-Zahl wird zyklisch vergrößert und wieder auf Normalgröße zurückgeführt. Der Effekt wirkt direkter als reines Leuchten, ohne hartes Blinken zu nutzen."
  ),
  "fade-blink": optionCopy(
    "Lässt die Punktzahl rhythmisch heller und dunkler blinken.",
    "Die Zahl bleibt an derselben Stelle, verliert aber im Takt sichtbar an Deckkraft und wird wieder voll sichtbar. Das ist die auffälligste und härteste Variante.",
    "Die Score-Anzeige blinkt über deutliche Helligkeitssprünge zwischen klar sichtbar und stark gedimmt. Dadurch wirkt der Effekt am alarmierendsten und fällt sofort ins Auge."
  ),
});

const CHECKOUT_SCORE_COLOR_OPTION_COPY = deepFreeze({
  "159, 219, 88": optionCopy(
    "Nutzen ein helles Grün wie eine saubere Finish-Freigabe.",
    "Der Effekt erscheint in einem frischen Grün und wirkt wie ein positives Finish-Signal. Das passt besonders gut zum Autodarts-Grundlook.",
    "Der Score-Effekt nutzt ein helles, freundliches Grün und wirkt dadurch wie eine klare Freigabe oder Bestätigung. Diese Palette fügt sich am natürlichsten in den bestehenden Autodarts-Look ein."
  ),
  "56, 189, 248": optionCopy(
    "Zeigt den Effekt in kühlem Cyan.",
    "Der Score bekommt einen kühlen, technischer wirkenden Cyan-Schimmer. Das hebt sich sichtbar vom Standardgrün ab, ohne aggressiv zu wirken.",
    "Diese Variante färbt die Hervorhebung in ein kühles Cyan. Dadurch wirkt der Checkout-Effekt moderner und technischer, bleibt aber ruhiger als warme Warnfarben."
  ),
  "245, 158, 11": optionCopy(
    "Zeigt den Effekt in warmem Amber.",
    "Die Punktzahl wirkt mit einem goldgelben bis bernsteinfarbenen Schein wärmer und auffälliger. Das ist optisch näher an Warnlicht als das grüne Preset.",
    "Die Hervorhebung läuft in einen warmen Amberton und erinnert optisch eher an Bühnenlicht oder Warnakzent. Dadurch wirkt der Finish-Hinweis energischer und wärmer als Grün oder Cyan."
  ),
  "248, 113, 113": optionCopy(
    "Zeigt den Effekt in klarem Rot.",
    "Die Zahl erhält einen roten Leuchteffekt und wirkt dadurch am alarmierendsten. Das fällt sofort auf, kann aber deutlich aggressiver wirken als die anderen Farbvarianten.",
    "Diese Variante färbt die Finish-Anzeige klar rot und macht sie dadurch besonders dringlich und auffällig. Sie erzeugt den stärksten Warn- oder Alarmcharakter unter den verfügbaren Farbpaletten."
  ),
});

const CHECKOUT_SCORE_INTENSITY_OPTION_COPY = deepFreeze({
  dezent: optionCopy(
    "Bleibt sichtbar, aber zurückhaltend.",
    "Größe, Leuchtstärke und Deckkraft ändern sich nur moderat. Der Effekt ist erkennbar, ohne den Score dauerhaft zu dominieren.",
    "Diese Stufe hält Skalierung, Glühen und Blinktiefe bewusst zurück. Der Checkout-Hinweis bleibt lesbar und präsent, wirkt aber eher wie ein feiner Hinweis als wie ein Alarm."
  ),
  standard: optionCopy(
    "Nutzt die ausgewogene Mittelstufe.",
    "Der Effekt ist klar sichtbar, ohne übermäßig hart zu wirken. Das ist die Standardbalance zwischen Aufmerksamkeit und Ruhe.",
    "Diese Stufe liefert den vorgesehenen Mittelweg für Skalierung, Leuchtweite und Blinkstärke. Die Finish-Hervorhebung ist deutlich genug für schnelle Wahrnehmung, ohne zu hektisch zu werden."
  ),
  stark: optionCopy(
    "Macht Größe, Leuchten und Blinktiefe am auffälligsten.",
    "Glow, Skalierung und Sichtbarkeitswechsel werden deutlich stärker. Die Zahl springt dir optisch am schnellsten ins Auge.",
    "Diese Stufe erhöht die Maximalwerte für Skalierung, Schimmer und Sichtbarkeitsschwankung spürbar. Der Effekt wirkt energischer, dominanter und ist auch aus größerem Abstand leichter wahrzunehmen."
  ),
});

const CHECKOUT_SCORE_TRIGGER_OPTION_COPY = deepFreeze({
  "suggestion-first": optionCopy(
    "Nutzen zuerst den sichtbaren Checkout-Vorschlag und fällt sonst auf den Score zurück.",
    "Der Effekt folgt bevorzugt dem angezeigten Suggestion-Block. Mehrschrittige Routen lösen ihn noch nicht aus; bei fehlender oder klar unpassender Route entscheidet die reine Score-Prüfung.",
    "Diese Einstellung koppelt die Hervorhebung zuerst an die sichtbare Checkout-Empfehlung und nutzt den Punktestand nur als Fallback. Mehrschrittige Routen lösen den Effekt noch nicht aus; entscheidend ist erst der aktuell fällige Finish-Dart."
  ),
  "score-only": optionCopy(
    "Lässt ausschließlich den mathematisch finishfähigen Score auslösen.",
    "Der sichtbare Suggestion-Text spielt keine Rolle. Sobald der Restwert nach den Out-Regeln mit dem nächsten Dart direkt finishbar ist, wird der Effekt gezeigt.",
    "Mit dieser Einstellung entscheidet allein, ob der aktuelle Score mit dem nächsten Dart direkt finishbar ist. Sichtbare Checkout-Vorschläge beeinflussen den Effekt nicht mehr."
  ),
  "suggestion-only": optionCopy(
    "Lässt nur einen vorhandenen Checkout-Vorschlag auslösen.",
    "Der Effekt erscheint nur dann, wenn der sichtbare Suggestion-Hinweis genau den aktuell fälligen Finish-Dart trägt. Ein direkt finishbarer Score ohne passenden Vorschlag bleibt ohne Effekt.",
    "Diese Einstellung bindet die Hervorhebung strikt an den sichtbaren Suggestion-Block. Selbst ein rechnerisch direkt finishbarer Wert erzeugt keinen Effekt, solange kein passender Finish-Vorschlag erkannt wird."
  ),
});

const BOARD_TARGET_VISUAL_PRESET_OPTION_COPY = deepFreeze({
  "soft-pulse": optionCopy(
    "Betont das Ziel ruhig und fokussiert mit Kontur, Opazität und sanftem Halo.",
    "Das Segment bleibt ruhig und klar markiert, atmet aber leicht über Opazität, Kontur, Halo und eine kleine Skalierung. Dadurch wirkt die Darstellung lebendiger, ohne unruhig zu werden.",
    "Diese Darstellung hält das nächste sinnvolle Checkout-Ziel ruhig und klar im Fokus und ergänzt Helligkeit, Halo und Kontur um eine kleine, kontrollierte Skalierung."
  ),
  "fast-blink": optionCopy(
    "Arbeitet mit einem klaren, sauberen Blinksignal ähnlich zum nativen Board-Hinweis.",
    "Die Markierung folgt einem sauberen Blinkpuls ähnlich zum nativen Board-Hinweis und kombiniert den Helligkeitswechsel mit leichter Vergrößerung und Leuchten. Das wirkt direkt, bleibt aber kontrolliert.",
    "Diese Darstellung orientiert sich am nativen Blinkgefühl und setzt das Ziel mit klaren Helligkeitswechseln, leichtem Wachstum und sauberem Halo in Szene."
  ),
  "slow-glow": optionCopy(
    "Hält das Ziel fast konstant sichtbar und verändert nur Glow und Kontur leicht.",
    "Die Markierung bleibt dauerhaft präsent und bewegt sich nur minimal über Helligkeit, Halo und eine sehr kleine Skalierung. Das ist die ruhigste Variante für feste Orientierung ohne starkes Signalverhalten.",
    "Diese Darstellung eignet sich, wenn das Checkout-Ziel eher als konstanter Board-Hinweis mit nur minimaler Bewegung sichtbar sein soll."
  ),
});

const BOARD_TARGET_SEGMENT_STYLE_OPTION_COPY = deepFreeze({
  "surface-outline": optionCopy(
    "Zeigt die farbige Fläche zusammen mit Rahmen und Zielkontur.",
    "Die Checkout-Ziele behalten die farbige Füllung, ihre farbige Segmentkontur und die weiße pulsierende Zielkontur. Das ist die bisherige, klar gerahmte Darstellung.",
    "Diese Variante kombiniert die farbige Fläche mit Segmentrahmen und zusätzlicher Zielkontur und entspricht dem bisherigen Standard-Look."
  ),
  "surface-only": optionCopy(
    "Zeigt nur die farbige Fläche ohne Rahmen.",
    "Die Markierung färbt nur die Ziel-Fläche selbst ein und blendet sowohl die farbige Segmentkontur als auch die weiße Zielkontur aus. Farben, Glow, Opazität und Bewegungsverhalten des gewählten Presets bleiben trotzdem auf der Fläche aktiv.",
    "Diese Variante markiert das Ziel ausschließlich über die eingefärbte Fläche und lässt den Rahmen komplett weg, während Preset und Farblogik auf der Fläche erhalten bleiben."
  ),
});


const BOARD_TARGET_COLOR_OPTION_COPY = deepFreeze({
  violet: optionCopy(
    "Färbt Ziele in violettem Leuchten.",
    "Die Segmentfüllung und Kontur laufen in eine violette Palette. Das wirkt am stärksten wie ein klassischer Neon-Overlay-Look.",
    "Diese Palette nutzt ein klares Violett für Füllung und Kontur der Checkout-Ziele. Dadurch wirkt die Markierung deutlich futuristischer und hebt sich stark von den Standardfarben des Boards ab."
  ),
  cyan: optionCopy(
    "Färbt Ziele in kühlem Cyan.",
    "Die Board-Markierung wirkt technisch und frisch, ohne so warm wie Amber zu erscheinen. Gerade auf dunklen Flächen wirkt Cyan sehr klar.",
    "Diese Farbpalette färbt die Ziele in ein kühles Cyan und erzeugt damit einen sauberen, technischen Look. Auf dunklen Board-Bereichen wirkt die Markierung sehr klar und modern."
  ),
  amber: optionCopy(
    "Färbt Ziele in warmem Amber.",
    "Die Markierung erinnert eher an warmes Warn- oder Bühnenlicht. Das fällt deutlich auf und wirkt energischer als Cyan.",
    "Die Checkout-Ziele werden in eine warme Amber- bis Goldwirkung getaucht. Dadurch wirkt das Overlay energetischer, wärmer und stärker wie ein Warn- oder Fokusakzent."
  ),
  lime: optionCopy(
    "Färbt Ziele in klarem Signal-Lime.",
    "Die Markierung nutzt ein helles Lime-Grün mit hoher Signalwirkung. Gerade auf dunklen Board-Flächen bleibt das Ziel sehr schnell erfassbar.",
    "Diese Palette setzt auf ein klares Lime-Grün für maximale Sichtbarkeit. Sie ist bewusst stark von Violett, Cyan und Amber getrennt und wirkt wie ein präziser Signalmarker am Board."
  ),
  rose: optionCopy(
    "Färbt Ziele in kräftigem Rose.",
    "Die Markierung nutzt einen klaren Rot-Pink-Akzent. Das hebt sich deutlich von Cyan, Lime und Amber ab und wirkt besonders auffällig.",
    "Diese Palette färbt Checkout-Ziele in ein kräftiges Rose bis Pink. Dadurch entsteht ein warmer, sehr sichtbarer Gegenpol zu den kühleren und grünen Signalvarianten."
  ),
  white: optionCopy(
    "Färbt Ziele in hellem Signalweiß.",
    "Die Markierung bleibt neutral und sehr hell. Die weiße Kontur sorgt vor allem auf dunklen Board-Bereichen für starke Lesbarkeit.",
    "Diese Palette nutzt ein kühles Signalweiß für Füllung und Kontur. Sie ist die neutralste Variante und bleibt trotzdem sehr präsent, ohne eine zusätzliche Farbstimmung vorzugeben."
  ),
});

const BOARD_TARGET_SELECTION_MODE_OPTION_COPY = deepFreeze({
  next: optionCopy(
    "Markiert genau das nächste sinnvolle Feld der validierten Checkout-Route.",
    "Unter `180` wird immer genau das Segment hervorgehoben, das als nächster sinnvoller Dart aus Score, Out-Mode und plausibler sichtbarer Route hervorgeht. Fehlt eine brauchbare sichtbare Route, wird sie scorebasiert sinnvoll ergänzt oder ersetzt.",
    "Markiert unter `180` genau das nächste sinnvolle Feld; wenn keine Finish-Route mehr steht, bleibt ein plausibler sichtbarer Setup-Hinweis als nächstes Feld erhalten."
  ),
  all: optionCopy(
    "Markiert alle Felder der autoritativen Checkout-Route gleichzeitig.",
    "Die komplette validierte beziehungsweise scorebasiert ergänzte Route wird am Board sichtbar gemacht. Das zuerst zu spielende Segment bleibt dabei klar am stärksten betont, Folgeziele laufen bewusst ruhiger mit.",
    "Markiert alle Segmente der validierten beziehungsweise scorebasiert ergänzten Route gleichzeitig, mit klarem Fokus auf dem ersten Schritt."
  ),
  finish: optionCopy(
    "Markiert nur das Finish-Feld, sobald es wirklich der aktuelle Ein-Dart-Checkout ist.",
    "Es wird ausschließlich das Segment hervorgehoben, das den Leg im aktuellen Wurf tatsächlich beenden kann. Mehrstufige Setup-Routen wie `T20` plus `D18` bleiben deshalb zunächst unmarkiert; fällt die sichtbare Route weg oder ist erkennbar veraltet, darf ein direkter scorebasierter Ein-Dart-Checkout weiterhin erscheinen.",
    "Markiert nur das aktuelle Finish-Segment; mehrstufige Setup-Routen bleiben bis zum echten Finish-Dart unmarkiert."
  ),
});

const TV_BOARD_ZOOM_LEVEL_OPTION_COPY = deepFreeze({
  "2.35": optionCopy(
    "Zoomt vergleichsweise weit und lässt noch viel Boardumfeld stehen.",
    "Das Segment wird klar vergrößert, aber noch mit gut sichtbarer Umgebung gezeigt. Die Kamera wirkt dadurch weniger eng.",
    "Diese Stufe vergrößert das Ziel spürbar, lässt aber noch viel vom restlichen Board im Bild. Der Effekt wirkt eher wie ein sanfter Fokus als wie ein enger Ausschnitt."
  ),
  "2.75": optionCopy(
    "Nutzen die ausgewogene Standardvergrößerung.",
    "Der relevante Bereich rückt klar nach vorn, ohne den Kontext komplett zu verlieren. Das ist der Mittelweg zwischen Überblick und Fokus.",
    "Diese Stufe liefert den vorgesehenen Mittelwert für den Board-Zoom. Das Zielsegment wird deutlich hervorgehoben, während rundherum noch genug Board sichtbar bleibt, um sich räumlich zu orientieren."
  ),
  "3.15": optionCopy(
    "Zoomt am engsten auf den Zielbereich.",
    "Das relevante Segment füllt deutlich mehr vom sichtbaren Bereich. Rundherum bleibt weniger Board-Kontext übrig, dafür springt das Ziel stärker in den Fokus.",
    "Diese Stufe zieht die Kamera am stärksten in den relevanten Bereich hinein. Das Zielsegment dominiert das Bild klarer, während das restliche Board stärker aus dem Blickfeld rückt."
  ),
});

const TV_BOARD_ZOOM_SPEED_OPTION_COPY = deepFreeze({
  schnell: optionCopy(
    "Fährt zügig ein und aus.",
    "Der Zoom reagiert schnell und direkt, fast wie ein kurzer Kamerasprung mit weicher Kante. Das wirkt am dynamischsten.",
    "Diese Stufe verkürzt Ein- und Auszoomung sichtbar und lässt den Fokus direkter anspringen. Die Bewegung bleibt weich, fühlt sich aber deutlich sportlicher und unmittelbarer an."
  ),
  mittel: optionCopy(
    "Nutzen die ausgewogene Standardgeschwindigkeit.",
    "Der Zoom läuft weder hektisch noch träge. Diese Stufe hält die Balance zwischen direktem Fokus und TV-artiger Ruhe.",
    "Diese Stufe ist der Mittelweg zwischen schnellem Fokuswechsel und weicher Kamerafahrt. Die Bewegung bleibt klar wahrnehmbar, ohne das Geschehen unnötig zu verzögern."
  ),
  langsam: optionCopy(
    "Fährt sichtbar ruhiger und länger ein und aus.",
    "Der Zoom wirkt stärker wie eine bewusste Kamerafahrt. Das Ziel baut sich langsamer auf und bleibt dadurch filmischer im Blick.",
    "Diese Einstellung verlängert Ein- und Auszoomung spürbar. Der Fokus wirkt dadurch weicher und cineastischer, aber weniger direkt als bei `Schnell`."
  ),
});

const TV_BOARD_ZOOM_TARGET_OPTION_COPY = deepFreeze({
  "finish-only": optionCopy(
    "Zoomt bei Checkout-Routen nur auf das eigentliche Finish-Feld.",
    "Mehrstufige Checkout-Routen wie `T16` plus `D8` werden standardmäßig auf das letzte, legbeendende Segment fokussiert. Gezoomt werden dabei nur echte Ein-Dart-Finishes gemäß aktivem Out-Mode; normale Setup-Schritte bleiben unberücksichtigt.",
    "Fokussiert bei sichtbaren Checkout-Routen nur das abschließende Finish-Feld."
  ),
  "route-first": optionCopy(
    "Zoomt auf das erste sichtbare Feld der Checkout-Route.",
    "Der Zoom folgt dem zuerst zu spielenden Schritt der sichtbaren Checkout-Route. Das entspricht dem früheren Routenfokus, bei dem mehrstufige Empfehlungen direkt beim ersten Segment beginnen.",
    "Fokussiert bei sichtbaren Checkout-Routen das erste Routenfeld."
  ),
});

const CHECKOUT_SUGGESTION_STYLE_OPTION_COPY = deepFreeze({
  badge: optionCopy(
    "Markiert die Checkout-Felder mit einer gestrichelten Kontur.",
    "Die Checkout-Felder erhalten eine ruhige Akzentfläche und einen gestrichelten Rahmen. Die Theme-Typografie bleibt sichtbar.",
    "Diese Variante verbindet die vergrößerten Checkout-Felder mit einer gestrichelten Kontur und einer dezenten Akzentfläche. Schrift und Textfarbe kommen weiterhin aus dem aktiven Theme."
  ),
  ribbon: optionCopy(
    "Betont die Checkout-Felder mit einer leuchtenden Oberkante.",
    "Eine kräftige Akzentkante und ein kontrolliertes Leuchten erzeugen den Charakter eines Bandes, ohne Text zu überlagern.",
    "Diese Variante inszeniert die Checkout-Felder mit einer farbigen Oberkante und einem kontrollierten Glow. Das Label bleibt gerade und die Theme-Typografie vollständig lesbar."
  ),
  stripe: optionCopy(
    "Setzt eine klare Akzentleiste an die Checkout-Felder.",
    "Eine seitliche Farbleiste gibt der Route einen technischen Signalcharakter, ohne ein Muster hinter den Text zu legen.",
    "Diese Variante markiert die Checkout-Felder mit einer seitlichen Akzentleiste und einem ruhigen Flächenverlauf. Dadurch bleibt die Route signalstark und zugleich gut lesbar."
  ),
  ticket: optionCopy(
    "Rahmt die Checkout-Felder mit einer Ticket-Kontur.",
    "Eine gestrichelte Innenkontur erzeugt den Ticket-Look, ohne eine Trennlinie durch das Segment zu ziehen.",
    "Diese Variante formt jedes Checkout-Feld mit einer gestrichelten Innenkontur wie ein Ticket. Der Segmenttext bleibt frei von überlagernden Linien oder Mustern."
  ),
  outline: optionCopy(
    "Zeigt den Vorschlag mit kräftigem Außenrahmen.",
    "Die Empfehlung wird vor allem über einen starken Außenrahmen hervorgehoben. Das wirkt besonders klar und ruhig.",
    "Diese Variante hält die Fläche selbst relativ ruhig und setzt auf eine kräftige äußere Kontur. Der Vorschlag wirkt dadurch klar, präzise und eher technisch als verspielt."
  ),
});

const CHECKOUT_SUGGESTION_LABEL_OPTION_COPY = deepFreeze({
  CHECKOUT: optionCopy(
    "Zeigt im ersten Checkout-Feld das Label `CHECKOUT`.",
    "Im ersten Feld der Route erscheint ein festes `CHECKOUT`-Label. Das wirkt klar technisch und direkt am klassischen Begriff orientiert.",
    "Diese Einstellung setzt im ersten Checkout-Feld ein festes `CHECKOUT`-Label. Dadurch wird die Route sofort als Checkout-Hinweis lesbar, auch wenn man nur kurz auf die Fläche schaut."
  ),
  FINISH: optionCopy(
    "Zeigt im ersten Checkout-Feld das Label `FINISH`.",
    "Das erste Checkout-Feld bekommt statt `CHECKOUT` das Wort `FINISH`. Das wirkt kürzer und direkter auf den Abschluss des Legs bezogen.",
    "Mit dieser Option trägt das erste Feld der Checkout-Route das Label `FINISH` statt `CHECKOUT`. Das wirkt sprachlich kompakter und rückt den Abschluss stärker in den Vordergrund."
  ),
  "": optionCopy(
    "Blendet das zusätzliche Label komplett aus.",
    "Die gestylten Checkout-Felder bleiben aktiv, tragen aber keine eigene Label-Kapsel. Dadurch wirkt die Route ruhiger und flacher.",
    "Diese Option entfernt die kleine Label-Marke aus dem ersten Checkout-Feld vollständig. Die farbige Hülle bleibt erhalten, aber die Route wirkt minimalistischer."
  ),
});

const CHECKOUT_SUGGESTION_COLOR_OPTION_COPY = deepFreeze({
  amber: optionCopy(
    "Nutzen warme Bernstein- und Goldtöne.",
    "Der Vorschlagsblock wirkt warm, leuchtend und leicht wie Warn- oder Bühnenlicht eingefärbt. Das ist die präsenteste Standardwirkung.",
    "Diese Palette taucht die Hülle in warme Amber- und Goldtöne. Dadurch wirkt die Empfehlung freundlich, energisch und sehr gut vom dunklen Hintergrund abgesetzt."
  ),
  cyan: optionCopy(
    "Nutzen kühle Cyan-Akzente.",
    "Die Hülle wirkt technischer, frischer und kühler als mit Amber. Gerade bei dunklen Hintergründen tritt die Empfehlung sehr sauber hervor.",
    "Diese Farbpalette setzt auf kühle Cyan-Töne für Rahmen, Label und Hintergrundakzent. Der Vorschlag wirkt dadurch moderner, technischer und etwas nüchterner als bei warmen Farben."
  ),
  rose: optionCopy(
    "Nutzen roséfarbene bis rote Akzente.",
    "Der Vorschlagsblock bekommt eine auffällige, leicht dramatische Rosé-Färbung. Das ist die emotionalste und kräftigste Variante unter den drei Themes.",
    "Diese Palette färbt den Suggestion-Block in rosé- bis rotlastige Akzente. Dadurch wirkt der Hinweis markanter, emotionaler und stärker wie ein bewusst gesetzter Signalblock."
  ),
});

const AVG_TREND_DURATION_OPTION_COPY = deepFreeze({
  "220": optionCopy(
    "Zeigt den Pfeil nur sehr kurz.",
    "Der Richtungsimpuls erscheint und verschwindet schnell wieder. Das ist die knappste und unaufdringlichste Variante.",
    "Diese Stufe hält die Bounce-Animation sehr kurz. Der Pfeil markiert die AVG-Änderung nur als schnellen Impuls und verschwindet fast sofort wieder."
  ),
  "320": optionCopy(
    "Nutzen die ausgewogene Standarddauer.",
    "Der Pfeil bleibt lang genug sichtbar, um die Richtung sicher zu erkennen, ohne lange stehen zu bleiben.",
    "Diese Stufe bietet einen guten Mittelweg: Der Pfeil ist klar wahrnehmbar, verschwindet aber noch zügig genug, um die AVG-Anzeige nicht zu blockieren."
  ),
  "500": optionCopy(
    "Lässt den Pfeil deutlich länger im Blick bleiben.",
    "Die Richtungsanzeige hält spürbar länger an und wirkt dadurch präsenter. Das ist aus mehr Abstand am leichtesten zu erfassen.",
    "Diese Stufe verlängert die sichtbare Bounce-Phase deutlich. Dadurch bleibt die Trendrichtung länger lesbar und ist auch in hektischeren Spielsituationen leichter wahrzunehmen."
  ),
});

const AVG_TREND_SIZE_OPTION_COPY = deepFreeze({
  klein: optionCopy(
    "Zeigt einen schmalen, unauffälligen Pfeil.",
    "Der Trendpfeil bleibt kompakt und nimmt wenig Platz neben dem AVG ein. Das wirkt zurückhaltend und sauber.",
    "Diese Stufe hält den Pfeil klein und schmal. Die AVG-Anzeige bleibt optisch führend, während der Trend nur als diskreter Zusatz erscheint."
  ),
  standard: optionCopy(
    "Nutzen die ausgewogene Standardgröße.",
    "Der Pfeil bleibt klar erkennbar, ohne neben dem AVG zu dominant zu wirken. Das ist die neutrale Mittelstufe.",
    "Diese Größe bietet einen guten Mittelweg zwischen Lesbarkeit und Zurückhaltung. Der Trend ist gut erkennbar, ohne die AVG-Zahl optisch zu überholen."
  ),
  gross: optionCopy(
    "Zeigt einen größeren und weiter abgesetzten Pfeil.",
    "Der Pfeil bekommt mehr Breite, Höhe und Abstand. Dadurch bleibt die Richtung aus mehr Entfernung leichter sichtbar.",
    "Diese Stufe macht den Trendpfeil deutlich größer und gibt ihm etwas mehr Abstand zur AVG-Zahl. Das verbessert die Erkennbarkeit besonders auf größeren Displays oder aus größerer Distanz."
  ),
});

const SPECIAL_HIT_COLOR_THEME_OPTION_COPY = deepFreeze({
  "kind-signal": optionCopy(
    "Erzwingt eine feste, sofort erkennbare Trefferfarblogik: Triple rot, Double blau, Bull grün.",
    "Jede Trefferart bekommt immer dieselbe Signalfarbe. Das verbessert die schnelle Unterscheidung unabhängig vom gewählten Theme und sorgt für konsistente Farben in allen Legs.",
    "Verwendet feste Signalfarben pro Trefferart: `Triple = rot`, `Double = blau`, `Bull = grün`."
  ),
  "ember-rush": optionCopy(
    "Solar Flare setzt auf heiße Orange-Rot-Gold-Verläufe mit diagonalem Flame-Stripe-Look.",
    "Der Look arbeitet mit warmen Feuerfarben, auffälligen Diagonalstreifen und starkem Broadcast-Glow. Das ist die aggressivste warme Palette im Paket und wirkt wie ein laufender Hitzeimpuls.",
    "Solar Flare taucht das Trefferfeld in Orange-, Rot- und Goldtöne mit sichtbaren Flame-Stripes. Rand, Verlauf und Text wirken wie aufgeheizt und präsent."
  ),
  "ice-circuit": optionCopy(
    "Ice Reactor kombiniert Cyan-Blau mit technischem Grid und kaltem Reaktor-Glow.",
    "Der Look mischt eisige Cyan-/Blautone mit sichtbaren Horizontal- und Vertikallinien. Das Trefferfeld wirkt dadurch wie ein heller Sci-Fi-Reaktor mit klarer technischer Struktur.",
    "Ice Reactor baut einen kühlen Cyan-Blau-Look mit Grid-Muster und technischem Randlicht auf. Das Ergebnis wirkt präzise, futuristisch und deutlich weniger weich als warme Themes."
  ),
  "volt-lime": optionCopy(
    "Venom Lime setzt auf Cyberpunk-Hazard-Stripes in Neon-Lime, Grün und Signalgelb.",
    "Das Trefferfeld leuchtet in toxischen Lime-, Grün- und Gelbwerten und kombiniert das mit sichtbarer Warnstreifen-Optik. Das ist die lauteste und plakativste Variante für maximale Signalwirkung.",
    "Venom Lime mischt neonige Cyberpunk-Farben mit Hazard-Stripes und hartem Glow. Verlauf, Rand und Text springen damit am stärksten ins Auge."
  ),
  "crimson-steel": optionCopy(
    "Crimson Velocity kombiniert Rennrot mit dunklem Stahl, Scanlines und Metall-Kante.",
    "Die Fläche wirkt schneller und härter als die warmen Themes: roter Kern, dunklere Seiten, feine Scanlines und ein metallischer Unterton. Das ist sportlich, ernst und markant ohne Neon-Giftlook.",
    "Crimson Velocity kombiniert schnelle Rottöne mit Stahlakzenten, Scanlines und scharfem Randlicht. Das Ergebnis wirkt wie ein Performance- oder Mecha-Look."
  ),
  "arctic-mint": optionCopy(
    "Polar Mint setzt auf Mint, Aqua und Türkis mit hellen Streifen und klarer Frische.",
    "Das Trefferfeld wirkt klar, luftig und trotzdem sichtbar geladen. Helle Stripe- und Line-Layer geben der Palette Struktur, ohne so aggressiv zu werden wie Venom Lime.",
    "Polar Mint mischt Mint, Aqua und Türkis mit leichter Stripe-Struktur zu einer frischen Trefferwelt. Der Look bleibt deutlich, aber ruhiger als die aggressiveren Varianten."
  ),
  "champagne-night": optionCopy(
    "Midnight Gold setzt auf Vintage-Nachtlook mit Gold, Elfenbein und eleganten Deco-Streifen.",
    "Die Treffer wirken wie warme Nachtlichter mit goldener Kante, dunkler Basis und feinen Art-Deco-Stripe-Layern. Das ist edel, sichtbar und weniger schrill als Neon.",
    "Midnight Gold legt Gold, Amber und Elfenbein über eine dunkle Vintage-Basis mit vertikalen Deco-Streifen. Das Trefferfeld wirkt dadurch hochwertig, warm und sehr gut lesbar."
  ),
});

const SPECIAL_HIT_ANIMATION_STYLE_OPTION_COPY = deepFreeze({
  "pop-hit": optionCopy(
    "Lässt das Trefferfeld kurz und deutlich aufspringen.",
    "Das frisch erkannte Trefferfeld bewegt sich sichtbar nach vorn, betont die Zahl und fällt sauber zurück. Die Animation wird einmal pro Treffer abgespielt.",
    "Kurzes Aufspringen mit starkem Zahlenfokus."
  ),
  "side-shake": optionCopy(
    "Lässt das Trefferfeld einmal kurz seitlich wackeln.",
    "Das Trefferfeld und die Zahl bewegen sich einmal kurz zur Seite und kehren danach vollständig in den Ruhezustand zurück.",
    "Kurzes seitliches Wackeln ohne Dauerbewegung."
  ),
  "glow-pop": optionCopy(
    "Lässt Fläche, Rand und Score einmal hell aufleuchten.",
    "Der Treffer baut ein kurzes helles Leuchten auf und nimmt es sofort wieder zurück. Danach bleibt keine Animation aktiv.",
    "Einmaliges Aufleuchten ohne Seitenbewegung oder Daueranimation."
  ),
  "flip-spin": optionCopy(
    "Dreht das Trefferfeld einmal räumlich und lässt es sauber zurückfallen.",
    "Das Wurffeld bekommt eine kurze räumliche Drehung mit leichtem Textnachlauf. Die Bewegung wird einmal pro Treffer abgespielt.",
    "Kurze räumliche Drehung des Trefferfelds."
  ),
  "light-sweep": optionCopy(
    "Zieht einen glänzenden Lichtlauf einmal über Feld, Rand und Text.",
    "Der Effekt ersetzt die alten Sweep-/Outline-Doppelungen durch einen saubereren Glanz-Sweep. Er wirkt hochwertig, bleibt aber kürzer und ruhiger als ein technischer Loop.",
    "Ein einmaliger Lichtzug läuft über das Trefferfeld und betont den Rand ohne dauerhafte Bewegung."
  ),
  "shockwave-ring": optionCopy(
    "Schickt eine deutliche Welle durch Rand, Feld und Zahl.",
    "Der Rand expandiert sichtbar, der Score öffnet sich stärker und das Feld wirkt wie von einer Ringwelle getroffen. Das bleibt ein plakativ lesbarer One-Shot-Burst.",
    "Der Wellenring inszeniert den Treffer wie eine kurze Druckwelle mit stärkerem Ringimpuls und sichtbarem Textschub."
  ),
  "electric-jolt": optionCopy(
    "Schickt einen kurzen, zackigen Stromimpuls über Trefferfeld und Score.",
    "Der Treffer springt in kurzen Seitenzucken mit hellem Spannungspeak an, bevor er sauber zurückfällt. Das wirkt wie ein elektrischer Burst ohne dauerhaften Idle-Loop.",
    "Der Stromstoß kombiniert einen kompakten elektrischen Impuls mit leichter Seitenbewegung auf Feld, Score und Segment. Die Wirkung ist kräftig und kurz."
  ),
});

const CRICKET_DIM_STYLE_OPTION_COPY = deepFreeze({
  off: optionCopy(
    "Lässt irrelevante Felder unverändert stehen.",
    "Nicht relevante Board-Segmente werden nicht zusätzlich abgedunkelt. Das Board bleibt vollständig hell und zeigt Zustände nur über die aktiven Overlays.",
    "Mit dieser Option bleiben irrelevante Board-Felder optisch unangetastet. Das Board behält überall seine normale Grundwirkung, während nur die tatsächlich markierten Zustände zusätzliche Overlays bekommen."
  ),
  smoke: optionCopy(
    "Dämpft irrelevante Felder weich mit grauer Rauchschicht.",
    "Unwichtige Board-Bereiche bekommen eine gleichmäßige dunkle Dämpfung. Das Ziel bleibt sichtbar, ohne dass harte Muster oder Kanten hinzukommen.",
    "Diese Variante legt eine weiche, gleichmäßige Abdunkelung über irrelevante Segmente. Das Board wirkt ruhiger, ohne mit Mustern oder starker Maskierung vom aktiven Ziel abzulenken."
  ),
  hatch: optionCopy(
    "Dämpft irrelevante Felder zusätzlich mit sichtbarer Schraffur.",
    "Neben der Abdunkelung erscheint ein gestreiftes Muster über den irrelevanten Segmenten. Dadurch sind diese Bereiche klar als Hintergrund markiert.",
    "Diese Stufe kombiniert eine graue Dämpfung mit sichtbarer Schraffur. Irrelevante Felder sind dadurch klarer als passive Zone gekennzeichnet als bei `Rauch`."
  ),
  mask: optionCopy(
    "Legt eine besonders harte dunkle Maske über irrelevante Felder.",
    "Nicht relevante Segmente werden am stärksten zurückgenommen und wirken fast abgesenkt. Das hebt aktive Ziele am deutlichsten heraus.",
    "Diese Variante nutzt die härteste Abdunkelung und deckt irrelevante Bereiche fast wie mit einer schwarzen Maske ab. Dadurch stehen aktive, offene und druckrelevante Ziele maximal im Vordergrund."
  ),
});

const CRICKET_BOARD_COLOR_OPTION_COPY = deepFreeze({
  standard: optionCopy(
    "Nutzen das normale Grün-Rot-Schema.",
    "Scoring- und Druckzustände erscheinen in der regulären Farbbalance des Moduls. Das fügt sich am unauffälligsten in die übrige Oberfläche ein.",
    "Diese Palette verwendet das Standard-Grün für Scoring und das normale Rot für Druckzustände. Sie liefert die vorgesehene Grundwirkung ohne zusätzliche Kontrastschärfung."
  ),
  "high-contrast": optionCopy(
    "Nutzen ein kräftigeres Grün für Scoring-Zustände.",
    "Scoring-Bereiche leuchten etwas klarer und kontrastreicher, während Druck rot bleibt. Das hilft besonders auf unruhigen oder helleren Hintergründen.",
    "Diese Palette verstärkt vor allem die grüne Scoring-Wirkung gegenüber dem Standardmodus. Dadurch heben sich offensive Ziele klarer vom Board und von anderen Zuständen ab."
  ),
});

const CRICKET_BOARD_INTENSITY_OPTION_COPY = deepFreeze({
  subtle: optionCopy(
    "Hält Board-Overlays bewusst leicht und transparent.",
    "Offene, tote und druckrelevante Segmente bleiben markiert, wirken aber gedämpfter und weniger flächig.",
    "Diese Stufe reduziert Deckkraft und Konturwirkung der Board-Overlays. Zustände bleiben lesbar, drängen sich aber weniger stark in den Vordergrund."
  ),
  normal: optionCopy(
    "Nutzen die ausgewogene Standardstärke.",
    "Füllung, Kontur und Abdunkelung bleiben klar sichtbar, ohne das Board zu stark zu überziehen. Das ist die neutrale Mittelstufe.",
    "Diese Einstellung liefert den Standardwert für Füllung, Kontur und Dimmwirkung. Das Board bleibt gut interpretierbar, ohne optisch zu schwer zu werden."
  ),
  strong: optionCopy(
    "Macht Füllung, Kontur und Zustandskontrast deutlich kräftiger.",
    "Offene, tote und druckrelevante Segmente treten härter und flächiger hervor. Das erleichtert das Erkennen aus größerem Abstand.",
    "Diese Stufe erhöht Sichtbarkeit, Konturboost und Flächenwirkung der Overlays spürbar. Zustände springen dadurch schneller ins Auge, wirken aber deutlich dominanter auf dem Board."
  ),
});

const CRICKET_GRID_COLOR_OPTION_COPY = deepFreeze({
  standard: optionCopy(
    "Nutzen die normale Grün-Rot-Balance der Grid-Effekte.",
    "Scoring- und Drucksignale bleiben klar, aber in der vorgesehenen Standardwirkung. Das wirkt am neutralsten im Grid.",
    "Diese Palette verwendet die Standardfarben für offensive und druckbezogene Grid-Effekte. Sie liefert den normalen Look für Badge-Glows, Streifen, Kanten und Zellmarkierungen."
  ),
  "high-contrast": optionCopy(
    "Nutzen ein kräftigeres Grün für offensive Grid-Zustände.",
    "Scoring-Flächen und offensive Akzente leuchten klarer, während Druck rot bleibt. Das trennt grüne und rote Zustände sichtbarer voneinander.",
    "Diese Palette verstärkt vor allem die grüne Offensivwirkung im Grid. Badge-Glows, Scoring-Streifen und offensive Flächen heben sich dadurch klarer von roten Druckzuständen ab."
  ),
});

const CRICKET_GRID_INTENSITY_OPTION_COPY = deepFreeze({
  subtle: optionCopy(
    "Hält Glow, Füllung und Kanten eher fein.",
    "Die Matrix reagiert sichtbar, aber mit weniger Leuchtkraft und geringerer Flächenwirkung. Das wirkt ruhiger und technischer.",
    "Diese Stufe reduziert die Opazität und den Glanz der Grid-FX-Komponenten. Zeilen, Badges und Zellzustände bleiben informativ, treten aber weniger plakativ auf."
  ),
  normal: optionCopy(
    "Nutzen die ausgewogene Standardstärke im Grid.",
    "Die Matrix zeigt Kanten, Glows und Flächen klar, ohne zu überladen zu wirken. Das ist die neutrale Mittelstufe.",
    "Diese Einstellung liefert den Standardwert für Badge-Glow, Zellfüllung, Druckkante und Scoring-Streifen. Das Grid bleibt klar interpretierbar und zugleich kontrolliert."
  ),
  strong: optionCopy(
    "Macht Grid-Glows, Kanten und Flächen deutlich kräftiger.",
    "Grüne und rote Zustände wirken heller, breiter und schneller lesbar. Das springt besonders bei schnellen Wechseln stärker ins Auge.",
    "Diese Stufe erhöht die sichtbare Stärke von Glow, Füllung und Kanten im gesamten Grid-FX-Paket. Offensiv- und Druckzustände wirken dadurch markanter und dominieren die Matrix stärker."
  ),
});

const DART_MARKER_SIZE_OPTION_COPY = deepFreeze({
  "4": optionCopy(
    "Zeigt eher kleine Marker-Betonungen.",
    "Die vorhandenen Marker wachsen nur moderat über ihre Grundgröße hinaus. Das hält die Hervorhebung kompakt.",
    "Diese Stufe lässt die Marker nur leicht anwachsen und bleibt nah an der ursprünglichen Geometrie des Boards. Die Treffer werden klarer, aber nicht großflächig."
  ),
  "6": optionCopy(
    "Nutzen die ausgewogene Standardgröße.",
    "Die Marker werden sichtbar größer, ohne das Segment zu stark zu füllen. Das ist die neutrale Mittelstufe.",
    "Diese Einstellung liefert den Standardwert für die Markergröße. Treffer springen besser ins Auge, ohne die Board-Geometrie optisch zu überladen."
  ),
  "9": optionCopy(
    "Zeigt die Marker am größten und auffälligsten.",
    "Die Trefferpunkte füllen deutlich mehr Fläche und sind aus größerer Distanz leichter zu erkennen. Das ist die plakativste Variante.",
    "Diese Stufe vergrößert die Marker am stärksten. Treffer dominieren dadurch den getroffenen Bereich sichtbarer und bleiben besonders auf größeren oder weiter entfernten Displays erkennbar."
  ),
});

const DART_MARKER_COLOR_OPTION_COPY = deepFreeze({
  "rgb(49, 130, 206)": optionCopy(
    "Färbt die Marker in kräftigem Blau.",
    "Die Hervorhebung wirkt kühl, technisch und klar. Blau ist die neutralste der verfügbaren Markerfarben.",
    "Diese Variante färbt die Marker in ein kräftiges Blau und erzeugt damit eine saubere, technische Hervorhebung. Sie wirkt deutlich sichtbar, ohne die Warnwirkung von Rot oder Gelb zu nutzen."
  ),
  "rgb(34, 197, 94)": optionCopy(
    "Färbt die Marker in sattem Grün.",
    "Die Treffer wirken positiv, sauber und gut sichtbar. Gerade auf dunklen Boards hebt sich Grün klar ab.",
    "Diese Palette färbt die Marker in ein kräftiges Grün. Dadurch wirken Treffer klar bestätigt und bleiben auf dunklen Board-Flächen sehr gut erkennbar."
  ),
  "rgb(248, 113, 113)": optionCopy(
    "Färbt die Marker in klarem Rot.",
    "Die Marker springen sehr stark ins Auge und wirken deutlich warnender oder aggressiver als Blau und Grün.",
    "Diese Farbe färbt die Treffer in ein helles Rot und erzeugt damit die auffälligste Alarmwirkung unter den Markerfarben. Das ist besonders plakativ, kann aber bewusst aggressiver wirken."
  ),
  "rgb(250, 204, 21)": optionCopy(
    "Färbt die Marker in hellem Gelb.",
    "Die Treffer bekommen einen warmen, sehr leuchtenden Akzent. Auf dunklen Boards sticht Gelb besonders klar hervor.",
    "Diese Variante färbt die Marker in ein kräftiges Gelb. Dadurch wirken Treffer sehr hell und aufmerksamkeitsstark, fast wie kleine Signalpunkte auf dem Board."
  ),
  "rgb(255, 255, 255)": optionCopy(
    "Färbt die Marker neutral weiß.",
    "Die Hervorhebung bleibt farbneutral, wirkt aber sehr klar und kontrastreich. Das eignet sich gut, wenn die Marker nicht an eine bestimmte Farbe gebunden sein sollen.",
    "Diese Palette setzt auf ein neutrales Weiß für die Markerbetonung. Der Effekt wirkt dadurch sehr klar und universell, ohne die Farbwirkung des restlichen Setups zu beeinflussen."
  ),
});

const DART_MARKER_EFFECT_OPTION_COPY = deepFreeze({
  "soft-glow": optionCopy(
    "Lässt Marker weich glühen.",
    "Die Treffermarkierungen bekommen einen Lichtschein, der Breite und Helligkeit sichtbar an- und abschwellen lässt. Das wirkt ruhiger als das Pulsieren der Größe.",
    "Diese Variante verstärkt die Treffermarkierungen durch ein an- und abschwellendes Leuchten. Der Trefferpunkt bleibt stabil und wirkt über den Lichtschein präsenter."
  ),
  "size-pulse": optionCopy(
    "Lässt Marker rhythmisch größer und kleiner werden.",
    "Die Marker skalieren sichtbar auf und ab. Das wirkt lebendiger und bewegter als der reine Glow-Effekt.",
    "Diese Variante lässt die Marker zyklisch wachsen und wieder zurückfallen. Dadurch bekommen Treffer eine deutlichere Bewegungswirkung als beim reinen Leuchten."
  ),
  none: optionCopy(
    "Zeigt nur die statische Marker-Betonung ohne Zusatzanimation.",
    "Farbe, Größe und Rand bleiben aktiv, aber die Treffermarkierung bewegt sich nicht. Das ist die ruhigste Darstellung.",
    "Mit dieser Einstellung bleibt nur die statische Hervorhebung aus Farbe, Größe und optionalem Rand erhalten. Der Treffer wirkt klarer, aber ohne jede Zusatzbewegung."
  ),
});

const DART_MARKER_OPACITY_OPTION_COPY = deepFreeze({
  "65": optionCopy(
    "Hält die Marker sichtbar, aber eher transparent.",
    "Die Treffer bleiben betont, wirken aber leichter und weniger massiv. Das ist die zurückhaltendste Sichtbarkeitsstufe.",
    "Diese Stufe reduziert die Deckkraft der betonten Marker spürbar. Treffer bleiben sichtbar hervorgehoben, wirken aber weniger flächig und dominierend."
  ),
  "85": optionCopy(
    "Nutzen die ausgewogene Standardsichtbarkeit.",
    "Die Marker wirken klar und präsent, ohne vollständig deckend zu werden. Das ist die neutrale Mittelstufe.",
    "Diese Einstellung liefert den Standardwert für die Marker-Deckkraft. Treffer werden deutlich betont, ohne die Boardfläche komplett zu überdecken."
  ),
  "100": optionCopy(
    "Zeigt die Marker voll sichtbar und am stärksten deckend.",
    "Die Treffer wirken am präsentesten und verlieren kaum noch Transparenz. Das ist die auffälligste Sichtbarkeitsstufe.",
    "Diese Stufe zeichnet die Marker mit voller Deckkraft. Dadurch springen Treffer maximal ins Auge und setzen sich am härtesten vom Board-Hintergrund ab."
  ),
});

const DART_MARKER_OUTLINE_OPTION_COPY = deepFreeze({
  aus: optionCopy(
    "Zeigt keinen zusätzlichen Rand.",
    "Die Marker werden nur über Farbe, Größe und optionalen Effekt betont. Ein Rand zur zusätzlichen Abgrenzung bleibt aus.",
    "Mit dieser Option bleibt die Markerbetonung auf Farbe, Größe und Animation beschränkt. Es wird keine zusätzliche Kontur zur Trennung vom Hintergrund gesetzt."
  ),
  weiss: optionCopy(
    "Setzt einen hellen weißen Rand um die Marker.",
    "Die Marker heben sich besser gegen dunkle oder kräftig gefärbte Segmentflächen ab. Das wirkt klar und sauber.",
    "Diese Variante ergänzt einen weißen Rand um die Treffermarkierung. Dadurch bleibt der Treffer auch auf dunklen oder farbstarken Hintergründen besser abgegrenzt."
  ),
  schwarz: optionCopy(
    "Setzt einen dunklen schwarzen Rand um die Marker.",
    "Die Treffermarkierungen gewinnen besonders auf helleren Bereichen mehr Kontur. Das wirkt etwas härter als der weiße Rand.",
    "Diese Option ergänzt eine schwarze Kontur und verbessert die Trennung auf helleren oder stark leuchtenden Segmentflächen. Der Marker bekommt dadurch einen härteren, grafischeren Rand."
  ),
});

const DART_DESIGN_OPTION_COPY = deepFreeze({
  aireplicant: optionCopy(
    "Zeigt einen futuristischen Dart mit technisch wirkendem Flight.",
    "Der Flight wirkt kühl, hell und technisch und gibt dem Dart einen KI-nahen Sci-Fi-Look. Das Motiv ist detailreicher als die einfachen Farbvarianten.",
    "Dieses Motiv nutzt einen futuristischen Flight mit technisch anmutender Gestaltung. Der Dart wirkt dadurch moderner, kühler und stärker wie ein Sci-Fi-Design als die schlichten Farbvarianten."
  ),
  bullet: optionCopy(
    "Zeigt einen kompakten Dart mit Bullet-Anmutung.",
    "Das Design wirkt gedrungener, metallischer und stärker auf Einschlag getrimmt. Es passt, wenn die Dart-Marker robuster und direkter aussehen sollen.",
    "Diese Variante setzt auf einen kompakten, metallischen Look mit Bullet-Anmutung. Dadurch wirkt der Dart besonders direkt, schwerer und weniger verspielt als die farbigen Flight-Designs."
  ),
  germangiant: optionCopy(
    "Zeigt ein German-Giant-inspiriertes Dart-Motiv.",
    "Der Dart nutzt ein klares Profi-Motiv mit markanter Flight-Gestaltung. Das wirkt sportlich und weniger abstrakt als die Standardfarben.",
    "Dieses Motiv ist an einen German-Giant-Stil angelehnt und wirkt wie ein konkretes Spielerdesign. Der Dart bleibt sportlich, präsent und stärker charakterbezogen als die neutralen Varianten."
  ),
  mandalorian: optionCopy(
    "Zeigt einen Dart mit Mandalorian-inspiriertem Flight.",
    "Der Flight trägt ein starkes Sci-Fi-Motiv und wirkt dadurch dekorativer und thematischer als die Uni-Farben.",
    "Diese Variante nutzt ein Mandalorian-inspiriertes Motiv auf dem Flight. Dadurch bekommt der Dart einen klar thematischen Sci-Fi-Charakter und fällt stärker als Designobjekt auf."
  ),
  nuke: optionCopy(
    "Zeigt einen Dart mit auffälligem Nuke-Motiv.",
    "Das Motiv wirkt warnend, energisch und deutlich plakativ. Es eignet sich, wenn Treffer optisch sehr stark herausstechen sollen.",
    "Dieses Design setzt auf ein auffälliges Nuke-Motiv mit warnender, energiegeladener Wirkung. Der Dart wirkt dadurch besonders plakativ und deutlich aggressiver als neutrale Varianten."
  ),
  philtaylor: optionCopy(
    "Zeigt ein Phil-Taylor-inspiriertes Dart-Motiv.",
    "Der Dart wirkt wie ein klassisches Spielerdesign und bleibt dabei sportlich und gut lesbar. Das Motiv ist ruhiger als die Comic- und Sci-Fi-Varianten.",
    "Diese Variante ist an einen Phil-Taylor-Stil angelehnt und wirkt wie ein traditionelleres Spielerdesign. Der Dart bleibt sportlich, klar und weniger verspielt als die auffälligeren Motiv-Flights."
  ),
  snakebite: optionCopy(
    "Zeigt ein Snakebite-inspiriertes Dart-Motiv.",
    "Der Flight wirkt wild, kontrastreich und spielerbezogen. Das Design ist deutlich auffälliger als die schlichten Standardfarben.",
    "Dieses Motiv ist an einen Snakebite-Stil angelehnt und setzt auf eine markante, lebendige Flight-Gestaltung. Dadurch wirkt der Dart charakterstark und klar weniger neutral."
  ),
  standard: optionCopy(
    "Zeigt einen klassischen Standard-Dart.",
    "Der Dart bleibt schlicht, ausgewogen und wenig dekorativ. Das ist die neutralste Alternative zu `Autodarts`.",
    "Diese Variante nutzt einen klassischen Standard-Look ohne starkes Sondermotiv. Der Dart wirkt dadurch vertraut, ruhig und als neutraler Ersatzmarker gut lesbar."
  ),
  stdyellow: optionCopy(
    "Zeigt einen klassischen Standard-Dart mit gelbem Flight.",
    "Der Standard-Look bleibt schlicht, bekommt aber durch den gelben Flight mehr Sichtbarkeit und Wärme.",
    "Diese Variante kombiniert den klassischen Standard-Dart mit einem gelben Flight. Dadurch bleibt das Motiv ruhig, hebt sich aber heller und wärmer vom Board ab."
  ),
  stdyellow2: optionCopy(
    "Zeigt eine zweite gelbe Standard-Dart-Variante.",
    "Das Motiv bleibt im Standard-Stil, setzt den gelben Flight aber etwas anders um. Es ist eine alternative gelbe Variante mit klassischer Wirkung.",
    "Diese zweite gelbe Standard-Variante bleibt nahe am klassischen Dart-Look, variiert aber die gelbe Flight-Gestaltung. Sie wirkt ähnlich ruhig wie `Standard Yellow`, aber etwas eigenständiger."
  ),
  ultramarine: optionCopy(
    "Zeigt einen Dart mit kräftigem Ultramarin-Blau.",
    "Der Flight wirkt tiefblau, klar und sehr kühl. Das Design ist farbkräftiger als `Blue`, bleibt aber weiterhin sauber und ruhig.",
    "Diese Variante nutzt einen kräftigen Ultramarin-Ton und wirkt dadurch tiefer, kühler und markanter als die einfache blaue Variante. Der Dart bleibt klar lesbar und farblich fokussiert."
  ),
  autodarts: optionCopy(
    "Zeigt einen silbernen Dart mit violett-blauem Verlaufsflight.",
    "Der Dart nutzt ein metallisches Barrel und einen Flight mit violettem bis blauem Farbverlauf. Das wirkt modern und leicht neonartig.",
    "Dieses Motiv zeigt einen silbernen Dart mit einem weichen violett-blauen Verlaufsflight. Der Look wirkt modern, leicht futuristisch und hebt sich klar von den einfarbigen Varianten ab."
  ),
  blackblue: optionCopy(
    "Zeigt einen dunklen Dart mit leuchtend blauen Linien im Flight.",
    "Der Flight wirkt fast schwarz und trägt klare blaue Linienakzente. Dadurch entsteht ein technischer, neonartiger Look.",
    "Dieses Motiv kombiniert einen dunklen Flight mit prägnanten blauen Linien. Dadurch wirkt der Dart besonders technisch, modern und kontrastreich."
  ),
  blackgreen: optionCopy(
    "Zeigt einen dunklen Dart mit grünen Akzenten im Flight.",
    "Der Flight bleibt dunkel und wird von kräftigen grünen Akzenten durchzogen. Das wirkt markant, aber weniger kühl als `Black Blue`.",
    "Dieses Motiv hält den Dart insgesamt dunkel und setzt grüne Linien oder Akzente auf dem Flight. Dadurch entsteht ein sportlicher, kontrastreicher Look mit klarem Grünfokus."
  ),
  blackred: optionCopy(
    "Zeigt einen dunklen Dart mit roten Akzenten im Flight.",
    "Der dunkle Flight bekommt rote Akzentlinien und wirkt dadurch am aggressivsten unter den dunklen Varianten.",
    "Dieses Motiv nutzt einen sehr dunklen Flight mit roten Akzentlinien. Das erzeugt den schärfsten und offensivsten Look unter den schwarzen Designs."
  ),
  blue: optionCopy(
    "Zeigt einen Dart mit klarem blauem Flight.",
    "Der Flight bleibt farblich eindeutig blau und wirkt sauber, ruhig und gut sichtbar. Das ist eine klare einfarbige Alternative.",
    "Diese Variante setzt auf einen klar blau gefärbten Flight ohne Sondermuster. Der Dart wirkt dadurch ruhig, sauber und eindeutig farbcodiert."
  ),
  camoflage: optionCopy(
    "Zeigt einen Dart mit Tarnmuster auf dem Flight.",
    "Der Flight trägt ein grün-braunes Camouflage-Muster. Das wirkt rauer und deutlich weniger clean als die Uni-Farben.",
    "Dieses Motiv setzt auf ein klassisches Tarnmuster in Grün-, Braun- und Beigetönen. Der Dart wirkt dadurch rustikaler und charaktervoller als die glatten Farbvarianten."
  ),
  green: optionCopy(
    "Zeigt einen Dart mit kräftig grünem Flight.",
    "Der Flight wirkt klar grün und gut sichtbar. Das ist die einfarbige grüne Alternative ohne Sondermuster.",
    "Diese Variante zeigt einen klar grün gefärbten Flight ohne zusätzliche Muster. Der Look bleibt schlicht, sportlich und farblich sofort lesbar."
  ),
  pride: optionCopy(
    "Zeigt einen Dart mit Regenbogenverlauf auf dem Flight.",
    "Der Flight trägt einen vollständigen Regenbogenverlauf und wirkt dadurch am buntesten und auffälligsten der Designs.",
    "Dieses Motiv nutzt einen sichtbaren Regenbogenverlauf über den Flight-Flächen. Der Dart wirkt dadurch besonders farbig, lebendig und unverwechselbar."
  ),
  red: optionCopy(
    "Zeigt einen Dart mit kräftig rotem Flight.",
    "Der Flight ist klar rot eingefärbt und wirkt dadurch energisch und sehr präsent. Das ist die direkte, einfarbige Rot-Variante.",
    "Diese Variante setzt auf einen klar roten Flight ohne Zusatzmuster. Der Dart wirkt dadurch sofort energisch und fällt als warmer Akzent deutlich auf."
  ),
  white: optionCopy(
    "Zeigt einen Dart mit hellem weißem Flight.",
    "Der Flight wirkt neutral, hell und sauber. Das ist die schlichteste helle Variante.",
    "Dieses Motiv nutzt einen weißen Flight ohne starke Zusatzgrafik. Der Dart wirkt dadurch besonders sauber, neutral und leicht."
  ),
  whitetrible: optionCopy(
    "Zeigt einen weißen Flight mit grauem Tribal-Muster.",
    "Der helle Flight trägt ein graues, tribalartiges Muster und wirkt dadurch detailreicher als das schlichte weiße Design.",
    "Diese Variante kombiniert einen weißen Flight mit einem sichtbaren grauen Tribal-Muster. Dadurch bleibt der Dart hell, bekommt aber deutlich mehr Charakter als die reine Weiß-Version."
  ),
  yellow: optionCopy(
    "Zeigt einen Dart mit kräftig gelbem Flight.",
    "Der Flight wirkt hell, warm und sehr sichtbar. Gelb sticht auf dunklen Boards besonders klar heraus.",
    "Dieses Motiv setzt auf einen klar gelben Flight ohne zusätzliches Muster. Der Dart wirkt dadurch sehr hell und bleibt auch auf dunkleren Hintergründen deutlich sichtbar."
  ),
  yellowscull: optionCopy(
    "Zeigt einen gelben Flight mit großem Totenkopf-Motiv.",
    "Der Flight bleibt gelb, bekommt aber zusätzlich einen großen schwarzen Totenkopf als Hauptmotiv. Das ist die plakativste gelbe Variante.",
    "Diese Variante nutzt einen hellgelben Flight mit großem Totenkopf-Motiv. Dadurch wirkt der Dart besonders plakativ und deutlich dekorativer als die schlichte Gelb-Version."
  ),
});

function turnDartAssetOptionCopy(label, detail) {
  return optionCopy(
    `Nutzt ${label} für die Wurffelder.`,
    `Verwendet ${label} ${detail} als Wurffeld-Dart.`,
    `Verwendet ${label} als Wurffeld-Dart.`
  );
}

const THEME_GLOBAL_TURN_DART_ASSET_OPTION_COPY = deepFreeze({
  "german-giant": optionCopy(
    "Nutzt den freigestellten German-Gigant-Dart für die Wurffelder.",
    "Verwendet den horizontal ausgerichteten German-Gigant-Dart mit Flight links und Spitze rechts für die drei Darts im Wurffeld. In der Auswahl wird nur die Dartbezeichnung angezeigt.",
    "Verwendet den German-Gigant-Dart als Wurffeld-Dart."
  ),
  "blue-lightning": turnDartAssetOptionCopy("Blue Lightning", "mit blauem Blitz-Flight"),
  "copper-grid": turnDartAssetOptionCopy("Copper Grid", "mit kupferfarbenem Gitter-Flight"),
  "snakebite-purple": turnDartAssetOptionCopy("Snakebite Purple", "mit pink-violettem Schlangen-Flight"),
  "iceman-blue": turnDartAssetOptionCopy("Iceman Blue", "mit schwarz-blauem Flight"),
  "bullet-red": turnDartAssetOptionCopy("Bullet Red", "mit rotem Flight und goldener Spitze"),
  "carbon-gold": turnDartAssetOptionCopy("Carbon Gold", "mit geometrischem schwarz-goldenem Flight"),
  "vecta-gold": turnDartAssetOptionCopy("Vecta Gold", "mit EVO-Flight und goldenen Akzenten"),
  "gvv-blue": turnDartAssetOptionCopy("GVV Blue", "mit kontrastreichem schwarz-weiß-blauem Flight"),
  "cool-hand-luke": turnDartAssetOptionCopy("Cool Hand Luke", "mit signiertem schwarz-goldenem Flight"),
  "target-neon": turnDartAssetOptionCopy("Target Neon", "mit transluzentem Flight und Shaft"),
});

const DART_IMAGE_SIZE_OPTION_COPY = deepFreeze({
  "108": optionCopy(
    "Zeigt die Dart-Grafik etwas kleiner als den Standard.",
    "Der eingeblendete Dart bleibt kompakter und lässt mehr Segmentfläche frei. Das wirkt aufgeräumter und weniger dominant.",
    "Diese Stufe reduziert die Dart-Grafik leicht unter die Standardgröße. Das Segment bleibt besser sichtbar, während der Dart weiterhin klar als Ersatzmarker erkennbar bleibt."
  ),
  "120": optionCopy(
    "Nutzen die ausgewogene Standardgröße.",
    "Der Dart entspricht der vorgesehenen Grundgröße des Moduls. Das ist der Mittelweg zwischen Präsenz und freier Segmentfläche.",
    "Diese Einstellung verwendet die reguläre Grundgröße für den Dart-Marker. Der Dart ist klar sichtbar, ohne den Trefferbereich unnötig stark zu füllen."
  ),
  "138": optionCopy(
    "Zeigt die Dart-Grafik spürbar größer.",
    "Der Dart füllt mehr vom Segment aus und fällt stärker ins Auge. Das ist die plakativste Größenstufe.",
    "Diese Stufe vergrößert die Dart-Grafik sichtbar über die Standardgröße hinaus. Treffer wirken dadurch präsenter, nehmen aber auch mehr vom Segmentbild ein."
  ),
});

const DART_FLIGHT_SPEED_OPTION_COPY = deepFreeze({
  schnell: optionCopy(
    "Lässt neue Darts schnell ins Segment einfliegen.",
    "Die Fluganimation endet zügig und wirkt direkt. Das Ziel ist schnell erreicht, ohne lange Nachwirkung.",
    "Diese Stufe verkürzt die Flugphase deutlich. Neue Darts schießen schnell ins Segment und wirken dadurch sportlicher und unmittelbarer."
  ),
  standard: optionCopy(
    "Nutzen die ausgewogene Standard-Flugzeit.",
    "Die Flugbewegung bleibt klar erkennbar, ohne sich lange aufzuhalten. Das ist die neutrale Mittelstufe.",
    "Diese Einstellung hält die Fluganimation sichtbar, aber kontrolliert. Der neue Dart ist gut wahrnehmbar und landet dennoch zügig am Zielpunkt."
  ),
  cinematic: optionCopy(
    "Lässt den Dart sichtbar länger im Anflug bleiben.",
    "Die Flugphase wird gestreckt und wirkt dadurch filmischer. Der Dart baut sich deutlich spürbarer in das Segment hinein auf.",
    "Diese Stufe verlängert die Fluganimation merklich und macht den Anflug des Darts selbst zum kleinen Effektmoment. Dadurch wirkt das Setzen des Markers cineastischer, aber weniger direkt."
  ),
});

const REMOVE_DARTS_IMAGE_SIZE_OPTION_COPY = deepFreeze({
  compact: optionCopy(
    "Hält die Hinweisgrafik vergleichsweise kompakt.",
    "Die Grafik bleibt klar sichtbar, nimmt aber weniger Bildschirmfläche ein. Das wirkt zurückhaltender und blockiert das Spielbild weniger.",
    "Diese Stufe begrenzt die Hinweisgrafik auf eine kompaktere Maximalgröße. Der `Take Out`-Hinweis bleibt deutlich erkennbar, wirkt aber weniger raumgreifend."
  ),
  standard: optionCopy(
    "Nutzen die ausgewogene Standardgröße.",
    "Die Grafik ist klar präsent, ohne den Bildschirm maximal zu füllen. Das ist die neutrale Mittelstufe.",
    "Diese Einstellung nutzt die vorgesehene Standardgröße für die Hinweisgrafik. Der Hinweis ist gut sichtbar und bleibt zugleich noch ausgewogen im Bild."
  ),
  large: optionCopy(
    "Zeigt die Hinweisgrafik besonders groß.",
    "Die Grafik nutzt mehr Breite und Höhe und zieht den Blick am stärksten auf sich. Das ist die plakativste Stufe.",
    "Diese Stufe vergrößert die Hinweisgrafik sichtbar und macht den `Take Out`-Hinweis zum dominanten Bildelement. Besonders in hektischen Spielsituationen ist er dadurch kaum zu übersehen."
  ),
});

const REMOVE_DARTS_PULSE_OPTION_COPY = deepFreeze({
  "1.02": optionCopy(
    "Lässt die Grafik nur leicht pulsieren.",
    "Die Größe ändert sich in der Mitte der Animation nur minimal. Das wirkt ruhig und weich.",
    "Diese Stufe hält die Pulsbewegung bewusst klein. Die Grafik atmet sichtbar, ohne stark zu wachsen oder den Blick hektisch zu ziehen."
  ),
  "1.04": optionCopy(
    "Nutzen die ausgewogene Standard-Pulsstärke.",
    "Die Grafik wächst im Puls klar wahrnehmbar, aber noch kontrolliert. Das ist die neutrale Mittelstufe.",
    "Diese Einstellung liefert den Standardwert für das Anwachsen der Grafik im Puls. Der Hinweis bleibt lebendig, ohne zu stark aufzuschaukeln."
  ),
  "1.08": optionCopy(
    "Lässt die Grafik im Puls deutlich stärker anwachsen.",
    "Die Hinweisgrafik wirkt lebhafter und springt stärker ins Auge. Das ist die auffälligste Pulsstufe.",
    "Diese Stufe vergrößert die Grafik in der Mitte der Pulsbewegung deutlich stärker. Der `Take Out`-Hinweis bekommt dadurch einen merklich energischeren Bewegungscharakter."
  ),
});

const SINGLE_BULL_VOLUME_OPTION_COPY = deepFreeze({
  "0.5": optionCopy(
    "Spielt den Ton leise ab.",
    "Die akustische Rückmeldung bleibt vorhanden, drängt sich aber deutlich weniger in den Vordergrund. Das eignet sich für ruhige Setups.",
    "Diese Stufe hält den Single-Bull-Sound bewusst leise und unaufdringlich. Der Treffer wird hörbar bestätigt, ohne andere Audioquellen stark zu überdecken."
  ),
  "0.75": optionCopy(
    "Spielt den Ton mittellaut ab.",
    "Der Sound ist klar hörbar, wirkt aber noch nicht so präsent wie die höheren Stufen. Das ist eine gute Zwischenstufe.",
    "Diese Einstellung liefert eine mittlere Lautstärke, bei der der Single-Bull-Ton klar wahrnehmbar bleibt, aber noch nicht dominant in den Vordergrund tritt."
  ),
  "0.9": optionCopy(
    "Nutzen die laute Standardstufe.",
    "Der Ton ist deutlich hörbar und im normalen Spielbetrieb gut wahrnehmbar. Das ist die Standardwahl des Moduls.",
    "Diese Stufe entspricht der Standardlautstärke des Moduls. Der Single-Bull-Sound bleibt deutlich präsent, ohne bereits auf Maximalpegel zu laufen."
  ),
  "1": optionCopy(
    "Spielt den Ton maximal laut ab.",
    "Die Rückmeldung tritt am stärksten hervor und bleibt auch in lauteren Umgebungen leichter hörbar. Das ist die auffälligste Stufe.",
    "Diese Einstellung setzt den Single-Bull-Sound auf die höchste verfügbare Lautstärke. Der Treffer ist damit am klarsten hörbar, kann aber je nach Audio-Setup deutlich präsenter wirken."
  ),
});

const SINGLE_BULL_COOLDOWN_OPTION_COPY = deepFreeze({
  "400": optionCopy(
    "Lässt denselben Ton wieder relativ schnell zu.",
    "Zwischen zwei Single-Bull-Sounds liegt nur eine kurze Sperre. Das reagiert am schnellsten, lässt aber dichter aufeinanderfolgende Sounds eher durch.",
    "Diese Stufe hält die Wiederholsperre kurz. Mehrere Single-Bull-Erkennungen können dadurch schneller nacheinander hörbar werden, was direkter, aber auch dichter klingt."
  ),
  "700": optionCopy(
    "Nutzen die ausgewogene Standard-Sperrzeit.",
    "Der Sound kann nicht sofort doppelt feuern, bleibt aber reaktionsschnell genug. Das ist die neutrale Mittelstufe.",
    "Diese Einstellung liefert den Standardwert für die Wiederholsperre. Sie verhindert direkte Doppeltrigger, ohne die akustische Rückmeldung unnötig träge zu machen."
  ),
  "1000": optionCopy(
    "Blockiert Wiederholungen am längsten.",
    "Zwischen zwei Sound-Auslösungen liegt eine deutlich längere Pause. Das reduziert Doppeltrigger am stärksten, reagiert aber etwas vorsichtiger.",
    "Diese Stufe verlängert die Sperrzeit auf eine volle Sekunde. Dadurch wird Mehrfachfeuern besonders zuverlässig gebremst, der Ton kann aber nach schnellen Folgeereignissen später wieder hörbar werden."
  ),
});

const LIVE_OR_1200_POLL_OPTION_COPY = deepFreeze({
  "0": optionCopy(
    "Verwendet nur die direkte Treffererkennung.",
    "Das Modul verlässt sich ausschließlich auf direkt erkannte Änderungen. Das ist ressourcenschonend, setzt aber zuverlässige Signale voraus.",
    "Mit dieser Einstellung läuft der Single-Bull-Ton ohne zusätzliche regelmäßige Prüfung."
  ),
  "1200": optionCopy(
    "Prüft Treffer zusätzlich alle 1,2 Sekunden.",
    "Zusätzlich zur direkten Erkennung prüft das Modul regelmäßig nach. Das macht die Treffererkennung robuster, wenn ein direktes Signal einmal ausbleibt.",
    "Diese Option ergänzt die direkte Erkennung um eine Prüfung alle 1,2 Sekunden."
  ),
});

const TURN_SCORE_DURATION_OPTION_COPY = deepFreeze({
  "1000": optionCopy(
    "Zählt 0 bis 60 in 1 Sekunde.",
    "Diese Stufe reagiert am direktesten und eignet sich für schnelle Spielbilder.",
    "Schnelle Zählgeschwindigkeit."
  ),
  "3000": optionCopy(
    "Nutzt die ausgewogene Standardgeschwindigkeit.",
    "Ein T20-Treffer läuft von 0 bis 60 in 3 Sekunden hoch. Das ist die ruhig lesbare Standardstufe.",
    "Ausgewogene Zählgeschwindigkeit."
  ),
  "5000": optionCopy(
    "Zählt 0 bis 60 in 5 Sekunden.",
    "Die Animation nimmt sich mehr Zeit und zeigt große Punktwechsel besonders nachvollziehbar. Das wirkt wie eine ruhige Anzeigetafel.",
    "Ruhige Zählgeschwindigkeit."
  ),
});

const TURN_SCORE_COUNT_EFFECT_OPTION_COPY = deepFreeze({
  "smooth-count": optionCopy(
    "Zählt weich und fließend zum neuen Wert.",
    "Der Wert läuft flüssig zum Zielwert und bleibt ohne zusätzliche Elemente mit den Themes kompatibel.",
    "Fließende Zählweise."
  ),
  "rolling-digits": optionCopy(
    "Lässt die Ziffern wie auf einer Anzeigetafel rollen.",
    "Die Ziffern wechseln in einem Anzeigetafel-/Walzeneffekt. Der Stil wird nur geladen, wenn er ausgewählt ist.",
    "Zählweise mit rollenden Ziffern."
  ),
  "step-count": optionCopy(
    "Zeigt ganze Zahlen als Einzelschritte.",
    "Diese Variante zeigt sichtbare ganze Zwischenzahlen nacheinander und verzichtet auf eine weiche Bewegung.",
    "Zählweise mit einzelnen Zahlenschritten."
  ),
});

const TURN_SCORE_FLASH_MODE_OPTION_COPY = deepFreeze({
  "on-change": optionCopy(
    "Zeigt den Rahmen nur während echter Wertänderungen.",
    "Der elektrische Rahmen erscheint nur in dem Zeitraum, in dem die Zahl hoch- oder herunterzählt, und klingt danach aus.",
    "Rahmen nur während laufender Zahlenänderungen."
  ),
  permanent: optionCopy(
    "Hält den Rahmen dauerhaft um die Turn-Punkte-Zeile sichtbar.",
    "Der elektrische Rahmen bleibt permanent aktiv, auch wenn sich der Wert gerade nicht ändert. Die Zählanimation selbst läuft weiterhin nur bei echten Wertänderungen.",
    "Rahmen dauerhaft sichtbar, unabhängig von laufender Änderung."
  ),
});

const X01_REMAINING_SCORE_BAR_COLOR_OPTION_COPY = deepFreeze({
  "checkout-focus": optionCopy(
    "Standardmodus mit Fokus auf Checkout-Relevanz.",
    "Färbt den Balken abhängig vom Restscore mit Fokus auf den Bereich bis `170` und steigert die visuelle Dringlichkeit in Checkout-Nähe.",
    "Dynamischer Standardmodus mit Checkout-Fokus."
  ),
  "checkout-zone-blue": optionCopy(
    "Zeigt den Restscore blau und markiert die Checkout-Zone bis 170 blau-weiß schraffiert.",
    "Oberhalb von 170 bleibt der Balken im normalen Blau. Eine weiße Trennlinie markiert den maximal möglichen Checkout; der Bereich bis 170 wird wie bei „Checkout Points Average“ blau-weiß schraffiert.",
    "Blauer Restscore-Balken mit weißer 170-Linie und schraffierter Checkout-Zone."
  ),
  "traffic-light": optionCopy(
    "Schaltet stufenweise zwischen Rot, Amber und Grün nach Fortschritt.",
    "Nutzt feste Prozentstufen des verbleibenden Scores. Viel Rest = eher Rot, mittlerer Bereich = Amber, niedriger Rest = Grün.",
    "Stufenmodus mit klaren Rot/Amber/Grün-Prozentschwellen."
  ),
  "danger-endgame": optionCopy(
    "Betont den Endgame-Bereich mit warnenderer Farbdramaturgie.",
    "Wechselt in den niedrigen Restwertbereichen aggressiver in warme Warnfarben und hebt kritische Endgame-Situationen deutlich hervor.",
    "Dynamischer Endgame-Modus mit starkem Warnfokus."
  ),
  "gradient-by-progress": optionCopy(
    "Lässt die Farbe kontinuierlich mit dem Fortschritt wandern.",
    "Der Balken läuft ohne harte Stufen über einen weichen Verlauf von warm nach kalt beziehungsweise zurück, abhängig vom verbleibenden Prozentwert.",
    "Kontinuierlicher Farbverlauf entlang des Score-Fortschritts."
  ),
  autodarts: optionCopy(
    "Nutzen ein festes Autodarts-Blau.",
    "Setzt den Balken auf eine markennahe blau-cyan Palette mit klarer Lesbarkeit auf dunklen Flächen.",
    "Statische Autodarts-nahe Blaupalette."
  ),
  "signal-lime": optionCopy(
    "Nutzen ein klares Lime-Signal als feste Farbpalette.",
    "Bleibt konstant im grün-limetten Signalbereich und wirkt präsent, ohne dynamische Schwellenwechsel.",
    "Statische lime-grüne Signalpalette."
  ),
  "glass-mint": optionCopy(
    "Nutzen ein helles Mint-/Aqua-Schema.",
    "Wirkt frischer und leichter als klassische Grünpaletten und bleibt auf dunklen Flächen klar und modern.",
    "Statische helle Mint-/Aqua-Palette."
  ),
  "ember-rush": optionCopy(
    "Nutzen ein warmes Orange-Rot-Schema.",
    "Setzt den Balken dauerhaft auf eine energische, warme Palette mit hoher Aufmerksamkeit.",
    "Statische warme Ember-Palette."
  ),
  "ice-circuit": optionCopy(
    "Nutzen ein kühles Cyan-Türkis-Schema.",
    "Bleibt technisch-kühl und klar, mit hoher Differenzierung auf dunklen Boards.",
    "Statische kühle Cyan-/Türkis-Palette."
  ),
  "neon-violet": optionCopy(
    "Nutzen eine violett-blaue Neonpalette.",
    "Erzeugt einen modernen, kontrastreichen Look mit leicht futuristischer Wirkung.",
    "Statische violett-blaue Neonpalette."
  ),
  "sunset-amber": optionCopy(
    "Nutzen eine gold-orange Sunset-Palette.",
    "Wirkt warm und atmosphärisch, bleibt aber durch hohe Helligkeitskontraste gut lesbar.",
    "Statische Sunset-/Amber-Palette."
  ),
  "monochrome-steel": optionCopy(
    "Nutzen eine neutrale Stahl-Graupalette.",
    "Reduziert die Farbsignalik bewusst auf kühle Grauwerte für ein zurückhaltendes, technisches Erscheinungsbild.",
    "Statische, farbreduzierte Monochrom-Palette."
  ),
});

const X01_REMAINING_SCORE_BAR_SIZE_OPTION_COPY = deepFreeze({
  schmal: optionCopy(
    "Zeigt den Balken in einer schlanken Höhe.",
    "Nimmt weniger vertikalen Raum ein und wirkt am zurückhaltendsten.",
    "Schmale Balkenhöhe für eine ruhige Darstellung."
  ),
  standard: optionCopy(
    "Nutzen die ausgewogene Standardhöhe.",
    "Balanciert Präsenz und Zurückhaltung und passt in der Regel am besten zum Standardlayout.",
    "Standardhöhe als neutraler Mittelweg."
  ),
  breit: optionCopy(
    "Macht den Balken sichtbar kräftiger.",
    "Der aktive Balken wird deutlicher und aus größerer Distanz schneller wahrgenommen.",
    "Breitere Balkenhöhe mit stärkerer Präsenz."
  ),
  extrabreit: optionCopy(
    "Nutzen die maximal breite Balkenhöhe.",
    "Stellt den aktiven Balken sehr dominant dar und priorisiert maximale Sichtbarkeit.",
    "Maximal breite Balkenhöhe für höchste Sichtbarkeit."
  ),
});

const X01_REMAINING_SCORE_BAR_EFFECT_OPTION_COPY = deepFreeze({
  "bar-pulse": optionCopy(
    "Lässt den aktiven Balkenkern kräftig atmen.",
    "Der Balken pulsiert mit einer klar sichtbaren inneren Kernbewegung und bleibt dadurch dauerhaft präsent.",
    "Deutlicher Kern-Puls auf dem aktiven Balken."
  ),
  "glass-light-sweep": optionCopy(
    "Schickt eine breite, gläserne Ladung durch den Balken.",
    "Eine helle, glatte Spiegelung läuft durch den aktiven Balken und erzeugt eine sichtbar aufgeladene Glasschicht.",
    "Gläserner Ladeeffekt mit breiter Lichtkante."
  ),
  "moving-segments": optionCopy(
    "Unterteilt den Balken in markante Segmente.",
    "Der aktive Balken wirkt sichtbar segmentiert und verliert seine Energie in klaren, technischen Abschnitten statt als glatte Fläche.",
    "Segmentierte Drain-Optik mit klaren Abschnitten."
  ),
  "previous-score-trail": optionCopy(
    "Lässt die alte Balkenlänge als Nachbild stehen.",
    "Bei Scoreänderungen bleibt kurz eine halbtransparente Spur der vorherigen Länge sichtbar und läuft dann in den neuen Stand aus.",
    "Nachziehender Ghost-Trail beim Scorewechsel."
  ),
  "fast-signal-sweep": optionCopy(
    "Jagt eine scharfe Signallinie über den Balken.",
    "Ein enger, heller Sweep schneidet regelmäßig über den aktiven Balken und sorgt für maximale Signalwirkung.",
    "Schneller Signal-Sweep mit hoher Aufmerksamkeit."
  ),
  off: optionCopy(
    "Deaktiviert Zusatzanimationen.",
    "Der Balken zeigt nur den aktuellen Stand ohne zusätzlichen Effekt. Größe, Farben und Inaktiv-Darstellung bleiben bestehen.",
    "Keine Zusatzanimation; nur der statische Balken bleibt sichtbar."
  ),
});

const DART_IMPACT_STYLE_OPTION_COPY = deepFreeze({
  classic: optionCopy(
    "Behält den bisherigen, einheitlichen Dart-Einschlag bei.",
    "Alle Dart-Bilder landen mit der klassischen neutralen Ausrichtung. Winkel, Perspektive und Schatten bleiben dadurch möglichst ruhig und vorhersehbar.",
    "Der Dart-Einschlag bleibt klassisch und einheitlich ausgerichtet."
  ),
  natural: optionCopy(
    "Variiert Winkel, Perspektive und Schatten dezent.",
    "Jeder Dart bekommt eine stabile, realistische Variation. Die Spitze bleibt exakt am Trefferpunkt, während der Einschlag natürlicher wirkt als bei `Klassisch`.",
    "Darts wirken natürlicher, bleiben aber kontrolliert und gut lesbar."
  ),
  dramatic: optionCopy(
    "Verstärkt die Einschlagvariation sichtbar.",
    "Winkel, Perspektive und Schatten werden kräftiger variiert. Die Darstellung wirkt präsenter und demo-tauglicher, ohne die Spitze vom Trefferpunkt zu lösen.",
    "Darts wirken markanter und stärker inszeniert."
  ),
});

const X01_BUST_CRACK_COUNT_OPTION_COPY = deepFreeze({
  "0": optionCopy(
    "Blendet die Glasrisse aus; Rotmarkierung und Wackeln bleiben aktiv.",
    "Deaktiviert nur die Glasriss-Overlays. Die rote BUST-Markierung und der Earthquake-Effekt der aktiven Spielerkarte bleiben unverändert aktiv.",
    "Keine Glasrisse; Rotmarkierung und Wackeln bleiben aktiv."
  ),
  "1": optionCopy(
    "Zeigt einen zufällig platzierten Glasriss.",
    "Erzeugt beim Eintritt in BUST ein einzelnes zufällig platziertes Einschlagzentrum mit Glasrissstruktur auf der aktiven Spielerkarte.",
    "Zeigt ein zufällig platziertes Einschlagzentrum."
  ),
  "2": optionCopy(
    "Zeigt zwei unabhängig platzierte Glasrisse.",
    "Erzeugt beim Eintritt in BUST zwei voneinander unabhängige Einschlagzentren und verteilt sie zufällig auf der aktiven Spielerkarte.",
    "Zeigt zwei zufällig und unabhängig platzierte Einschlagzentren."
  ),
  "3": optionCopy(
    "Zeigt drei Glasrisse für die dichteste Darstellung.",
    "Erzeugt beim Eintritt in BUST drei zufällig verteilte Einschlagzentren. Diese Stufe füllt die aktive Spielerkarte am stärksten mit Glasrissstrukturen.",
    "Zeigt drei Einschlagzentren und damit die dichteste Darstellung."
  ),
});

const BOT_BOARD_STYLE_DESIGN_OPTION_COPY = deepFreeze(
  Object.fromEntries(
    BOARD_STYLE_DESIGNS.map((design) => [
      design.value,
      optionCopy(
        `Zeigt ${design.label} als Board-Design.`,
        `Verwendet die lokal eingebettete und optimierte Grafik von ${design.label} für die Board-Fläche. Treffer und xConfig-Zieloverlays bleiben darüber sichtbar.`,
        `Verwendet ${design.label} als Board-Grafik.`
      ),
    ])
  )
);

const BOT_BOARD_STYLE_SCOPE_OPTION_COPY = deepFreeze({
  "bot-turns": optionCopy(
    "Zeigt das Design ausschließlich während eines zuverlässig erkannten Bot-Zugs.",
    "Blendet das Design nur ein, wenn der aktive Spieler anhand von Spielzustand, Bot-Icon oder `BOT LEVEL` eindeutig als Bot erkannt wird. Bei unklarer Erkennung bleibt das native Board sichtbar.",
    "Zeigt das Design nur bei eindeutig erkannten Bot-Zügen."
  ),
  "all-match-boards": optionCopy(
    "Zeigt das Design auf allen unterstützten sichtbaren Match-Boards.",
    "Verwendet das Design unabhängig vom aktiven Spieler und Spielmodus auf jedem Board, das von der gemeinsamen xConfig-Board-Erkennung gefunden wird.",
    "Verwendet das Design global auf unterstützten Match-Boards."
  ),
});

const xconfigFieldOptionCopy = deepFreeze({
  "theme-global-background": {
    backgroundDisplayMode: THEME_BACKGROUND_DISPLAY_OPTION_COPY,
    backgroundOpacity: THEME_BACKGROUND_OPACITY_OPTION_COPY,
    playerFieldTransparency: THEME_PLAYER_TRANSPARENCY_OPTION_COPY,
  },
  "theme-global-typography": {
    fontPreset: THEME_GLOBAL_TYPOGRAPHY_FONT_OPTION_COPY,
    applyTo: THEME_GLOBAL_TYPOGRAPHY_SCOPE_OPTION_COPY,
    activePlayerTintIntensity: THEME_ACTIVE_PLAYER_TINT_INTENSITY_OPTION_COPY,
  },
  "turn-dart-display": {
    turnDartStyle: THEME_GLOBAL_TURN_DART_STYLE_OPTION_COPY,
    turnDartAssetKey: THEME_GLOBAL_TURN_DART_ASSET_OPTION_COPY,
    turnDartSizePercent: THEME_GLOBAL_TURN_DART_SIZE_OPTION_COPY,
  },
  "checkout-score-highlight": {
    effect: CHECKOUT_SCORE_EFFECT_OPTION_COPY,
    colorTheme: CHECKOUT_SCORE_COLOR_OPTION_COPY,
    intensity: CHECKOUT_SCORE_INTENSITY_OPTION_COPY,
    triggerSource: CHECKOUT_SCORE_TRIGGER_OPTION_COPY,
  },
  "x01-bust-active-player-highlight": {
    crackCount: X01_BUST_CRACK_COUNT_OPTION_COPY,
  },
  "x01-remaining-score-bar": {
    colorTheme: X01_REMAINING_SCORE_BAR_COLOR_OPTION_COPY,
    barSize: X01_REMAINING_SCORE_BAR_SIZE_OPTION_COPY,
    effect: X01_REMAINING_SCORE_BAR_EFFECT_OPTION_COPY,
  },
  "checkout-target-highlights": {
    visualPreset: BOARD_TARGET_VISUAL_PRESET_OPTION_COPY,
    segmentStyle: BOARD_TARGET_SEGMENT_STYLE_OPTION_COPY,
    targetSelectionMode: BOARD_TARGET_SELECTION_MODE_OPTION_COPY,
    colorTheme: BOARD_TARGET_COLOR_OPTION_COPY,
  },
  "tv-board-zoom": {
    zoomLevel: TV_BOARD_ZOOM_LEVEL_OPTION_COPY,
    zoomSpeed: TV_BOARD_ZOOM_SPEED_OPTION_COPY,
    checkoutZoomTarget: TV_BOARD_ZOOM_TARGET_OPTION_COPY,
  },
  "checkout-suggestion-styles": {
    style: CHECKOUT_SUGGESTION_STYLE_OPTION_COPY,
    labelText: CHECKOUT_SUGGESTION_LABEL_OPTION_COPY,
    colorTheme: CHECKOUT_SUGGESTION_COLOR_OPTION_COPY,
  },
  "avg-trend-arrow": {
    durationMs: AVG_TREND_DURATION_OPTION_COPY,
    size: AVG_TREND_SIZE_OPTION_COPY,
  },
  "special-hit-highlights": {
    colorTheme: SPECIAL_HIT_COLOR_THEME_OPTION_COPY,
    animationStyle: SPECIAL_HIT_ANIMATION_STYLE_OPTION_COPY,
  },
  "cricket-target-highlighter": {
    irrelevantBoardDimStyle: CRICKET_DIM_STYLE_OPTION_COPY,
    colorTheme: CRICKET_BOARD_COLOR_OPTION_COPY,
    intensity: CRICKET_BOARD_INTENSITY_OPTION_COPY,
  },
  "cricket-grid-status-effects": {
    colorTheme: CRICKET_GRID_COLOR_OPTION_COPY,
    intensity: CRICKET_GRID_INTENSITY_OPTION_COPY,
  },
  "bot-board-style": {
    design: BOT_BOARD_STYLE_DESIGN_OPTION_COPY,
    scope: BOT_BOARD_STYLE_SCOPE_OPTION_COPY,
  },
  "dartboard-marker-highlight": {
    size: DART_MARKER_SIZE_OPTION_COPY,
    color: DART_MARKER_COLOR_OPTION_COPY,
    effect: DART_MARKER_EFFECT_OPTION_COPY,
    opacityPercent: DART_MARKER_OPACITY_OPTION_COPY,
    outline: DART_MARKER_OUTLINE_OPTION_COPY,
  },
  "dart-marker-replacer": {
    design: DART_DESIGN_OPTION_COPY,
    sizePercent: DART_IMAGE_SIZE_OPTION_COPY,
    impactStyle: DART_IMPACT_STYLE_OPTION_COPY,
    flightSpeed: DART_FLIGHT_SPEED_OPTION_COPY,
  },
  "take-out-darts-alert": {
    imageSize: REMOVE_DARTS_IMAGE_SIZE_OPTION_COPY,
    pulseScale: REMOVE_DARTS_PULSE_OPTION_COPY,
  },
  "single-bull-hit-sound": {
    volume: SINGLE_BULL_VOLUME_OPTION_COPY,
    cooldownMs: SINGLE_BULL_COOLDOWN_OPTION_COPY,
    pollIntervalMs: LIVE_OR_1200_POLL_OPTION_COPY,
  },
  "turn-score-counter": {
    countEffect: TURN_SCORE_COUNT_EFFECT_OPTION_COPY,
    durationMs: TURN_SCORE_DURATION_OPTION_COPY,
    flashMode: TURN_SCORE_FLASH_MODE_OPTION_COPY,
  },
});

export function getXConfigFeatureCopy(featureKey) {
  return xconfigFeatureCopy[String(featureKey || "").trim()] || null;
}

export function getXConfigFieldCopy(featureKey, fieldKey) {
  const featureCopyEntry = getXConfigFeatureCopy(featureKey);
  if (!featureCopyEntry?.fields) {
    return null;
  }
  return featureCopyEntry.fields[String(fieldKey || "").trim()] || null;
}

function normalizeOptionCopyKey(optionValue) {
  return String(optionValue ?? "").trim();
}

export function getXConfigFieldOptionCopy(featureKey, fieldKey, optionValue) {
  const featureEntry = xconfigFieldOptionCopy[String(featureKey || "").trim()] || null;
  if (!featureEntry) {
    return null;
  }
  const fieldEntry = featureEntry[String(fieldKey || "").trim()] || null;
  if (!fieldEntry) {
    return null;
  }
  return fieldEntry[normalizeOptionCopyKey(optionValue)] || null;
}

function normalizeCountValue(value) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue < 0) {
    return 0;
  }

  return Math.trunc(numericValue);
}

export function buildXConfigOverviewSection(title, summary = {}) {
  const sectionTitle = String(title || "Hinweise zur Konfiguration").trim() || "Hinweise zur Konfiguration";
  const totalModules = normalizeCountValue(summary.totalModules);
  const animationModules = normalizeCountValue(summary.animationModules);
  const themeModules = normalizeCountValue(summary.themeModules);
  const themeImageLimit = String(summary.themeImageLimit || "1,5 MiB").trim() || "1,5 MiB";

  const lines = [
    `## ${sectionTitle}`,
    "",
    `- Insgesamt \`${totalModules}\` Module: \`${animationModules}\` Anzeigen und Komfortfunktionen sowie \`${themeModules}\` Designmodule.`,
    `- \`↺ Zurücksetzen\`: Setzt alle Einstellungen vollständig auf Standard zurück, deaktiviert alle Module, schaltet die Diagnose aus und entfernt globales Hintergrundbild sowie Dart-Upload.`,
    `- \`Empfohlene Standards\`: Übernimmt ausgewogene Presets, schaltet alle Module aus und lässt globales Wallpaper sowie Dart-Upload unangetastet.`,
    `- \`Exportieren\` / \`Importieren\`: Sichert Einstellungen als versioniertes JSON-Backup und übernimmt auch ältere oder teilweise inkompatible Backups fehlertolerant.`,
    `- Hintergrundbild: Die Kachel \`Hintergrund\` verwendet ein gemeinsames Wallpaper oder das Wallpaper der zuletzt angewendeten Vorlage in allen Spielansichten.`,
    `- Bildgröße: Für das globale Wallpaper gilt ein empfohlenes Limit von \`${themeImageLimit}\`; der separate Dart-Upload wird kompakter gespeichert.`,
  ];

  return `${lines.join("\n")}\n`;
}

const RECOMMENDED_DEFAULTS_DOC_GROUPS = deepFreeze([
  {
    title: "Design",
    sections: [
      {
        title: "Hintergrund",
        featureKey: "theme-global-background",
        fields: [
          { label: "Aktiv", key: "enabled" },
          { label: "Bildanpassung", key: "backgroundDisplayMode" },
          { label: "Sichtbarkeit des Hintergrundbilds", key: "backgroundOpacity" },
          { label: "Durchsichtigkeit der Spielerfelder", key: "playerFieldTransparency" },
          { label: "Diagnose", key: "debug" },
        ],
      },
      {
        title: "Schrift & Farben",
        featureKey: "theme-global-typography",
        fields: [
          { label: "Aktiv", key: "enabled" },
          { label: "Schriftart", key: "fontPreset" },
          { label: "Schrift anwenden auf", key: "applyTo" },
          { label: "Hintergrund des aktiven Spielers", key: "activePlayerTintIntensity" },
          { label: "Diagnose", key: "debug" },
        ],
      },
    ],
  },
  {
    title: "Weitere Module",
    sections: [
      {
        title: "Für alle Module",
        fields: [
          {
            label: "Alle eingeschaltet",
            featureKeys: [
              "turn-score-counter",
              "avg-trend-arrow",
              "special-hit-highlights",
              "bot-board-style",
              "turn-dart-display",
              "dart-marker-replacer",
              "dartboard-marker-highlight",
              "take-out-darts-alert",
              "single-bull-hit-sound",
              "checkout-suggestion-styles",
              "checkout-score-highlight",
              "x01-remaining-score-bar",
              "x01-bust-active-player-highlight",
              "checkout-target-highlights",
              "tv-board-zoom",
              "cricket-target-highlighter",
              "cricket-grid-status-effects",
            ],
            key: "enabled",
          },
          {
            label: "Diagnose",
            featureKeys: [
              "turn-score-counter",
              "avg-trend-arrow",
              "special-hit-highlights",
              "bot-board-style",
              "turn-dart-display",
              "dart-marker-replacer",
              "dartboard-marker-highlight",
              "take-out-darts-alert",
              "single-bull-hit-sound",
              "checkout-suggestion-styles",
              "checkout-score-highlight",
              "x01-remaining-score-bar",
              "x01-bust-active-player-highlight",
              "checkout-target-highlights",
              "tv-board-zoom",
              "cricket-target-highlighter",
              "cricket-grid-status-effects",
            ],
            key: "debug",
          },
        ],
      },
      {
        title: "Punkte animiert zählen",
        featureKey: "turn-score-counter",
        fields: [
          { label: "Zählweise", key: "countEffect" },
          { label: "Zählgeschwindigkeit", key: "durationMs" },
          { label: "Bei Änderung aufblitzen", key: "flashOnChange" },
          { label: "Aufblitzen", key: "flashMode" },
        ],
      },
      {
        title: "AVG-Trend anzeigen",
        featureKey: "avg-trend-arrow",
        fields: [
          { label: "Animationsdauer", key: "durationMs" },
          { label: "Pfeilgröße", key: "size" },
        ],
      },
      {
        title: "Triple, Double & Bull hervorheben",
        featureKey: "special-hit-highlights",
        fields: [
          { label: "Farbstil", key: "colorTheme" },
          { label: "Animation", key: "animationStyle" },
        ],
      },
      {
        title: "Dartboard-Design",
        featureKey: "bot-board-style",
        fields: [
          { label: "Board-Design", key: "design" },
          { label: "Anwenden auf", key: "scope" },
        ],
      },
      {
        title: "Darts in der Wurfanzeige",
        featureKey: "turn-dart-display",
        fields: [
          { label: "Stil", key: "turnDartStyle" },
          { label: "Dart auswählen", key: "turnDartAssetKey" },
          { label: "Text", key: "turnDartTextTemplate" },
          { label: "Größe", key: "turnDartSizePercent" },
          { label: "Leuchteffekt", key: "turnDartShineEnabled" },
        ],
      },
      {
        title: "Treffermarkierungen durch Darts ersetzen",
        featureKey: "dart-marker-replacer",
        fields: [
          { label: "Dart-Design", key: "design" },
          { label: "Dart-Fluganimation", key: "animateDarts" },
          { label: "Dart-Größe", key: "sizePercent" },
          { label: "Original-Marker ausblenden", key: "hideOriginalMarkers" },
          { label: "Einschlagstil", key: "impactStyle" },
          { label: "Einschlag-Schatten", key: "enableShadow" },
          { label: "Schatten-Weichzeichnung", key: "enableShadowBlur" },
          { label: "Nachwippen beim Einschlag", key: "enableWobble" },
          { label: "Bewegungsunschärfe im Flug", key: "enableFlightBlur" },
          { label: "Fluggeschwindigkeit", key: "flightSpeed" },
        ],
      },
      {
        title: "Treffermarkierungen hervorheben",
        featureKey: "dartboard-marker-highlight",
        fields: [
          { label: "Größe der Treffermarkierung", key: "size" },
          { label: "Farbe der Treffermarkierung", key: "color" },
          { label: "Animation", key: "effect" },
          { label: "Sichtbarkeit der Treffermarkierung", key: "opacityPercent" },
          { label: "Randfarbe", key: "outline" },
        ],
      },
      {
        title: "Hinweis: Darts entfernen",
        featureKey: "take-out-darts-alert",
        fields: [
          { label: "Bildgröße", key: "imageSize" },
          { label: "Pulsieren", key: "pulseAnimation" },
          { label: "Stärke des Pulsierens", key: "pulseScale" },
        ],
      },
      {
        title: "Ton bei Single Bull",
        featureKey: "single-bull-hit-sound",
        fields: [
          { label: "Lautstärke", key: "volume" },
          { label: "Mindestabstand zwischen Tönen", key: "cooldownMs" },
          { label: "Zusätzliche Trefferprüfung", key: "pollIntervalMs" },
        ],
      },
      {
        title: "Checkout-Vorschlag gestalten",
        featureKey: "checkout-suggestion-styles",
        fields: [
          { label: "Darstellung", key: "style" },
          { label: "Beschriftung", key: "labelText" },
          { label: "Farbe", key: "colorTheme" },
        ],
      },
      {
        title: "Finishbaren Restscore hervorheben",
        featureKey: "checkout-score-highlight",
        fields: [
          { label: "Animation", key: "effect" },
          { label: "Farbe", key: "colorTheme" },
          { label: "Stärke", key: "intensity" },
          { label: "Finish-Erkennung", key: "triggerSource" },
        ],
      },
      {
        title: "Restscore-Balken",
        featureKey: "x01-remaining-score-bar",
        fields: [
          { label: "Farben", key: "colorTheme" },
          { label: "Balkengröße", key: "barSize" },
          { label: "Animation", key: "effect" },
        ],
      },
      {
        title: "Überworfen (BUST) hervorheben",
        featureKey: "x01-bust-active-player-highlight",
        fields: [],
      },
      {
        title: "Checkout-Ziele hervorheben",
        featureKey: "checkout-target-highlights",
        fields: [
          { label: "Animation", key: "visualPreset" },
          { label: "Art der Hervorhebung", key: "segmentStyle" },
          { label: "Zielauswahl", key: "targetSelectionMode" },
          { label: "Farbe", key: "colorTheme" },
        ],
      },
      {
        title: "Automatischer Board-Zoom",
        featureKey: "tv-board-zoom",
        fields: [
          { label: "Zoomstärke", key: "zoomLevel" },
          { label: "Zoom-Geschwindigkeit", key: "zoomSpeed" },
          { label: "Checkout-Zoom", key: "checkoutZoomEnabled" },
          { label: "Zoom auf", key: "checkoutZoomTarget" },
          { label: "Auch auf T20-Setup zoomen", key: "t20SetupZoomEnabled" },
        ],
      },
      {
        title: "Cricket-Ziele hervorheben",
        featureKey: "cricket-target-highlighter",
        fields: [
          { label: "Offene Ziele anzeigen (OPEN)", key: "showOpenObjectives" },
          { label: "Erledigte Ziele anzeigen (DEAD)", key: "showDeadObjectives" },
          { label: "Andere Felder abdunkeln", key: "irrelevantBoardDimStyle" },
          { label: "Farben", key: "colorTheme" },
          { label: "Stärke", key: "intensity" },
        ],
      },
      {
        title: "Cricket-Statusanzeigen",
        featureKey: "cricket-grid-status-effects",
        fields: [
          { label: "Welle durch die Zeile", key: "rowWave" },
          { label: "Zielmarke hervorheben", key: "badgeBeacon" },
          { label: "Markierungen auffüllen", key: "markProgress" },
          { label: "Druck anzeigen (PRESSURE)", key: "pressureEdge" },
          { label: "Punktemöglichkeit anzeigen (SCORING)", key: "scoringStripe" },
          { label: "Erledigte Zeilen abdunkeln (DEAD)", key: "deadRowMuted" },
          { label: "Änderungen anzeigen", key: "deltaChips" },
          { label: "Treffer-Impuls", key: "hitSpark" },
          { label: "Zugwechsel-Übergang", key: "roundTransitionWipe" },
          { label: "Druckfläche anzeigen (PRESSURE)", key: "pressureOverlay" },
          { label: "Farben", key: "colorTheme" },
          { label: "Stärke", key: "intensity" },
        ],
      },
    ],
  },
]);

function getRecommendedDescriptorField(descriptorsByFeatureKey, featureKey, fieldKey) {
  const descriptor = descriptorsByFeatureKey.get(String(featureKey || "").trim());
  if (!descriptor) {
    return null;
  }

  return (descriptor.fields || []).find((field) => String(field.key || "").trim() === String(fieldKey || "").trim()) || null;
}

function resolveRecommendedValueLabel(descriptorsByFeatureKey, featureKey, fieldKey, resolveFeatureConfig) {
  const recommendedConfig = typeof resolveFeatureConfig === "function" ? resolveFeatureConfig(featureKey) : null;
  const fieldValue = recommendedConfig?.[fieldKey];
  if (typeof fieldValue === "boolean") {
    return fieldValue ? "An" : "Aus";
  }

  const descriptorField = getRecommendedDescriptorField(descriptorsByFeatureKey, featureKey, fieldKey);
  if (descriptorField?.control === "select" && Array.isArray(descriptorField.options)) {
    const selectedOption = descriptorField.options.find(
      (option) => String(option?.value ?? "") === String(fieldValue ?? "")
    );
    if (selectedOption?.label) {
      return selectedOption.label;
    }
  }

  return String(fieldValue ?? "").trim() || "Leer";
}

function resolveRecommendedFieldLabel(
  descriptorsByFeatureKey,
  fieldDefinition,
  resolveFeatureConfig,
  fallbackFeatureKey = ""
) {
  const normalizedFieldDefinition =
    fieldDefinition && typeof fieldDefinition === "object" ? fieldDefinition : {};
  const featureKeys = Array.isArray(normalizedFieldDefinition.featureKeys)
    ? normalizedFieldDefinition.featureKeys
    : [normalizedFieldDefinition.featureKey || fallbackFeatureKey].filter(Boolean);
  const uniqueLabels = Array.from(
    new Set(
      featureKeys
        .map((featureKey) =>
          resolveRecommendedValueLabel(
            descriptorsByFeatureKey,
            featureKey,
            normalizedFieldDefinition.key,
            resolveFeatureConfig
          )
        )
        .filter(Boolean)
    )
  );

  return uniqueLabels.join(" / ");
}

export function buildRecommendedDefaultsSection(title, descriptors = [], resolveFeatureConfig = null) {
  const sectionTitle = String(title || "Empfohlene Standards").trim() || "Empfohlene Standards";
  const descriptorsByFeatureKey = new Map(
    (Array.isArray(descriptors) ? descriptors : [])
      .map((descriptor) => [String(descriptor?.featureKey || "").trim(), descriptor])
      .filter(([featureKey]) => featureKey)
  );
  const lines = [
    `## ${sectionTitle}`,
    "",
    "Die Aktion `Empfohlene Standards` wendet aktuell dieses Profil an:",
    "",
  ];

  RECOMMENDED_DEFAULTS_DOC_GROUPS.forEach((group) => {
    lines.push(`### ${group.title}`, "");
    group.sections.forEach((section) => {
      lines.push(`**${section.title}**`);
      section.fields.forEach((fieldDefinition) => {
        lines.push(
          `- \`${fieldDefinition.label}\`: ${resolveRecommendedFieldLabel(
            descriptorsByFeatureKey,
            fieldDefinition,
            resolveFeatureConfig,
            section.featureKey
          )}`
        );
      });
      lines.push("");
    });
  });

  return `${lines.join("\n").trim()}\n`;
}

export function formatVariantLabel(variants = []) {
  if (!Array.isArray(variants) || !variants.length) {
    return "`alle Modi`";
  }

  const labels = variants.map((variant) => {
    const normalized = String(variant || "").trim().toLowerCase();
    if (normalized === "all") {
      return "alle Modi";
    }
    if (normalized === "x01") {
      return "X01";
    }
    if (normalized === "gotcha") {
      return "Gotcha";
    }
    if (normalized === "bull-off") {
      return "Bull-off";
    }
    if (normalized === "shanghai") {
      return "Shanghai";
    }
    if (normalized === "bermuda") {
      return "Bermuda";
    }
    if (normalized === "cricket") {
      return "Cricket";
    }
    if (normalized === "tactics") {
      return "Tactics";
    }
    return normalized;
  });

  return labels.map((label) => `\`${label}\``).join(", ");
}

function escapeMarkdownTableCell(value) {
  return String(value || "")
    .replaceAll(/\s+/g, " ")
    .replaceAll("|", String.raw`\|`)
    .trim();
}

export function buildModuleFinderSection(title, entries = []) {
  const lines = [
    `## ${String(title || "Modul-Finder").trim()}`,
    "",
    "Wähle den Spielmodus oder den gewünschten sichtbaren Effekt und öffne anschließend die passende Kurzbeschreibung.",
    "",
    "| Modul | Bereich | Geeignet für | Kurz erklärt |",
    "| --- | --- | --- | --- |",
  ];

  entries.forEach(({ descriptor, definition }) => {
    const featureKey = String(descriptor?.featureKey || definition?.featureKey || "").trim();
    const anchor = String(descriptor?.readmeAnchor || "").trim();
    const label = String(definition?.title || descriptor?.title || featureKey).trim();
    const copy = getXConfigFeatureCopy(featureKey);
    const description = String(
      descriptor?.description || definition?.description || copy?.visibleDescription || ""
    ).trim();
    if (!descriptor || !definition || !anchor || !label || !description) {
      return;
    }

    let area = "Funktion";
    if (descriptor.cardType === "action") {
      area = "Aktion";
    } else if (getXConfigSectionMeta(featureKey).sectionId === "template") {
      area = "Design";
    }
    lines.push(
      `| [${escapeMarkdownTableCell(label)}](#${anchor}) | ${area} | ${formatVariantLabel(
        definition.variants
      )} | ${escapeMarkdownTableCell(description)} |`
    );
  });

  return `${lines.join("\n")}\n`;
}

function appendFieldWithOptions(lines, field, description, optionDescriptionKey, options = {}) {
  const text = String(description || "").trim();
  if (!text) {
    return;
  }

  lines.push(`- \`${field.label}\`: ${text}`);
  if (field.control !== "select" || !Array.isArray(field.options) || !field.options.length) {
    return;
  }

  field.options.forEach((option) => {
    if (typeof options.optionLineBuilder === "function") {
      const optionLine = String(options.optionLineBuilder(option) || "");
      if (optionLine.trim()) {
        lines.push(optionLine);
      }
      return;
    }
    const optionText = String(option?.[optionDescriptionKey] || "").trim();
    if (!optionText) {
      return;
    }
    lines.push(`  - \`${option.label}\`: ${optionText}`);
  });
}

export function buildReadmeFeatureSection(descriptor, definition) {
  const featureKey = String(descriptor?.featureKey || definition?.featureKey || "").trim();
  const copy = getXConfigFeatureCopy(featureKey);
  if (!descriptor || !definition || !copy) {
    return "";
  }
  const anchorIds = [
    String(descriptor.readmeAnchor || "").trim(),
    ...(Array.isArray(descriptor.readmeAnchorAliases) ? descriptor.readmeAnchorAliases : []),
  ].filter(Boolean);

  const lines = [
    ...anchorIds.map((anchorId) => `<a id="${anchorId}"></a>`),
    "",
    `### ${definition.title}`,
    "",
    `- Gilt für: ${formatVariantLabel(definition.variants)}`,
    `- Was macht es sichtbar? ${copy.visibleDescription}`,
    `- Wann sinnvoll? ${copy.usefulWhen}`,
    "",
  ];

  const primaryAnchor = anchorIds[0];
  if (primaryAnchor) {
    lines.push(
      `[Alle Einstellungen und Optionen in der Feature-Referenz](docs/FEATURES.md#${primaryAnchor})`
    );
  }

  if (Array.isArray(copy.images) && copy.images.length) {
    lines.push("");
    const [previewImage] = copy.images;
    lines.push(`![${previewImage.alt}](docs/screenshots/${previewImage.fileName})`);
  }

  return `${lines.join("\n")}\n`;
}

export function buildFeaturesDocSection(descriptor, definition) {
  const featureKey = String(descriptor?.featureKey || definition?.featureKey || "").trim();
  const copy = getXConfigFeatureCopy(featureKey);
  if (!descriptor || !definition || !copy) {
    return "";
  }

  const anchorIds = [
    String(descriptor.readmeAnchor || "").trim(),
    ...(Array.isArray(descriptor.readmeAnchorAliases) ? descriptor.readmeAnchorAliases : []),
  ].filter(Boolean);

  const lines = [
    ...anchorIds.map((anchorId) => `<a id="${anchorId}"></a>`),
    "",
    `### ${definition.title}`,
    "",
    `- Gilt für: ${formatVariantLabel(definition.variants)}`,
    `- Kurz: ${copy.visibleDescription}`,
    `- Grafisch: ${copy.visualDescription}`,
    `- Wann sinnvoll? ${copy.usefulWhen}`,
  ];

  const featuresDetails = Array.isArray(copy.featuresDetails)
    ? copy.featuresDetails.map((entry) => String(entry || "").trim()).filter(Boolean)
    : [];
  featuresDetails.forEach((entry) => {
    lines.push(`- ${entry}`);
  });

  (descriptor.fields || []).forEach((field) => {
    const featuresDescription = String(field.featuresDescription || field.docsDescription || "").trim();
    appendFieldWithOptions(lines, field, featuresDescription, "featuresDescription");
    appendRawLines(lines, getFieldAppendixLines(copy, field.key, "features"));
  });

  if (Array.isArray(copy.images) && copy.images.length) {
    lines.push("");
    copy.images.forEach((entry) => {
      lines.push(`![${entry.alt}](screenshots/${entry.fileName})`);
    });
  }

  return `${lines.join("\n")}\n`;
}
import {
  THEME_GLOBAL_TYPOGRAPHY_FONT_PRESETS,
} from "../../shared/theme-global-typography-presets.js";
import { THEME_GLOBAL_TEMPLATE_PRESETS } from "../../shared/theme-global-template-presets.js";
import { BOARD_STYLE_DESIGNS } from "../../shared/board-style-assets.manifest.js";
import { getXConfigSectionMeta } from "./sections.js";
