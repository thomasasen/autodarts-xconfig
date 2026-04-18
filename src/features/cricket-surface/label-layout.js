import {
  getClassTokens,
  normalizeCricketLabelNode,
  normalizeCricketLabelValue,
} from "./label-utils.js";

function queryAllFallback(rootNode, selector) {
  if (!rootNode || typeof rootNode.querySelectorAll !== "function") {
    return [];
  }

  try {
    return Array.from(rootNode.querySelectorAll(selector));
  } catch (_) {
    return [];
  }
}

function getElementRect(element) {
  if (!element || typeof element.getBoundingClientRect !== "function") {
    return null;
  }
  return element.getBoundingClientRect();
}

function isDecoratableBadgeNode(badgeNode, labelCell, cricketRules, label) {
  if (!badgeNode || !labelCell || badgeNode === labelCell) {
    return false;
  }

  const normalizedLabel = normalizeCricketLabelNode(cricketRules, badgeNode);
  if (!normalizedLabel || normalizedLabel !== label) {
    return false;
  }

  const compactText = String(badgeNode.textContent || "").trim().length <= 12;
  const directChild = badgeNode.parentElement === labelCell || labelCell.contains(badgeNode);
  if (!compactText || !directChild) {
    return false;
  }

  const badgeRect = getElementRect(badgeNode);
  const cellRect = getElementRect(labelCell);
  if (!badgeRect || !cellRect) {
    return true;
  }

  if (
    !Number.isFinite(badgeRect.width) ||
    !Number.isFinite(badgeRect.height) ||
    !Number.isFinite(cellRect.width) ||
    !Number.isFinite(cellRect.height)
  ) {
    return true;
  }

  if (
    badgeRect.width <= 0 ||
    badgeRect.height <= 0 ||
    cellRect.width <= 0 ||
    cellRect.height <= 0
  ) {
    return false;
  }

  return badgeRect.width < cellRect.width * 0.78 && badgeRect.height < cellRect.height * 0.9;
}

export function hasExplicitMarkHints(node) {
  if (!node || typeof node !== "object") {
    return false;
  }

  const dataset = node.dataset;
  if (
    dataset?.marks !== undefined ||
    dataset?.mark !== undefined ||
    dataset?.hits !== undefined ||
    dataset?.hit !== undefined
  ) {
    return true;
  }

  if (typeof node.querySelector === "function") {
    if (node.querySelector("img[alt], [data-marks], [data-mark], [data-hits], [data-hit]")) {
      return true;
    }
    if (node.querySelector("svg[aria-label], svg[title], svg[alt]")) {
      return true;
    }
  }

  return false;
}

export function hasPeerLikeSibling(node) {
  if (!node || typeof node !== "object") {
    return false;
  }

  const nodeTag = String(node.tagName || "").toUpperCase();
  const nodeClassTokens = new Set(getClassTokens(node));
  const siblings = [node.previousElementSibling, node.nextElementSibling].filter(Boolean);
  if (!siblings.length) {
    return false;
  }

  return siblings.some((sibling) => {
    if (!sibling) {
      return false;
    }
    const siblingTag = String(sibling.tagName || "").toUpperCase();
    if (nodeTag && siblingTag && siblingTag === nodeTag) {
      return true;
    }
    const siblingClassTokens = getClassTokens(sibling);
    if (!nodeClassTokens.size || !siblingClassTokens.length) {
      return false;
    }
    return siblingClassTokens.some((token) => nodeClassTokens.has(token));
  });
}

export function collectTargetLabelsInNode(options = {}) {
  const {
    node,
    cricketRules,
    targetSet,
    fallbackLabel = "",
    queryAll = queryAllFallback,
  } = options;
  const labels = new Set();
  if (!node || !cricketRules || typeof cricketRules.normalizeCricketLabel !== "function") {
    return labels;
  }

  const candidates = [node];
  queryAll(
    node,
    "[data-row-label], [data-target-label], .label-cell, .ad-ext-crfx-badge, .chakra-text, p, span, strong, b"
  ).forEach((candidate) => {
    if (!candidates.includes(candidate)) {
      candidates.push(candidate);
    }
  });

  candidates.forEach((candidate) => {
    const normalized = normalizeCricketLabelNode(cricketRules, candidate);
    if (!normalized) {
      return;
    }
    if (targetSet instanceof Set && targetSet.size > 0 && !targetSet.has(normalized)) {
      return;
    }
    labels.add(normalized);
  });

  const normalizedFallback = normalizeCricketLabelValue(cricketRules, fallbackLabel);
  if (normalizedFallback) {
    labels.add(normalizedFallback);
  }

  return labels;
}

export function resolveLabelCell(options = {}) {
  const {
    labelNode,
    cricketRules = null,
    targetSet = null,
    fallbackLabel = "",
    isInsideTurnPreview = () => false,
    queryAll = queryAllFallback,
  } = options;
  if (!labelNode || typeof labelNode.closest !== "function") {
    return labelNode?.parentElement || null;
  }

  const tableCell = labelNode.closest("td, th, [role='cell']");
  if (tableCell) {
    return tableCell;
  }

  const normalizedLabel = normalizeCricketLabelValue(
    cricketRules,
    fallbackLabel || labelNode?.dataset?.rowLabel || labelNode?.textContent || ""
  );

  let cursor = labelNode?.parentElement || null;
  let fallback = labelNode?.parentElement || labelNode;
  let depth = 0;

  while (cursor && depth < 8) {
    fallback = cursor;
    if (!isInsideTurnPreview(cursor)) {
      const parent = cursor.parentElement || null;
      const hasSiblings = Boolean(parent && parent.children && parent.children.length > 1);
      if (hasSiblings) {
        const hasCellPeer = hasPeerLikeSibling(cursor);
        if (!hasCellPeer && !hasExplicitMarkHints(cursor)) {
          cursor = cursor.parentElement;
          depth += 1;
          continue;
        }
        const labels = collectTargetLabelsInNode({
          node: cursor,
          cricketRules,
          targetSet,
          fallbackLabel: normalizedLabel,
          queryAll,
        });
        const containsOnlyOwnLabel =
          labels.size <= 1 ||
          (labels.size === 2 &&
            normalizedLabel &&
            labels.has(normalizedLabel));
        if (containsOnlyOwnLabel) {
          return cursor;
        }
      }
    }
    cursor = cursor.parentElement;
    depth += 1;
  }

  return fallback || labelNode;
}

export function resolveBadgeNode(options = {}) {
  const {
    labelNode,
    labelCell,
    cricketRules,
    label,
    allowLabelNodeFallback = false,
    queryAll = queryAllFallback,
  } = options;
  if (!labelCell) {
    return null;
  }

  if (
    labelNode &&
    labelNode !== labelCell &&
    (
      isDecoratableBadgeNode(labelNode, labelCell, cricketRules, label) ||
      (
        allowLabelNodeFallback &&
        normalizeCricketLabelNode(cricketRules, labelNode) === label
      )
    )
  ) {
    return labelNode;
  }

  const candidates = [];
  queryAll(
    labelCell,
    ".ad-ext-crfx-badge, .chakra-text, [data-row-label], [data-target-label], p, span, strong, b"
  ).forEach((candidate) => {
    if (!candidates.includes(candidate)) {
      candidates.push(candidate);
    }
  });

  return (
    candidates.find((candidate) => {
      return isDecoratableBadgeNode(candidate, labelCell, cricketRules, label);
    }) || null
  );
}
