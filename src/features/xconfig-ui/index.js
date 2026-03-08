import { getXConfigDescriptor, xconfigDescriptors } from "./descriptors.js";

const CONFIG_PATH = "/ad-xconfig";
const MENU_LABEL = "AD xConfig";
const MENU_ITEM_ID = "ad-xconfig-menu-item";
const PANEL_HOST_ID = "ad-xconfig-panel-host";
const STYLE_ID = "ad-xconfig-shell-style";
const ROOT_OBSERVER_KEY = "xconfig-shell:root-observer";
const LISTENER_KEYS = Object.freeze({
  popstate: "xconfig-shell:popstate",
  click: "xconfig-shell:document-click",
  change: "xconfig-shell:document-change",
  keydown: "xconfig-shell:document-keydown",
});
const TAB_DEFINITIONS = Object.freeze([
  Object.freeze({ id: "themes", label: "Themen" }),
  Object.freeze({ id: "animations", label: "Animationen" }),
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
#${MENU_ITEM_ID} {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  width: 100%;
  padding: 0.75rem 0.95rem;
  border: 1px solid rgba(22, 43, 77, 0.12);
  border-radius: 0.9rem;
  background: rgba(255, 255, 255, 0.78);
  color: #10213c;
  cursor: pointer;
  font: inherit;
  text-align: left;
}

#${MENU_ITEM_ID}[data-active="true"] {
  border-color: rgba(33, 89, 171, 0.26);
  background: rgba(217, 232, 255, 0.82);
}

#${MENU_ITEM_ID} .ad-xconfig-menu-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 999px;
  background: #2159ab;
  color: #ffffff;
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: lowercase;
}

#${PANEL_HOST_ID} {
  display: none;
}

#${PANEL_HOST_ID} .ad-xconfig-shell {
  box-sizing: border-box;
  min-height: 100%;
  padding: 1.4rem;
  border-radius: 1.35rem;
  background:
    radial-gradient(circle at top right, rgba(217, 232, 255, 0.9), transparent 34%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.97), rgba(248, 251, 255, 0.96));
  border: 1px solid rgba(16, 33, 60, 0.08);
  color: #10213c;
  box-shadow: 0 18px 46px rgba(16, 33, 60, 0.12);
}

#${PANEL_HOST_ID} .ad-xconfig-header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

#${PANEL_HOST_ID} .ad-xconfig-title {
  margin: 0;
  font-size: 1.6rem;
}

#${PANEL_HOST_ID} .ad-xconfig-subtitle {
  margin: 0.35rem 0 0;
  color: #4a5a78;
}

#${PANEL_HOST_ID} .ad-xconfig-header-actions,
#${PANEL_HOST_ID} .ad-xconfig-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
}

#${PANEL_HOST_ID} .ad-xconfig-btn,
#${PANEL_HOST_ID} .ad-xconfig-tab,
#${PANEL_HOST_ID} .ad-xconfig-toggle {
  border: 1px solid rgba(16, 33, 60, 0.14);
  border-radius: 999px;
  background: #ffffff;
  color: #10213c;
  cursor: pointer;
  font: inherit;
}

#${PANEL_HOST_ID} .ad-xconfig-btn,
#${PANEL_HOST_ID} .ad-xconfig-tab {
  padding: 0.6rem 0.95rem;
}

#${PANEL_HOST_ID} .ad-xconfig-btn--danger {
  border-color: rgba(180, 35, 35, 0.18);
  color: #8a1c1c;
}

#${PANEL_HOST_ID} .ad-xconfig-tab[data-active="true"] {
  background: #2159ab;
  border-color: #2159ab;
  color: #ffffff;
}

#${PANEL_HOST_ID} .ad-xconfig-grid {
  display: grid;
  gap: 1rem;
  margin-top: 1rem;
}

#${PANEL_HOST_ID} .ad-xconfig-card {
  padding: 1rem;
  border-radius: 1.05rem;
  background: rgba(255, 255, 255, 0.86);
  border: 1px solid rgba(16, 33, 60, 0.08);
}

#${PANEL_HOST_ID} .ad-xconfig-card-head {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 0.85rem;
  margin-bottom: 0.85rem;
}

#${PANEL_HOST_ID} .ad-xconfig-card-title {
  margin: 0;
  font-size: 1.05rem;
}

#${PANEL_HOST_ID} .ad-xconfig-card-copy {
  margin: 0.4rem 0 0;
  color: #4a5a78;
}

#${PANEL_HOST_ID} .ad-xconfig-variant {
  display: inline-flex;
  margin-top: 0.55rem;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  background: rgba(33, 89, 171, 0.1);
  color: #2159ab;
  font-size: 0.83rem;
  font-weight: 600;
}

#${PANEL_HOST_ID} .ad-xconfig-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.45rem 0.8rem;
}

#${PANEL_HOST_ID} .ad-xconfig-toggle input {
  margin: 0;
}

#${PANEL_HOST_ID} .ad-xconfig-fields {
  display: grid;
  gap: 0.75rem;
}

#${PANEL_HOST_ID} .ad-xconfig-field {
  display: grid;
  gap: 0.32rem;
}

#${PANEL_HOST_ID} .ad-xconfig-field label {
  font-weight: 600;
}

#${PANEL_HOST_ID} .ad-xconfig-field select {
  width: 100%;
  max-width: 20rem;
  padding: 0.5rem 0.6rem;
  border: 1px solid rgba(16, 33, 60, 0.16);
  border-radius: 0.75rem;
  background: #ffffff;
  color: #10213c;
}

#${PANEL_HOST_ID} .ad-xconfig-field--checkbox {
  display: flex;
  align-items: center;
  gap: 0.55rem;
}

#${PANEL_HOST_ID} .ad-xconfig-field--checkbox label {
  font-weight: 500;
}

#${PANEL_HOST_ID} .ad-xconfig-note {
  margin: 0.5rem 0 0;
  color: #2159ab;
  font-size: 0.88rem;
}
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

function buildFeatureToggle(documentRef, feature) {
  const wrapper = createElement(documentRef, "label", {
    className: "ad-xconfig-toggle",
  });
  const checkbox = createElement(documentRef, "input", {
    id: `ad-xconfig-toggle-${feature.featureKey}`,
    type: "checkbox",
    attributes: {
      "data-adxconfig-feature-toggle": "true",
      "data-feature-key": feature.featureKey,
    },
  });
  checkbox.checked = Boolean(feature.enabled);
  wrapper.appendChild(checkbox);
  wrapper.appendChild(createElement(documentRef, "span", { text: feature.enabled ? "Aktiv" : "Aus" }));
  return wrapper;
}

function buildFeatureField(documentRef, feature, field) {
  const fieldId = `ad-xconfig-field-${feature.featureKey}-${field.key || field.action}`;

  if (field.control === "action") {
    const wrapper = createElement(documentRef, "div", {
      className: "ad-xconfig-field",
    });
    const button = createElement(documentRef, "button", {
      id: fieldId,
      type: "button",
      className: "ad-xconfig-btn",
      text: field.label,
      attributes: {
        "data-adxconfig-action": field.action,
        "data-feature-key": feature.featureKey,
        "data-config-key": feature.configKey,
      },
    });
    wrapper.appendChild(button);
    return wrapper;
  }

  if (field.control === "checkbox") {
    const wrapper = createElement(documentRef, "div", {
      className: "ad-xconfig-field ad-xconfig-field--checkbox",
    });
    const input = createElement(documentRef, "input", {
      id: fieldId,
      type: "checkbox",
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
    wrapper.appendChild(createElement(documentRef, "label", { text: field.label, attributes: { for: fieldId } }));
    return wrapper;
  }

  const wrapper = createElement(documentRef, "div", {
    className: "ad-xconfig-field",
  });
  wrapper.appendChild(createElement(documentRef, "label", { text: field.label, attributes: { for: fieldId } }));

  const select = createElement(documentRef, "select", {
    id: fieldId,
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

  const variantLabel = formatVariantLabel(feature.variants);
  if (variantLabel) {
    copy.appendChild(createElement(documentRef, "span", {
      className: "ad-xconfig-variant",
      text: variantLabel,
    }));
  }

  head.appendChild(copy);
  head.appendChild(buildFeatureToggle(documentRef, feature));
  card.appendChild(head);

  const fields = createElement(documentRef, "div", {
    className: "ad-xconfig-fields",
  });
  (descriptor?.fields || []).forEach((field) => {
    fields.appendChild(buildFeatureField(documentRef, feature, field));
  });
  card.appendChild(fields);

  if (feature.configKey.startsWith("themes.")) {
    const backgroundSet = Boolean(feature.config?.backgroundImageDataUrl);
    card.appendChild(createElement(documentRef, "p", {
      className: "ad-xconfig-note",
      text: backgroundSet
        ? "Eigenes Hintergrundbild gespeichert."
        : "Kein eigenes Hintergrundbild gespeichert.",
    }));
  }

  return card;
}

function buildShellContent(documentRef, state, features) {
  const shell = createElement(documentRef, "div", {
    className: "ad-xconfig-shell",
  });

  const header = createElement(documentRef, "header", {
    className: "ad-xconfig-header",
  });
  const heading = createElement(documentRef, "div");
  heading.appendChild(createElement(documentRef, "h1", {
    className: "ad-xconfig-title",
    text: MENU_LABEL,
  }));
  heading.appendChild(createElement(documentRef, "p", {
    className: "ad-xconfig-subtitle",
    text: "Zentrale Verwaltung für Themes, Animationen und ihre Einstellungen.",
  }));
  header.appendChild(heading);

  const headerActions = createElement(documentRef, "div", {
    className: "ad-xconfig-header-actions",
  });
  headerActions.appendChild(createElement(documentRef, "button", {
    className: "ad-xconfig-btn",
    text: "Schließen",
    type: "button",
    attributes: {
      "data-adxconfig-action": "close",
    },
  }));
  headerActions.appendChild(createElement(documentRef, "button", {
    className: "ad-xconfig-btn ad-xconfig-btn--danger",
    text: "Zurücksetzen",
    type: "button",
    attributes: {
      "data-adxconfig-action": "reset",
    },
  }));
  header.appendChild(headerActions);
  shell.appendChild(header);

  const tabs = createElement(documentRef, "nav", {
    className: "ad-xconfig-tabs",
  });
  TAB_DEFINITIONS.forEach((tab) => {
    const button = createElement(documentRef, "button", {
      id: `ad-xconfig-tab-${tab.id}`,
      className: "ad-xconfig-tab",
      text: tab.label,
      type: "button",
      attributes: {
        "data-adxconfig-tab": tab.id,
        "data-active": state.activeTab === tab.id ? "true" : "false",
      },
    });
    tabs.appendChild(button);
  });
  shell.appendChild(tabs);

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
  shell.appendChild(grid);

  return shell;
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
    hiddenDisplays: new Map(),
    contentHidden: false,
    lastNonConfigRoute: normalizeRoutePath(currentRoute(windowRef)) || "/lobbies",
    started: false,
    historyRestore: null,
    syncScheduled: false,
  };

  function isConfigRoute() {
    return normalizeRoutePath(windowRef?.location?.pathname || "") === CONFIG_PATH;
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

  function ensureMenuButton() {
    const sidebar = getSidebarElement(windowRef, documentRef);
    if (!sidebar) {
      return null;
    }

    const sidebarLinks = Array.from(sidebar.querySelectorAll("a[href]"));
    const insertionAnchor =
      sidebarLinks.find((link) => toRoutePathname(windowRef, link.getAttribute("href")) === "/boards") ||
      sidebarLinks.find((link) => SIDEBAR_ROUTE_HINTS.has(toRoutePathname(windowRef, link.getAttribute("href")))) ||
      null;

    let button = documentRef.getElementById?.(MENU_ITEM_ID);
    if (!button) {
      button = createElement(documentRef, "button", {
        id: MENU_ITEM_ID,
        type: "button",
        attributes: {
          "data-adxconfig-action": "open",
          title: MENU_LABEL,
          "aria-label": MENU_LABEL,
        },
      });

      button.appendChild(createElement(documentRef, "span", {
        className: "ad-xconfig-menu-mark",
        text: "x",
      }));
      button.appendChild(createElement(documentRef, "span", {
        className: "ad-xconfig-menu-label",
        text: MENU_LABEL,
      }));
    }

    if (insertionAnchor && insertionAnchor.parentNode === sidebar) {
      if (insertionAnchor.nextElementSibling !== button) {
        insertionAnchor.insertAdjacentElement("afterend", button);
      }
    } else if (button.parentNode !== sidebar) {
      sidebar.appendChild(button);
    }

    syncMenuButtonState();
    return button;
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

    const features =
      typeof runtimeApi.listFeatures === "function"
        ? runtimeApi.listFeatures()
        : [];

    host.replaceChildren(buildShellContent(documentRef, state, features));
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
      callback: () => queueSync(),
      observeOptions: {
        childList: true,
        subtree: true,
        attributes: true,
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

  function handleAction(action, feature) {
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

    if (action === "reset" && typeof runtimeApi.resetConfig === "function") {
      runtimeApi.resetConfig().finally(() => queueSync());
      return;
    }

    if (!feature) {
      return;
    }

    const themeKey = themeKeyFromConfigKey(feature.configKey);
    if (action === "clearThemeBackground" && themeKey && typeof runtimeApi.clearThemeBackgroundImage === "function") {
      runtimeApi.clearThemeBackgroundImage(themeKey).finally(() => queueSync());
      return;
    }

    if (action === "uploadThemeBackground" && themeKey && typeof runtimeApi.setThemeBackgroundImage === "function") {
      if (typeof documentRef.createElement !== "function" || typeof windowRef.FileReader !== "function") {
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
          runtimeApi
            .setThemeBackgroundImage(themeKey, String(reader.result || ""))
            .finally(() => {
              input.onchange = null;
              input.remove?.();
              queueSync();
            });
        };
        reader.onerror = () => {
          input.onchange = null;
          input.remove?.();
        };
        reader.readAsDataURL(file);
      };

      (documentRef.body || documentRef.documentElement).appendChild(input);
      input.click?.();
    }
  }

  function onDocumentClick(event) {
    const target = event?.target;
    if (!target || typeof target.closest !== "function") {
      return;
    }

    const actionNode = target.closest("[data-adxconfig-action]");
    if (actionNode) {
      event.preventDefault?.();
      const featureKey = actionNode.getAttribute("data-feature-key");
      const feature =
        typeof runtimeApi.listFeatures === "function"
          ? runtimeApi.listFeatures().find((entry) => entry.featureKey === featureKey) || null
          : null;
      handleAction(actionNode.getAttribute("data-adxconfig-action"), feature);
      return;
    }

    const tabNode = target.closest("[data-adxconfig-tab]");
    if (tabNode) {
      state.activeTab = tabNode.getAttribute("data-adxconfig-tab") || "themes";
      queueSync();
    }
  }

  function onDocumentChange(event) {
    const target = event?.target;
    if (!target || typeof target.getAttribute !== "function") {
      return;
    }

    if (target.getAttribute("data-adxconfig-feature-toggle") === "true") {
      const featureKey = target.getAttribute("data-feature-key");
      if (featureKey && typeof runtimeApi.setFeatureEnabled === "function") {
        runtimeApi.setFeatureEnabled(featureKey, Boolean(target.checked)).finally(() => queueSync());
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
    runtimeApi.saveConfig(buildFeatureSettingPatch(configKey, settingKey, nextValue)).finally(() => queueSync());
  }

  function onDocumentKeydown(event) {
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
