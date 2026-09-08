import { createManagedNodeMatcher, hasExternalDomMutation } from "../../../core/dom-mutation-filter.js";
import { createFeatureMountHarness } from "../../shared/feature-mount-harness.js";
import { isThemeGameContextActive } from "./theme-utils.js";

export function mountGlobalMatchStyle(context = {}, options = {}) {
  const documentRef = context.documentRef || (typeof document !== "undefined" ? document : null);
  const windowRef = context.windowRef || (globalThis.window !== undefined ? globalThis.window : null);
  const domGuards = context.domGuards || null;
  const config = context.config || null;
  const featureKey = String(options.featureKey || "");
  const configKey = String(options.configKey || "");
  const styleId = String(options.styleId || "");
  const buildStyleText = options.buildStyleText;

  if (!documentRef || !domGuards || !featureKey || !configKey || !styleId || typeof buildStyleText !== "function") {
    return () => {};
  }

  const removeStyle = () => domGuards.removeNodeById(styleId);
  const harness = createFeatureMountHarness(context, {
    isSupported: ({ documentRef: nextDocumentRef }) => Boolean(nextDocumentRef && domGuards),
    update: () => {
      const featureConfig = typeof config?.getFeatureConfig === "function"
        ? config.getFeatureConfig(configKey)
        : null;
      if (!featureConfig?.enabled || !isThemeGameContextActive({ documentRef, windowRef })) {
        removeStyle();
        return;
      }
      const cssText = buildStyleText(featureConfig);
      if (!cssText) {
        removeStyle();
        return;
      }
      const styleNode = domGuards.ensureStyle(styleId, cssText);
      if (styleNode?.parentNode && typeof styleNode.parentNode.appendChild === "function") {
        styleNode.parentNode.appendChild(styleNode);
      }
    },
  });
  if (!harness) {
    return () => {};
  }

  const isManagedNode = createManagedNodeMatcher({ ids: [styleId] });
  harness.registerObserver({
    key: `${featureKey}:dom-observer`,
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
      attributeFilter: ["class", "style"],
    },
  });
  harness.registerListeners([
    {
      key: `${featureKey}:popstate`,
      target: windowRef,
      type: "popstate",
      handler: () => harness.schedule(),
    },
    {
      key: `${featureKey}:hashchange`,
      target: windowRef,
      type: "hashchange",
      handler: () => harness.schedule(),
    },
  ]);
  harness.subscribeToGameState();
  harness.schedule();
  return harness.createCleanup(removeStyle);
}
