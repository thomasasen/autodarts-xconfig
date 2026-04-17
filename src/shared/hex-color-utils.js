const HEX_COLOR_INPUT_PATTERN = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;
const HEX_COLOR_NORMALIZED_PATTERN = /^#[0-9A-F]{6}$/;

function expandShortHexColor(value) {
  const normalized = String(value || "").trim();
  if (!/^#[0-9a-f]{3}$/i.test(normalized)) {
    return normalized;
  }

  const [, red, green, blue] = normalized;
  return `#${red}${red}${green}${green}${blue}${blue}`;
}

export function isHexColorInputValue(value) {
  return HEX_COLOR_INPUT_PATTERN.test(String(value || "").trim());
}

export function normalizeHexColor(value, fallbackValue = "") {
  const normalized = String(value || "").trim();
  if (!normalized) {
    return "";
  }
  if (!isHexColorInputValue(normalized)) {
    return String(fallbackValue || "").trim();
  }

  return expandShortHexColor(normalized).toUpperCase();
}

export function isNormalizedHexColorValue(value) {
  return HEX_COLOR_NORMALIZED_PATTERN.test(String(value || "").trim());
}

export function hexColorToRgb(colorValue) {
  const normalized = normalizeHexColor(colorValue, "");
  if (!normalized) {
    return null;
  }

  return {
    red: Number.parseInt(normalized.slice(1, 3), 16),
    green: Number.parseInt(normalized.slice(3, 5), 16),
    blue: Number.parseInt(normalized.slice(5, 7), 16),
  };
}

export function hexColorToRgba(colorValue, alpha = 1) {
  const rgb = hexColorToRgb(colorValue);
  if (!rgb) {
    return "";
  }

  const normalizedAlpha = Math.min(1, Math.max(0, Number(alpha) || 0));
  return `rgba(${rgb.red}, ${rgb.green}, ${rgb.blue}, ${normalizedAlpha})`;
}
