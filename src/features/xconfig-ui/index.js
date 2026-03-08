import { getXConfigDescriptor, xconfigDescriptors } from "./descriptors.js";
import { resolveXConfigPreviewAsset } from "#xconfig-preview-assets";

const CONFIG_PATH = "/ad-xconfig";
const MENU_LABEL = "AD xConfig";
const MENU_LABEL_COLLAPSE_WIDTH = 120;
const MENU_ITEM_ID = "ad-xconfig-menu-item";
const PANEL_HOST_ID = "ad-xconfig-panel-host";
const STYLE_ID = "ad-xconfig-shell-style";
const ROOT_OBSERVER_KEY = "xconfig-shell:root-observer";
const NOTICE_TIMEOUT_MS = 3200;
const LISTENER_KEYS = Object.freeze({
  popstate: "xconfig-shell:popstate",
  click: "xconfig-shell:document-click",
  change: "xconfig-shell:document-change",
  keydown: "xconfig-shell:document-keydown",
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
const descriptorOrder = new Map(
  xconfigDescriptors.map((descriptor, index) => [descriptor.featureKey, index])
);
const shellByWindow = new WeakMap();

const styleText = `
#${MENU_ITEM_ID}{cursor:pointer;min-height:2.5rem}
#${MENU_ITEM_ID}[data-active="true"]{background:rgba(32,111,185,.28)!important;border-color:rgba(255,255,255,.16)!important}
#${MENU_ITEM_ID} .ad-xconfig-menu-icon{display:inline-flex;align-items:center;flex-shrink:0;margin-inline-end:.5rem}
#${MENU_ITEM_ID} .ad-xconfig-menu-label{white-space:nowrap}
#${PANEL_HOST_ID}{display:none;width:100%;position:relative;z-index:2147480000}
#${PANEL_HOST_ID} .ad-xconfig-page{margin:0 auto;width:100%;padding:1rem;color:#fff;font-family:"Open Sans","Segoe UI",Tahoma,sans-serif}
#${PANEL_HOST_ID} .ad-xconfig-shell{max-width:1366px;margin:0 auto;padding:1rem;border-radius:14px;border:1px solid rgba(255,255,255,.12);box-shadow:0 8px 30px rgba(0,0,0,.28);background:rgba(25,32,71,.95);background-image:radial-gradient(50% 30% at 86% 0%,rgba(49,51,112,.89) 0%,rgba(64,52,134,0) 100%),radial-gradient(50% 70% at 70% 22%,rgba(38,89,154,.9) 0%,rgba(64,52,134,0) 100%),radial-gradient(50% 70% at -2% 53%,rgba(52,32,95,.89) 0%,rgba(64,52,134,0) 100%),radial-gradient(50% 40% at 66% 59%,rgba(32,111,185,.87) 7%,rgba(32,111,185,0) 100%)}
#${PANEL_HOST_ID} .ad-xconfig-shell,#${PANEL_HOST_ID} .ad-xconfig-shell *{pointer-events:auto}
#${PANEL_HOST_ID} .ad-xconfig-header{display:flex;flex-wrap:wrap;justify-content:space-between;gap:.75rem}
#${PANEL_HOST_ID} .ad-xconfig-header-main{display:flex;align-items:center;gap:.75rem}
#${PANEL_HOST_ID} .ad-xconfig-title{margin:0;font-size:1.65rem;line-height:1.2}
#${PANEL_HOST_ID} .ad-xconfig-subtitle{margin:.45rem 0 0;font-size:.95rem;color:rgba(255,255,255,.72)}
#${PANEL_HOST_ID} .ad-xconfig-notice{margin-top:.85rem;border-radius:8px;padding:.62rem .8rem;font-size:.85rem;border:1px solid transparent}
#${PANEL_HOST_ID} .ad-xconfig-notice--success{background:rgba(58,180,122,.17);border-color:rgba(58,180,122,.52)}
#${PANEL_HOST_ID} .ad-xconfig-notice--error{background:rgba(255,84,84,.15);border-color:rgba(255,84,84,.5)}
#${PANEL_HOST_ID} .ad-xconfig-notice--info{background:rgba(74,178,255,.18);border-color:rgba(74,178,255,.5)}
#${PANEL_HOST_ID} .ad-xconfig-header-actions,#${PANEL_HOST_ID} .ad-xconfig-tabs{display:flex;flex-wrap:wrap;gap:.65rem}
#${PANEL_HOST_ID} .ad-xconfig-btn,#${PANEL_HOST_ID} .ad-xconfig-tab{border:1px solid rgba(255,255,255,.24);border-radius:8px;background:rgba(255,255,255,.08);color:#fff;cursor:pointer;font:inherit}
#${PANEL_HOST_ID} .ad-xconfig-btn,#${PANEL_HOST_ID} .ad-xconfig-tab{padding:.55rem .85rem}
#${PANEL_HOST_ID} .ad-xconfig-btn:hover,#${PANEL_HOST_ID} .ad-xconfig-tab:hover{background:rgba(255,255,255,.16)}
#${PANEL_HOST_ID} .ad-xconfig-btn--danger{border-color:rgba(255,84,84,.42);background:rgba(255,84,84,.17)}
#${PANEL_HOST_ID} .ad-xconfig-tab[data-active="true"]{border-color:rgba(112,196,255,.95);background:rgba(58,148,255,.34)}
#${PANEL_HOST_ID} .ad-xconfig-tab-title{font-size:1rem;font-weight:800;line-height:1.2}
#${PANEL_HOST_ID} .ad-xconfig-tab-desc{font-size:.76rem;color:rgba(232,243,255,.92)}
#${PANEL_HOST_ID} .ad-xconfig-content{margin-top:1rem}
#${PANEL_HOST_ID} .ad-xconfig-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.75rem;margin-top:1rem}
#${PANEL_HOST_ID} .ad-xconfig-card{position:relative;overflow:hidden;min-height:14rem;padding:.9rem;border-radius:11px;border:1px solid rgba(255,255,255,.14);background:rgba(0,0,0,.2)}
#${PANEL_HOST_ID} .ad-xconfig-card-bg{position:absolute;inset:0;pointer-events:none}
#${PANEL_HOST_ID} .ad-xconfig-card-bg::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(15,27,67,.88) 0%,rgba(15,27,67,.84) 40%,rgba(15,27,67,.36) 70%,rgba(15,27,67,.2) 100%)}
#${PANEL_HOST_ID} .ad-xconfig-card-bg img{position:absolute;top:0;right:0;width:72%;height:100%;object-fit:cover;opacity:.5}
#${PANEL_HOST_ID} .ad-xconfig-card-content{position:relative;z-index:1}
#${PANEL_HOST_ID} .ad-xconfig-card-head{display:flex;justify-content:space-between;gap:.8rem;margin-bottom:.85rem}
#${PANEL_HOST_ID} .ad-xconfig-card-title{margin:0;font-size:.98rem}
#${PANEL_HOST_ID} .ad-xconfig-card-copy{margin:.4rem 0 0;color:rgba(255,255,255,.76);font-size:.84rem;line-height:1.35}
#${PANEL_HOST_ID} .ad-xconfig-card-badges{margin-top:.75rem;display:flex;gap:.5rem;flex-wrap:wrap}
#${PANEL_HOST_ID} .ad-xconfig-card-actions{margin-top:.75rem;display:flex;gap:.5rem;flex-wrap:wrap}
#${PANEL_HOST_ID} .ad-xconfig-variant{display:inline-flex;margin-top:.55rem;padding:.2rem .55rem;border-radius:999px;background:rgba(163,191,250,.2);border:1px solid rgba(163,191,250,.7);font-size:.72rem}
#${PANEL_HOST_ID} .ad-xconfig-mini-btn{border:1px solid rgba(255,255,255,.24);border-radius:7px;padding:.35rem .55rem;background:rgba(255,255,255,.08);color:#fff;font-size:.73rem;cursor:pointer}
#${PANEL_HOST_ID} .ad-xconfig-mini-btn--settings{border-color:rgba(126,216,255,.92);background:rgba(58,148,255,.34);font-weight:700}
#${PANEL_HOST_ID} .ad-xconfig-fields{display:grid;gap:.65rem}
#${PANEL_HOST_ID} .ad-xconfig-field{display:grid;gap:.32rem}
#${PANEL_HOST_ID} .ad-xconfig-field label{font-weight:600;font-size:.86rem}
#${PANEL_HOST_ID} .ad-xconfig-field select{width:100%;max-width:20rem;padding:.45rem .55rem;border:1px solid rgba(255,255,255,.28);border-radius:8px;background:rgba(12,17,36,.9);color:#fff}
#${PANEL_HOST_ID} .ad-xconfig-field--checkbox{display:flex;align-items:center;gap:.55rem}
#${PANEL_HOST_ID} .ad-xconfig-onoff{display:inline-flex;overflow:hidden;border-radius:8px;border:1px solid rgba(255,255,255,.18);background:rgba(10,14,32,.45);width:5.2rem}
#${PANEL_HOST_ID} .ad-xconfig-onoff-btn{border:none;background:transparent;color:rgba(255,255,255,.9);width:50%;min-width:2.6rem;height:2.2rem;padding:0 .45rem;cursor:pointer;font-weight:700;font-size:.86rem}
#${PANEL_HOST_ID} .ad-xconfig-onoff-btn--on[data-active="true"]{background:rgba(44,170,90,.44);color:#fff}
#${PANEL_HOST_ID} .ad-xconfig-onoff-btn--off[data-active="true"]{background:rgba(199,63,63,.42);color:#fff}
#${PANEL_HOST_ID} .ad-xconfig-note{margin:.5rem 0 0;color:rgba(234,244,255,.9);font-size:.82rem}
#${PANEL_HOST_ID} .ad-xconfig-empty{border-radius:10px;border:1px dashed rgba(255,255,255,.3);background:rgba(255,255,255,.03);padding:1rem;color:rgba(255,255,255,.75);font-size:.88rem}
#${PANEL_HOST_ID} .ad-xconfig-modal-backdrop{position:fixed;inset:0;z-index:2147483000;background:rgba(5,11,29,.74);display:flex;align-items:center;justify-content:center;padding:1rem}
#${PANEL_HOST_ID} .ad-xconfig-modal{width:min(44rem,100%);max-height:calc(100vh - 2rem);overflow:auto;border-radius:12px;border:1px solid rgba(255,255,255,.22);background:linear-gradient(160deg,rgba(15,27,67,.97) 0%,rgba(25,32,71,.98) 75%);padding:1rem}
#${PANEL_HOST_ID} .ad-xconfig-modal-header{display:flex;justify-content:space-between;gap:.8rem}
#${PANEL_HOST_ID} .ad-xconfig-modal-title{margin:0;font-size:1.05rem;line-height:1.3}
#${PANEL_HOST_ID} .ad-xconfig-modal-subtitle{margin:.35rem 0 0;color:rgba(255,255,255,.75);font-size:.82rem}
#${PANEL_HOST_ID} .ad-xconfig-modal-body{margin-top:.95rem;display:grid;gap:.65rem}
#${PANEL_HOST_ID} .ad-xconfig-setting-row{border-radius:10px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.04);padding:.75rem}
#${PANEL_HOST_ID} .ad-xconfig-setting-row--debug{border-color:rgba(255,128,128,.36);background:linear-gradient(145deg,rgba(255,96,96,.14),rgba(255,120,120,.07))}
#${PANEL_HOST_ID} .ad-xconfig-setting-label{display:block;font-weight:700;font-size:.86rem}
#${PANEL_HOST_ID} .ad-xconfig-setting-input{margin-top:.58rem}
#${PANEL_HOST_ID} .ad-xconfig-setting-select{width:100%;border-radius:8px;border:1px solid rgba(255,255,255,.28);background:rgba(12,17,36,.9);color:#fff;font-size:.84rem;padding:.45rem .55rem}
#${PANEL_HOST_ID} .ad-xconfig-setting-action{display:grid;gap:.45rem}
#${PANEL_HOST_ID} .ad-xconfig-setting-action-btn{border:1px solid rgba(255,255,255,.3);border-radius:10px;min-height:2.65rem;padding:.55rem .8rem;background:rgba(22,38,82,.72);color:#fff;font-size:.85rem;font-weight:700;cursor:pointer}
#${PANEL_HOST_ID} .ad-xconfig-setting-action-btn:disabled{opacity:.55;cursor:not-allowed}
#${PANEL_HOST_ID} .ad-xconfig-setting-action-state{margin:0;font-size:.74rem;color:rgba(234,244,255,.9)}
#${PANEL_HOST_ID} .ad-xconfig-setting-action-state--disabled{color:rgba(255,212,212,.9)}
#${PANEL_HOST_ID} .ad-xconfig-hidden-input{position:absolute;opacity:0;pointer-events:none;width:0;height:0}
@media(max-width:1180px){#${PANEL_HOST_ID} .ad-xconfig-grid{grid-template-columns:1fr}}
`;

function isObjectLike(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function splitFeaturePath(featureKey) {
  return String(featureKey || "")
    .split(".")
    .map((part) => String(part || "").trim())
    .filter(Boolean);
}

function setNestedValue(rootValue, pathParts = [], value) {
  if (!isObjectLike(rootValue) || !Array.isArray(pathParts) || !pathParts.length) {
    return;
  }

  let current = rootValue;
  for (let index = 0; index < pathParts.length - 1; index += 1) {
    const part = pathParts[index];
    if (!isObjectLike(current[part])) {
      current[part] = {};
    }
    current = current[part];
  }

  current[pathParts[pathParts.length - 1]] = value;
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

function createElement(documentRef, tagName, options = {}) {
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

function normalizeRoutePath(pathValue) {
  let normalized = String(pathValue || "").trim().toLowerCase();
  if (!normalized) {
    return "";
  }

  if (!normalized.startsWith("/")) {
    normalized = `/${normalized}`;
  }

  normalized = normalized.replace(/[?#].*$/, "").replace(/\/{2,}/g, "/");
  if (normalized.length > 1) {
    normalized = normalized.replace(/\/+$/, "");
  }
  return normalized;
}

function toRoutePathname(windowRef, hrefValue) {
  const href = String(hrefValue || "").trim();
  if (!href || href.startsWith("#") || href.startsWith("javascript:")) {
    return "";
  }

  try {
    const parsed = new URL(href, windowRef?.location?.origin || "https://play.autodarts.io");
    return normalizeRoutePath(parsed.pathname);
  } catch (_) {
    return normalizeRoutePath(href);
  }
}

function currentRoute(windowRef) {
  const locationRef = windowRef?.location;
  return `${locationRef?.pathname || ""}${locationRef?.search || ""}${locationRef?.hash || ""}`;
}

function scoreSidebarCandidate(windowRef, candidate) {
  if (!candidate || typeof candidate.querySelectorAll !== "function") {
    return -1;
  }

  const anchors = Array.from(candidate.querySelectorAll("a[href]"));
  const routeMatches = anchors.reduce((count, anchor) => {
    return count + (SIDEBAR_ROUTE_HINTS.has(toRoutePathname(windowRef, anchor.getAttribute("href"))) ? 1 : 0);
  }, 0);

  let score = routeMatches * 20 + Math.min(anchors.length, 8);
  if (candidate.classList?.contains("navigation")) {
    score += 10;
  }
  if (candidate.matches?.("nav") || candidate.getAttribute?.("role") === "navigation") {
    score += 12;
  }

  const width = Number(candidate.getBoundingClientRect?.().width || 0);
  if (width > 0 && width < 520) {
    score += 6;
  }

  return score;
}

function getSidebarElement(windowRef, documentRef) {
  const root = documentRef?.getElementById?.("root");
  if (!root) {
    return null;
  }

  const candidates = [
    root.querySelector?.(".navigation"),
    root.querySelector?.("nav"),
    root.querySelector?.("[role='navigation']"),
    ...Array.from(root.querySelectorAll?.(".navigation") || []),
    ...Array.from(root.querySelectorAll?.("nav") || []),
    ...Array.from(root.querySelectorAll?.("[role='navigation']") || []),
  ].filter(Boolean);

  let best = null;
  let bestScore = -1;
  candidates.forEach((candidate) => {
    const score = scoreSidebarCandidate(windowRef, candidate);
    if (score > bestScore) {
      best = candidate;
      bestScore = score;
    }
  });

  return bestScore >= 12 ? best : null;
}

function getContentElement(documentRef) {
  const root = documentRef?.getElementById?.("root");
  if (!root) {
    return null;
  }

  const main = root.querySelector?.("main");
  if (main) {
    return main;
  }

  const directChildren = Array.from(root.children || []);
  return directChildren.find((child) => !child.matches?.("nav") && !child.classList?.contains("navigation")) || null;
}

function removeNodeById(documentRef, nodeId) {
  const node = documentRef?.getElementById?.(nodeId);
  if (node?.parentNode?.removeChild) {
    node.parentNode.removeChild(node);
  }
}

function buildFeatureSettingPatch(configKey, settingKey, value) {
  const patch = { features: {} };
  const path = splitFeaturePath(configKey);
  if (!path.length) {
    return patch;
  }

  const featurePatch = {};
  featurePatch[settingKey] = value;
  setNestedValue(patch.features, path, featurePatch);
  return patch;
}

function parseFieldValue(field, rawValue, checked) {
  if (!field) {
    return rawValue;
  }

  if (field.control === "checkbox") {
    return Boolean(checked);
  }

  const matchingOption = Array.isArray(field.options)
    ? field.options.find((option) => String(option.value) === String(rawValue))
    : null;

  return matchingOption ? matchingOption.value : rawValue;
}

function themeKeyFromConfigKey(configKey) {
  const path = splitFeaturePath(configKey);
  return path.length === 2 && path[0] === "themes" ? path[1] : "";
}

function sortFeatures(left, right) {
  const leftOrder = descriptorOrder.has(left.featureKey) ? descriptorOrder.get(left.featureKey) : Number.MAX_SAFE_INTEGER;
  const rightOrder = descriptorOrder.has(right.featureKey) ? descriptorOrder.get(right.featureKey) : Number.MAX_SAFE_INTEGER;
  if (leftOrder !== rightOrder) {
    return leftOrder - rightOrder;
  }
  return String(left.title || "").localeCompare(String(right.title || ""));
}

function menuIconMarkup() {
  return "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"currentColor\"><path d=\"M3 6.5A1.5 1.5 0 0 1 4.5 5h10A1.5 1.5 0 0 1 16 6.5v1A1.5 1.5 0 0 1 14.5 9h-10A1.5 1.5 0 0 1 3 7.5zm0 10A1.5 1.5 0 0 1 4.5 15h6A1.5 1.5 0 0 1 12 16.5v1a1.5 1.5 0 0 1-1.5 1.5h-6A1.5 1.5 0 0 1 3 17.5zM18 4a3 3 0 0 1 3 3a3 3 0 0 1-3 3a3 3 0 0 1-3-3a3 3 0 0 1 3-3m0 10a3 3 0 0 1 3 3a3 3 0 0 1-3 3a3 3 0 0 1-3-3a3 3 0 0 1 3-3\"/></svg>";
}

function buildMenuIconElement(documentRef, template) {
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

function buildFeatureField(documentRef, feature, field) {
  const fieldId = `ad-xconfig-field-${feature.featureKey}-${field.key || field.action}`;

  if (field.control === "action") {
    const wrapper = createElement(documentRef, "div", {
      className: "ad-xconfig-setting-action",
    });
    const button = createElement(documentRef, "button", {
      id: fieldId,
      type: "button",
      className: "ad-xconfig-setting-action-btn",
      text: field.label,
      attributes: {
        "data-adxconfig-action": field.action,
        "data-feature-key": feature.featureKey,
        "data-config-key": feature.configKey,
      },
    });
    wrapper.appendChild(button);
    wrapper.appendChild(createElement(documentRef, "p", {
      className: "ad-xconfig-note",
      text: field.action === "clearThemeBackground"
        ? "Entfernt das gespeicherte Bild für dieses Theme."
        : "Speichert das Bild für dieses Theme.",
    }));
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

  const wrapper = createElement(documentRef, "div", {
    className: "ad-xconfig-field",
  });
  wrapper.appendChild(createElement(documentRef, "label", { text: field.label, attributes: { for: fieldId } }));

  const select = createElement(documentRef, "select", {
    id: fieldId,
    className: "ad-xconfig-setting-select",
    attributes: {
      "data-adxconfig-setting": "true",
      "data-feature-key": feature.featureKey,
      "data-config-key": feature.configKey,
      "data-setting-key": field.key,
      "data-setting-control": field.control,
    },
  });

  const selectedValue = feature.config?.[field.key];
  field.options.forEach((option) => {
    const optionNode = createElement(documentRef, "option", {
      text: option.label,
      attributes: {
        value: String(option.value),
      },
    });
    optionNode.value = String(option.value);
    if (String(option.value) === String(selectedValue)) {
      optionNode.selected = true;
      select.value = String(option.value);
    }
    select.appendChild(optionNode);
  });

  wrapper.appendChild(select);
  return wrapper;
}

function buildFeatureCard(documentRef, feature) {
  const descriptor = getXConfigDescriptor(feature.featureKey);
  const card = createElement(documentRef, "article", {
    className: "ad-xconfig-card",
  });
  const previewUrl =
    String(feature.config?.backgroundImageDataUrl || "").trim() ||
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
    cardContent.appendChild(actions);
  }

  cardContent.appendChild(createElement(documentRef, "p", {
    className: "ad-xconfig-note",
    text: feature.configKey.startsWith("themes.")
      ? feature.config?.backgroundImageDataUrl
        ? "Eigenes Hintergrundbild gespeichert."
        : "Kein eigenes Hintergrundbild gespeichert."
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
  modalHeader.appendChild(createElement(documentRef, "button", {
    type: "button",
    className: "ad-xconfig-btn ad-xconfig-btn--square",
    text: "✖",
    attributes: {
      "data-adxconfig-action": "close-settings",
      "aria-label": "Einstellungen schließen",
    },
  }));
  modal.appendChild(modalHeader);

  const body = createElement(documentRef, "div", {
    className: "ad-xconfig-modal-body",
  });
  fields.forEach((field) => {
    const row = createElement(documentRef, "div", {
      className: String(field.key || field.action || "").toLowerCase() === "debug"
        ? "ad-xconfig-setting-row ad-xconfig-setting-row--debug"
        : "ad-xconfig-setting-row",
    });
    const inputWrap = createElement(documentRef, "div", {
      className: "ad-xconfig-setting-input",
    });
    if (field.control !== "select") {
      row.appendChild(createElement(documentRef, "label", {
        className: "ad-xconfig-setting-label",
        text: field.label,
      }));
    }
    inputWrap.appendChild(buildFeatureField(documentRef, feature, field));
    row.appendChild(inputWrap);
    body.appendChild(row);
  });
  modal.appendChild(body);

  backdrop.appendChild(modal);
  return backdrop;
}

function buildShellContent(documentRef, state, features) {
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
  headingMain.appendChild(createElement(documentRef, "button", {
    type: "button",
    className: "ad-xconfig-btn ad-xconfig-btn--square",
    text: "←",
    attributes: {
      "data-adxconfig-action": "close",
      "aria-label": "Zurück",
    },
  }));
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
    },
  }));
  header.appendChild(headerActions);
  shell.appendChild(header);

  if (state.notice?.type && state.notice?.message) {
    shell.appendChild(createElement(documentRef, "div", {
      className: `ad-xconfig-notice ad-xconfig-notice--${state.notice.type}`,
      text: state.notice.message,
    }));
  }

  const tabs = createElement(documentRef, "nav", {
    className: "ad-xconfig-tabs",
  });
  TAB_DEFINITIONS.forEach((tab) => {
    const button = createElement(documentRef, "button", {
      id: `ad-xconfig-tab-${tab.id}`,
      className: "ad-xconfig-tab",
      type: "button",
      attributes: {
        "data-adxconfig-tab": tab.id,
        "data-active": state.activeTab === tab.id ? "true" : "false",
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

  const content = createElement(documentRef, "div", {
    className: "ad-xconfig-content",
  });
  const grid = createElement(documentRef, "div", {
    className: "ad-xconfig-grid",
  });
  features
    .filter((feature) => {
      const descriptor = getXConfigDescriptor(feature.featureKey);
      return (descriptor?.tab || "animations") === state.activeTab;
    })
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
  shell.appendChild(content);

  const modal = buildSettingsModal(documentRef, state, features);
  if (modal) {
    shell.appendChild(modal);
  }

  page.appendChild(shell);
  return page;
}
function ensureXConfigShell(options = {}) {
  const windowRef = options.windowRef || (typeof window !== "undefined" ? window : null);
  if (!windowRef) {
    return null;
  }

  if (shellByWindow.has(windowRef)) {
    return shellByWindow.get(windowRef);
  }

  const documentRef = options.documentRef || windowRef.document || null;
  const runtime = options.runtime || null;
  const runtimeApi = options.runtimeApi || windowRef.__adXConfig || null;
  const domGuards = runtime?.context?.domGuards || null;
  const observerRegistry = runtime?.context?.registries?.observers || null;
  const listenerRegistry = runtime?.context?.registries?.listeners || null;
  const eventBus = runtime?.context?.eventBus || null;

  if (!documentRef || !runtimeApi || !runtime || !domGuards) {
    return null;
  }

  const state = {
    activeTab: "themes",
    activeSettingsFeatureKey: "",
    hiddenDisplays: new Map(),
    contentHidden: false,
    lastNonConfigRoute: normalizeRoutePath(currentRoute(windowRef)) || "/lobbies",
    started: false,
    historyRestore: null,
    syncScheduled: false,
    notice: { type: "", message: "" },
    noticeTimer: null,
  };

  function isConfigRoute() {
    return normalizeRoutePath(windowRef?.location?.pathname || "") === CONFIG_PATH;
  }

  function clearNoticeTimer() {
    if (state.noticeTimer && typeof windowRef.clearTimeout === "function") {
      windowRef.clearTimeout(state.noticeTimer);
      state.noticeTimer = null;
    }
  }

  function setNotice(type, message) {
    state.notice = { type: String(type || ""), message: String(message || "").trim() };
    clearNoticeTimer();
    if (state.notice.message && typeof windowRef.setTimeout === "function") {
      state.noticeTimer = windowRef.setTimeout(() => {
        state.notice = { type: "", message: "" };
        state.noticeTimer = null;
        queueSync();
      }, NOTICE_TIMEOUT_MS);
    }
    queueSync();
  }

  function getFeatures() {
    const features = typeof runtimeApi.listFeatures === "function"
      ? runtimeApi.listFeatures()
      : [];
    return Array.isArray(features) ? features : [];
  }

  function restoreContent() {
    state.hiddenDisplays.forEach((displayValue, node) => {
      if (node && node.isConnected) {
        node.style.display = displayValue;
      }
    });
    state.hiddenDisplays.clear();
    state.contentHidden = false;
  }

  function hideContent(content, host) {
    Array.from(content?.children || []).forEach((child) => {
      if (child === host) {
        return;
      }

      if (!state.hiddenDisplays.has(child)) {
        state.hiddenDisplays.set(child, child.style.display || "");
      }
      child.style.display = "none";
    });
    state.contentHidden = true;
  }

  function syncMenuButtonState() {
    const button = documentRef.getElementById?.(MENU_ITEM_ID);
    if (!button) {
      return;
    }
    if (isConfigRoute()) {
      button.setAttribute("data-active", "true");
    } else {
      button.removeAttribute("data-active");
    }
  }

  function syncMenuLabelForWidth(sidebar, item) {
    const menuItem = item || documentRef.getElementById?.(MENU_ITEM_ID);
    const sidebarElement = sidebar || getSidebarElement(windowRef, documentRef);
    if (!menuItem || !sidebarElement) {
      return;
    }
    const label = menuItem.querySelector?.(".ad-xconfig-menu-label");
    if (!label) {
      return;
    }
    const width = Number(sidebarElement.getBoundingClientRect?.().width || 0);
    label.style.display = width > 0 && width < MENU_LABEL_COLLAPSE_WIDTH ? "none" : "inline";
  }

  function ensureMenuButton() {
    const sidebar = getSidebarElement(windowRef, documentRef);
    if (!sidebar) {
      return null;
    }

    const sidebarLinks = Array.from(sidebar.querySelectorAll("a[href]"));
    const boardsAnchor =
      sidebarLinks.find((link) => toRoutePathname(windowRef, link.getAttribute("href")) === "/boards") ||
      sidebarLinks.find((link) => String(link.textContent || "").trim().toLowerCase() === "meine boards") ||
      null;
    const insertionAnchor =
      boardsAnchor ||
      sidebarLinks.find((link) => SIDEBAR_ROUTE_HINTS.has(toRoutePathname(windowRef, link.getAttribute("href")))) ||
      null;

    let item = documentRef.getElementById?.(MENU_ITEM_ID);
    if (!item) {
      const template =
        insertionAnchor ||
        sidebar.querySelector?.("a[href], button, [role='button']") ||
        sidebar.lastElementChild ||
        null;
      item = template ? template.cloneNode(true) : createElement(documentRef, "button", { type: "button" });
      item.id = MENU_ITEM_ID;
      item.setAttribute("role", "button");
      item.setAttribute("tabindex", "0");
      item.setAttribute("aria-label", MENU_LABEL);
      item.setAttribute("title", MENU_LABEL);
      item.setAttribute("data-adxconfig-action", "open");
      item.style.cursor = "pointer";

      if (String(item.tagName || "").toLowerCase() === "a") {
        item.removeAttribute("href");
      } else if (String(item.tagName || "").toLowerCase() === "button") {
        item.setAttribute("type", "button");
      }

      const icon = buildMenuIconElement(documentRef, template);
      const label = createElement(documentRef, "span", {
        className: "ad-xconfig-menu-label",
        text: MENU_LABEL,
      });
      item.replaceChildren(icon, label);
    }

    if (insertionAnchor) {
      if (insertionAnchor.nextElementSibling !== item) {
        insertionAnchor.insertAdjacentElement("afterend", item);
      }
    } else if (item.parentNode !== sidebar) {
      sidebar.appendChild(item);
    }

    syncMenuButtonState();
    syncMenuLabelForWidth(sidebar, item);
    return item;
  }

  function ensurePanelHost() {
    const content = getContentElement(documentRef);
    if (!content) {
      return null;
    }

    let host = documentRef.getElementById?.(PANEL_HOST_ID);
    if (!host) {
      host = createElement(documentRef, "section", {
        id: PANEL_HOST_ID,
      });
    }

    if (host.parentNode !== content) {
      content.appendChild(host);
    }

    return host;
  }

  function render() {
    if (!state.started) {
      return;
    }

    const host = ensurePanelHost();
    if (!host) {
      return;
    }

    host.replaceChildren(buildShellContent(documentRef, state, getFeatures()));
  }

  function syncVisibility() {
    const content = getContentElement(documentRef);
    const host = ensurePanelHost();

    if (!content || !host) {
      return;
    }

    if (isConfigRoute()) {
      render();
      hideContent(content, host);
      host.style.display = "block";
    } else {
      if (state.contentHidden) {
        restoreContent();
      }
      state.activeSettingsFeatureKey = "";
      host.style.display = "none";
    }

    syncMenuButtonState();
  }

  function queueSync() {
    if (!state.started || state.syncScheduled) {
      return;
    }

    state.syncScheduled = true;
    const raf =
      typeof windowRef.requestAnimationFrame === "function"
        ? windowRef.requestAnimationFrame.bind(windowRef)
        : (callback) => windowRef.setTimeout(callback, 0);

    raf(() => {
      state.syncScheduled = false;
      domGuards.ensureStyle(STYLE_ID, styleText);
      ensureMenuButton();
      syncVisibility();
    });
  }

  function isManagedNode(node) {
    let current = node;
    while (current) {
      const nodeId = String(current.id || "");
      if (nodeId === MENU_ITEM_ID || nodeId === PANEL_HOST_ID || nodeId === STYLE_ID) {
        return true;
      }
      current = current.parentNode || null;
    }
    return false;
  }

  function hasExternalDomMutation(mutations = []) {
    if (!Array.isArray(mutations) || !mutations.length) {
      return true;
    }

    return mutations.some((mutation) => {
      if (isManagedNode(mutation?.target || null)) {
        return false;
      }

      const addedNodes =
        mutation?.addedNodes && typeof mutation.addedNodes[Symbol.iterator] === "function"
          ? Array.from(mutation.addedNodes)
          : [];
      const removedNodes =
        mutation?.removedNodes && typeof mutation.removedNodes[Symbol.iterator] === "function"
          ? Array.from(mutation.removedNodes)
          : [];
      const touchedNodes = [...addedNodes, ...removedNodes].filter(Boolean);

      if (!touchedNodes.length) {
        return true;
      }

      return touchedNodes.some((node) => !isManagedNode(node));
    });
  }

  function observeRoot() {
    const target =
      documentRef.getElementById?.("root") ||
      documentRef.documentElement ||
      documentRef.body ||
      null;

    if (!target || typeof observerRegistry?.registerMutationObserver !== "function") {
      return;
    }

    observerRegistry.registerMutationObserver({
      key: ROOT_OBSERVER_KEY,
      target,
      callback: (mutations = []) => {
        if (!hasExternalDomMutation(mutations)) {
          return;
        }
        queueSync();
      },
      observeOptions: {
        childList: true,
        subtree: true,
      },
      MutationObserverRef: windowRef.MutationObserver,
    });
  }

  function patchHistory() {
    if (state.historyRestore || !windowRef.history) {
      return;
    }

    const originalPushState = windowRef.history.pushState?.bind(windowRef.history);
    const originalReplaceState = windowRef.history.replaceState?.bind(windowRef.history);

    if (typeof originalPushState !== "function" || typeof originalReplaceState !== "function") {
      return;
    }

    windowRef.history.pushState = function patchedPushState(...args) {
      const result = originalPushState(...args);
      queueSync();
      return result;
    };

    windowRef.history.replaceState = function patchedReplaceState(...args) {
      const result = originalReplaceState(...args);
      queueSync();
      return result;
    };

    state.historyRestore = () => {
      windowRef.history.pushState = originalPushState;
      windowRef.history.replaceState = originalReplaceState;
      state.historyRestore = null;
    };
  }

  function navigateToConfigRoute() {
    if (!isConfigRoute()) {
      state.lastNonConfigRoute = normalizeRoutePath(currentRoute(windowRef)) || "/lobbies";
      windowRef.history.pushState({ adxconfig: true }, "", CONFIG_PATH);
    }
    queueSync();
  }

  function navigateBack() {
    const target = state.lastNonConfigRoute && state.lastNonConfigRoute !== CONFIG_PATH
      ? state.lastNonConfigRoute
      : "/lobbies";
    windowRef.history.pushState({}, "", target);
    queueSync();
  }

  function withRuntimeCall(promiseLike, successMessage, errorMessage, successType = "success") {
    Promise.resolve(promiseLike)
      .then(() => {
        if (successMessage) {
          setNotice(successType, successMessage);
        }
      })
      .catch(() => {
        if (errorMessage) {
          setNotice("error", errorMessage);
        }
      })
      .finally(() => queueSync());
  }

  function handleThemeBackgroundUpload(feature) {
    const themeKey = themeKeyFromConfigKey(feature?.configKey);
    if (!themeKey || typeof runtimeApi.setThemeBackgroundImage !== "function") {
      return;
    }
    if (typeof documentRef.createElement !== "function" || typeof windowRef.FileReader !== "function") {
      setNotice("error", "Bild-Upload wird in dieser Umgebung nicht unterstützt.");
      return;
    }

    const input = documentRef.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.style.display = "none";
    input.onchange = () => {
      const file = input.files && input.files[0];
      if (!file) {
        input.onchange = null;
        input.remove?.();
        return;
      }

      const reader = new windowRef.FileReader();
      reader.onload = () => {
        withRuntimeCall(
          runtimeApi.setThemeBackgroundImage(themeKey, String(reader.result || "")),
          "Hintergrundbild gespeichert.",
          "Hintergrundbild konnte nicht gespeichert werden."
        );
        input.onchange = null;
        input.remove?.();
      };
      reader.onerror = () => {
        setNotice("error", "Bild konnte nicht gelesen werden.");
        input.onchange = null;
        input.remove?.();
      };
      reader.readAsDataURL(file);
    };

    (documentRef.body || documentRef.documentElement).appendChild(input);
    input.click?.();
  }

  function handleAction(action, actionNode, feature) {
    if (!action) {
      return;
    }

    if (action === "open") {
      navigateToConfigRoute();
      return;
    }
    if (action === "close") {
      navigateBack();
      return;
    }
    if (action === "open-settings" && feature) {
      state.activeSettingsFeatureKey = feature.featureKey;
      queueSync();
      return;
    }
    if (action === "close-settings") {
      state.activeSettingsFeatureKey = "";
      queueSync();
      return;
    }
    if (action === "close-settings-backdrop") {
      state.activeSettingsFeatureKey = "";
      queueSync();
      return;
    }

    if (action === "reset" && typeof runtimeApi.resetConfig === "function") {
      const confirmed = typeof windowRef.confirm === "function"
        ? windowRef.confirm("Bist du sicher? Damit werden alle Einstellungen auf Default gesetzt und alle Module deaktiviert.")
        : true;
      if (!confirmed) {
        return;
      }
      withRuntimeCall(runtimeApi.resetConfig(), "Konfiguration wurde zurückgesetzt.", "Zurücksetzen fehlgeschlagen.", "info");
      return;
    }

    if (action === "set-feature" && feature && typeof runtimeApi.setFeatureEnabled === "function") {
      const enabled = String(actionNode?.getAttribute?.("data-feature-enabled")) === "true";
      withRuntimeCall(
        runtimeApi.setFeatureEnabled(feature.featureKey, enabled),
        `${feature.title}: ${enabled ? "An" : "Aus"}`,
        `${feature.title}: Status konnte nicht gespeichert werden.`
      );
      return;
    }

    if (action === "set-setting-toggle" && feature && typeof runtimeApi.saveConfig === "function") {
      const configKey = actionNode?.getAttribute?.("data-config-key") || feature.configKey;
      const settingKey = actionNode?.getAttribute?.("data-setting-key");
      const settingValue = String(actionNode?.getAttribute?.("data-setting-value")) === "true";
      if (!configKey || !settingKey) {
        return;
      }
      withRuntimeCall(
        runtimeApi.saveConfig(buildFeatureSettingPatch(configKey, settingKey, settingValue)),
        "Einstellung gespeichert.",
        "Einstellung konnte nicht gespeichert werden."
      );
      return;
    }

    if (!feature) {
      return;
    }

    const themeKey = themeKeyFromConfigKey(feature.configKey);
    if (action === "clearThemeBackground" && themeKey && typeof runtimeApi.clearThemeBackgroundImage === "function") {
      withRuntimeCall(
        runtimeApi.clearThemeBackgroundImage(themeKey),
        "Hintergrundbild entfernt.",
        "Hintergrundbild konnte nicht entfernt werden.",
        "info"
      );
      return;
    }

    if (action === "uploadThemeBackground" && themeKey) {
      handleThemeBackgroundUpload(feature);
    }
  }

  function onDocumentClick(event) {
    const target = event?.target;
    if (!target || typeof target.closest !== "function") {
      return;
    }

    const tabNode = target.closest("[data-adxconfig-tab]");
    if (tabNode) {
      const tabId = tabNode.getAttribute("data-adxconfig-tab") || "themes";
      if (TAB_DEFINITIONS.some((tab) => tab.id === tabId)) {
        state.activeTab = tabId;
        state.activeSettingsFeatureKey = "";
        queueSync();
      }
      return;
    }

    const actionNode = target.closest("[data-adxconfig-action]");
    if (!actionNode) {
      return;
    }

    if (actionNode.getAttribute("data-adxconfig-action") === "close-settings-backdrop") {
      const insideModal = target.closest("[data-adxconfig-modal='true']");
      if (insideModal) {
        return;
      }
    }

    event.preventDefault?.();
    const featureKey = actionNode.getAttribute("data-feature-key");
    const feature = getFeatures().find((entry) => entry.featureKey === featureKey) || null;
    handleAction(actionNode.getAttribute("data-adxconfig-action"), actionNode, feature);
  }

  function onDocumentChange(event) {
    const target = event?.target;
    if (!target || typeof target.getAttribute !== "function") {
      return;
    }

    if (target.getAttribute("data-adxconfig-feature-toggle") === "true") {
      const featureKey = target.getAttribute("data-feature-key");
      if (featureKey && typeof runtimeApi.setFeatureEnabled === "function") {
        withRuntimeCall(
          runtimeApi.setFeatureEnabled(featureKey, Boolean(target.checked)),
          "Modulstatus gespeichert.",
          "Modulstatus konnte nicht gespeichert werden."
        );
      }
      return;
    }

    if (target.getAttribute("data-adxconfig-setting") !== "true") {
      return;
    }

    const featureKey = target.getAttribute("data-feature-key");
    const configKey = target.getAttribute("data-config-key");
    const settingKey = target.getAttribute("data-setting-key");
    if (!featureKey || !configKey || !settingKey || typeof runtimeApi.saveConfig !== "function") {
      return;
    }

    const descriptor = getXConfigDescriptor(featureKey);
    const field = descriptor?.fields?.find((entry) => entry.key === settingKey) || null;
    const nextValue = parseFieldValue(field, target.value, target.checked);
    withRuntimeCall(
      runtimeApi.saveConfig(buildFeatureSettingPatch(configKey, settingKey, nextValue)),
      "Einstellung gespeichert.",
      "Einstellung konnte nicht gespeichert werden."
    );
  }

  function onDocumentKeydown(event) {
    if (event?.key === "Escape" && state.activeSettingsFeatureKey) {
      state.activeSettingsFeatureKey = "";
      queueSync();
      return;
    }

    const target = event?.target;
    if (!target || typeof target.closest !== "function") {
      return;
    }

    const menuNode = target.closest(`#${MENU_ITEM_ID}`);
    if (!menuNode) {
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault?.();
      navigateToConfigRoute();
    }
  }

  function mount() {
    if (state.started) {
      queueSync();
      return;
    }

    state.started = true;
    domGuards.ensureStyle(STYLE_ID, styleText);
    patchHistory();

    if (typeof listenerRegistry?.register === "function") {
      listenerRegistry.register({
        key: LISTENER_KEYS.popstate,
        target: windowRef,
        type: "popstate",
        handler: () => queueSync(),
      });
      listenerRegistry.register({
        key: LISTENER_KEYS.click,
        target: documentRef,
        type: "click",
        handler: onDocumentClick,
      });
      listenerRegistry.register({
        key: LISTENER_KEYS.change,
        target: documentRef,
        type: "change",
        handler: onDocumentChange,
      });
      listenerRegistry.register({
        key: LISTENER_KEYS.keydown,
        target: documentRef,
        type: "keydown",
        handler: onDocumentKeydown,
      });
    }

    observeRoot();
    queueSync();
  }

  function teardown() {
    state.started = false;
    state.activeSettingsFeatureKey = "";
    clearNoticeTimer();
    state.notice = { type: "", message: "" };
    restoreContent();

    if (typeof observerRegistry?.disconnect === "function") {
      observerRegistry.disconnect(ROOT_OBSERVER_KEY);
    }
    if (typeof listenerRegistry?.remove === "function") {
      Object.values(LISTENER_KEYS).forEach((key) => listenerRegistry.remove(key));
    }

    if (typeof state.historyRestore === "function") {
      state.historyRestore();
    }

    removeNodeById(documentRef, MENU_ITEM_ID);
    removeNodeById(documentRef, PANEL_HOST_ID);
    removeNodeById(documentRef, STYLE_ID);
  }

  const offStarted =
    typeof eventBus?.on === "function"
      ? eventBus.on("runtime:started", () => mount())
      : () => {};
  const offStopped =
    typeof eventBus?.on === "function"
      ? eventBus.on("runtime:stopped", () => teardown())
      : () => {};
  const offConfigUpdated =
    typeof eventBus?.on === "function"
      ? eventBus.on("runtime:config-updated", () => {
        if (state.started) {
          queueSync();
        }
      })
      : () => {};
  const offFeatureToggled =
    typeof eventBus?.on === "function"
      ? eventBus.on("runtime:feature-toggled", () => {
        if (state.started) {
          queueSync();
        }
      })
      : () => {};

  if (runtime.getSnapshot?.().started) {
    mount();
  }

  const shell = {
    mount,
    teardown,
    dispose() {
      teardown();
      offStarted();
      offStopped();
      offConfigUpdated();
      offFeatureToggled();
      shellByWindow.delete(windowRef);
    },
  };

  shellByWindow.set(windowRef, shell);
  return shell;
}

export function ensureXConfigUi(options = {}) {
  return ensureXConfigShell(options);
}

export { ensureXConfigShell };




