import { resolveTurnDartAsset } from "#feature-assets";
import { normalizeHexColor } from "../../shared/hex-color-utils.js";

export const TURN_DART_DISPLAY_STYLE_ID = "ad-ext-turn-dart-display-style";

const TURN_DART_PLACEHOLDER_DATA_URL =
  "data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20viewBox=%220%200%20477%20102%22%3E%3C/svg%3E";
const TURN_DART_LARGE_SIZE_BOOST = 1.25;
const TURN_DART_PRESET_SIZE_BOOST = 1.7;
const TURN_DART_IMAGE_SELECTOR = `#ad-ext-turn > .ad-ext-turn-throw img[alt="Dart"],
#ad-ext-turn > .score img[alt="Dart"]`;
const TURN_SUGGESTION_DART_SELECTOR = `#ad-ext-turn > .suggestion img[alt="Dart"]`;



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
  font-family: inherit !important;
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

export function buildTurnDartDisplayStyleText(featureConfig = {}) {
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
  const heightPx = Math.round(40 * sizeScale);
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
  const imageDeclarations =
    isUploadedImage
      ? [
          `content: url(${cssString(TURN_DART_PLACEHOLDER_DATA_URL)}) !important;`,
          `background-image: url(${cssString(imageUrl)}) !important;`,
          "background-size: contain !important;",
          "background-position: right center !important;",
          "background-repeat: no-repeat !important;",
        ]
      : [`content: url(${cssString(imageUrl)}) !important;`];

  return `${TURN_DART_IMAGE_SELECTOR} {
  ${imageDeclarations.join("\n  ")}
  width: ${widthPx}px !important;
  height: ${heightPx}px !important;
  object-fit: contain !important;
  object-position: right center !important;
  opacity: 1 !important;
  filter: ${shineFilter} !important;
}

${buildTurnSuggestionDartGuardStyleBlock()}`;
}
