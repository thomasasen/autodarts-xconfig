import { ZOOM_CLASS, ZOOM_HOST_CLASS } from "./style.js";

const ACTIVE_SCORE_SELECTORS = Object.freeze([
  ".ad-ext-player.ad-ext-player-active p.ad-ext-player-score",
  ".ad-ext-player-active p.ad-ext-player-score",
  "p.ad-ext-player-score",
]);

function parseScoreText(text) {
  const match = String(text || "").match(/-?\d+/);
  if (!match) {
    return Number.NaN;
  }
  const numeric = Number(match[0]);
  return Number.isFinite(numeric) ? numeric : Number.NaN;
}

function isElementVisible(element, windowRef) {
  if (!element || typeof element.getBoundingClientRect !== "function") {
    return false;
  }
  const rect = element.getBoundingClientRect();
  if (!(rect.width > 0 && rect.height > 0)) {
    return false;
  }

  try {
    const style = windowRef?.getComputedStyle?.(element);
    if (!style) {
      return true;
    }
    return !(
      style.display === "none" ||
      style.visibility === "hidden" ||
      style.opacity === "0"
    );
  } catch (_) {
    return true;
  }
}

export function getBestVisibleScoreFromDom(documentRef, windowRef) {
  if (!documentRef || typeof documentRef.querySelectorAll !== "function") {
    return null;
  }

  const candidates = [];
  ACTIVE_SCORE_SELECTORS.forEach((selector) => {
    Array.from(documentRef.querySelectorAll(selector)).forEach((node) => {
      const value = parseScoreText(node?.textContent);
      if (!Number.isFinite(value) || value < 0) {
        return;
      }
      if (!isElementVisible(node, windowRef)) {
        return;
      }
      let weight = 0;
      try {
        const rect = node.getBoundingClientRect();
        const fontSize = Number.parseFloat(windowRef?.getComputedStyle?.(node)?.fontSize) || 0;
        const area =
          Number.isFinite(rect?.width) && Number.isFinite(rect?.height)
            ? rect.width * rect.height
            : 0;
        weight = fontSize * 10000 + area;
      } catch (_) {
        weight = 0;
      }
      candidates.push({ value, weight });
    });
  });

  if (!candidates.length) {
    return null;
  }

  candidates.sort((left, right) => right.weight - left.weight);
  return candidates[0].value;
}

function getBoardRadius(rootNode) {
  if (!rootNode || typeof rootNode.querySelectorAll !== "function") {
    return 0;
  }
  return Array.from(rootNode.querySelectorAll("circle")).reduce((max, circle) => {
    const radius = Number.parseFloat(circle?.getAttribute?.("r"));
    return Number.isFinite(radius) && radius > max ? radius : max;
  }, 0);
}

export function findBoardSvg(documentRef) {
  if (!documentRef || typeof documentRef.querySelectorAll !== "function") {
    return null;
  }

  const svgNodes = Array.from(documentRef.querySelectorAll("svg"));
  if (!svgNodes.length) {
    return null;
  }

  let bestSvg = null;
  let bestScore = -1;

  svgNodes.forEach((svgNode) => {
    const numberCount = new Set(
      Array.from(svgNode.querySelectorAll("text"))
        .map((node) => Number.parseInt(node?.textContent || "", 10))
        .filter((value) => Number.isFinite(value) && value >= 1 && value <= 20)
    ).size;
    const radius = getBoardRadius(svgNode);
    const score = numberCount * 1000 + radius;
    if (score > bestScore) {
      bestSvg = svgNode;
      bestScore = score;
    }
  });

  return bestSvg;
}

export function resolveZoomTarget(boardSvg) {
  if (!boardSvg || typeof boardSvg.closest !== "function") {
    return null;
  }

  const showAnimations = boardSvg.closest(".showAnimations");
  if (showAnimations) {
    return showAnimations;
  }

  const fallbackParent = boardSvg.parentElement;
  return fallbackParent || boardSvg;
}

export function resolveZoomHost(zoomTarget) {
  if (!zoomTarget || typeof zoomTarget.closest !== "function") {
    return null;
  }
  return (
    zoomTarget.closest(".css-tqsk66") ||
    zoomTarget.parentElement ||
    zoomTarget.closest(".showAnimations") ||
    null
  );
}

export function getThrowSegmentName(throwEntry, x01Rules) {
  if (!x01Rules || typeof x01Rules.normalizeSegmentName !== "function") {
    return "";
  }

  const segmentName = throwEntry?.segment?.name || throwEntry?.entry || "";
  return x01Rules.normalizeSegmentName(segmentName);
}

export function getTurnId(turn) {
  const directId = String(turn?.id || "").trim();
  if (directId) {
    return directId;
  }

  const round = Number.isFinite(turn?.round) ? turn.round : -1;
  const turnNumber = Number.isFinite(turn?.turn) ? turn.turn : -1;
  const playerId = String(turn?.playerId || "").trim();
  return `fallback:${round}:${turnNumber}:${playerId}`;
}

export function computeZoomIntent(options = {}) {
  const gameState = options.gameState;
  const x01Rules = options.x01Rules;
  const state = options.state;
  const documentRef = options.documentRef;
  const windowRef = options.windowRef;
  const config = options.featureConfig;
  const nowTs = Number.isFinite(options.nowTs) ? options.nowTs : Date.now();
  const outMode =
    gameState && typeof gameState.getOutMode === "function"
      ? String(gameState.getOutMode() || "")
      : "";

  if (!gameState || typeof gameState.isX01Variant !== "function") {
    return null;
  }
  if (!x01Rules) {
    return null;
  }

  const active = gameState.isX01Variant({
    allowMissing: false,
    allowEmpty: false,
    allowNumeric: true,
  });
  if (!active) {
    state.holdUntilTs = 0;
    state.activeIntent = null;
    return null;
  }

  const turn = typeof gameState.getActiveTurn === "function" ? gameState.getActiveTurn() : null;
  const throws = Array.isArray(gameState.getActiveThrows?.()) ? gameState.getActiveThrows() : [];
  if (!turn) {
    return null;
  }

  const turnId = getTurnId(turn);
  const throwCount = throws.length;
  const turnChanged = turnId !== state.lastTurnId;
  if (turnChanged) {
    state.holdUntilTs = 0;
    state.activeIntent = null;
  } else if (state.activeIntent && state.lastThrowCount === 2 && throwCount === 3) {
    state.holdUntilTs = nowTs + 1300;
  }

  state.lastTurnId = turnId;
  state.lastThrowCount = throwCount;

  const activeScore =
    Number.isFinite(gameState.getActiveScore?.()) && gameState.getActiveScore() >= 0
      ? gameState.getActiveScore()
      : getBestVisibleScoreFromDom(documentRef, windowRef);

  if (config.checkoutZoomEnabled && throwCount <= 2) {
    const checkoutSegment =
      x01Rules.getPreferredOneDartCheckoutSegment?.(activeScore, outMode) ||
      x01Rules.getOneDartCheckoutSegment?.(activeScore);
    const isValidCheckoutSegment =
      typeof x01Rules.isOneDartCheckoutSegmentForOutMode === "function"
        ? x01Rules.isOneDartCheckoutSegmentForOutMode(checkoutSegment, outMode)
        : x01Rules.isOneDartCheckoutSegment?.(checkoutSegment);
    if (checkoutSegment && isValidCheckoutSegment) {
      const intent = { reason: "checkout", segment: checkoutSegment };
      state.activeIntent = intent;
      return intent;
    }
  }

  if (throwCount === 2) {
    const firstSegment = getThrowSegmentName(throws[0], x01Rules);
    const secondSegment = getThrowSegmentName(throws[1], x01Rules);
    if (
      firstSegment === "T20" &&
      secondSegment === "T20" &&
      x01Rules.isSensibleThirdT20Score?.(activeScore, outMode)
    ) {
      const intent = { reason: "t20-setup", segment: "T20" };
      state.activeIntent = intent;
      return intent;
    }
  }

  if (state.holdUntilTs > nowTs && state.activeIntent) {
    return state.activeIntent;
  }

  state.activeIntent = null;
  return null;
}

function resolveTransformOrigin(intent) {
  const segment = String(intent?.segment || "");
  const reason = String(intent?.reason || "");

  if (segment === "BULL") {
    return "50% 50%";
  }
  if (reason === "checkout" && segment.startsWith("D")) {
    return "50% 66%";
  }
  if (reason === "t20-setup") {
    return "50% 36%";
  }
  return "50% 56%";
}

export function applyZoom(targetNode, hostNode, zoomLevel, speedConfig, intent, state) {
  if (!targetNode || !targetNode.style) {
    return;
  }

  if (hostNode?.classList) {
    hostNode.classList.add(ZOOM_HOST_CLASS);
  }

  targetNode.classList.add(ZOOM_CLASS);
  targetNode.style.transformOrigin = resolveTransformOrigin(intent);
  targetNode.style.transition = `transform ${speedConfig.zoomInMs}ms ${speedConfig.easingIn}`;
  targetNode.style.transform = `scale(${zoomLevel})`;

  state.zoomedElement = targetNode;
  state.zoomHost = hostNode || null;
}

export function resetZoom(speedConfig, state, immediate = false) {
  const targetNode = state.zoomedElement;
  const hostNode = state.zoomHost;

  if (targetNode?.classList) {
    targetNode.classList.remove(ZOOM_CLASS);
  }
  if (targetNode?.style) {
    targetNode.style.transition = immediate
      ? "transform 0ms linear"
      : `transform ${speedConfig.zoomOutMs}ms ${speedConfig.easingOut}`;
    targetNode.style.transform = "";
    targetNode.style.removeProperty("transform-origin");
    targetNode.style.removeProperty("will-change");
  }

  if (hostNode?.classList) {
    hostNode.classList.remove(ZOOM_HOST_CLASS);
  }

  state.zoomedElement = null;
  state.zoomHost = null;
}
