import { mountThemeFeature } from "../shared/mount-theme-feature.js";
import {
  PREVIEW_PLACEMENT,
  STYLE_ID,
  buildShanghaiThemeCss,
} from "./style.js";

const FEATURE_KEY = "theme-shanghai";
const CONFIG_KEY = "themes.shanghai";

export function mountThemeShanghai(context = {}) {
  return mountThemeFeature(context, {
    featureKey: FEATURE_KEY,
    configKey: CONFIG_KEY,
    styleId: STYLE_ID,
    variantName: "shanghai",
    matchMode: "equals",
    previewPlacement: PREVIEW_PLACEMENT,
    buildThemeCss: buildShanghaiThemeCss,
  });
}

export const initializeThemeShanghai = mountThemeShanghai;
export const initialize = mountThemeShanghai;
export const mount = mountThemeShanghai;

