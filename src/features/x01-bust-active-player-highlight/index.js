import {
  SHAKE_DURATION_MS,
  clearBustActivePlayerHighlightState,
  createBustActivePlayerHighlightState,
  ensureBustGlassCrackAudio,
  runBustActivePlayerHighlightPreview,
  syncBustActivePlayerHighlight,
  tryUnlockBustGlassCrackAudio,
} from "./logic.js";
import { STYLE_ID, buildStyleText } from "./style.js";
import { createFeatureMountHarness } from "../shared/feature-mount-harness.js";

const FEATURE_KEY = "x01-bust-active-player-highlight";
const OBSERVER_KEY = `${FEATURE_KEY}:dom-observer`;
const XCONFIG_PANEL_SELECTOR = "#ad-xconfig-panel-host";
const LISTENER_KEYS = Object.freeze({
  unlockPointer: `${FEATURE_KEY}:unlock-pointerdown`,
  unlockKey: `${FEATURE_KEY}:unlock-keydown`,
});

function isXConfigPanelEvent(event) {
  const target = event?.target || null;
  return Boolean(target && typeof target.closest === "function" && target.closest(XCONFIG_PANEL_SELECTOR));
}

export function mountX01BustActivePlayerHighlight(context = {}) {
  const documentRef = context.documentRef || (typeof document !== "undefined" ? document : null);
  const windowRef = context.windowRef || (globalThis.window !== undefined ? globalThis.window : null);
  const domGuards = context.domGuards;
  const featureConfig =
    context.config && typeof context.config.getFeatureConfig === "function"
      ? context.config.getFeatureConfig("x01BustActivePlayerHighlight")
      : { crackCount: 3, shakeEnabled: true, soundEnabled: false };

  if (!documentRef || !domGuards) {
    return () => {};
  }

  domGuards.ensureStyle(STYLE_ID, buildStyleText());

  const state = createBustActivePlayerHighlightState();
  if (featureConfig.soundEnabled === true) {
    ensureBustGlassCrackAudio(state, windowRef);
  }
  const update = () => {
    syncBustActivePlayerHighlight(
      {
        ...context,
        documentRef,
        windowRef,
        crackCount: featureConfig.crackCount,
        shakeEnabled: featureConfig.shakeEnabled !== false,
        soundEnabled: featureConfig.soundEnabled === true,
      },
      state
    );
  };

  const harness = createFeatureMountHarness(context, {
    isSupported: ({ documentRef: nextDocumentRef }) => Boolean(nextDocumentRef && domGuards),
    update,
  });
  if (!harness) {
    domGuards.removeNodeById(STYLE_ID);
    return () => {};
  }

  harness.registerObserver({
    key: OBSERVER_KEY,
    callback: () => harness.schedule(),
    observeOptions: {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["class"],
    },
  });
  harness.subscribeToGameState();
  if (featureConfig.soundEnabled === true && windowRef) {
    harness.registerListeners([
      {
        key: LISTENER_KEYS.unlockPointer,
        target: windowRef,
        type: "pointerdown",
        handler: (event) => {
          if (!isXConfigPanelEvent(event)) {
            tryUnlockBustGlassCrackAudio(state);
          }
        },
        options: { passive: true, capture: true },
      },
      {
        key: LISTENER_KEYS.unlockKey,
        target: windowRef,
        type: "keydown",
        handler: (event) => {
          if (!isXConfigPanelEvent(event)) {
            tryUnlockBustGlassCrackAudio(state);
          }
        },
        options: { capture: true },
      },
    ]);
    tryUnlockBustGlassCrackAudio(state);
  }
  harness.schedule();

  return harness.createCleanup(() => {
    clearBustActivePlayerHighlightState(state, windowRef);
    domGuards.removeNodeById(STYLE_ID);
  });
}

function ensureBustPreviewStyle(documentRef, domGuards = null) {
  if (!documentRef) {
    return;
  }
  if (domGuards && typeof domGuards.ensureStyle === "function") {
    domGuards.ensureStyle(STYLE_ID, buildStyleText());
    return;
  }
  if (documentRef.getElementById?.(STYLE_ID)) {
    return;
  }
  const styleNode = documentRef.createElement?.("style");
  if (!styleNode) {
    return;
  }
  styleNode.id = STYLE_ID;
  styleNode.textContent = buildStyleText();
  (documentRef.head || documentRef.documentElement)?.appendChild?.(styleNode);
}

export async function runX01BustActivePlayerHighlightAction(actionContext = {}) {
  const actionId = String(actionContext.actionId || "").trim().toLowerCase();
  if (actionId !== "preview") {
    throw new Error(`Unsupported X01 Bust Active Player Highlight action: ${actionId || "unknown"}`);
  }

  const documentRef = actionContext.context?.documentRef || null;
  const windowRef = actionContext.context?.windowRef || null;
  const targetRoot = actionContext.actionTarget || null;
  const targetNode =
    targetRoot?.querySelector?.("[data-adxconfig-x01-bust-active-player-preview-card='true']") ||
    targetRoot;

  ensureBustPreviewStyle(documentRef, actionContext.context?.domGuards || null);
  runBustActivePlayerHighlightPreview({
    documentRef,
    windowRef,
    targetNode,
    crackCount: actionContext.featureConfig?.crackCount,
    shakeEnabled: actionContext.featureConfig?.shakeEnabled !== false,
    soundEnabled: actionContext.featureConfig?.soundEnabled === true,
  });
  const setTimeoutRef =
    windowRef && typeof windowRef.setTimeout === "function"
      ? windowRef.setTimeout.bind(windowRef)
      : setTimeout;
  await new Promise((resolve) => setTimeoutRef(resolve, SHAKE_DURATION_MS));
}

export const initializeX01BustActivePlayerHighlight = mountX01BustActivePlayerHighlight;
export const initialize = mountX01BustActivePlayerHighlight;
export const mount = mountX01BustActivePlayerHighlight;
