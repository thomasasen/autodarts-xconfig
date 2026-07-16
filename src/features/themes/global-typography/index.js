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
    configKey: "themes.gotcha",
    variantName: "gotcha",
    matchMode: "equals",
  }),
  Object.freeze({
    configKey: "themes.x01TwoPlayer",
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

    if (typeof styleNode.remove === "function") {
      styleNode.remove();
    }
  });
}

export function resolveThemeGlobalTypographyActiveTheme(options = {}) {
  const config = options.config || null;
  const gameState = options.gameState || null;
  const documentRef = options.documentRef || null;
  const windowRef = options.windowRef || null;
  const enabledThemeConfigKeys =
    options.enabledThemeConfigKeys instanceof Set
      ? options.enabledThemeConfigKeys
      : null;

  if (!isThemeGameContextActive({ documentRef, windowRef })) {
    return null;
  }

  return THEME_GLOBAL_TYPOGRAPHY_THEME_CONTEXTS.find((themeContext) => {
    const themeEnabled = enabledThemeConfigKeys
      ? enabledThemeConfigKeys.has(themeContext.configKey)
      : isThemeConfigEnabled(config, themeContext.configKey);
    if (!themeEnabled) {
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
  const windowRef = context.windowRef || (globalThis.window !== undefined ? globalThis.window : null);
  const domGuards = context.domGuards || null;
  const config = context.config || null;

  if (!documentRef || !domGuards) {
    return () => {};
  }

  let cachedConfigRevision = null;
  let cachedFeatureConfig = null;
  let cachedCssText = "";
  let cachedEnabledThemeConfigKeys = null;

  function readTypographyConfig() {
    const revision =
      config && typeof config.getRevision === "function"
        ? Number(config.getRevision())
        : Number.NaN;
    if (
      Number.isFinite(revision) &&
      revision === cachedConfigRevision &&
      cachedFeatureConfig
    ) {
      return {
        featureConfig: cachedFeatureConfig,
        cssText: cachedCssText,
        enabledThemeConfigKeys: cachedEnabledThemeConfigKeys,
      };
    }

    const featureConfig =
      config && typeof config.getFeatureConfig === "function"
        ? config.getFeatureConfig(CONFIG_KEY)
        : null;
    const cssText = featureConfig?.enabled
      ? buildThemeGlobalTypographyStyleText(featureConfig)
      : "";
    const enabledThemeConfigKeys = new Set(
      THEME_GLOBAL_TYPOGRAPHY_THEME_CONTEXTS
        .filter((themeContext) => isThemeConfigEnabled(config, themeContext.configKey))
        .map((themeContext) => themeContext.configKey)
    );
    if (Number.isFinite(revision)) {
      cachedConfigRevision = revision;
      cachedFeatureConfig = featureConfig;
      cachedCssText = cssText;
      cachedEnabledThemeConfigKeys = enabledThemeConfigKeys;
    }
    return { featureConfig, cssText, enabledThemeConfigKeys };
  }

  function removeStyle() {
    domGuards.removeNodeById(STYLE_ID);
    removeToolsShadowStyles(documentRef);
  }

  const harness = createFeatureMountHarness(context, {
    isSupported: ({ documentRef: nextDocumentRef }) => Boolean(nextDocumentRef && domGuards),
    update: () => {
      const { featureConfig, cssText, enabledThemeConfigKeys } = readTypographyConfig();

      if (!featureConfig?.enabled) {
        removeStyle();
        return;
      }

      if (!resolveThemeGlobalTypographyActiveTheme({
        config,
        gameState: context.gameState,
        documentRef,
        windowRef,
        enabledThemeConfigKeys,
      })) {
        removeStyle();
        return;
      }

      if (!cssText) {
        removeStyle();
        return;
      }

      const styleNode = domGuards.ensureStyle(STYLE_ID, cssText);
      if (styleNode?.parentNode && typeof styleNode.parentNode.appendChild === "function") {
        styleNode.parentNode.appendChild(styleNode);
      }
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
      attributeFilter: ["class", "style"],
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
