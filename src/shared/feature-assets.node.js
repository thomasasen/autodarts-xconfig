import { DART_DESIGN_FILES, DART_DESIGN_KEYS } from "./feature-assets.manifest.js";

function toAssetUrl(relativePath) {
  return new URL(relativePath, import.meta.url).href;
}

export const DART_DESIGNS = Object.freeze(
  Object.fromEntries(
    Object.entries(DART_DESIGN_FILES).map(([designKey, fileName]) => {
      return [designKey, toAssetUrl(`../assets/darts/${fileName}`)];
    })
  )
);

export { DART_DESIGN_KEYS };

export function resolveDartDesignAsset(designKey) {
  const key = String(designKey || "").trim().toLowerCase();
  return DART_DESIGNS[key] || DART_DESIGNS.autodarts;
}

export const TAKEOUT_IMAGE_ASSET = toAssetUrl("../assets/TakeOut.png");
export const SINGLE_BULL_SOUND_ASSET = toAssetUrl("../assets/singlebull.mp3");
