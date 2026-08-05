import {
  buildThemeGlobalTypographyBunnyUrl,
  getThemeGlobalTypographyPreset,
  getThemeGlobalTypographyScopeValues,
} from "../../../shared/theme-global-typography-presets.js";
import {
  hexColorToRgba,
  normalizeHexColor,
} from "../../../shared/hex-color-utils.js";
import { resolveTurnDartAsset } from "#feature-assets";

export const STYLE_ID = "ad-ext-theme-global-typography-style";
export const TOOLS_SHADOW_STYLE_ID = "ad-ext-theme-global-typography-tools-style";

const TURN_DART_PLACEHOLDER_DATA_URL =
  "data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20viewBox=%220%200%20477%20102%22%3E%3C/svg%3E";
const TURN_DART_LARGE_SIZE_BOOST = 1.25;
const TURN_DART_PRESET_SIZE_BOOST = 1.7;
const TURN_DART_IMAGE_SELECTOR = `#ad-ext-turn > .ad-ext-turn-throw img[alt="Dart"],
#ad-ext-turn > .score img[alt="Dart"]`;
const TURN_SUGGESTION_DART_SELECTOR = `#ad-ext-turn > .suggestion img[alt="Dart"]`;

export const THEME_GLOBAL_TYPOGRAPHY_SELECTOR_GROUPS = Object.freeze({
  scores: Object.freeze([
    ".ad-ext-player-score",
    ".ad-ext-turn-points",
    "#ad-ext-turn > .score",
  ]),
  throws: Object.freeze([
    "#ad-ext-turn > .ad-ext-turn-throw",
    "#ad-ext-turn > .suggestion",
    "#ad-ext-turn > .suggestion *",
    ".ad-ext-checkout-suggestion",
    ".ad-ext-checkout-suggestion *",
  ]),
  names: Object.freeze([
    ".ad-ext-player-name",
    ".ad-ext-player-name > p",
  ]),
});

export function getThemeGlobalTypographySelectors(applyTo = ["scores"]) {
  const scopeValues = getThemeGlobalTypographyScopeValues(applyTo);
  const selectors = scopeValues.flatMap((scopeValue) =>
    THEME_GLOBAL_TYPOGRAPHY_SELECTOR_GROUPS[scopeValue] || []
  );
  const uniqueSelectors = Array.from(new Set(selectors));
  return uniqueSelectors.length
    ? uniqueSelectors
    : [...THEME_GLOBAL_TYPOGRAPHY_SELECTOR_GROUPS.scores];
}

function buildThemeGlobalTypographyColorDeclarations(featureConfig = {}) {
  const accentColor = normalizeHexColor(featureConfig.accentColor, "");
  const scoreColor = normalizeHexColor(featureConfig.scoreColor, "");
  const secondaryTextColor = normalizeHexColor(featureConfig.secondaryTextColor, "");
  const throwLabelColor = normalizeHexColor(featureConfig.throwLabelColor, "");
  const activePlayerTintIntensity = Math.max(
    0,
    Number.parseInt(featureConfig.activePlayerTintIntensity, 10) || 0
  );
  const declarations = [];

  if (accentColor) {
    declarations.push(
      `--ad-ext-theme-accent-color: ${accentColor};`,
      `--ad-ext-theme-card-active-border-color: ${accentColor};`,
      `--ad-ext-theme-card-active-outline-color: ${hexColorToRgba(accentColor, 0.24)};`,
      `--ad-ext-theme-score-active-color: ${accentColor};`,
      `--ad-ext-theme-score-winner-color: ${accentColor};`
    );
  }

  if (scoreColor) {
    declarations.push(
      `--ad-ext-theme-text-primary-color: ${scoreColor};`,
      `--ad-ext-theme-score-color: ${scoreColor};`,
      `--ad-ext-theme-score-inactive-color: ${scoreColor};`,
      `--ad-ext-theme-turn-points-color: ${scoreColor};`
    );
  }

  if (secondaryTextColor) {
    declarations.push(
      `--ad-ext-theme-text-secondary-color: ${secondaryTextColor};`,
      `--ad-ext-theme-name-color: ${secondaryTextColor};`,
      `--ad-ext-theme-name-active-color: ${secondaryTextColor};`,
      `--ad-ext-theme-name-inactive-color: ${secondaryTextColor};`,
      `--ad-ext-theme-name-winner-color: ${secondaryTextColor};`,
      `--ad-ext-theme-meta-color: ${secondaryTextColor};`,
      `--ad-ext-theme-meta-active-color: ${secondaryTextColor};`,
      `--ad-ext-theme-meta-inactive-color: ${secondaryTextColor};`,
      `--ad-ext-theme-meta-winner-color: ${secondaryTextColor};`
    );
  }

  if (throwLabelColor) {
    declarations.push(`--ad-ext-theme-throw-label-color: ${throwLabelColor};`);
  }

  if (activePlayerTintIntensity > 0) {
    const bottomIntensity = Math.max(
      0,
      Math.min(activePlayerTintIntensity, Math.round(activePlayerTintIntensity * 0.5))
    );
    declarations.push(
      `--ad-ext-theme-active-card-tint-top: color-mix(in srgb, var(--ad-ext-theme-card-active-border-color) ${activePlayerTintIntensity}%, transparent);`,
      `--ad-ext-theme-active-card-tint-bottom: color-mix(in srgb, var(--ad-ext-theme-card-active-border-color) ${bottomIntensity}%, transparent);`
    );
  }

  return declarations;
}

function cssString(value) {
  return JSON.stringify(String(value || ""));
}

function buildCssCounterContent(template) {
  const parts = String(template || "").split("#");
  const contentParts = [];
  parts.forEach((part, index) => {
    if (part) {
      contentParts.push(cssString(part));
    }
    if (index < parts.length - 1) {
      contentParts.push("counter(ad-ext-turn-dart-text)");
    }
  });
  return contentParts.join(" ");
}

function buildTurnDartSvgDataUrl(featureConfig = {}) {
  const style = String(featureConfig.turnDartStyle || "").trim().toLowerCase();
  if (style !== "solid" && style !== "gradient") {
    return "";
  }

  const dartColor = normalizeHexColor(featureConfig.turnDartColor, "#FFFFFF");
  const gradientColor = normalizeHexColor(featureConfig.turnDartGradientColor, "#F97316");
  const fill =
    style === "gradient"
      ? "url(#ad-ext-turn-dart-gradient)"
      : dartColor;
  const defs =
    style === "gradient"
      ? `<defs><linearGradient id="ad-ext-turn-dart-gradient" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${gradientColor}"/><stop offset="0.45" stop-color="${dartColor}"/><stop offset="1" stop-color="#F8FAFC"/></linearGradient></defs>`
      : "";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 477 102">${defs}<path fill="${fill}" stroke="rgba(15,23,42,0.72)" stroke-width="2" d="M26.56.5h53.65l.14.11,55.78,45,42.2-.07,42.49.07c.95-.56,6.88-4,10.06-4h152.73c2.11,0,4.43.36,6.9,1.07,1.96.56,4.03,1.35,6.13,2.34,3.16,1.48,5.42,2.94,5.98,3.31,2.04,0,23.83-.1,40.68-.1,10.34,0,16.83.03,19.29.1,5.75.16,13.13,1.98,13.95,2.19h.02s-.12.48-.12.48h0s.12.5.12.5h-.02c-.82.21-8.2,2.02-13.95,2.19-2.45.07-8.94.1-19.29.1-16.85,0-38.64-.09-40.68-.1-.56.37-2.82,1.83-5.98,3.31-3.32,1.55-8.27,3.41-13.03,3.41h-152.73c-3.19,0-9.11-3.44-10.06-4l-42.49.07-42.2-.07-55.78,45-.14.11H26.56l-.14-.27L1,51.23l-.12-.23.12-.23L26.43.77l.14-.27Z"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function resolveUploadedTurnDartImageUrl(featureConfig = {}) {
  const dataUrl = String(featureConfig.turnDartImageDataUrl || "").trim();
  return dataUrl.startsWith("data:image/") ? dataUrl : "";
}

function resolveTurnDartImage(featureConfig = {}) {
  const style = String(featureConfig.turnDartStyle || "").trim().toLowerCase();
  if (style === "image") {
    return {
      source: "upload",
      url: resolveUploadedTurnDartImageUrl(featureConfig),
    };
  }
  if (style === "preset") {
    return {
      source: "preset",
      url: resolveTurnDartAsset(featureConfig.turnDartAssetKey),
    };
  }

  return {
    source: "generated",
    url: buildTurnDartSvgDataUrl(featureConfig),
  };
}

function buildTurnDartTextStyleBlock(featureConfig, sizeScale, widthPx, heightPx) {
  const image = resolveTurnDartImage(featureConfig);
  if (image.url && (image.source === "upload" || image.source === "preset")) {
    return "";
  }

  const textTemplate = String(featureConfig.turnDartTextTemplate || "").trim();
  const contentValue = buildCssCounterContent(textTemplate);
  if (!contentValue) {
    return "";
  }

  const dartColor = normalizeHexColor(featureConfig.turnDartColor, "#FFFFFF");
  const preset = getThemeGlobalTypographyPreset(featureConfig.fontPreset);
  const fontFamily = preset?.fontFamily || "inherit";
  const fontSizePx = Math.round(18 * sizeScale);
  return `#ad-ext-turn {
  counter-reset: ad-ext-turn-dart-text;
}

#ad-ext-turn > .score:has(> img[alt="Dart"]) {
  position: relative !important;
}

#ad-ext-turn > .score:has(> img[alt="Dart"]) > img[alt="Dart"] {
  content: url(${cssString(TURN_DART_PLACEHOLDER_DATA_URL)}) !important;
  width: ${widthPx}px !important;
  height: ${heightPx}px !important;
  opacity: 0 !important;
}

#ad-ext-turn > .score:has(> img[alt="Dart"])::before {
  counter-increment: ad-ext-turn-dart-text;
  content: ${contentValue};
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  max-width: calc(100% - 1rem);
  color: ${dartColor};
  font-family: ${fontFamily} !important;
  font-size: ${fontSizePx}px;
  font-weight: 800;
  line-height: 1;
  white-space: nowrap;
  text-align: center;
  text-shadow: 0 0 7px rgba(0, 0, 0, 0.72), 0 0 12px ${dartColor};
  pointer-events: none;
}

${buildTurnSuggestionDartGuardStyleBlock()}`;
}

function buildTurnSuggestionDartGuardStyleBlock() {
  return `${TURN_SUGGESTION_DART_SELECTOR} {
  opacity: 0 !important;
  pointer-events: none !important;
}`;
}

function buildTurnDartStyleBlock(featureConfig = {}) {
  const sizePercent = Number(featureConfig.turnDartSizePercent);
  const normalizedSizePercent = [100, 115, 135].includes(sizePercent) ? sizePercent : 115;
  const configuredSizeScale =
    normalizedSizePercent === 135
      ? (normalizedSizePercent / 100) * TURN_DART_LARGE_SIZE_BOOST
      : normalizedSizePercent / 100;
  const style = String(featureConfig.turnDartStyle || "").trim().toLowerCase();
  const sizeScale = style === "preset"
    ? configuredSizeScale * TURN_DART_PRESET_SIZE_BOOST
    : configuredSizeScale;
  const widthPx = Math.round(120 * sizeScale);
  const heightPx = Math.round(26 * sizeScale);
  const textStyleBlock = buildTurnDartTextStyleBlock(featureConfig, sizeScale, widthPx, heightPx);
  if (textStyleBlock) {
    return textStyleBlock;
  }

  const turnDartImage = resolveTurnDartImage(featureConfig);
  const imageUrl = turnDartImage.url;
  if (!imageUrl) {
    return "";
  }

  const isUploadedImage = turnDartImage.source === "upload";
  const shineFilter = featureConfig.turnDartShineEnabled === false
    ? "none"
    : "drop-shadow(0 0 5px rgba(255, 255, 255, 0.34))";
  const objectFit = isUploadedImage ? "cover" : "contain";
  const imageDeclarations =
    isUploadedImage
      ? [
          `content: url(${cssString(TURN_DART_PLACEHOLDER_DATA_URL)}) !important;`,
          `background-image: url(${cssString(imageUrl)}) !important;`,
          "background-size: 100% auto !important;",
          "background-position: center center !important;",
          "background-repeat: no-repeat !important;",
        ]
      : [`content: url(${cssString(imageUrl)}) !important;`];

  return `${TURN_DART_IMAGE_SELECTOR} {
  ${imageDeclarations.join("\n  ")}
  width: ${widthPx}px !important;
  height: ${heightPx}px !important;
  object-fit: ${objectFit} !important;
  opacity: 1 !important;
  filter: ${shineFilter} !important;
}

${buildTurnSuggestionDartGuardStyleBlock()}`;
}

export function buildThemeGlobalTypographyStyleText(featureConfig = {}) {
  const preset = getThemeGlobalTypographyPreset(featureConfig.fontPreset);
  const selectors = getThemeGlobalTypographySelectors(featureConfig.applyTo);
  const colorDeclarations = buildThemeGlobalTypographyColorDeclarations(featureConfig);
  const turnDartStyleBlock = buildTurnDartStyleBlock(featureConfig);
  const blocks = [];
  let imports = "";

  if (preset && Array.isArray(selectors) && selectors.length) {
    const remoteUrl = preset.remote
      ? buildThemeGlobalTypographyBunnyUrl(preset.familyName)
      : "";
    imports = remoteUrl ? `@import url("${remoteUrl}");\n\n` : "";
    const selectorText = selectors.join(",\n");
    blocks.push(`${selectorText} {\n  font-family: ${preset.fontFamily} !important;\n}`);
  }

  if (colorDeclarations.length) {
    blocks.push(`:root {\n  ${colorDeclarations.join("\n  ")}\n}`);
  }

  if (turnDartStyleBlock) {
    blocks.push(turnDartStyleBlock);
  }

  return blocks.length ? `${imports}${blocks.join("\n\n")}` : "";
}
