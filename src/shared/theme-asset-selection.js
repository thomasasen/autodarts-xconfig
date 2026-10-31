import { COMMUNITY_PRESETS, COMMUNITY_SURROUNDS } from "./community-designs.js";

export function backgroundAssetKeys(settings = {}, { context = "game", portrait = false } = {}) {
  if (settings.backgroundImageDataUrl) return [];
  const preset = COMMUNITY_PRESETS.find((entry) => entry.key === settings.communityPresetKey);
  const contextual = portrait && context !== "menu" ? preset?.backgroundAssets.portrait : preset?.backgroundAssets[context];
  return [contextual || settings.backgroundAssetKey].filter(Boolean);
}

export function readThemeAssetView(windowRef, documentRef, snapshot = {}) {
  const inMatch = /^\/matches(?:\/|$)/.test(String(windowRef?.location?.pathname || ""));
  const configuring = /^\/ad-xconfig(?:\/|$)/.test(String(windowRef?.location?.pathname || ""));
  const variant = snapshot.variant || snapshot.match?.variant || documentRef?.querySelector?.("main .flex-wrap")?.textContent || "";
  let context = "menu";
  if (inMatch || configuring) context = /cricket|tactics/i.test(variant) ? "cricket" : "game";
  return { context, portrait: windowRef?.innerHeight > windowRef?.innerWidth };
}

export function requiredThemeAssetKeys(config = {}, view = {}) {
  const keys = [];
  const background = config.features?.themes?.globalBackground;
  const toggles = config.featureToggles || {};
  if ((toggles["themes.globalBackground"] ?? background?.enabled) &&
      (view.activating || view.context !== "menu" || background?.applyMenuBackground)) {
    const context = view.activating && view.context === "menu" && !background?.applyMenuBackground ? "game" : view.context;
    keys.push(...backgroundAssetKeys(background, { ...view, context }));
  }
  const surround = config.features?.boardSurround;
  if ((toggles.boardSurround ?? surround?.enabled) && (view.activating || view.context !== "menu")) {
    const design = COMMUNITY_SURROUNDS.find((entry) => entry.key === surround?.design);
    const key = surround?.assetKey || design?.assetKey;
    if (key) keys.push(key);
  }
  return [...new Set(keys)];
}
