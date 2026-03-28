import {
  clearRemoveDartsNotificationState,
  createRemoveDartsNotificationState,
  requestImmediateFallbackScan,
  updateRemoveDartsNotification,
} from "./logic.js";
import {
  CARD_CLASS,
  IMAGE_CLASS,
  OVERLAY_ROOT_CLASS,
  STYLE_ID,
  buildStyleText,
  resolveRemoveDartsNotificationConfig,
} from "./style.js";
import { createManagedNodeMatcher, hasExternalDomMutation } from "../../core/dom-mutation-filter.js";
import { createFeatureMountHarness } from "../shared/feature-mount-harness.js";

const FEATURE_KEY = "remove-darts-notification";
const OBSERVER_KEY = `${FEATURE_KEY}:dom-observer`;

export function initializeRemoveDartsNotification(context = {}) {
  const documentRef = context.documentRef || (typeof document !== "undefined" ? document : null);
  const domGuards = context.domGuards;
  const config = context.config;

  if (!documentRef || !domGuards) {
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

  const harness = createFeatureMountHarness(context, {
    isSupported: ({ documentRef: nextDocumentRef }) => Boolean(nextDocumentRef && domGuards),
    update,
  });
  if (!harness) {
    return () => {};
  }

  const isManagedNode = createManagedNodeMatcher({
    classNames: [OVERLAY_ROOT_CLASS, CARD_CLASS, IMAGE_CLASS],
  });

  harness.registerObserver({
    key: OBSERVER_KEY,
    callback: (mutations = []) => {
      if (!hasExternalDomMutation(mutations, isManagedNode)) {
        return;
      }
      requestImmediateFallbackScan(state);
      harness.schedule();
    },
    observeOptions: {
      childList: true,
      subtree: true,
      characterData: true,
    },
  });
  harness.subscribeToGameState();
  harness.schedule();

  return harness.createCleanup(() => {
    clearRemoveDartsNotificationState(state);
    domGuards.removeNodeById(STYLE_ID);
  });
}

export const mountRemoveDartsNotification = initializeRemoveDartsNotification;
export const initialize = initializeRemoveDartsNotification;
export const mount = initializeRemoveDartsNotification;
