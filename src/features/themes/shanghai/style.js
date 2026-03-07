import { buildThemeCssBundle } from "../shared/theme-style-builder.js";
import { buildPreviewPlacementCss, normalizeBoolean } from "../shared/theme-utils.js";

export const STYLE_ID = "ad-ext-theme-shanghai-style";

const PREVIEW_PLACEMENT = Object.freeze({
  mode: "under-throws",
  previewHeightPx: 128,
  previewGapPx: 8,
});

function resolveThemeShanghaiConfig(rawConfig = {}) {
  return {
    showAvg: normalizeBoolean(rawConfig.showAvg, true),
  };
}

export function buildShanghaiThemeCss(featureConfig = {}) {
  const resolved = resolveThemeShanghaiConfig(featureConfig);
  const previewCss = buildPreviewPlacementCss(PREVIEW_PLACEMENT);
  const avgVisibilityCss = resolved.showAvg
    ? ""
    : `
p.chakra-text.css-1j0bqop{
  display: none !important;
}

.ad-ext-avg-trend-arrow{
  display: none !important;
}
`;

  return buildThemeCssBundle(featureConfig, `${avgVisibilityCss}${previewCss}`);
}

export { PREVIEW_PLACEMENT };

