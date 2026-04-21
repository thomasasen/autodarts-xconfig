const DEFAULT_SCOPE_VALUES = Object.freeze(["scores", "throws", "names"]);

function createPreset(definition) {
  const preset = {
    key: String(definition?.key || "").trim(),
    label: String(definition?.label || "").trim(),
    description: String(definition?.description || "").trim(),
    fontPreset: String(definition?.fontPreset || "system").trim(),
    applyTo: Object.freeze(
      Array.isArray(definition?.applyTo) && definition.applyTo.length
        ? definition.applyTo.map((value) => String(value || "").trim()).filter(Boolean)
        : [...DEFAULT_SCOPE_VALUES]
    ),
    accentColor: String(definition?.accentColor || "").trim(),
    scoreColor: String(definition?.scoreColor || "").trim(),
    secondaryTextColor: String(definition?.secondaryTextColor || "").trim(),
    throwLabelColor: String(definition?.throwLabelColor || "").trim(),
    activePlayerTintIntensity: Number.isFinite(definition?.activePlayerTintIntensity)
      ? Number(definition.activePlayerTintIntensity)
      : 15,
    backgroundDisplayMode: String(definition?.backgroundDisplayMode || "fill").trim(),
    backgroundOpacity: Number(definition?.backgroundOpacity) || 25,
    playerFieldTransparency: Number(definition?.playerFieldTransparency) || 10,
    backgroundAssetKey: String(definition?.backgroundAssetKey || "").trim(),
  };
  return Object.freeze(preset);
}

export const THEME_GLOBAL_TEMPLATE_PRESETS = Object.freeze([
  createPreset({
    key: "classic",
    label: "Classic",
    description: "Dunkle Fläche, klare Weißtöne und eine dezente Akzentfarbe ohne Wallpaper.",
    fontPreset: "goldman",
    accentColor: "#C7A96B",
    scoreColor: "#F7F8FA",
    secondaryTextColor: "#D9E0EA",
    throwLabelColor: "#AAB5C5",
    backgroundOpacity: 25,
    playerFieldTransparency: 10,
  }),
  createPreset({
    key: "broadcast",
    label: "Broadcast",
    description: "TV-Overlay-Look mit klaren Boxen, starken Kontrasten und ohne Wallpaper.",
    fontPreset: "archivo-black",
    accentColor: "#00D9FF",
    scoreColor: "#FFFFFF",
    secondaryTextColor: "#DCE9FF",
    throwLabelColor: "#8FA9C2",
    backgroundOpacity: 25,
    playerFieldTransparency: 10,
  }),
  createPreset({
    key: "british-flag",
    label: "British Flag",
    description: "Union-Jack-Farben mit Stencil-Schrift und lokalem Flag-Wallpaper.",
    fontPreset: "stardos-stencil",
    accentColor: "#C8102E",
    scoreColor: "#F7F9FC",
    secondaryTextColor: "#D6E1F2",
    throwLabelColor: "#012169",
    backgroundOpacity: 40,
    playerFieldTransparency: 15,
    backgroundAssetKey: "british-flag",
  }),
  createPreset({
    key: "cyberpunk",
    label: "Cyberpunk",
    description: "Neon-Cyan, Magenta und Lime auf dunklem Grund mit lokalem City-Wallpaper.",
    fontPreset: "audiowide",
    accentColor: "#2EF2FF",
    scoreColor: "#E8FF5A",
    secondaryTextColor: "#FFD0F5",
    throwLabelColor: "#FF5CD6",
    backgroundOpacity: 40,
    playerFieldTransparency: 30,
    backgroundAssetKey: "cyberpunk",
  }),
  createPreset({
    key: "matrix",
    label: "Matrix",
    description: "Terminal-Look in Schwarz-Grün mit Mono-Schrift und lokalem Matrix-Wallpaper.",
    fontPreset: "share-tech-mono",
    accentColor: "#7CFF00",
    scoreColor: "#C9FF8E",
    secondaryTextColor: "#6FCF97",
    throwLabelColor: "#2F7A49",
    backgroundOpacity: 25,
    playerFieldTransparency: 15,
    backgroundAssetKey: "matrix",
  }),
  createPreset({
    key: "fire",
    label: "Fire",
    description: "Warme Rot- und Gluttöne mit geschwungener Schrift und lokalem Fire-Wallpaper.",
    fontPreset: "caveat-brush",
    accentColor: "#FF5A1F",
    scoreColor: "#FFE4BF",
    secondaryTextColor: "#FFC16B",
    throwLabelColor: "#B71C1C",
    backgroundOpacity: 40,
    playerFieldTransparency: 30,
    backgroundAssetKey: "fire",
  }),
  createPreset({
    key: "ice",
    label: "Ice",
    description: "Kalte Blau-Weiß-Töne mit kantiger Schrift und lokalem Ice-Wallpaper.",
    fontPreset: "aldrich",
    accentColor: "#7FE7FF",
    scoreColor: "#F2FBFF",
    secondaryTextColor: "#C6E8FF",
    throwLabelColor: "#6EAEE6",
    backgroundOpacity: 40,
    playerFieldTransparency: 15,
    backgroundAssetKey: "ice",
  }),
]);

const presetsByKey = new Map(THEME_GLOBAL_TEMPLATE_PRESETS.map((preset) => [preset.key, preset]));

export function getThemeGlobalTemplatePreset(presetKey) {
  const key = String(presetKey || "").trim().toLowerCase();
  return presetsByKey.get(key) || null;
}

export function createThemeGlobalTemplatePresetPatch(presetKey) {
  const preset = getThemeGlobalTemplatePreset(presetKey);
  if (!preset) {
    return null;
  }

  return {
    featureToggles: {
      "themes.globalTypography": true,
    },
    features: {
      themes: {
        globalTypography: {
          enabled: true,
          fontPreset: preset.fontPreset,
          applyTo: [...preset.applyTo],
          accentColor: preset.accentColor,
          scoreColor: preset.scoreColor,
          secondaryTextColor: preset.secondaryTextColor,
          throwLabelColor: preset.throwLabelColor,
          activePlayerTintIntensity: preset.activePlayerTintIntensity,
          backgroundDisplayMode: preset.backgroundDisplayMode,
          backgroundOpacity: preset.backgroundOpacity,
          playerFieldTransparency: preset.playerFieldTransparency,
          backgroundImageDataUrl: "",
          backgroundAssetKey: preset.backgroundAssetKey,
          debug: false,
        },
      },
    },
  };
}
