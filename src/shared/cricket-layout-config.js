const option = (value, label) => Object.freeze({ value, label, disabled: value === "custom" });

export const CRICKET_LAYOUT_OPTIONS = Object.freeze({
  profile: Object.freeze([option("balanced", "Ausgewogen"), option("distance", "Fernansicht"), option("multiplayer", "Mehrspieler"), option("custom", "Benutzerdefiniert")]),
  space: Object.freeze([option("auto", "Automatisch"), option("table", "Tabelle betonen"), option("board", "Board betonen")]),
  markSize: Object.freeze([option("original", "Original"), option("large", "Groß"), option("very-large", "Sehr groß")]),
  targetSize: Object.freeze([option("auto", "Automatisch"), option("large", "Groß"), option("very-large", "Sehr groß")]),
  textSize: Object.freeze([option("normal", "Normal"), option("large", "Groß")]),
  density: Object.freeze([option("normal", "Normal"), option("compact", "Kompakt")]),
  activeIndicator: Object.freeze([option("native", "Native Anzeige"), option("header", "Kopfmarkierung"), option("line", "Kopfmarkierung mit Spaltenlinie"), option("tint", "Kopfmarkierung mit dezenter Spaltenfläche")]),
  names: Object.freeze([option("single", "Eine Zeile mit Kürzung"), option("two-lines", "Bis zu zwei Zeilen")]),
  mpr: Object.freeze([option("normal", "Normal"), option("subtle", "Dezent"), option("off", "Aus")]),
});

export const CRICKET_LAYOUT_PROFILES = Object.freeze({
  balanced: Object.freeze({ space: "auto", markSize: "original", targetSize: "auto", textSize: "normal", density: "normal", activeIndicator: "line", names: "two-lines", mpr: "subtle" }),
  distance: Object.freeze({ space: "table", markSize: "very-large", targetSize: "large", textSize: "large", density: "normal", activeIndicator: "line", names: "two-lines", mpr: "off" }),
  multiplayer: Object.freeze({ space: "table", markSize: "large", targetSize: "auto", textSize: "normal", density: "compact", activeIndicator: "line", names: "single", mpr: "subtle" }),
});

const SETTINGS = Object.keys(CRICKET_LAYOUT_PROFILES.balanced);
export const tacticsLayoutKey = (key) => `tactics${key[0].toUpperCase()}${key.slice(1)}`;

function choice(key, value, fallback) {
  return CRICKET_LAYOUT_OPTIONS[key].some((entry) => entry.value === value) ? value : fallback;
}

function normalizeSettings(raw, prefix = "") {
  const readKey = (key) => prefix ? tacticsLayoutKey(key) : key;
  const requested = choice("profile", raw[readKey("profile")], "balanced");
  const fallback = CRICKET_LAYOUT_PROFILES[requested] || CRICKET_LAYOUT_PROFILES.balanced;
  const values = Object.fromEntries(SETTINGS.map((key) => [key, choice(key, raw[readKey(key)], fallback[key])]));
  const profile = Object.keys(CRICKET_LAYOUT_PROFILES).find((key) =>
    SETTINGS.every((setting) => values[setting] === CRICKET_LAYOUT_PROFILES[key][setting])) || "custom";
  return { profile, ...values };
}

export function normalizeCricketLayoutConfig(raw = {}) {
  const tactics = normalizeSettings(raw, "tactics");
  return {
    enabled: raw.enabled === true,
    ...normalizeSettings(raw),
    tacticsOverrides: raw.tacticsOverrides === true,
    ...Object.fromEntries(Object.entries(tactics).map(([key, value]) => [tacticsLayoutKey(key), value])),
    debug: raw.debug === true,
  };
}

export function resolveCricketLayoutSettings(raw = {}, tactics = false) {
  const config = normalizeCricketLayoutConfig(raw);
  if (!tactics || !config.tacticsOverrides) return config;
  return { ...config, ...Object.fromEntries(["profile", ...SETTINGS].map((key) => [key, config[tacticsLayoutKey(key)]])) };
}

// Presets change only this layout card. Individual edits are identified by normalization.
export function buildCricketLayoutSettingValues(key, value) {
  const tactics = key === "tacticsProfile";
  if ((key === "profile" || tactics) && CRICKET_LAYOUT_PROFILES[value]) {
    const values = { profile: value, ...CRICKET_LAYOUT_PROFILES[value] };
    return tactics ? Object.fromEntries(Object.entries(values).map(([name, entry]) => [tacticsLayoutKey(name), entry])) : values;
  }
  return { [key]: value };
}

export const DEFAULT_CRICKET_LAYOUT_CONFIG = Object.freeze(normalizeCricketLayoutConfig());
