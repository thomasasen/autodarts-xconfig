import {
  HIT_ANIMATION_CLASS,
  HIT_ANIMATION_TRIGGER_CLASS,
  HIT_BASE_CLASS,
  HIT_IDLE_LOOP_CLASS,
  HIT_KIND_CLASS,
  HIT_SCORE_CLASS,
  HIT_SEGMENT_CLASS,
  HIT_THEME_CLASS,
} from "./style.js";
import {
  collectTurnThrowRows,
  getTurnSurfaceSnapshot,
} from "../shared/turn-surface-adapter.js";

const ROW_DEBUG_TEXT_LIMIT = 72;
const SUPPORTED_COLOR_THEME = new Set(Object.keys(HIT_THEME_CLASS));
const SUPPORTED_ANIMATION_STYLE = new Set(Object.keys(HIT_ANIMATION_CLASS));
const LOOPABLE_ANIMATION_STYLES = new Set([
  "neon-pulse",
  "outline-trace",
  "charge-release",
  "alternate-flick",
]);
const KIND_CLASS_NAMES = Object.values(HIT_KIND_CLASS);
const THEME_CLASS_NAMES = Object.values(HIT_THEME_CLASS);
const ANIMATION_CLASS_NAMES = Object.values(HIT_ANIMATION_CLASS);
const RESET_STYLE_PROPERTIES = [
  "transform",
  "opacity",
  "filter",
  "box-shadow",
  "text-shadow",
  "letter-spacing",
];
const BURST_TRIGGER_DURATION_MS = 860;
const BURST_TRIGGER_DURATION_REDUCED_MS = 420;

const INNER_BULL_PATTERN = /(BULLSEYE|BULL|DB|D\s*25|D25)/i;
const OUTER_BULL_PATTERN = /(S\s*25|S25|SB|OB)/i;
const SINGLE_25_PATTERN = /\b25\b/;
const TRIPLE_PATTERN = /T\s*(\d{1,2})/gi;
const DOUBLE_PATTERN = /D\s*(\d{1,2})/gi;
const CORRECTION_CLASS_NAME = "correction-bg";
const MANUAL_CORRECTION_ACTION_LABELS = new Set(["CANCEL", "OK"]);

function collectBySelector(rootNode, selector) {
  if (!rootNode || typeof rootNode.querySelectorAll !== "function") {
    return [];
  }

  try {
    return Array.from(rootNode.querySelectorAll(selector));
  } catch (_) {
    return [];
  }
}

function isElementDisabled(node) {
  if (!node || typeof node !== "object") {
    return false;
  }

  if (node.disabled === true) {
    return true;
  }

  if (typeof node.getAttribute === "function") {
    const disabledAttribute = node.getAttribute("disabled");
    if (disabledAttribute !== null && disabledAttribute !== undefined) {
      return true;
    }
  }

  return false;
}

function normalizeRawText(value) {
  return String(value || "")
    .replaceAll("\u00a0", " ")
    .replaceAll(/\s+/g, " ")
    .trim();
}

function escapeRegExp(value) {
  return String(value || "").replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
}

function truncateDebugText(value) {
  const text = normalizeRawText(value);
  if (text.length <= ROW_DEBUG_TEXT_LIMIT) {
    return text;
  }
  return `${text.slice(0, ROW_DEBUG_TEXT_LIMIT - 3)}...`;
}

function getChildElements(node) {
  if (!node || typeof node !== "object" || !node.children) {
    return [];
  }

  try {
    return Array.from(node.children);
  } catch (_) {
    return [];
  }
}

function hasClassName(node, className) {
  return Boolean(node?.classList?.contains?.(className));
}

function collectDescendantText(rootNode) {
  const rootChildren = getChildElements(rootNode);
  if (!rootChildren.length) {
    return "";
  }

  const chunks = [];
  const queue = [...rootChildren];

  while (queue.length) {
    const node = queue.shift();
    if (!node) {
      continue;
    }

    const text = normalizeRawText(node.textContent || "");
    if (text) {
      chunks.push(text);
    }

    const childNodes = getChildElements(node);
    if (childNodes.length) {
      queue.push(...childNodes);
    }
  }

  return normalizeRawText(chunks.join(" "));
}

function findNumberedHit(pattern, text) {
  pattern.lastIndex = 0;
  let match = pattern.exec(text);
  while (match) {
    const numericValue = Number(match[1]);
    if (numericValue >= 1 && numericValue <= 20) {
      return numericValue;
    }
    match = pattern.exec(text);
  }

  return null;
}

function collectElementDescendants(rootNode) {
  const rootChildren = getChildElements(rootNode);
  if (!rootChildren.length) {
    return [];
  }

  const nodes = [];
  const queue = [...rootChildren];
  while (queue.length) {
    const node = queue.shift();
    if (!node) {
      continue;
    }
    nodes.push(node);
    const childNodes = getChildElements(node);
    if (childNodes.length) {
      queue.push(...childNodes);
    }
  }
  return nodes;
}

function collectRowCorrectionNodes(rowNode) {
  if (!rowNode || typeof rowNode !== "object") {
    return [];
  }

  return [rowNode, ...collectElementDescendants(rowNode)].filter((node) =>
    hasClassName(node, CORRECTION_CLASS_NAME)
  );
}

function rowHasCorrectionMarker(rowNode) {
  return collectRowCorrectionNodes(rowNode).length > 0;
}

function clearRowCorrectionMarkers(rowNode) {
  const correctionNodes = collectRowCorrectionNodes(rowNode);
  correctionNodes.forEach((node) => {
    node.classList?.remove?.(CORRECTION_CLASS_NAME);
  });
  return correctionNodes.length;
}

function collectManualCorrectionButtons(documentRef, turnContainer = null) {
  const correctionScope = turnContainer || documentRef;
  return collectBySelector(correctionScope, "button,[role='button']");
}

function isManualCorrectionActive(documentRef, turnContainer = null) {
  const actionButtons = collectManualCorrectionButtons(documentRef, turnContainer);
  return actionButtons.some((buttonNode) => {
    if (!buttonNode || isElementDisabled(buttonNode)) {
      return false;
    }
    const buttonText = normalizeRawText(buttonNode.textContent || "").toUpperCase();
    return MANUAL_CORRECTION_ACTION_LABELS.has(buttonText);
  });
}

function getRowLifecycleKey(rowNode) {
  const rowText = normalizeRawText(rowNode?.textContent || collectDescendantText(rowNode));
  const hasCorrection = rowHasCorrectionMarker(rowNode) ? 1 : 0;
  return `${rowText}|correction:${hasCorrection}`;
}

function reconcileRowSlotState(rowNode, options = {}) {
  const slotStateByIndex = options.slotStateByIndex || null;
  const rowIndex = Number(options.rowIndex);
  if (!slotStateByIndex || typeof slotStateByIndex.get !== "function" || !Number.isFinite(rowIndex)) {
    return {
      replaced: false,
      rewritten: false,
    };
  }

  const previousState = slotStateByIndex.get(rowIndex) || null;
  const currentLifecycleKey = getRowLifecycleKey(rowNode);
  const replaced = Boolean(previousState?.rowNode) && previousState.rowNode !== rowNode;
  const rewritten =
    Boolean(previousState?.rowNode) &&
    previousState.rowNode === rowNode &&
    previousState.lifecycleKey !== currentLifecycleKey;

  if (replaced && previousState?.rowNode) {
    clearHitDecoration(previousState.rowNode, options.signatureByRow || null, options);
  }

  if (rewritten) {
    clearHitDecoration(rowNode, options.signatureByRow || null, options);
  }

  if (typeof slotStateByIndex.set === "function") {
    slotStateByIndex.set(rowIndex, {
      rowNode,
      lifecycleKey: currentLifecycleKey,
    });
  }

  return {
    replaced,
    rewritten,
  };
}

function getNodeDepth(node, rootNode) {
  let depth = 0;
  let current = node;
  while (current && current !== rootNode) {
    current = current.parentNode || null;
    depth += 1;
  }
  return depth;
}

function normalizeSegmentLabel(value) {
  const normalized = normalizeRawText(value).toUpperCase();
  if (!normalized) {
    return "";
  }
  if (INNER_BULL_PATTERN.test(normalized)) {
    return "BULL";
  }
  if (OUTER_BULL_PATTERN.test(normalized) || SINGLE_25_PATTERN.test(normalized)) {
    return "S25";
  }
  return normalized;
}

function findBestRoleNode(rowNode, matcher) {
  const candidates = [rowNode, ...collectElementDescendants(rowNode)];
  let bestNode = null;
  let bestRank = -Infinity;

  candidates.forEach((candidate) => {
    if (!candidate?.classList) {
      return;
    }
    const candidateText = normalizeRawText(candidate.textContent || "");
    if (!candidateText || !matcher(candidateText, candidate)) {
      return;
    }

    const depth = getNodeDepth(candidate, rowNode);
    const childCount = getChildElements(candidate).length;
    const rank = depth * 100 - childCount * 10 - candidateText.length;
    if (rank > bestRank) {
      bestRank = rank;
      bestNode = candidate;
    }
  });

  return bestNode;
}

function deriveHitScore(hitMeta) {
  if (!hitMeta || typeof hitMeta !== "object") {
    return "";
  }

  if (hitMeta.kind === "bullInner") {
    return "50";
  }
  if (hitMeta.kind === "bullOuter") {
    return "25";
  }

  const segment = String(hitMeta.segment || "").toUpperCase();
  const match = segment.match(/^[TD](\d{1,2})$/);
  if (!match) {
    return "";
  }

  const value = Number(match[1]);
  if (!Number.isFinite(value)) {
    return "";
  }

  if (hitMeta.kind === "triple") {
    return String(value * 3);
  }
  if (hitMeta.kind === "double") {
    return String(value * 2);
  }

  return "";
}

function clearInlineAnimationStyles(node) {
  if (!node?.style) {
    return;
  }

  RESET_STYLE_PROPERTIES.forEach((propertyName) => {
    if (typeof node.style.removeProperty === "function") {
      node.style.removeProperty(propertyName);
    }
    const camelName = propertyName.replaceAll(/-([a-z])/g, (_match, letter) => letter.toUpperCase());
    try {
      node.style[camelName] = "";
    } catch (_) {
      // fail-soft
    }
  });
}

function clearTextRoles(rowNode, roleStateByRow = null) {
  if (!rowNode || !roleStateByRow || typeof roleStateByRow.get !== "function") {
    return;
  }

  const roleState = roleStateByRow.get(rowNode);
  if (!roleState) {
    return;
  }

  [roleState.scoreNode, roleState.segmentNode].forEach((node) => {
    if (!node?.classList) {
      return;
    }
    node.classList.remove(HIT_SCORE_CLASS, HIT_SEGMENT_CLASS);
    clearInlineAnimationStyles(node);
  });

  roleStateByRow.delete(rowNode);
}

function annotateHitTextRoles(rowNode, hitMeta, roleStateByRow = null) {
  if (!rowNode?.classList) {
    return {
      scoreNode: null,
      segmentNode: null,
    };
  }

  clearTextRoles(rowNode, roleStateByRow);

  const expectedScore = deriveHitScore(hitMeta);
  const expectedSegment = normalizeSegmentLabel(hitMeta?.segment || hitMeta?.label || "");
  const scorePattern = expectedScore
    ? new RegExp(String.raw`(?:^|\D)${escapeRegExp(expectedScore)}(?:\D|$)`, "i")
    : null;
  const segmentPattern = expectedSegment ? new RegExp(escapeRegExp(expectedSegment), "i") : null;

  const scoreNode = expectedScore
    ? findBestRoleNode(rowNode, (text) => {
        const normalized = normalizeRawText(text);
        if (!normalized || !scorePattern) {
          return false;
        }
        return scorePattern.test(normalized);
      })
    : null;
  const segmentNode = expectedSegment
    ? findBestRoleNode(rowNode, (text, candidate) => {
        if (scoreNode && candidate === scoreNode) {
          return false;
        }
        const normalized = normalizeRawText(text);
        if (!normalized) {
          return false;
        }
        if (normalizeSegmentLabel(normalized) === expectedSegment) {
          return true;
        }
        return Boolean(segmentPattern?.test(normalized));
      }) ||
      findBestRoleNode(rowNode, (text) => {
        const normalized = normalizeRawText(text);
        if (!normalized) {
          return false;
        }
        if (normalizeSegmentLabel(normalized) === expectedSegment) {
          return true;
        }
        return Boolean(segmentPattern?.test(normalized));
      })
    : null;

  if (scoreNode?.classList) {
    scoreNode.classList.add(HIT_SCORE_CLASS);
  }
  if (segmentNode?.classList) {
    segmentNode.classList.add(HIT_SEGMENT_CLASS);
  }

  if (roleStateByRow && typeof roleStateByRow.set === "function") {
    roleStateByRow.set(rowNode, {
      scoreNode: scoreNode || null,
      segmentNode: segmentNode || null,
    });
  }

  return {
    scoreNode: scoreNode || null,
    segmentNode: segmentNode || null,
  };
}

function prefersReducedMotion(windowRef = null) {
  if (!windowRef || typeof windowRef.matchMedia !== "function") {
    return false;
  }

  try {
    return Boolean(windowRef.matchMedia("(prefers-reduced-motion: reduce)")?.matches);
  } catch (_) {
    return false;
  }
}

function isLoopAnimationStyle(value) {
  return LOOPABLE_ANIMATION_STYLES.has(String(value || "").trim().toLowerCase());
}

function resolveColorTheme(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return SUPPORTED_COLOR_THEME.has(normalized) ? normalized : "kind-signal";
}

function resolveAnimationStyle(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return SUPPORTED_ANIMATION_STYLE.has(normalized) ? normalized : "charge-release";
}

export function classifyThrowText(rawText) {
  const normalizedText = normalizeRawText(rawText).toUpperCase();
  if (!normalizedText) {
    return null;
  }

  if (INNER_BULL_PATTERN.test(normalizedText)) {
    return {
      kind: "bullInner",
      segment: "BULL",
      label: "BULL",
    };
  }

  if (OUTER_BULL_PATTERN.test(normalizedText) || SINGLE_25_PATTERN.test(normalizedText)) {
    return {
      kind: "bullOuter",
      segment: "S25",
      label: "25",
    };
  }

  const tripleValue = findNumberedHit(TRIPLE_PATTERN, normalizedText);
  if (Number.isFinite(tripleValue)) {
    return {
      kind: "triple",
      segment: `T${tripleValue}`,
      label: `T${tripleValue}`,
    };
  }

  const doubleValue = findNumberedHit(DOUBLE_PATTERN, normalizedText);
  if (Number.isFinite(doubleValue)) {
    return {
      kind: "double",
      segment: `D${doubleValue}`,
      label: `D${doubleValue}`,
    };
  }

  return null;
}

export function collectThrowRows(documentRef) {
  return collectTurnThrowRows(documentRef).filter((rowNode) => {
    return Boolean(rowNode?.classList);
  });
}

export function getHitMetaFromRow(rowNode) {
  if (!rowNode) {
    return null;
  }

  const directText = normalizeRawText(rowNode.textContent || "");
  const rowText = directText || collectDescendantText(rowNode);
  if (!rowText) {
    return null;
  }

  return classifyThrowText(rowText);
}

function isRowDecorated(rowNode, signatureByRow = null) {
  if (!rowNode?.classList) {
    return false;
  }

  const hasBaseClass = rowNode.classList.contains(HIT_BASE_CLASS);
  const hasSignatureAttribute = Boolean(rowNode.dataset?.adExtHitSignature);
  const hasTrackedSignature = signatureByRow?.has?.(rowNode);

  return hasBaseClass || hasSignatureAttribute || hasTrackedSignature;
}

function setExclusiveClass(rowNode, classNames, activeClassName) {
  if (!rowNode?.classList || !Array.isArray(classNames)) {
    return;
  }

  classNames.forEach((className) => {
    if (!className || className === activeClassName) {
      return;
    }
    if (rowNode.classList.contains(className)) {
      rowNode.classList.remove(className);
    }
  });

  if (activeClassName && !rowNode.classList.contains(activeClassName)) {
    rowNode.classList.add(activeClassName);
  }
}

function collectAnimationTargets(rowNode, roleStateByRow = null) {
  const roleState = roleStateByRow?.get?.(rowNode) || null;
  return [rowNode, roleState?.scoreNode || null, roleState?.segmentNode || null].filter(Boolean);
}

function clearBurstTriggerResetTimer(rowNode, triggerResetTimersByRow = null, windowRef = null) {
  if (!rowNode || !triggerResetTimersByRow || typeof triggerResetTimersByRow.get !== "function") {
    return;
  }

  const timerHandle = triggerResetTimersByRow.get(rowNode);
  if (!timerHandle) {
    triggerResetTimersByRow.delete(rowNode);
    return;
  }

  const clearTimer =
    typeof windowRef?.clearTimeout === "function"
      ? windowRef.clearTimeout.bind(windowRef)
      : clearTimeout;
  try {
    clearTimer(timerHandle);
  } catch (_) {
    // fail-soft
  }
  triggerResetTimersByRow.delete(rowNode);
}

function scheduleBurstTriggerReset(rowNode, options = {}) {
  if (!rowNode?.classList) {
    return;
  }

  const triggerResetTimersByRow = options.triggerResetTimersByRow || null;
  const windowRef = options.windowRef || null;
  if (!triggerResetTimersByRow || typeof triggerResetTimersByRow.set !== "function") {
    return;
  }
  if (!windowRef || typeof windowRef.setTimeout !== "function") {
    return;
  }

  clearBurstTriggerResetTimer(rowNode, triggerResetTimersByRow, windowRef);
  const setTimer = windowRef.setTimeout.bind(windowRef);
  const duration = options.reducedMotion ? BURST_TRIGGER_DURATION_REDUCED_MS : BURST_TRIGGER_DURATION_MS;
  const timerHandle = setTimer(() => {
    rowNode.classList?.remove?.(HIT_ANIMATION_TRIGGER_CLASS);
    triggerResetTimersByRow.delete(rowNode);
  }, duration);
  triggerResetTimersByRow.set(rowNode, timerHandle);
}

function stopRowAnimation(rowNode, options = {}) {
  const activeAnimeByRow = options.activeAnimeByRow || null;
  const roleStateByRow = options.roleStateByRow || null;
  const animeRef = options.animeRef || null;
  const targets = collectAnimationTargets(rowNode, roleStateByRow);
  const activeInstance = activeAnimeByRow?.get?.(rowNode) || null;

  if (activeInstance && typeof activeInstance.pause === "function") {
    try {
      activeInstance.pause();
    } catch (_) {
      // fail-soft
    }
  }

  if (animeRef && typeof animeRef.remove === "function" && targets.length) {
    try {
      animeRef.remove(targets);
    } catch (_) {
      // fail-soft
    }
  }

  targets.forEach((node) => clearInlineAnimationStyles(node));

  if (typeof activeAnimeByRow?.delete === "function") {
    activeAnimeByRow.delete(rowNode);
  }
}

export function clearHitDecoration(rowNode, signatureByRow = null, options = {}) {
  if (!rowNode?.classList) {
    return false;
  }
  const hadDecoration = isRowDecorated(rowNode, signatureByRow);

  clearBurstTriggerResetTimer(
    rowNode,
    options.triggerResetTimersByRow || null,
    options.windowRef || null
  );

  stopRowAnimation(rowNode, options);
  clearTextRoles(rowNode, options.roleStateByRow || null);

  rowNode.classList.remove(
    HIT_BASE_CLASS,
    HIT_ANIMATION_TRIGGER_CLASS,
    HIT_IDLE_LOOP_CLASS,
    ...KIND_CLASS_NAMES,
    ...THEME_CLASS_NAMES,
    ...ANIMATION_CLASS_NAMES
  );
  rowNode.style.removeProperty("--ad-ext-hit-delay-ms");
  delete rowNode.dataset.adExtHitSignature;
  delete rowNode.dataset.adExtHitKind;
  delete rowNode.dataset.adExtHitSegment;
  delete rowNode.dataset.adExtHitTheme;
  delete rowNode.dataset.adExtHitAnimation;
  delete rowNode.dataset.adExtHitBurstKey;

  if (typeof signatureByRow?.delete === "function") {
    signatureByRow.delete(rowNode);
  }

  return hadDecoration;
}

function triggerAnimationReplay(rowNode) {
  rowNode.classList.remove(HIT_ANIMATION_TRIGGER_CLASS);

  if (typeof rowNode.getBoundingClientRect === "function") {
    rowNode.getBoundingClientRect();
  }

  rowNode.classList.add(HIT_ANIMATION_TRIGGER_CLASS);
}

function createFallbackTimeline(animeRef) {
  return {
    _instances: [],
    _steps: [],
    add(step, _offset = 0) {
      this._steps.push(step);
      return this;
    },
    play() {
      if (typeof animeRef !== "function") {
        return this;
      }
      this._instances = this._steps
        .map((step) => {
          try {
            return animeRef(step);
          } catch (_) {
            return null;
          }
        })
        .filter(Boolean);
      return this;
    },
    pause() {
      this._instances.forEach((instance) => {
        try {
          instance?.pause?.();
        } catch (_) {
          // fail-soft
        }
      });
    },
  };
}

function createTimeline(animeRef) {
  if (animeRef && typeof animeRef.timeline === "function") {
    try {
      return animeRef.timeline({ autoplay: false });
    } catch (_) {
      return createFallbackTimeline(animeRef);
    }
  }
  return createFallbackTimeline(animeRef);
}

function addTimelineStep(timeline, step, offset = 0) {
  if (!timeline || typeof timeline.add !== "function" || !step?.targets) {
    return;
  }

  try {
    timeline.add(step, offset);
  } catch (_) {
    // fail-soft
  }
}

function appendBurstTimelineSteps(timeline, steps) {
  (Array.isArray(steps) ? steps : []).forEach(({ step, offset = 0 }) => {
    addTimelineStep(timeline, step, offset);
  });
}

function getBurstTimelineTargets(context = {}) {
  const rowNode = context.rowNode || null;
  return {
    rowNode,
    scoreTarget: context.scoreNode || rowNode,
    segmentTarget: context.segmentNode || rowNode,
  };
}

function getBurstTimelineSteps(context = {}) {
  const { rowNode, scoreTarget, segmentTarget } = getBurstTimelineTargets(context);
  const reducedMotion = Boolean(context.reducedMotion);
  const baseDuration = reducedMotion ? 180 : 520;
  const spinY = reducedMotion ? 18 : 360;
  const spinX = reducedMotion ? -22 : -360;
  const heavyWobble = reducedMotion ? 3 : 11;
  const builders = {
    "impact-pop": () => [
      {
        offset: 0,
        step: {
          targets: rowNode,
          duration: reducedMotion ? baseDuration : 620,
          easing: "easeOutBack(1.7)",
          keyframes: [
            { scale: 0.96, translateY: 3, rotateZ: -0.5 },
            { scale: 1.135, translateY: -10, rotateZ: 1.1 },
            { scale: 1.02, translateY: 2, rotateZ: -0.3 },
            { scale: 1, translateY: 0, rotateZ: 0 },
          ],
        },
      },
      {
        offset: 0,
        step: {
          targets: scoreTarget,
          duration: reducedMotion ? baseDuration - 40 : 540,
          easing: "easeOutBack(2.1)",
          keyframes: [
            { scale: 1.26, translateY: -10, letterSpacing: "0.06em" },
            { scale: 0.98, translateY: 2, letterSpacing: "0.02em" },
            { scale: 1, translateY: 0, letterSpacing: "0em" },
          ],
        },
      },
      {
        offset: 70,
        step: {
          targets: segmentTarget,
          duration: reducedMotion ? 200 : 360,
          easing: "easeOutQuad",
          keyframes: [
            { translateY: -7, opacity: 1, letterSpacing: "0.18em" },
            { translateY: 0, opacity: 1, letterSpacing: "0.1em" },
          ],
        },
      },
    ],
    shockwave: () => [
      {
        offset: 0,
        step: {
          targets: rowNode,
          duration: reducedMotion ? 260 : 720,
          easing: "easeOutExpo",
          keyframes: [
            { scale: 0.95, translateZ: 0 },
            { scale: 1.11, translateY: -4 },
            { scale: 1.02, translateY: 2 },
            { scale: 1, translateY: 0 },
          ],
        },
      },
      {
        offset: 0,
        step: {
          targets: scoreTarget,
          duration: reducedMotion ? 240 : 500,
          easing: "easeOutExpo",
          keyframes: [
            { scale: 1.24, letterSpacing: "0.12em", translateY: -6 },
            { scale: 1, letterSpacing: "0em", translateY: 0 },
          ],
        },
      },
      {
        offset: 90,
        step: {
          targets: segmentTarget,
          duration: reducedMotion ? 220 : 420,
          easing: "easeOutQuad",
          keyframes: [
            { scale: 1.14, opacity: 1, translateY: 3 },
            { scale: 1, opacity: 1, translateY: 0 },
          ],
        },
      },
    ],
    "sweep-shine": () => [
      {
        offset: 0,
        step: {
          targets: rowNode,
          duration: reducedMotion ? 240 : 660,
          easing: "easeOutCubic",
          keyframes: [
            { translateX: -18, skewX: "-4deg", scale: 1.02 },
            { translateX: 14, skewX: "2deg", scale: 1.06 },
            { translateX: 0, skewX: "0deg", scale: 1 },
          ],
        },
      },
      {
        offset: 60,
        step: {
          targets: scoreTarget,
          duration: reducedMotion ? 220 : 430,
          easing: "easeOutQuad",
          keyframes: [
            { translateX: 18, scale: 1.18, letterSpacing: "0.08em" },
            { translateX: 0, scale: 1, letterSpacing: "0em" },
          ],
        },
      },
      {
        offset: 110,
        step: {
          targets: segmentTarget,
          duration: reducedMotion ? 180 : 320,
          easing: "easeOutQuad",
          keyframes: [
            { translateX: 24, opacity: 1, letterSpacing: "0.16em" },
            { translateX: 0, opacity: 1, letterSpacing: "0.1em" },
          ],
        },
      },
    ],
    "electric-arc": () => [
      {
        offset: 0,
        step: {
          targets: rowNode,
          duration: reducedMotion ? 300 : 760,
          easing: "easeOutExpo",
          keyframes: [
            {
              scale: 0.992,
              translateX: 0,
              translateY: 0,
              filter: "saturate(1.04) brightness(0.98)",
            },
            {
              scale: 1.012,
              translateX: reducedMotion ? -1 : -1.2,
              translateY: 0.6,
              filter: "saturate(1.2) brightness(1.16)",
            },
            {
              scale: 1.006,
              translateX: reducedMotion ? 1 : 1.1,
              translateY: -0.7,
              filter: "saturate(1.12) brightness(1.08)",
            },
            {
              scale: 1,
              translateX: 0,
              translateY: 0,
              filter: "saturate(1.16) brightness(1.04)",
            },
          ],
        },
      },
      {
        offset: 0,
        step: {
          targets: scoreTarget,
          duration: reducedMotion ? 260 : 620,
          easing: "linear",
          keyframes: [
            {
              scale: 1.16,
              translateX: reducedMotion ? 1 : 2.2,
              letterSpacing: "0.07em",
              filter: "brightness(1.38) drop-shadow(0 0 11px rgba(180,250,255,.68))",
            },
            {
              scale: 1.06,
              translateX: reducedMotion ? -1 : -1.9,
              letterSpacing: "0.05em",
              filter: "brightness(1.24) drop-shadow(0 0 7px rgba(180,250,255,.48))",
            },
            {
              scale: 1.03,
              translateX: reducedMotion ? 1 : 1.2,
              letterSpacing: "0.04em",
              filter: "brightness(1.16)",
            },
            { scale: 1, translateX: 0, letterSpacing: "0.01em", filter: "brightness(1.03)" },
          ],
        },
      },
      {
        offset: 95,
        step: {
          targets: segmentTarget,
          duration: reducedMotion ? 220 : 440,
          easing: "linear",
          keyframes: [
            {
              translateX: reducedMotion ? -1 : -1.4,
              letterSpacing: "0.13em",
              opacity: 1,
              filter: "brightness(1.22)",
            },
            {
              translateX: 1,
              letterSpacing: "0.08em",
              opacity: 1,
              filter: "brightness(1.16)",
            },
            { translateX: 0, letterSpacing: "0.1em", opacity: 1 },
          ],
        },
      },
    ],
    "neon-pulse": () => [
      {
        offset: 0,
        step: {
          targets: rowNode,
          duration: reducedMotion ? 260 : 720,
          easing: "easeOutExpo",
          keyframes: [
            { scale: 0.97, translateY: 4 },
            { scale: 1.08, translateY: -6 },
            { scale: 1.03, translateY: 0 },
            { scale: 1, translateY: 0 },
          ],
        },
      },
      {
        offset: 0,
        step: {
          targets: scoreTarget,
          duration: reducedMotion ? 240 : 560,
          easing: "easeOutExpo",
          keyframes: [
            { scale: 1.28, opacity: 1, letterSpacing: "0.08em" },
            { scale: 1, opacity: 1, letterSpacing: "0em" },
          ],
        },
      },
      {
        offset: 80,
        step: {
          targets: segmentTarget,
          duration: reducedMotion ? 220 : 500,
          easing: "easeOutSine",
          keyframes: [
            { scale: 1.12, opacity: 1, translateY: -2 },
            { scale: 1, opacity: 1, translateY: 0 },
          ],
        },
      },
    ],
    "snap-bounce": () => [
      {
        offset: 0,
        step: {
          targets: rowNode,
          duration: reducedMotion ? 220 : 620,
          easing: "easeOutElastic(1, .55)",
          keyframes: [
            { translateY: -14, scale: 1.1, rotateZ: -1.2 },
            { translateY: 5, scale: 0.97, rotateZ: 0.7 },
            { translateY: 0, scale: 1 },
          ],
        },
      },
      {
        offset: 0,
        step: {
          targets: scoreTarget,
          duration: reducedMotion ? 220 : 420,
          easing: "easeOutBack(2.2)",
          keyframes: [
            { translateY: -9, scale: 1.2, rotateZ: -1 },
            { translateY: 0, scale: 1, rotateZ: 0 },
          ],
        },
      },
    ],
    "card-slam": () => [
      {
        offset: 0,
        step: {
          targets: rowNode,
          duration: reducedMotion ? 260 : 760,
          easing: "easeOutExpo",
          keyframes: [
            { rotateX: spinX, translateY: -18, scale: 1.08 },
            { rotateX: reducedMotion ? -8 : -138, translateY: 8, scale: 0.96 },
            { rotateX: 0, translateY: 0, scale: 1 },
          ],
        },
      },
      {
        offset: 25,
        step: {
          targets: scoreTarget,
          duration: reducedMotion ? 220 : 460,
          easing: "easeOutBack(2.3)",
          keyframes: [
            { translateY: -14, scale: 1.24, rotateZ: -1.5 },
            { translateY: 2, scale: 0.98, rotateZ: 0.5 },
            { translateY: 0, scale: 1, rotateZ: 0 },
          ],
        },
      },
      {
        offset: 85,
        step: {
          targets: segmentTarget,
          duration: reducedMotion ? 180 : 340,
          easing: "easeOutQuad",
          keyframes: [
            { translateY: 8, opacity: 1, letterSpacing: "0.18em" },
            { translateY: 0, opacity: 1, letterSpacing: "0.1em" },
          ],
        },
      },
    ],
    "signal-blink": () => [
      {
        offset: 0,
        step: {
          targets: rowNode,
          duration: reducedMotion ? 220 : 620,
          easing: "linear",
          keyframes: [
            { opacity: 0.76, translateX: -5 },
            { opacity: 1, translateX: 5 },
            { opacity: 0.84, translateX: -3 },
            { opacity: 1, translateX: 0 },
          ],
        },
      },
      {
        offset: 0,
        step: {
          targets: scoreTarget,
          duration: reducedMotion ? 200 : 520,
          easing: "linear",
          keyframes: [
            { scale: 1.18, translateX: heavyWobble, rotateZ: 1.5 },
            { scale: 0.98, translateX: -heavyWobble, rotateZ: -1.8 },
            { scale: 1.12, translateX: reducedMotion ? 2 : 7, rotateZ: 1.1 },
            { scale: 1, translateX: 0, rotateZ: 0 },
          ],
        },
      },
      {
        offset: 80,
        step: {
          targets: segmentTarget,
          duration: reducedMotion ? 180 : 400,
          easing: "linear",
          keyframes: [
            { translateX: reducedMotion ? -2 : -6, letterSpacing: "0.16em" },
            { translateX: reducedMotion ? 2 : 6, letterSpacing: "0.08em" },
            { translateX: 0, letterSpacing: "0.1em" },
          ],
        },
      },
    ],
    "stagger-wave": () => [
      {
        offset: 0,
        step: {
          targets: rowNode,
          duration: reducedMotion ? 280 : 720,
          easing: "easeOutQuart",
          keyframes: [
            { translateX: -14, rotateZ: -1.1, scale: 1.02 },
            { translateX: 10, rotateZ: 0.8, scale: 1.05 },
            { translateX: 0, rotateZ: 0 },
          ],
        },
      },
      {
        offset: 0,
        step: {
          targets: scoreTarget,
          duration: reducedMotion ? 220 : 420,
          easing: "easeOutBack(1.8)",
          keyframes: [
            { translateY: -10, scale: 1.2, rotateZ: -1 },
            { translateY: 0, scale: 1, rotateZ: 0 },
          ],
        },
      },
      {
        offset: 120,
        step: {
          targets: segmentTarget,
          duration: reducedMotion ? 220 : 400,
          easing: "easeOutBack(1.5)",
          keyframes: [
            { translateY: 7, scale: 1.12, letterSpacing: "0.16em" },
            { translateY: 0, scale: 1, letterSpacing: "0.1em" },
          ],
        },
      },
    ],
    "flip-edge": () => [
      {
        offset: 0,
        step: {
          targets: rowNode,
          duration: reducedMotion ? 300 : 860,
          easing: "easeOutExpo",
          keyframes: [
            { rotateY: spinY, scale: 1.08, translateZ: 0 },
            { rotateY: reducedMotion ? -8 : -36, scale: 0.98, translateY: 3 },
            { rotateY: 0, scale: 1, translateY: 0 },
          ],
        },
      },
      {
        offset: 45,
        step: {
          targets: scoreTarget,
          duration: reducedMotion ? 220 : 460,
          easing: "easeOutBack(2.1)",
          keyframes: [
            { scale: 1.18, translateY: -7, rotateZ: 1.2 },
            { scale: 1, translateY: 0, rotateZ: 0 },
          ],
        },
      },
      {
        offset: 90,
        step: {
          targets: segmentTarget,
          duration: reducedMotion ? 180 : 360,
          easing: "easeOutQuad",
          keyframes: [
            { letterSpacing: "0.18em", translateY: 4, opacity: 1 },
            { letterSpacing: "0.1em", translateY: 0, opacity: 1 },
          ],
        },
      },
    ],
    "outline-trace": () => [
      {
        offset: 0,
        step: {
          targets: rowNode,
          duration: reducedMotion ? 220 : 640,
          easing: "easeOutCubic",
          keyframes: [{ scale: 1.04, translateY: -2 }, { scale: 1, translateY: 0 }],
        },
      },
      {
        offset: 0,
        step: {
          targets: scoreTarget,
          duration: reducedMotion ? 220 : 420,
          easing: "easeOutQuad",
          keyframes: [
            { letterSpacing: "0.14em", scale: 1.18, translateY: -4 },
            { letterSpacing: "0em", scale: 1, translateY: 0 },
          ],
        },
      },
      {
        offset: 90,
        step: {
          targets: segmentTarget,
          duration: reducedMotion ? 180 : 340,
          easing: "easeOutQuad",
          keyframes: [
            { letterSpacing: "0.18em", opacity: 1, translateX: 8 },
            { letterSpacing: "0.04em", opacity: 1, translateX: 0 },
          ],
        },
      },
    ],
    "charge-release": () => [
      {
        offset: 0,
        step: {
          targets: rowNode,
          duration: reducedMotion ? 280 : 860,
          easing: "easeOutExpo",
          keyframes: [
            { scale: 0.94, translateY: 10 },
            { scale: 1.12, translateY: -10 },
            { scale: 1.03, translateY: 2 },
            { scale: 1, translateY: 0 },
          ],
        },
      },
      {
        offset: 60,
        step: {
          targets: scoreTarget,
          duration: reducedMotion ? 240 : 620,
          easing: "easeOutBack(2)",
          keyframes: [
            { scale: 1.32, translateY: -12, letterSpacing: "0.08em" },
            { scale: 0.98, translateY: 2, letterSpacing: "0.02em" },
            { scale: 1, translateY: 0, letterSpacing: "0em" },
          ],
        },
      },
      {
        offset: 130,
        step: {
          targets: segmentTarget,
          duration: reducedMotion ? 220 : 460,
          easing: "easeOutQuad",
          keyframes: [
            { scale: 1.16, translateY: -5, opacity: 1, letterSpacing: "0.18em" },
            { scale: 1, translateY: 0, opacity: 1, letterSpacing: "0.1em" },
          ],
        },
      },
    ],
    "alternate-flick": () => [
      {
        offset: 0,
        step: {
          targets: rowNode,
          duration: reducedMotion ? 260 : 720,
          easing: "easeOutQuart",
          keyframes: [
            { translateX: -13, rotateZ: -1.4, scale: 1.04 },
            { translateX: 10, rotateZ: 0.9, scale: 1.07 },
            { translateX: -5, rotateZ: -0.45, scale: 1.02 },
            { translateX: 0, rotateZ: 0 },
          ],
        },
      },
      {
        offset: 20,
        step: {
          targets: scoreTarget,
          duration: reducedMotion ? 220 : 480,
          easing: "easeOutBack(1.9)",
          keyframes: [
            { translateX: 8, scale: 1.2, rotateZ: 1.3 },
            { translateX: 0, scale: 1, rotateZ: 0 },
          ],
        },
      },
      {
        offset: 90,
        step: {
          targets: segmentTarget,
          duration: reducedMotion ? 200 : 420,
          easing: "easeOutBack(1.6)",
          keyframes: [
            { translateX: -10, opacity: 1, letterSpacing: "0.16em" },
            { translateX: 0, opacity: 1, letterSpacing: "0.1em" },
          ],
        },
      },
    ],
    default: () => [
      {
        offset: 0,
        step: {
          targets: rowNode,
          duration: baseDuration,
          easing: "easeOutBack(1.7)",
          keyframes: [{ scale: 1.075 }, { scale: 1 }],
        },
      },
      {
        offset: 0,
        step: {
          targets: scoreTarget,
          duration: 360,
          easing: "easeOutQuad",
          keyframes: [{ scale: 1.14 }, { scale: 1 }],
        },
      },
    ],
  };
  const style = String(context.animationStyle || "").trim().toLowerCase();
  const buildSteps = builders[style] || builders.default;
  return buildSteps();
}

function buildBurstTimeline(animeRef, context = {}) {
  if (typeof animeRef !== "function") {
    return null;
  }

  const rowNode = context.rowNode || null;
  if (!rowNode) {
    return null;
  }

  const timeline = createTimeline(animeRef);
  appendBurstTimelineSteps(timeline, getBurstTimelineSteps(context));

  if (typeof timeline.play === "function") {
    try {
      timeline.play();
    } catch (_) {
      // fail-soft
    }
  }

  return timeline;
}

function getRowBurstKey(rowNode, rowIndex) {
  const rowText = normalizeRawText(rowNode?.textContent || collectDescendantText(rowNode));
  if (!rowText) {
    return "";
  }
  return `${Number(rowIndex) || 0}|${rowText}`;
}

function startBurstAnimation(rowNode, options = {}) {
  const animeRef = options.animeRef || null;
  const activeAnimeByRow = options.activeAnimeByRow || null;
  const roleStateByRow = options.roleStateByRow || null;
  const reducedMotion = options.reducedMotion === true;

  stopRowAnimation(rowNode, {
    activeAnimeByRow,
    roleStateByRow,
    animeRef,
  });
  triggerAnimationReplay(rowNode);
  scheduleBurstTriggerReset(rowNode, {
    triggerResetTimersByRow: options.triggerResetTimersByRow || null,
    windowRef: options.windowRef || null,
    reducedMotion,
  });

  if (reducedMotion || typeof animeRef !== "function") {
    return false;
  }

  const roleState = roleStateByRow?.get?.(rowNode) || {};
  const timeline = buildBurstTimeline(animeRef, {
    rowNode,
    scoreNode: roleState.scoreNode || null,
    segmentNode: roleState.segmentNode || null,
    animationStyle: options.animationStyle,
    reducedMotion,
  });

  if (timeline && typeof activeAnimeByRow?.set === "function") {
    activeAnimeByRow.set(rowNode, timeline);
  }

  return Boolean(timeline);
}

export function applyHitDecoration(rowNode, options = {}) {
  const hitMeta = options.hitMeta || null;
  const featureConfig = options.featureConfig || {};
  const signatureByRow = options.signatureByRow || null;
  const burstKeyBySlot = options.burstKeyBySlot || null;
  const activeAnimeByRow = options.activeAnimeByRow || null;
  const roleStateByRow = options.roleStateByRow || null;
  const triggerResetTimersByRow = options.triggerResetTimersByRow || null;
  const rowIndex = Number(options.rowIndex) || 0;
  const windowRef = options.windowRef || null;
  const animeRef = options.animeRef || null;
  const rowText = normalizeRawText(options.rowText || rowNode?.textContent || "");

  if (!rowNode?.classList || !hitMeta) {
    return {
      applied: false,
      replayed: false,
      burst: false,
      idleLoopActive: false,
      kind: null,
      signature: "",
      burstKey: "",
      hasScoreRole: false,
      hasSegmentRole: false,
    };
  }

  const kindClassName = HIT_KIND_CLASS[hitMeta.kind];
  if (!kindClassName) {
    clearHitDecoration(rowNode, signatureByRow, {
      activeAnimeByRow,
      roleStateByRow,
      triggerResetTimersByRow,
      windowRef,
      animeRef,
    });
    return {
      applied: false,
      replayed: false,
      burst: false,
      idleLoopActive: false,
      kind: null,
      signature: "",
      burstKey: "",
      hasScoreRole: false,
      hasSegmentRole: false,
    };
  }

  const colorTheme = resolveColorTheme(featureConfig.colorTheme);
  const animationStyle = resolveAnimationStyle(featureConfig.animationStyle);
  const themeClassName = HIT_THEME_CLASS[colorTheme];
  const animationClassName = HIT_ANIMATION_CLASS[animationStyle];
  if (!themeClassName || !animationClassName) {
    clearHitDecoration(rowNode, signatureByRow, {
      activeAnimeByRow,
      roleStateByRow,
      triggerResetTimersByRow,
      windowRef,
      animeRef,
    });
    return {
      applied: false,
      replayed: false,
      burst: false,
      idleLoopActive: false,
      kind: null,
      signature: "",
      burstKey: "",
      hasScoreRole: false,
      hasSegmentRole: false,
    };
  }

  const reducedMotion = prefersReducedMotion(windowRef);
  const idleLoopActive = isLoopAnimationStyle(animationStyle) && !reducedMotion;
  const signature = [hitMeta.kind, hitMeta.segment, colorTheme, animationStyle].join("|");
  const burstKey = getRowBurstKey(rowNode, rowIndex) || `${rowIndex}|${rowText}`;
  const lastBurstKey = burstKeyBySlot?.get?.(rowIndex) || "";
  const burst = Boolean(burstKey) && burstKey !== lastBurstKey;

  rowNode.classList.add(HIT_BASE_CLASS);
  setExclusiveClass(rowNode, KIND_CLASS_NAMES, kindClassName);
  setExclusiveClass(rowNode, THEME_CLASS_NAMES, themeClassName);
  setExclusiveClass(rowNode, ANIMATION_CLASS_NAMES, animationClassName);
  rowNode.classList.toggle(HIT_IDLE_LOOP_CLASS, idleLoopActive);
  rowNode.style.setProperty("--ad-ext-hit-delay-ms", `${Math.max(0, Math.min(8, rowIndex)) * 65}ms`);
  rowNode.dataset.adExtHitSignature = signature;
  rowNode.dataset.adExtHitKind = hitMeta.kind;
  rowNode.dataset.adExtHitSegment = hitMeta.segment;
  rowNode.dataset.adExtHitTheme = colorTheme;
  rowNode.dataset.adExtHitAnimation = animationStyle;

  const textRoles = annotateHitTextRoles(rowNode, hitMeta, roleStateByRow);

  if (typeof signatureByRow?.set === "function") {
    signatureByRow.set(rowNode, signature);
  }

  if (typeof burstKeyBySlot?.set === "function" && burstKey) {
    burstKeyBySlot.set(rowIndex, burstKey);
    rowNode.dataset.adExtHitBurstKey = burstKey;
  }

  if (burst) {
    startBurstAnimation(rowNode, {
      animeRef,
      activeAnimeByRow,
      roleStateByRow,
      triggerResetTimersByRow,
      windowRef,
      animationStyle,
      reducedMotion,
    });
  }

  return {
    applied: true,
    replayed: burst,
    burst,
    idleLoopActive,
    kind: hitMeta.kind,
    signature,
    burstKey,
    hasScoreRole: Boolean(textRoles.scoreNode),
    hasSegmentRole: Boolean(textRoles.segmentNode),
  };
}

export function updateHitDecorations(options = {}) {
  const documentRef = options.documentRef;
  const featureConfig = options.featureConfig || {};
  const trackedRows = options.trackedRows || new Set();
  const signatureByRow = options.signatureByRow || new Map();
  const burstKeyBySlot = options.burstKeyBySlot || new Map();
  const activeAnimeByRow = options.activeAnimeByRow || new Map();
  const roleStateByRow = options.roleStateByRow || new Map();
  const triggerResetTimersByRow = options.triggerResetTimersByRow || null;
  const slotStateByIndex = options.slotStateByIndex || null;
  const includeRowDebug = options.debugRows === true;
  const animeRef = options.animeRef || null;
  const windowRef = options.windowRef || null;
  const turnSurface = getTurnSurfaceSnapshot(documentRef, {
    normalizeText: normalizeRawText,
  });
  const turnContainer = turnSurface.turnContainer;
  const turnPointsToken = turnSurface.turnPointsToken;
  const currentRows = turnSurface.throwRows.filter((rowNode) => {
    return Boolean(rowNode?.classList);
  });
  const currentRowSet = new Set(currentRows);
  const manualCorrectionActive =
    currentRows.some((rowNode) => rowHasCorrectionMarker(rowNode)) &&
    isManualCorrectionActive(documentRef, turnContainer);
  const stats = {
    rowCount: currentRows.length,
    decoratedCount: 0,
    replayedCount: 0,
    burstCount: 0,
    idleLoopCount: 0,
    removedCount: 0,
    staleCorrectionClearedCount: 0,
    transientCorrectionCount: 0,
    rowSource: turnSurface.rowSource,
    turnContainerFound: Boolean(turnContainer),
    turnPointsToken,
    kindCounts: {
      triple: 0,
      double: 0,
      bullInner: 0,
      bullOuter: 0,
    },
    rows: includeRowDebug ? [] : null,
  };

  trackedRows.forEach((rowNode) => {
    if (currentRowSet.has(rowNode)) {
      return;
    }
    const wasCleared = clearHitDecoration(rowNode, signatureByRow, {
      activeAnimeByRow,
      roleStateByRow,
      triggerResetTimersByRow,
      windowRef,
      animeRef,
    });
    trackedRows.delete(rowNode);
    if (wasCleared) {
      stats.removedCount += 1;
    }
  });

  const seenSlots = new Set();

  currentRows.forEach((rowNode, index) => {
    seenSlots.add(index);
    trackedRows.add(rowNode);
    const rowHasPendingCorrection = rowHasCorrectionMarker(rowNode);
    if (manualCorrectionActive && rowHasPendingCorrection) {
      if (typeof slotStateByIndex?.set === "function") {
        slotStateByIndex.set(index, {
          rowNode,
          lifecycleKey: getRowLifecycleKey(rowNode),
        });
      }
      stats.transientCorrectionCount += 1;
      if (includeRowDebug) {
        stats.rows.push({
          index,
          text: truncateDebugText(normalizeRawText(rowNode.textContent || "") || collectDescendantText(rowNode)),
          hit: "correction-pending",
          applied: false,
          replayed: false,
          burst: false,
          idle: false,
          scoreRole: false,
          segmentRole: false,
          signature: "",
        });
      }
      return;
    }

    if (rowHasPendingCorrection) {
      const clearedMarkerCount = clearRowCorrectionMarkers(rowNode);
      if (clearedMarkerCount > 0) {
        stats.staleCorrectionClearedCount += 1;
      }
    }

    const rowText = normalizeRawText(rowNode.textContent || "") || collectDescendantText(rowNode);
    reconcileRowSlotState(rowNode, {
      rowIndex: index,
      slotStateByIndex,
      signatureByRow,
      activeAnimeByRow,
      roleStateByRow,
      triggerResetTimersByRow,
      windowRef,
      animeRef,
    });
    const hitMeta = getHitMetaFromRow(rowNode);

    if (!hitMeta) {
      const wasCleared = clearHitDecoration(rowNode, signatureByRow, {
        activeAnimeByRow,
        roleStateByRow,
        triggerResetTimersByRow,
        windowRef,
        animeRef,
      });
      burstKeyBySlot.delete(index);
      if (wasCleared) {
        stats.removedCount += 1;
      }
      if (includeRowDebug) {
        stats.rows.push({
          index,
          text: truncateDebugText(rowText),
          hit: "none",
          applied: false,
          replayed: false,
          burst: false,
          idle: false,
          scoreRole: false,
          segmentRole: false,
          signature: "",
        });
      }
      return;
    }

    const applyResult = applyHitDecoration(rowNode, {
      hitMeta,
      featureConfig,
      signatureByRow,
      burstKeyBySlot,
      activeAnimeByRow,
      roleStateByRow,
      triggerResetTimersByRow,
      rowIndex: index,
      windowRef,
      animeRef,
      rowText,
    });

    if (includeRowDebug) {
      stats.rows.push({
        index,
        text: truncateDebugText(rowText),
        hit: `${hitMeta.kind}:${hitMeta.segment}`,
        applied: Boolean(applyResult?.applied),
        replayed: Boolean(applyResult?.replayed),
        burst: Boolean(applyResult?.burst),
        idle: Boolean(applyResult?.idleLoopActive),
        scoreRole: Boolean(applyResult?.hasScoreRole),
        segmentRole: Boolean(applyResult?.hasSegmentRole),
        signature: applyResult?.signature || "",
      });
    }

    if (!applyResult?.applied) {
      burstKeyBySlot.delete(index);
      return;
    }

    stats.decoratedCount += 1;
    if (applyResult.burst) {
      stats.burstCount += 1;
      stats.replayedCount += 1;
    }
    if (applyResult.idleLoopActive) {
      stats.idleLoopCount += 1;
    }
    if (stats.kindCounts[applyResult.kind] !== undefined) {
      stats.kindCounts[applyResult.kind] += 1;
    }
  });

  Array.from(burstKeyBySlot.keys()).forEach((slotIndex) => {
    if (!seenSlots.has(slotIndex)) {
      burstKeyBySlot.delete(slotIndex);
    }
  });

  if (typeof slotStateByIndex?.delete === "function") {
    Array.from(slotStateByIndex.keys()).forEach((slotIndex) => {
      if (!seenSlots.has(slotIndex)) {
        slotStateByIndex.delete(slotIndex);
      }
    });
  }

  return stats;
}
