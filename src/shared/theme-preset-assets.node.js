import { THEME_PRESET_ASSET_FILES, THEME_PRESET_ASSET_KEYS } from "./theme-preset-assets.manifest.js";

function toAssetUrl(relativePath) {
  return new URL(relativePath, import.meta.url).href;
}

export const THEME_PRESET_ASSETS = Object.freeze(
  Object.fromEntries(
    Object.entries(THEME_PRESET_ASSET_FILES).map(([assetKey, fileName]) => {
      return [assetKey, toAssetUrl(`../assets/theme-presets/${fileName}`)];
    })
  )
);

export { THEME_PRESET_ASSET_KEYS };

export function resolveThemePresetAsset(assetKey) {
  const key = String(assetKey || "").trim().toLowerCase();
  return THEME_PRESET_ASSETS[key] || "";
}
