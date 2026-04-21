import { clampNumber } from "./theme-utils.js";
import { resolveThemePresetAsset } from "#theme-preset-assets";

const BACKGROUND_DISPLAY_MODES = Object.freeze({
  fill: {
    size: "cover",
    position: "center center",
    repeat: "no-repeat",
  },
  fit: {
    size: "contain",
    position: "center center",
    repeat: "no-repeat",
  },
  stretch: {
    size: "100% 100%",
    position: "center center",
    repeat: "no-repeat",
  },
  center: {
    size: "auto",
    position: "center center",
    repeat: "no-repeat",
  },
  tile: {
    size: "auto",
    position: "left top",
    repeat: "repeat",
  },
});

function escapeCssUrl(urlValue) {
  return String(urlValue || "")
    .replaceAll("\\", String.raw`\\`)
    .replaceAll('"', String.raw`\"`);
}

function normalizeBackgroundMode(modeValue) {
  const normalized = String(modeValue || "").trim().toLowerCase();
  return BACKGROUND_DISPLAY_MODES[normalized] ? normalized : "fill";
}

function sanitizeBackgroundDataUrl(rawValue) {
  const dataUrl = String(rawValue || "").trim();
  if (!dataUrl.startsWith("data:image/")) {
    return "";
  }
  return dataUrl;
}

function sanitizeBackgroundUrl(rawValue) {
  const normalized = String(rawValue || "").trim();
  if (!normalized) {
    return "";
  }
  return normalized;
}

function resolveConfiguredBackgroundUrl(featureConfig = {}) {
  const storedImageUrl = sanitizeBackgroundDataUrl(featureConfig.backgroundImageDataUrl);
  if (storedImageUrl) {
    return storedImageUrl;
  }

  return sanitizeBackgroundUrl(resolveThemePresetAsset(featureConfig.backgroundAssetKey));
}

function normalizeThemeVisualConfig(candidate) {
  return candidate && typeof candidate === "object" && !Array.isArray(candidate) ? candidate : {};
}

export function resolveThemeVisualSettingsConfig(themeFeatureConfig = {}, globalTypographyConfig = {}) {
  const themeConfig = normalizeThemeVisualConfig(themeFeatureConfig);
  const globalConfig = normalizeThemeVisualConfig(globalTypographyConfig);
  const themeHasBackground = Boolean(resolveConfiguredBackgroundUrl(themeConfig));
  const globalHasBackground = Boolean(resolveConfiguredBackgroundUrl(globalConfig));

  if (themeHasBackground) {
    return themeConfig;
  }

  if (globalConfig.enabled && globalHasBackground) {
    return globalConfig;
  }

  return themeConfig;
}

export function buildThemeVisualSettingsCss(featureConfig = {}) {
  const displayMode = BACKGROUND_DISPLAY_MODES[normalizeBackgroundMode(featureConfig.backgroundDisplayMode)];
  const backgroundOpacity = clampNumber(featureConfig.backgroundOpacity, 0, 100, 25);
  const playerFieldTransparency = clampNumber(featureConfig.playerFieldTransparency, 0, 95, 10);
  const overlayAlpha = clampNumber((100 - backgroundOpacity) / 100, 0, 1, 0.75);
  const playerFieldAlpha = clampNumber((100 - playerFieldTransparency) / 100, 0.05, 1, 0.9);
  const backgroundUrl = resolveConfiguredBackgroundUrl(featureConfig);

  const playerFieldCss = `
#ad-ext-player-display .ad-ext-player{
  min-height: 0 !important;
  height: auto !important;
}
#ad-ext-player-display .ad-ext-player > .chakra-stack{
  min-height: 0 !important;
  height: 100% !important;
  background:
    linear-gradient(
      180deg,
      var(--ad-ext-theme-card-tint-top-current),
      var(--ad-ext-theme-card-tint-bottom-current)
    ),
    rgba(8, 12, 24, ${playerFieldAlpha.toFixed(3)}) !important;
}
#ad-ext-player-display .ad-ext-player > .chakra-stack > *{
  background: transparent !important;
}
`;

  if (!backgroundUrl) {
    return playerFieldCss;
  }

  const escapedBackgroundUrl = escapeCssUrl(backgroundUrl);
  return `
html,
body,
div.css-gmuwbf,
div.css-tkevr6,
div.css-nfhdnc {
  background-color: #06080d !important;
  background-image:
    linear-gradient(rgba(6, 8, 13, ${overlayAlpha.toFixed(3)}), rgba(6, 8, 13, ${overlayAlpha.toFixed(3)})),
    url("${escapedBackgroundUrl}") !important;
  background-size: ${displayMode.size} !important;
  background-position: ${displayMode.position} !important;
  background-repeat: ${displayMode.repeat} !important;
}
${playerFieldCss}
`;
}

