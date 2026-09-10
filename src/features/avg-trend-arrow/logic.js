import {
  ANIMATE_CLASS,
  ARROW_CLASS,
  DOWN_CLASS,
  UP_CLASS,
  VISIBLE_CLASS,
} from "./style.js";
import { readModernPlayerSurfaces } from "../shared/x01-match-surface.js";

export const AVG_SELECTOR = "p.css-1j0bqop";

function normalizeText(node) {
  return String(node?.textContent || "").replaceAll(/\s+/g, " ").trim();
}

function findModernLegAverageNode(cardNode) {
  const labels = Array.from(cardNode?.querySelectorAll?.("span") || []);
  for (const labelNode of labels) {
    if (normalizeText(labelNode).toLowerCase() !== "leg") {
      continue;
    }
    const rowNode = labelNode.parentElement;
    const valueNode = Array.from(rowNode?.children || []).find(
      (node) => node !== labelNode && /^\d+(?:[.,]\d+)?$/.test(normalizeText(node))
    );
    if (valueNode) {
      return valueNode;
    }
  }
  return null;
}

export function getAverageSurfaces(documentRef, windowRef = documentRef?.defaultView) {
  if (!documentRef || typeof documentRef.querySelectorAll !== "function") {
    return [];
  }

  const modernPlayers = readModernPlayerSurfaces(documentRef, windowRef);
  const modernSurfaces = modernPlayers
    .map(({ cardNode }) => ({
      averageNode: findModernLegAverageNode(cardNode),
      trackingNode: cardNode,
    }))
    .filter(({ averageNode }) => Boolean(averageNode));
  if (modernSurfaces.length) {
    return modernSurfaces;
  }

  return Array.from(documentRef.querySelectorAll(AVG_SELECTOR)).map((averageNode) => ({
    averageNode,
    trackingNode: averageNode,
  }));
}

export function parseAverageValue(text) {
  const raw = String(text || "").replaceAll(",", ".");
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

export function getAverageNodes(documentRef, windowRef = documentRef?.defaultView) {
  return getAverageSurfaces(documentRef, windowRef).map(({ averageNode }) => averageNode);
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
  const surfaces = getAverageSurfaces(options.documentRef, options.windowRef);
  const lastValueByNode = options.lastValueByNode;
  const arrowByAverageNode = options.arrowByAverageNode;
  const timeoutByArrow = options.timeoutByArrow;
  const arrowNodes = options.arrowNodes;
  const durationMs = Number(options.durationMs) || 320;

  if (!lastValueByNode || !arrowByAverageNode || !timeoutByArrow) {
    return;
  }

  arrowNodes?.forEach((arrowNode) => {
    if (arrowNode?.isConnected !== false) {
      return;
    }
    const timeout = timeoutByArrow.get(arrowNode);
    if (timeout) {
      clearTimeout(timeout);
      timeoutByArrow.delete(arrowNode);
    }
    arrowNodes.delete(arrowNode);
  });

  surfaces.forEach(({ averageNode, trackingNode }) => {
    const averageValue = parseAverageValue(averageNode?.textContent);
    if (!Number.isFinite(averageValue)) {
      return;
    }

    const previousValue = lastValueByNode.get(trackingNode);
    lastValueByNode.set(trackingNode, averageValue);
    if (!Number.isFinite(previousValue) || previousValue === averageValue) {
      return;
    }

    const arrow = ensureArrowNode(averageNode, arrowByAverageNode, arrowNodes);
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
