export const VALID_THEME_BACKGROUND_HOSTS = Object.freeze([
  "x01",
  "gotcha",
  "x01TwoPlayer",
  "shanghai",
  "bermuda",
  "cricket",
  "bullOff",
  "globalTypography",
]);

const THEME_BACKGROUND_HOST_ALIASES = Object.freeze({
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
  globaltypography: "globalTypography",
  "global-typography": "globalTypography",
  global_typography: "globalTypography",
  "global typography": "globalTypography",
});

export function normalizeThemeBackgroundHost(themeHost) {
  const normalized = String(themeHost || "").trim().toLowerCase();
  if (!normalized) {
    return "";
  }

  return THEME_BACKGROUND_HOST_ALIASES[normalized] || "";
}
