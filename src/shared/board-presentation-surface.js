import { findBoardSvgRoot, NATIVE_BOARD_SELECTOR } from "./dartboard-svg.js";

// Additive presentation discovery: SVG geometry and gameplay selection stay unchanged.
export function findBoardPresentationSurface(documentRef) {
  const selectedSvg = findBoardSvgRoot(documentRef);
  const svg = selectedSvg?.isConnected !== false && documentRef?.contains?.(selectedSvg) ? selectedSvg : null;
  const candidates = Array.from(documentRef?.querySelectorAll?.(NATIVE_BOARD_SELECTOR) || []);
  const liveImage = (node) => Array.from(node?.querySelectorAll?.("img") || []).find((image) =>
    !image.getAttribute?.("data-adx-decoration") && !image.closest?.("[data-adx-decoration]"));
  const host = svg?.closest?.(NATIVE_BOARD_SELECTOR) || candidates.find((node) => node.isConnected !== false && liveImage(node));
  if (!host) return null;
  return { host, svg: svg?.closest?.(NATIVE_BOARD_SELECTOR) === host ? svg : null, image: liveImage(host) || null, frame: host.parentElement };
}
