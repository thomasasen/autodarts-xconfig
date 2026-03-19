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
  };
}

export function resolveStartScore(context = {}, state = createScoreProgressState()) {
  const cacheKey = buildMatchCacheKey(context);
  if (state.matchCacheKey !== cacheKey) {
    state.matchCacheKey = cacheKey;
    state.cachedStartScore = null;
  }

  if (isFiniteNumber(state.cachedStartScore)) {
    return state.cachedStartScore;
  }

  const { snapshotVariant, domVariant } = getVariantTexts(context);
  const directSources = [snapshotVariant, domVariant];
  for (const source of directSources) {
    const resolved = resolveStartScoreFromVariantText(source);
    if (isFiniteNumber(resolved)) {
      state.cachedStartScore = resolved;
      return resolved;
    }
  }

  const allowDomFallback =
    directSources.some((source) => isSupportedX01VariantText(source)) ||
    isMatchRoute(context.windowRef);
  if (!allowDomFallback) {
    return null;
  }

  const domResolved = resolveStartScoreFromDom(context.documentRef);
  if (isFiniteNumber(domResolved)) {
    state.cachedStartScore = domResolved;
    return domResolved;
  }

  return null;
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
  if (!documentRef) {
    return { startScore: null, renderedCards: 0 };
  }

  if (!shouldRenderFeature(context)) {
    clearAllScoreProgress(documentRef);
    return { startScore: null, renderedCards: 0 };
  }

  const startScore = resolveStartScore(context, state);
  if (!isFiniteNumber(startScore) || startScore <= 0) {
    clearAllScoreProgress(documentRef);
    return { startScore: null, renderedCards: 0 };
  }

  const cards = getPlayerCards(documentRef);
  if (!cards.length) {
    clearAllScoreProgress(documentRef);
    return { startScore, renderedCards: 0 };
  }

  const activeHosts = new Set();
  let renderedCards = 0;

  cards.forEach((cardNode) => {
    const scoreNode = getPlayerScoreNode(cardNode);
    const scoreValue = parseDisplayedScore(scoreNode?.textContent || "");
    if (!isFiniteNumber(scoreValue)) {
      cardNode.querySelector?.(HOST_SELECTOR)?.remove?.();
      return;
    }

    const hostNode = ensureProgressHost(cardNode, documentRef);
    if (!hostNode) {
      return;
    }

    updateProgressHost(hostNode, {
      ratio: scoreValue / startScore,
      active: cardNode.classList?.contains("ad-ext-player-active") === true,
      designPreset: context.featureConfig?.designPreset,
    });
    activeHosts.add(hostNode);
    renderedCards += 1;
  });

  queryAll(documentRef, HOST_SELECTOR).forEach((hostNode) => {
    if (!activeHosts.has(hostNode)) {
      hostNode.remove?.();
    }
  });

  return {
    startScore,
    renderedCards,
  };
}
