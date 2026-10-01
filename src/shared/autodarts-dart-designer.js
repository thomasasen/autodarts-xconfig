export const AUTODARTS_DART_DESIGNER_URL =
  "https://play.autodarts.com/settings/customise-darts";
export const AUTODARTS_DART_DESIGNER_PATH = "/settings/customise-darts";

export const AUTODARTS_DART_DESIGNER_PARTS = Object.freeze([
  Object.freeze({ key: "flightShape", tabIndex: 0, fallbackLabel: "Flight-Form" }),
  Object.freeze({ key: "flight", tabIndex: 1, fallbackLabel: "Flight" }),
  Object.freeze({ key: "shaft", tabIndex: 2, fallbackLabel: "Schaft" }),
  Object.freeze({ key: "barrel", tabIndex: 3, fallbackLabel: "Barrel" }),
  Object.freeze({ key: "point", tabIndex: 4, fallbackLabel: "Spitze" }),
]);

const MAX_DESIGNER_LABEL_LENGTH = 80;
const MAX_DESIGNER_OPTION_INDEX = 64;

function normalizeLabel(value) {
  return String(value || "")
    .replaceAll(/\s+/g, " ")
    .trim()
    .slice(0, MAX_DESIGNER_LABEL_LENGTH);
}

function normalizeSelection(rawSelection, part) {
  if (!rawSelection || typeof rawSelection !== "object" || Array.isArray(rawSelection)) {
    return null;
  }

  const optionIndex = Number(rawSelection.optionIndex);
  const optionLabel = normalizeLabel(rawSelection.optionLabel);
  if (
    !Number.isInteger(optionIndex) ||
    optionIndex < 0 ||
    optionIndex > MAX_DESIGNER_OPTION_INDEX ||
    !optionLabel
  ) {
    return null;
  }

  return {
    tabIndex: part.tabIndex,
    tabLabel: normalizeLabel(rawSelection.tabLabel) || part.fallbackLabel,
    optionIndex,
    optionLabel,
  };
}

export function normalizeAutodartsDartDesignerConfig(rawConfig) {
  if (!rawConfig || typeof rawConfig !== "object" || Array.isArray(rawConfig)) {
    return null;
  }

  const rawParts = rawConfig.parts;
  if (!rawParts || typeof rawParts !== "object" || Array.isArray(rawParts)) {
    return null;
  }

  const parts = {};
  for (const part of AUTODARTS_DART_DESIGNER_PARTS) {
    const selection = normalizeSelection(rawParts[part.key], part);
    if (!selection) {
      return null;
    }
    parts[part.key] = selection;
  }

  return {
    version: 1,
    parts,
  };
}

export function hasCompleteAutodartsDartDesignerConfig(rawConfig) {
  return Boolean(normalizeAutodartsDartDesignerConfig(rawConfig));
}
