import { commonLayoutCss, commonThemeCss } from "./common-css.js";
import { buildThemeVisualSettingsCss } from "./theme-visuals.js";

function joinCss(...parts) {
  return parts
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join("\n\n");
}

export function buildThemeCssBundle(featureConfig = {}, extraCss = "") {
  return joinCss(commonThemeCss, commonLayoutCss, extraCss, buildThemeVisualSettingsCss(featureConfig));
}

