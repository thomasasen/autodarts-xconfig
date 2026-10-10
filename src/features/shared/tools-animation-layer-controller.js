import { queryAll } from "../../shared/dom-query.js";

export const TOOLS_ANIMATION_ACTIVE_ATTRIBUTE = "data-ad-ext-tools-animation-active";
const HOST_SELECTOR = "autodarts-tools-animations";
const controllers = new WeakMap();

function mediaSource(node) {
  return String(node?.currentSrc || node?.getAttribute?.("src") || node?.src || "");
}

export function isLegacyToolsAnimationMedia(node) {
  return node?.id === "gif-animation" || node?.classList?.contains?.("gif-animation") ||
    Boolean(node?.closest?.("#gif-animation, .gif-animation")) ||
    /\.gif(?:[?#]|$)|giphy|tenor/i.test(mediaSource(node));
}

function isShown(node, root, windowRef, preserveMediaFade = false) {
  // Opacity alone is not an end signal: Tools retains its wrapper throughout
  // loading, fade-in and fade-out. Keeping the priority until removal avoids
  // revealing darts between animation frames.
  for (let current = node; current && current !== root; current = current.parentNode) {
    const style = windowRef?.getComputedStyle?.(current);
    if (current.hidden || current.hasAttribute?.("hidden") ||
        current.style?.display === "none" || style?.display === "none" ||
        current.style?.visibility === "hidden" || style?.visibility === "hidden") return false;
    if ((!preserveMediaFade || current !== node) &&
        (current.style?.opacity === "0" || style?.opacity === "0")) return false;
  }
  return true;
}

function createController(documentRef, windowRef) {
  const rootNode = documentRef.documentElement || documentRef.body;
  const originalAttribute = rootNode.getAttribute(TOOLS_ANIMATION_ACTIVE_ATTRIBUTE);
  const subscribers = new Set();
  const roots = new Map();
  const failedMedia = new WeakMap();
  let active = false;
  let hydrationTimer = 0;
  let stopped = false;
  let previousHosts = [];
  const Observer = windowRef?.MutationObserver;

  function onMediaEvent(event) {
    if (event.type === "error") failedMedia.set(event.target, mediaSource(event.target));
    else failedMedia.delete(event.target);
    sync();
  }

  function watch(root) {
    if (!root || roots.has(root)) return;
    const observer = typeof Observer === "function" ? new Observer(sync) : null;
    observer?.observe(root, { childList: true, subtree: true, attributes: true,
      attributeFilter: ["class", "style", "src", "hidden"] });
    root.addEventListener?.("error", onMediaEvent, true);
    root.addEventListener?.("load", onMediaEvent, true);
    root.addEventListener?.("transitionend", sync, true);
    root.addEventListener?.("transitioncancel", sync, true);
    roots.set(root, observer);
  }

  function unwatch(root, observer) {
    observer?.disconnect();
    root.removeEventListener?.("error", onMediaEvent, true);
    root.removeEventListener?.("load", onMediaEvent, true);
    root.removeEventListener?.("transitionend", sync, true);
    root.removeEventListener?.("transitioncancel", sync, true);
    roots.delete(root);
  }

  function hasAnimation(root, toolsHost = null) {
    if (toolsHost && !isShown(toolsHost, rootNode, windowRef)) return false;
    return queryAll(root, "img, video, #gif-animation, .gif-animation").some((media) => {
      if (!mediaSource(media) || failedMedia.get(media) === mediaSource(media)) return false;
      if (!toolsHost && !isLegacyToolsAnimationMedia(media)) return false;
      const wrapper = media.closest?.(".fixed") || media;
      // A modern Tools wrapper identifies the animation even for OPFS blob
      // URLs. Unmounted preloads and unrelated board images are not candidates.
      if (toolsHost && wrapper === media && !isLegacyToolsAnimationMedia(media)) return false;
      return isShown(media, root, windowRef, Boolean(toolsHost));
    });
  }

  function sync() {
    if (stopped) return;
    const hosts = queryAll(documentRef, HOST_SELECTOR);
    const hostsChanged = hosts.length !== previousHosts.length || hosts.some((host, index) => host !== previousHosts[index]);
    previousHosts = hosts;
    const liveRoots = new Set([rootNode]);
    hosts.forEach((host) => {
      if (host.shadowRoot) {
        liveRoots.add(host.shadowRoot);
        watch(host.shadowRoot);
      }
    });
    roots.forEach((observer, root) => {
      if (!liveRoots.has(root)) unwatch(root, observer);
    });
    const nextActive = hosts.some((host) => host.shadowRoot && hasAnimation(host.shadowRoot, host)) ||
      queryAll(documentRef, ".showAnimations").some((root) => hasAnimation(root));
    const activityChanged = nextActive !== active;
    active = nextActive;
    if (active && rootNode.getAttribute(TOOLS_ANIMATION_ACTIVE_ATTRIBUTE) !== "true") {
      rootNode.setAttribute(TOOLS_ANIMATION_ACTIVE_ATTRIBUTE, "true");
    } else if (!active && rootNode.getAttribute(TOOLS_ANIMATION_ACTIVE_ATTRIBUTE) === "true") {
      rootNode.removeAttribute(TOOLS_ANIMATION_ACTIVE_ATTRIBUTE);
    }
    if (activityChanged || hostsChanged) subscribers.forEach(({ onChange }) => onChange?.(active));
    if (!hydrationTimer && hosts.some((host) => !host.shadowRoot)) {
      hydrationTimer = windowRef?.setTimeout?.(() => {
        hydrationTimer = 0;
        sync();
      }, 250) || 0;
    }
  }

  watch(rootNode);
  return {
    get active() { return active; },
    acquire(onChange) {
      const subscription = { onChange };
      subscribers.add(subscription);
      sync();
      let released = false;
      return {
        sync,
        release() {
          if (released) return;
          released = true;
          subscribers.delete(subscription);
          if (subscribers.size) return;
          stopped = true;
          if (hydrationTimer) windowRef?.clearTimeout?.(hydrationTimer);
          roots.forEach((observer, root) => unwatch(root, observer));
          if (rootNode.getAttribute(TOOLS_ANIMATION_ACTIVE_ATTRIBUTE) === "true") {
            if (originalAttribute === null) rootNode.removeAttribute(TOOLS_ANIMATION_ACTIVE_ATTRIBUTE);
            else rootNode.setAttribute(TOOLS_ANIMATION_ACTIVE_ATTRIBUTE, originalAttribute);
          }
          controllers.delete(documentRef);
        },
      };
    },
  };
}

export function acquireToolsAnimationLayerController({ documentRef, windowRef, onChange } = {}) {
  let controller = controllers.get(documentRef);
  if (!controller) {
    controller = createController(documentRef, windowRef || documentRef.defaultView);
    controllers.set(documentRef, controller);
  }
  return controller.acquire(onChange);
}

export function isToolsAnimationActive(documentRef) {
  return controllers.get(documentRef)?.active === true;
}
