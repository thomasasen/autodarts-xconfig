import {
  clearSingleBullSoundState,
  createSingleBullSoundState,
  installSingleBullSoundPolling,
  tryUnlockSingleBullAudio,
  updateSingleBullSound,
} from "./logic.js";
import { resolveSingleBullSoundConfig } from "./style.js";

const FEATURE_KEY = "single-bull-sound";
const OBSERVER_KEY = `${FEATURE_KEY}:dom-observer`;
const LISTENER_KEYS = Object.freeze({
  unlockPointer: `${FEATURE_KEY}:unlock-pointerdown`,
  unlockKey: `${FEATURE_KEY}:unlock-keydown`,
  visibility: `${FEATURE_KEY}:document-visibility`,
});

export function initializeSingleBullSound(context = {}) {
  const documentRef = context.documentRef || (typeof document !== "undefined" ? document : null);
  const windowRef = context.windowRef || (typeof window !== "undefined" ? window : null);
  const observerRegistry = context.registries?.observers;
  const listenerRegistry = context.registries?.listeners;
  const eventBus = context.eventBus;
  const gameState = context.gameState;
  const x01Rules = context.domain?.x01Rules;
  const config = context.config;
  const schedulerFactory = context.helpers?.createRafScheduler;

  if (!documentRef || !windowRef || !x01Rules || typeof schedulerFactory !== "function") {
    return () => {};
  }

  const featureConfig =
    config && typeof config.getFeatureConfig === "function"
      ? config.getFeatureConfig("singleBullSound")
      : {
          volume: 0.9,
          cooldownMs: 700,
          pollIntervalMs: 0,
        };

  const soundConfig = resolveSingleBullSoundConfig(featureConfig);
  const state = createSingleBullSoundState(windowRef, soundConfig);

  function update() {
    updateSingleBullSound({
      documentRef,
      gameState,
      x01Rules,
      state,
      config: soundConfig,
    });
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
        characterData: true,
      },
      MutationObserverRef: windowRef?.MutationObserver,
    });
  }

  if (listenerRegistry && typeof listenerRegistry.register === "function") {
    listenerRegistry.register({
      key: LISTENER_KEYS.unlockPointer,
      target: windowRef,
      type: "pointerdown",
      handler: () => tryUnlockSingleBullAudio(state),
      options: { passive: true, capture: true },
    });
    listenerRegistry.register({
      key: LISTENER_KEYS.unlockKey,
      target: windowRef,
      type: "keydown",
      handler: () => tryUnlockSingleBullAudio(state),
      options: { capture: true },
    });
    listenerRegistry.register({
      key: LISTENER_KEYS.visibility,
      target: documentRef,
      type: "visibilitychange",
      handler: () => scheduler.schedule(),
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

  installSingleBullSoundPolling(state, () => scheduler.schedule(), soundConfig.pollIntervalMs);

  tryUnlockSingleBullAudio(state);
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

    clearSingleBullSoundState(state);
  };
}

export const mountSingleBullSound = initializeSingleBullSound;
export const initialize = initializeSingleBullSound;
export const mount = initializeSingleBullSound;
