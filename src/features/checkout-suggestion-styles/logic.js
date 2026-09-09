import {
  BASE_CLASS,
  LAYOUT_CLASS,
  MODERN_CLASS,
  NO_LABEL_CLASS,
  STYLE_CLASSES,
  STYLE_CLASS_LIST,
} from "./style.js";
import {
  findModernTurnSurface,
  isMatchNodeVisible,
} from "../shared/x01-match-surface.js";

export const SUGGESTION_SELECTOR = ".suggestion";
export const MODERN_SUGGESTION_SELECTOR = ".text-checkout-suggestion";
export const VARIANT_ELEMENT_ID = "ad-ext-game-variant";

const COLOR_THEMES = Object.freeze({
  amber: {
    accentColor: "#f59e0b",
    accentSoftColor: "rgba(245, 158, 11, 0.16)",
    accentStrongColor: "rgba(245, 158, 11, 0.6)",
    labelBackground: "#fcd34d",
    labelTextColor: "#1f1300",
  },
  cyan: {
    accentColor: "#06b6d4",
    accentSoftColor: "rgba(6, 182, 212, 0.16)",
    accentStrongColor: "rgba(6, 182, 212, 0.58)",
    labelBackground: "#67e8f9",
    labelTextColor: "#082f35",
  },
  rose: {
    accentColor: "#f43f5e",
    accentSoftColor: "rgba(244, 63, 94, 0.15)",
    accentStrongColor: "rgba(244, 63, 94, 0.58)",
    labelBackground: "#fda4af",
    labelTextColor: "#4a1020",
  },
});

function getTheme(themeName) {
  const normalized = String(themeName || "").trim().toLowerCase();
  return COLOR_THEMES[normalized] || COLOR_THEMES.amber;
}

export function isModernSuggestionNode(node) {
  return Boolean(node?.classList?.contains("text-checkout-suggestion"));
}

export function findModernSuggestionLayoutNode(
  documentRef,
  windowRef = documentRef?.defaultView
) {
  return findModernTurnSurface(documentRef, windowRef)?.turnContainer || null;
}

export function applySuggestionLayout(node) {
  node?.classList?.add(LAYOUT_CLASS);
}

export function resetSuggestionLayout(node) {
  node?.classList?.remove(LAYOUT_CLASS);
}

export function collectSuggestions(
  documentRef,
  windowRef = documentRef?.defaultView
) {
  if (!documentRef || typeof documentRef.querySelectorAll !== "function") {
    return [];
  }

  const suggestions = Array.from(documentRef.querySelectorAll(SUGGESTION_SELECTOR));
  const seen = new Set(suggestions);
  const modernTurnSurface = findModernTurnSurface(documentRef, windowRef);

  (modernTurnSurface?.throwRows || []).forEach((node) => {
    if (
      !seen.has(node) &&
      isModernSuggestionNode(node) &&
      isMatchNodeVisible(node, windowRef)
    ) {
      seen.add(node);
      suggestions.push(node);
    }
  });

  return suggestions;
}

export function isX01Active({ gameState, documentRef, windowRef, variantRules }) {
  if (gameState && typeof gameState.isX01Variant === "function") {
    const gameStateIsX01 = gameState.isX01Variant({
      allowMissing: false,
      allowEmpty: false,
      allowNumeric: true,
    });
    if (gameStateIsX01) {
      return true;
    }
  }

  if (!documentRef) {
    return false;
  }

  if (
    typeof documentRef.getElementById === "function" &&
    variantRules &&
    typeof variantRules.isX01VariantText === "function"
  ) {
    const variantText = String(
      documentRef.getElementById(VARIANT_ELEMENT_ID)?.textContent || ""
    );
    if (variantRules.isX01VariantText(variantText, {
      allowMissing: false,
      allowEmpty: false,
      allowNumeric: true,
    })) {
      return true;
    }
  }

  return (findModernTurnSurface(documentRef, windowRef)?.throwRows || []).some(
    (node) => isModernSuggestionNode(node) && isMatchNodeVisible(node, windowRef)
  );
}

export function resetSuggestionNode(node) {
  if (!node?.classList || !node.style) {
    return;
  }

  node.classList.remove(BASE_CLASS, MODERN_CLASS, NO_LABEL_CLASS, ...STYLE_CLASS_LIST);
  delete node.dataset?.adExtLabel;
  node.style.removeProperty("--ad-ext-accent");
  node.style.removeProperty("--ad-ext-accent-soft");
  node.style.removeProperty("--ad-ext-accent-strong");
  node.style.removeProperty("--ad-ext-label-bg");
  node.style.removeProperty("--ad-ext-label-color");
  node.style.removeProperty("--ad-ext-radius");
  node.style.removeProperty("--ad-ext-stripe-opacity");
}

export function applySuggestionStyle(node, featureConfig = {}, options = {}) {
  if (!node?.classList || !node.style) {
    return;
  }

  const desiredClass =
    STYLE_CLASSES[String(featureConfig.style || "").trim().toLowerCase()] ||
    STYLE_CLASSES.badge;
  const theme = getTheme(featureConfig.colorTheme);
  const labelText = options.showLabel === false
    ? ""
    : String(featureConfig.labelText || "").trim();

  node.classList.add(BASE_CLASS);
  node.classList.toggle(MODERN_CLASS, isModernSuggestionNode(node));
  node.classList.remove(...STYLE_CLASS_LIST);
  node.classList.add(desiredClass);
  node.classList.toggle(NO_LABEL_CLASS, !labelText);

  if (labelText) {
    node.dataset.adExtLabel = labelText;
  } else {
    delete node.dataset?.adExtLabel;
  }

  node.style.setProperty("--ad-ext-accent", theme.accentColor);
  node.style.setProperty("--ad-ext-accent-soft", theme.accentSoftColor);
  node.style.setProperty("--ad-ext-accent-strong", theme.accentStrongColor);
  node.style.setProperty("--ad-ext-label-bg", theme.labelBackground);
  node.style.setProperty("--ad-ext-label-color", theme.labelTextColor);
  node.style.setProperty("--ad-ext-radius", "14px");
  node.style.setProperty("--ad-ext-stripe-opacity", "0.35");
}
