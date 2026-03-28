import {
  clearOverlay,
  findBoard,
  renderCheckoutTargets,
} from "./logic.js";
import { OVERLAY_ID, STYLE_ID, buildStyleText, resolveBoardTargetVisualConfig } from "./style.js";
import { createManagedNodeMatcher, hasExternalDomMutation } from "../../core/dom-mutation-filter.js";
import {
  collectVisibleCheckoutRouteEntries,
  getCheckoutFinishSegmentFromRoute,
  mapRouteSegmentsToBoardTargets,
} from "../x01-checkout-route.js";

const FEATURE_KEY = "checkout-board-targets";
const OBSERVER_KEY = `${FEATURE_KEY}:dom-observer`;

function createDebugState(featureDebug) {
  return {
    featureDebug,
    lastLogSignature: "",
    lastWarningSignature: "",
  };
}

function emitDebugEvent(debugState, level, signature, summary, payload) {
  if (!debugState?.featureDebug?.enabled || !signature) {
    return;
  }

  const signatureKey = level === "warn" ? "lastWarningSignature" : "lastLogSignature";
  if (debugState[signatureKey] === signature) {
    return;
  }
  debugState[signatureKey] = signature;

  const logger =
    level === "warn" && typeof debugState.featureDebug.warn === "function"
      ? debugState.featureDebug.warn.bind(debugState.featureDebug)
      : typeof debugState.featureDebug.log === "function"
        ? debugState.featureDebug.log.bind(debugState.featureDebug)
        : null;
  if (!logger) {
    return;
  }

  logger(summary, payload);
}

function mapRouteEntryForDebug(entry) {
  const rect = entry?.rect || null;
  return {
    text: String(entry?.text || "").trim(),
    segments: Array.isArray(entry?.segments) ? entry.segments.slice() : [],
    domIndex: Number.isFinite(entry?.domIndex) ? entry.domIndex : -1,
    rect: rect
      ? {
          left: Number.isFinite(rect.left) ? rect.left : null,
          top: Number.isFinite(rect.top) ? rect.top : null,
          width: Number.isFinite(rect.width) ? rect.width : null,
          height: Number.isFinite(rect.height) ? rect.height : null,
        }
      : null,
  };
}

function mapTargetForDebug(target) {
  return {
    ring: String(target?.ring || ""),
    value: Number.isFinite(target?.value) ? target.value : null,
  };
}

function buildDebugPayload(options = {}) {
  const documentRef = options.documentRef;
  const board = options.board || null;
  return {
    status: String(options.status || "unknown"),
    active: options.active === true,
    variantText: String(options.variantText || "").trim(),
    outMode: String(options.outMode || "").trim(),
    targetSelectionMode: String(options.targetSelectionMode || "next"),
    suggestionCount:
      documentRef && typeof documentRef.querySelectorAll === "function"
        ? documentRef.querySelectorAll(".suggestion").length
        : 0,
    svgCount:
      documentRef && typeof documentRef.querySelectorAll === "function"
        ? documentRef.querySelectorAll("svg").length
        : 0,
    routeEntries: Array.isArray(options.routeEntries)
      ? options.routeEntries.map(mapRouteEntryForDebug)
      : [],
    routeSegments: Array.isArray(options.routeSegments) ? options.routeSegments.slice() : [],
    selectedSegments: Array.isArray(options.selectedSegments) ? options.selectedSegments.slice() : [],
    targets: Array.isArray(options.targets) ? options.targets.map(mapTargetForDebug) : [],
    board: {
      found: Boolean(board?.group && board?.svg && board?.radius),
      radius: Number.isFinite(board?.radius) ? Number(board.radius) : null,
      groupTag: String(board?.group?.tagName || "").toUpperCase() || null,
      svgConnected: board?.svg?.isConnected !== false,
      groupConnected: board?.group?.isConnected !== false,
    },
  };
}

function buildDebugSignature(payload = {}) {
  return [
    payload.status || "unknown",
    payload.active ? 1 : 0,
    payload.variantText || "-",
    payload.outMode || "-",
    payload.targetSelectionMode || "next",
    Number(payload.suggestionCount) || 0,
    Number(payload.svgCount) || 0,
    Array.isArray(payload.routeEntries)
      ? payload.routeEntries
          .map(
            (entry) =>
              `${entry.domIndex}:${entry.text}:${entry.rect?.width ?? "-"}:${entry.rect?.height ?? "-"}:${
                Array.isArray(entry.segments) ? entry.segments.join(",") : ""
              }`
          )
          .join("|")
      : "",
    Array.isArray(payload.selectedSegments) ? payload.selectedSegments.join(">") : "",
    Array.isArray(payload.targets)
      ? payload.targets.map((target) => `${target.ring}:${target.value ?? ""}`).join("|")
      : "",
    payload.board?.found ? 1 : 0,
    payload.board?.radius ?? "null",
    payload.board?.groupTag || "-",
  ].join("::");
}

function buildDebugSummary(payload = {}) {
  return `state status="${payload.status || "unknown"}" active=${payload.active ? "yes" : "no"} variant="${
    payload.variantText || "-"
  }" outMode="${payload.outMode || "-"}" selection="${payload.targetSelectionMode || "next"}" suggestions=${
    Number(payload.suggestionCount) || 0
  } route="${Array.isArray(payload.routeSegments) ? payload.routeSegments.join(">") : ""}" selected="${
    Array.isArray(payload.selectedSegments) ? payload.selectedSegments.join(">") : ""
  }" targets="${
    Array.isArray(payload.targets)
      ? payload.targets.map((target) => `${target.ring}${target.value ?? ""}`).join(",")
      : ""
  }" boardFound=${payload.board?.found ? "yes" : "no"} boardRadius=${payload.board?.radius ?? "null"} svgCount=${
    Number(payload.svgCount) || 0
  }`;
}

function isX01Active({ gameState, documentRef, variantRules }) {
  if (gameState && typeof gameState.isX01Variant === "function") {
    return gameState.isX01Variant({
      allowMissing: false,
      allowEmpty: false,
      allowNumeric: true,
    });
  }

  if (!documentRef || typeof documentRef.getElementById !== "function") {
    return false;
  }
  if (!variantRules || typeof variantRules.isX01VariantText !== "function") {
    return false;
  }

  const variantNode = documentRef.getElementById("ad-ext-game-variant");
  return variantRules.isX01VariantText(variantNode?.textContent || "", {
    allowMissing: false,
    allowEmpty: false,
    allowNumeric: true,
  });
}

export function initializeCheckoutBoardTargets(context = {}) {
  const documentRef = context.documentRef || (typeof document !== "undefined" ? document : null);
  const windowRef = context.windowRef || (typeof window !== "undefined" ? window : null);
  const domGuards = context.domGuards;
  const observerRegistry = context.registries?.observers;
  const gameState = context.gameState;
  const variantRules = context.domain?.variantRules;
  const x01Rules = context.domain?.x01Rules;
  const config = context.config;
  const schedulerFactory = context.helpers?.createRafScheduler;
  const featureDebug = context.featureDebug || null;

  if (
    !documentRef ||
    !domGuards ||
    !schedulerFactory ||
    !x01Rules
  ) {
    return () => {};
  }

  const featureConfig =
    config && typeof config.getFeatureConfig === "function"
      ? config.getFeatureConfig("checkoutBoardTargets")
      : {
          effect: "pulse",
          singleRing: "both",
          targetSelectionMode: "next",
          colorTheme: "violet",
          outlineIntensity: "standard",
        };
  const visualConfig = resolveBoardTargetVisualConfig(featureConfig);
  const targetSelectionMode =
    String(featureConfig.targetSelectionMode || "").trim().toLowerCase() === "all"
      ? "all"
      : String(featureConfig.targetSelectionMode || "").trim().toLowerCase() === "finish"
        ? "finish"
        : "next";

  domGuards.ensureStyle(STYLE_ID, buildStyleText());

  let lastRenderSignature = "";
  const debugState = createDebugState(featureDebug);
  const boardCache = {
    value: null,
  };

  function invalidateBoardCache() {
    boardCache.value = null;
    lastRenderSignature = "";
  }

  function getBoard() {
    const cachedBoard = boardCache.value;
    if (
      cachedBoard &&
      cachedBoard.group?.isConnected !== false &&
      cachedBoard.svg?.isConnected !== false
    ) {
      return cachedBoard;
    }

    const nextBoard = findBoard(documentRef);
    boardCache.value = nextBoard;
    return nextBoard;
  }

  function clearCurrentOverlay() {
    const board = getBoard();
    if (!board?.group) {
      return;
    }
    const overlay = board.group.querySelector?.(`#${OVERLAY_ID}`) || null;
    if (overlay) {
      clearOverlay(overlay);
    }
  }

  function selectRouteSegments(routeSegments = []) {
    if (!Array.isArray(routeSegments) || !routeSegments.length) {
      return [];
    }

    if (targetSelectionMode === "all") {
      return routeSegments.slice();
    }

    if (targetSelectionMode === "finish") {
      const outMode =
        gameState && typeof gameState.getOutMode === "function"
          ? String(gameState.getOutMode() || "")
          : "";
      const finishSegment = getCheckoutFinishSegmentFromRoute(routeSegments, outMode, x01Rules);
      return finishSegment ? [finishSegment] : [];
    }

    return [routeSegments[0]];
  }

  function update() {
    const active = isX01Active({
      gameState,
      documentRef,
      variantRules,
    });
    const routeEntries = collectVisibleCheckoutRouteEntries(documentRef, windowRef, x01Rules);
    const routeSegments = routeEntries.flatMap((entry) =>
      Array.isArray(entry?.segments) ? entry.segments : []
    );
    const variantText = String(
      documentRef?.getElementById?.("ad-ext-game-variant")?.textContent || ""
    ).trim();
    const outMode =
      gameState && typeof gameState.getOutMode === "function"
        ? String(gameState.getOutMode() || "")
        : "";
    const signature = `${active ? "x01" : "other"}|${routeSegments.join(">")}`;

    if (signature === lastRenderSignature) {
      return;
    }
    lastRenderSignature = signature;

    if (!active) {
      const payload = buildDebugPayload({
        status: "inactive",
        active,
        variantText,
        outMode,
        targetSelectionMode,
        documentRef,
        routeEntries,
        routeSegments,
        selectedSegments: [],
        targets: [],
        board: null,
      });
      emitDebugEvent(debugState, "log", buildDebugSignature(payload), buildDebugSummary(payload), payload);
      clearCurrentOverlay();
      return;
    }

    const selectedSegments = selectRouteSegments(routeSegments);
    const targets = mapRouteSegmentsToBoardTargets(selectedSegments, x01Rules);
    const board = getBoard();
    const status = !routeSegments.length
      ? "no-route"
      : !selectedSegments.length
        ? "no-selected-segments"
        : !targets.length
          ? "no-targets"
          : !board
            ? "no-board"
            : "render";
    const payload = buildDebugPayload({
      status,
      active,
      variantText,
      outMode,
      targetSelectionMode,
      documentRef,
      routeEntries,
      routeSegments,
      selectedSegments,
      targets,
      board,
    });
    emitDebugEvent(
      debugState,
      status === "render" ? "log" : "warn",
      buildDebugSignature(payload),
      buildDebugSummary(payload),
      payload
    );
    if (!board) {
      return;
    }

    renderCheckoutTargets({
      board,
      checkoutTargets: targets,
      visualConfig,
    });
  }

  const scheduler = schedulerFactory(update, { windowRef });
  const rootNode = documentRef.documentElement || documentRef.body || documentRef;
  const isManagedNode = createManagedNodeMatcher({
    ids: [OVERLAY_ID],
  });
  if (observerRegistry && typeof observerRegistry.registerMutationObserver === "function") {
    observerRegistry.registerMutationObserver({
      key: OBSERVER_KEY,
      target: rootNode,
      callback: (mutations = []) => {
        if (!hasExternalDomMutation(mutations, isManagedNode)) {
          return;
        }
        invalidateBoardCache();
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
      // Fail-soft cleanup.
    }

    if (observerRegistry && typeof observerRegistry.disconnect === "function") {
      observerRegistry.disconnect(OBSERVER_KEY);
    }

    clearCurrentOverlay();
    invalidateBoardCache();
    domGuards.removeNodeById(STYLE_ID);
    domGuards.removeNodeById(OVERLAY_ID);
  };
}

export const mountCheckoutBoardTargets = initializeCheckoutBoardTargets;
export const initialize = initializeCheckoutBoardTargets;
export const mount = initializeCheckoutBoardTargets;
