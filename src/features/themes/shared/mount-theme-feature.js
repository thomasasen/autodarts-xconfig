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
import {
  BOARD_CONTROLS_MIRROR_GROUP_CLASS,
  BOARD_CONTROLS_PORTAL_CLASS,
  cleanupBoardControlsPortal,
  syncBoardControlsPortal,
} from "./board-controls-portal.js";
import { THEME_LAYOUT_HOOK_CLASSES } from "./theme-layout-contract.js";
import { resolveThemePolicy } from "./theme-policies.js";
import { resolveThemeVisualSettingsConfig } from "./theme-visuals.js";
import {
  cleanupToolsAnimationGifContainment,
  syncToolsAnimationGifContainment,
} from "./tools-animation-gif-containment.js";

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

function resolveThemeRuntimeContext(context = {}) {
  return {
    documentRef: context.documentRef || (typeof document !== "undefined" ? document : null),
    windowRef: context.windowRef || (globalThis.window !== undefined ? globalThis.window : null),
    domGuards: context.domGuards,
    gameState: context.gameState,
    config: context.config,
    observerRegistry: context.registries?.observers,
    listenerRegistry: context.registries?.listeners,
  };
}

function resolveThemeMountOptions(options = {}) {
  const featureKey = String(options.featureKey || "").trim();
  const configKey = String(options.configKey || "").trim();
  const styleId = String(options.styleId || "").trim();
  const variantName = String(options.variantName || "").trim();
  const matchMode = String(options.matchMode || "equals").trim().toLowerCase();
  const previewPlacement = options.previewPlacement || {};
  const previewSpaceClass = String(
    previewPlacement.previewSpaceClass || PREVIEW_SPACE_CLASS
  ).trim();

  return {
    buildThemeCss:
      typeof options.buildThemeCss === "function"
        ? options.buildThemeCss
        : () => "",
    configKey,
    featureKey,
    isSupportedContext:
      typeof options.isSupportedContext === "function"
        ? options.isSupportedContext
        : null,
    matchMode,
    previewPlacement,
    previewSpaceClass,
    resolvedPreviewPlacement: {
      ...previewPlacement,
      previewSpaceClass,
    },
    styleId,
    themePolicy: resolveThemePolicy({
      ...options,
      featureKey,
      configKey,
    }),
    variantName,
  };
}

function createThemeState(themePolicy) {
  return {
    lifecycleActive: null,
    configRevisionCache: null,
    layoutHookTargets: {},
    boardControlsPortal: null,
    ...(themePolicy && typeof themePolicy.createState === "function" ? themePolicy.createState() : {}),
  };
}

const THEME_VARIANT_SELECTOR = "#ad-ext-game-variant";
const THEME_MATCH_SURFACE_SELECTOR = ["#ad-ext-player-display", "#ad-ext-turn"].join(",");

function nodeIsOrContainsSelector(node, selector) {
  const elementNode = Number(node?.nodeType) === 3 ? node?.parentNode || null : node;
  if (!elementNode || typeof elementNode !== "object" || !selector) {
    return false;
  }

  try {
    if (typeof elementNode.matches === "function" && elementNode.matches(selector)) {
      return true;
    }
    return Boolean(
      typeof elementNode.querySelector === "function" &&
      elementNode.querySelector(selector)
    );
  } catch (_) {
    return false;
  }
}

function nodeTouchesVariantMarker(node) {
  const elementNode = Number(node?.nodeType) === 3 ? node?.parentNode || null : node;
  if (!elementNode || typeof elementNode !== "object") {
    return false;
  }

  try {
    return Boolean(
      nodeIsOrContainsSelector(elementNode, THEME_VARIANT_SELECTOR) ||
      elementNode.closest?.(THEME_VARIANT_SELECTOR)
    );
  } catch (_) {
    return false;
  }
}

function hasThemeActivationMutation(mutations = []) {
  if (!Array.isArray(mutations) || mutations.length === 0) {
    return true;
  }

  return mutations.some((mutation) => {
    if (nodeTouchesVariantMarker(mutation?.target || null)) {
      return true;
    }

    return [
      ...Array.from(mutation?.addedNodes || []),
      ...Array.from(mutation?.removedNodes || []),
    ].some((node) => {
      return (
        nodeTouchesVariantMarker(node) ||
        nodeIsOrContainsSelector(node, THEME_MATCH_SURFACE_SELECTOR)
      );
    });
  });
}

function resolveManagedThemeClassNames(previewSpaceClass, themePolicy, themeState) {
  return Array.from(
    new Set(
      [
        previewSpaceClass,
        BOARD_CONTROLS_PORTAL_CLASS,
        BOARD_CONTROLS_MIRROR_GROUP_CLASS,
        ...Object.values(THEME_LAYOUT_HOOK_CLASSES),
        ...(
          themePolicy && typeof themePolicy.getManagedClassNames === "function"
            ? themePolicy.getManagedClassNames(themeState)
            : []
        ),
      ].filter(Boolean)
    )
  );
}

function resolveManagedThemeNodeIds(styleId, themePolicy, themeState) {
  return [
    styleId,
    ...(
      themePolicy && typeof themePolicy.getManagedNodeIds === "function"
        ? themePolicy.getManagedNodeIds(themeState)
        : []
    ),
  ].filter(Boolean);
}

function resolveObservedThemeAttributeFilter(themePolicy, themeState) {
  return Array.from(
    new Set([
      ...BOARD_INPUT_MODE_ATTRIBUTE_FILTER,
      ...(
        themePolicy && typeof themePolicy.getObservedAttributeFilter === "function"
          ? themePolicy.getObservedAttributeFilter(themeState)
          : []
      ),
    ])
  );
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

function readConfigRevision(config) {
  if (!config || typeof config.getRevision !== "function") {
    return null;
  }
  const revision = Number(config.getRevision());
  return Number.isFinite(revision) ? revision : null;
}

function readCachedThemeConfigs(options = {}) {
  const revision = readConfigRevision(options.config);
  const cached = options.themeState?.configRevisionCache || null;
  if (revision !== null && cached?.revision === revision) {
    return cached;
  }

  const configs = readThemeConfigs(options.config, options.configKey);
  const nextCache = {
    revision,
    ...configs,
    cssText: null,
  };
  if (options.themeState && revision !== null) {
    options.themeState.configRevisionCache = nextCache;
  }
  return nextCache;
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
  if (!options.force && options.themeState?.lifecycleActive === false) {
    return;
  }
  if (options.themeState) {
    options.themeState.lifecycleActive = false;
  }
  options.layoutHookRecheck?.clear?.();
  options.domGuards?.removeNodeById?.(options.styleId);
  togglePreviewSpace(options.documentRef, options.resolvedPreviewPlacement, false);
  cleanupBoardControlsPortal(options.themeState);
  clearBoardLayoutHooks(options.themeState);
  cleanupToolsAnimationGifContainment(options.themeState);

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

function createThemeStateEvaluator(options = {}) {
  return function evaluateThemeState() {
    const isActive = isThemeVariantActive({
      variantName: options.variantName,
      matchMode: options.matchMode,
      gameState: options.gameState,
      windowRef: options.windowRef,
      documentRef: options.documentRef,
    });

    if (!isActive) {
      deactivateThemeFeature(options);
      return;
    }

    const configCache = readCachedThemeConfigs(options);
    const { featureConfig, globalTypographyConfig } = configCache;

    const lifecycleContext = createThemeLifecycleContext({
      config: options.config,
      documentRef: options.documentRef,
      featureConfig,
      gameState: options.gameState,
      runtimeContext: options.runtimeContext,
      themePolicy: options.themePolicy,
      themeState: options.themeState,
      windowRef: options.windowRef,
    });
    if (!isThemeContextSupported(options.isSupportedContext, lifecycleContext)) {
      deactivateThemeFeature(options);
      return;
    }

    const cssText = configCache.cssText === null
      ? resolveThemeCssText(
          options.buildThemeCss,
          featureConfig,
          globalTypographyConfig
        )
      : configCache.cssText;
    if (configCache.revision !== null && configCache.cssText === null) {
      configCache.cssText = cssText;
    }
    if (!cssText) {
      deactivateThemeFeature(options);
      return;
    }

    options.themeState.lifecycleActive = true;
    options.domGuards.ensureStyle(options.styleId, cssText);
    const previewSpaceEnabled = isPreviewPlacementEnabled(
      options.documentRef,
      options.previewPlacement,
      options.windowRef
    );
    togglePreviewSpace(
      options.documentRef,
      options.resolvedPreviewPlacement,
      previewSpaceEnabled
    );
    const layoutResult = updateBoardLayoutHooks(options.documentRef, options.themeState);
    if (layoutResult?.retained) {
      options.layoutHookRecheck.schedule(layoutResult);
    } else {
      options.layoutHookRecheck.clear();
    }

    syncBoardControlsPortal({
      documentRef: options.documentRef,
      scheduler: options.schedulerRef.current,
      themeState: options.themeState,
      windowRef: options.windowRef,
    });

    if (options.themePolicy && typeof options.themePolicy.onActivate === "function") {
      options.themePolicy.onActivate({
        ...lifecycleContext,
        scheduler: options.schedulerRef.current,
      });
    }

    syncToolsAnimationGifContainment({
      documentRef: options.documentRef,
      scheduler: options.schedulerRef.current,
      themeState: options.themeState,
      windowRef: options.windowRef,
    });
  };
}

function createThemeMutationCallback(options = {}) {
  return function handleThemeMutations(mutations = []) {
    if (
      options.themeState?.lifecycleActive === false &&
      !hasThemeActivationMutation(mutations)
    ) {
      return;
    }

    const policyMutation = options.themePolicy &&
      typeof options.themePolicy.shouldScheduleMutation === "function" &&
      options.themePolicy.shouldScheduleMutation(mutations, {
        documentRef: options.documentRef,
        gameState: options.gameState,
        themeState: options.themeState,
        windowRef: options.windowRef,
      });

    if (
      !policyMutation &&
      !hasBoardLayoutHookMutation(mutations, options.themeState) &&
      !hasBoardInputModeMutation(mutations) &&
      !hasExternalDomMutation(mutations, options.isManagedNode)
    ) {
      return;
    }
    options.schedulerRef.current?.schedule?.();
  };
}

export function mountThemeFeature(context = {}, options = {}) {
  const {
    documentRef,
    windowRef,
    domGuards,
    gameState,
    config,
    observerRegistry,
    listenerRegistry,
  } = resolveThemeRuntimeContext(context);
  const {
    buildThemeCss,
    configKey,
    featureKey,
    isSupportedContext,
    matchMode,
    previewPlacement,
    previewSpaceClass,
    resolvedPreviewPlacement,
    styleId,
    themePolicy,
    variantName,
  } = resolveThemeMountOptions(options);

  if (!documentRef || !domGuards || !featureKey || !configKey || !styleId || !variantName) {
    return () => {};
  }

  const observerKey = `${featureKey}:theme-observer`;
  const resizeListenerKey = `${featureKey}:theme-resize`;
  const scrollListenerKey = `${featureKey}:theme-scroll`;
  const themeState = createThemeState(themePolicy);
  const schedulerRef = {
    current: null,
  };
  const layoutHookRecheck = createLayoutHookRecheckController(windowRef, () => {
    schedulerRef.current?.schedule?.();
  });
  const themeEvaluator = createThemeStateEvaluator({
    buildThemeCss,
    config,
    configKey,
    documentRef,
    domGuards,
    gameState,
    isSupportedContext,
    layoutHookRecheck,
    matchMode,
    previewPlacement,
    resolvedPreviewPlacement,
    runtimeContext: context,
    schedulerRef,
    styleId,
    themePolicy,
    themeState,
    variantName,
    windowRef,
  });

  const managedClassNames = resolveManagedThemeClassNames(
    previewSpaceClass,
    themePolicy,
    themeState
  );
  schedulerRef.current =
    context.helpers && typeof context.helpers.createRafScheduler === "function"
      ? context.helpers.createRafScheduler(themeEvaluator)
      : createRafScheduler(themeEvaluator, { windowRef });
  const isManagedNode = createManagedNodeMatcher({
    ids: resolveManagedThemeNodeIds(styleId, themePolicy, themeState),
    classNames: managedClassNames,
  });
  const observedAttributeFilter = resolveObservedThemeAttributeFilter(themePolicy, themeState);

  const rootNode = documentRef.documentElement || documentRef.body || documentRef;
  if (observerRegistry && typeof observerRegistry.registerMutationObserver === "function") {
    observerRegistry.registerMutationObserver({
      key: observerKey,
      target: rootNode,
      callback: createThemeMutationCallback({
        documentRef,
        gameState,
        isManagedNode,
        schedulerRef,
        themePolicy,
        themeState,
        windowRef,
      }),
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
    const scheduleActiveTheme = () => {
      if (themeState.lifecycleActive === true) {
        schedulerRef.current?.schedule?.();
      }
    };
    listenerRegistry.register({
      key: resizeListenerKey,
      target: windowRef,
      type: "resize",
      handler: scheduleActiveTheme,
    });

    listenerRegistry.register({
      key: scrollListenerKey,
      target: windowRef,
      type: "scroll",
      handler: scheduleActiveTheme,
      options: true,
    });
  }

  const unsubscribeGameState =
    gameState && typeof gameState.subscribe === "function"
      ? gameState.subscribe(() => schedulerRef.current?.schedule?.())
      : () => {};

  schedulerRef.current.schedule();

  let cleanedUp = false;
  return function cleanupThemeFeature() {
    if (cleanedUp) {
      return;
    }
    cleanedUp = true;

    schedulerRef.current.cancel();
    deactivateThemeFeature({
      documentRef,
      domGuards,
      gameState,
      force: true,
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
