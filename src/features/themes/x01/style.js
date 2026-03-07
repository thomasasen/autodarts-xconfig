import { buildThemeCssBundle } from "../shared/theme-style-builder.js";
import { buildPreviewPlacementCss, clampNumber, normalizeBoolean } from "../shared/theme-utils.js";

export const STYLE_ID = "ad-ext-theme-x01-style";

const PREVIEW_PLACEMENT = Object.freeze({
  mode: "under-throws",
  previewHeightPx: 128,
  previewGapPx: 8,
});

function resolveThemeX01Config(rawConfig = {}) {
  return {
    showAvg: normalizeBoolean(rawConfig.showAvg, true),
    avgFontSizePx: clampNumber(rawConfig.avgFontSizePx, 20, 48, 36),
    legFontSizePx: clampNumber(rawConfig.legFontSizePx, 24, 52, 38),
  };
}

export function buildX01ThemeCss(featureConfig = {}) {
  const resolved = resolveThemeX01Config(featureConfig);
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

  const x01LayoutOverrides = `
.css-hjw8x4{
  max-height: 12%;
}

div.ad-ext-player.ad-ext-player-active p.chakra-text.ad-ext-player-score {
  font-size: 9em;
}

div.ad-ext-player.ad-ext-player-active p.chakra-text.css-11cuipc {
  font-size: 1.5em;
}

div.css-y3hfdd{
  gap: 0 !important;
  height: 25%;
}
`;

  const navigationOverride = `
div.chakra-stack.navigation.css-19ml6yu,
div.chakra-stack.navigation.css-ege71s,
.chakra-stack.navigation {
  background-color: #434343;
}
`;

  const statsSizingCss = `
p.chakra-text.css-1j0bqop {
  font-size: ${Math.round(resolved.avgFontSizePx)}px;
  line-height: 1.15;
}

span.css-3fr5p8 > p,
span.chakra-badge.css-n2903v,
span.chakra-badge.css-1j1ty0z,
span.chakra-badge.css-1c4630i {
  font-size: ${Math.round(resolved.legFontSizePx)}px;
}
`;

  return buildThemeCssBundle(
    featureConfig,
    `${navigationOverride}${previewCss}${avgVisibilityCss}${statsSizingCss}${x01LayoutOverrides}`
  );
}

export { PREVIEW_PLACEMENT };

