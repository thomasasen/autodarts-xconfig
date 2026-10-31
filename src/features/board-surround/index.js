import { createFeatureMountHarness } from "../shared/feature-mount-harness.js";
import { findBoardPresentationSurface } from "../../shared/board-presentation-surface.js";
import { resolveThemePresetAsset, ensureThemePresetAsset, subscribeThemePresetAssets } from "#theme-preset-assets";
import { COMMUNITY_SURROUNDS } from "../../shared/community-designs.js";
import { isThemeGameContextActive } from "../themes/shared/theme-utils.js";

export const SURROUND_ID = "ad-xconfig-board-surround";

export function mountBoardSurround(context = {}) {
  let layer = null;
  let frame = null;
  let previousPosition = "";
  let previousPadding = "";
  let previousPaddingSides = [];
  let framePriority = "";
  let paddingPriority = "";
  let ownedPadding = "";
  let reservedScale = null;
  let resizeObserver = null;
  let target = null;
  const expectedStyles = new Map();
  let expectedSource = "";
  const requested = new Set();
  function setLayerStyle(key, value) {
    if (layer.style.getPropertyValue(key) !== value || layer.style.getPropertyPriority(key)) layer.style.setProperty(key, value);
    expectedStyles.set(key, layer.style.getPropertyValue(key));
  }
  function clear() {
    layer?.remove();
    layer = null;
    resizeObserver?.disconnect();
    resizeObserver = null;
    if (frame) {
      if (frame.style.getPropertyValue("position") === "relative") {
        if (previousPosition) frame.style.setProperty("position", previousPosition, framePriority); else frame.style.removeProperty("position");
      }
      if (frame.style.getPropertyValue("padding") === ownedPadding) {
        if (previousPadding) frame.style.setProperty("padding", previousPadding, paddingPriority); else frame.style.removeProperty("padding");
        for (const { key, value, priority } of previousPaddingSides) if (value) frame.style.setProperty(key, value, priority);
      }
    }
    frame = null;
    target = null;
    ownedPadding = "";
    reservedScale = null;
    previousPaddingSides = [];
    expectedStyles.clear();
    expectedSource = "";
  }
  const healthy = () => !frame || (frame.isConnected && target?.isConnected && layer?.isConnected && layer.parentElement === frame &&
    layer.id === SURROUND_ID && layer.getAttribute("src") === expectedSource && layer.getAttribute("data-adx-decoration") === "surround" && frame.style.getPropertyValue("padding") === ownedPadding &&
    [...expectedStyles].every(([key, value]) => layer.style.getPropertyValue(key) === value && !layer.style.getPropertyPriority(key)));
  const harness = createFeatureMountHarness(context, { update, checkHealth: healthy, repairHealth: () => { update(); return healthy(); } });
  if (!harness) return () => {};
  const { documentRef, windowRef } = harness;
  function update() {
    const settings = context.config?.getFeatureConfig?.("boardSurround") || {};
    const surface = findBoardPresentationSurface(documentRef);
    // The native parent can be the touch/coordinate-input wrapper and a zoom
    // target. Keep its dimensions, padding and origin aligned with the board.
    const decorationFrame = surface?.frame?.parentElement;
    const safeFrame = decorationFrame && !["BODY", "HTML", "MAIN"].includes(decorationFrame.tagName) &&
      !Array.from(decorationFrame.querySelectorAll("button,[role='button']")).some((node) => !surface.frame.contains(node));
    const design = COMMUNITY_SURROUNDS.find((entry) => entry.key === settings.design);
    const assetKey = settings.assetKey || design?.assetKey;
    const url = resolveThemePresetAsset(assetKey);
    if (!settings.enabled || !safeFrame || !assetKey || !isThemeGameContextActive({ documentRef, windowRef })) { clear(); return; }
    if (!url) {
      if (!requested.has(assetKey)) { requested.add(assetKey); ensureThemePresetAsset(assetKey).catch(() => {}); }
      return;
    }
    // Decorate outside both the native image and its interactive/zoom wrapper.
    if (frame !== decorationFrame || target !== surface.host || !layer?.isConnected || layer.id !== SURROUND_ID) {
      clear();
      frame = decorationFrame;
      target = surface.host;
      previousPosition = frame.style.getPropertyValue("position");
      framePriority = frame.style.getPropertyPriority("position");
      previousPadding = frame.style.getPropertyValue("padding");
      previousPaddingSides = ["padding-top", "padding-right", "padding-bottom", "padding-left"].map((key) => ({ key, value: frame.style.getPropertyValue(key), priority: frame.style.getPropertyPriority(key) }));
      paddingPriority = frame.style.getPropertyPriority("padding");
      if (!windowRef?.getComputedStyle?.(frame)?.position || windowRef.getComputedStyle(frame).position === "static") frame.style.setProperty("position", "relative");
      layer = documentRef.createElement("img");
      documentRef.getElementById(SURROUND_ID)?.remove();
      layer.id = SURROUND_ID;
      layer.setAttribute("data-adx-decoration", "surround");
      layer.setAttribute("aria-hidden", "true");
      layer.alt = "";
      frame.insertBefore(layer, frame.firstChild);
      if (windowRef?.ResizeObserver) {
        resizeObserver = new windowRef.ResizeObserver(() => harness.schedule());
        resizeObserver.observe(frame);
      }
    }
    if (layer.getAttribute("data-adx-decoration") !== "surround") layer.setAttribute("data-adx-decoration", "surround");
    for (const [key, value] of Object.entries({ position: "absolute", "pointer-events": "none", "object-fit": "contain", "z-index": "0", "max-width": "none", "max-height": "none" })) setLayerStyle(key, value);
    if (layer.getAttribute("src") !== url) layer.setAttribute("src", url);
    expectedSource = url;
    const scale = Math.min(170, Math.max(110, Number(settings.sizePercent) || 143)) / 100;
    const padding = `${((1 - 1 / scale) * 50).toFixed(6)}%`;
    if (reservedScale !== scale || frame.style.getPropertyValue("padding") !== ownedPadding) {
      frame.style.setProperty("padding", padding);
      ownedPadding = frame.style.getPropertyValue("padding");
      reservedScale = scale;
    }
    // offset geometry deliberately ignores transform scale from TV zoom.
    const width = target.offsetWidth || target.clientWidth;
    const height = target.offsetHeight || target.clientHeight;
    if (!(width > 0 && height > 0)) { setLayerStyle("display", "none"); return; }
    const size = Math.min(width, height);
    const outer = size * scale;
    setLayerStyle("display", "block");
    setLayerStyle("width", `${outer}px`);
    setLayerStyle("height", `${outer}px`);
    let left = 0;
    let top = 0;
    for (let node = target; node && node !== frame; node = node.offsetParent) {
      left += Number(node.offsetLeft) || 0;
      top += Number(node.offsetTop) || 0;
    }
    setLayerStyle("left", `${left + (width - outer) / 2}px`);
    setLayerStyle("top", `${top + (height - outer) / 2}px`);
    const mask = `radial-gradient(circle at center, transparent ${size / 2 - 1}px, black ${size / 2}px)`;
    setLayerStyle("mask-image", mask);
    setLayerStyle("-webkit-mask-image", mask);
  }
  harness.registerObserver({ key: "board-surround:dom", observeOptions: { childList: true, subtree: true } });
  harness.registerListeners([{ key: "board-surround:resize", target: windowRef, type: "resize", handler: () => harness.schedule() }]);
  harness.subscribeToGameState();
  const unsubscribeAssets = subscribeThemePresetAssets((event) => { if (event.state === "ready") harness.schedule(); });
  harness.schedule();
  return harness.createCleanup(() => { unsubscribeAssets(); clear(); });
}
