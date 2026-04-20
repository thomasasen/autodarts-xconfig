import { normalizeSegmentName, parseSegment } from "../../../domain/x01-rules.js";
import { normalizeBoolean } from "../shared/theme-utils.js";

const GOTCHA_HOST_SELECTOR = "#ad-ext-player-display .ad-ext-player autodarts-tools-gotcha";
const GOTCHA_VALUE_SELECTOR = ".gotcha";
const GOTCHA_FONT_STYLE_PROPERTY = "font-style";

function resolveGotchaValueNode(host) {
  const shadowRoot = host?.shadowRoot || null;
  if (!shadowRoot || typeof shadowRoot.querySelector !== "function") {
    return null;
  }

  try {
    return shadowRoot.querySelector(GOTCHA_VALUE_SELECTOR);
  } catch (_) {
    return null;
  }
}

function queryGotchaHosts(documentRef) {
  if (!documentRef || typeof documentRef.querySelectorAll !== "function") {
    return [];
  }

  try {
    return Array.from(documentRef.querySelectorAll(GOTCHA_HOST_SELECTOR));
  } catch (_) {
    return [];
  }
}

function shouldConvertGotchaSegment(rawText) {
  return /[a-z]/i.test(String(rawText || "").trim());
}

export function resolveGotchaDisplayText(rawText = "") {
  const trimmedText = String(rawText || "").trim();
  if (!trimmedText || !shouldConvertGotchaSegment(trimmedText)) {
    return trimmedText;
  }

  const normalizedSegment = normalizeSegmentName(trimmedText);
  const parsedSegment = parseSegment(normalizedSegment);
  if (!parsedSegment) {
    return trimmedText;
  }

  return `+${parsedSegment.score}`;
}

function resolveGotchaPresentationConfig(featureConfig = {}) {
  return {
    deltaItalic: normalizeBoolean(featureConfig.deltaItalic, true),
  };
}

function syncGotchaHostPresentation(host, themeState, featureConfig = {}) {
  const valueNode = resolveGotchaValueNode(host);
  if (!valueNode) {
    themeState.gotchaStyleByHost.delete(host);
    return;
  }

  const storedEntry = themeState.gotchaStyleByHost.get(host) || null;
  if (storedEntry?.node !== valueNode) {
    themeState.gotchaStyleByHost.set(host, {
      node: valueNode,
      originalFontStyle:
        typeof valueNode.style?.getPropertyValue === "function"
          ? String(valueNode.style.getPropertyValue(GOTCHA_FONT_STYLE_PROPERTY) || "")
          : "",
    });
  }

  if (typeof valueNode.style?.setProperty !== "function") {
    return;
  }

  const { deltaItalic } = resolveGotchaPresentationConfig(featureConfig);
  valueNode.style.setProperty(
    GOTCHA_FONT_STYLE_PROPERTY,
    deltaItalic ? "italic" : "normal"
  );
}

function syncGotchaHostDisplay(host, themeState) {
  const valueNode = resolveGotchaValueNode(host);
  if (!valueNode) {
    themeState.gotchaTextByHost.delete(host);
    return;
  }

  const currentText = String(valueNode.textContent || "").trim();
  const storedEntry = themeState.gotchaTextByHost.get(host) || null;
  const rawText =
    storedEntry?.transformedText === currentText ? storedEntry.rawText : currentText;
  const transformedText = resolveGotchaDisplayText(rawText);

  if (!transformedText || transformedText === rawText) {
    themeState.gotchaTextByHost.delete(host);
    return;
  }

  if (currentText !== transformedText) {
    valueNode.textContent = transformedText;
  }

  themeState.gotchaTextByHost.set(host, {
    rawText,
    transformedText,
  });
}

function restoreGotchaHostDisplay(host, themeState) {
  const storedEntry = themeState.gotchaTextByHost.get(host);
  if (!storedEntry) {
    return;
  }

  const valueNode = resolveGotchaValueNode(host);
  if (valueNode && String(valueNode.textContent || "").trim() === storedEntry.transformedText) {
    valueNode.textContent = storedEntry.rawText;
  }

  themeState.gotchaTextByHost.delete(host);
}

function restoreGotchaHostPresentation(host, themeState) {
  const storedEntry = themeState.gotchaStyleByHost.get(host);
  if (!storedEntry) {
    return;
  }

  const valueNode = resolveGotchaValueNode(host);
  if (valueNode && typeof valueNode.style?.removeProperty === "function") {
    if (storedEntry.originalFontStyle) {
      valueNode.style.setProperty(
        GOTCHA_FONT_STYLE_PROPERTY,
        storedEntry.originalFontStyle
      );
    } else {
      valueNode.style.removeProperty(GOTCHA_FONT_STYLE_PROPERTY);
    }
  }

  themeState.gotchaStyleByHost.delete(host);
}

function disconnectShadowObserver(host, themeState) {
  const observerEntry = themeState.shadowObserversByHost.get(host);
  if (!observerEntry) {
    return;
  }

  try {
    observerEntry.observer?.disconnect?.();
  } catch (_) {
    // Keep cleanup fail-soft.
  }

  themeState.shadowObserversByHost.delete(host);
}

function ensureShadowObserver(host, context = {}) {
  const shadowRoot = host?.shadowRoot || null;
  if (!shadowRoot) {
    disconnectShadowObserver(host, context.themeState);
    return;
  }

  const existingEntry = context.themeState.shadowObserversByHost.get(host) || null;
  if (existingEntry?.shadowRoot === shadowRoot) {
    return;
  }

  disconnectShadowObserver(host, context.themeState);

  const MutationObserverRef =
    context.windowRef?.MutationObserver ||
    (typeof MutationObserver === "function" ? MutationObserver : null);
  if (typeof MutationObserverRef !== "function") {
    return;
  }

  const observer = new MutationObserverRef(() => {
    syncGotchaHostPresentation(host, context.themeState, context.featureConfig);
    syncGotchaHostDisplay(host, context.themeState);
  });

  observer.observe(shadowRoot, {
    childList: true,
    subtree: true,
    characterData: true,
  });

  context.themeState.shadowObserversByHost.set(host, {
    observer,
    shadowRoot,
  });
}

function pruneDisconnectedHosts(documentRef, themeState) {
  Array.from(themeState.shadowObserversByHost.keys()).forEach((host) => {
    if (host?.isConnected) {
      return;
    }

    disconnectShadowObserver(host, themeState);
    themeState.gotchaTextByHost.delete(host);
  });

  Array.from(themeState.gotchaTextByHost.keys()).forEach((host) => {
    if (host?.isConnected) {
      return;
    }
    themeState.gotchaTextByHost.delete(host);
  });

  Array.from(themeState.gotchaStyleByHost.keys()).forEach((host) => {
    if (host?.isConnected) {
      return;
    }
    themeState.gotchaStyleByHost.delete(host);
  });

  queryGotchaHosts(documentRef).forEach((host) => {
    if (!themeState.shadowObserversByHost.has(host)) {
      return;
    }
    const activeEntry = themeState.shadowObserversByHost.get(host);
    if (activeEntry?.shadowRoot === host.shadowRoot) {
      return;
    }
    disconnectShadowObserver(host, themeState);
  });
}

export function createGotchaThemePolicy() {
  return Object.freeze({
    key: "theme-gotcha",
    createState() {
      return {
        gotchaTextByHost: new Map(),
        gotchaStyleByHost: new Map(),
        shadowObserversByHost: new Map(),
      };
    },
    getObservedAttributeFilter() {
      return ["class"];
    },
    onActivate(context = {}) {
      pruneDisconnectedHosts(context.documentRef, context.themeState);
      queryGotchaHosts(context.documentRef).forEach((host) => {
        ensureShadowObserver(host, context);
        syncGotchaHostPresentation(host, context.themeState, context.featureConfig);
        syncGotchaHostDisplay(host, context.themeState);
      });
    },
    onDeactivate(context = {}) {
      queryGotchaHosts(context.documentRef).forEach((host) => {
        restoreGotchaHostDisplay(host, context.themeState);
        restoreGotchaHostPresentation(host, context.themeState);
      });

      Array.from(context.themeState.shadowObserversByHost.keys()).forEach((host) => {
        disconnectShadowObserver(host, context.themeState);
      });
      context.themeState.gotchaTextByHost.clear();
      context.themeState.gotchaStyleByHost.clear();
    },
  });
}
