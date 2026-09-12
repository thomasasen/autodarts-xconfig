import { isNodeVisible, queryAll } from "./grid-discovery.js";

export const MODERN_CRICKET_GRID_SELECTOR = "main .grid";
export const CRICKET_SURFACE_OVERLAY_ATTRIBUTE = "data-ad-ext-cricket-surface-overlay";
const ALLOWED_TARGET_ORDERS = Object.freeze([
  "20,19,18,17,16,15,BULL",
  "20,19,18,17,16,15,14,13,12,11,10,BULL",
]);

function normalizeLabel(node) {
  const raw = String(node?.textContent || "").trim();
  return raw === "B" ? "BULL" : raw;
}

function createSnapshot(root, headers, labelNodes, cellsByLabel) {
  const labels = labelNodes.map((node) => ({ node, label: normalizeLabel(node) }));
  const order = labels.map(({ label }) => label).join(",");
  if (!ALLOWED_TARGET_ORDERS.includes(order)) return null;
  const activeIndexes = headers.flatMap((header, index) =>
    header.classList?.contains("bg-raspberry-slush-diagonal") ? [index] : []);
  return {
    root, labels, cellsByLabel, headers,
    modern: true,
    activePlayerIndex: activeIndexes.length === 1 ? activeIndexes[0] : null,
    rowsWithPlayerCells: labels.length,
    coverage: 1,
  };
}

function readRowMajorGrid(root, children) {
  const width = children.findIndex((node) => normalizeLabel(node) === "20");
  if (width < 2 || width > 7 || children.length % width !== 0) return null;
  const headers = children.slice(1, width);
  if (!headers.every((node) => node.querySelector?.(".font-display"))) return null;
  const labelNodes = [];
  const cellsByLabel = new Map();
  for (let offset = width; offset < children.length; offset += width) {
    const labelNode = children[offset];
    const label = normalizeLabel(labelNode);
    labelNodes.push(labelNode);
    cellsByLabel.set(label, children.slice(offset + 1, offset + width));
  }
  return createSnapshot(root, headers, labelNodes, cellsByLabel);
}

function readColumnMajorGrid(root, children) {
  const targetCount = ALLOWED_TARGET_ORDERS.map((order) => order.split(",").length)
    .find((count) => children.length % (count + 1) === 0);
  if (!targetCount) return null;
  const columnHeight = targetCount + 1;
  const playerCount = children.length / columnHeight - 1;
  if (playerCount < 1 || playerCount > 6) return null;
  const labelNodes = children.slice(1, columnHeight);
  const headers = Array.from({ length: playerCount }, (_, index) =>
    children[columnHeight * (index + 1)]);
  if (!headers.every((node) => node.querySelector?.(".font-display"))) return null;
  const cellsByLabel = new Map(labelNodes.map((labelNode, labelIndex) => [
    normalizeLabel(labelNode),
    headers.map((_, playerIndex) => children[columnHeight * (playerIndex + 1) + labelIndex + 1]),
  ]));
  return createSnapshot(root, headers, labelNodes, cellsByLabel);
}

// Native Cricket and Tactics use flat grids with different row/column ordering.
// Rebuild ownership from current nodes so React replacements cannot retain stale cells.
export function readModernCricketGrid(documentRef) {
  for (const root of queryAll(documentRef, MODERN_CRICKET_GRID_SELECTOR)) {
    if (!isNodeVisible(root) || root.closest?.("#ad-xconfig-panel-host")) continue;
    const children = Array.from(root.children || []).filter(
      (node) => node.getAttribute?.(CRICKET_SURFACE_OVERLAY_ATTRIBUTE) !== "true"
    );
    const snapshot = readRowMajorGrid(root, children) || readColumnMajorGrid(root, children);
    if (snapshot) return snapshot;
  }
  return null;
}
