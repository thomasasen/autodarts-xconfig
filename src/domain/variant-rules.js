export function normalizeVariant(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function classifyCricketGameMode(value) {
  const normalized = normalizeVariant(value);
  if (!normalized) {
    return "";
  }

  if (normalized === "tactics" || normalized.startsWith("tactics ")) {
    return "tactics";
  }

  if (
    normalized === "hidden cricket" ||
    normalized.startsWith("hidden cricket ")
  ) {
    return "hidden-cricket";
  }

  if (normalized === "cricket" || normalized.startsWith("cricket ")) {
    return "cricket";
  }

  return "";
}

export function classifyCricketScoringMode(value) {
  const normalized = normalizeVariant(value).replace(/[_\s]+/g, "-");
  if (!normalized) {
    return "unknown";
  }

  if (["standard", "default", "normal", "regular", "classic"].includes(normalized)) {
    return "standard";
  }

  if (normalized === "cut-throat" || normalized.replace(/-/g, "") === "cutthroat") {
    return "cutthroat";
  }

  if (
    [
      "no-score",
      "noscore",
      "practice",
      "practice-no-score",
      "practice-noscore",
    ].includes(normalized)
  ) {
    return "neutral";
  }

  return "unknown";
}

export function isX01VariantText(value, options = {}) {
  const normalized = normalizeVariant(value);
  if (!normalized) {
    return Boolean(options.allowMissing || options.allowEmpty);
  }

  if (normalized.includes("x01")) {
    return true;
  }

  if (options.allowNumeric) {
    return /\b\d+01\b/.test(normalized);
  }

  return false;
}

export function isCricketVariantText(value, options = {}) {
  const normalized = normalizeVariant(value);
  if (!normalized) {
    return Boolean(options.allowMissing || options.allowEmpty);
  }

  const mode = classifyCricketGameMode(normalized);
  if (!mode) {
    return false;
  }

  if (mode === "hidden-cricket") {
    return Boolean(options.includeHiddenCricket);
  }

  return mode === "cricket" || mode === "tactics";
}

export function classifyVariantFamily(value, options = {}) {
  const normalized = normalizeVariant(value);
  if (!normalized) {
    return options.allowEmpty ? "empty" : "unknown";
  }

  if (isX01VariantText(normalized, { allowNumeric: true })) {
    return "x01";
  }

  const cricketMode = classifyCricketGameMode(normalized);
  if (cricketMode === "hidden-cricket") {
    return options.includeHiddenCricket ? "hidden-cricket" : "unknown";
  }

  if (cricketMode) {
    return cricketMode;
  }

  return "unknown";
}
