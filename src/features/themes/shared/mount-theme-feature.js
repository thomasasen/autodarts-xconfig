import { createRafScheduler } from "../../../shared/raf-scheduler.js";
import {
  PREVIEW_SPACE_CLASS,
  isThemeVariantActive,
  togglePreviewSpace,
} from "./theme-utils.js";
import { createManagedNodeMatcher, hasExternalDomMutation } from "../../../core/dom-mutation-filter.js";
import { findBoardSvgGroup } from "../../../shared/dartboard-svg.js";

const THEME_LAYOUT_ROOT_ATTR = "data-ad-theme-layout-root";
const THEME_LAYOUT_ROOT_OWNER_ATTR = "data-ad-theme-layout-root-owner";
const THEME_SLOT_ATTR = "data-ad-theme-slot";
const THEME_SLOT_OWNER_ATTR = "data-ad-theme-slot-owner";

function getDirectChildContainer(rootNode, nestedNode) {
  if (!rootNode || !nestedNode) {
    return null;
  }

  let current = nestedNode;
  while (current && current.parentElement && current.parentElement !== rootNode) {
    current = current.parentElement;
  }

  return current && current.parentElement === rootNode ? current : null;
}

function resolveLayoutRoot(documentRef) {
  if (!documentRef || typeof documentRef.getElementById !== "function") {
    return null;
  }

  const turnNode = documentRef.getElementById("ad-ext-turn");
  const playersNode = documentRef.getElementById("ad-ext-player-display");
  if (!turnNode || !playersNode) {
    return null;
  }

  let cursor = turnNode.parentElement || null;
  while (cursor) {
    if (typeof cursor.contains === "function" && cursor.contains(playersNode)) {
      return cursor;
    }
    cursor = cursor.parentElement || null;
  }

  return null;
}

function resolveBoardSlot(layoutRoot, documentRef) {
  if (!layoutRoot || !documentRef) {
    return null;
  }

  const boardInfo = findBoardSvgGroup(documentRef);
  const boardSvgSlot = getDirectChildContainer(layoutRoot, boardInfo?.svg || boardInfo?.group || null);
  if (boardSvgSlot) {
    return boardSvgSlot;
  }

  const fallbackBoardNode =
    typeof layoutRoot.querySelector === "function"
      ? layoutRoot.querySelector('.css-1kejrvi, .css-14xtjvc, svg[viewBox="0 0 1000 1000"]')
      : null;
  const fallbackSlot = getDirectChildContainer(layoutRoot, fallbackBoardNode);
  if (fallbackSlot) {
    return fallbackSlot;
  }

  if (!Array.isArray(layoutRoot.children)) {
    return null;
  }

  return (
    layoutRoot.children.find((child) => {
      return (
        child &&
        typeof child.querySelector === "function" &&
        child.querySelector('svg[viewBox="0 0 1000 1000"]')
      );
    }) || null
  );
}

function clearOwnedLayoutSlots(documentRef, featureKey) {
  if (!documentRef || typeof documentRef.querySelectorAll !== "function" || !featureKey) {
    return;
  }

  const ownedSlots = Array.from(
    documentRef.querySelectorAll(`[${THEME_SLOT_OWNER_ATTR}="${featureKey}"]`)
  );
  ownedSlots.forEach((node) => {
    if (!node || typeof node.removeAttribute !== "function") {
      return;
    }
    node.removeAttribute(THEME_SLOT_ATTR);
    node.removeAttribute(THEME_SLOT_OWNER_ATTR);
  });

  const ownedRoots = Array.from(
    documentRef.querySelectorAll(`[${THEME_LAYOUT_ROOT_OWNER_ATTR}="${featureKey}"]`)
  );
  ownedRoots.forEach((node) => {
    if (!node || typeof node.removeAttribute !== "function") {
      return;
    }
    node.removeAttribute(THEME_LAYOUT_ROOT_ATTR);
    node.removeAttribute(THEME_LAYOUT_ROOT_OWNER_ATTR);
  });
}

function assignLayoutSlot(node, slotName, featureKey) {
  if (!node || typeof node.setAttribute !== "function" || !slotName || !featureKey) {
    return;
  }
  node.setAttribute(THEME_SLOT_ATTR, slotName);
  node.setAttribute(THEME_SLOT_OWNER_ATTR, featureKey);
}

function applyLayoutSlots(documentRef, featureKey) {
  clearOwnedLayoutSlots(documentRef, featureKey);

  const layoutRoot = resolveLayoutRoot(documentRef);
  if (!layoutRoot || typeof layoutRoot.setAttribute !== "function") {
    return;
  }

  layoutRoot.setAttribute(THEME_LAYOUT_ROOT_ATTR, "true");
  layoutRoot.setAttribute(THEME_LAYOUT_ROOT_OWNER_ATTR, featureKey);

  const turnNode = documentRef.getElementById("ad-ext-turn");
  const playersNode = documentRef.getElementById("ad-ext-player-display");
  const footerSlot = getDirectChildContainer(layoutRoot, turnNode);
  const playersSlot = getDirectChildContainer(layoutRoot, playersNode);
  const boardSlot = resolveBoardSlot(layoutRoot, documentRef);

  assignLayoutSlot(footerSlot, "footer", featureKey);
  assignLayoutSlot(playersSlot, "players", featureKey);
  assignLayoutSlot(boardSlot, "board", featureKey);
}

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

  function evaluateThemeState() {
    const featureConfig =
      config && typeof config.getFeatureConfig === "function"
        ? config.getFeatureConfig(configKey)
        : {};

    const isActive = isThemeVariantActive({
      variantName,
      matchMode,
      gameState,
      documentRef,
    });

    if (!isActive) {
      clearOwnedLayoutSlots(documentRef, featureKey);
      domGuards.removeNodeById(styleId);
      togglePreviewSpace(documentRef, previewPlacement, false);
      return;
    }

    const cssText = String(buildThemeCss(featureConfig) || "").trim();
    if (!cssText) {
      clearOwnedLayoutSlots(documentRef, featureKey);
      domGuards.removeNodeById(styleId);
      togglePreviewSpace(documentRef, previewPlacement, false);
      return;
    }

    applyLayoutSlots(documentRef, featureKey);
    domGuards.ensureStyle(styleId, cssText);
    togglePreviewSpace(documentRef, previewPlacement, true);
  }

  const scheduler =
    context.helpers && typeof context.helpers.createRafScheduler === "function"
      ? context.helpers.createRafScheduler(evaluateThemeState)
      : createRafScheduler(evaluateThemeState, { windowRef });
  const isManagedNode = createManagedNodeMatcher({
    ids: [styleId],
    classNames: [previewSpaceClass],
  });

  const rootNode = documentRef.documentElement || documentRef.body || documentRef;
  if (observerRegistry && typeof observerRegistry.registerMutationObserver === "function") {
    observerRegistry.registerMutationObserver({
      key: observerKey,
      target: rootNode,
      callback: (mutations = []) => {
        if (!hasExternalDomMutation(mutations, isManagedNode)) {
          return;
        }
        scheduler.schedule();
      },
      observeOptions: {
        childList: true,
        subtree: true,
        characterData: true,
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
    clearOwnedLayoutSlots(documentRef, featureKey);
    togglePreviewSpace(
      documentRef,
      { ...previewPlacement, previewSpaceClass },
      false
    );
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
