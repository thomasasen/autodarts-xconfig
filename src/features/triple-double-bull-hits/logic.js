import {
  HIT_ANIMATION_CLASS,
  HIT_ANIMATION_TRIGGER_CLASS,
  HIT_BASE_CLASS,
  HIT_KIND_CLASS,
  HIT_THEME_CLASS,
} from "./style.js";

const THROW_ROW_SELECTOR = ".ad-ext-turn-throw";
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

function collectBySelector(documentRef, selector) {
  if (!documentRef || typeof documentRef.querySelectorAll !== "function") {
    return [];
  }

  try {
    return Array.from(documentRef.querySelectorAll(selector));
  } catch (_) {
    return [];
  }
}

function normalizeRawText(value) {
  return String(value || "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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

export function clearHitDecoration(rowNode, signatureByRow = null) {
  if (!rowNode || !rowNode.classList) {
    return;
  }

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

  if (!rowNode || !rowNode.classList || !hitMeta) {
    return;
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
  const signature = [
    hitMeta.kind,
    hitMeta.segment,
    colorTheme,
    animationStyle,
  ].join("|");

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

  if (signature !== lastSignature) {
    triggerAnimationReplay(rowNode);
  }

  rowNode.setAttribute("data-ad-ext-hit-signature", signature);
  if (signatureByRow && typeof signatureByRow.set === "function") {
    signatureByRow.set(rowNode, signature);
  }
}

export function updateHitDecorations(options = {}) {
  const documentRef = options.documentRef;
  const featureConfig = options.featureConfig || {};
  const trackedRows = options.trackedRows || new Set();
  const signatureByRow = options.signatureByRow || new Map();

  const currentRows = collectThrowRows(documentRef);
  const currentRowSet = new Set(currentRows);

  trackedRows.forEach((rowNode) => {
    if (currentRowSet.has(rowNode)) {
      return;
    }
    clearHitDecoration(rowNode, signatureByRow);
    trackedRows.delete(rowNode);
  });

  currentRows.forEach((rowNode, index) => {
    trackedRows.add(rowNode);
    const hitMeta = getHitMetaFromRow(rowNode);

    if (!hitMeta) {
      clearHitDecoration(rowNode, signatureByRow);
      return;
    }

    applyHitDecoration(rowNode, {
      hitMeta,
      featureConfig,
      signatureByRow,
      rowIndex: index,
    });
  });
}
