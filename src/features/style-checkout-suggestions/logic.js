import {
  BASE_CLASS,
  NO_LABEL_CLASS,
  STYLE_CLASSES,
  STYLE_CLASS_LIST,
} from "./style.js";

export const SUGGESTION_SELECTOR = ".suggestion";
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

export function collectSuggestions(documentRef) {
  if (!documentRef || typeof documentRef.querySelectorAll !== "function") {
    return [];
  }
  return Array.from(documentRef.querySelectorAll(SUGGESTION_SELECTOR));
}

export function isX01Active({ gameState, documentRef, variantRules }) {
  if (gameState && typeof gameState.isX01Variant === "function") {
    return gameState.isX01Variant({
      allowMissing: false,
      allowEmpty: false,
      allowNumeric: true,
    });
  }

  if (!documentRef || typeof documentRef.getElementById !== "function") {
    return false;
  }
  if (!variantRules || typeof variantRules.isX01VariantText !== "function") {
    return false;
  }

  const variantText = String(
    documentRef.getElementById(VARIANT_ELEMENT_ID)?.textContent || ""
  );
  return variantRules.isX01VariantText(variantText, {
    allowMissing: false,
    allowEmpty: false,
    allowNumeric: true,
  });
}

export function resetSuggestionNode(node) {
  if (!node || !node.classList || !node.style) {
    return;
  }

  node.classList.remove(BASE_CLASS, NO_LABEL_CLASS, ...STYLE_CLASS_LIST);
  if (typeof node.removeAttribute === "function") {
    node.removeAttribute("data-ad-ext-label");
  }
  node.style.removeProperty("--ad-ext-accent");
  node.style.removeProperty("--ad-ext-accent-soft");
  node.style.removeProperty("--ad-ext-accent-strong");
  node.style.removeProperty("--ad-ext-label-bg");
  node.style.removeProperty("--ad-ext-label-color");
  node.style.removeProperty("--ad-ext-radius");
  node.style.removeProperty("--ad-ext-stripe-opacity");
}

export function applySuggestionStyle(node, featureConfig = {}) {
  if (!node || !node.classList || !node.style) {
    return;
  }

  const desiredClass =
    STYLE_CLASSES[String(featureConfig.style || "").trim().toLowerCase()] ||
    STYLE_CLASSES.badge;
  const theme = getTheme(featureConfig.colorTheme);
  const labelText = String(featureConfig.labelText || "").trim();

  node.classList.add(BASE_CLASS);
  node.classList.remove(...STYLE_CLASS_LIST);
  node.classList.add(desiredClass);
  node.classList.toggle(NO_LABEL_CLASS, !labelText);

  if (labelText && typeof node.setAttribute === "function") {
    node.setAttribute("data-ad-ext-label", labelText);
  } else if (typeof node.removeAttribute === "function") {
    node.removeAttribute("data-ad-ext-label");
  }

  node.style.setProperty("--ad-ext-accent", theme.accentColor);
  node.style.setProperty("--ad-ext-accent-soft", theme.accentSoftColor);
  node.style.setProperty("--ad-ext-accent-strong", theme.accentStrongColor);
  node.style.setProperty("--ad-ext-label-bg", theme.labelBackground);
  node.style.setProperty("--ad-ext-label-color", theme.labelTextColor);
  node.style.setProperty("--ad-ext-radius", "14px");
  node.style.setProperty("--ad-ext-stripe-opacity", "0.35");
}
