import { HIT_BASE_CLASS, HIT_KIND_CLASS } from "./style.js";

const THROW_TEXT_SELECTORS = Object.freeze([
  ".ad-ext-turn-throw p.chakra-text",
  ".ad-ext-turn-throw p",
  ".ad-ext-turn-throw",
]);

const HIT_KIND_TO_CONFIG_KEY = Object.freeze({
  triple: "highlightTriple",
  double: "highlightDouble",
  bull: "highlightBull",
});

function collectBySelectors(documentRef, selectors) {
  if (!documentRef || typeof documentRef.querySelectorAll !== "function") {
    return [];
  }

  const result = [];
  const seen = new Set();

  selectors.forEach((selector) => {
    let nodes = [];
    try {
      nodes = Array.from(documentRef.querySelectorAll(selector));
    } catch (_) {
      nodes = [];
    }

    nodes.forEach((node) => {
      if (!node || seen.has(node)) {
        return;
      }
      seen.add(node);
      result.push(node);
    });
  });

  return result;
}

export function collectThrowTextNodes(documentRef) {
  return collectBySelectors(documentRef, THROW_TEXT_SELECTORS).filter((node) => {
    return typeof node.textContent === "string" && node.textContent.trim();
  });
}

export function getHitKindFromNode(node, x01Rules) {
  if (!node || !x01Rules || typeof x01Rules.getHighlightHitKind !== "function") {
    return null;
  }

  const rawText = String(node.textContent || "").trim();
  if (!rawText) {
    return null;
  }

  return x01Rules.getHighlightHitKind(rawText);
}

export function isKindEnabled(hitKind, featureConfig = {}) {
  if (!hitKind || !Object.prototype.hasOwnProperty.call(HIT_KIND_TO_CONFIG_KEY, hitKind)) {
    return false;
  }

  const key = HIT_KIND_TO_CONFIG_KEY[hitKind];
  return Boolean(featureConfig[key]);
}

export function clearHitDecoration(node) {
  if (!node || !node.classList) {
    return;
  }

  node.classList.remove(HIT_BASE_CLASS);
  node.classList.remove(HIT_KIND_CLASS.triple, HIT_KIND_CLASS.double, HIT_KIND_CLASS.bull);
}

export function applyHitDecoration(node, hitKind) {
  if (!node || !node.classList) {
    return;
  }

  const className = HIT_KIND_CLASS[hitKind];
  if (!className) {
    clearHitDecoration(node);
    return;
  }

  node.classList.add(HIT_BASE_CLASS);
  node.classList.remove(HIT_KIND_CLASS.triple, HIT_KIND_CLASS.double, HIT_KIND_CLASS.bull);
  node.classList.add(className);
}

export function updateHitDecorations(options = {}) {
  const documentRef = options.documentRef;
  const x01Rules = options.x01Rules;
  const featureConfig = options.featureConfig || {};
  const trackedNodes = options.trackedNodes || new Set();

  const currentNodes = new Set(collectThrowTextNodes(documentRef));
  trackedNodes.forEach((node) => {
    if (currentNodes.has(node)) {
      return;
    }
    clearHitDecoration(node);
    trackedNodes.delete(node);
  });

  currentNodes.forEach((node) => {
    trackedNodes.add(node);
    const hitKind = getHitKindFromNode(node, x01Rules);
    if (!hitKind || !isKindEnabled(hitKind, featureConfig)) {
      clearHitDecoration(node);
      return;
    }

    applyHitDecoration(node, hitKind);
  });
}
