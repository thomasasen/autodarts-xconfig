import { getXConfigDescriptor, xconfigDescriptorOrder } from "./descriptors.js";
import { resolveDartDesignAsset } from "#feature-assets";
import { resolveXConfigPreviewAsset } from "#xconfig-preview-assets";
import {
  isBackgroundThemeFeature,
  isThemeFeature,
} from "./path-utils.js";
import {
  buildThemeBackgroundStatus,
  buildTurnDartImageStatus,
  formatThemeBackgroundSummary,
  resolveThemeBackgroundPreviewUrl,
} from "./theme-background.js";
import { getThemeGlobalTypographyPreset } from "../../shared/theme-global-typography-presets.js";
import { normalizeHexColor } from "../../shared/hex-color-utils.js";

const CONFIG_PATH = "/ad-xconfig";
const CONFIG_HASH = "#ad-xconfig";
const MENU_LABEL = "AD xConfig";
const MENU_LABEL_COLLAPSE_WIDTH = 120;
const README_URL = "https://github.com/thomasasen/autodarts-xconfig/blob/main/README.md";
const CHANGELOG_URL = "https://github.com/thomasasen/autodarts-xconfig/blob/main/CHANGELOG.md";
const ROOT_OBSERVER_KEY = "xconfig-shell:root-observer";
const NOTICE_TIMEOUT_MS = 3200;
const UPDATE_AUTO_CHECK_INTERVAL_MS = 15 * 60 * 1000;
const DART_MARKER_DARTS_FEATURE_KEY = "dart-marker-darts";
const DART_MARKER_DARTS_DESIGN_SETTING_KEY = "design";
const THEME_GLOBAL_TYPOGRAPHY_FEATURE_KEY = "theme-global-typography";
const THEME_GLOBAL_TYPOGRAPHY_FONT_FIELD_KEY = "fontPreset";
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
      "turn-start-sweep",
      "turn-points-count",
      "average-trend-arrow",
      "triple-double-bull-hits",
      "dart-marker-darts",
      "dart-marker-emphasis",
      "remove-darts-notification",
      "single-bull-sound",
      "winner-fireworks",
    ]),
  }),
  Object.freeze({
    id: "x01",
    title: "Gilt für: X01",
    featureKeys: Object.freeze([
      "style-checkout-suggestions",
      "checkout-score-pulse",
      "x01-score-progress",
      "checkout-board-targets",
      "tv-board-zoom",
    ]),
  }),
  Object.freeze({
    id: "cricket-tactics",
    title: "Gilt für: Cricket / Tactics",
    featureKeys: Object.freeze([
      "cricket-highlighter",
      "cricket-grid-fx",
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
      if (typeof value !== "undefined" && value !== null) {
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
  return feature?.featureKey === DART_MARKER_DARTS_FEATURE_KEY &&
    String(field?.key || "").trim() === DART_MARKER_DARTS_DESIGN_SETTING_KEY;
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
  return resolveDartDesignAsset(optionValue);
}

function buildThemeGlobalTypographyOptionLabel(documentRef, option) {
  const labelNode = createElement(documentRef, "span", {
    className: "ad-xconfig-option-label",
    text: option?.label || "",
  });
  const preset = getThemeGlobalTypographyPreset(option?.value);
  const previewFontFamily = String(preset?.previewFontFamily || "").trim();
  if (previewFontFamily && preset?.remote) {
    labelNode.style.fontFamily = previewFontFamily;
    labelNode.dataset.adxconfigPreviewFont = preset.value;
  }
  return labelNode;
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

function buildFeatureField(documentRef, feature, field) {
  const fieldId = `ad-xconfig-field-${feature.featureKey}-${field.key || field.action}`;

  if (field.control === "action") {
    const wrapper = createElement(documentRef, "div", {
      className: "ad-xconfig-setting-action",
    });
    const button = createElement(documentRef, "button", {
      id: fieldId,
      type: "button",
      className: field.prominent
        ? "ad-xconfig-setting-action-btn ad-xconfig-setting-action-btn--primary"
        : "ad-xconfig-setting-action-btn",
      text: field.buttonLabel || field.label,
      attributes: {
        "data-adxconfig-action": field.action,
        "data-feature-key": feature.featureKey,
        "data-config-key": feature.configKey,
        "data-feature-action-id": field.actionId || "",
      },
    });
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
    const isDartDesignField = isDartDesignSelectField(feature, field);
    const isTypographyFontField = isThemeGlobalTypographyFontField(feature, field);
    const previewEffect = String(option?.previewEffect || "").trim();
    const optionButton = createElement(documentRef, "button", {
      type: "button",
      className: [
        "ad-xconfig-option-item",
        isDartDesignField ? "ad-xconfig-option-item--dart-design" : "",
        isTypographyFontField ? "ad-xconfig-option-item--typography-font" : "",
        previewEffect ? "ad-xconfig-option-item--effect-preview" : "",
      ].filter(Boolean).join(" "),
      attributes: {
        "data-adxconfig-action": "set-setting-select-option",
        "data-adxconfig-option-note": "true",
        "data-feature-key": feature.featureKey,
        "data-config-key": feature.configKey,
        "data-setting-key": field.key,
        "data-setting-value": optionValue,
        "data-option-value": optionValue,
        "data-option-description": String(option?.description || "").trim(),
        "data-preview-effect": previewEffect || undefined,
        "data-multiple": isMultiSelectField(field) ? "true" : "false",
        "data-active": isActive ? "true" : "false",
        "aria-pressed": isActive ? "true" : "false",
      },
    });
    const optionDescription = isTypographyFontField
      ? ""
      : String(option?.description || "").trim();

    if (isDartDesignField) {
      const optionPreviewUrl = resolveFieldOptionPreview(feature, field, optionValue);
      optionButton.appendChild(
        buildDartDesignOptionLayout(
          documentRef,
          option.label,
          optionDescription,
          optionPreviewUrl,
          isActive
        )
      );
    } else {
      const head = createElement(documentRef, "div", {
        className: "ad-xconfig-option-head",
      });
      head.appendChild(
        isTypographyFontField
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

    list.appendChild(optionButton);
  });

  return list;
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
      activeContainer.appendChild(buildOptionActiveBadge(documentRef));
    }
    return;
  }

  activeBadge?.remove?.();
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
  const card = createElement(documentRef, "article", {
    className: isThemeGlobalCard
      ? "ad-xconfig-card ad-xconfig-card--theme-global"
      : "ad-xconfig-card",
    attributes: {
      "data-feature-key": feature.featureKey,
      "data-card-kind": isThemeGlobalCard ? "theme-global" : "default",
    },
  });
  const previewUrl =
    resolveThemeBackgroundPreviewUrl(feature) ||
    resolveXConfigPreviewAsset(feature.featureKey);
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
        const nextSectionBody = createElement(documentRef, "div", {
          className: "ad-xconfig-settings-section-body",
        });
        section.appendChild(nextSectionBody);
        body.appendChild(section);
        sectionBodies.set(sectionLabel, nextSectionBody);
      }
      sectionBody = sectionBodies.get(sectionLabel) || body;
    }

    const row = createElement(documentRef, "div", {
      className: String(field.key || field.action || "").toLowerCase() === "debug"
        ? "ad-xconfig-setting-row ad-xconfig-setting-row--debug"
        : "ad-xconfig-setting-row",
    });
    const inputWrap = createElement(documentRef, "div", {
      className: "ad-xconfig-setting-input",
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

  page.appendChild(shell);
  return page;
}

