import { XCONFIG_PREVIEW_ASSET_FILES } from "./xconfig-preview-assets.manifest.js";

function toPreviewAssetUrl(fileName) {
  return new URL(`../assets/xconfig-previews/${fileName}`, import.meta.url).href;
}

export const XCONFIG_PREVIEW_ASSETS = Object.freeze(
  Object.fromEntries(
    Object.entries(XCONFIG_PREVIEW_ASSET_FILES).map(([featureKey, fileName]) => {
      return [featureKey, toPreviewAssetUrl(fileName)];
    })
  )
);

export function resolveXConfigPreviewAsset(featureKey) {
  const key = String(featureKey || "").trim();
  return XCONFIG_PREVIEW_ASSETS[key] || "";
}
