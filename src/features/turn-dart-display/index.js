import { createManagedNodeMatcher, hasExternalDomMutation } from "../../core/dom-mutation-filter.js";
import { createFeatureMountHarness } from "../shared/feature-mount-harness.js";
import { findModernTurnSurface } from "../shared/x01-match-surface.js";
import { isThemeGameContextActive } from "../themes/shared/theme-utils.js";
import {
  MODERN_TURN_DART_PLACEHOLDER_CLASS,
  MODERN_TURN_DART_ROW_CLASS,
  MODERN_TURN_DART_SURFACE_CLASS,
  TURN_DART_DISPLAY_STYLE_ID,
  buildTurnDartDisplayStyleText,
} from "./style.js";

const FEATURE_KEY = "turn-dart-display";
const CONFIG_KEY = "turnDartDisplay";
const MANAGED_CLASSES = Object.freeze([
  MODERN_TURN_DART_SURFACE_CLASS,
  MODERN_TURN_DART_ROW_CLASS,
  MODERN_TURN_DART_PLACEHOLDER_CLASS,
]);

function findModernDartPlaceholder(rowNode) {
  return Array.from(rowNode?.children || []).find((node) => {
    return node?.getAttribute?.("aria-hidden") === "true";
  }) || null;
}

export function mountTurnDartDisplay(context = {}) {
  const documentRef = context.documentRef || (typeof document !== "undefined" ? document : null);
  const windowRef = context.windowRef || (globalThis.window !== undefined ? globalThis.window : null);
  const domGuards = context.domGuards || null;
  const config = context.config || null;
  const managedNodes = new Map(MANAGED_CLASSES.map((className) => [className, new Set()]));

  if (!documentRef || !domGuards) {
    return () => {};
  }

  function syncManagedNodes(className, nextNodes = []) {
    const currentNodes = managedNodes.get(className);
    const nextNodeSet = new Set(nextNodes.filter(Boolean));

    currentNodes.forEach((node) => {
      if (!nextNodeSet.has(node)) {
        node?.classList?.remove?.(className);
      }
    });
    nextNodeSet.forEach((node) => node?.classList?.add?.(className));
    managedNodes.set(className, nextNodeSet);
  }

  function resetModernSurface() {
    MANAGED_CLASSES.forEach((className) => syncManagedNodes(className));
  }

  function syncModernSurface() {
    const surface = findModernTurnSurface(documentRef, windowRef);
    const rows = Array.from(surface?.throwRows || []);
    const placeholders = rows.map(findModernDartPlaceholder).filter(Boolean);

    syncManagedNodes(MODERN_TURN_DART_SURFACE_CLASS, surface?.turnContainer ? [surface.turnContainer] : []);
    syncManagedNodes(MODERN_TURN_DART_ROW_CLASS, rows);
    syncManagedNodes(MODERN_TURN_DART_PLACEHOLDER_CLASS, placeholders);
  }

  const removeFeatureArtifacts = () => {
    resetModernSurface();
    domGuards.removeNodeById(TURN_DART_DISPLAY_STYLE_ID);
  };
  const harness = createFeatureMountHarness(context, {
    resetTurn: resetModernSurface,
    isSupported: () => true,
    update: () => {
      const featureConfig = typeof config?.getFeatureConfig === "function"
        ? config.getFeatureConfig(CONFIG_KEY)
        : null;
      if (!featureConfig?.enabled || !isThemeGameContextActive({ documentRef, windowRef })) {
        removeFeatureArtifacts();
        return;
      }

      const cssText = buildTurnDartDisplayStyleText(featureConfig);
      if (!cssText) {
        removeFeatureArtifacts();
        return;
      }

      const styleNode = domGuards.ensureStyle(TURN_DART_DISPLAY_STYLE_ID, cssText);
      if (styleNode?.parentNode && typeof styleNode.parentNode.appendChild === "function") {
        styleNode.parentNode.appendChild(styleNode);
      }
      syncModernSurface();
    },
  });
  if (!harness) {
    return () => {};
  }

  const isManagedNode = createManagedNodeMatcher({
    ids: [TURN_DART_DISPLAY_STYLE_ID],
  });
  harness.registerObserver({
    key: `${FEATURE_KEY}:dom-observer`,
    callback: (mutations = []) => {
      if (hasExternalDomMutation(mutations, isManagedNode)) {
        harness.schedule();
      }
    },
    observeOptions: {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["class", "style", "aria-hidden"],
    },
  });
  harness.registerListeners([
    {
      key: `${FEATURE_KEY}:popstate`,
      target: windowRef,
      type: "popstate",
      handler: () => harness.schedule(),
    },
    {
      key: `${FEATURE_KEY}:hashchange`,
      target: windowRef,
      type: "hashchange",
      handler: () => harness.schedule(),
    },
  ]);
  harness.subscribeToGameState();
  harness.schedule();
  return harness.createCleanup(removeFeatureArtifacts);
}

export const initializeTurnDartDisplay = mountTurnDartDisplay;
export const initialize = mountTurnDartDisplay;
export const mount = mountTurnDartDisplay;
