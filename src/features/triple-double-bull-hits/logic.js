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

const TURN_CONTAINER_SELECTOR = "#ad-ext-turn";
const THROW_ROW_SELECTOR = ".ad-ext-turn-throw";
const TURN_POINTS_SELECTOR = ".ad-ext-turn-points";
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

const INNER_BULL_PATTERN = /(BULLSEYE|BULL|DB|D\s*25|D25)/i;
const OUTER_BULL_PATTERN = /(S\s*25|S25|SB|OB)/i;
const SINGLE_25_PATTERN = /\b25\b/;
const TRIPLE_PATTERN = /T\s*(\d{1,2})/gi;
const DOUBLE_PATTERN = /D\s*(\d{1,2})/gi;

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

function findTurnContainer(documentRef) {
  if (!documentRef || typeof documentRef.querySelector !== "function") {
    return null;
  }

  try {
    return documentRef.querySelector(TURN_CONTAINER_SELECTOR);
  } catch (_) {
    return null;
  }
}

function normalizeRawText(value) {
  return String(value || "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function truncateDebugText(value) {
  const text = normalizeRawText(value);
  if (text.length <= ROW_DEBUG_TEXT_LIMIT) {
    return text;
  }
  return `${text.slice(0, ROW_DEBUG_TEXT_LIMIT - 3)}...`;
}

function collectDescendantText(rootNode) {
  if (!rootNode || !Array.isArray(rootNode.children) || !rootNode.children.length) {
    return "";
  }

  const chunks = [];
  const queue = [...rootNode.children];

  while (queue.length) {
    const node = queue.shift();
    if (!node) {
      continue;
    }

    const text = normalizeRawText(node.textContent || "");
    if (text) {
      chunks.push(text);
    }

    if (Array.isArray(node.children) && node.children.length) {
      queue.push(...node.children);
    }
  }

  return normalizeRawText(chunks.join(" "));
}

function readTurnPointsToken(documentRef, turnContainer = null) {
  const scopedContainer = turnContainer || findTurnContainer(documentRef);
  const scopedPointsNode =
    scopedContainer && typeof scopedContainer.querySelector === "function"
      ? scopedContainer.querySelector(TURN_POINTS_SELECTOR)
      : null;

  if (scopedPointsNode) {
    return normalizeRawText(scopedPointsNode.textContent || "");
  }

  if (!documentRef || typeof documentRef.querySelector !== "function") {
    return "";
  }

  try {
    const fallbackPointsNode = documentRef.querySelector(TURN_POINTS_SELECTOR);
    return normalizeRawText(fallbackPointsNode?.textContent || "");
  } catch (_) {
    return "";
  }
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
  if (!rootNode || !Array.isArray(rootNode.children) || !rootNode.children.length) {
    return [];
  }

  const nodes = [];
  const queue = [...rootNode.children];
  while (queue.length) {
    const node = queue.shift();
    if (!node) {
      continue;
    }
    nodes.push(node);
    if (Array.isArray(node.children) && node.children.length) {
      queue.push(...node.children);
    }
  }
  return nodes;
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
    if (!candidate || !candidate.classList) {
      return;
    }
    const candidateText = normalizeRawText(candidate.textContent || "");
    if (!candidateText || !matcher(candidateText)) {
      return;
    }

    const depth = getNodeDepth(candidate, rowNode);
    const childCount = Array.isArray(candidate.children) ? candidate.children.length : 0;
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
  if (!node || !node.style) {
    return;
  }

  RESET_STYLE_PROPERTIES.forEach((propertyName) => {
    if (typeof node.style.removeProperty === "function") {
      node.style.removeProperty(propertyName);
    }
    const camelName = propertyName.replace(/-([a-z])/g, (_match, letter) => letter.toUpperCase());
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
    if (!node || !node.classList) {
      return;
    }
    node.classList.remove(HIT_SCORE_CLASS, HIT_SEGMENT_CLASS);
    clearInlineAnimationStyles(node);
  });

  roleStateByRow.delete(rowNode);
}

function annotateHitTextRoles(rowNode, hitMeta, roleStateByRow = null) {
  if (!rowNode || !rowNode.classList) {
    return {
      scoreNode: null,
      segmentNode: null,
    };
  }

  clearTextRoles(rowNode, roleStateByRow);

  const expectedScore = deriveHitScore(hitMeta);
  const expectedSegment = normalizeSegmentLabel(hitMeta?.segment || hitMeta?.label || "");

  const scoreNode = expectedScore
    ? findBestRoleNode(rowNode, (text) => normalizeRawText(text) === expectedScore)
    : null;
  const segmentNode = expectedSegment
    ? findBestRoleNode(rowNode, (text) => normalizeSegmentLabel(text) === expectedSegment)
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
  return SUPPORTED_COLOR_THEME.has(normalized) ? normalized : "champagne-night";
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
  const turnContainer = findTurnContainer(documentRef);
  if (turnContainer) {
    const scopedRows = collectBySelector(turnContainer, THROW_ROW_SELECTOR).filter((rowNode) => {
      return Boolean(rowNode && rowNode.classList);
    });

    const directRows = scopedRows.filter((rowNode) => rowNode.parentElement === turnContainer);
    if (directRows.length > 0) {
      return directRows;
    }
    if (scopedRows.length > 0) {
      return scopedRows;
    }
  }

  return collectBySelector(documentRef, THROW_ROW_SELECTOR).filter((rowNode) => {
    return Boolean(rowNode && rowNode.classList);
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
  if (!rowNode || !rowNode.classList) {
    return false;
  }

  const hasBaseClass = rowNode.classList.contains(HIT_BASE_CLASS);
  const hasSignatureAttribute =
    typeof rowNode.getAttribute === "function" &&
    Boolean(rowNode.getAttribute("data-ad-ext-hit-signature"));
  const hasTrackedSignature =
    signatureByRow &&
    typeof signatureByRow.has === "function" &&
    signatureByRow.has(rowNode);

  return hasBaseClass || hasSignatureAttribute || hasTrackedSignature;
}

function collectAnimationTargets(rowNode, roleStateByRow = null) {
  const roleState = roleStateByRow?.get?.(rowNode) || null;
  return [rowNode, roleState?.scoreNode || null, roleState?.segmentNode || null].filter(Boolean);
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

  if (activeAnimeByRow && typeof activeAnimeByRow.delete === "function") {
    activeAnimeByRow.delete(rowNode);
  }
}

export function clearHitDecoration(rowNode, signatureByRow = null, options = {}) {
  if (!rowNode || !rowNode.classList) {
    return false;
  }
  const hadDecoration = isRowDecorated(rowNode, signatureByRow);

  stopRowAnimation(rowNode, options);
  clearTextRoles(rowNode, options.roleStateByRow || null);

  rowNode.classList.remove(HIT_BASE_CLASS);
  rowNode.classList.remove(HIT_ANIMATION_TRIGGER_CLASS);
  rowNode.classList.remove(HIT_IDLE_LOOP_CLASS);
  rowNode.classList.remove(...KIND_CLASS_NAMES);
  rowNode.classList.remove(...THEME_CLASS_NAMES);
  rowNode.classList.remove(...ANIMATION_CLASS_NAMES);
  rowNode.style.removeProperty("--ad-ext-hit-delay-ms");
  rowNode.removeAttribute("data-ad-ext-hit-signature");
  rowNode.removeAttribute("data-ad-ext-hit-kind");
  rowNode.removeAttribute("data-ad-ext-hit-segment");
  rowNode.removeAttribute("data-ad-ext-hit-theme");
  rowNode.removeAttribute("data-ad-ext-hit-animation");
  rowNode.removeAttribute("data-ad-ext-hit-burst-key");

  if (signatureByRow && typeof signatureByRow.delete === "function") {
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

function buildBurstTimeline(animeRef, context = {}) {
  if (typeof animeRef !== "function") {
    return null;
  }

  const rowNode = context.rowNode || null;
  const scoreNode = context.scoreNode || null;
  const segmentNode = context.segmentNode || null;
  const animationStyle = String(context.animationStyle || "").trim().toLowerCase();
  if (!rowNode) {
    return null;
  }

  const timeline = createTimeline(animeRef);
  const baseDuration = context.reducedMotion ? 180 : 520;

  switch (animationStyle) {
    case "impact-pop":
      addTimelineStep(
        timeline,
        {
          targets: rowNode,
          duration: baseDuration,
          easing: "easeOutBack(1.7)",
          keyframes: [{ scale: 1.085 }, { scale: 1 }],
        },
        0
      );
      addTimelineStep(
        timeline,
        {
          targets: scoreNode || rowNode,
          duration: baseDuration - 80,
          easing: "easeOutBack(2.1)",
          keyframes: [{ scale: 1.18, translateY: -3 }, { scale: 1, translateY: 0 }],
        },
        0
      );
      addTimelineStep(
        timeline,
        {
          targets: segmentNode || rowNode,
          duration: 300,
          easing: "easeOutQuad",
          keyframes: [{ translateY: -4, opacity: 1 }, { translateY: 0, opacity: 1 }],
        },
        70
      );
      break;
    case "shockwave":
      addTimelineStep(
        timeline,
        {
          targets: rowNode,
          duration: 620,
          easing: "easeOutExpo",
          keyframes: [{ scale: 0.98 }, { scale: 1.065 }, { scale: 1 }],
        },
        0
      );
      addTimelineStep(
        timeline,
        {
          targets: scoreNode || rowNode,
          duration: 440,
          easing: "easeOutExpo",
          keyframes: [{ scale: 1.16, letterSpacing: "0.06em" }, { scale: 1, letterSpacing: "0em" }],
        },
        0
      );
      addTimelineStep(
        timeline,
        {
          targets: segmentNode || rowNode,
          duration: 360,
          easing: "easeOutQuad",
          keyframes: [{ scale: 1.08, opacity: 1 }, { scale: 1, opacity: 1 }],
        },
        90
      );
      break;
    case "sweep-shine":
      addTimelineStep(
        timeline,
        {
          targets: rowNode,
          duration: 580,
          easing: "easeOutCubic",
          keyframes: [{ translateX: -8 }, { translateX: 6 }, { translateX: 0 }],
        },
        0
      );
      addTimelineStep(
        timeline,
        {
          targets: scoreNode || rowNode,
          duration: 360,
          easing: "easeOutQuad",
          keyframes: [{ translateX: 10, scale: 1.12 }, { translateX: 0, scale: 1 }],
        },
        60
      );
      addTimelineStep(
        timeline,
        {
          targets: segmentNode || rowNode,
          duration: 300,
          easing: "easeOutQuad",
          keyframes: [{ translateX: 14, opacity: 1 }, { translateX: 0, opacity: 1 }],
        },
        110
      );
      break;
    case "neon-pulse":
      addTimelineStep(
        timeline,
        {
          targets: rowNode,
          duration: 640,
          easing: "easeOutExpo",
          keyframes: [{ scale: 1.03 }, { scale: 1 }],
        },
        0
      );
      addTimelineStep(
        timeline,
        {
          targets: scoreNode || rowNode,
          duration: 520,
          easing: "easeOutExpo",
          keyframes: [{ scale: 1.2, opacity: 1 }, { scale: 1, opacity: 1 }],
        },
        0
      );
      addTimelineStep(
        timeline,
        {
          targets: segmentNode || rowNode,
          duration: 460,
          easing: "easeOutSine",
          keyframes: [{ scale: 1.08, opacity: 1 }, { scale: 1, opacity: 1 }],
        },
        80
      );
      break;
    case "snap-bounce":
      addTimelineStep(
        timeline,
        {
          targets: rowNode,
          duration: 520,
          easing: "easeOutElastic(1, .55)",
          keyframes: [
            { translateY: -8, scale: 1.05 },
            { translateY: 2, scale: 0.985 },
            { translateY: 0, scale: 1 },
          ],
        },
        0
      );
      addTimelineStep(
        timeline,
        {
          targets: scoreNode || rowNode,
          duration: 380,
          easing: "easeOutBack(2.2)",
          keyframes: [{ translateY: -6, scale: 1.14 }, { translateY: 0, scale: 1 }],
        },
        0
      );
      break;
    case "card-slam":
      addTimelineStep(
        timeline,
        {
          targets: rowNode,
          duration: 500,
          easing: "easeOutCubic",
          keyframes: [
            { translateY: -12, scale: 1.035 },
            { translateY: 1, scale: 0.992 },
            { translateY: 0, scale: 1 },
          ],
        },
        0
      );
      addTimelineStep(
        timeline,
        {
          targets: scoreNode || rowNode,
          duration: 360,
          easing: "easeOutQuad",
          keyframes: [{ translateY: -10, scale: 1.14 }, { translateY: 0, scale: 1 }],
        },
        25
      );
      addTimelineStep(
        timeline,
        {
          targets: segmentNode || rowNode,
          duration: 300,
          easing: "easeOutQuad",
          keyframes: [{ translateY: 6, opacity: 1 }, { translateY: 0, opacity: 1 }],
        },
        85
      );
      break;
    case "signal-blink":
      addTimelineStep(
        timeline,
        {
          targets: rowNode,
          duration: 560,
          easing: "linear",
          keyframes: [{ opacity: 0.8 }, { opacity: 1 }, { opacity: 0.88 }, { opacity: 1 }],
        },
        0
      );
      addTimelineStep(
        timeline,
        {
          targets: scoreNode || rowNode,
          duration: 420,
          easing: "linear",
          keyframes: [{ scale: 1.14 }, { scale: 1 }, { scale: 1.08 }, { scale: 1 }],
        },
        0
      );
      break;
    case "stagger-wave":
      addTimelineStep(
        timeline,
        {
          targets: rowNode,
          duration: 660,
          easing: "easeOutQuart",
          keyframes: [
            { translateX: -10, rotateZ: -0.65 },
            { translateX: 6, rotateZ: 0.45 },
            { translateX: 0, rotateZ: 0 },
          ],
        },
        0
      );
      addTimelineStep(
        timeline,
        {
          targets: scoreNode || rowNode,
          duration: 360,
          easing: "easeOutBack(1.8)",
          keyframes: [{ translateY: -8, scale: 1.14 }, { translateY: 0, scale: 1 }],
        },
        0
      );
      addTimelineStep(
        timeline,
        {
          targets: segmentNode || rowNode,
          duration: 340,
          easing: "easeOutBack(1.5)",
          keyframes: [{ translateY: 6, scale: 1.08 }, { translateY: 0, scale: 1 }],
        },
        120
      );
      break;
    case "flip-edge":
      addTimelineStep(
        timeline,
        {
          targets: rowNode,
          duration: 620,
          easing: "easeOutBack(1.4)",
          keyframes: [
            { rotateY: 12, scale: 1.02 },
            { rotateY: -5, scale: 1.01 },
            { rotateY: 0, scale: 1 },
          ],
        },
        0
      );
      addTimelineStep(
        timeline,
        {
          targets: scoreNode || rowNode,
          duration: 380,
          easing: "easeOutQuad",
          keyframes: [{ scale: 1.12, translateY: -4 }, { scale: 1, translateY: 0 }],
        },
        45
      );
      break;
    case "outline-trace":
      addTimelineStep(
        timeline,
        {
          targets: rowNode,
          duration: 580,
          easing: "easeOutCubic",
          keyframes: [{ scale: 1.02 }, { scale: 1 }],
        },
        0
      );
      addTimelineStep(
        timeline,
        {
          targets: scoreNode || rowNode,
          duration: 360,
          easing: "easeOutQuad",
          keyframes: [{ letterSpacing: "0.08em", scale: 1.12 }, { letterSpacing: "0em", scale: 1 }],
        },
        0
      );
      addTimelineStep(
        timeline,
        {
          targets: segmentNode || rowNode,
          duration: 300,
          easing: "easeOutQuad",
          keyframes: [{ letterSpacing: "0.12em", opacity: 1 }, { letterSpacing: "0.04em", opacity: 1 }],
        },
        90
      );
      break;
    case "charge-release":
      addTimelineStep(
        timeline,
        {
          targets: rowNode,
          duration: 720,
          easing: "easeOutExpo",
          keyframes: [
            { scale: 0.985, translateY: 3 },
            { scale: 1.075, translateY: -5 },
            { scale: 1, translateY: 0 },
          ],
        },
        0
      );
      addTimelineStep(
        timeline,
        {
          targets: scoreNode || rowNode,
          duration: 520,
          easing: "easeOutBack(2)",
          keyframes: [{ scale: 1.24, translateY: -5 }, { scale: 1, translateY: 0 }],
        },
        60
      );
      addTimelineStep(
        timeline,
        {
          targets: segmentNode || rowNode,
          duration: 420,
          easing: "easeOutQuad",
          keyframes: [{ scale: 1.1, translateY: -2, opacity: 1 }, { scale: 1, translateY: 0, opacity: 1 }],
        },
        130
      );
      break;
    case "alternate-flick":
      addTimelineStep(
        timeline,
        {
          targets: rowNode,
          duration: 620,
          easing: "easeOutQuart",
          keyframes: [
            { translateX: -9, rotateZ: -0.8 },
            { translateX: 6, rotateZ: 0.55 },
            { translateX: -4, rotateZ: -0.35 },
            { translateX: 0, rotateZ: 0 },
          ],
        },
        0
      );
      addTimelineStep(
        timeline,
        {
          targets: scoreNode || rowNode,
          duration: 420,
          easing: "easeOutBack(1.9)",
          keyframes: [{ translateX: 5, scale: 1.14 }, { translateX: 0, scale: 1 }],
        },
        20
      );
      addTimelineStep(
        timeline,
        {
          targets: segmentNode || rowNode,
          duration: 380,
          easing: "easeOutBack(1.6)",
          keyframes: [{ translateX: -7, opacity: 1 }, { translateX: 0, opacity: 1 }],
        },
        90
      );
      break;
    default:
      addTimelineStep(
        timeline,
        {
          targets: rowNode,
          duration: baseDuration,
          easing: "easeOutBack(1.7)",
          keyframes: [{ scale: 1.075 }, { scale: 1 }],
        },
        0
      );
      addTimelineStep(
        timeline,
        {
          targets: scoreNode || rowNode,
          duration: 360,
          easing: "easeOutQuad",
          keyframes: [{ scale: 1.14 }, { scale: 1 }],
        },
        0
      );
      break;
  }

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

  if (timeline && activeAnimeByRow && typeof activeAnimeByRow.set === "function") {
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
  const rowIndex = Number(options.rowIndex) || 0;
  const windowRef = options.windowRef || null;
  const animeRef = options.animeRef || null;
  const rowText = normalizeRawText(options.rowText || rowNode?.textContent || "");

  if (!rowNode || !rowNode.classList || !hitMeta) {
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
  rowNode.classList.remove(...KIND_CLASS_NAMES);
  rowNode.classList.remove(...THEME_CLASS_NAMES);
  rowNode.classList.remove(...ANIMATION_CLASS_NAMES);
  rowNode.classList.add(kindClassName);
  rowNode.classList.add(themeClassName);
  rowNode.classList.add(animationClassName);
  rowNode.classList.toggle(HIT_IDLE_LOOP_CLASS, idleLoopActive);
  rowNode.style.setProperty("--ad-ext-hit-delay-ms", `${Math.max(0, Math.min(8, rowIndex)) * 65}ms`);
  rowNode.setAttribute("data-ad-ext-hit-signature", signature);
  rowNode.setAttribute("data-ad-ext-hit-kind", hitMeta.kind);
  rowNode.setAttribute("data-ad-ext-hit-segment", hitMeta.segment);
  rowNode.setAttribute("data-ad-ext-hit-theme", colorTheme);
  rowNode.setAttribute("data-ad-ext-hit-animation", animationStyle);

  const textRoles = annotateHitTextRoles(rowNode, hitMeta, roleStateByRow);

  if (signatureByRow && typeof signatureByRow.set === "function") {
    signatureByRow.set(rowNode, signature);
  }

  if (burstKeyBySlot && typeof burstKeyBySlot.set === "function" && burstKey) {
    burstKeyBySlot.set(rowIndex, burstKey);
    rowNode.setAttribute("data-ad-ext-hit-burst-key", burstKey);
  }

  if (burst) {
    startBurstAnimation(rowNode, {
      animeRef,
      activeAnimeByRow,
      roleStateByRow,
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
  const includeRowDebug = options.debugRows === true;
  const animeRef = options.animeRef || null;
  const windowRef = options.windowRef || null;
  const turnContainer = findTurnContainer(documentRef);
  const turnPointsToken = readTurnPointsToken(documentRef, turnContainer);

  const currentRows = collectThrowRows(documentRef);
  const currentRowSet = new Set(currentRows);
  const rowSource = turnContainer ? "turn-container" : currentRows.length > 0 ? "document-fallback" : "none";
  const stats = {
    rowCount: currentRows.length,
    decoratedCount: 0,
    replayedCount: 0,
    burstCount: 0,
    idleLoopCount: 0,
    removedCount: 0,
    rowSource,
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
    const rowText = normalizeRawText(rowNode.textContent || "") || collectDescendantText(rowNode);
    const hitMeta = getHitMetaFromRow(rowNode);

    if (!hitMeta) {
      const wasCleared = clearHitDecoration(rowNode, signatureByRow, {
        activeAnimeByRow,
        roleStateByRow,
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

  return stats;
}
