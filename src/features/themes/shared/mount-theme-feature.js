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
  hasBoardLayoutHookMutation,
  hasBoardInputModeMutation,
  updateBoardLayoutHooks,
} from "./board-layout-resolver.js";
import { THEME_LAYOUT_HOOK_CLASSES } from "./theme-layout-contract.js";
import { resolveThemePolicy } from "./theme-policies.js";
import { resolveThemeVisualSettingsConfig } from "./theme-visuals.js";

export {
  CRICKET_ACTIVE_PLAYER_ATTRIBUTE,
  THEME_CRICKET_READABILITY,
  THEME_LAYOUT_HOOK_CLASSES,
} from "./theme-layout-contract.js";
export {
  resolveThemeBoardCanvasTarget,
  selectWidestContentLayoutCandidate,
} from "./board-layout-resolver.js";

function readThemeConfigs(config, configKey) {
  return {
    featureConfig:
      config && typeof config.getFeatureConfig === "function"
        ? config.getFeatureConfig(configKey)
        : {},
    globalTypographyConfig:
      config && typeof config.getFeatureConfig === "function"
        ? config.getFeatureConfig("themes.globalTypography")
        : {},
  };
}

function createThemeLifecycleContext(options = {}) {
  return {
    config: options.config,
    documentRef: options.documentRef,
    featureConfig: options.featureConfig,
    gameState: options.gameState,
    runtimeContext: options.runtimeContext,
    scheduler: options.scheduler,
    themePolicy: options.themePolicy,
    themeState: options.themeState,
    windowRef: options.windowRef,
  };
}

function isThemeContextSupported(isSupportedContext, lifecycleContext) {
  if (typeof isSupportedContext !== "function") {
    return true;
  }
  return isSupportedContext(lifecycleContext) === true;
}

function resolveThemeCssText(buildThemeCss, featureConfig, globalTypographyConfig) {
  return String(
    buildThemeCss(featureConfig, {
      globalTypographyConfig,
      visualConfig: resolveThemeVisualSettingsConfig(featureConfig, globalTypographyConfig),
    }) || ""
  ).trim();
}

function createLayoutHookRecheckController(windowRef, onRecheck) {
  let pendingLayoutHookRecheckHandle = 0;
  let pendingLayoutHookRecheckSignature = "";

  function clear() {
    if (pendingLayoutHookRecheckHandle && typeof windowRef?.clearTimeout === "function") {
      windowRef.clearTimeout(pendingLayoutHookRecheckHandle);
    }
    pendingLayoutHookRecheckHandle = 0;
    pendingLayoutHookRecheckSignature = "";
  }

  function schedule(result = {}) {
    const delayMs = Math.max(0, Number(result?.recheckDelayMs) || 0);
    if (!(delayMs > 0) || typeof windowRef?.setTimeout !== "function") {
      clear();
      return;
    }

    const signature = [
      String(result?.status || ""),
      Math.max(1, Math.round(delayMs)),
      String(windowRef?.location?.pathname || ""),
      String(windowRef?.location?.hash || ""),
    ].join("::");
    if (pendingLayoutHookRecheckHandle && pendingLayoutHookRecheckSignature === signature) {
      return;
    }

    clear();
    pendingLayoutHookRecheckSignature = signature;
    pendingLayoutHookRecheckHandle = windowRef.setTimeout(() => {
      pendingLayoutHookRecheckHandle = 0;
      pendingLayoutHookRecheckSignature = "";
      onRecheck?.();
    }, delayMs);
  }

  return {
    clear,
    schedule,
  };
}

function deactivateThemeFeature(options = {}) {
  options.layoutHookRecheck?.clear?.();
  options.domGuards?.removeNodeById?.(options.styleId);
  togglePreviewSpace(options.documentRef, options.resolvedPreviewPlacement, false);
  clearBoardLayoutHooks(options.themeState);

  if (options.themePolicy && typeof options.themePolicy.onDeactivate === "function") {
    options.themePolicy.onDeactivate({
      documentRef: options.documentRef,
      gameState: options.gameState,
      themeState: options.themeState,
      windowRef: options.windowRef,
      runtimeContext: options.runtimeContext,
    });
  }
}

export function mountThemeFeature(context = {}, options = {}) {
  const documentRef = context.documentRef || (typeof document !== "undefined" ? document : null);
  const windowRef = context.windowRef || (typeof globalThis.window !== "undefined" ? globalThis.window : null);
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
  const isSupportedContext =
    typeof options.isSupportedContext === "function"
      ? options.isSupportedContext
      : null;
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
  let scheduler = null;
  const layoutHookRecheck = createLayoutHookRecheckController(windowRef, () => scheduler?.schedule?.());

  function evaluateThemeState() {
    const { featureConfig, globalTypographyConfig } = readThemeConfigs(config, configKey);

    const isActive = isThemeVariantActive({
      variantName,
      matchMode,
      gameState,
      windowRef,
      documentRef,
    });

    const lifecycleContext = createThemeLifecycleContext({
      config,
      documentRef,
      featureConfig,
      gameState,
      runtimeContext: context,
      themePolicy,
      themeState,
      windowRef,
    });
    if (!isActive || !isThemeContextSupported(isSupportedContext, lifecycleContext)) {
      deactivateThemeFeature({
        documentRef,
        domGuards,
        gameState,
        layoutHookRecheck,
        resolvedPreviewPlacement,
        runtimeContext: context,
        styleId,
        themePolicy,
        themeState,
        windowRef,
      });
      return;
    }

    const cssText = resolveThemeCssText(buildThemeCss, featureConfig, globalTypographyConfig);
    if (!cssText) {
      deactivateThemeFeature({
        documentRef,
        domGuards,
        gameState,
        layoutHookRecheck,
        resolvedPreviewPlacement,
        runtimeContext: context,
        styleId,
        themePolicy,
        themeState,
        windowRef,
      });
      return;
    }

    domGuards.ensureStyle(styleId, cssText);
    const previewSpaceEnabled = isPreviewPlacementEnabled(
      documentRef,
      previewPlacement,
      windowRef
    );
    togglePreviewSpace(documentRef, resolvedPreviewPlacement, previewSpaceEnabled);
    const layoutResult = updateBoardLayoutHooks(documentRef, themeState);
    if (layoutResult?.retained) {
      layoutHookRecheck.schedule(layoutResult);
    } else {
      layoutHookRecheck.clear();
    }

    if (themePolicy && typeof themePolicy.onActivate === "function") {
      themePolicy.onActivate({
        ...lifecycleContext,
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
  scheduler =
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
          !hasBoardLayoutHookMutation(mutations, themeState) &&
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
    deactivateThemeFeature({
      documentRef,
      domGuards,
      gameState,
      layoutHookRecheck,
      resolvedPreviewPlacement,
      runtimeContext: context,
      styleId,
      themePolicy,
      themeState,
      windowRef,
    });

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
