import {
  ANIMATE_CLASS,
  ARROW_CLASS,
  DOWN_CLASS,
  UP_CLASS,
  VISIBLE_CLASS,
} from "./style.js";

export const AVG_SELECTOR = "p.css-1j0bqop";

export function parseAverageValue(text) {
  const raw = String(text || "");
  if (!raw.trim()) {
    return null;
  }

  const pairedMatch = /(\d+(?:\.\d+)?)\s*\/\s*\d+(?:\.\d+)?/.exec(raw);
  if (pairedMatch) {
    return Number(pairedMatch[1]);
  }

  const fallbackMatch = /(\d+(?:\.\d+)?)/.exec(raw);
  if (!fallbackMatch) {
    return null;
  }

  const numeric = Number(fallbackMatch[1]);
  return Number.isFinite(numeric) ? numeric : null;
}

export function getAverageNodes(documentRef) {
  if (!documentRef || typeof documentRef.querySelectorAll !== "function") {
    return [];
  }
  return Array.from(documentRef.querySelectorAll(AVG_SELECTOR));
}

export function ensureArrowNode(avgNode, arrowByAverageNode, arrowNodes = null) {
  const existing = arrowByAverageNode.get(avgNode);
  if (existing && typeof avgNode.contains === "function" && avgNode.contains(existing)) {
    return existing;
  }

  const ownerDocument = avgNode?.ownerDocument || null;
  if (!ownerDocument || typeof ownerDocument.createElement !== "function") {
    return null;
  }

  const arrow = ownerDocument.createElement("span");
  arrow.className = ARROW_CLASS;
  if (typeof avgNode.appendChild === "function") {
    avgNode.appendChild(arrow);
  }
  arrowByAverageNode.set(avgNode, arrow);
  if (arrowNodes && typeof arrowNodes.add === "function") {
    arrowNodes.add(arrow);
  }
  return arrow;
}

function forceAnimationReflow(node) {
  if (!node) {
    return 0;
  }

  if (Number.isFinite(node.offsetWidth)) {
    return node.offsetWidth;
  }

  return Number(node.getBoundingClientRect?.().width || 0);
}

export function animateArrowNode(arrowNode, durationMs, timeoutByArrow) {
  if (!arrowNode?.classList) {
    return;
  }

  arrowNode.classList.remove(ANIMATE_CLASS);
  forceAnimationReflow(arrowNode);
  arrowNode.classList.add(ANIMATE_CLASS);

  const previousTimeout = timeoutByArrow.get(arrowNode);
  if (previousTimeout) {
    clearTimeout(previousTimeout);
  }

  const timeout = setTimeout(() => {
    arrowNode.classList.remove(ANIMATE_CLASS);
    timeoutByArrow.delete(arrowNode);
  }, Number(durationMs) + 80);

  timeoutByArrow.set(arrowNode, timeout);
}

export function updateAvgTrendArrows(options = {}) {
  const nodes = getAverageNodes(options.documentRef);
  const lastValueByNode = options.lastValueByNode;
  const arrowByAverageNode = options.arrowByAverageNode;
  const timeoutByArrow = options.timeoutByArrow;
  const arrowNodes = options.arrowNodes;
  const durationMs = Number(options.durationMs) || 320;

  if (!lastValueByNode || !arrowByAverageNode || !timeoutByArrow) {
    return;
  }

  nodes.forEach((node) => {
    const averageValue = parseAverageValue(node?.textContent);
    if (!Number.isFinite(averageValue)) {
      return;
    }

    const previousValue = lastValueByNode.get(node);
    lastValueByNode.set(node, averageValue);
    if (!Number.isFinite(previousValue) || previousValue === averageValue) {
      return;
    }

    const arrow = ensureArrowNode(node, arrowByAverageNode, arrowNodes);
    if (!arrow?.classList) {
      return;
    }

    arrow.classList.remove(UP_CLASS, DOWN_CLASS);
    arrow.classList.add(
      VISIBLE_CLASS,
      averageValue > previousValue ? UP_CLASS : DOWN_CLASS
    );
    animateArrowNode(arrow, durationMs, timeoutByArrow);
  });
}
