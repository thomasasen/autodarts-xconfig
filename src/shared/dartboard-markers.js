import { findBoardSvgGroup } from "./dartboard-svg.js";

const EXCLUDED_OVERLAY_SELECTOR =
  "#ad-ext-checkout-targets, #ad-ext-cricket-targets, #ad-ext-dart-image-overlay, #ad-ext-winner-fireworks";

function getClassName(node) {
  if (!node || !node.className) {
    return "";
  }
  if (typeof node.className === "string") {
    return node.className;
  }
  if (typeof node.className.baseVal === "string") {
    return node.className.baseVal;
  }
  return "";
}

function getDatasetKeys(node) {
  if (!node || !node.dataset || typeof node.dataset !== "object") {
    return "";
  }
  return Object.keys(node.dataset).join(" ").toLowerCase();
}

export function isLikelyBoardMarker(node) {
  if (!node || String(node.tagName || "").toLowerCase() !== "circle") {
    return false;
  }

  if (typeof node.closest === "function" && node.closest(EXCLUDED_OVERLAY_SELECTOR)) {
    return false;
  }

  const radius = Number.parseFloat(node.getAttribute?.("r"));
  if (!Number.isFinite(radius) || radius <= 0 || radius > 18) {
    return false;
  }

  const className = getClassName(node).toLowerCase();
  const styleAttr = String(node.getAttribute?.("style") || "").toLowerCase();
  const filterAttr = String(node.getAttribute?.("filter") || "").toLowerCase();
  const datasetKeys = getDatasetKeys(node);

  const markerLike =
    styleAttr.includes("shadow-2dp") ||
    filterAttr.includes("shadow") ||
    className.includes("dart") ||
    className.includes("marker") ||
    className.includes("hit") ||
    datasetKeys.includes("hit") ||
    datasetKeys.includes("marker");

  return markerLike;
}

export function collectBoardMarkers(documentRef, options = {}) {
  const board = options.board || findBoardSvgGroup(documentRef);
  const boardRoot = board?.svg || board?.group || null;
  if (!boardRoot || typeof boardRoot.querySelectorAll !== "function") {
    return [];
  }

  return Array.from(boardRoot.querySelectorAll("circle")).filter((node) => {
    return isLikelyBoardMarker(node);
  });
}

export function buildMarkerKey(node) {
  if (!node) {
    return "";
  }

  const cx = Number.parseFloat(node.getAttribute?.("cx"));
  const cy = Number.parseFloat(node.getAttribute?.("cy"));
  const r = Number.parseFloat(node.getAttribute?.("r"));

  return [
    Number.isFinite(cx) ? cx.toFixed(3) : "na",
    Number.isFinite(cy) ? cy.toFixed(3) : "na",
    Number.isFinite(r) ? r.toFixed(3) : "na",
  ].join("|");
}

export function readMarkerPosition(node) {
  if (!node) {
    return null;
  }

  const cx = Number.parseFloat(node.getAttribute?.("cx"));
  const cy = Number.parseFloat(node.getAttribute?.("cy"));
  if (!Number.isFinite(cx) || !Number.isFinite(cy)) {
    return null;
  }

  return { cx, cy };
}
