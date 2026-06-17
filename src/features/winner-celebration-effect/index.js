import { ensureConfettiLoaded, getConfetti } from "../../vendors/index.js";
import {
  createWinnerCelebrationEffectState,
  getWinnerSignal,
  startWinnerCelebrationEffect,
  stopWinnerCelebrationEffect,
  syncWinnerCelebrationEffect,
} from "./logic.js";
import { OVERLAY_ID, STYLE_ID, buildStyleText, resolveWinnerVisualConfig } from "./style.js";
import { createManagedNodeMatcher, hasExternalDomMutation } from "../../core/dom-mutation-filter.js";

const FEATURE_KEY = "winner-celebration-effect";
const OBSERVER_KEY = `${FEATURE_KEY}:dom-observer`;
const PREVIEW_STYLE_ID = `${STYLE_ID}-preview`;
const PREVIEW_OVERLAY_ID = "ad-ext-winner-celebration-effect-preview";
const LISTENER_KEYS = Object.freeze({
  resize: `${FEATURE_KEY}:window-resize`,
  visibility: `${FEATURE_KEY}:document-visibility`,
  pointerDown: `${FEATURE_KEY}:window-pointerdown`,
});
const previewSessionByWindow = new WeakMap();

function getPreviewDurationMs(visualConfig) {
  const durationSeconds = Number(visualConfig?.durationSeconds);
  return Math.max(900, [1, 2, 5].includes(durationSeconds) ? durationSeconds * 1000 : 5000);
}

function clearWinnerCelebrationEffectPreview(windowRef, session) {
  if (!session) {
    return;
  }

  const clearTimeoutRef =
    windowRef && typeof windowRef.clearTimeout === "function"
      ? windowRef.clearTimeout.bind(windowRef)
      : clearTimeout;

  if (session.timeoutHandle) {
    clearTimeoutRef(session.timeoutHandle);
    session.timeoutHandle = 0;
  }

  if (
    session.pointerHandler &&
    windowRef &&
    typeof windowRef.removeEventListener === "function"
  ) {
    windowRef.removeEventListener("pointerdown", session.pointerHandler, session.pointerOptions);
  }

  stopWinnerCelebrationEffect(session.state);
  session.domGuards?.removeNodeById?.(session.styleId);

  if (previewSessionByWindow.get(windowRef) === session) {
    previewSessionByWindow.delete(windowRef);
  }
}

async function runWinnerCelebrationEffectPreview(actionContext = {}) {
  const context = actionContext.context || actionContext;
  const documentRef = context.documentRef || (typeof document !== "undefined" ? document : null);
  const windowRef = context.windowRef || (globalThis.window !== undefined ? globalThis.window : null);
  const domGuards = context.domGuards || null;

  if (!documentRef || !windowRef || !domGuards) {
    throw new Error("Winner Celebration Effect preview is not available in this environment.");
  }

  const previousSession = previewSessionByWindow.get(windowRef);
  if (previousSession) {
    clearWinnerCelebrationEffectPreview(windowRef, previousSession);
  }

  const featureConfig =
    actionContext.featureConfig && typeof actionContext.featureConfig === "object"
      ? actionContext.featureConfig
      : context.config?.getFeatureConfig?.("winnerCelebrationEffect") || {};
  const visualConfig = resolveWinnerVisualConfig(featureConfig);

  domGuards.ensureStyle(PREVIEW_STYLE_ID, buildStyleText({ overlayId: PREVIEW_OVERLAY_ID }));

  const session = {
    state: createWinnerCelebrationEffectState({
      documentRef,
      windowRef,
      domGuards,
      visualConfig,
      overlayId: PREVIEW_OVERLAY_ID,
      confettiFactory: getConfetti(windowRef),
    }),
    domGuards,
    styleId: PREVIEW_STYLE_ID,
    timeoutHandle: 0,
    pointerHandler: null,
    pointerOptions: null,
  };

  previewSessionByWindow.set(windowRef, session);

  const loadedConfetti = await ensureConfettiLoaded(windowRef);
  if (previewSessionByWindow.get(windowRef) !== session) {
    return {
      ok: false,
      actionId: "preview",
      reason: "superseded",
    };
  }

  if (loadedConfetti) {
    session.state.confettiFactory = loadedConfetti;
  }

  startWinnerCelebrationEffect(session.state);
  if (!session.state.running) {
    clearWinnerCelebrationEffectPreview(windowRef, session);
    throw new Error("Winner Celebration Effect preview could not initialize.");
  }

  if (visualConfig.pointerDismiss && typeof windowRef.addEventListener === "function") {
    session.pointerOptions = { passive: true, capture: true };
    session.pointerHandler = () => {
      clearWinnerCelebrationEffectPreview(windowRef, session);
    };
    windowRef.addEventListener("pointerdown", session.pointerHandler, session.pointerOptions);
  }

  const setTimeoutRef =
    windowRef && typeof windowRef.setTimeout === "function"
      ? windowRef.setTimeout.bind(windowRef)
      : setTimeout;
  const durationMs = getPreviewDurationMs(visualConfig);
  session.timeoutHandle = setTimeoutRef(() => {
    clearWinnerCelebrationEffectPreview(windowRef, session);
  }, durationMs);

  return {
    ok: true,
    actionId: "preview",
    durationMs,
  };
}

export function initializeWinnerCelebrationEffect(context = {}) {
  const documentRef = context.documentRef || (typeof document !== "undefined" ? document : null);
  const windowRef = context.windowRef || (globalThis.window !== undefined ? globalThis.window : null);
  const domGuards = context.domGuards;
  const observerRegistry = context.registries?.observers;
  const listenerRegistry = context.registries?.listeners;
  const gameState = context.gameState;
  const config = context.config;
  const schedulerFactory = context.helpers?.createRafScheduler;

  if (!documentRef || !windowRef || !domGuards || typeof schedulerFactory !== "function") {
    return () => {};
  }

  const featureConfig =
    config && typeof config.getFeatureConfig === "function"
      ? config.getFeatureConfig("winnerCelebrationEffect")
      : {
          style: "center-side-burst",
          colorTheme: "autodarts",
          intensity: "standard",
          durationSeconds: 5,
          particleAmount: "optimiert",
          includeBullOut: true,
          pointerDismiss: true,
        };

  const visualConfig = resolveWinnerVisualConfig(featureConfig);
  domGuards.ensureStyle(STYLE_ID, buildStyleText());

  const state = createWinnerCelebrationEffectState({
    documentRef,
    windowRef,
    domGuards,
    visualConfig,
    confettiFactory: getConfetti(windowRef),
  });
  const isManagedNode = createManagedNodeMatcher({
    ids: [OVERLAY_ID],
  });

  function update() {
    const signal = getWinnerSignal({
      documentRef,
      gameState,
      visualConfig,
    });
    syncWinnerCelebrationEffect(state, signal);
  }

  const scheduler = schedulerFactory(update, { windowRef });
  const rootNode = documentRef.documentElement || documentRef.body || documentRef;
  if (observerRegistry && typeof observerRegistry.registerMutationObserver === "function") {
    observerRegistry.registerMutationObserver({
      key: OBSERVER_KEY,
      target: rootNode,
      callback: (mutations = []) => {
        if (!hasExternalDomMutation(mutations, isManagedNode)) {
          return;
        }
        scheduler.schedule();
      },
      observeOptions: {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["class", "style"],
      },
      MutationObserverRef: windowRef?.MutationObserver,
    });
  }

  if (listenerRegistry && typeof listenerRegistry.register === "function") {
    listenerRegistry.register({
      key: LISTENER_KEYS.resize,
      target: windowRef,
      type: "resize",
      handler: () => scheduler.schedule(),
      options: { passive: true },
    });
    listenerRegistry.register({
      key: LISTENER_KEYS.visibility,
      target: documentRef,
      type: "visibilitychange",
      handler: () => scheduler.schedule(),
    });
    listenerRegistry.register({
      key: LISTENER_KEYS.pointerDown,
      target: windowRef,
      type: "pointerdown",
      handler: () => {
        if (!visualConfig.pointerDismiss || !state.running) {
          return;
        }
        state.dismissedForCurrentWin = true;
        stopWinnerCelebrationEffect(state);
      },
      options: { passive: true, capture: true },
    });
  }

  const unsubscribeGameState =
    gameState && typeof gameState.subscribe === "function"
      ? gameState.subscribe(() => scheduler.schedule())
      : () => {};

  let disposed = false;
  ensureConfettiLoaded(windowRef).then((confettiFactory) => {
    if (disposed || !confettiFactory) {
      return;
    }
    state.confettiFactory = confettiFactory;
    if (state.lastSignalActive && !state.running && !state.dismissedForCurrentWin) {
      startWinnerCelebrationEffect(state);
    }
  });

  scheduler.schedule();
  let cleanedUp = false;

  return function cleanup() {
    if (cleanedUp) {
      return;
    }
    cleanedUp = true;
    disposed = true;
    scheduler.cancel();

    try {
      unsubscribeGameState();
    } catch (_) {
      // fail-soft
    }

    if (observerRegistry && typeof observerRegistry.disconnect === "function") {
      observerRegistry.disconnect(OBSERVER_KEY);
    }
    if (listenerRegistry && typeof listenerRegistry.remove === "function") {
      Object.values(LISTENER_KEYS).forEach((key) => listenerRegistry.remove(key));
    }

    clearWinnerCelebrationEffectPreview(windowRef, previewSessionByWindow.get(windowRef) || null);
    stopWinnerCelebrationEffect(state);
    domGuards.removeNodeById(STYLE_ID);
  };
}

export async function runWinnerCelebrationEffectAction(actionContext = {}) {
  const actionId = String(actionContext.actionId || "").trim().toLowerCase();
  if (actionId !== "preview") {
    throw new Error(`Unsupported Winner Celebration Effect action: ${actionId || "unknown"}`);
  }

  return runWinnerCelebrationEffectPreview(actionContext);
}

export const mountWinnerCelebrationEffect = initializeWinnerCelebrationEffect;
export const initialize = initializeWinnerCelebrationEffect;
export const mount = initializeWinnerCelebrationEffect;
