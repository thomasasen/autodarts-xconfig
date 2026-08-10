import { getXConfigDescriptor, xconfigDescriptorOrder } from "./descriptors.js";
import {
  openUserscriptInstall,
  readStoredUpdateStatus,
} from "./update-check.js";
import { createManagedNodeMatcher } from "../../core/dom-mutation-filter.js";
import {
  currentRoute,
  getContentElement,
  getSidebarElement,
  hasShellNavigationOrLayoutMutation,
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
  applyTurnDartImageStatusNode,
  clearThemeBackgroundImage,
  formatThemeBackgroundSummary,
  uploadThemeBackgroundImage,
} from "./theme-background.js";
import { resolveFeatureCardPreview } from "./feature-card-preview.js";
import { createShellActionController } from "./action-controller.js";
import { createUpdateStatusController } from "./update-controller.js";
import { createShellLifecycleController } from "./lifecycle-controller.js";
import { createXConfigEffectPreviewController } from "./effect-preview-controller.js";
import { createTypographyPreviewFontController } from "./typography-preview-font-controller.js";
import { createTurnScoreCounterPreviewAdapter } from "./turn-score-preview-adapter.js";
import { createAvgTrendArrowPreviewAdapter } from "./avg-trend-preview-adapter.js";
import { createDartboardMarkerHighlightPreviewAdapter } from "./dartboard-marker-highlight-preview-adapter.js";
import { createX01RemainingScoreBarPreviewController } from "./x01-remaining-score-bar-preview-controller.js";
import {
  downloadSettingsExport,
  selectSettingsImportFile,
} from "./settings-transfer.js";
import { styleText } from "./shell-style.js";
import {
  isHexColorInputValue,
  normalizeHexColor,
} from "../../shared/hex-color-utils.js";
import {
  ELECTRIC_FILTER_DEFS_NODE_ID,
  releaseElectricFilterDefs,
  retainElectricFilterDefs,
} from "../../shared/electric-border-engine.js";
import {
  buildMenuIconElement,
  buildShellContent,
  createElement,
  openChangelog,
  openReadme,
  parseFieldValue,
  syncSettingsPreview,
  syncFeatureCardPreviewContent,
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
const DART_MARKER_DARTS_FEATURE_KEY = "dart-marker-replacer";
const DART_MARKER_DARTS_DESIGN_SETTING_KEY = "design";
const THEME_GLOBAL_TYPOGRAPHY_FEATURE_KEY = "theme-global-typography";
const LISTENER_KEYS = Object.freeze({
  popstate: "xconfig-shell:popstate",
  click: "xconfig-shell:document-click",
  change: "xconfig-shell:document-change",
  keydown: "xconfig-shell:document-keydown",
  pointerover: "xconfig-shell:document-pointerover",
  pointerout: "xconfig-shell:document-pointerout",
  focusin: "xconfig-shell:document-focusin",
  focusout: "xconfig-shell:document-focusout",
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

function ensureXConfigShell(options = {}) {
  const windowRef = options.windowRef || (globalThis.window !== undefined ? globalThis.window : null);
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
    settingsTransfer: {
      dialog: "",
      includeAssets: true,
      importMode: "merge",
      fileName: "",
      fileSize: 0,
      payload: "",
      report: null,
      busy: false,
      returnAction: "",
    },
    shellNode: null,
    renderSignature: "",
    updateStatus: readStoredUpdateStatus({
      windowRef,
      installedVersion,
    }),
    updateCheckPromise: null,
    pendingManualUpdateCheck: null,
    updateCheckIntervalHandle: null,
    updateAbortController: null,
    updateCheckGeneration: 0,
  };

  let routeController = null;
  let renderController = null;
  let actionController = null;
  let lifecycleController = null;
  let effectPreviewController = null;
  let typographyPreviewFontController = null;
  let x01RemainingScoreBarPreviewController = null;
  let electricPreviewFiltersRetained = false;

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

  function focusTransferReturnAction(action) {
    if (!action || typeof windowRef.setTimeout !== "function") {
      return;
    }
    windowRef.setTimeout(() => {
      documentRef
        .querySelector?.(`[data-adxconfig-action='${action}']`)
        ?.focus?.();
    }, 0);
  }

  function closeSettingsTransfer() {
    const returnAction = state.settingsTransfer.returnAction;
    state.settingsTransfer = {
      dialog: "",
      includeAssets: true,
      importMode: "merge",
      fileName: "",
      fileSize: 0,
      payload: "",
      report: null,
      busy: false,
      returnAction: "",
    };
    queueSync();
    focusTransferReturnAction(returnAction);
  }

  function openSettingsExport() {
    state.activeSettingsFeatureKey = "";
    state.settingsTransfer = {
      ...state.settingsTransfer,
      dialog: "export",
      includeAssets: true,
      report: null,
      busy: false,
      returnAction: "open-settings-export",
    };
    queueSync();
  }

  function startSettingsExport() {
    if (state.settingsTransfer.busy || typeof runtimeApi.createSettingsExport !== "function") {
      return;
    }
    state.settingsTransfer.busy = true;
    queueSync();
    Promise.resolve(
      runtimeApi.createSettingsExport({
        includeAssets: state.settingsTransfer.includeAssets,
      })
    )
      .then((exportResult) => {
        downloadSettingsExport({ documentRef, windowRef, exportResult });
        closeSettingsTransfer();
        setNotice("success", `Einstellungen exportiert: ${exportResult.fileName}`);
      })
      .catch((error) => {
        state.settingsTransfer.busy = false;
        setNotice("error", String(error?.message || "Export fehlgeschlagen."));
        queueSync();
      });
  }

  function previewSelectedSettingsImport() {
    if (
      !state.settingsTransfer.payload ||
      typeof runtimeApi.previewSettingsImport !== "function"
    ) {
      return;
    }
    state.settingsTransfer.busy = true;
    state.settingsTransfer.report = null;
    queueSync();
    Promise.resolve(
      runtimeApi.previewSettingsImport(state.settingsTransfer.payload, {
        mode: state.settingsTransfer.importMode,
      })
    )
      .then((report) => {
        state.settingsTransfer.report = report;
      })
      .catch((error) => {
        state.settingsTransfer.report = {
          status: "fatal",
          counts: { applied: 0, migrated: 0, skipped: 0, unchanged: 0, warning: 0, fatal: 1 },
          issues: [{ status: "fatal", message: String(error?.message || "Importprüfung fehlgeschlagen.") }],
        };
      })
      .finally(() => {
        state.settingsTransfer.busy = false;
        queueSync();
      });
  }

  function openSettingsImport() {
    selectSettingsImportFile({
      documentRef,
      windowRef,
      onSuccess(fileInfo) {
        state.activeSettingsFeatureKey = "";
        state.settingsTransfer = {
          ...state.settingsTransfer,
          dialog: "import",
          importMode: "merge",
          fileName: fileInfo.fileName,
          fileSize: fileInfo.fileSize,
          payload: fileInfo.payload,
          report: null,
          busy: false,
          returnAction: "open-settings-import",
        };
        previewSelectedSettingsImport();
      },
      onError(error) {
        setNotice("error", String(error?.message || "Importdatei konnte nicht gelesen werden."));
      },
    });
  }

  function setSettingsImportMode(mode) {
    if (!state.settingsTransfer.payload || !["merge", "replace"].includes(mode)) {
      return;
    }
    state.settingsTransfer.importMode = mode;
    previewSelectedSettingsImport();
  }

  function confirmSettingsImport() {
    const report = state.settingsTransfer.report;
    const applicable = Number(report?.counts?.applied || 0) + Number(report?.counts?.migrated || 0);
    if (
      state.settingsTransfer.busy ||
      report?.status !== "ready" ||
      applicable === 0 ||
      typeof runtimeApi.importSettings !== "function"
    ) {
      return;
    }
    state.settingsTransfer.busy = true;
    queueSync();
    Promise.resolve(
      runtimeApi.importSettings(state.settingsTransfer.payload, {
        mode: state.settingsTransfer.importMode,
      })
    )
      .then((result) => {
        state.settingsTransfer.dialog = "result";
        state.settingsTransfer.report = result.report;
        setNotice("success", "Einstellungen wurden importiert.");
      })
      .catch((error) => {
        setNotice("error", String(error?.message || "Einstellungen konnten nicht gespeichert werden."));
      })
      .finally(() => {
        state.settingsTransfer.busy = false;
        queueSync();
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

  function syncFeatureCardPreview(featureKey) {
    const normalizedFeatureKey = String(featureKey || "").trim();
    if (!normalizedFeatureKey) {
      return;
    }

    const feature = getFeatures().find((entry) => entry?.featureKey === normalizedFeatureKey) || null;
    if (!feature) {
      return;
    }

    const nextCardPreview = resolveFeatureCardPreview(feature);
    const cardNodes = Array.from(documentRef.querySelectorAll(
      `.ad-xconfig-card[data-feature-key='${normalizedFeatureKey}']`
    ));
    cardNodes.forEach((card) => {
      card.setAttribute("data-preview-kind", nextCardPreview.kind);
      const imageNode = card.querySelector(".ad-xconfig-card-bg img");
      if (imageNode && nextCardPreview.url) {
        imageNode.setAttribute("src", nextCardPreview.url);
        imageNode.setAttribute("alt", `${feature.title} Vorschau`);
      }
      syncFeatureCardPreviewContent(documentRef, card, feature, nextCardPreview);
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

    syncFeatureCardPreview(normalizedFeatureKey);
    const cardStatusNodes = Array.from(documentRef.querySelectorAll(
      `[data-adxconfig-theme-card-status='true'][data-feature-key='${normalizedFeatureKey}']`
    ));
    const cardStatusText = formatThemeBackgroundSummary(feature);
    cardStatusNodes.forEach((node) => {
      node.textContent = cardStatusText;
    });
    const modalStatusNodes = Array.from(documentRef.querySelectorAll(
      `[data-adxconfig-theme-image-status='true'][data-feature-key='${normalizedFeatureKey}']`
    ));
    modalStatusNodes.forEach((node) => {
      applyThemeBackgroundStatusNode(documentRef, node, feature);
    });
  }

  function syncTurnDartImageIndicators(featureKey) {
    const normalizedFeatureKey = String(featureKey || "").trim();
    if (!normalizedFeatureKey) {
      return;
    }

    const feature = getFeatures().find((entry) => entry?.featureKey === normalizedFeatureKey) || null;
    if (!feature) {
      return;
    }

    const modalStatusNodes = Array.from(documentRef.querySelectorAll(
      `[data-adxconfig-turn-dart-image-status='true'][data-feature-key='${normalizedFeatureKey}']`
    ));
    modalStatusNodes.forEach((node) => {
      applyTurnDartImageStatusNode(documentRef, node, feature);
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
        const typographyFeature = getFeatures().find(
          (feature) => feature?.featureKey === THEME_GLOBAL_TYPOGRAPHY_FEATURE_KEY
        );
        typographyPreviewFontController?.activate(typographyFeature?.config?.fontPreset);
      } else {
        typographyPreviewFontController?.deactivate();
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
    cancelUpdateCheck,
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
    ids: [MENU_ITEM_ID, PANEL_HOST_ID, STYLE_ID, PREVIEW_FONTS_STYLE_ID, ELECTRIC_FILTER_DEFS_NODE_ID],
  });

  function retainElectricPreviewFilters() {
    if (electricPreviewFiltersRetained) {
      return;
    }

    const retained = retainElectricFilterDefs({ documentRef, domGuards });
    electricPreviewFiltersRetained = Boolean(retained.available);
  }

  function releaseElectricPreviewFilters() {
    if (!electricPreviewFiltersRetained) {
      return;
    }

    releaseElectricFilterDefs({ documentRef });
    electricPreviewFiltersRetained = false;
  }

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

  function shouldScheduleMutationSync(mutations = []) {
    if (isConfigRoute()) {
      return true;
    }

    return hasShellNavigationOrLayoutMutation(mutations, {
      menuItemId: MENU_ITEM_ID,
      panelHostId: PANEL_HOST_ID,
      rootId: "root",
    });
  }

  effectPreviewController = createXConfigEffectPreviewController({
    adapters: [
      createAvgTrendArrowPreviewAdapter(),
      createDartboardMarkerHighlightPreviewAdapter(),
      createTurnScoreCounterPreviewAdapter({
        windowRef,
      }),
    ],
    getFeatures,
    panelHostId: PANEL_HOST_ID,
  });
  typographyPreviewFontController = createTypographyPreviewFontController({
    domGuards,
    panelHostId: PANEL_HOST_ID,
    styleId: PREVIEW_FONTS_STYLE_ID,
  });
  x01RemainingScoreBarPreviewController = createX01RemainingScoreBarPreviewController({
    documentRef,
    windowRef,
  });

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
    onBeforeRender: () => {
      effectPreviewController?.stopActivePreview();
      x01RemainingScoreBarPreviewController?.stop();
    },
    onAfterRender: () => {
      x01RemainingScoreBarPreviewController?.start();
      documentRef
        .querySelector?.("[data-adxconfig-transfer-dialog] button:not([disabled])")
        ?.focus?.();
    },
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
    openSettingsExport,
    startSettingsExport,
    openSettingsImport,
    setSettingsImportMode,
    confirmSettingsImport,
    closeSettingsTransfer,
    parseFieldValue,
    queueSync,
    refreshUpdateStatus,
    runtimeApi,
    setNotice,
    setThemeActionFeedback,
    state,
    syncColorFieldControl,
    syncSelectOptionButtons,
    syncSettingsPreview: (featureKey, settingKey, settingValue) =>
      syncSettingsPreview(documentRef, getFeatures(), featureKey, settingKey, settingValue),
    syncFeatureCardPreview,
    syncThemeBackgroundIndicators,
    syncTurnDartImageIndicators,
    themeKeyFromConfigKey,
    uploadThemeBackgroundImage,
    windowRef,
  });

  lifecycleController = createShellLifecycleController({
    cancelQueuedSync,
    cancelUpdateCheck,
    clearNoticeTimer,
    documentRef,
    domGuards,
    eventBus,
    isManagedNode,
    listenerKeys: LISTENER_KEYS,
    listenerRegistry,
    menuItemId: MENU_ITEM_ID,
    normalizeLegacyConfigPathIfNeeded: () => routeController?.normalizeLegacyConfigPathIfNeeded(),
    observerRegistry,
    onDocumentChange,
    onDocumentFocusin: (event) => {
      effectPreviewController?.handlePreviewStartEvent(event);
      typographyPreviewFontController?.handlePreviewRequest(event);
    },
    onDocumentFocusout: (event) => effectPreviewController?.handlePreviewEndEvent(event),
    onDocumentClick,
    onDocumentKeydown,
    onDocumentPointerover: (event) => {
      effectPreviewController?.handlePreviewStartEvent(event);
      typographyPreviewFontController?.handlePreviewRequest(event);
    },
    onDocumentPointerout: (event) => effectPreviewController?.handlePreviewEndEvent(event),
    onMounted: retainElectricPreviewFilters,
    onTeardown: () => {
      effectPreviewController?.stopActivePreview();
      x01RemainingScoreBarPreviewController?.stop();
      typographyPreviewFontController?.deactivate();
      releaseElectricPreviewFilters();
    },
    onVisibilityChange: (event) => {
      effectPreviewController?.stopActivePreview();
      x01RemainingScoreBarPreviewController?.stop();
      onVisibilityChange(event);
    },
    panelHostId: PANEL_HOST_ID,
    queueSync,
    refreshUpdateStatus,
    removeNodeById,
    restoreContent,
    rootObserverKey: ROOT_OBSERVER_KEY,
    runtime,
    shouldScheduleMutationSync,
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
    effectPreviewController?.stopActivePreview();

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

    if (target.dataset?.adxconfigTransferIncludeAssets === "true") {
      state.settingsTransfer.includeAssets = Boolean(target.checked);
      queueSync();
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
    if (event?.key === "Escape" && state.settingsTransfer.dialog && !state.settingsTransfer.busy) {
      closeSettingsTransfer();
      return;
    }
    if (event?.key === "Escape" && state.activeSettingsFeatureKey) {
      effectPreviewController?.stopActivePreview();
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




