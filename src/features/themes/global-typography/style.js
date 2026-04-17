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
  ]),
  throws: Object.freeze([
    "#ad-ext-turn > .ad-ext-turn-throw",
    "#ad-ext-turn > .suggestion",
    "#ad-ext-turn > .suggestion *",
    ".ad-ext-checkout-suggestion",
    ".ad-ext-checkout-suggestion *",
  ]),
  names: Object.freeze([
    ".ad-ext-player-name",
    ".ad-ext-player-name > p",
  ]),
});

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
  const declarations = [];

  if (accentColor) {
    declarations.push(`--ad-ext-theme-accent-color: ${accentColor};`);
    declarations.push(`--ad-ext-theme-card-active-border-color: ${accentColor};`);
    declarations.push(
      `--ad-ext-theme-card-active-outline-color: ${hexColorToRgba(accentColor, 0.24)};`
    );
    declarations.push(`--ad-ext-theme-score-active-color: ${accentColor};`);
    declarations.push(`--ad-ext-theme-score-winner-color: ${accentColor};`);
  }

  if (scoreColor) {
    declarations.push(`--ad-ext-theme-text-primary-color: ${scoreColor};`);
    declarations.push(`--ad-ext-theme-score-color: ${scoreColor};`);
    declarations.push(`--ad-ext-theme-score-inactive-color: ${scoreColor};`);
    declarations.push(`--ad-ext-theme-turn-points-color: ${scoreColor};`);
  }

  if (secondaryTextColor) {
    declarations.push(`--ad-ext-theme-text-secondary-color: ${secondaryTextColor};`);
    declarations.push(`--ad-ext-theme-name-color: ${secondaryTextColor};`);
    declarations.push(`--ad-ext-theme-name-active-color: ${secondaryTextColor};`);
    declarations.push(`--ad-ext-theme-name-inactive-color: ${secondaryTextColor};`);
    declarations.push(`--ad-ext-theme-name-winner-color: ${secondaryTextColor};`);
    declarations.push(`--ad-ext-theme-meta-color: ${secondaryTextColor};`);
    declarations.push(`--ad-ext-theme-meta-active-color: ${secondaryTextColor};`);
    declarations.push(`--ad-ext-theme-meta-inactive-color: ${secondaryTextColor};`);
    declarations.push(`--ad-ext-theme-meta-winner-color: ${secondaryTextColor};`);
  }

  if (throwLabelColor) {
    declarations.push(`--ad-ext-theme-throw-label-color: ${throwLabelColor};`);
  }

  return declarations;
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

  return blocks.length ? `${imports}${blocks.join("\n\n")}` : "";
}
