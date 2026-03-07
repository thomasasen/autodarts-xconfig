import { clampNumber } from "./theme-utils.js";

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
  return String(urlValue || "").replace(/\\/g, "\\\\").replace(/"/g, '\\"');
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

export function buildThemeVisualSettingsCss(featureConfig = {}) {
  const displayMode = BACKGROUND_DISPLAY_MODES[normalizeBackgroundMode(featureConfig.backgroundDisplayMode)];
  const backgroundOpacity = clampNumber(featureConfig.backgroundOpacity, 0, 100, 25);
  const playerFieldTransparency = clampNumber(featureConfig.playerFieldTransparency, 0, 95, 10);
  const overlayAlpha = clampNumber((100 - backgroundOpacity) / 100, 0, 1, 0.75);
  const playerFieldAlpha = clampNumber((100 - playerFieldTransparency) / 100, 0.05, 1, 0.9);
  const backgroundDataUrl = sanitizeBackgroundDataUrl(featureConfig.backgroundImageDataUrl);

  const playerFieldCss = `
#ad-ext-player-display .ad-ext-player > .chakra-stack{
  background: rgba(8, 12, 24, ${playerFieldAlpha.toFixed(3)}) !important;
}
#ad-ext-player-display .ad-ext-player > .chakra-stack > *{
  background: transparent !important;
}
`;

  if (!backgroundDataUrl) {
    return playerFieldCss;
  }

  const escapedDataUrl = escapeCssUrl(backgroundDataUrl);
  return `
div.css-gmuwbf,
div.css-tkevr6,
div.css-nfhdnc {
  background-color: #06080d !important;
  background-image:
    linear-gradient(rgba(6, 8, 13, ${overlayAlpha.toFixed(3)}), rgba(6, 8, 13, ${overlayAlpha.toFixed(3)})),
    url("${escapedDataUrl}") !important;
  background-size: ${displayMode.size} !important;
  background-position: ${displayMode.position} !important;
  background-repeat: ${displayMode.repeat} !important;
}
${playerFieldCss}
`;
}

