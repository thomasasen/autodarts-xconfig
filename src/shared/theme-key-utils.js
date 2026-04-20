export const VALID_THEME_KEYS = Object.freeze([
  "x01",
  "gotcha",
  "x01TwoPlayer",
  "shanghai",
  "bermuda",
  "cricket",
  "bullOff",
]);

const THEME_KEY_ALIASES = Object.freeze({
  x01: "x01",
  gotcha: "gotcha",
  x01twoplayer: "x01TwoPlayer",
  "x01-2player": "x01TwoPlayer",
  "x01 2player": "x01TwoPlayer",
  "x01 two player": "x01TwoPlayer",
  "x01_two_player": "x01TwoPlayer",
  "x01-two-player": "x01TwoPlayer",
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
