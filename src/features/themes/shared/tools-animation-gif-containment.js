const TOOLS_ANIMATION_HOST_SELECTOR = "autodarts-tools-animations";
const BOARD_VIEWPORT_SELECTOR = ".ad-ext-theme-board-viewport";
const GIF_MEDIA_SELECTOR = "#gif-animation, img, video";
const MANAGED_STYLE_PROPERTIES = Object.freeze([
  ["position", "position"],
  ["inset", "inset"],
  ["top", "top"],
  ["right", "right"],
  ["bottom", "bottom"],
  ["left", "left"],
  ["width", "width"],
  ["height", "height"],
  ["max-width", "maxWidth"],
  ["max-height", "maxHeight"],
  ["overflow", "overflow"],
  ["object-fit", "objectFit"],
]);

function queryAll(root, selector) {
  if (!root || typeof root.querySelectorAll !== "function") {
    return [];
  }

  try {
    return Array.from(root.querySelectorAll(selector));
  } catch (_) {
    return [];
  }
}

function setStyle(node, property, value, snapshot = null) {
  if (!node?.style) {
    return;
  }

  if (typeof node.style.setProperty === "function") {
    node.style.setProperty(property, value, "important");
  } else {
    node.style[property] = value;
  }

  if (snapshot) {
    snapshot.appliedStyles[property] = {
      value: String(value || ""),
      priority: typeof node.style.getPropertyPriority === "function"
        ? String(node.style.getPropertyPriority(property) || "")
        : "",
    };
  }
}

function readInlineStyle(node, property) {
  if (!node?.style) {
    return "";
  }

  const [head = "", ...tail] = String(property || "").split("-");
  const camelName = [
    head,
    ...tail.map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`),
  ].join("");
  return String(node.style[camelName] || node.style.getPropertyValue?.(property) || "");
}

function readInlineStylePriority(node, property) {
  if (!node?.style || typeof node.style.getPropertyPriority !== "function") {
    return "";
  }
  return String(node.style.getPropertyPriority(property) || "");
}

export function snapshotToolsAnimationGifNodeStyle(node) {
  if (!node?.style) {
    return null;
  }

  const snapshot = {
    node,
    priorities: {},
    appliedStyles: {},
  };
  MANAGED_STYLE_PROPERTIES.forEach(([property, snapshotKey]) => {
    snapshot[snapshotKey] = readInlineStyle(node, property);
    snapshot.priorities[property] = readInlineStylePriority(node, property);
  });
  return snapshot;
}

function restoreStyleValue(node, property, value, priority = "") {
  const restoredValue = String(value || "");
  if (typeof node.style.removeProperty === "function" && !restoredValue) {
    node.style.removeProperty(property);
    return;
  }
  if (typeof node.style.setProperty === "function") {
    node.style.setProperty(property, restoredValue, String(priority || ""));
    return;
  }
  node.style[property] = restoredValue;
}

export function restoreToolsAnimationGifNodeStyle(snapshot) {
  const node = snapshot?.node;
  if (!node?.style) {
    return;
  }

  MANAGED_STYLE_PROPERTIES.forEach(([property, snapshotKey]) => {
    const appliedStyle = snapshot.appliedStyles?.[property] || null;
    if (appliedStyle) {
      const currentValue = readInlineStyle(node, property);
      const currentPriority = readInlineStylePriority(node, property);
      if (
        currentValue !== String(appliedStyle.value || "") ||
        currentPriority !== String(appliedStyle.priority || "")
      ) {
        return;
      }
    }

    restoreStyleValue(
      node,
      property,
      snapshot[snapshotKey],
      snapshot.priorities?.[property] || ""
    );
  });
}

function ensureContainmentState(themeState) {
  if (!themeState.toolsAnimationGifContainment) {
    themeState.toolsAnimationGifContainment = {
      observers: new Map(),
      snapshots: new Map(),
    };
  }
  return themeState.toolsAnimationGifContainment;
}

export function rememberToolsAnimationGifStyleSnapshot(state, node) {
  if (!node?.style) {
    return null;
  }
  if (state.snapshots.has(node)) {
    return state.snapshots.get(node);
  }

  const snapshot = snapshotToolsAnimationGifNodeStyle(node);
  if (snapshot) {
    state.snapshots.set(node, snapshot);
  }
  return snapshot;
}

function resolveBoardViewportRect(documentRef) {
  const viewport = documentRef?.querySelector?.(BOARD_VIEWPORT_SELECTOR) || null;
  const rect = viewport?.getBoundingClientRect?.() || null;
  const width = Number(rect?.width) > 0
    ? Number(rect.width)
    : Number(viewport?.clientWidth || viewport?.offsetWidth || 0);
  const height = Number(rect?.height) > 0
    ? Number(rect.height)
    : Number(viewport?.clientHeight || viewport?.offsetHeight || 0);

  if (!(width > 0 && height > 0)) {
    return null;
  }

  return {
    left: Number(rect?.left) || 0,
    top: Number(rect?.top) || 0,
    width,
    height,
  };
}

function isGifMediaNode(node) {
  if (!node) {
    return false;
  }

  const idToken = String(node.id || "").toLowerCase();
  const srcToken = String(node.currentSrc || node.src || node.getAttribute?.("src") || "").toLowerCase();
  return (
    idToken.includes("gif") ||
    srcToken.includes(".gif") ||
    srcToken.includes("giphy") ||
    srcToken.includes("tenor")
  );
}

export function applyToolsAnimationGifContainmentStyles(options = {}) {
  const {
    state,
    mediaNode,
    frameNode,
    containerNode,
    viewportRect,
    rememberSnapshot = rememberToolsAnimationGifStyleSnapshot,
  } = options;
  if (!state || !mediaNode?.style || !containerNode?.style || !viewportRect) {
    return;
  }

  const containerSnapshot = rememberSnapshot(state, containerNode);
  const frameSnapshot = rememberSnapshot(state, frameNode);
  const mediaSnapshot = rememberSnapshot(state, mediaNode);

  setStyle(containerNode, "position", "fixed", containerSnapshot);
  setStyle(containerNode, "top", `${viewportRect.top.toFixed(2)}px`, containerSnapshot);
  setStyle(containerNode, "left", `${viewportRect.left.toFixed(2)}px`, containerSnapshot);
  setStyle(containerNode, "right", "auto", containerSnapshot);
  setStyle(containerNode, "bottom", "auto", containerSnapshot);
  setStyle(containerNode, "width", `${viewportRect.width.toFixed(2)}px`, containerSnapshot);
  setStyle(containerNode, "height", `${viewportRect.height.toFixed(2)}px`, containerSnapshot);
  setStyle(containerNode, "max-width", "none", containerSnapshot);
  setStyle(containerNode, "max-height", "none", containerSnapshot);
  setStyle(containerNode, "overflow", "hidden", containerSnapshot);

  if (frameNode?.style && frameNode !== containerNode) {
    setStyle(frameNode, "position", "absolute", frameSnapshot);
    setStyle(frameNode, "inset", "0", frameSnapshot);
    setStyle(frameNode, "width", "100%", frameSnapshot);
    setStyle(frameNode, "height", "100%", frameSnapshot);
    setStyle(frameNode, "max-width", "none", frameSnapshot);
    setStyle(frameNode, "max-height", "none", frameSnapshot);
    setStyle(frameNode, "overflow", "hidden", frameSnapshot);
  }

  setStyle(mediaNode, "width", "100%", mediaSnapshot);
  setStyle(mediaNode, "height", "100%", mediaSnapshot);
  setStyle(mediaNode, "max-width", "none", mediaSnapshot);
  setStyle(mediaNode, "max-height", "none", mediaSnapshot);
  setStyle(mediaNode, "object-fit", "contain", mediaSnapshot);
}

function applyMediaContainment(state, mediaNode, viewportRect) {
  if (!isGifMediaNode(mediaNode)) {
    return;
  }

  const containerNode = mediaNode.closest?.(".fixed") || mediaNode.parentElement?.parentElement || mediaNode;
  const frameNode = containerNode && containerNode !== mediaNode ? mediaNode.parentElement || null : null;

  applyToolsAnimationGifContainmentStyles({
    state,
    mediaNode,
    frameNode,
    containerNode,
    viewportRect,
  });
}

function observeShadowRoot(state, shadowRoot, windowRef, scheduler) {
  if (!shadowRoot || state.observers.has(shadowRoot)) {
    return;
  }

  const ObserverClass = windowRef?.MutationObserver ||
    (typeof MutationObserver === "function" ? MutationObserver : null);
  if (typeof ObserverClass !== "function") {
    return;
  }

  const observer = new ObserverClass(() => scheduler?.schedule?.());
  observer.observe(shadowRoot, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["class", "style", "src"],
  });
  state.observers.set(shadowRoot, observer);
}

export function syncToolsAnimationGifContainment(options = {}) {
  const { documentRef, themeState, windowRef, scheduler } = options;
  if (!documentRef || !themeState) {
    return;
  }

  const state = ensureContainmentState(themeState);
  const viewportRect = resolveBoardViewportRect(documentRef);
  if (!viewportRect) {
    return;
  }

  queryAll(documentRef, TOOLS_ANIMATION_HOST_SELECTOR).forEach((host) => {
    const shadowRoot = host?.shadowRoot || null;
    if (!shadowRoot) {
      return;
    }

    observeShadowRoot(state, shadowRoot, windowRef, scheduler);
    queryAll(shadowRoot, GIF_MEDIA_SELECTOR).forEach((mediaNode) => {
      applyMediaContainment(state, mediaNode, viewportRect);
    });
  });
}

export function cleanupToolsAnimationGifContainment(themeState) {
  const state = themeState?.toolsAnimationGifContainment;
  if (!state) {
    return;
  }

  state.observers.forEach((observer) => {
    observer?.disconnect?.();
  });
  state.observers.clear();

  Array.from(state.snapshots.values())
    .reverse()
    .forEach(restoreToolsAnimationGifNodeStyle);
  state.snapshots.clear();
}
