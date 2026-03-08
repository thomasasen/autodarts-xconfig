import { XCONFIG_PREVIEW_SCREENSHOTS } from "./xconfig-preview-assets.manifest.js";

function toScreenshotUrl(fileName) {
  return new URL(`../../docs/screenshots/${fileName}`, import.meta.url).href;
}

export const XCONFIG_PREVIEW_ASSETS = Object.freeze(
  Object.fromEntries(
    Object.entries(XCONFIG_PREVIEW_SCREENSHOTS).map(([featureKey, fileName]) => {
      return [featureKey, toScreenshotUrl(fileName)];
    })
  )
);

export function resolveXConfigPreviewAsset(featureKey) {
  const key = String(featureKey || "").trim();
  return XCONFIG_PREVIEW_ASSETS[key] || "";
}
