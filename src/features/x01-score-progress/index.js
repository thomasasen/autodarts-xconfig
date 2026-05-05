import { createRafScheduler } from "../../shared/raf-scheduler.js";
import {
  clearAllScoreProgress,
  createScoreProgressState,
  syncScoreProgress,
} from "./logic.js";
import { buildStyleText, HOST_ATTRIBUTE, STACK_ATTRIBUTE, STYLE_ID } from "./style.js";
import { createManagedNodeMatcher, hasExternalDomMutation } from "../../core/dom-mutation-filter.js";

const FEATURE_KEY = "x01-score-progress";
const OBSERVER_KEY = `${FEATURE_KEY}:dom-observer`;
const X01_MUTATION_AREA_SELECTOR = "#ad-ext-player-display, #ad-ext-turn";
const X01_RELEVANT_SUBTREE_SELECTOR =
  "#ad-ext-player-display, .ad-ext-player, .ad-ext-player-score, #ad-ext-turn";
const GENERIC_X01_MUTATION_TAG_NAMES = new Set(["button", "span", "p"]);

function createDebugState(featureDebug) {
  return {
    featureDebug,
    lastLogSignature: "",
    lastWarningSignature: "",
  };
}

function serializeDebugPayload(payload = null) {
  if (!payload || typeof payload !== "object") {
    return "";
  }

  try {
    return JSON.stringify(payload);
  } catch (_) {
    return "";
  }
}

function emitDebugLog(debugState, signature, message, payload = null) {
  if (!debugState?.featureDebug?.enabled || !signature) {
    return;
  }
  if (debugState.lastLogSignature === signature) {
    return;
  }

  debugState.lastLogSignature = signature;
  const payloadJson = serializeDebugPayload(payload);
  const messageWithPayload = payloadJson ? `${message} payload=${payloadJson}` : message;
  if (payload) {
    debugState.featureDebug.log(messageWithPayload, payload);
    return;
  }

  debugState.featureDebug.log(messageWithPayload);
}

function emitDebugWarning(debugState, signature, message, payload = null) {
  if (!debugState?.featureDebug?.enabled || !signature) {
    return;
  }
  if (debugState.lastWarningSignature === signature) {
    return;
  }

  debugState.lastWarningSignature = signature;
  const payloadJson = serializeDebugPayload(payload);
  const messageWithPayload = payloadJson ? `${message} payload=${payloadJson}` : message;
  if (payload) {
    debugState.featureDebug.warn(messageWithPayload, payload);
    return;
  }

  debugState.featureDebug.warn(messageWithPayload);
}

function buildDebugSignature(debugInfo = {}) {
  const visuals = debugInfo.visuals || {};
  return [
    debugInfo.reason || "unknown",
    debugInfo.shouldRender ? 1 : 0,
    debugInfo.startScore || 0,
    debugInfo.startScoreSource || "-",
    debugInfo.cardCount || 0,
    debugInfo.renderedCards || 0,
    debugInfo.removedCardsMissingScore || 0,
    debugInfo.staleHostsRemoved || 0,
    debugInfo.hostCountAfterCleanup || 0,
    debugInfo.hiddenHostCount || 0,
    debugInfo.zeroHeightHostCount || 0,
    String(debugInfo.variant?.snapshotVariant || "").trim(),
    String(debugInfo.variant?.domVariant || "").trim(),
    Array.isArray(debugInfo.variant?.variantStripTexts)
      ? debugInfo.variant.variantStripTexts.join("|")
      : "",
    visuals.colorTheme || "checkout-focus",
    visuals.barSize || "standard",
    visuals.effect || "pulse-core",
    debugInfo.sampledCards
      .map(
        (card) =>
          `${card.index}:${card.parsedScore ?? "?"}:${card.hostWidth || "-"}:${card.hostColorTheme || "-"}:${
            card.hostSize || "-"
          }:${card.hostEffect || "-"}`
      )
      .join(","),
  ].join("::");
}

function buildDebugMessage(debugInfo = {}) {
  const variant = debugInfo.variant || {};
  const variantStrip = Array.isArray(variant.variantStripTexts)
    ? variant.variantStripTexts
        .filter((value) => String(value || "").trim())
        .slice(0, 4)
        .join(" | ")
    : "";
  const visuals = debugInfo.visuals || {};
  const baseMessage = `state reason="${debugInfo.reason || "unknown"}" route="${
    debugInfo.routePath || "-"
  }${
    debugInfo.routeHash || ""
  }" shouldRender=${debugInfo.shouldRender ? "yes" : "no"} start=${
    debugInfo.startScore ?? "null"
  } startSource="${debugInfo.startScoreSource || "-"}" cards=${Number(debugInfo.cardCount) || 0} rendered=${
    Number(debugInfo.renderedCards) || 0
  } removedMissingScore=${Number(debugInfo.removedCardsMissingScore) || 0} staleRemoved=${
    Number(debugInfo.staleHostsRemoved) || 0
  } hostsAfter=${Number(debugInfo.hostCountAfterCleanup) || 0} hiddenHosts=${
    Number(debugInfo.hiddenHostCount) || 0
  } zeroHeightHosts=${Number(debugInfo.zeroHeightHostCount) || 0} variantSnapshot="${
    variant.snapshotVariant || "-"
  }" variantDom="${variant.domVariant || "-"}" variantStrip="${variantStrip || "-"}"`;
  return `${baseMessage} visuals(colors="${visuals.colorTheme || "checkout-focus"}", size="${
    visuals.barSize || "standard"
  }", effect="${visuals.effect || "pulse-core"}")`;
}

function shouldWarnDebugState(debugInfo = {}) {
  const reason = String(debugInfo.reason || "");
  if (reason === "missing-start-score" || reason === "missing-player-cards") {
    return true;
  }

  if (reason === "rendered" && (Number(debugInfo.zeroHeightHostCount) > 0 || Number(debugInfo.hiddenHostCount) > 0)) {
    return true;
  }

  return false;
}

function normalizeElementNode(node) {
  if (!node || typeof node !== "object") {
    return null;
  }

  if (node.nodeType === 1) {
    return node;
  }

  if (node.parentElement?.nodeType === 1) {
    return node.parentElement;
  }

  if (node.parentNode?.nodeType === 1) {
    return node.parentNode;
  }

  return null;
}

function isInsideX01MutationArea(element) {
  if (!element) {
    return false;
  }

  if (typeof element.closest === "function") {
    return Boolean(element.closest(X01_MUTATION_AREA_SELECTOR));
  }

  for (let current = element; current; current = current.parentNode || null) {
    const currentElement = normalizeElementNode(current);
    if (!currentElement) {
      continue;
    }
    if (
      String(currentElement.id || "").trim() === "ad-ext-player-display" ||
      String(currentElement.id || "").trim() === "ad-ext-turn"
    ) {
      return true;
    }
  }

  return false;
}

function isRelevantX01Node(node) {
  const element = normalizeElementNode(node);
  if (!element) {
    return false;
  }

  if (String(element.id || "").trim() === "ad-ext-player-display") {
    return true;
  }

  if (element.classList?.contains?.("ad-ext-player") || element.classList?.contains?.("ad-ext-player-score")) {
    return true;
  }

  const isInsideX01Area = isInsideX01MutationArea(element);
  if (isInsideX01Area) {
    return true;
  }

  const tagName = String(element.tagName || element.nodeName || "").trim().toLowerCase();
  if (GENERIC_X01_MUTATION_TAG_NAMES.has(tagName)) {
    return false;
  }

  return false;
}

function nodeContainsRelevantX01Node(node) {
  if (isRelevantX01Node(node)) {
    return true;
  }

  if (!node || typeof node.querySelector !== "function") {
    return false;
  }

  return Boolean(node.querySelector(X01_RELEVANT_SUBTREE_SELECTOR));
}

function hasRelevantX01Mutation(mutations = [], isManagedNode = null) {
  if (!hasExternalDomMutation(mutations, isManagedNode)) {
    return false;
  }

  if (!Array.isArray(mutations) || mutations.length === 0) {
    return true;
  }

  return mutations.some((mutation) => {
    if (mutation?.type === "attributes") {
      return isRelevantX01Node(mutation?.target || null);
    }

    return [
      mutation?.target || null,
      ...Array.from(mutation?.addedNodes || []),
      ...Array.from(mutation?.removedNodes || []),
    ].some((node) => nodeContainsRelevantX01Node(node));
  });
}

export function mountX01ScoreProgress(context = {}) {
  const documentRef = context.documentRef || (typeof document !== "undefined" ? document : null);
  const windowRef = context.windowRef || (typeof globalThis.window !== "undefined" ? globalThis.window : null);
  const domGuards = context.domGuards;
  const observerRegistry = context.registries?.observers;
  const gameState = context.gameState;
  const config = context.config;
  const featureDebug = context.featureDebug || null;
  const schedulerFactory = context.helpers?.createRafScheduler || createRafScheduler;

  if (!documentRef || !domGuards) {
    return () => {};
  }

  const featureConfig =
    config && typeof config.getFeatureConfig === "function"
      ? config.getFeatureConfig("x01ScoreProgress")
      : {
          colorTheme: "checkout-focus",
          barSize: "standard",
          effect: "pulse-core",
          debug: false,
        };

  domGuards.ensureStyle(STYLE_ID, buildStyleText());

  const featureState = createScoreProgressState();
  const debugState = createDebugState(featureDebug);
  const isManagedNode = createManagedNodeMatcher({
    ids: [STYLE_ID],
    predicates: [
      (node) =>
        node?.getAttribute?.(HOST_ATTRIBUTE) === "true" ||
        node?.getAttribute?.(STACK_ATTRIBUTE) === "true",
    ],
  });
  const update = () => {
    const result = syncScoreProgress(
      {
        ...context,
        featureConfig,
      },
      featureState
    );

    if (!featureDebug?.enabled) {
      return;
    }

    const debugInfo = result?.debug;
    if (!debugInfo) {
      return;
    }

    const signature = buildDebugSignature(debugInfo);
    const message = buildDebugMessage(debugInfo);
    if (shouldWarnDebugState(debugInfo)) {
      emitDebugWarning(debugState, signature, message, debugInfo);
      return;
    }

    emitDebugLog(debugState, signature, message, debugInfo);
  };

  const scheduler = schedulerFactory(update, { windowRef });
  const rootNode = documentRef.documentElement || documentRef.body || documentRef;

  if (observerRegistry && typeof observerRegistry.registerMutationObserver === "function") {
    observerRegistry.registerMutationObserver({
      key: OBSERVER_KEY,
      target: rootNode,
      callback: (mutations = []) => {
        if (!hasRelevantX01Mutation(mutations, isManagedNode)) {
          return;
        }
        scheduler.schedule();
      },
      observeOptions: {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeFilter: [
          "class",
          "selected",
          "aria-selected",
          "data-selected",
          "data-checked",
          "aria-pressed",
          "value",
        ],
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
      // Fail-soft for resilient teardown.
    }

    if (observerRegistry && typeof observerRegistry.disconnect === "function") {
      observerRegistry.disconnect(OBSERVER_KEY);
    }

    clearAllScoreProgress(documentRef);
    domGuards.removeNodeById(STYLE_ID);
  };
}

export const initializeX01ScoreProgress = mountX01ScoreProgress;
export const initialize = mountX01ScoreProgress;
export const mount = mountX01ScoreProgress;
