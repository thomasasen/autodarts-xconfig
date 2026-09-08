import { buildThemeVisualSettingsCss } from "../shared/theme-visuals.js";

export const STYLE_ID = "ad-ext-theme-global-background-style";

export function buildThemeGlobalBackgroundStyleText(featureConfig = {}) {
  return buildThemeVisualSettingsCss(featureConfig);
}
