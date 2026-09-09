import {
  buildThemeGlobalTypographyBunnyUrl,
  getThemeGlobalTypographyPreset,
  getThemeGlobalTypographyScopeValues,
} from "../../../shared/theme-global-typography-presets.js";
import {
  hexColorToRgba,
  normalizeHexColor,
} from "../../../shared/hex-color-utils.js";
export const STYLE_ID = "ad-ext-theme-global-typography-style";
export const TOOLS_SHADOW_STYLE_ID = "ad-ext-theme-global-typography-tools-style";
export const THEME_GLOBAL_TYPOGRAPHY_SELECTOR_GROUPS = Object.freeze({
  scores: Object.freeze([
    ".ad-ext-player-score",
    ".ad-ext-turn-points",
    "#ad-ext-turn > .score",
    "main .overflow-clip .font-number.overflow-hidden",
    "main .bg-surface-surface > .font-number",
  ]),
  throws: Object.freeze([
    "#ad-ext-turn > .ad-ext-turn-throw",
    "#ad-ext-turn > .suggestion",
    "#ad-ext-turn > .suggestion *",
    ".ad-ext-checkout-suggestion",
    ".ad-ext-checkout-suggestion *",
    "main .bg-surface-surface > :first-child .font-number",
    "main .bg-surface-surface > :first-child .font-number *",
    "main .text-checkout-suggestion",
    "main .text-checkout-suggestion *",
  ]),
  names: Object.freeze([
    ".ad-ext-player-name",
    ".ad-ext-player-name > p",
    "main .font-display",
  ]),
});

const MODERN_ACTIVE_PLAYER_SURFACE_SELECTORS = Object.freeze([
  "main .overflow-clip:has(.bg-mono-white.rounded-full):has(.font-number.overflow-hidden)",
  "main .grid > .relative.isolate.overflow-hidden.bg-raspberry-slush-diagonal:has(.font-display)",
]);

const MODERN_ACTIVE_PLAYER_MARKER_SELECTORS = Object.freeze([
  "main .overflow-clip:has(.font-number.overflow-hidden) .bg-mono-white.rounded-full",
  "main .grid > .relative.isolate.overflow-hidden.bg-raspberry-slush-diagonal .bg-mono-white.rounded-full",
]);

export function getThemeGlobalTypographySelectors(applyTo = ["scores"]) {
  const scopeValues = getThemeGlobalTypographyScopeValues(applyTo);
  const selectors = scopeValues.flatMap((scopeValue) =>
    THEME_GLOBAL_TYPOGRAPHY_SELECTOR_GROUPS[scopeValue] || []
  );
  const uniqueSelectors = Array.from(new Set(selectors));
  return uniqueSelectors.length
    ? uniqueSelectors
    : [...THEME_GLOBAL_TYPOGRAPHY_SELECTOR_GROUPS.scores];
}

function buildThemeGlobalTypographyColorDeclarations(featureConfig = {}) {
  const accentColor = normalizeHexColor(featureConfig.accentColor, "");
  const scoreColor = normalizeHexColor(featureConfig.scoreColor, "");
  const secondaryTextColor = normalizeHexColor(featureConfig.secondaryTextColor, "");
  const throwLabelColor = normalizeHexColor(featureConfig.throwLabelColor, "");
  const activePlayerTintIntensity = Math.max(
    0,
    Number.parseInt(featureConfig.activePlayerTintIntensity, 10) || 0
  );
  const declarations = [];

  if (accentColor) {
    declarations.push(
      `--ad-ext-theme-accent-color: ${accentColor};`,
      `--ad-ext-theme-card-active-border-color: ${accentColor};`,
      `--ad-ext-theme-card-active-outline-color: ${hexColorToRgba(accentColor, 0.24)};`,
      `--ad-ext-theme-score-active-color: ${accentColor};`,
      `--ad-ext-theme-score-winner-color: ${accentColor};`
    );
  }

  if (scoreColor) {
    declarations.push(
      `--ad-ext-theme-text-primary-color: ${scoreColor};`,
      `--ad-ext-theme-score-color: ${scoreColor};`,
      `--ad-ext-theme-score-inactive-color: ${scoreColor};`,
      `--ad-ext-theme-turn-points-color: ${scoreColor};`
    );
  }

  if (secondaryTextColor) {
    declarations.push(
      `--ad-ext-theme-text-secondary-color: ${secondaryTextColor};`,
      `--ad-ext-theme-name-color: ${secondaryTextColor};`,
      `--ad-ext-theme-name-active-color: ${secondaryTextColor};`,
      `--ad-ext-theme-name-inactive-color: ${secondaryTextColor};`,
      `--ad-ext-theme-name-winner-color: ${secondaryTextColor};`,
      `--ad-ext-theme-meta-color: ${secondaryTextColor};`,
      `--ad-ext-theme-meta-active-color: ${secondaryTextColor};`,
      `--ad-ext-theme-meta-inactive-color: ${secondaryTextColor};`,
      `--ad-ext-theme-meta-winner-color: ${secondaryTextColor};`
    );
  }

  if (throwLabelColor) {
    declarations.push(`--ad-ext-theme-throw-label-color: ${throwLabelColor};`);
  }

  if (activePlayerTintIntensity > 0) {
    const bottomIntensity = Math.max(
      0,
      Math.min(activePlayerTintIntensity, Math.round(activePlayerTintIntensity * 0.5))
    );
    declarations.push(
      `--ad-ext-theme-active-card-tint-top: color-mix(in srgb, var(--ad-ext-theme-card-active-border-color) ${activePlayerTintIntensity}%, transparent);`,
      `--ad-ext-theme-active-card-tint-bottom: color-mix(in srgb, var(--ad-ext-theme-card-active-border-color) ${bottomIntensity}%, transparent);`
    );
  }

  return declarations;
}

function appendColorRule(blocks, selectors, color) {
  if (!color) {
    return;
  }
  blocks.push(`${selectors.join(",\n")} {\n  color: ${color} !important;\n}`);
}

export function buildThemeGlobalTypographyStyleText(featureConfig = {}) {
  const preset = getThemeGlobalTypographyPreset(featureConfig.fontPreset);
  const selectors = getThemeGlobalTypographySelectors(featureConfig.applyTo);
  const colorDeclarations = buildThemeGlobalTypographyColorDeclarations(featureConfig);
  const blocks = [];
  let imports = "";

  if (preset && Array.isArray(selectors) && selectors.length) {
    const remoteUrl = preset.remote
      ? buildThemeGlobalTypographyBunnyUrl(preset.familyName)
      : "";
    imports = remoteUrl ? `@import url("${remoteUrl}");\n\n` : "";
    const selectorText = selectors.join(",\n");
    blocks.push(`${selectorText} {\n  font-family: ${preset.fontFamily} !important;\n}`);
  }

  if (colorDeclarations.length) {
    blocks.push(`:root {\n  ${colorDeclarations.join("\n  ")}\n}`);
  }

  const scoreColor = normalizeHexColor(featureConfig.scoreColor, "");
  const secondaryTextColor = normalizeHexColor(featureConfig.secondaryTextColor, "");
  const throwLabelColor = normalizeHexColor(featureConfig.throwLabelColor, "");
  const accentColor = normalizeHexColor(featureConfig.accentColor, "");
  appendColorRule(blocks, THEME_GLOBAL_TYPOGRAPHY_SELECTOR_GROUPS.scores, scoreColor);
  appendColorRule(blocks, THEME_GLOBAL_TYPOGRAPHY_SELECTOR_GROUPS.names, secondaryTextColor);
  appendColorRule(blocks, THEME_GLOBAL_TYPOGRAPHY_SELECTOR_GROUPS.throws, throwLabelColor);

  if (accentColor) {
    blocks.push(
      `${MODERN_ACTIVE_PLAYER_MARKER_SELECTORS.join(",\n")} {
  background-color: ${accentColor} !important;
}`,
      `${MODERN_ACTIVE_PLAYER_SURFACE_SELECTORS.join(",\n")} {
  outline: 2px solid ${hexColorToRgba(accentColor, 0.78)} !important;
  outline-offset: -2px !important;
}`
    );
  }

  const tintIntensity = Math.max(0, Number.parseInt(featureConfig.activePlayerTintIntensity, 10) || 0);
  if (accentColor && tintIntensity > 0) {
    blocks.push(`#ad-ext-player-display .ad-ext-player.ad-ext-player-active > .chakra-stack,
${MODERN_ACTIVE_PLAYER_SURFACE_SELECTORS.join(",\n")} {
  box-shadow: inset 0 0 0 9999px ${hexColorToRgba(accentColor, tintIntensity / 100)} !important;
}`);
  }

  return blocks.length ? `${imports}${blocks.join("\n\n")}` : "";
}
