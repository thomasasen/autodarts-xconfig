import {
  clearRemoveDartsNotificationState,
  createRemoveDartsNotificationState,
  requestImmediateFallbackScan,
  updateRemoveDartsNotification,
} from "./logic.js";
import {
  IMAGE_CLASS,
  STYLE_ID,
  buildStyleText,
  resolveRemoveDartsNotificationConfig,
} from "./style.js";
import { createManagedNodeMatcher, hasExternalDomMutation } from "../../core/dom-mutation-filter.js";

const FEATURE_KEY = "remove-darts-notification";
const OBSERVER_KEY = `${FEATURE_KEY}:dom-observer`;

export function initializeRemoveDartsNotification(context = {}) {
  const documentRef = context.documentRef || (typeof document !== "undefined" ? document : null);
  const windowRef = context.windowRef || (typeof window !== "undefined" ? window : null);
  const domGuards = context.domGuards;
  const observerRegistry = context.registries?.observers;
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
  const isManagedNode = createManagedNodeMatcher({
    classNames: [IMAGE_CLASS],
  });

  if (observerRegistry && typeof observerRegistry.registerMutationObserver === "function") {
    observerRegistry.registerMutationObserver({
      key: OBSERVER_KEY,
      target: rootNode,
      callback: (mutations = []) => {
        if (!hasExternalDomMutation(mutations, isManagedNode)) {
          return;
        }
        requestImmediateFallbackScan(state);
        scheduler.schedule();
      },
      observeOptions: {
        childList: true,
        subtree: true,
        characterData: true,
      },
      MutationObserverRef: windowRef?.MutationObserver,
    });
  }

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
