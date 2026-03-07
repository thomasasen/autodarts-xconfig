import {
  clearRemoveDartsNotificationState,
  createRemoveDartsNotificationState,
  updateRemoveDartsNotification,
} from "./logic.js";
import {
  STYLE_ID,
  buildStyleText,
  resolveRemoveDartsNotificationConfig,
} from "./style.js";

const FEATURE_KEY = "remove-darts-notification";
const OBSERVER_KEY = `${FEATURE_KEY}:dom-observer`;

export function initializeRemoveDartsNotification(context = {}) {
  const documentRef = context.documentRef || (typeof document !== "undefined" ? document : null);
  const windowRef = context.windowRef || (typeof window !== "undefined" ? window : null);
  const domGuards = context.domGuards;
  const observerRegistry = context.registries?.observers;
  const eventBus = context.eventBus;
  const gameState = context.gameState;
  const config = context.config;
  const schedulerFactory = context.helpers?.createRafScheduler;

  if (!documentRef || !domGuards || typeof schedulerFactory !== "function") {
    return () => {};
  }

  const featureConfig =
    config && typeof config.getFeatureConfig === "function"
      ? config.getFeatureConfig("removeDartsNotification")
      : {
          imageSize: "standard",
          pulseAnimation: true,
          pulseScale: 1.04,
        };

  const visualConfig = resolveRemoveDartsNotificationConfig(featureConfig);
  domGuards.ensureStyle(STYLE_ID, buildStyleText(visualConfig));

  const state = createRemoveDartsNotificationState();

  function update() {
    updateRemoveDartsNotification({
      documentRef,
      state,
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
        attributes: true,
      },
      MutationObserverRef: windowRef?.MutationObserver,
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

    clearRemoveDartsNotificationState(state);
    domGuards.removeNodeById(STYLE_ID);
  };
}

export const mountRemoveDartsNotification = initializeRemoveDartsNotification;
export const initialize = initializeRemoveDartsNotification;
export const mount = initializeRemoveDartsNotification;
