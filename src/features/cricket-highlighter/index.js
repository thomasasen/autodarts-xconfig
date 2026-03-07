import {
  buildCricketRenderState,
  clearCricketHighlights,
  renderCricketHighlights,
} from "./logic.js";
import { STYLE_ID, buildStyleText, resolveCricketVisualConfig } from "./style.js";

const FEATURE_KEY = "cricket-highlighter";
const OBSERVER_KEY = `${FEATURE_KEY}:dom-observer`;
const LISTENER_KEYS = Object.freeze({
  resize: `${FEATURE_KEY}:window-resize`,
  orientation: `${FEATURE_KEY}:window-orientation`,
  visibility: `${FEATURE_KEY}:document-visibility`,
});

function isCricketActive(gameState, documentRef, variantRules) {
  if (gameState && typeof gameState.isCricketVariant === "function") {
    return gameState.isCricketVariant({
      allowMissing: false,
      allowEmpty: false,
      includeHiddenCricket: false,
    });
  }

  const variantText = String(documentRef?.getElementById?.("ad-ext-game-variant")?.textContent || "");
  if (!variantRules || typeof variantRules.isCricketVariantText !== "function") {
    return false;
  }
  return variantRules.isCricketVariantText(variantText, {
    allowMissing: false,
    allowEmpty: false,
    includeHiddenCricket: false,
  });
}

function buildRenderSignature(renderState) {
  if (!renderState || !renderState.stateMap) {
    return "";
  }
  const entries = [];
  renderState.stateMap.forEach((entry, label) => {
    entries.push(
      `${label}:${entry?.boardPresentation || "open"}:${(entry?.marksByPlayer || []).join(",")}`
    );
  });
  entries.sort();
  return [
    renderState.gameModeNormalized,
    renderState.activePlayerIndex,
    entries.join("|"),
  ].join("::");
}

export function initializeCricketHighlighter(context = {}) {
  const documentRef = context.documentRef || (typeof document !== "undefined" ? document : null);
  const windowRef = context.windowRef || (typeof window !== "undefined" ? window : null);
  const domGuards = context.domGuards;
  const observerRegistry = context.registries?.observers;
  const listenerRegistry = context.registries?.listeners;
  const eventBus = context.eventBus;
  const gameState = context.gameState;
  const variantRules = context.domain?.variantRules;
  const cricketRules = context.domain?.cricketRules;
  const config = context.config;
  const schedulerFactory = context.helpers?.createRafScheduler;

  if (
    !documentRef ||
    !domGuards ||
    !cricketRules ||
    typeof schedulerFactory !== "function"
  ) {
    return () => {};
  }

  const featureConfig =
    config && typeof config.getFeatureConfig === "function"
      ? config.getFeatureConfig("cricketHighlighter")
      : {
          showDeadTargets: true,
          colorTheme: "standard",
          intensity: "normal",
        };
  const visualConfig = resolveCricketVisualConfig(featureConfig);

  domGuards.ensureStyle(STYLE_ID, buildStyleText());

  let lastSignature = "";

  function update() {
    const active = isCricketActive(gameState, documentRef, variantRules);
    if (!active) {
      lastSignature = "";
      clearCricketHighlights(documentRef);
      return;
    }

    const renderState = buildCricketRenderState({
      documentRef,
      gameState,
      cricketRules,
      variantRules,
      visualConfig,
    });

    const signature = buildRenderSignature(renderState);
    if (!signature || signature === lastSignature) {
      return;
    }
    lastSignature = signature;

    renderCricketHighlights({
      documentRef,
      visualConfig,
      renderState,
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

  if (listenerRegistry && typeof listenerRegistry.register === "function") {
    listenerRegistry.register({
      key: LISTENER_KEYS.resize,
      target: windowRef,
      type: "resize",
      handler: () => scheduler.schedule(),
      options: { passive: true },
    });
    listenerRegistry.register({
      key: LISTENER_KEYS.orientation,
      target: windowRef,
      type: "orientationchange",
      handler: () => scheduler.schedule(),
      options: { passive: true },
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
      // keep cleanup fail-soft
    }
    try {
      unsubscribeGameState();
    } catch (_) {
      // keep cleanup fail-soft
    }

    if (observerRegistry && typeof observerRegistry.disconnect === "function") {
      observerRegistry.disconnect(OBSERVER_KEY);
    }
    if (listenerRegistry && typeof listenerRegistry.remove === "function") {
      Object.values(LISTENER_KEYS).forEach((key) => listenerRegistry.remove(key));
    }

    clearCricketHighlights(documentRef);
    domGuards.removeNodeById(STYLE_ID);
  };
}

export const mountCricketHighlighter = initializeCricketHighlighter;
export const initialize = initializeCricketHighlighter;
export const mount = initializeCricketHighlighter;
