import { shouldHandleExternalDomMutation } from "../../core/dom-mutation-filter.js";

function observeRootController(controller) {
  const target =
    controller.documentRef.getElementById?.("root") ||
    controller.documentRef.documentElement ||
    controller.documentRef.body ||
    null;

  if (!target || typeof controller.observerRegistry?.registerMutationObserver !== "function") {
    return;
  }

  controller.observerRegistry.registerMutationObserver({
    key: controller.rootObserverKey,
    target,
    callback: (mutations = []) => {
      if (
        !shouldHandleExternalDomMutation(mutations, {
          isManagedNode: controller.isManagedNode,
          shouldHandle: controller.shouldScheduleMutationSync,
        })
      ) {
        return;
      }
      controller.queueSync();
    },
    observeOptions: {
      childList: true,
      subtree: true,
    },
    MutationObserverRef: controller.windowRef.MutationObserver,
  });
}

function patchHistoryController(controller) {
  if (controller.state.historyRestore || !controller.windowRef.history) {
    return;
  }

  const originalPushState = controller.windowRef.history.pushState?.bind(controller.windowRef.history);
  const originalReplaceState =
    controller.windowRef.history.replaceState?.bind(controller.windowRef.history);

  if (typeof originalPushState !== "function" || typeof originalReplaceState !== "function") {
    return;
  }

  controller.windowRef.history.pushState = function patchedPushState(...args) {
    const result = originalPushState(...args);
    controller.queueSync();
    return result;
  };

  controller.windowRef.history.replaceState = function patchedReplaceState(...args) {
    const result = originalReplaceState(...args);
    controller.queueSync();
    return result;
  };

  controller.state.historyRestore = () => {
    controller.windowRef.history.pushState = originalPushState;
    controller.windowRef.history.replaceState = originalReplaceState;
    controller.state.historyRestore = null;
  };
}

function registerShellLifecycleListeners(controller) {
  if (typeof controller.listenerRegistry?.register !== "function") {
    return;
  }

  controller.listenerRegistry.register({
    key: controller.listenerKeys.popstate,
    target: controller.windowRef,
    type: "popstate",
    handler: () => controller.queueSync(),
  });
  controller.listenerRegistry.register({
    key: controller.listenerKeys.click,
    target: controller.documentRef,
    type: "click",
    handler: controller.onDocumentClick,
  });
  controller.listenerRegistry.register({
    key: controller.listenerKeys.change,
    target: controller.documentRef,
    type: "change",
    handler: controller.onDocumentChange,
  });
  controller.listenerRegistry.register({
    key: controller.listenerKeys.keydown,
    target: controller.documentRef,
    type: "keydown",
    handler: controller.onDocumentKeydown,
  });
  if (controller.listenerKeys.pointerover) {
    controller.listenerRegistry.register({
      key: controller.listenerKeys.pointerover,
      target: controller.documentRef,
      type: "pointerover",
      handler: controller.onDocumentPointerover,
    });
  }
  if (controller.listenerKeys.pointerout) {
    controller.listenerRegistry.register({
      key: controller.listenerKeys.pointerout,
      target: controller.documentRef,
      type: "pointerout",
      handler: controller.onDocumentPointerout,
    });
  }
  if (controller.listenerKeys.focusin) {
    controller.listenerRegistry.register({
      key: controller.listenerKeys.focusin,
      target: controller.documentRef,
      type: "focusin",
      handler: controller.onDocumentFocusin,
    });
  }
  if (controller.listenerKeys.focusout) {
    controller.listenerRegistry.register({
      key: controller.listenerKeys.focusout,
      target: controller.documentRef,
      type: "focusout",
      handler: controller.onDocumentFocusout,
    });
  }
  controller.listenerRegistry.register({
    key: controller.listenerKeys.visibilitychange,
    target: controller.documentRef,
    type: "visibilitychange",
    handler: controller.onVisibilityChange,
  });
}

function mountShellLifecycle(controller) {
  if (controller.state.started) {
    controller.queueSync();
    return;
  }

  controller.state.started = true;
  controller.domGuards.ensureStyle(controller.styleId, controller.styleText);
  controller.onMounted();
  patchHistoryController(controller);
  controller.normalizeLegacyConfigPathIfNeeded();
  registerShellLifecycleListeners(controller);
  observeRootController(controller);
  controller.queueSync();
  controller.startAutoUpdateChecks();
  controller.refreshUpdateStatus({
    force: true,
    announce: false,
  });
}

function teardownShellLifecycle(controller) {
  controller.state.started = false;
  controller.state.activeSettingsFeatureKey = "";
  controller.state.shellNode = null;
  controller.state.renderSignature = "";
  controller.state.pendingManualUpdateCheck = null;
  controller.cancelQueuedSync();
  controller.clearNoticeTimer();
  controller.stopAutoUpdateChecks();
  controller.cancelUpdateCheck();
  controller.state.notice = { type: "", message: "" };
  controller.restoreContent();
  controller.onTeardown();

  if (typeof controller.observerRegistry?.disconnect === "function") {
    controller.observerRegistry.disconnect(controller.rootObserverKey);
  }
  if (typeof controller.listenerRegistry?.remove === "function") {
    Object.values(controller.listenerKeys).forEach((key) => controller.listenerRegistry.remove(key));
  }

  if (typeof controller.state.historyRestore === "function") {
    controller.state.historyRestore();
  }

  controller.removeNodeById(controller.documentRef, controller.menuItemId);
  controller.removeNodeById(controller.documentRef, controller.panelHostId);
  controller.removeNodeById(controller.documentRef, controller.styleId);
  controller.extraNodeIds.forEach((nodeId) => controller.removeNodeById(controller.documentRef, nodeId));
}

function bindShellRuntimeLifecycle(controller) {
  const offStarted =
    typeof controller.eventBus?.on === "function"
      ? controller.eventBus.on("runtime:started", () => mountShellLifecycle(controller))
      : () => {};
  const offStopped =
    typeof controller.eventBus?.on === "function"
      ? controller.eventBus.on("runtime:stopped", () => teardownShellLifecycle(controller))
      : () => {};
  const offConfigUpdated =
    typeof controller.eventBus?.on === "function"
      ? controller.eventBus.on("runtime:config-updated", () => {
        if (controller.state.started) {
          controller.queueSync();
        }
      })
      : () => {};
  const offFeatureToggled =
    typeof controller.eventBus?.on === "function"
      ? controller.eventBus.on("runtime:feature-toggled", () => {
        if (controller.state.started) {
          controller.queueSync();
        }
      })
      : () => {};

  if (controller.runtime.getSnapshot?.().started) {
    mountShellLifecycle(controller);
  }

  return function disposeLifecycleBindings() {
    offStarted();
    offStopped();
    offConfigUpdated();
    offFeatureToggled();
  };
}

function resolveOptionalFunction(value, fallback) {
  return typeof value === "function" ? value : fallback;
}

function buildShellLifecycleControllerContext(options = {}) {
  return {
    windowRef: options.windowRef || null,
    documentRef: options.documentRef || null,
    runtime: options.runtime || null,
    state: options.state || null,
    domGuards: options.domGuards || null,
    observerRegistry: options.observerRegistry || null,
    listenerRegistry: options.listenerRegistry || null,
    eventBus: options.eventBus || null,
    styleId: String(options.styleId || "").trim(),
    styleText: String(options.styleText || ""),
    extraNodeIds: Array.isArray(options.extraNodeIds) ? options.extraNodeIds : [],
    rootObserverKey: String(options.rootObserverKey || "").trim(),
    listenerKeys: options.listenerKeys || {},
    menuItemId: String(options.menuItemId || "").trim(),
    panelHostId: String(options.panelHostId || "").trim(),
    queueSync: resolveOptionalFunction(options.queueSync, () => {}),
    cancelQueuedSync: resolveOptionalFunction(options.cancelQueuedSync, () => {}),
    clearNoticeTimer: resolveOptionalFunction(options.clearNoticeTimer, () => {}),
    restoreContent: resolveOptionalFunction(options.restoreContent, () => {}),
    onMounted: resolveOptionalFunction(options.onMounted, () => {}),
    onTeardown: resolveOptionalFunction(options.onTeardown, () => {}),
    removeNodeById: resolveOptionalFunction(options.removeNodeById, () => {}),
    normalizeLegacyConfigPathIfNeeded:
      resolveOptionalFunction(options.normalizeLegacyConfigPathIfNeeded, () => false),
    onVisibilityChange: resolveOptionalFunction(options.onVisibilityChange, () => {}),
    onDocumentClick: resolveOptionalFunction(options.onDocumentClick, () => {}),
    onDocumentChange: resolveOptionalFunction(options.onDocumentChange, () => {}),
    onDocumentKeydown: resolveOptionalFunction(options.onDocumentKeydown, () => {}),
    onDocumentPointerover: resolveOptionalFunction(options.onDocumentPointerover, () => {}),
    onDocumentPointerout: resolveOptionalFunction(options.onDocumentPointerout, () => {}),
    onDocumentFocusin: resolveOptionalFunction(options.onDocumentFocusin, () => {}),
    onDocumentFocusout: resolveOptionalFunction(options.onDocumentFocusout, () => {}),
    startAutoUpdateChecks: resolveOptionalFunction(options.startAutoUpdateChecks, () => {}),
    stopAutoUpdateChecks: resolveOptionalFunction(options.stopAutoUpdateChecks, () => {}),
    refreshUpdateStatus: resolveOptionalFunction(options.refreshUpdateStatus, () => Promise.resolve()),
    isManagedNode: resolveOptionalFunction(options.isManagedNode, () => false),
    shouldScheduleMutationSync: resolveOptionalFunction(options.shouldScheduleMutationSync, () => true),
    cancelUpdateCheck: resolveOptionalFunction(options.cancelUpdateCheck, () => {}),
  };
}

export function createShellLifecycleController(options = {}) {
  const controller = buildShellLifecycleControllerContext(options);

  return {
    bindRuntimeLifecycle: () => bindShellRuntimeLifecycle(controller),
    mount: () => mountShellLifecycle(controller),
    observeRoot: () => observeRootController(controller),
    patchHistory: () => patchHistoryController(controller),
    teardown: () => teardownShellLifecycle(controller),
  };
}
