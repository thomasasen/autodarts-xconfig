import { isNodeVisible, queryAll } from "./grid-discovery.js";

export const MODERN_CRICKET_GRID_SELECTOR = "main .grid";
export const CRICKET_SURFACE_OVERLAY_ATTRIBUTE = "data-ad-ext-cricket-surface-overlay";

// Native Cricket has one flat CSS grid: a header, then label/player cells.
// Read each row afresh so React replacements cannot retain stale cell owners.
export function readModernCricketGrid(documentRef) {
  for (const root of queryAll(documentRef, MODERN_CRICKET_GRID_SELECTOR)) {
    if (!isNodeVisible(root) || root.closest?.("#ad-xconfig-panel-host")) continue;
    const children = Array.from(root.children || []).filter(
      (node) => node.getAttribute?.(CRICKET_SURFACE_OVERLAY_ATTRIBUTE) !== "true"
    );
    const width = children.findIndex((node) => String(node.textContent || "").trim() === "20");
    if (width < 2 || width > 7 || children.length % width !== 0) continue;
    const headers = children.slice(1, width);
    if (!headers.every((node) => node.querySelector?.(".font-display"))) continue;
    const labels = [];
    const cellsByLabel = new Map();
    for (let offset = width; offset < children.length; offset += width) {
      const node = children[offset];
      const raw = String(node.textContent || "").trim();
      const label = raw === "B" ? "BULL" : raw;
      labels.push({ node, label });
      cellsByLabel.set(label, children.slice(offset + 1, offset + width));
    }
    const order = labels.map(({ label }) => label).join(",");
    if (order !== "20,19,18,17,16,15,BULL" &&
        order !== "20,19,18,17,16,15,14,13,12,11,10,BULL") continue;
    // The white dot identifies the local player, not whose turn it is.
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
  return null;
}
