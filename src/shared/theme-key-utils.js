export const VALID_THEME_KEYS = Object.freeze([
  "x01",
  "shanghai",
  "bermuda",
  "cricket",
  "bullOff",
]);

const THEME_KEY_ALIASES = Object.freeze({
  x01: "x01",
  shanghai: "shanghai",
  bermuda: "bermuda",
  cricket: "cricket",
  tactics: "cricket",
  bulloff: "bullOff",
  "bull-off": "bullOff",
  bull_off: "bullOff",
  "bull off": "bullOff",
});

export function normalizeThemeKey(themeKey) {
  const normalized = String(themeKey || "").trim().toLowerCase();
  if (!normalized) {
    return "";
  }

  return THEME_KEY_ALIASES[normalized] || "";
}
