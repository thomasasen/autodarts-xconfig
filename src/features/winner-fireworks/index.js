import { ensureConfettiLoaded, getConfetti } from "../../vendors/index.js";
import {
  createWinnerFireworksState,
  getWinnerSignal,
  startWinnerFireworks,
  stopWinnerFireworks,
  syncWinnerFireworks,
} from "./logic.js";
import { STYLE_ID, buildStyleText, resolveWinnerVisualConfig } from "./style.js";

const FEATURE_KEY = "winner-fireworks";
const OBSERVER_KEY = `${FEATURE_KEY}:dom-observer`;
const PREVIEW_STYLE_ID = `${STYLE_ID}-preview`;
const PREVIEW_OVERLAY_ID = "ad-ext-winner-fireworks-preview";
const PREVIEW_BASE_DURATION_MS = 2900;
const LISTENER_KEYS = Object.freeze({
  resize: `${FEATURE_KEY}:window-resize`,
  visibility: `${FEATURE_KEY}:document-visibility`,
  pointerDown: `${FEATURE_KEY}:window-pointerdown`,
});
const previewSessionByWindow = new WeakMap();

function getPreviewDurationMs(visualConfig) {
  return Math.max(
    900,
    Math.round(PREVIEW_BASE_DURATION_MS * Number(visualConfig?.intensityPreset?.intervalScale || 1))
  );
}

function clearWinnerFireworksPreview(windowRef, session) {
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

  stopWinnerFireworks(session.state);
  session.domGuards?.removeNodeById?.(session.styleId);

  if (previewSessionByWindow.get(windowRef) === session) {
    previewSessionByWindow.delete(windowRef);
  }
}

async function runWinnerFireworksPreview(actionContext = {}) {
  const context = actionContext.context || actionContext;
  const documentRef = context.documentRef || (typeof document !== "undefined" ? document : null);
  const windowRef = context.windowRef || (typeof window !== "undefined" ? window : null);
  const domGuards = context.domGuards || null;

  if (!documentRef || !windowRef || !domGuards) {
    throw new Error("Winner Fireworks preview is not available in this environment.");
  }

  const previousSession = previewSessionByWindow.get(windowRef);
  if (previousSession) {
    clearWinnerFireworksPreview(windowRef, previousSession);
  }

  const featureConfig =
    actionContext.featureConfig && typeof actionContext.featureConfig === "object"
      ? actionContext.featureConfig
      : context.config?.getFeatureConfig?.("winnerFireworks") || {};
  const visualConfig = resolveWinnerVisualConfig(featureConfig);

  domGuards.ensureStyle(PREVIEW_STYLE_ID, buildStyleText({ overlayId: PREVIEW_OVERLAY_ID }));

  const session = {
    state: createWinnerFireworksState({
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

  startWinnerFireworks(session.state);
  if (!session.state.running) {
    clearWinnerFireworksPreview(windowRef, session);
    throw new Error("Winner Fireworks preview could not initialize.");
  }

  if (visualConfig.pointerDismiss && typeof windowRef.addEventListener === "function") {
    session.pointerOptions = { passive: true, capture: true };
    session.pointerHandler = () => {
      clearWinnerFireworksPreview(windowRef, session);
    };
    windowRef.addEventListener("pointerdown", session.pointerHandler, session.pointerOptions);
  }

  const setTimeoutRef =
    windowRef && typeof windowRef.setTimeout === "function"
      ? windowRef.setTimeout.bind(windowRef)
      : setTimeout;
  const durationMs = getPreviewDurationMs(visualConfig);
  session.timeoutHandle = setTimeoutRef(() => {
    clearWinnerFireworksPreview(windowRef, session);
  }, durationMs);

  return {
    ok: true,
    actionId: "preview",
    durationMs,
  };
}

export function initializeWinnerFireworks(context = {}) {
  const documentRef = context.documentRef || (typeof document !== "undefined" ? document : null);
  const windowRef = context.windowRef || (typeof window !== "undefined" ? window : null);
  const domGuards = context.domGuards;
  const observerRegistry = context.registries?.observers;
  const listenerRegistry = context.registries?.listeners;
  const eventBus = context.eventBus;
  const gameState = context.gameState;
  const config = context.config;
  const schedulerFactory = context.helpers?.createRafScheduler;

  if (!documentRef || !windowRef || !domGuards || typeof schedulerFactory !== "function") {
    return () => {};
  }

  const featureConfig =
    config && typeof config.getFeatureConfig === "function"
      ? config.getFeatureConfig("winnerFireworks")
      : {
          style: "realistic",
          colorTheme: "autodarts",
          intensity: "standard",
          includeBullOut: true,
          pointerDismiss: true,
        };

  const visualConfig = resolveWinnerVisualConfig(featureConfig);
  domGuards.ensureStyle(STYLE_ID, buildStyleText());

  const state = createWinnerFireworksState({
    documentRef,
    windowRef,
    domGuards,
    visualConfig,
    confettiFactory: getConfetti(windowRef),
  });

  function update() {
    const signal = getWinnerSignal({
      documentRef,
      gameState,
      visualConfig,
    });
    syncWinnerFireworks(state, signal);
  }

  const scheduler = schedulerFactory(update, { windowRef });
  const rootNode = documentRef.documentElement || documentRef.body || documentRef;
  if (observerRegistry && typeof observerRegistry.registerMutationObserver === "function") {
    observerRegistry.registerMutationObserver({
      key: OBSERVER_KEY,
      target: rootNode,
      callback: () => scheduler.schedule(),
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
        stopWinnerFireworks(state);
      },
      options: { passive: true, capture: true },
    });
  }

  const unsubscribeEventBus =
    eventBus && typeof eventBus.on === "function"
      ? eventBus.on("game-state:updated", () => scheduler.schedule())
      : () => {};
  const unsubscribeGameState =
    gameState && typeof gameState.subscribe === "function"
      ? gameState.subscribe(() => scheduler.schedule())
      : () => {};

  ensureConfettiLoaded(windowRef).then((confettiFactory) => {
    if (!confettiFactory) {
      return;
    }
    state.confettiFactory = confettiFactory;
    if (state.lastSignalActive && !state.running && !state.dismissedForCurrentWin) {
      startWinnerFireworks(state);
    }
  });

  scheduler.schedule();
  let cleanedUp = false;

  return function cleanup() {
    if (cleanedUp) {
      return;
    }
    cleanedUp = true;
    scheduler.cancel();

    try {
      unsubscribeEventBus();
    } catch (_) {
      // fail-soft
    }
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

    clearWinnerFireworksPreview(windowRef, previewSessionByWindow.get(windowRef) || null);
    stopWinnerFireworks(state);
    domGuards.removeNodeById(STYLE_ID);
  };
}

export async function runWinnerFireworksAction(actionContext = {}) {
  const actionId = String(actionContext.actionId || "").trim().toLowerCase();
  if (actionId !== "preview") {
    throw new Error(`Unsupported Winner Fireworks action: ${actionId || "unknown"}`);
  }

  return runWinnerFireworksPreview(actionContext);
}

export const mountWinnerFireworks = initializeWinnerFireworks;
export const initialize = initializeWinnerFireworks;
export const mount = initializeWinnerFireworks;
