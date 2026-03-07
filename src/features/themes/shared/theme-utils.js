export const PREVIEW_SPACE_CLASS = "ad-ext-turn-preview-space";

export function normalizeBoolean(value, fallbackValue = false) {
  if (typeof value === "boolean") {
    return value;
  }

  const normalized = String(value || "").trim().toLowerCase();
  if (["1", "true", "yes", "on", "aktiv", "active"].includes(normalized)) {
    return true;
  }
  if (["0", "false", "no", "off", "inaktiv", "inactive"].includes(normalized)) {
    return false;
  }
  return Boolean(fallbackValue);
}

export function clampNumber(value, minValue, maxValue, fallbackValue) {
  const numeric = Number(value);
  const resolved = Number.isFinite(numeric) ? numeric : Number(fallbackValue);
  if (!Number.isFinite(resolved)) {
    return Number(minValue);
  }
  return Math.min(Math.max(resolved, Number(minValue)), Number(maxValue));
}

export function normalizeThemeKey(themeKey) {
  const normalized = String(themeKey || "").trim().toLowerCase();
  if (!normalized) {
    return "";
  }

  const aliases = {
    x01: "x01",
    shanghai: "shanghai",
    bermuda: "bermuda",
    cricket: "cricket",
    tactics: "cricket",
    bulloff: "bullOff",
    "bull-off": "bullOff",
    "bull_off": "bullOff",
  };

  if (Object.prototype.hasOwnProperty.call(aliases, normalized)) {
    return aliases[normalized];
  }

  return "";
}

export function normalizeVariant(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function getVariantName(gameState, documentRef) {
  if (gameState && typeof gameState.getVariant === "function") {
    const variantFromState = normalizeVariant(gameState.getVariant());
    if (variantFromState) {
      return variantFromState;
    }
  }

  if (documentRef && typeof documentRef.getElementById === "function") {
    const variantElement = documentRef.getElementById("ad-ext-game-variant");
    return normalizeVariant(variantElement?.textContent || "");
  }

  return "";
}

function isCricketOrTactics(variantName) {
  return (
    variantName === "cricket" ||
    variantName.startsWith("cricket ") ||
    variantName === "tactics" ||
    variantName.startsWith("tactics ")
  );
}

export function isThemeVariantActive(options = {}) {
  const variantName = normalizeVariant(options.variantName);
  if (!variantName) {
    return false;
  }

  const matchMode = String(options.matchMode || "equals").trim().toLowerCase();
  const gameState = options.gameState || null;
  const currentVariant = getVariantName(gameState, options.documentRef);

  if (variantName === "x01") {
    if (gameState && typeof gameState.isX01Variant === "function") {
      return gameState.isX01Variant({
        allowMissing: false,
        allowEmpty: false,
        allowNumeric: true,
      });
    }
    return currentVariant.includes("x01") || /\b\d+01\b/.test(currentVariant);
  }

  if (variantName === "cricket") {
    if (gameState && typeof gameState.isCricketVariant === "function") {
      return gameState.isCricketVariant({
        allowMissing: false,
        allowEmpty: false,
        includeHiddenCricket: false,
      });
    }
    return isCricketOrTactics(currentVariant);
  }

  if (!currentVariant) {
    return false;
  }

  if (matchMode === "includes") {
    return currentVariant.includes(variantName);
  }

  return currentVariant === variantName || currentVariant.startsWith(`${variantName} `);
}

export function buildPreviewPlacementCss(previewOptions = {}) {
  const mode = String(previewOptions.mode || "standard").trim().toLowerCase();
  if (mode !== "under-throws") {
    return "";
  }

  const className = String(previewOptions.previewSpaceClass || PREVIEW_SPACE_CLASS).trim();
  if (!className) {
    return "";
  }

  const previewHeightPx = clampNumber(previewOptions.previewHeightPx, 40, 260, 128);
  const previewGapPx = clampNumber(previewOptions.previewGapPx, 0, 48, 8);
  return `
#ad-ext-turn.${className}{
  padding-bottom: ${Math.round(previewHeightPx + previewGapPx)}px !important;
}
`;
}

export function togglePreviewSpace(documentRef, previewOptions = {}, enabled = false) {
  const mode = String(previewOptions.mode || "standard").trim().toLowerCase();
  if (mode !== "under-throws") {
    return;
  }

  const className = String(previewOptions.previewSpaceClass || PREVIEW_SPACE_CLASS).trim();
  if (!className || !documentRef || typeof documentRef.getElementById !== "function") {
    return;
  }

  const turnNode = documentRef.getElementById("ad-ext-turn");
  if (!turnNode || !turnNode.classList || typeof turnNode.classList.toggle !== "function") {
    return;
  }

  turnNode.classList.toggle(className, Boolean(enabled));
}
