export const VALID_THEME_BACKGROUND_HOSTS = Object.freeze([
  "globalBackground",
]);

const THEME_BACKGROUND_HOST_ALIASES = Object.freeze({
  globalbackground: "globalBackground",
  "global-background": "globalBackground",
  global_background: "globalBackground",
  "global background": "globalBackground",
  globaltypography: "globalBackground",
  "global-typography": "globalBackground",
  global_typography: "globalBackground",
  "global typography": "globalBackground",
});

export function normalizeThemeBackgroundHost(themeHost) {
  const normalized = String(themeHost || "").trim().toLowerCase();
  if (!normalized) {
    return "";
  }

  return THEME_BACKGROUND_HOST_ALIASES[normalized] || "";
}
