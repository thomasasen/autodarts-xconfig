import {
  collectTargetLabelsInNode as collectTargetLabelsInNodeLayout,
  hasExplicitMarkHints,
  resolveBadgeNode as resolveBadgeNodeLayout,
  resolveLabelCell as resolveLabelCellLayout,
} from "./label-layout.js";
import { getClassTokens, normalizeCricketLabelNode } from "./label-utils.js";

export const TURN_PREVIEW_ROOT_SELECTOR = "#ad-ext-turn";

export function queryAll(rootNode, selector) {
  if (!rootNode || typeof rootNode.querySelectorAll !== "function") {
    return [];
  }

  try {
    return Array.from(rootNode.querySelectorAll(selector));
  } catch (_) {
    return [];
  }
}

export function isNodeVisible(node) {
  if (!node || typeof node !== "object") {
    return false;
  }
  if (node.isConnected === false) {
    return false;
  }

  if (typeof node.getClientRects === "function" && node.getClientRects().length === 0) {
    return false;
  }

  const ownerWindow = node.ownerDocument?.defaultView;
  if (ownerWindow && typeof ownerWindow.getComputedStyle === "function") {
    const style = ownerWindow.getComputedStyle(node);
    if (!style) {
      return false;
    }
    if (
      style.display === "none" ||
      style.visibility === "hidden" ||
      String(style.opacity || "1") === "0"
    ) {
      return false;
    }
  }

  return true;
}

export function isInsideTurnPreview(node, selector = TURN_PREVIEW_ROOT_SELECTOR) {
  if (!node || typeof node.closest !== "function") {
    return false;
  }
  return Boolean(node.closest(String(selector || TURN_PREVIEW_ROOT_SELECTOR)));
}

export function filterAtomicLabelNodes(labelEntries, diagnostics = null) {
  const entries = Array.isArray(labelEntries) ? labelEntries : [];
  if (!entries.length) {
    if (diagnostics && typeof diagnostics === "object") {
      diagnostics.atomicLabelCount = 0;
      diagnostics.atomicUniqueLabelCount = 0;
      diagnostics.nestedLabelDropCount = 0;
      diagnostics.multiLabelContainerDropCount = 0;
    }
    return [];
  }

  let nestedLabelDropCount = 0;
  let multiLabelContainerDropCount = 0;

  const filtered = entries.filter((entry) => {
    const node = entry?.node;
    const label = entry?.label;
    if (!node || !label || typeof node.contains !== "function") {
      return false;
    }

    let hasSameLabelDescendant = false;
    const descendantLabels = new Set();

    entries.forEach((candidate) => {
      if (!candidate || candidate === entry || !candidate.node) {
        return;
      }
      if (!node.contains(candidate.node)) {
        return;
      }
      descendantLabels.add(candidate.label);
      if (candidate.label === label) {
        hasSameLabelDescendant = true;
      }
    });

    if (hasSameLabelDescendant) {
      nestedLabelDropCount += 1;
      return false;
    }
    if (descendantLabels.size > 1) {
      multiLabelContainerDropCount += 1;
      return false;
    }

    return true;
  });

  const resolved = filtered.length ? filtered : entries;
  if (diagnostics && typeof diagnostics === "object") {
    diagnostics.atomicLabelCount = resolved.length;
    diagnostics.atomicUniqueLabelCount = new Set(resolved.map((entry) => entry.label)).size;
    diagnostics.nestedLabelDropCount = nestedLabelDropCount;
    diagnostics.multiLabelContainerDropCount = multiLabelContainerDropCount;
  }

  return resolved;
}

function normalizeTargetSet(targetSet) {
  if (targetSet instanceof Set) {
    return targetSet;
  }
  return new Set(Array.isArray(targetSet) ? targetSet : []);
}

export function collectLabelNodes(
  rootNode,
  cricketRules,
  targetSet,
  selectors,
  diagnostics = null,
  options = {}
) {
  const selectorList = Array.isArray(selectors) ? selectors : [];
  const fallbackSelector = String(options.fallbackSelector || "").trim();
  const skipNode = typeof options.skipNode === "function" ? options.skipNode : () => false;
  const normalizedTargetSet = normalizeTargetSet(targetSet);
  const seen = new Set();
  const labels = [];
  const pushLabelNode = (node) => {
    if (!node || seen.has(node) || skipNode(node)) {
      return;
    }
    const label = normalizeCricketLabelNode(cricketRules, node);
    if (!label || (normalizedTargetSet.size > 0 && !normalizedTargetSet.has(label))) {
      return;
    }
    seen.add(node);
    labels.push({ node, label });
  };

  selectorList.forEach((selector) => {
    queryAll(rootNode, selector).forEach((node) => {
      pushLabelNode(node);
    });
  });

  if (diagnostics && typeof diagnostics === "object") {
    diagnostics.rawLabelCount = labels.length;
    diagnostics.rawUniqueLabelCount = new Set(labels.map((entry) => entry.label)).size;
  }

  const uniqueLabelCount = new Set(labels.map((entry) => entry.label)).size;
  if (fallbackSelector && uniqueLabelCount < 7) {
    queryAll(rootNode, fallbackSelector).forEach((node) => {
      pushLabelNode(node);
    });
    if (diagnostics && typeof diagnostics === "object") {
      diagnostics.rawLabelCount = labels.length;
      diagnostics.rawUniqueLabelCount = new Set(labels.map((entry) => entry.label)).size;
    }
  }

  return filterAtomicLabelNodes(labels, diagnostics);
}

export function collectTargetLabelsInNode(node, cricketRules, targetSet, fallbackLabel = "") {
  return collectTargetLabelsInNodeLayout({
    node,
    cricketRules,
    targetSet,
    fallbackLabel,
    queryAll,
  });
}

export function resolveLabelCell(
  labelNode,
  cricketRules = null,
  targetSet = null,
  fallbackLabel = ""
) {
  return resolveLabelCellLayout({
    labelNode,
    cricketRules,
    targetSet,
    fallbackLabel,
    isInsideTurnPreview,
    queryAll,
  });
}

export function resolveBadgeNode(labelNode, labelCell, cricketRules, label, options = {}) {
  return resolveBadgeNodeLayout({
    labelNode,
    labelCell,
    cricketRules,
    label,
    allowLabelNodeFallback: options.allowLabelNodeFallback === true,
    queryAll,
  });
}

export function hasAnyTargetDescendant(node, cricketRules, targetSet) {
  if (!node) {
    return false;
  }
  return collectTargetLabelsInNode(node, cricketRules, targetSet).size > 0;
}

export function isLikelyStructuralPlayerCell(node, labelNode, cricketRules, targetSet) {
  if (!node || !labelNode || node === labelNode || isInsideTurnPreview(node)) {
    return false;
  }
  if (node.parentElement !== labelNode.parentElement) {
    return false;
  }
  if (labelNode.tagName && node.tagName && labelNode.tagName !== node.tagName) {
    return false;
  }

  const siblingLabel = normalizeCricketLabelNode(cricketRules, node);
  if (siblingLabel && targetSet.has(siblingLabel)) {
    return false;
  }
  if (hasAnyTargetDescendant(node, cricketRules, targetSet)) {
    return false;
  }

  const labelClasses = new Set(getClassTokens(labelNode));
  const nodeClasses = getClassTokens(node);
  const hasSharedClass = nodeClasses.some((entry) => labelClasses.has(entry));
  const hasGeneratedCssToken = nodeClasses.some((entry) => /^css-[a-z0-9_-]+$/i.test(entry));
  if (!hasSharedClass && !hasGeneratedCssToken && !hasExplicitMarkHints(node)) {
    return false;
  }

  return true;
}

export function collectSiblingPlayerCells(labelNode, cricketRules, targetSet, isLikelyPlayerCell) {
  const result = [];
  let cursor = labelNode?.nextElementSibling || null;

  while (cursor) {
    const siblingLabel = normalizeCricketLabelNode(cricketRules, cursor);
    if (
      (siblingLabel && targetSet.has(siblingLabel)) ||
      (!siblingLabel && hasAnyTargetDescendant(cursor, cricketRules, targetSet))
    ) {
      break;
    }
    if (
      isLikelyPlayerCell(cursor, cricketRules, targetSet) ||
      isLikelyStructuralPlayerCell(cursor, labelNode, cricketRules, targetSet)
    ) {
      result.push(cursor);
    }
    cursor = cursor.nextElementSibling;
  }

  return result;
}
