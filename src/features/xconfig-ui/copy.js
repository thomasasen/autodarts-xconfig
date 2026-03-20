function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }

  Object.getOwnPropertyNames(value).forEach((key) => {
    deepFreeze(value[key]);
  });

  return Object.freeze(value);
}

function fieldCopy(description, docsDescription, featuresDescription = "") {
  return deepFreeze({
    description: String(description || "").trim(),
    docsDescription: String(docsDescription || "").trim(),
    featuresDescription: String(featuresDescription || docsDescription || "").trim(),
  });
}

function optionCopy(description, docsDescription, featuresDescription = "") {
  return deepFreeze({
    description: String(description || "").trim(),
    docsDescription: String(docsDescription || "").trim(),
    featuresDescription: String(featuresDescription || docsDescription || "").trim(),
  });
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

const THEME_UPLOAD_FIELD = fieldCopy(
  "Öffnet die Dateiauswahl und speichert ein eigenes Bild nur für dieses Theme.",
  "Öffnet die Dateiauswahl und speichert das gewählte Bild ausschließlich für dieses Theme. Das Bild wird lokal gesichert und nach Reloads wieder für genau dieses Theme verwendet.",
  "Speichert ein eigenes Bild nur für dieses Theme."
);

const THEME_CLEAR_FIELD = fieldCopy(
  "Entfernt nur das für dieses Theme gespeicherte Bild.",
  "Löscht nur den lokalen Bild-Override dieses Themes. Das Theme bleibt aktiv, verwendet danach aber wieder kein eigenes gespeichertes Hintergrundbild.",
  "Entfernt nur das für dieses Theme gespeicherte Hintergrundbild."
);

export const xconfigFeatureCopy = deepFreeze({
  "theme-x01": featureCopy({
    cardDescription: "Ruhiges X01-Theme mit optionaler AVG-Zeile und eigenem Hintergrundbild.",
    visibleDescription: "Ein ruhiges X01-Layout mit eigener Bildfläche und optionaler AVG-Zeile.",
    visualDescription:
      "Farben, Flächen und Karten werden neu gestaltet; ein eigenes Hintergrundbild liegt hinter dem Spielbereich, während die Grundstruktur des X01-Layouts erhalten bleibt.",
    usefulWhen:
      "Wenn dir das Standardlayout zu unruhig ist oder du X01 optisch personalisieren möchtest.",
    images: [
      image("Theme X01 in AD xConfig", "template-theme-x01-xConfig.png"),
      image("Theme X01 Vorschau Standard", "template-theme-x01-preview-standard-readme.png"),
      image(
        "Theme X01 Vorschau unter Würfen",
        "template-theme-x01-preview-under-throws-readme.png"
      ),
    ],
    fields: {
      showAvg: fieldCopy(
        "Blendet die AVG-Anzeige im Theme ein oder aus.",
        "Schaltet die AVG-Anzeige im X01-Theme sichtbar an oder aus. Grafisch bleibt das Layout gleich, nur der AVG-Bereich erscheint oder verschwindet.",
        "Blendet die AVG-Anzeige im X01-Theme ein oder aus."
      ),
      backgroundDisplayMode: THEME_BACKGROUND_DISPLAY_FIELD,
      backgroundOpacity: THEME_BACKGROUND_OPACITY_FIELD,
      playerFieldTransparency: THEME_PLAYER_TRANSPARENCY_FIELD,
      debug: DEBUG_FIELD,
      uploadThemeBackground: THEME_UPLOAD_FIELD,
      clearThemeBackground: THEME_CLEAR_FIELD,
    },
  }),
  "theme-shanghai": featureCopy({
    cardDescription:
      "Aufgeräumtes Shanghai-Theme mit optionaler AVG-Zeile und eigenem Hintergrundbild.",
    visibleDescription:
      "Ein aufgeräumtes Shanghai-Layout mit optionaler AVG-Zeile und ruhigerem Kontrast.",
    visualDescription:
      "Das Theme ordnet Flächen und Farben neu, ohne den Spielaufbau zu verändern. Ein eigenes Hintergrundbild liegt hinter der Oberfläche und kann die Wirkung zusätzlich prägen.",
    usefulWhen: "Wenn du in Shanghai mehr Struktur und weniger visuelle Unruhe möchtest.",
    images: [image("Theme Shanghai in AD xConfig", "template-theme-shanghai-xConfig.png")],
    fields: {
      showAvg: fieldCopy(
        "Blendet die AVG-Anzeige im Theme ein oder aus.",
        "Schaltet die AVG-Anzeige im Shanghai-Theme sichtbar an oder aus. Das restliche Theme bleibt unverändert; nur der AVG-Bereich wird ein- oder ausgeblendet.",
        "Blendet die AVG-Anzeige im Shanghai-Theme ein oder aus."
      ),
      backgroundDisplayMode: THEME_BACKGROUND_DISPLAY_FIELD,
      backgroundOpacity: THEME_BACKGROUND_OPACITY_FIELD,
      playerFieldTransparency: THEME_PLAYER_TRANSPARENCY_FIELD,
      debug: DEBUG_FIELD,
      uploadThemeBackground: THEME_UPLOAD_FIELD,
      clearThemeBackground: THEME_CLEAR_FIELD,
    },
  }),
  "theme-bermuda": featureCopy({
    cardDescription:
      "Bermuda-Theme mit ruhigerem Grundbild und optional eigenem Hintergrund.",
    visibleDescription: "Ein ruhigeres Bermuda-Layout mit eigener Bildfläche im Hintergrund.",
    visualDescription:
      "Das Theme passt Farben und Flächen für Bermuda an; ein gespeichertes Hintergrundbild liegt hinter dem Spielbereich, während die Bermuda-Anordnung selbst erhalten bleibt.",
    usefulWhen:
      "Wenn Bermuda besser lesbar sein soll, ohne viele Zusatzschalter zu benötigen.",
    images: [image("Theme Bermuda in AD xConfig", "template-theme-bermuda-xConfig.png")],
    fields: {
      backgroundDisplayMode: THEME_BACKGROUND_DISPLAY_FIELD,
      backgroundOpacity: THEME_BACKGROUND_OPACITY_FIELD,
      playerFieldTransparency: THEME_PLAYER_TRANSPARENCY_FIELD,
      debug: DEBUG_FIELD,
      uploadThemeBackground: THEME_UPLOAD_FIELD,
      clearThemeBackground: THEME_CLEAR_FIELD,
    },
  }),
  "theme-cricket": featureCopy({
    cardDescription:
      "Gemeinsames Cricket-/Tactics-Theme mit optionaler AVG-Zeile und eigenem Hintergrundbild.",
    visibleDescription:
      "Ein gemeinsames Theme für Cricket und Tactics mit ruhigerer Grundoptik und optionaler AVG-Zeile.",
    visualDescription:
      "Farben, Karten und Hintergründe werden auf eine gemeinsame Cricket-/Tactics-Optik gezogen. Ein eigenes Bild kann hinter dem Spielbereich liegen, ohne die Board- oder Grid-Logik zu verändern.",
    usefulWhen:
      "Wenn du für Cricket und Tactics eine einheitliche visuelle Basis möchtest, besonders zusammen mit den Cricket-Effekten.",
    images: [image("Theme Cricket in AD xConfig", "template-theme-cricket-xConfig.png")],
    fields: {
      showAvg: fieldCopy(
        "Blendet die AVG-Anzeige im Theme ein oder aus.",
        "Schaltet die AVG-Anzeige im Cricket-/Tactics-Theme an oder aus. Grafisch bleibt das Theme gleich; nur der AVG-Bereich erscheint oder verschwindet.",
        "Blendet die AVG-Anzeige im Cricket-/Tactics-Theme ein oder aus."
      ),
      backgroundDisplayMode: THEME_BACKGROUND_DISPLAY_FIELD,
      backgroundOpacity: THEME_BACKGROUND_OPACITY_FIELD,
      playerFieldTransparency: THEME_PLAYER_TRANSPARENCY_FIELD,
      debug: DEBUG_FIELD,
      uploadThemeBackground: THEME_UPLOAD_FIELD,
      clearThemeBackground: THEME_CLEAR_FIELD,
    },
  }),
  "theme-bull-off": featureCopy({
    cardDescription:
      "Bull-off-Theme mit wählbarem Kontrast und eigenem Hintergrundbild.",
    visibleDescription:
      "Ein kontrastbetontes Bull-off-Layout mit wählbarer Stärke und eigener Bildfläche.",
    visualDescription:
      "Das Theme verändert Farben, Kontrast und Flächen speziell für Bull-off. Ein optionales Hintergrundbild liegt dahinter, während der Spielaufbau gleich bleibt.",
    usefulWhen:
      "Wenn Bull-off auf helleren Displays oder aus der Distanz klarer lesbar sein soll.",
    images: [image("Theme Bull-off in AD xConfig", "template-theme-bull-off-xConfig.png")],
    fields: {
      contrastPreset: fieldCopy(
        "Schaltet zwischen sanfter, normaler und kräftiger Kontrastwirkung um.",
        "Wählt, wie stark Texte, Flächen und Hervorhebungen im Bull-off-Theme voneinander abgesetzt werden. Grafisch wirkt `Sanft` zurückhaltender, `Kräftig` zeichnet Kanten und Kontraste deutlich härter.",
        "Schaltet die Kontrastwirkung des Bull-off-Themes um."
      ),
      backgroundDisplayMode: THEME_BACKGROUND_DISPLAY_FIELD,
      backgroundOpacity: THEME_BACKGROUND_OPACITY_FIELD,
      playerFieldTransparency: THEME_PLAYER_TRANSPARENCY_FIELD,
      debug: DEBUG_FIELD,
      uploadThemeBackground: THEME_UPLOAD_FIELD,
      clearThemeBackground: THEME_CLEAR_FIELD,
    },
  }),
  "checkout-score-pulse": featureCopy({
    cardDescription:
      "Hebt finishfähige Restwerte in X01 mit einem gut sichtbaren Score-Effekt hervor.",
    visibleDescription:
      "Finishfähige Restwerte werden direkt an der aktiven Punktzahl hervorgehoben.",
    visualDescription:
      "Die aktive Restpunktzahl pulsiert, glüht, skaliert oder blinkt je nach gewähltem Effekt. Die Hervorhebung sitzt direkt am Score und verändert keine anderen UI-Bereiche.",
    usefulWhen: "Wenn du Checkout-Momente schneller am Score erkennen möchtest.",
    images: [image("Checkout Score Pulse", "animation-checkout-score-pulse.gif")],
    fields: {
      effect: fieldCopy(
        "Wählt, ob die Restpunktzahl pulsiert, glüht, skaliert oder blinkt.",
        "Legt fest, wie die aktive Restpunktzahl hervorgehoben wird, sobald das Modul ein Checkout erkennt. Grafisch ändert sich nur die Animationsart des Score-Elements.",
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
        "Bestimmt, woran das Modul das Checkout erkennt. `Vorschlag zuerst` nutzt den sichtbaren Checkout-Vorschlag bevorzugt und fällt nur ohne Vorschlag auf die reine Score-Prüfung zurück; die anderen Modi erzwingen ausschließlich Score- oder Vorschlagslogik.",
        "Legt fest, welche Quelle den Score-Effekt auslösen darf."
      ),
      debug: DEBUG_FIELD,
    },
  }),
  "x01-score-progress": featureCopy({
    cardDescription:
      "Zeigt den verbleibenden X01-Score als Balken direkt unter jeder Spielerpunktzahl.",
    visibleDescription:
      "Jede X01-Spielerkarte erhält einen Balken, der den verbleibenden Score relativ zum Startwert zeigt.",
    visualDescription:
      "Direkt unter der Punktzahl liegt ein horizontaler Fortschrittsbalken. Aktive Spieler erhalten eine kräftigere, präsentere Darstellung mit optionalem Effekt, inaktive Karten bleiben flacher und unverändert ruhig. Je näher der Restwert an `0` liegt, desto kürzer wird der Balken.",
    usefulWhen:
      "Wenn du Reststände und den Abstand zwischen Spielern in X01 schneller auf einen Blick erfassen möchtest.",
    images: [image("X01 Score Progress", "animation-x01-score-progress.png")],
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
  "checkout-board-targets": featureCopy({
    cardDescription:
      "Markiert Checkout-Ziele direkt am Board, statt sie nur im Text zu zeigen.",
    visibleDescription:
      "Mögliche Checkout-Ziele werden direkt am virtuellen Board markiert.",
    visualDescription:
      "Die relevanten Segmente erhalten eine farbige Füllung, Kontur und Animation. So siehst du am Board selbst, welches Ziel aktuell für den Checkout relevant ist.",
    usefulWhen: "Wenn du Finish-Wege nicht nur lesen, sondern direkt am Board sehen willst.",
    images: [image("Checkout Board Targets", "animation-checkout-board-targets.gif")],
    fields: {
      effect: fieldCopy(
        "Legt fest, ob markierte Segmente pulsieren, blinken oder glühen.",
        "Wählt die Animationsart der markierten Board-Segmente. Die Segmentauswahl bleibt gleich; nur die Bewegung und Leuchtwirkung ändern sich.",
        "Legt die Animationsart der markierten Segmente fest."
      ),
      singleRing: fieldCopy(
        "Bestimmt bei Single-Zielen, ob der innere, äußere oder beide Single-Ringe markiert werden.",
        "Wirkt nur dann, wenn ein Checkout-Segment ein Single-Feld ist. Grafisch kann die Markierung auf den inneren Single-Ring, den äußeren Ring oder beide gelegt werden.",
        "Bestimmt, welche Single-Ringe bei Single-Zielen markiert werden."
      ),
      colorTheme: fieldCopy(
        "Passt die Farbe der Board-Markierungen an dein Setup an.",
        "Wählt das Farbschema für Füllung, Kontur und Leuchteffekt der Checkout-Ziele. Die Segmentlogik bleibt unverändert; nur die visuelle Farbwirkung wechselt.",
        "Passt die Farbe der Board-Markierungen an."
      ),
      outlineIntensity: fieldCopy(
        "Regelt Stärke und Puls der Kontur um das Zielsegment.",
        "Steuert Deckkraft, Breite und Animation der weißen Umrandung. Hohe Stufen zeichnen die Zielkontur sichtbarer und mit kräftigerem Puls.",
        "Regelt Stärke und Puls der Zielkontur."
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
    images: [image("TV Board Zoom", "animation-tv-board-zoom.gif")],
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
      debug: DEBUG_FIELD,
    },
  }),
  "style-checkout-suggestions": featureCopy({
    cardDescription:
      "Gibt Checkout-Hinweisen eine markantere Hülle und bessere Lesbarkeit.",
    visibleDescription:
      "Checkout-Empfehlungen werden auffälliger, strukturierter und besser lesbar gestaltet.",
    visualDescription:
      "Der sichtbare Vorschlagsblock erhält je nach Stil eine Badge-, Ribbon-, Stripe-, Ticket- oder Outline-Optik. Optional sitzt darüber ein eigenes Label wie `CHECKOUT` oder `FINISH`.",
    usefulWhen:
      "Wenn du Suggestionen schneller scannen möchtest oder der Standard-Look zu unauffällig ist.",
    images: [
      image("Style Checkout Suggestions", "animation-style-checkout-suggestions.png"),
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
        "Wechselt zwischen mehreren Hüllen für den sichtbaren Checkout-Vorschlag.",
        "Legt die Grundform des Suggestions-Containers fest. Grafisch ändert sich die Hülle des vorhandenen Vorschlags, nicht sein Inhalt.",
        "Wechselt die Hülle des Checkout-Vorschlags."
      ),
      labelText: fieldCopy(
        "Setzt den Text des kleinen Labels oberhalb der Empfehlung oder blendet ihn aus.",
        "Bestimmt, welcher feste Labeltext über dem gestylten Checkout-Vorschlag erscheint. `Kein Label` blendet diese Zusatzmarke vollständig aus.",
        "Legt den festen Labeltext über dem Vorschlag fest oder blendet ihn aus."
      ),
      colorTheme: fieldCopy(
        "Wählt die Akzentfarbe des gestylten Vorschlags.",
        "Steuert Akzentfarbe, Hintergründe und Leuchteffekte des Suggestion-Styles. Die inhaltliche Checkout-Empfehlung bleibt unverändert.",
        "Wählt die Akzentfarbe des Suggestion-Styles."
      ),
      debug: DEBUG_FIELD,
    },
  }),
  "average-trend-arrow": featureCopy({
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
    images: [image("Average Trend Arrow", "animation-average-trend-arrow.png")],
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
  "turn-start-sweep": featureCopy({
    cardDescription:
      "Markiert den Spielerwechsel mit einem Lichtlauf über die aktive Karte.",
    visibleDescription:
      "Beim Spielerwechsel läuft ein kurzer Sweep über die aktive Karte.",
    visualDescription:
      "Eine helle, halbtransparente Bahn zieht einmal quer über die aktive Karte. So springt der neue Zugwechsel schneller ins Auge.",
    usefulWhen:
      "Wenn du in schnellen Matches einen klareren Wechsel zwischen den Spielern sehen willst.",
    images: [image("Turn Start Sweep", "animation-turn-start-sweep.gif")],
    fields: {
      durationMs: fieldCopy(
        "Bestimmt, wie schnell der Sweep über die Karte läuft.",
        "Legt die Gesamtdauer des Lichtlaufs fest. Kürzere Stufen wirken direkter, längere Stufen betonen den Wechsel stärker.",
        "Bestimmt das Tempo des Sweeps."
      ),
      sweepStyle: fieldCopy(
        "Regelt Breite und Helligkeit des Sweeps.",
        "Wählt die optische Stärke des Sweeps. `Dezent` nutzt eine schmalere und schwächere Lichtbahn, `Kräftig` zeichnet sie breiter und heller.",
        "Regelt Breite und Helligkeit des Sweeps."
      ),
      debug: DEBUG_FIELD,
    },
  }),
  "triple-double-bull-hits": featureCopy({
    cardDescription:
      "Setzt Triple-, Double- und Bull-Treffer mit auffälligen Stripe-/Glow-Looks, Text-Effekten und slot-genauen Burst-Bewegungen in Szene.",
    visibleDescription:
      "Treffer wie `T20`, `D16`, `25` und `BULL` bekommen dunkle Pattern-Highlights, stärkeren Text-Fokus und klar sichtbare Burst-Moves.",
    visualDescription:
      "Die betroffenen Wurffelder erhalten dunkle, kontrastreiche Flächen mit animierten Verläufen, Pattern-Layern, leuchtenden Rändern und textbezogenen Trefferimpulsen. Einige Farbwelten gehen eher in Cyberpunk-, Hazard- oder Vintage-Richtung. `25` (Single Bull) bleibt ruhiger, `BULL` (Bullseye) erscheint heller und markanter. Nur das frisch erkannte Feld bekommt den starken Burst; ausgewählte Presets dürfen danach subtil weiterlaufen.",
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
        "**Vorschau Animationsstile**",
        "",
        "Die Bewegungsstile bleiben animiert, sind für die Doku aber kompakter skaliert, damit die Unterschiede direkt nebeneinander erkennbar sind.",
        "",
        "|  |  |",
        "| --- | --- |",
        "| `Slam Punch` | `Shock Ring` |",
        "| ![Animationsstil Slam Punch](docs/screenshots/animation-triple-double-bull-hits-motion-slam-punch-readme.gif) | ![Animationsstil Shock Ring](docs/screenshots/animation-triple-double-bull-hits-motion-shock-ring-readme.gif) |",
        "| `Laser Sweep` | `Reactor Pulse` |",
        "| ![Animationsstil Laser Sweep](docs/screenshots/animation-triple-double-bull-hits-motion-laser-sweep-readme.gif) | ![Animationsstil Reactor Pulse](docs/screenshots/animation-triple-double-bull-hits-motion-reactor-pulse-readme.gif) |",
        "| `Turbo Bounce` | `Card Hammer` |",
        "| ![Animationsstil Turbo Bounce](docs/screenshots/animation-triple-double-bull-hits-motion-turbo-bounce-readme.gif) | ![Animationsstil Card Hammer](docs/screenshots/animation-triple-double-bull-hits-motion-card-hammer-readme.gif) |",
        "| `Glitch Blink` | `Cascade Split` |",
        "| ![Animationsstil Glitch Blink](docs/screenshots/animation-triple-double-bull-hits-motion-glitch-blink-readme.gif) | ![Animationsstil Cascade Split](docs/screenshots/animation-triple-double-bull-hits-motion-cascade-split-readme.gif) |",
        "| `Rotor Flip` | `Edge Runner` |",
        "| ![Animationsstil Rotor Flip](docs/screenshots/animation-triple-double-bull-hits-motion-rotor-flip-readme.gif) | ![Animationsstil Edge Runner](docs/screenshots/animation-triple-double-bull-hits-motion-edge-runner-readme.gif) |",
        "| `Charge Burst` | `Beacon Flicker` |",
        "| ![Animationsstil Charge Burst](docs/screenshots/animation-triple-double-bull-hits-motion-charge-burst-readme.gif) | ![Animationsstil Beacon Flicker](docs/screenshots/animation-triple-double-bull-hits-motion-beacon-flicker-readme.gif) |",
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
        "**Vorschau Animationsstile**",
        "",
        "Die Bewegungsstile bleiben animiert, sind für die Doku aber kompakter skaliert, damit die Unterschiede direkt nebeneinander erkennbar sind.",
        "",
        "|  |  |",
        "| --- | --- |",
        "| `Slam Punch` | `Shock Ring` |",
        "| ![Animationsstil Slam Punch](screenshots/animation-triple-double-bull-hits-motion-slam-punch-readme.gif) | ![Animationsstil Shock Ring](screenshots/animation-triple-double-bull-hits-motion-shock-ring-readme.gif) |",
        "| `Laser Sweep` | `Reactor Pulse` |",
        "| ![Animationsstil Laser Sweep](screenshots/animation-triple-double-bull-hits-motion-laser-sweep-readme.gif) | ![Animationsstil Reactor Pulse](screenshots/animation-triple-double-bull-hits-motion-reactor-pulse-readme.gif) |",
        "| `Turbo Bounce` | `Card Hammer` |",
        "| ![Animationsstil Turbo Bounce](screenshots/animation-triple-double-bull-hits-motion-turbo-bounce-readme.gif) | ![Animationsstil Card Hammer](screenshots/animation-triple-double-bull-hits-motion-card-hammer-readme.gif) |",
        "| `Glitch Blink` | `Cascade Split` |",
        "| ![Animationsstil Glitch Blink](screenshots/animation-triple-double-bull-hits-motion-glitch-blink-readme.gif) | ![Animationsstil Cascade Split](screenshots/animation-triple-double-bull-hits-motion-cascade-split-readme.gif) |",
        "| `Rotor Flip` | `Edge Runner` |",
        "| ![Animationsstil Rotor Flip](screenshots/animation-triple-double-bull-hits-motion-rotor-flip-readme.gif) | ![Animationsstil Edge Runner](screenshots/animation-triple-double-bull-hits-motion-edge-runner-readme.gif) |",
        "| `Charge Burst` | `Beacon Flicker` |",
        "| ![Animationsstil Charge Burst](screenshots/animation-triple-double-bull-hits-motion-charge-burst-readme.gif) | ![Animationsstil Beacon Flicker](screenshots/animation-triple-double-bull-hits-motion-beacon-flicker-readme.gif) |",
        "",
      ],
    },
    fields: {
      colorTheme: fieldCopy(
        "Wählt die visuelle Farbwelt für Verlauf, Glow und Rand des Trefferfelds.",
        "Legt fest, wie Triple-, Double- und Bull-Treffer eingefärbt werden. `Rot/Blau/Grün` erzwingt eine klare Signalzuordnung pro Trefferart (`Triple = rot`, `Double = blau`, `Bull = grün`); die anderen Einträge sind die bisherigen Preset-Farbstile.",
        "Wählt die visuelle Farbwelt für Verlauf, Glow und Rand der Treffer-Highlights."
      ),
      animationStyle: fieldCopy(
        "Wählt den Burst-Stil für das frisch erkannte Trefferfeld.",
        "Bestimmt, wie sich das frisch erkannte Trefferfeld und sein Text bewegen. Einige Presets bleiben reine One-Shot-Bursts, andere kombinieren den Burst mit einem subtilen Idle-Loop auf markierten Feldern.",
        "Wählt den Burst-Stil für das frisch erkannte Trefferfeld."
      ),
      debug: DEBUG_FIELD,
    },
  }),
  "cricket-highlighter": featureCopy({
    cardDescription:
      "Zeigt Cricket- und Tactics-Zustände direkt auf dem Board statt nur in der Matrix.",
    visibleDescription:
      "Zielzustände und Drucksituationen werden direkt am Board sichtbar.",
    visualDescription:
      "Board-Segmente erhalten je nach Zustand farbige Overlays. Relevante Ziele leuchten grün oder rot, irrelevante Felder werden je nach Stil abgeschwächt, geschraffiert oder maskiert.",
    usefulWhen:
      "Wenn du in Cricket oder Tactics schneller sehen möchtest, welche Ziele offen, scorable, unter Druck oder bereits erledigt sind.",
    images: [
      image("Cricket Target Highlighter", "animation-cricket-target-highlighter.png"),
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
        "Wählt den Stil für Felder, die im aktuellen Cricket-/Tactics-Zustand keine aktive Rolle spielen. `Aus` blendet die Abdunkelung ab, `Smoke` dämpft neutral, `Hatch+` ergänzt Schraffur und `Mask` legt eine besonders harte dunkle Maske darüber.",
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
  "cricket-grid-fx": featureCopy({
    cardDescription:
      "Ergänzt die Cricket-/Tactics-Matrix um Live-Effekte für Fortschritt, Druck und Wechsel.",
    visibleDescription:
      "Zusätzliche Live-Effekte direkt in der Cricket-/Tactics-Matrix.",
    visualDescription:
      "Zellen, Zeilen, Labels und Badges reagieren mit grünen und roten Zuständen, kurzen Chips, Kanten und Übergängen. So werden Fortschritt, Gegnerdruck und Zugwechsel in der Matrix selbst sichtbarer.",
    usefulWhen:
      "Wenn du Fortschritt, Gegnerdruck und Wechsel im Grid klarer sehen willst.",
    images: [image("Cricket Grid FX", "animation-cricket-grid-fx.png")],
    fields: {
      rowWave: fieldCopy(
        "Lässt bei Änderungen einen kurzen Lichtlauf über die betroffene Zeile laufen.",
        "Startet nach einer relevanten Zustandsänderung einen kurzen Zeilen-Sweep. Grafisch zieht eine helle Welle einmal über die betroffene Matrixzeile.",
        "Lässt nach Änderungen einen kurzen Lichtlauf über die Zeile laufen."
      ),
      badgeBeacon: fieldCopy(
        "Gibt relevanten Ziel-Badges und Labelzellen mehr Leuchteffekt.",
        "Verstärkt den Glow und die Sichtbarkeit der Ziel-Badges beziehungsweise Labelzellen, wenn sie für Scoring oder Druck relevant sind.",
        "Verstärkt Ziel-Badges und Labelzellen mit zusätzlichem Glow."
      ),
      markProgress: fieldCopy(
        "Betont den Fortschritt von 1, 2 und 3 Marks in den Spielerzellen.",
        "Hebt neue oder relevante Mark-Stufen in Spielerzellen sichtbar hervor. Grafisch werden die Mark-Level deutlicher ausgemalt und leichter voneinander unterscheidbar.",
        "Betont die Mark-Stufen in den Spielerzellen."
      ),
      pressureEdge: fieldCopy(
        "Zeichnet bei Gegnerdruck eine rote Kante am betroffenen Bereich.",
        "Ergänzt eine deutliche Druckkante, wenn eine Zeile oder Zelle unter relevantem Gegnerdruck steht. Die Kante dient als schneller Warnhinweis, ohne die komplette Zelle umzufärben.",
        "Zeichnet bei Gegnerdruck eine rote Warnkante."
      ),
      scoringStripe: fieldCopy(
        "Hebt offensiv scorable Bereiche mit einer grünen Bahn hervor.",
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
        "Blendet nach einer relevanten Änderung kurze Delta-Chips direkt an der Matrix ein. So ist sofort erkennbar, wie viele Marks gerade dazugekommen sind.",
        "Zeigt kurz `+1`, `+2` oder `+3` direkt an der Matrix an."
      ),
      hitSpark: fieldCopy(
        "Erzeugt am frisch getroffenen Bereich einen kurzen Treffer-Impuls.",
        "Setzt auf der gerade betroffenen Zelle einen kleinen optischen Trefferfunken. Das ist ein punktueller Impuls und keine dauerhafte Färbung.",
        "Erzeugt einen kurzen Trefferfunken am betroffenen Bereich."
      ),
      roundTransitionWipe: fieldCopy(
        "Kennzeichnet den Zugwechsel mit einem kurzen Übergang in der Matrix.",
        "Legt beim Wechsel auf den nächsten Spieler einen sichtbaren Wipe über den betroffenen Matrixbereich. So wird der Turn-Übergang schneller lesbar.",
        "Kennzeichnet den Zugwechsel mit einem kurzen Matrix-Übergang."
      ),
      pressureOverlay: fieldCopy(
        "Legt bei Gegnerdruck eine zusätzliche rote Druckfläche über betroffene Bereiche.",
        "Ergänzt bei relevantem Gegnerdruck ein sichtbares Overlay zusätzlich zur Kante. So springt defensiver Druck auch dann ins Auge, wenn man nicht auf jede Zellfarbe achtet.",
        "Legt bei Gegnerdruck eine zusätzliche rote Druckfläche über betroffene Bereiche."
      ),
      colorTheme: fieldCopy(
        "Passt die Grün-/Rot-Wirkung der Grid-Effekte an.",
        "Wechselt zwischen Standard und kontraststärkerer Farbpalette für offensive und druckbezogene Grid-Effekte. Die Zustandslogik selbst bleibt identisch.",
        "Passt die Farben der Grid-Effekte an."
      ),
      intensity: fieldCopy(
        "Regelt die Gesamtstärke von Glow, Füllung und Kanten.",
        "Steuert Opazität, Leuchtkraft und Sichtbarkeit des gesamten Grid-FX-Pakets. Höhere Stufen lassen grüne und rote Zustände markanter erscheinen.",
        "Regelt die Gesamtstärke der Grid-Effekte."
      ),
      debug: DEBUG_FIELD,
    },
  }),
  "dart-marker-emphasis": featureCopy({
    cardDescription:
      "Macht vorhandene Marker auf dem virtuellen Board klarer und auffälliger.",
    visibleDescription:
      "Treffer-Marker auf dem virtuellen Board werden deutlicher sichtbar.",
    visualDescription:
      "Die bestehenden Marker werden größer, farbiger und auf Wunsch mit Pulse, Glow oder Outline versehen. Das Modul ersetzt die Marker nicht, sondern betont sie.",
    usefulWhen:
      "Wenn die Standardmarker zu klein oder zu unauffällig sind.",
    images: [image("Dart Marker Emphasis", "animation-dart-marker-emphasis.gif")],
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
        "Schaltet zwischen Glow, Pulse oder einer ruhigen Darstellung ohne Effekt um.",
        "Legt fest, ob die Marker weich glühen, leicht pulsieren oder ohne Zusatzanimation ruhig sichtbar bleiben.",
        "Schaltet zwischen Glow, Pulse oder keiner Zusatzanimation um."
      ),
      opacityPercent: fieldCopy(
        "Regelt die Sichtbarkeit der Marker über die Deckkraft.",
        "Bestimmt, wie kräftig die Marker gezeichnet werden. Höhere Werte machen die Treffer präsenter, niedrigere wirken unaufdringlicher.",
        "Regelt die Deckkraft der Marker."
      ),
      outline: fieldCopy(
        "Fügt optional einen weißen oder schwarzen Rand hinzu.",
        "Legt fest, ob die Marker zusätzlich mit einer hellen oder dunklen Outline gezeichnet werden. Das verbessert die Abgrenzung je nach Board- und Hintergrundfarbe.",
        "Fügt optional eine helle oder dunkle Outline hinzu."
      ),
      debug: DEBUG_FIELD,
    },
  }),
  "dart-marker-darts": featureCopy({
    cardDescription:
      "Ersetzt Marker optional durch kleine Dart-Grafiken mit Fluganimation.",
    visibleDescription:
      "Standardmarker können durch kleine Dart-Grafiken ersetzt werden.",
    visualDescription:
      "Statt des normalen Markers liegt ein Dart-Bild im getroffenen Segment. Auf Wunsch fliegt der Dart sichtbar ein, bevor er an seiner Zielposition landet.",
    usefulWhen:
      "Wenn du Treffer auf dem virtuellen Board persönlicher oder realistischer darstellen möchtest.",
    images: [image("Dart Marker Darts", "animation-dart-marker-darts.png")],
    fields: {
      design: fieldCopy(
        "Wählt das Bilddesign der eingeblendeten Darts.",
        "Legt fest, welches Dart-Motiv anstelle des Standardmarkers verwendet wird. Die Trefferposition bleibt gleich, nur die Grafik ändert sich.",
        "Wählt das Bilddesign der eingeblendeten Darts."
      ),
      animateDarts: fieldCopy(
        "Schaltet die sichtbare Fluganimation der Dart-Bilder ein oder aus.",
        "Bestimmt, ob neu gesetzte Dart-Bilder mit einer kurzen Flugbewegung ins Segment einlaufen oder sofort an ihrer Endposition erscheinen.",
        "Schaltet die Fluganimation der Dart-Bilder ein oder aus."
      ),
      sizePercent: fieldCopy(
        "Passt die Größe der Dart-Grafiken an.",
        "Skaliert die eingeblendeten Dart-Bilder relativ zur Standardgröße. Große Stufen füllen das Segment stärker aus.",
        "Passt die Größe der Dart-Grafiken an."
      ),
      hideOriginalMarkers: fieldCopy(
        "Blendet die ursprünglichen Marker aus, damit nur die Dart-Grafiken sichtbar bleiben.",
        "Verhindert Doppelanzeigen, indem der originale Marker unsichtbar gemacht wird, solange die Dart-Grafik aktiv ist.",
        "Blendet die ursprünglichen Marker zugunsten der Dart-Grafiken aus."
      ),
      enableShadow: fieldCopy(
        "Schaltet den Einschlag-Schatten unter dem Dart ein oder aus.",
        "Aktiviert einen leichten Schlagschatten unter dem Dart-Bild. Das gibt mehr räumlichen Eindruck rund um den Einschlagpunkt.",
        "Schaltet den Einschlag-Schatten der Dart-Grafik ein oder aus."
      ),
      enableWobble: fieldCopy(
        "Schaltet das kurze Wobble beim Einschlag ein oder aus.",
        "Aktiviert eine kurze Wackelbewegung des Dart-Bildes direkt nach der Landung. Das verstärkt den Einschlag-Effekt visuell.",
        "Schaltet das kurze Wobble der Dart-Grafik beim Einschlag ein oder aus."
      ),
      flightSpeed: fieldCopy(
        "Regelt die Dauer der Fluganimation der Darts.",
        "Wählt die Dauer der Einfluganimation neuer Dart-Bilder. `Schnell` landet zügig, `Cinematic` hält die Flugphase sichtbar länger.",
        "Regelt die Dauer der Fluganimation."
      ),
      debug: DEBUG_FIELD,
    },
  }),
  "remove-darts-notification": featureCopy({
    cardDescription:
      "Macht den Hinweis zum Entfernen der Darts mit einer großen Grafik auffälliger.",
    visibleDescription:
      "Der Hinweis zum Entfernen der Darts wird als große Grafik deutlich präsenter dargestellt.",
    visualDescription:
      "Der normale Hinweis wird durch eine zentrierte Bildkarte ersetzt. Optional pulsiert die Grafik leicht, damit sie im Spielablauf nicht übersehen wird.",
    usefulWhen: "Wenn der Standardhinweis zu leicht übersehen wird.",
    images: [image("Remove Darts Notification", "animation-remove-darts-notification.png")],
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
  "single-bull-sound": featureCopy({
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
        "Schaltet optional einen zusätzlichen Fallback-Scan ein, wenn reine Live-Erkennung nicht reicht.",
        "`Nur live` verlässt sich ausschließlich auf erkannte DOM- und State-Änderungen. `1200 ms` ergänzt einen regelmäßigen Fallback-Scan, falls Treffer in bestimmten Setups nicht zuverlässig sofort erkannt werden.",
        "Schaltet optional einen zusätzlichen 1200-ms-Fallback-Scan ein."
      ),
      debug: DEBUG_FIELD,
    },
  }),
  "turn-points-count": featureCopy({
    cardDescription:
      "Zählt Punkteänderungen beim Turn sichtbar hoch oder herunter.",
    visibleDescription:
      "Punkteänderungen beim Turn werden sichtbar hoch- oder heruntergezählt.",
    visualDescription:
      "Statt eines harten Sprungs läuft der angezeigte Wert weich zur neuen Punktzahl. Dadurch wird die Änderung als kurze Animation nachvollziehbar.",
    usefulWhen: "Wenn du Punktwechsel im Spielbild leichter verfolgen möchtest.",
    images: [
      image("Turn Points Count", "animation-turn-points-count.gif"),
      image("Turn Points Count Detail", "animation-turn-points-count-detail-readme.gif"),
    ],
    fields: {
      durationMs: fieldCopy(
        "Bestimmt, wie lange das Hoch- oder Herunterzählen bis zum Endwert dauert.",
        "Legt die Dauer der Zählanimation fest. Kurze Stufen springen schneller zum Zielwert, längere machen den Zwischenverlauf deutlicher sichtbar.",
        "Bestimmt die Dauer des Hoch- oder Herunterzählens."
      ),
      flashOnChange: fieldCopy(
        "Schaltet den kurzen Aufblitz-Effekt während einer echten Zahlenänderung ein oder aus.",
        "Wenn aktiv, blitzt der Turn-Wert nur in dem Zeitraum auf, in dem die Zahl wirklich animiert wird. Bei deaktivierter Option bleibt ausschließlich die Zählbewegung ohne zusätzlichen Lichtimpuls.",
        "Aktiviert oder deaktiviert den Aufblitz-Effekt während laufender Turn-Score-Änderungen."
      ),
      flashMode: fieldCopy(
        "Bestimmt, ob der elektrische Rahmen nur bei Änderungen erscheint oder dauerhaft sichtbar bleibt.",
        "Legt fest, wie der elektrische Rahmen dargestellt wird: `Nur bei Änderung` zeigt den Effekt nur während laufender Zähländerungen, `Permanent` hält den Rahmen dauerhaft sichtbar, solange das Feature aktiv ist.",
        "Wählt, ob der Rahmen nur bei Änderungen oder dauerhaft sichtbar ist."
      ),
      debug: DEBUG_FIELD,
    },
  }),
  "winner-fireworks": featureCopy({
    cardDescription: "Zeigt bei einem Sieg ein konfigurierbares Vollbild-Feuerwerk.",
    visibleDescription:
      "Bei einem Sieg erscheint ein Vollbild-Effekt im gewählten Feuerwerksstil.",
    visualDescription:
      "Je nach Stil starten Konfetti- oder Feuerwerksmuster über den gesamten Bildschirm. Farben, Dichte und Geschwindigkeit folgen dem gewählten Stil und der Intensität.",
    usefulWhen:
      "Wenn Siege deutlich gefeiert werden sollen oder du verschiedene Effektstile testen möchtest.",
    images: [
      image("Winner Fireworks", "animation-winner-fireworks.gif"),
      image("xConfig Test-Button", "xConfig-testbutton.png"),
    ],
    fields: {
      style: fieldCopy(
        "Wählt das Bewegungsmuster des Vollbild-Effekts.",
        "Legt fest, ob der Siegereffekt eher wie klassisches Feuerwerk, Kanonenschuss, Sternenregen, Seitenbeschuss oder eine andere Variante wirkt. Die Farbpalette bleibt davon unabhängig.",
        "Wählt das Bewegungsmuster des Siegereffekts."
      ),
      colorTheme: fieldCopy(
        "Wählt die Farbpalette des Feuerwerks.",
        "Bestimmt, aus welchen Farben der Effekt zusammengesetzt ist. Die Partikelmuster bleiben gleich, nur die Palette wird gewechselt.",
        "Wählt die Farbpalette des Siegereffekts."
      ),
      intensity: fieldCopy(
        "Regelt Partikelmenge, Intervall und Energie des Effekts.",
        "Steuert über Voreinstellungen, wie viele Partikel entstehen, wie häufig Schüsse ausgelöst werden und wie energisch sich der Effekt bewegt. `Stark` wirkt dichter und lebhafter, `Dezent` ruhiger.",
        "Regelt Dichte und Energie des Siegereffekts."
      ),
      "run-feature-action": fieldCopy(
        "Startet die aktuelle Konfiguration sofort als Vorschau im geöffneten xConfig-Fenster.",
        "Löst den aktuell konfigurierten Winner-Fireworks-Effekt direkt als Vorschau aus, ohne auf einen echten Sieg warten zu müssen. Das ist nur ein Testlauf und ändert keine gespeicherten Werte.",
        "Startet die aktuelle Konfiguration sofort als Vorschau."
      ),
      includeBullOut: fieldCopy(
        "Legt fest, ob der Effekt auch bei Bull-Out-Varianten abgespielt wird.",
        "Bestimmt, ob der Siegereffekt auch dann startet, wenn der erkannte Spielmodus eine Bull-Out-Variante ist. Ist die Option aus, bleiben diese Varianten stumm.",
        "Legt fest, ob der Effekt auch bei Bull-Out aktiv ist."
      ),
      pointerDismiss: fieldCopy(
        "Erlaubt das Beenden des laufenden Effekts per Klick.",
        "Bestimmt, ob ein linker Mausklick den aktuell laufenden Winner-Fireworks-Effekt vorzeitig schließen darf.",
        "Erlaubt das Beenden des Effekts per Klick."
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
  "25": optionCopy(
    "Zeigt das Bild nur noch als dezente Hintergrundstimmung.",
    "Das Bild schimmert eher subtil durch die dunkle Fläche. Einzelne Formen und Farben bleiben sichtbar, ohne die Lesbarkeit des Layouts zu stören.",
    "Das Motiv bleibt nur noch als ruhige Bildstimmung im Hintergrund erhalten. Farben und Strukturen tragen Atmosphäre bei, ohne Spielerfelder, Texte oder Karten optisch zu überholen."
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

const BULL_OFF_CONTRAST_PRESET_OPTION_COPY = deepFreeze({
  soft: optionCopy(
    "Hält Kanten, Schatten und aktive Hervorhebungen bewusst weich.",
    "Die Bull-off-Oberfläche bleibt kontrastärmer. Rahmen, Glows und aktive Flächen wirken ruhiger und weniger hart voneinander getrennt.",
    "Diese Stufe reduziert sichtbare Kanten, Schatten und Farbtrennung im Bull-off-Theme. Aktive und inaktive Bereiche bleiben erkennbar, wirken aber weicher und weniger aggressiv voneinander abgesetzt."
  ),
  standard: optionCopy(
    "Nutzen den ausgewogenen Standardkontrast des Themes.",
    "Das Theme zeigt klare, aber noch ausgewogene Kanten, Rahmen und Hervorhebungen. Diese Stufe ist der Mittelweg zwischen ruhiger Fläche und deutlicher Lesbarkeit.",
    "Diese Stufe liefert den vorgesehenen Mittelwert für Rahmen, aktive Hervorhebungen, Schatten und Bedienflächen. Das Layout bleibt kontrastreich genug für Lesbarkeit, ohne so hart wie `Kräftig` zu zeichnen."
  ),
  high: optionCopy(
    "Zieht Kanten, Schatten und aktive Bereiche deutlich härter auf.",
    "Rahmen, Glows und aktive Flächen treten sichtbar stärker hervor. Das Theme wirkt klarer, markanter und kontrastreicher.",
    "Diese Stufe erhöht die sichtbare Trennung zwischen aktiven und inaktiven Bereichen deutlich. Ränder, Schatten und Leuchtakzente werden kräftiger, sodass das Bull-off-Theme härter und präsenter erscheint."
  ),
});

const CHECKOUT_SCORE_EFFECT_OPTION_COPY = deepFreeze({
  pulse: optionCopy(
    "Lässt die Punktzahl weich ein- und ausatmen.",
    "Die Zahl wächst und leuchtet rhythmisch leicht an und fällt wieder auf ihre Ausgangsform zurück. Das wirkt wie ein ruhiger Herzschlag direkt auf dem Score.",
    "Die Restpunktzahl bekommt einen weichen Puls aus Größenänderung, Helligkeit und Schattierung. Der Effekt wirkt organisch und wiederkehrend, ohne die Zahl hart springen zu lassen."
  ),
  glow: optionCopy(
    "Lässt die Punktzahl vor allem über einen Lichtschein auffallen.",
    "Die Zahl bleibt weitgehend ruhig an Ort und Größe, bekommt aber einen sichtbar stärker werdenden Leuchtkranz. Das eignet sich für Nutzer, die eher Licht als Bewegung wollen.",
    "Der Fokus liegt auf einem an- und abschwellenden Glühen um die Zahl herum. Die Score-Anzeige selbst bleibt relativ stabil, während der Lichtschein die Aufmerksamkeit auf das Finish lenkt."
  ),
  scale: optionCopy(
    "Lässt die Punktzahl sichtbar größer und kleiner werden.",
    "Die Zahl springt nicht hart, sondern wächst kurz auf und fällt wieder zurück. Im Gegensatz zu `Glow` steht hier die Größenänderung stärker im Vordergrund als der Lichtschein.",
    "Die Finish-Zahl wird zyklisch vergrößert und wieder auf Normalgröße zurückgeführt. Der Effekt wirkt direkter und körperlicher als `Glow`, ohne das harte Ausblenden von `Blink` zu nutzen."
  ),
  blink: optionCopy(
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
    "Der Effekt folgt bevorzugt dem angezeigten Suggestion-Block. Nur wenn dort nichts Verwertbares steht, entscheidet die reine Score-Prüfung.",
    "Diese Einstellung koppelt die Hervorhebung zuerst an die sichtbare Checkout-Empfehlung und nutzt den Punktestand nur als Fallback. Dadurch folgt der Effekt am ehesten dem, was der Nutzer aktuell als Lösung angezeigt bekommt."
  ),
  "score-only": optionCopy(
    "Lässt ausschließlich den mathematisch finishfähigen Score auslösen.",
    "Der sichtbare Suggestion-Text spielt keine Rolle. Sobald der Restwert nach den Out-Regeln finishbar ist, wird der Effekt gezeigt.",
    "Mit dieser Einstellung entscheidet allein die rechnerische Finishfähigkeit des aktuellen Scores. Sichtbare Checkout-Vorschläge beeinflussen den Effekt nicht mehr."
  ),
  "suggestion-only": optionCopy(
    "Lässt nur einen vorhandenen Checkout-Vorschlag auslösen.",
    "Der Effekt erscheint nur dann, wenn das Modul auch tatsächlich einen Suggestion-Hinweis erkennt. Ein finishbarer Score ohne Vorschlag bleibt ohne Effekt.",
    "Diese Einstellung bindet die Hervorhebung strikt an den sichtbaren Suggestion-Block. Selbst ein rechnerisch finishbarer Wert erzeugt keinen Effekt, solange kein passender Checkout-Vorschlag erkannt wird."
  ),
});

const BOARD_TARGET_EFFECT_OPTION_COPY = deepFreeze({
  pulse: optionCopy(
    "Lässt die markierten Segmente weich auf- und abschwellen.",
    "Die Zielsegmente werden rhythmisch heller und minimal größer. Das wirkt lebendig, ohne hart zu blinken.",
    "Die markierten Felder atmen sichtbar über Helligkeit und leichte Größenänderung. Dadurch bleiben die Checkout-Ziele aufmerksamkeitsstark, aber weicher als bei einem Blinkeffekt."
  ),
  blink: optionCopy(
    "Lässt die markierten Segmente hart zwischen gedimmt und klar sichtbar wechseln.",
    "Die Zielsegmente blinken mit klaren Helligkeitssprüngen. Das ist die direkteste und auffälligste Zielmarkierung.",
    "Diese Variante reduziert die Zwischenstufen und arbeitet mit deutlichen Sichtbarkeitssprüngen. Dadurch springen die relevanten Board-Segmente besonders schnell ins Auge."
  ),
  glow: optionCopy(
    "Lässt die Segmente vor allem über Leuchten und Kontur wirken.",
    "Die Markierung bleibt ruhiger als bei `Blink`, bekommt aber einen stärkeren Lichtschein und sichtbaren Glow um das Zielsegment.",
    "Die Ziele werden primär über Helligkeit, Kontur und einen zusätzlichen Leuchtsaum betont. Das wirkt ruhiger als `Blink`, aber strahlender als `Pulse`."
  ),
});


const BOARD_TARGET_SINGLE_RING_OPTION_COPY = deepFreeze({
  both: optionCopy(
    "Markiert bei Single-Zielen inneren und äußeren Single-Ring zugleich.",
    "Wenn ein Single-Feld Ziel eines Checkouts ist, werden beide Single-Bereiche des Segments hervorgehoben. Das erzeugt die breiteste visuelle Markierung.",
    "Bei Single-Zielen werden sowohl der innere als auch der äußere Single-Ring des betreffenden Segments markiert. Das ist die flächigste und am leichtesten erkennbare Variante."
  ),
  inner: optionCopy(
    "Markiert nur den inneren Single-Ring.",
    "Die Hervorhebung sitzt ausschließlich zwischen Triple- und Bull-Bereich. Der äußere Single-Ring bleibt unbelegt.",
    "Bei Single-Zielen wird nur der innere Single-Ring sichtbar markiert. Dadurch bleibt die Zielmarkierung schmaler und konzentriert sich stärker auf den innenliegenden Bereich des Segments."
  ),
  outer: optionCopy(
    "Markiert nur den äußeren Single-Ring.",
    "Die Hervorhebung liegt ausschließlich im äußeren Single-Bereich zwischen Double-Ring und Triple-Ring. Der innere Bereich bleibt frei.",
    "Diese Einstellung zeichnet bei Single-Zielen nur den äußeren Single-Ring nach. Das ist sinnvoll, wenn du die Markierung näher an der Außenzone des Boards sehen möchtest."
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
});

const BOARD_TARGET_OUTLINE_OPTION_COPY = deepFreeze({
  dezent: optionCopy(
    "Hält die Kontur fein und relativ ruhig.",
    "Die weiße Umrandung bleibt sichtbar, aber schmal und mit zurückhaltender Pulsbewegung. Das Zielsegment bleibt klar, ohne dominant umzuranden.",
    "Diese Stufe nutzt eine eher feine Kontur mit moderatem Leuchtwechsel. Die Zielsegmente bleiben sauber eingerahmt, ohne dass die Outline den eigentlichen Farbfleck überlagert."
  ),
  standard: optionCopy(
    "Nutzen eine ausgewogene Konturbreite und Pulswirkung.",
    "Die Umrandung ist deutlich sichtbar und verändert Breite und Deckkraft gut erkennbar. Das ist die Mittelstufe für die Zielkontur.",
    "Diese Einstellung liefert den vorgesehenen Mittelwert für Konturbreite, Deckkraft und Pulsverlauf. Das Zielsegment bekommt eine klar lesbare, aber noch ausgewogene Umrandung."
  ),
  stark: optionCopy(
    "Macht die Kontur am breitesten und auffälligsten.",
    "Die weiße Umrandung wirkt kräftiger, heller und pulsiert stärker. Das hebt das Zielsegment besonders deutlich aus dem Board heraus.",
    "Diese Stufe verstärkt Breite, Sichtbarkeit und Puls der Zielkontur sichtbar. Die markierten Segmente werden dadurch besonders hart vom restlichen Board abgesetzt."
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

const CHECKOUT_SUGGESTION_STYLE_OPTION_COPY = deepFreeze({
  badge: optionCopy(
    "Zeigt den Vorschlag wie eine markierte Badge-Fläche mit gestricheltem Rahmen.",
    "Der Vorschlag bekommt eine plakative Badge-Optik mit gestrichelter Kontur und weichem Akzent-Hintergrund. Das wirkt wie ein klar abgesetzter Hinweisblock.",
    "Diese Variante legt um den Suggestion-Block eine plakative Badge-Hülle mit gestrichelter Outline und weicher Akzentfläche. Der Hinweis wirkt dadurch wie ein klar eingestempeltes Label im Interface."
  ),
  ribbon: optionCopy(
    "Zeigt den Vorschlag wie ein leuchtendes Ribbon mit schrägem Label.",
    "Die Hülle bekommt einen kräftigen Innenrahmen, Glow und ein leicht schräg sitzendes Label. Das wirkt dynamischer und markanter als `Badge`.",
    "Diese Variante inszeniert den Suggestion-Block wie ein leuchtendes Ribbon oder Banner. Durch Innenrahmen, Glow und leicht gekipptes Label wirkt der Hinweis energischer und auffälliger."
  ),
  stripe: optionCopy(
    "Zeigt den Vorschlag mit sichtbaren Akzentstreifen über der Fläche.",
    "Der Container bekommt eine klare Hülle und darüber ein diagonales Streifenmuster. Dadurch wirkt die Empfehlung technischer und signalartiger.",
    "Diese Variante kombiniert einen akzentfarbenen Rahmen mit diagonalem Streifenmuster in der Fläche. Der Vorschlag wirkt dadurch besonders signalhaft und gut scanbar."
  ),
  ticket: optionCopy(
    "Zeigt den Vorschlag wie ein Ticket mit gestrichelter Trennlinie.",
    "Die Hülle erinnert an einen Ticket- oder Coupon-Look. Die sichtbare gestrichelte Linie teilt den Block optisch wie einen Abrissschein.",
    "Diese Variante formt den Suggestion-Block wie ein Ticket mit eigener Labelzone und gestrichelter Trennlinie. Dadurch wirkt die Empfehlung spielerischer und stärker wie ein separates Element."
  ),
  outline: optionCopy(
    "Zeigt den Vorschlag mit kräftigem Außenrahmen und Akzentpunkt.",
    "Die Empfehlung wird vor allem über einen starken Outline-Rahmen und einen kleinen Akzentpunkt oben rechts hervorgehoben. Das wirkt am saubersten und technischsten.",
    "Diese Variante hält die Fläche selbst relativ ruhig und setzt auf eine kräftige äußere Kontur mit zusätzlichem Akzentpunkt. Der Vorschlag wirkt dadurch klar, präzise und eher technisch als verspielt."
  ),
});

const CHECKOUT_SUGGESTION_LABEL_OPTION_COPY = deepFreeze({
  CHECKOUT: optionCopy(
    "Zeigt oberhalb der Empfehlung das Label `CHECKOUT`.",
    "Über dem gestylten Vorschlagsblock erscheint ein festes `CHECKOUT`-Label. Das wirkt klar technisch und direkt am klassischen Begriff orientiert.",
    "Diese Einstellung setzt oberhalb der Empfehlung ein festes `CHECKOUT`-Label. Dadurch wird der Block sofort als Checkout-Hinweis lesbar, auch wenn man nur kurz auf die Fläche schaut."
  ),
  FINISH: optionCopy(
    "Zeigt oberhalb der Empfehlung das Label `FINISH`.",
    "Der Vorschlag bekommt statt `CHECKOUT` das Wort `FINISH`. Das wirkt kürzer und etwas direkter auf den Abschluss des Legs bezogen.",
    "Mit dieser Option trägt der Suggestion-Block das Label `FINISH` statt `CHECKOUT`. Das wirkt sprachlich etwas kompakter und rückt den erfolgreichen Abschluss stärker in den Vordergrund."
  ),
  "": optionCopy(
    "Blendet das zusätzliche Label komplett aus.",
    "Der gestylte Vorschlagsblock bleibt aktiv, trägt aber keine eigene Label-Kapsel mehr oberhalb des Inhalts. Dadurch wirkt das Element ruhiger und flacher.",
    "Diese Option entfernt die kleine Label-Marke oberhalb des Suggestion-Blocks vollständig. Die farbige Hülle bleibt erhalten, aber der Vorschlag wirkt minimalistischer und weniger plakativ."
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

const TURN_START_DURATION_OPTION_COPY = deepFreeze({
  "300": optionCopy(
    "Lässt den Lichtlauf schnell über die Karte huschen.",
    "Der Sweep zieht zügig durch und markiert den Spielerwechsel nur als kurzen Blitz. Das wirkt direkt und sportlich.",
    "Diese Stufe verkürzt den Sweep auf einen schnellen, klaren Lichtimpuls. Der Turn-Wechsel springt ins Auge, ohne lange auf der Karte stehen zu bleiben."
  ),
  "420": optionCopy(
    "Nutzen die ausgewogene Standardgeschwindigkeit.",
    "Der Lichtlauf bleibt klar sichtbar, ohne träge zu wirken. Das ist die neutrale Mittelstufe für den Spielerwechsel.",
    "Diese Einstellung hält die Balance zwischen schnellem Impuls und gut lesbarer Bewegung. Der Sweep wirkt bewusst gesetzt, aber nicht ausgedehnt."
  ),
  "620": optionCopy(
    "Lässt den Sweep ruhiger und länger über die Karte ziehen.",
    "Der Lichtlauf bleibt länger sichtbar und betont den Wechsel deutlicher. Dadurch wirkt der Übergang weicher und filmischer.",
    "Diese Stufe verlängert den Sweep sichtbar und macht den Spielerwechsel stärker zum kleinen Übergangseffekt. Die Karte bleibt dadurch länger in einer hellen Bewegung markiert."
  ),
});

const TURN_START_STYLE_OPTION_COPY = deepFreeze({
  subtle: optionCopy(
    "Zeigt eine schmale und eher sanfte Lichtbahn.",
    "Der Sweep bleibt vergleichsweise schmal und hellt die Karte nur moderat auf. Das wirkt zurückhaltend und sauber.",
    "Diese Variante hält Breite und Helligkeit des Sweeps bewusst niedrig. Der Spielerwechsel bleibt sichtbar, wirkt aber nicht wie ein dominanter Effektstreifen."
  ),
  standard: optionCopy(
    "Nutzen die ausgewogene Standardbreite und Helligkeit.",
    "Die Lichtbahn ist klar sichtbar, ohne die Karte komplett zu überstrahlen. Das ist die neutrale Mittelstufe.",
    "Diese Einstellung liefert den vorgesehenen Mittelwert für Breite und Helligkeit des Sweeps. Der Wechsel ist gut sichtbar, ohne die Karte optisch zu dominieren."
  ),
  strong: optionCopy(
    "Zeigt eine breite, helle Lichtbahn über der Karte.",
    "Der Sweep zieht breiter und sichtbarer über die aktive Karte. Dadurch springt der Spielerwechsel am stärksten ins Auge.",
    "Diese Variante verbreitert und verstärkt den Lichtlauf deutlich. Der aktive Kartenwechsel wird dadurch sehr plakativ markiert und ist auch in schnellen Matches kaum zu übersehen."
  ),
});

const TRIPLE_DOUBLE_BULL_COLOR_THEME_OPTION_COPY = deepFreeze({
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

const TRIPLE_DOUBLE_BULL_ANIMATION_STYLE_OPTION_COPY = deepFreeze({
  "impact-pop": optionCopy(
    "Slam Punch spielt einen kurzen, druckvollen Front-Punch mit klarer Zahlenspitze.",
    "Das frisch erkannte Trefferfeld drückt sichtbar nach vorn, die Zahl overshootet kurz und alles fällt sauber zurück. Das ist ein starker One-Shot-Burst ohne Dauerloop.",
    "Slam Punch ist der direkte Standard-Impact: kurzer Vorwärtsschub, klarer Zahlen-Burst und sofortige Rückkehr in den Ruhezustand."
  ),
  shockwave: optionCopy(
    "Shock Ring schickt eine deutliche Druckwelle durch Rand, Feld und Zahl.",
    "Der Rand expandiert sichtbar, der Score öffnet sich stärker und das Feld wirkt wie von einer Ringwelle getroffen. Das bleibt ein plakativ lesbarer One-Shot-Burst.",
    "Shock Ring inszeniert den Treffer wie eine kurze Druckwelle mit stärkerem Ringimpuls und sichtbarem Textschub."
  ),
  "sweep-shine": optionCopy(
    "Laser Sweep zieht einen harten Lichtzug quer über Feld, Rand und Text.",
    "Der Burst fühlt sich wie ein schneller TV- oder Sci-Fi-Sweep an: Lichtzug über Verlauf und Text, klar sichtbar und mit deutlicherer Seitenbewegung. Das bleibt ein One-Shot-Burst.",
    "Laser Sweep setzt auf einen schnellen Lichtlauf über Verlauf, Rand und Text. Dadurch wirkt der Treffer wie ein kurzer Live-Broadcast- oder HUD-Wipe."
  ),
  "electric-arc": optionCopy(
    "Electric Arc schießt einen kurzen, zackigen Stromimpuls über Trefferfeld und Score.",
    "Der Treffer springt in kurzen Seitenzucken mit hellem Spannungspeak an, bevor er sauber zurückfällt. Das wirkt wie ein elektrischer Burst ohne dauerhaften Idle-Loop.",
    "Electric Arc kombiniert einen kompakten Stromstoß mit leichtem Seitenshake auf Feld, Score und Segment. Die Wirkung ist aggressiv und kurz, bleibt aber klar als einmaliger Burst."
  ),
  "neon-pulse": optionCopy(
    "Reactor Pulse lässt den Treffer hell aufglühen und danach neonartig weiteratmen.",
    "Der Hit-Burst ist hell und energisch, danach bleibt auf markierten Feldern ein ruhiger Glow-Loop aktiv. Das ist Burst plus subtiler Idle-Loop mit klarer Cyberpunk-Anmutung.",
    "Reactor Pulse kombiniert einen deutlichen Neon-Burst mit einem sanften Weiteratmen von Verlauf, Glow und Zahl. Das markierte Feld bleibt also auch nach dem Burst leicht lebendig."
  ),
  "snap-bounce": optionCopy(
    "Turbo Bounce spielt einen knackigen Lift mit sichtbarem Rückfeder-Effekt.",
    "Das Trefferfeld hebt sichtbar ab, federt präzise zurück und gibt der Zahl einen sportlichen Kick. Das bleibt ein One-Shot-Burst mit mehr Vertical-Motion.",
    "Turbo Bounce kombiniert einen schnellen Lift mit kurzem Nachfedern. Dadurch wirkt der Treffer rhythmisch und sportlich, ohne im Leerlauf weiterzubewegen."
  ),
  "card-slam": optionCopy(
    "Card Hammer setzt das Wurffeld wie einen harten Einschlag mit vertikalem 360-Flip in Szene.",
    "Das Feld knallt nicht nur in die Fläche, sondern kippt auf der X-Achse durch einen deutlichen Flip. Die Zahl schiebt nach, das Segment folgt verzögert. Das bleibt ein One-Shot-Burst mit viel Impact.",
    "Card Hammer behandelt das Trefferfeld wie eine kleine Broadcast-Karte, die kurz hart einschlägt und per vertikalem Flip wieder einrastet."
  ),
  "signal-blink": optionCopy(
    "Glitch Blink setzt einen digitalen Signal-Blitz mit Zahlenzittern und kurzem HUD-Fehlerbild.",
    "Der Treffer blinkt bewusst digital, die Zahl wackelt seitlich und das Feld bekommt kurze Signalstörungen. Das ist ein kompakter One-Shot-Burst für einen deutlich technoideren Look.",
    "Glitch Blink nutzt kurze Blinkwechsel, seitliches Zahlenshake und digitales Jittern. Der Treffer wirkt damit wie ein Signalimpuls statt wie ein klassischer Pop."
  ),
  "stagger-wave": optionCopy(
    "Cascade Split schickt eine gestaffelte Welle durch Feld, Zahl und Segment.",
    "Der Burst läuft nicht komplett gleichzeitig, sondern kippt gestaffelt durch die Inhalte. Das wirkt lebendig, etwas größer und bleibt ein One-Shot-Burst.",
    "Cascade Split gibt dem Treffer eine kurze, versetzte Wellenbewegung. Zahl und Segment reagieren leicht nacheinander und erzeugen so einen dynamischeren Burst."
  ),
  "flip-edge": optionCopy(
    "Rotor Flip dreht das Trefferfeld sichtbar per horizontalem 360-Spin in den Raum.",
    "Das Wurffeld dreht deutlich auf der Y-Achse, fängt sich wieder und verleiht dem Burst eine echte Raumwirkung. Das bleibt ein One-Shot-Burst mit klar erkennbarem Spin.",
    "Rotor Flip ergänzt den Treffer um einen horizontalen 360-Spin und eine nachlaufende Textbewegung. Dadurch wirkt der Hit räumlicher und auffälliger als ein reiner Scale-Pop."
  ),
  "outline-trace": optionCopy(
    "Edge Runner zeichnet die Kontur sichtbar nach und lässt sie danach technisch weiterlaufen.",
    "Der Burst betont die Kante sichtbar, danach bleibt ein ruhiger Rand-Loop aktiv. Das ist Burst plus subtiler Idle-Loop für einen grafischeren HUD-Look.",
    "Edge Runner startet mit einer sichtbaren Konturverfolgung und behält danach ein leicht laufendes Randlicht auf markierten Feldern. So bleibt der Treffer technisch und präzise präsent."
  ),
  "charge-release": optionCopy(
    "Charge Burst lädt das Feld sichtbar auf und entlädt den Treffer mit großem Zahlenkick.",
    "Vor dem Peak baut das Trefferfeld Spannung auf, dann entlädt sich Verlauf, Rand und Score gemeinsam mit deutlich größerem Punch. Danach bleibt ein subtiler Lade-Loop aktiv. Das ist Burst plus Idle-Loop.",
    "Charge Burst kombiniert einen deutlichen Auflade-Moment mit einer hellen Entladung und lässt markierte Felder anschließend leicht weiteratmen. Das ist der dramatischste Preset im Paket."
  ),
  "alternate-flick": optionCopy(
    "Beacon Flicker kombiniert einen kurzen Seiten-Flick mit späterem Signal-Flackern.",
    "Der Burst wirft das Feld kurz seitlich an und lässt danach ein diskretes Beacon-Flackern auf markierten Feldern zurück. Das ist Burst plus Idle-Loop mit mehr Richtungsgefühl.",
    "Beacon Flicker mischt einen kurzen Richtungs-Flick im Burst mit einem dezenten Beacon-Effekt im Idle. Das Feld bleibt damit leicht lebendig, ohne permanent chaotisch zu werden."
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
    "Diese Stufe kombiniert eine graue Dämpfung mit sichtbarer Schraffur. Irrelevante Felder wirken dadurch klarer als passive Zone gekennzeichnet als bei `Smoke`."
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
  glow: optionCopy(
    "Lässt Marker weich glühen.",
    "Die Marker bekommen einen Lichtschein, der Breite und Helligkeit sichtbar an- und abschwellen lässt. Das wirkt ruhiger als `Pulse`.",
    "Diese Variante verstärkt die Marker primär über einen an- und abschwellenden Glow. Der Trefferpunkt bleibt stabil, wirkt aber über den Lichtschein dauerhaft präsenter."
  ),
  pulse: optionCopy(
    "Lässt Marker rhythmisch größer und kleiner werden.",
    "Die Marker skalieren sichtbar auf und ab. Das wirkt lebendiger und bewegter als der reine Glow-Effekt.",
    "Diese Variante lässt die Marker zyklisch wachsen und wieder zurückfallen. Dadurch bekommen Treffer eine deutlichere Bewegungswirkung als beim reinen Leuchten."
  ),
  none: optionCopy(
    "Zeigt nur die statische Marker-Betonung ohne Zusatzanimation.",
    "Farbe, Größe und Outline bleiben aktiv, aber der Marker bewegt sich nicht. Das ist die ruhigste Darstellung.",
    "Mit dieser Einstellung bleibt nur die statische Hervorhebung aus Farbe, Größe und optionaler Outline erhalten. Der Treffer wirkt klarer, aber ohne jede Zusatzbewegung."
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
    "Zeigt keine zusätzliche Outline.",
    "Die Marker werden nur über Farbe, Größe und optionalen Effekt betont. Ein Rand zur zusätzlichen Abgrenzung bleibt aus.",
    "Mit dieser Option bleibt die Markerbetonung auf Farbe, Größe und Animation beschränkt. Es wird keine zusätzliche Kontur zur Trennung vom Hintergrund gesetzt."
  ),
  weiss: optionCopy(
    "Setzt einen hellen weißen Rand um die Marker.",
    "Die Marker heben sich besser gegen dunkle oder kräftig gefärbte Segmentflächen ab. Das wirkt klar und sauber.",
    "Diese Variante ergänzt eine weiße Outline um den Marker. Dadurch bleibt der Treffer auch auf dunklen oder farbstarken Hintergründen besser abgegrenzt."
  ),
  schwarz: optionCopy(
    "Setzt einen dunklen schwarzen Rand um die Marker.",
    "Die Marker gewinnen besonders auf helleren Bereichen mehr Kontur. Das wirkt etwas härter als die weiße Outline.",
    "Diese Option ergänzt eine schwarze Kontur und verbessert die Trennung auf helleren oder stark leuchtenden Segmentflächen. Der Marker bekommt dadurch einen härteren, grafischeren Rand."
  ),
});

const DART_DESIGN_OPTION_COPY = deepFreeze({
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

const DART_IMAGE_SIZE_OPTION_COPY = deepFreeze({
  "90": optionCopy(
    "Zeigt die Dart-Grafik etwas kleiner als den Standard.",
    "Der eingeblendete Dart bleibt kompakter und lässt mehr Segmentfläche frei. Das wirkt aufgeräumter und weniger dominant.",
    "Diese Stufe reduziert die Dart-Grafik leicht unter die Standardgröße. Das Segment bleibt besser sichtbar, während der Dart weiterhin klar als Ersatzmarker erkennbar bleibt."
  ),
  "100": optionCopy(
    "Nutzen die ausgewogene Standardgröße.",
    "Der Dart entspricht der vorgesehenen Grundgröße des Moduls. Das ist der Mittelweg zwischen Präsenz und freier Segmentfläche.",
    "Diese Einstellung verwendet die reguläre Grundgröße für den Dart-Marker. Der Dart ist klar sichtbar, ohne den Trefferbereich unnötig stark zu füllen."
  ),
  "115": optionCopy(
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
    "Arbeitet nur mit Live-Änderungen ohne zusätzlichen Fallback.",
    "Das Modul verlässt sich ausschließlich auf erkannte DOM- und State-Updates. Das ist schlank und direkt, setzt aber saubere Trigger voraus.",
    "Mit dieser Einstellung läuft der Single-Bull-Sound rein eventbasiert und ohne zusätzlichen Polling-Scan. Das ist ressourcenschonend, reagiert aber nur dann robust, wenn die Live-Signale zuverlässig eintreffen."
  ),
  "1200": optionCopy(
    "Ergänzt alle 1200 ms einen Fallback-Scan.",
    "Zusätzlich zu Live-Triggern prüft das Modul regelmäßig nach. Das macht die Treffererkennung robuster, wenn Live-Änderungen einmal ausbleiben.",
    "Diese Option ergänzt die normale Live-Reaktion um einen 1200-ms-Fallback-Scan. Dadurch können Single-Bull-Treffer auch in schwierigeren DOM-Situationen zuverlässiger erkannt und nachträglich hörbar gemacht werden."
  ),
});

const TURN_POINTS_DURATION_OPTION_COPY = deepFreeze({
  "260": optionCopy(
    "Zählt die Punkte recht schnell zum Endwert hoch oder herunter.",
    "Der Zahlenlauf ist klar sichtbar, aber zügig vorbei. Das wirkt direkt und sportlich.",
    "Diese Stufe verkürzt die Zählanimation deutlich. Punktänderungen bleiben nachvollziehbar, ohne lange als Bewegung auf der Anzeige stehen zu bleiben."
  ),
  "416": optionCopy(
    "Nutzen die ausgewogene Standarddauer.",
    "Die Wertänderung bleibt gut lesbar animiert, ohne träge zu werden. Das ist die neutrale Mittelstufe.",
    "Diese Einstellung hält die Balance zwischen schneller Aktualisierung und sichtbarer Zählbewegung. Der Punktewechsel bleibt klar nachvollziehbar und wirkt dennoch zügig."
  ),
  "650": optionCopy(
    "Lässt den Zählvorgang deutlich länger sichtbar laufen.",
    "Die Zahl bewegt sich ruhiger und länger bis zum Endwert. Das macht den Wechsel besonders nachvollziehbar, aber weniger direkt.",
    "Diese Stufe verlängert die Hoch- oder Runterzählung merklich. Dadurch wird die Wertänderung sehr gut sichtbar, wirkt aber deutlich weniger sofortig als die kurzen Varianten."
  ),
});

const TURN_POINTS_FLASH_MODE_OPTION_COPY = deepFreeze({
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

const X01_SCORE_PROGRESS_COLOR_OPTION_COPY = deepFreeze({
  "checkout-focus": optionCopy(
    "Standardmodus mit Fokus auf Checkout-Relevanz.",
    "Färbt den Balken abhängig vom Restscore mit Fokus auf den Bereich bis `170` und steigert die visuelle Dringlichkeit in Checkout-Nähe.",
    "Dynamischer Standardmodus mit Checkout-Fokus."
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

const X01_SCORE_PROGRESS_SIZE_OPTION_COPY = deepFreeze({
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

const X01_SCORE_PROGRESS_EFFECT_OPTION_COPY = deepFreeze({
  "pulse-core": optionCopy(
    "Lässt den aktiven Balkenkern kräftig atmen.",
    "Der Balken pulsiert mit einer klar sichtbaren inneren Kernbewegung und bleibt dadurch dauerhaft präsent.",
    "Deutlicher Kern-Puls auf dem aktiven Balken."
  ),
  "glass-charge": optionCopy(
    "Schickt eine breite, gläserne Ladung durch den Balken.",
    "Eine helle, glatte Spiegelung läuft durch den aktiven Balken und erzeugt eine sichtbar aufgeladene Glasschicht.",
    "Gläserner Ladeeffekt mit breiter Lichtkante."
  ),
  "segment-drain": optionCopy(
    "Unterteilt den Balken in markante Segmente.",
    "Der aktive Balken wirkt sichtbar segmentiert und verliert seine Energie in klaren, technischen Abschnitten statt als glatte Fläche.",
    "Segmentierte Drain-Optik mit klaren Abschnitten."
  ),
  "ghost-trail": optionCopy(
    "Lässt die alte Balkenlänge als Nachbild stehen.",
    "Bei Scoreänderungen bleibt kurz eine halbtransparente Spur der vorherigen Länge sichtbar und läuft dann in den neuen Stand aus.",
    "Nachziehender Ghost-Trail beim Scorewechsel."
  ),
  "signal-sweep": optionCopy(
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

const WINNER_STYLE_OPTION_COPY = deepFreeze({
  realistic: optionCopy(
    "Startet einen ausgewogenen Mix aus zentralen und seitlichen Feuerwerksstößen.",
    "Der Effekt kombiniert einen kräftigen Hauptstoß aus der Mitte mit kleineren Seitenbursts. Das wirkt am ehesten wie ein klassisches Feier-Feuerwerk.",
    "Diese Variante mischt einen zentralen Hauptausbruch mit ergänzenden seitlichen Bursts. Dadurch entsteht die ausgewogenste, klassischste Feuerwerkswirkung des Moduls."
  ),
  fireworks: optionCopy(
    "Erzeugt wiederholte Explosionen weiter oben im Bild.",
    "Die Partikel starten an wechselnden Positionen im oberen Bildschirmbereich und streuen breit auseinander. Das wirkt am ehesten wie echte Himmelsfeuerwerke.",
    "Diese Variante setzt auf wiederholte, breit streuende Explosionen im oberen Bereich des Bildes. Der Effekt erinnert am stärksten an klassisches Feuerwerk am Himmel."
  ),
  cannon: optionCopy(
    "Schießt eine dichte Partikelkanone aus der unteren Mitte.",
    "Die Partikel kommen gebündelt und kraftvoll aus dem unteren Zentrum. Das wirkt wie ein konzentrierter Konfetti- oder Feuerwerksstoß nach vorn.",
    "Diese Einstellung bündelt den Effekt in einer dichten Kanonen-Salve aus der unteren Bildmitte. Der Ausbruch wirkt kompakt, kräftig und sehr direkt."
  ),
  victorystorm: optionCopy(
    "Kombiniert Mitte und Seiten zu einem breiteren Siegessturm.",
    "Mehrere Bursts aus Mitte, links und rechts bauen ein großes, raumgreifendes Effektbild auf. Das wirkt besonders festlich und voll.",
    "Diese Variante verbindet zentrale und seitliche Ausbrüche zu einem breiten Effektteppich. Dadurch entsteht der vollste und raumgreifendste Feiermoment unter den Mehrfachmustern."
  ),
  stars: optionCopy(
    "Erzeugt sternförmige Partikel mit ruhigerem Fall.",
    "Statt normaler Konfetti-Partikel werden Sterne verwendet, die ruhiger und dekorativer durch das Bild laufen. Das wirkt verspielter als die anderen Stile.",
    "Diese Einstellung ersetzt die Standardpartikel durch Sternformen und lässt sie mit ruhigerer Bewegung durchs Bild laufen. Der Effekt wirkt dadurch dekorativer und weniger wie klassisches Konfetti."
  ),
  sides: optionCopy(
    "Schießt kleine Bursts abwechselnd von links und rechts ins Bild.",
    "Die Partikel kommen seitlich herein und rahmen den Bildschirm eher ein, statt ihn von der Mitte aus zu füllen. Das wirkt schnell und randbetont.",
    "Diese Variante setzt auf kurze Seitenschüsse von links und rechts. Der Effekt rahmt das Bild stärker ein und wirkt dynamischer, aber weniger flächig als zentrale Bursts."
  ),
});

const WINNER_COLOR_OPTION_COPY = deepFreeze({
  autodarts: optionCopy(
    "Nutzen eine blau-weiße Palette im Stil des Autodarts-Looks.",
    "Der Effekt arbeitet mit mehreren Blauabstufungen und Weiß. Das wirkt kühl, sauber und markennah.",
    "Diese Palette nutzt Blau- und Weißtöne und bleibt damit am nächsten am bestehenden Autodarts-Charakter. Der Effekt wirkt kühl, klar und relativ technisch."
  ),
  redwhite: optionCopy(
    "Nutzen Weiß mit hellen bis dunklen Rottönen.",
    "Die Partikel wechseln zwischen Weiß, hellem Rot und dunkleren Rotabstufungen. Das wirkt klassisch, festlich und deutlich wärmer als `Autodarts`.",
    "Diese Palette kombiniert Weiß mit mehreren roten Tönen. Dadurch entsteht ein klassischer, festlicher Look, der deutlich wärmer und emotionaler wirkt als die blauen Standardfarben."
  ),
  ice: optionCopy(
    "Nutzen eisige Weiß- und Blautöne.",
    "Der Effekt läuft von Weiß über helles Eisblau bis zu kräftigem Blau. Das wirkt kühl, sauber und fast frostig.",
    "Diese Palette setzt auf weiße und eisblaue Farbwerte bis in kräftige Blautöne. Der Effekt wirkt dadurch kühl, klar und fast gläsern."
  ),
  sunset: optionCopy(
    "Nutzen warme Orange-, Pink- und Violetttöne.",
    "Die Farbpalette erinnert an einen Sonnenuntergang mit warmen und violett auslaufenden Tönen. Das wirkt farbig und lebendig.",
    "Diese Farbpalette mischt Weiß mit warmem Orange, Pink und Violett. Dadurch bekommt der Effekt eine deutlich stimmungsvollere, buntere Sunset-Wirkung."
  ),
  neon: optionCopy(
    "Nutzen knallige Neonfarben mit sehr hoher Signalwirkung.",
    "Die Partikel leuchten in hellen, künstlich wirkenden Neonfarben. Das ist die bunteste und auffälligste Farbpalette.",
    "Diese Palette kombiniert mehrere sehr helle Neonfarben und erzeugt damit den grellsten, modernsten Look. Der Effekt wirkt stark künstlich, bunt und maximal aufmerksamkeitsstark."
  ),
  gold: optionCopy(
    "Nutzen Weiß mit Gold- und Bernsteintönen.",
    "Die Partikel wirken wie goldenes Feuerwerk oder Goldregen. Das ist die klassisch festliche Premium-Variante.",
    "Diese Variante färbt den Effekt in Weiß, Gold und warme Bernsteintöne. Dadurch entsteht eine klassische Feierwirkung, die besonders edel und festlich wirkt."
  ),
});

const WINNER_INTENSITY_OPTION_COPY = deepFreeze({
  dezent: optionCopy(
    "Hält Partikelmenge und Energie bewusst ruhiger.",
    "Es entstehen weniger Partikel, die etwas gemächlicher und mit längeren Abständen ausgelöst werden. Der Effekt bleibt sichtbar, ohne den Bildschirm zu fluten.",
    "Diese Stufe reduziert Partikelzahl, Geschwindigkeit und Auslösefrequenz. Das Feuerwerk wirkt dadurch ruhiger, luftiger und weniger bildfüllend."
  ),
  standard: optionCopy(
    "Nutzen die ausgewogene Standardintensität.",
    "Partikelmenge, Auslösefrequenz und Bewegungsenergie bleiben in Balance. Das ist die neutrale Mittelstufe des Effekts.",
    "Diese Einstellung liefert den vorgesehenen Mittelwert für Partikelzahl, Auslöseintervall und Bewegungsenergie. Der Effekt bleibt klar festlich, ohne zu übersteuern."
  ),
  stark: optionCopy(
    "Erhöht Dichte, Taktung und Bewegungsenergie sichtbar.",
    "Mehr Partikel werden schneller und lebhafter ausgelöst. Dadurch wirkt das Feuerwerk voller, dichter und energischer.",
    "Diese Stufe steigert Partikelzahl, Auslösefrequenz und Bewegungsenergie spürbar. Der Effekt füllt den Bildschirm stärker und wirkt deutlich druckvoller als die anderen Varianten."
  ),
});

const xconfigFieldOptionCopy = deepFreeze({
  "theme-x01": {
    backgroundDisplayMode: THEME_BACKGROUND_DISPLAY_OPTION_COPY,
    backgroundOpacity: THEME_BACKGROUND_OPACITY_OPTION_COPY,
    playerFieldTransparency: THEME_PLAYER_TRANSPARENCY_OPTION_COPY,
  },
  "theme-shanghai": {
    backgroundDisplayMode: THEME_BACKGROUND_DISPLAY_OPTION_COPY,
    backgroundOpacity: THEME_BACKGROUND_OPACITY_OPTION_COPY,
    playerFieldTransparency: THEME_PLAYER_TRANSPARENCY_OPTION_COPY,
  },
  "theme-bermuda": {
    backgroundDisplayMode: THEME_BACKGROUND_DISPLAY_OPTION_COPY,
    backgroundOpacity: THEME_BACKGROUND_OPACITY_OPTION_COPY,
    playerFieldTransparency: THEME_PLAYER_TRANSPARENCY_OPTION_COPY,
  },
  "theme-cricket": {
    backgroundDisplayMode: THEME_BACKGROUND_DISPLAY_OPTION_COPY,
    backgroundOpacity: THEME_BACKGROUND_OPACITY_OPTION_COPY,
    playerFieldTransparency: THEME_PLAYER_TRANSPARENCY_OPTION_COPY,
  },
  "theme-bull-off": {
    contrastPreset: BULL_OFF_CONTRAST_PRESET_OPTION_COPY,
    backgroundDisplayMode: THEME_BACKGROUND_DISPLAY_OPTION_COPY,
    backgroundOpacity: THEME_BACKGROUND_OPACITY_OPTION_COPY,
    playerFieldTransparency: THEME_PLAYER_TRANSPARENCY_OPTION_COPY,
  },
  "checkout-score-pulse": {
    effect: CHECKOUT_SCORE_EFFECT_OPTION_COPY,
    colorTheme: CHECKOUT_SCORE_COLOR_OPTION_COPY,
    intensity: CHECKOUT_SCORE_INTENSITY_OPTION_COPY,
    triggerSource: CHECKOUT_SCORE_TRIGGER_OPTION_COPY,
  },
  "x01-score-progress": {
    colorTheme: X01_SCORE_PROGRESS_COLOR_OPTION_COPY,
    barSize: X01_SCORE_PROGRESS_SIZE_OPTION_COPY,
    effect: X01_SCORE_PROGRESS_EFFECT_OPTION_COPY,
  },
  "checkout-board-targets": {
    effect: BOARD_TARGET_EFFECT_OPTION_COPY,
    singleRing: BOARD_TARGET_SINGLE_RING_OPTION_COPY,
    colorTheme: BOARD_TARGET_COLOR_OPTION_COPY,
    outlineIntensity: BOARD_TARGET_OUTLINE_OPTION_COPY,
  },
  "tv-board-zoom": {
    zoomLevel: TV_BOARD_ZOOM_LEVEL_OPTION_COPY,
    zoomSpeed: TV_BOARD_ZOOM_SPEED_OPTION_COPY,
  },
  "style-checkout-suggestions": {
    style: CHECKOUT_SUGGESTION_STYLE_OPTION_COPY,
    labelText: CHECKOUT_SUGGESTION_LABEL_OPTION_COPY,
    colorTheme: CHECKOUT_SUGGESTION_COLOR_OPTION_COPY,
  },
  "average-trend-arrow": {
    durationMs: AVG_TREND_DURATION_OPTION_COPY,
    size: AVG_TREND_SIZE_OPTION_COPY,
  },
  "turn-start-sweep": {
    durationMs: TURN_START_DURATION_OPTION_COPY,
    sweepStyle: TURN_START_STYLE_OPTION_COPY,
  },
  "triple-double-bull-hits": {
    colorTheme: TRIPLE_DOUBLE_BULL_COLOR_THEME_OPTION_COPY,
    animationStyle: TRIPLE_DOUBLE_BULL_ANIMATION_STYLE_OPTION_COPY,
  },
  "cricket-highlighter": {
    irrelevantBoardDimStyle: CRICKET_DIM_STYLE_OPTION_COPY,
    colorTheme: CRICKET_BOARD_COLOR_OPTION_COPY,
    intensity: CRICKET_BOARD_INTENSITY_OPTION_COPY,
  },
  "cricket-grid-fx": {
    colorTheme: CRICKET_GRID_COLOR_OPTION_COPY,
    intensity: CRICKET_GRID_INTENSITY_OPTION_COPY,
  },
  "dart-marker-emphasis": {
    size: DART_MARKER_SIZE_OPTION_COPY,
    color: DART_MARKER_COLOR_OPTION_COPY,
    effect: DART_MARKER_EFFECT_OPTION_COPY,
    opacityPercent: DART_MARKER_OPACITY_OPTION_COPY,
    outline: DART_MARKER_OUTLINE_OPTION_COPY,
  },
  "dart-marker-darts": {
    design: DART_DESIGN_OPTION_COPY,
    sizePercent: DART_IMAGE_SIZE_OPTION_COPY,
    flightSpeed: DART_FLIGHT_SPEED_OPTION_COPY,
  },
  "remove-darts-notification": {
    imageSize: REMOVE_DARTS_IMAGE_SIZE_OPTION_COPY,
    pulseScale: REMOVE_DARTS_PULSE_OPTION_COPY,
  },
  "single-bull-sound": {
    volume: SINGLE_BULL_VOLUME_OPTION_COPY,
    cooldownMs: SINGLE_BULL_COOLDOWN_OPTION_COPY,
    pollIntervalMs: LIVE_OR_1200_POLL_OPTION_COPY,
  },
  "turn-points-count": {
    durationMs: TURN_POINTS_DURATION_OPTION_COPY,
    flashMode: TURN_POINTS_FLASH_MODE_OPTION_COPY,
  },
  "winner-fireworks": {
    style: WINNER_STYLE_OPTION_COPY,
    colorTheme: WINNER_COLOR_OPTION_COPY,
    intensity: WINNER_INTENSITY_OPTION_COPY,
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

function appendFieldWithOptions(lines, field, description, optionDescriptionKey) {
  const text = String(description || "").trim();
  if (!text) {
    return;
  }

  lines.push(`- \`${field.label}\`: ${text}`);
  if (field.control !== "select" || !Array.isArray(field.options) || !field.options.length) {
    return;
  }

  field.options.forEach((option) => {
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

  const lines = [
    `<a id="${descriptor.readmeAnchor}"></a>`,
    "",
    `### ${definition.title}`,
    "",
    `- Gilt für: ${formatVariantLabel(definition.variants)}`,
    `- Was macht es sichtbar? ${copy.visibleDescription}`,
    `- Grafisch: ${copy.visualDescription}`,
    `- Wann sinnvoll? ${copy.usefulWhen}`,
    "",
  ];

  const readmeDetails = Array.isArray(copy.readmeDetails)
    ? copy.readmeDetails.map((entry) => String(entry || "").trim()).filter(Boolean)
    : [];
  if (readmeDetails.length) {
    const readmeDetailHeading = String(copy.readmeDetailHeading || "").trim();
    if (readmeDetailHeading) {
      lines.push(`**${readmeDetailHeading}**`, "");
    }
    readmeDetails.forEach((entry) => {
      lines.push(`- ${entry}`);
    });
    lines.push("");
  }

  lines.push("**Einstellungen einfach erklärt**", "");

  (descriptor.fields || []).forEach((field) => {
    const docsDescription = String(field.docsDescription || "").trim();
    appendFieldWithOptions(lines, field, docsDescription, "docsDescription");
    appendRawLines(lines, getFieldAppendixLines(copy, field.key, "readme"));
  });

  if (Array.isArray(copy.images) && copy.images.length) {
    lines.push("");
    copy.images.forEach((entry) => {
      lines.push(`![${entry.alt}](docs/screenshots/${entry.fileName})`);
    });
  }

  return `${lines.join("\n")}\n`;
}

export function buildFeaturesDocSection(descriptor, definition) {
  const featureKey = String(descriptor?.featureKey || definition?.featureKey || "").trim();
  const copy = getXConfigFeatureCopy(featureKey);
  if (!descriptor || !definition || !copy) {
    return "";
  }

  const lines = [
    `### ${definition.title}`,
    "",
    `- Gilt für: ${formatVariantLabel(definition.variants)}`,
    `- Kurz: ${copy.visibleDescription}`,
    `- Grafisch: ${copy.visualDescription}`,
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
