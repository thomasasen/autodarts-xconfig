import { mountGlobalMatchStyle } from "../shared/mount-global-match-style.js";
import { STYLE_ID, buildThemeGlobalBackgroundStyleText } from "./style.js";

const FEATURE_KEY = "theme-global-background";
const CONFIG_KEY = "themes.globalBackground";

export function mountThemeGlobalBackground(context = {}) {
  return mountGlobalMatchStyle(context, {
    featureKey: FEATURE_KEY,
    configKey: CONFIG_KEY,
    styleId: STYLE_ID,
    buildStyleText: buildThemeGlobalBackgroundStyleText,
  });
}

export const initializeThemeGlobalBackground = mountThemeGlobalBackground;
export const initialize = mountThemeGlobalBackground;
export const mount = mountThemeGlobalBackground;
