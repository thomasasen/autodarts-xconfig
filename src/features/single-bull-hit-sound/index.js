import {
  clearSingleBullHitSoundState,
  createSingleBullHitSoundState,
  installSingleBullHitSoundPolling,
  playSingleBullHitSoundPreview,
  tryUnlockSingleBullAudio,
  updateSingleBullHitSound,
} from "./logic.js";
import { resolveSingleBullHitSoundConfig } from "./style.js";
import { createFeatureMountHarness } from "../shared/feature-mount-harness.js";
import {
  createTurnSurfaceObserveOptions,
  hasRelevantTurnSurfaceMutation,
} from "../shared/turn-surface-adapter.js";

const FEATURE_KEY = "single-bull-hit-sound";
const OBSERVER_KEY = `${FEATURE_KEY}:dom-observer`;
const LISTENER_KEYS = Object.freeze({
  unlockPointer: `${FEATURE_KEY}:unlock-pointerdown`,
  unlockKey: `${FEATURE_KEY}:unlock-keydown`,
  visibility: `${FEATURE_KEY}:document-visibility`,
});

export function initializeSingleBullHitSound(context = {}) {
  const documentRef = context.documentRef || (typeof document !== "undefined" ? document : null);
  const windowRef = context.windowRef || (globalThis.window !== undefined ? globalThis.window : null);
  const gameState = context.gameState;
  const x01Rules = context.domain?.x01Rules;
  const config = context.config;

  if (!documentRef || !windowRef || !x01Rules) {
    return () => {};
  }

  const featureConfig =
    config && typeof config.getFeatureConfig === "function"
      ? config.getFeatureConfig("singleBullHitSound")
      : {
          volume: 0.9,
          cooldownMs: 700,
          pollIntervalMs: 0,
        };

  const soundConfig = resolveSingleBullHitSoundConfig(featureConfig);
  const state = createSingleBullHitSoundState(windowRef, soundConfig);

  function update() {
    updateSingleBullHitSound({
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
    callback: (mutations = []) => {
      if (hasRelevantTurnSurfaceMutation(mutations)) {
        scheduleUpdate();
      }
    },
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

  installSingleBullHitSoundPolling(state, () => {
    if (documentRef.visibilityState === "hidden") {
      return;
    }
    scheduleUpdate();
  }, soundConfig.pollIntervalMs);

  tryUnlockSingleBullAudio(state);
  harness.schedule();

  return harness.createCleanup(() => {
    clearSingleBullHitSoundState(state);
  });
}

export async function runSingleBullHitSoundAction(actionContext = {}) {
  const actionId = String(actionContext.actionId || "").trim().toLowerCase();
  if (actionId !== "preview") {
    throw new Error(`Unsupported Single Bull Hit Sound action: ${actionId || "unknown"}`);
  }

  const windowRef =
    actionContext.context?.windowRef ||
    (globalThis.window !== undefined ? globalThis.window : null);
  const soundConfig = resolveSingleBullHitSoundConfig(actionContext.featureConfig || {});
  return playSingleBullHitSoundPreview({
    windowRef,
    config: soundConfig,
  });
}

export const mountSingleBullHitSound = initializeSingleBullHitSound;
export const initialize = initializeSingleBullHitSound;
export const mount = initializeSingleBullHitSound;
