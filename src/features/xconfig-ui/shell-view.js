import { getXConfigDescriptor, xconfigDescriptorOrder } from "./descriptors.js";
import { resolveDartDesignAsset, resolveTurnDartAsset } from "#feature-assets";
import {
  isBackgroundThemeFeature,
  isThemeFeature,
} from "./path-utils.js";
import {
  buildThemeBackgroundStatus,
  buildTurnDartImageStatus,
  formatThemeBackgroundSummary,
} from "./theme-background.js";
import { resolveFeatureCardPreview } from "./feature-card-preview.js";
import { getThemeGlobalTypographyPreset } from "../../shared/theme-global-typography-presets.js";
import { getThemeGlobalTemplatePreset } from "../../shared/theme-global-template-presets.js";
import { resolveThemePresetAsset } from "#theme-preset-assets";
import { normalizeHexColor } from "../../shared/hex-color-utils.js";
import { getFeatureCatalogEntryByFeatureKey } from "../../shared/feature-catalog.js";
import {
  TURN_SCORE_PREVIEW_SCORE_ATTRIBUTE,
  TURN_SCORE_PREVIEW_SCORE_CLASS,
} from "./turn-score-preview-contract.js";
import {
  AVG_TREND_PREVIEW_ATTRIBUTE,
  AVG_TREND_PREVIEW_CLASS,
} from "./avg-trend-preview-contract.js";
import {
  DARTBOARD_MARKER_HIGHLIGHT_PREVIEW_ATTRIBUTE,
  DARTBOARD_MARKER_HIGHLIGHT_PREVIEW_CLASS,
  DARTBOARD_MARKER_HIGHLIGHT_PREVIEW_MARKER_ATTRIBUTE,
} from "./dartboard-marker-highlight-preview-contract.js";
import {
  ARROW_CLASS,
  ARROW_HALF_WIDTH_VAR,
  ARROW_HEIGHT_VAR,
  UP_CLASS,
  VISIBLE_CLASS,
  resolveAvgTrendArrowDuration,
  resolveAvgTrendArrowSize,
} from "../avg-trend-arrow/style.js";
import { applyDartboardMarkerHighlightToMarker } from "../dartboard-marker-highlight/logic.js";
import { resolveDartboardMarkerHighlightConfig } from "../dartboard-marker-highlight/style.js";
import {
  HIGHLIGHT_CLASS as CHECKOUT_SCORE_HIGHLIGHT_HIGHLIGHT_CLASS,
  applyCheckoutScoreHighlightStyleVariables,
  getEffectClass as getCheckoutScoreHighlightEffectClass,
} from "../checkout-score-highlight/style.js";
import { renderCheckoutTargets } from "../checkout-target-highlights/logic.js";
import { resolveBoardTargetVisualConfig } from "../checkout-target-highlights/style.js";
import {
  ACTIVE_CLASS as X01_REMAINING_SCORE_BAR_ACTIVE_CLASS,
  FILL_CLASS as X01_REMAINING_SCORE_BAR_FILL_CLASS,
  getEffectFillClass as getX01RemainingScoreBarEffectFillClass,
  getSizeClass as getX01RemainingScoreBarSizeClass,
  HOST_ATTRIBUTE as X01_REMAINING_SCORE_BAR_HOST_ATTRIBUTE,
  TRAIL_CLASS as X01_REMAINING_SCORE_BAR_TRAIL_CLASS,
  TRACK_CLASS as X01_REMAINING_SCORE_BAR_TRACK_CLASS,
  normalizeBarSize as normalizeX01RemainingScoreBarBarSize,
  normalizeColorTheme as normalizeX01RemainingScoreBarColorTheme,
  normalizeEffect as normalizeX01RemainingScoreBarEffect,
} from "../x01-remaining-score-bar/style.js";
import {
  COLOR_THEME_ATTRIBUTE as X01_REMAINING_SCORE_BAR_COLOR_THEME_ATTRIBUTE,
  EFFECT_ATTRIBUTE as X01_REMAINING_SCORE_BAR_EFFECT_ATTRIBUTE,
  SIZE_ATTRIBUTE as X01_REMAINING_SCORE_BAR_SIZE_ATTRIBUTE,
  WIDTH_PROPERTY as X01_REMAINING_SCORE_BAR_WIDTH_PROPERTY,
  resolveActiveVisualVars as resolveX01RemainingScoreBarActiveVisualVars,
} from "../x01-remaining-score-bar/logic.js";

const CONFIG_PATH = "/ad-xconfig";
const CONFIG_HASH = "#ad-xconfig";
const MENU_LABEL = "AD xConfig";
const MENU_LABEL_COLLAPSE_WIDTH = 120;
const README_URL = "https://github.com/thomasasen/autodarts-xconfig/blob/main/README.md";
const CHANGELOG_URL = "https://github.com/thomasasen/autodarts-xconfig/blob/main/CHANGELOG.md";
const ROOT_OBSERVER_KEY = "xconfig-shell:root-observer";
const NOTICE_TIMEOUT_MS = 3200;
const UPDATE_AUTO_CHECK_INTERVAL_MS = 15 * 60 * 1000;
const DART_MARKER_DARTS_FEATURE_KEY = "dart-marker-replacer";
const DART_MARKER_DARTS_DESIGN_SETTING_KEY = "design";
const DARTBOARD_MARKER_HIGHLIGHT_FEATURE_KEY = "dartboard-marker-highlight";
const CHECKOUT_SCORE_HIGHLIGHT_FEATURE_KEY = "checkout-score-highlight";
const CHECKOUT_SCORE_HIGHLIGHT_PREVIEW_FIELD_KEYS = new Set(["effect"]);
const CHECKOUT_BOARD_TARGETS_FEATURE_KEY = "checkout-target-highlights";
const CHECKOUT_BOARD_TARGETS_PREVIEW_FIELD_KEYS = new Set([
  "visualPreset",
  "segmentStyle",
  "targetSelectionMode",
]);
const CHECKOUT_BOARD_TARGETS_LIVE_PREVIEW_FIELD_KEYS = new Set([
  "visualPreset",
  "segmentStyle",
  "targetSelectionMode",
  "colorTheme",
]);
const X01_REMAINING_SCORE_BAR_FEATURE_KEY = "x01-remaining-score-bar";
const X01_REMAINING_SCORE_BAR_BAR_SIZE_FIELD_KEY = "barSize";
const X01_REMAINING_SCORE_BAR_EFFECT_FIELD_KEY = "effect";
const X01_REMAINING_SCORE_BAR_PREVIEW_START_SCORE = 501;
const X01_REMAINING_SCORE_BAR_STATIC_PREVIEW_SCORE = 140;
const X01_REMAINING_SCORE_BAR_EFFECT_PREVIEW_SCORE = X01_REMAINING_SCORE_BAR_PREVIEW_START_SCORE * 0.8;
const X01_REMAINING_SCORE_BAR_TRAIL_WIDTH_PROPERTY = "--ad-ext-x01-remaining-score-bar-trail-width";
const STYLE_CHECKOUT_SUGGESTIONS_FEATURE_KEY = "checkout-suggestion-styles";
const STYLE_CHECKOUT_SUGGESTIONS_STYLE_FIELD_KEY = "style";
const STYLE_CHECKOUT_SUGGESTIONS_STYLES = new Set(["badge", "ribbon", "stripe", "ticket", "outline"]);
const STYLE_CHECKOUT_SUGGESTIONS_THEMES = Object.freeze({
  amber: Object.freeze({
    accentColor: "#f59e0b",
    accentSoftColor: "rgba(245, 158, 11, 0.16)",
    accentStrongColor: "rgba(245, 158, 11, 0.6)",
    labelBackground: "#fcd34d",
    labelTextColor: "#1f1300",
  }),
  cyan: Object.freeze({
    accentColor: "#06b6d4",
    accentSoftColor: "rgba(6, 182, 212, 0.16)",
    accentStrongColor: "rgba(6, 182, 212, 0.58)",
    labelBackground: "#67e8f9",
    labelTextColor: "#082f35",
  }),
  rose: Object.freeze({
    accentColor: "#f43f5e",
    accentSoftColor: "rgba(244, 63, 94, 0.15)",
    accentStrongColor: "rgba(244, 63, 94, 0.58)",
    labelBackground: "#fda4af",
    labelTextColor: "#4a1020",
  }),
});
const THEME_GLOBAL_TYPOGRAPHY_FEATURE_KEY = "theme-global-typography";
const THEME_GLOBAL_TYPOGRAPHY_FONT_FIELD_KEY = "fontPreset";
const THEME_GLOBAL_TYPOGRAPHY_TURN_DART_ASSET_FIELD_KEY = "turnDartAssetKey";
const XCONFIG_COLOR_INPUT_DEFAULT = "#9FDB58";
const LISTENER_KEYS = Object.freeze({
  popstate: "xconfig-shell:popstate",
  click: "xconfig-shell:document-click",
  change: "xconfig-shell:document-change",
  keydown: "xconfig-shell:document-keydown",
  visibilitychange: "xconfig-shell:document-visibilitychange",
});
const TAB_DEFINITIONS = Object.freeze([
  Object.freeze({
    id: "themes",
    icon: "🎨",
    label: "Themen",
    description: "Farben, Layout und Hintergründe",
  }),
  Object.freeze({
    id: "animations",
    icon: "✨",
    label: "Animationen",
    description: "Effekte und Komfortfunktionen",
  }),
]);
const SIDEBAR_ROUTE_HINTS = new Set([
  "/lobbies",
  "/boards",
  "/matches",
  "/tournaments",
  "/statistics",
  "/plus",
  "/settings",
]);
const descriptorOrder = xconfigDescriptorOrder;
const ANIMATION_GROUP_DEFINITIONS = Object.freeze([
  Object.freeze({
    id: "all-modes",
    title: "Gilt für: Alle Modi",
    featureKeys: Object.freeze([
      "active-player-sweep",
      "turn-score-counter",
      "avg-trend-arrow",
      "special-hit-highlights",
      "dart-marker-replacer",
      "dartboard-marker-highlight",
      "take-out-darts-alert",
      "single-bull-hit-sound",
      "winner-celebration-effect",
    ]),
  }),
  Object.freeze({
    id: "x01",
    title: "Gilt für: X01",
    featureKeys: Object.freeze([
      "checkout-suggestion-styles",
      "checkout-score-highlight",
      "x01-remaining-score-bar",
      "x01-bust-active-player-highlight",
      "checkout-target-highlights",
      "tv-board-zoom",
    ]),
  }),
  Object.freeze({
    id: "cricket-tactics",
    title: "Gilt für: Cricket / Tactics",
    featureKeys: Object.freeze([
      "cricket-target-highlighter",
      "cricket-grid-status-effects",
    ]),
  }),
]);
const animationGroupOrder = new Map(
  ANIMATION_GROUP_DEFINITIONS.map((group, index) => [group.id, index])
);
const animationFeatureOrder = new Map(
  ANIMATION_GROUP_DEFINITIONS.flatMap((group) =>
    group.featureKeys.map((featureKey, index) => [featureKey, [group.id, index]])
  )
);
const shellByWindow = new WeakMap();

function isObjectLike(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function toTitleCase(value) {
  const raw = String(value || "").trim();
  if (!raw) {
    return "";
  }

  if (raw.toLowerCase() === "x01") {
    return "X01";
  }

  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function formatVariantLabel(variants = []) {
  if (!Array.isArray(variants) || !variants.length) {
    return "";
  }

  if (variants.includes("all")) {
    return "Alle Modi";
  }

  return variants.map((variant) => toTitleCase(variant)).join(" / ");
}

function isThemeGlobalTypographyFeature(feature) {
  return String(feature?.featureKey || "").trim() === THEME_GLOBAL_TYPOGRAPHY_FEATURE_KEY;
}

function buildThemeGlobalCardSummary(documentRef) {
  const summary = createElement(documentRef, "section", {
    className: "ad-xconfig-card-global-summary",
    attributes: {
      "data-adxconfig-theme-global-summary": "true",
    },
  });
  const badges = createElement(documentRef, "div", {
    className: "ad-xconfig-card-global-badges",
  });
  badges.appendChild(createElement(documentRef, "span", {
    className: "ad-xconfig-card-global-badge ad-xconfig-card-global-badge--primary",
    text: "Global",
  }));
  summary.appendChild(badges);

  return summary;
}

export function createElement(documentRef, tagName, options = {}) {
  const element = documentRef.createElement(tagName);
  if (options.id) {
    element.id = options.id;
  }
  if (options.className) {
    element.setAttribute("class", options.className);
  }
  if (typeof options.text === "string") {
    element.textContent = options.text;
  }
  if (options.type) {
    element.setAttribute("type", options.type);
  }
  if (options.attributes && isObjectLike(options.attributes)) {
    Object.keys(options.attributes).forEach((key) => {
      const value = options.attributes[key];
      if (value !== undefined && value !== null) {
        element.setAttribute(key, value);
      }
    });
  }
  return element;
}

export function parseFieldValue(field, rawValue, checked) {
  if (!field) {
    return rawValue;
  }

  if (field.control === "checkbox") {
    return Boolean(checked);
  }

  if (field.control === "color") {
    return normalizeHexColor(rawValue, "");
  }

  const matchingOption = Array.isArray(field.options)
    ? field.options.find((option) => String(option.value) === String(rawValue))
    : null;

  return matchingOption ? matchingOption.value : rawValue;
}

function isMultiSelectField(field) {
  return field?.control === "select" && field?.multiple === true;
}

function sortFeatures(left, right) {
  const leftOrder = descriptorOrder.has(left.featureKey) ? descriptorOrder.get(left.featureKey) : Number.MAX_SAFE_INTEGER;
  const rightOrder = descriptorOrder.has(right.featureKey) ? descriptorOrder.get(right.featureKey) : Number.MAX_SAFE_INTEGER;
  if (leftOrder !== rightOrder) {
    return leftOrder - rightOrder;
  }
  return String(left.title || "").localeCompare(String(right.title || ""));
}

function getAnimationGroupMeta(featureKey) {
  const groupMeta = animationFeatureOrder.get(String(featureKey || "").trim());
  if (!groupMeta) {
    return {
      groupId: "other",
      groupOrder: Number.MAX_SAFE_INTEGER,
      featureOrder: Number.MAX_SAFE_INTEGER,
    };
  }
  const [groupId, featureOrder] = groupMeta;
  return {
    groupId,
    groupOrder: animationGroupOrder.has(groupId)
      ? animationGroupOrder.get(groupId)
      : Number.MAX_SAFE_INTEGER,
    featureOrder,
  };
}

function sortAnimationFeatures(left, right) {
  const leftMeta = getAnimationGroupMeta(left?.featureKey);
  const rightMeta = getAnimationGroupMeta(right?.featureKey);
  if (leftMeta.groupOrder !== rightMeta.groupOrder) {
    return leftMeta.groupOrder - rightMeta.groupOrder;
  }
  if (leftMeta.featureOrder !== rightMeta.featureOrder) {
    return leftMeta.featureOrder - rightMeta.featureOrder;
  }
  return sortFeatures(left, right);
}

function getFeatureReadmeHref(featureKey) {
  const descriptor = getXConfigDescriptor(featureKey);
  const anchor = String(descriptor?.readmeAnchor || "").trim();
  return anchor ? `${README_URL}#${anchor}` : README_URL;
}

function openExternalHref(windowRef, href) {
  if (typeof windowRef?.open === "function") {
    const openedWindow = windowRef.open(href, "_blank", "noopener,noreferrer");
    if (openedWindow && typeof openedWindow.focus === "function") {
      openedWindow.focus();
    }
    return;
  }

  if (windowRef?.location) {
    windowRef.location.href = href;
  }
}

export function openReadme(windowRef, featureKey) {
  openExternalHref(windowRef, getFeatureReadmeHref(featureKey));
}

export function openChangelog(windowRef) {
  openExternalHref(windowRef, CHANGELOG_URL);
}

function formatUpdateCheckedAt(checkedAt) {
  const timestamp = Number(checkedAt || 0);
  if (timestamp <= 0 || !Number.isFinite(timestamp)) {
    return "";
  }

  try {
    return new Intl.DateTimeFormat("de-DE", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(timestamp));
  } catch (_) {
    return "";
  }
}

const UPDATE_PANEL_STATE_BY_STATUS = Object.freeze({
  checking: "checking",
  available: "available",
  error: "error",
});

function buildUpdateVersionCopy(installedVersion, remoteVersion) {
  let copyText = `Installiert ${installedVersion}`;
  if (remoteVersion) {
    copyText += ` • GitHub ${remoteVersion}`;
  }
  return copyText;
}

const UPDATE_PANEL_TEXT_RESOLVERS = Object.freeze({
  checking() {
    return {
      titleText: "Versionsstatus wird geprüft",
      copyText: "Vergleicht installierte Version mit den veröffentlichten GitHub-Dateien.",
    };
  },
  available({ installedVersion, remoteVersion }) {
    return {
      titleText: "Update verfügbar",
      copyText: `${buildUpdateVersionCopy(installedVersion, remoteVersion)} • Öffnet Tampermonkey im neuen Tab`,
    };
  },
  current({ installedVersion, remoteVersion }) {
    return {
      titleText: "Version ist aktuell",
      copyText: buildUpdateVersionCopy(installedVersion, remoteVersion),
    };
  },
  error({ updateStatus }) {
    return {
      titleText: "Update-Prüfung fehlgeschlagen",
      copyText: String(updateStatus.error || "Die GitHub-Version konnte nicht gelesen werden.").trim(),
    };
  },
});

function resolveUpdatePanelText(panelState, context) {
  const resolver = UPDATE_PANEL_TEXT_RESOLVERS[panelState] || UPDATE_PANEL_TEXT_RESOLVERS.checking;
  return resolver(context);
}

function getUpdatePanelState(updateStatus) {
  if (!updateStatus?.capable) {
    return "";
  }

  const normalizedStatus = String(updateStatus.status || "").trim().toLowerCase();
  const mappedState = UPDATE_PANEL_STATE_BY_STATUS[normalizedStatus];
  if (mappedState) {
    return mappedState;
  }

  return updateStatus.remoteVersion ? "current" : "checking";
}

function buildUpdatePanel(documentRef, updateStatus) {
  if (!updateStatus?.capable) {
    return null;
  }

  const panelState = getUpdatePanelState(updateStatus);
  const installedVersion = String(updateStatus.installedVersion || "unbekannt").trim() || "unbekannt";
  const remoteVersion = String(updateStatus.remoteVersion || "").trim();
  const checkedAtText = formatUpdateCheckedAt(updateStatus.checkedAt);
  let { titleText, copyText } = resolveUpdatePanelText(panelState, {
    updateStatus,
    installedVersion,
    remoteVersion,
  });

  if (checkedAtText) {
    copyText = `${copyText} • ${updateStatus.stale ? "letzter erfolgreicher Stand" : "geprüft"} ${checkedAtText}`;
  }

  const panel = createElement(documentRef, "section", {
    className: "ad-xconfig-update-panel",
    attributes: {
      "data-adxconfig-update-panel": "true",
      "data-update-state": panelState,
    },
  });

  const head = createElement(documentRef, "div", {
    className: "ad-xconfig-update-head",
  });
  const summary = createElement(documentRef, "div", {
    className: "ad-xconfig-update-summary",
  });
  const titleRow = createElement(documentRef, "div", {
    className: "ad-xconfig-update-title-row",
  });
  titleRow.appendChild(createElement(documentRef, "span", {
    className: "ad-xconfig-update-dot",
    attributes: {
      "aria-hidden": "true",
    },
  }));
  titleRow.appendChild(createElement(documentRef, "h2", {
    className: "ad-xconfig-update-title",
    text: titleText,
  }));
  summary.appendChild(titleRow);
  summary.appendChild(createElement(documentRef, "p", {
    className: "ad-xconfig-update-copy",
    text: copyText,
  }));
  head.appendChild(summary);

  const actions = createElement(documentRef, "div", {
    className: "ad-xconfig-update-actions",
  });
  const changelogLink = createElement(documentRef, "a", {
    className: "ad-xconfig-btn ad-xconfig-update-link",
    attributes: {
      href: CHANGELOG_URL,
      target: "_blank",
      rel: "noopener noreferrer",
      "data-adxconfig-action": "open-changelog",
      "aria-label": "Changelog in neuem Tab öffnen",
    },
  });
  changelogLink.appendChild(createElement(documentRef, "span", {
    className: "ad-xconfig-update-link-copy",
  }));
  const changelogLinkCopy = changelogLink.firstElementChild;
  changelogLinkCopy?.appendChild(createElement(documentRef, "span", {
    className: "ad-xconfig-update-link-kicker",
    text: panelState === "available" ? "Neu" : "Info",
  }));
  changelogLinkCopy?.appendChild(createElement(documentRef, "span", {
    className: "ad-xconfig-update-link-label",
    text: panelState === "available" ? "Was ist neu?" : "Changelog",
  }));
  actions.appendChild(changelogLink);
  actions.appendChild(createElement(documentRef, "button", {
    type: "button",
    className: "ad-xconfig-btn",
    text: panelState === "checking" ? "Prüfe..." : "Neu prüfen",
    attributes: {
      "data-adxconfig-action": "check-update",
      "aria-label": "Update erneut prüfen",
      disabled: panelState === "checking" ? "disabled" : null,
    },
  }));
  if (panelState === "available") {
    actions.appendChild(createElement(documentRef, "button", {
      type: "button",
      className: "ad-xconfig-btn ad-xconfig-btn--primary",
      text: "Update installieren",
      attributes: {
        "data-adxconfig-action": "install-update",
      },
    }));
  }
  head.appendChild(actions);

  panel.appendChild(head);
  return panel;
}

function menuIconMarkup() {
  return "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"currentColor\"><path d=\"M3 6.5A1.5 1.5 0 0 1 4.5 5h10A1.5 1.5 0 0 1 16 6.5v1A1.5 1.5 0 0 1 14.5 9h-10A1.5 1.5 0 0 1 3 7.5zm0 10A1.5 1.5 0 0 1 4.5 15h6A1.5 1.5 0 0 1 12 16.5v1a1.5 1.5 0 0 1-1.5 1.5h-6A1.5 1.5 0 0 1 3 17.5zM18 4a3 3 0 0 1 3 3a3 3 0 0 1-3 3a3 3 0 0 1-3-3a3 3 0 0 1 3-3m0 10a3 3 0 0 1 3 3a3 3 0 0 1-3 3a3 3 0 0 1-3-3a3 3 0 0 1 3-3\"/></svg>";
}

export function buildMenuIconElement(documentRef, template) {
  const icon = createElement(documentRef, "span");
  const templateIcon =
    template && typeof template.querySelector === "function"
      ? template.querySelector(".chakra-button__icon")
      : null;
  icon.className = templateIcon?.className
    ? `${templateIcon.className} ad-xconfig-menu-icon`
    : "ad-xconfig-menu-icon";
  icon.innerHTML = menuIconMarkup();
  return icon;
}

function buildFeatureToggle(documentRef, feature) {
  const wrapper = createElement(documentRef, "div", {
    className: "ad-xconfig-onoff",
  });
  const checkbox = createElement(documentRef, "input", {
    id: `ad-xconfig-toggle-${feature.featureKey}`,
    type: "checkbox",
    className: "ad-xconfig-hidden-input",
    attributes: {
      "data-adxconfig-feature-toggle": "true",
      "data-feature-key": feature.featureKey,
    },
  });
  checkbox.checked = Boolean(feature.enabled);
  wrapper.appendChild(checkbox);
  wrapper.appendChild(createElement(documentRef, "button", {
    type: "button",
    className: "ad-xconfig-onoff-btn ad-xconfig-onoff-btn--on",
    text: "An",
    attributes: {
      "data-adxconfig-action": "set-feature",
      "data-feature-key": feature.featureKey,
      "data-feature-enabled": "true",
      "data-active": feature.enabled ? "true" : "false",
    },
  }));
  wrapper.appendChild(createElement(documentRef, "button", {
    type: "button",
    className: "ad-xconfig-onoff-btn ad-xconfig-onoff-btn--off",
    text: "Aus",
    attributes: {
      "data-adxconfig-action": "set-feature",
      "data-feature-key": feature.featureKey,
      "data-feature-enabled": "false",
      "data-active": feature.enabled ? "false" : "true",
    },
  }));
  return wrapper;
}

function isDartDesignSelectField(feature, field) {
  if (field?.control !== "select") {
    return false;
  }
  const featureKey = String(feature?.featureKey || "").trim();
  const fieldKey = String(field?.key || "").trim();
  return (
    (featureKey === DART_MARKER_DARTS_FEATURE_KEY &&
      fieldKey === DART_MARKER_DARTS_DESIGN_SETTING_KEY) ||
    (featureKey === THEME_GLOBAL_TYPOGRAPHY_FEATURE_KEY &&
      fieldKey === THEME_GLOBAL_TYPOGRAPHY_TURN_DART_ASSET_FIELD_KEY)
  );
}

function isTurnDartAssetSelectField(feature, field) {
  return feature?.featureKey === THEME_GLOBAL_TYPOGRAPHY_FEATURE_KEY &&
    field?.control === "select" &&
    String(field?.key || "").trim() === THEME_GLOBAL_TYPOGRAPHY_TURN_DART_ASSET_FIELD_KEY;
}

function isThemeGlobalTypographyFontField(feature, field) {
  if (field?.control !== "select") {
    return false;
  }
  return feature?.featureKey === THEME_GLOBAL_TYPOGRAPHY_FEATURE_KEY &&
    String(field?.key || "").trim() === THEME_GLOBAL_TYPOGRAPHY_FONT_FIELD_KEY;
}

function buildOptionActiveBadge(documentRef) {
  return createElement(documentRef, "span", {
    className: "ad-xconfig-option-active",
    text: "Aktuell",
  });
}

function isCheckoutScoreHighlightFeature(feature) {
  return feature?.featureKey === CHECKOUT_SCORE_HIGHLIGHT_FEATURE_KEY;
}

function isCheckoutScoreHighlightPreviewField(feature, field) {
  return (
    isCheckoutScoreHighlightFeature(feature) &&
    field?.control === "select" &&
    CHECKOUT_SCORE_HIGHLIGHT_PREVIEW_FIELD_KEYS.has(String(field?.key || "").trim())
  );
}

function resolveCheckoutScoreHighlightPreviewConfig(featureConfig = {}, overrides = {}) {
  return {
    effect: "grow-only",
    colorTheme: "159, 219, 88",
    intensity: "standard",
    triggerSource: "suggestion-first",
    ...featureConfig,
    ...overrides,
  };
}

function resolveCheckoutScoreHighlightTriggerLabel(triggerSource) {
  const normalized = String(triggerSource || "").trim().toLowerCase();
  if (normalized === "score-only") {
    return "Score-Mathe";
  }
  if (normalized === "suggestion-only") {
    return "Suggestion";
  }
  return "Suggestion + Score";
}

function buildCheckoutScoreHighlightScoreNode(documentRef, previewConfig = {}, options = {}) {
  const scoreNode = createElement(documentRef, "span", {
    className: [
      "ad-xconfig-checkout-score-highlight-score",
      options.mini ? "ad-xconfig-checkout-score-highlight-score--mini" : "",
      CHECKOUT_SCORE_HIGHLIGHT_HIGHLIGHT_CLASS,
      getCheckoutScoreHighlightEffectClass(previewConfig.effect),
    ].filter(Boolean).join(" "),
    text: "40",
    attributes: {
      "data-adxconfig-checkout-score-highlight-score": "true",
      "data-checkout-score-highlight-effect": String(previewConfig.effect || "").trim(),
    },
  });
  applyCheckoutScoreHighlightStyleVariables(scoreNode, previewConfig);
  return scoreNode;
}

function buildCheckoutScoreHighlightPreviewCard(documentRef, featureConfig = {}, overrides = {}, options = {}) {
  const previewConfig = resolveCheckoutScoreHighlightPreviewConfig(featureConfig, overrides);
  const card = createElement(documentRef, "div", {
    className: [
      "ad-xconfig-checkout-score-highlight-preview-card",
      options.mini ? "ad-xconfig-checkout-score-highlight-preview-card--mini" : "",
    ].filter(Boolean).join(" "),
  });

  const playerRow = createElement(documentRef, "div", {
    className: "ad-xconfig-checkout-score-highlight-preview-player",
  });
  playerRow.appendChild(createElement(documentRef, "span", {
    className: "ad-xconfig-checkout-score-highlight-preview-name",
    text: "PLAYER 1",
  }));
  playerRow.appendChild(createElement(documentRef, "span", {
    className: "ad-xconfig-checkout-score-highlight-preview-context",
    text: resolveCheckoutScoreHighlightTriggerLabel(previewConfig.triggerSource),
  }));
  card.appendChild(playerRow);

  const scoreRow = createElement(documentRef, "div", {
    className: "ad-xconfig-checkout-score-highlight-preview-score-row",
  });
  scoreRow.appendChild(buildCheckoutScoreHighlightScoreNode(documentRef, previewConfig, options));
  scoreRow.appendChild(createElement(documentRef, "span", {
    className: "ad-xconfig-checkout-score-highlight-preview-route",
    text: "D20",
  }));
  card.appendChild(scoreRow);

  return card;
}

function buildSettingsPreviewSection(documentRef, options = {}) {
  const previewAttribute = String(options.previewAttribute || "").trim();
  const section = createElement(documentRef, "section", {
    className: "ad-xconfig-settings-section",
    attributes: {
      "data-adxconfig-settings-section": "vorschau",
      [previewAttribute]: previewAttribute ? "true" : undefined,
    },
  });
  section.appendChild(createElement(documentRef, "h4", {
    className: "ad-xconfig-settings-section-title",
    text: "Vorschau",
  }));

  const body = createElement(documentRef, "div", {
    className: "ad-xconfig-settings-section-body",
  });
  const row = createElement(documentRef, "div", {
    className: options.rowClassName,
  });
  const surface = createElement(documentRef, "div", {
    className: options.surfaceClassName,
  });
  if (typeof options.fillSurface === "function") {
    options.fillSurface(surface);
  }
  row.appendChild(surface);
  body.appendChild(row);
  section.appendChild(body);
  return section;
}

function buildPreviewOptionLayout(documentRef, options = {}) {
  const layout = createElement(documentRef, "div", {
    className: options.layoutClassName,
  });
  const optionText = createElement(documentRef, "div", {
    className: "ad-xconfig-option-text",
  });
  const head = createElement(documentRef, "div", {
    className: "ad-xconfig-option-head",
  });
  head.appendChild(createElement(documentRef, "span", {
    className: "ad-xconfig-option-label",
    text: options.optionLabel,
  }));
  optionText.appendChild(head);
  if (options.optionDescription) {
    optionText.appendChild(createElement(documentRef, "span", {
      className: "ad-xconfig-option-copy",
      text: options.optionDescription,
    }));
  }
  layout.appendChild(optionText);

  if (options.previewNode) {
    layout.appendChild(options.previewNode);
  }

  const activeSlot = createElement(documentRef, "div", {
    className: "ad-xconfig-option-active-slot",
    attributes: {
      "data-option-active-slot": "true",
    },
  });
  if (options.isActive) {
    activeSlot.appendChild(buildOptionActiveBadge(documentRef));
  }
  layout.appendChild(activeSlot);
  return layout;
}

function buildCheckoutScoreHighlightPreviewSection(documentRef, feature) {
  return buildSettingsPreviewSection(documentRef, {
    previewAttribute: "data-adxconfig-checkout-score-highlight-preview",
    rowClassName: "ad-xconfig-setting-row ad-xconfig-setting-row--checkout-score-highlight-preview",
    surfaceClassName: "ad-xconfig-checkout-score-highlight-preview-surface",
    fillSurface: (surface) => {
      const head = createElement(documentRef, "div", {
        className: "ad-xconfig-checkout-score-highlight-preview-head",
      });
      head.appendChild(createElement(documentRef, "span", {
        className: "ad-xconfig-checkout-score-highlight-preview-title",
        text: "Live-Vorschau",
      }));
      head.appendChild(createElement(documentRef, "span", {
        className: "ad-xconfig-checkout-score-highlight-preview-hint",
        text: "40 Rest",
      }));
      surface.appendChild(head);
      surface.appendChild(buildCheckoutScoreHighlightPreviewCard(documentRef, feature?.config || {}));
    },
  });
}

function buildCheckoutScoreHighlightOptionLayout(
  documentRef,
  feature,
  field,
  optionValue,
  optionLabel,
  optionDescription,
  isActive
) {
  const fieldKey = String(field?.key || "").trim();
  const previewOverrides = fieldKey === "effect"
    ? { effect: optionValue }
    : { colorTheme: optionValue };
  const preview = createElement(documentRef, "div", {
    className: "ad-xconfig-checkout-score-highlight-option-preview",
  });
  preview.appendChild(
    buildCheckoutScoreHighlightPreviewCard(documentRef, feature?.config || {}, previewOverrides, {
      mini: true,
    })
  );
  return buildPreviewOptionLayout(documentRef, {
    layoutClassName: "ad-xconfig-option-layout ad-xconfig-option-layout--checkout-score-highlight-preview",
    optionLabel,
    optionDescription,
    previewNode: preview,
    isActive,
  });
}

const CHECKOUT_BOARD_PREVIEW_SEGMENT_ORDER = Object.freeze([
  20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5,
]);
const CHECKOUT_BOARD_PREVIEW_RATIOS = Object.freeze({
  outerBullInner: 0.031112,
  outerBullOuter: 0.075556,
  tripleInner: 0.431112,
  tripleOuter: 0.475556,
  doubleInner: 0.711112,
  doubleOuter: 0.755556,
});
const CHECKOUT_BOARD_PREVIEW_RADIUS = 100;
const CHECKOUT_BOARD_PREVIEW_DOUBLE_OUTER_RADIUS = 76.2;

function isCheckoutTargetHighlightsFeature(feature) {
  return feature?.featureKey === CHECKOUT_BOARD_TARGETS_FEATURE_KEY;
}

function isCheckoutTargetHighlightsPreviewField(feature, field) {
  return (
    isCheckoutTargetHighlightsFeature(feature) &&
    field?.control === "select" &&
    CHECKOUT_BOARD_TARGETS_PREVIEW_FIELD_KEYS.has(String(field?.key || "").trim())
  );
}

function resolveCheckoutBoardPreviewConfig(featureConfig = {}, overrides = {}) {
  return {
    ...featureConfig,
    ...overrides,
  };
}

function resolveCheckoutBoardPreviewVisualConfig(featureConfig = {}, overrides = {}) {
  return {
    ...resolveBoardTargetVisualConfig(featureConfig),
    ...overrides,
  };
}

function checkoutBoardPreviewPolar(radius, angleDeg) {
  const radians = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: Number((radius * Math.cos(radians)).toFixed(4)),
    y: Number((radius * Math.sin(radians)).toFixed(4)),
  };
}

function checkoutBoardPreviewWedgePath(innerRadius, outerRadius, startDeg, endDeg) {
  const p0 = checkoutBoardPreviewPolar(outerRadius, startDeg);
  const p1 = checkoutBoardPreviewPolar(outerRadius, endDeg);
  const p2 = checkoutBoardPreviewPolar(innerRadius, endDeg);
  const p3 = checkoutBoardPreviewPolar(innerRadius, startDeg);
  const largeArc = (endDeg - startDeg + 360) % 360 > 180 ? 1 : 0;
  return [
    `M ${p0.x} ${p0.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${p1.x} ${p1.y}`,
    `L ${p2.x} ${p2.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${p3.x} ${p3.y}`,
    "Z",
  ].join(" ");
}

function resolveCheckoutBoardPreviewSegmentAngles(value) {
  const index = CHECKOUT_BOARD_PREVIEW_SEGMENT_ORDER.indexOf(Number(value));
  if (index < 0) {
    return null;
  }
  const center = index * 18;
  return {
    start: center - 9,
    end: center + 9,
  };
}

function appendCheckoutBoardPreviewStaticBoard(documentRef, group) {
  const radius = CHECKOUT_BOARD_PREVIEW_RADIUS;
  const maxOuterRatio = CHECKOUT_BOARD_PREVIEW_RATIOS.doubleOuter;

  CHECKOUT_BOARD_PREVIEW_SEGMENT_ORDER.forEach((value, index) => {
    const angles = resolveCheckoutBoardPreviewSegmentAngles(value);
    if (!angles) {
      return;
    }
    group.appendChild(createSvgElement(documentRef, "path", {
      class: "ad-xconfig-checkout-board-preview-sector",
      d: checkoutBoardPreviewWedgePath(
        radius * CHECKOUT_BOARD_PREVIEW_RATIOS.outerBullOuter,
        radius * maxOuterRatio,
        angles.start,
        angles.end
      ),
    }));
    group.appendChild(createSvgElement(documentRef, "path", {
      class: index % 2
        ? "ad-xconfig-checkout-board-preview-band ad-xconfig-checkout-board-preview-band--red"
        : "ad-xconfig-checkout-board-preview-band ad-xconfig-checkout-board-preview-band--green",
      d: checkoutBoardPreviewWedgePath(
        radius * CHECKOUT_BOARD_PREVIEW_RATIOS.tripleInner,
        radius * CHECKOUT_BOARD_PREVIEW_RATIOS.tripleOuter,
        angles.start,
        angles.end
      ),
    }));
    group.appendChild(createSvgElement(documentRef, "path", {
      class: index % 2
        ? "ad-xconfig-checkout-board-preview-band ad-xconfig-checkout-board-preview-band--green"
        : "ad-xconfig-checkout-board-preview-band ad-xconfig-checkout-board-preview-band--red",
      d: checkoutBoardPreviewWedgePath(
        radius * CHECKOUT_BOARD_PREVIEW_RATIOS.doubleInner,
        radius * CHECKOUT_BOARD_PREVIEW_RATIOS.doubleOuter,
        angles.start,
        angles.end
      ),
    }));
  });

  [
    CHECKOUT_BOARD_PREVIEW_RATIOS.outerBullOuter,
    CHECKOUT_BOARD_PREVIEW_RATIOS.tripleInner,
    CHECKOUT_BOARD_PREVIEW_RATIOS.tripleOuter,
    CHECKOUT_BOARD_PREVIEW_RATIOS.doubleInner,
    CHECKOUT_BOARD_PREVIEW_RATIOS.doubleOuter,
  ].forEach((ratio) => {
    group.appendChild(createSvgElement(documentRef, "circle", {
      class: "ad-xconfig-checkout-board-preview-ring",
      r: String(Number((radius * ratio).toFixed(4))),
    }));
  });
  group.appendChild(createSvgElement(documentRef, "circle", {
    class: "ad-xconfig-checkout-board-preview-bull ad-xconfig-checkout-board-preview-bull--outer",
    r: String(Number((radius * CHECKOUT_BOARD_PREVIEW_RATIOS.outerBullOuter).toFixed(4))),
  }));
  group.appendChild(createSvgElement(documentRef, "circle", {
    class: "ad-xconfig-checkout-board-preview-bull ad-xconfig-checkout-board-preview-bull--inner",
    r: String(Number((radius * CHECKOUT_BOARD_PREVIEW_RATIOS.outerBullInner).toFixed(4))),
  }));
}

function appendCheckoutBoardPreviewStaticSector(documentRef, group, value = 6) {
  const radius = CHECKOUT_BOARD_PREVIEW_RADIUS;
  const angles = resolveCheckoutBoardPreviewSegmentAngles(value);
  if (!angles) {
    return;
  }
  group.appendChild(createSvgElement(documentRef, "path", {
    class: "ad-xconfig-checkout-board-preview-sector-part ad-xconfig-checkout-board-preview-sector-part--single",
    d: checkoutBoardPreviewWedgePath(
      radius * CHECKOUT_BOARD_PREVIEW_RATIOS.outerBullOuter,
      radius * CHECKOUT_BOARD_PREVIEW_RATIOS.tripleInner,
      angles.start,
      angles.end
    ),
  }));
  group.appendChild(createSvgElement(documentRef, "path", {
    class: "ad-xconfig-checkout-board-preview-sector-part ad-xconfig-checkout-board-preview-sector-part--triple",
    d: checkoutBoardPreviewWedgePath(
      radius * CHECKOUT_BOARD_PREVIEW_RATIOS.tripleInner,
      radius * CHECKOUT_BOARD_PREVIEW_RATIOS.tripleOuter,
      angles.start,
      angles.end
    ),
  }));
  group.appendChild(createSvgElement(documentRef, "path", {
    class: "ad-xconfig-checkout-board-preview-sector-part ad-xconfig-checkout-board-preview-sector-part--single",
    d: checkoutBoardPreviewWedgePath(
      radius * CHECKOUT_BOARD_PREVIEW_RATIOS.tripleOuter,
      radius * CHECKOUT_BOARD_PREVIEW_RATIOS.doubleInner,
      angles.start,
      angles.end
    ),
  }));
  group.appendChild(createSvgElement(documentRef, "path", {
    class: "ad-xconfig-checkout-board-preview-sector-part ad-xconfig-checkout-board-preview-sector-part--double",
    d: checkoutBoardPreviewWedgePath(
      radius * CHECKOUT_BOARD_PREVIEW_RATIOS.doubleInner,
      radius * CHECKOUT_BOARD_PREVIEW_RATIOS.doubleOuter,
      angles.start,
      angles.end
    ),
  }));
}

function resolveCheckoutBoardPreviewTargets(targetSelectionMode) {
  const normalizedMode = String(targetSelectionMode || "").trim().toLowerCase();
  if (normalizedMode === "all") {
    return [
      { ring: "T", value: 20 },
      { ring: "T", value: 17 },
      { ring: "D", value: 18 },
    ];
  }
  if (normalizedMode === "finish") {
    return [{ ring: "D", value: 20 }];
  }
  return [{ ring: "S", value: 6 }];
}

function buildCheckoutBoardWholePreview(documentRef, featureConfig = {}, overrides = {}, options = {}) {
  const previewConfig = resolveCheckoutBoardPreviewConfig(featureConfig, overrides);
  const svg = createSvgElement(documentRef, "svg", {
    class: [
      "ad-xconfig-checkout-board-preview-board",
      options.mini ? "ad-xconfig-checkout-board-preview-board--mini" : "",
    ].filter(Boolean).join(" "),
    viewBox: `-${CHECKOUT_BOARD_PREVIEW_DOUBLE_OUTER_RADIUS + 6} -${CHECKOUT_BOARD_PREVIEW_DOUBLE_OUTER_RADIUS + 6} ${(CHECKOUT_BOARD_PREVIEW_DOUBLE_OUTER_RADIUS + 6) * 2} ${(CHECKOUT_BOARD_PREVIEW_DOUBLE_OUTER_RADIUS + 6) * 2}`,
    focusable: "false",
    "aria-hidden": "true",
    "data-adxconfig-checkout-board-preview-kind": "whole-board",
  });
  const boardGroup = createSvgElement(documentRef, "g", {
    class: "ad-xconfig-checkout-board-preview-board-surface",
  });
  appendCheckoutBoardPreviewStaticBoard(documentRef, boardGroup);
  svg.appendChild(boardGroup);
  renderCheckoutTargets({
    board: {
      group: boardGroup,
      radius: CHECKOUT_BOARD_PREVIEW_RADIUS,
    },
    checkoutTargets: resolveCheckoutBoardPreviewTargets(previewConfig.targetSelectionMode),
    visualConfig: resolveCheckoutBoardPreviewVisualConfig(previewConfig),
  });
  return svg;
}

function buildCheckoutBoardSectorPreview(documentRef, featureConfig = {}, overrides = {}) {
  const previewConfig = resolveCheckoutBoardPreviewConfig(featureConfig, overrides);
  const svg = createSvgElement(documentRef, "svg", {
    class: "ad-xconfig-checkout-board-preview-sector-svg",
    viewBox: "5 -25 100 50",
    focusable: "false",
    "aria-hidden": "true",
    "data-adxconfig-checkout-board-preview-kind": "sector",
  });
  const boardGroup = createSvgElement(documentRef, "g", {
    class: "ad-xconfig-checkout-board-preview-sector-surface",
  });
  appendCheckoutBoardPreviewStaticSector(documentRef, boardGroup, 6);
  svg.appendChild(boardGroup);
  renderCheckoutTargets({
    board: {
      group: boardGroup,
      radius: CHECKOUT_BOARD_PREVIEW_RADIUS,
    },
    checkoutTargets: [{ ring: "S", value: 6 }],
    visualConfig: resolveCheckoutBoardPreviewVisualConfig(previewConfig, { singleRing: "outer" }),
  });
  return svg;
}

function resolveCheckoutBoardPreviewRouteText(targetSelectionMode) {
  if (targetSelectionMode === "all") {
    return "Demo: 167 Rest - T20 T17 D18";
  }
  if (targetSelectionMode === "finish") {
    return "Demo: 40 Rest - D20";
  }
  return "Demo: 167 Rest - nächstes Feld S6";
}

function buildCheckoutBoardPreviewSection(documentRef, feature) {
  const previewConfig = feature?.config || {};
  const targetSelectionMode = String(previewConfig.targetSelectionMode || "next").trim();
  const routeText = resolveCheckoutBoardPreviewRouteText(targetSelectionMode);
  return buildSettingsPreviewSection(documentRef, {
    previewAttribute: "data-adxconfig-checkout-target-highlights-preview",
    rowClassName: "ad-xconfig-setting-row ad-xconfig-setting-row--checkout-board-preview",
    surfaceClassName: "ad-xconfig-checkout-board-preview-surface",
    fillSurface: (surface) => {
      const head = createElement(documentRef, "div", {
        className: "ad-xconfig-checkout-board-preview-head",
      });
      head.appendChild(createElement(documentRef, "span", {
        className: "ad-xconfig-checkout-board-preview-title",
        text: "Live-Vorschau",
      }));
      head.appendChild(createElement(documentRef, "span", {
        className: "ad-xconfig-checkout-board-preview-route",
        text: routeText,
      }));
      surface.appendChild(head);
      const boardWrap = createElement(documentRef, "div", {
        className: "ad-xconfig-checkout-board-preview-board-wrap",
      });
      boardWrap.appendChild(buildCheckoutBoardWholePreview(documentRef, previewConfig));
      surface.appendChild(boardWrap);
    },
  });
}

function replaceElementFromSource(targetNode, sourceNode) {
  if (!targetNode || !sourceNode) {
    return false;
  }

  const parentNode = targetNode.parentNode || null;
  if (!parentNode || typeof targetNode.before !== "function") {
    return false;
  }

  targetNode.before(sourceNode);
  targetNode.remove?.();
  return true;
}

export function syncSettingsPreview(documentRef, features, featureKey, settingKey, settingValue) {
  const normalizedFeatureKey = String(featureKey || "").trim();
  const normalizedSettingKey = String(settingKey || "").trim();
  if (
    normalizedFeatureKey !== CHECKOUT_BOARD_TARGETS_FEATURE_KEY ||
    !CHECKOUT_BOARD_TARGETS_LIVE_PREVIEW_FIELD_KEYS.has(normalizedSettingKey)
  ) {
    return false;
  }

  const previousPreview = documentRef.querySelector?.(
    "[data-adxconfig-checkout-target-highlights-preview='true']"
  ) || null;
  const feature = Array.isArray(features)
    ? features.find((entry) => entry?.featureKey === normalizedFeatureKey) || null
    : null;
  if (!previousPreview || !feature) {
    return false;
  }

  const previewConfig = {};
  if (feature.config && typeof feature.config === "object") {
    Object.assign(previewConfig, feature.config);
  }
  previewConfig[normalizedSettingKey] = settingValue;

  const previewFeature = {
    ...feature,
    config: previewConfig,
  };
  return replaceElementFromSource(
    previousPreview,
    buildCheckoutBoardPreviewSection(documentRef, previewFeature)
  );
}

function buildCheckoutTargetHighlightsOptionLayout(
  documentRef,
  feature,
  field,
  optionValue,
  optionLabel,
  optionDescription,
  isActive
) {
  const fieldKey = String(field?.key || "").trim();
  const preview = createElement(documentRef, "div", {
    className: "ad-xconfig-checkout-board-option-preview",
  });
  if (fieldKey === "visualPreset") {
    preview.appendChild(
      buildCheckoutBoardSectorPreview(documentRef, feature?.config || {}, { visualPreset: optionValue })
    );
  } else if (fieldKey === "segmentStyle") {
    preview.appendChild(
      buildCheckoutBoardSectorPreview(documentRef, feature?.config || {}, { segmentStyle: optionValue })
    );
  } else if (fieldKey === "colorTheme") {
    preview.appendChild(
      buildCheckoutBoardWholePreview(
        documentRef,
        feature?.config || {},
        { colorTheme: optionValue },
        { mini: true }
      )
    );
  } else {
    preview.appendChild(
      buildCheckoutBoardWholePreview(
        documentRef,
        feature?.config || {},
        { targetSelectionMode: optionValue },
        { mini: true }
      )
    );
  }
  return buildPreviewOptionLayout(documentRef, {
    layoutClassName: "ad-xconfig-option-layout ad-xconfig-option-layout--checkout-board-preview",
    optionLabel,
    optionDescription,
    previewNode: preview,
    isActive,
  });
}

function isX01RemainingScoreBarFeature(feature) {
  return feature?.featureKey === X01_REMAINING_SCORE_BAR_FEATURE_KEY;
}

function isX01RemainingScoreBarPreviewField(feature, field) {
  if (!isX01RemainingScoreBarFeature(feature) || field?.control !== "select") {
    return false;
  }
  const fieldKey = String(field?.key || "").trim();
  return fieldKey === X01_REMAINING_SCORE_BAR_BAR_SIZE_FIELD_KEY ||
    fieldKey === X01_REMAINING_SCORE_BAR_EFFECT_FIELD_KEY;
}

function resolveX01RemainingScoreBarPreviewConfig(featureConfig = {}, overrides = {}) {
  const previewConfig = {
    ...featureConfig,
    ...overrides,
  };
  return {
    colorTheme: normalizeX01RemainingScoreBarColorTheme(previewConfig.colorTheme),
    barSize: normalizeX01RemainingScoreBarBarSize(previewConfig.barSize),
    effect: normalizeX01RemainingScoreBarEffect(previewConfig.effect),
  };
}

function applyX01RemainingScoreBarPreviewVariables(node, previewConfig = {}, options = {}) {
  if (!node?.style) {
    return;
  }

  const score = Number.isFinite(options.score)
    ? Number(options.score)
    : X01_REMAINING_SCORE_BAR_STATIC_PREVIEW_SCORE;
  const ratio = score / X01_REMAINING_SCORE_BAR_PREVIEW_START_SCORE;
  const visualVars = resolveX01RemainingScoreBarActiveVisualVars({
    colorTheme: previewConfig.colorTheme,
    ratio,
    score,
  });
  Object.entries(visualVars).forEach(([propertyName, value]) => {
    node.style.setProperty(propertyName, value);
  });
  node.style.setProperty(X01_REMAINING_SCORE_BAR_WIDTH_PROPERTY, `${Math.round(ratio * 10000) / 100}%`);
  node.style.setProperty(
    X01_REMAINING_SCORE_BAR_TRAIL_WIDTH_PROPERTY,
    options.trailWidth || "82%"
  );
}

function buildX01RemainingScoreBarPreviewBar(documentRef, featureConfig = {}, overrides = {}, options = {}) {
  const previewConfig = resolveX01RemainingScoreBarPreviewConfig(featureConfig, overrides);
  const host = createElement(documentRef, "div", {
    className: [
      "ad-xconfig-x01-remaining-score-bar-preview-host",
      options.mini
        ? "ad-xconfig-x01-remaining-score-bar-preview-host--mini"
        : "ad-xconfig-x01-remaining-score-bar-preview-host--main",
      X01_REMAINING_SCORE_BAR_ACTIVE_CLASS,
      getX01RemainingScoreBarSizeClass(previewConfig.barSize),
    ].filter(Boolean).join(" "),
    attributes: {
      [X01_REMAINING_SCORE_BAR_HOST_ATTRIBUTE]: "true",
      [X01_REMAINING_SCORE_BAR_COLOR_THEME_ATTRIBUTE]: previewConfig.colorTheme,
      [X01_REMAINING_SCORE_BAR_SIZE_ATTRIBUTE]: previewConfig.barSize,
      [X01_REMAINING_SCORE_BAR_EFFECT_ATTRIBUTE]: previewConfig.effect,
      "data-adxconfig-x01-remaining-score-bar-preview-bar": "true",
      "data-adxconfig-x01-remaining-score-bar-preview-cycle": options.cycle ? "true" : undefined,
      "data-adxconfig-x01-remaining-score-bar-preview-loop":
        options.loop || (options.cycle ? "main" : undefined),
    },
  });
  applyX01RemainingScoreBarPreviewVariables(host, previewConfig, {
    score: options.score,
    trailWidth: options.cycle ? "0%" : undefined,
  });

  const track = createElement(documentRef, "div", {
    className: X01_REMAINING_SCORE_BAR_TRACK_CLASS,
  });
  track.appendChild(createElement(documentRef, "div", {
    className: X01_REMAINING_SCORE_BAR_TRAIL_CLASS,
  }));
  track.appendChild(createElement(documentRef, "div", {
    className: [
      X01_REMAINING_SCORE_BAR_FILL_CLASS,
      getX01RemainingScoreBarEffectFillClass(previewConfig.effect),
    ].join(" "),
  }));
  host.appendChild(track);
  return host;
}

function buildX01RemainingScoreBarPreviewSection(documentRef, feature) {
  return buildSettingsPreviewSection(documentRef, {
    previewAttribute: "data-adxconfig-x01-remaining-score-bar-preview",
    rowClassName: "ad-xconfig-setting-row ad-xconfig-setting-row--x01-remaining-score-bar-preview",
    surfaceClassName: "ad-xconfig-x01-remaining-score-bar-preview-surface",
    fillSurface: (surface) => {
      const head = createElement(documentRef, "div", {
        className: "ad-xconfig-x01-remaining-score-bar-preview-head",
      });
      head.appendChild(createElement(documentRef, "span", {
        className: "ad-xconfig-x01-remaining-score-bar-preview-score",
        text: "100%",
        attributes: {
          "data-adxconfig-x01-remaining-score-bar-preview-score": "true",
        },
      }));
      head.appendChild(createElement(documentRef, "span", {
        className: "ad-xconfig-x01-remaining-score-bar-preview-route",
        text: "100%  75%  45%  20%",
        attributes: {
          "data-adxconfig-x01-remaining-score-bar-preview-route": "true",
        },
      }));
      surface.appendChild(head);
      surface.appendChild(
        buildX01RemainingScoreBarPreviewBar(documentRef, feature?.config || {}, {}, {
          cycle: true,
          score: X01_REMAINING_SCORE_BAR_PREVIEW_START_SCORE,
        })
      );
    },
  });
}

function buildX01RemainingScoreBarOptionLayout(
  documentRef,
  feature,
  field,
  optionValue,
  optionLabel,
  optionDescription,
  isActive
) {
  const fieldKey = String(field?.key || "").trim();
  const previewOverrides =
    fieldKey === X01_REMAINING_SCORE_BAR_BAR_SIZE_FIELD_KEY
      ? { barSize: optionValue }
      : { effect: optionValue };
  const isEffectPreview = fieldKey === X01_REMAINING_SCORE_BAR_EFFECT_FIELD_KEY;
  const previewEffect = normalizeX01RemainingScoreBarEffect(previewOverrides.effect);
  const preview = createElement(documentRef, "div", {
    className: "ad-xconfig-x01-remaining-score-bar-option-preview",
  });
  preview.appendChild(
    buildX01RemainingScoreBarPreviewBar(documentRef, feature?.config || {}, previewOverrides, {
      mini: true,
      score: isEffectPreview ? X01_REMAINING_SCORE_BAR_EFFECT_PREVIEW_SCORE : undefined,
      loop: isEffectPreview && previewEffect === "previous-score-trail" ? "previous-score-trail-drop" : undefined,
    })
  );
  return buildPreviewOptionLayout(documentRef, {
    layoutClassName: "ad-xconfig-option-layout ad-xconfig-option-layout--x01-remaining-score-bar-preview",
    optionLabel,
    optionDescription,
    previewNode: preview,
    isActive,
  });
}

function isCheckoutSuggestionStylesFeature(feature) {
  return feature?.featureKey === STYLE_CHECKOUT_SUGGESTIONS_FEATURE_KEY;
}

function isCheckoutSuggestionStylesStyleField(feature, field) {
  return (
    isCheckoutSuggestionStylesFeature(feature) &&
    field?.control === "select" &&
    String(field?.key || "").trim() === STYLE_CHECKOUT_SUGGESTIONS_STYLE_FIELD_KEY
  );
}

function resolveCheckoutSuggestionPreviewStyle(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return STYLE_CHECKOUT_SUGGESTIONS_STYLES.has(normalized) ? normalized : "badge";
}

function resolveCheckoutSuggestionPreviewTheme(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return STYLE_CHECKOUT_SUGGESTIONS_THEMES[normalized] || STYLE_CHECKOUT_SUGGESTIONS_THEMES.amber;
}

function applyCheckoutSuggestionPreviewTheme(node, featureConfig = {}) {
  if (!node?.style) {
    return;
  }

  const theme = resolveCheckoutSuggestionPreviewTheme(featureConfig.colorTheme);
  node.style.setProperty("--ad-ext-accent", theme.accentColor);
  node.style.setProperty("--ad-ext-accent-soft", theme.accentSoftColor);
  node.style.setProperty("--ad-ext-accent-strong", theme.accentStrongColor);
  node.style.setProperty("--ad-ext-label-bg", theme.labelBackground);
  node.style.setProperty("--ad-ext-label-color", theme.labelTextColor);
}

function buildCheckoutSuggestionSample(documentRef, featureConfig = {}, overrides = {}, options = {}) {
  const previewConfig = {
    ...featureConfig,
    ...overrides,
  };
  const styleName = resolveCheckoutSuggestionPreviewStyle(previewConfig.style);
  const labelText = String(previewConfig.labelText || "").trim();
  const card = createElement(documentRef, "div", {
    className: [
      "ad-xconfig-checkout-suggestion-demo",
      `ad-xconfig-checkout-suggestion-demo--${styleName}`,
      options.mini ? "ad-xconfig-checkout-suggestion-demo--mini" : "",
    ].filter(Boolean).join(" "),
  });
  applyCheckoutSuggestionPreviewTheme(card, previewConfig);

  if (labelText) {
    card.appendChild(createElement(documentRef, "span", {
      className: "ad-xconfig-checkout-suggestion-demo-label",
      text: labelText,
    }));
  }
  card.appendChild(createElement(documentRef, "span", {
    className: "ad-xconfig-checkout-suggestion-demo-score",
    text: "96",
  }));
  card.appendChild(createElement(documentRef, "span", {
    className: "ad-xconfig-checkout-suggestion-demo-route",
    text: "T20  D18",
  }));
  return card;
}

function buildCheckoutSuggestionPreviewSection(documentRef, feature) {
  return buildSettingsPreviewSection(documentRef, {
    previewAttribute: "data-adxconfig-checkout-suggestion-styles-preview",
    rowClassName: "ad-xconfig-setting-row ad-xconfig-setting-row--checkout-suggestion-preview",
    surfaceClassName: "ad-xconfig-checkout-suggestion-preview-surface",
    fillSurface: (surface) => {
      surface.appendChild(buildCheckoutSuggestionSample(documentRef, feature?.config || {}));
    },
  });
}

function buildCheckoutSuggestionStyleOptionLayout(
  documentRef,
  feature,
  optionValue,
  optionLabel,
  optionDescription,
  isActive
) {
  const preview = createElement(documentRef, "div", {
    className: "ad-xconfig-checkout-suggestion-option-preview",
  });
  preview.appendChild(
    buildCheckoutSuggestionSample(documentRef, feature?.config || {}, {
      style: optionValue,
    }, {
      mini: true,
    })
  );
  return buildPreviewOptionLayout(documentRef, {
    layoutClassName: "ad-xconfig-option-layout ad-xconfig-option-layout--checkout-suggestion-style",
    optionLabel,
    optionDescription,
    previewNode: preview,
    isActive,
  });
}

function getColorFieldValue(feature, field) {
  return normalizeHexColor(feature?.config?.[field?.key], "");
}

function getColorPickerDisplayValue(colorValue) {
  return normalizeHexColor(colorValue, "") || XCONFIG_COLOR_INPUT_DEFAULT;
}

function buildColorFieldStatusText(colorValue, invalid) {
  if (invalid) {
    return "Ungültiger Hex-Code. Erlaubt sind #RGB oder #RRGGBB.";
  }

  return colorValue ? `Gespeichert: ${colorValue}` : "Theme-Default aktiv.";
}

export function syncColorFieldControl(fieldNode, options = {}) {
  if (!fieldNode || typeof fieldNode.setAttribute !== "function") {
    return;
  }

  const normalizedValue = normalizeHexColor(options.value, "");
  const invalid = options.invalid === true;
  const displayValue = invalid
    ? String(options.displayValue ?? "")
    : normalizedValue;
  const pickerValue = getColorPickerDisplayValue(normalizedValue);
  const swatchNode = fieldNode.querySelector?.("[data-adxconfig-color-swatch='true']") || null;
  const pickerNode =
    fieldNode.querySelector?.("[data-adxconfig-setting='true'][data-color-input-role='picker']") ||
    null;
  const codeNode =
    fieldNode.querySelector?.("[data-adxconfig-setting='true'][data-color-input-role='hex']") ||
    null;
  const resetNode =
    fieldNode.querySelector?.("[data-adxconfig-action='clear-setting-color']") || null;
  const statusNode =
    fieldNode.querySelector?.("[data-adxconfig-color-status='true']") || null;

  fieldNode.dataset.invalid = invalid ? "true" : "false";
  fieldNode.dataset.hasCustomValue = normalizedValue ? "true" : "false";
  fieldNode.dataset.colorValue = normalizedValue;

  if (swatchNode) {
    swatchNode.style.background = normalizedValue || "";
  }
  if (pickerNode) {
    pickerNode.value = pickerValue;
  }
  if (codeNode) {
    codeNode.value = displayValue;
    codeNode.setAttribute("aria-invalid", invalid ? "true" : "false");
  }
  if (resetNode) {
    resetNode.disabled = !normalizedValue;
  }
  if (statusNode) {
    statusNode.textContent = buildColorFieldStatusText(normalizedValue, invalid);
    statusNode.className = invalid
      ? "ad-xconfig-note ad-xconfig-color-status ad-xconfig-color-status--error"
      : "ad-xconfig-note ad-xconfig-color-status";
  }
}

function resolveFieldOptionPreview(feature, field, optionValue) {
  if (!isDartDesignSelectField(feature, field)) {
    return "";
  }
  if (isTurnDartAssetSelectField(feature, field)) {
    return resolveTurnDartAsset(optionValue);
  }
  return resolveDartDesignAsset(optionValue);
}

function buildThemeGlobalTypographyOptionLabel(documentRef, option) {
  const labelNode = createElement(documentRef, "span", {
    className: "ad-xconfig-option-label",
    text: option?.label || "",
  });
  applyThemeGlobalTypographyPreviewFont(labelNode, option?.value);
  return labelNode;
}

function applyThemeGlobalTypographyPreviewFont(node, optionValue) {
  if (!node) {
    return;
  }
  const preset = getThemeGlobalTypographyPreset(optionValue);
  const previewFontFamily = String(preset?.previewFontFamily || "").trim();
  if (previewFontFamily && preset?.remote) {
    node.style.fontFamily = previewFontFamily;
    node.dataset.adxconfigPreviewFont = preset.value;
    return;
  }
  node.style.fontFamily = "";
  node.removeAttribute?.("data-adxconfig-preview-font");
}

function buildThemeGlobalTypographyFontOptionLayout(documentRef, option, isActive) {
  const layout = createElement(documentRef, "span", {
    className: "ad-xconfig-font-option-layout",
  });
  layout.appendChild(buildThemeGlobalTypographyOptionLabel(documentRef, option));

  const sample = createElement(documentRef, "span", {
    className: "ad-xconfig-font-option-sample",
    text: "501",
    attributes: {
      "aria-hidden": "true",
    },
  });
  applyThemeGlobalTypographyPreviewFont(sample, option?.value);
  layout.appendChild(sample);

  const activeSlot = createElement(documentRef, "span", {
    className: "ad-xconfig-font-option-active-slot",
    attributes: {
      "data-option-active-slot": "true",
    },
  });
  if (isActive) {
    activeSlot.appendChild(buildTypographyFontActiveMark(documentRef));
  }
  layout.appendChild(activeSlot);
  return layout;
}

function buildTypographyFontActiveMark(documentRef) {
  return createElement(documentRef, "span", {
    className: "ad-xconfig-option-active ad-xconfig-font-option-check",
    text: "✓",
    attributes: {
      "aria-hidden": "true",
    },
  });
}

function normalizeTypographyFontSearchValue(value) {
  return String(value || "").trim().toLocaleLowerCase("de");
}

function setTypographyFontSearchVisibility(optionList, emptyState, rawQuery) {
  const query = normalizeTypographyFontSearchValue(rawQuery);
  let visibleCount = 0;
  Array.from(optionList?.children || []).forEach((optionNode) => {
    const searchValue = String(optionNode.dataset?.fontSearchValue || "");
    const isVisible = !query || searchValue.includes(query);
    optionNode.hidden = !isVisible;
    if (isVisible) {
      optionNode.removeAttribute?.("hidden");
      visibleCount += 1;
    } else {
      optionNode.setAttribute?.("hidden", "");
    }
  });
  if (emptyState) {
    emptyState.hidden = visibleCount > 0;
    if (visibleCount > 0) {
      emptyState.setAttribute?.("hidden", "");
    } else {
      emptyState.removeAttribute?.("hidden");
    }
  }
}

function buildThemeGlobalTypographyFontPicker(
  documentRef,
  field,
  selectedOptionValues,
  optionList
) {
  const selectedValue = selectedOptionValues[0] || String(field.options[0]?.value || "");
  const selectedOption = field.options.find(
    (option) => String(option?.value ?? "") === selectedValue
  ) || field.options[0] || {};
  const picker = createElement(documentRef, "details", {
    className: "ad-xconfig-font-picker",
    attributes: {
      "data-adxconfig-font-picker": "true",
    },
  });
  const current = createElement(documentRef, "summary", {
    className: "ad-xconfig-font-picker-current",
  });
  const identity = createElement(documentRef, "span", {
    className: "ad-xconfig-font-picker-current-identity",
  });
  const currentName = createElement(documentRef, "strong", {
    className: "ad-xconfig-font-picker-current-name",
    text: selectedOption.label || "Standard",
    attributes: {
      "data-adxconfig-font-picker-current-name": "true",
    },
  });
  applyThemeGlobalTypographyPreviewFont(currentName, selectedValue);
  identity.appendChild(currentName);
  identity.appendChild(createElement(documentRef, "span", {
    className: "ad-xconfig-font-picker-current-state",
    text: "Aktiv",
  }));
  current.appendChild(identity);

  const preview = createElement(documentRef, "span", {
    className: "ad-xconfig-font-picker-current-preview",
    attributes: {
      "data-adxconfig-font-picker-current-preview": "true",
      "aria-hidden": "true",
    },
  });
  applyThemeGlobalTypographyPreviewFont(preview, selectedValue);
  ["THOMAS", "501", "T20"].forEach((sampleText) => {
    preview.appendChild(createElement(documentRef, "span", { text: sampleText }));
  });
  current.appendChild(preview);
  current.appendChild(createElement(documentRef, "span", {
    className: "ad-xconfig-font-picker-current-action",
    text: "Ändern",
    attributes: {
      "aria-hidden": "true",
    },
  }));
  picker.appendChild(current);

  const panel = createElement(documentRef, "div", {
    className: "ad-xconfig-font-picker-panel",
  });
  panel.appendChild(createElement(documentRef, "strong", {
    className: "ad-xconfig-font-picker-title",
    text: "Schriftart auswählen",
  }));
  const searchInput = createElement(documentRef, "input", {
    type: "search",
    className: "ad-xconfig-font-picker-search",
    attributes: {
      placeholder: "Schrift suchen …",
      "aria-label": "Schrift suchen",
      "data-adxconfig-font-search": "true",
      autocomplete: "off",
    },
  });
  panel.appendChild(searchInput);
  panel.appendChild(optionList);
  const emptyState = createElement(documentRef, "p", {
    className: "ad-xconfig-font-picker-empty",
    text: "Keine Schrift gefunden.",
    attributes: {
      hidden: "",
      "aria-live": "polite",
    },
  });
  emptyState.hidden = true;
  panel.appendChild(emptyState);
  searchInput.addEventListener("input", () => {
    setTypographyFontSearchVisibility(optionList, emptyState, searchInput.value);
  });
  picker.appendChild(panel);
  return picker;
}

function isTurnScoreCounterPreviewEffect(previewEffect) {
  return String(previewEffect || "").startsWith("turn-score-counter-");
}

function resolveTurnScoreCounterPreviewEffect(feature, field, optionValue) {
  if (feature?.featureKey !== "turn-score-counter") {
    return "";
  }
  const settingKey = String(field?.key || "").trim();
  const normalizedValue = String(optionValue ?? "").trim();
  if (settingKey === "countEffect") {
    return `turn-score-counter-${normalizedValue || "countup"}`;
  }
  if (settingKey === "durationMs") {
    if (normalizedValue === "1000") {
      return "turn-score-counter-fast";
    }
    if (normalizedValue === "5000") {
      return "turn-score-counter-slow";
    }
    return "turn-score-counter-standard-speed";
  }
  if (settingKey === "flashMode") {
    return normalizedValue === "permanent"
      ? "turn-score-counter-flash-permanent"
      : "turn-score-counter-flash-change";
  }
  return "";
}

function buildTurnScoreCounterOptionPreview(documentRef) {
  const preview = createElement(documentRef, "span", {
    className: "ad-xconfig-turn-score-option-preview",
    attributes: {
      "aria-hidden": "true",
      "data-adxconfig-turn-score-preview": "true",
    },
  });

  preview.appendChild(createElement(documentRef, "span", {
    className: TURN_SCORE_PREVIEW_SCORE_CLASS,
    text: "501",
    attributes: {
      [TURN_SCORE_PREVIEW_SCORE_ATTRIBUTE]: "true",
    },
  }));

  return preview;
}

function buildTurnScoreCounterOptionLayout(
  documentRef,
  optionLabel,
  optionDescription,
  isActive
) {
  const layout = createElement(documentRef, "div", {
    className: "ad-xconfig-option-layout ad-xconfig-option-layout--turn-score-counter",
  });
  layout.appendChild(createElement(documentRef, "span", {
    className: "ad-xconfig-option-label",
    text: optionLabel,
  }));

  if (optionDescription) {
    layout.appendChild(createElement(documentRef, "span", {
      className: "ad-xconfig-option-copy",
      text: optionDescription,
    }));
  }

  layout.appendChild(buildTurnScoreCounterOptionPreview(documentRef));

  const activeSlot = createElement(documentRef, "span", {
    className: "ad-xconfig-option-active-slot",
    attributes: {
      "data-option-active-slot": "true",
    },
  });
  if (isActive) {
    activeSlot.appendChild(buildOptionActiveBadge(documentRef));
  }
  layout.appendChild(activeSlot);

  return layout;
}

function isAvgTrendArrowPreviewEffect(previewEffect) {
  return String(previewEffect || "").startsWith("avg-trend-arrow-");
}

function resolveAvgTrendArrowPreviewEffect(feature, field, optionValue) {
  if (feature?.featureKey !== "avg-trend-arrow") {
    return "";
  }
  const settingKey = String(field?.key || "").trim();
  const normalizedValue = String(optionValue ?? "").trim();
  if (settingKey === "durationMs") {
    return `avg-trend-arrow-duration-${normalizedValue || "320"}`;
  }
  if (settingKey === "size") {
    return `avg-trend-arrow-size-${normalizedValue || "standard"}`;
  }
  return "";
}

function buildAvgTrendArrowOptionPreview(documentRef, field, optionValue) {
  const preview = createElement(documentRef, "span", {
    className: AVG_TREND_PREVIEW_CLASS,
    attributes: {
      "aria-hidden": "true",
      "data-adxconfig-avg-trend-preview-host": "true",
    },
  });
  const settingKey = String(field?.key || "").trim();
  const size = resolveAvgTrendArrowSize(settingKey === "size" ? optionValue : "standard");
  const durationMs = resolveAvgTrendArrowDuration(
    settingKey === "durationMs" ? optionValue : 320
  );
  const arrow = createElement(documentRef, "span", {
    className: [
      ARROW_CLASS,
      VISIBLE_CLASS,
      UP_CLASS,
    ].join(" "),
    attributes: {
      [AVG_TREND_PREVIEW_ATTRIBUTE]: "true",
    },
  });
  arrow.style.setProperty(ARROW_HALF_WIDTH_VAR, `${size.arrowHalfWidthPx}px`);
  arrow.style.setProperty(ARROW_HEIGHT_VAR, `${size.arrowHeightPx}px`);
  arrow.style.setProperty("--ad-xconfig-avg-trend-preview-duration", `${durationMs}ms`);
  preview.appendChild(arrow);
  return preview;
}

function buildAvgTrendArrowOptionLayout(
  documentRef,
  field,
  optionValue,
  optionLabel,
  optionDescription,
  isActive
) {
  const layout = createElement(documentRef, "div", {
    className: "ad-xconfig-option-layout ad-xconfig-option-layout--avg-trend-arrow",
  });
  const textNode = createElement(documentRef, "span", {
    className: "ad-xconfig-option-text",
  });
  textNode.appendChild(createElement(documentRef, "span", {
    className: "ad-xconfig-option-label",
    text: optionLabel,
  }));
  if (optionDescription) {
    textNode.appendChild(createElement(documentRef, "span", {
      className: "ad-xconfig-option-copy",
      text: optionDescription,
    }));
  }
  layout.appendChild(textNode);
  layout.appendChild(buildAvgTrendArrowOptionPreview(documentRef, field, optionValue));

  const activeSlot = createElement(documentRef, "span", {
    className: "ad-xconfig-option-active-slot",
    attributes: {
      "data-option-active-slot": "true",
    },
  });
  if (isActive) {
    activeSlot.appendChild(buildOptionActiveBadge(documentRef));
  }
  layout.appendChild(activeSlot);
  return layout;
}

function isDartboardMarkerHighlightPreviewEffect(previewEffect) {
  return String(previewEffect || "").startsWith("dartboard-marker-highlight-");
}

function resolveDartboardMarkerHighlightPreviewEffect(feature, field, optionValue) {
  if (feature?.featureKey !== DARTBOARD_MARKER_HIGHLIGHT_FEATURE_KEY) {
    return "";
  }
  const settingKey = String(field?.key || "").trim();
  if (!["size", "effect", "opacityPercent"].includes(settingKey)) {
    return "";
  }
  const normalizedValue = String(optionValue ?? "").trim();
  return `dartboard-marker-highlight-${settingKey}-${normalizedValue}`;
}

function resolveDartboardMarkerHighlightPreviewConfig(feature, field, optionValue, options = {}) {
  const settingKey = String(field?.key || "").trim();
  const nextConfig = { ...feature?.config };
  if (settingKey === "size" || settingKey === "opacityPercent") {
    nextConfig[settingKey] = Number(optionValue);
  } else if (settingKey === "effect") {
    nextConfig.effect = String(optionValue ?? "");
  }
  if (options.idle) {
    nextConfig.effect = "none";
  }
  return resolveDartboardMarkerHighlightConfig(nextConfig);
}

function createSvgElement(documentRef, tagName, attributes = {}) {
  const element = documentRef.createElementNS("http://www.w3.org/2000/svg", tagName);
  Object.entries(attributes).forEach(([name, value]) => {
    element.setAttribute(name, String(value));
  });
  return element;
}

function buildDartboardMarkerHighlightOptionPreview(documentRef, feature, field, optionValue) {
  const preview = createElement(documentRef, "span", {
    className: DARTBOARD_MARKER_HIGHLIGHT_PREVIEW_CLASS,
    attributes: {
      "aria-hidden": "true",
      [DARTBOARD_MARKER_HIGHLIGHT_PREVIEW_ATTRIBUTE]: "true",
    },
  });
  const svg = createSvgElement(documentRef, "svg", {
    viewBox: "0 0 42 42",
    focusable: "false",
  });
  svg.appendChild(createSvgElement(documentRef, "circle", {
    cx: "21",
    cy: "21",
    r: "16",
    class: "ad-xconfig-dartboard-marker-highlight-board-dot",
  }));
  const marker = createSvgElement(documentRef, "circle", {
    cx: "21",
    cy: "21",
    [DARTBOARD_MARKER_HIGHLIGHT_PREVIEW_MARKER_ATTRIBUTE]: "true",
  });
  applyDartboardMarkerHighlightToMarker(
    marker,
    resolveDartboardMarkerHighlightPreviewConfig(feature, field, optionValue, { idle: true })
  );
  svg.appendChild(marker);
  preview.appendChild(svg);
  return preview;
}

function buildDartboardMarkerHighlightOptionLayout(
  documentRef,
  feature,
  field,
  optionValue,
  optionLabel,
  optionDescription,
  isActive
) {
  const layout = createElement(documentRef, "div", {
    className: "ad-xconfig-option-layout ad-xconfig-option-layout--dartboard-marker-highlight",
  });
  const textNode = createElement(documentRef, "span", {
    className: "ad-xconfig-option-text",
  });
  textNode.appendChild(createElement(documentRef, "span", {
    className: "ad-xconfig-option-label",
    text: optionLabel,
  }));
  if (optionDescription) {
    textNode.appendChild(createElement(documentRef, "span", {
      className: "ad-xconfig-option-copy",
      text: optionDescription,
    }));
  }
  layout.appendChild(textNode);
  layout.appendChild(
    buildDartboardMarkerHighlightOptionPreview(documentRef, feature, field, optionValue)
  );

  const activeSlot = createElement(documentRef, "span", {
    className: "ad-xconfig-option-active-slot",
    attributes: {
      "data-option-active-slot": "true",
    },
  });
  if (isActive) {
    activeSlot.appendChild(buildOptionActiveBadge(documentRef));
  }
  layout.appendChild(activeSlot);
  return layout;
}

function buildDartDesignOptionLayout(
  documentRef,
  optionLabel,
  optionDescription,
  optionPreviewUrl,
  isActive
) {
  const layout = createElement(documentRef, "div", {
    className: "ad-xconfig-option-layout ad-xconfig-option-layout--dart-design",
  });

  const optionText = createElement(documentRef, "div", {
    className: "ad-xconfig-option-text",
  });
  const head = createElement(documentRef, "div", {
    className: "ad-xconfig-option-head",
  });
  head.appendChild(createElement(documentRef, "span", {
    className: "ad-xconfig-option-label",
    text: optionLabel,
  }));
  optionText.appendChild(head);

  if (optionDescription) {
    optionText.appendChild(createElement(documentRef, "span", {
      className: "ad-xconfig-option-copy",
      text: optionDescription,
    }));
  }
  layout.appendChild(optionText);

  layout.appendChild(createElement(documentRef, "img", {
    className: "ad-xconfig-option-preview",
    attributes: {
      src: optionPreviewUrl,
      alt: `${optionLabel} Dart-Vorschau`,
      loading: "lazy",
      decoding: "async",
    },
  }));

  const activeSlot = createElement(documentRef, "div", {
    className: "ad-xconfig-option-active-slot",
    attributes: {
      "data-option-active-slot": "true",
    },
  });
  if (isActive) {
    activeSlot.appendChild(buildOptionActiveBadge(documentRef));
  }
  layout.appendChild(activeSlot);

  return layout;
}

function resolveThemeActionNoteText(action) {
  if (action === "clearThemeBackground") {
    return "Entfernt das gespeicherte Bild für dieses Theme.";
  }

  if (action === "uploadThemeBackground") {
    return "Öffnet die Dateiauswahl und speichert das Bild für dieses Theme.";
  }

  return "";
}

function buildX01BustActivePlayerHighlightPreview(documentRef) {
  const preview = createElement(documentRef, "div", {
    className: "ad-xconfig-x01-bust-preview",
  });
  const card = createElement(documentRef, "div", {
    className: "ad-ext-player ad-ext-player-active ad-xconfig-x01-bust-preview-card",
    attributes: {
      "data-adxconfig-x01-bust-active-player-preview-card": "true",
    },
  });
  const stack = createElement(documentRef, "div", {
    className: "chakra-stack ad-xconfig-x01-bust-preview-stack",
  });
  const head = createElement(documentRef, "div", {
    className: "ad-xconfig-x01-bust-preview-head",
  });
  head.appendChild(createElement(documentRef, "span", {
    className: "ad-xconfig-x01-bust-preview-leg",
    text: "0",
  }));
  head.appendChild(createElement(documentRef, "span", {
    className: "ad-xconfig-x01-bust-preview-name",
    text: "TORNADO T...",
  }));
  head.appendChild(createElement(documentRef, "span", {
    className: "ad-xconfig-x01-bust-preview-score",
    text: "121",
  }));
  stack.appendChild(head);
  stack.appendChild(createElement(documentRef, "div", {
    className: "ad-xconfig-x01-bust-preview-meta",
    text: "#2 | Ø 0.0 / 0.0",
  }));
  stack.appendChild(createElement(documentRef, "div", {
    className: "ad-xconfig-x01-bust-preview-bar",
  }));
  card.appendChild(stack);
  preview.appendChild(card);
  return preview;
}

function buildFeatureActionField(documentRef, feature, field, fieldId) {
  const previewTarget = String(field?.previewTarget || "").trim();
  if (previewTarget === "theme-global-template-preset") {
    return buildThemeGlobalTemplatePresetActionField(documentRef, feature, field, fieldId);
  }

  const previewColorTheme = String(field?.previewColorTheme || "").trim();
  const wrapper = createElement(documentRef, "div", {
    className: "ad-xconfig-setting-action",
  });
  const button = createElement(documentRef, "button", {
    id: fieldId,
    type: "button",
    className: [
      "ad-xconfig-setting-action-btn",
      field.prominent ? "ad-xconfig-setting-action-btn--primary" : "",
      previewColorTheme ? "ad-xconfig-option-item--color-preview" : "",
    ].filter(Boolean).join(" "),
    text: field.buttonLabel || field.label,
    attributes: {
      "data-adxconfig-action": field.action,
      "data-feature-key": feature.featureKey,
      "data-config-key": feature.configKey,
      "data-feature-action-id": field.actionId || "",
      "data-preview-color-theme": previewColorTheme || undefined,
    },
  });
  if (previewTarget) {
    const previewNode = createElement(documentRef, "div", {
      className: "ad-xconfig-setting-action-preview",
      attributes: {
        "data-adxconfig-action-preview-target": previewTarget,
        "data-feature-action-id": field.actionId || "",
      },
    });
    if (previewTarget === "x01-bust-active-player-highlight") {
      previewNode.appendChild(buildX01BustActivePlayerHighlightPreview(documentRef));
    }
    wrapper.appendChild(previewNode);
  }
  wrapper.appendChild(button);
  const noteText = String(field.description || resolveThemeActionNoteText(field.action)).trim();
  if (noteText) {
    wrapper.appendChild(createElement(documentRef, "p", {
      className: "ad-xconfig-note",
      text: noteText,
    }));
  }
  if (isBackgroundThemeFeature(feature) && field.action === "uploadThemeBackground") {
    wrapper.appendChild(buildThemeBackgroundStatus(documentRef, feature));
    wrapper.appendChild(createElement(documentRef, "p", {
      className: "ad-xconfig-note ad-xconfig-theme-action-feedback",
      attributes: {
        "data-adxconfig-theme-action-feedback": "true",
        "data-feature-key": feature.featureKey,
      },
    }));
  }
  if (field.action === "uploadTurnDartImage") {
    wrapper.appendChild(buildTurnDartImageStatus(documentRef, feature));
  }
  return wrapper;
}

function appendThemeGlobalTemplatePresetSwatches(documentRef, parent, preset) {
  const swatches = createElement(documentRef, "span", {
    className: "ad-xconfig-theme-preset-swatches",
    attributes: {
      "aria-hidden": "true",
    },
  });
  [preset.accentColor, preset.scoreColor, preset.secondaryTextColor, preset.throwLabelColor]
    .forEach((color) => {
      const swatch = createElement(documentRef, "span", {
        className: "ad-xconfig-theme-preset-swatch",
      });
      swatch.style.backgroundColor = color;
      swatches.appendChild(swatch);
    });
  parent.appendChild(swatches);
}

function applyThemeGlobalTemplatePresetPreviewStyles(button, preset, fontPreset) {
  const backgroundOpacity = Math.max(0, Math.min(100, Number(preset.backgroundOpacity) || 0));
  const playerFieldTransparency = Math.max(
    0,
    Math.min(95, Number(preset.playerFieldTransparency) || 0)
  );
  const tintIntensity = Math.max(0, Math.min(100, Number(preset.activePlayerTintIntensity) || 0));
  button.style.setProperty("--ad-xconfig-theme-preset-accent", preset.accentColor);
  button.style.setProperty("--ad-xconfig-theme-preset-score", preset.scoreColor);
  button.style.setProperty("--ad-xconfig-theme-preset-secondary", preset.secondaryTextColor);
  button.style.setProperty("--ad-xconfig-theme-preset-throw", preset.throwLabelColor);
  button.style.setProperty(
    "--ad-xconfig-theme-preset-overlay-alpha",
    String((100 - backgroundOpacity) / 100)
  );
  button.style.setProperty(
    "--ad-xconfig-theme-preset-player-alpha",
    String((100 - playerFieldTransparency) / 100)
  );
  button.style.setProperty("--ad-xconfig-theme-preset-tint", `${tintIntensity}%`);
  button.style.setProperty(
    "--ad-xconfig-theme-preset-font",
    String(fontPreset?.previewFontFamily || "inherit")
  );
}

function buildThemeGlobalTemplatePresetActionField(documentRef, feature, field, fieldId) {
  const preset = getThemeGlobalTemplatePreset(field?.actionId);
  if (!preset) {
    return createElement(documentRef, "p", {
      className: "ad-xconfig-note",
      text: `Preset ${field?.buttonLabel || field?.label || ""} ist nicht verfügbar.`,
    });
  }

  const wallpaperUrl = resolveThemePresetAsset(preset.backgroundAssetKey);
  const fontPreset = getThemeGlobalTypographyPreset(preset.fontPreset);
  const wrapper = createElement(documentRef, "div", {
    className: "ad-xconfig-setting-action ad-xconfig-setting-action--theme-preset",
  });
  const button = createElement(documentRef, "button", {
    id: fieldId,
    type: "button",
    className: "ad-xconfig-theme-preset-card",
    attributes: {
      "data-adxconfig-action": field.action,
      "data-feature-key": feature.featureKey,
      "data-config-key": feature.configKey,
      "data-feature-action-id": preset.key,
      "data-theme-preset-key": preset.key,
      "data-theme-preset-has-wallpaper": wallpaperUrl ? "true" : "false",
      "data-theme-preset-background-mode": preset.backgroundDisplayMode,
      "data-adxconfig-preview-font": fontPreset?.remote ? fontPreset.value : undefined,
      "aria-label": `Preset ${preset.label} anwenden`,
      title: preset.description,
    },
  });
  applyThemeGlobalTemplatePresetPreviewStyles(button, preset, fontPreset);

  if (wallpaperUrl) {
    button.appendChild(createElement(documentRef, "img", {
      className: "ad-xconfig-theme-preset-wallpaper",
      attributes: {
        src: wallpaperUrl,
        alt: "",
        loading: "lazy",
        decoding: "async",
      },
    }));
  }

  const content = createElement(documentRef, "span", {
    className: "ad-xconfig-theme-preset-content",
  });
  const identity = createElement(documentRef, "span", {
    className: "ad-xconfig-theme-preset-identity",
  });
  identity.appendChild(createElement(documentRef, "span", {
    className: "ad-xconfig-theme-preset-name",
    text: preset.label,
  }));
  if (!wallpaperUrl) {
    identity.appendChild(createElement(documentRef, "span", {
      className: "ad-xconfig-theme-preset-wallpaper-state",
      text: "ohne Wallpaper",
    }));
  }
  appendThemeGlobalTemplatePresetSwatches(documentRef, identity, preset);
  content.appendChild(identity);

  const player = createElement(documentRef, "span", {
    className: "ad-xconfig-theme-preset-player",
  });
  player.appendChild(createElement(documentRef, "span", {
    className: "ad-xconfig-theme-preset-player-name",
    text: "THOMAS",
    attributes: {
      "data-adxconfig-preview-font": fontPreset?.remote ? fontPreset.value : undefined,
    },
  }));
  player.appendChild(createElement(documentRef, "strong", {
    className: "ad-xconfig-theme-preset-score",
    text: "501",
  }));
  player.appendChild(createElement(documentRef, "span", {
    className: "ad-xconfig-theme-preset-throw",
    text: "T20",
  }));
  content.appendChild(player);
  button.appendChild(content);
  wrapper.appendChild(button);
  return wrapper;
}

function resolveSelectOptionPreviewState(feature, field, option) {
  const optionValue = String(option?.value ?? "");
  const previewEffect =
    String(option?.previewEffect || "").trim() ||
    resolveTurnScoreCounterPreviewEffect(feature, field, optionValue) ||
    resolveAvgTrendArrowPreviewEffect(feature, field, optionValue) ||
    resolveDartboardMarkerHighlightPreviewEffect(feature, field, optionValue);

  return {
    isDartDesignField: isDartDesignSelectField(feature, field),
    isTypographyFontField: isThemeGlobalTypographyFontField(feature, field),
    isCheckoutScoreHighlightPreviewSelectField: isCheckoutScoreHighlightPreviewField(feature, field),
    isCheckoutTargetHighlightsPreviewSelectField: isCheckoutTargetHighlightsPreviewField(feature, field),
    isX01RemainingScoreBarPreviewSelectField: isX01RemainingScoreBarPreviewField(feature, field),
    isCheckoutSuggestionStyleField: isCheckoutSuggestionStylesStyleField(feature, field),
    previewEffect,
    hasTurnScoreCounterPreview: isTurnScoreCounterPreviewEffect(previewEffect),
    hasAvgTrendArrowPreview: isAvgTrendArrowPreviewEffect(previewEffect),
    hasDartboardMarkerHighlightPreview: isDartboardMarkerHighlightPreviewEffect(previewEffect),
  };
}

function buildSelectOptionClassName(state, previewColorTheme) {
  return [
    "ad-xconfig-option-item",
    state.isDartDesignField ? "ad-xconfig-option-item--dart-design" : "",
    state.isTypographyFontField ? "ad-xconfig-option-item--typography-font" : "",
    state.isCheckoutScoreHighlightPreviewSelectField ? "ad-xconfig-option-item--checkout-score-highlight-preview" : "",
    state.isCheckoutTargetHighlightsPreviewSelectField ? "ad-xconfig-option-item--checkout-board-preview" : "",
    state.isX01RemainingScoreBarPreviewSelectField ? "ad-xconfig-option-item--x01-remaining-score-bar-preview" : "",
    state.isCheckoutSuggestionStyleField ? "ad-xconfig-option-item--checkout-suggestion-style" : "",
    state.previewEffect ? "ad-xconfig-option-item--effect-preview" : "",
    state.hasTurnScoreCounterPreview ? "ad-xconfig-option-item--turn-score-counter-preview" : "",
    state.hasAvgTrendArrowPreview ? "ad-xconfig-option-item--avg-trend-arrow-preview" : "",
    state.hasDartboardMarkerHighlightPreview ? "ad-xconfig-option-item--dartboard-marker-highlight-preview" : "",
    previewColorTheme ? "ad-xconfig-option-item--color-preview" : "",
  ].filter(Boolean).join(" ");
}

function appendDefaultSelectOptionLayout(documentRef, optionButton, option, optionDescription, state, isActive) {
  const head = createElement(documentRef, "div", {
    className: "ad-xconfig-option-head",
  });
  head.appendChild(
    state.isTypographyFontField
      ? buildThemeGlobalTypographyOptionLabel(documentRef, option)
      : createElement(documentRef, "span", {
        className: "ad-xconfig-option-label",
        text: option.label,
      })
  );
  if (isActive) {
    head.appendChild(buildOptionActiveBadge(documentRef));
  }
  optionButton.appendChild(head);

  if (optionDescription) {
    optionButton.appendChild(createElement(documentRef, "span", {
      className: "ad-xconfig-option-copy",
      text: optionDescription,
    }));
  }
}

function appendSelectOptionLayout(documentRef, optionButton, feature, field, option, state, isActive) {
  const optionValue = String(option?.value ?? "");
  const optionDescription = state.isTypographyFontField || isTurnDartAssetSelectField(feature, field)
    ? ""
    : String(option?.description || "").trim();

  if (state.isTypographyFontField) {
    optionButton.appendChild(
      buildThemeGlobalTypographyFontOptionLayout(documentRef, option, isActive)
    );
    return;
  }
  if (state.isDartDesignField) {
    const optionPreviewUrl = resolveFieldOptionPreview(feature, field, optionValue);
    optionButton.appendChild(
      buildDartDesignOptionLayout(documentRef, option.label, optionDescription, optionPreviewUrl, isActive)
    );
    return;
  }
  if (state.hasTurnScoreCounterPreview) {
    optionButton.appendChild(
      buildTurnScoreCounterOptionLayout(documentRef, option.label, optionDescription, isActive)
    );
    return;
  }
  if (state.hasAvgTrendArrowPreview) {
    optionButton.appendChild(
      buildAvgTrendArrowOptionLayout(documentRef, field, optionValue, option.label, optionDescription, isActive)
    );
    return;
  }
  if (state.hasDartboardMarkerHighlightPreview) {
    optionButton.appendChild(
      buildDartboardMarkerHighlightOptionLayout(documentRef, feature, field, optionValue, option.label, optionDescription, isActive)
    );
    return;
  }
  if (state.isCheckoutScoreHighlightPreviewSelectField) {
    optionButton.appendChild(
      buildCheckoutScoreHighlightOptionLayout(documentRef, feature, field, optionValue, option.label, optionDescription, isActive)
    );
    return;
  }
  if (state.isCheckoutTargetHighlightsPreviewSelectField) {
    optionButton.appendChild(
      buildCheckoutTargetHighlightsOptionLayout(documentRef, feature, field, optionValue, option.label, optionDescription, isActive)
    );
    return;
  }
  if (state.isX01RemainingScoreBarPreviewSelectField) {
    optionButton.appendChild(
      buildX01RemainingScoreBarOptionLayout(documentRef, feature, field, optionValue, option.label, optionDescription, isActive)
    );
    return;
  }
  if (state.isCheckoutSuggestionStyleField) {
    optionButton.appendChild(
      buildCheckoutSuggestionStyleOptionLayout(documentRef, feature, optionValue, option.label, optionDescription, isActive)
    );
    return;
  }
  appendDefaultSelectOptionLayout(documentRef, optionButton, option, optionDescription, state, isActive);
}

function buildFeatureSelectField(documentRef, feature, field, fieldId) {
  const selectedOptionValues = resolveSelectFieldValues(feature, field);
  const list = createElement(documentRef, "div", {
    id: fieldId,
    className: "ad-xconfig-option-list",
    attributes: {
      "data-adxconfig-setting": "true",
      "data-feature-key": feature.featureKey,
      "data-config-key": feature.configKey,
      "data-setting-key": field.key,
      "data-setting-control": "select",
      "data-selected-value": selectedOptionValues.join(","),
      "data-multiple": isMultiSelectField(field) ? "true" : "false",
    },
  });

  field.options.forEach((option) => {
    const optionValue = String(option?.value ?? "");
    const isActive = selectedOptionValues.includes(optionValue);
    const state = resolveSelectOptionPreviewState(feature, field, option);
    const previewColorTheme = String(option?.previewColorTheme || "").trim();
    const optionButton = createElement(documentRef, "button", {
      type: "button",
      className: buildSelectOptionClassName(state, previewColorTheme),
      attributes: {
        "data-adxconfig-action": "set-setting-select-option",
        "data-adxconfig-option-note": "true",
        "data-feature-key": feature.featureKey,
        "data-config-key": feature.configKey,
        "data-setting-key": field.key,
        "data-setting-value": optionValue,
        "data-option-value": optionValue,
        "data-option-description": String(option?.description || "").trim(),
        "data-preview-effect": state.previewEffect || undefined,
        "data-preview-color-theme": previewColorTheme || undefined,
        "data-multiple": isMultiSelectField(field) ? "true" : "false",
        "data-active": isActive ? "true" : "false",
        "data-font-search-value": state.isTypographyFontField
          ? normalizeTypographyFontSearchValue(option?.label)
          : undefined,
        "data-adxconfig-preview-font": state.isTypographyFontField && optionValue !== "system"
          ? optionValue
          : undefined,
        "aria-pressed": isActive ? "true" : "false",
      },
    });
    appendSelectOptionLayout(documentRef, optionButton, feature, field, option, state, isActive);
    list.appendChild(optionButton);
  });

  if (isThemeGlobalTypographyFontField(feature, field)) {
    list.className = "ad-xconfig-option-list ad-xconfig-font-option-list";
    return buildThemeGlobalTypographyFontPicker(
      documentRef,
      field,
      selectedOptionValues,
      list
    );
  }
  if (isTurnDartAssetSelectField(feature, field)) {
    list.className = "ad-xconfig-option-list ad-xconfig-turn-dart-asset-option-list";
  }
  return list;
}

function buildFeatureField(documentRef, feature, field) {
  const fieldId = `ad-xconfig-field-${feature.featureKey}-${field.key || field.action}`;

  if (field.control === "action") {
    return buildFeatureActionField(documentRef, feature, field, fieldId);
  }

  if (field.control === "checkbox") {
    const wrapper = createElement(documentRef, "div", {
      className: "ad-xconfig-onoff",
    });
    const input = createElement(documentRef, "input", {
      id: fieldId,
      type: "checkbox",
      className: "ad-xconfig-hidden-input",
      attributes: {
        "data-adxconfig-setting": "true",
        "data-feature-key": feature.featureKey,
        "data-config-key": feature.configKey,
        "data-setting-key": field.key,
        "data-setting-control": field.control,
      },
    });
    input.checked = Boolean(feature.config?.[field.key]);
    wrapper.appendChild(input);
    wrapper.appendChild(createElement(documentRef, "button", {
      type: "button",
      className: "ad-xconfig-onoff-btn ad-xconfig-onoff-btn--on",
      text: "An",
      attributes: {
        "data-adxconfig-action": "set-setting-toggle",
        "data-feature-key": feature.featureKey,
        "data-config-key": feature.configKey,
        "data-setting-key": field.key,
        "data-setting-value": "true",
        "data-active": input.checked ? "true" : "false",
      },
    }));
    wrapper.appendChild(createElement(documentRef, "button", {
      type: "button",
      className: "ad-xconfig-onoff-btn ad-xconfig-onoff-btn--off",
      text: "Aus",
      attributes: {
        "data-adxconfig-action": "set-setting-toggle",
        "data-feature-key": feature.featureKey,
        "data-config-key": feature.configKey,
        "data-setting-key": field.key,
        "data-setting-value": "false",
        "data-active": input.checked ? "false" : "true",
      },
    }));
    return wrapper;
  }

  if (field.control === "color") {
    const colorValue = getColorFieldValue(feature, field);
    const wrapper = createElement(documentRef, "div", {
      className: "ad-xconfig-color-field",
      attributes: {
        "data-adxconfig-color-field": "true",
        "data-feature-key": feature.featureKey,
        "data-config-key": feature.configKey,
        "data-setting-key": field.key,
        "data-invalid": "false",
        "data-has-custom-value": colorValue ? "true" : "false",
        "data-color-value": colorValue,
      },
    });
    const controls = createElement(documentRef, "div", {
      className: "ad-xconfig-color-controls",
    });

    controls.appendChild(createElement(documentRef, "span", {
      className: "ad-xconfig-color-swatch",
      attributes: {
        "data-adxconfig-color-swatch": "true",
        "aria-hidden": "true",
      },
    }));
    controls.appendChild(createElement(documentRef, "input", {
      id: `${fieldId}-picker`,
      type: "color",
      className: "ad-xconfig-color-picker",
      attributes: {
        "data-adxconfig-setting": "true",
        "data-feature-key": feature.featureKey,
        "data-config-key": feature.configKey,
        "data-setting-key": field.key,
        "data-setting-control": field.control,
        "data-color-input-role": "picker",
        "aria-label": `${field.label} per Farbwähler wählen`,
      },
    }));
    controls.appendChild(createElement(documentRef, "input", {
      id: `${fieldId}-hex`,
      type: "text",
      className: "ad-xconfig-color-code",
      attributes: {
        "data-adxconfig-setting": "true",
        "data-feature-key": feature.featureKey,
        "data-config-key": feature.configKey,
        "data-setting-key": field.key,
        "data-setting-control": field.control,
        "data-color-input-role": "hex",
        autocomplete: "off",
        autocapitalize: "characters",
        spellcheck: "false",
        inputmode: "text",
        placeholder: "#RRGGBB",
        "aria-label": `${field.label} als Hex-Code`,
      },
    }));
    controls.appendChild(createElement(documentRef, "button", {
      type: "button",
      className: "ad-xconfig-mini-btn ad-xconfig-mini-btn--color-reset",
      text: "Zurücksetzen",
      attributes: {
        "data-adxconfig-action": "clear-setting-color",
        "data-feature-key": feature.featureKey,
        "data-config-key": feature.configKey,
        "data-setting-key": field.key,
      },
    }));

    wrapper.appendChild(controls);
    wrapper.appendChild(createElement(documentRef, "p", {
      className: "ad-xconfig-note ad-xconfig-color-status",
      attributes: {
        "data-adxconfig-color-status": "true",
      },
    }));
    syncColorFieldControl(wrapper, {
      value: colorValue,
    });
    return wrapper;
  }

  if (field.control === "text") {
    const wrapper = createElement(documentRef, "div", {
      className: "ad-xconfig-text-field",
    });
    const input = createElement(documentRef, "input", {
      id: fieldId,
      type: "text",
      className: "ad-xconfig-text-input",
      attributes: {
        "data-adxconfig-setting": "true",
        "data-feature-key": feature.featureKey,
        "data-config-key": feature.configKey,
        "data-setting-key": field.key,
        "data-setting-control": field.control,
        autocomplete: "off",
        spellcheck: "false",
        placeholder: field.placeholder || "",
        maxlength: field.maxLength > 0 ? String(field.maxLength) : undefined,
      },
    });
    input.value = String(feature.config?.[field.key] || "");
    wrapper.appendChild(input);
    return wrapper;
  }

  return buildFeatureSelectField(documentRef, feature, field, fieldId);
}

function getFieldNoteText(field) {
  return String(field?.description || "").trim();
}

function resolveConfiguredFieldValues(feature, field) {
  const configuredValue = feature?.config?.[field.key];
  if (isMultiSelectField(field)) {
    return Array.isArray(configuredValue) ? configuredValue : [configuredValue];
  }
  return [configuredValue];
}

function resolveSelectFieldValues(feature, field) {
  const options = Array.isArray(field?.options) ? field.options : [];
  if (!options.length) {
    return [];
  }

  const allowedValues = new Set(options.map((option) => String(option?.value ?? "")));
  const rawValues = resolveConfiguredFieldValues(feature, field);
  const configuredValues = Array.from(
    new Set(
      rawValues
        .map((value) => String(value ?? ""))
        .filter((value) => allowedValues.has(value))
    )
  );
  if (configuredValues.length) {
    return configuredValues;
  }

  return [String(options[0]?.value ?? "")].filter(Boolean);
}

function setSelectOptionActiveState(documentRef, optionNode, isActive) {
  if (!optionNode || typeof optionNode.setAttribute !== "function") {
    return;
  }

  optionNode.dataset.active = isActive ? "true" : "false";
  optionNode.setAttribute("aria-pressed", isActive ? "true" : "false");

  const activeContainer =
    optionNode.querySelector?.("[data-option-active-slot='true']") ||
    optionNode.querySelector?.(".ad-xconfig-option-head") ||
    null;
  if (!activeContainer) {
    return;
  }

  const activeBadge = activeContainer.querySelector?.(".ad-xconfig-option-active") || null;
  if (isActive) {
    if (!activeBadge) {
      activeContainer.appendChild(
        optionNode.classList?.contains("ad-xconfig-option-item--typography-font")
          ? buildTypographyFontActiveMark(documentRef)
          : buildOptionActiveBadge(documentRef)
      );
    }
    return;
  }

  activeBadge?.remove?.();
}

function syncTypographyFontPicker(inputWrap, optionButtons, selectedValues) {
  const picker = inputWrap?.querySelector?.("[data-adxconfig-font-picker='true']") || null;
  if (!picker) {
    return;
  }
  const selectedOption = optionButtons.find((optionNode) =>
    selectedValues.includes(String(optionNode.dataset?.settingValue ?? ""))
  );
  if (!selectedOption) {
    return;
  }

  const selectedValue = String(selectedOption.dataset?.settingValue ?? "");
  const selectedLabel = String(
    selectedOption.querySelector?.(".ad-xconfig-option-label")?.textContent || "Standard"
  ).trim();
  const currentName = picker.querySelector?.("[data-adxconfig-font-picker-current-name='true']");
  const currentPreview = picker.querySelector?.("[data-adxconfig-font-picker-current-preview='true']");
  if (currentName) {
    currentName.textContent = selectedLabel;
    applyThemeGlobalTypographyPreviewFont(currentName, selectedValue);
  }
  applyThemeGlobalTypographyPreviewFont(currentPreview, selectedValue);

  const searchInput = picker.querySelector?.("[data-adxconfig-font-search='true']");
  const emptyState = picker.querySelector?.(".ad-xconfig-font-picker-empty");
  if (searchInput) {
    searchInput.value = "";
  }
  const optionList = picker.querySelector?.(".ad-xconfig-font-option-list");
  setTypographyFontSearchVisibility(optionList, emptyState, "");
  picker.open = false;
  picker.removeAttribute?.("open");
}

export function syncSelectOptionButtons(documentRef, actionNode, selectedValue) {
  if (!actionNode) {
    return;
  }

  const settingKey = String(actionNode.dataset?.settingKey || "").trim();
  if (!settingKey) {
    return;
  }

  const inputWrap =
    actionNode.closest?.(".ad-xconfig-setting-input") ||
    actionNode.parentElement ||
    null;
  if (!inputWrap || typeof inputWrap.querySelectorAll !== "function") {
    return;
  }

  const optionButtons = Array.from(
    inputWrap.querySelectorAll(
      `[data-adxconfig-action='set-setting-select-option'][data-setting-key='${settingKey}']`
    )
  );
  const selectedValues = Array.isArray(selectedValue)
    ? selectedValue.map((value) => String(value ?? ""))
    : [String(selectedValue ?? "")];

  optionButtons.forEach((optionNode) => {
    const optionValue = String(optionNode.dataset?.settingValue ?? "");
    setSelectOptionActiveState(documentRef, optionNode, selectedValues.includes(optionValue));
  });
  syncTypographyFontPicker(inputWrap, optionButtons, selectedValues);

  const optionList = inputWrap.querySelector?.(
    `[data-adxconfig-setting='true'][data-setting-control='select'][data-setting-key='${settingKey}']`
  );
  if (optionList) {
    optionList.dataset.selectedValue = selectedValues.join(",");
  }
}

function buildFeatureCard(documentRef, feature) {
  const descriptor = getXConfigDescriptor(feature.featureKey);
  const isThemeGlobalCard = isThemeGlobalTypographyFeature(feature);
  const preview = resolveFeatureCardPreview(feature);
  const card = createElement(documentRef, "article", {
    className: [
      "ad-xconfig-card",
      isThemeGlobalCard ? "ad-xconfig-card--theme-global" : "",
    ].filter(Boolean).join(" "),
    attributes: {
      "data-feature-key": feature.featureKey,
      "data-card-kind": isThemeGlobalCard ? "theme-global" : "default",
      "data-preview-kind": preview.kind,
    },
  });
  const previewUrl = preview.url;
  if (previewUrl) {
    const bg = createElement(documentRef, "div", {
      className: "ad-xconfig-card-bg",
    });
    bg.appendChild(createElement(documentRef, "img", {
      attributes: {
        src: previewUrl,
        alt: `${feature.title} Vorschau`,
        loading: "lazy",
        decoding: "async",
      },
    }));
    card.appendChild(bg);
  }

  const cardContent = createElement(documentRef, "div", {
    className: "ad-xconfig-card-content",
  });
  const head = createElement(documentRef, "div", {
    className: "ad-xconfig-card-head",
  });
  const copy = createElement(documentRef, "div");
  copy.appendChild(createElement(documentRef, "h3", {
    className: "ad-xconfig-card-title",
    text: feature.title,
  }));
  copy.appendChild(createElement(documentRef, "p", {
    className: "ad-xconfig-card-copy",
    text: descriptor?.description || "Modulares Feature für Autodarts xConfig.",
  }));
  head.appendChild(copy);
  head.appendChild(buildFeatureToggle(documentRef, feature));
  cardContent.appendChild(head);

  const badges = createElement(documentRef, "div", {
    className: "ad-xconfig-card-badges",
  });
  const variantLabel = formatVariantLabel(feature.variants);
  if (variantLabel) {
    badges.appendChild(createElement(documentRef, "span", {
      className: "ad-xconfig-variant",
      text: `Gilt für: ${variantLabel}`,
    }));
  }
  const fieldCount = Array.isArray(descriptor?.fields) ? descriptor.fields.length : 0;
  if (fieldCount > 0) {
    badges.appendChild(createElement(documentRef, "span", {
      className: "ad-xconfig-variant",
      text: fieldCount === 1 ? "1 Einstellung" : `${fieldCount} Einstellungen`,
    }));
  }
  cardContent.appendChild(badges);
  if (isThemeGlobalCard) {
    cardContent.appendChild(buildThemeGlobalCardSummary(documentRef));
  }

  if (fieldCount > 0) {
    const actions = createElement(documentRef, "div", {
      className: "ad-xconfig-card-actions",
    });
    actions.appendChild(createElement(documentRef, "button", {
      type: "button",
      className: "ad-xconfig-mini-btn ad-xconfig-mini-btn--settings",
      text: "⚙ Einstellungen",
      attributes: {
        "data-adxconfig-action": "open-settings",
        "data-feature-key": feature.featureKey,
      },
    }));
    actions.appendChild(createElement(documentRef, "button", {
      type: "button",
      className: "ad-xconfig-mini-btn ad-xconfig-mini-btn--readme",
      text: "📖 README",
      attributes: {
        "data-adxconfig-action": "open-readme",
        "data-feature-key": feature.featureKey,
      },
    }));
    cardContent.appendChild(actions);
  } else {
    const actions = createElement(documentRef, "div", {
      className: "ad-xconfig-card-actions",
    });
    actions.appendChild(createElement(documentRef, "button", {
      type: "button",
      className: "ad-xconfig-mini-btn ad-xconfig-mini-btn--readme",
      text: "📖 README",
      attributes: {
        "data-adxconfig-action": "open-readme",
        "data-feature-key": feature.featureKey,
      },
    }));
    cardContent.appendChild(actions);
  }

  cardContent.appendChild(createElement(documentRef, "p", {
    className: "ad-xconfig-note",
    attributes: isBackgroundThemeFeature(feature)
      ? {
          "data-adxconfig-theme-card-status": "true",
          "data-feature-key": feature.featureKey,
        }
      : {},
    text: isBackgroundThemeFeature(feature)
      ? formatThemeBackgroundSummary(feature)
      : "Änderungen werden sofort gespeichert und direkt angewendet.",
  }));

  card.appendChild(cardContent);
  return card;
}
function buildSettingsModal(documentRef, state, features) {
  if (!state.activeSettingsFeatureKey) {
    return null;
  }
  const feature = features.find((entry) => entry.featureKey === state.activeSettingsFeatureKey) || null;
  const descriptor = feature ? getXConfigDescriptor(feature.featureKey) : null;
  const fields = Array.isArray(descriptor?.fields) ? descriptor.fields : [];
  if (!feature || !fields.length) {
    return null;
  }

  const backdrop = createElement(documentRef, "div", {
    className: "ad-xconfig-modal-backdrop",
    attributes: {
      "data-adxconfig-action": "close-settings-backdrop",
    },
  });
  const modal = createElement(documentRef, "section", {
    className: "ad-xconfig-modal",
    attributes: {
      role: "dialog",
      "aria-modal": "true",
      "data-adxconfig-modal": "true",
    },
  });

  const modalHeader = createElement(documentRef, "header", {
    className: "ad-xconfig-modal-header",
  });
  const heading = createElement(documentRef, "div");
  heading.appendChild(createElement(documentRef, "h3", {
    className: "ad-xconfig-modal-title",
    text: `${feature.title} - Einstellungen`,
  }));
  heading.appendChild(createElement(documentRef, "p", {
    className: "ad-xconfig-modal-subtitle",
    text: "Änderungen werden sofort gespeichert.",
  }));
  modalHeader.appendChild(heading);
  const modalActions = createElement(documentRef, "div", {
    className: "ad-xconfig-modal-actions",
  });
  modalActions.appendChild(createElement(documentRef, "button", {
    type: "button",
    className: "ad-xconfig-mini-btn ad-xconfig-mini-btn--readme",
    text: "📖 README",
    attributes: {
      "data-adxconfig-action": "open-readme",
      "data-feature-key": feature.featureKey,
    },
  }));
  modalActions.appendChild(createElement(documentRef, "button", {
    type: "button",
    className: "ad-xconfig-btn ad-xconfig-btn--square",
    text: "✖",
    attributes: {
      "data-adxconfig-action": "close-settings",
      "aria-label": "Einstellungen schließen",
    },
  }));
  modalHeader.appendChild(modalActions);
  modal.appendChild(modalHeader);

  const body = createElement(documentRef, "div", {
    className: "ad-xconfig-modal-body",
  });
  const settingsDetails = Array.isArray(descriptor?.settingsDetails)
    ? descriptor.settingsDetails.filter(Boolean)
    : [];
  if (settingsDetails.length) {
    const detailsRow = createElement(documentRef, "section", {
      className: "ad-xconfig-setting-row",
      attributes: {
        "data-adxconfig-settings-summary": "true",
      },
    });
    const settingsDetailHeading = String(descriptor?.settingsDetailHeading || "").trim();
    if (settingsDetailHeading) {
      detailsRow.appendChild(createElement(documentRef, "h4", {
        className: "ad-xconfig-setting-label",
        text: settingsDetailHeading,
      }));
    }
    settingsDetails.forEach((entry) => {
      detailsRow.appendChild(createElement(documentRef, "p", {
        className: "ad-xconfig-note",
        text: entry,
      }));
    });
    body.appendChild(detailsRow);
  }
  if (isCheckoutScoreHighlightFeature(feature)) {
    body.appendChild(buildCheckoutScoreHighlightPreviewSection(documentRef, feature));
  }
  if (isCheckoutTargetHighlightsFeature(feature)) {
    body.appendChild(buildCheckoutBoardPreviewSection(documentRef, feature));
  }
  if (isCheckoutSuggestionStylesFeature(feature)) {
    body.appendChild(buildCheckoutSuggestionPreviewSection(documentRef, feature));
  }
  if (isX01RemainingScoreBarFeature(feature)) {
    body.appendChild(buildX01RemainingScoreBarPreviewSection(documentRef, feature));
  }
  const sectionBodies = new Map();
  fields.forEach((field) => {
    const sectionLabel = String(field.section || "").trim();
    let sectionBody = body;
    if (sectionLabel) {
      if (!sectionBodies.has(sectionLabel)) {
        const section = createElement(documentRef, "section", {
          className: "ad-xconfig-settings-section",
          attributes: {
            "data-adxconfig-settings-section": sectionLabel.toLowerCase(),
          },
        });
        section.appendChild(createElement(documentRef, "h4", {
          className: "ad-xconfig-settings-section-title",
          text: sectionLabel,
        }));
        const isThemePresetSection =
          isThemeGlobalTypographyFeature(feature) && sectionLabel === "Presets";
        const nextSectionBody = createElement(documentRef, "div", {
          className: isThemePresetSection
            ? "ad-xconfig-settings-section-body ad-xconfig-settings-section-body--theme-presets"
            : "ad-xconfig-settings-section-body",
        });
        section.appendChild(nextSectionBody);
        body.appendChild(section);
        sectionBodies.set(sectionLabel, nextSectionBody);
      }
      sectionBody = sectionBodies.get(sectionLabel) || body;
    }

    const isThemePresetField = field.previewTarget === "theme-global-template-preset";
    let rowClassName = "ad-xconfig-setting-row";
    if (isThemePresetField) {
      rowClassName += " ad-xconfig-setting-row--theme-preset";
    } else if (String(field.key || field.action || "").toLowerCase() === "debug") {
      rowClassName += " ad-xconfig-setting-row--debug";
    }
    const row = createElement(documentRef, "div", {
      className: rowClassName,
    });
    const inputWrap = createElement(documentRef, "div", {
      className: isThemePresetField
        ? "ad-xconfig-setting-input ad-xconfig-setting-input--theme-preset"
        : "ad-xconfig-setting-input",
    });
    if (field.control !== "action") {
      row.appendChild(createElement(documentRef, "label", {
        className: "ad-xconfig-setting-label",
        text: field.label,
      }));
      const noteText = getFieldNoteText(field);
      if (noteText) {
        inputWrap.appendChild(createElement(documentRef, "p", {
          className: "ad-xconfig-note",
          text: noteText,
        }));
      }
    }
    inputWrap.appendChild(buildFeatureField(documentRef, feature, field));
    row.appendChild(inputWrap);
    sectionBody.appendChild(row);
  });
  modal.appendChild(body);

  backdrop.appendChild(modal);
  return backdrop;
}

function buildAnimationGroups(documentRef, features = []) {
  const sortedFeatures = Array.isArray(features)
    ? features.slice().sort(sortAnimationFeatures)
    : [];
  if (!sortedFeatures.length) {
    return [];
  }

  const groupedFeatures = new Map();
  sortedFeatures.forEach((feature) => {
    const { groupId } = getAnimationGroupMeta(feature?.featureKey);
    const list = groupedFeatures.get(groupId) || [];
    list.push(feature);
    groupedFeatures.set(groupId, list);
  });

  const sections = [];
  ANIMATION_GROUP_DEFINITIONS.forEach((group) => {
    const entries = groupedFeatures.get(group.id) || [];
    if (!entries.length) {
      return;
    }
    const section = createElement(documentRef, "section", {
      className: "ad-xconfig-group",
      attributes: {
        "data-adxconfig-animation-group": group.id,
      },
    });
    section.appendChild(createElement(documentRef, "h2", {
      className: "ad-xconfig-group-title",
      text: group.title,
    }));
    const grid = createElement(documentRef, "div", {
      className: "ad-xconfig-grid",
    });
    entries.forEach((feature) => {
      grid.appendChild(buildFeatureCard(documentRef, feature));
    });
    section.appendChild(grid);
    sections.push(section);
    groupedFeatures.delete(group.id);
  });

  const remainingFeatures = groupedFeatures.get("other") || [];
  if (remainingFeatures.length) {
    const fallbackSection = createElement(documentRef, "section", {
      className: "ad-xconfig-group",
      attributes: {
        "data-adxconfig-animation-group": "other",
      },
    });
    fallbackSection.appendChild(createElement(documentRef, "h2", {
      className: "ad-xconfig-group-title",
      text: "Weitere",
    }));
    const fallbackGrid = createElement(documentRef, "div", {
      className: "ad-xconfig-grid",
    });
    remainingFeatures.forEach((feature) => {
      fallbackGrid.appendChild(buildFeatureCard(documentRef, feature));
    });
    fallbackSection.appendChild(fallbackGrid);
    sections.push(fallbackSection);
  }

  return sections;
}

function formatTransferFileSize(value) {
  const bytes = Math.max(0, Number(value) || 0);
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MiB`;
  }
  if (bytes >= 1024) {
    return `${Math.round(bytes / 1024)} KiB`;
  }
  return `${bytes} Byte`;
}

function appendTransferDialogHeading(documentRef, card, title, description) {
  card.appendChild(createElement(documentRef, "h2", {
    id: "ad-xconfig-transfer-title",
    className: "ad-xconfig-modal-title",
    text: title,
  }));
  card.appendChild(createElement(documentRef, "p", {
    className: "ad-xconfig-transfer-copy",
    text: description,
  }));
}

function appendTransferReport(documentRef, card, report) {
  if (!report) {
    card.appendChild(createElement(documentRef, "p", {
      className: "ad-xconfig-transfer-copy",
      text: "Backup wird geprüft …",
    }));
    return;
  }
  const counts = report.counts || {};
  const summary = createElement(documentRef, "div", {
    className: "ad-xconfig-transfer-summary",
  });
  [
    ["Übernommen", counts.applied],
    ["Migriert", counts.migrated],
    ["Ausgelassen", counts.skipped],
    ["Unverändert", counts.unchanged],
  ].forEach(([label, value]) => {
    summary.appendChild(createElement(documentRef, "span", {
      className: "ad-xconfig-transfer-stat",
      text: `${label}: ${Number(value || 0)}`,
    }));
  });
  card.appendChild(summary);

  if (report.source?.appVersion || report.source?.exportedAt) {
    const sourceParts = [];
    if (report.source.appVersion) {
      sourceParts.push(`AD xConfig ${report.source.appVersion}`);
    }
    if (report.source.exportedAt) {
      sourceParts.push(String(report.source.exportedAt));
    }
    card.appendChild(createElement(documentRef, "p", {
      className: "ad-xconfig-transfer-source",
      text: `Quelle: ${sourceParts.join(" · ")}`,
    }));
  }

  const visibleIssues = (report.issues || []).filter((issue) =>
    ["fatal", "skipped", "migrated", "warning"].includes(issue.status)
  );
  if (!visibleIssues.length) {
    card.appendChild(createElement(documentRef, "p", {
      className: "ad-xconfig-transfer-ok",
      text: "Alle erkannten Einstellungen sind kompatibel.",
    }));
    return;
  }
  const groups = new Map();
  visibleIssues.forEach((issue) => {
    const groupKey = String(issue.featureKey || "general");
    const entries = groups.get(groupKey) || [];
    entries.push(issue);
    groups.set(groupKey, entries);
  });
  const groupRoot = createElement(documentRef, "div", {
    className: "ad-xconfig-transfer-issue-groups",
  });
  groups.forEach((issues, featureKey) => {
    const group = createElement(documentRef, "section", {
      className: "ad-xconfig-transfer-issue-group",
    });
    group.appendChild(createElement(documentRef, "h3", {
      className: "ad-xconfig-transfer-issue-title",
      text: featureKey === "general"
        ? "Allgemeine Hinweise"
        : getFeatureCatalogEntryByFeatureKey(featureKey)?.title || featureKey,
    }));
    const list = createElement(documentRef, "ul", {
      className: "ad-xconfig-transfer-issues",
    });
    issues.forEach((issue) => {
      list.appendChild(createElement(documentRef, "li", {
        className: `ad-xconfig-transfer-issue ad-xconfig-transfer-issue--${issue.status}`,
        text: String(issue.message || issue.code || "Importhinweis"),
      }));
    });
    group.appendChild(list);
    groupRoot.appendChild(group);
  });
  card.appendChild(groupRoot);
}

function appendSettingsTransferContent(documentRef, card, transfer) {
  if (transfer.dialog === "export") {
    appendTransferDialogHeading(
      documentRef,
      card,
      "Einstellungen exportieren",
      "Erstellt ein versioniertes JSON-Backup deiner AD xConfig Einstellungen."
    );
    const optionLabel = createElement(documentRef, "label", {
      className: "ad-xconfig-transfer-option",
    });
    optionLabel.appendChild(createElement(documentRef, "input", {
      type: "checkbox",
      attributes: {
        checked: transfer.includeAssets ? "" : undefined,
        "data-adxconfig-transfer-include-assets": "true",
      },
    }));
    optionLabel.appendChild(createElement(documentRef, "span", {
      text: "Eigene Theme- und Dart-Bilder einschließen",
    }));
    card.appendChild(optionLabel);
    card.appendChild(createElement(documentRef, "p", {
      className: "ad-xconfig-transfer-source",
      text: "Mit Bildern kann die Backup-Datei deutlich größer werden.",
    }));
    return;
  }

  const resultMode = transfer.dialog === "result";
  appendTransferDialogHeading(
    documentRef,
    card,
    resultMode ? "Import abgeschlossen" : "Einstellungen importieren",
    transfer.fileName
      ? `${transfer.fileName} · ${formatTransferFileSize(transfer.fileSize)}`
      : "Das ausgewählte Backup wird vor dem Speichern vollständig geprüft."
  );
  if (!resultMode) {
    const modes = createElement(documentRef, "div", {
      className: "ad-xconfig-transfer-modes",
      attributes: { role: "group", "aria-label": "Importmodus" },
    });
    [
      ["merge", "Sicher zusammenführen"],
      ["replace", "Vollständig ersetzen"],
    ].forEach(([mode, label]) => {
      modes.appendChild(createElement(documentRef, "button", {
        className: "ad-xconfig-btn ad-xconfig-btn--compact",
        type: "button",
        text: label,
        attributes: {
          "data-adxconfig-action": "set-settings-import-mode",
          "data-import-mode": mode,
          "data-active": transfer.importMode === mode ? "true" : "false",
          "aria-pressed": transfer.importMode === mode ? "true" : "false",
          disabled: transfer.busy ? "" : undefined,
        },
      }));
    });
    card.appendChild(modes);
    card.appendChild(createElement(documentRef, "p", {
      className: "ad-xconfig-transfer-source",
      text: transfer.importMode === "replace"
        ? "Fehlende Einstellungen werden auf die heutigen Standards gesetzt; nicht enthaltene eigene Bilder bleiben erhalten."
        : "Nur gültige Werte aus dem Backup werden übernommen; alles andere bleibt unverändert.",
    }));
  }
  appendTransferReport(documentRef, card, transfer.report);
}

function appendSettingsTransferActions(documentRef, card, transfer) {
  const actions = createElement(documentRef, "div", {
    className: "ad-xconfig-modal-actions ad-xconfig-transfer-actions",
  });
  actions.appendChild(createElement(documentRef, "button", {
    className: "ad-xconfig-btn",
    type: "button",
    text: transfer.dialog === "result" ? "Schließen" : "Abbrechen",
    attributes: {
      "data-adxconfig-action": "close-settings-transfer",
      disabled: transfer.busy ? "" : undefined,
    },
  }));
  if (transfer.dialog === "export") {
    actions.appendChild(createElement(documentRef, "button", {
      className: "ad-xconfig-btn ad-xconfig-btn--primary",
      type: "button",
      text: transfer.busy ? "Export läuft …" : "Backup herunterladen",
      attributes: {
        "data-adxconfig-action": "start-settings-export",
        disabled: transfer.busy ? "" : undefined,
      },
    }));
  } else if (transfer.dialog === "import") {
    const applicable =
      Number(transfer.report?.counts?.applied || 0) +
      Number(transfer.report?.counts?.migrated || 0);
    const canImport = transfer.report?.status === "ready" && applicable > 0 && !transfer.busy;
    actions.appendChild(createElement(documentRef, "button", {
      className: "ad-xconfig-btn ad-xconfig-btn--primary",
      type: "button",
      text: transfer.busy ? "Prüfung läuft …" : "Import bestätigen",
      attributes: {
        "data-adxconfig-action": "confirm-settings-import",
        disabled: canImport ? undefined : "",
      },
    }));
  }
  card.appendChild(actions);
}

function buildSettingsTransferDialog(documentRef, state) {
  const transfer = state.settingsTransfer;
  if (!transfer?.dialog) {
    return null;
  }
  const backdrop = createElement(documentRef, "div", {
    className: "ad-xconfig-modal-backdrop ad-xconfig-transfer-backdrop",
  });
  const card = createElement(documentRef, "section", {
    className: "ad-xconfig-modal ad-xconfig-transfer-dialog",
    attributes: {
      role: "dialog",
      "aria-modal": "true",
      "aria-labelledby": "ad-xconfig-transfer-title",
      "data-adxconfig-transfer-dialog": transfer.dialog,
    },
  });

  appendSettingsTransferContent(documentRef, card, transfer);
  appendSettingsTransferActions(documentRef, card, transfer);
  backdrop.appendChild(card);
  return backdrop;
}

export function buildShellContent(documentRef, state, features) {
  const page = createElement(documentRef, "div", {
    className: "ad-xconfig-page",
  });
  const shell = createElement(documentRef, "div", {
    className: "ad-xconfig-shell",
  });

  const header = createElement(documentRef, "header", {
    className: "ad-xconfig-header",
  });
  const heading = createElement(documentRef, "div");
  const headingMain = createElement(documentRef, "div", {
    className: "ad-xconfig-header-main",
  });
  headingMain.appendChild(createElement(documentRef, "h1", {
    className: "ad-xconfig-title",
    text: MENU_LABEL,
  }));
  heading.appendChild(headingMain);
  heading.appendChild(createElement(documentRef, "p", {
    className: "ad-xconfig-subtitle",
    text: "Modulverwaltung für Themen und Animationen.",
  }));
  header.appendChild(heading);

  const headerActions = createElement(documentRef, "div", {
    className: "ad-xconfig-header-actions",
  });
  headerActions.appendChild(createElement(documentRef, "button", {
    className: "ad-xconfig-btn",
    text: "Exportieren",
    type: "button",
    attributes: {
      "data-adxconfig-action": "open-settings-export",
      "aria-label": "AD xConfig Einstellungen exportieren",
    },
  }));
  headerActions.appendChild(createElement(documentRef, "button", {
    className: "ad-xconfig-btn",
    text: "Importieren",
    type: "button",
    attributes: {
      "data-adxconfig-action": "open-settings-import",
      "aria-label": "AD xConfig Einstellungen importieren",
    },
  }));
  headerActions.appendChild(createElement(documentRef, "button", {
    className: "ad-xconfig-btn ad-xconfig-btn--danger",
    text: "↺ Zurücksetzen",
    type: "button",
    attributes: {
      "data-adxconfig-action": "reset",
      "aria-label": "Hard Reset ausführen",
    },
  }));
  headerActions.appendChild(createElement(documentRef, "button", {
    className: "ad-xconfig-btn ad-xconfig-btn--primary",
    text: "Empfohlene Standards",
    type: "button",
    attributes: {
      "data-adxconfig-action": "apply-recommended-defaults",
      "aria-label": "Empfohlene Standards anwenden",
    },
  }));
  header.appendChild(headerActions);
  shell.appendChild(header);

  const updatePanel = buildUpdatePanel(documentRef, state.updateStatus);
  if (updatePanel) {
    shell.appendChild(updatePanel);
  }

  if (state.notice?.type && state.notice?.message) {
    shell.appendChild(createElement(documentRef, "div", {
      className: `ad-xconfig-notice ad-xconfig-notice--${state.notice.type}`,
      text: state.notice.message,
    }));
  }

  const tabsIntro = createElement(documentRef, "div", {
    className: "ad-xconfig-tabs-intro",
  });
  tabsIntro.appendChild(createElement(documentRef, "h2", {
    id: "ad-xconfig-tabs-title",
    className: "ad-xconfig-tabs-title",
    text: "Wähle deinen Bereich",
  }));
  tabsIntro.appendChild(createElement(documentRef, "p", {
    id: "ad-xconfig-tabs-copy",
    className: "ad-xconfig-tabs-copy",
    text: "Wechsle zwischen Themen für Farben und Layout sowie Animationen für Effekte und Komfortfunktionen.",
  }));
  shell.appendChild(tabsIntro);

  const tabs = createElement(documentRef, "nav", {
    className: "ad-xconfig-tabs",
    attributes: {
      role: "tablist",
      "aria-labelledby": "ad-xconfig-tabs-title",
      "aria-describedby": "ad-xconfig-tabs-copy",
    },
  });
  TAB_DEFINITIONS.forEach((tab) => {
    const isActive = state.activeTab === tab.id;
    const button = createElement(documentRef, "button", {
      id: `ad-xconfig-tab-${tab.id}`,
      className: "ad-xconfig-tab",
      type: "button",
      attributes: {
        "data-adxconfig-tab": tab.id,
        "data-active": isActive ? "true" : "false",
        role: "tab",
        "aria-selected": isActive ? "true" : "false",
        tabindex: isActive ? "0" : "-1",
      },
    });
    button.appendChild(createElement(documentRef, "span", {
      className: "ad-xconfig-tab-title",
      text: `${tab.icon} ${tab.label}`,
    }));
    button.appendChild(createElement(documentRef, "span", {
      className: "ad-xconfig-tab-desc",
      text: tab.description,
    }));
    tabs.appendChild(button);
  });
  shell.appendChild(tabs);

  const activeTabFeatures = features
    .filter((feature) => {
      const descriptor = getXConfigDescriptor(feature.featureKey);
      return (descriptor?.tab || "animations") === state.activeTab;
    });

  const content = createElement(documentRef, "div", {
    className: "ad-xconfig-content",
    id: `ad-xconfig-tabpanel-${state.activeTab}`,
    attributes: {
      role: "tabpanel",
      "aria-labelledby": `ad-xconfig-tab-${state.activeTab}`,
    },
  });
  if (state.activeTab === "themes" && activeTabFeatures.some((feature) => isThemeFeature(feature))) {
    const contentHead = createElement(documentRef, "div", {
      className: "ad-xconfig-content-head",
    });
    contentHead.appendChild(createElement(documentRef, "h2", {
      className: "ad-xconfig-content-title",
      text: "Themen",
    }));
    content.appendChild(contentHead);
  }
  if (state.activeTab === "animations") {
    const groups = buildAnimationGroups(documentRef, activeTabFeatures);
    if (groups.length) {
      groups.forEach((groupNode, index) => {
        if (index > 0) {
          content.appendChild(createElement(documentRef, "hr", {
            className: "ad-xconfig-group-divider",
            attributes: {
              "aria-hidden": "true",
              "data-adxconfig-animation-divider": "true",
            },
          }));
        }
        content.appendChild(groupNode);
      });
    } else {
      content.appendChild(createElement(documentRef, "div", {
        className: "ad-xconfig-empty",
        text: "Für diesen Bereich wurden keine Module gefunden.",
      }));
    }
  } else {
    const grid = createElement(documentRef, "div", {
      className: "ad-xconfig-grid",
    });
    activeTabFeatures
      .slice()
      .sort(sortFeatures)
      .forEach((feature) => {
        grid.appendChild(buildFeatureCard(documentRef, feature));
      });
    if (grid.children.length) {
      content.appendChild(grid);
    } else {
      content.appendChild(createElement(documentRef, "div", {
        className: "ad-xconfig-empty",
        text: "Für diesen Bereich wurden keine Module gefunden.",
      }));
    }
  }
  shell.appendChild(content);

  const modal = buildSettingsModal(documentRef, state, features);
  if (modal) {
    shell.appendChild(modal);
  }
  const transferDialog = buildSettingsTransferDialog(documentRef, state);
  if (transferDialog) {
    shell.appendChild(transferDialog);
  }

  page.appendChild(shell);
  return page;
}

