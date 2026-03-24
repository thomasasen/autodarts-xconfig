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
  THEME_LAYOUT_HOOK_CLASSES,
  clearBoardLayoutHooks,
  hasBoardInputModeMutation,
  resolveThemeBoardCanvasTarget,
  selectWidestContentLayoutCandidate,
  updateBoardLayoutHooks,
} from "./board-layout-resolver.js";
import {
  CRICKET_ACTIVE_PLAYER_ATTRIBUTE,
  THEME_CRICKET_READABILITY,
  applyCricketReadabilityPolicy,
  clearCricketActivePlayerState,
  clearCricketReadabilityPolicy,
  createCricketReadabilityState,
  hasCricketPlayerStateMutation,
  syncCricketActivePlayerState,
} from "./cricket-readability.js";

export {
  THEME_LAYOUT_HOOK_CLASSES,
  CRICKET_ACTIVE_PLAYER_ATTRIBUTE,
  THEME_CRICKET_READABILITY,
  resolveThemeBoardCanvasTarget,
  selectWidestContentLayoutCandidate,
};

const CRICKET_THEME_FEATURE_KEY = "theme-cricket";

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
  const buildThemeCss =
    typeof options.buildThemeCss === "function"
      ? options.buildThemeCss
      : () => "";

  if (!documentRef || !domGuards || !featureKey || !configKey || !styleId || !variantName) {
    return () => {};
  }

  const observerKey = `${featureKey}:theme-observer`;
  const resizeListenerKey = `${featureKey}:theme-resize`;
  const scrollListenerKey = `${featureKey}:theme-scroll`;
  const isCricketTheme = featureKey === CRICKET_THEME_FEATURE_KEY;
  const themeState = {
    layoutHookTargets: {},
    cricketReadability: createCricketReadabilityState(),
  };

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
      domGuards.removeNodeById(styleId);
      togglePreviewSpace(documentRef, previewPlacement, false);
      clearBoardLayoutHooks(themeState);
      if (isCricketTheme) {
        clearCricketActivePlayerState(documentRef);
        clearCricketReadabilityPolicy(themeState);
      }
      return;
    }

    const cssText = String(buildThemeCss(featureConfig) || "").trim();
    if (!cssText) {
      domGuards.removeNodeById(styleId);
      togglePreviewSpace(documentRef, previewPlacement, false);
      clearBoardLayoutHooks(themeState);
      if (isCricketTheme) {
        clearCricketActivePlayerState(documentRef);
        clearCricketReadabilityPolicy(themeState);
      }
      return;
    }

    domGuards.ensureStyle(styleId, cssText);
    const previewSpaceEnabled = isPreviewPlacementEnabled(
      documentRef,
      previewPlacement,
      windowRef
    );
    togglePreviewSpace(documentRef, previewPlacement, previewSpaceEnabled);
    updateBoardLayoutHooks(documentRef, themeState);
    if (isCricketTheme) {
      syncCricketActivePlayerState(documentRef, gameState);
      applyCricketReadabilityPolicy(documentRef, themeState, scheduler);
    }
  }

  const readabilityManagedClassNames = isCricketTheme
    ? [
        THEME_CRICKET_READABILITY.noticeClass,
        THEME_CRICKET_READABILITY.noticeTextClass,
        THEME_CRICKET_READABILITY.toggleClass,
      ]
    : [];
  const managedClassNames = Array.from(
    new Set(
      [
        previewSpaceClass,
        ...Object.values(THEME_LAYOUT_HOOK_CLASSES),
        ...readabilityManagedClassNames,
      ].filter(Boolean)
    )
  );
  const scheduler =
    context.helpers && typeof context.helpers.createRafScheduler === "function"
      ? context.helpers.createRafScheduler(evaluateThemeState)
      : createRafScheduler(evaluateThemeState, { windowRef });
  const isManagedNode = createManagedNodeMatcher({
    ids: [styleId, isCricketTheme ? THEME_CRICKET_READABILITY.noticeId : ""].filter(Boolean),
    classNames: managedClassNames,
  });
  const observedAttributeFilter = Array.from(
    new Set([
      ...BOARD_INPUT_MODE_ATTRIBUTE_FILTER,
      ...(isCricketTheme ? ["class"] : []),
    ])
  );

  const rootNode = documentRef.documentElement || documentRef.body || documentRef;
  if (observerRegistry && typeof observerRegistry.registerMutationObserver === "function") {
    observerRegistry.registerMutationObserver({
      key: observerKey,
      target: rootNode,
      callback: (mutations = []) => {
        if (
          !(isCricketTheme && hasCricketPlayerStateMutation(mutations)) &&
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
    togglePreviewSpace(
      documentRef,
      { ...previewPlacement, previewSpaceClass },
      false
    );
    clearBoardLayoutHooks(themeState);
    if (isCricketTheme) {
      clearCricketActivePlayerState(documentRef);
      clearCricketReadabilityPolicy(themeState);
    }
    domGuards.removeNodeById(styleId);

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
