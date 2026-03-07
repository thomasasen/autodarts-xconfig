import { mountThemeFeature } from "../shared/mount-theme-feature.js";
import {
  PREVIEW_PLACEMENT,
  STYLE_ID,
  buildBullOffThemeCss,
} from "./style.js";

const FEATURE_KEY = "theme-bull-off";
const CONFIG_KEY = "themes.bullOff";

export function mountThemeBullOff(context = {}) {
  return mountThemeFeature(context, {
    featureKey: FEATURE_KEY,
    configKey: CONFIG_KEY,
    styleId: STYLE_ID,
    variantName: "bull-off",
    matchMode: "includes",
    previewPlacement: PREVIEW_PLACEMENT,
    buildThemeCss: buildBullOffThemeCss,
  });
}

export const initializeThemeBullOff = mountThemeBullOff;
export const initialize = mountThemeBullOff;
export const mount = mountThemeBullOff;

