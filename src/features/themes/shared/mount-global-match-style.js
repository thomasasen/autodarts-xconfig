import { createManagedNodeMatcher, hasExternalDomMutation } from "../../../core/dom-mutation-filter.js";
import { createFeatureMountHarness } from "../../shared/feature-mount-harness.js";
import { isThemeGameContextActive } from "./theme-utils.js";
import { maintainMatchStyleOrder } from "./match-style-order.js";
import { backgroundAssetKeys } from "../../../shared/theme-asset-selection.js";
import { resolveThemePresetAsset, ensureThemePresetAsset, subscribeThemePresetAssets } from "#theme-preset-assets";

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
  const requested = new Set();
  const harness = createFeatureMountHarness(context, {
    isSupported: ({ documentRef: nextDocumentRef }) => Boolean(nextDocumentRef && domGuards),
    update: () => {
      const featureConfig = typeof config?.getFeatureConfig === "function"
        ? config.getFeatureConfig(configKey)
        : null;
      const inMatch = isThemeGameContextActive({ documentRef, windowRef });
      const menuActive = options.allowMenu === true && featureConfig?.applyMenuBackground === true &&
        !String(windowRef?.location?.pathname || "").startsWith("/ad-xconfig") &&
        !String(windowRef?.location?.hash || "").toLowerCase().includes("ad-xconfig");
      if (!featureConfig?.enabled || (!inMatch && !menuActive)) {
        removeStyle();
        return;
      }
      const variant = String(gameStateVariant(context) || "");
      let backgroundContext = "game";
      if (!inMatch) backgroundContext = "menu";
      else if (/cricket|tactics/i.test(variant)) backgroundContext = "cricket";
      const keys = backgroundAssetKeys(featureConfig, { context: backgroundContext, portrait: windowRef?.innerHeight > windowRef?.innerWidth });
      const missing = keys.filter((key) => !resolveThemePresetAsset(key));
      if (missing.length) {
        for (const key of missing) if (!requested.has(key)) {
          requested.add(key);
          ensureThemePresetAsset(key).catch(() => {});
        }
        return; // Keep the previous stylesheet until its replacement is verified.
      }
      const cssText = buildStyleText({ ...featureConfig, backgroundContext });
      if (!cssText) {
        removeStyle();
        return;
      }
      const styleNode = domGuards.ensureStyle(styleId, cssText);
      maintainMatchStyleOrder(styleNode);
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
    { key: `${featureKey}:resize`, target: windowRef, type: "resize", handler: () => harness.schedule() },
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
  const unsubscribeAssets = subscribeThemePresetAssets((event) => { if (event.state === "ready") harness.schedule(); });
  harness.schedule();
  return harness.createCleanup(() => { unsubscribeAssets(); removeStyle(); });
}

function gameStateVariant(context) {
  const snapshot = context.gameState?.getSnapshot?.();
  return snapshot?.variant || snapshot?.match?.variant || snapshot?.match?.settings?.variant || "";
}
