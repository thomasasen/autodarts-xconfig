import {
  clearSingleBullSoundState,
  createSingleBullSoundState,
  installSingleBullSoundPolling,
  tryUnlockSingleBullAudio,
  updateSingleBullSound,
} from "./logic.js";
import { resolveSingleBullSoundConfig } from "./style.js";
import { createFeatureMountHarness } from "../shared/feature-mount-harness.js";
import { createTurnSurfaceObserveOptions } from "../shared/turn-surface-adapter.js";

const FEATURE_KEY = "single-bull-sound";
const OBSERVER_KEY = `${FEATURE_KEY}:dom-observer`;
const LISTENER_KEYS = Object.freeze({
  unlockPointer: `${FEATURE_KEY}:unlock-pointerdown`,
  unlockKey: `${FEATURE_KEY}:unlock-keydown`,
  visibility: `${FEATURE_KEY}:document-visibility`,
});

export function initializeSingleBullSound(context = {}) {
  const documentRef = context.documentRef || (typeof document !== "undefined" ? document : null);
  const windowRef = context.windowRef || (typeof globalThis.window !== "undefined" ? globalThis.window : null);
  const gameState = context.gameState;
  const x01Rules = context.domain?.x01Rules;
  const config = context.config;

  if (!documentRef || !windowRef || !x01Rules) {
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

  const harness = createFeatureMountHarness(context, {
    isSupported: ({ documentRef: nextDocumentRef, windowRef: nextWindowRef }) =>
      Boolean(nextDocumentRef && nextWindowRef && x01Rules),
    update,
  });
  if (!harness) {
    return () => {};
  }

  const scheduleUpdate = () => harness.schedule();
  harness.registerObserver({
    key: OBSERVER_KEY,
    callback: scheduleUpdate,
    observeOptions: createTurnSurfaceObserveOptions(),
  });

  harness.registerListeners([
    {
      key: LISTENER_KEYS.unlockPointer,
      target: windowRef,
      type: "pointerdown",
      handler: () => tryUnlockSingleBullAudio(state),
      options: { passive: true, capture: true },
    },
    {
      key: LISTENER_KEYS.unlockKey,
      target: windowRef,
      type: "keydown",
      handler: () => tryUnlockSingleBullAudio(state),
      options: { capture: true },
    },
    {
      key: LISTENER_KEYS.visibility,
      target: documentRef,
      type: "visibilitychange",
      handler: scheduleUpdate,
    },
  ]);

  harness.subscribeToGameState(scheduleUpdate);

  installSingleBullSoundPolling(state, () => {
    if (documentRef.visibilityState === "hidden") {
      return;
    }
    scheduleUpdate();
  }, soundConfig.pollIntervalMs);

  tryUnlockSingleBullAudio(state);
  harness.schedule();

  return harness.createCleanup(() => {
    clearSingleBullSoundState(state);
  });
}

export const mountSingleBullSound = initializeSingleBullSound;
export const initialize = initializeSingleBullSound;
export const mount = initializeSingleBullSound;
