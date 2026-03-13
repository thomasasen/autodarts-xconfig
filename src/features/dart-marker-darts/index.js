import {
  clearDartMarkerDartsState,
  createDartMarkerDartsState,
  updateDartMarkerDarts,
} from "./logic.js";
import {
  DART_CLASS,
  OVERLAY_ID,
  STYLE_ID,
  buildStyleText,
  resolveDartMarkerDartsConfig,
} from "./style.js";
import { createManagedNodeMatcher, hasExternalDomMutation } from "../../core/dom-mutation-filter.js";

const FEATURE_KEY = "dart-marker-darts";
const OBSERVER_KEY = `${FEATURE_KEY}:dom-observer`;
const LISTENER_KEYS = Object.freeze({
  visibility: `${FEATURE_KEY}:document-visibility`,
  resize: `${FEATURE_KEY}:window-resize`,
  scroll: `${FEATURE_KEY}:window-scroll`,
  popstate: `${FEATURE_KEY}:window-popstate`,
  hashchange: `${FEATURE_KEY}:window-hashchange`,
  navigationCurrentEntry: `${FEATURE_KEY}:navigation-currententrychange`,
});
const LOCATION_POLL_INTERVAL_MS = 1000;

function getCurrentHref(windowRef) {
  if (!windowRef || !windowRef.location) {
    return "";
  }
  return String(windowRef.location.href || "").trim();
}

export function initializeDartMarkerDarts(context = {}) {
  const documentRef = context.documentRef || (typeof document !== "undefined" ? document : null);
  const windowRef = context.windowRef || (typeof window !== "undefined" ? window : null);
  const domGuards = context.domGuards;
  const observerRegistry = context.registries?.observers;
  const listenerRegistry = context.registries?.listeners;
  const gameState = context.gameState;
  const config = context.config;
  const schedulerFactory = context.helpers?.createRafScheduler;
  const featureDebug = context.featureDebug || null;

  if (!documentRef || !domGuards || typeof schedulerFactory !== "function") {
    return () => {};
  }

  const featureConfig =
    config && typeof config.getFeatureConfig === "function"
      ? config.getFeatureConfig("dartMarkerDarts")
      : {
          design: "autodarts",
          animateDarts: true,
          sizePercent: 100,
          hideOriginalMarkers: false,
          flightSpeed: "standard",
        };
  const visualConfig = resolveDartMarkerDartsConfig(featureConfig);

  if (featureDebug?.enabled) {
    featureDebug.log("init-config", {
      designKey: visualConfig.designKey,
      animateDarts: visualConfig.animateDarts,
      sizePercent: visualConfig.sizePercent,
      hideOriginalMarkers: visualConfig.hideOriginalMarkers,
      flightSpeed: visualConfig.flightSpeed,
      flightDurationMs: visualConfig.flightDurationMs,
    });
  }

  domGuards.ensureStyle(STYLE_ID, buildStyleText());

  const state = createDartMarkerDartsState(windowRef);
  state.lastHref = getCurrentHref(windowRef);

  let scheduler = null;
  function scheduleUpdate() {
    scheduler?.schedule?.();
  }

  function update() {
    updateDartMarkerDarts({
      documentRef,
      state,
      visualConfig,
      featureDebug,
      scheduleUpdate,
    });
  }

  scheduler = schedulerFactory(update, { windowRef });
  const rootNode = documentRef.documentElement || documentRef.body || documentRef;
  const isManagedNode = createManagedNodeMatcher({
    ids: [OVERLAY_ID],
    classNames: [DART_CLASS],
  });

  if (observerRegistry && typeof observerRegistry.registerMutationObserver === "function") {
    observerRegistry.registerMutationObserver({
      key: OBSERVER_KEY,
      target: rootNode,
      callback: (mutations = []) => {
        if (!hasExternalDomMutation(mutations, isManagedNode)) {
          return;
        }
        scheduleUpdate();
      },
      observeOptions: {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["cx", "cy", "d", "points", "transform"],
      },
      MutationObserverRef: windowRef?.MutationObserver,
    });
  }

  if (listenerRegistry && typeof listenerRegistry.register === "function") {
    listenerRegistry.register({
      key: LISTENER_KEYS.visibility,
      target: documentRef,
      type: "visibilitychange",
      handler: () => scheduleUpdate(),
    });
    listenerRegistry.register({
      key: LISTENER_KEYS.resize,
      target: windowRef,
      type: "resize",
      handler: () => scheduleUpdate(),
      options: { passive: true },
    });
    listenerRegistry.register({
      key: LISTENER_KEYS.scroll,
      target: windowRef,
      type: "scroll",
      handler: () => scheduleUpdate(),
      options: { passive: true, capture: true },
    });
    listenerRegistry.register({
      key: LISTENER_KEYS.popstate,
      target: windowRef,
      type: "popstate",
      handler: () => scheduleUpdate(),
    });
    listenerRegistry.register({
      key: LISTENER_KEYS.hashchange,
      target: windowRef,
      type: "hashchange",
      handler: () => scheduleUpdate(),
    });

    const navigationApi =
      windowRef && typeof windowRef.navigation === "object" ? windowRef.navigation : null;
    if (
      navigationApi &&
      typeof navigationApi.addEventListener === "function" &&
      typeof navigationApi.removeEventListener === "function"
    ) {
      listenerRegistry.register({
        key: LISTENER_KEYS.navigationCurrentEntry,
        target: navigationApi,
        type: "currententrychange",
        handler: () => scheduleUpdate(),
      });
    }
  }

  const unsubscribeGameState =
    gameState && typeof gameState.subscribe === "function"
      ? gameState.subscribe(() => scheduleUpdate())
      : () => {};

  let locationPollHandle = 0;
  if (windowRef && typeof windowRef.setInterval === "function") {
    locationPollHandle = windowRef.setInterval(() => {
      const currentHref = getCurrentHref(windowRef);
      if (!currentHref || currentHref === state.lastHref) {
        return;
      }
      scheduleUpdate();
    }, LOCATION_POLL_INTERVAL_MS);
  }

  scheduleUpdate();
  let cleanedUp = false;

  return function cleanup() {
    if (cleanedUp) {
      return;
    }
    cleanedUp = true;

    scheduler?.cancel?.();

    try {
      unsubscribeGameState();
    } catch (_) {
      // fail-soft
    }

    if (locationPollHandle && windowRef && typeof windowRef.clearInterval === "function") {
      windowRef.clearInterval(locationPollHandle);
      locationPollHandle = 0;
    }

    if (observerRegistry && typeof observerRegistry.disconnect === "function") {
      observerRegistry.disconnect(OBSERVER_KEY);
    }
    if (listenerRegistry && typeof listenerRegistry.remove === "function") {
      Object.values(LISTENER_KEYS).forEach((key) => listenerRegistry.remove(key));
    }

    clearDartMarkerDartsState(state, {
      featureDebug,
      reason: "feature-unmount",
    });
    domGuards.removeNodeById(STYLE_ID);
  };
}

export const mountDartMarkerDarts = initializeDartMarkerDarts;
export const initialize = initializeDartMarkerDarts;
export const mount = initializeDartMarkerDarts;
