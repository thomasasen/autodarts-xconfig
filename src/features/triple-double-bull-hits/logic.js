import {
  HIT_ANIMATION_CLASS,
  HIT_ANIMATION_TRIGGER_CLASS,
  HIT_BASE_CLASS,
  HIT_KIND_CLASS,
  HIT_THEME_CLASS,
} from "./style.js";

const TURN_CONTAINER_SELECTOR = "#ad-ext-turn";
const THROW_ROW_SELECTOR = ".ad-ext-turn-throw";
const TURN_POINTS_SELECTOR = ".ad-ext-turn-points";
const ROW_DEBUG_TEXT_LIMIT = 72;
const SUPPORTED_COLOR_THEME = new Set(Object.keys(HIT_THEME_CLASS));
const SUPPORTED_ANIMATION_STYLE = new Set(Object.keys(HIT_ANIMATION_CLASS));
const KIND_CLASS_NAMES = Object.values(HIT_KIND_CLASS);
const THEME_CLASS_NAMES = Object.values(HIT_THEME_CLASS);
const ANIMATION_CLASS_NAMES = Object.values(HIT_ANIMATION_CLASS);

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

function resolveColorTheme(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return SUPPORTED_COLOR_THEME.has(normalized) ? normalized : "volt-lime";
}

function resolveAnimationStyle(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return SUPPORTED_ANIMATION_STYLE.has(normalized) ? normalized : "neon-pulse";
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

export function clearHitDecoration(rowNode, signatureByRow = null) {
  if (!rowNode || !rowNode.classList) {
    return false;
  }
  const hadDecoration = isRowDecorated(rowNode, signatureByRow);

  rowNode.classList.remove(HIT_BASE_CLASS);
  rowNode.classList.remove(HIT_ANIMATION_TRIGGER_CLASS);
  rowNode.classList.remove(...KIND_CLASS_NAMES);
  rowNode.classList.remove(...THEME_CLASS_NAMES);
  rowNode.classList.remove(...ANIMATION_CLASS_NAMES);
  rowNode.style.removeProperty("--ad-ext-hit-delay-ms");
  rowNode.removeAttribute("data-ad-ext-hit-signature");

  if (signatureByRow && typeof signatureByRow.delete === "function") {
    signatureByRow.delete(rowNode);
  }

  return hadDecoration;
}

function triggerAnimationReplay(rowNode) {
  rowNode.classList.remove(HIT_ANIMATION_TRIGGER_CLASS);

  // Force style flush so the class toggle restarts one-shot keyframes.
  if (typeof rowNode.getBoundingClientRect === "function") {
    rowNode.getBoundingClientRect();
  }

  rowNode.classList.add(HIT_ANIMATION_TRIGGER_CLASS);
}

export function applyHitDecoration(rowNode, options = {}) {
  const hitMeta = options.hitMeta || null;
  const featureConfig = options.featureConfig || {};
  const signatureByRow = options.signatureByRow || null;
  const rowIndex = Number(options.rowIndex) || 0;
  const turnPointsToken = normalizeRawText(options.turnPointsToken || "");

  if (!rowNode || !rowNode.classList || !hitMeta) {
    return {
      applied: false,
      replayed: false,
      kind: null,
      signature: "",
    };
  }

  const kindClassName = HIT_KIND_CLASS[hitMeta.kind];
  if (!kindClassName) {
    clearHitDecoration(rowNode, signatureByRow);
    return;
  }

  const colorTheme = resolveColorTheme(featureConfig.colorTheme);
  const animationStyle = resolveAnimationStyle(featureConfig.animationStyle);
  const themeClassName = HIT_THEME_CLASS[colorTheme];
  const animationClassName = HIT_ANIMATION_CLASS[animationStyle];
  if (!themeClassName || !animationClassName) {
    clearHitDecoration(rowNode, signatureByRow);
    return {
      applied: false,
      replayed: false,
      kind: null,
      signature: "",
    };
  }

  const signatureParts = [
    hitMeta.kind,
    hitMeta.segment,
    colorTheme,
    animationStyle,
  ];
  if (turnPointsToken) {
    signatureParts.push(`tp:${turnPointsToken}`);
  }
  const signature = signatureParts.join("|");

  rowNode.classList.add(HIT_BASE_CLASS);
  rowNode.classList.remove(...KIND_CLASS_NAMES);
  rowNode.classList.remove(...THEME_CLASS_NAMES);
  rowNode.classList.remove(...ANIMATION_CLASS_NAMES);
  rowNode.classList.add(kindClassName);
  rowNode.classList.add(themeClassName);
  rowNode.classList.add(animationClassName);
  rowNode.style.setProperty("--ad-ext-hit-delay-ms", `${Math.max(0, Math.min(8, rowIndex)) * 45}ms`);

  const lastSignature =
    signatureByRow && typeof signatureByRow.get === "function"
      ? signatureByRow.get(rowNode)
      : rowNode.getAttribute("data-ad-ext-hit-signature");

  const replayed = signature !== lastSignature;
  if (replayed) {
    triggerAnimationReplay(rowNode);
  }

  rowNode.setAttribute("data-ad-ext-hit-signature", signature);
  if (signatureByRow && typeof signatureByRow.set === "function") {
    signatureByRow.set(rowNode, signature);
  }

  return {
    applied: true,
    replayed,
    kind: hitMeta.kind,
    signature,
  };
}

export function updateHitDecorations(options = {}) {
  const documentRef = options.documentRef;
  const featureConfig = options.featureConfig || {};
  const trackedRows = options.trackedRows || new Set();
  const signatureByRow = options.signatureByRow || new Map();
  const includeRowDebug = options.debugRows === true;
  const turnContainer = findTurnContainer(documentRef);
  const turnPointsToken = readTurnPointsToken(documentRef, turnContainer);

  const currentRows = collectThrowRows(documentRef);
  const currentRowSet = new Set(currentRows);
  const rowSource = turnContainer ? "turn-container" : currentRows.length > 0 ? "document-fallback" : "none";
  const stats = {
    rowCount: currentRows.length,
    decoratedCount: 0,
    replayedCount: 0,
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
    const wasCleared = clearHitDecoration(rowNode, signatureByRow);
    trackedRows.delete(rowNode);
    if (wasCleared) {
      stats.removedCount += 1;
    }
  });

  currentRows.forEach((rowNode, index) => {
    trackedRows.add(rowNode);
    const rowText = normalizeRawText(rowNode.textContent || "");
    const hitMeta = getHitMetaFromRow(rowNode);

    if (!hitMeta) {
      const wasCleared = clearHitDecoration(rowNode, signatureByRow);
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
          signature: "",
        });
      }
      return;
    }

    const applyResult = applyHitDecoration(rowNode, {
      hitMeta,
      featureConfig,
      signatureByRow,
      rowIndex: index,
      turnPointsToken,
    });

    if (includeRowDebug) {
      stats.rows.push({
        index,
        text: truncateDebugText(rowText),
        hit: `${hitMeta.kind}:${hitMeta.segment}`,
        applied: Boolean(applyResult?.applied),
        replayed: Boolean(applyResult?.replayed),
        signature: applyResult?.signature || "",
      });
    }

    if (!applyResult?.applied) {
      return;
    }

    stats.decoratedCount += 1;
    if (applyResult.replayed) {
      stats.replayedCount += 1;
    }
    if (stats.kindCounts[applyResult.kind] !== undefined) {
      stats.kindCounts[applyResult.kind] += 1;
    }
  });

  return stats;
}
