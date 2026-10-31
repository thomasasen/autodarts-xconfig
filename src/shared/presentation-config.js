export const SCREEN_PROFILES = Object.freeze([
  { value: "legacy", label: "Bisheriges Layout" },
  { value: "auto", label: "Automatisch" },
  { value: "desktop", label: "Desktop" },
  { value: "tv", label: "TV / Fernansicht" },
  { value: "portrait", label: "Hochformat" },
]);

export const GLOW_MODES = Object.freeze([
  { value: "off", label: "Aus" },
  { value: "steady", label: "Randglanz" },
  { value: "pulse", label: "Sanftes Pulsieren" },
]);

export function boundedNumber(value, fallback, min, max) {
  if (value === null || value === "" || value === undefined) return fallback;
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
}

export function normalizePresentationLayout(raw = {}) {
  return {
    screenProfile: SCREEN_PROFILES.some(({ value }) => value === raw.screenProfile) ? raw.screenProfile : "legacy",
    boardShare: boundedNumber(raw.boardShare, 55, 30, 75),
    textScale: boundedNumber(raw.textScale, 100, 80, 150),
    showAverages: raw.showAverages !== false,
    showStatistics: raw.showStatistics !== false,
  };
}

export function resolveScreenProfile(profile, width, height) {
  if (profile !== "auto") return profile;
  return height > width || width < 900 ? "portrait" : "desktop";
}
