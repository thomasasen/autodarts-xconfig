import { mountThemeFeature } from "../shared/mount-theme-feature.js";
import { createGotchaThemePolicy } from "./policy.js";
import { PREVIEW_PLACEMENT, STYLE_ID, buildGotchaThemeCss } from "./style.js";

const FEATURE_KEY = "theme-gotcha";
const CONFIG_KEY = "themes.gotcha";

export function mountThemeGotcha(context = {}) {
  return mountThemeFeature(context, {
    featureKey: FEATURE_KEY,
    configKey: CONFIG_KEY,
    styleId: STYLE_ID,
    variantName: "gotcha",
    matchMode: "equals",
    previewPlacement: PREVIEW_PLACEMENT,
    policyFactory: createGotchaThemePolicy,
    buildThemeCss: buildGotchaThemeCss,
  });
}

export const initializeThemeGotcha = mountThemeGotcha;
export const initialize = mountThemeGotcha;
export const mount = mountThemeGotcha;
