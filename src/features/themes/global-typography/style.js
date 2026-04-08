import {
  buildThemeGlobalTypographyBunnyUrl,
  getThemeGlobalTypographyPreset,
  getThemeGlobalTypographyScopeValues,
} from "../../../shared/theme-global-typography-presets.js";

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

export function buildThemeGlobalTypographyStyleText(featureConfig = {}) {
  const preset = getThemeGlobalTypographyPreset(featureConfig.fontPreset);
  const selectors = getThemeGlobalTypographySelectors(featureConfig.applyTo);
  if (!preset || !Array.isArray(selectors) || !selectors.length) {
    return "";
  }

  const remoteUrl = preset.remote
    ? buildThemeGlobalTypographyBunnyUrl(preset.familyName)
    : "";
  const imports = remoteUrl ? `@import url("${remoteUrl}");\n\n` : "";
  const selectorText = selectors.join(",\n");

  return `${imports}${selectorText} {\n  font-family: ${preset.fontFamily} !important;\n}`;
}
