import { DART_DESIGN_FILES } from "./feature-assets.manifest.js";
import { BOARD_STYLE_DESIGN_FILES } from "./board-style-assets.manifest.js";
export { DART_DESIGN_KEYS } from "./feature-assets.manifest.js";
export { BOARD_STYLE_DESIGN_KEYS } from "./board-style-assets.manifest.js";

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

export function resolveDartDesignAsset(designKey) {
  const key = String(designKey || "").trim().toLowerCase();
  return DART_DESIGNS[key] || DART_DESIGNS.autodarts;
}

export const BOARD_STYLE_DESIGN_ASSETS = Object.freeze(
  Object.fromEntries(
    Object.entries(BOARD_STYLE_DESIGN_FILES).map(([designKey, fileName]) => {
      return [designKey, toAssetUrl(`../assets/board-styles/${fileName}`)];
    })
  )
);

export function resolveBoardStyleDesignAsset(designKey) {
  const key = String(designKey || "").trim().toLowerCase();
  return BOARD_STYLE_DESIGN_ASSETS[key] || BOARD_STYLE_DESIGN_ASSETS["winmau-blade-6-tc"];
}

export const TAKEOUT_IMAGE_ASSET = toAssetUrl("../assets/TakeOut.png");
export const SINGLE_BULL_SOUND_ASSET = toAssetUrl("../assets/singlebull.mp3");
export const X01_BUST_GLASS_CRACK_SOUND_ASSET = toAssetUrl("../assets/glasscrack.mp3");
