import { createRafScheduler } from "../../../shared/raf-scheduler.js";
import {
  PREVIEW_SPACE_CLASS,
  isPreviewPlacementEnabled,
  isThemeVariantActive,
  togglePreviewSpace,
} from "./theme-utils.js";
import { createManagedNodeMatcher, hasExternalDomMutation } from "../../../core/dom-mutation-filter.js";
import { BOARD_INPUT_MODE_ATTRIBUTE_FILTER } from "../../../shared/board-input-mode.js";
import {
  clearBoardLayoutHooks,
  CRICKET_ACTIVE_PLAYER_ATTRIBUTE,
  THEME_LAYOUT_HOOK_CLASSES,
  THEME_CRICKET_READABILITY,
  hasBoardInputModeMutation,
  resolveThemeBoardCanvasTarget,
  selectWidestContentLayoutCandidate,
  updateBoardLayoutHooks,
} from "./board-layout-resolver.js";
import { resolveThemePolicy } from "./theme-policies.js";

export {
  THEME_LAYOUT_HOOK_CLASSES,
  CRICKET_ACTIVE_PLAYER_ATTRIBUTE,
  THEME_CRICKET_READABILITY,
  resolveThemeBoardCanvasTarget,
  selectWidestContentLayoutCandidate,
};

export function mountThemeFeature(context = {}, options = {}) {
  const documentRef = context.documentRef || (typeof document !== "undefined" ? document : null);
  const windowRef = context.windowRef || (typeof window !== "undefined" ? window : null);
  const domGuards = context.domGuards;
  const gameState = context.gameState;
  const config = context.config;
  const observerRegistry = context.registries?.observers;
  const listenerRegistry = context.registries?.listeners;

  const featureKey = String(options.featureKey || "").trim();
  const configKey = String(options.configKey || "").trim();
  const styleId = String(options.styleId || "").trim();
  const variantName = String(options.variantName || "").trim();
  const matchMode = String(options.matchMode || "equals").trim().toLowerCase();
  const previewPlacement = options.previewPlacement || {};
  const previewSpaceClass = String(
    previewPlacement.previewSpaceClass || PREVIEW_SPACE_CLASS
  ).trim();
  const resolvedPreviewPlacement = {
    ...previewPlacement,
    previewSpaceClass,
  };
  const buildThemeCss =
    typeof options.buildThemeCss === "function"
      ? options.buildThemeCss
      : () => "";
  const themePolicy = resolveThemePolicy({
    ...options,
    featureKey,
    configKey,
  });

  if (!documentRef || !domGuards || !featureKey || !configKey || !styleId || !variantName) {
    return () => {};
  }

  const observerKey = `${featureKey}:theme-observer`;
  const resizeListenerKey = `${featureKey}:theme-resize`;
  const scrollListenerKey = `${featureKey}:theme-scroll`;
  const themeState = {
    layoutHookTargets: {},
    ...(themePolicy && typeof themePolicy.createState === "function" ? themePolicy.createState() : {}),
  };

  function deactivateTheme() {
    domGuards.removeNodeById(styleId);
    togglePreviewSpace(documentRef, resolvedPreviewPlacement, false);
    clearBoardLayoutHooks(themeState);

    if (themePolicy && typeof themePolicy.onDeactivate === "function") {
      themePolicy.onDeactivate({
        documentRef,
        gameState,
        themeState,
        windowRef,
      });
    }
  }

  function evaluateThemeState() {
    const featureConfig =
      config && typeof config.getFeatureConfig === "function"
        ? config.getFeatureConfig(configKey)
        : {};

    const isActive = isThemeVariantActive({
      variantName,
      matchMode,
      gameState,
      windowRef,
      documentRef,
    });

    if (!isActive) {
      deactivateTheme();
      return;
    }

    const cssText = String(buildThemeCss(featureConfig) || "").trim();
    if (!cssText) {
      deactivateTheme();
      return;
    }

    domGuards.ensureStyle(styleId, cssText);
    const previewSpaceEnabled = isPreviewPlacementEnabled(
      documentRef,
      previewPlacement,
      windowRef
    );
    togglePreviewSpace(documentRef, resolvedPreviewPlacement, previewSpaceEnabled);
    updateBoardLayoutHooks(documentRef, themeState);

    if (themePolicy && typeof themePolicy.onActivate === "function") {
      themePolicy.onActivate({
        documentRef,
        gameState,
        themeState,
        windowRef,
        scheduler,
      });
    }
  }

  const managedClassNames = Array.from(
    new Set(
      [
        previewSpaceClass,
        ...Object.values(THEME_LAYOUT_HOOK_CLASSES),
        ...(
          themePolicy && typeof themePolicy.getManagedClassNames === "function"
            ? themePolicy.getManagedClassNames(themeState)
            : []
        ),
      ].filter(Boolean)
    )
  );
  const scheduler =
    context.helpers && typeof context.helpers.createRafScheduler === "function"
      ? context.helpers.createRafScheduler(evaluateThemeState)
      : createRafScheduler(evaluateThemeState, { windowRef });
  const isManagedNode = createManagedNodeMatcher({
    ids: [
      styleId,
      ...(
        themePolicy && typeof themePolicy.getManagedNodeIds === "function"
          ? themePolicy.getManagedNodeIds(themeState)
          : []
      ),
    ].filter(Boolean),
    classNames: managedClassNames,
  });
  const observedAttributeFilter = Array.from(
    new Set([
      ...BOARD_INPUT_MODE_ATTRIBUTE_FILTER,
      ...(
        themePolicy && typeof themePolicy.getObservedAttributeFilter === "function"
          ? themePolicy.getObservedAttributeFilter(themeState)
          : []
      ),
    ])
  );

  const rootNode = documentRef.documentElement || documentRef.body || documentRef;
  if (observerRegistry && typeof observerRegistry.registerMutationObserver === "function") {
    observerRegistry.registerMutationObserver({
      key: observerKey,
      target: rootNode,
      callback: (mutations = []) => {
        const policyMutation = themePolicy &&
          typeof themePolicy.shouldScheduleMutation === "function" &&
          themePolicy.shouldScheduleMutation(mutations, {
            documentRef,
            gameState,
            themeState,
            windowRef,
          });

        if (
          !policyMutation &&
          !hasBoardInputModeMutation(mutations) &&
          !hasExternalDomMutation(mutations, isManagedNode)
        ) {
          return;
        }
        scheduler.schedule();
      },
      observeOptions: {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeFilter: observedAttributeFilter,
      },
      MutationObserverRef: windowRef?.MutationObserver,
    });
  }

  if (listenerRegistry && windowRef && typeof windowRef === "object") {
    listenerRegistry.register({
      key: resizeListenerKey,
      target: windowRef,
      type: "resize",
      handler: () => scheduler.schedule(),
    });

    listenerRegistry.register({
      key: scrollListenerKey,
      target: windowRef,
      type: "scroll",
      handler: () => scheduler.schedule(),
      options: true,
    });
  }

  const unsubscribeGameState =
    gameState && typeof gameState.subscribe === "function"
      ? gameState.subscribe(() => scheduler.schedule())
      : () => {};

  scheduler.schedule();

  let cleanedUp = false;
  return function cleanupThemeFeature() {
    if (cleanedUp) {
      return;
    }
    cleanedUp = true;

    scheduler.cancel();
    deactivateTheme();

    try {
      unsubscribeGameState();
    } catch (_) {
      // Keep cleanup fail-soft.
    }

    if (observerRegistry && typeof observerRegistry.disconnect === "function") {
      observerRegistry.disconnect(observerKey);
    }

    if (listenerRegistry && typeof listenerRegistry.remove === "function") {
      listenerRegistry.remove(resizeListenerKey);
      listenerRegistry.remove(scrollListenerKey);
    }
  };
}
