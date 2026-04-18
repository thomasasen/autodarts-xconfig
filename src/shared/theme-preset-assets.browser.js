import britishFlagJpg from "../assets/theme-presets/british-flag.jpg";
import cyberpunkJpg from "../assets/theme-presets/cyberpunk.jpg";
import matrixPng from "../assets/theme-presets/matrix.png";
import fireJpg from "../assets/theme-presets/fire.jpg";
import iceJpg from "../assets/theme-presets/ice.jpg";

import { THEME_PRESET_ASSET_KEYS } from "./theme-preset-assets.manifest.js";

export const THEME_PRESET_ASSETS = Object.freeze({
  "british-flag": britishFlagJpg,
  cyberpunk: cyberpunkJpg,
  matrix: matrixPng,
  fire: fireJpg,
  ice: iceJpg,
});

export { THEME_PRESET_ASSET_KEYS };

export function resolveThemePresetAsset(assetKey) {
  const key = String(assetKey || "").trim().toLowerCase();
  return THEME_PRESET_ASSETS[key] || "";
}
