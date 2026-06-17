import { buildThemeCssBundle } from "../shared/theme-style-builder.js";
import { buildSharedPlayerDisplayCss } from "../shared/player-card-layout.js";
import { buildPreviewPlacementCss } from "../shared/theme-utils.js";

export const STYLE_ID = "ad-ext-theme-bermuda-style";

const PREVIEW_PLACEMENT = Object.freeze({
  mode: "under-throws",
  activationMode: "autodarts-tools-zoom",
  previewHeightPx: 128,
  previewGapPx: 8,
});

export function buildBermudaThemeCss(featureConfig = {}, options = {}) {
  const visualConfig = options.visualConfig || featureConfig;
  const previewCss = buildPreviewPlacementCss(PREVIEW_PLACEMENT);
  const playerDisplayCss = buildSharedPlayerDisplayCss();
  return buildThemeCssBundle(featureConfig, `${previewCss}${playerDisplayCss}`, visualConfig);
}

export { PREVIEW_PLACEMENT };

