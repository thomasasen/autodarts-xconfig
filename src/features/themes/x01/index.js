import { mountThemeFeature } from "../shared/mount-theme-feature.js";
import { PREVIEW_PLACEMENT, STYLE_ID, buildX01ThemeCss } from "./style.js";

const FEATURE_KEY = "theme-x01";
const CONFIG_KEY = "themes.x01";

export function mountThemeX01(context = {}) {
  return mountThemeFeature(context, {
    featureKey: FEATURE_KEY,
    configKey: CONFIG_KEY,
    styleId: STYLE_ID,
    variantName: "x01",
    matchMode: "equals",
    previewPlacement: PREVIEW_PLACEMENT,
    buildThemeCss: buildX01ThemeCss,
  });
}

export const initializeThemeX01 = mountThemeX01;
export const initialize = mountThemeX01;
export const mount = mountThemeX01;

