export function createShellLifecycleController(options = {}) {
  const windowRef = options.windowRef || null;
  const documentRef = options.documentRef || null;
  const runtime = options.runtime || null;
  const state = options.state || null;
  const domGuards = options.domGuards || null;
  const observerRegistry = options.observerRegistry || null;
  const listenerRegistry = options.listenerRegistry || null;
  const eventBus = options.eventBus || null;
  const styleId = String(options.styleId || "").trim();
  const styleText = String(options.styleText || "");
  const extraNodeIds = Array.isArray(options.extraNodeIds) ? options.extraNodeIds : [];
  const rootObserverKey = String(options.rootObserverKey || "").trim();
  const listenerKeys = options.listenerKeys || {};
  const queueSync = typeof options.queueSync === "function" ? options.queueSync : () => {};
  const cancelQueuedSync =
    typeof options.cancelQueuedSync === "function" ? options.cancelQueuedSync : () => {};
  const clearNoticeTimer =
    typeof options.clearNoticeTimer === "function" ? options.clearNoticeTimer : () => {};
  const restoreContent =
    typeof options.restoreContent === "function" ? options.restoreContent : () => {};
  const removeNodeById =
    typeof options.removeNodeById === "function" ? options.removeNodeById : () => {};
  const normalizeLegacyConfigPathIfNeeded =
    typeof options.normalizeLegacyConfigPathIfNeeded === "function"
      ? options.normalizeLegacyConfigPathIfNeeded
      : () => false;
  const onVisibilityChange =
    typeof options.onVisibilityChange === "function" ? options.onVisibilityChange : () => {};
  const onDocumentClick =
    typeof options.onDocumentClick === "function" ? options.onDocumentClick : () => {};
  const onDocumentChange =
    typeof options.onDocumentChange === "function" ? options.onDocumentChange : () => {};
  const onDocumentKeydown =
    typeof options.onDocumentKeydown === "function" ? options.onDocumentKeydown : () => {};
  const startAutoUpdateChecks =
    typeof options.startAutoUpdateChecks === "function" ? options.startAutoUpdateChecks : () => {};
  const stopAutoUpdateChecks =
    typeof options.stopAutoUpdateChecks === "function" ? options.stopAutoUpdateChecks : () => {};
  const refreshUpdateStatus =
    typeof options.refreshUpdateStatus === "function" ? options.refreshUpdateStatus : () => Promise.resolve();
  const hasExternalDomMutation =
    typeof options.hasExternalDomMutation === "function" ? options.hasExternalDomMutation : () => true;
  const isManagedNode =
    typeof options.isManagedNode === "function" ? options.isManagedNode : () => false;

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
      key: rootObserverKey,
      target,
      callback: (mutations = []) => {
        if (!hasExternalDomMutation(mutations, isManagedNode)) {
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

  function mount() {
    if (state.started) {
      queueSync();
      return;
    }

    state.started = true;
    domGuards.ensureStyle(styleId, styleText);
    patchHistory();
    normalizeLegacyConfigPathIfNeeded();

    if (typeof listenerRegistry?.register === "function") {
      listenerRegistry.register({
        key: listenerKeys.popstate,
        target: windowRef,
        type: "popstate",
        handler: () => queueSync(),
      });
      listenerRegistry.register({
        key: listenerKeys.click,
        target: documentRef,
        type: "click",
        handler: onDocumentClick,
      });
      listenerRegistry.register({
        key: listenerKeys.change,
        target: documentRef,
        type: "change",
        handler: onDocumentChange,
      });
      listenerRegistry.register({
        key: listenerKeys.keydown,
        target: documentRef,
        type: "keydown",
        handler: onDocumentKeydown,
      });
      listenerRegistry.register({
        key: listenerKeys.visibilitychange,
        target: documentRef,
        type: "visibilitychange",
        handler: onVisibilityChange,
      });
    }

    observeRoot();
    queueSync();
    startAutoUpdateChecks();
    refreshUpdateStatus({
      force: true,
      announce: false,
    });
  }

  function teardown() {
    state.started = false;
    state.activeSettingsFeatureKey = "";
    state.shellNode = null;
    state.renderSignature = "";
    state.pendingManualUpdateCheck = null;
    cancelQueuedSync();
    clearNoticeTimer();
    stopAutoUpdateChecks();
    state.notice = { type: "", message: "" };
    restoreContent();

    if (typeof observerRegistry?.disconnect === "function") {
      observerRegistry.disconnect(rootObserverKey);
    }
    if (typeof listenerRegistry?.remove === "function") {
      Object.values(listenerKeys).forEach((key) => listenerRegistry.remove(key));
    }

    if (typeof state.historyRestore === "function") {
      state.historyRestore();
    }

    removeNodeById(documentRef, options.menuItemId);
    removeNodeById(documentRef, options.panelHostId);
    removeNodeById(documentRef, styleId);
    extraNodeIds.forEach((nodeId) => removeNodeById(documentRef, nodeId));
  }

  function bindRuntimeLifecycle() {
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

    return function disposeLifecycleBindings() {
      offStarted();
      offStopped();
      offConfigUpdated();
      offFeatureToggled();
    };
  }

  return {
    bindRuntimeLifecycle,
    mount,
    observeRoot,
    patchHistory,
    teardown,
  };
}
