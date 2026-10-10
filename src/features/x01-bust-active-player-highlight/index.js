import {
  clearBustActivePlayerHighlightState,
  createBustActivePlayerHighlightState,
  dismissBustSurfaceHighlightForEvent,
  ensureBustGlassCrackAudio,
  normalizeBustEffectTarget,
  refreshBustImpactOrigin,
  runBustActivePlayerHighlightPreview,
  syncBustActivePlayerHighlight,
  syncBustGifVisibility,
  tryUnlockBustGlassCrackAudio,
} from "./logic.js";
import { STYLE_ID, buildStyleText } from "./style.js";
import { createFeatureMountHarness } from "../shared/feature-mount-harness.js";
import { createX01PlayerSurfaceObserverController } from "../shared/x01-player-surface-adapter.js";
import { acquireToolsAnimationLayerController, isToolsAnimationActive } from "../shared/tools-animation-layer-controller.js";

const FEATURE_KEY = "x01-bust-active-player-highlight";
const OBSERVER_KEY = `${FEATURE_KEY}:dom-observer`;
const TARGET_OBSERVER_KEY = `${FEATURE_KEY}:target-observer`;
const XCONFIG_PANEL_SELECTOR = "#ad-xconfig-panel-host";
const IMPACT_ORIGIN_TRACKING_FRAMES = 60;
const ZOOM_CLASS = "ad-ext-tv-board-zoom";
const ZOOM_HOST_CLASS = "ad-ext-tv-board-zoom-host";
const LISTENER_KEYS = Object.freeze({
  unlockPointer: `${FEATURE_KEY}:unlock-pointerdown`,
  unlockKey: `${FEATURE_KEY}:unlock-keydown`,
  dismissClick: `${FEATURE_KEY}:dismiss-click`,
  transitionRun: `${FEATURE_KEY}:zoom-transition-run`,
  transitionEnd: `${FEATURE_KEY}:zoom-transition-end`,
  transitionCancel: `${FEATURE_KEY}:zoom-transition-cancel`,
});
const previewCleanupByRoot = new WeakMap();

function isXConfigPanelEvent(event) {
  const target = event?.target || null;
  return Boolean(target && typeof target.closest === "function" && target.closest(XCONFIG_PANEL_SELECTOR));
}

function isZoomTransformTransition(event) {
  if (String(event?.propertyName || "") !== "transform") {
    return false;
  }
  const target = event?.target || null;
  if (
    target?.classList?.contains?.(ZOOM_CLASS) ||
    target?.classList?.contains?.(ZOOM_HOST_CLASS)
  ) {
    return true;
  }
  return Boolean(target?.closest?.(`.${ZOOM_CLASS}, .${ZOOM_HOST_CLASS}`));
}

export function mountX01BustActivePlayerHighlight(context = {}) {
  const documentRef = context.documentRef || (typeof document !== "undefined" ? document : null);
  const windowRef = context.windowRef || (globalThis.window !== undefined ? globalThis.window : null);
  const domGuards = context.domGuards;
  const featureConfig =
    context.config && typeof context.config.getFeatureConfig === "function"
      ? context.config.getFeatureConfig("x01BustActivePlayerHighlight")
      : { effectTarget: "player-card", crackCount: 2, soundEnabled: false };
  const effectTarget = normalizeBustEffectTarget(featureConfig.effectTarget);

  if (!documentRef || !domGuards) {
    return () => {};
  }

  domGuards.ensureStyle(STYLE_ID, buildStyleText());

  const state = createBustActivePlayerHighlightState();
  if (featureConfig.soundEnabled === true) {
    ensureBustGlassCrackAudio(state, windowRef);
  }
  const syncContext = {
    ...context,
    documentRef,
    windowRef,
    effectTarget,
    crackCount: featureConfig.crackCount,
    soundEnabled: featureConfig.soundEnabled === true,
  };
  let impactTrackingFrameId = 0;
  let impactTrackingFramesRemaining = 0;
  let impactZoomTransitionActive = false;
  const stopImpactOriginTracking = () => {
    if (impactTrackingFrameId && typeof windowRef?.cancelAnimationFrame === "function") {
      windowRef.cancelAnimationFrame(impactTrackingFrameId);
    }
    impactTrackingFrameId = 0;
    impactTrackingFramesRemaining = 0;
    impactZoomTransitionActive = false;
  };
  const trackImpactOrigin = () => {
    impactTrackingFrameId = 0;
    if (
      (!impactZoomTransitionActive && impactTrackingFramesRemaining <= 0) ||
      effectTarget !== "impact" ||
      !state.activeNode ||
      state.dismissedForCurrentBust
    ) {
      impactTrackingFramesRemaining = 0;
      return;
    }
    refreshBustImpactOrigin(syncContext, state);
    impactTrackingFramesRemaining -= 1;
    if (
      (impactZoomTransitionActive || impactTrackingFramesRemaining > 0) &&
      typeof windowRef?.requestAnimationFrame === "function"
    ) {
      impactTrackingFrameId = windowRef.requestAnimationFrame(trackImpactOrigin);
    }
  };
  const startImpactOriginTracking = () => {
    if (
      effectTarget !== "impact" ||
      !state.activeNode ||
      typeof windowRef?.requestAnimationFrame !== "function"
    ) {
      return;
    }
    impactTrackingFramesRemaining = IMPACT_ORIGIN_TRACKING_FRAMES;
    if (!impactTrackingFrameId) {
      impactTrackingFrameId = windowRef.requestAnimationFrame(trackImpactOrigin);
    }
  };
  const update = ({ rehydrating = false } = {}) => {
    const result = syncBustActivePlayerHighlight({ ...syncContext, soundEnabled: !rehydrating && syncContext.soundEnabled }, state);
    if (result.isBust && result.activeNode && effectTarget === "impact") {
      startImpactOriginTracking();
    } else {
      stopImpactOriginTracking();
    }
  };

  const harness = createFeatureMountHarness(context, {
    resetTurn() {
      stopImpactOriginTracking();
      clearBustActivePlayerHighlightState(state);
    },
    isSupported: ({ documentRef: nextDocumentRef }) => Boolean(nextDocumentRef && domGuards),
    update,
  });
  if (!harness) {
    domGuards.removeNodeById(STYLE_ID);
    return () => {};
  }

  const toolsAnimationLayers = acquireToolsAnimationLayerController({ documentRef, windowRef,
    onChange: (active) => syncBustGifVisibility(state, active) });
  harness.addCleanup(() => toolsAnimationLayers.release());

  harness.addCleanup(createX01PlayerSurfaceObserverController({
    documentRef,
    windowRef,
    observerRegistry: context.registries?.observers,
    MutationObserverRef: windowRef?.MutationObserver,
    keyPrefix: OBSERVER_KEY,
    includeModern: true,
    onSurfaceMutation: () => harness.schedule(),
    onSurfaceChange: () => harness.schedule(),
  }));
  if (effectTarget !== "player-card") {
    harness.registerObserver({
      key: TARGET_OBSERVER_KEY,
      observeOptions: { childList: true, subtree: true },
    });
    if (windowRef) {
      const surfaceListeners = [
        {
          key: LISTENER_KEYS.dismissClick,
          target: windowRef,
          type: "click",
          handler: (event) => {
            if (isToolsAnimationActive(documentRef)) {
              return;
            }
            if (dismissBustSurfaceHighlightForEvent(state, event)) {
              stopImpactOriginTracking();
            }
          },
          options: { capture: true },
        },
      ];
      if (effectTarget === "impact") {
        const startZoomTransitionTracking = (event) => {
          if (!isZoomTransformTransition(event) || !state.activeNode) {
            return;
          }
          impactZoomTransitionActive = true;
          startImpactOriginTracking();
        };
        const stopZoomTransitionTracking = (event) => {
          if (!isZoomTransformTransition(event)) {
            return;
          }
          impactZoomTransitionActive = false;
          impactTrackingFramesRemaining = 0;
          if (impactTrackingFrameId) {
            windowRef.cancelAnimationFrame?.(impactTrackingFrameId);
            impactTrackingFrameId = 0;
          }
          refreshBustImpactOrigin(syncContext, state);
        };
        surfaceListeners.push(
          {
            key: LISTENER_KEYS.transitionRun,
            target: documentRef,
            type: "transitionrun",
            handler: startZoomTransitionTracking,
          },
          {
            key: LISTENER_KEYS.transitionEnd,
            target: documentRef,
            type: "transitionend",
            handler: stopZoomTransitionTracking,
          },
          {
            key: LISTENER_KEYS.transitionCancel,
            target: documentRef,
            type: "transitioncancel",
            handler: stopZoomTransitionTracking,
          }
        );
      }
      harness.registerListeners(surfaceListeners);
    }
  }
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
    stopImpactOriginTracking();
    clearBustActivePlayerHighlightState(state);
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
  const effectTarget = normalizeBustEffectTarget(actionContext.featureConfig?.effectTarget);
  const targetSelectors = {
    "player-card": "[data-adxconfig-x01-bust-active-player-preview-card='true']",
    board: "[data-adxconfig-x01-bust-preview-board='true']",
    screen: "[data-adxconfig-x01-bust-preview-screen='true']",
    impact: "[data-adxconfig-x01-bust-preview-screen='true']",
  };
  const targetNode = targetRoot?.querySelector?.(targetSelectors[effectTarget]) || targetRoot;

  ensureBustPreviewStyle(documentRef, actionContext.context?.domGuards || null);
  if (targetRoot && typeof targetRoot === "object") {
    previewCleanupByRoot.get(targetRoot)?.();
  }
  const cleanup = runBustActivePlayerHighlightPreview({
    documentRef,
    windowRef,
    targetNode,
    effectTarget,
    crackCount: actionContext.featureConfig?.crackCount,
    soundEnabled: actionContext.featureConfig?.soundEnabled === true,
  });
  if (targetRoot && typeof targetRoot === "object" && typeof cleanup === "function") {
    previewCleanupByRoot.set(targetRoot, cleanup);
  }
}

export const initializeX01BustActivePlayerHighlight = mountX01BustActivePlayerHighlight;
export const initialize = mountX01BustActivePlayerHighlight;
export const mount = mountX01BustActivePlayerHighlight;
