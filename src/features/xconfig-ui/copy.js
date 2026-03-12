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

function image(alt, fileName) {
  return deepFreeze({
    alt: String(alt || "").trim(),
    fileName: String(fileName || "").trim(),
  });
}

function featureCopy(copy) {
  return deepFreeze(copy);
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
      targetScope: fieldCopy(
        "Zeigt nur das erste Ziel oder alle sinnvollen Ziele der aktuellen Lösung an.",
        "Bestimmt, wie viele Board-Ziele gleichzeitig hervorgehoben werden. `Erstes Ziel` fokussiert den nächsten Wurf, `Alle Ziele` zeigt die komplette aktuell sinnvolle Checkout-Kette, soweit das Modul sie am Board abbildet.",
        "Legt fest, ob nur das erste oder alle aktuellen Ziele markiert werden."
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
      "Zoomt in X01 bei klaren Zielmomenten TV-artig auf das Board.",
    visibleDescription:
      "Bei klaren X01-Zielsituationen zoomt die Ansicht kurz auf relevante Board-Bereiche.",
    visualDescription:
      "Das Board wird temporär vergrößert, damit relevante Segmente mehr Platz bekommen. Die Kamera springt nicht hart, sondern fährt mit einer kurzen Ein- und Ausblendung hinein und zurück.",
    usefulWhen:
      "Wenn du beim dritten Dart oder bei klaren Finishes mehr Fokus auf den Zielbereich möchtest.",
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
        "Aktiviert oder deaktiviert den Zoom auf eindeutige Ein-Dart-Checkout-Situationen in den ersten beiden Würfen. Andere Zoom-Fälle, etwa der spezielle `T20`-Setup-Fokus nach zwei `T20`, werden dadurch nicht grundsätzlich abgeschaltet.",
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
      "Hebt Triple-, Double- und Bull-Treffer in der Wurfliste gezielt hervor.",
    visibleDescription:
      "Treffer wie `T20`, `D16` oder `BULL` springen in der Wurfliste schneller ins Auge.",
    visualDescription:
      "Die betroffenen Einträge in der Wurfliste erhalten eine zusätzliche Hervorhebung, sobald das Modul sie erkennt. So lassen sich starke Treffer in schnellen Legs leichter nachverfolgen.",
    usefulWhen:
      "Für Training, Checkout-Fokus und mehr Lesbarkeit in schnellen Legs.",
    images: [image("Triple Double Bull Hits", "animation-triple-double-bull-hits.gif")],
    fields: {
      highlightTriple: fieldCopy(
        "Schaltet die Hervorhebung für Triple-Treffer ein oder aus.",
        "Bestimmt, ob Einträge wie `T20` oder andere Triple-Treffer in der Wurfliste gesondert hervorgehoben werden.",
        "Schaltet die Hervorhebung für Triple-Treffer ein oder aus."
      ),
      highlightDouble: fieldCopy(
        "Schaltet die Hervorhebung für Double-Treffer ein oder aus.",
        "Bestimmt, ob Double-Einträge wie `D16` oder `D20` in der Wurfliste gesondert hervorgehoben werden.",
        "Schaltet die Hervorhebung für Double-Treffer ein oder aus."
      ),
      highlightBull: fieldCopy(
        "Schaltet die Hervorhebung für Bull-Treffer ein oder aus.",
        "Bestimmt, ob `BULL`-Treffer in der Wurfliste zusätzlich markiert werden.",
        "Schaltet die Hervorhebung für Bull-Treffer ein oder aus."
      ),
      pollIntervalMs: fieldCopy(
        "Wechselt zwischen reiner Live-Reaktion und einem robusteren Fallback-Scan.",
        "`Nur live` reagiert ausschließlich auf erkannte DOM- und State-Updates. `Kompatibel` ergänzt dazu einen Polling-Fallback alle 3000 ms, falls der Live-Trigger in bestimmten Umgebungen nicht zuverlässig genug feuert.",
        "Wechselt zwischen reiner Live-Reaktion und zusätzlichem 3-Sekunden-Fallback."
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
    "**Einstellungen einfach erklärt**",
    "",
  ];

  (descriptor.fields || []).forEach((field) => {
    const docsDescription = String(field.docsDescription || "").trim();
    if (!docsDescription) {
      return;
    }
    lines.push(`- \`${field.label}\`: ${docsDescription}`);
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

  (descriptor.fields || []).forEach((field) => {
    const featuresDescription = String(field.featuresDescription || field.docsDescription || "").trim();
    if (!featuresDescription) {
      return;
    }
    lines.push(`- \`${field.label}\`: ${featuresDescription}`);
  });

  if (Array.isArray(copy.images) && copy.images.length) {
    lines.push("");
    copy.images.forEach((entry) => {
      lines.push(`![${entry.alt}](screenshots/${entry.fileName})`);
    });
  }

  return `${lines.join("\n")}\n`;
}
