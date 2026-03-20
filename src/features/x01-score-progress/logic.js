import {
  ACTIVE_CLASS,
  FILL_CLASS,
  getEffectFillClass,
  getEffectFillClassList,
  getSizeClass,
  getSizeClassList,
  HOST_ATTRIBUTE,
  HOST_SELECTOR,
  INACTIVE_CLASS,
  normalizeBarSize,
  normalizeColorTheme,
  normalizeEffect,
  TRAIL_CLASS,
  TRACK_CLASS,
} from "./style.js";

export const VARIANT_ELEMENT_ID = "ad-ext-game-variant";
export const PLAYER_DISPLAY_SELECTOR = "#ad-ext-player-display";
export const PLAYER_CARD_SELECTOR = ".ad-ext-player";
export const PLAYER_STACK_SELECTOR = ".chakra-stack";
export const PLAYER_SCORE_SELECTOR = "p.ad-ext-player-score";
export const ACTIVE_SCORE_SELECTORS = Object.freeze([
  ".ad-ext-player.ad-ext-player-active p.ad-ext-player-score",
  ".ad-ext-player-active p.ad-ext-player-score",
]);
export const START_SCORE_PATTERN = /\b(121|170|\d+01)\b/i;
export const WIDTH_PROPERTY = "--ad-ext-x01-score-progress-width";
export const DEBUG_MAX_CARD_SAMPLES = 4;
export const COLOR_THEME_ATTRIBUTE = "data-ad-ext-x01-score-progress-color-theme";
export const SIZE_ATTRIBUTE = "data-ad-ext-x01-score-progress-size";
export const EFFECT_ATTRIBUTE = "data-ad-ext-x01-score-progress-effect";

const ACTIVE_STYLE_PROPERTIES = Object.freeze([
  "--ad-ext-x01-score-progress-track-base-active",
  "--ad-ext-x01-score-progress-fill-base-active",
  "--ad-ext-x01-score-progress-track-solid-active",
  "--ad-ext-x01-score-progress-fill-solid-active",
  "--ad-ext-x01-score-progress-fill-outline-active",
  "--ad-ext-x01-score-progress-fill-ambient-active",
  "--ad-ext-x01-score-progress-track-border-active",
  "--ad-ext-x01-score-progress-track-bg-active",
  "--ad-ext-x01-score-progress-fill-bg-active",
  "--ad-ext-x01-score-progress-fill-shadow-active",
  "--ad-ext-x01-score-progress-track-overlay-active",
  "--ad-ext-x01-score-progress-track-overlay-opacity-active",
  "--ad-ext-x01-score-progress-track-inner-shadow-active",
  "--ad-ext-x01-score-progress-track-backdrop-filter-active",
  "--ad-ext-x01-score-progress-fill-overlay-image-active",
  "--ad-ext-x01-score-progress-fill-overlay-size-active",
  "--ad-ext-x01-score-progress-fill-overlay-position-active",
  "--ad-ext-x01-score-progress-fill-overlay-repeat-active",
  "--ad-ext-x01-score-progress-fill-overlay-blend-active",
  "--ad-ext-x01-score-progress-fill-overlay-opacity-active",
]);
const SIZE_CLASS_LIST = Object.freeze(getSizeClassList());
const EFFECT_FILL_CLASS_LIST = Object.freeze(getEffectFillClassList());
const THRESHOLD_COLOR_THEMES = new Set([
  "checkout-focus",
  "traffic-light",
  "danger-endgame",
  "gradient-by-progress",
]);
const STATIC_COLOR_THEME_PALETTES = Object.freeze({
  autodarts: Object.freeze({
    start: [56, 189, 248],
    mid: [96, 165, 250],
    end: [125, 211, 252],
    track: [29, 78, 216],
  }),
  "signal-lime": Object.freeze({
    start: [132, 204, 22],
    mid: [163, 230, 53],
    end: [190, 242, 100],
    track: [63, 98, 18],
  }),
  "glass-mint": Object.freeze({
    start: [45, 212, 191],
    mid: [110, 231, 183],
    end: [187, 247, 208],
    track: [16, 185, 129],
  }),
  "ember-rush": Object.freeze({
    start: [251, 146, 60],
    mid: [249, 115, 22],
    end: [239, 68, 68],
    track: [154, 52, 18],
  }),
  "ice-circuit": Object.freeze({
    start: [56, 189, 248],
    mid: [34, 211, 238],
    end: [45, 212, 191],
    track: [14, 116, 144],
  }),
  "neon-violet": Object.freeze({
    start: [168, 85, 247],
    mid: [129, 140, 248],
    end: [56, 189, 248],
    track: [91, 33, 182],
  }),
  "sunset-amber": Object.freeze({
    start: [250, 204, 21],
    mid: [249, 115, 22],
    end: [244, 63, 94],
    track: [180, 83, 9],
  }),
  "monochrome-steel": Object.freeze({
    start: [226, 232, 240],
    mid: [148, 163, 184],
    end: [100, 116, 139],
    track: [71, 85, 105],
  }),
});
const EFFECT_ANIMATION_SLOT = Symbol("adExtX01ScoreProgressEffectAnimation");
const TRAIL_ANIMATION_SLOT = Symbol("adExtX01ScoreProgressTrailAnimation");
const EFFECT_CHANGE_TOKEN_ATTRIBUTE = "data-ad-ext-x01-score-progress-effect-token";
const TRAIL_WIDTH_PROPERTY = "--ad-ext-x01-score-progress-trail-width";

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

function toRgba(color, alpha) {
  const tuple = Array.isArray(color) ? color : [148, 163, 184];
  const [r, g, b] = tuple.map((value) => clamp(Number(value) || 0, 0, 255));
  const normalizedAlpha = clamp(Number(alpha) || 0, 0, 1);
  return `rgba(${r},${g},${b},${normalizedAlpha.toFixed(3)})`;
}

function buildFillGradient(palette) {
  const start = palette?.start || [132, 204, 22];
  const mid = palette?.mid || [163, 230, 53];
  const end = palette?.end || [190, 242, 100];
  return `linear-gradient(90deg,${toRgba(start, 0.98)} 0%,${toRgba(mid, 0.98)} 46%,${toRgba(
    end,
    0.99
  )} 100%)`;
}

function buildTrackGradient(palette) {
  const track = palette?.track || [63, 98, 18];
  return `linear-gradient(90deg,${toRgba(track, 0.42)} 0%,${toRgba(track, 0.15)} 100%)`;
}

function buildShadowColor(palette) {
  const shadowBase = palette?.mid || palette?.start || [163, 230, 53];
  return `0 0 18px ${toRgba(shadowBase, 0.32)}`;
}

function hslToRgb(h, s, l) {
  const hue = clamp(Number(h) || 0, 0, 360) / 360;
  const saturation = clamp(Number(s) || 0, 0, 100) / 100;
  const lightness = clamp(Number(l) || 0, 0, 100) / 100;
  if (saturation === 0) {
    const gray = Math.round(lightness * 255);
    return [gray, gray, gray];
  }

  const hueToRgb = (p, q, t) => {
    let normalizedT = t;
    if (normalizedT < 0) {
      normalizedT += 1;
    }
    if (normalizedT > 1) {
      normalizedT -= 1;
    }
    if (normalizedT < 1 / 6) {
      return p + (q - p) * 6 * normalizedT;
    }
    if (normalizedT < 1 / 2) {
      return q;
    }
    if (normalizedT < 2 / 3) {
      return p + (q - p) * (2 / 3 - normalizedT) * 6;
    }
    return p;
  };

  const q =
    lightness < 0.5 ? lightness * (1 + saturation) : lightness + saturation - lightness * saturation;
  const p = 2 * lightness - q;
  return [
    Math.round(hueToRgb(p, q, hue + 1 / 3) * 255),
    Math.round(hueToRgb(p, q, hue) * 255),
    Math.round(hueToRgb(p, q, hue - 1 / 3) * 255),
  ];
}

function createPalette(start, mid, end, track) {
  return {
    start,
    mid,
    end,
    track,
  };
}

function resolveThresholdPalette(mode, ratio, score) {
  if (mode === "gradient-by-progress") {
    const hue = clamp(10 + (1 - ratio) * 110, 10, 120);
    const start = hslToRgb(hue - 8, 88, 52);
    const mid = hslToRgb(hue, 86, 56);
    const end = hslToRgb(hue + 8, 84, 60);
    const track = hslToRgb(hue, 52, 28);
    return createPalette(start, mid, end, track);
  }

  if (mode === "traffic-light") {
    if (ratio > 0.67) {
      return createPalette([248, 113, 113], [239, 68, 68], [220, 38, 38], [153, 27, 27]);
    }
    if (ratio > 0.34) {
      return createPalette([250, 204, 21], [245, 158, 11], [234, 88, 12], [146, 64, 14]);
    }
    return createPalette([132, 204, 22], [74, 222, 128], [34, 197, 94], [22, 101, 52]);
  }

  if (mode === "danger-endgame") {
    if (score <= 50) {
      return createPalette([248, 113, 113], [239, 68, 68], [220, 38, 38], [127, 29, 29]);
    }
    if (score <= 121) {
      return createPalette([251, 146, 60], [249, 115, 22], [234, 88, 12], [124, 45, 18]);
    }
    if (score <= 170) {
      return createPalette([250, 204, 21], [245, 158, 11], [217, 119, 6], [120, 53, 15]);
    }
    return createPalette([148, 163, 184], [100, 116, 139], [71, 85, 105], [51, 65, 85]);
  }

  if (score <= 60) {
    return createPalette([74, 222, 128], [34, 197, 94], [22, 163, 74], [21, 128, 61]);
  }
  if (score <= 170) {
    return createPalette([250, 204, 21], [245, 158, 11], [217, 119, 6], [146, 64, 14]);
  }
  return createPalette([56, 189, 248], [96, 165, 250], [129, 140, 248], [37, 99, 235]);
}

function resolveColorPalette(colorTheme, ratio, score) {
  const normalizedColorTheme = normalizeColorTheme(colorTheme);
  if (THRESHOLD_COLOR_THEMES.has(normalizedColorTheme)) {
    return resolveThresholdPalette(normalizedColorTheme, ratio, score);
  }
  return (
    STATIC_COLOR_THEME_PALETTES[normalizedColorTheme] || STATIC_COLOR_THEME_PALETTES["signal-lime"]
  );
}

function resolveActiveVisualVars(options = {}) {
  const ratio = clamp(Number(options.ratio) || 0, 0, 1);
  const score = clamp(Number(options.score) || 0, 0, Number.MAX_SAFE_INTEGER);
  const palette = resolveColorPalette(options.colorTheme, ratio, score);
  return {
    "--ad-ext-x01-score-progress-track-base-active": buildTrackGradient(palette),
    "--ad-ext-x01-score-progress-fill-base-active": buildFillGradient(palette),
    "--ad-ext-x01-score-progress-track-solid-active": toRgba(palette?.track, 0.28),
    "--ad-ext-x01-score-progress-fill-solid-active": toRgba(palette?.mid || palette?.start, 0.96),
    "--ad-ext-x01-score-progress-fill-outline-active": toRgba(
      palette?.end || palette?.mid || palette?.start,
      0.34
    ),
    "--ad-ext-x01-score-progress-fill-ambient-active": toRgba(
      palette?.mid || palette?.start,
      0.26
    ),
    "--ad-ext-x01-score-progress-track-border-active": toRgba(
      palette?.end || palette?.mid || palette?.track,
      0.16
    ),
    "--ad-ext-x01-score-progress-track-bg-active": buildTrackGradient(palette),
    "--ad-ext-x01-score-progress-fill-bg-active": buildFillGradient(palette),
    "--ad-ext-x01-score-progress-fill-shadow-active": buildShadowColor(palette),
    "--ad-ext-x01-score-progress-track-overlay-active": `linear-gradient(180deg,${toRgba(
      [255, 255, 255],
      0.18
    )} 0%,rgba(255,255,255,0) 70%)`,
    "--ad-ext-x01-score-progress-track-overlay-opacity-active": "1",
    "--ad-ext-x01-score-progress-track-inner-shadow-active":
      "inset 0 0 0 1px rgba(255,255,255,.06)",
    "--ad-ext-x01-score-progress-track-backdrop-filter-active": "blur(8px) saturate(115%)",
    "--ad-ext-x01-score-progress-fill-overlay-image-active": "none",
    "--ad-ext-x01-score-progress-fill-overlay-size-active": "auto",
    "--ad-ext-x01-score-progress-fill-overlay-position-active": "0 0",
    "--ad-ext-x01-score-progress-fill-overlay-repeat-active": "repeat",
    "--ad-ext-x01-score-progress-fill-overlay-blend-active": "screen",
    "--ad-ext-x01-score-progress-fill-overlay-opacity-active": "0",
  };
}

function clearActiveVisualVars(node) {
  if (!node?.style || typeof node.style.removeProperty !== "function") {
    return;
  }
  ACTIVE_STYLE_PROPERTIES.forEach((propertyName) => {
    node.style.removeProperty(propertyName);
  });
}

function applyActiveVisualVars(node, variables = {}) {
  if (!node?.style || typeof node.style.setProperty !== "function") {
    return;
  }
  ACTIVE_STYLE_PROPERTIES.forEach((propertyName) => {
    const value = String(variables[propertyName] || "").trim();
    if (value) {
      node.style.setProperty(propertyName, value);
      return;
    }
    node.style.removeProperty(propertyName);
  });
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

function collectVariantStripNodes(documentRef) {
  if (!documentRef || typeof documentRef.getElementById !== "function") {
    return [];
  }

  const variantElement = documentRef.getElementById(VARIANT_ELEMENT_ID);
  if (!variantElement) {
    return [];
  }

  const nodes = [];
  const seen = new Set();
  const pushUnique = (node) => {
    if (!node || seen.has(node)) {
      return;
    }

    seen.add(node);
    nodes.push(node);
  };

  pushUnique(variantElement);

  const parent = variantElement.parentNode || null;
  if (parent && parent.children) {
    Array.from(parent.children).forEach(pushUnique);
  }

  const grandParent = parent?.parentNode || null;
  if (grandParent && grandParent.children) {
    Array.from(grandParent.children).forEach((node) => {
      if (node !== parent) {
        pushUnique(node);
      }
    });
  }

  return nodes;
}

export function readVariantStripTexts(documentRef) {
  const nodes = collectVariantStripNodes(documentRef);
  if (!nodes.length) {
    return [];
  }

  const texts = [];
  const seen = new Set();

  for (const node of nodes) {
    for (const candidateValue of readNodeCandidateValues(node)) {
      const compactText = toCompactText(candidateValue, 80);
      if (!compactText || seen.has(compactText)) {
        continue;
      }

      seen.add(compactText);
      texts.push(compactText);
      if (texts.length >= 12) {
        return texts;
      }
    }
  }

  return texts;
}

export function resolveStartScoreFromVariantStrip(documentRef, preparedTexts = null) {
  const texts = Array.isArray(preparedTexts) ? preparedTexts : readVariantStripTexts(documentRef);
  for (const text of texts) {
    const resolved = extractStartScore(text);
    if (isFiniteNumber(resolved)) {
      return resolved;
    }
  }

  return null;
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
    hostScores: new WeakMap(),
    cardScores: new Map(),
  };
}

export function resolveStartScoreWithDebug(context = {}, state = createScoreProgressState()) {
  const cacheKey = buildMatchCacheKey(context);
  const { snapshotVariant, domVariant } = getVariantTexts(context);
  const variantStripTexts = readVariantStripTexts(context.documentRef);
  const directSources = [snapshotVariant, domVariant];

  let cacheReset = false;
  if (state.matchCacheKey !== cacheKey) {
    state.matchCacheKey = cacheKey;
    state.cachedStartScore = null;
    state.cachedStartScoreSource = "";
    state.cardScores = new Map();
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
      variantStripTexts,
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
        variantStripTexts,
        allowDomFallback: true,
      };
    }
  }

  const stripResolved = resolveStartScoreFromVariantStrip(context.documentRef, variantStripTexts);
  if (isFiniteNumber(stripResolved)) {
    state.cachedStartScore = stripResolved;
    state.cachedStartScoreSource = "dom-variant-strip";
    return {
      startScore: stripResolved,
      source: state.cachedStartScoreSource,
      cacheHit: false,
      cacheReset,
      cacheKey,
      snapshotVariant,
      domVariant,
      variantStripTexts,
      allowDomFallback: true,
    };
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
      variantStripTexts,
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
      variantStripTexts,
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
    variantStripTexts,
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

function resolveCardIdentity(cardNode, scoreNode, cardIndex) {
  const candidateAttributes = [
    "data-player-id",
    "data-ad-ext-player-id",
    "data-user-id",
    "data-id",
    "id",
  ];

  for (const attributeName of candidateAttributes) {
    const cardValue = String(cardNode?.getAttribute?.(attributeName) || "").trim();
    if (cardValue) {
      return `card:${attributeName}:${cardValue}`;
    }
  }

  const nameNode =
    cardNode?.querySelector?.(".ad-ext-player-name") ||
    cardNode?.querySelector?.(".chakra-avatar + p") ||
    null;
  const nameText = String(nameNode?.textContent || "").replace(/\s+/g, " ").trim();
  if (nameText) {
    return `name:${nameText}`;
  }

  const scoreText = String(scoreNode?.textContent || "").replace(/\s+/g, " ").trim();
  return `slot:${cardIndex}:${scoreText || "-"}`;
}

function isPlayerCardActive(cardNode, scoreNode, documentRef, activePlayerIndex, cardIndex) {
  if (cardNode?.classList?.contains("ad-ext-player-active")) {
    return true;
  }

  if (scoreNode?.closest?.(".ad-ext-player-active")) {
    return true;
  }

  if (!documentRef || !scoreNode || typeof documentRef.querySelectorAll !== "function") {
    return false;
  }

  for (const selector of ACTIVE_SCORE_SELECTORS) {
    const matchedNode = Array.from(documentRef.querySelectorAll(selector)).find(
      (node) => node === scoreNode
    );
    if (matchedNode) {
      return true;
    }
  }

  if (Number.isFinite(activePlayerIndex) && Number(activePlayerIndex) === Number(cardIndex)) {
    return true;
  }

  return false;
}

function ensureProgressChildren(hostNode, documentRef) {
  let trackNode = hostNode.querySelector?.(`.${TRACK_CLASS}`) || null;
  let trailNode = hostNode.querySelector?.(`.${TRAIL_CLASS}`) || null;
  let fillNode = hostNode.querySelector?.(`.${FILL_CLASS}`) || null;

  if (trackNode && trailNode && fillNode) {
    return { trackNode, trailNode, fillNode };
  }

  hostNode.replaceChildren?.();

  trackNode = documentRef.createElement("div");
  trackNode.classList.add(TRACK_CLASS);
  trailNode = documentRef.createElement("div");
  trailNode.classList.add(TRAIL_CLASS);
  fillNode = documentRef.createElement("div");
  fillNode.classList.add(FILL_CLASS);
  trackNode.appendChild(trailNode);
  trackNode.appendChild(fillNode);
  hostNode.appendChild(trackNode);

  return { trackNode, trailNode, fillNode };
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

function getFillNode(hostNode) {
  return hostNode?.querySelector?.(`.${FILL_CLASS}`) || null;
}

function getTrailNode(hostNode) {
  return hostNode?.querySelector?.(`.${TRAIL_CLASS}`) || null;
}

function clearFillEffectClasses(fillNode) {
  if (!fillNode?.classList) {
    return;
  }
  EFFECT_FILL_CLASS_LIST.forEach((className) => {
    fillNode.classList.remove(className);
  });
}

function cancelEffectAnimation(fillNode) {
  const runningAnimation = fillNode?.[EFFECT_ANIMATION_SLOT];
  if (runningAnimation && typeof runningAnimation.cancel === "function") {
    try {
      runningAnimation.cancel();
    } catch (_) {
      // Ignore stale animation handles.
    }
  }
  if (fillNode && Object.prototype.hasOwnProperty.call(fillNode, EFFECT_ANIMATION_SLOT)) {
    fillNode[EFFECT_ANIMATION_SLOT] = null;
  }
}

function clearTrailState(trailNode) {
  if (!trailNode) {
    return;
  }

  const runningAnimation = trailNode[TRAIL_ANIMATION_SLOT];
  if (runningAnimation && typeof runningAnimation.cancel === "function") {
    try {
      runningAnimation.cancel();
    } catch (_) {
      // Ignore stale animation handles.
    }
  }

  if (Object.prototype.hasOwnProperty.call(trailNode, TRAIL_ANIMATION_SLOT)) {
    trailNode[TRAIL_ANIMATION_SLOT] = null;
  }

  trailNode.style?.setProperty?.(TRAIL_WIDTH_PROPERTY, "0%");
  trailNode.style?.setProperty?.("opacity", "0");
}

function createEffectAnimationDefinition(effect) {
  const normalizedEffect = normalizeEffect(effect);
  if (normalizedEffect === "off") {
    return null;
  }

  if (normalizedEffect === "pulse-core") {
    return {
      keyframes: [
        { transform: "scaleY(1)", filter: "brightness(1.06) saturate(1.02)" },
        { transform: "scaleY(1.24)", filter: "brightness(1.28) saturate(1.18)" },
        { transform: "scaleY(1)", filter: "brightness(1.02) saturate(1.02)" },
      ],
      options: { duration: 360, easing: "ease-out" },
    };
  }

  if (normalizedEffect === "glass-charge") {
    return {
      keyframes: [
        { filter: "brightness(1.04) saturate(1.04)", opacity: 0.94 },
        { filter: "brightness(1.26) saturate(1.16)", opacity: 1 },
        { filter: "brightness(1.02) saturate(1.02)", opacity: 0.96 },
      ],
      options: { duration: 420, easing: "ease-in-out" },
    };
  }

  if (normalizedEffect === "segment-drain") {
    return {
      keyframes: [
        { filter: "brightness(1.04) saturate(1.04)", transform: "scaleY(1)" },
        { filter: "brightness(1.18) saturate(1.2)", transform: "scaleY(1.08)" },
        { filter: "brightness(1.02) saturate(1.02)", transform: "scaleY(1)" },
      ],
      options: { duration: 340, easing: "steps(3, end)" },
    };
  }

  if (normalizedEffect === "signal-sweep") {
    return {
      keyframes: [
        { filter: "brightness(1.04) saturate(1.06)" },
        { filter: "brightness(1.3) saturate(1.22)" },
        { filter: "brightness(1.02) saturate(1.04)" },
      ],
      options: { duration: 300, easing: "ease-out" },
    };
  }

  if (normalizedEffect === "electric-surge") {
    return {
      keyframes: [
        {
          filter: "brightness(1.1) saturate(1.12) drop-shadow(0 0 5px rgba(120,240,255,.34))",
          transform: "translateX(0) scaleY(1)",
        },
        {
          filter: "brightness(1.72) saturate(1.5) drop-shadow(0 0 14px rgba(122,236,255,.78))",
          transform: "translateX(2.5px) scaleY(1.28)",
        },
        {
          filter: "brightness(1.26) saturate(1.24) drop-shadow(0 0 8px rgba(122,236,255,.52))",
          transform: "translateX(-1.3px) scaleY(1.08)",
        },
        {
          filter: "brightness(1.12) saturate(1.14) drop-shadow(0 0 6px rgba(122,236,255,.38))",
          transform: "translateX(0) scaleY(1)",
        },
      ],
      options: { duration: 420, easing: "ease-out" },
    };
  }

  return null;
}

function triggerGhostTrail(trailNode, shouldTrigger, previousRatio, currentRatio) {
  clearTrailState(trailNode);
  if (!trailNode || !shouldTrigger || typeof trailNode.animate !== "function") {
    return;
  }

  const fromWidth = formatProgressWidth(isFiniteNumber(previousRatio) ? previousRatio : currentRatio);
  const toWidth = formatProgressWidth(currentRatio);
  trailNode.style?.setProperty?.(TRAIL_WIDTH_PROPERTY, fromWidth);
  trailNode.style?.setProperty?.("opacity", "0.76");

  const animation = trailNode.animate(
    [
      { width: fromWidth, opacity: 0.76, filter: "blur(8px) brightness(1.28)" },
      { width: toWidth, opacity: 0, filter: "blur(2px) brightness(1.02)" },
    ],
    {
      duration: 620,
      easing: "cubic-bezier(0.22, 1, 0.36, 1)",
      fill: "none",
      iterations: 1,
    }
  );

  trailNode[TRAIL_ANIMATION_SLOT] = animation;
  const finish = () => clearTrailState(trailNode);
  animation.onfinish = finish;
  animation.oncancel = finish;
}

function triggerScoreChangeEffect(fillNode, trailNode, effect, shouldTrigger, previousRatio, currentRatio) {
  if (!fillNode) {
    return;
  }

  const normalizedEffect = normalizeEffect(effect);
  fillNode.setAttribute(EFFECT_ATTRIBUTE, normalizedEffect);
  clearFillEffectClasses(fillNode);
  fillNode.classList.add(getEffectFillClass(normalizedEffect));
  clearTrailState(trailNode);

  cancelEffectAnimation(fillNode);
  if (!shouldTrigger || normalizedEffect === "off") {
    return;
  }

  if (normalizedEffect === "ghost-trail") {
    triggerGhostTrail(trailNode, shouldTrigger, previousRatio, currentRatio);
    const token = Number(fillNode.getAttribute(EFFECT_CHANGE_TOKEN_ATTRIBUTE) || 0) + 1;
    fillNode.setAttribute(EFFECT_CHANGE_TOKEN_ATTRIBUTE, String(token));
    return;
  }

  if (typeof fillNode.animate !== "function") {
    return;
  }

  const definition = createEffectAnimationDefinition(normalizedEffect);
  if (!definition) {
    return;
  }

  const animation = fillNode.animate(definition.keyframes, {
    fill: "none",
    iterations: 1,
    ...definition.options,
  });
  fillNode[EFFECT_ANIMATION_SLOT] = animation;
  const token = Number(fillNode.getAttribute(EFFECT_CHANGE_TOKEN_ATTRIBUTE) || 0) + 1;
  fillNode.setAttribute(EFFECT_CHANGE_TOKEN_ATTRIBUTE, String(token));
}

export function updateProgressHost(hostNode, options = {}) {
  if (!hostNode || !hostNode.classList || !hostNode.style) {
    return;
  }

  const ratio = clamp(Number(options.ratio) || 0, 0, 1);
  const active = options.active === true;
  const sizeClass = getSizeClass(options.barSize);
  const colorTheme = normalizeColorTheme(options.colorTheme);
  const effect = normalizeEffect(options.effect);
  const fillNode = getFillNode(hostNode);
  const trailNode = getTrailNode(hostNode);

  hostNode.classList.remove(
    `${ACTIVE_CLASS}`,
    `${INACTIVE_CLASS}`,
    ...SIZE_CLASS_LIST
  );
  hostNode.classList.add(active ? ACTIVE_CLASS : INACTIVE_CLASS);
  if (active) {
    hostNode.classList.add(sizeClass);
  }
  hostNode.setAttribute("data-ad-ext-x01-score-progress-state", active ? "active" : "inactive");
  hostNode.setAttribute(COLOR_THEME_ATTRIBUTE, colorTheme);
  hostNode.setAttribute(SIZE_ATTRIBUTE, normalizeBarSize(options.barSize));
  hostNode.setAttribute(EFFECT_ATTRIBUTE, effect);
  hostNode.style.setProperty(WIDTH_PROPERTY, formatProgressWidth(ratio));

  if (active) {
    applyActiveVisualVars(
      hostNode,
      resolveActiveVisualVars({
        ratio,
        score: options.score,
        colorTheme,
      })
    );
    triggerScoreChangeEffect(
      fillNode,
      trailNode,
      effect,
      options.scoreChanged === true,
      options.previousRatio,
      ratio
    );
    return;
  }

  clearActiveVisualVars(hostNode);
  clearFillEffectClasses(fillNode);
  cancelEffectAnimation(fillNode);
  clearTrailState(trailNode);
  fillNode?.removeAttribute?.(EFFECT_CHANGE_TOKEN_ATTRIBUTE);
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
  const normalizedColorTheme = normalizeColorTheme(context.featureConfig?.colorTheme);
  const normalizedBarSize = normalizeBarSize(context.featureConfig?.barSize);
  const normalizedEffect = normalizeEffect(context.featureConfig?.effect);
  if (!state.hostScores || typeof state.hostScores.set !== "function") {
    state.hostScores = new WeakMap();
  }
  if (!state.cardScores || typeof state.cardScores.get !== "function") {
    state.cardScores = new Map();
  }

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
    visuals: {
      colorTheme: normalizedColorTheme,
      barSize: normalizedBarSize,
      effect: normalizedEffect,
      activePlayerIndex: null,
    },
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
    variantStripTexts: Array.isArray(startScoreDebug.variantStripTexts)
      ? startScoreDebug.variantStripTexts
      : [],
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
  const activePlayerIndex = Number.isFinite(context.gameState?.getActivePlayerIndex?.())
    ? Number(context.gameState.getActivePlayerIndex())
    : Number.NaN;
  debugPayload.visuals.activePlayerIndex = Number.isFinite(activePlayerIndex)
    ? activePlayerIndex
    : null;

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
    const cardIdentity = resolveCardIdentity(cardNode, scoreNode, cardIndex);
    const previousHostScore = state.hostScores.get(hostNode);
    const previousCardScore = state.cardScores.get(cardIdentity);
    const previousScore =
      isFiniteNumber(previousCardScore) && previousCardScore >= 0
        ? previousCardScore
        : previousHostScore;
    const scoreChanged =
      isFiniteNumber(previousScore) && previousScore !== scoreValue && scoreValue >= 0;
    state.hostScores.set(hostNode, scoreValue);
    state.cardScores.set(cardIdentity, scoreValue);
    const isActive = isPlayerCardActive(
      cardNode,
      scoreNode,
      documentRef,
      activePlayerIndex,
      cardIndex
    );
    updateProgressHost(hostNode, {
      ratio,
      previousRatio: isFiniteNumber(previousScore) ? previousScore / startScore : null,
      score: scoreValue,
      scoreChanged,
      active: isActive,
      colorTheme: normalizedColorTheme,
      barSize: normalizedBarSize,
      effect: normalizedEffect,
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
        cardIdentity,
        cardActiveDetected: isActive,
        host: summarizeNode(hostNode),
        hostState: String(hostNode.getAttribute?.("data-ad-ext-x01-score-progress-state") || ""),
        hostColorTheme: String(hostNode.getAttribute?.(COLOR_THEME_ATTRIBUTE) || ""),
        hostSize: String(hostNode.getAttribute?.(SIZE_ATTRIBUTE) || ""),
        hostEffect: String(hostNode.getAttribute?.(EFFECT_ATTRIBUTE) || ""),
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
