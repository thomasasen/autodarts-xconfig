import { buildThemeCssBundle } from "../shared/theme-style-builder.js";
import { buildSharedPlayerDisplayCss } from "../shared/player-card-layout.js";
import { buildPreviewPlacementCss, normalizeBoolean } from "../shared/theme-utils.js";

export const STYLE_ID = "ad-ext-theme-x01-style";

const PREVIEW_PLACEMENT = Object.freeze({
  mode: "under-throws",
  activationMode: "autodarts-tools-zoom",
  previewHeightPx: 128,
  previewGapPx: 8,
});

function resolveThemeX01Config(rawConfig = {}) {
  return {
    showAvg: normalizeBoolean(rawConfig.showAvg, true),
  };
}

export function buildX01ThemeCss(featureConfig = {}) {
  const resolved = resolveThemeX01Config(featureConfig);
  const previewCss = buildPreviewPlacementCss(PREVIEW_PLACEMENT);
  const playerDisplayCss = buildSharedPlayerDisplayCss();
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

  const navigationOverride = `
div.chakra-stack.navigation.css-19ml6yu,
div.chakra-stack.navigation.css-ege71s,
.chakra-stack.navigation {
  background-color: #434343;
}
`;

  const overlayPriorityCss = `
#ad-ext-player-display,
#ad-ext-turn {
  position: relative !important;
  z-index: 7 !important;
}
`;

  return buildThemeCssBundle(
    featureConfig,
    `${navigationOverride}${previewCss}${avgVisibilityCss}${playerDisplayCss}${overlayPriorityCss}`
  );
}

export { PREVIEW_PLACEMENT };
