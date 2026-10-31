import { THEME_PRESET_ASSET_FILES } from "./theme-preset-assets.manifest.js";
import { THEME_PREVIEW_FILES } from "./theme-previews.manifest.js";
export { THEME_PRESET_ASSET_KEYS } from "./theme-preset-assets.manifest.js";

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

export function resolveThemePresetAsset(assetKey) {
  const key = String(assetKey || "").trim().toLowerCase();
  return THEME_PRESET_ASSETS[key] || "";
}

export function resolveThemePresetPreview(assetKey) {
  const file = THEME_PREVIEW_FILES[String(assetKey || "").trim().toLowerCase()];
  return file ? toAssetUrl(`../assets/theme-presets/previews/${file}`) : "";
}
// Node harnesses resolve originals from disk; browser builds use the verified GM cache.
export function configureThemePresetAssets() { /* Disk assets require no GM configuration. */ }
export async function ensureThemePresetAsset(key) { return resolveThemePresetAsset(key); }
export async function hydrateThemePresetAssets(keys) { return keys.map(resolveThemePresetAsset); }
export function subscribeThemePresetAssets() { return () => {}; }
