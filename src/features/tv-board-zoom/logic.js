import { ZOOM_CLASS, ZOOM_HOST_CLASS } from "./style.js";

const ACTIVE_SCORE_SELECTORS = Object.freeze([
  ".ad-ext-player.ad-ext-player-active p.ad-ext-player-score",
  ".ad-ext-player-active p.ad-ext-player-score",
  "p.ad-ext-player-score",
]);
const SUGGESTION_SELECTORS = Object.freeze([
  ".suggestion",
]);
const SEGMENT_ORDER = Object.freeze([
  20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5,
]);
const RING_RATIOS = Object.freeze({
  outerBullInner: 0.031112,
  outerBullOuter: 0.075556,
  tripleInner: 0.431112,
  tripleOuter: 0.475556,
  doubleInner: 0.711112,
  doubleOuter: 0.755556,
});
const SINGLE_RING_RATIO = (RING_RATIOS.tripleOuter + RING_RATIOS.doubleInner) / 2;
const HOLD_AFTER_THIRD_MS = 1300;
const RELEASE_PADDING_MS = 40;
const CHECKOUT_DOUBLE_ZOOM_RANGE = Object.freeze({
  min: 2.35,
  max: 3.15,
});

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

function parseViewBox(svgNode) {
  if (!svgNode || typeof svgNode.getAttribute !== "function") {
    return {
      x: 0,
      y: 0,
      width: 1000,
      height: 1000,
    };
  }

  const baseVal = svgNode.viewBox?.baseVal;
  if (baseVal && Number.isFinite(baseVal.width) && baseVal.width > 0) {
    return {
      x: Number(baseVal.x),
      y: Number(baseVal.y),
      width: Number(baseVal.width),
      height: Number(baseVal.height),
    };
  }

  const raw = String(svgNode.getAttribute("viewBox") || "").trim();
  const parts = raw.split(/[,\s]+/).map(Number);
  if (parts.length === 4 && parts.every(Number.isFinite) && parts[2] > 0 && parts[3] > 0) {
    return {
      x: parts[0],
      y: parts[1],
      width: parts[2],
      height: parts[3],
    };
  }

  return {
    x: 0,
    y: 0,
    width: 1000,
    height: 1000,
  };
}

function clamp(value, minValue, maxValue) {
  if (!Number.isFinite(value)) {
    return minValue;
  }
  if (!Number.isFinite(minValue) || !Number.isFinite(maxValue)) {
    return value;
  }
  if (minValue > maxValue) {
    return (minValue + maxValue) / 2;
  }
  return Math.min(maxValue, Math.max(minValue, value));
}

function getNodeVisualWeight(node, windowRef) {
  if (!node || typeof node.getBoundingClientRect !== "function") {
    return 0;
  }

  try {
    const rect = node.getBoundingClientRect();
    const fontSize = Number.parseFloat(windowRef?.getComputedStyle?.(node)?.fontSize) || 0;
    const area =
      Number.isFinite(rect?.width) && Number.isFinite(rect?.height)
        ? rect.width * rect.height
        : 0;
    return fontSize * 10000 + area;
  } catch (_) {
    return 0;
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
      candidates.push({ value, weight: getNodeVisualWeight(node, windowRef) });
    });
  });

  if (!candidates.length) {
    return null;
  }

  candidates.sort((left, right) => right.weight - left.weight);
  return candidates[0].value;
}

function parseSegmentWithFallback(segmentName, x01Rules) {
  if (x01Rules && typeof x01Rules.parseSegment === "function") {
    const parsed = x01Rules.parseSegment(segmentName);
    if (parsed) {
      return parsed;
    }
  }

  const normalized =
    x01Rules && typeof x01Rules.normalizeSegmentName === "function"
      ? x01Rules.normalizeSegmentName(segmentName)
      : String(segmentName || "").trim().toUpperCase();

  if (!normalized) {
    return null;
  }

  if (normalized === "BULL") {
    return {
      normalized: "BULL",
      ring: "D",
      value: 25,
      score: 50,
    };
  }

  if (normalized === "S25" || normalized === "SB" || normalized === "OB") {
    return {
      normalized: "S25",
      ring: "S",
      value: 25,
      score: 25,
    };
  }

  const match = normalized.match(/^([SDT])(\d{1,2})$/);
  if (!match) {
    return null;
  }

  const value = Number(match[2]);
  if (!(value >= 1 && value <= 20)) {
    return null;
  }

  const ring = match[1];
  const multiplier = ring === "D" ? 2 : ring === "T" ? 3 : 1;
  return {
    normalized: `${ring}${value}`,
    ring,
    value,
    score: value * multiplier,
  };
}

function parseExplicitSuggestionSegments(text, x01Rules) {
  if (!x01Rules) {
    return [];
  }

  if (typeof x01Rules.parseExplicitCheckoutSegments === "function") {
    return x01Rules.parseExplicitCheckoutSegments(text);
  }

  const normalizedText = String(text || "").toUpperCase();
  const tokens = normalizedText.match(/\b(?:DB|BULLSEYE|BULL|SB|OB|[TDS](?:[1-9]|1\d|20|25))\b/g) || [];
  return tokens
    .map((token) => {
      if (token === "DB" || token === "BULLSEYE" || token === "BULL") {
        return "BULL";
      }
      if (token === "SB" || token === "OB") {
        return "S25";
      }
      return typeof x01Rules.normalizeSegmentName === "function"
        ? x01Rules.normalizeSegmentName(token)
        : token;
    })
    .filter(Boolean);
}

function getBestVisibleSuggestionTextFromDom(documentRef, windowRef) {
  if (!documentRef || typeof documentRef.querySelectorAll !== "function") {
    return "";
  }

  const candidates = [];
  SUGGESTION_SELECTORS.forEach((selector) => {
    Array.from(documentRef.querySelectorAll(selector)).forEach((node) => {
      if (!isElementVisible(node, windowRef)) {
        return;
      }

      const text = String(node?.textContent || "").trim();
      if (!text) {
        return;
      }

      candidates.push({
        text,
        weight: getNodeVisualWeight(node, windowRef),
      });
    });
  });

  if (!candidates.length) {
    return "";
  }

  candidates.sort((left, right) => right.weight - left.weight);
  return candidates[0].text;
}

export function getSuggestionSegmentFromDom(documentRef, windowRef, x01Rules) {
  const suggestionText = getBestVisibleSuggestionTextFromDom(documentRef, windowRef);
  if (!suggestionText) {
    return "";
  }

  const segments = parseExplicitSuggestionSegments(suggestionText, x01Rules);
  const validSegment = segments.find((segment) => Boolean(parseSegmentWithFallback(segment, x01Rules)));
  return validSegment || "";
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

function segmentAngles(value) {
  const index = SEGMENT_ORDER.indexOf(Number(value));
  if (index < 0) {
    return null;
  }

  const center = index * 18;
  return {
    start: center - 9,
    end: center + 9,
    center,
  };
}

export function resolveSegmentPoint(segmentName, boardSvg, x01Rules) {
  const parsedSegment = parseSegmentWithFallback(segmentName, x01Rules);
  if (!parsedSegment || !boardSvg) {
    return null;
  }

  const viewBox = parseViewBox(boardSvg);
  const boardRadius = getBoardRadius(boardSvg);
  const radius =
    Number.isFinite(boardRadius) && boardRadius > 0
      ? boardRadius
      : Math.min(viewBox.width, viewBox.height) / 2;
  const center = {
    x: viewBox.x + viewBox.width / 2,
    y: viewBox.y + viewBox.height / 2,
  };

  if (parsedSegment.normalized === "BULL" || (parsedSegment.value === 25 && parsedSegment.ring === "D")) {
    return {
      x: center.x,
      y: center.y,
      parsedSegment,
      viewBox,
    };
  }

  if (parsedSegment.value === 25 && parsedSegment.ring === "S") {
    const ratio = (RING_RATIOS.outerBullInner + RING_RATIOS.outerBullOuter) / 2;
    return {
      x: center.x,
      y: center.y - radius * ratio,
      parsedSegment,
      viewBox,
    };
  }

  const angles = segmentAngles(parsedSegment.value);
  if (!angles) {
    return null;
  }

  let ratio = SINGLE_RING_RATIO;
  if (parsedSegment.ring === "T") {
    ratio = (RING_RATIOS.tripleInner + RING_RATIOS.tripleOuter) / 2;
  } else if (parsedSegment.ring === "D") {
    ratio = (RING_RATIOS.doubleInner + RING_RATIOS.doubleOuter) / 2;
  }

  const radians = ((angles.center - 90) * Math.PI) / 180;
  return {
    x: center.x + radius * ratio * Math.cos(radians),
    y: center.y + radius * ratio * Math.sin(radians),
    parsedSegment,
    viewBox,
  };
}

export function resolveZoomTarget(boardSvg) {
  if (!boardSvg || typeof boardSvg.closest !== "function") {
    return null;
  }

  const stableBoardCanvas = boardSvg.closest(".ad-ext-theme-board-canvas");
  const showAnimations = boardSvg.closest(".showAnimations");
  const directParent = boardSvg.parentElement || null;

  if (
    directParent &&
    directParent !== stableBoardCanvas &&
    directParent !== showAnimations
  ) {
    return directParent;
  }

  if (stableBoardCanvas) {
    return stableBoardCanvas;
  }

  if (showAnimations) {
    return showAnimations;
  }

  return directParent || boardSvg;
}

export function resolveZoomHost(zoomTarget) {
  if (!zoomTarget || typeof zoomTarget.closest !== "function") {
    return null;
  }
  return (
    zoomTarget.closest(".ad-ext-theme-board-viewport") ||
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

function isOneDartCheckoutSegmentForMode(segmentName, outMode, x01Rules) {
  if (!segmentName || !x01Rules) {
    return false;
  }

  if (typeof x01Rules.isOneDartCheckoutSegmentForOutMode === "function") {
    return x01Rules.isOneDartCheckoutSegmentForOutMode(segmentName, outMode);
  }

  if (typeof x01Rules.isOneDartCheckoutSegment === "function") {
    return x01Rules.isOneDartCheckoutSegment(segmentName);
  }

  return false;
}

function getScoreCheckoutSegment(activeScore, outMode, x01Rules) {
  if (!x01Rules || !Number.isFinite(activeScore)) {
    return "";
  }

  const segment =
    x01Rules.getPreferredOneDartCheckoutSegment?.(activeScore, outMode) ||
    x01Rules.getOneDartCheckoutSegment?.(activeScore) ||
    "";

  return isOneDartCheckoutSegmentForMode(segment, outMode, x01Rules) ? segment : "";
}

function canFinishWithSegment(activeScore, segmentName, outMode, x01Rules) {
  if (!x01Rules || !Number.isFinite(activeScore) || !segmentName) {
    return false;
  }

  if (typeof x01Rules.canFinishWithSegment === "function") {
    return x01Rules.canFinishWithSegment(activeScore, segmentName, outMode);
  }

  const parsed = parseSegmentWithFallback(segmentName, x01Rules);
  if (!parsed || parsed.score !== activeScore) {
    return false;
  }

  return isOneDartCheckoutSegmentForMode(segmentName, outMode, x01Rules);
}

function canUseThirdDartT20Setup(throws, throwCount, activeScore, outMode, x01Rules) {
  if (!x01Rules || throwCount !== 2) {
    return false;
  }

  const firstSegment = getThrowSegmentName(throws[0], x01Rules);
  const secondSegment = getThrowSegmentName(throws[1], x01Rules);
  if (firstSegment !== "T20" || secondSegment !== "T20") {
    return false;
  }

  if (typeof x01Rules.isSensibleThirdT20Score === "function") {
    return Boolean(x01Rules.isSensibleThirdT20Score(activeScore, outMode));
  }

  return true;
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

function normalizeBoundaryTokenValue(value) {
  const normalized = String(value || "").trim();
  return normalized || "";
}

function resolveGameBoundaryToken(gameState) {
  if (!gameState || typeof gameState.getSnapshot !== "function") {
    return "";
  }

  const snapshot = gameState.getSnapshot();
  if (!snapshot || typeof snapshot !== "object") {
    return "";
  }

  const match = snapshot.match && typeof snapshot.match === "object" ? snapshot.match : null;
  const gameScopeCandidates = [
    match?.currentGameId,
    match?.gameId,
    match?.game?.id,
    match?.currentLegId,
    match?.legId,
    match?.leg?.id,
    match?.setId,
    match?.set?.id,
  ];

  for (const candidate of gameScopeCandidates) {
    const token = normalizeBoundaryTokenValue(candidate);
    if (token) {
      return `game:${token}`;
    }
  }

  const matchScopeCandidates = [
    match?.id,
    match?._id,
    match?.matchId,
    snapshot.topic,
  ];
  for (const candidate of matchScopeCandidates) {
    const token = normalizeBoundaryTokenValue(candidate);
    if (token) {
      return `match:${token}`;
    }
  }

  return "";
}

export function markManualZoomPause(state, throwCount = Number.NaN) {
  if (!state) {
    return;
  }

  state.holdUntilTs = 0;
  state.activeIntent = null;
  state.stickyUntilTurnChange = false;
  state.stickyUntilLegEnd = false;
  state.manualPause = true;
  const baseline =
    Number.isFinite(throwCount) && throwCount >= 0
      ? throwCount
      : state.lastThrowCount;
  state.manualPauseThrowCount =
    Number.isFinite(baseline) && baseline >= 0 ? baseline : -1;
}

function resolveZoomAnchor(intent, parsedSegment, segmentPoint = null) {
  const reason = String(intent?.reason || "");
  const segment = String(parsedSegment?.normalized || intent?.segment || "");
  const numericZoomLevel = Number(intent?.zoomLevel);

  if (segment === "BULL") {
    return { x: 0.5, y: 0.5 };
  }

  if (reason === "checkout" && parsedSegment?.ring === "D") {
    const viewBox = segmentPoint?.viewBox;
    const pointX = Number(segmentPoint?.x);
    const pointY = Number(segmentPoint?.y);
    if (
      viewBox &&
      Number.isFinite(viewBox.width) &&
      viewBox.width > 0 &&
      Number.isFinite(viewBox.height) &&
      viewBox.height > 0 &&
      Number.isFinite(pointX) &&
      Number.isFinite(pointY)
    ) {
      const centerX = viewBox.x + viewBox.width / 2;
      const centerY = viewBox.y + viewBox.height / 2;
      const dx = pointX - centerX;
      const dy = pointY - centerY;
      const distance = Math.hypot(dx, dy);
      if (distance > 0) {
        const vectorX = dx / distance;
        const vectorY = dy / distance;
        const maxAxis = Math.max(Math.abs(vectorX), Math.abs(vectorY));
        const cornerFactor = Math.abs(vectorX * vectorY);
        const zoomProgress = clamp(
          (numericZoomLevel - CHECKOUT_DOUBLE_ZOOM_RANGE.min) /
            (CHECKOUT_DOUBLE_ZOOM_RANGE.max - CHECKOUT_DOUBLE_ZOOM_RANGE.min),
          0,
          1
        );
        const radialStrength = clamp(
          0.235 + 0.045 * maxAxis + 0.04 * cornerFactor - 0.045 * zoomProgress,
          0.18,
          0.3
        );
        const xEdgeGuard = 0.22 + 0.03 * zoomProgress;
        const yEdgeGuard = 0.25 + 0.06 * zoomProgress;
        return {
          x: clamp(0.5 + vectorX * radialStrength, xEdgeGuard, 1 - xEdgeGuard),
          y: clamp(0.54 + vectorY * radialStrength, yEdgeGuard, 1 - yEdgeGuard),
        };
      }
    }
    return { x: 0.5, y: 0.54 };
  }

  if (reason === "t20-setup") {
    return { x: 0.5, y: 0.36 };
  }

  if (reason === "smart-setup" && segment === "T20") {
    return { x: 0.5, y: 0.4 };
  }

  return { x: 0.5, y: 0.56 };
}

function getStyleValue(styleDecl, propertyName) {
  if (!styleDecl) {
    return "";
  }

  if (typeof styleDecl.getPropertyValue === "function") {
    return String(styleDecl.getPropertyValue(propertyName) || "");
  }

  return String(styleDecl[propertyName] || "");
}

function getStylePriority(styleDecl, propertyName) {
  if (!styleDecl || typeof styleDecl.getPropertyPriority !== "function") {
    return "";
  }
  return String(styleDecl.getPropertyPriority(propertyName) || "");
}

function setStyleWithPriority(styleDecl, propertyName, value, priority = "") {
  if (!styleDecl || typeof styleDecl.setProperty !== "function") {
    return;
  }
  styleDecl.setProperty(propertyName, value, priority);
}

function restoreStyleWithPriority(styleDecl, propertyName, snapshot) {
  if (!styleDecl) {
    return;
  }

  const value = String(snapshot?.value || "");
  const priority = String(snapshot?.priority || "");
  if (!value) {
    if (typeof styleDecl.removeProperty === "function") {
      styleDecl.removeProperty(propertyName);
    }
    return;
  }

  if (typeof styleDecl.setProperty === "function") {
    styleDecl.setProperty(propertyName, value, priority);
  }
}

function cacheHostStyle(state, hostNode) {
  if (!hostNode || !hostNode.style || state.hostStyleSnapshot?.node === hostNode) {
    return;
  }

  state.hostStyleSnapshot = {
    node: hostNode,
    overflow: {
      value: getStyleValue(hostNode.style, "overflow"),
      priority: getStylePriority(hostNode.style, "overflow"),
    },
    overflowX: {
      value: getStyleValue(hostNode.style, "overflow-x"),
      priority: getStylePriority(hostNode.style, "overflow-x"),
    },
    overflowY: {
      value: getStyleValue(hostNode.style, "overflow-y"),
      priority: getStylePriority(hostNode.style, "overflow-y"),
    },
  };
}

function restoreHostStyle(state, hostNode) {
  if (!hostNode || !hostNode.style) {
    return;
  }

  const snapshot = state.hostStyleSnapshot;
  if (snapshot?.node === hostNode) {
    restoreStyleWithPriority(hostNode.style, "overflow", snapshot.overflow);
    restoreStyleWithPriority(hostNode.style, "overflow-x", snapshot.overflowX);
    restoreStyleWithPriority(hostNode.style, "overflow-y", snapshot.overflowY);
  } else {
    hostNode.style.removeProperty("overflow");
    hostNode.style.removeProperty("overflow-x");
    hostNode.style.removeProperty("overflow-y");
  }
  hostNode.classList?.remove?.(ZOOM_HOST_CLASS);
}

function cacheTargetStyle(state, targetNode) {
  if (!targetNode || !targetNode.style || state.targetStyleSnapshot?.node === targetNode) {
    return;
  }

  state.targetStyleSnapshot = {
    node: targetNode,
    transform: String(targetNode.style.transform || ""),
    transition: String(targetNode.style.transition || ""),
    transformOrigin: String(targetNode.style.transformOrigin || ""),
    willChange: String(targetNode.style.willChange || ""),
  };
}

function restoreTargetStyle(state, targetNode) {
  if (!targetNode || !targetNode.style) {
    return;
  }

  const snapshot = state.targetStyleSnapshot;
  if (snapshot?.node === targetNode) {
    targetNode.style.transform = snapshot.transform;
    targetNode.style.transition = snapshot.transition;
    targetNode.style.transformOrigin = snapshot.transformOrigin;
    targetNode.style.willChange = snapshot.willChange;
  } else {
    targetNode.style.removeProperty("transform");
    targetNode.style.removeProperty("transition");
    targetNode.style.removeProperty("transform-origin");
    targetNode.style.removeProperty("will-change");
  }

  targetNode.classList?.remove?.(ZOOM_CLASS);
}

function isLikelyGifOverlayNode(node) {
  if (!node) {
    return false;
  }

  const idToken = String(node.id || "").toLowerCase();
  const classToken = String(node.classList?.toString?.() || "").toLowerCase();
  const srcToken = String(
    node.currentSrc || node.src || node.getAttribute?.("src") || ""
  ).toLowerCase();

  return (
    idToken.includes("gif") ||
    classToken.includes("gif") ||
    srcToken.includes(".gif") ||
    srcToken.includes("giphy") ||
    srcToken.includes("tenor")
  );
}

function collectGifOverlayNodes(targetNode, hostNode) {
  const roots = [];
  const showAnimationsRoot = targetNode?.closest?.(".showAnimations") || null;
  if (showAnimationsRoot) {
    roots.push(showAnimationsRoot);
  }
  if (hostNode && !roots.includes(hostNode)) {
    roots.push(hostNode);
  }

  const seen = new Set();
  const overlays = [];
  roots.forEach((rootNode) => {
    if (!rootNode || typeof rootNode.querySelectorAll !== "function") {
      return;
    }

    const candidates = [
      ...Array.from(rootNode.querySelectorAll("img,video")),
      ...Array.from(rootNode.querySelectorAll("#gif-animation,.gif-animation")),
    ];

    if (isLikelyGifOverlayNode(rootNode)) {
      candidates.push(rootNode);
    }

    candidates.forEach((node) => {
      if (!node || seen.has(node) || !isLikelyGifOverlayNode(node)) {
        return;
      }
      seen.add(node);
      overlays.push(node);
    });
  });

  return overlays;
}

function restoreGifOverlayStyles(state) {
  const snapshots = Array.isArray(state?.gifStyleSnapshots) ? state.gifStyleSnapshots : [];
  snapshots.forEach((snapshot) => {
    const node = snapshot?.node;
    if (!node || !node.style) {
      return;
    }

    node.style.width = String(snapshot.width || "");
    node.style.height = String(snapshot.height || "");
    node.style.maxWidth = String(snapshot.maxWidth || "");
    node.style.maxHeight = String(snapshot.maxHeight || "");
    node.style.objectFit = String(snapshot.objectFit || "");
  });

  if (state) {
    state.gifStyleSnapshots = [];
  }
}

function applyGifOverlayContainment(state, targetNode, hostNode) {
  restoreGifOverlayStyles(state);

  if (!hostNode) {
    return;
  }

  const hostRect = hostNode.getBoundingClientRect?.();
  if (!(hostRect?.width > 0 && hostRect?.height > 0)) {
    return;
  }

  const overlays = collectGifOverlayNodes(targetNode, hostNode);
  if (!overlays.length) {
    return;
  }

  const maxWidthPx = `${hostRect.width.toFixed(2)}px`;
  const maxHeightPx = `${hostRect.height.toFixed(2)}px`;
  const snapshots = [];

  overlays.forEach((node) => {
    const rect = node.getBoundingClientRect?.();
    if (!(rect?.width > 0 && rect?.height > 0)) {
      return;
    }

    // Only override overlays that currently exceed available host space.
    const exceedsHost = rect.width > hostRect.width + 0.5 || rect.height > hostRect.height + 0.5;
    if (!exceedsHost) {
      return;
    }

    snapshots.push({
      node,
      width: String(node.style.width || ""),
      height: String(node.style.height || ""),
      maxWidth: String(node.style.maxWidth || ""),
      maxHeight: String(node.style.maxHeight || ""),
      objectFit: String(node.style.objectFit || ""),
    });

    node.style.width = "auto";
    node.style.height = "auto";
    node.style.maxWidth = maxWidthPx;
    node.style.maxHeight = maxHeightPx;
    node.style.objectFit = "contain";
  });

  state.gifStyleSnapshots = snapshots;
}

function clearPendingRelease(state) {
  if (!state || !state.releaseTimeoutId) {
    return;
  }

  clearTimeout(state.releaseTimeoutId);
  state.releaseTimeoutId = 0;
}

function getScreenPointFromViewBoxPoint(boardSvg, point, viewBox) {
  const svgRect = boardSvg?.getBoundingClientRect?.();
  if (!(svgRect?.width > 0 && svgRect?.height > 0)) {
    return null;
  }

  const normalizedX = (point.x - viewBox.x) / viewBox.width;
  const normalizedY = (point.y - viewBox.y) / viewBox.height;
  return {
    x: svgRect.left + normalizedX * svgRect.width,
    y: svgRect.top + normalizedY * svgRect.height,
  };
}

export function buildZoomTransform(options = {}) {
  const targetNode = options.targetNode;
  const hostNode = options.hostNode || targetNode;
  const boardSvg = options.boardSvg;
  const zoomLevel = Number(options.zoomLevel);
  const intent = options.intent || null;
  const x01Rules = options.x01Rules || null;
  const windowRef = options.windowRef || (typeof window !== "undefined" ? window : null);
  const documentRef = options.documentRef || (typeof document !== "undefined" ? document : null);
  const providedBaseTransform =
    typeof options.baseTransform === "string" ? options.baseTransform : null;

  if (!targetNode || !boardSvg || !hostNode || !Number.isFinite(zoomLevel) || zoomLevel <= 0 || !intent) {
    return null;
  }

  const segmentPoint = resolveSegmentPoint(intent.segment, boardSvg, x01Rules);
  if (!segmentPoint) {
    return null;
  }

  const targetRect = targetNode.getBoundingClientRect?.();
  const viewportRect = hostNode.getBoundingClientRect?.();
  if (!(targetRect?.width > 0 && targetRect?.height > 0 && viewportRect?.width > 0 && viewportRect?.height > 0)) {
    return null;
  }

  const layoutWidth = Number(targetNode.offsetWidth || targetNode.clientWidth || targetRect.width || 0);
  const layoutHeight = Number(targetNode.offsetHeight || targetNode.clientHeight || targetRect.height || 0);
  if (!(layoutWidth > 0 && layoutHeight > 0)) {
    return null;
  }

  const scaleX = targetRect.width / layoutWidth;
  const scaleY = targetRect.height / layoutHeight;
  if (!(Number.isFinite(scaleX) && scaleX > 0 && Number.isFinite(scaleY) && scaleY > 0)) {
    return null;
  }

  const screenPoint = getScreenPointFromViewBoxPoint(boardSvg, segmentPoint, segmentPoint.viewBox);
  if (!screenPoint) {
    return null;
  }

  const targetLocal = {
    x: (screenPoint.x - targetRect.left) / scaleX,
    y: (screenPoint.y - targetRect.top) / scaleY,
  };
  if (!(Number.isFinite(targetLocal.x) && Number.isFinite(targetLocal.y))) {
    return null;
  }

  const offsetParent =
    targetNode.offsetParent ||
    documentRef?.documentElement ||
    documentRef?.body ||
    null;
  const offsetParentRect = offsetParent?.getBoundingClientRect?.() || { left: 0, top: 0 };
  const baseLeft = Number(targetNode.offsetLeft || 0);
  const baseTop = Number(targetNode.offsetTop || 0);

  const anchor = resolveZoomAnchor(
    { ...intent, zoomLevel },
    segmentPoint.parsedSegment,
    segmentPoint
  );
  const viewportLeftInParent = viewportRect.left - offsetParentRect.left;
  const viewportTopInParent = viewportRect.top - offsetParentRect.top;
  const viewportRightInParent = viewportLeftInParent + viewportRect.width;
  const viewportBottomInParent = viewportTopInParent + viewportRect.height;

  const anchorXInParent = viewportLeftInParent + viewportRect.width * anchor.x;
  const anchorYInParent = viewportTopInParent + viewportRect.height * anchor.y;

  const rawTx = anchorXInParent - baseLeft - zoomLevel * targetLocal.x;
  const rawTy = anchorYInParent - baseTop - zoomLevel * targetLocal.y;

  const minTx = viewportRightInParent - baseLeft - zoomLevel * layoutWidth;
  const maxTx = viewportLeftInParent - baseLeft;
  const minTy = viewportBottomInParent - baseTop - zoomLevel * layoutHeight;
  const maxTy = viewportTopInParent - baseTop;

  const tx = clamp(rawTx, minTx, maxTx);
  const ty = clamp(rawTy, minTy, maxTy);

  let baseTransform = providedBaseTransform;
  if (baseTransform === null) {
    try {
      baseTransform = String(windowRef?.getComputedStyle?.(targetNode)?.transform || "");
    } catch (_) {
      baseTransform = "";
    }
  }
  if (baseTransform === "none") {
    baseTransform = "";
  }

  const transform = `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px) scale(${zoomLevel.toFixed(4)})`;
  const signature = [
    baseTransform || "none",
    tx.toFixed(2),
    ty.toFixed(2),
    zoomLevel.toFixed(4),
    String(segmentPoint.parsedSegment?.normalized || intent.segment || ""),
    String(intent.reason || ""),
  ].join("|");

  return {
    transform,
    baseTransform,
    signature,
    anchor,
  };
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

  const boundaryToken = resolveGameBoundaryToken(gameState);
  const lastBoundaryToken = String(state.matchBoundaryToken || "");
  if (boundaryToken && lastBoundaryToken && boundaryToken !== lastBoundaryToken) {
    state.holdUntilTs = 0;
    state.activeIntent = null;
    state.stickyUntilTurnChange = false;
    state.stickyUntilLegEnd = false;
    state.manualPause = false;
    state.manualPauseThrowCount = -1;
    state.lastTurnId = "";
    state.lastThrowCount = -1;
  }
  if (boundaryToken) {
    state.matchBoundaryToken = boundaryToken;
  }

  const turn = typeof gameState.getActiveTurn === "function" ? gameState.getActiveTurn() : null;
  const throws = Array.isArray(gameState.getActiveThrows?.()) ? gameState.getActiveThrows() : [];
  if (!turn) {
    return null;
  }

  const turnId = getTurnId(turn);
  const throwCount = throws.length;
  const previousThrowCount =
    Number.isFinite(state.lastThrowCount) && state.lastThrowCount >= 0
      ? state.lastThrowCount
      : -1;
  const turnChanged = turnId !== state.lastTurnId;

  if (turnChanged) {
    state.holdUntilTs = 0;
    if (!state.stickyUntilLegEnd) {
      state.activeIntent = null;
    }
    state.stickyUntilTurnChange = false;
    state.manualPause = false;
    state.manualPauseThrowCount = -1;
  }

  if (!turnChanged && previousThrowCount >= 0 && throwCount < previousThrowCount) {
    markManualZoomPause(state, throwCount);
    state.lastTurnId = turnId;
    state.lastThrowCount = throwCount;
    return null;
  }

  state.lastTurnId = turnId;
  state.lastThrowCount = throwCount;

  const activeScore =
    Number.isFinite(gameState.getActiveScore?.()) && gameState.getActiveScore() >= 0
      ? gameState.getActiveScore()
      : getBestVisibleScoreFromDom(documentRef, windowRef);
  const suggestionSegment = getSuggestionSegmentFromDom(documentRef, windowRef, x01Rules);
  const suggestionIsCheckout = isOneDartCheckoutSegmentForMode(suggestionSegment, outMode, x01Rules);
  const suggestionMatchesScore = canFinishWithSegment(
    activeScore,
    suggestionSegment,
    outMode,
    x01Rules
  );
  const scoreCheckoutSegment = getScoreCheckoutSegment(activeScore, outMode, x01Rules);
  const canUseT20Setup = canUseThirdDartT20Setup(
    throws,
    throwCount,
    activeScore,
    outMode,
    x01Rules
  );

  if (state.manualPause) {
    const baseline =
      Number.isFinite(state.manualPauseThrowCount) && state.manualPauseThrowCount >= 0
        ? state.manualPauseThrowCount
        : -1;
    if (throwCount <= baseline) {
      return null;
    }
    state.manualPause = false;
    state.manualPauseThrowCount = -1;
  }

  if (state.stickyUntilLegEnd && state.activeIntent) {
    if (Number.isFinite(activeScore) && activeScore === 0) {
      return state.activeIntent;
    }
    state.stickyUntilLegEnd = false;
    state.activeIntent = null;
  }

  if (state.stickyUntilTurnChange && state.activeIntent) {
    return state.activeIntent;
  }

  if (!turnChanged && state.activeIntent && previousThrowCount === 2 && throwCount === 3) {
    const thirdSegment = getThrowSegmentName(throws[2], x01Rules);
    if (state.activeIntent.reason === "t20-setup" && thirdSegment === "T20") {
      state.holdUntilTs = 0;
      state.stickyUntilTurnChange = true;
      return state.activeIntent;
    }
    if (state.activeIntent.reason === "checkout" && Number.isFinite(activeScore) && activeScore === 0) {
      state.holdUntilTs = 0;
      state.stickyUntilLegEnd = true;
      return state.activeIntent;
    }
    state.holdUntilTs = nowTs + HOLD_AFTER_THIRD_MS;
  }

  if (state.activeIntent?.reason === "checkout" && Number.isFinite(activeScore) && activeScore === 0) {
    state.holdUntilTs = 0;
    state.stickyUntilLegEnd = true;
    return state.activeIntent;
  }

  if (config.checkoutZoomEnabled && throwCount <= 2) {
    if (
      suggestionSegment &&
      suggestionIsCheckout &&
      (!Number.isFinite(activeScore) || suggestionMatchesScore)
    ) {
      const intent = { reason: "checkout", segment: suggestionSegment };
      state.activeIntent = intent;
      return intent;
    }

    if (scoreCheckoutSegment) {
      const intent = { reason: "checkout", segment: scoreCheckoutSegment };
      state.activeIntent = intent;
      return intent;
    }
  }

  if (throwCount <= 2) {
    const canUseSuggestionForSetup =
      Boolean(suggestionSegment) &&
      (config.checkoutZoomEnabled || !suggestionIsCheckout);
    const canUseSuggestionSegment =
      canUseSuggestionForSetup && (suggestionSegment !== "T20" || canUseT20Setup);
    if (canUseSuggestionSegment) {
      const reason = suggestionSegment === "T20" ? "t20-setup" : "smart-setup";
      const intent = { reason, segment: suggestionSegment };
      state.activeIntent = intent;
      return intent;
    }
  }

  if (canUseT20Setup) {
    const intent = { reason: "t20-setup", segment: "T20" };
    state.activeIntent = intent;
    return intent;
  }

  if (state.holdUntilTs > nowTs && state.activeIntent) {
    return state.activeIntent;
  }

  state.activeIntent = null;
  return null;
}

export function applyZoom(
  targetNode,
  hostNode,
  boardSvg,
  zoomLevel,
  speedConfig,
  intent,
  state,
  options = {}
) {
  if (!targetNode || !targetNode.style) {
    return;
  }

  const x01Rules = options.x01Rules || null;
  const windowRef = options.windowRef || (typeof window !== "undefined" ? window : null);
  const documentRef = options.documentRef || (typeof document !== "undefined" ? document : null);
  clearPendingRelease(state);

  if (state.zoomedElement && state.zoomedElement !== targetNode) {
    restoreTargetStyle(state, state.zoomedElement);
    state.zoomedElement = null;
    state.lastAppliedSignature = "";
  }
  if (state.zoomHost && state.zoomHost !== hostNode) {
    restoreHostStyle(state, state.zoomHost);
    state.zoomHost = null;
  }

  cacheTargetStyle(state, targetNode);
  const cachedBaseTransform =
    state.targetStyleSnapshot?.node === targetNode
      ? String(state.targetStyleSnapshot.transform || "")
      : "";
  const zoomData = buildZoomTransform({
    targetNode,
    hostNode: hostNode || targetNode,
    boardSvg,
    zoomLevel,
    intent,
    x01Rules,
    windowRef,
    documentRef,
    baseTransform: cachedBaseTransform,
  });

  if (!zoomData) {
    return;
  }
  if (hostNode?.classList) {
    cacheHostStyle(state, hostNode);
    hostNode.classList.add(ZOOM_HOST_CLASS);
    setStyleWithPriority(hostNode.style, "overflow", "hidden", "important");
    setStyleWithPriority(hostNode.style, "overflow-x", "hidden", "important");
    setStyleWithPriority(hostNode.style, "overflow-y", "hidden", "important");
  }
  applyGifOverlayContainment(state, targetNode, hostNode || targetNode);

  const composedTransform = zoomData.baseTransform
    ? `${zoomData.baseTransform} ${zoomData.transform}`
    : zoomData.transform;
  if (state.zoomedElement === targetNode && state.lastAppliedSignature === zoomData.signature) {
    state.zoomHost = hostNode || null;
    return;
  }

  targetNode.classList.add(ZOOM_CLASS);
  targetNode.style.transformOrigin = "0 0";
  targetNode.style.willChange = "transform";
  targetNode.style.transition = `transform ${speedConfig.zoomInMs}ms ${speedConfig.easingIn}`;
  targetNode.style.transform = composedTransform;

  state.zoomedElement = targetNode;
  state.zoomHost = hostNode || null;
  state.lastAppliedSignature = zoomData.signature;
}

export function resetZoom(speedConfig, state, immediate = false) {
  clearPendingRelease(state);

  const targetNode = state.zoomedElement;
  const hostNode = state.zoomHost;
  const targetSnapshot = state.targetStyleSnapshot;
  const snapshotTransform =
    targetSnapshot?.node === targetNode ? targetSnapshot.transform : "";

  if (!targetNode) {
    restoreGifOverlayStyles(state);
    if (hostNode) {
      restoreHostStyle(state, hostNode);
    }
    state.zoomHost = null;
    state.hostStyleSnapshot = null;
    state.lastAppliedSignature = "";
    return;
  }

  if (immediate) {
    restoreTargetStyle(state, targetNode);
    restoreGifOverlayStyles(state);
    if (hostNode) {
      restoreHostStyle(state, hostNode);
    }

    state.zoomedElement = null;
    state.zoomHost = null;
    state.targetStyleSnapshot = null;
    state.hostStyleSnapshot = null;
    state.lastAppliedSignature = "";
    return;
  }

  targetNode.style.transition = `transform ${speedConfig.zoomOutMs}ms ${speedConfig.easingOut}`;
  targetNode.style.transform = snapshotTransform;

  const expectedTarget = targetNode;
  const expectedHost = hostNode;
  const releaseDelay = Math.max(0, Number(speedConfig?.zoomOutMs || 0)) + RELEASE_PADDING_MS;
  state.releaseTimeoutId = setTimeout(() => {
    state.releaseTimeoutId = 0;
    restoreGifOverlayStyles(state);

    if (state.zoomedElement === expectedTarget) {
      restoreTargetStyle(state, expectedTarget);
      state.zoomedElement = null;
      state.targetStyleSnapshot = null;
    }

    if (state.zoomHost === expectedHost && expectedHost) {
      restoreHostStyle(state, expectedHost);
      state.zoomHost = null;
      state.hostStyleSnapshot = null;
    }

    state.lastAppliedSignature = "";
  }, releaseDelay);
}
