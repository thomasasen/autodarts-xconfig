const TOOLS_ANIMATION_HOST_SELECTOR = "autodarts-tools-animations";
const BOARD_VIEWPORT_SELECTOR = ".ad-ext-theme-board-viewport";
const GIF_MEDIA_SELECTOR = "#gif-animation, img, video";

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

function setStyle(node, property, value) {
  if (!node?.style) {
    return;
  }

  if (typeof node.style.setProperty === "function") {
    node.style.setProperty(property, value, "important");
    return;
  }

  node.style[property] = value;
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

export function snapshotToolsAnimationGifNodeStyle(node) {
  if (!node?.style) {
    return null;
  }

  return {
    node,
    position: readInlineStyle(node, "position"),
    inset: readInlineStyle(node, "inset"),
    top: readInlineStyle(node, "top"),
    right: readInlineStyle(node, "right"),
    bottom: readInlineStyle(node, "bottom"),
    left: readInlineStyle(node, "left"),
    width: readInlineStyle(node, "width"),
    height: readInlineStyle(node, "height"),
    maxWidth: readInlineStyle(node, "max-width"),
    maxHeight: readInlineStyle(node, "max-height"),
    overflow: readInlineStyle(node, "overflow"),
    objectFit: readInlineStyle(node, "object-fit"),
  };
}

function restoreStyleValue(node, property, value) {
  const restoredValue = String(value || "");
  if (typeof node.style.removeProperty === "function" && !restoredValue) {
    node.style.removeProperty(property);
    return;
  }
  if (typeof node.style.setProperty === "function") {
    node.style.setProperty(property, restoredValue);
    return;
  }
  node.style[property] = restoredValue;
}

export function restoreToolsAnimationGifNodeStyle(snapshot) {
  const node = snapshot?.node;
  if (!node?.style) {
    return;
  }

  [
    ["position", snapshot.position],
    ["inset", snapshot.inset],
    ["top", snapshot.top],
    ["right", snapshot.right],
    ["bottom", snapshot.bottom],
    ["left", snapshot.left],
    ["width", snapshot.width],
    ["height", snapshot.height],
    ["max-width", snapshot.maxWidth],
    ["max-height", snapshot.maxHeight],
    ["overflow", snapshot.overflow],
    ["object-fit", snapshot.objectFit],
  ].forEach(([property, value]) => restoreStyleValue(node, property, value));
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
  if (!node?.style || state.snapshots.has(node)) {
    return;
  }

  const snapshot = snapshotToolsAnimationGifNodeStyle(node);
  if (snapshot) {
    state.snapshots.set(node, snapshot);
  }
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

  rememberSnapshot(state, containerNode);
  rememberSnapshot(state, frameNode);
  rememberSnapshot(state, mediaNode);

  setStyle(containerNode, "position", "fixed");
  setStyle(containerNode, "top", `${viewportRect.top.toFixed(2)}px`);
  setStyle(containerNode, "left", `${viewportRect.left.toFixed(2)}px`);
  setStyle(containerNode, "right", "auto");
  setStyle(containerNode, "bottom", "auto");
  setStyle(containerNode, "width", `${viewportRect.width.toFixed(2)}px`);
  setStyle(containerNode, "height", `${viewportRect.height.toFixed(2)}px`);
  setStyle(containerNode, "max-width", "none");
  setStyle(containerNode, "max-height", "none");
  setStyle(containerNode, "overflow", "hidden");

  if (frameNode?.style && frameNode !== containerNode) {
    setStyle(frameNode, "position", "absolute");
    setStyle(frameNode, "inset", "0");
    setStyle(frameNode, "width", "100%");
    setStyle(frameNode, "height", "100%");
    setStyle(frameNode, "max-width", "none");
    setStyle(frameNode, "max-height", "none");
    setStyle(frameNode, "overflow", "hidden");
  }

  setStyle(mediaNode, "width", "100%");
  setStyle(mediaNode, "height", "100%");
  setStyle(mediaNode, "max-width", "none");
  setStyle(mediaNode, "max-height", "none");
  setStyle(mediaNode, "object-fit", "contain");
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
