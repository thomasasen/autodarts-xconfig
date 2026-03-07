import { mountThemeFeature } from "../shared/mount-theme-feature.js";
import {
  PREVIEW_PLACEMENT,
  STYLE_ID,
  buildCricketThemeCss,
} from "./style.js";

const FEATURE_KEY = "theme-cricket";
const CONFIG_KEY = "themes.cricket";

export function mountThemeCricket(context = {}) {
  return mountThemeFeature(context, {
    featureKey: FEATURE_KEY,
    configKey: CONFIG_KEY,
    styleId: STYLE_ID,
    variantName: "cricket",
    matchMode: "equals",
    previewPlacement: PREVIEW_PLACEMENT,
    buildThemeCss: buildCricketThemeCss,
  });
}

export const initializeThemeCricket = mountThemeCricket;
export const initialize = mountThemeCricket;
export const mount = mountThemeCricket;

