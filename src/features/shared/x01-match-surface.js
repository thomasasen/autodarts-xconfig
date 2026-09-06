// Native Autodarts match presentation. Keep host markup out of checkout rules.
export const MODERN_TURN_SELECTOR = "main .bg-surface-surface";
export const MODERN_PLAYER_SELECTOR = "main .overflow-clip";
export const MODERN_VARIANT_SELECTOR = "main .flex-wrap";
export const MODERN_MATCH_SEMANTIC_SELECTORS = Object.freeze([
  MODERN_TURN_SELECTOR,
  MODERN_PLAYER_SELECTOR,
  MODERN_VARIANT_SELECTOR,
]);

function text(node) {
  return String(node?.textContent || "").replaceAll(/\s+/g, " ").trim();
}

function all(root, selector) {
  return Array.from(root?.querySelectorAll?.(selector) || []);
}

export function isMatchNodeVisible(node, windowRef) {
  if (!node || node.isConnected === false) return false;
  const rect = node.getBoundingClientRect?.();
  if (!(rect?.width > 0 && rect?.height > 0)) return false;
  for (let current = node; current; current = current.parentElement) {
    const style = windowRef?.getComputedStyle?.(current);
    if (current.hidden || current.getAttribute?.("aria-hidden") === "true" ||
        style?.display === "none" || style?.visibility === "hidden" || style?.opacity === "0") {
      return false;
    }
  }
  return true;
}

export function findModernTurnSurface(documentRef, windowRef = documentRef?.defaultView) {
  for (const root of all(documentRef, MODERN_TURN_SELECTOR)) {
    const children = Array.from(root.children || []);
    if (children.length !== 2 || !isMatchNodeVisible(root, windowRef)) continue;
    const [slots, total] = children;
    const rows = Array.from(slots.children || []);
    if (rows.length !== 3 || !total.classList?.contains("font-number") ||
        !rows.every((row) => row.classList?.contains("font-number"))) continue;
    return { turnContainer: root, throwRows: rows, turnScoreNode: total, turnScoreToken: text(total) };
  }
  return null;
}

export function readModernMatchSurface(documentRef, windowRef = documentRef?.defaultView) {
  const turn = findModernTurnSurface(documentRef, windowRef);
  const headers = all(documentRef, MODERN_VARIANT_SELECTOR).filter((node) =>
    isMatchNodeVisible(node, windowRef));
  const header = headers.find((node) => Array.from(node.children || []).length >= 2 &&
    Array.from(node.children).every((badge) => badge.classList?.contains("rounded-full")));
  const badges = Array.from(header?.children || []);
  const variantText = text(badges[0]);
  const mode = badges.map(text).find((value) => /^(SI|DI|MI)-(SO|DO|MO)$/.test(value)) || "";
  const variant = mode && /^\d+$/.test(variantText) && Number(variantText) >= 2
    ? "X01" : variantText;
  const outMode = ({ SO: "Straight Out", DO: "Double Out", MO: "Master Out" })[mode.slice(-2)] || "";
  const cards = all(documentRef, MODERN_PLAYER_SELECTOR).filter((node) =>
    node.querySelector?.('[role="button"]') && isMatchNodeVisible(node, windowRef));
  const activeCards = cards.filter((node) => all(node, ".bg-mono-white.rounded-full").some((marker) =>
    isMatchNodeVisible(marker, windowRef)));
  // Ambiguous players must never fall back to a random score on the page.
  const card = activeCards.length === 1 ? activeCards[0] : null;
  const scores = all(card, ".font-number.overflow-hidden").filter((node) =>
    /^\d+$/.test(text(node)) && isMatchNodeVisible(node, windowRef));
  const scoreNode = scores.length === 1 ? scores[0] : null;
  return {
    ...turn,
    variantNode: header || null,
    variant,
    outMode,
    playerCard: card,
    playerKey: card ? `${cards.indexOf(card)}:${text(card.querySelector('[role="button"]'))}` : "",
    scoreNode,
    activeScore: scoreNode ? Number(text(scoreNode)) : Number.NaN,
  };
}

export function readModernThrows(surface, x01Rules) {
  const throws = [];
  for (const row of surface?.throwRows || []) {
    if (row.classList?.contains("text-checkout-suggestion")) break;
    // The hidden placeholder icon is not a throw; only read its visible text sibling.
    const label = Array.from(row.children || []).find((node) =>
      node.getAttribute?.("aria-hidden") !== "true" && text(node));
    const token = text(label).replaceAll(" ", "").toUpperCase();
    if (!token) break;
    const normalized = x01Rules?.normalizeSegmentName?.(token) || token;
    const parsed = x01Rules?.parseSegment?.(normalized);
    if (!parsed && token !== "0" && token !== "MISS") return null;
    throws.push({ segment: { name: parsed ? normalized : "MISS" }, score: parsed?.score || 0 });
  }
  return throws;
}
