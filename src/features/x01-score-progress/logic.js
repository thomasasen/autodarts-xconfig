import {
  ACTIVE_CLASS,
  FILL_CLASS,
  getPresetClass,
  HOST_ATTRIBUTE,
  HOST_SELECTOR,
  INACTIVE_CLASS,
  normalizeDesignPreset,
  TRACK_CLASS,
} from "./style.js";

export const VARIANT_ELEMENT_ID = "ad-ext-game-variant";
export const PLAYER_DISPLAY_SELECTOR = "#ad-ext-player-display";
export const PLAYER_CARD_SELECTOR = ".ad-ext-player";
export const PLAYER_STACK_SELECTOR = ".chakra-stack";
export const PLAYER_SCORE_SELECTOR = "p.ad-ext-player-score";
export const START_SCORE_PATTERN = /\b(121|170|\d+01)\b/i;
export const WIDTH_PROPERTY = "--ad-ext-x01-score-progress-width";
export const DEBUG_MAX_CARD_SAMPLES = 4;

function isFiniteNumber(value) {
  return Number.isFinite(value);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function formatProgressWidth(ratio) {
  const normalizedRatio = clamp(Number(ratio) || 0, 0, 1);
  const percentage = (normalizedRatio * 100).toFixed(2);
  return percentage.endsWith(".00") ? `${Number(percentage)}%` : `${percentage}%`;
}

function getLocationPath(windowRef) {
  return String(windowRef?.location?.pathname || "").trim();
}

function isMatchRoute(windowRef) {
  const pathname = getLocationPath(windowRef);
  const hash = String(windowRef?.location?.hash || "").trim().toLowerCase();
  return pathname.startsWith("/matches") && hash !== "#ad-xconfig";
}

function isCandidateNodeAllowed(node) {
  if (!node || typeof node.closest !== "function") {
    return false;
  }

  return !node.closest(
    `${PLAYER_DISPLAY_SELECTOR}, #ad-xconfig-panel-host, #ad-ext-turn, .suggestion`
  );
}

function readNodeCandidateValues(node) {
  if (!node || typeof node.getAttribute !== "function") {
    return [String(node?.textContent || "")];
  }

  return [
    String(node.textContent || ""),
    String(node.value || ""),
    String(node.getAttribute("value") || ""),
    String(node.getAttribute("data-value") || ""),
    String(node.getAttribute("aria-label") || ""),
    String(node.getAttribute("title") || ""),
  ];
}

function queryAll(documentRef, selector) {
  if (!documentRef || typeof documentRef.querySelectorAll !== "function") {
    return [];
  }

  return Array.from(documentRef.querySelectorAll(selector));
}

function readClassName(node) {
  if (!node) {
    return "";
  }

  if (typeof node.className === "string") {
    return node.className.trim();
  }

  if (node.classList && typeof node.classList.toString === "function") {
    return String(node.classList.toString()).trim();
  }

  return "";
}

function summarizeNode(node) {
  if (!node) {
    return "-";
  }

  const tag = String(node.tagName || node.nodeName || "node").toLowerCase();
  const className = readClassName(node);
  return className ? `${tag}.${className.replace(/\s+/g, ".")}` : tag;
}

function readRect(node) {
  if (!node || typeof node.getBoundingClientRect !== "function") {
    return null;
  }

  const rect = node.getBoundingClientRect();
  if (!rect || !Number.isFinite(Number(rect.width)) || !Number.isFinite(Number(rect.height))) {
    return null;
  }

  return {
    width: Number(rect.width),
    height: Number(rect.height),
  };
}

function readComputedDisplay(windowRef, node) {
  if (!node || !windowRef || typeof windowRef.getComputedStyle !== "function") {
    return "";
  }

  try {
    return String(windowRef.getComputedStyle(node)?.display || "");
  } catch (_) {
    return "";
  }
}

function toCompactText(value, maxLength = 90) {
  const normalized = String(value || "").replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }
  return `${normalized.slice(0, maxLength)}…`;
}

export function parseDisplayedScore(text) {
  const match = String(text || "").match(/\d+/);
  if (!match) {
    return null;
  }

  const value = Number(match[0]);
  return Number.isFinite(value) ? value : null;
}

export function extractStartScore(value) {
  const match = String(value || "").match(START_SCORE_PATTERN);
  if (!match) {
    return null;
  }

  const startScore = Number(match[1]);
  return Number.isFinite(startScore) ? startScore : null;
}

export function isSupportedX01VariantText(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) {
    return false;
  }

  return normalized.includes("x01") || isFiniteNumber(extractStartScore(normalized));
}

export function getVariantTexts(context = {}) {
  const snapshot =
    context.gameState && typeof context.gameState.getSnapshot === "function"
      ? context.gameState.getSnapshot()
      : null;
  const documentRef = context.documentRef;
  const variantElement =
    documentRef && typeof documentRef.getElementById === "function"
      ? documentRef.getElementById(VARIANT_ELEMENT_ID)
      : null;

  return {
    snapshotVariant: String(snapshot?.match?.variant || ""),
    domVariant: String(variantElement?.textContent || ""),
  };
}

export function resolveStartScoreFromVariantText(value) {
  return extractStartScore(value);
}

export function resolveStartScoreFromDom(documentRef) {
  if (!documentRef) {
    return null;
  }

  const prioritizedSelectors = [
    "option[selected]",
    "[aria-selected='true']",
    "[data-selected='true']",
    "[data-checked='true']",
    "[aria-pressed='true']",
  ];

  for (const selector of prioritizedSelectors) {
    const nodes = queryAll(documentRef, selector).filter(isCandidateNodeAllowed);
    for (const node of nodes) {
      for (const candidateValue of readNodeCandidateValues(node)) {
        const resolved = extractStartScore(candidateValue);
        if (isFiniteNumber(resolved)) {
          return resolved;
        }
      }
    }
  }

  const fallbackNodes = queryAll(
    documentRef,
    "option, button, [role='tab'], [role='button'], .chakra-button, .chakra-badge, .chakra-tag"
  ).filter(isCandidateNodeAllowed);

  for (const node of fallbackNodes) {
    for (const candidateValue of readNodeCandidateValues(node)) {
      const resolved = extractStartScore(candidateValue);
      if (isFiniteNumber(resolved)) {
        return resolved;
      }
    }
  }

  return null;
}

export function buildMatchCacheKey(context = {}) {
  const snapshot =
    context.gameState && typeof context.gameState.getSnapshot === "function"
      ? context.gameState.getSnapshot()
      : null;
  const locationPath = getLocationPath(context.windowRef);

  return String(snapshot?.topic || snapshot?.match?.id || locationPath || "").trim();
}

export function createScoreProgressState() {
  return {
    matchCacheKey: "",
    cachedStartScore: null,
    cachedStartScoreSource: "",
  };
}

export function resolveStartScoreWithDebug(context = {}, state = createScoreProgressState()) {
  const cacheKey = buildMatchCacheKey(context);
  const { snapshotVariant, domVariant } = getVariantTexts(context);
  const directSources = [snapshotVariant, domVariant];

  let cacheReset = false;
  if (state.matchCacheKey !== cacheKey) {
    state.matchCacheKey = cacheKey;
    state.cachedStartScore = null;
    state.cachedStartScoreSource = "";
    cacheReset = true;
  }

  if (isFiniteNumber(state.cachedStartScore)) {
    return {
      startScore: state.cachedStartScore,
      source: state.cachedStartScoreSource || "cache",
      cacheHit: true,
      cacheReset,
      cacheKey,
      snapshotVariant,
      domVariant,
      allowDomFallback:
        directSources.some((source) => isSupportedX01VariantText(source)) ||
        isMatchRoute(context.windowRef),
    };
  }

  for (const source of directSources) {
    const resolved = resolveStartScoreFromVariantText(source);
    if (isFiniteNumber(resolved)) {
      state.cachedStartScore = resolved;
      state.cachedStartScoreSource = source === snapshotVariant ? "snapshot-variant" : "dom-variant";
      return {
        startScore: resolved,
        source: state.cachedStartScoreSource,
        cacheHit: false,
        cacheReset,
        cacheKey,
        snapshotVariant,
        domVariant,
        allowDomFallback: true,
      };
    }
  }

  const allowDomFallback =
    directSources.some((source) => isSupportedX01VariantText(source)) ||
    isMatchRoute(context.windowRef);
  if (!allowDomFallback) {
    return {
      startScore: null,
      source: "dom-fallback-blocked",
      cacheHit: false,
      cacheReset,
      cacheKey,
      snapshotVariant,
      domVariant,
      allowDomFallback,
    };
  }

  const domResolved = resolveStartScoreFromDom(context.documentRef);
  if (isFiniteNumber(domResolved)) {
    state.cachedStartScore = domResolved;
    state.cachedStartScoreSource = "dom-controls";
    return {
      startScore: domResolved,
      source: state.cachedStartScoreSource,
      cacheHit: false,
      cacheReset,
      cacheKey,
      snapshotVariant,
      domVariant,
      allowDomFallback,
    };
  }

  return {
    startScore: null,
    source: "unresolved",
    cacheHit: false,
    cacheReset,
    cacheKey,
    snapshotVariant,
    domVariant,
    allowDomFallback,
  };
}

export function resolveStartScore(context = {}, state = createScoreProgressState()) {
  return resolveStartScoreWithDebug(context, state).startScore;
}

export function getPlayerCards(documentRef) {
  if (!documentRef || typeof documentRef.querySelectorAll !== "function") {
    return [];
  }

  const playerDisplay = documentRef.querySelector(PLAYER_DISPLAY_SELECTOR);
  if (playerDisplay && typeof playerDisplay.querySelectorAll === "function") {
    const displayCards = Array.from(playerDisplay.querySelectorAll(PLAYER_CARD_SELECTOR));
    if (displayCards.length) {
      return displayCards;
    }
  }

  return Array.from(documentRef.querySelectorAll(PLAYER_CARD_SELECTOR));
}

export function clearAllScoreProgress(documentRef) {
  queryAll(documentRef, HOST_SELECTOR).forEach((node) => node.remove?.());
}

function getPlayerStack(cardNode) {
  if (!cardNode || typeof cardNode.querySelector !== "function") {
    return null;
  }

  return cardNode.querySelector(PLAYER_STACK_SELECTOR) || cardNode;
}

function getPlayerScoreNode(cardNode) {
  if (!cardNode || typeof cardNode.querySelector !== "function") {
    return null;
  }

  return cardNode.querySelector(PLAYER_SCORE_SELECTOR);
}

function ensureProgressChildren(hostNode, documentRef) {
  let trackNode = hostNode.querySelector?.(`.${TRACK_CLASS}`) || null;
  let fillNode = hostNode.querySelector?.(`.${FILL_CLASS}`) || null;

  if (trackNode && fillNode) {
    return { trackNode, fillNode };
  }

  hostNode.replaceChildren?.();

  trackNode = documentRef.createElement("div");
  trackNode.classList.add(TRACK_CLASS);
  fillNode = documentRef.createElement("div");
  fillNode.classList.add(FILL_CLASS);
  trackNode.appendChild(fillNode);
  hostNode.appendChild(trackNode);

  return { trackNode, fillNode };
}

export function ensureProgressHost(cardNode, documentRef) {
  if (!cardNode || !documentRef || typeof documentRef.createElement !== "function") {
    return null;
  }

  let hostNode = cardNode.querySelector?.(HOST_SELECTOR) || null;
  if (!hostNode) {
    hostNode = documentRef.createElement("div");
    hostNode.setAttribute(HOST_ATTRIBUTE, "true");
  }

  const stackNode = getPlayerStack(cardNode) || cardNode;
  const scoreNode = getPlayerScoreNode(cardNode);
  if (hostNode.parentNode !== stackNode) {
    if (scoreNode && scoreNode.parentNode === stackNode && typeof scoreNode.insertAdjacentElement === "function") {
      scoreNode.insertAdjacentElement("afterend", hostNode);
    } else {
      stackNode.appendChild(hostNode);
    }
  } else if (scoreNode && hostNode.previousElementSibling !== scoreNode && scoreNode.parentNode === stackNode) {
    scoreNode.insertAdjacentElement?.("afterend", hostNode);
  }

  ensureProgressChildren(hostNode, documentRef);
  return hostNode;
}

export function updateProgressHost(hostNode, options = {}) {
  if (!hostNode || !hostNode.classList || !hostNode.style) {
    return;
  }

  const ratio = clamp(Number(options.ratio) || 0, 0, 1);
  const active = options.active === true;
  const presetClass = getPresetClass(options.designPreset);

  hostNode.classList.remove(
    `${ACTIVE_CLASS}`,
    `${INACTIVE_CLASS}`,
    `${getPresetClass("signal")}`,
    `${getPresetClass("glass")}`,
    `${getPresetClass("minimal")}`
  );
  hostNode.classList.add(active ? ACTIVE_CLASS : INACTIVE_CLASS);
  hostNode.classList.add(presetClass);
  hostNode.setAttribute("data-ad-ext-x01-score-progress-state", active ? "active" : "inactive");
  hostNode.setAttribute("data-ad-ext-x01-score-progress-preset", normalizeDesignPreset(options.designPreset));
  hostNode.style.setProperty(WIDTH_PROPERTY, formatProgressWidth(ratio));
}

function shouldRenderFeature(context = {}) {
  const { snapshotVariant, domVariant } = getVariantTexts(context);

  if (isSupportedX01VariantText(snapshotVariant) || isSupportedX01VariantText(domVariant)) {
    return true;
  }

  return isMatchRoute(context.windowRef);
}

export function syncScoreProgress(context = {}, state = createScoreProgressState()) {
  const documentRef = context.documentRef;
  const debugEnabled = context.featureConfig?.debug === true;
  const debugPayload = {
    reason: "unknown",
    routePath: getLocationPath(context.windowRef),
    routeHash: String(context.windowRef?.location?.hash || ""),
    shouldRender: false,
    variant: getVariantTexts(context),
    startScore: null,
    startScoreSource: "",
    startScoreCacheHit: false,
    startScoreCacheReset: false,
    allowDomFallback: false,
    cardCount: 0,
    renderedCards: 0,
    removedCardsMissingScore: 0,
    staleHostsRemoved: 0,
    hostCountAfterCleanup: 0,
    hiddenHostCount: 0,
    zeroHeightHostCount: 0,
    sampledCards: [],
  };

  const withDebug = (baseResult) => {
    if (!debugEnabled) {
      return baseResult;
    }

    return {
      ...baseResult,
      debug: debugPayload,
    };
  };

  if (!documentRef) {
    debugPayload.reason = "missing-document";
    return withDebug({ startScore: null, renderedCards: 0 });
  }

  const shouldRender = shouldRenderFeature(context);
  debugPayload.shouldRender = shouldRender;
  if (!shouldRender) {
    clearAllScoreProgress(documentRef);
    debugPayload.reason = "render-disabled";
    debugPayload.hostCountAfterCleanup = queryAll(documentRef, HOST_SELECTOR).length;
    return withDebug({ startScore: null, renderedCards: 0 });
  }

  const startScoreDebug = resolveStartScoreWithDebug(context, state);
  const startScore = startScoreDebug.startScore;
  debugPayload.startScore = startScore;
  debugPayload.startScoreSource = startScoreDebug.source;
  debugPayload.startScoreCacheHit = startScoreDebug.cacheHit;
  debugPayload.startScoreCacheReset = startScoreDebug.cacheReset;
  debugPayload.allowDomFallback = startScoreDebug.allowDomFallback;
  debugPayload.variant = {
    snapshotVariant: startScoreDebug.snapshotVariant,
    domVariant: startScoreDebug.domVariant,
  };

  if (!isFiniteNumber(startScore) || startScore <= 0) {
    clearAllScoreProgress(documentRef);
    debugPayload.reason = "missing-start-score";
    debugPayload.hostCountAfterCleanup = queryAll(documentRef, HOST_SELECTOR).length;
    return withDebug({ startScore: null, renderedCards: 0 });
  }

  const cards = getPlayerCards(documentRef);
  debugPayload.cardCount = cards.length;
  if (!cards.length) {
    clearAllScoreProgress(documentRef);
    debugPayload.reason = "missing-player-cards";
    debugPayload.hostCountAfterCleanup = queryAll(documentRef, HOST_SELECTOR).length;
    return withDebug({ startScore, renderedCards: 0 });
  }

  const activeHosts = new Set();
  let renderedCards = 0;
  let removedCardsMissingScore = 0;
  const sampledCards = [];
  const windowRef = context.windowRef || (typeof window !== "undefined" ? window : null);

  cards.forEach((cardNode, cardIndex) => {
    const stackNode = getPlayerStack(cardNode) || cardNode;
    const scoreNode = getPlayerScoreNode(cardNode);
    const scoreValue = parseDisplayedScore(scoreNode?.textContent || "");
    if (!isFiniteNumber(scoreValue)) {
      cardNode.querySelector?.(HOST_SELECTOR)?.remove?.();
      removedCardsMissingScore += 1;
      if (debugEnabled && sampledCards.length < DEBUG_MAX_CARD_SAMPLES) {
        sampledCards.push({
          index: cardIndex,
          card: summarizeNode(cardNode),
          stack: summarizeNode(stackNode),
          scoreNodeFound: Boolean(scoreNode),
          scoreText: toCompactText(scoreNode?.textContent || ""),
          parsedScore: null,
          removed: "missing-score",
        });
      }
      return;
    }

    const hostNode = ensureProgressHost(cardNode, documentRef);
    if (!hostNode) {
      if (debugEnabled && sampledCards.length < DEBUG_MAX_CARD_SAMPLES) {
        sampledCards.push({
          index: cardIndex,
          card: summarizeNode(cardNode),
          stack: summarizeNode(stackNode),
          scoreNodeFound: Boolean(scoreNode),
          scoreText: toCompactText(scoreNode?.textContent || ""),
          parsedScore: scoreValue,
          removed: "missing-host",
        });
      }
      return;
    }

    const ratio = scoreValue / startScore;
    updateProgressHost(hostNode, {
      ratio,
      active: cardNode.classList?.contains("ad-ext-player-active") === true,
      designPreset: context.featureConfig?.designPreset,
    });
    activeHosts.add(hostNode);
    renderedCards += 1;

    if (debugEnabled && sampledCards.length < DEBUG_MAX_CARD_SAMPLES) {
      const hostDisplay = readComputedDisplay(windowRef, hostNode);
      const hostRect = readRect(hostNode);
      sampledCards.push({
        index: cardIndex,
        card: summarizeNode(cardNode),
        stack: summarizeNode(stackNode),
        scoreNodeFound: Boolean(scoreNode),
        scoreText: toCompactText(scoreNode?.textContent || ""),
        parsedScore: scoreValue,
        ratio: Number(ratio.toFixed(4)),
        host: summarizeNode(hostNode),
        hostState: String(hostNode.getAttribute?.("data-ad-ext-x01-score-progress-state") || ""),
        hostPreset: String(hostNode.getAttribute?.("data-ad-ext-x01-score-progress-preset") || ""),
        hostWidth: String(hostNode.style?.getPropertyValue?.(WIDTH_PROPERTY) || ""),
        hostDisplay,
        hostRect,
        hostParent: summarizeNode(hostNode.parentNode || null),
        hostPrevious: summarizeNode(hostNode.previousElementSibling || null),
      });
    }
  });

  let staleHostsRemoved = 0;
  queryAll(documentRef, HOST_SELECTOR).forEach((hostNode) => {
    if (!activeHosts.has(hostNode)) {
      hostNode.remove?.();
      staleHostsRemoved += 1;
    }
  });

  debugPayload.reason = renderedCards > 0 ? "rendered" : "no-rendered-cards";
  debugPayload.renderedCards = renderedCards;
  debugPayload.removedCardsMissingScore = removedCardsMissingScore;
  debugPayload.staleHostsRemoved = staleHostsRemoved;
  debugPayload.sampledCards = sampledCards;

  const hostsAfter = queryAll(documentRef, HOST_SELECTOR);
  debugPayload.hostCountAfterCleanup = hostsAfter.length;
  debugPayload.hiddenHostCount = hostsAfter.filter((hostNode) => {
    const display = readComputedDisplay(windowRef, hostNode).toLowerCase();
    return display === "none";
  }).length;
  debugPayload.zeroHeightHostCount = hostsAfter.filter((hostNode) => {
    const rect = readRect(hostNode);
    return rect ? rect.height <= 0 : false;
  }).length;

  return withDebug({
    startScore,
    renderedCards,
  });
}
