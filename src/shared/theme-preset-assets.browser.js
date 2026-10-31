import { THEME_PRESET_PREVIEWS } from "./theme-previews.browser.js";
import { THEME_ASSET_CATALOG } from "./theme-asset-catalog.js";
import { THEME_ASSET_RELEASE_TAG } from "./theme-asset-source.js";
import { createThemeAssetCache, downloadThemeAsset } from "./theme-asset-cache.js";
export { THEME_PRESET_ASSET_KEYS } from "./theme-preset-assets.manifest.js";

let cache = null;
export function configureThemePresetAssets({ gmGetValue, gmSetValue, gmRequest } = {}) {
  cache = createThemeAssetCache({ catalog: THEME_ASSET_CATALOG, releaseTag: THEME_ASSET_RELEASE_TAG,
    getValue: gmGetValue, setValue: gmSetValue, download: (url) => downloadThemeAsset(url, gmRequest) });
}
export function resolveThemePresetPreview(assetKey) {
  return THEME_PRESET_PREVIEWS[String(assetKey || "").trim().toLowerCase()] || "";
}
export function resolveThemePresetAsset(assetKey) {
  return cache?.resolve(String(assetKey || "").trim().toLowerCase()) || "";
}
export function ensureThemePresetAsset(assetKey) {
  if (!cache) return Promise.reject(new Error("Der Bildspeicher wurde noch nicht eingerichtet."));
  return cache.ensure(assetKey);
}
export function hydrateThemePresetAssets(keys) { return cache?.hydrate(keys) || Promise.resolve([]); }
export function subscribeThemePresetAssets(listener) { return cache?.subscribe(listener) || (() => {}); }
