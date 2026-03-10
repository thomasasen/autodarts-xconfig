export const CRICKET_PRESENTATION = Object.freeze({
  OPEN: "open",
  PRESSURE: "pressure",
  SCORING: "scoring",
  DEAD: "dead",
  INACTIVE: "inactive",
});

export const CRICKET_UI_BUCKET = Object.freeze({
  SCORING: "scoring",
  PRESSURE: "pressure",
  OPEN: "open",
  DEAD: "dead",
});

export function normalizeCricketPresentationToken(value) {
  const token = String(value || "").trim().toLowerCase();
  if (token === "offense" || token === "scorable") {
    return CRICKET_PRESENTATION.SCORING;
  }
  if (token === "danger") {
    return CRICKET_PRESENTATION.PRESSURE;
  }
  if (token === "closed") {
    return CRICKET_PRESENTATION.DEAD;
  }
  if (
    token === CRICKET_PRESENTATION.OPEN ||
    token === CRICKET_PRESENTATION.PRESSURE ||
    token === CRICKET_PRESENTATION.SCORING ||
    token === CRICKET_PRESENTATION.DEAD
  ) {
    return token;
  }
  return CRICKET_PRESENTATION.OPEN;
}

export function resolveCricketUiBucket(entry = null) {
  const presentation = normalizeCricketPresentationToken(
    entry?.presentation || entry?.boardPresentation || ""
  );

  if (
    presentation === CRICKET_PRESENTATION.SCORING ||
    entry?.scoring ||
    entry?.scorable ||
    entry?.scorableForPlayer ||
    entry?.offense
  ) {
    return CRICKET_UI_BUCKET.SCORING;
  }

  if (
    presentation === CRICKET_PRESENTATION.PRESSURE ||
    entry?.pressure ||
    entry?.danger ||
    entry?.threatenedByOpponents ||
    entry?.scorableAgainstPlayer
  ) {
    return CRICKET_UI_BUCKET.PRESSURE;
  }

  if (presentation === CRICKET_PRESENTATION.DEAD || entry?.dead) {
    return CRICKET_UI_BUCKET.DEAD;
  }

  return CRICKET_UI_BUCKET.OPEN;
}

export function resolveCricketHighlightActive(uiBucket) {
  const normalized = String(uiBucket || "").trim().toLowerCase();
  return (
    normalized === CRICKET_UI_BUCKET.SCORING ||
    normalized === CRICKET_UI_BUCKET.PRESSURE ||
    normalized === CRICKET_UI_BUCKET.OPEN
  );
}

export function resolveCricketRowPresentation(stateEntry = null) {
  const cellStates = Array.isArray(stateEntry?.cellStates) ? stateEntry.cellStates : [];
  if (cellStates.length > 0) {
    const tokens = cellStates.map((entry) =>
      normalizeCricketPresentationToken(entry?.presentation)
    );
    if (tokens.every((token) => token === CRICKET_PRESENTATION.DEAD)) {
      return CRICKET_PRESENTATION.DEAD;
    }
    if (tokens.some((token) => token === CRICKET_PRESENTATION.SCORING)) {
      return CRICKET_PRESENTATION.SCORING;
    }
    if (tokens.some((token) => token === CRICKET_PRESENTATION.PRESSURE)) {
      return CRICKET_PRESENTATION.PRESSURE;
    }
    return CRICKET_PRESENTATION.OPEN;
  }

  return normalizeCricketPresentationToken(
    stateEntry?.boardPresentation || stateEntry?.presentation || CRICKET_PRESENTATION.OPEN
  );
}
