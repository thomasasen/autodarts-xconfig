import { createManagedNodeMatcher, hasExternalDomMutation } from "../../../core/dom-mutation-filter.js";
import { createFeatureMountHarness } from "../../shared/feature-mount-harness.js";
import {
  isThemeGameContextActive,
  isThemeVariantActive,
} from "../shared/theme-utils.js";
import {
  STYLE_ID,
  TOOLS_SHADOW_STYLE_ID,
  buildThemeGlobalTypographyStyleText,
} from "./style.js";

const FEATURE_KEY = "theme-global-typography";
const CONFIG_KEY = "themes.globalTypography";
const OBSERVER_KEY = `${FEATURE_KEY}:dom-observer`;
const POPSTATE_LISTENER_KEY = `${FEATURE_KEY}:popstate`;
const HASHCHANGE_LISTENER_KEY = `${FEATURE_KEY}:hashchange`;
const RESIZE_LISTENER_KEY = `${FEATURE_KEY}:resize`;
const TOOLS_HOST_SELECTOR = "autodarts-tools-wxt";

export const THEME_GLOBAL_TYPOGRAPHY_THEME_CONTEXTS = Object.freeze([
  Object.freeze({
    configKey: "themes.x01",
    variantName: "x01",
    matchMode: "equals",
  }),
  Object.freeze({
    configKey: "themes.shanghai",
    variantName: "shanghai",
    matchMode: "equals",
  }),
  Object.freeze({
    configKey: "themes.bermuda",
    variantName: "bermuda",
    matchMode: "equals",
  }),
  Object.freeze({
    configKey: "themes.cricket",
    variantName: "cricket",
    matchMode: "equals",
  }),
  Object.freeze({
    configKey: "themes.bullOff",
    variantName: "bull-off",
    matchMode: "equals",
  }),
]);

function isThemeConfigEnabled(configRef, configKey) {
  if (!configRef || typeof configRef.isFeatureEnabled !== "function") {
    return false;
  }
  return configRef.isFeatureEnabled(configKey);
}

function queryToolsHosts(documentRef) {
  if (!documentRef || typeof documentRef.querySelectorAll !== "function") {
    return [];
  }

  try {
    return Array.from(documentRef.querySelectorAll(TOOLS_HOST_SELECTOR));
  } catch (_) {
    return [];
  }
}

function getShadowNodeById(shadowRoot, nodeId) {
  if (!shadowRoot || !nodeId) {
    return null;
  }

  if (typeof shadowRoot.getElementById === "function") {
    return shadowRoot.getElementById(nodeId);
  }

  if (typeof shadowRoot.querySelector === "function") {
    try {
      return shadowRoot.querySelector(`#${nodeId}`);
    } catch (_) {
      return null;
    }
  }

  return null;
}

function ensureToolsShadowStyle(documentRef, cssText) {
  if (!documentRef || !cssText || typeof documentRef.createElement !== "function") {
    return;
  }

  queryToolsHosts(documentRef).forEach((host) => {
    const shadowRoot = host?.shadowRoot || null;
    if (!shadowRoot || typeof shadowRoot.appendChild !== "function") {
      return;
    }

    let styleNode = getShadowNodeById(shadowRoot, TOOLS_SHADOW_STYLE_ID);
    if (!styleNode) {
      styleNode = documentRef.createElement("style");
      styleNode.id = TOOLS_SHADOW_STYLE_ID;
      shadowRoot.appendChild(styleNode);
    }

    if (styleNode.textContent !== cssText) {
      styleNode.textContent = cssText;
    }
  });
}

function removeToolsShadowStyles(documentRef) {
  queryToolsHosts(documentRef).forEach((host) => {
    const shadowRoot = host?.shadowRoot || null;
    const styleNode = getShadowNodeById(shadowRoot, TOOLS_SHADOW_STYLE_ID);
    if (!styleNode) {
      return;
    }

    if (styleNode.parentNode && typeof styleNode.parentNode.removeChild === "function") {
      styleNode.parentNode.removeChild(styleNode);
      return;
    }

    if (shadowRoot && typeof shadowRoot.removeChild === "function") {
      shadowRoot.removeChild(styleNode);
    }
  });
}

export function resolveThemeGlobalTypographyActiveTheme(options = {}) {
  const config = options.config || null;
  const gameState = options.gameState || null;
  const documentRef = options.documentRef || null;
  const windowRef = options.windowRef || null;

  if (!isThemeGameContextActive({ documentRef, windowRef })) {
    return null;
  }

  return THEME_GLOBAL_TYPOGRAPHY_THEME_CONTEXTS.find((themeContext) => {
    if (!isThemeConfigEnabled(config, themeContext.configKey)) {
      return false;
    }

    return isThemeVariantActive({
      ...themeContext,
      gameState,
      documentRef,
      windowRef,
    });
  }) || null;
}

export function mountThemeGlobalTypography(context = {}) {
  const documentRef = context.documentRef || (typeof document !== "undefined" ? document : null);
  const windowRef = context.windowRef || (typeof window !== "undefined" ? window : null);
  const domGuards = context.domGuards || null;
  const config = context.config || null;

  if (!documentRef || !domGuards) {
    return () => {};
  }

  function removeStyle() {
    domGuards.removeNodeById(STYLE_ID);
    removeToolsShadowStyles(documentRef);
  }

  const harness = createFeatureMountHarness(context, {
    isSupported: ({ documentRef: nextDocumentRef }) => Boolean(nextDocumentRef && domGuards),
    update: () => {
      const featureConfig =
        config && typeof config.getFeatureConfig === "function"
          ? config.getFeatureConfig(CONFIG_KEY)
          : null;

      if (!featureConfig?.enabled) {
        removeStyle();
        return;
      }

      if (!resolveThemeGlobalTypographyActiveTheme({
        config,
        gameState: context.gameState,
        documentRef,
        windowRef,
      })) {
        removeStyle();
        return;
      }

      const cssText = buildThemeGlobalTypographyStyleText(featureConfig);
      if (!cssText) {
        removeStyle();
        return;
      }

      domGuards.ensureStyle(STYLE_ID, cssText);
      ensureToolsShadowStyle(documentRef, cssText);
    },
  });
  if (!harness) {
    return () => {};
  }

  const isManagedNode = createManagedNodeMatcher({
    ids: [STYLE_ID],
  });

  harness.registerObserver({
    key: OBSERVER_KEY,
    callback: (mutations = []) => {
      if (!hasExternalDomMutation(mutations, isManagedNode)) {
        return;
      }
      harness.schedule();
    },
    observeOptions: {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
    },
  });

  harness.registerListeners([
    {
      key: POPSTATE_LISTENER_KEY,
      target: windowRef,
      type: "popstate",
      handler: () => harness.schedule(),
    },
    {
      key: HASHCHANGE_LISTENER_KEY,
      target: windowRef,
      type: "hashchange",
      handler: () => harness.schedule(),
    },
    {
      key: RESIZE_LISTENER_KEY,
      target: windowRef,
      type: "resize",
      handler: () => harness.schedule(),
    },
  ]);

  harness.subscribeToGameState();
  harness.schedule();

  return harness.createCleanup(() => {
    removeStyle();
  });
}

export const initializeThemeGlobalTypography = mountThemeGlobalTypography;
export const initialize = mountThemeGlobalTypography;
export const mount = mountThemeGlobalTypography;
