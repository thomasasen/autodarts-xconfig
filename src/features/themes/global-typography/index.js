import { createManagedNodeMatcher, hasExternalDomMutation } from "../../../core/dom-mutation-filter.js";
import { createFeatureMountHarness } from "../../shared/feature-mount-harness.js";
import { isThemeGameContextActive } from "../shared/theme-utils.js";
import { maintainMatchStyleOrder } from "../shared/match-style-order.js";
import { createPlayerGlowController } from "./player-glow.js";
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
    if (styleNode && String(styleNode.tagName).toLowerCase() !== "style") {
      styleNode.remove();
      styleNode = null;
    }
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
  const documentRef = options.documentRef || null;
  const windowRef = options.windowRef || null;
  return isThemeGameContextActive({ documentRef, windowRef })
    ? { configKey: CONFIG_KEY, variantName: "all" }
    : null;
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
      };
    }

    const featureConfig =
      config && typeof config.getFeatureConfig === "function"
        ? config.getFeatureConfig(CONFIG_KEY)
        : null;
    const cssText = featureConfig?.enabled
      ? buildThemeGlobalTypographyStyleText(featureConfig)
      : "";
    if (Number.isFinite(revision)) {
      cachedConfigRevision = revision;
      cachedFeatureConfig = featureConfig;
      cachedCssText = cssText;
    }
    return { featureConfig, cssText };
  }

  const glow = createPlayerGlowController(documentRef);
  function removeStyle() {
    glow.clear();
    domGuards.removeNodeById(STYLE_ID);
    removeToolsShadowStyles(documentRef);
  }

  function expectedStyleText() {
    const { featureConfig, cssText } = readTypographyConfig();
    return featureConfig?.enabled && resolveThemeGlobalTypographyActiveTheme({ documentRef, windowRef }) ? cssText : "";
  }

  function checkHealth() {
    const expected = expectedStyleText();
    const matches = (styleNode) => expected
      ? String(styleNode?.tagName).toLowerCase() === "style" && styleNode.textContent === expected
      : !styleNode;
    return matches(documentRef.getElementById(STYLE_ID)) &&
      queryToolsHosts(documentRef).every((host) => !host.shadowRoot ||
        matches(getShadowNodeById(host.shadowRoot, TOOLS_SHADOW_STYLE_ID))) && glow.checkHealth();
  }

  function updateTypography() {
    const { featureConfig, cssText } = readTypographyConfig();

    if (!featureConfig?.enabled || !resolveThemeGlobalTypographyActiveTheme({ documentRef, windowRef }) || !cssText) {
      removeStyle();
      return;
    }

    const existing = documentRef.getElementById(STYLE_ID);
    if (existing && String(existing.tagName).toLowerCase() !== "style") existing.remove();
    const styleNode = domGuards.ensureStyle(STYLE_ID, cssText);
    maintainMatchStyleOrder(styleNode);
    ensureToolsShadowStyle(documentRef, cssText);
    glow.update(featureConfig.glowMode !== "off" && Boolean(featureConfig.glowMode));
  }

  const harness = createFeatureMountHarness(context, {
    isSupported: ({ documentRef: nextDocumentRef }) => Boolean(nextDocumentRef && domGuards),
    checkHealth,
    repairHealth: () => { updateTypography(); return checkHealth(); },
    update: updateTypography,
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
