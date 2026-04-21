import { getXConfigDescriptor, xconfigDescriptorOrder } from "./descriptors.js";
import { resolveXConfigPreviewAsset } from "#xconfig-preview-assets";
import {
  openUserscriptInstall,
  readStoredUpdateStatus,
} from "./update-check.js";
import { createManagedNodeMatcher, hasExternalDomMutation } from "../../core/dom-mutation-filter.js";
import {
  currentRoute,
  getContentElement,
  getSidebarElement,
  isConfigHash,
  isLegacyConfigPath,
  isNavigationElement,
  normalizeRoutePath,
  removeNodeById,
  toRoutePathname,
} from "./layout-utils.js";
import {
  buildFeatureSettingPatch,
  isBackgroundThemeFeature,
  isThemeFeature,
  themeKeyFromConfigKey,
} from "./path-utils.js";
import { cancelWindowSync, queueWindowSync } from "./sync-scheduler.js";
import {
  buildShellRenderSignature,
  parseShellRenderSignature,
} from "./render-signature.js";
import { createShellRenderController } from "./render-controller.js";
import { createShellRouteController } from "./route-controller.js";
import {
  applyThemeBackgroundStatusNode,
  clearThemeBackgroundImage,
  formatThemeBackgroundSummary,
  resolveThemeBackgroundPreviewUrl,
  uploadThemeBackgroundImage,
} from "./theme-background.js";
import { createShellActionController } from "./action-controller.js";
import { createUpdateStatusController } from "./update-controller.js";
import { createShellLifecycleController } from "./lifecycle-controller.js";
import { styleText } from "./shell-style.js";
import {
  buildThemeGlobalTypographyPreviewImports,
  getThemeGlobalTypographyPreset,
} from "../../shared/theme-global-typography-presets.js";
import {
  isHexColorInputValue,
  normalizeHexColor,
} from "../../shared/hex-color-utils.js";
import {
  buildMenuIconElement,
  buildShellContent,
  createElement,
  openChangelog,
  openReadme,
  parseFieldValue,
  syncColorFieldControl,
  syncSelectOptionButtons,
} from "./shell-view.js";

const CONFIG_PATH = "/ad-xconfig";
const CONFIG_HASH = "#ad-xconfig";
const MENU_LABEL = "AD xConfig";
const MENU_LABEL_COLLAPSE_WIDTH = 120;
const MENU_ITEM_ID = "ad-xconfig-menu-item";
const PANEL_HOST_ID = "ad-xconfig-panel-host";
const STYLE_ID = "ad-xconfig-shell-style";
const PREVIEW_FONTS_STYLE_ID = "ad-xconfig-preview-fonts-style";
const README_URL = "https://github.com/thomasasen/autodarts-xconfig/blob/main/README.md";
const CHANGELOG_URL = "https://github.com/thomasasen/autodarts-xconfig/blob/main/CHANGELOG.md";
const ROOT_OBSERVER_KEY = "xconfig-shell:root-observer";
const NOTICE_TIMEOUT_MS = 3200;
const UPDATE_AUTO_CHECK_INTERVAL_MS = 15 * 60 * 1000;
const DART_MARKER_DARTS_FEATURE_KEY = "dart-marker-darts";
const DART_MARKER_DARTS_DESIGN_SETTING_KEY = "design";
const THEME_GLOBAL_TYPOGRAPHY_FEATURE_KEY = "theme-global-typography";
const THEME_GLOBAL_SCOPE_LABELS = Object.freeze({
  scores: "Scores",
  throws: "Würfe",
  names: "Namen",
});
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

function formatThemeGlobalScopeSummary(feature) {
  const rawValues = Array.isArray(feature?.config?.applyTo)
    ? feature.config.applyTo
    : [feature?.config?.applyTo];
  const labels = Array.from(
    new Set(
      rawValues
        .map((value) => THEME_GLOBAL_SCOPE_LABELS[String(value || "").trim().toLowerCase()] || "")
        .filter(Boolean)
    )
  );
  return labels.length ? labels.join(" · ") : THEME_GLOBAL_SCOPE_LABELS.scores;
}

function formatThemeGlobalFontSummary(feature) {
  return getThemeGlobalTypographyPreset(feature?.config?.fontPreset)?.label || "Standard (deaktiviert)";
}


function ensureXConfigShell(options = {}) {
  const windowRef = options.windowRef || (typeof globalThis.window !== "undefined" ? globalThis.window : null);
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

  const installedVersion = String(runtimeApi.apiVersion || "").trim();
  const initialRoutePath = normalizeRoutePath(windowRef?.location?.pathname || "");
  const initialLastNonConfigRoute =
    initialRoutePath && initialRoutePath !== CONFIG_PATH ? initialRoutePath : "/lobbies";

  const state = {
    activeTab: "themes",
    activeSettingsFeatureKey: "",
    hiddenDisplays: new Map(),
    contentHidden: false,
    lastNonConfigRoute: initialLastNonConfigRoute,
    started: false,
    historyRestore: null,
    syncScheduled: false,
    syncHandle: null,
    syncHandleType: "",
    notice: { type: "", message: "" },
    noticeTimer: null,
    shellNode: null,
    renderSignature: "",
    updateStatus: readStoredUpdateStatus({
      windowRef,
      installedVersion,
    }),
    updateCheckPromise: null,
    pendingManualUpdateCheck: null,
    updateCheckIntervalHandle: null,
  };

  let routeController = null;
  let renderController = null;
  let actionController = null;
  let lifecycleController = null;

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

  function syncThemeGlobalCardSummary(feature) {
    if (String(feature?.featureKey || "").trim() !== THEME_GLOBAL_TYPOGRAPHY_FEATURE_KEY) {
      return;
    }

    const valueMap = {
      font: formatThemeGlobalFontSummary(feature),
      scope: formatThemeGlobalScopeSummary(feature),
      priority: "Theme-Bild > Templates Global",
      role: "Zentrale Ebene für Presets und Fallbacks",
    };
    Object.entries(valueMap).forEach(([key, value]) => {
      const nodes = Array.from(documentRef.querySelectorAll(
        `.ad-xconfig-card[data-feature-key='${feature.featureKey}'] [data-adxconfig-theme-global-value='${key}']`
      ));
      nodes.forEach((node) => {
        node.textContent = value;
      });
    });
  }

  function setThemeActionFeedback(featureKey, type, message) {
    const normalizedFeatureKey = String(featureKey || "").trim();
    if (!normalizedFeatureKey) {
      return;
    }

    const feedbackNodes = Array.from(documentRef.querySelectorAll(
      `[data-adxconfig-theme-action-feedback='true'][data-feature-key='${normalizedFeatureKey}']`
    ));
    if (!feedbackNodes.length) {
      return;
    }

    const normalizedMessage = String(message || "").trim();
    const normalizedType = String(type || "info").trim() || "info";
    const feedbackClassName =
      `ad-xconfig-note ad-xconfig-theme-action-feedback ad-xconfig-theme-action-feedback--${normalizedType}`;

    feedbackNodes.forEach((node) => {
      node.setAttribute("class", feedbackClassName);
      node.textContent = normalizedMessage;
    });
  }

  function syncThemeBackgroundIndicators(featureKey) {
    const normalizedFeatureKey = String(featureKey || "").trim();
    if (!normalizedFeatureKey) {
      return;
    }

    const feature = getFeatures().find((entry) => entry?.featureKey === normalizedFeatureKey) || null;
    if (!feature || !isBackgroundThemeFeature(feature)) {
      return;
    }

    const cardStatusNodes = Array.from(documentRef.querySelectorAll(
      `[data-adxconfig-theme-card-status='true'][data-feature-key='${normalizedFeatureKey}']`
    ));
    const cardStatusText = formatThemeBackgroundSummary(feature);
    cardStatusNodes.forEach((node) => {
      node.textContent = cardStatusText;
    });
    const nextCardPreviewUrl =
      resolveThemeBackgroundPreviewUrl(feature) ||
      resolveXConfigPreviewAsset(feature.featureKey);
    const cardPreviewNodes = Array.from(documentRef.querySelectorAll(
      `.ad-xconfig-card[data-feature-key='${normalizedFeatureKey}'] .ad-xconfig-card-bg img`
    ));
    cardPreviewNodes.forEach((node) => {
      node.setAttribute("src", nextCardPreviewUrl);
      node.setAttribute("alt", `${feature.title} Vorschau`);
    });
    syncThemeGlobalCardSummary(feature);

    const modalStatusNodes = Array.from(documentRef.querySelectorAll(
      `[data-adxconfig-theme-image-status='true'][data-feature-key='${normalizedFeatureKey}']`
    ));
    modalStatusNodes.forEach((node) => {
      applyThemeBackgroundStatusNode(documentRef, node, feature);
    });
  }

  function restoreContent() {
    renderController?.restoreContent();
  }

  function queueSync() {
    queueWindowSync(state, windowRef, () => {
      domGuards.ensureStyle(STYLE_ID, styleText);
      if (
        isConfigRoute() &&
        state.activeSettingsFeatureKey === THEME_GLOBAL_TYPOGRAPHY_FEATURE_KEY
      ) {
        domGuards.ensureStyle(
          PREVIEW_FONTS_STYLE_ID,
          `${buildThemeGlobalTypographyPreviewImports()}\n#${PANEL_HOST_ID} [data-adxconfig-preview-font]{font-kerning:normal;}`
        );
      } else {
        domGuards.removeNodeById(PREVIEW_FONTS_STYLE_ID);
      }
      ensureMenuButton();
      syncVisibility();
    });
  }

  function cancelQueuedSync() {
    cancelWindowSync(state, windowRef);
  }

  const {
    refreshUpdateStatus,
    startAutoUpdateChecks,
    stopAutoUpdateChecks,
    onVisibilityChange,
  } = createUpdateStatusController({
    windowRef,
    documentRef,
    installedVersion,
    state,
    setNotice,
    queueSync,
    updateIntervalMs: UPDATE_AUTO_CHECK_INTERVAL_MS,
  });

  const isManagedNode = createManagedNodeMatcher({
    ids: [MENU_ITEM_ID, PANEL_HOST_ID, STYLE_ID, PREVIEW_FONTS_STYLE_ID],
  });

  routeController = createShellRouteController({
    configHash: CONFIG_HASH,
    configPath: CONFIG_PATH,
    currentRoute,
    isConfigHash,
    isLegacyConfigPath,
    normalizeRoutePath,
    queueSync,
    state,
    windowRef,
  });

  function isConfigRoute() {
    return routeController?.isConfigRoute() || false;
  }

  function ensureMenuButton() {
    return renderController?.ensureMenuButton() || null;
  }

  function syncVisibility() {
    renderController?.syncVisibility();
  }

  renderController = createShellRenderController({
    buildMenuIconElement,
    buildShellContent,
    buildShellRenderSignature,
    createElement,
    documentRef,
    getContentElement,
    getFeatures,
    getSidebarElement,
    installedVersion,
    isConfigRoute,
    isNavigationElement,
    isThemeFeature,
    menuItemId: MENU_ITEM_ID,
    menuLabel: MENU_LABEL,
    menuLabelCollapseWidth: MENU_LABEL_COLLAPSE_WIDTH,
    panelHostId: PANEL_HOST_ID,
    parseShellRenderSignature,
    sidebarRouteHints: SIDEBAR_ROUTE_HINTS,
    state,
    toRoutePathname,
    windowRef,
  });

  actionController = createShellActionController({
    buildFeatureSettingPatch,
    clearThemeBackgroundImage,
    documentRef,
    getFeatures,
    getXConfigDescriptor,
    isThemeFeature,
    navigateBack: () => routeController?.navigateBack(),
    navigateToConfigRoute: () => routeController?.navigateToConfigRoute(),
    openChangelog,
    openReadme,
    openUserscriptInstall,
    parseFieldValue,
    queueSync,
    refreshUpdateStatus,
    runtimeApi,
    setNotice,
    setThemeActionFeedback,
    state,
    syncColorFieldControl,
    syncSelectOptionButtons,
    syncThemeBackgroundIndicators,
    themeKeyFromConfigKey,
    uploadThemeBackgroundImage,
    windowRef,
  });

  lifecycleController = createShellLifecycleController({
    cancelQueuedSync,
    clearNoticeTimer,
    documentRef,
    domGuards,
    eventBus,
    hasExternalDomMutation,
    isManagedNode,
    listenerKeys: LISTENER_KEYS,
    listenerRegistry,
    menuItemId: MENU_ITEM_ID,
    normalizeLegacyConfigPathIfNeeded: () => routeController?.normalizeLegacyConfigPathIfNeeded(),
    observerRegistry,
    onDocumentChange,
    onDocumentClick,
    onDocumentKeydown,
    onVisibilityChange,
    panelHostId: PANEL_HOST_ID,
    queueSync,
    refreshUpdateStatus,
    removeNodeById,
    restoreContent,
    rootObserverKey: ROOT_OBSERVER_KEY,
    runtime,
    startAutoUpdateChecks,
    state,
    stopAutoUpdateChecks,
    extraNodeIds: [PREVIEW_FONTS_STYLE_ID],
    styleId: STYLE_ID,
    styleText,
    windowRef,
  });

  function navigateToConfigRoute() {
    routeController?.navigateToConfigRoute();
  }

  function withRuntimeCall(promiseLike, successMessage, errorMessage, successType = "success") {
    actionController?.withRuntimeCall(promiseLike, successMessage, errorMessage, successType);
  }

  function handleAction(action, actionNode, feature) {
    actionController?.handleAction(action, actionNode, feature);
  }

  function onDocumentClick(event) {
    const target = event?.target;
    if (!target || typeof target.closest !== "function") {
      return;
    }

    const tabNode = target.closest("[data-adxconfig-tab]");
    if (tabNode) {
      const tabId = tabNode.dataset?.adxconfigTab || "themes";
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
    const insideMenuButton = actionNode.id === MENU_ITEM_ID || Boolean(actionNode.closest(`#${MENU_ITEM_ID}`));
    const insidePanelHost = Boolean(actionNode.closest(`#${PANEL_HOST_ID}`));
    if (!insideMenuButton && !insidePanelHost) {
      return;
    }

    const action = actionNode.dataset?.adxconfigAction || "";

    if (action === "close-settings-backdrop") {
      const insideModal = target.closest("[data-adxconfig-modal='true']");
      if (insideModal) {
        return;
      }
    }

    event.preventDefault?.();
    const featureKey = actionNode.dataset?.featureKey || "";
    const feature = getFeatures().find((entry) => entry.featureKey === featureKey) || null;
    handleAction(action, actionNode, feature);
  }

  function onDocumentChange(event) {
    const target = event?.target;
    if (!target || typeof target.getAttribute !== "function") {
      return;
    }

    if (target.dataset?.adxconfigFeatureToggle === "true") {
      const featureKey = target.dataset?.featureKey || "";
      if (featureKey && typeof runtimeApi.setFeatureEnabled === "function") {
        withRuntimeCall(
          runtimeApi.setFeatureEnabled(featureKey, Boolean(target.checked)),
          "Modulstatus gespeichert.",
          "Modulstatus konnte nicht gespeichert werden."
        );
      }
      return;
    }

    if (target.dataset?.adxconfigSetting !== "true") {
      return;
    }

    const featureKey = target.dataset?.featureKey || "";
    const configKey = target.dataset?.configKey || "";
    const settingKey = target.dataset?.settingKey || "";
    if (!featureKey || !configKey || !settingKey || typeof runtimeApi.saveConfig !== "function") {
      return;
    }

    const descriptor = getXConfigDescriptor(featureKey);
    const field = descriptor?.fields?.find((entry) => entry.key === settingKey) || null;
    if (field?.control === "color") {
      const fieldNode =
        target.closest?.("[data-adxconfig-color-field='true']") ||
        target.parentElement?.closest?.("[data-adxconfig-color-field='true']") ||
        null;
      const rawValue = String(target.value || "").trim();
      if (!rawValue) {
        syncColorFieldControl(fieldNode, {
          value: "",
        });
        withRuntimeCall(
          runtimeApi.saveConfig(buildFeatureSettingPatch(configKey, settingKey, "")),
          "Theme-Default wieder aktiv.",
          "Einstellung konnte nicht gespeichert werden."
        );
        return;
      }

      if (!isHexColorInputValue(rawValue)) {
        syncColorFieldControl(fieldNode, {
          value: fieldNode?.getAttribute?.("data-color-value") || "",
          displayValue: rawValue,
          invalid: true,
        });
        return;
      }

      const nextColorValue = normalizeHexColor(rawValue, "");
      syncColorFieldControl(fieldNode, {
        value: nextColorValue,
      });
      withRuntimeCall(
        runtimeApi.saveConfig(buildFeatureSettingPatch(configKey, settingKey, nextColorValue)),
        "Einstellung gespeichert.",
        "Einstellung konnte nicht gespeichert werden."
      );
      return;
    }

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
    lifecycleController?.mount();
  }

  function teardown() {
    lifecycleController?.teardown();
  }

  const disposeLifecycleBindings = lifecycleController?.bindRuntimeLifecycle?.() || (() => {});

  const shell = {
    mount,
    teardown,
    dispose() {
      teardown();
      disposeLifecycleBindings();
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




