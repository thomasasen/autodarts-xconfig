import { buildThemeCssBundle } from "../shared/theme-style-builder.js";
import { buildPreviewPlacementCss } from "../shared/theme-utils.js";

export const STYLE_ID = "ad-ext-theme-bermuda-style";

const PREVIEW_PLACEMENT = Object.freeze({
  mode: "under-throws",
  activationMode: "autodarts-tools-zoom",
  previewHeightPx: 128,
  previewGapPx: 8,
});

export function buildBermudaThemeCss(featureConfig = {}) {
  const previewCss = buildPreviewPlacementCss(PREVIEW_PLACEMENT);
  return buildThemeCssBundle(featureConfig, previewCss);
}

export { PREVIEW_PLACEMENT };

