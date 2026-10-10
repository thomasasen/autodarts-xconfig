import { createFeatureMountHarness } from "../shared/feature-mount-harness.js";
import {
  applySuggestionStyle,
  applySuggestionLayout,
  collectSuggestions,
  findModernSuggestionLayoutNode,
  isModernSuggestionNode,
  MODERN_SUGGESTION_SELECTOR,
  isX01Active,
  resetSuggestionLayout,
  resetSuggestionNode,
} from "./logic.js";
import {
  BASE_CLASS,
  LAYOUT_CLASS,
  STYLE_ID,
  buildStyleText,
} from "./style.js";
import {
  createTurnSurfaceObserveOptions,
  hasRelevantTurnSurfaceMutation,
} from "../shared/turn-surface-adapter.js";

const FEATURE_KEY = "checkout-suggestion-styles";
const OBSERVER_KEY = `${FEATURE_KEY}:dom-observer`;

export function initializeCheckoutSuggestionStyles(context = {}) {
  const documentRef = context.documentRef || (typeof document !== "undefined" ? document : null);
  const windowRef = context.windowRef || (globalThis.window !== undefined ? globalThis.window : null);
  const domGuards = context.domGuards;
  const gameState = context.gameState;
  const variantRules = context.domain?.variantRules;
  const config = context.config;
  const schedulerFactory = context.helpers?.createRafScheduler;
  const featureDebug = context.featureDebug;

  if (!documentRef || !domGuards || typeof schedulerFactory !== "function") {
    return () => {};
  }

  const featureConfig =
    config && typeof config.getFeatureConfig === "function"
      ? config.getFeatureConfig("checkoutSuggestionStyles")
      : {
          style: "ribbon",
          labelText: "CHECKOUT",
          colorTheme: "amber",
        };

  domGuards.ensureStyle(STYLE_ID, buildStyleText());
  let lastDebugSignature = "";

  function update() {
    const layoutNode = findModernSuggestionLayoutNode(documentRef, windowRef);
    Array.from(documentRef.querySelectorAll?.(`.${LAYOUT_CLASS}`) || []).forEach((node) => {
      if (node !== layoutNode) {
        resetSuggestionLayout(node);
      }
    });
    applySuggestionLayout(layoutNode);

    const nodes = collectSuggestions(documentRef, windowRef);
    const currentNodes = new Set(nodes);
    Array.from(documentRef.querySelectorAll?.(`.${BASE_CLASS}`) || []).forEach((node) => {
      if (!currentNodes.has(node)) {
        resetSuggestionNode(node);
      }
    });

    const active = isX01Active({
      gameState,
      documentRef,
      windowRef,
      variantRules,
    });

    const modernNodeCount = nodes.filter(isModernSuggestionNode).length;
    const debugSignature = `${active}:${Boolean(layoutNode)}:${nodes.length}:${modernNodeCount}`;
    if (featureDebug?.enabled && debugSignature !== lastDebugSignature) {
      lastDebugSignature = debugSignature;
      featureDebug.log(
        `state active=${active ? "yes" : "no"} layout=${layoutNode ? "modern" : "none"} suggestions=${nodes.length} modern=${modernNodeCount} legacy=${nodes.length - modernNodeCount}`
      );
    }

    let modernLabelAssigned = false;
    nodes.forEach((node) => {
      if (!active) {
        resetSuggestionNode(node);
        return;
      }
      const modernSuggestion = isModernSuggestionNode(node);
      applySuggestionStyle(node, featureConfig, {
        showLabel: !modernSuggestion || !modernLabelAssigned,
      });
      if (modernSuggestion) {
        modernLabelAssigned = true;
      }
    });
  }

  const harness = createFeatureMountHarness(context, { update, resetTurn() {
    Array.from(documentRef.querySelectorAll?.(`.${BASE_CLASS}`) || []).forEach(resetSuggestionNode);
    Array.from(documentRef.querySelectorAll?.(`.${LAYOUT_CLASS}`) || []).forEach(resetSuggestionLayout);
    lastDebugSignature = "";
  } });
  const rootNode = documentRef.documentElement || documentRef.body || documentRef;
  harness.registerObserver({
    key: OBSERVER_KEY,
    target: rootNode,
    callback: (mutations = []) => {
      if (hasRelevantTurnSurfaceMutation(mutations, {
        extraSelectors: [
          ".suggestion",
          MODERN_SUGGESTION_SELECTOR,
          ".bg-surface-surface",
          "#ad-ext-game-variant",
        ],
      })) {
        harness.schedule();
      }
    },
    observeOptions: createTurnSurfaceObserveOptions(),
    MutationObserverRef: windowRef?.MutationObserver,
  });

  harness.subscribeToGameState();
  harness.schedule();
  return harness.createCleanup(() => {
    Array.from(documentRef.querySelectorAll?.(`.${BASE_CLASS}`) || []).forEach(resetSuggestionNode);
    Array.from(documentRef.querySelectorAll?.(`.${LAYOUT_CLASS}`) || []).forEach(resetSuggestionLayout);
    domGuards.removeNodeById(STYLE_ID);
  });
}

export const mountCheckoutSuggestionStyles = initializeCheckoutSuggestionStyles;
export const initialize = initializeCheckoutSuggestionStyles;
export const mount = initializeCheckoutSuggestionStyles;
