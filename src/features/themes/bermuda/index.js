import { mountThemeFeature } from "../shared/mount-theme-feature.js";
import {
  PREVIEW_PLACEMENT,
  STYLE_ID,
  buildBermudaThemeCss,
} from "./style.js";

const FEATURE_KEY = "theme-bermuda";
const CONFIG_KEY = "themes.bermuda";

export function mountThemeBermuda(context = {}) {
  return mountThemeFeature(context, {
    featureKey: FEATURE_KEY,
    configKey: CONFIG_KEY,
    styleId: STYLE_ID,
    variantName: "bermuda",
    matchMode: "includes",
    previewPlacement: PREVIEW_PLACEMENT,
    buildThemeCss: buildBermudaThemeCss,
  });
}

export const initializeThemeBermuda = mountThemeBermuda;
export const initialize = mountThemeBermuda;
export const mount = mountThemeBermuda;

