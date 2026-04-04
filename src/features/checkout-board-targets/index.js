import {
  clearOverlay,
  findBoard,
  renderCheckoutTargets,
} from "./logic.js";
import { OVERLAY_ID, STYLE_ID, buildStyleText, resolveBoardTargetVisualConfig } from "./style.js";
import { createManagedNodeMatcher, hasExternalDomMutation } from "../../core/dom-mutation-filter.js";
import {
  collectVisibleCheckoutRouteEntries,
  mapRouteSegmentsToBoardTargets,
  resolveCheckoutSurfaceSemantics,
} from "../x01-checkout-route.js";
import { createTurnSurfaceObserveOptions } from "../shared/turn-surface-adapter.js";

const FEATURE_KEY = "checkout-board-targets";
const OBSERVER_KEY = `${FEATURE_KEY}:dom-observer`;
const TRANSIENT_ROUTE_RETENTION_MS = 1500;
const SCORE_SELECTOR = "p.ad-ext-player-score";
const ACTIVE_SCORE_SELECTOR =
  ".ad-ext-player.ad-ext-player-active p.ad-ext-player-score, .ad-ext-player-active p.ad-ext-player-score";

function parseScore(text) {
  const match = String(text || "").match(/\d+/);
  if (!match) {
    return NaN;
  }

  const value = Number(match[0]);
  return Number.isFinite(value) ? value : NaN;
}

function readDomActiveScore(documentRef) {
  if (!documentRef || typeof documentRef.querySelector !== "function") {
    return NaN;
  }

  const node =
    documentRef.querySelector(ACTIVE_SCORE_SELECTOR) ||
    documentRef.querySelector(SCORE_SELECTOR);
  return parseScore(node?.textContent || "");
}

function resolveActiveScoreState(gameState, documentRef) {
  const gameStateScore =
    gameState && typeof gameState.getActiveScore === "function"
      ? Number(gameState.getActiveScore())
      : NaN;
  const domScore = readDomActiveScore(documentRef);

  if (Number.isFinite(domScore) && Number.isFinite(gameStateScore)) {
    if (domScore === gameStateScore) {
      return {
        activeScore: domScore,
        domScore,
        gameStateScore,
        scoreSource: "game-state+dom",
        scoreAgreement: "match",
      };
    }

    return {
      activeScore: domScore,
      domScore,
      gameStateScore,
      scoreSource: "dom-preferred",
      scoreAgreement: "mismatch",
    };
  }

  if (Number.isFinite(domScore)) {
    return {
      activeScore: domScore,
      domScore,
      gameStateScore,
      scoreSource: "dom",
      scoreAgreement: "dom-only",
    };
  }

  if (Number.isFinite(gameStateScore)) {
    return {
      activeScore: gameStateScore,
      domScore,
      gameStateScore,
      scoreSource: "game-state",
      scoreAgreement: "game-state-only",
    };
  }

  return {
    activeScore: NaN,
    domScore,
    gameStateScore,
    scoreSource: "none",
    scoreAgreement: "none",
  };
}

function resolveDartsRemaining(gameState) {
  const throws = Array.isArray(gameState?.getActiveThrows?.()) ? gameState.getActiveThrows() : [];
  const throwCount = Math.max(0, Math.min(3, throws.length));
  return {
    throwCount,
    dartsRemaining: Math.max(0, 3 - throwCount),
  };
}

function nowMs() {
  return Date.now();
}

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
    activeScore: Number.isFinite(options.activeScore) ? options.activeScore : null,
    domScore: Number.isFinite(options.domScore) ? options.domScore : null,
    gameStateScore: Number.isFinite(options.gameStateScore) ? options.gameStateScore : null,
    scoreSource: String(options.scoreSource || "none"),
    scoreAgreement: String(options.scoreAgreement || "none"),
    variantText: String(options.variantText || "").trim(),
    outMode: String(options.outMode || "").trim(),
    targetSelectionMode: String(options.targetSelectionMode || "next"),
    selectionSource: String(options.selectionSource || "none"),
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
    payload.activeScore ?? "null",
    payload.domScore ?? "null",
    payload.gameStateScore ?? "null",
    payload.scoreSource || "none",
    payload.scoreAgreement || "none",
    payload.variantText || "-",
    payload.outMode || "-",
    payload.targetSelectionMode || "next",
    payload.selectionSource || "none",
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
  }" activeScore="${payload.activeScore ?? "-"}" domScore="${payload.domScore ?? "-"}" gameStateScore="${
    payload.gameStateScore ?? "-"
  }" scoreSource="${payload.scoreSource || "none"}" scoreAgreement="${payload.scoreAgreement || "none"}" outMode="${
    payload.outMode || "-"
  }" selection="${
    payload.targetSelectionMode || "next"
  }" source="${payload.selectionSource || "none"}" suggestions=${
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
          visualPreset: "focus",
          singleRing: "both",
          targetSelectionMode: "next",
          colorTheme: "amber",
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
  const retainedRenderState = {
    selectedSegments: [],
    targets: [],
    activeScore: NaN,
    outMode: "",
    validUntilMs: 0,
  };
  let retainExpiryTimer = 0;

  function clearRetainExpiryTimer() {
    if (!retainExpiryTimer) {
      return;
    }
    clearTimeout(retainExpiryTimer);
    retainExpiryTimer = 0;
  }

  function invalidateBoardCache() {
    boardCache.value = null;
    lastRenderSignature = "";
  }

  function resetRetainedRenderState() {
    retainedRenderState.selectedSegments = [];
    retainedRenderState.targets = [];
    retainedRenderState.activeScore = NaN;
    retainedRenderState.outMode = "";
    retainedRenderState.validUntilMs = 0;
    clearRetainExpiryTimer();
  }

  function rememberRetainedRenderState(selectedSegments, targets, activeScore, outMode) {
    retainedRenderState.selectedSegments = Array.isArray(selectedSegments)
      ? selectedSegments.slice()
      : [];
    retainedRenderState.targets = Array.isArray(targets)
      ? targets.map((target) => ({ ...target }))
      : [];
    retainedRenderState.activeScore = Number.isFinite(activeScore) ? activeScore : NaN;
    retainedRenderState.outMode = String(outMode || "");
    retainedRenderState.validUntilMs = nowMs() + TRANSIENT_ROUTE_RETENTION_MS;
    clearRetainExpiryTimer();
  }

  function scheduleRetainedRenderExpiry() {
    clearRetainExpiryTimer();
    const delayMs = Math.max(0, retainedRenderState.validUntilMs - nowMs());
    if (!delayMs) {
      return;
    }
    retainExpiryTimer = setTimeout(() => {
      retainExpiryTimer = 0;
      lastRenderSignature = "";
      scheduler.schedule();
    }, delayMs + 25);
  }

  function getRetainedRender(activeScore, outMode) {
    if (!retainedRenderState.targets.length || nowMs() > retainedRenderState.validUntilMs) {
      return null;
    }

    const normalizedOutMode = String(outMode || "").trim();
    const retainedOutMode = String(retainedRenderState.outMode || "").trim();
    if (normalizedOutMode && retainedOutMode && normalizedOutMode !== retainedOutMode) {
      return null;
    }

    if (
      Number.isFinite(activeScore) &&
      Number.isFinite(retainedRenderState.activeScore) &&
      activeScore !== retainedRenderState.activeScore
    ) {
      return null;
    }

    return {
      selectedSegments: retainedRenderState.selectedSegments.slice(),
      targets: retainedRenderState.targets.map((target) => ({ ...target })),
    };
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

  function selectRouteSegments(checkoutSurface = {}) {
    const routeSegments = Array.isArray(checkoutSurface.authoritativeRouteSegments)
      ? checkoutSurface.authoritativeRouteSegments
      : [];

    if (!routeSegments.length && targetSelectionMode !== "finish") {
      return {
        selectedSegments: [],
      };
    }

    if (targetSelectionMode === "all") {
      return {
        selectedSegments: routeSegments.slice(),
      };
    }

    if (targetSelectionMode === "finish") {
      if (checkoutSurface.canUseAuthoritativeFinishNow && checkoutSurface.authoritativeFinishSegment) {
        return {
          selectedSegments: [checkoutSurface.authoritativeFinishSegment],
        };
      }

      return {
        selectedSegments: [],
      };
    }

    return {
      selectedSegments: routeSegments.length ? [routeSegments[0]] : [],
    };
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
    const activeScoreState = resolveActiveScoreState(gameState, documentRef);
    const activeScore = activeScoreState.activeScore;
    const { dartsRemaining } = resolveDartsRemaining(gameState);
    const signature = [
      active ? "x01" : "other",
      routeSegments.join(">"),
      Number.isFinite(activeScore) ? activeScore : "null",
      Number.isFinite(activeScoreState.domScore) ? activeScoreState.domScore : "null",
      Number.isFinite(activeScoreState.gameStateScore) ? activeScoreState.gameStateScore : "null",
      outMode,
      dartsRemaining,
    ].join("|");

    if (signature === lastRenderSignature) {
      return;
    }
    lastRenderSignature = signature;

    if (!active) {
      resetRetainedRenderState();
      const payload = buildDebugPayload({
        status: "inactive",
        active,
        activeScore,
        domScore: activeScoreState.domScore,
        gameStateScore: activeScoreState.gameStateScore,
        scoreSource: activeScoreState.scoreSource,
        scoreAgreement: activeScoreState.scoreAgreement,
        variantText,
        outMode,
        targetSelectionMode,
        selectionSource: "none",
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

    const checkoutSurface = resolveCheckoutSurfaceSemantics({
      routeSegments,
      activeScore,
      outMode,
      dartsRemaining,
      x01Rules,
    });
    const { selectedSegments } = selectRouteSegments(checkoutSurface);
    const selectionSource = checkoutSurface.selectionSource || "none";
    const targets = mapRouteSegmentsToBoardTargets(selectedSegments, x01Rules);
    const board = getBoard();
    let status = !routeSegments.length && !selectedSegments.length
      ? "no-route"
      : !selectedSegments.length
        ? "no-selected-segments"
        : !targets.length
          ? "no-targets"
          : !board
            ? "no-board"
            : "render";
    let renderSelectedSegments = selectedSegments;
    let renderTargets = targets;
    let renderSelectionSource = selectionSource;

    if (status === "render") {
      rememberRetainedRenderState(selectedSegments, targets, activeScore, outMode);
    } else if (
      board &&
      (status === "no-route" || status === "no-selected-segments" || status === "no-targets")
    ) {
      const retainedRender = getRetainedRender(activeScore, outMode);
      if (retainedRender) {
        renderSelectedSegments = retainedRender.selectedSegments;
        renderTargets = retainedRender.targets;
        renderSelectionSource = "retained-last-targets";
        status = "render-retained";
        scheduleRetainedRenderExpiry();
      }
    }

    if (status !== "render-retained" && status !== "render") {
      clearRetainExpiryTimer();
    }

    const payload = buildDebugPayload({
      status,
      active,
      activeScore,
      domScore: activeScoreState.domScore,
      gameStateScore: activeScoreState.gameStateScore,
      scoreSource: activeScoreState.scoreSource,
      scoreAgreement: activeScoreState.scoreAgreement,
      variantText,
      outMode,
      targetSelectionMode,
      selectionSource: renderSelectionSource,
      documentRef,
      routeEntries,
      routeSegments,
      selectedSegments: renderSelectedSegments,
      targets: renderTargets,
      board,
    });
    emitDebugEvent(
      debugState,
      status === "render" || status === "render-retained" ? "log" : "warn",
      buildDebugSignature(payload),
      buildDebugSummary(payload),
      payload
    );
    if (!board) {
      return;
    }

    renderCheckoutTargets({
      board,
      checkoutTargets: renderTargets,
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
      observeOptions: createTurnSurfaceObserveOptions(),
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
    resetRetainedRenderState();
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
